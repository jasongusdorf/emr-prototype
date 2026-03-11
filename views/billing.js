/* ============================================================
   views/billing.js — Billing & Claims Management
   ============================================================ */

/* ---------- Module-level state ---------- */
let _billingPage = 1;
let _billingStatusFilter = 'All';
let _billingSearch = '';
let _billingDateFrom = '';
let _billingDateTo = '';
const _BILLING_PAGE_SIZE = 20;

/* ---------- Helpers ---------- */

function _formatMoney(val) {
  const n = parseFloat(val) || 0;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const _CLAIM_STATUS_BADGE = {
  Draft:    'billing-badge-draft',
  Ready:    'billing-badge-ready',
  Submitted:'billing-badge-submitted',
  Accepted: 'billing-badge-accepted',
  Denied:   'billing-badge-denied',
  Paid:     'billing-badge-paid',
  Appealed: 'billing-badge-appealed',
};

function _claimStatusBadge(status) {
  const cls = _CLAIM_STATUS_BADGE[status] || 'billing-badge-draft';
  return '<span class="badge ' + cls + '">' + esc(status) + '</span>';
}

/* ============================================================
   MAIN VIEW
   ============================================================ */
function renderBilling() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({
    title: 'Billing & Claims',
    meta: '',
    actions: '',
  });
  setActiveNav('billing');

  _billingPage = 1;

  const stats = getClaimStats();

  // ===== Summary stat cards =====
  const summaryBar = document.createElement('div');
  summaryBar.className = 'billing-summary-bar';

  const statItems = [
    { value: stats.total,     label: 'Total Claims',   cls: '' },
    { value: stats.draft,     label: 'Draft',           cls: '' },
    { value: stats.submitted, label: 'Submitted',       cls: '' },
    { value: stats.denied,    label: 'Denied',          cls: stats.denied > 0 ? 'stat-danger' : '' },
    { value: _formatMoney(stats.totalCharged), label: 'Total Charged', cls: '', raw: true },
    { value: _formatMoney(stats.totalPaid),    label: 'Total Paid',    cls: '', raw: true },
  ];

  statItems.forEach(function(s) {
    const card = document.createElement('div');
    card.className = 'summary-stat';
    const valEl = document.createElement('div');
    valEl.className = 'summary-stat-value' + (s.cls ? ' ' + s.cls : '');
    valEl.textContent = s.raw ? s.value : String(s.value);
    const lblEl = document.createElement('div');
    lblEl.className = 'summary-stat-label';
    lblEl.textContent = s.label;
    card.appendChild(valEl);
    card.appendChild(lblEl);
    summaryBar.appendChild(card);
  });
  app.appendChild(summaryBar);

  // ===== Toolbar =====
  const toolbar = document.createElement('div');
  toolbar.className = 'billing-toolbar';

  // Search
  const searchWrap = document.createElement('div');
  searchWrap.className = 'billing-toolbar-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-control';
  searchInput.placeholder = 'Search claims (patient, ID)...';
  searchInput.value = _billingSearch;
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  // Status filter
  const statusSelect = document.createElement('select');
  statusSelect.className = 'form-control';
  statusSelect.style.width = 'auto';
  const statuses = ['All', 'Draft', 'Ready', 'Submitted', 'Accepted', 'Denied', 'Paid', 'Appealed'];
  statuses.forEach(function(s) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === _billingStatusFilter) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  toolbar.appendChild(statusSelect);

  // Date range
  const dateFromInput = document.createElement('input');
  dateFromInput.type = 'date';
  dateFromInput.className = 'form-control';
  dateFromInput.style.width = 'auto';
  dateFromInput.title = 'From date';
  dateFromInput.value = _billingDateFrom;
  toolbar.appendChild(dateFromInput);

  const dateTo = document.createElement('input');
  dateTo.type = 'date';
  dateTo.className = 'form-control';
  dateTo.style.width = 'auto';
  dateTo.title = 'To date';
  dateTo.value = _billingDateTo;
  toolbar.appendChild(dateTo);

  // New Claim button
  const newClaimBtn = document.createElement('button');
  newClaimBtn.className = 'btn btn-primary btn-sm';
  newClaimBtn.textContent = '+ New Claim';
  newClaimBtn.addEventListener('click', function() { openNewClaimModal(); });
  toolbar.appendChild(newClaimBtn);

  // A/R Aging button
  const arBtn = document.createElement('button');
  arBtn.className = 'btn btn-secondary';
  arBtn.textContent = 'A/R Aging';
  arBtn.addEventListener('click', function() { openARAgingModal(); });
  toolbar.appendChild(arBtn);

  // Dashboard button
  const dashBtn = document.createElement('button');
  dashBtn.className = 'btn btn-secondary';
  dashBtn.textContent = 'Revenue Dashboard';
  dashBtn.addEventListener('click', function() { openBillingDashboardModal(); });
  toolbar.appendChild(dashBtn);

  app.appendChild(toolbar);

  // ===== Claims table =====
  const tableCard = document.createElement('div');
  tableCard.className = 'card';

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';

  const table = document.createElement('table');
  table.className = 'table billing-table';

  const thead = document.createElement('thead');
  thead.innerHTML =
    '<tr>' +
      '<th>Date</th>' +
      '<th>Patient</th>' +
      '<th>Provider</th>' +
      '<th>Status</th>' +
      '<th>Diagnoses</th>' +
      '<th>Charges</th>' +
      '<th>Total</th>' +
      '<th>Actions</th>' +
    '</tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbody.id = 'billing-tbody';
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  tableCard.appendChild(tableWrap);

  // Pagination
  const paginationBar = document.createElement('div');
  paginationBar.className = 'pagination-bar';
  paginationBar.id = 'billing-pagination';
  tableCard.appendChild(paginationBar);

  app.appendChild(tableCard);

  // ===== Wire events =====
  function refresh() {
    _renderBillingRows(tbody, paginationBar);
  }

  searchInput.addEventListener('input', function() {
    _billingSearch = searchInput.value.trim().toLowerCase();
    _billingPage = 1;
    refresh();
  });

  statusSelect.addEventListener('change', function() {
    _billingStatusFilter = statusSelect.value;
    _billingPage = 1;
    refresh();
  });

  dateFromInput.addEventListener('change', function() {
    _billingDateFrom = dateFromInput.value;
    _billingPage = 1;
    refresh();
  });

  dateTo.addEventListener('change', function() {
    _billingDateTo = dateTo.value;
    _billingPage = 1;
    refresh();
  });

  // Initial render
  refresh();
}

