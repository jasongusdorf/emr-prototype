/* ============================================================
   views/charge-capture.js — Charge Capture & Provider Productivity
   ============================================================ */

/* ---------- Module-level state ---------- */
let _ccPage = 1;
const _CC_PAGE_SIZE = 20;
let _ccDateFilter = '';
let _ccSearch = '';
let _ccTab = 'charges'; // 'charges' | 'reconciliation' | 'productivity'

/* ---------- CPT Code Database ---------- */
const CPT_DATABASE = [
  // Office Visits — Established
  { code: '99211', description: 'Office visit, established, minimal', category: 'E&M', rvu: 0.18, fee: 25 },
  { code: '99212', description: 'Office visit, established, straightforward', category: 'E&M', rvu: 0.93, fee: 75 },
  { code: '99213', description: 'Office visit, established, low', category: 'E&M', rvu: 1.30, fee: 110 },
  { code: '99214', description: 'Office visit, established, moderate', category: 'E&M', rvu: 1.92, fee: 165 },
  { code: '99215', description: 'Office visit, established, high', category: 'E&M', rvu: 2.80, fee: 235 },
  // Office Visits — New
  { code: '99202', description: 'Office visit, new patient, straightforward', category: 'E&M', rvu: 0.93, fee: 95 },
  { code: '99203', description: 'Office visit, new patient, low', category: 'E&M', rvu: 1.42, fee: 145 },
  { code: '99204', description: 'Office visit, new patient, moderate', category: 'E&M', rvu: 2.43, fee: 210 },
  { code: '99205', description: 'Office visit, new patient, high', category: 'E&M', rvu: 3.17, fee: 280 },
  // Hospital Visits
  { code: '99221', description: 'Initial hospital care, low', category: 'E&M', rvu: 2.00, fee: 195 },
  { code: '99222', description: 'Initial hospital care, moderate', category: 'E&M', rvu: 2.61, fee: 255 },
  { code: '99223', description: 'Initial hospital care, high', category: 'E&M', rvu: 3.86, fee: 380 },
  { code: '99231', description: 'Subsequent hospital care, low', category: 'E&M', rvu: 0.76, fee: 75 },
  { code: '99232', description: 'Subsequent hospital care, moderate', category: 'E&M', rvu: 1.39, fee: 135 },
  { code: '99233', description: 'Subsequent hospital care, high', category: 'E&M', rvu: 2.00, fee: 195 },
  // Preventive
  { code: '99381', description: 'Preventive visit, new, infant', category: 'E&M', rvu: 1.50, fee: 160 },
  { code: '99391', description: 'Preventive visit, established, infant', category: 'E&M', rvu: 1.22, fee: 130 },
  { code: '99395', description: 'Preventive visit, established, 18-39', category: 'E&M', rvu: 1.50, fee: 160 },
  { code: '99396', description: 'Preventive visit, established, 40-64', category: 'E&M', rvu: 1.70, fee: 180 },
  { code: '99397', description: 'Preventive visit, established, 65+', category: 'E&M', rvu: 1.88, fee: 195 },
  // Procedures
  { code: '10060', description: 'I&D abscess, simple', category: 'Procedure', rvu: 1.22, fee: 175 },
  { code: '10120', description: 'Removal of foreign body, simple', category: 'Procedure', rvu: 1.56, fee: 200 },
  { code: '10160', description: 'Puncture aspiration of abscess', category: 'Procedure', rvu: 1.33, fee: 180 },
  { code: '11100', description: 'Skin biopsy, single lesion', category: 'Procedure', rvu: 0.81, fee: 120 },
  { code: '11200', description: 'Removal of skin tags, up to 15', category: 'Procedure', rvu: 0.80, fee: 115 },
  { code: '12001', description: 'Simple repair wound, 2.5cm or less', category: 'Procedure', rvu: 1.14, fee: 165 },
  { code: '17000', description: 'Destruction benign lesion, first', category: 'Procedure', rvu: 0.61, fee: 90 },
  { code: '17110', description: 'Destruction benign lesion, up to 14', category: 'Procedure', rvu: 0.78, fee: 110 },
  { code: '20600', description: 'Joint aspiration/injection, small', category: 'Procedure', rvu: 0.66, fee: 95 },
  { code: '20605', description: 'Joint aspiration/injection, intermediate', category: 'Procedure', rvu: 0.80, fee: 115 },
  { code: '20610', description: 'Joint aspiration/injection, major', category: 'Procedure', rvu: 1.01, fee: 145 },
  { code: '36415', description: 'Venipuncture', category: 'Procedure', rvu: 0.17, fee: 15 },
  { code: '69210', description: 'Cerumen removal', category: 'Procedure', rvu: 0.61, fee: 65 },
  { code: '96372', description: 'Therapeutic injection, IM/SQ', category: 'Procedure', rvu: 0.17, fee: 25 },
  { code: '96374', description: 'Therapeutic injection, IV push', category: 'Procedure', rvu: 0.36, fee: 50 },
  // Labs (common)
  { code: '80048', description: 'Basic metabolic panel (BMP)', category: 'Lab', rvu: 0, fee: 25 },
  { code: '80050', description: 'General health panel', category: 'Lab', rvu: 0, fee: 55 },
  { code: '80053', description: 'Comprehensive metabolic panel (CMP)', category: 'Lab', rvu: 0, fee: 30 },
  { code: '80061', description: 'Lipid panel', category: 'Lab', rvu: 0, fee: 30 },
  { code: '85025', description: 'Complete blood count (CBC) with diff', category: 'Lab', rvu: 0, fee: 15 },
  { code: '81001', description: 'Urinalysis with microscopy', category: 'Lab', rvu: 0, fee: 10 },
  { code: '83036', description: 'Hemoglobin A1c', category: 'Lab', rvu: 0, fee: 20 },
  { code: '84443', description: 'TSH', category: 'Lab', rvu: 0, fee: 25 },
  { code: '87880', description: 'Strep rapid test', category: 'Lab', rvu: 0, fee: 15 },
  { code: '87804', description: 'Flu rapid test', category: 'Lab', rvu: 0, fee: 20 },
  // Supplies
  { code: '99070', description: 'Supplies and materials', category: 'Supply', rvu: 0, fee: 15 },
  { code: 'A4550', description: 'Surgical tray', category: 'Supply', rvu: 0, fee: 30 },
  { code: 'J3420', description: 'Vitamin B-12 injection', category: 'Supply', rvu: 0, fee: 20 },
  { code: 'J0696', description: 'Ceftriaxone injection, 250mg', category: 'Supply', rvu: 0, fee: 35 },
  { code: 'J1030', description: 'Depo-Medrol injection, 40mg', category: 'Supply', rvu: 0, fee: 25 },
  { code: 'J1885', description: 'Ketorolac injection, 15mg', category: 'Supply', rvu: 0, fee: 10 },
  { code: '90471', description: 'Immunization admin, first', category: 'Supply', rvu: 0.17, fee: 25 },
  { code: '90472', description: 'Immunization admin, each additional', category: 'Supply', rvu: 0.12, fee: 15 },
];

