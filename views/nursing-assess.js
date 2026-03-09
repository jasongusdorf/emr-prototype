/* ============================================================
   views/nursing-assess.js — Nursing Assessments
   Head-to-toe, Braden Scale, Morse Fall Risk
   ============================================================ */

function _injectNursingCSS() {
  if (document.getElementById('na-styles')) return;
  var s = document.createElement('style');
  s.id = 'na-styles';
  s.textContent = [
    '.na-wrap { padding:24px; max-width:1000px; margin:0 auto; }',
    '.na-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.na-tabs { display:flex; gap:0; border-bottom:2px solid var(--border,#ddd); margin-bottom:20px; }',
    '.na-tab { padding:10px 20px; cursor:pointer; font-weight:500; border-bottom:2px solid transparent; margin-bottom:-2px; color:var(--text-secondary,#666); }',
    '.na-tab.active { color:var(--primary,#2563eb); border-bottom-color:var(--primary,#2563eb); }',
    '.na-system { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-bottom:12px; }',
    '.na-system h4 { margin:0 0 10px 0; color:var(--primary,#2563eb); }',
    '.na-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; }',
    '.na-radio-group { display:flex; gap:12px; align-items:center; }',
    '.na-radio-group label { display:flex; align-items:center; gap:4px; font-size:13px; cursor:pointer; }',
    '.na-abnormal-notes { width:100%; margin-top:6px; padding:6px 8px; border:1px solid var(--border,#ddd); border-radius:4px; font-size:13px; display:none; }',
    '.na-score-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-bottom:12px; }',
    '.na-score-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border,#eee); }',
    '.na-score-total { font-size:20px; font-weight:700; padding:12px; text-align:center; border-radius:var(--radius,8px); margin-top:12px; }',
    '.na-risk-low { background:#d4edda; color:#155724; }',
    '.na-risk-mod { background:#fff3cd; color:#856404; }',
    '.na-risk-high { background:#f8d7da; color:#721c24; }',
    '.na-history { margin-top:20px; }',
    '.na-history-item { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:12px; margin-bottom:8px; }'
  ].join('\n');
  document.head.appendChild(s);
}

var NA_SYSTEMS = [
  { key: 'neuro', label: 'Neurological', normals: ['Alert & oriented x4','Pupils equal/reactive','Sensation intact','Motor strength 5/5'], abnormals: ['Confused','Lethargic','Unresponsive','Pupil asymmetry','Weakness','Numbness/tingling'] },
  { key: 'cardio', label: 'Cardiovascular', normals: ['Regular rate/rhythm','Pulses strong/equal','No edema','Cap refill <3s'], abnormals: ['Irregular rhythm','Weak pulses','Edema','Chest pain','JVD'] },
  { key: 'resp', label: 'Respiratory', normals: ['Clear bilateral','Regular unlabored','SpO2 >94%'], abnormals: ['Wheezes','Crackles','Rhonchi','Diminished','Labored','Supplemental O2'] },
  { key: 'gi', label: 'Gastrointestinal', normals: ['Soft/non-tender','Bowel sounds active','Tolerating diet'], abnormals: ['Distended','Tender','Absent bowel sounds','Nausea/vomiting','NPO'] },
  { key: 'gu', label: 'Genitourinary', normals: ['Voiding without difficulty','Clear yellow urine'], abnormals: ['Foley catheter','Hematuria','Oliguria','Anuria','Retention'] },
  { key: 'msk', label: 'Musculoskeletal', normals: ['ROM intact','Ambulates independently','Steady gait'], abnormals: ['Limited ROM','Assistive device','Immobile','Contractures','Weakness'] },
  { key: 'skin', label: 'Skin/Wound', normals: ['Warm/dry/intact','No redness or breakdown'], abnormals: ['Pressure injury','Surgical wound','Rash','Bruising','Diaphoretic','Cyanotic'] },
  { key: 'pain', label: 'Pain', normals: ['Denies pain (0/10)'], abnormals: ['Mild 1-3','Moderate 4-6','Severe 7-10'] },
  { key: 'psycho', label: 'Psychosocial', normals: ['Appropriate affect','Cooperative','Support system present'], abnormals: ['Anxious','Depressed','Agitated','Flat affect','Suicidal ideation'] }
];

