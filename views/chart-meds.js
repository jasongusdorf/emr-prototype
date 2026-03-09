/* ============================================================
   views/chart-meds.js — Medications section, medications card,
   medication reconciliation tab
   ============================================================ */

/* ============================================================
   MEDICATIONS
   ============================================================ */
let _currentMedSubTab = 'outpatient';

function buildMedicationsSection(patientId) {
  const section = document.createElement('div');
  section.className = 'results-section';

  const bar = document.createElement('div');
  bar.className = 'results-subtab-bar';
  const tabs = [
    { key: 'outpatient', label: 'Outpatient Medications' },
    { key: 'inpatient',  label: 'Inpatient Medications' },
    { key: 'medrec',     label: 'Medication Reconciliation' },
  ];
  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'results-subtab' + (_currentMedSubTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      _currentMedSubTab = t.key;
      bar.querySelectorAll('.results-subtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMedContent();
    });
    bar.appendChild(btn);
  });
  section.appendChild(bar);

  const content = document.createElement('div');
  section.appendChild(content);

  function renderMedContent() {
    content.innerHTML = '';
    switch (_currentMedSubTab) {
      case 'outpatient': content.appendChild(buildMedicationsCard(patientId, 'Outpatient')); break;
      case 'inpatient':  content.appendChild(buildMedicationsCard(patientId, 'Inpatient')); break;
      case 'medrec':     content.appendChild(buildMedRecTab(patientId)); break;
    }
  }
  renderMedContent();
  return section;
}

function buildMedicationsCard(patientId, setting) {
  const allMeds = getPatientMedications(patientId);
  let meds;
  if (setting === 'Inpatient') {
    meds = allMeds.filter(m => m.setting === 'Inpatient');
  } else if (setting === 'Outpatient') {
    meds = allMeds.filter(m => !m.setting || m.setting === 'Outpatient');
  } else {
    meds = allMeds;
  }
  const title = setting ? setting + ' Medications' : 'Medications';
  const addBtn = makeBtn('+ Add Medication', 'btn btn-primary btn-sm',
    () => openMedicationModal(patientId, null, setting));
  const card = chartCard(title, addBtn);
  card.id = 'section-medications';

  const current = meds.filter(m => m.status === 'Current');
  const past    = meds.filter(m => m.status === 'Past');

  if (meds.length === 0) {
    card.appendChild(buildEmptyState('', 'No ' + (setting ? setting.toLowerCase() + ' ' : '') + 'medications recorded',
      'Add medications using the button above.'));
    return card;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Medication</th><th>Dose / Route</th><th>Frequency</th><th>Status</th><th>Indication</th><th>Start</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  [...current, ...past].forEach(med => {
    const tr = document.createElement('tr');
    if (med.status === 'Past') tr.style.opacity = '0.65';

    const tdName = document.createElement('td');
    tdName.style.fontWeight = '600';
    tdName.textContent = med.name;

    const tdDose = document.createElement('td');
    tdDose.textContent = [med.dose, med.unit, med.route].filter(Boolean).join(' ');

    const tdFreq = document.createElement('td');
    tdFreq.textContent = med.frequency;

    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = med.status === 'Current' ? 'badge badge-signed' : 'badge badge-closed';
    statusBadge.textContent = med.status;
    tdStatus.appendChild(statusBadge);

    const tdInd = document.createElement('td');
    tdInd.style.maxWidth = '160px';
    tdInd.style.whiteSpace = 'nowrap';
    tdInd.style.overflow = 'hidden';
    tdInd.style.textOverflow = 'ellipsis';
    tdInd.textContent = med.indication || '—';

    const tdStart = document.createElement('td');
    tdStart.textContent = formatDate(med.startDate) || '—';

    const tdAct = document.createElement('td');
    tdAct.style.textAlign = 'right';
    tdAct.style.whiteSpace = 'nowrap';
    if (med.status === 'Current') {
      tdAct.appendChild(makeBtn('Renew', 'btn btn-primary btn-sm', () => {
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);
        savePatientMedication({
          id: med.id,
          startDate: today,
          endDate: endDate.toISOString().split('T')[0],
        });
        showToast(med.name + ' renewed for 90 days.', 'success');
        refreshChart(patientId);
      }));
    }
    tdAct.appendChild(makeBtn('Edit', 'btn btn-secondary btn-sm',
      () => openMedicationModal(patientId, med.id), 'margin-left:6px'));
    tdAct.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({
        title: 'Remove Medication', message: 'Remove ' + med.name + ' from medication list?',
        confirmLabel: 'Remove', danger: true,
        onConfirm: () => { deletePatientMedication(med.id); showToast('Medication removed.'); refreshChart(patientId); },
      });
    }, 'margin-left:6px'));

    tr.appendChild(tdName); tr.appendChild(tdDose); tr.appendChild(tdFreq);
    tr.appendChild(tdStatus); tr.appendChild(tdInd); tr.appendChild(tdStart); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

