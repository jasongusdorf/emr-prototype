/* ============================================================
   views/ai-review.js — AI Clinical Decision Support System
   Rule-based simulated AI review: chart completeness, care gaps,
   drug interactions, clinical decision support, documentation
   quality, risk stratification, patient education.
   ============================================================ */

/* ---------- Module-level state ---------- */
let _aiFindings = [];           // current session findings (not persisted)
let _aiDismissed = new Set();   // dismissed finding IDs for this session
let _aiActiveTab = 'overview';  // active tab key

/* ---------- Severity constants ---------- */
const AI_SEV = {
  CRITICAL: 'critical',
  WARNING:  'warning',
  INFO:     'info',
};

/* ---------- Drug interaction database ---------- */
const DRUG_INTERACTIONS = [
  {
    id: 'warfarin-nsaid',
    drugs: [['warfarin', 'coumadin'], ['ibuprofen', 'naproxen', 'aspirin', 'nsaid', 'diclofenac', 'meloxicam', 'celecoxib', 'ketorolac', 'indomethacin']],
    severity: AI_SEV.CRITICAL,
    risk: 'Increased bleeding risk',
    description: 'Concurrent use of warfarin and NSAIDs significantly increases the risk of gastrointestinal and other hemorrhagic events. Consider alternative analgesics (acetaminophen) or add GI prophylaxis.',
    category: 'drug-safety',
  },
  {
    id: 'ace-potassium',
    drugs: [['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'fosinopril', 'quinapril', 'ace inhibitor'], ['potassium', 'k-dur', 'klor-con', 'potassium chloride']],
    severity: AI_SEV.CRITICAL,
    risk: 'Hyperkalemia risk',
    description: 'ACE inhibitors reduce potassium excretion. Adding potassium supplements can lead to dangerous hyperkalemia. Monitor serum potassium levels closely.',
    category: 'drug-safety',
  },
  {
    id: 'ssri-maoi',
    drugs: [['sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine', 'ssri'], ['phenelzine', 'tranylcypromine', 'isocarboxazid', 'selegiline', 'maoi']],
    severity: AI_SEV.CRITICAL,
    risk: 'Serotonin syndrome',
    description: 'Concurrent SSRI and MAOI use can cause potentially fatal serotonin syndrome. These agents must not be used together. A 14-day washout period is required between switching.',
    category: 'drug-safety',
  },
  {
    id: 'metformin-contrast',
    drugs: [['metformin', 'glucophage'], ['contrast', 'iodinated contrast', 'contrast dye']],
    severity: AI_SEV.WARNING,
    risk: 'Lactic acidosis risk',
    description: 'Metformin should be held 48 hours before and after iodinated contrast administration due to risk of contrast-induced nephropathy and subsequent lactic acidosis.',
    category: 'drug-safety',
  },
  {
    id: 'statin-macrolide',
    drugs: [['atorvastatin', 'simvastatin', 'lovastatin', 'rosuvastatin', 'pravastatin', 'statin'], ['erythromycin', 'clarithromycin', 'azithromycin', 'macrolide']],
    severity: AI_SEV.WARNING,
    risk: 'Rhabdomyolysis risk',
    description: 'Macrolide antibiotics inhibit CYP3A4 metabolism of certain statins, increasing statin levels and risk of rhabdomyolysis. Consider temporarily holding statin or using azithromycin (lower interaction risk).',
    category: 'drug-safety',
  },
  {
    id: 'opioid-benzo',
    drugs: [['oxycodone', 'hydrocodone', 'morphine', 'fentanyl', 'tramadol', 'codeine', 'methadone', 'opioid', 'hydromorphone', 'oxymorphone'], ['diazepam', 'lorazepam', 'alprazolam', 'clonazepam', 'midazolam', 'benzodiazepine', 'temazepam']],
    severity: AI_SEV.CRITICAL,
    risk: 'Respiratory depression',
    description: 'FDA Black Box Warning: Concurrent opioid and benzodiazepine use increases the risk of profound sedation, respiratory depression, coma, and death. Avoid concurrent use when possible.',
    category: 'drug-safety',
  },
  {
    id: 'anticoag-antiplatelet',
    drugs: [['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'enoxaparin', 'heparin', 'anticoagulant'], ['clopidogrel', 'prasugrel', 'ticagrelor', 'aspirin', 'antiplatelet']],
    severity: AI_SEV.WARNING,
    risk: 'Increased bleeding risk',
    description: 'Dual antithrombotic therapy (anticoagulant + antiplatelet) substantially increases bleeding risk. Ensure clear indication exists (e.g., recent ACS with stent) and use shortest recommended duration.',
    category: 'drug-safety',
  },
];

/* ---------- Charlson Comorbidity Index mappings ---------- */
const CHARLSON_CONDITIONS = [
  { weight: 1, terms: ['myocardial infarction', 'mi', 'heart attack', 'nstemi', 'stemi'] },
  { weight: 1, terms: ['congestive heart failure', 'chf', 'heart failure', 'hfref', 'hfpef'] },
  { weight: 1, terms: ['peripheral vascular', 'pvd', 'pad', 'peripheral arterial'] },
  { weight: 1, terms: ['cerebrovascular', 'stroke', 'cva', 'tia', 'transient ischemic'] },
  { weight: 1, terms: ['dementia', 'alzheimer'] },
  { weight: 1, terms: ['copd', 'chronic obstructive', 'pulmonary disease', 'emphysema', 'chronic bronchitis'] },
  { weight: 1, terms: ['connective tissue', 'rheumatoid', 'lupus', 'sle', 'scleroderma'] },
  { weight: 1, terms: ['peptic ulcer', 'gastric ulcer', 'duodenal ulcer'] },
  { weight: 1, terms: ['mild liver', 'hepatitis', 'fatty liver', 'nafld'] },
  { weight: 1, terms: ['diabetes', 'dm type 2', 'dm type 1', 'type 2 diabetes', 'type 1 diabetes', 't2dm', 't1dm'] },
  { weight: 2, terms: ['hemiplegia', 'paraplegia', 'quadriplegia'] },
  { weight: 2, terms: ['moderate renal', 'severe renal', 'ckd stage 3', 'ckd stage 4', 'ckd stage 5', 'chronic kidney disease', 'ckd', 'esrd', 'dialysis'] },
  { weight: 2, terms: ['diabetes with complications', 'diabetic nephropathy', 'diabetic retinopathy', 'diabetic neuropathy'] },
  { weight: 2, terms: ['malignancy', 'cancer', 'carcinoma', 'lymphoma', 'leukemia', 'tumor'] },
  { weight: 3, terms: ['moderate liver', 'severe liver', 'cirrhosis', 'portal hypertension', 'esophageal varices'] },
  { weight: 6, terms: ['metastatic', 'metastasis'] },
  { weight: 6, terms: ['aids', 'hiv'] },
];

/* ---------- Patient education database ---------- */
const EDUCATION_TOPICS = [
  { conditions: ['diabetes', 'dm', 't2dm', 't1dm', 'a1c'], title: 'Diabetes Self-Management', description: 'Blood glucose monitoring, dietary carbohydrate counting, hypoglycemia recognition and treatment, sick-day management, and foot care basics.' },
  { conditions: ['hypertension', 'htn', 'high blood pressure'], title: 'Blood Pressure Management', description: 'DASH diet principles, sodium restriction (<2300mg/day), regular physical activity (150 min/week), medication adherence, and home BP monitoring technique.' },
  { conditions: ['heart failure', 'chf', 'hfref', 'hfpef'], title: 'Heart Failure Self-Care', description: 'Daily weight monitoring, fluid restriction, low-sodium diet, recognizing worsening symptoms (weight gain >2 lbs/day), and when to seek emergency care.' },
  { conditions: ['copd', 'emphysema', 'chronic bronchitis'], title: 'COPD Action Plan', description: 'Inhaler technique, recognizing exacerbations, smoking cessation resources, pulmonary rehabilitation, and oxygen therapy guidance.' },
  { conditions: ['asthma'], title: 'Asthma Management', description: 'Inhaler technique and spacer use, identifying triggers, asthma action plan zones (green/yellow/red), and when to use rescue vs. controller medications.' },
  { conditions: ['atrial fibrillation', 'afib', 'a-fib'], title: 'Atrial Fibrillation Education', description: 'Understanding stroke risk, anticoagulation importance, pulse self-check, rate vs. rhythm control, and when to seek emergency care.' },
  { conditions: ['ckd', 'chronic kidney', 'renal'], title: 'Kidney Disease Nutrition', description: 'Protein, phosphorus, potassium, and sodium dietary guidelines. Medication review for nephrotoxic drugs. Hydration guidance.' },
  { conditions: ['obesity', 'overweight', 'bmi'], title: 'Weight Management', description: 'Caloric deficit strategies, physical activity recommendations, behavioral modification techniques, and overview of pharmacologic/surgical options.' },
  { conditions: ['depression', 'anxiety', 'phq'], title: 'Mental Health Resources', description: 'Cognitive behavioral therapy basics, crisis hotline numbers (988 Suicide & Crisis Lifeline), medication expectations and side effects, sleep hygiene, and mindfulness techniques.' },
  { conditions: ['anticoagulant', 'warfarin', 'blood thinner', 'apixaban', 'rivaroxaban'], title: 'Anticoagulant Safety', description: 'Bleeding precautions, dietary vitamin K consistency (warfarin), signs requiring emergency care, medication interactions to avoid, and importance of adherence.' },
  { conditions: ['opioid', 'pain management', 'chronic pain'], title: 'Safe Opioid Use & Pain Management', description: 'Naloxone (Narcan) training, safe storage and disposal, non-opioid alternatives, risk of dependence, and tapering expectations.' },
  { conditions: ['osteoporosis', 'bone density', 'dexa'], title: 'Fall Prevention & Bone Health', description: 'Calcium and vitamin D supplementation, weight-bearing exercise, home safety modifications, and bisphosphonate medication guidance.' },
];

/* ============================================================
   MAIN ENTRY: renderAIReview(patientId)
   ============================================================ */
function renderAIReview(patientId) {
  var app = document.getElementById('app');
  app.innerHTML = '';

  /* ---------- Load all patient data ---------- */
  var patient = loadAll(KEYS.patients).find(function(p) { return p.id === patientId; });
  if (!patient) {
    app.innerHTML = '<div class="ai-empty">Patient not found.</div>';
    return;
  }

  var meds          = loadAll(KEYS.patientMeds).filter(function(m) { return m.patientId === patientId; });
  var problems      = loadAll(KEYS.problems).filter(function(p) { return p.patientId === patientId; });
  var vitals        = loadAll(KEYS.vitals).filter(function(v) { return v.patientId === patientId; });
  var encounters    = loadAll(KEYS.encounters).filter(function(e) { return e.patientId === patientId; });
  var orders        = loadAll(KEYS.orders).filter(function(o) { return o.patientId === patientId; });
  var allergies     = loadAll(KEYS.allergies).filter(function(a) { return a.patientId === patientId; });
  var labs          = loadAll(KEYS.labResults).filter(function(l) { return l.patientId === patientId; });
  var immunizations = loadAll(KEYS.immunizations).filter(function(i) { return i.patientId === patientId; });
  var screenings    = loadAll(KEYS.screenings).filter(function(s) { return s.patientId === patientId; });
  var referrals     = loadAll(KEYS.referrals).filter(function(r) { return r.patientId === patientId; });
  var notes         = loadAll(KEYS.notes).filter(function(n) { return encounters.some(function(e) { return e.id === n.encounterId; }); });

  var activeMeds     = meds.filter(function(m) { return (m.status || '').toLowerCase() === 'active'; });
  var activeProblems = problems.filter(function(p) { return (p.status || '').toLowerCase() === 'active'; });

  var patientAge = patient.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000) : null;
  var patientSex = (patient.sex || '').toLowerCase();

  /* ---------- Reset session state ---------- */
  _aiFindings = [];
  _aiDismissed = new Set();
  _aiActiveTab = 'overview';

  /* ============================================================
     1. Chart Completeness Review
     ============================================================ */
  _runChartCompleteness(patient, allergies, activeProblems, encounters, vitals, patientAge);

  /* ============================================================
     2. Care Gap Analysis
     ============================================================ */
  _runCareGapAnalysis(patient, patientAge, patientSex, activeProblems, labs, screenings, orders, immunizations);

  /* ============================================================
     3. Drug Interaction Checker
     ============================================================ */
  _runDrugInteractions(activeMeds, patientId);

  /* ============================================================
     4. Clinical Decision Support
     ============================================================ */
  _runClinicalDecisionSupport(activeProblems, activeMeds, vitals, labs, orders, referrals, patientAge, patientId);

  /* ============================================================
     5. Documentation Quality Score
     ============================================================ */
  _runDocumentationQuality(encounters, notes);

  /* ============================================================
     6. Risk Stratification
     ============================================================ */
  _runRiskStratification(activeProblems, activeMeds, screenings, encounters, patientAge);

  /* ============================================================
     7. Patient Education Recommendations
     ============================================================ */
  _runEducationRecommendations(activeProblems, activeMeds);

  /* ---------- Render the dashboard ---------- */
  _renderAIDashboard(app, patient, patientAge, patientSex);
}

/* ============================================================
   1. Chart Completeness
   ============================================================ */
function _runChartCompleteness(patient, allergies, activeProblems, encounters, vitals, age) {
  // Missing allergies
  if (allergies.length === 0) {
    _aiFindings.push({
      id: 'comp-no-allergies',
      category: 'completeness',
      severity: AI_SEV.WARNING,
      title: 'No Allergies Documented',
      description: 'No allergy information has been recorded for this patient. Document allergies or mark as NKDA (No Known Drug Allergies) to ensure medication safety.',
      action: { label: 'Go to Chart', hash: '#chart/' + patient.id },
    });
  }

  // No active problems
  if (activeProblems.length === 0) {
    _aiFindings.push({
      id: 'comp-no-problems',
      category: 'completeness',
      severity: AI_SEV.WARNING,
      title: 'Empty Problem List',
      description: 'No active problems on the problem list. An accurate problem list is essential for clinical decision support, billing accuracy, and care coordination.',
      action: { label: 'Go to Chart', hash: '#chart/' + patient.id },
    });
  }

  // Unsigned encounters
  var unsigned = encounters.filter(function(e) { return !e.signedAt && !e.signed; });
  if (unsigned.length > 0) {
    _aiFindings.push({
      id: 'comp-unsigned-enc',
      category: 'completeness',
      severity: AI_SEV.WARNING,
      title: unsigned.length + ' Unsigned Encounter' + (unsigned.length > 1 ? 's' : ''),
      description: 'Unsigned encounter notes may delay billing, create compliance risk, and leave clinical documentation incomplete. Sign encounters promptly.',
      action: { label: 'View Encounters', hash: '#chart/' + patient.id },
    });
  }

  // Overdue vitals (none in last 90 days)
  var now = Date.now();
  var ninetyDays = 90 * 24 * 60 * 60 * 1000;
  var recentVitals = vitals.filter(function(v) {
    return v.date && (now - new Date(v.date).getTime()) < ninetyDays;
  });
  if (vitals.length > 0 && recentVitals.length === 0) {
    _aiFindings.push({
      id: 'comp-overdue-vitals',
      category: 'completeness',
      severity: AI_SEV.INFO,
      title: 'Vitals Overdue',
      description: 'No vital signs recorded in the last 90 days. Updated vitals support accurate clinical assessment and risk scoring.',
      action: { label: 'Go to Chart', hash: '#chart/' + patient.id },
    });
  } else if (vitals.length === 0) {
    _aiFindings.push({
      id: 'comp-no-vitals',
      category: 'completeness',
      severity: AI_SEV.WARNING,
      title: 'No Vitals Recorded',
      description: 'No vital signs have ever been documented for this patient. Baseline vitals are required for clinical assessment.',
      action: { label: 'Go to Chart', hash: '#chart/' + patient.id },
    });
  }

  // Missing demographics
  var missingDemo = [];
  if (!patient.dob) missingDemo.push('date of birth');
  if (!patient.sex) missingDemo.push('sex');
  if (!patient.firstName) missingDemo.push('first name');
  if (!patient.lastName) missingDemo.push('last name');
  if (missingDemo.length > 0) {
    _aiFindings.push({
      id: 'comp-missing-demo',
      category: 'completeness',
      severity: AI_SEV.WARNING,
      title: 'Missing Demographics',
      description: 'Missing: ' + missingDemo.join(', ') + '. Complete demographics are required for accurate screening recommendations and billing.',
      action: { label: 'Edit Patient', hash: '#chart/' + patient.id },
    });
  }
}

/* ============================================================
   2. Care Gap Analysis
   ============================================================ */
function _runCareGapAnalysis(patient, age, sex, activeProblems, labs, screenings, orders, immunizations) {
  if (age === null) return;  // cannot assess without age

  var problemText = activeProblems.map(function(p) { return (p.name || '').toLowerCase(); }).join(' ');
  var hasDiabetes = /diabetes|dm |dm$|t2dm|t1dm|a1c/i.test(problemText);
  var now = Date.now();
  var oneYear = 365 * 24 * 60 * 60 * 1000;

  // Helper: check if a screening/order/lab/immunization contains keywords in the last N years
  function _hasRecentItem(keywords, yearsBack) {
    var cutoff = now - (yearsBack * oneYear);
    var kw = keywords.map(function(k) { return k.toLowerCase(); });
    var matchFn = function(text) { return kw.some(function(k) { return (text || '').toLowerCase().indexOf(k) >= 0; }); };

    var inScreenings = screenings.some(function(s) { return matchFn(s.name || s.type || '') && s.date && new Date(s.date).getTime() > cutoff; });
    if (inScreenings) return true;
    var inOrders = orders.some(function(o) { return matchFn(o.detail || o.type || '') && o.createdAt && new Date(o.createdAt).getTime() > cutoff; });
    if (inOrders) return true;
    var inLabs = labs.some(function(l) { return matchFn(l.testName || '') && l.date && new Date(l.date).getTime() > cutoff; });
    if (inLabs) return true;
    var inImmunizations = immunizations.some(function(i) { return matchFn(i.name || i.vaccine || '') && (i.date || i.administeredDate) && new Date(i.date || i.administeredDate).getTime() > cutoff; });
    if (inImmunizations) return true;
    return false;
  }

  // Mammogram: Female 40+
  if (sex.startsWith('f') && age >= 40) {
    if (!_hasRecentItem(['mammogram', 'mammography', 'breast imaging'], 2)) {
      _aiFindings.push({
        id: 'gap-mammogram',
        category: 'care-gaps',
        severity: AI_SEV.WARNING,
        title: 'Mammogram Overdue',
        description: 'USPSTF recommends biennial screening mammography for women ages 40-74. No recent mammogram found in the last 2 years.',
        action: { label: 'Order Mammogram', hash: '#chart/' + patient.id },
      });
    }
  }

  // Colonoscopy: 50+
  if (age >= 50) {
    if (!_hasRecentItem(['colonoscopy', 'colorectal', 'colon'], 10)) {
      _aiFindings.push({
        id: 'gap-colonoscopy',
        category: 'care-gaps',
        severity: AI_SEV.WARNING,
        title: 'Colonoscopy Overdue',
        description: 'USPSTF recommends colorectal cancer screening starting at age 45-50. Colonoscopy is recommended every 10 years. No recent colonoscopy found.',
        action: { label: 'Order Colonoscopy', hash: '#chart/' + patient.id },
      });
    }
  }

  // A1C for diabetics
  if (hasDiabetes) {
    if (!_hasRecentItem(['a1c', 'hemoglobin a1c', 'hba1c', 'glycated'], 0.5)) {
      _aiFindings.push({
        id: 'gap-a1c',
        category: 'care-gaps',
        severity: AI_SEV.WARNING,
        title: 'HbA1c Overdue',
        description: 'ADA guidelines recommend HbA1c monitoring every 3-6 months for diabetic patients. No recent A1c result found in the last 6 months.',
        action: { label: 'Order A1c', hash: '#chart/' + patient.id },
      });
    }
  }

  // Lipid panel: 40+
  if (age >= 40) {
    if (!_hasRecentItem(['lipid', 'cholesterol', 'ldl', 'hdl', 'triglyceride'], 5)) {
      _aiFindings.push({
        id: 'gap-lipid',
        category: 'care-gaps',
        severity: AI_SEV.INFO,
        title: 'Lipid Panel Due',
        description: 'ACC/AHA recommends lipid screening every 4-6 years for adults 40+, and more frequently for patients on statins or with risk factors.',
        action: { label: 'Order Lipid Panel', hash: '#chart/' + patient.id },
      });
    }
  }

  // Depression screening (PHQ-9)
  if (!_hasRecentItem(['phq', 'phq-9', 'depression screen', 'depression screening'], 1)) {
    _aiFindings.push({
      id: 'gap-phq9',
      category: 'care-gaps',
      severity: AI_SEV.INFO,
      title: 'Depression Screening Due',
      description: 'USPSTF recommends screening for depression in the general adult population. No PHQ-9 or depression screening documented in the last year.',
      action: { label: 'Order PHQ-9', hash: '#chart/' + patient.id },
    });
  }

  // Influenza vaccine
  if (!_hasRecentItem(['influenza', 'flu vaccine', 'flu shot'], 1)) {
    _aiFindings.push({
      id: 'gap-flu',
      category: 'care-gaps',
      severity: AI_SEV.INFO,
      title: 'Annual Flu Vaccine Due',
      description: 'CDC recommends annual influenza vaccination for all patients 6 months and older. No flu vaccine documented in the last year.',
      action: { label: 'Order Flu Vaccine', hash: '#chart/' + patient.id },
    });
  }

  // Pneumonia vaccine: 65+
  if (age >= 65) {
    if (!_hasRecentItem(['pneumonia', 'pneumococcal', 'prevnar', 'pneumovax', 'pcv13', 'pcv15', 'pcv20', 'ppsv23'], 5)) {
      _aiFindings.push({
        id: 'gap-pneumonia',
        category: 'care-gaps',
        severity: AI_SEV.INFO,
        title: 'Pneumococcal Vaccine Due',
        description: 'CDC recommends pneumococcal vaccination for adults 65+. PCV20 or PCV15 followed by PPSV23 is recommended. No recent vaccination found.',
        action: { label: 'Order Vaccine', hash: '#chart/' + patient.id },
      });
    }
  }
}

/* ============================================================
   3. Drug Interaction Checker
   ============================================================ */
function _runDrugInteractions(activeMeds, patientId) {
  if (activeMeds.length < 2) return;

  var medNames = activeMeds.map(function(m) { return (m.name || '').toLowerCase(); });

  DRUG_INTERACTIONS.forEach(function(interaction) {
    var group1 = interaction.drugs[0];
    var group2 = interaction.drugs[1];

    // Check if patient has at least one med from each group
    var match1 = medNames.filter(function(mn) { return group1.some(function(d) { return mn.indexOf(d) >= 0; }); });
    var match2 = medNames.filter(function(mn) { return group2.some(function(d) { return mn.indexOf(d) >= 0; }); });

    if (match1.length > 0 && match2.length > 0) {
      _aiFindings.push({
        id: 'ddi-' + interaction.id,
        category: 'drug-safety',
        severity: interaction.severity,
        title: interaction.risk + ': ' + _aiCapitalize(match1[0]) + ' + ' + _aiCapitalize(match2[0]),
        description: interaction.description,
        action: { label: 'Review Medications', hash: '#chart/' + patientId },
        meds: [match1[0], match2[0]],
      });
    }
  });
}

/* ============================================================
   4. Clinical Decision Support
   ============================================================ */
function _runClinicalDecisionSupport(activeProblems, activeMeds, vitals, labs, orders, referrals, age, patientId) {
  var problemText = activeProblems.map(function(p) { return (p.name || '').toLowerCase(); }).join('|');
  var medNames = activeMeds.map(function(m) { return (m.name || '').toLowerCase(); });
  var now = Date.now();

  /* --- Diabetic care --- */
  if (/diabetes|dm |dm$|t2dm|t1dm/i.test(problemText)) {
    // Eye exam
    var hasEyeExam = orders.some(function(o) { return /eye|ophthal|retinal|fundus/i.test(o.detail || ''); }) ||
                     referrals.some(function(r) { return /ophthal|eye/i.test(r.specialty || r.detail || ''); });
    if (!hasEyeExam) {
      _aiFindings.push({
        id: 'cds-dm-eye',
        category: 'clinical',
        severity: AI_SEV.WARNING,
        title: 'Diabetic Eye Exam Needed',
        description: 'ADA recommends annual dilated eye exam for all diabetic patients to screen for diabetic retinopathy. No ophthalmology referral or eye exam order found.',
        action: { label: 'Order Referral', hash: '#chart/' + patientId },
      });
    }

    // Foot exam
    var hasFootExam = orders.some(function(o) { return /foot|podiatr/i.test(o.detail || ''); });
    if (!hasFootExam) {
      _aiFindings.push({
        id: 'cds-dm-foot',
        category: 'clinical',
        severity: AI_SEV.INFO,
        title: 'Diabetic Foot Exam Recommended',
        description: 'ADA recommends annual comprehensive foot exam for patients with diabetes to assess for peripheral neuropathy and vascular insufficiency.',
        action: { label: 'Document Foot Exam', hash: '#chart/' + patientId },
      });
    }

    // Nephrology referral if GFR < 30
    var dmGfrLabs = labs.filter(function(l) { return /gfr|egfr|glomerular/i.test(l.testName || ''); })
      .sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    if (dmGfrLabs.length > 0) {
      var lastDmGfr = parseFloat(dmGfrLabs[0].value);
      if (!isNaN(lastDmGfr) && lastDmGfr < 30) {
        var hasNephRef = referrals.some(function(r) { return /nephrol|renal/i.test(r.specialty || r.detail || ''); });
        if (!hasNephRef) {
          _aiFindings.push({
            id: 'cds-dm-nephrology',
            category: 'clinical',
            severity: AI_SEV.CRITICAL,
            title: 'Nephrology Referral Recommended (GFR ' + lastDmGfr + ')',
            description: 'Patient has diabetes with GFR < 30 mL/min, indicating advanced CKD (Stage 4-5). KDIGO guidelines recommend nephrology co-management for CKD stage 4+.',
            action: { label: 'Place Referral', hash: '#chart/' + patientId },
          });
        }
      }
    }
  }

  /* --- Hypertension --- */
  if (/hypertension|htn|high blood pressure/i.test(problemText)) {
    var sortedVitals = vitals.filter(function(v) { return v.bp; })
      .sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    if (sortedVitals.length > 0) {
      var lastBP = sortedVitals[0].bp;
      var bpParts = (lastBP || '').split('/');
      var systolic = parseInt(bpParts[0], 10);
      var diastolic = parseInt(bpParts[1], 10);
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        if (systolic >= 180 || diastolic >= 120) {
          _aiFindings.push({
            id: 'cds-htn-crisis',
            category: 'clinical',
            severity: AI_SEV.CRITICAL,
            title: 'Hypertensive Crisis (BP ' + lastBP + ')',
            description: 'Blood pressure >= 180/120 mmHg. Assess for end-organ damage (headache, visual changes, chest pain). May require emergent treatment.',
            action: { label: 'Review BP', hash: '#chart/' + patientId },
          });
        } else if (systolic >= 140 || diastolic >= 90) {
          _aiFindings.push({
            id: 'cds-htn-uncontrolled',
            category: 'clinical',
            severity: AI_SEV.WARNING,
            title: 'Uncontrolled Hypertension (BP ' + lastBP + ')',
            description: 'Last recorded blood pressure (' + lastBP + ') exceeds the target of <140/90 mmHg. Consider medication adjustment, lifestyle counseling, or ambulatory BP monitoring.',
            action: { label: 'Review BP', hash: '#chart/' + patientId },
          });
        }
      }
    }
  }

  /* --- CHF --- */
  if (/heart failure|chf|hfref|hfpef/i.test(problemText)) {
    var hasACEorARB = medNames.some(function(m) {
      return /lisinopril|enalapril|ramipril|losartan|valsartan|irbesartan|candesartan|sacubitril|entresto|captopril|olmesartan/i.test(m);
    });
    var hasBetaBlocker = medNames.some(function(m) {
      return /metoprolol|carvedilol|bisoprolol|atenolol|propranolol/i.test(m);
    });

    if (!hasACEorARB) {
      _aiFindings.push({
        id: 'cds-chf-acearb',
        category: 'clinical',
        severity: AI_SEV.WARNING,
        title: 'CHF: ACE Inhibitor/ARB Not Found',
        description: 'ACC/AHA guidelines recommend ACE inhibitor, ARB, or ARNI (sacubitril/valsartan) for all patients with HFrEF. No qualifying medication found on the active medication list.',
        action: { label: 'Review Meds', hash: '#chart/' + patientId },
      });
    }
    if (!hasBetaBlocker) {
      _aiFindings.push({
        id: 'cds-chf-bb',
        category: 'clinical',
        severity: AI_SEV.WARNING,
        title: 'CHF: Beta-Blocker Not Found',
        description: 'Evidence-based beta-blocker (carvedilol, metoprolol succinate, or bisoprolol) is recommended for all stable HFrEF patients. Not found on active medication list.',
        action: { label: 'Review Meds', hash: '#chart/' + patientId },
      });
    }
  }

  /* --- CKD staging --- */
  var gfrLabs = labs.filter(function(l) { return /gfr|egfr|glomerular/i.test(l.testName || ''); })
    .sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  if (gfrLabs.length > 0) {
    var lastGfr = parseFloat(gfrLabs[0].value);
    if (!isNaN(lastGfr)) {
      var stage = '';
      var sev = AI_SEV.INFO;
      if (lastGfr >= 60 && lastGfr < 90) { stage = 'Stage 2 (GFR 60-89)'; sev = AI_SEV.INFO; }
      else if (lastGfr >= 45 && lastGfr < 60) { stage = 'Stage 3a (GFR 45-59)'; sev = AI_SEV.INFO; }
      else if (lastGfr >= 30 && lastGfr < 45) { stage = 'Stage 3b (GFR 30-44)'; sev = AI_SEV.WARNING; }
      else if (lastGfr >= 15 && lastGfr < 30) { stage = 'Stage 4 (GFR 15-29)'; sev = AI_SEV.CRITICAL; }
      else if (lastGfr < 15) { stage = 'Stage 5 / ESRD (GFR <15)'; sev = AI_SEV.CRITICAL; }

      if (stage) {
        _aiFindings.push({
          id: 'cds-ckd-stage',
          category: 'clinical',
          severity: sev,
          title: 'CKD ' + stage,
          description: 'Last eGFR result: ' + lastGfr + ' mL/min/1.73m\u00B2. Classification per KDIGO guidelines. Adjust renally-dosed medications and monitor electrolytes.',
          action: { label: 'View Labs', hash: '#chart/' + patientId },
        });
      }
    }
  }

  /* --- Antibiotic duration alerts --- */
  var activeAbxOrders = orders.filter(function(o) {
    var det = (o.detail || '').toLowerCase();
    var isAbx = /antibiotic|amoxicillin|azithromycin|ciprofloxacin|levofloxacin|doxycycline|cephalexin|metronidazole|clindamycin|sulfamethoxazole|trimethoprim|augmentin|ceftriaxone|vancomycin|piperacillin|meropenem|linezolid/i.test(det);
    return isAbx && (o.status || '').toLowerCase() === 'active';
  });

  activeAbxOrders.forEach(function(o) {
    if (o.createdAt) {
      var daysSinceOrder = (now - new Date(o.createdAt).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceOrder > 14) {
        _aiFindings.push({
          id: 'cds-abx-duration-' + o.id,
          category: 'clinical',
          severity: AI_SEV.WARNING,
          title: 'Prolonged Antibiotic Course (' + Math.round(daysSinceOrder) + ' days)',
          description: 'Active antibiotic order "' + esc(o.detail || 'Unknown') + '" has been active for more than 14 days. Review for appropriateness of extended duration per antibiotic stewardship guidelines.',
          action: { label: 'Review Order', hash: '#chart/' + patientId },
        });
      }
    }
  });
}

/* ============================================================
   5. Documentation Quality Score
   ============================================================ */
function _runDocumentationQuality(encounters, notes) {
  if (encounters.length === 0) return;

  // Score each of the last 5 encounters
  var encToScore = encounters.slice(-5);
  var totalScore = 0;
  var scoredCount = 0;

  encToScore.forEach(function(enc) {
    var encNotes = notes.filter(function(n) { return n.encounterId === enc.id; });
    var score = 0;
    var issues = [];

    // Combine all note text
    var allText = encNotes.map(function(n) { return (n.text || n.content || n.body || ''); }).join(' ').toLowerCase();
    var encText = ((enc.hpiText || enc.hpi || '') + ' ' +
                   (enc.rosText || enc.ros || '') + ' ' +
                   (enc.peText || enc.pe || enc.physicalExam || '') + ' ' +
                   (enc.assessmentText || enc.assessment || '') + ' ' +
                   (enc.planText || enc.plan || '')).toLowerCase();
    var fullText = allText + ' ' + encText;

    // Check standard sections (20 pts each, 100 total)
    var sections = [
      { name: 'HPI (History of Present Illness)', patterns: ['hpi', 'history of present', 'chief complaint', 'presenting concern'], hasField: !!(enc.hpiText || enc.hpi), points: 20 },
      { name: 'ROS (Review of Systems)', patterns: ['ros', 'review of systems', 'constitutional', 'heent'], hasField: !!(enc.rosText || enc.ros), points: 20 },
      { name: 'Physical Exam', patterns: ['physical exam', 'pe:', 'examination', 'general appearance', 'lungs clear', 'heart regular'], hasField: !!(enc.peText || enc.pe || enc.physicalExam), points: 20 },
      { name: 'Assessment', patterns: ['assessment', 'impression', 'diagnosis', 'icd'], hasField: !!(enc.assessmentText || enc.assessment), points: 20 },
      { name: 'Plan', patterns: ['plan', 'follow up', 'follow-up', 'prescri', 'order', 'refer'], hasField: !!(enc.planText || enc.plan), points: 20 },
    ];

    sections.forEach(function(sec) {
      var foundInText = sec.patterns.some(function(p) { return fullText.indexOf(p) >= 0; });
      if (foundInText || sec.hasField) {
        score += sec.points;
      } else {
        issues.push(sec.name + ' missing');
      }
    });

    // Bonus checks (adjust score)
    var hasICD = /[a-z]\d{2}\.\d/i.test(fullText) || /icd/i.test(fullText);
    if (!hasICD && score > 0) {
      score = Math.max(0, score - 5);
      issues.push('No ICD-10 codes in assessment');
    }

    var planText = (enc.planText || enc.plan || '').toLowerCase();
    if (planText && /continue current|no changes|stable/i.test(planText) && planText.length < 50) {
      score = Math.max(0, score - 5);
      issues.push('Plan lacks specific actions');
    }

    totalScore += score;
    scoredCount++;

    // Only report issues for poor documentation
    if (score < 60 && issues.length > 0) {
      var encDate = enc.date || enc.createdAt || 'Unknown date';
      _aiFindings.push({
        id: 'doc-quality-' + enc.id,
        category: 'documentation',
        severity: score < 40 ? AI_SEV.WARNING : AI_SEV.INFO,
        title: 'Documentation Score: ' + score + '/100 (' + formatDateTime(encDate) + ')',
        description: 'Issues: ' + issues.join('; ') + '. Complete documentation supports quality care, accurate billing, and medicolegal protection.',
        action: { label: 'Edit Encounter', hash: '#encounter/' + enc.id },
        score: score,
      });
    }
  });

  // Overall documentation score
  if (scoredCount > 0) {
    var avgScore = Math.round(totalScore / scoredCount);
    _aiFindings.push({
      id: 'doc-overall-score',
      category: 'documentation',
      severity: avgScore < 40 ? AI_SEV.WARNING : AI_SEV.INFO,
      title: 'Average Documentation Score: ' + avgScore + '/100',
      description: 'Based on the last ' + scoredCount + ' encounter(s). Scores reflect section completeness (HPI, ROS, PE, Assessment, Plan), ICD-10 presence, and plan specificity.',
      action: null,
      score: avgScore,
      isOverallScore: true,
    });
  }
}

/* ============================================================
   6. Risk Stratification
   ============================================================ */
function _runRiskStratification(activeProblems, activeMeds, screenings, encounters, age) {
  var problemNames = activeProblems.map(function(p) { return (p.name || '').toLowerCase(); });
  var allProblemText = problemNames.join(' ');

  /* --- Charlson Comorbidity Index --- */
  var charlsonScore = 0;
  var charlsonMatches = [];
  // Age component
  if (age !== null) {
    if (age >= 50 && age < 60) { charlsonScore += 1; }
    else if (age >= 60 && age < 70) { charlsonScore += 2; }
    else if (age >= 70 && age < 80) { charlsonScore += 3; }
    else if (age >= 80) { charlsonScore += 4; }
  }

  CHARLSON_CONDITIONS.forEach(function(cond) {
    var matched = problemNames.some(function(pt) {
      return cond.terms.some(function(t) { return pt.indexOf(t) >= 0; });
    });
    if (matched) {
      charlsonScore += cond.weight;
      charlsonMatches.push(cond.terms[0]);
    }
  });

  var charlsonRisk = 'Low';
  var charlsonSev = AI_SEV.INFO;
  if (charlsonScore >= 5) { charlsonRisk = 'High'; charlsonSev = AI_SEV.WARNING; }
  else if (charlsonScore >= 3) { charlsonRisk = 'Moderate'; charlsonSev = AI_SEV.INFO; }

  var charlsonDesc = 'Estimated 10-year mortality risk based on age and comorbidities.';
  if (charlsonMatches.length > 0) {
    charlsonDesc += ' Contributing conditions: ' + charlsonMatches.join(', ') + '.';
  } else {
    charlsonDesc += ' No comorbidity matches from problem list.';
  }
  if (charlsonScore === 0) charlsonDesc += ' Score of 0 corresponds to ~98% 10-year survival.';
  else if (charlsonScore <= 2) charlsonDesc += ' Score of 1-2 corresponds to ~90% 10-year survival.';
  else if (charlsonScore <= 4) charlsonDesc += ' Score of 3-4 corresponds to ~75% 10-year survival.';
  else charlsonDesc += ' Score >= 5 corresponds to <50% 10-year survival.';

  _aiFindings.push({
    id: 'risk-charlson',
    category: 'risk',
    severity: charlsonSev,
    title: 'Charlson Comorbidity Index: ' + charlsonScore + ' (' + charlsonRisk + ' risk)',
    description: charlsonDesc,
    action: null,
    riskScore: charlsonScore,
  });

  /* --- PHQ-9 Depression Score --- */
  var phqScreenings = screenings.filter(function(s) { return /phq|depression/i.test(s.name || s.type || ''); })
    .sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
  if (phqScreenings.length > 0) {
    var lastPHQ = phqScreenings[0];
    var phqScore = parseInt(lastPHQ.score || lastPHQ.value || lastPHQ.result, 10);
    if (!isNaN(phqScore)) {
      var phqLevel = 'Minimal';
      var phqSev = AI_SEV.INFO;
      if (phqScore >= 20) { phqLevel = 'Severe'; phqSev = AI_SEV.CRITICAL; }
      else if (phqScore >= 15) { phqLevel = 'Moderately Severe'; phqSev = AI_SEV.WARNING; }
      else if (phqScore >= 10) { phqLevel = 'Moderate'; phqSev = AI_SEV.WARNING; }
      else if (phqScore >= 5) { phqLevel = 'Mild'; phqSev = AI_SEV.INFO; }

      var phqDesc = 'Last PHQ-9 screening result from ' + formatDateTime(lastPHQ.date || '') + '. ';
      if (phqScore >= 10) {
        phqDesc += 'Score >= 10 suggests need for treatment (therapy, pharmacotherapy, or both). Consider referral to behavioral health.';
      } else {
        phqDesc += 'Continue routine screening per USPSTF guidelines.';
      }

      _aiFindings.push({
        id: 'risk-phq9',
        category: 'risk',
        severity: phqSev,
        title: 'PHQ-9 Score: ' + phqScore + ' (' + phqLevel + ')',
        description: phqDesc,
        action: phqScore >= 10 ? { label: 'Review Screening', hash: '' } : null,
        riskScore: phqScore,
      });
    }
  }

  /* --- Fall Risk --- */
  if (age !== null && age >= 65) {
    var fallRiskFactors = [];
    fallRiskFactors.push('Age >= 65');
    if (activeMeds.length > 3) fallRiskFactors.push(activeMeds.length + ' active medications (polypharmacy)');

    var balanceIssues = /balance|fall|gait|vertigo|dizziness|neuropathy|weakness/i.test(allProblemText);
    if (balanceIssues) fallRiskFactors.push('Balance/gait-related diagnosis');

    var sedatingMeds = activeMeds.filter(function(m) {
      return /benzodiazepine|zolpidem|ambien|diazepam|lorazepam|alprazolam|opioid|gabapentin|pregabalin|trazodone|quetiapine/i.test(m.name || '');
    });
    if (sedatingMeds.length > 0) {
      fallRiskFactors.push('Sedating medications (' + sedatingMeds.map(function(m) { return m.name; }).join(', ') + ')');
    }

    var fallRisk = 'Low';
    var fallSev = AI_SEV.INFO;
    if (fallRiskFactors.length >= 3) { fallRisk = 'High'; fallSev = AI_SEV.WARNING; }
    else if (fallRiskFactors.length >= 2) { fallRisk = 'Moderate'; fallSev = AI_SEV.INFO; }

    var fallDesc = 'Risk factors: ' + fallRiskFactors.join('; ') + '. ';
    if (fallRisk === 'High') {
      fallDesc += 'Consider physical therapy referral, home safety evaluation, and medication review to reduce fall risk.';
    } else {
      fallDesc += 'Continue monitoring. CDC STEADI toolkit can guide further assessment.';
    }

    _aiFindings.push({
      id: 'risk-fall',
      category: 'risk',
      severity: fallSev,
      title: 'Fall Risk: ' + fallRisk + ' (' + fallRiskFactors.length + ' factor' + (fallRiskFactors.length !== 1 ? 's' : '') + ')',
      description: fallDesc,
      action: fallRisk === 'High' ? { label: 'Order PT Eval', hash: '' } : null,
    });
  }

  /* --- Readmission Risk --- */
  var recentInpatient = encounters.filter(function(e) {
    var isInpatient = /inpatient|admission|hospital/i.test(e.type || e.visitType || '');
    var d = new Date(e.date || e.createdAt);
    return isInpatient && (Date.now() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
  });

  var readmitFactors = [];
  if (recentInpatient.length > 0) readmitFactors.push('Recent hospitalization within 30 days');
  if (charlsonScore >= 3) readmitFactors.push('Charlson >= 3');
  if (age !== null && age >= 75) readmitFactors.push('Age >= 75');
  if (activeMeds.length >= 8) readmitFactors.push('Polypharmacy (' + activeMeds.length + ' medications)');
  if (/heart failure|chf|copd|pneumonia/i.test(allProblemText)) readmitFactors.push('High-risk diagnosis (CHF/COPD)');

  if (readmitFactors.length > 0) {
    var readmitRisk = 'Low';
    var readmitSev = AI_SEV.INFO;
    if (readmitFactors.length >= 3) { readmitRisk = 'High'; readmitSev = AI_SEV.WARNING; }
    else if (readmitFactors.length >= 2) { readmitRisk = 'Moderate'; readmitSev = AI_SEV.INFO; }

    var readmitDesc = 'Contributing factors: ' + readmitFactors.join('; ') + '. ';
    if (readmitRisk !== 'Low') {
      readmitDesc += 'Consider transitional care management (TCM), close follow-up within 7-14 days, and medication reconciliation.';
    }

    _aiFindings.push({
      id: 'risk-readmit',
      category: 'risk',
      severity: readmitSev,
      title: 'Readmission Risk: ' + readmitRisk,
      description: readmitDesc,
      action: readmitRisk === 'High' ? { label: 'Schedule Follow-Up', hash: '' } : null,
    });
  }
}

/* ============================================================
   7. Patient Education Recommendations
   ============================================================ */
function _runEducationRecommendations(activeProblems, activeMeds) {
  var problemText = activeProblems.map(function(p) { return (p.name || '').toLowerCase(); }).join(' ');
  var medText = activeMeds.map(function(m) { return (m.name || '').toLowerCase(); }).join(' ');
  var combinedText = problemText + ' ' + medText;

  EDUCATION_TOPICS.forEach(function(topic) {
    var matched = topic.conditions.some(function(c) { return combinedText.indexOf(c.toLowerCase()) >= 0; });
    if (matched) {
      _aiFindings.push({
        id: 'edu-' + topic.title.replace(/\s+/g, '-').toLowerCase(),
        category: 'education',
        severity: AI_SEV.INFO,
        title: topic.title,
        description: topic.description,
        action: { label: 'Print Handout', hash: '' },
      });
    }
  });
}

/* ============================================================
   RENDER: AI Dashboard
   ============================================================ */
function _renderAIDashboard(app, patient, age, sex) {
  var wrap = document.createElement('div');
  wrap.className = 'ai-dashboard';

  /* ---------- Header ---------- */
  var header = document.createElement('div');
  header.className = 'ai-header';
  header.innerHTML =
    '<div class="ai-header-left">' +
      '<h2 class="ai-title">AI Chart Review</h2>' +
      '<span class="ai-subtitle">' + esc(patient.firstName + ' ' + patient.lastName) +
        (age !== null ? ' &middot; ' + age + 'y' : '') +
        (sex ? ' &middot; ' + esc(sex.charAt(0).toUpperCase() + sex.slice(1)) : '') +
        (patient.mrn ? ' &middot; ' + esc(patient.mrn) : '') +
      '</span>' +
    '</div>' +
    '<div class="ai-header-right">' +
      '<span class="ai-badge ai-badge-sim">Rule-Based Analysis</span>' +
    '</div>';
  wrap.appendChild(header);

  /* ---------- Summary Cards ---------- */
  var visible = _aiFindings.filter(function(f) { return !_aiDismissed.has(f.id); });
  var criticalCount = visible.filter(function(f) { return f.severity === AI_SEV.CRITICAL; }).length;
  var warningCount  = visible.filter(function(f) { return f.severity === AI_SEV.WARNING; }).length;
  var infoCount     = visible.filter(function(f) { return f.severity === AI_SEV.INFO; }).length;

  // Overall doc score
  var overallDoc = _aiFindings.find(function(f) { return f.isOverallScore; });
  var docScore = overallDoc ? overallDoc.score : null;

  var summaryBar = document.createElement('div');
  summaryBar.className = 'ai-summary-bar';

  var cards = [
    { label: 'Critical', count: criticalCount, cls: 'ai-card-critical', icon: '\u26A0' },
    { label: 'Warnings', count: warningCount, cls: 'ai-card-warning', icon: '\u25B2' },
    { label: 'Info', count: infoCount, cls: 'ai-card-info', icon: '\u2139' },
    { label: 'Doc Score', count: docScore !== null ? docScore + '/100' : 'N/A', cls: _aiDocScoreClass(docScore), icon: '\u2605' },
  ];

  cards.forEach(function(c) {
    var card = document.createElement('div');
    card.className = 'ai-summary-card ' + c.cls;
    card.innerHTML =
      '<div class="ai-card-icon">' + c.icon + '</div>' +
      '<div class="ai-card-body">' +
        '<div class="ai-card-count">' + c.count + '</div>' +
        '<div class="ai-card-label">' + c.label + '</div>' +
      '</div>';
    summaryBar.appendChild(card);
  });
  wrap.appendChild(summaryBar);

  /* ---------- Tab Bar ---------- */
  var TABS = [
    { key: 'overview',       label: 'Overview' },
    { key: 'drug-safety',    label: 'Drug Safety' },
    { key: 'care-gaps',      label: 'Care Gaps' },
    { key: 'documentation',  label: 'Documentation' },
    { key: 'risk',           label: 'Risk Scores' },
    { key: 'education',      label: 'Education' },
  ];

  var tabBar = document.createElement('div');
  tabBar.className = 'ai-tab-bar';

  var listContainer = document.createElement('div');
  listContainer.className = 'ai-findings-list';

  TABS.forEach(function(tab) {
    var btn = document.createElement('button');
    btn.className = 'ai-tab' + (tab.key === _aiActiveTab ? ' ai-tab-active' : '');
    var tabFindings = tab.key === 'overview'
      ? visible
      : visible.filter(function(f) { return f.category === tab.key; });
    var count = tabFindings.length;
    btn.innerHTML = esc(tab.label) + (count > 0 ? ' <span class="ai-tab-count">' + count + '</span>' : '');
    btn.addEventListener('click', function() {
      _aiActiveTab = tab.key;
      tabBar.querySelectorAll('.ai-tab').forEach(function(b) { b.classList.remove('ai-tab-active'); });
      btn.classList.add('ai-tab-active');
      _aiRenderFindingsList(listContainer, tab.key);
    });
    tabBar.appendChild(btn);
  });
  wrap.appendChild(tabBar);

  /* ---------- Findings List ---------- */
  _aiRenderFindingsList(listContainer, _aiActiveTab);
  wrap.appendChild(listContainer);

  app.appendChild(wrap);
}

/* ---------- Render findings for a given tab ---------- */
function _aiRenderFindingsList(container, tabKey) {
  container.innerHTML = '';

  var visible = _aiFindings.filter(function(f) { return !_aiDismissed.has(f.id); });
  var filtered = tabKey === 'overview'
    ? visible
    : visible.filter(function(f) { return f.category === tabKey; });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="ai-empty-state">' +
      '<div class="ai-empty-icon">\u2714</div>' +
      '<div class="ai-empty-text">No findings in this category</div>' +
      '</div>';
    return;
  }

  // Sort: critical first, then warning, then info
  var sevOrder = { critical: 0, warning: 1, info: 2 };
  filtered.sort(function(a, b) { return (sevOrder[a.severity] || 2) - (sevOrder[b.severity] || 2); });

  // Group by category for overview tab
  if (tabKey === 'overview') {
    var groups = {};
    filtered.forEach(function(f) {
      var cat = f.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });

    var catLabels = {
      'completeness': 'Chart Completeness',
      'care-gaps': 'Care Gaps',
      'drug-safety': 'Drug Interactions',
      'clinical': 'Clinical Alerts',
      'documentation': 'Documentation Quality',
      'risk': 'Risk Scores',
      'education': 'Patient Education',
    };

    var catOrder = ['drug-safety', 'clinical', 'completeness', 'care-gaps', 'documentation', 'risk', 'education'];
    catOrder.forEach(function(cat) {
      if (groups[cat] && groups[cat].length > 0) {
        var groupHeader = document.createElement('div');
        groupHeader.className = 'ai-group-header';
        groupHeader.textContent = catLabels[cat] || cat;
        container.appendChild(groupHeader);

        groups[cat].forEach(function(finding) {
          container.appendChild(_aiBuildFindingCard(finding));
        });
      }
    });
  } else {
    filtered.forEach(function(finding) {
      container.appendChild(_aiBuildFindingCard(finding));
    });
  }
}

/* ---------- Build a single finding card ---------- */
function _aiBuildFindingCard(finding) {
  var card = document.createElement('div');
  card.className = 'ai-finding-card ai-finding-' + finding.severity;
  card.dataset.findingId = finding.id;

  var iconMap = {
    critical: '\u26A0',
    warning:  '\u25B2',
    info:     '\u2139',
  };
  var sevLabelMap = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  // Left icon
  var iconEl = document.createElement('div');
  iconEl.className = 'ai-finding-icon ai-icon-' + finding.severity;
  iconEl.textContent = iconMap[finding.severity] || '\u2139';
  card.appendChild(iconEl);

  // Content
  var content = document.createElement('div');
  content.className = 'ai-finding-content';

  var titleRow = document.createElement('div');
  titleRow.className = 'ai-finding-title-row';

  var titleEl = document.createElement('div');
  titleEl.className = 'ai-finding-title';
  titleEl.textContent = finding.title;
  titleRow.appendChild(titleEl);

  var sevBadge = document.createElement('span');
  sevBadge.className = 'ai-sev-badge ai-sev-' + finding.severity;
  sevBadge.textContent = sevLabelMap[finding.severity] || 'Info';
  titleRow.appendChild(sevBadge);

  content.appendChild(titleRow);

  var descEl = document.createElement('div');
  descEl.className = 'ai-finding-desc';
  descEl.textContent = finding.description;
  content.appendChild(descEl);

  // Score bar for documentation findings
  if (typeof finding.score === 'number') {
    var scoreBar = document.createElement('div');
    scoreBar.className = 'ai-score-bar';
    var scoreFill = document.createElement('div');
    scoreFill.className = 'ai-score-fill ' + _aiDocScoreClass(finding.score);
    scoreFill.style.width = Math.min(100, Math.max(0, finding.score)) + '%';
    scoreBar.appendChild(scoreFill);
    content.appendChild(scoreBar);
  }

  card.appendChild(content);

  // Actions
  var actionsEl = document.createElement('div');
  actionsEl.className = 'ai-finding-actions';

  if (finding.action) {
    var actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-sm btn-primary ai-action-btn';
    actionBtn.textContent = finding.action.label;
    actionBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (finding.action.hash) {
        window.location.hash = finding.action.hash;
      } else {
        showToast('Action noted \u2014 ' + finding.action.label, 'success');
      }
    });
    actionsEl.appendChild(actionBtn);
  }

  var dismissBtn = document.createElement('button');
  dismissBtn.className = 'btn btn-sm btn-ghost ai-dismiss-btn';
  dismissBtn.textContent = 'Dismiss';
  dismissBtn.title = 'Dismiss this finding for this session';
  dismissBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    _aiDismissed.add(finding.id);
    card.classList.add('ai-finding-dismissed');
    setTimeout(function() {
      card.remove();
      _aiUpdateSummaryCounts();
      var listContainer = document.querySelector('.ai-findings-list');
      if (listContainer) {
        var remaining = listContainer.querySelectorAll('.ai-finding-card');
        if (remaining.length === 0) {
          _aiRenderFindingsList(listContainer, _aiActiveTab);
        }
      }
    }, 300);
    showToast('Finding dismissed', 'success');
  });
  actionsEl.appendChild(dismissBtn);

  card.appendChild(actionsEl);

  return card;
}

