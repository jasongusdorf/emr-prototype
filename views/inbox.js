/* ============================================================
   views/inbox.js — Result review inbox with tabs, notifications,
   enhanced messages, archive, auto-refresh, and desktop alerts
   ============================================================ */

var _inboxTab = 'labs';
var _inboxAutoRefreshTimer = null;
var _inboxLastRefresh = null;
var _inboxRefreshIntervalMs = 60000;
var _inboxPreviousThreadIds = [];

/* ---------- Inbox filter / data helpers (unchanged) ---------- */

function _inboxEncounterFilter(item) {
  var mode = getEncounterMode();
  if (!item.encounterId) return true;
  var enc = getEncounter(item.encounterId);
  return encounterMatchesMode(enc, mode);
}

function getFilteredLabsInbox() {
  return getAllLabResults().filter(function(l) { return !l.reviewedBy && _inboxEncounterFilter(l); });
}

function getFilteredNotesInbox() {
  return getNotes().filter(function(n) { return !n.signed && _inboxEncounterFilter(n); });
}

function getFilteredOrdersInbox() {
  return getOrders().filter(function(o) { return o.status === 'Pending' && _inboxEncounterFilter(o); });
}

function getFilteredReferralsInbox() {
  return loadAll(KEYS.referrals).filter(function(r) { return (r.status === 'Pending' || r.status === 'Sent') && _inboxEncounterFilter(r); });
}

function _getInboxMessageCount() {
  var user = getSessionUser();
  if (!user) return 0;
  var providerId = getCurrentProvider() || user.id;
  return getUnreadMessageCount(providerId, 'provider');
}

function getFilteredRefillsInbox() {
  return getOrders().filter(function(o) { return o.type === 'Medication' && o.status === 'Pending' && _inboxEncounterFilter(o); });
}

function _getCriticalLabCount() {
  return getAllLabResults().filter(function(l) {
    if (l.reviewedBy) return false;
    var flags = (l.tests || []).filter(function(t) { return t.flag && t.flag !== 'Normal'; });
    return flags.length > 0;
  }).length;
}

function getInboxCounts() {
  var labs = getFilteredLabsInbox().length;
  var notes = getFilteredNotesInbox().length;
  var orders = getFilteredOrdersInbox().length;
  var referrals = getFilteredReferralsInbox().length;
  var messages = _getInboxMessageCount();
  var refills = getFilteredRefillsInbox().length;
  var criticalLabs = _getCriticalLabCount();
  return { labs: labs, notes: notes, orders: orders, referrals: referrals, messages: messages, refills: refills, criticalLabs: criticalLabs, total: labs + notes + orders + referrals + messages + refills };
}

function updateSidebarBadges() {
  var counts = getInboxCounts();
  var setBadge = function(id, val) {
    var el = document.getElementById(id);
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

/* ============================================================
   7. Inbox Statistics Bar
   ============================================================ */

function _buildStatsBar(container) {
  var counts = getInboxCounts();
  var bar = document.createElement('div');
  bar.className = 'inbox-stats-bar';
  bar.style.cssText = 'display:flex;gap:12px;padding:12px 20px;background:var(--bg-surface);border-bottom:1px solid var(--border);flex-wrap:wrap;align-items:center';

  var stats = [
    { label: 'Unread Messages', value: counts.messages, color: 'var(--accent-blue)', tab: 'messages' },
    { label: 'Pending Orders',  value: counts.orders,   color: 'var(--warning)',      tab: 'orders' },
    { label: 'Unsigned Notes',  value: counts.notes,    color: 'var(--warning)',      tab: 'notes' },
    { label: 'Critical Results',value: counts.criticalLabs, color: 'var(--danger)',   tab: 'labs' },
  ];

  stats.forEach(function(s) {
    var chip = document.createElement('button');
    chip.className = 'inbox-stat-chip';
    chip.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);cursor:pointer;font-size:12px;color:var(--text-secondary);transition:all .15s';
    chip.addEventListener('mouseenter', function() { chip.style.borderColor = s.color; });
    chip.addEventListener('mouseleave', function() { chip.style.borderColor = 'var(--border)'; });

    var numEl = document.createElement('span');
    numEl.style.cssText = 'font-weight:700;font-size:16px;color:' + s.color;
    numEl.textContent = s.value;
    chip.appendChild(numEl);

    var labelEl = document.createElement('span');
    labelEl.textContent = s.label;
    chip.appendChild(labelEl);

    chip.addEventListener('click', function() {
      _inboxTab = s.tab;
      location.hash = '#inbox/' + s.tab;
    });
    bar.appendChild(chip);
  });

  container.appendChild(bar);
}

/* ============================================================
   5. Desktop Notification Permission
   ============================================================ */

function initDesktopNotifications() {
  if (typeof Notification === 'undefined') return;
  var pref = localStorage.getItem('emr_desktop_notif');
  if (pref === 'granted' || pref === 'denied') return;

  var banner = document.createElement('div');
  banner.className = 'inbox-desktop-notif-banner';
  banner.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 20px;background:var(--accent-blue-light);border-bottom:1px solid var(--accent-blue);cursor:pointer;font-size:13px;color:var(--text-primary)';

  var icon = document.createElement('span');
  icon.textContent = '\uD83D\uDD14';
  icon.style.fontSize = '16px';
  banner.appendChild(icon);

  var text = document.createElement('span');
  text.style.flex = '1';
  text.textContent = 'Enable desktop notifications for urgent alerts';
  banner.appendChild(text);

  var enableBtn = document.createElement('button');
  enableBtn.className = 'btn btn-primary btn-sm';
  enableBtn.textContent = 'Enable';
  enableBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    Notification.requestPermission().then(function(perm) {
      localStorage.setItem('emr_desktop_notif', perm);
      banner.remove();
      if (perm === 'granted') {
        showToast('Desktop notifications enabled.', 'success');
      }
    });
  });
  banner.appendChild(enableBtn);

  var dismissBtn = document.createElement('button');
  dismissBtn.className = 'btn btn-secondary btn-sm';
  dismissBtn.textContent = 'Dismiss';
  dismissBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    localStorage.setItem('emr_desktop_notif', 'denied');
    banner.remove();
  });
  banner.appendChild(dismissBtn);

  return banner;
}

function _fireDesktopNotification(title, body) {
  if (typeof Notification === 'undefined') return;
  var pref = localStorage.getItem('emr_desktop_notif');
  if (pref !== 'granted') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body: body, icon: '/favicon.ico' });
  } catch(e) { /* silent */ }
}

/* ============================================================
   9. Auto-Refresh
   ============================================================ */

function _startAutoRefresh() {
  _stopAutoRefresh();
  _inboxLastRefresh = new Date();

  _inboxAutoRefreshTimer = setInterval(function() {
    _inboxLastRefresh = new Date();
    _autoRefreshInbox();
    _updateLastRefreshLabel();
  }, _inboxRefreshIntervalMs);

  registerCleanup(function() { _stopAutoRefresh(); });
}

function _stopAutoRefresh() {
  if (_inboxAutoRefreshTimer) {
    clearInterval(_inboxAutoRefreshTimer);
    _inboxAutoRefreshTimer = null;
  }
}

function _autoRefreshInbox() {
  /* Save previous thread ids for flash detection */
  var oldThreads = _inboxPreviousThreadIds.slice();
  var currentThreads = _getMessageThreads();
  _inboxPreviousThreadIds = currentThreads.map(function(t) { return t.threadId; });

  /* Check for new urgent messages */
  currentThreads.forEach(function(t) {
    if (oldThreads.indexOf(t.threadId) === -1 && t.priority === 'Urgent') {
      _fireDesktopNotification('Urgent Message', t.subject || 'New urgent message');
    }
  });

  /* Re-render if we're on the inbox view */
  if (location.hash.indexOf('#inbox') === 0) {
    updateSidebarBadges();
    /* Soft update: only re-render the content card */
    var app = document.getElementById('app');
    if (!app) return;
    var card = app.querySelector('.inbox-content-card');
    if (card) {
      card.innerHTML = '';
      switch (_inboxTab) {
        case 'labs':          buildLabsInbox(card); break;
        case 'refills':       buildRefillsInbox(card); break;
        case 'notes':         buildNotesInbox(card); break;
        case 'orders':        buildOrdersInbox(card); break;
        case 'referrals':     buildReferralsInbox(card); break;
        case 'messages':      buildMessagesInbox(card); break;
        case 'notifications': buildNotificationCenter(card); break;
      }
    }
  }
}

