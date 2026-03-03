/* ============================================================
   views/orders.js — Two-panel CPOE
   Left: order list grouped by type
   Right: order entry form with 4 type selectors
   ============================================================ */

const ORDER_TYPES = ['Medication', 'Lab', 'Imaging', 'Consult'];
const ORDER_TYPE_ICONS = { Medication: '💊', Lab: '🧪', Imaging: '🩻', Consult: '👨‍⚕️' };
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

let _selectedType     = 'Medication';
let _selectedPriority = 'Routine';
let _ordersEncounterId = null;

function renderOrders(encounterId) {
  clearTimeout(autosaveTimer);  // clear encounter autosave if navigating from encounter view
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
  const provider = getProvider(encounter.providerId);
  const patName  = patient  ? patient.firstName + ' ' + patient.lastName : 'Unknown Patient';
  const provName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : '[Removed Provider]';

  setTopbar({
    title:  'Orders',
    meta:   patName + ' · ' + (patient ? patient.mrn : ''),
    actions: `
      <a href="${patient ? '#chart/' + patient.id : '#dashboard'}" class="btn btn-secondary btn-sm">← Chart</a>
      <a href="#encounter/${encounterId}" class="btn btn-secondary btn-sm">Note</a>
    `,
  });
  setActiveNav('dashboard');

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
    const empty = buildEmptyState('📋', 'No orders yet', 'Use the form to place an order.');
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
          updateOrderStatus(order.id, 'Cancelled');
          refreshOrderList();
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

function refreshOrderList() {
  const container = document.getElementById('order-list-panel');
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

  // Orderer selector
  const providers = getProviders();
  const ordererGroup = document.createElement('div');
  ordererGroup.className = 'form-group';
  const ordererLabel = document.createElement('label');
  ordererLabel.className = 'form-label';
  ordererLabel.textContent = 'Ordering Provider';
  const ordererSelect = document.createElement('select');
  ordererSelect.className = 'form-control';
  ordererSelect.id = 'ord-provider';

  if (providers.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = '— No providers —';
    ordererSelect.appendChild(opt);
    ordererSelect.disabled = true;
  } else {
    const encProvider = getProvider(encounter.providerId);
    const sorted = encProvider
      ? [encProvider, ...providers.filter(p => p.id !== encounter.providerId)]
      : providers;
    sorted.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.firstName + ' ' + p.lastName + ', ' + p.degree;
      ordererSelect.appendChild(opt);
    });
  }

  ordererGroup.appendChild(ordererLabel);
  ordererGroup.appendChild(ordererSelect);
  body.appendChild(ordererGroup);

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
      _checkDrugAllergy(e.target.value.trim(), encounter.patientId);
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
  placeBtn.onclick = () => placeOrder(encounter, patient);
  footer.appendChild(placeBtn);
  card.appendChild(footer);

  container.appendChild(card);
}

