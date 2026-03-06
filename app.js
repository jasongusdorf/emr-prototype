/* ============================================================
   app.js — Router, topbar, modal, toast, init
   Runs last; assumes data.js and all view files are loaded.
   ============================================================ */

/* ---------- View Lifecycle / Cleanup (PR-2) ---------- */
var _viewCleanupFns = [];

function registerCleanup(fn) {
  _viewCleanupFns.push(fn);
}

function _cleanupCurrentView() {
  _viewCleanupFns.forEach(function(fn) {
    try { fn(); } catch(e) { console.warn('[EMR] View cleanup error:', e); }
  });
  _viewCleanupFns = [];
}

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
  document.querySelectorAll('.sidebar-fav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.favNav === name);
  });
}

/* ---------- Modal (with stacking support — PR-18) ---------- */
let _modalCloseCallback = null;
let _modalFocusTrap = null;
let _modalStack = [];

function _buildFocusTrap(modal) {
  return function(e) {
    if (e.key === 'Enter') {
      const active = document.activeElement;
      if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'BUTTON')) return;
      const footer = document.getElementById('modal-footer');
      const primary = footer && (footer.querySelector('.btn-success, .btn-primary, .btn-danger'));
      if (primary) { e.preventDefault(); primary.click(); }
      return;
    }
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
}

function openModal({ title, bodyHTML, footerHTML, size = '', onClose = null }) {
  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('modal');
  const bodyEl   = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  // Stack current modal if one is already open
  if (!backdrop.classList.contains('hidden')) {
    const savedBody = document.createDocumentFragment();
    while (bodyEl.firstChild) savedBody.appendChild(bodyEl.firstChild);
    const savedFooter = document.createDocumentFragment();
    while (footerEl.firstChild) savedFooter.appendChild(footerEl.firstChild);
    _modalStack.push({
      title: document.getElementById('modal-title').textContent,
      body: savedBody,
      footer: savedFooter,
      size: modal.className,
      onClose: _modalCloseCallback,
      focusTrap: _modalFocusTrap
    });
    if (_modalFocusTrap) document.removeEventListener('keydown', _modalFocusTrap);
  }

  document.getElementById('modal-title').textContent = title;
  bodyEl.innerHTML   = bodyHTML;
  footerEl.innerHTML = footerHTML;

  modal.className = 'modal' + (size ? ' modal-' + size : '');
  backdrop.classList.remove('hidden');
  _modalCloseCallback = onClose;

  // Focus first input
  const first = modal.querySelector('input, select, textarea, button');
  if (first) setTimeout(() => first.focus(), 50);

  // Focus trap
  _modalFocusTrap = _buildFocusTrap(modal);
  document.addEventListener('keydown', _modalFocusTrap);
}

function closeModal() {
  const bodyEl   = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  bodyEl.innerHTML   = '';
  footerEl.innerHTML = '';
  if (_modalFocusTrap) { document.removeEventListener('keydown', _modalFocusTrap); _modalFocusTrap = null; }

  if (typeof _modalCloseCallback === 'function') {
    const cb = _modalCloseCallback;
    _modalCloseCallback = null;
    cb();
  }

  // Restore stacked modal or hide backdrop
  if (_modalStack.length > 0) {
    const prev = _modalStack.pop();
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = prev.title;
    bodyEl.appendChild(prev.body);
    footerEl.appendChild(prev.footer);
    modal.className = prev.size;
    _modalCloseCallback = prev.onClose;
    _modalFocusTrap = prev.focusTrap;
    if (_modalFocusTrap) document.addEventListener('keydown', _modalFocusTrap);
    const first = modal.querySelector('input, select, textarea, button');
    if (first) setTimeout(() => first.focus(), 50);
  } else {
    document.getElementById('modal-backdrop').classList.add('hidden');
  }
}

