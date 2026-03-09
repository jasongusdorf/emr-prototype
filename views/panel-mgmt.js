/* ============================================================
   views/panel-mgmt.js — Panel Management
   Provider patient panel overview, outreach lists, bulk actions
   ============================================================ */

/* ---------- Outreach List Definitions ---------- */

var PANEL_OUTREACH_LISTS = [
  {
    id: 'mammogram-overdue',
    name: 'Overdue for Mammogram',
    description: 'Women 50-74 with no mammogram in 2+ years.',
    icon: 'M',
    color: '#c05621',
    match: function(p) {
      var age = _pmAge(p);
      if ((p.sex || '').toLowerCase() !== 'female' || age < 50 || age > 74) return null;
      var last = _pmLastScreeningDate(p, ['mammogram', 'mammography', 'breast imaging', 'breast screening']);
      if (!last) last = _pmLastImagingDate(p, ['mammogram', 'mammography', 'breast']);
      if (!last) return { daysOverdue: 999, lastDate: null };
      var daysSince = Math.floor((new Date() - last) / 86400000);
      if (daysSince > 730) return { daysOverdue: daysSince - 730, lastDate: last };
      return null;
    }
  },
  {
    id: 'a1c-overdue',
    name: 'A1c Not Checked in 6 Months',
    description: 'Diabetic patients without HbA1c in past 6 months.',
    icon: 'A',
    color: '#9b2c2c',
    match: function(p) {
      if (!_pmHasDx(p, ['diabetes', 'type 2 diabetes', 'type 1 diabetes', 'e11', 'e10'])) return null;
      var last = _pmLastLabDate(p, 'hba1c');
      if (!last) return { daysOverdue: 999, lastDate: null };
      var daysSince = Math.floor((new Date() - last) / 86400000);
      if (daysSince > 180) return { daysOverdue: daysSince - 180, lastDate: last };
      return null;
    }
  },
  {
    id: 'awv-due',
    name: 'Annual Wellness Visit Due',
    description: 'Patients without a wellness visit in 12+ months.',
    icon: 'W',
    color: '#276749',
    match: function(p) {
      var last = _pmLastVisitDate(p);
      if (!last) return { daysOverdue: 999, lastDate: null };
      var daysSince = Math.floor((new Date() - last) / 86400000);
      if (daysSince > 365) return { daysOverdue: daysSince - 365, lastDate: last };
      return null;
    }
  },
  {
    id: 'immunizations-due',
    name: 'Immunizations Due',
    description: 'Patients with overdue immunizations based on age/schedule.',
    icon: 'I',
    color: '#6b46c1',
    match: function(p) {
      var age = _pmAge(p);
      // Check common vaccines
      var overdue = [];
      // Flu - annual
      var flu = _pmLastImmunDate(p, ['influenza', 'flu']);
      if (!flu || Math.floor((new Date() - flu) / 86400000) > 365) overdue.push('Flu');
      // Tdap - every 10 years for adults
      if (age >= 18) {
        var tdap = _pmLastImmunDate(p, ['tdap', 'tetanus', 'td']);
        if (!tdap || Math.floor((new Date() - tdap) / 86400000) > 3650) overdue.push('Tdap');
      }
      // Shingrix - 50+
      if (age >= 50) {
        var zoster = _pmLastImmunDate(p, ['zoster', 'shingrix', 'shingles']);
        if (!zoster) overdue.push('Shingrix');
      }
      // Pneumococcal - 65+
      if (age >= 65) {
        var pneumo = _pmLastImmunDate(p, ['pneumococcal', 'prevnar', 'pneumovax']);
        if (!pneumo) overdue.push('Pneumococcal');
      }
      if (overdue.length === 0) return null;
      return { daysOverdue: 0, lastDate: null, detail: overdue.join(', ') };
    }
  },
  {
    id: 'lost-to-followup',
    name: 'Lost to Follow-Up',
    description: 'Patients with no visit in 12+ months.',
    icon: 'L',
    color: '#2c7a7b',
    match: function(p) {
      var last = _pmLastVisitDate(p);
      if (!last) return { daysOverdue: 999, lastDate: null };
      var daysSince = Math.floor((new Date() - last) / 86400000);
      if (daysSince > 365) return { daysOverdue: daysSince - 365, lastDate: last };
      return null;
    }
  }
];