/* ---------- Render filtered/paginated rows ---------- */
function _renderBillingRows(tbody, paginationBar) {
  let claims = getClaims();

  // Filter by status
  if (_billingStatusFilter !== 'All') {
    claims = claims.filter(function(c) { return c.status === _billingStatusFilter; });
  }

  // Filter by search
  if (_billingSearch) {
    claims = claims.filter(function(c) {
      const patient = getPatient(c.patientId);
      const patName = patient ? (patient.firstName + ' ' + patient.lastName).toLowerCase() : '';
      const claimId = (c.id || '').toLowerCase();
      return patName.indexOf(_billingSearch) !== -1 || claimId.indexOf(_billingSearch) !== -1;
    });
  }

  // Filter by date range
  if (_billingDateFrom) {
    claims = claims.filter(function(c) {
      const d = (c.serviceDate || c.createdAt || '').slice(0, 10);
      return d >= _billingDateFrom;
    });
  }
  if (_billingDateTo) {
    claims = claims.filter(function(c) {
      const d = (c.serviceDate || c.createdAt || '').slice(0, 10);
      return d <= _billingDateTo;
    });
  }

  // Sort newest first
  claims.sort(function(a, b) {
    const da = a.serviceDate || a.createdAt || '';
    const db = b.serviceDate || b.createdAt || '';
    return db.localeCompare(da);
  });

  const totalCount = claims.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / _BILLING_PAGE_SIZE));
  if (_billingPage > totalPages) _billingPage = totalPages;

  const start = (_billingPage - 1) * _BILLING_PAGE_SIZE;
  const page = claims.slice(start, start + _BILLING_PAGE_SIZE);

  // Render rows
  tbody.innerHTML = '';
  if (page.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.style.textAlign = 'center';
    td.style.padding = '24px';
    td.style.color = 'var(--text-muted)';
    td.textContent = 'No claims found.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    page.forEach(function(claim) {
      const patient = getPatient(claim.patientId);
      const provider = getProvider(claim.providerId);
      const patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
      const provName = provider ? esc(provider.firstName + ' ' + provider.lastName) : '—';
      const dateStr = claim.serviceDate ? formatDateTime(claim.serviceDate) : (claim.createdAt ? formatDateTime(claim.createdAt) : '—');

      // Diagnoses — first 2 ICD-10 codes
      const dxList = (claim.diagnoses || []).slice(0, 2).map(function(dx) {
        return esc(dx.icd10 || '—');
      }).join(', ');
      const dxExtra = (claim.diagnoses || []).length > 2 ? ' +' + ((claim.diagnoses.length) - 2) : '';

      const chargeCount = (claim.charges || []).length;
      const totalCharge = _formatMoney(claim.totalCharge || 0);

      const tr = document.createElement('tr');
      tr.className = 'billing-row-clickable';
      tr.innerHTML =
        '<td>' + esc(dateStr) + '</td>' +
        '<td>' + patName + '</td>' +
        '<td>' + provName + '</td>' +
        '<td>' + _claimStatusBadge(claim.status) + '</td>' +
        '<td>' + (dxList || '—') + esc(dxExtra) + '</td>' +
        '<td>' + chargeCount + '</td>' +
        '<td>' + esc(totalCharge) + '</td>' +
        '<td class="billing-actions-cell"></td>';

      // Click row to open detail
      tr.addEventListener('click', function(e) {
        if (e.target.closest('.billing-actions-cell')) return;
        openClaimDetailModal(claim.id);
      });

      // Actions cell
      const actionsCell = tr.querySelector('.billing-actions-cell');

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-secondary btn-sm';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openClaimDetailModal(claim.id);
      });
      actionsCell.appendChild(viewBtn);

      // Post Payment button
      if (claim.status !== 'Draft' && claim.status !== 'Paid') {
        var pmtBtn = document.createElement('button');
        pmtBtn.className = 'btn btn-sm btn-primary';
        pmtBtn.textContent = 'Pay';
        pmtBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          openPaymentPostingModal(claim.id);
        });
        actionsCell.appendChild(pmtBtn);
      }

      // Status change dropdown
      const statusOptions = _getStatusTransitions(claim.status);
      if (statusOptions.length > 0) {
        const sel = document.createElement('select');
        sel.className = 'form-control billing-status-select';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Change...';
        sel.appendChild(defaultOpt);
        statusOptions.forEach(function(opt) {
          const o = document.createElement('option');
          o.value = opt.status;
          o.textContent = opt.label;
          sel.appendChild(o);
        });
        sel.addEventListener('click', function(e) { e.stopPropagation(); });
        sel.addEventListener('change', function(e) {
          e.stopPropagation();
          const newStatus = sel.value;
          if (!newStatus) return;
          updateClaimStatus(claim.id, newStatus);
          showToast('Claim status updated to ' + newStatus, 'success');
          renderBilling();
        });
        actionsCell.appendChild(sel);
      }

      tbody.appendChild(tr);
    });
  }

  // Render pagination
  paginationBar.innerHTML = '';
  if (totalCount > _BILLING_PAGE_SIZE) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary btn-sm';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = _billingPage <= 1;
    prevBtn.addEventListener('click', function() {
      if (_billingPage > 1) { _billingPage--; _renderBillingRows(tbody, paginationBar); }
    });
    paginationBar.appendChild(prevBtn);

    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = 'Page ' + _billingPage + ' of ' + totalPages + ' \u00B7 Showing ' + (start + 1) + '\u2013' + Math.min(start + _BILLING_PAGE_SIZE, totalCount) + ' of ' + totalCount;
    paginationBar.appendChild(pageInfo);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary btn-sm';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = _billingPage >= totalPages;
    nextBtn.addEventListener('click', function() {
      if (_billingPage < totalPages) { _billingPage++; _renderBillingRows(tbody, paginationBar); }
    });
    paginationBar.appendChild(nextBtn);
  } else if (totalCount > 0) {
    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = totalCount + ' claim' + (totalCount !== 1 ? 's' : '');
    paginationBar.appendChild(info);
  }
}

/* ---------- Status transition map ---------- */
function _getStatusTransitions(status) {
  switch (status) {
    case 'Draft':     return [{ status: 'Ready', label: 'Mark Ready' }];
    case 'Ready':     return [{ status: 'Submitted', label: 'Submit Claim' }, { status: 'Draft', label: 'Back to Draft' }];
    case 'Submitted': return [{ status: 'Accepted', label: 'Mark Accepted' }, { status: 'Denied', label: 'Mark Denied' }];
    case 'Denied':    return [{ status: 'Appealed', label: 'Appeal' }];
    case 'Accepted':  return [{ status: 'Paid', label: 'Mark Paid' }];
    default:          return [];
  }
}

/* ============================================================
   CLAIM DETAIL MODAL
   ============================================================ */
