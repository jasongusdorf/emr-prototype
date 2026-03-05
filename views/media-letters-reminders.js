/* ============================================================
   views/media-letters-reminders.js — Media, Letters & Reminders
   ============================================================ */

/* ============================================================
   1. MEDIA TAB — Clinical Photos / Images
   ============================================================ */

/* ---------- Data Layer ---------- */

function getPatientMedia(patientId) {
  return loadAll(KEYS.patientMedia).filter(function(m) {
    return m.patientId === patientId && !m._deleted;
  });
}

function saveMedia(data) {
  var all = loadAll(KEYS.patientMedia, true);
  var idx = all.findIndex(function(m) { return m.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    all.push(Object.assign({
      id:          generateId(),
      patientId:   '',
      title:       '',
      description: '',
      category:    'Clinical Photo',
      dataUrl:     '',
      mimeType:    '',
      uploadedBy:  '',
      uploadedAt:  new Date().toISOString(),
      encounterId: '',
    }, data));
  }
  saveAll(KEYS.patientMedia, all);
}

function deleteMedia(id) {
  softDeleteRecord(KEYS.patientMedia, id);
}

/* ---------- View Functions ---------- */

function renderMediaTab(patientId, container) {
  container.innerHTML = '';

  var header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
  var h3 = document.createElement('h3');
  h3.textContent = 'Media';
  h3.style.margin = '0';
  var uploadBtn = document.createElement('button');
  uploadBtn.className = 'btn btn-primary btn-sm';
  uploadBtn.textContent = 'Upload';
  uploadBtn.addEventListener('click', function() {
    openMediaUploadModal(patientId, function() {
      renderMediaTab(patientId, container);
    });
  });
  header.appendChild(h3);
  header.appendChild(uploadBtn);
  container.appendChild(header);

  var media = getPatientMedia(patientId);
  if (media.length === 0) {
    container.appendChild(buildEmptyState('', 'No media uploaded', 'Upload clinical photos or documents using the button above.'));
    return;
  }

  // Sort newest first
  media.sort(function(a, b) { return new Date(b.uploadedAt) - new Date(a.uploadedAt); });

  var grid = document.createElement('div');
  grid.className = 'media-grid';

  media.forEach(function(item) {
    var thumb = document.createElement('div');
    thumb.className = 'media-thumb';
    thumb.title = item.title || 'Untitled';
    thumb.style.cursor = 'pointer';

    if (item.dataUrl && item.mimeType && item.mimeType.startsWith('image/')) {
      var img = document.createElement('img');
      img.className = 'media-thumb-img';
      img.src = item.dataUrl;
      img.alt = item.title || 'Media';
      thumb.appendChild(img);
    } else {
      var icon = document.createElement('div');
      icon.className = 'media-thumb-icon';
      icon.textContent = 'FILE';
      thumb.appendChild(icon);
    }

    var info = document.createElement('div');
    info.className = 'media-thumb-info';
    var titleEl = document.createElement('div');
    titleEl.className = 'media-thumb-title';
    titleEl.textContent = item.title || 'Untitled';
    var dateEl = document.createElement('div');
    dateEl.className = 'media-thumb-date';
    dateEl.textContent = formatDateTime(item.uploadedAt);
    info.appendChild(titleEl);
    info.appendChild(dateEl);
    thumb.appendChild(info);

    thumb.addEventListener('click', function() {
      openMediaViewerModal(item.id, function() {
        renderMediaTab(patientId, container);
      });
    });

    grid.appendChild(thumb);
  });

  container.appendChild(grid);
}

function openMediaUploadModal(patientId, onDone) {
  var bodyHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div>' +
        '<label style="font-weight:600;">File</label>' +
        '<input type="file" id="media-file-input" accept="image/jpeg,image/png,image/gif" style="display:block;margin-top:4px;">' +
        '<div id="media-file-warning" style="color:#b91c1c;font-size:12px;margin-top:4px;display:none;"></div>' +
      '</div>' +
      '<div id="media-upload-preview-wrap" style="display:none;">' +
        '<img id="media-upload-preview" class="media-upload-preview" alt="Preview">' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Title</label>' +
        '<input type="text" id="media-title" class="input" placeholder="e.g. Left forearm rash">' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Description</label>' +
        '<textarea id="media-description" class="input" rows="3" placeholder="Optional description"></textarea>' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Category</label>' +
        '<select id="media-category" class="input">' +
          '<option value="Clinical Photo">Clinical Photo</option>' +
          '<option value="Wound">Wound</option>' +
          '<option value="Imaging">Imaging</option>' +
          '<option value="Document">Document</option>' +
          '<option value="Other">Other</option>' +
        '</select>' +
      '</div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" id="media-upload-save">Upload</button>';

  openModal({ title: 'Upload Media', bodyHTML: bodyHTML, footerHTML: footerHTML });

  var _fileDataUrl = null;
  var _fileMimeType = null;

  var fileInput = document.getElementById('media-file-input');
  fileInput.addEventListener('change', function() {
    var file = fileInput.files[0];
    if (!file) return;

    var warning = document.getElementById('media-file-warning');
    var previewWrap = document.getElementById('media-upload-preview-wrap');
    var previewImg = document.getElementById('media-upload-preview');

    // Size warning (~1MB limit for localStorage)
    if (file.size > 1024 * 1024) {
      warning.textContent = 'Warning: File is larger than 1 MB. This may exceed localStorage limits.';
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }

    _fileMimeType = file.type;

    var reader = new FileReader();
    reader.onload = function(e) {
      _fileDataUrl = e.target.result;
      if (file.type.startsWith('image/')) {
        previewImg.src = _fileDataUrl;
        previewWrap.style.display = 'block';
      } else {
        previewWrap.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('media-upload-save').addEventListener('click', function() {
    if (!_fileDataUrl) {
      showToast('Please select a file', 'error');
      return;
    }

    var title = document.getElementById('media-title').value.trim();
    if (!title) {
      showToast('Title is required', 'error');
      return;
    }

    var user = getSessionUser();
    try {
      saveMedia({
        patientId:   patientId,
        title:       title,
        description: document.getElementById('media-description').value.trim(),
        category:    document.getElementById('media-category').value,
        dataUrl:     _fileDataUrl,
        mimeType:    _fileMimeType || '',
        uploadedBy:  user ? user.id : '',
        uploadedAt:  new Date().toISOString(),
      });
      showToast('Media uploaded', 'success');
      closeModal();
      if (typeof onDone === 'function') onDone();
    } catch (e) {
      showToast('Upload failed — file may be too large for storage', 'error');
    }
  });
}

function openMediaViewerModal(mediaId, onDone) {
  var all = loadAll(KEYS.patientMedia);
  var media = all.find(function(m) { return m.id === mediaId; });
  if (!media) { showToast('Media not found', 'error'); return; }

  var uploader = media.uploadedBy ? getProvider(media.uploadedBy) : null;
  var uploaderName = uploader ? (uploader.firstName + ' ' + uploader.lastName) : 'Unknown';

  var bodyHTML = '<div style="text-align:center;margin-bottom:12px;">';
  if (media.dataUrl && media.mimeType && media.mimeType.startsWith('image/')) {
    bodyHTML += '<img src="' + esc(media.dataUrl) + '" alt="' + esc(media.title) + '" style="max-width:100%;max-height:500px;border-radius:6px;">';
  } else {
    bodyHTML += '<div style="padding:40px;background:#f3f4f6;border-radius:8px;font-size:18px;color:#6b7280;">Document File</div>';
  }
  bodyHTML += '</div>';
  bodyHTML += '<table style="width:100%;font-size:14px;">';
  bodyHTML += '<tr><td style="font-weight:600;padding:4px 8px 4px 0;vertical-align:top;">Title</td><td>' + esc(media.title) + '</td></tr>';
  if (media.description) {
    bodyHTML += '<tr><td style="font-weight:600;padding:4px 8px 4px 0;vertical-align:top;">Description</td><td>' + esc(media.description) + '</td></tr>';
  }
  bodyHTML += '<tr><td style="font-weight:600;padding:4px 8px 4px 0;">Category</td><td>' + esc(media.category) + '</td></tr>';
  bodyHTML += '<tr><td style="font-weight:600;padding:4px 8px 4px 0;">Uploaded By</td><td>' + esc(uploaderName) + '</td></tr>';
  bodyHTML += '<tr><td style="font-weight:600;padding:4px 8px 4px 0;">Date</td><td>' + formatDateTime(media.uploadedAt) + '</td></tr>';
  bodyHTML += '</table>';

  var footerHTML =
    '<button class="btn btn-danger" id="media-delete-btn">Delete</button>' +
    '<button class="btn btn-secondary" onclick="closeModal()">Close</button>';

  openModal({ title: 'View Media', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  document.getElementById('media-delete-btn').addEventListener('click', function() {
    if (confirm('Delete this media? This cannot be undone.')) {
      deleteMedia(mediaId);
      showToast('Media deleted', 'success');
      closeModal();
      if (typeof onDone === 'function') onDone();
    }
  });
}


/* ============================================================
   2. LETTERS — Patient Letter Generation
   ============================================================ */

/* ---------- Data Layer ---------- */

var _DEFAULT_LETTER_TEMPLATES = [
  {
    id: 'tpl-referral',
    name: 'Referral Letter',
    category: 'Referral',
    isSystem: true,
    content: 'Dear {{recipientName}},\n\nI am referring my patient, {{patientName}} (DOB: {{patientDOB}}), for evaluation of {{reason}}.\n\nDiagnoses:\n{{problemList}}\n\nCurrent Medications:\n{{medicationList}}\n\nAllergies:\n{{allergyList}}\n\nPlease contact our office with any questions.\n\nSincerely,\n{{providerName}}, {{providerDegree}}'
  },
  {
    id: 'tpl-work-excuse',
    name: 'Work/School Excuse',
    category: 'Work/School',
    isSystem: true,
    content: '{{date}}\n\nTo Whom It May Concern,\n\nThis letter is to certify that {{patientName}} (DOB: {{patientDOB}}) was seen in our office on {{date}} and is excused from work/school.\n\nIf you have any questions, please contact our office.\n\nSincerely,\n{{providerName}}, {{providerDegree}}'
  },
  {
    id: 'tpl-insurance-auth',
    name: 'Insurance Authorization',
    category: 'Insurance',
    isSystem: true,
    content: '{{date}}\n\n{{recipientName}}\n{{recipientAddress}}\n\nRe: {{patientName}}, DOB: {{patientDOB}}, MRN: {{patientMRN}}\n\nDear Sir or Madam,\n\nI am writing to request authorization for {{reason}} for the above-referenced patient.\n\nDiagnoses:\n{{problemList}}\n\nCurrent Medications:\n{{medicationList}}\n\nAllergies:\n{{allergyList}}\n\nThis treatment is medically necessary. Please contact our office with any questions.\n\nSincerely,\n{{providerName}}, {{providerDegree}}'
  },
  {
    id: 'tpl-lab-results',
    name: 'Lab Results Letter',
    category: 'Lab Results',
    isSystem: true,
    content: '{{date}}\n\nDear {{patientName}},\n\nThe following are the results of your recent laboratory tests:\n\n{{reason}}\n\nPlease contact our office if you have any questions or concerns.\n\nSincerely,\n{{providerName}}, {{providerDegree}}'
  },
  {
    id: 'tpl-general',
    name: 'General Correspondence',
    category: 'General',
    isSystem: true,
    content: '{{date}}\n\n{{recipientName}}\n{{recipientAddress}}\n\nRe: {{patientName}}\n\nDear {{recipientName}},\n\n\n\nSincerely,\n{{providerName}}, {{providerDegree}}'
  },
  {
    id: 'tpl-specialist-followup',
    name: 'Specialist Follow-Up',
    category: 'Referral',
    isSystem: true,
    content: '{{date}}\n\nDear {{recipientName}},\n\nThank you for referring {{patientName}} (DOB: {{patientDOB}}) to our office for evaluation of {{reason}}.\n\nAfter thorough evaluation, our assessment and plan are as follows:\n\nDiagnoses:\n{{problemList}}\n\nCurrent Medications:\n{{medicationList}}\n\nAllergies:\n{{allergyList}}\n\nPlease do not hesitate to contact us with any questions.\n\nSincerely,\n{{providerName}}, {{providerDegree}}'
  }
];

function _seedLetterTemplatesIfNeeded() {
  var existing = loadAll(KEYS.letterTemplates);
  if (existing.length === 0) {
    saveAll(KEYS.letterTemplates, _DEFAULT_LETTER_TEMPLATES.slice());
  }
}

function getLetterTemplates() {
  _seedLetterTemplatesIfNeeded();
  return loadAll(KEYS.letterTemplates);
}

function saveLetterTemplate(tpl) {
  _seedLetterTemplatesIfNeeded();
  var all = loadAll(KEYS.letterTemplates, true);
  var idx = all.findIndex(function(t) { return t.id === tpl.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], tpl);
  } else {
    all.push(Object.assign({
      id:       generateId(),
      name:     '',
      category: 'General',
      content:  '',
      isSystem: false,
    }, tpl));
  }
  saveAll(KEYS.letterTemplates, all);
}

function getLetters(patientId) {
  return loadAll(KEYS.letters).filter(function(l) {
    return l.patientId === patientId && !l._deleted;
  });
}

function saveLetter(letter) {
  var all = loadAll(KEYS.letters, true);
  var idx = all.findIndex(function(l) { return l.id === letter.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], letter);
  } else {
    all.push(Object.assign({
      id:               generateId(),
      patientId:        '',
      templateId:       '',
      subject:          '',
      body:             '',
      status:           'Draft',
      recipientName:    '',
      recipientAddress: '',
      createdBy:        '',
      createdAt:        new Date().toISOString(),
      sentAt:           null,
    }, letter));
  }
  saveAll(KEYS.letters, all);
}

function deleteLetter(id) {
  softDeleteRecord(KEYS.letters, id);
}

/* ---------- Placeholder Expansion ---------- */

function expandLetterTemplate(templateId, patientId, extraFields) {
  var tpl = getLetterTemplates().find(function(t) { return t.id === templateId; });
  if (!tpl) return '';

  var content = tpl.content;
  var patient = getPatient(patientId);
  var user = getSessionUser();
  var provider = user ? getProvider(user.id) : null;

  var fields = extraFields || {};

  // Patient data
  if (patient) {
    var dobDate = patient.dob ? new Date(patient.dob) : null;
    var ageStr = '';
    if (dobDate && !isNaN(dobDate)) {
      var today = new Date();
      var age = today.getFullYear() - dobDate.getFullYear();
      var m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
      ageStr = String(age);
    }

    var address = [patient.addressStreet, patient.addressCity, patient.addressState, patient.addressZip]
      .filter(Boolean).join(', ');

    content = content.replace(/\{\{patientName\}\}/g, (patient.firstName + ' ' + patient.lastName).trim());
    content = content.replace(/\{\{patientDOB\}\}/g, patient.dob || '');
    content = content.replace(/\{\{patientAge\}\}/g, ageStr);
    content = content.replace(/\{\{patientSex\}\}/g, patient.sex || '');
    content = content.replace(/\{\{patientMRN\}\}/g, patient.mrn || '');
    content = content.replace(/\{\{patientPhone\}\}/g, patient.phone || '');
    content = content.replace(/\{\{patientAddress\}\}/g, address);

    // Problem list
    var problems = getActiveProblems(patientId);
    var problemStr = problems.length > 0
      ? problems.map(function(p) { return '- ' + (p.name || p.description || 'Unknown'); }).join('\n')
      : '- None on file';
    content = content.replace(/\{\{problemList\}\}/g, problemStr);

    // Medication list
    var meds = getPatientMedications(patientId);
    var medStr = meds.length > 0
      ? meds.filter(function(m) { return m.status === 'Current'; }).map(function(m) {
          return '- ' + (m.name || 'Unknown') + (m.dose ? ' ' + m.dose : '') + (m.unit ? ' ' + m.unit : '') + (m.route ? ' ' + m.route : '') + (m.frequency ? ' ' + m.frequency : '');
        }).join('\n')
      : '- None on file';
    if (medStr === '') medStr = '- None on file';
    content = content.replace(/\{\{medicationList\}\}/g, medStr);

    // Allergy list
    var allergies = getPatientAllergies(patientId);
    var allergyStr = allergies.length > 0
      ? allergies.map(function(a) { return '- ' + (a.allergen || 'Unknown') + (a.reaction ? ' (' + a.reaction + ')' : ''); }).join('\n')
      : '- NKDA';
    content = content.replace(/\{\{allergyList\}\}/g, allergyStr);
  }

  // Provider data
  if (provider) {
    content = content.replace(/\{\{providerName\}\}/g, (provider.firstName + ' ' + provider.lastName).trim());
    content = content.replace(/\{\{providerDegree\}\}/g, provider.degree || '');
  } else if (user) {
    content = content.replace(/\{\{providerName\}\}/g, (user.firstName + ' ' + user.lastName).trim());
    content = content.replace(/\{\{providerDegree\}\}/g, '');
  }

  // Date
  content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));

  // Extra fields (recipientName, recipientAddress, reason)
  content = content.replace(/\{\{recipientName\}\}/g, fields.recipientName || '');
  content = content.replace(/\{\{recipientAddress\}\}/g, fields.recipientAddress || '');
  content = content.replace(/\{\{reason\}\}/g, fields.reason || '');

  return content;
}

/* ---------- View Functions ---------- */

function renderLettersTab(patientId, container) {
  container.innerHTML = '';

  var header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
  var h3 = document.createElement('h3');
  h3.textContent = 'Letters';
  h3.style.margin = '0';
  var newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary btn-sm';
  newBtn.textContent = 'New Letter';
  newBtn.addEventListener('click', function() {
    openNewLetterModal(patientId, function() {
      renderLettersTab(patientId, container);
    });
  });
  header.appendChild(h3);
  header.appendChild(newBtn);
  container.appendChild(header);

  var letters = getLetters(patientId);
  if (letters.length === 0) {
    container.appendChild(buildEmptyState('', 'No letters', 'Create a letter using the button above.'));
    return;
  }

  // Sort newest first
  letters.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  var wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  var table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Recipient</th><th>Actions</th></tr></thead>';
  var tbody = document.createElement('tbody');

  letters.forEach(function(letter) {
    var tr = document.createElement('tr');

    var tdDate = document.createElement('td');
    tdDate.textContent = formatDateTime(letter.createdAt);

    var tdSubject = document.createElement('td');
    tdSubject.textContent = letter.subject || '(No subject)';

    var tdStatus = document.createElement('td');
    var badge = document.createElement('span');
    badge.className = 'letter-status-badge letter-status-' + letter.status.toLowerCase();
    badge.textContent = letter.status;
    tdStatus.appendChild(badge);

    var tdRecipient = document.createElement('td');
    tdRecipient.textContent = letter.recipientName || '';

    var tdActions = document.createElement('td');
    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-secondary btn-sm';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', function() {
      openLetterViewModal(letter.id, function() {
        renderLettersTab(patientId, container);
      });
    });
    tdActions.appendChild(viewBtn);

    tr.appendChild(tdDate);
    tr.appendChild(tdSubject);
    tr.appendChild(tdStatus);
    tr.appendChild(tdRecipient);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);
}

function openNewLetterModal(patientId, onDone) {
  var templates = getLetterTemplates();
  var tplOptions = templates.map(function(t) {
    return '<option value="' + esc(t.id) + '">' + esc(t.name) + ' (' + esc(t.category) + ')</option>';
  }).join('');

  var bodyHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div>' +
        '<label style="font-weight:600;">Template</label>' +
        '<select id="letter-template" class="input">' +
          '<option value="">-- Select template --</option>' +
          tplOptions +
        '</select>' +
      '</div>' +
      '<div style="display:flex;gap:10px;">' +
        '<div style="flex:1;">' +
          '<label style="font-weight:600;">Recipient Name</label>' +
          '<input type="text" id="letter-recipient-name" class="input" placeholder="Dr. Jane Smith">' +
        '</div>' +
        '<div style="flex:1;">' +
          '<label style="font-weight:600;">Reason / Purpose</label>' +
          '<input type="text" id="letter-reason" class="input" placeholder="e.g. chronic back pain evaluation">' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Recipient Address</label>' +
        '<input type="text" id="letter-recipient-address" class="input" placeholder="123 Main St, City, ST 00000">' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Subject</label>' +
        '<input type="text" id="letter-subject" class="input" placeholder="Letter subject">' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Body</label>' +
        '<textarea id="letter-body" class="input" rows="14" style="font-family:monospace;font-size:13px;white-space:pre-wrap;"></textarea>' +
      '</div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-secondary" id="letter-print-btn">Print</button>' +
    '<button class="btn btn-secondary" id="letter-save-draft">Save as Draft</button>' +
    '<button class="btn btn-primary" id="letter-save-final">Mark as Final</button>';

  openModal({ title: 'New Letter', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  // Template change handler
  var tplSelect = document.getElementById('letter-template');
  tplSelect.addEventListener('change', function() {
    var tplId = tplSelect.value;
    if (!tplId) return;

    var recipientName = document.getElementById('letter-recipient-name').value.trim();
    var recipientAddress = document.getElementById('letter-recipient-address').value.trim();
    var reason = document.getElementById('letter-reason').value.trim();

    var expanded = expandLetterTemplate(tplId, patientId, {
      recipientName: recipientName,
      recipientAddress: recipientAddress,
      reason: reason,
    });
    document.getElementById('letter-body').value = expanded;

    // Auto-fill subject from template name
    var tpl = templates.find(function(t) { return t.id === tplId; });
    if (tpl && !document.getElementById('letter-subject').value.trim()) {
      document.getElementById('letter-subject').value = tpl.name;
    }
  });

  // Re-expand on recipient/reason change
  ['letter-recipient-name', 'letter-recipient-address', 'letter-reason'].forEach(function(elId) {
    document.getElementById(elId).addEventListener('change', function() {
      var tplId = tplSelect.value;
      if (!tplId) return;
      var recipientName = document.getElementById('letter-recipient-name').value.trim();
      var recipientAddress = document.getElementById('letter-recipient-address').value.trim();
      var reason = document.getElementById('letter-reason').value.trim();
      document.getElementById('letter-body').value = expandLetterTemplate(tplId, patientId, {
        recipientName: recipientName,
        recipientAddress: recipientAddress,
        reason: reason,
      });
    });
  });

  function _saveLetter(status) {
    var subject = document.getElementById('letter-subject').value.trim();
    var body = document.getElementById('letter-body').value.trim();
    if (!body) { showToast('Letter body cannot be empty', 'error'); return; }

    var user = getSessionUser();
    saveLetter({
      patientId:        patientId,
      templateId:       tplSelect.value || '',
      subject:          subject || 'Untitled Letter',
      body:             body,
      status:           status,
      recipientName:    document.getElementById('letter-recipient-name').value.trim(),
      recipientAddress: document.getElementById('letter-recipient-address').value.trim(),
      createdBy:        user ? user.id : '',
      createdAt:        new Date().toISOString(),
      sentAt:           status === 'Sent' ? new Date().toISOString() : null,
    });
    showToast('Letter saved as ' + status, 'success');
    closeModal();
    if (typeof onDone === 'function') onDone();
  }

  document.getElementById('letter-save-draft').addEventListener('click', function() { _saveLetter('Draft'); });
  document.getElementById('letter-save-final').addEventListener('click', function() { _saveLetter('Final'); });

  document.getElementById('letter-print-btn').addEventListener('click', function() {
    var body = document.getElementById('letter-body').value;
    _printLetterContent(body, document.getElementById('letter-subject').value);
  });
}

function openLetterViewModal(letterId, onDone) {
  var all = loadAll(KEYS.letters);
  var letter = all.find(function(l) { return l.id === letterId; });
  if (!letter) { showToast('Letter not found', 'error'); return; }

  var creator = letter.createdBy ? getProvider(letter.createdBy) : null;
  var creatorName = creator ? (creator.firstName + ' ' + creator.lastName) : 'Unknown';

  var bodyHTML =
    '<div style="margin-bottom:12px;">' +
      '<table style="width:100%;font-size:14px;margin-bottom:12px;">' +
        '<tr><td style="font-weight:600;padding:3px 8px 3px 0;">Subject</td><td>' + esc(letter.subject) + '</td></tr>' +
        '<tr><td style="font-weight:600;padding:3px 8px 3px 0;">Status</td><td><span class="letter-status-badge letter-status-' + letter.status.toLowerCase() + '">' + esc(letter.status) + '</span></td></tr>' +
        '<tr><td style="font-weight:600;padding:3px 8px 3px 0;">Recipient</td><td>' + esc(letter.recipientName || '(None)') + '</td></tr>' +
        (letter.recipientAddress ? '<tr><td style="font-weight:600;padding:3px 8px 3px 0;">Address</td><td>' + esc(letter.recipientAddress) + '</td></tr>' : '') +
        '<tr><td style="font-weight:600;padding:3px 8px 3px 0;">Created By</td><td>' + esc(creatorName) + '</td></tr>' +
        '<tr><td style="font-weight:600;padding:3px 8px 3px 0;">Created</td><td>' + formatDateTime(letter.createdAt) + '</td></tr>' +
        (letter.sentAt ? '<tr><td style="font-weight:600;padding:3px 8px 3px 0;">Sent</td><td>' + formatDateTime(letter.sentAt) + '</td></tr>' : '') +
      '</table>' +
    '</div>' +
    '<div class="letter-body-display" style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;font-size:14px;font-family:serif;line-height:1.6;max-height:400px;overflow-y:auto;">' +
      esc(letter.body) +
    '</div>';

  var footerBtns = [];
  footerBtns.push('<button class="btn btn-danger" id="letter-view-delete">Delete</button>');
  if (letter.status === 'Draft') {
    footerBtns.push('<button class="btn btn-secondary" id="letter-view-edit">Edit</button>');
    footerBtns.push('<button class="btn btn-success" id="letter-view-finalize">Mark as Final</button>');
  }
  if (letter.status === 'Final') {
    footerBtns.push('<button class="btn btn-success" id="letter-view-send">Mark as Sent</button>');
  }
  footerBtns.push('<button class="btn btn-secondary" id="letter-view-print">Print</button>');
  footerBtns.push('<button class="btn btn-secondary" onclick="closeModal()">Close</button>');

  openModal({ title: 'View Letter', bodyHTML: bodyHTML, footerHTML: footerBtns.join(''), size: 'lg' });

  // Delete
  document.getElementById('letter-view-delete').addEventListener('click', function() {
    if (confirm('Delete this letter?')) {
      deleteLetter(letterId);
      showToast('Letter deleted', 'success');
      closeModal();
      if (typeof onDone === 'function') onDone();
    }
  });

  // Edit (Draft only)
  var editBtn = document.getElementById('letter-view-edit');
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      closeModal();
      _openEditLetterModal(letterId, onDone);
    });
  }

  // Finalize
  var finalizeBtn = document.getElementById('letter-view-finalize');
  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', function() {
      letter.status = 'Final';
      saveLetter(letter);
      showToast('Letter marked as Final', 'success');
      closeModal();
      if (typeof onDone === 'function') onDone();
    });
  }

  // Send
  var sendBtn = document.getElementById('letter-view-send');
  if (sendBtn) {
    sendBtn.addEventListener('click', function() {
      letter.status = 'Sent';
      letter.sentAt = new Date().toISOString();
      saveLetter(letter);
      showToast('Letter marked as Sent', 'success');
      closeModal();
      if (typeof onDone === 'function') onDone();
    });
  }

  // Print
  document.getElementById('letter-view-print').addEventListener('click', function() {
    _printLetterContent(letter.body, letter.subject);
  });
}

