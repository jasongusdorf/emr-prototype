/* ============================================================
   views/slicer.js — SlicerDicer / Population Analytics
   ============================================================ */

/* ---------- Color Palette ---------- */
var SLICER_COLORS = [
  '#2b6cb0', '#c05621', '#276749', '#9b2c2c', '#6b46c1',
  '#2c7a7b', '#b7791f', '#702459', '#2d3748', '#38a169'
];

/* ---------- Data Layer ---------- */

function getSavedQueries() {
  return loadAll(KEYS.slicerQueries);
}

function saveQuery(q) {
  var all = loadAll(KEYS.slicerQueries, true);
  var idx = all.findIndex(function(x) { return x.id === q.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], q);
  } else {
    all.push(Object.assign({
      id: generateId(),
      name: '',
      description: '',
      criteria: [],
      groupBy: 'none',
      chartType: 'bar',
      createdBy: getSessionUser() ? getSessionUser().id : '',
      createdAt: new Date().toISOString()
    }, q));
  }
  saveAll(KEYS.slicerQueries, all);
  return all[idx >= 0 ? idx : all.length - 1];
}

function deleteQuery(id) {
  softDeleteRecord(KEYS.slicerQueries, id);
}

/* ---------- Query Engine ---------- */

function _slicerCalcAge(dob) {
  if (!dob) return null;
  var d = new Date(dob + 'T00:00:00');
  if (isNaN(d)) return null;
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function _slicerCalcBMI(weightLbs, heightIn) {
  var w = parseFloat(weightLbs);
  var h = parseFloat(heightIn);
  if (!w || !h || h === 0) return null;
  return (w / (h * h)) * 703;
}

function _slicerParseWithin(value) {
  if (!value) return null;
  if (value === 'never') return 'never';
  var match = value.match(/^(\d+)(d|m|y)$/);
  if (!match) return null;
  var num = parseInt(match[1], 10);
  var unit = match[2];
  var cutoff = new Date();
  if (unit === 'd') cutoff.setDate(cutoff.getDate() - num);
  else if (unit === 'm') cutoff.setMonth(cutoff.getMonth() - num);
  else if (unit === 'y') cutoff.setFullYear(cutoff.getFullYear() - num);
  return cutoff;
}

function _slicerMatchesCriterion(patient, criterion) {
  var field = criterion.field;
  var op = criterion.operator;
  var val = criterion.value;

  if (field === 'age') {
    var age = _slicerCalcAge(patient.dob);
    if (age === null) return false;
    if (op === 'eq') return age === Number(val);
    if (op === 'gte') return age >= Number(val);
    if (op === 'lte') return age <= Number(val);
    if (op === 'between') {
      var parts = String(val).split('-').map(Number);
      return parts.length === 2 && age >= parts[0] && age <= parts[1];
    }
    return false;
  }

  if (field === 'sex') {
    return (patient.sex || '').toLowerCase() === (val || '').toLowerCase();
  }

  if (field === 'diagnosis') {
    var problems = getActiveProblems(patient.id);
    var q = (val || '').toLowerCase();
    if (op === 'eq') return problems.some(function(p) { return (p.name || '').toLowerCase() === q || (p.icd10 || '').toLowerCase() === q; });
    if (op === 'contains') return problems.some(function(p) { return (p.name || '').toLowerCase().indexOf(q) >= 0 || (p.icd10 || '').toLowerCase().indexOf(q) >= 0; });
    return false;
  }

  if (field === 'medication') {
    var meds = getPatientMedications(patient.id);
    var mq = (val || '').toLowerCase();
    return meds.some(function(m) { return (m.name || '').toLowerCase().indexOf(mq) >= 0; });
  }

  if (field === 'allergy') {
    var allergies = getPatientAllergies(patient.id);
    var aq = (val || '').toLowerCase();
    return allergies.some(function(a) { return (a.allergen || '').toLowerCase().indexOf(aq) >= 0; });
  }

  if (field === 'insurance') {
    var ins = (patient.insurance || '').toLowerCase();
    var iq = (val || '').toLowerCase();
    if (op === 'eq') return ins === iq;
    if (op === 'contains') return ins.indexOf(iq) >= 0;
    return false;
  }

  if (field === 'lastVisit') {
    var encounters = typeof getEncountersByPatient === 'function'
      ? getEncountersByPatient(patient.id)
      : getEncounters().filter(function(e) { return e.patientId === patient.id; });
    var sorted = encounters.sort(function(a, b) { return new Date(b.dateTime || b.createdAt) - new Date(a.dateTime || a.createdAt); });
    var lastDate = sorted.length > 0 ? new Date(sorted[0].dateTime || sorted[0].createdAt) : null;

    if (val === 'never') return !lastDate;
    var cutoff = _slicerParseWithin(val);
    if (!cutoff || cutoff === 'never') return !lastDate;
    if (!lastDate) return false;
    return lastDate >= cutoff;
  }

  if (field === 'labValue') {
    var labName = (criterion.labName || '').toLowerCase();
    var labResults = getLabResults(patient.id);
    for (var li = 0; li < labResults.length; li++) {
      var tests = labResults[li].tests || [];
      for (var ti = 0; ti < tests.length; ti++) {
        if ((tests[ti].name || '').toLowerCase() === labName) {
          var numVal = parseFloat(tests[ti].value);
          if (isNaN(numVal)) continue;
          if (op === 'gte') return numVal >= Number(val);
          if (op === 'lte') return numVal <= Number(val);
          return false;
        }
      }
    }
    return false;
  }

  if (field === 'vital') {
    var vitalName = criterion.vitalName;
    var vitalsData = getLatestVitalsByPatient(patient.id);
    if (!vitalsData || !vitalsData.vitals) return false;
    var v = vitalsData.vitals;
    var vitalVal = null;
    if (vitalName === 'systolic') vitalVal = parseFloat(v.bpSystolic);
    else if (vitalName === 'diastolic') vitalVal = parseFloat(v.bpDiastolic);
    else if (vitalName === 'weight') vitalVal = parseFloat(v.weightLbs);
    else if (vitalName === 'bmi') vitalVal = _slicerCalcBMI(v.weightLbs, v.heightIn);
    if (vitalVal === null || isNaN(vitalVal)) return false;
    if (op === 'gte') return vitalVal >= Number(val);
    if (op === 'lte') return vitalVal <= Number(val);
    return false;
  }

  if (field === 'immunization') {
    var immuns = getImmunizations(patient.id);
    var ival = (val || '').toLowerCase();
    var hasIt = immuns.some(function(im) { return (im.vaccine || '').toLowerCase().indexOf(ival) >= 0; });
    if (op === 'has') return hasIt;
    if (op === 'missing') return !hasIt;
    return false;
  }

  return false;
}

function runSlicerQuery(criteria, groupBy) {
  var allPatients = getPatients();
  var total = allPatients.length;
  var matched = allPatients.filter(function(p) {
    return criteria.every(function(c) { return _slicerMatchesCriterion(p, c); });
  });

  var groups = {};
  if (groupBy && groupBy !== 'none') {
    matched.forEach(function(p) {
      var key = _slicerGroupKey(p, groupBy);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
  }

  return { total: total, patients: matched, groups: groups };
}

function _slicerGroupKey(patient, groupBy) {
  if (groupBy === 'age_decade') {
    var age = _slicerCalcAge(patient.dob);
    if (age === null) return 'Unknown';
    var decade = Math.floor(age / 10) * 10;
    return decade + '-' + (decade + 9);
  }
  if (groupBy === 'sex') {
    return patient.sex || 'Unknown';
  }
  if (groupBy === 'insurance') {
    return patient.insurance || 'Unknown';
  }
  if (groupBy === 'provider') {
    var encs = typeof getEncountersByPatient === 'function'
      ? getEncountersByPatient(patient.id)
      : getEncounters().filter(function(e) { return e.patientId === patient.id; });
    if (encs.length === 0) return 'Unassigned';
    var provId = encs[0].providerId;
    if (!provId) return 'Unassigned';
    var prov = getProviders().find(function(pr) { return pr.id === provId; });
    return prov ? (prov.firstName + ' ' + prov.lastName) : 'Unknown';
  }
  if (groupBy === 'diagnosis') {
    var probs = getActiveProblems(patient.id);
    if (probs.length === 0) return 'No Active Diagnosis';
    return probs[0].name || 'Unknown';
  }
  return 'Other';
}

/* ---------- Pre-built Queries ---------- */

var SLICER_PREBUILT_QUERIES = [
  {
    name: 'Diabetic patients overdue for HbA1c',
    description: 'Patients with diabetes who have not had an HbA1c test recorded',
    criteria: [
      { field: 'diagnosis', operator: 'contains', value: 'diabetes' }
    ],
    groupBy: 'age_decade',
    icon: 'D'
  },
  {
    name: 'Patients over 50 without colonoscopy',
    description: 'Patients aged 50+ with no colonoscopy screening on file',
    criteria: [
      { field: 'age', operator: 'gte', value: 50 },
      { field: 'immunization', operator: 'missing', value: 'colonoscopy' }
    ],
    groupBy: 'age_decade',
    icon: 'C'
  },
  {
    name: 'Hypertensive patients (BP > 140/90)',
    description: 'Patients with latest systolic BP above 140',
    criteria: [
      { field: 'vital', operator: 'gte', vitalName: 'systolic', value: 140 }
    ],
    groupBy: 'sex',
    icon: 'H'
  },
  {
    name: 'Patients not seen in 12 months',
    description: 'Patients whose last encounter was over a year ago or never',
    criteria: [
      { field: 'lastVisit', operator: 'within', value: 'never' }
    ],
    groupBy: 'insurance',
    icon: 'N'
  },
  {
    name: 'Female patients 40+ without mammogram',
    description: 'Women aged 40 or older missing mammogram screening',
    criteria: [
      { field: 'sex', operator: 'eq', value: 'Female' },
      { field: 'age', operator: 'gte', value: 40 },
      { field: 'immunization', operator: 'missing', value: 'mammogram' }
    ],
    groupBy: 'age_decade',
    icon: 'M'
  },
  {
    name: 'All patients on anticoagulants',
    description: 'Patients currently taking warfarin, heparin, enoxaparin, rivaroxaban, or apixaban',
    criteria: [
      { field: 'medication', operator: 'contains', value: 'warfarin' }
    ],
    groupBy: 'provider',
    icon: 'A'
  }
];

/* ---------- Filter Row Definitions ---------- */

var SLICER_FIELD_DEFS = {
  age:           { label: 'Age',           operators: ['gte', 'lte', 'between', 'eq'] },
  sex:           { label: 'Sex',           operators: ['eq'] },
  diagnosis:     { label: 'Diagnosis',     operators: ['contains', 'eq'] },
  medication:    { label: 'Medication',    operators: ['contains'] },
  allergy:       { label: 'Allergy',       operators: ['contains'] },
  insurance:     { label: 'Insurance',     operators: ['eq', 'contains'] },
  lastVisit:     { label: 'Last Visit',    operators: ['within'] },
  labValue:      { label: 'Lab Value',     operators: ['gte', 'lte'] },
  vital:         { label: 'Vital Sign',    operators: ['gte', 'lte'] },
  immunization:  { label: 'Immunization',  operators: ['has', 'missing'] }
};

var SLICER_OPERATOR_LABELS = {
  eq: 'equals', gte: '>=', lte: '<=', between: 'between',
  contains: 'contains', within: 'within', has: 'has', missing: 'missing'
};

var SLICER_WITHIN_OPTIONS = [
  { value: '30d',  label: 'Last 30 days' },
  { value: '90d',  label: 'Last 90 days' },
  { value: '6m',   label: 'Last 6 months' },
  { value: '1y',   label: 'Last 1 year' },
  { value: 'never', label: 'Never visited' }
];

var SLICER_VITAL_OPTIONS = [
  { value: 'systolic',  label: 'Systolic BP' },
  { value: 'diastolic', label: 'Diastolic BP' },
  { value: 'bmi',       label: 'BMI' },
  { value: 'weight',    label: 'Weight (lbs)' }
];

/* ---------- View State ---------- */

var _slicerCriteria = [];
var _slicerGroupBy = 'none';
var _slicerChartType = 'bar';
var _slicerResults = null;

/* ---------- View Layer ---------- */

function renderSlicer() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'SlicerDicer', meta: 'Population Analytics', actions: '' });
  setActiveNav('slicer');

  // Reset state
  _slicerCriteria = [];
  _slicerGroupBy = 'none';
  _slicerChartType = 'bar';
  _slicerResults = null;

  var container = document.createElement('div');
  container.className = 'slicer-container';

  // Pre-built queries section
  var prebuiltSection = document.createElement('div');
  prebuiltSection.className = 'slicer-prebuilt-section';
  prebuiltSection.innerHTML = '<h3 class="slicer-section-title">Quick Queries</h3>';

  var cardsRow = document.createElement('div');
  cardsRow.className = 'slicer-prebuilt-cards';

  SLICER_PREBUILT_QUERIES.forEach(function(pq, idx) {
    var card = document.createElement('div');
    card.className = 'slicer-prebuilt-card';
    card.innerHTML =
      '<div class="slicer-prebuilt-icon" style="background:' + SLICER_COLORS[idx % SLICER_COLORS.length] + '">' + esc(pq.icon) + '</div>' +
      '<div class="slicer-prebuilt-info">' +
        '<div class="slicer-prebuilt-name">' + esc(pq.name) + '</div>' +
        '<div class="slicer-prebuilt-desc">' + esc(pq.description) + '</div>' +
      '</div>';
    card.addEventListener('click', function() {
      _slicerCriteria = JSON.parse(JSON.stringify(pq.criteria));
      _slicerGroupBy = pq.groupBy || 'none';
      _slicerRenderQueryBuilder();
      _slicerRunAndRender();
    });
    cardsRow.appendChild(card);
  });

  prebuiltSection.appendChild(cardsRow);
  container.appendChild(prebuiltSection);

  // Query builder panel
  var builderPanel = document.createElement('div');
  builderPanel.className = 'slicer-builder-panel';
  builderPanel.id = 'slicer-builder-panel';
  container.appendChild(builderPanel);

  // Results panel
  var resultsPanel = document.createElement('div');
  resultsPanel.className = 'slicer-results-panel';
  resultsPanel.id = 'slicer-results-panel';
  resultsPanel.innerHTML = '<div class="slicer-results-empty">Add filters and run a query to see results.</div>';
  container.appendChild(resultsPanel);

  app.appendChild(container);

  _slicerRenderQueryBuilder();
}