/* ---------- Update summary card counts after dismiss ---------- */
function _aiUpdateSummaryCounts() {
  var visible = _aiFindings.filter(function(f) { return !_aiDismissed.has(f.id); });
  var counts = {
    critical: visible.filter(function(f) { return f.severity === AI_SEV.CRITICAL; }).length,
    warning:  visible.filter(function(f) { return f.severity === AI_SEV.WARNING; }).length,
    info:     visible.filter(function(f) { return f.severity === AI_SEV.INFO; }).length,
  };

  var summaryCards = document.querySelectorAll('.ai-summary-card');
  if (summaryCards.length >= 3) {
    var countEl0 = summaryCards[0].querySelector('.ai-card-count');
    var countEl1 = summaryCards[1].querySelector('.ai-card-count');
    var countEl2 = summaryCards[2].querySelector('.ai-card-count');
    if (countEl0) countEl0.textContent = counts.critical;
    if (countEl1) countEl1.textContent = counts.warning;
    if (countEl2) countEl2.textContent = counts.info;
  }

  // Update tab counts
  var tabs = document.querySelectorAll('.ai-tab');
  var TABS_MAP = ['overview', 'drug-safety', 'care-gaps', 'documentation', 'risk', 'education'];
  tabs.forEach(function(tab, i) {
    var key = TABS_MAP[i];
    if (!key) return;
    var tabFindings = key === 'overview'
      ? visible
      : visible.filter(function(f) { return f.category === key; });
    var countEl = tab.querySelector('.ai-tab-count');
    if (countEl) {
      countEl.textContent = tabFindings.length;
      if (tabFindings.length === 0) countEl.remove();
    } else if (tabFindings.length > 0) {
      var span = document.createElement('span');
      span.className = 'ai-tab-count';
      span.textContent = tabFindings.length;
      tab.appendChild(span);
    }
  });
}

