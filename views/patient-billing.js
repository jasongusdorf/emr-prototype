/* ============================================================
   views/patient-billing.js — Patient Statements & Payments
   ============================================================ */

/* ---------- Module-level state ---------- */
let _pbPage = 1;
const _PB_PAGE_SIZE = 20;
let _pbSearch = '';
let _pbTab = 'balances'; // 'balances' | 'payments' | 'plans' | 'aging' | 'collections'

/* ============================================================
   MAIN VIEW
   ============================================================ */
function renderPatientBilling() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Patient Billing', meta: '', actions: '' });
  setActiveNav('patient-billing');

  // Tab bar
  var tabBar = document.createElement('div');
  tabBar.className = 'cc-tab-bar';
  [
    { key: 'balances', label: 'Patient Balances' },
    { key: 'payments', label: 'Payments' },
    { key: 'plans', label: 'Payment Plans' },
    { key: 'aging', label: 'Aging Report' },
    { key: 'collections', label: 'Collections' },
  ].forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'cc-tab' + (_pbTab === t.key ? ' cc-tab-active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() { _pbTab = t.key; renderPatientBilling(); });
    tabBar.appendChild(btn);
  });
  app.appendChild(tabBar);

  if (_pbTab === 'balances') _renderBalancesTab(app);
  else if (_pbTab === 'payments') _renderPaymentsTab(app);
  else if (_pbTab === 'plans') _renderPaymentPlansTab(app);
  else if (_pbTab === 'aging') _renderPatientAgingTab(app);
  else if (_pbTab === 'collections') _renderCollectionsTab(app);
}

