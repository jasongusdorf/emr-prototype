/* ============================================================
   views/oncology.js — Oncology Module
   Chemotherapy plans, cycle tracking, toxicity grading,
   lab monitoring, treatment summaries
   ============================================================ */

/* ---------- Built-in Regimens ---------- */
const CHEMO_REGIMENS = {
  'FOLFOX': {
    name: 'FOLFOX (Colorectal)',
    drugs: [
      { drug: '5-Fluorouracil (5-FU)', dose: '400 mg/m2 bolus then 2400 mg/m2 over 46h', schedule: 'Day 1' },
      { drug: 'Leucovorin', dose: '400 mg/m2', schedule: 'Day 1' },
      { drug: 'Oxaliplatin', dose: '85 mg/m2', schedule: 'Day 1' }
    ],
    cycleLength: 14,
    totalCycles: 12
  },
  'AC-T': {
    name: 'AC-T (Breast)',
    drugs: [
      { drug: 'Doxorubicin (Adriamycin)', dose: '60 mg/m2', schedule: 'Day 1 (Cycles 1-4)' },
      { drug: 'Cyclophosphamide', dose: '600 mg/m2', schedule: 'Day 1 (Cycles 1-4)' },
      { drug: 'Paclitaxel (Taxol)', dose: '80 mg/m2 weekly', schedule: 'Weekly x12 (after AC)' }
    ],
    cycleLength: 21,
    totalCycles: 4
  },
  'R-CHOP': {
    name: 'R-CHOP (Lymphoma)',
    drugs: [
      { drug: 'Rituximab', dose: '375 mg/m2', schedule: 'Day 1' },
      { drug: 'Cyclophosphamide', dose: '750 mg/m2', schedule: 'Day 1' },
      { drug: 'Doxorubicin', dose: '50 mg/m2', schedule: 'Day 1' },
      { drug: 'Vincristine', dose: '1.4 mg/m2 (max 2 mg)', schedule: 'Day 1' },
      { drug: 'Prednisone', dose: '100 mg PO', schedule: 'Days 1-5' }
    ],
    cycleLength: 21,
    totalCycles: 6
  },
  'Carbo/Taxol': {
    name: 'Carboplatin/Paclitaxel (Lung/Ovarian)',
    drugs: [
      { drug: 'Carboplatin', dose: 'AUC 5-6', schedule: 'Day 1' },
      { drug: 'Paclitaxel', dose: '175 mg/m2', schedule: 'Day 1' }
    ],
    cycleLength: 21,
    totalCycles: 4
  }
};

const CTCAE_SYSTEMS = ['Hematologic', 'GI', 'Neuro', 'Skin', 'Renal', 'Hepatic'];
const CTCAE_GRADES = [
  { grade: 1, label: 'Mild', description: 'Asymptomatic or mild symptoms; clinical or diagnostic observation only' },
  { grade: 2, label: 'Moderate', description: 'Moderate; minimal, local or noninvasive intervention indicated' },
  { grade: 3, label: 'Severe', description: 'Severe or medically significant but not immediately life-threatening' },
  { grade: 4, label: 'Life-threatening', description: 'Life-threatening consequences; urgent intervention indicated' },
  { grade: 5, label: 'Death', description: 'Death related to adverse event' }
];

const RESPONSE_STATUSES = ['Complete Response', 'Partial Response', 'Stable Disease', 'Progressive Disease'];

let _oncologyTab = 'plans';

/* ============================================================
   MAIN RENDER
   ============================================================ */
