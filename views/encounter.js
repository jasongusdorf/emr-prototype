/* ============================================================
   views/encounter.js — Clinical note form + vitals + autosave + sign + addenda
   ============================================================ */

/* ---------- Constants ---------- */
var AUTOSAVE_INTERVAL_MS = 30000;
var AUTOSAVE_DISPLAY_MS = 10000;

let _autosaveTimers = {};
let _encSmartPhraseTextareas = [];
let _apMode = null; // 'narrative' | 'problem-oriented' — persisted per user

const NOTE_SECTIONS = [
  { key: 'chiefComplaint', label: 'Chief Complaint' },
  { key: 'hpi',            label: 'History of Present Illness' },
  { key: 'ros',            label: 'Review of Systems' },
  { key: 'physicalExam',   label: 'Physical Examination' },
  { key: 'assessment',     label: 'Assessment' },
  { key: 'plan',           label: 'Plan' },
];

function _getEditorMode() {
  // UI preference — stays in localStorage
  try { return localStorage.getItem('emr_note_editor_mode') || 'freeform'; } catch(e) { return 'freeform'; }
}
function _setEditorMode(mode) {
  // UI preference — stays in localStorage
  try { localStorage.setItem('emr_note_editor_mode', mode); } catch(e) { console.warn('[EMR] Storage write failed:', e.message); }
}

function _getAPMode() {
  // UI preference — stays in localStorage
  try { return localStorage.getItem('emr_ap_mode') || 'narrative'; } catch(e) { return 'narrative'; }
}
function _setAPMode(mode) {
  // UI preference — stays in localStorage
  try { localStorage.setItem('emr_ap_mode', mode); } catch(e) { console.warn('[EMR] Storage write failed:', e.message); }
}

function _parseFreeformToSections(text) {
  const result = {};
  NOTE_SECTIONS.forEach(s => { result[s.key] = ''; });
  if (!text) return result;

  // Try to parse section headers like "Chief Complaint:\n..."
  const lines = text.split('\n');
  let currentKey = null;
  const labelMap = {};
  NOTE_SECTIONS.forEach(s => {
    labelMap[s.label.toLowerCase()] = s.key;
    // Also match short forms
  });
  labelMap['hpi'] = 'hpi';
  labelMap['ros'] = 'ros';
  labelMap['pe'] = 'physicalExam';
  labelMap['physical exam'] = 'physicalExam';
  labelMap['a&p'] = 'assessment';
  labelMap['assessment & plan'] = 'assessment';
  labelMap['cc'] = 'chiefComplaint';

  const sectionBuf = {};
  NOTE_SECTIONS.forEach(s => { sectionBuf[s.key] = []; });
  let unmatchedLines = [];

  lines.forEach(line => {
    const headerMatch = line.match(/^([A-Za-z &\/]+):\s*$/);
    if (headerMatch) {
      const candidate = headerMatch[1].trim().toLowerCase();
      if (labelMap[candidate]) {
        currentKey = labelMap[candidate];
        return;
      }
    }
    if (currentKey) {
      sectionBuf[currentKey].push(line);
    } else {
      unmatchedLines.push(line);
    }
  });

  let hasSections = false;
  NOTE_SECTIONS.forEach(s => {
    result[s.key] = sectionBuf[s.key].join('\n').trim();
    if (result[s.key]) hasSections = true;
  });

  // If nothing matched sections, put everything in noteBody fallback
  if (!hasSections && unmatchedLines.length > 0) {
    return null; // signal: could not parse
  }

  // If there were unmatched lines at the top, prepend to chiefComplaint
  if (unmatchedLines.length > 0 && unmatchedLines.join('').trim()) {
    result.chiefComplaint = (unmatchedLines.join('\n').trim() + '\n' + result.chiefComplaint).trim();
  }

  return result;
}

function _sectionsToFreeform(textareas) {
  const parts = [];
  NOTE_SECTIONS.forEach(s => {
    const val = textareas[s.key] ? textareas[s.key].value.trim() : '';
    if (val) {
      parts.push(s.label + ':\n' + val);
    }
  });
  return parts.join('\n\n');
}

function calcNoteQuality(textareas) {
  let score = 0;
  const sectionKeys = ['chiefComplaint', 'hpi', 'ros', 'physicalExam', 'assessment', 'plan'];
  let filledCount = 0;

  // In freeform mode, just check noteBody
  if (textareas['noteBody'] && !textareas['chiefComplaint']) {
    const text = textareas['noteBody'].value.trim();
    if (!text) return 0;
    const words = text.split(/\s+/).length;
    if (words >= 10) return 40;
    if (words >= 50) return 60;
    if (words >= 100) return 80;
    return Math.min(100, Math.round(words / 1.5));
  }

  sectionKeys.forEach(key => {
    const ta = textareas[key];
    if (ta && ta.value && ta.value.trim().length > 0) {
      filledCount++;
      score += 17;
    }
  });

  // Bonus: HPI > 50 words
  if (textareas['hpi'] && textareas['hpi'].value) {
    const words = textareas['hpi'].value.trim().split(/\s+/).length;
    if (words > 50) score += 5;
  }

  // Bonus: Assessment has diagnosis-like pattern
  if (textareas['assessment'] && textareas['assessment'].value) {
    const val = textareas['assessment'].value;
    if (/\d\./.test(val) || /diagnosis|dx|icd/i.test(val)) score += 5;
  }

  return Math.min(100, score);
}

function _startAutosave(encounterId, saveFn) {
  _stopAutosave(encounterId);
  _autosaveTimers[encounterId] = setInterval(saveFn, AUTOSAVE_INTERVAL_MS);
}

function _stopAutosave(encounterId) {
  if (_autosaveTimers[encounterId]) {
    clearInterval(_autosaveTimers[encounterId]);
    delete _autosaveTimers[encounterId];
  }
}

