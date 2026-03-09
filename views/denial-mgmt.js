/* ============================================================
   views/denial-mgmt.js — Denial Management & Appeals
   ============================================================ */

/* ---------- Module-level state ---------- */
let _denialPage = 1;
const _DENIAL_PAGE_SIZE = 20;
let _denialSearch = '';
let _denialStatusFilter = 'All';
let _denialReasonFilter = 'All';
let _denialTab = 'dashboard'; // 'dashboard' | 'denials' | 'appeals' | 'aging'

/* ---------- Denial Reason Codes ---------- */
const DENIAL_REASON_CODES = [
  { code: 'CO-4',   description: 'Procedure code inconsistent with modifier' },
  { code: 'CO-11',  description: 'Diagnosis inconsistent with procedure' },
  { code: 'CO-16',  description: 'Claim/service lacks information' },
  { code: 'CO-18',  description: 'Exact duplicate claim/service' },
  { code: 'CO-22',  description: 'Coordination of benefits' },
  { code: 'CO-29',  description: 'Time limit for filing has expired' },
  { code: 'CO-45',  description: 'Charge exceeds fee schedule/maximum allowable' },
  { code: 'CO-50',  description: 'Non-covered service' },
  { code: 'CO-97',  description: 'Payment adjusted — already adjudicated' },
  { code: 'CO-109', description: 'Claim not covered by this payer' },
  { code: 'CO-167', description: 'Diagnosis not covered' },
  { code: 'CO-197', description: 'Prior authorization required' },
  { code: 'CO-B7',  description: 'Provider not eligible for this payer' },
  { code: 'PR-1',   description: 'Deductible amount' },
  { code: 'PR-2',   description: 'Coinsurance amount' },
  { code: 'PR-3',   description: 'Copay amount' },
  { code: 'PR-96',  description: 'Non-covered charge' },
  { code: 'OA-23',  description: 'Authorization not obtained' },
  { code: 'OA-18',  description: 'Duplicate claim/service' },
  { code: 'N-30',   description: 'Patient cannot be identified' },
];

/* ---------- Appeal Letter Templates ---------- */
const APPEAL_TEMPLATES = {
  medical_necessity: {
    name: 'Medical Necessity',
    body: 'Dear Claims Review Department,\n\nI am writing to appeal the denial of claim [CLAIM_ID] for patient [PATIENT_NAME] (DOB: [PATIENT_DOB]) for services rendered on [SERVICE_DATE].\n\nThe denied service ([CPT_CODE]) was medically necessary for the following reasons:\n\n1. The patient presented with [DIAGNOSIS] which required [TREATMENT_DESCRIPTION].\n2. The clinical documentation supports the medical necessity of this service.\n3. This treatment is consistent with current clinical guidelines and standard of care.\n\nEnclosed please find:\n- Progress notes from the date of service\n- Relevant lab/imaging results\n- Supporting clinical guidelines\n\nI respectfully request reconsideration of this claim.\n\nSincerely,\n[PROVIDER_NAME]\n[PROVIDER_CREDENTIALS]\nNPI: [PROVIDER_NPI]',
  },
  timely_filing: {
    name: 'Timely Filing',
    body: 'Dear Claims Department,\n\nI am writing to appeal the denial of claim [CLAIM_ID] for timely filing reasons.\n\nClaim Details:\n- Patient: [PATIENT_NAME] (DOB: [PATIENT_DOB])\n- Date of Service: [SERVICE_DATE]\n- Original Submission Date: [SUBMIT_DATE]\n\nThis claim was originally submitted within the timely filing deadline. [Provide evidence of original submission - confirmation number, electronic submission receipt, etc.]\n\nI respectfully request reconsideration of this denial.\n\nSincerely,\n[PROVIDER_NAME]',
  },
  prior_auth: {
    name: 'Prior Authorization',
    body: 'Dear Claims Review Department,\n\nI am writing to appeal the denial of claim [CLAIM_ID] for patient [PATIENT_NAME] (DOB: [PATIENT_DOB]).\n\nDenial Reason: Prior authorization not obtained.\n\nThe service was medically necessary and was performed on an urgent/emergent basis. The clinical circumstances that warranted immediate treatment include:\n\n[CLINICAL_JUSTIFICATION]\n\nA retrospective authorization request is being submitted concurrently with this appeal.\n\nEnclosed documentation:\n- Clinical notes supporting urgency\n- Medical records\n\nSincerely,\n[PROVIDER_NAME]\n[PROVIDER_CREDENTIALS]',
  },
  coding_correction: {
    name: 'Coding Correction',
    body: 'Dear Claims Department,\n\nI am writing to appeal the denial of claim [CLAIM_ID] for patient [PATIENT_NAME] (DOB: [PATIENT_DOB]).\n\nThe original claim contained a coding error that has been corrected:\n- Original Code: [ORIGINAL_CODE]\n- Corrected Code: [CORRECTED_CODE]\n\nThe corrected claim accurately reflects the services provided on [SERVICE_DATE]. Please find the corrected claim and supporting documentation enclosed.\n\nSincerely,\n[PROVIDER_NAME]',
  },
  coordination_of_benefits: {
    name: 'Coordination of Benefits',
    body: 'Dear Claims Department,\n\nI am writing to appeal the denial of claim [CLAIM_ID] for patient [PATIENT_NAME] (DOB: [PATIENT_DOB]) regarding coordination of benefits.\n\nThis claim was denied due to coordination of benefits. Please note:\n- Primary insurance: [PRIMARY_PAYER] has processed this claim and paid [PRIMARY_PAID].\n- The remaining balance of [REMAINING_BALANCE] is being submitted to your plan as secondary.\n\nEnclosed: EOB from primary insurance.\n\nSincerely,\n[PROVIDER_NAME]',
  },
};