/* ---------- Helpers ---------- */

function _pmAge(patient) {
  if (!patient.dob) return 0;
  var d = new Date(patient.dob + 'T00:00:00');
  if (isNaN(d)) return 0;
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function _pmHasDx(patient, terms) {
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

function _pmLastScreeningDate(patient, terms) {
  var screenings = getScreeningRecords(patient.id);
  for (var i = 0; i < screenings.length; i++) {
    var name = (screenings[i].screening || '').toLowerCase();
    var matched = terms.some(function(t) { return name.indexOf(t.toLowerCase()) >= 0; });
    if (matched && screenings[i].completedDate) return new Date(screenings[i].completedDate);
  }
  return null;
}

function _pmLastImagingDate(patient, terms) {
  var results = getImagingResults(patient.id);
  for (var i = 0; i < results.length; i++) {
    var study = (results[i].studyType || '').toLowerCase();
    var matched = terms.some(function(t) { return study.indexOf(t.toLowerCase()) >= 0; });
    if (matched) return new Date(results[i].resultDate);
  }
  return null;
}

function _pmLastLabDate(patient, labName) {
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

function _pmLastVisitDate(patient) {
  var encounters = typeof getEncountersByPatient === 'function'
    ? getEncountersByPatient(patient.id)
    : getEncounters().filter(function(e) { return e.patientId === patient.id; });
  if (encounters.length === 0) return null;
  var sorted = encounters.sort(function(a, b) { return new Date(b.dateTime || b.createdAt) - new Date(a.dateTime || a.createdAt); });
  return new Date(sorted[0].dateTime || sorted[0].createdAt);
}

function _pmLastImmunDate(patient, terms) {
  var immuns = getImmunizations(patient.id);
  for (var i = 0; i < immuns.length; i++) {
    var vax = (immuns[i].vaccine || '').toLowerCase();
    var matched = terms.some(function(t) { return vax.indexOf(t.toLowerCase()) >= 0; });
    if (matched && immuns[i].date) return new Date(immuns[i].date);
  }
  return null;
}

/* ---------- View State ---------- */
var _pmSelectedList = null;
var _pmOutreachData = [];
var _pmPanelPatients = [];
var _pmContactedIds = {};

/* ---------- View Layer ---------- */

function renderPanelMgmt() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Panel Management', meta: 'Patient Panel Overview', actions: '' });
  setActiveNav('panel-mgmt');

  _pmSelectedList = null;
  _pmContactedIds = {};
  _pmPanelPatients = getPatients();

  var container = document.createElement('div');
  container.className = 'pm-container';

  // Panel statistics
  var statsSection = document.createElement('div');
  statsSection.className = 'pm-stats-section';
  _pmRenderPanelStats(statsSection);
  container.appendChild(statsSection);

  // Outreach list cards
  var outreachSection = document.createElement('div');
  outreachSection.className = 'pm-outreach-section';
  outreachSection.innerHTML = '<h3 class="pm-section-title">Outreach Lists</h3>';

  var cardsWrap = document.createElement('div');
  cardsWrap.className = 'pm-outreach-cards';

  PANEL_OUTREACH_LISTS.forEach(function(list) {
    var matched = _pmPanelPatients.filter(function(p) { return list.match(p) !== null; });
    var card = document.createElement('div');
    card.className = 'pm-outreach-card';
    card.innerHTML =
      '<div class="pm-outreach-icon" style="background:' + list.color + '">' + esc(list.icon) + '</div>' +
      '<div class="pm-outreach-info">' +
        '<div class="pm-outreach-name">' + esc(list.name) + '</div>' +
        '<div class="pm-outreach-desc">' + esc(list.description) + '</div>' +
        '<div class="pm-outreach-count">' + matched.length + ' patient' + (matched.length !== 1 ? 's' : '') + '</div>' +
      '</div>';
    card.addEventListener('click', function() {
      _pmSelectedList = list;
      _pmOutreachData = matched.map(function(p) {
        var result = list.match(p);
        return { patient: p, daysOverdue: result.daysOverdue, lastDate: result.lastDate, detail: result.detail || '' };
      }).sort(function(a, b) { return b.daysOverdue - a.daysOverdue; });
      _pmRenderOutreachList();
    });
    cardsWrap.appendChild(card);
  });

  outreachSection.appendChild(cardsWrap);
  container.appendChild(outreachSection);

  // Outreach detail area
  var detailArea = document.createElement('div');
  detailArea.className = 'pm-detail-area hidden';
  detailArea.id = 'pm-detail-area';
  container.appendChild(detailArea);

  app.appendChild(container);
}

function _pmRenderPanelStats(container) {
  var patients = _pmPanelPatients;
  var total = patients.length;

  // Age distribution
  var ageBuckets = { '0-17': 0, '18-34': 0, '35-49': 0, '50-64': 0, '65-74': 0, '75+': 0 };
  var sexDist = { Male: 0, Female: 0, Other: 0 };
  var insurDist = {};
  var chronicCounts = { 'Diabetes': 0, 'Hypertension': 0, 'Heart Failure': 0, 'COPD': 0, 'CKD': 0, 'Depression': 0 };

  patients.forEach(function(p) {
    var age = _pmAge(p);
    if (age < 18) ageBuckets['0-17']++;
    else if (age < 35) ageBuckets['18-34']++;
    else if (age < 50) ageBuckets['35-49']++;
    else if (age < 65) ageBuckets['50-64']++;
    else if (age < 75) ageBuckets['65-74']++;
    else ageBuckets['75+']++;

    var sex = (p.sex || 'Other');
    if (!sexDist[sex]) sexDist[sex] = 0;
    sexDist[sex]++;

    var ins = p.insurance || 'Uninsured';
    if (!insurDist[ins]) insurDist[ins] = 0;
    insurDist[ins]++;

    if (_pmHasDx(p, ['diabetes', 'e11', 'e10'])) chronicCounts['Diabetes']++;
    if (_pmHasDx(p, ['hypertension', 'htn', 'i10'])) chronicCounts['Hypertension']++;
    if (_pmHasDx(p, ['heart failure', 'chf', 'i50'])) chronicCounts['Heart Failure']++;
    if (_pmHasDx(p, ['copd', 'j44'])) chronicCounts['COPD']++;
    if (_pmHasDx(p, ['chronic kidney', 'ckd', 'n18'])) chronicCounts['CKD']++;
    if (_pmHasDx(p, ['depression', 'f32', 'f33'])) chronicCounts['Depression']++;
  });

  container.innerHTML =
    '<h3 class="pm-section-title">Panel Statistics</h3>' +
    '<div class="pm-stats-grid">' +
      '<div class="pm-stat-card pm-stat-total">' +
        '<span class="pm-stat-num">' + total + '</span>' +
        '<span class="pm-stat-label">Total Patients</span>' +
      '</div>' +
      '<div class="pm-stat-card">' +
        '<span class="pm-stat-title">Age Distribution</span>' +
        _pmRenderBarStats(ageBuckets, total) +
      '</div>' +
      '<div class="pm-stat-card">' +
        '<span class="pm-stat-title">Sex</span>' +
        _pmRenderBarStats(sexDist, total) +
      '</div>' +
      '<div class="pm-stat-card">' +
        '<span class="pm-stat-title">Payer Mix</span>' +
        _pmRenderBarStats(insurDist, total) +
      '</div>' +
      '<div class="pm-stat-card">' +
        '<span class="pm-stat-title">Chronic Conditions</span>' +
        _pmRenderBarStats(chronicCounts, total) +
      '</div>' +
    '</div>';
}

function _pmRenderBarStats(buckets, total) {
  var html = '<div class="pm-bar-stats">';
  var keys = Object.keys(buckets).sort(function(a, b) { return buckets[b] - buckets[a]; });
  keys.forEach(function(key) {
    var count = buckets[key];
    var pct = total > 0 ? (count / total * 100) : 0;
    html += '<div class="pm-bar-row">' +
      '<span class="pm-bar-label">' + esc(key) + '</span>' +
      '<div class="pm-bar-track"><div class="pm-bar-fill" style="width:' + pct.toFixed(0) + '%"></div></div>' +
      '<span class="pm-bar-value">' + count + ' (' + pct.toFixed(0) + '%)</span>' +
    '</div>';
  });
  html += '</div>';
  return html;
}

function _pmRenderOutreachList() {
  var area = document.getElementById('pm-detail-area');
  if (!area || !_pmSelectedList) return;
  area.classList.remove('hidden');
  area.innerHTML = '';

  var list = _pmSelectedList;

  // Header
  var header = document.createElement('div');
  header.className = 'pm-detail-header';
  header.innerHTML =
    '<div class="pm-detail-title">' +
      '<button class="btn btn-sm qm-btn-outline" id="pm-back-btn">Back</button>' +
      '<h3>' + esc(list.name) + '</h3>' +
      '<span class="pm-detail-count">' + _pmOutreachData.length + ' patients</span>' +
    '</div>' +
    '<div class="pm-detail-actions">' +
      '<button class="btn btn-sm qm-btn-outline" id="pm-export-btn">Export CSV</button>' +
      '<button class="btn btn-sm qm-btn-outline" id="pm-letter-btn">Generate Letters</button>' +
      '<button class="btn btn-sm btn-primary" id="pm-bulk-contact-btn">Mark All Contacted</button>' +
    '</div>';
  area.appendChild(header);

  // Table
  var tableWrap = document.createElement('div');
  tableWrap.className = 'pm-table-wrap';

  if (_pmOutreachData.length === 0) {
    tableWrap.innerHTML = '<div class="qm-no-gaps">No patients match this outreach criteria.</div>';
  } else {
    var table = document.createElement('table');
    table.className = 'pm-table';
    table.innerHTML =
      '<thead><tr>' +
        '<th><input type="checkbox" id="pm-select-all" /></th>' +
        '<th>Patient</th><th>MRN</th><th>Age</th><th>Phone</th>' +
        '<th>Last Relevant Date</th><th>Days Overdue</th>' +
        (list.id === 'immunizations-due' ? '<th>Details</th>' : '') +
        '<th>Status</th><th>Actions</th>' +
      '</tr></thead>';
    var tbody = document.createElement('tbody');

    _pmOutreachData.forEach(function(d, idx) {
      var p = d.patient;
      var contacted = _pmContactedIds[p.id];
      var tr = document.createElement('tr');
      tr.className = contacted ? 'pm-row-contacted' : '';
      tr.innerHTML =
        '<td><input type="checkbox" class="pm-select-cb" data-idx="' + idx + '" /></td>' +
        '<td class="pm-name-cell">' + esc(p.lastName + ', ' + p.firstName) + '</td>' +
        '<td>' + esc(p.mrn || '--') + '</td>' +
        '<td>' + _pmAge(p) + '</td>' +
        '<td>' + esc(p.phone || '--') + '</td>' +
        '<td>' + (d.lastDate ? formatDateTime(d.lastDate.toISOString()) : 'Never') + '</td>' +
        '<td class="pm-overdue-cell">' + (d.daysOverdue === 999 ? 'Never done' : d.daysOverdue + ' days') + '</td>' +
        (list.id === 'immunizations-due' ? '<td>' + esc(d.detail) + '</td>' : '') +
        '<td>' + (contacted ? '<span class="pm-contacted-badge">Contacted</span>' : '<span class="pm-pending-badge">Pending</span>') + '</td>' +
        '<td>' +
          '<button class="btn btn-sm btn-primary pm-chart-btn" data-pid="' + esc(p.id) + '">Chart</button> ' +
          '<button class="btn btn-sm qm-btn-outline pm-contact-btn" data-pid="' + esc(p.id) + '">' + (contacted ? 'Undo' : 'Contacted') + '</button>' +
        '</td>';
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
  }

  area.appendChild(tableWrap);

  // Wire events
  document.getElementById('pm-back-btn').addEventListener('click', function() {
    area.classList.add('hidden');
    _pmSelectedList = null;
  });

  document.getElementById('pm-export-btn').addEventListener('click', function() { _pmExportOutreach(); });
  document.getElementById('pm-letter-btn').addEventListener('click', function() { _pmGenerateLetters(); });
  document.getElementById('pm-bulk-contact-btn').addEventListener('click', function() {
    _pmOutreachData.forEach(function(d) { _pmContactedIds[d.patient.id] = true; });
    _pmRenderOutreachList();
    showToast('All patients marked as contacted.', 'success');
  });

  var selectAll = document.getElementById('pm-select-all');
  if (selectAll) {
    selectAll.addEventListener('change', function() {
      var checked = selectAll.checked;
      area.querySelectorAll('.pm-select-cb').forEach(function(cb) { cb.checked = checked; });
    });
  }

  area.querySelectorAll('.pm-chart-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigate('#chart/' + btn.dataset.pid);
    });
  });

  area.querySelectorAll('.pm-contact-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var pid = btn.dataset.pid;
      if (_pmContactedIds[pid]) {
        delete _pmContactedIds[pid];
      } else {
        _pmContactedIds[pid] = true;
      }
      _pmRenderOutreachList();
    });
  });

  area.scrollIntoView({ behavior: 'smooth' });
}

