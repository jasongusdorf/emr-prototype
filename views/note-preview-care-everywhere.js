/* ============================================================
   views/note-preview-care-everywhere.js — Note Preview & Care Everywhere
   ============================================================ */

/* ============================================================
   1. NOTE PREVIEW PANE — Split-View Notes
   ============================================================ */

/**
 * renderNotePreviewPane(patientId, container)
 * Renders a split-view note browser inside `container`.
 * Left panel (40%): filterable note list.
 * Right panel (60%): full note preview with actions.
 */
function renderNotePreviewPane(patientId, container) {
  container.innerHTML = '';

  const encounters = getEncountersByPatient(patientId);
  const allProviders = getProviders();

  // Build note items from encounters
  const noteItems = [];
  encounters.forEach(function(enc) {
    const note = getNoteByEncounter(enc.id);
    if (!note) return;
    const prov = getProvider(enc.providerId);
    noteItems.push({ enc: enc, note: note, prov: prov, pinned: !!note.pinned });
  });

  // Sort: pinned first, then newest first
  function sortNoteItems() {
    noteItems.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.enc.dateTime) - new Date(a.enc.dateTime);
    });
  }
  sortNoteItems();

  // --- Wrapper ---
  const wrapper = document.createElement('div');
  wrapper.className = 'note-split-view';

  // === LEFT PANEL ===
  const leftPanel = document.createElement('div');
  leftPanel.className = 'note-list-panel';

  // Status summary bar
  const statusBar = document.createElement('div');
  statusBar.className = 'notes-status-summary';
  function updateStatusBar() {
    var total = noteItems.length;
    var signed = noteItems.filter(function(i) { return i.note.signed; }).length;
    var unsigned = total - signed;
    statusBar.textContent = total + ' note' + (total !== 1 ? 's' : '') + ' \u2014 ' + signed + ' signed, ' + unsigned + ' unsigned';
  }
  updateStatusBar();
  leftPanel.appendChild(statusBar);

  // Filter bar
  const filterBar = document.createElement('div');
  filterBar.className = 'note-filter-bar';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'form-control';
  typeSelect.innerHTML =
    '<option value="">All Types</option>' +
    '<option value="Progress Notes">Progress Notes</option>' +
    '<option value="H&P">H&amp;P</option>' +
    '<option value="Procedures">Procedures</option>' +
    '<option value="Consult">Consult</option>';
  filterBar.appendChild(typeSelect);

  const provSelect = document.createElement('select');
  provSelect.className = 'form-control';
  provSelect.innerHTML = '<option value="">All Providers</option>';
  var provIds = new Set();
  noteItems.forEach(function(ni) { if (ni.prov) provIds.add(ni.prov.id); });
  allProviders.filter(function(p) { return provIds.has(p.id); }).forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.lastName + ', ' + p.firstName;
    provSelect.appendChild(opt);
  });
  filterBar.appendChild(provSelect);

  const dateFrom = document.createElement('input');
  dateFrom.type = 'date';
  dateFrom.className = 'form-control';
  dateFrom.title = 'From date';
  filterBar.appendChild(dateFrom);

  const dateTo = document.createElement('input');
  dateTo.type = 'date';
  dateTo.className = 'form-control';
  dateTo.title = 'To date';
  filterBar.appendChild(dateTo);

  // Text search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-control';
  searchInput.placeholder = 'Search notes...';
  searchInput.style.flex = '1 1 100%';
  filterBar.appendChild(searchInput);

  leftPanel.appendChild(filterBar);

  // Note list container
  const noteListContainer = document.createElement('div');
  noteListContainer.className = 'note-list-panel-scroll';
  leftPanel.appendChild(noteListContainer);

  // === RIGHT PANEL ===
  const rightPanel = document.createElement('div');
  rightPanel.className = 'note-preview-panel';

  // State
  var selectedEncId = null;

  function _noteTypeLabel(enc) {
    return enc.visitSubtype || enc.visitType || 'Clinical Note';
  }

  function _noteSnippet(note) {
    var text = note.chiefComplaint || note.hpi || note.noteBody || note.assessment || '';
    if (text.length > 50) text = text.substring(0, 50) + '...';
    return text;
  }

  function _matchesTypeFilter(enc, filter) {
    if (!filter) return true;
    var label = _noteTypeLabel(enc).toLowerCase();
    var f = filter.toLowerCase();
    return label.indexOf(f) !== -1;
  }

  function _getAllNoteText(item) {
    var parts = [];
    var n = item.note;
    if (n.noteBody) parts.push(n.noteBody);
    if (n.chiefComplaint) parts.push(n.chiefComplaint);
    if (n.hpi) parts.push(n.hpi);
    if (n.ros) parts.push(n.ros);
    if (n.physicalExam) parts.push(n.physicalExam);
    if (n.assessment) parts.push(n.assessment);
    if (n.plan) parts.push(n.plan);
    if (n.addenda) {
      n.addenda.forEach(function(a) { if (a.text) parts.push(a.text); if (a.author) parts.push(a.author); });
    }
    if (item.prov) parts.push(item.prov.firstName + ' ' + item.prov.lastName);
    if (item.enc.visitType) parts.push(item.enc.visitType);
    if (item.enc.visitSubtype) parts.push(item.enc.visitSubtype);
    return parts.join(' ').toLowerCase();
  }

  function _matchesTextSearch(item, query) {
    if (!query) return true;
    return _getAllNoteText(item).indexOf(query.toLowerCase()) !== -1;
  }

  function _highlightText(text, query) {
    if (!query || !text) return esc(text || '');
    var escaped = esc(text);
    var escapedQuery = esc(query);
    var regex = new RegExp('(' + escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }

  function renderNoteList() {
    noteListContainer.innerHTML = '';
    var typeFilter = typeSelect.value;
    var provFilter = provSelect.value;
    var fromDate = dateFrom.value ? new Date(dateFrom.value + 'T00:00:00') : null;
    var toDate = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;
    var textQuery = searchInput.value.trim();

    var filtered = noteItems.filter(function(item) {
      if (!_matchesTypeFilter(item.enc, typeFilter)) return false;
      if (provFilter && (!item.prov || item.prov.id !== provFilter)) return false;
      if (fromDate && new Date(item.enc.dateTime) < fromDate) return false;
      if (toDate && new Date(item.enc.dateTime) > toDate) return false;
      if (!_matchesTextSearch(item, textQuery)) return false;
      return true;
    });

    if (filtered.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.style.cssText = 'padding:24px;text-align:center;color:var(--text-muted);font-size:13px;';
      emptyEl.textContent = textQuery ? 'No notes match "' + textQuery + '".' : 'No notes match the current filters.';
      noteListContainer.appendChild(emptyEl);
      return;
    }

    filtered.forEach(function(item) {
      var row = document.createElement('div');
      row.className = 'note-list-item' + (item.enc.id === selectedEncId ? ' selected' : '');

      var d = item.enc.dateTime ? new Date(item.enc.dateTime) : null;
      var dateStr = d && !isNaN(d)
        ? (d.getMonth() + 1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2)
        : '--';

      var dateEl = document.createElement('div');
      dateEl.className = 'note-list-item-date';
      dateEl.textContent = dateStr;

      var typeBadge = document.createElement('span');
      typeBadge.className = 'badge badge-' + (item.enc.visitType || 'other').toLowerCase().replace(/\s+/g, '-');
      typeBadge.textContent = _noteTypeLabel(item.enc);

      // Pin button
      var pinBtn = document.createElement('button');
      pinBtn.className = 'note-pin-btn' + (item.pinned ? ' pinned' : '');
      pinBtn.innerHTML = item.pinned ? '&#9733;' : '&#9734;';
      pinBtn.title = item.pinned ? 'Unpin note' : 'Pin note';
      pinBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        item.pinned = !item.pinned;
        item.note.pinned = item.pinned;
        saveNote({ encounterId: item.enc.id, pinned: item.pinned });
        sortNoteItems();
        renderNoteList();
      });

      var authorEl = document.createElement('div');
      authorEl.className = 'note-list-item-author';
      authorEl.textContent = item.prov
        ? item.prov.lastName + ', ' + item.prov.firstName
        : '[Removed Provider]';

      var snippetEl = document.createElement('div');
      snippetEl.className = 'note-list-item-snippet';
      snippetEl.textContent = _noteSnippet(item.note);

      var metaRow = document.createElement('div');
      metaRow.className = 'note-list-item-meta';
      metaRow.appendChild(dateEl);
      metaRow.appendChild(typeBadge);
      metaRow.appendChild(pinBtn);

      row.appendChild(metaRow);
      row.appendChild(authorEl);
      row.appendChild(snippetEl);

      row.addEventListener('click', function() {
        selectedEncId = item.enc.id;
        renderNoteList();
        renderNotePreview(item);
      });

      noteListContainer.appendChild(row);
    });
  }

  function renderNotePreview(item) {
    rightPanel.innerHTML = '';

    if (!item) {
      var placeholder = document.createElement('div');
      placeholder.className = 'note-preview-placeholder';
      placeholder.textContent = 'Select a note from the list to preview';
      rightPanel.appendChild(placeholder);
      return;
    }

    var enc = item.enc;
    var note = item.note;
    var prov = item.prov;

    // --- Header ---
    var header = document.createElement('div');
    header.className = 'note-preview-header';

    var titleRow = document.createElement('div');
    titleRow.className = 'note-preview-title-row';

    var titleEl = document.createElement('h3');
    titleEl.className = 'note-preview-title';
    titleEl.textContent = _noteTypeLabel(enc);

    var statusBadge = document.createElement('span');
    statusBadge.className = note.signed ? 'badge badge-signed' : 'badge badge-open';
    statusBadge.textContent = note.signed ? 'Signed' : 'Unsigned';

    titleRow.appendChild(titleEl);
    titleRow.appendChild(statusBadge);
    header.appendChild(titleRow);

    var d = enc.dateTime ? new Date(enc.dateTime) : null;
    var dateStr = d && !isNaN(d)
      ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '--';
    var timeStr = d && !isNaN(d)
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';

    var metaEl = document.createElement('div');
    metaEl.className = 'note-preview-meta';
    metaEl.innerHTML =
      '<span>' + esc(dateStr) + (timeStr ? ' at ' + esc(timeStr) : '') + '</span>' +
      '<span class="note-preview-sep">|</span>' +
      '<span>' + esc(prov ? prov.firstName + ' ' + prov.lastName + (prov.degree ? ', ' + prov.degree : '') : '[Removed Provider]') + '</span>' +
      '<span class="note-preview-sep">|</span>' +
      '<span>' + esc(enc.visitType || '') + (enc.visitSubtype ? ' -- ' + esc(enc.visitSubtype) : '') + '</span>';
    header.appendChild(metaEl);

    // Action buttons
    var actionBar = document.createElement('div');
    actionBar.className = 'note-preview-actions';

    actionBar.appendChild(makeBtn('Open in Encounter', 'btn btn-primary btn-sm', function() {
      navigate('#encounter/' + enc.id);
    }));

    actionBar.appendChild(makeBtn('Print Note', 'btn btn-secondary btn-sm', function() {
      _printNote(enc, note, prov);
    }));

    actionBar.appendChild(makeBtn('Copy Note', 'btn btn-secondary btn-sm', function() {
      var copyParts = [];
      var copyFields = [
        { key: 'chiefComplaint', label: 'Chief Complaint' },
        { key: 'hpi', label: 'HPI' },
        { key: 'ros', label: 'ROS' },
        { key: 'physicalExam', label: 'Physical Examination' },
        { key: 'assessment', label: 'Assessment' },
        { key: 'plan', label: 'Plan' },
      ];
      copyFields.forEach(function(f) {
        if (note[f.key]) copyParts.push(f.label + ':\n' + note[f.key]);
      });
      if (copyParts.length === 0 && note.noteBody) copyParts.push(note.noteBody);
      var copyText = copyParts.join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(function() {
          showToast('Note copied to clipboard', 'success');
        });
      } else {
        showToast('Clipboard not available', 'error');
      }
    }));

    if (note.signed) {
      actionBar.appendChild(makeBtn('Add Addendum', 'btn btn-secondary btn-sm', function() {
        _openAddendumFromPreview(enc, note, prov);
      }));
    }

    header.appendChild(actionBar);
    rightPanel.appendChild(header);

    // --- Body ---
    var body = document.createElement('div');
    body.className = 'note-preview-body';
    var textQuery = searchInput.value.trim();

    var sections = [];
    if (note.chiefComplaint) sections.push({ label: 'Chief Complaint', text: note.chiefComplaint });
    if (note.hpi)            sections.push({ label: 'History of Present Illness', text: note.hpi });
    if (note.ros)            sections.push({ label: 'Review of Systems', text: note.ros });
    if (note.physicalExam)   sections.push({ label: 'Physical Examination', text: note.physicalExam });
    if (note.assessment)     sections.push({ label: 'Assessment', text: note.assessment });
    if (note.plan)           sections.push({ label: 'Plan', text: note.plan });
    if (note.noteBody && sections.length === 0) {
      sections.push({ label: 'Note', text: note.noteBody });
    }

    if (sections.length === 0) {
      var emptyNote = document.createElement('div');
      emptyNote.className = 'note-preview-empty';
      emptyNote.textContent = 'No note content documented.';
      body.appendChild(emptyNote);
    } else {
      sections.forEach(function(s) {
        var sec = document.createElement('div');
        sec.className = 'note-preview-section';

        var secLabel = document.createElement('div');
        secLabel.className = 'note-preview-section-label';
        secLabel.textContent = s.label;

        var secBody = document.createElement('div');
        secBody.className = 'note-preview-section-body';
        secBody.style.whiteSpace = 'pre-wrap';
        secBody.innerHTML = _highlightText(s.text, textQuery);

        sec.appendChild(secLabel);
        sec.appendChild(secBody);
        body.appendChild(sec);
      });
    }

    // Signature
    if (note.signed) {
      var sigEl = document.createElement('div');
      sigEl.className = 'note-preview-signature';
      var sa = note.signedAt ? new Date(note.signedAt) : null;
      var saStr = sa && !isNaN(sa)
        ? sa.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
          ' at ' + sa.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : '';
      sigEl.innerHTML =
        '<span class="note-preview-sig-check">&#10003;</span> Electronically signed by <strong>' +
        esc(note.signedBy || (prov ? prov.firstName + ' ' + prov.lastName : '')) + '</strong>' +
        (saStr ? ' &mdash; ' + esc(saStr) : '');
      body.appendChild(sigEl);
    }

    // Addenda
    if (note.addenda && note.addenda.length > 0) {
      var addendaWrap = document.createElement('div');
      addendaWrap.className = 'note-preview-addenda';
      note.addenda.forEach(function(a) {
        var addEl = document.createElement('div');
        addEl.className = 'note-preview-addendum';
        addEl.innerHTML =
          '<div class="note-preview-addendum-hdr">Addendum' +
          (a.author ? ' &mdash; ' + esc(a.author) : '') +
          (a.date ? ' &mdash; ' + esc(a.date) : '') +
          '</div>' +
          '<div class="note-preview-section-body" style="white-space:pre-wrap;">' + _highlightText(a.text || '', textQuery) + '</div>';
        addendaWrap.appendChild(addEl);
      });
      body.appendChild(addendaWrap);
    }

    rightPanel.appendChild(body);
  }

  function _printNote(enc, note, prov) {
    var provName = prov
      ? prov.firstName + ' ' + prov.lastName + (prov.degree ? ', ' + prov.degree : '')
      : '[Removed Provider]';
    var patient = getPatient(patientId);
    var patName = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';
    var d = enc.dateTime ? new Date(enc.dateTime) : null;
    var dateStr = d && !isNaN(d)
      ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '--';

    var sections = [];
    if (note.chiefComplaint) sections.push({ label: 'Chief Complaint', text: note.chiefComplaint });
    if (note.hpi)            sections.push({ label: 'HPI', text: note.hpi });
    if (note.ros)            sections.push({ label: 'ROS', text: note.ros });
    if (note.physicalExam)   sections.push({ label: 'Physical Examination', text: note.physicalExam });
    if (note.assessment)     sections.push({ label: 'Assessment', text: note.assessment });
    if (note.plan)           sections.push({ label: 'Plan', text: note.plan });
    if (note.noteBody && sections.length === 0) sections.push({ label: 'Note', text: note.noteBody });

    var html =
      '<html><head><title>Note — ' + esc(patName) + '</title>' +
      '<style>body{font-family:serif;margin:40px;line-height:1.5;}h1{font-size:18px;margin-bottom:4px;}' +
      '.meta{font-size:13px;color:#555;margin-bottom:20px;}.section-label{font-weight:bold;margin-top:16px;margin-bottom:4px;}' +
      '.section-body{white-space:pre-wrap;margin-bottom:12px;}.sig{margin-top:24px;border-top:1px solid #ccc;padding-top:8px;font-style:italic;}</style>' +
      '</head><body>' +
      '<h1>' + esc(_noteTypeLabel(enc)) + '</h1>' +
      '<div class="meta">' + esc(patName) + ' | ' + esc(dateStr) + ' | ' + esc(provName) + '</div>';

    sections.forEach(function(s) {
      html += '<div class="section-label">' + esc(s.label) + '</div>';
      html += '<div class="section-body">' + esc(s.text) + '</div>';
    });

    if (note.signed) {
      html += '<div class="sig">Electronically signed by ' + esc(note.signedBy || provName) + '</div>';
    }

    html += '</body></html>';

    var win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  }

  function _openAddendumFromPreview(enc, note, prov) {
    var user = getSessionUser();
    var userName = user ? user.firstName + ' ' + user.lastName + (user.degree ? ', ' + user.degree : '') : 'Unknown';

    openModal({
      title: 'Add Addendum',
      bodyHTML:
        '<div style="margin-bottom:8px;">Signing as: <strong>' + esc(userName) + '</strong></div>' +
        '<textarea id="addendum-text" class="form-control" rows="6" placeholder="Enter addendum text..."></textarea>',
      footerHTML:
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" id="btn-save-addendum">Save Addendum</button>',
    });

    setTimeout(function() {
      var ta = document.getElementById('addendum-text');
      if (ta) ta.focus();

      var btn = document.getElementById('btn-save-addendum');
      if (btn) {
        btn.addEventListener('click', function() {
          var text = (document.getElementById('addendum-text') || {}).value || '';
          if (!text.trim()) {
            showToast('Addendum text is required', 'error');
            return;
          }
          var addenda = note.addenda || [];
          addenda.push({
            author: userName,
            date: new Date().toISOString(),
            text: text.trim(),
          });
          saveNote({ encounterId: enc.id, addenda: addenda });
          closeModal();
          showToast('Addendum saved', 'success');
          // Refresh the preview
          var updatedNote = getNoteByEncounter(enc.id);
          renderNotePreview({ enc: enc, note: updatedNote, prov: prov });
        });
      }
    }, 60);
  }

  // Assemble
  wrapper.appendChild(leftPanel);
  wrapper.appendChild(rightPanel);
  container.appendChild(wrapper);

  // Initial renders
  renderNoteList();
  renderNotePreview(null);

  // Filter listeners
  typeSelect.addEventListener('change', renderNoteList);
  provSelect.addEventListener('change', renderNoteList);
  dateFrom.addEventListener('change', renderNoteList);
  dateTo.addEventListener('change', renderNoteList);

  // Text search with debounce
  var _searchDebounce = null;
  searchInput.addEventListener('input', function() {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(function() {
      renderNoteList();
      // Re-render preview if one is selected, to update highlighting
      if (selectedEncId) {
        var selectedItem = noteItems.find(function(i) { return i.enc.id === selectedEncId; });
        if (selectedItem) renderNotePreview(selectedItem);
      }
    }, 200);
  });
}