function openClaimDetailModal(claimId) {
  const claim = getClaim(claimId);
  if (!claim) { showToast('Claim not found', 'error'); return; }

  const patient = getPatient(claim.patientId);
  const provider = getProvider(claim.providerId);
  const isDraft = claim.status === 'Draft';

  // Build body HTML
  let body = '';

  // Header info
  body += '<div class="billing-detail-header">';
  body += '<div><strong>Claim ID:</strong> ' + esc(claim.id) + '</div>';
  body += '<div><strong>Status:</strong> ' + _claimStatusBadge(claim.status) + '</div>';
  body += '<div><strong>Created:</strong> ' + (claim.createdAt ? esc(formatDateTime(claim.createdAt)) : '—') + '</div>';
  if (claim.submittedDate) body += '<div><strong>Submitted:</strong> ' + esc(formatDateTime(claim.submittedDate)) + '</div>';
  if (claim.adjudicatedDate) body += '<div><strong>Adjudicated:</strong> ' + esc(formatDateTime(claim.adjudicatedDate)) + '</div>';
  body += '</div>';

  // Patient info
  body += '<div class="billing-detail-section">';
  body += '<h4>Patient</h4>';
  if (patient) {
    body += '<div>' + esc(patient.firstName + ' ' + patient.lastName) + '</div>';
    if (patient.dateOfBirth) body += '<div>DOB: ' + esc(patient.dateOfBirth) + '</div>';
    if (patient.insurance) body += '<div>Insurance: ' + esc(patient.insurance) + '</div>';
  } else {
    body += '<div>Unknown Patient</div>';
  }
  body += '</div>';

  // Provider info
  body += '<div class="billing-detail-section">';
  body += '<h4>Provider</h4>';
  if (provider) {
    body += '<div>' + esc(provider.firstName + ' ' + provider.lastName + ', ' + (provider.degree || '')) + '</div>';
  } else {
    body += '<div>—</div>';
  }
  body += '</div>';

  // Place of service
  body += '<div class="billing-detail-section">';
  body += '<h4>Place of Service</h4>';
  if (isDraft) {
    const posOpts = Object.keys(PLACE_OF_SERVICE).map(function(code) {
      return '<option value="' + esc(code) + '"' + (claim.placeOfService === code ? ' selected' : '') + '>' + esc(code + ' — ' + PLACE_OF_SERVICE[code]) + '</option>';
    }).join('');
    body += '<select class="form-control" id="claim-pos">' + posOpts + '</select>';
  } else {
    const posLabel = PLACE_OF_SERVICE[claim.placeOfService] || claim.placeOfService || '—';
    body += '<div>' + esc((claim.placeOfService || '') + ' — ' + posLabel) + '</div>';
  }
  body += '</div>';

  // Payer
  body += '<div class="billing-detail-section">';
  body += '<h4>Payer</h4>';
  if (isDraft) {
    body += '<input class="form-control" id="claim-payer" value="' + esc(claim.payerName || '') + '" placeholder="Insurance / Payer name">';
  } else {
    body += '<div>' + esc(claim.payerName || '—') + '</div>';
  }
  body += '</div>';

  // Diagnoses table
  body += '<div class="billing-detail-section">';
  body += '<h4>Diagnoses</h4>';
  body += '<div class="table-wrap"><table class="table billing-dx-table">';
  body += '<thead><tr><th>Rank</th><th>ICD-10 Code</th><th>Description</th>';
  if (isDraft) body += '<th></th>';
  body += '</tr></thead><tbody id="claim-dx-tbody">';
  (claim.diagnoses || []).forEach(function(dx, i) {
    body += '<tr data-dx-idx="' + i + '">';
    body += '<td>' + (dx.rank || i + 1) + '</td>';
    if (isDraft) {
      body += '<td><input class="form-control billing-dx-code" value="' + esc(dx.icd10 || '') + '" data-idx="' + i + '"></td>';
      body += '<td><input class="form-control billing-dx-desc" value="' + esc(dx.description || '') + '" data-idx="' + i + '"></td>';
      body += '<td><button class="btn btn-danger btn-sm billing-remove-dx" data-idx="' + i + '">x</button></td>';
    } else {
      body += '<td>' + esc(dx.icd10 || '—') + '</td>';
      body += '<td>' + esc(dx.description || '—') + '</td>';
    }
    body += '</tr>';
  });
  body += '</tbody></table></div>';
  if (isDraft) {
    body += '<button class="btn btn-secondary btn-sm" id="claim-add-dx" style="margin-top:6px;">+ Add Diagnosis</button>';
  }
  body += '</div>';

  // Charges / line items table
  body += '<div class="billing-detail-section">';
  body += '<h4>Charges / Line Items</h4>';
  body += '<div class="table-wrap"><table class="table billing-charges-table">';
  body += '<thead><tr><th>CPT Code</th><th>Description</th><th>Units</th><th>Unit Charge ($)</th><th>Modifiers</th><th>Dx Pointers</th><th>Line Total ($)</th>';
  if (isDraft) body += '<th></th>';
  body += '</tr></thead><tbody id="claim-charges-tbody">';
  (claim.charges || []).forEach(function(ch, i) {
    const lineTotal = (parseFloat(ch.units) || 1) * (parseFloat(ch.unitCharge) || 0);
    body += '<tr data-ch-idx="' + i + '">';
    if (isDraft) {
      body += '<td><input class="form-control billing-ch-cpt" value="' + esc(ch.cptCode || '') + '" data-idx="' + i + '"></td>';
      body += '<td><input class="form-control billing-ch-desc" value="' + esc(ch.description || '') + '" data-idx="' + i + '"></td>';
      body += '<td><input class="form-control billing-ch-units" type="number" min="1" value="' + (ch.units || 1) + '" data-idx="' + i + '" style="width:60px;"></td>';
      body += '<td><input class="form-control billing-ch-charge" type="number" step="0.01" value="' + (ch.unitCharge || 0) + '" data-idx="' + i + '" style="width:90px;"></td>';
      body += '<td><input class="form-control billing-ch-mod" value="' + esc((ch.modifiers || []).join(', ')) + '" data-idx="' + i + '" placeholder="25, 59..."></td>';
      body += '<td><input class="form-control billing-ch-dxp" value="' + esc((ch.diagnosisPointers || []).join(', ')) + '" data-idx="' + i + '" placeholder="1, 2..."></td>';
      body += '<td>' + esc(_formatMoney(lineTotal)) + '</td>';
      body += '<td><button class="btn btn-danger btn-sm billing-remove-ch" data-idx="' + i + '">x</button></td>';
    } else {
      body += '<td>' + esc(ch.cptCode || '—') + '</td>';
      body += '<td>' + esc(ch.description || '—') + '</td>';
      body += '<td>' + (ch.units || 1) + '</td>';
      body += '<td>' + esc(_formatMoney(ch.unitCharge || 0)) + '</td>';
      body += '<td>' + esc((ch.modifiers || []).join(', ') || '—') + '</td>';
      body += '<td>' + esc((ch.diagnosisPointers || []).join(', ') || '—') + '</td>';
      body += '<td>' + esc(_formatMoney(lineTotal)) + '</td>';
    }
    body += '</tr>';
  });
  body += '</tbody></table></div>';
  if (isDraft) {
    body += '<button class="btn btn-secondary btn-sm" id="claim-add-charge" style="margin-top:6px;">+ Add Line Item</button>';
  }
  body += '</div>';

  // Totals section
  body += '<div class="billing-detail-totals">';
  body += '<div><strong>Total Charge:</strong> ' + esc(_formatMoney(claim.totalCharge || 0)) + '</div>';
  body += '<div><strong>Allowed Amount:</strong> ' + esc(_formatMoney(claim.allowedAmount || 0)) + '</div>';
  body += '<div><strong>Paid Amount:</strong> ' + esc(_formatMoney(claim.paidAmount || 0)) + '</div>';
  body += '<div><strong>Patient Responsibility:</strong> ' + esc(_formatMoney(claim.patientResponsibility || 0)) + '</div>';
  body += '</div>';

  // Footer buttons
  let footer = '<button class="btn btn-ghost" onclick="closeModal()">Close</button>';

  if (isDraft) {
    footer += '<button class="btn btn-primary" id="claim-save-draft">Save Changes</button>';
    footer += '<button class="btn btn-success" id="claim-mark-ready">Mark Ready</button>';
    footer += '<button class="btn btn-danger" id="claim-delete">Delete</button>';
  } else if (claim.status === 'Ready') {
    footer += '<button class="btn btn-success" id="claim-submit">Submit Claim</button>';
    footer += '<button class="btn btn-secondary" id="claim-back-draft">Back to Draft</button>';
  } else if (claim.status === 'Submitted') {
    footer += '<button class="btn btn-success" id="claim-mark-accepted">Mark Accepted</button>';
    footer += '<button class="btn btn-danger" id="claim-mark-denied">Mark Denied</button>';
  } else if (claim.status === 'Denied') {
    footer += '<button class="btn btn-primary" id="claim-appeal">Appeal</button>';
    footer += '<button class="btn btn-danger" id="claim-delete">Delete</button>';
  } else if (claim.status === 'Accepted') {
    footer += '<button class="btn btn-success" id="claim-mark-paid">Mark Paid</button>';
  }

  openModal({ title: 'Claim Detail', bodyHTML: body, footerHTML: footer, size: 'lg' });

  // ===== Wire modal events =====

  // Draft: save changes
  const saveBtn = document.getElementById('claim-save-draft');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      _saveClaimEdits(claim);
      showToast('Claim saved', 'success');
      closeModal();
      renderBilling();
    });
  }

  // Draft: add diagnosis
  const addDxBtn = document.getElementById('claim-add-dx');
  if (addDxBtn) {
    addDxBtn.addEventListener('click', function() {
      _saveClaimEdits(claim);
      claim.diagnoses = claim.diagnoses || [];
      claim.diagnoses.push({ icd10: '', description: '', rank: claim.diagnoses.length + 1 });
      saveClaim(claim);
      closeModal();
      openClaimDetailModal(claim.id);
    });
  }

  // Draft: remove diagnosis
  document.querySelectorAll('.billing-remove-dx').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      _saveClaimEdits(claim);
      claim.diagnoses.splice(idx, 1);
      // Re-rank
      claim.diagnoses.forEach(function(dx, i) { dx.rank = i + 1; });
      saveClaim(claim);
      closeModal();
      openClaimDetailModal(claim.id);
    });
  });

  // Draft: add charge
  const addChBtn = document.getElementById('claim-add-charge');
  if (addChBtn) {
    addChBtn.addEventListener('click', function() {
      _saveClaimEdits(claim);
      claim.charges = claim.charges || [];
      claim.charges.push({ cptCode: '', description: '', units: 1, unitCharge: 0, modifiers: [], diagnosisPointers: [1] });
      saveClaim(claim);
      closeModal();
      openClaimDetailModal(claim.id);
    });
  }

  // Draft: remove charge
  document.querySelectorAll('.billing-remove-ch').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      _saveClaimEdits(claim);
      claim.charges.splice(idx, 1);
      saveClaim(claim);
      closeModal();
      openClaimDetailModal(claim.id);
    });
  });

  // Status transition buttons
  _wireStatusBtn('claim-mark-ready', claim.id, 'Ready');
  _wireStatusBtn('claim-submit', claim.id, 'Submitted');
  _wireStatusBtn('claim-back-draft', claim.id, 'Draft');
  _wireStatusBtn('claim-mark-accepted', claim.id, 'Accepted');
  _wireStatusBtn('claim-mark-denied', claim.id, 'Denied');
  _wireStatusBtn('claim-appeal', claim.id, 'Appealed');
  _wireStatusBtn('claim-mark-paid', claim.id, 'Paid');

  // Delete button
  const delBtn = document.getElementById('claim-delete');
  if (delBtn) {
    delBtn.addEventListener('click', function() {
      deleteClaim(claim.id);
      showToast('Claim deleted', 'success');
      closeModal();
      renderBilling();
    });
  }
}

