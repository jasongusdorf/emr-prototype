/* ============================================================
   app.js — Router, topbar, modal, toast, init
   Runs last; assumes data.js and all view files are loaded.
   ============================================================ */

/* ---------- Topbar ---------- */
function setTopbar({ title = '', meta = '', actions = '' }) {
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-meta').textContent = meta;
  // actions is trusted HTML built internally by view files
  document.getElementById('topbar-actions').innerHTML = actions;
}

function setActiveNav(name) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === name);
  });
}

/* ---------- Modal ---------- */
let _modalCloseCallback = null;

function openModal({ title, bodyHTML, footerHTML, size = '', onClose = null }) {
  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('modal');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML   = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;

  modal.className = 'modal' + (size ? ' modal-' + size : '');
  backdrop.classList.remove('hidden');
  _modalCloseCallback = onClose;

  // Focus first input
  const first = modal.querySelector('input, select, textarea, button');
  if (first) setTimeout(() => first.focus(), 50);

  // Focus trap
  _modalFocusTrap = function(e) {
    if (e.key !== 'Tab') return;
    const focusable = modal.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"]), a[href]');
    if (focusable.length === 0) return;
    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
    } else {
      if (document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  };
  document.addEventListener('keydown', _modalFocusTrap);
}

let _modalFocusTrap = null;

function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
  document.getElementById('modal-body').innerHTML   = '';
  document.getElementById('modal-footer').innerHTML = '';
  if (_modalFocusTrap) { document.removeEventListener('keydown', _modalFocusTrap); _modalFocusTrap = null; }
  if (typeof _modalCloseCallback === 'function') {
    _modalCloseCallback();
    _modalCloseCallback = null;
  }
}

/* ---------- Toast ---------- */
function showToast(message, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type !== 'default' ? ' toast-' + type : '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, duration);
}

/* ---------- Confirm ---------- */
function confirmAction({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';

  const box = document.createElement('div');
  box.className = 'confirm-box';

  const h3 = document.createElement('h3');
  h3.textContent = title;

  const p = document.createElement('p');
  p.textContent = message;

  const actions = document.createElement('div');
  actions.className = 'confirm-box-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => overlay.remove();

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  confirmBtn.textContent = confirmLabel;
  confirmBtn.onclick = () => { overlay.remove(); onConfirm(); };

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  box.appendChild(h3);
  box.appendChild(p);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  confirmBtn.focus();
}

/* ---------- Encounter Mode ---------- */
function applyEncounterMode() {
  const mode = getEncounterMode();
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  // Hide/show Schedule nav
  const scheduleNav = document.querySelector('.nav-item[data-nav="schedule"]');
  if (scheduleNav) {
    scheduleNav.classList.toggle('mode-hidden', mode === 'inpatient');
  }
  if (typeof updateInboxBadge === 'function') updateInboxBadge();
}

function initEncounterModeToggle() {
  const toggle = document.querySelector('.encounter-mode-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', e => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    const mode = btn.dataset.mode;
    setEncounterMode(mode);
    applyEncounterMode();
    // If on schedule in inpatient mode, redirect
    if (mode === 'inpatient' && location.hash === '#schedule') {
      navigate('#dashboard');
    } else {
      route();
    }
  });
  applyEncounterMode();
}

/* ---------- Hash router ---------- */
function route() {
  const hash = location.hash || '#dashboard';
  const parts = hash.slice(1).split('/');
  const view  = parts[0];
  const param = parts[1];

  document.getElementById('app').classList.remove('chart-view');

  switch (view) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'chart':
      if (param) renderChart(param, parts[2] || 'overview');
      else navigate('#dashboard');
      break;
    case 'encounter':
      if (param) renderEncounter(param);
      else navigate('#dashboard');
      break;
    case 'orders':
      if (param) renderOrders(param);
      else navigate('#dashboard');
      break;
    case 'schedule':
      if (getEncounterMode() === 'inpatient') { navigate('#dashboard'); return; }
      renderSchedule();
      break;
    case 'inbox':
      renderInbox();
      break;
    case 'providers':
      renderProviders();
      break;
    case 'admin':
      if (isAdmin()) renderAdmin();
      else navigate('#dashboard');
      break;
    default:
      navigate('#dashboard');
  }
}

function navigate(hash) {
  location.hash = hash;
}

/* ---------- Modal close button / backdrop click ---------- */
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-backdrop').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-backdrop')) closeModal();
});