function _slicerRenderQueryBuilder() {
  var panel = document.getElementById('slicer-builder-panel');
  if (!panel) return;
  panel.innerHTML = '';

  var header = document.createElement('div');
  header.className = 'slicer-builder-header';
  header.innerHTML = '<h3 class="slicer-section-title">Query Builder</h3>';

  var headerActions = document.createElement('div');
  headerActions.className = 'slicer-builder-header-actions';

  var loadBtn = document.createElement('button');
  loadBtn.className = 'btn btn-sm slicer-btn-outline';
  loadBtn.textContent = 'Load Query';
  loadBtn.addEventListener('click', _slicerOpenLoadModal);
  headerActions.appendChild(loadBtn);

  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-sm slicer-btn-outline';
  saveBtn.textContent = 'Save Query';
  saveBtn.addEventListener('click', _slicerOpenSaveModal);
  headerActions.appendChild(saveBtn);

  header.appendChild(headerActions);
  panel.appendChild(header);

  // Criteria rows
  var criteriaWrap = document.createElement('div');
  criteriaWrap.className = 'slicer-criteria-list';
  criteriaWrap.id = 'slicer-criteria-list';

  _slicerCriteria.forEach(function(c, idx) {
    criteriaWrap.appendChild(_slicerBuildFilterRow(c, idx));
  });

  if (_slicerCriteria.length === 0) {
    var emptyHint = document.createElement('div');
    emptyHint.className = 'slicer-criteria-empty';
    emptyHint.textContent = 'No filters added. Click "Add Filter" to begin.';
    criteriaWrap.appendChild(emptyHint);
  }

  panel.appendChild(criteriaWrap);

  // Bottom controls
  var controls = document.createElement('div');
  controls.className = 'slicer-builder-controls';

  var addBtn = document.createElement('button');
  addBtn.className = 'btn btn-sm slicer-btn-outline';
  addBtn.textContent = '+ Add Filter';
  addBtn.addEventListener('click', function() {
    _slicerCriteria.push({ field: 'age', operator: 'gte', value: '' });
    _slicerRenderQueryBuilder();
  });
  controls.appendChild(addBtn);

  // Group By
  var groupWrap = document.createElement('div');
  groupWrap.className = 'slicer-group-wrap';
  var groupLabel = document.createElement('label');
  groupLabel.textContent = 'Group By:';
  groupLabel.className = 'slicer-group-label';
  var groupSel = document.createElement('select');
  groupSel.className = 'slicer-select';
  var groupOptions = [
    { value: 'none', label: 'None' },
    { value: 'age_decade', label: 'Age Decade' },
    { value: 'sex', label: 'Sex' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'provider', label: 'Provider' },
    { value: 'diagnosis', label: 'Primary Diagnosis' }
  ];
  groupOptions.forEach(function(go) {
    var opt = document.createElement('option');
    opt.value = go.value;
    opt.textContent = go.label;
    if (go.value === _slicerGroupBy) opt.selected = true;
    groupSel.appendChild(opt);
  });
  groupSel.addEventListener('change', function() {
    _slicerGroupBy = groupSel.value;
  });
  groupWrap.appendChild(groupLabel);
  groupWrap.appendChild(groupSel);
  controls.appendChild(groupWrap);

  // Run Query
  var runBtn = document.createElement('button');
  runBtn.className = 'btn btn-primary btn-sm';
  runBtn.textContent = 'Run Query';
  runBtn.addEventListener('click', function() {
    _slicerRunAndRender();
  });
  controls.appendChild(runBtn);

  panel.appendChild(controls);
}