function _updateLastRefreshLabel() {
  var el = document.getElementById('inbox-last-refresh');
  if (!el || !_inboxLastRefresh) return;
  var diff = Math.floor((new Date() - _inboxLastRefresh) / 1000);
  if (diff < 5) { el.textContent = 'Last updated: just now'; }
  else { el.textContent = 'Last updated: ' + diff + 's ago'; }
}

function _buildRefreshFooter(container) {
  var footer = document.createElement('div');
  footer.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:8px 16px;font-size:11px;color:var(--text-muted);border-top:1px solid var(--border)';

  var refreshIcon = document.createElement('span');
  refreshIcon.textContent = '\u21BB ';
  refreshIcon.style.marginRight = '4px';
  footer.appendChild(refreshIcon);

  var label = document.createElement('span');
  label.id = 'inbox-last-refresh';
  label.textContent = 'Last updated: just now';
  footer.appendChild(label);

  container.appendChild(footer);

  /* Update label every 10s */
  var labelTimer = setInterval(_updateLastRefreshLabel, 10000);
  registerCleanup(function() { clearInterval(labelTimer); });
}

/* ============================================================
   Main render
   ============================================================ */

function renderInbox(preselectedTab) {
  if (preselectedTab) {
    _inboxTab = preselectedTab;
    setActiveNav('inbox-' + preselectedTab);
  } else {
    setActiveNav('inbox-' + _inboxTab);
  }

  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Inbox', meta: '', actions: '' });

  /* Desktop notification banner */
  var notifBanner = initDesktopNotifications();
  if (notifBanner) app.appendChild(notifBanner);

  /* Stats bar */
  _buildStatsBar(app);

  var counts = getInboxCounts();

  /* Tab bar */
  var tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';

  var tabDefs = [
    { key: 'labs',           label: 'Test Results',      count: counts.labs },
    { key: 'refills',        label: 'Refill Requests',   count: counts.refills },
    { key: 'notes',          label: 'Unsigned Notes',     count: counts.notes },
    { key: 'orders',         label: 'Pending Orders',     count: counts.orders },
    { key: 'referrals',      label: 'Pending Referrals',  count: counts.referrals },
    { key: 'messages',       label: 'Messages',           count: counts.messages },
    { key: 'notifications',  label: 'Notifications',      count: counts.total },
  ];

  tabDefs.forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_inboxTab === t.key ? ' active' : '');
    btn.setAttribute('data-inbox-tab', t.key);
    btn.textContent = t.label + ' ';

    var badge = document.createElement('span');
    badge.className = 'tab-badge';
    if (t.count > 0) {
      badge.textContent = t.count;
    } else {
      badge.style.display = 'none';
    }
    btn.appendChild(badge);

    btn.addEventListener('click', function() {
      _inboxTab = t.key;
      location.hash = '#inbox/' + t.key;
    });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  /* Content card */
  var card = document.createElement('div');
  card.className = 'card inbox-content-card';
  card.style.margin = '16px 20px';

  switch (_inboxTab) {
    case 'labs':           buildLabsInbox(card); break;
    case 'refills':        buildRefillsInbox(card); break;
    case 'notes':          buildNotesInbox(card); break;
    case 'orders':         buildOrdersInbox(card); break;
    case 'referrals':      buildReferralsInbox(card); break;
    case 'messages':       buildMessagesInbox(card); break;
    case 'notifications':  buildNotificationCenter(card); break;
  }

  app.appendChild(card);

  /* Auto-refresh footer */
  _buildRefreshFooter(app);

  /* Start auto-refresh */
  _inboxLastRefresh = new Date();
  _inboxPreviousThreadIds = _getMessageThreads().map(function(t) { return t.threadId; });
  _startAutoRefresh();
}

/* ============================================================
   Existing inbox tab builders (labs, notes, orders, refills, referrals)
   ============================================================ */

function buildLabsInbox(card) {
  var labs = getFilteredLabsInbox();

  if (labs.length === 0) {
    card.appendChild(buildEmptyState('', 'No unreviewed labs', 'All lab results have been reviewed.'));
    return;
  }

  labs.forEach(function(lab) {
    var patient = getPatient(lab.patientId);
    var item = document.createElement('div');
    item.className = 'inbox-item';

    var body = document.createElement('div');
    body.className = 'inbox-item-body';
    var title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = lab.panel;
    var meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' \u00B7 ' + formatDateTime(lab.resultDate))); }
    else { meta.textContent = 'Unknown \u00B7 ' + formatDateTime(lab.resultDate); }
    body.appendChild(title);
    body.appendChild(meta);

    var flags = (lab.tests || []).filter(function(t) { return t.flag && t.flag !== 'Normal'; });
    if (flags.length > 0) {
      var flagEl = document.createElement('div');
      flagEl.style.cssText = 'font-size:11px;color:var(--warning);margin-top:2px';
      flagEl.textContent = flags.length + ' abnormal result' + (flags.length !== 1 ? 's' : '');
      body.appendChild(flagEl);
    }

    var reviewBtn = document.createElement('button');
    reviewBtn.className = 'btn btn-primary btn-sm';
    reviewBtn.textContent = 'Review';
    reviewBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      openLabReviewModal(lab.id);
    });

    item.appendChild(body);
    item.appendChild(reviewBtn);

    item.addEventListener('click', function() {
      if (patient) navigate('#chart/' + patient.id);
    });

    card.appendChild(item);
  });
}

function openLabReviewModal(labId) {
  var lab = getAllLabResults().find(function(l) { return l.id === labId; });
  if (!lab) return;

  var patient = getPatient(lab.patientId);
  var patName = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';

  var testsHTML = '<table class="table" style="font-size:13px"><thead><tr><th>Test</th><th>Value</th><th>Unit</th><th>Ref Range</th><th>Flag</th></tr></thead><tbody>';
  (lab.tests || []).forEach(function(t) {
    var flagClass = t.flag === 'Normal' ? 'flag-normal' : (t.flag === 'High' ? 'flag-high' : (t.flag === 'Low' ? 'flag-low' : ''));
    testsHTML += '<tr><td>' + esc(t.name) + '</td><td style="font-weight:600">' + esc(t.value) + '</td><td>' + esc(t.unit) + '</td><td>' + esc(t.referenceRange) + '</td><td class="' + flagClass + '">' + esc(t.flag) + '</td></tr>';
  });
  testsHTML += '</tbody></table>';

  var currentProv = getCurrentProvider();
  var reviewer = currentProv ? getProvider(currentProv) : null;
  var reviewerName = reviewer ? reviewer.firstName + ' ' + reviewer.lastName + ', ' + reviewer.degree : 'Current User';

  var bodyHTML =
    '<div style="margin-bottom:12px">' +
      '<strong>Patient:</strong> <span id="lab-rev-patient"></span><br>' +
      '<strong>Panel:</strong> <span id="lab-rev-panel"></span><br>' +
      '<strong>Date:</strong> <span id="lab-rev-date"></span><br>' +
      '<strong>Notes:</strong> <span id="lab-rev-notes"></span>' +
    '</div>' +
    '<div class="table-wrap">' + testsHTML + '</div>' +
    '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Reviewing as: <strong>' + esc(reviewerName) + '</strong></div>' +
      '<div class="form-group" style="margin-bottom:0">' +
        '<label class="form-label">Review Comment (optional)</label>' +
        '<textarea class="form-control" id="lab-rev-comment" rows="2" placeholder="Add a comment about these results..."></textarea>' +
      '</div>' +
    '</div>';

  openModal({
    title: 'Lab Review',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" id="lab-rev-close">Close</button><button class="btn btn-primary" id="lab-rev-mark">Mark Reviewed</button>',
    size: 'lg',
  });

  document.getElementById('lab-rev-patient').textContent = patName;
  document.getElementById('lab-rev-panel').textContent = lab.panel;
  document.getElementById('lab-rev-date').textContent = formatDateTime(lab.resultDate);
  document.getElementById('lab-rev-notes').textContent = lab.notes || '\u2014';

  document.getElementById('lab-rev-close').addEventListener('click', closeModal);
  document.getElementById('lab-rev-mark').addEventListener('click', function() {
    var comment = (document.getElementById('lab-rev-comment') ? document.getElementById('lab-rev-comment').value : '').trim();
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
  var unsignedNotes = getFilteredNotesInbox();

  if (unsignedNotes.length === 0) {
    card.appendChild(buildEmptyState('', 'No unsigned notes', 'All notes have been signed.'));
    return;
  }

  unsignedNotes.forEach(function(note) {
    var enc = getEncounter(note.encounterId);
    var patient = enc ? getPatient(enc.patientId) : null;

    var item = document.createElement('div');
    item.className = 'inbox-item';

    var body = document.createElement('div');
    body.className = 'inbox-item-body';
    var title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = note.chiefComplaint || 'Untitled Note';
    var meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' \u00B7 ' + formatDateTime(note.lastModified))); }
    else { meta.textContent = 'Unknown \u00B7 ' + formatDateTime(note.lastModified); }
    body.appendChild(title);
    body.appendChild(meta);

    var goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'Open';
    goBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigate('#encounter/' + note.encounterId);
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', function() { navigate('#encounter/' + note.encounterId); });
    card.appendChild(item);
  });
}

