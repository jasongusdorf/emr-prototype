/* ============================================================
   views/orders.js — Two-panel CPOE
   Left: order list grouped by type
   Right: order entry form with 4 type selectors
   ============================================================ */

const ORDER_TYPES = ['Medication', 'Lab', 'Imaging', 'Consult', 'Diet', 'Nursing', 'Activity'];
const ORDER_TYPE_ICONS = { Medication: '', Lab: '', Imaging: '', Consult: '', Diet: '', Nursing: '', Activity: '' };
const PRIORITIES = ['Routine', 'Urgent', 'STAT'];

// Common lab panels
const LAB_PANELS = [
  'Basic Metabolic Panel', 'Comprehensive Metabolic Panel', 'Complete Blood Count',
  'Lipid Panel', 'Thyroid Panel (TSH)', 'Hepatic Function Panel', 'Urinalysis',
  'Coagulation (PT/INR/PTT)', 'Blood Culture', 'Urine Culture', 'Other',
];
const IMAGING_MODALITIES = ['X-Ray', 'CT', 'MRI', 'Ultrasound', 'PET', 'Nuclear Medicine', 'Fluoroscopy'];
const MED_ROUTES = ['PO', 'IV', 'IM', 'SQ', 'SL', 'Topical', 'Inhaled', 'PR', 'NG', 'Other'];
const MED_UNITS  = ['mg', 'mcg', 'g', 'mEq', 'units', 'mL', 'mg/dL', 'Other'];
const MED_FREQS  = ['Once', 'BID', 'TID', 'QID', 'Q4h', 'Q6h', 'Q8h', 'Q12h', 'QDay', 'QWeek', 'PRN', 'Other'];
const CONSULT_SERVICES = [
  'Cardiology', 'Neurology', 'Pulmonology', 'Gastroenterology', 'Nephrology',
  'Endocrinology', 'Infectious Disease', 'Hematology/Oncology', 'Rheumatology',
  'Orthopedics', 'Surgery', 'Psychiatry', 'Physical Therapy', 'Social Work',
  'MFM (Maternal-Fetal Medicine)', 'Neonatology', 'Genetic Counseling', 'Lactation Consultant',
  'Speech-Language Pathology', 'Occupational Therapy', 'Palliative Care', 'Pain Management',
  'Other',
];

const DIET_TYPES = [
  'Regular (IDDSI 7)', 'Easy to Chew (IDDSI 7)', 'Soft & Bite-Sized (IDDSI 6)',
  'Minced & Moist (IDDSI 5)', 'Pureed (IDDSI 4)', 'Liquidised (IDDSI 3)',
  'NPO', 'Clear Liquids', 'Full Liquids',
  'Cardiac', 'Renal', 'Diabetic', 'Low Sodium', 'Low Fat',
];
const LIQUID_THICKNESS_OPTIONS = [
  'Thin (IDDSI 0)', 'Slightly Thick (IDDSI 1)', 'Mildly Thick (IDDSI 2)',
  'Moderately Thick (IDDSI 3)', 'Extremely Thick (IDDSI 4)',
];

const REHAB_FOCUS_AREAS = {
  'Physical Therapy':            ['Mobility', 'Strength', 'Balance', 'Gait', 'ROM', 'Pain management'],
  'Occupational Therapy':        ['ADLs', 'Fine motor', 'Cognition', 'Visual-perceptual', 'UE function'],
  'Speech-Language Pathology':   ['Swallowing', 'Language', 'Cognition', 'Voice', 'Fluency'],
};
const REHAB_FREQUENCIES = ['Daily', 'BID', 'TID', '3x week', '5x week', 'PRN'];
const ACTIVITY_LEVELS = ['Bedrest', 'BRP', 'Chair', 'Ambulate-assist', 'Independent'];
const WEIGHT_BEARING_OPTIONS = ['Full', 'Partial', 'Non-weight-bearing', 'As Tolerated'];

