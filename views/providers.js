/* ============================================================
   views/providers.js — Provider roster CRUD
   ============================================================ */

const DEGREES = ['MD', 'DO', 'NP', 'PA', 'RN', 'LPN', 'MA', 'PharmD'];
const ROLES   = ['Attending', 'Resident', 'Nurse', 'MA', 'Admin', 'Pharmacist'];

function renderProviders() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // RBAC: only admin/attending can add providers
  const canManage = isAdmin() || (typeof hasPermission === 'function' && hasPermission('manage_providers'));

  setTopbar({
    title: 'Providers',
    meta:  '',
    actions: canManage ? '<button class="btn btn-primary btn-sm" id="btn-add-provider">+ Add Provider</button>' : '',
  });
  setActiveNav('providers');

  const allProviders = getProviders();

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.style.cssText = 'flex-wrap:wrap;gap:10px;';
  const cardTitle = document.createElement('span');
  cardTitle.className = 'card-title';
  cardTitle.textContent = 'Provider Roster';
  const countEl = document.createElement('span');
  countEl.className = 'text-muted text-sm';
  countEl.id = 'provider-count';
  countEl.textContent = allProviders.length + ' provider' + (allProviders.length !== 1 ? 's' : '');
  header.appendChild(cardTitle);
  header.appendChild(countEl);
  card.appendChild(header);

  // Search bar
  const searchBar = document.createElement('div');
  searchBar.style.cssText = 'padding:8px 16px;border-bottom:1px solid var(--border);';
  searchBar.innerHTML = '<input type="text" class="form-control" id="provider-search" placeholder="Search by name, specialty, or NPI..." style="max-width:360px" />';
  card.appendChild(searchBar);

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';
  tableWrap.id = 'provider-table-wrap';
  card.appendChild(tableWrap);

  function renderProviderTable() {
    const q = (document.getElementById('provider-search')?.value || '').trim().toLowerCase();
    let filtered = allProviders;
    if (q) {
      filtered = filtered.filter(p =>
        (p.firstName + ' ' + p.lastName).toLowerCase().includes(q) ||
        (p.lastName + ', ' + p.firstName).toLowerCase().includes(q) ||
        (p.specialty || '').toLowerCase().includes(q) ||
        (p.npi || '').includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      );
    }

    document.getElementById('provider-count').textContent = filtered.length + ' provider' + (filtered.length !== 1 ? 's' : '') + (q ? ' (filtered)' : '');

    if (filtered.length === 0) {
      tableWrap.innerHTML = '';
      tableWrap.appendChild(buildEmptyState('👨‍⚕️', q ? 'No matching providers' : 'No providers yet', q ? 'Try a different search term.' : 'Add a provider to get started.'));
      return;
    }

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = '<thead><tr><th>Name</th><th>Degree</th><th>Role</th><th>Specialty</th><th>NPI</th><th></th></tr></thead>';

    const tbody = document.createElement('tbody');
    tbody.id = 'providers-tbody';

    filtered.forEach(prov => {
      const tr = document.createElement('tr');
      tr.dataset.id = prov.id;

      const tdName = document.createElement('td');
      tdName.style.fontWeight = '500';
      tdName.textContent = prov.lastName + ', ' + prov.firstName;

      const tdDegree = document.createElement('td');
      tdDegree.textContent = prov.degree;

      const tdRole = document.createElement('td');
      tdRole.textContent = prov.role;

      const tdSpecialty = document.createElement('td');
      tdSpecialty.textContent = prov.specialty || '—';

      const tdNPI = document.createElement('td');
      tdNPI.textContent = prov.npi || '—';
      tdNPI.style.fontFamily = 'monospace';
      tdNPI.style.fontSize = '12px';

      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      if (canManage) {
        tdActions.innerHTML = '<button class="btn btn-secondary btn-sm" data-action="edit" data-id="' + esc(prov.id) + '">Edit</button> <button class="btn btn-danger btn-sm" data-action="delete" data-id="' + esc(prov.id) + '">Delete</button>';
      }

      tr.appendChild(tdName);
      tr.appendChild(tdDegree);
      tr.appendChild(tdRole);
      tr.appendChild(tdSpecialty);
      tr.appendChild(tdNPI);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.innerHTML = '';
    tableWrap.appendChild(table);

    tbody.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'edit') openProviderModal(id);
      if (btn.dataset.action === 'delete') confirmDeleteProvider(id);
    });
  }

  renderProviderTable();
  document.getElementById('provider-search').addEventListener('input', renderProviderTable);

  app.appendChild(card);

  if (canManage && document.getElementById('btn-add-provider')) {
    document.getElementById('btn-add-provider').addEventListener('click', () => openProviderModal(null));
  }
}