function renderEncounter(encounterId) {
  // Stop any previous autosave timers
  Object.keys(_autosaveTimers).forEach(function(k) { _stopAutosave(k); });

  if (typeof registerCleanup === 'function') {
    registerCleanup(function() {
      // Clear all autosave timers
      Object.keys(_autosaveTimers).forEach(function(key) {
        clearInterval(_autosaveTimers[key]);
        delete _autosaveTimers[key];
      });
      // Reset module-level state
      _apMode = null;
      // Destroy SmartPhrase listeners for all textareas
      if (typeof _encSmartPhraseTextareas !== 'undefined') {
        _encSmartPhraseTextareas.forEach(function(ta) { destroySmartPhraseListener(ta); });
        _encSmartPhraseTextareas = [];
      }
    });
  }

  const app = document.getElementById('app');
  app.innerHTML = '';

  const encounter = getEncounter(encounterId);
  if (!encounter) {
    app.textContent = 'Encounter not found.';
    setTopbar({ title: 'Encounter Not Found' });
    return;
  }

  const patient  = getPatient(encounter.patientId);
  const provider = getProvider(encounter.providerId);
  const note     = getNoteByEncounter(encounterId) || saveNote({ encounterId });

  const patName    = patient  ? patient.firstName + ' ' + patient.lastName : 'Unknown Patient';
  const provName   = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : '[Removed Provider]';
  const visitLabel = encounter.visitType + (encounter.visitSubtype ? ' — ' + encounter.visitSubtype : '');
  const isSigned   = note.signed;

  setTopbar({
    title:  'Encounter Note',
    meta:   patName + ' · ' + encounter.status,
    actions: `
      <a href="${patient ? '#chart/' + esc(patient.id) : '#dashboard'}" class="btn btn-secondary btn-sm">← Chart</a>
      <a href="#orders/${esc(encounterId)}" class="btn btn-secondary btn-sm">Orders</a>
      <button class="btn btn-secondary btn-sm" id="btn-patient-summary">Patient Summary</button>
    `,
  });
  setActiveNav('dashboard');

  // Patient identity banner
  if (patient) app.appendChild(buildPatientBanner(patient.id));

  /* ---------- Chart Tab Bar ---------- */
  if (patient) {
    const chartTabs = [
      { key: 'profile',       label: 'Profile',       href: '#chart/' + patient.id },
      { key: 'notes',         label: 'Notes',         href: null },
      { key: 'medications',   label: 'Medications',   href: '#chart/' + patient.id },
      { key: 'results',       label: 'Results',       href: '#chart/' + patient.id },
      { key: 'orders',        label: 'Orders',        href: '#orders/' + encounterId },
      { key: 'assessments',   label: 'Assessments',   href: '#chart/' + patient.id },
      { key: 'care-plans',    label: 'Care Plans',    href: '#chart/' + patient.id },
      { key: 'io',            label: 'I/O',           href: '#chart/' + patient.id },
      { key: 'communication', label: 'Communication', href: '#chart/' + patient.id },
    ];
    const encTabBar = document.createElement('div');
    encTabBar.className = 'chart-subtab-bar enc-chart-tabs';
    encTabBar.setAttribute('role', 'tablist');
    encTabBar.setAttribute('aria-label', 'Encounter chart sections');
    chartTabs.forEach(function(tab) {
      const btn = document.createElement('button');
      btn.className = 'chart-subtab' + (tab.key === 'notes' ? ' active' : '');
      btn.setAttribute('data-omr-color', tab.key === 'communication' ? 'notes' : tab.key);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(tab.key === 'notes'));
      btn.setAttribute('tabindex', tab.key === 'notes' ? '0' : '-1');
      btn.textContent = tab.label;
      btn.addEventListener('click', function() {
        if (tab.href) {
          if (tab.key !== 'orders') {
            // Set the subtab so chart opens on the right section
            if (typeof _currentOverviewSubTab !== 'undefined') _currentOverviewSubTab = tab.key;
          }
          navigate(tab.href);
        }
      });
      btn.addEventListener('keydown', function(e) {
        var allTabs = Array.from(encTabBar.querySelectorAll('.chart-subtab'));
        var idx = allTabs.indexOf(btn);
        if (e.key === 'ArrowRight' && idx < allTabs.length - 1) {
          e.preventDefault();
          allTabs[idx + 1].focus();
          allTabs[idx + 1].click();
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          e.preventDefault();
          allTabs[idx - 1].focus();
          allTabs[idx - 1].click();
        }
      });
      encTabBar.appendChild(btn);
    });
    app.appendChild(encTabBar);
  }

  /* ---------- Context bar ---------- */
  const ctxBar = document.createElement('div');
  ctxBar.className = 'encounter-context-bar';
  const ctxFields = [
    ['Patient',  patName],
    ['MRN',      patient ? patient.mrn : '—'],
    ['Visit',    visitLabel],
    ['Provider', provName],
    ['Date',     formatDateTime(encounter.dateTime)],
  ];
  ctxFields.forEach(([label, value], i) => {
    if (i > 0) {
      const div = document.createElement('span');
      div.className = 'encounter-context-divider';
      div.textContent = '|';
      ctxBar.appendChild(div);
    }
    const wrap = document.createElement('span');
    const lbl = document.createElement('span');
    lbl.className = 'ctx-label';
    lbl.textContent = label;
    const br = document.createElement('br');
    const val = document.createElement('span');
    val.className = 'ctx-val';
    val.textContent = value;
    wrap.appendChild(lbl); wrap.appendChild(br); wrap.appendChild(val);
    ctxBar.appendChild(wrap);
  });
  // Status badge
  ctxBar.appendChild(Object.assign(document.createElement('span'), { className: 'encounter-context-divider', textContent: '|' }));
  const statusWrap = document.createElement('span');
  const statusLbl  = document.createElement('span');
  statusLbl.className = 'ctx-label';
  statusLbl.textContent = 'Status';
  const badge = document.createElement('span');
  badge.className = 'badge badge-' + encounter.status.toLowerCase();
  badge.textContent = encounter.status;
  statusWrap.appendChild(statusLbl);
  statusWrap.appendChild(document.createElement('br'));
  statusWrap.appendChild(badge);
  ctxBar.appendChild(statusWrap);
  app.appendChild(ctxBar);

  /* ---------- 8e: OB Context Banner ---------- */
  if (patient) {
    const obBanner = buildOBContextBanner(patient.id);
    if (obBanner.childNodes.length > 0) app.appendChild(obBanner);
  }

  /* ---------- WS8e: PT Context Banner ---------- */
  if (patient && typeof getPTEvaluations === 'function') {
    const ptEvalsCtx = getPTEvaluations(patient.id).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
    if (ptEvalsCtx.length > 0) {
      const ptE = ptEvalsCtx[0];
      const ptBanner = document.createElement('div');
      ptBanner.style.cssText = 'background:color-mix(in srgb, var(--accent-pt) 8%, transparent);border:1px solid color-mix(in srgb, var(--accent-pt) 40%, transparent);border-radius:var(--radius,8px);padding:8px 14px;margin:0 20px 12px;font-size:13px;display:flex;gap:16px;flex-wrap:wrap;align-items:center';
      const ptIcon = document.createElement('span');
      ptIcon.style.cssText = 'font-weight:700;color:var(--accent-pt)';
      ptIcon.textContent = 'PT';
      ptBanner.appendChild(ptIcon);
      const ptParts = [];
      if (ptE.activityLevel || ptE.functionalMobility) ptParts.push(ptE.activityLevel || ptE.functionalMobility);
      ptParts.push('WB: ' + (ptE.weightBearingStatus || ptE.wbStatus || 'N/A'));
      ptParts.push('AD: ' + (ptE.assistiveDevice || 'None'));
      if (typeof getPTSessions === 'function') {
        const ptSessCtx = getPTSessions(patient.id).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
        if (ptSessCtx.length > 0) ptParts.push('Last session: ' + formatDateTime(ptSessCtx[0].createdAt));
      }
      const ptText = document.createElement('span');
      ptText.textContent = ptParts.join(' | ');
      ptBanner.appendChild(ptText);
      app.appendChild(ptBanner);
    }
  }

  /* ---------- WS8e: SLP Context Banner ---------- */
  if (patient && typeof getSLPDietRecommendations === 'function') {
    const slpRecsCtx = getSLPDietRecommendations(patient.id).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
    if (slpRecsCtx.length > 0) {
      const slpR = slpRecsCtx[0];
      const slpBanner = document.createElement('div');
      slpBanner.style.cssText = 'background:color-mix(in srgb, var(--accent-slp) 8%, transparent);border:1px solid color-mix(in srgb, var(--accent-slp) 40%, transparent);border-radius:var(--radius,8px);padding:8px 14px;margin:0 20px 12px;font-size:13px;display:flex;gap:16px;flex-wrap:wrap;align-items:center';
      const slpIcon = document.createElement('span');
      slpIcon.style.cssText = 'font-weight:700;color:var(--accent-slp)';
      slpIcon.textContent = 'Diet';
      slpBanner.appendChild(slpIcon);
      const slpParts = [];
      slpParts.push('IDDSI ' + (slpR.foodLevel != null ? slpR.foodLevel : 'N/A'));
      slpParts.push('Liquids: ' + (slpR.liquidLevel != null ? slpR.liquidLevel : 'N/A'));
      const hasAspPrecCtx = slpR.precautions && (Array.isArray(slpR.precautions) ? slpR.precautions.length > 0 : !!slpR.precautions);
      slpParts.push('Aspiration Precautions: ' + (hasAspPrecCtx ? 'Y' : 'N'));
      const slpText = document.createElement('span');
      slpText.textContent = slpParts.join(' | ');
      slpBanner.appendChild(slpText);
      app.appendChild(slpBanner);
    }
  }

  /* ---------- Medication Reconciliation Banner (unsigned only) ---------- */
  if (!isSigned) {
    app.appendChild(buildMedRecBanner(encounter, note));
  }

  /* ---------- Clinical Note card ---------- */
  const noteCard = document.createElement('div');
  noteCard.className = 'card';
  noteCard.style.margin = '0 20px 20px';

  const noteHeader = document.createElement('div');
  noteHeader.className = 'card-header';
  const noteTitle = document.createElement('span');
  noteTitle.className = 'card-title';
  noteTitle.textContent = 'Clinical Note';

  const headerRight = document.createElement('div');
  headerRight.style.display = 'flex';
  headerRight.style.gap = '8px';
  headerRight.style.alignItems = 'center';

  const autosaveEl = document.createElement('span');
  autosaveEl.className = 'autosave-indicator idle';
  autosaveEl.id = 'autosave-indicator';
  if (!isSigned) {
    autosaveEl.innerHTML = '<span class="autosave-dot"></span> All changes saved';
  }
  headerRight.appendChild(autosaveEl);

  if (!isSigned) {
    const modeToggle = makeEncBtn(
      _getEditorMode() === 'sections' ? 'Freeform' : 'Sections',
      'btn btn-outline btn-sm note-mode-toggle',
      function() {
        const currentMode = _getEditorMode();
        if (currentMode === 'freeform') {
          // Convert freeform to sections
          const freeVal = textareas['noteBody'] ? textareas['noteBody'].value : '';
          const parsed = _parseFreeformToSections(freeVal);
          if (parsed) {
            NOTE_SECTIONS.forEach(s => { note[s.key] = parsed[s.key]; });
            note.noteBody = freeVal; // keep backup
          }
          _setEditorMode('sections');
        } else {
          // Convert sections to freeform
          const combined = _sectionsToFreeform(textareas);
          note.noteBody = combined;
          _setEditorMode('freeform');
        }
        saveNote({ ...readNoteFields(textareas), encounterId });
        renderEncounter(encounterId);
      }
    );
    headerRight.appendChild(modeToggle);

    const templateBtn = makeEncBtn('Use Template', 'btn btn-secondary btn-sm', () => openTemplatePickerModal(note, encounterId, textareas));
    headerRight.appendChild(templateBtn);
  }

  noteHeader.appendChild(noteTitle);
  noteHeader.appendChild(headerRight);
  noteCard.appendChild(noteHeader);

  const noteBody = document.createElement('div');
  noteBody.className = 'card-body';

  // Signed banner
  if (isSigned) {
    const signedProv = note.signedBy
      ? (() => { const p = getProvider(note.signedBy); return p ? p.firstName + ' ' + p.lastName + ', ' + p.degree : '[Removed Provider]'; })()
      : '[Unknown]';
    const banner = document.createElement('div');
    banner.className = 'signed-banner';
    banner.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span></span>`;
    banner.querySelector('span').textContent = 'Note signed by ' + signedProv + ' on ' + formatDateTime(note.signedAt);
    noteBody.appendChild(banner);
  }

  // Build display text from noteBody or structured fields
  let noteBodyText = note.noteBody || '';
  if (!noteBodyText) {
    const parts = [];
    NOTE_SECTIONS.forEach(f => {
      if (note[f.key]) {
        parts.push(f.label + ':\n' + note[f.key]);
      }
    });
    if (parts.length > 0) noteBodyText = parts.join('\n\n');
  }

  const textareas = {};
  _encSmartPhraseTextareas = [];

  if (isSigned) {
    // Read-only display for signed notes
    const section = document.createElement('div');
    section.className = 'note-section';

    // Show structured sections if available
    const hasSections = NOTE_SECTIONS.some(s => note[s.key] && note[s.key].trim());
    if (hasSections) {
      // Show non-A&P sections
      NOTE_SECTIONS.filter(s => s.key !== 'assessment' && s.key !== 'plan').forEach(s => {
        if (note[s.key] && note[s.key].trim()) {
          const secDiv = document.createElement('div');
          secDiv.className = 'note-preview-section';
          const secLabel = document.createElement('div');
          secLabel.className = 'note-preview-section-label';
          secLabel.textContent = s.label;
          const secBody = document.createElement('div');
          secBody.className = 'note-preview-section-body';
          secBody.style.whiteSpace = 'pre-wrap';
          secBody.textContent = note[s.key];
          secDiv.appendChild(secLabel);
          secDiv.appendChild(secBody);
          section.appendChild(secDiv);
        }
      });
      // 8a: If problems array exists, show problem-oriented A&P
      if (Array.isArray(note.problems) && note.problems.length > 0) {
        const apDiv = document.createElement('div');
        apDiv.className = 'note-preview-section';
        const apLabel = document.createElement('div');
        apLabel.className = 'note-preview-section-label';
        apLabel.textContent = 'Assessment & Plan (Problem-Oriented)';
        apDiv.appendChild(apLabel);
        note.problems.forEach(function(p, i) {
          if (p.name) {
            const probDiv = document.createElement('div');
            probDiv.style.cssText = 'border-left:3px solid var(--accent-blue,#4a7ce2);padding-left:12px;margin:8px 0';
            probDiv.innerHTML = '<strong>' + (i + 1) + '. ' + esc(p.name) + '</strong>';
            if (p.assessment) {
              const aEl = document.createElement('div');
              aEl.style.cssText = 'font-size:13px;margin-top:4px;white-space:pre-wrap';
              aEl.textContent = 'Assessment: ' + p.assessment;
              probDiv.appendChild(aEl);
            }
            if (p.plan) {
              const pEl = document.createElement('div');
              pEl.style.cssText = 'font-size:13px;margin-top:2px;white-space:pre-wrap';
              pEl.textContent = 'Plan: ' + p.plan;
              probDiv.appendChild(pEl);
            }
            apDiv.appendChild(probDiv);
          }
        });
        section.appendChild(apDiv);
      } else {
        // Standard assessment + plan
        ['assessment', 'plan'].forEach(function(key) {
          if (note[key] && note[key].trim()) {
            const secDiv = document.createElement('div');
            secDiv.className = 'note-preview-section';
            const secLabel = document.createElement('div');
            secLabel.className = 'note-preview-section-label';
            secLabel.textContent = key === 'assessment' ? 'Assessment' : 'Plan';
            const secBody = document.createElement('div');
            secBody.className = 'note-preview-section-body';
            secBody.style.whiteSpace = 'pre-wrap';
            secBody.textContent = note[key];
            secDiv.appendChild(secLabel);
            secDiv.appendChild(secBody);
            section.appendChild(secDiv);
          }
        });
      }
    } else if (noteBodyText) {
      const readDiv = document.createElement('div');
      readDiv.className = 'note-readonly';
      readDiv.style.whiteSpace = 'pre-wrap';
      readDiv.textContent = noteBodyText;
      section.appendChild(readDiv);
    } else {
      const readDiv = document.createElement('div');
      readDiv.className = 'note-readonly note-readonly-empty';
      readDiv.textContent = '(not documented)';
      section.appendChild(readDiv);
    }
    noteBody.appendChild(section);
  } else {
    const editorMode = _getEditorMode();

    if (editorMode === 'sections') {
      // Section-aware editor with collapsible sections
      const sectionContainer = document.createElement('div');
      sectionContainer.className = 'note-section-container';

      const apMode = _getAPMode();
      const NON_AP_SECTIONS = NOTE_SECTIONS.filter(s => s.key !== 'assessment' && s.key !== 'plan');

      NON_AP_SECTIONS.forEach(s => {
        const secWrap = document.createElement('div');
        secWrap.className = 'note-section-wrap';

        const header = document.createElement('div');
        header.className = 'note-section-header';
        header.innerHTML = '<span class="note-section-chevron">&#9660;</span> ' + esc(s.label);
        header.addEventListener('click', () => {
          secWrap.classList.toggle('collapsed');
          header.querySelector('.note-section-chevron').innerHTML = secWrap.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
        });

        const ta = document.createElement('textarea');
        ta.className = 'note-section-textarea';
        ta.id = 'note-' + s.key;
        ta.placeholder = s.label + '…';
        ta.value = note[s.key] || '';
        textareas[s.key] = ta;

        initSmartPhraseListener(ta);
        _encSmartPhraseTextareas.push(ta);

        secWrap.appendChild(header);
        secWrap.appendChild(ta);
        sectionContainer.appendChild(secWrap);
      });

      // 8a: Assessment & Plan section with narrative / problem-oriented toggle
      const apWrap = document.createElement('div');
      apWrap.className = 'note-section-wrap';
      const apHeader = document.createElement('div');
      apHeader.className = 'note-section-header';
      apHeader.style.display = 'flex'; apHeader.style.justifyContent = 'space-between'; apHeader.style.alignItems = 'center';

      const apLabel = document.createElement('span');
      apLabel.innerHTML = '<span class="note-section-chevron">&#9660;</span> Assessment &amp; Plan';
      apLabel.style.cursor = 'pointer';
      apLabel.addEventListener('click', () => {
        apWrap.classList.toggle('collapsed');
        apLabel.querySelector('.note-section-chevron').innerHTML = apWrap.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
      });

      const apToggleBtn = document.createElement('button');
      apToggleBtn.className = 'btn btn-outline btn-sm';
      apToggleBtn.textContent = apMode === 'problem-oriented' ? 'Narrative' : 'Problem-Oriented';
      apToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newMode = _getAPMode() === 'problem-oriented' ? 'narrative' : 'problem-oriented';
        // Save current problem data before toggle
        if (_getAPMode() === 'problem-oriented') {
          _serializeProblemsToNote(note, encounterId);
        }
        _setAPMode(newMode);
        saveNote({ ...readNoteFields(textareas), encounterId });
        renderEncounter(encounterId);
      });

      apHeader.appendChild(apLabel);
      apHeader.appendChild(apToggleBtn);
      apWrap.appendChild(apHeader);

      const apBody = document.createElement('div');
      apBody.id = 'ap-body';

      if (apMode === 'problem-oriented') {
        // Problem-oriented mode
        const problems = Array.isArray(note.problems) ? note.problems : [];
        const problemsContainer = document.createElement('div');
        problemsContainer.id = 'problems-container';
        problemsContainer.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:8px 0';

        problems.forEach((prob, idx) => {
          problemsContainer.appendChild(_buildProblemRow(prob, idx));
        });

        apBody.appendChild(problemsContainer);

        const addProbBtn = makeEncBtn('+ Add Problem', 'btn btn-secondary btn-sm', () => {
          const container = document.getElementById('problems-container');
          if (!container) return;
          const idx = container.children.length;
          container.appendChild(_buildProblemRow({ name: '', assessment: '', plan: '' }, idx));
        });
        addProbBtn.style.marginTop = '8px';
        apBody.appendChild(addProbBtn);

        // Hidden textareas for assessment/plan so readNoteFields still works
        const hiddenAssess = document.createElement('textarea');
        hiddenAssess.id = 'note-assessment'; hiddenAssess.style.display = 'none';
        hiddenAssess.value = note.assessment || '';
        textareas['assessment'] = hiddenAssess;
        apBody.appendChild(hiddenAssess);

        const hiddenPlan = document.createElement('textarea');
        hiddenPlan.id = 'note-plan'; hiddenPlan.style.display = 'none';
        hiddenPlan.value = note.plan || '';
        textareas['plan'] = hiddenPlan;
        apBody.appendChild(hiddenPlan);
      } else {
        // Narrative mode
        ['assessment', 'plan'].forEach(key => {
          const label = key === 'assessment' ? 'Assessment' : 'Plan';
          const lbl = document.createElement('div');
          lbl.style.cssText = 'font-weight:600;font-size:13px;margin:8px 0 4px;color:var(--text-secondary,#666)';
          lbl.textContent = label;
          apBody.appendChild(lbl);
          const ta = document.createElement('textarea');
          ta.className = 'note-section-textarea';
          ta.id = 'note-' + key;
          ta.placeholder = label + '…';
          ta.value = note[key] || '';
          textareas[key] = ta;
          initSmartPhraseListener(ta);
          _encSmartPhraseTextareas.push(ta);
          apBody.appendChild(ta);
        });
      }

      apWrap.appendChild(apBody);
      sectionContainer.appendChild(apWrap);

      noteBody.appendChild(sectionContainer);
    } else {
      // Freeform single textarea
      const section = document.createElement('div');
      section.className = 'note-section';
      const ta = document.createElement('textarea');
      ta.className = 'note-textarea freeform';
      ta.placeholder = 'Clinical note…';
      ta.value = noteBodyText;
      ta.id = 'note-noteBody';
      textareas['noteBody'] = ta;

      // Wire SmartPhrases
      initSmartPhraseListener(ta);
      _encSmartPhraseTextareas.push(ta);

      section.appendChild(ta);
      noteBody.appendChild(section);
    }

    // Quality indicator
    const qualityWrap = document.createElement('div');
    qualityWrap.className = 'note-quality-wrap';
    qualityWrap.innerHTML =
      '<div class="note-quality-bar"><div class="note-quality-fill" id="note-quality-fill"></div></div>' +
      '<span class="note-quality-label" id="note-quality-label"></span>';
    noteBody.appendChild(qualityWrap);

    function updateQualityIndicator() {
      const score = calcNoteQuality(textareas);
      const fill = document.getElementById('note-quality-fill');
      const label = document.getElementById('note-quality-label');
      if (fill) {
        fill.style.width = score + '%';
        fill.className = 'note-quality-fill' + (score >= 70 ? ' good' : score >= 40 ? ' fair' : ' low');
      }
      if (label) label.textContent = 'Documentation: ' + score + '%';
    }
    updateQualityIndicator();
    Object.values(textareas).forEach(ta => ta.addEventListener('input', updateQualityIndicator));
  }

  noteCard.appendChild(noteBody);

  /* ---------- Unsigned: Sign button + modal ---------- */
  if (!isSigned) {
    function openSignModal() {
      const currentUser = getSessionUser();
      const signingProvider = currentUser ? getProvider(currentUser.id) : null;
      if (!signingProvider) {
        showToast('Your account is not linked to a provider profile.', 'error');
        return;
      }
      const signerName = signingProvider.firstName + ' ' + signingProvider.lastName + ', ' + signingProvider.degree;

      openModal({
        title: 'Sign Note',
        bodyHTML:
          '<div class="form-group">' +
            '<label class="form-label">Signing as:</label>' +
            '<div class="form-control" style="background:var(--surface-2);cursor:default;">' + esc(signerName) + '</div>' +
          '</div>',
        footerHTML:
          '<button class="btn btn-secondary" id="sign-modal-cancel">Cancel</button>' +
          '<button class="btn btn-success" id="sign-modal-confirm">Confirm Signature</button>',
      });

      document.getElementById('sign-modal-cancel').addEventListener('click', closeModal);
      document.getElementById('sign-modal-confirm').addEventListener('click', () => {
        const providerId = signingProvider.id;
        const noteFields = readNoteFields(textareas);
        const signedAt = new Date();
        const sigName = signerName;
        const sigDate = (signedAt.getMonth() + 1).toString().padStart(2, '0') + '/' +
                        signedAt.getDate().toString().padStart(2, '0') + '/' +
                        signedAt.getFullYear() + ' ' +
                        signedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        noteFields.noteBody = (noteFields.noteBody || '') + '\n\n---\nElectronically signed by: ' + sigName + '\nDate: ' + sigDate;
        saveNote({ ...noteFields, encounterId, signed: true, signedBy: providerId, signedAt: signedAt.toISOString() });
        saveEncounter({ id: encounterId, status: 'Signed' });
        _stopAutosave(encounterId);
        closeModal();
        showToast('Note signed successfully.', 'success');
        renderEncounter(encounterId);
      });
    }

    // Card footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.borderTop = '1px solid var(--border)'; footer.style.padding = '14px 20px';

    const lastModEl = document.createElement('span');
    lastModEl.className = 'text-muted text-sm'; lastModEl.style.flex = '1'; lastModEl.id = 'last-modified';
    lastModEl.textContent = note.lastModified ? 'Last saved: ' + formatDateTime(note.lastModified) : '';

    // 7e: Med rec enforcement wrapper — checks before opening sign modal
    function _attemptSign() {
      var visitType = (encounter.visitType || '').toLowerCase();
      var visitSubtype = (encounter.visitSubtype || '').toLowerCase();
      var requiresMedRec = visitType === 'inpatient' || visitType === 'emergency' ||
        visitSubtype.indexOf('admission') >= 0 || visitSubtype.indexOf('discharge') >= 0;

      if (requiresMedRec) {
        var medRecs = typeof getMedRec === 'function' ? getMedRec(encounterId) : [];
        var hasCompleted = medRecs.length > 0 && medRecs.some(function(mr) {
          return mr.medName !== '__dismissed__';
        });
        if (!hasCompleted) {
          var visitLabel = encounter.visitType + (encounter.visitSubtype ? ' — ' + encounter.visitSubtype : '');
          openModal({
            title: 'Medication Reconciliation Required',
            bodyHTML:
              '<div style="background:var(--badge-danger-bg);border:2px solid var(--danger);border-radius:8px;padding:20px">' +
              '<p style="color:var(--badge-danger-text);font-size:14px;line-height:1.6;margin:0">' +
              'Medication reconciliation is required before signing this <strong>' + esc(visitLabel) + '</strong> note.</p>' +
              '<p style="color:var(--badge-warning-text,#713f12);font-size:13px;margin:12px 0 0">Please complete medication reconciliation using the banner at the top of the encounter, then try signing again.</p>' +
              '</div>',
            footerHTML:
              '<button class="btn btn-secondary" id="medrec-block-close">Close</button>' +
              '<button class="btn btn-primary" id="medrec-block-open">Open Med Rec</button>',
          });
          document.getElementById('medrec-block-close').addEventListener('click', closeModal);
          document.getElementById('medrec-block-open').addEventListener('click', function() {
            closeModal();
            // Expand the med rec banner
            var banner = document.querySelector('.med-rec-banner');
            if (banner) {
              var bodyDiv = banner.querySelector('.med-rec-body');
              if (bodyDiv) bodyDiv.style.display = 'block';
              banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
          return;
        }
      }
      openSignModal();
    }

    const signBtn = makeEncBtn('Sign Note', 'btn btn-success', () => {
      // Guard: prevent re-signing an already signed note
      var latestNote = getNoteByEncounter(encounterId);
      if (latestNote && latestNote.signed) {
        showToast('This note is already signed. Use addendum to make changes.', 'warning');
        return;
      }
      if (!canSignNotes()) { showToast('Only attending physicians can sign notes.', 'error'); return; }
      if (!getProviders().length) { showToast('Add a provider first.', 'error'); return; }
      const quality = calcNoteQuality(textareas);
      if (quality < 40) {
        confirmAction({
          title: 'Incomplete Documentation',
          message: 'Several sections appear to be empty (documentation: ' + quality + '%). Sign anyway?',
          confirmLabel: 'Sign Anyway',
          danger: false,
          onConfirm: _attemptSign,
        });
      } else {
        _attemptSign();
      }
    });
    if (!canSignNotes()) {
      signBtn.disabled = true;
      signBtn.title = 'Only attending physicians can sign notes';
    }

    footer.appendChild(lastModEl); footer.appendChild(signBtn);
    noteCard.appendChild(footer);
    app.appendChild(noteCard);

    /* ---------- Diagnoses & Billing card ---------- */
    app.appendChild(buildBillingSection(encounter, isSigned));

    // Autosave (scoped to encounterId)
    let _autosaveDebounce = null;
    let _lastSavedTime = null;
    let _autosaveAgoTimer = null;

    function _updateAutosaveText() {
      const ind = document.getElementById('autosave-indicator');
      if (!ind || !_lastSavedTime) return;
      const ago = Math.round((Date.now() - _lastSavedTime) / 1000);
      if (ago < 10) {
        ind.innerHTML = '<span class="autosave-dot"></span> Saved just now';
      } else if (ago < 60) {
        ind.innerHTML = '<span class="autosave-dot"></span> Saved ' + ago + 's ago';
      } else {
        ind.innerHTML = '<span class="autosave-dot"></span> Saved ' + Math.round(ago / 60) + 'm ago';
      }
    }

    function triggerAutosave() {
      clearTimeout(_autosaveDebounce);
      const ind = document.getElementById('autosave-indicator');
      if (ind) { ind.className = 'autosave-indicator editing'; ind.innerHTML = '<span class="autosave-dot"></span> Editing...'; }
      _autosaveDebounce = setTimeout(() => {
        if (ind) { ind.className = 'autosave-indicator saving'; ind.innerHTML = '<span class="autosave-dot"></span> Saving...'; }
        saveNote({ ...readNoteFields(textareas), encounterId });
        const mod = document.getElementById('last-modified');
        if (mod) mod.textContent = 'Last saved: ' + formatDateTime(new Date().toISOString());
        _lastSavedTime = Date.now();
        if (ind) {
          ind.className = 'autosave-indicator idle';
          ind.innerHTML = '<span class="autosave-dot"></span> Saved just now';
        }
        clearInterval(_autosaveAgoTimer);
        _autosaveAgoTimer = setInterval(_updateAutosaveText, AUTOSAVE_DISPLAY_MS);
        _autosaveDebounce = null;
      }, 1000);
    }

    Object.values(textareas).forEach(ta => ta.addEventListener('input', triggerAutosave));

    if (typeof registerCleanup === 'function') {
      registerCleanup(function() {
        // Clear the "ago" display timer
        if (_autosaveAgoTimer) {
          clearInterval(_autosaveAgoTimer);
          _autosaveAgoTimer = null;
        }
        // Clear any pending debounce
        clearTimeout(_autosaveDebounce);
        // Remove input listeners to avoid closure leaks
        Object.values(textareas).forEach(function(ta) {
          ta.removeEventListener('input', triggerAutosave);
        });
      });
    }

  } else {
    app.appendChild(noteCard);

    // 8d: Co-signature section for signed notes
    app.appendChild(buildCoSignatureSection(encounterId, note));

    // Addenda section for signed notes
    app.appendChild(buildAddendaSection(encounterId, note, encounter));

    /* ---------- Diagnoses & Billing card ---------- */
    app.appendChild(buildBillingSection(encounter, isSigned));
  }

  // 8b: Quick Orders panel (always shown)
  app.appendChild(buildQuickOrdersPanel(encounterId, encounter.patientId));

  // 8a: Save problem-oriented data on autosave if in problem mode
  var _probDebounce = null;
  if (!isSigned && _getAPMode() === 'problem-oriented') {
    const origTriggerAutosave = () => {
      _serializeProblemsToNote(note, encounterId);
    };
    // Hook into the problems container inputs
    setTimeout(() => {
      const probContainer = document.getElementById('problems-container');
      if (probContainer) {
        probContainer.addEventListener('input', () => {
          clearTimeout(_probDebounce);
          _probDebounce = setTimeout(origTriggerAutosave, 1500);
        });
      }
    }, 100);

    if (typeof registerCleanup === 'function') {
      registerCleanup(function() {
        clearTimeout(_probDebounce);
      });
    }
  }

  // Patient Summary button
  const summaryBtn = document.getElementById('btn-patient-summary');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', () => openEncounterSummaryModal(encounterId));
  }
}

/* ============================================================
   Vitals section
   ============================================================ */
function buildVitalsSection(encounter, vitals, isSigned) {
  const card = document.createElement('div');
  card.className = 'vitals-card';

  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = 'Vital Signs';
  hdr.appendChild(title);

  if (vitals && isSigned) {
    // Read-only display
    const ts = document.createElement('span');
    ts.className = 'text-muted text-sm';
    ts.textContent = 'Recorded ' + formatDateTime(vitals.recordedAt);
    hdr.appendChild(ts);
    card.appendChild(hdr);

    const grid = document.createElement('div');
    grid.className = 'vitals-grid';

    const bmi = calcBMI(vitals.weightLbs, vitals.heightIn);
    const vitalItems = [
      ['BP',     vitals.bpSystolic && vitals.bpDiastolic ? vitals.bpSystolic + '/' + vitals.bpDiastolic : '—', 'mmHg'],
      ['Heart Rate',  vitals.heartRate        || '—', 'bpm'],
      ['Resp Rate',   vitals.respiratoryRate  || '—', '/min'],
      ['Temp',        vitals.tempF            || '—', '°F'],
      ['SpO₂',        vitals.spo2             || '—', '%'],
      ['Weight',      vitals.weightLbs        || '—', 'lbs'],
      ['Height',      vitals.heightIn ? fmtHeight(vitals.heightIn) : '—', ''],
      ['BMI',         bmi || '—',                      bmi ? ' kg/m²' : ''],
    ];

    vitalItems.forEach(([label, value, unit]) => {
      const item = document.createElement('div');
      item.className = 'vital-item';
      const lbl = document.createElement('div'); lbl.className = 'vital-label'; lbl.textContent = label;
      const val = document.createElement('div'); val.className = 'vital-value';
      const valText = document.createTextNode(value);
      val.appendChild(valText);
      if (unit && value !== '—') {
        const unitSpan = document.createElement('span'); unitSpan.className = 'vital-unit'; unitSpan.textContent = ' ' + unit;
        val.appendChild(unitSpan);
      }
      item.appendChild(lbl); item.appendChild(val);
      grid.appendChild(item);
    });

    card.appendChild(grid);

  } else if (!isSigned) {
    // Entry form
    const recProvider = getProvider(encounter.providerId);
    const ts = document.createElement('span');
    ts.className = 'text-muted text-sm';
    ts.textContent = vitals ? 'Vitals on file — update below' : 'Enter vitals';
    hdr.appendChild(ts);
    card.appendChild(hdr);

    const form = document.createElement('div');
    form.className = 'vitals-entry-form';

    const vFields = [
      { id: 'v-bp-sys',  label: 'Systolic BP', placeholder: '120' },
      { id: 'v-bp-dia',  label: 'Diastolic BP', placeholder: '80' },
      { id: 'v-hr',      label: 'Heart Rate', placeholder: '72' },
      { id: 'v-rr',      label: 'Resp Rate', placeholder: '16' },
      { id: 'v-temp',    label: 'Temp (°F)', placeholder: '98.6' },
      { id: 'v-spo2',    label: 'SpO₂ (%)', placeholder: '98' },
      { id: 'v-weight',  label: 'Weight (lbs)', placeholder: '150' },
      { id: 'v-height',  label: 'Height (in)', placeholder: '66' },
    ];

    vFields.forEach(f => {
      const grp = document.createElement('div');
      grp.className = 'form-group';
      const lbl = document.createElement('label');
      lbl.className = 'form-label'; lbl.textContent = f.label;
      const inp = document.createElement('input');
      inp.className = 'form-control'; inp.id = f.id; inp.type = 'number';
      inp.placeholder = f.placeholder; inp.step = 'any'; inp.min = '0';
      if (vitals) {
        const keyMap = { 'v-bp-sys': 'bpSystolic', 'v-bp-dia': 'bpDiastolic', 'v-hr': 'heartRate', 'v-rr': 'respiratoryRate', 'v-temp': 'tempF', 'v-spo2': 'spo2', 'v-weight': 'weightLbs', 'v-height': 'heightIn' };
        inp.value = vitals[keyMap[f.id]] || '';
      }
      grp.appendChild(lbl); grp.appendChild(inp);
      form.appendChild(grp);
    });

    card.appendChild(form);

    // BMI preview
    const bmiRow = document.createElement('div');
    bmiRow.style.padding = '0 20px 4px';
    bmiRow.id = 'bmi-preview';
    bmiRow.className = 'text-muted text-sm';
    if (vitals && vitals.weightLbs && vitals.heightIn) {
      const b = calcBMI(vitals.weightLbs, vitals.heightIn);
      if (b) bmiRow.textContent = 'BMI: ' + b + ' kg/m²';
    }
    card.appendChild(bmiRow);

    // BMI auto-update
    const updateBMI = () => {
      const w = document.getElementById('v-weight')?.value;
      const h = document.getElementById('v-height')?.value;
      const bmiEl = document.getElementById('bmi-preview');
      if (bmiEl && w && h) {
        const b = calcBMI(w, h);
        bmiEl.textContent = b ? 'BMI: ' + b + ' kg/m²' : '';
      }
    };
    setTimeout(() => {
      document.getElementById('v-weight')?.addEventListener('input', updateBMI);
      document.getElementById('v-height')?.addEventListener('input', updateBMI);
    }, 0);

    // Save vitals footer
    const vFooter = document.createElement('div');
    vFooter.style.padding = '8px 20px 14px';
    vFooter.style.display = 'flex'; vFooter.style.justifyContent = 'flex-end';

    const saveVitalsBtn = makeEncBtn('Save Vitals', 'btn btn-secondary btn-sm', () => {
      // Soft range warnings
      const vitalsToCheck = [
        { id: 'v-bp-sys', label: 'Systolic BP',  low: 70,  high: 200 },
        { id: 'v-bp-dia', label: 'Diastolic BP', low: 30,  high: 130 },
        { id: 'v-hr',     label: 'Heart Rate',   low: 30,  high: 200 },
        { id: 'v-rr',     label: 'Resp. Rate',   low: 6,   high: 40  },
        { id: 'v-temp',   label: 'Temperature',  low: 93,  high: 106 },
        { id: 'v-spo2',   label: 'SpO2',         low: 50,  high: 100 },
      ];
      const warnings = [];
      vitalsToCheck.forEach(v => {
        const val = parseFloat(document.getElementById(v.id)?.value);
        if (!isNaN(val) && (val < v.low || val > v.high)) {
          warnings.push(v.label + ': ' + val + ' (expected ' + v.low + '–' + v.high + ')');
        }
      });
      function doSaveVitals() {
        saveEncounterVitals({
          encounterId:     encounter.id,
          patientId:       encounter.patientId,
          bpSystolic:      document.getElementById('v-bp-sys')?.value.trim()  || '',
          bpDiastolic:     document.getElementById('v-bp-dia')?.value.trim()  || '',
          heartRate:       document.getElementById('v-hr')?.value.trim()      || '',
          respiratoryRate: document.getElementById('v-rr')?.value.trim()      || '',
          tempF:           document.getElementById('v-temp')?.value.trim()    || '',
          spo2:            document.getElementById('v-spo2')?.value.trim()    || '',
          weightLbs:       document.getElementById('v-weight')?.value.trim()  || '',
          heightIn:        document.getElementById('v-height')?.value.trim()  || '',
          recordedAt:      new Date().toISOString(),
          recordedBy:      encounter.providerId,
        });
        showToast('Vitals saved.', 'success');
        // Re-render to show updated vitals display
        renderEncounter(encounter.id);
      }
      if (warnings.length > 0) {
        confirmAction({
          title: 'Unusual Vitals Values',
          message: 'The following values are outside normal physiological range:\n\n' + warnings.join('\n') + '\n\nSave anyway?',
          confirmLabel: 'Save Anyway',
          onConfirm: doSaveVitals,
        });
      } else {
        doSaveVitals();
      }
    });

    vFooter.appendChild(saveVitalsBtn);
    card.appendChild(vFooter);

  } else {
    // Signed, no vitals
    hdr.appendChild(document.createElement('span'));
    card.appendChild(hdr);
    const noVitals = document.createElement('div');
    noVitals.className = 'text-muted text-sm';
    noVitals.style.padding = '12px 20px';
    noVitals.textContent = 'No vitals recorded for this encounter.';
    card.appendChild(noVitals);
  }

  return card;
}

/* ============================================================
   Addenda section (shown below signed notes)
   ============================================================ */
function buildAddendaSection(encounterId, note, encounter) {
  const section = document.createElement('div');
  section.className = 'addendum-section';

  const hdr = document.createElement('div');
  hdr.className = 'addendum-header';
  hdr.textContent = 'Addenda';
  section.appendChild(hdr);

  // Existing addenda
  const addenda = Array.isArray(note.addenda) ? note.addenda : [];
  const addendaList = document.createElement('div');
  addendaList.id = 'addenda-list';

  if (addenda.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-muted text-sm';
    empty.style.padding = '8px 0';
    empty.textContent = 'No addenda.';
    addendaList.appendChild(empty);
  }

  addenda.forEach(ad => {
    addendaList.appendChild(renderAddendumItem(ad));
  });

  section.appendChild(addendaList);

  // Add Addendum button + form
  const addBtn = makeEncBtn('+ Add Addendum', 'btn btn-secondary btn-sm', () => {
    form.hidden = !form.hidden;
    if (!form.hidden) textarea.focus();
  });

  const form = document.createElement('div');
  form.className = 'addendum-form';
  form.hidden = true;

  const currentUser = getSessionUser();
  const signingProv = currentUser ? getProvider(currentUser.id) : null;

  const provLbl = document.createElement('label');
  provLbl.className = 'form-label'; provLbl.textContent = 'Signing as';
  const provDisplay = document.createElement('div');
  provDisplay.className = 'form-control';
  provDisplay.style.cssText = 'background:var(--surface-2);cursor:default;margin-bottom:10px;';
  provDisplay.textContent = signingProv
    ? signingProv.firstName + ' ' + signingProv.lastName + ', ' + signingProv.degree
    : '[No provider linked to your account]';

  const taLbl = document.createElement('label');
  taLbl.className = 'form-label'; taLbl.textContent = 'Addendum Text';
  const textarea = document.createElement('textarea');
  textarea.className = 'note-textarea';
  textarea.style.minHeight = '80px';
  textarea.placeholder = 'Enter addendum text…';

  const formBtns = document.createElement('div');
  formBtns.style.display = 'flex'; formBtns.style.gap = '8px'; formBtns.style.marginTop = '10px';

  const cancelBtn = makeEncBtn('Cancel', 'btn btn-secondary btn-sm', () => {
    form.hidden = true; textarea.value = '';
  });
  const saveBtn = makeEncBtn('Sign Addendum', 'btn btn-primary btn-sm', () => {
    const text = textarea.value.trim();
    if (!text) { showToast('Addendum text is required.', 'error'); return; }
    if (!signingProv) { showToast('Your account is not linked to a provider profile.', 'error'); return; }
    const addedBy = signingProv.id;
    const updated = addNoteAddendum(encounterId, { text, addedBy });
    if (updated) {
      const newAd = updated.addenda[updated.addenda.length - 1];
      addendaList.appendChild(renderAddendumItem(newAd));
      textarea.value = '';
      form.hidden = true;
      showToast('Addendum signed.', 'success');
    }
  });

  formBtns.appendChild(cancelBtn); formBtns.appendChild(saveBtn);
  form.appendChild(provLbl); form.appendChild(provDisplay);
  form.appendChild(taLbl); form.appendChild(textarea); form.appendChild(formBtns);
  section.appendChild(addBtn);
  section.appendChild(form);

  return section;
}

function renderAddendumItem(ad) {
  const prov = getProvider(ad.addedBy);
  const provName = prov ? prov.firstName + ' ' + prov.lastName + ', ' + prov.degree : '[Removed Provider]';

  const item = document.createElement('div');
  item.className = 'addendum-item';
  const meta = document.createElement('div');
  meta.className = 'addendum-meta';
  meta.textContent = 'Addendum — ' + provName + ' · ' + formatDateTime(ad.addedAt);
  const text = document.createElement('div');
  text.className = 'addendum-text';
  text.textContent = ad.text;
  item.appendChild(meta); item.appendChild(text);
  return item;
}

/* ============================================================
   Helpers
   ============================================================ */
function readNoteFields(textareas) {
  const result = {};
  if (textareas['noteBody']) {
    result.noteBody = textareas['noteBody'].value || '';
  } else {
    // Section mode — save individual fields AND a combined noteBody
    NOTE_SECTIONS.forEach(s => {
      result[s.key] = textareas[s.key] ? textareas[s.key].value || '' : '';
    });
    result.noteBody = _sectionsToFreeform(textareas);
  }
  // 8a: Also save problem-oriented data if in that mode
  if (_getAPMode() === 'problem-oriented') {
    const problems = _collectProblemsFromDOM();
    if (problems.length > 0) {
      result.problems = problems;
      // Generate flat assessment/plan from problems
      const assessParts = [];
      const planParts = [];
      problems.forEach(function(p, i) {
        if (p.name) {
          assessParts.push((i + 1) + '. ' + p.name + ': ' + (p.assessment || ''));
          planParts.push((i + 1) + '. ' + p.name + ': ' + (p.plan || ''));
        }
      });
      result.assessment = assessParts.join('\n');
      result.plan = planParts.join('\n');
    }
  }
  return result;
}

function calcBMI(weightLbs, heightIn) {
  const w = parseFloat(weightLbs);
  const h = parseFloat(heightIn);
  if (!w || !h || h === 0) return null;
  return ((w / (h * h)) * 703).toFixed(1);
}

function fmtHeight(inches) {
  const i = parseFloat(inches);
  if (!i) return inches;
  return Math.floor(i / 12) + '\'' + Math.round(i % 12) + '"';
}

function makeEncBtn(text, className, onclick) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.textContent = text;
  btn.addEventListener('click', onclick);
  return btn;
}

/* ============================================================
   Note Template Picker
   ============================================================ */
function openTemplatePickerModal(note, encounterId, textareas) {
  const templates = getNoteTemplates();
  const editorMode = _getEditorMode();

  const bodyEl = document.createElement('div');

  if (templates.length === 0) {
    const msg = document.createElement('p');
    msg.style.color = 'var(--text-muted)';
    msg.textContent = 'No note templates found. Templates are seeded on first load.';
    bodyEl.appendChild(msg);
  } else {
    const grid = document.createElement('div');
    grid.className = 'template-grid';

    templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'template-card';

      const name = document.createElement('div');
      name.className = 'template-card-name';
      name.textContent = tmpl.name;

      const type = document.createElement('div');
      type.className = 'template-card-type';
      type.textContent = tmpl.visitType || 'General';

      // Template preview snippet
      const preview = document.createElement('div');
      preview.className = 'template-card-preview';
      const previewParts = [];
      ['chiefComplaint','hpi','ros','physicalExam','assessment','plan'].forEach(f => {
        if (tmpl[f]) previewParts.push(tmpl[f]);
      });
      const previewText = previewParts.join(' | ');
      preview.textContent = previewText.length > 100 ? previewText.substring(0, 100) + '...' : previewText;

      card.appendChild(name);
      card.appendChild(type);
      card.appendChild(preview);

      card.addEventListener('click', () => {
        const applyTemplate = () => {
          if (editorMode === 'sections') {
            // 8c: Non-destructive — append with separator if section has content
            const fields = ['chiefComplaint','hpi','ros','physicalExam','assessment','plan'];
            fields.forEach(f => {
              const ta = document.getElementById('note-' + f);
              if (ta && tmpl[f]) {
                if (ta.value.trim().length > 0) {
                  ta.value = ta.value.trimEnd() + '\n\n---\n' + tmpl[f];
                } else {
                  ta.value = tmpl[f];
                }
                ta.dispatchEvent(new Event('input', { bubbles: true }));
              }
            });
          } else {
            // Freeform mode: append with separator if content exists
            const parts = [];
            NOTE_SECTIONS.forEach(s => {
              if (tmpl[s.key]) parts.push(s.label + ':\n' + tmpl[s.key]);
            });
            const ta = document.getElementById('note-noteBody');
            if (ta) {
              const newText = parts.join('\n\n');
              if (ta.value.trim().length > 0) {
                ta.value = ta.value.trimEnd() + '\n\n---\n' + newText;
              } else {
                ta.value = newText;
              }
              ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
          closeModal();
          showToast('Template applied: ' + tmpl.name, 'success');
        };

        // 8c: Always apply non-destructively (append with separator)
        applyTemplate();
      });

      grid.appendChild(card);
    });

    bodyEl.appendChild(grid);
  }

  openModal({
    title: 'Choose Note Template',
    bodyHTML: '',
    footerHTML: '<button class="btn btn-secondary" id="tmpl-cancel">Cancel</button>',
    size: 'lg',
  });
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-body').appendChild(bodyEl);
  document.getElementById('tmpl-cancel').addEventListener('click', closeModal);
}

/* ============================================================
   Medication Reconciliation Banner
   ============================================================ */
function buildMedRecBanner(encounter, note) {
  const patientId   = encounter.patientId;
  const encounterId = encounter.id;
  const currentMeds = getPatientMedications(patientId).filter(m => m.status === 'Current');
  const existingRec = getMedRec(encounterId);

  const container = document.createElement('div');

  if (existingRec.length > 0) {
    // Show green complete badge
    const badge = document.createElement('div');
    badge.className = 'med-rec-complete-badge';
    const actions = existingRec.map(r => r.medName + ': ' + r.action).join(', ');
    badge.textContent = ' Medication reconciliation complete — ' + actions;
    container.appendChild(badge);
    return container;
  }

  if (currentMeds.length === 0) return container;

  // Show amber banner
  const banner = document.createElement('div');
  banner.className = 'med-rec-banner';

  const hdr = document.createElement('div');
  hdr.className = 'med-rec-banner-header';

  const title = document.createElement('span');
  title.className = 'med-rec-banner-title';
  title.textContent = ' Medication Reconciliation Needed — ' + currentMeds.length + ' current medication(s)';

  const btns = document.createElement('div');
  btns.style.display = 'flex'; btns.style.gap = '8px';

  const expandBtn = makeEncBtn('Reconcile ▾', 'btn btn-secondary btn-sm', () => {
    const bodyDiv = banner.querySelector('.med-rec-body');
    if (bodyDiv) {
      const open = bodyDiv.style.display !== 'none';
      bodyDiv.style.display = open ? 'none' : 'block';
      expandBtn.textContent = open ? 'Reconcile ▾' : 'Collapse ▴';
    }
  });
  const dismissBtn = makeEncBtn('Dismiss', 'btn btn-ghost btn-sm', () => {
    // Persist dismissal so banner doesn't reappear on reload
    saveMedRec(encounter.id, patientId, [{ medName: '__dismissed__', action: 'Dismissed', notes: '' }]);
    banner.remove();
  });

  btns.appendChild(expandBtn); btns.appendChild(dismissBtn);
  hdr.appendChild(title); hdr.appendChild(btns);
  banner.appendChild(hdr);

  const body = document.createElement('div');
  body.className = 'med-rec-body';
  body.style.display = 'none';

  const actionOptions = ['Continued', 'Changed', 'Discontinued', 'Held'];
  const rowData = [];

  currentMeds.forEach((med, i) => {
    const row = document.createElement('div');
    row.className = 'med-rec-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'med-rec-name';
    nameEl.textContent = med.name + ' ' + (med.dose || '') + ' ' + (med.unit || '') + ' ' + (med.frequency || '');

    const actionSel = document.createElement('select');
    actionSel.className = 'form-control med-rec-action';
    actionSel.id = 'medrecon-action-' + i;
    actionOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt; o.textContent = opt;
      actionSel.appendChild(o);
    });

    const notesInp = document.createElement('input');
    notesInp.className = 'form-control';
    notesInp.id = 'medrecon-notes-' + i;
    notesInp.placeholder = 'Notes (optional)';

    row.appendChild(nameEl); row.appendChild(actionSel); row.appendChild(notesInp);
    body.appendChild(row);
    rowData.push({ med, actionSel, notesInp });
  });

  const footerDiv = document.createElement('div');
  footerDiv.style.display = 'flex'; footerDiv.style.gap = '8px'; footerDiv.style.marginTop = '12px';

  const completeBtn = makeEncBtn('Complete Reconciliation', 'btn btn-success btn-sm', () => {
    const records = rowData.map(({ med, actionSel, notesInp }) => ({
      medId:    med.id,
      medName:  med.name,
      action:   actionSel.value,
      notes:    notesInp.value.trim(),
      patientId,
    }));
    saveMedRec(encounterId, patientId, records);

    // Create inpatient medication orders for continued medications
    const currentUser = getSessionUser();
    let ordersCreated = 0;
    records.forEach(rec => {
      if (rec.action !== 'Continued') return;
      const med = currentMeds.find(m => m.id === rec.medId);
      if (!med) return;
      const result = saveOrder({
        encounterId,
        patientId,
        orderedBy:  currentUser ? currentUser.id : '',
        type:       'Medication',
        priority:   'Routine',
        status:     'Active',
        detail: {
          drug:       med.name,
          dose:       med.dose       || '',
          unit:       med.unit       || '',
          route:      med.route      || '',
          frequency:  med.frequency  || '',
          indication: med.indication || '',
          duration:   'Ongoing',
        },
        notes: rec.notes || 'Continued from home medication reconciliation',
      });
      if (result && !result.error) ordersCreated++;
    });

    banner.remove();
    const badge = document.createElement('div');
    badge.className = 'med-rec-complete-badge';
    const actions = records.map(r => r.medName + ': ' + r.action).join(', ');
    badge.textContent = ' Medication reconciliation complete — ' + actions;
    container.appendChild(badge);

    const msg = ordersCreated > 0
      ? 'Medication reconciliation saved. ' + ordersCreated + ' inpatient order(s) created.'
      : 'Medication reconciliation saved.';
    showToast(msg, 'success');
  });

  footerDiv.appendChild(completeBtn);
  body.appendChild(footerDiv);
  banner.appendChild(body);
  container.appendChild(banner);
  return container;
}

/* ============================================================
   DIAGNOSES & BILLING SECTION
   ============================================================ */
const COMMON_ICD10 = [
  { code: 'I10',     desc: 'Essential hypertension' },
  { code: 'E11.9',   desc: 'Type 2 diabetes mellitus without complications' },
  { code: 'J06.9',   desc: 'Acute upper respiratory infection, unspecified' },
  { code: 'M54.5',   desc: 'Low back pain' },
  { code: 'J20.9',   desc: 'Acute bronchitis, unspecified' },
  { code: 'N39.0',   desc: 'Urinary tract infection, site not specified' },
  { code: 'F41.1',   desc: 'Generalized anxiety disorder' },
  { code: 'F32.9',   desc: 'Major depressive disorder, single episode, unspecified' },
  { code: 'E78.5',   desc: 'Hyperlipidemia, unspecified' },
  { code: 'K21.0',   desc: 'Gastro-esophageal reflux disease with esophagitis' },
  { code: 'G43.909', desc: 'Migraine, unspecified, not intractable' },
  { code: 'J45.20',  desc: 'Mild intermittent asthma, uncomplicated' },
  { code: 'R05.9',   desc: 'Cough, unspecified' },
  { code: 'K59.00',  desc: 'Constipation, unspecified' },
  { code: 'M79.3',   desc: 'Panniculitis, unspecified' },
  { code: 'R10.9',   desc: 'Unspecified abdominal pain' },
  { code: 'R51.9',   desc: 'Headache, unspecified' },
  { code: 'J02.9',   desc: 'Acute pharyngitis, unspecified' },
  { code: 'L30.9',   desc: 'Dermatitis, unspecified' },
  { code: 'R53.83',  desc: 'Other fatigue' },
];

const COMMON_CPT = [
  { code: '99211', desc: 'Office visit, established — minimal' },
  { code: '99212', desc: 'Office visit, established — straightforward' },
  { code: '99213', desc: 'Office visit, established — low complexity' },
  { code: '99214', desc: 'Office visit, established — moderate complexity' },
  { code: '99215', desc: 'Office visit, established — high complexity' },
  { code: '99201', desc: 'Office visit, new patient — straightforward' },
  { code: '99202', desc: 'Office visit, new patient — straightforward (expanded)' },
  { code: '99203', desc: 'Office visit, new patient — low complexity' },
  { code: '99204', desc: 'Office visit, new patient — moderate complexity' },
  { code: '99205', desc: 'Office visit, new patient — high complexity' },
  { code: '99381', desc: 'Preventive visit, new, infant' },
  { code: '99391', desc: 'Preventive visit, established, infant' },
  { code: '99395', desc: 'Preventive visit, established, 18-39' },
  { code: '99396', desc: 'Preventive visit, established, 40-64' },
  { code: '99397', desc: 'Preventive visit, established, 65+' },
];

function buildBillingSection(encounter, isSigned) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '0 20px 20px';

  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = 'Diagnoses & Billing';
  hdr.appendChild(title);

  if (!isSigned) {
    const addDxBtn = makeEncBtn('+ Diagnosis', 'btn btn-secondary btn-sm', () => openDiagnosisEntry(encounter));
    const addCptBtn = makeEncBtn('+ CPT Code', 'btn btn-secondary btn-sm', () => openCPTEntry(encounter));
    addDxBtn.style.marginLeft = 'auto';
    addCptBtn.style.marginLeft = '6px';
    hdr.appendChild(addDxBtn);
    hdr.appendChild(addCptBtn);
  }

  card.appendChild(hdr);

  const body = document.createElement('div');
  body.className = 'billing-section';

  // Diagnoses list
  const dxTitle = document.createElement('h4');
  dxTitle.textContent = 'Diagnoses (ICD-10)';
  body.appendChild(dxTitle);

  const diagnoses = encounter.diagnoses || [];
  if (diagnoses.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-muted);font-size:13px;padding:4px 0 12px';
    empty.textContent = 'No diagnoses added.';
    body.appendChild(empty);
  } else {
    const dxList = document.createElement('ul');
    dxList.className = 'dx-list';
    diagnoses.forEach((dx, i) => {
      const item = document.createElement('li');
      item.className = 'dx-item' + (dx.primary ? ' primary' : '');

      const code = document.createElement('span');
      code.className = 'dx-code';
      code.textContent = dx.code;

      const desc = document.createElement('span');
      desc.textContent = dx.description;

      if (dx.primary) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-signed';
        badge.textContent = 'Primary';
        badge.style.marginLeft = '6px';
        item.appendChild(code);
        item.appendChild(desc);
        item.appendChild(badge);
      } else {
        item.appendChild(code);
        item.appendChild(desc);
      }

      if (!isSigned) {
        const rmBtn = document.createElement('button');
        rmBtn.className = 'btn btn-danger btn-sm';
        rmBtn.textContent = 'Remove';
        rmBtn.style.marginLeft = 'auto';
        rmBtn.addEventListener('click', () => {
          diagnoses.splice(i, 1);
          saveEncounter({ id: encounter.id, diagnoses });
          renderEncounter(encounter.id);
        });
        item.appendChild(rmBtn);
      }

      dxList.appendChild(item);
    });
    body.appendChild(dxList);
  }

  // CPT codes list
  const cptTitle = document.createElement('h4');
  cptTitle.textContent = 'CPT Codes';
  body.appendChild(cptTitle);

  const cptCodes = encounter.cptCodes || [];
  if (cptCodes.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-muted);font-size:13px;padding:4px 0';
    empty.textContent = 'No CPT codes added.';
    body.appendChild(empty);
  } else {
    cptCodes.forEach((cpt, i) => {
      const item = document.createElement('div');
      item.className = 'cpt-item';

      const code = document.createElement('span');
      code.className = 'dx-code';
      code.textContent = cpt.code;
      const desc = document.createElement('span');
      desc.textContent = cpt.description;
      item.appendChild(code);
      item.appendChild(desc);

      if (!isSigned) {
        const rmBtn = document.createElement('button');
        rmBtn.className = 'btn btn-danger btn-sm';
        rmBtn.textContent = 'Remove';
        rmBtn.style.marginLeft = 'auto';
        rmBtn.addEventListener('click', () => {
          cptCodes.splice(i, 1);
          saveEncounter({ id: encounter.id, cptCodes });
          renderEncounter(encounter.id);
        });
        item.appendChild(rmBtn);
      }

      body.appendChild(item);
    });
  }

  card.appendChild(body);
  return card;
}

function openDiagnosisEntry(encounter) {
  let commonOpts = '<option value="">— Common ICD-10 Codes —</option>';
  COMMON_ICD10.forEach(c => {
    commonOpts += '<option value="' + esc(c.code) + '">' + esc(c.code + ' — ' + c.desc) + '</option>';
  });

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label" for="dx-common">Select Common Code</label>
      <select class="form-control" id="dx-common">${commonOpts}</select>
    </div>
    <div style="text-align:center;color:var(--text-muted);font-size:12px;margin:8px 0">— or enter manually —</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="dx-code">ICD-10 Code</label>
        <input class="form-control" id="dx-code" placeholder="e.g. I10" />
      </div>
      <div class="form-group">
        <label class="form-label" for="dx-desc">Description</label>
        <input class="form-control" id="dx-desc" placeholder="Diagnosis description" />
      </div>
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:6px;font-size:13px">
        <input type="checkbox" id="dx-primary" /> Primary diagnosis
      </label>
    </div>
  `;

  openModal({
    title: 'Add Diagnosis',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" id="dx-cancel">Cancel</button><button class="btn btn-primary" id="dx-save">Add</button>',
  });

  // Auto-fill from common dropdown
  document.getElementById('dx-common').addEventListener('change', (e) => {
    const sel = COMMON_ICD10.find(c => c.code === e.target.value);
    if (sel) {
      document.getElementById('dx-code').value = sel.code;
      document.getElementById('dx-desc').value = sel.desc;
    }
  });

  document.getElementById('dx-cancel').addEventListener('click', closeModal);
  document.getElementById('dx-save').addEventListener('click', () => {
    const code = document.getElementById('dx-code').value.trim();
    const description = document.getElementById('dx-desc').value.trim();
    if (!code || !description) { showToast('Code and description are required.', 'error'); return; }

    const diagnoses = encounter.diagnoses || [];
    if (diagnoses.some(d => d.code === code)) { showToast('Diagnosis code ' + code + ' already added.', 'error'); return; }
    const primary = document.getElementById('dx-primary').checked;
    if (primary) diagnoses.forEach(d => d.primary = false);
    diagnoses.push({ code, description, primary });
    saveEncounter({ id: encounter.id, diagnoses });
    closeModal();
    showToast('Diagnosis added.', 'success');
    renderEncounter(encounter.id);
  });
}