function buildOrdersInbox(card) {
  var pendingOrders = getFilteredOrdersInbox();

  if (pendingOrders.length === 0) {
    card.appendChild(buildEmptyState('', 'No pending orders', 'All orders have been processed.'));
    return;
  }

  pendingOrders.forEach(function(order) {
    var patient = getPatient(order.patientId);
    var item = document.createElement('div');
    item.className = 'inbox-item';

    var body = document.createElement('div');
    body.className = 'inbox-item-body';
    var title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = order.type + ': ' + (order.detail.drug || order.detail.panel || order.detail.modality || order.detail.service || 'Order');
    var meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' \u00B7 ' + order.priority + ' \u00B7 ' + formatDateTime(order.dateTime))); }
    else { meta.textContent = 'Unknown \u00B7 ' + order.priority + ' \u00B7 ' + formatDateTime(order.dateTime); }
    body.appendChild(title);
    body.appendChild(meta);

    var goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'View';
    goBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigate('#orders/' + order.encounterId);
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', function() { navigate('#orders/' + order.encounterId); });
    card.appendChild(item);
  });
}

function buildRefillsInbox(card) {
  var refills = getFilteredRefillsInbox();

  if (refills.length === 0) {
    card.appendChild(buildEmptyState('', 'No refill requests', 'All medication refills have been processed.'));
    return;
  }

  refills.forEach(function(order) {
    var patient = getPatient(order.patientId);
    var item = document.createElement('div');
    item.className = 'inbox-item';

    var body = document.createElement('div');
    body.className = 'inbox-item-body';
    var title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = 'Refill: ' + (order.detail.drug || 'Medication');
    var meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' \u00B7 ' + order.priority + ' \u00B7 ' + formatDateTime(order.dateTime))); }
    else { meta.textContent = 'Unknown \u00B7 ' + order.priority + ' \u00B7 ' + formatDateTime(order.dateTime); }
    body.appendChild(title);
    body.appendChild(meta);

    var goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'View';
    goBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigate('#orders/' + order.encounterId);
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', function() { navigate('#orders/' + order.encounterId); });
    card.appendChild(item);
  });
}

function buildReferralsInbox(card) {
  var pendingRefs = getFilteredReferralsInbox()
    .sort(function(a, b) { return new Date(b.referralDate) - new Date(a.referralDate); });

  if (pendingRefs.length === 0) {
    card.appendChild(buildEmptyState('', 'No pending referrals', 'All referrals have been resolved.'));
    return;
  }

  pendingRefs.forEach(function(ref) {
    var patient = getPatient(ref.patientId);
    var item = document.createElement('div');
    item.className = 'inbox-item';

    var body = document.createElement('div');
    body.className = 'inbox-item-body';
    var title = document.createElement('div');
    title.className = 'inbox-item-title';
    title.textContent = ref.specialty + ' \u2014 ' + (ref.providerName || 'TBD');
    var meta = document.createElement('div');
    meta.className = 'inbox-item-meta';
    if (patient) { meta.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); meta.appendChild(document.createTextNode(' \u00B7 ' + ref.status + ' \u00B7 ' + formatDate(ref.referralDate))); }
    else { meta.textContent = 'Unknown \u00B7 ' + ref.status + ' \u00B7 ' + formatDate(ref.referralDate); }
    body.appendChild(title);
    body.appendChild(meta);

    var goBtn = document.createElement('button');
    goBtn.className = 'btn btn-secondary btn-sm';
    goBtn.textContent = 'View in Chart';
    goBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (patient) {
        if (typeof _pendingScrollSection !== 'undefined') _pendingScrollSection = 'section-referrals';
        navigate('#chart/' + patient.id);
      }
    });

    item.appendChild(body);
    item.appendChild(goBtn);
    item.addEventListener('click', function() {
      if (patient) {
        if (typeof _pendingScrollSection !== 'undefined') _pendingScrollSection = 'section-referrals';
        navigate('#chart/' + patient.id);
      }
    });
    card.appendChild(item);
  });
}

/* ============================================================
   Messages Tab Helpers
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
  var d = new Date(iso);
  if (isNaN(d)) return iso;
  var now = new Date();
  var diffMs = now - d;
  var diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return diffMin + 'm ago';
  var diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + 'h ago';
  var diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return diffDays + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function _getMessageThreads() {
  var user = getSessionUser();
  if (!user) return [];
  var providerId = getCurrentProvider() || user.id;
  var allMsgs = getMessages().filter(function(m) {
    return m.toId === providerId || m.fromId === providerId;
  });

  var threadMap = {};
  allMsgs.forEach(function(m) {
    if (!threadMap[m.threadId]) threadMap[m.threadId] = [];
    threadMap[m.threadId].push(m);
  });

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
      archivedAt:   last.archivedAt || null,
      archivedBy:   last.archivedBy || null,
    });
  });

  threads.sort(function(a, b) {
    return new Date(b.lastTime) - new Date(a.lastTime);
  });
  return threads;
}

/* ---------- Patient initials avatar ---------- */