/* ---------- Save editable fields from detail modal ---------- */
function _saveClaimEdits(claim) {
  // Place of service
  const posEl = document.getElementById('claim-pos');
  if (posEl) claim.placeOfService = posEl.value;

  // Payer
  const payerEl = document.getElementById('claim-payer');
  if (payerEl) claim.payerName = payerEl.value.trim();

  // Diagnoses
  document.querySelectorAll('.billing-dx-code').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.diagnoses && claim.diagnoses[idx]) {
      claim.diagnoses[idx].icd10 = input.value.trim();
    }
  });
  document.querySelectorAll('.billing-dx-desc').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.diagnoses && claim.diagnoses[idx]) {
      claim.diagnoses[idx].description = input.value.trim();
    }
  });

  // Charges
  document.querySelectorAll('.billing-ch-cpt').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.charges && claim.charges[idx]) {
      claim.charges[idx].cptCode = input.value.trim();
    }
  });
  document.querySelectorAll('.billing-ch-desc').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.charges && claim.charges[idx]) {
      claim.charges[idx].description = input.value.trim();
    }
  });
  document.querySelectorAll('.billing-ch-units').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.charges && claim.charges[idx]) {
      claim.charges[idx].units = parseInt(input.value) || 1;
    }
  });
  document.querySelectorAll('.billing-ch-charge').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.charges && claim.charges[idx]) {
      claim.charges[idx].unitCharge = parseFloat(input.value) || 0;
    }
  });
  document.querySelectorAll('.billing-ch-mod').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.charges && claim.charges[idx]) {
      claim.charges[idx].modifiers = input.value.split(',').map(function(m) { return m.trim(); }).filter(Boolean);
    }
  });
  document.querySelectorAll('.billing-ch-dxp').forEach(function(input) {
    const idx = parseInt(input.getAttribute('data-idx'));
    if (claim.charges && claim.charges[idx]) {
      claim.charges[idx].diagnosisPointers = input.value.split(',').map(function(p) { return parseInt(p.trim()); }).filter(function(n) { return !isNaN(n); });
    }
  });

  // Recalculate total charge
  let total = 0;
  (claim.charges || []).forEach(function(ch) {
    total += (parseFloat(ch.units) || 1) * (parseFloat(ch.unitCharge) || 0);
  });
  claim.totalCharge = total;

  saveClaim(claim);
}

/* ---------- Wire status transition button ---------- */
function _wireStatusBtn(elementId, claimId, newStatus) {
  const btn = document.getElementById(elementId);
  if (!btn) return;
  btn.addEventListener('click', function() {
    // If Draft, save edits first
    if (newStatus === 'Ready') {
      const claim = getClaim(claimId);
      if (claim && claim.status === 'Draft') _saveClaimEdits(claim);
    }
    updateClaimStatus(claimId, newStatus);
    showToast('Claim status updated to ' + newStatus, 'success');
    closeModal();
    renderBilling();
  });
}

/* ============================================================
   NEW CLAIM MODAL
   ============================================================ */