function closeAllModals() {
  _modalStack = [];
  _modalCloseCallback = null;
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-footer').innerHTML = '';
  if (_modalFocusTrap) { document.removeEventListener('keydown', _modalFocusTrap); _modalFocusTrap = null; }
  document.getElementById('modal-backdrop').classList.add('hidden');
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
/* ---------- Context menu ---------- */
function showContextMenu(e, items) {
  e.preventDefault();
  e.stopPropagation();
  document.querySelectorAll('.ctx-menu').forEach(m => m.remove());

  const menu = document.createElement('div');
  menu.className = 'ctx-menu';

  items.forEach(item => {
    if (item === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'ctx-menu-sep';
      menu.appendChild(sep);
      return;
    }
    const btn = document.createElement('button');
    btn.className = 'ctx-menu-item' + (item.danger ? ' ctx-menu-danger' : '');
    btn.textContent = item.label;
    btn.addEventListener('click', () => { menu.remove(); item.action(); });
    menu.appendChild(btn);
  });

  // Position near cursor, keep within viewport
  document.body.appendChild(menu);
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let x = e.clientX, y = e.clientY;
  if (x + mw > window.innerWidth)  x = window.innerWidth  - mw - 4;
  if (y + mh > window.innerHeight) y = window.innerHeight - mh - 4;
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';

  const dismiss = () => { menu.remove(); document.removeEventListener('mousedown', dismiss); };
  setTimeout(() => document.addEventListener('mousedown', dismiss), 0);
}

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
  // Background color by mode
  document.body.classList.toggle('mode-outpatient', mode === 'outpatient');
  document.body.classList.toggle('mode-inpatient', mode === 'inpatient');
  if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
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
  _cleanupCurrentView();
  closeAllModals();

  const hash = location.hash || '#dashboard';
  const parts = hash.slice(1).split('/');
  const view  = parts[0];
  const param = parts[1];

  document.getElementById('app').classList.remove('chart-view');
  const _oldChartHeader = document.getElementById('chart-header-bars');
  if (_oldChartHeader) _oldChartHeader.remove();

  try {
    switch (view) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'patients':
        renderPatients();
        break;
      case 'recents':
        renderRecents();
        break;
      case 'chart':
        if (param) { trackRecentPatient(param); renderChart(param); }
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
        renderInbox(param);
        break;
      case 'messages':
        if (typeof renderMessages === 'function') renderMessages();
        else navigate('#dashboard');
        break;
      case 'settings':
        if (typeof renderSettings === 'function') renderSettings();
        else navigate('#dashboard');
        break;
      case 'reference':
        if (typeof renderReference === 'function') renderReference();
        else navigate('#dashboard');
        break;
      case 'providers':
        renderProviders();
        break;
      case 'list':
        if (param && typeof renderPatientList === 'function') renderPatientList(param);
        else navigate('#dashboard');
        break;
      case 'smart-list':
        if (param && typeof renderSmartList === 'function') renderSmartList(param);
        else navigate('#dashboard');
        break;
      case 'secure-chat':
        if (typeof renderSecureChat === 'function') renderSecureChat();
        else navigate('#dashboard');
        break;
      case 'billing':
        if (typeof renderBilling === 'function') renderBilling();
        else navigate('#dashboard');
        break;
      case 'prior-auth':
        if (typeof renderPriorAuth === 'function') renderPriorAuth(param);
        else navigate('#dashboard');
        break;
      case 'slicer':
        if (typeof renderSlicer === 'function') renderSlicer();
        else navigate('#dashboard');
        break;
      case 'care-gaps':
        if (typeof renderCareGaps === 'function') renderCareGaps();
        else navigate('#dashboard');
        break;
      case 'reminders':
        if (typeof renderRemindersView === 'function') renderRemindersView();
        else navigate('#dashboard');
        break;
      case 'admin':
        if (isAdmin()) renderAdmin();
        else navigate('#dashboard');
        break;
      default:
        navigate('#dashboard');
    }
  } catch (err) {
    console.error('[EMR] View render error (' + view + '):', err);
    const app = document.getElementById('app');
    app.innerHTML = '<div style="padding:40px;max-width:600px;margin:0 auto;text-align:center">' +
      '<h2 style="color:var(--danger,#dc3545)">Something went wrong</h2>' +
      '<p style="color:var(--text-secondary,#666);margin:12px 0">The <strong>' + esc(view) + '</strong> view encountered an error.</p>' +
      '<pre style="text-align:left;background:var(--bg-card,#f8f9fa);padding:12px;border-radius:6px;font-size:13px;overflow:auto;max-height:200px">' + esc(err.message || String(err)) + '</pre>' +
      '<button class="btn btn-primary" style="margin-top:16px" onclick="navigate(\'#dashboard\')">Back to Dashboard</button>' +
      '</div>';
    showToast('View error: ' + (err.message || 'Unknown error'), 'error');
  }
}

function navigate(hash) {
  location.hash = hash;
}

/* ---------- Global patient name link helper ---------- */
function makePatientLink(patientId, displayName) {
  const btn = document.createElement('button');
  btn.className = 'patient-name-link';
  btn.textContent = displayName;
  btn.addEventListener('click', (e) => { e.stopPropagation(); navigate('#chart/' + patientId); });
  return btn;
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
}