/* ============================================================
   2. CARE EVERYWHERE — Cross-System Record Sharing
   ============================================================ */

/* ---------- Constants ---------- */
var _CE_HOSPITAL_NAMES = [
  'Beth Israel Lahey Health',
  'Mass General Brigham',
  'Mayo Clinic',
  'Cleveland Clinic',
  'Johns Hopkins',
  'Stanford Health Care',
];

var _CE_RECORD_TYPES = ['encounter', 'lab', 'medication', 'allergy', 'immunization', 'problem', 'note'];

var _CE_TYPE_ICONS = {
  encounter:    '🏥',
  lab:          '🔬',
  medication:   '💊',
  allergy:      '⚠️',
  immunization: '💉',
  problem:      '📋',
  note:         '📝',
};

/* ---------- Data Layer ---------- */

function getExternalRecords(patientId) {
  return loadAll(KEYS.externalRecords).filter(function(r) {
    return r.patientId === patientId;
  });
}

function _getExternalRecordById(recordId) {
  return loadAll(KEYS.externalRecords).find(function(r) { return r.id === recordId; }) || null;
}

function saveExternalRecord(record) {
  var all = loadAll(KEYS.externalRecords, true);
  var idx = all.findIndex(function(r) { return r.id === record.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], record);
  } else {
    if (!record.id) record.id = generateId();
    if (!record.receivedAt) record.receivedAt = new Date().toISOString();
    if (!record.status) record.status = 'received';
    all.push(record);
  }
  saveAll(KEYS.externalRecords, all);
  return record;
}