function _buildPatientAvatar(patient) {
  var avatar = document.createElement('div');
  avatar.style.cssText = 'width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;flex-shrink:0;text-transform:uppercase';

  if (patient) {
    var fi = (patient.firstName || '').charAt(0);
    var li = (patient.lastName || '').charAt(0);
    avatar.textContent = fi + li;
    /* Deterministic color from name */
    var hash = 0;
    var name = (patient.firstName || '') + (patient.lastName || '');
    for (var i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    var hue = Math.abs(hash) % 360;
    avatar.style.background = 'hsl(' + hue + ', 55%, 50%)';
  } else {
    avatar.textContent = '?';
    avatar.style.background = 'var(--text-muted)';
  }
  return avatar;
}

/* ============================================================
   6. Smart Inbox Sorting
   ============================================================ */

var _inboxSortPrefKey = 'emr_inbox_sort';

function _getInboxSortPref() {
  return localStorage.getItem(_inboxSortPrefKey) || 'recent';
}

function _setInboxSortPref(val) {
  localStorage.setItem(_inboxSortPrefKey, val);
}

function _sortThreads(threads, sortBy) {
  var sorted = threads.slice();
  switch (sortBy) {
    case 'priority':
      sorted.sort(function(a, b) {
        var ap = a.priority === 'Urgent' ? 0 : 1;
        var bp = b.priority === 'Urgent' ? 0 : 1;
        if (ap !== bp) return ap - bp;
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        return new Date(b.lastTime) - new Date(a.lastTime);
      });
      break;
    case 'patient':
      sorted.sort(function(a, b) {
        var pa = getPatient(a.patientId);
        var pb = getPatient(b.patientId);
        var na = pa ? (pa.lastName + pa.firstName).toLowerCase() : 'zzz';
        var nb = pb ? (pb.lastName + pb.firstName).toLowerCase() : 'zzz';
        return na.localeCompare(nb);
      });
      break;
    case 'type':
      sorted.sort(function(a, b) {
        return (a.type || '').localeCompare(b.type || '');
      });
      break;
    default: /* recent */
      sorted.sort(function(a, b) {
        return new Date(b.lastTime) - new Date(a.lastTime);
      });
      break;
  }
  return sorted;
}

/* ============================================================
   8. Message Archive System
   ============================================================ */

function _archiveThread(threadId) {
  var user = getSessionUser();
  if (!user) return;
  var providerId = getCurrentProvider() || user.id;
  var msgs = getMessageThread(threadId);
  msgs.forEach(function(m) {
    saveMessage({
      id: m.id,
      archivedAt: new Date().toISOString(),
      archivedBy: providerId,
    });
  });
  showToast('Thread archived.', 'success');
  renderInbox();
}

function _unarchiveThread(threadId) {
  var msgs = getMessageThread(threadId);
  msgs.forEach(function(m) {
    saveMessage({
      id: m.id,
      archivedAt: null,
      archivedBy: null,
    });
  });
  showToast('Thread restored.', 'success');
  renderInbox();
}

function _isThreadArchived(thread) {
  return !!thread.archivedAt;
}

/* ============================================================
   1. Enhanced Messages Tab with filters, batch actions,
      priority sorting, patient avatars
   2. Quick Reply from Inbox (inline)
   6. Sort dropdown
   8. Archive toggle
   ============================================================ */

var _msgFilterType = 'all';
var _msgFilterStatus = 'all';
var _msgFilterDateRange = 'all';
var _msgShowArchived = false;

function buildMessagesInbox(card) {
  var user = getSessionUser();
  if (!user) return;
  var providerId = getCurrentProvider() || user.id;

  /* Header with New Message button */
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)';

  var headerTitle = document.createElement('div');
  headerTitle.style.cssText = 'font-size:13px;font-weight:600;color:var(--text-secondary)';
  headerTitle.textContent = 'Message Threads';

  var headerActions = document.createElement('div');
  headerActions.style.cssText = 'display:flex;gap:8px;align-items:center';

  var newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary btn-sm';
  newBtn.textContent = 'New Message';
  newBtn.addEventListener('click', function() { openComposeMessageModal(); });
  headerActions.appendChild(newBtn);

  header.appendChild(headerTitle);
  header.appendChild(headerActions);
  card.appendChild(header);

  /* ---- Filter bar ---- */
  var filterBar = document.createElement('div');
  filterBar.style.cssText = 'display:flex;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap;align-items:center;background:var(--bg-surface)';

  /* Type dropdown */
  var typeLabel = document.createElement('label');
  typeLabel.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:4px';
  typeLabel.textContent = 'Type:';
  var typeSelect = document.createElement('select');
  typeSelect.className = 'form-control';
  typeSelect.style.cssText = 'font-size:12px;padding:4px 8px;width:auto;min-width:100px';
  var typeOptions = [
    { value: 'all', label: 'All' },
    { value: 'lab_result', label: 'Lab' },
    { value: 'rx_notification', label: 'Rx' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'referral', label: 'Referral' },
    { value: 'general', label: 'General' },
  ];
  typeOptions.forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === _msgFilterType) opt.selected = true;
    typeSelect.appendChild(opt);
  });
  typeSelect.addEventListener('change', function() {
    _msgFilterType = typeSelect.value;
    _rebuildMessageList(card, providerId);
  });
  typeLabel.appendChild(typeSelect);
  filterBar.appendChild(typeLabel);

  /* Status toggle */
  var statusLabel = document.createElement('label');
  statusLabel.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:4px';
  statusLabel.textContent = 'Status:';
  var statusSelect = document.createElement('select');
  statusSelect.className = 'form-control';
  statusSelect.style.cssText = 'font-size:12px;padding:4px 8px;width:auto;min-width:90px';
  [{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }].forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === _msgFilterStatus) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusSelect.addEventListener('change', function() {
    _msgFilterStatus = statusSelect.value;
    _rebuildMessageList(card, providerId);
  });
  statusLabel.appendChild(statusSelect);
  filterBar.appendChild(statusLabel);

  /* Date range */
  var dateLabel = document.createElement('label');
  dateLabel.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:4px';
  dateLabel.textContent = 'Date:';
  var dateSelect = document.createElement('select');
  dateSelect.className = 'form-control';
  dateSelect.style.cssText = 'font-size:12px;padding:4px 8px;width:auto;min-width:100px';
  [{ value: 'all', label: 'All' }, { value: 'today', label: 'Today' }, { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }].forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === _msgFilterDateRange) opt.selected = true;
    dateSelect.appendChild(opt);
  });
  dateSelect.addEventListener('change', function() {
    _msgFilterDateRange = dateSelect.value;
    _rebuildMessageList(card, providerId);
  });
  dateLabel.appendChild(dateSelect);
  filterBar.appendChild(dateLabel);

  /* Sort dropdown */
  var sortLabel = document.createElement('label');
  sortLabel.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-left:auto';
  sortLabel.textContent = 'Sort:';
  var sortSelect = document.createElement('select');
  sortSelect.className = 'form-control';
  sortSelect.style.cssText = 'font-size:12px;padding:4px 8px;width:auto;min-width:120px';
  [{ value: 'recent', label: 'Most Recent' }, { value: 'priority', label: 'Priority First' }, { value: 'patient', label: 'Patient Name' }, { value: 'type', label: 'Message Type' }].forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === _getInboxSortPref()) opt.selected = true;
    sortSelect.appendChild(opt);
  });
  sortSelect.addEventListener('change', function() {
    _setInboxSortPref(sortSelect.value);
    _rebuildMessageList(card, providerId);
  });
  sortLabel.appendChild(sortSelect);
  filterBar.appendChild(sortLabel);

  card.appendChild(filterBar);

  /* Batch action bar */
  var batchBar = document.createElement('div');
  batchBar.id = 'inbox-batch-bar';
  batchBar.style.cssText = 'display:none;padding:8px 16px;border-bottom:1px solid var(--border);background:var(--accent-blue-light);align-items:center;gap:8px';

  var batchLabel = document.createElement('span');
  batchLabel.style.cssText = 'font-size:12px;color:var(--text-secondary)';
  batchLabel.id = 'inbox-batch-count';
  batchLabel.textContent = '0 selected';
  batchBar.appendChild(batchLabel);

  var markReadBtn = document.createElement('button');
  markReadBtn.className = 'btn btn-secondary btn-sm';
  markReadBtn.textContent = 'Mark Selected as Read';
  markReadBtn.addEventListener('click', function() { _batchMarkRead(providerId, card); });
  batchBar.appendChild(markReadBtn);

  var archiveSelBtn = document.createElement('button');
  archiveSelBtn.className = 'btn btn-secondary btn-sm';
  archiveSelBtn.textContent = 'Archive Selected';
  archiveSelBtn.addEventListener('click', function() { _batchArchive(providerId, card); });
  batchBar.appendChild(archiveSelBtn);

  card.appendChild(batchBar);

  /* Thread list container */
  var threadList = document.createElement('div');
  threadList.id = 'inbox-thread-list';
  card.appendChild(threadList);

  /* Archived toggle at bottom */
  var archiveToggle = document.createElement('div');
  archiveToggle.style.cssText = 'padding:10px 16px;border-top:1px solid var(--border);text-align:center';
  var archiveToggleBtn = document.createElement('button');
  archiveToggleBtn.className = 'btn btn-secondary btn-sm';
  archiveToggleBtn.id = 'inbox-archive-toggle';
  archiveToggleBtn.textContent = _msgShowArchived ? 'Hide Archived' : 'Show Archived';
  archiveToggleBtn.addEventListener('click', function() {
    _msgShowArchived = !_msgShowArchived;
    archiveToggleBtn.textContent = _msgShowArchived ? 'Hide Archived' : 'Show Archived';
    _rebuildMessageList(card, providerId);
  });
  archiveToggle.appendChild(archiveToggleBtn);
  card.appendChild(archiveToggle);

  /* Initial render */
  _rebuildMessageList(card, providerId);
}

var _selectedThreadIds = {};

