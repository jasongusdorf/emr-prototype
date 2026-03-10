/* ============================================================
   views/speech-therapy.js — Speech-Language Pathology Module
   Evaluations, Swallowing, Language/Cognition, Sessions, Goals
   ============================================================ */

function _injectSLPCSS() {
  if (document.getElementById('slp-styles')) return;
  var s = document.createElement('style');
  s.id = 'slp-styles';
  s.textContent = [
    '.slp-wrap { padding:24px; max-width:1100px; margin:0 auto; }',
    '.slp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.slp-tabs { display:flex; gap:0; border-bottom:2px solid var(--border,#ddd); margin-bottom:20px; }',
    '.slp-tab { padding:10px 20px; cursor:pointer; font-weight:500; border-bottom:2px solid transparent; margin-bottom:-2px; color:var(--text-secondary,#666); }',
    '.slp-tab.active { color:var(--accent-slp); border-bottom-color:var(--accent-slp); }',
    '.slp-tab:hover { color:var(--accent-slp); }',
    '.slp-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-bottom:12px; }',
    '.slp-card h4 { margin:0 0 10px 0; color:var(--accent-slp); }',
    '.slp-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; }',
    '.slp-field { display:flex; flex-direction:column; gap:4px; min-width:160px; flex:1; }',
    '.slp-field label { font-size:13px; font-weight:500; color:var(--text-secondary,#666); }',
    '.slp-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:500; }',
    '.slp-badge-swallow { background:#fde68a; color:#92400e; }',
    '.slp-badge-language { background:#c7d2fe; color:#3730a3; }',
    '.slp-badge-voice { background:#fbcfe8; color:#9d174d; }',
    '.slp-badge-aac { background:#a7f3d0; color:#065f46; }',
    '.slp-badge-active { background:#d4edda; color:#155724; }',
    '.slp-badge-met { background:#cce5ff; color:#004085; }',
    '.slp-badge-modified { background:#fff3cd; color:#856404; }',
    '.slp-badge-discontinued { background:#e2e3e5; color:#383d41; }',
    '.slp-active-diet { background:linear-gradient(135deg,#ede9fe,#f5f3ff); border:2px solid var(--accent-slp); border-radius:var(--radius,8px); padding:20px; margin-bottom:16px; }',
    '.slp-active-diet h3 { margin:0 0 12px 0; color:var(--accent-slp); }',
    '.slp-precautions { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }',
    '.slp-precaution-tag { background:var(--badge-warning-bg); border:1px solid var(--warning); border-radius:16px; padding:4px 12px; font-size:13px; font-weight:500; color:#92400e; }',
    '.slp-fois-item { display:flex; align-items:center; gap:12px; padding:8px 12px; border-bottom:1px solid var(--border,#eee); }',
    '.slp-fois-level { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; font-size:14px; }',
    '.slp-table { width:100%; border-collapse:collapse; font-size:13px; }',
    '.slp-table th { text-align:left; padding:8px; border-bottom:2px solid var(--border,#ddd); color:var(--accent-slp); font-size:12px; text-transform:uppercase; }',
    '.slp-table td { padding:8px; border-bottom:1px solid var(--border,#eee); }',
    '.slp-goal-card { background:var(--bg-card,#fff); border-left:4px solid var(--accent-slp); border-radius:var(--radius,8px); padding:14px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }',
    '.slp-goal-card.goal-met { border-left-color:#28a745; opacity:0.8; }',
    '.slp-goal-card.goal-dc { border-left-color:#6c757d; opacity:0.7; }',
    '.slp-progress-entry { font-size:12px; padding:4px 8px; background:var(--bg-main,#f8f9fa); border-radius:4px; margin-top:4px; }',
    '.slp-section-title { font-size:15px; font-weight:600; color:var(--accent-slp); margin:16px 0 8px 0; padding-bottom:4px; border-bottom:1px solid #ede9fe; }',
    '.slp-iddsi-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border,#eee); }',
    '.slp-iddsi-level { width:28px; height:28px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; font-size:12px; }',
    '.slp-modal-section { background:var(--bg-main,#f8f9fa); border-radius:var(--radius,8px); padding:14px; margin-bottom:14px; }',
    '.slp-modal-section h5 { margin:0 0 10px 0; color:var(--accent-slp); font-size:14px; }',
    '.slp-cpt-ref { background:#f5f3ff; border:1px solid #c4b5fd; border-radius:var(--radius,8px); padding:10px; margin-top:12px; font-size:12px; color:#5b21b6; }',
    '.slp-aphasia-badge { display:inline-block; padding:4px 12px; border-radius:16px; font-size:14px; font-weight:600; background:var(--accent-slp); color:#fff; margin:8px 0; }',
    '.slp-summary-pair { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }',
    '@media (max-width:768px) { .slp-summary-pair { grid-template-columns:1fr; } .slp-row { flex-direction:column; } }'
  ].join('\n');
  document.head.appendChild(s);
}

/* ---- IDDSI Constants ---- */
var SLP_IDDSI_LEVELS = [
  { level: 0, name: 'Thin', color: '#94a3b8' },
  { level: 1, name: 'Slightly Thick', color: '#7dd3fc' },
  { level: 2, name: 'Mildly Thick', color: '#86efac' },
  { level: 3, name: 'Moderately Thick', color: '#fde047' },
  { level: 4, name: 'Pureed', color: '#fb923c' },
  { level: 5, name: 'Minced & Moist', color: '#f87171' },
  { level: 6, name: 'Soft & Bite-Sized', color: '#c084fc' },
  { level: 7, name: 'Regular', color: '#4ade80' }
];

var SLP_FOIS_DESCRIPTIONS = [
  '',
  'Nothing by mouth',
  'Tube dependent with minimal PO attempts',
  'Tube dependent with consistent PO intake',
  'Total PO diet of single consistency',
  'Total PO with multiple consistencies, special prep needed',
  'Total PO, no special prep, specific food limitations',
  'Total PO, no restrictions'
];

var SLP_ASPIRATION_PRECAUTIONS = [
  'HOB >=30 degrees',
  'Supervised meals',
  'Small bites/sips',
  'Alternate solids & liquids',
  'Pacing cues',
  'Chin tuck',
  'Double swallow',
  'No straws',
  'Remain upright 30min post-meal'
];

var SLP_GOAL_TEMPLATES = [
  'Patient will swallow [consistency] with [strategy] without signs of aspiration in X/Y trials',
  'Patient will follow [X]-step commands with [cue level] accuracy in X% of trials',
  'Patient will name [X] items in [category] with [cue level] in X% of trials',
  'Patient will produce [sound] in [position] with X% accuracy'
];

/* ---- Aphasia classification helper ---- */
function _slpClassifyAphasia(fluency, comprehension, repetition, naming) {
  if (fluency === 'Non-fluent' && comprehension !== 'Intact') return 'Global';
  if (fluency === 'Non-fluent' && comprehension === 'Intact') return "Broca's";
  if (fluency === 'Fluent' && comprehension !== 'Intact') return "Wernicke's";
  if (fluency === 'Fluent' && comprehension === 'Intact' && naming !== 'Intact') return 'Anomic';
  if (fluency === 'Fluent' && comprehension === 'Intact' && repetition === 'Impaired') return 'Conduction';
  return 'Unclassified';
}

/* ---- Main render ---- */
function renderSpeechTherapy(patientId) {
  _injectSLPCSS();
  var app = document.getElementById('app');
  var patient = getPatient(patientId);
  if (!patient) {
    app.innerHTML = '<div style="padding:40px;text-align:center"><h2>Patient not found</h2></div>';
    return;
  }

  var activeTab = 'evaluations';

  function build() {
    var html = '<div class="slp-wrap">';
    html += buildPatientBanner(patientId);
    html += '<div class="slp-header"><h2 style="color:var(--accent-slp)">Speech-Language Pathology</h2></div>';

    // Tabs
    html += '<div class="slp-tabs">';
    var tabs = [
      { key: 'evaluations', label: 'Evaluations' },
      { key: 'swallowing', label: 'Swallowing' },
      { key: 'language', label: 'Language/Cognition' },
      { key: 'sessions', label: 'Treatment Sessions' },
      { key: 'goals', label: 'Goals' }
    ];
    tabs.forEach(function(t) {
      html += '<div class="slp-tab' + (activeTab === t.key ? ' active' : '') + '" data-tab="' + t.key + '">' + t.label + '</div>';
    });
    html += '</div>';

    // Tab content
    if (activeTab === 'evaluations') html += _buildEvaluationsTab(patientId);
    else if (activeTab === 'swallowing') html += _buildSwallowingTab(patientId);
    else if (activeTab === 'language') html += _buildLanguageTab(patientId);
    else if (activeTab === 'sessions') html += _buildSessionsTab(patientId);
    else if (activeTab === 'goals') html += _buildGoalsTab(patientId);

    html += '</div>';
    app.innerHTML = html;

    // Wire tab clicks
    app.querySelectorAll('.slp-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { activeTab = this.getAttribute('data-tab'); build(); });
    });

    // Wire buttons per tab
    _wireTabEvents(patientId);
  }

  function _wireTabEvents(pid) {
    // Evaluations tab buttons
    var btnSwallowEval = document.getElementById('slp-btn-swallow-eval');
    if (btnSwallowEval) btnSwallowEval.addEventListener('click', function() { openSwallowEvalModal(pid, null, build); });
    var btnLangEval = document.getElementById('slp-btn-lang-eval');
    if (btnLangEval) btnLangEval.addEventListener('click', function() { openLanguageAssessmentModal(pid, null, build); });
    var btnVoiceEval = document.getElementById('slp-btn-voice-eval');
    if (btnVoiceEval) btnVoiceEval.addEventListener('click', function() { openVoiceAssessmentModal(pid, null, build); });

    // Edit buttons on eval cards
    app.querySelectorAll('.slp-edit-eval').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var evalId = this.getAttribute('data-id');
        var evalType = this.getAttribute('data-type');
        var evals = getSLPEvaluations(pid);
        var ev = evals.find(function(e) { return e.id === evalId; });
        if (!ev) return;
        if (evalType === 'swallow') openSwallowEvalModal(pid, ev, build);
        else if (evalType === 'language') openLanguageAssessmentModal(pid, ev, build);
        else if (evalType === 'voice') openVoiceAssessmentModal(pid, ev, build);
      });
    });

    // Swallowing tab buttons
    var btnDietRec = document.getElementById('slp-btn-diet-rec');
    if (btnDietRec) btnDietRec.addEventListener('click', function() { openSLPDietRecModal(pid, build); });
    var btnFois = document.getElementById('slp-btn-fois');
    if (btnFois) btnFois.addEventListener('click', function() { openFOISModal(pid, build); });
    var btnPrintPrec = document.getElementById('slp-btn-print-precautions');
    if (btnPrintPrec) btnPrintPrec.addEventListener('click', function() { _printPrecautions(pid); });

    // Language tab buttons
    var btnAAC = document.getElementById('slp-btn-aac');
    if (btnAAC) btnAAC.addEventListener('click', function() { openAACModal(pid, null, build); });

    // Sessions tab buttons
    var btnSession = document.getElementById('slp-btn-new-session');
    if (btnSession) btnSession.addEventListener('click', function() { openSLPSessionModal(pid, null, build); });
    app.querySelectorAll('.slp-view-session').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var sid = this.getAttribute('data-id');
        var sessions = getSLPSessions(pid);
        var sess = sessions.find(function(s) { return s.id === sid; });
        if (sess) openSLPSessionModal(pid, sess, build);
      });
    });

    // Goals tab buttons
    var btnGoal = document.getElementById('slp-btn-new-goal');
    if (btnGoal) btnGoal.addEventListener('click', function() { openSLPGoalModal(pid, null, build); });
    app.querySelectorAll('.slp-edit-goal').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var gid = this.getAttribute('data-id');
        var goals = getSLPGoals(pid);
        var g = goals.find(function(x) { return x.id === gid; });
        if (g) openSLPGoalModal(pid, g, build);
      });
    });
    app.querySelectorAll('.slp-add-progress').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var gid = this.getAttribute('data-id');
        var goals = getSLPGoals(pid);
        var g = goals.find(function(x) { return x.id === gid; });
        if (g) openProgressModal(pid, g, build);
      });
    });
  }

  build();
}