function importExternalRecord(recordId) {
  var record = _getExternalRecordById(recordId);
  if (!record) return false;

  var data = record.data || {};
  var patientId = record.patientId;

  switch (record.recordType) {
    case 'allergy':
      savePatientAllergy({
        patientId: patientId,
        allergen: data.allergen || data.name || 'Unknown',
        reaction: data.reaction || '',
        severity: data.severity || 'Moderate',
        type: data.type || 'Drug',
      });
      break;

    case 'problem':
      saveActiveProblem({
        patientId: patientId,
        name: data.name || data.diagnosis || 'Unknown',
        icd10: data.icd10 || '',
        onset: data.onset || '',
        status: 'Active',
        notes: 'Imported from ' + (record.sourceSystem || 'external system'),
      });
      break;

    case 'medication':
      savePatientMedication({
        patientId: patientId,
        name: data.name || data.drug || 'Unknown',
        dose: data.dose || '',
        unit: data.unit || '',
        route: data.route || 'PO',
        frequency: data.frequency || '',
        status: 'Active',
      });
      break;

    case 'immunization':
      saveImmunization({
        patientId: patientId,
        vaccine: data.vaccine || data.name || 'Unknown',
        date: data.date || new Date().toISOString().split('T')[0],
        site: data.site || '',
        lot: data.lot || '',
        notes: 'Imported from ' + (record.sourceSystem || 'external system'),
      });
      break;

    case 'lab':
      if (typeof saveLabResult === 'function') {
        saveLabResult({
          patientId: patientId,
          panel: data.panel || data.testName || 'External Lab',
          resultDate: data.resultDate || data.date || new Date().toISOString(),
          results: data.results || [{ name: data.testName || 'Result', value: data.value || '', unit: data.unit || '', refRange: data.refRange || '' }],
          notes: 'Imported from ' + (record.sourceSystem || 'external system'),
        });
      }
      break;

    case 'encounter':
    case 'note':
      // External encounters/notes are stored as reference only
      break;
  }

  // Update status
  var all = loadAll(KEYS.externalRecords, true);
  var idx = all.findIndex(function(r) { return r.id === recordId; });
  if (idx >= 0) {
    all[idx].status = 'imported';
    all[idx].importedAt = new Date().toISOString();
    saveAll(KEYS.externalRecords, all);
  }

  return true;
}