/* ---------- Patient Balances Tab ---------- */
function _renderBalancesTab(app) {
  var claims = getClaims();
  var patients = getPatients();

  // Calculate per-patient balances
  var balances = {};
  claims.forEach(function(c) {
    if (c.status === 'Draft') return;
    var pid = c.patientId;
    if (!balances[pid]) balances[pid] = { patientId: pid, totalCharged: 0, insurancePaid: 0, adjustments: 0, patientPaid: 0, balance: 0 };
    balances[pid].totalCharged += parseFloat(c.totalCharge) || 0;
    var insPaid = 0;
    var ptPaid = 0;
    (c.payments || []).forEach(function(p) {
      if (p.type === 'Insurance') insPaid += p.amount || 0;
      else if (p.type === 'Patient') ptPaid += p.amount || 0;
    });
    balances[pid].insurancePaid += insPaid;
    balances[pid].patientPaid += ptPaid;
    balances[pid].adjustments += parseFloat(c.totalAdjustment) || 0;
  });

  // Also include patient payments from the payments store
  var patientPayments = getPatientPayments();
  patientPayments.forEach(function(pp) {
    if (!balances[pp.patientId]) balances[pp.patientId] = { patientId: pp.patientId, totalCharged: 0, insurancePaid: 0, adjustments: 0, patientPaid: 0, balance: 0 };
    balances[pp.patientId].patientPaid += pp.amount || 0;
  });

  // Calculate balance
  Object.values(balances).forEach(function(b) {
    b.balance = b.totalCharged - b.insurancePaid - b.adjustments - b.patientPaid;
  });

  // Filter
  var balanceList = Object.values(balances).filter(function(b) { return b.balance > 0.01; });
  if (_pbSearch) {
    balanceList = balanceList.filter(function(b) {
      var patient = getPatient(b.patientId);
      return patient && (patient.firstName + ' ' + patient.lastName).toLowerCase().indexOf(_pbSearch) !== -1;
    });
  }
  balanceList.sort(function(a, b) { return b.balance - a.balance; });

  var totalBalance = balanceList.reduce(function(s, b) { return s + b.balance; }, 0);

  // Stats
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: balanceList.length, label: 'Patients with Balance' },
    { value: _formatMoney(totalBalance), label: 'Total Patient A/R', raw: true, cls: totalBalance > 0 ? 'stat-danger' : '' },
    { value: _formatMoney(balanceList.length > 0 ? totalBalance / balanceList.length : 0), label: 'Avg Balance', raw: true },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Toolbar
  var toolbar = document.createElement('div');
  toolbar.className = 'billing-toolbar';
  var searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-control';
  searchInput.placeholder = 'Search patients...';
  searchInput.value = _pbSearch;
  var searchWrap = document.createElement('div');
  searchWrap.className = 'billing-toolbar-search';
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  var recordPaymentBtn = document.createElement('button');
  recordPaymentBtn.className = 'btn btn-primary btn-sm';
  recordPaymentBtn.textContent = '+ Record Payment';
  recordPaymentBtn.addEventListener('click', function() { openRecordPatientPaymentModal(); });
  toolbar.appendChild(recordPaymentBtn);

  app.appendChild(toolbar);

  // Table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Patient</th><th>Total Charged</th><th>Insurance Paid</th><th>Adjustments</th><th>Patient Paid</th><th>Balance Due</th><th>Actions</th></tr></thead>';
  var tbody = document.createElement('tbody');

  if (balanceList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No patients with outstanding balances.</td></tr>';
  }

  balanceList.slice(0, 50).forEach(function(b) {
    var patient = getPatient(b.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
    var mrn = patient && patient.mrn ? ' (' + esc(patient.mrn) + ')' : '';

    var tr = document.createElement('tr');
    tr.className = 'billing-row-clickable';
    tr.innerHTML =
      '<td>' + patName + mrn + '</td>' +
      '<td>' + _formatMoney(b.totalCharged) + '</td>' +
      '<td>' + _formatMoney(b.insurancePaid) + '</td>' +
      '<td>' + _formatMoney(b.adjustments) + '</td>' +
      '<td>' + _formatMoney(b.patientPaid) + '</td>' +
      '<td style="font-weight:700;color:var(--danger);">' + _formatMoney(b.balance) + '</td>' +
      '<td class="billing-actions-cell"></td>';

    var actCell = tr.querySelector('.billing-actions-cell');

    var stmtBtn = document.createElement('button');
    stmtBtn.className = 'btn btn-secondary btn-sm';
    stmtBtn.textContent = 'Statement';
    stmtBtn.addEventListener('click', function(e) { e.stopPropagation(); openPatientStatementModal(b.patientId); });
    actCell.appendChild(stmtBtn);

    var payBtn = document.createElement('button');
    payBtn.className = 'btn btn-primary btn-sm';
    payBtn.textContent = 'Pay';
    payBtn.addEventListener('click', function(e) { e.stopPropagation(); openRecordPatientPaymentModal(b.patientId); });
    actCell.appendChild(payBtn);

    var planBtn = document.createElement('button');
    planBtn.className = 'btn btn-secondary btn-sm';
    planBtn.textContent = 'Plan';
    planBtn.addEventListener('click', function(e) { e.stopPropagation(); openPaymentPlanModal(b.patientId, b.balance); });
    actCell.appendChild(planBtn);

    tbody.appendChild(tr);
  });

  tbl.appendChild(tbody);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);
  app.appendChild(tableCard);

  searchInput.addEventListener('input', function() {
    _pbSearch = searchInput.value.trim().toLowerCase();
    renderPatientBilling();
  });
}

