/* ============================================================
   views/order-sets.js — Pre-built order bundles
   Standalone page + integration with orders page
   ============================================================ */

/* ---------- Built-in Order Sets (extended) ---------- */
var BUILT_IN_ORDER_SETS = [
  {
    id: 'os-admission', name: 'Admission Order Set', category: 'Admission',
    description: 'Standard admission orders including diet, activity, vitals, VTE prophylaxis, IV fluids, and basic labs.',
    items: [
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '1000', unit: 'mL', route: 'IV', frequency: 'Q8h', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Enoxaparin', dose: '40', unit: 'mg', route: 'SQ', frequency: 'QDay', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Comprehensive Metabolic Panel', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Urinalysis', tests: [] }, priority: 'Routine' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Admission baseline' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-chest-pain', name: 'Chest Pain Protocol', category: 'Protocol',
    description: 'Troponin q6h, ECG, chest X-ray, aspirin, heparin, cardiology consult.',
    items: [
      { type: 'Lab', detail: { panel: 'Troponin', tests: [{ name: 'Troponin I', frequency: 'Q6h x3' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Imaging', detail: { study: 'ECG (12-lead)', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Chest pain evaluation' }, priority: 'STAT' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Chest pain' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Aspirin', dose: '325', unit: 'mg', route: 'PO', frequency: 'Once', duration: '' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Heparin', dose: '60', unit: 'units', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Heparin Drip', dose: '12', unit: 'units', route: 'IV', frequency: 'Q1h', duration: 'Ongoing' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Nitroglycerin', dose: '0.4', unit: 'mg', route: 'SL', frequency: 'PRN', duration: '' }, priority: 'Urgent' },
      { type: 'Consult', detail: { service: 'Cardiology', reason: 'Acute chest pain evaluation', urgency: 'Urgent' }, priority: 'Urgent' },
    ]
  },
  {
    id: 'os-dka', name: 'DKA Bundle', category: 'Protocol',
    description: 'Insulin drip, BMP q2h, fluid resuscitation, potassium monitoring.',
    items: [
      { type: 'Medication', detail: { drug: 'Insulin Regular Drip', dose: '0.1', unit: 'units/kg/hr', route: 'IV', frequency: 'Continuous', duration: 'Ongoing' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '1000', unit: 'mL', route: 'IV', frequency: 'Once', duration: 'Over 1 hour' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '500', unit: 'mL', route: 'IV', frequency: 'Q2h', duration: 'Per protocol' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Potassium Chloride', dose: '20', unit: 'mEq', route: 'IV', frequency: 'PRN', duration: 'Per K+ level' }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [{ name: 'BMP', frequency: 'Q2h' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Arterial Blood Gas', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Urinalysis', tests: [] }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-sepsis', name: 'Sepsis Bundle', category: 'Protocol',
    description: 'Blood cultures, lactate, broad-spectrum antibiotics, fluid bolus, vasopressors.',
    items: [
      { type: 'Lab', detail: { panel: 'Blood Culture', tests: [{ name: 'Blood Culture x2' }] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Lactic Acid', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Comprehensive Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Vancomycin', dose: '25', unit: 'mg/kg', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Piperacillin-Tazobactam', dose: '4.5', unit: 'g', route: 'IV', frequency: 'Q6h', duration: '7 days' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Normal Saline', dose: '30', unit: 'mL/kg', route: 'IV', frequency: 'Once', duration: 'Over 3 hours' }, priority: 'STAT' },
      { type: 'Medication', detail: { drug: 'Norepinephrine', dose: '0.1', unit: 'mcg/kg/min', route: 'IV', frequency: 'Continuous', duration: 'PRN MAP <65' }, priority: 'STAT' },
    ]
  },
  {
    id: 'os-postop', name: 'Post-Op Order Set', category: 'Specialty',
    description: 'Pain management, DVT prophylaxis, diet advancement, wound care.',
    items: [
      { type: 'Medication', detail: { drug: 'Acetaminophen', dose: '1000', unit: 'mg', route: 'PO', frequency: 'Q6h', duration: '5 days' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Ketorolac', dose: '15', unit: 'mg', route: 'IV', frequency: 'Q6h', duration: '48 hours max' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Ondansetron', dose: '4', unit: 'mg', route: 'IV', frequency: 'Q8h PRN', duration: '3 days' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Enoxaparin', dose: '40', unit: 'mg', route: 'SQ', frequency: 'QDay', duration: 'Until ambulating' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Docusate Sodium', dose: '100', unit: 'mg', route: 'PO', frequency: 'BID', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-chf-admission', name: 'CHF Admission', category: 'Specialty',
    description: 'Diuretics, ACE inhibitor, BNP, daily weights, fluid restriction.',
    items: [
      { type: 'Medication', detail: { drug: 'Furosemide', dose: '40', unit: 'mg', route: 'IV', frequency: 'BID', duration: 'Ongoing' }, priority: 'Urgent' },
      { type: 'Medication', detail: { drug: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Medication', detail: { drug: 'Carvedilol', dose: '6.25', unit: 'mg', route: 'PO', frequency: 'BID', duration: 'Ongoing' }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'B-type Natriuretic Peptide', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'CHF evaluation' }, priority: 'Routine' },
      { type: 'Consult', detail: { service: 'Cardiology', reason: 'CHF exacerbation management', urgency: 'Routine' }, priority: 'Routine' },
    ]
  },
  {
    id: 'os-stroke', name: 'Stroke Protocol', category: 'Protocol',
    description: 'CT head, CTA, basic labs, coagulation panel, neurology consult.',
    items: [
      { type: 'Imaging', detail: { study: 'CT Head without Contrast', modality: 'CT', bodyPart: 'Head', indication: 'Acute stroke evaluation' }, priority: 'STAT' },
      { type: 'Imaging', detail: { study: 'CT Angiography Head/Neck', modality: 'CT', bodyPart: 'Head/Neck', indication: 'Stroke — vessel evaluation' }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Troponin', tests: [] }, priority: 'STAT' },
      { type: 'Consult', detail: { service: 'Neurology', reason: 'Acute stroke evaluation', urgency: 'STAT' }, priority: 'STAT' },
    ]
  },
  {
    id: 'os-pneumonia', name: 'Pneumonia', category: 'Specialty',
    description: 'Antibiotics, blood cultures, chest X-ray, respiratory panel.',
    items: [
      { type: 'Medication', detail: { drug: 'Ceftriaxone', dose: '1', unit: 'g', route: 'IV', frequency: 'QDay', duration: '7 days' }, priority: 'Urgent' },
      { type: 'Medication', detail: { drug: 'Azithromycin', dose: '500', unit: 'mg', route: 'IV', frequency: 'QDay', duration: '5 days' }, priority: 'Urgent' },
      { type: 'Lab', detail: { panel: 'Blood Culture', tests: [] }, priority: 'STAT' },
      { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
      { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
      { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Community-acquired pneumonia' }, priority: 'Routine' },
    ]
  },
];

/* ---------- Get all order sets (built-in + custom) ---------- */
function getOrderSets() {
  var custom = loadAll(KEYS.orderSets);
  return BUILT_IN_ORDER_SETS.concat(custom);
}

function getOrderSet(id) {
  return getOrderSets().find(function(s) { return s.id === id; }) || null;
}

function saveCustomOrderSet(data) {
  var all = loadAll(KEYS.orderSets, true);
  var idx = all.findIndex(function(s) { return s.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    var rec = {
      id: generateId(),
      name: '',
      category: 'Custom',
      description: '',
      items: [],
      createdBy: (getSessionUser() || {}).id || '',
      createdAt: new Date().toISOString(),
    };
    Object.assign(rec, data);
    all.push(rec);
  }
  saveAll(KEYS.orderSets, all);
}

function deleteCustomOrderSet(id) {
  softDeleteRecord(KEYS.orderSets, id);
}

/* ---------- Place all orders from a set ---------- */
function placeOrderSet(orderSetId, encounterId, patientId, selectedIndices) {
  var set = getOrderSet(orderSetId);
  if (!set) return 0;
  var user = getSessionUser();
  var orderedBy = (user || {}).id || '';
  var placed = 0;

  set.items.forEach(function(item, idx) {
    if (selectedIndices && selectedIndices.indexOf(idx) < 0) return;
    saveOrder({
      encounterId: encounterId,
      patientId: patientId,
      orderedBy: orderedBy,
      type: item.type,
      priority: item.priority,
      status: 'Pending',
      detail: Object.assign({}, item.detail),
      notes: 'From order set: ' + set.name,
      dateTime: new Date().toISOString(),
    });
    placed++;
  });

  return placed;
}

/* ---------- Render Order Sets page ---------- */
function renderOrderSets() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Order Sets', meta: 'Pre-built order bundles', actions: '' });
  setActiveNav('order-sets');

  var container = document.createElement('div');
  container.style.padding = '24px';
  container.style.maxWidth = '1100px';
  container.style.margin = '0 auto';

  // Search / filter bar
  var filterBar = document.createElement('div');
  filterBar.className = 'os-filter-bar';
  filterBar.innerHTML = '<input type="text" id="os-search" class="os-search-input" placeholder="Search order sets..." autocomplete="off" />' +
    '<div class="os-category-filters">' +
    '<button class="os-cat-btn active" data-cat="all">All</button>' +
    '<button class="os-cat-btn" data-cat="Admission">Admission</button>' +
    '<button class="os-cat-btn" data-cat="Protocol">Protocol</button>' +
    '<button class="os-cat-btn" data-cat="Specialty">Specialty</button>' +
    '<button class="os-cat-btn" data-cat="Custom">Custom</button>' +
    '</div>';
  container.appendChild(filterBar);

  // Grid
  var grid = document.createElement('div');
  grid.id = 'os-grid';
  grid.className = 'os-grid';
  container.appendChild(grid);

  app.appendChild(container);

  // Render cards
  var allSets = getOrderSets();
  var currentFilter = 'all';
  var searchTerm = '';

  function renderGrid() {
    grid.innerHTML = '';
    var filtered = allSets.filter(function(s) {
      if (currentFilter !== 'all' && s.category !== currentFilter) return false;
      if (searchTerm) {
        var q = searchTerm.toLowerCase();
        return s.name.toLowerCase().indexOf(q) >= 0 ||
               s.description.toLowerCase().indexOf(q) >= 0 ||
               s.category.toLowerCase().indexOf(q) >= 0;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.appendChild(buildEmptyState('📦', 'No order sets found', 'Try a different search or category.'));
      return;
    }

    filtered.forEach(function(set) {
      var card = document.createElement('div');
      card.className = 'os-card';
      card.setAttribute('data-set-id', set.id);

      var catBadgeClass = 'os-cat-badge os-cat-' + set.category.toLowerCase();
      var medCount = set.items.filter(function(i) { return i.type === 'Medication'; }).length;
      var labCount = set.items.filter(function(i) { return i.type === 'Lab'; }).length;
      var imgCount = set.items.filter(function(i) { return i.type === 'Imaging'; }).length;
      var conCount = set.items.filter(function(i) { return i.type === 'Consult'; }).length;

      card.innerHTML = '<div class="os-card-header">' +
        '<h3 class="os-card-title">' + esc(set.name) + '</h3>' +
        '<span class="' + catBadgeClass + '">' + esc(set.category) + '</span>' +
        '</div>' +
        '<p class="os-card-desc">' + esc(set.description) + '</p>' +
        '<div class="os-card-counts">' +
        (medCount ? '<span class="os-count-badge os-count-med">' + medCount + ' Meds</span>' : '') +
        (labCount ? '<span class="os-count-badge os-count-lab">' + labCount + ' Labs</span>' : '') +
        (imgCount ? '<span class="os-count-badge os-count-img">' + imgCount + ' Imaging</span>' : '') +
        (conCount ? '<span class="os-count-badge os-count-con">' + conCount + ' Consults</span>' : '') +
        '</div>' +
        '<div class="os-card-footer">' +
        '<span class="os-item-total">' + set.items.length + ' orders total</span>' +
        '<button class="btn btn-primary btn-sm os-preview-btn">Preview &amp; Place</button>' +
        '</div>';

      card.querySelector('.os-preview-btn').addEventListener('click', function() {
        openOrderSetPreview(set);
      });

      grid.appendChild(card);
    });
  }

  renderGrid();

  // Search
  document.getElementById('os-search').addEventListener('input', function(e) {
    searchTerm = e.target.value;
    renderGrid();
  });

  // Category filters
  document.querySelectorAll('.os-cat-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.os-cat-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderGrid();
    });
  });
}

/* ---------- Preview modal ---------- */
function openOrderSetPreview(set) {
  var bodyHTML = '<div class="os-preview">';
  bodyHTML += '<p class="os-preview-desc">' + esc(set.description) + '</p>';
  bodyHTML += '<div class="os-preview-items">';

  set.items.forEach(function(item, idx) {
    var desc = '';
    if (item.type === 'Medication') {
      desc = (item.detail.drug || 'Medication') + ' ' + (item.detail.dose || '') + (item.detail.unit || '') + ' ' + (item.detail.route || '') + ' ' + (item.detail.frequency || '');
    } else if (item.type === 'Lab') {
      desc = item.detail.panel || 'Lab';
    } else if (item.type === 'Imaging') {
      desc = (item.detail.study || item.detail.modality || '') + ' ' + (item.detail.bodyPart || '');
    } else if (item.type === 'Consult') {
      desc = 'Consult: ' + (item.detail.service || '');
    }

    var prioClass = 'badge badge-' + item.priority.toLowerCase();
    bodyHTML += '<label class="os-preview-item">' +
      '<input type="checkbox" checked data-item-idx="' + idx + '" class="os-item-check" />' +
      '<span class="os-preview-item-info">' +
      '<span class="os-preview-type-icon">' + getOrderTypeIcon(item.type) + '</span>' +
      '<span class="os-preview-detail">' +
      '<strong>' + esc(item.type) + ':</strong> ' + esc(desc) +
      '</span>' +
      '<span class="' + prioClass + '">' + esc(item.priority) + '</span>' +
      '</span>' +
      '</label>';
  });

  bodyHTML += '</div>';

  // Encounter selector (if not already in an encounter context)
  bodyHTML += '<div class="os-encounter-select">' +
    '<label><strong>Select Encounter:</strong></label>' +
    '<select id="os-encounter-picker" class="os-encounter-picker">' +
    '<option value="">-- Select an encounter --</option>';

  var encounters = getEncounters().filter(function(e) { return e.status === 'Open'; }).sort(function(a, b) {
    return new Date(b.dateTime) - new Date(a.dateTime);
  });
  encounters.forEach(function(enc) {
    var pat = getPatient(enc.patientId);
    var patName = pat ? pat.firstName + ' ' + pat.lastName : 'Unknown';
    bodyHTML += '<option value="' + esc(enc.id) + '">' + esc(patName) + ' - ' + esc(enc.visitType) + ' - ' + formatDateTime(enc.dateTime) + '</option>';
  });

  bodyHTML += '</select></div></div>';

  var footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-success" id="os-place-btn">Place Selected Orders</button>';

  openModal({ title: set.name, bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  // Select all / deselect all
  var placeBtn = document.getElementById('os-place-btn');
  placeBtn.addEventListener('click', function() {
    var encPicker = document.getElementById('os-encounter-picker');
    var encId = encPicker ? encPicker.value : '';
    if (!encId) {
      showToast('Please select an encounter first.', 'warning');
      return;
    }

    var enc = getEncounter(encId);
    if (!enc) {
      showToast('Encounter not found.', 'error');
      return;
    }

    var checks = document.querySelectorAll('.os-item-check');
    var selectedIndices = [];
    checks.forEach(function(cb) {
      if (cb.checked) selectedIndices.push(parseInt(cb.dataset.itemIdx));
    });

    if (selectedIndices.length === 0) {
      showToast('No orders selected.', 'warning');
      return;
    }

    // Check CDS before placing
    var alerts = [];
    if (typeof checkCDS === 'function') {
      set.items.forEach(function(item, idx) {
        if (selectedIndices.indexOf(idx) < 0) return;
        var orderData = {
          type: item.type,
          detail: item.detail,
          patientId: enc.patientId,
          encounterId: encId,
        };
        var itemAlerts = checkCDS(orderData, enc.patientId);
        if (itemAlerts && itemAlerts.length > 0) {
          alerts = alerts.concat(itemAlerts);
        }
      });
    }

    if (alerts.length > 0) {
      showCDSAlertsBeforePlacing(alerts, function() {
        var placed = placeOrderSet(set.id, encId, enc.patientId, selectedIndices);
        closeModal();
        showToast(placed + ' orders placed from "' + set.name + '".', 'success');
      });
      return;
    }

    var placed = placeOrderSet(set.id, encId, enc.patientId, selectedIndices);
    closeModal();
    showToast(placed + ' orders placed from "' + set.name + '".', 'success');
  });
}

function getOrderTypeIcon(type) {
  var icons = { Medication: '💊', Lab: '🧪', Imaging: '🩻', Consult: '👨‍⚕️' };
  return icons[type] || '📋';
}