/* ---------- Modifier List ---------- */
const MODIFIER_LIST = [
  { code: '25', description: 'Significant, separately identifiable E&M service' },
  { code: '26', description: 'Professional component' },
  { code: '50', description: 'Bilateral procedure' },
  { code: '51', description: 'Multiple procedures' },
  { code: '57', description: 'Decision for surgery' },
  { code: '59', description: 'Distinct procedural service' },
  { code: '76', description: 'Repeat procedure by same physician' },
  { code: '77', description: 'Repeat procedure by another physician' },
  { code: 'LT', description: 'Left side' },
  { code: 'RT', description: 'Right side' },
  { code: 'TC', description: 'Technical component' },
];

/* ============================================================
   MAIN VIEW
   ============================================================ */
function renderChargeCapture() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Charge Capture', meta: '', actions: '' });
  setActiveNav('charge-capture');

  _ccPage = 1;

  // Tab bar
  var tabBar = document.createElement('div');
  tabBar.className = 'cc-tab-bar';

  var tabs = [
    { key: 'charges', label: 'Charge Entry' },
    { key: 'reconciliation', label: 'Daily Reconciliation' },
    { key: 'productivity', label: 'Provider Productivity' },
  ];

  tabs.forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'cc-tab' + (_ccTab === t.key ? ' cc-tab-active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() {
      _ccTab = t.key;
      renderChargeCapture();
    });
    tabBar.appendChild(btn);
  });
  app.appendChild(tabBar);

  if (_ccTab === 'charges') _renderChargesTab(app);
  else if (_ccTab === 'reconciliation') _renderReconciliationTab(app);
  else if (_ccTab === 'productivity') _renderProductivityTab(app);
}

