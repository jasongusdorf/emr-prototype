/* ============================================================
   views/risk-stratification.js — Risk Stratification
   Hospital readmission, Charlson, Fall, Cardiovascular risk
   ============================================================ */

/* ---------- Risk Score Definitions ---------- */

var RISK_CATEGORIES = [
  { id: 'readmission', name: 'Hospital Readmission', description: 'Based on age, diagnoses, medications, recent ED visits, and social determinants.' },
  { id: 'mortality', name: 'Charlson Comorbidity (Mortality)', description: 'Charlson Comorbidity Index predicting 10-year mortality.' },
  { id: 'fall', name: 'Fall Risk', description: 'Based on age, medications, diagnoses, and mobility factors.' },
  { id: 'cardiovascular', name: 'Cardiovascular (ASCVD)', description: 'Framingham/ASCVD-style risk based on age, sex, BP, cholesterol, smoking, and diabetes.' }
];

/* ---------- Score Calculators ---------- */

function _riskCalcAge(patient) {
  if (!patient.dob) return 0;
  var d = new Date(patient.dob + 'T00:00:00');
  if (isNaN(d)) return 0;
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function _riskHasDx(patient, terms) {
  var problems = getActiveProblems(patient.id);
  return problems.some(function(prob) {
    var name = (prob.name || '').toLowerCase();
    var icd = (prob.icd10 || '').toLowerCase();
    return terms.some(function(t) {
      var tl = t.toLowerCase();
      return name.indexOf(tl) >= 0 || icd.indexOf(tl) >= 0;
    });
  });
}

function _riskMedCount(patient) {
  return getPatientMedications(patient.id).length;
}

function _riskDxCount(patient) {
  return getActiveProblems(patient.id).length;
}

function _riskRecentVisits(patient, days) {
  var encounters = typeof getEncountersByPatient === 'function'
    ? getEncountersByPatient(patient.id)
    : getEncounters().filter(function(e) { return e.patientId === patient.id; });
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return encounters.filter(function(e) {
    return new Date(e.dateTime || e.createdAt) >= cutoff;
  }).length;
}

function _riskIsSmoker(patient) {
  var sh = getSocialHistory(patient.id);
  if (!sh) return false;
  var status = (sh.smokingStatus || '').toLowerCase();
  return status.indexOf('current') >= 0 || status.indexOf('yes') >= 0 || status.indexOf('active') >= 0;
}

/* --- Readmission Risk (0-100 score) --- */
function _riskCalcReadmission(patient) {
  var score = 0;
  var age = _riskCalcAge(patient);

  // Age factor
  if (age >= 80) score += 25;
  else if (age >= 70) score += 20;
  else if (age >= 60) score += 15;
  else if (age >= 50) score += 10;

  // Number of diagnoses
  var dxCount = _riskDxCount(patient);
  if (dxCount >= 10) score += 20;
  else if (dxCount >= 6) score += 15;
  else if (dxCount >= 3) score += 10;
  else if (dxCount >= 1) score += 5;

  // Number of medications
  var medCount = _riskMedCount(patient);
  if (medCount >= 10) score += 15;
  else if (medCount >= 6) score += 10;
  else if (medCount >= 3) score += 5;

  // Recent visits (30 days)
  var recentVisits = _riskRecentVisits(patient, 30);
  if (recentVisits >= 3) score += 15;
  else if (recentVisits >= 2) score += 10;
  else if (recentVisits >= 1) score += 5;

  // Key conditions
  if (_riskHasDx(patient, ['heart failure', 'chf', 'i50'])) score += 10;
  if (_riskHasDx(patient, ['copd', 'j44'])) score += 8;
  if (_riskHasDx(patient, ['diabetes', 'e11', 'e10'])) score += 5;
  if (_riskHasDx(patient, ['depression', 'anxiety', 'f32', 'f41'])) score += 5;

  // Social determinants
  var sh = getSocialHistory(patient.id);
  if (sh) {
    if ((sh.livingSituation || '').toLowerCase().indexOf('alone') >= 0) score += 5;
    if ((sh.substanceUse || '').toLowerCase().indexOf('active') >= 0 || (sh.substanceUse || '').toLowerCase().indexOf('yes') >= 0) score += 5;
  }

  return Math.min(score, 100);
}

/* --- Charlson Comorbidity Index (0-37) --- */
function _riskCalcCharlson(patient) {
  var score = 0;
  var age = _riskCalcAge(patient);

  // Age component
  if (age >= 80) score += 4;
  else if (age >= 70) score += 3;
  else if (age >= 60) score += 2;
  else if (age >= 50) score += 1;

  // 1-point conditions
  if (_riskHasDx(patient, ['myocardial infarction', 'mi', 'heart attack', 'i21', 'i22'])) score += 1;
  if (_riskHasDx(patient, ['heart failure', 'chf', 'congestive heart', 'i50'])) score += 1;
  if (_riskHasDx(patient, ['peripheral vascular', 'pvd', 'pad', 'i73', 'i70'])) score += 1;
  if (_riskHasDx(patient, ['cerebrovascular', 'stroke', 'cva', 'tia', 'i63', 'i64', 'g45'])) score += 1;
  if (_riskHasDx(patient, ['dementia', 'alzheimer', 'f00', 'f01', 'f02', 'f03', 'g30'])) score += 1;
  if (_riskHasDx(patient, ['copd', 'chronic obstructive', 'emphysema', 'j44', 'j43'])) score += 1;
  if (_riskHasDx(patient, ['rheumatoid', 'lupus', 'sle', 'connective tissue', 'm05', 'm06', 'm32'])) score += 1;
  if (_riskHasDx(patient, ['peptic ulcer', 'k25', 'k26', 'k27'])) score += 1;

  // Liver disease
  if (_riskHasDx(patient, ['cirrhosis', 'hepatic failure', 'liver failure', 'k74', 'k72'])) score += 3;
  else if (_riskHasDx(patient, ['liver disease', 'hepatitis', 'fatty liver', 'k70', 'k73', 'k76'])) score += 1;

  // Diabetes
  if (_riskHasDx(patient, ['diabetic nephropathy', 'diabetic retinopathy', 'diabetic neuropathy'])) score += 2;
  else if (_riskHasDx(patient, ['diabetes', 'e11', 'e10'])) score += 1;

  // 2-point conditions
  if (_riskHasDx(patient, ['hemiplegia', 'paraplegia', 'g81', 'g82'])) score += 2;
  if (_riskHasDx(patient, ['chronic kidney', 'ckd', 'renal disease', 'n18'])) score += 2;

  // Cancer
  if (_riskHasDx(patient, ['metastatic', 'c77', 'c78', 'c79'])) score += 6;
  else if (_riskHasDx(patient, ['cancer', 'malignant', 'neoplasm', 'leukemia', 'lymphoma'])) score += 2;

  // AIDS
  if (_riskHasDx(patient, ['aids', 'hiv', 'b20'])) score += 6;

  return score;
}

/* --- Fall Risk (0-100) --- */
function _riskCalcFall(patient) {
  var score = 0;
  var age = _riskCalcAge(patient);

  if (age >= 85) score += 25;
  else if (age >= 75) score += 20;
  else if (age >= 65) score += 15;
  else if (age >= 55) score += 10;

  // Fall-risk medications
  var meds = getPatientMedications(patient.id);
  var fallRiskMeds = ['benzodiazepine', 'lorazepam', 'diazepam', 'alprazolam', 'clonazepam', 'zolpidem', 'ambien', 'opioid', 'oxycodone', 'hydrocodone', 'morphine', 'tramadol', 'gabapentin', 'pregabalin', 'antidepressant', 'ssri', 'amitriptyline'];
  var riskMedCount = meds.filter(function(m) {
    var n = (m.name || '').toLowerCase();
    return fallRiskMeds.some(function(f) { return n.indexOf(f) >= 0; });
  }).length;
  score += Math.min(riskMedCount * 8, 24);

  // Polypharmacy
  if (meds.length >= 10) score += 10;
  else if (meds.length >= 6) score += 5;

  // Diagnoses increasing fall risk
  if (_riskHasDx(patient, ['osteoporosis', 'm80', 'm81'])) score += 10;
  if (_riskHasDx(patient, ['parkinson', 'g20'])) score += 15;
  if (_riskHasDx(patient, ['dementia', 'alzheimer', 'cognitive'])) score += 10;
  if (_riskHasDx(patient, ['neuropathy', 'g60', 'g62'])) score += 8;
  if (_riskHasDx(patient, ['vertigo', 'dizziness', 'r42', 'h81'])) score += 8;
  if (_riskHasDx(patient, ['visual impairment', 'macular', 'glaucoma', 'h40', 'h54'])) score += 8;

  // Previous fall
  if (_riskHasDx(patient, ['fall', 'w01', 'w06', 'w10', 'w18'])) score += 15;

  return Math.min(score, 100);
}

/* --- Cardiovascular / ASCVD Risk (0-100%) --- */
function _riskCalcCardiovascular(patient) {
  var age = _riskCalcAge(patient);
  if (age < 20) return 0;
  var score = 0;

  // Simplified ASCVD-style calculation
  // Age factor
  if (age >= 70) score += 20;
  else if (age >= 60) score += 15;
  else if (age >= 50) score += 10;
  else if (age >= 40) score += 5;

  // Sex factor
  var isMale = (patient.sex || '').toLowerCase() === 'male';
  if (isMale) score += 5;

  // Systolic BP
  var v = getLatestVitalsByPatient(patient.id);
  if (v && v.vitals) {
    var sys = parseFloat(v.vitals.bpSystolic);
    if (!isNaN(sys)) {
      if (sys >= 180) score += 20;
      else if (sys >= 160) score += 15;
      else if (sys >= 140) score += 10;
      else if (sys >= 130) score += 5;
    }
  }

  // Cholesterol (use lab data if available)
  var totalChol = _riskLatestLab(patient, 'cholesterol');
  var hdl = _riskLatestLab(patient, 'hdl');
  if (totalChol !== null) {
    if (totalChol >= 280) score += 15;
    else if (totalChol >= 240) score += 10;
    else if (totalChol >= 200) score += 5;
  }
  if (hdl !== null) {
    if (hdl < 35) score += 10;
    else if (hdl < 45) score += 5;
  }

  // Smoking
  if (_riskIsSmoker(patient)) score += 10;

  // Diabetes
  if (_riskHasDx(patient, ['diabetes', 'e11', 'e10'])) score += 10;

  // Family history of CVD (check problems or family hx)
  if (_riskHasDx(patient, ['familial hypercholesterolemia', 'family history cardiac'])) score += 5;

  return Math.min(score, 100);
}

function _riskLatestLab(patient, labName) {
  var results = getLabResults(patient.id);
  var ln = labName.toLowerCase();
  for (var i = 0; i < results.length; i++) {
    var tests = results[i].tests || [];
    for (var j = 0; j < tests.length; j++) {
      if ((tests[j].name || '').toLowerCase().indexOf(ln) >= 0) {
        var v = parseFloat(tests[j].value);
        if (!isNaN(v)) return v;
      }
    }
  }
  return null;
}

/* --- Risk Level --- */
function _riskLevel(score, type) {
  if (type === 'mortality') {
    // Charlson: 0 = low, 1-2 = moderate, 3-4 = high, 5+ = very high
    if (score >= 5) return { level: 'High', cls: 'risk-high' };
    if (score >= 3) return { level: 'Medium', cls: 'risk-medium' };
    return { level: 'Low', cls: 'risk-low' };
  }
  // Generic 0-100 scale
  if (score >= 60) return { level: 'High', cls: 'risk-high' };
  if (score >= 30) return { level: 'Medium', cls: 'risk-medium' };
  return { level: 'Low', cls: 'risk-low' };
}

/* ---------- View State ---------- */
var _riskSelectedCategory = 'readmission';
var _riskPatientData = [];
var _riskSortAsc = false;

/* ---------- Calculate All Patients ---------- */
function _riskCalcAllPatients() {
  var patients = getPatients();
  _riskPatientData = patients.map(function(p) {
    var readmission = _riskCalcReadmission(p);
    var charlson = _riskCalcCharlson(p);
    var fall = _riskCalcFall(p);
    var cardio = _riskCalcCardiovascular(p);
    return {
      patient: p,
      readmission: readmission,
      readmissionLevel: _riskLevel(readmission, 'readmission'),
      mortality: charlson,
      mortalityLevel: _riskLevel(charlson, 'mortality'),
      fall: fall,
      fallLevel: _riskLevel(fall, 'fall'),
      cardiovascular: cardio,
      cardiovascularLevel: _riskLevel(cardio, 'cardiovascular')
    };
  });
}

/* ---------- View Layer ---------- */

function renderRiskStratification() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Risk Stratification', meta: 'Population Risk Assessment', actions: '' });
  setActiveNav('risk-stratification');

  _riskSelectedCategory = 'readmission';
  _riskSortAsc = false;
  _riskCalcAllPatients();

  var container = document.createElement('div');
  container.className = 'risk-container';

  // Population overview (pie chart distribution)
  var overview = document.createElement('div');
  overview.className = 'risk-overview';
  overview.id = 'risk-overview';
  container.appendChild(overview);

  // Category tabs
  var tabs = document.createElement('div');
  tabs.className = 'risk-tabs';
  tabs.id = 'risk-tabs';
  RISK_CATEGORIES.forEach(function(cat) {
    var tab = document.createElement('button');
    tab.className = 'risk-tab' + (_riskSelectedCategory === cat.id ? ' active' : '');
    tab.textContent = cat.name;
    tab.dataset.cat = cat.id;
    tab.addEventListener('click', function() {
      _riskSelectedCategory = cat.id;
      _riskRenderAll();
    });
    tabs.appendChild(tab);
  });
  container.appendChild(tabs);

  // Patient list
  var listArea = document.createElement('div');
  listArea.className = 'risk-list-area';
  listArea.id = 'risk-list-area';
  container.appendChild(listArea);

  app.appendChild(container);

  _riskRenderAll();
}

