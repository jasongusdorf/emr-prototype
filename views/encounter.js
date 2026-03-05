/* ============================================================
   views/encounter.js — Clinical note form + vitals + autosave + sign + addenda
   ============================================================ */

let autosaveTimer = null;

function renderEncounter(encounterId) {
  clearTimeout(autosaveTimer);
  autosaveTimer = null;

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
      <a href="${patient ? '#chart/' + patient.id : '#dashboard'}" class="btn btn-secondary btn-sm">← Chart</a>
      <a href="#orders/${encounterId}" class="btn btn-secondary btn-sm">Orders</a>
      <button class="btn btn-secondary btn-sm" id="btn-patient-summary">Patient Summary</button>
    `,
  });
  setActiveNav('dashboard');

  // Patient identity banner
  if (patient) app.appendChild(buildPatientBanner(patient.id));

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
  autosaveEl.className = 'autosave-indicator';
  autosaveEl.id = 'autosave-indicator';
  if (!isSigned) autosaveEl.textContent = 'Edits autosave';
  headerRight.appendChild(autosaveEl);

  if (!isSigned) {
    const templateBtn = makeEncBtn('Use Template', 'btn btn-secondary btn-sm', () => openTemplatePickerModal(note, encounterId));
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

  // Migrate old structured notes into freeform noteBody
  let noteBodyText = note.noteBody || '';
  if (!noteBodyText) {
    const oldFields = [
      { key: 'chiefComplaint', label: 'Chief Complaint' },
      { key: 'hpi',            label: 'History of Present Illness' },
      { key: 'ros',            label: 'Review of Systems' },
      { key: 'physicalExam',   label: 'Physical Examination' },
      { key: 'assessment',     label: 'Assessment' },
      { key: 'plan',           label: 'Plan' },
    ];
    const parts = [];
    oldFields.forEach(f => {
      if (note[f.key]) {
        parts.push(f.label + ':\n' + note[f.key]);
      }
    });
    if (parts.length > 0) noteBodyText = parts.join('\n\n');
  }

  const textareas = {};

  if (isSigned) {
    const section = document.createElement('div');
    section.className = 'note-section';
    const readDiv = document.createElement('div');
    readDiv.className = 'note-readonly';
    readDiv.style.whiteSpace = 'pre-wrap';
    if (noteBodyText) {
      readDiv.textContent = noteBodyText;
    } else {
      readDiv.textContent = '(not documented)';
      readDiv.classList.add('note-readonly-empty');
    }
    section.appendChild(readDiv);
    noteBody.appendChild(section);
  } else {
    const section = document.createElement('div');
    section.className = 'note-section';
    const ta = document.createElement('textarea');
    ta.className = 'note-textarea freeform';
    ta.placeholder = 'Clinical note…';
    ta.value = noteBodyText;
    ta.id = 'note-noteBody';
    textareas['noteBody'] = ta;
    section.appendChild(ta);
    noteBody.appendChild(section);
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
        saveNote({ ...noteFields, encounterId, signed: false });
        saveNote({ encounterId, signed: true, signedBy: providerId, signedAt: signedAt.toISOString() });
        saveEncounter({ id: encounterId, status: 'Signed' });
        clearTimeout(autosaveTimer); autosaveTimer = null;
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

    const signBtn = makeEncBtn('Sign Note', 'btn btn-success', () => {
      if (!canSignNotes()) { showToast('Only attending physicians can sign notes.', 'error'); return; }
      if (!getProviders().length) { showToast('Add a provider first.', 'error'); return; }
      openSignModal();
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

    // Autosave
    function triggerAutosave() {
      clearTimeout(autosaveTimer);
      const ind = document.getElementById('autosave-indicator');
      if (ind) { ind.className = 'autosave-indicator saving'; ind.textContent = 'Saving…'; }
      autosaveTimer = setTimeout(() => {
        saveNote({ ...readNoteFields(textareas), encounterId });
        const mod = document.getElementById('last-modified');
        if (mod) mod.textContent = 'Last saved: ' + formatDateTime(new Date().toISOString());
        if (ind) {
          ind.className = 'autosave-indicator saved'; ind.textContent = '✓ Saved';
          setTimeout(() => { if (ind) { ind.className = 'autosave-indicator'; ind.textContent = ''; } }, 2000);
        }
        autosaveTimer = null;
      }, 1000);
    }

    Object.values(textareas).forEach(ta => ta.addEventListener('input', triggerAutosave));

  } else {
    app.appendChild(noteCard);
    // Addenda section for signed notes
    app.appendChild(buildAddendaSection(encounterId, note, encounter));

    /* ---------- Diagnoses & Billing card ---------- */
    app.appendChild(buildBillingSection(encounter, isSigned));
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
  return {
    noteBody: textareas['noteBody']?.value || '',
  };
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
function openTemplatePickerModal(note, encounterId) {
  const templates = getNoteTemplates();

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

      card.appendChild(name);
      card.appendChild(type);

      card.addEventListener('click', () => {
        const applyTemplate = () => {
          const fields = ['chiefComplaint','hpi','ros','physicalExam','assessment','plan'];
          fields.forEach(f => {
            const ta = document.getElementById('note-' + f);
            if (ta && tmpl[f]) {
              ta.value = tmpl[f];
              ta.dispatchEvent(new Event('input'));
            }
          });
          closeModal();
          showToast('Template applied: ' + tmpl.name, 'success');
        };

        const hasContent = ['chiefComplaint','hpi','ros','physicalExam','assessment','plan'].some(f => {
          const ta = document.getElementById('note-' + f);
          return ta && ta.value.trim().length > 0;
        });

        if (hasContent) {
          closeModal();
          confirmAction({
            title: 'Replace Note Content?',
            message: 'This will replace the current note content with the "' + tmpl.name + '" template. Continue?',
            confirmLabel: 'Apply Template',
            danger: false,
            onConfirm: applyTemplate,
          });
        } else {
          applyTemplate();
        }
      });

      grid.appendChild(card);
    });

    bodyEl.appendChild(grid);
  }

  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('modal');
  document.getElementById('modal-title').textContent = 'Choose Note Template';
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-body').appendChild(bodyEl);
  document.getElementById('modal-footer').innerHTML = '<button class="btn btn-secondary" id="tmpl-cancel">Cancel</button>';
  modal.className = 'modal modal-lg';
  backdrop.classList.remove('hidden');
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
    badge.textContent = '✓ Medication reconciliation complete — ' + actions;
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
  title.textContent = '⚠ Medication Reconciliation Needed — ' + currentMeds.length + ' current medication(s)';

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
    saveMedRec({ encounterId: encounter.id, medName: '__dismissed__', action: 'Dismissed', notes: '' });
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
    saveMedRec(encounterId, records);

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
    badge.textContent = '✓ Medication reconciliation complete — ' + actions;
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
      <label class="form-label">Select Common Code</label>
      <select class="form-control" id="dx-common">${commonOpts}</select>
    </div>
    <div style="text-align:center;color:var(--text-muted);font-size:12px;margin:8px 0">— or enter manually —</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">ICD-10 Code</label>
        <input class="form-control" id="dx-code" placeholder="e.g. I10" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
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
      <label class="form-label">Select Common Code</label>
      <select class="form-control" id="cpt-common">${commonOpts}</select>
    </div>
    <div style="text-align:center;color:var(--text-muted);font-size:12px;margin:8px 0">— or enter manually —</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">CPT Code</label>
        <input class="form-control" id="cpt-code" placeholder="e.g. 99213" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
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
