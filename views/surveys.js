/* ============================================================
   views/surveys.js — Clinical Surveys (PHQ-9, GAD-7, AUDIT-C, etc.)
   ============================================================ */

/* ---------- Survey Instruments ---------- */
var SURVEY_INSTRUMENTS = {
  'PHQ-9': {
    name: 'PHQ-9 (Patient Health Questionnaire)',
    shortName: 'PHQ-9',
    category: 'Depression',
    description: 'Screens for depression severity over the past 2 weeks',
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading the newspaper or watching television',
      'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
      'Thoughts that you would be better off dead, or of hurting yourself in some way'
    ],
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 }
    ],
    maxScore: 27,
    scoring: function(total) {
      if (total <= 4) return { severity: 'Minimal', color: '#22c55e', action: 'No treatment needed. Monitor.' };
      if (total <= 9) return { severity: 'Mild', color: '#84cc16', action: 'Watchful waiting; repeat at follow-up.' };
      if (total <= 14) return { severity: 'Moderate', color: '#eab308', action: 'Consider counseling and/or pharmacotherapy.' };
      if (total <= 19) return { severity: 'Moderately Severe', color: '#f97316', action: 'Active treatment with pharmacotherapy and/or psychotherapy.' };
      return { severity: 'Severe', color: '#ef4444', action: 'Immediate initiation of pharmacotherapy; consider referral to psychiatry.' };
    }
  },
  'GAD-7': {
    name: 'GAD-7 (Generalized Anxiety Disorder)',
    shortName: 'GAD-7',
    category: 'Anxiety',
    description: 'Screens for generalized anxiety disorder over the past 2 weeks',
    questions: [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it\'s hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid as if something awful might happen'
    ],
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 }
    ],
    maxScore: 21,
    scoring: function(total) {
      if (total <= 4) return { severity: 'Minimal', color: '#22c55e', action: 'No treatment needed. Monitor.' };
      if (total <= 9) return { severity: 'Mild', color: '#84cc16', action: 'Watchful waiting; repeat at follow-up.' };
      if (total <= 14) return { severity: 'Moderate', color: '#eab308', action: 'Consider counseling and/or pharmacotherapy.' };
      return { severity: 'Severe', color: '#ef4444', action: 'Active treatment with pharmacotherapy and/or psychotherapy.' };
    }
  },
  'AUDIT-C': {
    name: 'AUDIT-C (Alcohol Use Disorders Identification Test)',
    shortName: 'AUDIT-C',
    category: 'Alcohol',
    description: 'Brief alcohol screening questionnaire',
    questions: [
      'How often do you have a drink containing alcohol?',
      'How many drinks containing alcohol do you have on a typical day when you are drinking?',
      'How often do you have 6 or more drinks on one occasion?'
    ],
    options: [
      { label: 'Never', value: 0 },
      { label: 'Monthly or less', value: 1 },
      { label: '2-4 times/month', value: 2 },
      { label: '2-3 times/week', value: 3 },
      { label: '4+ times/week', value: 4 }
    ],
    optionsPerQuestion: {
      1: [
        { label: '1-2', value: 0 },
        { label: '3-4', value: 1 },
        { label: '5-6', value: 2 },
        { label: '7-9', value: 3 },
        { label: '10+', value: 4 }
      ]
    },
    maxScore: 12,
    scoring: function(total) {
      if (total <= 2) return { severity: 'Low Risk', color: '#22c55e', action: 'No intervention needed.' };
      if (total <= 5) return { severity: 'Moderate Risk', color: '#eab308', action: 'Brief counseling recommended.' };
      return { severity: 'High Risk', color: '#ef4444', action: 'Further evaluation recommended. Consider AUDIT full screen.' };
    }
  },
  'PHQ-2': {
    name: 'PHQ-2 (Quick Depression Screen)',
    shortName: 'PHQ-2',
    category: 'Depression',
    description: 'Ultra-brief depression screening (2 questions)',
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless'
    ],
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 }
    ],
    maxScore: 6,
    scoring: function(total) {
      if (total < 3) return { severity: 'Negative Screen', color: '#22c55e', action: 'No further screening needed at this time.' };
      return { severity: 'Positive Screen', color: '#ef4444', action: 'Administer PHQ-9 for full evaluation.' };
    }
  },
  'EPDS': {
    name: 'Edinburgh Postnatal Depression Scale',
    shortName: 'EPDS',
    category: 'Depression',
    description: 'Screens for postnatal depression',
    questions: [
      'I have been able to laugh and see the funny side of things',
      'I have looked forward with enjoyment to things',
      'I have blamed myself unnecessarily when things went wrong',
      'I have been anxious or worried for no good reason',
      'I have felt scared or panicky for no very good reason',
      'Things have been getting on top of me',
      'I have been so unhappy that I have had difficulty sleeping',
      'I have felt sad or miserable',
      'I have been so unhappy that I have been crying',
      'The thought of harming myself has occurred to me'
    ],
    options: [
      { label: 'Not at all / Never', value: 0 },
      { label: 'Not very often / Hardly ever', value: 1 },
      { label: 'Sometimes / Yes, sometimes', value: 2 },
      { label: 'Most of the time / Yes, quite often', value: 3 }
    ],
    maxScore: 30,
    scoring: function(total) {
      if (total < 10) return { severity: 'Low Risk', color: '#22c55e', action: 'Continue routine screening.' };
      if (total <= 12) return { severity: 'Possible Depression', color: '#eab308', action: 'Repeat in 2-4 weeks. Consider counseling.' };
      return { severity: 'Probable Depression', color: '#ef4444', action: 'Full diagnostic assessment needed. Consider immediate intervention.' };
    }
  },
  'C-SSRS': {
    name: 'Columbia Suicide Severity Rating Scale',
    shortName: 'C-SSRS',
    category: 'Suicide Risk',
    description: 'Structured interview for suicide ideation and behavior',
    questions: [
      'Have you wished you were dead or wished you could go to sleep and not wake up?',
      'Have you actually had any thoughts of killing yourself?',
      'Have you been thinking about how you might do this?',
      'Have you had these thoughts and had some intention of acting on them?',
      'Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?',
      'Have you ever done anything, started to do anything, or prepared to do anything to end your life?'
    ],
    options: [
      { label: 'No', value: 0 },
      { label: 'Yes', value: 1 }
    ],
    maxScore: 6,
    scoring: function(total) {
      if (total === 0) return { severity: 'No Risk Identified', color: '#22c55e', action: 'No intervention needed at this time.' };
      if (total === 1) return { severity: 'Wish to be Dead', color: '#eab308', action: 'Monitor closely. Safety planning.' };
      if (total <= 3) return { severity: 'Active Suicidal Ideation', color: '#f97316', action: 'Safety planning, consider psychiatric referral.' };
      return { severity: 'Active Ideation with Plan/Intent', color: '#ef4444', action: 'IMMEDIATE psychiatric evaluation. Do not leave patient alone.' };
    }
  }
};