function openNewClaimModal() {
  let body = '';

  // Patient picker
  body += '<div class="form-group">';
  body += '<label class="form-label">Patient</label>';
  body += '<input class="form-control" id="new-claim-patient-search" placeholder="Search by name or MRN..." autocomplete="off">';
  body += '<div id="new-claim-patient-results" class="billing-search-results"></div>';
  body += '<input type="hidden" id="new-claim-patient-id">';
  body += '</div>';

  // Encounter picker
  body += '<div class="form-group">';
  body += '<label class="form-label">Encounter</label>';
  body += '<select class="form-control" id="new-claim-encounter" disabled><option value="">— Select patient first —</option></select>';
  body += '</div>';

  // Generate from encounter
  body += '<div class="form-group">';
  body += '<button class="btn btn-primary btn-sm" id="new-claim-generate" disabled>Generate from Encounter</button>';
  body += '</div>';

  body += '<hr style="margin:16px 0;border:none;border-top:1px solid var(--border);">';
  body += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Or create manually:</p>';

  // Payer
  body += '<div class="form-group">';
  body += '<label class="form-label">Payer</label>';
  body += '<input class="form-control" id="new-claim-payer" placeholder="Insurance / Payer name">';
  body += '</div>';

  // Place of service
  body += '<div class="form-group">';
  body += '<label class="form-label">Place of Service</label>';
  const posOpts = Object.keys(PLACE_OF_SERVICE).map(function(code) {
    return '<option value="' + esc(code) + '">' + esc(code + ' — ' + PLACE_OF_SERVICE[code]) + '</option>';
  }).join('');
  body += '<select class="form-control" id="new-claim-pos">' + posOpts + '</select>';
  body += '</div>';

  // Diagnoses
  body += '<div class="form-group">';
  body += '<label class="form-label">Diagnoses</label>';
  body += '<div id="new-claim-dx-list"></div>';
  body += '<button class="btn btn-secondary btn-sm" id="new-claim-add-dx" style="margin-top:4px;">+ Add Diagnosis</button>';
  body += '</div>';

  // Charges
  body += '<div class="form-group">';
  body += '<label class="form-label">Charges</label>';
  body += '<div id="new-claim-ch-list"></div>';
  body += '<button class="btn btn-secondary btn-sm" id="new-claim-add-ch" style="margin-top:4px;">+ Add Charge</button>';
  body += '</div>';

  const footer = '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>' +
                 '<button class="btn btn-primary" id="new-claim-save" disabled>Save Claim</button>';

  openModal({ title: 'New Claim', bodyHTML: body, footerHTML: footer, size: 'lg' });

  // ===== Wire events =====
  let _selectedPatientId = null;
  let _dxRows = [];
  let _chRows = [];

  const patSearch = document.getElementById('new-claim-patient-search');
  const patResults = document.getElementById('new-claim-patient-results');
  const patIdInput = document.getElementById('new-claim-patient-id');
  const encSelect = document.getElementById('new-claim-encounter');
  const generateBtn = document.getElementById('new-claim-generate');
  const saveBtn = document.getElementById('new-claim-save');

  // Patient search
  patSearch.addEventListener('input', function() {
    const q = patSearch.value.trim().toLowerCase();
    patResults.innerHTML = '';
    if (q.length < 2) return;

    const matches = getPatients().filter(function(p) {
      const name = (p.firstName + ' ' + p.lastName).toLowerCase();
      const mrn = (p.mrn || '').toLowerCase();
      return name.indexOf(q) !== -1 || mrn.indexOf(q) !== -1;
    }).slice(0, 8);

    matches.forEach(function(p) {
      const row = document.createElement('div');
      row.className = 'billing-search-result-item';
      row.textContent = p.firstName + ' ' + p.lastName + (p.mrn ? ' (MRN: ' + p.mrn + ')' : '');
      row.addEventListener('click', function() {
        _selectedPatientId = p.id;
        patIdInput.value = p.id;
        patSearch.value = p.firstName + ' ' + p.lastName;
        patResults.innerHTML = '';
        _loadEncounters(p.id);
        saveBtn.disabled = false;
      });
      patResults.appendChild(row);
    });
  });

  // Load encounters for selected patient
  function _loadEncounters(patientId) {
    encSelect.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '— Select encounter —';
    encSelect.appendChild(defaultOpt);

    const encounters = getEncounters().filter(function(e) { return e.patientId === patientId; });
    const existingClaimEncIds = new Set(getClaimsByPatient(patientId).map(function(c) { return c.encounterId; }));
    const available = encounters.filter(function(e) { return !existingClaimEncIds.has(e.id); });

    available.forEach(function(e) {
      const opt = document.createElement('option');
      opt.value = e.id;
      const dateStr = e.dateTime ? formatDateTime(e.dateTime) : '—';
      opt.textContent = dateStr + ' — ' + (e.visitType || 'Visit') + (e.visitSubtype ? ' / ' + e.visitSubtype : '');
      encSelect.appendChild(opt);
    });

    encSelect.disabled = available.length === 0;
    generateBtn.disabled = available.length === 0;
  }

  // Generate from encounter
  generateBtn.addEventListener('click', function() {
    const encId = encSelect.value;
    if (!encId) { showToast('Select an encounter first', 'warning'); return; }

    const result = generateClaimFromEncounter(encId);
    if (result && result.error) {
      showToast(result.errors.join(', '), 'error');
      return;
    }

    showToast('Claim generated from encounter', 'success');
    closeModal();
    renderBilling();
  });

  // Add diagnosis row
  function _renderNewDxRows() {
    const list = document.getElementById('new-claim-dx-list');
    list.innerHTML = '';
    _dxRows.forEach(function(dx, i) {
      const row = document.createElement('div');
      row.className = 'billing-inline-row';
      row.innerHTML =
        '<input class="form-control" placeholder="ICD-10" value="' + esc(dx.icd10) + '" data-field="icd10" data-idx="' + i + '" style="flex:1;">' +
        '<input class="form-control" placeholder="Description" value="' + esc(dx.description) + '" data-field="desc" data-idx="' + i + '" style="flex:2;">' +
        '<button class="btn btn-danger btn-sm" data-remove-dx="' + i + '">x</button>';
      list.appendChild(row);
    });

    // Wire remove buttons
    list.querySelectorAll('[data-remove-dx]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _dxRows.splice(parseInt(btn.getAttribute('data-remove-dx')), 1);
        _renderNewDxRows();
      });
    });
  }

  document.getElementById('new-claim-add-dx').addEventListener('click', function() {
    _dxRows.push({ icd10: '', description: '' });
    _renderNewDxRows();
  });

  // Add charge row
  function _renderNewChRows() {
    const list = document.getElementById('new-claim-ch-list');
    list.innerHTML = '';
    _chRows.forEach(function(ch, i) {
      const row = document.createElement('div');
      row.className = 'billing-inline-row';
      row.innerHTML =
        '<input class="form-control" placeholder="CPT" value="' + esc(ch.cptCode) + '" data-field="cpt" data-idx="' + i + '" style="flex:1;">' +
        '<input class="form-control" placeholder="Description" value="' + esc(ch.description) + '" data-field="desc" data-idx="' + i + '" style="flex:2;">' +
        '<input class="form-control" type="number" placeholder="Units" value="' + (ch.units || 1) + '" data-field="units" data-idx="' + i + '" style="width:60px;">' +
        '<input class="form-control" type="number" step="0.01" placeholder="Charge" value="' + (ch.unitCharge || 0) + '" data-field="charge" data-idx="' + i + '" style="width:90px;">' +
        '<button class="btn btn-danger btn-sm" data-remove-ch="' + i + '">x</button>';
      list.appendChild(row);
    });

    // Wire remove buttons
    list.querySelectorAll('[data-remove-ch]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _chRows.splice(parseInt(btn.getAttribute('data-remove-ch')), 1);
        _renderNewChRows();
      });
    });
  }

  document.getElementById('new-claim-add-ch').addEventListener('click', function() {
    _chRows.push({ cptCode: '', description: '', units: 1, unitCharge: 0 });
    _renderNewChRows();
  });

  // Save manual claim
  saveBtn.addEventListener('click', function() {
    if (!_selectedPatientId) { showToast('Select a patient', 'warning'); return; }

    // Read dx rows from DOM
    const dxList = document.getElementById('new-claim-dx-list');
    const diagnoses = [];
    dxList.querySelectorAll('[data-field="icd10"]').forEach(function(input) {
      const idx = parseInt(input.getAttribute('data-idx'));
      const descInput = dxList.querySelector('[data-field="desc"][data-idx="' + idx + '"]');
      diagnoses.push({
        icd10: input.value.trim(),
        description: descInput ? descInput.value.trim() : '',
        rank: idx + 1,
      });
    });

    // Read charge rows from DOM
    const chList = document.getElementById('new-claim-ch-list');
    const charges = [];
    chList.querySelectorAll('[data-field="cpt"]').forEach(function(input) {
      const idx = parseInt(input.getAttribute('data-idx'));
      const descInput = chList.querySelector('[data-field="desc"][data-idx="' + idx + '"]');
      const unitsInput = chList.querySelector('[data-field="units"][data-idx="' + idx + '"]');
      const chargeInput = chList.querySelector('[data-field="charge"][data-idx="' + idx + '"]');
      charges.push({
        cptCode: input.value.trim(),
        description: descInput ? descInput.value.trim() : '',
        units: unitsInput ? parseInt(unitsInput.value) || 1 : 1,
        unitCharge: chargeInput ? parseFloat(chargeInput.value) || 0 : 0,
        modifiers: [],
        diagnosisPointers: [1],
      });
    });

    let totalCharge = 0;
    charges.forEach(function(ch) { totalCharge += (ch.units || 1) * (ch.unitCharge || 0); });

    const encId = encSelect.value || null;
    const result = saveClaim({
      encounterId: encId,
      patientId: _selectedPatientId,
      providerId: getSessionUser() ? getSessionUser().id : null,
      payerName: document.getElementById('new-claim-payer').value.trim(),
      placeOfService: document.getElementById('new-claim-pos').value,
      diagnoses: diagnoses,
      charges: charges,
      totalCharge: totalCharge,
      serviceDate: new Date().toISOString(),
    });

    if (result && result.error) {
      showToast('Error: ' + (result.errors || []).join(', '), 'error');
      return;
    }

    showToast('Claim created', 'success');
    closeModal();
    renderBilling();
  });
}

/* ============================================================
   SUPERBILL MODAL — Quick claim from encounter
   ============================================================ */
