/* ============================================================
   views/lists.js — Personalized Patient Lists
   Create, share, import, manage, smart lists, handoff notes,
   batch operations, print rounding sheet
   ============================================================ */

/* ============================================================
   Render Custom Patient List (enhanced with priority, notes, handoff, batch)
   ============================================================ */
function renderPatientList(listId) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const list = getPatientList(listId);
  if (!list) { navigate('#dashboard'); return; }

  const meta = list.patientMeta || {};
  let _selectedIds = [];
  const isPublic = list.sharing ? list.sharing.mode === 'all' : !!list.shared;

  setTopbar({
    title: list.name,
    meta: list.patientIds.length + ' patient' + (list.patientIds.length !== 1 ? 's' : ''),
    actions: '<button class="btn btn-secondary btn-sm" id="list-add-patient">+ Add Patient</button>' +
      '<button class="btn btn-secondary btn-sm" id="list-print">Print</button>' +
      '<button class="btn ' + (isPublic ? 'btn-success' : 'btn-secondary') + ' btn-sm" id="list-toggle-public">' + (isPublic ? '🔓 Public' : 'Make Public') + '</button>' +
      '<button class="btn btn-secondary btn-sm" id="list-edit">Edit List</button>' +
      '<button class="btn btn-secondary btn-sm" id="list-back" style="margin-left:4px">Back</button>',
  });
  setActiveNav('list-' + listId);

  // Batch action bar (hidden until selection)
  const batchBar = document.createElement('div');
  batchBar.className = 'batch-action-bar hidden';
  batchBar.innerHTML = '<span id="batch-count">0 selected</span>' +
    '<button class="btn btn-danger btn-sm" id="batch-remove">Remove Selected</button>' +
    '<button class="btn btn-secondary btn-sm" id="batch-move">Move to List...</button>' +
    '<button class="btn btn-secondary btn-sm" id="batch-copy">Copy to List...</button>';
  app.appendChild(batchBar);

  const card = document.createElement('div');
  card.className = 'card';

  if (list.patientIds.length === 0) {
    card.appendChild(buildEmptyState('📋', 'No patients in this list', 'Add patients from the dashboard or click "+ Add Patient" above.'));
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = '<thead><tr><th style="width:30px"><input type="checkbox" id="list-select-all"></th><th>Priority</th><th>Name</th><th>MRN</th><th>DOB</th><th>Age</th><th>Sex</th><th>Notes</th><th>Handoff</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');

    list.patientIds.forEach(pid => {
      const pat = getPatient(pid);
      if (!pat) return;
      const pmeta = meta[pid] || {};
      const tr = document.createElement('tr');

      // Checkbox
      const tdCheck = document.createElement('td');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.pid = pid;
      cb.addEventListener('change', () => {
        if (cb.checked) _selectedIds.push(pid);
        else _selectedIds = _selectedIds.filter(id => id !== pid);
        updateBatchBar();
      });
      tdCheck.appendChild(cb);

      // Priority (1-5 dots)
      const tdPriority = document.createElement('td');
      tdPriority.className = 'list-priority-cell';
      for (let i = 1; i <= 5; i++) {
        const dot = document.createElement('span');
        dot.className = 'priority-dot' + (i <= (pmeta.priority || 0) ? ' priority-dot-active' : '');
        dot.textContent = '●';
        dot.title = 'Priority ' + i;
        dot.addEventListener('click', () => {
          const newPri = (pmeta.priority === i) ? 0 : i;
          setPatientListMeta(listId, pid, { priority: newPri });
          renderPatientList(listId);
        });
        tdPriority.appendChild(dot);
      }

      const tdName = document.createElement('td');
      const nameBtn = document.createElement('button');
      nameBtn.className = 'table-link';
      nameBtn.textContent = pat.lastName + ', ' + pat.firstName;
      nameBtn.onclick = () => navigate('#chart/' + pat.id);
      tdName.appendChild(nameBtn);

      const tdMrn = document.createElement('td');
      tdMrn.textContent = pat.mrn;
      const tdDob = document.createElement('td');
      tdDob.textContent = formatDate(pat.dob);
      const tdAge = document.createElement('td');
      tdAge.textContent = _listCalcAge(pat.dob);
      const tdSex = document.createElement('td');
      tdSex.textContent = pat.sex || '—';

      // Inline editable notes
      const tdNotes = document.createElement('td');
      tdNotes.className = 'list-note-cell';
      const noteInput = document.createElement('input');
      noteInput.type = 'text';
      noteInput.className = 'list-note-input';
      noteInput.value = pmeta.note || '';
      noteInput.placeholder = 'Add note...';
      noteInput.addEventListener('blur', () => {
        setPatientListMeta(listId, pid, { note: noteInput.value });
      });
      tdNotes.appendChild(noteInput);

      // Handoff icon
      const tdHandoff = document.createElement('td');
      const handoffBtn = document.createElement('button');
      handoffBtn.className = 'btn btn-ghost btn-sm handoff-btn';
      const handoffCount = getHandoffNotes(listId, pid).length;
      handoffBtn.textContent = '📝' + (handoffCount > 0 ? ' ' + handoffCount : '');
      handoffBtn.title = 'Handoff notes';
      handoffBtn.addEventListener('click', () => openHandoffPanel(listId, pid));
      tdHandoff.appendChild(handoffBtn);

      // Actions
      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        removePatientFromList(listId, pid);
        renderPatientList(listId);
        refreshSidebarLists();
      });
      tdActions.appendChild(removeBtn);

      tr.appendChild(tdCheck);
      tr.appendChild(tdPriority);
      tr.appendChild(tdName);
      tr.appendChild(tdMrn);
      tr.appendChild(tdDob);
      tr.appendChild(tdAge);
      tr.appendChild(tdSex);
      tr.appendChild(tdNotes);
      tr.appendChild(tdHandoff);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    card.appendChild(wrap);

    // Select all
    setTimeout(() => {
      const selectAll = document.getElementById('list-select-all');
      if (selectAll) selectAll.addEventListener('change', () => {
        const cbs = tbody.querySelectorAll('input[type="checkbox"][data-pid]');
        cbs.forEach(cb => { cb.checked = selectAll.checked; });
        _selectedIds = selectAll.checked ? list.patientIds.slice() : [];
        updateBatchBar();
      });
    }, 0);
  }

  app.appendChild(card);

  function updateBatchBar() {
    const count = _selectedIds.length;
    batchBar.classList.toggle('hidden', count === 0);
    const countEl = document.getElementById('batch-count');
    if (countEl) countEl.textContent = count + ' selected';
  }

  // Batch handlers
  document.getElementById('batch-remove').addEventListener('click', () => {
    _selectedIds.forEach(pid => removePatientFromList(listId, pid));
    renderPatientList(listId);
    refreshSidebarLists();
  });

  document.getElementById('batch-move').addEventListener('click', () => openBatchListPicker(listId, _selectedIds, 'move'));
  document.getElementById('batch-copy').addEventListener('click', () => openBatchListPicker(listId, _selectedIds, 'copy'));

  // Button handlers
  document.getElementById('list-back').addEventListener('click', () => navigate('#dashboard'));
  document.getElementById('list-add-patient').addEventListener('click', () => openAddPatientToListModal(listId));
  document.getElementById('list-edit').addEventListener('click', () => openEditListModal(listId));
  document.getElementById('list-print').addEventListener('click', () => printRoundingSheet(listId));
  document.getElementById('list-toggle-public').addEventListener('click', () => {
    const newMode = isPublic ? 'private' : 'all';
    const newSharing = { mode: newMode, sharedWith: [], permissions: 'view' };
    savePatientList({ id: listId, shared: !isPublic, sharing: newSharing });
    showToast(newMode === 'all' ? 'List is now public — others can import it.' : 'List is now private.', 'success');
    refreshSidebarLists();
    renderPatientList(listId);
  });
}