/* ---------- Appeal Status ---------- */
const APPEAL_STATUSES = ['Draft', 'Submitted', 'In Review', 'Approved', 'Denied', 'Escalated'];

/* ============================================================
   MAIN VIEW
   ============================================================ */
function renderDenialMgmt() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Denial Management', meta: '', actions: '' });
  setActiveNav('denial-mgmt');

  // Tab bar
  var tabBar = document.createElement('div');
  tabBar.className = 'cc-tab-bar';
  [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'denials', label: 'All Denials' },
    { key: 'appeals', label: 'Appeals' },
    { key: 'aging', label: 'Aging Report' },
  ].forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'cc-tab' + (_denialTab === t.key ? ' cc-tab-active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() { _denialTab = t.key; renderDenialMgmt(); });
    tabBar.appendChild(btn);
  });
  app.appendChild(tabBar);

  if (_denialTab === 'dashboard') _renderDenialDashboard(app);
  else if (_denialTab === 'denials') _renderDenialsTab(app);
  else if (_denialTab === 'appeals') _renderAppealsTab(app);
  else if (_denialTab === 'aging') _renderDenialAgingTab(app);
}

/* ---------- Dashboard Tab ---------- */
function _renderDenialDashboard(app) {
  var denials = getDenials();
  var appeals = getAppeals();

  var totalDenied = denials.length;
  var totalDeniedAmount = 0;
  var recoveredAmount = 0;
  var openDenials = 0;
  var byReason = {};
  var byPayer = {};
  var byProvider = {};

  denials.forEach(function(d) {
    totalDeniedAmount += d.deniedAmount || 0;
    if (d.status === 'Open' || d.status === 'Under Review') openDenials++;
    if (d.status === 'Recovered') recoveredAmount += d.recoveredAmount || d.deniedAmount || 0;

    var reason = d.reasonCode || 'Unknown';
    byReason[reason] = (byReason[reason] || 0) + 1;

    var payer = d.payerName || 'Unknown';
    if (!byPayer[payer]) byPayer[payer] = { count: 0, amount: 0 };
    byPayer[payer].count++;
    byPayer[payer].amount += d.deniedAmount || 0;

    var provider = d.providerId || 'Unknown';
    if (!byProvider[provider]) byProvider[provider] = { count: 0, amount: 0 };
    byProvider[provider].count++;
    byProvider[provider].amount += d.deniedAmount || 0;
  });

  var recoveryRate = totalDeniedAmount > 0 ? ((recoveredAmount / totalDeniedAmount) * 100).toFixed(1) : '0.0';
  var openAppeals = appeals.filter(function(a) { return a.status !== 'Approved' && a.status !== 'Denied'; }).length;

  // Stats bar
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: totalDenied, label: 'Total Denials', cls: totalDenied > 0 ? 'stat-danger' : '' },
    { value: _formatMoney(totalDeniedAmount), label: 'Total Denied', raw: true, cls: 'stat-danger' },
    { value: openDenials, label: 'Open Denials', cls: openDenials > 0 ? 'stat-warning' : '' },
    { value: openAppeals, label: 'Open Appeals' },
    { value: _formatMoney(recoveredAmount), label: 'Recovered', raw: true, cls: 'stat-success' },
    { value: recoveryRate + '%', label: 'Recovery Rate' },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Denials by reason
  var reasonCard = document.createElement('div');
  reasonCard.className = 'card';
  reasonCard.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><strong>Denials by Reason Code</strong></div>';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Reason Code</th><th>Description</th><th>Count</th><th>% of Total</th></tr></thead>';
  var tb = document.createElement('tbody');

  var sortedReasons = Object.keys(byReason).sort(function(a, b) { return byReason[b] - byReason[a]; });
  if (sortedReasons.length === 0) {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted);">No denials recorded</td></tr>';
  }
  sortedReasons.forEach(function(code) {
    var desc = DENIAL_REASON_CODES.find(function(r) { return r.code === code; });
    var pct = totalDenied > 0 ? ((byReason[code] / totalDenied) * 100).toFixed(1) : '0';
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><strong>' + esc(code) + '</strong></td><td>' + esc(desc ? desc.description : '') + '</td><td>' + byReason[code] + '</td><td>' + pct + '%</td>';
    tb.appendChild(tr);
  });
  tbl.appendChild(tb);
  tw.appendChild(tbl);
  reasonCard.appendChild(tw);
  app.appendChild(reasonCard);

  // Denials by payer
  var payerCard = document.createElement('div');
  payerCard.className = 'card';
  payerCard.style.marginTop = '16px';
  payerCard.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><strong>Denials by Payer</strong></div>';
  var tw2 = document.createElement('div');
  tw2.className = 'table-wrap';
  var tbl2 = document.createElement('table');
  tbl2.className = 'table billing-table';
  tbl2.innerHTML = '<thead><tr><th>Payer</th><th>Denials</th><th>Amount</th></tr></thead>';
  var tb2 = document.createElement('tbody');

  Object.keys(byPayer).sort(function(a, b) { return byPayer[b].count - byPayer[a].count; }).forEach(function(payer) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + esc(payer) + '</td><td>' + byPayer[payer].count + '</td><td>' + _formatMoney(byPayer[payer].amount) + '</td>';
    tb2.appendChild(tr);
  });
  if (Object.keys(byPayer).length === 0) {
    tb2.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--text-muted);">No denials recorded</td></tr>';
  }
  tbl2.appendChild(tb2);
  tw2.appendChild(tbl2);
  payerCard.appendChild(tw2);
  app.appendChild(payerCard);
}

