/* ============================================================
   views/e-prescribe.js — Electronic Prescribing UI
   Prescription queue, pharmacy picker, DEA schedule,
   formulary status, controlled substance handling
   ============================================================ */

/* ---------- DEA Schedule Database ---------- */
var DEA_SCHEDULES = {
  // Schedule II — high abuse potential
  'oxycodone': { schedule: 'II', label: 'C-II' },
  'hydrocodone': { schedule: 'II', label: 'C-II' },
  'morphine': { schedule: 'II', label: 'C-II' },
  'fentanyl': { schedule: 'II', label: 'C-II' },
  'methadone': { schedule: 'II', label: 'C-II' },
  'amphetamine': { schedule: 'II', label: 'C-II' },
  'methylphenidate': { schedule: 'II', label: 'C-II' },
  'adderall': { schedule: 'II', label: 'C-II' },
  'ritalin': { schedule: 'II', label: 'C-II' },
  'concerta': { schedule: 'II', label: 'C-II' },
  'oxycontin': { schedule: 'II', label: 'C-II' },
  'percocet': { schedule: 'II', label: 'C-II' },
  'hydromorphone': { schedule: 'II', label: 'C-II' },
  'dilaudid': { schedule: 'II', label: 'C-II' },
  'dexmethylphenidate': { schedule: 'II', label: 'C-II' },
  'lisdexamfetamine': { schedule: 'II', label: 'C-II' },
  'vyvanse': { schedule: 'II', label: 'C-II' },
  // Schedule III
  'testosterone': { schedule: 'III', label: 'C-III' },
  'buprenorphine': { schedule: 'III', label: 'C-III' },
  'suboxone': { schedule: 'III', label: 'C-III' },
  'ketamine': { schedule: 'III', label: 'C-III' },
  'anabolic steroids': { schedule: 'III', label: 'C-III' },
  // Schedule IV
  'benzodiazepine': { schedule: 'IV', label: 'C-IV' },
  'lorazepam': { schedule: 'IV', label: 'C-IV' },
  'diazepam': { schedule: 'IV', label: 'C-IV' },
  'alprazolam': { schedule: 'IV', label: 'C-IV' },
  'clonazepam': { schedule: 'IV', label: 'C-IV' },
  'midazolam': { schedule: 'IV', label: 'C-IV' },
  'zolpidem': { schedule: 'IV', label: 'C-IV' },
  'ambien': { schedule: 'IV', label: 'C-IV' },
  'eszopiclone': { schedule: 'IV', label: 'C-IV' },
  'tramadol': { schedule: 'IV', label: 'C-IV' },
  'carisoprodol': { schedule: 'IV', label: 'C-IV' },
  'modafinil': { schedule: 'IV', label: 'C-IV' },
  'phenobarbital': { schedule: 'IV', label: 'C-IV' },
  // Schedule V
  'pregabalin': { schedule: 'V', label: 'C-V' },
  'lyrica': { schedule: 'V', label: 'C-V' },
  'cough syrup with codeine': { schedule: 'V', label: 'C-V' },
  'lacosamide': { schedule: 'V', label: 'C-V' },
};

/* ---------- Formulary Status Database ---------- */
var FORMULARY_STATUS = {
  // Preferred (Tier 1)
  'lisinopril': 'Preferred', 'metformin': 'Preferred', 'amlodipine': 'Preferred',
  'atorvastatin': 'Preferred', 'metoprolol': 'Preferred', 'omeprazole': 'Preferred',
  'losartan': 'Preferred', 'sertraline': 'Preferred', 'amoxicillin': 'Preferred',
  'ibuprofen': 'Preferred', 'acetaminophen': 'Preferred', 'gabapentin': 'Preferred',
  'levothyroxine': 'Preferred', 'furosemide': 'Preferred', 'prednisone': 'Preferred',
  'azithromycin': 'Preferred', 'albuterol': 'Preferred', 'fluticasone': 'Preferred',
  'clopidogrel': 'Preferred', 'warfarin': 'Preferred', 'pantoprazole': 'Preferred',
  'aspirin': 'Preferred', 'hydrochlorothiazide': 'Preferred', 'carvedilol': 'Preferred',
  'ceftriaxone': 'Preferred', 'vancomycin': 'Preferred', 'heparin': 'Preferred',
  'enoxaparin': 'Preferred', 'insulin glargine': 'Preferred',
  // Non-preferred (Tier 2)
  'rosuvastatin': 'Non-Preferred', 'escitalopram': 'Non-Preferred',
  'valsartan': 'Non-Preferred', 'esomeprazole': 'Non-Preferred',
  'duloxetine': 'Non-Preferred', 'pregabalin': 'Non-Preferred',
  'sumatriptan': 'Non-Preferred', 'celecoxib': 'Non-Preferred',
  'ondansetron': 'Non-Preferred', 'ketorolac': 'Non-Preferred',
  // Not covered
  'brand name drugs': 'Not Covered', 'compounded medications': 'Not Covered',
};