/* ---------- Provider View: Surveys Management ---------- */
function renderSurveys() {
  var app = document.getElementById('app');
  setTopbar({ title: 'Patient Surveys', meta: 'Clinical screening instruments' });
  setActiveNav('surveys');

  var tab = window._surveysTab || 'results';

  var html = '<div class="pe-container">';
  html += '<div class="pe-tabs">';
  html += '<button class="pe-tab' + (tab === 'results' ? ' active' : '') + '" data-tab="results">Survey Results</button>';
  html += '<button class="pe-tab' + (tab === 'assign' ? ' active' : '') + '" data-tab="assign">Assign Survey</button>';
  html += '<button class="pe-tab' + (tab === 'instruments' ? ' active' : '') + '" data-tab="instruments">Instruments</button>';
  html += '</div>';
  html += '<div id="surveys-content"></div>';
  html += '</div>';

  app.innerHTML = html;

  app.querySelectorAll('.pe-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._surveysTab = btn.dataset.tab;
      renderSurveys();
    });
  });

  if (tab === 'results') renderSurveyResultsList();
  else if (tab === 'assign') renderSurveyAssign();
  else if (tab === 'instruments') renderSurveyInstruments();
}

function renderSurveyResultsList() {
  var container = document.getElementById('surveys-content');
  var results = getSurveyResults().sort(function(a, b) {
    return new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt);
  });

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header"><h3>All Survey Results</h3></div>';

  if (results.length === 0) {
    html += '<p class="text-muted" style="padding:20px">No survey results yet. Assign surveys from the "Assign Survey" tab.</p>';
  } else {
    html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Survey</th><th>Score</th><th>Severity</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
    results.forEach(function(r) {
      var pat = getPatient(r.patientId);
      var instrument = SURVEY_INSTRUMENTS[r.surveyType];
      var scoreInfo = instrument ? instrument.scoring(r.totalScore) : { severity: 'N/A', color: '#888' };
      html += '<tr>';
      html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
      html += '<td>' + esc(r.surveyType) + '</td>';
      html += '<td><strong>' + r.totalScore + '</strong>' + (instrument ? ' / ' + instrument.maxScore : '') + '</td>';
      html += '<td><span class="pe-severity-badge" style="background:' + scoreInfo.color + '">' + esc(r.status === 'Completed' ? scoreInfo.severity : '') + '</span></td>';
      html += '<td><span class="pe-badge pe-badge-' + (r.status === 'Completed' ? 'success' : r.status === 'Pending' ? 'warning' : 'info') + '">' + esc(r.status) + '</span></td>';
      html += '<td>' + formatDateTime(r.completedAt || r.createdAt) + '</td>';
      html += '<td>';
      if (r.status === 'Completed') {
        html += '<button class="btn btn-primary btn-sm survey-view-btn" data-id="' + esc(r.id) + '">View</button> ';
        html += '<button class="btn btn-secondary btn-sm survey-trend-btn" data-patient="' + esc(r.patientId) + '" data-type="' + esc(r.surveyType) + '">Trend</button>';
      }
      html += '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.survey-view-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openSurveyDetailModal(btn.dataset.id); });
  });
  container.querySelectorAll('.survey-trend-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openSurveyTrendModal(btn.dataset.patient, btn.dataset.type); });
  });
}