/* ---------- Denials List Tab ---------- */
function _renderDenialsTab(app) {
  var toolbar = document.createElement('div');
  toolbar.className = 'billing-toolbar';

  var searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-control';
  searchInput.placeholder = 'Search denials...';
  searchInput.value = _denialSearch;
  var searchWrap = document.createElement('div');
  searchWrap.className = 'billing-toolbar-search';
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  var statusSelect = document.createElement('select');
  statusSelect.className = 'form-control';
  statusSelect.style.width = 'auto';
  ['All', 'Open', 'Under Review', 'Appealed', 'Recovered', 'Written Off'].forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    if (s === _denialStatusFilter) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  toolbar.appendChild(statusSelect);

  var reasonSelect = document.createElement('select');
  reasonSelect.className = 'form-control';
  reasonSelect.style.width = 'auto';
  reasonSelect.innerHTML = '<option value="All">All Reasons</option>';
  DENIAL_REASON_CODES.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.code; opt.textContent = r.code + ' — ' + r.description;
    if (r.code === _denialReasonFilter) opt.selected = true;
    reasonSelect.appendChild(opt);
  });
  toolbar.appendChild(reasonSelect);

  var newDenialBtn = document.createElement('button');
  newDenialBtn.className = 'btn btn-primary btn-sm';
  newDenialBtn.textContent = '+ Record Denial';
  newDenialBtn.addEventListener('click', function() { openNewDenialModal(); });
  toolbar.appendChild(newDenialBtn);

  app.appendChild(toolbar);

  // Table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Date</th><th>Patient</th><th>Payer</th><th>Reason</th><th>Amount</th><th>Status</th><th>Age</th><th>Actions</th></tr></thead>';
  var tbody = document.createElement('tbody');
  tbody.id = 'denial-tbody';
  tbl.appendChild(tbody);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);

  var pagBar = document.createElement('div');
  pagBar.className = 'pagination-bar';
  tableCard.appendChild(pagBar);
  app.appendChild(tableCard);

  function refresh() { _renderDenialRows(tbody, pagBar); }

  searchInput.addEventListener('input', function() { _denialSearch = searchInput.value.trim().toLowerCase(); _denialPage = 1; refresh(); });
  statusSelect.addEventListener('change', function() { _denialStatusFilter = statusSelect.value; _denialPage = 1; refresh(); });
  reasonSelect.addEventListener('change', function() { _denialReasonFilter = reasonSelect.value; _denialPage = 1; refresh(); });

  refresh();
}

