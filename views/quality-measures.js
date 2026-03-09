/* ============================================================
   views/quality-measures.js — Quality Measures Dashboard
   HEDIS/MIPS/Star Rating measures with compliance tracking
   ============================================================ */

/* ---------- Measure Definitions ---------- */
var QM_MEASURES = [
  {
    id: 'dm-a1c-lt8',
    name: 'Diabetes: HbA1c < 8%',
    category: 'Diabetes',
    description: 'Diabetic patients with most recent HbA1c below 8%.',
    eligible: function(p) { return _qmHasDiagnosis(p, ['diabetes', 'type 2 diabetes', 'type 1 diabetes', 'e11', 'e10']); },
    compliant: function(p) { var v = _qmLatestLab(p, 'hba1c'); return v !== null && v < 8; },
    action: 'Order HbA1c lab; adjust diabetes medications if needed.'
  },
  {
    id: 'dm-a1c-lt9',
    name: 'Diabetes: HbA1c < 9%',
    category: 'Diabetes',
    description: 'Diabetic patients with most recent HbA1c below 9% (poor control threshold).',
    eligible: function(p) { return _qmHasDiagnosis(p, ['diabetes', 'type 2 diabetes', 'type 1 diabetes', 'e11', 'e10']); },
    compliant: function(p) { var v = _qmLatestLab(p, 'hba1c'); return v !== null && v < 9; },
    action: 'Urgent: Review diabetes management, consider specialist referral.'
  },
  {
    id: 'dm-eye-exam',
    name: 'Diabetes: Eye Exam',
    category: 'Diabetes',
    description: 'Diabetic patients with eye exam documented within past year.',
    eligible: function(p) { return _qmHasDiagnosis(p, ['diabetes', 'type 2 diabetes', 'type 1 diabetes', 'e11', 'e10']); },
    compliant: function(p) { return _qmHasScreening(p, ['eye exam', 'retinal', 'ophthalmology', 'dilated eye'], 365); },
    action: 'Refer to ophthalmology for dilated eye exam.'
  },
  {
    id: 'dm-nephropathy',
    name: 'Diabetes: Nephropathy Screening',
    category: 'Diabetes',
    description: 'Diabetic patients with nephropathy screening (urine microalbumin) in past year.',
    eligible: function(p) { return _qmHasDiagnosis(p, ['diabetes', 'type 2 diabetes', 'type 1 diabetes', 'e11', 'e10']); },
    compliant: function(p) {
      var lab = _qmLatestLabDate(p, 'microalbumin');
      if (!lab) lab = _qmLatestLabDate(p, 'urine albumin');
      if (!lab) return _qmHasScreening(p, ['nephropathy', 'microalbumin', 'urine albumin'], 365);
      return _qmWithinDays(lab, 365);
    },
    action: 'Order urine microalbumin/creatinine ratio.'
  },
  {
    id: 'htn-bp-control',
    name: 'Hypertension: BP < 140/90',
    category: 'Hypertension',
    description: 'Hypertensive patients with latest BP reading below 140/90 mmHg.',
    eligible: function(p) { return _qmHasDiagnosis(p, ['hypertension', 'htn', 'i10', 'high blood pressure', 'essential hypertension']); },
    compliant: function(p) {
      var v = getLatestVitalsByPatient(p.id);
      if (!v || !v.vitals) return false;
      var sys = parseFloat(v.vitals.bpSystolic);
      var dia = parseFloat(v.vitals.bpDiastolic);
      return !isNaN(sys) && !isNaN(dia) && sys < 140 && dia < 90;
    },
    action: 'Recheck BP; consider medication titration.'
  },
  {
    id: 'bcs-mammogram',
    name: 'Breast Cancer: Mammogram',
    category: 'Cancer Screening',
    description: 'Women 50-74 with mammogram within past 2 years.',
    eligible: function(p) {
      var age = _qmAge(p);
      return (p.sex || '').toLowerCase() === 'female' && age >= 50 && age <= 74;
    },
    compliant: function(p) {
      return _qmHasScreening(p, ['mammogram', 'mammography', 'breast imaging', 'breast screening'], 730) ||
             _qmHasImagingMatch(p, ['mammogram', 'mammography', 'breast'], 730);
    },
    action: 'Order screening mammogram.'
  },
  {
    id: 'crc-colonoscopy',
    name: 'Colorectal Cancer: Colonoscopy',
    category: 'Cancer Screening',
    description: 'Adults 50-75 with colonoscopy within past 10 years.',
    eligible: function(p) {
      var age = _qmAge(p);
      return age >= 50 && age <= 75;
    },
    compliant: function(p) {
      return _qmHasScreening(p, ['colonoscopy', 'colorectal', 'colon cancer'], 3650);
    },
    action: 'Refer for screening colonoscopy.'
  },
  {
    id: 'cervical-pap',
    name: 'Cervical Cancer: Pap Smear',
    category: 'Cancer Screening',
    description: 'Women 21-65 with Pap smear within past 3 years.',
    eligible: function(p) {
      var age = _qmAge(p);
      return (p.sex || '').toLowerCase() === 'female' && age >= 21 && age <= 65;
    },
    compliant: function(p) {
      return _qmHasScreening(p, ['pap', 'pap smear', 'cervical', 'cervical cancer'], 1095);
    },
    action: 'Order Pap smear / cervical cancer screening.'
  },
  {
    id: 'depression-phq9',
    name: 'Depression Screening: PHQ-9',
    category: 'Behavioral Health',
    description: 'PHQ-9 depression screening documented within past year.',
    eligible: function(p) { var age = _qmAge(p); return age >= 18; },
    compliant: function(p) {
      return _qmHasScreening(p, ['phq-9', 'phq9', 'depression screening', 'depression screen'], 365);
    },
    action: 'Administer PHQ-9 depression screening.'
  },
  {
    id: 'bmi-screening',
    name: 'BMI Screening',
    category: 'Preventive',
    description: 'BMI documented within past year with follow-up if abnormal.',
    eligible: function(p) { var age = _qmAge(p); return age >= 18; },
    compliant: function(p) {
      var v = getLatestVitalsByPatient(p.id);
      if (!v || !v.vitals) return false;
      var w = parseFloat(v.vitals.weightLbs);
      var h = parseFloat(v.vitals.heightIn);
      if (!w || !h) return false;
      var enc = v.encounter;
      if (!enc) return false;
      var dt = new Date(enc.dateTime || enc.createdAt);
      return _qmWithinDays(dt, 365);
    },
    action: 'Document weight/height; create follow-up plan if BMI abnormal.'
  },
  {
    id: 'tobacco-screening',
    name: 'Tobacco Screening & Cessation',
    category: 'Preventive',
    description: 'Tobacco use screening documented with cessation counseling if applicable.',
    eligible: function(p) { var age = _qmAge(p); return age >= 18; },
    compliant: function(p) {
      var sh = getSocialHistory(p.id);
      return sh && (sh.smokingStatus || sh.tobaccoUse) && (sh.smokingStatus !== '' || sh.tobaccoUse !== '');
    },
    action: 'Document smoking/tobacco status; provide cessation resources if positive.'
  }
];