function openSurveyDetailModal(resultId) {
  var r = getSurveyResult(resultId);
  if (!r) return;
  var pat = getPatient(r.patientId);
  var instrument = SURVEY_INSTRUMENTS[r.surveyType];
  var scoreInfo = instrument ? instrument.scoring(r.totalScore) : { severity: 'N/A', color: '#888', action: '' };

  var body = '<div class="pe-survey-detail">';
  body += '<p><strong>Patient:</strong> ' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</p>';
  body += '<p><strong>Survey:</strong> ' + esc(r.surveyType) + (instrument ? ' — ' + esc(instrument.name) : '') + '</p>';
  body += '<p><strong>Date:</strong> ' + formatDateTime(r.completedAt) + '</p>';

  body += '<div class="pe-score-card" style="border-left:4px solid ' + scoreInfo.color + '">';
  body += '<div class="pe-score-number">' + r.totalScore + '<span class="pe-score-max"> / ' + (instrument ? instrument.maxScore : '?') + '</span></div>';
  body += '<div class="pe-score-severity" style="color:' + scoreInfo.color + '">' + esc(scoreInfo.severity) + '</div>';
  body += '<div class="pe-score-action"><strong>Recommended:</strong> ' + esc(scoreInfo.action) + '</div>';
  body += '</div>';

  if (instrument && r.answers) {
    body += '<h4 style="margin-top:16px">Responses</h4>';
    body += '<table class="pe-table pe-table-compact"><thead><tr><th>#</th><th>Question</th><th>Answer</th><th>Score</th></tr></thead><tbody>';
    instrument.questions.forEach(function(q, i) {
      var ans = r.answers[i];
      var opts = (instrument.optionsPerQuestion && instrument.optionsPerQuestion[i]) ? instrument.optionsPerQuestion[i] : instrument.options;
      var optLabel = '';
      if (ans !== undefined) {
        var foundOpt = opts.find(function(o) { return o.value === ans; });
        optLabel = foundOpt ? foundOpt.label : String(ans);
      }
      body += '<tr><td>' + (i + 1) + '</td><td>' + esc(q) + '</td><td>' + esc(optLabel) + '</td><td>' + (ans !== undefined ? ans : '-') + '</td></tr>';
    });
    body += '</tbody></table>';
  }
  body += '</div>';

  openModal({
    title: 'Survey Result: ' + r.surveyType,
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>'
  });
}

