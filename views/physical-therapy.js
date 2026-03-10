/* ============================================================
   views/physical-therapy.js — Physical Therapy Module
   Evaluations, Treatment Sessions, Goals & Outcomes,
   Home Exercise Program, Equipment / DME
   ============================================================ */

/* ---------- CSS Injection ---------- */
function _injectPTCSS() {
  if (document.getElementById('pt-styles')) return;
  var s = document.createElement('style');
  s.id = 'pt-styles';
  s.textContent = [
    '.pt-wrap { padding:24px; max-width:1100px; margin:0 auto; }',
    '.pt-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.pt-tabs { display:flex; gap:0; border-bottom:2px solid var(--border,#ddd); margin-bottom:20px; }',
    '.pt-tab { padding:10px 20px; cursor:pointer; font-weight:500; border-bottom:2px solid transparent; margin-bottom:-2px; color:var(--text-secondary,#666); }',
    '.pt-tab.active { color:var(--accent-pt); border-bottom-color:var(--accent-pt); }',
    '.pt-tab:hover { color:var(--accent-pt); }',
    '.pt-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-bottom:12px; }',
    '.pt-card h4 { margin:0 0 8px 0; color:var(--accent-pt); }',
    '.pt-section { border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-bottom:16px; background:var(--bg-card,#fff); }',
    '.pt-section h4 { margin:0 0 12px 0; color:var(--accent-pt); border-bottom:1px solid var(--border); padding-bottom:6px; }',
    '.pt-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px; }',
    '.pt-row label { font-size:13px; font-weight:500; }',
    '.pt-grid-table { width:100%; border-collapse:collapse; font-size:12px; }',
    '.pt-grid-table th { background:#f0fdfa; color:var(--accent-pt); padding:6px 8px; border:1px solid var(--border,#ddd); text-align:left; font-size:11px; }',
    '.pt-grid-table td { padding:4px 6px; border:1px solid var(--border,#ddd); }',
    '.pt-grid-table input[type="number"] { width:60px; padding:2px 4px; border:1px solid var(--border,#ddd); border-radius:3px; font-size:12px; }',
    '.pt-grid-table select { padding:2px 4px; border:1px solid var(--border,#ddd); border-radius:3px; font-size:11px; max-width:80px; }',
    '.pt-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:500; margin-right:4px; margin-bottom:4px; }',
    '.pt-badge-teal { background:#ccfbf1; color:var(--accent-pt); }',
    '.pt-badge-blue { background:#dbeafe; color:#1d4ed8; }',
    '.pt-badge-green { background:#d4edda; color:#155724; }',
    '.pt-badge-yellow { background:var(--badge-warning-bg); color:#856404; }',
    '.pt-badge-gray { background:#e2e3e5; color:#383d41; }',
    '.pt-badge-red { background:#f8d7da; color:#721c24; }',
    '.pt-score-box { display:inline-block; padding:6px 14px; border-radius:var(--radius,8px); font-weight:700; font-size:14px; }',
    '.pt-risk-low { background:#d4edda; color:#155724; }',
    '.pt-risk-med { background:var(--badge-warning-bg); color:#856404; }',
    '.pt-risk-high { background:#f8d7da; color:#721c24; }',
    '.pt-goal-section { border-left:4px solid #ccc; padding:12px 16px; margin-bottom:10px; background:var(--bg-card,#fff); border-radius:0 var(--radius,8px) var(--radius,8px) 0; }',
    '.pt-goal-active { border-left-color:#28a745; }',
    '.pt-goal-met { border-left-color:#007bff; }',
    '.pt-goal-modified { border-left-color:#ffc107; }',
    '.pt-goal-discontinued { border-left-color:#6c757d; }',
    '.pt-hep-exercise { background:var(--bg-main,#f8f9fa); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }',
    '.pt-hep-exercise .pt-hep-info { flex:1; }',
    '.pt-hep-lib-item { padding:8px 12px; border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); margin-bottom:6px; cursor:pointer; font-size:13px; }',
    '.pt-hep-lib-item:hover { border-color:var(--accent-pt); background:#f0fdfa; }',
    '.pt-collapsible-header { cursor:pointer; padding:8px 12px; background:#f0fdfa; border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); margin-bottom:8px; font-weight:500; color:var(--accent-pt); }',
    '.pt-collapsible-body { display:none; padding:12px; border:1px solid var(--border,#ddd); border-top:0; border-radius:0 0 var(--radius,8px) var(--radius,8px); margin-top:-9px; margin-bottom:8px; }',
    '.pt-collapsible-body.open { display:block; }',
    '.pt-checkbox-group { display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }',
    '.pt-checkbox-group label { display:flex; align-items:center; gap:4px; font-size:13px; font-weight:400; cursor:pointer; }',
    '.pt-empty { text-align:center; padding:40px; color:var(--text-secondary,#666); }',
    '.pt-table { width:100%; border-collapse:collapse; font-size:13px; }',
    '.pt-table th { background:#f0fdfa; color:var(--accent-pt); padding:8px 10px; border:1px solid var(--border,#ddd); text-align:left; }',
    '.pt-table td { padding:8px 10px; border:1px solid var(--border,#ddd); }',
    '.pt-table tr:hover { background:#f8fffe; }',
    '.pt-print-hep { font-family:serif; padding:40px; }',
    '.pt-print-hep h2 { text-align:center; margin-bottom:20px; }',
    '.pt-print-hep table { width:100%; border-collapse:collapse; margin-bottom:20px; }',
    '.pt-print-hep th, .pt-print-hep td { border:1px solid #333; padding:6px 8px; text-align:left; font-size:13px; }',
    '@media print { .modal-footer, .modal-close-btn { display:none !important; } }'
  ].join('\n');
  document.head.appendChild(s);
}

/* ---------- Constants ---------- */

var PT_ROM_JOINTS = [
  { joint: 'Shoulder', motions: [
    { name: 'Flexion', normal: 180 }, { name: 'Extension', normal: 60 },
    { name: 'Abduction', normal: 180 }, { name: 'IR', normal: 70 }, { name: 'ER', normal: 90 }
  ]},
  { joint: 'Elbow', motions: [
    { name: 'Flexion', normal: 150 }, { name: 'Extension', normal: 0 }
  ]},
  { joint: 'Wrist', motions: [
    { name: 'Flexion', normal: 80 }, { name: 'Extension', normal: 70 }
  ]},
  { joint: 'Hip', motions: [
    { name: 'Flexion', normal: 120 }, { name: 'Extension', normal: 30 },
    { name: 'Abduction', normal: 45 }, { name: 'IR', normal: 45 }, { name: 'ER', normal: 45 }
  ]},
  { joint: 'Knee', motions: [
    { name: 'Flexion', normal: 135 }, { name: 'Extension', normal: 0 }
  ]},
  { joint: 'Ankle', motions: [
    { name: 'Dorsiflexion', normal: 20 }, { name: 'Plantarflexion', normal: 50 }
  ]}
];

var PT_MMT_GRADES = ['0','1','2-','2','2+','3-','3','3+','4-','4','4+','5'];

var PT_FUNC_TASKS = [
  'Supine to Sit','Sit to Stand','Bed Mobility','Transfer (bed)',
  'Transfer (toilet)','Ambulation','Stairs'
];

var PT_ASSIST_LEVELS = [
  'Independent','Modified Independent','Supervision','CGA',
  'Min A','Mod A','Max A','Dependent'
];

var PT_BERG_ITEMS = [
  'Standing unsupported','Standing with eyes closed','Standing with feet together',
  'Standing on one foot','Turning 360','Placing alternate foot on stool',
  'Tandem standing','Reaching forward','Retrieving object from floor',
  'Turning to look behind','Transferring','Standing to sitting',
  'Sitting to standing','Sitting unsupported'
];

var PT_GAIT_DEVIATIONS = [
  'Trendelenburg','Antalgic','Steppage','Circumduction','Vaulting',
  'Ataxic','Festinating','Wide-based','Scissoring'
];

var PT_PAIN_LOCATIONS = [
  'Head','Neck','Shoulder','Upper Back','Lower Back','Hip','Knee','Ankle','Foot','Other'
];

var PT_PAIN_AGGRAVATING = ['Walking','Standing','Sitting','Stairs','Bending','Lifting','Overhead'];
var PT_PAIN_ALLEVIATING = ['Rest','Ice','Heat','Position change','Medication'];

var PT_MODALITIES = [
  { code: '97110', name: 'Therapeutic Exercise' },
  { code: '97140', name: 'Manual Therapy' },
  { code: '97116', name: 'Gait Training' },
  { code: '97530', name: 'Therapeutic Activities' },
  { code: '97112', name: 'Neuromuscular Re-education' },
  { code: '97113', name: 'Aquatic Therapy' }
];

var PT_EXERCISE_LIBRARY = [
  { region: 'Shoulder', name: 'Pendulum Exercises', defaultSets: 2, defaultReps: 10, instructions: 'Lean forward, let arm hang. Swing in small circles.' },
  { region: 'Shoulder', name: 'Wall Slides', defaultSets: 2, defaultReps: 10, instructions: 'Stand facing wall, slide hands up.' },
  { region: 'Shoulder', name: 'External Rotation with Band', defaultSets: 2, defaultReps: 10, instructions: 'Elbow at side, rotate forearm outward against band.' },
  { region: 'Hip', name: 'Bridges', defaultSets: 2, defaultReps: 10, instructions: 'Lie on back, knees bent. Lift hips off surface.' },
  { region: 'Hip', name: 'Clamshells', defaultSets: 2, defaultReps: 10, instructions: 'Side-lying, knees bent. Open top knee like a clamshell.' },
  { region: 'Hip', name: 'Hip Abduction (Side-lying)', defaultSets: 2, defaultReps: 10, instructions: 'Side-lying, lift top leg straight up.' },
  { region: 'Knee', name: 'Quad Sets', defaultSets: 3, defaultReps: 10, instructions: 'Tighten thigh muscle, press knee flat. Hold 5 seconds.' },
  { region: 'Knee', name: 'SLR (Straight Leg Raise)', defaultSets: 2, defaultReps: 10, instructions: 'Lie flat, tighten quad, lift leg 12 inches. Hold 5 seconds.' },
  { region: 'Knee', name: 'Heel Slides', defaultSets: 2, defaultReps: 10, instructions: 'Lie on back, slide heel toward buttock, then straighten.' },
  { region: 'Ankle', name: 'Ankle Pumps', defaultSets: 3, defaultReps: 20, instructions: 'Point toes down, then pull up. Repeat.' },
  { region: 'Ankle', name: 'Towel Curls', defaultSets: 2, defaultReps: 10, instructions: 'Place towel on floor, scrunch with toes.' },
  { region: 'Spine', name: 'Pelvic Tilts', defaultSets: 2, defaultReps: 10, instructions: 'Lie on back, tighten abs and flatten back. Hold 5 seconds.' },
  { region: 'Spine', name: 'Cat-Cow Stretch', defaultSets: 2, defaultReps: 10, instructions: 'On all fours, arch back up (cat), then let belly drop (cow).' },
  { region: 'Spine', name: 'Bird-Dog', defaultSets: 2, defaultReps: 10, instructions: 'On all fours, extend opposite arm and leg. Hold 5 seconds.' },
  { region: 'Core', name: 'Dead Bug', defaultSets: 2, defaultReps: 10, instructions: 'Lie on back, extend opposite arm/leg while keeping core tight.' },
  { region: 'Core', name: 'Plank', defaultSets: 3, defaultReps: 1, instructions: 'Hold plank position on forearms. Hold 15-30 seconds.' },
  { region: 'Balance', name: 'Single Leg Stance', defaultSets: 3, defaultReps: 1, instructions: 'Stand on one foot near counter. Hold 30 seconds each side.' },
  { region: 'Balance', name: 'Tandem Walking', defaultSets: 2, defaultReps: 10, instructions: 'Walk heel-to-toe in a straight line.' },
  { region: 'General', name: 'Walking Program', defaultSets: 1, defaultReps: 1, instructions: 'Walk at comfortable pace for prescribed duration.' }
];