function renderOncology(patientId) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const patient = patientId ? getPatient(patientId) : null;

  if (patientId && !patient) {
    app.textContent = 'Patient not found.';
    return;
  }

  setTopbar({
    title: patient ? 'Oncology — ' + esc(patient.firstName + ' ' + patient.lastName) : 'Oncology',
    meta: patient ? esc(patient.mrn) : '',
    actions: patient ? '<button class="btn btn-sm btn-primary" onclick="openNewChemoPlanModal(\'' + patient.id + '\')">+ New Treatment Plan</button>' : ''
  });
  setActiveNav('oncology');

  // Tab bar
  const tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';
  const tabDefs = [
    { key: 'plans', label: 'Treatment Plans' },
    { key: 'cycles', label: 'Cycle Tracker' },
    { key: 'toxicity', label: 'Toxicity Grading' },
    { key: 'labs', label: 'Lab Monitoring' },
    { key: 'summary', label: 'Treatment Summary' }
  ];

  tabDefs.forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_oncologyTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() { _oncologyTab = t.key; renderOncology(patientId); });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  if (!patient) {
    renderOncologyPatientList(app);
    return;
  }

  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';

  switch (_oncologyTab) {
    case 'plans': buildChemoPlansTab(card, patient); break;
    case 'cycles': buildCycleTrackerTab(card, patient); break;
    case 'toxicity': buildToxicityTab(card, patient); break;
    case 'labs': buildLabMonitoringTab(card, patient); break;
    case 'summary': buildTreatmentSummaryTab(card, patient); break;
  }

  app.appendChild(card);
}