/* ---------- Payments Tab ---------- */
function _renderPaymentsTab(app) {
  var payments = getPatientPayments();
  payments.sort(function(a, b) { return (b.paymentDate || b.createdAt || '').localeCompare(a.paymentDate || a.createdAt || ''); });

  var totalCollected = payments.reduce(function(s, p) { return s + (p.amount || 0); }, 0);

  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: payments.length, label: 'Total Payments' },
    { value: _formatMoney(totalCollected), label: 'Total Collected', raw: true, cls: 'stat-success' },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Toolbar
  var toolbar = document.createElement('div');
  toolbar.className = 'billing-toolbar';
  var newPayBtn = document.createElement('button');
  newPayBtn.className = 'btn btn-primary btn-sm';
  newPayBtn.textContent = '+ Record Payment';
  newPayBtn.addEventListener('click', function() { openRecordPatientPaymentModal(); });
  toolbar.appendChild(newPayBtn);
  app.appendChild(toolbar);

  // Table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Date</th><th>Patient</th><th>Method</th><th>Amount</th><th>Reference</th><th>Notes</th></tr></thead>';
  var tb = document.createElement('tbody');

  if (payments.length === 0) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">No patient payments recorded.</td></tr>';
  }

  payments.slice(0, 50).forEach(function(p) {
    var patient = getPatient(p.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc((p.paymentDate || p.createdAt || '').slice(0, 10)) + '</td>' +
      '<td>' + patName + '</td>' +
      '<td>' + esc(p.method || '') + '</td>' +
      '<td style="font-weight:600;color:var(--success);">' + _formatMoney(p.amount) + '</td>' +
      '<td>' + esc(p.reference || '') + '</td>' +
      '<td>' + esc(p.notes || '') + '</td>';
    tb.appendChild(tr);
  });

  tbl.appendChild(tb);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);
  app.appendChild(tableCard);
}

/* ---------- Payment Plans Tab ---------- */
function _renderPaymentPlansTab(app) {
  var plans = getPaymentPlans();

  var activePlans = plans.filter(function(p) { return p.status === 'Active'; });
  var totalOutstanding = activePlans.reduce(function(s, p) { return s + (p.remainingBalance || 0); }, 0);

  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: plans.length, label: 'Total Plans' },
    { value: activePlans.length, label: 'Active Plans' },
    { value: _formatMoney(totalOutstanding), label: 'Outstanding on Plans', raw: true },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Patient</th><th>Total Balance</th><th>Monthly Amt</th><th>Duration</th><th>Paid So Far</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead>';
  var tb = document.createElement('tbody');

  if (plans.length === 0) {
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No payment plans set up.</td></tr>';
  }

  plans.sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
  plans.forEach(function(plan) {
    var patient = getPatient(plan.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
    var statusCls = plan.status === 'Active' ? 'billing-badge-accepted' : plan.status === 'Completed' ? 'billing-badge-paid' : 'billing-badge-denied';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + patName + '</td>' +
      '<td>' + _formatMoney(plan.totalBalance) + '</td>' +
      '<td>' + _formatMoney(plan.monthlyAmount) + '</td>' +
      '<td>' + (plan.durationMonths || 0) + ' mo</td>' +
      '<td>' + _formatMoney(plan.paidAmount || 0) + '</td>' +
      '<td>' + _formatMoney(plan.remainingBalance || 0) + '</td>' +
      '<td><span class="badge ' + statusCls + '">' + esc(plan.status) + '</span></td>' +
      '<td class="billing-actions-cell"></td>';

    var actCell = tr.querySelector('.billing-actions-cell');
    if (plan.status === 'Active') {
      var payBtn = document.createElement('button');
      payBtn.className = 'btn btn-primary btn-sm';
      payBtn.textContent = 'Payment';
      payBtn.addEventListener('click', function() {
        openRecordPatientPaymentModal(plan.patientId, plan.id);
      });
      actCell.appendChild(payBtn);
    }

    tb.appendChild(tr);
  });

  tbl.appendChild(tb);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);
  app.appendChild(tableCard);
}