function openSuperbillModal(encounterId) {
  const encounter = getEncounter(encounterId);
  if (!encounter) { showToast('Encounter not found', 'error'); return; }

  const patient = getPatient(encounter.patientId);
  const provider = getProvider(encounter.providerId);

  // Check if claim already exists
  const existingClaims = getClaimsByEncounter(encounterId);
  if (existingClaims.length > 0) {
    showToast('A claim already exists for this encounter', 'warning');
    openClaimDetailModal(existingClaims[0].id);
    return;
  }

  const patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
  const provName = provider ? esc(provider.firstName + ' ' + provider.lastName + ', ' + (provider.degree || '')) : '—';
  const dateStr = encounter.dateTime ? formatDateTime(encounter.dateTime) : '—';

  let body = '';

  // Encounter context
  body += '<div class="billing-detail-header">';
  body += '<div><strong>Patient:</strong> ' + patName + '</div>';
  body += '<div><strong>Provider:</strong> ' + provName + '</div>';
  body += '<div><strong>Date:</strong> ' + esc(dateStr) + '</div>';
  body += '<div><strong>Visit Type:</strong> ' + esc(encounter.visitType || '—') + (encounter.visitSubtype ? ' / ' + esc(encounter.visitSubtype) : '') + '</div>';
  body += '</div>';

  // Determine place of service
  let pos = '11';
  if (encounter.visitType === 'Inpatient' || encounter.visitType === 'ICU') pos = '21';
  else if (encounter.visitType === 'ED' || encounter.visitType === 'Emergency') pos = '23';

  // Place of service
  body += '<div class="form-group">';
  body += '<label class="form-label">Place of Service</label>';
  const posOpts = Object.keys(PLACE_OF_SERVICE).map(function(code) {
    return '<option value="' + esc(code) + '"' + (code === pos ? ' selected' : '') + '>' + esc(code + ' — ' + PLACE_OF_SERVICE[code]) + '</option>';
  }).join('');
  body += '<select class="form-control" id="sb-pos">' + posOpts + '</select>';
  body += '</div>';

  // Payer
  body += '<div class="form-group">';
  body += '<label class="form-label">Payer</label>';
  body += '<input class="form-control" id="sb-payer" value="' + esc(patient ? patient.insurance || '' : '') + '">';
  body += '</div>';

  // Diagnoses from encounter
  const encDx = (encounter.diagnoses || []);
  body += '<div class="form-group">';
  body += '<label class="form-label">Diagnoses</label>';
  body += '<div class="table-wrap"><table class="table">';
  body += '<thead><tr><th>Rank</th><th>ICD-10 Code</th><th>Description</th></tr></thead><tbody>';
  if (encDx.length === 0) {
    body += '<tr><td colspan="3" style="color:var(--text-muted);">No diagnoses on encounter</td></tr>';
  }
  encDx.forEach(function(dx, i) {
    body += '<tr>';
    body += '<td>' + (i + 1) + '</td>';
    body += '<td><input class="form-control sb-dx-code" value="' + esc(dx.code || dx.icd10 || '') + '" data-idx="' + i + '"></td>';
    body += '<td><input class="form-control sb-dx-desc" value="' + esc(dx.name || dx.description || '') + '" data-idx="' + i + '"></td>';
    body += '</tr>';
  });
  body += '</tbody></table></div>';
  body += '</div>';

  // CPT codes from encounter
  const encCpt = (encounter.cptCodes || []);
  body += '<div class="form-group">';
  body += '<label class="form-label">CPT Codes / Charges</label>';
  body += '<div class="table-wrap"><table class="table">';
  body += '<thead><tr><th>CPT Code</th><th>Description</th><th>Units</th><th>Unit Charge ($)</th></tr></thead><tbody>';
  if (encCpt.length === 0) {
    body += '<tr><td colspan="4" style="color:var(--text-muted);">No CPT codes on encounter</td></tr>';
  }
  encCpt.forEach(function(cpt, i) {
    const code = typeof cpt === 'string' ? cpt : (cpt.code || '');
    const desc = typeof cpt === 'string' ? '' : (cpt.description || '');
    body += '<tr>';
    body += '<td><input class="form-control sb-cpt-code" value="' + esc(code) + '" data-idx="' + i + '"></td>';
    body += '<td><input class="form-control sb-cpt-desc" value="' + esc(desc) + '" data-idx="' + i + '"></td>';
    body += '<td><input class="form-control sb-cpt-units" type="number" min="1" value="1" data-idx="' + i + '" style="width:60px;"></td>';
    body += '<td><input class="form-control sb-cpt-charge" type="number" step="0.01" value="0" data-idx="' + i + '" style="width:90px;"></td>';
    body += '</tr>';
  });
  body += '</tbody></table></div>';
  body += '</div>';

  const footer = '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>' +
                 '<button class="btn btn-success" id="sb-generate">Generate Claim</button>';

  openModal({ title: 'Superbill — Generate Claim', bodyHTML: body, footerHTML: footer, size: 'lg' });

  // Wire generate button
  document.getElementById('sb-generate').addEventListener('click', function() {
    // Build diagnoses
    const diagnoses = [];
    document.querySelectorAll('.sb-dx-code').forEach(function(input) {
      const idx = parseInt(input.getAttribute('data-idx'));
      const descInput = document.querySelector('.sb-dx-desc[data-idx="' + idx + '"]');
      const code = input.value.trim();
      if (code) {
        diagnoses.push({
          icd10: code,
          description: descInput ? descInput.value.trim() : '',
          rank: diagnoses.length + 1,
        });
      }
    });

    // Build charges
    const charges = [];
    let totalCharge = 0;
    document.querySelectorAll('.sb-cpt-code').forEach(function(input) {
      const idx = parseInt(input.getAttribute('data-idx'));
      const descInput = document.querySelector('.sb-cpt-desc[data-idx="' + idx + '"]');
      const unitsInput = document.querySelector('.sb-cpt-units[data-idx="' + idx + '"]');
      const chargeInput = document.querySelector('.sb-cpt-charge[data-idx="' + idx + '"]');
      const code = input.value.trim();
      if (code) {
        const units = unitsInput ? parseInt(unitsInput.value) || 1 : 1;
        const unitCharge = chargeInput ? parseFloat(chargeInput.value) || 0 : 0;
        totalCharge += units * unitCharge;
        charges.push({
          cptCode: code,
          description: descInput ? descInput.value.trim() : '',
          units: units,
          unitCharge: unitCharge,
          modifiers: [],
          diagnosisPointers: [1],
        });
      }
    });

    const result = saveClaim({
      encounterId: encounterId,
      patientId: encounter.patientId,
      providerId: encounter.providerId,
      payerName: document.getElementById('sb-payer').value.trim(),
      placeOfService: document.getElementById('sb-pos').value,
      serviceDate: encounter.dateTime || new Date().toISOString(),
      diagnoses: diagnoses,
      charges: charges,
      totalCharge: totalCharge,
    });

    if (result && result.error) {
      showToast('Error: ' + (result.errors || []).join(', '), 'error');
      return;
    }

    showToast('Claim generated from superbill', 'success');
    closeModal();

    // If on billing page, refresh it
    if (typeof renderBilling === 'function' && window.location.hash === '#billing') {
      renderBilling();
    }
  });
}

/* ============================================================
   PAYMENT POSTING MODAL
   ============================================================ */
