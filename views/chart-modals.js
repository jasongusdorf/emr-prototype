/* ============================================================
   views/chart-modals.js — All chart modal dialogs: allergy,
   PMH, medication, social history, surgery, family history,
   new encounter, edit patient, problems, lab/imaging/micro/path
   results, immunizations, referrals, documents
   ============================================================ */

/* ============================================================
   MODALS — Allergy
   ============================================================ */
function openAllergyModal(patientId, id) {
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
  const existing = id ? getPatientAllergies(patientId).find(a => a.id === id) : null;
  const isEdit = !!existing;

  const severities = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];
  const types = ['Drug', 'Food', 'Environmental', 'Latex', 'Contrast', 'Other'];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Allergen *</label>
      <input class="form-control" id="al-allergen" value="${existing ? esc(existing.allergen) : ''}"
        placeholder="Drug, food, or substance name" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-control" id="al-type">
          ${types.map(t => `<option${existing && existing.type === t ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Severity</label>
        <select class="form-control" id="al-severity">
          ${severities.map(s => `<option${existing && existing.severity === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Reaction / Symptoms *</label>
      <input class="form-control" id="al-reaction" value="${existing ? esc(existing.reaction) : ''}"
        placeholder="e.g. Anaphylaxis, urticaria, GI upset" />
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="al-cancel">Cancel</button>
    <button class="btn btn-primary" id="al-save">${isEdit ? 'Save Changes' : 'Add Allergy'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Allergy' : 'Add Allergy', bodyHTML, footerHTML });

  document.getElementById('al-cancel').addEventListener('click', closeModal);
  document.getElementById('al-save').addEventListener('click', () => {
    const allergen = document.getElementById('al-allergen').value.trim();
    const reaction = document.getElementById('al-reaction').value.trim();
    if (!allergen || !reaction) { showToast('Allergen and reaction are required.', 'error'); return; }
    savePatientAllergy({
      id: id || undefined, patientId, allergen, reaction,
      type:     document.getElementById('al-type').value,
      severity: document.getElementById('al-severity').value,
    });
    closeModal();
    showToast(isEdit ? 'Allergy updated.' : 'Allergy added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Past Medical History
   ============================================================ */
function openPMHModal(patientId, id) {
  const existing = id ? getPatientDiagnoses(patientId).find(d => d.id === id) : null;
  const isEdit = !!existing;

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Diagnosis Name *</label>
      <input class="form-control" id="pmh-name" value="${existing ? esc(existing.name) : ''}"
        placeholder="e.g. Essential Hypertension" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">ICD-10 Code</label>
        <input class="form-control" id="pmh-icd" value="${existing ? esc(existing.icd10) : ''}"
          placeholder="e.g. I10" />
      </div>
      <div class="form-group">
        <label class="form-label">Onset / Diagnosis Date</label>
        <input class="form-control" id="pmh-onset" type="date" value="${existing ? esc(existing.onsetDate) : ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Supporting Objective Evidence</label>
      <textarea class="note-textarea" id="pmh-evidence" style="min-height:100px"
        placeholder="Lab values, imaging findings, diagnostic criteria met…">${existing ? esc(existing.evidenceNotes) : ''}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="pmh-cancel">Cancel</button>
    <button class="btn btn-primary" id="pmh-save">${isEdit ? 'Save Changes' : 'Add Diagnosis'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Diagnosis' : 'Add Diagnosis', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('pmh-cancel').addEventListener('click', closeModal);
  document.getElementById('pmh-save').addEventListener('click', () => {
    const name = document.getElementById('pmh-name').value.trim();
    if (!name) { showToast('Diagnosis name is required.', 'error'); return; }
    savePatientDiagnosis({
      id: id || undefined, patientId, name,
      icd10:         document.getElementById('pmh-icd').value.trim(),
      onsetDate:     document.getElementById('pmh-onset').value,
      evidenceNotes: document.getElementById('pmh-evidence').value,
    });
    closeModal();
    showToast(isEdit ? 'Diagnosis updated.' : 'Diagnosis added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Medication
   ============================================================ */
function openMedicationModal(patientId, id, defaultSetting) {
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
  const existing = id ? getPatientMedications(patientId).find(m => m.id === id) : null;
  const isEdit = !!existing;
  const curSetting = existing ? (existing.setting || 'Outpatient') : (defaultSetting || 'Outpatient');
  const units  = ['mg', 'mcg', 'g', 'mEq', 'units', 'mL', 'mg/dL', 'Other'];
  const routes = ['PO', 'IV', 'IM', 'SQ', 'SL', 'Topical', 'Inhaled', 'PR', 'NG', 'Other'];
  const freqs  = ['QDay', 'BID', 'TID', 'QID', 'Q4h', 'Q6h', 'Q8h', 'Q12h', 'QWeek', 'PRN', 'Once', 'Other'];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Medication Name *</label>
      <div class="med-autocomplete-container">
        <input class="form-control" id="med-name" value="${existing ? esc(existing.name) : ''}"
          placeholder="Generic or brand name" />
      </div>
    </div>
    <div id="chart-med-dose-pills-container"></div>
    <div class="form-row-3" id="chart-med-dose-row">
      <div class="form-group">
        <label class="form-label">Dose</label>
        <input class="form-control" id="med-dose" value="${existing ? esc(existing.dose) : ''}" placeholder="e.g. 10" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-control" id="med-unit">
          ${units.map(u => `<option${existing && existing.unit === u ? ' selected' : ''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Route</label>
        <select class="form-control" id="med-route">
          ${routes.map(r => `<option${existing && existing.route === r ? ' selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Frequency</label>
        <select class="form-control" id="med-freq">
          ${freqs.map(f => `<option${existing && existing.frequency === f ? ' selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="med-status">
          <option${!existing || existing.status === 'Current' ? ' selected' : ''}>Current</option>
          <option${existing && existing.status === 'Past' ? ' selected' : ''}>Past</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Setting</label>
        <select class="form-control" id="med-setting">
          <option value="Outpatient"${curSetting === 'Outpatient' ? ' selected' : ''}>Outpatient</option>
          <option value="Inpatient"${curSetting === 'Inpatient' ? ' selected' : ''}>Inpatient</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Start Date</label>
        <input class="form-control" id="med-start" type="date" value="${existing ? esc(existing.startDate) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">End Date</label>
        <input class="form-control" id="med-end" type="date" value="${existing ? esc(existing.endDate) : ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Indication</label>
        <input class="form-control" id="med-indication" value="${existing ? esc(existing.indication) : ''}"
          placeholder="Reason / diagnosis" />
      </div>
      <div class="form-group">
        <label class="form-label">Prescribed By</label>
        <input class="form-control" id="med-prescriber" value="${existing ? esc(existing.prescribedBy) : ''}"
          placeholder="Provider name" />
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="med-cancel">Cancel</button>
    <button class="btn btn-primary" id="med-save">${isEdit ? 'Save Changes' : 'Add Medication'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Medication' : 'Add Medication', bodyHTML, footerHTML, size: 'lg' });

  // Attach medication autocomplete
  const medNameInput = document.getElementById('med-name');
  if (medNameInput && typeof attachMedAutocomplete === 'function') {
    attachMedAutocomplete(medNameInput, {
      onSelect: (medEntry, defaultForm) => {
        medNameInput.value = medEntry.generic;
        const doseInput = document.getElementById('med-dose');
        const unitSel   = document.getElementById('med-unit');
        const routeSel  = document.getElementById('med-route');
        const freqSel   = document.getElementById('med-freq');
        const indInput  = document.getElementById('med-indication');

        if (unitSel)  unitSel.value  = defaultForm.unit;
        if (routeSel) routeSel.value = defaultForm.route;
        if (freqSel)  freqSel.value  = defaultForm.defaultFreq;
        if (indInput && !indInput.value && medEntry.commonIndications.length > 0) {
          indInput.value = medEntry.commonIndications[0];
        }

        // Build dose pills
        const pillsContainer = document.getElementById('chart-med-dose-pills-container');
        if (pillsContainer) {
          let html = '<label class="form-label" style="font-size:12px;margin-bottom:4px">Dose</label><div class="med-dose-pills">';
          medEntry.doseForms.forEach((df, i) => {
            html += '<div class="med-dose-pill' + (i === medEntry.defaultDoseIndex ? ' active' : '') + '" data-index="' + i + '">' + esc(df.dose + (df.unit || '')) + '</div>';
          });
          html += '<div class="med-dose-pill" data-index="custom">Custom</div></div>';
          html += '<div id="chart-med-dose-custom-wrap" hidden style="margin-bottom:8px"><input class="med-dose-custom-input" id="chart-med-dose-custom" type="number" min="0" step="any" placeholder="Enter dose" /></div>';
          pillsContainer.innerHTML = html;

          if (medEntry.doseForms[medEntry.defaultDoseIndex]) {
            if (doseInput) doseInput.value = medEntry.doseForms[medEntry.defaultDoseIndex].dose;
          }
          // Hide default dose input
          const doseRow = document.getElementById('chart-med-dose-row');
          if (doseRow) {
            const doseGroup = doseRow.querySelector('.form-group:first-child');
            if (doseGroup) doseGroup.style.display = 'none';
          }

          pillsContainer.querySelectorAll('.med-dose-pill').forEach(pill => {
            pill.addEventListener('click', () => {
              pillsContainer.querySelectorAll('.med-dose-pill').forEach(p => p.classList.remove('active'));
              pill.classList.add('active');
              const idx = pill.dataset.index;
              const customWrap = document.getElementById('chart-med-dose-custom-wrap');
              if (idx === 'custom') {
                if (customWrap) customWrap.hidden = false;
                const ci = document.getElementById('chart-med-dose-custom');
                if (ci) { ci.focus(); ci.addEventListener('input', () => { if (doseInput) doseInput.value = ci.value; }); }
                if (doseInput) doseInput.value = '';
              } else {
                if (customWrap) customWrap.hidden = true;
                const df = medEntry.doseForms[parseInt(idx)];
                if (df) {
                  if (doseInput) doseInput.value = df.dose;
                  if (unitSel)  unitSel.value  = df.unit;
                  if (routeSel) routeSel.value = df.route;
                  if (freqSel)  freqSel.value  = df.defaultFreq;
                }
              }
            });
          });
        }
      },
    });
  }

  document.getElementById('med-cancel').addEventListener('click', closeModal);
  document.getElementById('med-save').addEventListener('click', () => {
    const name = document.getElementById('med-name').value.trim();
    if (!name) { showToast('Medication name is required.', 'error'); return; }
    savePatientMedication({
      id: id || undefined, patientId, name,
      dose:         document.getElementById('med-dose').value.trim(),
      unit:         document.getElementById('med-unit').value,
      route:        document.getElementById('med-route').value,
      frequency:    document.getElementById('med-freq').value,
      status:       document.getElementById('med-status').value,
      setting:      document.getElementById('med-setting').value,
      startDate:    document.getElementById('med-start').value,
      endDate:      document.getElementById('med-end').value,
      indication:   document.getElementById('med-indication').value.trim(),
      prescribedBy: document.getElementById('med-prescriber').value.trim(),
    });
    closeModal();
    showToast(isEdit ? 'Medication updated.' : 'Medication added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Social History
   ============================================================ */
function openSocialHistoryModal(patientId) {
  const sh = getSocialHistory(patientId) || {};

  const smokingOpts = ['Never smoker', 'Current smoker', 'Former smoker', 'E-cigarette/Vaping', 'Unknown'];
  const maritalOpts = ['Single', 'Married', 'Domestic partnership', 'Divorced', 'Separated', 'Widowed', 'Unknown'];

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Smoking Status</label>
        <select class="form-control" id="sh-smoking">
          ${smokingOpts.map(s => `<option${sh.smokingStatus === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tobacco / Pack-years</label>
        <input class="form-control" id="sh-tobacco" value="${esc(sh.tobaccoUse || '')}"
          placeholder="e.g. 20 pack-years, quit 2010" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Alcohol Use</label>
        <input class="form-control" id="sh-alcohol" value="${esc(sh.alcoholUse || '')}"
          placeholder="e.g. Occasional — 1–2 drinks/week" />
      </div>
      <div class="form-group">
        <label class="form-label">Recreational Substances</label>
        <input class="form-control" id="sh-substances" value="${esc(sh.substanceUse || '')}"
          placeholder="e.g. None, marijuana occasionally" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Occupation</label>
        <input class="form-control" id="sh-occupation" value="${esc(sh.occupation || '')}"
          placeholder="e.g. Retired teacher" />
      </div>
      <div class="form-group">
        <label class="form-label">Marital Status</label>
        <select class="form-control" id="sh-marital">
          ${maritalOpts.map(s => `<option${sh.maritalStatus === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Living Situation</label>
      <input class="form-control" id="sh-living" value="${esc(sh.livingSituation || '')}"
        placeholder="e.g. Lives with spouse, suburban home" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Exercise</label>
        <input class="form-control" id="sh-exercise" value="${esc(sh.exercise || '')}"
          placeholder="e.g. Moderate — 30 min 3×/week" />
      </div>
      <div class="form-group">
        <label class="form-label">Diet</label>
        <input class="form-control" id="sh-diet" value="${esc(sh.diet || '')}"
          placeholder="e.g. Mediterranean, low sodium" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Additional Notes</label>
      <textarea class="note-textarea" id="sh-notes" style="min-height:70px"
        placeholder="Other relevant social/family context…">${esc(sh.notes || '')}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="sh-cancel">Cancel</button>
    <button class="btn btn-primary" id="sh-save">Save Social History</button>
  `;

  openModal({ title: 'Social History', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('sh-cancel').addEventListener('click', closeModal);
  document.getElementById('sh-save').addEventListener('click', () => {
    saveSocialHistory({
      patientId,
      smokingStatus:   document.getElementById('sh-smoking').value,
      tobaccoUse:      document.getElementById('sh-tobacco').value.trim(),
      alcoholUse:      document.getElementById('sh-alcohol').value.trim(),
      substanceUse:    document.getElementById('sh-substances').value.trim(),
      occupation:      document.getElementById('sh-occupation').value.trim(),
      maritalStatus:   document.getElementById('sh-marital').value,
      livingSituation: document.getElementById('sh-living').value.trim(),
      exercise:        document.getElementById('sh-exercise').value.trim(),
      diet:            document.getElementById('sh-diet').value.trim(),
      notes:           document.getElementById('sh-notes').value,
    });
    closeModal();
    showToast('Social history saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Surgery
   ============================================================ */
function openSurgeryModal(patientId, id) {
  const existing = id ? getPatientSurgeries(patientId).find(s => s.id === id) : null;
  const isEdit = !!existing;

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Procedure *</label>
      <input class="form-control" id="su-procedure" value="${existing ? esc(existing.procedure) : ''}"
        placeholder="e.g. Laparoscopic Appendectomy" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-control" id="su-date" type="date" value="${existing ? esc(existing.date) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Hospital / Facility</label>
        <input class="form-control" id="su-hospital" value="${existing ? esc(existing.hospital) : ''}"
          placeholder="Facility name" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Surgeon</label>
      <input class="form-control" id="su-surgeon" value="${existing ? esc(existing.surgeon) : ''}"
        placeholder="e.g. Dr. Smith" />
    </div>
    <div class="form-group">
      <label class="form-label">Operative Notes / Outcome</label>
      <textarea class="note-textarea" id="su-notes" style="min-height:80px"
        placeholder="Findings, complications, outcome…">${existing ? esc(existing.notes) : ''}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="su-cancel">Cancel</button>
    <button class="btn btn-primary" id="su-save">${isEdit ? 'Save Changes' : 'Add Surgery'}</button>
  `;

  openModal({ title: isEdit ? 'Edit Surgery' : 'Add Surgical History', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('su-cancel').addEventListener('click', closeModal);
  document.getElementById('su-save').addEventListener('click', () => {
    const procedure = document.getElementById('su-procedure').value.trim();
    if (!procedure) { showToast('Procedure name is required.', 'error'); return; }
    savePatientSurgery({
      id: id || undefined, patientId, procedure,
      date:     document.getElementById('su-date').value,
      hospital: document.getElementById('su-hospital').value.trim(),
      surgeon:  document.getElementById('su-surgeon').value.trim(),
      notes:    document.getElementById('su-notes').value,
    });
    closeModal();
    showToast(isEdit ? 'Surgery updated.' : 'Surgery added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — Family History
   ============================================================ */
function openFamilyHistoryModal(patientId) {
  const fh = getFamilyHistory(patientId) || {};

  const v = key => esc(fh[key] || '');

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Mother</label>
      <input class="form-control" id="fh-mother" value="${v('mother')}"
        placeholder="e.g. HTN, Type 2 DM — deceased age 74" />
    </div>
    <div class="form-group">
      <label class="form-label">Father</label>
      <input class="form-control" id="fh-father" value="${v('father')}"
        placeholder="e.g. CAD, prostate cancer — deceased age 68" />
    </div>
    <div class="form-group">
      <label class="form-label">Siblings</label>
      <input class="form-control" id="fh-siblings" value="${v('siblings')}"
        placeholder="e.g. 1 sister — migraine, hypothyroidism" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Maternal Grandparents</label>
        <input class="form-control" id="fh-maternal" value="${v('maternalGrandparents')}"
          placeholder="e.g. Grandmother: T2DM, CAD" />
      </div>
      <div class="form-group">
        <label class="form-label">Paternal Grandparents</label>
        <input class="form-control" id="fh-paternal" value="${v('paternalGrandparents')}"
          placeholder="e.g. Grandfather: COPD, deceased age 70" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Other</label>
      <input class="form-control" id="fh-other" value="${v('other')}"
        placeholder="Children, extended family, adoption history…" />
    </div>
    <div class="form-group">
      <label class="form-label">Clinical Notes</label>
      <textarea class="note-textarea" id="fh-notes" style="min-height:80px"
        placeholder="Hereditary patterns, genetic counseling notes, risk commentary…">${v('notes')}</textarea>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="fh-cancel">Cancel</button>
    <button class="btn btn-primary" id="fh-save">Save Family History</button>
  `;

  openModal({ title: 'Family History', bodyHTML, footerHTML, size: 'lg' });

  document.getElementById('fh-cancel').addEventListener('click', closeModal);
  document.getElementById('fh-save').addEventListener('click', () => {
    saveFamilyHistory({
      patientId,
      mother:               document.getElementById('fh-mother').value.trim(),
      father:               document.getElementById('fh-father').value.trim(),
      siblings:             document.getElementById('fh-siblings').value.trim(),
      maternalGrandparents: document.getElementById('fh-maternal').value.trim(),
      paternalGrandparents: document.getElementById('fh-paternal').value.trim(),
      other:                document.getElementById('fh-other').value.trim(),
      notes:                document.getElementById('fh-notes').value,
    });
    closeModal();
    showToast('Family history saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODALS — New Encounter
   ============================================================ */
function openNewNoteForPatient(patientId) {
  const openEncs = getEncountersByPatient(patientId).filter(e => e.status === 'Open');
  if (openEncs.length === 0) {
    openModal({
      title: 'No Open Encounters',
      bodyHTML: '<p style="color:var(--text-secondary);line-height:1.6">There are no open encounters for this patient. Create an encounter first, then add a note.</p>',
      footerHTML: '<button class="btn btn-secondary" id="nn-close">Close</button><button class="btn btn-primary" id="nn-create">Create Encounter</button>',
    });
    document.getElementById('nn-close').addEventListener('click', closeModal);
    document.getElementById('nn-create').addEventListener('click', () => { closeModal(); openNewEncounterModal(patientId); });
    return;
  }
  if (openEncs.length === 1) {
    navigate('#encounter/' + openEncs[0].id);
    return;
  }
  const opts = openEncs.map(e => {
    const prov = getProvider(e.providerId);
    const provName = prov ? prov.lastName + ', ' + prov.firstName : '[Removed]';
    return `<option value="${esc(e.id)}">${esc(formatDateTime(e.dateTime))} — ${esc(e.visitType)} (${esc(provName)})</option>`;
  }).join('');
  openModal({
    title: 'Select Encounter',
    bodyHTML: `<div class="form-group">
      <label class="form-label">Which encounter is this note for?</label>
      <select class="form-control" id="nn-enc-pick">${opts}</select>
    </div>`,
    footerHTML: '<button class="btn btn-secondary" id="nn-cancel">Cancel</button><button class="btn btn-primary" id="nn-go">Open Note</button>',
  });
  document.getElementById('nn-cancel').addEventListener('click', closeModal);
  document.getElementById('nn-go').addEventListener('click', () => {
    const encId = document.getElementById('nn-enc-pick').value;
    closeModal();
    navigate('#encounter/' + encId);
  });
}

function openNewEncounterModal(patientId, prefillType) {
  const currentUser = getSessionUser();
  const currentProvider = currentUser ? getProvider(currentUser.id) : null;
  if (!currentProvider) {
    showToast('Your account is not linked to a provider profile.', 'error');
    return;
  }

  const modeDefault = getEncounterMode() === 'inpatient' ? 'Inpatient' : 'Outpatient';
  const effectivePrefill = prefillType && VISIT_TYPES[prefillType] !== undefined ? prefillType : modeDefault;
  const typeOpts = Object.keys(VISIT_TYPES).map(t =>
    `<option value="${t}"${t === effectivePrefill ? ' selected' : ''}>${t}</option>`
  ).join('');
  const initialType = effectivePrefill || Object.keys(VISIT_TYPES)[0];
  const initialSubtypes = VISIT_TYPES[initialType] || [];
  const providerName = currentProvider.lastName + ', ' + currentProvider.firstName + ' — ' + currentProvider.degree;

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Provider</label>
      <div class="form-control" style="background:var(--surface-2);cursor:default;">${esc(providerName)}</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Visit Type *</label>
        <select class="form-control" id="ne-type">${typeOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Subtype</label>
        <select class="form-control" id="ne-subtype"
          ${initialSubtypes.length === 0 ? 'disabled' : ''}>
          ${buildSubtypeOptions(initialSubtypes)}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Date &amp; Time</label>
      <input class="form-control" id="ne-datetime" type="datetime-local"
        value="${toLocalDateTimeValue(new Date())}" />
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="ne-cancel">Cancel</button>
    <button class="btn btn-primary" id="ne-save">Create Encounter</button>
  `;

  openModal({ title: 'New Encounter', bodyHTML, footerHTML });

  document.getElementById('ne-type').addEventListener('change', e => {
    const subtypes = VISIT_TYPES[e.target.value] || [];
    const sub = document.getElementById('ne-subtype');
    sub.innerHTML = buildSubtypeOptions(subtypes);
    sub.disabled = subtypes.length === 0;
  });

  document.getElementById('ne-cancel').addEventListener('click', closeModal);
  document.getElementById('ne-save').addEventListener('click', () => {
    const providerId   = currentProvider.id;
    const visitType    = document.getElementById('ne-type').value;
    const visitSubtype = document.getElementById('ne-subtype').value;
    const dtVal        = document.getElementById('ne-datetime').value;
    const dateTime = dtVal ? new Date(dtVal).toISOString() : new Date().toISOString();
    const encounter = saveEncounter({ patientId, providerId, visitType, visitSubtype, dateTime, status: 'Open' });
    saveNote({ encounterId: encounter.id });
    closeModal();
    showToast('Encounter created.', 'success');
    navigate('#encounter/' + encounter.id);
  });
}

function buildSubtypeOptions(subtypes) {
  if (!subtypes || subtypes.length === 0) return '<option value="">N/A</option>';
  return subtypes.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
}

/* ============================================================
   MODALS — Edit Patient
   ============================================================ */
function openEditPatientModal(patient, onSave) {
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
  const providers = getProviders();
  const panelProvs = patient.panelProviders || [];
  let providerCheckboxes = providers.map(p => {
    const checked = panelProvs.includes(p.id) ? ' checked' : '';
    return '<label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" class="ep-panel-prov" value="' + esc(p.id) + '"' + checked + ' /> ' + esc(p.lastName + ', ' + p.firstName + ', ' + p.degree) + '</label>';
  }).join('');

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">First Name *</label>
        <input class="form-control" id="ep-first" value="${esc(patient.firstName)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Last Name *</label>
        <input class="form-control" id="ep-last" value="${esc(patient.lastName)}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date of Birth</label>
        <input class="form-control" id="ep-dob" type="date" value="${esc(patient.dob)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Sex</label>
        <select class="form-control" id="ep-sex">
          <option value="">— Select —</option>
          ${['Male','Female','Other','Unknown'].map(s =>
            `<option value="${s}"${patient.sex === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="ep-phone" value="${esc(patient.phone)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" id="ep-email" type="email" value="${esc(patient.email || '')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Insurance</label>
        <input class="form-control" id="ep-insurance" value="${esc(patient.insurance)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Code Status</label>
        <select class="form-control" id="ep-code-status">
          ${['Full Code','DNR','DNR/DNI','DNI','Comfort Care'].map(s =>
            `<option value="${s}"${(patient.codeStatus || 'Full Code') === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Address</h4>
    <div class="form-group">
      <label class="form-label">Street</label>
      <input class="form-control" id="ep-street" value="${esc(patient.addressStreet || '')}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">City</label>
        <input class="form-control" id="ep-city" value="${esc(patient.addressCity || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">State</label>
        <input class="form-control" id="ep-state" value="${esc(patient.addressState || '')}" maxlength="2" style="max-width:80px" />
      </div>
      <div class="form-group">
        <label class="form-label">ZIP</label>
        <input class="form-control" id="ep-zip" value="${esc(patient.addressZip || '')}" maxlength="10" style="max-width:100px" />
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Emergency Contact</h4>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-control" id="ep-ec-name" value="${esc(patient.emergencyContactName || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="ep-ec-phone" value="${esc(patient.emergencyContactPhone || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Relationship</label>
        <input class="form-control" id="ep-ec-rel" value="${esc(patient.emergencyContactRelationship || '')}" />
      </div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Preferred Pharmacy</h4>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Pharmacy Name</label>
        <input class="form-control" id="ep-pharm-name" value="${esc(patient.pharmacyName || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="ep-pharm-phone" value="${esc(patient.pharmacyPhone || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Fax</label>
        <input class="form-control" id="ep-pharm-fax" value="${esc(patient.pharmacyFax || '')}" />
      </div>
    </div>
    <div style="margin-bottom:8px">
      <button class="btn btn-secondary" id="ep-find-pharmacy-btn" style="font-size:11px;padding:4px 12px">Find Pharmacy</button>
      <div id="ep-pharmacy-lookup" hidden style="margin-top:8px"></div>
    </div>
    <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 6px">Panel Providers</h4>
    <div id="ep-panel-provs" style="display:flex;flex-direction:column;gap:4px">${providerCheckboxes || '<span style="color:var(--text-muted);font-size:13px">No providers available</span>'}</div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="ep-cancel">Cancel</button>
    <button class="btn btn-primary" id="ep-save">Save</button>
  `;

  openModal({ title: 'Edit Patient', bodyHTML, footerHTML, size: 'lg' });

  // Pharmacy lookup button
  const findPharmBtn = document.getElementById('ep-find-pharmacy-btn');
  const pharmLookupDiv = document.getElementById('ep-pharmacy-lookup');
  if (findPharmBtn && pharmLookupDiv && typeof renderPharmacyLookup === 'function') {
    findPharmBtn.addEventListener('click', () => {
      pharmLookupDiv.hidden = !pharmLookupDiv.hidden;
      if (!pharmLookupDiv.hidden && pharmLookupDiv.children.length === 0) {
        renderPharmacyLookup(pharmLookupDiv, {
          zip: document.getElementById('ep-zip').value.trim() || patient.addressZip || '',
          onSelect: (pharm) => {
            document.getElementById('ep-pharm-name').value  = pharm.name;
            document.getElementById('ep-pharm-phone').value = pharm.phone;
            document.getElementById('ep-pharm-fax').value   = pharm.fax;
            pharmLookupDiv.hidden = true;
            showToast('Pharmacy selected: ' + pharm.name, 'success');
          },
        });
      }
    });
  }

  document.getElementById('ep-cancel').addEventListener('click', closeModal);
  document.getElementById('ep-save').addEventListener('click', () => {
    const firstName = document.getElementById('ep-first').value.trim();
    const lastName  = document.getElementById('ep-last').value.trim();
    if (!firstName || !lastName) { showToast('Name is required.', 'error'); return; }

    const selectedProviders = Array.from(document.querySelectorAll('.ep-panel-prov:checked')).map(cb => cb.value);

    savePatient({
      id: patient.id, firstName, lastName,
      dob:       document.getElementById('ep-dob').value,
      sex:       document.getElementById('ep-sex').value,
      phone:     document.getElementById('ep-phone').value.trim(),
      email:     document.getElementById('ep-email').value.trim(),
      insurance:  document.getElementById('ep-insurance').value.trim(),
      codeStatus: document.getElementById('ep-code-status').value,
      addressStreet: document.getElementById('ep-street').value.trim(),
      addressCity:   document.getElementById('ep-city').value.trim(),
      addressState:  document.getElementById('ep-state').value.trim(),
      addressZip:    document.getElementById('ep-zip').value.trim(),
      emergencyContactName:         document.getElementById('ep-ec-name').value.trim(),
      emergencyContactPhone:        document.getElementById('ep-ec-phone').value.trim(),
      emergencyContactRelationship: document.getElementById('ep-ec-rel').value.trim(),
      pharmacyName:  document.getElementById('ep-pharm-name').value.trim(),
      pharmacyPhone: document.getElementById('ep-pharm-phone').value.trim(),
      pharmacyFax:   document.getElementById('ep-pharm-fax').value.trim(),
      panelProviders: selectedProviders,
    });
    closeModal();
    showToast('Patient updated.', 'success');
    if (onSave) onSave();
  });
}

/* ============================================================
   CONFIRM — Delete Encounter
   ============================================================ */
function confirmDeleteEncounter(encId, patientId) {
  const enc = getEncounter(encId);
  if (!enc) return;
  confirmAction({
    title: 'Delete Encounter',
    message: 'Delete this encounter? The associated note and all orders will also be removed.',
    confirmLabel: 'Delete', danger: true,
    onConfirm: () => {
      deleteEncounter(encId);
      showToast('Encounter deleted.');
      refreshChart(patientId);
    },
  });
}

/* ============================================================
   MODAL — Problem
   ============================================================ */
function openProblemModal(patientId, id) {
  if (!canEditPatient()) { showToast('You do not have permission to edit patient data.', 'error'); return; }
  const existing = id ? getActiveProblems(patientId).find(p => p.id === id) : null;
  const isEdit = !!existing;
  const v = key => esc(existing ? (existing[key] || '') : '');
  const sel = (key, val) => existing && existing[key] === val ? ' selected' : '';

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Problem Name *</label>
      <input class="form-control" id="prb-name" value="${v('name')}" placeholder="e.g. Hypertension" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">ICD-10 Code</label>
        <input class="form-control" id="prb-icd" value="${v('icd10')}" placeholder="e.g. I10" />
      </div>
      <div class="form-group">
        <label class="form-label">Onset Date</label>
        <input class="form-control" id="prb-onset" type="date" value="${v('onset')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="prb-status">
          <option${sel('status','Active')}>Active</option>
          <option${sel('status','Chronic')}>Chronic</option>
          <option${sel('status','Resolved')}>Resolved</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Priority</label>
        <select class="form-control" id="prb-priority">
          <option${sel('priority','High')}>High</option>
          <option${!existing || existing.priority === 'Medium' ? ' selected' : ''}>Medium</option>
          <option${sel('priority','Low')}>Low</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Last Review Date</label>
      <input class="form-control" id="prb-review" type="date" value="${v('lastReviewDate')}" />
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="prb-notes" style="min-height:70px">${v('notes')}</textarea>
    </div>
  `;

  openModal({
    title: isEdit ? 'Edit Problem' : 'Add Problem',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="prb-cancel">Cancel</button>
                 <button class="btn btn-primary" id="prb-save">${isEdit ? 'Save Changes' : 'Add Problem'}</button>`,
  });

  document.getElementById('prb-cancel').addEventListener('click', closeModal);
  document.getElementById('prb-save').addEventListener('click', () => {
    const name = document.getElementById('prb-name').value.trim();
    if (!name) { showToast('Problem name is required.', 'error'); return; }
    saveActiveProblem({
      id: id || undefined, patientId, name,
      icd10:          document.getElementById('prb-icd').value.trim(),
      onset:          document.getElementById('prb-onset').value,
      status:         document.getElementById('prb-status').value,
      priority:       document.getElementById('prb-priority').value,
      lastReviewDate: document.getElementById('prb-review').value,
      notes:          document.getElementById('prb-notes').value,
    });
    closeModal();
    showToast(isEdit ? 'Problem updated.' : 'Problem added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Lab Result
   ============================================================ */
function openLabResultModal(patientId) {
  let testCount = 3;

  function buildTestRows(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div class="form-row" style="margin-bottom:6px" id="test-row-${i}">
        <input class="form-control" id="test-name-${i}" placeholder="Test name" />
        <input class="form-control" id="test-val-${i}" placeholder="Value" />
        <input class="form-control" id="test-unit-${i}" placeholder="Unit" />
        <input class="form-control" id="test-ref-${i}" placeholder="Ref range" />
        <select class="form-control" id="test-flag-${i}">
          <option>Normal</option><option>Low</option><option>High</option>
          <option>Critical-Low</option><option>Critical-High</option>
        </select>
      </div>`;
    }
    return html;
  }

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Panel Name *</label>
        <input class="form-control" id="lr-panel" placeholder="e.g. Basic Metabolic Panel" />
      </div>
      <div class="form-group">
        <label class="form-label">Result Date</label>
        <input class="form-control" id="lr-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Resulted By</label>
      <input class="form-control" id="lr-by" placeholder="Lab name or provider" />
    </div>
    <div class="form-label" style="margin-bottom:6px;font-size:12px;font-weight:600;color:var(--text-secondary)">
      Test Results
    </div>
    <div id="lr-tests">${buildTestRows(testCount)}</div>
    <button class="btn btn-ghost btn-sm" id="lr-add-test" style="margin-top:4px">+ Add Test Row</button>
    <div class="form-group" style="margin-top:12px">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="lr-notes" style="min-height:60px" placeholder="Interpretation notes…"></textarea>
    </div>
  `;

  openModal({
    title: 'Add Lab Results',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="lr-cancel">Cancel</button>
                 <button class="btn btn-primary" id="lr-save">Save Results</button>`,
    size: 'lg',
  });

  document.getElementById('lr-cancel').addEventListener('click', closeModal);
  document.getElementById('lr-add-test').addEventListener('click', () => {
    testCount++;
    const container = document.getElementById('lr-tests');
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '6px';
    row.id = 'test-row-' + (testCount - 1);
    row.innerHTML = `
      <input class="form-control" id="test-name-${testCount-1}" placeholder="Test name" />
      <input class="form-control" id="test-val-${testCount-1}" placeholder="Value" />
      <input class="form-control" id="test-unit-${testCount-1}" placeholder="Unit" />
      <input class="form-control" id="test-ref-${testCount-1}" placeholder="Ref range" />
      <select class="form-control" id="test-flag-${testCount-1}">
        <option>Normal</option><option>Low</option><option>High</option>
        <option>Critical-Low</option><option>Critical-High</option>
      </select>`;
    container.appendChild(row);
  });

  document.getElementById('lr-save').addEventListener('click', () => {
    const panel = document.getElementById('lr-panel').value.trim();
    if (!panel) { showToast('Panel name is required.', 'error'); return; }
    const tests = [];
    for (let i = 0; i < testCount; i++) {
      const name = document.getElementById('test-name-' + i)?.value.trim();
      const val  = document.getElementById('test-val-' + i)?.value.trim();
      if (name && val) {
        tests.push({
          name,
          value: val,
          unit:           document.getElementById('test-unit-' + i)?.value.trim() || '',
          referenceRange: document.getElementById('test-ref-' + i)?.value.trim() || '',
          flag:           document.getElementById('test-flag-' + i)?.value || 'Normal',
        });
      }
    }
    const dateVal = document.getElementById('lr-date').value;
    saveLabResult({
      patientId,
      panel,
      resultDate:  dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      resultedBy:  document.getElementById('lr-by').value.trim(),
      tests,
      notes:       document.getElementById('lr-notes').value,
    });
    closeModal();
    showToast('Lab results saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Imaging Result
   ============================================================ */
function openImagingResultModal(patientId) {
  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Study Type *</label>
        <input class="form-control" id="ir-study" placeholder="e.g. Chest X-Ray PA/Lateral" />
      </div>
      <div class="form-group">
        <label class="form-label">Modality</label>
        <select class="form-control" id="ir-modality">
          <option value="">Select…</option>
          <option>X-Ray</option><option>CT</option><option>MRI</option><option>Ultrasound</option>
          <option>Nuclear Medicine</option><option>Fluoroscopy</option><option>PET/CT</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Body Region</label>
        <input class="form-control" id="ir-region" placeholder="e.g. Chest" />
      </div>
      <div class="form-group">
        <label class="form-label">Result Date</label>
        <input class="form-control" id="ir-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Ordered By</label>
        <input class="form-control" id="ir-ordered" placeholder="Ordering provider" />
      </div>
      <div class="form-group">
        <label class="form-label">Read By</label>
        <input class="form-control" id="ir-readby" placeholder="Radiologist" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Indication</label>
      <input class="form-control" id="ir-indication" placeholder="Clinical indication" />
    </div>
    <div class="form-group">
      <label class="form-label">Findings</label>
      <textarea class="note-textarea" id="ir-findings" style="min-height:80px" placeholder="Findings…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Impression</label>
      <textarea class="note-textarea" id="ir-impression" style="min-height:60px" placeholder="Impression…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-control" id="ir-status">
        <option>Final</option><option>Preliminary</option><option>Addendum</option>
      </select>
    </div>
  `;

  openModal({
    title: 'Add Imaging Result',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="ir-cancel">Cancel</button>
                 <button class="btn btn-primary" id="ir-save">Save Result</button>`,
    size: 'lg',
  });

  document.getElementById('ir-cancel').addEventListener('click', closeModal);
  document.getElementById('ir-save').addEventListener('click', () => {
    const studyType = document.getElementById('ir-study').value.trim();
    if (!studyType) { showToast('Study type is required.', 'error'); return; }
    const dateVal = document.getElementById('ir-date').value;
    saveImagingResult({
      patientId,
      studyType,
      modality:   document.getElementById('ir-modality').value,
      bodyRegion: document.getElementById('ir-region').value.trim(),
      resultDate: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      orderedBy:  document.getElementById('ir-ordered').value.trim(),
      readBy:     document.getElementById('ir-readby').value.trim(),
      indication: document.getElementById('ir-indication').value.trim(),
      findings:   document.getElementById('ir-findings').value,
      impression: document.getElementById('ir-impression').value,
      status:     document.getElementById('ir-status').value,
    });
    closeModal();
    showToast('Imaging result saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Microbiology Result
   ============================================================ */
function openMicroResultModal(patientId) {
  let sensCount = 2;

  function buildSensRows(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div class="form-row" style="margin-bottom:6px">
        <input class="form-control" id="sens-abx-${i}" placeholder="Antibiotic" />
        <select class="form-control" id="sens-result-${i}">
          <option>Sensitive</option><option>Intermediate</option><option>Resistant</option>
        </select>
        <input class="form-control" id="sens-mic-${i}" placeholder="MIC (optional)" />
      </div>`;
    }
    return html;
  }

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Culture Site *</label>
        <input class="form-control" id="mr-site" placeholder="e.g. Blood, Urine, Wound" />
      </div>
      <div class="form-group">
        <label class="form-label">Collection Date</label>
        <input class="form-control" id="mr-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Gram Stain</label>
      <input class="form-control" id="mr-gram" placeholder="e.g. Gram positive cocci in clusters" />
    </div>
    <div class="form-group">
      <label class="form-label">Organism</label>
      <input class="form-control" id="mr-organism" placeholder="e.g. Staphylococcus aureus" />
    </div>
    <div class="form-label" style="margin-bottom:6px;font-size:12px;font-weight:600;color:var(--text-secondary)">
      Sensitivities
    </div>
    <div id="mr-sens">${buildSensRows(sensCount)}</div>
    <button class="btn btn-ghost btn-sm" id="mr-add-sens" style="margin-top:4px">+ Add Row</button>
    <div class="form-row" style="margin-top:12px">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="mr-status">
          <option>Final</option><option>Preliminary</option><option>No Growth</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="mr-notes" style="min-height:60px" placeholder="Additional notes…"></textarea>
    </div>
  `;

  openModal({
    title: 'Add Microbiology Result',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="mr-cancel">Cancel</button>
                 <button class="btn btn-primary" id="mr-save">Save Result</button>`,
    size: 'lg',
  });

  document.getElementById('mr-cancel').addEventListener('click', closeModal);
  document.getElementById('mr-add-sens').addEventListener('click', () => {
    sensCount++;
    const container = document.getElementById('mr-sens');
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '6px';
    row.innerHTML = `
      <input class="form-control" id="sens-abx-${sensCount-1}" placeholder="Antibiotic" />
      <select class="form-control" id="sens-result-${sensCount-1}">
        <option>Sensitive</option><option>Intermediate</option><option>Resistant</option>
      </select>
      <input class="form-control" id="sens-mic-${sensCount-1}" placeholder="MIC (optional)" />`;
    container.appendChild(row);
  });

  document.getElementById('mr-save').addEventListener('click', () => {
    const cultureSite = document.getElementById('mr-site').value.trim();
    if (!cultureSite) { showToast('Culture site is required.', 'error'); return; }
    const sensitivities = [];
    for (let i = 0; i < sensCount; i++) {
      const abx = document.getElementById('sens-abx-' + i)?.value.trim();
      const res = document.getElementById('sens-result-' + i)?.value;
      if (abx) {
        sensitivities.push({
          antibiotic: abx,
          result: res || 'Sensitive',
          mic: document.getElementById('sens-mic-' + i)?.value.trim() || '',
        });
      }
    }
    const dateVal = document.getElementById('mr-date').value;
    saveMicroResult({
      patientId,
      cultureSite,
      collectionDate: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      gramStain:      document.getElementById('mr-gram').value.trim(),
      organism:       document.getElementById('mr-organism').value.trim(),
      sensitivities,
      status:         document.getElementById('mr-status').value,
      notes:          document.getElementById('mr-notes').value,
    });
    closeModal();
    showToast('Microbiology result saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Pathology Result
   ============================================================ */
function openPathResultModal(patientId) {
  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Specimen Type *</label>
        <input class="form-control" id="pr-type" placeholder="e.g. Biopsy, Excision, Cytology" />
      </div>
      <div class="form-group">
        <label class="form-label">Specimen Site</label>
        <input class="form-control" id="pr-site" placeholder="e.g. Left breast, Skin (back)" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Collection Date</label>
        <input class="form-control" id="pr-cdate" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Result Date</label>
        <input class="form-control" id="pr-rdate" type="date" value="${new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Pathologist</label>
      <input class="form-control" id="pr-path" placeholder="Pathologist name" />
    </div>
    <div class="form-group">
      <label class="form-label">Gross Description</label>
      <textarea class="note-textarea" id="pr-gross" style="min-height:60px" placeholder="Gross description…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Microscopic Description</label>
      <textarea class="note-textarea" id="pr-micro" style="min-height:60px" placeholder="Microscopic description…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Diagnosis</label>
      <textarea class="note-textarea" id="pr-dx" style="min-height:60px" placeholder="Pathologic diagnosis…"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="pr-status">
          <option>Final</option><option>Preliminary</option><option>Addendum</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="pr-notes" style="min-height:60px" placeholder="Additional notes…"></textarea>
    </div>
  `;

  openModal({
    title: 'Add Pathology Result',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="pr-cancel">Cancel</button>
                 <button class="btn btn-primary" id="pr-save">Save Result</button>`,
    size: 'lg',
  });

  document.getElementById('pr-cancel').addEventListener('click', closeModal);
  document.getElementById('pr-save').addEventListener('click', () => {
    const specimenType = document.getElementById('pr-type').value.trim();
    if (!specimenType) { showToast('Specimen type is required.', 'error'); return; }
    const cDate = document.getElementById('pr-cdate').value;
    const rDate = document.getElementById('pr-rdate').value;
    savePathResult({
      patientId,
      specimenType,
      specimenSite:   document.getElementById('pr-site').value.trim(),
      collectionDate: cDate ? new Date(cDate).toISOString() : new Date().toISOString(),
      resultDate:     rDate ? new Date(rDate).toISOString() : new Date().toISOString(),
      pathologist:    document.getElementById('pr-path').value.trim(),
      grossDesc:      document.getElementById('pr-gross').value,
      microDesc:      document.getElementById('pr-micro').value,
      diagnosis:      document.getElementById('pr-dx').value,
      status:         document.getElementById('pr-status').value,
      notes:          document.getElementById('pr-notes').value,
    });
    closeModal();
    showToast('Pathology result saved.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Immunization
   ============================================================ */
function openImmunizationModal(patientId, id) {
  const existing = id ? getImmunizations(patientId).find(i => i.id === id) : null;
  const isEdit = !!existing;
  const v = key => esc(existing ? (existing[key] || '') : '');

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Vaccine *</label>
      <input class="form-control" id="imm-vaccine" value="${v('vaccine')}" placeholder="e.g. Influenza (IIV4)" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date Administered</label>
        <input class="form-control" id="imm-date" type="date" value="${v('date')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Next Due</label>
        <input class="form-control" id="imm-next" type="date" value="${v('nextDue')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Manufacturer</label>
        <input class="form-control" id="imm-mfr" value="${v('manufacturer')}" placeholder="e.g. Sanofi" />
      </div>
      <div class="form-group">
        <label class="form-label">Lot Number</label>
        <input class="form-control" id="imm-lot" value="${v('lot')}" placeholder="e.g. FL2024-A" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Site</label>
        <input class="form-control" id="imm-site" value="${v('site')}" placeholder="e.g. L deltoid" />
      </div>
      <div class="form-group">
        <label class="form-label">Given By</label>
        <input class="form-control" id="imm-by" value="${v('givenBy')}" placeholder="e.g. Dr. Chen" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="note-textarea" id="imm-notes" style="min-height:60px">${v('notes')}</textarea>
    </div>
  `;

  openModal({
    title: isEdit ? 'Edit Immunization' : 'Add Immunization',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="imm-cancel">Cancel</button>
                 <button class="btn btn-primary" id="imm-save">${isEdit ? 'Save Changes' : 'Add Immunization'}</button>`,
    size: 'lg',
  });

  document.getElementById('imm-cancel').addEventListener('click', closeModal);
  document.getElementById('imm-save').addEventListener('click', () => {
    const vaccine = document.getElementById('imm-vaccine').value.trim();
    if (!vaccine) { showToast('Vaccine name is required.', 'error'); return; }
    saveImmunization({
      id: id || undefined, patientId, vaccine,
      date:         document.getElementById('imm-date').value,
      nextDue:      document.getElementById('imm-next').value,
      manufacturer: document.getElementById('imm-mfr').value.trim(),
      lot:          document.getElementById('imm-lot').value.trim(),
      site:         document.getElementById('imm-site').value.trim(),
      givenBy:      document.getElementById('imm-by').value.trim(),
      notes:        document.getElementById('imm-notes').value,
    });
    closeModal();
    showToast(isEdit ? 'Immunization updated.' : 'Immunization added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Referral
   ============================================================ */
function openReferralModal(patientId, id) {
  const existing = id ? getReferrals(patientId).find(r => r.id === id) : null;
  const isEdit = !!existing;
  const v = key => esc(existing ? (existing[key] || '') : '');
  const sel = (key, val) => existing && existing[key] === val ? ' selected' : '';

  const specialties = [
    'Cardiology','Neurology','Pulmonology','Gastroenterology','Nephrology',
    'Endocrinology','Infectious Disease','Hematology/Oncology','Rheumatology',
    'Orthopedics','Surgery','Psychiatry','Physical Therapy','Social Work',
    'Ophthalmology','Dermatology','Urology','OB/GYN','Other',
  ];

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Specialty *</label>
        <select class="form-control" id="ref-specialty">
          ${specialties.map(s => `<option${existing && existing.specialty === s ? ' selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Consulting Provider</label>
        <input class="form-control" id="ref-provider" value="${v('providerName')}" placeholder="e.g. Dr. Park" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Reason for Referral *</label>
      <textarea class="note-textarea" id="ref-reason" style="min-height:80px">${v('reason')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Urgency</label>
        <select class="form-control" id="ref-urgency">
          <option${sel('urgency','Routine')}>Routine</option>
          <option${sel('urgency','Urgent')}>Urgent</option>
          <option${sel('urgency','STAT')}>STAT</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="ref-status">
          <option${!existing || existing.status === 'Pending' ? ' selected' : ''}>Pending</option>
          <option${sel('status','Sent')}>Sent</option>
          <option${sel('status','Accepted')}>Accepted</option>
          <option${sel('status','Completed')}>Completed</option>
          <option${sel('status','Declined')}>Declined</option>
          <option${sel('status','No Response')}>No Response</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Referral Date</label>
        <input class="form-control" id="ref-date" type="date" value="${existing && existing.referralDate ? existing.referralDate.slice(0,10) : new Date().toISOString().slice(0,10)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Appointment Date</label>
        <input class="form-control" id="ref-appt" type="date" value="${v('appointmentDate')}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Response Notes</label>
      <textarea class="note-textarea" id="ref-response" style="min-height:60px">${v('responseNotes')}</textarea>
    </div>
  `;

  openModal({
    title: isEdit ? 'Update Referral' : 'Add Referral',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="ref-cancel">Cancel</button>
                 <button class="btn btn-primary" id="ref-save">${isEdit ? 'Save Changes' : 'Add Referral'}</button>`,
    size: 'lg',
  });

  document.getElementById('ref-cancel').addEventListener('click', closeModal);
  document.getElementById('ref-save').addEventListener('click', () => {
    const reason = document.getElementById('ref-reason').value.trim();
    if (!reason) { showToast('Reason is required.', 'error'); return; }
    const dateVal = document.getElementById('ref-date').value;
    saveReferral({
      id: id || undefined, patientId,
      specialty:       document.getElementById('ref-specialty').value,
      providerName:    document.getElementById('ref-provider').value.trim(),
      reason,
      urgency:         document.getElementById('ref-urgency').value,
      status:          document.getElementById('ref-status').value,
      referralDate:    dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      appointmentDate: document.getElementById('ref-appt').value,
      responseNotes:   document.getElementById('ref-response').value,
    });
    closeModal();
    showToast(isEdit ? 'Referral updated.' : 'Referral added.', 'success');
    refreshChart(patientId);
  });
}

/* ============================================================
   MODAL — Document Upload
   ============================================================ */
function openDocumentModal(patientId) {
  const categories = ['Clinical', 'Lab', 'Imaging', 'Surgical', 'Referral', 'Insurance', 'Consent', 'Other'];

  const bodyHTML = `
    <div class="form-group">
      <label class="form-label">Document Name *</label>
      <input class="form-control" id="doc-name" placeholder="e.g. MRI Brain Report" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-control" id="doc-cat">
          ${categories.map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Document Type</label>
        <input class="form-control" id="doc-type" placeholder="e.g. PDF, Image" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="note-textarea" id="doc-desc" style="min-height:60px" placeholder="Brief description…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">File Upload (optional, max 1MB for inline storage)</label>
      <input class="form-control" id="doc-file" type="file" />
      <div id="doc-file-warning" style="color:var(--danger);font-size:12px;margin-top:4px;display:none">
        File exceeds 1MB — will be saved as reference only (no inline preview).
      </div>
    </div>
  `;

  openModal({
    title: 'Upload Document',
    bodyHTML,
    footerHTML: `<button class="btn btn-secondary" id="doc-cancel">Cancel</button>
                 <button class="btn btn-primary" id="doc-save">Save Document</button>`,
    size: 'lg',
  });

  document.getElementById('doc-file').addEventListener('change', e => {
    const file = e.target.files[0];
    const warn = document.getElementById('doc-file-warning');
    if (file && warn) warn.style.display = file.size > 1048576 ? 'block' : 'none';
  });

  document.getElementById('doc-cancel').addEventListener('click', closeModal);
  document.getElementById('doc-save').addEventListener('click', () => {
    const name = document.getElementById('doc-name').value.trim();
    if (!name) { showToast('Document name is required.', 'error'); return; }
    const file = document.getElementById('doc-file').files[0];

    const saveDoc = (fileData, fileSize, fileType) => {
      saveDocument({
        patientId, name,
        category:    document.getElementById('doc-cat').value,
        type:        fileType || document.getElementById('doc-type').value.trim(),
        description: document.getElementById('doc-desc').value.trim(),
        uploadDate:  new Date().toISOString(),
        fileSize:    fileSize || 0,
        fileData:    fileData || null,
      });
      closeModal();
      showToast('Document saved.', 'success');
      refreshChart(patientId);
    };

    if (file) {
      if (file.size <= 1048576) {
        const reader = new FileReader();
        reader.onload = e2 => saveDoc(e2.target.result, file.size, file.type);
        reader.readAsDataURL(file);
      } else {
        saveDoc(null, file.size, file.type);
      }
    } else {
      saveDoc(null, 0, '');
    }
  });
}
