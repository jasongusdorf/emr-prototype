/* ============================================================
   views/prior-auth.js — Prior Authorization Management
   ============================================================ */

/* ---------- Module-level state ---------- */
let _paPage = 1;
const _paPageSize = 20;
let _paSearchTerm = '';
let _paStatusFilter = 'All';
let _paUrgencyFilter = 'All';

/* ---------- Status / Urgency badge maps ---------- */
const PA_STATUS_BADGE = {
  'Required':     'pa-badge-required',
  'Submitted':    'pa-badge-submitted',
  'Under Review': 'pa-badge-under-review',
  'Approved':     'pa-badge-approved',
  'Denied':       'pa-badge-denied',
  'Expired':      'pa-badge-expired',
};

const PA_URGENCY_BADGE = {
  'Urgent':   'pa-badge-urgent',
  'Standard': 'pa-badge-standard',
};

/* ============================================================
   renderPriorAuth — Main view
   ============================================================ */
function renderPriorAuth() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({
    title: 'Prior Authorizations',
    meta: '',
    actions: '',
  });
  setActiveNav('prior-auth');

  /* ---------- Stats bar ---------- */
  const stats = getPriorAuthStats();
  const statsBar = document.createElement('div');
  statsBar.className = 'pa-stats';

  const statItems = [
    { label: 'Total PAs',       value: stats.total,     cls: '' },
    { label: 'Action Required', value: stats.required,  cls: stats.required > 0 ? 'stat-action' : '' },
    { label: 'Submitted',       value: stats.submitted, cls: '' },
    { label: 'Approved',        value: stats.approved,  cls: '' },
    { label: 'Denied',          value: stats.denied,    cls: stats.denied > 0 ? 'pa-stat-danger' : '' },
    { label: 'Expired',         value: stats.expired,   cls: '' },
  ];

  statItems.forEach(function(s) {
    const card = document.createElement('div');
    card.className = 'pa-stat-card' + (s.cls ? ' ' + s.cls : '');
    const val = document.createElement('div');
    val.className = 'stat-value';
    val.textContent = s.value;
    const lbl = document.createElement('div');
    lbl.className = 'stat-label';
    lbl.textContent = s.label;
    card.appendChild(val);
    card.appendChild(lbl);
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  /* ---------- Toolbar ---------- */
  const toolbar = document.createElement('div');
  toolbar.className = 'pa-toolbar';

  // Search
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-control';
  searchInput.placeholder = 'Search patient, service, auth #...';
  searchInput.value = _paSearchTerm;
  searchInput.addEventListener('input', function() {
    _paSearchTerm = this.value;
    _paPage = 1;
    renderPATable(tableWrap);
  });

  // Status filter
  const statusSelect = document.createElement('select');
  statusSelect.className = 'form-control';
  ['All', 'Required', 'Submitted', 'Under Review', 'Approved', 'Denied', 'Expired'].forEach(function(s) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s === 'All' ? 'All Statuses' : s;
    if (s === _paStatusFilter) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusSelect.addEventListener('change', function() {
    _paStatusFilter = this.value;
    _paPage = 1;
    renderPATable(tableWrap);
  });

  // Urgency filter
  const urgencySelect = document.createElement('select');
  urgencySelect.className = 'form-control';
  ['All', 'Urgent', 'Standard'].forEach(function(u) {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u === 'All' ? 'All Urgencies' : u;
    if (u === _paUrgencyFilter) opt.selected = true;
    urgencySelect.appendChild(opt);
  });
  urgencySelect.addEventListener('change', function() {
    _paUrgencyFilter = this.value;
    _paPage = 1;
    renderPATable(tableWrap);
  });

  // New PA button
  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary';
  newBtn.textContent = 'New Prior Auth';
  newBtn.addEventListener('click', function() { openNewPriorAuthModal(); });

  // Manage Rules button
  const rulesBtn = document.createElement('button');
  rulesBtn.className = 'btn btn-secondary';
  rulesBtn.textContent = 'Manage Rules';
  rulesBtn.addEventListener('click', function() { openManageRulesModal(); });

  toolbar.appendChild(searchInput);
  toolbar.appendChild(statusSelect);
  toolbar.appendChild(urgencySelect);
  toolbar.appendChild(newBtn);
  toolbar.appendChild(rulesBtn);

  // Analytics button
  const analyticsBtn = document.createElement('button');
  analyticsBtn.className = 'btn btn-secondary';
  analyticsBtn.textContent = 'Analytics';
  analyticsBtn.addEventListener('click', function() { openPAAnalyticsModal(); });
  toolbar.appendChild(analyticsBtn);
  app.appendChild(toolbar);

  /* ---------- Table ---------- */
  const tableWrap = document.createElement('div');
  /* table wrapper needs no special class — pa-table handles styling */
  app.appendChild(tableWrap);
  renderPATable(tableWrap);
}

/* ---------- PA Table render ---------- */
function renderPATable(container) {
  container.innerHTML = '';

  let auths = getPriorAuths();

  // Search filter
  if (_paSearchTerm) {
    const term = _paSearchTerm.toLowerCase();
    auths = auths.filter(function(pa) {
      const patient = getPatient(pa.patientId);
      const patName = patient ? (patient.firstName + ' ' + patient.lastName).toLowerCase() : '';
      const service = (pa.requestedService || '').toLowerCase();
      const authNum = (pa.authNumber || '').toLowerCase();
      const payer = (pa.payer || '').toLowerCase();
      return patName.indexOf(term) !== -1 ||
             service.indexOf(term) !== -1 ||
             authNum.indexOf(term) !== -1 ||
             payer.indexOf(term) !== -1;
    });
  }

  // Status filter
  if (_paStatusFilter !== 'All') {
    auths = auths.filter(function(pa) { return pa.status === _paStatusFilter; });
  }

  // Urgency filter
  if (_paUrgencyFilter !== 'All') {
    auths = auths.filter(function(pa) { return pa.urgency === _paUrgencyFilter; });
  }

  // Sort by created date descending
  auths.sort(function(a, b) {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(auths.length / _paPageSize));
  if (_paPage > totalPages) _paPage = totalPages;
  const start = (_paPage - 1) * _paPageSize;
  const pageAuths = auths.slice(start, start + _paPageSize);

  if (auths.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pa-empty';
    empty.textContent = 'No prior authorizations found.';
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'pa-table';

  // Header
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Created', 'Patient', 'Service Requested', 'Status', 'Urgency', 'Payer', 'Auth Number', 'Expiration', 'Actions'].forEach(function(h) {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  pageAuths.forEach(function(pa) {
    const patient = getPatient(pa.patientId);
    const patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';

    const tr = document.createElement('tr');
    tr.className = 'clickable-row';
    tr.addEventListener('click', function(e) {
      if (e.target.closest('.pa-row-actions')) return;
      openPriorAuthDetailModal(pa.id);
    });

    // Created
    const tdCreated = document.createElement('td');
    tdCreated.textContent = pa.createdAt ? formatDateTime(pa.createdAt) : '--';
    tr.appendChild(tdCreated);

    // Patient
    const tdPatient = document.createElement('td');
    tdPatient.innerHTML = patName;
    tr.appendChild(tdPatient);

    // Service Requested
    const tdService = document.createElement('td');
    tdService.textContent = pa.requestedService || '--';
    tr.appendChild(tdService);

    // Status badge
    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge ' + (PA_STATUS_BADGE[pa.status] || '');
    statusBadge.textContent = pa.status || 'Unknown';
    tdStatus.appendChild(statusBadge);
    tr.appendChild(tdStatus);

    // Urgency badge
    const tdUrgency = document.createElement('td');
    const urgencyBadge = document.createElement('span');
    urgencyBadge.className = 'badge ' + (PA_URGENCY_BADGE[pa.urgency] || 'pa-badge-standard');
    urgencyBadge.textContent = pa.urgency || 'Standard';
    tdUrgency.appendChild(urgencyBadge);
    tr.appendChild(tdUrgency);

    // Payer
    const tdPayer = document.createElement('td');
    tdPayer.textContent = pa.payer || '--';
    tr.appendChild(tdPayer);

    // Auth Number
    const tdAuth = document.createElement('td');
    tdAuth.textContent = pa.authNumber || '--';
    tr.appendChild(tdAuth);

    // Expiration
    const tdExp = document.createElement('td');
    tdExp.textContent = pa.expirationDate ? formatDateTime(pa.expirationDate) : '--';
    tr.appendChild(tdExp);

    // Actions
    const tdActions = document.createElement('td');
    tdActions.className = 'pa-row-actions';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-secondary btn-sm';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      openPriorAuthDetailModal(pa.id);
    });

    const updateBtn = document.createElement('button');
    updateBtn.className = 'btn btn-primary btn-sm';
    updateBtn.textContent = 'Update Status';
    updateBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      openUpdateStatusModal(pa.id);
    });

    tdActions.appendChild(viewBtn);
    tdActions.appendChild(document.createTextNode(' '));
    tdActions.appendChild(updateBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  // Pagination bar
  if (totalPages > 1) {
    const pagBar = document.createElement('div');
    pagBar.className = 'pa-pagination';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary btn-sm';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = _paPage <= 1;
    prevBtn.addEventListener('click', function() {
      if (_paPage > 1) { _paPage--; renderPATable(container); }
    });

    const info = document.createElement('span');
    info.className = 'pa-pagination-text';
    info.textContent = 'Page ' + _paPage + ' of ' + totalPages + ' (' + auths.length + ' total)';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary btn-sm';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = _paPage >= totalPages;
    nextBtn.addEventListener('click', function() {
      if (_paPage < totalPages) { _paPage++; renderPATable(container); }
    });

    pagBar.appendChild(prevBtn);
    pagBar.appendChild(info);
    pagBar.appendChild(nextBtn);
    container.appendChild(pagBar);
  }
}

/* ---------- Quick status update modal ---------- */
function openUpdateStatusModal(paId) {
  const pa = getPriorAuth(paId);
  if (!pa) return;

  const statusOptions = ['Required', 'Submitted', 'Under Review', 'Approved', 'Denied', 'Expired'];

  const bodyHTML = '<div style="margin-bottom:12px;">' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">Current Status</label>' +
    '<span class="badge ' + esc(PA_STATUS_BADGE[pa.status] || '') + '">' + esc(pa.status) + '</span>' +
    '</div>' +
    '<div style="margin-bottom:12px;">' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">New Status</label>' +
    '<select id="pa-new-status" class="form-control">' +
    statusOptions.map(function(s) {
      return '<option value="' + esc(s) + '"' + (s === pa.status ? ' selected' : '') + '>' + esc(s) + '</option>';
    }).join('') +
    '</select>' +
    '</div>' +
    '<div>' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">Notes</label>' +
    '<textarea id="pa-status-notes" class="form-control" rows="3" placeholder="Optional notes..."></textarea>' +
    '</div>';

  openModal({
    title: 'Update PA Status',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="pa-status-save">Save</button>',
  });

  setTimeout(function() {
    const saveBtn = document.getElementById('pa-status-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        const newStatus = document.getElementById('pa-new-status').value;
        const notes = document.getElementById('pa-status-notes').value.trim();
        updatePriorAuthStatus(paId, newStatus, notes ? { statusNotes: notes } : null);
        closeModal();
        showToast('PA status updated to ' + newStatus, 'success');
        renderPriorAuth();
      });
    }
  }, 50);
}