function _listCalcAge(dob) {
  if (!dob) return '—';
  const d = new Date(dob + 'T00:00:00');
  if (isNaN(d)) return '—';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return String(age);
}

/* ============================================================
   Batch List Picker (move/copy selected patients to another list)
   ============================================================ */
function openBatchListPicker(fromListId, patientIds, mode) {
  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;
  const lists = getPatientListsByOwner(providerId).filter(l => l.id !== fromListId);

  if (lists.length === 0) { showToast('No other lists available.', 'error'); return; }

  let optionsHTML = lists.map(l => '<option value="' + esc(l.id) + '">' + esc(l.name) + '</option>').join('');
  openModal({
    title: (mode === 'move' ? 'Move' : 'Copy') + ' ' + patientIds.length + ' Patient(s)',
    bodyHTML: '<div class="form-group"><label class="form-label">Destination List</label>' +
      '<select class="form-control" id="batch-list-target">' + optionsHTML + '</select></div>',
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="batch-list-confirm">' + (mode === 'move' ? 'Move' : 'Copy') + '</button>',
  });

  document.getElementById('batch-list-confirm').addEventListener('click', () => {
    const targetId = document.getElementById('batch-list-target').value;
    if (!targetId) return;
    patientIds.forEach(pid => addPatientToList(targetId, pid));
    if (mode === 'move') patientIds.forEach(pid => removePatientFromList(fromListId, pid));
    closeModal();
    showToast('Patients ' + (mode === 'move' ? 'moved' : 'copied') + '.', 'success');
    renderPatientList(fromListId);
    refreshSidebarLists();
  });
}