/* ---------- Prescription CRUD ---------- */
function getPrescriptions(patientId) {
  var all = loadAll(KEYS.prescriptions);
  if (patientId) return all.filter(function(p) { return p.patientId === patientId; });
  return all;
}

function getPrescription(id) {
  return loadAll(KEYS.prescriptions).find(function(p) { return p.id === id; }) || null;
}

function savePrescription(data) {
  var all = loadAll(KEYS.prescriptions, true);
  var idx = all.findIndex(function(p) { return p.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    var rec = {
      id: generateId(),
      patientId: '',
      orderId: '',
      drug: '',
      dose: '',
      unit: '',
      route: '',
      frequency: '',
      quantity: '',
      refills: 0,
      daysSupply: 30,
      instructions: '',
      prescribedBy: (getSessionUser() || {}).id || '',
      prescribedAt: new Date().toISOString(),
      pharmacyName: '',
      pharmacyPhone: '',
      pharmacyFax: '',
      pharmacyAddress: '',
      status: 'Pending',  // Pending, Sent, Filled, Cancelled
      sentAt: null,
      filledAt: null,
      deaSchedule: null,
      formularyStatus: null,
      isControlled: false,
      notes: '',
    };
    Object.assign(rec, data);

    // Auto-detect DEA schedule
    var drugLower = (rec.drug || '').toLowerCase();
    Object.keys(DEA_SCHEDULES).forEach(function(key) {
      if (drugLower.indexOf(key) >= 0) {
        rec.deaSchedule = DEA_SCHEDULES[key].label;
        rec.isControlled = true;
      }
    });

    // Auto-detect formulary status
    Object.keys(FORMULARY_STATUS).forEach(function(key) {
      if (drugLower.indexOf(key) >= 0) {
        rec.formularyStatus = FORMULARY_STATUS[key];
      }
    });

    all.push(rec);
  }
  saveAll(KEYS.prescriptions, all);
}

function updatePrescriptionStatus(id, status) {
  var all = loadAll(KEYS.prescriptions, true);
  var idx = all.findIndex(function(p) { return p.id === id; });
  if (idx < 0) return;
  all[idx].status = status;
  if (status === 'Sent') all[idx].sentAt = new Date().toISOString();
  if (status === 'Filled') all[idx].filledAt = new Date().toISOString();
  saveAll(KEYS.prescriptions, all);
}

/* ---------- Get DEA / Formulary helpers ---------- */
function getDEASchedule(drugName) {
  var lower = (drugName || '').toLowerCase();
  var result = null;
  Object.keys(DEA_SCHEDULES).forEach(function(key) {
    if (lower.indexOf(key) >= 0) result = DEA_SCHEDULES[key];
  });
  return result;
}

function getFormularyStatus(drugName) {
  var lower = (drugName || '').toLowerCase();
  var result = null;
  Object.keys(FORMULARY_STATUS).forEach(function(key) {
    if (lower.indexOf(key) >= 0) result = FORMULARY_STATUS[key];
  });
  return result || 'Unknown';
}

/* ---------- e-Prescribe Page ---------- */
function renderEPrescribe() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'e-Prescribing', meta: 'Prescription queue & pharmacy management', actions: '' });
  setActiveNav('e-prescribe');

  var container = document.createElement('div');
  container.style.padding = '24px';
  container.style.maxWidth = '1200px';
  container.style.margin = '0 auto';

  // Summary stats
  var allRx = getPrescriptions();
  var pendingCount = allRx.filter(function(r) { return r.status === 'Pending'; }).length;
  var sentCount = allRx.filter(function(r) { return r.status === 'Sent'; }).length;
  var filledCount = allRx.filter(function(r) { return r.status === 'Filled'; }).length;
  var controlledCount = allRx.filter(function(r) { return r.isControlled; }).length;

  var statsHTML = '<div class="erx-stats-row">' +
    '<div class="erx-stat-card erx-stat-pending"><div class="erx-stat-value">' + pendingCount + '</div><div class="erx-stat-label">Pending</div></div>' +
    '<div class="erx-stat-card erx-stat-sent"><div class="erx-stat-value">' + sentCount + '</div><div class="erx-stat-label">Sent</div></div>' +
    '<div class="erx-stat-card erx-stat-filled"><div class="erx-stat-value">' + filledCount + '</div><div class="erx-stat-label">Filled</div></div>' +
    '<div class="erx-stat-card erx-stat-controlled"><div class="erx-stat-value">' + controlledCount + '</div><div class="erx-stat-label">Controlled</div></div>' +
    '</div>';

  var statsDiv = document.createElement('div');
  statsDiv.innerHTML = statsHTML;
  container.appendChild(statsDiv);

  // Filter bar
  var filterBar = document.createElement('div');
  filterBar.className = 'erx-filter-bar';
  filterBar.innerHTML = '<input type="text" id="erx-search" class="erx-search-input" placeholder="Search prescriptions..." autocomplete="off" />' +
    '<div class="erx-status-filters">' +
    '<button class="erx-filter-btn active" data-status="all">All</button>' +
    '<button class="erx-filter-btn" data-status="Pending">Pending</button>' +
    '<button class="erx-filter-btn" data-status="Sent">Sent</button>' +
    '<button class="erx-filter-btn" data-status="Filled">Filled</button>' +
    '<button class="erx-filter-btn" data-status="Cancelled">Cancelled</button>' +
    '</div>' +
    '<button class="btn btn-primary btn-sm" id="erx-new-rx-btn">+ New Prescription</button>';
  container.appendChild(filterBar);

  // Prescription table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  tableCard.id = 'erx-table-card';
  container.appendChild(tableCard);

  app.appendChild(container);

  var currentFilter = 'all';
  var searchTerm = '';

  function renderTable() {
    var filtered = allRx.filter(function(rx) {
      if (currentFilter !== 'all' && rx.status !== currentFilter) return false;
      if (searchTerm) {
        var q = searchTerm.toLowerCase();
        var pat = getPatient(rx.patientId);
        var patName = pat ? (pat.firstName + ' ' + pat.lastName).toLowerCase() : '';
        return rx.drug.toLowerCase().indexOf(q) >= 0 || patName.indexOf(q) >= 0 ||
               rx.pharmacyName.toLowerCase().indexOf(q) >= 0;
      }
      return true;
    }).sort(function(a, b) { return new Date(b.prescribedAt) - new Date(a.prescribedAt); });

    var html = '<div class="card-header"><span class="card-title">Prescription Queue (' + filtered.length + ')</span></div>';
    html += '<div class="card-body" style="padding:0;overflow-x:auto">';

    if (filtered.length === 0) {
      html += '<div style="padding:24px;text-align:center;color:var(--text-muted)">No prescriptions found.</div>';
    } else {
      html += '<table class="erx-table"><thead><tr>' +
        '<th>Date</th><th>Patient</th><th>Medication</th><th>Sig</th><th>Qty/Refills</th>' +
        '<th>Pharmacy</th><th>Schedule</th><th>Formulary</th><th>Status</th><th>Actions</th>' +
        '</tr></thead><tbody>';

      filtered.forEach(function(rx) {
        var pat = getPatient(rx.patientId);
        var patName = pat ? pat.firstName + ' ' + pat.lastName : 'Unknown';

        var schedBadge = '';
        if (rx.deaSchedule) {
          schedBadge = '<span class="erx-dea-badge erx-dea-' + rx.deaSchedule.replace('-', '').toLowerCase() + '">' + esc(rx.deaSchedule) + '</span>';
        }

        var formularyBadge = '';
        var fs = rx.formularyStatus || 'Unknown';
        var fClass = 'erx-form-' + fs.toLowerCase().replace(/[^a-z]/g, '');
        formularyBadge = '<span class="erx-form-badge ' + fClass + '">' + esc(fs) + '</span>';

        var statusClass = 'erx-status-' + rx.status.toLowerCase();
        var sig = (rx.dose || '') + (rx.unit || '') + ' ' + (rx.route || '') + ' ' + (rx.frequency || '');

        var actionsHTML = '';
        if (rx.status === 'Pending') {
          actionsHTML = '<button class="btn btn-primary btn-sm erx-send-btn" data-rx-id="' + rx.id + '">Send</button>' +
            '<button class="btn btn-danger btn-sm erx-cancel-btn" data-rx-id="' + rx.id + '">Cancel</button>';
        } else if (rx.status === 'Sent') {
          actionsHTML = '<button class="btn btn-success btn-sm erx-fill-btn" data-rx-id="' + rx.id + '">Mark Filled</button>';
        }

        html += '<tr>' +
          '<td>' + formatDateTime(rx.prescribedAt) + '</td>' +
          '<td>' + esc(patName) + '</td>' +
          '<td class="erx-drug-cell"><strong>' + esc(rx.drug) + '</strong>' + schedBadge + '</td>' +
          '<td>' + esc(sig.trim()) + '</td>' +
          '<td>' + esc((rx.quantity || '-') + ' / ' + (rx.refills || 0) + ' refills') + '</td>' +
          '<td>' + esc(rx.pharmacyName || 'Not assigned') + '</td>' +
          '<td>' + schedBadge + '</td>' +
          '<td><span class="' + statusClass + '">' + esc(rx.status) + '</span></td>' +
          '<td class="erx-actions-cell">' + actionsHTML + '</td>' +
          '</tr>';
      });

      html += '</tbody></table>';
    }

    html += '</div>';
    tableCard.innerHTML = html;

    // Bind action buttons
    tableCard.querySelectorAll('.erx-send-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var rxId = btn.dataset.rxId;
        openSendToPharmacyModal(rxId);
      });
    });

    tableCard.querySelectorAll('.erx-cancel-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var rxId = btn.dataset.rxId;
        confirmAction({
          title: 'Cancel Prescription',
          message: 'Cancel this prescription? This cannot be undone.',
          confirmLabel: 'Cancel Rx',
          danger: true,
          onConfirm: function() {
            updatePrescriptionStatus(rxId, 'Cancelled');
            allRx = getPrescriptions();
            renderTable();
            showToast('Prescription cancelled.', 'success');
          },
        });
      });
    });

    tableCard.querySelectorAll('.erx-fill-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var rxId = btn.dataset.rxId;
        updatePrescriptionStatus(rxId, 'Filled');
        allRx = getPrescriptions();
        renderTable();
        showToast('Prescription marked as filled.', 'success');
      });
    });
  }

  renderTable();

  // Search
  document.getElementById('erx-search').addEventListener('input', function(e) {
    searchTerm = e.target.value;
    renderTable();
  });

  // Filters
  document.querySelectorAll('.erx-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.erx-filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      renderTable();
    });
  });

  // New prescription button
  document.getElementById('erx-new-rx-btn').addEventListener('click', function() {
    openNewPrescriptionModal();
  });
}

