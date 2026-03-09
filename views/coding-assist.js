/* ============================================================
   views/coding-assist.js — E&M Level Coding Assist
   Auto-suggest CPT E&M level based on note documentation complexity
   ============================================================ */

/* ---------- HPI Element Keywords ---------- */
const _HPI_ELEMENTS = {
  location:           ['location', 'site', 'area', 'region', 'left', 'right', 'bilateral', 'upper', 'lower', 'chest', 'abdomen', 'back', 'head', 'neck', 'extremity', 'arm', 'leg', 'knee', 'shoulder', 'hip', 'ankle', 'wrist', 'elbow', 'foot', 'hand'],
  quality:            ['quality', 'sharp', 'dull', 'aching', 'burning', 'stabbing', 'throbbing', 'cramping', 'pressure', 'squeezing', 'tingling', 'numbness', 'radiating', 'shooting', 'tearing'],
  severity:           ['severity', 'severe', 'mild', 'moderate', 'intense', 'excruciating', 'worst', 'tolerable', 'unbearable', '/10', 'out of 10', 'pain scale', 'rated'],
  duration:           ['duration', 'days', 'weeks', 'months', 'years', 'hours', 'minutes', 'since', 'started', 'onset', 'began', 'for the past', 'for the last'],
  timing:             ['timing', 'constant', 'intermittent', 'occasional', 'frequent', 'daily', 'weekly', 'morning', 'evening', 'night', 'nocturnal', 'postprandial', 'episodic', 'continuous'],
  context:            ['context', 'after', 'before', 'during', 'while', 'following', 'triggered', 'provoked', 'associated with activity', 'at rest', 'with exertion', 'lifting', 'bending', 'walking'],
  modifyingFactors:   ['modifying', 'better', 'worse', 'improves', 'aggravated', 'relieved', 'alleviates', 'exacerbates', 'tylenol', 'ibuprofen', 'ice', 'heat', 'rest', 'elevation', 'medication helps', 'nsaid'],
  associatedSigns:    ['associated', 'nausea', 'vomiting', 'fever', 'chills', 'swelling', 'redness', 'weakness', 'fatigue', 'dizziness', 'shortness of breath', 'cough', 'weight loss', 'weight gain', 'appetite', 'sleep disturbance'],
};

/* ---------- ROS Systems ---------- */
const _ROS_SYSTEMS = [
  'constitutional', 'general',
  'eyes', 'ophthalmologic', 'vision',
  'ent', 'ears', 'nose', 'throat', 'hearing',
  'cardiovascular', 'cardiac', 'heart', 'chest pain', 'palpitations',
  'respiratory', 'pulmonary', 'breathing', 'cough', 'dyspnea',
  'gastrointestinal', 'gi', 'abdominal', 'nausea', 'vomiting', 'diarrhea', 'bowel',
  'genitourinary', 'gu', 'urinary', 'dysuria',
  'musculoskeletal', 'msk', 'joint', 'muscle', 'back pain',
  'integumentary', 'skin', 'rash', 'lesion',
  'neurological', 'neuro', 'headache', 'numbness', 'weakness', 'dizziness', 'seizure',
  'psychiatric', 'psych', 'mood', 'anxiety', 'depression', 'sleep',
  'endocrine', 'thyroid', 'diabetes', 'polyuria', 'polydipsia',
  'hematologic', 'lymphatic', 'bleeding', 'bruising', 'lymphadenopathy',
  'immunologic', 'allergic', 'immunologic',
];