function _pmExportOutreach() {
  if (!_pmSelectedList || _pmOutreachData.length === 0) {
    showToast('No data to export.', 'warning');
    return;
  }
  var list = _pmSelectedList;
  var rows = [['Patient', 'MRN', 'Age', 'Phone', 'Last Date', 'Days Overdue', 'Status']];
  _pmOutreachData.forEach(function(d) {
    var p = d.patient;
    rows.push([
      (p.lastName || '') + ', ' + (p.firstName || ''),
      p.mrn || '',
      String(_pmAge(p)),
      p.phone || '',
      d.lastDate ? d.lastDate.toISOString().slice(0, 10) : 'Never',
      String(d.daysOverdue),
      _pmContactedIds[p.id] ? 'Contacted' : 'Pending'
    ]);
  });
  var csv = rows.map(function(r) {
    return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'outreach_' + list.id + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Exported ' + _pmOutreachData.length + ' patients.', 'success');
}

function _pmGenerateLetters() {
  if (!_pmSelectedList || _pmOutreachData.length === 0) {
    showToast('No patients selected.', 'warning');
    return;
  }

  var selected = [];
  var checkboxes = document.querySelectorAll('.pm-select-cb:checked');
  if (checkboxes.length > 0) {
    checkboxes.forEach(function(cb) {
      var idx = parseInt(cb.dataset.idx, 10);
      if (_pmOutreachData[idx]) selected.push(_pmOutreachData[idx]);
    });
  }
  if (selected.length === 0) selected = _pmOutreachData;

  var body =
    '<p>Generate reminder letters for <strong>' + selected.length + '</strong> patients:</p>' +
    '<div style="margin-bottom:12px">' +
      '<label>Letter Template</label>' +
      '<select id="pm-letter-template" class="form-control">' +
        '<option value="reminder">Appointment Reminder</option>' +
        '<option value="screening">Screening Due Notice</option>' +
        '<option value="followup">Follow-Up Request</option>' +
        '<option value="wellness">Annual Wellness Visit</option>' +
      '</select>' +
    '</div>' +
    '<div style="max-height:250px;overflow:auto">' +
    '<table class="qm-drill-table"><thead><tr><th>Patient</th><th>Address</th></tr></thead><tbody>';
  selected.forEach(function(d) {
    var p = d.patient;
    var addr = [p.addressStreet, p.addressCity, p.addressState, p.addressZip].filter(Boolean).join(', ') || 'No address on file';
    body += '<tr><td>' + esc(p.lastName + ', ' + p.firstName) + '</td><td>' + esc(addr) + '</td></tr>';
  });
  body += '</tbody></table></div>';

  openModal({
    title: 'Generate Reminder Letters',
    bodyHTML: body,
    footerHTML:
      '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary btn-sm" id="pm-letter-confirm">Generate</button>',
    size: 'lg'
  });

  setTimeout(function() {
    var confirmBtn = document.getElementById('pm-letter-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        closeModal();
        showToast('Generated ' + selected.length + ' reminder letters.', 'success');
      });
    }
  }, 100);
}