/* ---------- Dark Mode ---------- */
function initDarkMode() {
  const saved = localStorage.getItem('emr_dark_mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark-mode');
  } else if (saved === 'light') {
    document.body.classList.add('light-mode');
  }
  const btn = document.getElementById('dark-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      document.body.classList.toggle('light-mode', !isDark);
      localStorage.setItem('emr_dark_mode', isDark ? 'dark' : 'light');
      btn.textContent = isDark ? '🌙' : '☀️';
    });
    btn.textContent = document.body.classList.contains('dark-mode') ? '🌙' : '☀️';
  }
}

/* ---------- Keyboard Shortcuts ---------- */
function isTyping(e) {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function openShortcutsHelp() {
  const shortcuts = [
    ['?',         'Show keyboard shortcuts'],
    ['⌘K / Ctrl+K', 'Open clinical calculators'],
    ['⌘P / Ctrl+P', 'Print patient summary (on chart)'],
    ['/',           'Toggle chart search (on chart)'],
    ['⌘↵ / Ctrl+↵', 'Save note (on encounter)'],
    ['Esc',         'Close modal'],
  ];

  const body = document.createElement('div');
  body.className = 'shortcuts-grid';
  shortcuts.forEach(([key, desc]) => {
    const keys = document.createElement('div');
    keys.className = 'shortcut-keys';
    key.split(' / ').forEach((k, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.textContent = '/';
        sep.style.color = 'var(--text-muted)';
        keys.appendChild(sep);
      }
      const kbd = document.createElement('span');
      kbd.className = 'kbd';
      kbd.textContent = k;
      keys.appendChild(kbd);
    });
    const d = document.createElement('div');
    d.className = 'shortcut-desc';
    d.textContent = desc;
    body.appendChild(keys);
    body.appendChild(d);
  });

  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('modal');
  document.getElementById('modal-title').textContent = 'Keyboard Shortcuts';
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-body').appendChild(body);
  document.getElementById('modal-footer').innerHTML = '<button class="btn btn-secondary" id="sc-close">Close</button>';
  modal.className = 'modal';
  backdrop.classList.remove('hidden');
  document.getElementById('sc-close').addEventListener('click', closeModal);
}

let _keyboardHandler = null;
function initKeyboardShortcuts() {
  // Remove previous handler to prevent duplicates on re-login
  if (_keyboardHandler) document.removeEventListener('keydown', _keyboardHandler);
  _keyboardHandler = e => {
    // Escape: close modal
    if (e.key === 'Escape') {
      const backdrop = document.getElementById('modal-backdrop');
      if (!backdrop.classList.contains('hidden')) { closeModal(); return; }
    }

    // Shortcuts requiring non-typing context
    if (!isTyping(e)) {
      if (e.key === '?') { e.preventDefault(); openShortcutsHelp(); return; }

      if (e.key === '/') {
        const searchToggle = document.getElementById('chart-search-toggle');
        if (searchToggle) { e.preventDefault(); searchToggle.click(); return; }
      }
    }

    // Ctrl/Cmd shortcuts (work even in text fields for some)
    const isMod = e.ctrlKey || e.metaKey;
    if (isMod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (typeof openCalculatorsModal === 'function') openCalculatorsModal();
      return;
    }
    if (isMod && (e.key === 'p' || e.key === 'P')) {
      if (_currentChartPatientId) {
        e.preventDefault();
        if (typeof printPatientSummary === 'function') printPatientSummary(_currentChartPatientId);
      }
      return;
    }
    if (isMod && e.key === 'Enter') {
      const ta = document.querySelector('.note-textarea');
      if (ta) { e.preventDefault(); ta.dispatchEvent(new Event('input')); }
    }
  };
  document.addEventListener('keydown', _keyboardHandler);
}

/* ---------- Calculators nav link ---------- */
function initCalculatorsNav() {
  const link = document.getElementById('nav-calculators');
  if (link) {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (typeof openCalculatorsModal === 'function') openCalculatorsModal();
    });
  }
}

/* ---------- Auth UI ---------- */
function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('shell').classList.remove('hidden');
  const user = getSessionUser();
  if (user) {
    const el = document.getElementById('logged-in-user');
    if (el) el.textContent = user.firstName + ' ' + user.lastName + ', ' + user.degree;
    // Show/hide admin nav
    const adminNav = document.getElementById('nav-admin');
    const adminLabel = document.getElementById('admin-section-label');
    const isAdminUser = user.role === 'admin';
    if (adminNav) adminNav.classList.toggle('hidden', !isAdminUser);
    if (adminLabel) adminLabel.classList.toggle('hidden', !isAdminUser);
  }
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('shell').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('pending-screen').classList.add('hidden');
  document.getElementById('password-change-screen').classList.add('hidden');
  document.getElementById('forgot-form').classList.add('hidden');
}

