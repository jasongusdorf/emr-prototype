/* ============================================================
   views/surgery.js — Surgery Module
   Pre-op checklists, operative notes, anesthesia records,
   post-op orders, surgical scheduling
   ============================================================ */

/* ---------- WHO Surgical Safety Checklist Items ---------- */
const WHO_SIGN_IN = [
  { key: 'identityConfirmed', label: 'Patient identity confirmed' },
  { key: 'siteMarked', label: 'Surgical site marked' },
  { key: 'anesthesiaSafetyCheck', label: 'Anesthesia safety check completed' },
  { key: 'allergiesReviewed', label: 'Known allergies reviewed' },
  { key: 'airwayRisk', label: 'Airway / aspiration risk assessed' },
  { key: 'bloodLossRisk', label: 'Risk of blood loss assessed (>500 mL)' },
  { key: 'consentSigned', label: 'Informed consent signed' },
  { key: 'imagingAvailable', label: 'Essential imaging displayed' }
];

const WHO_TIME_OUT = [
  { key: 'teamIntroduced', label: 'All team members introduced by name and role' },
  { key: 'patientConfirmed', label: 'Patient name, procedure, and site confirmed' },
  { key: 'antibioticsGiven', label: 'Prophylactic antibiotics given within last 60 min' },
  { key: 'criticalEvents', label: 'Anticipated critical events reviewed' },
  { key: 'surgeonReview', label: 'Surgeon: critical steps, duration, blood loss' },
  { key: 'anesthesiaReview', label: 'Anesthesia: patient-specific concerns' },
  { key: 'nursingReview', label: 'Nursing: sterility confirmed, equipment issues' },
  { key: 'vteProphylaxis', label: 'VTE prophylaxis addressed' }
];

const WHO_SIGN_OUT = [
  { key: 'procedureRecorded', label: 'Procedure name recorded' },
  { key: 'countsCorrect', label: 'Instrument, sponge, and needle counts correct' },
  { key: 'specimenLabeled', label: 'Specimen labeled correctly' },
  { key: 'equipmentIssues', label: 'Equipment issues addressed' },
  { key: 'recoveryPlan', label: 'Key concerns for recovery communicated' }
];

const ASA_CLASSES = [
  { value: 'I', label: 'ASA I — Normal healthy patient' },
  { value: 'II', label: 'ASA II — Mild systemic disease' },
  { value: 'III', label: 'ASA III — Severe systemic disease' },
  { value: 'IV', label: 'ASA IV — Severe systemic disease, constant life threat' },
  { value: 'V', label: 'ASA V — Moribund, not expected to survive' },
  { value: 'VI', label: 'ASA VI — Brain-dead organ donor' }
];

const ANESTHESIA_TYPES = ['General', 'Regional - Spinal', 'Regional - Epidural', 'Regional - Nerve Block', 'MAC (Monitored Anesthesia Care)', 'Local', 'Conscious Sedation'];

let _surgTab = 'schedule';

/* ============================================================
   MAIN RENDER
   ============================================================ */
function renderSurgery(patientId) {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var patient = patientId ? getPatient(patientId) : null;
  if (patientId && !patient) { app.textContent = 'Patient not found.'; return; }

  setTopbar({
    title: patient ? 'Surgery — ' + esc(patient.firstName + ' ' + patient.lastName) : 'Surgery',
    meta: patient ? esc(patient.mrn) : '',
    actions: patient ? '<button class="btn btn-sm btn-primary" onclick="openScheduleSurgeryModal(\'' + patient.id + '\')">+ Schedule Surgery</button>' : ''
  });
  setActiveNav('surgery');

  var tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';
  var tabDefs = [
    { key: 'schedule', label: 'Surgical Schedule' },
    { key: 'preop', label: 'Pre-Op Checklist' },
    { key: 'opnote', label: 'Operative Notes' },
    { key: 'anesthesia', label: 'Anesthesia' },
    { key: 'postop', label: 'Post-Op Orders' }
  ];

  tabDefs.forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_surgTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() { _surgTab = t.key; renderSurgery(patientId); });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';

  switch (_surgTab) {
    case 'schedule': buildSurgicalScheduleTab(card, patient); break;
    case 'preop': buildPreOpTab(card, patient); break;
    case 'opnote': buildOpNoteTab(card, patient); break;
    case 'anesthesia': buildAnesthesiaTab(card, patient); break;
    case 'postop': buildPostOpTab(card, patient); break;
  }
  app.appendChild(card);
}

/* ============================================================
   TAB: Surgical Schedule
   ============================================================ */
function buildSurgicalScheduleTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Surgical Schedule</h3>';

  var schedules;
  if (patient) {
    schedules = getSurgicalSchedules(patient.id);
  } else {
    schedules = getSurgicalSchedules();
  }
  schedules.sort(function(a, b) { return new Date(a.dateTime || 0) - new Date(b.dateTime || 0); });

  if (!patient) {
    var addBtn = makeBtn('+ Schedule Surgery', 'btn btn-sm btn-primary', function() { openScheduleSurgeryModal(); });
    addBtn.style.marginBottom = '12px';
    card.appendChild(addBtn);
  }

  if (schedules.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No surgeries scheduled.' }));
    return;
  }

  var table = '<table class="data-table"><thead><tr>' +
    (!patient ? '<th>Patient</th>' : '') +
    '<th>Procedure</th><th>Surgeon</th><th>Date/Time</th><th>OR Room</th><th>Est. Duration</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  schedules.forEach(function(s) {
    var p = getPatient(s.patientId);
    var prov = getProviders().find(function(pr) { return pr.id === s.surgeon; });
    var statusClass = s.status === 'Completed' ? 'badge-success' : s.status === 'Cancelled' ? 'badge-danger' : s.status === 'In Progress' ? 'badge-warning' : 'badge-info';

    table += '<tr>';
    if (!patient) table += '<td>' + (p ? esc(p.firstName + ' ' + p.lastName) : '—') + '</td>';
    table += '<td>' + esc(s.procedure) + '</td>' +
      '<td>' + (prov ? esc(prov.firstName + ' ' + prov.lastName) : esc(s.surgeon || '—')) + '</td>' +
      '<td>' + (s.dateTime ? formatDateTime(s.dateTime) : '—') + '</td>' +
      '<td>' + esc(s.orRoom || '—') + '</td>' +
      '<td>' + esc(s.estimatedDuration || '—') + '</td>' +
      '<td><span class="badge ' + statusClass + '">' + esc(s.status) + '</span></td>' +
      '<td>' +
        '<button class="btn btn-xs btn-secondary" data-sched-id="' + s.id + '">Edit</button> ' +
        '<button class="btn btn-xs btn-info" data-consent-pid="' + s.patientId + '" data-consent-cid="' + s.id + '">Consent Form</button>' +
      '</td>' +
      '</tr>';
  });
  table += '</tbody></table>';
  var tableDiv = document.createElement('div');
  tableDiv.innerHTML = table;
  card.appendChild(tableDiv);

  tableDiv.querySelectorAll('[data-sched-id]:not([data-consent-pid])').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = this.getAttribute('data-sched-id');
      var sched = schedules.find(function(s) { return s.id === id; });
      if (sched) openScheduleSurgeryModal(sched.patientId, sched);
    });
  });

  tableDiv.querySelectorAll('[data-consent-pid]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var pid = this.getAttribute('data-consent-pid');
      var cid = this.getAttribute('data-consent-cid');
      openSurgicalConsentModal(pid, cid);
    });
  });

  // Preference Cards button
  var prefBtn = makeBtn('Preference Cards', 'btn btn-sm btn-secondary', function() {
    var surgeonId = getSessionUser().id;
    openSurgeonPrefModal(surgeonId);
  });
  prefBtn.style.marginTop = '12px';
  card.appendChild(prefBtn);
}

