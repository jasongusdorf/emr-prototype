/* ============================================================
   views/portal.js — Patient Login & Portal
   Patients can view their health summary, messages, appointments
   ============================================================ */

/* ---------- Patient Auth Functions ---------- */
function savePatientUser(data) {
  const all = loadAll('emr_patient_users');
  const idx = all.findIndex(u => u.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id: generateId(),
      patientId: '',
      email: '',
      passwordHash: '',
      createdAt: new Date().toISOString(),
      ...data,
    });
  }
  safeSave('emr_patient_users', JSON.stringify(all));
  return all[idx >= 0 ? idx : all.length - 1];
}

function getPatientUsers() {
  try { return JSON.parse(localStorage.getItem('emr_patient_users') || '[]'); } catch(e) { return []; }
}

function getPatientUserByEmail(email) {
  return getPatientUsers().find(u => u.email === email);
}

async function patientLogin(email, password) {
  const user = getPatientUserByEmail(email);
  if (!user) return { ok: false, error: 'No patient account found with this email.' };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, error: 'Incorrect password.' };
  safeSave('emr_patient_session', JSON.stringify({ patientUserId: user.id, patientId: user.patientId, loginAt: new Date().toISOString() }));
  return { ok: true, user };
}

function getPatientSession() {
  try { return JSON.parse(localStorage.getItem('emr_patient_session') || 'null'); } catch(e) { return null; }
}

function isPatientAuthenticated() {
  return !!getPatientSession();
}

function patientLogout() {
  localStorage.removeItem('emr_patient_session');
}

/* ---------- Portal UI ---------- */
let _portalTab = 'summary';

function showPatientLoginForm() {
  const loginScreen = document.getElementById('login-screen');
  const loginCard = loginScreen.querySelector('.login-card');

  // Hide all other forms
  loginCard.querySelectorAll('.auth-form, #login-form, #forgot-form, #register-form, #pending-screen, #password-change-screen').forEach(el => el.classList.add('hidden'));

  // Show patient login form (create if not exists)
  let patForm = document.getElementById('patient-login-form');
  if (!patForm) {
    patForm = document.createElement('form');
    patForm.id = 'patient-login-form';
    patForm.className = 'auth-form';
    patForm.innerHTML = `
      <h2 style="color:var(--portal-accent, #0d9488)">Patient Portal</h2>
      <div class="form-group">
        <label for="pat-login-email">Email</label>
        <input type="email" id="pat-login-email" required placeholder="patient@email.com" />
      </div>
      <div class="form-group">
        <label for="pat-login-pw">Password</label>
        <input type="password" id="pat-login-pw" required placeholder="Password" />
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="background:var(--portal-accent, #0d9488)">Sign In to Portal</button>
      <p class="auth-toggle"><a href="#" id="pat-back-provider">Back to Provider Login</a></p>
      <p class="auth-toggle"><a href="#" id="pat-register-link">Create Patient Account</a></p>
    `;
    loginCard.appendChild(patForm);

    patForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('pat-login-email').value.trim();
      const pw = document.getElementById('pat-login-pw').value;
      if (!email || !pw) { showToast('Please fill in all fields.', 'error'); return; }
      const result = await patientLogin(email, pw);
      if (!result.ok) { showToast(result.error, 'error'); return; }
      renderPatientPortal();
    });

    document.getElementById('pat-back-provider').addEventListener('click', e => {
      e.preventDefault();
      patForm.classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
    });

    document.getElementById('pat-register-link').addEventListener('click', e => {
      e.preventDefault();
      showPatientRegisterForm();
    });
  }
  patForm.classList.remove('hidden');
}