function _rebuildMessageList(card, providerId) {
  var threadList = document.getElementById('inbox-thread-list');
  if (!threadList) return;
  threadList.innerHTML = '';
  _selectedThreadIds = {};
  _updateBatchBar();

  var allThreads = _getMessageThreads();

  /* Apply filters */
  var threads = allThreads.filter(function(t) {
    /* Archive filter */
    if (_isThreadArchived(t) && !_msgShowArchived) return false;
    if (!_isThreadArchived(t) && _msgShowArchived) {
      /* Show non-archived always when "show archived" is on; archived shown below */
    }

    /* Type filter */
    if (_msgFilterType !== 'all' && t.type !== _msgFilterType) return false;

    /* Status filter */
    if (_msgFilterStatus === 'unread' && t.unreadCount === 0) return false;
    if (_msgFilterStatus === 'read' && t.unreadCount > 0) return false;

    /* Date range filter */
    if (_msgFilterDateRange !== 'all') {
      var now = new Date();
      var msgDate = new Date(t.lastTime);
      if (_msgFilterDateRange === 'today') {
        if (msgDate.toDateString() !== now.toDateString()) return false;
      } else if (_msgFilterDateRange === 'week') {
        var weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (msgDate < weekAgo) return false;
      } else if (_msgFilterDateRange === 'month') {
        var monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (msgDate < monthAgo) return false;
      }
    }
    return true;
  });

  /* Split active and archived */
  var activeThreads = threads.filter(function(t) { return !_isThreadArchived(t); });
  var archivedThreads = threads.filter(function(t) { return _isThreadArchived(t); });

  /* Apply sort */
  var sortPref = _getInboxSortPref();
  activeThreads = _sortThreads(activeThreads, sortPref);

  if (activeThreads.length === 0 && archivedThreads.length === 0) {
    threadList.appendChild(buildEmptyState('', 'No messages', 'Send a message to a patient to get started.'));
    return;
  }

  /* Render active threads */
  activeThreads.forEach(function(thread) {
    threadList.appendChild(_buildThreadItem(thread, providerId, false));
  });

  /* Render archived section */
  if (_msgShowArchived && archivedThreads.length > 0) {
    var archiveHeader = document.createElement('div');
    archiveHeader.style.cssText = 'padding:10px 16px;font-size:12px;font-weight:600;color:var(--text-muted);border-top:2px solid var(--border);background:var(--bg-surface)';
    archiveHeader.textContent = 'Archived (' + archivedThreads.length + ')';
    threadList.appendChild(archiveHeader);

    archivedThreads.forEach(function(thread) {
      threadList.appendChild(_buildThreadItem(thread, providerId, true));
    });
  }
}

function _buildThreadItem(thread, providerId, isArchived) {
  var patient = getPatient(thread.patientId);
  var item = document.createElement('div');
  item.className = 'message-thread-item' + (thread.unreadCount > 0 ? ' unread' : '') + (isArchived ? ' archived' : '');
  if (isArchived) {
    item.style.opacity = '0.65';
  }

  /* Checkbox for batch actions */
  var checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.cssText = 'flex-shrink:0;cursor:pointer;width:16px;height:16px';
  checkbox.addEventListener('click', function(e) { e.stopPropagation(); });
  checkbox.addEventListener('change', function() {
    if (checkbox.checked) {
      _selectedThreadIds[thread.threadId] = true;
    } else {
      delete _selectedThreadIds[thread.threadId];
    }
    _updateBatchBar();
  });
  item.appendChild(checkbox);

  /* Patient avatar */
  item.appendChild(_buildPatientAvatar(patient));

  /* Unread indicator */
  var indicator = document.createElement('div');
  indicator.className = 'message-unread-dot';
  if (thread.unreadCount > 0) {
    indicator.style.cssText = 'width:8px;height:8px;border-radius:50%;background:var(--accent-blue);flex-shrink:0';
  } else {
    indicator.style.cssText = 'width:8px;height:8px;flex-shrink:0';
  }
  item.appendChild(indicator);

  var bodyWrap = document.createElement('div');
  bodyWrap.style.cssText = 'flex:1;min-width:0';

  /* Top row: patient name + type badge + priority + time */
  var topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:2px';

  var patName = document.createElement('div');
  patName.className = 'message-thread-patient';
  if (patient) { patName.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); }
  else { patName.textContent = 'Unknown'; }

  var typeBadge = document.createElement('span');
  typeBadge.className = 'message-type-badge ' + _getMessageTypeBadgeClass(thread.type);
  typeBadge.textContent = _getMessageTypeLabel(thread.type);

  topRow.appendChild(patName);
  topRow.appendChild(typeBadge);

  if (thread.priority === 'Urgent') {
    var urgentBadge = document.createElement('span');
    urgentBadge.className = 'message-priority-urgent';
    urgentBadge.textContent = 'Urgent';
    topRow.appendChild(urgentBadge);
  }

  bodyWrap.appendChild(topRow);

  /* Subject */
  var subjEl = document.createElement('div');
  subjEl.className = 'message-thread-subject';
  subjEl.textContent = thread.subject;
  bodyWrap.appendChild(subjEl);

  /* Preview */
  var preview = document.createElement('div');
  preview.className = 'message-thread-preview';
  var previewText = thread.lastMessage || '';
  preview.textContent = thread.lastSender + ': ' + (previewText.length > 80 ? previewText.substring(0, 80) + '...' : previewText);
  bodyWrap.appendChild(preview);

  item.appendChild(bodyWrap);

  /* Right side: time + count + action buttons */
  var rightCol = document.createElement('div');
  rightCol.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0';

  var timeEl = document.createElement('div');
  timeEl.className = 'message-thread-time';
  timeEl.textContent = _formatMessageTime(thread.lastTime);
  rightCol.appendChild(timeEl);

  if (thread.unreadCount > 0) {
    var countBadge = document.createElement('span');
    countBadge.className = 'message-unread-badge';
    countBadge.textContent = thread.unreadCount;
    rightCol.appendChild(countBadge);
  }

  /* Action row: Quick Reply + Archive / Unarchive */
  var actionRow = document.createElement('div');
  actionRow.style.cssText = 'display:flex;gap:4px;margin-top:4px';

  if (!isArchived) {
    var quickReplyBtn = document.createElement('button');
    quickReplyBtn.className = 'btn btn-secondary btn-sm';
    quickReplyBtn.style.cssText = 'font-size:11px;padding:2px 8px';
    quickReplyBtn.textContent = 'Quick Reply';
    quickReplyBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _toggleInlineReply(item, thread, providerId);
    });
    actionRow.appendChild(quickReplyBtn);

    var archiveBtn = document.createElement('button');
    archiveBtn.className = 'btn btn-secondary btn-sm';
    archiveBtn.style.cssText = 'font-size:11px;padding:2px 8px';
    archiveBtn.textContent = 'Archive';
    archiveBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _archiveThread(thread.threadId);
    });
    actionRow.appendChild(archiveBtn);
  } else {
    var unarchiveBtn = document.createElement('button');
    unarchiveBtn.className = 'btn btn-secondary btn-sm';
    unarchiveBtn.style.cssText = 'font-size:11px;padding:2px 8px';
    unarchiveBtn.textContent = 'Restore';
    unarchiveBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _unarchiveThread(thread.threadId);
    });
    actionRow.appendChild(unarchiveBtn);
  }

  rightCol.appendChild(actionRow);
  item.appendChild(rightCol);

  item.addEventListener('click', function() {
    openMessageThreadModal(thread.threadId);
  });

  return item;
}

function _updateBatchBar() {
  var bar = document.getElementById('inbox-batch-bar');
  var label = document.getElementById('inbox-batch-count');
  if (!bar || !label) return;
  var count = Object.keys(_selectedThreadIds).length;
  if (count > 0) {
    bar.style.display = 'flex';
    label.textContent = count + ' selected';
  } else {
    bar.style.display = 'none';
    label.textContent = '0 selected';
  }
}

function _batchMarkRead(providerId, card) {
  var ids = Object.keys(_selectedThreadIds);
  if (ids.length === 0) { showToast('No threads selected.', 'warning'); return; }
  var count = 0;
  ids.forEach(function(tid) {
    var msgs = getMessageThread(tid);
    msgs.forEach(function(m) {
      if (m.toId === providerId && m.status === 'Sent') {
        markMessageRead(m.id);
        count++;
      }
    });
  });
  showToast(count + ' message' + (count !== 1 ? 's' : '') + ' marked as read.', 'success');
  updateSidebarBadges();
  _rebuildMessageList(card, providerId);
}

function _batchArchive(providerId, card) {
  var ids = Object.keys(_selectedThreadIds);
  if (ids.length === 0) { showToast('No threads selected.', 'warning'); return; }
  ids.forEach(function(tid) {
    var msgs = getMessageThread(tid);
    msgs.forEach(function(m) {
      saveMessage({
        id: m.id,
        archivedAt: new Date().toISOString(),
        archivedBy: providerId,
      });
    });
  });
  showToast(ids.length + ' thread' + (ids.length !== 1 ? 's' : '') + ' archived.', 'success');
  _selectedThreadIds = {};
  _rebuildMessageList(card, providerId);
}

