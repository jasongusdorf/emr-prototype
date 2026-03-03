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
  const first = modal.querySelector('input, select, textarea');
  if (first) setTimeout(() => first.focus(), 50);
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
  document.getElementById('modal-body').innerHTML   = '';
  document.getElementById('modal-footer').innerHTML = '';
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

/* ---------- Hash router ---------- */
function route() {
  const hash = location.hash || '#dashboard';
  const parts = hash.slice(1).split('/');
  const view  = parts[0];
  const param = parts[1];

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
    case 'providers':
      renderProviders();
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

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
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
  });
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

/* ---------- Init ---------- */
function init() {
  seedIfEmpty();
  initDarkMode();
  initKeyboardShortcuts();
  initCalculatorsNav();
  window.addEventListener('hashchange', route);
  route();
}

init();
