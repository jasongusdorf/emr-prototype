/* ============================================================
   views/e-visits.js — E-Visits (Async Virtual Visits)
   ============================================================ */

/* ---------- E-Visit Templates ---------- */
var EVISIT_TEMPLATES = {
  'UTI': {
    name: 'Urinary Tract Infection (UTI)',
    emCode: '99421',
    questions: [
      { id: 'onset', label: 'When did symptoms start?', type: 'text', required: true },
      { id: 'burning', label: 'Do you have burning with urination?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'frequency', label: 'Are you urinating more frequently than usual?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'urgency', label: 'Do you feel urgent need to urinate?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'blood', label: 'Have you noticed blood in your urine?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'fever', label: 'Do you have a fever (>100.4F)?', type: 'select', options: ['Yes', 'No', 'Not sure'], required: true },
      { id: 'flankPain', label: 'Do you have back or flank pain?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'pregnant', label: 'Are you or could you be pregnant?', type: 'select', options: ['Yes', 'No', 'N/A'], required: true },
      { id: 'priorUTI', label: 'Have you had UTIs before? If yes, how many in the past year?', type: 'text', required: false },
      { id: 'allergies', label: 'Any medication allergies?', type: 'text', required: true }
    ]
  },
  'URI': {
    name: 'Upper Respiratory Infection',
    emCode: '99421',
    questions: [
      { id: 'onset', label: 'When did symptoms start?', type: 'text', required: true },
      { id: 'symptoms', label: 'Which symptoms do you have? (Check all that apply)', type: 'text', required: true },
      { id: 'cough', label: 'Do you have a cough?', type: 'select', options: ['No', 'Dry cough', 'Productive cough'], required: true },
      { id: 'fever', label: 'Have you had a fever?', type: 'select', options: ['Yes', 'No', 'Not sure'], required: true },
      { id: 'sorethroat', label: 'Do you have a sore throat?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'congestion', label: 'Do you have nasal congestion or runny nose?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'duration', label: 'How many days have you been sick?', type: 'text', required: true },
      { id: 'worsening', label: 'Are symptoms getting worse, better, or about the same?', type: 'select', options: ['Getting worse', 'About the same', 'Getting better'], required: true },
      { id: 'breathingDifficulty', label: 'Any difficulty breathing or shortness of breath?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'allergies', label: 'Any medication allergies?', type: 'text', required: true }
    ]
  },
  'Sinusitis': {
    name: 'Sinusitis',
    emCode: '99421',
    questions: [
      { id: 'onset', label: 'When did symptoms start?', type: 'text', required: true },
      { id: 'facialPain', label: 'Do you have facial pain or pressure?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'nasalDischarge', label: 'Do you have nasal discharge? What color?', type: 'select', options: ['No', 'Clear', 'Yellow', 'Green', 'Bloody'], required: true },
      { id: 'congestion', label: 'Do you have nasal congestion?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'headache', label: 'Do you have headaches?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'toothPain', label: 'Any upper tooth pain?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'fever', label: 'Do you have a fever?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'duration', label: 'How long have symptoms been present?', type: 'text', required: true },
      { id: 'priorEpisodes', label: 'How many sinus infections have you had in the past year?', type: 'text', required: false },
      { id: 'allergies', label: 'Any medication allergies?', type: 'text', required: true }
    ]
  },
  'Pink Eye': {
    name: 'Conjunctivitis (Pink Eye)',
    emCode: '99421',
    questions: [
      { id: 'onset', label: 'When did symptoms start?', type: 'text', required: true },
      { id: 'whichEye', label: 'Which eye is affected?', type: 'select', options: ['Left', 'Right', 'Both'], required: true },
      { id: 'discharge', label: 'Is there discharge from the eye?', type: 'select', options: ['No', 'Watery', 'Mucus-like', 'Pus/Yellow-green'], required: true },
      { id: 'itching', label: 'Is the eye itchy?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'visionChange', label: 'Any changes in vision?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'pain', label: 'Is the eye painful (not just irritated)?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'contactLens', label: 'Do you wear contact lenses?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'recentIllness', label: 'Have you had a recent cold or been around someone with pink eye?', type: 'select', options: ['Yes', 'No'], required: false },
      { id: 'allergies', label: 'Any medication allergies?', type: 'text', required: true }
    ]
  },
  'Rash': {
    name: 'Skin Rash',
    emCode: '99422',
    questions: [
      { id: 'onset', label: 'When did the rash first appear?', type: 'text', required: true },
      { id: 'location', label: 'Where on your body is the rash?', type: 'text', required: true },
      { id: 'spreading', label: 'Is it spreading?', type: 'select', options: ['Yes', 'No', 'Not sure'], required: true },
      { id: 'itchy', label: 'Is it itchy?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'painful', label: 'Is it painful?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'appearance', label: 'Describe the rash appearance', type: 'select', options: ['Red bumps', 'Flat red patches', 'Blisters', 'Dry/scaly', 'Raised welts (hives)', 'Other'], required: true },
      { id: 'newProducts', label: 'Any new soaps, detergents, medications, or foods recently?', type: 'text', required: false },
      { id: 'fever', label: 'Do you have a fever?', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'photoDesc', label: 'Please describe what the rash looks like (a photo would be attached separately if available)', type: 'text', required: false },
      { id: 'allergies', label: 'Any medication allergies?', type: 'text', required: true }
    ]
  },
  'Medication Refill': {
    name: 'Medication Refill Request',
    emCode: '99421',
    questions: [
      { id: 'medication', label: 'Which medication needs refilling?', type: 'text', required: true },
      { id: 'dose', label: 'Current dose', type: 'text', required: true },
      { id: 'lastRefill', label: 'When was your last refill?', type: 'text', required: true },
      { id: 'sideEffects', label: 'Are you experiencing any side effects?', type: 'select', options: ['No', 'Yes'], required: true },
      { id: 'sideEffectDetails', label: 'If yes, describe side effects', type: 'text', required: false },
      { id: 'effective', label: 'Is the medication working well for you?', type: 'select', options: ['Yes', 'Somewhat', 'No'], required: true },
      { id: 'changes', label: 'Any changes in your health since last visit?', type: 'text', required: false },
      { id: 'pharmacy', label: 'Preferred pharmacy', type: 'text', required: false }
    ]
  }
};

/* ---------- Provider View ---------- */
function renderEVisits() {
  var app = document.getElementById('app');
  setTopbar({ title: 'E-Visits', meta: 'Async virtual visits — review and complete' });
  setActiveNav('e-visits');

  var tab = window._evisitTab || 'pending';

  var html = '<div class="pe-container">';
  html += '<div class="pe-tabs">';
  html += '<button class="pe-tab' + (tab === 'pending' ? ' active' : '') + '" data-tab="pending">Pending Review</button>';
  html += '<button class="pe-tab' + (tab === 'completed' ? ' active' : '') + '" data-tab="completed">Completed</button>';
  html += '<button class="pe-tab' + (tab === 'templates' ? ' active' : '') + '" data-tab="templates">Templates</button>';
  html += '</div>';
  html += '<div id="evisit-content"></div>';
  html += '</div>';

  app.innerHTML = html;

  app.querySelectorAll('.pe-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._evisitTab = btn.dataset.tab;
      renderEVisits();
    });
  });

  if (tab === 'pending') renderEVisitsPending();
  else if (tab === 'completed') renderEVisitsCompleted();
  else if (tab === 'templates') renderEVisitTemplates();
}

