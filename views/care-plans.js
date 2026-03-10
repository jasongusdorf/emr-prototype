/* ============================================================
   views/care-plans.js — Nursing Care Plans
   ============================================================ */

function _injectCarePlanCSS() {
  if (document.getElementById('cp-styles')) return;
  var s = document.createElement('style');
  s.id = 'cp-styles';
  s.textContent = [
    '.cp-wrap { padding:24px; max-width:1000px; margin:0 auto; }',
    '.cp-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.cp-list { display:flex; flex-direction:column; gap:12px; }',
    '.cp-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; }',
    '.cp-card h4 { margin:0 0 8px 0; }',
    '.cp-status { display:inline-block; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:500; }',
    '.cp-status-active { background:var(--badge-success-bg); color:var(--badge-success-text); }',
    '.cp-status-hold { background:var(--badge-warning-bg); color:var(--badge-warning-text); }',
    '.cp-status-resolved { background:var(--badge-info-bg); color:var(--badge-info-text); }',
    '.cp-status-dc { background:var(--badge-neutral-bg); color:var(--badge-neutral-text); }',
    '.cp-section { margin-top:10px; }',
    '.cp-section-label { font-weight:600; font-size:13px; color:var(--text-secondary,#666); margin-bottom:4px; }',
    '.cp-intervention { padding:6px 8px; background:var(--bg-main,#f8f9fa); border-radius:4px; margin-bottom:4px; font-size:13px; display:flex; justify-content:space-between; align-items:center; }',
    '.cp-intervention-completed { background:#d4edda; }',
    '.cp-template-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; margin:16px 0; }',
    '.cp-template-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:12px; cursor:pointer; text-align:center; }',
    '.cp-template-card:hover { border-color:var(--primary,#2563eb); background:#f0f7ff; }',
    '.cp-suggestion-banner { background:var(--badge-warning-bg); border:1px solid var(--badge-warning-border); border-radius:var(--radius,8px); padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:12px; }',
    '.cp-suggestion-banner .cp-suggestion-icon { font-size:20px; }',
    '.cp-suggestion-banner .cp-suggestion-text { flex:1; font-size:14px; }',
    '.cp-eval-item { background:var(--bg-main,#f8f9fa); border-radius:4px; padding:8px; margin-bottom:4px; font-size:13px; }',
    '.cp-eval-met { border-left:3px solid var(--success); }',
    '.cp-eval-partial { border-left:3px solid var(--warning); }',
    '.cp-eval-notmet { border-left:3px solid var(--danger); }'
  ].join('\n');
  document.head.appendChild(s);
}