/* ROS system groupings for counting unique systems */
const _ROS_SYSTEM_GROUPS = {
  constitutional: ['constitutional', 'general', 'fever', 'weight', 'fatigue', 'malaise'],
  eyes:           ['eyes', 'ophthalmologic', 'vision', 'visual'],
  ent:            ['ent', 'ears', 'nose', 'throat', 'hearing', 'sinus', 'rhinorrhea', 'otalgia', 'tinnitus'],
  cardiovascular: ['cardiovascular', 'cardiac', 'heart', 'chest pain', 'palpitations', 'edema', 'murmur'],
  respiratory:    ['respiratory', 'pulmonary', 'breathing', 'cough', 'dyspnea', 'wheezing', 'sputum'],
  gi:             ['gastrointestinal', 'gi', 'abdominal', 'nausea', 'vomiting', 'diarrhea', 'bowel', 'constipation', 'appetite'],
  gu:             ['genitourinary', 'gu', 'urinary', 'dysuria', 'frequency', 'hematuria'],
  msk:            ['musculoskeletal', 'msk', 'joint', 'muscle', 'back pain', 'stiffness', 'swelling'],
  skin:           ['integumentary', 'skin', 'rash', 'lesion', 'wound', 'pruritus'],
  neuro:          ['neurological', 'neuro', 'headache', 'numbness', 'weakness', 'dizziness', 'seizure', 'paresthesia', 'tremor'],
  psych:          ['psychiatric', 'psych', 'mood', 'anxiety', 'depression', 'sleep', 'insomnia'],
  endocrine:      ['endocrine', 'thyroid', 'diabetes', 'polyuria', 'polydipsia', 'heat intolerance', 'cold intolerance'],
  hematologic:    ['hematologic', 'lymphatic', 'bleeding', 'bruising', 'lymphadenopathy', 'anemia'],
  immunologic:    ['immunologic', 'allergic', 'hiv', 'immunodeficiency'],
};

/* ---------- Exam Element Groups ---------- */
const _EXAM_SYSTEM_GROUPS = {
  constitutional:  ['general appearance', 'well-developed', 'well-nourished', 'alert', 'oriented', 'no acute distress', 'nad', 'appears', 'cooperative'],
  eyes:            ['pupils', 'perrla', 'eomi', 'sclera', 'conjunctiva', 'fundoscopic', 'visual acuity'],
  ent:             ['tympanic', 'oropharynx', 'nares', 'nasal', 'ear canal', 'throat', 'tonsils', 'mucosa'],
  neck:            ['neck', 'thyroid', 'lymph node', 'supple', 'jvd', 'carotid', 'trachea midline'],
  cardiovascular:  ['heart', 'cardiac', 'rhythm', 'murmur', 's1', 's2', 'regular rate', 'rrr', 'gallop', 'rub', 'peripheral pulses', 'edema'],
  respiratory:     ['lungs', 'breath sounds', 'clear to auscultation', 'cta', 'wheezes', 'rales', 'rhonchi', 'respiratory effort', 'chest wall'],
  gi:              ['abdomen', 'bowel sounds', 'soft', 'non-tender', 'nontender', 'distension', 'hepatomegaly', 'splenomegaly', 'guarding', 'rebound'],
  gu:              ['genitourinary', 'costovertebral', 'cvat', 'bladder', 'external genitalia'],
  msk:             ['musculoskeletal', 'range of motion', 'rom', 'tenderness', 'swelling', 'deformity', 'strength', 'gait', 'joint', 'crepitus'],
  skin:            ['skin', 'rash', 'lesion', 'wound', 'turgor', 'intact', 'warm', 'dry', 'erythema', 'ecchymosis'],
  neuro:           ['cranial nerve', 'sensation', 'motor', 'reflex', 'coordination', 'gait', 'romberg', 'babinski', 'strength', 'dtrs', 'finger-to-nose'],
  psych:           ['psychiatric', 'affect', 'mood', 'judgment', 'insight', 'thought process', 'orientation', 'memory', 'cognition'],
};

/* ---------- MDM Complexity Rules ---------- */
const _MDM_LEVELS = {
  straightforward: { diagnoses: 1, data: 0, risk: 'minimal' },
  low:             { diagnoses: 2, data: 1, risk: 'low' },
  moderate:        { diagnoses: 3, data: 2, risk: 'moderate' },
  high:            { diagnoses: 4, data: 3, risk: 'high' },
};

/* ---------- E&M Code Mapping ---------- */
const _EM_CODES_ESTABLISHED = {
  1: { code: '99211', description: 'Office visit, established, minimal' },
  2: { code: '99212', description: 'Office visit, established, straightforward' },
  3: { code: '99213', description: 'Office visit, established, low complexity' },
  4: { code: '99214', description: 'Office visit, established, moderate complexity' },
  5: { code: '99215', description: 'Office visit, established, high complexity' },
};

const _EM_CODES_NEW = {
  1: { code: '99201', description: 'Office visit, new patient, straightforward' },
  2: { code: '99202', description: 'Office visit, new patient, straightforward' },
  3: { code: '99203', description: 'Office visit, new patient, low complexity' },
  4: { code: '99204', description: 'Office visit, new patient, moderate complexity' },
  5: { code: '99205', description: 'Office visit, new patient, high complexity' },
};

