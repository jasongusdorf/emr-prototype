/* ============================================================
   views/messages.js — Separate Messaging Tool
   Template responses + auto-populated doctor signature
   ============================================================ */

const MESSAGE_TEMPLATES = [
  { name: 'Lab Results Normal', subject: 'Your Lab Results', body: 'Your recent lab results have been reviewed and are within normal limits. No action is needed at this time. Please continue your current medications and follow up as scheduled.' },
  { name: 'Rx Refill Approved', subject: 'Prescription Refill Approved', body: 'Your prescription refill request has been approved and sent to your pharmacy. Please allow 24-48 hours for processing. Contact your pharmacy if you have not received it within that time.' },
  { name: 'Appointment Reminder', subject: 'Upcoming Appointment Reminder', body: 'This is a reminder about your upcoming appointment. Please arrive 15 minutes early and bring your current medication list and insurance card. If you need to reschedule, please contact our office.' },
  { name: 'Follow-Up Instructions', subject: 'Follow-Up Care Instructions', body: 'Thank you for your recent visit. Please follow the care instructions discussed during your appointment. If your symptoms worsen or you develop new concerns, please contact our office or go to the nearest emergency room.' },
  { name: 'Test Results Pending', subject: 'Test Results Update', body: 'We wanted to let you know that some of your test results are still pending. We expect results within the next few business days and will contact you once they are available. No action is needed on your part at this time.' },
];

function renderMessages() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({
    title: 'Messages',
    meta: '',
    actions: '<button class="btn btn-primary btn-sm" id="btn-new-message">New Message</button>',
  });
  setActiveNav('messages');

  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;

  // Message threads list
  const card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '16px 20px';

  // Template quick actions bar
  const templateBar = document.createElement('div');
  templateBar.className = 'message-template-bar';
  templateBar.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;align-items:center';

  const templateLabel = document.createElement('span');
  templateLabel.className = 'text-muted text-sm';
  templateLabel.textContent = 'Quick:';
  templateBar.appendChild(templateLabel);

  MESSAGE_TEMPLATES.forEach(tmpl => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary btn-sm';
    btn.textContent = tmpl.name;
    btn.addEventListener('click', () => openMessagesComposeModal(null, null, tmpl));
    templateBar.appendChild(btn);
  });

  card.appendChild(templateBar);

  // Message threads
  const threads = _getMessageThreads();
  if (threads.length === 0) {
    card.appendChild(buildEmptyState('💬', 'No messages', 'Send a message to a patient to get started.'));
  } else {
    threads.forEach(thread => {
      const patient = getPatient(thread.patientId);
      const item = document.createElement('div');
      item.className = 'message-thread-item' + (thread.unreadCount > 0 ? ' unread' : '');
      item.style.cursor = 'pointer';

      const bodyWrap = document.createElement('div');
      bodyWrap.style.flex = '1';

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:2px';

      const patName = document.createElement('div');
      patName.className = 'message-thread-patient';
      if (patient) { patName.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName)); }
      else { patName.textContent = 'Unknown'; }

      const typeBadge = document.createElement('span');
      typeBadge.className = 'message-type-badge ' + _getMessageTypeBadgeClass(thread.type);
      typeBadge.textContent = _getMessageTypeLabel(thread.type);

      topRow.appendChild(patName);
      topRow.appendChild(typeBadge);

      if (thread.unreadCount > 0) {
        const unreadBadge = document.createElement('span');
        unreadBadge.className = 'message-unread-badge';
        unreadBadge.textContent = thread.unreadCount;
        topRow.appendChild(unreadBadge);
      }

      bodyWrap.appendChild(topRow);

      const subjEl = document.createElement('div');
      subjEl.className = 'message-thread-subject';
      subjEl.textContent = thread.subject;
      bodyWrap.appendChild(subjEl);

      const preview = document.createElement('div');
      preview.className = 'message-thread-preview';
      const previewText = thread.lastMessage || '';
      preview.textContent = thread.lastSender + ': ' + (previewText.length > 80 ? previewText.substring(0, 80) + '...' : previewText);
      bodyWrap.appendChild(preview);

      item.appendChild(bodyWrap);

      const timeEl = document.createElement('div');
      timeEl.className = 'message-thread-time';
      timeEl.textContent = _formatMessageTime(thread.lastTime);
      item.appendChild(timeEl);

      item.addEventListener('click', () => openMessageThreadModal(thread.threadId));
      card.appendChild(item);
    });
  }

  app.appendChild(card);

  // New Message button handler
  document.getElementById('btn-new-message').addEventListener('click', () => openMessagesComposeModal());
}