function openCPTEntry(encounter) {
  let commonOpts = '<option value="">— Common CPT Codes —</option>';
  COMMON_CPT.forEach(c => {
    commonOpts += '<option value="' + esc(c.code) + '">' + esc(c.code + ' — ' + c.desc) + '</option>';
  });

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label" for="cpt-common">Select Common Code</label>
      <select class="form-control" id="cpt-common">${commonOpts}</select>
    </div>
    <div style="text-align:center;color:var(--text-muted);font-size:12px;margin:8px 0">— or enter manually —</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="cpt-code">CPT Code</label>
        <input class="form-control" id="cpt-code" placeholder="e.g. 99213" />
      </div>
      <div class="form-group">
        <label class="form-label" for="cpt-desc">Description</label>
        <input class="form-control" id="cpt-desc" placeholder="Code description" />
      </div>
    </div>
  `;

  openModal({
    title: 'Add CPT Code',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" id="cpt-cancel">Cancel</button><button class="btn btn-primary" id="cpt-save">Add</button>',
  });

  document.getElementById('cpt-common').addEventListener('change', (e) => {
    const sel = COMMON_CPT.find(c => c.code === e.target.value);
    if (sel) {
      document.getElementById('cpt-code').value = sel.code;
      document.getElementById('cpt-desc').value = sel.desc;
    }
  });

  document.getElementById('cpt-cancel').addEventListener('click', closeModal);
  document.getElementById('cpt-save').addEventListener('click', () => {
    const code = document.getElementById('cpt-code').value.trim();
    const description = document.getElementById('cpt-desc').value.trim();
    if (!code || !description) { showToast('Code and description are required.', 'error'); return; }

    const cptCodes = encounter.cptCodes || [];
    if (cptCodes.some(c => c.code === code)) { showToast('CPT code ' + code + ' already added.', 'error'); return; }
    cptCodes.push({ code, description });
    saveEncounter({ id: encounter.id, cptCodes });
    closeModal();
    showToast('CPT code added.', 'success');
    renderEncounter(encounter.id);
  });
}

/* ============================================================
   Patient Summary Modal
   ============================================================ */
function openEncounterSummaryModal(encounterId) {
  const encounter = getEncounter(encounterId);
  if (!encounter) return;
  const patient = getPatient(encounter.patientId);
  const provider = getProvider(encounter.providerId);
  const note = getNoteByEncounter(encounterId);
  const vitals = getEncounterVitals(encounterId);
  const orders = getOrdersByEncounter(encounterId);
  const diagnoses = encounter.diagnoses || [];
  const cptCodes = encounter.cptCodes || [];

  const patName = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';
  const provName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : 'Unknown';

  let html = '<div class="encounter-summary" id="encounter-summary-content">';

  // Patient Info
  html += '<h3>Patient Information</h3>';
  html += '<p><strong>' + esc(patName) + '</strong>';
  if (patient) html += ' | MRN: ' + esc(patient.mrn) + ' | DOB: ' + esc(patient.dob || '');
  html += '</p>';
  html += '<p>Provider: ' + esc(provName) + ' | Date: ' + formatDateTime(encounter.dateTime) + '</p>';

  // Vitals
  if (vitals && vitals.length > 0) {
    const v = vitals[vitals.length - 1];
    html += '<h3>Vital Signs</h3><p>';
    if (v.tempF) html += 'Temp: ' + v.tempF + '°F ';
    if (v.bpSystolic) html += 'BP: ' + v.bpSystolic + '/' + v.bpDiastolic + ' ';
    if (v.heartRate) html += 'HR: ' + v.heartRate + ' ';
    if (v.respRate) html += 'RR: ' + v.respRate + ' ';
    if (v.spo2) html += 'SpO2: ' + v.spo2 + '% ';
    html += '</p>';
  }

  // Clinical Note
  if (note) {
    const bodyText = note.noteBody || '';
    html += '<h3>Clinical Note</h3>';
    html += '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:var(--bg-base);padding:12px;border-radius:6px;">' + esc(bodyText || '(not documented)') + '</pre>';
  }

  // Diagnoses
  if (diagnoses.length > 0) {
    html += '<h3>Diagnoses</h3><ul>';
    diagnoses.forEach(d => { html += '<li>' + esc(d.code || '') + ' — ' + esc(d.description || '') + '</li>'; });
    html += '</ul>';
  }

  // CPT Codes
  if (cptCodes.length > 0) {
    html += '<h3>CPT Codes</h3><ul>';
    cptCodes.forEach(c => { html += '<li>' + esc(c.code) + ' — ' + esc(c.description) + '</li>'; });
    html += '</ul>';
  }

  // Orders
  if (orders.length > 0) {
    html += '<h3>Orders</h3><ul>';
    orders.forEach(o => {
      const desc = o.type === 'Medication' ? (o.detail.drug || '') + ' ' + (o.detail.dose || '') : (o.detail.panel || o.detail.study || o.type);
      html += '<li><strong>' + esc(o.type) + ':</strong> ' + esc(desc) + ' (' + esc(o.priority) + ', ' + esc(o.status) + ')</li>';
    });
    html += '</ul>';
  }

  // Doctor's recommendations textarea
  html += '<h3>Additional Recommendations</h3>';
  html += '<textarea class="form-control" id="summary-recommendations" rows="4" placeholder="Add recommendations for the patient…"></textarea>';

  html += '</div>';

  const footerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" id="btn-print-encounter-summary">Print Summary</button>
  `;

  openModal({ title: 'Patient Summary', bodyHTML: html, footerHTML, size: 'lg' });

  document.getElementById('btn-print-encounter-summary').addEventListener('click', () => {
    const content = document.getElementById('encounter-summary-content');
    const recs = document.getElementById('summary-recommendations');
    const printWin = window.open('', '_blank', 'width=800,height=600');
    let printHTML = '<html><head><title>Patient Summary</title><style>body{font-family:sans-serif;padding:20px;font-size:13px}h3{margin:16px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}pre{background:#f5f5f5;padding:12px;border-radius:6px}ul{margin:4px 0}@media print{button{display:none}}</style></head><body>';
    printHTML += content.innerHTML;
    if (recs && recs.value.trim()) {
      printHTML += '<h3>Additional Recommendations</h3><p>' + esc(recs.value) + '</p>';
    }
    printHTML += '</body></html>';
    printWin.document.write(printHTML);
    printWin.document.close();
    printWin.print();
  });
}

