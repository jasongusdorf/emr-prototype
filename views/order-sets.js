/* ============================================================
   views/order-sets.js — Pre-built order bundles
   Standalone page + integration with orders page
   ============================================================ */

/* ---------- Built-in Order Sets (extended) ---------- */
var BUILT_IN_ORDER_SETS = [
  {
    id: 'os-admission', name: 'Admission Order Set', category: 'Admission',
    description: 'Standard admission orders including diet, activity, vitals, VTE prophylaxis, IV fluids, and basic labs.',
    items: [
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '1000', unit: 'mL', route: 'IV', frequency: 'Q8h', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Enoxaparin', dose: '40', unit: 'mg', route: 'SQ', frequency: 'QDay', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Comprehensive Metabolic Panel', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Urinalysis', tests: [] }, priority: 'Routine' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Admission baseline' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-chest-pain', name: 'Chest Pain Protocol', category: 'Protocol',
    description: 'Troponin q6h, ECG, chest X-ray, aspirin, heparin, cardiology consult.',
    items: [
      { type: 'Lab', detail: { panel: 'Troponin', tests: [{ name: 'Troponin I', frequency: 'Q6h x3' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Imaging', detail: { study: 'ECG (12-lead)', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Chest pain evaluation' }, priority: 'STAT' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Chest pain' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Aspirin', dose: '325', unit: 'mg', route: 'PO', frequency: 'Once', duration: '' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Heparin', dose: '60', unit: 'units', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Heparin Drip', dose: '12', unit: 'units', route: 'IV', frequency: 'Q1h', duration: 'Ongoing' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Nitroglycerin', dose: '0.4', unit: 'mg', route: 'SL', frequency: 'PRN', duration: '' }, priority: 'Urgent' },
      { type: 'Consult', detail: { service: 'Cardiology', reason: 'Acute chest pain evaluation', urgency: 'Urgent' }, priority: 'Urgent' },
    ]
  },
  {
    id: 'os-dka', name: 'DKA Bundle', category: 'Protocol',
    description: 'Insulin drip, BMP q2h, fluid resuscitation, potassium monitoring.',
    items: [
      { type: 'Medication', detail: { drug: 'Insulin Regular Drip', dose: '0.1', unit: 'units/kg/hr', route: 'IV', frequency: 'Continuous', duration: 'Ongoing' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '1000', unit: 'mL', route: 'IV', frequency: 'Once', duration: 'Over 1 hour' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '500', unit: 'mL', route: 'IV', frequency: 'Q2h', duration: 'Per protocol' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Potassium Chloride', dose: '20', unit: 'mEq', route: 'IV', frequency: 'PRN', duration: 'Per K+ level' }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [{ name: 'BMP', frequency: 'Q2h' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Arterial Blood Gas', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Urinalysis', tests: [] }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-sepsis', name: 'Sepsis Bundle', category: 'Protocol',
    description: 'Blood cultures, lactate, broad-spectrum antibiotics, fluid bolus, vasopressors.',
    items: [
      { type: 'Lab', detail: { panel: 'Blood Culture', tests: [{ name: 'Blood Culture x2' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Lactic Acid', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Comprehensive Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Vancomycin', dose: '25', unit: 'mg/kg', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Piperacillin-Tazobactam', dose: '4.5', unit: 'g', route: 'IV', frequency: 'Q6h', duration: '7 days' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '30', unit: 'mL/kg', route: 'IV', frequency: 'Once', duration: 'Over 3 hours' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Norepinephrine', dose: '0.1', unit: 'mcg/kg/min', route: 'IV', frequency: 'Continuous', duration: 'PRN MAP <65' }, priority: 'STAT' },
    ]
  },
  {
    id: 'os-postop', name: 'Post-Op Order Set', category: 'Specialty',
    description: 'Pain management, DVT prophylaxis, diet advancement, wound care.',
    items: [
      { type: 'Medication', detail: { drug: 'Acetaminophen', dose: '1000', unit: 'mg', route: 'PO', frequency: 'Q6h', duration: '5 days' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Ketorolac', dose: '15', unit: 'mg', route: 'IV', frequency: 'Q6h', duration: '48 hours max' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Ondansetron', dose: '4', unit: 'mg', route: 'IV', frequency: 'Q8h PRN', duration: '3 days' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Enoxaparin', dose: '40', unit: 'mg', route: 'SQ', frequency: 'QDay', duration: 'Until ambulating' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Docusate Sodium', dose: '100', unit: 'mg', route: 'PO', frequency: 'BID', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-chf-admission', name: 'CHF Admission', category: 'Specialty',
    description: 'Diuretics, ACE inhibitor, BNP, daily weights, fluid restriction.',
    items: [
      { type: 'Medication', detail: { drug: 'Furosemide', dose: '40', unit: 'mg', route: 'IV', frequency: 'BID', duration: 'Ongoing' }, priority: 'Urgent' },
      { type: 'Medication', detail: { drug: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Carvedilol', dose: '6.25', unit: 'mg', route: 'PO', frequency: 'BID', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'B-type Natriuretic Peptide', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'CHF evaluation' }, priority: 'Routine' },
      { type: 'Consult', detail: { service: 'Cardiology', reason: 'CHF exacerbation management', urgency: 'Routine' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-stroke', name: 'Stroke Protocol', category: 'Protocol',
    description: 'CT head, CTA, basic labs, coagulation panel, neurology consult.',
    items: [
      { type: 'Imaging', detail: { study: 'CT Head without Contrast', modality: 'CT', bodyPart: 'Head', indication: 'Acute stroke evaluation' }, priority: 'STAT' },
      { type: 'Imaging', detail: { study: 'CT Angiography Head/Neck', modality: 'CT', bodyPart: 'Head/Neck', indication: 'Stroke — vessel evaluation' }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Troponin', tests: [] }, priority: 'STAT' },
      { type: 'Consult', detail: { service: 'Neurology', reason: 'Acute stroke evaluation', urgency: 'STAT' }, priority: 'STAT' },
      { type: 'Consult', detail: { service: 'Speech-Language Pathology', reason: 'Dysphagia screening — acute stroke per AHA guidelines', urgency: 'STAT' }, priority: 'STAT' },
    ]
  },
  {
    id: 'os-pneumonia', name: 'Pneumonia', category: 'Specialty',
    description: 'Antibiotics, blood cultures, chest X-ray, respiratory panel.',
    items: [
      { type: 'Medication', detail: { drug: 'Ceftriaxone', dose: '1', unit: 'g', route: 'IV', frequency: 'QDay', duration: '7 days' }, priority: 'Urgent' },
      { type: 'Medication', detail: { drug: 'Azithromycin', dose: '500', unit: 'mg', route: 'IV', frequency: 'QDay', duration: '5 days' }, priority: 'Urgent' },
      { type: 'Lab', detail: { panel: 'Blood Culture', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Community-acquired pneumonia' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-preop-surgical', name: 'Pre-Op Surgical', category: 'Surgical',
    description: 'Standard pre-operative surgical orders: NPO, IV fluids, labs, prophylactic antibiotics, SCDs, EKG.',
    items: [
      { type: 'Diet', detail: { dietType: 'NPO', fluidRestriction: '', instructions: 'NPO after midnight' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '125', unit: 'mL/hr', route: 'IV', frequency: 'Continuous', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Type and Screen', tests: [] }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Cefazolin', dose: '2', unit: 'g', route: 'IV', frequency: 'Once', duration: '' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'SCDs (Sequential Compression Devices)', frequency: 'Continuous', instructions: 'Apply bilateral lower extremity SCDs' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'EKG (12-lead)', frequency: 'Once', instructions: 'Pre-operative baseline EKG' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-labor-admission', name: 'Labor Admission', category: 'OB/GYN',
    description: 'Labor admission orders: IV fluids, labs, fetal monitoring, epidural consult.',
    items: [
      { type: 'Medication', detail: { drug: 'Lactated Ringers', dose: '125', unit: 'mL/hr', route: 'IV', frequency: 'Continuous', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Type and Screen', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Urinalysis', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'GBS Culture', tests: [] }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Continuous fetal monitoring', frequency: 'Continuous', instructions: 'Continuous electronic fetal heart rate and uterine activity monitoring' }, priority: 'Routine' },
      { type: 'Consult', detail: { service: 'Anesthesiology', reason: 'Epidural consult for labor analgesia', urgency: 'Routine' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-postpartum-vaginal', name: 'Postpartum Vaginal', category: 'OB/GYN',
    description: 'Postpartum vaginal delivery orders: oxytocin, pain management, stool softener, lactation consult.',
    items: [
      { type: 'Medication', detail: { drug: 'Oxytocin', dose: '20', unit: 'units', route: 'IV', frequency: 'Continuous', duration: 'In LR 1L' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Ibuprofen', dose: '600', unit: 'mg', route: 'PO', frequency: 'Q6h', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Acetaminophen', dose: '1000', unit: 'mg', route: 'PO', frequency: 'Q6h', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Docusate', dose: '100', unit: 'mg', route: 'PO', frequency: 'BID', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Consult', detail: { service: 'Lactation Consultant', reason: 'Breastfeeding support and education', urgency: 'Routine' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-preop-cesarean', name: 'Pre-Op Cesarean', category: 'OB/GYN',
    description: 'Pre-operative cesarean section orders: NPO, IV bolus, labs, antibiotics, SCDs, Foley.',
    items: [
      { type: 'Diet', detail: { dietType: 'NPO', fluidRestriction: '', instructions: 'NPO for cesarean section' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Lactated Ringers', dose: '1000', unit: 'mL', route: 'IV', frequency: 'Once', duration: 'Bolus' }, priority: 'Urgent' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Type and Screen', tests: [] }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Cefazolin', dose: '2', unit: 'g', route: 'IV', frequency: 'Once', duration: '' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'SCDs (Sequential Compression Devices)', frequency: 'Continuous', instructions: 'Apply bilateral lower extremity SCDs pre-operatively' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Foley catheter insertion', frequency: 'Once', instructions: 'Insert Foley catheter prior to cesarean section' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-preeclampsia', name: 'Preeclampsia Severe', category: 'OB/GYN',
    description: 'Severe preeclampsia management: magnesium sulfate, antihypertensives, frequent labs, fetal monitoring.',
    items: [
      { type: 'Medication', detail: { drug: 'Magnesium Sulfate', dose: '4', unit: 'g', route: 'IV', frequency: 'Once', duration: 'Load then 2g/hr maintenance' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Labetalol', dose: '20', unit: 'mg', route: 'IV', frequency: 'PRN', duration: 'PRN SBP >160' }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [{ name: 'CBC', frequency: 'Q6h' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Comprehensive Metabolic Panel', tests: [{ name: 'CMP', frequency: 'Q6h' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'LDH', tests: [] }, priority: 'STAT' },
      { type: 'Nursing', detail: { intervention: 'Continuous fetal monitoring', frequency: 'Continuous', instructions: 'Continuous electronic fetal heart rate and uterine activity monitoring' }, priority: 'STAT' },
    ]
  },
  {
    id: 'os-preterm-labor', name: 'Preterm Labor', category: 'OB/GYN',
    description: 'Preterm labor management: betamethasone, tocolytics, GBS culture, fetal monitoring, MFM consult.',
    items: [
      { type: 'Medication', detail: { drug: 'Betamethasone', dose: '12', unit: 'mg', route: 'IM', frequency: 'Once', duration: 'x2 doses 24hr apart' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Nifedipine', dose: '20', unit: 'mg', route: 'PO', frequency: 'Once', duration: 'Then 10mg Q6H' }, priority: 'Urgent' },
      { type: 'Lab', detail: { panel: 'GBS Culture', tests: [] }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Continuous fetal monitoring', frequency: 'Continuous', instructions: 'Continuous electronic fetal heart rate and uterine activity monitoring' }, priority: 'Urgent' },
      { type: 'Consult', detail: { service: 'MFM (Maternal-Fetal Medicine)', reason: 'Preterm labor management and consultation', urgency: 'Urgent' }, priority: 'Urgent' },
    ]
  },
  {
    id: 'os-dialysis-hd', name: 'Dialysis HD', category: 'Nephrology',
    description: 'Hemodialysis orders: pre/post labs, heparin protocol, phosphate binder.',
    items: [
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [{ name: 'Pre-dialysis BMP' }] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [{ name: 'Pre-dialysis CBC' }] }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Heparin', dose: 'per protocol', unit: 'units', route: 'IV', frequency: 'Per protocol', duration: 'During dialysis' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [{ name: 'Post-dialysis BMP' }] }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Sevelamer (Phosphate Binder)', dose: '800', unit: 'mg', route: 'PO', frequency: 'TID', duration: 'With meals' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-enhanced-chf', name: 'Enhanced CHF', category: 'Cardiology',
    description: 'Enhanced CHF management: daily weights, strict I&O, fluid restriction, echo, BNP, continuous SpO2.',
    items: [
      { type: 'Nursing', detail: { intervention: 'Daily weights', frequency: 'QDay', instructions: 'Weigh patient every morning before breakfast' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Strict I&O', frequency: 'Continuous', instructions: 'Record all intake and output strictly' }, priority: 'Routine' },
      { type: 'Diet', detail: { dietType: 'Low Sodium', fluidRestriction: '1500', instructions: 'Fluid restriction 1.5L/day' }, priority: 'Routine' },
      { type: 'Imaging', detail: { study: 'Echocardiogram', modality: 'Ultrasound', bodyPart: 'Heart', indication: 'CHF evaluation' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'B-type Natriuretic Peptide', tests: [] }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Continuous SpO2 monitoring', frequency: 'Continuous', instructions: 'Continuous pulse oximetry monitoring' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-acs-protocol', name: 'ACS Protocol', category: 'Cardiology',
    description: 'Acute coronary syndrome protocol: serial troponins, BNP, echo, dual antiplatelet, statin, heparin drip.',
    items: [
      { type: 'Lab', detail: { panel: 'Troponin', tests: [{ name: 'Troponin I', frequency: 'Q3h x3' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'B-type Natriuretic Peptide', tests: [] }, priority: 'STAT' },
      { type: 'Imaging', detail: { study: 'Echocardiogram', modality: 'Ultrasound', bodyPart: 'Heart', indication: 'ACS - assess cardiac function' }, priority: 'Urgent' },
      { type: 'Medication', detail: { drug: 'Clopidogrel', dose: '300', unit: 'mg', route: 'PO', frequency: 'Once', duration: 'Loading dose' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Atorvastatin', dose: '80', unit: 'mg', route: 'PO', frequency: 'QDay', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Heparin Drip', dose: 'per protocol', unit: 'units', route: 'IV', frequency: 'Continuous', duration: 'Per protocol' }, priority: 'STAT' },
    ]
  },
  {
    id: 'os-pt-hip', name: 'PT Post-Hip Replacement', category: 'Rehabilitation',
    description: 'Post-hip replacement rehabilitation: PT consult, assisted ambulation, DVT prophylaxis, pain management, hip precaution education.',
    items: [
      { type: 'Consult', detail: { service: 'Physical Therapy', reason: 'Post-hip replacement rehabilitation', urgency: 'Routine', rehabFrequency: 'Daily' }, priority: 'Routine' },
      { type: 'Activity', detail: { level: 'Ambulate-assist', restrictions: 'Walker required', weightBearing: 'As Tolerated' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Enoxaparin', dose: '40', unit: 'mg', route: 'SQ', frequency: 'QDay', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Acetaminophen', dose: '1000', unit: 'mg', route: 'PO', frequency: 'Q6h', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Hip precaution education', frequency: 'Once', instructions: 'Educate patient on hip precautions: no flexion >90°, no internal rotation, no adduction past midline' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Ice to surgical site Q4H', frequency: 'Q4h', instructions: 'Apply ice pack to surgical site for 20 minutes every 4 hours' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-slp-dysphagia', name: 'SLP Dysphagia Workup', category: 'Rehabilitation',
    description: 'Dysphagia workup: SLP consult STAT, NPO pending evaluation, IV fluids, aspiration precautions, HOB elevation.',
    items: [
      { type: 'Consult', detail: { service: 'Speech-Language Pathology', reason: 'Dysphagia evaluation — swallow assessment needed', urgency: 'STAT' }, priority: 'STAT' },
      { type: 'Diet', detail: { dietType: 'NPO', fluidRestriction: '', instructions: 'NPO until SLP evaluation complete' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '125', unit: 'mL/hr', route: 'IV', frequency: 'Continuous', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Aspiration precautions', frequency: 'Continuous', instructions: 'Maintain aspiration precautions: HOB ≥30°, suction at bedside, supervise all PO intake' }, priority: 'STAT' },
      { type: 'Nursing', detail: { intervention: 'HOB ≥30°', frequency: 'Continuous', instructions: 'Keep head of bed elevated ≥30 degrees at all times' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-stroke-rehab', name: 'Stroke Rehab Bundle', category: 'Rehabilitation',
    description: 'Comprehensive stroke rehabilitation: PT, OT, SLP consults, neuro checks, DVT prophylaxis, activity, swallow eval.',
    items: [
      { type: 'Consult', detail: { service: 'Physical Therapy', reason: 'Stroke rehabilitation — mobility and gait assessment', urgency: 'Routine' }, priority: 'Routine' },
      { type: 'Consult', detail: { service: 'Occupational Therapy', reason: 'Stroke rehabilitation — ADL and functional assessment', urgency: 'Routine' }, priority: 'Routine' },
      { type: 'Consult', detail: { service: 'Speech-Language Pathology', reason: 'Stroke rehabilitation — speech, language, and swallowing assessment', urgency: 'Routine' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Neuro checks q4h', frequency: 'Q4h', instructions: 'Perform neurological checks every 4 hours: GCS, pupil response, motor strength, NIHSS' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'DVT prophylaxis - SCDs', frequency: 'Continuous', instructions: 'Apply bilateral sequential compression devices (SCDs) when in bed' }, priority: 'Routine' },
      { type: 'Activity', detail: { level: 'Ambulate-assist', restrictions: 'Requires assistance', weightBearing: 'As Tolerated' }, priority: 'Routine' },
      { type: 'Nursing', detail: { intervention: 'Swallow eval before PO intake', frequency: 'Once', instructions: 'Patient must pass bedside swallow evaluation before any oral intake' }, priority: 'Routine' },
    ]
  },
];

/* ---------- Get all order sets (built-in + custom) ---------- */
function getOrderSets() {
  var custom = loadAll(KEYS.orderSets);
  return BUILT_IN_ORDER_SETS.concat(custom);
}

function getOrderSet(id) {
  return getOrderSets().find(function(s) { return s.id === id; }) || null;
}

function saveCustomOrderSet(data) {
  var all = loadAll(KEYS.orderSets, true);
  var idx = all.findIndex(function(s) { return s.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    var rec = {
      id: generateId(),
      name: '',
      category: 'Custom',
      description: '',
      items: [],
      createdBy: (getSessionUser() || {}).id || '',
      createdAt: new Date().toISOString(),
    };
    Object.assign(rec, data);
    all.push(rec);
  }
  saveAll(KEYS.orderSets, all);
}

function deleteCustomOrderSet(id) {
  softDeleteRecord(KEYS.orderSets, id);
}

/* ---------- Place all orders from a set ---------- */
function placeOrderSet(orderSetId, encounterId, patientId, selectedIndices) {
  var set = getOrderSet(orderSetId);
  if (!set) return 0;
  var user = getSessionUser();
  var orderedBy = (user || {}).id || '';
  var placed = 0;

  set.items.forEach(function(item, idx) {
    if (selectedIndices && selectedIndices.indexOf(idx) < 0) return;
    saveOrder({
      encounterId: encounterId,
      patientId: patientId,
      orderedBy: orderedBy,
      type: item.type,
      priority: item.priority,
      status: 'Pending',
      detail: Object.assign({}, item.detail),
      notes: 'From order set: ' + set.name,
      dateTime: new Date().toISOString(),
    });
    placed++;
  });

  return placed;
}

/* ---------- Render Order Sets page ---------- */
function renderOrderSets() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Order Sets', meta: 'Pre-built order bundles', actions: '' });
  setActiveNav('order-sets');

  var container = document.createElement('div');
  container.style.padding = '24px';
  container.style.maxWidth = '1100px';
  container.style.margin = '0 auto';

  // Search / filter bar
  var filterBar = document.createElement('div');
  filterBar.className = 'os-filter-bar';
  filterBar.innerHTML = '<input type="text" id="os-search" class="os-search-input" placeholder="Search order sets..." autocomplete="off" />' +
    '<div class="os-category-filters">' +
    '<button class="os-cat-btn active" data-cat="all">All</button>' +
    '<button class="os-cat-btn" data-cat="Admission">Admission</button>' +
    '<button class="os-cat-btn" data-cat="Protocol">Protocol</button>' +
    '<button class="os-cat-btn" data-cat="Specialty">Specialty</button>' +
    '<button class="os-cat-btn" data-cat="OB/GYN">OB/GYN</button>' +
    '<button class="os-cat-btn" data-cat="Surgical">Surgical</button>' +
    '<button class="os-cat-btn" data-cat="Cardiology">Cardiology</button>' +
    '<button class="os-cat-btn" data-cat="Nephrology">Nephrology</button>' +
    '<button class="os-cat-btn" data-cat="Rehabilitation">Rehabilitation</button>' +
    '<button class="os-cat-btn" data-cat="Custom">Custom</button>' +
    '</div>';
  container.appendChild(filterBar);

  // Grid
  var grid = document.createElement('div');
  grid.id = 'os-grid';
  grid.className = 'os-grid';
  container.appendChild(grid);

  app.appendChild(container);

  // Render cards
  var allSets = getOrderSets();
  var currentFilter = 'all';
  var searchTerm = '';

  function renderGrid() {
    grid.innerHTML = '';
    var filtered = allSets.filter(function(s) {
      if (currentFilter !== 'all' && s.category !== currentFilter) return false;
      if (searchTerm) {
        var q = searchTerm.toLowerCase();
        return s.name.toLowerCase().indexOf(q) >= 0 ||
               s.description.toLowerCase().indexOf(q) >= 0 ||
               s.category.toLowerCase().indexOf(q) >= 0;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.appendChild(buildEmptyState('', 'No order sets found', 'Try a different search or category.'));
      return;
    }

    filtered.forEach(function(set) {
      var card = document.createElement('div');
      card.className = 'os-card';
      card.setAttribute('data-set-id', set.id);

      var catBadgeClass = 'os-cat-badge os-cat-' + set.category.toLowerCase();
      var medCount = set.items.filter(function(i) { return i.type === 'Medication'; }).length;
      var labCount = set.items.filter(function(i) { return i.type === 'Lab'; }).length;
      var imgCount = set.items.filter(function(i) { return i.type === 'Imaging'; }).length;
      var conCount = set.items.filter(function(i) { return i.type === 'Consult'; }).length;
      var dietCount = set.items.filter(function(i) { return i.type === 'Diet'; }).length;
      var nsgCount = set.items.filter(function(i) { return i.type === 'Nursing'; }).length;
      var actCount = set.items.filter(function(i) { return i.type === 'Activity'; }).length;

      card.innerHTML = '<div class="os-card-header">' +
        '<h3 class="os-card-title">' + esc(set.name) + '</h3>' +
        '<span class="' + catBadgeClass + '">' + esc(set.category) + '</span>' +
        '</div>' +
        '<p class="os-card-desc">' + esc(set.description) + '</p>' +
        '<div class="os-card-counts">' +
        (medCount ? '<span class="os-count-badge os-count-med">' + medCount + ' Meds</span>' : '') +
        (labCount ? '<span class="os-count-badge os-count-lab">' + labCount + ' Labs</span>' : '') +
        (imgCount ? '<span class="os-count-badge os-count-img">' + imgCount + ' Imaging</span>' : '') +
        (conCount ? '<span class="os-count-badge os-count-con">' + conCount + ' Consults</span>' : '') +
        (dietCount ? '<span class="os-count-badge os-count-diet">' + dietCount + ' Diet</span>' : '') +
        (nsgCount ? '<span class="os-count-badge os-count-nsg">' + nsgCount + ' Nursing</span>' : '') +
        (actCount ? '<span class="os-count-badge os-count-act">' + actCount + ' Activity</span>' : '') +
        '</div>' +
        '<div class="os-card-footer">' +
        '<span class="os-item-total">' + set.items.length + ' orders total</span>' +
        '<button class="btn btn-primary btn-sm os-preview-btn">Preview &amp; Place</button>' +
        '</div>';

      card.querySelector('.os-preview-btn').addEventListener('click', function() {
        openOrderSetPreview(set);
      });

      grid.appendChild(card);
    });
  }

  renderGrid();

  // Search
  document.getElementById('os-search').addEventListener('input', function(e) {
    searchTerm = e.target.value;
    renderGrid();
  });

  // Category filters
  document.querySelectorAll('.os-cat-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.os-cat-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderGrid();
    });
  });
}

/* ---------- Preview modal ---------- */
function openOrderSetPreview(set) {
  var bodyHTML = '<div class="os-preview">';
  bodyHTML += '<p class="os-preview-desc">' + esc(set.description) + '</p>';
  bodyHTML += '<div class="os-preview-items">';

  set.items.forEach(function(item, idx) {
    var desc = '';
    if (item.type === 'Medication') {
      desc = (item.detail.drug || 'Medication') + ' ' + (item.detail.dose || '') + (item.detail.unit || '') + ' ' + (item.detail.route || '') + ' ' + (item.detail.frequency || '');
    } else if (item.type === 'Lab') {
      desc = item.detail.panel || 'Lab';
    } else if (item.type === 'Imaging') {
      desc = (item.detail.study || item.detail.modality || '') + ' ' + (item.detail.bodyPart || '');
    } else if (item.type === 'Consult') {
      desc = 'Consult: ' + (item.detail.service || '');
    } else if (item.type === 'Diet') {
      desc = (item.detail.dietType || 'Diet') + (item.detail.fluidRestriction ? ' (Fluid restrict: ' + item.detail.fluidRestriction + ' mL)' : '') + (item.detail.instructions ? ' — ' + item.detail.instructions : '');
    } else if (item.type === 'Nursing') {
      desc = item.detail.intervention || 'Nursing';
    } else if (item.type === 'Activity') {
      desc = (item.detail.level || 'Activity') + (item.detail.weightBearing ? ' — WB: ' + item.detail.weightBearing : '');
    }

    var prioClass = 'badge badge-' + item.priority.toLowerCase();
    bodyHTML += '<label class="os-preview-item">' +
      '<input type="checkbox" checked data-item-idx="' + idx + '" class="os-item-check" />' +
      '<span class="os-preview-item-info">' +
      '<span class="os-preview-type-icon">' + getOrderTypeIcon(item.type) + '</span>' +
      '<span class="os-preview-detail">' +
      '<strong>' + esc(item.type) + ':</strong> ' + esc(desc) +
      '</span>' +
      '<span class="' + prioClass + '">' + esc(item.priority) + '</span>' +
      '</span>' +
      '</label>';
  });

  bodyHTML += '</div>';

  // Encounter selector (if not already in an encounter context)
  bodyHTML += '<div class="os-encounter-select">' +
    '<label><strong>Select Encounter:</strong></label>' +
    '<select id="os-encounter-picker" class="os-encounter-picker">' +
    '<option value="">-- Select an encounter --</option>';

  var encounters = getEncounters().filter(function(e) { return e.status === 'Open'; }).sort(function(a, b) {
    return new Date(b.dateTime) - new Date(a.dateTime);
  });
  encounters.forEach(function(enc) {
    var pat = getPatient(enc.patientId);
    var patName = pat ? pat.firstName + ' ' + pat.lastName : 'Unknown';
    bodyHTML += '<option value="' + esc(enc.id) + '">' + esc(patName) + ' - ' + esc(enc.visitType) + ' - ' + formatDateTime(enc.dateTime) + '</option>';
  });

  bodyHTML += '</select></div></div>';

  var footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-success" id="os-place-btn">Place Selected Orders</button>';

  openModal({ title: set.name, bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  // Select all / deselect all
  var placeBtn = document.getElementById('os-place-btn');
  placeBtn.addEventListener('click', function() {
    var encPicker = document.getElementById('os-encounter-picker');
    var encId = encPicker ? encPicker.value : '';
    if (!encId) {
      showToast('Please select an encounter first.', 'warning');
      return;
    }

    var enc = getEncounter(encId);
    if (!enc) {
      showToast('Encounter not found.', 'error');
      return;
    }

    var checks = document.querySelectorAll('.os-item-check');
    var selectedIndices = [];
    checks.forEach(function(cb) {
      if (cb.checked) selectedIndices.push(parseInt(cb.dataset.itemIdx));
    });

    if (selectedIndices.length === 0) {
      showToast('No orders selected.', 'warning');
      return;
    }

    // Check CDS before placing
    var alerts = [];
    if (typeof checkCDS === 'function') {
      set.items.forEach(function(item, idx) {
        if (selectedIndices.indexOf(idx) < 0) return;
        var orderData = {
          type: item.type,
          detail: item.detail,
          patientId: enc.patientId,
          encounterId: encId,
        };
        var itemAlerts = checkCDS(orderData, enc.patientId);
        if (itemAlerts && itemAlerts.length > 0) {
          alerts = alerts.concat(itemAlerts);
        }
      });
    }

    if (alerts.length > 0) {
      showCDSAlertsBeforePlacing(alerts, function() {
        var placed = placeOrderSet(set.id, encId, enc.patientId, selectedIndices);
        closeModal();
        showToast(placed + ' orders placed from "' + set.name + '".', 'success');
      });
      return;
    }

    var placed = placeOrderSet(set.id, encId, enc.patientId, selectedIndices);
    closeModal();
    showToast(placed + ' orders placed from "' + set.name + '".', 'success');
  });
}

function getOrderTypeIcon(type) {
  var icons = { Medication: '', Lab: '', Imaging: '', Consult: '', Diet: '', Nursing: '', Activity: '' };
  return icons[type] || '';
}
