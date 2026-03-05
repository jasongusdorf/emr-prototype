/* ============================================================
   views/chart-utils.js — Shared helpers, appointments, print,
   immunizations, referrals, documents, audit log
   ============================================================ */

/* ============================================================
   UPCOMING APPOINTMENTS (chart overview card)
   ============================================================ */
function buildUpcomingAppointmentsCard(patientId) {
  const now = new Date();
  const appts = getAppointmentsByPatient(patientId)
    .filter(a => new Date(a.dateTime) >= now && a.status !== 'Cancelled' && a.status !== 'No-Show');

  if (appts.length === 0) return null;

  const card = chartCard('Upcoming Appointments', null);
  card.id = 'section-appointments';

  appts.slice(0, 5).forEach(appt => {
    const provider = getProvider(appt.providerId);
    const item = document.createElement('div');
    item.className = 'upcoming-appt-item';
    item.addEventListener('click', () => navigate('#schedule'));

    const time = document.createElement('span');
    time.className = 'upcoming-appt-time';
    time.textContent = formatDateTime(appt.dateTime);
    const type = document.createElement('span');
    type.className = 'upcoming-appt-type';
    type.textContent = appt.visitType + (appt.reason ? ' — ' + appt.reason : '');
    const prov = document.createElement('span');
    prov.className = 'upcoming-appt-provider';
    prov.textContent = provider ? provider.lastName + ', ' + provider.firstName : '—';

    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + appt.status.toLowerCase();
    statusBadge.textContent = appt.status;
    statusBadge.style.marginLeft = '8px';

    item.appendChild(time);
    item.appendChild(type);
    item.appendChild(prov);
    item.appendChild(statusBadge);
    card.appendChild(item);
  });

  return card;
}

