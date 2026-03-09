/* ============================================================
   views/ccd-exchange.js — CCD/CDA Document Exchange
   Generate, export, import Continuity of Care Documents.
   ============================================================ */

/* ---------- Data helpers ---------- */

function getCCDHistory(patientId) {
  return loadAll(KEYS.ccdHistory).filter(function(r) { return r.patientId === patientId; })
    .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
}

function saveCCDRecord(data) {
  var all = loadAll(KEYS.ccdHistory, true);
  var idx = all.findIndex(function(r) { return r.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    if (!data.id) data.id = generateId();
    if (!data.createdAt) data.createdAt = new Date().toISOString();
    all.push(data);
  }
  saveAll(KEYS.ccdHistory, all);
  return data;
}

/* ---------- CCD Generation ---------- */

function generateCCDForPatient(patientId) {
  var pat = getPatient(patientId);
  if (!pat) return null;

  var allergies = typeof getPatientAllergies === 'function' ? getPatientAllergies(patientId) : [];
  var problems = typeof getPatientDiagnoses === 'function' ? getPatientDiagnoses(patientId) : [];
  var medications = typeof getPatientMedications === 'function' ? getPatientMedications(patientId) : [];
  var immunizations = loadAll(KEYS.immunizations).filter(function(i) { return i.patientId === patientId; });
  var labResults = loadAll(KEYS.labResults).filter(function(l) { return l.patientId === patientId; });
  var vitals = loadAll(KEYS.vitals).filter(function(v) { return v.patientId === patientId; });
  var surgeries = typeof getPatientSurgeries === 'function' ? getPatientSurgeries(patientId) : [];
  var encounters = loadAll(KEYS.encounters).filter(function(e) { return e.patientId === patientId; });

  var now = new Date();
  var ccd = {
    id: generateId(),
    patientId: patientId,
    type: 'generated',
    createdAt: now.toISOString(),
    createdBy: getSessionUser() ? getSessionUser().id : null,
    title: 'Continuity of Care Document',
    sections: {
      demographics: pat,
      allergies: allergies,
      problems: problems,
      medications: medications,
      immunizations: immunizations,
      labResults: labResults.slice(0, 10),
      vitals: vitals.slice(0, 5),
      procedures: surgeries,
      encounters: encounters.slice(0, 10),
    },
  };

  return ccd;
}

function renderCCDasHTML(ccd) {
  var pat = ccd.sections.demographics;
  var html = '';

  html += '<div class="ccd-document">';
  html += '<div class="ccd-header">';
  html += '<h2>Continuity of Care Document (CCD)</h2>';
  html += '<div class="ccd-header-meta">Generated: ' + new Date(ccd.createdAt).toLocaleString() + ' | GusdorfEMR</div>';
  html += '</div>';

  // Demographics
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Patient Demographics</h3>';
  html += '<div class="ccd-demo-grid">';
  html += '<div><strong>Name:</strong> ' + esc(pat.firstName + ' ' + pat.lastName) + '</div>';
  html += '<div><strong>DOB:</strong> ' + esc(pat.dob || 'N/A') + '</div>';
  html += '<div><strong>Sex:</strong> ' + esc(pat.sex || 'N/A') + '</div>';
  html += '<div><strong>MRN:</strong> ' + esc(pat.mrn || 'N/A') + '</div>';
  html += '<div><strong>Phone:</strong> ' + esc(pat.phone || 'N/A') + '</div>';
  html += '<div><strong>Address:</strong> ' + esc([pat.addressStreet, pat.addressCity, pat.addressState, pat.addressZip].filter(Boolean).join(', ') || 'N/A') + '</div>';
  html += '</div></div>';

  // Allergies
  var allergies = ccd.sections.allergies || [];
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Allergies (' + allergies.length + ')</h3>';
  if (allergies.length === 0) {
    html += '<p class="ccd-empty-note">No known allergies documented.</p>';
  } else {
    html += '<table class="ccd-table"><thead><tr><th>Allergen</th><th>Type</th><th>Reaction</th><th>Severity</th></tr></thead><tbody>';
    allergies.forEach(function(a) {
      html += '<tr><td>' + esc(a.allergen || a.name) + '</td><td>' + esc(a.type || '') + '</td><td>' + esc(a.reaction || '') + '</td><td>' + esc(a.severity || '') + '</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  // Problems
  var problems = ccd.sections.problems || [];
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Problem List (' + problems.length + ')</h3>';
  if (problems.length === 0) {
    html += '<p class="ccd-empty-note">No active problems documented.</p>';
  } else {
    html += '<table class="ccd-table"><thead><tr><th>Problem</th><th>ICD-10</th><th>Status</th><th>Onset</th></tr></thead><tbody>';
    problems.forEach(function(p) {
      html += '<tr><td>' + esc(p.name || p.description) + '</td><td>' + esc(p.icd10 || p.code || '') + '</td><td>' + esc(p.status || '') + '</td><td>' + esc(p.onset || p.onsetDate || '') + '</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  // Medications
  var meds = ccd.sections.medications || [];
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Medications (' + meds.length + ')</h3>';
  if (meds.length === 0) {
    html += '<p class="ccd-empty-note">No active medications documented.</p>';
  } else {
    html += '<table class="ccd-table"><thead><tr><th>Medication</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Status</th></tr></thead><tbody>';
    meds.forEach(function(m) {
      html += '<tr><td>' + esc(m.name || m.drug) + '</td><td>' + esc((m.dose || '') + ' ' + (m.unit || '')) + '</td><td>' + esc(m.route || '') + '</td><td>' + esc(m.frequency || '') + '</td><td>' + esc(m.status || '') + '</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  // Immunizations
  var imms = ccd.sections.immunizations || [];
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Immunizations (' + imms.length + ')</h3>';
  if (imms.length === 0) {
    html += '<p class="ccd-empty-note">No immunizations documented.</p>';
  } else {
    html += '<table class="ccd-table"><thead><tr><th>Vaccine</th><th>Date</th><th>Lot</th><th>Manufacturer</th></tr></thead><tbody>';
    imms.forEach(function(i) {
      html += '<tr><td>' + esc(i.vaccine) + '</td><td>' + esc(i.date || '') + '</td><td>' + esc(i.lot || '') + '</td><td>' + esc(i.manufacturer || '') + '</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  // Lab Results
  var labs = ccd.sections.labResults || [];
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Recent Lab Results (' + labs.length + ')</h3>';
  if (labs.length === 0) {
    html += '<p class="ccd-empty-note">No lab results documented.</p>';
  } else {
    labs.forEach(function(lab) {
      html += '<div class="ccd-lab-panel"><strong>' + esc(lab.panel) + '</strong> — ' + esc(new Date(lab.resultDate).toLocaleDateString());
      if (lab.tests && lab.tests.length > 0) {
        html += '<table class="ccd-table ccd-table-sm"><thead><tr><th>Test</th><th>Value</th><th>Units</th><th>Ref Range</th></tr></thead><tbody>';
        lab.tests.forEach(function(t) {
          html += '<tr><td>' + esc(t.name) + '</td><td>' + esc(t.value) + '</td><td>' + esc(t.unit || '') + '</td><td>' + esc(t.referenceRange || t.refRange || '') + '</td></tr>';
        });
        html += '</tbody></table>';
      }
      html += '</div>';
    });
  }
  html += '</div>';

  // Vitals
  var vitals = ccd.sections.vitals || [];
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Recent Vitals (' + vitals.length + ')</h3>';
  if (vitals.length === 0) {
    html += '<p class="ccd-empty-note">No vitals documented.</p>';
  } else {
    html += '<table class="ccd-table"><thead><tr><th>Date</th><th>BP</th><th>HR</th><th>RR</th><th>Temp</th><th>SpO2</th><th>Weight</th></tr></thead><tbody>';
    vitals.forEach(function(v) {
      html += '<tr><td>' + esc(v.recordedAt ? new Date(v.recordedAt).toLocaleDateString() : '') + '</td>' +
        '<td>' + esc((v.bpSystolic || '') + '/' + (v.bpDiastolic || '')) + '</td>' +
        '<td>' + esc(v.heartRate || '') + '</td>' +
        '<td>' + esc(v.respiratoryRate || v.respRate || '') + '</td>' +
        '<td>' + esc(v.tempF || '') + '</td>' +
        '<td>' + esc(v.spo2 || '') + '</td>' +
        '<td>' + esc(v.weightLbs || '') + '</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  // Procedures
  var procedures = ccd.sections.procedures || [];
  html += '<div class="ccd-section">';
  html += '<h3 class="ccd-section-title">Procedures / Surgeries (' + procedures.length + ')</h3>';
  if (procedures.length === 0) {
    html += '<p class="ccd-empty-note">No procedures documented.</p>';
  } else {
    html += '<table class="ccd-table"><thead><tr><th>Procedure</th><th>Date</th><th>Hospital</th></tr></thead><tbody>';
    procedures.forEach(function(p) {
      html += '<tr><td>' + esc(p.procedure || p.name) + '</td><td>' + esc(p.date || '') + '</td><td>' + esc(p.hospital || '') + '</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  html += '<div class="ccd-footer">This document was generated by GusdorfEMR. It is intended for authorized healthcare providers only.</div>';
  html += '</div>';

  return html;
}

/* ---------- Main render ---------- */

function renderCCDExchange() {
  var app = document.getElementById('app');

  setTopbar({ title: 'CCD/CDA Document Exchange', meta: 'Generate, Export & Import CCDs' });
  setActiveNav('ccd-exchange');

  var patients = getPatients();
  var selectedPatientId = null;
  var activeTab = 'generate';

  function render() {
    app.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:24px;max-width:1200px;margin:0 auto;';

    // Patient selector
    var headerDiv = document.createElement('div');
    headerDiv.className = 'ccd-header-bar';
    headerDiv.innerHTML = '<h3 style="margin:0;">CCD/CDA Document Exchange</h3>';

    var selectWrap = document.createElement('div');
    selectWrap.style.cssText = 'display:flex;gap:12px;align-items:center;';
    var label = document.createElement('label');
    label.textContent = 'Patient:';
    label.style.cssText = 'font-weight:600;font-size:14px;';
    var sel = document.createElement('select');
    sel.className = 'form-control';
    sel.style.maxWidth = '300px';
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
      wrap.innerHTML += '<div class="ccd-empty">Select a patient to generate or view CCDs.</div>';
      app.appendChild(wrap);
      return;
    }

    // Tabs
    var tabBar = document.createElement('div');
    tabBar.className = 'ccd-tab-bar';
    var tabs = [
      { key: 'generate', label: 'Generate CCD' },
      { key: 'import', label: 'Import CCD' },
      { key: 'history', label: 'CCD History' },
      { key: 'toc', label: 'Transition of Care' },
    ];
    tabs.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'ccd-tab' + (t.key === activeTab ? ' active' : '');
      btn.textContent = t.label;
      btn.addEventListener('click', function() {
        activeTab = t.key;
        render();
      });
      tabBar.appendChild(btn);
    });
    wrap.appendChild(tabBar);

    var contentDiv = document.createElement('div');
    contentDiv.className = 'ccd-content';

    if (activeTab === 'generate') {
      renderGenerateTab(contentDiv, selectedPatientId);
    } else if (activeTab === 'import') {
      renderImportTab(contentDiv, selectedPatientId);
    } else if (activeTab === 'history') {
      renderHistoryTab(contentDiv, selectedPatientId);
    } else if (activeTab === 'toc') {
      renderTOCTab(contentDiv, selectedPatientId);
    }

    wrap.appendChild(contentDiv);
    app.appendChild(wrap);
  }

  function renderGenerateTab(container, patientId) {
    var ccd = generateCCDForPatient(patientId);
    if (!ccd) {
      container.innerHTML = '<div class="ccd-empty">Patient not found.</div>';
      return;
    }

    var toolbar = document.createElement('div');
    toolbar.className = 'ccd-toolbar';

    var exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-primary';
    exportBtn.textContent = 'Download CCD';
    exportBtn.addEventListener('click', function() {
      var htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CCD - ' + esc(ccd.sections.demographics.firstName + ' ' + ccd.sections.demographics.lastName) + '</title>' +
        '<style>body{font-family:Arial,sans-serif;max-width:800px;margin:20px auto;padding:20px;color:#333}h2{color:#2b6cb0;border-bottom:2px solid #2b6cb0;padding-bottom:8px}h3{color:#1a202c;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-top:24px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;font-size:13px}th{background:#f7fafc;font-weight:600}.ccd-footer{margin-top:40px;padding-top:16px;border-top:2px solid #e2e8f0;font-size:11px;color:#718096}</style>' +
        '</head><body>' + renderCCDasHTML(ccd) + '</body></html>';
      var blob = new Blob([htmlContent], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'CCD_' + ccd.sections.demographics.lastName + '_' + ccd.sections.demographics.firstName + '_' + new Date().toISOString().split('T')[0] + '.html';
      a.click();
      URL.revokeObjectURL(url);

      // Save to history
      saveCCDRecord({
        patientId: patientId,
        type: 'generated',
        title: 'CCD Export',
        createdAt: new Date().toISOString(),
        createdBy: getSessionUser() ? getSessionUser().id : null,
        summary: 'Exported CCD with ' + (ccd.sections.allergies.length) + ' allergies, ' + (ccd.sections.problems.length) + ' problems, ' + (ccd.sections.medications.length) + ' medications',
      });
      showToast('CCD downloaded successfully', 'success');
    });

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary';
    saveBtn.textContent = 'Save to History';
    saveBtn.addEventListener('click', function() {
      saveCCDRecord({
        patientId: patientId,
        type: 'generated',
        title: 'CCD Snapshot',
        createdAt: new Date().toISOString(),
        createdBy: getSessionUser() ? getSessionUser().id : null,
        sections: ccd.sections,
        summary: 'CCD with ' + (ccd.sections.allergies.length) + ' allergies, ' + (ccd.sections.problems.length) + ' problems, ' + (ccd.sections.medications.length) + ' medications',
      });
      showToast('CCD saved to history', 'success');
    });

    toolbar.appendChild(exportBtn);
    toolbar.appendChild(saveBtn);
    container.appendChild(toolbar);

    // Preview
    var preview = document.createElement('div');
    preview.className = 'ccd-preview-wrapper';
    preview.innerHTML = renderCCDasHTML(ccd);
    container.appendChild(preview);
  }

  function renderImportTab(container, patientId) {
    container.innerHTML =
      '<div class="ccd-import-section">' +
      '<h4>Import CCD Content</h4>' +
      '<p style="font-size:13px;color:var(--text-secondary);">Paste CCD or clinical document content below. The system will attempt to parse structured data sections.</p>' +
      '<textarea id="ccd-import-textarea" class="form-control" style="height:200px;font-family:monospace;font-size:12px;" placeholder="Paste CCD/CDA XML or structured text here..."></textarea>' +
      '<div style="margin-top:12px;">' +
      '<button class="btn btn-primary" id="ccd-import-parse-btn">Parse & Preview</button>' +
      '</div>' +
      '<div id="ccd-import-preview"></div>' +
      '</div>';

    var parseBtn = document.getElementById('ccd-import-parse-btn');
    parseBtn.addEventListener('click', function() {
      var text = document.getElementById('ccd-import-textarea').value.trim();
      if (!text) {
        showToast('Please paste CCD content', 'warning');
        return;
      }

      var previewDiv = document.getElementById('ccd-import-preview');
      // Simulated parsing — extract key sections
      var parsed = simulateCCDParse(text);

      var html = '<div class="ccd-import-parsed">';
      html += '<h4 style="margin:16px 0 8px;">Parsed Sections</h4>';

      if (parsed.allergies.length > 0) {
        html += '<div class="ccd-import-section-card"><strong>Allergies (' + parsed.allergies.length + ')</strong><ul>';
        parsed.allergies.forEach(function(a) { html += '<li>' + esc(a) + '</li>'; });
        html += '</ul></div>';
      }
      if (parsed.problems.length > 0) {
        html += '<div class="ccd-import-section-card"><strong>Problems (' + parsed.problems.length + ')</strong><ul>';
        parsed.problems.forEach(function(p) { html += '<li>' + esc(p) + '</li>'; });
        html += '</ul></div>';
      }
      if (parsed.medications.length > 0) {
        html += '<div class="ccd-import-section-card"><strong>Medications (' + parsed.medications.length + ')</strong><ul>';
        parsed.medications.forEach(function(m) { html += '<li>' + esc(m) + '</li>'; });
        html += '</ul></div>';
      }

      html += '<div style="margin-top:16px;"><button class="btn btn-success" id="ccd-import-apply-btn">Import to Patient Chart</button></div>';
      html += '</div>';
      previewDiv.innerHTML = html;

      document.getElementById('ccd-import-apply-btn').addEventListener('click', function() {
        var count = 0;
        parsed.allergies.forEach(function(a) {
          if (typeof savePatientAllergy === 'function') {
            savePatientAllergy({ patientId: patientId, allergen: a, type: 'Drug', severity: 'Moderate', reaction: '' });
            count++;
          }
        });
        parsed.problems.forEach(function(p) {
          if (typeof saveActiveProblem === 'function') {
            saveActiveProblem({ patientId: patientId, name: p, status: 'Active', notes: 'Imported from CCD' });
            count++;
          }
        });
        parsed.medications.forEach(function(m) {
          if (typeof savePatientMedication === 'function') {
            savePatientMedication({ patientId: patientId, name: m, status: 'Active', dose: '', unit: '', route: 'PO', frequency: '' });
            count++;
          }
        });

        saveCCDRecord({
          patientId: patientId,
          type: 'received',
          title: 'Imported CCD',
          createdAt: new Date().toISOString(),
          createdBy: getSessionUser() ? getSessionUser().id : null,
          summary: count + ' items imported from CCD',
        });

        showToast(count + ' items imported from CCD', 'success');
        document.getElementById('ccd-import-textarea').value = '';
        previewDiv.innerHTML = '';
      });
    });
  }

  function simulateCCDParse(text) {
    // Simple keyword-based parsing for demo
    var allergies = [];
    var problems = [];
    var medications = [];

    var lines = text.split('\n');
    var currentSection = null;

    lines.forEach(function(line) {
      var trimmed = line.trim();
      var lower = trimmed.toLowerCase();

      if (lower.indexOf('allerg') >= 0 && trimmed.length < 40) {
        currentSection = 'allergies';
        return;
      }
      if ((lower.indexOf('problem') >= 0 || lower.indexOf('diagnos') >= 0) && trimmed.length < 40) {
        currentSection = 'problems';
        return;
      }
      if (lower.indexOf('medication') >= 0 && trimmed.length < 40) {
        currentSection = 'medications';
        return;
      }

      if (trimmed.length > 2 && trimmed.length < 200) {
        // Remove bullets and numbering
        var clean = trimmed.replace(/^[\-\*\d\.\)]+\s*/, '');
        if (clean.length < 3) return;

        if (currentSection === 'allergies') allergies.push(clean);
        else if (currentSection === 'problems') problems.push(clean);
        else if (currentSection === 'medications') medications.push(clean);
      }
    });

    // If nothing parsed from sections, attempt general extraction
    if (allergies.length === 0 && problems.length === 0 && medications.length === 0) {
      lines.forEach(function(line) {
        var t = line.trim();
        if (t.length > 3 && t.length < 100) {
          if (t.toLowerCase().indexOf('mg') >= 0 || t.toLowerCase().indexOf('tablet') >= 0) medications.push(t);
          else if (t.match(/[A-Z]\d+\.\d/)) problems.push(t);
          else if (t.toLowerCase().indexOf('allerg') >= 0) allergies.push(t);
        }
      });
    }

    return { allergies: allergies.slice(0, 20), problems: problems.slice(0, 20), medications: medications.slice(0, 20) };
  }

  function renderHistoryTab(container, patientId) {
    var history = getCCDHistory(patientId);

    if (history.length === 0) {
      container.innerHTML = '<div class="ccd-empty">No CCD history for this patient.</div>';
      return;
    }

    var html = '<div class="ccd-history-list">';
    history.forEach(function(rec) {
      var d = new Date(rec.createdAt);
      html += '<div class="ccd-history-card">' +
        '<div class="ccd-history-info">' +
        '<strong>' + esc(rec.title) + '</strong>' +
        '<div style="font-size:12px;color:var(--text-muted);">' +
        esc(rec.type === 'generated' ? 'Generated' : 'Received') + ' on ' + d.toLocaleString() +
        (rec.summary ? ' &middot; ' + esc(rec.summary) : '') +
        '</div></div>' +
        '<span class="ccd-type-badge ccd-type-' + esc(rec.type) + '">' + esc(rec.type) + '</span>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderTOCTab(container, patientId) {
    container.innerHTML =
      '<div class="ccd-toc-section">' +
      '<h4>Transition of Care Summary</h4>' +
      '<p style="font-size:13px;color:var(--text-secondary);">Generate a Transition of Care document for referrals, transfers, or discharge.</p>' +
      '<div class="ccd-toc-form">' +
      '<div class="form-group"><label>Recipient / Facility</label><input type="text" id="toc-recipient" class="form-control" placeholder="e.g., Dr. Smith, Memorial Hospital" /></div>' +
      '<div class="form-group"><label>Reason for Transfer/Referral</label><input type="text" id="toc-reason" class="form-control" placeholder="e.g., Cardiology consult" /></div>' +
      '<div class="form-group"><label>Additional Notes</label><textarea id="toc-notes" class="form-control" rows="3" placeholder="Any additional clinical context..."></textarea></div>' +
      '<button class="btn btn-primary" id="toc-generate-btn">Generate TOC Summary</button>' +
      '</div>' +
      '<div id="toc-preview"></div>' +
      '</div>';

    document.getElementById('toc-generate-btn').addEventListener('click', function() {
      var recipient = document.getElementById('toc-recipient').value.trim();
      var reason = document.getElementById('toc-reason').value.trim();
      var notes = document.getElementById('toc-notes').value.trim();

      if (!recipient) {
        showToast('Please enter a recipient', 'warning');
        return;
      }

      var ccd = generateCCDForPatient(patientId);
      if (!ccd) return;

      var pat = ccd.sections.demographics;
      var previewDiv = document.getElementById('toc-preview');
      var html = '<div class="ccd-toc-document">';
      html += '<h3>Transition of Care Summary</h3>';
      html += '<div class="ccd-toc-meta">';
      html += '<div><strong>To:</strong> ' + esc(recipient) + '</div>';
      html += '<div><strong>From:</strong> ' + (getSessionUser() ? esc(getSessionUser().firstName + ' ' + getSessionUser().lastName) : 'Provider') + '</div>';
      html += '<div><strong>Date:</strong> ' + new Date().toLocaleDateString() + '</div>';
      html += '<div><strong>Reason:</strong> ' + esc(reason || 'N/A') + '</div>';
      html += '</div>';
      html += '<div class="ccd-toc-patient"><strong>Patient:</strong> ' + esc(pat.firstName + ' ' + pat.lastName) + ' | DOB: ' + esc(pat.dob) + ' | MRN: ' + esc(pat.mrn) + '</div>';

      if (notes) html += '<div class="ccd-toc-notes"><strong>Notes:</strong> ' + esc(notes) + '</div>';

      // Abbreviated clinical summary
      html += renderCCDasHTML(ccd);
      html += '</div>';

      previewDiv.innerHTML = html;

      saveCCDRecord({
        patientId: patientId,
        type: 'generated',
        title: 'TOC to ' + recipient,
        createdAt: new Date().toISOString(),
        createdBy: getSessionUser() ? getSessionUser().id : null,
        summary: 'Transition of Care for ' + (reason || 'referral'),
      });

      showToast('TOC summary generated', 'success');
    });
  }

  render();
}