/* ================================================================
   TAB BUILDERS
   ================================================================ */

function _buildEvaluationsTab(pid) {
  var html = '';
  html += '<div class="slp-row" style="margin-bottom:16px">';
  html += '<button class="btn btn-primary" id="slp-btn-swallow-eval" style="background:var(--accent-slp);border-color:var(--accent-slp)">+ Bedside Swallow Eval</button>';
  html += '<button class="btn btn-primary" id="slp-btn-lang-eval" style="background:var(--accent-slp);border-color:var(--accent-slp)">+ Language/Cognitive Assessment</button>';
  html += '<button class="btn btn-primary" id="slp-btn-voice-eval" style="background:var(--accent-slp);border-color:var(--accent-slp)">+ Voice Assessment</button>';
  html += '</div>';

  var evals = getSLPEvaluations(pid).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });

  // Group by type
  var groups = { swallow: [], language: [], voice: [], aac: [] };
  evals.forEach(function(ev) {
    var t = ev.type || 'swallow';
    if (groups[t]) groups[t].push(ev);
  });

  var typeLabels = { swallow: 'Swallow Evaluations', language: 'Language/Cognitive Assessments', voice: 'Voice Assessments' };
  ['swallow', 'language', 'voice'].forEach(function(type) {
    var items = groups[type];
    html += '<div class="slp-section-title">' + typeLabels[type] + ' (' + items.length + ')</div>';
    if (!items.length) {
      html += '<p style="color:var(--text-secondary,#666);font-size:13px;padding:8px 0">No ' + type + ' evaluations recorded.</p>';
      return;
    }
    items.forEach(function(ev) {
      var badgeCls = 'slp-badge-' + type;
      html += '<div class="slp-card">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<div><span class="slp-badge ' + badgeCls + '">' + esc(type.charAt(0).toUpperCase() + type.slice(1)) + '</span>';
      html += ' <span style="font-size:13px;color:var(--text-secondary,#666)">' + formatDateTime(ev.createdAt) + '</span></div>';
      html += '<button class="btn btn-sm btn-outline-primary slp-edit-eval" data-id="' + ev.id + '" data-type="' + type + '">Edit</button>';
      html += '</div>';
      html += '<div style="margin-top:8px;font-size:13px">' + esc(_slpEvalSummary(ev)) + '</div>';
      html += '</div>';
    });
  });

  return html;
}

function _slpEvalSummary(ev) {
  if (ev.type === 'swallow') {
    var parts = [];
    if (ev.aspirationRisk) parts.push('Aspiration Risk: ' + ev.aspirationRisk);
    if (ev.recFoodLevel !== undefined && ev.recFoodLevel !== '') parts.push('Rec Food IDDSI: ' + ev.recFoodLevel);
    if (ev.recLiquidLevel !== undefined && ev.recLiquidLevel !== '') parts.push('Rec Liquid IDDSI: ' + ev.recLiquidLevel);
    if (ev.instrumentalNeeded === 'Yes') parts.push('Instrumental study needed: ' + (ev.instrumentalType || 'TBD'));
    return parts.join(' | ') || 'Bedside swallow evaluation completed';
  }
  if (ev.type === 'language') {
    var parts2 = [];
    if (ev.aphasiaType && ev.aphasiaType !== 'Unclassified') parts2.push('Aphasia: ' + ev.aphasiaType);
    if (ev.testName) parts2.push('Test: ' + ev.testName + (ev.testScore ? ' (' + ev.testScore + ')' : ''));
    return parts2.join(' | ') || 'Language/cognitive assessment completed';
  }
  if (ev.type === 'voice') {
    var parts3 = [];
    var gSum = (ev.grbasGrade || 0) + (ev.grbasRoughness || 0) + (ev.grbasBreathiness || 0) + (ev.grbasAsthenia || 0) + (ev.grbasStrain || 0);
    parts3.push('GRBAS Sum: ' + gSum);
    if (ev.mpt) parts3.push('MPT: ' + ev.mpt + 's');
    if (ev.szRatio) parts3.push('s/z: ' + ev.szRatio);
    return parts3.join(' | ') || 'Voice assessment completed';
  }
  return 'Evaluation completed';
}

