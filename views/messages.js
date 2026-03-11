/* ============================================================
   views/messages.js — Separate Messaging Tool
   Template responses + auto-populated doctor signature
   Enhanced: categories, smart compose, scheduled send,
   thread display, priority escalation, rich compose, stats
   ============================================================ */

/* ---------- Template Categories & Templates ---------- */
var MESSAGE_TEMPLATE_CATEGORIES = [
  { id: 'results',        label: 'Results' },
  { id: 'medications',    label: 'Medications' },
  { id: 'appointments',   label: 'Appointments' },
  { id: 'procedures',     label: 'Procedures' },
  { id: 'referrals',      label: 'Referrals' },
  { id: 'preventive',     label: 'Preventive Care' },
  { id: 'administrative', label: 'Administrative' },
];

var MESSAGE_TEMPLATES = [
  /* --- Results --- */
  { name: 'Lab Results Normal', category: 'results', type: 'lab_result', subject: 'Your Lab Results', body: 'Dear [Patient Name],\n\nYour recent lab results have been reviewed and are within normal limits. No action is needed at this time. Please continue your current medications and follow up as scheduled.\n\nIf you have any questions, do not hesitate to reach out.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Abnormal Lab Results', category: 'results', type: 'lab_result', subject: 'Important Lab Results', body: 'Dear [Patient Name],\n\nWe have received the results of your recent lab work and would like to discuss them with you.\n\nTest: [Test Name]\nYour Value: [Value]\nReference Range: [Reference Range]\n\nNext Steps: [Next Steps]\n\nPlease contact our office at your earliest convenience to discuss these results and any recommended changes to your treatment plan.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Test Results Pending', category: 'results', type: 'lab_result', subject: 'Test Results Update', body: 'Dear [Patient Name],\n\nWe wanted to let you know that some of your test results are still pending. We expect results within the next few business days and will contact you once they are available. No action is needed on your part at this time.\n\nBest regards,\n[Provider Name]\n[Date]' },

  /* --- Medications --- */
  { name: 'Rx Refill Approved', category: 'medications', type: 'rx_notification', subject: 'Prescription Refill Approved', body: 'Dear [Patient Name],\n\nYour prescription refill request has been approved and sent to your pharmacy. Please allow 24-48 hours for processing. Contact your pharmacy if you have not received it within that time.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Medication Change', category: 'medications', type: 'rx_notification', subject: 'Update to Your Medications', body: 'Dear [Patient Name],\n\nWe are writing to inform you of a change to your medication regimen.\n\nMedication Changed: [Medication Name]\nNew Instructions: [New Instructions]\n\nPlease be aware of the following potential side effects to watch for:\n- [Side Effect 1]\n- [Side Effect 2]\n- [Side Effect 3]\n\nIf you experience any of these or other concerning symptoms, please contact our office immediately.\n\nBest regards,\n[Provider Name]\n[Date]' },

  /* --- Appointments --- */
  { name: 'Appointment Reminder', category: 'appointments', type: 'appointment', subject: 'Upcoming Appointment Reminder', body: 'Dear [Patient Name],\n\nThis is a reminder about your upcoming appointment. Please arrive 15 minutes early and bring your current medication list and insurance card. If you need to reschedule, please contact our office.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Pre-Visit Instructions', category: 'appointments', type: 'appointment', subject: 'Preparing for Your Visit', body: 'Dear [Patient Name],\n\nPlease review the following instructions to prepare for your upcoming visit:\n\nFasting Instructions: [Fasting Instructions - e.g., Do not eat or drink anything except water for 12 hours before your appointment]\n\nWhat to Bring:\n- Photo ID and insurance card\n- Current medication list\n- Any recent lab results or imaging reports\n- List of questions or concerns\n\nPlease plan to arrive at [Arrival Time] to allow time for check-in and paperwork.\n\nIf you have any questions before your visit, please do not hesitate to contact us.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Follow-Up Instructions', category: 'appointments', type: 'appointment', subject: 'Follow-Up Care Instructions', body: 'Dear [Patient Name],\n\nThank you for your recent visit. Please follow the care instructions discussed during your appointment. If your symptoms worsen or you develop new concerns, please contact our office or go to the nearest emergency room.\n\nBest regards,\n[Provider Name]\n[Date]' },

  /* --- Procedures --- */
  { name: 'Post-Procedure Instructions', category: 'procedures', type: 'general', subject: 'After Your Procedure', body: 'Dear [Patient Name],\n\nThank you for coming in for your procedure. Please follow these post-procedure instructions carefully:\n\nWound Care:\n- [Wound care instructions]\n- Keep the area clean and dry for [duration]\n- Change dressings as instructed\n\nActivity Restrictions:\n- [Activity restrictions - e.g., No heavy lifting for 2 weeks]\n- [Additional restrictions]\n\nMedications:\n- Take pain medication as prescribed\n- Complete any prescribed antibiotics\n\nFollow-Up: Please schedule a follow-up appointment for [Follow-Up Timing - e.g., 7-10 days from now].\n\nSeek immediate medical attention if you experience:\n- Fever over 101.5 F\n- Increasing pain, redness, or swelling\n- Drainage from the procedure site\n- Any other concerning symptoms\n\nBest regards,\n[Provider Name]\n[Date]' },

  /* --- Referrals --- */
  { name: 'Referral Notification', category: 'referrals', type: 'referral', subject: 'Specialist Referral', body: 'Dear [Patient Name],\n\nWe have placed a referral for you to see a specialist.\n\nSpecialist: [Specialist Name]\nReason for Referral: [Reason for Referral]\n\nWhat to Expect:\n- The specialist\'s office should contact you within [timeframe] to schedule an appointment\n- Please bring your insurance card, photo ID, and any relevant medical records\n- You may be asked to complete intake paperwork before your visit\n\nIf you have not heard from the specialist within [timeframe], please contact our office so we can follow up.\n\nBest regards,\n[Provider Name]\n[Date]' },

  /* --- Preventive Care --- */
  { name: 'Chronic Disease Management', category: 'preventive', type: 'general', subject: 'Your Care Plan Update', body: 'Dear [Patient Name],\n\nWe are writing to provide you with an update to your ongoing care plan.\n\nCare Goals:\n- [Goal 1]\n- [Goal 2]\n- [Goal 3]\n\nMedication Adherence: It is important to continue taking all prescribed medications as directed. If you are having difficulty with any of your medications, please let us know so we can discuss alternatives.\n\nNext Appointment: [Next Appointment Date/Time]\n\nPlease continue to monitor your symptoms and keep a log to share at your next visit.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Vaccination Reminder', category: 'preventive', type: 'general', subject: 'Vaccination Due', body: 'Dear [Patient Name],\n\nOur records indicate that you are due for the following vaccination(s):\n\n- [Vaccine Name 1]\n- [Vaccine Name 2]\n\nWhy It Is Important: Staying up to date on vaccinations helps protect you and those around you from preventable illnesses.\n\nTo schedule your vaccination, please contact our office or use the patient portal to book an appointment.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Preventive Screening', category: 'preventive', type: 'general', subject: 'Screening Recommended', body: 'Dear [Patient Name],\n\nBased on your age, health history, and current guidelines, we recommend the following preventive screening:\n\nScreening: [Screening Name]\nWhy It Is Recommended: [Reason - e.g., Recommended for adults over 50 as part of routine preventive care]\n\nTo schedule your screening, please contact our office or call the scheduling number below:\n[Scheduling Phone Number]\n\nEarly detection is key to maintaining your health. Please do not delay this important screening.\n\nBest regards,\n[Provider Name]\n[Date]' },

  /* --- Administrative --- */
  { name: 'Insurance/Prior Auth Update', category: 'administrative', type: 'system', subject: 'Insurance Update', body: 'Dear [Patient Name],\n\nWe are writing to provide you with an update regarding your insurance authorization.\n\nAuthorization Status: [Status - e.g., Approved / Pending / Denied]\nProcedure/Service: [Procedure or Service Name]\n\nNext Steps:\n- [Next steps based on status]\n\nIf you have any questions about your insurance coverage or authorization, please contact our billing department or your insurance company directly.\n\nBest regards,\n[Provider Name]\n[Date]' },
  { name: 'Care Team Introduction', category: 'administrative', type: 'general', subject: 'Welcome to Our Practice', body: 'Dear [Patient Name],\n\nWelcome to our practice! We are delighted to have you as a patient and want to introduce you to our care team.\n\nYour Primary Provider: [Provider Name]\n\nOur Team: Our care team includes physicians, nurses, medical assistants, and support staff who are all dedicated to providing you with the best possible care.\n\nPatient Portal: You can access your medical records, request appointments, and send messages through our patient portal. If you have not yet set up your account, please contact our front desk for assistance.\n\nIn Case of Emergency: For medical emergencies, please call 911. For urgent after-hours concerns, please call our office at [Phone Number] for the on-call provider.\n\nWe look forward to partnering with you in your healthcare journey.\n\nBest regards,\n[Provider Name]\n[Date]' },
];

