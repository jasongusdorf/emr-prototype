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
let _currentOverviewSubTab = 'profile';
let _currentEncSubTab      = 'notes';  // 'profile' | 'notes'

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

const OVERVIEW_SUBTABS = [
  { key: 'profile',       label: 'Profile',        color: 'profile' },
  { key: 'notes',         label: 'Notes',           color: 'notes' },
  { key: 'medications',   label: 'Medications',     color: 'medications' },
  { key: 'results',       label: 'Results',         color: 'results' },
  { key: 'orders',        label: 'Orders',          color: 'orders' },
  { key: 'assessments',   label: 'Assessments',     color: 'notes' },
  { key: 'care-plans',    label: 'Care Plans',      color: 'notes' },
  { key: 'io',            label: 'I/O',             color: 'notes' },
  { key: 'communication', label: 'Communication',   color: 'notes' },
];

const PROFILE_SECTIONS = [
  { id: 'section-demographics',    label: 'Demographics' },
  { id: 'section-appointments',    label: 'Appointments' },
  { id: 'section-vitals-trend',    label: 'Vitals' },
  { id: 'section-social-history',  label: 'Social Hx' },
  { id: 'section-problems',        label: 'Problems' },
  { id: 'section-preventive-care', label: 'Preventive Care' },
  { id: 'section-allergies',       label: 'Allergies' },
  { id: 'section-pmh',             label: 'PMH' },
  { id: 'section-family-history',  label: 'Family Hx' },
  { id: 'section-surgeries',       label: 'Surgeries' },
  { id: 'section-immunizations',   label: 'Immunizations' },
  { id: 'section-encounters',      label: 'Encounters' },
];

/* ============================================================
   MAIN ENTRY
   ============================================================ */
function renderChart(patientId) {
  if (typeof _stopAllAutosaves === 'function') _stopAllAutosaves();

  if (!canViewChart()) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.textContent = 'You do not have permission to view patient charts.';
    setTopbar({ title: 'Access Denied' });
    return;
  }

  // Patient-level authorization: user must be on patient's panel or have admin/attending override
  const patient = getPatient(patientId);
  if (!patient) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.textContent = 'Patient not found.';
    return;
  }
  const sessionUser = getSessionUser();
  const userRole = sessionUser ? (sessionUser.role || '').toLowerCase() : '';
  const isOnPanel = patient.panelProviders && patient.panelProviders.indexOf(sessionUser.id) !== -1;
  const hasOverride = userRole === 'admin' || userRole === 'attending';
  if (!isOnPanel && !hasOverride) {
    const app = document.getElementById('app');
    app.innerHTML = '<div style="padding:40px;text-align:center">' +
      '<h2 style="color:var(--warning,#f59e0b)">Access Restricted</h2>' +
      '<p style="margin:12px 0;color:var(--text-secondary)">You are not on this patient\'s care team. Contact an administrator for access.</p>' +
      '<button class="btn btn-primary" onclick="navigate(\'#dashboard\')">Back to Dashboard</button></div>';
    if (typeof logAudit === 'function') {
      logAudit('ACCESS_DENIED', 'patient', patientId, patientId, 'User ' + sessionUser.id + ' denied access to patient chart');
    }
    return;
  }

  _currentChartPatientId = patientId;
  _currentChartTab       = 'overview';
  _searchOpen            = false;

  const app = document.getElementById('app');
  app.innerHTML = '';
  app.classList.add('chart-view');

  // Create the chart header bar container in #main (above #app) so it never scrolls
  const existingChartHeader = document.getElementById('chart-header-bars');
  if (existingChartHeader) existingChartHeader.remove();
  const chartHeaderBars = document.createElement('div');
  chartHeaderBars.id = 'chart-header-bars';
  const mainEl = document.getElementById('main');
  mainEl.insertBefore(chartHeaderBars, app);

  setTopbar({
    title:   '',
    meta:    '',
    actions: `<a href="#patients" class="btn btn-secondary btn-sm no-print">← Patients</a>
              <button class="btn btn-secondary btn-sm no-print" id="chart-search-toggle"> Search</button>
              <button class="btn btn-secondary btn-sm no-print" id="btn-print-summary"> Print Summary</button>`,
  });
  setActiveNav('dashboard');

  // Patient identity banner — in #chart-header-bars so it never scrolls
  const banner = buildPatientBanner(patientId);
  // Add New Encounter button above the patient name
  const newEncBtn = document.createElement('button');
  newEncBtn.className = 'btn btn-primary btn-sm no-print';
  newEncBtn.id = 'btn-new-encounter';
  newEncBtn.textContent = '+ New Encounter';
  newEncBtn.style.marginRight = 'auto';
  banner.insertBefore(newEncBtn, banner.firstChild);
  chartHeaderBars.appendChild(banner);

  // Search panel (sticky at top, hidden by default)
  const searchPanel = buildSearchPanel(patientId);
  searchPanel.style.position = 'sticky';
  searchPanel.style.top = '0';
  searchPanel.style.zIndex = '40';
  app.appendChild(searchPanel);

  // Always render overview content (no tab bar)
  buildOverviewContent(app, patient, patientId);

  // Print Summary button
  const printBtn = document.getElementById('btn-print-summary');
  if (printBtn) printBtn.addEventListener('click', () => printPatientSummary(patientId));

  // New Encounter button
  document.getElementById('btn-new-encounter').addEventListener('click', () => {
    openNewEncounterModal(patientId);
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
  renderChart(patientId);
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
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', 'Chart sections');

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
    btn.setAttribute('data-omr-color', key);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(activeTab === key));
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

  return bar;
}

/* ============================================================
   SUB-TAB BAR (Overview categories)
   ============================================================ */
function buildSubTabBar(patientId) {
  const bar = document.createElement('div');
  bar.className = 'chart-subtab-bar';
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', 'Overview categories');

  OVERVIEW_SUBTABS.forEach(({ key, label, color }) => {
    const btn = document.createElement('button');
    btn.className = 'chart-subtab' + (_currentOverviewSubTab === key ? ' active' : '');
    btn.setAttribute('data-omr-color', color);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(_currentOverviewSubTab === key));
    btn.textContent = label;
    btn.addEventListener('click', () => {
      _currentOverviewSubTab = key;
      bar.querySelectorAll('.chart-subtab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      _applySubTabFilter();
    });
    bar.appendChild(btn);
  });

  return bar;
}

function _applySubTabFilter() {
  const container = document.getElementById('overview-sections-container');
  if (!container) return;
  const sections = container.querySelectorAll('[data-subtab-category]');
  sections.forEach(el => {
    el.style.display = el.getAttribute('data-subtab-category') === _currentOverviewSubTab ? '' : 'none';
  });
  const nav = document.getElementById('profile-jump-nav');
  if (nav) nav.style.display = _currentOverviewSubTab === 'profile' ? '' : 'none';
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
  closeBtn.textContent = '';
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
    navigate('#chart/' + patientId);
    return;
  }
  // Auto-switch to the correct subtab if the target is hidden
  const el = document.getElementById(sectionId);
  if (el && el.offsetParent === null) {
    const catEl = el.closest('[data-subtab-category]');
    const cat = catEl ? catEl.getAttribute('data-subtab-category') : 'notes';
    _currentOverviewSubTab = cat;
    _applySubTabFilter();
    const bar = document.querySelector('.chart-subtab-bar');
    if (bar) {
      bar.querySelectorAll('.chart-subtab').forEach(b => {
        b.classList.toggle('active', b.textContent === OVERVIEW_SUBTABS.find(s => s.key === cat)?.label);
      });
    }
  }
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   OVERVIEW CONTENT (all sections)
   ============================================================ */
function buildOverviewContent(app, patient, patientId) {
  // Sub-tab bar — goes in #chart-header-bars (above #app), not in #app
  const headerBars = document.getElementById('chart-header-bars');
  if (headerBars) headerBars.appendChild(buildSubTabBar(patientId));

  // Sections container
  const container = document.createElement('div');
  container.id = 'overview-sections-container';

  // Helper to wrap a section in a category div
  function wrap(category, el) {
    const w = document.createElement('div');
    w.setAttribute('data-subtab-category', category);
    w.appendChild(el);
    container.appendChild(w);
  }

  // Profile jump-nav bar — also in #chart-header-bars so it never scrolls
  const profileNav = document.createElement('div');
  profileNav.className = 'profile-jump-nav';
  profileNav.id = 'profile-jump-nav';
  PROFILE_SECTIONS.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.className = 'profile-jump-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    profileNav.appendChild(btn);
  });
  if (headerBars) headerBars.appendChild(profileNav);

  // Profile category
  wrap('profile', buildDemographicsCard(patient, patientId));
  const upcomingApptCard = buildUpcomingAppointmentsCard(patientId);
  if (upcomingApptCard) wrap('profile', upcomingApptCard);
  wrap('profile', buildVitalsTrendCard(patientId));
  wrap('profile', buildSocialHistoryCard(patientId));
  wrap('profile', buildProblemsCard(patientId));
  wrap('profile', buildPreventiveCareCard(patient, patientId));
  wrap('profile', buildAllergiesCard(patientId));
  wrap('profile', buildPMHCard(patientId));
  wrap('profile', buildFamilyHistoryCard(patientId));
  wrap('profile', buildSurgeriesCard(patientId));
  wrap('profile', buildImmunizationsCard(patientId));
  wrap('profile', buildEncountersCard(patientId));

  // AI Review section (if available)
  if (typeof buildAIReviewChartSection === 'function') {
    wrap('profile', buildAIReviewChartSection(patientId));
  }

  // Medications category
  wrap('medications', buildMedicationsSection(patientId));

  // Results category
  wrap('results', buildResultsSection(patientId));

  // Notes category — split-view with inline preview + inline note writer
  const notesHeader = document.createElement('div');
  notesHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
  const notesNewBtn = makeBtn('+ New Note', 'btn btn-primary btn-sm', function() {
    const openEncs = getEncountersByPatient(patientId).filter(function(e) { return e.status === 'Open'; });
    if (openEncs.length === 0) {
      openModal({
        title: 'No Open Encounters',
        bodyHTML: '<p style="color:var(--text-secondary);line-height:1.6">There are no open encounters for this patient. Create an encounter first, then add a note.</p>',
        footerHTML: '<button class="btn btn-secondary" id="nn-close">Close</button><button class="btn btn-primary" id="nn-create">Create Encounter</button>',
      });
      document.getElementById('nn-close').addEventListener('click', closeModal);
      document.getElementById('nn-create').addEventListener('click', function() { closeModal(); openNewEncounterModal(patientId); });
      return;
    }
    renderInlineNoteWriter(patientId, notesContainer);
  });
  notesHeader.appendChild(notesNewBtn);
  wrap('notes', notesHeader);
  const notesContainer = document.createElement('div');
  renderNotePreviewPane(patientId, notesContainer);
  wrap('notes', notesContainer);

  // Orders category — tabbed: Active Orders | Order Sets | E-Prescribe
  wrap('orders', buildOrdersSection(patientId));

  // Assessments tab
  const assessContainer = document.createElement('div');
  assessContainer.id = 'section-assessments';
  buildAssessmentsTabContent(patientId, assessContainer);
  wrap('assessments', assessContainer);

  // Care Plans tab
  const carePlansContainer = document.createElement('div');
  carePlansContainer.id = 'section-care-plans';
  buildCarePlansTabContent(patientId, carePlansContainer);
  wrap('care-plans', carePlansContainer);

  // I/O tab
  const ioContainer = document.createElement('div');
  ioContainer.id = 'section-io';
  buildIOTabContent(patientId, ioContainer);
  wrap('io', ioContainer);

  // Communication category
  wrap('communication', buildCommunicationSection(patientId));

  app.appendChild(container);

  // Apply current sub-tab filter
  _applySubTabFilter();

  // Handle pending scroll from search panel navigation
  if (_pendingScrollSection) {
    const id = _pendingScrollSection;
    _pendingScrollSection = null;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        const catEl = el.closest('[data-subtab-category]');
        const cat = catEl ? catEl.getAttribute('data-subtab-category') : 'notes';
        _currentOverviewSubTab = cat;
        _applySubTabFilter();
        const bar = document.querySelector('.chart-subtab-bar');
        if (bar) {
          bar.querySelectorAll('.chart-subtab').forEach(b => {
            b.classList.toggle('active', b.textContent === (OVERVIEW_SUBTABS.find(s => s.key === cat) || {}).label);
          });
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

/* ============================================================
   ENCOUNTER TAB CONTENT (Outpatient / Inpatient / Emergency)
   ============================================================ */
function buildEncounterTabContent(container, patientId, visitType) {
  // Sub-tab bar: Profile | Notes | Discharge (inpatient only)
  const subBar = document.createElement('div');
  subBar.className = 'chart-subtab-bar';

  const encSubTabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'notes',   label: 'Notes' },
  ];
  // Add discharge tab for inpatient encounters
  if (visitType === 'Inpatient') {
    encSubTabs.push({ key: 'discharge', label: 'Discharge' });
  }

  encSubTabs.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.className = 'chart-subtab' + (_currentEncSubTab === key ? ' active' : '');
    btn.setAttribute('data-omr-color', key === 'profile' ? 'profile' : key === 'discharge' ? 'medications' : 'orders');
    btn.textContent = label;

    // Badge count for notes
    if (key === 'notes') {
      const count = getEncountersByPatient(patientId).filter(e => e.visitType === visitType).length;
      if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'tab-count';
        badge.textContent = count;
        btn.appendChild(badge);
      }
    }

    btn.addEventListener('click', () => {
      _currentEncSubTab = key;
      subBar.querySelectorAll('.chart-subtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const contentArea = document.getElementById('enc-tab-content');
      if (contentArea) {
        contentArea.innerHTML = '';
        if (key === 'profile') {
          _buildEncProfileContent(contentArea, patientId);
        } else if (key === 'discharge') {
          _buildDischargeContent(contentArea, patientId);
        } else {
          _buildEncNotesContent(contentArea, patientId, visitType);
        }
      }
    });
    subBar.appendChild(btn);
  });

  container.appendChild(subBar);

  // Content area
  const contentArea = document.createElement('div');
  contentArea.id = 'enc-tab-content';
  container.appendChild(contentArea);

  if (_currentEncSubTab === 'profile') {
    _buildEncProfileContent(contentArea, patientId);
  } else if (_currentEncSubTab === 'discharge' && visitType === 'Inpatient') {
    _buildDischargeContent(contentArea, patientId);
  } else {
    _buildEncNotesContent(contentArea, patientId, visitType);
  }
}

/* ---------- Encounter tab → Profile sub-tab ---------- */
function _buildEncProfileContent(container, patientId) {
  const patient = getPatient(patientId);
  if (!patient) return;
  container.appendChild(buildDemographicsCard(patient, patientId));
  container.appendChild(buildVitalsTrendCard(patientId));
  container.appendChild(buildAllergiesCard(patientId));
  container.appendChild(buildProblemsCard(patientId));
  container.appendChild(buildMedicationsCard(patientId));
}