function openSurveyTrendModal(patientId, surveyType) {
  var pat = getPatient(patientId);
  var results = getSurveysByPatient(patientId).filter(function(r) {
    return r.surveyType === surveyType && r.status === 'Completed';
  }).sort(function(a, b) { return new Date(a.completedAt) - new Date(b.completedAt); });
  var instrument = SURVEY_INSTRUMENTS[surveyType];

  var body = '<div class="pe-survey-trend">';
  body += '<p><strong>Patient:</strong> ' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</p>';
  body += '<p><strong>Survey:</strong> ' + esc(surveyType) + '</p>';

  if (results.length < 2) {
    body += '<p class="text-muted">Need at least 2 completed surveys to show a trend.</p>';
  } else {
    /* Simple text-based trend graph */
    var maxScore = instrument ? instrument.maxScore : Math.max.apply(null, results.map(function(r) { return r.totalScore; }));
    body += '<div class="pe-trend-chart">';
    results.forEach(function(r) {
      var pct = maxScore > 0 ? Math.round((r.totalScore / maxScore) * 100) : 0;
      var scoreInfo = instrument ? instrument.scoring(r.totalScore) : { color: '#888' };
      var dateStr = r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      body += '<div class="pe-trend-row">';
      body += '<span class="pe-trend-date">' + esc(dateStr) + '</span>';
      body += '<div class="pe-trend-bar-bg"><div class="pe-trend-bar" style="width:' + pct + '%;background:' + scoreInfo.color + '"></div></div>';
      body += '<span class="pe-trend-score">' + r.totalScore + '</span>';
      body += '</div>';
    });
    body += '</div>';

    /* Direction */
    var first = results[0].totalScore;
    var last = results[results.length - 1].totalScore;
    if (last < first) body += '<p style="color:#22c55e;font-weight:600">Improving (score decreasing)</p>';
    else if (last > first) body += '<p style="color:#ef4444;font-weight:600">Worsening (score increasing)</p>';
    else body += '<p style="color:#888;font-weight:600">Stable (no change)</p>';
  }
  body += '</div>';

  openModal({
    title: 'Trend: ' + surveyType,
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>'
  });
}

/* ---------- Assign Survey ---------- */
function renderSurveyAssign() {
  var container = document.getElementById('surveys-content');
  var patients = getPatients().sort(function(a, b) { return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName); });

  var html = '<div class="pe-section">';
  html += '<h3>Assign a Survey</h3>';
  html += '<div class="form-group"><label>Patient *</label>';
  html += '<select class="form-control" id="survey-patient">';
  html += '<option value="">Select patient...</option>';
  patients.forEach(function(p) {
    html += '<option value="' + esc(p.id) + '">' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });
  html += '</select></div>';
  html += '<div class="form-group"><label>Survey Instrument *</label>';
  html += '<select class="form-control" id="survey-type">';
  html += '<option value="">Select survey...</option>';
  Object.keys(SURVEY_INSTRUMENTS).forEach(function(key) {
    var inst = SURVEY_INSTRUMENTS[key];
    html += '<option value="' + esc(key) + '">' + esc(inst.shortName) + ' — ' + esc(inst.category) + '</option>';
  });
  html += '</select></div>';
  html += '<div id="survey-preview" style="margin-bottom:16px"></div>';
  html += '<button class="btn btn-primary" id="survey-assign-btn">Assign Survey</button>';
  html += '</div>';

  container.innerHTML = html;

  document.getElementById('survey-type').addEventListener('change', function() {
    var type = this.value;
    var preview = document.getElementById('survey-preview');
    if (!type || !SURVEY_INSTRUMENTS[type]) { preview.innerHTML = ''; return; }
    var inst = SURVEY_INSTRUMENTS[type];
    preview.innerHTML = '<div class="pe-info-box"><strong>' + esc(inst.name) + '</strong><p>' + esc(inst.description) + '</p><p class="text-muted">' + inst.questions.length + ' questions, max score: ' + inst.maxScore + '</p></div>';
  });

  document.getElementById('survey-assign-btn').addEventListener('click', function() {
    var patientId = document.getElementById('survey-patient').value;
    var surveyType = document.getElementById('survey-type').value;
    if (!patientId || !surveyType) { showToast('Please select a patient and survey', 'error'); return; }
    var user = getSessionUser();
    saveSurveyResult({
      patientId: patientId,
      surveyType: surveyType,
      orderedBy: user ? user.id : '',
      status: 'Pending'
    });
    showToast('Survey assigned successfully', 'success');
    window._surveysTab = 'results';
    renderSurveys();
  });
}