/* ---------- Patient Aging Report Tab ---------- */
function _renderPatientAgingTab(app) {
  var claims = getClaims().filter(function(c) { return c.status !== 'Draft'; });
  var now = Date.now();

  // Build patient-level aging
  var patientAging = {};
  claims.forEach(function(c) {
    var pid = c.patientId;
    if (!patientAging[pid]) patientAging[pid] = { current: 0, days30: 0, days60: 0, days90: 0, days120: 0, total: 0 };

    var balance = (parseFloat(c.totalCharge) || 0) - (parseFloat(c.totalPaid) || 0) - (parseFloat(c.totalAdjustment) || 0);
    // Subtract patient payments
    var ptPayments = getPatientPayments().filter(function(p) { return p.patientId === pid && p.claimId === c.id; });
    ptPayments.forEach(function(p) { balance -= p.amount || 0; });

    if (balance <= 0) return;

    var created = new Date(c.serviceDate || c.createdAt || now).getTime();
    var age = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    if (age <= 30) patientAging[pid].current += balance;
    else if (age <= 60) patientAging[pid].days30 += balance;
    else if (age <= 90) patientAging[pid].days60 += balance;
    else if (age <= 120) patientAging[pid].days90 += balance;
    else patientAging[pid].days120 += balance;
    patientAging[pid].total += balance;
  });

  var agingList = Object.entries(patientAging).filter(function(e) { return e[1].total > 0.01; }).map(function(e) {
    return { patientId: e[0], ...e[1] };
  });
  agingList.sort(function(a, b) { return b.total - a.total; });

  // Column totals
  var totals = { current: 0, days30: 0, days60: 0, days90: 0, days120: 0, total: 0 };
  agingList.forEach(function(a) {
    totals.current += a.current;
    totals.days30 += a.days30;
    totals.days60 += a.days60;
    totals.days90 += a.days90;
    totals.days120 += a.days120;
    totals.total += a.total;
  });

  // Stats
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: _formatMoney(totals.current), label: 'Current', raw: true },
    { value: _formatMoney(totals.days30), label: '31-60 Days', raw: true, cls: 'stat-warning' },
    { value: _formatMoney(totals.days60), label: '61-90 Days', raw: true, cls: 'stat-warning' },
    { value: _formatMoney(totals.days90), label: '91-120 Days', raw: true, cls: 'stat-danger' },
    { value: _formatMoney(totals.days120), label: '120+ Days', raw: true, cls: 'stat-danger' },
    { value: _formatMoney(totals.total), label: 'Total', raw: true },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Patient</th><th>Current</th><th>31-60</th><th>61-90</th><th>91-120</th><th>120+</th><th>Total</th><th>Actions</th></tr></thead>';
  var tb = document.createElement('tbody');

  if (agingList.length === 0) {
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No patient aging data.</td></tr>';
  }

  agingList.slice(0, 50).forEach(function(a) {
    var patient = getPatient(a.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + patName + '</td>' +
      '<td>' + _formatMoney(a.current) + '</td>' +
      '<td>' + _formatMoney(a.days30) + '</td>' +
      '<td>' + _formatMoney(a.days60) + '</td>' +
      '<td>' + _formatMoney(a.days90) + '</td>' +
      '<td style="' + (a.days120 > 0 ? 'color:var(--danger);font-weight:700;' : '') + '">' + _formatMoney(a.days120) + '</td>' +
      '<td style="font-weight:700;">' + _formatMoney(a.total) + '</td>' +
      '<td class="billing-actions-cell"></td>';

    var actCell = tr.querySelector('.billing-actions-cell');

    var stmtBtn = document.createElement('button');
    stmtBtn.className = 'btn btn-secondary btn-sm';
    stmtBtn.textContent = 'Statement';
    stmtBtn.addEventListener('click', function() { openPatientStatementModal(a.patientId); });
    actCell.appendChild(stmtBtn);

    if (a.days120 > 0) {
      var collBtn = document.createElement('button');
      collBtn.className = 'btn btn-danger btn-sm';
      collBtn.textContent = 'Collections';
      collBtn.addEventListener('click', function() {
        _flagForCollections(a.patientId);
      });
      actCell.appendChild(collBtn);
    }

    tb.appendChild(tr);
  });

  // Totals row
  var tfoot = document.createElement('tfoot');
  tfoot.innerHTML = '<tr style="font-weight:700;border-top:2px solid var(--border);"><td>TOTAL</td>' +
    '<td>' + _formatMoney(totals.current) + '</td>' +
    '<td>' + _formatMoney(totals.days30) + '</td>' +
    '<td>' + _formatMoney(totals.days60) + '</td>' +
    '<td>' + _formatMoney(totals.days90) + '</td>' +
    '<td>' + _formatMoney(totals.days120) + '</td>' +
    '<td>' + _formatMoney(totals.total) + '</td>' +
    '<td></td></tr>';
  tbl.appendChild(tfoot);

  tbl.appendChild(tb);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);
  app.appendChild(tableCard);
}