function rejectExternalRecord(recordId) {
  var all = loadAll(KEYS.externalRecords, true);
  var idx = all.findIndex(function(r) { return r.id === recordId; });
  if (idx >= 0) {
    all[idx].status = 'rejected';
    saveAll(KEYS.externalRecords, all);
    return true;
  }
  return false;
}

function simulateReceiveRecords(patientId) {
  var patient = getPatient(patientId);
  if (!patient) return [];

  var count = 3 + Math.floor(Math.random() * 3); // 3-5 records
  var records = [];

  // Pick 2-3 random hospitals
  var shuffled = _CE_HOSPITAL_NAMES.slice().sort(function() { return Math.random() - 0.5; });
  var hospitals = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));

  for (var i = 0; i < count; i++) {
    var hospital = hospitals[i % hospitals.length];
    var recordType = _CE_RECORD_TYPES[Math.floor(Math.random() * _CE_RECORD_TYPES.length)];
    var data = _generateFakeRecordData(recordType, patient);

    var record = {
      id: generateId(),
      patientId: patientId,
      sourceSystem: hospital,
      sourceSystemId: 'SYS-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      recordType: recordType,
      data: data,
      receivedAt: new Date().toISOString(),
      importedAt: null,
      status: 'received',
    };

    saveExternalRecord(record);
    records.push(record);
  }

  return records;
}

function _generateFakeRecordData(recordType, patient) {
  var now = new Date();
  var pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 365));
  var dateStr = pastDate.toISOString().split('T')[0];

  switch (recordType) {
    case 'allergy':
      var allergens = ['Penicillin', 'Sulfa', 'Codeine', 'Aspirin', 'Ibuprofen', 'Latex', 'Shellfish', 'Peanuts'];
      var reactions = ['Rash', 'Hives', 'Anaphylaxis', 'Nausea', 'Swelling', 'Itching'];
      var severities = ['Mild', 'Moderate', 'Severe'];
      return {
        allergen: allergens[Math.floor(Math.random() * allergens.length)],
        reaction: reactions[Math.floor(Math.random() * reactions.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        type: 'Drug',
        recordedDate: dateStr,
      };

    case 'problem':
      var problems = [
        { name: 'Essential Hypertension', icd10: 'I10' },
        { name: 'Type 2 Diabetes Mellitus', icd10: 'E11.9' },
        { name: 'Hyperlipidemia', icd10: 'E78.5' },
        { name: 'Gastroesophageal Reflux Disease', icd10: 'K21.0' },
        { name: 'Major Depressive Disorder', icd10: 'F32.9' },
        { name: 'Chronic Kidney Disease, Stage 3', icd10: 'N18.3' },
      ];
      var prob = problems[Math.floor(Math.random() * problems.length)];
      return {
        name: prob.name,
        icd10: prob.icd10,
        onset: dateStr,
        status: 'Active',
      };

    case 'medication':
      var meds = [
        { name: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'Daily' },
        { name: 'Metformin', dose: '500', unit: 'mg', route: 'PO', frequency: 'BID' },
        { name: 'Atorvastatin', dose: '20', unit: 'mg', route: 'PO', frequency: 'Daily' },
        { name: 'Omeprazole', dose: '20', unit: 'mg', route: 'PO', frequency: 'Daily' },
        { name: 'Amlodipine', dose: '5', unit: 'mg', route: 'PO', frequency: 'Daily' },
      ];
      return meds[Math.floor(Math.random() * meds.length)];

    case 'immunization':
      var vaccines = [
        { vaccine: 'Influenza (Fluzone)', date: dateStr },
        { vaccine: 'COVID-19 (Pfizer-BioNTech)', date: dateStr },
        { vaccine: 'Tdap (Adacel)', date: dateStr },
        { vaccine: 'Pneumococcal (Prevnar 20)', date: dateStr },
        { vaccine: 'Shingrix (Recombinant Zoster)', date: dateStr },
      ];
      return vaccines[Math.floor(Math.random() * vaccines.length)];

    case 'lab':
      var labs = [
        { panel: 'Basic Metabolic Panel', testName: 'Glucose', value: (70 + Math.floor(Math.random() * 80)).toString(), unit: 'mg/dL', refRange: '70-100', resultDate: dateStr },
        { panel: 'CBC', testName: 'WBC', value: (4 + Math.random() * 8).toFixed(1), unit: 'K/uL', refRange: '4.5-11.0', resultDate: dateStr },
        { panel: 'Lipid Panel', testName: 'Total Cholesterol', value: (150 + Math.floor(Math.random() * 100)).toString(), unit: 'mg/dL', refRange: '<200', resultDate: dateStr },
        { panel: 'HbA1c', testName: 'Hemoglobin A1c', value: (5 + Math.random() * 4).toFixed(1), unit: '%', refRange: '<5.7', resultDate: dateStr },
      ];
      return labs[Math.floor(Math.random() * labs.length)];

    case 'encounter':
      var types = ['Outpatient', 'Emergency', 'Inpatient'];
      return {
        visitType: types[Math.floor(Math.random() * types.length)],
        date: dateStr,
        provider: 'Dr. ' + ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][Math.floor(Math.random() * 5)],
        summary: 'Follow-up visit for chronic condition management.',
      };

    case 'note':
      var noteTypes = ['Progress Note', 'Discharge Summary', 'Consult Note', 'H&P'];
      return {
        noteType: noteTypes[Math.floor(Math.random() * noteTypes.length)],
        date: dateStr,
        author: 'Dr. ' + ['Patel', 'Garcia', 'Kim', 'Lee', 'Chen'][Math.floor(Math.random() * 5)],
        content: 'Patient seen for evaluation. Clinical findings reviewed. Plan discussed with patient.',
      };

    default:
      return { description: 'External record', date: dateStr };
  }
}


/* ---------- View Functions ---------- */