/* ---------- Utility helpers ---------- */
function _aiCapitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function _aiDocScoreClass(score) {
  if (score === null || score === undefined) return 'ai-card-neutral';
  if (score >= 80) return 'ai-card-good';
  if (score >= 60) return 'ai-card-ok';
  if (score >= 40) return 'ai-card-poor';
  return 'ai-card-critical';
}

/* ============================================================
   STYLES — injected once on first render
   ============================================================ */
(function _injectAIReviewStyles() {
  if (document.getElementById('ai-review-styles')) return;
  var style = document.createElement('style');
  style.id = 'ai-review-styles';
  style.textContent = [
    '/* ===== AI Review Dashboard ===== */',
    '.ai-dashboard { max-width:1100px; margin:0 auto; padding:24px 20px 40px; }',

    '/* Header */',
    '.ai-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }',
    '.ai-header-left { display:flex; flex-direction:column; gap:2px; }',
    '.ai-title { font-size:22px; font-weight:700; color:var(--text,#1a1a2e); margin:0; }',
    '.ai-subtitle { font-size:14px; color:var(--text-secondary,#6b7280); }',
    '.ai-badge-sim { display:inline-block; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; background:var(--bg-secondary,#f3f4f6); color:var(--text-secondary,#6b7280); border:1px solid var(--border,#e5e7eb); }',

    '/* Summary Cards */',
    '.ai-summary-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }',
    '.ai-summary-card { display:flex; align-items:center; gap:12px; padding:16px; border-radius:10px; border:1px solid var(--border,#e5e7eb); background:var(--bg,#fff); transition:box-shadow .15s; }',
    '.ai-summary-card:hover { box-shadow:0 2px 8px rgba(0,0,0,.06); }',
    '.ai-card-icon { font-size:24px; width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:10px; flex-shrink:0; }',
    '.ai-card-critical .ai-card-icon { background:#fef2f2; color:#dc2626; }',
    '.ai-card-warning .ai-card-icon { background:#fffbeb; color:#d97706; }',
    '.ai-card-info .ai-card-icon { background:#eff6ff; color:#2563eb; }',
    '.ai-card-neutral .ai-card-icon { background:#f3f4f6; color:#6b7280; }',
    '.ai-card-good .ai-card-icon { background:#f0fdf4; color:#16a34a; }',
    '.ai-card-ok .ai-card-icon { background:#eff6ff; color:#2563eb; }',
    '.ai-card-poor .ai-card-icon { background:#fffbeb; color:#d97706; }',
    '.ai-card-count { font-size:22px; font-weight:700; line-height:1.1; color:var(--text,#1a1a2e); }',
    '.ai-card-label { font-size:12px; color:var(--text-secondary,#6b7280); text-transform:uppercase; letter-spacing:.03em; }',

    '/* Tabs */',
    '.ai-tab-bar { display:flex; gap:4px; border-bottom:2px solid var(--border,#e5e7eb); margin-bottom:20px; overflow-x:auto; -webkit-overflow-scrolling:touch; }',
    '.ai-tab { padding:10px 16px; font-size:14px; font-weight:500; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-2px; cursor:pointer; color:var(--text-secondary,#6b7280); white-space:nowrap; transition:color .15s,border-color .15s; }',
    '.ai-tab:hover { color:var(--primary,#2563eb); }',
    '.ai-tab-active { color:var(--primary,#2563eb); border-bottom-color:var(--primary,#2563eb); font-weight:600; }',
    '.ai-tab-count { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 6px; border-radius:10px; font-size:11px; font-weight:600; background:var(--bg-secondary,#f3f4f6); color:var(--text-secondary,#6b7280); margin-left:6px; }',

    '/* Findings List */',
    '.ai-findings-list { min-height:200px; }',
    '.ai-group-header { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-secondary,#6b7280); padding:14px 0 6px; border-bottom:1px solid var(--border,#e5e7eb); margin-bottom:8px; }',
    '.ai-group-header:first-child { padding-top:0; }',

    '/* Finding Card */',
    '.ai-finding-card { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-radius:8px; border:1px solid var(--border,#e5e7eb); background:var(--bg,#fff); margin-bottom:8px; transition:opacity .3s,transform .3s,box-shadow .15s; }',
    '.ai-finding-card:hover { box-shadow:0 1px 6px rgba(0,0,0,.05); }',
    '.ai-finding-dismissed { opacity:0; transform:translateX(20px); pointer-events:none; }',

    '/* Severity left border */',
    '.ai-finding-critical { border-left:4px solid #dc2626; }',
    '.ai-finding-warning { border-left:4px solid #d97706; }',
    '.ai-finding-info { border-left:4px solid #2563eb; }',

    '/* Finding Icon */',
    '.ai-finding-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; margin-top:2px; }',
    '.ai-icon-critical { background:#fef2f2; color:#dc2626; }',
    '.ai-icon-warning { background:#fffbeb; color:#d97706; }',
    '.ai-icon-info { background:#eff6ff; color:#2563eb; }',

    '/* Finding Content */',
    '.ai-finding-content { flex:1; min-width:0; }',
    '.ai-finding-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px; }',
    '.ai-finding-title { font-size:14px; font-weight:600; color:var(--text,#1a1a2e); }',
    '.ai-sev-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.02em; }',
    '.ai-sev-critical { background:#fef2f2; color:#dc2626; }',
    '.ai-sev-warning { background:#fffbeb; color:#d97706; }',
    '.ai-sev-info { background:#eff6ff; color:#2563eb; }',
    '.ai-finding-desc { font-size:13px; color:var(--text-secondary,#6b7280); line-height:1.5; }',

    '/* Score Bar */',
    '.ai-score-bar { height:6px; background:var(--bg-secondary,#f3f4f6); border-radius:3px; margin-top:8px; overflow:hidden; }',
    '.ai-score-fill { height:100%; border-radius:3px; transition:width .5s ease; }',
    '.ai-score-fill.ai-card-good { background:#16a34a; }',
    '.ai-score-fill.ai-card-ok { background:#2563eb; }',
    '.ai-score-fill.ai-card-poor { background:#d97706; }',
    '.ai-score-fill.ai-card-critical { background:#dc2626; }',
    '.ai-score-fill.ai-card-neutral { background:#9ca3af; }',

    '/* Finding Actions */',
    '.ai-finding-actions { display:flex; flex-direction:column; gap:6px; flex-shrink:0; align-self:center; }',
    '.ai-action-btn { white-space:nowrap; font-size:12px; }',
    '.ai-dismiss-btn { font-size:12px; color:var(--text-secondary,#6b7280); opacity:.6; white-space:nowrap; }',
    '.ai-dismiss-btn:hover { opacity:1; }',

    '/* Empty State */',
    '.ai-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; text-align:center; }',
    '.ai-empty-icon { font-size:48px; color:#16a34a; margin-bottom:12px; }',
    '.ai-empty-text { font-size:15px; color:var(--text-secondary,#6b7280); }',
    '.ai-empty { padding:40px 20px; text-align:center; color:var(--text-secondary,#6b7280); font-size:15px; }',

    '/* Responsive */',
    '@media (max-width:768px) {',
    '  .ai-summary-bar { grid-template-columns:repeat(2,1fr); }',
    '  .ai-finding-card { flex-wrap:wrap; }',
    '  .ai-finding-actions { flex-direction:row; width:100%; padding-top:8px; border-top:1px solid var(--border,#e5e7eb); margin-top:4px; }',
    '  .ai-dashboard { padding:16px 12px 32px; }',
    '}',
    '@media (max-width:480px) {',
    '  .ai-summary-bar { grid-template-columns:1fr 1fr; gap:8px; }',
    '  .ai-summary-card { padding:12px; }',
    '  .ai-tab { padding:8px 12px; font-size:13px; }',
    '}',
  ].join('\n');
  document.head.appendChild(style);
})();