/* ---------- Patient List (no patient selected) ---------- */
function renderOncologyPatientList(app) {
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';

  var h = document.createElement('h3');
  h.textContent = 'Oncology Patients';
  h.style.marginBottom = '12px';
  card.appendChild(h);

  var patients = getPatients();
  var oncoPatients = patients.filter(function(p) {
    return hasOncologyDiagnosis(p.id);
  });

  if (oncoPatients.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No patients with oncology diagnoses found. Oncology tools will appear in patient charts when relevant diagnoses exist.';
    card.appendChild(empty);
  } else {
    var table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = '<thead><tr><th>Patient</th><th>MRN</th><th>Diagnosis</th><th>Active Plans</th></tr></thead>';
    var tbody = document.createElement('tbody');
    oncoPatients.forEach(function(p) {
      var plans = getChemoPlans(p.id);
      var dx = getOncologyDiagnoses(p.id).map(function(d) { return d.description; }).join(', ');
      var tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function() { navigate('#oncology/' + p.id); });
      tr.innerHTML = '<td>' + esc(p.firstName + ' ' + p.lastName) + '</td><td>' + esc(p.mrn) + '</td><td>' + esc(dx) + '</td><td>' + plans.length + '</td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }
  app.appendChild(card);
}

/* ---------- Helper: check for oncology diagnosis ---------- */
function hasOncologyDiagnosis(patientId) {
  return getOncologyDiagnoses(patientId).length > 0;
}

function getOncologyDiagnoses(patientId) {
  var problems = loadAll(KEYS.problems).filter(function(p) { return p.patientId === patientId; });
  return problems.filter(function(p) {
    var code = (p.code || '').toUpperCase();
    var desc = (p.description || '').toLowerCase();
    return (code >= 'C00' && code <= 'C97') || (code >= 'D00' && code <= 'D49') ||
           desc.indexOf('cancer') >= 0 || desc.indexOf('carcinoma') >= 0 ||
           desc.indexOf('lymphoma') >= 0 || desc.indexOf('leukemia') >= 0 ||
           desc.indexOf('melanoma') >= 0 || desc.indexOf('sarcoma') >= 0 ||
           desc.indexOf('neoplasm') >= 0 || desc.indexOf('tumor') >= 0 ||
           desc.indexOf('myeloma') >= 0;
  });
}

/* ============================================================
   TAB: Treatment Plans
   ============================================================ */
function buildChemoPlansTab(card, patient) {
  var plans = getChemoPlans(patient.id);
  var h = document.createElement('h3');
  h.textContent = 'Chemotherapy Treatment Plans';
  h.style.marginBottom = '12px';
  card.appendChild(h);

  if (plans.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No treatment plans yet. Click "+ New Treatment Plan" to create one.';
    card.appendChild(empty);
    return;
  }

  plans.forEach(function(plan) {
    var planCard = document.createElement('div');
    planCard.className = 'specialty-record-card';
    planCard.innerHTML =
      '<div class="specialty-record-header">' +
        '<strong>' + esc(plan.protocolName) + '</strong>' +
        '<span class="badge badge-info">' + esc(plan.cycleLength + '-day cycles, ' + plan.totalCycles + ' total') + '</span>' +
      '</div>' +
      '<div class="specialty-record-body">' +
        '<table class="data-table data-table-compact"><thead><tr><th>Drug</th><th>Dose</th><th>Schedule</th></tr></thead><tbody>' +
        (plan.regimen || []).map(function(d) {
          return '<tr><td>' + esc(d.drug) + '</td><td>' + esc(d.dose) + '</td><td>' + esc(d.schedule) + '</td></tr>';
        }).join('') +
        '</tbody></table>' +
      '</div>' +
      '<div class="specialty-record-footer">' +
        '<span class="text-muted">Created: ' + formatDateTime(plan.createdAt) + '</span>' +
      '</div>';

    var editBtn = makeBtn('Edit', 'btn btn-sm btn-secondary', function() { openEditChemoPlanModal(patient.id, plan); });
    var deleteBtn = makeBtn('Delete', 'btn btn-sm btn-danger', function() {
      if (confirm('Delete this treatment plan?')) {
        softDeleteRecord(KEYS.chemoPlans, plan.id);
        renderOncology(patient.id);
        showToast('Treatment plan deleted', 'success');
      }
    });
    var footer = planCard.querySelector('.specialty-record-footer');
    footer.appendChild(editBtn);
    footer.appendChild(deleteBtn);

    card.appendChild(planCard);
  });
}

/* ---------- New Plan Modal ---------- */
function openNewChemoPlanModal(patientId) {
  var regimenOptions = Object.keys(CHEMO_REGIMENS).map(function(k) {
    return '<option value="' + k + '">' + esc(CHEMO_REGIMENS[k].name) + '</option>';
  }).join('');

  var bodyHTML =
    '<div class="form-group"><label>Protocol Template</label>' +
    '<select id="chemo-template" class="form-control"><option value="">Custom</option>' + regimenOptions + '</select></div>' +
    '<div class="form-group"><label>Protocol Name</label><input id="chemo-name" class="form-control" placeholder="e.g., FOLFOX" /></div>' +
    '<div id="chemo-drugs-container">' +
      '<label>Regimen Drugs</label>' +
      '<div id="chemo-drugs-list"></div>' +
      '<button type="button" class="btn btn-sm btn-secondary" id="add-chemo-drug-btn">+ Add Drug</button>' +
    '</div>' +
    '<div class="form-row" style="margin-top:12px">' +
      '<div class="form-group"><label>Cycle Length (days)</label><input id="chemo-cycle-length" type="number" class="form-control" value="21" /></div>' +
      '<div class="form-group"><label>Total Cycles</label><input id="chemo-total-cycles" type="number" class="form-control" value="6" /></div>' +
    '</div>';

  var footerHTML = '<button class="btn btn-success" id="save-chemo-plan-btn">Save Plan</button>';

  openModal({ title: 'New Chemotherapy Treatment Plan', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  // Template auto-fill
  document.getElementById('chemo-template').addEventListener('change', function() {
    var key = this.value;
    if (CHEMO_REGIMENS[key]) {
      var r = CHEMO_REGIMENS[key];
      document.getElementById('chemo-name').value = r.name;
      document.getElementById('chemo-cycle-length').value = r.cycleLength;
      document.getElementById('chemo-total-cycles').value = r.totalCycles;
      var list = document.getElementById('chemo-drugs-list');
      list.innerHTML = '';
      r.drugs.forEach(function(d) { addChemoDrugRow(d.drug, d.dose, d.schedule); });
    }
  });

  document.getElementById('add-chemo-drug-btn').addEventListener('click', function() { addChemoDrugRow('', '', ''); });
  addChemoDrugRow('', '', '');

  document.getElementById('save-chemo-plan-btn').addEventListener('click', function() {
    var name = document.getElementById('chemo-name').value.trim();
    if (!name) { showToast('Protocol name is required', 'error'); return; }
    var drugs = [];
    document.querySelectorAll('.chemo-drug-row').forEach(function(row) {
      var inputs = row.querySelectorAll('input');
      if (inputs[0].value.trim()) {
        drugs.push({ drug: inputs[0].value.trim(), dose: inputs[1].value.trim(), schedule: inputs[2].value.trim() });
      }
    });
    saveChemoPlan({
      patientId: patientId,
      protocolName: name,
      regimen: drugs,
      cycleLength: parseInt(document.getElementById('chemo-cycle-length').value) || 21,
      totalCycles: parseInt(document.getElementById('chemo-total-cycles').value) || 6,
      createdBy: getSessionUser().id
    });
    closeModal();
    showToast('Treatment plan created', 'success');
    renderOncology(patientId);
  });
}

function addChemoDrugRow(drug, dose, schedule) {
  var list = document.getElementById('chemo-drugs-list');
  var row = document.createElement('div');
  row.className = 'chemo-drug-row form-row';
  row.style.marginBottom = '6px';
  row.innerHTML =
    '<div class="form-group" style="flex:2"><input class="form-control" placeholder="Drug name" value="' + esc(drug) + '" /></div>' +
    '<div class="form-group" style="flex:2"><input class="form-control" placeholder="Dose" value="' + esc(dose) + '" /></div>' +
    '<div class="form-group" style="flex:1"><input class="form-control" placeholder="Schedule" value="' + esc(schedule) + '" /></div>' +
    '<button type="button" class="btn btn-sm btn-danger" style="align-self:flex-end;margin-bottom:8px">&times;</button>';
  row.querySelector('button').addEventListener('click', function() { row.remove(); });
  list.appendChild(row);
}

function openEditChemoPlanModal(patientId, plan) {
  openNewChemoPlanModal(patientId);
  setTimeout(function() {
    document.getElementById('chemo-name').value = plan.protocolName;
    document.getElementById('chemo-cycle-length').value = plan.cycleLength;
    document.getElementById('chemo-total-cycles').value = plan.totalCycles;
    var list = document.getElementById('chemo-drugs-list');
    list.innerHTML = '';
    (plan.regimen || []).forEach(function(d) { addChemoDrugRow(d.drug, d.dose, d.schedule); });

    // Override save to update existing
    document.getElementById('save-chemo-plan-btn').onclick = function() {
      var name = document.getElementById('chemo-name').value.trim();
      if (!name) { showToast('Protocol name is required', 'error'); return; }
      var drugs = [];
      document.querySelectorAll('.chemo-drug-row').forEach(function(row) {
        var inputs = row.querySelectorAll('input');
        if (inputs[0].value.trim()) drugs.push({ drug: inputs[0].value.trim(), dose: inputs[1].value.trim(), schedule: inputs[2].value.trim() });
      });
      saveChemoPlan({
        id: plan.id,
        protocolName: name,
        regimen: drugs,
        cycleLength: parseInt(document.getElementById('chemo-cycle-length').value) || 21,
        totalCycles: parseInt(document.getElementById('chemo-total-cycles').value) || 6
      });
      closeModal();
      showToast('Treatment plan updated', 'success');
      renderOncology(patientId);
    };
  }, 100);
}

/* ============================================================
   TAB: Cycle Tracker
   ============================================================ */
function buildCycleTrackerTab(card, patient) {
  var plans = getChemoPlans(patient.id);
  var h = document.createElement('h3');
  h.textContent = 'Cycle Tracker';
  h.style.marginBottom = '12px';
  card.appendChild(h);

  if (plans.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'Create a treatment plan first.' }));
    return;
  }

  plans.forEach(function(plan) {
    var section = document.createElement('div');
    section.style.marginBottom = '24px';
    var title = document.createElement('h4');
    title.textContent = plan.protocolName;
    title.style.marginBottom = '8px';
    section.appendChild(title);

    var cycles = getChemoCycles(plan.id).sort(function(a, b) { return a.cycleNumber - b.cycleNumber; });
    var currentCycle = cycles.length > 0 ? cycles[cycles.length - 1].cycleNumber : 0;

    // Progress bar
    var progress = document.createElement('div');
    progress.className = 'specialty-progress-bar';
    var pct = Math.round((currentCycle / plan.totalCycles) * 100);
    progress.innerHTML =
      '<div class="specialty-progress-label">Cycle ' + currentCycle + ' of ' + plan.totalCycles + ' (' + pct + '%)</div>' +
      '<div class="specialty-progress-track"><div class="specialty-progress-fill" style="width:' + pct + '%"></div></div>';
    section.appendChild(progress);

    // Cycle table
    var table = document.createElement('table');
    table.className = 'data-table data-table-compact';
    table.innerHTML = '<thead><tr><th>Cycle</th><th>Start Date</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>';
    var tbody = document.createElement('tbody');
    cycles.forEach(function(c) {
      var tr = document.createElement('tr');
      var statusClass = c.status === 'Completed' ? 'badge-success' : c.status === 'In Progress' ? 'badge-info' : c.status === 'Delayed' ? 'badge-warning' : 'badge-muted';
      tr.innerHTML =
        '<td>' + c.cycleNumber + '</td>' +
        '<td>' + esc(c.startDate || '—') + '</td>' +
        '<td><span class="badge ' + statusClass + '">' + esc(c.status) + '</span></td>' +
        '<td>' + esc(c.notes || '') + '</td>' +
        '<td></td>';
      var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openCycleModal(patient.id, plan, c); });
      tr.lastChild.appendChild(editBtn);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);

    // Add cycle button
    if (currentCycle < plan.totalCycles) {
      var addBtn = makeBtn('+ Add Cycle ' + (currentCycle + 1), 'btn btn-sm btn-primary', function() {
        openCycleModal(patient.id, plan, null, currentCycle + 1);
      });
      addBtn.style.marginTop = '8px';
      section.appendChild(addBtn);
    }

    // Next treatment calculation
    if (cycles.length > 0) {
      var lastCycle = cycles[cycles.length - 1];
      if (lastCycle.startDate && lastCycle.status !== 'Completed') {
        var nextDate = new Date(lastCycle.startDate);
        nextDate.setDate(nextDate.getDate() + plan.cycleLength);
        var nextInfo = document.createElement('div');
        nextInfo.className = 'specialty-next-treatment';
        nextInfo.innerHTML = '<strong>Next scheduled treatment:</strong> ' + nextDate.toLocaleDateString();
        section.appendChild(nextInfo);
      }
    }

    card.appendChild(section);
  });
}