/* ============================================================
   Handoff Notes Panel
   ============================================================ */
function openHandoffPanel(listId, patientId) {
  const pat = getPatient(patientId);
  const user = getSessionUser();
  const notes = getHandoffNotes(listId, patientId);

  let notesHTML = '';
  if (notes.length === 0) {
    notesHTML = '<p class="text-muted text-sm">No handoff notes yet.</p>';
  } else {
    notesHTML = notes.map(n => {
      const author = getProvider(n.authorId);
      const authorName = author ? author.lastName + ', ' + author.firstName : 'Unknown';
      const catClass = 'handoff-cat-' + (n.category || 'update');
      return '<div class="handoff-note-item">' +
        '<div class="handoff-note-header">' +
          '<span class="handoff-category ' + catClass + '">' + esc(n.category || 'update') + '</span>' +
          '<span class="text-muted text-sm">' + esc(authorName) + ' · ' + formatDateTime(n.createdAt) + '</span>' +
        '</div>' +
        '<div class="handoff-note-text">' + esc(n.text) + '</div>' +
      '</div>';
    }).join('');
  }

  const bodyHTML = '<div class="handoff-panel">' +
    '<div class="handoff-notes-list">' + notesHTML + '</div>' +
    '<hr style="margin:12px 0">' +
    '<div class="form-group"><label class="form-label">New Handoff Note</label>' +
      '<textarea class="form-control" id="handoff-text" rows="3" placeholder="Enter handoff note..."></textarea></div>' +
    '<div class="form-group"><label class="form-label">Category</label>' +
      '<select class="form-control form-control-sm" id="handoff-category">' +
        '<option value="update">Update</option><option value="action">Action Required</option><option value="fyi">FYI</option>' +
      '</select></div>' +
  '</div>';

  openModal({
    title: 'Handoff — ' + (pat ? pat.lastName + ', ' + pat.firstName : 'Patient'),
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>' +
      '<button class="btn btn-primary" id="handoff-save">Add Note</button>',
  });

  document.getElementById('handoff-save').addEventListener('click', () => {
    const text = document.getElementById('handoff-text').value.trim();
    if (!text) { showToast('Please enter a note.', 'error'); return; }
    saveHandoffNote({
      listId,
      patientId,
      authorId: user ? user.id : '',
      text,
      category: document.getElementById('handoff-category').value,
    });
    closeModal();
    showToast('Handoff note added.', 'success');
  });
}

/* ============================================================
   Print Rounding Sheet
   ============================================================ */
