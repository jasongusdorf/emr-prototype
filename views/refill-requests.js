/* ============================================================
   views/refill-requests.js — Prescription Refill Requests
   ============================================================ */

var REFILL_STATUSES = ['Requested', 'Under Review', 'Approved', 'Denied', 'Sent to Pharmacy'];

/* ---------- Provider View ---------- */
function renderRefillRequests() {
  var app = document.getElementById('app');
  setTopbar({ title: 'Refill Requests', meta: 'Review and process prescription refill requests' });
  setActiveNav('refill-requests');

  var tab = window._refillTab || 'queue';

  var html = '<div class="pe-container">';
  html += '<div class="pe-tabs">';
  html += '<button class="pe-tab' + (tab === 'queue' ? ' active' : '') + '" data-tab="queue">Request Queue</button>';
  html += '<button class="pe-tab' + (tab === 'history' ? ' active' : '') + '" data-tab="history">History</button>';
  html += '</div>';
  html += '<div id="refill-content"></div>';
  html += '</div>';

  app.innerHTML = html;

  app.querySelectorAll('.pe-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._refillTab = btn.dataset.tab;
      renderRefillRequests();
    });
  });

  if (tab === 'queue') renderRefillQueue();
  else if (tab === 'history') renderRefillHistory();
}

function renderRefillQueue() {
  var container = document.getElementById('refill-content');
  var requests = getRefillRequests().filter(function(r) {
    return r.status === 'Requested' || r.status === 'Under Review';
  }).sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header"><h3>Pending Refill Requests (' + requests.length + ')</h3></div>';

  if (requests.length === 0) {
    html += '<p class="text-muted" style="padding:20px">No pending refill requests.</p>';
  } else {
    html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Medication</th><th>Dose</th><th>Frequency</th><th>Last Fill</th><th>Refills Left</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    requests.forEach(function(r) {
      var pat = getPatient(r.patientId);
      html += '<tr>';
      html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
      html += '<td><strong>' + esc(r.medicationName) + '</strong></td>';
      html += '<td>' + esc(r.dose || 'N/A') + '</td>';
      html += '<td>' + esc(r.frequency || 'N/A') + '</td>';
      html += '<td>' + (r.lastFillDate ? formatDateTime(r.lastFillDate) : 'N/A') + '</td>';
      html += '<td>' + (r.remainingRefills !== undefined ? r.remainingRefills : 'N/A') + '</td>';
      html += '<td><span class="pe-badge pe-badge-warning">' + esc(r.status) + '</span></td>';
      html += '<td class="pe-actions-cell">';
      html += '<button class="btn btn-success btn-sm refill-approve-btn" data-id="' + esc(r.id) + '">Approve</button> ';
      html += '<button class="btn btn-danger btn-sm refill-deny-btn" data-id="' + esc(r.id) + '">Deny</button> ';
      html += '<button class="btn btn-secondary btn-sm refill-modify-btn" data-id="' + esc(r.id) + '">Modify</button>';
      html += '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.refill-approve-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { approveRefill(btn.dataset.id); });
  });
  container.querySelectorAll('.refill-deny-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openDenyRefillModal(btn.dataset.id); });
  });
  container.querySelectorAll('.refill-modify-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openModifyRefillModal(btn.dataset.id); });
  });
}

function approveRefill(requestId) {
  var r = getRefillRequest(requestId);
  if (!r) return;
  var user = getSessionUser();

  saveRefillRequest({
    id: r.id,
    status: 'Approved',
    reviewedBy: user ? user.id : '',
    reviewedAt: new Date().toISOString()
  });

  /* Auto-create a new prescription order if possible */
  var pat = getPatient(r.patientId);
  var encounters = getEncounters().filter(function(e) {
    return e.patientId === r.patientId && e.status === 'Open';
  });
  if (encounters.length > 0) {
    saveOrder({
      encounterId: encounters[0].id,
      patientId: r.patientId,
      orderedBy: user ? user.id : '',
      type: 'Medication',
      priority: 'Routine',
      status: 'Active',
      detail: {
        drug: r.medicationName,
        dose: r.modifiedDose || r.dose,
        frequency: r.frequency,
        refill: true
      }
    });
  }

  /* Simulate send to pharmacy */
  setTimeout(function() {
    saveRefillRequest({
      id: r.id,
      status: 'Sent to Pharmacy',
      sentToPharmacyAt: new Date().toISOString()
    });
  }, 500);

  showToast('Refill approved and sent to pharmacy', 'success');
  renderRefillQueue();
}