function showPatientRegisterForm() {
  const loginScreen = document.getElementById('login-screen');
  const loginCard = loginScreen.querySelector('.login-card');

  loginCard.querySelectorAll('.auth-form, #login-form, #forgot-form, #register-form, #pending-screen, #password-change-screen, #patient-login-form').forEach(el => el.classList.add('hidden'));

  let regForm = document.getElementById('patient-register-form');
  if (!regForm) {
    regForm = document.createElement('form');
    regForm.id = 'patient-register-form';
    regForm.className = 'auth-form';
    regForm.innerHTML = `
      <h2 style="color:var(--portal-accent, #0d9488)">Create Patient Account</h2>
      <div class="form-group">
        <label>Email *</label>
        <input type="email" id="pat-reg-email" required placeholder="patient@email.com" />
      </div>
      <div class="form-group">
        <label>MRN (Medical Record Number) *</label>
        <input type="text" id="pat-reg-mrn" required placeholder="Your MRN from your provider" />
      </div>
      <div class="form-group">
        <label>Password *</label>
        <input type="password" id="pat-reg-pw" required minlength="8" placeholder="Min 8 characters" />
      </div>
      <div class="form-group">
        <label>Confirm Password *</label>
        <input type="password" id="pat-reg-confirm" required placeholder="Repeat password" />
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="background:var(--portal-accent, #0d9488)">Create Account</button>
      <p class="auth-toggle"><a href="#" id="pat-reg-back">Back to Patient Login</a></p>
    `;
    loginCard.appendChild(regForm);

    regForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('pat-reg-email').value.trim();
      const mrn = document.getElementById('pat-reg-mrn').value.trim();
      const pw = document.getElementById('pat-reg-pw').value;
      const confirm = document.getElementById('pat-reg-confirm').value;

      if (!email || !mrn || !pw) { showToast('Please fill in all required fields.', 'error'); return; }
      if (pw !== confirm) { showToast('Passwords do not match.', 'error'); return; }
      if (getPatientUserByEmail(email)) { showToast('An account with this email already exists.', 'error'); return; }

      // Find patient by MRN
      const patient = getPatients().find(p => p.mrn === mrn);
      if (!patient) { showToast('No patient found with that MRN. Please contact your provider.', 'error'); return; }

      const hash = await hashPassword(pw);
      savePatientUser({ email, patientId: patient.id, passwordHash: hash });

      showToast('Patient account created! You can now sign in.', 'success');
      regForm.classList.add('hidden');
      showPatientLoginForm();
    });

    document.getElementById('pat-reg-back').addEventListener('click', e => {
      e.preventDefault();
      regForm.classList.add('hidden');
      showPatientLoginForm();
    });
  }
  regForm.classList.remove('hidden');
}

function renderPatientPortal() {
  const session = getPatientSession();
  if (!session) { showPatientLoginForm(); return; }

  const patient = getPatient(session.patientId);
  if (!patient) { patientLogout(); showPatientLoginForm(); return; }

  // Hide login, show shell-like portal
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('shell').classList.add('hidden');

  let portalEl = document.getElementById('patient-portal');
  if (!portalEl) {
    portalEl = document.createElement('div');
    portalEl.id = 'patient-portal';
    document.body.appendChild(portalEl);
  }

  portalEl.className = 'patient-portal';
  portalEl.innerHTML = '';

  // Portal header
  const header = document.createElement('div');
  header.className = 'portal-header';
  header.innerHTML = '<h1 style="color:#0d9488;margin:0">GusdorfEMR Patient Portal</h1>' +
    '<div style="display:flex;align-items:center;gap:12px">' +
    '<span>' + esc(patient.firstName) + ' ' + esc(patient.lastName) + '</span>' +
    '<button class="btn btn-secondary btn-sm" id="portal-logout">Sign Out</button></div>';
  portalEl.appendChild(header);

  // Tabs
  const tabs = document.createElement('div');
  tabs.className = 'portal-tabs';
  const tabDefs = [
    { key: 'summary', label: 'My Health Summary' },
    { key: 'messages', label: 'My Messages' },
    { key: 'appointments', label: 'My Appointments' },
  ];
  tabDefs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'portal-tab' + (_portalTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => { _portalTab = t.key; renderPatientPortal(); });
    tabs.appendChild(btn);
  });
  portalEl.appendChild(tabs);

  // Content
  const content = document.createElement('div');
  content.className = 'portal-content';

  if (_portalTab === 'summary') {
    renderPortalSummary(content, patient);
  } else if (_portalTab === 'messages') {
    renderPortalMessages(content, patient, session);
  } else if (_portalTab === 'appointments') {
    renderPortalAppointments(content, patient);
  }

  portalEl.appendChild(content);

  document.getElementById('portal-logout').addEventListener('click', () => {
    patientLogout();
    portalEl.remove();
    document.getElementById('login-screen').classList.remove('hidden');
    showPatientLoginForm();
  });
}

function renderPortalSummary(container, patient) {
  let html = '<div class="portal-card">';
  html += '<h3>Demographics</h3>';
  html += '<p><strong>Name:</strong> ' + esc(patient.firstName) + ' ' + esc(patient.lastName) + '</p>';
  html += '<p><strong>DOB:</strong> ' + esc(patient.dob || 'N/A') + '</p>';
  html += '<p><strong>MRN:</strong> ' + esc(patient.mrn) + '</p>';
  html += '</div>';

  // Problems
  const problems = getPatientProblems ? getPatientProblems(patient.id) : [];
  if (problems.length > 0) {
    html += '<div class="portal-card"><h3>Active Problems</h3><ul>';
    problems.filter(p => p.status === 'Active').forEach(p => {
      html += '<li>' + esc(p.description || p.name || '') + '</li>';
    });
    html += '</ul></div>';
  }

  // Medications
  const meds = getPatientMedications(patient.id).filter(m => m.status === 'Current');
  if (meds.length > 0) {
    html += '<div class="portal-card"><h3>Current Medications</h3><ul>';
    meds.forEach(m => {
      html += '<li><strong>' + esc(m.name) + '</strong> — ' + esc([m.dose, m.unit, m.route, m.frequency].filter(Boolean).join(' ')) + '</li>';
    });
    html += '</ul></div>';
  }

  // Allergies
  const allergies = getPatientAllergies(patient.id);
  if (allergies.length > 0) {
    html += '<div class="portal-card"><h3>Allergies</h3><ul>';
    allergies.forEach(a => {
      html += '<li>' + esc(a.allergen) + ' — ' + esc(a.reaction || 'No reaction specified') + '</li>';
    });
    html += '</ul></div>';
  }

  container.innerHTML = html;
}

