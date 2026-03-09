/* ============================================================
   views/inbox.js — Result review inbox with tabs
   ============================================================ */

let _inboxTab = 'labs';

function _inboxEncounterFilter(item) {
  const mode = getEncounterMode();
  if (!item.encounterId) return true; // Items without encounter show in both modes
  const enc = getEncounter(item.encounterId);
  return encounterMatchesMode(enc, mode);
}

function getFilteredLabsInbox() {
  return getAllLabResults().filter(l => !l.reviewedBy && _inboxEncounterFilter(l));
}

function getFilteredNotesInbox() {
  return getNotes().filter(n => !n.signed && _inboxEncounterFilter(n));
}

function getFilteredOrdersInbox() {
  return getOrders().filter(o => o.status === 'Pending' && _inboxEncounterFilter(o));
}

function getFilteredReferralsInbox() {
  return loadAll(KEYS.referrals).filter(r => (r.status === 'Pending' || r.status === 'Sent') && _inboxEncounterFilter(r));
}

function _getInboxMessageCount() {
  const user = getSessionUser();
  if (!user) return 0;
  const providerId = getCurrentProvider() || user.id;
  return getUnreadMessageCount(providerId, 'provider');
}

function getFilteredRefillsInbox() {
  return getOrders().filter(o => o.type === 'Medication' && o.status === 'Pending' && _inboxEncounterFilter(o));
}

function getInboxCounts() {
  const labs = getFilteredLabsInbox().length;
  const notes = getFilteredNotesInbox().length;
  const orders = getFilteredOrdersInbox().length;
  const referrals = getFilteredReferralsInbox().length;
  const messages = _getInboxMessageCount();
  const refills = getFilteredRefillsInbox().length;
  return { labs, notes, orders, referrals, messages, refills, total: labs + notes + orders + referrals + messages + refills };
}

function updateSidebarBadges() {
  const counts = getInboxCounts();
  const setBadge = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val > 0 ? val : '';
  };
  setBadge('messages-badge', counts.messages);
  setBadge('labs-badge', counts.labs);
  setBadge('refills-badge', counts.refills);
  setBadge('notes-badge', counts.notes);
}

function updateInboxBadge() {
  updateSidebarBadges();
}

function renderInbox(preselectedTab) {
  if (preselectedTab) {
    _inboxTab = preselectedTab;
    setActiveNav('inbox-' + preselectedTab);
  } else {
    setActiveNav('inbox-' + _inboxTab);
  }

  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Inbox', meta: '', actions: '' });

  const counts = getInboxCounts();

  // Tab bar
  const tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';

  const tabDefs = [
    { key: 'labs',      label: 'Test Results',       count: counts.labs },
    { key: 'refills',   label: 'Refill Requests',    count: counts.refills },
    { key: 'notes',     label: 'Unsigned Notes',     count: counts.notes },
    { key: 'orders',    label: 'Pending Orders',     count: counts.orders },
    { key: 'referrals', label: 'Pending Referrals',  count: counts.referrals },
  ];

  tabDefs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_inboxTab === t.key ? ' active' : '');
    btn.setAttribute('data-inbox-tab', t.key);
    btn.textContent = t.label + ' ';

    const badge = document.createElement('span');
    badge.className = 'tab-badge';
    if (t.count > 0) {
      badge.textContent = t.count;
    } else {
      badge.style.display = 'none';
    }
    btn.appendChild(badge);

    btn.addEventListener('click', () => {
      _inboxTab = t.key;
      location.hash = '#inbox/' + t.key;
    });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  // Content card
  const card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '16px 20px';

  switch (_inboxTab) {
    case 'labs':      buildLabsInbox(card); break;
    case 'refills':   buildRefillsInbox(card); break;
    case 'notes':     buildNotesInbox(card); break;
    case 'orders':    buildOrdersInbox(card); break;
    case 'referrals': buildReferralsInbox(card); break;
  }

  app.appendChild(card);
}