/* ---------- Draft auto-save key ---------- */
var MSG_DRAFT_KEY = 'emr_message_draft';

/* ---------- Module-level state ---------- */
var _msgDraftTimer = null;
var _msgUrgentFilterOn = false;
var _msgScheduledSectionOpen = false;

/* ============================================================
   renderMessages — Main view entry
   ============================================================ */
function renderMessages() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({
    title: 'Messages',
    meta: '',
    actions: '<button class="btn btn-primary btn-sm" id="btn-new-message">New Message</button>',
  });
  setActiveNav('messages');

  var user = getSessionUser();
  if (!user) return;
  var providerId = getCurrentProvider() || user.id;

  /* ---------- Statistics Dashboard ---------- */
  var statsSection = _buildMessageStats(providerId);
  app.appendChild(statsSection);

  /* ---------- Main card ---------- */
  var card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '16px 20px';

  /* -- Toolbar row: template selector + filters -- */
  var toolbar = document.createElement('div');
  toolbar.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between';

  var leftGroup = document.createElement('div');
  leftGroup.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center';

  /* Category template selector */
  var tmplBtn = document.createElement('button');
  tmplBtn.className = 'btn btn-secondary btn-sm';
  tmplBtn.innerHTML = '&#9776; Templates';
  tmplBtn.addEventListener('click', function() { _openTemplateSelectorModal(); });
  leftGroup.appendChild(tmplBtn);

  /* Mark all as read */
  var markAllBtn = document.createElement('button');
  markAllBtn.className = 'btn btn-secondary btn-sm';
  markAllBtn.textContent = 'Mark All Read';
  markAllBtn.addEventListener('click', function() { _markAllMessagesRead(providerId); });
  leftGroup.appendChild(markAllBtn);

  toolbar.appendChild(leftGroup);

  var rightGroup = document.createElement('div');
  rightGroup.style.cssText = 'display:flex;gap:8px;align-items:center';

  /* Urgent filter toggle */
  var urgentToggle = document.createElement('button');
  urgentToggle.className = 'btn btn-sm ' + (_msgUrgentFilterOn ? 'btn-primary' : 'btn-secondary');
  urgentToggle.innerHTML = '&#128276; Urgent Only';
  urgentToggle.addEventListener('click', function() {
    _msgUrgentFilterOn = !_msgUrgentFilterOn;
    renderMessages();
  });
  rightGroup.appendChild(urgentToggle);

  toolbar.appendChild(rightGroup);
  card.appendChild(toolbar);

  /* ---------- Scheduled Messages Section ---------- */
  var scheduledMsgs = _getScheduledMessages(providerId);
  if (scheduledMsgs.length > 0) {
    var schedSection = _buildScheduledSection(scheduledMsgs);
    card.appendChild(schedSection);
  }

  /* ---------- Thread list ---------- */
  var threads = _getMessageThreads();

  /* Sort: Unread first, then by most recent */
  threads.sort(function(a, b) {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    return new Date(b.lastTime) - new Date(a.lastTime);
  });

  /* Urgent filter */
  if (_msgUrgentFilterOn) {
    threads = threads.filter(function(t) { return t.priority === 'Urgent'; });
  }

  if (threads.length === 0) {
    card.appendChild(buildEmptyState('', 'No messages', _msgUrgentFilterOn ? 'No urgent messages found.' : 'Send a message to a patient to get started.'));
  } else {
    threads.forEach(function(thread) {
      var item = _buildThreadSummaryCard(thread, providerId);
      card.appendChild(item);
    });
  }

  app.appendChild(card);

  /* ---------- Attach new-message handler ---------- */
  document.getElementById('btn-new-message').addEventListener('click', function() { openMessagesComposeModal(); });
}