var PT_DME_TYPES = [
  'Cane','Rolling Walker','FWW','Manual Wheelchair','Power Wheelchair',
  'AFO','KAFO','TLSO','Knee Brace','Sling','TENS Unit','Other'
];

/* ---------- DASH Questionnaire (30 items) ---------- */
var PT_DASH_ITEMS = [
  'Open a tight or new jar',
  'Write',
  'Turn a key',
  'Prepare a meal',
  'Push open a heavy door',
  'Place object on shelf above head',
  'Do heavy household chores',
  'Garden or do yard work',
  'Make a bed',
  'Carry a shopping bag or briefcase',
  'Carry a heavy object (over 10 lbs)',
  'Change a lightbulb overhead',
  'Wash or blow dry hair',
  'Wash your back',
  'Put on a pullover sweater',
  'Use a knife to cut food',
  'Recreational activities (little effort)',
  'Recreational activities (force/impact through arm)',
  'Recreational activities (move arm freely)',
  'Manage transportation needs',
  'Sexual activities',
  'Social activities interference',
  'Work/daily activity limitation',
  'Arm/shoulder/hand pain',
  'Arm/shoulder/hand pain during activity',
  'Tingling (pins and needles)',
  'Weakness in arm/shoulder/hand',
  'Stiffness in arm/shoulder/hand',
  'Difficulty sleeping due to pain',
  'Feel less capable/confident/useful'
];

/* ---------- LEFS Questionnaire (20 items) ---------- */
var PT_LEFS_ITEMS = [
  'Any of your usual work, housework, or school activities',
  'Your usual hobbies, recreational, or sporting activities',
  'Getting into or out of the bath',
  'Walking between rooms',
  'Putting on your shoes or socks',
  'Squatting',
  'Lifting an object from the floor',
  'Performing light activities around your home',
  'Performing heavy activities around your home',
  'Getting into or out of a car',
  'Walking 2 blocks',
  'Walking a mile',
  'Going up or down 10 stairs',
  'Standing for 1 hour',
  'Sitting for 1 hour',
  'Running on even ground',
  'Running on uneven ground',
  'Making sharp turns while running fast',
  'Hopping',
  'Rolling over in bed'
];

/* ---------- ODI Sections ---------- */
var PT_ODI_SECTIONS = [
  'Pain Intensity','Personal Care (Washing, Dressing)','Lifting',
  'Walking','Sitting','Standing','Sleeping','Social Life',
  'Traveling','Employment/Homemaking'
];

/* ---------- NDI Sections ---------- */
var PT_NDI_SECTIONS = [
  'Pain Intensity','Personal Care','Lifting','Reading',
  'Headaches','Concentration','Work','Driving',
  'Sleeping','Recreation'
];


/* ============================================================
   MAIN RENDER FUNCTION
   ============================================================ */
function renderPhysicalTherapy(patientId) {
  _injectPTCSS();
  var app = document.getElementById('app');
  var pid = patientId;
  var activeTab = 'evaluations';

  function build() {
    var patient = getPatient(pid);
    var pName = patient ? (patient.lastName + ', ' + patient.firstName) : 'Unknown';

    var html = '<div class="pt-wrap">';
    html += buildPatientBanner(pid);
    html += '<div class="pt-header"><h2 style="color:var(--accent-pt)">Physical Therapy</h2></div>';

    /* Tabs */
    html += '<div class="pt-tabs">';
    var tabs = [
      { key: 'evaluations', label: 'Evaluations' },
      { key: 'sessions', label: 'Treatment Sessions' },
      { key: 'goals', label: 'Goals & Outcomes' },
      { key: 'hep', label: 'Home Exercise Program' },
      { key: 'equipment', label: 'Equipment' }
    ];
    tabs.forEach(function(t) {
      html += '<div class="pt-tab' + (activeTab === t.key ? ' active' : '') + '" data-tab="' + t.key + '">' + t.label + '</div>';
    });
    html += '</div>';

    /* Tab content */
    if (activeTab === 'evaluations') html += _buildEvalTab(pid);
    else if (activeTab === 'sessions') html += _buildSessionTab(pid);
    else if (activeTab === 'goals') html += _buildGoalsTab(pid);
    else if (activeTab === 'hep') html += _buildHEPTab(pid);
    else if (activeTab === 'equipment') html += _buildEquipmentTab(pid);

    html += '</div>';
    app.innerHTML = html;

    /* Wire tab clicks */
    app.querySelectorAll('.pt-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { activeTab = this.getAttribute('data-tab'); build(); });
    });

    /* Wire tab-specific events */
    if (activeTab === 'evaluations') _wireEvalTab(pid);
    else if (activeTab === 'sessions') _wireSessionTab(pid);
    else if (activeTab === 'goals') _wireGoalsTab(pid);
    else if (activeTab === 'hep') _wireHEPTab(pid);
    else if (activeTab === 'equipment') _wireEquipmentTab(pid);
  }

  build();

  /* Expose rebuild for modals to call */
  renderPhysicalTherapy._rebuild = build;
}


/* ============================================================
   TAB 1: EVALUATIONS
   ============================================================ */
function _buildEvalTab(pid) {
  var evals = getPTEvaluations(pid).sort(function(a, b) {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<h3>PT Evaluations</h3>';
  html += '<button class="btn btn-primary" id="pt-new-eval-btn" style="background:var(--accent-pt);border-color:var(--accent-pt)">+ New Evaluation</button>';
  html += '</div>';

  if (!evals.length) {
    html += '<div class="pt-empty"><p>No evaluations recorded. Click "+ New Evaluation" to begin.</p></div>';
    return html;
  }

  evals.forEach(function(ev) {
    html += '<div class="pt-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<h4>' + formatDateTime(ev.createdAt) + '</h4>';
    html += '<div>';
    html += '<button class="btn btn-sm btn-outline-primary pt-reeval-btn" data-id="' + ev.id + '" style="margin-right:4px">Re-eval</button>';
    html += '<button class="btn btn-sm btn-outline-secondary pt-view-eval-btn" data-id="' + ev.id + '">View</button>';
    html += '</div></div>';
    html += '<div class="pt-row" style="margin-top:8px">';
    if (ev.diagnosis) html += '<span class="pt-badge pt-badge-teal">Dx: ' + esc(ev.diagnosis) + '</span>';
    if (ev.wbStatus) html += '<span class="pt-badge pt-badge-blue">WB: ' + esc(ev.wbStatus) + '</span>';
    if (ev.bergTotal !== undefined && ev.bergTotal !== null) {
      var bergCls = ev.bergTotal <= 20 ? 'pt-badge-red' : ev.bergTotal <= 40 ? 'pt-badge-yellow' : 'pt-badge-green';
      html += '<span class="pt-badge ' + bergCls + '">Berg: ' + ev.bergTotal + '/56</span>';
    }
    if (ev.rehabPotential) html += '<span class="pt-badge pt-badge-gray">Rehab: ' + esc(ev.rehabPotential) + '</span>';
    html += '</div>';
    if (ev.funcMobility && ev.funcMobility.length) {
      html += '<div style="margin-top:8px;font-size:12px;color:var(--text-secondary,#666)">';
      var ambRow = ev.funcMobility.find(function(f) { return f.task === 'Ambulation'; });
      if (ambRow) html += 'Ambulation: ' + esc(ambRow.assistLevel || '') + (ambRow.distance ? ' / ' + esc(ambRow.distance) : '') + (ambRow.device ? ' with ' + esc(ambRow.device) : '');
      html += '</div>';
    }
    html += '</div>';
  });

  return html;
}

function _wireEvalTab(pid) {
  var btn = document.getElementById('pt-new-eval-btn');
  if (btn) btn.addEventListener('click', function() { openPTEvalModal(pid, null); });

  document.querySelectorAll('.pt-reeval-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var evId = this.getAttribute('data-id');
      var evals = getPTEvaluations(pid);
      var ev = evals.find(function(e) { return e.id === evId; });
      if (ev) openPTEvalModal(pid, ev);
    });
  });

  document.querySelectorAll('.pt-view-eval-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var evId = this.getAttribute('data-id');
      var evals = getPTEvaluations(pid);
      var ev = evals.find(function(e) { return e.id === evId; });
      if (ev) _viewEvalDetail(ev);
    });
  });
}

function _viewEvalDetail(ev) {
  var body = '<div style="max-height:70vh;overflow-y:auto;font-size:13px">';
  body += '<p><strong>Date:</strong> ' + formatDateTime(ev.createdAt) + '</p>';
  body += '<p><strong>Diagnosis:</strong> ' + esc(ev.diagnosis || '') + '</p>';
  body += '<p><strong>WB Status:</strong> ' + esc(ev.wbStatus || '') + '</p>';
  body += '<p><strong>Referring Provider:</strong> ' + esc(ev.referringProvider || '') + '</p>';
  if (ev.precautions && ev.precautions.length) body += '<p><strong>Precautions:</strong> ' + esc(ev.precautions.join(', ')) + '</p>';
  if (ev.bergTotal !== undefined) {
    var interp = ev.bergTotal <= 20 ? 'High fall risk' : ev.bergTotal <= 40 ? 'Medium fall risk' : 'Low fall risk';
    body += '<p><strong>Berg Balance:</strong> ' + ev.bergTotal + '/56 (' + interp + ')</p>';
  }
  if (ev.tugSeconds) body += '<p><strong>TUG:</strong> ' + ev.tugSeconds + 's' + (ev.tugSeconds > 12 ? ' (Fall risk)' : '') + '</p>';
  if (ev.rehabPotential) body += '<p><strong>Rehab Potential:</strong> ' + esc(ev.rehabPotential) + '</p>';
  if (ev.freqDuration) body += '<p><strong>Frequency:</strong> ' + esc(ev.freqDuration) + '</p>';
  if (ev.narrative) body += '<p><strong>Assessment:</strong> ' + esc(ev.narrative) + '</p>';
  body += '</div>';
  openModal({ title: 'PT Evaluation Detail', bodyHTML: body, footerHTML: '' });
}