/* ---------- Collections Tab ---------- */
function _renderCollectionsTab(app) {
  var collections = getCollectionFlags();

  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  var totalAmount = collections.reduce(function(s, c) { return s + (c.balance || 0); }, 0);
  [
    { value: collections.length, label: 'Accounts in Collections', cls: collections.length > 0 ? 'stat-danger' : '' },
    { value: _formatMoney(totalAmount), label: 'Total in Collections', raw: true, cls: 'stat-danger' },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Patient</th><th>Balance</th><th>Flagged Date</th><th>Notes</th><th>Actions</th></tr></thead>';
  var tb = document.createElement('tbody');

  if (collections.length === 0) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">No accounts in collections.</td></tr>';
  }

  collections.forEach(function(c) {
    var patient = getPatient(c.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + patName + '</td>' +
      '<td style="font-weight:700;color:var(--danger);">' + _formatMoney(c.balance || 0) + '</td>' +
      '<td>' + esc((c.flaggedDate || c.createdAt || '').slice(0, 10)) + '</td>' +
      '<td>' + esc(c.notes || '') + '</td>' +
      '<td class="billing-actions-cell"></td>';

    var actCell = tr.querySelector('.billing-actions-cell');
    var removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-secondary btn-sm';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', function() {
      deleteCollectionFlag(c.id);
      showToast('Removed from collections', 'success');
      renderPatientBilling();
    });
    actCell.appendChild(removeBtn);

    var stmtBtn = document.createElement('button');
    stmtBtn.className = 'btn btn-secondary btn-sm';
    stmtBtn.textContent = 'Statement';
    stmtBtn.addEventListener('click', function() { openPatientStatementModal(c.patientId); });
    actCell.appendChild(stmtBtn);

    tb.appendChild(tr);
  });

  tbl.appendChild(tb);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);
  app.appendChild(tableCard);
}

/* ============================================================
   RECORD PATIENT PAYMENT MODAL
   ============================================================ */