function renderEVisitsPending() {
  var container = document.getElementById('evisit-content');
  var visits = getEVisits().filter(function(v) {
    return v.status === 'Submitted' || v.status === 'More Info Requested';
  }).sort(function(a, b) { return new Date(a.submittedAt) - new Date(b.submittedAt); });

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header"><h3>Pending E-Visits (' + visits.length + ')</h3></div>';

  if (visits.length === 0) {
    html += '<p class="text-muted" style="padding:20px">No pending e-visits to review.</p>';
  } else {
    html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Complaint</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    visits.forEach(function(v) {
      var pat = getPatient(v.patientId);
      var tmpl = EVISIT_TEMPLATES[v.templateType];
      html += '<tr>';
      html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
      html += '<td>' + (tmpl ? esc(tmpl.name) : esc(v.templateType)) + '</td>';
      html += '<td>' + formatDateTime(v.submittedAt) + '</td>';
      html += '<td><span class="pe-badge pe-badge-' + (v.status === 'More Info Requested' ? 'info' : 'warning') + '">' + esc(v.status) + '</span></td>';
      html += '<td><button class="btn btn-primary btn-sm evisit-review-btn" data-id="' + esc(v.id) + '">Review</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.evisit-review-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openEVisitReviewModal(btn.dataset.id); });
  });
}

function openEVisitReviewModal(visitId) {
  var v = getEVisit(visitId);
  if (!v) return;
  var pat = getPatient(v.patientId);
  var tmpl = EVISIT_TEMPLATES[v.templateType];

  var body = '<div class="pe-evisit-review">';
  body += '<div class="pe-evisit-header-info">';
  body += '<p><strong>Patient:</strong> ' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</p>';
  body += '<p><strong>Complaint:</strong> ' + (tmpl ? esc(tmpl.name) : esc(v.templateType)) + '</p>';
  body += '<p><strong>Submitted:</strong> ' + formatDateTime(v.submittedAt) + '</p>';
  body += '<p><strong>E&M Code:</strong> ' + esc(v.emCode || (tmpl ? tmpl.emCode : '99421')) + '</p>';
  body += '</div>';

  /* Patient responses */
  body += '<h4>Patient Responses</h4>';
  if (tmpl && v.symptoms) {
    tmpl.questions.forEach(function(q) {
      var answer = v.symptoms[q.id];
      body += '<div class="pe-review-field">';
      body += '<label>' + esc(q.label) + '</label>';
      body += '<span>' + esc(answer || 'Not answered') + '</span>';
      body += '</div>';
    });
  }

  if (v.photoDescription) {
    body += '<div class="pe-review-field">';
    body += '<label>Photo Description</label>';
    body += '<span>' + esc(v.photoDescription) + '</span>';
    body += '</div>';
  }

  if (v.moreInfoRequest) {
    body += '<div class="pe-info-box" style="border-left:3px solid var(--warning,#eab308);margin:12px 0">';
    body += '<strong>More Info Requested:</strong> ' + esc(v.moreInfoRequest);
    body += '</div>';
  }

  /* Provider assessment form */
  body += '<hr><h4>Provider Assessment</h4>';
  body += '<div class="form-group"><label>Assessment *</label>';
  body += '<textarea class="form-control" id="evisit-assessment" rows="3" placeholder="Clinical assessment...">' + esc(v.assessment || '') + '</textarea></div>';
  body += '<div class="form-group"><label>Plan *</label>';
  body += '<textarea class="form-control" id="evisit-plan" rows="3" placeholder="Treatment plan...">' + esc(v.plan || '') + '</textarea></div>';
  body += '<div class="form-group"><label>E&M Code</label>';
  body += '<select class="form-control" id="evisit-emcode">';
  ['99421', '99422', '99423'].forEach(function(code) {
    var desc = code === '99421' ? '5-10 min' : code === '99422' ? '11-20 min' : '21+ min';
    body += '<option value="' + code + '"' + ((v.emCode || (tmpl ? tmpl.emCode : '99421')) === code ? ' selected' : '') + '>' + code + ' (' + desc + ')</option>';
  });
  body += '</select></div>';
  body += '</div>';

  openModal({
    title: 'E-Visit Review',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-warning" id="evisit-moreinfo-btn">Request More Info</button>' +
      '<button class="btn btn-primary" id="evisit-complete-btn">Complete Visit</button>'
  });

  document.getElementById('evisit-moreinfo-btn').addEventListener('click', function() {
    openModal({
      title: 'Request More Information',
      bodyHTML: '<div class="form-group"><label>What additional information do you need?</label><textarea class="form-control" id="evisit-moreinfo-text" rows="3" placeholder="Please describe what else you need..."></textarea></div>',
      footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-warning" id="evisit-moreinfo-send">Send Request</button>'
    });

    document.getElementById('evisit-moreinfo-send').addEventListener('click', function() {
      var text = document.getElementById('evisit-moreinfo-text').value.trim();
      if (!text) { showToast('Please specify what info you need', 'error'); return; }
      saveEVisit({ id: v.id, status: 'More Info Requested', moreInfoRequest: text });
      closeModal();
      showToast('More info requested from patient', 'info');
      renderEVisitsPending();
    });
  });

  document.getElementById('evisit-complete-btn').addEventListener('click', function() {
    var assessment = document.getElementById('evisit-assessment').value.trim();
    var plan = document.getElementById('evisit-plan').value.trim();
    var emCode = document.getElementById('evisit-emcode').value;

    if (!assessment || !plan) { showToast('Assessment and plan are required', 'error'); return; }

    var user = getSessionUser();

    /* Auto-generate encounter note */
    var encounter = saveEncounter({
      patientId: v.patientId,
      providerId: user ? user.id : '',
      visitType: 'Outpatient',
      visitSubtype: 'E-Visit',
      dateTime: v.submittedAt,
      status: 'Signed'
    });

    /* Build HPI from symptoms */
    var hpiParts = [];
    if (tmpl && v.symptoms) {
      tmpl.questions.forEach(function(q) {
        var answer = v.symptoms[q.id];
        if (answer) hpiParts.push(q.label + ': ' + answer);
      });
    }

    if (typeof saveNote === 'function') {
      saveNote({
        id: generateId(),
        encounterId: encounter.id,
        chiefComplaint: tmpl ? tmpl.name + ' (E-Visit)' : v.templateType + ' (E-Visit)',
        hpi: 'E-Visit Questionnaire Responses:\n' + hpiParts.join('\n'),
        assessment: assessment,
        plan: plan,
        signed: true,
        signedBy: user ? user.id : '',
        signedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        addenda: []
      });
    }

    saveEVisit({
      id: v.id,
      status: 'Completed',
      assessment: assessment,
      plan: plan,
      emCode: emCode,
      encounterId: encounter.id,
      providerId: user ? user.id : '',
      completedAt: new Date().toISOString()
    });

    closeModal();
    showToast('E-Visit completed. Encounter note generated.', 'success');
    renderEVisitsPending();
  });
}

function renderEVisitsCompleted() {
  var container = document.getElementById('evisit-content');
  var visits = getEVisits().filter(function(v) { return v.status === 'Completed'; })
    .sort(function(a, b) { return new Date(b.completedAt) - new Date(a.completedAt); });

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header"><h3>Completed E-Visits</h3></div>';

  if (visits.length === 0) {
    html += '<p class="text-muted" style="padding:20px">No completed e-visits yet.</p>';
  } else {
    html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Complaint</th><th>Submitted</th><th>Completed</th><th>E&M</th><th>Provider</th></tr></thead><tbody>';
    visits.forEach(function(v) {
      var pat = getPatient(v.patientId);
      var tmpl = EVISIT_TEMPLATES[v.templateType];
      var prov = v.providerId ? getProvider(v.providerId) : null;
      html += '<tr>';
      html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
      html += '<td>' + (tmpl ? esc(tmpl.name) : esc(v.templateType)) + '</td>';
      html += '<td>' + formatDateTime(v.submittedAt) + '</td>';
      html += '<td>' + formatDateTime(v.completedAt) + '</td>';
      html += '<td>' + esc(v.emCode || '') + '</td>';
      html += '<td>' + (prov ? esc(prov.firstName + ' ' + prov.lastName) : 'N/A') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function renderEVisitTemplates() {
  var container = document.getElementById('evisit-content');
  var html = '<div class="pe-section">';
  html += '<h3>E-Visit Templates</h3>';

  Object.keys(EVISIT_TEMPLATES).forEach(function(key) {
    var tmpl = EVISIT_TEMPLATES[key];
    html += '<div class="pe-instrument-card">';
    html += '<div class="pe-instrument-header">';
    html += '<h4>' + esc(tmpl.name) + '</h4>';
    html += '<span class="pe-badge pe-badge-info">E&M: ' + esc(tmpl.emCode) + '</span>';
    html += '</div>';
    html += '<p class="text-muted">' + tmpl.questions.length + ' questions</p>';
    html += '<div class="pe-template-questions">';
    tmpl.questions.forEach(function(q, i) {
      html += '<div class="text-sm">' + (i + 1) + '. ' + esc(q.label) + (q.required ? ' *' : '') + '</div>';
    });
    html += '</div>';
    html += '</div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

/* ---------- Portal: Patient Starts E-Visit ---------- */
function renderPortalEVisits(container, patient) {
  var myVisits = getEVisitsByPatient(patient.id).sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  var activeVisit = window._activeEVisitId ? getEVisit(window._activeEVisitId) : null;

  var html = '<div class="portal-card">';
  html += '<h3>E-Visits (Virtual Visits)</h3>';

  if (activeVisit && activeVisit.status === 'More Info Requested') {
    /* Show more info request form */
    html += renderPortalEVisitMoreInfo(activeVisit);
  } else if (window._evisitStartTemplate) {
    /* Show questionnaire */
    html += renderPortalEVisitForm(patient);
  } else {
    /* Template selection */
    html += '<p class="text-muted">Start an e-visit for common complaints. A provider will review your responses and provide a treatment plan, usually within 24 hours.</p>';
    html += '<h4>Start a New E-Visit</h4>';
    html += '<div class="pe-evisit-templates-grid">';
    Object.keys(EVISIT_TEMPLATES).forEach(function(key) {
      var tmpl = EVISIT_TEMPLATES[key];
      html += '<div class="pe-evisit-template-card">';
      html += '<strong>' + esc(tmpl.name) + '</strong>';
      html += '<button class="btn btn-primary btn-sm portal-start-evisit" data-type="' + esc(key) + '" style="margin-top:8px">Start</button>';
      html += '</div>';
    });
    html += '</div>';

    /* Existing visits */
    if (myVisits.length > 0) {
      html += '<h4 style="margin-top:20px">My E-Visits</h4>';
      myVisits.forEach(function(v) {
        var tmpl = EVISIT_TEMPLATES[v.templateType];
        var statusClass = v.status === 'Completed' ? 'success' : v.status === 'More Info Requested' ? 'info' : 'warning';
        html += '<div class="pe-refill-status-card">';
        html += '<div><strong>' + (tmpl ? esc(tmpl.name) : esc(v.templateType)) + '</strong></div>';
        html += '<div class="text-sm text-muted">Submitted: ' + formatDateTime(v.submittedAt) + '</div>';
        html += '<span class="pe-badge pe-badge-' + statusClass + '">' + esc(v.status) + '</span>';
        if (v.status === 'Completed') {
          html += '<div style="margin-top:8px;padding:8px;background:var(--bg-card,#f8f9fa);border-radius:6px">';
          html += '<div><strong>Assessment:</strong> ' + esc(v.assessment || '') + '</div>';
          html += '<div><strong>Plan:</strong> ' + esc(v.plan || '') + '</div>';
          html += '</div>';
        }
        if (v.status === 'More Info Requested') {
          html += '<div style="margin-top:8px;color:var(--info,#0ea5e9)"><strong>Provider needs more information:</strong> ' + esc(v.moreInfoRequest || '') + '</div>';
          html += '<button class="btn btn-primary btn-sm portal-respond-evisit" data-id="' + esc(v.id) + '" style="margin-top:6px">Respond</button>';
        }
        html += '</div>';
      });
    }
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.portal-start-evisit').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._evisitStartTemplate = btn.dataset.type;
      renderPatientPortal();
    });
  });

  container.querySelectorAll('.portal-respond-evisit').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._activeEVisitId = btn.dataset.id;
      renderPatientPortal();
    });
  });

  setupPortalEVisitHandlers(container, patient);
}

function renderPortalEVisitForm(patient) {
  var type = window._evisitStartTemplate;
  var tmpl = EVISIT_TEMPLATES[type];
  if (!tmpl) return '<p>Template not found.</p>';

  var html = '<h4>' + esc(tmpl.name) + '</h4>';
  html += '<p class="text-muted">Please answer the following questions as completely as possible.</p>';

  tmpl.questions.forEach(function(q) {
    html += '<div class="form-group">';
    html += '<label>' + esc(q.label) + (q.required ? ' *' : '') + '</label>';
    if (q.type === 'text') {
      html += '<input type="text" class="form-control evisit-field" data-field="' + esc(q.id) + '" />';
    } else if (q.type === 'select') {
      html += '<select class="form-control evisit-field" data-field="' + esc(q.id) + '">';
      html += '<option value="">Select...</option>';
      (q.options || []).forEach(function(opt) {
        html += '<option value="' + esc(opt) + '">' + esc(opt) + '</option>';
      });
      html += '</select>';
    }
    html += '</div>';
  });

  html += '<div class="form-group"><label>Additional Notes / Photo Description</label>';
  html += '<textarea class="form-control" id="evisit-photo-desc" rows="2" placeholder="Describe any photos or additional details..."></textarea></div>';

  html += '<div style="display:flex;gap:8px;margin-top:16px">';
  html += '<button class="btn btn-primary portal-submit-evisit" style="background:#0d9488">Submit E-Visit</button>';
  html += '<button class="btn btn-secondary portal-cancel-evisit">Cancel</button>';
  html += '</div>';

  return html;
}

function renderPortalEVisitMoreInfo(visit) {
  var html = '<h4>Provider Request for More Information</h4>';
  html += '<div class="pe-info-box" style="border-left:3px solid var(--info,#0ea5e9);margin-bottom:16px">';
  html += '<strong>Provider asked:</strong> ' + esc(visit.moreInfoRequest || '');
  html += '</div>';
  html += '<div class="form-group"><label>Your Response *</label>';
  html += '<textarea class="form-control" id="evisit-moreinfo-response" rows="4" placeholder="Provide the requested information..."></textarea></div>';
  html += '<div style="display:flex;gap:8px;margin-top:16px">';
  html += '<button class="btn btn-primary portal-send-moreinfo" style="background:#0d9488">Send Response</button>';
  html += '<button class="btn btn-secondary portal-cancel-moreinfo">Back</button>';
  html += '</div>';
  return html;
}

function setupPortalEVisitHandlers(container, patient) {
  var submitBtn = container.querySelector('.portal-submit-evisit');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var type = window._evisitStartTemplate;
      var tmpl = EVISIT_TEMPLATES[type];
      if (!tmpl) return;

      var symptoms = {};
      var valid = true;
      container.querySelectorAll('.evisit-field').forEach(function(el) {
        symptoms[el.dataset.field] = el.value;
      });

      /* Validate required */
      tmpl.questions.forEach(function(q) {
        if (q.required && (!symptoms[q.id] || symptoms[q.id].trim() === '')) {
          valid = false;
        }
      });

      if (!valid) { showToast('Please answer all required questions', 'error'); return; }

      var photoDesc = document.getElementById('evisit-photo-desc');
      saveEVisit({
        patientId: patient.id,
        templateType: type,
        symptoms: symptoms,
        photoDescription: photoDesc ? photoDesc.value.trim() : '',
        emCode: tmpl.emCode,
        status: 'Submitted',
        submittedAt: new Date().toISOString()
      });

      window._evisitStartTemplate = null;
      showToast('E-Visit submitted. Your provider will respond within 24 hours.', 'success');
      renderPatientPortal();
    });
  }

  var cancelBtn = container.querySelector('.portal-cancel-evisit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      window._evisitStartTemplate = null;
      renderPatientPortal();
    });
  }

  var sendMoreInfo = container.querySelector('.portal-send-moreinfo');
  if (sendMoreInfo) {
    sendMoreInfo.addEventListener('click', function() {
      var response = document.getElementById('evisit-moreinfo-response');
      if (!response || !response.value.trim()) { showToast('Please provide a response', 'error'); return; }

      var visit = getEVisit(window._activeEVisitId);
      if (visit) {
        var updatedSymptoms = Object.assign({}, visit.symptoms);
        updatedSymptoms._additionalInfo = (updatedSymptoms._additionalInfo || '') + '\n\nPatient response: ' + response.value.trim();
        saveEVisit({
          id: visit.id,
          symptoms: updatedSymptoms,
          status: 'Submitted',
          moreInfoRequest: ''
        });
      }

      window._activeEVisitId = null;
      showToast('Response sent to provider', 'success');
      renderPatientPortal();
    });
  }

  var cancelMoreInfo = container.querySelector('.portal-cancel-moreinfo');
  if (cancelMoreInfo) {
    cancelMoreInfo.addEventListener('click', function() {
      window._activeEVisitId = null;
      renderPatientPortal();
    });
  }
}