/* ---------- Charges Tab ---------- */
function _renderChargesTab(app) {
  var charges = getCharges();

  // Stats bar
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  var totalCharges = charges.length;
  var totalRVUs = 0;
  var totalFees = 0;
  charges.forEach(function(ch) {
    totalRVUs += (ch.rvu || 0) * (ch.units || 1);
    totalFees += (ch.fee || 0) * (ch.units || 1);
  });

  var statItems = [
    { value: totalCharges, label: 'Total Charges' },
    { value: totalRVUs.toFixed(2), label: 'Total RVUs' },
    { value: _formatMoney(totalFees), label: 'Total Fees', raw: true },
  ];
  statItems.forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Toolbar
  var toolbar = document.createElement('div');
  toolbar.className = 'billing-toolbar';

  var searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-control';
  searchInput.placeholder = 'Search charges (patient, CPT)...';
  searchInput.value = _ccSearch;
  var searchWrap = document.createElement('div');
  searchWrap.className = 'billing-toolbar-search';
  searchWrap.appendChild(searchInput);
  toolbar.appendChild(searchWrap);

  var dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'form-control';
  dateInput.style.width = 'auto';
  dateInput.value = _ccDateFilter;
  toolbar.appendChild(dateInput);

  var newChargeBtn = document.createElement('button');
  newChargeBtn.className = 'btn btn-primary btn-sm';
  newChargeBtn.textContent = '+ New Charge';
  newChargeBtn.addEventListener('click', function() { openChargeEntryModal(); });
  toolbar.appendChild(newChargeBtn);

  app.appendChild(toolbar);

  // Table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  var tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';
  var table = document.createElement('table');
  table.className = 'table billing-table';
  table.innerHTML = '<thead><tr><th>Date</th><th>Patient</th><th>Encounter</th><th>CPT</th><th>Description</th><th>Dx</th><th>Units</th><th>Modifier</th><th>RVU</th><th>Fee</th><th>Actions</th></tr></thead>';
  var tbody = document.createElement('tbody');
  tbody.id = 'cc-charges-tbody';
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  tableCard.appendChild(tableWrap);

  var pagBar = document.createElement('div');
  pagBar.className = 'pagination-bar';
  pagBar.id = 'cc-pagination';
  tableCard.appendChild(pagBar);
  app.appendChild(tableCard);

  function refresh() {
    _renderChargeRows(tbody, pagBar);
  }

  searchInput.addEventListener('input', function() {
    _ccSearch = searchInput.value.trim().toLowerCase();
    _ccPage = 1;
    refresh();
  });
  dateInput.addEventListener('change', function() {
    _ccDateFilter = dateInput.value;
    _ccPage = 1;
    refresh();
  });

  refresh();
}