/* ---------- Helpers ---------- */

function _qmAge(patient) {
  if (!patient.dob) return 0;
  var d = new Date(patient.dob + 'T00:00:00');
  if (isNaN(d)) return 0;
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function _qmHasDiagnosis(patient, terms) {
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

function _qmLatestLab(patient, labName) {
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

function _qmLatestLabDate(patient, labName) {
  var results = getLabResults(patient.id);
  var ln = labName.toLowerCase();
  for (var i = 0; i < results.length; i++) {
    var tests = results[i].tests || [];
    for (var j = 0; j < tests.length; j++) {
      if ((tests[j].name || '').toLowerCase().indexOf(ln) >= 0) {
        return new Date(results[i].resultDate);
      }
    }
  }
  return null;
}

function _qmWithinDays(date, days) {
  if (!date) return false;
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

function _qmHasScreening(patient, terms, maxDays) {
  var screenings = getScreeningRecords(patient.id);
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);
  return screenings.some(function(s) {
    var name = (s.screening || '').toLowerCase();
    var matched = terms.some(function(t) { return name.indexOf(t.toLowerCase()) >= 0; });
    if (!matched) return false;
    if (!s.completedDate) return false;
    return new Date(s.completedDate) >= cutoff;
  });
}

function _qmHasImagingMatch(patient, terms, maxDays) {
  var results = getImagingResults(patient.id);
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);
  return results.some(function(r) {
    var study = (r.studyType || '').toLowerCase();
    var body = (r.bodyRegion || '').toLowerCase();
    var matched = terms.some(function(t) { var tl = t.toLowerCase(); return study.indexOf(tl) >= 0 || body.indexOf(tl) >= 0; });
    if (!matched) return false;
    return new Date(r.resultDate) >= cutoff;
  });
}

/* ---------- Data Layer ---------- */

function _qmGetTrendData() {
  return loadAll(KEYS.qualitySnapshots);
}

function _qmSaveTrendSnapshot(snapshot) {
  var all = loadAll(KEYS.qualitySnapshots, true);
  all.push(Object.assign({
    id: generateId(),
    date: new Date().toISOString(),
    measures: {}
  }, snapshot));
  // Keep last 20 snapshots
  if (all.length > 20) all.splice(0, all.length - 20);
  saveAll(KEYS.qualitySnapshots, all);
}

/* ---------- Calculation Engine ---------- */

function _qmCalcAll() {
  var patients = getPatients();
  var results = [];
  QM_MEASURES.forEach(function(m) {
    var eligible = [];
    var compliant = [];
    var gaps = [];
    patients.forEach(function(p) {
      if (m.eligible(p)) {
        eligible.push(p);
        if (m.compliant(p)) {
          compliant.push(p);
        } else {
          gaps.push(p);
        }
      }
    });
    var rate = eligible.length > 0 ? (compliant.length / eligible.length * 100) : 0;
    results.push({
      id: m.id,
      name: m.name,
      category: m.category,
      description: m.description,
      action: m.action,
      eligibleCount: eligible.length,
      compliantCount: compliant.length,
      rate: rate,
      gaps: gaps
    });
  });
  return results;
}

/* ---------- View State ---------- */
var _qmResults = null;
var _qmSelectedMeasure = null;
var _qmSelectedCategory = 'all';

/* ---------- View Layer ---------- */

function renderQualityMeasures() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Quality Measures', meta: 'HEDIS/MIPS/Star Rating', actions: '' });
  setActiveNav('quality-measures');

  _qmResults = _qmCalcAll();
  _qmSelectedMeasure = null;

  var container = document.createElement('div');
  container.className = 'qm-container';

  // Overall score
  var totalEligible = 0;
  var totalCompliant = 0;
  _qmResults.forEach(function(r) {
    totalEligible += r.eligibleCount;
    totalCompliant += r.compliantCount;
  });
  var overallRate = totalEligible > 0 ? (totalCompliant / totalEligible * 100) : 0;

  var scoreCard = document.createElement('div');
  scoreCard.className = 'qm-overall-score';
  scoreCard.innerHTML =
    '<div class="qm-score-gauge">' +
      '<div class="qm-gauge-circle" style="--pct:' + overallRate.toFixed(0) + '">' +
        '<span class="qm-gauge-value">' + overallRate.toFixed(1) + '%</span>' +
        '<span class="qm-gauge-label">Overall Compliance</span>' +
      '</div>' +
    '</div>' +
    '<div class="qm-score-stats">' +
      '<div class="qm-stat-item"><span class="qm-stat-num">' + _qmResults.length + '</span><span class="qm-stat-label">Measures Tracked</span></div>' +
      '<div class="qm-stat-item"><span class="qm-stat-num">' + totalEligible + '</span><span class="qm-stat-label">Eligible Patients</span></div>' +
      '<div class="qm-stat-item"><span class="qm-stat-num">' + totalCompliant + '</span><span class="qm-stat-label">Compliant</span></div>' +
      '<div class="qm-stat-item"><span class="qm-stat-num">' + (totalEligible - totalCompliant) + '</span><span class="qm-stat-label">Gaps</span></div>' +
    '</div>' +
    '<div class="qm-score-actions">' +
      '<button class="btn btn-sm qm-btn-outline" id="qm-snapshot-btn">Save Snapshot</button>' +
      '<button class="btn btn-sm qm-btn-outline" id="qm-trend-btn">View Trends</button>' +
    '</div>';
  container.appendChild(scoreCard);

  // Category filter
  var categories = ['all'];
  _qmResults.forEach(function(r) {
    if (categories.indexOf(r.category) < 0) categories.push(r.category);
  });
  var filterBar = document.createElement('div');
  filterBar.className = 'qm-filter-bar';
  categories.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.className = 'qm-filter-btn' + (_qmSelectedCategory === cat ? ' active' : '');
    btn.textContent = cat === 'all' ? 'All Measures' : cat;
    btn.addEventListener('click', function() {
      _qmSelectedCategory = cat;
      _qmRenderMeasureList();
    });
    filterBar.appendChild(btn);
  });
  container.appendChild(filterBar);

  // Measures grid
  var measuresGrid = document.createElement('div');
  measuresGrid.className = 'qm-measures-grid';
  measuresGrid.id = 'qm-measures-grid';
  container.appendChild(measuresGrid);

  // Drill-down panel
  var drillPanel = document.createElement('div');
  drillPanel.className = 'qm-drill-panel hidden';
  drillPanel.id = 'qm-drill-panel';
  container.appendChild(drillPanel);

  app.appendChild(container);

  _qmRenderMeasureList();

  // Wire buttons
  document.getElementById('qm-snapshot-btn').addEventListener('click', function() {
    var snapshot = { measures: {} };
    _qmResults.forEach(function(r) {
      snapshot.measures[r.id] = { rate: r.rate, eligible: r.eligibleCount, compliant: r.compliantCount };
    });
    _qmSaveTrendSnapshot(snapshot);
    showToast('Quality snapshot saved.', 'success');
  });

  document.getElementById('qm-trend-btn').addEventListener('click', _qmShowTrends);
}