/* ============================================================
   8a: Problem-Oriented A&P Helpers
   ============================================================ */
function _buildProblemRow(prob, idx) {
  const row = document.createElement('div');
  row.className = 'problem-oriented-row';
  row.style.cssText = 'border:1px solid var(--border,#ddd);border-radius:var(--radius,8px);padding:12px;background:var(--bg-card,#fff)';
  row.dataset.probIdx = idx;

  const topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';

  const numBadge = document.createElement('span');
  numBadge.style.cssText = 'font-weight:700;font-size:14px;color:var(--accent-blue,#4a7ce2);min-width:24px';
  numBadge.textContent = '#' + (idx + 1);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-control prob-name';
  nameInput.placeholder = 'Problem name…';
  nameInput.value = prob.name || '';
  nameInput.style.flex = '1';
  nameInput.required = true;
  nameInput.setAttribute('aria-required', 'true');

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn btn-danger btn-sm';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => row.remove());

  topRow.appendChild(numBadge);
  topRow.appendChild(nameInput);
  topRow.appendChild(removeBtn);
  row.appendChild(topRow);

  const assessLbl = document.createElement('label');
  assessLbl.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-secondary,#666)';
  assessLbl.textContent = 'Assessment';
  row.appendChild(assessLbl);
  const assessTA = document.createElement('textarea');
  assessTA.className = 'note-section-textarea prob-assessment';
  assessTA.placeholder = 'Assessment for this problem…';
  assessTA.value = prob.assessment || '';
  assessTA.style.minHeight = '50px';
  row.appendChild(assessTA);

  const planLbl = document.createElement('label');
  planLbl.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-secondary,#666);margin-top:6px';
  planLbl.textContent = 'Plan';
  row.appendChild(planLbl);
  const planTA = document.createElement('textarea');
  planTA.className = 'note-section-textarea prob-plan';
  planTA.placeholder = 'Plan for this problem…';
  planTA.value = prob.plan || '';
  planTA.style.minHeight = '50px';
  row.appendChild(planTA);

  return row;
}

