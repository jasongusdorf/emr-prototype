/* ============================================================
   views/behavioral-health.js — Behavioral Health Module
   Safety plans, treatment plans, screenings (PHQ-9, GAD-7,
   AUDIT-C, DAST-10), session notes, crisis plans
   ============================================================ */

/* ---------- PHQ-9 ---------- */
const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself, or that you are a failure',
  'Trouble concentrating on things',
  'Moving or speaking slowly, or being fidgety/restless',
  'Thoughts that you would be better off dead, or of hurting yourself'
];
const PHQ9_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' }
];
function phq9Severity(score) {
  if (score <= 4) return { level: 'Minimal', color: 'badge-success' };
  if (score <= 9) return { level: 'Mild', color: 'badge-info' };
  if (score <= 14) return { level: 'Moderate', color: 'badge-warning' };
  if (score <= 19) return { level: 'Moderately Severe', color: 'badge-warning' };
  return { level: 'Severe', color: 'badge-danger' };
}

/* ---------- GAD-7 ---------- */
const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen'
];
const GAD7_OPTIONS = PHQ9_OPTIONS; // same 0-3 scale
function gad7Severity(score) {
  if (score <= 4) return { level: 'Minimal', color: 'badge-success' };
  if (score <= 9) return { level: 'Mild', color: 'badge-info' };
  if (score <= 14) return { level: 'Moderate', color: 'badge-warning' };
  return { level: 'Severe', color: 'badge-danger' };
}

/* ---------- AUDIT-C ---------- */
const AUDITC_QUESTIONS = [
  'How often do you have a drink containing alcohol?',
  'How many drinks containing alcohol do you have on a typical day when you are drinking?',
  'How often do you have 6 or more drinks on one occasion?'
];
const AUDITC_OPTIONS = [
  [
    { value: 0, label: 'Never' },
    { value: 1, label: 'Monthly or less' },
    { value: 2, label: '2-4 times a month' },
    { value: 3, label: '2-3 times a week' },
    { value: 4, label: '4+ times a week' }
  ],
  [
    { value: 0, label: '1 or 2' },
    { value: 1, label: '3 or 4' },
    { value: 2, label: '5 or 6' },
    { value: 3, label: '7 to 9' },
    { value: 4, label: '10 or more' }
  ],
  [
    { value: 0, label: 'Never' },
    { value: 1, label: 'Less than monthly' },
    { value: 2, label: 'Monthly' },
    { value: 3, label: 'Weekly' },
    { value: 4, label: 'Daily or almost daily' }
  ]
];
function auditcRisk(score, sex) {
  var threshold = (sex || '').toLowerCase() === 'female' ? 3 : 4;
  return score >= threshold ? { level: 'Positive — at risk', color: 'badge-danger' } : { level: 'Negative', color: 'badge-success' };
}

/* ---------- DAST-10 ---------- */
const DAST10_QUESTIONS = [
  'Have you used drugs other than those required for medical reasons?',
  'Do you abuse more than one drug at a time?',
  'Are you always able to stop using drugs when you want to?',
  'Have you had blackouts or flashbacks as a result of drug use?',
  'Do you ever feel bad or guilty about your drug use?',
  'Does your spouse (or parents) ever complain about your involvement with drugs?',
  'Have you neglected your family because of your use of drugs?',
  'Have you engaged in illegal activities in order to obtain drugs?',
  'Have you ever experienced withdrawal symptoms when you stopped taking drugs?',
  'Have you had medical problems as a result of your drug use?'
];
function dast10Severity(score) {
  if (score === 0) return { level: 'No problems', color: 'badge-success' };
  if (score <= 2) return { level: 'Low level', color: 'badge-info' };
  if (score <= 5) return { level: 'Moderate level', color: 'badge-warning' };
  if (score <= 8) return { level: 'Substantial level', color: 'badge-warning' };
  return { level: 'Severe level', color: 'badge-danger' };
}

let _bhTab = 'safety';

/* ============================================================
   MAIN RENDER
   ============================================================ */
