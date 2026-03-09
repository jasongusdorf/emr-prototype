/* ============================================================
   views/check-in.js — Pre-Visit Questionnaires & Online Check-In
   ============================================================ */

/* ---------- Built-in Questionnaire Templates ---------- */
var BUILTIN_QUESTIONNAIRES = [
  {
    id: '_builtin_new_patient',
    title: 'New Patient Intake',
    description: 'Comprehensive intake form for new patients',
    builtIn: true,
    fields: [
      { id: 'reason', type: 'text', label: 'Reason for visit', required: true },
      { id: 'referral', type: 'select', label: 'How did you hear about us?', options: ['Doctor Referral', 'Insurance', 'Friend/Family', 'Online Search', 'Other'], required: false },
      { id: 'currentMeds', type: 'text', label: 'List all current medications (name, dose, frequency)', required: false },
      { id: 'allergies', type: 'text', label: 'List all allergies and reactions', required: false },
      { id: 'surgeries', type: 'text', label: 'List any past surgeries with approximate dates', required: false },
      { id: 'familyHistory', type: 'text', label: 'Family medical history (heart disease, cancer, diabetes, etc.)', required: false },
      { id: 'smokingStatus', type: 'select', label: 'Smoking status', options: ['Never', 'Former', 'Current — less than 1 pack/day', 'Current — 1+ pack/day'], required: true },
      { id: 'alcoholUse', type: 'select', label: 'Alcohol use', options: ['None', 'Social/Occasional', 'Daily', 'Heavy'], required: true },
      { id: 'exerciseFreq', type: 'select', label: 'Exercise frequency', options: ['None', '1-2x/week', '3-4x/week', '5+/week'], required: false },
      { id: 'consent', type: 'checkbox', label: 'I consent to treatment and authorize use of my health information as described in the Notice of Privacy Practices.', required: true }
    ]
  },
  {
    id: '_builtin_pre_visit',
    title: 'Pre-Visit Update',
    description: 'Quick update before your scheduled visit',
    builtIn: true,
    fields: [
      { id: 'medChanges', type: 'select', label: 'Any medication changes since last visit?', options: ['No changes', 'New medication added', 'Medication stopped', 'Dose changed'], required: true },
      { id: 'medChangeDetails', type: 'text', label: 'If yes, please describe medication changes', required: false },
      { id: 'newSymptoms', type: 'text', label: 'Any new symptoms or concerns?', required: false },
      { id: 'allergyUpdate', type: 'select', label: 'Any new allergies?', options: ['No new allergies', 'Yes — new allergy'], required: true },
      { id: 'allergyDetails', type: 'text', label: 'If yes, describe new allergy and reaction', required: false },
      { id: 'hospitalVisits', type: 'select', label: 'Any ER visits or hospitalizations since last visit?', options: ['None', 'ER visit', 'Hospitalization', 'Both'], required: true },
      { id: 'hospitalDetails', type: 'text', label: 'If yes, please describe', required: false },
      { id: 'painLevel', type: 'scale', label: 'Current pain level', min: 0, max: 10, required: false }
    ]
  },
  {
    id: '_builtin_surgical_preop',
    title: 'Surgical Pre-Op',
    description: 'Pre-operative assessment questionnaire',
    builtIn: true,
    fields: [
      { id: 'lastAte', type: 'text', label: 'When did you last eat or drink? (date and time)', required: true },
      { id: 'bloodThinners', type: 'select', label: 'Are you taking blood thinners (aspirin, warfarin, etc.)?', options: ['No', 'Yes — stopped as directed', 'Yes — still taking'], required: true },
      { id: 'recentIllness', type: 'select', label: 'Any illness in the past 2 weeks (cold, fever, cough)?', options: ['No', 'Yes'], required: true },
      { id: 'illnessDetails', type: 'text', label: 'If yes, describe illness', required: false },
      { id: 'anesthesiaReaction', type: 'select', label: 'Any previous reaction to anesthesia?', options: ['No', 'Yes', 'Unsure'], required: true },
      { id: 'anesthesiaDetails', type: 'text', label: 'If yes, describe reaction', required: false },
      { id: 'implants', type: 'select', label: 'Do you have any implants (pacemaker, joint replacement, etc.)?', options: ['No', 'Yes'], required: false },
      { id: 'implantDetails', type: 'text', label: 'If yes, describe implants', required: false },
      { id: 'rideHome', type: 'select', label: 'Do you have a ride arranged for after the procedure?', options: ['Yes', 'No — need help arranging'], required: true },
      { id: 'consent', type: 'checkbox', label: 'I confirm I have followed all pre-operative instructions provided to me.', required: true }
    ]
  }
];