function _renderChargeRows(tbody, pagBar) {
  var charges = getCharges();

  if (_ccSearch) {
    charges = charges.filter(function(ch) {
      var patient = getPatient(ch.patientId);
      var name = patient ? (patient.firstName + ' ' + patient.lastName).toLowerCase() : '';
      return name.indexOf(_ccSearch) !== -1 || (ch.cptCode || '').toLowerCase().indexOf(_ccSearch) !== -1;
    });
  }
  if (_ccDateFilter) {
    charges = charges.filter(function(ch) {
      return (ch.serviceDate || ch.createdAt || '').slice(0, 10) === _ccDateFilter;
    });
  }

  charges.sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

  var total = charges.length;
  var totalPages = Math.max(1, Math.ceil(total / _CC_PAGE_SIZE));
  if (_ccPage > totalPages) _ccPage = totalPages;
  var start = (_ccPage - 1) * _CC_PAGE_SIZE;
  var page = charges.slice(start, start + _CC_PAGE_SIZE);

  tbody.innerHTML = '';
  if (page.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-muted);">No charges found.</td></tr>';
  } else {
    page.forEach(function(ch) {
      var patient = getPatient(ch.patientId);
      var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
      var dateStr = ch.serviceDate ? formatDateTime(ch.serviceDate) : (ch.createdAt ? formatDateTime(ch.createdAt) : '');
      var lineRvu = ((ch.rvu || 0) * (ch.units || 1)).toFixed(2);
      var lineFee = _formatMoney((ch.fee || 0) * (ch.units || 1));

      var tr = document.createElement('tr');
      tr.className = 'billing-row-clickable';
      tr.innerHTML =
        '<td>' + esc(dateStr) + '</td>' +
        '<td>' + patName + '</td>' +
        '<td>' + esc((ch.encounterId || '').slice(0, 8)) + '</td>' +
        '<td><strong>' + esc(ch.cptCode || '') + '</strong></td>' +
        '<td>' + esc(ch.description || '') + '</td>' +
        '<td>' + esc((ch.icd10Codes || []).join(', ') || '') + '</td>' +
        '<td>' + (ch.units || 1) + '</td>' +
        '<td>' + esc((ch.modifiers || []).join(', ') || '') + '</td>' +
        '<td>' + esc(lineRvu) + '</td>' +
        '<td>' + esc(lineFee) + '</td>' +
        '<td class="billing-actions-cell"></td>';

      var actCell = tr.querySelector('.billing-actions-cell');
      var editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', function(e) { e.stopPropagation(); openChargeEntryModal(ch.id); });
      actCell.appendChild(editBtn);

      var delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger btn-sm';
      delBtn.textContent = 'Del';
      delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteCharge(ch.id);
        showToast('Charge deleted', 'success');
        renderChargeCapture();
      });
      actCell.appendChild(delBtn);

      tbody.appendChild(tr);
    });
  }

  // Pagination
  pagBar.innerHTML = '';
  if (total > _CC_PAGE_SIZE) {
    var prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary btn-sm';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = _ccPage <= 1;
    prevBtn.addEventListener('click', function() { if (_ccPage > 1) { _ccPage--; _renderChargeRows(tbody, pagBar); } });
    pagBar.appendChild(prevBtn);

    var info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = 'Page ' + _ccPage + ' of ' + totalPages + ' \u00B7 ' + total + ' charges';
    pagBar.appendChild(info);

    var nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary btn-sm';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = _ccPage >= totalPages;
    nextBtn.addEventListener('click', function() { if (_ccPage < totalPages) { _ccPage++; _renderChargeRows(tbody, pagBar); } });
    pagBar.appendChild(nextBtn);
  }
}