/* ---------- PT Initial Evaluation Modal ---------- */
function openPTEvalModal(pid, prefill) {
  var isReeval = !!prefill;
  var pf = prefill || {};

  var body = '<div style="max-height:70vh;overflow-y:auto">';

  /* Section 1: Referral Info */
  body += '<div class="pt-section"><h4>1. Referral Info</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1;min-width:200px"><label class="form-label">Referring Provider</label>';
  body += '<input type="text" class="form-control" id="pt-ref-provider" value="' + esc(pf.referringProvider || '') + '"></div>';
  body += '<div class="form-group" style="flex:1;min-width:200px"><label class="form-label">Primary Diagnosis</label>';
  body += '<input type="text" class="form-control" id="pt-diagnosis" value="' + esc(pf.diagnosis || '') + '"></div>';
  body += '</div>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1;min-width:200px"><label class="form-label">Weight-Bearing Status</label>';
  body += '<select class="form-control" id="pt-wb-status">';
  ['WBAT','PWB','TDWB','NWB','FWB'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.wbStatus === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div></div>';
  body += '<div class="form-group"><label class="form-label">Precautions</label>';
  body += '<div class="pt-checkbox-group">';
  ['Hip precautions','Spinal precautions','Sternal precautions','Cardiac precautions'].forEach(function(p) {
    var checked = pf.precautions && pf.precautions.indexOf(p) >= 0 ? ' checked' : '';
    body += '<label><input type="checkbox" class="pt-precaution-cb" value="' + p + '"' + checked + '> ' + p + '</label>';
  });
  body += '</div></div>';
  body += '<div class="form-group"><label class="form-label">Additional Precautions</label>';
  body += '<textarea class="form-control" id="pt-add-precautions" rows="2">' + esc(pf.additionalPrecautions || '') + '</textarea></div>';
  body += '</div>';

  /* Section 2: Prior Level of Function */
  body += '<div class="pt-section"><h4>2. Prior Level of Function</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Mobility Status</label>';
  body += '<select class="form-control" id="pt-plof-mobility">';
  ['Independent','Modified Independent','Supervision','Min Assist','Mod Assist','Max Assist','Dependent'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.plofMobility === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Assistive Device</label>';
  body += '<select class="form-control" id="pt-plof-device">';
  ['None','Cane','Rolling Walker','Front-Wheeled Walker','Wheelchair','Other'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.plofDevice === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';
  body += '</div>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Living Situation</label>';
  body += '<select class="form-control" id="pt-plof-living">';
  ['Home alone','Home with family','Assisted living','SNF','Other'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.plofLiving === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Stairs</label>';
  body += '<select class="form-control" id="pt-plof-stairs">';
  ['None','Flight with rail','Flight without rail','Few steps'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.plofStairs === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';
  body += '</div></div>';

  /* Section 3: ROM Assessment Grid */
  body += '<div class="pt-section"><h4>3. ROM Assessment (Degrees)</h4>';
  body += '<table class="pt-grid-table"><thead><tr><th>Joint</th><th>Motion</th><th>Left</th><th>Right</th></tr></thead><tbody>';
  PT_ROM_JOINTS.forEach(function(jt) {
    jt.motions.forEach(function(m, mi) {
      var key = jt.joint + '_' + m.name;
      var pfL = pf.rom && pf.rom[key] ? pf.rom[key].left : '';
      var pfR = pf.rom && pf.rom[key] ? pf.rom[key].right : '';
      body += '<tr>';
      if (mi === 0) body += '<td rowspan="' + jt.motions.length + '" style="font-weight:600">' + jt.joint + '</td>';
      body += '<td>' + m.name + '</td>';
      body += '<td><input type="number" class="pt-rom-input" data-key="' + key + '" data-side="left" placeholder="' + m.normal + '" value="' + pfL + '"></td>';
      body += '<td><input type="number" class="pt-rom-input" data-key="' + key + '" data-side="right" placeholder="' + m.normal + '" value="' + pfR + '"></td>';
      body += '</tr>';
    });
  });
  body += '</tbody></table></div>';

  /* Section 4: MMT Grid */
  body += '<div class="pt-section"><h4>4. Manual Muscle Testing</h4>';
  body += '<table class="pt-grid-table"><thead><tr><th>Joint</th><th>Motion</th><th>Left</th><th>Right</th></tr></thead><tbody>';
  PT_ROM_JOINTS.forEach(function(jt) {
    jt.motions.forEach(function(m, mi) {
      var key = jt.joint + '_' + m.name;
      var pfL = pf.mmt && pf.mmt[key] ? pf.mmt[key].left : '';
      var pfR = pf.mmt && pf.mmt[key] ? pf.mmt[key].right : '';
      body += '<tr>';
      if (mi === 0) body += '<td rowspan="' + jt.motions.length + '" style="font-weight:600">' + jt.joint + '</td>';
      body += '<td>' + m.name + '</td>';
      body += '<td><select class="pt-mmt-sel" data-key="' + key + '" data-side="left"><option value="">--</option>';
      PT_MMT_GRADES.forEach(function(g) { body += '<option value="' + g + '"' + (pfL === g ? ' selected' : '') + '>' + g + '</option>'; });
      body += '</select></td>';
      body += '<td><select class="pt-mmt-sel" data-key="' + key + '" data-side="right"><option value="">--</option>';
      PT_MMT_GRADES.forEach(function(g) { body += '<option value="' + g + '"' + (pfR === g ? ' selected' : '') + '>' + g + '</option>'; });
      body += '</select></td>';
      body += '</tr>';
    });
  });
  body += '</tbody></table></div>';

  /* Section 5: Functional Mobility Assessment */
  body += '<div class="pt-section"><h4>5. Functional Mobility Assessment</h4>';
  body += '<table class="pt-grid-table"><thead><tr><th>Task</th><th>Assistance Level</th><th>Distance/Reps</th><th>Assistive Device</th><th>Notes</th></tr></thead><tbody>';
  PT_FUNC_TASKS.forEach(function(task) {
    var pfRow = pf.funcMobility ? pf.funcMobility.find(function(f) { return f.task === task; }) : null;
    body += '<tr>';
    body += '<td style="font-weight:500;white-space:nowrap">' + task + '</td>';
    body += '<td><select class="pt-func-assist" data-task="' + task + '">';
    body += '<option value="">--</option>';
    PT_ASSIST_LEVELS.forEach(function(l) {
      body += '<option value="' + l + '"' + (pfRow && pfRow.assistLevel === l ? ' selected' : '') + '>' + l + '</option>';
    });
    body += '</select></td>';
    body += '<td><input type="text" class="pt-func-dist" data-task="' + task + '" style="width:80px" value="' + esc(pfRow ? pfRow.distance || '' : '') + '"></td>';
    body += '<td><input type="text" class="pt-func-device" data-task="' + task + '" style="width:100px" value="' + esc(pfRow ? pfRow.device || '' : '') + '"></td>';
    body += '<td><input type="text" class="pt-func-notes" data-task="' + task + '" style="width:120px" value="' + esc(pfRow ? pfRow.notes || '' : '') + '"></td>';
    body += '</tr>';
  });
  body += '</tbody></table></div>';

  /* Section 6: Balance Assessment */
  body += '<div class="pt-section"><h4>6. Balance Assessment</h4>';
  body += '<h5 style="margin:0 0 8px 0;font-size:13px;color:var(--accent-pt)">Berg Balance Scale (0-56)</h5>';
  body += '<table class="pt-grid-table"><thead><tr><th>Item</th><th>Score (0-4)</th></tr></thead><tbody>';
  PT_BERG_ITEMS.forEach(function(item, idx) {
    var pfVal = pf.berg && pf.berg[idx] !== undefined ? pf.berg[idx] : '';
    body += '<tr><td>' + item + '</td><td><select class="pt-berg-sel" data-idx="' + idx + '">';
    body += '<option value="">--</option>';
    for (var b = 0; b <= 4; b++) {
      body += '<option value="' + b + '"' + (pfVal === b || pfVal === '' + b ? ' selected' : '') + '>' + b + '</option>';
    }
    body += '</select></td></tr>';
  });
  body += '</tbody></table>';
  body += '<div id="pt-berg-total" class="pt-score-box" style="margin-top:8px">Berg Total: --</div>';

  body += '<div style="margin-top:16px">';
  body += '<h5 style="margin:0 0 8px 0;font-size:13px;color:var(--accent-pt)">Timed Up and Go (TUG)</h5>';
  body += '<div class="pt-row"><label>Seconds: <input type="number" step="0.1" class="form-control" id="pt-tug" style="max-width:100px" value="' + (pf.tugSeconds || '') + '"></label>';
  body += '<span id="pt-tug-interp" style="margin-left:8px;font-size:13px"></span></div>';
  body += '</div>';

  body += '<div style="margin-top:16px">';
  body += '<h5 style="margin:0 0 8px 0;font-size:13px;color:var(--accent-pt)">Single Leg Stance</h5>';
  body += '<div class="pt-row">';
  body += '<label>Left (sec): <input type="number" step="0.1" class="form-control" id="pt-sls-left" style="max-width:100px" value="' + (pf.slsLeft || '') + '"></label>';
  body += '<label>Right (sec): <input type="number" step="0.1" class="form-control" id="pt-sls-right" style="max-width:100px" value="' + (pf.slsRight || '') + '"></label>';
  body += '</div></div>';
  body += '</div>';

  /* Section 7: Gait Analysis */
  body += '<div class="pt-section"><h4>7. Gait Analysis</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1;min-width:200px"><label class="form-label">Assistive Device</label>';
  body += '<select class="form-control" id="pt-gait-device">';
  ['None','SPC','NBQC','WBQC','Hemi-walker','Rolling walker','FWW','Platform walker','Crutches'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.gaitDevice === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div></div>';
  body += '<div class="form-group"><label class="form-label">Gait Deviations</label>';
  body += '<div class="pt-checkbox-group">';
  PT_GAIT_DEVIATIONS.forEach(function(d) {
    var checked = pf.gaitDeviations && pf.gaitDeviations.indexOf(d) >= 0 ? ' checked' : '';
    body += '<label><input type="checkbox" class="pt-gait-dev-cb" value="' + d + '"' + checked + '> ' + d + '</label>';
  });
  body += '</div></div>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Distance (feet)</label>';
  body += '<input type="number" class="form-control" id="pt-gait-dist" value="' + (pf.gaitDistance || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Assistance Level</label>';
  body += '<select class="form-control" id="pt-gait-assist">';
  body += '<option value="">--</option>';
  PT_ASSIST_LEVELS.forEach(function(l) {
    body += '<option value="' + l + '"' + (pf.gaitAssist === l ? ' selected' : '') + '>' + l + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Endurance (min)</label>';
  body += '<input type="number" class="form-control" id="pt-gait-endurance" value="' + (pf.gaitEndurance || '') + '"></div>';
  body += '</div></div>';

  /* Section 8: Pain Assessment */
  body += '<div class="pt-section"><h4>8. Pain Assessment</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1;min-width:150px"><label class="form-label">Location</label>';
  body += '<select class="form-control" id="pt-pain-loc">';
  body += '<option value="">--</option>';
  PT_PAIN_LOCATIONS.forEach(function(l) {
    body += '<option value="' + l + '"' + (pf.painLocation === l ? ' selected' : '') + '>' + l + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group" style="flex:1;min-width:100px"><label class="form-label">Score (0-10)</label>';
  body += '<select class="form-control" id="pt-pain-score">';
  for (var ps = 0; ps <= 10; ps++) {
    body += '<option value="' + ps + '"' + (pf.painScore == ps ? ' selected' : '') + '>' + ps + '</option>';
  }
  body += '</select></div></div>';
  body += '<div class="form-group"><label class="form-label">Aggravating Factors</label>';
  body += '<div class="pt-checkbox-group">';
  PT_PAIN_AGGRAVATING.forEach(function(f) {
    var checked = pf.painAggravating && pf.painAggravating.indexOf(f) >= 0 ? ' checked' : '';
    body += '<label><input type="checkbox" class="pt-pain-agg-cb" value="' + f + '"' + checked + '> ' + f + '</label>';
  });
  body += '</div></div>';
  body += '<div class="form-group"><label class="form-label">Alleviating Factors</label>';
  body += '<div class="pt-checkbox-group">';
  PT_PAIN_ALLEVIATING.forEach(function(f) {
    var checked = pf.painAlleviating && pf.painAlleviating.indexOf(f) >= 0 ? ' checked' : '';
    body += '<label><input type="checkbox" class="pt-pain-all-cb" value="' + f + '"' + checked + '> ' + f + '</label>';
  });
  body += '</div></div>';
  body += '<div class="form-group"><label class="form-label">Pain Type</label>';
  body += '<div style="display:flex;gap:16px">';
  body += '<label><input type="radio" name="pt-pain-type" value="With movement"' + (pf.painType === 'With movement' ? ' checked' : (!pf.painType ? ' checked' : '')) + '> With movement</label>';
  body += '<label><input type="radio" name="pt-pain-type" value="At rest"' + (pf.painType === 'At rest' ? ' checked' : '') + '> At rest</label>';
  body += '</div></div>';
  body += '</div>';

  /* Section 9: Assessment & Plan */
  body += '<div class="pt-section"><h4>9. Assessment & Plan</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Rehab Potential</label>';
  body += '<select class="form-control" id="pt-rehab-potential">';
  ['Excellent','Good','Fair','Poor'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.rehabPotential === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group" style="flex:1;min-width:200px"><label class="form-label">Frequency / Duration</label>';
  body += '<input type="text" class="form-control" id="pt-freq-duration" placeholder="e.g., 3x/week x 4 weeks" value="' + esc(pf.freqDuration || '') + '"></div>';
  body += '</div>';
  body += '<div class="form-group"><label class="form-label">Narrative Assessment</label>';
  body += '<textarea class="form-control" id="pt-narrative" rows="4">' + esc(pf.narrative || '') + '</textarea></div>';
  body += '</div>';

  if (isReeval) {
    body += '<div style="background:var(--badge-warning-bg);border:1px solid #ffc107;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px">';
    body += '<strong>Re-evaluation:</strong> Pre-populated from previous evaluation dated ' + formatDateTime(pf.createdAt) + '. Update values as needed.';
    body += '</div>';
  }

  body += '</div>'; /* close scrollable wrapper */

  var footer = '<button class="btn btn-primary" id="pt-save-eval" style="background:var(--accent-pt);border-color:var(--accent-pt)">' + (isReeval ? 'Save Re-evaluation' : 'Save Evaluation') + '</button>';

  openModal({ title: isReeval ? 'PT Re-evaluation' : 'PT Initial Evaluation', bodyHTML: body, footerHTML: footer });

  /* Wire Berg auto-sum */
  setTimeout(function() {
    _updateBergTotal();
    document.querySelectorAll('.pt-berg-sel').forEach(function(sel) {
      sel.addEventListener('change', _updateBergTotal);
    });
    var tugInput = document.getElementById('pt-tug');
    if (tugInput) tugInput.addEventListener('input', function() {
      var val = parseFloat(this.value);
      var el = document.getElementById('pt-tug-interp');
      if (el) el.textContent = val > 12 ? 'Fall risk (>12s)' : (val > 0 ? 'Normal' : '');
      if (el) el.style.color = val > 12 ? '#721c24' : '#155724';
    });

    /* Save handler */
    document.getElementById('pt-save-eval').addEventListener('click', function() {
      _saveEvalFromModal(pid, isReeval ? pf : null);
    });
  }, 100);
}

function _updateBergTotal() {
  var total = 0;
  var answered = 0;
  document.querySelectorAll('.pt-berg-sel').forEach(function(sel) {
    if (sel.value !== '') { total += parseInt(sel.value); answered++; }
  });
  var el = document.getElementById('pt-berg-total');
  if (!el) return;
  if (answered === 0) { el.textContent = 'Berg Total: --'; el.className = 'pt-score-box'; return; }
  var interp = total <= 20 ? 'High fall risk' : total <= 40 ? 'Medium fall risk' : 'Low fall risk';
  var cls = total <= 20 ? 'pt-risk-high' : total <= 40 ? 'pt-risk-med' : 'pt-risk-low';
  el.textContent = 'Berg Total: ' + total + '/56 (' + interp + ')';
  el.className = 'pt-score-box ' + cls;
}

function _saveEvalFromModal(pid, prevEval) {
  var data = {
    patientId: pid,
    providerId: getSessionUser().id,
    referringProvider: document.getElementById('pt-ref-provider').value,
    diagnosis: document.getElementById('pt-diagnosis').value,
    wbStatus: document.getElementById('pt-wb-status').value,
    additionalPrecautions: document.getElementById('pt-add-precautions').value,
    plofMobility: document.getElementById('pt-plof-mobility').value,
    plofDevice: document.getElementById('pt-plof-device').value,
    plofLiving: document.getElementById('pt-plof-living').value,
    plofStairs: document.getElementById('pt-plof-stairs').value,
    rehabPotential: document.getElementById('pt-rehab-potential').value,
    freqDuration: document.getElementById('pt-freq-duration').value,
    narrative: document.getElementById('pt-narrative').value,
    gaitDevice: document.getElementById('pt-gait-device').value,
    gaitDistance: parseFloat(document.getElementById('pt-gait-dist').value) || null,
    gaitAssist: document.getElementById('pt-gait-assist').value,
    gaitEndurance: parseFloat(document.getElementById('pt-gait-endurance').value) || null,
    painLocation: document.getElementById('pt-pain-loc').value,
    painScore: parseInt(document.getElementById('pt-pain-score').value) || 0,
    tugSeconds: parseFloat(document.getElementById('pt-tug').value) || null,
    slsLeft: parseFloat(document.getElementById('pt-sls-left').value) || null,
    slsRight: parseFloat(document.getElementById('pt-sls-right').value) || null,
    isReeval: !!prevEval,
    previousEvalId: prevEval ? prevEval.id : null
  };

  /* Precautions */
  data.precautions = [];
  document.querySelectorAll('.pt-precaution-cb:checked').forEach(function(cb) { data.precautions.push(cb.value); });

  /* ROM */
  data.rom = {};
  document.querySelectorAll('.pt-rom-input').forEach(function(inp) {
    var key = inp.getAttribute('data-key');
    var side = inp.getAttribute('data-side');
    if (!data.rom[key]) data.rom[key] = {};
    data.rom[key][side] = inp.value ? parseFloat(inp.value) : null;
  });

  /* MMT */
  data.mmt = {};
  document.querySelectorAll('.pt-mmt-sel').forEach(function(sel) {
    var key = sel.getAttribute('data-key');
    var side = sel.getAttribute('data-side');
    if (!data.mmt[key]) data.mmt[key] = {};
    data.mmt[key][side] = sel.value || null;
  });

  /* Functional Mobility */
  data.funcMobility = [];
  PT_FUNC_TASKS.forEach(function(task) {
    var assist = document.querySelector('.pt-func-assist[data-task="' + task + '"]');
    var dist = document.querySelector('.pt-func-dist[data-task="' + task + '"]');
    var device = document.querySelector('.pt-func-device[data-task="' + task + '"]');
    var notes = document.querySelector('.pt-func-notes[data-task="' + task + '"]');
    data.funcMobility.push({
      task: task,
      assistLevel: assist ? assist.value : '',
      distance: dist ? dist.value : '',
      device: device ? device.value : '',
      notes: notes ? notes.value : ''
    });
  });

  /* Berg */
  data.berg = {};
  var bergTotal = 0;
  var bergAnswered = 0;
  document.querySelectorAll('.pt-berg-sel').forEach(function(sel) {
    var idx = sel.getAttribute('data-idx');
    if (sel.value !== '') { data.berg[idx] = parseInt(sel.value); bergTotal += parseInt(sel.value); bergAnswered++; }
  });
  data.bergTotal = bergAnswered > 0 ? bergTotal : null;

  /* Gait deviations */
  data.gaitDeviations = [];
  document.querySelectorAll('.pt-gait-dev-cb:checked').forEach(function(cb) { data.gaitDeviations.push(cb.value); });

  /* Pain */
  data.painAggravating = [];
  document.querySelectorAll('.pt-pain-agg-cb:checked').forEach(function(cb) { data.painAggravating.push(cb.value); });
  data.painAlleviating = [];
  document.querySelectorAll('.pt-pain-all-cb:checked').forEach(function(cb) { data.painAlleviating.push(cb.value); });
  var painTypeEl = document.querySelector('input[name="pt-pain-type"]:checked');
  data.painType = painTypeEl ? painTypeEl.value : '';

  savePTEvaluation(data);
  closeAllModals();
  showToast(data.isReeval ? 'Re-evaluation saved' : 'PT evaluation saved', 'success');
  if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
}


/* ============================================================
   TAB 2: TREATMENT SESSIONS
   ============================================================ */
function _buildSessionTab(pid) {
  var sessions = getPTSessions(pid).sort(function(a, b) {
    return new Date(b.sessionDate || b.createdAt || 0) - new Date(a.sessionDate || a.createdAt || 0);
  });
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<h3>Treatment Sessions</h3>';
  html += '<button class="btn btn-primary" id="pt-new-session-btn" style="background:var(--accent-pt);border-color:var(--accent-pt)">+ New Session</button>';
  html += '</div>';

  if (!sessions.length) {
    html += '<div class="pt-empty"><p>No treatment sessions recorded.</p></div>';
    return html;
  }

  html += '<table class="pt-table"><thead><tr><th>Date</th><th>Duration</th><th>Modalities</th><th>Response</th><th>Provider</th><th></th></tr></thead><tbody>';
  sessions.forEach(function(s) {
    html += '<tr>';
    html += '<td>' + (s.sessionDate || formatDateTime(s.createdAt)) + '</td>';
    html += '<td>' + (s.duration || '--') + ' min</td>';
    html += '<td>';
    (s.modalities || []).forEach(function(m) {
      if (m.checked) html += '<span class="pt-badge pt-badge-teal">' + esc(m.name) + '</span>';
    });
    html += '</td>';
    html += '<td>' + esc(s.patientResponse || '') + '</td>';
    html += '<td>' + esc(s.providerName || '') + '</td>';
    html += '<td><button class="btn btn-sm btn-outline-secondary pt-view-session-btn" data-id="' + s.id + '">View</button></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function _wireSessionTab(pid) {
  var btn = document.getElementById('pt-new-session-btn');
  if (btn) btn.addEventListener('click', function() { openPTSessionModal(pid, null); });

  document.querySelectorAll('.pt-view-session-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var sId = this.getAttribute('data-id');
      var sessions = getPTSessions(pid);
      var s = sessions.find(function(x) { return x.id === sId; });
      if (s) openPTSessionModal(pid, s);
    });
  });
}

function openPTSessionModal(pid, prefill) {
  var pf = prefill || {};
  var today = new Date().toISOString().slice(0, 10);
  var user = getSessionUser();
  var providerName = user ? ((user.lastName ? (user.lastName + ', ') : '') + (user.firstName || user.name || user.id)) : '';

  var body = '<div style="max-height:70vh;overflow-y:auto">';

  body += '<div class="pt-section"><h4>Session Info</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Session Date</label>';
  body += '<input type="date" class="form-control" id="pt-sess-date" value="' + (pf.sessionDate || today) + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Duration (minutes)</label>';
  body += '<input type="number" class="form-control" id="pt-sess-duration" value="' + (pf.duration || '') + '"></div>';
  body += '</div></div>';

  /* Modalities with minutes */
  body += '<div class="pt-section"><h4>Modalities Performed</h4>';
  PT_MODALITIES.forEach(function(mod) {
    var pfMod = pf.modalities ? pf.modalities.find(function(m) { return m.code === mod.code; }) : null;
    var checked = pfMod && pfMod.checked ? ' checked' : '';
    var mins = pfMod ? pfMod.minutes || '' : '';
    body += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">';
    body += '<label style="min-width:250px"><input type="checkbox" class="pt-mod-cb" data-code="' + mod.code + '"' + checked + '> ' + mod.name + ' (' + mod.code + ')</label>';
    body += '<input type="number" class="form-control pt-mod-min" data-code="' + mod.code + '" style="max-width:80px" placeholder="min" value="' + mins + '">';
    body += '</div>';
  });
  body += '</div>';

  /* Modality Parameters (collapsible) */
  body += '<div class="pt-collapsible-header" id="pt-modparam-toggle">Modality Parameters (click to expand)</div>';
  body += '<div class="pt-collapsible-body" id="pt-modparam-body">';

  /* Ultrasound */
  body += '<div class="pt-section" style="margin-bottom:12px"><h4 style="font-size:13px">Ultrasound</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Frequency (MHz)</label>';
  body += '<select class="form-control" id="pt-us-freq"><option value="">--</option><option value="1"' + (pf.usFreq == '1' ? ' selected' : '') + '>1 MHz</option><option value="3"' + (pf.usFreq == '3' ? ' selected' : '') + '>3 MHz</option></select></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Intensity (W/cm2)</label>';
  body += '<input type="number" step="0.1" class="form-control" id="pt-us-intensity" value="' + (pf.usIntensity || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Duration (min)</label>';
  body += '<input type="number" class="form-control" id="pt-us-duration" value="' + (pf.usDuration || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Technique</label>';
  body += '<select class="form-control" id="pt-us-technique"><option value="Continuous"' + (pf.usTechnique === 'Continuous' ? ' selected' : '') + '>Continuous</option><option value="Pulsed"' + (pf.usTechnique === 'Pulsed' ? ' selected' : '') + '>Pulsed</option></select></div>';
  body += '</div></div>';

  /* E-Stim */
  body += '<div class="pt-section" style="margin-bottom:12px"><h4 style="font-size:13px">E-Stim</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Type</label>';
  body += '<select class="form-control" id="pt-estim-type"><option value="">--</option>';
  ['NMES','TENS','IFC','Russian'].forEach(function(t) {
    body += '<option value="' + t + '"' + (pf.estimType === t ? ' selected' : '') + '>' + t + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Frequency (Hz)</label>';
  body += '<input type="number" class="form-control" id="pt-estim-freq" value="' + (pf.estimFreq || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Pulse Width (us)</label>';
  body += '<input type="number" class="form-control" id="pt-estim-pw" value="' + (pf.estimPW || '') + '"></div>';
  body += '</div>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Intensity (mA)</label>';
  body += '<input type="number" class="form-control" id="pt-estim-intensity" value="' + (pf.estimIntensity || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Duration (min)</label>';
  body += '<input type="number" class="form-control" id="pt-estim-duration" value="' + (pf.estimDuration || '') + '"></div>';
  body += '</div></div>';

  /* Hot/Cold Pack */
  body += '<div class="pt-section"><h4 style="font-size:13px">Hot Pack / Cold Pack</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Duration (min)</label>';
  body += '<input type="number" class="form-control" id="pt-hc-duration" value="' + (pf.hcDuration || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">Area</label>';
  body += '<input type="text" class="form-control" id="pt-hc-area" value="' + esc(pf.hcArea || '') + '"></div>';
  body += '</div></div>';
  body += '</div>'; /* close collapsible body */

  /* Vital Signs */
  body += '<div class="pt-section"><h4>Vital Signs</h4>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">HR Pre</label><input type="number" class="form-control" id="pt-hr-pre" value="' + (pf.hrPre || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">HR Post</label><input type="number" class="form-control" id="pt-hr-post" value="' + (pf.hrPost || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">BP Pre (sys/dia)</label>';
  body += '<div style="display:flex;gap:4px"><input type="number" class="form-control" id="pt-bp-pre-sys" style="width:60px" placeholder="sys" value="' + (pf.bpPreSys || '') + '">';
  body += '<span style="line-height:32px">/</span>';
  body += '<input type="number" class="form-control" id="pt-bp-pre-dia" style="width:60px" placeholder="dia" value="' + (pf.bpPreDia || '') + '"></div></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">BP Post (sys/dia)</label>';
  body += '<div style="display:flex;gap:4px"><input type="number" class="form-control" id="pt-bp-post-sys" style="width:60px" placeholder="sys" value="' + (pf.bpPostSys || '') + '">';
  body += '<span style="line-height:32px">/</span>';
  body += '<input type="number" class="form-control" id="pt-bp-post-dia" style="width:60px" placeholder="dia" value="' + (pf.bpPostDia || '') + '"></div></div>';
  body += '</div>';
  body += '<div class="pt-row">';
  body += '<div class="form-group" style="flex:1"><label class="form-label">SpO2 Pre</label><input type="number" class="form-control" id="pt-spo2-pre" value="' + (pf.spo2Pre || '') + '"></div>';
  body += '<div class="form-group" style="flex:1"><label class="form-label">SpO2 Post</label><input type="number" class="form-control" id="pt-spo2-post" value="' + (pf.spo2Post || '') + '"></div>';
  body += '</div></div>';

  /* Response & Notes */
  body += '<div class="pt-section"><h4>Response & Notes</h4>';
  body += '<div class="form-group"><label class="form-label">Patient Response</label>';
  body += '<select class="form-control" id="pt-sess-response">';
  ['Tolerated Well','Tolerated with Modifications','Did Not Tolerate'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.patientResponse === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group"><label class="form-label">Functional Progress Notes</label>';
  body += '<textarea class="form-control" id="pt-sess-progress" rows="3">' + esc(pf.progressNotes || '') + '</textarea></div>';
  body += '<div class="form-group"><label class="form-label">Next Session Plan</label>';
  body += '<textarea class="form-control" id="pt-sess-next" rows="2">' + esc(pf.nextPlan || '') + '</textarea></div>';
  body += '</div>';

  body += '</div>';

  var footer = '<button class="btn btn-primary" id="pt-save-session" style="background:var(--accent-pt);border-color:var(--accent-pt)">Save Session</button>';

  openModal({ title: prefill ? 'View/Edit Treatment Session' : 'New Treatment Session', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    /* Collapsible toggle */
    var toggle = document.getElementById('pt-modparam-toggle');
    if (toggle) toggle.addEventListener('click', function() {
      var body = document.getElementById('pt-modparam-body');
      if (body) body.classList.toggle('open');
    });

    document.getElementById('pt-save-session').addEventListener('click', function() {
      var data = {
        patientId: pid,
        providerId: getSessionUser().id,
        providerName: providerName,
        sessionDate: document.getElementById('pt-sess-date').value,
        duration: parseInt(document.getElementById('pt-sess-duration').value) || null,
        patientResponse: document.getElementById('pt-sess-response').value,
        progressNotes: document.getElementById('pt-sess-progress').value,
        nextPlan: document.getElementById('pt-sess-next').value,
        /* Vitals */
        hrPre: parseInt(document.getElementById('pt-hr-pre').value) || null,
        hrPost: parseInt(document.getElementById('pt-hr-post').value) || null,
        bpPreSys: parseInt(document.getElementById('pt-bp-pre-sys').value) || null,
        bpPreDia: parseInt(document.getElementById('pt-bp-pre-dia').value) || null,
        bpPostSys: parseInt(document.getElementById('pt-bp-post-sys').value) || null,
        bpPostDia: parseInt(document.getElementById('pt-bp-post-dia').value) || null,
        spo2Pre: parseInt(document.getElementById('pt-spo2-pre').value) || null,
        spo2Post: parseInt(document.getElementById('pt-spo2-post').value) || null,
        /* Modality params */
        usFreq: document.getElementById('pt-us-freq').value,
        usIntensity: parseFloat(document.getElementById('pt-us-intensity').value) || null,
        usDuration: parseInt(document.getElementById('pt-us-duration').value) || null,
        usTechnique: document.getElementById('pt-us-technique').value,
        estimType: document.getElementById('pt-estim-type').value,
        estimFreq: parseInt(document.getElementById('pt-estim-freq').value) || null,
        estimPW: parseInt(document.getElementById('pt-estim-pw').value) || null,
        estimIntensity: parseInt(document.getElementById('pt-estim-intensity').value) || null,
        estimDuration: parseInt(document.getElementById('pt-estim-duration').value) || null,
        hcDuration: parseInt(document.getElementById('pt-hc-duration').value) || null,
        hcArea: document.getElementById('pt-hc-area').value
      };

      /* Modalities */
      data.modalities = [];
      PT_MODALITIES.forEach(function(mod) {
        var cb = document.querySelector('.pt-mod-cb[data-code="' + mod.code + '"]');
        var min = document.querySelector('.pt-mod-min[data-code="' + mod.code + '"]');
        data.modalities.push({
          code: mod.code,
          name: mod.name,
          checked: cb ? cb.checked : false,
          minutes: min ? parseInt(min.value) || null : null
        });
      });

      if (prefill && prefill.id) data.id = prefill.id;
      savePTSession(data);
      closeAllModals();
      showToast('Treatment session saved', 'success');
      if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
    });
  }, 100);
}


/* ============================================================
   TAB 3: GOALS & OUTCOMES
   ============================================================ */
function _buildGoalsTab(pid) {
  var goals = getPTGoals(pid);
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<h3>Goals & Outcomes</h3>';
  html += '<div style="display:flex;gap:8px">';
  html += '<button class="btn btn-primary" id="pt-new-goal-btn" style="background:var(--accent-pt);border-color:var(--accent-pt)">+ New Goal</button>';
  html += '<button class="btn btn-outline-secondary" id="pt-outcome-btn">Outcome Measures</button>';
  html += '</div></div>';

  /* Group by status */
  var grouped = { Active: [], Met: [], Modified: [], Discontinued: [] };
  goals.forEach(function(g) {
    var s = g.status || 'Active';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(g);
  });

  var statusConfig = [
    { key: 'Active', label: 'Active Goals', cls: 'pt-goal-active' },
    { key: 'Met', label: 'Met Goals', cls: 'pt-goal-met' },
    { key: 'Modified', label: 'Modified Goals', cls: 'pt-goal-modified' },
    { key: 'Discontinued', label: 'Discontinued Goals', cls: 'pt-goal-discontinued' }
  ];

  var anyGoals = false;
  statusConfig.forEach(function(sc) {
    if (!grouped[sc.key] || !grouped[sc.key].length) return;
    anyGoals = true;
    html += '<h4 style="margin:16px 0 8px 0;color:var(--text-secondary,#666)">' + sc.label + '</h4>';
    grouped[sc.key].forEach(function(g) {
      html += '<div class="pt-goal-section ' + sc.cls + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      html += '<div>';
      html += '<span class="pt-badge ' + (g.goalType === 'Short-term' ? 'pt-badge-teal' : 'pt-badge-blue') + '">' + esc(g.goalType || 'Goal') + '</span>';
      if (g.targetDate) html += '<span style="font-size:12px;color:var(--text-secondary,#666);margin-left:8px">Target: ' + esc(g.targetDate) + '</span>';
      html += '</div>';
      html += '<button class="btn btn-sm btn-outline-primary pt-update-goal-btn" data-id="' + g.id + '">Update</button>';
      html += '</div>';
      html += '<p style="margin:8px 0 4px 0;font-size:14px">' + esc(g.goalText || '') + '</p>';
      if (g.measurableCriteria) html += '<p style="font-size:12px;color:var(--text-secondary,#666)">Criteria: ' + esc(g.measurableCriteria) + '</p>';
      if (g.progressHistory && g.progressHistory.length) {
        html += '<div style="margin-top:8px;font-size:12px;border-top:1px solid var(--border);padding-top:6px">';
        html += '<strong>Progress Notes:</strong>';
        g.progressHistory.forEach(function(ph) {
          html += '<div style="margin-top:4px;padding-left:8px;border-left:2px solid #ddd">' + esc(ph.note) + ' <em style="color:var(--text-secondary,#666)">(' + formatDateTime(ph.date) + ')</em></div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
  });

  if (!anyGoals) {
    html += '<div class="pt-empty"><p>No goals set. Click "+ New Goal" to add one.</p></div>';
  }

  return html;
}

function _wireGoalsTab(pid) {
  var newBtn = document.getElementById('pt-new-goal-btn');
  if (newBtn) newBtn.addEventListener('click', function() { openPTGoalModal(pid, null); });

  var outcomeBtn = document.getElementById('pt-outcome-btn');
  if (outcomeBtn) outcomeBtn.addEventListener('click', function() { _openOutcomeMeasures(pid); });

  document.querySelectorAll('.pt-update-goal-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var gId = this.getAttribute('data-id');
      var goals = getPTGoals(pid);
      var g = goals.find(function(x) { return x.id === gId; });
      if (g) openPTGoalModal(pid, g);
    });
  });
}

function openPTGoalModal(pid, existing) {
  var pf = existing || {};
  var body = '<div style="display:flex;flex-direction:column;gap:12px">';

  body += '<div class="form-group"><label class="form-label">Goal Type</label>';
  body += '<select class="form-control" id="pt-goal-type">';
  ['Short-term','Long-term'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.goalType === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';

  body += '<div class="form-group"><label class="form-label">Goal Text</label>';
  body += '<div style="font-size:11px;color:var(--text-secondary,#666);margin-bottom:4px">Template: "Patient will [action] with [assistance level] for [distance/reps] within [timeframe]"</div>';
  body += '<textarea class="form-control" id="pt-goal-text" rows="3">' + esc(pf.goalText || '') + '</textarea></div>';

  body += '<div class="form-group"><label class="form-label">Measurable Criteria</label>';
  body += '<input type="text" class="form-control" id="pt-goal-criteria" value="' + esc(pf.measurableCriteria || '') + '"></div>';

  body += '<div class="form-group"><label class="form-label">Target Date</label>';
  body += '<input type="date" class="form-control" id="pt-goal-target" value="' + (pf.targetDate || '') + '"></div>';

  body += '<div class="form-group"><label class="form-label">Status</label>';
  body += '<select class="form-control" id="pt-goal-status">';
  ['Active','Met','Modified','Discontinued'].forEach(function(v) {
    body += '<option value="' + v + '"' + (pf.status === v ? ' selected' : '') + '>' + v + '</option>';
  });
  body += '</select></div>';

  body += '<div class="form-group"><label class="form-label">Add Progress Note</label>';
  body += '<textarea class="form-control" id="pt-goal-progress" rows="2" placeholder="New progress note (appended to history)"></textarea></div>';

  if (pf.progressHistory && pf.progressHistory.length) {
    body += '<div style="background:var(--bg-main,#f8f9fa);border-radius:6px;padding:10px"><strong style="font-size:12px">Progress History:</strong>';
    pf.progressHistory.forEach(function(ph) {
      body += '<div style="font-size:12px;margin-top:4px;padding-left:8px;border-left:2px solid #ddd">' + esc(ph.note) + ' <em>(' + formatDateTime(ph.date) + ')</em></div>';
    });
    body += '</div>';
  }

  body += '</div>';

  var footer = '<button class="btn btn-primary" id="pt-save-goal" style="background:var(--accent-pt);border-color:var(--accent-pt)">Save Goal</button>';

  openModal({ title: existing ? 'Update Goal' : 'New PT Goal', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('pt-save-goal').addEventListener('click', function() {
      var data = existing ? JSON.parse(JSON.stringify(existing)) : { patientId: pid, providerId: getSessionUser().id };
      data.goalType = document.getElementById('pt-goal-type').value;
      data.goalText = document.getElementById('pt-goal-text').value;
      data.measurableCriteria = document.getElementById('pt-goal-criteria').value;
      data.targetDate = document.getElementById('pt-goal-target').value;
      data.status = document.getElementById('pt-goal-status').value;

      var newNote = document.getElementById('pt-goal-progress').value.trim();
      if (newNote) {
        if (!data.progressHistory) data.progressHistory = [];
        data.progressHistory.push({ note: newNote, date: new Date().toISOString(), by: getSessionUser().id });
      }

      savePTGoal(data);
      closeAllModals();
      showToast('Goal saved', 'success');
      if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
    });
  }, 100);
}

/* ---------- Outcome Measures ---------- */
function _openOutcomeMeasures(pid) {
  var body = '<div style="display:flex;flex-direction:column;gap:12px">';
  body += '<p style="font-size:13px;color:var(--text-secondary,#666)">Select a standardized outcome measure to administer:</p>';

  var measures = [
    { key: 'DASH', label: 'DASH (Upper Extremity)', desc: '30 items, scores 0-100' },
    { key: 'LEFS', label: 'LEFS (Lower Extremity)', desc: '20 items, scores 0-80' },
    { key: 'ODI', label: 'ODI (Oswestry - Back)', desc: '10 sections, 0-100%' },
    { key: 'NDI', label: 'NDI (Neck Disability)', desc: '10 items, 0-100%' }
  ];

  measures.forEach(function(m) {
    body += '<div class="pt-hep-lib-item pt-outcome-measure-btn" data-measure="' + m.key + '">';
    body += '<strong>' + m.label + '</strong><br><span style="font-size:11px;color:var(--text-secondary,#666)">' + m.desc + '</span>';
    body += '</div>';
  });

  /* Show history */
  var goals = getPTGoals(pid);
  var outcomeRecords = goals.filter(function(g) { return g.isOutcomeMeasure; }).sort(function(a, b) {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  if (outcomeRecords.length) {
    body += '<div style="margin-top:12px;border-top:1px solid #ddd;padding-top:12px"><strong>Score History</strong>';
    outcomeRecords.forEach(function(r) {
      body += '<div style="font-size:13px;padding:6px 0;border-bottom:1px solid #eee">';
      body += '<span class="pt-badge pt-badge-teal">' + esc(r.measureType || '') + '</span> ';
      body += 'Score: <strong>' + r.score + '</strong>';
      if (r.interpretation) body += ' (' + esc(r.interpretation) + ')';
      body += ' &mdash; ' + formatDateTime(r.createdAt);
      body += '</div>';
    });
    body += '</div>';
  }

  body += '</div>';

  openModal({ title: 'Outcome Measures', bodyHTML: body, footerHTML: '' });

  setTimeout(function() {
    document.querySelectorAll('.pt-outcome-measure-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var measure = this.getAttribute('data-measure');
        closeAllModals();
        if (measure === 'DASH') _openDASH(pid);
        else if (measure === 'LEFS') _openLEFS(pid);
        else if (measure === 'ODI') _openODI(pid);
        else if (measure === 'NDI') _openNDI(pid);
      });
    });
  }, 100);
}

function _openDASH(pid) {
  var body = '<div style="max-height:60vh;overflow-y:auto"><p style="font-size:12px;margin-bottom:12px">Rate your ability to do the following activities (1=No difficulty, 5=Unable):</p>';
  body += '<table class="pt-grid-table"><thead><tr><th style="width:60%">Activity</th><th>Score (1-5)</th></tr></thead><tbody>';
  PT_DASH_ITEMS.forEach(function(item, idx) {
    body += '<tr><td style="font-size:12px">' + (idx + 1) + '. ' + esc(item) + '</td>';
    body += '<td><select class="pt-dash-sel" data-idx="' + idx + '"><option value="">--</option>';
    for (var i = 1; i <= 5; i++) body += '<option value="' + i + '">' + i + '</option>';
    body += '</select></td></tr>';
  });
  body += '</tbody></table></div>';

  var footer = '<button class="btn btn-primary" id="pt-save-dash" style="background:var(--accent-pt);border-color:var(--accent-pt)">Calculate & Save</button>';
  openModal({ title: 'DASH - Upper Extremity', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('pt-save-dash').addEventListener('click', function() {
      var sum = 0; var n = 0;
      document.querySelectorAll('.pt-dash-sel').forEach(function(sel) {
        if (sel.value) { sum += parseInt(sel.value); n++; }
      });
      if (n === 0) { showToast('Answer at least one item', 'error'); return; }
      var score = Math.round(((sum / n) - 1) * 25 * 10) / 10;
      var interp = score <= 25 ? 'Minimal disability' : score <= 50 ? 'Moderate disability' : score <= 75 ? 'Severe disability' : 'Very severe disability';
      savePTGoal({ patientId: pid, isOutcomeMeasure: true, measureType: 'DASH', score: score, interpretation: interp, answeredItems: n, providerId: getSessionUser().id });
      closeAllModals();
      showToast('DASH Score: ' + score + ' (' + interp + ')', 'success');
      if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
    });
  }, 100);
}

function _openLEFS(pid) {
  var body = '<div style="max-height:60vh;overflow-y:auto"><p style="font-size:12px;margin-bottom:12px">Rate difficulty with each activity (0=Extreme difficulty/Unable, 4=No difficulty):</p>';
  body += '<table class="pt-grid-table"><thead><tr><th style="width:60%">Activity</th><th>Score (0-4)</th></tr></thead><tbody>';
  PT_LEFS_ITEMS.forEach(function(item, idx) {
    body += '<tr><td style="font-size:12px">' + (idx + 1) + '. ' + esc(item) + '</td>';
    body += '<td><select class="pt-lefs-sel" data-idx="' + idx + '"><option value="">--</option>';
    for (var i = 0; i <= 4; i++) body += '<option value="' + i + '">' + i + '</option>';
    body += '</select></td></tr>';
  });
  body += '</tbody></table></div>';

  var footer = '<button class="btn btn-primary" id="pt-save-lefs" style="background:var(--accent-pt);border-color:var(--accent-pt)">Calculate & Save</button>';
  openModal({ title: 'LEFS - Lower Extremity', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('pt-save-lefs').addEventListener('click', function() {
      var sum = 0; var n = 0;
      document.querySelectorAll('.pt-lefs-sel').forEach(function(sel) {
        if (sel.value !== '') { sum += parseInt(sel.value); n++; }
      });
      if (n === 0) { showToast('Answer at least one item', 'error'); return; }
      var interp = sum >= 71 ? 'Minimal difficulty' : sum >= 51 ? 'Moderate difficulty' : sum >= 31 ? 'Considerable difficulty' : 'Extreme difficulty';
      savePTGoal({ patientId: pid, isOutcomeMeasure: true, measureType: 'LEFS', score: sum, interpretation: interp, answeredItems: n, providerId: getSessionUser().id });
      closeAllModals();
      showToast('LEFS Score: ' + sum + '/80 (' + interp + ')', 'success');
      if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
    });
  }, 100);
}

function _openODI(pid) {
  var body = '<div style="max-height:60vh;overflow-y:auto"><p style="font-size:12px;margin-bottom:12px">Rate each section 0-5 (0=no disability, 5=maximum disability):</p>';
  body += '<table class="pt-grid-table"><thead><tr><th style="width:60%">Section</th><th>Score (0-5)</th></tr></thead><tbody>';
  PT_ODI_SECTIONS.forEach(function(sec, idx) {
    body += '<tr><td style="font-size:12px">' + (idx + 1) + '. ' + esc(sec) + '</td>';
    body += '<td><select class="pt-odi-sel" data-idx="' + idx + '"><option value="">--</option>';
    for (var i = 0; i <= 5; i++) body += '<option value="' + i + '">' + i + '</option>';
    body += '</select></td></tr>';
  });
  body += '</tbody></table></div>';

  var footer = '<button class="btn btn-primary" id="pt-save-odi" style="background:var(--accent-pt);border-color:var(--accent-pt)">Calculate & Save</button>';
  openModal({ title: 'ODI - Oswestry Disability Index', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('pt-save-odi').addEventListener('click', function() {
      var sum = 0; var n = 0;
      document.querySelectorAll('.pt-odi-sel').forEach(function(sel) {
        if (sel.value !== '') { sum += parseInt(sel.value); n++; }
      });
      if (n === 0) { showToast('Answer at least one section', 'error'); return; }
      var pct = Math.round((sum / (5 * n)) * 100);
      var interp = pct <= 20 ? 'Minimal disability' : pct <= 40 ? 'Moderate disability' : pct <= 60 ? 'Severe disability' : pct <= 80 ? 'Crippled' : 'Bed-bound';
      savePTGoal({ patientId: pid, isOutcomeMeasure: true, measureType: 'ODI', score: pct, interpretation: interp, answeredSections: n, providerId: getSessionUser().id });
      closeAllModals();
      showToast('ODI Score: ' + pct + '% (' + interp + ')', 'success');
      if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
    });
  }, 100);
}

function _openNDI(pid) {
  var body = '<div style="max-height:60vh;overflow-y:auto"><p style="font-size:12px;margin-bottom:12px">Rate each section 0-5 (0=no disability, 5=maximum disability):</p>';
  body += '<table class="pt-grid-table"><thead><tr><th style="width:60%">Section</th><th>Score (0-5)</th></tr></thead><tbody>';
  PT_NDI_SECTIONS.forEach(function(sec, idx) {
    body += '<tr><td style="font-size:12px">' + (idx + 1) + '. ' + esc(sec) + '</td>';
    body += '<td><select class="pt-ndi-sel" data-idx="' + idx + '"><option value="">--</option>';
    for (var i = 0; i <= 5; i++) body += '<option value="' + i + '">' + i + '</option>';
    body += '</select></td></tr>';
  });
  body += '</tbody></table></div>';

  var footer = '<button class="btn btn-primary" id="pt-save-ndi" style="background:var(--accent-pt);border-color:var(--accent-pt)">Calculate & Save</button>';
  openModal({ title: 'NDI - Neck Disability Index', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('pt-save-ndi').addEventListener('click', function() {
      var sum = 0; var n = 0;
      document.querySelectorAll('.pt-ndi-sel').forEach(function(sel) {
        if (sel.value !== '') { sum += parseInt(sel.value); n++; }
      });
      if (n === 0) { showToast('Answer at least one item', 'error'); return; }
      var pct = Math.round((sum / (5 * n)) * 100);
      var interp = pct <= 20 ? 'Minimal disability' : pct <= 40 ? 'Moderate disability' : pct <= 60 ? 'Severe disability' : pct <= 80 ? 'Crippled' : 'Bed-bound';
      savePTGoal({ patientId: pid, isOutcomeMeasure: true, measureType: 'NDI', score: pct, interpretation: interp, answeredSections: n, providerId: getSessionUser().id });
      closeAllModals();
      showToast('NDI Score: ' + pct + '% (' + interp + ')', 'success');
      if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
    });
  }, 100);
}


/* ============================================================
   TAB 4: HOME EXERCISE PROGRAM
   ============================================================ */
function _buildHEPTab(pid) {
  var heps = getPTHEPs(pid).sort(function(a, b) {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<h3>Home Exercise Programs</h3>';
  html += '<button class="btn btn-primary" id="pt-new-hep-btn" style="background:var(--accent-pt);border-color:var(--accent-pt)">+ Build HEP</button>';
  html += '</div>';

  if (!heps.length) {
    html += '<div class="pt-empty"><p>No home exercise programs created.</p></div>';
    return html;
  }

  heps.forEach(function(hep) {
    html += '<div class="pt-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<h4>HEP - ' + formatDateTime(hep.createdAt) + '</h4>';
    html += '<div>';
    html += '<button class="btn btn-sm btn-outline-primary pt-print-hep-btn" data-id="' + hep.id + '" style="margin-right:4px">Print</button>';
    html += '<button class="btn btn-sm btn-outline-secondary pt-edit-hep-btn" data-id="' + hep.id + '">Edit</button>';
    html += '</div></div>';
    html += '<div style="margin-top:8px">';
    (hep.exercises || []).forEach(function(ex) {
      html += '<div style="font-size:13px;padding:4px 0">';
      html += '<strong>' + esc(ex.name) + '</strong> &mdash; ' + ex.sets + 'x' + ex.reps;
      if (ex.holdTime) html += ', hold ' + ex.holdTime + 's';
      html += ' (' + esc(ex.frequency || 'Daily') + ')';
      html += '</div>';
    });
    html += '</div></div>';
  });

  return html;
}

function _wireHEPTab(pid) {
  var btn = document.getElementById('pt-new-hep-btn');
  if (btn) btn.addEventListener('click', function() { openPTHEPModal(pid, null); });

  document.querySelectorAll('.pt-edit-hep-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var hId = this.getAttribute('data-id');
      var heps = getPTHEPs(pid);
      var h = heps.find(function(x) { return x.id === hId; });
      if (h) openPTHEPModal(pid, h);
    });
  });

  document.querySelectorAll('.pt-print-hep-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var hId = this.getAttribute('data-id');
      var heps = getPTHEPs(pid);
      var h = heps.find(function(x) { return x.id === hId; });
      if (h) _printHEP(pid, h);
    });
  });
}

function openPTHEPModal(pid, existing) {
  var selectedExercises = existing ? JSON.parse(JSON.stringify(existing.exercises || [])) : [];
  var filterRegion = 'All';

  function renderHEPBody() {
    var body = '<div style="display:flex;gap:16px;max-height:65vh">';

    /* Left: Library */
    body += '<div style="flex:1;overflow-y:auto;border-right:1px solid #ddd;padding-right:12px">';
    body += '<h4 style="margin:0 0 8px 0;color:var(--accent-pt)">Exercise Library</h4>';
    body += '<select class="form-control" id="pt-hep-region-filter" style="margin-bottom:8px">';
    var regions = ['All'];
    PT_EXERCISE_LIBRARY.forEach(function(ex) {
      if (regions.indexOf(ex.region) < 0) regions.push(ex.region);
    });
    regions.forEach(function(r) {
      body += '<option value="' + r + '"' + (filterRegion === r ? ' selected' : '') + '>' + r + '</option>';
    });
    body += '</select>';

    PT_EXERCISE_LIBRARY.forEach(function(ex, idx) {
      if (filterRegion !== 'All' && ex.region !== filterRegion) return;
      body += '<div class="pt-hep-lib-item pt-hep-add-ex" data-idx="' + idx + '">';
      body += '<strong>' + esc(ex.name) + '</strong> <span style="font-size:11px;color:var(--text-secondary,#666)">(' + esc(ex.region) + ')</span>';
      body += '<div style="font-size:11px;color:var(--text-secondary,#666);margin-top:2px">' + esc(ex.instructions) + '</div>';
      body += '</div>';
    });
    body += '</div>';

    /* Right: Selected exercises */
    body += '<div style="flex:1;overflow-y:auto;padding-left:12px">';
    body += '<h4 style="margin:0 0 8px 0;color:var(--accent-pt)">Selected Exercises (' + selectedExercises.length + ')</h4>';

    if (!selectedExercises.length) {
      body += '<p style="font-size:13px;color:var(--text-secondary,#666)">Click exercises on the left to add them.</p>';
    }

    selectedExercises.forEach(function(ex, idx) {
      body += '<div class="pt-hep-exercise">';
      body += '<div class="pt-hep-info">';
      body += '<strong>' + esc(ex.name) + '</strong>';
      body += '<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;font-size:12px">';
      body += '<label>Sets:<input type="number" class="form-control pt-hep-sets" data-idx="' + idx + '" style="width:50px;display:inline" value="' + (ex.sets || '') + '"></label>';
      body += '<label>Reps:<input type="number" class="form-control pt-hep-reps" data-idx="' + idx + '" style="width:50px;display:inline" value="' + (ex.reps || '') + '"></label>';
      body += '<label>Hold(s):<input type="number" class="form-control pt-hep-hold" data-idx="' + idx + '" style="width:50px;display:inline" value="' + (ex.holdTime || '') + '"></label>';
      body += '<label>Freq:<select class="form-control pt-hep-freq" data-idx="' + idx + '" style="width:90px;display:inline">';
      ['Daily','BID','3x week'].forEach(function(f) {
        body += '<option value="' + f + '"' + (ex.frequency === f ? ' selected' : '') + '>' + f + '</option>';
      });
      body += '</select></label>';
      body += '</div>';
      body += '<div style="margin-top:4px"><input type="text" class="form-control pt-hep-special" data-idx="' + idx + '" placeholder="Special instructions" value="' + esc(ex.specialInstructions || '') + '" style="font-size:12px"></div>';
      body += '</div>';
      body += '<button class="btn btn-sm btn-outline-danger pt-hep-remove" data-idx="' + idx + '" style="flex-shrink:0">X</button>';
      body += '</div>';
    });

    body += '</div></div>';
    return body;
  }

  function showHEPModal() {
    var body = renderHEPBody();
    var footer = '<button class="btn btn-primary" id="pt-save-hep" style="background:var(--accent-pt);border-color:var(--accent-pt)">Save HEP</button>';
    footer += ' <button class="btn btn-outline-secondary" id="pt-print-hep-preview">Generate Printable HEP</button>';

    openModal({ title: existing ? 'Edit Home Exercise Program' : 'Build Home Exercise Program', bodyHTML: body, footerHTML: footer });

    setTimeout(function() {
      /* Region filter */
      var regionSel = document.getElementById('pt-hep-region-filter');
      if (regionSel) regionSel.addEventListener('change', function() {
        filterRegion = this.value;
        _refreshHEPContent();
      });

      /* Add exercise */
      document.querySelectorAll('.pt-hep-add-ex').forEach(function(el) {
        el.addEventListener('click', function() {
          var idx = parseInt(this.getAttribute('data-idx'));
          var ex = PT_EXERCISE_LIBRARY[idx];
          selectedExercises.push({
            name: ex.name, region: ex.region, instructions: ex.instructions,
            sets: ex.defaultSets, reps: ex.defaultReps, holdTime: null,
            frequency: 'Daily', specialInstructions: ''
          });
          _refreshHEPContent();
        });
      });

      /* Remove exercise */
      document.querySelectorAll('.pt-hep-remove').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.getAttribute('data-idx'));
          _syncHEPEdits();
          selectedExercises.splice(idx, 1);
          _refreshHEPContent();
        });
      });

      /* Save */
      document.getElementById('pt-save-hep').addEventListener('click', function() {
        _syncHEPEdits();
        var data = existing ? JSON.parse(JSON.stringify(existing)) : { patientId: pid, providerId: getSessionUser().id };
        data.exercises = selectedExercises;
        savePTHEP(data);
        closeAllModals();
        showToast('HEP saved', 'success');
        if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
      });

      /* Print preview */
      var printBtn = document.getElementById('pt-print-hep-preview');
      if (printBtn) printBtn.addEventListener('click', function() {
        _syncHEPEdits();
        _printHEP(pid, { exercises: selectedExercises });
      });
    }, 100);
  }

  function _syncHEPEdits() {
    document.querySelectorAll('.pt-hep-sets').forEach(function(inp) {
      var idx = parseInt(inp.getAttribute('data-idx'));
      if (selectedExercises[idx]) selectedExercises[idx].sets = parseInt(inp.value) || 0;
    });
    document.querySelectorAll('.pt-hep-reps').forEach(function(inp) {
      var idx = parseInt(inp.getAttribute('data-idx'));
      if (selectedExercises[idx]) selectedExercises[idx].reps = parseInt(inp.value) || 0;
    });
    document.querySelectorAll('.pt-hep-hold').forEach(function(inp) {
      var idx = parseInt(inp.getAttribute('data-idx'));
      if (selectedExercises[idx]) selectedExercises[idx].holdTime = parseInt(inp.value) || null;
    });
    document.querySelectorAll('.pt-hep-freq').forEach(function(sel) {
      var idx = parseInt(sel.getAttribute('data-idx'));
      if (selectedExercises[idx]) selectedExercises[idx].frequency = sel.value;
    });
    document.querySelectorAll('.pt-hep-special').forEach(function(inp) {
      var idx = parseInt(inp.getAttribute('data-idx'));
      if (selectedExercises[idx]) selectedExercises[idx].specialInstructions = inp.value;
    });
  }

  function _refreshHEPContent() {
    var modalBody = document.getElementById('modal-body');
    if (!modalBody) return;
    modalBody.innerHTML = renderHEPBody();
    /* Re-wire events */
    var regionSel = document.getElementById('pt-hep-region-filter');
    if (regionSel) regionSel.addEventListener('change', function() {
      filterRegion = this.value;
      _refreshHEPContent();
    });
    document.querySelectorAll('.pt-hep-add-ex').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'));
        var ex = PT_EXERCISE_LIBRARY[idx];
        selectedExercises.push({
          name: ex.name, region: ex.region, instructions: ex.instructions,
          sets: ex.defaultSets, reps: ex.defaultReps, holdTime: null,
          frequency: 'Daily', specialInstructions: ''
        });
        _refreshHEPContent();
      });
    });
    document.querySelectorAll('.pt-hep-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'));
        _syncHEPEdits();
        selectedExercises.splice(idx, 1);
        _refreshHEPContent();
      });
    });
  }

  showHEPModal();
}

function _printHEP(pid, hep) {
  var patient = getPatient(pid);
  var pName = patient ? (patient.firstName + ' ' + patient.lastName) : 'Patient';
  var user = getSessionUser();
  var providerName = user ? ((user.firstName || '') + ' ' + (user.lastName || user.name || '')) : '';

  var body = '<div class="pt-print-hep">';
  body += '<h2>Home Exercise Program</h2>';
  body += '<p><strong>Patient:</strong> ' + esc(pName) + ' &nbsp;&nbsp; <strong>Date:</strong> ' + formatDateTime(new Date().toISOString()) + '</p>';
  body += '<table><thead><tr><th>#</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Hold</th><th>Frequency</th><th>Instructions</th></tr></thead><tbody>';

  (hep.exercises || []).forEach(function(ex, idx) {
    body += '<tr>';
    body += '<td>' + (idx + 1) + '</td>';
    body += '<td><strong>' + esc(ex.name) + '</strong></td>';
    body += '<td>' + (ex.sets || '--') + '</td>';
    body += '<td>' + (ex.reps || '--') + '</td>';
    body += '<td>' + (ex.holdTime ? ex.holdTime + 's' : '--') + '</td>';
    body += '<td>' + esc(ex.frequency || 'Daily') + '</td>';
    body += '<td style="font-size:11px">' + esc(ex.instructions || '') + (ex.specialInstructions ? '<br><em>' + esc(ex.specialInstructions) + '</em>' : '') + '</td>';
    body += '</tr>';
  });

  body += '</tbody></table>';
  body += '<div style="margin-top:40px;border-top:1px solid #333;padding-top:8px">';
  body += '<p><strong>Provider:</strong> ' + esc(providerName) + ' &nbsp;&nbsp; <strong>Signature:</strong> ___________________________</p>';
  body += '</div></div>';

  var footer = '<button class="btn btn-primary" onclick="window.print()">Print</button>';
  openModal({ title: 'Printable HEP', bodyHTML: body, footerHTML: footer });
}


/* ============================================================
   TAB 5: EQUIPMENT / DME
   ============================================================ */
function _buildEquipmentTab(pid) {
  var equipment = getPTEquipment(pid).sort(function(a, b) {
    return new Date(b.fittingDate || b.createdAt || 0) - new Date(a.fittingDate || a.createdAt || 0);
  });

  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<h3>Equipment / DME</h3>';
  html += '<button class="btn btn-primary" id="pt-new-equip-btn" style="background:var(--accent-pt);border-color:var(--accent-pt)">+ Add Equipment</button>';
  html += '</div>';

  if (!equipment.length) {
    html += '<div class="pt-empty"><p>No equipment records.</p></div>';
    return html;
  }

  html += '<table class="pt-table"><thead><tr><th>Device</th><th>Fitting Date</th><th>Size/Specs</th><th>Education</th><th>Follow-up</th><th></th></tr></thead><tbody>';
  equipment.forEach(function(eq) {
    html += '<tr>';
    html += '<td><strong>' + esc(eq.deviceType || '') + '</strong></td>';
    html += '<td>' + (eq.fittingDate || '--') + '</td>';
    html += '<td>' + esc(eq.sizeSpecs || '') + '</td>';
    html += '<td>' + (eq.educationCompleted ? '<span class="pt-badge pt-badge-green">Yes</span>' : '<span class="pt-badge pt-badge-yellow">No</span>') + '</td>';
    html += '<td>' + (eq.followUpDate || '--') + '</td>';
    html += '<td><button class="btn btn-sm btn-outline-secondary pt-edit-equip-btn" data-id="' + eq.id + '">Edit</button></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function _wireEquipmentTab(pid) {
  var btn = document.getElementById('pt-new-equip-btn');
  if (btn) btn.addEventListener('click', function() { _openEquipmentModal(pid, null); });

  document.querySelectorAll('.pt-edit-equip-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var eId = this.getAttribute('data-id');
      var equipment = getPTEquipment(pid);
      var eq = equipment.find(function(x) { return x.id === eId; });
      if (eq) _openEquipmentModal(pid, eq);
    });
  });
}

function _openEquipmentModal(pid, existing) {
  var pf = existing || {};
  var body = '<div style="display:flex;flex-direction:column;gap:12px">';

  body += '<div class="form-group"><label class="form-label">Device Type</label>';
  body += '<select class="form-control" id="pt-equip-type">';
  body += '<option value="">-- Select --</option>';
  PT_DME_TYPES.forEach(function(t) {
    body += '<option value="' + t + '"' + (pf.deviceType === t ? ' selected' : '') + '>' + t + '</option>';
  });
  body += '</select></div>';

  body += '<div class="form-group"><label class="form-label">Fitting Date</label>';
  body += '<input type="date" class="form-control" id="pt-equip-date" value="' + (pf.fittingDate || '') + '"></div>';

  body += '<div class="form-group"><label class="form-label">Size / Specifications</label>';
  body += '<input type="text" class="form-control" id="pt-equip-specs" value="' + esc(pf.sizeSpecs || '') + '"></div>';

  body += '<div class="form-group"><label>';
  body += '<input type="checkbox" id="pt-equip-education"' + (pf.educationCompleted ? ' checked' : '') + '> Patient Education Completed</label></div>';

  body += '<div class="form-group"><label class="form-label">Follow-up Assessment Date</label>';
  body += '<input type="date" class="form-control" id="pt-equip-followup" value="' + (pf.followUpDate || '') + '"></div>';

  body += '<div class="form-group"><label class="form-label">Notes</label>';
  body += '<textarea class="form-control" id="pt-equip-notes" rows="3">' + esc(pf.notes || '') + '</textarea></div>';

  body += '</div>';

  var footer = '<button class="btn btn-primary" id="pt-save-equip" style="background:var(--accent-pt);border-color:var(--accent-pt)">Save Equipment</button>';

  openModal({ title: existing ? 'Edit Equipment Record' : 'Add Equipment / DME', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('pt-save-equip').addEventListener('click', function() {
      var deviceType = document.getElementById('pt-equip-type').value;
      if (!deviceType) { showToast('Select a device type', 'error'); return; }

      var data = existing ? JSON.parse(JSON.stringify(existing)) : { patientId: pid, providerId: getSessionUser().id };
      data.deviceType = deviceType;
      data.fittingDate = document.getElementById('pt-equip-date').value;
      data.sizeSpecs = document.getElementById('pt-equip-specs').value;
      data.educationCompleted = document.getElementById('pt-equip-education').checked;
      data.followUpDate = document.getElementById('pt-equip-followup').value;
      data.notes = document.getElementById('pt-equip-notes').value;

      savePTEquipment(data);
      closeAllModals();
      showToast('Equipment record saved', 'success');
      if (renderPhysicalTherapy._rebuild) renderPhysicalTherapy._rebuild();
    });
  }, 100);
}