const ORDER_SETS = [
  { name: 'CHF Admission', orders: [
    { type: 'Medication', detail: { drug: 'Furosemide', dose: '40', unit: 'mg', route: 'IV', frequency: 'BID', duration: 'Ongoing' }, priority: 'Routine' },
    { type: 'Medication', detail: { drug: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', duration: 'Ongoing' }, priority: 'Routine' },
    { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
    { type: 'Lab', detail: { panel: 'B-type Natriuretic Peptide', tests: [] }, priority: 'Routine' },
    { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'CHF evaluation' }, priority: 'Routine' },
  ]},
  { name: 'Pneumonia', orders: [
    { type: 'Medication', detail: { drug: 'Ceftriaxone', dose: '1', unit: 'g', route: 'IV', frequency: 'QDay', duration: '7 days' }, priority: 'Urgent' },
    { type: 'Medication', detail: { drug: 'Azithromycin', dose: '500', unit: 'mg', route: 'IV', frequency: 'QDay', duration: '5 days' }, priority: 'Urgent' },
    { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
    { type: 'Lab', detail: { panel: 'Blood Culture', tests: [] }, priority: 'STAT' },
    { type: 'Imaging', detail: { study: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', indication: 'Pneumonia' }, priority: 'Routine' },
  ]},
  { name: 'DKA Protocol', orders: [
    { type: 'Medication', detail: { drug: 'Insulin Regular', dose: '0.1', unit: 'units', route: 'IV', frequency: 'Q1h', duration: 'Ongoing' }, priority: 'STAT' },
    { type: 'Medication', detail: { drug: 'Normal Saline', dose: '1000', unit: 'mL', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Arterial Blood Gas', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
  ]},
  { name: 'Sepsis Bundle', orders: [
    { type: 'Medication', detail: { drug: 'Vancomycin', dose: '1', unit: 'g', route: 'IV', frequency: 'Q12h', duration: '7 days' }, priority: 'STAT' },
    { type: 'Medication', detail: { drug: 'Piperacillin-Tazobactam', dose: '4.5', unit: 'g', route: 'IV', frequency: 'Q6h', duration: '7 days' }, priority: 'STAT' },
    { type: 'Medication', detail: { drug: 'Normal Saline', dose: '1000', unit: 'mL', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Blood Culture', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Lactic Acid', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
  ]},
  { name: 'GI Bleed', orders: [
    { type: 'Medication', detail: { drug: 'Pantoprazole', dose: '80', unit: 'mg', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Type and Screen', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
    { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'Routine' },
  ]},
  { name: 'Stroke Protocol', orders: [
    { type: 'Imaging', detail: { study: 'CT Head without Contrast', modality: 'CT', bodyPart: 'Head', indication: 'Acute stroke evaluation' }, priority: 'STAT' },
    { type: 'Imaging', detail: { study: 'CT Angiography Head/Neck', modality: 'CT', bodyPart: 'Head/Neck', indication: 'Stroke' }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'STAT' },
  ]},
  { name: 'Post-Op General', orders: [
    { type: 'Medication', detail: { drug: 'Acetaminophen', dose: '1000', unit: 'mg', route: 'PO', frequency: 'Q6h', duration: '3 days' }, priority: 'Routine' },
    { type: 'Medication', detail: { drug: 'Ondansetron', dose: '4', unit: 'mg', route: 'IV', frequency: 'Q8h', duration: '3 days' }, priority: 'Routine' },
    { type: 'Lab', detail: { panel: 'Complete Blood Count', tests: [] }, priority: 'Routine' },
    { type: 'Lab', detail: { panel: 'Basic Metabolic Panel', tests: [] }, priority: 'Routine' },
  ]},
  { name: 'DVT/PE Treatment', orders: [
    { type: 'Medication', detail: { drug: 'Heparin', dose: '80', unit: 'units', route: 'IV', frequency: 'Once', duration: '' }, priority: 'STAT' },
    { type: 'Medication', detail: { drug: 'Heparin Drip', dose: '18', unit: 'units', route: 'IV', frequency: 'Q1h', duration: 'Ongoing' }, priority: 'STAT' },
    { type: 'Lab', detail: { panel: 'Coagulation (PT/INR/PTT)', tests: [] }, priority: 'STAT' },
    { type: 'Imaging', detail: { study: 'CT Pulmonary Angiography', modality: 'CT', bodyPart: 'Chest', indication: 'PE evaluation' }, priority: 'STAT' },
  ]},
];

let _selectedType     = 'Medication';
let _selectedPriority = 'Routine';
let _ordersEncounterId = null;
let _currentPatientId = null;
let _showUnackedOnly = false;

/* ---------- Local order cache (perf) ---------- */
var _cachedOrders = null;
var _cachedOrdersEncId = null;

function getCachedOrders(encounterId) {
  if (_cachedOrdersEncId === encounterId && _cachedOrders) return _cachedOrders;
  _cachedOrders = getOrdersByEncounter(encounterId);
  _cachedOrdersEncId = encounterId;
  return _cachedOrders;
}

function _invalidateOrderCache() {
  _cachedOrders = null;
  _cachedOrdersEncId = null;
}

function renderOrders(encounterId) {
  _invalidateOrderCache();
  if (typeof _stopAllAutosaves === 'function') _stopAllAutosaves();  // clear encounter autosave if navigating from encounter view
  _ordersEncounterId = encounterId;
  _selectedType      = 'Medication';
  _selectedPriority  = 'Routine';

  const app = document.getElementById('app');
  app.innerHTML = '';

  const encounter = getEncounter(encounterId);
  if (!encounter) {
    app.textContent = 'Encounter not found.';
    setTopbar({ title: 'Orders — Encounter Not Found' });
    return;
  }

  const patient  = getPatient(encounter.patientId);
  _currentPatientId = encounter.patientId;
  const provider = getProvider(encounter.providerId);
  const patName  = patient  ? patient.firstName + ' ' + patient.lastName : 'Unknown Patient';
  const provName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : '[Removed Provider]';

  const isInpatient = getEncounterMode() === 'inpatient';
  setTopbar({
    title:  'Orders',
    meta:   patName + ' · ' + (patient ? patient.mrn : ''),
    actions: `
      <a href="${patient ? '#chart/' + esc(patient.id) : '#dashboard'}" class="btn btn-secondary btn-sm">← Chart</a>
      <a href="#encounter/${esc(encounterId)}" class="btn btn-secondary btn-sm">Note</a>
      ${isInpatient ? '<button class="btn btn-primary btn-sm" id="btn-order-sets">Order Sets</button>' : ''}
    `,
  });
  setActiveNav('dashboard');

  // Order Sets button handler
  const orderSetsBtn = document.getElementById('btn-order-sets');
  if (orderSetsBtn) {
    orderSetsBtn.addEventListener('click', () => openOrderSetsModal(encounter, patient));
  }

  // Patient identity banner
  if (patient) app.appendChild(buildPatientBanner(patient.id));

  // ---------- Context bar ----------
  const ctxBar = document.createElement('div');
  ctxBar.className = 'encounter-context-bar';

  const ctxFields = [
    ['Patient',  patName],
    ['MRN',      patient ? patient.mrn : '—'],
    ['Visit',    encounter.visitType + (encounter.visitSubtype ? ' — ' + encounter.visitSubtype : '')],
    ['Provider', provName],
    ['Date',     formatDateTime(encounter.dateTime)],
  ];

  ctxFields.forEach(([label, value], i) => {
    const span = document.createElement('span');
    const lbl = document.createElement('span');
    lbl.className = 'ctx-label';
    lbl.textContent = label;
    const br = document.createElement('br');
    const val = document.createElement('span');
    val.className = 'ctx-val';
    val.textContent = value;
    span.appendChild(lbl);
    span.appendChild(br);
    span.appendChild(val);
    ctxBar.appendChild(span);
    if (i < ctxFields.length - 1) {
      const div = document.createElement('span');
      div.className = 'encounter-context-divider';
      div.textContent = '|';
      ctxBar.appendChild(div);
    }
  });

  app.appendChild(ctxBar);

  // ---------- Two-panel layout ----------
  const layout = document.createElement('div');
  layout.className = 'orders-layout';
  layout.style.margin = '20px';

  // Left — order list
  const leftPanel = document.createElement('div');
  leftPanel.id = 'order-list-panel';
  renderOrderList(leftPanel, encounterId);

  // Right — entry form
  const rightPanel = document.createElement('div');
  rightPanel.id = 'order-entry-panel';
  renderOrderEntryForm(rightPanel, encounter, patient);

  layout.appendChild(leftPanel);
  layout.appendChild(rightPanel);
  app.appendChild(layout);

  // Register cleanup for view teardown
  if (typeof registerCleanup === 'function') {
    registerCleanup(function() {
      _invalidateOrderCache();
      _ordersEncounterId = null;
      _currentPatientId = null;
      _selectedType = 'Medication';
      _selectedPriority = 'Routine';
      _showUnackedOnly = false;
    });
  }
}

/* ---------- Order list (left) ---------- */
function renderOrderList(container, encounterId) {
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = 'Active Orders';
  header.appendChild(title);

  // Unacknowledged-only filter toggle
  const filterLabel = document.createElement('label');
  filterLabel.style.display = 'flex';
  filterLabel.style.alignItems = 'center';
  filterLabel.style.gap = '6px';
  filterLabel.style.fontSize = '12px';
  filterLabel.style.cursor = 'pointer';
  const filterCb = document.createElement('input');
  filterCb.type = 'checkbox';
  filterCb.checked = _showUnackedOnly;
  filterCb.addEventListener('change', () => {
    _showUnackedOnly = filterCb.checked;
    refreshOrderList();
  });
  filterLabel.appendChild(filterCb);
  filterLabel.appendChild(document.createTextNode('Unacknowledged only'));
  header.appendChild(filterLabel);

  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.style.padding = '16px';

  let orders = getCachedOrders(encounterId);

  // Apply unacknowledged filter
  if (_showUnackedOnly) {
    orders = orders.filter(o => !o.acknowledgedBy);
  }

  if (orders.length === 0) {
    const empty = buildEmptyState('', _showUnackedOnly ? 'No unacknowledged orders' : 'No orders yet', _showUnackedOnly ? 'All orders have been acknowledged.' : 'Use the form to place an order.');
    body.appendChild(empty);
    card.appendChild(body);
    container.appendChild(card);
    return;
  }

  // Group by type
  const groups = {};
  ORDER_TYPES.forEach(t => { groups[t] = []; });
  orders.forEach(o => {
    var type = o.type || 'Medication';
    if (groups[type]) groups[type].push(o);
  });

  ORDER_TYPES.forEach(type => {
    const grpOrders = groups[type];
    if (grpOrders.length === 0) return;

    const grp = document.createElement('div');
    grp.className = 'order-group';

    const grpHeader = document.createElement('div');
    grpHeader.className = 'order-group-header';
    grpHeader.textContent = ORDER_TYPE_ICONS[type] + ' ' + type;
    grp.appendChild(grpHeader);

    grpOrders.forEach(order => {
      const item = document.createElement('div');
      item.className = 'order-item';

      const itemHeader = document.createElement('div');
      itemHeader.className = 'order-item-header';

      const nameEl = document.createElement('span');
      nameEl.className = 'order-item-name';
      nameEl.textContent = getOrderDisplayName(order);

      const badges = document.createElement('span');
      badges.style.display = 'flex';
      badges.style.gap = '4px';
      badges.style.alignItems = 'center';
      badges.style.flexWrap = 'wrap';

      const prioBadge = document.createElement('span');
      prioBadge.className = 'badge badge-' + (order.priority || 'routine').toLowerCase();
      prioBadge.textContent = order.priority || 'Routine';

      const statusBadge = document.createElement('span');
      statusBadge.className = 'badge badge-' + (order.status || 'pending').toLowerCase();
      statusBadge.textContent = order.status;

      badges.appendChild(prioBadge);
      badges.appendChild(statusBadge);

      // Verbal/Telephone order badge & highlight
      if (order.verbalOrder) {
        const voBadge = document.createElement('span');
        voBadge.className = 'badge';
        voBadge.style.background = 'var(--badge-purple-text)';
        voBadge.style.color = '#fff';
        voBadge.style.fontSize = '10px';
        voBadge.style.padding = '2px 6px';
        voBadge.textContent = 'VO';
        badges.appendChild(voBadge);

        // Yellow highlight for unsigned verbal orders with countdown
        if (order.coSignRequired && !order.coSigned) {
          item.style.background = 'var(--badge-warning-bg)';
          item.style.borderLeft = '4px solid var(--warning)';
          if (order.coSignDeadline) {
            const remaining = new Date(order.coSignDeadline) - Date.now();
            if (remaining > 0) {
              const hrs = Math.floor(remaining / 3600000);
              const mins = Math.floor((remaining % 3600000) / 60000);
              const countdownBadge = document.createElement('span');
              countdownBadge.className = 'badge';
              countdownBadge.style.background = remaining < 4 * 3600000 ? 'var(--danger)' : 'var(--warning)';
              countdownBadge.style.color = '#fff';
              countdownBadge.style.fontSize = '10px';
              countdownBadge.style.padding = '2px 6px';
              countdownBadge.textContent = 'Co-sign: ' + hrs + 'h ' + mins + 'm left';
              badges.appendChild(countdownBadge);
            } else {
              const overdueBadge = document.createElement('span');
              overdueBadge.className = 'badge';
              overdueBadge.style.background = 'var(--danger)';
              overdueBadge.style.color = '#fff';
              overdueBadge.style.fontSize = '10px';
              overdueBadge.style.padding = '2px 6px';
              overdueBadge.textContent = 'Co-sign OVERDUE';
              badges.appendChild(overdueBadge);
              item.style.background = 'var(--badge-danger-bg)';
              item.style.borderLeft = '4px solid var(--danger)';
            }
          }
        }
      }

      // Unacknowledged indicator
      if (!order.acknowledgedBy) {
        const unackBadge = document.createElement('span');
        unackBadge.className = 'badge';
        unackBadge.style.background = 'var(--warning)';
        unackBadge.style.color = '#fff';
        unackBadge.style.fontSize = '10px';
        unackBadge.style.padding = '2px 6px';
        unackBadge.textContent = 'Unacked';
        badges.appendChild(unackBadge);
      }

      itemHeader.appendChild(nameEl);
      itemHeader.appendChild(badges);

      const metaEl = document.createElement('div');
      metaEl.className = 'order-item-meta';
      let metaText = getOrderSubtext(order) + ' · ' + formatDateTime(order.dateTime);
      if (order.acknowledgedBy) {
        metaText += ' · Acked ' + formatDateTime(order.acknowledgedAt);
      }
      metaEl.textContent = metaText;

      const actionsEl = document.createElement('div');
      actionsEl.className = 'order-item-actions';
      actionsEl.style.marginTop = '6px';

      // Ack button
      if (!order.acknowledgedBy) {
        const ackBtn = document.createElement('button');
        ackBtn.className = 'btn btn-secondary btn-sm';
        ackBtn.style.background = 'var(--warning)';
        ackBtn.style.color = '#fff';
        ackBtn.style.borderColor = 'var(--warning)';
        ackBtn.textContent = 'Ack';
        ackBtn.onclick = () => {
          const user = getSessionUser();
          const updatedOrder = getOrder(order.id);
          if (updatedOrder) {
            updatedOrder.acknowledgedBy = (user || {}).id || '';
            updatedOrder.acknowledgedAt = new Date().toISOString();
            saveOrder(updatedOrder);
            showToast('Order acknowledged.', 'success');
            refreshOrderList();
          }
        };
        actionsEl.appendChild(ackBtn);
      }

      if (order.status === 'Pending' || order.status === 'Active') {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-secondary btn-sm';
        completeBtn.textContent = 'Complete';
        completeBtn.onclick = () => {
          openCompletionModal(order);
        };
        actionsEl.appendChild(completeBtn);
      }

      if (order.status !== 'Cancelled') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-danger btn-sm';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
          confirmAction({
            title: 'Cancel Order',
            message: 'Cancel this ' + order.type + ' order? This action cannot be undone.',
            confirmLabel: 'Cancel Order',
            danger: true,
            onConfirm: () => {
              updateOrderStatus(order.id, 'Cancelled');
              refreshOrderList();
            },
          });
        };
        actionsEl.appendChild(cancelBtn);
      }

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-ghost btn-sm';
      delBtn.textContent = 'Remove';
      delBtn.onclick = () => {
        confirmAction({
          title: 'Remove Order',
          message: 'Remove this order from the list?',
          confirmLabel: 'Remove',
          danger: true,
          onConfirm: () => {
            deleteOrder(order.id);
            refreshOrderList();
          },
        });
      };
      actionsEl.appendChild(delBtn);

      item.appendChild(itemHeader);
      item.appendChild(metaEl);
      if (order.notes) {
        const notesEl = document.createElement('div');
        notesEl.className = 'order-item-meta';
        notesEl.textContent = 'Notes: ' + order.notes;
        item.appendChild(notesEl);
      }
      item.appendChild(actionsEl);
      grp.appendChild(item);
    });

    body.appendChild(grp);
  });

  card.appendChild(body);
  container.appendChild(card);
}

/* ---------- Order Completion Documentation Modal (5d) ---------- */
function openCompletionModal(order) {
  const user = getSessionUser();
  const userName = user ? (user.firstName + ' ' + user.lastName) : '';
  const nowLocal = new Date().toISOString().slice(0, 16); // for datetime-local default

  let fieldsHTML = '';

  switch (order.type) {
    case 'Lab':
      fieldsHTML = `
        <div class="form-group">
          <label class="form-label" for="comp-lab-time">Specimen Collected Time *</label>
          <input class="form-control" id="comp-lab-time" type="datetime-local" value="${nowLocal}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-lab-collector">Collector Name *</label>
          <input class="form-control" id="comp-lab-collector" type="text" placeholder="Name of collector" value="${esc(userName)}" />
        </div>
      `;
      break;
    case 'Nursing':
      fieldsHTML = `
        <div class="form-group">
          <label class="form-label" for="comp-nsg-notes">Intervention Performed Notes *</label>
          <textarea class="note-textarea" id="comp-nsg-notes" style="min-height:80px" placeholder="Describe what was performed"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-nsg-outcome">Outcome</label>
          <input class="form-control" id="comp-nsg-outcome" type="text" placeholder="Outcome of intervention" />
        </div>
      `;
      break;
    case 'Diet':
      fieldsHTML = `
        <div class="form-group" style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="comp-diet-started" checked />
          <label for="comp-diet-started" class="form-label" style="margin:0">Diet Started</label>
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-diet-time">Started Time</label>
          <input class="form-control" id="comp-diet-time" type="datetime-local" value="${nowLocal}" />
        </div>
      `;
      break;
    case 'Activity':
      fieldsHTML = `
        <div class="form-group">
          <label class="form-label" for="comp-act-notes">Tolerance Notes</label>
          <textarea class="note-textarea" id="comp-act-notes" style="min-height:80px" placeholder="Notes on patient tolerance"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-act-response">Patient Response *</label>
          <select class="form-control" id="comp-act-response">
            <option>Tolerated Well</option>
            <option>Partially Tolerated</option>
            <option>Not Tolerated</option>
          </select>
        </div>
      `;
      break;
    case 'Medication':
      fieldsHTML = `
        <div class="form-group">
          <label class="form-label" for="comp-med-time">Administered Time *</label>
          <input class="form-control" id="comp-med-time" type="datetime-local" value="${nowLocal}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-med-by">Administered By</label>
          <input class="form-control" id="comp-med-by" type="text" value="${esc(userName)}" />
        </div>
      `;
      break;
    case 'Imaging':
      fieldsHTML = `
        <div class="form-group">
          <label class="form-label" for="comp-img-time">Performed Time *</label>
          <input class="form-control" id="comp-img-time" type="datetime-local" value="${nowLocal}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-img-tech">Performing Tech</label>
          <input class="form-control" id="comp-img-tech" type="text" placeholder="Technologist name" />
        </div>
      `;
      break;
    case 'Consult':
      fieldsHTML = `
        <div class="form-group">
          <label class="form-label" for="comp-con-name">Consultant Name *</label>
          <input class="form-control" id="comp-con-name" type="text" placeholder="Consultant name" />
        </div>
        <div class="form-group">
          <label class="form-label" for="comp-con-date">Consultation Date *</label>
          <input class="form-control" id="comp-con-date" type="datetime-local" value="${nowLocal}" />
        </div>
      `;
      break;
    default:
      fieldsHTML = '<p>No additional documentation needed for this order type.</p>';
  }

  const bodyHTML = '<div>' +
    '<p style="margin-bottom:12px"><strong>' + esc(order.type) + ':</strong> ' + esc(getOrderDisplayName(order)) + '</p>' +
    fieldsHTML +
    '</div>';

  const footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-success" id="comp-save-btn">Complete Order</button>';

  openModal({ title: 'Complete Order — Documentation', bodyHTML, footerHTML });

  document.getElementById('comp-save-btn').addEventListener('click', () => {
    const updatedOrder = getOrder(order.id);
    if (!updatedOrder) { showToast('Order not found.', 'error'); return; }

    const completionDetail = {};

    switch (order.type) {
      case 'Lab': {
        const time = document.getElementById('comp-lab-time')?.value;
        const collector = document.getElementById('comp-lab-collector')?.value.trim();
        if (!time || !collector) { showToast('Specimen collected time and collector name are required.', 'error'); return; }
        completionDetail.specimenCollectedTime = time;
        completionDetail.collectorName = collector;
        break;
      }
      case 'Nursing': {
        const notes = document.getElementById('comp-nsg-notes')?.value.trim();
        if (!notes) { showToast('Intervention performed notes are required.', 'error'); return; }
        completionDetail.interventionNotes = notes;
        completionDetail.outcome = document.getElementById('comp-nsg-outcome')?.value.trim() || '';
        break;
      }
      case 'Diet': {
        completionDetail.dietStarted = document.getElementById('comp-diet-started')?.checked || false;
        completionDetail.startedTime = document.getElementById('comp-diet-time')?.value || '';
        break;
      }
      case 'Activity': {
        const response = document.getElementById('comp-act-response')?.value;
        if (!response) { showToast('Patient response is required.', 'error'); return; }
        completionDetail.toleranceNotes = document.getElementById('comp-act-notes')?.value.trim() || '';
        completionDetail.patientResponse = response;
        break;
      }
      case 'Medication': {
        const time = document.getElementById('comp-med-time')?.value;
        if (!time) { showToast('Administered time is required.', 'error'); return; }
        completionDetail.administeredTime = time;
        completionDetail.administeredBy = document.getElementById('comp-med-by')?.value.trim() || '';
        break;
      }
      case 'Imaging': {
        const time = document.getElementById('comp-img-time')?.value;
        if (!time) { showToast('Performed time is required.', 'error'); return; }
        completionDetail.performedTime = time;
        completionDetail.performingTech = document.getElementById('comp-img-tech')?.value.trim() || '';
        break;
      }
      case 'Consult': {
        const name = document.getElementById('comp-con-name')?.value.trim();
        const date = document.getElementById('comp-con-date')?.value;
        if (!name || !date) { showToast('Consultant name and consultation date are required.', 'error'); return; }
        completionDetail.consultantName = name;
        completionDetail.consultationDate = date;
        break;
      }
    }

    // Merge completion details into the order's detail object
    updatedOrder.detail = Object.assign({}, updatedOrder.detail || {}, { completion: completionDetail });
    updatedOrder.status = 'Completed';
    updatedOrder.completedAt = new Date().toISOString();
    updatedOrder.completedBy = (user || {}).id || '';
    saveOrder(updatedOrder);

    closeModal();
    showToast(order.type + ' order completed.', 'success');
    refreshOrderList();
  });
}

function refreshOrderList(containerId) {
  _invalidateOrderCache();
  const container = document.getElementById(containerId || 'order-list-panel');
  if (container && _ordersEncounterId) {
    renderOrderList(container, _ordersEncounterId);
  }
}

/* ---------- Order entry form (right) ---------- */
function renderOrderEntryForm(container, encounter, patient) {
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = 'Place Order';
  header.appendChild(title);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'card-body';

  // Type selector cards
  const typeLabel = document.createElement('div');
  typeLabel.className = 'form-label';
  typeLabel.textContent = 'Order Type';
  body.appendChild(typeLabel);

  const typeGrid = document.createElement('div');
  typeGrid.className = 'order-type-grid';

  ORDER_TYPES.forEach(type => {
    const card2 = document.createElement('div');
    card2.className = 'order-type-card' + (type === _selectedType ? ' active' : '');
    card2.dataset.type = type;

    const icon = document.createElement('div');
    icon.className = 'type-icon';
    icon.textContent = ORDER_TYPE_ICONS[type];

    const name = document.createElement('div');
    name.className = 'type-name';
    name.textContent = type;

    card2.appendChild(icon);
    card2.appendChild(name);

    card2.addEventListener('click', () => {
      _selectedType = type;
      document.querySelectorAll('.order-type-card').forEach(c => c.classList.remove('active'));
      card2.classList.add('active');
      renderTypeFields(typeFieldsContainer, type);
      // Re-check allergy if switching back to Medication
      if (type === 'Medication') {
        const drugField = document.getElementById('med-drug');
        if (drugField) _checkDrugAllergy(drugField.value.trim(), encounter.patientId);
      }
    });

    typeGrid.appendChild(card2);
  });
  body.appendChild(typeGrid);

  // Priority pills
  const prioLabel = document.createElement('div');
  prioLabel.className = 'form-label';
  prioLabel.style.marginTop = '8px';
  prioLabel.textContent = 'Priority';
  body.appendChild(prioLabel);

  const pillsContainer = document.createElement('div');
  pillsContainer.className = 'priority-pills';

  PRIORITIES.forEach(p => {
    const pill = document.createElement('button');
    pill.className = 'priority-pill ' + p.toLowerCase() + (p === _selectedPriority ? ' active' : '');
    pill.textContent = p;
    pill.dataset.priority = p;
    pill.addEventListener('click', () => {
      _selectedPriority = p;
      pillsContainer.querySelectorAll('.priority-pill').forEach(el => el.classList.remove('active'));
      pill.classList.add('active');
    });
    pillsContainer.appendChild(pill);
  });
  body.appendChild(pillsContainer);

  // Verbal/Telephone Order section
  const voSection = document.createElement('div');
  voSection.id = 'verbal-order-section';
  voSection.style.marginTop = '8px';
  voSection.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
        <input type="checkbox" id="vo-checkbox" /> Verbal / Telephone Order
      </label>
    </div>
    <div id="vo-fields" hidden style="border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px;background:var(--bg-surface)">
      <div class="form-group" style="margin-bottom:8px">
        <label class="form-label" for="vo-given-by">Order Given By (name) *</label>
        <input class="form-control" id="vo-given-by" type="text" placeholder="Name of ordering provider" />
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
        <input type="checkbox" id="vo-readback" /> Read-back confirmed
      </label>
    </div>
  `;
  body.appendChild(voSection);

  const voCb = voSection.querySelector('#vo-checkbox');
  const voFields = voSection.querySelector('#vo-fields');
  voCb.addEventListener('change', () => {
    voFields.hidden = !voCb.checked;
  });

  // Type-specific fields container
  const typeFieldsContainer = document.createElement('div');
  typeFieldsContainer.id = 'type-fields';
  typeFieldsContainer.style.marginTop = '4px';
  renderTypeFields(typeFieldsContainer, _selectedType);
  body.appendChild(typeFieldsContainer);

  // Drug-allergy check: listen for input changes on the drug field
  typeFieldsContainer.addEventListener('input', e => {
    if (e.target.id === 'med-drug') {
      _checkDrugAllergy(e.target.value.trim(), encounter.patientId, typeFieldsContainer._selectedMedEntry);
    }
  });

  // Notes field
  const notesGroup = document.createElement('div');
  notesGroup.className = 'form-group';
  notesGroup.style.marginTop = '12px';
  const notesLabel = document.createElement('label');
  notesLabel.className = 'form-label';
  notesLabel.textContent = 'Additional Notes';
  const notesInput = document.createElement('textarea');
  notesInput.className = 'note-textarea';
  notesInput.id = 'ord-notes';
  notesInput.style.minHeight = '60px';
  notesInput.placeholder = 'Optional notes or instructions…';
  notesGroup.appendChild(notesLabel);
  notesGroup.appendChild(notesInput);
  body.appendChild(notesGroup);

  card.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.style.borderTop = '1px solid var(--border)';
  footer.style.padding = '14px 20px';

  const placeBtn = document.createElement('button');
  placeBtn.className = 'btn btn-primary';
  placeBtn.textContent = 'Place Order';
  if (!canPlaceOrders()) {
    placeBtn.disabled = true;
    placeBtn.title = 'You do not have permission to place orders';
  }
  placeBtn.onclick = () => placeOrder(encounter, patient);
  footer.appendChild(placeBtn);
  card.appendChild(footer);

  container.appendChild(card);
}

/* ---------- Type-specific form fields ---------- */
function renderTypeFields(container, type) {
  container.innerHTML = '';

  if (type === 'Medication') {
    // Track selected med entry for enhanced allergy checking
    container._selectedMedEntry = null;

    container.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="med-drug">Drug Name *</label>
        <div class="med-autocomplete-container">
          <input class="form-control" id="med-drug" placeholder="e.g. Metoprolol" autocomplete="off" />
        </div>
        <div id="drug-allergy-alert" hidden style="margin-top:6px;background:var(--priority-stat-bg);border:1px solid var(--danger);border-left:4px solid var(--danger);border-radius:var(--radius);padding:8px 12px;color:var(--danger);font-size:12.5px;font-weight:600"></div>
      </div>
      <div id="med-dose-pills-container"></div>
      <div class="form-row-3" id="med-dose-row">
        <div class="form-group">
          <label class="form-label" for="med-dose">Dose *</label>
          <input class="form-control" id="med-dose" placeholder="e.g. 25" type="number" min="0" step="any" />
        </div>
        <div class="form-group">
          <label class="form-label" for="med-unit">Unit</label>
          <select class="form-control" id="med-unit">
            ${MED_UNITS.map(u => `<option>${esc(u)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="med-route">Route</label>
          <select class="form-control" id="med-route">
            ${MED_ROUTES.map(r => `<option>${esc(r)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="med-freq">Frequency</label>
          <select class="form-control" id="med-freq">
            ${MED_FREQS.map(f => `<option>${esc(f)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:1px">
          <div class="checkbox-group">
            <input type="checkbox" id="med-prn" />
            <label for="med-prn">PRN (as needed)</label>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="med-duration">Duration</label>
          <select class="form-control" id="med-duration">
            <option value="">Select duration</option>
            <option value="3">3 days</option>
            <option value="5">5 days</option>
            <option value="7">7 days</option>
            <option value="10">10 days</option>
            <option value="14">14 days</option>
            <option value="21">21 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="ongoing">Ongoing</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group" id="med-duration-other-group" style="display:none">
          <label class="form-label" for="med-duration-other">Custom Duration (days)</label>
          <input class="form-control" id="med-duration-other" type="number" min="1" placeholder="Days" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="med-indication">Indication</label>
        <input class="form-control" id="med-indication" placeholder="Reason for medication" />
      </div>
      <div id="med-pharmacy-section"></div>
    `;

    // Duration "Other" toggle
    const durSel = container.querySelector('#med-duration');
    if (durSel) {
      durSel.addEventListener('change', () => {
        const otherG = container.querySelector('#med-duration-other-group');
        if (otherG) otherG.style.display = durSel.value === 'other' ? '' : 'none';
      });
    }

    // Get encounter/patient context for pharmacy section
    const encEl = container.closest('[data-encounter-id]') || document.getElementById('order-entry-form');
    const patIdForPharm = encEl ? encEl.dataset.patientId : null;

    // Attach autocomplete
    const drugInput = container.querySelector('#med-drug');
    if (drugInput && typeof attachMedAutocomplete === 'function') {
      attachMedAutocomplete(drugInput, {
        onSelect: (medEntry, defaultForm) => {
          container._selectedMedEntry = medEntry;
          // Fill drug name
          drugInput.value = medEntry.generic;

          // Set unit, route, frequency
          const unitSel  = container.querySelector('#med-unit');
          const routeSel = container.querySelector('#med-route');
          const freqSel  = container.querySelector('#med-freq');
          if (unitSel)  unitSel.value  = defaultForm.unit;
          if (routeSel) routeSel.value = defaultForm.route;
          if (freqSel)  freqSel.value  = defaultForm.defaultFreq;

          // Auto-populate duration based on drug class
          const durSel = container.querySelector('#med-duration');
          if (durSel && medEntry.drugClass) {
            const cls = medEntry.drugClass.toLowerCase();
            if (cls.includes('antibiotic') || cls.includes('antimicrobial')) durSel.value = '7';
            else if (cls.includes('antifungal')) durSel.value = '14';
            else if (cls.includes('steroid') && !cls.includes('inhaled')) durSel.value = '5';
            else if (cls.includes('analgesic') || cls.includes('nsaid') || cls.includes('pain')) durSel.value = '7';
            else durSel.value = 'ongoing';
          }

          // Build dose pill selector
          _renderDosePills(container, medEntry, medEntry.defaultDoseIndex);

          // Trigger allergy check
          _checkDrugAllergy(medEntry.generic, _currentPatientId, medEntry);
        },
      });
    }

    // Render pharmacy section
    _renderPharmacySection(container.querySelector('#med-pharmacy-section'), _currentPatientId);
  }

  else if (type === 'Lab') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="lab-search">Search Lab Test *</label>
        <div class="med-autocomplete-container">
          <input class="form-control" id="lab-search" placeholder="Type to search labs (e.g. CBC, BMP, TSH)..." autocomplete="off" />
        </div>
      </div>
      <div id="lab-detail-section"></div>
      <div class="form-group">
        <label class="form-label" for="lab-specimen">Specimen</label>
        <select class="form-control" id="lab-specimen">
          <option>Blood</option>
          <option>Urine</option>
          <option>CSF</option>
          <option>Sputum</option>
          <option>Wound Swab</option>
          <option>Stool</option>
          <option>Other</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="lab-frequency">Frequency *</label>
          <select class="form-control" id="lab-frequency">
            <option value="Once">Once</option>
            <option value="Daily">Daily</option>
            <option value="Every Other Day">Every Other Day</option>
            <option value="BIW">Twice Weekly</option>
            <option value="Weekly">Weekly</option>
            <option value="Biweekly">Every 2 Weeks</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="lab-urgency">Urgency *</label>
          <select class="form-control" id="lab-urgency">
            <option value="Routine">Routine</option>
            <option value="Urgent">Urgent</option>
            <option value="STAT">STAT</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="lab-tests">Additional Tests (comma-separated)</label>
        <input class="form-control" id="lab-tests" placeholder="e.g. Na, K, Cl, CO2" />
      </div>
    `;
    // Attach lab autocomplete
    if (typeof attachLabAutocomplete === 'function') {
      const labInput = container.querySelector('#lab-search');
      attachLabAutocomplete(labInput, {
        onSelect: function(labEntry) {
          container._selectedLabEntry = labEntry;
          // Auto-fill specimen
          const specSel = container.querySelector('#lab-specimen');
          if (specSel && labEntry.specimen) {
            for (let i = 0; i < specSel.options.length; i++) {
              if (specSel.options[i].text === labEntry.specimen || labEntry.specimen.toLowerCase().indexOf(specSel.options[i].text.toLowerCase()) >= 0) {
                specSel.selectedIndex = i; break;
              }
            }
          }
          // Show detail section
          const detailDiv = container.querySelector('#lab-detail-section');
          if (detailDiv) {
            let html = '<div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;">';
            html += '<div style="font-weight:600;font-size:13px;color:var(--text-primary);margin-bottom:4px;">' + esc(labEntry.name);
            if (labEntry.abbreviation) html += ' <span style="color:var(--text-muted);">(' + esc(labEntry.abbreviation) + ')</span>';
            html += '</div>';
            html += '<div style="color:var(--text-secondary);">' + esc(labEntry.category) + ' · ' + esc(labEntry.tubeColor) + ' · ' + esc(labEntry.volume) + '</div>';
            if (labEntry.turnaroundTime) html += '<div style="color:var(--text-muted);margin-top:2px;">TAT: ' + esc(labEntry.turnaroundTime) + '</div>';
            if (labEntry.specialInstructions) html += '<div style="color:var(--warning);margin-top:2px;">' + esc(labEntry.specialInstructions) + '</div>';
            if (labEntry.isPanel && labEntry.components.length > 0) html += '<div style="color:var(--text-muted);margin-top:4px;"><strong>Components:</strong> ' + labEntry.components.map(c => esc(c)).join(', ') + '</div>';
            html += '</div>';
            detailDiv.innerHTML = html;
          }
        }
      });
    }
  }

  else if (type === 'Imaging') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="img-search">Search Imaging Study *</label>
        <div class="med-autocomplete-container">
          <input class="form-control" id="img-search" placeholder="Type to search (e.g. CT Head, MRI Knee, Chest X-Ray)..." autocomplete="off" />
        </div>
      </div>
      <div id="img-detail-section"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="img-modality">Modality</label>
          <input class="form-control" id="img-modality" readonly placeholder="Auto-filled" />
        </div>
        <div class="form-group">
          <label class="form-label" for="img-body">Body Part</label>
          <input class="form-control" id="img-body" placeholder="e.g. Chest, Brain" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="img-laterality">Laterality</label>
        <select class="form-control" id="img-laterality">
          <option value="N/A">N/A</option>
          <option value="Left">Left</option>
          <option value="Right">Right</option>
          <option value="Bilateral">Bilateral</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="img-indication">Clinical Indication *</label>
        <input class="form-control" id="img-indication" placeholder="Reason for study" />
      </div>
    `;
    // Attach imaging autocomplete
    if (typeof attachImagingAutocomplete === 'function') {
      const imgInput = container.querySelector('#img-search');
      attachImagingAutocomplete(imgInput, {
        onSelect: function(imgEntry) {
          container._selectedImgEntry = imgEntry;
          // Auto-fill fields
          const modInput = container.querySelector('#img-modality');
          if (modInput) modInput.value = imgEntry.modality;
          const bodyInput = container.querySelector('#img-body');
          if (bodyInput) bodyInput.value = imgEntry.bodyRegion;
          // Set laterality options
          const latSel = container.querySelector('#img-laterality');
          if (latSel) {
            if (imgEntry.lateralityOptions && imgEntry.lateralityOptions.length > 0) {
              latSel.innerHTML = imgEntry.lateralityOptions.map(l => '<option value="' + esc(l) + '">' + esc(l) + '</option>').join('');
              latSel.value = imgEntry.laterality || imgEntry.lateralityOptions[0];
              latSel.disabled = false;
            } else {
              latSel.innerHTML = '<option value="N/A">N/A</option>';
              latSel.disabled = true;
            }
          }
          // Show detail section
          const detailDiv = container.querySelector('#img-detail-section');
          if (detailDiv) {
            let html = '<div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;">';
            html += '<div style="font-weight:600;font-size:13px;color:var(--text-primary);margin-bottom:4px;">' + esc(imgEntry.name) + '</div>';
            html += '<div style="color:var(--text-secondary);">' + esc(imgEntry.modality) + ' · ' + esc(imgEntry.bodyRegion) + ' · CPT: ' + esc(imgEntry.cptCode) + '</div>';
            if (imgEntry.contrast !== 'None') html += '<div style="color:var(--accent);margin-top:2px;">Contrast: ' + esc(imgEntry.contrast) + '</div>';
            if (imgEntry.estimatedDuration) html += '<div style="color:var(--text-muted);margin-top:2px;">Duration: ' + esc(imgEntry.estimatedDuration) + '</div>';
            if (imgEntry.radiationDose) html += '<div style="color:var(--text-muted);">Radiation: ' + esc(imgEntry.radiationDose) + '</div>';
            if (imgEntry.patientPrep && imgEntry.patientPrep.length > 0) html += '<div style="color:var(--warning);margin-top:4px;"><strong>Prep:</strong> ' + imgEntry.patientPrep.map(p => esc(p)).join('; ') + '</div>';
            if (imgEntry.specialInstructions) html += '<div style="color:var(--warning);margin-top:2px;">' + esc(imgEntry.specialInstructions) + '</div>';
            html += '</div>';
            detailDiv.innerHTML = html;
          }
          // Pre-fill common indication if empty
          const indInput = container.querySelector('#img-indication');
          if (indInput && !indInput.value && imgEntry.commonIndications && imgEntry.commonIndications.length > 0) {
            indInput.placeholder = 'e.g. ' + imgEntry.commonIndications.slice(0, 3).join(', ');
          }
        }
      });
    }
  }

  else if (type === 'Consult') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="con-service">Consulting Service *</label>
        <select class="form-control" id="con-service">
          ${CONSULT_SERVICES.map(s => `<option>${esc(s)}</option>`).join('')}
        </select>
      </div>
      <div id="rehab-fields-container"></div>
      <div class="form-group">
        <label class="form-label" for="con-reason">Reason for Consult *</label>
        <textarea class="note-textarea" id="con-reason" style="min-height:80px"
          placeholder="Clinical question / reason for consultation"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="con-urgency">Urgency</label>
        <select class="form-control" id="con-urgency">
          <option>Routine</option>
          <option>Urgent</option>
          <option>Emergent</option>
        </select>
      </div>
    `;

    // Show/hide rehab fields based on selected service
    const conServiceSel = container.querySelector('#con-service');
    const rehabContainer = container.querySelector('#rehab-fields-container');
    function _updateRehabFields() {
      const svc = conServiceSel.value;
      if (REHAB_FOCUS_AREAS[svc]) {
        const focusAreas = REHAB_FOCUS_AREAS[svc];
        rehabContainer.innerHTML = `
          <div style="border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin:8px 0;background:var(--bg-surface)">
            <div style="font-weight:600;font-size:13px;margin-bottom:8px">Rehabilitation Details</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="rehab-frequency">Frequency</label>
                <select class="form-control" id="rehab-frequency">
                  ${REHAB_FREQUENCIES.map(f => '<option>' + esc(f) + '</option>').join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="rehab-duration">Duration</label>
                <input class="form-control" id="rehab-duration" type="text" placeholder="e.g. 4 weeks" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="rehab-precautions">Precautions</label>
              <textarea class="note-textarea" id="rehab-precautions" style="min-height:60px"
                placeholder="Weight-bearing, fall risk, aspiration, etc."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Focus Areas</label>
              <div id="rehab-focus-checkboxes" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
                ${focusAreas.map(fa => '<label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" class="rehab-focus-cb" value="' + esc(fa) + '" /> ' + esc(fa) + '</label>').join('')}
              </div>
            </div>
          </div>
        `;
      } else {
        rehabContainer.innerHTML = '';
      }
    }
    conServiceSel.addEventListener('change', _updateRehabFields);
    _updateRehabFields();
  }

  else if (type === 'Diet') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="diet-type">Diet Type *</label>
        <select class="form-control" id="diet-type">
          ${DIET_TYPES.map(d => `<option>${esc(d)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="diet-liquid-thickness">Liquid Thickness</label>
        <select class="form-control" id="diet-liquid-thickness">
          <option value="">— Select —</option>
          ${LIQUID_THICKNESS_OPTIONS.map(o => `<option>${esc(o)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="diet-fluid-restriction">Fluid Restriction (mL)</label>
        <input class="form-control" id="diet-fluid-restriction" type="number" min="0" placeholder="e.g. 1500" />
      </div>
      <div class="form-group">
        <label class="form-label" for="diet-instructions">Instructions</label>
        <textarea class="note-textarea" id="diet-instructions" style="min-height:80px"
          placeholder="Additional dietary instructions or notes"></textarea>
      </div>
    `;
  }

  else if (type === 'Nursing') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="nsg-intervention">Intervention Description *</label>
        <textarea class="note-textarea" id="nsg-intervention" style="min-height:80px"
          placeholder="Describe the nursing intervention"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="nsg-frequency">Frequency</label>
        <select class="form-control" id="nsg-frequency">
          ${MED_FREQS.map(f => `<option>${esc(f)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="nsg-instructions">Instructions</label>
        <textarea class="note-textarea" id="nsg-instructions" style="min-height:80px"
          placeholder="Additional nursing instructions"></textarea>
      </div>
    `;
  }

  else if (type === 'Activity') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="act-level">Activity Level *</label>
        <select class="form-control" id="act-level">
          ${ACTIVITY_LEVELS.map(l => `<option>${esc(l)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="act-restrictions">Restrictions</label>
        <textarea class="note-textarea" id="act-restrictions" style="min-height:80px"
          placeholder="Activity restrictions or precautions"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="act-weight-bearing">Weight-Bearing</label>
        <select class="form-control" id="act-weight-bearing">
          ${WEIGHT_BEARING_OPTIONS.map(w => `<option>${esc(w)}</option>`).join('')}
        </select>
      </div>
    `;
  }
}

/* ---------- Place Order ---------- */
function placeOrder(encounter, patient) {
  // RBAC: check order placement permission
  if (!canPlaceOrders()) {
    showToast('You do not have permission to place orders.', 'error');
    return;
  }

  const orderedBy = getCurrentProvider() || (getSessionUser() || {}).id || '';
  const notes     = document.getElementById('ord-notes')?.value.trim() || '';
  const type      = _selectedType;
  const priority  = _selectedPriority;

  let detail = {};
  let valid  = true;

  if (type === 'Medication') {
    const drug = document.getElementById('med-drug')?.value.trim();
    const dose = document.getElementById('med-dose')?.value.trim();
    if (!drug || !dose) { showToast('Drug name and dose are required.', 'error'); return; }
    detail = {
      drug,
      dose,
      unit:       document.getElementById('med-unit')?.value,
      route:      document.getElementById('med-route')?.value,
      frequency:  document.getElementById('med-freq')?.value,
      prn:        document.getElementById('med-prn')?.checked || false,
      duration:   (() => { const d = document.getElementById('med-duration')?.value; return d === 'other' ? (document.getElementById('med-duration-other')?.value || '') + ' days' : d === 'ongoing' ? 'Ongoing' : d ? d + ' days' : ''; })(),
      indication: document.getElementById('med-indication')?.value.trim(),
    };
  }

  else if (type === 'Lab') {
    const labSearch = document.getElementById('lab-search')?.value.trim();
    if (!labSearch) { showToast('Lab test is required.', 'error'); return; }
    const testsRaw = document.getElementById('lab-tests')?.value.trim() || '';
    const tests    = testsRaw ? testsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const typeFieldsContainer = document.getElementById('type-fields');
    const labEntry = typeFieldsContainer?._selectedLabEntry || null;
    detail = {
      panel: labSearch,
      tests,
      specimen: document.getElementById('lab-specimen')?.value,
      frequency: document.getElementById('lab-frequency')?.value || 'Once',
      urgency: document.getElementById('lab-urgency')?.value || 'Routine',
      tubeColor: labEntry ? labEntry.tubeColor : '',
      cptCode: labEntry ? labEntry.cptCode : '',
      fasting: labEntry ? labEntry.fasting : false,
      specialInstructions: labEntry ? labEntry.specialInstructions : '',
    };
  }

  else if (type === 'Imaging') {
    const imgSearch  = document.getElementById('img-search')?.value.trim();
    const modality   = document.getElementById('img-modality')?.value;
    const bodyPart   = document.getElementById('img-body')?.value.trim();
    const indication = document.getElementById('img-indication')?.value.trim();
    const laterality = document.getElementById('img-laterality')?.value || 'N/A';
    if (!imgSearch && !bodyPart) { showToast('Imaging study or body part is required.', 'error'); return; }
    if (!indication) { showToast('Clinical indication is required.', 'error'); return; }
    const typeFieldsContainer = document.getElementById('type-fields');
    const imgEntry = typeFieldsContainer?._selectedImgEntry || null;
    detail = {
      study: imgSearch || (modality + ' ' + bodyPart),
      modality: modality || '',
      bodyPart,
      indication,
      laterality,
      contrast: imgEntry ? imgEntry.contrast : 'None',
      cptCode: imgEntry ? imgEntry.cptCode : '',
      patientPrep: imgEntry ? (imgEntry.patientPrep || []).join('; ') : '',
    };
  }

  else if (type === 'Consult') {
    const service = document.getElementById('con-service')?.value;
    const reason  = document.getElementById('con-reason')?.value.trim();
    if (!reason) { showToast('Reason for consult is required.', 'error'); return; }
    detail = {
      service,
      reason,
      urgency: document.getElementById('con-urgency')?.value,
    };
    // Capture rehab fields if present
    if (REHAB_FOCUS_AREAS[service]) {
      detail.rehabFrequency = document.getElementById('rehab-frequency')?.value || '';
      detail.rehabDuration  = document.getElementById('rehab-duration')?.value.trim() || '';
      detail.precautions    = document.getElementById('rehab-precautions')?.value.trim() || '';
      const focusCbs = document.querySelectorAll('.rehab-focus-cb');
      const focusAreas = [];
      focusCbs.forEach(cb => { if (cb.checked) focusAreas.push(cb.value); });
      detail.focusAreas = focusAreas;
    }
  }

  else if (type === 'Diet') {
    const dietType = document.getElementById('diet-type')?.value;
    if (!dietType) { showToast('Diet type is required.', 'error'); return; }
    detail = {
      dietType,
      liquidThickness: document.getElementById('diet-liquid-thickness')?.value || '',
      fluidRestriction: document.getElementById('diet-fluid-restriction')?.value || '',
      instructions: document.getElementById('diet-instructions')?.value.trim() || '',
    };
  }

  else if (type === 'Nursing') {
    const intervention = document.getElementById('nsg-intervention')?.value.trim();
    if (!intervention) { showToast('Intervention description is required.', 'error'); return; }
    detail = {
      intervention,
      frequency: document.getElementById('nsg-frequency')?.value || '',
      instructions: document.getElementById('nsg-instructions')?.value.trim() || '',
    };
  }

  else if (type === 'Activity') {
    const level = document.getElementById('act-level')?.value;
    if (!level) { showToast('Activity level is required.', 'error'); return; }
    detail = {
      level,
      restrictions: document.getElementById('act-restrictions')?.value.trim() || '',
      weightBearing: document.getElementById('act-weight-bearing')?.value || '',
    };
  }

  if (!valid) return;

  // Dose range checking for Medication orders
  if (type === 'Medication' && typeof checkDoseLimit === 'function') {
    const doseCheck = checkDoseLimit(detail.drug, detail.dose, detail.unit);
    if (doseCheck && doseCheck.exceeded) {
      const maxLabel = doseCheck.type === 'single' ? 'Max single dose' : 'Max daily dose';
      const limitVal = doseCheck.type === 'single' ? doseCheck.limit.maxSingleDose : doseCheck.limit.maxDailyDose;
      showToast(maxLabel + ' for ' + detail.drug + ' is ' + limitVal + ' ' + doseCheck.limit.unit + '. Entered: ' + detail.dose + ' ' + (detail.unit || '') + '.', 'error');
      return;
    }
  }

  // Duplicate order detection
  if (patient) {
    let dupes = [];
    if (type === 'Medication' && typeof checkDuplicateOrders === 'function') {
      dupes = checkDuplicateOrders(detail.drug, patient.id);
    } else if ((type === 'Lab' || type === 'Imaging') && typeof checkDuplicateLabImaging === 'function') {
      const studyName = type === 'Lab' ? (detail.labTest || detail.panel || '') : (detail.studyName || '');
      dupes = checkDuplicateLabImaging(type, studyName, patient.id);
    }
    if (dupes.length > 0) {
      const dupeText = dupes.map(d => d.source + ': ' + d.name).join(', ');
      confirmAction({
        title: 'Duplicate Order Warning',
        message: 'This patient already has: ' + dupeText + '. Place order anyway?',
        confirmLabel: 'Place Duplicate Order',
        danger: false,
        onConfirm: () => { _continueAfterDupeCheck(encounter, patient, type, detail, priority, notes); },
      });
      return;
    }
  }

  // Verbal/Telephone order fields
  const voActive     = document.getElementById('vo-checkbox')?.checked || false;
  const voGivenBy    = document.getElementById('vo-given-by')?.value.trim() || '';
  const voReadback   = document.getElementById('vo-readback')?.checked || false;

  if (voActive) {
    if (!voGivenBy) { showToast('Verbal order: name of ordering provider is required.', 'error'); return; }
    if (!voReadback) { showToast('Verbal order: read-back confirmation is required.', 'error'); return; }
  }

  const doSave = () => {
    const orderData = {
      encounterId: encounter.id,
      patientId:   encounter.patientId,
      orderedBy:   voActive ? voGivenBy : (orderedBy || ''),
      type,
      priority,
      status:  'Pending',
      detail,
      notes,
      dateTime: new Date().toISOString(),
    };
    if (voActive) {
      orderData.verbalOrder       = true;
      orderData.readBackConfirmed = true;
      orderData.coSignRequired    = true;
      orderData.coSignDeadline    = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }
    saveOrder(orderData);
    showToast(type + ' order added to queue — awaiting signature', 'success');
    if (typeof refreshOrderQueue === 'function') refreshOrderQueue(true);
    refreshOrderList();
    renderTypeFields(document.getElementById('type-fields'), type);
    const notesField = document.getElementById('ord-notes');
    if (notesField) notesField.value = '';
    // Reset verbal order controls
    const voCb2 = document.getElementById('vo-checkbox');
    const voFields2 = document.getElementById('vo-fields');
    if (voCb2) voCb2.checked = false;
    if (voFields2) voFields2.hidden = true;
  };

  // Controlled substance check for Medication orders
  if (type === 'Medication') {
    const typeFieldsContainer = document.getElementById('type-fields');
    const medEntry = typeFieldsContainer ? typeFieldsContainer._selectedMedEntry : null;
    if (medEntry && medEntry.schedule) {
      if (!canPrescribeControlled()) {
        showToast('Only attending physicians with a DEA number can prescribe controlled substances (Schedule ' + medEntry.schedule + ').', 'error');
        return;
      }
    }
  }

  // Drug-drug interaction check for Medication orders
  if (type === 'Medication' && patient && typeof checkDrugInteractions === 'function') {
    const typeFieldsContainer2 = document.getElementById('type-fields');
    const medEntryDDI = typeFieldsContainer2 ? typeFieldsContainer2._selectedMedEntry : null;
    const ddiResults = checkDrugInteractions(detail.drug || '', medEntryDDI, patient.id);
    const majorDDI = ddiResults.filter(d => d.severity === 'major');
    const moderateDDI = ddiResults.filter(d => d.severity === 'moderate');

    if (majorDDI.length > 0) {
      const ddiText = majorDDI.map(d => '<strong>' + esc(d.drug1) + ' + ' + esc(d.drug2) + '</strong>: ' + esc(d.effect)).join('<br><br>');
      confirmAction({
        title: ' MAJOR Drug Interaction',
        message: ddiText + (moderateDDI.length ? '<br><br><em>+ ' + moderateDDI.length + ' moderate interaction(s)</em>' : ''),
        confirmLabel: 'Override & Continue',
        danger: true,
        onConfirm: () => { _proceedAfterDDI(type, detail, patient, doSave); },
      });
      return;
    }
    if (moderateDDI.length > 0) {
      const ddiText = moderateDDI.map(d => '<strong>' + esc(d.drug1) + ' + ' + esc(d.drug2) + '</strong>: ' + esc(d.effect)).join('<br><br>');
      confirmAction({
        title: 'Drug Interaction Warning',
        message: ddiText,
        confirmLabel: 'Acknowledge & Continue',
        danger: false,
        onConfirm: () => { _proceedAfterDDI(type, detail, patient, doSave); },
      });
      return;
    }
  }

  // Drug-allergy check for Medication orders
  _proceedAfterDDI(type, detail, patient, doSave);
  return;

  // Refresh list and reset form
  refreshOrderList();

  // Reset type-specific fields
  renderTypeFields(document.getElementById('type-fields'), type);

  // Clear notes
  const notesField = document.getElementById('ord-notes');
  if (notesField) notesField.value = '';
}

/* ---------- Display helpers ---------- */
function getOrderDisplayName(order) {
  const d = order.detail || {};
  switch (order.type) {
    case 'Medication': return d.drug ? d.drug + ' ' + (d.dose || '') + ' ' + (d.unit || '') : 'Medication';
    case 'Lab':        return d.panel || 'Lab';
    case 'Imaging':    return (d.modality || '') + ' ' + (d.bodyPart || '');
    case 'Consult':    return (d.service || '') + ' Consult';
    case 'Diet':       return d.dietType ? 'Diet: ' + d.dietType : 'Diet';
    case 'Nursing':    return d.intervention ? 'Nursing: ' + (d.intervention.length > 40 ? d.intervention.slice(0, 40) + '…' : d.intervention) : 'Nursing';
    case 'Activity':   return d.level ? 'Activity: ' + d.level : 'Activity';
    default:           return order.type || 'Order';
  }
}

function getOrderSubtext(order) {
  const d = order.detail || {};
  switch (order.type) {
    case 'Medication': {
      const parts = [d.route, d.frequency].filter(Boolean);
      if (d.prn) parts.push('PRN');
      if (d.duration) parts.push(d.duration);
      return parts.join(', ') || '';
    }
    case 'Lab': {
      const parts = [];
      if (d.frequency && d.frequency !== 'Once') parts.push(d.frequency);
      if (d.urgency && d.urgency !== 'Routine') parts.push(d.urgency);
      if (d.specimen) parts.push(d.specimen);
      return parts.join(' · ') || '';
    }
    case 'Imaging': return d.indication || '';
    case 'Consult': return d.reason ? d.reason.slice(0, 60) + (d.reason.length > 60 ? '…' : '') : '';
    case 'Diet': {
      const parts = [];
      if (d.fluidRestriction) parts.push('Fluid restrict: ' + d.fluidRestriction + ' mL');
      if (d.instructions) parts.push(d.instructions.slice(0, 50) + (d.instructions.length > 50 ? '…' : ''));
      return parts.join(' · ') || '';
    }
    case 'Nursing': {
      const parts = [];
      if (d.frequency) parts.push(d.frequency);
      if (d.instructions) parts.push(d.instructions.slice(0, 50) + (d.instructions.length > 50 ? '…' : ''));
      return parts.join(' · ') || '';
    }
    case 'Activity': {
      const parts = [];
      if (d.weightBearing) parts.push('WB: ' + d.weightBearing);
      if (d.restrictions) parts.push(d.restrictions.slice(0, 50) + (d.restrictions.length > 50 ? '…' : ''));
      return parts.join(' · ') || '';
    }
    default:        return '';
  }
}

/* ---------- Dose Pill Selector ---------- */
function _renderDosePills(container, medEntry, activeIndex) {
  const pillsContainer = container.querySelector('#med-dose-pills-container');
  if (!pillsContainer) return;

  const doseInput = container.querySelector('#med-dose');
  const unitSel   = container.querySelector('#med-unit');
  const routeSel  = container.querySelector('#med-route');
  const freqSel   = container.querySelector('#med-freq');

  let html = '<label class="form-label" style="font-size:12px;margin-bottom:4px">Dose *</label><div class="med-dose-pills">';
  medEntry.doseForms.forEach((df, i) => {
    const label = df.dose + (df.unit || '');
    html += '<div class="med-dose-pill' + (i === activeIndex ? ' active' : '') + '" data-index="' + i + '">' + esc(label) + '</div>';
  });
  html += '<div class="med-dose-pill" data-index="custom">Custom</div>';
  html += '</div>';
  html += '<div id="med-dose-custom-wrap" hidden style="margin-bottom:8px"><input class="med-dose-custom-input" id="med-dose-custom" type="number" min="0" step="any" placeholder="Enter dose" /></div>';
  pillsContainer.innerHTML = html;

  // Set the initial dose value
  if (medEntry.doseForms[activeIndex]) {
    if (doseInput) doseInput.value = medEntry.doseForms[activeIndex].dose;
  }
  // Hide the default dose row (pills replace it)
  const doseRow = container.querySelector('#med-dose-row');
  if (doseRow) {
    const doseGroup = doseRow.querySelector('.form-group:first-child');
    if (doseGroup) doseGroup.style.display = 'none';
  }

  // Pill click handlers
  pillsContainer.querySelectorAll('.med-dose-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      // Clear active state
      pillsContainer.querySelectorAll('.med-dose-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const idx = pill.dataset.index;
      const customWrap = container.querySelector('#med-dose-custom-wrap');

      if (idx === 'custom') {
        if (customWrap) customWrap.hidden = false;
        const customInput = container.querySelector('#med-dose-custom');
        if (customInput) {
          customInput.focus();
          customInput.addEventListener('input', () => {
            if (doseInput) doseInput.value = customInput.value;
          });
        }
        if (doseInput) doseInput.value = '';
      } else {
        if (customWrap) customWrap.hidden = true;
        const df = medEntry.doseForms[parseInt(idx)];
        if (df) {
          if (doseInput) doseInput.value = df.dose;
          if (unitSel)  unitSel.value  = df.unit;
          if (routeSel) routeSel.value = df.route;
          if (freqSel)  freqSel.value  = df.defaultFreq;
        }
      }
    });
  });
}

/* ---------- Pharmacy Section in Order Form ---------- */
function _renderPharmacySection(sectionEl, patientId) {
  if (!sectionEl || !patientId) return;
  const patient = getPatient(patientId);
  if (!patient) return;

  const pharmName  = patient.pharmacyName || '';
  const pharmPhone = patient.pharmacyPhone || '';

  if (pharmName) {
    sectionEl.innerHTML =
      '<div style="margin-top:12px">' +
        '<label class="form-label" style="font-size:12px">Pharmacy</label>' +
        '<div class="pharmacy-current" id="pharm-current-display">' +
          '<strong>' + esc(pharmName) + '</strong>' +
          (pharmPhone ? ' · ' + esc(pharmPhone) : '') +
          '<button class="btn btn-secondary" id="pharm-change-btn" style="margin-left:auto;font-size:11px;padding:3px 10px">Change</button>' +
        '</div>' +
        '<div id="pharm-lookup-inline" hidden></div>' +
      '</div>';
  } else {
    sectionEl.innerHTML =
      '<div style="margin-top:12px">' +
        '<label class="form-label" style="font-size:12px">Pharmacy</label>' +
        '<div class="pharmacy-current">' +
          '<span style="color:var(--text-muted);font-size:12px">No pharmacy on file</span>' +
          '<button class="btn btn-secondary" id="pharm-change-btn" style="margin-left:auto;font-size:11px;padding:3px 10px">Find Pharmacy</button>' +
        '</div>' +
        '<div id="pharm-lookup-inline" hidden></div>' +
      '</div>';
  }

  const changeBtn = sectionEl.querySelector('#pharm-change-btn');
  const lookupDiv = sectionEl.querySelector('#pharm-lookup-inline');

  if (changeBtn && lookupDiv) {
    changeBtn.addEventListener('click', () => {
      lookupDiv.hidden = !lookupDiv.hidden;
      if (!lookupDiv.hidden && lookupDiv.children.length === 0) {
        renderPharmacyLookup(lookupDiv, {
          zip: patient.addressZip || '',
          onSelect: (pharm) => {
            // Update patient record
            savePatient({
              id: patient.id,
              pharmacyName:  pharm.name,
              pharmacyPhone: pharm.phone,
              pharmacyFax:   pharm.fax,
            });
            // Re-render pharmacy section
            _renderPharmacySection(sectionEl, patientId);
            showToast('Pharmacy updated to ' + pharm.name, 'success');
          },
        });
      }
    });
  }
}

/* ---------- Continue after duplicate check (re-runs controlled substance + DDI + allergy) ---------- */
function _continueAfterDupeCheck(encounter, patient, type, detail, priority, notes) {
  const voActive2   = document.getElementById('vo-checkbox')?.checked || false;
  const voGivenBy2  = document.getElementById('vo-given-by')?.value.trim() || '';

  const doSave = () => {
    const orderData = {
      encounterId: encounter.id,
      patientId:   encounter.patientId,
      orderedBy:   voActive2 ? voGivenBy2 : (getCurrentProvider() || (getSessionUser() || {}).id || ''),
      type, priority, status: 'Pending', detail, notes,
      dateTime: new Date().toISOString(),
    };
    if (voActive2) {
      orderData.verbalOrder       = true;
      orderData.readBackConfirmed = true;
      orderData.coSignRequired    = true;
      orderData.coSignDeadline    = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }
    saveOrder(orderData);
    showToast(type + ' order added to queue — awaiting signature', 'success');
    if (typeof refreshOrderQueue === 'function') refreshOrderQueue(true);
    refreshOrderList();
    renderTypeFields(document.getElementById('type-fields'), type);
    const notesField = document.getElementById('ord-notes');
    if (notesField) notesField.value = '';
    // Reset verbal order controls
    const voCb3 = document.getElementById('vo-checkbox');
    const voFields3 = document.getElementById('vo-fields');
    if (voCb3) voCb3.checked = false;
    if (voFields3) voFields3.hidden = true;
  };

  // Controlled substance check
  if (type === 'Medication') {
    const typeFieldsContainer = document.getElementById('type-fields');
    const medEntry = typeFieldsContainer ? typeFieldsContainer._selectedMedEntry : null;
    if (medEntry && medEntry.schedule && !canPrescribeControlled()) {
      showToast('Only attending physicians with a DEA number can prescribe controlled substances.', 'error');
      return;
    }
  }

  // DDI check
  if (type === 'Medication' && patient && typeof checkDrugInteractions === 'function') {
    const typeFieldsContainer2 = document.getElementById('type-fields');
    const medEntryDDI = typeFieldsContainer2 ? typeFieldsContainer2._selectedMedEntry : null;
    const ddiResults = checkDrugInteractions(detail.drug || '', medEntryDDI, patient.id);
    const majorDDI = ddiResults.filter(d => d.severity === 'major');
    if (majorDDI.length > 0) {
      const ddiText = majorDDI.map(d => '<strong>' + esc(d.drug1) + ' + ' + esc(d.drug2) + '</strong>: ' + esc(d.effect)).join('<br><br>');
      confirmAction({
        title: ' MAJOR Drug Interaction',
        message: ddiText,
        confirmLabel: 'Override & Continue',
        danger: true,
        onConfirm: () => { _proceedAfterDDI(type, detail, patient, doSave); },
      });
      return;
    }
  }

  _proceedAfterDDI(type, detail, patient, doSave);
}

/* ---------- DDI → Allergy check pipeline ---------- */
function _proceedAfterDDI(type, detail, patient, doSave) {
  if (type === 'Medication' && patient) {
    const matches = _matchingAllergies(detail.drug || '', patient.id);
    if (matches.length > 0) {
      // 7a: Check if any match is a hard-stop (direct allergy or critical cross-reactivity)
      const allergyText = matches.map(a => a.allergen + ' (' + a.severity + ' — ' + a.reaction + ')').join(', ');
      const hasCriticalAllergy = matches.some(a => {
        var allergenLower = (a.allergen || '').toLowerCase().trim();
        var drugLower = (detail.drug || '').toLowerCase().trim();
        // Direct match = hard block
        if (allergenLower.indexOf(drugLower) >= 0 || drugLower.indexOf(allergenLower) >= 0) return true;
        // Critical cross-reactivity = hard block
        var isCriticalCross = false;
        if (typeof ALLERGY_CROSS_REACTIVITY !== 'undefined') {
          ALLERGY_CROSS_REACTIVITY.forEach(function(cr) {
            if (cr.severity === 'warning') return; // only block critical
            if (allergenLower.indexOf(cr.allergen) >= 0 || cr.allergen.indexOf(allergenLower) >= 0) {
              cr.crossReacts.forEach(function(xr) {
                if (drugLower.indexOf(xr) >= 0 || xr.indexOf(drugLower) >= 0) isCriticalCross = true;
              });
            }
          });
        }
        return isCriticalCross;
      });

      if (hasCriticalAllergy) {
        // Hard-stop allergy block — show red modal with override requiring reason
        const bodyHTML = '<div style="background:var(--badge-danger-bg);border:2px solid var(--danger);border-radius:8px;padding:20px;margin-bottom:12px">' +
          '<h3 style="color:var(--danger);margin:0 0 12px">ORDER BLOCKED</h3>' +
          '<p style="color:var(--badge-danger-text);font-size:14px;line-height:1.6">Patient has documented allergy to: <strong>' + esc(allergyText) + '</strong>.</p>' +
          '<p style="color:var(--badge-danger-text);font-size:14px">This medication (<strong>' + esc(detail.drug) + '</strong>) is contraindicated.</p>' +
          '</div>' +
          '<div id="allergy-override-section" style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-top:12px">' +
          '<h4 style="margin:0 0 8px;font-size:14px">Override with Clinical Justification</h4>' +
          '<div class="form-group">' +
          '<label class="form-label" for="allergy-override-reason">Override Reason (required) *</label>' +
          '<textarea class="form-control" id="allergy-override-reason" rows="3" placeholder="Provide clinical justification for overriding this allergy block..."></textarea>' +
          '</div>' +
          '</div>';
        const footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel Order</button>' +
          '<button class="btn btn-danger" id="allergy-override-btn" disabled>Override with Reason</button>';

        openModal({ title: 'Drug-Allergy Block', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

        const reasonTA = document.getElementById('allergy-override-reason');
        const overrideBtn = document.getElementById('allergy-override-btn');
        reasonTA.addEventListener('input', function() {
          overrideBtn.disabled = reasonTA.value.trim().length === 0;
        });
        overrideBtn.addEventListener('click', function() {
          const reason = reasonTA.value.trim();
          if (!reason) { showToast('Override reason is required.', 'error'); return; }
          const user = getSessionUser();
          // Wrap doSave to inject allergyOverride metadata
          const originalDoSave = doSave;
          const wrappedDoSave = function() {
            // Temporarily patch detail to include override info
            detail.allergyOverride = true;
            detail.overrideReason = reason;
            detail.overriddenBy = user ? user.id : '';
            originalDoSave();
          };
          closeModal();
          // Proceed to high-alert check after override
          _proceedAfterAllergyCheck(type, detail, patient, wrappedDoSave);
        });
        return;
      } else {
        // Non-critical allergy: confirm but don't hard-block
        confirmAction({
          title: 'Allergy Alert',
          message: 'Patient has a recorded allergy to: ' + allergyText + '. Are you sure you want to place this order?',
          confirmLabel: 'Override & Place Order',
          danger: true,
          onConfirm: function() { _proceedAfterAllergyCheck(type, detail, patient, doSave); },
        });
        return;
      }
    }
  }
  _proceedAfterAllergyCheck(type, detail, patient, doSave);
}

/* ---------- 7b: High-alert medication double-check ---------- */
function _proceedAfterAllergyCheck(type, detail, patient, doSave) {
  if (type === 'Medication' && typeof HIGH_ALERT_MEDS !== 'undefined') {
    var drugLower = (detail.drug || '').toLowerCase().trim();
    var isHighAlert = HIGH_ALERT_MEDS.some(function(ham) {
      return drugLower.indexOf(ham) >= 0 || ham.indexOf(drugLower) >= 0;
    });
    if (isHighAlert) {
      var bodyHTML = '<div style="background:var(--badge-warning-bg);border:2px solid var(--warning);border-radius:8px;padding:20px;margin-bottom:12px">' +
        '<h3 style="color:var(--badge-warning-text);margin:0 0 8px">HIGH-ALERT MEDICATION</h3>' +
        '<p style="color:var(--badge-warning-text);font-size:14px;line-height:1.6"><strong>' + esc(detail.drug) + '</strong> is classified as a high-alert medication.</p>' +
        '<p style="color:var(--badge-warning-text);font-size:13px">High-alert medications bear a heightened risk of causing significant patient harm when used in error.</p>' +
        '</div>' +
        '<div style="padding:12px;border:1px solid var(--border);border-radius:8px">' +
        '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:14px;line-height:1.5">' +
        '<input type="checkbox" id="high-alert-verify-cb" style="margin-top:4px" />' +
        '<span>I have independently verified the <strong>dose</strong>, <strong>route</strong>, and <strong>rate</strong> for this high-alert medication.</span>' +
        '</label>' +
        '</div>';
      var footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel Order</button>' +
        '<button class="btn btn-warning" id="high-alert-proceed-btn" disabled>Proceed with Order</button>';

      openModal({ title: 'High-Alert Medication Verification', bodyHTML: bodyHTML, footerHTML: footerHTML });

      var verifyCb = document.getElementById('high-alert-verify-cb');
      var proceedBtn = document.getElementById('high-alert-proceed-btn');
      verifyCb.addEventListener('change', function() {
        proceedBtn.disabled = !verifyCb.checked;
      });
      proceedBtn.addEventListener('click', function() {
        closeModal();
        detail.highAlertVerified = true;
        detail.highAlertVerifiedAt = new Date().toISOString();
        detail.highAlertVerifiedBy = (getSessionUser() || {}).id || '';
        doSave();
      });
      return;
    }
  }
  doSave();
}

/* ---------- Drug-Allergy Alert helpers ---------- */
function _matchingAllergies(drugName, patientId, medEntry) {
  if (!drugName || !patientId) return [];
  const lower = drugName.toLowerCase();
  const allergies = getPatientAllergies(patientId);

  return allergies.filter(a => {
    if (!a.allergen) return false;
    const allergenLower = a.allergen.toLowerCase();

    // Direct name match (existing behavior)
    if (allergenLower.includes(lower) || lower.includes(allergenLower)) return true;

    // Enhanced: check allergyTags for class-level cross-reactivity
    if (medEntry && medEntry.allergyTags) {
      for (const tag of medEntry.allergyTags) {
        if (allergenLower.includes(tag) || tag.includes(allergenLower)) return true;
      }
    }
    return false;
  });
}

function _checkDrugAllergy(drugName, patientId, medEntry) {
  const alertDiv = document.getElementById('drug-allergy-alert');
  if (!alertDiv) return;
  if (!drugName) { alertDiv.hidden = true; alertDiv.innerHTML = ''; return; }

  const parts = [];

  // Allergy check
  const matches = _matchingAllergies(drugName, patientId, medEntry);
  if (matches.length > 0) {
    parts.push(' Allergy: ' + matches.map(a => a.allergen + ' (' + a.severity + ' — ' + a.reaction + ')').join('; '));
  }

  // Drug-drug interaction check
  if (typeof checkDrugInteractions === 'function') {
    const ddiResults = checkDrugInteractions(drugName, medEntry, patientId);
    if (ddiResults.length > 0) {
      const majorDDI = ddiResults.filter(d => d.severity === 'major');
      const moderateDDI = ddiResults.filter(d => d.severity === 'moderate');
      if (majorDDI.length > 0) {
        parts.push(' MAJOR Interaction: ' + majorDDI.map(d => d.drug2 + ' — ' + d.effect).join('; '));
      }
      if (moderateDDI.length > 0) {
        parts.push('Moderate Interaction: ' + moderateDDI.map(d => d.drug2 + ' — ' + d.effect).join('; '));
      }
    }
  }

  if (parts.length > 0) {
    alertDiv.textContent = parts.join(' | ');
    alertDiv.hidden = false;
  } else {
    alertDiv.hidden = true;
    alertDiv.innerHTML = '';
  }
}

/* ---------- getChartOrderName (used by chart search) ---------- */
function getChartOrderName(order) {
  return getOrderDisplayName(order);
}

/* ============================================================
   Order Sets Modal
   ============================================================ */
function openOrderSetsModal(encounter, patient) {
  let selectedSetIdx = null;

  let bodyHTML = '<div id="order-set-list">';
  ORDER_SETS.forEach((set, idx) => {
    bodyHTML += '<button class="btn btn-secondary btn-block order-set-item" data-set-idx="' + idx + '" style="margin-bottom:8px;text-align:left">';
    bodyHTML += '<strong>' + esc(set.name) + '</strong> <span class="text-muted text-sm">(' + set.orders.length + ' orders)</span>';
    bodyHTML += '</button>';
  });
  bodyHTML += '</div>';
  bodyHTML += '<div id="order-set-detail" style="display:none"></div>';

  const footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="btn-place-order-set" disabled>Place Selected Orders</button>';

  openModal({ title: 'Inpatient Order Sets', bodyHTML, footerHTML, size: 'lg' });

  // Set selection
  document.querySelectorAll('.order-set-item').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSetIdx = parseInt(btn.dataset.setIdx);
      const set = ORDER_SETS[selectedSetIdx];
      document.getElementById('order-set-list').style.display = 'none';
      const detailDiv = document.getElementById('order-set-detail');
      detailDiv.style.display = '';
      detailDiv.innerHTML = '<h3>' + esc(set.name) + '</h3>';
      set.orders.forEach((ord, oi) => {
        const desc = ord.type === 'Medication'
          ? ord.detail.drug + ' ' + ord.detail.dose + ord.detail.unit + ' ' + ord.detail.route + ' ' + ord.detail.frequency
          : (ord.detail.panel || ord.detail.study || ord.type);
        detailDiv.innerHTML += '<label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">' +
          '<input type="checkbox" checked data-order-idx="' + oi + '" class="order-set-check" />' +
          '<span><strong>' + esc(ord.type) + ':</strong> ' + esc(desc) + ' <span class="badge badge-' + ord.priority.toLowerCase() + '">' + esc(ord.priority) + '</span></span></label>';
      });
      document.getElementById('btn-place-order-set').disabled = false;
    });
  });

  // Place orders
  document.getElementById('btn-place-order-set').addEventListener('click', () => {
    if (selectedSetIdx === null) return;
    const set = ORDER_SETS[selectedSetIdx];
    const checks = document.querySelectorAll('.order-set-check');
    let placed = 0;
    checks.forEach(cb => {
      if (!cb.checked) return;
      const oi = parseInt(cb.dataset.orderIdx);
      const ord = set.orders[oi];
      saveOrder({
        encounterId: encounter.id,
        patientId: encounter.patientId,
        orderedBy: getCurrentProvider() || (getSessionUser() || {}).id || '',
        type: ord.type,
        priority: ord.priority,
        status: 'Pending',
        detail: { ...ord.detail },
        notes: 'From order set: ' + set.name,
        dateTime: new Date().toISOString(),
      });
      placed++;
    });
    closeModal();
    showToast(placed + ' orders placed from ' + set.name + '.', 'success');
    refreshOrderList();
  });
}
