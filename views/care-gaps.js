/* ============================================================
   views/care-gaps.js — Care Gaps / Health Maintenance Engine
   ============================================================ */

/* ---------- Default Care Gap Rules ---------- */
const CARE_GAP_RULES_DEFAULT = [
  // Cancer Screenings
  {
    id: 'mammogram',
    name: 'Mammogram',
    category: 'Cancer Screening',
    description: 'Breast cancer screening via mammography for women age 40+. Recommended annually.',
    criteria: { minAge: 40, maxAge: null, sex: 'Female', conditions: [], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'imaging',
    matchCodes: ['mammogram', 'mammography', 'breast imaging', 'breast screening'],
    enabled: true
  },
  {
    id: 'pap-smear',
    name: 'Cervical Cancer Screening (Pap)',
    category: 'Cancer Screening',
    description: 'Cervical cancer screening via Pap smear for women age 21-65. Recommended every 3 years.',
    criteria: { minAge: 21, maxAge: 65, sex: 'Female', conditions: [], medications: [] },
    frequency: { value: 3, unit: 'years' },
    matchType: 'screening',
    matchCodes: ['pap', 'pap smear', 'cervical', 'cervical cancer', 'cervical screening'],
    enabled: true
  },
  {
    id: 'colonoscopy',
    name: 'Colonoscopy',
    category: 'Cancer Screening',
    description: 'Colorectal cancer screening via colonoscopy for adults age 50+. Recommended every 10 years.',
    criteria: { minAge: 50, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 10, unit: 'years' },
    matchType: 'screening',
    matchCodes: ['colonoscopy', 'colorectal', 'colon cancer screening'],
    enabled: true
  },
  {
    id: 'lung-cancer-screening',
    name: 'Lung Cancer Screening (LDCT)',
    category: 'Cancer Screening',
    description: 'Low-dose CT for lung cancer screening in adults 55+ with smoking history. Recommended annually.',
    criteria: { minAge: 55, maxAge: null, sex: null, conditions: ['smoking', 'tobacco'], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'imaging',
    matchCodes: ['lung cancer', 'ldct', 'low-dose ct', 'lung screening', 'chest ct screening'],
    enabled: true
  },
  {
    id: 'prostate-screening',
    name: 'Prostate Cancer Screening (PSA)',
    category: 'Cancer Screening',
    description: 'PSA blood test for prostate cancer screening in men age 55+. Recommended every 2 years.',
    criteria: { minAge: 55, maxAge: null, sex: 'Male', conditions: [], medications: [] },
    frequency: { value: 2, unit: 'years' },
    matchType: 'lab',
    matchCodes: ['psa', 'prostate', 'prostate specific antigen'],
    enabled: true
  },

  // Vaccinations
  {
    id: 'influenza-vaccine',
    name: 'Influenza Vaccine',
    category: 'Vaccinations',
    description: 'Annual influenza vaccination for all patients.',
    criteria: { minAge: 6, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'immunization',
    matchCodes: ['influenza', 'flu', 'flu shot', 'flu vaccine'],
    enabled: true
  },
  {
    id: 'covid-vaccine',
    name: 'COVID-19 Vaccine',
    category: 'Vaccinations',
    description: 'Annual COVID-19 vaccination for all patients.',
    criteria: { minAge: 6, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'immunization',
    matchCodes: ['covid', 'covid-19', 'sars-cov-2', 'coronavirus vaccine'],
    enabled: true
  },
  {
    id: 'tdap-vaccine',
    name: 'Tdap Vaccine',
    category: 'Vaccinations',
    description: 'Tetanus, diphtheria, and pertussis booster every 10 years for all adults.',
    criteria: { minAge: 18, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 10, unit: 'years' },
    matchType: 'immunization',
    matchCodes: ['tdap', 'tetanus', 'diphtheria', 'pertussis', 'td booster'],
    enabled: true
  },
  {
    id: 'zoster-vaccine',
    name: 'Shingles (Zoster) Vaccine',
    category: 'Vaccinations',
    description: 'Shingrix vaccine for adults age 50+. Two-dose series (one-time).',
    criteria: { minAge: 50, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 99, unit: 'years' },
    matchType: 'immunization',
    matchCodes: ['zoster', 'shingles', 'shingrix', 'varicella zoster'],
    enabled: true
  },
  {
    id: 'pneumococcal-vaccine',
    name: 'Pneumococcal Vaccine',
    category: 'Vaccinations',
    description: 'Pneumococcal vaccination for adults age 65+. One-time series.',
    criteria: { minAge: 65, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 99, unit: 'years' },
    matchType: 'immunization',
    matchCodes: ['pneumococcal', 'pneumonia vaccine', 'prevnar', 'pneumovax', 'pcv'],
    enabled: true
  },
  {
    id: 'hpv-vaccine',
    name: 'HPV Vaccine',
    category: 'Vaccinations',
    description: 'HPV vaccine series for patients age 9-26.',
    criteria: { minAge: 9, maxAge: 26, sex: null, conditions: [], medications: [] },
    frequency: { value: 99, unit: 'years' },
    matchType: 'immunization',
    matchCodes: ['hpv', 'human papillomavirus', 'gardasil'],
    enabled: true
  },

  // Metabolic
  {
    id: 'hba1c',
    name: 'HbA1c',
    category: 'Metabolic',
    description: 'Hemoglobin A1c monitoring for diabetic patients. Recommended every 6 months.',
    criteria: { minAge: 0, maxAge: null, sex: null, conditions: ['diabetes', 'diabetic', 'dm', 'type 2 diabetes', 'type 1 diabetes'], medications: ['metformin', 'insulin', 'glipizide', 'glyburide', 'sitagliptin', 'empagliflozin', 'semaglutide'] },
    frequency: { value: 6, unit: 'months' },
    matchType: 'lab',
    matchCodes: ['hba1c', 'hemoglobin a1c', 'a1c', 'glycohemoglobin', 'glycated hemoglobin'],
    enabled: true
  },
  {
    id: 'lipid-panel',
    name: 'Lipid Panel',
    category: 'Metabolic',
    description: 'Fasting lipid panel for adults age 40+. Recommended every 5 years.',
    criteria: { minAge: 40, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 5, unit: 'years' },
    matchType: 'lab',
    matchCodes: ['lipid panel', 'lipid', 'cholesterol', 'ldl', 'hdl', 'triglycerides', 'fasting lipid'],
    enabled: true
  },
  {
    id: 'bp-screening',
    name: 'Blood Pressure Screening',
    category: 'Metabolic',
    description: 'Blood pressure screening for adults 18+. Recommended annually.',
    criteria: { minAge: 18, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'vital',
    matchCodes: ['blood pressure', 'bp', 'systolic', 'diastolic'],
    enabled: true
  },

  // Mental Health
  {
    id: 'phq9-screening',
    name: 'Depression Screening (PHQ-9)',
    category: 'Mental Health',
    description: 'Annual depression screening using PHQ-9 for adults 18+.',
    criteria: { minAge: 18, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'screening',
    matchCodes: ['phq-9', 'phq9', 'depression screening', 'depression', 'mental health screening'],
    enabled: true
  },
  {
    id: 'sdoh-screening',
    name: 'SDOH Screening',
    category: 'Mental Health',
    description: 'Social determinants of health screening for all patients. Recommended annually.',
    criteria: { minAge: 0, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'screening',
    matchCodes: ['sdoh', 'social determinants', 'social needs', 'social screening'],
    enabled: true
  },

  // Other
  {
    id: 'diabetic-eye-exam',
    name: 'Diabetic Eye Exam',
    category: 'Other',
    description: 'Annual dilated eye exam for patients with diabetes.',
    criteria: { minAge: 0, maxAge: null, sex: null, conditions: ['diabetes', 'diabetic', 'dm', 'type 2 diabetes', 'type 1 diabetes'], medications: ['metformin', 'insulin'] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'screening',
    matchCodes: ['eye exam', 'dilated eye', 'retinal exam', 'ophthalmology', 'diabetic eye'],
    enabled: true
  },
  {
    id: 'dexa-scan',
    name: 'Bone Density (DEXA)',
    category: 'Other',
    description: 'DEXA scan for osteoporosis screening in women age 65+. Recommended every 2 years.',
    criteria: { minAge: 65, maxAge: null, sex: 'Female', conditions: [], medications: [] },
    frequency: { value: 2, unit: 'years' },
    matchType: 'imaging',
    matchCodes: ['dexa', 'bone density', 'osteoporosis screening', 'dxa', 'bone mineral density'],
    enabled: true
  },
  {
    id: 'tobacco-screening',
    name: 'Tobacco Use Screening',
    category: 'Other',
    description: 'Annual tobacco use screening and cessation counseling for all patients.',
    criteria: { minAge: 18, maxAge: null, sex: null, conditions: [], medications: [] },
    frequency: { value: 1, unit: 'years' },
    matchType: 'screening',
    matchCodes: ['tobacco', 'smoking', 'tobacco screening', 'cessation', 'nicotine'],
    enabled: true
  }
];

/* ---------- Category color map ---------- */
const CARE_GAP_CATEGORY_COLORS = {
  'Cancer Screening': '#e53e3e',
  'Vaccinations':     '#3182ce',
  'Metabolic':        '#d69e2e',
  'Mental Health':    '#805ad5',
  'Other':            '#718096'
};

/* ============================================================
   DATA LAYER — CRUD
   ============================================================ */

function getCareGapRules() {
  var custom = loadAll(KEYS.careGapRules);
  if (custom && custom.length > 0) return custom.filter(function(r) { return r.enabled !== false; });
  return CARE_GAP_RULES_DEFAULT.filter(function(r) { return r.enabled !== false; });
}

function getAllCareGapRules() {
  var custom = loadAll(KEYS.careGapRules);
  if (custom && custom.length > 0) return custom;
  return CARE_GAP_RULES_DEFAULT.slice();
}

function saveCareGapRule(rule) {
  var all = loadAll(KEYS.careGapRules);
  if (all.length === 0) {
    all = CARE_GAP_RULES_DEFAULT.slice();
  }
  var idx = all.findIndex(function(r) { return r.id === rule.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], rule);
  } else {
    all.push(Object.assign({ id: generateId(), enabled: true }, rule));
  }
  saveAll(KEYS.careGapRules, all);
}

function deleteCareGapRule(id) {
  var all = loadAll(KEYS.careGapRules);
  if (all.length === 0) {
    all = CARE_GAP_RULES_DEFAULT.slice();
  }
  all = all.filter(function(r) { return r.id !== id; });
  saveAll(KEYS.careGapRules, all);
}

/* ---------- Dismissals ---------- */
function _getCareGapDismissals() {
  return loadAll(KEYS.patientCareGaps);
}

function dismissCareGap(patientId, ruleId, reason) {
  var all = loadAll(KEYS.patientCareGaps);
  all.push({
    id: generateId(),
    patientId: patientId,
    ruleId: ruleId,
    type: 'dismissal',
    reason: reason || 'Not specified',
    date: new Date().toISOString(),
    dismissedBy: getSessionUser() ? getSessionUser().id : ''
  });
  saveAll(KEYS.patientCareGaps, all);
}

function _getCareGapCompletions() {
  return loadAll(KEYS.patientCareGaps).filter(function(r) { return r.type === 'completion'; });
}

function markCareGapComplete(patientId, ruleId, completedDate) {
  var all = loadAll(KEYS.patientCareGaps);
  all.push({
    id: generateId(),
    patientId: patientId,
    ruleId: ruleId,
    type: 'completion',
    date: completedDate || new Date().toISOString(),
    recordedBy: getSessionUser() ? getSessionUser().id : ''
  });
  saveAll(KEYS.patientCareGaps, all);
}

/* ============================================================
   CORE ENGINE — evaluatePatientCareGaps
   ============================================================ */

function _getPatientAge(patient) {
  if (!patient || !patient.dob) return null;
  var dob = new Date(patient.dob);
  if (isNaN(dob.getTime())) return null;
  var today = new Date();
  var age = today.getFullYear() - dob.getFullYear();
  var monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function _matchesText(haystack, needles) {
  if (!haystack || !needles || needles.length === 0) return false;
  var h = haystack.toLowerCase();
  return needles.some(function(n) { return h.indexOf(n.toLowerCase()) >= 0; });
}

function _addFrequency(dateStr, frequency) {
  var d = new Date(dateStr);
  if (frequency.unit === 'years') {
    d.setFullYear(d.getFullYear() + frequency.value);
  } else if (frequency.unit === 'months') {
    d.setMonth(d.getMonth() + frequency.value);
  }
  return d;
}

function _patientMatchesCriteria(patient, criteria) {
  var age = _getPatientAge(patient);
  if (age === null) return false;
  if (criteria.minAge != null && age < criteria.minAge) return false;
  if (criteria.maxAge != null && age > criteria.maxAge) return false;
  if (criteria.sex && patient.sex && criteria.sex !== patient.sex) return false;

  // Condition matching: check problems, diagnoses, social history
  if (criteria.conditions && criteria.conditions.length > 0) {
    var problems = getActiveProblems(patient.id);
    var diagnoses = (typeof getPatientDiagnoses === 'function') ? getPatientDiagnoses(patient.id) : [];
    var socialHx = (typeof getSocialHistory === 'function') ? getSocialHistory(patient.id) : null;

    var allConditionText = '';
    problems.forEach(function(p) { allConditionText += ' ' + (p.name || '') + ' ' + (p.icd10 || '') + ' ' + (p.notes || ''); });
    diagnoses.forEach(function(d) { allConditionText += ' ' + (d.name || '') + ' ' + (d.icd10 || '') + ' ' + (d.evidenceNotes || ''); });
    if (socialHx) {
      allConditionText += ' ' + (socialHx.smokingStatus || '') + ' ' + (socialHx.tobaccoUse || '');
    }

    var conditionMatch = criteria.conditions.some(function(c) {
      return allConditionText.toLowerCase().indexOf(c.toLowerCase()) >= 0;
    });

    // Also check medications if medication criteria exist
    if (!conditionMatch && criteria.medications && criteria.medications.length > 0) {
      var meds = getPatientMedications(patient.id);
      var allMedText = '';
      meds.forEach(function(m) { allMedText += ' ' + (m.name || '') + ' ' + (m.drug || ''); });
      conditionMatch = criteria.medications.some(function(med) {
        return allMedText.toLowerCase().indexOf(med.toLowerCase()) >= 0;
      });
    }

    if (!conditionMatch) return false;
  }

  return true;
}

function _findLastCompletedDate(patientId, rule) {
  var candidates = [];

  // Check manual completions
  var completions = _getCareGapCompletions().filter(function(c) {
    return c.patientId === patientId && c.ruleId === rule.id;
  });
  completions.forEach(function(c) { candidates.push(new Date(c.date)); });

  var codes = rule.matchCodes || [];

  if (rule.matchType === 'lab') {
    var labs = getLabResults(patientId);
    labs.forEach(function(lab) {
      var panelMatch = _matchesText(lab.panel, codes);
      var testMatch = (lab.tests || []).some(function(t) {
        return _matchesText(t.name || t.testName || '', codes);
      });
      if (panelMatch || testMatch) {
        candidates.push(new Date(lab.resultDate));
      }
    });
  }

  if (rule.matchType === 'immunization') {
    var imms = getImmunizations(patientId);
    imms.forEach(function(imm) {
      if (_matchesText(imm.vaccine, codes) || _matchesText(imm.notes || '', codes)) {
        candidates.push(new Date(imm.date));
      }
    });
  }

  if (rule.matchType === 'screening') {
    var screenings = (typeof getScreeningRecords === 'function') ? getScreeningRecords(patientId) : [];
    screenings.forEach(function(s) {
      if (_matchesText(s.screening, codes) || _matchesText(s.notes || '', codes)) {
        candidates.push(new Date(s.completedDate));
      }
    });
    // Also check encounters with matching notes
    var encs = getEncountersByPatient(patientId);
    encs.forEach(function(enc) {
      var notes = loadAll(KEYS.notes).filter(function(n) { return n.encounterId === enc.id; });
      notes.forEach(function(n) {
        if (_matchesText(n.subjective || '', codes) || _matchesText(n.assessment || '', codes) ||
            _matchesText(n.plan || '', codes) || _matchesText(n.objective || '', codes)) {
          candidates.push(new Date(enc.dateTime));
        }
      });
    });
  }

  if (rule.matchType === 'imaging') {
    var imaging = (typeof getImagingResults === 'function') ? getImagingResults(patientId) : [];
    imaging.forEach(function(img) {
      if (_matchesText(img.study || '', codes) || _matchesText(img.modality || '', codes) ||
          _matchesText(img.indication || '', codes) || _matchesText(img.findings || '', codes)) {
        candidates.push(new Date(img.resultDate));
      }
    });
    // Also check imaging orders
    var orders = (typeof getOrdersByPatient === 'function') ? getOrdersByPatient(patientId) : [];
    orders.forEach(function(o) {
      if (o.type === 'Imaging' && o.status === 'Completed' && o.detail) {
        if (_matchesText(o.detail.study || '', codes) || _matchesText(o.detail.bodyPart || '', codes)) {
          candidates.push(new Date(o.completedAt || o.dateTime));
        }
      }
    });
  }

  if (rule.matchType === 'vital') {
    var vitalResult = getLatestVitalsByPatient(patientId);
    if (vitalResult && vitalResult.vitals) {
      var v = vitalResult.vitals;
      if ((v.bpSystolic || v.bpDiastolic) && codes.some(function(c) { var lc = c.toLowerCase(); return lc.indexOf('blood pressure') >= 0 || lc === 'bp' || lc === 'systolic' || lc === 'diastolic'; })) {
        candidates.push(new Date(v.recordedAt || vitalResult.encounter.dateTime));
      }
    }
  }

  // Filter out invalid dates and return most recent
  candidates = candidates.filter(function(d) { return !isNaN(d.getTime()); });
  if (candidates.length === 0) return null;
  candidates.sort(function(a, b) { return b.getTime() - a.getTime(); });
  return candidates[0];
}

function evaluatePatientCareGaps(patientId) {
  var patient = getPatient(patientId);
  if (!patient) return [];

  var rules = getCareGapRules();
  var dismissals = _getCareGapDismissals().filter(function(d) {
    return d.patientId === patientId && d.type === 'dismissal';
  });
  var dismissedRuleIds = {};
  dismissals.forEach(function(d) { dismissedRuleIds[d.ruleId] = d.reason; });

  var now = new Date();
  var dueSoonThreshold = new Date();
  dueSoonThreshold.setDate(dueSoonThreshold.getDate() + 30);

  var results = [];

  rules.forEach(function(rule) {
    // Skip dismissed
    if (dismissedRuleIds[rule.id]) {
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        status: 'dismissed',
        lastCompleted: null,
        nextDue: null,
        description: rule.description,
        dismissReason: dismissedRuleIds[rule.id]
      });
      return;
    }

    // Check if patient matches criteria
    if (!_patientMatchesCriteria(patient, rule.criteria)) {
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        status: 'not_applicable',
        lastCompleted: null,
        nextDue: null,
        description: rule.description
      });
      return;
    }

    // Find last completed date
    var lastDate = _findLastCompletedDate(patientId, rule);
    var lastCompletedStr = lastDate ? lastDate.toISOString() : null;
    var nextDue = null;
    var status = 'overdue';

    if (lastDate) {
      nextDue = _addFrequency(lastDate.toISOString(), rule.frequency);
      if (nextDue > dueSoonThreshold) {
        status = 'up_to_date';
      } else if (nextDue > now) {
        status = 'due_soon';
      } else {
        status = 'overdue';
      }
    } else {
      // Never completed — overdue
      status = 'overdue';
    }

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      status: status,
      lastCompleted: lastCompletedStr,
      nextDue: nextDue ? nextDue.toISOString() : null,
      description: rule.description
    });
  });

  return results;
}

function evaluateAllPatientsCareGaps() {
  var patients = getPatients();
  var allResults = {};
  patients.forEach(function(p) {
    allResults[p.id] = evaluatePatientCareGaps(p.id);
  });
  return allResults;
}

function getCareGapStats() {
  var patients = getPatients();
  var totalOverdue = 0;
  var totalDueSoon = 0;
  var totalUpToDate = 0;
  var totalGaps = 0;
  var patientsWithGaps = 0;
  var categoryBreakdown = {};

  patients.forEach(function(p) {
    var gaps = evaluatePatientCareGaps(p.id);
    var hasGap = false;
    gaps.forEach(function(g) {
      if (g.status === 'not_applicable' || g.status === 'dismissed') return;
      totalGaps++;
      if (g.status === 'overdue') { totalOverdue++; hasGap = true; }
      if (g.status === 'due_soon') { totalDueSoon++; hasGap = true; }
      if (g.status === 'up_to_date') { totalUpToDate++; }
      if (!categoryBreakdown[g.category]) {
        categoryBreakdown[g.category] = { overdue: 0, dueSoon: 0, upToDate: 0 };
      }
      if (g.status === 'overdue') categoryBreakdown[g.category].overdue++;
      if (g.status === 'due_soon') categoryBreakdown[g.category].dueSoon++;
      if (g.status === 'up_to_date') categoryBreakdown[g.category].upToDate++;
    });
    if (hasGap) patientsWithGaps++;
  });

  return {
    totalGaps: totalGaps,
    totalOverdue: totalOverdue,
    totalDueSoon: totalDueSoon,
    totalUpToDate: totalUpToDate,
    patientsWithGaps: patientsWithGaps,
    totalPatients: patients.length,
    categoryBreakdown: categoryBreakdown
  };
}

/* ============================================================
   VIEW LAYER — renderCareGaps (standalone dashboard)
   ============================================================ */

function renderCareGaps() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({
    title: 'Care Gaps / Health Maintenance',
    meta: '',
    actions: '<button class="btn btn-secondary btn-sm" id="care-gap-manage-rules">Manage Rules</button>'
  });
  if (typeof setActiveNav === 'function') setActiveNav('care-gaps');

  // State
  var _filterCategory = '';
  var _filterStatus = '';
  var _searchTerm = '';

  function render() {
    app.innerHTML = '';

    // Stats
    var stats = getCareGapStats();

    var statsRow = document.createElement('div');
    statsRow.className = 'care-gap-stats-row';
    statsRow.innerHTML =
      '<div class="care-gap-stat-card care-gap-stat-total">' +
        '<div class="care-gap-stat-value">' + esc(String(stats.totalGaps)) + '</div>' +
        '<div class="care-gap-stat-label">Total Gaps</div>' +
      '</div>' +
      '<div class="care-gap-stat-card care-gap-stat-overdue">' +
        '<div class="care-gap-stat-value">' + esc(String(stats.totalOverdue)) + '</div>' +
        '<div class="care-gap-stat-label">Overdue</div>' +
      '</div>' +
      '<div class="care-gap-stat-card care-gap-stat-due-soon">' +
        '<div class="care-gap-stat-value">' + esc(String(stats.totalDueSoon)) + '</div>' +
        '<div class="care-gap-stat-label">Due Soon</div>' +
      '</div>' +
      '<div class="care-gap-stat-card care-gap-stat-up-to-date">' +
        '<div class="care-gap-stat-value">' + esc(String(stats.totalUpToDate)) + '</div>' +
        '<div class="care-gap-stat-label">Up to Date</div>' +
      '</div>' +
      '<div class="care-gap-stat-card">' +
        '<div class="care-gap-stat-value">' + esc(String(stats.patientsWithGaps)) + '</div>' +
        '<div class="care-gap-stat-label">Patients w/ Gaps</div>' +
      '</div>';
    app.appendChild(statsRow);

    // Filters toolbar
    var toolbar = document.createElement('div');
    toolbar.className = 'care-gap-toolbar';

    var categories = ['Cancer Screening', 'Vaccinations', 'Metabolic', 'Mental Health', 'Other'];
    var catOpts = '<option value="">All Categories</option>' + categories.map(function(c) {
      return '<option value="' + esc(c) + '"' + (_filterCategory === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');

    var statOpts = '<option value="">All Statuses</option>' +
      '<option value="overdue"' + (_filterStatus === 'overdue' ? ' selected' : '') + '>Overdue</option>' +
      '<option value="due_soon"' + (_filterStatus === 'due_soon' ? ' selected' : '') + '>Due Soon</option>' +
      '<option value="up_to_date"' + (_filterStatus === 'up_to_date' ? ' selected' : '') + '>Up to Date</option>';

    toolbar.innerHTML =
      '<input type="text" class="form-control care-gap-search" id="care-gap-search" placeholder="Search patients..." value="' + esc(_searchTerm) + '">' +
      '<select class="form-control care-gap-filter-select" id="care-gap-cat-filter">' + catOpts + '</select>' +
      '<select class="form-control care-gap-filter-select" id="care-gap-status-filter">' + statOpts + '</select>';
    app.appendChild(toolbar);

    // Build patient rows
    var patients = getPatients();
    var rows = [];

    patients.forEach(function(p) {
      var gaps = evaluatePatientCareGaps(p.id);
      var applicable = gaps.filter(function(g) { return g.status !== 'not_applicable' && g.status !== 'dismissed'; });
      if (applicable.length === 0) return;

      var overdue = applicable.filter(function(g) { return g.status === 'overdue'; });
      var dueSoon = applicable.filter(function(g) { return g.status === 'due_soon'; });

      // Filter by category
      if (_filterCategory) {
        var catGaps = applicable.filter(function(g) { return g.category === _filterCategory; });
        if (catGaps.length === 0) return;
        overdue = overdue.filter(function(g) { return g.category === _filterCategory; });
        dueSoon = dueSoon.filter(function(g) { return g.category === _filterCategory; });
      }

      // Filter by status
      if (_filterStatus) {
        var statusGaps = applicable.filter(function(g) { return g.status === _filterStatus; });
        if (statusGaps.length === 0) return;
      }

      // Search
      if (_searchTerm) {
        var term = _searchTerm.toLowerCase();
        var name = ((p.firstName || '') + ' ' + (p.lastName || '') + ' ' + (p.mrn || '')).toLowerCase();
        if (name.indexOf(term) < 0) return;
      }

      // Top gap = first overdue, or first due_soon
      var topGap = overdue.length > 0 ? overdue[0] : (dueSoon.length > 0 ? dueSoon[0] : applicable[0]);

      // Last encounter
      var encs = getEncountersByPatient(p.id);
      var lastVisit = encs.length > 0 ? encs[0].dateTime : null;

      rows.push({
        patient: p,
        overdueCount: overdue.length,
        dueSoonCount: dueSoon.length,
        topGap: topGap,
        lastVisit: lastVisit,
        gaps: applicable
      });
    });

    // Sort: overdue desc, then due_soon desc
    rows.sort(function(a, b) {
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount;
      return b.dueSoonCount - a.dueSoonCount;
    });

    // Table
    var card = document.createElement('div');
    card.className = 'card';

    if (rows.length === 0) {
      card.appendChild(buildEmptyState('', 'No care gaps found', 'All patients are up to date or no patients match the current filters.'));
      app.appendChild(card);
    } else {
      var wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      var table = document.createElement('table');
      table.className = 'table';
      table.innerHTML =
        '<thead><tr>' +
          '<th>Patient</th>' +
          '<th>Overdue</th>' +
          '<th>Due Soon</th>' +
          '<th>Top Gap</th>' +
          '<th>Last Visit</th>' +
        '</tr></thead>';
      var tbody = document.createElement('tbody');

      rows.forEach(function(row) {
        var tr = document.createElement('tr');
        tr.className = 'care-gap-patient-row';
        tr.style.cursor = 'pointer';

        var overdueClass = row.overdueCount > 0 ? 'care-gap-badge-overdue' : 'care-gap-badge-none';
        var dueSoonClass = row.dueSoonCount > 0 ? 'care-gap-badge-due-soon' : 'care-gap-badge-none';

        tr.innerHTML =
          '<td><strong>' + esc(row.patient.lastName + ', ' + row.patient.firstName) + '</strong>' +
            '<br><small class="text-muted">' + esc(row.patient.mrn || '') + '</small></td>' +
          '<td><span class="care-gap-badge ' + overdueClass + '">' + row.overdueCount + '</span></td>' +
          '<td><span class="care-gap-badge ' + dueSoonClass + '">' + row.dueSoonCount + '</span></td>' +
          '<td>' + esc(row.topGap ? row.topGap.ruleName : '-') + '</td>' +
          '<td>' + (row.lastVisit ? esc(formatDateTime(row.lastVisit)) : '<span class="text-muted">None</span>') + '</td>';

        tr.addEventListener('click', function() {
          navigate('#chart/' + row.patient.id);
        });
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      wrap.appendChild(table);
      card.appendChild(wrap);
      app.appendChild(card);
    }

    // Wire filter events
    var searchEl = document.getElementById('care-gap-search');
    if (searchEl) {
      searchEl.addEventListener('input', function() {
        _searchTerm = this.value;
        render();
      });
    }
    var catEl = document.getElementById('care-gap-cat-filter');
    if (catEl) {
      catEl.addEventListener('change', function() {
        _filterCategory = this.value;
        render();
      });
    }
    var statusEl = document.getElementById('care-gap-status-filter');
    if (statusEl) {
      statusEl.addEventListener('change', function() {
        _filterStatus = this.value;
        render();
      });
    }
  }

  render();

  // Topbar buttons (wired after first render since topbar persists)
  setTimeout(function() {
    var manageBtn = document.getElementById('care-gap-manage-rules');
    if (manageBtn) {
      manageBtn.addEventListener('click', function() {
        openManageCareGapRulesModal();
      });
    }
  }, 0);
}

/* ============================================================
   VIEW LAYER — renderCareGapsSidebar (chart sidebar component)
   ============================================================ */

function renderCareGapsSidebar(patientId, container) {
  if (!container) return;
  container.innerHTML = '';

  var gaps = evaluatePatientCareGaps(patientId);
  var applicable = gaps.filter(function(g) { return g.status !== 'not_applicable'; });

  if (applicable.length === 0) {
    container.innerHTML = '<div class="care-gap-sidebar-empty text-muted">No applicable care gaps</div>';
    return;
  }

  // Group by category
  var grouped = {};
  applicable.forEach(function(g) {
    if (!grouped[g.category]) grouped[g.category] = [];
    grouped[g.category].push(g);
  });

  // Sort within groups: overdue first, then due_soon, then up_to_date, then dismissed
  var statusOrder = { overdue: 0, due_soon: 1, up_to_date: 2, dismissed: 3 };
  Object.keys(grouped).forEach(function(cat) {
    grouped[cat].sort(function(a, b) {
      return (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
    });
  });

  var maxVisible = 5;
  var totalRendered = 0;
  var allItems = [];

  // Category order
  var categoryOrder = ['Cancer Screening', 'Vaccinations', 'Metabolic', 'Mental Health', 'Other'];

  categoryOrder.forEach(function(cat) {
    if (!grouped[cat]) return;
    var catDiv = document.createElement('div');
    catDiv.className = 'care-gap-sidebar-category';

    var catHeader = document.createElement('div');
    catHeader.className = 'care-gap-sidebar-cat-header';
    catHeader.textContent = cat;
    var catColor = CARE_GAP_CATEGORY_COLORS[cat] || '#718096';
    catHeader.style.borderLeft = '3px solid ' + catColor;
    catHeader.style.paddingLeft = '8px';
    catDiv.appendChild(catHeader);

    grouped[cat].forEach(function(gap) {
      var item = document.createElement('div');
      item.className = 'care-gap-sidebar-item care-gap-sidebar-item-' + gap.status.replace('_', '-');
      item.style.cursor = 'pointer';

      var dot = '';
      if (gap.status === 'overdue') dot = '<span class="care-gap-dot care-gap-dot-overdue"></span>';
      else if (gap.status === 'due_soon') dot = '<span class="care-gap-dot care-gap-dot-due-soon"></span>';
      else if (gap.status === 'up_to_date') dot = '<span class="care-gap-dot care-gap-dot-up-to-date"></span>';
      else if (gap.status === 'dismissed') dot = '<span class="care-gap-dot care-gap-dot-dismissed"></span>';

      var meta = '';
      if (gap.status === 'overdue' && gap.nextDue) {
        meta = '<span class="care-gap-sidebar-meta text-muted">Due ' + esc(formatDateTime(gap.nextDue)) + '</span>';
      } else if (gap.status === 'overdue' && !gap.lastCompleted) {
        meta = '<span class="care-gap-sidebar-meta text-muted">Never completed</span>';
      } else if (gap.status === 'due_soon' && gap.nextDue) {
        meta = '<span class="care-gap-sidebar-meta text-muted">Due ' + esc(formatDateTime(gap.nextDue)) + '</span>';
      } else if (gap.status === 'up_to_date' && gap.lastCompleted) {
        meta = '<span class="care-gap-sidebar-meta text-muted">Last: ' + esc(formatDateTime(gap.lastCompleted)) + '</span>';
      } else if (gap.status === 'dismissed') {
        meta = '<span class="care-gap-sidebar-meta text-muted">Dismissed' + (gap.dismissReason ? ': ' + esc(gap.dismissReason) : '') + '</span>';
      }

      item.innerHTML = dot + '<span class="care-gap-sidebar-name">' + esc(gap.ruleName) + '</span>' + meta;

      item.addEventListener('click', function() {
        openCareGapDetailModal(patientId, gap.ruleId);
      });

      catDiv.appendChild(item);
      allItems.push(item);
      totalRendered++;
    });

    container.appendChild(catDiv);
  });

  // Show/hide with "Show N more" toggle
  if (totalRendered > maxVisible) {
    var hiddenCount = totalRendered - maxVisible;
    allItems.forEach(function(el, i) {
      if (i >= maxVisible) el.style.display = 'none';
    });

    var toggleLink = document.createElement('a');
    toggleLink.className = 'care-gap-sidebar-toggle';
    toggleLink.href = '#';
    toggleLink.textContent = 'Show ' + hiddenCount + ' more';
    var expanded = false;

    toggleLink.addEventListener('click', function(e) {
      e.preventDefault();
      expanded = !expanded;
      allItems.forEach(function(el, i) {
        if (i >= maxVisible) el.style.display = expanded ? '' : 'none';
      });
      toggleLink.textContent = expanded ? 'Show less' : ('Show ' + hiddenCount + ' more');
    });

    container.appendChild(toggleLink);
  }
}

/* ============================================================
   VIEW LAYER — openCareGapDetailModal
   ============================================================ */

function openCareGapDetailModal(patientId, ruleId) {
  var patient = getPatient(patientId);
  var rules = getAllCareGapRules();
  var rule = rules.find(function(r) { return r.id === ruleId; });
  if (!rule || !patient) return;

  var gaps = evaluatePatientCareGaps(patientId);
  var gap = gaps.find(function(g) { return g.ruleId === ruleId; });

  // Completion history
  var completions = _getCareGapCompletions().filter(function(c) {
    return c.patientId === patientId && c.ruleId === ruleId;
  }).sort(function(a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); });

  // Dismissal history
  var dismissals = _getCareGapDismissals().filter(function(d) {
    return d.patientId === patientId && d.ruleId === ruleId && d.type === 'dismissal';
  });

  var statusBadge = '';
  if (gap) {
    var badgeClass = 'care-gap-badge-' + gap.status.replace('_', '-');
    var labelMap = { overdue: 'Overdue', due_soon: 'Due Soon', up_to_date: 'Up to Date', not_applicable: 'N/A', dismissed: 'Dismissed' };
    statusBadge = '<span class="care-gap-badge ' + badgeClass + '">' + (labelMap[gap.status] || gap.status) + '</span>';
  }

  var frequencyStr = rule.frequency.value >= 99 ? 'One-time' : ('Every ' + rule.frequency.value + ' ' + rule.frequency.unit);

  var criteriaStr = '';
  if (rule.criteria.sex) criteriaStr += 'Sex: ' + esc(rule.criteria.sex) + ' | ';
  if (rule.criteria.minAge != null) criteriaStr += 'Age: ' + rule.criteria.minAge + (rule.criteria.maxAge ? '-' + rule.criteria.maxAge : '+') + ' | ';
  if (rule.criteria.conditions && rule.criteria.conditions.length > 0) criteriaStr += 'Conditions: ' + esc(rule.criteria.conditions.join(', '));
  if (!criteriaStr) criteriaStr = 'All patients';
  criteriaStr = criteriaStr.replace(/\|\s*$/, '');

  var historyHTML = '';
  if (completions.length > 0) {
    historyHTML = '<div class="care-gap-detail-section"><strong>Completion History</strong><ul class="care-gap-history-list">';
    completions.forEach(function(c) {
      historyHTML += '<li>' + esc(formatDateTime(c.date)) + '</li>';
    });
    historyHTML += '</ul></div>';
  } else {
    historyHTML = '<div class="care-gap-detail-section text-muted">No completion history recorded</div>';
  }

  if (dismissals.length > 0) {
    historyHTML += '<div class="care-gap-detail-section"><strong>Dismissals</strong><ul class="care-gap-history-list">';
    dismissals.forEach(function(d) {
      historyHTML += '<li>' + esc(formatDateTime(d.date)) + ' &mdash; ' + esc(d.reason) + '</li>';
    });
    historyHTML += '</ul></div>';
  }

  var todayStr = new Date().toISOString().slice(0, 10);

  var bodyHTML =
    '<div class="care-gap-detail">' +
      '<div class="care-gap-detail-header">' +
        '<div class="care-gap-detail-title">' + esc(rule.name) + ' ' + statusBadge + '</div>' +
        '<div class="care-gap-detail-category">' + esc(rule.category) + '</div>' +
      '</div>' +
      '<div class="care-gap-detail-section"><strong>Description</strong><p>' + esc(rule.description) + '</p></div>' +
      '<div class="care-gap-detail-section"><strong>Criteria</strong><p>' + criteriaStr + '</p></div>' +
      '<div class="care-gap-detail-section"><strong>Frequency</strong><p>' + esc(frequencyStr) + '</p></div>' +
      (gap && gap.lastCompleted ? '<div class="care-gap-detail-section"><strong>Last Completed</strong><p>' + esc(formatDateTime(gap.lastCompleted)) + '</p></div>' : '') +
      (gap && gap.nextDue ? '<div class="care-gap-detail-section"><strong>Next Due</strong><p>' + esc(formatDateTime(gap.nextDue)) + '</p></div>' : '') +
      historyHTML +
      '<hr>' +
      '<div class="care-gap-detail-actions">' +
        '<div class="form-group">' +
          '<label class="form-label">Mark as Completed</label>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<input type="date" class="form-control" id="care-gap-complete-date" value="' + todayStr + '" style="width:180px;">' +
            '<button class="btn btn-success btn-sm" id="care-gap-mark-complete">Mark Complete</button>' +
          '</div>' +
        '</div>' +
        '<div class="form-group" style="margin-top:12px;">' +
          '<label class="form-label">Dismiss</label>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<select class="form-control" id="care-gap-dismiss-reason" style="width:220px;">' +
              '<option value="Patient Declined">Patient Declined</option>' +
              '<option value="Not Clinically Indicated">Not Clinically Indicated</option>' +
              '<option value="Done Elsewhere">Done Elsewhere</option>' +
              '<option value="Other">Other</option>' +
            '</select>' +
            '<button class="btn btn-secondary btn-sm" id="care-gap-dismiss">Dismiss</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-primary btn-sm" id="care-gap-order-now">Order Now</button>';

  openModal({
    title: 'Care Gap Detail',
    bodyHTML: bodyHTML,
    footerHTML: footerHTML
  });

  // Wire events
  setTimeout(function() {
    var markBtn = document.getElementById('care-gap-mark-complete');
    if (markBtn) {
      markBtn.addEventListener('click', function() {
        var dateVal = document.getElementById('care-gap-complete-date').value;
        if (!dateVal) {
          showToast('Please select a date', 'warning');
          return;
        }
        markCareGapComplete(patientId, ruleId, new Date(dateVal).toISOString());
        showToast(rule.name + ' marked as completed', 'success');
        closeModal();
        // Re-render sidebar if in chart
        _refreshCareGapViews(patientId);
      });
    }

    var dismissBtn = document.getElementById('care-gap-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function() {
        var reason = document.getElementById('care-gap-dismiss-reason').value;
        dismissCareGap(patientId, ruleId, reason);
        showToast(rule.name + ' dismissed: ' + reason, 'success');
        closeModal();
        _refreshCareGapViews(patientId);
      });
    }

    var orderBtn = document.getElementById('care-gap-order-now');
    if (orderBtn) {
      orderBtn.addEventListener('click', function() {
        // Navigate to orders for this patient's most recent open encounter
        var encs = getEncountersByPatient(patientId).filter(function(e) { return e.status === 'Open'; });
        if (encs.length > 0) {
          closeModal();
          navigate('#orders/' + encs[0].id);
        } else {
          showToast('No open encounter found. Please create an encounter first.', 'warning');
        }
      });
    }
  }, 50);
}

function _refreshCareGapViews(patientId) {
  // Try to refresh sidebar if visible
  var sidebarContainer = document.getElementById('care-gap-sidebar');
  if (sidebarContainer && patientId) {
    renderCareGapsSidebar(patientId, sidebarContainer);
  }
  // If on the care-gaps dashboard, re-render
  if (window.location.hash === '#care-gaps') {
    renderCareGaps();
  }
}

/* ============================================================
   VIEW LAYER — openManageCareGapRulesModal (Admin)
   ============================================================ */

function openManageCareGapRulesModal() {
  _renderRulesModal();
}

function _renderRulesModal() {
  var rules = getAllCareGapRules();

  var tableRows = rules.map(function(rule) {
    var enabledClass = rule.enabled !== false ? 'care-gap-badge-up-to-date' : 'care-gap-badge-dismissed';
    var enabledLabel = rule.enabled !== false ? 'Enabled' : 'Disabled';
    var freqStr = rule.frequency.value >= 99 ? 'One-time' : (rule.frequency.value + ' ' + rule.frequency.unit);
    return '<tr>' +
      '<td>' + esc(rule.name) + '</td>' +
      '<td>' + esc(rule.category) + '</td>' +
      '<td>' + esc(freqStr) + '</td>' +
      '<td><span class="care-gap-badge ' + enabledClass + '">' + enabledLabel + '</span></td>' +
      '<td>' +
        '<button class="btn btn-ghost btn-sm care-gap-rule-toggle" data-rule-id="' + esc(rule.id) + '">' + (rule.enabled !== false ? 'Disable' : 'Enable') + '</button>' +
        '<button class="btn btn-ghost btn-sm care-gap-rule-edit" data-rule-id="' + esc(rule.id) + '">Edit</button>' +
        '<button class="btn btn-ghost btn-sm care-gap-rule-delete" data-rule-id="' + esc(rule.id) + '" style="color:var(--danger);">Delete</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  var bodyHTML =
    '<div class="care-gap-rules-manage">' +
      '<div class="table-wrap"><table class="table">' +
        '<thead><tr>' +
          '<th>Name</th><th>Category</th><th>Frequency</th><th>Status</th><th>Actions</th>' +
        '</tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table></div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-ghost" onclick="closeModal()">Close</button>' +
    '<button class="btn btn-secondary btn-sm" id="care-gap-reset-defaults">Reset Defaults</button>' +
    '<button class="btn btn-primary btn-sm" id="care-gap-add-rule">+ Add Rule</button>';

  openModal({
    title: 'Manage Care Gap Rules',
    bodyHTML: bodyHTML,
    footerHTML: footerHTML,
    size: 'lg'
  });

  setTimeout(function() {
    // Toggle buttons
    document.querySelectorAll('.care-gap-rule-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var rId = this.dataset.ruleId;
        var r = getAllCareGapRules().find(function(x) { return x.id === rId; });
        if (r) {
          saveCareGapRule({ id: rId, enabled: r.enabled === false ? true : false });
          _renderRulesModal();
        }
      });
    });

    // Edit buttons
    document.querySelectorAll('.care-gap-rule-edit').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var rId = this.dataset.ruleId;
        _openRuleEditorModal(rId);
      });
    });

    // Delete buttons
    document.querySelectorAll('.care-gap-rule-delete').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var rId = this.dataset.ruleId;
        if (confirm('Delete this rule? This cannot be undone.')) {
          deleteCareGapRule(rId);
          _renderRulesModal();
          showToast('Rule deleted', 'success');
        }
      });
    });

    // Reset defaults
    var resetBtn = document.getElementById('care-gap-reset-defaults');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (confirm('Reset all care gap rules to defaults? Any custom rules will be removed.')) {
          saveAll(KEYS.careGapRules, []);
          _renderRulesModal();
          showToast('Rules reset to defaults', 'success');
        }
      });
    }

    // Add rule
    var addBtn = document.getElementById('care-gap-add-rule');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        _openRuleEditorModal(null);
      });
    }
  }, 50);
}