function openRecordPatientPaymentModal(presetPatientId, planId) {
  var body = '';

  // Patient selector
  body += '<div class="form-group">';
  body += '<label class="form-label">Patient</label>';
  body += '<input class="form-control" id="pp-patient-search" placeholder="Search patient..." autocomplete="off" value="' + (presetPatientId ? esc(_ppGetPatientName(presetPatientId)) : '') + '">';
  body += '<div id="pp-patient-results" class="billing-search-results"></div>';
  body += '<input type="hidden" id="pp-patient-id" value="' + (presetPatientId || '') + '">';
  body += '</div>';

  // Payment details
  body += '<div class="form-row">';
  body += '<div class="form-group"><label class="form-label">Amount ($)</label><input class="form-control" type="number" step="0.01" id="pp-amount" placeholder="0.00"></div>';
  body += '<div class="form-group"><label class="form-label">Payment Date</label><input class="form-control" type="date" id="pp-date" value="' + new Date().toISOString().slice(0, 10) + '"></div>';
  body += '</div>';

  body += '<div class="form-row">';
  body += '<div class="form-group"><label class="form-label">Payment Method</label>';
  body += '<select class="form-control" id="pp-method">';
  body += '<option value="Cash">Cash</option>';
  body += '<option value="Check">Check</option>';
  body += '<option value="Credit Card">Credit Card</option>';
  body += '<option value="Debit Card">Debit Card</option>';
  body += '<option value="Online">Online Payment</option>';
  body += '<option value="Other">Other</option>';
  body += '</select></div>';
  body += '<div class="form-group"><label class="form-label">Reference / Check #</label><input class="form-control" id="pp-reference" placeholder=""></div>';
  body += '</div>';

  body += '<div class="form-group"><label class="form-label">Notes</label>';
  body += '<textarea class="form-control" id="pp-notes" rows="2" placeholder="Payment notes..."></textarea></div>';

  if (planId) {
    body += '<input type="hidden" id="pp-plan-id" value="' + esc(planId) + '">';
    body += '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">This payment will be applied to the payment plan.</div>';
  }

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>';
  footer += '<button class="btn btn-primary" id="pp-save-btn">Record Payment</button>';

  openModal({ title: 'Record Patient Payment', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    var patSearch = document.getElementById('pp-patient-search');
    var patResults = document.getElementById('pp-patient-results');
    var patIdInput = document.getElementById('pp-patient-id');

    if (!presetPatientId) {
      patSearch.addEventListener('input', function() {
        var q = patSearch.value.trim().toLowerCase();
        patResults.innerHTML = '';
        if (q.length < 2) return;
        var matches = getPatients().filter(function(p) {
          return (p.firstName + ' ' + p.lastName).toLowerCase().indexOf(q) !== -1 || (p.mrn || '').toLowerCase().indexOf(q) !== -1;
        }).slice(0, 8);
        matches.forEach(function(p) {
          var row = document.createElement('div');
          row.className = 'billing-search-result-item';
          row.textContent = p.firstName + ' ' + p.lastName + (p.mrn ? ' (MRN: ' + p.mrn + ')' : '');
          row.addEventListener('click', function() {
            patIdInput.value = p.id;
            patSearch.value = p.firstName + ' ' + p.lastName;
            patResults.innerHTML = '';
          });
          patResults.appendChild(row);
        });
      });
    }

    document.getElementById('pp-save-btn').addEventListener('click', function() {
      var patientId = patIdInput.value;
      var amount = parseFloat(document.getElementById('pp-amount').value);
      if (!patientId) { showToast('Select a patient', 'warning'); return; }
      if (!amount || amount <= 0) { showToast('Enter a valid amount', 'warning'); return; }

      var paymentData = {
        patientId: patientId,
        amount: amount,
        paymentDate: document.getElementById('pp-date').value,
        method: document.getElementById('pp-method').value,
        reference: document.getElementById('pp-reference').value.trim(),
        notes: document.getElementById('pp-notes').value.trim(),
        recordedBy: getSessionUser() ? getSessionUser().id : null,
      };

      savePatientPayment(paymentData);

      // Apply to payment plan if applicable
      var planIdInput = document.getElementById('pp-plan-id');
      if (planIdInput && planIdInput.value) {
        var plan = getPaymentPlan(planIdInput.value);
        if (plan) {
          plan.paidAmount = (plan.paidAmount || 0) + amount;
          plan.remainingBalance = Math.max(0, (plan.totalBalance || 0) - plan.paidAmount);
          if (plan.remainingBalance <= 0.01) plan.status = 'Completed';
          savePaymentPlan(plan);
        }
      }

      showToast('Payment of ' + _formatMoney(amount) + ' recorded', 'success');
      closeModal();
      if (window.location.hash === '#patient-billing') renderPatientBilling();
    });
  }, 50);
}

function _ppGetPatientName(patientId) {
  var p = getPatient(patientId);
  return p ? p.firstName + ' ' + p.lastName : '';
}

/* ============================================================
   PAYMENT PLAN MODAL
   ============================================================ */
