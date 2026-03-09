/* ============================================================
   views/registries.js — Disease Registries
   Auto-populated patient registries by diagnosis
   ============================================================ */

/* ---------- Registry Definitions ---------- */

var REGISTRY_DEFS = [
  {
    id: 'diabetes',
    name: 'Diabetes Registry',
    icon: 'D',
    color: '#c05621',
    diagnosisTerms: ['diabetes', 'type 2 diabetes', 'type 1 diabetes', 'e11', 'e10', 'dm2', 'dm1'],
    columns: [
      { key: 'name', label: 'Patient', fn: function(p) { return p.lastName + ', ' + p.firstName; } },
      { key: 'mrn', label: 'MRN', fn: function(p) { return p.mrn || '--'; } },
      { key: 'age', label: 'Age', fn: function(p) { return _regAge(p); }, sortNum: true },
      { key: 'a1c', label: 'Latest A1c', fn: function(p) { var v = _regLatestLab(p, 'hba1c'); return v !== null ? v.toFixed(1) + '%' : '--'; }, sortNum: true, rawFn: function(p) { return _regLatestLab(p, 'hba1c'); } },
      { key: 'bp', label: 'BP', fn: function(p) { var v = _regLatestVitals(p); return v ? v.bpSystolic + '/' + v.bpDiastolic : '--'; } },
      { key: 'bmi', label: 'BMI', fn: function(p) { return _regBMI(p); }, sortNum: true },
      { key: 'eyeExam', label: 'Last Eye Exam', fn: function(p) { return _regLastScreening(p, ['eye exam', 'retinal', 'ophthalmology']); } },
      { key: 'nephropathy', label: 'Nephropathy Screen', fn: function(p) { return _regLastScreening(p, ['nephropathy', 'microalbumin', 'urine albumin']); } },
      { key: 'footExam', label: 'Last Foot Exam', fn: function(p) { return _regLastScreening(p, ['foot exam', 'diabetic foot', 'podiatry']); } },
      { key: 'flags', label: 'Flags', fn: function(p) { return _regDiabetesFlags(p); } }
    ]
  },
  {
    id: 'heart-failure',
    name: 'Heart Failure Registry',
    icon: 'H',
    color: '#9b2c2c',
    diagnosisTerms: ['heart failure', 'chf', 'congestive heart failure', 'i50', 'hfref', 'hfpef', 'systolic heart failure', 'diastolic heart failure'],
    columns: [
      { key: 'name', label: 'Patient', fn: function(p) { return p.lastName + ', ' + p.firstName; } },
      { key: 'mrn', label: 'MRN', fn: function(p) { return p.mrn || '--'; } },
      { key: 'age', label: 'Age', fn: function(p) { return _regAge(p); }, sortNum: true },
      { key: 'ef', label: 'EF', fn: function(p) { var v = _regLatestLab(p, 'ejection fraction'); return v !== null ? v + '%' : '--'; } },
      { key: 'bnp', label: 'BNP', fn: function(p) { var v = _regLatestLab(p, 'bnp'); return v !== null ? v.toFixed(0) : '--'; }, sortNum: true, rawFn: function(p) { return _regLatestLab(p, 'bnp'); } },
      { key: 'echo', label: 'Last Echo', fn: function(p) { return _regLastImaging(p, ['echo', 'echocardiogram']); } },
      { key: 'meds', label: 'Key Meds', fn: function(p) { return _regHFMeds(p); } },
      { key: 'weight', label: 'Weight', fn: function(p) { var v = _regLatestVitals(p); return v && v.weightLbs ? v.weightLbs + ' lbs' : '--'; } },
      { key: 'flags', label: 'Flags', fn: function(p) { return _regHFFlags(p); } }
    ]
  },
  {
    id: 'copd',
    name: 'COPD Registry',
    icon: 'C',
    color: '#276749',
    diagnosisTerms: ['copd', 'chronic obstructive', 'j44', 'j43', 'emphysema', 'chronic bronchitis'],
    columns: [
      { key: 'name', label: 'Patient', fn: function(p) { return p.lastName + ', ' + p.firstName; } },
      { key: 'mrn', label: 'MRN', fn: function(p) { return p.mrn || '--'; } },
      { key: 'age', label: 'Age', fn: function(p) { return _regAge(p); }, sortNum: true },
      { key: 'fev1', label: 'FEV1', fn: function(p) { var v = _regLatestLab(p, 'fev1'); return v !== null ? v + '%' : '--'; } },
      { key: 'lastPFT', label: 'Last PFT', fn: function(p) { return _regLastScreening(p, ['pft', 'pulmonary function', 'spirometry']); } },
      { key: 'inhalers', label: 'Inhalers', fn: function(p) { return _regInhalerMeds(p); } },
      { key: 'smoking', label: 'Smoking', fn: function(p) { var sh = getSocialHistory(p.id); return sh ? (sh.smokingStatus || sh.tobaccoUse || '--') : '--'; } },
      { key: 'flags', label: 'Flags', fn: function(p) { return _regCOPDFlags(p); } }
    ]
  },
  {
    id: 'hypertension',
    name: 'Hypertension Registry',
    icon: 'B',
    color: '#2b6cb0',
    diagnosisTerms: ['hypertension', 'htn', 'i10', 'high blood pressure', 'essential hypertension'],
    columns: [
      { key: 'name', label: 'Patient', fn: function(p) { return p.lastName + ', ' + p.firstName; } },
      { key: 'mrn', label: 'MRN', fn: function(p) { return p.mrn || '--'; } },
      { key: 'age', label: 'Age', fn: function(p) { return _regAge(p); }, sortNum: true },
      { key: 'bp', label: 'Latest BP', fn: function(p) { var v = _regLatestVitals(p); return v ? v.bpSystolic + '/' + v.bpDiastolic : '--'; } },
      { key: 'sys', label: 'Systolic', fn: function(p) { var v = _regLatestVitals(p); return v ? v.bpSystolic : '--'; }, sortNum: true },
      { key: 'medCount', label: '# BP Meds', fn: function(p) { return _regBPMedCount(p); }, sortNum: true },
      { key: 'controlled', label: 'Controlled', fn: function(p) {
        var v = _regLatestVitals(p);
        if (!v) return '--';
        var s = parseFloat(v.bpSystolic);
        var d = parseFloat(v.bpDiastolic);
        return (!isNaN(s) && !isNaN(d) && s < 140 && d < 90) ? 'Yes' : 'No';
      } },
      { key: 'flags', label: 'Flags', fn: function(p) { return _regHTNFlags(p); } }
    ]
  },
  {
    id: 'ckd',
    name: 'CKD Registry',
    icon: 'K',
    color: '#6b46c1',
    diagnosisTerms: ['chronic kidney', 'ckd', 'n18', 'renal insufficiency', 'kidney disease'],
    columns: [
      { key: 'name', label: 'Patient', fn: function(p) { return p.lastName + ', ' + p.firstName; } },
      { key: 'mrn', label: 'MRN', fn: function(p) { return p.mrn || '--'; } },
      { key: 'age', label: 'Age', fn: function(p) { return _regAge(p); }, sortNum: true },
      { key: 'gfr', label: 'GFR', fn: function(p) { var v = _regLatestLab(p, 'gfr'); return v !== null ? v.toFixed(0) : '--'; }, sortNum: true, rawFn: function(p) { return _regLatestLab(p, 'gfr'); } },
      { key: 'creatinine', label: 'Creatinine', fn: function(p) { var v = _regLatestLab(p, 'creatinine'); return v !== null ? v.toFixed(2) : '--'; }, sortNum: true, rawFn: function(p) { return _regLatestLab(p, 'creatinine'); } },
      { key: 'proteinuria', label: 'Proteinuria', fn: function(p) { var v = _regLatestLab(p, 'protein'); return v !== null ? v.toFixed(1) : '--'; } },
      { key: 'stage', label: 'Stage', fn: function(p) { return _regCKDStage(p); } },
      { key: 'bp', label: 'BP', fn: function(p) { var v = _regLatestVitals(p); return v ? v.bpSystolic + '/' + v.bpDiastolic : '--'; } },
      { key: 'flags', label: 'Flags', fn: function(p) { return _regCKDFlags(p); } }
    ]
  }
];