var BRADEN_ITEMS = [
  { key: 'sensory', label: 'Sensory Perception', opts: [{v:1,l:'Completely Limited'},{v:2,l:'Very Limited'},{v:3,l:'Slightly Limited'},{v:4,l:'No Impairment'}] },
  { key: 'moisture', label: 'Moisture', opts: [{v:1,l:'Constantly Moist'},{v:2,l:'Very Moist'},{v:3,l:'Occasionally Moist'},{v:4,l:'Rarely Moist'}] },
  { key: 'activity', label: 'Activity', opts: [{v:1,l:'Bedfast'},{v:2,l:'Chairfast'},{v:3,l:'Walks Occasionally'},{v:4,l:'Walks Frequently'}] },
  { key: 'mobility', label: 'Mobility', opts: [{v:1,l:'Completely Immobile'},{v:2,l:'Very Limited'},{v:3,l:'Slightly Limited'},{v:4,l:'No Limitations'}] },
  { key: 'nutrition', label: 'Nutrition', opts: [{v:1,l:'Very Poor'},{v:2,l:'Probably Inadequate'},{v:3,l:'Adequate'},{v:4,l:'Excellent'}] },
  { key: 'friction', label: 'Friction & Shear', opts: [{v:1,l:'Problem'},{v:2,l:'Potential Problem'},{v:3,l:'No Apparent Problem'}] }
];

var MORSE_ITEMS = [
  { key: 'fallHx', label: 'History of Falling (last 3 months)', opts: [{v:0,l:'No'},{v:25,l:'Yes'}] },
  { key: 'secondaryDx', label: 'Secondary Diagnosis', opts: [{v:0,l:'No'},{v:15,l:'Yes'}] },
  { key: 'ambulatoryAid', label: 'Ambulatory Aid', opts: [{v:0,l:'None/Bed Rest/Nurse Assist'},{v:15,l:'Crutches/Cane/Walker'},{v:30,l:'Furniture'}] },
  { key: 'ivAccess', label: 'IV/Heparin Lock', opts: [{v:0,l:'No'},{v:20,l:'Yes'}] },
  { key: 'gait', label: 'Gait', opts: [{v:0,l:'Normal/Bed Rest/Immobile'},{v:10,l:'Weak'},{v:20,l:'Impaired'}] },
  { key: 'mentalStatus', label: 'Mental Status', opts: [{v:0,l:'Oriented to Own Ability'},{v:15,l:'Overestimates/Forgets Limitations'}] }
];

