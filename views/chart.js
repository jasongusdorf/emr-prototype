/* ============================================================
   views/chart.js — Full patient chart with clinical sections
   ============================================================ */

/* ---------- Module-level state ---------- */
let _currentChartPatientId = null;
let _currentChartTab       = 'overview';
let _notesSortDir          = 'desc';   // 'desc' | 'asc' | 'provider'
let _notesView             = 'grouped'; // 'grouped' | 'timeline'
let _searchOpen            = false;
let _pendingScrollSection  = null;

/* ---------- Constants ---------- */
const VISIT_TYPES = {
  'Outpatient': ['Primary Care', 'Specialty', 'Urgent Care', 'Telehealth'],
  'Inpatient':  ['General Ward', 'ICU', 'Step-Down'],
  'Emergency':  [],
  'Other':      [],
};

const VITALS_FLAGS = {
  bpSystolic:  { low: 90,  high: 140, critLow: 70,  critHigh: 180 },
  bpDiastolic: { low: 60,  high: 90,  critLow: 40,  critHigh: 120 },
  heartRate:   { low: 60,  high: 100, critLow: 40,  critHigh: 150 },
  respRate:    { low: 12,  high: 20,  critLow: 8,   critHigh: 30  },
  tempF:       { low: 96,  high: 100.4, critLow: 94, critHigh: 104 },
  spo2:        { low: 95,  high: 100, critLow: 88,  critHigh: null },
};

const SCREENING_RULES = [
  { id:'bp',         label:'Blood Pressure Screening',   sex:null,     minAge:18, maxAge:null, intervalYears:2   },
  { id:'dm',         label:'Diabetes Screening',          sex:null,     minAge:35, maxAge:70,   intervalYears:3   },
  { id:'colorectal', label:'Colorectal Cancer Screening', sex:null,     minAge:45, maxAge:75,   intervalYears:10  },
  { id:'breast',     label:'Breast Cancer (Mammogram)',   sex:'Female', minAge:40, maxAge:null, intervalYears:2   },
  { id:'cervical',   label:'Cervical Cancer (Pap Smear)', sex:'Female', minAge:21, maxAge:65,   intervalYears:3   },
  { id:'osteo',      label:'Osteoporosis (DEXA Scan)',    sex:'Female', minAge:65, maxAge:null, intervalYears:10  },
  { id:'lung',       label:'Lung Cancer CT (Low-Dose)',   sex:null,     minAge:50, maxAge:80,   intervalYears:1   },
  { id:'aaa',        label:'AAA Ultrasound (one-time)',   sex:'Male',   minAge:65, maxAge:75,   intervalYears:null },
];

const DEGREE_ORDER = ['MD', 'DO', 'NP', 'PA', 'RN', 'LPN', 'MA', 'PharmD'];
const DEGREE_LABEL = {
  MD:     'MD — Physician Notes',
  DO:     'DO — Physician Notes',
  NP:     'NP — Advanced Practice Notes',
  PA:     'PA — Advanced Practice Notes',
  RN:     'RN — Nursing Notes',
  LPN:    'LPN — Nursing Notes',
  MA:     'MA — Medical Assistant Notes',
  PharmD: 'PharmD — Pharmacy Notes',
};

/* ============================================================
   MAIN ENTRY
   ============================================================ */
function renderChart(patientId, tab) {
  clearTimeout(autosaveTimer);

  _currentChartPatientId = patientId;
  _currentChartTab       = tab || 'overview';
  _searchOpen            = false;

  const app = document.getElementById('app');
  app.innerHTML = '';

  const patient = getPatient(patientId);
  if (!patient) {
    app.textContent = 'Patient not found.';
    setTopbar({ title: 'Patient Not Found' });
    return;
  }

  setTopbar({
    title:   patient.lastName + ', ' + patient.firstName,
    meta:    patient.mrn,
    actions: `<a href="#dashboard" class="btn btn-secondary btn-sm no-print">← Patients</a>
              <button class="btn btn-secondary btn-sm no-print" id="btn-print-summary">🖨 Print Summary</button>
              <button class="btn btn-primary btn-sm no-print" id="btn-new-encounter">+ New Encounter</button>`,
  });
  setActiveNav('dashboard');

  // Sticky tab bar
  app.appendChild(buildTabBar(patientId, _currentChartTab));

  // Search panel (hidden by default)
  const searchPanel = buildSearchPanel(patientId);
  app.appendChild(searchPanel);

  // Main content by tab
  if (_currentChartTab === 'outpatient') {
    buildEncounterTabContent(app, patientId, 'Outpatient');
  } else if (_currentChartTab === 'inpatient') {
    buildEncounterTabContent(app, patientId, 'Inpatient');
  } else if (_currentChartTab === 'emergency') {
    buildEncounterTabContent(app, patientId, 'Emergency');
  } else {
    buildOverviewContent(app, patient, patientId);
  }

  // Print Summary button
  const printBtn = document.getElementById('btn-print-summary');
  if (printBtn) printBtn.addEventListener('click', () => printPatientSummary(patientId));

  // New Encounter button
  document.getElementById('btn-new-encounter').addEventListener('click', () => {
    const prefill = _currentChartTab !== 'overview' ? _capitalizeFirst(_currentChartTab) : null;
    openNewEncounterModal(patientId, prefill);
  });

  // Search toggle
  document.getElementById('chart-search-toggle').addEventListener('click', () => {
    _searchOpen = !_searchOpen;
    searchPanel.classList.toggle('hidden', !_searchOpen);
    document.getElementById('chart-search-toggle').classList.toggle('active', _searchOpen);
    if (_searchOpen) {
      const inp = document.getElementById('chart-search-input');
      if (inp) setTimeout(() => inp.focus(), 50);
    }
  });
}

function refreshChart(patientId) {
  const app = document.getElementById('app');
  const savedScroll = app.scrollTop;
  renderChart(patientId, _currentChartTab);
  requestAnimationFrame(() => { app.scrollTop = savedScroll; });
}

function _capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============================================================
   TAB BAR
   ============================================================ */
function buildTabBar(patientId, activeTab) {
  const bar = document.createElement('div');
  bar.className = 'chart-tab-bar';

  const tabs = [
    { key: 'overview',   label: 'Overview' },
    { key: 'outpatient', label: 'Outpatient' },
    { key: 'inpatient',  label: 'Inpatient' },
    { key: 'emergency',  label: 'Emergency' },
  ];

  const allEncs = getEncountersByPatient(patientId);

  tabs.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.className = 'chart-tab' + (activeTab === key ? ' active' : '');
    btn.textContent = label;

    if (key !== 'overview') {
      const visitType = _capitalizeFirst(key);
      const count = allEncs.filter(e => e.visitType === visitType).length;
      if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'tab-count';
        badge.textContent = count;
        btn.appendChild(badge);
      }
    }

    btn.addEventListener('click', () => navigate('#chart/' + patientId + '/' + key));
    bar.appendChild(btn);
  });

  // Spacer
  const spacer = document.createElement('span');
  spacer.className = 'chart-tab-spacer';
  bar.appendChild(spacer);

  // Search button
  const searchBtn = document.createElement('button');
  searchBtn.className = 'chart-search-btn';
  searchBtn.id = 'chart-search-toggle';
  searchBtn.textContent = '🔍 Search Chart';
  bar.appendChild(searchBtn);

  return bar;
}

/* ============================================================
   SEARCH PANEL
   ============================================================ */
function buildSearchPanel(patientId) {
  const panel = document.createElement('div');
  panel.className = 'chart-search-panel hidden';
  panel.id = 'chart-search-panel';

  // Input row
  const row = document.createElement('div');
  row.className = 'chart-search-row';

  const inp = document.createElement('input');
  inp.type = 'search';
  inp.id = 'chart-search-input';
  inp.placeholder = 'Search allergies, diagnoses, medications, notes, orders…';
  inp.setAttribute('autocomplete', 'off');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'chart-search-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close search');
  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
    _searchOpen = false;
    document.getElementById('chart-search-toggle').classList.remove('active');
  });

  row.appendChild(inp);
  row.appendChild(closeBtn);
  panel.appendChild(row);

  const results = document.createElement('div');
  results.className = 'chart-search-results';
  results.id = 'chart-search-results';

  const hint = document.createElement('div');
  hint.className = 'search-hint';
  hint.textContent = 'Type at least 2 characters to search the chart…';
  results.appendChild(hint);

  panel.appendChild(results);

  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    results.innerHTML = '';
    if (q.length < 2) {
      const h = document.createElement('div');
      h.className = 'search-hint';
      h.textContent = 'Type at least 2 characters to search the chart…';
      results.appendChild(h);
      return;
    }
    _renderSearchResults(results, patientId, q);
  });

  return panel;
}