/* ============================================================
   openPriorAuthDetailModal — Detail modal
   ============================================================ */
function openPriorAuthDetailModal(paId) {
  const pa = getPriorAuth(paId);
  if (!pa) { showToast('Prior authorization not found.', 'error'); return; }

  const patient = getPatient(pa.patientId);
  const user = getSessionUser();
  const isEditable = pa.status === 'Required';

  let html = '';

  /* -- Header -- */
  html += '<div style="margin-bottom:16px;">';
  html += '<span style="font-weight:600;margin-right:8px;">PA #' + esc(pa.id.slice(0, 8)) + '</span>';
  html += '<span class="badge ' + esc(PA_STATUS_BADGE[pa.status] || '') + '">' + esc(pa.status) + '</span> ';
  html += '<span class="badge ' + esc(PA_URGENCY_BADGE[pa.urgency] || 'pa-badge-standard') + '">' + esc(pa.urgency || 'Standard') + '</span>';
  html += '</div>';

  /* -- Patient info -- */
  html += '<div class="pa-detail-section">';
  html += '<h4>Patient Information</h4>';
  if (patient) {
    html += '<div class="pa-detail-grid">';
    html += '<div><div class="label">Name</div><div class="value">' + esc(patient.firstName + ' ' + patient.lastName) + '</div></div>';
    html += '<div><div class="label">DOB</div><div class="value">' + esc(patient.dob || '--') + '</div></div>';
    html += '<div><div class="label">Insurance</div><div class="value">' + esc(patient.insurance || '--') + '</div></div>';
    html += '<div><div class="label">MRN</div><div class="value">' + esc(patient.mrn || '--') + '</div></div>';
    html += '</div>';
  } else {
    html += '<div style="color:var(--text-secondary);">Patient not found</div>';
  }
  html += '</div>';

  /* -- Request details -- */
  html += '<div class="pa-detail-section">';
  html += '<h4>Request Details</h4>';
  html += '<div class="pa-detail-grid">';

  if (isEditable) {
    html += '<div style="grid-column:1/-1;"><div class="label">Service</div><input id="pa-edit-service" class="form-control" value="' + esc(pa.requestedService || '') + '" /></div>';
    html += '<div style="grid-column:1/-1;"><div class="label">Justification</div><textarea id="pa-edit-justification" class="form-control" rows="3">' + esc(pa.clinicalJustification || '') + '</textarea></div>';
    html += '<div><div class="label">Urgency</div><select id="pa-edit-urgency" class="form-control">' +
      '<option value="Standard"' + (pa.urgency === 'Standard' ? ' selected' : '') + '>Standard</option>' +
      '<option value="Urgent"' + (pa.urgency === 'Urgent' ? ' selected' : '') + '>Urgent</option>' +
      '</select></div>';
    html += '<div><div class="label">Payer</div><input id="pa-edit-payer" class="form-control" value="' + esc(pa.payer || '') + '" /></div>';
  } else {
    html += '<div><div class="label">Service</div><div class="value">' + esc(pa.requestedService || '--') + '</div></div>';
    html += '<div style="grid-column:1/-1;"><div class="label">Justification</div><div class="value">' + esc(pa.clinicalJustification || '--') + '</div></div>';
    html += '<div><div class="label">Urgency</div><div class="value">' + esc(pa.urgency || 'Standard') + '</div></div>';
    html += '<div><div class="label">Payer</div><div class="value">' + esc(pa.payer || '--') + '</div></div>';
  }

  // Ordering provider
  const creator = pa.createdBy ? getProvider(pa.createdBy) : null;
  html += '<div><div class="label">Ordering Provider</div><div class="value">' +
    (creator ? esc(creator.firstName + ' ' + creator.lastName + ', ' + (creator.degree || '')) : esc(user.firstName + ' ' + user.lastName)) +
    '</div></div>';
  html += '</div>'; // close grid
  html += '</div>'; // close section

  /* -- Linked order -- */
  if (pa.orderId) {
    const order = typeof getOrder === 'function' ? getOrder(pa.orderId) : null;
    html += '<div class="pa-detail-section">';
    html += '<h4>Linked Order</h4>';
    html += '<div class="pa-detail-grid">';
    if (order) {
      html += '<div><div class="label">Type</div><div class="value">' + esc(order.type || '--') + '</div></div>';
      const detail = order.detail || {};
      const desc = detail.drug || detail.panel || detail.study || detail.service || '--';
      html += '<div><div class="label">Description</div><div class="value">' + esc(desc) + '</div></div>';
      html += '<div><div class="label">Priority</div><div class="value">' + esc(order.priority || '--') + '</div></div>';
    } else {
      html += '<div style="grid-column:1/-1;">Order #' + esc(pa.orderId) + ' (not found)</div>';
    }
    html += '</div>';
    html += '</div>';
  }

  /* -- Documents -- */
  html += '<div class="pa-detail-section">';
  html += '<h4>Documents <button class="btn btn-secondary btn-sm" id="pa-add-doc-btn" style="margin-left:8px;vertical-align:middle;">Add Document</button></h4>';
  const docs = pa.documents || [];
  if (docs.length === 0) {
    html += '<div style="color:var(--text-secondary);font-size:13px;">No documents attached.</div>';
  } else {
    html += '<ul class="pa-documents-list">';
    docs.forEach(function(doc, idx) {
      html += '<li>' +
        '<span>' + esc(doc.name || 'Document ' + (idx + 1)) + '</span>' +
        '<span style="color:var(--text-secondary);font-size:12px;">' + (doc.date ? formatDateTime(doc.date) : '--') + (doc.note ? ' — ' + esc(doc.note) : '') + '</span>' +
        '</li>';
    });
    html += '</ul>';
  }
  html += '</div>';

  /* -- Timeline -- */
  html += '<div class="pa-detail-section">';
  html += '<h4>Timeline</h4>';
  html += '<div class="pa-timeline">';
  const timeline = [
    { label: 'Created', date: pa.createdAt },
    { label: 'Submitted', date: pa.submittedDate },
    { label: 'Response', date: pa.responseDate },
    { label: 'Expiration', date: pa.expirationDate },
  ];
  timeline.forEach(function(t) {
    html += '<div class="pa-timeline-item">' +
      '<div class="tl-label">' + esc(t.label) + '</div>' +
      '<div class="tl-date">' + (t.date ? formatDateTime(t.date) : '--') + '</div>' +
      '</div>';
  });
  html += '</div>';
  if (pa.statusNotes) {
    html += '<div style="margin-top:8px;font-size:13px;"><strong>Notes:</strong> ' + esc(pa.statusNotes) + '</div>';
  }
  html += '</div>';

  /* -- Footer buttons based on status -- */
  let footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Close</button>';

  if (pa.status === 'Required') {
    if (isEditable) {
      footerHTML += '<button class="btn btn-primary" id="pa-detail-save">Save Changes</button>';
    }
    footerHTML += '<button class="btn btn-success" id="pa-detail-submit">Submit to Payer</button>';
    footerHTML += '<button class="btn btn-danger" id="pa-detail-delete">Delete</button>';
  } else if (pa.status === 'Submitted') {
    footerHTML += '<button class="btn btn-primary" id="pa-detail-review">Mark Under Review</button>';
  } else if (pa.status === 'Under Review') {
    footerHTML += '<button class="btn btn-success" id="pa-detail-approve">Approve</button>';
    footerHTML += '<button class="btn btn-danger" id="pa-detail-deny">Deny</button>';
  } else if (pa.status === 'Approved') {
    footerHTML += '<button class="btn btn-secondary" id="pa-detail-expire">Mark Expired</button>';
  } else if (pa.status === 'Denied') {
    footerHTML += '<button class="btn btn-warning" id="pa-detail-appeal">File Appeal</button>';
    footerHTML += '<button class="btn btn-primary" id="pa-detail-resubmit">Resubmit</button>';
    footerHTML += '<button class="btn btn-danger" id="pa-detail-delete">Delete</button>';
  }

  openModal({
    title: 'Prior Authorization Details',
    bodyHTML: html,
    footerHTML: footerHTML,
    size: 'lg',
  });

  /* -- Wire button handlers -- */
  setTimeout(function() {
    // Add document
    const addDocBtn = document.getElementById('pa-add-doc-btn');
    if (addDocBtn) {
      addDocBtn.addEventListener('click', function(e) {
        e.preventDefault();
        _openAddDocumentSubModal(paId);
      });
    }

    // Save edits (Required status only)
    const saveBtn = document.getElementById('pa-detail-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        const svc = document.getElementById('pa-edit-service');
        const just = document.getElementById('pa-edit-justification');
        const urg = document.getElementById('pa-edit-urgency');
        const pay = document.getElementById('pa-edit-payer');
        if (svc) pa.requestedService = svc.value.trim();
        if (just) pa.clinicalJustification = just.value.trim();
        if (urg) pa.urgency = urg.value;
        if (pay) pa.payer = pay.value.trim();
        savePriorAuth(pa);
        closeModal();
        showToast('Prior authorization updated.', 'success');
        renderPriorAuth();
      });
    }

    // Submit to Payer
    const submitBtn = document.getElementById('pa-detail-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        // Save edits first if editable
        if (isEditable) {
          const svc = document.getElementById('pa-edit-service');
          const just = document.getElementById('pa-edit-justification');
          const urg = document.getElementById('pa-edit-urgency');
          const pay = document.getElementById('pa-edit-payer');
          if (svc) pa.requestedService = svc.value.trim();
          if (just) pa.clinicalJustification = just.value.trim();
          if (urg) pa.urgency = urg.value;
          if (pay) pa.payer = pay.value.trim();
          savePriorAuth(pa);
        }
        updatePriorAuthStatus(paId, 'Submitted');
        closeModal();
        showToast('Prior authorization submitted.', 'success');
        renderPriorAuth();
      });
    }

    // Mark Under Review
    const reviewBtn = document.getElementById('pa-detail-review');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', function() {
        updatePriorAuthStatus(paId, 'Under Review');
        closeModal();
        showToast('PA marked as Under Review.', 'success');
        renderPriorAuth();
      });
    }

    // Approve
    const approveBtn = document.getElementById('pa-detail-approve');
    if (approveBtn) {
      approveBtn.addEventListener('click', function() {
        updatePriorAuthStatus(paId, 'Approved');
        closeModal();
        showToast('Prior authorization approved.', 'success');
        renderPriorAuth();
      });
    }

    // Deny
    const denyBtn = document.getElementById('pa-detail-deny');
    if (denyBtn) {
      denyBtn.addEventListener('click', function() {
        updatePriorAuthStatus(paId, 'Denied');
        closeModal();
        showToast('Prior authorization denied.', 'warning');
        renderPriorAuth();
      });
    }

    // Expire
    const expireBtn = document.getElementById('pa-detail-expire');
    if (expireBtn) {
      expireBtn.addEventListener('click', function() {
        updatePriorAuthStatus(paId, 'Expired');
        closeModal();
        showToast('Prior authorization marked as expired.', 'warning');
        renderPriorAuth();
      });
    }

    // Appeal
    const appealBtn = document.getElementById('pa-detail-appeal');
    if (appealBtn) {
      appealBtn.addEventListener('click', function() {
        closeModal();
        openAppealModal(paId);
      });
    }

    // Resubmit
    const resubmitBtn = document.getElementById('pa-detail-resubmit');
    if (resubmitBtn) {
      resubmitBtn.addEventListener('click', function() {
        updatePriorAuthStatus(paId, 'Submitted');
        closeModal();
        showToast('Prior authorization resubmitted.', 'success');
        renderPriorAuth();
      });
    }

    // Delete
    const deleteBtn = document.getElementById('pa-detail-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        if (confirm('Delete this prior authorization?')) {
          deletePriorAuth(paId);
          closeModal();
          showToast('Prior authorization deleted.', 'success');
          renderPriorAuth();
        }
      });
    }
  }, 50);
}