/* ============================================================
   2. Quick Reply from Inbox (inline)
   ============================================================ */

function _toggleInlineReply(itemEl, thread, providerId) {
  /* If already open, close */
  var existing = itemEl.querySelector('.inline-reply-box');
  if (existing) {
    existing.remove();
    return;
  }

  var user = getSessionUser();
  if (!user) return;
  var provider = getProvider(providerId);
  var providerName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);
  var patient = getPatient(thread.patientId);
  var toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

  var box = document.createElement('div');
  box.className = 'inline-reply-box';
  box.style.cssText = 'margin-top:8px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface)';
  box.addEventListener('click', function(e) { e.stopPropagation(); });

  var label = document.createElement('div');
  label.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600';
  label.textContent = 'Re: ' + (thread.subject || '') + ' — ' + toName;
  box.appendChild(label);

  var textarea = document.createElement('textarea');
  textarea.className = 'form-control';
  textarea.rows = 2;
  textarea.placeholder = 'Type your reply...';
  textarea.style.cssText = 'font-size:12px;margin-bottom:6px';
  box.appendChild(textarea);

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:6px;justify-content:flex-end';

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary btn-sm';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    box.remove();
  });
  btnRow.appendChild(cancelBtn);

  var sendBtn = document.createElement('button');
  sendBtn.className = 'btn btn-primary btn-sm';
  sendBtn.textContent = 'Send';
  sendBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var body = textarea.value.trim();
    if (!body) { showToast('Please enter a reply.', 'error'); return; }

    saveMessage({
      threadId:  thread.threadId,
      type:      thread.type,
      fromType:  'provider',
      fromId:    providerId,
      fromName:  providerName,
      toType:    'patient',
      toId:      thread.patientId,
      toName:    toName,
      patientId: thread.patientId,
      subject:   thread.subject,
      body:      body,
      priority:  thread.priority,
      status:    'Sent',
    });

    box.remove();
    showToast('Reply sent.', 'success');
    updateSidebarBadges();
    renderInbox();
  });
  btnRow.appendChild(sendBtn);

  box.appendChild(btnRow);

  /* Insert after the item's bodyWrap (before the right column) */
  itemEl.appendChild(box);
  textarea.focus();
}

/* ============================================================
   Compose Message Modal (unchanged from original)
   ============================================================ */

function openComposeMessageModal(replyThreadId, replyPatientId) {
  var user = getSessionUser();
  if (!user) return;
  var providerId = getCurrentProvider() || user.id;
  var provider = getProvider(providerId);
  var providerName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);

  var isReply = !!replyThreadId;
  var replyThread = [];
  var replyPatient = null;
  if (isReply) {
    replyThread = getMessageThread(replyThreadId);
    if (replyPatientId) replyPatient = getPatient(replyPatientId);
  }

  var patients = getPatients().sort(function(a, b) {
    return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName);
  });

  var patientOptionsHTML = '<option value="">-- Select Patient --</option>';
  patients.forEach(function(p) {
    var sel = (replyPatientId && p.id === replyPatientId) ? ' selected' : '';
    patientOptionsHTML += '<option value="' + esc(p.id) + '"' + sel + '>' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });

  var bodyHTML = '<div class="message-compose">' +
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
    var patientId = isReply ? replyPatientId : document.getElementById('msg-patient').value;
    var msgType   = document.getElementById('msg-type').value;
    var subject   = document.getElementById('msg-subject').value.trim();
    var priority  = document.getElementById('msg-priority').value;
    var body      = document.getElementById('msg-body').value.trim();

    if (!patientId) { showToast('Please select a patient.', 'error'); return; }
    if (!subject)   { showToast('Please enter a subject.', 'error'); return; }
    if (!body)      { showToast('Please enter a message.', 'error'); return; }

    var patient = getPatient(patientId);
    var toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

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

/* ============================================================
   3. Message Thread Modal Enhancement
      - Patient context header (name, MRN, DOB, allergies)
      - Message delivery status (Sent -> Delivered -> Read)
      - Forward to Provider button
      - Add to Chart button
   ============================================================ */

function openMessageThreadModal(threadId) {
  var user = getSessionUser();
  if (!user) return;
  var providerId = getCurrentProvider() || user.id;

  var msgs = getMessageThread(threadId);
  if (msgs.length === 0) return;

  var patientId = msgs[0].patientId;
  var patient = getPatient(patientId);
  var patName = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';

  /* Mark unread messages as read */
  var markedAny = false;
  msgs.forEach(function(m) {
    if (m.toId === providerId && m.status === 'Sent') {
      markMessageRead(m.id);
      markedAny = true;
    }
  });
  if (markedAny) updateSidebarBadges();

  /* Reload after marking read */
  var freshMsgs = getMessageThread(threadId);

  /* --- Patient context header --- */
  var patientContextHTML = '';
  if (patient) {
    var allergies = [];
    try { allergies = getPatientAllergies(patient.id); } catch(e) { /* */ }
    var allergyText = allergies.length > 0
      ? allergies.map(function(a) { return esc(a.allergen || a.name || 'Unknown'); }).join(', ')
      : 'NKDA';
    patientContextHTML =
      '<div style="padding:10px 12px;margin-bottom:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
          '<div id="msg-thread-avatar-container"></div>' +
          '<div>' +
            '<div style="font-weight:600;font-size:14px" id="msg-thread-patient-name"></div>' +
            '<div style="font-size:12px;color:var(--text-muted)">' +
              'MRN: ' + esc(patient.mrn || 'N/A') + ' &nbsp;|&nbsp; DOB: ' + esc(patient.dob || 'N/A') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--text-secondary);margin-top:4px">' +
          '<strong>Allergies:</strong> ' + allergyText +
        '</div>' +
      '</div>';
  } else {
    patientContextHTML =
      '<div style="margin-bottom:12px">' +
        '<strong>Patient:</strong> <span id="msg-thread-patient-name">Unknown</span>' +
      '</div>';
  }

  /* --- Type badge --- */
  var typeBadgeHTML = '<span class="message-type-badge ' + _getMessageTypeBadgeClass(freshMsgs[0].type) + '">' + esc(_getMessageTypeLabel(freshMsgs[0].type)) + '</span>';

  /* --- Thread HTML --- */
  var threadHTML = patientContextHTML;
  threadHTML += '<div style="margin-bottom:12px">' + typeBadgeHTML + '</div>';

  threadHTML += '<div class="message-thread-view" id="msg-thread-list">';
  freshMsgs.forEach(function(m) {
    var isSent = m.fromId === providerId;
    /* Delivery status */
    var statusHTML = '';
    if (isSent) {
      if (m.readAt) {
        statusHTML = '<div style="font-size:10px;color:var(--text-muted);margin-top:4px">Sent \u2192 Delivered \u2192 Read ' + esc(_formatMessageTime(m.readAt)) + '</div>';
      } else if (m.status === 'Sent') {
        statusHTML = '<div style="font-size:10px;color:var(--text-muted);margin-top:4px">Sent \u2192 Delivered</div>';
      }
    } else {
      if (m.status === 'Read' && m.readAt) {
        statusHTML = '<div style="font-size:10px;color:var(--text-muted);margin-top:4px">Read ' + esc(_formatMessageTime(m.readAt)) + '</div>';
      }
    }

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
    threadHTML += statusHTML;
    threadHTML += '</div>';
  });
  threadHTML += '</div>';

  /* Reply area */
  threadHTML += '<div style="margin-top:12px">' +
    '<label class="form-label">Reply</label>' +
    '<textarea class="form-control" id="msg-reply-body" rows="3" placeholder="Type your reply..."></textarea>' +
  '</div>';

  /* Footer with extra buttons */
  var footerHTML =
    '<div style="display:flex;gap:8px;width:100%;justify-content:space-between;flex-wrap:wrap">' +
      '<div style="display:flex;gap:6px">' +
        '<button class="btn btn-secondary btn-sm" id="msg-thread-forward">Forward to Provider</button>' +
        '<button class="btn btn-secondary btn-sm" id="msg-thread-add-to-chart">Add to Chart</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button class="btn btn-secondary" id="msg-thread-close">Close</button>' +
        '<button class="btn btn-primary" id="msg-thread-reply">Send Reply</button>' +
      '</div>' +
    '</div>';

  openModal({
    title: freshMsgs[0].subject,
    bodyHTML: threadHTML,
    footerHTML: footerHTML,
    size: 'lg',
    onClose: function() {
      if (_inboxTab === 'messages') renderInbox();
    },
  });

  /* Insert avatar into patient context */
  var avatarContainer = document.getElementById('msg-thread-avatar-container');
  if (avatarContainer && patient) {
    avatarContainer.appendChild(_buildPatientAvatar(patient));
  }

  var patNameEl = document.getElementById('msg-thread-patient-name');
  if (patNameEl) patNameEl.textContent = patName;

  /* Scroll thread to bottom */
  var listEl = document.getElementById('msg-thread-list');
  if (listEl) listEl.scrollTop = listEl.scrollHeight;

  /* Close */
  document.getElementById('msg-thread-close').addEventListener('click', closeModal);

  /* Send Reply */
  document.getElementById('msg-thread-reply').addEventListener('click', function() {
    var replyBody = document.getElementById('msg-reply-body').value.trim();
    if (!replyBody) { showToast('Please enter a reply.', 'error'); return; }

    var provider = getProvider(providerId);
    var provName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);
    var toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

    saveMessage({
      threadId:  threadId,
      type:      freshMsgs[0].type,
      fromType:  'provider',
      fromId:    providerId,
      fromName:  provName,
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
    openMessageThreadModal(threadId);
  });

  /* Forward to Provider */
  document.getElementById('msg-thread-forward').addEventListener('click', function() {
    _openForwardModal(threadId, freshMsgs, patientId, providerId);
  });

  /* Add to Chart */
  document.getElementById('msg-thread-add-to-chart').addEventListener('click', function() {
    _addThreadToChart(threadId, freshMsgs, patientId, providerId);
  });
}