/* ---------- New Prescription Modal ---------- */
function openNewPrescriptionModal() {
  var patients = getPatients().sort(function(a, b) {
    return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName);
  });

  var bodyHTML = '<div class="erx-new-form">' +
    '<div class="form-group">' +
    '<label>Patient *</label>' +
    '<select id="erx-patient" required>' +
    '<option value="">-- Select Patient --</option>';
  patients.forEach(function(p) {
    bodyHTML += '<option value="' + p.id + '">' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });
  bodyHTML += '</select></div>' +
    '<div class="form-group">' +
    '<label>Medication *</label>' +
    '<input type="text" id="erx-drug" placeholder="Start typing drug name..." autocomplete="off" />' +
    '<div id="erx-drug-suggest" class="erx-drug-suggest hidden"></div>' +
    '</div>' +
    '<div class="form-row">' +
    '<div class="form-group"><label>Dose *</label><input type="text" id="erx-dose" placeholder="e.g. 10" /></div>' +
    '<div class="form-group"><label>Unit</label><input type="text" id="erx-unit" value="mg" /></div>' +
    '<div class="form-group"><label>Route</label><select id="erx-route"><option>PO</option><option>IV</option><option>IM</option><option>SQ</option><option>SL</option><option>Topical</option><option>Inhaled</option><option>PR</option><option>Other</option></select></div>' +
    '</div>' +
    '<div class="form-row">' +
    '<div class="form-group"><label>Frequency</label><select id="erx-freq"><option>QDay</option><option>BID</option><option>TID</option><option>QID</option><option>Q4h</option><option>Q6h</option><option>Q8h</option><option>Q12h</option><option>PRN</option><option>Once</option><option>QWeek</option><option>Other</option></select></div>' +
    '<div class="form-group"><label>Quantity</label><input type="number" id="erx-qty" value="30" min="1" /></div>' +
    '<div class="form-group"><label>Refills</label><input type="number" id="erx-refills" value="0" min="0" max="12" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Days Supply</label><input type="number" id="erx-days" value="30" min="1" /></div>' +
    '<div class="form-group"><label>Instructions / SIG</label><textarea id="erx-instructions" rows="2" placeholder="e.g. Take one tablet by mouth daily with food"></textarea></div>' +
    '<div id="erx-indicators" class="erx-indicators"></div>' +
    '</div>';

  var footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-success" id="erx-create-btn">Create Prescription</button>';

  openModal({ title: 'New Prescription', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  // Drug autocomplete from MEDICATION_DB
  var drugInput = document.getElementById('erx-drug');
  var suggestDiv = document.getElementById('erx-drug-suggest');

  drugInput.addEventListener('input', function() {
    var val = drugInput.value.toLowerCase().trim();
    if (val.length < 2) { suggestDiv.classList.add('hidden'); return; }

    var matches = [];
    if (typeof MEDICATION_DB !== 'undefined') {
      MEDICATION_DB.forEach(function(med) {
        var gn = med.generic.toLowerCase();
        var matchGeneric = gn.indexOf(val) >= 0;
        var matchBrand = med.brands.some(function(b) { return b.toLowerCase().indexOf(val) >= 0; });
        if (matchGeneric || matchBrand) matches.push(med);
      });
    }

    if (matches.length === 0) { suggestDiv.classList.add('hidden'); return; }

    suggestDiv.innerHTML = '';
    suggestDiv.classList.remove('hidden');
    matches.slice(0, 10).forEach(function(med) {
      var item = document.createElement('div');
      item.className = 'erx-suggest-item';
      var schedInfo = getDEASchedule(med.generic);
      var schedBadge = schedInfo ? ' <span class="erx-dea-badge-sm">' + schedInfo.label + '</span>' : '';
      item.innerHTML = '<strong>' + esc(med.generic) + '</strong>' + schedBadge +
        '<span class="text-muted text-sm"> ' + esc(med.brands.join(', ')) + ' · ' + esc(med.drugClass) + '</span>';
      item.addEventListener('click', function() {
        drugInput.value = med.generic;
        suggestDiv.classList.add('hidden');
        // Auto-fill dose form
        if (med.doseForms && med.doseForms[med.defaultDoseIndex || 0]) {
          var df = med.doseForms[med.defaultDoseIndex || 0];
          document.getElementById('erx-dose').value = df.dose || '';
          document.getElementById('erx-unit').value = df.unit || 'mg';
          document.getElementById('erx-route').value = df.route || 'PO';
          document.getElementById('erx-freq').value = df.defaultFreq || 'QDay';
        }
        updateIndicators(med.generic);
      });
      suggestDiv.appendChild(item);
    });
  });

  function updateIndicators(drugName) {
    var indDiv = document.getElementById('erx-indicators');
    if (!indDiv) return;
    var html = '';

    var sched = getDEASchedule(drugName);
    if (sched) {
      html += '<div class="erx-indicator erx-indicator-controlled">' +
        '<strong>Controlled Substance:</strong> DEA Schedule ' + sched.label +
        ' — Requires DEA number on prescription.' +
        '</div>';
    }

    var formulary = getFormularyStatus(drugName);
    var fClass = 'erx-indicator-' + formulary.toLowerCase().replace(/[^a-z]/g, '');
    html += '<div class="erx-indicator ' + fClass + '">' +
      '<strong>Formulary:</strong> ' + esc(formulary) +
      (formulary === 'Non-Preferred' ? ' — Patient may have higher copay. Consider preferred alternative.' : '') +
      (formulary === 'Not Covered' ? ' — Not covered by most plans. Prior authorization may be needed.' : '') +
      '</div>';

    indDiv.innerHTML = html;
  }

  drugInput.addEventListener('blur', function() {
    setTimeout(function() { suggestDiv.classList.add('hidden'); }, 200);
    updateIndicators(drugInput.value);
  });

  // Create prescription
  document.getElementById('erx-create-btn').addEventListener('click', function() {
    var patientId = document.getElementById('erx-patient').value;
    var drug = document.getElementById('erx-drug').value.trim();
    var dose = document.getElementById('erx-dose').value.trim();

    if (!patientId) { showToast('Please select a patient.', 'warning'); return; }
    if (!drug) { showToast('Please enter a medication.', 'warning'); return; }
    if (!dose) { showToast('Please enter a dose.', 'warning'); return; }

    savePrescription({
      patientId: patientId,
      drug: drug,
      dose: dose,
      unit: document.getElementById('erx-unit').value,
      route: document.getElementById('erx-route').value,
      frequency: document.getElementById('erx-freq').value,
      quantity: document.getElementById('erx-qty').value,
      refills: parseInt(document.getElementById('erx-refills').value) || 0,
      daysSupply: parseInt(document.getElementById('erx-days').value) || 30,
      instructions: document.getElementById('erx-instructions').value,
      status: 'Pending',
    });

    closeModal();
    showToast('Prescription created for ' + drug + '.', 'success');
    renderEPrescribe(); // refresh
  });
}

/* ---------- Send to Pharmacy Modal ---------- */
function openSendToPharmacyModal(rxId) {
  var rx = getPrescription(rxId);
  if (!rx) return;

  var patient = getPatient(rx.patientId);
  var patientPharmacy = patient ? (patient.pharmacyName || '') : '';

  var bodyHTML = '<div class="erx-send-form">' +
    '<div class="erx-send-rx-summary">' +
    '<strong>' + esc(rx.drug) + '</strong> ' + esc(rx.dose) + esc(rx.unit) + ' ' + esc(rx.route) + ' ' + esc(rx.frequency) +
    '<br><span class="text-muted">Qty: ' + esc(rx.quantity) + ' | Refills: ' + rx.refills + ' | Days: ' + rx.daysSupply + '</span>' +
    (rx.deaSchedule ? '<br><span class="erx-dea-badge">' + esc(rx.deaSchedule) + ' — Controlled Substance</span>' : '') +
    '</div>' +
    '<div class="form-group">' +
    '<label>Search Pharmacy</label>' +
    '<input type="text" id="erx-pharm-search" placeholder="Search by name, address, or chain..." autocomplete="off" />' +
    '</div>' +
    '<div id="erx-pharm-results" class="erx-pharm-results">';

  // Show patient's preferred pharmacy first
  if (patientPharmacy) {
    bodyHTML += '<div class="erx-pharm-preferred"><span class="text-muted text-sm">Patient\'s Preferred Pharmacy:</span> <strong>' + esc(patientPharmacy) + '</strong></div>';
  }

  bodyHTML += '</div></div>';

  var footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-success" id="erx-confirm-send" disabled>Send to Pharmacy</button>';

  openModal({ title: 'Send to Pharmacy', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  var selectedPharmacy = null;
  var resultsDiv = document.getElementById('erx-pharm-results');
  var sendBtn = document.getElementById('erx-confirm-send');

  function renderPharmacyResults(query) {
    if (typeof searchPharmacies !== 'function') {
      resultsDiv.innerHTML = '<div class="text-muted" style="padding:8px">Pharmacy database not available.</div>';
      return;
    }

    var results = searchPharmacies('', query || '');
    if (!query) results = results.slice(0, 10);

    resultsDiv.innerHTML = '';
    if (patientPharmacy && !query) {
      var prefDiv = document.createElement('div');
      prefDiv.className = 'erx-pharm-preferred';
      prefDiv.innerHTML = '<span class="text-muted text-sm">Patient\'s Preferred Pharmacy:</span> <strong>' + esc(patientPharmacy) + '</strong>';
      resultsDiv.appendChild(prefDiv);
    }

    results.forEach(function(pharm) {
      var item = document.createElement('div');
      item.className = 'erx-pharm-item';
      if (selectedPharmacy && selectedPharmacy.name === pharm.name) item.classList.add('erx-pharm-selected');

      item.innerHTML = '<div class="erx-pharm-name">' + esc(pharm.name) + '</div>' +
        '<div class="erx-pharm-detail">' + esc(pharm.address + ', ' + pharm.city + ', ' + pharm.state + ' ' + pharm.zip) + '</div>' +
        '<div class="erx-pharm-detail">' + esc(pharm.phone) + ' | Fax: ' + esc(pharm.fax) + '</div>' +
        '<div class="erx-pharm-detail">' + esc(pharm.hours) + (pharm.is24hr ? ' <span class="badge badge-routine">24 Hours</span>' : '') + '</div>';

      item.addEventListener('click', function() {
        selectedPharmacy = pharm;
        resultsDiv.querySelectorAll('.erx-pharm-item').forEach(function(el) { el.classList.remove('erx-pharm-selected'); });
        item.classList.add('erx-pharm-selected');
        sendBtn.disabled = false;
      });

      resultsDiv.appendChild(item);
    });

    if (results.length === 0) {
      resultsDiv.innerHTML = '<div class="text-muted" style="padding:12px;text-align:center">No pharmacies found.</div>';
    }
  }

  renderPharmacyResults('');

  document.getElementById('erx-pharm-search').addEventListener('input', function(e) {
    renderPharmacyResults(e.target.value);
  });

  sendBtn.addEventListener('click', function() {
    if (!selectedPharmacy) return;

    var all = loadAll(KEYS.prescriptions, true);
    var idx = all.findIndex(function(p) { return p.id === rxId; });
    if (idx >= 0) {
      all[idx].pharmacyName = selectedPharmacy.name;
      all[idx].pharmacyPhone = selectedPharmacy.phone;
      all[idx].pharmacyFax = selectedPharmacy.fax;
      all[idx].pharmacyAddress = selectedPharmacy.address + ', ' + selectedPharmacy.city + ', ' + selectedPharmacy.state + ' ' + selectedPharmacy.zip;
      all[idx].status = 'Sent';
      all[idx].sentAt = new Date().toISOString();
      saveAll(KEYS.prescriptions, all);
    }

    closeModal();
    showToast('Prescription sent to ' + selectedPharmacy.name + '.', 'success');
    renderEPrescribe(); // refresh
  });
}

/* ---------- Send to Pharmacy from Orders page ---------- */
function openSendToPharmacyFromOrder(order) {
  if (!order || order.type !== 'Medication') return;

  // Create prescription from order
  var patient = getPatient(order.patientId);
  savePrescription({
    patientId: order.patientId,
    orderId: order.id,
    drug: order.detail.drug || '',
    dose: order.detail.dose || '',
    unit: order.detail.unit || '',
    route: order.detail.route || '',
    frequency: order.detail.frequency || '',
    quantity: '30',
    refills: 0,
    daysSupply: 30,
    instructions: order.detail.indication || '',
    status: 'Pending',
  });

  var rxAll = getPrescriptions();
  var latestRx = rxAll.sort(function(a, b) { return new Date(b.prescribedAt) - new Date(a.prescribedAt); })[0];
  if (latestRx) {
    openSendToPharmacyModal(latestRx.id);
  }
}