function openPaymentPostingModal(claimId) {
  const claim = getClaim(claimId);
  if (!claim) { showToast('Claim not found', 'error'); return; }
  const patient = loadAll(KEYS.patients).find(function(p) { return p.id === claim.patientId; });
  const patientName = patient ? esc(patient.lastName + ', ' + patient.firstName) : 'Unknown';
  const balance = (parseFloat(claim.totalCharge) || 0) - (parseFloat(claim.totalPaid) || 0) - (parseFloat(claim.totalAdjustment) || 0);

  let bodyHTML = '<div style="margin-bottom:16px;">' +
    '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
    '<div><strong>Patient:</strong> ' + patientName + '</div>' +
    '<div><strong>Claim:</strong> ' + esc(claim.id.slice(0, 8)) + '</div>' +
    '<div><strong>Charged:</strong> ' + _formatMoney(claim.totalCharge) + '</div>' +
    '<div><strong>Paid:</strong> ' + _formatMoney(claim.totalPaid || 0) + '</div>' +
    '<div><strong>Balance:</strong> ' + _formatMoney(balance) + '</div>' +
    '</div></div>';

  bodyHTML += '<h4 style="margin-bottom:8px;">Post Payment</h4>';
  bodyHTML += '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">Payment Type</label>' +
    '<select id="pmt-type" class="form-control"><option value="Insurance">Insurance (ERA/EOB)</option>' +
    '<option value="Patient">Patient Payment</option><option value="Adjustment">Adjustment</option>' +
    '<option value="WriteOff">Write-Off</option></select></div>' +
    '<div class="form-group"><label class="form-label">Amount</label>' +
    '<input type="number" id="pmt-amount" class="form-control" step="0.01" min="0" placeholder="0.00" /></div>' +
    '</div>';

  bodyHTML += '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">Date</label>' +
    '<input type="date" id="pmt-date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '<div class="form-group"><label class="form-label">Reference / Check #</label>' +
    '<input type="text" id="pmt-ref" class="form-control" placeholder="Check #, ERA trace" /></div>' +
    '</div>';

  bodyHTML += '<div class="form-group"><label class="form-label">Notes</label>' +
    '<textarea id="pmt-notes" class="form-control" rows="2" placeholder="Payment notes..."></textarea></div>';

  // Adjustment reason codes (shown for adjustments/write-offs)
  bodyHTML += '<div id="pmt-reason-wrap" class="form-group hidden">' +
    '<label class="form-label">Reason Code</label>' +
    '<select id="pmt-reason" class="form-control">' +
    '<option value="">Select reason...</option>' +
    '<option value="CO-45">CO-45: Charge exceeds fee schedule</option>' +
    '<option value="CO-97">CO-97: Payment adjusted (already paid)</option>' +
    '<option value="PR-1">PR-1: Deductible amount</option>' +
    '<option value="PR-2">PR-2: Coinsurance amount</option>' +
    '<option value="PR-3">PR-3: Copay amount</option>' +
    '<option value="OA-23">OA-23: Payment adjusted (auth not obtained)</option>' +
    '<option value="WO">WO: Write-off (uncollectible)</option>' +
    '<option value="Charity">Charity care</option>' +
    '</select></div>';

  // Payment history
  const payments = (claim.payments || []);
  if (payments.length > 0) {
    bodyHTML += '<h4 style="margin:16px 0 8px;">Payment History</h4>';
    bodyHTML += '<table class="table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Ref</th><th>Notes</th></tr></thead><tbody>';
    payments.forEach(function(p) {
      bodyHTML += '<tr><td>' + esc(p.date || '') + '</td><td>' + esc(p.type) + '</td>' +
        '<td>' + _formatMoney(p.amount) + '</td><td>' + esc(p.reference || '') + '</td>' +
        '<td>' + esc(p.notes || '') + '</td></tr>';
    });
    bodyHTML += '</tbody></table>';
  }

  const footerHTML = '<button class="btn btn-primary" id="pmt-save">Post Payment</button>' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>';

  openModal({ title: 'Payment Posting', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  setTimeout(function() {
    var typeSelect = document.getElementById('pmt-type');
    var reasonWrap = document.getElementById('pmt-reason-wrap');
    typeSelect.addEventListener('change', function() {
      reasonWrap.classList.toggle('hidden', typeSelect.value !== 'Adjustment' && typeSelect.value !== 'WriteOff');
    });

    document.getElementById('pmt-save').addEventListener('click', function() {
      var amount = parseFloat(document.getElementById('pmt-amount').value);
      if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

      var payment = {
        id: generateId(),
        type: typeSelect.value,
        amount: amount,
        date: document.getElementById('pmt-date').value,
        reference: document.getElementById('pmt-ref').value.trim(),
        notes: document.getElementById('pmt-notes').value.trim(),
        reasonCode: document.getElementById('pmt-reason').value || null,
        postedBy: getSessionUser().id,
        postedAt: new Date().toISOString(),
      };

      var all = loadAll(KEYS.claims, true);
      var idx = all.findIndex(function(c) { return c.id === claimId; });
      if (idx === -1) { showToast('Claim not found', 'error'); return; }

      if (!all[idx].payments) all[idx].payments = [];
      all[idx].payments.push(payment);

      // Update totals
      if (payment.type === 'Insurance' || payment.type === 'Patient') {
        all[idx].totalPaid = (parseFloat(all[idx].totalPaid) || 0) + amount;
      } else {
        all[idx].totalAdjustment = (parseFloat(all[idx].totalAdjustment) || 0) + amount;
      }

      // Auto-mark as Paid if balance <= 0
      var newBalance = (parseFloat(all[idx].totalCharge) || 0) - (parseFloat(all[idx].totalPaid) || 0) - (parseFloat(all[idx].totalAdjustment) || 0);
      if (newBalance <= 0.005) {
        all[idx].status = 'Paid';
        all[idx].paidAt = new Date().toISOString();
      }

      saveAll(KEYS.claims, all);
      showToast('Payment of ' + _formatMoney(amount) + ' posted', 'success');
      closeModal();
      if (window.location.hash === '#billing') renderBilling();
    });
  }, 50);
}

/* ============================================================
   A/R AGING REPORT MODAL
   ============================================================ */
function openARAgingModal() {
  const claims = getClaims().filter(function(c) {
    return c.status !== 'Paid' && c.status !== 'Draft';
  });
  const now = Date.now();

  var buckets = {
    current:   { label: '0-30 days',  claims: [], total: 0 },
    days31_60: { label: '31-60 days', claims: [], total: 0 },
    days61_90: { label: '61-90 days', claims: [], total: 0 },
    over90:    { label: '90+ days',   claims: [], total: 0 },
  };

  claims.forEach(function(c) {
    var created = new Date(c.createdAt || c.serviceDate || now).getTime();
    var age = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    var balance = (parseFloat(c.totalCharge) || 0) - (parseFloat(c.totalPaid) || 0) - (parseFloat(c.totalAdjustment) || 0);
    if (balance <= 0) return;
    var item = { claim: c, age: age, balance: balance };
    if (age <= 30) { buckets.current.claims.push(item); buckets.current.total += balance; }
    else if (age <= 60) { buckets.days31_60.claims.push(item); buckets.days31_60.total += balance; }
    else if (age <= 90) { buckets.days61_90.claims.push(item); buckets.days61_90.total += balance; }
    else { buckets.over90.claims.push(item); buckets.over90.total += balance; }
  });

  var grandTotal = buckets.current.total + buckets.days31_60.total + buckets.days61_90.total + buckets.over90.total;

  var body = '<div class="ai-summary-bar" style="margin-bottom:20px;">';
  [buckets.current, buckets.days31_60, buckets.days61_90, buckets.over90].forEach(function(b, i) {
    var cls = i === 0 ? 'info' : i === 1 ? 'warning' : 'critical';
    body += '<div class="ai-stat-card ' + cls + '">' +
      '<div class="ai-stat-value ' + cls + '">' + _formatMoney(b.total) + '</div>' +
      '<div class="ai-stat-label">' + esc(b.label) + ' (' + b.claims.length + ')</div></div>';
  });
  body += '<div class="ai-stat-card"><div class="ai-stat-value">' + _formatMoney(grandTotal) + '</div>' +
    '<div class="ai-stat-label">Total A/R</div></div>';
  body += '</div>';

  // A/R table
  body += '<table class="table"><thead><tr><th>Claim</th><th>Patient</th><th>Status</th><th>Age (days)</th><th>Charged</th><th>Balance</th><th>Actions</th></tr></thead><tbody>';
  var allItems = [];
  Object.keys(buckets).forEach(function(k) { allItems = allItems.concat(buckets[k].claims); });
  allItems.sort(function(a, b) { return b.age - a.age; });

  allItems.slice(0, 50).forEach(function(item) {
    var c = item.claim;
    var patient = loadAll(KEYS.patients).find(function(p) { return p.id === c.patientId; });
    var pName = patient ? esc(patient.lastName + ', ' + patient.firstName) : 'Unknown';
    body += '<tr><td>' + esc(c.id.slice(0, 8)) + '</td><td>' + pName + '</td>' +
      '<td>' + _claimStatusBadge(c.status) + '</td><td>' + item.age + '</td>' +
      '<td>' + _formatMoney(c.totalCharge) + '</td><td style="font-weight:700;">' + _formatMoney(item.balance) + '</td>' +
      '<td><button class="btn btn-sm btn-primary ar-post-btn" data-id="' + esc(c.id) + '">Post Payment</button></td></tr>';
  });
  body += '</tbody></table>';
  if (allItems.length > 50) body += '<p class="text-muted" style="margin-top:8px;">Showing 50 of ' + allItems.length + ' claims</p>';

  openModal({ title: 'Accounts Receivable Aging', bodyHTML: body, footerHTML: '', size: 'xl' });

  setTimeout(function() {
    document.querySelectorAll('.ar-post-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        closeModal();
        openPaymentPostingModal(btn.dataset.id);
      });
    });
  }, 50);
}

/* ============================================================
   BILLING DASHBOARD / METRICS MODAL
   ============================================================ */