/* ---------- Keyboard Shortcuts ---------- */
function isTyping(e) {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

const DEFAULT_KEYBINDS = [
  { id: 'patients',     label: 'Go to Patients',        description: 'Open the patient list',                   key: 'p', shift: false },
  { id: 'orders',       label: 'Go to Orders',           description: 'Open the orders section (chart view only)', key: 'o', shift: false },
  { id: 'dashboard',   label: 'Go to Home',             description: 'Open the home dashboard',                 key: 'g', shift: false },
  { id: 'schedule',    label: 'Go to Schedule',         description: 'Open the schedule',                       key: 'd', shift: false },
  { id: 'messages',    label: 'Go to Messages',         description: 'Open patient messages',                   key: 'm', shift: false },
  { id: 'inbox',       label: 'Go to Inbox',            description: 'Open the inbox',                          key: 'i', shift: false },
  { id: 'reference',   label: 'Go to Reference',        description: 'Open reference materials',                key: 'e', shift: false },
  { id: 'calculators', label: 'Open Tools',             description: 'Open calculators and tools',              key: 'k', shift: false },
  { id: 'new-patient', label: 'New Patient',            description: 'Open the new patient form',               key: 'n', shift: false },
  { id: 'settings',    label: 'Go to Settings',         description: 'Open settings',                           key: ',', shift: false },
  { id: 'print',       label: 'Print Patient Summary',  description: 'Print current patient (chart view only)', key: 'p', shift: true  },
  { id: 'search-patients', label: 'Search Patients', description: 'Focus the patient search bar', key: 'f', shift: false },
];

function getKeybindActions() {
  return {
    patients:      () => navigate('#patients'),
    orders:        () => {
      if (!_currentChartPatientId || !location.hash.startsWith('#chart/')) return;
      if (typeof _scrollToSection === 'function') _scrollToSection('section-orders', _currentChartPatientId);
    },
    dashboard:     () => navigate('#dashboard'),
    schedule:      () => navigate('#schedule'),
    messages:      () => navigate('#messages'),
    inbox:         () => navigate('#inbox'),
    reference:     () => navigate('#reference'),
    calculators:   () => { if (typeof openCalculatorsModal === 'function') openCalculatorsModal(); },
    'new-patient': () => { if (typeof openNewPatientModal === 'function') openNewPatientModal(); },
    settings:      () => navigate('#settings'),
    print:         () => { if (_currentChartPatientId && typeof printPatientSummary === 'function') printPatientSummary(_currentChartPatientId); },
    'search-patients': () => {
      const patSearch = document.getElementById('patient-search');
      const sideSearch = document.getElementById('sidebar-search');
      if (patSearch) { patSearch.focus(); }
      else if (sideSearch) { sideSearch.focus(); }
    },
  };
}

function getKeybinds() {
  const saved = JSON.parse(localStorage.getItem('emr_keybinds') || 'null');
  if (!saved) return DEFAULT_KEYBINDS.map(b => ({ ...b }));
  return DEFAULT_KEYBINDS.map(b => {
    const s = saved.find(x => x.id === b.id);
    return s ? { ...b, key: s.key, shift: s.shift } : { ...b };
  });
}

function saveKeybinds(binds) {
  localStorage.setItem('emr_keybinds', JSON.stringify(binds.map(b => ({ id: b.id, key: b.key, shift: b.shift }))));
  initKeyboardShortcuts();
}

function formatKeybind(key, shift) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const mod = isMac ? '⌘' : 'Ctrl+';
  const shiftStr = shift ? (isMac ? '⇧' : 'Shift+') : '';
  const keyStr = key === ',' ? ',' : key.toUpperCase();
  return mod + shiftStr + keyStr;
}