/* ---------- Encounter tab → Notes sub-tab ---------- */
function _buildEncNotesContent(container, patientId, visitType) {
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
    container.appendChild(buildEmptyState('',
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

/* ---------- Encounter tab → Discharge sub-tab ---------- */
function _buildDischargeContent(container, patientId) {
  // Find the most recent open inpatient encounter
  const inpatientEncs = getEncountersByPatient(patientId)
    .filter(e => (e.visitType || '').toLowerCase() === 'inpatient' && e.status !== 'Cancelled')
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  if (inpatientEncs.length === 0) {
    container.appendChild(buildEmptyState('', 'No inpatient encounters', 'Create an inpatient encounter to use discharge.'));
    return;
  }

  const enc = inpatientEncs[0];
  const encId = enc.id;
  const existing = typeof getDischargeSummary === 'function' ? getDischargeSummary(encId) : null;
  const isFinalized = existing && existing.status === 'Finalized';
  const patient = getPatient(patientId);
  const provider = getProvider(enc.providerId);

  const card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '20px';

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = 'Discharge Summary';
  hdr.appendChild(title);
  if (isFinalized) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-signed';
    badge.style.marginLeft = '8px';
    badge.textContent = 'Discharged';
    hdr.appendChild(badge);
  } else if (enc.status === 'Open') {
    const badge = document.createElement('span');
    badge.className = 'badge badge-open';
    badge.style.marginLeft = '8px';
    badge.textContent = 'Active Admission';
    hdr.appendChild(badge);
  }
  card.appendChild(hdr);

  // Context
  const ctx = document.createElement('div');
  ctx.style.cssText = 'padding:12px 20px;background:var(--surface-2,#f8fafc);border-bottom:1px solid var(--border);font-size:12px;color:var(--text-secondary);display:flex;gap:16px;flex-wrap:wrap;';
  ctx.innerHTML = '<span><strong>Patient:</strong> ' + esc(patient ? patient.lastName + ', ' + patient.firstName : '') + '</span>' +
    '<span><strong>MRN:</strong> ' + esc(patient ? patient.mrn : '') + '</span>' +
    '<span><strong>Admitted:</strong> ' + formatDateTime(enc.dateTime) + '</span>' +
    '<span><strong>Provider:</strong> ' + esc(provider ? provider.lastName + ', ' + provider.firstName : '') + '</span>';
  card.appendChild(ctx);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.style.padding = '20px';

  const fields = [
    { key: 'hospitalCourse', label: 'Hospital Course', rows: 4 },
    { key: 'dischargeDiagnoses', label: 'Discharge Diagnoses', rows: 2 },
    { key: 'dischargeCondition', label: 'Discharge Condition', type: 'select',
      options: ['', 'Stable', 'Improved', 'Unchanged', 'Declined'] },
    { key: 'dischargeMedications', label: 'Discharge Medications', rows: 3 },
    { key: 'followUpInstructions', label: 'Follow-Up Instructions', rows: 2 },
    { key: 'dietActivity', label: 'Diet & Activity', rows: 2 },
    { key: 'patientInstructions', label: 'Patient Instructions / Education', rows: 3 },
  ];

  fields.forEach(f => {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.style.marginBottom = '14px';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = f.label;
    group.appendChild(label);

    const val = existing ? (existing[f.key] || '') : '';
    if (f.type === 'select') {
      const sel = document.createElement('select');
      sel.className = 'form-control';
      sel.id = 'dc-' + f.key;
      sel.disabled = isFinalized;
      f.options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o || '— Select —';
        if (val === o) opt.selected = true;
        sel.appendChild(opt);
      });
      group.appendChild(sel);
    } else {
      const ta = document.createElement('textarea');
      ta.className = 'form-control';
      ta.id = 'dc-' + f.key;
      ta.rows = f.rows || 3;
      ta.value = val;
      ta.readOnly = isFinalized;
      if (isFinalized) ta.style.background = 'var(--surface-2,#f8fafc)';
      group.appendChild(ta);
    }
    body.appendChild(group);
  });

  // Actions
  if (!isFinalized) {
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;margin-top:16px;';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary';
    saveBtn.textContent = 'Save Draft';
    saveBtn.addEventListener('click', () => {
      _saveDischargeDraft(encId, patientId);
    });

    const finalizeBtn = document.createElement('button');
    finalizeBtn.className = 'btn btn-primary';
    finalizeBtn.style.cssText = 'background:#38a169;border-color:#38a169;';
    finalizeBtn.textContent = 'Finalize & Discharge Patient';
    finalizeBtn.addEventListener('click', () => {
      if (typeof confirmAction === 'function') {
        confirmAction({
          title: 'Finalize Discharge?',
          message: 'This will finalize the discharge summary and close the encounter. This action cannot be undone.',
          confirmLabel: 'Discharge Patient',
          danger: false,
          onConfirm: () => {
            _saveDischargeDraft(encId, patientId, true);
            // Close encounter
            saveEncounter({ id: encId, status: 'Signed', dischargedAt: new Date().toISOString() });
            showToast('Patient discharged successfully', 'success');
            refreshChart(patientId);
          },
        });
      }
    });

    actions.appendChild(saveBtn);
    actions.appendChild(finalizeBtn);
    body.appendChild(actions);
  } else {
    // Show finalized info
    const info = document.createElement('div');
    info.style.cssText = 'margin-top:16px;padding:12px;background:var(--success-light,#f0fff4);border:1px solid var(--success,#38a169);border-radius:6px;font-size:13px;color:var(--success,#38a169);';
    const discharger = existing.dischargedBy ? getProvider(existing.dischargedBy) : null;
    info.innerHTML = '<strong>Discharged</strong> by ' +
      esc(discharger ? discharger.lastName + ', ' + discharger.firstName : 'Unknown') +
      ' on ' + formatDateTime(existing.dischargedAt);
    body.appendChild(info);
  }

  card.appendChild(body);
  container.appendChild(card);
}