function _renderSearchResults(container, patientId, q) {
  const groups = [];

  // Allergies
  const allergyHits = getPatientAllergies(patientId).filter(a =>
    (a.allergen + ' ' + a.reaction + ' ' + a.type).toLowerCase().includes(q)
  );
  if (allergyHits.length) {
    groups.push({
      label: 'Allergies',
      items: allergyHits.map(a => ({
        name: a.allergen,
        sub:  a.severity + ' · ' + a.reaction,
        go:   () => _scrollToSection('section-allergies', patientId),
      })),
    });
  }

  // PMH
  const pmhHits = getPatientDiagnoses(patientId).filter(d =>
    (d.name + ' ' + (d.icd10 || '') + ' ' + (d.evidenceNotes || '')).toLowerCase().includes(q)
  );
  if (pmhHits.length) {
    groups.push({
      label: 'Past Medical History',
      items: pmhHits.map(d => ({
        name: d.name,
        sub:  d.icd10 || '—',
        go:   () => _scrollToSection('section-pmh', patientId),
      })),
    });
  }

  // Family History (flat fields)
  const fh = getFamilyHistory(patientId);
  if (fh) {
    const fhText = [fh.mother, fh.father, fh.siblings,
                    fh.maternalGrandparents, fh.paternalGrandparents,
                    fh.other, fh.notes].filter(Boolean).join(' ').toLowerCase();
    if (fhText.includes(q)) {
      const matchedFields = [];
      const fieldMap = [
        ['mother', 'Mother'], ['father', 'Father'], ['siblings', 'Siblings'],
        ['maternalGrandparents', 'Maternal Grandparents'],
        ['paternalGrandparents', 'Paternal Grandparents'],
        ['other', 'Other'], ['notes', 'Notes'],
      ];
      fieldMap.forEach(([key, label]) => {
        if (fh[key] && fh[key].toLowerCase().includes(q)) {
          matchedFields.push({ name: label + ': ' + fh[key], sub: '' });
        }
      });
      if (matchedFields.length) {
        groups.push({
          label: 'Family History',
          items: matchedFields.map(f => ({ ...f, go: () => _scrollToSection('section-family-history', patientId) })),
        });
      }
    }
  }

  // Medications
  const medHits = getPatientMedications(patientId).filter(m =>
    (m.name + ' ' + (m.indication || '') + ' ' + (m.prescribedBy || '')).toLowerCase().includes(q)
  );
  if (medHits.length) {
    groups.push({
      label: 'Medications',
      items: medHits.map(m => ({
        name: m.name,
        sub:  [m.dose, m.unit, m.route, m.frequency].filter(Boolean).join(' ') + ' · ' + m.status,
        go:   () => _scrollToSection('section-medications', patientId),
      })),
    });
  }

  // Surgeries
  const surgHits = getPatientSurgeries(patientId).filter(s =>
    (s.procedure + ' ' + (s.surgeon || '') + ' ' + (s.hospital || '') + ' ' + (s.notes || '')).toLowerCase().includes(q)
  );
  if (surgHits.length) {
    groups.push({
      label: 'Surgical History',
      items: surgHits.map(s => ({
        name: s.procedure,
        sub:  [s.date ? formatDate(s.date) : '', s.hospital].filter(Boolean).join(' · '),
        go:   () => _scrollToSection('section-surgeries', patientId),
      })),
    });
  }

  // Encounters
  const encHits = getEncountersByPatient(patientId).filter(enc => {
    const prov = getProvider(enc.providerId);
    const provStr = prov ? prov.firstName + ' ' + prov.lastName : '';
    return (enc.visitType + ' ' + (enc.visitSubtype || '') + ' ' + provStr + ' ' + enc.status).toLowerCase().includes(q);
  });
  if (encHits.length) {
    groups.push({
      label: 'Encounters',
      items: encHits.map(enc => {
        const prov = getProvider(enc.providerId);
        return {
          name: enc.visitType + (enc.visitSubtype ? ' — ' + enc.visitSubtype : ''),
          sub:  formatDateTime(enc.dateTime) + (prov ? ' · ' + prov.lastName : '') + ' · ' + enc.status,
          go:   () => navigate('#encounter/' + enc.id),
        };
      }),
    });
  }

  // Notes
  const noteHits = [];
  getEncountersByPatient(patientId).forEach(enc => {
    const note = getNoteByEncounter(enc.id);
    if (!note) return;
    const text = [(note.chiefComplaint || ''), (note.hpi || ''), (note.ros || ''),
                  (note.assessment || ''), (note.plan || '')].join(' ').toLowerCase();
    if (text.includes(q)) noteHits.push({ enc, note });
  });
  if (noteHits.length) {
    groups.push({
      label: 'Notes',
      items: noteHits.map(({ enc, note }) => ({
        name: note.chiefComplaint || '(no chief complaint)',
        sub:  formatDateTime(enc.dateTime) + ' — ' + enc.visitType + (note.signed ? ' · Signed' : ' · Unsigned'),
        go:   () => navigate('#encounter/' + enc.id),
      })),
    });
  }

  // Orders
  const orderHits = getOrdersByPatient(patientId).filter(ord => {
    const d = ord.detail || {};
    const text = (ord.type + ' ' + (d.drug || '') + ' ' + (d.panel || '') +
                  ' ' + (d.modality || '') + ' ' + (d.bodyPart || '') +
                  ' ' + (d.service || '') + ' ' + (ord.notes || '')).toLowerCase();
    return text.includes(q);
  });
  if (orderHits.length) {
    groups.push({
      label: 'Orders',
      items: orderHits.map(ord => ({
        name: getChartOrderName(ord),
        sub:  ord.type + ' · ' + ord.priority + ' · ' + ord.status,
        go:   () => navigate('#orders/' + ord.encounterId),
      })),
    });
  }

  if (groups.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'search-hint';
    empty.textContent = 'No results found for "' + q + '"';
    container.appendChild(empty);
    return;
  }

  groups.forEach(group => {
    const g = document.createElement('div');
    g.className = 'search-group';

    const lbl = document.createElement('div');
    lbl.className = 'search-group-label';
    lbl.textContent = group.label;
    g.appendChild(lbl);

    group.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'search-result-item';
      el.style.cursor = 'pointer';
      el.setAttribute('tabindex', '0');

      const name = document.createElement('div');
      name.className = 'search-result-name';
      name.textContent = item.name;

      const sub = document.createElement('div');
      sub.className = 'search-result-sub';
      sub.textContent = item.sub;

      const inner = document.createElement('div');
      inner.appendChild(name);
      if (item.sub) inner.appendChild(sub);
      el.appendChild(inner);

      el.addEventListener('click', item.go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') item.go(); });
      g.appendChild(el);
    });

    container.appendChild(g);
  });
}