function buildLabsInbox(card) {
  const labs = getFilteredLabsInbox();

  if (labs.length === 0) {
    card.appendChild(buildEmptyState('', 'No unreviewed labs', 'All lab results have been reviewed.'));
    return;
  }

  labs.forEach(lab => {
    const patient = getPatient(lab.patientId);
    const item = document.createElement('div');
    item.className = 'inbox-item';

    const body = document.createElement('div');
    body.className = 'inbox-item-body';
    const title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = lab.panel;
    const meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' · ' + formatDateTime(lab.resultDate))); }
    else { meta.textContent = 'Unknown · ' + formatDateTime(lab.resultDate); }
    body.appendChild(title);
    body.appendChild(meta);

    // Flag summary
    const flags = (lab.tests || []).filter(t => t.flag && t.flag !== 'Normal');
    if (flags.length > 0) {
      const flagEl = document.createElement('div');
      flagEl.style.cssText = 'font-size:11px;color:var(--warning);margin-top:2px';
      flagEl.textContent = flags.length + ' abnormal result' + (flags.length !== 1 ? 's' : '');
      body.appendChild(flagEl);
    }

    const reviewBtn = document.createElement('button');
    reviewBtn.className = 'btn btn-primary btn-sm';
    reviewBtn.textContent = 'Review';
    reviewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLabReviewModal(lab.id);
    });

    item.appendChild(body);
    item.appendChild(reviewBtn);

    item.addEventListener('click', () => {
      if (patient) navigate('#chart/' + patient.id);
    });

    card.appendChild(item);
  });
}

function openLabReviewModal(labId) {
  const lab = getAllLabResults().find(l => l.id === labId);
  if (!lab) return;

  const patient = getPatient(lab.patientId);
  const patName = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';

  let testsHTML = '<table class="table" style="font-size:13px"><thead><tr><th>Test</th><th>Value</th><th>Unit</th><th>Ref Range</th><th>Flag</th></tr></thead><tbody>';
  (lab.tests || []).forEach(t => {
    const flagClass = t.flag === 'Normal' ? 'flag-normal' : (t.flag === 'High' ? 'flag-high' : (t.flag === 'Low' ? 'flag-low' : ''));
    testsHTML += '<tr><td>' + esc(t.name) + '</td><td style="font-weight:600">' + esc(t.value) + '</td><td>' + esc(t.unit) + '</td><td>' + esc(t.referenceRange) + '</td><td class="' + flagClass + '">' + esc(t.flag) + '</td></tr>';
  });
  testsHTML += '</tbody></table>';

  // Get reviewer identity
  const currentProv = getCurrentProvider();
  const reviewer = currentProv ? getProvider(currentProv) : null;
  const reviewerName = reviewer ? reviewer.firstName + ' ' + reviewer.lastName + ', ' + reviewer.degree : 'Current User';

  const bodyHTML = `
    <div style="margin-bottom:12px">
      <strong>Patient:</strong> <span id="lab-rev-patient"></span><br>
      <strong>Panel:</strong> <span id="lab-rev-panel"></span><br>
      <strong>Date:</strong> <span id="lab-rev-date"></span><br>
      <strong>Notes:</strong> <span id="lab-rev-notes"></span>
    </div>
    <div class="table-wrap">${testsHTML}</div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Reviewing as: <strong>${esc(reviewerName)}</strong></div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Review Comment (optional)</label>
        <textarea class="form-control" id="lab-rev-comment" rows="2" placeholder="Add a comment about these results..."></textarea>
      </div>
    </div>
  `;

  openModal({
    title: 'Lab Review',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" id="lab-rev-close">Close</button><button class="btn btn-primary" id="lab-rev-mark">Mark Reviewed</button>',
    size: 'lg',
  });

  document.getElementById('lab-rev-patient').textContent = patName;
  document.getElementById('lab-rev-panel').textContent = lab.panel;
  document.getElementById('lab-rev-date').textContent = formatDateTime(lab.resultDate);
  document.getElementById('lab-rev-notes').textContent = lab.notes || '—';

  document.getElementById('lab-rev-close').addEventListener('click', closeModal);
  document.getElementById('lab-rev-mark').addEventListener('click', () => {
    const comment = (document.getElementById('lab-rev-comment')?.value || '').trim();
    saveLabResult({
      id: lab.id,
      reviewedBy: currentProv || 'Current User',
      reviewedAt: new Date().toISOString(),
      reviewComment: comment || undefined,
    });
    closeModal();
    showToast('Lab result marked as reviewed.', 'success');
    updateSidebarBadges();
    renderInbox();
  });
}