function _riskRenderAll() {
  _riskRenderOverview();
  _riskRenderList();

  // Update tab active state
  document.querySelectorAll('.risk-tab').forEach(function(tab) {
    tab.classList.toggle('active', tab.dataset.cat === _riskSelectedCategory);
  });
}

function _riskRenderOverview() {
  var overview = document.getElementById('risk-overview');
  if (!overview) return;
  overview.innerHTML = '';

  // Compute distribution for each category
  RISK_CATEGORIES.forEach(function(cat) {
    var high = 0, medium = 0, low = 0;
    _riskPatientData.forEach(function(d) {
      var lvl = d[cat.id + 'Level'].level;
      if (lvl === 'High') high++;
      else if (lvl === 'Medium') medium++;
      else low++;
    });
    var total = _riskPatientData.length || 1;
    var highPct = (high / total * 100).toFixed(0);
    var medPct = (medium / total * 100).toFixed(0);
    var lowPct = (low / total * 100).toFixed(0);

    var card = document.createElement('div');
    card.className = 'risk-overview-card' + (_riskSelectedCategory === cat.id ? ' risk-overview-active' : '');
    card.innerHTML =
      '<div class="risk-overview-title">' + esc(cat.name) + '</div>' +
      '<div class="risk-pie-mini">' +
        '<div class="risk-pie-mini-chart" style="background:conic-gradient(var(--danger,#dc3545) 0% ' + highPct + '%, var(--warning,#f59e0b) ' + highPct + '% ' + (parseFloat(highPct) + parseFloat(medPct)) + '%, var(--success,#22c55e) ' + (parseFloat(highPct) + parseFloat(medPct)) + '% 100%)"></div>' +
      '</div>' +
      '<div class="risk-overview-legend">' +
        '<span class="risk-legend-item"><span class="risk-dot risk-high"></span>High: ' + high + '</span>' +
        '<span class="risk-legend-item"><span class="risk-dot risk-medium"></span>Med: ' + medium + '</span>' +
        '<span class="risk-legend-item"><span class="risk-dot risk-low"></span>Low: ' + low + '</span>' +
      '</div>';
    card.addEventListener('click', function() {
      _riskSelectedCategory = cat.id;
      _riskRenderAll();
    });
    overview.appendChild(card);
  });
}

