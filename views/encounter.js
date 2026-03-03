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
  const vitals   = getEncounterVitals(encounterId);

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
    `,
  });
  setActiveNav('dashboard');

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

  /* ---------- Vitals section ---------- */
  app.appendChild(buildVitalsSection(encounter, vitals, isSigned));

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

  // Note field definitions
  const fields = [
    { key: 'chiefComplaint', label: 'Chief Complaint',                tall: false },
    { key: 'hpi',            label: 'History of Present Illness',     tall: true  },
    { key: 'ros',            label: 'Review of Systems',              tall: true  },
    { key: 'physicalExam',   label: 'Physical Examination',          tall: true  },
    { key: 'assessment',     label: 'Assessment',                     tall: true  },
    { key: 'plan',           label: 'Plan',                           tall: true  },
  ];

  const textareas = {};

  fields.forEach(f => {
    const section = document.createElement('div');
    section.className = 'note-section';
    const label = document.createElement('div');
    label.className = 'note-section-label';
    label.textContent = f.label;

    if (isSigned) {
      const readDiv = document.createElement('div');
      readDiv.className = 'note-readonly';
      readDiv.textContent = note[f.key] || '(not documented)';
      section.appendChild(label);
      section.appendChild(readDiv);
    } else {
      const ta = document.createElement('textarea');
      ta.className = 'note-textarea' + (f.tall ? ' tall' : '');
      ta.placeholder = f.label + '…';
      ta.value = note[f.key] || '';
      ta.id = 'note-' + f.key;
      textareas[f.key] = ta;
      section.appendChild(label);
      section.appendChild(ta);
    }
    noteBody.appendChild(section);
  });

  noteCard.appendChild(noteBody);

  /* ---------- Unsigned: Sign area + autosave ---------- */
  if (!isSigned) {
    const signArea = document.createElement('div');
    signArea.id = 'sign-area';
    signArea.style.display = 'none';
    signArea.className = 'sign-area';
    signArea.style.margin = '0 20px 0';

    const signTitle = document.createElement('div');
    signTitle.className = 'sign-area-title';
    signTitle.textContent = 'Signing as:';

    const providers = getProviders();
    const signingSelect = document.createElement('select');
    signingSelect.className = 'form-control';
    signingSelect.style.marginBottom = '12px';

    const encProvider = getProvider(encounter.providerId);
    const sorted = encProvider
      ? [encProvider, ...providers.filter(p => p.id !== encounter.providerId)]
      : providers;
    sorted.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.firstName + ' ' + p.lastName + ', ' + p.degree;
      signingSelect.appendChild(opt);
    });

    const signBtns = document.createElement('div');
    signBtns.style.display = 'flex'; signBtns.style.gap = '8px';

    const cancelSignBtn = makeEncBtn('Cancel', 'btn btn-secondary', () => { signArea.style.display = 'none'; });
    const confirmSignBtn = makeEncBtn('Confirm Signature', 'btn btn-success', () => {
      const providerId = signingSelect.value;
      if (!providerId) { showToast('Please select a provider.', 'error'); return; }
      saveNote({ ...readNoteFields(textareas), encounterId, signed: false });
      saveNote({ encounterId, signed: true, signedBy: providerId, signedAt: new Date().toISOString() });
      saveEncounter({ id: encounterId, status: 'Signed' });
      clearTimeout(autosaveTimer); autosaveTimer = null;
      showToast('Note signed successfully.', 'success');
      renderEncounter(encounterId);
    });

    signBtns.appendChild(cancelSignBtn);
    signBtns.appendChild(confirmSignBtn);
    signArea.appendChild(signTitle);
    signArea.appendChild(signingSelect);
    signArea.appendChild(signBtns);

    // Card footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.borderTop = '1px solid var(--border)'; footer.style.padding = '14px 20px';

    const lastModEl = document.createElement('span');
    lastModEl.className = 'text-muted text-sm'; lastModEl.style.flex = '1'; lastModEl.id = 'last-modified';
    lastModEl.textContent = note.lastModified ? 'Last saved: ' + formatDateTime(note.lastModified) : '';

    const signBtn = makeEncBtn('Sign Note', 'btn btn-success', () => {
      if (!getProviders().length) { showToast('Add a provider first.', 'error'); return; }
      signArea.style.display = signArea.style.display === 'none' ? 'block' : 'none';
    });

    footer.appendChild(lastModEl); footer.appendChild(signBtn);
    noteCard.appendChild(footer);
    app.appendChild(noteCard);
    app.appendChild(signArea);

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

  const provLbl = document.createElement('label');
  provLbl.className = 'form-label'; provLbl.textContent = 'Signing as';
  const provSelect = document.createElement('select');
  provSelect.className = 'form-control'; provSelect.style.marginBottom = '10px';

  const providers = getProviders();
  const encProv = getProvider(encounter.providerId);
  const sortedProvs = encProv ? [encProv, ...providers.filter(p => p.id !== encounter.providerId)] : providers;
  sortedProvs.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.firstName + ' ' + p.lastName + ', ' + p.degree;
    provSelect.appendChild(opt);
  });

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
    const addedBy = provSelect.value;
    if (!text) { showToast('Addendum text is required.', 'error'); return; }
    if (!addedBy) { showToast('Select a signing provider.', 'error'); return; }
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
  form.appendChild(provLbl); form.appendChild(provSelect);
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
    chiefComplaint: textareas['chiefComplaint']?.value,
    hpi:            textareas['hpi']?.value,
    ros:            textareas['ros']?.value,
    physicalExam:   textareas['physicalExam']?.value,
    assessment:     textareas['assessment']?.value,
    plan:           textareas['plan']?.value,
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
  const dismissBtn = makeEncBtn('Dismiss', 'btn btn-ghost btn-sm', () => { banner.remove(); });

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
    banner.remove();
    const badge = document.createElement('div');
    badge.className = 'med-rec-complete-badge';
    const actions = records.map(r => r.medName + ': ' + r.action).join(', ');
    badge.textContent = '✓ Medication reconciliation complete — ' + actions;
    container.appendChild(badge);
    showToast('Medication reconciliation saved.', 'success');
  });

  footerDiv.appendChild(completeBtn);
  body.appendChild(footerDiv);
  banner.appendChild(body);
  container.appendChild(banner);
  return container;
}