function printPatientSummary(patientId) {
  const patient = getPatient(patientId);
  if (!patient) return;

  const age = (() => {
    if (!patient.dob) return '—';
    const d = new Date(patient.dob);
    const t = new Date();
    let a = t.getFullYear() - d.getFullYear();
    if (t.getMonth() - d.getMonth() < 0 || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
    return a;
  })();

  const allergies    = getPatientAllergies(patientId);
  const meds         = getPatientMedications(patientId).filter(m => m.status === 'Current');
  const problems     = getActiveProblems(patientId);
  const vitalsData   = getLatestVitalsByPatient(patientId);
  const v            = vitalsData ? vitalsData.vitals : null;

  function row(label, val) {
    return '<tr><td style="font-weight:600;padding:4px 8px;width:160px">' + esc(label) + '</td><td style="padding:4px 8px">' + esc(val || '—') + '</td></tr>';
  }

  const html = `<!DOCTYPE html><html><head><title>Patient Summary — ${esc(patient.lastName)}, ${esc(patient.firstName)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #000; margin: 20px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td { border: 1px solid #eee; padding: 4px 8px; vertical-align: top; }
    .mrn { font-size: 11px; color: #666; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 11px; font-weight: bold; }
    .badge-danger { background: #fee2e2; color: #c53030; }
    .badge-ok { background: #d1fae5; color: #065f46; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <h1>${esc(patient.lastName)}, ${esc(patient.firstName)}</h1>
  <div class="mrn">${esc(patient.mrn)} · DOB: ${esc(patient.dob || '—')} (${age} y/o) · ${esc(patient.sex || '')} · ${esc(patient.phone || '')}${patient.email ? ' · ' + esc(patient.email) : ''}</div>
  ${patient.addressStreet ? '<div class="mrn">' + esc([patient.addressStreet, patient.addressCity, patient.addressState, patient.addressZip].filter(Boolean).join(', ')) + '</div>' : ''}
  ${patient.emergencyContactName ? '<div class="mrn">Emergency Contact: ' + esc(patient.emergencyContactName) + (patient.emergencyContactPhone ? ' · ' + esc(patient.emergencyContactPhone) : '') + (patient.emergencyContactRelationship ? ' (' + esc(patient.emergencyContactRelationship) + ')' : '') + '</div>' : ''}
  ${patient.pharmacyName ? '<div class="mrn">Pharmacy: ' + esc(patient.pharmacyName) + (patient.pharmacyPhone ? ' · ' + esc(patient.pharmacyPhone) : '') + '</div>' : ''}
  <div style="font-size:11px;color:#666;margin-top:2px">Printed: ${new Date().toLocaleString()}</div>
  <h2>Allergies</h2>
  ${allergies.length === 0 ? '<p>No known drug allergies</p>' :
    '<table>' + allergies.map(a => row(a.allergen, a.reaction + ' — ' + a.severity)).join('') + '</table>'}
  <h2>Active Problems</h2>
  ${problems.length === 0 ? '<p>None documented</p>' :
    '<table>' + problems.map(p => row(p.name, (p.icd10 || '') + (p.status ? ' · ' + p.status : '') + (p.priority ? ' · ' + p.priority : ''))).join('') + '</table>'}
  <h2>Current Medications</h2>
  ${meds.length === 0 ? '<p>None documented</p>' :
    '<table>' + meds.map(m => row(m.name, [m.dose, m.unit, m.route, m.frequency].filter(Boolean).join(' '))).join('') + '</table>'}
  <h2>Most Recent Vitals</h2>
  ${!v ? '<p>No vitals on file</p>' : `<table>
    ${row('BP', (v.bpSystolic && v.bpDiastolic ? v.bpSystolic + '/' + v.bpDiastolic + ' mmHg' : '—'))}
    ${row('Heart Rate', v.heartRate ? v.heartRate + ' bpm' : '—')}
    ${row('Resp Rate', v.respiratoryRate ? v.respiratoryRate + '/min' : '—')}
    ${row('Temp', v.tempF ? v.tempF + ' °F' : '—')}
    ${row('SpO₂', v.spo2 ? v.spo2 + '%' : '—')}
    ${row('Weight', v.weightLbs ? v.weightLbs + ' lbs' : '—')}
  </table>`}
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
}

/* ============================================================
   SHARED HELPERS (chart.js only)
   ============================================================ */
function chartCard(title, actionEl, mb = true) {
  const card = document.createElement('div');
  card.className = 'card';
  if (mb) card.style.marginBottom = '20px';
  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const t = document.createElement('span');
  t.className = 'card-title';
  t.textContent = title;
  hdr.appendChild(t);
  if (actionEl) hdr.appendChild(actionEl);
  card.appendChild(hdr);
  return card;
}

function makeBtn(text, className, onclick, extraStyle) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.textContent = text;
  if (extraStyle) btn.style.cssText = extraStyle;
  btn.addEventListener('click', onclick);
  return btn;
}

function toLocalDateTimeValue(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ============================================================
   IMMUNIZATIONS
   ============================================================ */
function buildImmunizationsCard(patientId) {
  const imms = getImmunizations(patientId);
  const addBtn = makeBtn('+ Add', 'btn btn-primary btn-sm', () => openImmunizationModal(patientId, null));
  const card = chartCard('Immunizations', addBtn, false);
  card.id = 'section-immunizations';

  if (imms.length === 0) {
    card.appendChild(buildEmptyState('💉', 'No immunizations recorded', 'Add vaccine records for this patient.'));
    return card;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'imm-table';
  table.innerHTML = '<thead><tr><th>Vaccine</th><th>Date</th><th>Manufacturer</th><th>Lot</th><th>Next Due</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  imms.forEach(imm => {
    const tr = document.createElement('tr');
    const cells = [
      { text: imm.vaccine, bold: true },
      { text: imm.date ? formatDate(imm.date) : '—' },
      { text: imm.manufacturer || '—' },
      { text: imm.lot || '—', mono: true },
      { text: imm.nextDue ? formatDate(imm.nextDue) : '—' },
    ];
    cells.forEach(c => {
      const td = document.createElement('td');
      td.textContent = c.text;
      if (c.bold) td.style.fontWeight = '600';
      if (c.mono) td.style.fontFamily = 'monospace';
      tr.appendChild(td);
    });
    const tdAct = document.createElement('td');
    tdAct.style.display = 'flex'; tdAct.style.gap = '4px';
    tdAct.appendChild(makeBtn('Edit', 'btn btn-secondary btn-sm', () => openImmunizationModal(patientId, imm.id)));
    tdAct.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({ title: 'Delete Immunization', message: 'Delete ' + imm.vaccine + ' record?', confirmLabel: 'Delete', danger: true,
        onConfirm: () => { deleteImmunization(imm.id); showToast('Immunization deleted.'); refreshChart(patientId); } });
    }));
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

/* ============================================================
   REFERRALS
   ============================================================ */
function buildReferralsCard(patientId) {
  const referrals = getReferrals(patientId);
  const addBtn = makeBtn('+ Add Referral', 'btn btn-primary btn-sm', () => openReferralModal(patientId, null));
  const card = chartCard('Referrals', addBtn);
  card.id = 'section-referrals';

  if (referrals.length === 0) {
    card.appendChild(buildEmptyState('📤', 'No referrals', 'Add referrals to specialty care.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  referrals.forEach(ref => {
    const refCard = document.createElement('div');
    refCard.className = 'referral-card';

    const refBody = document.createElement('div');
    refBody.className = 'referral-body';

    const specRow = document.createElement('div');
    specRow.style.display = 'flex'; specRow.style.alignItems = 'center'; specRow.style.gap = '8px';
    const spec = document.createElement('span');
    spec.className = 'referral-specialty';
    spec.textContent = ref.specialty;

    const urgBadge = document.createElement('span');
    urgBadge.className = 'badge badge-' + (ref.urgency || 'routine').toLowerCase();
    urgBadge.textContent = ref.urgency || 'Routine';

    const statusKey = (ref.status || 'pending').toLowerCase().replace(/\s+/g, '-');
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-referral-' + statusKey;
    statusBadge.textContent = ref.status || 'Pending';

    specRow.appendChild(spec); specRow.appendChild(urgBadge); specRow.appendChild(statusBadge);

    const meta = document.createElement('div');
    meta.className = 'referral-meta';
    const parts = [];
    if (ref.providerName) parts.push('To: ' + ref.providerName);
    if (ref.referralDate) parts.push('Referred: ' + formatDate(ref.referralDate));
    if (ref.appointmentDate) parts.push('Appt: ' + formatDate(ref.appointmentDate));
    meta.textContent = parts.join(' · ');

    const reason = document.createElement('div');
    reason.style.fontSize = '12.5px'; reason.style.color = 'var(--text-secondary)'; reason.style.marginTop = '4px';
    reason.textContent = ref.reason || '';

    refBody.appendChild(specRow);
    refBody.appendChild(meta);
    refBody.appendChild(reason);

    const actDiv = document.createElement('div');
    actDiv.style.display = 'flex'; actDiv.style.flexDirection = 'column'; actDiv.style.gap = '4px';
    actDiv.appendChild(makeBtn('Update', 'btn btn-secondary btn-sm', () => openReferralModal(patientId, ref.id)));
    actDiv.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({ title: 'Delete Referral', message: 'Delete this referral to ' + ref.specialty + '?', confirmLabel: 'Delete', danger: true,
        onConfirm: () => { deleteReferral(ref.id); showToast('Referral deleted.'); refreshChart(patientId); } });
    }));

    refCard.appendChild(refBody);
    refCard.appendChild(actDiv);
    body.appendChild(refCard);
  });

  card.appendChild(body);
  return card;
}

/* ============================================================
   DOCUMENTS
   ============================================================ */
function buildDocumentsCard(patientId) {
  const docs = getDocuments(patientId);
  const uploadBtn = makeBtn('+ Upload', 'btn btn-primary btn-sm', () => openDocumentModal(patientId));
  const card = chartCard('Documents', uploadBtn);
  card.id = 'section-documents';

  if (docs.length === 0) {
    card.appendChild(buildEmptyState('📄', 'No documents', 'Upload clinical documents for this patient.'));
    return card;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';

  // Header row
  const header = document.createElement('div');
  header.className = 'doc-row';
  header.style.fontWeight = '600'; header.style.fontSize = '11px';
  header.style.textTransform = 'uppercase'; header.style.letterSpacing = '0.06em';
  header.style.color = 'var(--text-muted)'; header.style.borderBottom = '2px solid var(--border)';
  ['Name', 'Category', 'Date', 'Description', 'Actions'].forEach(h => {
    const el = document.createElement('span');
    el.textContent = h;
    header.appendChild(el);
  });
  wrap.appendChild(header);

  docs.forEach(doc => {
    const row = document.createElement('div');
    row.className = 'doc-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'doc-name';
    nameEl.textContent = doc.name;

    const catEl = document.createElement('span');
    const catBadge = document.createElement('span');
    catBadge.className = 'doc-category-badge';
    catBadge.textContent = doc.category || 'Clinical';
    catEl.appendChild(catBadge);

    const dateEl = document.createElement('span');
    dateEl.textContent = doc.uploadDate ? formatDate(doc.uploadDate) : '—';
    dateEl.style.color = 'var(--text-muted)'; dateEl.style.fontSize = '12px';

    const descEl = document.createElement('span');
    descEl.textContent = doc.description || '—';
    descEl.style.color = 'var(--text-secondary)'; descEl.style.fontSize = '12px';

    const actEl = document.createElement('span');
    actEl.style.display = 'flex'; actEl.style.gap = '4px';

    if (doc.fileData) {
      const viewBtn = makeBtn('View', 'btn btn-secondary btn-sm', () => {
        try {
          const byteString = atob(doc.fileData.split(',')[1] || doc.fileData);
          const mime = doc.type || 'application/octet-stream';
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          const blob = new Blob([ab], { type: mime });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } catch (e) { showToast('Could not open document.', 'error'); }
      });
      actEl.appendChild(viewBtn);
    }

    actEl.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({ title: 'Delete Document', message: 'Delete "' + doc.name + '"?', confirmLabel: 'Delete', danger: true,
        onConfirm: () => { deleteDocument(doc.id); showToast('Document deleted.'); refreshChart(patientId); } });
    }));

    row.appendChild(nameEl); row.appendChild(catEl); row.appendChild(dateEl);
    row.appendChild(descEl); row.appendChild(actEl);
    wrap.appendChild(row);
  });

  card.appendChild(wrap);
  return card;
}

/* ============================================================
   AUDIT LOG
   ============================================================ */
function buildAuditLogCard(patientId) {
  const entries = getAuditLog(patientId);
  const card = chartCard('Audit Log', null);
  card.id = 'section-audit-log';

  const toggleBtn = makeBtn('Show Audit Log (' + entries.length + ' entries)', 'btn btn-ghost btn-sm', function() {
    const logWrap = card.querySelector('.audit-log-wrap');
    if (logWrap) {
      const showing = logWrap.style.display !== 'none';
      logWrap.style.display = showing ? 'none' : 'block';
      this.textContent = (showing ? 'Show' : 'Hide') + ' Audit Log (' + entries.length + ' entries)';
    }
  });
  card.querySelector('.card-header').appendChild(toggleBtn);

  const logWrap = document.createElement('div');
  logWrap.className = 'audit-log-wrap';
  logWrap.style.display = 'none';

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-muted text-sm';
    empty.style.padding = '12px 16px';
    empty.textContent = 'No audit entries recorded.';
    logWrap.appendChild(empty);
  } else {
    const hdr = document.createElement('div');
    hdr.className = 'audit-row';
    hdr.style.fontWeight = '700'; hdr.style.fontSize = '10px'; hdr.style.textTransform = 'uppercase';
    hdr.style.borderBottom = '2px solid var(--border)'; hdr.style.letterSpacing = '0.07em';
    ['Timestamp', 'Action', 'Details'].forEach(h => {
      const el = document.createElement('span');
      el.textContent = h;
      hdr.appendChild(el);
    });
    logWrap.appendChild(hdr);

    entries.slice(0, 50).forEach(entry => {
      const row = document.createElement('div');
      row.className = 'audit-row';

      const ts = document.createElement('span');
      ts.className = 'audit-ts';
      ts.textContent = formatDateTime(entry.timestamp);

      const action = document.createElement('span');
      action.className = 'audit-action';
      action.textContent = entry.action;

      const detail = document.createElement('span');
      detail.className = 'audit-detail';
      detail.textContent = entry.details || entry.entityType;

      row.appendChild(ts); row.appendChild(action); row.appendChild(detail);
      logWrap.appendChild(row);
    });
  }

  card.appendChild(logWrap);
  return card;
}
