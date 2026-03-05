/* ============================================================
   views/chart-profile.js — Demographics, vitals, allergies,
   social history, PMH, family history, surgeries, vitals trend,
   problems, preventive care
   ============================================================ */

/* ============================================================
   DEMOGRAPHICS
   ============================================================ */
function buildDemographicsCard(patient, patientId) {
  const card = chartCard('Demographics', null);
  card.id = 'section-demographics';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-secondary btn-sm';
  editBtn.textContent = 'Edit';
  editBtn.onclick = () => openEditPatientModal(patient, () => refreshChart(patientId));
  card.querySelector('.card-header').appendChild(editBtn);

  const body = document.createElement('div');
  body.className = 'card-body';

  const patHeader = document.createElement('div');
  patHeader.className = 'patient-header';

  const avatar = document.createElement('div');
  avatar.className = 'patient-avatar';
  avatar.textContent = ((patient.firstName[0] || '') + (patient.lastName[0] || '')).toUpperCase();

  const info = document.createElement('div');
  info.className = 'patient-info';
  const nameEl = document.createElement('h2');
  nameEl.textContent = patient.firstName + ' ' + patient.lastName;
  const mrnEl = document.createElement('div');
  mrnEl.className = 'mrn';
  mrnEl.textContent = patient.mrn;
  info.appendChild(nameEl);
  info.appendChild(mrnEl);

  patHeader.appendChild(avatar);
  patHeader.appendChild(info);
  body.appendChild(patHeader);

  // Age computed
  const dobDate = patient.dob ? new Date(patient.dob) : null;
  let ageStr = '—';
  if (dobDate) {
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
    ageStr = age + ' y/o';
  }

  const grid = document.createElement('div');
  grid.className = 'demo-grid';

  const addressParts = [patient.addressStreet, patient.addressCity, patient.addressState, patient.addressZip].filter(Boolean);
  const addressStr = addressParts.length > 0 ? addressParts.join(', ') : '';

  const ecParts = [patient.emergencyContactName, patient.emergencyContactPhone, patient.emergencyContactRelationship].filter(Boolean);
  const ecStr = ecParts.length > 0 ? ecParts.join(' · ') : '';

  const pharmParts = [patient.pharmacyName, patient.pharmacyPhone].filter(Boolean);
  const pharmStr = pharmParts.length > 0 ? pharmParts.join(' · ') : '';

  // Panel providers
  const panelProvNames = (patient.panelProviders || []).map(id => {
    const p = getProvider(id);
    return p ? p.firstName + ' ' + p.lastName + ', ' + p.degree : null;
  }).filter(Boolean).join('; ');

  [
    ['Date of Birth', formatDate(patient.dob) + (dobDate ? ' (' + ageStr + ')' : '')],
    ['Sex',          patient.sex],
    ['Phone',        patient.phone],
    ['Email',        patient.email],
    ['Insurance',    patient.insurance],
    ['Address',      addressStr],
    ['Emergency Contact', ecStr],
    ['Pharmacy',     pharmStr],
    ['Panel Providers', panelProvNames],
    ['Registered',   formatDate(patient.createdAt)],
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'demo-item';
    const lbl = document.createElement('div');
    lbl.className = 'demo-label';
    lbl.textContent = label;
    const val = document.createElement('div');
    val.className = 'demo-val';
    val.textContent = value || '—';
    item.appendChild(lbl);
    item.appendChild(val);
    grid.appendChild(item);
  });

  body.appendChild(grid);
  card.appendChild(body);

  // Vitals strip (most recent)
  const vitalsStrip = buildVitalsStrip(patientId);
  if (vitalsStrip) card.appendChild(vitalsStrip);

  return card;
}

