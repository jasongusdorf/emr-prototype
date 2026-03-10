/* ============================================================
   views/dashboard.js — Patient list + search + New Patient modal
   + Summary bar, alerts, upcoming appointments, My Patients
   ============================================================ */

let _dashMyPatientsOnly = false;

/* WS8d: Inject PT/SLP/Aspiration columns into PATIENT_COLUMNS at load time */
(function _injectWS8Columns() {
  if (typeof PATIENT_COLUMNS === 'undefined') return;
  var ws8Cols = [
    { key: 'ptStatus',               label: 'PT Status',               default: false, sortable: false },
    { key: 'dietTexture',            label: 'Diet (IDDSI)',            default: false, sortable: false },
    { key: 'aspirationPrecautions',  label: 'Asp. Precautions',       default: false, sortable: false },
  ];
  ws8Cols.forEach(function(col) {
    if (!PATIENT_COLUMNS.find(function(c) { return c.key === col.key; })) {
      PATIENT_COLUMNS.push(col);
    }
  });
})();

function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const mode = getEncounterMode();
  const isInpatient = mode === 'inpatient';

  const canEdit = canEditPatient();
  setTopbar({
    title:   isInpatient ? 'Inpatient Census' : 'Patient Dashboard',
    meta:    '',
    actions: isInpatient
      ? '<button class="btn btn-primary btn-sm" id="btn-new-patient"' + (canEdit ? '' : ' disabled title="You do not have permission to add patients"') + '>+ Admit Patient</button>'
      : '<button class="btn btn-primary btn-sm" id="btn-new-patient"' + (canEdit ? '' : ' disabled title="You do not have permission to add patients"') + '>+ New Patient</button>',
  });
  setActiveNav('dashboard');

  const allPatients = isInpatient
    ? getPatientsWithActiveInpatientEncounters().sort((a, b) =>
        (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName))
    : getPatients().sort((a, b) =>
        (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));

  // ===== Physician Header =====
  const currentUser = getSessionUser();
  const currentProvider = currentUser ? getProvider(currentUser.id) : null;
  if (currentProvider) {
    const physicianHeader = document.createElement('div');
    physicianHeader.className = 'dashboard-physician-header';

    const nameEl = document.createElement('div');
    nameEl.className = 'dashboard-physician-name';
    nameEl.textContent = currentProvider.firstName + ' ' + currentProvider.lastName + ', ' + currentProvider.degree;

    physicianHeader.appendChild(nameEl);

    const clinicType = !isInpatient ? (localStorage.getItem('emr_op_clinic_type') || '') : '';
    const clinicName = !isInpatient ? (localStorage.getItem('emr_op_clinic_name') || '') : '';
    const clinicText = [clinicType, clinicName].filter(Boolean).join(' · ');

    const locationRow = document.createElement('div');
    locationRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:4px;';

    if (clinicText) {
      const locationEl = document.createElement('div');
      locationEl.className = 'dashboard-physician-location';
      locationEl.style.marginTop = '0';
      locationEl.textContent = clinicText;
      locationRow.appendChild(locationEl);
    }

    const cogBtn = document.createElement('button');
    cogBtn.className = 'btn-clinic-cog';
    cogBtn.title = 'Edit clinic location';
    cogBtn.textContent = '';
    cogBtn.addEventListener('click', () => {
      const curType = localStorage.getItem(typeKey) || '';
      const curName = localStorage.getItem(nameKey) || '';
      const opts = types.map(t => '<option value="' + esc(t) + '"' + (curType === t ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
      openModal({
        title: isInpatient ? 'Edit Inpatient Service' : 'Edit Clinic Location',
        bodyHTML:
          '<div class="form-group">' +
            '<label class="form-label">' + (isInpatient ? 'Service Type' : 'Clinic Type') + '</label>' +
            '<select class="form-control" id="cog-type"><option value="">— Select —</option>' + opts + '</select>' +
          '</div>' +
          '<div class="form-group" style="margin-top:12px;">' +
            '<label class="form-label">' + (isInpatient ? 'Service / Team Name' : 'Clinic Name') + '</label>' +
            '<input class="form-control" id="cog-name" value="' + esc(curName) + '" placeholder="' + (isInpatient ? 'e.g. Cardiology Team A' : 'e.g. Downtown Internal Medicine') + '">' +
          '</div>',
        footerHTML: '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="cog-save">Save</button>',
      });
      document.getElementById('cog-save').addEventListener('click', () => {
        localStorage.setItem(typeKey, document.getElementById('cog-type').value);
        localStorage.setItem(nameKey, document.getElementById('cog-name').value.trim());
        closeModal();
        renderDashboard();
      });
    });
    locationRow.appendChild(cogBtn);
    physicianHeader.appendChild(locationRow);

    app.appendChild(physicianHeader);
  }

  // ===== Summary Bar =====
  const summaryBar = document.createElement('div');
  summaryBar.className = 'dashboard-summary-bar';

  let stats;
  if (isInpatient) {
    const inpatientEncs = getEncounters().filter(e =>
      (e.visitType || '').toLowerCase() === 'inpatient' && e.status !== 'Signed' && e.status !== 'Cancelled');
    const inpatientEncIds = new Set(inpatientEncs.map(e => e.id));
    const unsignedCount = getNotes().filter(n => !n.signed && inpatientEncIds.has(n.encounterId)).length;
    const pendingOrdersCount = getOrders().filter(o => o.status === 'Pending' && inpatientEncIds.has(o.encounterId)).length;
    stats = [
      { value: allPatients.length, label: 'Census Count', cls: '' },
      { value: inpatientEncs.length, label: 'Active Admissions', cls: '' },
      { value: unsignedCount, label: 'Unsigned Notes', cls: unsignedCount > 0 ? 'stat-warning' : '' },
      { value: pendingOrdersCount, label: 'Pending Orders', cls: pendingOrdersCount > 0 ? 'stat-warning' : '' },
    ];
  } else {
    const unsignedCount = getNotes().filter(n => !n.signed).length;
    const pendingOrdersCount = getOrders().filter(o => o.status === 'Pending').length;
    stats = [
      { value: unsignedCount,      label: 'Unsigned Notes', cls: unsignedCount > 0 ? 'stat-warning' : '' },
      { value: pendingOrdersCount, label: 'Pending Orders', cls: pendingOrdersCount > 0 ? 'stat-warning' : '' },
    ];
  }

  // Make stats clickable where they link to inbox tabs
  const statActions = {
    'Unsigned Notes':      () => { navigate('#inbox'); setTimeout(() => { const t = document.querySelector('[data-inbox-tab="notes"]'); if (t) t.click(); }, 100); },
    'Pending Orders':      () => { navigate('#inbox'); setTimeout(() => { const t = document.querySelector('[data-inbox-tab="orders"]'); if (t) t.click(); }, 100); },
    'Overdue Screenings':  null,
    'Total Patients':      null,
    'Census Count':        null,
    'Active Admissions':   null,
  };

  stats.forEach(s => {
    const stat = document.createElement('div');
    stat.className = 'summary-stat';
    if (statActions[s.label]) {
      stat.classList.add('summary-stat-clickable');
      stat.title = 'Click to view ' + s.label.toLowerCase();
      stat.addEventListener('click', statActions[s.label]);
    }
    const val = document.createElement('div');
    val.className = 'summary-stat-value' + (s.cls ? ' ' + s.cls : '');
    val.textContent = s.value;
    const lbl = document.createElement('div');
    lbl.className = 'summary-stat-label';
    lbl.textContent = s.label;
    stat.appendChild(val);
    stat.appendChild(lbl);
    summaryBar.appendChild(stat);
  });
  app.appendChild(summaryBar);

  // ===== Inpatient Sign-In Card =====
  if (isInpatient && currentUser) {
    var signIn = typeof getInpatientSignIn === 'function' ? getInpatientSignIn(currentUser.id) : null;
    var signInCard = document.createElement('div');
    signInCard.className = 'card ip-signin-card';
    signInCard.style.marginBottom = '16px';

    if (!signIn) {
      // Not signed in — show sign-in form
      signInCard.innerHTML =
        '<div class="ip-signin-content">' +
          '<div class="ip-signin-icon"></div>' +
          '<div class="ip-signin-text">' +
            '<div class="ip-signin-title">Sign In to Service</div>' +
            '<div class="ip-signin-desc">Select your role to load your inpatient patient list.</div>' +
          '</div>' +
          '<div class="ip-signin-form">' +
            '<select class="form-control form-control-sm" id="ip-role-select">' +
            (typeof INPATIENT_ROLES !== 'undefined' ? INPATIENT_ROLES : ['Attending','Resident','Intern','NP','PA','Nurse']).map(function(r) {
              return '<option value="' + r + '">' + r + '</option>';
            }).join('') +
            '</select>' +
            '<button class="btn btn-primary btn-sm" id="ip-sign-in-btn">Sign In</button>' +
          '</div>' +
        '</div>';
      app.appendChild(signInCard);

      document.getElementById('ip-sign-in-btn').addEventListener('click', function() {
        var role = document.getElementById('ip-role-select').value;
        if (typeof saveInpatientSignIn === 'function') {
          saveInpatientSignIn({ userId: currentUser.id, role: role });
        }
        if (typeof refreshInpatientSidebar === 'function') refreshInpatientSidebar();
        showToast('Signed in as ' + role, 'success');
        renderDashboard();
      });
    } else {
      // Already signed in — show status with sign-out
      signInCard.innerHTML =
        '<div class="ip-signin-content ip-signed-in">' +
          '<div class="ip-signin-icon"></div>' +
          '<div class="ip-signin-text">' +
            '<div class="ip-signin-title">Signed In</div>' +
            '<div class="ip-signin-desc">Role: <strong>' + esc(signIn.role) + '</strong> · Since ' + formatDateTime(signIn.signedInAt) + '</div>' +
          '</div>' +
          '<button class="btn btn-secondary btn-sm" id="ip-sign-out-btn">Sign Out</button>' +
        '</div>';
      app.appendChild(signInCard);

      document.getElementById('ip-sign-out-btn').addEventListener('click', function() {
        if (typeof clearInpatientSignIn === 'function') clearInpatientSignIn(currentUser.id);
        if (typeof refreshInpatientSidebar === 'function') refreshInpatientSidebar();
        showToast('Signed out of service', 'success');
        renderDashboard();
      });
    }
  }

  // ===== Upcoming Appointments Card (outpatient only) =====
  if (!isInpatient) {
    const now = new Date();
    const upcomingAppts = getAppointments()
      .filter(a => new Date(a.dateTime) >= now && a.status !== 'Cancelled' && a.status !== 'No-Show')
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      .slice(0, 10);

    const apptCard = document.createElement('div');
    apptCard.className = 'card';
    apptCard.style.marginBottom = '16px';
    const apptHdr = document.createElement('div');
    apptHdr.className = 'card-header';
    const apptTitle = document.createElement('span');
    apptTitle.className = 'card-title';
    apptTitle.textContent = 'Upcoming Appointments';
    const schedLink = document.createElement('button');
    schedLink.className = 'btn btn-secondary btn-sm';
    schedLink.textContent = 'View Schedule';
    schedLink.onclick = () => navigate('#schedule');
    apptHdr.appendChild(apptTitle);
    apptHdr.appendChild(schedLink);
    apptCard.appendChild(apptHdr);

    if (upcomingAppts.length === 0) {
      apptCard.appendChild(buildEmptyState('', 'No upcoming appointments', 'Schedule an appointment from the Schedule tab.'));
    } else {
      upcomingAppts.forEach(appt => {
        const patient = getPatient(appt.patientId);
        const provider = getProvider(appt.providerId);
        const item = document.createElement('div');
        item.className = 'upcoming-appt-item';
        item.addEventListener('click', () => navigate('#schedule'));

        const time = document.createElement('span');
        time.className = 'upcoming-appt-time';
        time.textContent = formatDateTime(appt.dateTime);
        const name = document.createElement('span');
        name.className = 'upcoming-appt-patient';
        name.textContent = patient ? patient.lastName + ', ' + patient.firstName : 'Unknown';
        const type = document.createElement('span');
        type.className = 'upcoming-appt-type';
        type.textContent = appt.visitType;
        const prov = document.createElement('span');
        prov.className = 'upcoming-appt-provider';
        prov.textContent = provider ? provider.lastName + ', ' + provider.firstName : '—';

        item.appendChild(time);
        item.appendChild(name);
        item.appendChild(type);
        item.appendChild(prov);
        apptCard.appendChild(item);
      });
    }
    app.appendChild(apptCard);
  }

  // ===== Clinic / Service Info Card =====
  const infoCard = document.createElement('div');
  infoCard.className = 'card';
  infoCard.style.marginBottom = '16px';

  const infoHdr = document.createElement('div');
  infoHdr.className = 'card-header';
  const infoTitle = document.createElement('span');
  infoTitle.className = 'card-title';
  infoTitle.textContent = isInpatient ? 'Inpatient Service' : 'Clinic Information';
  infoHdr.appendChild(infoTitle);
  infoCard.appendChild(infoHdr);

  const OP_TYPES = [
    'General Internal Medicine', 'Family Medicine', 'Cardiology', 'Pulmonology',
    'Gastroenterology', 'Nephrology', 'Neurology', 'Oncology', 'Endocrinology',
    'Rheumatology', 'Psychiatry', 'Pediatrics', 'Dermatology', 'Urgent Care',
    'Obstetrics/Gynecology', 'Urology', 'ENT', 'Ophthalmology', 'Orthopedics',
    'Pain Management', 'Infectious Disease', 'Allergy/Immunology', 'Other',
  ];
  const IP_TYPES = [
    'General Medicine / Hospitalist', 'Cardiology', 'Pulmonology / Critical Care',
    'Gastroenterology', 'Nephrology', 'Neurology', 'Oncology / Hematology',
    'Surgery — General', 'Surgery — Orthopedic', 'Obstetrics/Gynecology',
    'Psychiatry', 'Pediatrics', 'ICU / MICU', 'CCU', 'Infectious Disease',
    'Transplant', 'Trauma', 'Other',
  ];
  const types = isInpatient ? IP_TYPES : OP_TYPES;
  const typeKey = isInpatient ? 'emr_ip_service_type' : 'emr_op_clinic_type';
  const nameKey = isInpatient ? 'emr_ip_service_name' : 'emr_op_clinic_name';

  const savedType = localStorage.getItem(typeKey) || '';
  const savedName = localStorage.getItem(nameKey) || '';

  const infoBody = document.createElement('div');
  infoBody.style.cssText = 'padding:16px 24px;';

  function renderInfoBody() {
    infoBody.innerHTML = '';
    const curType = localStorage.getItem(typeKey) || '';
    const curName = localStorage.getItem(nameKey) || '';

    if (curType && curName) {
      // Read-only display
      const readView = document.createElement('div');
      readView.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:16px;';

      const text = document.createElement('div');
      text.style.cssText = 'font-size:14px;color:var(--text-primary);';
      text.innerHTML = '<strong>' + esc(curType) + '</strong> · ' + esc(curName);

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-clinic-cog';
      editBtn.style.fontSize = '14px';
      editBtn.title = isInpatient ? 'Edit inpatient service' : 'Edit clinic information';
      editBtn.textContent = '';
      editBtn.addEventListener('click', () => {
        renderInfoForm();
      });

      readView.appendChild(text);
      readView.appendChild(editBtn);
      infoBody.appendChild(readView);
    } else {
      renderInfoForm();
    }
  }

  function renderInfoForm() {
    infoBody.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';

    const typeGroup = document.createElement('div');
    typeGroup.className = 'form-group';
    typeGroup.style.margin = '0';
    const typeLabel = document.createElement('label');
    typeLabel.className = 'form-label';
    typeLabel.textContent = isInpatient ? 'Service Type' : 'Clinic Type';
    const typeSelect = document.createElement('select');
    typeSelect.className = 'form-control';
    typeSelect.innerHTML = '<option value="">— Select —</option>' +
      types.map(t => '<option value="' + t + '"' + ((localStorage.getItem(typeKey) || '') === t ? ' selected' : '') + '>' + t + '</option>').join('');
    typeSelect.addEventListener('change', () => {
      localStorage.setItem(typeKey, typeSelect.value);
      if (typeSelect.value && nameInput.value.trim()) { renderInfoBody(); renderDashboard(); }
    });
    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(typeSelect);

    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';
    nameGroup.style.margin = '0';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'form-label';
    nameLabel.textContent = isInpatient ? 'Service / Team Name' : 'Clinic Name';
    const nameInput = document.createElement('input');
    nameInput.className = 'form-control';
    nameInput.placeholder = isInpatient ? 'e.g. Cardiology Team A' : 'e.g. Downtown Internal Medicine';
    nameInput.value = localStorage.getItem(nameKey) || '';
    nameInput.addEventListener('input', () => {
      localStorage.setItem(nameKey, nameInput.value.trim());
      if (typeSelect.value && nameInput.value.trim()) { renderInfoBody(); renderDashboard(); }
    });
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    grid.appendChild(typeGroup);
    grid.appendChild(nameGroup);
    infoBody.appendChild(grid);
  }

  renderInfoBody();
  infoCard.appendChild(infoBody);
  app.appendChild(infoCard);

  // Topbar new patient (RBAC-gated)
  const newPatBtn = document.getElementById('btn-new-patient');
  if (newPatBtn && !newPatBtn.disabled) {
    newPatBtn.addEventListener('click', () => openNewPatientModal());
  }

}

/* ============================================================
   PATIENTS PAGE — Dynamic columns, filters, sort, pagination,
   quick actions, visual flags
   ============================================================ */
let _patientsMyOnly = false;
let _activeFilters = {};
let _sortStack = [{ col: 'name', dir: 'asc' }];
let _currentPage = 1;
let _filterPanelOpen = false;

function renderPatients() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const canEdit = canEditPatient();
  setTopbar({
    title: 'Patients',
    meta: '',
    actions: '<button class="btn btn-primary btn-sm" id="btn-new-patient"' + (canEdit ? '' : ' disabled title="No permission"') + '>+ New Patient</button>',
  });
  setActiveNav('patients');

  const allPatients = getPatients().sort((a, b) =>
    (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));

  const currentProv = getCurrentProvider();
  const user = getSessionUser();
  const providerId = currentProv || (user ? user.id : '');
  const prefs = getPatientListPrefs(providerId);
  const pageSize = prefs.pageSize || 50;

  // Pre-cache clinical data for performance
  const _allergyCache = {};
  const _problemCache = {};
  const _vitalCache = {};
  const _medCache = {};
  const _orderCache = {};
  function getAllergyData(pid) {
    if (!_allergyCache[pid]) _allergyCache[pid] = getPatientAllergies(pid);
    return _allergyCache[pid];
  }
  function getProblemData(pid) {
    if (!_problemCache[pid]) _problemCache[pid] = getActiveProblems(pid);
    return _problemCache[pid];
  }
  function getVitalData(pid) {
    if (!_vitalCache[pid]) _vitalCache[pid] = getLatestVitalsByPatient(pid);
    return _vitalCache[pid];
  }
  function getMedData(pid) {
    if (!_medCache[pid]) _medCache[pid] = getPatientMedications(pid).filter(m => m.status === 'Current');
    return _medCache[pid];
  }
  function getOrderData(pid) {
    if (!_orderCache[pid]) _orderCache[pid] = getOrdersByPatient(pid).filter(o => o.status === 'Pending');
    return _orderCache[pid];
  }

  // ===== Toolbar =====
  const toolbar = document.createElement('div');
  toolbar.className = 'patients-toolbar';

  const searchBar = document.createElement('div');
  searchBar.className = 'search-bar';
  searchBar.style.maxWidth = '400px';
  searchBar.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" id="patient-search" placeholder="Search name, MRN, phone, DOB, insurance…" autocomplete="off" />';
  toolbar.appendChild(searchBar);

  const myToggle = document.createElement('label');
  myToggle.className = 'my-patients-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = _patientsMyOnly;
  checkbox.disabled = !currentProv;
  myToggle.appendChild(checkbox);
  myToggle.appendChild(document.createTextNode(' My Patients'));
  toolbar.appendChild(myToggle);

  // Filters button
  const filtersBtn = document.createElement('button');
  filtersBtn.className = 'btn btn-secondary btn-sm';
  filtersBtn.textContent = 'Filters';
  filtersBtn.addEventListener('click', () => {
    _filterPanelOpen = !_filterPanelOpen;
    filterPanel.classList.toggle('hidden', !_filterPanelOpen);
    filtersBtn.classList.toggle('active', _filterPanelOpen);
  });
  toolbar.appendChild(filtersBtn);

  // Columns button
  const colsBtn = document.createElement('button');
  colsBtn.className = 'btn btn-secondary btn-sm';
  colsBtn.textContent = 'Columns';
  colsBtn.addEventListener('click', () => openColumnCustomizerModal(providerId));
  toolbar.appendChild(colsBtn);

  app.appendChild(toolbar);

  // ===== Filter Panel =====
  const filterPanel = document.createElement('div');
  filterPanel.className = 'filter-panel' + (_filterPanelOpen ? '' : ' hidden');
  filterPanel.innerHTML = renderFilterPanelHTML();
  app.appendChild(filterPanel);

  function renderFilterPanelHTML() {
    const providerOpts = getProviders().map(p =>
      '<option value="' + esc(p.id) + '"' + (_activeFilters.provider === p.id ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + '</option>'
    ).join('');
    return '<div class="filter-panel-grid">' +
      '<div class="form-group filter-group"><label class="form-label">Provider</label>' +
        '<select class="form-control form-control-sm" data-filter="provider"><option value="">All</option>' + providerOpts + '</select></div>' +
      '<div class="form-group filter-group"><label class="form-label">Sex</label>' +
        '<select class="form-control form-control-sm" data-filter="sex"><option value="">All</option>' +
        '<option' + (_activeFilters.sex === 'Male' ? ' selected' : '') + '>Male</option>' +
        '<option' + (_activeFilters.sex === 'Female' ? ' selected' : '') + '>Female</option>' +
        '<option' + (_activeFilters.sex === 'Other' ? ' selected' : '') + '>Other</option></select></div>' +
      '<div class="form-group filter-group"><label class="form-label">Age Min</label>' +
        '<input type="number" class="form-control form-control-sm" data-filter="ageMin" min="0" max="150" value="' + (_activeFilters.ageMin || '') + '" placeholder="0"></div>' +
      '<div class="form-group filter-group"><label class="form-label">Age Max</label>' +
        '<input type="number" class="form-control form-control-sm" data-filter="ageMax" min="0" max="150" value="' + (_activeFilters.ageMax || '') + '" placeholder="150"></div>' +
      '<div class="form-group filter-group"><label class="form-label">Insurance</label>' +
        '<input type="text" class="form-control form-control-sm" data-filter="insurance" value="' + esc(_activeFilters.insurance || '') + '" placeholder="Carrier…"></div>' +
      '<div class="form-group filter-group"><label class="form-label">Code Status</label>' +
        '<select class="form-control form-control-sm" data-filter="codeStatus"><option value="">All</option>' +
        ['Full Code','DNR','DNR/DNI','Comfort Care'].map(s => '<option' + (_activeFilters.codeStatus === s ? ' selected' : '') + '>' + s + '</option>').join('') +
        '</select></div>' +
      '<div class="form-group filter-group"><label class="form-label">Diagnosis / Problem</label>' +
        '<input type="text" class="form-control form-control-sm" data-filter="diagnosis" value="' + esc(_activeFilters.diagnosis || '') + '" placeholder="Search problems…"></div>' +
      '<div class="form-group filter-group filter-checkboxes">' +
        '<label><input type="checkbox" data-filter="hasOverdueScreenings"' + (_activeFilters.hasOverdueScreenings ? ' checked' : '') + '> Overdue Screenings</label>' +
        '<label><input type="checkbox" data-filter="hasUnsignedNotes"' + (_activeFilters.hasUnsignedNotes ? ' checked' : '') + '> Unsigned Notes</label>' +
        '<label><input type="checkbox" data-filter="hasPendingOrders"' + (_activeFilters.hasPendingOrders ? ' checked' : '') + '> Pending Orders</label>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:8px;text-align:right"><button class="btn btn-secondary btn-sm" id="filter-clear-all">Clear All Filters</button></div>';
  }

  // Wire filter panel inputs
  filterPanel.addEventListener('change', e => {
    const el = e.target;
    const key = el.dataset.filter;
    if (!key) return;
    if (el.type === 'checkbox') _activeFilters[key] = el.checked;
    else _activeFilters[key] = el.value;
    _currentPage = 1;
    renderChips();
    renderRows();
  });
  filterPanel.addEventListener('input', e => {
    const el = e.target;
    const key = el.dataset.filter;
    if (!key || el.type === 'checkbox' || el.tagName === 'SELECT') return;
    _activeFilters[key] = el.value;
    _currentPage = 1;
    renderChips();
    renderRows();
  });
  const clearAllBtn = filterPanel.querySelector('#filter-clear-all');
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
    _activeFilters = {};
    filterPanel.innerHTML = renderFilterPanelHTML();
    // re-wire events
    filterPanel.addEventListener('change', e => {
      const el = e.target; const key = el.dataset.filter; if (!key) return;
      if (el.type === 'checkbox') _activeFilters[key] = el.checked; else _activeFilters[key] = el.value;
      _currentPage = 1; renderChips(); renderRows();
    });
    _currentPage = 1;
    renderChips();
    renderRows();
  });

  // ===== Filter Chips =====
  const chipsContainer = document.createElement('div');
  chipsContainer.className = 'filter-chips';
  app.appendChild(chipsContainer);

  function renderChips() {
    chipsContainer.innerHTML = '';
    const labels = {
      provider: 'Provider', sex: 'Sex', ageMin: 'Age Min', ageMax: 'Age Max',
      insurance: 'Insurance', codeStatus: 'Code Status', diagnosis: 'Diagnosis',
      hasOverdueScreenings: 'Overdue Screenings', hasUnsignedNotes: 'Unsigned Notes', hasPendingOrders: 'Pending Orders',
    };
    Object.keys(_activeFilters).forEach(key => {
      const val = _activeFilters[key];
      if (!val && val !== true) return;
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      let displayVal = val;
      if (key === 'provider') {
        const prov = getProvider(val);
        displayVal = prov ? prov.lastName + ', ' + prov.firstName : val;
      }
      if (typeof val === 'boolean') displayVal = 'Yes';
      chip.innerHTML = esc(labels[key] || key) + ': <strong>' + esc(String(displayVal)) + '</strong> <button class="filter-chip-remove" data-chip-key="' + esc(key) + '">&times;</button>';
      chipsContainer.appendChild(chip);
    });
    chipsContainer.querySelectorAll('.filter-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        delete _activeFilters[btn.dataset.chipKey];
        // Sync filter panel
        const el = filterPanel.querySelector('[data-filter="' + btn.dataset.chipKey + '"]');
        if (el) { if (el.type === 'checkbox') el.checked = false; else el.value = ''; }
        _currentPage = 1;
        renderChips();
        renderRows();
      });
    });
  }
  renderChips();

  // ===== Table Card =====
  const card = document.createElement('div');
  card.className = 'card';
  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const cardTitle = document.createElement('span');
  cardTitle.className = 'card-title';
  cardTitle.textContent = 'All Patients';
  const countEl = document.createElement('span');
  countEl.className = 'text-muted text-sm';
  countEl.id = 'patient-count';
  hdr.appendChild(cardTitle);
  hdr.appendChild(countEl);
  card.appendChild(hdr);

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table';

  // Build dynamic columns from prefs + always actions
  function getActiveCols() {
    const colKeys = prefs.columns && prefs.columns.length > 0 ? prefs.columns : getDefaultColumnKeys();
    const cols = colKeys.map(key => PATIENT_COLUMNS.find(c => c.key === key)).filter(Boolean);
    cols.push({ key: 'actions', label: '', sortable: false });
    return cols;
  }

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  function buildHeader() {
    headerRow.innerHTML = '';
    const cols = getActiveCols();
    cols.forEach(col => {
      const th = document.createElement('th');
      if (col.sortable) {
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';
        th.addEventListener('click', e => {
          if (e.shiftKey) {
            // Add to sort stack
            const existing = _sortStack.findIndex(s => s.col === col.key);
            if (existing >= 0) {
              _sortStack[existing].dir = _sortStack[existing].dir === 'asc' ? 'desc' : 'asc';
            } else {
              _sortStack.push({ col: col.key, dir: 'asc' });
            }
          } else {
            const existing = _sortStack.find(s => s.col === col.key);
            if (existing && _sortStack.length === 1) {
              existing.dir = existing.dir === 'asc' ? 'desc' : 'asc';
            } else {
              _sortStack = [{ col: col.key, dir: (existing ? (existing.dir === 'asc' ? 'desc' : 'asc') : 'asc') }];
            }
          }
          updateSortIndicators();
          renderRows();
        });
      }
      th.dataset.colKey = col.key;
      th.textContent = col.label;
      headerRow.appendChild(th);
    });
    updateSortIndicators();
  }

  function updateSortIndicators() {
    const cols = getActiveCols();
    headerRow.querySelectorAll('th[data-col-key]').forEach(th => {
      const key = th.dataset.colKey;
      const sortIdx = _sortStack.findIndex(s => s.col === key);
      const base = cols.find(c => c.key === key)?.label || '';
      if (sortIdx >= 0) {
        const arrow = _sortStack[sortIdx].dir === 'asc' ? ' ▲' : ' ▼';
        const num = _sortStack.length > 1 ? (sortIdx + 1) : '';
        th.textContent = base + arrow + num;
      } else {
        th.textContent = base;
      }
    });
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);
  buildHeader();

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);

  // ===== Pagination controls =====
  const paginationBar = document.createElement('div');
  paginationBar.className = 'pagination-bar';
  card.appendChild(paginationBar);

  app.appendChild(card);

  // ===== Cell content helper =====
  function getCellContent(pat, colKey) {
    switch (colKey) {
      case 'name': {
        const td = document.createElement('td');
        td.style.cursor = 'pointer';
        const nameBtn = document.createElement('button');
        nameBtn.className = 'table-link';
        nameBtn.textContent = pat.lastName + ', ' + pat.firstName;
        nameBtn.onclick = e => { e.stopPropagation(); navigate('#chart/' + pat.id); };
        td.appendChild(nameBtn);
        // Visual flag badges
        const flags = document.createElement('span');
        flags.className = 'flag-badges-inline';
        const cs = pat.codeStatus || '';
        if (cs && cs !== 'Full Code') {
          const badge = document.createElement('span');
          badge.className = 'flag-badge flag-code-status';
          badge.textContent = cs;
          flags.appendChild(badge);
        }
        if (flags.children.length > 0) td.appendChild(flags);
        return td;
      }
      case 'age': return createTd(String(calcAge(pat.dob)));
      case 'sex': return createTd(pat.sex || '—');
      case 'dob': return createTd(formatDate(pat.dob));
      case 'lastEncounter': {
        const d = getLastEncDate(pat.id);
        return createTd(d ? formatDate(d) : '—');
      }
      case 'mrn': return createTd(pat.mrn);
      case 'phone': return createTd(pat.phone || '—');
      case 'insurance': return createTd(pat.insurance || '—');
      case 'codeStatus': return createTd(pat.codeStatus || 'Full Code');
      case 'allergies': {
        const a = getAllergyData(pat.id);
        return createTd(a.length > 0 ? a.map(x => x.allergen).join(', ') : 'NKA');
      }
      case 'activeMeds': {
        const meds = getMedData(pat.id);
        return createTd(meds.length > 0 ? meds.length + ' active' : '—');
      }
      case 'problems': {
        const probs = getProblemData(pat.id);
        return createTd(probs.length > 0 ? probs.map(p => p.name).join(', ') : '—');
      }
      case 'provider': {
        const providers = (pat.panelProviders || []).map(id => getProvider(id)).filter(Boolean);
        return createTd(providers.length > 0 ? providers.map(p => p.lastName).join(', ') : '—');
      }
      case 'lastVitals': {
        const v = getVitalData(pat.id);
        if (v && v.vitals) {
          const bp = (v.vitals.bpSystolic && v.vitals.bpDiastolic) ? v.vitals.bpSystolic + '/' + v.vitals.bpDiastolic : '';
          const hr = v.vitals.heartRate || '';
          return createTd([bp, hr ? 'HR ' + hr : ''].filter(Boolean).join(', ') || '—');
        }
        return createTd('—');
      }
      case 'pendingOrders': {
        const orders = getOrderData(pat.id);
        return createTd(orders.length > 0 ? orders.length + ' pending' : '—');
      }
      case 'alerts': {
        const td = document.createElement('td');
        const badges = document.createElement('div');
        badges.className = 'alert-badges';
        const overdues = getOverdueScreeningsCount(pat);
        if (overdues > 0) { const b = document.createElement('span'); b.className = 'alert-badge alert-badge-red'; b.textContent = overdues + ' overdue'; badges.appendChild(b); }
        const unsigned = getUnsignedNotesCount(pat.id);
        if (unsigned > 0) { const b = document.createElement('span'); b.className = 'alert-badge alert-badge-amber'; b.textContent = unsigned + ' unsigned'; badges.appendChild(b); }
        const pending = getOrderData(pat.id).length;
        if (pending > 0) { const b = document.createElement('span'); b.className = 'alert-badge alert-badge-blue'; b.textContent = pending + ' pending'; badges.appendChild(b); }
        td.appendChild(badges);
        return td;
      }
      // 8g: Fall Risk column
      case 'fallRisk': {
        const td = document.createElement('td');
        if (typeof getNursingAssessments === 'function') {
          const morseList = getNursingAssessments(pat.id)
            .filter(function(a) { return a.type === 'Morse Fall Risk' || a.type === 'morse' || a.morseScore !== undefined; })
            .sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
          if (morseList.length > 0) {
            var score = morseList[0].score !== undefined ? parseInt(morseList[0].score) : parseInt(morseList[0].morseScore);
            if (!isNaN(score)) {
              var badge = document.createElement('span');
              badge.style.cssText = 'padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600';
              if (score >= 45) {
                badge.style.background = 'var(--badge-danger-bg)'; badge.style.color = 'var(--badge-danger-text)';
                badge.textContent = score + ' HIGH';
              } else if (score >= 25) {
                badge.style.background = 'var(--badge-warning-bg)'; badge.style.color = 'var(--badge-warning-text)';
                badge.textContent = score + ' MOD';
              } else {
                badge.style.background = 'var(--badge-success-bg)'; badge.style.color = 'var(--badge-success-text)';
                badge.textContent = score + ' LOW';
              }
              td.appendChild(badge);
            } else {
              td.textContent = '—';
            }
          } else {
            td.textContent = '—';
          }
        } else {
          td.textContent = '—';
        }
        return td;
      }
      // 8h: Vitals summary column
      case 'vitalsSummary': {
        const v = getVitalData(pat.id);
        if (v && v.vitals) {
          const bp = (v.vitals.bpSystolic && v.vitals.bpDiastolic) ? v.vitals.bpSystolic + '/' + v.vitals.bpDiastolic : '';
          const hr = v.vitals.heartRate ? 'HR ' + v.vitals.heartRate : '';
          return createTd([bp, hr].filter(Boolean).join(', ') || '—');
        }
        return createTd('—');
      }
      // 8h: Care plan count column
      case 'carePlanCount': {
        const td = document.createElement('td');
        if (typeof getCarePlans === 'function') {
          var plans = getCarePlans(pat.id).filter(function(cp) { return cp.status === 'Active'; });
          td.textContent = plans.length > 0 ? plans.length + ' active' : '—';
        } else {
          td.textContent = '—';
        }
        return td;
      }
      // WS8d: PT Status column
      case 'ptStatus': {
        const td = document.createElement('td');
        td.style.color = 'var(--accent-pt)';
        if (typeof getPTEvaluations === 'function') {
          var ptEvalsDash = getPTEvaluations(pat.id).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
          if (ptEvalsDash.length > 0) {
            var ptE = ptEvalsDash[0];
            var parts = [];
            if (ptE.activityLevel || ptE.functionalMobility) parts.push(ptE.activityLevel || ptE.functionalMobility);
            if (ptE.assistiveDevice) parts.push(ptE.assistiveDevice);
            td.textContent = parts.length > 0 ? parts.join(' / ') : '—';
          } else {
            td.textContent = '—';
          }
        } else {
          td.textContent = '—';
        }
        return td;
      }
      // WS8d: Diet Texture column
      case 'dietTexture': {
        const td = document.createElement('td');
        td.style.color = 'var(--accent-slp)';
        if (typeof getSLPDietRecommendations === 'function') {
          var slpRecsDash = getSLPDietRecommendations(pat.id).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
          if (slpRecsDash.length > 0) {
            var dr = slpRecsDash[0];
            td.textContent = (dr.foodLevel != null && dr.liquidLevel != null) ? 'IDDSI ' + dr.foodLevel + '/' + dr.liquidLevel : (dr.foodLevel != null ? 'IDDSI ' + dr.foodLevel : '—');
          } else {
            td.textContent = '—';
          }
        } else {
          td.textContent = '—';
        }
        return td;
      }
      // WS8d: Aspiration Precautions column
      case 'aspirationPrecautions': {
        const td = document.createElement('td');
        if (typeof getSLPDietRecommendations === 'function') {
          var slpRecsAsp = getSLPDietRecommendations(pat.id).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
          if (slpRecsAsp.length > 0) {
            var sr = slpRecsAsp[0];
            var hasPrec = sr.precautions && (Array.isArray(sr.precautions) ? sr.precautions.length > 0 : !!sr.precautions);
            var badge = document.createElement('span');
            badge.style.cssText = 'padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600';
            if (hasPrec) {
              badge.style.background = 'var(--badge-danger-bg)'; badge.style.color = 'var(--badge-danger-text)';
              badge.textContent = 'Y';
            } else {
              badge.style.background = 'var(--badge-success-bg)'; badge.style.color = 'var(--badge-success-text)';
              badge.textContent = 'N';
            }
            td.appendChild(badge);
          } else {
            td.textContent = '—';
          }
        } else {
          td.textContent = '—';
        }
        return td;
      }
      case 'actions': {
        const td = document.createElement('td');
        td.style.cssText = 'text-align:right;white-space:nowrap';
        // Quick actions "..." dropdown
        const moreBtn = document.createElement('button');
        moreBtn.className = 'btn btn-secondary btn-sm quick-action-trigger';
        moreBtn.style.marginLeft = '4px';
        moreBtn.textContent = '···';
        moreBtn.onclick = e => {
          e.stopPropagation();
          // Close any existing dropdown
          document.querySelectorAll('.quick-action-menu').forEach(m => m.remove());
          const menu = document.createElement('div');
          menu.className = 'quick-action-menu';
          const items = [
            { label: 'Edit Patient', action: () => { const p = getPatient(pat.id); if (p) openEditPatientModal(p, () => renderPatients()); } },
            { label: 'Add to List', action: () => { if (typeof openAddToListModal === 'function') openAddToListModal(pat.id); } },
            { label: 'New Encounter', action: () => { if (typeof openNewEncounterModal === 'function') openNewEncounterModal(pat.id); else navigate('#chart/' + pat.id); } },
          ];
          if (canEdit) {
            items.push({ label: 'Delete Patient', action: () => confirmDeletePatient(pat.id, () => renderPatients()), danger: true });
          }
          items.forEach(item => {
            const mi = document.createElement('div');
            mi.className = 'quick-action-item' + (item.danger ? ' quick-action-danger' : '');
            mi.textContent = item.label;
            mi.addEventListener('click', e2 => { e2.stopPropagation(); menu.remove(); item.action(); });
            menu.appendChild(mi);
          });
          td.style.position = 'relative';
          td.appendChild(menu);
          // Close on outside click
          setTimeout(() => {
            const closer = e2 => { if (!menu.contains(e2.target)) { menu.remove(); document.removeEventListener('click', closer); } };
            document.addEventListener('click', closer);
          }, 0);
        };
        td.appendChild(moreBtn);
        return td;
      }
      default: return createTd('—');
    }
  }

  function calcAge(dob) {
    if (!dob) return '—';
    const d = new Date(dob + 'T00:00:00');
    if (isNaN(d)) return '—';
    const t = new Date();
    let age = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    return age;
  }

  function getLastEncDate(patientId) {
    const encs = getEncountersByPatient(patientId);
    if (!encs.length) return null;
    return encs.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b).dateTime;
  }

  // ===== Enhanced Filtering =====
  function getFiltered() {
    let list = allPatients;
    // My Patients toggle
    if (_patientsMyOnly && currentProv) list = list.filter(p => (p.panelProviders || []).includes(currentProv));
    // Text search (expanded scope)
    const q = (document.getElementById('patient-search')?.value || '').trim().toLowerCase();
    if (q) list = list.filter(p =>
      (p.firstName + ' ' + p.lastName).toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      (p.mrn || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.dob || '').includes(q) ||
      (p.insurance || '').toLowerCase().includes(q));
    // Advanced filters
    if (_activeFilters.provider) list = list.filter(p => (p.panelProviders || []).includes(_activeFilters.provider));
    if (_activeFilters.sex) list = list.filter(p => (p.sex || '').toLowerCase() === _activeFilters.sex.toLowerCase());
    if (_activeFilters.ageMin) {
      const min = Number(_activeFilters.ageMin);
      list = list.filter(p => { const a = calcAge(p.dob); return typeof a === 'number' && a >= min; });
    }
    if (_activeFilters.ageMax) {
      const max = Number(_activeFilters.ageMax);
      list = list.filter(p => { const a = calcAge(p.dob); return typeof a === 'number' && a <= max; });
    }
    if (_activeFilters.insurance) {
      const ins = _activeFilters.insurance.toLowerCase();
      list = list.filter(p => (p.insurance || '').toLowerCase().includes(ins));
    }
    if (_activeFilters.codeStatus) {
      list = list.filter(p => (p.codeStatus || '').toLowerCase() === _activeFilters.codeStatus.toLowerCase());
    }
    if (_activeFilters.diagnosis) {
      const dx = _activeFilters.diagnosis.toLowerCase();
      list = list.filter(p => getProblemData(p.id).some(pr => (pr.name || '').toLowerCase().includes(dx)));
    }
    if (_activeFilters.hasOverdueScreenings) list = list.filter(p => getOverdueScreeningsCount(p) > 0);
    if (_activeFilters.hasUnsignedNotes) list = list.filter(p => getUnsignedNotesCount(p.id) > 0);
    if (_activeFilters.hasPendingOrders) list = list.filter(p => getOrderData(p.id).length > 0);
    return list;
  }

  // ===== Multi-column sort =====
  function getSortValue(pat, col) {
    switch (col) {
      case 'name': return (pat.lastName + pat.firstName).toLowerCase();
      case 'age': { const a = calcAge(pat.dob); return typeof a === 'number' ? a : -1; }
      case 'dob': return pat.dob || '';
      case 'lastEncounter': return getLastEncDate(pat.id) || '';
      case 'mrn': return pat.mrn || '';
      case 'activeMeds': return getMedData(pat.id).length;
      case 'provider': return (pat.panelProviders || []).map(id => { const p = getProvider(id); return p ? p.lastName : ''; }).join(',');
      case 'pendingOrders': return getOrderData(pat.id).length;
      default: return '';
    }
  }

  function getSorted(list) {
    return [...list].sort((a, b) => {
      for (const s of _sortStack) {
        const av = getSortValue(a, s.col);
        const bv = getSortValue(b, s.col);
        if (av < bv) return s.dir === 'asc' ? -1 : 1;
        if (av > bv) return s.dir === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // ===== Render Rows =====
  function renderRows() {
    tbody.innerHTML = '';
    const filtered = getFiltered();
    const sorted = getSorted(filtered);
    const totalCount = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (_currentPage > totalPages) _currentPage = totalPages;
    const start = (_currentPage - 1) * pageSize;
    const page = sorted.slice(start, start + pageSize);

    countEl.textContent = totalCount + ' patient' + (totalCount !== 1 ? 's' : '');
    cardTitle.textContent = _patientsMyOnly ? 'My Patients' : 'All Patients';

    if (page.length === 0) {
      const cols = getActiveCols();
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = cols.length;
      td.style.cssText = 'text-align:center;padding:32px;color:var(--text-muted)';
      td.textContent = 'No patients found.';
      tr.appendChild(td); tbody.appendChild(tr);
    } else {
      const cols = getActiveCols();
      page.forEach(pat => {
        const tr = document.createElement('tr');
        tr.className = 'patient-row-clickable';
        tr.addEventListener('click', () => navigate('#chart/' + pat.id));
        cols.forEach(col => tr.appendChild(getCellContent(pat, col.key)));
        tbody.appendChild(tr);
      });
    }

    // Pagination
    paginationBar.innerHTML = '';
    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn btn-secondary btn-sm';
      prevBtn.textContent = '‹ Prev';
      prevBtn.disabled = _currentPage <= 1;
      prevBtn.onclick = () => { _currentPage--; renderRows(); };
      paginationBar.appendChild(prevBtn);

      const pageInfo = document.createElement('span');
      pageInfo.className = 'pagination-info';
      pageInfo.textContent = 'Page ' + _currentPage + ' of ' + totalPages + ' · Showing ' + (start + 1) + '–' + Math.min(start + pageSize, totalCount) + ' of ' + totalCount;
      paginationBar.appendChild(pageInfo);

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-secondary btn-sm';
      nextBtn.textContent = 'Next ›';
      nextBtn.disabled = _currentPage >= totalPages;
      nextBtn.onclick = () => { _currentPage++; renderRows(); };
      paginationBar.appendChild(nextBtn);
    } else {
      const info = document.createElement('span');
      info.className = 'pagination-info';
      info.textContent = 'Showing ' + totalCount + ' patient' + (totalCount !== 1 ? 's' : '');
      paginationBar.appendChild(info);
    }
  }

  renderRows();

  document.getElementById('patient-search').addEventListener('input', () => { _currentPage = 1; renderRows(); });
  checkbox.addEventListener('change', () => { _patientsMyOnly = checkbox.checked; _currentPage = 1; renderRows(); });

  const newPatBtn = document.getElementById('btn-new-patient');
  if (newPatBtn && !newPatBtn.disabled) newPatBtn.addEventListener('click', () => openNewPatientModal());
}

/* ============================================================
   Column Customizer Modal
   ============================================================ */
function openColumnCustomizerModal(providerId) {
  const prefs = getPatientListPrefs(providerId);
  let columns = prefs.columns && prefs.columns.length > 0 ? [...prefs.columns] : getDefaultColumnKeys();

  function renderList() {
    const items = columns.map((key, idx) => {
      const col = PATIENT_COLUMNS.find(c => c.key === key);
      if (!col) return '';
      return '<div class="col-customizer-item" data-key="' + esc(key) + '" data-idx="' + idx + '">' +
        '<span class="col-drag-handle" title="Drag to reorder"></span>' +
        '<span class="col-customizer-label">' + esc(col.label) + '</span>' +
        '<button class="col-customizer-remove" data-key="' + esc(key) + '" title="Remove">&times;</button>' +
      '</div>';
    }).join('');
    // Available columns not in current list
    const available = PATIENT_COLUMNS.filter(c => !columns.includes(c.key));
    let addHTML = '';
    if (available.length > 0) {
      addHTML = '<div style="margin-top:12px"><label class="form-label">Add Column</label>' +
        '<select class="form-control form-control-sm" id="col-customizer-add"><option value="">— Select —</option>' +
        available.map(c => '<option value="' + esc(c.key) + '">' + esc(c.label) + '</option>').join('') +
        '</select></div>';
    }
    return '<div class="col-customizer-list">' + items + '</div>' + addHTML;
  }

  function showModal() {
    openModal({
      title: 'Customize Columns',
      bodyHTML: renderList(),
      footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-ghost" id="col-reset-defaults">Reset Defaults</button>' +
        '<button class="btn btn-primary" id="col-save">Save</button>',
    });

    // Remove buttons
    document.querySelectorAll('.col-customizer-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        columns = columns.filter(k => k !== btn.dataset.key);
        document.getElementById('modal-body').innerHTML = renderList();
        wireModalEvents();
      });
    });

    // Add select
    const addSel = document.getElementById('col-customizer-add');
    if (addSel) addSel.addEventListener('change', () => {
      if (addSel.value) {
        columns.push(addSel.value);
        document.getElementById('modal-body').innerHTML = renderList();
        wireModalEvents();
      }
    });

    // Drag reorder (simple mousedown/mousemove/mouseup)
    initDragReorder();

    document.getElementById('col-save').addEventListener('click', () => {
      savePatientListPrefs(providerId, { columns: columns });
      closeModal();
      renderPatients();
    });

    document.getElementById('col-reset-defaults').addEventListener('click', () => {
      columns = getDefaultColumnKeys();
      document.getElementById('modal-body').innerHTML = renderList();
      wireModalEvents();
    });
  }

  function wireModalEvents() {
    document.querySelectorAll('.col-customizer-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        columns = columns.filter(k => k !== btn.dataset.key);
        document.getElementById('modal-body').innerHTML = renderList();
        wireModalEvents();
      });
    });
    const addSel = document.getElementById('col-customizer-add');
    if (addSel) addSel.addEventListener('change', () => {
      if (addSel.value) { columns.push(addSel.value); document.getElementById('modal-body').innerHTML = renderList(); wireModalEvents(); }
    });
    initDragReorder();
  }

  function initDragReorder() {
    const container = document.querySelector('.col-customizer-list');
    if (!container) return;
    let dragItem = null;
    let dragIdx = -1;

    container.querySelectorAll('.col-drag-handle').forEach(handle => {
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        const item = handle.closest('.col-customizer-item');
        dragItem = item;
        dragIdx = Number(item.dataset.idx);
        item.classList.add('dragging');

        const onMove = e2 => {
          const items = [...container.querySelectorAll('.col-customizer-item')];
          const y = e2.clientY;
          let insertBefore = null;
          for (const it of items) {
            if (it === dragItem) continue;
            const rect = it.getBoundingClientRect();
            if (y < rect.top + rect.height / 2) { insertBefore = it; break; }
          }
          if (insertBefore) container.insertBefore(dragItem, insertBefore);
          else container.appendChild(dragItem);
        };

        const onUp = () => {
          dragItem.classList.remove('dragging');
          // Rebuild columns order from DOM
          columns = [...container.querySelectorAll('.col-customizer-item')].map(el => el.dataset.key);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  showModal();
}

/* ============================================================
   Shared Filter Criteria Form (used by filter panel and smart lists)
   ============================================================ */
function renderFilterCriteriaForm(container, criteria) {
  criteria = criteria || {};
  const providerOpts = getProviders().map(p =>
    '<option value="' + esc(p.id) + '"' + (criteria.provider === p.id ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + '</option>'
  ).join('');
  container.innerHTML =
    '<div class="filter-panel-grid">' +
      '<div class="form-group filter-group"><label class="form-label">Provider</label>' +
        '<select class="form-control form-control-sm" data-criteria="provider"><option value="">All</option>' + providerOpts + '</select></div>' +
      '<div class="form-group filter-group"><label class="form-label">Sex</label>' +
        '<select class="form-control form-control-sm" data-criteria="sex"><option value="">All</option>' +
        '<option' + (criteria.sex === 'Male' ? ' selected' : '') + '>Male</option>' +
        '<option' + (criteria.sex === 'Female' ? ' selected' : '') + '>Female</option>' +
        '<option' + (criteria.sex === 'Other' ? ' selected' : '') + '>Other</option></select></div>' +
      '<div class="form-group filter-group"><label class="form-label">Age Min</label>' +
        '<input type="number" class="form-control form-control-sm" data-criteria="ageMin" min="0" max="150" value="' + (criteria.ageMin || '') + '"></div>' +
      '<div class="form-group filter-group"><label class="form-label">Age Max</label>' +
        '<input type="number" class="form-control form-control-sm" data-criteria="ageMax" min="0" max="150" value="' + (criteria.ageMax || '') + '"></div>' +
      '<div class="form-group filter-group"><label class="form-label">Insurance</label>' +
        '<input type="text" class="form-control form-control-sm" data-criteria="insurance" value="' + esc(criteria.insurance || '') + '"></div>' +
      '<div class="form-group filter-group"><label class="form-label">Code Status</label>' +
        '<select class="form-control form-control-sm" data-criteria="codeStatus"><option value="">All</option>' +
        ['Full Code','DNR','DNR/DNI','Comfort Care'].map(s => '<option' + (criteria.codeStatus === s ? ' selected' : '') + '>' + s + '</option>').join('') +
        '</select></div>' +
      '<div class="form-group filter-group"><label class="form-label">Diagnosis / Problem</label>' +
        '<input type="text" class="form-control form-control-sm" data-criteria="diagnosis" value="' + esc(criteria.diagnosis || '') + '"></div>' +
      '<div class="form-group filter-group filter-checkboxes">' +
        '<label><input type="checkbox" data-criteria="hasOverdueScreenings"' + (criteria.hasOverdueScreenings ? ' checked' : '') + '> Overdue Screenings</label>' +
        '<label><input type="checkbox" data-criteria="hasUnsignedNotes"' + (criteria.hasUnsignedNotes ? ' checked' : '') + '> Unsigned Notes</label>' +
        '<label><input type="checkbox" data-criteria="hasPendingOrders"' + (criteria.hasPendingOrders ? ' checked' : '') + '> Pending Orders</label>' +
      '</div>' +
    '</div>';
}

function readFilterCriteria(container) {
  const criteria = {};
  container.querySelectorAll('[data-criteria]').forEach(el => {
    const key = el.dataset.criteria;
    if (el.type === 'checkbox') criteria[key] = el.checked;
    else criteria[key] = el.value || '';
  });
  return criteria;
}

/* ============================================================
   Helper: Overdue screenings count for a patient
   ============================================================ */
function getOverdueScreeningsCount(patient) {
  if (!patient.dob) return 0;
  const today = new Date();
  const dob = new Date(patient.dob + 'T00:00:00');
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  const records = getScreeningRecords(patient.id);
  let count = 0;

  (typeof SCREENING_RULES !== 'undefined' ? SCREENING_RULES : []).forEach(rule => {
    if (rule.sex && rule.sex !== patient.sex) return;
    if (age < rule.minAge) return;
    if (rule.maxAge && age > rule.maxAge) return;

    const rec = records.find(r => r.screening === rule.id);
    if (!rec) { count++; return; }
    if (rule.intervalYears) {
      const lastDate = new Date(rec.completedDate || rec.nextDue);
      const nextDue = new Date(lastDate);
      nextDue.setFullYear(nextDue.getFullYear() + rule.intervalYears);
      if (nextDue < today) count++;
    }
  });
  return count;
}

function getUnsignedNotesCount(patientId) {
  const encs = getEncountersByPatient(patientId);
  return encs.reduce((sum, enc) => {
    const note = getNoteByEncounter(enc.id);
    return sum + (note && !note.signed ? 1 : 0);
  }, 0);
}

/* ============================================================
   New Patient Modal (expanded with all fields)
   ============================================================ */
function openNewPatientModal() {
  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">First Name *</label>
        <input class="form-control" id="np-first" placeholder="First name" />
      </div>
      <div class="form-group">
        <label class="form-label">Last Name *</label>
        <input class="form-control" id="np-last" placeholder="Last name" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date of Birth *</label>
        <input class="form-control" id="np-dob" type="date" max="${new Date().toISOString().slice(0, 10)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Sex</label>
        <select class="form-control" id="np-sex">
          <option value="">— Select —</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
          <option>Unknown</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="np-phone" placeholder="(555) 000-0000" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" id="np-email" type="email" placeholder="email@example.com" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Insurance</label>
        <input class="form-control" id="np-insurance" placeholder="Carrier / plan" />
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Address</h4>
    <div class="form-group">
      <label class="form-label">Street</label>
      <input class="form-control" id="np-street" placeholder="123 Main St" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">City</label>
        <input class="form-control" id="np-city" placeholder="City" />
      </div>
      <div class="form-group">
        <label class="form-label">State</label>
        <input class="form-control" id="np-state" placeholder="ST" maxlength="2" style="max-width:80px" />
      </div>
      <div class="form-group">
        <label class="form-label">ZIP</label>
        <input class="form-control" id="np-zip" placeholder="00000" maxlength="10" style="max-width:100px" />
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Emergency Contact</h4>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-control" id="np-ec-name" placeholder="Contact name" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="np-ec-phone" placeholder="(555) 000-0000" />
      </div>
      <div class="form-group">
        <label class="form-label">Relationship</label>
        <input class="form-control" id="np-ec-rel" placeholder="e.g. Spouse" />
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Preferred Pharmacy</h4>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pharmacy Name</label>
        <input class="form-control" id="np-pharm-name" placeholder="Pharmacy name" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="np-pharm-phone" placeholder="(555) 000-0000" />
      </div>
      <div class="form-group">
        <label class="form-label">Fax</label>
        <input class="form-control" id="np-pharm-fax" placeholder="(555) 000-0000" />
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="np-cancel">Cancel</button>
    <button class="btn btn-primary" id="np-save">Register Patient</button>
  `;

  openModal({ title: 'New Patient', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('np-cancel').addEventListener('click', closeModal);
  document.getElementById('np-save').addEventListener('click', () => {
    const firstName = document.getElementById('np-first').value.trim();
    const lastName  = document.getElementById('np-last').value.trim();
    const dob       = document.getElementById('np-dob').value;

    if (!firstName || !lastName || !dob) {
      showToast('First name, last name, and date of birth are required.', 'error');
      return;
    }

    // Duplicate patient detection
    const existing = getPatients().find(p =>
      p.firstName.toLowerCase() === firstName.toLowerCase() &&
      p.lastName.toLowerCase() === lastName.toLowerCase() &&
      p.dob === dob
    );
    if (existing && !document.getElementById('np-dupe-confirmed')) {
      const warn = document.createElement('div');
      warn.style.cssText = 'background:var(--badge-warning-bg);color:var(--warning,#b45309);padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:13px';
      warn.id = 'np-dupe-warn';
      warn.innerHTML = '<strong>Possible duplicate:</strong> ' + esc(existing.firstName) + ' ' + esc(existing.lastName) + ' (' + esc(existing.mrn) + ') born ' + formatDate(existing.dob) + '.<br>Click "Register Patient" again to create anyway.';
      const old = document.getElementById('np-dupe-warn');
      if (old) old.remove();
      document.getElementById('modal-body').prepend(warn);
      // Mark that we warned — next click proceeds
      const marker = document.createElement('input');
      marker.type = 'hidden';
      marker.id = 'np-dupe-confirmed';
      document.getElementById('modal-body').appendChild(marker);
      return;
    }

    const patient = savePatient({
      firstName,
      lastName,
      dob,
      sex:       document.getElementById('np-sex').value,
      phone:     document.getElementById('np-phone').value.trim(),
      email:     document.getElementById('np-email').value.trim(),
      insurance: document.getElementById('np-insurance').value.trim(),
      addressStreet: document.getElementById('np-street').value.trim(),
      addressCity:   document.getElementById('np-city').value.trim(),
      addressState:  document.getElementById('np-state').value.trim(),
      addressZip:    document.getElementById('np-zip').value.trim(),
      emergencyContactName:         document.getElementById('np-ec-name').value.trim(),
      emergencyContactPhone:        document.getElementById('np-ec-phone').value.trim(),
      emergencyContactRelationship: document.getElementById('np-ec-rel').value.trim(),
      pharmacyName:  document.getElementById('np-pharm-name').value.trim(),
      pharmacyPhone: document.getElementById('np-pharm-phone').value.trim(),
      pharmacyFax:   document.getElementById('np-pharm-fax').value.trim(),
    });

    closeModal();
    showToast('Patient registered — MRN: ' + patient.mrn, 'success');
    navigate('#chart/' + patient.id);
  });
}

function confirmDeletePatient(id, onDone) {
  if (!canEditPatient()) { showToast('You do not have permission to delete patients.', 'error'); return; }
  const pat = getPatient(id);
  if (!pat) return;

  const encCount = getEncountersByPatient(id).length;
  confirmAction({
    title: 'Delete Patient',
    message: `Delete ${pat.firstName} ${pat.lastName} (${pat.mrn})? This will also remove ${encCount} encounter(s), all notes, and all orders. This cannot be undone.`,
    confirmLabel: 'Delete Patient',
    danger: true,
    onConfirm: () => {
      deletePatient(id);
      showToast('Patient deleted.', 'default');
      if (onDone) onDone();
    },
  });
}

/* ---------- Helpers ---------- */
function createTd(text) {
  const td = document.createElement('td');
  td.textContent = text || '—';
  return td;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/* ============================================================
   Inpatient Hierarchical View — Hospital > Floor/Unit > Patients
   ============================================================ */
function renderInpatientHierarchy(app, allPatients, currentProv, checkbox) {
  const hospitals = typeof getHospitals === 'function' ? getHospitals() : [];
  const wards = typeof getWards === 'function' ? getWards() : [];
  const bedAssignments = typeof getBedAssignments === 'function' ? getBedAssignments() : [];

  // If no hospital data, fall back to flat list
  if (hospitals.length === 0 || wards.length === 0) {
    renderInpatientFlatList(app, allPatients);
    return;
  }

  // Search filter
  const searchQ = (document.getElementById('patient-search')?.value || '').trim().toLowerCase();

  hospitals.forEach(hospital => {
    const hospitalCard = document.createElement('div');
    hospitalCard.className = 'card inpatient-hospital-card';
    hospitalCard.style.marginBottom = '20px';

    const hospitalHeader = document.createElement('div');
    hospitalHeader.className = 'card-header';
    hospitalHeader.style.cssText = 'background:var(--portal-accent,var(--accent-pt));color:#fff;border-radius:8px 8px 0 0';
    const hospitalTitle = document.createElement('span');
    hospitalTitle.className = 'card-title';
    hospitalTitle.style.color = '#fff';
    hospitalTitle.textContent = hospital.name;
    hospitalHeader.appendChild(hospitalTitle);
    hospitalCard.appendChild(hospitalHeader);

    // Group wards by floor
    const hospitalWards = wards.filter(w => w.hospitalId === hospital.id);
    const floors = {};
    hospitalWards.forEach(w => {
      if (!floors[w.floor]) floors[w.floor] = [];
      floors[w.floor].push(w);
    });

    const floorNames = Object.keys(floors).sort();

    floorNames.forEach(floorName => {
      const floorWards = floors[floorName];

      floorWards.forEach(ward => {
        const wardBeds = bedAssignments.filter(b => b.wardId === ward.id && b.active);
        const wardPatients = wardBeds.map(b => {
          const pat = getPatient(b.patientId);
          return pat ? { ...pat, bed: b.bed } : null;
        }).filter(Boolean);

        // Apply search filter
        let filteredPatients = wardPatients;
        if (searchQ) {
          filteredPatients = wardPatients.filter(p =>
            (p.firstName + ' ' + p.lastName).toLowerCase().includes(searchQ) ||
            p.lastName.toLowerCase().includes(searchQ) ||
            p.mrn.toLowerCase().includes(searchQ)
          );
        }

        // Apply My Census filter
        if (_dashMyPatientsOnly && currentProv) {
          filteredPatients = filteredPatients.filter(p => {
            const ipEnc = getEncountersByPatient(p.id).find(e =>
              (e.visitType || '').toLowerCase() === 'inpatient' && e.status !== 'Signed' && e.status !== 'Cancelled');
            return ipEnc && ipEnc.providerId === currentProv;
          });
        }

        // Floor/unit section
        const section = document.createElement('div');
        section.className = 'inpatient-floor-section';

        const floorHeader = document.createElement('div');
        floorHeader.className = 'inpatient-floor-header';
        floorHeader.innerHTML = '<span class="floor-name">' + esc(floorName) + '</span>' +
          '<span class="unit-name">' + esc(ward.unit) + '</span>' +
          '<span class="floor-count">' + filteredPatients.length + '/' + ward.beds + ' beds</span>';
        floorHeader.style.cursor = 'pointer';
        section.appendChild(floorHeader);

        const patientList = document.createElement('div');
        patientList.className = 'inpatient-patient-list';

        if (filteredPatients.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'text-muted text-sm';
          empty.style.padding = '10px 16px';
          empty.textContent = searchQ ? 'No matches' : 'No patients';
          patientList.appendChild(empty);
        } else {
          filteredPatients.sort((a, b) => (a.bed || '').localeCompare(b.bed || '')).forEach(pat => {
            const ipEnc = getEncountersByPatient(pat.id).find(e =>
              (e.visitType || '').toLowerCase() === 'inpatient' && e.status !== 'Signed' && e.status !== 'Cancelled');
            const attending = ipEnc && ipEnc.providerId ? getProvider(ipEnc.providerId) : null;

            const row = document.createElement('div');
            row.className = 'inpatient-patient-row';
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => navigate('#chart/' + pat.id));

            const bedEl = document.createElement('span');
            bedEl.className = 'ip-bed';
            bedEl.textContent = pat.bed || '—';

            const nameEl = document.createElement('span');
            nameEl.className = 'ip-name';
            nameEl.textContent = pat.lastName + ', ' + pat.firstName;

            const mrnEl = document.createElement('span');
            mrnEl.className = 'ip-mrn';
            mrnEl.textContent = pat.mrn;

            const attendingEl = document.createElement('span');
            attendingEl.className = 'ip-attending';
            attendingEl.textContent = attending ? attending.lastName + ', ' + attending.firstName[0] + '.' : '—';

            const alertsEl = document.createElement('span');
            alertsEl.className = 'ip-alerts';
            const unsigned = getUnsignedNotesCount(pat.id);
            if (unsigned > 0) {
              const b = document.createElement('span');
              b.className = 'alert-badge alert-badge-amber';
              b.textContent = unsigned + ' unsigned';
              alertsEl.appendChild(b);
            }

            row.appendChild(bedEl);
            row.appendChild(nameEl);
            row.appendChild(mrnEl);
            row.appendChild(attendingEl);
            row.appendChild(alertsEl);
            patientList.appendChild(row);
          });
        }

        // Collapsible toggle
        floorHeader.addEventListener('click', () => {
          patientList.classList.toggle('collapsed');
          floorHeader.classList.toggle('collapsed');
        });

        section.appendChild(patientList);
        hospitalCard.appendChild(section);
      });
    });

    app.appendChild(hospitalCard);
  });

  // Search handler
  const searchInput = document.getElementById('patient-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderDashboard());
  }

  // My Census toggle
  checkbox.addEventListener('change', () => {
    _dashMyPatientsOnly = checkbox.checked;
    renderDashboard();
  });
}

function renderInpatientFlatList(app, patients) {
  const card = document.createElement('div');
  card.className = 'card';
  if (patients.length === 0) {
    card.appendChild(buildEmptyState('', 'No inpatient admissions', 'Admit a patient to get started.'));
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = '<thead><tr><th scope="col">Name</th><th scope="col">MRN</th><th scope="col">Admission</th><th scope="col">Attending</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    patients.forEach(pat => {
      const tr = document.createElement('tr');
      const ipEnc = getEncountersByPatient(pat.id).find(e =>
        (e.visitType || '').toLowerCase() === 'inpatient' && e.status !== 'Signed' && e.status !== 'Cancelled');
      const attending = ipEnc && ipEnc.providerId ? getProvider(ipEnc.providerId) : null;
      tr.innerHTML = '<td><button class="table-link" onclick="navigate(\'#chart/' + esc(pat.id) + '\')">' + esc(pat.lastName + ', ' + pat.firstName) + '</button></td>' +
        '<td>' + esc(pat.mrn) + '</td>' +
        '<td>' + (ipEnc ? formatDateTime(ipEnc.dateTime) : '—') + '</td>' +
        '<td>' + (attending ? esc(attending.lastName + ', ' + attending.firstName) : '—') + '</td>' +
        '<td style="text-align:right"><button class="btn btn-secondary btn-sm" onclick="navigate(\'#chart/' + esc(pat.id) + '\')">View</button></td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    card.appendChild(wrap);
  }
  app.appendChild(card);
}