function _collectProblemsFromDOM() {
  const container = document.getElementById('problems-container');
  if (!container) return [];
  const problems = [];
  container.querySelectorAll('.problem-oriented-row').forEach(row => {
    const name = row.querySelector('.prob-name');
    const assess = row.querySelector('.prob-assessment');
    const plan = row.querySelector('.prob-plan');
    problems.push({
      name: name ? name.value : '',
      assessment: assess ? assess.value : '',
      plan: plan ? plan.value : '',
    });
  });
  return problems;
}

function _serializeProblemsToNote(note, encounterId) {
  const problems = _collectProblemsFromDOM();
  // Save problems array on the note
  const noteData = getNoteByEncounter(encounterId) || {};
  noteData.encounterId = encounterId;
  noteData.problems = problems;
  // Also generate flat assessment/plan for backwards compat
  const assessParts = [];
  const planParts = [];
  problems.forEach((p, i) => {
    if (p.name) {
      assessParts.push((i + 1) + '. ' + p.name + ': ' + (p.assessment || ''));
      planParts.push((i + 1) + '. ' + p.name + ': ' + (p.plan || ''));
    }
  });
  noteData.assessment = assessParts.join('\n');
  noteData.plan = planParts.join('\n');
  saveNote(noteData);
}

/* ============================================================
   8b: In-Note Quick Orders Panel
   ============================================================ */