function _qmRenderMeasureList() {
  var grid = document.getElementById('qm-measures-grid');
  if (!grid) return;
  grid.innerHTML = '';

  var filtered = _qmResults;
  if (_qmSelectedCategory !== 'all') {
    filtered = _qmResults.filter(function(r) { return r.category === _qmSelectedCategory; });
  }

  // Update filter buttons
  document.querySelectorAll('.qm-filter-btn').forEach(function(btn) {
    var cat = btn.textContent === 'All Measures' ? 'all' : btn.textContent;
    btn.classList.toggle('active', cat === _qmSelectedCategory);
  });

  filtered.forEach(function(r) {
    var card = document.createElement('div');
    card.className = 'qm-measure-card';

    var rateClass = r.rate >= 80 ? 'qm-rate-good' : r.rate >= 60 ? 'qm-rate-warning' : 'qm-rate-danger';
    var gapCount = r.eligibleCount - r.compliantCount;

    card.innerHTML =
      '<div class="qm-measure-header">' +
        '<div class="qm-measure-name">' + esc(r.name) + '</div>' +
        '<span class="qm-measure-cat">' + esc(r.category) + '</span>' +
      '</div>' +
      '<div class="qm-measure-bar-wrap">' +
        '<div class="qm-measure-bar"><div class="qm-measure-bar-fill ' + rateClass + '" style="width:' + Math.min(r.rate, 100).toFixed(0) + '%"></div></div>' +
        '<span class="qm-measure-rate ' + rateClass + '">' + r.rate.toFixed(1) + '%</span>' +
      '</div>' +
      '<div class="qm-measure-nums">' +
        '<span>' + r.compliantCount + ' / ' + r.eligibleCount + ' compliant</span>' +
        '<span class="qm-measure-gaps">' + gapCount + ' gap' + (gapCount !== 1 ? 's' : '') + '</span>' +
      '</div>';

    card.addEventListener('click', function() {
      _qmSelectedMeasure = r;
      _qmRenderDrillDown(r);
    });

    grid.appendChild(card);
  });
}