/* ---------- Type-specific form fields ---------- */
function renderTypeFields(container, type) {
  container.innerHTML = '';

  if (type === 'Medication') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Drug Name *</label>
        <input class="form-control" id="med-drug" placeholder="e.g. Metoprolol" autocomplete="off" />
        <div id="drug-allergy-alert" hidden style="margin-top:6px;background:var(--priority-stat-bg);border:1px solid var(--danger);border-left:4px solid var(--danger);border-radius:var(--radius);padding:8px 12px;color:var(--danger);font-size:12.5px;font-weight:600"></div>
      </div>
      <div class="form-row-3">
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
      <div class="form-group">
        <label class="form-label">Indication</label>
        <input class="form-control" id="med-indication" placeholder="Reason for medication" />
      </div>
    `;
  }

  else if (type === 'Lab') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Panel *</label>
        <select class="form-control" id="lab-panel">
          ${LAB_PANELS.map(p => `<option>${esc(p)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Individual Tests (comma-separated)</label>
        <input class="form-control" id="lab-tests" placeholder="e.g. Na, K, Cl, CO2" />
      </div>
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
    `;
  }

  else if (type === 'Imaging') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Modality *</label>
          <select class="form-control" id="img-modality">
            ${IMAGING_MODALITIES.map(m => `<option>${esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Body Part *</label>
          <input class="form-control" id="img-body" placeholder="e.g. Chest, Brain" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Clinical Indication *</label>
        <input class="form-control" id="img-indication" placeholder="Reason for study" />
      </div>
    `;
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
  const orderedBy = document.getElementById('ord-provider')?.value;
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
      indication: document.getElementById('med-indication')?.value.trim(),
    };
  }

  else if (type === 'Lab') {
    const panel = document.getElementById('lab-panel')?.value;
    if (!panel) { showToast('Panel is required.', 'error'); return; }
    const testsRaw = document.getElementById('lab-tests')?.value.trim() || '';
    const tests    = testsRaw ? testsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    detail = {
      panel,
      tests,
      specimen: document.getElementById('lab-specimen')?.value,
    };
  }

  else if (type === 'Imaging') {
    const modality  = document.getElementById('img-modality')?.value;
    const bodyPart  = document.getElementById('img-body')?.value.trim();
    const indication = document.getElementById('img-indication')?.value.trim();
    if (!bodyPart || !indication) { showToast('Body part and indication are required.', 'error'); return; }
    detail = { modality, bodyPart, indication };
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
    showToast(type + ' order placed.', 'success');
    refreshOrderList();
    renderTypeFields(document.getElementById('type-fields'), type);
    const notesField = document.getElementById('ord-notes');
    if (notesField) notesField.value = '';
  };

  // Drug-allergy check for Medication orders
  if (type === 'Medication' && patient) {
    const matches = _matchingAllergies(detail.drug || '', patient.id);
    if (matches.length > 0) {
      const allergyText = matches.map(a => a.allergen + ' (' + a.severity + ' — ' + a.reaction + ')').join(', ');
      confirmAction({
        title: '⚠ Allergy Alert — Override?',
        message: 'Patient has a recorded allergy to: ' + allergyText + '. Are you sure you want to place this order?',
        confirmLabel: 'Override & Place Order',
        danger: true,
        onConfirm: doSave,
      });
      return;
    }
  }

  doSave();
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
      return parts.join(', ') || '';
    }
    case 'Lab':     return d.specimen ? 'Specimen: ' + d.specimen : '';
    case 'Imaging': return d.indication || '';
    case 'Consult': return d.reason ? d.reason.slice(0, 60) + (d.reason.length > 60 ? '…' : '') : '';
    default:        return '';
  }
}

/* ---------- Drug-Allergy Alert helpers ---------- */
function _matchingAllergies(drugName, patientId) {
  if (!drugName || !patientId) return [];
  const lower = drugName.toLowerCase();
  return getPatientAllergies(patientId).filter(a =>
    a.allergen && a.allergen.toLowerCase().includes(lower) ||
    lower.includes(a.allergen.toLowerCase())
  );
}

function _checkDrugAllergy(drugName, patientId) {
  const alertDiv = document.getElementById('drug-allergy-alert');
  if (!alertDiv) return;
  if (!drugName) { alertDiv.hidden = true; alertDiv.textContent = ''; return; }
  const matches = _matchingAllergies(drugName, patientId);
  if (matches.length > 0) {
    const msg = '⚠ Allergy Alert: ' + matches.map(a => a.allergen + ' (' + a.severity + ' — ' + a.reaction + ')').join('; ');
    alertDiv.textContent = msg;
    alertDiv.hidden = false;
  } else {
    alertDiv.hidden = true;
    alertDiv.textContent = '';
  }
}

/* ---------- getChartOrderName (used by chart search) ---------- */
function getChartOrderName(order) {
  return getOrderDisplayName(order);
}