/* ---------- Provider View: Check-In Management ---------- */
function renderCheckIn() {
  var app = document.getElementById('app');
  setTopbar({ title: 'Pre-Visit Check-In', meta: 'Manage questionnaires and review submissions' });
  setActiveNav('check-in');

  var user = getSessionUser();
  var tab = window._checkInTab || 'queue';

  var html = '<div class="pe-container">';
  html += '<div class="pe-tabs">';
  html += '<button class="pe-tab' + (tab === 'queue' ? ' active' : '') + '" data-tab="queue">Review Queue</button>';
  html += '<button class="pe-tab' + (tab === 'builder' ? ' active' : '') + '" data-tab="builder">Questionnaire Builder</button>';
  html += '<button class="pe-tab' + (tab === 'templates' ? ' active' : '') + '" data-tab="templates">Templates</button>';
  html += '</div>';
  html += '<div id="check-in-content"></div>';
  html += '</div>';

  app.innerHTML = html;

  app.querySelectorAll('.pe-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._checkInTab = btn.dataset.tab;
      renderCheckIn();
    });
  });

  if (tab === 'queue') renderCheckInQueue();
  else if (tab === 'builder') renderQuestionnaireBuilder();
  else if (tab === 'templates') renderQuestionnaireTemplates();
}

function renderCheckInQueue() {
  var container = document.getElementById('check-in-content');
  var records = getCheckInRecords().sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header">';
  html += '<h3>Completed Check-Ins for Review</h3>';
  html += '</div>';

  var completed = records.filter(function(r) { return r.status === 'Completed'; });
  var inProgress = records.filter(function(r) { return r.status === 'In Progress'; });

  if (completed.length === 0 && inProgress.length === 0) {
    html += '<p class="text-muted" style="padding:20px">No check-in submissions yet.</p>';
  } else {
    if (completed.length > 0) {
      html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Appointment</th><th>Questionnaire</th><th>Status</th><th>Completed</th><th>Actions</th></tr></thead><tbody>';
      completed.forEach(function(rec) {
        var pat = getPatient(rec.patientId);
        var apt = getAppointments().find(function(a) { return a.id === rec.appointmentId; });
        var q = getQuestionnaire(rec.questionnaireId) || BUILTIN_QUESTIONNAIRES.find(function(b) { return b.id === rec.questionnaireId; });
        html += '<tr>';
        html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
        html += '<td>' + (apt ? formatDateTime(apt.dateTime) : 'N/A') + '</td>';
        html += '<td>' + (q ? esc(q.title) : 'Unknown') + '</td>';
        html += '<td><span class="pe-badge pe-badge-success">Completed</span></td>';
        html += '<td>' + formatDateTime(rec.completedAt) + '</td>';
        html += '<td><button class="btn btn-primary btn-sm checkin-review-btn" data-id="' + esc(rec.id) + '">Review</button></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }

    if (inProgress.length > 0) {
      html += '<h4 style="margin-top:20px">In Progress</h4>';
      html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Appointment</th><th>Questionnaire</th><th>Status</th><th>Started</th></tr></thead><tbody>';
      inProgress.forEach(function(rec) {
        var pat = getPatient(rec.patientId);
        var apt = getAppointments().find(function(a) { return a.id === rec.appointmentId; });
        var q = getQuestionnaire(rec.questionnaireId) || BUILTIN_QUESTIONNAIRES.find(function(b) { return b.id === rec.questionnaireId; });
        html += '<tr>';
        html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
        html += '<td>' + (apt ? formatDateTime(apt.dateTime) : 'N/A') + '</td>';
        html += '<td>' + (q ? esc(q.title) : 'Unknown') + '</td>';
        html += '<td><span class="pe-badge pe-badge-warning">In Progress</span></td>';
        html += '<td>' + formatDateTime(rec.startedAt) + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
  }
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.checkin-review-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openCheckInReviewModal(btn.dataset.id);
    });
  });
}

function openCheckInReviewModal(recordId) {
  var rec = getCheckInRecord(recordId);
  if (!rec) return;
  var pat = getPatient(rec.patientId);
  var q = getQuestionnaire(rec.questionnaireId) || BUILTIN_QUESTIONNAIRES.find(function(b) { return b.id === rec.questionnaireId; });

  var body = '<div class="pe-review">';
  body += '<p><strong>Patient:</strong> ' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</p>';
  body += '<p><strong>Questionnaire:</strong> ' + (q ? esc(q.title) : 'Unknown') + '</p>';
  body += '<p><strong>Completed:</strong> ' + formatDateTime(rec.completedAt) + '</p>';

  if (rec.demographicsConfirmed) body += '<p class="pe-confirmed">Demographics confirmed by patient</p>';
  if (rec.insuranceConfirmed) body += '<p class="pe-confirmed">Insurance confirmed by patient</p>';

  body += '<hr>';
  body += '<h4>Responses</h4>';

  if (q && q.fields) {
    q.fields.forEach(function(field) {
      var answer = rec.answers[field.id];
      body += '<div class="pe-review-field">';
      body += '<label>' + esc(field.label) + '</label>';
      if (field.type === 'checkbox') {
        body += '<span>' + (answer ? 'Yes' : 'No') + '</span>';
      } else if (field.type === 'scale') {
        body += '<span>' + (answer !== undefined ? answer + ' / ' + (field.max || 10) : 'Not answered') + '</span>';
      } else {
        body += '<span>' + esc(answer || 'Not answered') + '</span>';
      }
      body += '</div>';
    });
  }
  body += '</div>';

  openModal({
    title: 'Check-In Review',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>'
  });
}

/* ---------- Questionnaire Builder ---------- */
function renderQuestionnaireBuilder(editId) {
  var container = document.getElementById('check-in-content');
  var existing = editId ? getQuestionnaire(editId) : null;

  var html = '<div class="pe-section">';
  html += '<h3>' + (existing ? 'Edit Questionnaire' : 'Create New Questionnaire') + '</h3>';
  html += '<div class="form-group"><label>Title *</label><input type="text" id="q-title" class="form-control" value="' + esc(existing ? existing.title : '') + '" /></div>';
  html += '<div class="form-group"><label>Description</label><input type="text" id="q-desc" class="form-control" value="' + esc(existing ? existing.description : '') + '" /></div>';
  html += '<h4>Fields</h4>';
  html += '<div id="q-fields-list"></div>';
  html += '<button class="btn btn-secondary btn-sm" id="q-add-field" style="margin-top:8px">+ Add Field</button>';
  html += '<div style="margin-top:16px;display:flex;gap:8px">';
  html += '<button class="btn btn-primary" id="q-save">Save Questionnaire</button>';
  html += '<button class="btn btn-secondary" id="q-cancel">Cancel</button>';
  html += '</div>';
  html += '</div>';

  container.innerHTML = html;

  var fields = existing ? JSON.parse(JSON.stringify(existing.fields)) : [];
  renderQBuilderFields(fields);

  document.getElementById('q-add-field').addEventListener('click', function() {
    fields.push({ id: 'field_' + Date.now(), type: 'text', label: '', required: false, options: [] });
    renderQBuilderFields(fields);
  });

  document.getElementById('q-save').addEventListener('click', function() {
    var title = document.getElementById('q-title').value.trim();
    if (!title) { showToast('Title is required', 'error'); return; }
    syncQBuilderFields(fields);
    var validFields = fields.filter(function(f) { return f.label.trim() !== ''; });
    if (validFields.length === 0) { showToast('Add at least one field', 'error'); return; }
    var user = getSessionUser();
    saveQuestionnaire({
      id: existing ? existing.id : undefined,
      title: title,
      description: document.getElementById('q-desc').value.trim(),
      fields: validFields,
      createdBy: user ? user.id : ''
    });
    showToast('Questionnaire saved', 'success');
    window._checkInTab = 'templates';
    renderCheckIn();
  });

  document.getElementById('q-cancel').addEventListener('click', function() {
    window._checkInTab = 'templates';
    renderCheckIn();
  });
}

function renderQBuilderFields(fields) {
  var list = document.getElementById('q-fields-list');
  if (!list) return;
  var html = '';
  fields.forEach(function(f, i) {
    html += '<div class="pe-builder-field" data-idx="' + i + '">';
    html += '<div class="pe-builder-field-row">';
    html += '<input type="text" class="form-control q-field-label" placeholder="Field label" value="' + esc(f.label) + '" />';
    html += '<select class="form-control q-field-type">';
    ['text', 'select', 'checkbox', 'scale'].forEach(function(t) {
      html += '<option value="' + t + '"' + (f.type === t ? ' selected' : '') + '>' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>';
    });
    html += '</select>';
    html += '<label class="pe-builder-req"><input type="checkbox" class="q-field-req"' + (f.required ? ' checked' : '') + ' /> Required</label>';
    html += '<button class="btn btn-danger btn-sm q-field-remove">X</button>';
    html += '</div>';
    if (f.type === 'select') {
      html += '<div class="pe-builder-options"><input type="text" class="form-control q-field-options" placeholder="Options (comma separated)" value="' + esc((f.options || []).join(', ')) + '" /></div>';
    }
    html += '</div>';
  });
  list.innerHTML = html;

  list.querySelectorAll('.q-field-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(btn.closest('.pe-builder-field').dataset.idx);
      fields.splice(idx, 1);
      renderQBuilderFields(fields);
    });
  });

  list.querySelectorAll('.q-field-type').forEach(function(sel) {
    sel.addEventListener('change', function() {
      syncQBuilderFields(fields);
      renderQBuilderFields(fields);
    });
  });
}