function printRoundingSheet(listId) {
  const list = getPatientList(listId);
  if (!list) return;

  const rows = list.patientIds.map(pid => {
    const pat = getPatient(pid);
    if (!pat) return '';
    const probs = typeof getActiveProblems === 'function' ? getActiveProblems(pid) : [];
    const dxList = probs.map(p => p.name).join(', ') || '—';
    return '<tr>' +
      '<td>' + esc(pat.lastName + ', ' + pat.firstName) + '</td>' +
      '<td>' + esc(pat.mrn) + '</td>' +
      '<td>' + esc(dxList) + '</td>' +
      '<td>' + esc(pat.codeStatus || 'Full Code') + '</td>' +
      '<td style="min-width:200px"></td>' +
    '</tr>';
  }).join('');

  const html = '<!DOCTYPE html><html><head><title>Rounding Sheet — ' + esc(list.name) + '</title>' +
    '<style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}' +
    'h1{font-size:18px;margin-bottom:4px}' +
    '.meta{color:#666;font-size:11px;margin-bottom:12px}' +
    'table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}' +
    'th{background:#f5f5f5;font-weight:600}' +
    '@media print{body{margin:0}}</style></head>' +
    '<body><h1>' + esc(list.name) + ' — Rounding Sheet</h1>' +
    '<div class="meta">Printed ' + new Date().toLocaleString() + '</div>' +
    '<table><thead><tr><th>Patient</th><th>MRN</th><th>Diagnoses</th><th>Code Status</th><th>Notes</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></body></html>';

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

/* ============================================================
   Create / Edit List Modals (enhanced sharing)
   ============================================================ */
function openCreateListModal() {
  const user = getSessionUser();
  if (!user) return;

  const bodyHTML = '<div class="form-group">' +
    '<label class="form-label">List Name *</label>' +
    '<input type="text" class="form-control" id="new-list-name" placeholder="e.g. My ICU patients" />' +
    '</div>' +
    _renderSharingForm({ mode: 'private', sharedWith: [], permissions: 'view' });

  openModal({
    title: 'Create Patient List',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="new-list-save">Create List</button>',
  });

  document.getElementById('new-list-save').addEventListener('click', () => {
    const name = document.getElementById('new-list-name').value.trim();
    if (!name) { showToast('Please enter a list name.', 'error'); return; }
    const sharing = _readSharingForm();
    const providerId = getCurrentProvider() || user.id;
    savePatientList({ name, ownerId: providerId, shared: sharing.mode !== 'private', sharing, patientIds: [] });
    closeModal();
    showToast('List "' + name + '" created.', 'success');
    refreshSidebarLists();
  });
}

function openEditListModal(listId) {
  const list = getPatientList(listId);
  if (!list) return;

  // Backward compat: convert old shared boolean to sharing object
  const sharing = list.sharing || {
    mode: list.shared ? 'all' : 'private',
    sharedWith: [],
    permissions: 'view',
  };

  const bodyHTML = '<div class="form-group">' +
    '<label class="form-label">List Name</label>' +
    '<input type="text" class="form-control" id="edit-list-name" value="' + esc(list.name) + '" />' +
    '</div>' +
    _renderSharingForm(sharing) +
    '<hr style="margin:16px 0">' +
    '<button class="btn btn-danger btn-sm" id="edit-list-delete">Delete This List</button>';

  openModal({
    title: 'Edit List',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="edit-list-save">Save Changes</button>',
  });

  document.getElementById('edit-list-save').addEventListener('click', () => {
    const name = document.getElementById('edit-list-name').value.trim();
    if (!name) { showToast('Please enter a list name.', 'error'); return; }
    const newSharing = _readSharingForm();
    savePatientList({ id: listId, name, shared: newSharing.mode !== 'private', sharing: newSharing });
    closeModal();
    showToast('List updated.', 'success');
    refreshSidebarLists();
    renderPatientList(listId);
  });

  document.getElementById('edit-list-delete').addEventListener('click', () => {
    confirmAction({
      title: 'Delete List',
      message: 'Are you sure you want to delete "' + list.name + '"? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        deletePatientList(listId);
        closeModal();
        showToast('List deleted.', 'default');
        refreshSidebarLists();
        navigate('#dashboard');
      },
    });
  });
}

/* ============================================================
   Sharing Form Helpers
   ============================================================ */
function _renderSharingForm(sharing) {
  sharing = sharing || { mode: 'private', sharedWith: [], permissions: 'view' };
  const providers = getProviders();
  const user = getSessionUser();
  const currentPid = getCurrentProvider() || (user ? user.id : '');

  const provChecks = providers.filter(p => p.id !== currentPid).map(p =>
    '<label class="sharing-provider-check"><input type="checkbox" value="' + esc(p.id) + '"' +
    ((sharing.sharedWith || []).includes(p.id) ? ' checked' : '') + '> ' +
    esc(p.lastName + ', ' + p.firstName) + '</label>'
  ).join('');

  return '<div class="form-group" style="margin-top:12px">' +
    '<label class="form-label">Sharing</label>' +
    '<div class="sharing-radios">' +
      '<label><input type="radio" name="sharing-mode" value="private"' + (sharing.mode === 'private' ? ' checked' : '') + '> Private</label>' +
      '<label><input type="radio" name="sharing-mode" value="specific"' + (sharing.mode === 'specific' ? ' checked' : '') + '> Specific Providers</label>' +
      '<label><input type="radio" name="sharing-mode" value="all"' + (sharing.mode === 'all' ? ' checked' : '') + '> All Providers</label>' +
    '</div>' +
    '<div id="sharing-providers-wrap" class="sharing-providers-wrap' + (sharing.mode === 'specific' ? '' : ' hidden') + '">' +
      provChecks +
    '</div>' +
    '<div class="form-group" style="margin-top:8px">' +
      '<label class="form-label">Permission</label>' +
      '<select class="form-control form-control-sm" id="sharing-permission">' +
        '<option value="view"' + (sharing.permissions === 'view' ? ' selected' : '') + '>View Only</option>' +
        '<option value="edit"' + (sharing.permissions === 'edit' ? ' selected' : '') + '>Can Edit</option>' +
      '</select>' +
    '</div>' +
  '</div>';
}