/* ---------- Reconciliation Tab ---------- */
function _renderReconciliationTab(app) {
  var today = _ccDateFilter || new Date().toISOString().slice(0, 10);
  var encounters = getEncounters().filter(function(e) {
    return (e.dateTime || '').slice(0, 10) === today;
  });
  var charges = getCharges();
  var chargedEncIds = new Set(charges.map(function(c) { return c.encounterId; }));

  var missing = encounters.filter(function(e) { return !chargedEncIds.has(e.id); });
  var captured = encounters.filter(function(e) { return chargedEncIds.has(e.id); });

  // Date picker
  var dateBar = document.createElement('div');
  dateBar.className = 'billing-toolbar';
  var dateLabel = document.createElement('span');
  dateLabel.textContent = 'Reconciliation Date: ';
  dateLabel.style.fontWeight = '600';
  dateBar.appendChild(dateLabel);
  var dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'form-control';
  dateInput.style.width = 'auto';
  dateInput.value = today;
  dateInput.addEventListener('change', function() {
    _ccDateFilter = dateInput.value;
    renderChargeCapture();
  });
  dateBar.appendChild(dateInput);
  app.appendChild(dateBar);

  // Stats
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: encounters.length, label: 'Total Encounters' },
    { value: captured.length, label: 'Charges Captured', cls: 'stat-success' },
    { value: missing.length, label: 'Missing Charges', cls: missing.length > 0 ? 'stat-danger' : '' },
    { value: encounters.length > 0 ? ((captured.length / encounters.length) * 100).toFixed(0) + '%' : '0%', label: 'Capture Rate' },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Missing charges table
  if (missing.length > 0) {
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><strong style="color:var(--danger);">Encounters Missing Charges (' + missing.length + ')</strong></div>';
    var tw = document.createElement('div');
    tw.className = 'table-wrap';
    var tbl = document.createElement('table');
    tbl.className = 'table billing-table';
    tbl.innerHTML = '<thead><tr><th>Time</th><th>Patient</th><th>Visit Type</th><th>Status</th><th>Actions</th></tr></thead>';
    var tb = document.createElement('tbody');

    missing.forEach(function(enc) {
      var patient = getPatient(enc.patientId);
      var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(enc.dateTime ? formatDateTime(enc.dateTime) : '') + '</td>' +
        '<td>' + patName + '</td>' +
        '<td>' + esc(enc.visitType || '') + (enc.visitSubtype ? ' / ' + esc(enc.visitSubtype) : '') + '</td>' +
        '<td>' + esc(enc.status || '') + '</td>' +
        '<td class="billing-actions-cell"></td>';

      var actCell = tr.querySelector('.billing-actions-cell');

      var captureBtn = document.createElement('button');
      captureBtn.className = 'btn btn-primary btn-sm';
      captureBtn.textContent = 'Capture Charge';
      captureBtn.addEventListener('click', function() { openChargeEntryModal(null, enc.id); });
      actCell.appendChild(captureBtn);

      var codeBtn = document.createElement('button');
      codeBtn.className = 'btn btn-secondary btn-sm';
      codeBtn.textContent = 'E&M Assist';
      codeBtn.addEventListener('click', function() { openCodingAssistModal(enc.id); });
      actCell.appendChild(codeBtn);

      tb.appendChild(tr);
    });

    tbl.appendChild(tb);
    tw.appendChild(tbl);
    card.appendChild(tw);
    app.appendChild(card);
  }

  // Captured charges table
  if (captured.length > 0) {
    var card2 = document.createElement('div');
    card2.className = 'card';
    card2.style.marginTop = '16px';
    card2.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><strong style="color:var(--success);">Charges Captured (' + captured.length + ')</strong></div>';
    var tw2 = document.createElement('div');
    tw2.className = 'table-wrap';
    var tbl2 = document.createElement('table');
    tbl2.className = 'table billing-table';
    tbl2.innerHTML = '<thead><tr><th>Time</th><th>Patient</th><th>CPT Codes</th><th>RVUs</th><th>Total Fee</th></tr></thead>';
    var tb2 = document.createElement('tbody');

    captured.forEach(function(enc) {
      var patient = getPatient(enc.patientId);
      var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';
      var encCharges = charges.filter(function(c) { return c.encounterId === enc.id; });
      var cpts = encCharges.map(function(c) { return c.cptCode; }).join(', ');
      var rvus = 0;
      var fees = 0;
      encCharges.forEach(function(c) {
        rvus += (c.rvu || 0) * (c.units || 1);
        fees += (c.fee || 0) * (c.units || 1);
      });

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(enc.dateTime ? formatDateTime(enc.dateTime) : '') + '</td>' +
        '<td>' + patName + '</td>' +
        '<td>' + esc(cpts) + '</td>' +
        '<td>' + rvus.toFixed(2) + '</td>' +
        '<td>' + _formatMoney(fees) + '</td>';
      tb2.appendChild(tr);
    });

    tbl2.appendChild(tb2);
    tw2.appendChild(tbl2);
    card2.appendChild(tw2);
    app.appendChild(card2);
  }
}

