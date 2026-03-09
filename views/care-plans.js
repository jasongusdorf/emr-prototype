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
    '.cp-status-active { background:#d4edda; color:#155724; }',
    '.cp-status-hold { background:#fff3cd; color:#856404; }',
    '.cp-status-resolved { background:#cce5ff; color:#004085; }',
    '.cp-status-dc { background:#e2e3e5; color:#383d41; }',
    '.cp-section { margin-top:10px; }',
    '.cp-section-label { font-weight:600; font-size:13px; color:var(--text-secondary,#666); margin-bottom:4px; }',
    '.cp-intervention { padding:6px 8px; background:var(--bg-main,#f8f9fa); border-radius:4px; margin-bottom:4px; font-size:13px; display:flex; justify-content:space-between; }',
    '.cp-template-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; margin:16px 0; }',
    '.cp-template-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:12px; cursor:pointer; text-align:center; }',
    '.cp-template-card:hover { border-color:var(--primary,#2563eb); background:#f0f7ff; }'
  ].join('\n');
  document.head.appendChild(s);
}

var CP_TEMPLATES = [
  { name: 'Fall Prevention', diagnosis: 'Risk for Falls', goals: 'Patient will remain free from falls during hospitalization', interventions: ['Assess fall risk q shift','Keep bed in low position','Non-skid footwear','Call light within reach','Assist with ambulation','Educate patient/family'] },
  { name: 'Pain Management', diagnosis: 'Acute/Chronic Pain', goals: 'Patient will report pain ≤ 4/10 within 1 hour of intervention', interventions: ['Assess pain q4h using 0-10 scale','Administer analgesics as ordered','Reposition for comfort','Apply ice/heat as appropriate','Teach relaxation techniques','Reassess 30 min post-intervention'] },
  { name: 'Infection Control', diagnosis: 'Risk for Infection', goals: 'Patient will remain free from signs of infection', interventions: ['Monitor temp q4h','Assess surgical site/IV site q shift','Hand hygiene before/after care','Administer antibiotics as ordered','Maintain sterile technique','Monitor WBC trends'] },
  { name: 'Skin Integrity', diagnosis: 'Impaired Skin Integrity', goals: 'Wound will show signs of healing within 1 week', interventions: ['Assess wound q shift','Reposition q2h','Maintain adequate nutrition','Keep skin clean and dry','Apply barrier cream','Document wound measurements'] },
  { name: 'Nutrition', diagnosis: 'Imbalanced Nutrition', goals: 'Patient will maintain adequate nutritional intake', interventions: ['Daily weights','Monitor I&O','Assess appetite each meal','Dietary consult','Calorie counts as ordered','Assist with feeding as needed'] },
  { name: 'Mobility', diagnosis: 'Impaired Physical Mobility', goals: 'Patient will demonstrate progressive mobility improvement', interventions: ['PT/OT consult','Assist with ROM exercises BID','Progressive ambulation plan','Provide assistive devices','Encourage independence','Document mobility progress'] },
  { name: 'Discharge Planning', diagnosis: 'Readiness for Enhanced Self-Care', goals: 'Patient/family will verbalize understanding of discharge plan', interventions: ['Assess home environment','Teach medication management','Arrange follow-up appointments','Coordinate home health if needed','Provide written instructions','Teach warning signs to report'] }
];

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
      (plan.interventions || []).forEach(function(intv) {
        html += '<div class="cp-intervention"><span>' + esc(typeof intv === 'string' ? intv : intv.text || '') + '</span></div>';
      });
      html += '</div>';
      html += '<div style="margin-top:10px;display:flex;gap:8px">';
      html += '<button class="btn btn-sm btn-outline-primary cp-edit-btn" data-id="' + plan.id + '">Edit</button>';
      if (plan.status === 'Active') html += '<button class="btn btn-sm btn-outline-warning cp-hold-btn" data-id="' + plan.id + '">Hold</button>';
      if (plan.status === 'On Hold') html += '<button class="btn btn-sm btn-outline-success cp-activate-btn" data-id="' + plan.id + '">Reactivate</button>';
      html += '<button class="btn btn-sm btn-outline-secondary cp-resolve-btn" data-id="' + plan.id + '">Resolve</button>';
      html += '</div></div>';
    });
    html += '</div></div>';

    app.innerHTML = html;

    document.getElementById('cp-pt-sel').addEventListener('change', function() { selPid = this.value; build(this.value); });
    document.getElementById('cp-new-btn').addEventListener('click', function() { showNewPlanModal(pid); });

    app.querySelectorAll('.cp-hold-btn').forEach(function(b) {
      b.addEventListener('click', function() { var p = plans.find(function(x) { return x.id === b.getAttribute('data-id'); }); if (p) { p.status = 'On Hold'; saveCarePlan(p); build(pid); showToast('Care plan on hold', 'warning'); } });
    });
    app.querySelectorAll('.cp-activate-btn').forEach(function(b) {
      b.addEventListener('click', function() { var p = plans.find(function(x) { return x.id === b.getAttribute('data-id'); }); if (p) { p.status = 'Active'; saveCarePlan(p); build(pid); showToast('Care plan reactivated', 'success'); } });
    });
    app.querySelectorAll('.cp-resolve-btn').forEach(function(b) {
      b.addEventListener('click', function() { var p = plans.find(function(x) { return x.id === b.getAttribute('data-id'); }); if (p) { p.status = 'Resolved'; saveCarePlan(p); build(pid); showToast('Care plan resolved', 'success'); } });
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
            showPlanForm(pid, { name: tpl.name, diagnosis: tpl.diagnosis, goals: tpl.goals, interventions: tpl.interventions.slice(), status: 'Active' });
          }
        });
      });
    }, 100);
  }

  function showPlanForm(pid, plan) {
    var body = '<div style="display:flex;flex-direction:column;gap:10px">';
    body += '<label>Name:<input id="cp-name" class="form-control" value="' + esc(plan.name || '') + '"></label>';
    body += '<label>Diagnosis:<input id="cp-dx" class="form-control" value="' + esc(plan.diagnosis || '') + '"></label>';
    body += '<label>Goals:<textarea id="cp-goals" class="form-control" rows="2">' + esc(plan.goals || '') + '</textarea></label>';
    body += '<label>Interventions (one per line):<textarea id="cp-intv" class="form-control" rows="4">' + (plan.interventions || []).map(function(i) { return typeof i === 'string' ? i : i.text || ''; }).join('\n') + '</textarea></label>';
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
      plan.interventions = document.getElementById('cp-intv').value.split('\n').filter(function(l) { return l.trim(); });
      saveCarePlan(plan);
      closeAllModals();
      showToast('Care plan saved', 'success');
      build(pid);
    });
  }

  if (selPid) build(selPid);
  else app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>';
}