/* ---------- Vitals strip (most recent on demographics card) ---------- */
function buildVitalsStrip(patientId) {
  const vitals = getLatestVitalsByPatient(patientId);
  if (!vitals) return null;

  const strip = document.createElement('div');
  strip.className = 'vitals-strip';

  const label = document.createElement('div');
  label.className = 'vitals-strip-label';
  const enc = vitals.encounter;
  label.textContent = 'Most Recent Vitals' + (enc ? ' — ' + formatDateTime(enc.dateTime) : '');
  strip.appendChild(label);

  const v = vitals.vitals;
  const pairs = [
    ['BP',   v.bpSystolic && v.bpDiastolic ? v.bpSystolic + '/' + v.bpDiastolic + ' mmHg' : null],
    ['HR',   v.heartRate       ? v.heartRate + ' bpm'         : null],
    ['RR',   v.respiratoryRate ? v.respiratoryRate + '/min'   : null],
    ['Temp', v.tempF           ? v.tempF + '°F'               : null],
    ['O₂',   v.spo2            ? v.spo2 + '%'                 : null],
    ['Wt',   v.weightLbs       ? v.weightLbs + ' lbs'         : null],
    ['Ht',   v.heightIn        ? _fmtHeight(v.heightIn)       : null],
  ];

  pairs.filter(([, v]) => v !== null).forEach(([lbl, val]) => {
    const item = document.createElement('span');
    item.className = 'vs-item';
    item.innerHTML = esc(lbl) + ' <strong>' + esc(val) + '</strong>';
    strip.appendChild(item);
  });

  return strip;
}

function _fmtHeight(totalInches) {
  if (!totalInches) return '';
  const ft  = Math.floor(totalInches / 12);
  const ins = Math.round(totalInches % 12);
  return ft + "'" + ins + '"';
}

/* ============================================================
   ALLERGIES
   ============================================================ */