function openShortcutsHelp() {
  const body = document.createElement('div');
  body.className = 'shortcuts-grid';

  // Dynamic rebindable shortcuts
  getKeybinds().forEach(b => {
    const keys = document.createElement('div');
    keys.className = 'shortcut-keys';
    const kbd = document.createElement('span');
    kbd.className = 'kbd';
    kbd.textContent = formatKeybind(b.key, b.shift);
    keys.appendChild(kbd);
    const d = document.createElement('div');
    d.className = 'shortcut-desc';
    d.textContent = b.label;
    body.appendChild(keys);
    body.appendChild(d);
  });

  // Divider
  const divider = document.createElement('div');
  divider.style.cssText = 'grid-column:1/-1;border-top:1px solid var(--border);margin:8px 0;';
  body.appendChild(divider);

  // Non-rebindable hardcoded shortcuts
  const hardcoded = [
    ['?',         'Show keyboard shortcuts'],
    ['/',         'Toggle chart search (chart only)'],
    ['⌘↵ / Ctrl+↵', 'Save note (encounter only)'],
    ['Esc',       'Close modal'],
  ];
  hardcoded.forEach(([key, desc]) => {
    const keys = document.createElement('div');
    keys.className = 'shortcut-keys';
    key.split(' / ').forEach((k, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.textContent = ' / ';
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

  // Build dynamic keybind map from saved/default bindings
  const binds = getKeybinds();
  const actions = getKeybindActions();
  const bindMap = {};
  binds.forEach(b => {
    const combo = (b.shift ? 'shift+' : '') + b.key.toLowerCase();
    bindMap[combo] = actions[b.id];
  });

  _keyboardHandler = e => {
    // Escape: close modal (non-rebindable)
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

    const isMod = e.ctrlKey || e.metaKey;

    // Cmd+Enter: save note (non-rebindable)
    if (isMod && e.key === 'Enter') {
      const ta = document.querySelector('.note-textarea');
      if (ta) { e.preventDefault(); ta.dispatchEvent(new Event('input')); }
      return;
    }

    // Cmd+N in messages → compose new message (context-sensitive, takes priority)
    if (isMod && !e.shiftKey && e.key.toLowerCase() === 'n' && location.hash === '#messages') {
      if (typeof openMessagesComposeModal === 'function') {
        e.preventDefault();
        openMessagesComposeModal();
        return;
      }
    }

    // Cmd+S in orders → place order (context-sensitive)
    if (isMod && !e.shiftKey && e.key.toLowerCase() === 's' && location.hash.startsWith('#orders/')) {
      if (typeof placeOrder === 'function' && typeof _ordersEncounterId !== 'undefined' && _ordersEncounterId) {
        const _oEnc = getEncounter(_ordersEncounterId);
        const _oPat = _oEnc ? getPatient(_oEnc.patientId) : null;
        if (_oEnc && _oPat) { e.preventDefault(); placeOrder(_oEnc, _oPat); return; }
      }
    }

    // Dynamic keybind dispatch
    if (isMod) {
      const combo = (e.shiftKey ? 'shift+' : '') + e.key.toLowerCase();
      const action = bindMap[combo];
      if (action) {
        e.preventDefault();
        action();
      }
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

  // Remember email: pre-fill on load
  const remembered = localStorage.getItem('emr_remembered_email');
  if (remembered) {
    document.getElementById('login-email').value = remembered;
    const cb = document.getElementById('login-remember');
    if (cb) cb.checked = true;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw    = document.getElementById('login-password').value;
    if (!email || !pw) { showToast('Please fill in all fields.', 'error'); return; }

    // Remember email preference
    const rememberCb = document.getElementById('login-remember');
    if (rememberCb && rememberCb.checked) {
      localStorage.setItem('emr_remembered_email', email);
    } else {
      localStorage.removeItem('emr_remembered_email');
    }

    try {
      const result = await login(email, pw);
      if (!result.ok) {
        // Show error directly on login form so it's always visible
        let errEl = document.getElementById('login-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.id = 'login-error';
          errEl.style.cssText = 'background:#fecaca;color:#991b1b;padding:10px 14px;border-radius:6px;font-size:13px;margin-bottom:12px;border:1px solid #f87171';
          form.insertBefore(errEl, form.querySelector('button[type="submit"]'));
        }
        errEl.textContent = result.error;
        showToast(result.error, 'error');
        return;
      }

      // Set current provider to matching provider
      const providers = getProviders();
      const match = providers.find(p => p.email === result.user.email);
      if (match) setCurrentProvider(match.id);

      form.reset();
      // Re-fill remembered email after reset
      if (rememberCb && rememberCb.checked) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-remember').checked = true;
      }
      handlePostLogin(result.user);
    } catch (err) {
      console.error('Login error:', err);
      let errEl = document.getElementById('login-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'login-error';
        errEl.style.cssText = 'background:#fecaca;color:#991b1b;padding:10px 14px;border-radius:6px;font-size:13px;margin-bottom:12px;border:1px solid #f87171';
        form.insertBefore(errEl, form.querySelector('button[type="submit"]'));
      }
      errEl.textContent = 'Login failed: ' + (err.message || 'Unknown error');
      showToast('Login failed: ' + (err.message || 'Unknown error'), 'error');
    }
  });

  document.getElementById('show-register').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
  });

  const portalLink = document.getElementById('show-patient-portal');
  if (portalLink) {
    portalLink.addEventListener('click', e => {
      e.preventDefault();
      if (typeof showPatientLoginForm === 'function') showPatientLoginForm();
    });
  }
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
    document.body.classList.toggle('sidebar-open');
  });
  // Close sidebar when a nav item is clicked (mobile)
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) document.body.classList.remove('sidebar-open');
    });
  });
  // Close sidebar overlay when clicking main content on mobile
  document.getElementById('main').addEventListener('click', () => {
    if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-open')) {
      document.body.classList.remove('sidebar-open');
    }
  });
}