/* ============================================================
   Message Statistics Dashboard
   ============================================================ */
function _buildMessageStats(providerId) {
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 20px';

  var allMsgs = getMessages();
  var myMsgs = allMsgs.filter(function(m) { return m.fromId === providerId || m.toId === providerId; });

  /* Total messages sent this week */
  var weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  var sentThisWeek = myMsgs.filter(function(m) {
    return m.fromId === providerId && new Date(m.createdAt) >= weekAgo;
  }).length;

  /* Unread count */
  var unreadCount = myMsgs.filter(function(m) {
    return m.toId === providerId && m.status === 'Sent';
  }).length;

  /* Average response time (mock: based on thread timestamps) */
  var avgResponse = _calcAvgResponseTime(myMsgs, providerId);

  /* Messages by type */
  var typeBreakdown = {};
  myMsgs.forEach(function(m) {
    var lbl = _getMessageTypeLabel(m.type || 'general');
    typeBreakdown[lbl] = (typeBreakdown[lbl] || 0) + 1;
  });

  var topType = '';
  var topTypeCount = 0;
  Object.keys(typeBreakdown).forEach(function(k) {
    if (typeBreakdown[k] > topTypeCount) { topType = k; topTypeCount = typeBreakdown[k]; }
  });

  /* Stat cards */
  var stats = [
    { label: 'Sent This Week', value: sentThisWeek, color: '#3182ce' },
    { label: 'Unread', value: unreadCount, color: unreadCount > 0 ? '#e53e3e' : '#38a169' },
    { label: 'Avg Response', value: avgResponse, color: '#805ad5' },
    { label: 'Top Type', value: topType ? topType + ' (' + topTypeCount + ')' : 'N/A', color: '#d69e2e' },
  ];

  stats.forEach(function(s) {
    var c = document.createElement('div');
    c.className = 'card';
    c.style.cssText = 'padding:16px;text-align:center';
    c.innerHTML = '<div style="font-size:24px;font-weight:700;color:' + s.color + '">' + esc(String(s.value)) + '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + esc(s.label) + '</div>';
    wrapper.appendChild(c);
  });

  return wrapper;
}

function _calcAvgResponseTime(msgs, providerId) {
  /* Group by thread */
  var threadMap = {};
  msgs.forEach(function(m) {
    if (!threadMap[m.threadId]) threadMap[m.threadId] = [];
    threadMap[m.threadId].push(m);
  });

  var totalMs = 0;
  var count = 0;
  Object.keys(threadMap).forEach(function(tid) {
    var tMsgs = threadMap[tid].sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
    for (var i = 1; i < tMsgs.length; i++) {
      if (tMsgs[i].fromId === providerId && tMsgs[i - 1].toId === providerId) {
        var diff = new Date(tMsgs[i].createdAt) - new Date(tMsgs[i - 1].createdAt);
        if (diff > 0 && diff < 7 * 24 * 3600 * 1000) {
          totalMs += diff;
          count++;
        }
      }
    }
  });

  if (count === 0) return 'N/A';
  var avgMin = Math.round(totalMs / count / 60000);
  if (avgMin < 60) return avgMin + 'm';
  var avgHr = Math.round(avgMin / 60);
  if (avgHr < 24) return avgHr + 'h';
  return Math.round(avgHr / 24) + 'd';
}

/* ============================================================
   Thread Summary Cards (enhanced)
   ============================================================ */
function _buildThreadSummaryCard(thread, providerId) {
  var patient = getPatient(thread.patientId);
  var item = document.createElement('div');
  item.className = 'message-thread-item' + (thread.unreadCount > 0 ? ' unread' : '');
  item.style.cssText = 'cursor:pointer;display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);';

  /* Color-code left border by message type */
  var borderColor = _getThreadBorderColor(thread.type, thread.priority);
  item.style.borderLeft = '4px solid ' + borderColor;

  /* Patient avatar (initials) */
  var avatar = document.createElement('div');
  var initials = 'UN';
  if (patient) {
    initials = (patient.firstName ? patient.firstName.charAt(0) : '') + (patient.lastName ? patient.lastName.charAt(0) : '');
  }
  avatar.style.cssText = 'width:40px;height:40px;border-radius:50%;background:' + borderColor + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0';
  avatar.textContent = initials.toUpperCase();
  item.appendChild(avatar);

  /* Body */
  var bodyWrap = document.createElement('div');
  bodyWrap.style.cssText = 'flex:1;min-width:0';

  var topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:2px;flex-wrap:wrap';

  var patName = document.createElement('div');
  patName.className = 'message-thread-patient';
  if (patient) { patName.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); }
  else { patName.textContent = 'Unknown'; }
  topRow.appendChild(patName);

  /* Type badge */
  var typeBadge = document.createElement('span');
  typeBadge.className = 'message-type-badge ' + _getMessageTypeBadgeClass(thread.type);
  typeBadge.textContent = _getMessageTypeLabel(thread.type);
  topRow.appendChild(typeBadge);

  /* Urgent bell icon */
  if (thread.priority === 'Urgent') {
    var urgentIcon = document.createElement('span');
    urgentIcon.style.cssText = 'color:#e53e3e;font-size:14px;';
    urgentIcon.innerHTML = '&#128276;';
    urgentIcon.title = 'Urgent';
    topRow.appendChild(urgentIcon);
  }

  /* Unread count badge */
  if (thread.unreadCount > 0) {
    var unreadBadge = document.createElement('span');
    unreadBadge.className = 'message-unread-badge';
    unreadBadge.textContent = thread.unreadCount;
    topRow.appendChild(unreadBadge);
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

  /* Right column: time */
  var timeEl = document.createElement('div');
  timeEl.className = 'message-thread-time';
  timeEl.textContent = _formatMessageTime(thread.lastTime);
  item.appendChild(timeEl);

  item.addEventListener('click', function() { openMessageThreadModal(thread.threadId); });
  return item;
}