function openScheduleSurgeryModal(patientId, existing) {
  var s = existing || {};
  var patients = getPatients();
  var providers = typeof getProviders === 'function' ? getProviders() : [];

  var patientOpts = patients.map(function(p) {
    return '<option value="' + p.id + '"' + (p.id === (patientId || s.patientId) ? ' selected' : '') + '>' + esc(p.firstName + ' ' + p.lastName + ' (' + p.mrn + ')') + '</option>';
  }).join('');

  var surgeonOpts = providers.map(function(p) {
    return '<option value="' + p.id + '"' + (p.id === s.surgeon ? ' selected' : '') + '>' + esc(p.firstName + ' ' + p.lastName) + '</option>';
  }).join('');

  var bodyHTML =
    '<div class="form-group"><label>Patient</label><select id="ss-patient" class="form-control">' + patientOpts + '</select></div>' +
    '<div class="form-group"><label>Procedure</label><input id="ss-procedure" class="form-control" value="' + esc(s.procedure || '') + '" placeholder="e.g., Laparoscopic cholecystectomy" /></div>' +
    '<div class="form-group"><label>Surgeon</label><select id="ss-surgeon" class="form-control"><option value="">Select surgeon</option>' + surgeonOpts + '</select></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Date/Time</label><input id="ss-datetime" type="datetime-local" class="form-control" value="' + (s.dateTime ? s.dateTime.slice(0, 16) : '') + '" /></div>' +
      '<div class="form-group"><label>OR Room</label><input id="ss-or" class="form-control" placeholder="e.g., OR-3" value="' + esc(s.orRoom || '') + '" /></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Estimated Duration</label><input id="ss-duration" class="form-control" placeholder="e.g., 2 hours" value="' + esc(s.estimatedDuration || '') + '" /></div>' +
      '<div class="form-group"><label>Status</label><select id="ss-status" class="form-control">' +
        ['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(function(st) {
          return '<option' + (s.status === st ? ' selected' : '') + '>' + st + '</option>';
        }).join('') +
      '</select></div>' +
    '</div>' +
    '<div class="form-group"><label>Equipment Needs</label><textarea id="ss-equipment" class="form-control" rows="2" placeholder="Special equipment, implants...">' + esc(s.equipmentNeeds || '') + '</textarea></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>H&P Status</label><select id="ss-hp" class="form-control">' +
        ['Pending', 'Completed', 'Not Required'].map(function(v) {
          return '<option' + (s.hpStatus === v ? ' selected' : '') + '>' + v + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Cardiac Clearance</label><select id="ss-cardiac" class="form-control">' +
        ['Pending', 'Completed', 'Not Required'].map(function(v) {
          return '<option' + (s.cardiacClearance === v ? ' selected' : '') + '>' + v + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Anesthesia Eval</label><select id="ss-aneseval" class="form-control">' +
        ['Pending', 'Completed', 'Not Required'].map(function(v) {
          return '<option' + (s.anesthesiaEval === v ? ' selected' : '') + '>' + v + '</option>';
        }).join('') +
      '</select></div>' +
    '</div>';

  openModal({
    title: (existing ? 'Edit' : 'Schedule') + ' Surgery',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-ss-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-ss-btn').addEventListener('click', function() {
    var pid = document.getElementById('ss-patient').value;
    var procedure = document.getElementById('ss-procedure').value.trim();
    if (!procedure) { showToast('Procedure is required', 'error'); return; }

    var newDateTime = document.getElementById('ss-datetime').value ? new Date(document.getElementById('ss-datetime').value).toISOString() : '';
    var newOrRoom = document.getElementById('ss-or').value.trim();
    var newDuration = document.getElementById('ss-duration').value.trim();

    // Conflict detection: check for overlapping OR room + time
    if (newDateTime && newOrRoom) {
      var newStart = new Date(newDateTime);
      // Parse estimated duration in minutes (accept formats like "2 hours", "90 min", "120")
      var durationMinutes = 120; // default 2 hours
      if (newDuration) {
        var durMatch = newDuration.match(/(\d+)\s*(h|hour|hr)/i);
        if (durMatch) {
          durationMinutes = parseInt(durMatch[1], 10) * 60;
          var minPart = newDuration.match(/(\d+)\s*(m|min)/i);
          if (minPart) durationMinutes += parseInt(minPart[1], 10);
        } else {
          var minOnly = newDuration.match(/(\d+)/);
          if (minOnly) durationMinutes = parseInt(minOnly[1], 10);
        }
      }
      var newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

      var allSchedules = getSurgicalSchedules();
      var conflict = allSchedules.some(function(sched) {
        if (existing && sched.id === existing.id) return false;
        if (sched.status === 'Cancelled') return false;
        if (!sched.orRoom || sched.orRoom.trim().toLowerCase() !== newOrRoom.toLowerCase()) return false;
        if (!sched.dateTime) return false;
        var schedStart = new Date(sched.dateTime);
        var schedDurMin = 120;
        if (sched.estimatedDuration) {
          var sdm = sched.estimatedDuration.match(/(\d+)\s*(h|hour|hr)/i);
          if (sdm) {
            schedDurMin = parseInt(sdm[1], 10) * 60;
            var smp = sched.estimatedDuration.match(/(\d+)\s*(m|min)/i);
            if (smp) schedDurMin += parseInt(smp[1], 10);
          } else {
            var smo = sched.estimatedDuration.match(/(\d+)/);
            if (smo) schedDurMin = parseInt(smo[1], 10);
          }
        }
        var schedEnd = new Date(schedStart.getTime() + schedDurMin * 60000);
        return newStart < schedEnd && newEnd > schedStart;
      });

      if (conflict) {
        showToast('Scheduling conflict: OR ' + esc(newOrRoom) + ' has an overlapping case at that time', 'warning');
        return;
      }
    }

    saveSurgicalSchedule({
      id: existing ? existing.id : undefined,
      patientId: pid,
      procedure: procedure,
      surgeon: document.getElementById('ss-surgeon').value,
      dateTime: newDateTime,
      orRoom: newOrRoom,
      estimatedDuration: newDuration,
      equipmentNeeds: document.getElementById('ss-equipment').value,
      status: document.getElementById('ss-status').value,
      hpStatus: document.getElementById('ss-hp').value,
      cardiacClearance: document.getElementById('ss-cardiac').value,
      anesthesiaEval: document.getElementById('ss-aneseval').value
    });
    closeModal();
    showToast('Surgery ' + (existing ? 'updated' : 'scheduled'), 'success');
    renderSurgery(patientId);
  });
}

/* ============================================================
   TAB: Pre-Op Checklist (WHO Surgical Safety)
   ============================================================ */
function buildPreOpTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:4px">WHO Surgical Safety Checklist</h3>' +
    '<p class="text-muted" style="margin-bottom:12px;font-size:12px;">Three phases: Sign In, Time Out, Sign Out</p>';

  if (!patient) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'Select a patient from the surgical schedule to manage checklists.' }));
    return;
  }

  var checklists = getPreOpChecklists(patient.id);
  var addBtn = makeBtn('+ New Checklist', 'btn btn-sm btn-primary', function() { openPreOpChecklistModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (checklists.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No checklists on file.' }));
    return;
  }

  checklists.forEach(function(cl) {
    var clCard = document.createElement('div');
    clCard.className = 'specialty-record-card';

    var signInComplete = WHO_SIGN_IN.every(function(item) { return cl.signIn && cl.signIn[item.key]; });
    var timeOutComplete = WHO_TIME_OUT.every(function(item) { return cl.timeOut && cl.timeOut[item.key]; });
    var signOutComplete = WHO_SIGN_OUT.every(function(item) { return cl.signOut && cl.signOut[item.key]; });

    clCard.innerHTML =
      '<div class="specialty-record-header"><strong>Surgical Safety Checklist</strong><span class="text-muted">' + formatDateTime(cl.createdAt) + '</span></div>' +
      '<div class="specialty-record-body">' +
        '<div class="who-checklist-grid">' +
          buildChecklistPhaseHTML('Sign In', WHO_SIGN_IN, cl.signIn || {}, signInComplete) +
          buildChecklistPhaseHTML('Time Out', WHO_TIME_OUT, cl.timeOut || {}, timeOutComplete) +
          buildChecklistPhaseHTML('Sign Out', WHO_SIGN_OUT, cl.signOut || {}, signOutComplete) +
        '</div>' +
      '</div>';

    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openPreOpChecklistModal(patient.id, cl); });
    var footer = document.createElement('div');
    footer.className = 'specialty-record-footer';
    footer.appendChild(editBtn);
    clCard.appendChild(footer);
    card.appendChild(clCard);
  });
}

