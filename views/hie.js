/* ============================================================
   views/hie.js — Health Information Exchange
   Simulated Care Everywhere / CommonWell / Carequality
   ============================================================ */

/* ---------- Data helpers ---------- */

function getHIERecords(patientId) {
  return loadAll(KEYS.hieRecords).filter(function(r) { return r.patientId === patientId; });
}

function saveHIERecord(data) {
  var all = loadAll(KEYS.hieRecords, true);
  var idx = all.findIndex(function(r) { return r.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    if (!data.id) data.id = generateId();
    if (!data.queriedAt) data.queriedAt = new Date().toISOString();
    all.push(data);
  }
  saveAll(KEYS.hieRecords, all);
  return data;
}

function getHIEConsent(patientId) {
  var all = loadAll(KEYS.hieConsent);
  return all.find(function(c) { return c.patientId === patientId; }) || null;
}

function saveHIEConsent(data) {
  var all = loadAll(KEYS.hieConsent, true);
  var idx = all.findIndex(function(c) { return c.patientId === data.patientId; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    if (!data.id) data.id = generateId();
    all.push(data);
  }
  saveAll(KEYS.hieConsent, all);
  return data;
}

/* ---------- Mock external data ---------- */

var HIE_EXTERNAL_FACILITIES = [
  {
    name: 'Memorial General Hospital',
    network: 'CommonWell',
    documents: [
      { type: 'Discharge Summary', title: 'Discharge Summary — Pneumonia', date: '2025-06-15', author: 'Dr. Williams', content: 'Patient was admitted for community-acquired pneumonia. Treated with IV ceftriaxone and azithromycin transitioned to PO amoxicillin-clavulanate. Improved over 3-day stay. Follow-up with PCP in 7 days. CXR at discharge: resolving bilateral infiltrates.' },
      { type: 'Lab Results', title: 'CBC + BMP Panel', date: '2025-06-14', author: 'Lab', content: 'WBC: 14.2 K/uL (H), Hgb: 12.8 g/dL, PLT: 210 K/uL, Na: 136, K: 4.1, Cr: 0.9, Glucose: 108 mg/dL. Procalcitonin: 1.2 ng/mL (H).' },
      { type: 'Imaging Report', title: 'CXR PA/Lateral', date: '2025-06-13', author: 'Dr. Radiologist', content: 'FINDINGS: Bilateral lower lobe infiltrates consistent with pneumonia. Small right-sided pleural effusion. Heart size normal. No pneumothorax.\nIMPRESSION: Community-acquired pneumonia with small pleural effusion.' },
    ],
  },
  {
    name: 'University Medical Center',
    network: 'Carequality',
    documents: [
      { type: 'Operative Note', title: 'Laparoscopic Cholecystectomy', date: '2024-11-02', author: 'Dr. Patel', content: 'PREOPERATIVE DIAGNOSIS: Symptomatic cholelithiasis.\nPOSTOPERATIVE DIAGNOSIS: Same.\nPROCEDURE: Laparoscopic cholecystectomy.\nFINDINGS: Gallbladder with multiple stones, moderate inflammation. Critical view of safety obtained. No bile duct injury. EBL <50 mL.\nDISPOSITION: Tolerated well, discharged same day.' },
      { type: 'H&P', title: 'Pre-Operative H&P', date: '2024-11-01', author: 'Dr. Thompson', content: 'CC: RUQ pain x 3 months.\nHPI: Recurrent postprandial RUQ pain, worse with fatty meals. US shows cholelithiasis with GB wall thickening.\nPMH: HTN, GERD.\nALLERGIES: NKDA.\nPE: Soft, +Murphy sign, no peritoneal signs.\nASSESSMENT: Symptomatic cholelithiasis — proceed with lap chole.' },
    ],
  },
  {
    name: 'Springfield Family Clinic',
    network: 'CommonWell',
    documents: [
      { type: 'Progress Note', title: 'Annual Physical Exam', date: '2025-03-10', author: 'Dr. Anderson', content: 'Annual wellness visit. Patient doing well. BP 128/78. BMI 26.1. Discussed preventive screenings. Due for colonoscopy. Updated flu vaccine. No acute concerns.' },
      { type: 'Referral Letter', title: 'Referral to Cardiology', date: '2025-02-14', author: 'Dr. Anderson', content: 'Dear Dr. Smith,\nI am referring this patient for evaluation of palpitations and exercise intolerance. ECG shows occasional PVCs. Echo pending. Patient is on metoprolol 25mg with partial symptom relief. Appreciate your evaluation and recommendations.\nSincerely, Dr. Anderson' },
    ],
  },
];

/* ---------- Main render ---------- */

function renderHIE() {
  var app = document.getElementById('app');

  setTopbar({ title: 'Health Information Exchange', meta: 'Care Everywhere / CommonWell / Carequality' });
  setActiveNav('hie');

  var patients = getPatients();
  var selectedPatientId = null;

  function render() {
    app.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:24px;max-width:1200px;margin:0 auto;';

    // Patient selector
    var headerDiv = document.createElement('div');
    headerDiv.className = 'hie-header';
    headerDiv.innerHTML = '<h3 style="margin:0;">Health Information Exchange</h3>';

    var selectWrap = document.createElement('div');
    selectWrap.style.cssText = 'display:flex;gap:12px;align-items:center;';
    var label = document.createElement('label');
    label.textContent = 'Select Patient:';
    label.style.cssText = 'font-weight:600;font-size:14px;';
    var sel = document.createElement('select');
    sel.className = 'form-control';
    sel.style.cssText = 'max-width:300px;';
    sel.innerHTML = '<option value="">-- Choose Patient --</option>';
    patients.forEach(function(p) {
      sel.innerHTML += '<option value="' + esc(p.id) + '"' + (p.id === selectedPatientId ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
    });
    sel.addEventListener('change', function() {
      selectedPatientId = sel.value || null;
      render();
    });
    selectWrap.appendChild(label);
    selectWrap.appendChild(sel);
    headerDiv.appendChild(selectWrap);
    wrap.appendChild(headerDiv);

    if (!selectedPatientId) {
      wrap.innerHTML += '<div class="hie-empty">Select a patient to query external records.</div>';
      app.appendChild(wrap);
      return;
    }

    var pat = getPatient(selectedPatientId);
    if (!pat) { app.appendChild(wrap); return; }

    // Consent management
    var consent = getHIEConsent(selectedPatientId);
    var consentSection = document.createElement('div');
    consentSection.className = 'hie-consent-section';
    var isOptedIn = consent && consent.status === 'opted-in';

    consentSection.innerHTML =
      '<div class="hie-consent-header">' +
      '<h4>HIE Consent Status</h4>' +
      '<span class="hie-consent-badge ' + (isOptedIn ? 'hie-consent-in' : 'hie-consent-out') + '">' +
      (isOptedIn ? 'Opted In' : 'Opted Out') + '</span>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--text-secondary);margin:4px 0;">Patient consent for sharing medical records via Health Information Exchange networks.</p>';

    var toggleBtn = document.createElement('button');
    toggleBtn.className = isOptedIn ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm';
    toggleBtn.textContent = isOptedIn ? 'Opt Out of HIE' : 'Opt In to HIE';
    toggleBtn.addEventListener('click', function() {
      saveHIEConsent({
        patientId: selectedPatientId,
        status: isOptedIn ? 'opted-out' : 'opted-in',
        updatedAt: new Date().toISOString(),
        updatedBy: getSessionUser() ? getSessionUser().id : null,
      });
      showToast('Consent updated to ' + (isOptedIn ? 'opted-out' : 'opted-in'), 'success');
      render();
    });
    consentSection.appendChild(toggleBtn);
    wrap.appendChild(consentSection);

    if (!isOptedIn) {
      wrap.innerHTML += '<div class="hie-empty">Patient has not opted in to HIE. Update consent above to query external records.</div>';
      app.appendChild(wrap);
      return;
    }

    // Query button
    var queryBtn = document.createElement('button');
    queryBtn.className = 'btn btn-primary';
    queryBtn.textContent = 'Query External Records';
    queryBtn.style.cssText = 'margin:16px 0;';
    queryBtn.addEventListener('click', function() { performHIEQuery(pat); });
    wrap.appendChild(queryBtn);

    // Show imported records
    var hieRecords = getHIERecords(selectedPatientId);
    if (hieRecords.length > 0) {
      var importedSection = document.createElement('div');
      importedSection.innerHTML = '<h4 style="margin:16px 0 8px;">Imported Documents (' + hieRecords.length + ')</h4>';

      hieRecords.sort(function(a, b) { return new Date(b.importedAt || b.queriedAt) - new Date(a.importedAt || a.queriedAt); });
      hieRecords.forEach(function(rec) {
        var card = document.createElement('div');
        card.className = 'hie-record-card';
        var d = new Date(rec.documentDate || rec.importedAt);
        card.innerHTML =
          '<div class="hie-record-info">' +
          '<div class="hie-record-title">' + esc(rec.title) + '</div>' +
          '<div class="hie-record-meta">' + esc(rec.facility) + ' &middot; ' + esc(rec.documentType) + ' &middot; ' + d.toLocaleDateString() + '</div>' +
          '</div>';

        var viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-secondary btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', function() {
          openModal({
            title: rec.title,
            bodyHTML:
              '<div class="hie-doc-viewer">' +
              '<div class="hie-doc-meta"><strong>Facility:</strong> ' + esc(rec.facility) + ' &middot; <strong>Author:</strong> ' + esc(rec.author) + ' &middot; <strong>Date:</strong> ' + esc(rec.documentDate) + '</div>' +
              '<div class="hie-doc-content">' + esc(rec.content).replace(/\n/g, '<br>') + '</div>' +
              '</div>',
            footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
            size: 'lg',
          });
        });
        card.appendChild(viewBtn);
        importedSection.appendChild(card);
      });
      wrap.appendChild(importedSection);
    }

    app.appendChild(wrap);
  }

  function performHIEQuery(pat) {
    // Simulate querying external systems
    var bodyHTML =
      '<div class="hie-query-loading" id="hie-query-loading">' +
      '<div class="hie-loading-spinner"></div>' +
      '<p>Querying external networks for <strong>' + esc(pat.firstName + ' ' + pat.lastName) + '</strong>...</p>' +
      '</div>' +
      '<div id="hie-query-results" class="hidden"></div>';

    openModal({
      title: 'HIE Query — ' + esc(pat.firstName + ' ' + pat.lastName),
      bodyHTML: bodyHTML,
      footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
      size: 'lg',
    });

    // Simulate network delay
    setTimeout(function() {
      var loadingEl = document.getElementById('hie-query-loading');
      var resultsEl = document.getElementById('hie-query-results');
      if (!loadingEl || !resultsEl) return;
      loadingEl.classList.add('hidden');
      resultsEl.classList.remove('hidden');

      var html = '';
      HIE_EXTERNAL_FACILITIES.forEach(function(facility) {
        html += '<div class="hie-facility-group">' +
          '<div class="hie-facility-header"><strong>' + esc(facility.name) + '</strong> <span class="hie-network-badge">' + esc(facility.network) + '</span> <span style="color:var(--text-muted);font-size:12px;">' + facility.documents.length + ' document(s)</span></div>';

        facility.documents.forEach(function(doc, i) {
          var docId = 'hie-doc-' + facility.name.replace(/\s/g, '') + '-' + i;
          html += '<div class="hie-query-doc">' +
            '<div class="hie-query-doc-info">' +
            '<input type="checkbox" id="' + docId + '" class="hie-doc-checkbox" data-facility="' + esc(facility.name) + '" data-idx="' + i + '" />' +
            '<label for="' + docId + '"><strong>' + esc(doc.title) + '</strong></label>' +
            '<span class="hie-doc-type-badge">' + esc(doc.type) + '</span>' +
            '<span style="color:var(--text-muted);font-size:12px;"> by ' + esc(doc.author) + ' on ' + esc(doc.date) + '</span>' +
            '</div>' +
            '<button class="btn btn-secondary btn-sm hie-preview-btn" data-facility="' + esc(facility.name) + '" data-idx="' + i + '">Preview</button>' +
            '</div>';
        });
        html += '</div>';
      });

      html += '<div style="margin-top:16px;text-align:right;">' +
        '<button class="btn btn-primary" id="hie-import-selected">Import Selected Documents</button>' +
        '</div>';

      resultsEl.innerHTML = html;

      // Preview buttons
      resultsEl.querySelectorAll('.hie-preview-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var facName = btn.dataset.facility;
          var idx = parseInt(btn.dataset.idx, 10);
          var fac = HIE_EXTERNAL_FACILITIES.find(function(f) { return f.name === facName; });
          if (!fac) return;
          var doc = fac.documents[idx];
          openModal({
            title: doc.title,
            bodyHTML:
              '<div class="hie-doc-viewer">' +
              '<div class="hie-doc-meta"><strong>Facility:</strong> ' + esc(facName) + ' &middot; <strong>Author:</strong> ' + esc(doc.author) + ' &middot; <strong>Date:</strong> ' + esc(doc.date) + '</div>' +
              '<div class="hie-doc-content">' + esc(doc.content).replace(/\n/g, '<br>') + '</div>' +
              '</div>',
            footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
            size: 'lg',
          });
        });
      });

      // Import button
      var importBtn = document.getElementById('hie-import-selected');
      if (importBtn) {
        importBtn.addEventListener('click', function() {
          var checked = resultsEl.querySelectorAll('.hie-doc-checkbox:checked');
          if (checked.length === 0) {
            showToast('No documents selected', 'warning');
            return;
          }
          var count = 0;
          checked.forEach(function(cb) {
            var facName = cb.dataset.facility;
            var idx = parseInt(cb.dataset.idx, 10);
            var fac = HIE_EXTERNAL_FACILITIES.find(function(f) { return f.name === facName; });
            if (!fac) return;
            var doc = fac.documents[idx];
            saveHIERecord({
              patientId: pat.id,
              facility: facName,
              network: fac.network,
              documentType: doc.type,
              title: doc.title,
              documentDate: doc.date,
              author: doc.author,
              content: doc.content,
              importedAt: new Date().toISOString(),
              importedBy: getSessionUser() ? getSessionUser().id : null,
            });
            count++;
          });
          closeModal();
          showToast(count + ' document(s) imported successfully', 'success');
          render();
        });
      }
    }, 1500);
  }

  render();
}