function buildQuickOrdersPanel(encounterId, patientId) {
  const panel = document.createElement('div');
  panel.className = 'card';
  panel.style.margin = '0 20px 20px';

  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  hdr.style.cursor = 'pointer';

  const title = document.createElement('span');
  title.className = 'card-title';
  title.innerHTML = 'Quick Orders <span id="quick-order-count" style="font-size:12px;color:var(--text-secondary,#666);margin-left:8px"></span>';

  const chevron = document.createElement('span');
  chevron.textContent = '▶';
  chevron.style.cssText = 'font-size:11px;color:var(--text-muted);margin-left:auto';
  chevron.id = 'quick-orders-chevron';

  hdr.appendChild(title);
  hdr.appendChild(chevron);
  panel.appendChild(hdr);

  const body = document.createElement('div');
  body.id = 'quick-orders-body';
  body.style.display = 'none';
  body.style.padding = '14px 20px';

  // Quick-action buttons
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap';

  const orderTypes = [
    { type: 'Lab', label: 'Lab', icon: '' },
    { type: 'Medication', label: 'Medication', icon: '' },
    { type: 'Imaging', label: 'Imaging', icon: '' },
  ];

  orderTypes.forEach(ot => {
    const btn = makeEncBtn(ot.label, 'btn btn-secondary btn-sm', () => {
      _showQuickOrderForm(body, encounterId, patientId, ot.type);
    });
    btnRow.appendChild(btn);
  });
  body.appendChild(btnRow);

  // Order form placeholder
  const formArea = document.createElement('div');
  formArea.id = 'quick-order-form-area';
  body.appendChild(formArea);

  // Orders placed during this encounter
  const listArea = document.createElement('div');
  listArea.id = 'quick-order-list';
  body.appendChild(listArea);

  panel.appendChild(body);

  // Toggle collapse
  hdr.addEventListener('click', () => {
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    chevron.textContent = isOpen ? '▶' : '▼';
  });

  // Update count
  _updateQuickOrderCount(encounterId);

  return panel;
}