/* ---------- Forward to Provider ---------- */

function _openForwardModal(threadId, msgs, patientId, fromProviderId) {
  var user = getSessionUser();
  if (!user) return;
  var provider = getProvider(fromProviderId);
  var fromName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);

  var providers = [];
  try { providers = getProviders(); } catch(e) { /* */ }

  var provOptionsHTML = '<option value="">-- Select Provider --</option>';
  providers.forEach(function(p) {
    if (p.id === fromProviderId) return;
    provOptionsHTML += '<option value="' + esc(p.id) + '">' + esc(p.lastName + ', ' + p.firstName) + (p.degree ? ' (' + esc(p.degree) + ')' : '') + '</option>';
  });

  /* Build context summary */
  var contextLines = msgs.map(function(m) {
    return m.fromName + ' (' + _formatMessageTime(m.createdAt) + '): ' + m.body;
  }).join('\n---\n');

  var bodyHTML =
    '<div class="form-group">' +
      '<label class="form-label">Forward to Provider</label>' +
      '<select class="form-control" id="fwd-provider">' + provOptionsHTML + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Additional Note (optional)</label>' +
      '<textarea class="form-control" id="fwd-note" rows="3" placeholder="Add context for the receiving provider..."></textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Thread Context</label>' +
      '<div style="max-height:150px;overflow-y:auto;padding:8px;background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;font-size:12px;white-space:pre-wrap;color:var(--text-secondary)">' + esc(contextLines) + '</div>' +
    '</div>';

  openModal({
    title: 'Forward Thread',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" id="fwd-cancel">Cancel</button><button class="btn btn-primary" id="fwd-send">Forward</button>',
    size: 'lg',
  });

  document.getElementById('fwd-cancel').addEventListener('click', closeModal);
  document.getElementById('fwd-send').addEventListener('click', function() {
    var toProvId = document.getElementById('fwd-provider').value;
    if (!toProvId) { showToast('Please select a provider.', 'error'); return; }

    var toProv = getProvider(toProvId);
    var toName = toProv ? toProv.firstName + ' ' + toProv.lastName : 'Provider';
    var note = (document.getElementById('fwd-note').value || '').trim();

    var fwdBody = 'Forwarded message thread from ' + fromName + ':\n\n' + contextLines;
    if (note) fwdBody = note + '\n\n---\n' + fwdBody;

    saveMessage({
      threadId:  '',
      type:      msgs[0].type,
      fromType:  'provider',
      fromId:    fromProviderId,
      fromName:  fromName,
      toType:    'provider',
      toId:      toProvId,
      toName:    toName,
      patientId: patientId,
      subject:   'Fwd: ' + (msgs[0].subject || ''),
      body:      fwdBody,
      priority:  msgs[0].priority,
      status:    'Sent',
    });

    closeModal();
    showToast('Thread forwarded to ' + toName + '.', 'success');
    updateSidebarBadges();
  });
}

/* ---------- Add to Chart ---------- */

function _addThreadToChart(threadId, msgs, patientId, providerId) {
  if (!patientId) { showToast('No patient associated with this thread.', 'error'); return; }
  var patient = getPatient(patientId);
  if (!patient) { showToast('Patient not found.', 'error'); return; }

  var user = getSessionUser();
  if (!user) return;
  var provider = getProvider(providerId);
  var provName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);

  /* Build communication note text */
  var noteText = 'Communication Note - Message Thread\n';
  noteText += 'Subject: ' + (msgs[0].subject || 'N/A') + '\n';
  noteText += 'Date: ' + formatDateTime(new Date().toISOString()) + '\n';
  noteText += 'Documented by: ' + provName + '\n';
  noteText += '---\n';
  msgs.forEach(function(m) {
    noteText += m.fromName + ' (' + formatDateTime(m.createdAt) + '):\n' + m.body + '\n\n';
  });

  /* Save as a document on the patient chart */
  try {
    var allDocs = loadAll(KEYS.documents, true);
    var doc = {
      id: generateId(),
      patientId: patientId,
      title: 'Communication Note: ' + (msgs[0].subject || 'Message Thread'),
      type: 'Communication',
      category: 'Notes',
      content: noteText,
      createdAt: new Date().toISOString(),
      createdBy: providerId,
      createdByName: provName,
    };
    allDocs.push(doc);
    saveAll(KEYS.documents, allDocs);
    showToast('Thread added to patient chart as a communication note.', 'success');
  } catch(e) {
    showToast('Failed to add to chart: ' + e.message, 'error');
  }
}

/* ============================================================
   4. Notification Center
   ============================================================ */

