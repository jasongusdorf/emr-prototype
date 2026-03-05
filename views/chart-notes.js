/* ============================================================
   views/chart-notes.js — Encounters card, past notes card,
   note reader modal
   ============================================================ */

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
      cardsContainer.appendChild(buildEmptyState('📝', 'No notes match', 'Try adjusting your filters.'));
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