function syncQBuilderFields(fields) {
  var list = document.getElementById('q-fields-list');
  if (!list) return;
  list.querySelectorAll('.pe-builder-field').forEach(function(el, i) {
    if (!fields[i]) return;
    fields[i].label = el.querySelector('.q-field-label').value;
    fields[i].type = el.querySelector('.q-field-type').value;
    fields[i].required = el.querySelector('.q-field-req').checked;
    var optInput = el.querySelector('.q-field-options');
    if (optInput) {
      fields[i].options = optInput.value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    }
  });
}

/* ---------- Templates List ---------- */
function renderQuestionnaireTemplates() {
  var container = document.getElementById('check-in-content');
  var custom = getQuestionnaires();
  var all = BUILTIN_QUESTIONNAIRES.concat(custom);

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header">';
  html += '<h3>Questionnaire Templates</h3>';
  html += '<button class="btn btn-primary btn-sm" id="q-create-new">+ New Questionnaire</button>';
  html += '</div>';
  html += '<table class="pe-table"><thead><tr><th>Title</th><th>Description</th><th>Fields</th><th>Type</th><th>Actions</th></tr></thead><tbody>';

  all.forEach(function(q) {
    html += '<tr>';
    html += '<td><strong>' + esc(q.title) + '</strong></td>';
    html += '<td>' + esc(q.description || '') + '</td>';
    html += '<td>' + (q.fields ? q.fields.length : 0) + '</td>';
    html += '<td>' + (q.builtIn ? '<span class="pe-badge pe-badge-info">Built-in</span>' : '<span class="pe-badge">Custom</span>') + '</td>';
    html += '<td>';
    if (!q.builtIn) {
      html += '<button class="btn btn-secondary btn-sm q-edit-btn" data-id="' + esc(q.id) + '">Edit</button> ';
      html += '<button class="btn btn-danger btn-sm q-delete-btn" data-id="' + esc(q.id) + '">Delete</button>';
    }
    html += '</td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;

  document.getElementById('q-create-new').addEventListener('click', function() {
    renderQuestionnaireBuilder();
  });

  container.querySelectorAll('.q-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      renderQuestionnaireBuilder(btn.dataset.id);
    });
  });

  container.querySelectorAll('.q-delete-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deleteQuestionnaire(btn.dataset.id);
      showToast('Questionnaire deleted', 'success');
      renderQuestionnaireTemplates();
    });
  });
}