function openBillingDashboardModal() {
  const claims = getClaims();
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  // Metrics
  var totalCharged = 0, totalPaid = 0, totalAdjusted = 0;
  var deniedCount = 0, submittedCount = 0, paidCount = 0;
  var daysToPay = [];
  var payerBreakdown = {};

  claims.forEach(function(c) {
    totalCharged += parseFloat(c.totalCharge) || 0;
    totalPaid += parseFloat(c.totalPaid) || 0;
    totalAdjusted += parseFloat(c.totalAdjustment) || 0;

    if (c.status === 'Denied') deniedCount++;
    if (c.status === 'Submitted' || c.status === 'Accepted' || c.status === 'Paid' || c.status === 'Denied') submittedCount++;
    if (c.status === 'Paid') {
      paidCount++;
      if (c.paidAt && c.submittedAt) {
        var days = Math.floor((new Date(c.paidAt).getTime() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 0) daysToPay.push(days);
      }
    }

    var payer = c.payerName || 'Self-Pay';
    if (!payerBreakdown[payer]) payerBreakdown[payer] = { charged: 0, paid: 0, count: 0 };
    payerBreakdown[payer].charged += parseFloat(c.totalCharge) || 0;
    payerBreakdown[payer].paid += parseFloat(c.totalPaid) || 0;
    payerBreakdown[payer].count++;
  });

  var avgDaysAR = daysToPay.length > 0 ? Math.round(daysToPay.reduce(function(a, b) { return a + b; }, 0) / daysToPay.length) : 0;
  var denialRate = submittedCount > 0 ? ((deniedCount / submittedCount) * 100).toFixed(1) : '0.0';
  var collectionRate = totalCharged > 0 ? ((totalPaid / totalCharged) * 100).toFixed(1) : '0.0';
  var cleanClaimRate = submittedCount > 0 ? (((submittedCount - deniedCount) / submittedCount) * 100).toFixed(1) : '0.0';

  var body = '<div class="ai-summary-bar">';
  body += '<div class="ai-stat-card info"><div class="ai-stat-value info">' + avgDaysAR + '</div><div class="ai-stat-label">Avg Days in A/R</div></div>';
  body += '<div class="ai-stat-card success"><div class="ai-stat-value success">' + collectionRate + '%</div><div class="ai-stat-label">Collection Rate</div></div>';
  body += '<div class="ai-stat-card ' + (parseFloat(denialRate) > 10 ? 'critical' : 'warning') + '"><div class="ai-stat-value ' + (parseFloat(denialRate) > 10 ? 'critical' : 'warning') + '">' + denialRate + '%</div><div class="ai-stat-label">Denial Rate</div></div>';
  body += '<div class="ai-stat-card success"><div class="ai-stat-value success">' + cleanClaimRate + '%</div><div class="ai-stat-label">Clean Claim Rate</div></div>';
  body += '</div>';

  // Revenue summary
  body += '<div class="ai-section-title">Revenue Summary</div>';
  body += '<table class="table"><tbody>';
  body += '<tr><td><strong>Total Charged</strong></td><td style="text-align:right;font-weight:700">' + _formatMoney(totalCharged) + '</td></tr>';
  body += '<tr><td><strong>Total Collected</strong></td><td style="text-align:right;font-weight:700;color:var(--success)">' + _formatMoney(totalPaid) + '</td></tr>';
  body += '<tr><td><strong>Total Adjustments</strong></td><td style="text-align:right;font-weight:700;color:var(--warning)">' + _formatMoney(totalAdjusted) + '</td></tr>';
  body += '<tr><td><strong>Outstanding Balance</strong></td><td style="text-align:right;font-weight:700;color:var(--danger)">' + _formatMoney(totalCharged - totalPaid - totalAdjusted) + '</td></tr>';
  body += '</tbody></table>';

  // Payer breakdown
  body += '<div class="ai-section-title">Payer Breakdown</div>';
  body += '<table class="table"><thead><tr><th>Payer</th><th>Claims</th><th>Charged</th><th>Paid</th><th>Collection %</th></tr></thead><tbody>';
  Object.keys(payerBreakdown).sort().forEach(function(payer) {
    var p = payerBreakdown[payer];
    var pct = p.charged > 0 ? ((p.paid / p.charged) * 100).toFixed(1) : '0.0';
    body += '<tr><td>' + esc(payer) + '</td><td>' + p.count + '</td><td>' + _formatMoney(p.charged) + '</td>' +
      '<td>' + _formatMoney(p.paid) + '</td><td>' + pct + '%</td></tr>';
  });
  body += '</tbody></table>';

  // Days to payment chart (simple bar)
  if (daysToPay.length > 0) {
    body += '<div class="ai-section-title">Payment Turnaround Distribution</div>';
    var ranges = [
      { label: '0-15d', min: 0, max: 15, count: 0 },
      { label: '16-30d', min: 16, max: 30, count: 0 },
      { label: '31-45d', min: 31, max: 45, count: 0 },
      { label: '46-60d', min: 46, max: 60, count: 0 },
      { label: '60+d', min: 61, max: 9999, count: 0 },
    ];
    daysToPay.forEach(function(d) {
      ranges.forEach(function(r) { if (d >= r.min && d <= r.max) r.count++; });
    });
    var maxCount = Math.max.apply(null, ranges.map(function(r) { return r.count; })) || 1;
    body += '<div style="display:flex;align-items:flex-end;gap:8px;height:80px;margin-top:8px;">';
    ranges.forEach(function(r) {
      var pct = Math.max(5, (r.count / maxCount) * 100);
      body += '<div style="flex:1;text-align:center;">' +
        '<div style="background:var(--accent-blue);height:' + pct + '%;border-radius:4px 4px 0 0;transition:height 0.3s;min-height:4px;"></div>' +
        '<div style="font-size:11px;margin-top:4px;color:var(--text-muted);">' + r.label + '</div>' +
        '<div style="font-size:12px;font-weight:600;">' + r.count + '</div></div>';
    });
    body += '</div>';
  }

  openModal({ title: 'Revenue Cycle Dashboard', bodyHTML: body, footerHTML: '', size: 'xl' });
}

/* ============================================================
   PATIENT STATEMENT MODAL
   ============================================================ */
function openPatientStatementModal(patientId) {
  const patient = loadAll(KEYS.patients).find(function(p) { return p.id === patientId; });
  if (!patient) { showToast('Patient not found', 'error'); return; }

  const claims = getClaimsByPatient(patientId).filter(function(c) { return c.status !== 'Draft'; });
  var totalOwed = 0;

  var body = '<div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;background:var(--bg-surface);">';
  body += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">';
  body += '<div><h3 style="margin-bottom:4px;">Patient Statement</h3><p style="color:var(--text-muted);font-size:12px;">Statement Date: ' + new Date().toLocaleDateString() + '</p></div>';
  body += '<div style="text-align:right;"><strong>GusdorfEMR Clinic</strong><br/><span style="font-size:12px;color:var(--text-secondary);">123 Medical Center Dr<br/>Suite 100</span></div>';
  body += '</div>';

  body += '<div style="margin-bottom:16px;padding:12px;background:var(--bg-base);border-radius:var(--radius);">';
  body += '<strong>' + esc(patient.lastName + ', ' + patient.firstName) + '</strong><br/>';
  body += '<span style="font-size:12px;color:var(--text-secondary);">MRN: ' + esc(patient.mrn || '') + '</span>';
  body += '</div>';

  body += '<table class="table"><thead><tr><th>Date</th><th>Service</th><th>Charged</th><th>Insurance Paid</th><th>Adjustment</th><th>Patient Owes</th></tr></thead><tbody>';
  claims.forEach(function(c) {
    var insured = (parseFloat(c.totalPaid) || 0);
    var adj = (parseFloat(c.totalAdjustment) || 0);
    var ptOwe = Math.max(0, (parseFloat(c.totalCharge) || 0) - insured - adj);
    totalOwed += ptOwe;
    var desc = (c.charges || []).map(function(ch) { return ch.cptCode || ch.description || ''; }).join(', ') || 'Medical Services';
    body += '<tr><td>' + esc((c.serviceDate || c.createdAt || '').slice(0, 10)) + '</td>' +
      '<td>' + esc(desc.slice(0, 50)) + '</td>' +
      '<td>' + _formatMoney(c.totalCharge) + '</td><td>' + _formatMoney(insured) + '</td>' +
      '<td>' + _formatMoney(adj) + '</td><td style="font-weight:700">' + _formatMoney(ptOwe) + '</td></tr>';
  });
  body += '</tbody></table>';

  body += '<div style="text-align:right;margin-top:12px;padding-top:12px;border-top:2px solid var(--border);">';
  body += '<span style="font-size:18px;font-weight:800;">Total Due: ' + _formatMoney(totalOwed) + '</span>';
  body += '</div></div>';

  var footerHTML = '<button class="btn btn-primary" onclick="window.print()">Print Statement</button>' +
    '<button class="btn btn-secondary" onclick="closeModal()">Close</button>';

  openModal({ title: 'Patient Statement — ' + esc(patient.lastName + ', ' + patient.firstName), bodyHTML: body, footerHTML: footerHTML, size: 'xl' });
}