function renderBehavioralHealth(patientId) {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var patient = patientId ? getPatient(patientId) : null;
  if (patientId && !patient) { app.textContent = 'Patient not found.'; return; }

  setTopbar({
    title: patient ? 'Behavioral Health — ' + esc(patient.firstName + ' ' + patient.lastName) : 'Behavioral Health',
    meta: patient ? esc(patient.mrn) : '',
    actions: ''
  });
  setActiveNav('behavioral-health');

  var tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';
  var tabDefs = [
    { key: 'safety', label: 'Safety Plan' },
    { key: 'treatment', label: 'Treatment Plans' },
    { key: 'screenings', label: 'Screenings' },
    { key: 'sessions', label: 'Session Notes' },
    { key: 'meds', label: 'Psych Meds' },
    { key: 'crisis', label: 'Crisis Plan' }
  ];

  tabDefs.forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_bhTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() { _bhTab = t.key; renderBehavioralHealth(patientId); });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  if (!patient) { renderBHPatientList(app); return; }

  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';

  switch (_bhTab) {
    case 'safety': buildSafetyPlanTab(card, patient); break;
    case 'treatment': buildBHTreatmentTab(card, patient); break;
    case 'screenings': buildScreeningsTab(card, patient); break;
    case 'sessions': buildSessionNotesTab(card, patient); break;
    case 'meds': buildPsychMedsTab(card, patient); break;
    case 'crisis': buildCrisisPlanTab(card, patient); break;
  }
  app.appendChild(card);
}

function renderBHPatientList(app) {
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';
  card.innerHTML = '<h3 style="margin-bottom:12px">Behavioral Health Patients</h3>';

  var patients = getPatients().filter(function(p) { return hasBHRelevance(p.id); });
  if (patients.length === 0) {
    card.innerHTML += '<p class="text-muted">No patients with behavioral health records. BH tools appear when patients have relevant diagnoses (depression, anxiety, substance use, etc.).</p>';
  } else {
    var table = '<table class="data-table"><thead><tr><th>Patient</th><th>MRN</th><th>Safety Plans</th><th>Screenings</th></tr></thead><tbody>';
    patients.forEach(function(p) {
      table += '<tr style="cursor:pointer" onclick="navigate(\'#behavioral-health/' + p.id + '\')">' +
        '<td>' + esc(p.firstName + ' ' + p.lastName) + '</td><td>' + esc(p.mrn) + '</td>' +
        '<td>' + getSafetyPlans(p.id).length + '</td><td>' + getBHScreenings(p.id).length + '</td></tr>';
    });
    table += '</tbody></table>';
    card.innerHTML += table;
  }
  app.appendChild(card);
}

function hasBHRelevance(patientId) {
  if (getSafetyPlans(patientId).length > 0) return true;
  if (getBHScreenings(patientId).length > 0) return true;
  if (getBHSessionNotes(patientId).length > 0) return true;
  var problems = loadAll(KEYS.problems).filter(function(p) { return p.patientId === patientId; });
  return problems.some(function(p) {
    var code = (p.code || '').toUpperCase();
    var desc = (p.description || '').toLowerCase();
    return (code >= 'F00' && code <= 'F99') ||
           desc.indexOf('depression') >= 0 || desc.indexOf('anxiety') >= 0 ||
           desc.indexOf('bipolar') >= 0 || desc.indexOf('schizophrenia') >= 0 ||
           desc.indexOf('ptsd') >= 0 || desc.indexOf('substance') >= 0 ||
           desc.indexOf('alcohol') >= 0 || desc.indexOf('opioid') >= 0 ||
           desc.indexOf('adhd') >= 0 || desc.indexOf('eating disorder') >= 0;
  });
}

/* ============================================================
   TAB: Safety Plan (Columbia Protocol)
   ============================================================ */
function buildSafetyPlanTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:4px">Safety Plan (Columbia Protocol)</h3>' +
    '<p class="text-muted" style="margin-bottom:12px;font-size:12px;">A collaborative crisis intervention tool for patients at risk of suicide.</p>';

  var plans = getSafetyPlans(patient.id);
  var addBtn = makeBtn('+ New Safety Plan', 'btn btn-sm btn-primary', function() { openSafetyPlanModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (plans.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No safety plans on file.' }));
    return;
  }

  plans.forEach(function(plan) {
    var pCard = document.createElement('div');
    pCard.className = 'specialty-record-card';
    var statusClass = plan.status === 'Active' ? 'badge-success' : 'badge-muted';
    pCard.innerHTML =
      '<div class="specialty-record-header"><strong>Safety Plan</strong><span class="badge ' + statusClass + '">' + esc(plan.status || 'Active') + '</span></div>' +
      '<div class="specialty-record-body safety-plan-grid">' +
        '<div class="safety-plan-section"><strong>1. Warning Signs</strong><p>' + esc(plan.warningSigns || '—') + '</p></div>' +
        '<div class="safety-plan-section"><strong>2. Coping Strategies</strong><p>' + esc(plan.copingStrategies || '—') + '</p></div>' +
        '<div class="safety-plan-section"><strong>3. People/Places for Distraction</strong><p>' + esc(plan.distractionPeople || '—') + '</p></div>' +
        '<div class="safety-plan-section"><strong>4. People to Contact for Help</strong><p>' + esc(plan.contactsForHelp || '—') + '</p></div>' +
        '<div class="safety-plan-section"><strong>5. Professionals/Agencies</strong><p>' + esc(plan.professionalsAgencies || '—') + '</p></div>' +
        '<div class="safety-plan-section"><strong>6. Making Environment Safe</strong><p>' + esc(plan.environmentSafety || '—') + '</p></div>' +
      '</div>' +
      '<div class="specialty-record-footer"><span class="text-muted">' + formatDateTime(plan.createdAt) + '</span></div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openSafetyPlanModal(patient.id, plan); });
    pCard.querySelector('.specialty-record-footer').appendChild(editBtn);
    card.appendChild(pCard);
  });
}

function openSafetyPlanModal(patientId, existing) {
  var p = existing || {};
  var fields = [
    { id: 'sp-warning', label: '1. Warning Signs', desc: 'Thoughts, images, mood, situation, behavior that indicate a crisis may be developing', val: p.warningSigns },
    { id: 'sp-coping', label: '2. Internal Coping Strategies', desc: 'Things I can do to take my mind off my problems without contacting another person', val: p.copingStrategies },
    { id: 'sp-distraction', label: '3. People and Social Settings for Distraction', desc: 'People and places that provide distraction', val: p.distractionPeople },
    { id: 'sp-contacts', label: '4. People I Can Ask for Help', desc: 'Family members or friends I can contact during a crisis', val: p.contactsForHelp },
    { id: 'sp-professionals', label: '5. Professionals or Agencies to Contact', desc: 'Clinician/Agency: 988 Suicide & Crisis Lifeline, local crisis line, therapist', val: p.professionalsAgencies },
    { id: 'sp-environment', label: '6. Making the Environment Safe', desc: 'Steps to reduce access to lethal means', val: p.environmentSafety }
  ];

  var bodyHTML = fields.map(function(f) {
    return '<div class="form-group"><label>' + f.label + '</label>' +
      '<p class="text-muted" style="font-size:11px;margin-bottom:4px;">' + f.desc + '</p>' +
      '<textarea id="' + f.id + '" class="form-control" rows="3">' + esc(f.val || '') + '</textarea></div>';
  }).join('');

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Safety Plan',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-sp-btn">Save Safety Plan</button>',
    size: 'lg'
  });

  document.getElementById('save-sp-btn').addEventListener('click', function() {
    saveSafetyPlan({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      warningSigns: document.getElementById('sp-warning').value,
      copingStrategies: document.getElementById('sp-coping').value,
      distractionPeople: document.getElementById('sp-distraction').value,
      contactsForHelp: document.getElementById('sp-contacts').value,
      professionalsAgencies: document.getElementById('sp-professionals').value,
      environmentSafety: document.getElementById('sp-environment').value,
      status: 'Active',
      createdBy: getSessionUser().id
    });
    closeModal();
    showToast('Safety plan saved', 'success');
    renderBehavioralHealth(patientId);
  });
}

/* ============================================================
   TAB: Treatment Plans
   ============================================================ */
function buildBHTreatmentTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Treatment Plans</h3>';
  var plans = getBHPlans(patient.id);
  var addBtn = makeBtn('+ New Treatment Plan', 'btn btn-sm btn-primary', function() { openBHTreatmentModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (plans.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No treatment plans.' }));
    return;
  }

  plans.forEach(function(plan) {
    var pCard = document.createElement('div');
    pCard.className = 'specialty-record-card';
    pCard.innerHTML =
      '<div class="specialty-record-header"><strong>Treatment Plan</strong><span class="badge ' + (plan.status === 'Active' ? 'badge-success' : 'badge-muted') + '">' + esc(plan.status) + '</span></div>' +
      '<div class="specialty-record-body">' +
        '<div style="margin-bottom:8px;"><strong>Problems:</strong><ul style="margin:4px 0 0 16px;">' + (plan.problems || []).map(function(p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>' +
        '<div style="margin-bottom:8px;"><strong>Goals (SMART):</strong><ul style="margin:4px 0 0 16px;">' + (plan.goals || []).map(function(g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul></div>' +
        '<div style="margin-bottom:8px;"><strong>Interventions:</strong><ul style="margin:4px 0 0 16px;">' + (plan.interventions || []).map(function(i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>' +
        (plan.progress ? '<p><strong>Progress:</strong> ' + esc(plan.progress) + '</p>' : '') +
      '</div>' +
      '<div class="specialty-record-footer"><span class="text-muted">' + formatDateTime(plan.createdAt) + '</span></div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openBHTreatmentModal(patient.id, plan); });
    pCard.querySelector('.specialty-record-footer').appendChild(editBtn);
    card.appendChild(pCard);
  });
}

function openBHTreatmentModal(patientId, existing) {
  var p = existing || {};
  var bodyHTML =
    '<div class="form-group"><label>Problems (one per line)</label><textarea id="bht-problems" class="form-control" rows="3">' + esc((p.problems || []).join('\n')) + '</textarea></div>' +
    '<div class="form-group"><label>Goals — SMART format (one per line)</label><textarea id="bht-goals" class="form-control" rows="3" placeholder="Specific, Measurable, Achievable, Relevant, Time-bound">' + esc((p.goals || []).join('\n')) + '</textarea></div>' +
    '<div class="form-group"><label>Objectives (one per line)</label><textarea id="bht-objectives" class="form-control" rows="3">' + esc((p.objectives || []).join('\n')) + '</textarea></div>' +
    '<div class="form-group"><label>Interventions (one per line)</label><textarea id="bht-interventions" class="form-control" rows="3">' + esc((p.interventions || []).join('\n')) + '</textarea></div>' +
    '<div class="form-group"><label>Target Dates (one per line)</label><textarea id="bht-targets" class="form-control" rows="2">' + esc((p.targetDates || []).join('\n')) + '</textarea></div>' +
    '<div class="form-group"><label>Progress Notes</label><textarea id="bht-progress" class="form-control" rows="3">' + esc(p.progress || '') + '</textarea></div>' +
    '<div class="form-group"><label>Status</label><select id="bht-status" class="form-control">' +
      ['Active', 'Completed', 'On Hold', 'Discontinued'].map(function(s) {
        return '<option' + (p.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') +
    '</select></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Treatment Plan',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-bht-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-bht-btn').addEventListener('click', function() {
    var toArr = function(id) { return document.getElementById(id).value.split('\n').map(function(s) { return s.trim(); }).filter(Boolean); };
    saveBHPlan({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      problems: toArr('bht-problems'),
      goals: toArr('bht-goals'),
      objectives: toArr('bht-objectives'),
      interventions: toArr('bht-interventions'),
      targetDates: toArr('bht-targets'),
      progress: document.getElementById('bht-progress').value,
      status: document.getElementById('bht-status').value
    });
    closeModal();
    showToast('Treatment plan saved', 'success');
    renderBehavioralHealth(patientId);
  });
}

/* ============================================================
   TAB: Screenings (PHQ-9, GAD-7, AUDIT-C, DAST-10)
   ============================================================ */
function buildScreeningsTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Behavioral Health Screenings</h3>';

  var screeningTypes = [
    { key: 'PHQ-9', label: 'PHQ-9 (Depression)' },
    { key: 'GAD-7', label: 'GAD-7 (Anxiety)' },
    { key: 'AUDIT-C', label: 'AUDIT-C (Alcohol)' },
    { key: 'DAST-10', label: 'DAST-10 (Drug Use)' }
  ];

  // Action buttons
  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;';
  screeningTypes.forEach(function(st) {
    var btn = makeBtn('+ ' + st.key, 'btn btn-sm btn-primary', function() {
      openScreeningModal(patient.id, st.key, patient);
    });
    btnRow.appendChild(btn);
  });
  card.appendChild(btnRow);

  // History
  var screenings = getBHScreenings(patient.id).sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  if (screenings.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No screenings administered.' }));
    return;
  }

  var table = '<table class="data-table"><thead><tr><th>Date</th><th>Screening</th><th>Score</th><th>Severity</th></tr></thead><tbody>';
  screenings.forEach(function(s) {
    var sev = getScreeningSeverity(s);
    table += '<tr><td>' + new Date(s.date).toLocaleDateString() + '</td><td>' + esc(s.screeningType) + '</td>' +
      '<td>' + s.score + '</td><td><span class="badge ' + sev.color + '">' + esc(sev.level) + '</span></td></tr>';
  });
  table += '</tbody></table>';
  card.innerHTML += table;
}

function getScreeningSeverity(screening) {
  switch (screening.screeningType) {
    case 'PHQ-9': return phq9Severity(screening.score);
    case 'GAD-7': return gad7Severity(screening.score);
    case 'AUDIT-C': return auditcRisk(screening.score, screening.patientSex);
    case 'DAST-10': return dast10Severity(screening.score);
    default: return { level: 'Unknown', color: 'badge-muted' };
  }
}

function openScreeningModal(patientId, type, patient) {
  var questions, options, title, scoreFn;
  switch (type) {
    case 'PHQ-9':
      questions = PHQ9_QUESTIONS; options = null; title = 'PHQ-9 Depression Screening';
      scoreFn = function(r) { return { score: r.reduce(function(a, b) { return a + b; }, 0), severity: phq9Severity(r.reduce(function(a, b) { return a + b; }, 0)) }; };
      break;
    case 'GAD-7':
      questions = GAD7_QUESTIONS; options = null; title = 'GAD-7 Anxiety Screening';
      scoreFn = function(r) { return { score: r.reduce(function(a, b) { return a + b; }, 0), severity: gad7Severity(r.reduce(function(a, b) { return a + b; }, 0)) }; };
      break;
    case 'AUDIT-C':
      questions = AUDITC_QUESTIONS; options = AUDITC_OPTIONS; title = 'AUDIT-C Alcohol Screening';
      scoreFn = function(r) { var s = r.reduce(function(a, b) { return a + b; }, 0); return { score: s, severity: auditcRisk(s, patient ? patient.sex : '') }; };
      break;
    case 'DAST-10':
      questions = DAST10_QUESTIONS; options = null; title = 'DAST-10 Drug Screening';
      scoreFn = function(r) { var s = r.reduce(function(a, b) { return a + b; }, 0); return { score: s, severity: dast10Severity(s) }; };
      break;
  }

  var bodyHTML = '<div id="screening-questions">';
  questions.forEach(function(q, i) {
    bodyHTML += '<div class="form-group" style="margin-bottom:10px;">';
    bodyHTML += '<label style="font-size:12px;font-weight:500;">' + (i + 1) + '. ' + esc(q) + '</label>';
    bodyHTML += '<select class="form-control screening-q" data-qi="' + i + '">';

    if (type === 'DAST-10') {
      // Q3 is reverse-scored
      bodyHTML += '<option value="0">No</option><option value="1">Yes</option>';
    } else if (options && options[i]) {
      options[i].forEach(function(o) {
        bodyHTML += '<option value="' + o.value + '">' + esc(o.label) + '</option>';
      });
    } else {
      PHQ9_OPTIONS.forEach(function(o) {
        bodyHTML += '<option value="' + o.value + '">' + o.value + ' — ' + esc(o.label) + '</option>';
      });
    }
    bodyHTML += '</select></div>';
  });
  bodyHTML += '</div><div id="screening-result" style="margin-top:12px;padding:12px;background:var(--bg-base);border-radius:6px;font-weight:600;"></div>';

  openModal({
    title: title,
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-screening-btn">Save Screening</button>',
    size: 'lg'
  });

  function updateScore() {
    var responses = [];
    document.querySelectorAll('.screening-q').forEach(function(sel) { responses.push(parseInt(sel.value) || 0); });
    // DAST-10 Q3 is reverse scored
    if (type === 'DAST-10' && responses.length > 2) {
      responses[2] = responses[2] === 0 ? 1 : 0;
    }
    var result = scoreFn(responses);
    document.getElementById('screening-result').innerHTML = 'Score: ' + result.score + ' — <span class="badge ' + result.severity.color + '">' + result.severity.level + '</span>';
    return { responses: responses, score: result.score, severity: result.severity.level };
  }
  updateScore();
  document.getElementById('screening-questions').addEventListener('change', updateScore);

  document.getElementById('save-screening-btn').addEventListener('click', function() {
    var result = updateScore();
    saveBHScreening({
      patientId: patientId,
      screeningType: type,
      score: result.score,
      responses: result.responses,
      severity: result.severity,
      date: new Date().toISOString(),
      administeredBy: getSessionUser().id,
      patientSex: patient ? patient.sex : ''
    });
    closeModal();
    showToast(type + ' screening saved — Score: ' + result.score, 'success');
    renderBehavioralHealth(patientId);
  });
}

/* ============================================================
   TAB: Session Notes
   ============================================================ */
function buildSessionNotesTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Session Notes</h3>';
  var notes = getBHSessionNotes(patient.id).sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  var addBtn = makeBtn('+ New Session Note', 'btn btn-sm btn-primary', function() { openSessionNoteModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (notes.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No session notes.' }));
    return;
  }

  notes.forEach(function(n) {
    var nCard = document.createElement('div');
    nCard.className = 'specialty-record-card';
    var siClass = n.si === 'None' ? '' : 'badge-danger';
    nCard.innerHTML =
      '<div class="specialty-record-header"><strong>' + new Date(n.date).toLocaleDateString() + '</strong>' +
        (n.si !== 'None' ? '<span class="badge badge-danger">SI: ' + esc(n.si) + '</span>' : '') +
      '</div>' +
      '<div class="specialty-record-body">' +
        '<div class="form-row">' +
          '<div><strong>Mood:</strong> ' + esc(n.mood || '—') + '</div>' +
          '<div><strong>Affect:</strong> ' + esc(n.affect || '—') + '</div>' +
        '</div>' +
        '<div class="form-row" style="margin-top:4px;">' +
          '<div><strong>Thought Process:</strong> ' + esc(n.thoughtProcess || '—') + '</div>' +
          '<div><strong>Thought Content:</strong> ' + esc(n.thoughtContent || '—') + '</div>' +
        '</div>' +
        '<p style="margin-top:4px;"><strong>SI:</strong> ' + esc(n.si || 'None') + ' | <strong>HI:</strong> ' + esc(n.hi || 'None') + '</p>' +
        (n.plan ? '<p><strong>Plan:</strong> ' + esc(n.plan) + '</p>' : '') +
        (n.riskAssessment ? '<p><strong>Risk Assessment:</strong> ' + esc(n.riskAssessment) + '</p>' : '') +
      '</div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openSessionNoteModal(patient.id, n); });
    var footer = document.createElement('div');
    footer.className = 'specialty-record-footer';
    footer.appendChild(editBtn);
    nCard.appendChild(footer);
    card.appendChild(nCard);
  });
}

function openSessionNoteModal(patientId, existing) {
  var n = existing || {};
  var bodyHTML =
    '<div class="form-group"><label>Date</label><input id="sn-date" type="date" class="form-control" value="' + (n.date ? new Date(n.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)) + '" /></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Mood</label><input id="sn-mood" class="form-control" value="' + esc(n.mood || '') + '" placeholder="e.g., Depressed, Anxious, Euthymic" /></div>' +
      '<div class="form-group"><label>Affect</label><input id="sn-affect" class="form-control" value="' + esc(n.affect || '') + '" placeholder="e.g., Flat, Constricted, Full range" /></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Thought Process</label><input id="sn-tp" class="form-control" value="' + esc(n.thoughtProcess || '') + '" placeholder="e.g., Linear, Circumstantial" /></div>' +
      '<div class="form-group"><label>Thought Content</label><input id="sn-tc" class="form-control" value="' + esc(n.thoughtContent || '') + '" placeholder="e.g., No delusions" /></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Suicidal Ideation</label><select id="sn-si" class="form-control">' +
        ['None', 'Passive', 'Active without plan', 'Active with plan', 'Active with intent'].map(function(s) {
          return '<option' + (n.si === s ? ' selected' : '') + '>' + s + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Homicidal Ideation</label><select id="sn-hi" class="form-control">' +
        ['None', 'Passive', 'Active without plan', 'Active with plan'].map(function(s) {
          return '<option' + (n.hi === s ? ' selected' : '') + '>' + s + '</option>';
        }).join('') +
      '</select></div>' +
    '</div>' +
    '<div class="form-group"><label>Plan</label><textarea id="sn-plan" class="form-control" rows="3">' + esc(n.plan || '') + '</textarea></div>' +
    '<div class="form-group"><label>Risk Assessment</label><textarea id="sn-risk" class="form-control" rows="3" placeholder="Low / Moderate / High risk — basis for assessment">' + esc(n.riskAssessment || '') + '</textarea></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Session Note',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-sn-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-sn-btn').addEventListener('click', function() {
    saveBHSessionNote({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      date: document.getElementById('sn-date').value,
      mood: document.getElementById('sn-mood').value,
      affect: document.getElementById('sn-affect').value,
      thoughtProcess: document.getElementById('sn-tp').value,
      thoughtContent: document.getElementById('sn-tc').value,
      si: document.getElementById('sn-si').value,
      hi: document.getElementById('sn-hi').value,
      plan: document.getElementById('sn-plan').value,
      riskAssessment: document.getElementById('sn-risk').value,
      provider: getSessionUser().id
    });
    closeModal();
    showToast('Session note saved', 'success');
    renderBehavioralHealth(patientId);
  });
}

/* ============================================================
   TAB: Psych Meds
   ============================================================ */
function buildPsychMedsTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Psychiatric Medication Management</h3>';
  var meds = loadAll(KEYS.patientMeds).filter(function(m) { return m.patientId === patient.id; });

  // Filter to likely psychiatric meds
  var psychClasses = ['SSRI', 'SNRI', 'antidepressant', 'antipsychotic', 'mood stabilizer', 'benzodiazepine', 'stimulant', 'anxiolytic', 'lithium', 'sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine', 'duloxetine', 'bupropion', 'aripiprazole', 'quetiapine', 'olanzapine', 'risperidone', 'lamotrigine', 'valproic', 'clonazepam', 'lorazepam', 'alprazolam', 'methylphenidate', 'amphetamine', 'buspirone', 'trazodone', 'mirtazapine', 'hydroxyzine'];

  var psychMeds = meds.filter(function(m) {
    var drug = (m.drug || '').toLowerCase();
    var instructions = (m.instructions || '').toLowerCase();
    return psychClasses.some(function(c) { return drug.indexOf(c.toLowerCase()) >= 0 || instructions.indexOf(c.toLowerCase()) >= 0; });
  });

  if (psychMeds.length === 0) {
    // Show all meds as fallback
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No psychiatric medications identified. Check the patient\'s full medication list in the chart.' }));
    return;
  }

  var table = '<table class="data-table"><thead><tr><th>Medication</th><th>Dose</th><th>Frequency</th><th>Status</th><th>Instructions</th></tr></thead><tbody>';
  psychMeds.forEach(function(m) {
    var statusClass = m.status === 'Active' ? 'badge-success' : 'badge-muted';
    table += '<tr><td>' + esc(m.drug) + '</td><td>' + esc((m.dose || '') + ' ' + (m.unit || '')) + '</td>' +
      '<td>' + esc(m.frequency || '') + '</td><td><span class="badge ' + statusClass + '">' + esc(m.status || '') + '</span></td>' +
      '<td>' + esc(m.instructions || '') + '</td></tr>';
  });
  table += '</tbody></table>';
  card.innerHTML += table;
}

/* ============================================================
   TAB: Crisis Plan
   ============================================================ */
function buildCrisisPlanTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Crisis Plan Documentation</h3>';
  var plans = getCrisisPlans(patient.id);
  var addBtn = makeBtn('+ New Crisis Plan', 'btn btn-sm btn-primary', function() { openCrisisPlanModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (plans.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No crisis plans documented.' }));
    return;
  }

  plans.forEach(function(plan) {
    var pCard = document.createElement('div');
    pCard.className = 'specialty-record-card';
    pCard.innerHTML =
      '<div class="specialty-record-header"><strong>Crisis Plan</strong><span class="badge ' + (plan.status === 'Active' ? 'badge-success' : 'badge-muted') + '">' + esc(plan.status) + '</span></div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>Triggers:</strong> ' + esc(plan.triggers || '—') + '</p>' +
        '<p><strong>Interventions:</strong> ' + esc(plan.interventions || '—') + '</p>' +
        '<p><strong>Emergency Contacts:</strong> ' + esc(plan.emergencyContacts || '—') + '</p>' +
        '<p><strong>Hospital Preference:</strong> ' + esc(plan.hospitalPreference || '—') + '</p>' +
        '<p><strong>Advance Directives:</strong> ' + esc(plan.advanceDirectives || '—') + '</p>' +
      '</div>' +
      '<div class="specialty-record-footer"><span class="text-muted">' + formatDateTime(plan.createdAt) + '</span></div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openCrisisPlanModal(patient.id, plan); });
    pCard.querySelector('.specialty-record-footer').appendChild(editBtn);
    card.appendChild(pCard);
  });
}

function openCrisisPlanModal(patientId, existing) {
  var p = existing || {};
  var bodyHTML =
    '<div class="form-group"><label>Triggers</label><textarea id="cp-triggers" class="form-control" rows="3">' + esc(p.triggers || '') + '</textarea></div>' +
    '<div class="form-group"><label>Interventions</label><textarea id="cp-interventions" class="form-control" rows="3">' + esc(p.interventions || '') + '</textarea></div>' +
    '<div class="form-group"><label>Emergency Contacts</label><textarea id="cp-contacts" class="form-control" rows="3">' + esc(p.emergencyContacts || '') + '</textarea></div>' +
    '<div class="form-group"><label>Hospital Preference</label><input id="cp-hospital" class="form-control" value="' + esc(p.hospitalPreference || '') + '" /></div>' +
    '<div class="form-group"><label>Advance Directives</label><textarea id="cp-ad" class="form-control" rows="3">' + esc(p.advanceDirectives || '') + '</textarea></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Crisis Plan',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-cp-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-cp-btn').addEventListener('click', function() {
    saveCrisisPlan({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      triggers: document.getElementById('cp-triggers').value,
      interventions: document.getElementById('cp-interventions').value,
      emergencyContacts: document.getElementById('cp-contacts').value,
      hospitalPreference: document.getElementById('cp-hospital').value,
      advanceDirectives: document.getElementById('cp-ad').value,
      status: 'Active'
    });
    closeModal();
    showToast('Crisis plan saved', 'success');
    renderBehavioralHealth(patientId);
  });
}

/* ---------- Chart Integration ---------- */
function buildBHChartSection(patientId) {
  if (!hasBHRelevance(patientId)) return null;
  var section = document.createElement('div');
  section.className = 'chart-section';
  section.id = 'section-behavioral-health';
  section.innerHTML =
    '<div class="chart-section-header">' +
      '<h3>Behavioral Health</h3>' +
      '<button class="btn btn-xs btn-primary" onclick="navigate(\'#behavioral-health/' + patientId + '\')">Open BH Module</button>' +
    '</div>';

  var screenings = getBHScreenings(patientId).sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  if (screenings.length > 0) {
    var recent = screenings.slice(0, 3);
    var ul = '<ul style="margin:8px 0 0 16px;">';
    recent.forEach(function(s) {
      var sev = getScreeningSeverity(s);
      ul += '<li>' + esc(s.screeningType) + ': ' + s.score + ' (<span class="badge ' + sev.color + '" style="font-size:11px">' + esc(sev.level) + '</span>) — ' + new Date(s.date).toLocaleDateString() + '</li>';
    });
    ul += '</ul>';
    section.innerHTML += ul;
  }

  var safetyPlans = getSafetyPlans(patientId);
  if (safetyPlans.length > 0) {
    section.innerHTML += '<p style="margin:8px 0;"><span class="badge badge-warning">Safety Plan on file</span></p>';
  }

  return section;
}