/* ---------- Feature: Collapsible Sidebar ---------- */
function initSidebarCollapse() {
  const btn = document.getElementById('sidebar-collapse-btn');
  if (!btn) return;
  const shell = document.getElementById('shell');
  if (localStorage.getItem('emr_sidebar_collapsed') === '1') {
    shell.classList.add('sidebar-collapsed');
  }
  btn.addEventListener('click', () => {
    shell.classList.toggle('sidebar-collapsed');
    localStorage.setItem('emr_sidebar_collapsed', shell.classList.contains('sidebar-collapsed') ? '1' : '0');
  });
}

/* ---------- Feature: Quick Patient Search ---------- */
let _sidebarSearchTimer = null;
function initSidebarSearch() {
  const input = document.getElementById('sidebar-search');
  const results = document.getElementById('sidebar-search-results');
  if (!input || !results) return;

  input.addEventListener('input', () => {
    clearTimeout(_sidebarSearchTimer);
    _sidebarSearchTimer = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.classList.add('hidden'); results.innerHTML = ''; return; }
      const patients = getPatients();
      const matches = patients.filter(p => {
        const full = ((p.firstName || '') + ' ' + (p.lastName || '')).toLowerCase();
        const mrn = (p.mrn || '').toLowerCase();
        return full.includes(q) || mrn.includes(q);
      }).slice(0, 8);
      if (matches.length === 0) {
        results.innerHTML = '<div class="sidebar-search-no-results">No patients found</div>';
      } else {
        results.innerHTML = matches.map(p =>
          '<div class="sidebar-search-result" data-id="' + esc(p.id) + '">' +
            '<span class="sidebar-search-result-name">' + esc(p.firstName) + ' ' + esc(p.lastName) + '</span>' +
            '<span class="sidebar-search-result-mrn">' + esc(p.mrn) + '</span>' +
          '</div>'
        ).join('');
      }
      results.classList.remove('hidden');
    }, 150);
  });

  results.addEventListener('click', e => {
    const row = e.target.closest('.sidebar-search-result');
    if (!row) return;
    const id = row.dataset.id;
    input.value = '';
    results.classList.add('hidden');
    results.innerHTML = '';
    navigate('#chart/' + id);
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768 && sidebar) sidebar.classList.remove('open');
  });

  // Close on click outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.sidebar-search-wrap')) {
      results.classList.add('hidden');
    }
  });

  // Close on Escape
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      results.classList.add('hidden');
      results.innerHTML = '';
      input.blur();
    }
  });
}

/* ---------- Feature: Recently Viewed Patients ---------- */
let _recentsPeriod = (() => { try { return parseInt(localStorage.getItem('emr_recents_period') || '30', 10); } catch(e) { return 30; } })();

function trackRecentPatient(patientId) {
  if (!patientId) return;
  let recents = [];
  try {
    const raw = JSON.parse(localStorage.getItem('emr_recent_patients') || '[]');
    recents = raw.map(r => typeof r === 'string' ? { id: r, viewedAt: 0 } : r);
  } catch(e) { recents = []; }
  recents = recents.filter(r => r.id !== patientId);
  recents.unshift({ id: patientId, viewedAt: Date.now() });
  recents = recents.slice(0, 200);
  localStorage.setItem('emr_recent_patients', JSON.stringify(recents));
}

function renderRecentPatients() { /* no-op — recents live on their own page */ }

