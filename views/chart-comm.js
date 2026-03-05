/* ============================================================
   views/chart-comm.js — Communication section, new message
   modal, message thread modal
   ============================================================ */

/* ============================================================
   COMMUNICATION TAB
   ============================================================ */
function buildCommunicationSection(patientId) {
  const user = getSessionUser();
  const patient = getPatient(patientId);

  // Get all messages involving this patient, sorted newest first
  const messages = getMessagesByPatient(patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const card = chartCard('Patient Communication', (() => {
    const btn = makeBtn('+ New Message', 'btn btn-sm btn-primary', () => openNewMessageModal(patientId));
    return btn;
  })());
  card.id = 'section-communication';

  if (messages.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-muted';
    empty.style.padding = '12px 16px';
    empty.textContent = 'No messages on file for this patient.';
    card.appendChild(empty);
    return card;
  }

  // Group messages into threads (by threadId)
  const threadMap = new Map();
  messages.forEach(m => {
    const tid = m.threadId || m.id;
    if (!threadMap.has(tid)) threadMap.set(tid, []);
    threadMap.get(tid).push(m);
  });

  const list = document.createElement('div');
  list.className = 'comm-thread-list';

  threadMap.forEach((msgs, threadId) => {
    // Use the first message (newest) as thread header
    const latest = msgs[0];
    const unread = msgs.some(m => m.toId === user.id && m.toType === 'provider' && m.status === 'Sent');

    const row = document.createElement('div');
    row.className = 'comm-thread-row' + (unread ? ' comm-unread' : '');
    row.style.cssText = 'padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; display:flex; gap:12px; align-items:flex-start;';

    // Direction indicator
    const dir = document.createElement('span');
    dir.className = 'comm-dir';
    const toPatient = latest.toType === 'patient';
    dir.textContent = toPatient ? '→' : '←';
    dir.title = toPatient ? 'To patient' : 'From patient';
    dir.style.cssText = `font-size:16px; color:${toPatient ? 'var(--text-muted)' : 'var(--primary)'}; flex-shrink:0; margin-top:2px;`;
    row.appendChild(dir);

    const info = document.createElement('div');
    info.style.cssText = 'flex:1; min-width:0;';

    const topLine = document.createElement('div');
    topLine.style.cssText = 'display:flex; justify-content:space-between; gap:8px;';

    const subject = document.createElement('span');
    subject.style.cssText = 'font-weight:' + (unread ? '700' : '500') + '; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    subject.textContent = latest.subject || '(no subject)';
    topLine.appendChild(subject);

    const dateEl = document.createElement('span');
    dateEl.style.cssText = 'font-size:11px; color:var(--text-muted); flex-shrink:0;';
    dateEl.textContent = formatDateTime(latest.createdAt);
    topLine.appendChild(dateEl);

    info.appendChild(topLine);

    const preview = document.createElement('div');
    preview.style.cssText = 'font-size:12px; color:var(--text-muted); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    const fromLabel = latest.fromName || (latest.fromType === 'patient' ? (patient ? patient.firstName + ' ' + patient.lastName : 'Patient') : 'Provider');
    preview.textContent = fromLabel + ': ' + (latest.body || '').replace(/\s+/g, ' ').trim();
    info.appendChild(preview);

    if (msgs.length > 1) {
      const count = document.createElement('span');
      count.style.cssText = 'font-size:11px; color:var(--text-muted); margin-top:2px; display:block;';
      count.textContent = msgs.length + ' messages in thread';
      info.appendChild(count);
    }

    row.appendChild(info);

    row.addEventListener('click', () => openMessageThreadModal(threadId, patientId));
    list.appendChild(row);
  });

  card.appendChild(list);
  return card;
}

function openNewMessageModal(patientId) {
  const user = getSessionUser();
  const patient = getPatient(patientId);
  if (!patient) return;
  const patientName = patient.firstName + ' ' + patient.lastName;

  openModal({
    title: 'New Message to ' + esc(patientName),
    bodyHTML: `
      <div class="form-group">
        <label>Subject</label>
        <input id="msg-subject" class="form-control" placeholder="Subject" />
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea id="msg-body" class="form-control" rows="5" placeholder="Type your message..."></textarea>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="msg-priority" class="form-control">
          <option>Normal</option>
          <option>High</option>
          <option>Urgent</option>
        </select>
      </div>`,
    footerHTML: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="send-msg-btn">Send</button>`,
  });

  document.getElementById('send-msg-btn').addEventListener('click', () => {
    const subject = document.getElementById('msg-subject').value.trim();
    const body    = document.getElementById('msg-body').value.trim();
    const priority = document.getElementById('msg-priority').value;
    if (!body) { showToast('Please enter a message body.', 'error'); return; }

    saveMessage({
      fromType: 'provider',
      fromId:   user.id,
      fromName: user.firstName + ' ' + user.lastName + (user.degree ? ', ' + user.degree : ''),
      toType:   'patient',
      toId:     patientId,
      toName:   patientName,
      patientId,
      subject:  subject || '(no subject)',
      body,
      priority,
      status:   'Sent',
    });

    closeModal();
    showToast('Message sent.', 'success');
    // Refresh the chart to show new message
    renderChart(patientId);
  });
}

function openMessageThreadModal(threadId, patientId) {
  const user = getSessionUser();
  const patient = getPatient(patientId);
  const thread = getMessageThread(threadId);
  if (!thread.length) return;

  // Mark unread messages as read
  thread.forEach(m => {
    if (m.toId === user.id && m.toType === 'provider' && m.status === 'Sent') {
      markMessageRead(m.id);
    }
  });

  const subject = thread[0].subject || '(no subject)';

  const messagesHTML = thread.map(m => {
    const fromPatient = m.fromType === 'patient';
    const name = m.fromName || (fromPatient ? 'Patient' : 'Provider');
    return `
      <div class="comm-msg-bubble ${fromPatient ? 'comm-from-patient' : 'comm-from-provider'}">
        <div class="comm-msg-meta">${esc(name)} · ${esc(formatDateTime(m.createdAt))}</div>
        <div class="comm-msg-body">${esc(m.body || '')}</div>
      </div>`;
  }).join('');

  openModal({
    title: esc(subject),
    bodyHTML: `
      <div class="comm-thread-view">${messagesHTML}</div>
      <hr style="margin:12px 0;">
      <div class="form-group" style="margin:0;">
        <label>Reply</label>
        <textarea id="reply-body" class="form-control" rows="3" placeholder="Type your reply..."></textarea>
      </div>`,
    footerHTML: `
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" id="send-reply-btn">Send Reply</button>`,
  });

  document.getElementById('send-reply-btn').addEventListener('click', () => {
    const body = document.getElementById('reply-body').value.trim();
    if (!body) { showToast('Please enter a reply.', 'error'); return; }
    const patientName = patient ? patient.firstName + ' ' + patient.lastName : '';
    saveMessage({
      threadId,
      fromType: 'provider',
      fromId:   user.id,
      fromName: user.firstName + ' ' + user.lastName + (user.degree ? ', ' + user.degree : ''),
      toType:   'patient',
      toId:     patientId,
      toName:   patientName,
      patientId,
      subject,
      body,
      priority: 'Normal',
      status:   'Sent',
    });
    closeModal();
    showToast('Reply sent.', 'success');
    renderChart(patientId);
  });
}