const SPECIALTIES = [
  '', 'Internal Medicine', 'Family Medicine', 'Cardiology', 'Pulmonology',
  'Gastroenterology', 'Nephrology', 'Neurology', 'Psychiatry', 'Oncology',
  'Endocrinology', 'Rheumatology', 'Infectious Disease', 'Hematology',
  'Emergency Medicine', 'Critical Care', 'Surgery - General', 'Surgery - Ortho',
  'Obstetrics/Gynecology', 'Pediatrics', 'Dermatology', 'Ophthalmology',
  'Radiology', 'Pathology', 'Anesthesiology', 'Physical Medicine',
  'Urology', 'ENT', 'Allergy/Immunology', 'Pain Management', 'Pharmacy',
];

function openProviderModal(id) {
  const prov = id ? getProvider(id) : null;
  const isEdit = !!prov;

  let degreeOpts = DEGREES.map(d =>
    '<option value="' + d + '"' + (prov && prov.degree === d ? ' selected' : '') + '>' + d + '</option>'
  ).join('');
  let roleOpts = ROLES.map(r =>
    '<option value="' + r + '"' + (prov && prov.role === r ? ' selected' : '') + '>' + r + '</option>'
  ).join('');
  let specOpts = SPECIALTIES.map(s =>
    '<option value="' + esc(s) + '"' + (prov && prov.specialty === s ? ' selected' : '') + '>' + (s || '— Select —') + '</option>'
  ).join('');

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">First Name *</label>
        <input class="form-control" id="prov-first" value="${prov ? esc(prov.firstName) : ''}" placeholder="First name" />
      </div>
      <div class="form-group">
        <label class="form-label">Last Name *</label>
        <input class="form-control" id="prov-last" value="${prov ? esc(prov.lastName) : ''}" placeholder="Last name" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Degree</label>
        <select class="form-control" id="prov-degree">${degreeOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-control" id="prov-role">${roleOpts}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Specialty</label>
        <select class="form-control" id="prov-specialty">${specOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">NPI</label>
        <input class="form-control" id="prov-npi" value="${prov ? esc(prov.npi || '') : ''}" placeholder="10-digit NPI" maxlength="10" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" id="prov-email" type="email" value="${prov ? esc(prov.email || '') : ''}" placeholder="provider@clinic.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="prov-phone" type="tel" value="${prov ? esc(prov.phone || '') : ''}" placeholder="(555) 123-4567" />
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="prov-cancel">Cancel</button>
    <button class="btn btn-primary" id="prov-save">${isEdit ? 'Save Changes' : 'Add Provider'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Provider' : 'New Provider', bodyHTML, footerHTML });

  document.getElementById('prov-cancel').addEventListener('click', closeModal);
  document.getElementById('prov-save').addEventListener('click', () => {
    const firstName = document.getElementById('prov-first').value.trim();
    const lastName  = document.getElementById('prov-last').value.trim();
    const degree    = document.getElementById('prov-degree').value;
    const role      = document.getElementById('prov-role').value;
    const specialty = document.getElementById('prov-specialty').value;
    const npi       = document.getElementById('prov-npi').value.trim();
    const email     = document.getElementById('prov-email').value.trim();
    const phone     = document.getElementById('prov-phone').value.trim();

    if (!firstName || !lastName) {
      showToast('First and last name are required.', 'error');
      return;
    }
    if (npi && !/^\d{10}$/.test(npi)) {
      showToast('NPI must be exactly 10 digits.', 'error');
      return;
    }

    saveProvider({ id: id || undefined, firstName, lastName, degree, role, specialty, npi, email, phone });
    closeModal();
    showToast(isEdit ? 'Provider updated.' : 'Provider added.', 'success');
    renderProviders();
  });
}

function confirmDeleteProvider(id) {
  const prov = getProvider(id);
  if (!prov) return;

  // Count references to this provider
  const encCount = (typeof getEncounters === 'function' ? getEncounters() : []).filter(e => e.providerId === id).length;
  const apptCount = (typeof getAppointments === 'function' ? getAppointments() : []).filter(a => a.providerId === id).length;
  const orderCount = (typeof getOrders === 'function' ? getOrders() : []).filter(o => o.providerId === id).length;

  let refs = [];
  if (encCount > 0) refs.push(encCount + ' encounter' + (encCount !== 1 ? 's' : ''));
  if (apptCount > 0) refs.push(apptCount + ' appointment' + (apptCount !== 1 ? 's' : ''));
  if (orderCount > 0) refs.push(orderCount + ' order' + (orderCount !== 1 ? 's' : ''));
  const refMsg = refs.length > 0 ? ' This provider is referenced by ' + refs.join(', ') + '.' : '';

  confirmAction({
    title: 'Delete Provider',
    message: 'Remove ' + prov.firstName + ' ' + prov.lastName + '?' + refMsg + ' Existing records will show "[Removed Provider]" but will not be deleted.',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => {
      deleteProvider(id);
      showToast('Provider deleted.', 'default');
      renderProviders();
    },
  });
}

/* Escape HTML for attribute insertion */
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* Build persistent patient banner (name, DOB, MRN, allergies) */
function buildPatientBanner(patientId) {
  const patient = getPatient(patientId);
  if (!patient) return document.createDocumentFragment();
  const allergies = (typeof getPatientAllergies === 'function') ? getPatientAllergies(patientId) : [];
  const age = (() => {
    if (!patient.dob) return '';
    const d = new Date(patient.dob); const t = new Date();
    let a = t.getFullYear() - d.getFullYear();
    if (t.getMonth() - d.getMonth() < 0 || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
    return a + 'y';
  })();

  const banner = document.createElement('div');
  banner.className = 'patient-banner';

  const nameEl = document.createElement('span');
  nameEl.className = 'patient-banner-name';
  const codeStatus = patient.codeStatus || 'Full Code';
  nameEl.textContent = patient.lastName + ', ' + patient.firstName + ' (' + codeStatus + ')';

  const metaEl = document.createElement('span');
  metaEl.className = 'patient-banner-meta';
  metaEl.textContent = [patient.mrn, patient.dob ? patient.dob + ' (' + age + ')' : '', patient.sex || ''].filter(Boolean).join(' · ');

  banner.appendChild(nameEl);
  banner.appendChild(metaEl);

  if (allergies.length > 0) {
    const allergyEl = document.createElement('span');
    allergyEl.className = 'patient-banner-allergy';
    allergyEl.textContent = 'Allergies: ' + allergies.map(a => a.allergen).join(', ');
    banner.appendChild(allergyEl);
  } else {
    const nkda = document.createElement('span');
    nkda.className = 'patient-banner-nkda';
    nkda.textContent = 'NKDA';
    banner.appendChild(nkda);
  }

  return banner;
}

function buildEmptyState(icon, title, body) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title"></div>
    <div class="empty-state-body"></div>
  `;
  div.querySelector('.empty-state-title').textContent = title;
  div.querySelector('.empty-state-body').textContent  = body;
  return div;
}