function _updateQuickOrderCount(encounterId) {
  const orders = (typeof getOrders === 'function' ? getOrders() : []).filter(o => o.encounterId === encounterId);
  const countEl = document.getElementById('quick-order-count');
  if (countEl) countEl.textContent = orders.length > 0 ? '(' + orders.length + ' placed)' : '';
}

function _showQuickOrderForm(container, encounterId, patientId, orderType) {
  const formArea = document.getElementById('quick-order-form-area');
  if (!formArea) return;
  formArea.innerHTML = '';

  const form = document.createElement('div');
  form.style.cssText = 'border:1px solid var(--border,#ddd);border-radius:var(--radius,8px);padding:12px;margin-bottom:12px;background:var(--surface-2,#f8f8f8)';

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-weight:600;margin-bottom:8px';
  titleEl.textContent = 'New ' + orderType + ' Order';
  form.appendChild(titleEl);

  let detailFields = {};

  if (orderType === 'Lab') {
    const panelLbl = document.createElement('label');
    panelLbl.className = 'form-label'; panelLbl.textContent = 'Lab Panel/Test';
    const panelInp = document.createElement('input');
    panelInp.className = 'form-control'; panelInp.id = 'qo-lab-panel'; panelInp.placeholder = 'e.g., CBC, BMP, Lipid Panel';
    panelInp.required = true; panelInp.setAttribute('aria-required', 'true');
    form.appendChild(panelLbl); form.appendChild(panelInp);
    detailFields = { getDetail: () => ({ panel: panelInp.value }) };
  } else if (orderType === 'Medication') {
    const drugLbl = document.createElement('label');
    drugLbl.className = 'form-label'; drugLbl.textContent = 'Drug';
    const drugInp = document.createElement('input');
    drugInp.className = 'form-control'; drugInp.id = 'qo-med-drug'; drugInp.placeholder = 'Drug name';
    drugInp.required = true; drugInp.setAttribute('aria-required', 'true');
    const doseLbl = document.createElement('label');
    doseLbl.className = 'form-label'; doseLbl.textContent = 'Dose';
    doseLbl.style.marginTop = '6px';
    const doseInp = document.createElement('input');
    doseInp.className = 'form-control'; doseInp.id = 'qo-med-dose'; doseInp.placeholder = 'e.g., 500mg PO BID';
    doseInp.required = true; doseInp.setAttribute('aria-required', 'true');
    form.appendChild(drugLbl); form.appendChild(drugInp);
    form.appendChild(doseLbl); form.appendChild(doseInp);
    detailFields = { getDetail: () => ({ drug: drugInp.value, dose: doseInp.value }) };
  } else if (orderType === 'Imaging') {
    const studyLbl = document.createElement('label');
    studyLbl.className = 'form-label'; studyLbl.textContent = 'Study';
    const studyInp = document.createElement('input');
    studyInp.className = 'form-control'; studyInp.id = 'qo-img-study'; studyInp.placeholder = 'e.g., Chest X-Ray, CT Abdomen';
    studyInp.required = true; studyInp.setAttribute('aria-required', 'true');
    form.appendChild(studyLbl); form.appendChild(studyInp);
    detailFields = { getDetail: () => ({ study: studyInp.value }) };
  }

  // Priority
  const prioRow = document.createElement('div');
  prioRow.style.cssText = 'display:flex;gap:8px;margin-top:8px;align-items:center';
  const prioLbl = document.createElement('label');
  prioLbl.className = 'form-label'; prioLbl.textContent = 'Priority'; prioLbl.style.margin = '0';
  const prioSel = document.createElement('select');
  prioSel.className = 'form-control'; prioSel.style.maxWidth = '150px';
  ['Routine', 'Urgent', 'STAT'].forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    prioSel.appendChild(opt);
  });
  prioRow.appendChild(prioLbl); prioRow.appendChild(prioSel);
  form.appendChild(prioRow);

  // Notes
  const notesLbl = document.createElement('label');
  notesLbl.className = 'form-label'; notesLbl.textContent = 'Notes'; notesLbl.style.marginTop = '6px';
  const notesInp = document.createElement('input');
  notesInp.className = 'form-control'; notesInp.placeholder = 'Clinical indication…';
  form.appendChild(notesLbl); form.appendChild(notesInp);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;margin-top:10px';
  const cancelBtn = makeEncBtn('Cancel', 'btn btn-secondary btn-sm', () => { formArea.innerHTML = ''; });
  const submitBtn = makeEncBtn('Place Order', 'btn btn-primary btn-sm', () => {
    const detail = detailFields.getDetail();
    saveOrder({
      encounterId: encounterId,
      patientId: patientId,
      type: orderType,
      priority: prioSel.value,
      status: 'Pending',
      detail: detail,
      notes: notesInp.value,
      orderedBy: getSessionUser().id,
    });
    showToast(orderType + ' order placed.', 'success');
    formArea.innerHTML = '';
    _updateQuickOrderCount(encounterId);
  });
  btnRow.appendChild(cancelBtn); btnRow.appendChild(submitBtn);
  form.appendChild(btnRow);

  formArea.appendChild(form);
}