function _getThreadBorderColor(type, priority) {
  if (priority === 'Urgent') return '#e53e3e';
  switch (type) {
    case 'lab_result':      return '#3182ce';
    case 'rx_notification': return '#38a169';
    case 'appointment':     return '#805ad5';
    case 'referral':        return '#d69e2e';
    case 'system':          return '#718096';
    default:                return '#a0aec0';
  }
}

/* ============================================================
   Scheduled Messages Section
   ============================================================ */
function _getScheduledMessages(providerId) {
  return getMessages().filter(function(m) {
    return m.fromId === providerId && m.status === 'Scheduled';
  }).sort(function(a, b) {
    return new Date(a.scheduledAt || a.createdAt) - new Date(b.scheduledAt || b.createdAt);
  });
}

function _buildScheduledSection(scheduledMsgs) {
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'border-bottom:1px solid var(--border)';

  var header = document.createElement('div');
  header.style.cssText = 'padding:10px 16px;background:var(--bg-sidebar);display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none';
  header.innerHTML = '<span style="font-size:14px">&#128339;</span><strong style="font-size:13px">Scheduled Messages (' + scheduledMsgs.length + ')</strong><span style="margin-left:auto;font-size:12px;color:var(--text-muted)">' + (_msgScheduledSectionOpen ? '&#9650;' : '&#9660;') + '</span>';

  var body = document.createElement('div');
  body.style.display = _msgScheduledSectionOpen ? 'block' : 'none';

  header.addEventListener('click', function() {
    _msgScheduledSectionOpen = !_msgScheduledSectionOpen;
    body.style.display = _msgScheduledSectionOpen ? 'block' : 'none';
    header.querySelector('span:last-child').innerHTML = _msgScheduledSectionOpen ? '&#9650;' : '&#9660;';
  });

  scheduledMsgs.forEach(function(m) {
    var patient = getPatient(m.patientId);
    var row = document.createElement('div');
    row.style.cssText = 'padding:8px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);font-size:13px';
    row.innerHTML = '<span style="color:var(--text-muted)">&#128339;</span>' +
      '<span style="font-weight:600">' + esc(patient ? patient.lastName + ', ' + patient.firstName : 'Unknown') + '</span>' +
      '<span style="color:var(--text-secondary)">' + esc(m.subject) + '</span>' +
      '<span style="margin-left:auto;color:var(--text-muted);font-size:12px">' + (m.scheduledAt ? formatDateTime(m.scheduledAt) : 'Pending') + '</span>';
    body.appendChild(row);
  });

  wrapper.appendChild(header);
  wrapper.appendChild(body);
  return wrapper;
}

/* ============================================================
   Mark All Read
   ============================================================ */
function _markAllMessagesRead(providerId) {
  var allMsgs = getMessages();
  var changed = false;
  allMsgs.forEach(function(m) {
    if (m.toId === providerId && m.status === 'Sent') {
      markMessageRead(m.id);
      changed = true;
    }
  });
  if (changed) {
    showToast('All messages marked as read.', 'success');
    if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
    renderMessages();
  } else {
    showToast('No unread messages.', 'warning');
  }
}

/* ============================================================
   Template Selector Modal (with categories)
   ============================================================ */
function _openTemplateSelectorModal() {
  var bodyHTML = '<div id="msg-tmpl-selector">';

  MESSAGE_TEMPLATE_CATEGORIES.forEach(function(cat) {
    var catTemplates = MESSAGE_TEMPLATES.filter(function(t) { return t.category === cat.id; });
    if (catTemplates.length === 0) return;

    bodyHTML += '<div class="msg-tmpl-category" style="margin-bottom:12px">';
    bodyHTML += '<div class="msg-tmpl-cat-header" data-cat="' + esc(cat.id) + '" style="padding:8px 12px;background:var(--bg-sidebar);border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:13px;user-select:none">';
    bodyHTML += '<span>' + esc(cat.label) + ' (' + catTemplates.length + ')</span>';
    bodyHTML += '<span class="msg-tmpl-arrow" style="font-size:11px">&#9660;</span>';
    bodyHTML += '</div>';
    bodyHTML += '<div class="msg-tmpl-cat-body" data-cat-body="' + esc(cat.id) + '" style="display:none;padding:4px 0">';

    catTemplates.forEach(function(tmpl, idx) {
      bodyHTML += '<div class="msg-tmpl-item" data-tmpl-cat="' + esc(cat.id) + '" data-tmpl-idx="' + idx + '" style="padding:8px 16px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s">';
      bodyHTML += '<div style="font-weight:500;font-size:13px">' + esc(tmpl.name) + '</div>';
      bodyHTML += '<div style="font-size:12px;color:var(--text-muted);margin-top:2px">Subject: ' + esc(tmpl.subject) + '</div>';
      bodyHTML += '</div>';
    });

    bodyHTML += '</div></div>';
  });

  bodyHTML += '</div>';

  openModal({
    title: 'Select a Template',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>',
    size: 'lg',
  });

  /* Attach category toggle handlers */
  var catHeaders = document.querySelectorAll('.msg-tmpl-cat-header');
  catHeaders.forEach(function(hdr) {
    hdr.addEventListener('click', function() {
      var catId = hdr.getAttribute('data-cat');
      var catBody = document.querySelector('[data-cat-body="' + catId + '"]');
      var arrow = hdr.querySelector('.msg-tmpl-arrow');
      if (catBody.style.display === 'none') {
        catBody.style.display = 'block';
        arrow.innerHTML = '&#9650;';
      } else {
        catBody.style.display = 'none';
        arrow.innerHTML = '&#9660;';
      }
    });
  });

  /* Attach template click handlers */
  var tmplItems = document.querySelectorAll('.msg-tmpl-item');
  tmplItems.forEach(function(el) {
    el.addEventListener('mouseenter', function() { el.style.background = 'var(--accent-blue-light)'; });
    el.addEventListener('mouseleave', function() { el.style.background = ''; });
    el.addEventListener('click', function() {
      var catId = el.getAttribute('data-tmpl-cat');
      var idx = parseInt(el.getAttribute('data-tmpl-idx'), 10);
      var catTemplates = MESSAGE_TEMPLATES.filter(function(t) { return t.category === catId; });
      var tmpl = catTemplates[idx];
      if (tmpl) {
        closeModal();
        openMessagesComposeModal(null, null, tmpl);
      }
    });
  });
}

