/* ============================================================
   views/providers.js — Provider roster CRUD
   ============================================================ */

const DEGREES = ['MD', 'DO', 'NP', 'PA', 'RN', 'LPN', 'MA', 'PharmD'];
const ROLES   = ['Attending', 'Resident', 'Nurse', 'MA', 'Admin', 'Pharmacist'];

function renderProviders() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({
    title: 'Providers',
    meta:  '',
    actions: '<button class="btn btn-primary btn-sm" id="btn-add-provider">+ Add Provider</button>',
  });
  setActiveNav('providers');

  const providers = getProviders();

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  const cardTitle = document.createElement('span');
  cardTitle.className = 'card-title';
  cardTitle.textContent = 'Provider Roster';
  const count = document.createElement('span');
  count.className = 'text-muted text-sm';
  count.textContent = providers.length + ' provider' + (providers.length !== 1 ? 's' : '');
  header.appendChild(cardTitle);
  header.appendChild(count);
  card.appendChild(header);

  if (providers.length === 0) {
    const empty = buildEmptyState('👨‍⚕️', 'No providers yet', 'Add a provider to get started.');
    card.appendChild(empty);
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `<thead><tr>
      <th>Name</th><th>Degree</th><th>Role</th><th></th>
    </tr></thead>`;

    const tbody = document.createElement('tbody');
    tbody.id = 'providers-tbody';

    providers.forEach(prov => {
      const tr = document.createElement('tr');
      tr.dataset.id = prov.id;

      const tdName = document.createElement('td');
      tdName.style.fontWeight = '500';
      tdName.textContent = prov.lastName + ', ' + prov.firstName;

      const tdDegree = document.createElement('td');
      tdDegree.textContent = prov.degree;

      const tdRole = document.createElement('td');
      tdRole.textContent = prov.role;

      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      tdActions.innerHTML = `
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${prov.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${prov.id}" style="margin-left:6px">Delete</button>
      `;

      tr.appendChild(tdName);
      tr.appendChild(tdDegree);
      tr.appendChild(tdRole);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    card.appendChild(wrap);

    // Event delegation
    tbody.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'edit') openProviderModal(id);
      if (btn.dataset.action === 'delete') confirmDeleteProvider(id);
    });
  }

  app.appendChild(card);

  // Topbar add button
  document.getElementById('btn-add-provider').addEventListener('click', () => openProviderModal(null));
}

function openProviderModal(id) {
  const prov = id ? getProvider(id) : null;
  const isEdit = !!prov;

  let degreeOpts = DEGREES.map(d =>
    `<option value="${d}"${prov && prov.degree === d ? ' selected' : ''}>${d}</option>`
  ).join('');
  let roleOpts = ROLES.map(r =>
    `<option value="${r}"${prov && prov.role === r ? ' selected' : ''}>${r}</option>`
  ).join('');

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">First Name</label>
        <input class="form-control" id="prov-first" value="${prov ? esc(prov.firstName) : ''}" placeholder="First name" />
      </div>
      <div class="form-group">
        <label class="form-label">Last Name</label>
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

    if (!firstName || !lastName) {
      showToast('First and last name are required.', 'error');
      return;
    }

    saveProvider({ id: id || undefined, firstName, lastName, degree, role });
    closeModal();
    showToast(isEdit ? 'Provider updated.' : 'Provider added.', 'success');
    renderProviders();
  });
}

function confirmDeleteProvider(id) {
  const prov = getProvider(id);
  if (!prov) return;
  confirmAction({
    title: 'Delete Provider',
    message: `Remove ${prov.firstName} ${prov.lastName}? Existing encounters will show "[Removed Provider]" but will not be deleted.`,
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