function buildAllergiesCard(patientId) {
  const allergies = getPatientAllergies(patientId);
  const addBtn = makeBtn('+ Add', 'btn btn-primary btn-sm', () => openAllergyModal(patientId, null));
  const card = chartCard('Allergies', addBtn, false);
  card.id = 'section-allergies';

  const countEl = document.createElement('span');
  countEl.className = 'text-muted text-sm';
  countEl.textContent = allergies.length ? allergies.length + ' recorded' : 'None on file';
  card.querySelector('.card-header').insertBefore(countEl, addBtn);

  if (allergies.length === 0) {
    card.appendChild(buildEmptyState('🚫', 'No allergies recorded',
      'Add known drug, food, or environmental allergies.'));
    return card;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Allergen</th><th>Type</th><th>Reaction</th><th>Severity</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  allergies.forEach(a => {
    const tr = document.createElement('tr');

    const tdAllergen = document.createElement('td');
    tdAllergen.style.fontWeight = '600';
    tdAllergen.textContent = a.allergen;

    const tdType = document.createElement('td');
    tdType.textContent = a.type;

    const tdReaction = document.createElement('td');
    tdReaction.textContent = a.reaction;

    const tdSev = document.createElement('td');
    const sevBadge = document.createElement('span');
    sevBadge.className = 'badge badge-severity-' + a.severity.toLowerCase().replace(/\s+/g, '-');
    sevBadge.textContent = a.severity;
    tdSev.appendChild(sevBadge);

    const tdAct = document.createElement('td');
    tdAct.style.textAlign = 'right';
    tdAct.appendChild(makeBtn('Edit', 'btn btn-secondary btn-sm',
      () => openAllergyModal(patientId, a.id)));
    tdAct.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({
        title: 'Remove Allergy', message: 'Remove ' + a.allergen + ' from allergy list?',
        confirmLabel: 'Remove', danger: true,
        onConfirm: () => { deletePatientAllergy(a.id); showToast('Allergy removed.'); refreshChart(patientId); },
      });
    }, 'margin-left:6px'));

    tr.appendChild(tdAllergen); tr.appendChild(tdType); tr.appendChild(tdReaction);
    tr.appendChild(tdSev); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

/* ============================================================
   SOCIAL HISTORY
   ============================================================ */
function buildSocialHistoryCard(patientId) {
  const sh = getSocialHistory(patientId);
  const editBtn = makeBtn(sh ? 'Edit' : '+ Add', 'btn btn-primary btn-sm',
    () => openSocialHistoryModal(patientId));
  const card = chartCard('Social History', editBtn, false);
  card.id = 'section-social-history';

  if (!sh) {
    card.appendChild(buildEmptyState('👤', 'No social history',
      'Add tobacco, alcohol, occupation, and lifestyle details.'));
    return card;
  }

  const body = document.createElement('div');
  body.className = 'card-body';
  body.style.padding = '14px 20px';

  const grid = document.createElement('div');
  grid.className = 'demo-grid';
  grid.style.gridTemplateColumns = '1fr';
  grid.style.gap = '8px 0';

  const fields = [
    ['Smoking',          sh.smokingStatus],
    ['Tobacco Use',      sh.tobaccoUse],
    ['Alcohol',          sh.alcoholUse],
    ['Substances',       sh.substanceUse],
    ['Occupation',       sh.occupation],
    ['Marital Status',   sh.maritalStatus],
    ['Living Situation', sh.livingSituation],
    ['Exercise',         sh.exercise],
    ['Diet',             sh.diet],
    ['Notes',            sh.notes],
  ];

  fields.forEach(([label, value]) => {
    if (!value) return;
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.gap = '8px';
    item.style.lineHeight = '1.5';

    const lbl = document.createElement('span');
    lbl.className = 'demo-label';
    lbl.style.minWidth = '120px';
    lbl.textContent = label;

    const val = document.createElement('span');
    val.className = 'demo-val';
    val.style.fontSize = '13px';
    val.textContent = value;

    item.appendChild(lbl);
    item.appendChild(val);
    grid.appendChild(item);
  });

  body.appendChild(grid);
  card.appendChild(body);
  return card;
}

/* ============================================================
   PAST MEDICAL HISTORY (expandable evidence)
   ============================================================ */
function buildPMHCard(patientId) {
  const diagnoses = getPatientDiagnoses(patientId);
  const addBtn = makeBtn('+ Add Diagnosis', 'btn btn-primary btn-sm',
    () => openPMHModal(patientId, null));
  const card = chartCard('Past Medical History', addBtn);
  card.id = 'section-pmh';

  if (diagnoses.length === 0) {
    card.appendChild(buildEmptyState('🩺', 'No diagnoses on record',
      'Add past and current medical diagnoses.'));
    return card;
  }

  const list = document.createElement('div');
  list.className = 'pmh-list';

  diagnoses.forEach(diag => {
    const item = document.createElement('div');
    item.className = 'pmh-item';

    const mainRow = document.createElement('div');
    mainRow.className = 'pmh-main-row';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'pmh-toggle';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Toggle evidence for ' + diag.name);
    toggleBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <polygon points="2,2 8,5 2,8" class="pmh-arrow"/>
    </svg>`;

    const nameEl = document.createElement('div');
    nameEl.className = 'pmh-name';
    nameEl.textContent = diag.name;

    const icdEl = document.createElement('div');
    icdEl.className = 'pmh-icd';
    icdEl.textContent = diag.icd10 || '—';

    const onsetEl = document.createElement('div');
    onsetEl.className = 'pmh-onset';
    onsetEl.textContent = diag.onsetDate ? formatDate(diag.onsetDate) : '—';

    const evidenceDot = document.createElement('span');
    evidenceDot.className = 'pmh-evidence-dot' + (diag.evidenceNotes ? ' has-evidence' : '');
    evidenceDot.title = diag.evidenceNotes ? 'Has objective evidence' : 'No evidence recorded';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'pmh-actions';
    actionsEl.appendChild(makeBtn('Edit', 'btn btn-secondary btn-sm',
      () => openPMHModal(patientId, diag.id)));
    actionsEl.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({
        title: 'Remove Diagnosis',
        message: 'Remove "' + diag.name + '" from medical history?',
        confirmLabel: 'Remove', danger: true,
        onConfirm: () => { deletePatientDiagnosis(diag.id); showToast('Diagnosis removed.'); refreshChart(patientId); },
      });
    }, 'margin-left:6px'));

    mainRow.appendChild(toggleBtn);
    mainRow.appendChild(nameEl);
    mainRow.appendChild(icdEl);
    mainRow.appendChild(onsetEl);
    mainRow.appendChild(evidenceDot);
    mainRow.appendChild(actionsEl);

    // Evidence panel (hidden by default)
    const evidencePanel = document.createElement('div');
    evidencePanel.className = 'pmh-evidence-panel';
    evidencePanel.hidden = true;

    const evLabel = document.createElement('div');
    evLabel.className = 'note-section-label';
    evLabel.textContent = 'Supporting Objective Evidence';

    const evTextarea = document.createElement('textarea');
    evTextarea.className = 'note-textarea';
    evTextarea.style.minHeight = '100px';
    evTextarea.placeholder = 'Lab values, imaging findings, vital sign trends, objective criteria…';
    evTextarea.value = diag.evidenceNotes || '';

    const evFooter = document.createElement('div');
    evFooter.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:8px';

    const evSaveIndicator = document.createElement('span');
    evSaveIndicator.className = 'autosave-indicator';
    evSaveIndicator.style.flex = '1';

    const evSaveBtn = document.createElement('button');
    evSaveBtn.className = 'btn btn-primary btn-sm';
    evSaveBtn.textContent = 'Save Evidence';
    evSaveBtn.onclick = () => {
      savePatientDiagnosis({ id: diag.id, patientId, evidenceNotes: evTextarea.value });
      evSaveIndicator.className = 'autosave-indicator saved';
      evSaveIndicator.textContent = '✓ Saved';
      evidenceDot.className = 'pmh-evidence-dot' + (evTextarea.value ? ' has-evidence' : '');
      setTimeout(() => {
        evSaveIndicator.textContent = '';
        evSaveIndicator.className = 'autosave-indicator';
      }, 2000);
    };

    evFooter.appendChild(evSaveIndicator);
    evFooter.appendChild(evSaveBtn);
    evidencePanel.appendChild(evLabel);
    evidencePanel.appendChild(evTextarea);
    evidencePanel.appendChild(evFooter);

    toggleBtn.addEventListener('click', () => {
      const expanded = !evidencePanel.hidden;
      evidencePanel.hidden = expanded;
      toggleBtn.setAttribute('aria-expanded', String(!expanded));
      item.classList.toggle('pmh-expanded', !expanded);
      if (!expanded) evTextarea.focus();
    });

    [nameEl, icdEl, onsetEl].forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => toggleBtn.click());
    });

    item.appendChild(mainRow);
    item.appendChild(evidencePanel);
    list.appendChild(item);
  });

  card.appendChild(list);
  return card;
}

/* ============================================================
   FAMILY HISTORY
   ============================================================ */
function buildFamilyHistoryCard(patientId) {
  const fh = getFamilyHistory(patientId);
  const editBtn = makeBtn(fh ? 'Edit' : '+ Add', 'btn btn-primary btn-sm',
    () => openFamilyHistoryModal(patientId));
  const card = chartCard('Family History', editBtn);
  card.id = 'section-family-history';

  if (!fh) {
    card.appendChild(buildEmptyState('👨‍👩‍👧', 'No family history recorded',
      'Add known hereditary conditions and family medical history.'));
    return card;
  }

  const FH_FIELDS = [
    ['mother',               'Mother'],
    ['father',               'Father'],
    ['siblings',             'Siblings'],
    ['maternalGrandparents', 'Maternal Grandparents'],
    ['paternalGrandparents', 'Paternal Grandparents'],
    ['other',                'Other'],
    ['notes',                'Notes'],
  ];

  const hasAny = FH_FIELDS.some(([key]) => fh[key]);
  if (!hasAny) {
    card.appendChild(buildEmptyState('👨‍👩‍👧', 'No family history recorded',
      'Add known hereditary conditions and family medical history.'));
    return card;
  }

  const grid = document.createElement('div');
  grid.className = 'family-history-grid';

  FH_FIELDS.forEach(([key, label]) => {
    if (!fh[key]) return;
    const relEl = document.createElement('div');
    relEl.className = 'fh-relation';
    relEl.textContent = label;

    const valEl = document.createElement('div');
    valEl.className = 'fh-value';
    valEl.textContent = fh[key];

    grid.appendChild(relEl);
    grid.appendChild(valEl);
  });

  card.appendChild(grid);
  return card;
}

/* ============================================================
   PAST SURGERIES
   ============================================================ */
function buildSurgeriesCard(patientId) {
  const surgeries = getPatientSurgeries(patientId);
  const addBtn = makeBtn('+ Add Surgery', 'btn btn-primary btn-sm',
    () => openSurgeryModal(patientId, null));
  const card = chartCard('Surgical History', addBtn);
  card.id = 'section-surgeries';

  if (surgeries.length === 0) {
    card.appendChild(buildEmptyState('🏥', 'No surgical history',
      'Add past procedures and surgeries.'));
    return card;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Procedure</th><th>Date</th><th>Hospital / Facility</th><th>Surgeon</th><th>Notes</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  surgeries.forEach(surg => {
    const tr = document.createElement('tr');

    const tdProc = document.createElement('td');
    tdProc.style.fontWeight = '600';
    tdProc.textContent = surg.procedure;

    const tdDate = document.createElement('td');
    tdDate.textContent = surg.date ? formatDate(surg.date) : '—';

    const tdHosp = document.createElement('td');
    tdHosp.textContent = surg.hospital || '—';

    const tdSurg = document.createElement('td');
    tdSurg.textContent = surg.surgeon || '—';

    const tdNotes = document.createElement('td');
    tdNotes.style.maxWidth = '200px';
    tdNotes.style.whiteSpace = 'nowrap';
    tdNotes.style.overflow = 'hidden';
    tdNotes.style.textOverflow = 'ellipsis';
    tdNotes.title = surg.notes || '';
    tdNotes.textContent = surg.notes || '—';

    const tdAct = document.createElement('td');
    tdAct.style.textAlign = 'right';
    tdAct.appendChild(makeBtn('Edit', 'btn btn-secondary btn-sm',
      () => openSurgeryModal(patientId, surg.id)));
    tdAct.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({
        title: 'Remove Surgery',
        message: 'Remove "' + surg.procedure + '" from surgical history?',
        confirmLabel: 'Remove', danger: true,
        onConfirm: () => { deletePatientSurgery(surg.id); showToast('Surgery removed.'); refreshChart(patientId); },
      });
    }, 'margin-left:6px'));

    tr.appendChild(tdProc); tr.appendChild(tdDate); tr.appendChild(tdHosp);
    tr.appendChild(tdSurg); tr.appendChild(tdNotes); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

/* ============================================================
   VITALS TREND
   ============================================================ */
function _vitalClass(key, value) {
  const f = VITALS_FLAGS[key];
  if (!f || !value) return '';
  const v = parseFloat(value);
  if (isNaN(v)) return '';
  if ((f.critLow !== null && v <= f.critLow) || (f.critHigh !== null && v >= f.critHigh)) return 'vt-critical';
  if (v < f.low || v > f.high) return 'vt-abnormal';
  return '';
}

function buildVitalsTrendCard(patientId) {
  const card = chartCard('Vitals Trend', null);
  card.id = 'section-vitals-trend';

  const encs = getEncountersByPatient(patientId);
  const rows = [];
  encs.forEach(enc => {
    const v = getEncounterVitals(enc.id);
    if (v) rows.push({ enc, v });
  });
  rows.sort((a, b) => new Date(b.enc.dateTime) - new Date(a.enc.dateTime));

  if (rows.length === 0) {
    card.appendChild(buildEmptyState('📊', 'No vitals recorded', 'Vitals will appear here as encounters are created.'));
    return card;
  }

  const SHOW = 10;
  const displayed = rows.slice(0, SHOW);

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table vitals-trend-table';
  table.innerHTML = '<thead><tr><th>Date</th><th>BP</th><th>HR</th><th>RR</th><th>Temp °F</th><th>SpO₂ %</th><th>Wt lbs</th></tr></thead>';
  const tbody = document.createElement('tbody');

  displayed.forEach(({ enc, v }) => {
    const tr = document.createElement('tr');
    const td = (text, cls) => {
      const el = document.createElement('td');
      el.textContent = text;
      if (cls) el.className = cls;
      return el;
    };
    const bp = v.bpSystolic && v.bpDiastolic ? v.bpSystolic + '/' + v.bpDiastolic : '—';
    const bpCls = _vitalClass('bpSystolic', v.bpSystolic) || _vitalClass('bpDiastolic', v.bpDiastolic);
    tr.appendChild(td(formatDate(enc.dateTime)));
    tr.appendChild(td(bp, bpCls));
    tr.appendChild(td(v.heartRate || '—', _vitalClass('heartRate', v.heartRate)));
    tr.appendChild(td(v.respiratoryRate || '—', _vitalClass('respRate', v.respiratoryRate)));
    tr.appendChild(td(v.tempF || '—', _vitalClass('tempF', v.tempF)));
    tr.appendChild(td(v.spo2 || '—', _vitalClass('spo2', v.spo2)));
    tr.appendChild(td(v.weightLbs || '—'));
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);

  if (rows.length > SHOW) {
    const more = makeBtn('Show All (' + rows.length + ')', 'btn btn-ghost btn-sm', function() {
      const tbody2 = table.querySelector('tbody');
      rows.slice(SHOW).forEach(({ enc, v }) => {
        const tr = document.createElement('tr');
        const td = (text, cls) => { const el = document.createElement('td'); el.textContent = text; if (cls) el.className = cls; return el; };
        const bp = v.bpSystolic && v.bpDiastolic ? v.bpSystolic + '/' + v.bpDiastolic : '—';
        const bpCls = _vitalClass('bpSystolic', v.bpSystolic) || _vitalClass('bpDiastolic', v.bpDiastolic);
        tr.appendChild(td(formatDate(enc.dateTime)));
        tr.appendChild(td(bp, bpCls));
        tr.appendChild(td(v.heartRate || '—', _vitalClass('heartRate', v.heartRate)));
        tr.appendChild(td(v.respiratoryRate || '—', _vitalClass('respRate', v.respiratoryRate)));
        tr.appendChild(td(v.tempF || '—', _vitalClass('tempF', v.tempF)));
        tr.appendChild(td(v.spo2 || '—', _vitalClass('spo2', v.spo2)));
        tr.appendChild(td(v.weightLbs || '—'));
        tbody2.appendChild(tr);
      });
      this.remove();
    });
    more.style.margin = '8px 14px';
    card.appendChild(more);
  }

  return card;
}

/* ============================================================
   ACTIVE PROBLEM LIST
   ============================================================ */
function buildProblemsCard(patientId) {
  const problems = getActiveProblems(patientId);
  const addBtn = makeBtn('+ Add Problem', 'btn btn-primary btn-sm', () => openProblemModal(patientId, null));
  const card = chartCard('Active Problem List', addBtn);
  card.id = 'section-problems';

  if (problems.length === 0) {
    card.appendChild(buildEmptyState('🩺', 'No active problems', 'Add problems to the patient problem list.'));
    return card;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th style="width:4px;padding:0"></th><th>Priority</th><th>Problem</th><th>ICD-10</th><th>Onset</th><th>Status</th><th>Last Review</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  problems.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'problem-priority-' + (p.priority || 'medium').toLowerCase();

    const tdStrip = document.createElement('td');
    tdStrip.style.cssText = 'width:4px;padding:0';
    const strip = document.createElement('div');
    strip.className = 'problem-priority-strip';
    tdStrip.appendChild(strip);

    const tdPrio = document.createElement('td');
    const prioBadge = document.createElement('span');
    prioBadge.className = 'problem-priority-badge';
    prioBadge.textContent = p.priority || 'Medium';
    tdPrio.appendChild(prioBadge);

    const tdName = document.createElement('td');
    tdName.style.fontWeight = '600';
    tdName.textContent = p.name;

    const tdIcd = document.createElement('td');
    tdIcd.style.fontFamily = 'monospace';
    tdIcd.style.fontSize = '12px';
    tdIcd.textContent = p.icd10 || '—';

    const tdOnset = document.createElement('td');
    tdOnset.textContent = p.onset ? formatDate(p.onset) : '—';

    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge ' + (p.status === 'Active' ? 'badge-active' : p.status === 'Resolved' ? 'badge-completed' : 'badge-closed');
    statusBadge.textContent = p.status || 'Active';
    tdStatus.appendChild(statusBadge);

    const tdReview = document.createElement('td');
    tdReview.textContent = p.lastReviewDate ? formatDate(p.lastReviewDate) : '—';

    const tdAct = document.createElement('td');
    tdAct.style.display = 'flex';
    tdAct.style.gap = '4px';
    tdAct.style.justifyContent = 'flex-end';

    if (p.status !== 'Resolved') {
      const resolveBtn = makeBtn('Resolve', 'btn btn-secondary btn-sm', () => {
        saveActiveProblem({ ...p, status: 'Resolved', lastReviewDate: new Date().toISOString().slice(0,10) });
        showToast('Problem resolved.', 'success');
        refreshChart(patientId);
      });
      tdAct.appendChild(resolveBtn);
    }
    tdAct.appendChild(makeBtn('Edit', 'btn btn-secondary btn-sm', () => openProblemModal(patientId, p.id)));
    tdAct.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm', () => {
      confirmAction({ title: 'Delete Problem', message: 'Remove ' + p.name + ' from the problem list?', confirmLabel: 'Delete', danger: true,
        onConfirm: () => { deleteActiveProblem(p.id); showToast('Problem deleted.'); refreshChart(patientId); } });
    }));

    tr.appendChild(tdStrip); tr.appendChild(tdPrio); tr.appendChild(tdName);
    tr.appendChild(tdIcd); tr.appendChild(tdOnset); tr.appendChild(tdStatus);
    tr.appendChild(tdReview); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

/* ============================================================
   PREVENTIVE CARE
   ============================================================ */
function _calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function buildPreventiveCareCard(patient, patientId) {
  const age = _calcAge(patient.dob);
  const sex = patient.sex;

  const applicable = SCREENING_RULES.filter(r => {
    if (r.sex && r.sex !== sex) return false;
    if (age === null) return false;
    if (r.minAge && age < r.minAge) return false;
    if (r.maxAge && age > r.maxAge) return false;
    return true;
  });

  const records = getScreeningRecords(patientId);
  const card = chartCard('Preventive Care', null);
  card.id = 'section-preventive-care';

  if (applicable.length === 0) {
    card.appendChild(buildEmptyState('🛡', 'No applicable screenings', 'No age/sex-appropriate screenings found.'));
    return card;
  }

  let overdue = 0, dueSoon = 0, upToDate = 0;
  const today = new Date();

  const list = document.createElement('div');

  applicable.forEach(rule => {
    const rec = records.find(r => r.screening === rule.id);
    let statusClass = 'screening-overdue';
    let statusBadge = 'Overdue';
    let nextDue = null;

    if (rec && rec.completedDate) {
      if (rule.intervalYears === null) {
        statusClass = 'screening-ok';
        statusBadge = 'Done (one-time)';
        upToDate++;
      } else {
        nextDue = new Date(rec.completedDate);
        nextDue.setFullYear(nextDue.getFullYear() + rule.intervalYears);
        const daysUntil = Math.round((nextDue - today) / 86400000);
        if (daysUntil > 90) { statusClass = 'screening-ok'; statusBadge = 'Up-to-date'; upToDate++; }
        else if (daysUntil > 0) { statusClass = 'screening-due'; statusBadge = 'Due Soon'; dueSoon++; }
        else { statusClass = 'screening-overdue'; statusBadge = 'Overdue'; overdue++; }
      }
    } else {
      overdue++;
    }

    const row = document.createElement('div');
    row.className = 'screening-row ' + statusClass;

    const lbl = document.createElement('span');
    lbl.className = 'screening-label';
    lbl.textContent = rule.label;

    const badge = document.createElement('span');
    badge.className = 'screening-badge-' + (statusBadge === 'Up-to-date' || statusBadge === 'Done (one-time)' ? 'ok' : statusBadge === 'Due Soon' ? 'due' : 'overdue');
    badge.textContent = statusBadge;

    const dateEl = document.createElement('span');
    dateEl.className = 'screening-date';
    dateEl.textContent = rec && rec.completedDate ? 'Last: ' + formatDate(rec.completedDate) : 'Never done';

    const doneBtn = makeBtn('Mark Done', 'btn btn-secondary btn-sm', () => {
      const today2 = new Date();
      const nextDueDate = rule.intervalYears
        ? new Date(today2.getFullYear() + rule.intervalYears, today2.getMonth(), today2.getDate()).toISOString().slice(0,10)
        : '';
      const existingRec = records.find(r => r.screening === rule.id);
      saveScreeningRecord({
        id:            existingRec ? existingRec.id : undefined,
        patientId,
        screening:     rule.id,
        completedDate: today2.toISOString().slice(0,10),
        nextDue:       nextDueDate,
      });
      showToast(rule.label + ' marked as done.', 'success');
      refreshChart(patientId);
    });

    row.appendChild(lbl);
    row.appendChild(badge);
    row.appendChild(dateEl);
    if (statusClass !== 'screening-ok') row.appendChild(doneBtn);
    list.appendChild(row);
  });

  // Summary in header
  const summary = document.createElement('span');
  summary.className = 'text-muted text-sm';
  summary.textContent = overdue + ' overdue · ' + dueSoon + ' due soon · ' + upToDate + ' up-to-date';
  card.querySelector('.card-header').appendChild(summary);

  card.appendChild(list);
  return card;
}