function renderRecents() {
  const PERIODS = [
    { label: 'Past Week',    days: 7   },
    { label: 'Past Month',   days: 30  },
    { label: 'Past 6 Months', days: 180 },
    { label: 'Past Year',    days: 365 },
  ];

  const app = document.getElementById('app');
  app.innerHTML = '';
  setTopbar({ title: 'Recent Patients', meta: '', actions: '' });
  setActiveNav('recents');

  // Period picker
  const picker = document.createElement('div');
  picker.className = 'recents-period-picker';
  PERIODS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'recents-period-pill' + (_recentsPeriod === p.days ? ' active' : '');
    btn.textContent = p.label;
    btn.addEventListener('click', () => {
      _recentsPeriod = p.days;
      localStorage.setItem('emr_recents_period', p.days);
      renderRecents();
    });
    picker.appendChild(btn);
  });
  app.appendChild(picker);

  // Patient list
  const cutoff = Date.now() - _recentsPeriod * 86400000;
  let recents = [];
  try {
    const raw = JSON.parse(localStorage.getItem('emr_recent_patients') || '[]');
    recents = raw.map(r => typeof r === 'string' ? { id: r, viewedAt: 0 } : r);
  } catch(e) { recents = []; }

  const patients = getPatients();
  const items = recents
    .filter(r => r.viewedAt >= cutoff)
    .map(r => ({ patient: patients.find(p => p.id === r.id), viewedAt: r.viewedAt }))
    .filter(r => r.patient);

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="empty-state-icon">🕐</div><div class="empty-state-title">No recent patients</div><div class="empty-state-body">No patients viewed in the selected period.</div>';
    app.appendChild(empty);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = '<thead><tr><th>Name</th><th>MRN</th><th>DOB</th><th>Last Viewed</th></tr></thead>';
  const tbody = document.createElement('tbody');
  items.forEach(({ patient: p, viewedAt }) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => navigate('#chart/' + p.id));
    const when = viewedAt ? new Date(viewedAt).toLocaleDateString() : '—';
    tr.innerHTML = '<td><strong>' + esc(p.lastName) + ', ' + esc(p.firstName) + '</strong></td>'
      + '<td>' + esc(p.mrn || '—') + '</td>'
      + '<td>' + esc(p.dob || '—') + '</td>'
      + '<td>' + when + '</td>';
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  app.appendChild(wrap);
}

/* ---------- Feature: Favorites / Pinned Pages ---------- */
const PINNABLE_NAV_ITEMS = ['dashboard','schedule','calculators','reference','messages','inbox-labs','inbox-refills','inbox-notes','settings','providers','admin'];

function getPinnedNavItems() {
  try { return JSON.parse(localStorage.getItem('emr_pinned_nav') || '[]'); } catch(e) { return []; }
}
function savePinnedNavItems(arr) {
  localStorage.setItem('emr_pinned_nav', JSON.stringify(arr));
}

function togglePinNavItem(navKey) {
  let pinned = getPinnedNavItems();
  if (pinned.includes(navKey)) {
    pinned = pinned.filter(k => k !== navKey);
  } else {
    pinned.push(navKey);
  }
  savePinnedNavItems(pinned);
  renderFavorites();
  updatePinButtons();
}

function renderFavorites() {
  const container = document.getElementById('sidebar-favorites');
  if (!container) return;
  const pinned = getPinnedNavItems();
  if (pinned.length === 0) { container.innerHTML = ''; return; }

  let html = '<div class="sidebar-favorites-label">Favorites</div>';
  pinned.forEach(navKey => {
    const orig = document.querySelector('.nav-item[data-nav="' + navKey + '"]');
    if (!orig) return;
    const svgEl = orig.querySelector('svg');
    const svgHTML = svgEl ? svgEl.outerHTML : '';
    // Get the text content (excluding badge/button text)
    let label = '';
    orig.childNodes.forEach(n => {
      if (n.nodeType === 3) label += n.textContent;
    });
    label = label.trim();

    const href = navKey === 'calculators' ? '#' : (orig.getAttribute('href') || '#');
    html += '<a href="' + esc(href) + '" class="sidebar-fav-item" data-fav-nav="' + esc(navKey) + '">' +
      svgHTML +
      '<span>' + esc(label) + '</span>' +
      '<button class="sidebar-fav-unpin" data-unpin="' + esc(navKey) + '" title="Unpin">' +
        '&#9733;' +
      '</button>' +
    '</a>';
  });
  container.innerHTML = html;

  // Wire unpin buttons
  container.querySelectorAll('.sidebar-fav-unpin').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      togglePinNavItem(btn.dataset.unpin);
    });
  });

  // Wire calculators favorite click
  container.querySelectorAll('.sidebar-fav-item[data-fav-nav="calculators"]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      if (typeof openCalculatorsModal === 'function') openCalculatorsModal();
    });
  });

  // Sync active state
  const hash = location.hash || '#dashboard';
  const parts = hash.slice(1).split('/');
  const currentNav = _hashToNav(parts[0], parts[1]);
  container.querySelectorAll('.sidebar-fav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.favNav === currentNav);
  });
}