function _renderDenialRows(tbody, pagBar) {
  var denials = getDenials();
  var now = Date.now();

  if (_denialStatusFilter !== 'All') denials = denials.filter(function(d) { return d.status === _denialStatusFilter; });
  if (_denialReasonFilter !== 'All') denials = denials.filter(function(d) { return d.reasonCode === _denialReasonFilter; });
  if (_denialSearch) {
    denials = denials.filter(function(d) {
      var patient = getPatient(d.patientId);
      var name = patient ? (patient.firstName + ' ' + patient.lastName).toLowerCase() : '';
      return name.indexOf(_denialSearch) !== -1 || (d.reasonCode || '').toLowerCase().indexOf(_denialSearch) !== -1;
    });
  }

  denials.sort(function(a, b) { return (b.denialDate || b.createdAt || '').localeCompare(a.denialDate || a.createdAt || ''); });

  var total = denials.length;
  var totalPages = Math.max(1, Math.ceil(total / _DENIAL_PAGE_SIZE));
  if (_denialPage > totalPages) _denialPage = totalPages;
  var start = (_denialPage - 1) * _DENIAL_PAGE_SIZE;
  var page = denials.slice(start, start + _DENIAL_PAGE_SIZE);

  tbody.innerHTML = '';
  if (page.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No denials found.</td></tr>';
  }

  page.forEach(function(d) {
    var patient = getPatient(d.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
    var age = d.denialDate ? Math.floor((now - new Date(d.denialDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    var statusCls = d.status === 'Recovered' ? 'billing-badge-paid' : d.status === 'Appealed' ? 'billing-badge-appealed' : d.status === 'Written Off' ? 'billing-badge-draft' : 'billing-badge-denied';

    var tr = document.createElement('tr');
    tr.className = 'billing-row-clickable';
    tr.innerHTML =
      '<td>' + esc((d.denialDate || d.createdAt || '').slice(0, 10)) + '</td>' +
      '<td>' + patName + '</td>' +
      '<td>' + esc(d.payerName || '') + '</td>' +
      '<td><strong>' + esc(d.reasonCode || '') + '</strong></td>' +
      '<td>' + _formatMoney(d.deniedAmount || 0) + '</td>' +
      '<td><span class="badge ' + statusCls + '">' + esc(d.status || '') + '</span></td>' +
      '<td>' + age + 'd</td>' +
      '<td class="billing-actions-cell"></td>';

    var actCell = tr.querySelector('.billing-actions-cell');

    if (d.status === 'Open') {
      var appealBtn = document.createElement('button');
      appealBtn.className = 'btn btn-primary btn-sm';
      appealBtn.textContent = 'Appeal';
      appealBtn.addEventListener('click', function(e) { e.stopPropagation(); openAppealModal(d.id); });
      actCell.appendChild(appealBtn);
    }

    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-secondary btn-sm';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', function(e) { e.stopPropagation(); openDenialDetailModal(d.id); });
    actCell.appendChild(viewBtn);

    tbody.appendChild(tr);
  });

  // Pagination
  pagBar.innerHTML = '';
  if (total > _DENIAL_PAGE_SIZE) {
    var prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary btn-sm';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = _denialPage <= 1;
    prevBtn.addEventListener('click', function() { if (_denialPage > 1) { _denialPage--; _renderDenialRows(tbody, pagBar); } });
    pagBar.appendChild(prevBtn);
    var info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = 'Page ' + _denialPage + ' of ' + totalPages;
    pagBar.appendChild(info);
    var nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary btn-sm';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = _denialPage >= totalPages;
    nextBtn.addEventListener('click', function() { if (_denialPage < totalPages) { _denialPage++; _renderDenialRows(tbody, pagBar); } });
    pagBar.appendChild(nextBtn);
  }
}

/* ---------- Appeals Tab ---------- */
function _renderAppealsTab(app) {
  var appeals = getAppeals();

  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  var submitted = appeals.filter(function(a) { return a.status === 'Submitted'; }).length;
  var inReview = appeals.filter(function(a) { return a.status === 'In Review'; }).length;
  var approved = appeals.filter(function(a) { return a.status === 'Approved'; }).length;
  var denied = appeals.filter(function(a) { return a.status === 'Denied'; }).length;

  [
    { value: appeals.length, label: 'Total Appeals' },
    { value: submitted, label: 'Submitted' },
    { value: inReview, label: 'In Review' },
    { value: approved, label: 'Approved', cls: 'stat-success' },
    { value: denied, label: 'Denied', cls: denied > 0 ? 'stat-danger' : '' },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + s.value + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Appeals table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Date</th><th>Patient</th><th>Denial Reason</th><th>Template</th><th>Status</th><th>Actions</th></tr></thead>';
  var tb = document.createElement('tbody');

  appeals.sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

  if (appeals.length === 0) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">No appeals recorded.</td></tr>';
  }

  appeals.forEach(function(appeal) {
    var denial = getDenial(appeal.denialId);
    var patient = denial ? getPatient(denial.patientId) : null;
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
    var statusCls = appeal.status === 'Approved' ? 'billing-badge-paid' : appeal.status === 'Denied' ? 'billing-badge-denied' : appeal.status === 'Submitted' ? 'billing-badge-submitted' : 'billing-badge-draft';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc((appeal.createdAt || '').slice(0, 10)) + '</td>' +
      '<td>' + patName + '</td>' +
      '<td>' + esc(denial ? denial.reasonCode || '' : '') + '</td>' +
      '<td>' + esc(appeal.templateName || 'Custom') + '</td>' +
      '<td><span class="badge ' + statusCls + '">' + esc(appeal.status) + '</span></td>' +
      '<td class="billing-actions-cell"></td>';

    var actCell = tr.querySelector('.billing-actions-cell');
    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-secondary btn-sm';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', function() { openAppealDetailModal(appeal.id); });
    actCell.appendChild(viewBtn);

    if (appeal.status === 'Submitted' || appeal.status === 'In Review') {
      var approveBtn = document.createElement('button');
      approveBtn.className = 'btn btn-success btn-sm';
      approveBtn.textContent = 'Approved';
      approveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        updateAppealStatus(appeal.id, 'Approved');
        // Also mark denial as recovered
        if (appeal.denialId) {
          var den = getDenial(appeal.denialId);
          if (den) { den.status = 'Recovered'; den.recoveredAmount = den.deniedAmount; saveDenial(den); }
        }
        showToast('Appeal approved, denial recovered', 'success');
        renderDenialMgmt();
      });
      actCell.appendChild(approveBtn);

      var denyBtn = document.createElement('button');
      denyBtn.className = 'btn btn-danger btn-sm';
      denyBtn.textContent = 'Denied';
      denyBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        updateAppealStatus(appeal.id, 'Denied');
        showToast('Appeal denied', 'warning');
        renderDenialMgmt();
      });
      actCell.appendChild(denyBtn);
    }

    tb.appendChild(tr);
  });

  tbl.appendChild(tb);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);
  app.appendChild(tableCard);
}