/**
 * renderCareEverywhere(patientId, container)
 * Renders the Care Everywhere tab inside the given container.
 */
function renderCareEverywhere(patientId, container) {
  container.innerHTML = '';

  var records = getExternalRecords(patientId);

  // Header
  var header = document.createElement('div');
  header.className = 'ce-header';

  var titleEl = document.createElement('h3');
  titleEl.className = 'ce-title';
  titleEl.textContent = 'External Records — Care Everywhere';

  var queryBtn = makeBtn('Refresh / Query External Systems', 'btn btn-primary btn-sm', function() {
    var newRecords = simulateReceiveRecords(patientId);
    showToast(newRecords.length + ' new record(s) received', 'success');
    renderCareEverywhere(patientId, container);
  });

  header.appendChild(titleEl);
  header.appendChild(queryBtn);
  container.appendChild(header);

  // Summary
  var sourceSystems = {};
  records.forEach(function(r) {
    if (!sourceSystems[r.sourceSystem]) sourceSystems[r.sourceSystem] = [];
    sourceSystems[r.sourceSystem].push(r);
  });
  var systemCount = Object.keys(sourceSystems).length;

  var summaryEl = document.createElement('div');
  summaryEl.className = 'ce-summary';
  summaryEl.textContent = records.length + ' record' + (records.length !== 1 ? 's' : '') +
    ' from ' + systemCount + ' system' + (systemCount !== 1 ? 's' : '');
  container.appendChild(summaryEl);

  if (records.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'ce-empty';
    emptyEl.innerHTML =
      '<div style="font-size:36px;margin-bottom:12px;">🔗</div>' +
      '<div style="font-weight:600;margin-bottom:4px;">No external records</div>' +
      '<div style="color:var(--text-muted);font-size:13px;">Click "Refresh / Query External Systems" to search for records from other health systems.</div>';
    container.appendChild(emptyEl);
    return;
  }

  // Source systems badges
  var badgeRow = document.createElement('div');
  badgeRow.className = 'ce-source-badges';
  Object.keys(sourceSystems).forEach(function(sys) {
    var badge = document.createElement('span');
    badge.className = 'ce-source-badge';
    badge.innerHTML = esc(sys) + ' <span class="ce-source-count">' + sourceSystems[sys].length + '</span>';
    badgeRow.appendChild(badge);
  });
  container.appendChild(badgeRow);

  // Records grouped by source system, then by type
  Object.keys(sourceSystems).forEach(function(sys) {
    var group = document.createElement('div');
    group.className = 'ce-system-group';

    var groupHeader = document.createElement('div');
    groupHeader.className = 'ce-system-header';
    groupHeader.textContent = sys;
    group.appendChild(groupHeader);

    // Group by type
    var byType = {};
    sourceSystems[sys].forEach(function(r) {
      if (!byType[r.recordType]) byType[r.recordType] = [];
      byType[r.recordType].push(r);
    });

    Object.keys(byType).forEach(function(type) {
      var typeHeader = document.createElement('div');
      typeHeader.className = 'ce-type-header';
      typeHeader.textContent = (_CE_TYPE_ICONS[type] || '') + ' ' + type.charAt(0).toUpperCase() + type.slice(1) + 's';
      group.appendChild(typeHeader);

      byType[type].forEach(function(record) {
        group.appendChild(_buildRecordCard(record, patientId, container));
      });
    });

    container.appendChild(group);
  });
}

function _buildRecordCard(record, patientId, parentContainer) {
  var card = document.createElement('div');
  card.className = 'ce-record-card';

  var icon = document.createElement('span');
  icon.className = 'ce-record-type-icon';
  icon.textContent = _CE_TYPE_ICONS[record.recordType] || '📄';

  var info = document.createElement('div');
  info.className = 'ce-record-info';

  var summary = document.createElement('div');
  summary.className = 'ce-record-summary';
  summary.textContent = _getRecordSummary(record);

  var meta = document.createElement('div');
  meta.className = 'ce-record-meta';
  var receivedDate = record.receivedAt ? new Date(record.receivedAt) : null;
  var receivedStr = receivedDate && !isNaN(receivedDate)
    ? receivedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '--';
  meta.textContent = record.sourceSystem + ' | Received: ' + receivedStr;

  info.appendChild(summary);
  info.appendChild(meta);

  var statusBadge = document.createElement('span');
  statusBadge.className = 'ce-status-badge ce-status-' + record.status;
  statusBadge.textContent = record.status.charAt(0).toUpperCase() + record.status.slice(1);

  var actions = document.createElement('div');
  actions.className = 'ce-record-actions';

  actions.appendChild(makeBtn('Review', 'btn btn-secondary btn-sm', function(e) {
    e.stopPropagation();
    openExternalRecordModal(record.id);
  }));

  if (record.status === 'received' || record.status === 'reviewed') {
    actions.appendChild(makeBtn('Import', 'btn btn-primary btn-sm ce-import-btn', function(e) {
      e.stopPropagation();
      if (importExternalRecord(record.id)) {
        showToast(record.recordType + ' imported to chart', 'success');
        renderCareEverywhere(patientId, parentContainer);
      } else {
        showToast('Failed to import record', 'error');
      }
    }));

    actions.appendChild(makeBtn('Reject', 'btn btn-danger btn-sm', function(e) {
      e.stopPropagation();
      rejectExternalRecord(record.id);
      showToast('Record rejected', 'warning');
      renderCareEverywhere(patientId, parentContainer);
    }));
  }

  card.appendChild(icon);
  card.appendChild(info);
  card.appendChild(statusBadge);
  card.appendChild(actions);

  return card;
}

function _getRecordSummary(record) {
  var data = record.data || {};
  switch (record.recordType) {
    case 'allergy':
      return (data.allergen || 'Unknown allergen') + (data.severity ? ' (' + data.severity + ')' : '');
    case 'problem':
      return (data.name || 'Unknown problem') + (data.icd10 ? ' [' + data.icd10 + ']' : '');
    case 'medication':
      return (data.name || 'Unknown') + (data.dose ? ' ' + data.dose : '') + (data.unit ? ' ' + data.unit : '') + (data.frequency ? ' ' + data.frequency : '');
    case 'immunization':
      return (data.vaccine || data.name || 'Unknown vaccine') + (data.date ? ' (' + data.date + ')' : '');
    case 'lab':
      return (data.testName || data.panel || 'Lab result') + (data.value ? ': ' + data.value : '') + (data.unit ? ' ' + data.unit : '');
    case 'encounter':
      return (data.visitType || 'Visit') + (data.date ? ' on ' + data.date : '') + (data.provider ? ' with ' + data.provider : '');
    case 'note':
      return (data.noteType || 'Note') + (data.date ? ' — ' + data.date : '') + (data.author ? ' by ' + data.author : '');
    default:
      return data.description || 'External record';
  }
}


/**
 * openExternalRecordModal(recordId) — Detail view for external record
 */