function _getProviderSignature() {
  const user = getSessionUser();
  if (!user) return '';
  const providerId = getCurrentProvider() || user.id;
  const provider = getProvider(providerId);
  if (!provider) return '\n\n—\n' + user.firstName + ' ' + user.lastName;
  return '\n\n—\n' + provider.firstName + ' ' + provider.lastName + ', ' + provider.degree;
}

function openMessagesComposeModal(replyThreadId, replyPatientId, template) {
  const user = getSessionUser();
  if (!user) return;
  const providerId = getCurrentProvider() || user.id;
  const provider = getProvider(providerId);
  const providerName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : (user.firstName + ' ' + user.lastName);
  const signature = _getProviderSignature();

  const isReply = !!replyThreadId;
  let replyThread = [];
  if (isReply) {
    replyThread = getMessageThread(replyThreadId);
  }

  const patients = getPatients().sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));
  let patientOptionsHTML = '<option value="">-- Select Patient --</option>';
  patients.forEach(p => {
    const sel = (replyPatientId && p.id === replyPatientId) ? ' selected' : '';
    patientOptionsHTML += '<option value="' + esc(p.id) + '"' + sel + '>' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });

  const defaultSubject = template ? template.subject : (isReply && replyThread.length > 0 ? 'Re: ' + replyThread[0].subject : '');
  const defaultBody = template ? template.body + signature : signature;

  const bodyHTML = '<div class="message-compose">' +
    '<div class="form-group">' +
      '<label class="form-label">Patient</label>' +
      '<select class="form-control" id="msg-patient"' + (isReply ? ' disabled' : '') + '>' + patientOptionsHTML + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Subject</label>' +
      '<input type="text" class="form-control" id="msg-subject" value="' + esc(defaultSubject) + '" placeholder="Message subject...">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Message</label>' +
      '<textarea class="form-control" id="msg-body" rows="8" placeholder="Type your message...">' + esc(defaultBody) + '</textarea>' +
    '</div>' +
  '</div>';

  openModal({
    title: isReply ? 'Reply to Thread' : 'New Message',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="msg-send-btn">Send Message</button>',
    size: 'lg',
  });

  document.getElementById('msg-send-btn').addEventListener('click', () => {
    const patientId = isReply ? replyPatientId : document.getElementById('msg-patient').value;
    const subject = document.getElementById('msg-subject').value.trim();
    const body = document.getElementById('msg-body').value.trim();

    if (!patientId) { showToast('Please select a patient.', 'error'); return; }
    if (!subject) { showToast('Please enter a subject.', 'error'); return; }
    if (!body) { showToast('Please enter a message.', 'error'); return; }

    const patient = getPatient(patientId);
    const toName = patient ? patient.firstName + ' ' + patient.lastName : 'Patient';

    saveMessage({
      threadId: isReply ? replyThreadId : '',
      type: 'general',
      fromType: 'provider',
      fromId: providerId,
      fromName: providerName,
      toType: 'patient',
      toId: patientId,
      toName: toName,
      patientId: patientId,
      subject: subject,
      body: body,
      priority: 'Normal',
      read: false,
    });

    closeModal();
    showToast('Message sent.', 'success');
    renderMessages();
    if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
  });
}