function _slicerBuildFilterRow(criterion, idx) {
  var row = document.createElement('div');
  row.className = 'slicer-filter-row';

  // Field selector
  var fieldSel = document.createElement('select');
  fieldSel.className = 'slicer-select';
  Object.keys(SLICER_FIELD_DEFS).forEach(function(fKey) {
    var opt = document.createElement('option');
    opt.value = fKey;
    opt.textContent = SLICER_FIELD_DEFS[fKey].label;
    if (fKey === criterion.field) opt.selected = true;
    fieldSel.appendChild(opt);
  });
  fieldSel.addEventListener('change', function() {
    var newField = fieldSel.value;
    var ops = SLICER_FIELD_DEFS[newField].operators;
    _slicerCriteria[idx] = { field: newField, operator: ops[0], value: '' };
    if (newField === 'vital') _slicerCriteria[idx].vitalName = 'systolic';
    if (newField === 'labValue') _slicerCriteria[idx].labName = '';
    _slicerRenderQueryBuilder();
  });
  row.appendChild(fieldSel);

  // Operator selector
  var ops = SLICER_FIELD_DEFS[criterion.field] ? SLICER_FIELD_DEFS[criterion.field].operators : ['eq'];
  var opSel = document.createElement('select');
  opSel.className = 'slicer-select slicer-select-sm';
  ops.forEach(function(opKey) {
    var opt = document.createElement('option');
    opt.value = opKey;
    opt.textContent = SLICER_OPERATOR_LABELS[opKey] || opKey;
    if (opKey === criterion.operator) opt.selected = true;
    opSel.appendChild(opt);
  });
  opSel.addEventListener('change', function() {
    _slicerCriteria[idx].operator = opSel.value;
  });
  row.appendChild(opSel);

  // Conditional extra fields
  if (criterion.field === 'vital') {
    var vitalSel = document.createElement('select');
    vitalSel.className = 'slicer-select slicer-select-sm';
    SLICER_VITAL_OPTIONS.forEach(function(vo) {
      var opt = document.createElement('option');
      opt.value = vo.value;
      opt.textContent = vo.label;
      if (vo.value === criterion.vitalName) opt.selected = true;
      vitalSel.appendChild(opt);
    });
    vitalSel.addEventListener('change', function() {
      _slicerCriteria[idx].vitalName = vitalSel.value;
    });
    row.appendChild(vitalSel);
  }

  if (criterion.field === 'labValue') {
    var labInput = document.createElement('input');
    labInput.type = 'text';
    labInput.className = 'slicer-input slicer-input-sm';
    labInput.placeholder = 'Lab name (e.g. HbA1c)';
    labInput.value = criterion.labName || '';
    labInput.addEventListener('input', function() {
      _slicerCriteria[idx].labName = labInput.value;
    });
    row.appendChild(labInput);
  }

  // Value input
  if (criterion.field === 'sex') {
    var sexSel = document.createElement('select');
    sexSel.className = 'slicer-select slicer-select-sm';
    ['Male', 'Female'].forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === criterion.value) opt.selected = true;
      sexSel.appendChild(opt);
    });
    sexSel.addEventListener('change', function() {
      _slicerCriteria[idx].value = sexSel.value;
    });
    if (!criterion.value) _slicerCriteria[idx].value = 'Male';
    row.appendChild(sexSel);
  } else if (criterion.field === 'lastVisit') {
    var withinSel = document.createElement('select');
    withinSel.className = 'slicer-select slicer-select-sm';
    SLICER_WITHIN_OPTIONS.forEach(function(wo) {
      var opt = document.createElement('option');
      opt.value = wo.value;
      opt.textContent = wo.label;
      if (wo.value === criterion.value) opt.selected = true;
      withinSel.appendChild(opt);
    });
    withinSel.addEventListener('change', function() {
      _slicerCriteria[idx].value = withinSel.value;
    });
    if (!criterion.value) _slicerCriteria[idx].value = '30d';
    row.appendChild(withinSel);
  } else {
    var valInput = document.createElement('input');
    valInput.type = criterion.field === 'age' || criterion.field === 'labValue' || criterion.field === 'vital' ? 'text' : 'text';
    valInput.className = 'slicer-input';
    valInput.placeholder = _slicerValuePlaceholder(criterion);
    valInput.value = criterion.value != null ? criterion.value : '';
    valInput.addEventListener('input', function() {
      _slicerCriteria[idx].value = valInput.value;
    });
    row.appendChild(valInput);
  }

  // Remove button
  var removeBtn = document.createElement('button');
  removeBtn.className = 'slicer-filter-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.title = 'Remove filter';
  removeBtn.addEventListener('click', function() {
    _slicerCriteria.splice(idx, 1);
    _slicerRenderQueryBuilder();
  });
  row.appendChild(removeBtn);

  return row;
}