function renderPortalMessages(container, patient, session) {
  const providerId = getCurrentProvider ? getCurrentProvider() : null;
  const allMessages = typeof getMessages === 'function' ? getMessages() : [];
  const patientMessages = allMessages.filter(m => m.patientId === patient.id);

  // Group by threadId
  const threads = {};
  patientMessages.forEach(m => {
    const tid = m.threadId || m.id;
    if (!threads[tid]) threads[tid] = [];
    threads[tid].push(m);
  });

  let html = '<div class="portal-card"><h3>Messages</h3>';

  const threadIds = Object.keys(threads);
  if (threadIds.length === 0) {
    html += '<p class="text-muted">No messages.</p>';
  } else {
    threadIds.forEach(tid => {
      const msgs = threads[tid].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
      const first = msgs[0];
      html += '<div class="portal-message-thread" style="border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:12px;margin-bottom:10px">';
      html += '<div style="font-weight:600;margin-bottom:6px">' + esc(first.subject || 'No Subject') + '</div>';
      msgs.forEach(m => {
        const isProvider = m.fromType === 'provider';
        html += '<div style="padding:6px 0;border-top:1px solid var(--border,#e2e8f0);font-size:13px">';
        html += '<strong>' + esc(m.fromName || (isProvider ? 'Provider' : 'You')) + ':</strong> ';
        html += esc(m.body || '');
        html += '<div class="text-muted text-sm">' + (m.sentAt ? formatDateTime(m.sentAt) : '') + '</div>';
        html += '</div>';
      });

      // Reply button
      html += '<button class="btn btn-secondary btn-sm portal-reply-btn" data-thread="' + esc(tid) + '" data-patient="' + esc(patient.id) + '" style="margin-top:8px">Reply</button>';
      html += '</div>';
    });
  }
  html += '</div>';
  container.innerHTML = html;

  // Reply handlers
  container.querySelectorAll('.portal-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const threadId = btn.dataset.thread;
      const patientId = btn.dataset.patient;
      openPortalReplyModal(threadId, patientId, patient);
    });
  });
}

function openPortalReplyModal(threadId, patientId, patient) {
  const bodyHTML = '<div class="form-group"><label class="form-label">Your Reply</label>' +
    '<textarea class="form-control" id="portal-reply-body" rows="4" placeholder="Type your reply..."></textarea></div>';

  openModal({
    title: 'Reply to Message',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="portal-reply-send" style="background:#0d9488">Send Reply</button>',
  });

  document.getElementById('portal-reply-send').addEventListener('click', () => {
    const body = document.getElementById('portal-reply-body').value.trim();
    if (!body) { showToast('Please enter a reply.', 'error'); return; }

    saveMessage({
      threadId: threadId,
      type: 'general',
      fromType: 'patient',
      fromId: patientId,
      fromName: patient.firstName + ' ' + patient.lastName,
      toType: 'provider',
      toId: '',
      toName: '',
      patientId: patientId,
      subject: 'Re: Message',
      body: body,
      priority: 'Normal',
      read: false,
    });

    closeModal();
    showToast('Reply sent.', 'success');
    renderPatientPortal();
  });
}

function renderPortalAppointments(container, patient) {
  const appointments = typeof getAppointmentsByPatient === 'function' ? getAppointmentsByPatient(patient.id) : [];
  const upcoming = appointments.filter(a => new Date(a.dateTime) > new Date() && a.status !== 'Cancelled')
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  let html = '<div class="portal-card"><h3>Upcoming Appointments</h3>';
  if (upcoming.length === 0) {
    html += '<p class="text-muted">No upcoming appointments.</p>';
  } else {
    upcoming.forEach(apt => {
      const provider = getProvider(apt.providerId);
      const provName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : 'Provider';
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--border,#e2e8f0)">';
      html += '<div style="font-weight:600">' + formatDateTime(apt.dateTime) + '</div>';
      html += '<div class="text-muted text-sm">' + esc(apt.type || 'Appointment') + ' with ' + esc(provName) + '</div>';
      if (apt.reason) html += '<div class="text-sm">' + esc(apt.reason) + '</div>';
      html += '</div>';
    });
  }
  html += '</div>';
  container.innerHTML = html;
}