/* ============================================================
   MEDICATION RECONCILIATION TAB
   ============================================================ */
function buildMedRecTab(patientId) {
  const card = chartCard('Medication Reconciliation');
  card.id = 'section-medrec';

  const body = document.createElement('div');
  body.className = 'medrec-columns';

  // Left: Home Medications
  const leftCol = document.createElement('div');
  leftCol.className = 'medrec-col';
  const leftTitle = document.createElement('h3');
  leftTitle.textContent = 'Home Medications';
  leftTitle.style.marginBottom = '12px';
  leftCol.appendChild(leftTitle);

  const homeMeds = getPatientMedications(patientId).filter(m => m.status === 'Current');
  if (homeMeds.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No current home medications.';
    leftCol.appendChild(empty);
  } else {
    homeMeds.forEach(med => {
      const item = document.createElement('div');
      item.className = 'medrec-item';
      item.innerHTML = '<strong>' + esc(med.name) + '</strong><br><span class="text-muted text-sm">' +
        esc([med.dose, med.unit, med.route, med.frequency].filter(Boolean).join(' ')) + '</span>';

      const actions = document.createElement('div');
      actions.style.marginTop = '6px';
      actions.style.display = 'flex';
      actions.style.gap = '4px';

      const continueBtn = makeBtn('Continue', 'btn btn-primary btn-sm', () => {
        showToast(med.name + ' continued.', 'success');
      });
      const holdBtn = makeBtn('Hold', 'btn btn-secondary btn-sm', () => {
        showToast(med.name + ' held.', 'warning');
      });
      const dcBtn = makeBtn('D/C', 'btn btn-danger btn-sm', () => {
        savePatientMedication({ id: med.id, status: 'Past' });
        showToast(med.name + ' discontinued.', 'success');
        refreshChart(patientId);
      });
      actions.appendChild(continueBtn);
      actions.appendChild(holdBtn);
      actions.appendChild(dcBtn);
      item.appendChild(actions);
      leftCol.appendChild(item);
    });
  }

  // Right: Inpatient Medications (from orders)
  const rightCol = document.createElement('div');
  rightCol.className = 'medrec-col';
  const rightTitle = document.createElement('h3');
  rightTitle.textContent = 'Inpatient Medications';
  rightTitle.style.marginBottom = '12px';
  rightCol.appendChild(rightTitle);

  const encounters = getEncountersByPatient(patientId);
  const inptEncs = encounters.filter(e => e.visitType === 'Inpatient' && e.status !== 'Cancelled');
  const inptMedOrders = [];
  inptEncs.forEach(enc => {
    const orders = getOrdersByEncounter(enc.id);
    orders.filter(o => o.type === 'Medication' && o.status !== 'Cancelled').forEach(o => inptMedOrders.push(o));
  });

  if (inptMedOrders.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.textContent = 'No active inpatient medication orders.';
    rightCol.appendChild(empty);
  } else {
    inptMedOrders.forEach(ord => {
      const item = document.createElement('div');
      item.className = 'medrec-item';
      const d = ord.detail || {};
      item.innerHTML = '<strong>' + esc(d.drug || 'Unknown') + '</strong><br><span class="text-muted text-sm">' +
        esc([d.dose, d.unit, d.route, d.frequency].filter(Boolean).join(' ')) +
        ' — ' + esc(ord.status) + '</span>';
      rightCol.appendChild(item);
    });
  }

  body.appendChild(leftCol);
  body.appendChild(rightCol);
  card.appendChild(body);
  return card;
}