function openExternalRecordModal(recordId) {
  var record = _getExternalRecordById(recordId);
  if (!record) {
    showToast('Record not found', 'error');
    return;
  }

  // Mark as reviewed if received
  if (record.status === 'received') {
    var all = loadAll(KEYS.externalRecords, true);
    var idx = all.findIndex(function(r) { return r.id === recordId; });
    if (idx >= 0) {
      all[idx].status = 'reviewed';
      saveAll(KEYS.externalRecords, all);
      record = all[idx];
    }
  }

  var data = record.data || {};
  var receivedDate = record.receivedAt ? new Date(record.receivedAt) : null;
  var receivedStr = receivedDate && !isNaN(receivedDate)
    ? receivedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '--';

  // Build body
  var bodyHTML = '';

  // Source info
  bodyHTML +=
    '<div class="ce-modal-section">' +
      '<div class="ce-modal-label">Source System</div>' +
      '<div class="ce-modal-value">' + esc(record.sourceSystem) + '</div>' +
    '</div>';
  bodyHTML +=
    '<div class="ce-modal-section">' +
      '<div class="ce-modal-label">Source ID</div>' +
      '<div class="ce-modal-value" style="font-family:monospace;font-size:12px;">' + esc(record.sourceSystemId || '--') + '</div>' +
    '</div>';
  bodyHTML +=
    '<div class="ce-modal-row">' +
      '<div class="ce-modal-section" style="flex:1;">' +
        '<div class="ce-modal-label">Record Type</div>' +
        '<div class="ce-modal-value">' + esc((_CE_TYPE_ICONS[record.recordType] || '') + ' ' + record.recordType.charAt(0).toUpperCase() + record.recordType.slice(1)) + '</div>' +
      '</div>' +
      '<div class="ce-modal-section" style="flex:1;">' +
        '<div class="ce-modal-label">Received</div>' +
        '<div class="ce-modal-value">' + esc(receivedStr) + '</div>' +
      '</div>' +
      '<div class="ce-modal-section" style="flex:1;">' +
        '<div class="ce-modal-label">Status</div>' +
        '<div><span class="ce-status-badge ce-status-' + record.status + '">' + esc(record.status.charAt(0).toUpperCase() + record.status.slice(1)) + '</span></div>' +
      '</div>' +
    '</div>';

  // Record data
  bodyHTML += '<div class="ce-modal-divider"></div>';
  bodyHTML += '<div class="ce-modal-label" style="margin-bottom:8px;">Record Data</div>';
  bodyHTML += _renderRecordData(record);

  // Conflict detection / comparison
  var conflictHTML = _buildConflictComparison(record);
  if (conflictHTML) {
    bodyHTML += '<div class="ce-modal-divider"></div>';
    bodyHTML += '<div class="ce-modal-label" style="margin-bottom:8px;">Comparison with Local Data</div>';
    bodyHTML += conflictHTML;
  }

  // FHIR JSON (collapsible)
  var fhirResource = _recordToFHIR(record);
  if (fhirResource) {
    bodyHTML +=
      '<div class="ce-modal-divider"></div>' +
      '<details class="ce-fhir-details">' +
        '<summary class="ce-fhir-summary">FHIR R4 JSON</summary>' +
        '<pre class="ce-fhir-json">' + esc(JSON.stringify(fhirResource, null, 2)) + '</pre>' +
      '</details>';
  }

  // Footer
  var footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Close</button>';
  if (record.status === 'received' || record.status === 'reviewed') {
    footerHTML +=
      ' <button class="btn btn-danger" id="ce-reject-btn">Reject</button>' +
      ' <button class="btn btn-primary ce-import-btn" id="ce-import-btn">Import to Chart</button>';
  }

  openModal({
    title: 'External Record — ' + record.recordType.charAt(0).toUpperCase() + record.recordType.slice(1),
    bodyHTML: bodyHTML,
    footerHTML: footerHTML,
    size: 'lg',
  });

  // Wire buttons
  setTimeout(function() {
    var importBtn = document.getElementById('ce-import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', function() {
        if (importExternalRecord(recordId)) {
          closeModal();
          showToast(record.recordType + ' imported to chart', 'success');
        } else {
          showToast('Import failed', 'error');
        }
      });
    }
    var rejectBtn = document.getElementById('ce-reject-btn');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function() {
        rejectExternalRecord(recordId);
        closeModal();
        showToast('Record rejected', 'warning');
      });
    }
  }, 60);
}

function _renderRecordData(record) {
  var data = record.data || {};
  var html = '<div class="ce-record-data-table">';

  switch (record.recordType) {
    case 'allergy':
      html += _dataRow('Allergen', data.allergen);
      html += _dataRow('Reaction', data.reaction);
      html += _dataRow('Severity', data.severity);
      html += _dataRow('Type', data.type);
      html += _dataRow('Recorded', data.recordedDate);
      break;

    case 'problem':
      html += _dataRow('Diagnosis', data.name);
      html += _dataRow('ICD-10', data.icd10);
      html += _dataRow('Onset', data.onset);
      html += _dataRow('Status', data.status);
      break;

    case 'medication':
      html += _dataRow('Medication', data.name);
      html += _dataRow('Dose', (data.dose || '') + ' ' + (data.unit || ''));
      html += _dataRow('Route', data.route);
      html += _dataRow('Frequency', data.frequency);
      break;

    case 'immunization':
      html += _dataRow('Vaccine', data.vaccine || data.name);
      html += _dataRow('Date Administered', data.date);
      html += _dataRow('Site', data.site);
      html += _dataRow('Lot Number', data.lot);
      break;

    case 'lab':
      html += _dataRow('Panel', data.panel);
      html += _dataRow('Test', data.testName);
      html += _dataRow('Value', (data.value || '') + ' ' + (data.unit || ''));
      html += _dataRow('Reference Range', data.refRange);
      html += _dataRow('Result Date', data.resultDate);
      break;

    case 'encounter':
      html += _dataRow('Visit Type', data.visitType);
      html += _dataRow('Date', data.date);
      html += _dataRow('Provider', data.provider);
      html += _dataRow('Summary', data.summary);
      break;

    case 'note':
      html += _dataRow('Note Type', data.noteType);
      html += _dataRow('Date', data.date);
      html += _dataRow('Author', data.author);
      html += '<div style="margin-top:8px;white-space:pre-wrap;font-size:13px;padding:8px;background:var(--bg-base);border-radius:4px;">' + esc(data.content || '') + '</div>';
      break;

    default:
      Object.keys(data).forEach(function(key) {
        html += _dataRow(key, data[key]);
      });
  }

  html += '</div>';
  return html;
}

function _dataRow(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return '<div class="ce-data-row"><span class="ce-data-label">' + esc(label) + '</span><span class="ce-data-value">' + esc(String(value)) + '</span></div>';
}