function buildNotesInbox(card) {
  const unsignedNotes = getFilteredNotesInbox();

  if (unsignedNotes.length === 0) {
    card.appendChild(buildEmptyState('', 'No unsigned notes', 'All notes have been signed.'));
    return;
  }

  unsignedNotes.forEach(note => {
    const enc = getEncounter(note.encounterId);
    const patient = enc ? getPatient(enc.patientId) : null;

    const item = document.createElement('div');
    item.className = 'inbox-item';

    const body = document.createElement('div');
    body.className = 'inbox-item-body';
    const title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = note.chiefComplaint || 'Untitled Note';
    const meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' · ' + formatDateTime(note.lastModified))); }
    else { meta.textContent = 'Unknown · ' + formatDateTime(note.lastModified); }
    body.appendChild(title);
    body.appendChild(meta);

    const goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'Open';
    goBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('#encounter/' + note.encounterId);
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', () => navigate('#encounter/' + note.encounterId));
    card.appendChild(item);
  });
}

function buildOrdersInbox(card) {
  const pendingOrders = getFilteredOrdersInbox();

  if (pendingOrders.length === 0) {
    card.appendChild(buildEmptyState('', 'No pending orders', 'All orders have been processed.'));
    return;
  }

  pendingOrders.forEach(order => {
    const patient = getPatient(order.patientId);
    const item = document.createElement('div');
    item.className = 'inbox-item';

    const body = document.createElement('div');
    body.className = 'inbox-item-body';
    const title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = order.type + ': ' + (order.detail.drug || order.detail.panel || order.detail.modality || order.detail.service || 'Order');
    const meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' · ' + order.priority + ' · ' + formatDateTime(order.dateTime))); }
    else { meta.textContent = 'Unknown · ' + order.priority + ' · ' + formatDateTime(order.dateTime); }
    body.appendChild(title);
    body.appendChild(meta);

    const goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'View';
    goBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('#orders/' + order.encounterId);
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', () => navigate('#orders/' + order.encounterId));
    card.appendChild(item);
  });
}

function buildRefillsInbox(card) {
  const refills = getFilteredRefillsInbox();

  if (refills.length === 0) {
    card.appendChild(buildEmptyState('', 'No refill requests', 'All medication refills have been processed.'));
    return;
  }

  refills.forEach(order => {
    const patient = getPatient(order.patientId);
    const item = document.createElement('div');
    item.className = 'inbox-item';

    const body = document.createElement('div');
    body.className = 'inbox-item-body';
    const title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = 'Refill: ' + (order.detail.drug || 'Medication');
    const meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' · ' + order.priority + ' · ' + formatDateTime(order.dateTime))); }
    else { meta.textContent = 'Unknown · ' + order.priority + ' · ' + formatDateTime(order.dateTime); }
    body.appendChild(title);
    body.appendChild(meta);

    const goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'View';
    goBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('#orders/' + order.encounterId);
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', () => navigate('#orders/' + order.encounterId));
    card.appendChild(item);
  });
}

function buildReferralsInbox(card) {
  const pendingRefs = getFilteredReferralsInbox()
    .sort((a, b) => new Date(b.referralDate) - new Date(a.referralDate));

  if (pendingRefs.length === 0) {
    card.appendChild(buildEmptyState('', 'No pending referrals', 'All referrals have been resolved.'));
    return;
  }

  pendingRefs.forEach(ref => {
    const patient = getPatient(ref.patientId);
    const item = document.createElement('div');
    item.className = 'inbox-item';

    const body = document.createElement('div');
    body.className = 'inbox-item-body';
    const title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = ref.specialty + ' — ' + (ref.providerName || 'TBD');
    const meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' · ' + ref.status + ' · ' + formatDate(ref.referralDate))); }
    else { meta.textContent = 'Unknown · ' + ref.status + ' · ' + formatDate(ref.referralDate); }
    body.appendChild(title);
    body.appendChild(meta);

    const goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'View in Chart';
    goBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (patient) {
        if (typeof _pendingScrollSection !== 'undefined') _pendingScrollSection = 'section-referrals';
        navigate('#chart/' + patient.id);
      }
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', () => {
      if (patient) {
        if (typeof _pendingScrollSection !== 'undefined') _pendingScrollSection = 'section-referrals';
        navigate('#chart/' + patient.id);
      }
    });
    card.appendChild(item);
  });
}

/* ============================================================
   Messages Tab
   ============================================================ */