function openCycleModal(patientId, plan, existing, cycleNum) {
  var isEdit = !!existing;
  var cycle = existing || { cycleNumber: cycleNum || 1, startDate: new Date().toISOString().slice(0, 10), status: 'Scheduled', notes: '' };

  var bodyHTML =
    '<div class="form-group"><label>Cycle Number</label><input id="cycle-num" type="number" class="form-control" value="' + cycle.cycleNumber + '" ' + (isEdit ? 'readonly' : '') + ' /></div>' +
    '<div class="form-group"><label>Start Date</label><input id="cycle-date" type="date" class="form-control" value="' + (cycle.startDate || '') + '" /></div>' +
    '<div class="form-group"><label>Status</label><select id="cycle-status" class="form-control">' +
      ['Scheduled', 'In Progress', 'Completed', 'Delayed', 'Cancelled'].map(function(s) {
        return '<option' + (cycle.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="cycle-notes" class="form-control" rows="3">' + esc(cycle.notes || '') + '</textarea></div>';

  openModal({
    title: (isEdit ? 'Edit' : 'Add') + ' Cycle — ' + plan.protocolName,
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-cycle-btn">Save</button>'
  });

  document.getElementById('save-cycle-btn').addEventListener('click', function() {
    saveChemoCycle({
      id: existing ? existing.id : undefined,
      planId: plan.id,
      cycleNumber: parseInt(document.getElementById('cycle-num').value) || 1,
      startDate: document.getElementById('cycle-date').value,
      status: document.getElementById('cycle-status').value,
      notes: document.getElementById('cycle-notes').value
    });
    closeModal();
    showToast('Cycle saved', 'success');
    renderOncology(patientId);
  });
}

/* ============================================================
   TAB: Toxicity Grading
   ============================================================ */
function buildToxicityTab(card, patient) {
  var h = document.createElement('h3');
  h.textContent = 'Toxicity Grading (CTCAE)';
  h.style.marginBottom = '12px';
  card.appendChild(h);

  var addBtn = makeBtn('+ Record Toxicity', 'btn btn-sm btn-primary', function() { openToxicityModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  var grades = getToxicityGrades(patient.id).sort(function(a, b) { return new Date(b.recordedAt) - new Date(a.recordedAt); });

  // Summary grid
  var gridHtml = '<table class="data-table data-table-compact"><thead><tr><th>System</th>';
  CTCAE_GRADES.forEach(function(g) { gridHtml += '<th>Grade ' + g.grade + '</th>'; });
  gridHtml += '</tr></thead><tbody>';
  CTCAE_SYSTEMS.forEach(function(sys) {
    gridHtml += '<tr><td><strong>' + esc(sys) + '</strong></td>';
    CTCAE_GRADES.forEach(function(g) {
      var count = grades.filter(function(gr) { return gr.system === sys && gr.grade === g.grade; }).length;
      var cls = count > 0 ? (g.grade >= 4 ? 'toxicity-severe' : g.grade >= 3 ? 'toxicity-moderate' : '') : '';
      gridHtml += '<td class="' + cls + '">' + (count || '—') + '</td>';
    });
    gridHtml += '</tr>';
  });
  gridHtml += '</tbody></table>';

  var gridDiv = document.createElement('div');
  gridDiv.innerHTML = gridHtml;
  gridDiv.style.marginBottom = '16px';
  card.appendChild(gridDiv);

  // Recent entries
  if (grades.length > 0) {
    var h4 = document.createElement('h4');
    h4.textContent = 'Recent Toxicity Entries';
    h4.style.marginTop = '16px';
    h4.style.marginBottom = '8px';
    card.appendChild(h4);

    grades.slice(0, 20).forEach(function(g) {
      var entry = document.createElement('div');
      entry.className = 'specialty-record-card';
      var gradeClass = g.grade >= 4 ? 'badge-danger' : g.grade >= 3 ? 'badge-warning' : 'badge-info';
      entry.innerHTML =
        '<div class="specialty-record-header">' +
          '<span>' + esc(g.system) + '</span>' +
          '<span class="badge ' + gradeClass + '">Grade ' + g.grade + '</span>' +
        '</div>' +
        '<div class="specialty-record-body"><p>' + esc(g.description || '') + '</p></div>' +
        '<div class="specialty-record-footer"><span class="text-muted">' + formatDateTime(g.recordedAt) + '</span></div>';
      card.appendChild(entry);
    });
  }
}

function openToxicityModal(patientId) {
  var bodyHTML =
    '<div class="form-group"><label>Body System</label><select id="tox-system" class="form-control">' +
      CTCAE_SYSTEMS.map(function(s) { return '<option>' + s + '</option>'; }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Grade</label><select id="tox-grade" class="form-control">' +
      CTCAE_GRADES.map(function(g) { return '<option value="' + g.grade + '">Grade ' + g.grade + ' — ' + g.label + '</option>'; }).join('') +
    '</select></div>' +
    '<div id="tox-grade-desc" class="text-muted" style="margin-bottom:12px;font-size:12px;">' + CTCAE_GRADES[0].description + '</div>' +
    '<div class="form-group"><label>Description</label><textarea id="tox-desc" class="form-control" rows="3" placeholder="Specific findings..."></textarea></div>';

  openModal({
    title: 'Record Toxicity — CTCAE',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-tox-btn">Save</button>'
  });

  document.getElementById('tox-grade').addEventListener('change', function() {
    var g = parseInt(this.value);
    var info = CTCAE_GRADES.find(function(x) { return x.grade === g; });
    document.getElementById('tox-grade-desc').textContent = info ? info.description : '';
  });

  document.getElementById('save-tox-btn').addEventListener('click', function() {
    saveToxicityGrade({
      patientId: patientId,
      system: document.getElementById('tox-system').value,
      grade: parseInt(document.getElementById('tox-grade').value),
      description: document.getElementById('tox-desc').value
    });
    closeModal();
    showToast('Toxicity grade recorded', 'success');
    renderOncology(patientId);
  });
}

/* ============================================================
   TAB: Lab Monitoring
   ============================================================ */
function buildLabMonitoringTab(card, patient) {
  var h = document.createElement('h3');
  h.textContent = 'Lab Monitoring';
  h.style.marginBottom = '12px';
  card.appendChild(h);

  var labs = loadAll(KEYS.labResults).filter(function(l) { return l.patientId === patient.id; });
  labs.sort(function(a, b) { return new Date(b.resultDate) - new Date(a.resultDate); });

  // CBC trend
  var cbcPanels = ['CBC', 'CBC with Differential', 'CBC w/ Diff'];
  var cbcLabs = labs.filter(function(l) {
    return cbcPanels.some(function(p) { return (l.panel || '').toLowerCase().indexOf(p.toLowerCase()) >= 0; });
  });

  if (cbcLabs.length > 0) {
    var cbcSection = document.createElement('div');
    cbcSection.innerHTML = '<h4 style="margin-bottom:8px">CBC Trend</h4>';
    var cbcTable = '<table class="data-table data-table-compact"><thead><tr><th>Date</th><th>WBC</th><th>Hgb</th><th>Plt</th><th>ANC</th></tr></thead><tbody>';
    cbcLabs.slice(0, 10).forEach(function(l) {
      var tests = l.tests || [];
      var get = function(name) {
        var t = tests.find(function(x) { return x.name.toLowerCase().indexOf(name.toLowerCase()) >= 0; });
        return t ? t.value + ' ' + (t.unit || '') : '—';
      };
      cbcTable += '<tr><td>' + new Date(l.resultDate).toLocaleDateString() + '</td><td>' + get('WBC') + '</td><td>' + get('Hgb') + '</td><td>' + get('Plt') + '</td><td>' + get('ANC') + '</td></tr>';
    });
    cbcTable += '</tbody></table>';
    cbcSection.innerHTML += cbcTable;
    card.appendChild(cbcSection);
  }

  // Renal/Hepatic
  var chemPanels = ['CMP', 'BMP', 'Metabolic', 'Hepatic', 'Renal'];
  var chemLabs = labs.filter(function(l) {
    return chemPanels.some(function(p) { return (l.panel || '').toLowerCase().indexOf(p.toLowerCase()) >= 0; });
  });

  if (chemLabs.length > 0) {
    var chemSection = document.createElement('div');
    chemSection.style.marginTop = '16px';
    chemSection.innerHTML = '<h4 style="margin-bottom:8px">Renal / Hepatic Function</h4>';
    var chemTable = '<table class="data-table data-table-compact"><thead><tr><th>Date</th><th>Cr</th><th>BUN</th><th>AST</th><th>ALT</th><th>T.Bili</th></tr></thead><tbody>';
    chemLabs.slice(0, 10).forEach(function(l) {
      var tests = l.tests || [];
      var get = function(name) {
        var t = tests.find(function(x) { return x.name.toLowerCase().indexOf(name.toLowerCase()) >= 0; });
        return t ? t.value + ' ' + (t.unit || '') : '—';
      };
      chemTable += '<tr><td>' + new Date(l.resultDate).toLocaleDateString() + '</td><td>' + get('Creatinine') + '</td><td>' + get('BUN') + '</td><td>' + get('AST') + '</td><td>' + get('ALT') + '</td><td>' + get('Bilirubin') + '</td></tr>';
    });
    chemTable += '</tbody></table>';
    chemSection.innerHTML += chemTable;
    card.appendChild(chemSection);
  }

  if (cbcLabs.length === 0 && chemLabs.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No lab results found for this patient.' }));
  }
}

/* ============================================================
   TAB: Treatment Summary
   ============================================================ */
function buildTreatmentSummaryTab(card, patient) {
  var h = document.createElement('h3');
  h.textContent = 'Treatment Summary';
  h.style.marginBottom = '12px';
  card.appendChild(h);

  var summaries = getTreatmentSummaries(patient.id);
  var addBtn = makeBtn('+ New Summary', 'btn btn-sm btn-primary', function() { openTreatmentSummaryModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (summaries.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No treatment summaries recorded.' }));
    return;
  }

  summaries.forEach(function(s) {
    var sCard = document.createElement('div');
    sCard.className = 'specialty-record-card';
    var statusClass = s.responseStatus === 'Complete Response' ? 'badge-success' :
                      s.responseStatus === 'Progressive Disease' ? 'badge-danger' : 'badge-info';
    sCard.innerHTML =
      '<div class="specialty-record-header">' +
        '<strong>' + esc(s.diagnosis) + '</strong>' +
        '<span class="badge ' + statusClass + '">' + esc(s.responseStatus || 'Pending') + '</span>' +
      '</div>' +
      '<div class="specialty-record-body">' +
        (s.staging ? '<p><strong>Staging:</strong> ' + esc(s.staging) + '</p>' : '') +
        (s.treatmentHistory ? '<p><strong>Treatment History:</strong> ' + esc(s.treatmentHistory) + '</p>' : '') +
      '</div>' +
      '<div class="specialty-record-footer"><span class="text-muted">' + formatDateTime(s.createdAt) + '</span></div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openTreatmentSummaryModal(patient.id, s); });
    sCard.querySelector('.specialty-record-footer').appendChild(editBtn);
    card.appendChild(sCard);
  });
}

function openTreatmentSummaryModal(patientId, existing) {
  var s = existing || {};
  var bodyHTML =
    '<div class="form-group"><label>Diagnosis</label><input id="ts-dx" class="form-control" value="' + esc(s.diagnosis || '') + '" /></div>' +
    '<div class="form-group"><label>Staging</label><input id="ts-staging" class="form-control" placeholder="e.g., Stage IIIA (T3N1M0)" value="' + esc(s.staging || '') + '" /></div>' +
    '<div class="form-group"><label>Treatment History</label><textarea id="ts-history" class="form-control" rows="4">' + esc(s.treatmentHistory || '') + '</textarea></div>' +
    '<div class="form-group"><label>Response Status</label><select id="ts-response" class="form-control">' +
      ['', 'Complete Response', 'Partial Response', 'Stable Disease', 'Progressive Disease'].map(function(r) {
        return '<option' + (s.responseStatus === r ? ' selected' : '') + '>' + r + '</option>';
      }).join('') +
    '</select></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Treatment Summary',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-ts-btn">Save</button>'
  });

  document.getElementById('save-ts-btn').addEventListener('click', function() {
    saveTreatmentSummary({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      diagnosis: document.getElementById('ts-dx').value.trim(),
      staging: document.getElementById('ts-staging').value.trim(),
      treatmentHistory: document.getElementById('ts-history').value.trim(),
      responseStatus: document.getElementById('ts-response').value
    });
    closeModal();
    showToast('Treatment summary saved', 'success');
    renderOncology(patientId);
  });
}

/* ---------- Chart Integration ---------- */
function buildOncologyChartSection(patientId) {
  if (!hasOncologyDiagnosis(patientId)) return null;

  var section = document.createElement('div');
  section.className = 'chart-section';
  section.id = 'section-oncology';
  section.innerHTML =
    '<div class="chart-section-header">' +
      '<h3>Oncology</h3>' +
      '<button class="btn btn-xs btn-primary" onclick="navigate(\'#oncology/' + patientId + '\')">Open Oncology Module</button>' +
    '</div>';

  var plans = getChemoPlans(patientId);
  if (plans.length > 0) {
    var plansList = '<ul style="margin:8px 0 0 16px;">';
    plans.forEach(function(p) {
      var cycles = getChemoCycles(p.id);
      var current = cycles.length;
      plansList += '<li><strong>' + esc(p.protocolName) + '</strong> — Cycle ' + current + '/' + p.totalCycles + '</li>';
    });
    plansList += '</ul>';
    section.innerHTML += plansList;
  }

  var summaries = getTreatmentSummaries(patientId);
  if (summaries.length > 0) {
    var latest = summaries[summaries.length - 1];
    if (latest.responseStatus) {
      var badge = document.createElement('span');
      badge.className = 'badge ' + (latest.responseStatus === 'Complete Response' ? 'badge-success' : latest.responseStatus === 'Progressive Disease' ? 'badge-danger' : 'badge-info');
      badge.textContent = latest.responseStatus;
      badge.style.marginTop = '8px';
      badge.style.display = 'inline-block';
      section.appendChild(badge);
    }
  }

  return section;
}