function _openEditLetterModal(letterId, onDone) {
  var all = loadAll(KEYS.letters);
  var letter = all.find(function(l) { return l.id === letterId; });
  if (!letter) { showToast('Letter not found', 'error'); return; }

  var bodyHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div style="display:flex;gap:10px;">' +
        '<div style="flex:1;">' +
          '<label style="font-weight:600;">Recipient Name</label>' +
          '<input type="text" id="letter-edit-recipient" class="input" value="' + esc(letter.recipientName) + '">' +
        '</div>' +
        '<div style="flex:1;">' +
          '<label style="font-weight:600;">Recipient Address</label>' +
          '<input type="text" id="letter-edit-address" class="input" value="' + esc(letter.recipientAddress) + '">' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Subject</label>' +
        '<input type="text" id="letter-edit-subject" class="input" value="' + esc(letter.subject) + '">' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Body</label>' +
        '<textarea id="letter-edit-body" class="input" rows="14" style="font-family:monospace;font-size:13px;white-space:pre-wrap;">' + esc(letter.body) + '</textarea>' +
      '</div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" id="letter-edit-save">Save</button>';

  openModal({ title: 'Edit Letter', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  document.getElementById('letter-edit-save').addEventListener('click', function() {
    var body = document.getElementById('letter-edit-body').value.trim();
    if (!body) { showToast('Letter body cannot be empty', 'error'); return; }

    letter.subject = document.getElementById('letter-edit-subject').value.trim() || 'Untitled Letter';
    letter.body = body;
    letter.recipientName = document.getElementById('letter-edit-recipient').value.trim();
    letter.recipientAddress = document.getElementById('letter-edit-address').value.trim();
    saveLetter(letter);
    showToast('Letter updated', 'success');
    closeModal();
    if (typeof onDone === 'function') onDone();
  });
}

function _printLetterContent(body, subject) {
  var win = window.open('', '_blank', 'width=800,height=1000');
  if (!win) { showToast('Pop-up blocked — please allow pop-ups', 'error'); return; }
  var html = '<!DOCTYPE html><html><head><title>' + (subject || 'Letter') + '</title>' +
    '<style>body{font-family:serif;font-size:14pt;line-height:1.6;padding:1in;white-space:pre-wrap;}@media print{body{padding:0;}}</style>' +
    '</head><body>' + esc(body) + '</body></html>';
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}


/* ============================================================
   3. REMIND ME — Patient Chart Reminders
   ============================================================ */

/* ---------- Data Layer ---------- */

function getReminders(providerId) {
  return loadAll(KEYS.reminders).filter(function(r) {
    return r.providerId === providerId && !r._deleted;
  });
}

function getPatientReminders(patientId, providerId) {
  return loadAll(KEYS.reminders).filter(function(r) {
    return r.patientId === patientId && r.providerId === providerId && !r._deleted;
  });
}

function saveReminder(data) {
  var all = loadAll(KEYS.reminders, true);
  var idx = all.findIndex(function(r) { return r.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    all.push(Object.assign({
      id:          generateId(),
      patientId:   '',
      providerId:  '',
      text:        '',
      priority:    'normal',
      dueDate:     '',
      status:      'active',
      createdAt:   new Date().toISOString(),
      completedAt: null,
    }, data));
  }
  saveAll(KEYS.reminders, all);
}

function completeReminder(id) {
  var all = loadAll(KEYS.reminders, true);
  var idx = all.findIndex(function(r) { return r.id === id; });
  if (idx >= 0) {
    all[idx].status = 'completed';
    all[idx].completedAt = new Date().toISOString();
    saveAll(KEYS.reminders, all);
  }
}

function dismissReminder(id) {
  var all = loadAll(KEYS.reminders, true);
  var idx = all.findIndex(function(r) { return r.id === id; });
  if (idx >= 0) {
    all[idx].status = 'dismissed';
    all[idx].completedAt = new Date().toISOString();
    saveAll(KEYS.reminders, all);
  }
}

function getActiveReminderCount(providerId) {
  return getReminders(providerId).filter(function(r) {
    return r.status === 'active';
  }).length;
}

function getRemindersBadgeCount() {
  var user = getSessionUser();
  if (!user) return 0;
  return getActiveReminderCount(user.id);
}

/* ---------- View: Compact Reminder Panel (chart sidebar) ---------- */

function renderRemindersPanel(patientId, container) {
  container.innerHTML = '';

  var user = getSessionUser();
  if (!user) return;

  var header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
  var h4 = document.createElement('h4');
  h4.textContent = 'Reminders';
  h4.style.cssText = 'margin:0;font-size:14px;font-weight:600;';
  var addBtn = document.createElement('button');
  addBtn.className = 'btn btn-secondary btn-sm';
  addBtn.textContent = '+ Add';
  addBtn.style.fontSize = '12px';
  addBtn.addEventListener('click', function() {
    openAddReminderModal(patientId, function() {
      renderRemindersPanel(patientId, container);
    });
  });
  header.appendChild(h4);
  header.appendChild(addBtn);
  container.appendChild(header);

  var reminders = getPatientReminders(patientId, user.id).filter(function(r) { return r.status === 'active'; });

  if (reminders.length === 0) {
    var empty = document.createElement('div');
    empty.style.cssText = 'font-size:13px;color:#9ca3af;text-align:center;padding:8px 0;';
    empty.textContent = 'No active reminders';
    container.appendChild(empty);
    return;
  }

  // Sort by priority then due date
  var priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  reminders.sort(function(a, b) {
    var pa = priorityOrder[a.priority] || 2;
    var pb = priorityOrder[b.priority] || 2;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  reminders.forEach(function(rem) {
    var row = document.createElement('div');
    row.className = 'reminder-item reminder-priority-' + rem.priority;
    row.style.cssText = 'display:flex;align-items:flex-start;gap:6px;padding:4px 0;border-bottom:1px solid #f3f4f6;cursor:pointer;';

    var dot = document.createElement('span');
    dot.className = 'reminder-priority-dot reminder-dot-' + rem.priority;
    dot.textContent = '\u25CF';
    dot.style.cssText = 'flex-shrink:0;margin-top:2px;';

    var textWrap = document.createElement('div');
    textWrap.style.cssText = 'flex:1;min-width:0;';
    var textEl = document.createElement('div');
    textEl.className = 'reminder-text';
    textEl.style.cssText = 'font-size:13px;line-height:1.3;';
    textEl.textContent = rem.text;
    textWrap.appendChild(textEl);

    if (rem.dueDate) {
      var dueDateEl = document.createElement('div');
      dueDateEl.style.cssText = 'font-size:11px;color:#9ca3af;margin-top:1px;';
      var dueDate = new Date(rem.dueDate + 'T00:00:00');
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        dueDateEl.style.color = '#dc2626';
        dueDateEl.textContent = 'Overdue: ' + dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        dueDateEl.textContent = 'Due: ' + dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      textWrap.appendChild(dueDateEl);
    }

    var checkBtn = document.createElement('button');
    checkBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:14px;color:#10b981;padding:0;line-height:1;flex-shrink:0;';
    checkBtn.textContent = '\u2713';
    checkBtn.title = 'Complete';
    checkBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      completeReminder(rem.id);
      showToast('Reminder completed', 'success');
      renderRemindersPanel(patientId, container);
    });

    row.appendChild(dot);
    row.appendChild(textWrap);
    row.appendChild(checkBtn);

    // Right-click to dismiss
    row.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      dismissReminder(rem.id);
      showToast('Reminder dismissed', 'success');
      renderRemindersPanel(patientId, container);
    });

    container.appendChild(row);
  });
}

/* ---------- View: Full Reminders Dashboard ---------- */

function renderRemindersView() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var user = getSessionUser();
  if (!user) { app.textContent = 'Not logged in.'; return; }

  setTopbar({ title: 'Reminders', meta: '', actions: '' });
  setActiveNav('reminders');

  var allReminders = getReminders(user.id);

  // Filter controls
  var toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap;';

  var filterLabel = document.createElement('span');
  filterLabel.textContent = 'Filter:';
  filterLabel.style.fontWeight = '600';
  toolbar.appendChild(filterLabel);

  var _filterPriority = '';
  var _filterStatus = 'active';

  var prioritySelect = document.createElement('select');
  prioritySelect.className = 'input';
  prioritySelect.style.width = 'auto';
  prioritySelect.innerHTML = '<option value="">All Priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>';
  prioritySelect.addEventListener('change', function() { _filterPriority = prioritySelect.value; _renderList(); });
  toolbar.appendChild(prioritySelect);

  var statusSelect = document.createElement('select');
  statusSelect.className = 'input';
  statusSelect.style.width = 'auto';
  statusSelect.innerHTML = '<option value="active">Active</option><option value="completed">Completed</option><option value="dismissed">Dismissed</option><option value="">All</option>';
  statusSelect.addEventListener('change', function() { _filterStatus = statusSelect.value; _renderList(); });
  toolbar.appendChild(statusSelect);

  // Batch actions
  var _selectedIds = [];
  var batchBar = document.createElement('div');
  batchBar.className = 'reminder-batch-bar';
  batchBar.style.cssText = 'display:none;gap:8px;align-items:center;margin-bottom:12px;padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;';

  var batchCount = document.createElement('span');
  batchCount.style.fontWeight = '600';
  batchBar.appendChild(batchCount);

  var batchComplete = document.createElement('button');
  batchComplete.className = 'btn btn-success btn-sm';
  batchComplete.textContent = 'Complete Selected';
  batchComplete.addEventListener('click', function() {
    _selectedIds.forEach(function(id) { completeReminder(id); });
    showToast(_selectedIds.length + ' reminder(s) completed', 'success');
    _selectedIds = [];
    _renderList();
  });
  batchBar.appendChild(batchComplete);

  var batchDismiss = document.createElement('button');
  batchDismiss.className = 'btn btn-secondary btn-sm';
  batchDismiss.textContent = 'Dismiss Selected';
  batchDismiss.addEventListener('click', function() {
    _selectedIds.forEach(function(id) { dismissReminder(id); });
    showToast(_selectedIds.length + ' reminder(s) dismissed', 'success');
    _selectedIds = [];
    _renderList();
  });
  batchBar.appendChild(batchDismiss);

  app.appendChild(toolbar);
  app.appendChild(batchBar);

  var listContainer = document.createElement('div');
  app.appendChild(listContainer);

  function _updateBatchBar() {
    if (_selectedIds.length > 0) {
      batchBar.style.display = 'flex';
      batchCount.textContent = _selectedIds.length + ' selected';
    } else {
      batchBar.style.display = 'none';
    }
  }

  function _renderList() {
    listContainer.innerHTML = '';
    _selectedIds = [];
    _updateBatchBar();

    // Re-fetch to get fresh data
    var reminders = getReminders(user.id);

    // Apply filters
    if (_filterPriority) {
      reminders = reminders.filter(function(r) { return r.priority === _filterPriority; });
    }
    if (_filterStatus) {
      reminders = reminders.filter(function(r) { return r.status === _filterStatus; });
    }

    if (reminders.length === 0) {
      listContainer.appendChild(buildEmptyState('', 'No reminders', 'Add reminders from a patient chart.'));
      return;
    }

    // Group by time bucket
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);
    var endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    var groups = { overdue: [], today: [], thisWeek: [], later: [], noDue: [] };

    reminders.forEach(function(r) {
      if (!r.dueDate) { groups.noDue.push(r); return; }
      var d = new Date(r.dueDate + 'T00:00:00');
      if (d < today && r.status === 'active') { groups.overdue.push(r); }
      else if (d >= today && d < endOfToday) { groups.today.push(r); }
      else if (d >= endOfToday && d < endOfWeek) { groups.thisWeek.push(r); }
      else if (d < today) { groups.today.push(r); } // Past non-active
      else { groups.later.push(r); }
    });

    var sections = [
      { key: 'overdue',  label: 'Overdue',   color: '#dc2626' },
      { key: 'today',    label: 'Today',      color: '#f59e0b' },
      { key: 'thisWeek', label: 'This Week',  color: '#3b82f6' },
      { key: 'later',    label: 'Later',      color: '#6b7280' },
      { key: 'noDue',    label: 'No Due Date', color: '#9ca3af' },
    ];

    sections.forEach(function(sec) {
      var items = groups[sec.key];
      if (items.length === 0) return;

      // Sort by priority within group
      var priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      items.sort(function(a, b) {
        var pa = priorityOrder[a.priority] || 2;
        var pb = priorityOrder[b.priority] || 2;
        if (pa !== pb) return pa - pb;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return 0;
      });

      var sectionEl = document.createElement('div');
      sectionEl.style.marginBottom = '20px';

      var sectionHeader = document.createElement('h3');
      sectionHeader.style.cssText = 'font-size:15px;font-weight:600;margin:0 0 8px 0;padding-bottom:4px;border-bottom:2px solid ' + sec.color + ';color:' + sec.color + ';';
      sectionHeader.textContent = sec.label + ' (' + items.length + ')';
      sectionEl.appendChild(sectionHeader);

      items.forEach(function(rem) {
        var row = document.createElement('div');
        row.className = 'reminder-row';
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:6px;background:#fff;';

        // Checkbox
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.style.flexShrink = '0';
        cb.addEventListener('change', function() {
          if (cb.checked) _selectedIds.push(rem.id);
          else _selectedIds = _selectedIds.filter(function(id) { return id !== rem.id; });
          _updateBatchBar();
        });
        row.appendChild(cb);

        // Priority dot
        var dot = document.createElement('span');
        dot.className = 'reminder-priority-dot reminder-dot-' + rem.priority;
        dot.textContent = '\u25CF';
        dot.style.flexShrink = '0';
        row.appendChild(dot);

        // Patient name (clickable)
        var patient = getPatient(rem.patientId);
        var patEl = document.createElement('a');
        patEl.href = '#chart/' + rem.patientId;
        patEl.style.cssText = 'font-weight:600;font-size:13px;white-space:nowrap;color:#2563eb;text-decoration:none;min-width:120px;';
        patEl.textContent = patient ? (patient.firstName + ' ' + patient.lastName) : 'Unknown';
        row.appendChild(patEl);

        // Text
        var textEl = document.createElement('span');
        textEl.style.cssText = 'flex:1;font-size:13px;';
        textEl.textContent = rem.text;
        row.appendChild(textEl);

        // Priority badge
        var priBadge = document.createElement('span');
        priBadge.className = 'reminder-badge reminder-badge-' + rem.priority;
        priBadge.textContent = rem.priority.charAt(0).toUpperCase() + rem.priority.slice(1);
        row.appendChild(priBadge);

        // Due date
        if (rem.dueDate) {
          var dueDateEl = document.createElement('span');
          dueDateEl.style.cssText = 'font-size:12px;color:#6b7280;white-space:nowrap;';
          var d = new Date(rem.dueDate + 'T00:00:00');
          dueDateEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          row.appendChild(dueDateEl);
        }

        // Actions
        if (rem.status === 'active') {
          var completeBtn = document.createElement('button');
          completeBtn.className = 'btn btn-success btn-sm';
          completeBtn.textContent = 'Done';
          completeBtn.style.fontSize = '12px';
          completeBtn.addEventListener('click', function() {
            completeReminder(rem.id);
            showToast('Reminder completed', 'success');
            _renderList();
          });
          row.appendChild(completeBtn);
        }

        sectionEl.appendChild(row);
      });

      listContainer.appendChild(sectionEl);
    });
  }

  _renderList();
}