function initLoginDarkToggle() {
  const btn = document.getElementById('login-dark-toggle');
  if (!btn) return;
  btn.textContent = document.body.classList.contains('dark-mode') ? '🌙' : '☀️';
  btn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('emr_dark_mode', isDark ? 'dark' : 'light');
    btn.textContent = isDark ? '🌙' : '☀️';
    // Sync the sidebar toggle too
    const sidebarBtn = document.getElementById('dark-toggle');
    if (sidebarBtn) sidebarBtn.textContent = isDark ? '🌙' : '☀️';
  });
}

/* ---------- Post-login routing ---------- */
function handlePostLogin(user) {
  // Backwards compat: treat missing status as active
  const status = user.status || 'active';
  if (status === 'pending') {
    showPendingApprovalScreen();
    return;
  }
  if (user.mustChangePassword) {
    showForcePasswordChangeScreen();
    return;
  }
  showApp();
  initAppAfterAuth();
}

function showPendingApprovalScreen() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('password-change-screen').classList.add('hidden');
  document.getElementById('pending-screen').classList.remove('hidden');
}

function showForcePasswordChangeScreen() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('pending-screen').classList.add('hidden');
  document.getElementById('password-change-screen').classList.remove('hidden');
}

/* ---------- Session timeout (15 min) ---------- */
let _sessionTimerId = null;
let _activityThrottleTimer = null;
let _sessionWarningShown = false;

function startSessionTimer() {
  // Clean up any existing timer/listeners first (prevents memory leak on re-login)
  stopSessionTimer();
  _sessionWarningShown = false;

  // Throttled activity listeners
  const activityHandler = () => {
    if (_activityThrottleTimer) return;
    _activityThrottleTimer = setTimeout(() => {
      updateSessionActivity();
      _sessionWarningShown = false;
      _activityThrottleTimer = null;
    }, 30000);
  };

  ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, activityHandler, { passive: true });
  });

  // Check every 30s
  _sessionTimerId = setInterval(() => {
    if (isSessionExpired(15)) {
      logSystemAudit('SESSION_TIMEOUT', (getSessionUser() || {}).id || '', '', 'Session timed out', (getSessionUser() || {}).email || '');
      stopSessionTimer();
      logout();
      showLogin();
      showToast('Your session has expired due to inactivity.', 'error', 5000);
      return;
    }
    // Warning at 13 min (show only once per activity cycle)
    if (!_sessionWarningShown && isSessionExpired(13)) {
      _sessionWarningShown = true;
      showToast('Your session will expire in 2 minutes due to inactivity.', 'warning', 5000);
    }
  }, 30000);

  // Store handler ref for cleanup
  _sessionTimerId._activityHandler = activityHandler;
}

function stopSessionTimer() {
  if (_sessionTimerId) {
    const handler = _sessionTimerId._activityHandler;
    clearInterval(_sessionTimerId);
    if (handler) {
      ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt => {
        document.removeEventListener(evt, handler);
      });
    }
    _sessionTimerId = null;
  }
  if (_activityThrottleTimer) {
    clearTimeout(_activityThrottleTimer);
    _activityThrottleTimer = null;
  }
}

/* ---------- Admin badge ---------- */
function updateAdminBadge() {
  const badge = document.getElementById('admin-badge');
  if (!badge) return;
  const count = getPendingUsers().length;
  badge.textContent = count > 0 ? count : '';
  badge.style.display = count > 0 ? '' : 'none';
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw    = document.getElementById('login-password').value;
    if (!email || !pw) { showToast('Please fill in all fields.', 'error'); return; }

    const result = await login(email, pw);
    if (!result.ok) { showToast(result.error, 'error'); return; }

    // Set current provider to matching provider
    const providers = getProviders();
    const match = providers.find(p => p.email === result.user.email);
    if (match) setCurrentProvider(match.id);

    form.reset();
    handlePostLogin(result.user);
  });

  document.getElementById('show-register').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
  });
}