/* ---------- Add document sub-modal ---------- */
function _openAddDocumentSubModal(paId) {
  const pa = getPriorAuth(paId);
  if (!pa) return;

  const bodyHTML = '<div style="margin-bottom:12px;">' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">Document Name</label>' +
    '<input id="pa-doc-name" class="form-control" placeholder="e.g. Clinical notes, Lab report" />' +
    '</div>' +
    '<div>' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">Note</label>' +
    '<textarea id="pa-doc-note" class="form-control" rows="2" placeholder="Optional description..."></textarea>' +
    '</div>';

  openModal({
    title: 'Add Document',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="pa-doc-save">Add</button>',
  });

  setTimeout(function() {
    const saveBtn = document.getElementById('pa-doc-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        const name = (document.getElementById('pa-doc-name').value || '').trim();
        if (!name) { showToast('Document name is required.', 'error'); return; }
        const note = (document.getElementById('pa-doc-note').value || '').trim();
        if (!pa.documents) pa.documents = [];
        pa.documents.push({
          name: name,
          note: note,
          date: new Date().toISOString(),
          addedBy: getSessionUser().id,
        });
        savePriorAuth(pa);
        closeModal();
        showToast('Document added.', 'success');
        openPriorAuthDetailModal(paId);
      });
    }
  }, 50);
}