/* ---------- Portal: Patient Check-In Flow ---------- */
function renderPortalCheckIn(container, patient) {
  var appointments = typeof getAppointmentsByPatient === 'function' ? getAppointmentsByPatient(patient.id) : [];
  var upcoming = appointments.filter(function(a) {
    return new Date(a.dateTime) > new Date() && a.status !== 'Cancelled';
  }).sort(function(a, b) { return new Date(a.dateTime) - new Date(b.dateTime); });

  var step = window._checkInStep || 'select';
  var selectedAppt = window._checkInApptId ? upcoming.find(function(a) { return a.id === window._checkInApptId; }) : null;

  var html = '<div class="portal-card">';
  html += '<h3>Online Check-In</h3>';

  if (step === 'select') {
    html += '<p>Select an upcoming appointment to check in:</p>';
    if (upcoming.length === 0) {
      html += '<p class="text-muted">No upcoming appointments found.</p>';
    } else {
      upcoming.forEach(function(apt) {
        var existing = getCheckInByAppointment(apt.id);
        var provider = getProvider(apt.providerId);
        var provName = provider ? provider.firstName + ' ' + provider.lastName : 'Provider';
        html += '<div class="pe-appt-card">';
        html += '<div><strong>' + formatDateTime(apt.dateTime) + '</strong></div>';
        html += '<div class="text-muted text-sm">' + esc(apt.visitType || 'Appointment') + ' with ' + esc(provName) + '</div>';
        if (existing && existing.status === 'Completed') {
          html += '<span class="pe-badge pe-badge-success">Check-In Complete</span>';
        } else {
          html += '<button class="btn btn-primary btn-sm portal-checkin-start" data-id="' + esc(apt.id) + '">Start Check-In</button>';
        }
        html += '</div>';
      });
    }
  } else if (step === 'questionnaire' && selectedAppt) {
    html += renderCheckInQuestionnaireStep(patient, selectedAppt);
  } else if (step === 'demographics' && selectedAppt) {
    html += renderCheckInDemographicsStep(patient);
  } else if (step === 'insurance' && selectedAppt) {
    html += renderCheckInInsuranceStep(patient);
  } else if (step === 'done') {
    html += '<div class="pe-success-banner">';
    html += '<h4>Check-In Complete!</h4>';
    html += '<p>Thank you for completing your check-in. Your provider will review your responses before your visit.</p>';
    html += '</div>';
    html += '<button class="btn btn-secondary portal-checkin-done">Back to Appointments</button>';
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.portal-checkin-start').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._checkInApptId = btn.dataset.id;
      window._checkInStep = 'questionnaire';
      /* Init record */
      var existing = getCheckInByAppointment(btn.dataset.id);
      if (!existing) {
        var q = BUILTIN_QUESTIONNAIRES[1]; /* Pre-Visit Update */
        saveCheckInRecord({
          appointmentId: btn.dataset.id,
          patientId: patient.id,
          questionnaireId: q.id,
          status: 'In Progress',
          startedAt: new Date().toISOString()
        });
      }
      renderPatientPortal();
    });
  });

  var doneBtn = container.querySelector('.portal-checkin-done');
  if (doneBtn) {
    doneBtn.addEventListener('click', function() {
      window._checkInStep = 'select';
      window._checkInApptId = null;
      _portalTab = 'appointments';
      renderPatientPortal();
    });
  }

  setupCheckInFormHandlers(container, patient, selectedAppt);
}