function _getMessageTypeBadgeClass(type) {
  switch (type) {
    case 'lab_result':       return 'msg-type-lab';
    case 'rx_notification':  return 'msg-type-rx';
    case 'appointment':      return 'msg-type-appt';
    case 'referral':         return 'msg-type-referral';
    case 'system':           return 'msg-type-system';
    default:                 return 'msg-type-general';
  }
}

function _getMessageTypeLabel(type) {
  switch (type) {
    case 'lab_result':       return 'Lab';
    case 'rx_notification':  return 'Rx';
    case 'appointment':      return 'Appt';
    case 'referral':         return 'Referral';
    case 'system':           return 'System';
    default:                 return 'General';
  }
}

function _formatMessageTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return diffMin + 'm ago';
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + 'h ago';
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return diffDays + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function _getMessageThreads() {
  const user = getSessionUser();
  if (!user) return [];
  const providerId = getCurrentProvider() || user.id;
  const allMsgs = getMessages().filter(function(m) {
    return m.toId === providerId || m.fromId === providerId;
  });

  // Group by threadId
  const threadMap = {};
  allMsgs.forEach(function(m) {
    if (!threadMap[m.threadId]) threadMap[m.threadId] = [];
    threadMap[m.threadId].push(m);
  });

  // Build thread summaries
  var threads = [];
  Object.keys(threadMap).forEach(function(tid) {
    var msgs = threadMap[tid].sort(function(a, b) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    var last = msgs[msgs.length - 1];
    var unreadCount = msgs.filter(function(m) {
      return m.toId === providerId && m.status === 'Sent';
    }).length;
    threads.push({
      threadId:     tid,
      patientId:    last.patientId,
      subject:      msgs[0].subject,
      type:         msgs[0].type,
      priority:     last.priority,
      lastMessage:  last.body,
      lastSender:   last.fromName,
      lastTime:     last.createdAt,
      unreadCount:  unreadCount,
      messageCount: msgs.length,
    });
  });

  // Sort by most recent first
  threads.sort(function(a, b) {
    return new Date(b.lastTime) - new Date(a.lastTime);
  });
  return threads;
}

function buildMessagesInbox(card) {
  // New message button
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)';

  const headerTitle = document.createElement('div');
  headerTitle.style.cssText = 'font-size:13px;font-weight:600;color:var(--text-secondary)';
  headerTitle.textContent = 'Message Threads';

  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary btn-sm';
  newBtn.textContent = 'New Message';
  newBtn.addEventListener('click', function() { openComposeMessageModal(); });

  header.appendChild(headerTitle);
  header.appendChild(newBtn);
  card.appendChild(header);

  const threads = _getMessageThreads();

  if (threads.length === 0) {
    card.appendChild(buildEmptyState('', 'No messages', 'Send a message to a patient to get started.'));
    return;
  }

  threads.forEach(function(thread) {
    const patient = getPatient(thread.patientId);
    const item = document.createElement('div');
    item.className = 'message-thread-item' + (thread.unreadCount > 0 ? ' unread' : '');

    // Unread indicator
    const indicator = document.createElement('div');
    indicator.className = 'message-unread-dot';
    if (thread.unreadCount > 0) {
      indicator.style.cssText = 'width:8px;height:8px;border-radius:50%;background:var(--accent-blue);flex-shrink:0';
    } else {
      indicator.style.cssText = 'width:8px;height:8px;flex-shrink:0';
    }
    item.appendChild(indicator);

    const bodyWrap = document.createElement('div');
    bodyWrap.style.cssText = 'flex:1;min-width:0';

    // Top row: patient name + type badge + time
    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:2px';

    const patName = document.createElement('div');
    patName.className = 'message-thread-patient';
    if (patient) { patName.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); }
    else { patName.textContent = 'Unknown'; }

    const typeBadge = document.createElement('span');
    typeBadge.className = 'message-type-badge ' + _getMessageTypeBadgeClass(thread.type);
    typeBadge.textContent = _getMessageTypeLabel(thread.type);

    if (thread.priority === 'Urgent') {
      const urgentBadge = document.createElement('span');
      urgentBadge.className = 'message-priority-urgent';
      urgentBadge.textContent = 'Urgent';
      topRow.appendChild(patName);
      topRow.appendChild(typeBadge);
      topRow.appendChild(urgentBadge);
    } else {
      topRow.appendChild(patName);
      topRow.appendChild(typeBadge);
    }

    bodyWrap.appendChild(topRow);

    // Subject
    const subjEl = document.createElement('div');
    subjEl.className = 'message-thread-subject';
    subjEl.textContent = thread.subject;
    bodyWrap.appendChild(subjEl);

    // Preview
    const preview = document.createElement('div');
    preview.className = 'message-thread-preview';
    const previewText = thread.lastMessage || '';
    preview.textContent = thread.lastSender + ': ' + (previewText.length > 80 ? previewText.substring(0, 80) + '...' : previewText);
    bodyWrap.appendChild(preview);

    item.appendChild(bodyWrap);

    // Right side: time + count
    const rightCol = document.createElement('div');
    rightCol.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0';

    const timeEl = document.createElement('div');
    timeEl.className = 'message-thread-time';
    timeEl.textContent = _formatMessageTime(thread.lastTime);
    rightCol.appendChild(timeEl);

    if (thread.unreadCount > 0) {
      const countBadge = document.createElement('span');
      countBadge.className = 'message-unread-badge';
      countBadge.textContent = thread.unreadCount;
      rightCol.appendChild(countBadge);
    }

    item.appendChild(rightCol);

    item.addEventListener('click', function() {
      openMessageThreadModal(thread.threadId);
    });

    card.appendChild(item);
  });
}

