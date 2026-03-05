/* ============================================================
   views/chart-orders.js — Cross-encounter orders card,
   new order handler, order name helper
   ============================================================ */

/* ============================================================
   ORDERS (cross-encounter view)
   ============================================================ */
function buildChartOrdersCard(patientId) {
  const allOrders = getOrdersByPatient(patientId);
  const placeBtn = makeBtn('Place New Order', 'btn btn-primary btn-sm',
    () => handleChartNewOrder(patientId));
  const card = chartCard('Orders', placeBtn);
  card.id = 'section-orders';

  const countEl = document.createElement('span');
  countEl.className = 'text-muted text-sm';
  countEl.textContent = allOrders.length + ' total';
  card.querySelector('.card-header').insertBefore(countEl, placeBtn);

  if (allOrders.length === 0) {
    card.appendChild(buildEmptyState('📋', 'No orders placed',
      'Place orders through any open encounter.'));
    return card;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Type</th><th>Order</th><th>Duration</th><th>Priority</th><th>Status</th><th>Ordered</th><th>Encounter</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  allOrders.forEach(order => {
    const enc = getEncounter(order.encounterId);
    const tr = document.createElement('tr');

    const tdType = document.createElement('td');
    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge badge-' + order.type.toLowerCase();
    typeBadge.textContent = order.type;
    tdType.appendChild(typeBadge);

    const tdName = document.createElement('td');
    tdName.style.fontWeight = '500';
    tdName.textContent = getChartOrderName(order);

    const tdDur = document.createElement('td');
    tdDur.style.color = 'var(--text-muted)';
    tdDur.textContent = order.type === 'Medication' && order.detail?.duration ? order.detail.duration : '—';

    const tdPrio = document.createElement('td');
    const prioBadge = document.createElement('span');
    prioBadge.className = 'badge badge-' + order.priority.toLowerCase();
    prioBadge.textContent = order.priority;
    tdPrio.appendChild(prioBadge);

    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + order.status.toLowerCase();
    statusBadge.textContent = order.status;
    tdStatus.appendChild(statusBadge);

    const tdDate = document.createElement('td');
    tdDate.style.whiteSpace = 'nowrap';
    tdDate.textContent = formatDateTime(order.dateTime);

    const tdEnc = document.createElement('td');
    if (enc) {
      const encLink = document.createElement('button');
      encLink.className = 'table-link';
      encLink.textContent = enc.visitType + (enc.visitSubtype ? ' — ' + enc.visitSubtype : '');
      encLink.onclick = () => navigate('#orders/' + enc.id);
      tdEnc.appendChild(encLink);
    } else {
      tdEnc.textContent = '—';
    }

    const tdAct = document.createElement('td');
    tdAct.style.textAlign = 'right';
    if (enc) {
      tdAct.appendChild(makeBtn('View Orders', 'btn btn-secondary btn-sm',
        () => navigate('#orders/' + enc.id)));
    }

    tr.appendChild(tdType); tr.appendChild(tdName); tr.appendChild(tdDur); tr.appendChild(tdPrio);
    tr.appendChild(tdStatus); tr.appendChild(tdDate); tr.appendChild(tdEnc); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

function handleChartNewOrder(patientId) {
  const openEncs = getEncountersByPatient(patientId).filter(e => e.status === 'Open');
  if (openEncs.length === 0) {
    showToast('No open encounters. Create an encounter first.', 'warning');
    return;
  }
  if (openEncs.length === 1) {
    navigate('#orders/' + openEncs[0].id);
    return;
  }
  const opts = openEncs.map(e => {
    const prov = getProvider(e.providerId);
    const provName = prov ? prov.lastName + ', ' + prov.firstName : '[Removed]';
    return `<option value="${esc(e.id)}">${esc(formatDateTime(e.dateTime))} — ${esc(e.visitType)} (${esc(provName)})</option>`;
  }).join('');

  openModal({
    title: 'Select Encounter',
    bodyHTML: `<div class="form-group">
      <label class="form-label">Which encounter should this order be placed under?</label>
      <select class="form-control" id="pick-enc">${opts}</select>
    </div>`,
    footerHTML: `<button class="btn btn-secondary" id="pick-cancel">Cancel</button>
                 <button class="btn btn-primary" id="pick-go">Go to Orders</button>`,
  });
  document.getElementById('pick-cancel').addEventListener('click', closeModal);
  document.getElementById('pick-go').addEventListener('click', () => {
    const encId = document.getElementById('pick-enc').value;
    closeModal();
    navigate('#orders/' + encId);
  });
}

function getChartOrderName(order) {
  const d = order.detail || {};
  switch (order.type) {
    case 'Medication': return d.drug ? d.drug + (d.dose ? ' ' + d.dose + ' ' + (d.unit || '') : '') : 'Medication';
    case 'Lab':        return d.panel || 'Lab';
    case 'Imaging':    return (d.modality || '') + (d.bodyPart ? ' ' + d.bodyPart : '');
    case 'Consult':    return (d.service || '') + ' Consult';
    default:           return order.type;
  }
}