function _qmRenderDrillDown(measure) {
  var panel = document.getElementById('qm-drill-panel');
  if (!panel) return;
  panel.classList.remove('hidden');
  panel.innerHTML = '';

  var header = document.createElement('div');
  header.className = 'qm-drill-header';
  header.innerHTML =
    '<div>' +
      '<h3>' + esc(measure.name) + '</h3>' +
      '<p class="qm-drill-desc">' + esc(measure.description) + '</p>' +
    '</div>' +
    '<button class="qm-drill-close" id="qm-drill-close">&times;</button>';
  panel.appendChild(header);

  var actionBar = document.createElement('div');
  actionBar.className = 'qm-drill-action';
  actionBar.innerHTML = '<strong>Recommended Action:</strong> ' + esc(measure.action);
  panel.appendChild(actionBar);

  // Gap patient list
  if (measure.gaps.length === 0) {
    var noGaps = document.createElement('div');
    noGaps.className = 'qm-no-gaps';
    noGaps.textContent = 'All eligible patients are compliant!';
    panel.appendChild(noGaps);
  } else {
    var exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-sm qm-btn-outline';
    exportBtn.textContent = 'Export Gap List CSV';
    exportBtn.style.marginBottom = '12px';
    exportBtn.addEventListener('click', function() { _qmExportGaps(measure); });
    panel.appendChild(exportBtn);

    var table = document.createElement('table');
    table.className = 'qm-drill-table';
    table.innerHTML =
      '<thead><tr>' +
        '<th>Patient</th><th>MRN</th><th>Age</th><th>Sex</th><th>Phone</th><th>Action</th>' +
      '</tr></thead>';
    var tbody = document.createElement('tbody');
    measure.gaps.forEach(function(p) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="qm-drill-name">' + esc(p.lastName + ', ' + p.firstName) + '</td>' +
        '<td>' + esc(p.mrn || '--') + '</td>' +
        '<td>' + _qmAge(p) + '</td>' +
        '<td>' + esc(p.sex || '--') + '</td>' +
        '<td>' + esc(p.phone || '--') + '</td>' +
        '<td><button class="btn btn-sm btn-primary qm-chart-btn" data-pid="' + esc(p.id) + '">Open Chart</button></td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    panel.appendChild(table);

    panel.querySelectorAll('.qm-chart-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        navigate('#chart/' + btn.dataset.pid);
      });
    });
  }

  document.getElementById('qm-drill-close').addEventListener('click', function() {
    panel.classList.add('hidden');
  });

  panel.scrollIntoView({ behavior: 'smooth' });
}