function _openRuleEditorModal(ruleId) {
  var rule = null;
  if (ruleId) {
    rule = getAllCareGapRules().find(function(r) { return r.id === ruleId; });
  }
  var isNew = !rule;
  if (!rule) {
    rule = {
      id: '',
      name: '',
      category: 'Other',
      description: '',
      criteria: { minAge: null, maxAge: null, sex: null, conditions: [], medications: [] },
      frequency: { value: 1, unit: 'years' },
      matchType: 'screening',
      matchCodes: [],
      enabled: true
    };
  }

  var categories = ['Cancer Screening', 'Vaccinations', 'Metabolic', 'Mental Health', 'Other'];
  var matchTypes = ['lab', 'immunization', 'encounter', 'screening', 'vital', 'imaging'];

  var catOpts = categories.map(function(c) {
    return '<option value="' + esc(c) + '"' + (rule.category === c ? ' selected' : '') + '>' + esc(c) + '</option>';
  }).join('');

  var typeOpts = matchTypes.map(function(t) {
    return '<option value="' + esc(t) + '"' + (rule.matchType === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');

  var sexOpts = '<option value="">Any</option>' +
    '<option value="Male"' + (rule.criteria.sex === 'Male' ? ' selected' : '') + '>Male</option>' +
    '<option value="Female"' + (rule.criteria.sex === 'Female' ? ' selected' : '') + '>Female</option>';

  var unitOpts = '<option value="years"' + (rule.frequency.unit === 'years' ? ' selected' : '') + '>years</option>' +
    '<option value="months"' + (rule.frequency.unit === 'months' ? ' selected' : '') + '>months</option>';

  var bodyHTML =
    '<div class="care-gap-rule-form">' +
      '<div class="form-group">' +
        '<label class="form-label">Rule Name</label>' +
        '<input class="form-control" id="cg-rule-name" value="' + esc(rule.name) + '">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Category</label>' +
        '<select class="form-control" id="cg-rule-category">' + catOpts + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Description</label>' +
        '<textarea class="form-control" id="cg-rule-desc" rows="2">' + esc(rule.description) + '</textarea>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">' +
        '<div class="form-group">' +
          '<label class="form-label">Min Age</label>' +
          '<input type="number" class="form-control" id="cg-rule-minage" value="' + (rule.criteria.minAge != null ? rule.criteria.minAge : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Max Age</label>' +
          '<input type="number" class="form-control" id="cg-rule-maxage" value="' + (rule.criteria.maxAge != null ? rule.criteria.maxAge : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Sex</label>' +
          '<select class="form-control" id="cg-rule-sex">' + sexOpts + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Conditions (comma-separated keywords)</label>' +
        '<input class="form-control" id="cg-rule-conditions" value="' + esc((rule.criteria.conditions || []).join(', ')) + '">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Medications (comma-separated keywords)</label>' +
        '<input class="form-control" id="cg-rule-medications" value="' + esc((rule.criteria.medications || []).join(', ')) + '">' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div class="form-group">' +
          '<label class="form-label">Frequency Value</label>' +
          '<input type="number" class="form-control" id="cg-rule-freq-val" value="' + rule.frequency.value + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Frequency Unit</label>' +
          '<select class="form-control" id="cg-rule-freq-unit">' + unitOpts + '</select>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div class="form-group">' +
          '<label class="form-label">Match Type</label>' +
          '<select class="form-control" id="cg-rule-matchtype">' + typeOpts + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Match Codes (comma-separated keywords to match in records)</label>' +
        '<input class="form-control" id="cg-rule-matchcodes" value="' + esc((rule.matchCodes || []).join(', ')) + '">' +
      '</div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" id="cg-rule-save">' + (isNew ? 'Create Rule' : 'Save Changes') + '</button>';

  openModal({
    title: isNew ? 'Add Care Gap Rule' : 'Edit Rule: ' + rule.name,
    bodyHTML: bodyHTML,
    footerHTML: footerHTML
  });

  setTimeout(function() {
    var saveBtn = document.getElementById('cg-rule-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var name = document.getElementById('cg-rule-name').value.trim();
        if (!name) {
          showToast('Rule name is required', 'warning');
          return;
        }

        var minAgeVal = document.getElementById('cg-rule-minage').value;
        var maxAgeVal = document.getElementById('cg-rule-maxage').value;
        var condStr = document.getElementById('cg-rule-conditions').value.trim();
        var medStr = document.getElementById('cg-rule-medications').value.trim();
        var codeStr = document.getElementById('cg-rule-matchcodes').value.trim();

        var updatedRule = {
          id: ruleId || generateId(),
          name: name,
          category: document.getElementById('cg-rule-category').value,
          description: document.getElementById('cg-rule-desc').value.trim(),
          criteria: {
            minAge: minAgeVal !== '' ? parseInt(minAgeVal, 10) : null,
            maxAge: maxAgeVal !== '' ? parseInt(maxAgeVal, 10) : null,
            sex: document.getElementById('cg-rule-sex').value || null,
            conditions: condStr ? condStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
            medications: medStr ? medStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : []
          },
          frequency: {
            value: parseInt(document.getElementById('cg-rule-freq-val').value, 10) || 1,
            unit: document.getElementById('cg-rule-freq-unit').value
          },
          matchType: document.getElementById('cg-rule-matchtype').value,
          matchCodes: codeStr ? codeStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
          enabled: isNew ? true : (rule.enabled !== false)
        };

        saveCareGapRule(updatedRule);
        showToast(isNew ? 'Rule created' : 'Rule updated', 'success');
        closeModal();
        _renderRulesModal();
      });
    }
  }, 50);
}