function buildChecklistPhaseHTML(title, items, data, complete) {
  var badge = complete ? '<span class="badge badge-success">Complete</span>' : '<span class="badge badge-warning">Incomplete</span>';
  var html = '<div class="who-checklist-phase"><h4>' + title + ' ' + badge + '</h4><ul class="checklist-items">';
  items.forEach(function(item) {
    var checked = data[item.key] ? 'checklist-checked' : 'checklist-unchecked';
    html += '<li class="' + checked + '">' + esc(item.label) + '</li>';
  });
  html += '</ul></div>';
  return html;
}

function openPreOpChecklistModal(patientId, existing) {
  var cl = existing || { signIn: {}, timeOut: {}, signOut: {} };
  var schedules = getSurgicalSchedules(patientId);

  function buildPhaseInputs(title, items, data, prefix, disabled) {
    var html = '<fieldset class="checklist-fieldset" id="fieldset-' + prefix + '"' + (disabled ? ' disabled' : '') + '><legend>' + title +
      (disabled ? ' <span class="badge badge-secondary" id="gate-badge-' + prefix + '">Locked — complete previous phase</span>' : '') +
      '</legend>';
    items.forEach(function(item) {
      html += '<div class="checkbox-group"><input type="checkbox" class="phase-check-' + prefix + '" id="' + prefix + '-' + item.key + '"' + (data[item.key] ? ' checked' : '') + ' />' +
        '<label for="' + prefix + '-' + item.key + '">' + esc(item.label) + '</label></div>';
    });
    html += '</fieldset>';
    return html;
  }

  var signInComplete = WHO_SIGN_IN.every(function(item) { return cl.signIn && cl.signIn[item.key]; });
  var timeOutComplete = WHO_TIME_OUT.every(function(item) { return cl.timeOut && cl.timeOut[item.key]; });

  var caseOpts = '<option value="">— Select surgical case —</option>' + schedules.map(function(s) {
    return '<option value="' + s.id + '"' + (cl.surgicalCaseId === s.id ? ' selected' : '') + '>' + esc(s.procedure + ' — ' + (s.dateTime ? formatDateTime(s.dateTime) : 'TBD')) + '</option>';
  }).join('');

  var bodyHTML =
    '<div class="form-group"><label>Surgical Case</label><select id="preop-case" class="form-control">' + caseOpts + '</select></div>' +
    buildPhaseInputs('Sign In', WHO_SIGN_IN, cl.signIn || {}, 'si', false) +
    buildPhaseInputs('Time Out', WHO_TIME_OUT, cl.timeOut || {}, 'to', !signInComplete) +
    buildPhaseInputs('Sign Out', WHO_SIGN_OUT, cl.signOut || {}, 'so', !timeOutComplete);

  openModal({
    title: 'WHO Surgical Safety Checklist',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-preop-btn">Save</button>',
    size: 'lg'
  });

  function updatePhaseGating() {
    var allSignIn = WHO_SIGN_IN.every(function(item) {
      var el = document.getElementById('si-' + item.key);
      return el && el.checked;
    });
    var allTimeOut = WHO_TIME_OUT.every(function(item) {
      var el = document.getElementById('to-' + item.key);
      return el && el.checked;
    });

    var toFieldset = document.getElementById('fieldset-to');
    var soFieldset = document.getElementById('fieldset-so');
    var toBadge = document.getElementById('gate-badge-to');
    var soBadge = document.getElementById('gate-badge-so');

    if (allSignIn) {
      toFieldset.removeAttribute('disabled');
      if (toBadge) toBadge.remove();
    } else {
      toFieldset.setAttribute('disabled', 'disabled');
      if (!toBadge) {
        var b = document.createElement('span');
        b.className = 'badge badge-secondary';
        b.id = 'gate-badge-to';
        b.textContent = 'Locked — complete previous phase';
        toFieldset.querySelector('legend').appendChild(b);
      }
    }

    if (allTimeOut && allSignIn) {
      soFieldset.removeAttribute('disabled');
      if (soBadge) soBadge.remove();
    } else {
      soFieldset.setAttribute('disabled', 'disabled');
      if (!soBadge) {
        var b2 = document.createElement('span');
        b2.className = 'badge badge-secondary';
        b2.id = 'gate-badge-so';
        b2.textContent = 'Locked — complete previous phase';
        soFieldset.querySelector('legend').appendChild(b2);
      }
    }
  }

  // Attach change listeners for gating
  WHO_SIGN_IN.forEach(function(item) {
    var el = document.getElementById('si-' + item.key);
    if (el) el.addEventListener('change', updatePhaseGating);
  });
  WHO_TIME_OUT.forEach(function(item) {
    var el = document.getElementById('to-' + item.key);
    if (el) el.addEventListener('change', updatePhaseGating);
  });

  document.getElementById('save-preop-btn').addEventListener('click', function() {
    function collectPhase(items, prefix) {
      var data = {};
      items.forEach(function(item) {
        var el = document.getElementById(prefix + '-' + item.key);
        data[item.key] = el ? el.checked : false;
      });
      return data;
    }

    var signInData = collectPhase(WHO_SIGN_IN, 'si');
    var timeOutData = collectPhase(WHO_TIME_OUT, 'to');
    var signOutData = collectPhase(WHO_SIGN_OUT, 'so');
    var now = new Date().toISOString();
    var userId = getSessionUser().id;

    var signInAllChecked = WHO_SIGN_IN.every(function(item) { return signInData[item.key]; });
    var timeOutAllChecked = WHO_TIME_OUT.every(function(item) { return timeOutData[item.key]; });
    var signOutAllChecked = WHO_SIGN_OUT.every(function(item) { return signOutData[item.key]; });

    // Phase timestamps: set completedAt/By when phase first completed
    var signInCompletedAt = cl.signInCompletedAt || (signInAllChecked ? now : '');
    var signInCompletedBy = cl.signInCompletedBy || (signInAllChecked ? userId : '');
    var timeOutCompletedAt = cl.timeOutCompletedAt || (timeOutAllChecked ? now : '');
    var timeOutCompletedBy = cl.timeOutCompletedBy || (timeOutAllChecked ? userId : '');
    var signOutCompletedAt = cl.signOutCompletedAt || (signOutAllChecked ? now : '');
    var signOutCompletedBy = cl.signOutCompletedBy || (signOutAllChecked ? userId : '');

    savePreOpChecklist({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      surgicalCaseId: document.getElementById('preop-case').value,
      signIn: signInData,
      timeOut: timeOutData,
      signOut: signOutData,
      signInCompletedAt: signInCompletedAt,
      signInCompletedBy: signInCompletedBy,
      timeOutCompletedAt: timeOutCompletedAt,
      timeOutCompletedBy: timeOutCompletedBy,
      signOutCompletedAt: signOutCompletedAt,
      signOutCompletedBy: signOutCompletedBy,
      completedBy: userId,
      completedAt: now
    });
    closeModal();
    showToast('Checklist saved', 'success');
    renderSurgery(patientId);
  });
}

