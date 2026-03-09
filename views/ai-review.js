/* ============================================================
   views/ai-review.js — AI Chart Review / Clinical Decision Support
   Simulated AI system using rule-based logic.
   ============================================================ */

/* ============================================================
   1. DRUG INTERACTION DATABASE
   ============================================================ */

const DRUG_INTERACTIONS = [
  { drugA: 'warfarin', drugB: 'aspirin', severity: 'high', description: 'Increased bleeding risk. Combined antiplatelet and anticoagulant therapy requires close INR monitoring.' },
  { drugA: 'warfarin', drugB: 'ibuprofen', severity: 'high', description: 'NSAIDs increase bleeding risk and may elevate INR. Avoid combination or monitor closely.' },
  { drugA: 'warfarin', drugB: 'naproxen', severity: 'high', description: 'NSAIDs increase bleeding risk with warfarin. Consider acetaminophen as alternative.' },
  { drugA: 'warfarin', drugB: 'metronidazole', severity: 'high', description: 'Metronidazole inhibits warfarin metabolism, significantly increasing INR.' },
  { drugA: 'warfarin', drugB: 'fluconazole', severity: 'high', description: 'Fluconazole inhibits CYP2C9, greatly increasing warfarin effect and bleeding risk.' },
  { drugA: 'warfarin', drugB: 'amiodarone', severity: 'high', description: 'Amiodarone inhibits warfarin metabolism. Reduce warfarin dose by 30-50% and monitor INR closely.' },
  { drugA: 'warfarin', drugB: 'trimethoprim', severity: 'moderate', description: 'Trimethoprim may increase warfarin effect. Monitor INR.' },
  { drugA: 'fluoxetine', drugB: 'tramadol', severity: 'high', description: 'Risk of serotonin syndrome. Both increase serotonergic activity.' },
  { drugA: 'sertraline', drugB: 'tramadol', severity: 'high', description: 'Risk of serotonin syndrome. Both increase serotonergic activity.' },
  { drugA: 'fluoxetine', drugB: 'sumatriptan', severity: 'high', description: 'Risk of serotonin syndrome with combined serotonergic agents.' },
  { drugA: 'sertraline', drugB: 'sumatriptan', severity: 'high', description: 'Risk of serotonin syndrome with combined serotonergic agents.' },
  { drugA: 'fluoxetine', drugB: 'maoi', severity: 'critical', description: 'CONTRAINDICATED. Risk of fatal serotonin syndrome. Requires 5-week washout period.' },
  { drugA: 'sertraline', drugB: 'maoi', severity: 'critical', description: 'CONTRAINDICATED. Risk of fatal serotonin syndrome. Requires 2-week washout period.' },
  { drugA: 'fluoxetine', drugB: 'linezolid', severity: 'critical', description: 'Linezolid has MAOI activity. Risk of serotonin syndrome.' },
  { drugA: 'simvastatin', drugB: 'amiodarone', severity: 'high', description: 'Do not exceed simvastatin 20mg/day with amiodarone. Risk of rhabdomyolysis.' },
  { drugA: 'simvastatin', drugB: 'clarithromycin', severity: 'high', description: 'CYP3A4 inhibition increases statin levels. Risk of rhabdomyolysis. Use alternative statin.' },
  { drugA: 'atorvastatin', drugB: 'clarithromycin', severity: 'moderate', description: 'Macrolide increases statin levels. Consider dose reduction or alternative.' },
  { drugA: 'simvastatin', drugB: 'diltiazem', severity: 'moderate', description: 'Do not exceed simvastatin 10mg/day with diltiazem.' },
  { drugA: 'lisinopril', drugB: 'spironolactone', severity: 'high', description: 'Risk of hyperkalemia. Monitor potassium closely.' },
  { drugA: 'losartan', drugB: 'spironolactone', severity: 'high', description: 'Risk of hyperkalemia. Monitor potassium closely.' },
  { drugA: 'lisinopril', drugB: 'potassium', severity: 'moderate', description: 'ACE inhibitors increase potassium retention. Monitor serum potassium.' },
  { drugA: 'losartan', drugB: 'potassium', severity: 'moderate', description: 'ARBs increase potassium retention. Monitor serum potassium.' },
  { drugA: 'metformin', drugB: 'contrast dye', severity: 'high', description: 'Hold metformin before and 48h after iodinated contrast. Risk of lactic acidosis.' },
  { drugA: 'amiodarone', drugB: 'azithromycin', severity: 'high', description: 'Both prolong QTc interval. Risk of Torsades de Pointes.' },
  { drugA: 'amiodarone', drugB: 'fluoroquinolone', severity: 'high', description: 'Both prolong QTc interval. Risk of Torsades de Pointes.' },
  { drugA: 'methadone', drugB: 'azithromycin', severity: 'moderate', description: 'Both may prolong QTc. Monitor ECG.' },
  { drugA: 'ondansetron', drugB: 'amiodarone', severity: 'moderate', description: 'Both prolong QTc interval. Monitor ECG.' },
  { drugA: 'oxycodone', drugB: 'benzodiazepine', severity: 'critical', description: 'FDA black box warning: Combined opioid-benzodiazepine use risks respiratory depression, coma, and death.' },
  { drugA: 'hydrocodone', drugB: 'benzodiazepine', severity: 'critical', description: 'FDA black box warning: Combined opioid-benzodiazepine use risks respiratory depression, coma, and death.' },
  { drugA: 'morphine', drugB: 'benzodiazepine', severity: 'critical', description: 'FDA black box warning: Combined opioid-benzodiazepine use risks respiratory depression, coma, and death.' },
  { drugA: 'fentanyl', drugB: 'benzodiazepine', severity: 'critical', description: 'FDA black box warning: Combined opioid-benzodiazepine use risks respiratory depression, coma, and death.' },
  { drugA: 'digoxin', drugB: 'amiodarone', severity: 'high', description: 'Amiodarone increases digoxin levels by 70-100%. Reduce digoxin dose by 50%.' },
  { drugA: 'digoxin', drugB: 'verapamil', severity: 'high', description: 'Verapamil increases digoxin levels. Risk of toxicity and bradycardia.' },
  { drugA: 'digoxin', drugB: 'clarithromycin', severity: 'moderate', description: 'Macrolides may increase digoxin levels. Monitor digoxin levels.' },
  { drugA: 'methotrexate', drugB: 'trimethoprim', severity: 'high', description: 'Both are antifolates. Significantly increased risk of pancytopenia.' },
  { drugA: 'methotrexate', drugB: 'nsaid', severity: 'high', description: 'NSAIDs reduce methotrexate clearance. Risk of severe toxicity.' },
  { drugA: 'methotrexate', drugB: 'ibuprofen', severity: 'high', description: 'Ibuprofen reduces methotrexate clearance. Risk of severe toxicity.' },
  { drugA: 'lithium', drugB: 'lisinopril', severity: 'high', description: 'ACE inhibitors decrease lithium clearance. Risk of lithium toxicity.' },
  { drugA: 'lithium', drugB: 'ibuprofen', severity: 'high', description: 'NSAIDs decrease lithium clearance. Risk of lithium toxicity.' },
  { drugA: 'lithium', drugB: 'hydrochlorothiazide', severity: 'high', description: 'Thiazides decrease lithium clearance by 25%. Monitor lithium levels.' },
];

const _AI_BENZODIAZEPINES = ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'midazolam', 'temazepam', 'triazolam', 'chlordiazepoxide', 'oxazepam'];