function _riskRenderList() {
  var area = document.getElementById('risk-list-area');
  if (!area) return;
  area.innerHTML = '';

  var cat = _riskSelectedCategory;
  var catDef = RISK_CATEGORIES.find(function(c) { return c.id === cat; });

  // Description
  var desc = document.createElement('div');
  desc.className = 'risk-cat-desc';
  desc.textContent = catDef ? catDef.description : '';
  area.appendChild(desc);

  // Sort controls
  var controls = document.createElement('div');
  controls.className = 'risk-controls';
  var sortBtn = document.createElement('button');
  sortBtn.className = 'btn btn-sm qm-btn-outline';
  sortBtn.textContent = _riskSortAsc ? 'Sort: Low to High' : 'Sort: High to Low';
  sortBtn.addEventListener('click', function() {
    _riskSortAsc = !_riskSortAsc;
    _riskRenderList();
  });
  controls.appendChild(sortBtn);

  var exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-sm qm-btn-outline';
  exportBtn.textContent = 'Export CSV';
  exportBtn.addEventListener('click', function() { _riskExportCSV(); });
  controls.appendChild(exportBtn);

  var highRiskBtn = document.createElement('button');
  highRiskBtn.className = 'btn btn-sm btn-primary';
  highRiskBtn.textContent = 'View High-Risk Only';
  highRiskBtn.addEventListener('click', function() { _riskShowHighRisk(); });
  controls.appendChild(highRiskBtn);

  area.appendChild(controls);

  // Sorted data
  var sorted = _riskPatientData.slice().sort(function(a, b) {
    var va = a[cat];
    var vb = b[cat];
    return _riskSortAsc ? va - vb : vb - va;
  });

  // Table
  var table = document.createElement('table');
  table.className = 'risk-table';
  table.innerHTML =
    '<thead><tr>' +
      '<th>Patient</th><th>MRN</th><th>Age</th><th>Sex</th>' +
      '<th>Score</th><th>Risk Level</th><th>Key Factors</th><th>Action</th>' +
    '</tr></thead>';
  var tbody = document.createElement('tbody');

  sorted.forEach(function(d) {
    var p = d.patient;
    var score = d[cat];
    var lvl = d[cat + 'Level'];
    var factors = _riskGetFactors(d, cat);

    var tr = document.createElement('tr');
    tr.className = 'risk-row ' + lvl.cls;
    tr.innerHTML =
      '<td class="risk-name-cell">' + esc(p.lastName + ', ' + p.firstName) + '</td>' +
      '<td>' + esc(p.mrn || '--') + '</td>' +
      '<td>' + _riskCalcAge(p) + '</td>' +
      '<td>' + esc(p.sex || '--') + '</td>' +
      '<td class="risk-score-cell"><span class="risk-score-badge ' + lvl.cls + '">' + (cat === 'mortality' ? score : score + '%') + '</span></td>' +
      '<td><span class="risk-level-badge ' + lvl.cls + '">' + lvl.level + '</span></td>' +
      '<td class="risk-factors-cell">' + esc(factors) + '</td>' +
      '<td><button class="btn btn-sm btn-primary risk-chart-btn" data-pid="' + esc(p.id) + '">Chart</button></td>';
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  area.appendChild(table);

  // Wire chart buttons
  area.querySelectorAll('.risk-chart-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigate('#chart/' + btn.dataset.pid);
    });
  });
}