/* ---------- Aging Report Tab ---------- */
function _renderDenialAgingTab(app) {
  var denials = getDenials().filter(function(d) { return d.status === 'Open' || d.status === 'Under Review' || d.status === 'Appealed'; });
  var now = Date.now();

  var buckets = {
    current: { label: '0-30 days', items: [], total: 0 },
    days31_60: { label: '31-60 days', items: [], total: 0 },
    days61_90: { label: '61-90 days', items: [], total: 0 },
    days91_120: { label: '91-120 days', items: [], total: 0 },
    over120: { label: '120+ days', items: [], total: 0 },
  };

  denials.forEach(function(d) {
    var dDate = new Date(d.denialDate || d.createdAt || now).getTime();
    var age = Math.floor((now - dDate) / (1000 * 60 * 60 * 24));
    var amount = d.deniedAmount || 0;
    var item = { denial: d, age: age, amount: amount };

    if (age <= 30) { buckets.current.items.push(item); buckets.current.total += amount; }
    else if (age <= 60) { buckets.days31_60.items.push(item); buckets.days31_60.total += amount; }
    else if (age <= 90) { buckets.days61_90.items.push(item); buckets.days61_90.total += amount; }
    else if (age <= 120) { buckets.days91_120.items.push(item); buckets.days91_120.total += amount; }
    else { buckets.over120.items.push(item); buckets.over120.total += amount; }
  });

  var grandTotal = Object.values(buckets).reduce(function(s, b) { return s + b.total; }, 0);

  // Stats
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  Object.values(buckets).forEach(function(b, i) {
    var cls = i === 0 ? '' : i <= 2 ? 'stat-warning' : 'stat-danger';
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (cls ? ' ' + cls : '') + '">' + _formatMoney(b.total) + '</div><div class="summary-stat-label">' + esc(b.label) + ' (' + b.items.length + ')</div>';
    statsBar.appendChild(card);
  });
  var grandCard = document.createElement('div');
  grandCard.className = 'summary-stat';
  grandCard.innerHTML = '<div class="summary-stat-value">' + _formatMoney(grandTotal) + '</div><div class="summary-stat-label">Total Open</div>';
  statsBar.appendChild(grandCard);
  app.appendChild(statsBar);

  // All items sorted by age
  var allItems = [];
  Object.values(buckets).forEach(function(b) { allItems = allItems.concat(b.items); });
  allItems.sort(function(a, b) { return b.age - a.age; });

  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Age</th><th>Patient</th><th>Payer</th><th>Reason</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>';
  var tb = document.createElement('tbody');

  if (allItems.length === 0) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No open denials.</td></tr>';
  }

  allItems.slice(0, 50).forEach(function(item) {
    var d = item.denial;
    var patient = getPatient(d.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
    var ageCls = item.age > 120 ? 'style="color:var(--danger);font-weight:700;"' : item.age > 60 ? 'style="color:var(--warning);font-weight:600;"' : '';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td ' + ageCls + '>' + item.age + 'd</td>' +
      '<td>' + patName + '</td>' +
      '<td>' + esc(d.payerName || '') + '</td>' +
      '<td>' + esc(d.reasonCode || '') + '</td>' +
      '<td>' + _formatMoney(item.amount) + '</td>' +
      '<td>' + esc(d.status || '') + '</td>' +
      '<td class="billing-actions-cell"></td>';

    var actCell = tr.querySelector('.billing-actions-cell');
    if (d.status === 'Open') {
      var appealBtn = document.createElement('button');
      appealBtn.className = 'btn btn-primary btn-sm';
      appealBtn.textContent = 'Appeal';
      appealBtn.addEventListener('click', function() { openAppealModal(d.id); });
      actCell.appendChild(appealBtn);
    }
    if (item.age > 120) {
      var woBtn = document.createElement('button');
      woBtn.className = 'btn btn-danger btn-sm';
      woBtn.textContent = 'Write Off';
      woBtn.addEventListener('click', function() {
        d.status = 'Written Off';
        saveDenial(d);
        showToast('Denial written off', 'warning');
        renderDenialMgmt();
      });
      actCell.appendChild(woBtn);
    }

    tb.appendChild(tr);
  });

  tbl.appendChild(tb);
  tw.appendChild(tbl);
  tableCard.appendChild(tw);
  app.appendChild(tableCard);
}

