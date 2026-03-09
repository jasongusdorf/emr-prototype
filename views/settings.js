/* ============================================================
   views/settings.js — Settings page
   ============================================================ */

function renderSettings() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Settings', meta: '', actions: '' });
  setActiveNav('settings');

  const card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '16px 20px';
  card.style.padding = '20px';

  // Appearance section
  const heading = document.createElement('h3');
  heading.style.marginBottom = '12px';
  heading.textContent = 'Appearance';
  card.appendChild(heading);

  // Dark mode toggle row
  const row = document.createElement('div');
  row.className = 'settings-row';

  const label = document.createElement('div');
  label.className = 'settings-label';
  label.innerHTML = 'Dark Mode<small>Toggle between light and dark themes</small>';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn btn-secondary btn-sm';
  const isDark = document.body.classList.contains('dark-mode');
  toggleBtn.textContent = isDark ? ' Dark' : ' Light';

  toggleBtn.addEventListener('click', () => {
    const nowDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !nowDark);
    localStorage.setItem('emr_dark_mode', nowDark ? 'dark' : 'light');
    toggleBtn.textContent = nowDark ? ' Dark' : ' Light';
    // Sync login screen toggle
    const loginBtn = document.getElementById('login-dark-toggle');
    if (loginBtn) loginBtn.textContent = nowDark ? '' : '';
  });

  row.appendChild(label);
  row.appendChild(toggleBtn);
  card.appendChild(row);

  // Clinic Location row
  const clinicRow = document.createElement('div');
  clinicRow.className = 'settings-row';

  const clinicLabel = document.createElement('div');
  clinicLabel.className = 'settings-label';
  clinicLabel.innerHTML = 'Clinic Location<small>Displayed on the home screen under your name</small>';

  const clinicWrap = document.createElement('div');
  clinicWrap.style.display = 'flex';
  clinicWrap.style.gap = '8px';
  clinicWrap.style.alignItems = 'center';

  const clinicInput = document.createElement('input');
  clinicInput.className = 'form-control';
  clinicInput.style.width = '260px';
  clinicInput.placeholder = 'e.g. Advanced Heart Failure Clinic, BIDMC';
  clinicInput.value = localStorage.getItem('emr_clinic_location') || '';

  const clinicSave = document.createElement('button');
  clinicSave.className = 'btn btn-primary btn-sm';
  clinicSave.textContent = 'Save';
  clinicSave.addEventListener('click', () => {
    localStorage.setItem('emr_clinic_location', clinicInput.value.trim());
    showToast('Clinic location saved.', 'success');
  });

  clinicWrap.appendChild(clinicInput);
  clinicWrap.appendChild(clinicSave);
  clinicRow.appendChild(clinicLabel);
  clinicRow.appendChild(clinicWrap);
  card.appendChild(clinicRow);

  app.appendChild(card);

  // Keybinds section
  const keybindsCard = document.createElement('div');
  keybindsCard.className = 'card';
  keybindsCard.style.margin = '0 20px 16px';
  keybindsCard.style.padding = '20px';
  renderKeybindsSection(keybindsCard);
  app.appendChild(keybindsCard);
}

function renderKeybindsSection(container) {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';

  const heading = document.createElement('h3');
  heading.textContent = 'Keybinds';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset Defaults';
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('emr_keybinds');
    renderKeybindsSection(container);
    if (typeof showToast === 'function') showToast('Keybinds reset to defaults', 'success');
  });

  header.appendChild(heading);
  header.appendChild(resetBtn);
  container.appendChild(header);

  const hint = document.createElement('small');
  hint.style.cssText = 'display:block;color:var(--text-muted);margin-bottom:12px;';
  hint.textContent = 'Click a shortcut to remap it. Shortcuts use ⌘ on Mac and Ctrl on Windows/Linux.';
  container.appendChild(hint);

  const binds = typeof getKeybinds === 'function' ? getKeybinds() : [];

  binds.forEach(b => {
    const row = document.createElement('div');
    row.className = 'settings-row';

    const labelEl = document.createElement('div');
    labelEl.className = 'settings-label';
    labelEl.innerHTML = esc(b.label) + '<small>' + esc(b.description) + '</small>';

    const btn = document.createElement('button');
    btn.className = 'keybind-btn';
    btn.dataset.id = b.id;
    btn.textContent = typeof formatKeybind === 'function' ? formatKeybind(b.key, b.shift) : b.key;

    btn.addEventListener('click', () => {
      // Cancel any other recording in progress
      container.querySelectorAll('.keybind-recording').forEach(el => {
        el.classList.remove('keybind-recording');
        const bid = el.dataset.id;
        const cur = binds.find(x => x.id === bid);
        if (cur) el.textContent = formatKeybind(cur.key, cur.shift);
      });

      btn.classList.add('keybind-recording');
      btn.textContent = 'Press keys…';

      const onKey = e => {
        const isMod = e.ctrlKey || e.metaKey;

        if (e.key === 'Escape') {
          e.preventDefault();
          btn.classList.remove('keybind-recording');
          btn.textContent = formatKeybind(b.key, b.shift);
          document.removeEventListener('keydown', onKey, true);
          return;
        }

        // Ignore modifier-only keystrokes
        if (['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) return;

        if (!isMod) {
          // Briefly show hint
          btn.textContent = 'Hold ⌘/Ctrl…';
          setTimeout(() => {
            if (btn.classList.contains('keybind-recording')) btn.textContent = 'Press keys…';
          }, 900);
          return;
        }

        e.preventDefault();
        document.removeEventListener('keydown', onKey, true);
        btn.classList.remove('keybind-recording');

        const newKey = e.key.toLowerCase();
        const newShift = e.shiftKey;
        const combo = (newShift ? 'shift+' : '') + newKey;

        // Conflict check
        const conflict = binds.find(x => x.id !== b.id && (newShift ? 'shift+' : '') + x.key.toLowerCase() === combo);
        if (conflict) {
          btn.textContent = formatKeybind(b.key, b.shift);
          if (typeof showToast === 'function') showToast('Conflicts with "' + conflict.label + '"', 'error');
          return;
        }

        b.key = newKey;
        b.shift = newShift;
        btn.textContent = formatKeybind(b.key, b.shift);

        if (typeof saveKeybinds === 'function') saveKeybinds(binds);
      };

      document.addEventListener('keydown', onKey, true);
    });

    row.appendChild(labelEl);
    row.appendChild(btn);
    container.appendChild(row);
  });
}