/* ---------- RVU Lookup (approximate) ---------- */
const _EM_RVUS = {
  '99211': 0.18, '99212': 0.93, '99213': 1.30, '99214': 1.92, '99215': 2.80,
  '99201': 0.48, '99202': 0.93, '99203': 1.42, '99204': 2.43, '99205': 3.17,
};

/* ============================================================
   ANALYSIS FUNCTIONS
   ============================================================ */

function _analyzeHPI(hpiText) {
  if (!hpiText) return { elements: [], count: 0, level: 'None' };
  const text = hpiText.toLowerCase();
  const found = [];

  Object.keys(_HPI_ELEMENTS).forEach(function(element) {
    const keywords = _HPI_ELEMENTS[element];
    for (var i = 0; i < keywords.length; i++) {
      if (text.indexOf(keywords[i]) !== -1) {
        found.push(element);
        break;
      }
    }
  });

  var level = 'None';
  if (found.length >= 4) level = 'Extended';
  else if (found.length >= 1) level = 'Brief';

  return { elements: found, count: found.length, level: level };
}

function _analyzeROS(rosText) {
  if (!rosText) return { systems: [], count: 0, level: 'None' };
  const text = rosText.toLowerCase();
  const foundSystems = [];

  Object.keys(_ROS_SYSTEM_GROUPS).forEach(function(system) {
    const keywords = _ROS_SYSTEM_GROUPS[system];
    for (var i = 0; i < keywords.length; i++) {
      if (text.indexOf(keywords[i]) !== -1) {
        foundSystems.push(system);
        break;
      }
    }
  });

  var level = 'None';
  if (foundSystems.length >= 10) level = 'Complete';
  else if (foundSystems.length >= 2) level = 'Extended';
  else if (foundSystems.length >= 1) level = 'Problem Pertinent';

  return { systems: foundSystems, count: foundSystems.length, level: level };
}

function _analyzeExam(examText) {
  if (!examText) return { systems: [], count: 0, level: 'None' };
  const text = examText.toLowerCase();
  const foundSystems = [];

  Object.keys(_EXAM_SYSTEM_GROUPS).forEach(function(system) {
    const keywords = _EXAM_SYSTEM_GROUPS[system];
    for (var i = 0; i < keywords.length; i++) {
      if (text.indexOf(keywords[i]) !== -1) {
        foundSystems.push(system);
        break;
      }
    }
  });

  var level = 'None';
  if (foundSystems.length >= 8) level = 'Comprehensive';
  else if (foundSystems.length >= 6) level = 'Detailed';
  else if (foundSystems.length >= 2) level = 'Expanded Problem Focused';
  else if (foundSystems.length >= 1) level = 'Problem Focused';

  return { systems: foundSystems, count: foundSystems.length, level: level };
}

function _analyzeMDM(encounter, note) {
  var dxCount = (encounter.diagnoses || []).length;
  var dataPoints = 0;
  var riskLevel = 'minimal';

  // Count data reviewed (orders, labs, imaging on this encounter)
  var orders = (typeof getOrdersByEncounter === 'function') ? getOrdersByEncounter(encounter.id) : [];
  dataPoints += orders.length;

  // Check for labs/imaging results
  var labs = (typeof loadAll === 'function') ? loadAll(KEYS.labResults).filter(function(l) { return l.encounterId === encounter.id; }) : [];
  dataPoints += labs.length;

  // Determine risk level based on diagnoses and treatment
  var assessmentText = ((note && note.assessment) || '').toLowerCase();
  var planText = ((note && note.plan) || '').toLowerCase();
  var combinedText = assessmentText + ' ' + planText;

  // High risk indicators
  var highRiskTerms = ['surgery', 'hospitalization', 'admit', 'emergency', 'malignant', 'cancer', 'transplant', 'resuscitation', 'life-threatening', 'sepsis', 'mi ', 'myocardial infarction', 'stroke', 'pulmonary embolism'];
  var moderateRiskTerms = ['prescription', 'iv ', 'intravenous', 'procedure', 'biopsy', 'injection', 'imaging', 'mri', 'ct scan', 'specialist', 'referral', 'narcotic', 'opioid', 'anticoagul', 'insulin', 'immunosuppress'];
  var lowRiskTerms = ['otc', 'over the counter', 'rest', 'follow up', 'monitor', 'diet', 'exercise', 'topical', 'reassurance'];

  for (var i = 0; i < highRiskTerms.length; i++) {
    if (combinedText.indexOf(highRiskTerms[i]) !== -1) { riskLevel = 'high'; break; }
  }
  if (riskLevel === 'minimal') {
    for (var j = 0; j < moderateRiskTerms.length; j++) {
      if (combinedText.indexOf(moderateRiskTerms[j]) !== -1) { riskLevel = 'moderate'; break; }
    }
  }
  if (riskLevel === 'minimal') {
    for (var k = 0; k < lowRiskTerms.length; k++) {
      if (combinedText.indexOf(lowRiskTerms[k]) !== -1) { riskLevel = 'low'; break; }
    }
  }

  // Determine MDM complexity
  var complexity = 'straightforward';
  if (dxCount >= 4 || dataPoints >= 3 || riskLevel === 'high') complexity = 'high';
  else if (dxCount >= 3 || dataPoints >= 2 || riskLevel === 'moderate') complexity = 'moderate';
  else if (dxCount >= 2 || dataPoints >= 1 || riskLevel === 'low') complexity = 'low';

  return {
    diagnosesCount: dxCount,
    dataPoints: dataPoints,
    riskLevel: riskLevel,
    complexity: complexity,
  };
}