var CP_TEMPLATES = [
  { name: 'Fall Prevention', diagnosis: 'Risk for Falls', goals: 'Patient will remain free from falls during hospitalization', interventions: ['Assess fall risk q shift','Keep bed in low position','Non-skid footwear','Call light within reach','Assist with ambulation','Educate patient/family'] },
  { name: 'Pain Management', diagnosis: 'Acute/Chronic Pain', goals: 'Patient will report pain \u2264 4/10 within 1 hour of intervention', interventions: ['Assess pain q4h using 0-10 scale','Administer analgesics as ordered','Reposition for comfort','Apply ice/heat as appropriate','Teach relaxation techniques','Reassess 30 min post-intervention'] },
  { name: 'Infection Control', diagnosis: 'Risk for Infection', goals: 'Patient will remain free from signs of infection', interventions: ['Monitor temp q4h','Assess surgical site/IV site q shift','Hand hygiene before/after care','Administer antibiotics as ordered','Maintain sterile technique','Monitor WBC trends'] },
  { name: 'Skin Integrity', diagnosis: 'Impaired Skin Integrity', goals: 'Wound will show signs of healing within 1 week', interventions: ['Assess wound q shift','Reposition q2h','Maintain adequate nutrition','Keep skin clean and dry','Apply barrier cream','Document wound measurements'] },
  { name: 'Nutrition', diagnosis: 'Imbalanced Nutrition', goals: 'Patient will maintain adequate nutritional intake', interventions: ['Daily weights','Monitor I&O','Assess appetite each meal','Dietary consult','Calorie counts as ordered','Assist with feeding as needed'] },
  { name: 'Mobility', diagnosis: 'Impaired Physical Mobility', goals: 'Patient will demonstrate progressive mobility improvement', interventions: ['PT/OT consult','Assist with ROM exercises BID','Progressive ambulation plan','Provide assistive devices','Encourage independence','Document mobility progress'] },
  { name: 'Discharge Planning', diagnosis: 'Readiness for Enhanced Self-Care', goals: 'Patient/family will verbalize understanding of discharge plan', interventions: ['Assess home environment','Teach medication management','Arrange follow-up appointments','Coordinate home health if needed','Provide written instructions','Teach warning signs to report'] },
  { name: 'Swallowing Safety', diagnosis: 'Dysphagia / Risk for Aspiration', goals: 'Patient will tolerate least restrictive safe diet without signs of aspiration', interventions: ['SLP bedside swallow eval within 24hr','Implement SLP diet recommendations','Aspiration precautions per SLP','Supervised meals per SLP recs','Swallowing exercises per SLP program','Monitor for signs of aspiration q meal','Reassess diet advancement per SLP'] },
  { name: 'Communication', diagnosis: 'Impaired Communication', goals: 'Patient will communicate basic needs using available modalities', interventions: ['SLP evaluation within 24hr','Provide communication board at bedside','Allow extra time for patient responses','Use yes/no questions when possible','Engage family in communication strategies','Daily SLP sessions for language therapy'] },
  { name: 'Post-Surgical Mobility', diagnosis: 'Impaired Physical Mobility', goals: 'Patient will ambulate 150ft with rolling walker and CGA within 3 days', interventions: ['PT eval within 24hr post-op','Therapeutic exercise BID','Gait training with appropriate AD','Progressive weight-bearing per protocol','Stair training prior to discharge','HEP instruction and demonstration'] },
  { name: 'Stroke Rehabilitation', diagnosis: 'Impaired Mobility/ADL post-CVA', goals: 'Patient will perform transfers with min assist within 1 week', interventions: ['PT/OT/SLP evals within 24hr','Neuro re-education daily','Task-specific training','Balance training','Functional mobility progression','Family training for safe discharge'] },
  { name: 'Fall Recovery', diagnosis: 'Post-Fall Deconditioning', goals: 'Patient will return to prior level of function within 2 weeks', interventions: ['Assess fall circumstances and contributing factors','Progressive strengthening program','Balance and proprioceptive training','Gait training with appropriate AD','Environmental safety assessment','Fall prevention education'] }
];

/* Helper: get intervention text regardless of string or object format */
function _cpIntvText(intv) {
  return typeof intv === 'string' ? intv : (intv && intv.text ? intv.text : '');
}

/* Helper: normalize intervention to object format */
function _cpNormalizeIntv(intv) {
  if (typeof intv === 'string') {
    return { text: intv, completedAt: null, completedBy: null, shiftDate: null, notes: '' };
  }
  return intv;
}

/* Helper: get current shift label */
function _cpCurrentShift() {
  var h = new Date().getHours();
  return (h >= 7 && h < 19) ? 'Day (7a-7p)' : 'Night (7p-7a)';
}

/* Helper: get latest risk summaries for a patient */
function _cpGetLatestRiskScores(pid) {
  var assessments = getNursingAssessments(pid);
  var latestBraden = null;
  var latestMorse = null;
  // Look for risk-summary records first (3i integration)
  var summaries = assessments.filter(function(a) { return a.type === 'risk-summary'; }).sort(function(a,b) { return b.createdAt > a.createdAt ? 1 : -1; });
  summaries.forEach(function(s) {
    if (s.latestBraden !== undefined && latestBraden === null) latestBraden = s.latestBraden;
    if (s.latestMorse !== undefined && latestMorse === null) latestMorse = s.latestMorse;
  });
  // Fallback: look at direct Braden/Morse assessments
  if (latestBraden === null) {
    var bradens = assessments.filter(function(a) { return a.type === 'Braden Scale' && a.score !== undefined; }).sort(function(a,b) { return b.createdAt > a.createdAt ? 1 : -1; });
    if (bradens.length) latestBraden = bradens[0].score;
  }
  if (latestMorse === null) {
    var morses = assessments.filter(function(a) { return a.type === 'Morse Fall Risk' && a.score !== undefined; }).sort(function(a,b) { return b.createdAt > a.createdAt ? 1 : -1; });
    if (morses.length) latestMorse = morses[0].score;
  }
  return { braden: latestBraden, morse: latestMorse };
}