function _readSharingForm() {
  const mode = document.querySelector('input[name="sharing-mode"]:checked')?.value || 'private';
  const sharedWith = [];
  if (mode === 'specific') {
    document.querySelectorAll('#sharing-providers-wrap input[type="checkbox"]:checked').forEach(cb => {
      sharedWith.push(cb.value);
    });
  }
  const permissions = document.getElementById('sharing-permission')?.value || 'view';
  return { mode, sharedWith, permissions };
}

// Wire sharing radio on modal open
document.addEventListener('click', e => {
  if (e.target.name === 'sharing-mode') {
    const wrap = document.getElementById('sharing-providers-wrap');
    if (wrap) wrap.classList.toggle('hidden', e.target.value !== 'specific');
  }
});

/* ============================================================
   Add Patient to List modals (unchanged logic, kept)
   ============================================================ */
function openAddPatientToListModal(listId) {
  const list = getPatientList(listId);
  if (!list) return;

  const patients = getPatients()
    .filter(p => !list.patientIds.includes(p.id))
    .sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));

  let optionsHTML = '<option value="">-- Select Patient --</option>';
  patients.forEach(p => {
    optionsHTML += '<option value="' + esc(p.id) + '">' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });

  const bodyHTML = '<div class="form-group">' +
    '<label class="form-label">Select Patient</label>' +
    '<select class="form-control" id="list-add-patient-select">' + optionsHTML + '</select>' +
    '</div>';

  openModal({
    title: 'Add Patient to "' + list.name + '"',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="list-add-patient-confirm">Add Patient</button>',
  });

  document.getElementById('list-add-patient-confirm').addEventListener('click', () => {
    const patientId = document.getElementById('list-add-patient-select').value;
    if (!patientId) { showToast('Please select a patient.', 'error'); return; }
    addPatientToList(listId, patientId);
    closeModal();
    showToast('Patient added to list.', 'success');
    renderPatientList(listId);
    refreshSidebarLists();
  });
}

function openImportListModal() {
  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;
  const sharedLists = getSharedPatientLists().filter(l => l.ownerId !== providerId);
  const subs = getListSubscriptions(providerId);

  let html = '';
  if (sharedLists.length === 0) {
    html = '<p class="text-muted">No shared lists available from other providers.</p>';
  } else {
    html = '<p class="text-muted text-sm" style="margin-bottom:12px">Select a shared list to copy or subscribe:</p>';
    sharedLists.forEach(l => {
      const owner = getProvider(l.ownerId);
      const ownerName = owner ? owner.firstName + ' ' + owner.lastName : 'Unknown';
      const isSubscribed = subs.some(s => s.listId === l.id);
      html += '<div class="medrec-item" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
        '<div>' +
          '<div style="font-weight:600">' + esc(l.name) + '</div>' +
          '<div class="text-muted text-sm">' + esc(ownerName) + ' · ' + l.patientIds.length + ' patients</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button class="btn btn-secondary btn-sm" data-import-list="' + esc(l.id) + '">Copy</button>' +
          (isSubscribed
            ? '<button class="btn btn-ghost btn-sm" data-unsub-list="' + esc(l.id) + '">Unsubscribe</button>'
            : '<button class="btn btn-primary btn-sm" data-sub-list="' + esc(l.id) + '">Subscribe</button>') +
        '</div>' +
      '</div>';
    });
  }

  openModal({
    title: 'Import / Subscribe to Shared Lists',
    bodyHTML: html,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
  });

  document.querySelectorAll('[data-import-list]').forEach(el => {
    el.addEventListener('click', () => {
      const srcList = getPatientList(el.dataset.importList);
      if (!srcList) return;
      savePatientList({
        name: srcList.name + ' (copy)',
        ownerId: providerId,
        patientIds: [...srcList.patientIds],
        shared: false,
      });
      closeModal();
      showToast('List imported!', 'success');
      refreshSidebarLists();
    });
  });

  document.querySelectorAll('[data-sub-list]').forEach(el => {
    el.addEventListener('click', () => {
      subscribeToList(el.dataset.subList, providerId);
      closeModal();
      showToast('Subscribed to list.', 'success');
      refreshSidebarLists();
    });
  });

  document.querySelectorAll('[data-unsub-list]').forEach(el => {
    el.addEventListener('click', () => {
      unsubscribeFromList(el.dataset.unsubList, providerId);
      closeModal();
      showToast('Unsubscribed.', 'default');
      refreshSidebarLists();
    });
  });
}