function renderCheckInQuestionnaireStep(patient, appt) {
  var rec = getCheckInByAppointment(appt.id);
  var q = rec ? (getQuestionnaire(rec.questionnaireId) || BUILTIN_QUESTIONNAIRES.find(function(b) { return b.id === rec.questionnaireId; })) : BUILTIN_QUESTIONNAIRES[1];

  var html = '<h4>' + esc(q.title) + '</h4>';
  html += '<p class="text-muted">' + esc(q.description || '') + '</p>';

  if (q.fields) {
    q.fields.forEach(function(field) {
      var val = rec && rec.answers ? (rec.answers[field.id] || '') : '';
      html += '<div class="form-group">';
      html += '<label>' + esc(field.label) + (field.required ? ' *' : '') + '</label>';
      if (field.type === 'text') {
        html += '<input type="text" class="form-control checkin-field" data-field="' + esc(field.id) + '" value="' + esc(val) + '" />';
      } else if (field.type === 'select') {
        html += '<select class="form-control checkin-field" data-field="' + esc(field.id) + '">';
        html += '<option value="">Select...</option>';
        (field.options || []).forEach(function(opt) {
          html += '<option value="' + esc(opt) + '"' + (val === opt ? ' selected' : '') + '>' + esc(opt) + '</option>';
        });
        html += '</select>';
      } else if (field.type === 'checkbox') {
        html += '<label class="pe-checkbox-label"><input type="checkbox" class="checkin-field" data-field="' + esc(field.id) + '"' + (val ? ' checked' : '') + ' /> Yes</label>';
      } else if (field.type === 'scale') {
        html += '<input type="range" class="form-control checkin-field" data-field="' + esc(field.id) + '" min="' + (field.min || 0) + '" max="' + (field.max || 10) + '" value="' + (val || field.min || 0) + '" />';
        html += '<span class="checkin-scale-val">' + (val || field.min || 0) + ' / ' + (field.max || 10) + '</span>';
      }
      html += '</div>';
    });
  }

  html += '<div style="display:flex;gap:8px;margin-top:16px">';
  html += '<button class="btn btn-primary checkin-next-demo">Next: Confirm Demographics</button>';
  html += '<button class="btn btn-secondary checkin-back-select">Back</button>';
  html += '</div>';
  return html;
}