function renderNursingAssess() {
  _injectNursingCSS();
  var app = document.getElementById('app');
  var patients = getPatients();
  var selPid = patients[0] ? patients[0].id : null;
  var activeTab = 'assessment';

  function build(pid) {
    var html = '<div class="na-wrap">';
    html += '<div class="na-header"><h2>Nursing Assessment</h2>';
    html += '<select class="mar-patient-select" id="na-pt-sel">';
    patients.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + '</option>';
    });
    html += '</select></div>';

    html += '<div class="na-tabs">';
    ['assessment','braden','morse','history'].forEach(function(t) {
      html += '<div class="na-tab' + (activeTab === t ? ' active' : '') + '" data-tab="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1).replace('morse','Fall Risk') + '</div>';
    });
    html += '</div>';

    if (activeTab === 'assessment') {
      NA_SYSTEMS.forEach(function(sys) {
        html += '<div class="na-system"><h4>' + sys.label + '</h4>';
        html += '<div class="na-radio-group"><label><input type="radio" name="na-' + sys.key + '" value="normal" checked> Normal</label>';
        html += '<label><input type="radio" name="na-' + sys.key + '" value="abnormal"> Abnormal</label></div>';
        html += '<div class="na-row" style="margin-top:6px;font-size:13px;color:var(--text-secondary,#666)">Normal: ' + sys.normals.join(', ') + '</div>';
        html += '<textarea class="na-abnormal-notes" data-sys="' + sys.key + '" placeholder="Document abnormal findings: ' + sys.abnormals.join(', ') + '"></textarea>';
        html += '</div>';
      });
      html += '<button class="btn btn-primary" id="na-save-assess" style="margin-top:12px">Save Assessment</button>';
    } else if (activeTab === 'braden') {
      html += '<div class="na-score-card"><h3>Braden Scale — Pressure Injury Risk</h3>';
      BRADEN_ITEMS.forEach(function(item) {
        html += '<div class="na-score-row"><strong>' + item.label + '</strong><select class="form-control braden-sel" data-key="' + item.key + '" style="max-width:250px">';
        item.opts.forEach(function(o) { html += '<option value="' + o.v + '">' + o.l + ' (' + o.v + ')</option>'; });
        html += '</select></div>';
      });
      html += '<div class="na-score-total" id="braden-total">Score: 6 — High Risk</div>';
      html += '<button class="btn btn-primary" id="na-save-braden" style="margin-top:12px">Save Braden Score</button></div>';
    } else if (activeTab === 'morse') {
      html += '<div class="na-score-card"><h3>Morse Fall Scale</h3>';
      MORSE_ITEMS.forEach(function(item) {
        html += '<div class="na-score-row"><strong>' + item.label + '</strong><select class="form-control morse-sel" data-key="' + item.key + '" style="max-width:280px">';
        item.opts.forEach(function(o) { html += '<option value="' + o.v + '">' + o.l + ' (' + o.v + ')</option>'; });
        html += '</select></div>';
      });
      html += '<div class="na-score-total" id="morse-total">Score: 0 — Low Risk</div>';
      html += '<button class="btn btn-primary" id="na-save-morse" style="margin-top:12px">Save Fall Risk Score</button></div>';
    } else if (activeTab === 'history') {
      var assessments = getNursingAssessments(pid).sort(function(a,b) { return b.createdAt > a.createdAt ? 1 : -1; });
      html += '<div class="na-history"><h3>Assessment History</h3>';
      if (!assessments.length) html += '<p style="color:var(--text-secondary,#666)">No assessments recorded</p>';
      assessments.forEach(function(a) {
        html += '<div class="na-history-item"><strong>' + esc(a.type || 'Assessment') + '</strong> — ' + formatDateTime(a.createdAt);
        if (a.score !== undefined) html += ' — Score: ' + a.score;
        if (a.notes) html += '<div style="margin-top:4px;font-size:13px;color:var(--text-secondary,#666)">' + esc(a.notes) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    app.innerHTML = html;

    // Wire events
    document.getElementById('na-pt-sel').addEventListener('change', function() { selPid = this.value; build(this.value); });
    app.querySelectorAll('.na-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { activeTab = this.getAttribute('data-tab'); build(pid); });
    });

    // Show/hide abnormal notes
    app.querySelectorAll('input[type="radio"]').forEach(function(r) {
      r.addEventListener('change', function() {
        var sys = this.name.replace('na-', '');
        var notes = app.querySelector('.na-abnormal-notes[data-sys="' + sys + '"]');
        if (notes) notes.style.display = this.value === 'abnormal' ? 'block' : 'none';
      });
    });

    // Braden calculation
    app.querySelectorAll('.braden-sel').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var total = 0;
        app.querySelectorAll('.braden-sel').forEach(function(s) { total += parseInt(s.value); });
        var risk = total <= 9 ? 'High Risk' : total <= 12 ? 'Moderate Risk' : total <= 14 ? 'Mild Risk' : 'Low Risk';
        var cls = total <= 12 ? 'na-risk-high' : total <= 14 ? 'na-risk-mod' : 'na-risk-low';
        var el = document.getElementById('braden-total');
        el.textContent = 'Score: ' + total + ' — ' + risk;
        el.className = 'na-score-total ' + cls;
      });
    });

    // Morse calculation
    app.querySelectorAll('.morse-sel').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var total = 0;
        app.querySelectorAll('.morse-sel').forEach(function(s) { total += parseInt(s.value); });
        var risk = total >= 45 ? 'High Risk' : total >= 25 ? 'Moderate Risk' : 'Low Risk';
        var cls = total >= 45 ? 'na-risk-high' : total >= 25 ? 'na-risk-mod' : 'na-risk-low';
        var el = document.getElementById('morse-total');
        el.textContent = 'Score: ' + total + ' — ' + risk;
        el.className = 'na-score-total ' + cls;
      });
    });

    // Save buttons
    var saveAssess = document.getElementById('na-save-assess');
    if (saveAssess) saveAssess.addEventListener('click', function() {
      var findings = {};
      NA_SYSTEMS.forEach(function(sys) {
        var val = app.querySelector('input[name="na-' + sys.key + '"]:checked');
        findings[sys.key] = { status: val ? val.value : 'normal', notes: '' };
        if (val && val.value === 'abnormal') {
          var ta = app.querySelector('.na-abnormal-notes[data-sys="' + sys.key + '"]');
          findings[sys.key].notes = ta ? ta.value : '';
        }
      });
      saveNursingAssessment({ patientId: pid, type: 'Head-to-Toe', findings: findings, nurse: getSessionUser().id });
      showToast('Assessment saved', 'success');
      activeTab = 'history'; build(pid);
    });

    var saveBraden = document.getElementById('na-save-braden');
    if (saveBraden) saveBraden.addEventListener('click', function() {
      var total = 0;
      app.querySelectorAll('.braden-sel').forEach(function(s) { total += parseInt(s.value); });
      saveNursingAssessment({ patientId: pid, type: 'Braden Scale', score: total, nurse: getSessionUser().id });
      showToast('Braden score saved', 'success');
      activeTab = 'history'; build(pid);
    });

    var saveMorse = document.getElementById('na-save-morse');
    if (saveMorse) saveMorse.addEventListener('click', function() {
      var total = 0;
      app.querySelectorAll('.morse-sel').forEach(function(s) { total += parseInt(s.value); });
      saveNursingAssessment({ patientId: pid, type: 'Morse Fall Risk', score: total, nurse: getSessionUser().id });
      showToast('Fall risk score saved', 'success');
      activeTab = 'history'; build(pid);
    });
  }

  if (selPid) build(selPid);
  else app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>';
}