function _buildSwallowingTab(pid) {
  var html = '';

  // Active diet recommendation
  var dietRecs = getSLPDietRecommendations(pid).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
  var activeDiet = dietRecs.length > 0 ? dietRecs[0] : null;

  if (activeDiet) {
    var foodInfo = SLP_IDDSI_LEVELS.find(function(l) { return l.level == activeDiet.foodLevel; });
    var liqInfo = SLP_IDDSI_LEVELS.find(function(l) { return l.level == activeDiet.liquidLevel; });
    html += '<div class="slp-active-diet">';
    html += '<h3>Current Diet Recommendation</h3>';
    html += '<div class="slp-row">';
    html += '<div class="slp-field"><label>Food Level</label><div style="font-size:18px;font-weight:600">';
    if (foodInfo) html += '<span class="slp-iddsi-level" style="background:' + foodInfo.color + ';display:inline-flex;width:28px;height:28px;margin-right:6px">' + foodInfo.level + '</span>';
    html += esc(foodInfo ? foodInfo.name : 'IDDSI ' + activeDiet.foodLevel);
    html += '</div></div>';
    html += '<div class="slp-field"><label>Liquid Level</label><div style="font-size:18px;font-weight:600">';
    if (liqInfo) html += '<span class="slp-iddsi-level" style="background:' + liqInfo.color + ';display:inline-flex;width:28px;height:28px;margin-right:6px">' + liqInfo.level + '</span>';
    html += esc(liqInfo ? liqInfo.name : 'IDDSI ' + activeDiet.liquidLevel);
    html += '</div></div>';
    html += '</div>';
    if (activeDiet.precautions && activeDiet.precautions.length) {
      html += '<div style="margin-top:8px"><label style="font-size:13px;font-weight:500;color:var(--text-secondary,#666)">Aspiration Precautions</label>';
      html += '<div class="slp-precautions">';
      activeDiet.precautions.forEach(function(p) {
        html += '<span class="slp-precaution-tag">' + esc(p) + '</span>';
      });
      html += '</div></div>';
    }
    if (activeDiet.specialInstructions) {
      html += '<div style="margin-top:8px;font-size:13px"><strong>Instructions:</strong> ' + esc(activeDiet.specialInstructions) + '</div>';
    }
    html += '<div style="margin-top:8px;font-size:12px;color:var(--text-secondary,#666)">Set: ' + formatDateTime(activeDiet.createdAt);
    if (activeDiet.reviewDate) html += ' | Review by: ' + esc(activeDiet.reviewDate);
    html += '</div>';
    html += '</div>';
  }

  html += '<div class="slp-row" style="margin-bottom:16px">';
  html += '<button class="btn btn-primary" id="slp-btn-diet-rec" style="background:var(--accent-slp);border-color:var(--accent-slp)">+ Diet Recommendation</button>';
  html += '<button class="btn btn-primary" id="slp-btn-fois" style="background:var(--accent-slp);border-color:var(--accent-slp)">+ FOIS Assessment</button>';
  if (activeDiet && activeDiet.precautions && activeDiet.precautions.length) {
    html += '<button class="btn btn-outline-primary" id="slp-btn-print-precautions" style="color:var(--accent-slp);border-color:var(--accent-slp)">Print Precautions</button>';
  }
  html += '</div>';

  // FOIS tracking
  var evals = getSLPEvaluations(pid).filter(function(e) { return e.type === 'fois'; }).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
  if (evals.length) {
    html += '<div class="slp-section-title">FOIS Tracking</div>';
    html += '<div class="slp-card">';
    evals.forEach(function(ev) {
      var lvl = ev.foisLevel || 1;
      var pct = Math.round((lvl / 7) * 100);
      var color = lvl <= 2 ? 'var(--danger)' : lvl <= 4 ? 'var(--warning)' : 'var(--success)';
      html += '<div class="slp-fois-item">';
      html += '<div class="slp-fois-level" style="background:' + color + '">' + lvl + '</div>';
      html += '<div style="flex:1"><div style="font-weight:500">Level ' + lvl + ': ' + esc(SLP_FOIS_DESCRIPTIONS[lvl] || '') + '</div>';
      html += '<div style="font-size:12px;color:var(--text-secondary,#666)">' + formatDateTime(ev.createdAt) + '</div></div>';
      html += '<div style="width:80px;background:#e5e7eb;border-radius:4px;height:8px"><div style="width:' + pct + '%;background:' + color + ';border-radius:4px;height:8px"></div></div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Aspiration Precautions card
  if (activeDiet && activeDiet.precautions && activeDiet.precautions.length) {
    html += '<div class="slp-section-title">Active Aspiration Precautions</div>';
    html += '<div class="slp-card" style="border:2px solid var(--warning);background:#fffbeb">';
    html += '<h4 style="color:#92400e;margin-bottom:8px">Aspiration Precautions</h4>';
    activeDiet.precautions.forEach(function(p) {
      html += '<div style="padding:4px 0;font-size:14px"><span style="color:var(--success);margin-right:6px">&#10003;</span>' + esc(p) + '</div>';
    });
    html += '</div>';
  }

  // Diet recommendation history
  if (dietRecs.length > 1) {
    html += '<div class="slp-section-title">Diet Recommendation History</div>';
    dietRecs.slice(1).forEach(function(rec) {
      var fi = SLP_IDDSI_LEVELS.find(function(l) { return l.level == rec.foodLevel; });
      var li = SLP_IDDSI_LEVELS.find(function(l) { return l.level == rec.liquidLevel; });
      html += '<div class="slp-card">';
      html += '<span style="font-size:13px;color:var(--text-secondary,#666)">' + formatDateTime(rec.createdAt) + '</span>';
      html += '<div>Food: ' + esc(fi ? fi.name + ' (IDDSI ' + fi.level + ')' : 'IDDSI ' + rec.foodLevel) + ' | Liquid: ' + esc(li ? li.name + ' (IDDSI ' + li.level + ')' : 'IDDSI ' + rec.liquidLevel) + '</div>';
      html += '</div>';
    });
  }

  return html;
}

function _buildLanguageTab(pid) {
  var html = '';
  var evals = getSLPEvaluations(pid);
  var langEvals = evals.filter(function(e) { return e.type === 'language'; }).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
  var aacEvals = evals.filter(function(e) { return e.type === 'aac'; }).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });

  // Assessment summary - latest side by side
  var latestLang = langEvals.length > 0 ? langEvals[0] : null;

  html += '<div class="slp-section-title">Assessment Summary</div>';
  html += '<div class="slp-summary-pair">';

  // Aphasia summary
  html += '<div class="slp-card">';
  html += '<h4>Aphasia Screening</h4>';
  if (latestLang && latestLang.aphasiaType && latestLang.aphasiaType !== 'Unclassified') {
    html += '<div class="slp-aphasia-badge">' + esc(latestLang.aphasiaType) + ' Aphasia</div>';
    html += '<div style="font-size:13px;margin-top:6px">';
    html += 'Fluency: ' + esc(latestLang.fluency || '') + '<br>';
    html += 'Comprehension: ' + esc(latestLang.comprehension || '') + '<br>';
    html += 'Repetition: ' + esc(latestLang.repetition || '') + '<br>';
    html += 'Naming: ' + esc(latestLang.naming || '') + '<br>';
    html += 'Reading: ' + esc(latestLang.reading || '') + '<br>';
    html += 'Writing: ' + esc(latestLang.writing || '');
    html += '</div>';
  } else if (latestLang) {
    html += '<div style="font-size:13px">No aphasia classification indicated.</div>';
  } else {
    html += '<div style="font-size:13px;color:var(--text-secondary,#666)">No language assessment on file.</div>';
  }
  html += '</div>';

  // Cognitive summary
  html += '<div class="slp-card">';
  html += '<h4>Cognitive-Communication</h4>';
  if (latestLang && latestLang.orientation) {
    html += '<div style="font-size:13px">';
    html += '<strong>Orientation:</strong> ';
    var orientItems = [];
    ['Person', 'Place', 'Time', 'Situation'].forEach(function(o) {
      if (latestLang.orientation && latestLang.orientation[o]) orientItems.push(o + ': ' + latestLang.orientation[o]);
    });
    html += esc(orientItems.join(', ')) + '<br>';

    if (latestLang.attention) {
      html += '<strong>Attention:</strong> ';
      var attItems = [];
      ['Sustained', 'Selective', 'Divided', 'Alternating'].forEach(function(a) {
        if (latestLang.attention[a]) attItems.push(a + ': ' + latestLang.attention[a]);
      });
      html += esc(attItems.join(', ')) + '<br>';
    }
    if (latestLang.memory) {
      html += '<strong>Memory:</strong> ';
      var memItems = [];
      ['Immediate', 'Short-term', 'Long-term', 'Prospective'].forEach(function(m) {
        if (latestLang.memory[m]) memItems.push(m + ': ' + latestLang.memory[m]);
      });
      html += esc(memItems.join(', ')) + '<br>';
    }
    if (latestLang.ranchoLevel) html += '<strong>Rancho Los Amigos:</strong> Level ' + esc(String(latestLang.ranchoLevel)) + '<br>';
    html += '</div>';
  } else {
    html += '<div style="font-size:13px;color:var(--text-secondary,#666)">No cognitive screening on file.</div>';
  }
  html += '</div>';
  html += '</div>'; // end summary-pair

  // AAC section
  html += '<div class="slp-section-title">AAC Documentation</div>';
  html += '<button class="btn btn-primary" id="slp-btn-aac" style="background:var(--accent-slp);border-color:var(--accent-slp);margin-bottom:12px">+ AAC Documentation</button>';
  if (aacEvals.length) {
    aacEvals.forEach(function(aac) {
      html += '<div class="slp-card">';
      html += '<span class="slp-badge slp-badge-aac">AAC</span> <span style="font-size:13px;color:var(--text-secondary,#666)">' + formatDateTime(aac.createdAt) + '</span>';
      html += '<div style="margin-top:8px;font-size:13px">';
      if (aac.deviceType) html += '<strong>Device:</strong> ' + esc(aac.deviceType) + (aac.deviceName ? ' (' + esc(aac.deviceName) + ')' : '') + '<br>';
      if (aac.accessMethod) html += '<strong>Access:</strong> ' + esc(aac.accessMethod) + '<br>';
      if (aac.vocabType) html += '<strong>Vocabulary:</strong> ' + esc(aac.vocabType) + '<br>';
      if (aac.partners && aac.partners.length) {
        html += '<strong>Partners:</strong> ';
        html += aac.partners.map(function(p) { return esc(p.name) + ' (' + esc(p.relationship) + ' - ' + esc(p.status) + ')'; }).join('; ');
        html += '<br>';
      }
      if (aac.deviceNotes) html += '<strong>Notes:</strong> ' + esc(aac.deviceNotes);
      html += '</div></div>';
    });
  }

  // Standardized test history
  var tests = langEvals.filter(function(e) { return e.testName; });
  if (tests.length) {
    html += '<div class="slp-section-title">Standardized Test History</div>';
    html += '<table class="slp-table"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>Interpretation</th></tr></thead><tbody>';
    tests.forEach(function(t) {
      html += '<tr><td>' + formatDateTime(t.createdAt) + '</td><td>' + esc(t.testName || '') + '</td><td>' + esc(String(t.testScore || '')) + '</td><td>' + esc(t.testInterpretation || '') + '</td></tr>';
    });
    html += '</tbody></table>';
  }

  return html;
}

function _buildSessionsTab(pid) {
  var html = '';
  html += '<button class="btn btn-primary" id="slp-btn-new-session" style="background:var(--accent-slp);border-color:var(--accent-slp);margin-bottom:16px">+ New Session</button>';

  var sessions = getSLPSessions(pid).sort(function(a, b) { return new Date(b.sessionDate || b.createdAt || 0) - new Date(a.sessionDate || a.createdAt || 0); });

  if (!sessions.length) {
    html += '<p style="color:var(--text-secondary,#666);text-align:center;padding:40px">No treatment sessions recorded.</p>';
    return html;
  }

  html += '<table class="slp-table"><thead><tr><th>Date</th><th>Duration</th><th>Treatment Areas</th><th>Provider</th><th></th></tr></thead><tbody>';
  sessions.forEach(function(s) {
    html += '<tr>';
    html += '<td>' + formatDateTime(s.sessionDate || s.createdAt) + '</td>';
    html += '<td>' + esc(String(s.duration || '')) + ' min</td>';
    html += '<td>';
    (s.treatmentAreas || []).forEach(function(a) {
      html += '<span class="slp-badge slp-badge-swallow" style="margin-right:4px">' + esc(a) + '</span>';
    });
    html += '</td>';
    html += '<td>' + esc(s.providerName || '') + '</td>';
    html += '<td><button class="btn btn-sm btn-outline-primary slp-view-session" data-id="' + s.id + '">View</button></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';

  return html;
}

function _buildGoalsTab(pid) {
  var html = '';
  html += '<button class="btn btn-primary" id="slp-btn-new-goal" style="background:var(--accent-slp);border-color:var(--accent-slp);margin-bottom:16px">+ New Goal</button>';

  var goals = getSLPGoals(pid).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });

  if (!goals.length) {
    html += '<p style="color:var(--text-secondary,#666);text-align:center;padding:40px">No SLP goals set.</p>';
    return html;
  }

  // Group by domain
  var domains = {};
  goals.forEach(function(g) {
    var d = g.domain || 'Other';
    if (!domains[d]) domains[d] = [];
    domains[d].push(g);
  });

  Object.keys(domains).forEach(function(domain) {
    html += '<div class="slp-section-title">' + esc(domain) + '</div>';
    // Active goals first
    var active = domains[domain].filter(function(g) { return g.status === 'Active'; });
    var inactive = domains[domain].filter(function(g) { return g.status !== 'Active'; });

    active.forEach(function(g) {
      html += _renderGoalCard(g, false);
    });
    if (inactive.length) {
      html += '<details style="margin-bottom:12px"><summary style="cursor:pointer;font-size:13px;color:var(--text-secondary,#666);margin-bottom:8px">Completed/Inactive Goals (' + inactive.length + ')</summary>';
      inactive.forEach(function(g) {
        html += _renderGoalCard(g, true);
      });
      html += '</details>';
    }
  });

  return html;
}

function _renderGoalCard(g, dimmed) {
  var cls = 'slp-goal-card';
  if (g.status === 'Met') cls += ' goal-met';
  if (g.status === 'Discontinued') cls += ' goal-dc';
  var badgeCls = g.status === 'Active' ? 'slp-badge-active' : g.status === 'Met' ? 'slp-badge-met' : g.status === 'Modified' ? 'slp-badge-modified' : 'slp-badge-discontinued';

  var html = '<div class="' + cls + '">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center">';
  html += '<span class="slp-badge ' + badgeCls + '">' + esc(g.status || 'Active') + '</span>';
  html += '<div style="display:flex;gap:6px">';
  html += '<button class="btn btn-sm btn-outline-primary slp-edit-goal" data-id="' + g.id + '">Edit</button>';
  if (g.status === 'Active') html += '<button class="btn btn-sm btn-outline-success slp-add-progress" data-id="' + g.id + '">+ Progress</button>';
  html += '</div></div>';
  html += '<div style="margin-top:8px;font-size:14px">' + esc(g.goalText || '') + '</div>';
  if (g.targetDate) html += '<div style="font-size:12px;color:var(--text-secondary,#666);margin-top:4px">Target: ' + esc(g.targetDate) + '</div>';

  // Progress entries
  if (g.progress && g.progress.length) {
    html += '<div style="margin-top:8px">';
    g.progress.forEach(function(p) {
      html += '<div class="slp-progress-entry">';
      html += '<strong>' + esc(p.accuracy || '') + '</strong> ';
      html += '<span style="color:var(--text-secondary,#666)">' + formatDateTime(p.date) + '</span>';
      if (p.notes) html += ' - ' + esc(p.notes);
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

/* ================================================================
   MODALS
   ================================================================ */

/* ---- Bedside Swallow Evaluation ---- */
function openSwallowEvalModal(patientId, existing, onSave) {
  var ev = existing || {};

  var body = '';

  // Section 1: Oral Mechanism Exam
  body += '<div class="slp-modal-section"><h5>Section 1: Oral Mechanism Exam</h5>';

  var oralStructures = [
    { key: 'lip', label: 'Lip', fields: [
      { k: 'lipStrength', l: 'Strength', opts: ['Normal','Reduced'] },
      { k: 'lipROM', l: 'ROM', opts: ['WNL','Reduced'] },
      { k: 'lipSymmetry', l: 'Symmetry', opts: ['Symmetric','Asymmetric'] }
    ]},
    { key: 'tongue', label: 'Tongue', fields: [
      { k: 'tongueStrength', l: 'Strength', opts: ['Normal','Reduced'] },
      { k: 'tongueROM', l: 'ROM', opts: ['WNL','Reduced'] },
      { k: 'tongueLat', l: 'Lateralization', opts: ['WNL','Reduced'] }
    ]},
    { key: 'jaw', label: 'Jaw', fields: [
      { k: 'jawStrength', l: 'Strength', opts: ['Normal','Reduced'] },
      { k: 'jawROM', l: 'ROM', opts: ['WNL','Reduced'] }
    ]},
    { key: 'velum', label: 'Velum', fields: [
      { k: 'velumElev', l: 'Elevation', opts: ['Symmetric','Asymmetric'] },
      { k: 'palatalReflex', l: 'Palatal Reflex', opts: ['Present','Absent','Diminished'] }
    ]}
  ];

  oralStructures.forEach(function(struct) {
    body += '<div style="margin-bottom:8px"><strong>' + struct.label + ':</strong><div class="slp-row">';
    struct.fields.forEach(function(f) {
      body += '<div class="slp-field"><label>' + f.l + '</label><select class="form-control" id="slp-' + f.k + '">';
      f.opts.forEach(function(o) {
        body += '<option value="' + o + '"' + (ev[f.k] === o ? ' selected' : '') + '>' + o + '</option>';
      });
      body += '</select></div>';
    });
    body += '</div></div>';
  });

  // Dentition, oral hygiene, vocal quality, cough
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Dentition</label><select class="form-control" id="slp-dentition">';
  ['Intact','Edentulous','Partial'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.dentition === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Oral Hygiene</label><select class="form-control" id="slp-oralHygiene">';
  ['Good','Fair','Poor'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.oralHygiene === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Vocal Quality</label><select class="form-control" id="slp-vocalQuality">';
  ['Clear','Wet','Hoarse','Breathy'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.vocalQuality === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Volitional Cough</label><select class="form-control" id="slp-cough">';
  ['Strong','Weak','Absent'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.cough === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '</div>';
  body += '</div>'; // end section 1

  // Section 2: Trial Swallows
  body += '<div class="slp-modal-section"><h5>Section 2: Trial Swallows (IDDSI-based)</h5>';
  body += '<div style="overflow-x:auto"><table class="slp-table"><thead><tr>';
  body += '<th>Level</th><th>Tested</th><th>Lip Seal</th><th>Bolus Form.</th><th>Oral Transit</th><th>Laryngeal Elev.</th><th>Aspiration Signs</th><th>Tolerance</th>';
  body += '</tr></thead><tbody>';
  SLP_IDDSI_LEVELS.forEach(function(lvl) {
    var trialData = (ev.trials && ev.trials[lvl.level]) || {};
    body += '<tr>';
    body += '<td><span class="slp-iddsi-level" style="background:' + lvl.color + '">' + lvl.level + '</span> ' + esc(lvl.name) + '</td>';
    body += '<td><input type="checkbox" class="slp-trial-tested" data-level="' + lvl.level + '"' + (trialData.tested ? ' checked' : '') + '></td>';
    body += '<td><select class="form-control" id="slp-trial-lip-' + lvl.level + '" style="min-width:100px"><option value="Adequate"' + (trialData.lipSeal === 'Adequate' ? ' selected' : '') + '>Adequate</option><option value="Inadequate"' + (trialData.lipSeal === 'Inadequate' ? ' selected' : '') + '>Inadequate</option></select></td>';
    body += '<td><select class="form-control" id="slp-trial-bolus-' + lvl.level + '" style="min-width:100px"><option value="Adequate"' + (trialData.bolusFormation === 'Adequate' ? ' selected' : '') + '>Adequate</option><option value="Inadequate"' + (trialData.bolusFormation === 'Inadequate' ? ' selected' : '') + '>Inadequate</option></select></td>';
    body += '<td><select class="form-control" id="slp-trial-transit-' + lvl.level + '" style="min-width:100px"><option value="Normal"' + (trialData.oralTransit === 'Normal' ? ' selected' : '') + '>Normal</option><option value="Delayed"' + (trialData.oralTransit === 'Delayed' ? ' selected' : '') + '>Delayed</option></select></td>';
    body += '<td><select class="form-control" id="slp-trial-laryngeal-' + lvl.level + '" style="min-width:100px"><option value="Adequate"' + (trialData.laryngealElev === 'Adequate' ? ' selected' : '') + '>Adequate</option><option value="Reduced"' + (trialData.laryngealElev === 'Reduced' ? ' selected' : '') + '>Reduced</option></select></td>';
    body += '<td><select class="form-control" id="slp-trial-aspiration-' + lvl.level + '" style="min-width:120px">';
    ['None','Coughing','Wet voice','Throat clearing','Delayed cough'].forEach(function(o) {
      body += '<option value="' + o + '"' + (trialData.aspirationSigns === o ? ' selected' : '') + '>' + o + '</option>';
    });
    body += '</select></td>';
    body += '<td><select class="form-control" id="slp-trial-tolerance-' + lvl.level + '" style="min-width:110px">';
    ['Tolerated','With cues','Not tolerated'].forEach(function(o) {
      body += '<option value="' + o + '"' + (trialData.tolerance === o ? ' selected' : '') + '>' + o + '</option>';
    });
    body += '</select></td>';
    body += '</tr>';
  });
  body += '</tbody></table></div>';
  body += '</div>'; // end section 2

  // Section 3: Aspiration Risk & Recommendations
  body += '<div class="slp-modal-section"><h5>Section 3: Aspiration Risk & Recommendations</h5>';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Overall Aspiration Risk</label><select class="form-control" id="slp-aspirationRisk">';
  ['None','Mild','Moderate','Severe'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.aspirationRisk === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Rec. IDDSI Food Level</label><select class="form-control" id="slp-recFoodLevel">';
  for (var fl = 0; fl <= 7; fl++) {
    var fn = SLP_IDDSI_LEVELS[fl];
    body += '<option value="' + fl + '"' + (ev.recFoodLevel == fl ? ' selected' : '') + '>' + fl + ' - ' + fn.name + '</option>';
  }
  body += '</select></div>';
  body += '<div class="slp-field"><label>Rec. IDDSI Liquid Level</label><select class="form-control" id="slp-recLiquidLevel">';
  for (var ll = 0; ll <= 4; ll++) {
    var ln = SLP_IDDSI_LEVELS[ll];
    body += '<option value="' + ll + '"' + (ev.recLiquidLevel == ll ? ' selected' : '') + '>' + ll + ' - ' + ln.name + '</option>';
  }
  body += '</select></div>';
  body += '</div>';

  // Aspiration precautions checkboxes
  body += '<div style="margin-top:8px"><label style="font-size:13px;font-weight:500">Aspiration Precautions:</label>';
  body += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">';
  var evPrec = ev.precautions || [];
  SLP_ASPIRATION_PRECAUTIONS.forEach(function(p) {
    body += '<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="checkbox" class="slp-prec-cb" value="' + esc(p) + '"' + (evPrec.indexOf(p) >= 0 ? ' checked' : '') + '> ' + esc(p) + '</label>';
  });
  body += '</div></div>';

  // Instrumental study
  body += '<div class="slp-row" style="margin-top:10px">';
  body += '<div class="slp-field"><label>Instrumental Study Needed?</label><select class="form-control" id="slp-instrumentalNeeded">';
  ['No','Yes'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.instrumentalNeeded === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Type (if Yes)</label><select class="form-control" id="slp-instrumentalType">';
  ['','VFSS','FEES'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.instrumentalType === o ? ' selected' : '') + '>' + (o || '-- Select --') + '</option>'; });
  body += '</select></div>';
  body += '</div>';

  body += '<div class="slp-field" style="margin-top:8px"><label>Narrative Summary</label>';
  body += '<textarea class="form-control" id="slp-swallowNarrative" rows="3">' + esc(ev.narrative || '') + '</textarea></div>';
  body += '</div>'; // end section 3

  var footer = '<button class="btn btn-primary" id="slp-save-swallow-eval" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save Evaluation</button>';

  openModal({ title: 'Bedside Swallow Evaluation', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('slp-save-swallow-eval').addEventListener('click', function() {
      var data = {
        id: ev.id || undefined,
        patientId: patientId,
        type: 'swallow',
        provider: getSessionUser().id,
        // Oral mech
        lipStrength: document.getElementById('slp-lipStrength').value,
        lipROM: document.getElementById('slp-lipROM').value,
        lipSymmetry: document.getElementById('slp-lipSymmetry').value,
        tongueStrength: document.getElementById('slp-tongueStrength').value,
        tongueROM: document.getElementById('slp-tongueROM').value,
        tongueLat: document.getElementById('slp-tongueLat').value,
        jawStrength: document.getElementById('slp-jawStrength').value,
        jawROM: document.getElementById('slp-jawROM').value,
        velumElev: document.getElementById('slp-velumElev').value,
        palatalReflex: document.getElementById('slp-palatalReflex').value,
        dentition: document.getElementById('slp-dentition').value,
        oralHygiene: document.getElementById('slp-oralHygiene').value,
        vocalQuality: document.getElementById('slp-vocalQuality').value,
        cough: document.getElementById('slp-cough').value,
        // Trials
        trials: {},
        // Recommendations
        aspirationRisk: document.getElementById('slp-aspirationRisk').value,
        recFoodLevel: parseInt(document.getElementById('slp-recFoodLevel').value),
        recLiquidLevel: parseInt(document.getElementById('slp-recLiquidLevel').value),
        precautions: [],
        instrumentalNeeded: document.getElementById('slp-instrumentalNeeded').value,
        instrumentalType: document.getElementById('slp-instrumentalType').value,
        narrative: document.getElementById('slp-swallowNarrative').value
      };

      // Gather trials
      SLP_IDDSI_LEVELS.forEach(function(lvl) {
        var cb = document.querySelector('.slp-trial-tested[data-level="' + lvl.level + '"]');
        if (cb && cb.checked) {
          data.trials[lvl.level] = {
            tested: true,
            lipSeal: document.getElementById('slp-trial-lip-' + lvl.level).value,
            bolusFormation: document.getElementById('slp-trial-bolus-' + lvl.level).value,
            oralTransit: document.getElementById('slp-trial-transit-' + lvl.level).value,
            laryngealElev: document.getElementById('slp-trial-laryngeal-' + lvl.level).value,
            aspirationSigns: document.getElementById('slp-trial-aspiration-' + lvl.level).value,
            tolerance: document.getElementById('slp-trial-tolerance-' + lvl.level).value
          };
        }
      });

      // Gather precautions
      document.querySelectorAll('.slp-prec-cb:checked').forEach(function(cb) {
        data.precautions.push(cb.value);
      });

      saveSLPEvaluation(data);
      logAudit('save', 'slp-evaluation', data.id, patientId, 'Swallow evaluation');
      closeAllModals();
      showToast('Swallow evaluation saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- Language/Cognitive-Communication Assessment ---- */
function openLanguageAssessmentModal(patientId, existing, onSave) {
  var ev = existing || {};

  var body = '';

  // Aphasia Screening
  body += '<div class="slp-modal-section"><h5>Aphasia Screening</h5>';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Fluency</label><select class="form-control" id="slp-fluency">';
  ['Fluent','Non-fluent','Mixed'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.fluency === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Comprehension</label><select class="form-control" id="slp-comprehension">';
  ['Intact','Mild impairment','Moderate impairment','Severe impairment'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.comprehension === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Repetition</label><select class="form-control" id="slp-repetition">';
  ['Intact','Impaired'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.repetition === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '</div>';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Naming</label><select class="form-control" id="slp-naming">';
  ['Intact','Impaired with cues','Impaired without cues'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.naming === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Reading</label><select class="form-control" id="slp-reading">';
  ['Intact','Impaired'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.reading === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Writing</label><select class="form-control" id="slp-writing">';
  ['Intact','Impaired'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.writing === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '</div>';
  body += '<div style="margin-top:6px;font-size:13px;color:var(--accent-slp)" id="slp-aphasia-auto">Aphasia classification will appear here</div>';
  body += '</div>';

  // Cognitive-Communication Screening
  body += '<div class="slp-modal-section"><h5>Cognitive-Communication Screening</h5>';

  // Orientation
  body += '<div style="margin-bottom:8px"><strong>Orientation:</strong><div class="slp-row">';
  ['Person','Place','Time','Situation'].forEach(function(o) {
    var val = (ev.orientation && ev.orientation[o]) || 'Oriented';
    body += '<div class="slp-field"><label>' + o + '</label><select class="form-control" id="slp-orient-' + o + '">';
    ['Oriented','Impaired'].forEach(function(opt) { body += '<option value="' + opt + '"' + (val === opt ? ' selected' : '') + '>' + opt + '</option>'; });
    body += '</select></div>';
  });
  body += '</div></div>';

  // Attention
  body += '<div style="margin-bottom:8px"><strong>Attention:</strong><div class="slp-row">';
  ['Sustained','Selective','Divided','Alternating'].forEach(function(a) {
    var val = (ev.attention && ev.attention[a]) || 'Intact';
    body += '<div class="slp-field"><label>' + a + '</label><select class="form-control" id="slp-attn-' + a + '">';
    ['Intact','Impaired'].forEach(function(opt) { body += '<option value="' + opt + '"' + (val === opt ? ' selected' : '') + '>' + opt + '</option>'; });
    body += '</select></div>';
  });
  body += '</div></div>';

  // Memory
  body += '<div style="margin-bottom:8px"><strong>Memory:</strong><div class="slp-row">';
  ['Immediate','Short-term','Long-term','Prospective'].forEach(function(m) {
    var val = (ev.memory && ev.memory[m]) || 'Intact';
    body += '<div class="slp-field"><label>' + m + '</label><select class="form-control" id="slp-mem-' + m + '">';
    ['Intact','Impaired'].forEach(function(opt) { body += '<option value="' + opt + '"' + (val === opt ? ' selected' : '') + '>' + opt + '</option>'; });
    body += '</select></div>';
  });
  body += '</div></div>';

  // Executive function
  body += '<div style="margin-bottom:8px"><strong>Executive Function:</strong><div class="slp-row">';
  ['Problem-solving','Sequencing','Reasoning','Judgment'].forEach(function(e) {
    var val = (ev.executive && ev.executive[e]) || 'Intact';
    body += '<div class="slp-field"><label>' + e + '</label><select class="form-control" id="slp-exec-' + e.replace(/[^a-zA-Z]/g, '') + '">';
    ['Intact','Impaired'].forEach(function(opt) { body += '<option value="' + opt + '"' + (val === opt ? ' selected' : '') + '>' + opt + '</option>'; });
    body += '</select></div>';
  });
  body += '</div></div>';

  // Rancho Los Amigos
  body += '<div class="slp-row"><div class="slp-field"><label>Rancho Los Amigos Scale (optional, TBI)</label><select class="form-control" id="slp-rancho">';
  body += '<option value="">-- Not applicable --</option>';
  for (var r = 1; r <= 10; r++) {
    body += '<option value="' + r + '"' + (ev.ranchoLevel == r ? ' selected' : '') + '>Level ' + r + '</option>';
  }
  body += '</select></div></div>';
  body += '</div>'; // end cognitive section

  // Standardized Tests
  body += '<div class="slp-modal-section"><h5>Standardized Tests</h5>';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Test Administered</label><select class="form-control" id="slp-testName">';
  body += '<option value="">-- None --</option>';
  ['MoCA','SLUMS','Mini-Cog','WAB-R','Boston Naming','CELF','CLQT','Other'].forEach(function(t) {
    body += '<option value="' + t + '"' + (ev.testName === t ? ' selected' : '') + '>' + t + '</option>';
  });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Score</label><input type="number" class="form-control" id="slp-testScore" value="' + esc(String(ev.testScore || '')) + '"></div>';
  body += '<div class="slp-field"><label>Date</label><input type="date" class="form-control" id="slp-testDate" value="' + esc(ev.testDate || '') + '"></div>';
  body += '</div>';
  body += '<div class="slp-field" style="margin-top:6px"><label>Interpretation</label>';
  body += '<textarea class="form-control" id="slp-testInterpretation" rows="2">' + esc(ev.testInterpretation || '') + '</textarea></div>';
  body += '</div>';

  var footer = '<button class="btn btn-primary" id="slp-save-lang-eval" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save Assessment</button>';

  openModal({ title: 'Language/Cognitive-Communication Assessment', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    // Auto-classify aphasia on change
    function updateAphasiaClassification() {
      var fluency = document.getElementById('slp-fluency').value;
      var comprehension = document.getElementById('slp-comprehension').value;
      var repetition = document.getElementById('slp-repetition').value;
      var naming = document.getElementById('slp-naming').value;
      var classification = _slpClassifyAphasia(fluency, comprehension, repetition, naming);
      var el = document.getElementById('slp-aphasia-auto');
      if (el) el.textContent = 'Auto-classification: ' + classification + ' Aphasia';
    }
    ['slp-fluency','slp-comprehension','slp-repetition','slp-naming'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', updateAphasiaClassification);
    });
    updateAphasiaClassification();

    document.getElementById('slp-save-lang-eval').addEventListener('click', function() {
      var fluency = document.getElementById('slp-fluency').value;
      var comprehension = document.getElementById('slp-comprehension').value;
      var repetition = document.getElementById('slp-repetition').value;
      var naming = document.getElementById('slp-naming').value;

      var data = {
        id: ev.id || undefined,
        patientId: patientId,
        type: 'language',
        provider: getSessionUser().id,
        fluency: fluency,
        comprehension: comprehension,
        repetition: repetition,
        naming: naming,
        reading: document.getElementById('slp-reading').value,
        writing: document.getElementById('slp-writing').value,
        aphasiaType: _slpClassifyAphasia(fluency, comprehension, repetition, naming),
        orientation: {},
        attention: {},
        memory: {},
        executive: {},
        ranchoLevel: document.getElementById('slp-rancho').value ? parseInt(document.getElementById('slp-rancho').value) : null,
        testName: document.getElementById('slp-testName').value || null,
        testScore: document.getElementById('slp-testScore').value ? parseFloat(document.getElementById('slp-testScore').value) : null,
        testDate: document.getElementById('slp-testDate').value || null,
        testInterpretation: document.getElementById('slp-testInterpretation').value || null
      };

      ['Person','Place','Time','Situation'].forEach(function(o) {
        data.orientation[o] = document.getElementById('slp-orient-' + o).value;
      });
      ['Sustained','Selective','Divided','Alternating'].forEach(function(a) {
        data.attention[a] = document.getElementById('slp-attn-' + a).value;
      });
      ['Immediate','Short-term','Long-term','Prospective'].forEach(function(m) {
        data.memory[m] = document.getElementById('slp-mem-' + m).value;
      });
      ['Problem-solving','Sequencing','Reasoning','Judgment'].forEach(function(e) {
        data.executive[e] = document.getElementById('slp-exec-' + e.replace(/[^a-zA-Z]/g, '')).value;
      });

      saveSLPEvaluation(data);
      logAudit('save', 'slp-evaluation', data.id, patientId, 'Language/cognitive assessment');
      closeAllModals();
      showToast('Language assessment saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- Voice Assessment ---- */
function openVoiceAssessmentModal(patientId, existing, onSave) {
  var ev = existing || {};

  var body = '';

  // GRBAS Scale
  body += '<div class="slp-modal-section"><h5>GRBAS Scale</h5>';
  body += '<div class="slp-row">';
  ['Grade','Roughness','Breathiness','Asthenia','Strain'].forEach(function(g) {
    var key = 'grbas' + g;
    body += '<div class="slp-field"><label>' + g + ' (0-3)</label><select class="form-control slp-grbas-sel" id="slp-' + key + '">';
    for (var v = 0; v <= 3; v++) {
      body += '<option value="' + v + '"' + (ev[key] == v ? ' selected' : '') + '>' + v + '</option>';
    }
    body += '</select></div>';
  });
  body += '</div>';
  body += '<div style="margin-top:6px;font-weight:600;color:var(--accent-slp)" id="slp-grbas-sum">GRBAS Sum: 0</div>';
  body += '</div>';

  // MPT
  body += '<div class="slp-modal-section"><h5>Maximum Phonation Time</h5>';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>MPT (seconds)</label><input type="number" class="form-control" id="slp-mpt" step="0.1" value="' + esc(String(ev.mpt || '')) + '"></div>';
  body += '</div></div>';

  // s/z Ratio
  body += '<div class="slp-modal-section"><h5>s/z Ratio</h5>';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>/s/ Duration (sec)</label><input type="number" class="form-control" id="slp-sDuration" step="0.1" value="' + esc(String(ev.sDuration || '')) + '"></div>';
  body += '<div class="slp-field"><label>/z/ Duration (sec)</label><input type="number" class="form-control" id="slp-zDuration" step="0.1" value="' + esc(String(ev.zDuration || '')) + '"></div>';
  body += '<div class="slp-field"><label>Ratio</label><div id="slp-sz-ratio" style="padding:6px 0;font-weight:600">--</div></div>';
  body += '</div>';
  body += '<div id="slp-sz-flag" style="font-size:12px;color:var(--danger);display:none">Ratio >1.4 suggests glottal pathology</div>';
  body += '</div>';

  // Pitch, Loudness
  body += '<div class="slp-modal-section"><h5>Perceptual Qualities</h5>';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Pitch</label><select class="form-control" id="slp-pitch">';
  ['Normal','High','Low'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.pitch === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Loudness</label><select class="form-control" id="slp-loudness">';
  ['Normal','Loud','Soft'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.loudness === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '<div class="slp-field"><label>ENT/Laryngoscopy Referral</label><select class="form-control" id="slp-entReferral">';
  ['No','Yes'].forEach(function(o) { body += '<option value="' + o + '"' + (ev.entReferral === o ? ' selected' : '') + '>' + o + '</option>'; });
  body += '</select></div>';
  body += '</div></div>';

  body += '<div class="slp-field"><label>Notes</label>';
  body += '<textarea class="form-control" id="slp-voiceNotes" rows="3">' + esc(ev.voiceNotes || '') + '</textarea></div>';

  var footer = '<button class="btn btn-primary" id="slp-save-voice-eval" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save Voice Assessment</button>';

  openModal({ title: 'Voice Assessment', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    // GRBAS sum calculation
    function updateGRBAS() {
      var sum = 0;
      document.querySelectorAll('.slp-grbas-sel').forEach(function(sel) { sum += parseInt(sel.value) || 0; });
      var el = document.getElementById('slp-grbas-sum');
      if (el) el.textContent = 'GRBAS Sum: ' + sum;
    }
    document.querySelectorAll('.slp-grbas-sel').forEach(function(sel) {
      sel.addEventListener('change', updateGRBAS);
    });
    updateGRBAS();

    // s/z ratio calculation
    function updateSZRatio() {
      var s = parseFloat(document.getElementById('slp-sDuration').value) || 0;
      var z = parseFloat(document.getElementById('slp-zDuration').value) || 0;
      var ratioEl = document.getElementById('slp-sz-ratio');
      var flagEl = document.getElementById('slp-sz-flag');
      if (s > 0 && z > 0) {
        var ratio = (s / z).toFixed(2);
        ratioEl.textContent = ratio;
        if (parseFloat(ratio) > 1.4) {
          flagEl.style.display = 'block';
        } else {
          flagEl.style.display = 'none';
        }
      } else {
        ratioEl.textContent = '--';
        flagEl.style.display = 'none';
      }
    }
    document.getElementById('slp-sDuration').addEventListener('input', updateSZRatio);
    document.getElementById('slp-zDuration').addEventListener('input', updateSZRatio);
    updateSZRatio();

    document.getElementById('slp-save-voice-eval').addEventListener('click', function() {
      var sVal = parseFloat(document.getElementById('slp-sDuration').value) || 0;
      var zVal = parseFloat(document.getElementById('slp-zDuration').value) || 0;
      var ratio = (sVal > 0 && zVal > 0) ? (sVal / zVal).toFixed(2) : null;

      var data = {
        id: ev.id || undefined,
        patientId: patientId,
        type: 'voice',
        provider: getSessionUser().id,
        grbasGrade: parseInt(document.getElementById('slp-grbasGrade').value) || 0,
        grbasRoughness: parseInt(document.getElementById('slp-grbasRoughness').value) || 0,
        grbasBreathiness: parseInt(document.getElementById('slp-grbasBreathiness').value) || 0,
        grbasAsthenia: parseInt(document.getElementById('slp-grbasAsthenia').value) || 0,
        grbasStrain: parseInt(document.getElementById('slp-grbasStrain').value) || 0,
        mpt: parseFloat(document.getElementById('slp-mpt').value) || null,
        sDuration: sVal || null,
        zDuration: zVal || null,
        szRatio: ratio,
        pitch: document.getElementById('slp-pitch').value,
        loudness: document.getElementById('slp-loudness').value,
        entReferral: document.getElementById('slp-entReferral').value,
        voiceNotes: document.getElementById('slp-voiceNotes').value
      };

      saveSLPEvaluation(data);
      logAudit('save', 'slp-evaluation', data.id, patientId, 'Voice assessment');
      closeAllModals();
      showToast('Voice assessment saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- IDDSI Diet Recommendation ---- */
function openSLPDietRecModal(patientId, onSave) {
  var body = '';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>IDDSI Food Level</label><select class="form-control" id="slp-diet-food">';
  for (var fl = 3; fl <= 7; fl++) {
    var fn = SLP_IDDSI_LEVELS[fl];
    body += '<option value="' + fl + '">' + fl + ' - ' + fn.name + '</option>';
  }
  body += '</select></div>';
  body += '<div class="slp-field"><label>IDDSI Liquid Level</label><select class="form-control" id="slp-diet-liquid">';
  for (var ll = 0; ll <= 4; ll++) {
    var ln = SLP_IDDSI_LEVELS[ll];
    body += '<option value="' + ll + '">' + ll + ' - ' + ln.name + '</option>';
  }
  body += '</select></div>';
  body += '</div>';

  body += '<div style="margin-top:8px"><label style="font-size:13px;font-weight:500">Aspiration Precautions:</label>';
  body += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">';
  SLP_ASPIRATION_PRECAUTIONS.forEach(function(p) {
    body += '<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="checkbox" class="slp-diet-prec-cb" value="' + esc(p) + '"> ' + esc(p) + '</label>';
  });
  body += '</div></div>';

  body += '<div class="slp-field" style="margin-top:10px"><label>Special Instructions</label>';
  body += '<textarea class="form-control" id="slp-diet-instructions" rows="2"></textarea></div>';

  body += '<div class="slp-field" style="margin-top:8px"><label>Review Date</label>';
  body += '<input type="date" class="form-control" id="slp-diet-review" style="max-width:200px"></div>';

  var footer = '<button class="btn btn-primary" id="slp-save-diet-rec" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save & Generate Diet Order</button>';

  openModal({ title: 'IDDSI Diet Recommendation', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('slp-save-diet-rec').addEventListener('click', function() {
      var foodLevel = parseInt(document.getElementById('slp-diet-food').value);
      var liquidLevel = parseInt(document.getElementById('slp-diet-liquid').value);
      var precautions = [];
      document.querySelectorAll('.slp-diet-prec-cb:checked').forEach(function(cb) { precautions.push(cb.value); });
      var specialInstructions = document.getElementById('slp-diet-instructions').value;
      var reviewDate = document.getElementById('slp-diet-review').value;

      var foodName = SLP_IDDSI_LEVELS[foodLevel] ? SLP_IDDSI_LEVELS[foodLevel].name : 'IDDSI ' + foodLevel;
      var liquidName = SLP_IDDSI_LEVELS[liquidLevel] ? SLP_IDDSI_LEVELS[liquidLevel].name : 'IDDSI ' + liquidLevel;

      var data = {
        patientId: patientId,
        foodLevel: foodLevel,
        liquidLevel: liquidLevel,
        precautions: precautions,
        specialInstructions: specialInstructions,
        reviewDate: reviewDate,
        provider: getSessionUser().id
      };

      saveSLPDietRecommendation(data);

      // Auto-generate diet order
      saveOrder({
        patientId: patientId,
        type: 'Diet',
        priority: 'Routine',
        status: 'Active',
        detail: 'IDDSI Food: ' + foodName + ' (Level ' + foodLevel + '), Liquid: ' + liquidName + ' (Level ' + liquidLevel + ')' + (precautions.length ? '. Precautions: ' + precautions.join(', ') : '') + (specialInstructions ? '. ' + specialInstructions : ''),
        provider: getSessionUser().id
      });

      logAudit('save', 'slp-diet-rec', null, patientId, 'Diet recommendation');
      closeAllModals();
      showToast('Diet recommendation saved & order generated', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- FOIS Modal ---- */
function openFOISModal(patientId, onSave) {
  var body = '<div class="slp-field"><label>FOIS Level (1-7)</label>';
  body += '<select class="form-control" id="slp-fois-level">';
  for (var i = 1; i <= 7; i++) {
    body += '<option value="' + i + '">' + i + ' - ' + esc(SLP_FOIS_DESCRIPTIONS[i]) + '</option>';
  }
  body += '</select></div>';

  var footer = '<button class="btn btn-primary" id="slp-save-fois" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save FOIS</button>';

  openModal({ title: 'FOIS Assessment', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('slp-save-fois').addEventListener('click', function() {
      var data = {
        patientId: patientId,
        type: 'fois',
        foisLevel: parseInt(document.getElementById('slp-fois-level').value),
        provider: getSessionUser().id
      };
      saveSLPEvaluation(data);
      logAudit('save', 'slp-evaluation', null, patientId, 'FOIS level ' + data.foisLevel);
      closeAllModals();
      showToast('FOIS assessment saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- AAC Documentation ---- */
function openAACModal(patientId, existing, onSave) {
  var ev = existing || {};
  var partners = ev.partners || [];

  var body = '';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Device Type</label><select class="form-control" id="slp-aac-deviceType">';
  ['No-tech','Low-tech','Mid-tech','High-tech SGD'].forEach(function(o) {
    body += '<option value="' + o + '"' + (ev.deviceType === o ? ' selected' : '') + '>' + o + '</option>';
  });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Specific Device Name</label><input type="text" class="form-control" id="slp-aac-deviceName" value="' + esc(ev.deviceName || '') + '"></div>';
  body += '</div>';

  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Access Method</label><select class="form-control" id="slp-aac-accessMethod">';
  ['Direct selection','Scanning','Eye tracking','Switch'].forEach(function(o) {
    body += '<option value="' + o + '"' + (ev.accessMethod === o ? ' selected' : '') + '>' + o + '</option>';
  });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Vocabulary Type</label><select class="form-control" id="slp-aac-vocabType">';
  ['Core','Fringe','Combined'].forEach(function(o) {
    body += '<option value="' + o + '"' + (ev.vocabType === o ? ' selected' : '') + '>' + o + '</option>';
  });
  body += '</select></div>';
  body += '</div>';

  // Communication partners
  body += '<div style="margin-top:10px"><strong style="font-size:13px">Communication Partners:</strong>';
  body += '<div id="slp-aac-partners">';
  partners.forEach(function(p, i) {
    body += '<div class="slp-row" style="margin-top:4px" data-partner="' + i + '">';
    body += '<div class="slp-field"><label>Name</label><input type="text" class="form-control slp-partner-name" value="' + esc(p.name || '') + '"></div>';
    body += '<div class="slp-field"><label>Relationship</label><input type="text" class="form-control slp-partner-rel" value="' + esc(p.relationship || '') + '"></div>';
    body += '<div class="slp-field"><label>Training</label><select class="form-control slp-partner-status">';
    ['Completed','In Progress','Pending'].forEach(function(s) { body += '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + s + '</option>'; });
    body += '</select></div>';
    body += '</div>';
  });
  body += '</div>';
  body += '<button class="btn btn-sm btn-outline-primary" id="slp-aac-add-partner" style="margin-top:6px;color:var(--accent-slp);border-color:var(--accent-slp)">+ Add Partner</button>';
  body += '</div>';

  body += '<div class="slp-field" style="margin-top:10px"><label>Device Settings Notes</label>';
  body += '<textarea class="form-control" id="slp-aac-notes" rows="2">' + esc(ev.deviceNotes || '') + '</textarea></div>';

  var footer = '<button class="btn btn-primary" id="slp-save-aac" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save AAC Documentation</button>';

  openModal({ title: 'AAC Documentation', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    // Add partner button
    document.getElementById('slp-aac-add-partner').addEventListener('click', function() {
      var container = document.getElementById('slp-aac-partners');
      var idx = container.querySelectorAll('[data-partner]').length;
      var row = document.createElement('div');
      row.className = 'slp-row';
      row.style.marginTop = '4px';
      row.setAttribute('data-partner', idx);
      row.innerHTML = '<div class="slp-field"><label>Name</label><input type="text" class="form-control slp-partner-name"></div>' +
        '<div class="slp-field"><label>Relationship</label><input type="text" class="form-control slp-partner-rel"></div>' +
        '<div class="slp-field"><label>Training</label><select class="form-control slp-partner-status"><option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select></div>';
      container.appendChild(row);
    });

    document.getElementById('slp-save-aac').addEventListener('click', function() {
      var partnersList = [];
      document.querySelectorAll('#slp-aac-partners [data-partner]').forEach(function(row) {
        var name = row.querySelector('.slp-partner-name').value.trim();
        if (name) {
          partnersList.push({
            name: name,
            relationship: row.querySelector('.slp-partner-rel').value.trim(),
            status: row.querySelector('.slp-partner-status').value
          });
        }
      });

      var data = {
        id: ev.id || undefined,
        patientId: patientId,
        type: 'aac',
        provider: getSessionUser().id,
        deviceType: document.getElementById('slp-aac-deviceType').value,
        deviceName: document.getElementById('slp-aac-deviceName').value,
        accessMethod: document.getElementById('slp-aac-accessMethod').value,
        vocabType: document.getElementById('slp-aac-vocabType').value,
        partners: partnersList,
        deviceNotes: document.getElementById('slp-aac-notes').value
      };

      saveSLPEvaluation(data);
      logAudit('save', 'slp-evaluation', data.id, patientId, 'AAC documentation');
      closeAllModals();
      showToast('AAC documentation saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- SLP Session ---- */
function openSLPSessionModal(patientId, existing, onSave) {
  var sess = existing || {};
  var isView = !!existing;
  var today = new Date().toISOString().slice(0, 10);
  var areas = sess.treatmentAreas || [];

  var body = '';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Session Date</label><input type="date" class="form-control" id="slp-sess-date" value="' + esc(sess.sessionDate || today) + '"></div>';
  body += '<div class="slp-field"><label>Duration (minutes)</label><input type="number" class="form-control" id="slp-sess-duration" value="' + esc(String(sess.duration || '')) + '"></div>';
  body += '</div>';

  // Treatment areas
  body += '<div style="margin-top:8px"><strong style="font-size:13px">Treatment Areas:</strong>';
  body += '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:4px">';
  ['Swallowing','Language','Cognition','Voice','Articulation','Fluency'].forEach(function(a) {
    body += '<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="checkbox" class="slp-sess-area" value="' + a + '"' + (areas.indexOf(a) >= 0 ? ' checked' : '') + '> ' + a + '</label>';
  });
  body += '</div></div>';

  // Conditional intervention sections
  var swallowingIntvs = ['Effortful swallow','Mendelsohn maneuver','Supraglottic swallow','Super-supraglottic','Shaker exercise','Lingual strengthening','Masako','Thermal-tactile stimulation','Diet trials/upgrades','Patient/family education'];
  var languageIntvs = ['Naming drills','Sentence completion','Script training','Reading comprehension','Writing tasks','Conversational therapy'];
  var cognitiveIntvs = ['Attention tasks','Memory strategies','Problem-solving','Executive function training','Orientation training'];
  var voiceIntvs = ['Vocal function exercises','Resonant voice therapy','LSVT LOUD','Breath support exercises'];

  var sessSwInt = sess.swallowingInterventions || [];
  var sessLangInt = sess.languageInterventions || [];
  var sessCogInt = sess.cognitiveInterventions || [];
  var sessVoiceInt = sess.voiceInterventions || [];

  body += '<div id="slp-sess-swallow-intvs" style="margin-top:10px;display:' + (areas.indexOf('Swallowing') >= 0 ? 'block' : 'none') + '">';
  body += '<strong style="font-size:13px;color:var(--accent-slp)">Swallowing Interventions:</strong>';
  body += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">';
  swallowingIntvs.forEach(function(i) {
    body += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="checkbox" class="slp-sw-intv" value="' + esc(i) + '"' + (sessSwInt.indexOf(i) >= 0 ? ' checked' : '') + '> ' + esc(i) + '</label>';
  });
  body += '</div></div>';

  body += '<div id="slp-sess-language-intvs" style="margin-top:10px;display:' + (areas.indexOf('Language') >= 0 ? 'block' : 'none') + '">';
  body += '<strong style="font-size:13px;color:var(--accent-slp)">Language Interventions:</strong>';
  body += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">';
  languageIntvs.forEach(function(i) {
    body += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="checkbox" class="slp-lang-intv" value="' + esc(i) + '"' + (sessLangInt.indexOf(i) >= 0 ? ' checked' : '') + '> ' + esc(i) + '</label>';
  });
  body += '</div></div>';

  body += '<div id="slp-sess-cognition-intvs" style="margin-top:10px;display:' + (areas.indexOf('Cognition') >= 0 ? 'block' : 'none') + '">';
  body += '<strong style="font-size:13px;color:var(--accent-slp)">Cognitive Interventions:</strong>';
  body += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">';
  cognitiveIntvs.forEach(function(i) {
    body += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="checkbox" class="slp-cog-intv" value="' + esc(i) + '"' + (sessCogInt.indexOf(i) >= 0 ? ' checked' : '') + '> ' + esc(i) + '</label>';
  });
  body += '</div></div>';

  body += '<div id="slp-sess-voice-intvs" style="margin-top:10px;display:' + (areas.indexOf('Voice') >= 0 ? 'block' : 'none') + '">';
  body += '<strong style="font-size:13px;color:var(--accent-slp)">Voice Interventions:</strong>';
  body += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px">';
  voiceIntvs.forEach(function(i) {
    body += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer"><input type="checkbox" class="slp-voice-intv" value="' + esc(i) + '"' + (sessVoiceInt.indexOf(i) >= 0 ? ' checked' : '') + '> ' + esc(i) + '</label>';
  });
  body += '</div></div>';

  body += '<div class="slp-field" style="margin-top:10px"><label>Accuracy/Performance</label>';
  body += '<input type="text" class="form-control" id="slp-sess-accuracy" value="' + esc(sess.accuracy || '') + '" placeholder="e.g., 7/10 trials correct"></div>';

  body += '<div class="slp-field" style="margin-top:8px"><label>Patient Response / Progress Notes</label>';
  body += '<textarea class="form-control" id="slp-sess-notes" rows="3">' + esc(sess.progressNotes || '') + '</textarea></div>';

  // CPT reference
  body += '<div class="slp-cpt-ref"><strong>CPT Reference:</strong> 92507 (Speech Tx) | 92526 (Swallowing Tx) | 92610 (Swallow Eval) | 92523 (Speech Eval)</div>';

  var footer = '<button class="btn btn-primary" id="slp-save-session" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save Session</button>';

  openModal({ title: isView ? 'View Treatment Session' : 'New Treatment Session', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    // Toggle intervention sections based on area checkboxes
    var areaMap = {
      'Swallowing': 'slp-sess-swallow-intvs',
      'Language': 'slp-sess-language-intvs',
      'Cognition': 'slp-sess-cognition-intvs',
      'Voice': 'slp-sess-voice-intvs'
    };
    document.querySelectorAll('.slp-sess-area').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var divId = areaMap[this.value];
        if (divId) {
          document.getElementById(divId).style.display = this.checked ? 'block' : 'none';
        }
      });
    });

    document.getElementById('slp-save-session').addEventListener('click', function() {
      var selAreas = [];
      document.querySelectorAll('.slp-sess-area:checked').forEach(function(cb) { selAreas.push(cb.value); });

      var swIntvs = [];
      document.querySelectorAll('.slp-sw-intv:checked').forEach(function(cb) { swIntvs.push(cb.value); });
      var langIntvs = [];
      document.querySelectorAll('.slp-lang-intv:checked').forEach(function(cb) { langIntvs.push(cb.value); });
      var cogIntvs = [];
      document.querySelectorAll('.slp-cog-intv:checked').forEach(function(cb) { cogIntvs.push(cb.value); });
      var voiceIntvsArr = [];
      document.querySelectorAll('.slp-voice-intv:checked').forEach(function(cb) { voiceIntvsArr.push(cb.value); });

      var user = getSessionUser();
      var data = {
        id: sess.id || undefined,
        patientId: patientId,
        sessionDate: document.getElementById('slp-sess-date').value,
        duration: parseInt(document.getElementById('slp-sess-duration').value) || 0,
        treatmentAreas: selAreas,
        swallowingInterventions: swIntvs,
        languageInterventions: langIntvs,
        cognitiveInterventions: cogIntvs,
        voiceInterventions: voiceIntvsArr,
        accuracy: document.getElementById('slp-sess-accuracy').value,
        progressNotes: document.getElementById('slp-sess-notes').value,
        provider: user.id,
        providerName: (user.lastName ? user.lastName + ', ' : '') + (user.firstName || user.name || user.id)
      };

      saveSLPSession(data);
      logAudit('save', 'slp-session', data.id, patientId, 'SLP session');
      closeAllModals();
      showToast('Treatment session saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- SLP Goal ---- */
function openSLPGoalModal(patientId, existing, onSave) {
  var g = existing || {};

  var body = '';
  body += '<div class="slp-row">';
  body += '<div class="slp-field"><label>Goal Domain</label><select class="form-control" id="slp-goal-domain">';
  ['Swallowing','Language','Cognition','Voice','Articulation','Fluency'].forEach(function(d) {
    body += '<option value="' + d + '"' + (g.domain === d ? ' selected' : '') + '>' + d + '</option>';
  });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Status</label><select class="form-control" id="slp-goal-status">';
  ['Active','Met','Modified','Discontinued'].forEach(function(s) {
    body += '<option value="' + s + '"' + (g.status === s ? ' selected' : '') + '>' + s + '</option>';
  });
  body += '</select></div>';
  body += '<div class="slp-field"><label>Target Date</label><input type="date" class="form-control" id="slp-goal-target" value="' + esc(g.targetDate || '') + '"></div>';
  body += '</div>';

  body += '<div class="slp-field" style="margin-top:8px"><label>Goal Templates</label>';
  body += '<select class="form-control" id="slp-goal-template"><option value="">-- Select a template --</option>';
  SLP_GOAL_TEMPLATES.forEach(function(t, i) {
    body += '<option value="' + i + '">' + esc(t) + '</option>';
  });
  body += '</select></div>';

  body += '<div class="slp-field" style="margin-top:8px"><label>Goal Text</label>';
  body += '<textarea class="form-control" id="slp-goal-text" rows="3">' + esc(g.goalText || '') + '</textarea></div>';

  var footer = '<button class="btn btn-primary" id="slp-save-goal" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save Goal</button>';

  openModal({ title: g.id ? 'Edit SLP Goal' : 'New SLP Goal', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    // Template auto-fill
    document.getElementById('slp-goal-template').addEventListener('change', function() {
      var idx = this.value;
      if (idx !== '') {
        document.getElementById('slp-goal-text').value = SLP_GOAL_TEMPLATES[parseInt(idx)];
      }
    });

    document.getElementById('slp-save-goal').addEventListener('click', function() {
      var goalText = document.getElementById('slp-goal-text').value.trim();
      if (!goalText) { showToast('Please enter goal text', 'error'); return; }

      var data = {
        id: g.id || undefined,
        patientId: patientId,
        domain: document.getElementById('slp-goal-domain').value,
        goalText: goalText,
        targetDate: document.getElementById('slp-goal-target').value || null,
        status: document.getElementById('slp-goal-status').value,
        progress: g.progress || [],
        provider: getSessionUser().id
      };

      saveSLPGoal(data);
      logAudit('save', 'slp-goal', data.id, patientId, 'SLP goal: ' + data.domain);
      closeAllModals();
      showToast('SLP goal saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- Progress entry modal ---- */
function openProgressModal(patientId, goal, onSave) {
  var body = '';
  body += '<div class="slp-field"><label>Accuracy %</label><input type="text" class="form-control" id="slp-prog-accuracy" placeholder="e.g., 80%"></div>';
  body += '<div class="slp-field" style="margin-top:8px"><label>Notes</label><textarea class="form-control" id="slp-prog-notes" rows="2"></textarea></div>';

  var footer = '<button class="btn btn-primary" id="slp-save-progress" style="background:var(--accent-slp);border-color:var(--accent-slp)">Save Progress</button>';

  openModal({ title: 'Add Progress Entry', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('slp-save-progress').addEventListener('click', function() {
      if (!goal.progress) goal.progress = [];
      goal.progress.push({
        date: new Date().toISOString(),
        accuracy: document.getElementById('slp-prog-accuracy').value,
        notes: document.getElementById('slp-prog-notes').value
      });

      saveSLPGoal(goal);
      logAudit('save', 'slp-goal-progress', goal.id, patientId, 'Progress entry');
      closeAllModals();
      showToast('Progress entry saved', 'success');
      if (onSave) onSave();
    });
  }, 100);
}

/* ---- Print precautions helper ---- */
function _printPrecautions(patientId) {
  var dietRecs = getSLPDietRecommendations(patientId);
  if (!dietRecs.length) { showToast('No diet recommendations to print', 'warning'); return; }
  var active = dietRecs.sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); })[0];
  var patient = getPatient(patientId);
  var pName = patient ? (patient.lastName + ', ' + patient.firstName) : 'Patient';

  var foodInfo = SLP_IDDSI_LEVELS.find(function(l) { return l.level == active.foodLevel; });
  var liqInfo = SLP_IDDSI_LEVELS.find(function(l) { return l.level == active.liquidLevel; });

  var printHTML = '<!DOCTYPE html><html><head><title>Aspiration Precautions</title>';
  printHTML += '<style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}';
  printHTML += 'h1{color:var(--accent-slp);border-bottom:2px solid var(--accent-slp);padding-bottom:8px}';
  printHTML += '.info{margin:12px 0;font-size:16px}';
  printHTML += '.precaution{padding:8px 0;border-bottom:1px solid #eee;font-size:15px}';
  printHTML += '.precaution:before{content:"\\2713";color:var(--success);margin-right:8px;font-weight:bold}';
  printHTML += '@media print{body{padding:20px}}</style></head><body>';
  printHTML += '<h1>Aspiration Precautions</h1>';
  printHTML += '<div class="info"><strong>Patient:</strong> ' + esc(pName) + '</div>';
  printHTML += '<div class="info"><strong>Date:</strong> ' + formatDateTime(active.createdAt) + '</div>';
  printHTML += '<div class="info"><strong>Diet:</strong> Food: ' + esc(foodInfo ? foodInfo.name + ' (IDDSI ' + foodInfo.level + ')' : '') + ' | Liquid: ' + esc(liqInfo ? liqInfo.name + ' (IDDSI ' + liqInfo.level + ')' : '') + '</div>';
  if (active.specialInstructions) printHTML += '<div class="info"><strong>Special Instructions:</strong> ' + esc(active.specialInstructions) + '</div>';
  printHTML += '<h2>Precautions</h2>';
  (active.precautions || []).forEach(function(p) {
    printHTML += '<div class="precaution">' + esc(p) + '</div>';
  });
  printHTML += '</body></html>';

  var win = window.open('', '_blank');
  if (win) {
    win.document.write(printHTML);
    win.document.close();
    win.print();
  }
}