/* ============================================================
   Surgical Consent Form (2d)
   ============================================================ */
function openSurgicalConsentModal(patientId, caseId) {
  // Check for existing consent for this case
  var existingConsents = getSurgicalConsents(patientId).filter(function(c) { return c.surgicalCaseId === caseId; });
  var existing = existingConsents.length > 0 ? existingConsents[0] : null;
  var c = existing || {};

  var sched = getSurgicalSchedules(patientId).find(function(s) { return s.id === caseId; });
  var procName = (sched ? sched.procedure : '') || '';

  var bodyHTML =
    '<div class="form-group"><label>Procedure Name</label><input id="sc-procedure" class="form-control" value="' + esc(c.procedureName || procName) + '" /></div>' +
    '<div class="form-group"><label>Risks Discussed</label><textarea id="sc-risks" class="form-control" rows="3" placeholder="List risks discussed with patient...">' + esc(c.risksDiscussed || '') + '</textarea></div>' +
    '<div class="form-group"><label>Alternatives Discussed</label><textarea id="sc-alternatives" class="form-control" rows="3" placeholder="List alternatives discussed with patient...">' + esc(c.alternativesDiscussed || '') + '</textarea></div>' +
    '<div class="checkbox-group"><input type="checkbox" id="sc-acknowledge"' + (c.patientAcknowledgment ? ' checked' : '') + ' />' +
      '<label for="sc-acknowledge">Patient acknowledges understanding of procedure, risks, and alternatives</label></div>' +
    '<div class="form-group"><label>Witness Name</label><input id="sc-witness" class="form-control" value="' + esc(c.witnessName || '') + '" placeholder="Name of witness" /></div>' +
    '<div class="form-group"><label>Date/Time</label><input id="sc-datetime" type="datetime-local" class="form-control" value="' + (c.consentDateTime ? c.consentDateTime.slice(0, 16) : new Date().toISOString().slice(0, 16)) + '" /></div>';

  openModal({
    title: 'Surgical Consent Form',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-sc-btn">Save Consent</button>',
    size: 'lg'
  });

  document.getElementById('save-sc-btn').addEventListener('click', function() {
    var ack = document.getElementById('sc-acknowledge').checked;
    if (!ack) { showToast('Patient acknowledgment is required', 'error'); return; }
    var proc = document.getElementById('sc-procedure').value.trim();
    if (!proc) { showToast('Procedure name is required', 'error'); return; }

    saveSurgicalConsent({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      surgicalCaseId: caseId,
      procedureName: proc,
      risksDiscussed: document.getElementById('sc-risks').value,
      alternativesDiscussed: document.getElementById('sc-alternatives').value,
      patientAcknowledgment: ack,
      witnessName: document.getElementById('sc-witness').value,
      consentDateTime: document.getElementById('sc-datetime').value ? new Date(document.getElementById('sc-datetime').value).toISOString() : new Date().toISOString(),
      completedBy: getSessionUser().id
    });
    closeModal();
    showToast('Surgical consent saved', 'success');
  });
}

/* ============================================================
   TAB: Operative Notes
   ============================================================ */
function buildOpNoteTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Operative Notes</h3>';

  if (!patient) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'Select a patient to view operative notes.' }));
    return;
  }

  var notes = getOperativeNotes(patient.id).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var addBtn = makeBtn('+ New Op Note', 'btn btn-sm btn-primary', function() { openOpNoteModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (notes.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No operative notes.' }));
    return;
  }

  notes.forEach(function(n) {
    var nCard = document.createElement('div');
    nCard.className = 'specialty-record-card';
    var prov = typeof getProviders === 'function' ? getProviders().find(function(p) { return p.id === n.surgeon; }) : null;
    nCard.innerHTML =
      '<div class="specialty-record-header"><strong>' + esc(n.procedure || 'Operative Note') + '</strong><span class="text-muted">' + formatDateTime(n.createdAt) + '</span></div>' +
      '<div class="specialty-record-body op-note-body">' +
        '<p><strong>Pre-op Dx:</strong> ' + esc(n.preopDiagnosis || '—') + '</p>' +
        '<p><strong>Post-op Dx:</strong> ' + esc(n.postopDiagnosis || '—') + '</p>' +
        '<p><strong>Procedure:</strong> ' + esc(n.procedure || '—') + '</p>' +
        '<p><strong>Surgeon:</strong> ' + (prov ? esc(prov.firstName + ' ' + prov.lastName) : esc(n.surgeon || '—')) + '</p>' +
        '<p><strong>Co-Surgeon:</strong> ' + esc(n.coSurgeon || '—') + '</p>' +
        '<p><strong>Assistant:</strong> ' + esc(n.assistant || '—') + '</p>' +
        '<p><strong>Anesthesia:</strong> ' + esc(n.anesthesiaType || '—') + '</p>' +
        '<p><strong>Positioning:</strong> ' + esc(n.positioning || '—') + '</p>' +
        '<p><strong>Incision Time:</strong> ' + (n.incisionTime ? formatDateTime(n.incisionTime) : '—') + '</p>' +
        '<p><strong>Closure Time:</strong> ' + (n.closureTime ? formatDateTime(n.closureTime) : '—') + '</p>' +
        '<p><strong>Skin Closure:</strong> ' + esc(n.skinClosure || '—') + '</p>' +
        '<p><strong>Findings:</strong> ' + esc(n.findings || '—') + '</p>' +
        '<p><strong>EBL:</strong> ' + esc(n.ebl || '—') + ' mL</p>' +
        '<p><strong>Complications:</strong> ' + esc(n.complications || 'None') + '</p>' +
        '<p><strong>Implants:</strong> ' + esc(n.implants || 'None') + '</p>' +
        '<p><strong>Specimens:</strong> ' + esc(n.specimens || 'None') + '</p>' +
        '<p><strong>Drains:</strong> ' + esc(n.drains || 'None') + '</p>' +
        '<p><strong>Disposition:</strong> ' + esc(n.disposition || '—') + '</p>' +
      '</div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openOpNoteModal(patient.id, n); });
    var footer = document.createElement('div');
    footer.className = 'specialty-record-footer';
    footer.appendChild(editBtn);
    nCard.appendChild(footer);
    card.appendChild(nCard);
  });
}

function openOpNoteModal(patientId, existing) {
  var n = existing || {};
  var providers = typeof getProviders === 'function' ? getProviders() : [];
  var surgeonOpts = providers.map(function(p) {
    return '<option value="' + p.id + '"' + (p.id === n.surgeon ? ' selected' : '') + '>' + esc(p.firstName + ' ' + p.lastName) + '</option>';
  }).join('');

  var anesOpts = ANESTHESIA_TYPES.map(function(t) {
    return '<option' + (n.anesthesiaType === t ? ' selected' : '') + '>' + t + '</option>';
  }).join('');

  var bodyHTML =
    '<div class="form-group"><label>Pre-operative Diagnosis</label><input id="on-preop" class="form-control" value="' + esc(n.preopDiagnosis || '') + '" /></div>' +
    '<div class="form-group"><label>Post-operative Diagnosis</label><input id="on-postop" class="form-control" value="' + esc(n.postopDiagnosis || '') + '" /></div>' +
    '<div class="form-group"><label>Procedure Performed</label><input id="on-procedure" class="form-control" value="' + esc(n.procedure || '') + '" /></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Surgeon</label><select id="on-surgeon" class="form-control"><option value="">Select</option>' + surgeonOpts + '</select></div>' +
      '<div class="form-group"><label>Assistant</label><input id="on-assistant" class="form-control" value="' + esc(n.assistant || '') + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Co-Surgeon</label><input id="on-cosurgeon" class="form-control" value="' + esc(n.coSurgeon || '') + '" placeholder="Co-surgeon name" /></div>' +
    '<div class="form-group"><label>Anesthesia Type</label><select id="on-anesthesia" class="form-control">' + anesOpts + '</select></div>' +
    '<div class="form-group"><label>Positioning</label><select id="on-positioning" class="form-control">' +
      ['', 'Supine', 'Prone', 'Lateral Decubitus', 'Lithotomy', 'Trendelenburg', 'Reverse Trendelenburg', 'Sitting'].map(function(pos) {
        return '<option value="' + pos + '"' + (n.positioning === pos ? ' selected' : '') + '>' + (pos || 'Select positioning') + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Incision Time</label><input id="on-incisiontime" type="datetime-local" class="form-control" value="' + (n.incisionTime ? n.incisionTime.slice(0, 16) : '') + '" /></div>' +
      '<div class="form-group"><label>Closure Time</label><input id="on-closuretime" type="datetime-local" class="form-control" value="' + (n.closureTime ? n.closureTime.slice(0, 16) : '') + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Skin Closure</label><select id="on-skinclosure" class="form-control">' +
      ['', 'Staples', 'Sutures', 'Adhesive', 'Steri-Strips', 'None'].map(function(sc) {
        return '<option value="' + sc + '"' + (n.skinClosure === sc ? ' selected' : '') + '>' + (sc || 'Select skin closure') + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Findings</label><textarea id="on-findings" class="form-control" rows="4">' + esc(n.findings || '') + '</textarea></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>EBL (mL)</label><input id="on-ebl" class="form-control" value="' + esc(n.ebl || '') + '" /></div>' +
      '<div class="form-group"><label>Complications</label><input id="on-complications" class="form-control" value="' + esc(n.complications || '') + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Implants</label><textarea id="on-implants" class="form-control" rows="2" placeholder="List implants used...">' + esc(n.implants || '') + '</textarea></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Specimens</label><input id="on-specimens" class="form-control" value="' + esc(n.specimens || '') + '" /></div>' +
      '<div class="form-group"><label>Drains</label><input id="on-drains" class="form-control" value="' + esc(n.drains || '') + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Disposition</label><select id="on-disposition" class="form-control">' +
      ['PACU', 'ICU', 'Floor', 'Same Day Discharge', 'Observation'].map(function(d) {
        return '<option' + (n.disposition === d ? ' selected' : '') + '>' + d + '</option>';
      }).join('') +
    '</select></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Operative Note',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-on-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-on-btn').addEventListener('click', function() {
    saveOperativeNote({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      preopDiagnosis: document.getElementById('on-preop').value,
      postopDiagnosis: document.getElementById('on-postop').value,
      procedure: document.getElementById('on-procedure').value,
      surgeon: document.getElementById('on-surgeon').value,
      assistant: document.getElementById('on-assistant').value,
      coSurgeon: document.getElementById('on-cosurgeon').value,
      anesthesiaType: document.getElementById('on-anesthesia').value,
      positioning: document.getElementById('on-positioning').value,
      incisionTime: document.getElementById('on-incisiontime').value ? new Date(document.getElementById('on-incisiontime').value).toISOString() : '',
      closureTime: document.getElementById('on-closuretime').value ? new Date(document.getElementById('on-closuretime').value).toISOString() : '',
      skinClosure: document.getElementById('on-skinclosure').value,
      findings: document.getElementById('on-findings').value,
      ebl: document.getElementById('on-ebl').value,
      complications: document.getElementById('on-complications').value,
      implants: document.getElementById('on-implants').value,
      specimens: document.getElementById('on-specimens').value,
      drains: document.getElementById('on-drains').value,
      disposition: document.getElementById('on-disposition').value
    });
    closeModal();
    showToast('Operative note saved', 'success');
    renderSurgery(patientId);
  });
}

/* ============================================================
   TAB: Anesthesia Record
   ============================================================ */
function buildAnesthesiaTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Anesthesia Records</h3>';

  if (!patient) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'Select a patient to view anesthesia records.' }));
    return;
  }

  var records = getAnesthesiaRecords(patient.id).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var addBtn = makeBtn('+ New Record', 'btn btn-sm btn-primary', function() { openAnesthesiaModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (records.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No anesthesia records.' }));
    return;
  }

  records.forEach(function(r) {
    var rCard = document.createElement('div');
    rCard.className = 'specialty-record-card';
    rCard.innerHTML =
      '<div class="specialty-record-header"><strong>Anesthesia Record</strong><span class="badge badge-info">ASA ' + esc(r.asaClass || '—') + '</span></div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>Airway Assessment:</strong> ' + esc(r.airwayAssessment || '—') + '</p>' +
        '<p><strong>Induction:</strong> ' + esc(r.induction || '—') + '</p>' +
        '<p><strong>Maintenance:</strong> ' + esc(r.maintenance || '—') + '</p>' +
        '<p><strong>Fluids:</strong> ' + esc(r.fluids || '—') + '</p>' +
        '<p><strong>Medications:</strong> ' + esc(r.medications || '—') + '</p>' +
        '<p><strong>Emergence:</strong> ' + esc(r.emergence || '—') + '</p>' +
        (r.vitals && r.vitals.length > 0 ? buildAnesthesiaVitalsTable(r.vitals) : '') +
      '</div>' +
      '<div class="specialty-record-footer"><span class="text-muted">' + formatDateTime(r.createdAt) + '</span></div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openAnesthesiaModal(patient.id, r); });
    rCard.querySelector('.specialty-record-footer').appendChild(editBtn);
    card.appendChild(rCard);
  });
}

function buildAnesthesiaVitalsTable(vitals) {
  var html = '<h5 style="margin-top:8px;">Intraoperative Vitals</h5><table class="data-table data-table-compact"><thead><tr><th>Time</th><th>HR</th><th>BP</th><th>SpO2</th><th>EtCO2</th></tr></thead><tbody>';
  vitals.forEach(function(v) {
    html += '<tr><td>' + esc(v.time || '') + '</td><td>' + esc(v.hr || '') + '</td><td>' + esc(v.bp || '') + '</td><td>' + esc(v.spo2 || '') + '</td><td>' + esc(v.etco2 || '') + '</td></tr>';
  });
  html += '</tbody></table>';
  return html;
}

function openAnesthesiaModal(patientId, existing) {
  var r = existing || {};
  var asaOpts = ASA_CLASSES.map(function(a) {
    return '<option value="' + a.value + '"' + (r.asaClass === a.value ? ' selected' : '') + '>' + esc(a.label) + '</option>';
  }).join('');

  var bodyHTML =
    '<div class="form-group"><label>ASA Classification</label><select id="ar-asa" class="form-control">' + asaOpts + '</select></div>' +
    '<div class="form-group"><label>Airway Assessment</label><input id="ar-airway" class="form-control" placeholder="Mallampati class, neck mobility, dentition..." value="' + esc(r.airwayAssessment || '') + '" /></div>' +
    '<div class="form-group"><label>Induction</label><textarea id="ar-induction" class="form-control" rows="2" placeholder="Agents, technique...">' + esc(r.induction || '') + '</textarea></div>' +
    '<div class="form-group"><label>Maintenance</label><textarea id="ar-maintenance" class="form-control" rows="2">' + esc(r.maintenance || '') + '</textarea></div>' +
    '<div class="form-group"><label>Fluids</label><input id="ar-fluids" class="form-control" value="' + esc(r.fluids || '') + '" placeholder="e.g., LR 1500 mL" /></div>' +
    '<div class="form-group"><label>Medications</label><textarea id="ar-meds" class="form-control" rows="2">' + esc(r.medications || '') + '</textarea></div>' +
    '<div class="form-group"><label>Emergence</label><textarea id="ar-emergence" class="form-control" rows="2">' + esc(r.emergence || '') + '</textarea></div>' +
    '<fieldset class="form-fieldset" style="margin-top:12px;">' +
      '<legend>Intraoperative Vitals</legend>' +
      '<div id="ar-vitals-list"></div>' +
      '<button type="button" class="btn btn-sm btn-secondary" id="ar-add-vitals">+ Add Time Point</button>' +
    '</fieldset>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Anesthesia Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-ar-btn">Save</button>',
    size: 'lg'
  });

  // Populate existing vitals
  var existingVitals = r.vitals || [];
  existingVitals.forEach(function(v) { addAnesthesiaVitalRow(v); });

  document.getElementById('ar-add-vitals').addEventListener('click', function() {
    addAnesthesiaVitalRow({ time: '', hr: '', bp: '', spo2: '', etco2: '' });
  });

  document.getElementById('save-ar-btn').addEventListener('click', function() {
    var vitals = [];
    document.querySelectorAll('.ar-vital-row').forEach(function(row) {
      var inputs = row.querySelectorAll('input');
      vitals.push({ time: inputs[0].value, hr: inputs[1].value, bp: inputs[2].value, spo2: inputs[3].value, etco2: inputs[4].value });
    });
    saveAnesthesiaRecord({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      asaClass: document.getElementById('ar-asa').value,
      airwayAssessment: document.getElementById('ar-airway').value,
      induction: document.getElementById('ar-induction').value,
      maintenance: document.getElementById('ar-maintenance').value,
      fluids: document.getElementById('ar-fluids').value,
      medications: document.getElementById('ar-meds').value,
      emergence: document.getElementById('ar-emergence').value,
      vitals: vitals
    });
    closeModal();
    showToast('Anesthesia record saved', 'success');
    renderSurgery(patientId);
  });
}