function _riskGetFactors(data, category) {
  var p = data.patient;
  var factors = [];
  var age = _riskCalcAge(p);

  if (category === 'readmission') {
    if (age >= 65) factors.push('Age ' + age);
    if (_riskDxCount(p) >= 5) factors.push(_riskDxCount(p) + ' dx');
    if (_riskMedCount(p) >= 6) factors.push(_riskMedCount(p) + ' meds');
    if (_riskHasDx(p, ['heart failure', 'chf'])) factors.push('CHF');
    if (_riskHasDx(p, ['copd'])) factors.push('COPD');
  } else if (category === 'mortality') {
    if (age >= 60) factors.push('Age ' + age);
    if (_riskHasDx(p, ['heart failure', 'chf'])) factors.push('CHF');
    if (_riskHasDx(p, ['cancer', 'malignant'])) factors.push('Cancer');
    if (_riskHasDx(p, ['diabetes'])) factors.push('DM');
    if (_riskHasDx(p, ['ckd', 'chronic kidney'])) factors.push('CKD');
  } else if (category === 'fall') {
    if (age >= 65) factors.push('Age ' + age);
    if (_riskHasDx(p, ['osteoporosis'])) factors.push('Osteoporosis');
    if (_riskHasDx(p, ['neuropathy'])) factors.push('Neuropathy');
    if (_riskMedCount(p) >= 6) factors.push('Polypharmacy');
  } else if (category === 'cardiovascular') {
    if (_riskIsSmoker(p)) factors.push('Smoker');
    if (_riskHasDx(p, ['diabetes'])) factors.push('DM');
    if (_riskHasDx(p, ['hypertension', 'htn'])) factors.push('HTN');
    var chol = _riskLatestLab(p, 'cholesterol');
    if (chol !== null && chol >= 240) factors.push('High Chol');
  }

  return factors.length > 0 ? factors.join(', ') : 'Low baseline risk';
}