/* ============================================================
   openNewPriorAuthModal — Create new PA
   ============================================================ */
function openNewPriorAuthModal(prefill) {
  prefill = prefill || {};
  const patients = getPatients();
  const user = getSessionUser();

  let bodyHTML = '';

  // Patient picker
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Patient <span style="color:var(--danger);">*</span></label>';
  if (prefill.patientId) {
    const pat = getPatient(prefill.patientId);
    bodyHTML += '<input class="form-control" value="' + esc(pat ? pat.firstName + ' ' + pat.lastName : prefill.patientId) + '" readonly />';
    bodyHTML += '<input type="hidden" id="pa-new-patient-id" value="' + esc(prefill.patientId) + '" />';
  } else {
    bodyHTML += '<input id="pa-new-patient-search" class="form-control" placeholder="Search patient by name..." autocomplete="off" />';
    bodyHTML += '<div id="pa-new-patient-results" class="pa-patient-results"></div>';
    bodyHTML += '<input type="hidden" id="pa-new-patient-id" value="" />';
  }
  bodyHTML += '</div>';

  // Requested service
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Requested Service <span style="color:var(--danger);">*</span></label>';
  bodyHTML += '<input id="pa-new-service" class="form-control" placeholder="e.g. MRI Lumbar Spine" value="' + esc(prefill.requestedService || '') + '" />';
  bodyHTML += '</div>';

  // Clinical justification
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Clinical Justification</label>';
  bodyHTML += '<textarea id="pa-new-justification" class="form-control" rows="3" placeholder="Reason for request...">' + esc(prefill.clinicalJustification || '') + '</textarea>';
  bodyHTML += '</div>';

  // Payer / insurance
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Payer / Insurance</label>';
  bodyHTML += '<input id="pa-new-payer" class="form-control" placeholder="Insurance name" value="' + esc(prefill.payer || '') + '" />';
  bodyHTML += '</div>';

  // Urgency
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Urgency</label>';
  bodyHTML += '<label style="margin-right:16px;"><input type="radio" name="pa-new-urgency" value="Standard"' + (prefill.urgency !== 'Urgent' ? ' checked' : '') + ' /> Standard</label>';
  bodyHTML += '<label><input type="radio" name="pa-new-urgency" value="Urgent"' + (prefill.urgency === 'Urgent' ? ' checked' : '') + ' /> Urgent</label>';
  bodyHTML += '</div>';

  // Linked order ID
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Linked Order ID (optional)</label>';
  bodyHTML += '<input id="pa-new-order-id" class="form-control" placeholder="Order ID" value="' + esc(prefill.orderId || '') + '" />';
  bodyHTML += '</div>';

  // Auth number
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Auth Number (if available)</label>';
  bodyHTML += '<input id="pa-new-auth-number" class="form-control" placeholder="Authorization number" value="' + esc(prefill.authNumber || '') + '" />';
  bodyHTML += '</div>';

  // Expiration date
  bodyHTML += '<div style="margin-bottom:12px;">';
  bodyHTML += '<label style="font-weight:600;display:block;margin-bottom:4px;">Expiration Date</label>';
  bodyHTML += '<input id="pa-new-expiration" class="form-control" type="date" value="' + esc(prefill.expirationDate || '') + '" />';
  bodyHTML += '</div>';

  openModal({
    title: 'New Prior Authorization',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-success" id="pa-new-save">Save</button>',
  });

  setTimeout(function() {
    // Patient search (only if no prefill)
    if (!prefill.patientId) {
      const searchInput = document.getElementById('pa-new-patient-search');
      const resultsDiv = document.getElementById('pa-new-patient-results');
      const hiddenId = document.getElementById('pa-new-patient-id');

      if (searchInput) {
        searchInput.addEventListener('input', function() {
          const term = this.value.toLowerCase().trim();
          resultsDiv.innerHTML = '';
          if (!term) return;
          const matches = patients.filter(function(p) {
            return (p.firstName + ' ' + p.lastName).toLowerCase().indexOf(term) !== -1 ||
                   (p.mrn || '').toLowerCase().indexOf(term) !== -1;
          }).slice(0, 8);
          matches.forEach(function(p) {
            const item = document.createElement('div');
            item.className = 'pa-patient-result-item';
            item.innerHTML = esc(p.firstName + ' ' + p.lastName) + ' <span style="color:var(--text-secondary);font-size:12px;">MRN: ' + esc(p.mrn || '--') + '</span>';
            item.addEventListener('click', function() {
              hiddenId.value = p.id;
              searchInput.value = p.firstName + ' ' + p.lastName;
              resultsDiv.innerHTML = '';
              // Auto-fill insurance
              const payerInput = document.getElementById('pa-new-payer');
              if (payerInput && p.insurance && !payerInput.value) {
                payerInput.value = p.insurance;
              }
            });
            resultsDiv.appendChild(item);
          });
        });
      }
    }

    // Auto-fill payer from prefilled patient
    if (prefill.patientId) {
      const pat = getPatient(prefill.patientId);
      const payerInput = document.getElementById('pa-new-payer');
      if (pat && pat.insurance && payerInput && !payerInput.value) {
        payerInput.value = pat.insurance;
      }
    }

    // Save handler
    const saveBtn = document.getElementById('pa-new-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        const patientId = document.getElementById('pa-new-patient-id').value;
        const service = (document.getElementById('pa-new-service').value || '').trim();
        if (!patientId) { showToast('Please select a patient.', 'error'); return; }
        if (!service) { showToast('Requested service is required.', 'error'); return; }

        const urgencyRadio = document.querySelector('input[name="pa-new-urgency"]:checked');
        const data = {
          patientId: patientId,
          requestedService: service,
          clinicalJustification: (document.getElementById('pa-new-justification').value || '').trim(),
          payer: (document.getElementById('pa-new-payer').value || '').trim(),
          urgency: urgencyRadio ? urgencyRadio.value : 'Standard',
          orderId: (document.getElementById('pa-new-order-id').value || '').trim() || null,
          authNumber: (document.getElementById('pa-new-auth-number').value || '').trim() || null,
          expirationDate: (document.getElementById('pa-new-expiration').value || '').trim() || null,
        };

        const result = savePriorAuth(data);
        if (result && result.error) {
          showToast('Error saving PA: ' + (result.errors || []).join(', '), 'error');
          return;
        }

        closeModal();
        showToast('Prior authorization created.', 'success');
        renderPriorAuth();
      });
    }
  }, 50);
}