function _slicerValuePlaceholder(criterion) {
  var f = criterion.field;
  if (f === 'age') {
    if (criterion.operator === 'between') return 'e.g. 40-65';
    return 'Age value';
  }
  if (f === 'diagnosis') return 'Diagnosis name or ICD-10';
  if (f === 'medication') return 'Medication name';
  if (f === 'allergy') return 'Allergen';
  if (f === 'insurance') return 'Insurance name';
  if (f === 'labValue') return 'Numeric value';
  if (f === 'vital') return 'Numeric value';
  if (f === 'immunization') return 'Vaccine name';
  return 'Value';
}

/* ---------- Run + Render Results ---------- */

function _slicerRunAndRender() {
  if (_slicerCriteria.length === 0) {
    showToast('Add at least one filter before running a query.', 'warning');
    return;
  }

  _slicerResults = runSlicerQuery(_slicerCriteria, _slicerGroupBy);
  _slicerRenderResults();
}

function _slicerRenderResults() {
  var panel = document.getElementById('slicer-results-panel');
  if (!panel || !_slicerResults) return;
  panel.innerHTML = '';

  var res = _slicerResults;
  var matchCount = res.patients.length;
  var totalCount = res.total;
  var pct = totalCount > 0 ? ((matchCount / totalCount) * 100).toFixed(1) : '0.0';

  // Summary bar
  var summary = document.createElement('div');
  summary.className = 'slicer-summary-bar';
  summary.innerHTML =
    '<div class="slicer-summary-stat">' +
      '<span class="slicer-summary-count">' + matchCount + '</span> patients match ' +
      '<span class="slicer-summary-pct">(' + pct + '% of ' + totalCount + ' total)</span>' +
    '</div>';

  // Chart type toggle + export
  var toggleWrap = document.createElement('div');
  toggleWrap.className = 'slicer-chart-toggle';

  ['bar', 'pie', 'table'].forEach(function(ct) {
    var btn = document.createElement('button');
    btn.className = 'slicer-toggle-btn' + (_slicerChartType === ct ? ' active' : '');
    btn.textContent = ct.charAt(0).toUpperCase() + ct.slice(1);
    btn.addEventListener('click', function() {
      _slicerChartType = ct;
      _slicerRenderResults();
    });
    toggleWrap.appendChild(btn);
  });

  var exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-sm slicer-btn-outline';
  exportBtn.textContent = 'Export CSV';
  exportBtn.addEventListener('click', function() {
    _slicerExportCSV(res.patients);
  });
  toggleWrap.appendChild(exportBtn);

  summary.appendChild(toggleWrap);
  panel.appendChild(summary);

  // Chart/Table area
  var chartArea = document.createElement('div');
  chartArea.className = 'slicer-chart-area';

  if (_slicerChartType === 'bar') {
    _slicerRenderBarChart(chartArea, res);
  } else if (_slicerChartType === 'pie') {
    _slicerRenderPieChart(chartArea, res);
  } else {
    _slicerRenderTable(chartArea, res);
  }

  panel.appendChild(chartArea);
}