/* ============================================================
   NEW DENIAL MODAL
   ============================================================ */
function openNewDenialModal(claimId) {
  var claim = claimId ? getClaim(claimId) : null;

  var body = '';

  // Claim selector
  body += '<div class="form-group">';
  body += '<label class="form-label">Claim</label>';
  body += '<select class="form-control" id="denial-claim-select">';
  body += '<option value="">Select a claim...</option>';
  getClaims().filter(function(c) { return c.status !== 'Paid' && c.status !== 'Draft'; }).forEach(function(c) {
    var patient = getPatient(c.patientId);
    var patName = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';
    body += '<option value="' + esc(c.id) + '"' + (claim && claim.id === c.id ? ' selected' : '') + '>' + esc(patName) + ' — ' + esc((c.serviceDate || c.createdAt || '').slice(0, 10)) + ' — ' + _formatMoney(c.totalCharge) + '</option>';
  });
  body += '</select></div>';

  // Reason code
  body += '<div class="form-group">';
  body += '<label class="form-label">Denial Reason Code</label>';
  body += '<select class="form-control" id="denial-reason">';
  body += '<option value="">Select reason...</option>';
  DENIAL_REASON_CODES.forEach(function(r) {
    body += '<option value="' + esc(r.code) + '">' + esc(r.code + ' — ' + r.description) + '</option>';
  });
  body += '</select></div>';

  // Denied amount
  body += '<div class="form-row">';
  body += '<div class="form-group"><label class="form-label">Denied Amount ($)</label><input class="form-control" type="number" step="0.01" id="denial-amount" value="' + (claim ? claim.totalCharge || 0 : 0) + '"></div>';
  body += '<div class="form-group"><label class="form-label">Denial Date</label><input class="form-control" type="date" id="denial-date" value="' + new Date().toISOString().slice(0, 10) + '"></div>';
  body += '</div>';

  // Notes
  body += '<div class="form-group">';
  body += '<label class="form-label">Notes</label>';
  body += '<textarea class="form-control" id="denial-notes" rows="3" placeholder="Additional details..."></textarea>';
  body += '</div>';

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>';
  footer += '<button class="btn btn-primary" id="denial-save-btn">Record Denial</button>';

  openModal({ title: 'Record Denial', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    document.getElementById('denial-save-btn').addEventListener('click', function() {
      var selectedClaimId = document.getElementById('denial-claim-select').value;
      var reasonCode = document.getElementById('denial-reason').value;
      var amount = parseFloat(document.getElementById('denial-amount').value) || 0;
      var date = document.getElementById('denial-date').value;
      var notes = document.getElementById('denial-notes').value.trim();

      if (!selectedClaimId) { showToast('Select a claim', 'warning'); return; }
      if (!reasonCode) { showToast('Select a denial reason', 'warning'); return; }

      var selectedClaim = getClaim(selectedClaimId);
      var result = saveDenial({
        claimId: selectedClaimId,
        patientId: selectedClaim ? selectedClaim.patientId : null,
        providerId: selectedClaim ? selectedClaim.providerId : null,
        payerName: selectedClaim ? selectedClaim.payerName : '',
        reasonCode: reasonCode,
        deniedAmount: amount,
        denialDate: date,
        notes: notes,
        status: 'Open',
      });

      // Update claim status to Denied
      if (selectedClaim) updateClaimStatus(selectedClaimId, 'Denied');

      showToast('Denial recorded', 'success');
      closeModal();
      if (window.location.hash === '#denial-mgmt') renderDenialMgmt();
    });
  }, 50);
}