function _buildConflictComparison(record) {
  var data = record.data || {};
  var patientId = record.patientId;

  switch (record.recordType) {
    case 'allergy': {
      var existing = getPatientAllergies(patientId);
      var match = existing.find(function(a) {
        return (a.allergen || '').toLowerCase() === (data.allergen || '').toLowerCase();
      });
      if (match) {
        return '<div class="ce-comparison">' +
          '<div class="ce-comparison-col"><div class="ce-comparison-title">Local Record</div>' +
            _dataRow('Allergen', match.allergen) + _dataRow('Severity', match.severity) + _dataRow('Reaction', match.reaction) +
          '</div>' +
          '<div class="ce-comparison-col"><div class="ce-comparison-title">External Record</div>' +
            _dataRow('Allergen', data.allergen) + _dataRow('Severity', data.severity) + _dataRow('Reaction', data.reaction) +
          '</div>' +
        '</div>' +
        '<div class="ce-comparison-warning">A matching allergy already exists in the local chart. Importing will create a duplicate.</div>';
      }
      return null;
    }

    case 'problem': {
      var existingProbs = getActiveProblems(patientId);
      var matchProb = existingProbs.find(function(p) {
        return (p.name || '').toLowerCase() === (data.name || '').toLowerCase() ||
               (p.icd10 && p.icd10 === data.icd10);
      });
      if (matchProb) {
        return '<div class="ce-comparison">' +
          '<div class="ce-comparison-col"><div class="ce-comparison-title">Local Record</div>' +
            _dataRow('Problem', matchProb.name) + _dataRow('ICD-10', matchProb.icd10) + _dataRow('Status', matchProb.status) +
          '</div>' +
          '<div class="ce-comparison-col"><div class="ce-comparison-title">External Record</div>' +
            _dataRow('Problem', data.name) + _dataRow('ICD-10', data.icd10) + _dataRow('Status', data.status) +
          '</div>' +
        '</div>' +
        '<div class="ce-comparison-warning">A matching problem already exists in the local chart. Importing will create a duplicate.</div>';
      }
      return null;
    }

    case 'medication': {
      var existingMeds = getPatientMedications(patientId);
      var matchMed = existingMeds.find(function(m) {
        return (m.name || '').toLowerCase() === (data.name || '').toLowerCase();
      });
      if (matchMed) {
        return '<div class="ce-comparison">' +
          '<div class="ce-comparison-col"><div class="ce-comparison-title">Local Record</div>' +
            _dataRow('Medication', matchMed.name) + _dataRow('Dose', (matchMed.dose || '') + ' ' + (matchMed.unit || '')) + _dataRow('Frequency', matchMed.frequency) +
          '</div>' +
          '<div class="ce-comparison-col"><div class="ce-comparison-title">External Record</div>' +
            _dataRow('Medication', data.name) + _dataRow('Dose', (data.dose || '') + ' ' + (data.unit || '')) + _dataRow('Frequency', data.frequency) +
          '</div>' +
        '</div>' +
        '<div class="ce-comparison-warning">A matching medication already exists in the local chart. Importing will create a duplicate.</div>';
      }
      return null;
    }

    default:
      return null;
  }
}

function _recordToFHIR(record) {
  if (typeof FHIR === 'undefined') return null;
  var data = record.data || {};

  switch (record.recordType) {
    case 'allergy':
      return FHIR.allergy({
        id: record.id,
        patientId: record.patientId,
        allergen: data.allergen || '',
        type: data.type || 'Drug',
        severity: data.severity || 'Moderate',
        reaction: data.reaction || '',
      });

    case 'problem':
      return FHIR.condition({
        id: record.id,
        patientId: record.patientId,
        name: data.name || '',
        icd10: data.icd10 || '',
        status: data.status || 'Active',
        onset: data.onset || '',
      });

    case 'medication':
      return FHIR.medicationRequest({
        id: record.id,
        patientId: record.patientId,
        status: 'Active',
        priority: 'Routine',
        detail: { drug: data.name, dose: data.dose, unit: data.unit, route: data.route, frequency: data.frequency },
      });

    case 'immunization':
      return FHIR.immunization({
        id: record.id,
        patientId: record.patientId,
        vaccine: data.vaccine || data.name || '',
        date: data.date || '',
      });

    default:
      return null;
  }
}


/**
 * openCareEverywhereSearch(patientId) — Search modal for external systems
 */
function openCareEverywhereSearch(patientId) {
  var patient = getPatient(patientId);
  if (!patient) {
    showToast('Patient not found', 'error');
    return;
  }

  var patName = patient.firstName + ' ' + patient.lastName;
  var dob = patient.dob || '--';
  var sex = patient.sex || '--';
  var mrn = patient.mrn || '--';

  var bodyHTML =
    '<div class="ce-search-demographics">' +
      '<div class="ce-modal-label" style="margin-bottom:8px;">Patient Demographics Used for Matching</div>' +
      '<div class="ce-search-demo-grid">' +
        '<div><strong>Name:</strong> ' + esc(patName) + '</div>' +
        '<div><strong>DOB:</strong> ' + esc(dob) + '</div>' +
        '<div><strong>Sex:</strong> ' + esc(sex) + '</div>' +
        '<div><strong>MRN:</strong> ' + esc(mrn) + '</div>' +
      '</div>' +
    '</div>' +
    '<div id="ce-search-results" style="margin-top:16px;"></div>';

  var footerHTML =
    '<button class="btn btn-secondary" onclick="closeModal()">Close</button>' +
    ' <button class="btn btn-primary" id="ce-search-btn">Search External Systems</button>' +
    ' <button class="btn btn-success hidden" id="ce-import-selected-btn">Import Selected</button>';

  openModal({
    title: 'Care Everywhere — Search',
    bodyHTML: bodyHTML,
    footerHTML: footerHTML,
    size: 'lg',
  });

  setTimeout(function() {
    var searchBtn = document.getElementById('ce-search-btn');
    var importSelectedBtn = document.getElementById('ce-import-selected-btn');
    var resultsDiv = document.getElementById('ce-search-results');

    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        // Loading animation
        resultsDiv.innerHTML =
          '<div class="ce-search-loading">' +
            '<div class="ce-loading-spinner"></div>' +
            '<div style="margin-top:12px;color:var(--text-muted);">Querying external systems...</div>' +
          '</div>';
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching...';

        setTimeout(function() {
          var records = simulateReceiveRecords(patientId);
          searchBtn.disabled = false;
          searchBtn.textContent = 'Search External Systems';

          if (records.length === 0) {
            resultsDiv.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:16px;">No records found.</div>';
            return;
          }

          resultsDiv.innerHTML = '';
          importSelectedBtn.classList.remove('hidden');

          var checkboxes = [];
          records.forEach(function(record) {
            var row = document.createElement('div');
            row.className = 'ce-search-result-row';

            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = true;
            cb.dataset.recordId = record.id;
            checkboxes.push(cb);

            var icon = document.createElement('span');
            icon.className = 'ce-record-type-icon';
            icon.textContent = _CE_TYPE_ICONS[record.recordType] || '📄';

            var info = document.createElement('div');
            info.className = 'ce-search-result-info';
            info.innerHTML =
              '<div style="font-weight:500;">' + esc(_getRecordSummary(record)) + '</div>' +
              '<div style="font-size:12px;color:var(--text-muted);">' + esc(record.sourceSystem) + ' | ' + esc(record.recordType) + '</div>';

            row.appendChild(cb);
            row.appendChild(icon);
            row.appendChild(info);
            resultsDiv.appendChild(row);
          });

          showToast(records.length + ' record(s) found', 'success');
        }, 1200);
      });
    }

    if (importSelectedBtn) {
      importSelectedBtn.addEventListener('click', function() {
        var resultsDiv = document.getElementById('ce-search-results');
        var cbs = resultsDiv ? resultsDiv.querySelectorAll('input[type="checkbox"]:checked') : [];
        var count = 0;
        cbs.forEach(function(cb) {
          if (importExternalRecord(cb.dataset.recordId)) count++;
        });
        closeModal();
        showToast(count + ' record(s) imported to chart', 'success');
      });
    }
  }, 60);
}


/* ============================================================
   CSS — Injected at load time
   ============================================================ */