/* ============================================================
   checkAndPromptPA — Called from orders to check if PA needed
   ============================================================ */
function checkAndPromptPA(order) {
  const check = checkPriorAuthRequired(order);
  if (!check || !check.required) return;

  const reason = check.reason || 'Prior authorization may be required for this order.';
  const patient = order.patientId ? getPatient(order.patientId) : null;

  // Build service description from order detail
  const detail = order.detail || {};
  const serviceDesc = detail.drug || detail.panel || detail.study || detail.service || order.type || '';

  const bodyHTML = '<div style="margin-bottom:16px;">' +
    '<div style="font-weight:600;color:var(--warning);font-size:15px;margin-bottom:8px;">Prior Authorization Required</div>' +
    '<div>' + esc(reason) + '</div>' +
    '</div>' +
    (patient ? '<div style="margin-bottom:8px;color:var(--text-secondary);">Patient: ' + esc(patient.firstName + ' ' + patient.lastName) + '</div>' : '') +
    (serviceDesc ? '<div style="margin-bottom:8px;color:var(--text-secondary);">Service: ' + esc(serviceDesc) + '</div>' : '');

  openModal({
    title: 'Prior Authorization Alert',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-danger" id="pa-prompt-cancel">Cancel Order</button>' +
      '<button class="btn btn-secondary" id="pa-prompt-continue">Continue Without PA</button>' +
      '<button class="btn btn-success" id="pa-prompt-create">Create PA Now</button>',
  });

  setTimeout(function() {
    const cancelBtn = document.getElementById('pa-prompt-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        closeModal();
        showToast('Order cancelled.', 'warning');
      });
    }

    const continueBtn = document.getElementById('pa-prompt-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', function() {
        closeModal();
      });
    }

    const createBtn = document.getElementById('pa-prompt-create');
    if (createBtn) {
      createBtn.addEventListener('click', function() {
        closeModal();
        openNewPriorAuthModal({
          patientId: order.patientId || null,
          requestedService: serviceDesc,
          orderId: order.id || null,
          urgency: order.priority === 'STAT' || order.priority === 'Urgent' ? 'Urgent' : 'Standard',
        });
      });
    }
  }, 50);
}

/* ============================================================
   renderPriorAuthBadge — Returns HTML string for order PA badge
   ============================================================ */
function renderPriorAuthBadge(orderId) {
  if (!orderId) return '';
  const pa = getPriorAuthByOrder(orderId);
  if (!pa) return '';

  const status = pa.status || '';
  let badgeCls = '';
  let label = '';

  if (status === 'Approved') {
    badgeCls = 'pa-badge-approved';
    label = 'PA: Approved';
  } else if (status === 'Denied') {
    badgeCls = 'pa-badge-denied';
    label = 'PA: Denied';
  } else if (status === 'Required') {
    badgeCls = 'pa-badge-required-outline';
    label = 'PA: Required';
  } else if (status === 'Expired') {
    badgeCls = 'pa-badge-expired';
    label = 'PA: Expired';
  } else {
    // Submitted, Under Review — pending
    badgeCls = 'pa-badge-pending';
    label = 'PA: Pending';
  }

  return '<span class="badge ' + badgeCls + '">' + esc(label) + '</span>';
}