/* ---------- Productivity Tab ---------- */
function _renderProductivityTab(app) {
  var charges = getCharges();
  var user = getSessionUser();
  var providerId = user ? user.id : null;

  // Filter to current provider
  var myCharges = charges.filter(function(ch) { return ch.providerId === providerId; });

  // Group by time period
  var now = new Date();
  var todayStr = now.toISOString().slice(0, 10);
  var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  var monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  function _summarize(list) {
    var rvus = 0;
    var fees = 0;
    list.forEach(function(ch) {
      rvus += (ch.rvu || 0) * (ch.units || 1);
      fees += (ch.fee || 0) * (ch.units || 1);
    });
    return { count: list.length, rvus: rvus, fees: fees };
  }

  var todayCharges = myCharges.filter(function(ch) { return (ch.serviceDate || ch.createdAt || '').slice(0, 10) === todayStr; });
  var weekCharges = myCharges.filter(function(ch) { return (ch.serviceDate || ch.createdAt || '').slice(0, 10) >= weekAgo; });
  var monthCharges = myCharges.filter(function(ch) { return (ch.serviceDate || ch.createdAt || '').slice(0, 10) >= monthAgo; });

  var todayStats = _summarize(todayCharges);
  var weekStats = _summarize(weekCharges);
  var monthStats = _summarize(monthCharges);
  var allStats = _summarize(myCharges);

  // Stats cards
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: todayStats.count, label: 'Today Charges', sub: todayStats.rvus.toFixed(2) + ' RVU' },
    { value: weekStats.count, label: 'This Week', sub: weekStats.rvus.toFixed(2) + ' RVU' },
    { value: monthStats.count, label: 'This Month', sub: monthStats.rvus.toFixed(2) + ' RVU' },
    { value: allStats.count, label: 'All Time', sub: allStats.rvus.toFixed(2) + ' RVU' },
    { value: _formatMoney(monthStats.fees), label: 'Monthly Fees', raw: true },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value">' + esc(String(s.value)) + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>' + (s.sub ? '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + esc(s.sub) + '</div>' : '');
    statsBar.appendChild(card);
  });
  app.appendChild(statsBar);

  // Daily breakdown for the last 14 days
  var dailyCard = document.createElement('div');
  dailyCard.className = 'card';
  dailyCard.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><strong>Daily Breakdown (Last 14 Days)</strong></div>';
  var tw = document.createElement('div');
  tw.className = 'table-wrap';
  var tbl = document.createElement('table');
  tbl.className = 'table billing-table';
  tbl.innerHTML = '<thead><tr><th>Date</th><th>Charges</th><th>E&M</th><th>Procedures</th><th>RVUs</th><th>Fees</th></tr></thead>';
  var tb = document.createElement('tbody');

  for (var d = 0; d < 14; d++) {
    var day = new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    var dayCharges = myCharges.filter(function(ch) { return (ch.serviceDate || ch.createdAt || '').slice(0, 10) === day; });
    if (dayCharges.length === 0 && d > 0) continue;
    var daySummary = _summarize(dayCharges);
    var emCount = dayCharges.filter(function(ch) { return (ch.category || '') === 'E&M'; }).length;
    var procCount = dayCharges.filter(function(ch) { return (ch.category || '') === 'Procedure'; }).length;

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc(day) + '</td>' +
      '<td>' + daySummary.count + '</td>' +
      '<td>' + emCount + '</td>' +
      '<td>' + procCount + '</td>' +
      '<td>' + daySummary.rvus.toFixed(2) + '</td>' +
      '<td>' + _formatMoney(daySummary.fees) + '</td>';
    tb.appendChild(tr);
  }

  tbl.appendChild(tb);
  tw.appendChild(tbl);
  dailyCard.appendChild(tw);
  app.appendChild(dailyCard);

  // CPT Code frequency
  var freqCard = document.createElement('div');
  freqCard.className = 'card';
  freqCard.style.marginTop = '16px';
  freqCard.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><strong>Top CPT Codes (Last 30 Days)</strong></div>';
  var cptFreq = {};
  monthCharges.forEach(function(ch) {
    var key = ch.cptCode || 'Unknown';
    if (!cptFreq[key]) cptFreq[key] = { code: key, description: ch.description || '', count: 0, rvus: 0, fees: 0 };
    cptFreq[key].count++;
    cptFreq[key].rvus += (ch.rvu || 0) * (ch.units || 1);
    cptFreq[key].fees += (ch.fee || 0) * (ch.units || 1);
  });
  var sortedCpts = Object.values(cptFreq).sort(function(a, b) { return b.count - a.count; }).slice(0, 15);

  var tw2 = document.createElement('div');
  tw2.className = 'table-wrap';
  var tbl2 = document.createElement('table');
  tbl2.className = 'table billing-table';
  tbl2.innerHTML = '<thead><tr><th>CPT</th><th>Description</th><th>Count</th><th>RVUs</th><th>Fees</th></tr></thead>';
  var tb2 = document.createElement('tbody');
  if (sortedCpts.length === 0) {
    tb2.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted);">No charges in the last 30 days</td></tr>';
  }
  sortedCpts.forEach(function(item) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><strong>' + esc(item.code) + '</strong></td><td>' + esc(item.description) + '</td><td>' + item.count + '</td><td>' + item.rvus.toFixed(2) + '</td><td>' + _formatMoney(item.fees) + '</td>';
    tb2.appendChild(tr);
  });
  tbl2.appendChild(tb2);
  tw2.appendChild(tbl2);
  freqCard.appendChild(tw2);
  app.appendChild(freqCard);
}