function openPaymentPlanModal(patientId, currentBalance) {
  var patient = getPatient(patientId);
  var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';

  var body = '';
  body += '<div style="margin-bottom:16px;">';
  body += '<div><strong>Patient:</strong> ' + patName + '</div>';
  body += '<div><strong>Current Balance:</strong> ' + _formatMoney(currentBalance || 0) + '</div>';
  body += '</div>';

  body += '<div class="form-row">';
  body += '<div class="form-group"><label class="form-label">Total Balance ($)</label><input class="form-control" type="number" step="0.01" id="plan-total" value="' + (currentBalance || 0).toFixed(2) + '"></div>';
  body += '<div class="form-group"><label class="form-label">Monthly Payment ($)</label><input class="form-control" type="number" step="0.01" id="plan-monthly" placeholder="50.00"></div>';
  body += '</div>';

  body += '<div class="form-row">';
  body += '<div class="form-group"><label class="form-label">Duration (months)</label><input class="form-control" type="number" id="plan-duration" placeholder="12" min="1"></div>';
  body += '<div class="form-group"><label class="form-label">Start Date</label><input class="form-control" type="date" id="plan-start" value="' + new Date().toISOString().slice(0, 10) + '"></div>';
  body += '</div>';

  body += '<div class="form-group"><label class="form-label">Notes</label>';
  body += '<textarea class="form-control" id="plan-notes" rows="2" placeholder="Plan terms, conditions..."></textarea></div>';

  body += '<div id="plan-preview" style="margin-top:12px;font-size:13px;color:var(--text-muted);"></div>';

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>';
  footer += '<button class="btn btn-primary" id="plan-save-btn">Create Payment Plan</button>';

  openModal({ title: 'Setup Payment Plan', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    var totalInput = document.getElementById('plan-total');
    var monthlyInput = document.getElementById('plan-monthly');
    var durationInput = document.getElementById('plan-duration');
    var preview = document.getElementById('plan-preview');

    function _updatePreview() {
      var total = parseFloat(totalInput.value) || 0;
      var monthly = parseFloat(monthlyInput.value) || 0;
      if (monthly > 0 && total > 0) {
        var months = Math.ceil(total / monthly);
        durationInput.value = months;
        preview.textContent = months + ' monthly payments of ' + _formatMoney(monthly) + ' = ' + _formatMoney(monthly * months) + ' total';
      }
    }

    monthlyInput.addEventListener('input', _updatePreview);
    totalInput.addEventListener('input', _updatePreview);

    durationInput.addEventListener('input', function() {
      var total = parseFloat(totalInput.value) || 0;
      var dur = parseInt(durationInput.value) || 1;
      if (dur > 0 && total > 0) {
        monthlyInput.value = (total / dur).toFixed(2);
        preview.textContent = dur + ' monthly payments of ' + _formatMoney(total / dur);
      }
    });

    document.getElementById('plan-save-btn').addEventListener('click', function() {
      var total = parseFloat(totalInput.value) || 0;
      var monthly = parseFloat(monthlyInput.value) || 0;
      var duration = parseInt(durationInput.value) || 0;

      if (total <= 0) { showToast('Enter a valid balance', 'warning'); return; }
      if (monthly <= 0) { showToast('Enter a monthly amount', 'warning'); return; }

      savePaymentPlan({
        patientId: patientId,
        totalBalance: total,
        monthlyAmount: monthly,
        durationMonths: duration,
        startDate: document.getElementById('plan-start').value,
        notes: document.getElementById('plan-notes').value.trim(),
        paidAmount: 0,
        remainingBalance: total,
        status: 'Active',
      });

      showToast('Payment plan created', 'success');
      closeModal();
      if (window.location.hash === '#patient-billing') renderPatientBilling();
    });
  }, 50);
}

/* ---------- Flag for collections ---------- */
function _flagForCollections(patientId) {
  // Calculate balance
  var claims = getClaims().filter(function(c) { return c.patientId === patientId && c.status !== 'Draft'; });
  var balance = 0;
  claims.forEach(function(c) {
    balance += (parseFloat(c.totalCharge) || 0) - (parseFloat(c.totalPaid) || 0) - (parseFloat(c.totalAdjustment) || 0);
  });

  saveCollectionFlag({
    patientId: patientId,
    balance: balance,
    flaggedDate: new Date().toISOString(),
    notes: 'Auto-flagged: 120+ days past due',
  });

  showToast('Patient flagged for collections', 'warning');
  renderPatientBilling();
}