/* ---------- Instruments Reference ---------- */
function renderSurveyInstruments() {
  var container = document.getElementById('surveys-content');
  var html = '<div class="pe-section">';
  html += '<h3>Available Instruments</h3>';

  Object.keys(SURVEY_INSTRUMENTS).forEach(function(key) {
    var inst = SURVEY_INSTRUMENTS[key];
    html += '<div class="pe-instrument-card">';
    html += '<div class="pe-instrument-header">';
    html += '<h4>' + esc(inst.name) + '</h4>';
    html += '<span class="pe-badge pe-badge-info">' + esc(inst.category) + '</span>';
    html += '</div>';
    html += '<p>' + esc(inst.description) + '</p>';
    html += '<p class="text-muted">' + inst.questions.length + ' questions | Max score: ' + inst.maxScore + '</p>';

    /* Show scoring ranges */
    html += '<div class="pe-scoring-ranges">';
    var testScores = [];
    for (var s = 0; s <= inst.maxScore; s++) testScores.push(s);
    var ranges = {};
    testScores.forEach(function(sc) {
      var info = inst.scoring(sc);
      if (!ranges[info.severity]) ranges[info.severity] = { min: sc, max: sc, color: info.color, action: info.action };
      else ranges[info.severity].max = sc;
    });
    Object.keys(ranges).forEach(function(sev) {
      var r = ranges[sev];
      html += '<div class="pe-scoring-range">';
      html += '<span class="pe-severity-dot" style="background:' + r.color + '"></span>';
      html += '<strong>' + esc(sev) + '</strong> (' + r.min + '-' + r.max + '): ' + esc(r.action);
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

/* ---------- Portal: Patient Takes Survey ---------- */
function renderPortalSurveys(container, patient) {
  var pending = getSurveysByPatient(patient.id).filter(function(r) { return r.status === 'Pending'; });
  var completed = getSurveysByPatient(patient.id).filter(function(r) { return r.status === 'Completed'; });

  var html = '<div class="portal-card">';
  html += '<h3>My Surveys</h3>';

  if (pending.length > 0) {
    html += '<h4>Pending Surveys</h4>';
    pending.forEach(function(r) {
      var inst = SURVEY_INSTRUMENTS[r.surveyType];
      html += '<div class="pe-appt-card">';
      html += '<div><strong>' + esc(inst ? inst.name : r.surveyType) + '</strong></div>';
      html += '<div class="text-muted text-sm">' + esc(inst ? inst.description : '') + '</div>';
      html += '<button class="btn btn-primary btn-sm portal-take-survey" data-id="' + esc(r.id) + '">Take Survey</button>';
      html += '</div>';
    });
  }

  if (completed.length > 0) {
    html += '<h4 style="margin-top:16px">Completed Surveys</h4>';
    completed.slice(0, 10).forEach(function(r) {
      var inst = SURVEY_INSTRUMENTS[r.surveyType];
      var scoreInfo = inst ? inst.scoring(r.totalScore) : { severity: 'N/A', color: '#888' };
      html += '<div class="pe-appt-card">';
      html += '<div><strong>' + esc(r.surveyType) + '</strong> — ' + formatDateTime(r.completedAt) + '</div>';
      html += '<div>Score: <strong>' + r.totalScore + '</strong>' + (inst ? ' / ' + inst.maxScore : '') + ' <span class="pe-severity-badge" style="background:' + scoreInfo.color + '">' + esc(scoreInfo.severity) + '</span></div>';
      html += '</div>';
    });
  }

  if (pending.length === 0 && completed.length === 0) {
    html += '<p class="text-muted">No surveys assigned.</p>';
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.portal-take-survey').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openPortalSurveyModal(btn.dataset.id, patient);
    });
  });
}

function openPortalSurveyModal(resultId, patient) {
  var r = getSurveyResult(resultId);
  if (!r) return;
  var inst = SURVEY_INSTRUMENTS[r.surveyType];
  if (!inst) return;

  var body = '<div class="pe-survey-take">';
  body += '<p class="text-muted">' + esc(inst.description) + '</p>';
  body += '<p class="text-sm">Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following?</p>';

  inst.questions.forEach(function(q, i) {
    var opts = (inst.optionsPerQuestion && inst.optionsPerQuestion[i]) ? inst.optionsPerQuestion[i] : inst.options;
    body += '<div class="pe-survey-q">';
    body += '<div class="pe-survey-q-text">' + (i + 1) + '. ' + esc(q) + '</div>';
    body += '<div class="pe-survey-q-options">';
    opts.forEach(function(opt) {
      body += '<label class="pe-survey-option">';
      body += '<input type="radio" name="sq_' + i + '" value="' + opt.value + '" /> ' + esc(opt.label);
      body += '</label>';
    });
    body += '</div></div>';
  });
  body += '</div>';

  openModal({
    title: inst.shortName,
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="survey-submit-btn" style="background:#0d9488">Submit Survey</button>'
  });

  document.getElementById('survey-submit-btn').addEventListener('click', function() {
    var answers = [];
    var allAnswered = true;
    for (var i = 0; i < inst.questions.length; i++) {
      var selected = document.querySelector('input[name="sq_' + i + '"]:checked');
      if (!selected) { allAnswered = false; answers.push(undefined); }
      else answers.push(parseInt(selected.value));
    }
    if (!allAnswered) { showToast('Please answer all questions', 'error'); return; }

    var total = answers.reduce(function(sum, v) { return sum + (v || 0); }, 0);
    var scoreInfo = inst.scoring(total);

    saveSurveyResult({
      id: r.id,
      answers: answers,
      totalScore: total,
      severity: scoreInfo.severity,
      interpretation: scoreInfo.severity + ' (' + total + '/' + inst.maxScore + ')',
      recommendedAction: scoreInfo.action,
      status: 'Completed',
      completedAt: new Date().toISOString()
    });

    closeModal();
    showToast('Survey completed. Score: ' + total + ' — ' + scoreInfo.severity, 'success');
    renderPatientPortal();
  });
}

/* ---------- Chart Integration: Assign from Chart ---------- */
function openAssignSurveyFromChart(patientId) {
  var body = '<div class="form-group"><label>Survey Instrument</label>';
  body += '<select class="form-control" id="chart-survey-type">';
  Object.keys(SURVEY_INSTRUMENTS).forEach(function(key) {
    var inst = SURVEY_INSTRUMENTS[key];
    body += '<option value="' + esc(key) + '">' + esc(inst.shortName) + ' — ' + esc(inst.category) + '</option>';
  });
  body += '</select></div>';

  openModal({
    title: 'Assign Survey',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="chart-survey-assign">Assign</button>'
  });

  document.getElementById('chart-survey-assign').addEventListener('click', function() {
    var surveyType = document.getElementById('chart-survey-type').value;
    var user = getSessionUser();
    saveSurveyResult({
      patientId: patientId,
      surveyType: surveyType,
      orderedBy: user ? user.id : '',
      status: 'Pending'
    });
    closeModal();
    showToast('Survey assigned', 'success');
  });
}