function _qmShowTrends() {
  var snapshots = _qmGetTrendData();
  if (snapshots.length === 0) {
    showToast('No trend data yet. Save a snapshot first.', 'warning');
    return;
  }

  var body = '<div class="qm-trend-chart">';
  // Show last 8 snapshots as a simple table
  var recent = snapshots.slice(-8);
  body += '<table class="qm-drill-table"><thead><tr><th>Date</th>';
  QM_MEASURES.forEach(function(m) {
    body += '<th>' + esc(m.name.split(':')[0]) + '</th>';
  });
  body += '</tr></thead><tbody>';
  recent.forEach(function(s) {
    body += '<tr><td>' + esc(formatDateTime(s.date)) + '</td>';
    QM_MEASURES.forEach(function(m) {
      var d = s.measures[m.id];
      var rate = d ? d.rate.toFixed(1) + '%' : '--';
      var cls = d ? (d.rate >= 80 ? 'qm-rate-good' : d.rate >= 60 ? 'qm-rate-warning' : 'qm-rate-danger') : '';
      body += '<td class="' + cls + '">' + rate + '</td>';
    });
    body += '</tr>';
  });
  body += '</tbody></table></div>';

  openModal({
    title: 'Quality Measure Trends',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-sm" onclick="closeModal()">Close</button>',
    size: 'lg'
  });
}

function _qmExportGaps(measure) {
  var rows = [['Patient', 'MRN', 'Age', 'Sex', 'Phone', 'Recommended Action']];
  measure.gaps.forEach(function(p) {
    rows.push([
      (p.lastName || '') + ', ' + (p.firstName || ''),
      p.mrn || '',
      String(_qmAge(p)),
      p.sex || '',
      p.phone || '',
      measure.action
    ]);
  });
  var csv = rows.map(function(r) {
    return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'quality_gaps_' + measure.id + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Exported ' + measure.gaps.length + ' gap patients.', 'success');
}