function _riskShowHighRisk() {
  var cat = _riskSelectedCategory;
  var highRisk = _riskPatientData.filter(function(d) {
    return d[cat + 'Level'].level === 'High';
  });

  if (highRisk.length === 0) {
    showToast('No high-risk patients in this category.', 'warning');
    return;
  }

  var body = '<p>' + highRisk.length + ' high-risk patients for care management enrollment consideration:</p>' +
    '<table class="qm-drill-table"><thead><tr><th>Patient</th><th>Score</th><th>Key Factors</th></tr></thead><tbody>';
  highRisk.sort(function(a, b) { return b[cat] - a[cat]; });
  highRisk.forEach(function(d) {
    var p = d.patient;
    var factors = _riskGetFactors(d, cat);
    body += '<tr><td>' + esc(p.lastName + ', ' + p.firstName) + '</td><td>' + d[cat] + '</td><td>' + esc(factors) + '</td></tr>';
  });
  body += '</tbody></table>';

  openModal({
    title: 'High-Risk Patients - Care Management',
    bodyHTML: body,
    footerHTML:
      '<button class="btn btn-sm" onclick="closeModal()">Close</button>' +
      '<button class="btn btn-sm btn-primary" id="risk-enroll-btn">Enroll All in Care Mgmt</button>',
    size: 'lg'
  });

  setTimeout(function() {
    var enrollBtn = document.getElementById('risk-enroll-btn');
    if (enrollBtn) {
      enrollBtn.addEventListener('click', function() {
        closeModal();
        showToast('Enrolled ' + highRisk.length + ' high-risk patients in care management.', 'success');
      });
    }
  }, 100);
}

function _riskExportCSV() {
  var cat = _riskSelectedCategory;
  var rows = [['Patient', 'MRN', 'Age', 'Sex', 'Score', 'Risk Level', 'Key Factors']];
  _riskPatientData.sort(function(a, b) { return b[cat] - a[cat]; }).forEach(function(d) {
    var p = d.patient;
    rows.push([
      (p.lastName || '') + ', ' + (p.firstName || ''),
      p.mrn || '',
      String(_riskCalcAge(p)),
      p.sex || '',
      String(d[cat]),
      d[cat + 'Level'].level,
      _riskGetFactors(d, cat)
    ]);
  });
  var csv = rows.map(function(r) {
    return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'risk_' + cat + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Exported risk data for ' + _riskPatientData.length + ' patients.', 'success');
}