/* ============================================================
   Smart Compose — placeholder replacement
   ============================================================ */
function _replaceSmartPlaceholders(text, patientId) {
  var user = getSessionUser();
  var providerId = user ? (getCurrentProvider() || user.id) : '';
  var provider = providerId ? getProvider(providerId) : null;
  var patient = patientId ? getPatient(patientId) : null;

  var providerName = provider
    ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree
    : (user ? user.firstName + ' ' + user.lastName : 'Your Provider');

  var patientName = patient ? patient.firstName + ' ' + patient.lastName : '[Patient Name]';

  var today = new Date();
  var dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  text = text.replace(/\[Patient Name\]/g, patientName);
  text = text.replace(/\[Provider Name\]/g, providerName);
  text = text.replace(/\[Date\]/g, dateStr);

  return text;
}

/* ============================================================
   Enhanced Compose Modal
   ============================================================ */
function openMessagesComposeModal(replyThreadId, replyPatientId, template) {
  var user = getSessionUser();
  if (!user) return;
  var providerId = getCurrentProvider() || user.id;
  var provider = getProvider(providerId);
  var providerName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);
  var signature = _getProviderSignature();

  var isReply = !!replyThreadId;
  var replyThread = [];
  if (isReply) {
    replyThread = getMessageThread(replyThreadId);
  }

  var patients = getPatients().sort(function(a, b) { return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName); });
  var patientOptionsHTML = '<option value="">-- Select Patient --</option>';
  patients.forEach(function(p) {
    var sel = (replyPatientId && p.id === replyPatientId) ? ' selected' : '';
    patientOptionsHTML += '<option value="' + esc(p.id) + '"' + sel + '>' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });

  var defaultSubject = template ? template.subject : (isReply && replyThread.length > 0 ? 'Re: ' + replyThread[0].subject : '');
  var defaultBody = template ? template.body : '';
  var defaultType = template && template.type ? template.type : 'general';

  /* Restore draft if no template and not a reply */
  var draft = null;
  if (!template && !isReply) {
    try {
      var stored = localStorage.getItem(MSG_DRAFT_KEY);
      if (stored) { draft = JSON.parse(stored); }
    } catch (e) { /* ignore */ }
  }

  if (draft && !template && !isReply) {
    defaultSubject = draft.subject || defaultSubject;
    defaultBody = draft.body || defaultBody;
    defaultType = draft.type || defaultType;
    if (draft.patientId) { replyPatientId = draft.patientId; }
  }

  /* Provider list for CC */
  var allProviders = (typeof getProviders === 'function') ? getProviders() : [];
  var ccOptionsHTML = '';
  allProviders.forEach(function(prov) {
    if (prov.id === providerId) return;
    ccOptionsHTML += '<option value="' + esc(prov.id) + '">' + esc(prov.lastName + ', ' + prov.firstName) + (prov.degree ? ' (' + esc(prov.degree) + ')' : '') + '</option>';
  });

  var bodyHTML = '<div class="message-compose">';

  /* From header */
  bodyHTML += '<div style="padding:8px 12px;background:var(--bg-sidebar);border-radius:6px;margin-bottom:14px;font-size:13px">';
  bodyHTML += '<strong>From:</strong> Dr. ' + esc(providerName);
  bodyHTML += '</div>';

  /* Urgent warning banner (hidden initially) */
  bodyHTML += '<div id="msg-urgent-banner" style="display:none;padding:10px 14px;background:#fed7d7;border:1px solid #feb2b2;border-radius:6px;margin-bottom:14px;color:#c53030;font-weight:600;font-size:13px">';
  bodyHTML += '&#9888; This message will be flagged as urgent';
  bodyHTML += '</div>';

  /* Patient */
  bodyHTML += '<div class="form-group">';
  bodyHTML += '<label class="form-label">Patient</label>';
  bodyHTML += '<select class="form-control" id="msg-patient"' + (isReply ? ' disabled' : '') + '>' + patientOptionsHTML + '</select>';
  bodyHTML += '</div>';

  /* CC Providers */
  if (ccOptionsHTML) {
    bodyHTML += '<div class="form-group">';
    bodyHTML += '<label class="form-label">CC Providers <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>';
    bodyHTML += '<select class="form-control" id="msg-cc" multiple style="height:auto;min-height:36px">' + ccOptionsHTML + '</select>';
    bodyHTML += '</div>';
  }

  /* Message Type */
  bodyHTML += '<div class="form-group">';
  bodyHTML += '<label class="form-label">Message Type</label>';
  bodyHTML += '<select class="form-control" id="msg-type">';
  bodyHTML += '<option value="general"' + (defaultType === 'general' ? ' selected' : '') + '>General</option>';
  bodyHTML += '<option value="lab_result"' + (defaultType === 'lab_result' ? ' selected' : '') + '>Lab Result</option>';
  bodyHTML += '<option value="rx_notification"' + (defaultType === 'rx_notification' ? ' selected' : '') + '>Rx Notification</option>';
  bodyHTML += '<option value="appointment"' + (defaultType === 'appointment' ? ' selected' : '') + '>Appointment</option>';
  bodyHTML += '<option value="referral"' + (defaultType === 'referral' ? ' selected' : '') + '>Referral</option>';
  bodyHTML += '<option value="system"' + (defaultType === 'system' ? ' selected' : '') + '>System/Admin</option>';
  bodyHTML += '</select>';
  bodyHTML += '</div>';

  /* Subject */
  bodyHTML += '<div class="form-group">';
  bodyHTML += '<label class="form-label">Subject</label>';
  bodyHTML += '<input type="text" class="form-control" id="msg-subject" value="' + esc(defaultSubject) + '" placeholder="Message subject...">';
  bodyHTML += '</div>';

  /* Priority */
  bodyHTML += '<div class="form-group">';
  bodyHTML += '<label class="form-label">Priority</label>';
  bodyHTML += '<select class="form-control" id="msg-priority">';
  bodyHTML += '<option value="Normal">Normal</option>';
  bodyHTML += '<option value="Urgent">Urgent</option>';
  bodyHTML += '</select>';
  bodyHTML += '</div>';

  /* Rich text toolbar */
  bodyHTML += '<div class="form-group">';
  bodyHTML += '<label class="form-label">Message</label>';
  bodyHTML += '<div id="msg-toolbar" style="display:flex;gap:4px;margin-bottom:6px">';
  bodyHTML += '<button type="button" class="btn btn-secondary btn-sm" id="msg-tb-bold" title="Bold" style="font-weight:700;min-width:32px">B</button>';
  bodyHTML += '<button type="button" class="btn btn-secondary btn-sm" id="msg-tb-italic" title="Italic" style="font-style:italic;min-width:32px">I</button>';
  bodyHTML += '<button type="button" class="btn btn-secondary btn-sm" id="msg-tb-list" title="Bullet List" style="min-width:32px">&#8226;</button>';
  bodyHTML += '</div>';
  bodyHTML += '<textarea class="form-control" id="msg-body" rows="8" placeholder="Type your message...">' + esc(defaultBody) + '</textarea>';
  bodyHTML += '</div>';

  /* Auto-signature preview */
  bodyHTML += '<div style="padding:8px 12px;background:var(--bg-sidebar);border-radius:6px;margin-bottom:14px;font-size:12px;color:var(--text-muted);white-space:pre-line">';
  bodyHTML += '<em>Signature preview:</em>\n' + esc(signature.trim());
  bodyHTML += '</div>';

  bodyHTML += '</div>';

  /* Footer with Send, Schedule Send, Preview */
  var footerHTML = '<div style="display:flex;gap:8px;width:100%;justify-content:space-between;flex-wrap:wrap">';
  footerHTML += '<div style="display:flex;gap:8px">';
  footerHTML += '<button class="btn btn-secondary" id="msg-cancel-btn">Cancel</button>';
  footerHTML += '<button class="btn btn-secondary" id="msg-preview-btn">Preview</button>';
  footerHTML += '</div>';
  footerHTML += '<div style="display:flex;gap:8px">';
  footerHTML += '<button class="btn btn-secondary" id="msg-schedule-btn">&#128339; Schedule Send</button>';
  footerHTML += '<button class="btn btn-primary" id="msg-send-btn">Send Message</button>';
  footerHTML += '</div>';
  footerHTML += '</div>';

  openModal({
    title: isReply ? 'Reply to Thread' : 'New Message',
    bodyHTML: bodyHTML,
    footerHTML: footerHTML,
    size: 'lg',
  });

  /* ---------- Post-render: attach handlers ---------- */

  /* If draft had a patient pre-selected */
  if (draft && draft.patientId && !isReply) {
    var patSel = document.getElementById('msg-patient');
    if (patSel) patSel.value = draft.patientId;
  }

  /* Smart compose: auto-replace placeholders when patient changes */
  var patSelect = document.getElementById('msg-patient');
  if (patSelect) {
    patSelect.addEventListener('change', function() {
      _applySmartReplacements();
    });
  }

  /* Priority change -> urgent banner */
  var priSel = document.getElementById('msg-priority');
  if (priSel) {
    priSel.addEventListener('change', function() {
      var banner = document.getElementById('msg-urgent-banner');
      if (banner) {
        banner.style.display = priSel.value === 'Urgent' ? 'block' : 'none';
      }
    });
  }

  /* Rich text toolbar */
  _attachRichTextToolbar();

  /* Auto-save draft every 30 seconds */
  _clearDraftTimer();
  _msgDraftTimer = setInterval(function() {
    _saveDraftFromCompose();
  }, 30000);

  /* Apply smart replacements if template was used */
  if (template) {
    /* Slight delay for DOM to settle */
    setTimeout(function() { _applySmartReplacements(); }, 50);
  }

  /* ---------- Button handlers ---------- */

  document.getElementById('msg-cancel-btn').addEventListener('click', function() {
    _clearDraftTimer();
    localStorage.removeItem(MSG_DRAFT_KEY);
    closeModal();
  });

  document.getElementById('msg-preview-btn').addEventListener('click', function() {
    _showMessagePreview();
  });

  document.getElementById('msg-schedule-btn').addEventListener('click', function() {
    _showScheduleSendPicker(isReply, replyThreadId, replyPatientId, providerId, providerName, signature);
  });

  document.getElementById('msg-send-btn').addEventListener('click', function() {
    _sendMessage(isReply, replyThreadId, replyPatientId, providerId, providerName, signature, null);
  });
}