/* ---------- Bar Chart (CSS-based) ---------- */

function _slicerRenderBarChart(container, results) {
  var groups = results.groups;
  var keys = Object.keys(groups);
  var total = results.patients.length;

  if (keys.length === 0) {
    // No grouping — show a single bar
    var singleBar = document.createElement('div');
    singleBar.className = 'slicer-bar-row';
    singleBar.innerHTML =
      '<div class="slicer-bar-label">All Matching</div>' +
      '<div class="slicer-bar-track">' +
        '<div class="slicer-bar-fill" style="width:100%;background:' + SLICER_COLORS[0] + '"></div>' +
      '</div>' +
      '<div class="slicer-bar-value">' + total + ' (100%)</div>';
    container.appendChild(singleBar);
    return;
  }

  // Sort groups by count descending
  keys.sort(function(a, b) { return groups[b].length - groups[a].length; });
  var maxCount = keys.length > 0 ? groups[keys[0]].length : 1;

  keys.forEach(function(key, idx) {
    var count = groups[key].length;
    var pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    var widthPct = maxCount > 0 ? ((count / maxCount) * 100) : 0;
    var color = SLICER_COLORS[idx % SLICER_COLORS.length];

    var row = document.createElement('div');
    row.className = 'slicer-bar-row';
    row.innerHTML =
      '<div class="slicer-bar-label">' + esc(key) + '</div>' +
      '<div class="slicer-bar-track">' +
        '<div class="slicer-bar-fill" style="width:' + widthPct + '%;background:' + color + '"></div>' +
      '</div>' +
      '<div class="slicer-bar-value">' + count + ' (' + pct + '%)</div>';
    container.appendChild(row);
  });
}