function _hashToNav(view, param) {
  if (view === 'inbox' && param) return 'inbox-' + param;
  return view;
}

function initPinButtons() {
  PINNABLE_NAV_ITEMS.forEach(navKey => {
    const navItem = document.querySelector('.nav-item[data-nav="' + navKey + '"]');
    if (!navItem) return;
    // Don't add duplicate pin buttons
    if (navItem.querySelector('.nav-pin-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'nav-pin-btn';
    btn.title = 'Pin to favorites';
    btn.dataset.pinNav = navKey;
    btn.innerHTML = '&#9734;'; // empty star
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      togglePinNavItem(navKey);
    });
    navItem.appendChild(btn);
  });
  updatePinButtons();
}

function updatePinButtons() {
  const pinned = getPinnedNavItems();
  document.querySelectorAll('.nav-pin-btn').forEach(btn => {
    const key = btn.dataset.pinNav;
    const isPinned = pinned.includes(key);
    btn.classList.toggle('pinned', isPinned);
    btn.innerHTML = isPinned ? '&#9733;' : '&#9734;'; // filled vs empty star
    btn.title = isPinned ? 'Unpin from favorites' : 'Pin to favorites';
  });
}

/* ---------- Remove a patient from recent history ---------- */
function removeFromRecents(patientId) {
  let recents = [];
  try { recents = JSON.parse(localStorage.getItem('emr_recent_patients') || '[]'); } catch(e) { recents = []; }
  recents = recents.filter(r => (typeof r === 'string' ? r : r.id) !== patientId);
  localStorage.setItem('emr_recent_patients', JSON.stringify(recents));
  if (_recentsOpen) renderRecentsPanel();
}

/* ---------- Sidebar context menus (event delegation) ---------- */
function _navItemLabel(el) {
  // Collect direct text nodes only (skips SVG, badges, buttons)
  let text = '';
  el.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) text += n.textContent; });
  return text.trim();
}

function initNavContextMenus() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.addEventListener('contextmenu', e => {
    // --- Recent patient links ---
    const recentItem = e.target.closest('.sidebar-recent-item');
    if (recentItem) {
      const patId = (recentItem.getAttribute('href') || '').replace('#chart/', '');
      const name = recentItem.textContent.trim();
      showContextMenu(e, [
        { label: 'Open Chart — ' + name, action: () => navigate('#chart/' + patId) },
        'separator',
        { label: 'Remove from Recents', action: () => removeFromRecents(patId) },
      ]);
      return;
    }

    // --- Favorites items ---
    const favItem = e.target.closest('.sidebar-fav-item');
    if (favItem) {
      const navKey = favItem.dataset.favNav;
      const label = _navItemLabel(favItem) || navKey;
      const href = favItem.getAttribute('href');
      showContextMenu(e, [
        { label: 'Open ' + label, action: () => {
            if (navKey === 'calculators') { if (typeof openCalculatorsModal === 'function') openCalculatorsModal(); }
            else if (href && href !== '#') navigate(href);
        }},
        'separator',
        { label: 'Unpin from Favorites', action: () => togglePinNavItem(navKey) },
      ]);
      return;
    }

    // --- Standard nav items ---
    const navItem = e.target.closest('.nav-item[data-nav]');
    if (!navItem) return;
    const navKey = navItem.dataset.nav;

    // List/smart-list items have their own handlers (stop propagation)
    if (navKey.startsWith('list-') || navKey.startsWith('smart-')) return;

    // Action-only items — give them a quick "open" context menu
    const actionKeys = { 'new-list': null, 'import-list': null, 'new-smart-list': null };
    if (navKey in actionKeys) return;

    const label = _navItemLabel(navItem);
    const href  = navItem.getAttribute('href');
    const items = [];

    // Open
    if (navKey === 'calculators') {
      items.push({ label: 'Open ' + label, action: () => { if (typeof openCalculatorsModal === 'function') openCalculatorsModal(); } });
    } else if (href && href !== '#') {
      items.push({ label: 'Open ' + label, action: () => navigate(href) });
    }

    // Pin / unpin
    if (PINNABLE_NAV_ITEMS.includes(navKey)) {
      const isPinned = getPinnedNavItems().includes(navKey);
      items.push('separator');
      items.push({ label: isPinned ? 'Unpin from Favorites' : 'Pin to Favorites', action: () => togglePinNavItem(navKey) });
    }

    // All Patients shortcut
    if (navKey === 'patients') {
      items.push('separator');
      items.push({ label: '+ New Patient', action: () => {
        navigate('#patients');
        setTimeout(() => { const btn = document.getElementById('btn-new-patient'); if (btn) btn.click(); }, 150);
      }});
    }

    if (items.length) showContextMenu(e, items);
  });
}