/* ============================================================
   openManageRulesModal — Manage PA rules
   ============================================================ */
function openManageRulesModal() {
  _renderRulesModal();
}

function _renderRulesModal() {
  let rules = loadAll(KEYS.payerRules);
  if (rules.length === 0) {
    // Seed with defaults
    rules = PA_RULES_DEFAULT.map(function(r) {
      return Object.assign({}, r, { id: generateId() });
    });
    saveAll(KEYS.payerRules, rules);
  }

  const ruleTypes = ['Imaging', 'Medication', 'Consult', 'Procedure', 'Lab'];

  let bodyHTML = '<table class="pa-rules-table"><thead><tr>' +
    '<th>Type</th><th>Match Pattern</th><th>Description</th><th>Actions</th>' +
    '</tr></thead><tbody>';

  rules.forEach(function(rule) {
    bodyHTML += '<tr data-rule-id="' + esc(rule.id) + '">' +
      '<td>' + esc(rule.type || '--') + '</td>' +
      '<td><code>' + esc(rule.matchPattern || '') + '</code></td>' +
      '<td>' + esc(rule.description || '') + '</td>' +
      '<td class="pa-actions">' +
      '<button class="btn btn-secondary btn-sm pa-rule-edit" data-id="' + esc(rule.id) + '">Edit</button> ' +
      '<button class="btn btn-danger btn-sm pa-rule-delete" data-id="' + esc(rule.id) + '">Delete</button>' +
      '</td></tr>';
  });

  bodyHTML += '</tbody></table>';

  openModal({
    title: 'Manage PA Rules',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>' +
      '<button class="btn btn-primary" id="pa-rule-add">Add Rule</button>',
    size: 'lg',
  });

  setTimeout(function() {
    // Add rule
    const addBtn = document.getElementById('pa-rule-add');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        _openRuleEditorModal(null);
      });
    }

    // Edit buttons
    document.querySelectorAll('.pa-rule-edit').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _openRuleEditorModal(this.getAttribute('data-id'));
      });
    });

    // Delete buttons
    document.querySelectorAll('.pa-rule-delete').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const ruleId = this.getAttribute('data-id');
        if (confirm('Delete this rule?')) {
          let all = loadAll(KEYS.payerRules);
          all = all.filter(function(r) { return r.id !== ruleId; });
          saveAll(KEYS.payerRules, all);
          showToast('Rule deleted.', 'success');
          _renderRulesModal();
        }
      });
    });
  }, 50);
}