function initRegisterForm() {
  const form = document.getElementById('register-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const first   = document.getElementById('reg-first').value.trim();
    const last    = document.getElementById('reg-last').value.trim();
    const dob     = document.getElementById('reg-dob').value;
    const npi     = document.getElementById('reg-npi').value.trim();
    const email   = document.getElementById('reg-email').value.trim();
    const phone   = document.getElementById('reg-phone').value.trim();
    const degree  = document.getElementById('reg-degree').value;
    const pw      = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (!first || !last || !email || !degree || !pw) {
      showToast('Please fill in all required fields.', 'error'); return;
    }
    const strength = validatePasswordStrength(pw);
    if (!strength.valid) {
      showToast('Password: ' + strength.errors.join(', '), 'error'); return;
    }
    if (pw !== confirm) {
      showToast('Passwords do not match.', 'error'); return;
    }
    if (getUserByEmail(email)) {
      showToast('An account with that email already exists.', 'error'); return;
    }

    // Map degree to appropriate RBAC role
    const degreeToRole = { 'MD': 'attending', 'DO': 'attending', 'NP': 'nurse', 'PA': 'attending', 'RN': 'nurse', 'PhD': 'user' };
    const degreeToProvRole = { 'MD': 'Attending', 'DO': 'Attending', 'NP': 'Nurse', 'PA': 'Attending', 'RN': 'Nurse', 'PhD': 'Attending' };
    const userRole = degreeToRole[degree] || 'user';
    const providerRole = degreeToProvRole[degree] || 'Attending';

    const passwordHash = await hashPassword(pw);
    const user = saveUser({
      firstName: first,
      lastName: last,
      dob,
      npiNumber: npi,
      email,
      phone,
      degree,
      passwordHash,
      role: userRole,
    });

    // Create matching provider record
    saveProvider({
      id: user.id,
      firstName: first,
      lastName: last,
      degree,
      role: providerRole,
      npiNumber: npi,
      email,
      phone,
    });

    form.reset();
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    showToast('Account created! An administrator must approve your account before you can sign in.', 'success', 5000);
  });

  document.getElementById('show-login').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
  });
}

function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      stopSessionTimer();
      logout();
      showLogin();
      showToast('Signed out.');
    });
  }
}

/* ---------- Mobile sidebar toggle ---------- */
function initSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  // Close sidebar when a nav item is clicked (mobile)
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) sidebar.classList.remove('open');
    });
  });
  // Close sidebar overlay when clicking main content on mobile
  document.getElementById('main').addEventListener('click', () => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });
}

/* ---------- App init after authentication ---------- */
function initAppAfterAuth() {
  initKeyboardShortcuts();
  initCalculatorsNav();
  initEncounterModeToggle();
  initSidebarToggle();
  if (typeof updateInboxBadge === 'function') updateInboxBadge();
  startSessionTimer();
  updateSessionActivity();
  updateAdminBadge();
  window.removeEventListener('hashchange', route);
  window.addEventListener('hashchange', route);
  route();
}

/* ---------- Init ---------- */
async function init() {
  await seedIfEmpty();
  initDarkMode();
  initLoginDarkToggle();
  initLoginForm();
  initRegisterForm();
  initLogout();
  initPendingSignout();
  initForgotPassword();
  initForcePasswordChange();

  if (isAuthenticated()) {
    if (isSessionExpired(15)) {
      logout();
      showLogin();
      showToast('Your session has expired. Please sign in again.', 'error');
    } else {
      const user = getSessionUser();
      if (user) {
        handlePostLogin(user);
      } else {
        showLogin();
      }
    }
  } else {
    showLogin();
  }
}

function initPendingSignout() {
  const btn = document.getElementById('pending-signout');
  if (btn) {
    btn.addEventListener('click', () => {
      logout();
      showLogin();
      showToast('Signed out.');
    });
  }
}

function initForgotPassword() {
  const showForgot = document.getElementById('show-forgot');
  if (showForgot) {
    showForgot.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('forgot-form').classList.remove('hidden');
      document.getElementById('forgot-result').classList.add('hidden');
    });
  }

  const backBtn = document.getElementById('forgot-back-login');
  if (backBtn) {
    backBtn.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('forgot-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
    });
  }

  const form = document.getElementById('forgot-password-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      if (!email) { showToast('Please enter your email.', 'error'); return; }

      const user = getUserByEmail(email);
      if (!user) {
        showToast('If an account exists with that email, a reset has been initiated.', 'success');
        return;
      }

      const tempPw = await resetPasswordForUser(user.id, null);
      if (tempPw) {
        document.getElementById('forgot-temp-pw').textContent = tempPw;
        document.getElementById('forgot-result').classList.remove('hidden');
        showToast('Temporary password generated.', 'success');
      }
    });
  }
}

function initForcePasswordChange() {
  const form = document.getElementById('force-password-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const pw = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-new-password').value;

    if (pw !== confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    const strength = validatePasswordStrength(pw);
    if (!strength.valid) {
      showToast('Password: ' + strength.errors.join(', '), 'error');
      return;
    }

    const user = getSessionUser();
    if (!user) { showLogin(); return; }
    const result = await changePassword(user.id, pw);
    if (result && result.error) {
      showToast('Password: ' + result.errors.join(', '), 'error');
      return;
    }
    if (result === false) {
      showToast('Failed to change password. Please try again.', 'error');
      return;
    }
    form.reset();
    showToast('Password changed successfully!', 'success');
    showApp();
    initAppAfterAuth();
  });

  const signoutBtn = document.getElementById('password-change-signout');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      logout();
      showLogin();
      showToast('Signed out.');
    });
  }
}

init();