/* ---------- Add to List from Dashboard ---------- */
function openAddToListModal(patientId) {
  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;
  const lists = getPatientListsByOwner(providerId);

  if (lists.length === 0) {
    showToast('No lists yet. Create one from the sidebar first.', 'error');
    return;
  }

  let optionsHTML = '';
  lists.forEach(l => {
    const already = l.patientIds.includes(patientId);
    optionsHTML += '<option value="' + esc(l.id) + '"' + (already ? ' disabled' : '') + '>' +
      esc(l.name) + (already ? ' (already added)' : '') + '</option>';
  });

  const bodyHTML = '<div class="form-group">' +
    '<label class="form-label">Select List</label>' +
    '<select class="form-control" id="add-to-list-select">' + optionsHTML + '</select>' +
    '</div>';

  openModal({
    title: 'Add Patient to List',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="add-to-list-confirm">Add</button>',
  });

  document.getElementById('add-to-list-confirm').addEventListener('click', () => {
    const listId = document.getElementById('add-to-list-select').value;
    if (!listId) return;
    addPatientToList(listId, patientId);
    closeModal();
    showToast('Patient added to list.', 'success');
    refreshSidebarLists();
  });
}

/* ============================================================
   Smart Lists — Create, Render, Edit
   ============================================================ */
function openCreateSmartListModal() {
  const user = getSessionUser();
  if (!user) return;

  const bodyHTML = '<div class="form-group">' +
    '<label class="form-label">Smart List Name *</label>' +
    '<input type="text" class="form-control" id="smart-list-name" placeholder="e.g. Pending Orders Patients" />' +
    '</div>' +
    '<div class="form-group checkbox-group">' +
      '<input type="checkbox" id="smart-list-shared" />' +
      '<label for="smart-list-shared">Share with other providers</label>' +
    '</div>' +
    '<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Filter Criteria</h4>' +
    '<div id="smart-list-criteria"></div>';

  openModal({
    title: 'Create Smart List',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="smart-list-save">Create</button>',
    size: 'lg',
  });

  const criteriaContainer = document.getElementById('smart-list-criteria');
  renderFilterCriteriaForm(criteriaContainer, {});

  document.getElementById('smart-list-save').addEventListener('click', () => {
    const name = document.getElementById('smart-list-name').value.trim();
    if (!name) { showToast('Please enter a name.', 'error'); return; }
    const shared = document.getElementById('smart-list-shared').checked;
    const criteria = readFilterCriteria(criteriaContainer);
    const providerId = getCurrentProvider() || user.id;
    saveSmartList({ name, ownerId: providerId, shared, criteria });
    closeModal();
    showToast('Smart list "' + name + '" created.', 'success');
    refreshSidebarLists();
  });
}