/* ---------- Rule editor sub-modal ---------- */
function _openRuleEditorModal(ruleId) {
  const ruleTypes = ['Imaging', 'Medication', 'Consult', 'Procedure', 'Lab'];
  let rule = null;
  if (ruleId) {
    const rules = loadAll(KEYS.payerRules);
    rule = rules.find(function(r) { return r.id === ruleId; }) || null;
  }

  const bodyHTML = '<div style="margin-bottom:12px;">' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">Type</label>' +
    '<select id="pa-rule-type" class="form-control">' +
    ruleTypes.map(function(t) {
      return '<option value="' + esc(t) + '"' + (rule && rule.type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('') +
    '</select>' +
    '</div>' +
    '<div style="margin-bottom:12px;">' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">Match Pattern</label>' +
    '<input id="pa-rule-pattern" class="form-control" placeholder="e.g. MRI|CT|PET (pipe-separated)" value="' + esc(rule ? rule.matchPattern || '' : '') + '" />' +
    '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Use | to separate multiple terms (case-insensitive)</div>' +
    '</div>' +
    '<div>' +
    '<label style="font-weight:600;display:block;margin-bottom:4px;">Description</label>' +
    '<input id="pa-rule-desc" class="form-control" placeholder="Description of why PA is required" value="' + esc(rule ? rule.description || '' : '') + '" />' +
    '</div>';

  openModal({
    title: ruleId ? 'Edit Rule' : 'Add Rule',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="pa-rule-save">Save</button>',
  });

  setTimeout(function() {
    const saveBtn = document.getElementById('pa-rule-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        const type = document.getElementById('pa-rule-type').value;
        const pattern = (document.getElementById('pa-rule-pattern').value || '').trim();
        const desc = (document.getElementById('pa-rule-desc').value || '').trim();

        if (!pattern) { showToast('Match pattern is required.', 'error'); return; }

        let rules = loadAll(KEYS.payerRules);

        if (ruleId) {
          const existing = rules.find(function(r) { return r.id === ruleId; });
          if (existing) {
            existing.type = type;
            existing.matchPattern = pattern;
            existing.description = desc;
            existing.requiresPA = true;
          }
        } else {
          rules.push({
            id: generateId(),
            type: type,
            matchPattern: pattern,
            description: desc,
            requiresPA: true,
          });
        }

        saveAll(KEYS.payerRules, rules);
        showToast('Rule saved.', 'success');
        _renderRulesModal();
      });
    }
  }, 50);
}

/* ============================================================
   APPEAL MANAGEMENT MODAL
   ============================================================ */
function openAppealModal(paId) {
  const pa = getPriorAuth(paId);
  if (!pa) { showToast('PA not found', 'error'); return; }
  const patient = loadAll(KEYS.patients).find(function(p) { return p.id === pa.patientId; });
  const patientName = patient ? esc(patient.lastName + ', ' + patient.firstName) : 'Unknown';

  let bodyHTML = '<div style="margin-bottom:16px;padding:12px;background:var(--bg-base);border-radius:var(--radius);">';
  bodyHTML += '<strong>Patient:</strong> ' + patientName + ' &nbsp;|&nbsp; ';
  bodyHTML += '<strong>Service:</strong> ' + esc(pa.serviceRequested || '') + ' &nbsp;|&nbsp; ';
  bodyHTML += '<strong>Payer:</strong> ' + esc(pa.payerName || '') + ' &nbsp;|&nbsp; ';
  bodyHTML += '<strong>Status:</strong> ' + esc(pa.status) + '</div>';

  // Denial info
  bodyHTML += '<div class="ai-section-title">Denial Information</div>';
  bodyHTML += '<div class="form-group"><label class="form-label">Denial Reason</label>' +
    '<select id="appeal-denial-reason" class="form-control">' +
    '<option value="">Select reason...</option>' +
    '<option value="medical-necessity">Medical Necessity Not Established</option>' +
    '<option value="not-covered">Service Not Covered Under Plan</option>' +
    '<option value="experimental">Experimental/Investigational</option>' +
    '<option value="out-of-network">Out of Network Provider</option>' +
    '<option value="incomplete-info">Incomplete Clinical Information</option>' +
    '<option value="duplicate">Duplicate Request</option>' +
    '<option value="frequency">Exceeds Frequency Limits</option>' +
    '<option value="age-criteria">Does Not Meet Age/Gender Criteria</option>' +
    '<option value="step-therapy">Step Therapy Required First</option>' +
    '<option value="other">Other</option>' +
    '</select></div>';

  bodyHTML += '<div class="form-group"><label class="form-label">Denial Details</label>' +
    '<textarea id="appeal-denial-details" class="form-control" rows="2" placeholder="Specific denial details...">' + esc(pa.denialReason || '') + '</textarea></div>';

  // Appeal info
  bodyHTML += '<div class="ai-section-title">Appeal</div>';
  bodyHTML += '<div class="form-group"><label class="form-label">Appeal Type</label>' +
    '<select id="appeal-type" class="form-control">' +
    '<option value="Level1">Level 1 - Internal Appeal</option>' +
    '<option value="Level2">Level 2 - External Review</option>' +
    '<option value="P2P">Peer-to-Peer Review</option>' +
    '<option value="Expedited">Expedited Appeal</option>' +
    '</select></div>';

  bodyHTML += '<div class="form-group"><label class="form-label">Clinical Rationale for Appeal</label>' +
    '<textarea id="appeal-rationale" class="form-control" rows="4" placeholder="Provide clinical justification supporting the medical necessity of this service...">' +
    esc(pa.appealRationale || '') + '</textarea></div>';

  bodyHTML += '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">Peer-to-Peer Date/Time</label>' +
    '<input type="datetime-local" id="appeal-p2p-date" class="form-control" value="' + esc(pa.p2pDate || '') + '" /></div>' +
    '<div class="form-group"><label class="form-label">P2P Contact / Reviewer</label>' +
    '<input type="text" id="appeal-p2p-contact" class="form-control" placeholder="Dr. Smith at UHC" value="' + esc(pa.p2pContact || '') + '" /></div>' +
    '</div>';

  bodyHTML += '<div class="form-group"><label class="form-label">Supporting Documentation Notes</label>' +
    '<textarea id="appeal-docs" class="form-control" rows="2" placeholder="List clinical documents being submitted (e.g., op notes, labs, imaging)...">' +
    esc(pa.appealDocs || '') + '</textarea></div>';

  // Generate appeal letter
  bodyHTML += '<div class="ai-section-title">Appeal Letter Preview</div>';
  bodyHTML += '<div id="appeal-letter-preview" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;font-size:13px;line-height:1.6;max-height:200px;overflow:auto;">';
  bodyHTML += '<em>Click "Generate Letter" to preview the appeal letter.</em>';
  bodyHTML += '</div>';

  // Appeal history
  if (pa.appeals && pa.appeals.length > 0) {
    bodyHTML += '<div class="ai-section-title">Appeal History</div>';
    pa.appeals.forEach(function(a) {
      bodyHTML += '<div class="ai-finding" style="margin-bottom:8px;">' +
        '<div class="ai-finding-icon ' + (a.outcome === 'Approved' ? 'success' : a.outcome === 'Denied' ? 'critical' : 'info') + '">' +
        (a.outcome === 'Approved' ? '' : a.outcome === 'Denied' ? '' : '⏳') + '</div>' +
        '<div class="ai-finding-body">' +
        '<div class="ai-finding-title">' + esc(a.type) + ' — ' + esc(a.outcome || 'Pending') + '</div>' +
        '<div class="ai-finding-desc">' + esc(a.rationale || '').slice(0, 100) +
        (a.date ? ' &nbsp;|&nbsp; ' + formatDateTime(a.date) : '') + '</div></div></div>';
    });
  }

  const footerHTML = '<button class="btn btn-secondary" id="appeal-gen-letter">Generate Letter</button>' +
    '<button class="btn btn-primary" id="appeal-submit">Submit Appeal</button>' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>';

  openModal({ title: 'Appeal — ' + esc(pa.serviceRequested || 'PA'), bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  setTimeout(function() {
    // Generate letter
    document.getElementById('appeal-gen-letter').addEventListener('click', function() {
      var reason = document.getElementById('appeal-denial-reason').value;
      var rationale = document.getElementById('appeal-rationale').value.trim();
      var provider = getSessionUser();
      var providerName = provider.firstName + ' ' + provider.lastName + ', ' + (provider.degree || 'MD');
      var preview = document.getElementById('appeal-letter-preview');
      preview.innerHTML =
        '<p><strong>Date:</strong> ' + new Date().toLocaleDateString() + '</p>' +
        '<p><strong>To:</strong> ' + esc(pa.payerName || 'Insurance Company') + ' — Prior Authorization Department</p>' +
        '<p><strong>Re:</strong> Appeal for ' + esc(pa.serviceRequested || 'service') + ' — Patient: ' + patientName + '</p>' +
        '<p><strong>Auth Reference:</strong> ' + esc(pa.authNumber || pa.id.slice(0, 8)) + '</p><br/>' +
        '<p>Dear Medical Director,</p>' +
        '<p>I am writing to appeal the denial of prior authorization for ' + esc(pa.serviceRequested || 'the requested service') +
        ' for the above-referenced patient. The denial was issued citing: <em>' + esc(reason || 'medical necessity not established') + '</em>.</p>' +
        '<p><strong>Clinical Rationale:</strong></p>' +
        '<p>' + esc(rationale || 'Please provide clinical rationale above.') + '</p>' +
        '<p>Based on the clinical evidence presented, I respectfully request reconsideration of this denial. ' +
        'The requested service is medically necessary and consistent with accepted standards of care.</p>' +
        '<p>Please do not hesitate to contact me for additional information or to arrange a peer-to-peer review.</p>' +
        '<p>Sincerely,<br/>' + esc(providerName) + '</p>';
    });

    // Submit appeal
    document.getElementById('appeal-submit').addEventListener('click', function() {
      var rationale = document.getElementById('appeal-rationale').value.trim();
      if (!rationale) { showToast('Please provide a clinical rationale', 'error'); return; }

      var all = loadAll(KEYS.priorAuths, true);
      var idx = all.findIndex(function(p) { return p.id === paId; });
      if (idx === -1) { showToast('PA not found', 'error'); return; }

      if (!all[idx].appeals) all[idx].appeals = [];
      all[idx].appeals.push({
        id: generateId(),
        type: document.getElementById('appeal-type').value,
        denialReason: document.getElementById('appeal-denial-reason').value,
        denialDetails: document.getElementById('appeal-denial-details').value.trim(),
        rationale: rationale,
        p2pDate: document.getElementById('appeal-p2p-date').value || null,
        p2pContact: document.getElementById('appeal-p2p-contact').value.trim() || null,
        docs: document.getElementById('appeal-docs').value.trim() || null,
        outcome: 'Pending',
        date: new Date().toISOString(),
        submittedBy: getSessionUser().id,
      });

      all[idx].status = 'Under Review';
      all[idx].denialReason = document.getElementById('appeal-denial-reason').value;
      all[idx].appealRationale = rationale;
      all[idx].p2pDate = document.getElementById('appeal-p2p-date').value || null;
      all[idx].p2pContact = document.getElementById('appeal-p2p-contact').value.trim() || null;
      all[idx].appealDocs = document.getElementById('appeal-docs').value.trim() || null;

      saveAll(KEYS.priorAuths, all);
      showToast('Appeal submitted successfully', 'success');
      closeModal();
      if (window.location.hash.startsWith('#prior-auth')) renderPriorAuth();
    });
  }, 50);
}

/* ============================================================
   PA ANALYTICS DASHBOARD MODAL
   ============================================================ */
function openPAAnalyticsModal() {
  const pas = getPriorAuths();
  const now = Date.now();

  var total = pas.length;
  var approved = 0, denied = 0, pending = 0, expired = 0;
  var turnaroundDays = [];
  var byPayer = {};
  var denialReasons = {};
  var byUrgency = { Urgent: 0, Standard: 0 };

  pas.forEach(function(pa) {
    if (pa.status === 'Approved') approved++;
    else if (pa.status === 'Denied') denied++;
    else if (pa.status === 'Expired') expired++;
    else pending++;

    if (pa.status === 'Approved' && pa.submittedAt && pa.approvedAt) {
      var days = Math.floor((new Date(pa.approvedAt).getTime() - new Date(pa.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0) turnaroundDays.push(days);
    }

    var payer = pa.payerName || 'Unknown';
    if (!byPayer[payer]) byPayer[payer] = { total: 0, approved: 0, denied: 0, pending: 0 };
    byPayer[payer].total++;
    if (pa.status === 'Approved') byPayer[payer].approved++;
    else if (pa.status === 'Denied') byPayer[payer].denied++;
    else byPayer[payer].pending++;

    if (pa.denialReason) {
      denialReasons[pa.denialReason] = (denialReasons[pa.denialReason] || 0) + 1;
    }

    if (pa.urgency === 'Urgent') byUrgency.Urgent++;
    else byUrgency.Standard++;
  });

  var approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';
  var denialRate = total > 0 ? ((denied / total) * 100).toFixed(1) : '0.0';
  var avgTurnaround = turnaroundDays.length > 0 ? Math.round(turnaroundDays.reduce(function(a, b) { return a + b; }, 0) / turnaroundDays.length) : 0;

  // Expiring soon (within 30 days)
  var expiringSoon = pas.filter(function(pa) {
    if (pa.status !== 'Approved' || !pa.expirationDate) return false;
    var exp = new Date(pa.expirationDate).getTime();
    return exp > now && exp < now + (30 * 24 * 60 * 60 * 1000);
  });

  var body = '<div class="ai-summary-bar">';
  body += '<div class="ai-stat-card success"><div class="ai-stat-value success">' + approvalRate + '%</div><div class="ai-stat-label">Approval Rate</div></div>';
  body += '<div class="ai-stat-card ' + (parseFloat(denialRate) > 20 ? 'critical' : 'warning') + '"><div class="ai-stat-value ' + (parseFloat(denialRate) > 20 ? 'critical' : 'warning') + '">' + denialRate + '%</div><div class="ai-stat-label">Denial Rate</div></div>';
  body += '<div class="ai-stat-card info"><div class="ai-stat-value info">' + avgTurnaround + '</div><div class="ai-stat-label">Avg Days to Approve</div></div>';
  body += '<div class="ai-stat-card info"><div class="ai-stat-value info">' + pending + '</div><div class="ai-stat-label">Pending</div></div>';
  body += '<div class="ai-stat-card ' + (expiringSoon.length > 0 ? 'warning' : 'success') + '"><div class="ai-stat-value ' + (expiringSoon.length > 0 ? 'warning' : 'success') + '">' + expiringSoon.length + '</div><div class="ai-stat-label">Expiring Soon</div></div>';
  body += '</div>';

  // By payer
  body += '<div class="ai-section-title">By Payer</div>';
  body += '<table class="table"><thead><tr><th>Payer</th><th>Total</th><th>Approved</th><th>Denied</th><th>Pending</th><th>Approval %</th></tr></thead><tbody>';
  Object.keys(byPayer).sort().forEach(function(payer) {
    var p = byPayer[payer];
    var pct = p.total > 0 ? ((p.approved / p.total) * 100).toFixed(0) : '0';
    body += '<tr><td>' + esc(payer) + '</td><td>' + p.total + '</td><td>' + p.approved + '</td>' +
      '<td>' + p.denied + '</td><td>' + p.pending + '</td><td>' + pct + '%</td></tr>';
  });
  body += '</tbody></table>';

  // Denial reasons
  if (Object.keys(denialReasons).length > 0) {
    body += '<div class="ai-section-title">Top Denial Reasons</div>';
    var sortedReasons = Object.entries(denialReasons).sort(function(a, b) { return b[1] - a[1]; });
    var maxReasonCount = sortedReasons[0][1] || 1;
    sortedReasons.slice(0, 8).forEach(function(entry) {
      var pct = (entry[1] / maxReasonCount) * 100;
      body += '<div style="margin-bottom:8px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">' +
        '<span>' + esc(entry[0]) + '</span><span style="font-weight:600;">' + entry[1] + '</span></div>' +
        '<div class="progress-bar"><div class="progress-bar-fill danger" style="width:' + pct + '%;"></div></div></div>';
    });
  }

  // Expiring soon list
  if (expiringSoon.length > 0) {
    body += '<div class="ai-section-title">Expiring Within 30 Days</div>';
    expiringSoon.forEach(function(pa) {
      var patient = loadAll(KEYS.patients).find(function(p) { return p.id === pa.patientId; });
      var pName = patient ? esc(patient.lastName + ', ' + patient.firstName) : 'Unknown';
      var daysLeft = Math.ceil((new Date(pa.expirationDate).getTime() - now) / (1000 * 60 * 60 * 24));
      body += '<div class="ai-finding">' +
        '<div class="ai-finding-icon warning">⏰</div>' +
        '<div class="ai-finding-body">' +
        '<div class="ai-finding-title">' + pName + ' — ' + esc(pa.serviceRequested || '') + '</div>' +
        '<div class="ai-finding-desc">Expires in ' + daysLeft + ' days (' + esc(pa.expirationDate) + ') • Payer: ' + esc(pa.payerName || '') + '</div>' +
        '</div></div>';
    });
  }

  openModal({ title: 'Prior Auth Analytics', bodyHTML: body, footerHTML: '', size: 'xl' });
}