/* ============================================================
   8d: Co-signature Workflow
   ============================================================ */
function buildCoSignatureSection(encounterId, note) {
  const section = document.createElement('div');
  section.style.cssText = 'margin:0 20px 20px';

  if (!note.signed) return section; // only show on signed notes

  // Pending co-signature indicator
  if (note.coSignatureRequestedOf && !note.coSignedBy) {
    const pendingBadge = document.createElement('div');
    pendingBadge.style.cssText = 'background:var(--badge-warning-bg);border:1px solid var(--warning);border-radius:var(--radius,8px);padding:10px 14px;display:flex;align-items:center;gap:8px;margin-bottom:12px';
    const icon = document.createElement('span');
    icon.textContent = '⏳';
    const text = document.createElement('span');
    const reqProv = typeof getProvider === 'function' ? getProvider(note.coSignatureRequestedOf) : null;
    text.textContent = 'Co-signature pending from ' + (reqProv ? reqProv.firstName + ' ' + reqProv.lastName + ', ' + reqProv.degree : note.coSignatureRequestedOf);
    pendingBadge.appendChild(icon);
    pendingBadge.appendChild(text);

    // If current user is the requested co-signer, show sign button
    const currentUser = getSessionUser();
    if (currentUser && currentUser.id === note.coSignatureRequestedOf) {
      const cosignBtn = makeEncBtn('Co-Sign Note', 'btn btn-success btn-sm', () => {
        saveNote({
          encounterId: encounterId,
          coSignedBy: currentUser.id,
          coSignedAt: new Date().toISOString(),
        });
        showToast('Note co-signed.', 'success');
        renderEncounter(encounterId);
      });
      cosignBtn.style.marginLeft = 'auto';
      pendingBadge.appendChild(cosignBtn);
    }
    section.appendChild(pendingBadge);
  }

  // Co-signed badge
  if (note.coSignedBy) {
    const signedBadge = document.createElement('div');
    signedBadge.style.cssText = 'background:var(--badge-success-bg);border:1px solid var(--success);border-radius:var(--radius,8px);padding:10px 14px;display:flex;align-items:center;gap:8px;margin-bottom:12px';
    const coSignProv = typeof getProvider === 'function' ? getProvider(note.coSignedBy) : null;
    signedBadge.innerHTML = '<span>&#10003;</span>';
    const text = document.createElement('span');
    text.textContent = 'Co-signed by ' + (coSignProv ? coSignProv.firstName + ' ' + coSignProv.lastName + ', ' + coSignProv.degree : note.coSignedBy) +
      ' on ' + (note.coSignedAt ? formatDateTime(note.coSignedAt) : '');
    signedBadge.appendChild(text);
    section.appendChild(signedBadge);
  }

  // Request Co-signature button (only if not already requested/co-signed)
  if (!note.coSignatureRequestedOf && !note.coSignedBy) {
    const reqBtn = makeEncBtn('Request Co-signature', 'btn btn-secondary btn-sm', () => {
      _openCoSignRequestModal(encounterId);
    });
    reqBtn.style.marginBottom = '12px';
    section.appendChild(reqBtn);
  }

  return section;
}

function _openCoSignRequestModal(encounterId) {
  const providers = typeof getProviders === 'function' ? getProviders() : [];
  const currentUser = getSessionUser();

  let optionsHTML = '<option value="">-- Select Provider --</option>';
  providers.forEach(p => {
    if (p.id !== currentUser.id) {
      optionsHTML += '<option value="' + esc(p.id) + '">' + esc(p.firstName + ' ' + p.lastName + ', ' + p.degree) + '</option>';
    }
  });

  openModal({
    title: 'Request Co-signature',
    bodyHTML:
      '<div class="form-group">' +
        '<label class="form-label" for="cosign-provider">Request co-signature from:</label>' +
        '<select class="form-control" id="cosign-provider">' + optionsHTML + '</select>' +
      '</div>',
    footerHTML:
      '<button class="btn btn-secondary" id="cosign-cancel">Cancel</button>' +
      '<button class="btn btn-primary" id="cosign-submit">Send Request</button>',
  });

  document.getElementById('cosign-cancel').addEventListener('click', closeModal);
  document.getElementById('cosign-submit').addEventListener('click', () => {
    const provId = document.getElementById('cosign-provider').value;
    if (!provId) { showToast('Select a provider.', 'error'); return; }
    saveNote({ encounterId: encounterId, coSignatureRequestedOf: provId });
    closeModal();
    showToast('Co-signature requested.', 'success');
    renderEncounter(encounterId);
  });
}

/* ============================================================
   8e: OB Context Banner in Encounter
   ============================================================ */
function buildOBContextBanner(patientId) {
  const banner = document.createElement('div');
  if (typeof getPrenatalVisits !== 'function') return banner;

  const visits = getPrenatalVisits(patientId);
  if (!visits || visits.length === 0) return banner;

  // Find active prenatal record (most recent)
  const active = visits.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
  if (!active) return banner;

  banner.style.cssText = 'background:color-mix(in srgb, var(--accent-obgyn) 12%, transparent);border:1px solid color-mix(in srgb, var(--accent-obgyn) 50%, transparent);border-radius:var(--radius,8px);padding:8px 14px;margin:0 20px 12px;font-size:13px;display:flex;gap:16px;flex-wrap:wrap;align-items:center';

  const parts = [];

  // Calculate EGA from EDD or LMP
  const today = new Date();
  let egaText = '';
  if (active.edd) {
    const edd = new Date(active.edd);
    const daysUntilEdd = Math.round((edd - today) / 86400000);
    const totalDays = 280 - daysUntilEdd;
    if (totalDays >= 0 && totalDays <= 300) {
      const weeks = Math.floor(totalDays / 7);
      const days = totalDays % 7;
      egaText = 'EGA: ' + weeks + 'w ' + days + 'd';
    }
  } else if (active.lmp) {
    const lmp = new Date(active.lmp);
    const daysSinceLmp = Math.round((today - lmp) / 86400000);
    if (daysSinceLmp >= 0 && daysSinceLmp <= 300) {
      const weeks = Math.floor(daysSinceLmp / 7);
      const days = daysSinceLmp % 7;
      egaText = 'EGA: ' + weeks + 'w ' + days + 'd';
    }
  }
  if (egaText) parts.push(egaText);
  if (active.edd) parts.push('EDD: ' + active.edd);

  // Gravida/Para
  if (active.gravida !== undefined || active.para !== undefined) {
    const g = active.gravida || 0;
    const t = active.term || 0;
    const p = active.preterm || 0;
    const a = active.abortions || 0;
    const l = active.living || 0;
    parts.push('G' + g + 'T' + t + 'P' + p + 'A' + a + 'L' + l);
  }

  // GBS status
  if (active.gbsStatus) parts.push('GBS: ' + active.gbsStatus);

  if (parts.length === 0) return banner;

  const icon = document.createElement('span');
  icon.style.cssText = 'font-weight:700;color:var(--accent-obgyn)';
  icon.textContent = 'OB';
  banner.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = parts.join(' | ');
  banner.appendChild(text);

  return banner;
}