/* ============================================================
   DENIAL DETAIL MODAL
   ============================================================ */
function openDenialDetailModal(denialId) {
  var denial = getDenial(denialId);
  if (!denial) { showToast('Denial not found', 'error'); return; }

  var patient = getPatient(denial.patientId);
  var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
  var reasonInfo = DENIAL_REASON_CODES.find(function(r) { return r.code === denial.reasonCode; });

  var body = '';
  body += '<div class="billing-detail-header">';
  body += '<div><strong>Patient:</strong> ' + patName + '</div>';
  body += '<div><strong>Payer:</strong> ' + esc(denial.payerName || '') + '</div>';
  body += '<div><strong>Denial Date:</strong> ' + esc((denial.denialDate || '').slice(0, 10)) + '</div>';
  body += '<div><strong>Status:</strong> ' + esc(denial.status || '') + '</div>';
  body += '</div>';

  body += '<div class="billing-detail-section"><h4>Denial Details</h4>';
  body += '<div><strong>Reason Code:</strong> ' + esc(denial.reasonCode || '') + '</div>';
  body += '<div><strong>Description:</strong> ' + esc(reasonInfo ? reasonInfo.description : '') + '</div>';
  body += '<div><strong>Denied Amount:</strong> ' + _formatMoney(denial.deniedAmount || 0) + '</div>';
  if (denial.recoveredAmount) body += '<div><strong>Recovered Amount:</strong> ' + _formatMoney(denial.recoveredAmount) + '</div>';
  if (denial.notes) body += '<div style="margin-top:8px;"><strong>Notes:</strong> ' + esc(denial.notes) + '</div>';
  body += '</div>';

  // Related appeals
  var appeals = getAppeals().filter(function(a) { return a.denialId === denialId; });
  if (appeals.length > 0) {
    body += '<div class="billing-detail-section"><h4>Appeals</h4>';
    appeals.forEach(function(a) {
      body += '<div style="margin-bottom:8px;padding:8px;background:var(--bg-base);border-radius:6px;">';
      body += '<div><strong>Appeal Date:</strong> ' + esc((a.createdAt || '').slice(0, 10)) + ' | <strong>Status:</strong> ' + esc(a.status) + '</div>';
      if (a.templateName) body += '<div><strong>Template:</strong> ' + esc(a.templateName) + '</div>';
      body += '</div>';
    });
    body += '</div>';
  }

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Close</button>';
  if (denial.status === 'Open') {
    footer += '<button class="btn btn-primary" id="denial-detail-appeal">Create Appeal</button>';
  }

  openModal({ title: 'Denial Detail', bodyHTML: body, footerHTML: footer, size: 'lg' });

  setTimeout(function() {
    var appealBtn = document.getElementById('denial-detail-appeal');
    if (appealBtn) {
      appealBtn.addEventListener('click', function() {
        closeModal();
        openAppealModal(denialId);
      });
    }
  }, 50);
}

/* ============================================================
   APPEAL MODAL
   ============================================================ */