function addAnesthesiaVitalRow(v) {
  var list = document.getElementById('ar-vitals-list');
  var row = document.createElement('div');
  row.className = 'ar-vital-row form-row';
  row.style.marginBottom = '4px';
  row.innerHTML =
    '<div class="form-group" style="flex:1"><input class="form-control" placeholder="Time" value="' + esc(v.time || '') + '" /></div>' +
    '<div class="form-group" style="flex:1"><input class="form-control" placeholder="HR" value="' + esc(v.hr || '') + '" /></div>' +
    '<div class="form-group" style="flex:1"><input class="form-control" placeholder="BP" value="' + esc(v.bp || '') + '" /></div>' +
    '<div class="form-group" style="flex:1"><input class="form-control" placeholder="SpO2" value="' + esc(v.spo2 || '') + '" /></div>' +
    '<div class="form-group" style="flex:1"><input class="form-control" placeholder="EtCO2" value="' + esc(v.etco2 || '') + '" /></div>' +
    '<button type="button" class="btn btn-xs btn-danger" style="align-self:flex-end;margin-bottom:8px">&times;</button>';
  row.querySelector('button').addEventListener('click', function() { row.remove(); });
  list.appendChild(row);
}

/* ============================================================
   TAB: Post-Op Orders
   ============================================================ */
function buildPostOpTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Post-Op Orders</h3>';

  if (!patient) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'Select a patient to manage post-op orders.' }));
    return;
  }

  var orders = getPostOpOrders(patient.id).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var addBtn = makeBtn('+ New Post-Op Orders', 'btn btn-sm btn-primary', function() { openPostOpModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (orders.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No post-op orders.' }));
    return;
  }

  orders.forEach(function(o) {
    var oCard = document.createElement('div');
    oCard.className = 'specialty-record-card';
    oCard.innerHTML =
      '<div class="specialty-record-header"><strong>Post-Op Orders</strong><span class="text-muted">' + formatDateTime(o.createdAt) + '</span></div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>Pain Management:</strong> ' + esc(o.painManagement || '—') + '</p>' +
        '<p><strong>VTE Prophylaxis:</strong> ' + esc(o.vteProphylaxis || '—') + '</p>' +
        '<p><strong>Diet:</strong> ' + esc(o.diet || '—') + '</p>' +
        '<p><strong>Activity:</strong> ' + esc(o.activity || '—') + '</p>' +
        '<p><strong>Wound Care:</strong> ' + esc(o.woundCare || '—') + '</p>' +
        '<p><strong>Follow-Up:</strong> ' + esc(o.followUp || '—') + '</p>' +
      '</div>';
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openPostOpModal(patient.id, o); });
    var footer = document.createElement('div');
    footer.className = 'specialty-record-footer';
    footer.appendChild(editBtn);
    oCard.appendChild(footer);
    card.appendChild(oCard);
  });
}