function renderSmartList(listId) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const sl = getSmartList(listId);
  if (!sl) { navigate('#dashboard'); return; }

  const patients = evaluateSmartList(listId);
  const slIsPublic = !!sl.shared;

  setTopbar({
    title: sl.name,
    meta: patients.length + ' patient' + (patients.length !== 1 ? 's' : '') + ' · Smart List — auto-updated',
    actions: '<button class="btn btn-secondary btn-sm" id="smart-edit-criteria">Edit Criteria</button>' +
      '<button class="btn btn-secondary btn-sm" id="smart-view-criteria">View Criteria</button>' +
      '<button class="btn ' + (slIsPublic ? 'btn-success' : 'btn-secondary') + ' btn-sm" id="smart-toggle-public">' + (slIsPublic ? '🔓 Public' : 'Make Public') + '</button>' +
      '<button class="btn btn-danger btn-sm" id="smart-delete" style="margin-left:4px">Delete</button>' +
      '<button class="btn btn-secondary btn-sm" id="smart-back" style="margin-left:4px">Back</button>',
  });
  setActiveNav('smart-' + listId);

  const card = document.createElement('div');
  card.className = 'card';

  if (patients.length === 0) {
    card.appendChild(buildEmptyState('🔍', 'No patients match criteria', 'Edit criteria to broaden the filter.'));
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = '<thead><tr><th>Name</th><th>MRN</th><th>Age</th><th>Sex</th><th>Insurance</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');

    patients.sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName)).forEach(pat => {
      const tr = document.createElement('tr');
      tr.className = 'patient-row-clickable';
      tr.addEventListener('click', () => navigate('#chart/' + pat.id));

      const tdName = document.createElement('td');
      const nameBtn = document.createElement('button');
      nameBtn.className = 'table-link';
      nameBtn.textContent = pat.lastName + ', ' + pat.firstName;
      nameBtn.onclick = e => { e.stopPropagation(); navigate('#chart/' + pat.id); };
      tdName.appendChild(nameBtn);

      tr.appendChild(tdName);
      tr.appendChild(createTd(pat.mrn));
      tr.appendChild(createTd(_listCalcAge(pat.dob)));
      tr.appendChild(createTd(pat.sex || '—'));
      tr.appendChild(createTd(pat.insurance || '—'));

      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-primary btn-sm';
      viewBtn.textContent = 'Chart';
      viewBtn.onclick = e => { e.stopPropagation(); navigate('#chart/' + pat.id); };
      tdActions.appendChild(viewBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    card.appendChild(wrap);
  }

  app.appendChild(card);

  document.getElementById('smart-back').addEventListener('click', () => navigate('#dashboard'));
  document.getElementById('smart-delete').addEventListener('click', () => {
    confirmAction({
      title: 'Delete Smart List',
      message: 'Delete "' + sl.name + '"? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => { deleteSmartList(listId); refreshSidebarLists(); navigate('#dashboard'); },
    });
  });

  document.getElementById('smart-toggle-public').addEventListener('click', () => {
    saveSmartList({ id: listId, shared: !slIsPublic });
    showToast(!slIsPublic ? 'List is now public — others can import it.' : 'List is now private.', 'success');
    refreshSidebarLists();
    renderSmartList(listId);
  });
  document.getElementById('smart-edit-criteria').addEventListener('click', () => openEditSmartListModal(listId));
  document.getElementById('smart-view-criteria').addEventListener('click', () => {
    const c = sl.criteria || {};
    const lines = [];
    if (c.provider) { const p = getProvider(c.provider); lines.push('Provider: ' + (p ? p.lastName + ', ' + p.firstName : c.provider)); }
    if (c.sex) lines.push('Sex: ' + c.sex);
    if (c.ageMin) lines.push('Age Min: ' + c.ageMin);
    if (c.ageMax) lines.push('Age Max: ' + c.ageMax);
    if (c.insurance) lines.push('Insurance: ' + c.insurance);
    if (c.codeStatus) lines.push('Code Status: ' + c.codeStatus);
    if (c.diagnosis) lines.push('Diagnosis: ' + c.diagnosis);
    if (c.hasOverdueScreenings) lines.push('Has Overdue Screenings');
    if (c.hasUnsignedNotes) lines.push('Has Unsigned Notes');
    if (c.hasPendingOrders) lines.push('Has Pending Orders');
    openModal({
      title: 'Smart List Criteria',
      bodyHTML: lines.length > 0 ? '<ul>' + lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '<p class="text-muted">No criteria set — matches all patients.</p>',
      footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
    });
  });
}

function openEditSmartListModal(listId) {
  const sl = getSmartList(listId);
  if (!sl) return;

  const bodyHTML = '<div class="form-group">' +
    '<label class="form-label">Name</label>' +
    '<input type="text" class="form-control" id="edit-smart-name" value="' + esc(sl.name) + '" />' +
    '</div>' +
    '<div class="form-group checkbox-group">' +
      '<input type="checkbox" id="edit-smart-shared"' + (sl.shared ? ' checked' : '') + ' />' +
      '<label for="edit-smart-shared">Share with other providers</label>' +
    '</div>' +
    '<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Filter Criteria</h4>' +
    '<div id="edit-smart-criteria"></div>';

  openModal({
    title: 'Edit Smart List',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" id="edit-smart-save">Save</button>',
    size: 'lg',
  });

  const criteriaContainer = document.getElementById('edit-smart-criteria');
  renderFilterCriteriaForm(criteriaContainer, sl.criteria || {});

  document.getElementById('edit-smart-save').addEventListener('click', () => {
    const name = document.getElementById('edit-smart-name').value.trim();
    if (!name) { showToast('Please enter a name.', 'error'); return; }
    const shared = document.getElementById('edit-smart-shared').checked;
    const criteria = readFilterCriteria(criteriaContainer);
    saveSmartList({ id: listId, name, shared, criteria });
    closeModal();
    showToast('Smart list updated.', 'success');
    refreshSidebarLists();
    renderSmartList(listId);
  });
}

/* ---------- Sidebar Lists Refresh (includes smart lists + subscriptions) ---------- */
function refreshSidebarLists() {
  const container = document.getElementById('sidebar-lists');
  if (!container) return;
  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;

  // Custom lists
  const lists = getPatientListsByOwner(providerId);
  container.innerHTML = '';
  lists.forEach(l => {
    const a = document.createElement('a');
    a.href = '#list/' + l.id;
    a.className = 'nav-item nav-item-list';
    a.dataset.nav = 'list-' + l.id;
    a.innerHTML = '<span class="list-icon">📋</span> ' + esc(l.name) +
      '<span class="text-muted text-sm" style="margin-left:auto">' + l.patientIds.length + '</span>';
    a.addEventListener('contextmenu', e => {
      showContextMenu(e, [
        { label: 'Edit List', action: () => openEditListModal(l.id) },
        'separator',
        { label: 'Delete List', danger: true, action: () => confirmAction({
            title: 'Delete List',
            message: 'Delete "' + l.name + '"? This cannot be undone.',
            confirmLabel: 'Delete', danger: true,
            onConfirm: () => { deletePatientList(l.id); refreshSidebarLists(); navigate('#dashboard'); showToast('List deleted.', 'default'); },
          })
        },
      ]);
    });
    container.appendChild(a);
  });

  // Subscribed lists
  const subs = getListSubscriptions(providerId);
  subs.forEach(sub => {
    const srcList = getPatientList(sub.listId);
    if (!srcList) return;
    const owner = getProvider(srcList.ownerId);
    const a = document.createElement('a');
    a.href = '#list/' + srcList.id;
    a.className = 'nav-item nav-item-list';
    a.dataset.nav = 'list-' + srcList.id;
    a.innerHTML = '<span class="list-icon">🔗</span> ' + esc(srcList.name) +
      '<span class="text-muted text-sm" style="margin-left:auto">' + (owner ? esc(owner.lastName) : '') + '</span>';
    a.addEventListener('contextmenu', e => {
      showContextMenu(e, [
        { label: 'Unsubscribe', danger: true, action: () => confirmAction({
            title: 'Unsubscribe',
            message: 'Unsubscribe from "' + srcList.name + '"?',
            confirmLabel: 'Unsubscribe', danger: true,
            onConfirm: () => { unsubscribeFromList(sub.id); refreshSidebarLists(); showToast('Unsubscribed.', 'default'); },
          })
        },
      ]);
    });
    container.appendChild(a);
  });

  // Smart lists section
  const smartContainer = document.getElementById('sidebar-smart-lists');
  if (smartContainer) {
    smartContainer.innerHTML = '';
    const smartLists = getSmartListsByOwner(providerId);
    smartLists.forEach(sl => {
      const a = document.createElement('a');
      a.href = '#smart-list/' + sl.id;
      a.className = 'nav-item nav-item-list';
      a.dataset.nav = 'smart-' + sl.id;
      const count = evaluateSmartList(sl.id).length;
      a.innerHTML = '<span class="list-icon">⚡</span> ' + esc(sl.name) +
        '<span class="text-muted text-sm" style="margin-left:auto">' + count + '</span>';
      a.addEventListener('contextmenu', e => {
        showContextMenu(e, [
          { label: 'Edit Smart List', action: () => openEditSmartListModal(sl.id) },
          'separator',
          { label: 'Delete Smart List', danger: true, action: () => confirmAction({
              title: 'Delete Smart List',
              message: 'Delete "' + sl.name + '"? This cannot be undone.',
              confirmLabel: 'Delete', danger: true,
              onConfirm: () => { deleteSmartList(sl.id); refreshSidebarLists(); navigate('#dashboard'); showToast('Smart list deleted.', 'default'); },
            })
          },
        ]);
      });
      smartContainer.appendChild(a);
    });
  }
}