function renderCheckInDemographicsStep(patient) {
  var html = '<h4>Confirm Your Demographics</h4>';
  html += '<p class="text-muted">Please verify the following information is correct:</p>';
  html += '<div class="pe-demo-confirm">';
  html += '<p><strong>Name:</strong> ' + esc(patient.firstName + ' ' + patient.lastName) + '</p>';
  html += '<p><strong>Date of Birth:</strong> ' + esc(patient.dob || 'N/A') + '</p>';
  html += '<p><strong>Phone:</strong> ' + esc(patient.phone || 'N/A') + '</p>';
  html += '<p><strong>Email:</strong> ' + esc(patient.email || 'N/A') + '</p>';
  html += '<p><strong>Address:</strong> ' + esc([patient.addressStreet, patient.addressCity, patient.addressState, patient.addressZip].filter(Boolean).join(', ') || 'N/A') + '</p>';
  html += '</div>';
  html += '<label class="pe-checkbox-label"><input type="checkbox" id="demo-confirm-check" /> I confirm this information is correct</label>';
  html += '<div style="display:flex;gap:8px;margin-top:16px">';
  html += '<button class="btn btn-primary checkin-next-insurance" disabled>Next: Confirm Insurance</button>';
  html += '<button class="btn btn-secondary checkin-back-quest">Back</button>';
  html += '</div>';
  return html;
}