function buildNotificationCenter(card) {
  var user = getSessionUser();
  if (!user) return;
  var providerId = getCurrentProvider() || user.id;

  var header = document.createElement('div');
  header.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;color:var(--text-secondary)';
  header.textContent = 'Notification Center';
  card.appendChild(header);

  var notifications = _gatherNotifications(providerId);

  if (notifications.length === 0) {
    card.appendChild(buildEmptyState('', 'All clear', 'No actionable items right now.'));
    return;
  }

  /* Sort: critical first, then urgent, then by date */
  notifications.sort(function(a, b) {
    var priorityOrder = { critical: 0, urgent: 1, normal: 2, info: 3 };
    var pa = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 3;
    var pb = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.time) - new Date(a.time);
  });

  /* Dismissed tracking */
  var dismissed = _getDismissedNotifications();

  notifications.forEach(function(notif) {
    if (dismissed[notif.id]) return;

    var item = document.createElement('div');
    item.className = 'inbox-notif-item';
    item.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s';
    item.addEventListener('mouseenter', function() { item.style.background = 'var(--accent-blue-light)'; });
    item.addEventListener('mouseleave', function() { item.style.background = ''; });

    /* Icon */
    var iconEl = document.createElement('div');
    iconEl.style.cssText = 'width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px';
    switch (notif.type) {
      case 'unsigned_note':
        iconEl.textContent = '\u270E';
        iconEl.style.background = 'var(--warning-light, #fef3c7)';
        iconEl.style.color = 'var(--warning, #b45309)';
        break;
      case 'pending_order':
        iconEl.textContent = '\uD83D\uDCCB';
        iconEl.style.background = '#e0f2fe';
        iconEl.style.color = '#0369a1';
        break;
      case 'unread_message':
        iconEl.textContent = '\u2709';
        iconEl.style.background = '#dbeafe';
        iconEl.style.color = '#1d4ed8';
        break;
      case 'critical_lab':
        iconEl.textContent = '\u26A0';
        iconEl.style.background = '#fee2e2';
        iconEl.style.color = '#dc2626';
        break;
      case 'overdue_screening':
        iconEl.textContent = '\u23F0';
        iconEl.style.background = '#fef3c7';
        iconEl.style.color = '#b45309';
        break;
      case 'pending_refill':
        iconEl.textContent = '\uD83D\uDC8A';
        iconEl.style.background = '#ede9fe';
        iconEl.style.color = '#7c3aed';
        break;
      default:
        iconEl.textContent = '\u2139';
        iconEl.style.background = '#e0f2fe';
        iconEl.style.color = '#0369a1';
    }
    item.appendChild(iconEl);

    /* Body */
    var bodyEl = document.createElement('div');
    bodyEl.style.cssText = 'flex:1;min-width:0';

    var titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:13px;font-weight:600;color:var(--text-primary)';
    titleEl.textContent = notif.title;
    bodyEl.appendChild(titleEl);

    var descEl = document.createElement('div');
    descEl.style.cssText = 'font-size:12px;color:var(--text-muted);margin-top:2px';
    descEl.textContent = notif.description;
    bodyEl.appendChild(descEl);

    var timeEl = document.createElement('div');
    timeEl.style.cssText = 'font-size:10px;color:var(--text-muted);margin-top:2px';
    timeEl.textContent = _formatMessageTime(notif.time);
    bodyEl.appendChild(timeEl);

    item.appendChild(bodyEl);

    /* Action area */
    var actionArea = document.createElement('div');
    actionArea.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex-shrink:0';

    var actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-primary btn-sm';
    actionBtn.style.cssText = 'font-size:11px;padding:3px 10px';
    actionBtn.textContent = notif.actionLabel || 'View';
    actionBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (notif.action) notif.action();
    });
    actionArea.appendChild(actionBtn);

    /* Dismiss for non-critical items */
    if (notif.priority !== 'critical') {
      var dismissBtn = document.createElement('button');
      dismissBtn.className = 'btn btn-secondary btn-sm';
      dismissBtn.style.cssText = 'font-size:10px;padding:2px 8px';
      dismissBtn.textContent = 'Dismiss';
      dismissBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        _dismissNotification(notif.id);
        item.style.transition = 'opacity .3s';
        item.style.opacity = '0';
        setTimeout(function() { item.remove(); }, 300);
      });
      actionArea.appendChild(dismissBtn);
    }

    item.appendChild(actionArea);

    /* Click on row goes to action */
    item.addEventListener('click', function() {
      if (notif.action) notif.action();
    });

    card.appendChild(item);
  });
}

function _gatherNotifications(providerId) {
  var notifs = [];

  /* Unsigned notes */
  var unsignedNotes = getFilteredNotesInbox();
  unsignedNotes.forEach(function(note) {
    var enc = getEncounter(note.encounterId);
    var patient = enc ? getPatient(enc.patientId) : null;
    var patLabel = patient ? patient.lastName + ', ' + patient.firstName : 'Unknown';
    notifs.push({
      id: 'note-' + note.encounterId,
      type: 'unsigned_note',
      priority: 'urgent',
      title: 'Unsigned Note',
      description: (note.chiefComplaint || 'Untitled') + ' \u2014 ' + patLabel,
      time: note.lastModified || note.createdAt || '',
      actionLabel: 'Open Note',
      action: function() { navigate('#encounter/' + note.encounterId); },
    });
  });

  /* Pending orders */
  var pendingOrders = getFilteredOrdersInbox();
  pendingOrders.forEach(function(order) {
    var patient = getPatient(order.patientId);
    var patLabel = patient ? patient.lastName + ', ' + patient.firstName : 'Unknown';
    notifs.push({
      id: 'order-' + order.id,
      type: 'pending_order',
      priority: order.priority === 'Urgent' || order.priority === 'STAT' ? 'urgent' : 'normal',
      title: 'Pending Order',
      description: order.type + ': ' + (order.detail.drug || order.detail.panel || order.detail.modality || order.detail.service || 'Order') + ' \u2014 ' + patLabel,
      time: order.dateTime || '',
      actionLabel: 'View Order',
      action: function() { navigate('#orders/' + order.encounterId); },
    });
  });

  /* Unread messages */
  var threads = _getMessageThreads();
  threads.forEach(function(t) {
    if (t.unreadCount === 0) return;
    if (_isThreadArchived(t)) return;
    var patient = getPatient(t.patientId);
    var patLabel = patient ? patient.lastName + ', ' + patient.firstName : 'Unknown';
    notifs.push({
      id: 'msg-' + t.threadId,
      type: 'unread_message',
      priority: t.priority === 'Urgent' ? 'urgent' : 'normal',
      title: 'Unread Message',
      description: t.subject + ' \u2014 ' + patLabel + ' (' + t.unreadCount + ' unread)',
      time: t.lastTime || '',
      actionLabel: 'Read',
      action: function() { openMessageThreadModal(t.threadId); },
    });
  });

  /* Critical labs */
  var labs = getFilteredLabsInbox();
  labs.forEach(function(lab) {
    var flags = (lab.tests || []).filter(function(t) { return t.flag && t.flag !== 'Normal'; });
    if (flags.length === 0) return;
    var patient = getPatient(lab.patientId);
    var patLabel = patient ? patient.lastName + ', ' + patient.firstName : 'Unknown';
    notifs.push({
      id: 'lab-' + lab.id,
      type: 'critical_lab',
      priority: 'critical',
      title: 'Critical Lab Result',
      description: lab.panel + ' \u2014 ' + flags.length + ' abnormal \u2014 ' + patLabel,
      time: lab.resultDate || '',
      actionLabel: 'Review',
      action: function() { openLabReviewModal(lab.id); },
    });
  });

  /* Pending refills */
  var refills = getFilteredRefillsInbox();
  refills.forEach(function(order) {
    var patient = getPatient(order.patientId);
    var patLabel = patient ? patient.lastName + ', ' + patient.firstName : 'Unknown';
    notifs.push({
      id: 'refill-' + order.id,
      type: 'pending_refill',
      priority: order.priority === 'Urgent' ? 'urgent' : 'normal',
      title: 'Pending Refill',
      description: (order.detail.drug || 'Medication') + ' \u2014 ' + patLabel,
      time: order.dateTime || '',
      actionLabel: 'View',
      action: function() { navigate('#orders/' + order.encounterId); },
    });
  });

  /* Overdue screenings (aggregate across patients - check a limited set) */
  try {
    var patients = getPatients();
    /* Limit to avoid performance issues */
    var checkLimit = Math.min(patients.length, 50);
    for (var i = 0; i < checkLimit; i++) {
      var pat = patients[i];
      var screenings = [];
      try { screenings = getScreeningRecords(pat.id); } catch(e) { break; }
      screenings.forEach(function(s) {
        if (!s.dueDate) return;
        var due = new Date(s.dueDate);
        if (due < new Date() && s.status !== 'Completed') {
          notifs.push({
            id: 'screening-' + s.id,
            type: 'overdue_screening',
            priority: 'normal',
            title: 'Overdue Screening',
            description: (s.name || s.type || 'Screening') + ' \u2014 ' + pat.lastName + ', ' + pat.firstName,
            time: s.dueDate,
            actionLabel: 'View Chart',
            action: function() { navigate('#chart/' + pat.id); },
          });
        }
      });
    }
  } catch(e) { /* screenings not available */ }

  return notifs;
}

/* Dismissed notifications storage */

function _getDismissedNotifications() {
  try {
    var raw = localStorage.getItem('emr_dismissed_notifs');
    return raw ? JSON.parse(raw) : {};
  } catch(e) {
    return {};
  }
}

function _dismissNotification(id) {
  var dismissed = _getDismissedNotifications();
  dismissed[id] = new Date().toISOString();
  localStorage.setItem('emr_dismissed_notifs', JSON.stringify(dismissed));
}

/* Clear stale dismissed entries (older than 24 hours) periodically */
function _cleanDismissedNotifications() {
  var dismissed = _getDismissedNotifications();
  var now = new Date();
  var changed = false;
  Object.keys(dismissed).forEach(function(k) {
    var dismissedAt = new Date(dismissed[k]);
    if (now - dismissedAt > 86400000) {
      delete dismissed[k];
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem('emr_dismissed_notifs', JSON.stringify(dismissed));
  }
}

/* Run cleanup on load */
_cleanDismissedNotifications();