function _determineEMLevel(hpiResult, rosResult, examResult, mdmResult) {
  // Map components to numeric levels
  var hpiLevel = 0;
  if (hpiResult.level === 'Extended') hpiLevel = 4;
  else if (hpiResult.level === 'Brief') hpiLevel = 2;

  var rosLevel = 0;
  if (rosResult.level === 'Complete') rosLevel = 4;
  else if (rosResult.level === 'Extended') rosLevel = 3;
  else if (rosResult.level === 'Problem Pertinent') rosLevel = 2;

  var examLevel = 0;
  if (examResult.level === 'Comprehensive') examLevel = 5;
  else if (examResult.level === 'Detailed') examLevel = 4;
  else if (examResult.level === 'Expanded Problem Focused') examLevel = 3;
  else if (examResult.level === 'Problem Focused') examLevel = 2;

  var mdmLevel = 0;
  if (mdmResult.complexity === 'high') mdmLevel = 5;
  else if (mdmResult.complexity === 'moderate') mdmLevel = 4;
  else if (mdmResult.complexity === 'low') mdmLevel = 3;
  else mdmLevel = 2;

  // 2021 E&M guidelines: primarily MDM-based, but history/exam still factor
  // Use MDM as primary driver, boost/reduce by history + exam
  var level = mdmLevel;

  // Cap at the average of all components (prevents over-coding)
  var avg = Math.round((hpiLevel + rosLevel + examLevel + mdmLevel) / 4);
  level = Math.min(level, avg + 1);
  level = Math.max(level, 2); // Minimum level 2
  level = Math.min(level, 5); // Maximum level 5

  return level;
}

/* ============================================================
   FULL ANALYSIS — analyzes encounter + note, returns recommendation
   ============================================================ */
function analyzeEMLevel(encounterId) {
  var encounter = getEncounter(encounterId);
  if (!encounter) return null;

  var note = getNoteByEncounter(encounterId);
  var isNewPatient = false;
  // Check if this is the patient's first encounter
  var patientEncounters = getEncountersByPatient(encounter.patientId);
  if (patientEncounters.length <= 1) isNewPatient = true;

  var hpiResult = _analyzeHPI(note ? note.hpi : '');
  var rosResult = _analyzeROS(note ? note.ros : '');
  var examResult = _analyzeExam(note ? note.physicalExam : '');
  var mdmResult = _analyzeMDM(encounter, note);

  var emLevel = _determineEMLevel(hpiResult, rosResult, examResult, mdmResult);
  var codes = isNewPatient ? _EM_CODES_NEW : _EM_CODES_ESTABLISHED;
  var recommended = codes[emLevel] || codes[3];
  var rvu = _EM_RVUS[recommended.code] || 0;

  return {
    encounterId: encounterId,
    isNewPatient: isNewPatient,
    hpi: hpiResult,
    ros: rosResult,
    exam: examResult,
    mdm: mdmResult,
    recommendedLevel: emLevel,
    recommendedCode: recommended.code,
    recommendedDescription: recommended.description,
    rvu: rvu,
    justification: _buildJustification(hpiResult, rosResult, examResult, mdmResult, emLevel, isNewPatient),
  };
}