(function() {
  var style = document.createElement('style');
  style.textContent = [

    /* --- Note Preview Split View --- */
    '.note-split-view { display:flex; border:1px solid var(--border); border-radius:var(--radius); min-height:500px; background:var(--bg-surface); }',
    '.note-list-panel { width:40%; border-right:1px solid var(--border); display:flex; flex-direction:column; }',
    '.note-preview-panel { width:60%; display:flex; flex-direction:column; overflow-y:auto; }',
    '.note-filter-bar { display:flex; gap:6px; padding:10px 12px; border-bottom:1px solid var(--border); flex-wrap:wrap; }',
    '.note-filter-bar select, .note-filter-bar input { font-size:12px; padding:4px 6px; flex:1; min-width:80px; }',
    '.note-list-panel-scroll { flex:1; overflow-y:auto; }',

    '.note-list-item { padding:10px 14px; border-bottom:1px solid var(--border); cursor:pointer; transition:background var(--transition); }',
    '.note-list-item:hover { background:var(--bg-base); }',
    '.note-list-item.selected { border-left:3px solid var(--accent-blue); background:var(--accent-blue-light); }',
    '.note-list-item-meta { display:flex; align-items:center; gap:8px; margin-bottom:3px; }',
    '.note-list-item-date { font-size:12px; color:var(--text-muted); white-space:nowrap; }',
    '.note-list-item-author { font-size:13px; font-weight:500; color:var(--text-primary); margin-bottom:2px; }',
    '.note-list-item-snippet { font-size:12px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',

    '.note-preview-placeholder { display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:14px; }',
    '.note-preview-header { padding:16px 20px; border-bottom:1px solid var(--border); }',
    '.note-preview-title-row { display:flex; align-items:center; gap:10px; margin-bottom:6px; }',
    '.note-preview-title { font-size:18px; font-weight:600; margin:0; }',
    '.note-preview-meta { font-size:13px; color:var(--text-secondary); margin-bottom:8px; }',
    '.note-preview-sep { margin:0 6px; color:var(--border); }',
    '.note-preview-actions { display:flex; gap:6px; }',
    '.note-preview-body { padding:16px 20px; flex:1; overflow-y:auto; }',
    '.note-preview-section { margin-bottom:16px; }',
    '.note-preview-section-label { font-weight:700; font-size:14px; color:var(--text-primary); margin-bottom:4px; border-bottom:1px solid var(--border); padding-bottom:2px; }',
    '.note-preview-section-body { font-size:13px; color:var(--text-secondary); line-height:1.6; }',
    '.note-preview-empty { color:var(--text-muted); font-size:13px; font-style:italic; padding:16px 0; }',
    '.note-preview-signature { margin-top:20px; padding:10px 12px; background:var(--success-light); border-radius:var(--radius); font-size:13px; color:var(--success); }',
    '.note-preview-sig-check { font-weight:700; margin-right:4px; }',
    '.note-preview-addenda { margin-top:16px; }',
    '.note-preview-addendum { padding:10px 12px; background:var(--warning-light); border-radius:var(--radius); margin-bottom:8px; }',
    '.note-preview-addendum-hdr { font-weight:600; font-size:12px; color:var(--warning); margin-bottom:4px; }',

    /* --- Care Everywhere --- */
    '.ce-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }',
    '.ce-title { font-size:18px; font-weight:600; margin:0; }',
    '.ce-summary { font-size:13px; color:var(--text-muted); margin-bottom:12px; }',
    '.ce-empty { text-align:center; padding:40px 20px; }',

    '.ce-source-badges { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }',
    '.ce-source-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; background:var(--accent-blue-light); color:var(--accent-blue); border-radius:20px; font-size:13px; font-weight:500; }',
    '.ce-source-count { background:var(--accent-blue); color:#fff; padding:1px 7px; border-radius:10px; font-size:11px; font-weight:600; }',

    '.ce-system-group { margin-bottom:20px; }',
    '.ce-system-header { font-size:15px; font-weight:600; color:var(--text-primary); padding:8px 0; border-bottom:2px solid var(--border); margin-bottom:8px; }',
    '.ce-type-header { font-size:13px; font-weight:500; color:var(--text-secondary); padding:6px 0 4px; }',

    '.ce-record-card { display:flex; align-items:center; gap:10px; padding:10px 14px; border:1px solid var(--border); border-radius:var(--radius); margin-bottom:6px; background:var(--bg-surface); transition:box-shadow var(--transition); }',
    '.ce-record-card:hover { box-shadow:var(--shadow-sm); }',
    '.ce-record-type-icon { font-size:20px; flex-shrink:0; }',
    '.ce-record-info { flex:1; min-width:0; }',
    '.ce-record-summary { font-size:13px; font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.ce-record-meta { font-size:11px; color:var(--text-muted); margin-top:2px; }',
    '.ce-record-actions { display:flex; gap:4px; flex-shrink:0; }',

    '.ce-status-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; text-transform:capitalize; flex-shrink:0; }',
    '.ce-status-received { background:#ebf4ff; color:#2b6cb0; }',
    '.ce-status-reviewed { background:var(--warning-light); color:var(--warning); }',
    '.ce-status-imported { background:var(--success-light); color:var(--success); }',
    '.ce-status-rejected { background:var(--status-closed-bg); color:var(--status-closed); }',

    '.ce-import-btn { font-weight:600; }',

    /* Modal details */
    '.ce-modal-section { margin-bottom:10px; }',
    '.ce-modal-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); }',
    '.ce-modal-value { font-size:14px; color:var(--text-primary); }',
    '.ce-modal-row { display:flex; gap:16px; margin-bottom:10px; }',
    '.ce-modal-divider { border-top:1px solid var(--border); margin:16px 0; }',

    '.ce-record-data-table { margin-bottom:8px; }',
    '.ce-data-row { display:flex; padding:4px 0; border-bottom:1px solid var(--bg-base); }',
    '.ce-data-label { font-size:12px; font-weight:600; color:var(--text-muted); width:140px; flex-shrink:0; }',
    '.ce-data-value { font-size:13px; color:var(--text-primary); }',

    '.ce-comparison { display:flex; gap:16px; margin-bottom:8px; }',
    '.ce-comparison-col { flex:1; padding:10px; border:1px solid var(--border); border-radius:var(--radius); background:var(--bg-base); }',
    '.ce-comparison-title { font-weight:600; font-size:12px; color:var(--text-secondary); margin-bottom:6px; text-transform:uppercase; }',
    '.ce-comparison-warning { font-size:12px; color:var(--warning); font-weight:500; padding:6px 10px; background:var(--warning-light); border-radius:var(--radius); }',

    '.ce-fhir-details { margin-top:8px; }',
    '.ce-fhir-summary { font-size:13px; font-weight:500; color:var(--accent-blue); cursor:pointer; padding:4px 0; }',
    '.ce-fhir-json { font-size:11px; background:var(--bg-base); padding:12px; border-radius:var(--radius); overflow-x:auto; max-height:300px; overflow-y:auto; white-space:pre; }',

    /* Search modal */
    '.ce-search-demographics { padding:12px; background:var(--bg-base); border-radius:var(--radius); }',
    '.ce-search-demo-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:13px; }',
    '.ce-search-loading { text-align:center; padding:40px 0; }',
    '.ce-loading-spinner { display:inline-block; width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent-blue); border-radius:50%; animation:ce-spin 0.8s linear infinite; }',
    '@keyframes ce-spin { to { transform:rotate(360deg); } }',
    '.ce-search-result-row { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius); margin-bottom:6px; }',
    '.ce-search-result-row input[type="checkbox"] { flex-shrink:0; width:16px; height:16px; }',
    '.ce-search-result-info { flex:1; min-width:0; }',

  ].join('\n');

  document.head.appendChild(style);
})();