function openDenyRefillModal(requestId) {
  var body = '<div class="form-group">';
  body += '<label>Reason for Denial *</label>';
  body += '<select class="form-control" id="deny-reason-select">';
  body += '<option value="">Select reason...</option>';
  body += '<option value="Too early for refill">Too early for refill</option>';
  body += '<option value="Need appointment first">Need appointment first</option>';
  body += '<option value="Medication discontinued">Medication discontinued</option>';
  body += '<option value="No remaining refills">No remaining refills</option>';
  body += '<option value="Clinical concern">Clinical concern</option>';
  body += '<option value="Other">Other</option>';
  body += '</select>';
  body += '</div>';
  body += '<div class="form-group">';
  body += '<label>Additional Notes</label>';
  body += '<textarea class="form-control" id="deny-notes" rows="3" placeholder="Optional notes..."></textarea>';
  body += '</div>';

  openModal({
    title: 'Deny Refill Request',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" id="deny-confirm-btn">Deny Request</button>'
  });

  document.getElementById('deny-confirm-btn').addEventListener('click', function() {
    var reason = document.getElementById('deny-reason-select').value;
    var notes = document.getElementById('deny-notes').value.trim();
    if (!reason) { showToast('Please select a reason', 'error'); return; }
    var user = getSessionUser();
    saveRefillRequest({
      id: requestId,
      status: 'Denied',
      denialReason: reason + (notes ? ' — ' + notes : ''),
      reviewedBy: user ? user.id : '',
      reviewedAt: new Date().toISOString()
    });
    closeModal();
    showToast('Refill denied', 'warning');
    renderRefillQueue();
  });
}

function openModifyRefillModal(requestId) {
  var r = getRefillRequest(requestId);
  if (!r) return;

  var body = '<div class="pe-modify-form">';
  body += '<p><strong>Current:</strong> ' + esc(r.medicationName) + ' ' + esc(r.dose || '') + ' ' + esc(r.frequency || '') + '</p>';
  body += '<div class="form-group"><label>New Dose</label><input type="text" class="form-control" id="modify-dose" value="' + esc(r.dose || '') + '" /></div>';
  body += '<div class="form-group"><label>New Quantity</label><input type="text" class="form-control" id="modify-qty" value="" placeholder="e.g., 30, 60, 90" /></div>';
  body += '</div>';

  openModal({
    title: 'Modify Refill: ' + r.medicationName,
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="modify-confirm-btn">Approve with Modifications</button>'
  });

  document.getElementById('modify-confirm-btn').addEventListener('click', function() {
    var dose = document.getElementById('modify-dose').value.trim();
    var qty = document.getElementById('modify-qty').value.trim();
    var user = getSessionUser();
    saveRefillRequest({
      id: requestId,
      status: 'Approved',
      modifiedDose: dose,
      modifiedQuantity: qty,
      reviewedBy: user ? user.id : '',
      reviewedAt: new Date().toISOString()
    });

    /* Auto-create order */
    var pat = getPatient(r.patientId);
    var encounters = getEncounters().filter(function(e) {
      return e.patientId === r.patientId && e.status === 'Open';
    });
    if (encounters.length > 0) {
      saveOrder({
        encounterId: encounters[0].id,
        patientId: r.patientId,
        orderedBy: user ? user.id : '',
        type: 'Medication',
        priority: 'Routine',
        status: 'Active',
        detail: {
          drug: r.medicationName,
          dose: dose || r.dose,
          quantity: qty,
          frequency: r.frequency,
          refill: true,
          modified: true
        }
      });
    }

    setTimeout(function() {
      saveRefillRequest({
        id: requestId,
        status: 'Sent to Pharmacy',
        sentToPharmacyAt: new Date().toISOString()
      });
    }, 500);

    closeModal();
    showToast('Refill approved with modifications', 'success');
    renderRefillQueue();
  });
}