function _scrollToSection(sectionId, patientId) {
  if (_currentChartTab !== 'overview') {
    _pendingScrollSection = sectionId;
    navigate('#chart/' + patientId + '/overview');
    return;
  }
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   OVERVIEW CONTENT (all sections)
   ============================================================ */
function buildOverviewContent(app, patient, patientId) {
  // 1. Demographics + vitals strip
  app.appendChild(buildDemographicsCard(patient, patientId));

  // 2. Vitals Trend
  app.appendChild(buildVitalsTrendCard(patientId));

  // 3. Active Problem List
  app.appendChild(buildProblemsCard(patientId));

  // 4. Preventive Care
  app.appendChild(buildPreventiveCareCard(patient, patientId));

  // 5. Allergies + Social History (two-col)
  const twoCol1 = document.createElement('div');
  twoCol1.className = 'chart-two-col';
  twoCol1.appendChild(buildAllergiesCard(patientId));
  twoCol1.appendChild(buildSocialHistoryCard(patientId));
  app.appendChild(twoCol1);

  // 6. PMH + Family History
  app.appendChild(buildPMHCard(patientId));
  app.appendChild(buildFamilyHistoryCard(patientId));

  // 7. Medications + Immunizations (two-col)
  const twoCol2 = document.createElement('div');
  twoCol2.className = 'chart-two-col';
  twoCol2.appendChild(buildMedicationsCard(patientId));
  twoCol2.appendChild(buildImmunizationsCard(patientId));
  app.appendChild(twoCol2);

  // 8. Surgeries
  app.appendChild(buildSurgeriesCard(patientId));

  // 9. Lab Results
  app.appendChild(buildLabResultsCard(patientId));

  // 10. Orders
  app.appendChild(buildChartOrdersCard(patientId));

  // 11. Referrals
  app.appendChild(buildReferralsCard(patientId));

  // 12. Encounters
  app.appendChild(buildEncountersCard(patientId));

  // 13. Documents
  app.appendChild(buildDocumentsCard(patientId));

  // 14. Past Notes
  app.appendChild(buildPastNotesCard(patientId));

  // 15. Audit Log (collapsed by default)
  app.appendChild(buildAuditLogCard(patientId));

  // Handle pending scroll from search panel navigation
  if (_pendingScrollSection) {
    const id = _pendingScrollSection;
    _pendingScrollSection = null;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

/* ============================================================
   ENCOUNTER TAB CONTENT (Outpatient / Inpatient / Emergency)
   ============================================================ */
function buildEncounterTabContent(container, patientId, visitType) {
  const allEncs = getEncountersByPatient(patientId)
    .filter(e => e.visitType === visitType)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  const headerWrap = document.createElement('div');
  headerWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:20px 20px 12px';

  const h3 = document.createElement('h3');
  h3.style.cssText = 'margin:0;font-size:16px;font-weight:600;color:var(--text-primary)';
  h3.textContent = visitType + ' Encounters';

  const newBtn = makeBtn('+ New ' + visitType + ' Encounter', 'btn btn-primary btn-sm',
    () => openNewEncounterModal(patientId, visitType));

  headerWrap.appendChild(h3);
  headerWrap.appendChild(newBtn);
  container.appendChild(headerWrap);

  if (allEncs.length === 0) {
    container.appendChild(buildEmptyState('📋',
      'No ' + visitType.toLowerCase() + ' encounters',
      'Create a new ' + visitType.toLowerCase() + ' encounter to get started.'));
    return;
  }

  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginBottom = '20px';

  allEncs.forEach(enc => {
    const note = getNoteByEncounter(enc.id);
    const prov = getProvider(enc.providerId);
    const provStr = prov ? prov.lastName + ', ' + prov.firstName + ' ' + prov.degree : '[Removed Provider]';
    const cc = note && note.chiefComplaint ? note.chiefComplaint : '(chief complaint not documented)';

    const item = document.createElement('div');
    item.className = 'enc-tab-item';
    item.addEventListener('click', () => navigate('#encounter/' + enc.id));

    const dateEl = document.createElement('div');
    dateEl.className = 'et-date';
    dateEl.textContent = formatDateTime(enc.dateTime);

    const visitEl = document.createElement('div');
    visitEl.className = 'et-visit';
    visitEl.textContent = enc.visitType + (enc.visitSubtype ? ' — ' + enc.visitSubtype : '');

    const provEl = document.createElement('div');
    provEl.className = 'et-provider';
    provEl.textContent = provStr;

    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + enc.status.toLowerCase();
    statusBadge.textContent = enc.status;

    const ccEl = document.createElement('div');
    ccEl.className = 'et-cc';
    ccEl.title = cc;
    ccEl.textContent = cc;

    const actionsEl = document.createElement('div');
    actionsEl.className = 'et-actions';

    const noteLabel = note && note.signed ? 'Review / Addend' : 'Edit Note';
    actionsEl.appendChild(makeBtn(noteLabel, 'btn btn-secondary btn-sm',
      e => { e.stopPropagation(); navigate('#encounter/' + enc.id); }));
    actionsEl.appendChild(makeBtn('Orders', 'btn btn-secondary btn-sm',
      e => { e.stopPropagation(); navigate('#orders/' + enc.id); }));
    actionsEl.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm',
      e => { e.stopPropagation(); confirmDeleteEncounter(enc.id, patientId); }));

    item.appendChild(dateEl);
    item.appendChild(visitEl);
    item.appendChild(provEl);
    item.appendChild(statusBadge);
    item.appendChild(ccEl);
    item.appendChild(actionsEl);
    card.appendChild(item);
  });

  container.appendChild(card);
}

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
  [
    ['Date of Birth', formatDate(patient.dob) + (dobDate ? ' (' + ageStr + ')' : '')],
    ['Sex',          patient.sex],
    ['Phone',        patient.phone],
    ['Insurance',    patient.insurance],
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
    item.innerHTML = lbl + ' <strong>' + val + '</strong>';
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
   MEDICATIONS
   ============================================================ */
function buildMedicationsCard(patientId) {
  const meds = getPatientMedications(patientId);
  const addBtn = makeBtn('+ Add Medication', 'btn btn-primary btn-sm',
    () => openMedicationModal(patientId, null));
  const card = chartCard('Medications', addBtn);
  card.id = 'section-medications';

  const current = meds.filter(m => m.status === 'Current');
  const past    = meds.filter(m => m.status === 'Past');

  if (meds.length === 0) {
    card.appendChild(buildEmptyState('💊', 'No medications recorded',
      'Add current and past medications.'));
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
    tdAct.appendChild(makeBtn('Edit', 'btn btn-secondary btn-sm',
      () => openMedicationModal(patientId, med.id)));
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

/* ============================================================
   LAB RESULTS
   ============================================================ */
function buildLabResultsCard(patientId) {
  const results = getLabResults(patientId);
  const addBtn = makeBtn('+ Add Results', 'btn btn-primary btn-sm', () => openLabResultModal(patientId));
  const card = chartCard('Lab Results', addBtn);
  card.id = 'section-labs';

  if (results.length === 0) {
    card.appendChild(buildEmptyState('🧪', 'No lab results', 'Add lab results for this patient.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(result => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.textContent = result.panel;

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(result.resultDate) + (result.resultedBy ? ' · ' + result.resultedBy : '');

    const actions = document.createElement('span');
    actions.style.display = 'flex';
    actions.style.gap = '6px';
    actions.style.alignItems = 'center';

    const toggle = document.createElement('span');
    toggle.textContent = '▶';
    toggle.style.fontSize = '11px';
    toggle.style.color = 'var(--text-muted)';

    const delBtn = makeBtn('Delete', 'btn btn-danger btn-sm', e => {
      e.stopPropagation();
      confirmAction({ title: 'Delete Lab Result', message: 'Delete this ' + result.panel + ' result?', confirmLabel: 'Delete', danger: true,
        onConfirm: () => { deleteLabResult(result.id); showToast('Lab result deleted.'); refreshChart(patientId); } });
    });
    actions.appendChild(delBtn);
    actions.appendChild(toggle);

    hdr.appendChild(title);
    hdr.appendChild(meta);
    hdr.appendChild(actions);
    panel.appendChild(hdr);

    // Collapsible tests table
    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';

    if (result.tests && result.tests.length > 0) {
      const tbl = document.createElement('table');
      tbl.className = 'table';
      tbl.innerHTML = '<thead><tr><th>Test</th><th>Value</th><th>Units</th><th>Reference Range</th><th>Flag</th></tr></thead>';
      const tb = document.createElement('tbody');
      result.tests.forEach(t => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td'); tdName.textContent = t.name;
        const tdVal  = document.createElement('td'); tdVal.textContent = t.value; tdVal.style.fontWeight = '600';
        const tdUnit = document.createElement('td'); tdUnit.textContent = t.unit || '—';
        const tdRef  = document.createElement('td'); tdRef.textContent = t.referenceRange || '—'; tdRef.style.fontSize = '12px';
        const tdFlag = document.createElement('td');
        const flagKey = (t.flag || 'Normal').toLowerCase().replace('-', '-').replace(/\s+/g, '-');
        const flagSpan = document.createElement('span');
        flagSpan.className = 'flag-' + flagKey;
        flagSpan.textContent = t.flag || 'Normal';
        tdFlag.appendChild(flagSpan);
        tr.appendChild(tdName); tr.appendChild(tdVal); tr.appendChild(tdUnit);
        tr.appendChild(tdRef); tr.appendChild(tdFlag);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      detailDiv.appendChild(tbl);
    }
    if (result.notes) {
      const noteEl = document.createElement('div');
      noteEl.style.cssText = 'padding:8px 14px;font-size:12px;color:var(--text-secondary);border-top:1px solid var(--border)';
      noteEl.textContent = result.notes;
      detailDiv.appendChild(noteEl);
    }
    panel.appendChild(detailDiv);

    hdr.addEventListener('click', () => {
      const open = detailDiv.style.display !== 'none';
      detailDiv.style.display = open ? 'none' : 'block';
      toggle.textContent = open ? '▶' : '▼';
    });

    body.appendChild(panel);
  });

  card.appendChild(body);
  return card;
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
  table.innerHTML = '<thead><tr><th>Type</th><th>Order</th><th>Priority</th><th>Status</th><th>Ordered</th><th>Encounter</th><th></th></tr></thead>';
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

    tr.appendChild(tdType); tr.appendChild(tdName); tr.appendChild(tdPrio);
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

/* ============================================================
   ENCOUNTERS CARD (overview — all encounters)
   ============================================================ */
function buildEncountersCard(patientId) {
  const encounters = getEncountersByPatient(patientId)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  const card = chartCard('Encounters');
  card.id = 'section-encounters';

  const countEl = document.createElement('span');
  countEl.className = 'text-muted text-sm';
  countEl.textContent = encounters.length + ' encounter' + (encounters.length !== 1 ? 's' : '');
  card.querySelector('.card-header').appendChild(countEl);

  if (encounters.length === 0) {
    card.appendChild(buildEmptyState('📋', 'No encounters',
      'Create a new encounter to start a visit note.'));
    return card;
  }

  const list = document.createElement('div');

  encounters.forEach(enc => {
    const provider  = getProvider(enc.providerId);
    const provName  = provider
      ? provider.lastName + ', ' + provider.firstName + ' ' + provider.degree
      : '[Removed Provider]';
    const visitLabel = enc.visitType + (enc.visitSubtype ? ' — ' + enc.visitSubtype : '');

    const item = document.createElement('div');
    item.className = 'encounter-list-item';

    const dateEl = document.createElement('div');
    dateEl.className = 'enc-date';
    dateEl.textContent = formatDateTime(enc.dateTime);

    const visitEl = document.createElement('div');
    visitEl.className = 'enc-visit';
    visitEl.textContent = visitLabel;

    const provEl = document.createElement('div');
    provEl.className = 'enc-provider';
    provEl.textContent = provName;

    const badgeEl = document.createElement('span');
    badgeEl.className = 'badge badge-' + enc.status.toLowerCase();
    badgeEl.textContent = enc.status;

    const actionsEl = document.createElement('div');
    actionsEl.className = 'enc-actions';
    actionsEl.appendChild(makeBtn('Note', 'btn btn-secondary btn-sm',
      e => { e.stopPropagation(); navigate('#encounter/' + enc.id); }));
    actionsEl.appendChild(makeBtn('Orders', 'btn btn-secondary btn-sm',
      e => { e.stopPropagation(); navigate('#orders/' + enc.id); }));
    actionsEl.appendChild(makeBtn('Delete', 'btn btn-danger btn-sm',
      e => { e.stopPropagation(); confirmDeleteEncounter(enc.id, patientId); }));

    item.appendChild(dateEl); item.appendChild(visitEl); item.appendChild(provEl);
    item.appendChild(badgeEl); item.appendChild(actionsEl);
    item.addEventListener('click', () => navigate('#encounter/' + enc.id));
    list.appendChild(item);
  });

  card.appendChild(list);
  return card;
}

/* ============================================================
   PAST NOTES (sort/view controls + grouped/timeline)
   ============================================================ */
function buildPastNotesCard(patientId) {
  const encounters = getEncountersByPatient(patientId);

  const noteItems = [];
  encounters.forEach(enc => {
    const note = getNoteByEncounter(enc.id);
    if (!note) return;
    const prov = getProvider(enc.providerId);
    noteItems.push({ enc, note, prov });
  });

  const card = chartCard('Past Notes');
  card.id = 'past-notes-card';

  // Sort / View bar
  const sortBar = document.createElement('div');
  sortBar.className = 'notes-sort-bar';
  sortBar.style.cssText = 'padding:8px 16px;border-bottom:1px solid var(--border)';

  const sortLabel = document.createElement('span');
  sortLabel.className = 'text-muted text-sm';
  sortLabel.textContent = 'Sort:';
  sortBar.appendChild(sortLabel);

  const sortChips = [
    { key: 'desc',     label: 'Newest' },
    { key: 'asc',      label: 'Oldest' },
    { key: 'provider', label: 'By Provider' },
  ];
  sortChips.forEach(({ key, label }) => {
    const chip = document.createElement('button');
    chip.className = 'sort-chip' + (_notesSortDir === key ? ' active' : '');
    chip.textContent = label;
    chip.addEventListener('click', () => {
      _notesSortDir = key;
      const old = document.getElementById('past-notes-card');
      if (old) old.replaceWith(buildPastNotesCard(patientId));
    });
    sortBar.appendChild(chip);
  });

  const divider = document.createElement('span');
  divider.className = 'sort-divider';
  divider.textContent = '|';
  sortBar.appendChild(divider);

  const viewLabel = document.createElement('span');
  viewLabel.className = 'text-muted text-sm';
  viewLabel.textContent = 'View:';
  sortBar.appendChild(viewLabel);

  const viewChips = [
    { key: 'grouped',  label: 'Grouped' },
    { key: 'timeline', label: 'Timeline' },
  ];
  viewChips.forEach(({ key, label }) => {
    const chip = document.createElement('button');
    chip.className = 'sort-chip' + (_notesView === key ? ' active' : '');
    chip.textContent = label;
    chip.addEventListener('click', () => {
      _notesView = key;
      const old = document.getElementById('past-notes-card');
      if (old) old.replaceWith(buildPastNotesCard(patientId));
    });
    sortBar.appendChild(chip);
  });

  card.appendChild(sortBar);

  if (noteItems.length === 0) {
    card.appendChild(buildEmptyState('📝', 'No notes yet',
      'Notes will appear here after encounters are created.'));
    return card;
  }

  // Apply sort
  const sorted = [...noteItems].sort((a, b) => {
    if (_notesSortDir === 'asc') {
      return new Date(a.enc.dateTime) - new Date(b.enc.dateTime);
    }
    if (_notesSortDir === 'provider') {
      const aName = a.prov ? a.prov.lastName : 'ZZZ';
      const bName = b.prov ? b.prov.lastName : 'ZZZ';
      if (aName !== bName) return aName.localeCompare(bName);
      return new Date(b.enc.dateTime) - new Date(a.enc.dateTime);
    }
    // desc (default)
    return new Date(b.enc.dateTime) - new Date(a.enc.dateTime);
  });

  if (_notesView === 'timeline') {
    card.appendChild(_buildNotesTimeline(sorted, patientId));
  } else {
    card.appendChild(_buildNotesGrouped(sorted, patientId));
  }

  return card;
}

function _buildNotesTimeline(items, patientId) {
  const wrap = document.createElement('div');

  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Date</th><th>Visit</th><th>Provider</th><th>Degree</th><th>Chief Complaint</th><th>Status</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  items.forEach(({ enc, note, prov }) => {
    const tr = document.createElement('tr');

    const tdDate = document.createElement('td');
    tdDate.style.whiteSpace = 'nowrap';
    tdDate.textContent = formatDateTime(enc.dateTime);

    const tdVisit = document.createElement('td');
    tdVisit.textContent = enc.visitType + (enc.visitSubtype ? ' — ' + enc.visitSubtype : '');

    const tdProv = document.createElement('td');
    tdProv.textContent = prov ? prov.firstName + ' ' + prov.lastName : '[Removed]';

    const tdDeg = document.createElement('td');
    tdDeg.textContent = prov ? prov.degree : '—';

    const tdCC = document.createElement('td');
    tdCC.style.maxWidth = '200px';
    tdCC.style.overflow = 'hidden';
    tdCC.style.textOverflow = 'ellipsis';
    tdCC.style.whiteSpace = 'nowrap';
    tdCC.title = note.chiefComplaint || '';
    tdCC.textContent = note.chiefComplaint || '(not documented)';

    const tdStatus = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = note.signed ? 'badge badge-signed' : 'badge badge-open';
    statusBadge.textContent = note.signed ? 'Signed' : 'Unsigned';
    tdStatus.appendChild(statusBadge);

    const tdAct = document.createElement('td');
    tdAct.style.textAlign = 'right';
    const viewBtn = document.createElement('button');
    viewBtn.className = 'table-link';
    viewBtn.textContent = note.signed ? 'Review →' : 'Edit →';
    viewBtn.onclick = () => navigate('#encounter/' + enc.id);
    tdAct.appendChild(viewBtn);

    tr.appendChild(tdDate); tr.appendChild(tdVisit); tr.appendChild(tdProv);
    tr.appendChild(tdDeg); tr.appendChild(tdCC); tr.appendChild(tdStatus); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function _buildNotesGrouped(items, patientId) {
  // Group by degree (preserving sort order within each group)
  const byDegree = {};
  const degreeInsertOrder = [];

  items.forEach(item => {
    const degree = item.prov ? item.prov.degree : 'Unknown';
    if (!byDegree[degree]) {
      byDegree[degree] = [];
      degreeInsertOrder.push(degree);
    }
    byDegree[degree].push(item);
  });

  // Use clinical priority order, then any remaining
  const orderedDegrees = [
    ...DEGREE_ORDER.filter(d => byDegree[d]),
    ...degreeInsertOrder.filter(d => !DEGREE_ORDER.includes(d) && byDegree[d]),
  ];

  const sections = document.createElement('div');

  orderedDegrees.forEach(degree => {
    const degItems = byDegree[degree];

    const section = document.createElement('div');
    section.className = 'note-degree-group';

    const groupHeader = document.createElement('div');
    groupHeader.className = 'note-degree-header';
    groupHeader.textContent = DEGREE_LABEL[degree] || (degree + ' Notes');
    section.appendChild(groupHeader);

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = '<thead><tr><th>Date</th><th>Visit</th><th>Provider</th><th>Chief Complaint</th><th>Status</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');

    degItems.forEach(({ enc, note, prov }) => {
      const tr = document.createElement('tr');

      const tdDate = document.createElement('td');
      tdDate.style.whiteSpace = 'nowrap';
      tdDate.textContent = formatDateTime(enc.dateTime);

      const tdVisit = document.createElement('td');
      tdVisit.textContent = enc.visitType + (enc.visitSubtype ? ' — ' + enc.visitSubtype : '');

      const tdProv = document.createElement('td');
      tdProv.textContent = prov ? prov.firstName + ' ' + prov.lastName : '[Removed]';

      const tdCC = document.createElement('td');
      tdCC.style.maxWidth = '220px';
      tdCC.style.overflow = 'hidden';
      tdCC.style.textOverflow = 'ellipsis';
      tdCC.style.whiteSpace = 'nowrap';
      tdCC.title = note.chiefComplaint || '';
      tdCC.textContent = note.chiefComplaint || '(not documented)';

      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = note.signed ? 'badge badge-signed' : 'badge badge-open';
      statusBadge.textContent = note.signed ? 'Signed' : 'Unsigned';
      tdStatus.appendChild(statusBadge);

      const tdAct = document.createElement('td');
      tdAct.style.textAlign = 'right';
      const viewBtn = document.createElement('button');
      viewBtn.className = 'table-link';
      viewBtn.textContent = note.signed ? 'Review →' : 'Edit →';
      viewBtn.onclick = () => navigate('#encounter/' + enc.id);
      tdAct.appendChild(viewBtn);

      tr.appendChild(tdDate); tr.appendChild(tdVisit); tr.appendChild(tdProv);
      tr.appendChild(tdCC); tr.appendChild(tdStatus); tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    sections.appendChild(section);
  });

  return sections;
}

/* ============================================================
   MODALS — Allergy
   ============================================================ */
function openAllergyModal(patientId, id) {
  const existing = id ? getPatientAllergies(patientId).find(a => a.id === id) : null;
  const isEdit = !!existing;

  const severities = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];
  const types = ['Drug', 'Food', 'Environmental', 'Latex', 'Contrast', 'Other'];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Allergen *</label>
      <input class="form-control" id="al-allergen" value="${existing ? esc(existing.allergen) : ''}"
        placeholder="Drug, food, or substance name" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-control" id="al-type">
          ${types.map(t => `<option${existing && existing.type === t ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Severity</label>
        <select class="form-control" id="al-severity">
          ${severities.map(s => `<option${existing && existing.severity === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Reaction / Symptoms *</label>
      <input class="form-control" id="al-reaction" value="${existing ? esc(existing.reaction) : ''}"
        placeholder="e.g. Anaphylaxis, urticaria, GI upset" />
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="al-cancel">Cancel</button>
    <button class="btn btn-primary" id="al-save">${isEdit ? 'Save Changes' : 'Add Allergy'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Allergy' : 'Add Allergy', bodyHTML, footerHTML });

  document.getElementById('al-cancel').addEventListener('click', closeModal);
  document.getElementById('al-save').addEventListener('click', () => {
    const allergen = document.getElementById('al-allergen').value.trim();
    const reaction = document.getElementById('al-reaction').value.trim();
    if (!allergen || !reaction) { showToast('Allergen and reaction are required.', 'error'); return; }
    savePatientAllergy({
      id: id || undefined, patientId, allergen, reaction,
      type:     document.getElementById('al-type').value,
      severity: document.getElementById('al-severity').value,
    });
    closeModal();
    showToast(isEdit ? 'Allergy updated.' : 'Allergy added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Past Medical History
   ============================================================ */
function openPMHModal(patientId, id) {
  const existing = id ? getPatientDiagnoses(patientId).find(d => d.id === id) : null;
  const isEdit = !!existing;

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Diagnosis Name *</label>
      <input class="form-control" id="pmh-name" value="${existing ? esc(existing.name) : ''}"
        placeholder="e.g. Essential Hypertension" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">ICD-10 Code</label>
        <input class="form-control" id="pmh-icd" value="${existing ? esc(existing.icd10) : ''}"
          placeholder="e.g. I10" />
      </div>
      <div class="form-group">
        <label class="form-label">Onset / Diagnosis Date</label>
        <input class="form-control" id="pmh-onset" type="date" value="${existing ? esc(existing.onsetDate) : ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Supporting Objective Evidence</label>
      <textarea class="note-textarea" id="pmh-evidence" style="min-height:100px"
        placeholder="Lab values, imaging findings, diagnostic criteria met…">${existing ? esc(existing.evidenceNotes) : ''}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="pmh-cancel">Cancel</button>
    <button class="btn btn-primary" id="pmh-save">${isEdit ? 'Save Changes' : 'Add Diagnosis'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Diagnosis' : 'Add Diagnosis', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('pmh-cancel').addEventListener('click', closeModal);
  document.getElementById('pmh-save').addEventListener('click', () => {
    const name = document.getElementById('pmh-name').value.trim();
    if (!name) { showToast('Diagnosis name is required.', 'error'); return; }
    savePatientDiagnosis({
      id: id || undefined, patientId, name,
      icd10:         document.getElementById('pmh-icd').value.trim(),
      onsetDate:     document.getElementById('pmh-onset').value,
      evidenceNotes: document.getElementById('pmh-evidence').value,
    });
    closeModal();
    showToast(isEdit ? 'Diagnosis updated.' : 'Diagnosis added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Medication
   ============================================================ */
function openMedicationModal(patientId, id) {
  const existing = id ? getPatientMedications(patientId).find(m => m.id === id) : null;
  const isEdit = !!existing;
  const units  = ['mg', 'mcg', 'g', 'mEq', 'units', 'mL', 'mg/dL', 'Other'];
  const routes = ['PO', 'IV', 'IM', 'SQ', 'SL', 'Topical', 'Inhaled', 'PR', 'NG', 'Other'];
  const freqs  = ['QDay', 'BID', 'TID', 'QID', 'Q4h', 'Q6h', 'Q8h', 'Q12h', 'QWeek', 'PRN', 'Once', 'Other'];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Medication Name *</label>
      <input class="form-control" id="med-name" value="${existing ? esc(existing.name) : ''}"
        placeholder="Generic or brand name" />
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Dose</label>
        <input class="form-control" id="med-dose" value="${existing ? esc(existing.dose) : ''}" placeholder="e.g. 10" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-control" id="med-unit">
          ${units.map(u => `<option${existing && existing.unit === u ? ' selected' : ''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Route</label>
        <select class="form-control" id="med-route">
          ${routes.map(r => `<option${existing && existing.route === r ? ' selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Frequency</label>
        <select class="form-control" id="med-freq">
          ${freqs.map(f => `<option${existing && existing.frequency === f ? ' selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="med-status">
          <option${!existing || existing.status === 'Current' ? ' selected' : ''}>Current</option>
          <option${existing && existing.status === 'Past' ? ' selected' : ''}>Past</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Start Date</label>
        <input class="form-control" id="med-start" type="date" value="${existing ? esc(existing.startDate) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">End Date</label>
        <input class="form-control" id="med-end" type="date" value="${existing ? esc(existing.endDate) : ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Indication</label>
        <input class="form-control" id="med-indication" value="${existing ? esc(existing.indication) : ''}"
          placeholder="Reason / diagnosis" />
      </div>
      <div class="form-group">
        <label class="form-label">Prescribed By</label>
        <input class="form-control" id="med-prescriber" value="${existing ? esc(existing.prescribedBy) : ''}"
          placeholder="Provider name" />
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="med-cancel">Cancel</button>
    <button class="btn btn-primary" id="med-save">${isEdit ? 'Save Changes' : 'Add Medication'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Medication' : 'Add Medication', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('med-cancel').addEventListener('click', closeModal);
  document.getElementById('med-save').addEventListener('click', () => {
    const name = document.getElementById('med-name').value.trim();
    if (!name) { showToast('Medication name is required.', 'error'); return; }
    savePatientMedication({
      id: id || undefined, patientId, name,
      dose:         document.getElementById('med-dose').value.trim(),
      unit:         document.getElementById('med-unit').value,
      route:        document.getElementById('med-route').value,
      frequency:    document.getElementById('med-freq').value,
      status:       document.getElementById('med-status').value,
      startDate:    document.getElementById('med-start').value,
      endDate:      document.getElementById('med-end').value,
      indication:   document.getElementById('med-indication').value.trim(),
      prescribedBy: document.getElementById('med-prescriber').value.trim(),
    });
    closeModal();
    showToast(isEdit ? 'Medication updated.' : 'Medication added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Social History
   ============================================================ */
function openSocialHistoryModal(patientId) {
  const sh = getSocialHistory(patientId) || {};

  const smokingOpts = ['Never smoker', 'Current smoker', 'Former smoker', 'E-cigarette/Vaping', 'Unknown'];
  const maritalOpts = ['Single', 'Married', 'Domestic partnership', 'Divorced', 'Separated', 'Widowed', 'Unknown'];

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Smoking Status</label>
        <select class="form-control" id="sh-smoking">
          ${smokingOpts.map(s => `<option${sh.smokingStatus === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tobacco / Pack-years</label>
        <input class="form-control" id="sh-tobacco" value="${esc(sh.tobaccoUse || '')}"
          placeholder="e.g. 20 pack-years, quit 2010" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Alcohol Use</label>
        <input class="form-control" id="sh-alcohol" value="${esc(sh.alcoholUse || '')}"
          placeholder="e.g. Occasional — 1–2 drinks/week" />
      </div>
      <div class="form-group">
        <label class="form-label">Recreational Substances</label>
        <input class="form-control" id="sh-substances" value="${esc(sh.substanceUse || '')}"
          placeholder="e.g. None, marijuana occasionally" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Occupation</label>
        <input class="form-control" id="sh-occupation" value="${esc(sh.occupation || '')}"
          placeholder="e.g. Retired teacher" />
      </div>
      <div class="form-group">
        <label class="form-label">Marital Status</label>
        <select class="form-control" id="sh-marital">
          ${maritalOpts.map(s => `<option${sh.maritalStatus === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Living Situation</label>
      <input class="form-control" id="sh-living" value="${esc(sh.livingSituation || '')}"
        placeholder="e.g. Lives with spouse, suburban home" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Exercise</label>
        <input class="form-control" id="sh-exercise" value="${esc(sh.exercise || '')}"
          placeholder="e.g. Moderate — 30 min 3×/week" />
      </div>
      <div class="form-group">
        <label class="form-label">Diet</label>
        <input class="form-control" id="sh-diet" value="${esc(sh.diet || '')}"
          placeholder="e.g. Mediterranean, low sodium" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Additional Notes</label>
      <textarea class="note-textarea" id="sh-notes" style="min-height:70px"
        placeholder="Other relevant social/family context…">${esc(sh.notes || '')}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="sh-cancel">Cancel</button>
    <button class="btn btn-primary" id="sh-save">Save Social History</button>
  `;

  openModal({ title: 'Social History', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('sh-cancel').addEventListener('click', closeModal);
  document.getElementById('sh-save').addEventListener('click', () => {
    saveSocialHistory({
      patientId,
      smokingStatus:   document.getElementById('sh-smoking').value,
      tobaccoUse:      document.getElementById('sh-tobacco').value.trim(),
      alcoholUse:      document.getElementById('sh-alcohol').value.trim(),
      substanceUse:    document.getElementById('sh-substances').value.trim(),
      occupation:      document.getElementById('sh-occupation').value.trim(),
      maritalStatus:   document.getElementById('sh-marital').value,
      livingSituation: document.getElementById('sh-living').value.trim(),
      exercise:        document.getElementById('sh-exercise').value.trim(),
      diet:            document.getElementById('sh-diet').value.trim(),
      notes:           document.getElementById('sh-notes').value,
    });
    closeModal();
    showToast('Social history saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Surgery
   ============================================================ */
function openSurgeryModal(patientId, id) {
  const existing = id ? getPatientSurgeries(patientId).find(s => s.id === id) : null;
  const isEdit = !!existing;

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Procedure *</label>
      <input class="form-control" id="su-procedure" value="${existing ? esc(existing.procedure) : ''}"
        placeholder="e.g. Laparoscopic Appendectomy" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-control" id="su-date" type="date" value="${existing ? esc(existing.date) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Hospital / Facility</label>
        <input class="form-control" id="su-hospital" value="${existing ? esc(existing.hospital) : ''}"
          placeholder="Facility name" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Surgeon</label>
      <input class="form-control" id="su-surgeon" value="${existing ? esc(existing.surgeon) : ''}"
        placeholder="e.g. Dr. Smith" />
    </div>
    <div class="form-group">
      <label class="form-label">Operative Notes / Outcome</label>
      <textarea class="note-textarea" id="su-notes" style="min-height:80px"
        placeholder="Findings, complications, outcome…">${existing ? esc(existing.notes) : ''}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="su-cancel">Cancel</button>
    <button class="btn btn-primary" id="su-save">${isEdit ? 'Save Changes' : 'Add Surgery'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Surgery' : 'Add Surgical History', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('su-cancel').addEventListener('click', closeModal);
  document.getElementById('su-save').addEventListener('click', () => {
    const procedure = document.getElementById('su-procedure').value.trim();
    if (!procedure) { showToast('Procedure name is required.', 'error'); return; }
    savePatientSurgery({
      id: id || undefined, patientId, procedure,
      date:     document.getElementById('su-date').value,
      hospital: document.getElementById('su-hospital').value.trim(),
      surgeon:  document.getElementById('su-surgeon').value.trim(),
      notes:    document.getElementById('su-notes').value,
    });
    closeModal();
    showToast(isEdit ? 'Surgery updated.' : 'Surgery added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Family History
   ============================================================ */
function openFamilyHistoryModal(patientId) {
  const fh = getFamilyHistory(patientId) || {};

  const v = key => esc(fh[key] || '');

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Mother</label>
      <input class="form-control" id="fh-mother" value="${v('mother')}"
        placeholder="e.g. HTN, Type 2 DM — deceased age 74" />
    </div>
    <div class="form-group">
      <label class="form-label">Father</label>
      <input class="form-control" id="fh-father" value="${v('father')}"
        placeholder="e.g. CAD, prostate cancer — deceased age 68" />
    </div>
    <div class="form-group">
      <label class="form-label">Siblings</label>
      <input class="form-control" id="fh-siblings" value="${v('siblings')}"
        placeholder="e.g. 1 sister — migraine, hypothyroidism" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Maternal Grandparents</label>
        <input class="form-control" id="fh-maternal" value="${v('maternalGrandparents')}"
          placeholder="e.g. Grandmother: T2DM, CAD" />
      </div>
      <div class="form-group">
        <label class="form-label">Paternal Grandparents</label>
        <input class="form-control" id="fh-paternal" value="${v('paternalGrandparents')}"
          placeholder="e.g. Grandfather: COPD, deceased age 70" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Other</label>
      <input class="form-control" id="fh-other" value="${v('other')}"
        placeholder="Children, extended family, adoption history…" />
    </div>
    <div class="form-group">
      <label class="form-label">Clinical Notes</label>
      <textarea class="note-textarea" id="fh-notes" style="min-height:80px"
        placeholder="Hereditary patterns, genetic counseling notes, risk commentary…">${v('notes')}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="fh-cancel">Cancel</button>
    <button class="btn btn-primary" id="fh-save">Save Family History</button>
  `;

  openModal({ title: 'Family History', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('fh-cancel').addEventListener('click', closeModal);
  document.getElementById('fh-save').addEventListener('click', () => {
    saveFamilyHistory({
      patientId,
      mother:               document.getElementById('fh-mother').value.trim(),
      father:               document.getElementById('fh-father').value.trim(),
      siblings:             document.getElementById('fh-siblings').value.trim(),
      maternalGrandparents: document.getElementById('fh-maternal').value.trim(),
      paternalGrandparents: document.getElementById('fh-paternal').value.trim(),
      other:                document.getElementById('fh-other').value.trim(),
      notes:                document.getElementById('fh-notes').value,
    });
    closeModal();
    showToast('Family history saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — New Encounter
   ============================================================ */
function openNewEncounterModal(patientId, prefillType) {
  const providers = getProviders();
  if (providers.length === 0) {
    openModal({
      title: 'No Providers',
      bodyHTML: `<p style="color:var(--text-secondary);line-height:1.6">
        You must add at least one provider before creating an encounter.
        <a href="#providers" id="goto-providers">Go to Providers →</a></p>`,
      footerHTML: `<button class="btn btn-secondary" id="ne-cancel">Close</button>`,
    });
    document.getElementById('ne-cancel').addEventListener('click', closeModal);
    document.getElementById('goto-providers').addEventListener('click', () => {
      closeModal(); navigate('#providers');
    });
    return;
  }

  const provOpts = providers.map(p =>
    `<option value="${esc(p.id)}">${esc(p.lastName)}, ${esc(p.firstName)} — ${esc(p.degree)}</option>`
  ).join('');

  const effectivePrefill = prefillType && VISIT_TYPES[prefillType] !== undefined ? prefillType : null;
  const typeOpts = Object.keys(VISIT_TYPES).map(t =>
    `<option value="${t}"${t === effectivePrefill ? ' selected' : ''}>${t}</option>`
  ).join('');
  const initialType = effectivePrefill || Object.keys(VISIT_TYPES)[0];
  const initialSubtypes = VISIT_TYPES[initialType] || [];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Provider *</label>
      <select class="form-control" id="ne-provider">${provOpts}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Visit Type *</label>
        <select class="form-control" id="ne-type">${typeOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Subtype</label>
        <select class="form-control" id="ne-subtype"
          ${initialSubtypes.length === 0 ? 'disabled' : ''}>
          ${buildSubtypeOptions(initialSubtypes)}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Date &amp; Time</label>
      <input class="form-control" id="ne-datetime" type="datetime-local"
        value="${toLocalDateTimeValue(new Date())}" />
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="ne-cancel">Cancel</button>
    <button class="btn btn-primary" id="ne-save">Create Encounter</button>
  `;

  openModal({ title: 'New Encounter', bodyHTML, footerHTML });

  document.getElementById('ne-type').addEventListener('change', e => {
    const subtypes = VISIT_TYPES[e.target.value] || [];
    const sub = document.getElementById('ne-subtype');
    sub.innerHTML = buildSubtypeOptions(subtypes);
    sub.disabled = subtypes.length === 0;
  });

  document.getElementById('ne-cancel').addEventListener('click', closeModal);
  document.getElementById('ne-save').addEventListener('click', () => {
    const providerId   = document.getElementById('ne-provider').value;
    const visitType    = document.getElementById('ne-type').value;
    const visitSubtype = document.getElementById('ne-subtype').value;
    const dtVal        = document.getElementById('ne-datetime').value;
    if (!providerId) { showToast('Please select a provider.', 'error'); return; }
    const dateTime = dtVal ? new Date(dtVal).toISOString() : new Date().toISOString();
    const encounter = saveEncounter({ patientId, providerId, visitType, visitSubtype, dateTime, status: 'Open' });
    saveNote({ encounterId: encounter.id });
    closeModal();
    showToast('Encounter created.', 'success');
    navigate('#encounter/' + encounter.id);
  });
}

function buildSubtypeOptions(subtypes) {
  if (!subtypes || subtypes.length === 0) return '<option value="">N/A</option>';
  return subtypes.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
}

/* ============================================================
   MODALS — Edit Patient
   ============================================================ */
function openEditPatientModal(patient, onSave) {
  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">First Name *</label>
        <input class="form-control" id="ep-first" value="${esc(patient.firstName)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Last Name *</label>
        <input class="form-control" id="ep-last" value="${esc(patient.lastName)}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date of Birth</label>
        <input class="form-control" id="ep-dob" type="date" value="${esc(patient.dob)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Sex</label>
        <select class="form-control" id="ep-sex">
          <option value="">— Select —</option>
          ${['Male','Female','Other','Unknown'].map(s =>
            `<option value="${s}"${patient.sex === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="ep-phone" value="${esc(patient.phone)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Insurance</label>
        <input class="form-control" id="ep-insurance" value="${esc(patient.insurance)}" />
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="ep-cancel">Cancel</button>
    <button class="btn btn-primary" id="ep-save">Save</button>
  `;

  openModal({ title: 'Edit Patient', bodyHTML, footerHTML });
  document.getElementById('ep-cancel').addEventListener('click', closeModal);
  document.getElementById('ep-save').addEventListener('click', () => {
    const firstName = document.getElementById('ep-first').value.trim();
    const lastName  = document.getElementById('ep-last').value.trim();
    if (!firstName || !lastName) { showToast('Name is required.', 'error'); return; }
    savePatient({
      id: patient.id, firstName, lastName,
      dob:       document.getElementById('ep-dob').value,
      sex:       document.getElementById('ep-sex').value,
      phone:     document.getElementById('ep-phone').value.trim(),
      insurance: document.getElementById('ep-insurance').value.trim(),
    });
    closeModal();
    showToast('Patient updated.', 'success');
    if (onSave) onSave();
  });
}

/* ============================================================
   CONFIRM — Delete Encounter
   ============================================================ */
function confirmDeleteEncounter(encId, patientId) {
  const enc = getEncounter(encId);
  if (!enc) return;
  confirmAction({
    title: 'Delete Encounter',
    message: 'Delete this encounter? The associated note and all orders will also be removed.',
    confirmLabel: 'Delete', danger: true,
    onConfirm: () => {
      deleteEncounter(encId);
      showToast('Encounter deleted.');
      refreshChart(patientId);
    },
  });
}

/* ============================================================
   MODAL — Problem
   ============================================================ */
function openProblemModal(patientId, id) {
  const existing = id ? getActiveProblems(patientId).find(p => p.id === id) : null;
  const isEdit = !!existing;
  const v = key => esc(existing ? (existing[key] || '') : '');
  const sel = (key, val) => existing && existing[key] === val ? ' selected' : '';

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Problem Name *</label>
      <input class="form-control" id="prb-name" value="${v('name')}" placeholder="e.g. Hypertension" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">ICD-10 Code</label>
        <input class="form-control" id="prb-icd" value="${v('icd10')}" placeholder="e.g. I10" />
      </div>
      <div class="form-group">
        <label class="form-label">Onset Date</label>
        <input class="form-control" id="prb-onset" type="date" value="${v('onset')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="prb-status">
          <option${sel('status','Active')}>Active</option>
          <option${sel('status','Chronic')}>Chronic</option>
          <option${sel('status','Resolved')}>Resolved</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Priority</label>
        <select class="form-control" id="prb-priority">
          <option${sel('priority','High')}>High</option>
          <option${!existing || existing.priority === 'Medium' ? ' selected' : ''}>Medium</option>
          <option${sel('priority','Low')}>Low</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Last Review Date</label>
      <input class="form-control" id="prb-review" type="date" value="${v('lastReviewDate')}" />
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="prb-notes" style="min-height:70px">${v('notes')}</textarea>
    </div>
  `;

  openModal({
    title: isEdit ? 'Edit Problem' : 'Add Problem',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="prb-cancel">Cancel</button>
                 <button class="btn btn-primary" id="prb-save">${isEdit ? 'Save Changes' : 'Add Problem'}</button>`,
  });

  document.getElementById('prb-cancel').addEventListener('click', closeModal);
  document.getElementById('prb-save').addEventListener('click', () => {
    const name = document.getElementById('prb-name').value.trim();
    if (!name) { showToast('Problem name is required.', 'error'); return; }
    saveActiveProblem({
      id: id || undefined, patientId, name,
      icd10:          document.getElementById('prb-icd').value.trim(),
      onset:          document.getElementById('prb-onset').value,
      status:         document.getElementById('prb-status').value,
      priority:       document.getElementById('prb-priority').value,
      lastReviewDate: document.getElementById('prb-review').value,
      notes:          document.getElementById('prb-notes').value,
    });
    closeModal();
    showToast(isEdit ? 'Problem updated.' : 'Problem added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Lab Result
   ============================================================ */
function openLabResultModal(patientId) {
  let testCount = 3;

  function buildTestRows(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div class="form-row" style="margin-bottom:6px" id="test-row-${i}">
        <input class="form-control" id="test-name-${i}" placeholder="Test name" />
        <input class="form-control" id="test-val-${i}" placeholder="Value" />
        <input class="form-control" id="test-unit-${i}" placeholder="Unit" />
        <input class="form-control" id="test-ref-${i}" placeholder="Ref range" />
        <select class="form-control" id="test-flag-${i}">
          <option>Normal</option><option>Low</option><option>High</option>
          <option>Critical-Low</option><option>Critical-High</option>
        </select>
      </div>`;
    }
    return html;
  }

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Panel Name *</label>
        <input class="form-control" id="lr-panel" placeholder="e.g. Basic Metabolic Panel" />
      </div>
      <div class="form-group">
        <label class="form-label">Result Date</label>
        <input class="form-control" id="lr-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Resulted By</label>
      <input class="form-control" id="lr-by" placeholder="Lab name or provider" />
    </div>
    <div class="form-label" style="margin-bottom:6px;font-size:12px;font-weight:600;color:var(--text-secondary)">
      Test Results
    </div>
    <div id="lr-tests">${buildTestRows(testCount)}</div>
    <button class="btn btn-ghost btn-sm" id="lr-add-test" style="margin-top:4px">+ Add Test Row</button>
    <div class="form-group" style="margin-top:12px">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="lr-notes" style="min-height:60px" placeholder="Interpretation notes…"></textarea>
    </div>
  `;

  openModal({
    title: 'Add Lab Results',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="lr-cancel">Cancel</button>
                 <button class="btn btn-primary" id="lr-save">Save Results</button>`,
    size: 'lg',
  });

  document.getElementById('lr-cancel').addEventListener('click', closeModal);
  document.getElementById('lr-add-test').addEventListener('click', () => {
    testCount++;
    const container = document.getElementById('lr-tests');
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '6px';
    row.id = 'test-row-' + (testCount - 1);
    row.innerHTML = `
      <input class="form-control" id="test-name-${testCount-1}" placeholder="Test name" />
      <input class="form-control" id="test-val-${testCount-1}" placeholder="Value" />
      <input class="form-control" id="test-unit-${testCount-1}" placeholder="Unit" />
      <input class="form-control" id="test-ref-${testCount-1}" placeholder="Ref range" />
      <select class="form-control" id="test-flag-${testCount-1}">
        <option>Normal</option><option>Low</option><option>High</option>
        <option>Critical-Low</option><option>Critical-High</option>
      </select>`;
    container.appendChild(row);
  });

  document.getElementById('lr-save').addEventListener('click', () => {
    const panel = document.getElementById('lr-panel').value.trim();
    if (!panel) { showToast('Panel name is required.', 'error'); return; }
    const tests = [];
    for (let i = 0; i < testCount; i++) {
      const name = document.getElementById('test-name-' + i)?.value.trim();
      const val  = document.getElementById('test-val-' + i)?.value.trim();
      if (name && val) {
        tests.push({
          name,
          value: val,
          unit:           document.getElementById('test-unit-' + i)?.value.trim() || '',
          referenceRange: document.getElementById('test-ref-' + i)?.value.trim() || '',
          flag:           document.getElementById('test-flag-' + i)?.value || 'Normal',
        });
      }
    }
    const dateVal = document.getElementById('lr-date').value;
    saveLabResult({
      patientId,
      panel,
      resultDate:  dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      resultedBy:  document.getElementById('lr-by').value.trim(),
      tests,
      notes:       document.getElementById('lr-notes').value,
    });
    closeModal();
    showToast('Lab results saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Immunization
   ============================================================ */
function openImmunizationModal(patientId, id) {
  const existing = id ? getImmunizations(patientId).find(i => i.id === id) : null;
  const isEdit = !!existing;
  const v = key => esc(existing ? (existing[key] || '') : '');

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Vaccine *</label>
      <input class="form-control" id="imm-vaccine" value="${v('vaccine')}" placeholder="e.g. Influenza (IIV4)" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date Administered</label>
        <input class="form-control" id="imm-date" type="date" value="${v('date')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Next Due</label>
        <input class="form-control" id="imm-next" type="date" value="${v('nextDue')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Manufacturer</label>
        <input class="form-control" id="imm-mfr" value="${v('manufacturer')}" placeholder="e.g. Sanofi" />
      </div>
      <div class="form-group">
        <label class="form-label">Lot Number</label>
        <input class="form-control" id="imm-lot" value="${v('lot')}" placeholder="e.g. FL2024-A" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Site</label>
        <input class="form-control" id="imm-site" value="${v('site')}" placeholder="e.g. L deltoid" />
      </div>
      <div class="form-group">
        <label class="form-label">Given By</label>
        <input class="form-control" id="imm-by" value="${v('givenBy')}" placeholder="e.g. Dr. Chen" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="imm-notes" style="min-height:60px">${v('notes')}</textarea>
    </div>
  `;

  openModal({
    title: isEdit ? 'Edit Immunization' : 'Add Immunization',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="imm-cancel">Cancel</button>
                 <button class="btn btn-primary" id="imm-save">${isEdit ? 'Save Changes' : 'Add Immunization'}</button>`,
    size: 'lg',
  });

  document.getElementById('imm-cancel').addEventListener('click', closeModal);
  document.getElementById('imm-save').addEventListener('click', () => {
    const vaccine = document.getElementById('imm-vaccine').value.trim();
    if (!vaccine) { showToast('Vaccine name is required.', 'error'); return; }
    saveImmunization({
      id: id || undefined, patientId, vaccine,
      date:         document.getElementById('imm-date').value,
      nextDue:      document.getElementById('imm-next').value,
      manufacturer: document.getElementById('imm-mfr').value.trim(),
      lot:          document.getElementById('imm-lot').value.trim(),
      site:         document.getElementById('imm-site').value.trim(),
      givenBy:      document.getElementById('imm-by').value.trim(),
      notes:        document.getElementById('imm-notes').value,
    });
    closeModal();
    showToast(isEdit ? 'Immunization updated.' : 'Immunization added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Referral
   ============================================================ */
function openReferralModal(patientId, id) {
  const existing = id ? getReferrals(patientId).find(r => r.id === id) : null;
  const isEdit = !!existing;
  const v = key => esc(existing ? (existing[key] || '') : '');
  const sel = (key, val) => existing && existing[key] === val ? ' selected' : '';

  const specialties = [
    'Cardiology','Neurology','Pulmonology','Gastroenterology','Nephrology',
    'Endocrinology','Infectious Disease','Hematology/Oncology','Rheumatology',
    'Orthopedics','Surgery','Psychiatry','Physical Therapy','Social Work',
    'Ophthalmology','Dermatology','Urology','OB/GYN','Other',
  ];

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Specialty *</label>
        <select class="form-control" id="ref-specialty">
          ${specialties.map(s => `<option${existing && existing.specialty === s ? ' selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Consulting Provider</label>
        <input class="form-control" id="ref-provider" value="${v('providerName')}" placeholder="e.g. Dr. Park" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Reason for Referral *</label>
      <textarea class="note-textarea" id="ref-reason" style="min-height:80px">${v('reason')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Urgency</label>
        <select class="form-control" id="ref-urgency">
          <option${sel('urgency','Routine')}>Routine</option>
          <option${sel('urgency','Urgent')}>Urgent</option>
          <option${sel('urgency','STAT')}>STAT</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="ref-status">
          <option${!existing || existing.status === 'Pending' ? ' selected' : ''}>Pending</option>
          <option${sel('status','Sent')}>Sent</option>
          <option${sel('status','Accepted')}>Accepted</option>
          <option${sel('status','Completed')}>Completed</option>
          <option${sel('status','Declined')}>Declined</option>
          <option${sel('status','No Response')}>No Response</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Referral Date</label>
        <input class="form-control" id="ref-date" type="date" value="${existing && existing.referralDate ? existing.referralDate.slice(0,10) : new Date().toISOString().slice(0,10)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Appointment Date</label>
        <input class="form-control" id="ref-appt" type="date" value="${v('appointmentDate')}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Response Notes</label>
      <textarea class="note-textarea" id="ref-response" style="min-height:60px">${v('responseNotes')}</textarea>
    </div>
  `;

  openModal({
    title: isEdit ? 'Update Referral' : 'Add Referral',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="ref-cancel">Cancel</button>
                 <button class="btn btn-primary" id="ref-save">${isEdit ? 'Save Changes' : 'Add Referral'}</button>`,
    size: 'lg',
  });

  document.getElementById('ref-cancel').addEventListener('click', closeModal);
  document.getElementById('ref-save').addEventListener('click', () => {
    const reason = document.getElementById('ref-reason').value.trim();
    if (!reason) { showToast('Reason is required.', 'error'); return; }
    const dateVal = document.getElementById('ref-date').value;
    saveReferral({
      id: id || undefined, patientId,
      specialty:       document.getElementById('ref-specialty').value,
      providerName:    document.getElementById('ref-provider').value.trim(),
      reason,
      urgency:         document.getElementById('ref-urgency').value,
      status:          document.getElementById('ref-status').value,
      referralDate:    dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      appointmentDate: document.getElementById('ref-appt').value,
      responseNotes:   document.getElementById('ref-response').value,
    });
    closeModal();
    showToast(isEdit ? 'Referral updated.' : 'Referral added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Document Upload
   ============================================================ */
function openDocumentModal(patientId) {
  const categories = ['Clinical', 'Lab', 'Imaging', 'Surgical', 'Referral', 'Insurance', 'Consent', 'Other'];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Document Name *</label>
      <input class="form-control" id="doc-name" placeholder="e.g. MRI Brain Report" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-control" id="doc-cat">
          ${categories.map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Document Type</label>
        <input class="form-control" id="doc-type" placeholder="e.g. PDF, Image" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="note-textarea" id="doc-desc" style="min-height:60px" placeholder="Brief description…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">File Upload (optional, max 1MB for inline storage)</label>
      <input class="form-control" id="doc-file" type="file" />
      <div id="doc-file-warning" style="color:var(--danger);font-size:12px;margin-top:4px;display:none">
        File exceeds 1MB — will be saved as reference only (no inline preview).
      </div>
    </div>
  `;

  openModal({
    title: 'Upload Document',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="doc-cancel">Cancel</button>
                 <button class="btn btn-primary" id="doc-save">Save Document</button>`,
    size: 'lg',
  });

  document.getElementById('doc-file').addEventListener('change', e => {
    const file = e.target.files[0];
    const warn = document.getElementById('doc-file-warning');
    if (file && warn) warn.style.display = file.size > 1048576 ? 'block' : 'none';
  });

  document.getElementById('doc-cancel').addEventListener('click', closeModal);
  document.getElementById('doc-save').addEventListener('click', () => {
    const name = document.getElementById('doc-name').value.trim();
    if (!name) { showToast('Document name is required.', 'error'); return; }
    const file = document.getElementById('doc-file').files[0];

    const saveDoc = (fileData, fileSize, fileType) => {
      saveDocument({
        patientId, name,
        category:    document.getElementById('doc-cat').value,
        type:        fileType || document.getElementById('doc-type').value.trim(),
        description: document.getElementById('doc-desc').value.trim(),
        uploadDate:  new Date().toISOString(),
        fileSize:    fileSize || 0,
        fileData:    fileData || null,
      });
      closeModal();
      showToast('Document saved.', 'success');
      refreshChart(patientId);
    };

    if (file) {
      if (file.size <= 1048576) {
        const reader = new FileReader();
        reader.onload = e2 => saveDoc(e2.target.result, file.size, file.type);
        reader.readAsDataURL(file);
      } else {
        saveDoc(null, file.size, file.type);
      }
    } else {
      saveDoc(null, 0, '');
    }
  });
}

/* ============================================================
   PRINT PATIENT SUMMARY
   ============================================================ */
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
    return '<tr><td style="font-weight:600;padding:4px 8px;width:160px">' + label + '</td><td style="padding:4px 8px">' + (val || '—') + '</td></tr>';
  }

  const html = `<!DOCTYPE html><html><head><title>Patient Summary — ${patient.lastName}, ${patient.firstName}</title>
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
  <h1>${patient.lastName}, ${patient.firstName}</h1>
  <div class="mrn">${patient.mrn} · DOB: ${patient.dob || '—'} (${age} y/o) · ${patient.sex || ''} · ${patient.phone || ''}</div>
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