function openPostOpModal(patientId, existing) {
  var o = existing || {};

  // Build encounter selector — use most recent encounter for that patient as default
  var encounters = typeof getEncountersByPatient === 'function' ? getEncountersByPatient(patientId) : [];
  var defaultEncId = o.encounterId || (encounters.length > 0 ? encounters[0].id : '');
  var encOpts = '<option value="">— Select encounter —</option>' + encounters.map(function(enc) {
    var label = (enc.dateTime ? formatDateTime(enc.dateTime) : 'Unknown date') + (enc.chiefComplaint ? ' — ' + enc.chiefComplaint : '');
    return '<option value="' + enc.id + '"' + (enc.id === defaultEncId ? ' selected' : '') + '>' + esc(label) + '</option>';
  }).join('');

  var bodyHTML =
    '<div class="form-group"><label>Encounter</label><select id="po-encounter" class="form-control">' + encOpts + '</select></div>' +
    '<div class="form-group"><label>Pain Management Protocol</label><textarea id="po-pain" class="form-control" rows="3" placeholder="PCA, oral analgesics, nerve block, multimodal...">' + esc(o.painManagement || '') + '</textarea></div>' +
    '<div class="form-group"><label>VTE Prophylaxis</label><select id="po-vte" class="form-control">' +
      ['SCDs + early ambulation', 'Enoxaparin 40mg SQ daily', 'Heparin 5000u SQ q8h', 'Mechanical only (SCDs)', 'None (ambulatory same-day)'].map(function(v) {
        return '<option' + (o.vteProphylaxis === v ? ' selected' : '') + '>' + v + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Diet Advancement</label><select id="po-diet" class="form-control">' +
      ['NPO', 'Clear liquids', 'Advance as tolerated', 'Regular diet', 'Cardiac diet', 'Renal diet'].map(function(d) {
        return '<option' + (o.diet === d ? ' selected' : '') + '>' + d + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Activity Restrictions</label><textarea id="po-activity" class="form-control" rows="2">' + esc(o.activity || '') + '</textarea></div>' +
    '<div class="form-group"><label>Wound Care</label><textarea id="po-wound" class="form-control" rows="2">' + esc(o.woundCare || '') + '</textarea></div>' +
    '<div class="form-group"><label>Follow-Up</label><input id="po-followup" class="form-control" placeholder="e.g., 2 weeks in clinic" value="' + esc(o.followUp || '') + '" /></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Post-Op Orders',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-po-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-po-btn').addEventListener('click', function() {
    var encounterId = document.getElementById('po-encounter').value;
    if (!encounterId) {
      showToast('An encounter is required for post-op orders', 'error');
      return;
    }

    var dietVal = document.getElementById('po-diet').value;
    var painVal = document.getElementById('po-pain').value.trim();
    var vteVal = document.getElementById('po-vte').value;
    var activityVal = document.getElementById('po-activity').value.trim();

    savePostOpOrder({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      encounterId: encounterId,
      painManagement: painVal,
      vteProphylaxis: vteVal,
      diet: dietVal,
      activity: activityVal,
      woundCare: document.getElementById('po-wound').value,
      followUp: document.getElementById('po-followup').value
    });

    // CPOE integration: create structured orders via saveOrder()
    var orderErrors = [];

    // Diet order
    if (dietVal && dietVal !== 'NPO') {
      var dietResult = saveOrder({
        encounterId: encounterId,
        patientId: patientId,
        type: 'Diet',
        priority: 'Routine',
        status: 'Ordered',
        detail: { dietType: dietVal }
      });
      if (dietResult && dietResult.error) orderErrors.push('Diet: ' + dietResult.errors.join(', '));
    }

    // Pain meds order
    if (painVal) {
      var painResult = saveOrder({
        encounterId: encounterId,
        patientId: patientId,
        type: 'Medication',
        priority: 'Routine',
        status: 'Ordered',
        detail: { drug: painVal, indication: 'Post-operative pain management' }
      });
      if (painResult && painResult.error) orderErrors.push('Pain meds: ' + painResult.errors.join(', '));
    }

    // VTE prophylaxis order (only for medication-based options)
    if (vteVal && vteVal.indexOf('Enoxaparin') >= 0) {
      var vteResult = saveOrder({
        encounterId: encounterId,
        patientId: patientId,
        type: 'Medication',
        priority: 'Routine',
        status: 'Ordered',
        detail: { drug: 'Enoxaparin 40mg SQ daily', indication: 'VTE prophylaxis' }
      });
      if (vteResult && vteResult.error) orderErrors.push('VTE: ' + vteResult.errors.join(', '));
    } else if (vteVal && vteVal.indexOf('Heparin') >= 0) {
      var vteResult2 = saveOrder({
        encounterId: encounterId,
        patientId: patientId,
        type: 'Medication',
        priority: 'Routine',
        status: 'Ordered',
        detail: { drug: 'Heparin 5000u SQ q8h', indication: 'VTE prophylaxis' }
      });
      if (vteResult2 && vteResult2.error) orderErrors.push('VTE: ' + vteResult2.errors.join(', '));
    }

    // Activity order
    if (activityVal) {
      var actResult = saveOrder({
        encounterId: encounterId,
        patientId: patientId,
        type: 'Activity',
        priority: 'Routine',
        status: 'Ordered',
        detail: { level: activityVal }
      });
      if (actResult && actResult.error) orderErrors.push('Activity: ' + actResult.errors.join(', '));
    }

    closeModal();
    if (orderErrors.length > 0) {
      showToast('Post-op orders saved but some CPOE orders failed: ' + orderErrors.join('; '), 'warning');
    } else {
      showToast('Post-op orders saved and CPOE orders placed', 'success');
    }
    renderSurgery(patientId);
  });
}

/* ============================================================
   Surgeon Preference Cards (2f)
   ============================================================ */
function openSurgeonPrefModal(surgeonId) {
  var prefs = getSurgeonPreferences(surgeonId);

  var listHTML = '';
  if (prefs.length > 0) {
    listHTML = '<h4 style="margin-bottom:8px">Saved Preference Cards</h4>';
    prefs.forEach(function(p) {
      listHTML += '<div class="specialty-record-card" style="margin-bottom:8px;padding:10px;">' +
        '<p><strong>Procedure:</strong> ' + esc(p.procedure || '—') + '</p>' +
        '<p><strong>Equipment:</strong> ' + esc(p.equipment || '—') + '</p>' +
        '<p><strong>Sutures:</strong> ' + esc(p.sutures || '—') + '</p>' +
        '<p><strong>Positioning:</strong> ' + esc(p.positioning || '—') + '</p>' +
        '<button class="btn btn-xs btn-secondary sp-edit-btn" data-pref-id="' + p.id + '">Edit</button> ' +
        '<button class="btn btn-xs btn-danger sp-del-btn" data-pref-id="' + p.id + '">Delete</button>' +
        '</div>';
    });
  } else {
    listHTML = '<p class="text-muted">No preference cards on file.</p>';
  }

  var bodyHTML =
    '<div id="sp-list">' + listHTML + '</div>' +
    '<hr style="margin:12px 0" />' +
    '<h4 style="margin-bottom:8px" id="sp-form-title">New Preference Card</h4>' +
    '<div class="form-group"><label>Procedure</label><input id="sp-procedure" class="form-control" placeholder="e.g., Total knee arthroplasty" /></div>' +
    '<div class="form-group"><label>Equipment</label><textarea id="sp-equipment" class="form-control" rows="2" placeholder="List preferred equipment..."></textarea></div>' +
    '<div class="form-group"><label>Sutures</label><textarea id="sp-sutures" class="form-control" rows="2" placeholder="List preferred sutures..."></textarea></div>' +
    '<div class="form-group"><label>Positioning</label><select id="sp-positioning" class="form-control">' +
      ['', 'Supine', 'Prone', 'Lateral Decubitus', 'Lithotomy', 'Trendelenburg', 'Reverse Trendelenburg', 'Sitting'].map(function(pos) {
        return '<option value="' + pos + '">' + (pos || 'Select positioning') + '</option>';
      }).join('') +
    '</select></div>' +
    '<input type="hidden" id="sp-edit-id" value="" />';

  openModal({
    title: 'Surgeon Preference Cards',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-sp-btn">Save Preference</button>',
    size: 'lg'
  });

  // Edit existing preference
  document.querySelectorAll('.sp-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prefId = this.getAttribute('data-pref-id');
      var pref = prefs.find(function(p) { return p.id === prefId; });
      if (!pref) return;
      document.getElementById('sp-procedure').value = pref.procedure || '';
      document.getElementById('sp-equipment').value = pref.equipment || '';
      document.getElementById('sp-sutures').value = pref.sutures || '';
      document.getElementById('sp-positioning').value = pref.positioning || '';
      document.getElementById('sp-edit-id').value = pref.id;
      document.getElementById('sp-form-title').textContent = 'Edit Preference Card';
    });
  });

  // Delete preference
  document.querySelectorAll('.sp-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prefId = this.getAttribute('data-pref-id');
      if (typeof softDeleteRecord === 'function') {
        softDeleteRecord('surgeonPreferences', prefId);
      }
      showToast('Preference card deleted', 'success');
      closeModal();
      openSurgeonPrefModal(surgeonId);
    });
  });

  document.getElementById('save-sp-btn').addEventListener('click', function() {
    var proc = document.getElementById('sp-procedure').value.trim();
    if (!proc) { showToast('Procedure is required', 'error'); return; }

    var editId = document.getElementById('sp-edit-id').value;

    saveSurgeonPreference({
      id: editId || undefined,
      surgeonId: surgeonId,
      procedure: proc,
      equipment: document.getElementById('sp-equipment').value,
      sutures: document.getElementById('sp-sutures').value,
      positioning: document.getElementById('sp-positioning').value
    });
    closeModal();
    showToast('Preference card saved', 'success');
    openSurgeonPrefModal(surgeonId);
  });
}

/* ---------- Chart Integration ---------- */
function buildSurgeryChartSection(patientId) {
  var schedules = getSurgicalSchedules(patientId);
  var opNotes = getOperativeNotes(patientId);
  if (schedules.length === 0 && opNotes.length === 0) return null;

  var section = document.createElement('div');
  section.className = 'chart-section';
  section.id = 'section-surgery';
  section.innerHTML =
    '<div class="chart-section-header">' +
      '<h3>Surgery</h3>' +
      '<button class="btn btn-xs btn-primary" onclick="navigate(\'#surgery/' + patientId + '\')">Open Surgery Module</button>' +
    '</div>';

  if (schedules.length > 0) {
    var upcoming = schedules.filter(function(s) { return s.status === 'Scheduled'; });
    if (upcoming.length > 0) {
      section.innerHTML += '<p style="margin:8px 0;"><strong>Upcoming:</strong> ' + esc(upcoming[0].procedure) + ' — ' + (upcoming[0].dateTime ? formatDateTime(upcoming[0].dateTime) : 'TBD') + '</p>';
    }
  }

  if (opNotes.length > 0) {
    section.innerHTML += '<p style="margin:4px 0;"><strong>Recent Op Notes:</strong> ' + opNotes.length + ' on file</p>';
  }

  return section;
}