/* ---------- Pie Chart (CSS conic-gradient) ---------- */

function _slicerRenderPieChart(container, results) {
  var groups = results.groups;
  var keys = Object.keys(groups);
  var total = results.patients.length;

  if (keys.length === 0) {
    var msg = document.createElement('div');
    msg.className = 'slicer-no-groups';
    msg.textContent = 'Select a "Group By" option to see a pie chart breakdown.';
    container.appendChild(msg);
    return;
  }

  // Sort keys by count descending
  keys.sort(function(a, b) { return groups[b].length - groups[a].length; });

  // Build conic gradient
  var gradientParts = [];
  var cumulative = 0;
  keys.forEach(function(key, idx) {
    var count = groups[key].length;
    var segPct = total > 0 ? (count / total) * 100 : 0;
    var color = SLICER_COLORS[idx % SLICER_COLORS.length];
    gradientParts.push(color + ' ' + cumulative + '% ' + (cumulative + segPct) + '%');
    cumulative += segPct;
  });

  var pieWrap = document.createElement('div');
  pieWrap.className = 'slicer-pie-wrap';

  var pie = document.createElement('div');
  pie.className = 'slicer-pie';
  pie.style.background = 'conic-gradient(' + gradientParts.join(', ') + ')';
  pieWrap.appendChild(pie);

  // Legend
  var legend = document.createElement('div');
  legend.className = 'slicer-pie-legend';
  keys.forEach(function(key, idx) {
    var count = groups[key].length;
    var pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    var color = SLICER_COLORS[idx % SLICER_COLORS.length];
    var item = document.createElement('div');
    item.className = 'slicer-legend-item';
    item.innerHTML =
      '<span class="slicer-legend-dot" style="background:' + color + '"></span>' +
      '<span class="slicer-legend-label">' + esc(key) + '</span>' +
      '<span class="slicer-legend-value">' + count + ' (' + pct + '%)</span>';
    legend.appendChild(item);
  });
  pieWrap.appendChild(legend);

  container.appendChild(pieWrap);
}