function renderCarePlans() {
  _injectCarePlanCSS();
  var app = document.getElementById('app');
  var patients = getPatients();
  var selPid = patients[0] ? patients[0].id : null;

  function build(pid) {
    var plans = getCarePlans(pid);
    var html = '<div class="cp-wrap">';
    html += '<div class="cp-header"><h2>Care Plans</h2><div>';
    html += '<select class="mar-patient-select" id="cp-pt-sel" style="margin-right:8px">';
    patients.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + '</option>';
    });
    html += '</select>';
    html += '<button class="btn btn-primary" id="cp-new-btn">+ New Care Plan</button>';
    html += '</div></div>';

    // 3m: Risk score linkage — suggestion banners
    var riskScores = _cpGetLatestRiskScores(pid);
    var activePlanNames = plans.filter(function(p) { return p.status === 'Active'; }).map(function(p) { return (p.name || '').toLowerCase(); });

    if (riskScores.braden !== null && riskScores.braden <= 14) {
      var hasSkinPlan = activePlanNames.some(function(n) { return n.indexOf('skin') >= 0; });
      if (!hasSkinPlan) {
        html += '<div class="cp-suggestion-banner">';
        html += '<div class="cp-suggestion-icon">&#9888;</div>';
        html += '<div class="cp-suggestion-text"><strong>Braden Score: ' + riskScores.braden + '</strong> \u2014 No active "Skin Integrity" care plan found. Consider adding one.</div>';
        html += '<button class="btn btn-sm btn-warning" id="cp-suggest-skin">Add Skin Plan</button>';
        html += '</div>';
      }
    }

    if (riskScores.morse !== null && riskScores.morse >= 25) {
      var hasFallPlan = activePlanNames.some(function(n) { return n.indexOf('fall') >= 0; });
      if (!hasFallPlan) {
        html += '<div class="cp-suggestion-banner">';
        html += '<div class="cp-suggestion-icon">&#9888;</div>';
        html += '<div class="cp-suggestion-text"><strong>Morse Score: ' + riskScores.morse + '</strong> \u2014 No active "Fall Prevention" care plan found. Consider adding one.</div>';
        html += '<button class="btn btn-sm btn-warning" id="cp-suggest-fall">Add Fall Plan</button>';
        html += '</div>';
      }
    }

    if (!plans.length) {
      html += '<p style="color:var(--text-secondary,#666);text-align:center;padding:40px">No care plans for this patient. Click "+ New Care Plan" to start.</p>';
    }

    html += '<div class="cp-list">';
    plans.forEach(function(plan) {
      var statusCls = plan.status === 'Active' ? 'cp-status-active' : plan.status === 'On Hold' ? 'cp-status-hold' : plan.status === 'Resolved' ? 'cp-status-resolved' : 'cp-status-dc';
      html += '<div class="cp-card">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center"><h4>' + esc(plan.name || plan.diagnosis) + '</h4><span class="cp-status ' + statusCls + '">' + esc(plan.status) + '</span></div>';
      html += '<div class="cp-section"><div class="cp-section-label">Diagnosis</div><div>' + esc(plan.diagnosis || '') + '</div></div>';
      html += '<div class="cp-section"><div class="cp-section-label">Goals</div><div>' + esc(plan.goals || '') + '</div></div>';
      html += '<div class="cp-section"><div class="cp-section-label">Interventions</div>';
      // 3j: Backward-compatible rendering — handle string and object formats
      (plan.interventions || []).forEach(function(intv) {
        var obj = _cpNormalizeIntv(intv);
        var completedCls = obj.completedAt ? ' cp-intervention-completed' : '';
        html += '<div class="cp-intervention' + completedCls + '">';
        html += '<span>' + esc(obj.text || '') + '</span>';
        if (obj.completedAt) {
          html += '<span style="font-size:11px;color:#155724">' + formatDateTime(obj.completedAt) + ' by ' + esc(obj.completedBy || '') + '</span>';
        }
        html += '</div>';
      });
      html += '</div>';

      // 3l: Show evaluations if any
      if (plan.evaluations && plan.evaluations.length) {
        html += '<div class="cp-section"><div class="cp-section-label">Evaluations</div>';
        plan.evaluations.forEach(function(ev) {
          var evalCls = ev.outcome === 'Met' ? 'cp-eval-met' : ev.outcome === 'Not Met' ? 'cp-eval-notmet' : 'cp-eval-partial';
          html += '<div class="cp-eval-item ' + evalCls + '">';
          html += '<strong>' + esc(ev.outcome) + '</strong> \u2014 ' + formatDateTime(ev.evaluatedAt) + ' by ' + esc(ev.evaluatedBy || '');
          if (ev.note) html += '<div style="margin-top:2px">' + esc(ev.note) + '</div>';
          html += '</div>';
        });
        html += '</div>';
      }

      html += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
      html += '<button class="btn btn-sm btn-outline-primary cp-edit-btn" data-id="' + plan.id + '">Edit</button>';
      if (plan.status === 'Active') {
        html += '<button class="btn btn-sm btn-outline-warning cp-hold-btn" data-id="' + plan.id + '">Hold</button>';
        // 3k: Document Shift button
        html += '<button class="btn btn-sm btn-outline-success cp-shift-btn" data-id="' + plan.id + '">Document Shift</button>';
        // 3l: Evaluate button
        html += '<button class="btn btn-sm btn-outline-info cp-eval-btn" data-id="' + plan.id + '">Evaluate</button>';
      }
      if (plan.status === 'On Hold') html += '<button class="btn btn-sm btn-outline-success cp-activate-btn" data-id="' + plan.id + '">Reactivate</button>';
      html += '<button class="btn btn-sm btn-outline-secondary cp-resolve-btn" data-id="' + plan.id + '">Resolve</button>';
      html += '</div></div>';
    });
    html += '</div></div>';

    app.innerHTML = html;

    var cpPtSel = document.getElementById('cp-pt-sel');
    if (cpPtSel) cpPtSel.addEventListener('change', function() { selPid = this.value; build(this.value); });
    var cpNewBtn = document.getElementById('cp-new-btn');
    if (cpNewBtn) cpNewBtn.addEventListener('click', function() { showNewPlanModal(pid); });

    // 3m: Suggestion banner click handlers
    var suggestSkinBtn = document.getElementById('cp-suggest-skin');
    if (suggestSkinBtn) suggestSkinBtn.addEventListener('click', function() {
      var tpl = CP_TEMPLATES.find(function(t) { return t.name === 'Skin Integrity'; });
      if (tpl) {
        var intvs = tpl.interventions.map(function(t) { return { text: t, completedAt: null, completedBy: null, shiftDate: null, notes: '' }; });
        showPlanForm(pid, { name: tpl.name, diagnosis: tpl.diagnosis, goals: tpl.goals, interventions: intvs, status: 'Active' });
      }
    });
    var suggestFallBtn = document.getElementById('cp-suggest-fall');
    if (suggestFallBtn) suggestFallBtn.addEventListener('click', function() {
      var tpl = CP_TEMPLATES.find(function(t) { return t.name === 'Fall Prevention'; });
      if (tpl) {
        var intvs = tpl.interventions.map(function(t) { return { text: t, completedAt: null, completedBy: null, shiftDate: null, notes: '' }; });
        showPlanForm(pid, { name: tpl.name, diagnosis: tpl.diagnosis, goals: tpl.goals, interventions: intvs, status: 'Active' });
      }
    });

    app.querySelectorAll('.cp-hold-btn').forEach(function(b) {
      b.addEventListener('click', function() { var p = plans.find(function(x) { return x.id === b.getAttribute('data-id'); }); if (p) { p.status = 'On Hold'; saveCarePlan(p); build(pid); showToast('Care plan on hold', 'warning'); } });
    });
    app.querySelectorAll('.cp-activate-btn').forEach(function(b) {
      b.addEventListener('click', function() { var p = plans.find(function(x) { return x.id === b.getAttribute('data-id'); }); if (p) { p.status = 'Active'; saveCarePlan(p); build(pid); showToast('Care plan reactivated', 'success'); } });
    });
    app.querySelectorAll('.cp-resolve-btn').forEach(function(b) {
      b.addEventListener('click', function() { var p = plans.find(function(x) { return x.id === b.getAttribute('data-id'); }); if (p) { p.status = 'Resolved'; saveCarePlan(p); build(pid); showToast('Care plan resolved', 'success'); } });
    });
    app.querySelectorAll('.cp-edit-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var p = plans.find(function(x) { return x.id === b.getAttribute('data-id'); });
        if (p) showPlanForm(pid, p);
      });
    });

    // 3k: Document Shift handlers
    app.querySelectorAll('.cp-shift-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var plan = plans.find(function(x) { return x.id === b.getAttribute('data-id'); });
        if (plan) showShiftModal(pid, plan);
      });
    });

    // 3l: Evaluate handlers
    app.querySelectorAll('.cp-eval-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var plan = plans.find(function(x) { return x.id === b.getAttribute('data-id'); });
        if (plan) showEvalModal(pid, plan);
      });
    });
  }

  function showNewPlanModal(pid) {
    var body = '<p style="margin-bottom:8px;font-weight:500">Choose a template or create custom:</p>';
    body += '<div class="cp-template-grid">';
    CP_TEMPLATES.forEach(function(t, i) {
      body += '<div class="cp-template-card" data-tpl="' + i + '">' + esc(t.name) + '</div>';
    });
    body += '<div class="cp-template-card" data-tpl="custom" style="font-weight:600">Custom Plan</div>';
    body += '</div>';

    openModal({ title: 'New Care Plan', bodyHTML: body, footerHTML: '' });

    setTimeout(function() {
      document.querySelectorAll('.cp-template-card').forEach(function(card) {
        card.addEventListener('click', function() {
          var tplIdx = this.getAttribute('data-tpl');
          closeAllModals();
          if (tplIdx === 'custom') {
            showPlanForm(pid, { name: '', diagnosis: '', goals: '', interventions: [], status: 'Active' });
          } else {
            var tpl = CP_TEMPLATES[parseInt(tplIdx)];
            // 3j: Convert template interventions to object format
            var intvObjs = tpl.interventions.map(function(t) {
              return { text: t, completedAt: null, completedBy: null, shiftDate: null, notes: '' };
            });
            showPlanForm(pid, { name: tpl.name, diagnosis: tpl.diagnosis, goals: tpl.goals, interventions: intvObjs, status: 'Active' });
          }
        });
      });
    }, 100);
  }

  function showPlanForm(pid, plan) {
    // 3j: Handle both string and object intervention formats for editing
    var intvLines = (plan.interventions || []).map(function(i) { return _cpIntvText(i); }).join('\n');

    var body = '<div style="display:flex;flex-direction:column;gap:10px">';
    body += '<label>Name:<input id="cp-name" class="form-control" value="' + esc(plan.name || '') + '"></label>';
    body += '<label>Diagnosis:<input id="cp-dx" class="form-control" value="' + esc(plan.diagnosis || '') + '"></label>';
    body += '<label>Goals:<textarea id="cp-goals" class="form-control" rows="2">' + esc(plan.goals || '') + '</textarea></label>';
    body += '<label>Interventions (one per line):<textarea id="cp-intv" class="form-control" rows="4">' + esc(intvLines) + '</textarea></label>';
    body += '</div>';

    openModal({
      title: plan.id ? 'Edit Care Plan' : 'New Care Plan',
      bodyHTML: body,
      footerHTML: '<button class="btn btn-primary" id="cp-save-form">Save</button>'
    });

    document.getElementById('cp-save-form').addEventListener('click', function() {
      plan.patientId = pid;
      plan.name = document.getElementById('cp-name').value;
      plan.diagnosis = document.getElementById('cp-dx').value;
      plan.goals = document.getElementById('cp-goals').value;

      // 3j: Build existing interventions map to preserve completion data
      var existingMap = {};
      (plan.interventions || []).forEach(function(intv) {
        var obj = _cpNormalizeIntv(intv);
        if (obj.text) existingMap[obj.text] = obj;
      });

      var newLines = document.getElementById('cp-intv').value.split('\n').filter(function(l) { return l.trim(); });
      plan.interventions = newLines.map(function(line) {
        var trimmed = line.trim();
        // Preserve existing completion data if text matches
        if (existingMap[trimmed]) return existingMap[trimmed];
        return { text: trimmed, completedAt: null, completedBy: null, shiftDate: null, notes: '' };
      });

      saveCarePlan(plan);
      closeAllModals();
      showToast('Care plan saved', 'success');
      build(pid);
    });
  }

  // 3k: Per-shift completion modal
  function showShiftModal(pid, plan) {
    var user = getSessionUser();
    var nurseName = user ? ((user.lastName ? (user.lastName + ', ') : '') + (user.firstName || user.name || user.id)) : 'Unknown';
    var shift = _cpCurrentShift();
    var now = new Date();
    var shiftDate = now.toISOString().slice(0,10);

    var body = '<div style="margin-bottom:12px;font-size:14px">';
    body += '<strong>Nurse:</strong> ' + esc(nurseName) + '<br>';
    body += '<strong>Shift:</strong> ' + esc(shift) + '<br>';
    body += '<strong>Date:</strong> ' + esc(shiftDate);
    body += '</div>';

    body += '<div style="display:flex;flex-direction:column;gap:8px">';
    (plan.interventions || []).forEach(function(intv, idx) {
      var obj = _cpNormalizeIntv(intv);
      var alreadyDone = obj.completedAt && obj.shiftDate === shiftDate;
      body += '<label style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;background:var(--bg-main,#f8f9fa);border-radius:4px">';
      body += '<input type="checkbox" class="cp-shift-cb" data-idx="' + idx + '"' + (alreadyDone ? ' checked' : '') + '>';
      body += '<span>' + esc(obj.text || '') + (alreadyDone ? ' <em style="color:#155724">(completed)</em>' : '') + '</span>';
      body += '</label>';
    });
    body += '</div>';

    body += '<div style="margin-top:12px"><label>Shift Notes:<textarea id="cp-shift-notes" class="form-control" rows="2" placeholder="Optional shift notes"></textarea></label></div>';

    openModal({
      title: 'Document Shift \u2014 ' + esc(plan.name || plan.diagnosis),
      bodyHTML: body,
      footerHTML: '<button class="btn btn-primary" id="cp-shift-save">Save Shift Documentation</button>'
    });

    document.getElementById('cp-shift-save').addEventListener('click', function() {
      var shiftNotes = document.getElementById('cp-shift-notes').value;
      // Ensure interventions are all object format
      plan.interventions = (plan.interventions || []).map(function(intv) { return _cpNormalizeIntv(intv); });

      document.querySelectorAll('.cp-shift-cb').forEach(function(cb) {
        var idx = parseInt(cb.getAttribute('data-idx'));
        if (cb.checked && plan.interventions[idx]) {
          plan.interventions[idx].completedAt = now.toISOString();
          plan.interventions[idx].completedBy = nurseName;
          plan.interventions[idx].shiftDate = shiftDate;
          plan.interventions[idx].shift = shift;
          if (shiftNotes) plan.interventions[idx].notes = shiftNotes;
        }
      });

      saveCarePlan(plan);
      closeAllModals();
      showToast('Shift documentation saved', 'success');
      build(pid);
    });
  }

  // 3l: Goal evaluation modal
  function showEvalModal(pid, plan) {
    var user = getSessionUser();
    var nurseName = user ? ((user.lastName ? (user.lastName + ', ') : '') + (user.firstName || user.name || user.id)) : 'Unknown';

    var body = '<div style="display:flex;flex-direction:column;gap:12px">';
    body += '<div style="background:var(--bg-main,#f8f9fa);padding:10px;border-radius:6px"><strong>Goal:</strong> ' + esc(plan.goals || 'No goal specified') + '</div>';
    body += '<label>Outcome:<select id="cp-eval-outcome" class="form-control">';
    body += '<option value="Met">Met</option>';
    body += '<option value="Partially Met">Partially Met</option>';
    body += '<option value="Not Met">Not Met</option>';
    body += '</select></label>';
    body += '<label>Evaluation Notes:<textarea id="cp-eval-note" class="form-control" rows="3" placeholder="Document goal evaluation..."></textarea></label>';
    body += '</div>';

    openModal({
      title: 'Evaluate Goal \u2014 ' + esc(plan.name || plan.diagnosis),
      bodyHTML: body,
      footerHTML: '<button class="btn btn-primary" id="cp-eval-save">Save Evaluation</button>'
    });

    document.getElementById('cp-eval-save').addEventListener('click', function() {
      if (!plan.evaluations) plan.evaluations = [];
      plan.evaluations.push({
        outcome: document.getElementById('cp-eval-outcome').value,
        note: document.getElementById('cp-eval-note').value,
        evaluatedBy: nurseName,
        evaluatedAt: new Date().toISOString()
      });
      saveCarePlan(plan);
      closeAllModals();
      showToast('Goal evaluation saved', 'success');
      build(pid);
    });
  }

  if (selPid) build(selPid);
  else app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>';
}
