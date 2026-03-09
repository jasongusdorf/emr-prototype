/* ============================================================
   views/orders.js — Two-panel CPOE
   Left: order list grouped by type
   Right: order entry form with 4 type selectors
   ============================================================ */

const ORDER_TYPES = ['Medication', 'Lab', 'Imaging', 'Consult'];
const ORDER_TYPE_ICONS = { Medication: '', Lab: '', Imaging: '', Consult: '' };
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
  'Orthopedics', 'Surgery', 'Psychiatry', 'Physical Therapy', 'Social Work', 'Other',
];

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

function renderOrders(encounterId) {
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
      <a href="${patient ? '#chart/' + patient.id : '#dashboard'}" class="btn btn-secondary btn-sm">← Chart</a>
      <a href="#encounter/${encounterId}" class="btn btn-secondary btn-sm">Note</a>
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
}

/* ---------- Order list (left) ---------- */
function renderOrderList(container, encounterId) {
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = 'Active Orders';
  header.appendChild(title);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.style.padding = '16px';

  const orders = getOrdersByEncounter(encounterId);

  if (orders.length === 0) {
    const empty = buildEmptyState('', 'No orders yet', 'Use the form to place an order.');
    body.appendChild(empty);
    card.appendChild(body);
    container.appendChild(card);
    return;
  }

  // Group by type
  const groups = {};
  ORDER_TYPES.forEach(t => { groups[t] = []; });
  orders.forEach(o => {
    if (groups[o.type]) groups[o.type].push(o);
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

      const prioBadge = document.createElement('span');
      prioBadge.className = 'badge badge-' + order.priority.toLowerCase();
      prioBadge.textContent = order.priority;

      const statusBadge = document.createElement('span');
      statusBadge.className = 'badge badge-' + order.status.toLowerCase();
      statusBadge.textContent = order.status;

      badges.appendChild(prioBadge);
      badges.appendChild(statusBadge);

      itemHeader.appendChild(nameEl);
      itemHeader.appendChild(badges);

      const metaEl = document.createElement('div');
      metaEl.className = 'order-item-meta';
      metaEl.textContent = getOrderSubtext(order) + ' · ' + formatDateTime(order.dateTime);

      const actionsEl = document.createElement('div');
      actionsEl.className = 'order-item-actions';
      actionsEl.style.marginTop = '6px';

      if (order.status === 'Pending' || order.status === 'Active') {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-secondary btn-sm';
        completeBtn.textContent = 'Complete';
        completeBtn.onclick = () => {
          updateOrderStatus(order.id, 'Completed');
          refreshOrderList();
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

function refreshOrderList(containerId) {
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
        <label class="form-label">Drug Name *</label>
        <div class="med-autocomplete-container">
          <input class="form-control" id="med-drug" placeholder="e.g. Metoprolol" autocomplete="off" />
        </div>
        <div id="drug-allergy-alert" hidden style="margin-top:6px;background:var(--priority-stat-bg);border:1px solid var(--danger);border-left:4px solid var(--danger);border-radius:var(--radius);padding:8px 12px;color:var(--danger);font-size:12.5px;font-weight:600"></div>
      </div>
      <div id="med-dose-pills-container"></div>
      <div class="form-row-3" id="med-dose-row">
        <div class="form-group">
          <label class="form-label">Dose *</label>
          <input class="form-control" id="med-dose" placeholder="e.g. 25" type="number" min="0" step="any" />
        </div>
        <div class="form-group">
          <label class="form-label">Unit</label>
          <select class="form-control" id="med-unit">
            ${MED_UNITS.map(u => `<option>${esc(u)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Route</label>
          <select class="form-control" id="med-route">
            ${MED_ROUTES.map(r => `<option>${esc(r)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Frequency</label>
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
          <label class="form-label">Duration</label>
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
          <label class="form-label">Custom Duration (days)</label>
          <input class="form-control" id="med-duration-other" type="number" min="1" placeholder="Days" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Indication</label>
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
        <label class="form-label">Search Lab Test *</label>
        <div class="med-autocomplete-container">
          <input class="form-control" id="lab-search" placeholder="Type to search labs (e.g. CBC, BMP, TSH)..." autocomplete="off" />
        </div>
      </div>
      <div id="lab-detail-section"></div>
      <div class="form-group">
        <label class="form-label">Specimen</label>
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
          <label class="form-label">Frequency *</label>
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
          <label class="form-label">Urgency *</label>
          <select class="form-control" id="lab-urgency">
            <option value="Routine">Routine</option>
            <option value="Urgent">Urgent</option>
            <option value="STAT">STAT</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Additional Tests (comma-separated)</label>
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
        <label class="form-label">Search Imaging Study *</label>
        <div class="med-autocomplete-container">
          <input class="form-control" id="img-search" placeholder="Type to search (e.g. CT Head, MRI Knee, Chest X-Ray)..." autocomplete="off" />
        </div>
      </div>
      <div id="img-detail-section"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Modality</label>
          <input class="form-control" id="img-modality" readonly placeholder="Auto-filled" />
        </div>
        <div class="form-group">
          <label class="form-label">Body Part</label>
          <input class="form-control" id="img-body" placeholder="e.g. Chest, Brain" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Laterality</label>
        <select class="form-control" id="img-laterality">
          <option value="N/A">N/A</option>
          <option value="Left">Left</option>
          <option value="Right">Right</option>
          <option value="Bilateral">Bilateral</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Clinical Indication *</label>
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
        <label class="form-label">Consulting Service *</label>
        <select class="form-control" id="con-service">
          ${CONSULT_SERVICES.map(s => `<option>${esc(s)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Consult *</label>
        <textarea class="note-textarea" id="con-reason" style="min-height:80px"
          placeholder="Clinical question / reason for consultation"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Urgency</label>
        <select class="form-control" id="con-urgency">
          <option>Routine</option>
          <option>Urgent</option>
          <option>Emergent</option>
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

  const doSave = () => {
    saveOrder({
      encounterId: encounter.id,
      patientId:   encounter.patientId,
      orderedBy:   orderedBy || '',
      type,
      priority,
      status:  'Pending',
      detail,
      notes,
      dateTime: new Date().toISOString(),
    });
    showToast(type + ' order added to queue — awaiting signature', 'success');
    if (typeof refreshOrderQueue === 'function') refreshOrderQueue(true);
    refreshOrderList();
    renderTypeFields(document.getElementById('type-fields'), type);
    const notesField = document.getElementById('ord-notes');
    if (notesField) notesField.value = '';
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
    default:           return order.type;
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
  const doSave = () => {
    saveOrder({
      encounterId: encounter.id,
      patientId:   encounter.patientId,
      orderedBy:   getCurrentProvider() || (getSessionUser() || {}).id || '',
      type, priority, status: 'Pending', detail, notes,
      dateTime: new Date().toISOString(),
    });
    showToast(type + ' order added to queue — awaiting signature', 'success');
    if (typeof refreshOrderQueue === 'function') refreshOrderQueue(true);
    refreshOrderList();
    renderTypeFields(document.getElementById('type-fields'), type);
    const notesField = document.getElementById('ord-notes');
    if (notesField) notesField.value = '';
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
      const allergyText = matches.map(a => a.allergen + ' (' + a.severity + ' — ' + a.reaction + ')').join(', ');
      confirmAction({
        title: ' Allergy Alert — Override?',
        message: 'Patient has a recorded allergy to: ' + allergyText + '. Are you sure you want to place this order?',
        confirmLabel: 'Override & Place Order',
        danger: true,
        onConfirm: doSave,
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