/* ---------- Table View ---------- */

function _slicerRenderTable(container, results) {
  var patients = results.patients;

  if (patients.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'slicer-no-groups';
    empty.textContent = 'No patients match the current criteria.';
    container.appendChild(empty);
    return;
  }

  var table = document.createElement('table');
  table.className = 'slicer-table';

  var thead = document.createElement('thead');
  thead.innerHTML =
    '<tr>' +
      '<th>Name</th>' +
      '<th>Age</th>' +
      '<th>Sex</th>' +
      '<th>Insurance</th>' +
      '<th>Last Visit</th>' +
      '<th>Matching Info</th>' +
    '</tr>';
  table.appendChild(thead);

  var tbody = document.createElement('tbody');

  patients.forEach(function(p) {
    var age = _slicerCalcAge(p.dob);
    var encs = typeof getEncountersByPatient === 'function'
      ? getEncountersByPatient(p.id)
      : getEncounters().filter(function(e) { return e.patientId === p.id; });
    var sorted = encs.sort(function(a, b) { return new Date(b.dateTime || b.createdAt) - new Date(a.dateTime || a.createdAt); });
    var lastVisit = sorted.length > 0 ? formatDateTime(sorted[0].dateTime || sorted[0].createdAt) : 'Never';

    var matchInfo = _slicerGetMatchInfo(p);

    var tr = document.createElement('tr');
    tr.className = 'slicer-table-row';
    tr.innerHTML =
      '<td class="slicer-table-name">' + esc(p.lastName + ', ' + p.firstName) + '</td>' +
      '<td>' + (age !== null ? age : '--') + '</td>' +
      '<td>' + esc(p.sex || '--') + '</td>' +
      '<td>' + esc(p.insurance || '--') + '</td>' +
      '<td>' + esc(lastVisit) + '</td>' +
      '<td class="slicer-table-match">' + esc(matchInfo) + '</td>';
    tr.addEventListener('click', function() {
      navigate('#chart/' + p.id);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function _slicerGetMatchInfo(patient) {
  var parts = [];
  _slicerCriteria.forEach(function(c) {
    var f = SLICER_FIELD_DEFS[c.field];
    var label = f ? f.label : c.field;
    if (c.field === 'age') {
      var age = _slicerCalcAge(patient.dob);
      parts.push(label + ': ' + (age !== null ? age : '--'));
    } else if (c.field === 'vital') {
      var vd = getLatestVitalsByPatient(patient.id);
      if (vd && vd.vitals) {
        var vn = c.vitalName;
        var vv = null;
        if (vn === 'systolic') vv = vd.vitals.bpSystolic;
        else if (vn === 'diastolic') vv = vd.vitals.bpDiastolic;
        else if (vn === 'weight') vv = vd.vitals.weightLbs;
        else if (vn === 'bmi') { var b = _slicerCalcBMI(vd.vitals.weightLbs, vd.vitals.heightIn); vv = b ? b.toFixed(1) : null; }
        parts.push((vn || 'Vital') + ': ' + (vv || '--'));
      }
    } else if (c.field === 'diagnosis') {
      var probs = getActiveProblems(patient.id);
      var names = probs.map(function(p2) { return p2.name; }).filter(Boolean).slice(0, 3);
      parts.push('Dx: ' + (names.length > 0 ? names.join(', ') : '--'));
    } else if (c.field === 'medication') {
      var meds = getPatientMedications(patient.id);
      var mq = (c.value || '').toLowerCase();
      var matchedMeds = meds.filter(function(m) { return (m.name || '').toLowerCase().indexOf(mq) >= 0; });
      parts.push('Meds: ' + (matchedMeds.length > 0 ? matchedMeds.map(function(m) { return m.name; }).join(', ') : '--'));
    }
  });
  return parts.length > 0 ? parts.join(' | ') : '';
}

/* ---------- Export CSV ---------- */

function _slicerExportCSV(patients) {
  if (patients.length === 0) {
    showToast('No data to export.', 'warning');
    return;
  }

  var rows = [['Name', 'MRN', 'Age', 'Sex', 'DOB', 'Insurance', 'Phone', 'Last Visit']];

  patients.forEach(function(p) {
    var age = _slicerCalcAge(p.dob);
    var encs = typeof getEncountersByPatient === 'function'
      ? getEncountersByPatient(p.id)
      : getEncounters().filter(function(e) { return e.patientId === p.id; });
    var sorted = encs.sort(function(a, b) { return new Date(b.dateTime || b.createdAt) - new Date(a.dateTime || a.createdAt); });
    var lastVisit = sorted.length > 0 ? (sorted[0].dateTime || sorted[0].createdAt || '') : '';

    rows.push([
      (p.lastName || '') + ', ' + (p.firstName || ''),
      p.mrn || '',
      age !== null ? String(age) : '',
      p.sex || '',
      p.dob || '',
      p.insurance || '',
      p.phone || '',
      lastVisit
    ]);
  });

  var csvContent = rows.map(function(r) {
    return r.map(function(cell) {
      var escaped = String(cell).replace(/"/g, '""');
      return '"' + escaped + '"';
    }).join(',');
  }).join('\n');

  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'slicer_results_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('CSV exported (' + patients.length + ' patients).', 'success');
}

/* ---------- Save/Load Modals ---------- */

function _slicerOpenSaveModal() {
  if (_slicerCriteria.length === 0) {
    showToast('Add filters before saving a query.', 'warning');
    return;
  }

  openModal({
    title: 'Save Query',
    bodyHTML:
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<label>Query Name<input id="slicer-save-name" class="form-control" placeholder="e.g. Diabetic Panel Over 50" /></label>' +
        '<label>Description (optional)<textarea id="slicer-save-desc" class="form-control" rows="2" placeholder="Brief description"></textarea></label>' +
      '</div>',
    footerHTML:
      '<button class="btn btn-sm" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary btn-sm" id="slicer-save-confirm">Save</button>'
  });

  document.getElementById('slicer-save-confirm').addEventListener('click', function() {
    var name = document.getElementById('slicer-save-name').value.trim();
    if (!name) { showToast('Query name is required.', 'error'); return; }
    saveQuery({
      name: name,
      description: document.getElementById('slicer-save-desc').value.trim(),
      criteria: JSON.parse(JSON.stringify(_slicerCriteria)),
      groupBy: _slicerGroupBy,
      chartType: _slicerChartType
    });
    closeModal();
    showToast('Query saved: ' + name, 'success');
  });
}

function _slicerOpenLoadModal() {
  var queries = getSavedQueries();

  var body = '';
  if (queries.length === 0) {
    body = '<div class="slicer-no-groups">No saved queries yet.</div>';
  } else {
    body = '<div class="slicer-saved-list">';
    queries.forEach(function(q) {
      body +=
        '<div class="slicer-saved-item" data-qid="' + esc(q.id) + '">' +
          '<div class="slicer-saved-info">' +
            '<strong>' + esc(q.name) + '</strong>' +
            (q.description ? '<div class="slicer-saved-desc">' + esc(q.description) + '</div>' : '') +
            '<div class="slicer-saved-meta">' + esc(q.criteria ? q.criteria.length + ' filter(s)' : '') + ' &middot; ' + esc(formatDateTime(q.createdAt)) + '</div>' +
          '</div>' +
          '<div class="slicer-saved-actions">' +
            '<button class="btn btn-primary btn-sm slicer-load-btn" data-qid="' + esc(q.id) + '">Load</button>' +
            '<button class="btn btn-sm slicer-btn-danger-sm slicer-del-btn" data-qid="' + esc(q.id) + '">Delete</button>' +
          '</div>' +
        '</div>';
    });
    body += '</div>';
  }

  openModal({
    title: 'Saved Queries',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-sm" onclick="closeModal()">Close</button>'
  });

  // Wire load buttons
  document.querySelectorAll('.slicer-load-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qid = btn.dataset.qid;
      var q = getSavedQueries().find(function(x) { return x.id === qid; });
      if (!q) return;
      _slicerCriteria = JSON.parse(JSON.stringify(q.criteria || []));
      _slicerGroupBy = q.groupBy || 'none';
      _slicerChartType = q.chartType || 'bar';
      closeModal();
      _slicerRenderQueryBuilder();
      _slicerRunAndRender();
      showToast('Loaded: ' + q.name, 'success');
    });
  });

  // Wire delete buttons
  document.querySelectorAll('.slicer-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qid = btn.dataset.qid;
      deleteQuery(qid);
      showToast('Query deleted.', 'success');
      _slicerOpenLoadModal(); // refresh
    });
  });
}