/* ---------- Helpers ---------- */

function _regAge(patient) {
  if (!patient.dob) return '--';
  var d = new Date(patient.dob + 'T00:00:00');
  if (isNaN(d)) return '--';
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function _regLatestLab(patient, labName) {
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

function _regLatestVitals(patient) {
  var v = getLatestVitalsByPatient(patient.id);
  return v ? v.vitals : null;
}

function _regBMI(patient) {
  var v = _regLatestVitals(patient);
  if (!v) return '--';
  var w = parseFloat(v.weightLbs);
  var h = parseFloat(v.heightIn);
  if (!w || !h || h === 0) return '--';
  return ((w / (h * h)) * 703).toFixed(1);
}

function _regLastScreening(patient, terms) {
  var screenings = getScreeningRecords(patient.id);
  for (var i = 0; i < screenings.length; i++) {
    var name = (screenings[i].screening || '').toLowerCase();
    var matched = terms.some(function(t) { return name.indexOf(t.toLowerCase()) >= 0; });
    if (matched && screenings[i].completedDate) {
      return formatDateTime(screenings[i].completedDate);
    }
  }
  return 'None';
}

function _regLastImaging(patient, terms) {
  var results = getImagingResults(patient.id);
  for (var i = 0; i < results.length; i++) {
    var study = (results[i].studyType || '').toLowerCase();
    var matched = terms.some(function(t) { return study.indexOf(t.toLowerCase()) >= 0; });
    if (matched) return formatDateTime(results[i].resultDate);
  }
  return 'None';
}

function _regDiabetesFlags(patient) {
  var flags = [];
  var a1c = _regLatestLab(patient, 'hba1c');
  if (a1c === null) flags.push('No A1c');
  else if (a1c >= 9) flags.push('A1c >= 9');
  else if (a1c >= 8) flags.push('A1c >= 8');
  var v = _regLatestVitals(patient);
  if (v) {
    var s = parseFloat(v.bpSystolic);
    if (!isNaN(s) && s >= 140) flags.push('High BP');
  }
  return flags.length > 0 ? flags.join(', ') : 'OK';
}

function _regHFMeds(patient) {
  var meds = getPatientMedications(patient.id);
  var classes = [];
  var aceArb = ['lisinopril', 'enalapril', 'ramipril', 'losartan', 'valsartan', 'irbesartan', 'sacubitril', 'entresto'];
  var betaBlocker = ['metoprolol', 'carvedilol', 'bisoprolol', 'atenolol'];
  var diuretic = ['furosemide', 'lasix', 'bumetanide', 'torsemide', 'spironolactone', 'eplerenone'];
  if (meds.some(function(m) { var n = (m.name || '').toLowerCase(); return aceArb.some(function(a) { return n.indexOf(a) >= 0; }); })) classes.push('ACEi/ARB');
  if (meds.some(function(m) { var n = (m.name || '').toLowerCase(); return betaBlocker.some(function(b) { return n.indexOf(b) >= 0; }); })) classes.push('BB');
  if (meds.some(function(m) { var n = (m.name || '').toLowerCase(); return diuretic.some(function(d) { return n.indexOf(d) >= 0; }); })) classes.push('Diuretic');
  return classes.length > 0 ? classes.join(', ') : 'None';
}

function _regHFFlags(patient) {
  var flags = [];
  var bnp = _regLatestLab(patient, 'bnp');
  if (bnp !== null && bnp > 400) flags.push('BNP > 400');
  var meds = _regHFMeds(patient);
  if (meds.indexOf('ACEi/ARB') < 0) flags.push('No ACEi/ARB');
  if (meds.indexOf('BB') < 0) flags.push('No Beta-blocker');
  return flags.length > 0 ? flags.join(', ') : 'OK';
}

function _regInhalerMeds(patient) {
  var meds = getPatientMedications(patient.id);
  var inhalers = ['albuterol', 'budesonide', 'fluticasone', 'tiotropium', 'ipratropium', 'formoterol', 'salmeterol', 'umeclidinium', 'vilanterol', 'inhaler', 'nebulizer'];
  var found = meds.filter(function(m) { var n = (m.name || '').toLowerCase(); return inhalers.some(function(inh) { return n.indexOf(inh) >= 0; }); });
  return found.length > 0 ? found.map(function(m) { return m.name; }).slice(0, 3).join(', ') : 'None';
}

function _regCOPDFlags(patient) {
  var flags = [];
  var sh = getSocialHistory(patient.id);
  if (sh && (sh.smokingStatus || '').toLowerCase().indexOf('current') >= 0) flags.push('Active Smoker');
  var fev1 = _regLatestLab(patient, 'fev1');
  if (fev1 !== null && fev1 < 50) flags.push('FEV1 < 50%');
  return flags.length > 0 ? flags.join(', ') : 'OK';
}

function _regBPMedCount(patient) {
  var meds = getPatientMedications(patient.id);
  var bpMeds = ['lisinopril', 'enalapril', 'ramipril', 'losartan', 'valsartan', 'amlodipine', 'nifedipine', 'diltiazem', 'metoprolol', 'atenolol', 'carvedilol', 'hydrochlorothiazide', 'hctz', 'chlorthalidone', 'spironolactone', 'clonidine', 'hydralazine', 'olmesartan', 'irbesartan', 'benazepril'];
  var count = meds.filter(function(m) { var n = (m.name || '').toLowerCase(); return bpMeds.some(function(bp) { return n.indexOf(bp) >= 0; }); }).length;
  return count;
}

function _regHTNFlags(patient) {
  var flags = [];
  var v = _regLatestVitals(patient);
  if (v) {
    var s = parseFloat(v.bpSystolic);
    var d = parseFloat(v.bpDiastolic);
    if (!isNaN(s) && s >= 180) flags.push('Crisis: SBP >= 180');
    else if (!isNaN(s) && s >= 140) flags.push('Uncontrolled');
    if (!isNaN(d) && d >= 90) flags.push('DBP >= 90');
  } else {
    flags.push('No BP on file');
  }
  return flags.length > 0 ? flags.join(', ') : 'Controlled';
}

function _regCKDStage(patient) {
  var gfr = _regLatestLab(patient, 'gfr');
  if (gfr === null) return '--';
  if (gfr >= 90) return '1';
  if (gfr >= 60) return '2';
  if (gfr >= 45) return '3a';
  if (gfr >= 30) return '3b';
  if (gfr >= 15) return '4';
  return '5';
}

function _regCKDFlags(patient) {
  var flags = [];
  var gfr = _regLatestLab(patient, 'gfr');
  if (gfr !== null && gfr < 30) flags.push('GFR < 30');
  var cr = _regLatestLab(patient, 'creatinine');
  if (cr !== null && cr > 2.0) flags.push('Cr > 2.0');
  var v = _regLatestVitals(patient);
  if (v) {
    var s = parseFloat(v.bpSystolic);
    if (!isNaN(s) && s >= 140) flags.push('High BP');
  }
  return flags.length > 0 ? flags.join(', ') : 'OK';
}

function _regMatchesDiagnosis(patient, terms) {
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

/* ---------- View State ---------- */
var _regSelectedRegistry = null;
var _regSortCol = 'name';
var _regSortAsc = true;
var _regFilterText = '';
var _regPatients = [];

/* ---------- View Layer ---------- */

function renderRegistries() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Disease Registries', meta: 'Population Registries', actions: '' });
  setActiveNav('registries');

  _regSelectedRegistry = null;
  _regSortCol = 'name';
  _regSortAsc = true;
  _regFilterText = '';

  var container = document.createElement('div');
  container.className = 'reg-container';

  // Registry cards overview
  var overview = document.createElement('div');
  overview.className = 'reg-overview';
  overview.id = 'reg-overview';

  var patients = getPatients();
  REGISTRY_DEFS.forEach(function(reg) {
    var count = patients.filter(function(p) { return _regMatchesDiagnosis(p, reg.diagnosisTerms); }).length;
    var card = document.createElement('div');
    card.className = 'reg-card';
    card.innerHTML =
      '<div class="reg-card-icon" style="background:' + reg.color + '">' + esc(reg.icon) + '</div>' +
      '<div class="reg-card-info">' +
        '<div class="reg-card-name">' + esc(reg.name) + '</div>' +
        '<div class="reg-card-count">' + count + ' patient' + (count !== 1 ? 's' : '') + '</div>' +
      '</div>';
    card.addEventListener('click', function() {
      _regSelectedRegistry = reg;
      _regPatients = patients.filter(function(p) { return _regMatchesDiagnosis(p, reg.diagnosisTerms); });
      _regRenderRegistry();
    });
    overview.appendChild(card);
  });

  container.appendChild(overview);

  // Registry detail area
  var detail = document.createElement('div');
  detail.className = 'reg-detail hidden';
  detail.id = 'reg-detail';
  container.appendChild(detail);

  app.appendChild(container);
}

function _regRenderRegistry() {
  var detail = document.getElementById('reg-detail');
  if (!detail || !_regSelectedRegistry) return;
  detail.classList.remove('hidden');
  detail.innerHTML = '';

  var reg = _regSelectedRegistry;

  // Header
  var header = document.createElement('div');
  header.className = 'reg-detail-header';
  header.innerHTML =
    '<div class="reg-detail-title">' +
      '<button class="btn btn-sm qm-btn-outline" id="reg-back-btn">Back</button>' +
      '<h3 style="margin:0">' + esc(reg.name) + '</h3>' +
      '<span class="reg-detail-count">' + _regPatients.length + ' patients</span>' +
    '</div>' +
    '<div class="reg-detail-actions">' +
      '<input type="text" class="slicer-input" id="reg-filter" placeholder="Filter patients..." value="' + esc(_regFilterText) + '" />' +
      '<button class="btn btn-sm qm-btn-outline" id="reg-export-btn">Export CSV</button>' +
      '<button class="btn btn-sm btn-primary" id="reg-outreach-btn">Bulk Outreach</button>' +
    '</div>';
  detail.appendChild(header);

  // Table
  var tableWrap = document.createElement('div');
  tableWrap.className = 'reg-table-wrap';
  tableWrap.id = 'reg-table-wrap';
  detail.appendChild(tableWrap);

  _regRenderTable();

  // Wire events
  document.getElementById('reg-back-btn').addEventListener('click', function() {
    detail.classList.add('hidden');
    _regSelectedRegistry = null;
  });
  document.getElementById('reg-filter').addEventListener('input', function() {
    _regFilterText = this.value;
    _regRenderTable();
  });
  document.getElementById('reg-export-btn').addEventListener('click', function() { _regExportCSV(); });
  document.getElementById('reg-outreach-btn').addEventListener('click', function() { _regBulkOutreach(); });
}

function _regRenderTable() {
  var wrap = document.getElementById('reg-table-wrap');
  if (!wrap || !_regSelectedRegistry) return;
  wrap.innerHTML = '';

  var reg = _regSelectedRegistry;
  var filtered = _regPatients;
  if (_regFilterText) {
    var q = _regFilterText.toLowerCase();
    filtered = filtered.filter(function(p) {
      return (p.firstName || '').toLowerCase().indexOf(q) >= 0 ||
             (p.lastName || '').toLowerCase().indexOf(q) >= 0 ||
             (p.mrn || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  // Sort
  var sortCol = reg.columns.find(function(c) { return c.key === _regSortCol; });
  if (sortCol) {
    filtered.sort(function(a, b) {
      var va, vb;
      if (sortCol.rawFn) { va = sortCol.rawFn(a); vb = sortCol.rawFn(b); }
      else if (sortCol.sortNum) { va = parseFloat(sortCol.fn(a)) || 0; vb = parseFloat(sortCol.fn(b)) || 0; }
      else { va = String(sortCol.fn(a)).toLowerCase(); vb = String(sortCol.fn(b)).toLowerCase(); }
      if (va < vb) return _regSortAsc ? -1 : 1;
      if (va > vb) return _regSortAsc ? 1 : -1;
      return 0;
    });
  }

  if (filtered.length === 0) {
    wrap.innerHTML = '<div class="qm-no-gaps">No patients match this registry.</div>';
    return;
  }

  var table = document.createElement('table');
  table.className = 'reg-table';

  var thead = document.createElement('thead');
  var headRow = document.createElement('tr');
  reg.columns.forEach(function(col) {
    var th = document.createElement('th');
    th.textContent = col.label;
    th.className = 'reg-th-sortable' + (_regSortCol === col.key ? ' reg-th-active' : '');
    th.addEventListener('click', function() {
      if (_regSortCol === col.key) _regSortAsc = !_regSortAsc;
      else { _regSortCol = col.key; _regSortAsc = true; }
      _regRenderTable();
    });
    headRow.appendChild(th);
  });
  // Action column
  var actionTh = document.createElement('th');
  actionTh.textContent = 'Action';
  headRow.appendChild(actionTh);
  thead.appendChild(headRow);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');
  filtered.forEach(function(p) {
    var tr = document.createElement('tr');
    var flagVal = '';
    reg.columns.forEach(function(col) {
      var td = document.createElement('td');
      var val = col.fn(p);
      td.textContent = val;
      if (col.key === 'flags') {
        flagVal = val;
        if (val !== 'OK' && val !== 'Controlled' && val !== '--') {
          td.className = 'reg-flag-cell';
        }
      }
      if (col.key === 'name') {
        td.className = 'reg-name-cell';
      }
      tr.appendChild(td);
    });
    // Flag entire row if overdue
    if (flagVal && flagVal !== 'OK' && flagVal !== 'Controlled' && flagVal !== '--') {
      tr.className = 'reg-row-flagged';
    }
    var actionTd = document.createElement('td');
    var chartBtn = document.createElement('button');
    chartBtn.className = 'btn btn-sm btn-primary';
    chartBtn.textContent = 'Chart';
    chartBtn.addEventListener('click', function(e) { e.stopPropagation(); navigate('#chart/' + p.id); });
    actionTd.appendChild(chartBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function _regExportCSV() {
  var reg = _regSelectedRegistry;
  if (!reg) return;
  var headers = reg.columns.map(function(c) { return c.label; });
  var rows = [headers];
  _regPatients.forEach(function(p) {
    rows.push(reg.columns.map(function(c) { return String(c.fn(p)); }));
  });
  var csv = rows.map(function(r) {
    return r.map(function(c) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'registry_' + reg.id + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Exported ' + _regPatients.length + ' patients.', 'success');
}

function _regBulkOutreach() {
  var reg = _regSelectedRegistry;
  if (!reg) return;

  var flagged = _regPatients.filter(function(p) {
    var flagCol = reg.columns.find(function(c) { return c.key === 'flags'; });
    if (!flagCol) return false;
    var val = flagCol.fn(p);
    return val !== 'OK' && val !== 'Controlled' && val !== '--';
  });

  if (flagged.length === 0) {
    showToast('No flagged patients to contact.', 'warning');
    return;
  }

  var body =
    '<p>Generate outreach for <strong>' + flagged.length + '</strong> flagged patients in the ' + esc(reg.name) + '.</p>' +
    '<div style="max-height:300px;overflow:auto">' +
    '<table class="qm-drill-table"><thead><tr><th>Patient</th><th>Phone</th><th>Flag</th></tr></thead><tbody>';
  var flagCol = reg.columns.find(function(c) { return c.key === 'flags'; });
  flagged.forEach(function(p) {
    body += '<tr><td>' + esc(p.lastName + ', ' + p.firstName) + '</td><td>' + esc(p.phone || '--') + '</td><td>' + esc(flagCol ? flagCol.fn(p) : '--') + '</td></tr>';
  });
  body += '</tbody></table></div>' +
    '<div style="margin-top:12px">' +
      '<label>Outreach Type</label>' +
      '<select id="reg-outreach-type" class="form-control">' +
        '<option value="letter">Reminder Letter</option>' +
        '<option value="call">Phone Call</option>' +
        '<option value="portal">Patient Portal Message</option>' +
      '</select>' +
    '</div>';

  openModal({
    title: 'Bulk Outreach - ' + reg.name,
    bodyHTML: body,
    footerHTML:
      '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary btn-sm" id="reg-outreach-confirm">Generate Outreach</button>',
    size: 'lg'
  });

  setTimeout(function() {
    var confirmBtn = document.getElementById('reg-outreach-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        var type = document.getElementById('reg-outreach-type').value;
        closeModal();
        showToast('Generated ' + type + ' outreach for ' + flagged.length + ' patients.', 'success');
      });
    }
  }, 100);
}