function _buildJustification(hpi, ros, exam, mdm, level, isNew) {
  var lines = [];
  lines.push('Patient Type: ' + (isNew ? 'New' : 'Established'));
  lines.push('HPI: ' + hpi.count + '/8 elements (' + hpi.level + ')' + (hpi.elements.length > 0 ? ' — ' + hpi.elements.join(', ') : ''));
  lines.push('ROS: ' + ros.count + '/14 systems (' + ros.level + ')' + (ros.systems.length > 0 ? ' — ' + ros.systems.join(', ') : ''));
  lines.push('Exam: ' + exam.count + '/12 systems (' + exam.level + ')' + (exam.systems.length > 0 ? ' — ' + exam.systems.join(', ') : ''));
  lines.push('MDM: ' + mdm.complexity + ' (Dx: ' + mdm.diagnosesCount + ', Data: ' + mdm.dataPoints + ', Risk: ' + mdm.riskLevel + ')');
  return lines;
}

/* ============================================================
   E&M CODING ASSIST PANEL (modal)
   ============================================================ */
function openCodingAssistModal(encounterId) {
  var analysis = analyzeEMLevel(encounterId);
  if (!analysis) { showToast('Could not analyze encounter', 'error'); return; }

  var encounter = getEncounter(encounterId);
  var patient = getPatient(encounter.patientId);
  var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
  var dateStr = encounter.dateTime ? formatDateTime(encounter.dateTime) : '';

  var body = '';

  // Header
  body += '<div class="coding-assist-header">';
  body += '<div><strong>Patient:</strong> ' + patName + '</div>';
  body += '<div><strong>Date:</strong> ' + esc(dateStr) + '</div>';
  body += '<div><strong>Visit Type:</strong> ' + esc(encounter.visitType || '') + (encounter.visitSubtype ? ' / ' + esc(encounter.visitSubtype) : '') + '</div>';
  body += '<div><strong>Patient Type:</strong> ' + (analysis.isNewPatient ? 'New' : 'Established') + '</div>';
  body += '</div>';

  // Recommended code (prominent)
  body += '<div class="coding-recommended-box">';
  body += '<div class="coding-recommended-code">' + esc(analysis.recommendedCode) + '</div>';
  body += '<div class="coding-recommended-desc">' + esc(analysis.recommendedDescription) + '</div>';
  body += '<div class="coding-recommended-rvu">RVU: ' + analysis.rvu.toFixed(2) + '</div>';
  body += '</div>';

  // Component analysis
  body += '<div class="coding-components">';

  // HPI
  body += '<div class="coding-component">';
  body += '<div class="coding-component-header">';
  body += '<span class="coding-component-title">History of Present Illness (HPI)</span>';
  body += '<span class="coding-component-badge coding-badge-' + _badgeClass(analysis.hpi.level) + '">' + esc(analysis.hpi.level) + '</span>';
  body += '</div>';
  body += '<div class="coding-component-detail">' + analysis.hpi.count + ' of 8 elements documented</div>';
  body += '<div class="coding-component-items">';
  Object.keys(_HPI_ELEMENTS).forEach(function(el) {
    var found = analysis.hpi.elements.indexOf(el) !== -1;
    body += '<span class="coding-item ' + (found ? 'coding-item-found' : 'coding-item-missing') + '">' + esc(el.replace(/([A-Z])/g, ' $1').toLowerCase()) + '</span>';
  });
  body += '</div></div>';

  // ROS
  body += '<div class="coding-component">';
  body += '<div class="coding-component-header">';
  body += '<span class="coding-component-title">Review of Systems (ROS)</span>';
  body += '<span class="coding-component-badge coding-badge-' + _badgeClass(analysis.ros.level) + '">' + esc(analysis.ros.level) + '</span>';
  body += '</div>';
  body += '<div class="coding-component-detail">' + analysis.ros.count + ' of 14 systems reviewed</div>';
  body += '<div class="coding-component-items">';
  Object.keys(_ROS_SYSTEM_GROUPS).forEach(function(sys) {
    var found = analysis.ros.systems.indexOf(sys) !== -1;
    body += '<span class="coding-item ' + (found ? 'coding-item-found' : 'coding-item-missing') + '">' + esc(sys) + '</span>';
  });
  body += '</div></div>';

  // Exam
  body += '<div class="coding-component">';
  body += '<div class="coding-component-header">';
  body += '<span class="coding-component-title">Physical Examination</span>';
  body += '<span class="coding-component-badge coding-badge-' + _badgeClass(analysis.exam.level) + '">' + esc(analysis.exam.level) + '</span>';
  body += '</div>';
  body += '<div class="coding-component-detail">' + analysis.exam.count + ' of 12 organ systems examined</div>';
  body += '<div class="coding-component-items">';
  Object.keys(_EXAM_SYSTEM_GROUPS).forEach(function(sys) {
    var found = analysis.exam.systems.indexOf(sys) !== -1;
    body += '<span class="coding-item ' + (found ? 'coding-item-found' : 'coding-item-missing') + '">' + esc(sys) + '</span>';
  });
  body += '</div></div>';

  // MDM
  body += '<div class="coding-component">';
  body += '<div class="coding-component-header">';
  body += '<span class="coding-component-title">Medical Decision Making (MDM)</span>';
  body += '<span class="coding-component-badge coding-badge-' + _badgeClass(analysis.mdm.complexity) + '">' + esc(analysis.mdm.complexity) + '</span>';
  body += '</div>';
  body += '<div class="coding-component-detail">';
  body += 'Diagnoses: ' + analysis.mdm.diagnosesCount + ' | Data Points: ' + analysis.mdm.dataPoints + ' | Risk: ' + esc(analysis.mdm.riskLevel);
  body += '</div></div>';

  body += '</div>'; // end coding-components

  // Code selection override
  body += '<div class="coding-override">';
  body += '<label class="form-label">Override Code (if needed):</label>';
  body += '<select class="form-control" id="coding-override-select" style="width:auto;display:inline-block;margin-left:8px;">';
  var codeSet = analysis.isNewPatient ? _EM_CODES_NEW : _EM_CODES_ESTABLISHED;
  for (var lvl = 1; lvl <= 5; lvl++) {
    var c = codeSet[lvl];
    if (c) {
      body += '<option value="' + esc(c.code) + '"' + (lvl === analysis.recommendedLevel ? ' selected' : '') + '>' + esc(c.code + ' — ' + c.description) + ' (RVU: ' + (_EM_RVUS[c.code] || 0).toFixed(2) + ')</option>';
    }
  }
  body += '</select>';
  body += '</div>';

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Close</button>';
  footer += '<button class="btn btn-primary" id="coding-apply-btn">Apply Code to Encounter</button>';

  openModal({ title: 'E&M Coding Assist', bodyHTML: body, footerHTML: footer, size: 'lg' });

  // Wire apply button
  setTimeout(function() {
    var applyBtn = document.getElementById('coding-apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', function() {
        var selectedCode = document.getElementById('coding-override-select').value;
        var codeInfo = null;
        for (var l = 1; l <= 5; l++) {
          if (codeSet[l] && codeSet[l].code === selectedCode) { codeInfo = codeSet[l]; break; }
        }
        if (!codeInfo) { showToast('Invalid code selected', 'error'); return; }

        // Save CPT code to encounter
        var enc = getEncounter(encounterId);
        var cptCodes = enc.cptCodes || [];
        // Remove existing E&M code if any
        cptCodes = cptCodes.filter(function(c) {
          var code = typeof c === 'string' ? c : (c.code || '');
          return !/^992\d{2}$/.test(code);
        });
        cptCodes.unshift({ code: selectedCode, description: codeInfo.description });
        saveEncounter({ id: encounterId, cptCodes: cptCodes, emLevel: selectedCode });
        showToast('E&M code ' + selectedCode + ' applied to encounter', 'success');
        closeModal();
      });
    }
  }, 50);
}

function _badgeClass(level) {
  var l = (level || '').toLowerCase();
  if (l === 'none' || l === 'straightforward' || l === 'minimal') return 'low';
  if (l === 'brief' || l === 'problem pertinent' || l === 'problem focused' || l === 'low') return 'low';
  if (l === 'extended' || l === 'expanded problem focused' || l === 'moderate') return 'med';
  if (l === 'complete' || l === 'detailed' || l === 'comprehensive' || l === 'high') return 'high';
  return 'low';
}