/* ============================================================
   Smart Replacements (apply to body field)
   ============================================================ */
function _applySmartReplacements() {
  var bodyEl = document.getElementById('msg-body');
  var patSel = document.getElementById('msg-patient');
  if (!bodyEl || !patSel) return;

  var patientId = patSel.value;
  bodyEl.value = _replaceSmartPlaceholders(bodyEl.value, patientId);

  /* Also replace in subject if applicable */
  var subjEl = document.getElementById('msg-subject');
  if (subjEl) {
    subjEl.value = _replaceSmartPlaceholders(subjEl.value, patientId);
  }
}

/* ============================================================
   Rich Text Toolbar
   ============================================================ */
function _attachRichTextToolbar() {
  var boldBtn = document.getElementById('msg-tb-bold');
  var italicBtn = document.getElementById('msg-tb-italic');
  var listBtn = document.getElementById('msg-tb-list');
  var bodyEl = document.getElementById('msg-body');

  if (!bodyEl) return;

  if (boldBtn) {
    boldBtn.addEventListener('click', function() {
      _wrapSelection(bodyEl, '<b>', '</b>');
    });
  }
  if (italicBtn) {
    italicBtn.addEventListener('click', function() {
      _wrapSelection(bodyEl, '<i>', '</i>');
    });
  }
  if (listBtn) {
    listBtn.addEventListener('click', function() {
      _insertBullet(bodyEl);
    });
  }
}