const DUPLICATE_THERAPY_CLASSES = [
  { className: 'ACE Inhibitors', drugs: ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'fosinopril', 'quinapril'] },
  { className: 'ARBs', drugs: ['losartan', 'valsartan', 'irbesartan', 'candesartan', 'olmesartan', 'telmisartan', 'azilsartan'] },
  { className: 'Beta Blockers', drugs: ['metoprolol', 'atenolol', 'propranolol', 'carvedilol', 'bisoprolol', 'nebivolol', 'labetalol'] },
  { className: 'Statins', drugs: ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin', 'fluvastatin', 'pitavastatin'] },
  { className: 'PPIs', drugs: ['omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole', 'rabeprazole', 'dexlansoprazole'] },
  { className: 'SSRIs', drugs: ['fluoxetine', 'sertraline', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine'] },
  { className: 'Benzodiazepines', drugs: _AI_BENZODIAZEPINES },
  { className: 'Opioids', drugs: ['oxycodone', 'hydrocodone', 'morphine', 'fentanyl', 'codeine', 'tramadol', 'methadone', 'buprenorphine'] },
  { className: 'NSAIDs', drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam', 'celecoxib', 'indomethacin', 'ketorolac', 'piroxicam'] },
  { className: 'Calcium Channel Blockers', drugs: ['amlodipine', 'nifedipine', 'diltiazem', 'verapamil', 'felodipine'] },
  { className: 'Thiazide Diuretics', drugs: ['hydrochlorothiazide', 'chlorthalidone', 'indapamide', 'metolazone'] },
];

const MEDICATION_MONITORING = [
  { drug: 'warfarin', labs: ['INR', 'PT'], frequency: 'Every 1-4 weeks', description: 'INR monitoring required. Target 2.0-3.0 for most indications.' },
  { drug: 'methotrexate', labs: ['CBC', 'CMP', 'LFTs'], frequency: 'Every 1-3 months', description: 'Monitor for hepatotoxicity, myelosuppression, renal function.' },
  { drug: 'lithium', labs: ['Lithium level', 'TSH', 'Cr', 'BMP'], frequency: 'Every 3-6 months', description: 'Monitor lithium levels (therapeutic 0.6-1.2), thyroid, renal function.' },
  { drug: 'metformin', labs: ['BMP', 'Cr', 'eGFR', 'B12'], frequency: 'Every 6-12 months', description: 'Monitor renal function. B12 deficiency with long-term use.' },
  { drug: 'atorvastatin', labs: ['Lipid panel', 'LFTs', 'CK'], frequency: 'Every 6-12 months', description: 'Baseline LFTs. Monitor for myopathy symptoms.' },
  { drug: 'simvastatin', labs: ['Lipid panel', 'LFTs', 'CK'], frequency: 'Every 6-12 months', description: 'Baseline LFTs. Monitor for myopathy symptoms.' },
  { drug: 'rosuvastatin', labs: ['Lipid panel', 'LFTs', 'CK'], frequency: 'Every 6-12 months', description: 'Baseline LFTs. Monitor for myopathy symptoms.' },
  { drug: 'amiodarone', labs: ['TFTs', 'LFTs', 'PFTs', 'CXR'], frequency: 'Every 6 months', description: 'Monitor thyroid, liver, pulmonary function. Baseline eye exam.' },
  { drug: 'digoxin', labs: ['Digoxin level', 'BMP', 'Mg'], frequency: 'Every 6-12 months', description: 'Therapeutic range 0.5-2.0 ng/mL. Monitor electrolytes.' },
  { drug: 'carbamazepine', labs: ['CBC', 'CMP', 'Drug level'], frequency: 'Every 3-6 months', description: 'Monitor for blood dyscrasias, hepatotoxicity.' },
  { drug: 'valproic acid', labs: ['CBC', 'LFTs', 'Drug level', 'Ammonia'], frequency: 'Every 3-6 months', description: 'Monitor for hepatotoxicity, thrombocytopenia.' },
  { drug: 'phenytoin', labs: ['CBC', 'CMP', 'Drug level'], frequency: 'Every 3-6 months', description: 'Therapeutic range 10-20 mcg/mL. Monitor for toxicity.' },
  { drug: 'clozapine', labs: ['ANC'], frequency: 'Weekly for 6 months, then biweekly', description: 'REMS program. Must monitor ANC for agranulocytosis.' },
  { drug: 'lisinopril', labs: ['BMP', 'Cr', 'K+'], frequency: 'Within 1-2 weeks of start, then every 6-12 months', description: 'Monitor renal function and potassium.' },
  { drug: 'spironolactone', labs: ['BMP', 'K+', 'Cr'], frequency: 'Within 1 week, then every 3-6 months', description: 'Monitor potassium closely for hyperkalemia.' },
  { drug: 'levothyroxine', labs: ['TSH'], frequency: 'Every 6-8 weeks after dose change, then annually', description: 'Monitor TSH. Adjust dose to maintain TSH in range.' },
];

/* ============================================================
   2. PATIENT EDUCATION DATABASE
   ============================================================ */

const _AI_PATIENT_EDUCATION = {
  conditions: {
    'diabetes': { title: 'Diabetes Self-Management', items: [
      'Blood glucose monitoring: Check fasting and post-meal levels as directed',
      'Diet: Follow low-glycemic, balanced meal plan. Limit refined carbs and sugars',
      'Exercise: 150 minutes moderate activity per week (walking, swimming)',
      'Foot care: Daily inspection, proper footwear, see podiatrist annually',
      'Eye care: Annual dilated eye exam to screen for diabetic retinopathy',
      'Sick day management: Monitor glucose more often, stay hydrated, contact provider if unable to eat',
      'Hypoglycemia recognition: Shakiness, sweating, confusion. Treat with 15g fast carbs',
      'A1C goal: Generally < 7%, individualized based on patient factors'
    ]},
    'hypertension': { title: 'Blood Pressure Management', items: [
      'Home BP monitoring: Check twice daily (morning and evening), keep a log',
      'DASH diet: Rich in fruits, vegetables, whole grains, low-fat dairy. Limit sodium to <2300mg/day',
      'Exercise: 30 minutes moderate activity most days of the week',
      'Limit alcohol: No more than 1 drink/day (women) or 2 drinks/day (men)',
      'Medication adherence: Take BP medications at the same time daily, do not skip doses',
      'Weight management: Losing 5-10% body weight can significantly lower BP',
      'Stress management: Relaxation techniques, adequate sleep',
      'Know your numbers: Target generally <130/80 mmHg'
    ]},
    'heart failure': { title: 'Heart Failure Self-Care', items: [
      'Daily weight monitoring: Weigh every morning, report gain >2 lbs in 1 day or >5 lbs in 1 week',
      'Fluid restriction: Typically 1.5-2 liters per day as directed',
      'Low sodium diet: <2000mg sodium per day',
      'Medication adherence: ACE/ARB, beta-blocker, diuretic as prescribed',
      'Activity: Stay as active as tolerable, cardiac rehab if recommended',
      'Symptom monitoring: Watch for increased swelling, shortness of breath, fatigue',
      'Vaccinations: Flu shot annually, pneumococcal vaccine',
      'Avoid NSAIDs (ibuprofen, naproxen) as they worsen fluid retention'
    ]},
    'copd': { title: 'COPD Management', items: [
      'Smoking cessation: Most important intervention. Ask about cessation support',
      'Inhaler technique: Review proper use of inhalers. Use spacer with MDIs',
      'Pulmonary rehab: Improves exercise tolerance and quality of life',
      'Action plan: Know when to increase medications and when to seek emergency care',
      'Vaccinations: Annual flu shot, pneumococcal vaccine, COVID-19 vaccine',
      'Oxygen therapy: If prescribed, use as directed. Do not adjust flow rate',
      'Avoid triggers: Air pollution, dust, strong fumes, cold air',
      'Breathing exercises: Pursed-lip and diaphragmatic breathing techniques'
    ]},
    'asthma': { title: 'Asthma Self-Management', items: [
      'Controller medication: Use daily even when feeling well',
      'Rescue inhaler: Carry at all times. If using >2x/week, asthma not well controlled',
      'Trigger avoidance: Identify and minimize exposure to allergens, irritants',
      'Asthma action plan: Know your green/yellow/red zone actions',
      'Peak flow monitoring: Track daily if recommended',
      'Exercise: Regular activity is beneficial. Pre-treat with rescue inhaler if needed'
    ]},
    'depression': { title: 'Depression Management', items: [
      'Medication: Antidepressants take 2-4 weeks to reach full effect. Do not stop abruptly',
      'Therapy: Cognitive behavioral therapy (CBT) is highly effective',
      'Exercise: Regular physical activity improves mood. Aim for 30 min most days',
      'Sleep hygiene: Maintain consistent sleep schedule, limit screens before bed',
      'Social connection: Stay connected with supportive people',
      'Avoid alcohol: Can worsen depression and interact with medications',
      'Crisis resources: National Suicide Prevention Lifeline: 988',
      'Follow-up: Regular appointments to monitor symptoms and adjust treatment'
    ]},
    'chronic kidney disease': { title: 'Kidney Disease Management', items: [
      'Blood pressure control: Target <130/80. Most important modifiable factor',
      'Diabetes management: Tight glucose control slows progression',
      'Diet: May need protein, potassium, phosphorus, sodium restriction depending on stage',
      'Avoid nephrotoxins: NSAIDs, contrast dye, aminoglycosides',
      'Medication review: Dose adjust renally-cleared medications',
      'Hydration: Stay well hydrated unless fluid restricted',
      'Monitor labs: Regular BMP, CBC, PTH, phosphorus, urinalysis'
    ]},
  },
  medications: {
    'metformin': ['Take with food to reduce GI side effects', 'Report any severe nausea, vomiting, or unusual fatigue', 'Hold before procedures with contrast dye'],
    'warfarin': ['Maintain consistent vitamin K intake', 'Report any unusual bruising or bleeding', 'Attend all INR monitoring appointments', 'Many drug interactions - always check before starting new medications'],
    'insulin': ['Rotate injection sites', 'Store unopened insulin in refrigerator', 'Know signs of hypoglycemia and how to treat', 'Carry glucose tablets or juice'],
    'metoprolol': ['Do not stop abruptly - taper under supervision', 'May cause fatigue or dizziness initially', 'Monitor heart rate at home'],
    'lisinopril': ['Report persistent dry cough (common side effect)', 'Rise slowly from sitting to avoid dizziness', 'Avoid potassium supplements unless directed'],
    'amlodipine': ['Ankle swelling is common - report if severe', 'Avoid grapefruit in large amounts'],
    'prednisone': ['Take with food', 'Do not stop abruptly if taken >7 days', 'May increase blood sugar and appetite', 'Increased infection risk'],
    'levothyroxine': ['Take on empty stomach, 30-60 min before breakfast', 'Separate from calcium, iron supplements by 4 hours', 'Consistent daily timing important'],
  }
};

/* ============================================================
   3. CHARLSON COMORBIDITY INDEX WEIGHTS
   ============================================================ */

const CHARLSON_CONDITIONS = [
  { name: 'Myocardial infarction', weight: 1, keywords: ['myocardial infarction', 'mi', 'heart attack', 'stemi', 'nstemi'] },
  { name: 'Congestive heart failure', weight: 1, keywords: ['heart failure', 'chf', 'hfref', 'hfpef', 'cardiomyopathy'] },
  { name: 'Peripheral vascular disease', weight: 1, keywords: ['peripheral vascular', 'pvd', 'pad', 'peripheral artery', 'claudication'] },
  { name: 'Cerebrovascular disease', weight: 1, keywords: ['stroke', 'cva', 'tia', 'cerebrovascular'] },
  { name: 'Dementia', weight: 1, keywords: ['dementia', 'alzheimer', 'cognitive impairment'] },
  { name: 'Chronic pulmonary disease', weight: 1, keywords: ['copd', 'chronic obstructive', 'emphysema', 'chronic bronchitis', 'asthma'] },
  { name: 'Connective tissue disease', weight: 1, keywords: ['rheumatoid', 'lupus', 'sle', 'scleroderma', 'polymyositis'] },
  { name: 'Peptic ulcer disease', weight: 1, keywords: ['peptic ulcer', 'gastric ulcer', 'duodenal ulcer'] },
  { name: 'Mild liver disease', weight: 1, keywords: ['hepatitis', 'fatty liver', 'nafld', 'nash'] },
  { name: 'Diabetes without complications', weight: 1, keywords: ['diabetes', 'dm', 'type 2 diabetes', 'type 1 diabetes'] },
  { name: 'Diabetes with complications', weight: 2, keywords: ['diabetic nephropathy', 'diabetic retinopathy', 'diabetic neuropathy', 'diabetic foot'] },
  { name: 'Hemiplegia', weight: 2, keywords: ['hemiplegia', 'hemiparesis', 'paraplegia', 'quadriplegia'] },
  { name: 'Renal disease', weight: 2, keywords: ['chronic kidney', 'ckd', 'renal failure', 'dialysis', 'esrd'] },
  { name: 'Malignancy', weight: 2, keywords: ['cancer', 'carcinoma', 'lymphoma', 'leukemia', 'malignant', 'neoplasm'] },
  { name: 'Moderate/severe liver disease', weight: 3, keywords: ['cirrhosis decompensated', 'portal hypertension', 'variceal', 'ascites', 'hepatic encephalopathy'] },
  { name: 'Metastatic solid tumor', weight: 6, keywords: ['metastatic', 'metastasis', 'stage iv cancer', 'stage 4 cancer'] },
  { name: 'AIDS', weight: 6, keywords: ['aids', 'hiv', 'acquired immunodeficiency'] },
];

/* ============================================================
   4. ANALYSIS ENGINE FUNCTIONS
   ============================================================ */

function _aiGetAge(patient) {
  if (!patient || !patient.dob) return null;
  var d = new Date(patient.dob);
  if (isNaN(d.getTime())) return null;
  var now = new Date();
  var age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

function _aiMatchKw(text, keywords) {
  if (!text) return false;
  var t = text.toLowerCase();
  return keywords.some(function(k) { return t.indexOf(k.toLowerCase()) >= 0; });
}

function _aiGetAllConditionText(patientId) {
  var problems = typeof getActiveProblems === 'function' ? getActiveProblems(patientId) : [];
  var diagnoses = typeof getPatientDiagnoses === 'function' ? getPatientDiagnoses(patientId) : [];
  var text = '';
  problems.forEach(function(p) { text += ' ' + (p.name || '') + ' ' + (p.icd10 || '') + ' ' + (p.notes || ''); });
  diagnoses.forEach(function(d) { text += ' ' + (d.name || '') + ' ' + (d.icd10 || '') + ' ' + (d.evidenceNotes || ''); });
  return text.toLowerCase();
}

function _aiGetActiveMeds(patientId) {
  var meds = typeof getPatientMedications === 'function' ? getPatientMedications(patientId) : [];
  return meds.filter(function(m) { return (m.status || '').toLowerCase() === 'active'; });
}

/* ---------- 4a. Chart Completeness ---------- */

function analyzeChartCompleteness(patientId) {
  var findings = [];
  var patient = getPatient(patientId);
  if (!patient) return findings;

  var allergies = typeof getPatientAllergies === 'function' ? getPatientAllergies(patientId) : [];
  if (allergies.length === 0) {
    findings.push({ category: 'Chart Completeness', type: 'missing_allergies', severity: 'warning', title: 'No Allergies Documented', description: 'Allergy status has not been documented. Record NKDA or specific allergies.', action: 'Document allergy status in patient chart' });
  }

  var problems = typeof getActiveProblems === 'function' ? getActiveProblems(patientId) : [];
  if (problems.length === 0) {
    findings.push({ category: 'Chart Completeness', type: 'incomplete_problem_list', severity: 'info', title: 'Empty Problem List', description: 'No active problems documented. If the patient has known conditions, add them to the problem list.', action: 'Review and update problem list' });
  }

  var encounters = getEncountersByPatient(patientId);
  var unsignedCount = 0;
  encounters.forEach(function(enc) {
    var note = typeof getNoteByEncounter === 'function' ? getNoteByEncounter(enc.id) : null;
    if (note && !note.signed && enc.status !== 'Cancelled') unsignedCount++;
  });
  if (unsignedCount > 0) {
    findings.push({ category: 'Chart Completeness', type: 'unsigned_encounters', severity: unsignedCount > 3 ? 'critical' : 'warning', title: unsignedCount + ' Unsigned Encounter' + (unsignedCount > 1 ? 's' : ''), description: 'There ' + (unsignedCount === 1 ? 'is' : 'are') + ' ' + unsignedCount + ' encounter note' + (unsignedCount > 1 ? 's' : '') + ' awaiting signature.', action: 'Review and sign pending encounter notes' });
  }

  if (!patient.dob) findings.push({ category: 'Chart Completeness', type: 'missing_dob', severity: 'warning', title: 'Missing Date of Birth', description: 'Date of birth is not recorded. This affects age-based screening recommendations.', action: 'Update patient demographics' });
  if (!patient.sex) findings.push({ category: 'Chart Completeness', type: 'missing_sex', severity: 'warning', title: 'Missing Sex/Gender', description: 'Sex is not recorded. This affects gender-specific screening recommendations.', action: 'Update patient demographics' });
  if (!patient.phone && !patient.email) findings.push({ category: 'Chart Completeness', type: 'missing_contact', severity: 'info', title: 'No Contact Information', description: 'No phone number or email on file.', action: 'Obtain patient contact information' });

  var sh = typeof getSocialHistory === 'function' ? getSocialHistory(patientId) : null;
  if (!sh) findings.push({ category: 'Chart Completeness', type: 'missing_social_hx', severity: 'info', title: 'No Social History', description: 'Social history has not been documented.', action: 'Document social history' });

  var fh = typeof getFamilyHistory === 'function' ? getFamilyHistory(patientId) : null;
  if (!fh || (!fh.mother && !fh.father && !fh.siblings && !fh.other)) {
    findings.push({ category: 'Chart Completeness', type: 'missing_family_hx', severity: 'info', title: 'No Family History', description: 'Family history has not been documented.', action: 'Document family medical history' });
  }

  if (typeof evaluatePatientCareGaps === 'function') {
    var careGaps = evaluatePatientCareGaps(patientId);
    var overdueGaps = careGaps.filter(function(g) { return g.status === 'overdue'; });
    if (overdueGaps.length > 0) {
      findings.push({ category: 'Chart Completeness', type: 'overdue_screenings', severity: 'warning', title: overdueGaps.length + ' Overdue Screening' + (overdueGaps.length > 1 ? 's' : ''), description: 'Overdue: ' + overdueGaps.slice(0, 4).map(function(g) { return g.ruleName; }).join(', ') + (overdueGaps.length > 4 ? ' and ' + (overdueGaps.length - 4) + ' more' : ''), action: 'Order overdue screenings and schedule follow-up' });
    }
  }

  var age = _aiGetAge(patient);
  if (age !== null && age >= 65) {
    var imms = typeof getImmunizations === 'function' ? getImmunizations(patientId) : [];
    var oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    var hasFlue = imms.some(function(i) { return _aiMatchKw(i.vaccine, ['influenza', 'flu']) && new Date(i.date) > oneYearAgo; });
    var hasPneumo = imms.some(function(i) { return _aiMatchKw(i.vaccine, ['pneumococcal', 'prevnar', 'pneumovax']); });
    var hasZoster = imms.some(function(i) { return _aiMatchKw(i.vaccine, ['zoster', 'shingrix', 'shingles']); });
    if (!hasFlue) findings.push({ category: 'Chart Completeness', type: 'missing_flu', severity: 'info', title: 'No Recent Flu Vaccine', description: 'No influenza vaccine documented in the past year for patient age 65+.', action: 'Administer influenza vaccine' });
    if (!hasPneumo) findings.push({ category: 'Chart Completeness', type: 'missing_pneumo', severity: 'info', title: 'No Pneumococcal Vaccine', description: 'Pneumococcal vaccine not documented for patient age 65+.', action: 'Administer pneumococcal vaccine series' });
    if (!hasZoster) findings.push({ category: 'Chart Completeness', type: 'missing_zoster', severity: 'info', title: 'No Shingles Vaccine', description: 'Shingrix vaccine not documented for patient age 65+.', action: 'Administer Shingrix vaccine series' });
  }

  return findings;
}

/* ---------- 4b. Drug Interaction Checker ---------- */

function analyzeDrugInteractions(patientId) {
  var findings = [];
  var meds = _aiGetActiveMeds(patientId);
  if (meds.length === 0) return findings;
  var medNames = meds.map(function(m) { return (m.name || m.drug || '').toLowerCase(); });

  DRUG_INTERACTIONS.forEach(function(ix) {
    var hasA = medNames.some(function(n) { return n.indexOf(ix.drugA) >= 0; });
    var hasB = false;
    if (ix.drugB === 'benzodiazepine') hasB = medNames.some(function(n) { return _AI_BENZODIAZEPINES.some(function(bz) { return n.indexOf(bz) >= 0; }); });
    else if (ix.drugB === 'nsaid') hasB = medNames.some(function(n) { return ['ibuprofen','naproxen','diclofenac','meloxicam','celecoxib','indomethacin','ketorolac'].some(function(ns) { return n.indexOf(ns) >= 0; }); });
    else if (ix.drugB === 'fluoroquinolone') hasB = medNames.some(function(n) { return ['ciprofloxacin','levofloxacin','moxifloxacin'].some(function(fq) { return n.indexOf(fq) >= 0; }); });
    else if (ix.drugB === 'maoi') hasB = medNames.some(function(n) { return ['phenelzine','tranylcypromine','isocarboxazid','selegiline'].some(function(m) { return n.indexOf(m) >= 0; }); });
    else hasB = medNames.some(function(n) { return n.indexOf(ix.drugB) >= 0; });
    if (hasA && hasB) {
      findings.push({ category: 'Drug Interactions', type: 'drug_drug', severity: ix.severity, title: 'Interaction: ' + ix.drugA.charAt(0).toUpperCase() + ix.drugA.slice(1) + ' + ' + ix.drugB.charAt(0).toUpperCase() + ix.drugB.slice(1), description: ix.description, action: 'Review indication for both medications. Consider alternatives.' });
    }
  });

  var allergies = typeof getPatientAllergies === 'function' ? getPatientAllergies(patientId) : [];
  allergies.forEach(function(allergy) {
    var allergen = (allergy.allergen || '').toLowerCase();
    meds.forEach(function(med) {
      var medName = (med.name || med.drug || '').toLowerCase();
      if (medName.indexOf(allergen) >= 0 || allergen.indexOf(medName) >= 0) {
        findings.push({ category: 'Drug Interactions', type: 'drug_allergy', severity: (allergy.severity || '').toLowerCase() === 'severe' || (allergy.severity || '').toLowerCase() === 'life-threatening' ? 'critical' : 'high', title: 'Drug-Allergy Conflict: ' + (med.name || med.drug), description: 'Patient has documented ' + (allergy.severity || '') + ' allergy to ' + allergy.allergen + '. Reaction: ' + (allergy.reaction || 'not specified'), action: 'Discontinue medication or verify allergy documentation' });
      }
    });
    if (allergen.indexOf('penicillin') >= 0 || allergen.indexOf('amoxicillin') >= 0) {
      var cephalosporins = medNames.filter(function(n) { return ['cephalexin','cefazolin','ceftriaxone','cefdinir','cefepime'].some(function(c) { return n.indexOf(c) >= 0; }); });
      if (cephalosporins.length > 0) {
        findings.push({ category: 'Drug Interactions', type: 'cross_reactivity', severity: 'moderate', title: 'Cross-Reactivity: Penicillin Allergy + Cephalosporin', description: 'Patient has penicillin allergy and is on a cephalosporin. Cross-reactivity is ~1-2%.', action: 'Verify cephalosporin tolerance or consider alternative' });
      }
    }
  });

  DUPLICATE_THERAPY_CLASSES.forEach(function(cls) {
    var matching = meds.filter(function(m) { var n = (m.name || m.drug || '').toLowerCase(); return cls.drugs.some(function(d) { return n.indexOf(d) >= 0; }); });
    if (matching.length > 1) {
      findings.push({ category: 'Drug Interactions', type: 'duplicate_therapy', severity: 'moderate', title: 'Duplicate Therapy: ' + cls.className, description: 'Multiple ' + cls.className + ' prescribed: ' + matching.map(function(m) { return m.name || m.drug; }).join(', '), action: 'Evaluate if duplicate therapy is intentional' });
    }
  });

  MEDICATION_MONITORING.forEach(function(mon) {
    var isOnDrug = medNames.some(function(n) { return n.indexOf(mon.drug) >= 0; });
    if (!isOnDrug) return;
    var labs = typeof getLabResults === 'function' ? getLabResults(patientId) : [];
    var hasRecentLab = false;
    var sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    labs.forEach(function(lab) {
      if (new Date(lab.resultDate) < sixMonthsAgo) return;
      var labText = (lab.panel || '').toLowerCase();
      if (lab.tests) lab.tests.forEach(function(t) { labText += ' ' + (t.name || t.testName || '').toLowerCase(); });
      if (mon.labs.some(function(l) { return labText.indexOf(l.toLowerCase()) >= 0; })) hasRecentLab = true;
    });
    if (!hasRecentLab) {
      findings.push({ category: 'Medication Monitoring', type: 'monitoring_gap', severity: 'warning', title: 'Monitoring Due: ' + mon.drug.charAt(0).toUpperCase() + mon.drug.slice(1), description: mon.description + ' Required labs: ' + mon.labs.join(', ') + '. No matching labs in past 6 months.', action: 'Order monitoring labs: ' + mon.labs.join(', ') });
    }
  });

  return findings;
}

/* ---------- 4c. Clinical Decision Support ---------- */

function analyzeClinicalDecisionSupport(patientId) {
  var findings = [];
  var patient = getPatient(patientId);
  if (!patient) return findings;
  var conditionText = _aiGetAllConditionText(patientId);
  var meds = _aiGetActiveMeds(patientId);
  var medNames = meds.map(function(m) { return (m.name || m.drug || '').toLowerCase(); });
  var age = _aiGetAge(patient);
  var vitalsResult = typeof getLatestVitalsByPatient === 'function' ? getLatestVitalsByPatient(patientId) : null;
  var vitals = vitalsResult ? vitalsResult.vitals : null;

  if (vitals) {
    var sirsCount = 0;
    if (vitals.tempF && (parseFloat(vitals.tempF) > 100.4 || parseFloat(vitals.tempF) < 96.8)) sirsCount++;
    if (vitals.heartRate && parseFloat(vitals.heartRate) > 90) sirsCount++;
    if (vitals.respRate && parseFloat(vitals.respRate) > 20) sirsCount++;
    var labs = typeof getLabResults === 'function' ? getLabResults(patientId) : [];
    labs.forEach(function(lab) {
      if (!lab.tests) return;
      lab.tests.forEach(function(t) {
        var tN = (t.name || t.testName || '').toLowerCase();
        if ((tN.indexOf('wbc') >= 0 || tN.indexOf('white blood cell') >= 0)) {
          var val = parseFloat(t.value);
          if (!isNaN(val) && (val > 12 || val < 4)) sirsCount++;
        }
      });
    });
    if (sirsCount >= 2) {
      var suspectedInfx = _aiMatchKw(conditionText, ['infection', 'pneumonia', 'uti', 'cellulitis', 'abscess', 'sepsis', 'bacteremia', 'fever']);
      if (suspectedInfx) {
        findings.push({ category: 'Clinical Decision Support', type: 'sepsis_screening', severity: 'critical', title: 'Sepsis Alert: ' + sirsCount + ' SIRS Criteria + Suspected Infection', description: 'Consider sepsis workup: blood cultures, lactate, procalcitonin. Initiate early antibiotics and IV fluids per sepsis bundle.', action: 'Initiate sepsis bundle: cultures, lactate, antibiotics within 1 hour' });
      } else {
        findings.push({ category: 'Clinical Decision Support', type: 'sirs_alert', severity: 'warning', title: 'SIRS Alert: ' + sirsCount + ' Criteria Met', description: 'Patient meets ' + sirsCount + ' SIRS criteria. Evaluate for possible infectious or non-infectious etiology.', action: 'Assess for source of inflammation/infection' });
      }
    }

    var fallScore = 0, fallFactors = [];
    if (age !== null && age >= 65) { fallScore += 2; fallFactors.push('Age >=65'); }
    if (age !== null && age >= 80) { fallScore += 1; fallFactors.push('Age >=80'); }
    if (_aiMatchKw(conditionText, ['fall', 'gait instability', 'balance disorder'])) { fallScore += 2; fallFactors.push('History of falls'); }
    if (_aiMatchKw(conditionText, ['dementia', 'cognitive impairment', 'delirium'])) { fallScore += 2; fallFactors.push('Cognitive impairment'); }
    if (medNames.some(function(n) { return _AI_BENZODIAZEPINES.some(function(bz) { return n.indexOf(bz) >= 0; }); })) { fallScore += 2; fallFactors.push('Benzodiazepine use'); }
    if (medNames.some(function(n) { return ['oxycodone','hydrocodone','morphine','fentanyl','tramadol'].some(function(op) { return n.indexOf(op) >= 0; }); })) { fallScore += 1; fallFactors.push('Opioid use'); }
    if (_aiMatchKw(conditionText, ['parkinson', 'neuropathy', 'vertigo', 'syncope'])) { fallScore += 2; fallFactors.push('Neurological condition'); }
    if (vitals.bpSystolic && parseFloat(vitals.bpSystolic) < 100) { fallScore += 1; fallFactors.push('Hypotension'); }
    if (fallScore >= 4) {
      findings.push({ category: 'Clinical Decision Support', type: 'fall_risk', severity: fallScore >= 6 ? 'high' : 'moderate', title: 'Fall Risk: ' + (fallScore >= 6 ? 'HIGH' : 'MODERATE') + ' (Score ' + fallScore + ')', description: 'Risk factors: ' + fallFactors.join(', ') + '. Consider fall prevention measures.', action: 'Implement fall prevention protocol, consider PT referral' });
    }

    if (vitals.bpSystolic && parseFloat(vitals.bpSystolic) >= 180) {
      findings.push({ category: 'Clinical Decision Support', type: 'htn_urgency', severity: 'critical', title: 'Hypertensive Urgency: SBP ' + vitals.bpSystolic, description: 'Systolic BP >= 180 mmHg. Assess for end-organ damage.', action: 'Recheck BP, assess for symptoms, consider acute treatment' });
    } else if (vitals.bpSystolic && parseFloat(vitals.bpSystolic) >= 160) {
      findings.push({ category: 'Clinical Decision Support', type: 'htn_elevated', severity: 'warning', title: 'Elevated BP: ' + vitals.bpSystolic + '/' + (vitals.bpDiastolic || '?'), description: 'Blood pressure is significantly elevated.', action: 'Review antihypertensive regimen, check compliance' });
    }

    if (vitals.spo2 && parseFloat(vitals.spo2) < 92) {
      findings.push({ category: 'Clinical Decision Support', type: 'hypoxia', severity: parseFloat(vitals.spo2) < 88 ? 'critical' : 'high', title: 'Hypoxia: SpO2 ' + vitals.spo2 + '%', description: 'Oxygen saturation below 92%. Assess respiratory status.', action: 'Apply supplemental oxygen, assess for cause' });
    }

    if (vitals.heartRate && parseFloat(vitals.heartRate) > 120) {
      findings.push({ category: 'Clinical Decision Support', type: 'tachycardia', severity: parseFloat(vitals.heartRate) > 150 ? 'critical' : 'warning', title: 'Tachycardia: HR ' + vitals.heartRate, description: 'Heart rate > 120 bpm.', action: 'Evaluate etiology, consider ECG' });
    }
    if (vitals.heartRate && parseFloat(vitals.heartRate) < 50) {
      findings.push({ category: 'Clinical Decision Support', type: 'bradycardia', severity: parseFloat(vitals.heartRate) < 40 ? 'critical' : 'warning', title: 'Bradycardia: HR ' + vitals.heartRate, description: 'Heart rate < 50 bpm. Check for medication effects.', action: 'Review rate-controlling medications, obtain ECG' });
    }
  }

  var encounters = getEncountersByPatient(patientId);
  var hasOpenInpatient = encounters.some(function(e) { return (e.visitType || '').toLowerCase() === 'inpatient' && e.status === 'Open'; });
  if (hasOpenInpatient) {
    var hasAnticoag = medNames.some(function(n) { return ['heparin','enoxaparin','lovenox','warfarin','apixaban','rivaroxaban','dabigatran','fondaparinux'].some(function(ac) { return n.indexOf(ac) >= 0; }); });
    if (!hasAnticoag) {
      findings.push({ category: 'Clinical Decision Support', type: 'vte_prophylaxis', severity: 'high', title: 'VTE Prophylaxis Not Ordered', description: 'Inpatient without documented anticoagulation. Consider VTE prophylaxis.', action: 'Order VTE prophylaxis or document contraindication' });
    }
    var broadSpectrum = meds.filter(function(m) { var n = (m.name || m.drug || '').toLowerCase(); return ['vancomycin','piperacillin','meropenem','cefepime','linezolid'].some(function(bs) { return n.indexOf(bs) >= 0; }); });
    if (broadSpectrum.length > 0) {
      findings.push({ category: 'Clinical Decision Support', type: 'abx_stewardship', severity: 'moderate', title: 'Antibiotic Stewardship: Broad-Spectrum Agent(s)', description: 'Broad-spectrum antibiotic(s): ' + broadSpectrum.map(function(m) { return m.name || m.drug; }).join(', ') + '. Consider de-escalation.', action: 'Review cultures at 48-72h, de-escalate if possible' });
    }
  }

  if (_aiMatchKw(conditionText, ['diabetes', 'dm', 'type 2 diabetes', 'type 1 diabetes'])) {
    var hasStatin = medNames.some(function(n) { return ['atorvastatin','simvastatin','rosuvastatin','pravastatin'].some(function(s) { return n.indexOf(s) >= 0; }); });
    var hasACE = medNames.some(function(n) { return ['lisinopril','enalapril','ramipril','losartan','valsartan','irbesartan'].some(function(a) { return n.indexOf(a) >= 0; }); });
    if (age !== null && age >= 40 && !hasStatin) {
      findings.push({ category: 'Clinical Decision Support', type: 'dm_statin', severity: 'info', title: 'Diabetic Patient Without Statin', description: 'ADA recommends moderate-intensity statin for diabetic patients age 40-75.', action: 'Consider initiating statin therapy' });
    }
    if (_aiMatchKw(conditionText, ['nephropathy', 'proteinuria', 'albuminuria', 'ckd']) && !hasACE) {
      findings.push({ category: 'Clinical Decision Support', type: 'dm_ace', severity: 'warning', title: 'Diabetic Kidney Disease Without ACEi/ARB', description: 'Patient has diabetes with nephropathy but no ACE/ARB. These are renoprotective.', action: 'Consider ACE inhibitor or ARB for renoprotection' });
    }
  }

  if (_aiMatchKw(conditionText, ['heart failure', 'chf', 'hfref', 'cardiomyopathy'])) {
    var hasBB = medNames.some(function(n) { return ['metoprolol','carvedilol','bisoprolol'].some(function(bb) { return n.indexOf(bb) >= 0; }); });
    var hasACEorARB = medNames.some(function(n) { return ['lisinopril','enalapril','ramipril','losartan','valsartan','sacubitril'].some(function(a) { return n.indexOf(a) >= 0; }); });
    if (!hasBB) findings.push({ category: 'Clinical Decision Support', type: 'chf_beta_blocker', severity: 'warning', title: 'HF Without Evidence-Based Beta-Blocker', description: 'Guidelines recommend carvedilol, metoprolol succinate, or bisoprolol for HFrEF.', action: 'Consider adding guideline-directed beta-blocker' });
    if (!hasACEorARB) findings.push({ category: 'Clinical Decision Support', type: 'chf_ace', severity: 'warning', title: 'HF Without ACEi/ARB/ARNI', description: 'Guidelines recommend ACE inhibitor, ARB, or sacubitril/valsartan for HFrEF.', action: 'Consider adding guideline-directed RAAS inhibitor' });
    var hasNSAID = medNames.some(function(n) { return ['ibuprofen','naproxen','diclofenac','meloxicam','celecoxib','indomethacin','ketorolac'].some(function(ns) { return n.indexOf(ns) >= 0; }); });
    if (hasNSAID) findings.push({ category: 'Clinical Decision Support', type: 'chf_nsaid', severity: 'high', title: 'NSAID Use in Heart Failure', description: 'NSAIDs worsen fluid retention and can precipitate HF exacerbation.', action: 'Discontinue NSAID, consider acetaminophen alternative' });
  }

  return findings;
}

/* ---------- 4d. Documentation Quality Score ---------- */

function analyzeDocumentationQuality(patientId) {
  var findings = [];
  var encounters = getEncountersByPatient(patientId);
  if (encounters.length === 0) return findings;
  var recentEnc = encounters[0];
  var note = typeof getNoteByEncounter === 'function' ? getNoteByEncounter(recentEnc.id) : null;

  if (!note) {
    findings.push({ category: 'Documentation Quality', type: 'no_note', severity: 'warning', title: 'No Note for Most Recent Encounter', description: 'Encounter on ' + formatDate(recentEnc.dateTime) + ' has no documentation.', action: 'Complete encounter documentation' });
    return findings;
  }

  var score = 0, maxScore = 105;
  var details = [];

  if (note.chiefComplaint && note.chiefComplaint.trim().length > 0) { score += 10; details.push({ section: 'Chief Complaint', points: 10, max: 10, status: 'complete' }); }
  else details.push({ section: 'Chief Complaint', points: 0, max: 10, status: 'missing' });

  if (note.hpi && note.hpi.trim().length > 0) {
    var hpiLen = note.hpi.trim().length;
    if (hpiLen >= 200) { score += 20; details.push({ section: 'HPI', points: 20, max: 20, status: 'complete' }); }
    else if (hpiLen >= 100) { score += 15; details.push({ section: 'HPI', points: 15, max: 20, status: 'partial' }); }
    else { score += 8; details.push({ section: 'HPI', points: 8, max: 20, status: 'brief' }); }
  } else details.push({ section: 'HPI', points: 0, max: 20, status: 'missing' });

  if (note.ros && note.ros.trim().length > 0) {
    if (note.ros.trim().length >= 50) { score += 10; details.push({ section: 'ROS', points: 10, max: 10, status: 'complete' }); }
    else { score += 5; details.push({ section: 'ROS', points: 5, max: 10, status: 'brief' }); }
  } else details.push({ section: 'ROS', points: 0, max: 10, status: 'missing' });

  if (note.physicalExam && note.physicalExam.trim().length > 0) {
    var peLen = note.physicalExam.trim().length;
    if (peLen >= 150) { score += 15; details.push({ section: 'Physical Exam', points: 15, max: 15, status: 'complete' }); }
    else if (peLen >= 50) { score += 10; details.push({ section: 'Physical Exam', points: 10, max: 15, status: 'partial' }); }
    else { score += 5; details.push({ section: 'Physical Exam', points: 5, max: 15, status: 'brief' }); }
  } else details.push({ section: 'Physical Exam', points: 0, max: 15, status: 'missing' });

  if (note.assessment && note.assessment.trim().length > 0) {
    var aLen = note.assessment.trim().length;
    if (aLen >= 100) { score += 20; details.push({ section: 'Assessment', points: 20, max: 20, status: 'complete' }); }
    else if (aLen >= 30) { score += 12; details.push({ section: 'Assessment', points: 12, max: 20, status: 'partial' }); }
    else { score += 5; details.push({ section: 'Assessment', points: 5, max: 20, status: 'brief' }); }
  } else details.push({ section: 'Assessment', points: 0, max: 20, status: 'missing' });

  if (note.plan && note.plan.trim().length > 0) {
    var pLen = note.plan.trim().length;
    if (pLen >= 100) { score += 20; details.push({ section: 'Plan', points: 20, max: 20, status: 'complete' }); }
    else if (pLen >= 30) { score += 12; details.push({ section: 'Plan', points: 12, max: 20, status: 'partial' }); }
    else { score += 5; details.push({ section: 'Plan', points: 5, max: 20, status: 'brief' }); }
  } else details.push({ section: 'Plan', points: 0, max: 20, status: 'missing' });

  if (note.signed) { score += 5; details.push({ section: 'Signature', points: 5, max: 5, status: 'complete' }); }
  else details.push({ section: 'Signature', points: 0, max: 5, status: 'missing' });

  var pct = Math.round((score / maxScore) * 100);
  var grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

  findings.push({ category: 'Documentation Quality', type: 'doc_score', severity: pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'critical', title: 'Documentation Score: ' + pct + '% (Grade ' + grade + ')', description: 'Most recent encounter (' + formatDate(recentEnc.dateTime) + ').', action: pct < 80 ? 'Improve documentation in incomplete sections' : 'Documentation meets quality standards', details: details, score: pct, grade: grade });

  var missing = details.filter(function(d) { return d.status === 'missing'; });
  if (missing.length > 0) {
    findings.push({ category: 'Documentation Quality', type: 'missing_sections', severity: 'info', title: missing.length + ' Missing Section' + (missing.length > 1 ? 's' : ''), description: 'Missing: ' + missing.map(function(d) { return d.section; }).join(', '), action: 'Complete missing sections in encounter note' });
  }

  return findings;
}

/* ---------- 4e. Risk Stratification ---------- */

function analyzeRiskStratification(patientId) {
  var findings = [];
  var patient = getPatient(patientId);
  if (!patient) return findings;
  var conditionText = _aiGetAllConditionText(patientId);
  var age = _aiGetAge(patient);

  var charlsonScore = 0, agePoints = 0;
  if (age !== null && age >= 50) agePoints = Math.floor((age - 40) / 10);
  charlsonScore += agePoints;
  var matchedConds = [];
  CHARLSON_CONDITIONS.forEach(function(c) {
    if (_aiMatchKw(conditionText, c.keywords)) { charlsonScore += c.weight; matchedConds.push(c.name + ' (+' + c.weight + ')'); }
  });
  var survival = charlsonScore <= 1 ? '~98%' : charlsonScore <= 2 ? '~90%' : charlsonScore <= 3 ? '~77%' : charlsonScore <= 4 ? '~53%' : charlsonScore <= 5 ? '~21%' : '<10%';
  findings.push({ category: 'Risk Stratification', type: 'charlson', severity: charlsonScore >= 5 ? 'high' : charlsonScore >= 3 ? 'moderate' : 'info', title: 'Charlson Comorbidity Index: ' + charlsonScore, description: 'Estimated 10-year survival: ' + survival + '. ' + (matchedConds.length > 0 ? 'Conditions: ' + matchedConds.join(', ') : 'No contributing conditions.') + (agePoints > 0 ? ' Age: +' + agePoints : ''), action: charlsonScore >= 3 ? 'Consider goals of care discussion and advance care planning' : 'Continue standard care' });

  var hasDepressionDx = _aiMatchKw(conditionText, ['depression', 'major depressive', 'mdd']);
  var meds = _aiGetActiveMeds(patientId);
  var onAntidepressant = meds.some(function(m) { var n = (m.name || m.drug || '').toLowerCase(); return ['fluoxetine','sertraline','paroxetine','citalopram','escitalopram','venlafaxine','duloxetine','bupropion','mirtazapine'].some(function(ad) { return n.indexOf(ad) >= 0; }); });
  if (hasDepressionDx || onAntidepressant) {
    var screenings = typeof getScreeningRecords === 'function' ? getScreeningRecords(patientId) : [];
    var ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    var recentPHQ = screenings.some(function(s) { return _aiMatchKw(s.screening, ['phq-9','phq9','depression']) && new Date(s.completedDate) > ninetyDaysAgo; });
    if (!recentPHQ) findings.push({ category: 'Risk Stratification', type: 'phq9_due', severity: 'info', title: 'PHQ-9 Depression Screening Due', description: 'Patient has depression diagnosis or is on antidepressant. No PHQ-9 in past 90 days.', action: 'Administer PHQ-9 screening' });
  }

  var socialHx = typeof getSocialHistory === 'function' ? getSocialHistory(patientId) : null;
  if (socialHx && socialHx.alcoholUse) {
    var alc = socialHx.alcoholUse.toLowerCase();
    if (alc.indexOf('heavy') >= 0 || alc.indexOf('daily') >= 0 || alc.indexOf('excessive') >= 0 || alc.indexOf('abuse') >= 0) {
      findings.push({ category: 'Risk Stratification', type: 'audit_c', severity: 'warning', title: 'AUDIT-C Screening Recommended', description: 'Social history suggests alcohol use that may warrant formal screening.', action: 'Administer AUDIT-C screening questionnaire' });
    }
  }

  if (age !== null && age >= 40) {
    var cvRF = [];
    if (_aiMatchKw(conditionText, ['hypertension', 'htn', 'high blood pressure'])) cvRF.push('Hypertension');
    if (_aiMatchKw(conditionText, ['diabetes', 'dm'])) cvRF.push('Diabetes');
    if (_aiMatchKw(conditionText, ['hyperlipidemia', 'dyslipidemia', 'high cholesterol'])) cvRF.push('Dyslipidemia');
    if (socialHx && socialHx.smokingStatus && socialHx.smokingStatus.toLowerCase().indexOf('current') >= 0) cvRF.push('Active smoker');
    var fh = typeof getFamilyHistory === 'function' ? getFamilyHistory(patientId) : null;
    if (fh) { var fhT = [fh.mother, fh.father, fh.siblings].filter(Boolean).join(' ').toLowerCase(); if (fhT.indexOf('heart') >= 0 || fhT.indexOf('cardiac') >= 0) cvRF.push('Family Hx CVD'); }
    if (cvRF.length >= 2) findings.push({ category: 'Risk Stratification', type: 'cv_risk', severity: cvRF.length >= 3 ? 'warning' : 'info', title: 'Cardiovascular Risk: ' + cvRF.length + ' Major Risk Factors', description: 'Risk factors: ' + cvRF.join(', '), action: 'Calculate ASCVD risk score, consider statin therapy' });
  }

  return findings;
}

/* ---------- 4f. Patient Education ---------- */

function analyzePatientEducation(patientId) {
  var findings = [];
  var conditionText = _aiGetAllConditionText(patientId);
  var meds = _aiGetActiveMeds(patientId);

  Object.keys(_AI_PATIENT_EDUCATION.conditions).forEach(function(condition) {
    if (_aiMatchKw(conditionText, [condition])) {
      var edu = _AI_PATIENT_EDUCATION.conditions[condition];
      findings.push({ category: 'Patient Education', type: 'condition_education', severity: 'info', title: edu.title, description: edu.items.slice(0, 3).join('; ') + (edu.items.length > 3 ? '...' : ''), action: 'Provide patient education materials', educationItems: edu.items });
    }
  });

  meds.forEach(function(m) {
    var medName = (m.name || m.drug || '').toLowerCase();
    Object.keys(_AI_PATIENT_EDUCATION.medications).forEach(function(drug) {
      if (medName.indexOf(drug) >= 0) {
        var tips = _AI_PATIENT_EDUCATION.medications[drug];
        findings.push({ category: 'Patient Education', type: 'medication_education', severity: 'info', title: 'Medication Guide: ' + drug.charAt(0).toUpperCase() + drug.slice(1), description: tips.join('; '), action: 'Review medication counseling points', educationItems: tips });
      }
    });
  });

  var socialHx = typeof getSocialHistory === 'function' ? getSocialHistory(patientId) : null;
  if (socialHx && socialHx.smokingStatus && socialHx.smokingStatus.toLowerCase().indexOf('current') >= 0) {
    findings.push({ category: 'Patient Education', type: 'smoking_cessation', severity: 'warning', title: 'Smoking Cessation Counseling', description: 'Patient is an active smoker. Offer NRT, bupropion, or varenicline. Quitline: 1-800-QUIT-NOW.', action: 'Counsel on smoking cessation, offer pharmacotherapy' });
  }

  return findings;
}

/* ============================================================
   5. MASTER ANALYSIS + DISMISSALS
   ============================================================ */

function runFullAIReview(patientId) {
  var all = [];
  all = all.concat(analyzeChartCompleteness(patientId));
  all = all.concat(analyzeDrugInteractions(patientId));
  all = all.concat(analyzeClinicalDecisionSupport(patientId));
  all = all.concat(analyzeDocumentationQuality(patientId));
  all = all.concat(analyzeRiskStratification(patientId));
  all = all.concat(analyzePatientEducation(patientId));
  var sevOrd = { critical: 0, high: 1, warning: 2, moderate: 3, info: 4, success: 5 };
  all.sort(function(a, b) { return (sevOrd[a.severity] || 99) - (sevOrd[b.severity] || 99); });
  return all;
}

var _AI_DISMISS_KEY = 'emr_ai_review_dismissals';

function _getAIDismissals() {
  try { var r = localStorage.getItem(_AI_DISMISS_KEY); return r ? JSON.parse(r) : []; } catch(e) { return []; }
}
function _dismissAIFinding(pid, key) {
  var all = _getAIDismissals();
  all.push({ patientId: pid, key: key, date: new Date().toISOString(), by: getSessionUser() ? getSessionUser().id : '' });
  localStorage.setItem(_AI_DISMISS_KEY, JSON.stringify(all));
}
function _isAIDismissed(pid, key) { return _getAIDismissals().some(function(d) { return d.patientId === pid && d.key === key; }); }
function _undismissAI(pid, key) {
  var all = _getAIDismissals().filter(function(d) { return !(d.patientId === pid && d.key === key); });
  localStorage.setItem(_AI_DISMISS_KEY, JSON.stringify(all));
}

/* ============================================================
   6. VIEW -- renderAIReview (standalone dashboard)
   ============================================================ */

function renderAIReview() {
  var app = document.getElementById('app');
  app.innerHTML = '';
  setTopbar({ title: 'AI Chart Review', meta: 'Clinical Decision Support', actions: '' });
  if (typeof setActiveNav === 'function') setActiveNav('ai-review');

  var _selPid = null, _fCat = '', _fSev = '', _showDismissed = false, _search = '';

  function _render() {
    app.innerHTML = '';

    var patients = getPatients();
    var user = getSessionUser();
    var panel = patients.filter(function(p) { return p.panelProviders && p.panelProviders.indexOf(user.id) >= 0; });
    if (panel.length === 0) panel = patients;

    var stats = { critical: 0, high: 0, warning: 0, info: 0, pwf: 0, total: panel.length };
    panel.forEach(function(p) {
      var f = runFullAIReview(p.id).filter(function(f) { return !_isAIDismissed(p.id, f.type + ':' + f.title); });
      if (f.length > 0) stats.pwf++;
      f.forEach(function(f) { if (f.severity === 'critical') stats.critical++; else if (f.severity === 'high') stats.high++; else if (f.severity === 'warning' || f.severity === 'moderate') stats.warning++; else stats.info++; });
    });

    var statsRow = document.createElement('div');
    statsRow.className = 'ai-review-stats-row';
    statsRow.innerHTML =
      '<div class="ai-stat-card ai-stat-critical"><div class="ai-stat-value">' + stats.critical + '</div><div class="ai-stat-label">Critical</div></div>' +
      '<div class="ai-stat-card ai-stat-high"><div class="ai-stat-value">' + stats.high + '</div><div class="ai-stat-label">High Priority</div></div>' +
      '<div class="ai-stat-card ai-stat-warning"><div class="ai-stat-value">' + stats.warning + '</div><div class="ai-stat-label">Warnings</div></div>' +
      '<div class="ai-stat-card ai-stat-info"><div class="ai-stat-value">' + stats.info + '</div><div class="ai-stat-label">Informational</div></div>' +
      '<div class="ai-stat-card ai-stat-patients"><div class="ai-stat-value">' + stats.pwf + '/' + stats.total + '</div><div class="ai-stat-label">Patients w/ Findings</div></div>';
    app.appendChild(statsRow);

    var tb = document.createElement('div');
    tb.className = 'ai-review-toolbar';
    tb.innerHTML =
      '<input type="text" class="form-control ai-review-search" id="ai-search" placeholder="Search patients or findings..." value="' + esc(_search) + '">' +
      '<select class="form-control ai-review-filter" id="ai-cat-filter"><option value="">All Categories</option><option value="Chart Completeness">Chart Completeness</option><option value="Drug Interactions">Drug Interactions</option><option value="Medication Monitoring">Medication Monitoring</option><option value="Clinical Decision Support">CDS Alerts</option><option value="Documentation Quality">Doc Quality</option><option value="Risk Stratification">Risk Stratification</option><option value="Patient Education">Education</option></select>' +
      '<select class="form-control ai-review-filter" id="ai-sev-filter"><option value="">All Severities</option><option value="critical">Critical</option><option value="high">High</option><option value="warning">Warning</option><option value="info">Info</option></select>' +
      '<label class="ai-review-toggle-label"><input type="checkbox" id="ai-show-dismissed" ' + (_showDismissed ? 'checked' : '') + '> Show Dismissed</label>';
    app.appendChild(tb);

    if (_selPid) _renderPatientDetail(app, _selPid, panel);
    else _renderPanelTable(app, panel);

    var s = document.getElementById('ai-search'); if (s) s.addEventListener('input', function() { _search = this.value; _render(); });
    var c = document.getElementById('ai-cat-filter'); if (c) { c.value = _fCat; c.addEventListener('change', function() { _fCat = this.value; _render(); }); }
    var sv = document.getElementById('ai-sev-filter'); if (sv) { sv.value = _fSev; sv.addEventListener('change', function() { _fSev = this.value; _render(); }); }
    var dm = document.getElementById('ai-show-dismissed'); if (dm) dm.addEventListener('change', function() { _showDismissed = this.checked; _render(); });
  }

  function _renderPanelTable(container, panelPts) {
    var rows = [];
    panelPts.forEach(function(p) {
      var findings = runFullAIReview(p.id);
      var active = findings.filter(function(f) { return !_isAIDismissed(p.id, f.type + ':' + f.title); });
      if (_fCat) active = active.filter(function(f) { return f.category === _fCat; });
      if (_fSev) active = active.filter(function(f) { return f.severity === _fSev; });
      if (active.length === 0 && !_showDismissed) return;
      if (_search) { var t = _search.toLowerCase(); var nm = ((p.firstName||'') + ' ' + (p.lastName||'') + ' ' + (p.mrn||'')).toLowerCase(); var fm = active.some(function(f) { return (f.title + ' ' + f.description).toLowerCase().indexOf(t) >= 0; }); if (nm.indexOf(t) < 0 && !fm) return; }
      var cc = active.filter(function(f) { return f.severity === 'critical'; }).length;
      var hc = active.filter(function(f) { return f.severity === 'high'; }).length;
      var wc = active.filter(function(f) { return f.severity === 'warning' || f.severity === 'moderate'; }).length;
      rows.push({ patient: p, findings: active, cc: cc, hc: hc, wc: wc, total: active.length, top: active.length > 0 ? active[0] : null });
    });
    rows.sort(function(a, b) { if (b.cc !== a.cc) return b.cc - a.cc; if (b.hc !== a.hc) return b.hc - a.hc; return b.total - a.total; });

    if (rows.length === 0) {
      var empty = document.createElement('div'); empty.className = 'ai-empty-state';
      empty.innerHTML = '<div class="ai-empty-icon">&#10003;</div><h3>No Active Findings</h3><p>All patients up to date or no matches.</p>';
      container.appendChild(empty); return;
    }

    var card = document.createElement('div'); card.className = 'card';
    var wrap = document.createElement('div'); wrap.className = 'table-wrap';
    var table = document.createElement('table'); table.className = 'table ai-review-table';
    table.innerHTML = '<thead><tr><th>Patient</th><th>Critical</th><th>High</th><th>Warnings</th><th>Top Finding</th><th>Total</th><th></th></tr></thead>';
    var tbody = document.createElement('tbody');
    rows.forEach(function(r) {
      var tr = document.createElement('tr'); tr.className = 'ai-review-row'; tr.style.cursor = 'pointer';
      tr.innerHTML = '<td><strong>' + esc(r.patient.lastName + ', ' + r.patient.firstName) + '</strong><br><small class="text-muted">' + esc(r.patient.mrn || '') + '</small></td>' +
        '<td><span class="ai-badge ' + (r.cc > 0 ? 'ai-badge-critical' : 'ai-badge-none') + '">' + r.cc + '</span></td>' +
        '<td><span class="ai-badge ' + (r.hc > 0 ? 'ai-badge-high' : 'ai-badge-none') + '">' + r.hc + '</span></td>' +
        '<td><span class="ai-badge ' + (r.wc > 0 ? 'ai-badge-warning' : 'ai-badge-none') + '">' + r.wc + '</span></td>' +
        '<td class="ai-top-finding">' + (r.top ? esc(r.top.title) : '-') + '</td>' +
        '<td><strong>' + r.total + '</strong></td><td></td>';
      var btn = document.createElement('button'); btn.className = 'btn btn-primary btn-sm'; btn.textContent = 'Review';
      btn.addEventListener('click', function(e) { e.stopPropagation(); _selPid = r.patient.id; _render(); });
      tr.querySelector('td:last-child').appendChild(btn);
      tr.addEventListener('click', function() { _selPid = r.patient.id; _render(); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrap.appendChild(table); card.appendChild(wrap); container.appendChild(card);
  }

  function _renderPatientDetail(container, pid) {
    var patient = getPatient(pid);
    if (!patient) return;

    var backBar = document.createElement('div'); backBar.className = 'ai-back-bar';
    var backBtn = document.createElement('button'); backBtn.className = 'btn btn-secondary btn-sm'; backBtn.textContent = '< Back to Panel';
    backBtn.addEventListener('click', function() { _selPid = null; _render(); });
    backBar.appendChild(backBtn);
    var chartLink = document.createElement('a'); chartLink.className = 'btn btn-ghost btn-sm'; chartLink.href = '#chart/' + pid; chartLink.textContent = 'Open Chart';
    backBar.appendChild(chartLink);
    container.appendChild(backBar);

    var hdr = document.createElement('div'); hdr.className = 'ai-patient-header';
    var age = _aiGetAge(patient);
    hdr.innerHTML = '<h2>' + esc(patient.lastName + ', ' + patient.firstName) + '</h2><span class="ai-patient-meta">' + esc(patient.mrn || '') + ' | ' + (age !== null ? age + 'y' : 'Age ?') + ' | ' + esc(patient.sex || '?') + '</span>';
    container.appendChild(hdr);

    var findings = runFullAIReview(pid);
    var active = findings.filter(function(f) {
      var key = f.type + ':' + f.title;
      if (!_showDismissed && _isAIDismissed(pid, key)) return false;
      if (_fCat && f.category !== _fCat) return false;
      if (_fSev && f.severity !== _fSev) return false;
      if (_search) { var t = _search.toLowerCase(); if ((f.title + ' ' + f.description + ' ' + f.category).toLowerCase().indexOf(t) < 0) return false; }
      return true;
    });

    if (active.length === 0) {
      var empty = document.createElement('div'); empty.className = 'ai-empty-state';
      empty.innerHTML = '<div class="ai-empty-icon">&#10003;</div><h3>No Active Findings</h3><p>All findings addressed or dismissed.</p>';
      container.appendChild(empty); return;
    }

    var cats = {};
    active.forEach(function(f) { if (!cats[f.category]) cats[f.category] = []; cats[f.category].push(f); });
    var catOrder = ['Drug Interactions', 'Clinical Decision Support', 'Medication Monitoring', 'Chart Completeness', 'Documentation Quality', 'Risk Stratification', 'Patient Education'];

    catOrder.forEach(function(catName) {
      if (!cats[catName]) return;
      var catF = cats[catName];
      var section = document.createElement('div'); section.className = 'ai-category-section';
      var catHdr = document.createElement('div'); catHdr.className = 'ai-category-header';
      catHdr.innerHTML = '<h3>' + esc(catName) + '</h3><span class="ai-category-count">' + catF.length + ' finding' + (catF.length > 1 ? 's' : '') + '</span>';
      section.appendChild(catHdr);

      catF.forEach(function(finding) {
        var fKey = finding.type + ':' + finding.title;
        var isDismissed = _isAIDismissed(pid, fKey);
        var fCard = document.createElement('div');
        fCard.className = 'ai-finding-card ai-severity-' + finding.severity + (isDismissed ? ' ai-dismissed' : '');
        var sevLabel = finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1);
        var sevIcon = finding.severity === 'critical' ? '!!' : finding.severity === 'high' ? '!' : finding.severity === 'warning' ? '?' : finding.severity === 'moderate' ? '~' : finding.severity === 'success' ? '>' : 'i';
        fCard.innerHTML =
          '<div class="ai-finding-header"><span class="ai-severity-badge ai-sev-' + finding.severity + '">' + sevIcon + ' ' + sevLabel + '</span><span class="ai-finding-type">' + esc(finding.category) + '</span></div>' +
          '<h4 class="ai-finding-title">' + esc(finding.title) + '</h4>' +
          '<p class="ai-finding-desc">' + esc(finding.description) + '</p>' +
          '<div class="ai-finding-action"><strong>Recommended:</strong> ' + esc(finding.action) + '</div>';

        if (finding.type === 'doc_score' && finding.details) {
          var sb = document.createElement('div'); sb.className = 'ai-score-details';
          finding.details.forEach(function(d) {
            var pct2 = Math.round((d.points / d.max) * 100);
            var cls = d.status === 'complete' ? 'ai-bar-complete' : d.status === 'missing' ? 'ai-bar-missing' : 'ai-bar-partial';
            sb.innerHTML += '<div class="ai-score-row"><span class="ai-score-label">' + esc(d.section) + '</span><div class="ai-score-bar"><div class="ai-score-fill ' + cls + '" style="width:' + pct2 + '%"></div></div><span class="ai-score-pts">' + d.points + '/' + d.max + '</span></div>';
          });
          fCard.appendChild(sb);
        }

        if (finding.educationItems && finding.educationItems.length > 0) {
          var det = document.createElement('details'); det.className = 'ai-edu-details';
          det.innerHTML = '<summary>View All Points (' + finding.educationItems.length + ')</summary>';
          var ul = document.createElement('ul'); ul.className = 'ai-edu-list';
          finding.educationItems.forEach(function(item) { var li = document.createElement('li'); li.textContent = item; ul.appendChild(li); });
          det.appendChild(ul); fCard.appendChild(det);
        }

        var actions = document.createElement('div'); actions.className = 'ai-finding-actions';
        if (!isDismissed) {
          var db = document.createElement('button'); db.className = 'btn btn-ghost btn-sm'; db.textContent = 'Dismiss';
          db.addEventListener('click', function(e) { e.stopPropagation(); _dismissAIFinding(pid, fKey); showToast('Finding dismissed', 'success'); _render(); });
          actions.appendChild(db);
        } else {
          var ub = document.createElement('button'); ub.className = 'btn btn-ghost btn-sm'; ub.textContent = 'Restore';
          ub.addEventListener('click', function(e) { e.stopPropagation(); _undismissAI(pid, fKey); showToast('Finding restored', 'success'); _render(); });
          actions.appendChild(ub);
        }
        var cl = document.createElement('a'); cl.className = 'btn btn-secondary btn-sm'; cl.href = '#chart/' + pid; cl.textContent = 'View in Chart';
        actions.appendChild(cl);
        fCard.appendChild(actions);
        section.appendChild(fCard);
      });
      container.appendChild(section);
    });
  }

  _render();
}

/* ============================================================
   7. Chart Sub-Tab -- AI Review card in patient chart
   ============================================================ */

function buildAIReviewChartSection(patientId) {
  var container = document.createElement('div');
  container.className = 'ai-review-chart-section';
  container.id = 'section-ai-review';

  var findings = runFullAIReview(patientId);
  var active = findings.filter(function(f) { return !_isAIDismissed(patientId, f.type + ':' + f.title); });

  var critC = active.filter(function(f) { return f.severity === 'critical'; }).length;
  var highC = active.filter(function(f) { return f.severity === 'high'; }).length;
  var warnC = active.filter(function(f) { return f.severity === 'warning' || f.severity === 'moderate'; }).length;
  var infoC = active.filter(function(f) { return f.severity === 'info' || f.severity === 'success'; }).length;

  var summaryDiv = document.createElement('div');
  summaryDiv.className = 'ai-chart-summary';
  summaryDiv.innerHTML =
    '<div class="ai-chart-summary-title"><span class="ai-chart-icon">AI</span> AI Chart Review <span class="ai-chart-count">' + active.length + ' finding' + (active.length !== 1 ? 's' : '') + '</span></div>' +
    '<div class="ai-chart-badges">' +
      (critC > 0 ? '<span class="ai-mini-badge ai-mini-critical">' + critC + ' Critical</span>' : '') +
      (highC > 0 ? '<span class="ai-mini-badge ai-mini-high">' + highC + ' High</span>' : '') +
      (warnC > 0 ? '<span class="ai-mini-badge ai-mini-warning">' + warnC + ' Warning</span>' : '') +
      (infoC > 0 ? '<span class="ai-mini-badge ai-mini-info">' + infoC + ' Info</span>' : '') +
      (active.length === 0 ? '<span class="ai-mini-badge ai-mini-ok">All Clear</span>' : '') +
    '</div>';
  container.appendChild(summaryDiv);

  var actionable = active.filter(function(f) { return f.severity === 'critical' || f.severity === 'high' || f.severity === 'warning' || f.severity === 'moderate'; });
  actionable.slice(0, 8).forEach(function(finding) {
    var fKey = finding.type + ':' + finding.title;
    var row = document.createElement('div');
    row.className = 'ai-chart-finding ai-severity-' + finding.severity;
    var sevIcon = finding.severity === 'critical' ? '!!' : finding.severity === 'high' ? '!' : '?';
    row.innerHTML =
      '<div class="ai-chart-finding-header"><span class="ai-sev-dot ai-sev-dot-' + finding.severity + '">' + sevIcon + '</span><span class="ai-chart-finding-title">' + esc(finding.title) + '</span></div>' +
      '<p class="ai-chart-finding-desc">' + esc(finding.description.length > 150 ? finding.description.slice(0, 150) + '...' : finding.description) + '</p>';
    var db = document.createElement('button'); db.className = 'btn btn-ghost btn-sm'; db.textContent = 'Dismiss'; db.style.cssText = 'margin-top:4px;font-size:11px;';
    db.addEventListener('click', function() {
      _dismissAIFinding(patientId, fKey); showToast('Finding dismissed', 'success');
      var par = container.parentElement;
      if (par) { var ns = buildAIReviewChartSection(patientId); par.replaceChild(ns, container); }
    });
    row.appendChild(db);
    container.appendChild(row);
  });
  if (actionable.length > 8) {
    var more = document.createElement('div'); more.className = 'ai-chart-more'; more.textContent = '+ ' + (actionable.length - 8) + ' more findings';
    container.appendChild(more);
  }

  var fullLink = document.createElement('div'); fullLink.className = 'ai-chart-full-link';
  var linkBtn = document.createElement('a'); linkBtn.className = 'btn btn-secondary btn-sm'; linkBtn.href = '#ai-review'; linkBtn.textContent = 'Open Full AI Review Dashboard';
  fullLink.appendChild(linkBtn);
  container.appendChild(fullLink);

  return container;
}