/* ============================================================
   CHARGE ENTRY MODAL
   ============================================================ */
function openChargeEntryModal(chargeId, presetEncounterId) {
  var existing = chargeId ? getCharge(chargeId) : null;

  var body = '';

  // Patient search
  body += '<div class="form-group">';
  body += '<label class="form-label">Patient</label>';
  body += '<input class="form-control" id="cc-patient-search" placeholder="Search by name or MRN..." autocomplete="off" value="' + (existing ? esc(_getPatientName(existing.patientId)) : '') + '">';
  body += '<div id="cc-patient-results" class="billing-search-results"></div>';
  body += '<input type="hidden" id="cc-patient-id" value="' + (existing ? esc(existing.patientId || '') : '') + '">';
  body += '</div>';

  // Encounter select
  body += '<div class="form-group">';
  body += '<label class="form-label">Encounter</label>';
  body += '<select class="form-control" id="cc-encounter-select"' + (!existing && !presetEncounterId ? ' disabled' : '') + '><option value="">Select encounter...</option></select>';
  body += '</div>';

  // CPT code search
  body += '<div class="form-group">';
  body += '<label class="form-label">CPT Code</label>';
  body += '<input class="form-control" id="cc-cpt-search" placeholder="Search CPT code or description..." autocomplete="off" value="' + (existing ? esc(existing.cptCode || '') : '') + '">';
  body += '<div id="cc-cpt-results" class="billing-search-results"></div>';
  body += '<input type="hidden" id="cc-cpt-code" value="' + (existing ? esc(existing.cptCode || '') : '') + '">';
  body += '<div id="cc-cpt-detail" style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + (existing ? esc(existing.description || '') : '') + '</div>';
  body += '</div>';

  // ICD-10 codes
  body += '<div class="form-group">';
  body += '<label class="form-label">ICD-10 Diagnosis Codes</label>';
  body += '<input class="form-control" id="cc-icd10" placeholder="E11.9, I10, ..." value="' + (existing ? esc((existing.icd10Codes || []).join(', ')) : '') + '">';
  body += '</div>';

  // Units, Modifier, Fee
  body += '<div class="form-row">';
  body += '<div class="form-group"><label class="form-label">Units</label><input class="form-control" type="number" min="1" id="cc-units" value="' + (existing ? (existing.units || 1) : 1) + '"></div>';
  body += '<div class="form-group"><label class="form-label">Modifier</label><select class="form-control" id="cc-modifier"><option value="">None</option>';
  MODIFIER_LIST.forEach(function(m) {
    body += '<option value="' + esc(m.code) + '"' + (existing && existing.modifiers && existing.modifiers[0] === m.code ? ' selected' : '') + '>' + esc(m.code + ' — ' + m.description) + '</option>';
  });
  body += '</select></div>';
  body += '<div class="form-group"><label class="form-label">Fee ($)</label><input class="form-control" type="number" step="0.01" id="cc-fee" value="' + (existing ? (existing.fee || 0) : 0) + '"></div>';
  body += '</div>';

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>';
  footer += '<button class="btn btn-primary" id="cc-save-charge">' + (existing ? 'Update' : 'Save') + ' Charge</button>';

  openModal({ title: existing ? 'Edit Charge' : 'New Charge', bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    var patSearch = document.getElementById('cc-patient-search');
    var patResults = document.getElementById('cc-patient-results');
    var patIdInput = document.getElementById('cc-patient-id');
    var encSelect = document.getElementById('cc-encounter-select');
    var cptSearch = document.getElementById('cc-cpt-search');
    var cptResults = document.getElementById('cc-cpt-results');
    var cptCodeInput = document.getElementById('cc-cpt-code');
    var cptDetail = document.getElementById('cc-cpt-detail');
    var feeInput = document.getElementById('cc-fee');

    // If editing or preset encounter, load encounters
    if (existing && existing.patientId) {
      _loadEncSelectOptions(encSelect, existing.patientId, existing.encounterId);
    } else if (presetEncounterId) {
      var enc = getEncounter(presetEncounterId);
      if (enc) {
        patIdInput.value = enc.patientId;
        patSearch.value = _getPatientName(enc.patientId);
        _loadEncSelectOptions(encSelect, enc.patientId, presetEncounterId);
      }
    }

    // Patient search
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
          _loadEncSelectOptions(encSelect, p.id, null);
        });
        patResults.appendChild(row);
      });
    });

    // CPT code search
    cptSearch.addEventListener('input', function() {
      var q = cptSearch.value.trim().toLowerCase();
      cptResults.innerHTML = '';
      if (q.length < 2) return;
      var matches = CPT_DATABASE.filter(function(c) {
        return c.code.toLowerCase().indexOf(q) !== -1 || c.description.toLowerCase().indexOf(q) !== -1 || c.category.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 10);
      matches.forEach(function(c) {
        var row = document.createElement('div');
        row.className = 'billing-search-result-item';
        row.innerHTML = '<strong>' + esc(c.code) + '</strong> — ' + esc(c.description) + ' <span style="color:var(--text-muted);font-size:11px;">(' + esc(c.category) + ', RVU: ' + c.rvu + ')</span>';
        row.addEventListener('click', function() {
          cptCodeInput.value = c.code;
          cptSearch.value = c.code;
          cptDetail.textContent = c.description + ' | Category: ' + c.category + ' | RVU: ' + c.rvu + ' | Fee: $' + c.fee;
          feeInput.value = c.fee;
        });
        cptResults.appendChild(row);
      });
    });

    // Save
    document.getElementById('cc-save-charge').addEventListener('click', function() {
      var patientId = patIdInput.value;
      var encounterId = encSelect.value || null;
      var cptCode = cptCodeInput.value || cptSearch.value.trim();
      if (!patientId) { showToast('Select a patient', 'warning'); return; }
      if (!cptCode) { showToast('Enter a CPT code', 'warning'); return; }

      var cptInfo = CPT_DATABASE.find(function(c) { return c.code === cptCode; }) || {};
      var modVal = document.getElementById('cc-modifier').value;
      var icd10Str = document.getElementById('cc-icd10').value.trim();
      var icd10Codes = icd10Str ? icd10Str.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];

      var encounter = encounterId ? getEncounter(encounterId) : null;

      var chargeData = {
        patientId: patientId,
        encounterId: encounterId,
        providerId: encounter ? encounter.providerId : (getSessionUser() ? getSessionUser().id : null),
        cptCode: cptCode,
        description: cptInfo.description || cptSearch.value.trim(),
        category: cptInfo.category || 'Other',
        units: parseInt(document.getElementById('cc-units').value) || 1,
        modifiers: modVal ? [modVal] : [],
        icd10Codes: icd10Codes,
        rvu: cptInfo.rvu || 0,
        fee: parseFloat(document.getElementById('cc-fee').value) || cptInfo.fee || 0,
        serviceDate: encounter ? encounter.dateTime : new Date().toISOString(),
      };

      if (existing) chargeData.id = existing.id;

      var result = saveCharge(chargeData);
      if (result && result.error) {
        showToast('Error: ' + (result.errors || []).join(', '), 'error');
        return;
      }

      showToast('Charge ' + (existing ? 'updated' : 'saved'), 'success');
      closeModal();
      if (window.location.hash === '#charge-capture') renderChargeCapture();
    });
  }, 50);
}

function _loadEncSelectOptions(select, patientId, selectedEncId) {
  select.innerHTML = '<option value="">Select encounter...</option>';
  select.disabled = false;
  var encounters = getEncountersByPatient(patientId);
  encounters.forEach(function(e) {
    var opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = (e.dateTime ? formatDateTime(e.dateTime) : '') + ' — ' + (e.visitType || 'Visit') + (e.visitSubtype ? ' / ' + e.visitSubtype : '') + ' (' + (e.status || '') + ')';
    if (e.id === selectedEncId) opt.selected = true;
    select.appendChild(opt);
  });
}

function _getPatientName(patientId) {
  var p = getPatient(patientId);
  return p ? p.firstName + ' ' + p.lastName : '';
}