/* ---------- Compose Message Modal ---------- */
function openComposeMessageModal(replyThreadId, replyPatientId) {
  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;
  const provider = getProvider(providerId);
  const providerName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);

  const isReply = !!replyThreadId;
  let replyThread = [];
  let replyPatient = null;
  if (isReply) {
    replyThread = getMessageThread(replyThreadId);
    if (replyPatientId) replyPatient = getPatient(replyPatientId);
  }

  const patients = getPatients().sort(function(a, b) {
    return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName);
  });

  let patientOptionsHTML = '<option value="">-- Select Patient --</option>';
  patients.forEach(function(p) {
    const sel = (replyPatientId && p.id === replyPatientId) ? ' selected' : '';
    patientOptionsHTML += '<option value="' + esc(p.id) + '"' + sel + '>' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });

  const bodyHTML = '<div class="message-compose">' +
    '<div class="form-group">' +
      '<label class="form-label">Patient</label>' +
      '<select class="form-control" id="msg-patient"' + (isReply ? ' disabled' : '') + '>' + patientOptionsHTML + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Message Type</label>' +
      '<select class="form-control" id="msg-type">' +
        '<option value="general">General</option>' +
        '<option value="lab_result">Lab Result</option>' +
        '<option value="rx_notification">Rx Notification</option>' +
        '<option value="appointment">Appointment</option>' +
        '<option value="referral">Referral</option>' +
      '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Subject</label>' +
      '<input type="text" class="form-control" id="msg-subject" placeholder="Message subject..."' + (isReply && replyThread.length > 0 ? ' value="Re: ' + esc(replyThread[0].subject) + '"' : '') + '>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Priority</label>' +
      '<select class="form-control" id="msg-priority">' +
        '<option value="Normal">Normal</option>' +
        '<option value="Urgent">Urgent</option>' +
      '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Message</label>' +
      '<textarea class="form-control" id="msg-body" rows="5" placeholder="Type your message..."></textarea>' +
    '</div>' +
  '</div>';

  openModal({
    title: isReply ? 'Reply to Thread' : 'New Message',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" id="msg-cancel">Cancel</button><button class="btn btn-primary" id="msg-send">Send Message</button>',
    size: 'lg',
  });

  document.getElementById('msg-cancel').addEventListener('click', closeModal);
  document.getElementById('msg-send').addEventListener('click', function() {
    const patientId = isReply ? replyPatientId : document.getElementById('msg-patient').value;
    const msgType   = document.getElementById('msg-type').value;
    const subject   = document.getElementById('msg-subject').value.trim();
    const priority  = document.getElementById('msg-priority').value;
    const body      = document.getElementById('msg-body').value.trim();

    if (!patientId) { showToast('Please select a patient.', 'error'); return; }
    if (!subject)   { showToast('Please enter a subject.', 'error'); return; }
    if (!body)      { showToast('Please enter a message.', 'error'); return; }

    const patient = getPatient(patientId);
    const toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

    saveMessage({
      threadId:  isReply ? replyThreadId : '',
      type:      msgType,
      fromType:  'provider',
      fromId:    providerId,
      fromName:  providerName,
      toType:    'patient',
      toId:      patientId,
      toName:    toName,
      patientId: patientId,
      subject:   subject,
      body:      body,
      priority:  priority,
      status:    'Sent',
    });

    closeModal();
    showToast('Message sent.', 'success');
    updateSidebarBadges();
    if (_inboxTab === 'messages') renderInbox();
  });
}