function openAppealModal(denialId) {
  var denial = getDenial(denialId);
  if (!denial) { showToast('Denial not found', 'error'); return; }

  var patient = getPatient(denial.patientId);
  var provider = getProvider(denial.providerId);
  var claim = denial.claimId ? getClaim(denial.claimId) : null;

  var body = '';

  // Denial context
  body += '<div class="billing-detail-header">';
  body += '<div><strong>Patient:</strong> ' + esc(patient ? patient.firstName + ' ' + patient.lastName : 'Unknown') + '</div>';
  body += '<div><strong>Reason:</strong> ' + esc(denial.reasonCode || '') + '</div>';
  body += '<div><strong>Amount:</strong> ' + _formatMoney(denial.deniedAmount || 0) + '</div>';
  body += '</div>';

  // Template selector
  body += '<div class="form-group">';
  body += '<label class="form-label">Appeal Letter Template</label>';
  body += '<select class="form-control" id="appeal-template">';
  body += '<option value="">Custom (blank)</option>';
  Object.keys(APPEAL_TEMPLATES).forEach(function(key) {
    body += '<option value="' + esc(key) + '">' + esc(APPEAL_TEMPLATES[key].name) + '</option>';
  });
  body += '</select></div>';

  // Appeal letter
  body += '<div class="form-group">';
  body += '<label class="form-label">Appeal Letter</label>';
  body += '<textarea class="form-control" id="appeal-letter" rows="12" placeholder="Enter appeal letter..."></textarea>';
  body += '</div>';

  // Supporting docs
  body += '<div class="form-group">';
  body += '<label class="form-label">Supporting Documentation Notes</label>';
  body += '<textarea class="form-control" id="appeal-docs" rows="3" placeholder="List any supporting documents attached..."></textarea>';
  body += '</div>';

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>';
  footer += '<button class="btn btn-secondary" id="appeal-save-draft">Save Draft</button>';
  footer += '<button class="btn btn-primary" id="appeal-submit">Submit Appeal</button>';

  openModal({ title: 'Create Appeal', bodyHTML: body, footerHTML: footer, size: 'lg' });

  setTimeout(function() {
    var templateSelect = document.getElementById('appeal-template');
    var letterArea = document.getElementById('appeal-letter');

    templateSelect.addEventListener('change', function() {
      var key = templateSelect.value;
      if (!key || !APPEAL_TEMPLATES[key]) { letterArea.value = ''; return; }
      var template = APPEAL_TEMPLATES[key].body;

      // Fill placeholders
      template = template.replace(/\[CLAIM_ID\]/g, claim ? claim.id.slice(0, 8) : '');
      template = template.replace(/\[PATIENT_NAME\]/g, patient ? patient.firstName + ' ' + patient.lastName : '');
      template = template.replace(/\[PATIENT_DOB\]/g, patient ? patient.dob || '' : '');
      template = template.replace(/\[SERVICE_DATE\]/g, claim ? (claim.serviceDate || '').slice(0, 10) : '');
      template = template.replace(/\[SUBMIT_DATE\]/g, claim ? (claim.submittedDate || '').slice(0, 10) : '');
      template = template.replace(/\[PROVIDER_NAME\]/g, provider ? provider.firstName + ' ' + provider.lastName : '');
      template = template.replace(/\[PROVIDER_CREDENTIALS\]/g, provider ? provider.degree || '' : '');
      template = template.replace(/\[PROVIDER_NPI\]/g, provider ? provider.npi || '' : '');
      template = template.replace(/\[CPT_CODE\]/g, claim && claim.charges ? claim.charges.map(function(c) { return c.cptCode; }).join(', ') : '');
      template = template.replace(/\[DIAGNOSIS\]/g, claim && claim.diagnoses ? claim.diagnoses.map(function(d) { return d.icd10 + ' ' + d.description; }).join('; ') : '');

      letterArea.value = template;
    });

    function _saveAppeal(status) {
      var appeal = {
        denialId: denialId,
        templateName: templateSelect.value ? APPEAL_TEMPLATES[templateSelect.value].name : 'Custom',
        letterText: letterArea.value.trim(),
        supportingDocs: document.getElementById('appeal-docs').value.trim(),
        status: status,
      };

      var result = saveAppeal(appeal);
      if (result && result.error) {
        showToast('Error saving appeal', 'error');
        return;
      }

      // Update denial status
      denial.status = 'Appealed';
      saveDenial(denial);

      showToast('Appeal ' + (status === 'Submitted' ? 'submitted' : 'saved as draft'), 'success');
      closeModal();
      if (window.location.hash === '#denial-mgmt') renderDenialMgmt();
    }

    document.getElementById('appeal-save-draft').addEventListener('click', function() { _saveAppeal('Draft'); });
    document.getElementById('appeal-submit').addEventListener('click', function() { _saveAppeal('Submitted'); });
  }, 50);
}

/* ============================================================
   APPEAL DETAIL MODAL
   ============================================================ */
function openAppealDetailModal(appealId) {
  var appeal = getAppeal(appealId);
  if (!appeal) { showToast('Appeal not found', 'error'); return; }

  var denial = getDenial(appeal.denialId);
  var patient = denial ? getPatient(denial.patientId) : null;
  var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';

  var body = '';
  body += '<div class="billing-detail-header">';
  body += '<div><strong>Patient:</strong> ' + patName + '</div>';
  body += '<div><strong>Status:</strong> ' + esc(appeal.status) + '</div>';
  body += '<div><strong>Template:</strong> ' + esc(appeal.templateName || 'Custom') + '</div>';
  body += '<div><strong>Created:</strong> ' + esc((appeal.createdAt || '').slice(0, 10)) + '</div>';
  body += '</div>';

  if (appeal.letterText) {
    body += '<div class="billing-detail-section"><h4>Appeal Letter</h4>';
    body += '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:var(--bg-base);padding:12px;border-radius:6px;max-height:400px;overflow-y:auto;">' + esc(appeal.letterText) + '</pre>';
    body += '</div>';
  }

  if (appeal.supportingDocs) {
    body += '<div class="billing-detail-section"><h4>Supporting Documentation</h4>';
    body += '<div>' + esc(appeal.supportingDocs) + '</div></div>';
  }

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Close</button>';
  openModal({ title: 'Appeal Detail', bodyHTML: body, footerHTML: footer, size: 'lg' });
}