function renderRefillHistory() {
  var container = document.getElementById('refill-content');
  var requests = getRefillRequests().sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header"><h3>All Refill Requests</h3></div>';

  if (requests.length === 0) {
    html += '<p class="text-muted" style="padding:20px">No refill request history.</p>';
  } else {
    html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Medication</th><th>Dose</th><th>Requested</th><th>Status</th><th>Reviewed By</th><th>Notes</th></tr></thead><tbody>';
    requests.forEach(function(r) {
      var pat = getPatient(r.patientId);
      var reviewer = r.reviewedBy ? getProvider(r.reviewedBy) : null;
      var statusClass = r.status === 'Approved' || r.status === 'Sent to Pharmacy' ? 'success' : r.status === 'Denied' ? 'danger' : 'warning';
      html += '<tr>';
      html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
      html += '<td>' + esc(r.medicationName) + '</td>';
      html += '<td>' + esc(r.modifiedDose || r.dose || 'N/A') + '</td>';
      html += '<td>' + formatDateTime(r.createdAt) + '</td>';
      html += '<td><span class="pe-badge pe-badge-' + statusClass + '">' + esc(r.status) + '</span></td>';
      html += '<td>' + (reviewer ? esc(reviewer.firstName + ' ' + reviewer.lastName) : 'N/A') + '</td>';
      html += '<td>' + esc(r.denialReason || (r.modifiedQuantity ? 'Modified qty: ' + r.modifiedQuantity : '')) + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  container.innerHTML = html;
}

/* ---------- Portal: Patient Request Refill ---------- */
function renderPortalRefills(container, patient) {
  var meds = typeof getPatientMedications === 'function' ? getPatientMedications(patient.id).filter(function(m) { return m.status === 'Current' || m.status === 'Active'; }) : [];
  var myRequests = getRefillsByPatient(patient.id).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  var html = '<div class="portal-card">';
  html += '<h3>Prescription Refill Requests</h3>';

  /* Active medications */
  if (meds.length > 0) {
    html += '<h4>Request a Refill</h4>';
    html += '<p class="text-muted text-sm">Select a medication to request a refill:</p>';
    meds.forEach(function(m) {
      var hasPending = myRequests.find(function(r) {
        return r.medicationId === m.id && (r.status === 'Requested' || r.status === 'Under Review');
      });
      html += '<div class="pe-med-refill-card">';
      html += '<div>';
      html += '<strong>' + esc(m.name || m.drug || '') + '</strong>';
      if (m.dose) html += ' ' + esc(m.dose) + (m.unit ? ' ' + esc(m.unit) : '');
      if (m.frequency) html += ' — ' + esc(m.frequency);
      html += '</div>';
      if (hasPending) {
        html += '<span class="pe-badge pe-badge-warning">Request Pending</span>';
      } else {
        html += '<button class="btn btn-primary btn-sm portal-request-refill" data-medid="' + esc(m.id) + '" data-name="' + esc(m.name || m.drug || '') + '" data-dose="' + esc((m.dose || '') + (m.unit ? ' ' + m.unit : '')) + '" data-freq="' + esc(m.frequency || '') + '">Request Refill</button>';
      }
      html += '</div>';
    });
  } else {
    html += '<p class="text-muted">No active medications found.</p>';
  }

  /* Request history */
  if (myRequests.length > 0) {
    html += '<h4 style="margin-top:20px">My Requests</h4>';
    myRequests.forEach(function(r) {
      var statusClass = r.status === 'Approved' || r.status === 'Sent to Pharmacy' ? 'success' : r.status === 'Denied' ? 'danger' : 'warning';
      html += '<div class="pe-refill-status-card">';
      html += '<div><strong>' + esc(r.medicationName) + '</strong> ' + esc(r.dose || '') + '</div>';
      html += '<div class="text-sm text-muted">Requested: ' + formatDateTime(r.createdAt) + '</div>';
      html += '<span class="pe-badge pe-badge-' + statusClass + '">' + esc(r.status) + '</span>';
      if (r.status === 'Denied' && r.denialReason) {
        html += '<div class="text-sm" style="color:var(--danger,#dc3545);margin-top:4px">Reason: ' + esc(r.denialReason) + '</div>';
      }
      if (r.status === 'Approved' && r.modifiedDose) {
        html += '<div class="text-sm" style="color:var(--success,#22c55e);margin-top:4px">Modified dose: ' + esc(r.modifiedDose) + '</div>';
      }
      if (r.sentToPharmacyAt) {
        html += '<div class="text-sm" style="color:var(--success,#22c55e);margin-top:4px">Sent to pharmacy: ' + formatDateTime(r.sentToPharmacyAt) + '</div>';
      }
      html += '</div>';
    });
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.portal-request-refill').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var pat = getPatient(patient.id);
      saveRefillRequest({
        patientId: patient.id,
        medicationId: btn.dataset.medid,
        medicationName: btn.dataset.name,
        dose: btn.dataset.dose,
        frequency: btn.dataset.freq,
        pharmacyName: pat ? pat.pharmacyName || '' : '',
        status: 'Requested'
      });
      showToast('Refill request submitted', 'success');
      renderPatientPortal();
    });
  });
}