/* ---------- View: Add Reminder Modal ---------- */

function openAddReminderModal(patientId, onDone) {
  var user = getSessionUser();
  if (!user) { showToast('Not logged in', 'error'); return; }

  var patient = getPatient(patientId);
  var patientLabel = patient ? (patient.firstName + ' ' + patient.lastName) : 'Patient';

  var bodyHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<div style="font-size:13px;color:#6b7280;">Reminder for <strong>' + esc(patientLabel) + '</strong></div>' +
      '<div>' +
        '<label style="font-weight:600;">Reminder Text</label>' +
        '<input type="text" id="reminder-text" class="input" placeholder="e.g. Follow up on lab results">' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Priority</label>' +
        '<div id="reminder-priority-radios" style="display:flex;gap:12px;margin-top:4px;">' +
          '<label class="reminder-radio-label"><input type="radio" name="reminder-priority" value="low"> <span class="reminder-dot-low">\u25CF</span> Low</label>' +
          '<label class="reminder-radio-label"><input type="radio" name="reminder-priority" value="normal" checked> <span class="reminder-dot-normal">\u25CF</span> Normal</label>' +
          '<label class="reminder-radio-label"><input type="radio" name="reminder-priority" value="high"> <span class="reminder-dot-high">\u25CF</span> High</label>' +
          '<label class="reminder-radio-label"><input type="radio" name="reminder-priority" value="urgent"> <span class="reminder-dot-urgent">\u25CF</span> Urgent</label>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label style="font-weight:600;">Due Date</label>' +
        '<input type="date" id="reminder-due-date" class="input">' +
      '</div>' +
    '</div>';

  var footerHTML =
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" id="reminder-save-btn">Save</button>';

  openModal({ title: 'Add Reminder', bodyHTML: bodyHTML, footerHTML: footerHTML });

  document.getElementById('reminder-save-btn').addEventListener('click', function() {
    var text = document.getElementById('reminder-text').value.trim();
    if (!text) { showToast('Reminder text is required', 'error'); return; }

    var priorityRadio = document.querySelector('input[name="reminder-priority"]:checked');
    var priority = priorityRadio ? priorityRadio.value : 'normal';
    var dueDate = document.getElementById('reminder-due-date').value;

    saveReminder({
      patientId:  patientId,
      providerId: user.id,
      text:       text,
      priority:   priority,
      dueDate:    dueDate || '',
      status:     'active',
      createdAt:  new Date().toISOString(),
    });

    showToast('Reminder saved', 'success');
    closeModal();
    if (typeof onDone === 'function') onDone();
  });
}