/* ---------- App init after authentication ---------- */
function initAppAfterAuth() {
  initKeyboardShortcuts();
  initCalculatorsNav();
  initEncounterModeToggle();
  initSidebarToggle();
  initSidebarCollapse();
  initSidebarSearch();
  initPinButtons();
  initNavContextMenus();
  renderFavorites();
  initSidebarSections();
  initSidebarResize();
  initListsNav();
  if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
  if (typeof refreshSidebarLists === 'function') refreshSidebarLists();
  startSessionTimer();
  updateSessionActivity();
  updateAdminBadge();
  window.removeEventListener('hashchange', route);
  window.addEventListener('hashchange', route);
  route();
}

function initSidebarSections() {
  // [toggleId, bodyId, storageKey, defaultOpen]
  const sections = [
    ['section-patients-toggle',  'section-patients-body',  'emr_section_patients',  true],
    ['section-clinical-toggle',  'section-clinical-body',  'emr_section_clinical',  true],
    ['section-analytics-toggle', 'section-analytics-body', 'emr_section_analytics', true],
    ['section-billing-toggle',   'section-billing-body',   'emr_section_billing',   true],
    ['section-messaging-toggle', 'section-messaging-body', 'emr_section_messaging', true],
    ['section-settings-toggle',  'section-settings-body',  'emr_section_settings',  true],
    ['my-lists-toggle',          'my-lists-body',          'emr_my_lists_open',     true],
  ];
  sections.forEach(([toggleId, bodyId, storageKey, defaultOpen]) => {
    const toggle = document.getElementById(toggleId);
    const body   = document.getElementById(bodyId);
    if (!toggle || !body) return;
    let open = localStorage.getItem(storageKey) !== 'false';
    const apply = () => {
      body.style.display = open ? '' : 'none';
      const arrow = toggle.querySelector('.sidebar-collapse-arrow');
      if (arrow) arrow.textContent = open ? '▾' : '▸';
    };
    apply();
    toggle.addEventListener('click', () => {
      open = !open;
      localStorage.setItem(storageKey, open);
      apply();
    });
  });
}

function initSidebarResize() {
  const handle  = document.getElementById('sidebar-resize-handle');
  const sidebar = document.getElementById('sidebar');
  const main    = document.getElementById('main');
  if (!handle || !sidebar) return;

  function applySidebarWidth(w) {
    const shell = document.getElementById('shell');
    if (shell) shell.style.gridTemplateColumns = w + 'px 1fr';
  }

  const saved = parseInt(localStorage.getItem('emr_sidebar_width') || '0', 10);
  if (saved >= 160 && saved <= 440) applySidebarWidth(saved);

  let startX, startWidth;
  handle.addEventListener('mousedown', e => {
    startX     = e.clientX;
    startWidth = sidebar.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });

  function onMove(e) {
    const w = Math.min(440, Math.max(160, startWidth + e.clientX - startX));
    applySidebarWidth(w);
  }

  function onUp() {
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('emr_sidebar_width', sidebar.offsetWidth);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
}

function initListsNav() {
  const newListBtn = document.getElementById('nav-new-list');
  if (newListBtn) {
    newListBtn.addEventListener('click', e => {
      e.preventDefault();
      if (typeof openCreateListModal === 'function') openCreateListModal();
    });
  }
  const importBtn = document.getElementById('nav-import-list');
  if (importBtn) {
    importBtn.addEventListener('click', e => {
      e.preventDefault();
      if (typeof openImportListModal === 'function') openImportListModal();
    });
  }
  const newSmartBtn = document.getElementById('nav-new-smart-list');
  if (newSmartBtn) {
    newSmartBtn.addEventListener('click', e => {
      e.preventDefault();
      if (typeof openCreateSmartListModal === 'function') openCreateSmartListModal();
    });
  }
}

/* ---------- Init ---------- */
async function init() {
  try {
  await seedIfEmpty();
  seedExtraPatients();
  _seedBuiltInTemplates();
  } catch (err) {
    console.error('Seed error:', err);
    // Continue — seed may partially work or data may already exist
  }
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