/* ---------- Message Thread Modal ---------- */
function openMessageThreadModal(threadId) {
  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;

  const msgs = getMessageThread(threadId);
  if (msgs.length === 0) return;

  const patientId = msgs[0].patientId;
  const patient = getPatient(patientId);
  const patName = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';

  // Mark unread messages as read
  let markedAny = false;
  msgs.forEach(function(m) {
    if (m.toId === providerId && m.status === 'Sent') {
      markMessageRead(m.id);
      markedAny = true;
    }
  });
  if (markedAny) updateSidebarBadges();

  // Reload after marking read
  const freshMsgs = getMessageThread(threadId);

  // Build thread HTML
  let threadHTML = '<div style="margin-bottom:12px">' +
    '<strong>Patient:</strong> <span id="msg-thread-patient"></span> &nbsp; ' +
    '<span class="message-type-badge ' + _getMessageTypeBadgeClass(freshMsgs[0].type) + '">' + esc(_getMessageTypeLabel(freshMsgs[0].type)) + '</span>' +
    '</div>';

  threadHTML += '<div class="message-thread-view" id="msg-thread-list">';
  freshMsgs.forEach(function(m) {
    const isSent = m.fromId === providerId;
    threadHTML += '<div class="message-bubble ' + (isSent ? 'sent' : 'received') + '">' +
      '<div class="message-bubble-header">' +
        '<strong>' + esc(m.fromName) + '</strong>' +
        '<span class="message-bubble-time">' + esc(_formatMessageTime(m.createdAt)) + '</span>' +
      '</div>' +
      '<div class="message-bubble-body">' + esc(m.body) + '</div>';
    if (m.attachments && m.attachments.length > 0) {
      threadHTML += '<div class="message-bubble-attachments">';
      m.attachments.forEach(function(att) {
        threadHTML += '<span class="message-attachment-chip">' + esc(att.label || att.type) + '</span>';
      });
      threadHTML += '</div>';
    }
    threadHTML += '</div>';
  });
  threadHTML += '</div>';

  // Reply area
  threadHTML += '<div style="margin-top:12px">' +
    '<label class="form-label">Reply</label>' +
    '<textarea class="form-control" id="msg-reply-body" rows="3" placeholder="Type your reply..."></textarea>' +
  '</div>';

  openModal({
    title: freshMsgs[0].subject,
    bodyHTML: threadHTML,
    footerHTML: '<button class="btn btn-secondary" id="msg-thread-close">Close</button><button class="btn btn-primary" id="msg-thread-reply">Send Reply</button>',
    size: 'lg',
    onClose: function() {
      if (_inboxTab === 'messages') renderInbox();
    },
  });

  document.getElementById('msg-thread-patient').textContent = patName;

  // Scroll thread to bottom
  var listEl = document.getElementById('msg-thread-list');
  if (listEl) listEl.scrollTop = listEl.scrollHeight;

  document.getElementById('msg-thread-close').addEventListener('click', closeModal);
  document.getElementById('msg-thread-reply').addEventListener('click', function() {
    var replyBody = document.getElementById('msg-reply-body').value.trim();
    if (!replyBody) { showToast('Please enter a reply.', 'error'); return; }

    var provider = getProvider(providerId);
    var providerName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);
    var toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

    saveMessage({
      threadId:  threadId,
      type:      freshMsgs[0].type,
      fromType:  'provider',
      fromId:    providerId,
      fromName:  providerName,
      toType:    'patient',
      toId:      patientId,
      toName:    toName,
      patientId: patientId,
      subject:   freshMsgs[0].subject,
      body:      replyBody,
      priority:  freshMsgs[0].priority,
      status:    'Sent',
    });

    closeModal();
    showToast('Reply sent.', 'success');
    updateSidebarBadges();
    // Re-open the thread to show updated messages
    openMessageThreadModal(threadId);
  });
}
