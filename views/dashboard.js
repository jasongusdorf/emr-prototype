/* ============================================================
   views/dashboard.js — Patient list + search + New Patient modal
   ============================================================ */

function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({
    title:   'Patient Dashboard',
    meta:    '',
    actions: '<button class="btn btn-primary btn-sm" id="btn-new-patient">+ New Patient</button>',
  });
  setActiveNav('dashboard');

  const patients = getPatients().sort((a, b) =>
    (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName)
  );

  // Search bar
  const searchWrap = document.createElement('div');
  searchWrap.style.marginBottom = '16px';
  searchWrap.innerHTML = `
    <div class="search-bar" style="max-width:400px">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" id="patient-search" placeholder="Search by name or MRN…" autocomplete="off" />
    </div>
  `;
  app.appendChild(searchWrap);

  // Card + table
  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  const cardTitle = document.createElement('span');
  cardTitle.className = 'card-title';
  cardTitle.textContent = 'All Patients';
  const countEl = document.createElement('span');
  countEl.className = 'text-muted text-sm';
  countEl.id = 'patient-count';
  countEl.textContent = patients.length + ' patient' + (patients.length !== 1 ? 's' : '');
  header.appendChild(cardTitle);
  header.appendChild(countEl);
  card.appendChild(header);

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';

  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `<thead><tr>
    <th>Name</th><th>MRN</th><th>DOB</th><th>Sex</th><th>Phone</th><th>Insurance</th><th></th>
  </tr></thead>`;

  const tbody = document.createElement('tbody');
  tbody.id = 'patient-tbody';

  function renderRows(list) {
    tbody.innerHTML = '';
    if (list.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.style.textAlign = 'center';
      td.style.padding = '32px';
      td.style.color = 'var(--text-muted)';
      td.textContent = 'No patients found.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    list.forEach(pat => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      const nameBtn = document.createElement('button');
      nameBtn.className = 'table-link';
      nameBtn.textContent = pat.lastName + ', ' + pat.firstName;
      nameBtn.onclick = () => navigate('#chart/' + pat.id);
      tdName.appendChild(nameBtn);

      const tdMrn  = createTd(pat.mrn);
      const tdDob  = createTd(formatDate(pat.dob));
      const tdSex  = createTd(pat.sex);
      const tdPhone = createTd(pat.phone);
      const tdIns  = createTd(pat.insurance);

      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger btn-sm';
      delBtn.setAttribute('data-action', 'delete');
      delBtn.setAttribute('data-id', pat.id);
      delBtn.textContent = 'Delete';
      tdActions.appendChild(delBtn);

      tr.appendChild(tdName);
      tr.appendChild(tdMrn);
      tr.appendChild(tdDob);
      tr.appendChild(tdSex);
      tr.appendChild(tdPhone);
      tr.appendChild(tdIns);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  renderRows(patients);
  table.appendChild(tbody);
  wrap.appendChild(table);
  card.appendChild(wrap);
  app.appendChild(card);

  // Event delegation for delete
  tbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;
    confirmDeletePatient(btn.dataset.id, () => renderDashboard());
  });

  // Search
  document.getElementById('patient-search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = q
      ? patients.filter(p =>
          (p.firstName + ' ' + p.lastName).toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q)
        )
      : patients;
    renderRows(filtered);
    document.getElementById('patient-count').textContent =
      filtered.length + ' patient' + (filtered.length !== 1 ? 's' : '');
  });

  // Topbar new patient
  document.getElementById('btn-new-patient').addEventListener('click', () => openNewPatientModal());
}

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
        <input class="form-control" id="np-dob" type="date" />
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
        <label class="form-label">Insurance</label>
        <input class="form-control" id="np-insurance" placeholder="Carrier / plan" />
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="np-cancel">Cancel</button>
    <button class="btn btn-primary" id="np-save">Register Patient</button>
  `;

  openModal({ title: 'New Patient', bodyHTML, footerHTML });

  document.getElementById('np-cancel').addEventListener('click', closeModal);
  document.getElementById('np-save').addEventListener('click', () => {
    const firstName = document.getElementById('np-first').value.trim();
    const lastName  = document.getElementById('np-last').value.trim();
    const dob       = document.getElementById('np-dob').value;

    if (!firstName || !lastName || !dob) {
      showToast('First name, last name, and date of birth are required.', 'error');
      return;
    }

    const patient = savePatient({
      firstName,
      lastName,
      dob,
      sex:       document.getElementById('np-sex').value,
      phone:     document.getElementById('np-phone').value.trim(),
      insurance: document.getElementById('np-insurance').value.trim(),
    });

    closeModal();
    showToast('Patient registered — MRN: ' + patient.mrn, 'success');
    navigate('#chart/' + patient.id);
  });
}

function confirmDeletePatient(id, onDone) {
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
  // iso might be YYYY-MM-DD or full ISO string
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