function _saveDischargeDraft(encId, patientId, finalize) {
  const user = getSessionUser();
  const data = {
    encounterId: encId,
    patientId: patientId,
    hospitalCourse: (document.getElementById('dc-hospitalCourse') || {}).value || '',
    dischargeDiagnoses: (document.getElementById('dc-dischargeDiagnoses') || {}).value || '',
    dischargeCondition: (document.getElementById('dc-dischargeCondition') || {}).value || '',
    dischargeMedications: (document.getElementById('dc-dischargeMedications') || {}).value || '',
    followUpInstructions: (document.getElementById('dc-followUpInstructions') || {}).value || '',
    dietActivity: (document.getElementById('dc-dietActivity') || {}).value || '',
    patientInstructions: (document.getElementById('dc-patientInstructions') || {}).value || '',
  };
  if (finalize) {
    data.status = 'Finalized';
    data.dischargedBy = user ? user.id : '';
    data.dischargedAt = new Date().toISOString();
  }
  if (typeof saveDischargeSummary === 'function') {
    saveDischargeSummary(data);
    if (!finalize) showToast('Discharge draft saved', 'success');
  }
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
    card.appendChild(buildEmptyState('', 'No allergies recorded',
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
    card.appendChild(buildEmptyState('', 'No social history',
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
    card.appendChild(buildEmptyState('', 'No diagnoses on record',
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
      evSaveIndicator.textContent = ' Saved';
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
    card.appendChild(buildEmptyState('', 'No family history recorded',
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
    card.appendChild(buildEmptyState('', 'No family history recorded',
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
    { key: 'mar',        label: 'MAR' },
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
      case 'mar':        buildMARTabContent(patientId, content); break;
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
    card.appendChild(buildEmptyState('', 'No surgical history',
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
    card.appendChild(buildEmptyState('', 'No vitals recorded', 'Vitals will appear here as encounters are created.'));
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
    card.appendChild(buildEmptyState('', 'No active problems', 'Add problems to the patient problem list.'));
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
    card.appendChild(buildEmptyState('', 'No applicable screenings', 'No age/sex-appropriate screenings found.'));
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
   RESULTS SECTION — subtabs: Labs, Imaging, Micro, Pathology
   ============================================================ */
let _currentResultsSubTab = 'labs';

function buildResultsSection(patientId) {
  const section = document.createElement('div');
  section.className = 'results-section';

  // Subtab bar
  const bar = document.createElement('div');
  bar.className = 'results-subtab-bar';
  const tabs = [
    { key: 'labs',      label: 'Labs' },
    { key: 'imaging',   label: 'Imaging' },
    { key: 'micro',     label: 'Micro' },
    { key: 'pathology', label: 'Pathology' },
  ];
  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'results-subtab' + (_currentResultsSubTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      _currentResultsSubTab = t.key;
      bar.querySelectorAll('.results-subtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderResultsContent();
    });
    bar.appendChild(btn);
  });
  section.appendChild(bar);

  const content = document.createElement('div');
  content.id = 'results-subtab-content';
  section.appendChild(content);

  function renderResultsContent() {
    content.innerHTML = '';
    switch (_currentResultsSubTab) {
      case 'labs':      content.appendChild(buildLabResultsCard(patientId)); break;
      case 'imaging':   content.appendChild(buildImagingResultsCard(patientId)); break;
      case 'micro':     content.appendChild(buildMicroResultsCard(patientId)); break;
      case 'pathology': content.appendChild(buildPathResultsCard(patientId)); break;
    }
  }
  renderResultsContent();
  return section;
}

/* ============================================================
   LAB RESULTS
   ============================================================ */
let _labViewMode = 'test'; // 'panel' | 'test' | 'date'

function _labFlagIcon(flag) {
  const f = (flag || 'Normal').toLowerCase();
  if (f === 'critical-low' || f === 'critical-high') {
    return '<span class="lab-flag-critical" title="' + esc(flag) + '">!</span>';
  }
  if (f === 'low' || f === 'high') {
    return '<span class="lab-flag-abnormal" title="' + esc(flag) + '">!</span>';
  }
  return '';
}

function buildLabResultsCard(patientId) {
  const results = getLabResults(patientId);
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginBottom = '20px';
  card.id = 'section-labs';

  // Header with add button + view toggles
  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const titleEl = document.createElement('span');
  titleEl.className = 'card-title';
  titleEl.textContent = 'Lab Results';
  hdr.appendChild(titleEl);

  const controls = document.createElement('div');
  controls.style.display = 'flex'; controls.style.gap = '6px'; controls.style.alignItems = 'center';

  const viewBtns = document.createElement('div');
  viewBtns.className = 'lab-view-toggle';
  [{ key: 'test', label: 'By Test' }, { key: 'date', label: 'By Date' }, { key: 'panel', label: 'Panel' }].forEach(v => {
    const btn = document.createElement('button');
    btn.className = 'lab-view-btn' + (_labViewMode === v.key ? ' active' : '');
    btn.textContent = v.label;
    btn.addEventListener('click', () => {
      _labViewMode = v.key;
      viewBtns.querySelectorAll('.lab-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLabBody();
    });
    viewBtns.appendChild(btn);
  });
  controls.appendChild(viewBtns);

  const addBtn = makeBtn('+ Add Results', 'btn btn-primary btn-sm', () => openLabResultModal(patientId));
  controls.appendChild(addBtn);
  hdr.appendChild(controls);
  card.appendChild(hdr);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('', 'No lab results', 'Add lab results for this patient.'));
    return card;
  }

  const bodyContainer = document.createElement('div');
  bodyContainer.id = 'lab-results-body';
  card.appendChild(bodyContainer);

  function renderLabBody() {
    bodyContainer.innerHTML = '';
    switch (_labViewMode) {
      case 'panel': _renderLabPanelView(bodyContainer, results, patientId); break;
      case 'test':  _renderLabTestView(bodyContainer, results); break;
      case 'date':  _renderLabDateView(bodyContainer, results, patientId); break;
    }
  }
  renderLabBody();
  return card;
}

/* --- Panel View (original) --- */
function _renderLabPanelView(container, results, patientId) {
  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(result => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.textContent = result.panel;

    // Check if any tests are abnormal/critical for panel-level indicator
    const hasAbnormal = (result.tests || []).some(t => {
      const f = (t.flag || 'Normal').toLowerCase();
      return f !== 'normal';
    });
    if (hasAbnormal) {
      const hasCritical = (result.tests || []).some(t => {
        const f = (t.flag || 'Normal').toLowerCase();
        return f === 'critical-low' || f === 'critical-high';
      });
      const icon = document.createElement('span');
      icon.innerHTML = hasCritical
        ? '<span class="lab-flag-critical" title="Contains critical values">!</span>'
        : '<span class="lab-flag-abnormal" title="Contains abnormal values">!</span>';
      title.appendChild(document.createTextNode(' '));
      title.appendChild(icon);
    }

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(result.resultDate) + (result.resultedBy ? ' · ' + result.resultedBy : '');

    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(toggle);
    panel.appendChild(hdr);

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
        const tdVal = document.createElement('td'); tdVal.style.fontWeight = '600';
        tdVal.innerHTML = esc(t.value) + ' ' + _labFlagIcon(t.flag);
        const tdUnit = document.createElement('td'); tdUnit.textContent = t.unit || '—';
        const tdRef = document.createElement('td'); tdRef.textContent = t.referenceRange || '—'; tdRef.style.fontSize = '12px';
        const tdFlag = document.createElement('td');
        const flagKey = (t.flag || 'Normal').toLowerCase().replace(/\s+/g, '-');
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

  container.appendChild(body);
}

/* --- Organ system classifier for By Test view --- */
const _LAB_SYSTEM_ORDER = [
  'Hematology','Cardiac','Metabolic','Hepatic','Coagulation',
  'Thyroid','Lipids','Inflammatory','Iron Studies','Diabetes',
  'Blood Gas','Nutritional','Tumor Markers','Drug Levels','Urinalysis','Other',
];
function _getLabSystem(name) {
  const n = name.toLowerCase().trim();
  if (/\b(wbc|rbc|hgb|hct|mcv|mch|mchc|rdw|plt|cbc|hemoglobin|hematocrit|platelets?|neutrophils?|lymphocytes?|monocytes?|eosinophils?|basophils?|reticulocytes?|bands?)\b/.test(n)) return 'Hematology';
  if (/\b(troponin|bnp|nt.probnp|pro.bnp|ck.mb|myoglobin)\b/.test(n)) return 'Cardiac';
  if (/\b(sodium|potassium|chloride|bicarbonate|bun|creatinine|glucose|calcium|magnesium|phosphorus|phosphate|egfr|osmolality|anion.gap|bmp|cmp)\b/.test(n) || /^(na|k|cr|cl|co2)$/.test(n)) return 'Metabolic';
  if (/\b(ast|alt|alp|ggt|ldh|bilirubin|tbili|dbili|albumin|alkaline.phosphatase|alk.phos|transaminase|total.protein)\b/.test(n)) return 'Hepatic';
  if (/\b(inr|fibrinogen|d.dimer|anti.xa|thrombin)\b/.test(n) || /^(pt|ptt|aptt)$/.test(n)) return 'Coagulation';
  if (/\b(tsh|thyroid|thyroglobulin)\b/.test(n) || /^(t3|t4|free t3|free t4)$/.test(n)) return 'Thyroid';
  if (/\b(cholesterol|ldl|hdl|triglyceride|vldl)\b/.test(n)) return 'Lipids';
  if (/\b(crp|esr|procalcitonin|c.reactive|sed.rate|interleukin)\b/.test(n)) return 'Inflammatory';
  if (/\b(ferritin|tibc|transferrin|tsat|iron)\b/.test(n)) return 'Iron Studies';
  if (/\b(a1c|hba1c|hemoglobin.a1c|insulin|c.peptide)\b/.test(n)) return 'Diabetes';
  if (/\b(lactate|pco2|po2|hco3|fio2|base.excess)\b/.test(n) || /^ph$/.test(n)) return 'Blood Gas';
  if (/\b(vitamin|folate|b12|zinc|thiamine|copper)\b/.test(n)) return 'Nutritional';
  if (/\b(psa|cea|afp|hcg|ca.125|ca.19|ca.15)\b/.test(n)) return 'Tumor Markers';
  if (/\b(vancomycin|gentamicin|digoxin|lithium|phenytoin|valproic|tacrolimus|cyclosporine|trough)\b/.test(n)) return 'Drug Levels';
  if (/\b(urine|urinalysis|microalbumin|upcr|upci)\b/.test(n) || /^ua$/.test(n)) return 'Urinalysis';
  return 'Other';
}

/* --- By Test View (grouped by test name, organized by organ system) --- */
function _renderLabTestView(container, results) {
  const testMap = {};
  results.forEach(result => {
    (result.tests || []).forEach(t => {
      const key = (t.name || '').trim();
      if (!key) return;
      if (!testMap[key]) testMap[key] = [];
      testMap[key].push({ value: t.value, unit: t.unit, referenceRange: t.referenceRange, flag: t.flag, date: result.resultDate, panel: result.panel });
    });
  });

  const body = document.createElement('div');
  body.style.padding = '8px 16px';

  const testNames = Object.keys(testMap).sort();
  if (testNames.length === 0) {
    body.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">No individual test results to display.</div>';
    container.appendChild(body);
    return;
  }

  // Group by organ system
  const systemGroups = {};
  testNames.forEach(name => {
    const sys = _getLabSystem(name);
    if (!systemGroups[sys]) systemGroups[sys] = [];
    systemGroups[sys].push(name);
  });
  const orderedSystems = _LAB_SYSTEM_ORDER.filter(s => systemGroups[s]);

  orderedSystems.forEach((sys, sysIdx) => {
    // Section header
    const sysHeader = document.createElement('div');
    sysHeader.style.cssText = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);padding:10px 0 4px;' + (sysIdx > 0 ? 'border-top:1px solid var(--border);margin-top:6px;' : '');
    sysHeader.textContent = sys;
    body.appendChild(sysHeader);

    // 2-column grid for tests in this system
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0 16px;';
    body.appendChild(grid);

    systemGroups[sys].forEach(name => {
      const entries = testMap[name].sort((a, b) => new Date(b.date) - new Date(a.date));
      const panel = document.createElement('div');
      panel.className = 'lab-result-panel';

      const hdr = document.createElement('div');
      hdr.className = 'lab-result-panel-header';

      const title = document.createElement('span');
      title.textContent = name;
      title.style.fontSize = '11px'; title.style.fontWeight = '700'; title.style.textTransform = 'uppercase'; title.style.letterSpacing = '0.04em';

      const toggle = document.createElement('span');
      toggle.textContent = '▼'; toggle.style.fontSize = '10px'; toggle.style.color = 'var(--text-muted)';

      hdr.appendChild(title); hdr.appendChild(toggle);
      panel.appendChild(hdr);

      const detailDiv = document.createElement('div');
      detailDiv.style.display = 'block';

      const tbl = document.createElement('table');
      tbl.className = 'table';
      tbl.style.fontSize = '12px';
      const tb = document.createElement('tbody');
      entries.forEach(e => {
        const tr = document.createElement('tr');
        const d = e.date ? (e.date.includes('T') ? new Date(e.date) : new Date(e.date + 'T00:00:00')) : null;
        const compactDate = d && !isNaN(d) ? (d.getMonth()+1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2) : (e.date || '—');
        const tdDate = document.createElement('td'); tdDate.textContent = compactDate; tdDate.style.color = 'var(--text-muted)';
        const tdVal = document.createElement('td'); tdVal.style.fontWeight = '600';
        tdVal.innerHTML = esc(e.value) + ' ' + _labFlagIcon(e.flag);
        const tdUnit = document.createElement('td'); tdUnit.textContent = e.unit || '—'; tdUnit.style.color = 'var(--text-muted)';
        const tdRef = document.createElement('td'); tdRef.textContent = e.referenceRange || '—'; tdRef.style.color = 'var(--text-muted)';
        tr.appendChild(tdDate); tr.appendChild(tdVal); tr.appendChild(tdUnit); tr.appendChild(tdRef);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      detailDiv.appendChild(tbl);
      panel.appendChild(detailDiv);

      hdr.addEventListener('click', () => {
        const open = detailDiv.style.display !== 'none';
        detailDiv.style.display = open ? 'none' : 'block';
        toggle.textContent = open ? '▶' : '▼';
      });

      grid.appendChild(panel);
    });
  });

  container.appendChild(body);
}

/* --- By Date View (grouped by date) --- */
function _renderLabDateView(container, results, patientId) {
  // Group results by date (YYYY-MM-DD)
  const dateMap = {};
  results.forEach(result => {
    const dateKey = formatDate(result.resultDate);
    if (!dateMap[dateKey]) dateMap[dateKey] = [];
    dateMap[dateKey].push(result);
  });

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  const dates = Object.keys(dateMap).sort((a, b) => new Date(b) - new Date(a));

  dates.forEach(dateStr => {
    const dayResults = dateMap[dateStr];

    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(dateStr) + '</strong>';

    const panelList = document.createElement('span');
    panelList.className = 'text-muted text-sm';
    const panelNames = dayResults.map(r => {
      const hasAbnormal = (r.tests || []).some(t => {
        const f = (t.flag || 'Normal').toLowerCase();
        return f !== 'normal';
      });
      const hasCritical = (r.tests || []).some(t => {
        const f = (t.flag || 'Normal').toLowerCase();
        return f === 'critical-low' || f === 'critical-high';
      });
      let icon = '';
      if (hasCritical) icon = ' <span class="lab-flag-critical" title="Critical">!</span>';
      else if (hasAbnormal) icon = ' <span class="lab-flag-abnormal" title="Abnormal">!</span>';
      return esc(r.panel) + icon;
    });
    panelList.innerHTML = panelNames.join(', ');

    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';

    hdr.appendChild(title); hdr.appendChild(panelList); hdr.appendChild(toggle);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';

    dayResults.forEach(result => {
      if (!result.tests || result.tests.length === 0) return;
      const subHdr = document.createElement('div');
      subHdr.style.cssText = 'padding:8px 14px 4px;font-weight:600;font-size:13px;color:var(--text-primary);border-top:1px solid var(--border)';
      subHdr.textContent = result.panel;
      if (result.resultedBy) {
        const by = document.createElement('span');
        by.style.cssText = 'font-weight:400;font-size:11px;color:var(--text-muted);margin-left:8px';
        by.textContent = result.resultedBy;
        subHdr.appendChild(by);
      }
      detailDiv.appendChild(subHdr);

      const tbl = document.createElement('table');
      tbl.className = 'table';
      tbl.innerHTML = '<thead><tr><th>Test</th><th>Value</th><th>Units</th><th>Reference Range</th><th>Flag</th></tr></thead>';
      const tb = document.createElement('tbody');
      result.tests.forEach(t => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td'); tdName.textContent = t.name;
        const tdVal = document.createElement('td'); tdVal.style.fontWeight = '600';
        tdVal.innerHTML = esc(t.value) + ' ' + _labFlagIcon(t.flag);
        const tdUnit = document.createElement('td'); tdUnit.textContent = t.unit || '—';
        const tdRef = document.createElement('td'); tdRef.textContent = t.referenceRange || '—'; tdRef.style.fontSize = '12px';
        const tdFlag = document.createElement('td');
        const flagKey = (t.flag || 'Normal').toLowerCase().replace(/\s+/g, '-');
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
    });
    panel.appendChild(detailDiv);

    hdr.addEventListener('click', () => {
      const open = detailDiv.style.display !== 'none';
      detailDiv.style.display = open ? 'none' : 'block';
      toggle.textContent = open ? '▶' : '▼';
    });

    body.appendChild(panel);
  });

  container.appendChild(body);
}

/* ============================================================
   IMAGING RESULTS
   ============================================================ */
function buildImagingResultsCard(patientId) {
  const results = getImagingResults(patientId);
  const addBtn = makeBtn('+ Add Result', 'btn btn-primary btn-sm', () => openImagingResultModal(patientId));
  const card = chartCard('Imaging Results', addBtn);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('', 'No imaging results', 'Add imaging results for this patient.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(r => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(r.studyType) + '</strong>';
    if (r.modality) title.innerHTML += ' <span class="text-muted text-sm">(' + esc(r.modality) + ')</span>';

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(r.resultDate) + (r.readBy ? ' · ' + r.readBy : '');

    const actions = document.createElement('span');
    actions.style.display = 'flex'; actions.style.gap = '6px'; actions.style.alignItems = 'center';
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + (r.status === 'Final' ? 'signed' : 'open');
    statusBadge.textContent = r.status || 'Final';
    actions.appendChild(statusBadge);
    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';
    actions.appendChild(toggle);

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(actions);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';
    detailDiv.style.padding = '12px 14px';
    detailDiv.style.fontSize = '13px';
    detailDiv.style.lineHeight = '1.6';

    if (r.indication) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Indication:</strong> ' + esc(r.indication) + '</div>';
    if (r.findings) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Findings:</strong><br><span style="white-space:pre-wrap">' + esc(r.findings) + '</span></div>';
    if (r.impression) detailDiv.innerHTML += '<div><strong>Impression:</strong><br><span style="white-space:pre-wrap">' + esc(r.impression) + '</span></div>';

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
   MICROBIOLOGY RESULTS
   ============================================================ */
function buildMicroResultsCard(patientId) {
  const results = getMicroResults(patientId);
  const addBtn = makeBtn('+ Add Result', 'btn btn-primary btn-sm', () => openMicroResultModal(patientId));
  const card = chartCard('Microbiology Results', addBtn);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('', 'No microbiology results', 'Add micro results for this patient.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(r => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(r.cultureSite) + '</strong>';

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(r.collectionDate);

    const actions = document.createElement('span');
    actions.style.display = 'flex'; actions.style.gap = '6px'; actions.style.alignItems = 'center';
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + (r.status === 'Final' ? 'signed' : 'open');
    statusBadge.textContent = r.status || 'Final';
    actions.appendChild(statusBadge);
    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';
    actions.appendChild(toggle);

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(actions);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';
    detailDiv.style.padding = '12px 14px';
    detailDiv.style.fontSize = '13px';
    detailDiv.style.lineHeight = '1.6';

    if (r.gramStain) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Gram Stain:</strong> ' + esc(r.gramStain) + '</div>';
    if (r.organism) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Organism:</strong> ' + esc(r.organism) + '</div>';
    if (r.sensitivities && r.sensitivities.length > 0) {
      let sensHtml = '<div style="margin-bottom:8px"><strong>Sensitivities:</strong><table class="table" style="margin-top:4px"><thead><tr><th>Antibiotic</th><th>Result</th><th>MIC</th></tr></thead><tbody>';
      r.sensitivities.forEach(s => {
        const cls = s.result === 'Sensitive' ? 'flag-normal' : s.result === 'Resistant' ? 'flag-high' : 'flag-low';
        sensHtml += '<tr><td>' + esc(s.antibiotic) + '</td><td><span class="' + cls + '">' + esc(s.result) + '</span></td><td>' + esc(s.mic || '—') + '</td></tr>';
      });
      sensHtml += '</tbody></table></div>';
      detailDiv.innerHTML += sensHtml;
    }
    if (r.notes) detailDiv.innerHTML += '<div><strong>Notes:</strong> ' + esc(r.notes) + '</div>';

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
   PATHOLOGY RESULTS
   ============================================================ */
function buildPathResultsCard(patientId) {
  const results = getPathResults(patientId);
  const addBtn = makeBtn('+ Add Result', 'btn btn-primary btn-sm', () => openPathResultModal(patientId));
  const card = chartCard('Pathology Results', addBtn);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('', 'No pathology results', 'Add pathology results for this patient.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(r => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(r.specimenType) + '</strong>';
    if (r.specimenSite) title.innerHTML += ' <span class="text-muted text-sm">(' + esc(r.specimenSite) + ')</span>';

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(r.resultDate) + (r.pathologist ? ' · ' + r.pathologist : '');

    const actions = document.createElement('span');
    actions.style.display = 'flex'; actions.style.gap = '6px'; actions.style.alignItems = 'center';
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + (r.status === 'Final' ? 'signed' : 'open');
    statusBadge.textContent = r.status || 'Final';
    actions.appendChild(statusBadge);
    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';
    actions.appendChild(toggle);

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(actions);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';
    detailDiv.style.padding = '12px 14px';
    detailDiv.style.fontSize = '13px';
    detailDiv.style.lineHeight = '1.6';

    if (r.grossDesc) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Gross Description:</strong><br><span style="white-space:pre-wrap">' + esc(r.grossDesc) + '</span></div>';
    if (r.microDesc) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Microscopic Description:</strong><br><span style="white-space:pre-wrap">' + esc(r.microDesc) + '</span></div>';
    if (r.diagnosis) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Diagnosis:</strong><br><span style="white-space:pre-wrap">' + esc(r.diagnosis) + '</span></div>';
    if (r.notes) detailDiv.innerHTML += '<div><strong>Notes:</strong> ' + esc(r.notes) + '</div>';

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
    card.appendChild(buildEmptyState('', 'No immunizations recorded', 'Add vaccine records for this patient.'));
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
    card.appendChild(buildEmptyState('', 'No referrals', 'Add referrals to specialty care.'));
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
    card.appendChild(buildEmptyState('', 'No documents', 'Upload clinical documents for this patient.'));
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
    card.appendChild(buildEmptyState('', 'No orders placed',
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
    card.appendChild(buildEmptyState('', 'No encounters',
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
  const allProviders = getProviders();

  const noteItems = [];
  encounters.forEach(enc => {
    const note = getNoteByEncounter(enc.id);
    if (!note) return;
    const prov = getProvider(enc.providerId);
    noteItems.push({ enc, note, prov });
  });

  const newNoteBtn = makeBtn('+ New Note', 'btn btn-primary btn-sm', () => openNewNoteForPatient(patientId));
  const card = chartCard('Notes', newNoteBtn);
  card.id = 'past-notes-card';

  // Filter toolbar
  const filterBar = document.createElement('div');
  filterBar.className = 'notes-filter-bar';

  const searchInp = document.createElement('input');
  searchInp.type = 'search';
  searchInp.className = 'form-control';
  searchInp.placeholder = 'Search notes…';
  searchInp.style.flex = '1';
  searchInp.style.minWidth = '150px';
  filterBar.appendChild(searchInp);

  const dateFrom = document.createElement('input');
  dateFrom.type = 'date';
  dateFrom.className = 'form-control';
  dateFrom.title = 'From date';
  dateFrom.style.width = '140px';
  filterBar.appendChild(dateFrom);

  const dateTo = document.createElement('input');
  dateTo.type = 'date';
  dateTo.className = 'form-control';
  dateTo.title = 'To date';
  dateTo.style.width = '140px';
  filterBar.appendChild(dateTo);

  const provSelect = document.createElement('select');
  provSelect.className = 'form-control';
  provSelect.style.width = '160px';
  provSelect.innerHTML = '<option value="">All Providers</option>';
  const provIds = new Set();
  noteItems.forEach(ni => { if (ni.prov) provIds.add(ni.prov.id); });
  allProviders.filter(p => provIds.has(p.id)).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.lastName + ', ' + p.firstName;
    provSelect.appendChild(opt);
  });
  filterBar.appendChild(provSelect);

  const signedSelect = document.createElement('select');
  signedSelect.className = 'form-control';
  signedSelect.style.width = '130px';
  signedSelect.innerHTML = '<option value="">All Status</option><option value="signed">Signed</option><option value="unsigned">Unsigned</option>';
  filterBar.appendChild(signedSelect);

  card.appendChild(filterBar);

  // Cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'note-cards-container';
  cardsContainer.id = 'note-cards-container';
  card.appendChild(cardsContainer);

  function renderNoteCards() {
    cardsContainer.innerHTML = '';
    const query = searchInp.value.toLowerCase().trim();
    const from = dateFrom.value ? new Date(dateFrom.value + 'T00:00:00') : null;
    const to = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;
    const provFilter = provSelect.value;
    const signedFilter = signedSelect.value;

    let filtered = noteItems.filter(({ enc, note, prov }) => {
      if (query) {
        const noteText = (note.noteBody || note.chiefComplaint || '').toLowerCase();
        const provName = prov ? (prov.firstName + ' ' + prov.lastName).toLowerCase() : '';
        if (!noteText.includes(query) && !provName.includes(query) && !enc.visitType.toLowerCase().includes(query)) return false;
      }
      if (from && new Date(enc.dateTime) < from) return false;
      if (to && new Date(enc.dateTime) > to) return false;
      if (provFilter && (!prov || prov.id !== provFilter)) return false;
      if (signedFilter === 'signed' && !note.signed) return false;
      if (signedFilter === 'unsigned' && note.signed) return false;
      return true;
    });

    // Sort: pinned first, then newest
    filtered.sort((a, b) => {
      if (a.note.pinned && !b.note.pinned) return -1;
      if (!a.note.pinned && b.note.pinned) return 1;
      return new Date(b.enc.dateTime) - new Date(a.enc.dateTime);
    });

    if (filtered.length === 0) {
      cardsContainer.appendChild(buildEmptyState('', 'No notes match', 'Try adjusting your filters.'));
      return;
    }

    const list = document.createElement('div');
    list.className = 'note-list';

    filtered.forEach(({ enc, note, prov }) => {
      const row = document.createElement('div');
      row.className = 'note-list-row' + (note.pinned ? ' pinned' : '');

      const d = enc.dateTime ? new Date(enc.dateTime) : null;
      const compactDate = d && !isNaN(d)
        ? (d.getMonth()+1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2)
        : '—';

      const dateEl = document.createElement('span');
      dateEl.className = 'note-list-date';
      dateEl.textContent = compactDate;

      const titleEl = document.createElement('span');
      titleEl.className = 'note-list-title';
      titleEl.textContent = enc.visitSubtype || enc.visitType || '—';

      const locationEl = document.createElement('span');
      locationEl.className = 'note-list-meta';
      locationEl.textContent = enc.visitType || '—';

      const specialtyEl = document.createElement('span');
      specialtyEl.className = 'note-list-meta';
      specialtyEl.textContent = (prov && prov.specialty) ? prov.specialty : '—';

      const statusBadge = document.createElement('span');
      statusBadge.className = note.signed ? 'badge badge-signed' : 'badge badge-open';
      statusBadge.textContent = note.signed ? 'Signed' : 'Unsigned';

      row.appendChild(dateEl);
      row.appendChild(titleEl);
      row.appendChild(locationEl);
      row.appendChild(specialtyEl);
      row.appendChild(statusBadge);

      row.addEventListener('click', () => openNoteReadModal(enc, note, prov));
      list.appendChild(row);
    });

    cardsContainer.appendChild(list);
  }

  // Attach filter listeners
  searchInp.addEventListener('input', renderNoteCards);
  dateFrom.addEventListener('change', renderNoteCards);
  dateTo.addEventListener('change', renderNoteCards);
  provSelect.addEventListener('change', renderNoteCards);
  signedSelect.addEventListener('change', renderNoteCards);

  renderNoteCards();
  return card;
}

/* ============================================================
   NOTE READER MODAL
   ============================================================ */
function openNoteReadModal(enc, note, prov) {
  const d = enc.dateTime ? new Date(enc.dateTime) : null;
  const dateStr = d && !isNaN(d)
    ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';
  const timeStr = d && !isNaN(d)
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const provName = prov
    ? prov.firstName + ' ' + prov.lastName + (prov.degree ? ', ' + prov.degree : '')
    : '[Removed Provider]';
  const noteType = enc.visitSubtype || enc.visitType || 'Clinical Note';

  const sections = [];
  if (note.chiefComplaint) sections.push({ label: 'Chief Complaint',          text: note.chiefComplaint });
  if (note.hpi)            sections.push({ label: 'History of Present Illness', text: note.hpi });
  if (note.ros)            sections.push({ label: 'Review of Systems',          text: note.ros });
  if (note.physicalExam)   sections.push({ label: 'Physical Examination',       text: note.physicalExam });
  if (note.assessment)     sections.push({ label: 'Assessment',                 text: note.assessment });
  if (note.plan)           sections.push({ label: 'Plan',                       text: note.plan });
  if (note.noteBody && sections.length === 0) sections.push({ label: 'Note', text: note.noteBody });

  const sectionsHTML = sections.length > 0
    ? sections.map(s =>
        '<div class="note-reader-section">' +
          '<div class="note-reader-section-label">' + esc(s.label) + '</div>' +
          '<div class="note-reader-section-body">' + esc(s.text) + '</div>' +
        '</div>'
      ).join('')
    : '<div class="note-reader-empty">No note content documented.</div>';

  let signatureHTML;
  if (note.signed) {
    const sa = note.signedAt ? new Date(note.signedAt) : null;
    const saStr = sa && !isNaN(sa)
      ? sa.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' at ' + sa.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';
    signatureHTML =
      '<div class="note-reader-signature">' +
        '<span class="note-reader-sig-check">&#10003;</span>' +
        ' Electronically signed by <strong>' + esc(note.signedBy || provName) + '</strong>' +
        (saStr ? ' &mdash; ' + esc(saStr) : '') +
      '</div>';
  } else {
    signatureHTML = '<div class="note-reader-unsigned">&#9888; Unsigned &mdash; not finalized</div>';
  }

  let addendaHTML = '';
  if (note.addenda && note.addenda.length > 0) {
    addendaHTML = '<div class="note-reader-addenda">' +
      note.addenda.map(a =>
        '<div class="note-reader-addendum">' +
          '<div class="note-reader-addendum-hdr">Addendum' +
            (a.author ? ' &mdash; ' + esc(a.author) : '') +
            (a.date ? ' &mdash; ' + esc(a.date) : '') +
          '</div>' +
          '<div class="note-reader-section-body">' + esc(a.text || '') + '</div>' +
        '</div>'
      ).join('') +
    '</div>';
  }

  const metaParts = [
    esc(dateStr) + (timeStr ? ' &middot; ' + esc(timeStr) : ''),
    esc(provName),
    prov && prov.specialty ? esc(prov.specialty) : null,
    enc.visitType ? esc(enc.visitType) : null,
  ].filter(Boolean);

  const bodyHTML =
    '<div class="note-reader">' +
      '<div class="note-reader-header">' +
        '<div class="note-reader-title">' + esc(noteType) + '</div>' +
        '<div class="note-reader-meta">' + metaParts.join(' &nbsp;&middot;&nbsp; ') + '</div>' +
      '</div>' +
      '<div class="note-reader-body">' + sectionsHTML + '</div>' +
      signatureHTML +
      addendaHTML +
    '</div>';

  const footerHTML =
    '<button class="btn btn-secondary" id="note-reader-close">Close</button>' +
    '<button class="btn btn-primary" id="note-reader-edit">Edit Note</button>';

  openModal({ title: '', bodyHTML, footerHTML, size: 'lg' });
  document.getElementById('note-reader-close').addEventListener('click', closeModal);
  document.getElementById('note-reader-edit').addEventListener('click', () => {
    closeModal();
    navigate('#encounter/' + enc.id);
  });
}

/* ============================================================
   MODALS — Allergy
   ============================================================ */
function openAllergyModal(patientId, id) {
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
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
function openMedicationModal(patientId, id, defaultSetting) {
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
  const existing = id ? getPatientMedications(patientId).find(m => m.id === id) : null;
  const isEdit = !!existing;
  const curSetting = existing ? (existing.setting || 'Outpatient') : (defaultSetting || 'Outpatient');
  const units  = ['mg', 'mcg', 'g', 'mEq', 'units', 'mL', 'mg/dL', 'Other'];
  const routes = ['PO', 'IV', 'IM', 'SQ', 'SL', 'Topical', 'Inhaled', 'PR', 'NG', 'Other'];
  const freqs  = ['QDay', 'BID', 'TID', 'QID', 'Q4h', 'Q6h', 'Q8h', 'Q12h', 'QWeek', 'PRN', 'Once', 'Other'];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Medication Name *</label>
      <div class="med-autocomplete-container">
        <input class="form-control" id="med-name" value="${existing ? esc(existing.name) : ''}"
          placeholder="Generic or brand name" />
      </div>
    </div>
    <div id="chart-med-dose-pills-container"></div>
    <div class="form-row-3" id="chart-med-dose-row">
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
      <div class="form-group">
        <label class="form-label">Setting</label>
        <select class="form-control" id="med-setting">
          <option value="Outpatient"${curSetting === 'Outpatient' ? ' selected' : ''}>Outpatient</option>
          <option value="Inpatient"${curSetting === 'Inpatient' ? ' selected' : ''}>Inpatient</option>
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

  // Attach medication autocomplete
  const medNameInput = document.getElementById('med-name');
  if (medNameInput && typeof attachMedAutocomplete === 'function') {
    attachMedAutocomplete(medNameInput, {
      onSelect: (medEntry, defaultForm) => {
        medNameInput.value = medEntry.generic;
        const doseInput = document.getElementById('med-dose');
        const unitSel   = document.getElementById('med-unit');
        const routeSel  = document.getElementById('med-route');
        const freqSel   = document.getElementById('med-freq');
        const indInput  = document.getElementById('med-indication');

        if (unitSel)  unitSel.value  = defaultForm.unit;
        if (routeSel) routeSel.value = defaultForm.route;
        if (freqSel)  freqSel.value  = defaultForm.defaultFreq;
        if (indInput && !indInput.value && medEntry.commonIndications.length > 0) {
          indInput.value = medEntry.commonIndications[0];
        }

        // Build dose pills
        const pillsContainer = document.getElementById('chart-med-dose-pills-container');
        if (pillsContainer) {
          let html = '<label class="form-label" style="font-size:12px;margin-bottom:4px">Dose</label><div class="med-dose-pills">';
          medEntry.doseForms.forEach((df, i) => {
            html += '<div class="med-dose-pill' + (i === medEntry.defaultDoseIndex ? ' active' : '') + '" data-index="' + i + '">' + esc(df.dose + (df.unit || '')) + '</div>';
          });
          html += '<div class="med-dose-pill" data-index="custom">Custom</div></div>';
          html += '<div id="chart-med-dose-custom-wrap" hidden style="margin-bottom:8px"><input class="med-dose-custom-input" id="chart-med-dose-custom" type="number" min="0" step="any" placeholder="Enter dose" /></div>';
          pillsContainer.innerHTML = html;

          if (medEntry.doseForms[medEntry.defaultDoseIndex]) {
            if (doseInput) doseInput.value = medEntry.doseForms[medEntry.defaultDoseIndex].dose;
          }
          // Hide default dose input
          const doseRow = document.getElementById('chart-med-dose-row');
          if (doseRow) {
            const doseGroup = doseRow.querySelector('.form-group:first-child');
            if (doseGroup) doseGroup.style.display = 'none';
          }

          pillsContainer.querySelectorAll('.med-dose-pill').forEach(pill => {
            pill.addEventListener('click', () => {
              pillsContainer.querySelectorAll('.med-dose-pill').forEach(p => p.classList.remove('active'));
              pill.classList.add('active');
              const idx = pill.dataset.index;
              const customWrap = document.getElementById('chart-med-dose-custom-wrap');
              if (idx === 'custom') {
                if (customWrap) customWrap.hidden = false;
                const ci = document.getElementById('chart-med-dose-custom');
                if (ci) { ci.focus(); ci.addEventListener('input', () => { if (doseInput) doseInput.value = ci.value; }); }
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
      },
    });
  }

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
      setting:      document.getElementById('med-setting').value,
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
   ORDERS SECTION — tabbed: Active Orders | Order Sets | E-Prescribe
   ============================================================ */
function buildOrdersSection(patientId) {
  const section = document.createElement('div');
  section.className = 'results-section';
  section.id = 'section-orders';

  const bar = document.createElement('div');
  bar.className = 'results-subtab-bar';
  const ordTabs = [
    { key: 'active',     label: 'Active Orders' },
    { key: 'order-sets', label: 'Order Sets' },
    { key: 'erx',        label: 'E-Prescribe' },
  ];
  let _ordSubTab = 'active';
  const content = document.createElement('div');
  section.appendChild(bar);
  section.appendChild(content);

  function renderOrdersContent() {
    content.innerHTML = '';
    if (_ordSubTab === 'active') {
      content.appendChild(buildChartOrdersCard(patientId));
      content.appendChild(buildReferralsCard(patientId));
      content.appendChild(buildDocumentsCard(patientId));
      content.appendChild(buildAuditLogCard(patientId));
    } else if (_ordSubTab === 'order-sets') {
      buildOrderSetsTabContent(patientId, content);
    } else if (_ordSubTab === 'erx') {
      buildERxTabContent(patientId, content);
    }
  }

  ordTabs.forEach(function(t) {
    const btn = document.createElement('button');
    btn.className = 'results-subtab' + (_ordSubTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() {
      _ordSubTab = t.key;
      bar.querySelectorAll('.results-subtab').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderOrdersContent();
    });
    bar.appendChild(btn);
  });

  renderOrdersContent();
  return section;
}

/* -------- Order Sets embedded in chart -------- */
function buildOrderSetsTabContent(patientId, container) {
  var BUILT_IN_SETS = typeof window._BUILT_IN_ORDER_SETS !== 'undefined' ? window._BUILT_IN_ORDER_SETS : [];
  // Fallback: define inline if the order-sets.js variable isn't accessible
  var sets = BUILT_IN_SETS.length ? BUILT_IN_SETS : [
    { id: 'sepsis', name: 'Sepsis Bundle', category: 'Critical Care', items: ['Blood Cultures x2','Lactate Level','CBC/BMP','IV Fluids 30mL/kg','Broad-spectrum Antibiotics','O2 titrate SpO2 >94%'] },
    { id: 'chest-pain', name: 'Chest Pain / ACS', category: 'Cardiology', items: ['12-Lead EKG','Troponin q3h x2','CBC/BMP/Coags','Aspirin 325mg PO','Heparin protocol','Cardiology consult'] },
    { id: 'chf', name: 'CHF Exacerbation', category: 'Cardiology', items: ['BNP','CXR PA/Lateral','BMP/Mg','Daily weights','Fluid restriction 1.5L','Furosemide IV per protocol'] },
    { id: 'pneumonia', name: 'Community Pneumonia', category: 'Pulmonary', items: ['CBC/BMP','Blood cultures','Sputum culture','CXR','Azithromycin + Ceftriaxone','O2 therapy'] },
    { id: 'dm', name: 'Diabetes Management', category: 'Endocrine', items: ['BG AC/HS','HbA1c','BMP','Basal insulin','Sliding scale insulin','Dietitian consult'] },
    { id: 'post-op', name: 'Post-Op Routine', category: 'Surgery', items: ['VS q4h','I&O','PCA or PO pain regimen','DVT prophylaxis','Diet advance as tolerated','PT/OT consult'] },
  ];
  var customSets = (typeof getOrderSets === 'function' ? getOrderSets() : []).filter(function(s) { return !s._deleted; });
  var allSets = sets.concat(customSets);

  var html = '<div style="padding:0 0 16px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<span style="font-size:13px;color:var(--text-secondary,#666)">' + allSets.length + ' order sets available</span>' +
    '<button class="btn btn-secondary btn-sm" id="os-new-custom">+ Custom Set</button>' +
  '</div>';
  html += '<div class="os-grid">';
  allSets.forEach(function(s, idx) {
    html += '<div class="os-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<h4 style="margin:0 0 4px">' + esc(s.name) + '</h4>' +
      '</div>' +
      '<div class="os-card-meta">' + esc(s.category || '') + ' &bull; ' + (s.items || []).length + ' items</div>' +
      '<ul class="os-item-list">' +
        (s.items || []).slice(0,4).map(function(i) { return '<li>' + esc(typeof i === 'string' ? i : i.name || '') + '</li>'; }).join('') +
        ((s.items || []).length > 4 ? '<li style="color:var(--text-secondary,#666);font-style:italic">+' + ((s.items||[]).length - 4) + ' more...</li>' : '') +
      '</ul>' +
      '<button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%" data-osidx="' + idx + '">Place Order Set</button>' +
    '</div>';
  });
  html += '</div></div>';
  container.innerHTML = html;

  container.querySelectorAll('[data-osidx]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var s = allSets[parseInt(this.getAttribute('data-osidx'))];
      var openEncs = getEncountersByPatient(patientId).filter(function(e) { return e.status === 'Open'; });
      if (!openEncs.length) { showToast('No open encounter — create one first', 'warning'); return; }
      var encId = openEncs[0].id;
      (s.items || []).forEach(function(item) {
        var name = typeof item === 'string' ? item : item.name || '';
        saveOrder({ encounterId: encId, patientId: patientId, type: 'General', detail: name, status: 'Pending', priority: 'Routine' });
      });
      showToast('Order set placed: ' + s.name, 'success');
    });
  });

  var newBtn = document.getElementById('os-new-custom');
  if (newBtn) newBtn.addEventListener('click', function() {
    openModal({
      title: 'Create Custom Order Set',
      bodyHTML: '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<label>Name:<input id="osn-name" class="form-control" placeholder="e.g. My Admit Orders"></label>' +
        '<label>Category:<input id="osn-cat" class="form-control" placeholder="e.g. General"></label>' +
        '<label>Items (one per line):<textarea id="osn-items" class="form-control" rows="5" placeholder="CBC\nBMP\nChest X-ray"></textarea></label>' +
      '</div>',
      footerHTML: '<button class="btn btn-primary" id="osn-save">Save</button>',
    });
    document.getElementById('osn-save').addEventListener('click', function() {
      var name = document.getElementById('osn-name').value.trim();
      if (!name) { showToast('Name required', 'error'); return; }
      var items = document.getElementById('osn-items').value.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
      if (typeof saveCustomOrderSet === 'function') saveCustomOrderSet({ name: name, category: document.getElementById('osn-cat').value, items: items });
      closeAllModals(); showToast('Order set saved', 'success');
      buildOrderSetsTabContent(patientId, container);
    });
  });
}

/* -------- E-Prescribe embedded in chart -------- */
function buildERxTabContent(patientId, container) {
  var patient = getPatient(patientId);
  var rxList = (typeof getPrescriptions === 'function' ? getPrescriptions(patientId) : []);
  var meds = getPatientMedications(patientId).filter(function(m) { return !m.setting || m.setting === 'Outpatient'; });

  var html = '<div style="padding:0 0 16px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<span style="font-size:13px;color:var(--text-secondary,#666)">Electronic prescribing for outpatient medications</span>' +
    '<button class="btn btn-primary btn-sm" id="erx-new">+ New Prescription</button>' +
  '</div>';

  if (!rxList.length && !meds.length) {
    html += '<p style="text-align:center;padding:32px;color:var(--text-secondary,#666)">No prescriptions on file for this patient.</p>';
  } else {
    html += '<table class="data-table"><thead><tr><th>Medication</th><th>Sig</th><th>Qty</th><th>Refills</th><th>Status</th><th>Date</th></tr></thead><tbody>';
    rxList.forEach(function(rx) {
      html += '<tr><td style="font-weight:500">' + esc(rx.drugName || rx.name || '') + '</td>' +
        '<td>' + esc(rx.sig || rx.dose || '') + '</td>' +
        '<td>' + esc(String(rx.quantity || '')) + '</td>' +
        '<td>' + esc(String(rx.refills || '0')) + '</td>' +
        '<td><span class="badge badge-' + (rx.status === 'Sent' ? 'success' : rx.status === 'Cancelled' ? 'danger' : 'info') + '">' + esc(rx.status || 'Draft') + '</span></td>' +
        '<td>' + (rx.createdAt ? formatDateTime(rx.createdAt) : '') + '</td></tr>';
    });
    meds.filter(function(m) { return !rxList.find(function(r) { return r.medId === m.id; }); }).forEach(function(m) {
      html += '<tr style="color:var(--text-secondary,#666)"><td>' + esc(m.name || m.drug || '') + '</td>' +
        '<td>' + esc(m.dose || '') + ' ' + esc(m.route || '') + '</td><td>—</td><td>—</td>' +
        '<td><span class="badge badge-muted">On File</span></td><td>—</td>' +
        '<td><button class="btn btn-sm btn-secondary erx-prescribe-btn" data-mid="' + m.id + '" data-mname="' + esc(m.name || m.drug || '') + '" data-dose="' + esc(m.dose || '') + '">Prescribe</button></td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  container.innerHTML = html;

  function openRxModal(prefill) {
    prefill = prefill || {};
    openModal({
      title: 'New Prescription',
      bodyHTML: '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<label>Medication:<input id="erx-drug" class="form-control" value="' + esc(prefill.name || '') + '" placeholder="Drug name"></label>' +
        '<label>Sig (directions):<input id="erx-sig" class="form-control" value="' + esc(prefill.dose || '') + '" placeholder="e.g. 1 tablet PO BID"></label>' +
        '<label>Quantity:<input id="erx-qty" class="form-control" type="number" value="30" min="1"></label>' +
        '<label>Refills:<input id="erx-ref" class="form-control" type="number" value="0" min="0"></label>' +
        '<label>Pharmacy notes:<input id="erx-notes" class="form-control" placeholder="Optional"></label>' +
      '</div>',
      footerHTML: '<button class="btn btn-secondary" id="erx-save-draft">Save Draft</button><button class="btn btn-primary" id="erx-send">Send to Pharmacy</button>',
    });
    document.getElementById('erx-save-draft').addEventListener('click', function() { saveRx('Draft'); });
    document.getElementById('erx-send').addEventListener('click', function() { saveRx('Sent'); });
    function saveRx(status) {
      var drug = document.getElementById('erx-drug').value.trim();
      if (!drug) { showToast('Medication name required', 'error'); return; }
      if (typeof savePrescription === 'function') savePrescription({ patientId: patientId, drugName: drug, sig: document.getElementById('erx-sig').value, quantity: document.getElementById('erx-qty').value, refills: document.getElementById('erx-ref').value, notes: document.getElementById('erx-notes').value, status: status, prescribedBy: getSessionUser() ? getSessionUser().id : '' });
      closeAllModals(); showToast(status === 'Sent' ? 'Prescription sent to pharmacy' : 'Draft saved', 'success');
      buildERxTabContent(patientId, container);
    }
  }

  var newBtn = document.getElementById('erx-new');
  if (newBtn) newBtn.addEventListener('click', function() { openRxModal(); });
  container.querySelectorAll('.erx-prescribe-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { openRxModal({ name: this.getAttribute('data-mname'), dose: this.getAttribute('data-dose') }); });
  });
}

/* ============================================================
   MAR TAB — embedded in Medications section
   ============================================================ */
function buildMARTabContent(patientId, container) {
  var meds = loadAll(KEYS.patientMeds).filter(function(m) { return m.patientId === patientId && m.status === 'Active'; });
  var entries = (typeof getMAREntries === 'function') ? getMAREntries(patientId) : [];
  var today = new Date().toISOString().slice(0, 10);

  var MAR_FREQ_HOURS = { 'Daily': [8], 'BID': [8,20], 'TID': [8,14,20], 'QID': [8,12,16,20], 'Q4H': [0,4,8,12,16,20], 'Q6H': [0,6,12,18], 'Q8H': [0,8,16], 'Q12H': [8,20], 'QHS': [21], 'QAM': [8] };
  var hours = [0,2,4,6,8,10,12,14,16,18,20,22];

  if (!meds.length) {
    container.innerHTML = '<p style="text-align:center;padding:32px;color:var(--text-secondary,#666)">No active medications for this patient.</p>';
    return;
  }

  var html = '<div style="margin-bottom:12px;display:flex;gap:16px;font-size:12px">' +
    '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:14px;height:14px;border-radius:3px;background:#d4edda;display:inline-block"></span> Given</span>' +
    '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:14px;height:14px;border-radius:3px;background:#fff3cd;display:inline-block"></span> Held</span>' +
    '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:14px;height:14px;border-radius:3px;background:#f8d7da;display:inline-block"></span> Refused</span>' +
    '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:14px;height:14px;border-radius:3px;background:#e9ecef;display:inline-block"></span> Not Due</span>' +
  '</div>';
  html += '<div style="overflow-x:auto"><table class="mar-grid"><thead><tr><th style="text-align:left;min-width:180px">Medication</th><th>Freq</th>';
  hours.forEach(function(h) { html += '<th>' + String(h).padStart(2,'0') + ':00</th>'; });
  html += '</tr></thead><tbody>';

  var scheduled = meds.filter(function(m) { return m.frequency !== 'PRN'; });
  var prns = meds.filter(function(m) { return m.frequency === 'PRN'; });

  scheduled.forEach(function(med) {
    var freq = med.frequency || 'Daily';
    var schedHours = MAR_FREQ_HOURS[freq] || [8];
    html += '<tr><td style="font-weight:500;padding:6px 8px">' + esc(med.name || med.drug || '') + ' ' + esc(med.dose || '') + '</td><td style="text-align:center">' + esc(freq) + '</td>';
    hours.forEach(function(h) {
      var isDue = schedHours.indexOf(h) >= 0;
      var entry = entries.find(function(e) { return e.medId === med.id && e.hour === h && e.date === today; });
      var bg = ''; var label = '';
      if (entry) { bg = entry.status === 'given' ? '#d4edda' : entry.status === 'held' ? '#fff3cd' : '#f8d7da'; label = entry.status === 'given' ? 'G' : entry.status === 'held' ? 'H' : 'R'; }
      else if (isDue) { bg = '#e9ecef'; label = '—'; }
      html += '<td style="text-align:center;background:' + bg + ';cursor:' + (isDue ? 'pointer' : 'default') + '" class="mar-cell-inline" data-med="' + med.id + '" data-hour="' + h + '" data-due="' + isDue + '">' + label + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  if (prns.length) {
    html += '<h4 style="margin:16px 0 8px">PRN Medications</h4>';
    html += '<table class="data-table"><thead><tr><th>Medication</th><th>Indication</th><th>Last Given</th><th></th></tr></thead><tbody>';
    prns.forEach(function(med) {
      var last = entries.filter(function(e) { return e.medId === med.id && e.status === 'given'; }).sort(function(a,b) { return b.recordedAt > a.recordedAt ? 1 : -1; })[0];
      html += '<tr><td style="font-weight:500">' + esc(med.name || med.drug || '') + ' ' + esc(med.dose || '') + '</td>' +
        '<td>' + esc(med.indication || 'As needed') + '</td>' +
        '<td>' + (last ? formatDateTime(last.recordedAt) : 'Never') + '</td>' +
        '<td><button class="btn btn-secondary btn-sm mar-prn-inline" data-med="' + med.id + '">Administer</button></td></tr>';
    });
    html += '</tbody></table>';
  }

  container.innerHTML = html;

  container.querySelectorAll('.mar-cell-inline[data-due="true"]').forEach(function(cell) {
    cell.addEventListener('click', function() {
      var medId = this.getAttribute('data-med');
      var hour = parseInt(this.getAttribute('data-hour'));
      var med = meds.find(function(m) { return m.id === medId; });
      openModal({
        title: 'Record Administration — ' + esc(med ? (med.name || med.drug) : ''),
        bodyHTML: '<label>Status:<select id="mar-inline-status" class="form-control"><option value="given">Given</option><option value="held">Held</option><option value="refused">Refused</option></select></label>' +
          '<label style="margin-top:8px">Notes:<input id="mar-inline-notes" class="form-control" placeholder="Optional"></label>',
        footerHTML: '<button class="btn btn-primary" id="mar-inline-save">Save</button>',
      });
      document.getElementById('mar-inline-save').addEventListener('click', function() {
        if (typeof saveMAREntry === 'function') saveMAREntry({ patientId: patientId, medId: medId, hour: hour, date: today, status: document.getElementById('mar-inline-status').value, notes: document.getElementById('mar-inline-notes').value, recordedAt: new Date().toISOString(), nurse: getSessionUser() ? getSessionUser().id : '' });
        closeAllModals(); showToast('Administration recorded', 'success');
        buildMARTabContent(patientId, container);
      });
    });
  });

  container.querySelectorAll('.mar-prn-inline').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var medId = this.getAttribute('data-med');
      var now = new Date();
      if (typeof saveMAREntry === 'function') saveMAREntry({ patientId: patientId, medId: medId, hour: now.getHours(), date: today, status: 'given', recordedAt: now.toISOString(), nurse: getSessionUser() ? getSessionUser().id : '' });
      showToast('PRN administered', 'success');
      buildMARTabContent(patientId, container);
    });
  });
}

/* ============================================================
   ASSESSMENTS TAB — embedded in chart
   ============================================================ */
function buildAssessmentsTabContent(patientId, container) {
  var assessments = (typeof getNursingAssessments === 'function' ? getNursingAssessments(patientId) : []).sort(function(a,b) { return b.createdAt > a.createdAt ? 1 : -1; });

  var SYSTEMS = [
    { key: 'neuro', label: 'Neurological' }, { key: 'cardio', label: 'Cardiovascular' },
    { key: 'resp', label: 'Respiratory' }, { key: 'gi', label: 'Gastrointestinal' },
    { key: 'gu', label: 'Genitourinary' }, { key: 'msk', label: 'Musculoskeletal' },
    { key: 'skin', label: 'Skin/Wound' }, { key: 'pain', label: 'Pain' }, { key: 'psycho', label: 'Psychosocial' }
  ];

  function renderHistory() {
    var html = '<div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">' +
      '<span style="font-size:13px;color:var(--text-secondary,#666)">' + assessments.length + ' assessment' + (assessments.length !== 1 ? 's' : '') + ' on file</span>' +
      '<button class="btn btn-primary btn-sm" id="assess-new-btn">+ New Assessment</button>' +
    '</div>';
    if (!assessments.length) {
      html += '<p style="text-align:center;padding:32px;color:var(--text-secondary,#666)">No assessments recorded. Click "+ New Assessment" to start.</p>';
    } else {
      assessments.forEach(function(a) {
        html += '<div style="background:var(--bg-card,#fff);border:1px solid var(--border,#ddd);border-radius:var(--radius,8px);padding:12px 16px;margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<strong>' + esc(a.type || 'Assessment') + '</strong>' +
            '<span style="font-size:12px;color:var(--text-secondary,#666)">' + formatDateTime(a.createdAt) + '</span>' +
          '</div>' +
          (a.score !== undefined ? '<div style="margin-top:4px">Score: <strong>' + a.score + '</strong></div>' : '') +
          (a.notes ? '<div style="margin-top:4px;font-size:13px;color:var(--text-secondary,#666)">' + esc(a.notes) + '</div>' : '') +
        '</div>';
      });
    }
    container.innerHTML = html;
    var newBtn = document.getElementById('assess-new-btn');
    if (newBtn) newBtn.addEventListener('click', renderForm);
  }

  function renderForm() {
    var html = '<button class="btn btn-secondary btn-sm" id="assess-back" style="margin-bottom:16px">Back</button>';
    html += '<h4 style="margin:0 0 12px">Head-to-Toe Assessment</h4>';
    SYSTEMS.forEach(function(sys) {
      html += '<div style="background:var(--bg-card,#fff);border:1px solid var(--border,#ddd);border-radius:var(--radius,8px);padding:12px;margin-bottom:8px">' +
        '<strong>' + sys.label + '</strong>' +
        '<div style="margin-top:6px;display:flex;gap:12px">' +
          '<label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="assess-' + sys.key + '" value="normal" checked> Normal</label>' +
          '<label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" name="assess-' + sys.key + '" value="abnormal"> Abnormal</label>' +
        '</div>' +
        '<textarea class="form-control assess-notes" data-sys="' + sys.key + '" style="margin-top:6px;display:none;font-size:13px" placeholder="Document findings..."></textarea>' +
      '</div>';
    });
    html += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn btn-primary" id="assess-save">Save Assessment</button></div>';
    container.innerHTML = html;

    container.querySelectorAll('input[type="radio"]').forEach(function(r) {
      r.addEventListener('change', function() {
        var sys = this.name.replace('assess-', '');
        var ta = container.querySelector('.assess-notes[data-sys="' + sys + '"]');
        if (ta) ta.style.display = this.value === 'abnormal' ? 'block' : 'none';
      });
    });

    document.getElementById('assess-back').addEventListener('click', function() { renderHistory(); });
    document.getElementById('assess-save').addEventListener('click', function() {
      var findings = {};
      SYSTEMS.forEach(function(sys) {
        var val = container.querySelector('input[name="assess-' + sys.key + '"]:checked');
        var ta = container.querySelector('.assess-notes[data-sys="' + sys.key + '"]');
        findings[sys.key] = { status: val ? val.value : 'normal', notes: ta ? ta.value : '' };
      });
      if (typeof saveNursingAssessment === 'function') saveNursingAssessment({ patientId: patientId, type: 'Head-to-Toe', findings: findings, nurse: getSessionUser() ? getSessionUser().id : '' });
      assessments.unshift({ type: 'Head-to-Toe', createdAt: new Date().toISOString(), findings: findings });
      showToast('Assessment saved', 'success');
      renderHistory();
    });
  }

  renderHistory();
}

/* ============================================================
   CARE PLANS TAB — embedded in chart
   ============================================================ */
function buildCarePlansTabContent(patientId, container) {
  var CP_TEMPLATES = [
    { name: 'Fall Prevention', diagnosis: 'Risk for Falls', goals: 'Patient will remain free from falls', interventions: ['Assess fall risk q shift','Keep bed in low position','Non-skid footwear','Call light within reach','Assist with ambulation'] },
    { name: 'Pain Management', diagnosis: 'Acute/Chronic Pain', goals: 'Pain <= 4/10 within 1 hour of intervention', interventions: ['Assess pain q4h','Administer analgesics as ordered','Reposition for comfort','Teach relaxation techniques'] },
    { name: 'Infection Control', diagnosis: 'Risk for Infection', goals: 'Patient remains free from infection', interventions: ['Monitor temp q4h','Assess IV/surgical site q shift','Hand hygiene','Administer antibiotics as ordered'] },
    { name: 'Skin Integrity', diagnosis: 'Impaired Skin Integrity', goals: 'Wound shows signs of healing', interventions: ['Assess wound q shift','Reposition q2h','Keep skin clean and dry','Apply barrier cream'] },
    { name: 'Discharge Planning', diagnosis: 'Readiness for Enhanced Self-Care', goals: 'Patient verbalizes understanding of discharge plan', interventions: ['Assess home environment','Teach medication management','Arrange follow-up','Provide written instructions'] },
  ];

  function render() {
    var plans = (typeof getCarePlans === 'function' ? getCarePlans(patientId) : []);
    var html = '<div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">' +
      '<span style="font-size:13px;color:var(--text-secondary,#666)">' + plans.length + ' care plan' + (plans.length !== 1 ? 's' : '') + '</span>' +
      '<button class="btn btn-primary btn-sm" id="cp-new-btn">+ New Care Plan</button>' +
    '</div>';

    if (!plans.length) {
      html += '<p style="text-align:center;padding:32px;color:var(--text-secondary,#666)">No care plans. Click "+ New Care Plan" to add one.</p>';
    }
    plans.forEach(function(plan) {
      var statusBg = plan.status === 'Active' ? '#d4edda' : plan.status === 'On Hold' ? '#fff3cd' : '#e9ecef';
      var statusColor = plan.status === 'Active' ? '#155724' : plan.status === 'On Hold' ? '#856404' : '#383d41';
      html += '<div style="background:var(--bg-card,#fff);border:1px solid var(--border,#ddd);border-radius:var(--radius,8px);padding:16px;margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
          '<strong>' + esc(plan.name || plan.diagnosis || '') + '</strong>' +
          '<span style="padding:2px 10px;border-radius:10px;font-size:12px;background:' + statusBg + ';color:' + statusColor + '">' + esc(plan.status || 'Active') + '</span>' +
        '</div>' +
        '<div style="font-size:13px;margin-bottom:4px"><span style="color:var(--text-secondary,#666)">Diagnosis:</span> ' + esc(plan.diagnosis || '') + '</div>' +
        '<div style="font-size:13px;margin-bottom:6px"><span style="color:var(--text-secondary,#666)">Goal:</span> ' + esc(plan.goals || '') + '</div>' +
        '<div style="font-size:13px">' + (plan.interventions || []).map(function(i) { return '<div style="padding:3px 0;border-bottom:1px solid var(--border,#eee)">' + esc(typeof i === 'string' ? i : i.text || '') + '</div>'; }).join('') + '</div>' +
        '<div style="margin-top:8px;display:flex;gap:6px">' +
          (plan.status === 'Active' ? '<button class="btn btn-secondary btn-sm cp-hold" data-id="' + plan.id + '">Hold</button>' : '') +
          (plan.status === 'On Hold' ? '<button class="btn btn-secondary btn-sm cp-activate" data-id="' + plan.id + '">Reactivate</button>' : '') +
          '<button class="btn btn-secondary btn-sm cp-resolve" data-id="' + plan.id + '">Resolve</button>' +
        '</div>' +
      '</div>';
    });
    container.innerHTML = html;

    document.getElementById('cp-new-btn').addEventListener('click', function() { showPlanPicker(); });

    container.querySelectorAll('.cp-hold,.cp-activate,.cp-resolve').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var plan = plans.find(function(p) { return p.id === btn.getAttribute('data-id'); });
        if (!plan) return;
        if (btn.classList.contains('cp-hold')) plan.status = 'On Hold';
        else if (btn.classList.contains('cp-activate')) plan.status = 'Active';
        else plan.status = 'Resolved';
        if (typeof saveCarePlan === 'function') saveCarePlan(plan);
        showToast('Care plan updated', 'success'); render();
      });
    });
  }

  function showPlanPicker() {
    var body = '<p style="margin-bottom:12px;font-size:13px">Choose a template:</p><div class="os-grid">';
    CP_TEMPLATES.forEach(function(t, i) {
      body += '<div style="background:var(--bg-card,#fff);border:1px solid var(--border,#ddd);border-radius:var(--radius,8px);padding:12px;cursor:pointer" class="cp-tpl-pick" data-i="' + i + '"><strong>' + esc(t.name) + '</strong><div style="font-size:12px;color:var(--text-secondary,#666);margin-top:4px">' + esc(t.diagnosis) + '</div></div>';
    });
    body += '<div style="background:var(--bg-card,#fff);border:1px solid var(--border,#ddd);border-radius:var(--radius,8px);padding:12px;cursor:pointer" class="cp-tpl-pick" data-i="custom"><strong>Custom Plan</strong></div>';
    body += '</div>';
    openModal({ title: 'New Care Plan', bodyHTML: body, footerHTML: '' });
    setTimeout(function() {
      document.querySelectorAll('.cp-tpl-pick').forEach(function(card) {
        card.addEventListener('click', function() {
          var i = this.getAttribute('data-i');
          var tpl = i === 'custom' ? { name: '', diagnosis: '', goals: '', interventions: [] } : CP_TEMPLATES[parseInt(i)];
          closeAllModals();
          showPlanForm(tpl);
        });
      });
    }, 50);
  }

  function showPlanForm(tpl) {
    openModal({
      title: 'Care Plan',
      bodyHTML: '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<label>Name:<input id="cp-n" class="form-control" value="' + esc(tpl.name || '') + '"></label>' +
        '<label>Diagnosis:<input id="cp-d" class="form-control" value="' + esc(tpl.diagnosis || '') + '"></label>' +
        '<label>Goal:<input id="cp-g" class="form-control" value="' + esc(tpl.goals || '') + '"></label>' +
        '<label>Interventions (one per line):<textarea id="cp-i" class="form-control" rows="5">' + (tpl.interventions || []).join('\n') + '</textarea></label>' +
      '</div>',
      footerHTML: '<button class="btn btn-primary" id="cp-save">Save</button>',
    });
    document.getElementById('cp-save').addEventListener('click', function() {
      var name = document.getElementById('cp-n').value.trim();
      if (!name) { showToast('Name required', 'error'); return; }
      var plan = { patientId: patientId, name: name, diagnosis: document.getElementById('cp-d').value, goals: document.getElementById('cp-g').value, interventions: document.getElementById('cp-i').value.split('\n').filter(function(l) { return l.trim(); }), status: 'Active' };
      if (typeof saveCarePlan === 'function') saveCarePlan(plan);
      closeAllModals(); showToast('Care plan saved', 'success'); render();
    });
  }

  render();
}

/* ============================================================
   I/O TAB — embedded in chart
   ============================================================ */
function buildIOTabContent(patientId, container) {
  var records = (typeof getIORecords === 'function' ? getIORecords(patientId) : []);
  var today = new Date().toISOString().slice(0, 10);
  var todayRec = records.filter(function(r) { return (r.recordedAt || '').slice(0, 10) === today; });

  var totalIn = 0, totalOut = 0;
  todayRec.forEach(function(r) { if (r.direction === 'intake') totalIn += (r.amount || 0); else totalOut += (r.amount || 0); });
  var net = totalIn - totalOut;

  var INTAKE = ['PO (Oral)','IV Fluids','Blood Products','TPN','Tube Feeds'];
  var OUTPUT = ['Urine','Stool','Emesis','NG Suction','Drain'];
  var hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];

  var html = '';
  if (Math.abs(net) > 500) {
    html += '<div style="background:#f8d7da;border:1px solid #f5c6cb;border-radius:var(--radius,8px);padding:10px 16px;margin-bottom:12px;font-weight:500;color:#721c24">Significant fluid imbalance: Net ' + (net > 0 ? '+' : '') + net + ' mL over 24h</div>';
  }

  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">' +
    '<div class="summary-stat"><h4>Total Intake</h4><div class="stat-value" style="color:#155724">' + totalIn + ' mL</div></div>' +
    '<div class="summary-stat"><h4>Total Output</h4><div class="stat-value" style="color:#721c24">' + totalOut + ' mL</div></div>' +
    '<div class="summary-stat"><h4>Net Balance</h4><div class="stat-value" style="color:' + (net >= 0 ? '#155724' : '#721c24') + '">' + (net > 0 ? '+' : '') + net + ' mL</div></div>' +
  '</div>';

  function buildTable(cats, direction) {
    var out = '<h4 style="margin:0 0 8px">' + (direction === 'intake' ? 'Intake' : 'Output') + '</h4><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr>' +
      '<th style="text-align:left;padding:4px 6px;background:var(--bg-card,#f8f9fa);border:1px solid var(--border,#ddd);min-width:120px">Category</th>';
    hours.forEach(function(h) { out += '<th style="padding:4px 6px;background:var(--bg-card,#f8f9fa);border:1px solid var(--border,#ddd)">' + String(h).padStart(2,'0') + '</th>'; });
    out += '<th style="padding:4px 6px;background:var(--bg-card,#f8f9fa);border:1px solid var(--border,#ddd)">Total</th></tr></thead><tbody>';
    cats.forEach(function(cat) {
      var catTotal = 0;
      out += '<tr><td style="padding:4px 6px;border:1px solid var(--border,#ddd);font-weight:500">' + esc(cat) + '</td>';
      hours.forEach(function(h) {
        var entry = todayRec.find(function(r) { return r.direction === direction && r.category === cat && r.hour === h; });
        var amt = entry ? entry.amount : 0;
        catTotal += amt;
        out += '<td style="padding:2px 4px;border:1px solid var(--border,#ddd);text-align:center">' +
          (amt ? '<span style="font-weight:500">' + amt + '</span>' : '<button style="font-size:10px;padding:1px 4px;border:1px solid var(--border,#ddd);background:#fff;border-radius:3px;cursor:pointer" class="io-add-btn" data-dir="' + direction + '" data-cat="' + esc(cat) + '" data-h="' + h + '">+</button>') +
        '</td>';
      });
      out += '<td style="padding:4px 6px;border:1px solid var(--border,#ddd);text-align:center;font-weight:600">' + catTotal + '</td></tr>';
    });
    out += '</tbody></table></div>';
    return out;
  }

  html += buildTable(INTAKE, 'intake') + '<div style="margin:12px 0"></div>' + buildTable(OUTPUT, 'output');
  container.innerHTML = html;

  container.querySelectorAll('.io-add-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var dir = this.getAttribute('data-dir');
      var cat = this.getAttribute('data-cat');
      var h = parseInt(this.getAttribute('data-h'));
      openModal({
        title: (dir === 'intake' ? 'Intake' : 'Output') + ' — ' + cat + ' (' + String(h).padStart(2,'0') + ':00)',
        bodyHTML: '<label>Amount (mL):<input id="io-amt" type="number" class="form-control" min="1" step="10" placeholder="e.g. 250"></label>',
        footerHTML: '<button class="btn btn-primary" id="io-save">Save</button>',
      });
      document.getElementById('io-save').addEventListener('click', function() {
        var amt = parseInt(document.getElementById('io-amt').value) || 0;
        if (amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
        if (typeof saveIORecord === 'function') saveIORecord({ patientId: patientId, direction: dir, category: cat, hour: h, amount: amt, recordedAt: new Date().toISOString(), nurse: getSessionUser() ? getSessionUser().id : '' });
        closeAllModals(); showToast('Recorded ' + amt + ' mL', 'success');
        buildIOTabContent(patientId, container);
      });
    });
  });
}

/* ============================================================
   MODALS — New Encounter
   ============================================================ */
function openNewNoteForPatient(patientId) {
  const openEncs = getEncountersByPatient(patientId).filter(e => e.status === 'Open');
  if (openEncs.length === 0) {
    // No open encounter — offer to create one, then open note writer
    openModal({
      title: 'No Open Encounters',
      bodyHTML: '<p style="color:var(--text-secondary);line-height:1.6">There are no open encounters for this patient. Create an encounter first, then add a note.</p>',
      footerHTML: '<button class="btn btn-secondary" id="nn-close">Close</button><button class="btn btn-primary" id="nn-create">Create Encounter</button>',
    });
    document.getElementById('nn-close').addEventListener('click', closeModal);
    document.getElementById('nn-create').addEventListener('click', () => { closeModal(); openNewEncounterModal(patientId); });
    return;
  }
  // Open the right panel note writer (Word-document style)
  _openNoteWriterPanel(patientId);
}

function _openNoteWriterPanel(patientId) {
  // Open right panel and show note writer
  var panel = document.getElementById('right-panel');
  if (panel) panel.classList.add('open');
  if (typeof _showRightPanelNoteWriter === 'function') {
    _showRightPanelNoteWriter(patientId);
  }
}

/* ============================================================
   INLINE NOTE WRITER — rendered inside the Notes tab container
   Same functionality as the right-panel note writer.
   ============================================================ */
function renderInlineNoteWriter(patientId, container) {
  var openEncs = loadAll(KEYS.encounters).filter(function(e) {
    return e.patientId === patientId && e.status === 'Open';
  });
  var noteTypes = ['Progress Note', 'H&P', 'Consult Note', 'Procedure Note', 'Discharge Summary', 'Phone Note', 'Addendum'];

  var wrap = document.createElement('div');
  wrap.className = 'inw-wrap';

  // Toolbar
  var toolbar = document.createElement('div');
  toolbar.className = 'nw-toolbar inw-toolbar';
  toolbar.innerHTML =
    '<button class="nw-toolbar-btn" id="inw-back" title="Back to notes">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
      ' Back' +
    '</button>' +
    '<select class="nw-toolbar-select" id="inw-note-type">' +
      noteTypes.map(function(t) { return '<option>' + esc(t) + '</option>'; }).join('') +
    '</select>' +
    '<button class="nw-toolbar-btn" id="inw-template" title="Insert template">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>' +
      ' Template' +
    '</button>' +
    '<button class="nw-toolbar-btn" id="inw-phrases" title="Dot phrase reference">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
      ' .phrases' +
    '</button>';
  wrap.appendChild(toolbar);

  // Encounter context bar
  var encBar = document.createElement('div');
  encBar.className = 'nw-encounter-bar';
  if (openEncs.length === 0) {
    encBar.innerHTML =
      '<label class="nw-encounter-label">Visit Type</label>' +
      '<select class="nw-toolbar-select" id="inw-visit-type">' +
      '<option>Office Visit</option><option>Follow-Up</option><option>New Patient</option>' +
      '<option>Telehealth</option><option>Urgent Care</option></select>';
  } else {
    encBar.innerHTML =
      '<span class="nw-encounter-label">' + esc(openEncs[0].visitType || 'Visit') + '</span>' +
      '<span class="nw-encounter-date">' + formatDateTime(openEncs[0].dateTime) + '</span>';
  }
  wrap.appendChild(encBar);

  // Writing surface
  var surface = document.createElement('div');
  surface.className = 'nw-doc-surface inw-doc-surface';
  var textarea = document.createElement('textarea');
  textarea.className = 'nw-doc-textarea inw-textarea';
  textarea.id = 'inw-body';
  textarea.placeholder = 'Start typing your note...\n\nTip: Type a dot phrase like .hpi, .ros, .pe, .vitals, .meds, .allergies, .problems to auto-insert content.\n\nOr click Template to load a full note template.';
  surface.appendChild(textarea);
  wrap.appendChild(surface);

  // Status bar
  var statusBar = document.createElement('div');
  statusBar.className = 'nw-status-bar';
  statusBar.innerHTML = '<span class="nw-status-text" id="inw-status">Draft</span><span class="nw-word-count" id="inw-wc">0 words</span>';
  wrap.appendChild(statusBar);

  // Action buttons
  var actions = document.createElement('div');
  actions.className = 'nw-actions';
  actions.innerHTML =
    '<button class="btn btn-primary btn-sm" id="inw-save" style="flex:1">Save Draft</button>' +
    '<button class="btn btn-sm nw-sign-btn" id="inw-sign" style="flex:1">Save & Sign</button>';
  wrap.appendChild(actions);

  container.innerHTML = '';
  container.appendChild(wrap);

  // Wire smart phrase dropdown
  if (typeof initSmartPhraseListener === 'function') initSmartPhraseListener(textarea);

  // Dot phrase auto-expand
  var _expanding = false;
  textarea.addEventListener('input', function() {
    if (_expanding) return;
    var pos = textarea.selectionStart;
    var text = textarea.value.substring(0, pos);
    var match = text.match(/(\.\w+)([\s])$/);
    if (!match) return;
    var abbr = match[1];
    var trailing = match[2];
    var dotIdx = text.length - match[0].length;
    if (dotIdx > 0 && !/\s/.test(text[dotIdx - 1])) return;
    var allPhrases = typeof getSmartPhrases === 'function' ? getSmartPhrases() : [];
    var phrase = null;
    for (var i = 0; i < allPhrases.length; i++) {
      if (allPhrases[i].abbreviation.toLowerCase() === abbr.toLowerCase()) { phrase = allPhrases[i]; break; }
    }
    if (!phrase) return;
    var expanded = typeof expandSmartPhrase === 'function' ? expandSmartPhrase(phrase.abbreviation, patientId) : phrase.content;
    if (expanded === null) expanded = phrase.content;
    _expanding = true;
    var before = textarea.value.substring(0, dotIdx);
    var after = textarea.value.substring(pos);
    textarea.value = before + expanded + trailing + after;
    var newPos = before.length + expanded.length + trailing.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
    _expanding = false;
    textarea.dispatchEvent(new Event('_wc'));
  });

  // Word count
  function _updateWC() {
    var words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
    var wcEl = document.getElementById('inw-wc');
    if (wcEl) wcEl.textContent = words + ' word' + (words !== 1 ? 's' : '');
  }
  textarea.addEventListener('input', _updateWC);
  textarea.addEventListener('_wc', _updateWC);

  // Back button
  document.getElementById('inw-back').addEventListener('click', function() {
    renderNotePreviewPane(patientId, container);
  });

  // Template button
  document.getElementById('inw-template').addEventListener('click', function() {
    if (typeof _openRightPanelTemplatePicker === 'function') _openRightPanelTemplatePicker(textarea, patientId);
  });

  // Dot phrase reference
  document.getElementById('inw-phrases').addEventListener('click', function() {
    if (typeof _openDotPhraseReference === 'function') _openDotPhraseReference();
  });

  // Save handler
  function _saveNote(andSign) {
    var user = getSessionUser();
    var encId;
    if (openEncs.length > 0) {
      encId = openEncs[0].id;
    } else {
      var visitTypeEl = document.getElementById('inw-visit-type');
      var newEnc = saveEncounter({
        patientId: patientId,
        providerId: user ? user.id : '',
        visitType: visitTypeEl ? visitTypeEl.value : 'Office Visit',
        status: 'Open',
        dateTime: new Date().toISOString(),
      });
      if (!newEnc || newEnc.error) { showToast('Failed to create encounter', 'error'); return; }
      encId = newEnc.id;
      openEncs.push(newEnc);
    }
    var rawText = (textarea.value || '').trim();
    if (!rawText) { showToast('Note is empty', 'warning'); return; }
    var noteType = document.getElementById('inw-note-type').value;
    var parsed = typeof _parseFreeformToSections === 'function' ? _parseFreeformToSections(rawText) : null;
    var noteData = {
      encounterId: encId, patientId: patientId, type: noteType, noteBody: rawText,
      hpi: parsed ? (parsed.hpi || '') : '', ros: parsed ? (parsed.ros || '') : '',
      physicalExam: parsed ? (parsed.physicalExam || '') : '', assessment: parsed ? (parsed.assessment || '') : '',
      plan: parsed ? (parsed.plan || '') : '', chiefComplaint: parsed ? (parsed.chiefComplaint || '') : '',
      authorId: user ? user.id : '', dateTime: new Date().toISOString(),
    };
    if (andSign) { noteData.signed = true; noteData.signedBy = user ? user.id : ''; noteData.signedAt = new Date().toISOString(); }
    var result = saveNote(noteData);
    if (result && result.error) { showToast('Error saving note: ' + (result.errors || []).join(', '), 'error'); return; }
    showToast(andSign ? 'Note saved & signed' : 'Note saved as draft', 'success');
    renderNotePreviewPane(patientId, container);
  }

  document.getElementById('inw-save').addEventListener('click', function() { _saveNote(false); });
  document.getElementById('inw-sign').addEventListener('click', function() { _saveNote(true); });

  textarea.focus();
}

function openNewEncounterModal(patientId, prefillType) {
  const currentUser = getSessionUser();
  const currentProvider = currentUser ? getProvider(currentUser.id) : null;
  if (!currentProvider) {
    showToast('Your account is not linked to a provider profile.', 'error');
    return;
  }

  const modeDefault = getEncounterMode() === 'inpatient' ? 'Inpatient' : 'Outpatient';
  const effectivePrefill = prefillType && VISIT_TYPES[prefillType] !== undefined ? prefillType : modeDefault;
  const typeOpts = Object.keys(VISIT_TYPES).map(t =>
    `<option value="${t}"${t === effectivePrefill ? ' selected' : ''}>${t}</option>`
  ).join('');
  const initialType = effectivePrefill || Object.keys(VISIT_TYPES)[0];
  const initialSubtypes = VISIT_TYPES[initialType] || [];
  const providerName = currentProvider.lastName + ', ' + currentProvider.firstName + ' — ' + currentProvider.degree;

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Provider</label>
      <div class="form-control" style="background:var(--surface-2);cursor:default;">${esc(providerName)}</div>
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
    const providerId   = currentProvider.id;
    const visitType    = document.getElementById('ne-type').value;
    const visitSubtype = document.getElementById('ne-subtype').value;
    const dtVal        = document.getElementById('ne-datetime').value;
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
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
  const providers = getProviders();
  const panelProvs = patient.panelProviders || [];
  let providerCheckboxes = providers.map(p => {
    const checked = panelProvs.includes(p.id) ? ' checked' : '';
    return '<label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" class="ep-panel-prov" value="' + esc(p.id) + '"' + checked + ' /> ' + esc(p.lastName + ', ' + p.firstName + ', ' + p.degree) + '</label>';
  }).join('');

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
        <label class="form-label">Email</label>
        <input class="form-control" id="ep-email" type="email" value="${esc(patient.email || '')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Insurance</label>
        <input class="form-control" id="ep-insurance" value="${esc(patient.insurance)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Code Status</label>
        <select class="form-control" id="ep-code-status">
          ${['Full Code','DNR','DNR/DNI','DNI','Comfort Care'].map(s =>
            `<option value="${s}"${(patient.codeStatus || 'Full Code') === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Address</h4>
    <div class="form-group">
      <label class="form-label">Street</label>
      <input class="form-control" id="ep-street" value="${esc(patient.addressStreet || '')}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">City</label>
        <input class="form-control" id="ep-city" value="${esc(patient.addressCity || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">State</label>
        <input class="form-control" id="ep-state" value="${esc(patient.addressState || '')}" maxlength="2" style="max-width:80px" />
      </div>
      <div class="form-group">
        <label class="form-label">ZIP</label>
        <input class="form-control" id="ep-zip" value="${esc(patient.addressZip || '')}" maxlength="10" style="max-width:100px" />
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Emergency Contact</h4>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-control" id="ep-ec-name" value="${esc(patient.emergencyContactName || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="ep-ec-phone" value="${esc(patient.emergencyContactPhone || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Relationship</label>
        <input class="form-control" id="ep-ec-rel" value="${esc(patient.emergencyContactRelationship || '')}" />
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Preferred Pharmacy</h4>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pharmacy Name</label>
        <input class="form-control" id="ep-pharm-name" value="${esc(patient.pharmacyName || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="ep-pharm-phone" value="${esc(patient.pharmacyPhone || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Fax</label>
        <input class="form-control" id="ep-pharm-fax" value="${esc(patient.pharmacyFax || '')}" />
      </div>
    </div>
    <div style="margin-bottom:8px">
      <button class="btn btn-secondary" id="ep-find-pharmacy-btn" style="font-size:11px;padding:4px 12px">Find Pharmacy</button>
      <div id="ep-pharmacy-lookup" hidden style="margin-top:8px"></div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Panel Providers</h4>
    <div id="ep-panel-provs" style="display:flex;flex-direction:column;gap:4px">${providerCheckboxes || '<span style="color:var(--text-muted);font-size:13px">No providers available</span>'}</div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="ep-cancel">Cancel</button>
    <button class="btn btn-primary" id="ep-save">Save</button>
  `;

  openModal({ title: 'Edit Patient', bodyHTML, footerHTML, size: 'lg' });

  // Pharmacy lookup button
  const findPharmBtn = document.getElementById('ep-find-pharmacy-btn');
  const pharmLookupDiv = document.getElementById('ep-pharmacy-lookup');
  if (findPharmBtn && pharmLookupDiv && typeof renderPharmacyLookup === 'function') {
    findPharmBtn.addEventListener('click', () => {
      pharmLookupDiv.hidden = !pharmLookupDiv.hidden;
      if (!pharmLookupDiv.hidden && pharmLookupDiv.children.length === 0) {
        renderPharmacyLookup(pharmLookupDiv, {
          zip: document.getElementById('ep-zip').value.trim() || patient.addressZip || '',
          onSelect: (pharm) => {
            document.getElementById('ep-pharm-name').value  = pharm.name;
            document.getElementById('ep-pharm-phone').value = pharm.phone;
            document.getElementById('ep-pharm-fax').value   = pharm.fax;
            pharmLookupDiv.hidden = true;
            showToast('Pharmacy selected: ' + pharm.name, 'success');
          },
        });
      }
    });
  }

  document.getElementById('ep-cancel').addEventListener('click', closeModal);
  document.getElementById('ep-save').addEventListener('click', () => {
    const firstName = document.getElementById('ep-first').value.trim();
    const lastName  = document.getElementById('ep-last').value.trim();
    if (!firstName || !lastName) { showToast('Name is required.', 'error'); return; }

    const selectedProviders = Array.from(document.querySelectorAll('.ep-panel-prov:checked')).map(cb => cb.value);

    savePatient({
      id: patient.id, firstName, lastName,
      dob:       document.getElementById('ep-dob').value,
      sex:       document.getElementById('ep-sex').value,
      phone:     document.getElementById('ep-phone').value.trim(),
      email:     document.getElementById('ep-email').value.trim(),
      insurance:  document.getElementById('ep-insurance').value.trim(),
      codeStatus: document.getElementById('ep-code-status').value,
      addressStreet: document.getElementById('ep-street').value.trim(),
      addressCity:   document.getElementById('ep-city').value.trim(),
      addressState:  document.getElementById('ep-state').value.trim(),
      addressZip:    document.getElementById('ep-zip').value.trim(),
      emergencyContactName:         document.getElementById('ep-ec-name').value.trim(),
      emergencyContactPhone:        document.getElementById('ep-ec-phone').value.trim(),
      emergencyContactRelationship: document.getElementById('ep-ec-rel').value.trim(),
      pharmacyName:  document.getElementById('ep-pharm-name').value.trim(),
      pharmacyPhone: document.getElementById('ep-pharm-phone').value.trim(),
      pharmacyFax:   document.getElementById('ep-pharm-fax').value.trim(),
      panelProviders: selectedProviders,
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
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
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
   MODAL — Imaging Result
   ============================================================ */
function openImagingResultModal(patientId) {
  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Study Type *</label>
        <input class="form-control" id="ir-study" placeholder="e.g. Chest X-Ray PA/Lateral" />
      </div>
      <div class="form-group">
        <label class="form-label">Modality</label>
        <select class="form-control" id="ir-modality">
          <option value="">Select…</option>
          <option>X-Ray</option><option>CT</option><option>MRI</option><option>Ultrasound</option>
          <option>Nuclear Medicine</option><option>Fluoroscopy</option><option>PET/CT</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Body Region</label>
        <input class="form-control" id="ir-region" placeholder="e.g. Chest" />
      </div>
      <div class="form-group">
        <label class="form-label">Result Date</label>
        <input class="form-control" id="ir-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Ordered By</label>
        <input class="form-control" id="ir-ordered" placeholder="Ordering provider" />
      </div>
      <div class="form-group">
        <label class="form-label">Read By</label>
        <input class="form-control" id="ir-readby" placeholder="Radiologist" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Indication</label>
      <input class="form-control" id="ir-indication" placeholder="Clinical indication" />
    </div>
    <div class="form-group">
      <label class="form-label">Findings</label>
      <textarea class="note-textarea" id="ir-findings" style="min-height:80px" placeholder="Findings…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Impression</label>
      <textarea class="note-textarea" id="ir-impression" style="min-height:60px" placeholder="Impression…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-control" id="ir-status">
        <option>Final</option><option>Preliminary</option><option>Addendum</option>
      </select>
    </div>
  `;

  openModal({
    title: 'Add Imaging Result',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="ir-cancel">Cancel</button>
                 <button class="btn btn-primary" id="ir-save">Save Result</button>`,
    size: 'lg',
  });

  document.getElementById('ir-cancel').addEventListener('click', closeModal);
  document.getElementById('ir-save').addEventListener('click', () => {
    const studyType = document.getElementById('ir-study').value.trim();
    if (!studyType) { showToast('Study type is required.', 'error'); return; }
    const dateVal = document.getElementById('ir-date').value;
    saveImagingResult({
      patientId,
      studyType,
      modality:   document.getElementById('ir-modality').value,
      bodyRegion: document.getElementById('ir-region').value.trim(),
      resultDate: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      orderedBy:  document.getElementById('ir-ordered').value.trim(),
      readBy:     document.getElementById('ir-readby').value.trim(),
      indication: document.getElementById('ir-indication').value.trim(),
      findings:   document.getElementById('ir-findings').value,
      impression: document.getElementById('ir-impression').value,
      status:     document.getElementById('ir-status').value,
    });
    closeModal();
    showToast('Imaging result saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Microbiology Result
   ============================================================ */
function openMicroResultModal(patientId) {
  let sensCount = 2;

  function buildSensRows(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div class="form-row" style="margin-bottom:6px">
        <input class="form-control" id="sens-abx-${i}" placeholder="Antibiotic" />
        <select class="form-control" id="sens-result-${i}">
          <option>Sensitive</option><option>Intermediate</option><option>Resistant</option>
        </select>
        <input class="form-control" id="sens-mic-${i}" placeholder="MIC (optional)" />
      </div>`;
    }
    return html;
  }

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Culture Site *</label>
        <input class="form-control" id="mr-site" placeholder="e.g. Blood, Urine, Wound" />
      </div>
      <div class="form-group">
        <label class="form-label">Collection Date</label>
        <input class="form-control" id="mr-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Gram Stain</label>
      <input class="form-control" id="mr-gram" placeholder="e.g. Gram positive cocci in clusters" />
    </div>
    <div class="form-group">
      <label class="form-label">Organism</label>
      <input class="form-control" id="mr-organism" placeholder="e.g. Staphylococcus aureus" />
    </div>
    <div class="form-label" style="margin-bottom:6px;font-size:12px;font-weight:600;color:var(--text-secondary)">
      Sensitivities
    </div>
    <div id="mr-sens">${buildSensRows(sensCount)}</div>
    <button class="btn btn-ghost btn-sm" id="mr-add-sens" style="margin-top:4px">+ Add Row</button>
    <div class="form-row" style="margin-top:12px">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="mr-status">
          <option>Final</option><option>Preliminary</option><option>No Growth</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="mr-notes" style="min-height:60px" placeholder="Additional notes…"></textarea>
    </div>
  `;

  openModal({
    title: 'Add Microbiology Result',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="mr-cancel">Cancel</button>
                 <button class="btn btn-primary" id="mr-save">Save Result</button>`,
    size: 'lg',
  });

  document.getElementById('mr-cancel').addEventListener('click', closeModal);
  document.getElementById('mr-add-sens').addEventListener('click', () => {
    sensCount++;
    const container = document.getElementById('mr-sens');
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '6px';
    row.innerHTML = `
      <input class="form-control" id="sens-abx-${sensCount-1}" placeholder="Antibiotic" />
      <select class="form-control" id="sens-result-${sensCount-1}">
        <option>Sensitive</option><option>Intermediate</option><option>Resistant</option>
      </select>
      <input class="form-control" id="sens-mic-${sensCount-1}" placeholder="MIC (optional)" />`;
    container.appendChild(row);
  });

  document.getElementById('mr-save').addEventListener('click', () => {
    const cultureSite = document.getElementById('mr-site').value.trim();
    if (!cultureSite) { showToast('Culture site is required.', 'error'); return; }
    const sensitivities = [];
    for (let i = 0; i < sensCount; i++) {
      const abx = document.getElementById('sens-abx-' + i)?.value.trim();
      const res = document.getElementById('sens-result-' + i)?.value;
      if (abx) {
        sensitivities.push({
          antibiotic: abx,
          result: res || 'Sensitive',
          mic: document.getElementById('sens-mic-' + i)?.value.trim() || '',
        });
      }
    }
    const dateVal = document.getElementById('mr-date').value;
    saveMicroResult({
      patientId,
      cultureSite,
      collectionDate: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      gramStain:      document.getElementById('mr-gram').value.trim(),
      organism:       document.getElementById('mr-organism').value.trim(),
      sensitivities,
      status:         document.getElementById('mr-status').value,
      notes:          document.getElementById('mr-notes').value,
    });
    closeModal();
    showToast('Microbiology result saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Pathology Result
   ============================================================ */
function openPathResultModal(patientId) {
  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Specimen Type *</label>
        <input class="form-control" id="pr-type" placeholder="e.g. Biopsy, Excision, Cytology" />
      </div>
      <div class="form-group">
        <label class="form-label">Specimen Site</label>
        <input class="form-control" id="pr-site" placeholder="e.g. Left breast, Skin (back)" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Collection Date</label>
        <input class="form-control" id="pr-cdate" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Result Date</label>
        <input class="form-control" id="pr-rdate" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Pathologist</label>
      <input class="form-control" id="pr-path" placeholder="Pathologist name" />
    </div>
    <div class="form-group">
      <label class="form-label">Gross Description</label>
      <textarea class="note-textarea" id="pr-gross" style="min-height:60px" placeholder="Gross description…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Microscopic Description</label>
      <textarea class="note-textarea" id="pr-micro" style="min-height:60px" placeholder="Microscopic description…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Diagnosis</label>
      <textarea class="note-textarea" id="pr-dx" style="min-height:60px" placeholder="Pathologic diagnosis…"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="pr-status">
          <option>Final</option><option>Preliminary</option><option>Addendum</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="pr-notes" style="min-height:60px" placeholder="Additional notes…"></textarea>
    </div>
  `;

  openModal({
    title: 'Add Pathology Result',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="pr-cancel">Cancel</button>
                 <button class="btn btn-primary" id="pr-save">Save Result</button>`,
    size: 'lg',
  });

  document.getElementById('pr-cancel').addEventListener('click', closeModal);
  document.getElementById('pr-save').addEventListener('click', () => {
    const specimenType = document.getElementById('pr-type').value.trim();
    if (!specimenType) { showToast('Specimen type is required.', 'error'); return; }
    const cDate = document.getElementById('pr-cdate').value;
    const rDate = document.getElementById('pr-rdate').value;
    savePathResult({
      patientId,
      specimenType,
      specimenSite:   document.getElementById('pr-site').value.trim(),
      collectionDate: cDate ? new Date(cDate).toISOString() : new Date().toISOString(),
      resultDate:     rDate ? new Date(rDate).toISOString() : new Date().toISOString(),
      pathologist:    document.getElementById('pr-path').value.trim(),
      grossDesc:      document.getElementById('pr-gross').value,
      microDesc:      document.getElementById('pr-micro').value,
      diagnosis:      document.getElementById('pr-dx').value,
      status:         document.getElementById('pr-status').value,
      notes:          document.getElementById('pr-notes').value,
    });
    closeModal();
    showToast('Pathology result saved.', 'success');
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
   COMMUNICATION TAB
   ============================================================ */
function buildCommunicationSection(patientId) {
  const user = getSessionUser();
  const patient = getPatient(patientId);

  // Get all messages involving this patient, sorted newest first
  const messages = getMessagesByPatient(patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const card = chartCard('Patient Communication', (() => {
    const btn = makeBtn('+ New Message', 'btn btn-sm btn-primary', () => openNewMessageModal(patientId));
    return btn;
  })());
  card.id = 'section-communication';

  if (messages.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.style.padding = '12px 16px';
    empty.textContent = 'No messages on file for this patient.';
    card.appendChild(empty);
    return card;
  }

  // Group messages into threads (by threadId)
  const threadMap = new Map();
  messages.forEach(m => {
    const tid = m.threadId || m.id;
    if (!threadMap.has(tid)) threadMap.set(tid, []);
    threadMap.get(tid).push(m);
  });

  const list = document.createElement('div');
  list.className = 'comm-thread-list';

  threadMap.forEach((msgs, threadId) => {
    // Use the first message (newest) as thread header
    const latest = msgs[0];
    const unread = msgs.some(m => m.toId === user.id && m.toType === 'provider' && m.status === 'Sent');

    const row = document.createElement('div');
    row.className = 'comm-thread-row' + (unread ? ' comm-unread' : '');
    row.style.cssText = 'padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; display:flex; gap:12px; align-items:flex-start;';

    // Direction indicator
    const dir = document.createElement('span');
    dir.className = 'comm-dir';
    const toPatient = latest.toType === 'patient';
    dir.textContent = toPatient ? '→' : '←';
    dir.title = toPatient ? 'To patient' : 'From patient';
    dir.style.cssText = `font-size:16px; color:${toPatient ? 'var(--text-muted)' : 'var(--primary)'}; flex-shrink:0; margin-top:2px;`;
    row.appendChild(dir);

    const info = document.createElement('div');
    info.style.cssText = 'flex:1; min-width:0;';

    const topLine = document.createElement('div');
    topLine.style.cssText = 'display:flex; justify-content:space-between; gap:8px;';

    const subject = document.createElement('span');
    subject.style.cssText = 'font-weight:' + (unread ? '700' : '500') + '; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    subject.textContent = latest.subject || '(no subject)';
    topLine.appendChild(subject);

    const dateEl = document.createElement('span');
    dateEl.style.cssText = 'font-size:11px; color:var(--text-muted); flex-shrink:0;';
    dateEl.textContent = formatDateTime(latest.createdAt);
    topLine.appendChild(dateEl);

    info.appendChild(topLine);

    const preview = document.createElement('div');
    preview.style.cssText = 'font-size:12px; color:var(--text-muted); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    const fromLabel = latest.fromName || (latest.fromType === 'patient' ? (patient ? patient.firstName + ' ' + patient.lastName : 'Patient') : 'Provider');
    preview.textContent = fromLabel + ': ' + (latest.body || '').replace(/\s+/g, ' ').trim();
    info.appendChild(preview);

    if (msgs.length > 1) {
      const count = document.createElement('span');
      count.style.cssText = 'font-size:11px; color:var(--text-muted); margin-top:2px; display:block;';
      count.textContent = msgs.length + ' messages in thread';
      info.appendChild(count);
    }

    row.appendChild(info);

    row.addEventListener('click', () => openMessageThreadModal(threadId, patientId));
    list.appendChild(row);
  });

  card.appendChild(list);
  return card;
}

function openNewMessageModal(patientId) {
  const user = getSessionUser();
  const patient = getPatient(patientId);
  if (!patient) return;
  const patientName = patient.firstName + ' ' + patient.lastName;

  openModal({
    title: 'New Message to ' + esc(patientName),
    bodyHTML: `
      <div class="form-group">
        <label>Subject</label>
        <input id="msg-subject" class="form-control" placeholder="Subject" />
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea id="msg-body" class="form-control" rows="5" placeholder="Type your message..."></textarea>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="msg-priority" class="form-control">
          <option>Normal</option>
          <option>High</option>
          <option>Urgent</option>
        </select>
      </div>`,
    footerHTML: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="send-msg-btn">Send</button>`,
  });

  document.getElementById('send-msg-btn').addEventListener('click', () => {
    const subject = document.getElementById('msg-subject').value.trim();
    const body    = document.getElementById('msg-body').value.trim();
    const priority = document.getElementById('msg-priority').value;
    if (!body) { showToast('Please enter a message body.', 'error'); return; }

    saveMessage({
      fromType: 'provider',
      fromId:   user.id,
      fromName: user.firstName + ' ' + user.lastName + (user.degree ? ', ' + user.degree : ''),
      toType:   'patient',
      toId:     patientId,
      toName:   patientName,
      patientId,
      subject:  subject || '(no subject)',
      body,
      priority,
      status:   'Sent',
    });

    closeModal();
    showToast('Message sent.', 'success');
    // Refresh the chart to show new message
    renderChart(patientId);
  });
}

function openMessageThreadModal(threadId, patientId) {
  const user = getSessionUser();
  const patient = getPatient(patientId);
  const thread = getMessageThread(threadId);
  if (!thread.length) return;

  // Mark unread messages as read
  thread.forEach(m => {
    if (m.toId === user.id && m.toType === 'provider' && m.status === 'Sent') {
      markMessageRead(m.id);
    }
  });

  const subject = thread[0].subject || '(no subject)';

  const messagesHTML = thread.map(m => {
    const fromPatient = m.fromType === 'patient';
    const name = m.fromName || (fromPatient ? 'Patient' : 'Provider');
    return `
      <div class="comm-msg-bubble ${fromPatient ? 'comm-from-patient' : 'comm-from-provider'}">
        <div class="comm-msg-meta">${esc(name)} · ${esc(formatDateTime(m.createdAt))}</div>
        <div class="comm-msg-body">${esc(m.body || '')}</div>
      </div>`;
  }).join('');

  openModal({
    title: esc(subject),
    bodyHTML: `
      <div class="comm-thread-view">${messagesHTML}</div>
      <hr style="margin:12px 0;">
      <div class="form-group" style="margin:0;">
        <label>Reply</label>
        <textarea id="reply-body" class="form-control" rows="3" placeholder="Type your reply..."></textarea>
      </div>`,
    footerHTML: `
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" id="send-reply-btn">Send Reply</button>`,
  });

  document.getElementById('send-reply-btn').addEventListener('click', () => {
    const body = document.getElementById('reply-body').value.trim();
    if (!body) { showToast('Please enter a reply.', 'error'); return; }
    const patientName = patient ? patient.firstName + ' ' + patient.lastName : '';
    saveMessage({
      threadId,
      fromType: 'provider',
      fromId:   user.id,
      fromName: user.firstName + ' ' + user.lastName + (user.degree ? ', ' + user.degree : ''),
      toType:   'patient',
      toId:     patientId,
      toName:   patientName,
      patientId,
      subject,
      body,
      priority: 'Normal',
      status:   'Sent',
    });
    closeModal();
    showToast('Reply sent.', 'success');
    renderChart(patientId);
  });
}