function _wrapSelection(textarea, before, after) {
  var start = textarea.selectionStart;
  var end = textarea.selectionEnd;
  var text = textarea.value;
  var selected = text.substring(start, end);
  if (!selected) selected = 'text';
  var replacement = before + selected + after;
  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = start + before.length + selected.length;
  textarea.focus();
}

function _insertBullet(textarea) {
  var start = textarea.selectionStart;
  var text = textarea.value;
  var bullet = '\n- ';
  textarea.value = text.substring(0, start) + bullet + text.substring(start);
  textarea.selectionStart = start + bullet.length;
  textarea.selectionEnd = start + bullet.length;
  textarea.focus();
}

/* ============================================================
   Draft Auto-Save
   ============================================================ */
function _saveDraftFromCompose() {
  var patSel = document.getElementById('msg-patient');
  var subjEl = document.getElementById('msg-subject');
  var bodyEl = document.getElementById('msg-body');
  var typeEl = document.getElementById('msg-type');

  if (!bodyEl) return; /* Compose modal not open */

  var draft = {
    patientId: patSel ? patSel.value : '',
    subject: subjEl ? subjEl.value : '',
    body: bodyEl ? bodyEl.value : '',
    type: typeEl ? typeEl.value : 'general',
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(MSG_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) { /* ignore quota errors */ }
}

function _clearDraftTimer() {
  if (_msgDraftTimer) {
    clearInterval(_msgDraftTimer);
    _msgDraftTimer = null;
  }
}

/* ============================================================
   Preview Modal
   ============================================================ */
function _showMessagePreview() {
  var patSel = document.getElementById('msg-patient');
  var subjEl = document.getElementById('msg-subject');
  var bodyEl = document.getElementById('msg-body');
  var priSel = document.getElementById('msg-priority');
  var typeEl = document.getElementById('msg-type');

  var patientId = patSel ? patSel.value : '';
  var patient = patientId ? getPatient(patientId) : null;
  var subject = subjEl ? subjEl.value : '';
  var body = bodyEl ? bodyEl.value : '';
  var priority = priSel ? priSel.value : 'Normal';
  var type = typeEl ? typeEl.value : 'general';

  var user = getSessionUser();
  var providerId = user ? (getCurrentProvider() || user.id) : '';
  var provider = providerId ? getProvider(providerId) : null;
  var providerName = provider
    ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree
    : (user ? user.firstName + ' ' + user.lastName : '');

  /* Replace any remaining placeholders */
  subject = _replaceSmartPlaceholders(subject, patientId);
  body = _replaceSmartPlaceholders(body, patientId);

  var signature = _getProviderSignature();

  var previewHTML = '<div style="max-width:600px;margin:0 auto">';

  /* Urgent banner */
  if (priority === 'Urgent') {
    previewHTML += '<div style="padding:8px 12px;background:#fed7d7;border:1px solid #feb2b2;border-radius:6px;color:#c53030;font-weight:600;font-size:13px;margin-bottom:12px">&#9888; URGENT MESSAGE</div>';
  }

  previewHTML += '<div style="padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card)">';

  /* Header */
  previewHTML += '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">';
  previewHTML += '<div style="font-size:11px;color:var(--text-muted)">FROM</div>';
  previewHTML += '<div style="font-weight:600">Dr. ' + esc(providerName) + '</div>';
  previewHTML += '<div style="font-size:11px;color:var(--text-muted);margin-top:8px">TO</div>';
  previewHTML += '<div style="font-weight:600">' + esc(patient ? patient.firstName + ' ' + patient.lastName : 'No patient selected') + '</div>';
  previewHTML += '<div style="font-size:11px;color:var(--text-muted);margin-top:8px">TYPE</div>';
  previewHTML += '<div><span class="message-type-badge ' + _getMessageTypeBadgeClass(type) + '">' + esc(_getMessageTypeLabel(type)) + '</span></div>';
  previewHTML += '</div>';

  /* Subject */
  previewHTML += '<div style="font-size:16px;font-weight:700;margin-bottom:12px">' + esc(subject) + '</div>';

  /* Body */
  previewHTML += '<div style="white-space:pre-wrap;line-height:1.6;font-size:14px">' + esc(body) + '</div>';

  /* Signature */
  previewHTML += '<div style="white-space:pre-wrap;color:var(--text-muted);font-size:13px">' + esc(signature) + '</div>';

  previewHTML += '</div></div>';

  openModal({
    title: 'Message Preview',
    bodyHTML: previewHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Back to Edit</button>',
    size: 'lg',
  });
}

/* ============================================================
   Schedule Send
   ============================================================ */
function _showScheduleSendPicker(isReply, replyThreadId, replyPatientId, providerId, providerName, signature) {
  /* Get current form values so we can validate first */
  var patSel = document.getElementById('msg-patient');
  var subjEl = document.getElementById('msg-subject');
  var bodyEl = document.getElementById('msg-body');

  var patientId = isReply ? replyPatientId : (patSel ? patSel.value : '');
  var subject = subjEl ? subjEl.value.trim() : '';
  var body = bodyEl ? bodyEl.value.trim() : '';

  if (!patientId) { showToast('Please select a patient first.', 'error'); return; }
  if (!subject) { showToast('Please enter a subject first.', 'error'); return; }
  if (!body) { showToast('Please enter a message first.', 'error'); return; }

  /* Build a small datetime picker modal */
  var now = new Date();
  var minDateStr = now.toISOString().slice(0, 16);

  var pickerHTML = '<div style="padding:12px">';
  pickerHTML += '<p style="margin-bottom:12px;color:var(--text-secondary)">Choose when to send this message:</p>';
  pickerHTML += '<input type="datetime-local" class="form-control" id="msg-schedule-datetime" min="' + minDateStr + '" value="' + minDateStr + '" style="max-width:300px">';
  pickerHTML += '</div>';

  openModal({
    title: 'Schedule Send',
    bodyHTML: pickerHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="msg-confirm-schedule">Schedule</button>',
  });

  document.getElementById('msg-confirm-schedule').addEventListener('click', function() {
    var dtInput = document.getElementById('msg-schedule-datetime');
    if (!dtInput || !dtInput.value) { showToast('Please select a date and time.', 'error'); return; }

    var scheduledAt = new Date(dtInput.value).toISOString();
    closeModal(); /* Close picker */

    /* Now send with scheduled status - we need to re-read from the compose modal that's underneath */
    _sendMessageScheduled(isReply, replyThreadId, replyPatientId, providerId, providerName, signature, scheduledAt);
  });
}

function _sendMessageScheduled(isReply, replyThreadId, replyPatientId, providerId, providerName, signature, scheduledAt) {
  /* The compose modal should still be underneath. Grab values. */
  var patSel = document.getElementById('msg-patient');
  var subjEl = document.getElementById('msg-subject');
  var bodyEl = document.getElementById('msg-body');
  var priSel = document.getElementById('msg-priority');
  var typeEl = document.getElementById('msg-type');
  var ccSel = document.getElementById('msg-cc');

  var patientId = isReply ? replyPatientId : (patSel ? patSel.value : '');
  var subject = subjEl ? subjEl.value.trim() : '';
  var body = bodyEl ? bodyEl.value.trim() : '';
  var priority = priSel ? priSel.value : 'Normal';
  var msgType = typeEl ? typeEl.value : 'general';

  if (!patientId || !subject || !body) {
    showToast('Missing required fields.', 'error');
    return;
  }

  /* Append signature */
  body = body + signature;

  var patient = getPatient(patientId);
  var toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

  /* CC providers */
  var ccProviders = [];
  if (ccSel) {
    for (var i = 0; i < ccSel.options.length; i++) {
      if (ccSel.options[i].selected) ccProviders.push(ccSel.options[i].value);
    }
  }

  saveMessage({
    threadId: isReply ? replyThreadId : '',
    type: msgType,
    fromType: 'provider',
    fromId: providerId,
    fromName: providerName,
    toType: 'patient',
    toId: patientId,
    toName: toName,
    patientId: patientId,
    subject: subject,
    body: body,
    priority: priority,
    status: 'Scheduled',
    scheduledAt: scheduledAt,
    ccProviders: ccProviders,
  });

  _clearDraftTimer();
  localStorage.removeItem(MSG_DRAFT_KEY);
  closeModal();
  showToast('Message scheduled for ' + formatDateTime(scheduledAt) + '.', 'success');
  renderMessages();
  if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
}

/* ============================================================
   Send Message (immediate)
   ============================================================ */
function _sendMessage(isReply, replyThreadId, replyPatientId, providerId, providerName, signature, scheduledAt) {
  var patSel = document.getElementById('msg-patient');
  var subjEl = document.getElementById('msg-subject');
  var bodyEl = document.getElementById('msg-body');
  var priSel = document.getElementById('msg-priority');
  var typeEl = document.getElementById('msg-type');
  var ccSel = document.getElementById('msg-cc');

  var patientId = isReply ? replyPatientId : (patSel ? patSel.value : '');
  var subject = subjEl ? subjEl.value.trim() : '';
  var body = bodyEl ? bodyEl.value.trim() : '';
  var priority = priSel ? priSel.value : 'Normal';
  var msgType = typeEl ? typeEl.value : 'general';

  if (!patientId) { showToast('Please select a patient.', 'error'); return; }
  if (!subject) { showToast('Please enter a subject.', 'error'); return; }
  if (!body) { showToast('Please enter a message.', 'error'); return; }

  /* Append signature */
  body = body + signature;

  var patient = getPatient(patientId);
  var toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

  /* CC providers */
  var ccProviders = [];
  if (ccSel) {
    for (var i = 0; i < ccSel.options.length; i++) {
      if (ccSel.options[i].selected) ccProviders.push(ccSel.options[i].value);
    }
  }

  saveMessage({
    threadId: isReply ? replyThreadId : '',
    type: msgType,
    fromType: 'provider',
    fromId: providerId,
    fromName: providerName,
    toType: 'patient',
    toId: patientId,
    toName: toName,
    patientId: patientId,
    subject: subject,
    body: body,
    priority: priority,
    status: 'Sent',
    ccProviders: ccProviders,
  });

  _clearDraftTimer();
  localStorage.removeItem(MSG_DRAFT_KEY);
  closeModal();
  showToast('Message sent.', 'success');
  renderMessages();
  if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
}

/* ============================================================
   Provider Signature
   ============================================================ */
function _getProviderSignature() {
  var user = getSessionUser();
  if (!user) return '';
  var providerId = getCurrentProvider() || user.id;
  var provider = getProvider(providerId);
  if (!provider) return '\n\n--\n' + user.firstName + ' ' + user.lastName;
  return '\n\n--\n' + provider.firstName + ' ' + provider.lastName + ', ' + provider.degree;
}