function renderCheckInInsuranceStep(patient) {
  var html = '<h4>Confirm Your Insurance</h4>';
  html += '<div class="pe-demo-confirm">';
  html += '<p><strong>Insurance:</strong> ' + esc(patient.insurance || 'N/A') + '</p>';
  html += '</div>';
  html += '<label class="pe-checkbox-label"><input type="checkbox" id="ins-confirm-check" /> I confirm my insurance information is current</label>';
  html += '<div style="display:flex;gap:8px;margin-top:16px">';
  html += '<button class="btn btn-primary checkin-complete" disabled>Complete Check-In</button>';
  html += '<button class="btn btn-secondary checkin-back-demo">Back</button>';
  html += '</div>';
  return html;
}

function setupCheckInFormHandlers(container, patient, appt) {
  /* Scale display updates */
  container.querySelectorAll('input[type=range].checkin-field').forEach(function(input) {
    input.addEventListener('input', function() {
      var span = input.parentElement.querySelector('.checkin-scale-val');
      if (span) span.textContent = input.value + ' / ' + input.max;
    });
  });

  /* Back buttons */
  var backSelect = container.querySelector('.checkin-back-select');
  if (backSelect) {
    backSelect.addEventListener('click', function() {
      window._checkInStep = 'select';
      renderPatientPortal();
    });
  }
  var backQuest = container.querySelector('.checkin-back-quest');
  if (backQuest) {
    backQuest.addEventListener('click', function() {
      window._checkInStep = 'questionnaire';
      renderPatientPortal();
    });
  }
  var backDemo = container.querySelector('.checkin-back-demo');
  if (backDemo) {
    backDemo.addEventListener('click', function() {
      window._checkInStep = 'demographics';
      renderPatientPortal();
    });
  }

  /* Next: demographics */
  var nextDemo = container.querySelector('.checkin-next-demo');
  if (nextDemo && appt) {
    nextDemo.addEventListener('click', function() {
      var rec = getCheckInByAppointment(appt.id);
      if (!rec) return;
      var answers = {};
      container.querySelectorAll('.checkin-field').forEach(function(el) {
        var fid = el.dataset.field;
        if (el.type === 'checkbox') answers[fid] = el.checked;
        else answers[fid] = el.value;
      });
      saveCheckInRecord({ id: rec.id, answers: answers });
      window._checkInStep = 'demographics';
      renderPatientPortal();
    });
  }

  /* Demographics confirm checkbox */
  var demoCheck = container.querySelector('#demo-confirm-check');
  var nextIns = container.querySelector('.checkin-next-insurance');
  if (demoCheck && nextIns) {
    demoCheck.addEventListener('change', function() {
      nextIns.disabled = !demoCheck.checked;
    });
    nextIns.addEventListener('click', function() {
      if (!appt) return;
      var rec = getCheckInByAppointment(appt.id);
      if (rec) saveCheckInRecord({ id: rec.id, demographicsConfirmed: true });
      window._checkInStep = 'insurance';
      renderPatientPortal();
    });
  }

  /* Insurance confirm */
  var insCheck = container.querySelector('#ins-confirm-check');
  var completeBtn = container.querySelector('.checkin-complete');
  if (insCheck && completeBtn) {
    insCheck.addEventListener('change', function() {
      completeBtn.disabled = !insCheck.checked;
    });
    completeBtn.addEventListener('click', function() {
      if (!appt) return;
      var rec = getCheckInByAppointment(appt.id);
      if (rec) {
        saveCheckInRecord({
          id: rec.id,
          insuranceConfirmed: true,
          status: 'Completed',
          completedAt: new Date().toISOString()
        });
      }
      window._checkInStep = 'done';
      renderPatientPortal();
    });
  }
}
