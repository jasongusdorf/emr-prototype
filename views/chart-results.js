/* ============================================================
   views/chart-results.js — Results section with subtabs:
   Labs, Imaging, Microbiology, Pathology
   ============================================================ */

/* ============================================================
   RESULTS SECTION — subtabs: Labs, Imaging, Micro, Pathology
   ============================================================ */
let _currentResultsSubTab = 'labs';

function buildResultsSection(patientId) {
  const section = document.createElement('div');
  section.className = 'results-section';

  // Subtab bar
  const bar = document.createElement('div');
  bar.className = 'results-subtab-bar';
  const tabs = [
    { key: 'labs',      label: 'Labs' },
    { key: 'imaging',   label: 'Imaging' },
    { key: 'micro',     label: 'Micro' },
    { key: 'pathology', label: 'Pathology' },
  ];
  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'results-subtab' + (_currentResultsSubTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      _currentResultsSubTab = t.key;
      bar.querySelectorAll('.results-subtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderResultsContent();
    });
    bar.appendChild(btn);
  });
  section.appendChild(bar);

  const content = document.createElement('div');
  content.id = 'results-subtab-content';
  section.appendChild(content);

  function renderResultsContent() {
    content.innerHTML = '';
    switch (_currentResultsSubTab) {
      case 'labs':      content.appendChild(buildLabResultsCard(patientId)); break;
      case 'imaging':   content.appendChild(buildImagingResultsCard(patientId)); break;
      case 'micro':     content.appendChild(buildMicroResultsCard(patientId)); break;
      case 'pathology': content.appendChild(buildPathResultsCard(patientId)); break;
    }
  }
  renderResultsContent();
  return section;
}

/* ============================================================
   LAB RESULTS
   ============================================================ */
let _labViewMode = 'test'; // 'panel' | 'test' | 'date'

function _labFlagIcon(flag) {
  const f = (flag || 'Normal').toLowerCase();
  if (f === 'critical-low' || f === 'critical-high') {
    return '<span class="lab-flag-critical" title="' + esc(flag) + '">!</span>';
  }
  if (f === 'low' || f === 'high') {
    return '<span class="lab-flag-abnormal" title="' + esc(flag) + '">!</span>';
  }
  return '';
}

function buildLabResultsCard(patientId) {
  const results = getLabResults(patientId);
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginBottom = '20px';
  card.id = 'section-labs';

  // Header with add button + view toggles
  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const titleEl = document.createElement('span');
  titleEl.className = 'card-title';
  titleEl.textContent = 'Lab Results';
  hdr.appendChild(titleEl);

  const controls = document.createElement('div');
  controls.style.display = 'flex'; controls.style.gap = '6px'; controls.style.alignItems = 'center';

  const viewBtns = document.createElement('div');
  viewBtns.className = 'lab-view-toggle';
  [{ key: 'test', label: 'By Test' }, { key: 'date', label: 'By Date' }, { key: 'panel', label: 'Panel' }].forEach(v => {
    const btn = document.createElement('button');
    btn.className = 'lab-view-btn' + (_labViewMode === v.key ? ' active' : '');
    btn.textContent = v.label;
    btn.addEventListener('click', () => {
      _labViewMode = v.key;
      viewBtns.querySelectorAll('.lab-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLabBody();
    });
    viewBtns.appendChild(btn);
  });
  controls.appendChild(viewBtns);

  const addBtn = makeBtn('+ Add Results', 'btn btn-primary btn-sm', () => openLabResultModal(patientId));
  controls.appendChild(addBtn);
  hdr.appendChild(controls);
  card.appendChild(hdr);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('🧪', 'No lab results', 'Add lab results for this patient.'));
    return card;
  }

  const bodyContainer = document.createElement('div');
  bodyContainer.id = 'lab-results-body';
  card.appendChild(bodyContainer);

  function renderLabBody() {
    bodyContainer.innerHTML = '';
    switch (_labViewMode) {
      case 'panel': _renderLabPanelView(bodyContainer, results, patientId); break;
      case 'test':  _renderLabTestView(bodyContainer, results); break;
      case 'date':  _renderLabDateView(bodyContainer, results, patientId); break;
    }
  }
  renderLabBody();
  return card;
}

/* --- Panel View (original) --- */
function _renderLabPanelView(container, results, patientId) {
  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(result => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.textContent = result.panel;

    // Check if any tests are abnormal/critical for panel-level indicator
    const hasAbnormal = (result.tests || []).some(t => {
      const f = (t.flag || 'Normal').toLowerCase();
      return f !== 'normal';
    });
    if (hasAbnormal) {
      const hasCritical = (result.tests || []).some(t => {
        const f = (t.flag || 'Normal').toLowerCase();
        return f === 'critical-low' || f === 'critical-high';
      });
      const icon = document.createElement('span');
      icon.innerHTML = hasCritical
        ? '<span class="lab-flag-critical" title="Contains critical values">!</span>'
        : '<span class="lab-flag-abnormal" title="Contains abnormal values">!</span>';
      title.appendChild(document.createTextNode(' '));
      title.appendChild(icon);
    }

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(result.resultDate) + (result.resultedBy ? ' · ' + result.resultedBy : '');

    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(toggle);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';

    if (result.tests && result.tests.length > 0) {
      const tbl = document.createElement('table');
      tbl.className = 'table';
      tbl.innerHTML = '<thead><tr><th>Test</th><th>Value</th><th>Units</th><th>Reference Range</th><th>Flag</th></tr></thead>';
      const tb = document.createElement('tbody');
      result.tests.forEach(t => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td'); tdName.textContent = t.name;
        const tdVal = document.createElement('td'); tdVal.style.fontWeight = '600';
        tdVal.innerHTML = esc(t.value) + ' ' + _labFlagIcon(t.flag);
        const tdUnit = document.createElement('td'); tdUnit.textContent = t.unit || '—';
        const tdRef = document.createElement('td'); tdRef.textContent = t.referenceRange || '—'; tdRef.style.fontSize = '12px';
        const tdFlag = document.createElement('td');
        const flagKey = (t.flag || 'Normal').toLowerCase().replace(/\s+/g, '-');
        const flagSpan = document.createElement('span');
        flagSpan.className = 'flag-' + flagKey;
        flagSpan.textContent = t.flag || 'Normal';
        tdFlag.appendChild(flagSpan);
        tr.appendChild(tdName); tr.appendChild(tdVal); tr.appendChild(tdUnit);
        tr.appendChild(tdRef); tr.appendChild(tdFlag);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      detailDiv.appendChild(tbl);
    }
    if (result.notes) {
      const noteEl = document.createElement('div');
      noteEl.style.cssText = 'padding:8px 14px;font-size:12px;color:var(--text-secondary);border-top:1px solid var(--border)';
      noteEl.textContent = result.notes;
      detailDiv.appendChild(noteEl);
    }
    panel.appendChild(detailDiv);

    hdr.addEventListener('click', () => {
      const open = detailDiv.style.display !== 'none';
      detailDiv.style.display = open ? 'none' : 'block';
      toggle.textContent = open ? '▶' : '▼';
    });

    body.appendChild(panel);
  });

  container.appendChild(body);
}

/* --- Organ system classifier for By Test view --- */
const _LAB_SYSTEM_ORDER = [
  'Hematology','Cardiac','Metabolic','Hepatic','Coagulation',
  'Thyroid','Lipids','Inflammatory','Iron Studies','Diabetes',
  'Blood Gas','Nutritional','Tumor Markers','Drug Levels','Urinalysis','Other',
];
function _getLabSystem(name) {
  const n = name.toLowerCase().trim();
  if (/\b(wbc|rbc|hgb|hct|mcv|mch|mchc|rdw|plt|cbc|hemoglobin|hematocrit|platelets?|neutrophils?|lymphocytes?|monocytes?|eosinophils?|basophils?|reticulocytes?|bands?)\b/.test(n)) return 'Hematology';
  if (/\b(troponin|bnp|nt.probnp|pro.bnp|ck.mb|myoglobin)\b/.test(n)) return 'Cardiac';
  if (/\b(sodium|potassium|chloride|bicarbonate|bun|creatinine|glucose|calcium|magnesium|phosphorus|phosphate|egfr|osmolality|anion.gap|bmp|cmp)\b/.test(n) || /^(na|k|cr|cl|co2)$/.test(n)) return 'Metabolic';
  if (/\b(ast|alt|alp|ggt|ldh|bilirubin|tbili|dbili|albumin|alkaline.phosphatase|alk.phos|transaminase|total.protein)\b/.test(n)) return 'Hepatic';
  if (/\b(inr|fibrinogen|d.dimer|anti.xa|thrombin)\b/.test(n) || /^(pt|ptt|aptt)$/.test(n)) return 'Coagulation';
  if (/\b(tsh|thyroid|thyroglobulin)\b/.test(n) || /^(t3|t4|free t3|free t4)$/.test(n)) return 'Thyroid';
  if (/\b(cholesterol|ldl|hdl|triglyceride|vldl)\b/.test(n)) return 'Lipids';
  if (/\b(crp|esr|procalcitonin|c.reactive|sed.rate|interleukin)\b/.test(n)) return 'Inflammatory';
  if (/\b(ferritin|tibc|transferrin|tsat|iron)\b/.test(n)) return 'Iron Studies';
  if (/\b(a1c|hba1c|hemoglobin.a1c|insulin|c.peptide)\b/.test(n)) return 'Diabetes';
  if (/\b(lactate|pco2|po2|hco3|fio2|base.excess)\b/.test(n) || /^ph$/.test(n)) return 'Blood Gas';
  if (/\b(vitamin|folate|b12|zinc|thiamine|copper)\b/.test(n)) return 'Nutritional';
  if (/\b(psa|cea|afp|hcg|ca.125|ca.19|ca.15)\b/.test(n)) return 'Tumor Markers';
  if (/\b(vancomycin|gentamicin|digoxin|lithium|phenytoin|valproic|tacrolimus|cyclosporine|trough)\b/.test(n)) return 'Drug Levels';
  if (/\b(urine|urinalysis|microalbumin|upcr|upci)\b/.test(n) || /^ua$/.test(n)) return 'Urinalysis';
  return 'Other';
}

/* --- By Test View (grouped by test name, organized by organ system) --- */
function _renderLabTestView(container, results) {
  const testMap = {};
  results.forEach(result => {
    (result.tests || []).forEach(t => {
      const key = (t.name || '').trim();
      if (!key) return;
      if (!testMap[key]) testMap[key] = [];
      testMap[key].push({ value: t.value, unit: t.unit, referenceRange: t.referenceRange, flag: t.flag, date: result.resultDate, panel: result.panel });
    });
  });

  const body = document.createElement('div');
  body.style.padding = '8px 16px';

  const testNames = Object.keys(testMap).sort();
  if (testNames.length === 0) {
    body.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">No individual test results to display.</div>';
    container.appendChild(body);
    return;
  }

  // Group by organ system
  const systemGroups = {};
  testNames.forEach(name => {
    const sys = _getLabSystem(name);
    if (!systemGroups[sys]) systemGroups[sys] = [];
    systemGroups[sys].push(name);
  });
  const orderedSystems = _LAB_SYSTEM_ORDER.filter(s => systemGroups[s]);

  orderedSystems.forEach((sys, sysIdx) => {
    // Section header
    const sysHeader = document.createElement('div');
    sysHeader.style.cssText = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);padding:10px 0 4px;' + (sysIdx > 0 ? 'border-top:1px solid var(--border);margin-top:6px;' : '');
    sysHeader.textContent = sys;
    body.appendChild(sysHeader);

    // 2-column grid for tests in this system
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0 16px;';
    body.appendChild(grid);

    systemGroups[sys].forEach(name => {
      const entries = testMap[name].sort((a, b) => new Date(b.date) - new Date(a.date));
      const panel = document.createElement('div');
      panel.className = 'lab-result-panel';

      const hdr = document.createElement('div');
      hdr.className = 'lab-result-panel-header';

      const title = document.createElement('span');
      title.textContent = name;
      title.style.fontSize = '11px'; title.style.fontWeight = '700'; title.style.textTransform = 'uppercase'; title.style.letterSpacing = '0.04em';

      const toggle = document.createElement('span');
      toggle.textContent = '▼'; toggle.style.fontSize = '10px'; toggle.style.color = 'var(--text-muted)';

      hdr.appendChild(title); hdr.appendChild(toggle);
      panel.appendChild(hdr);

      const detailDiv = document.createElement('div');
      detailDiv.style.display = 'block';

      const tbl = document.createElement('table');
      tbl.className = 'table';
      tbl.style.fontSize = '12px';
      const tb = document.createElement('tbody');
      entries.forEach(e => {
        const tr = document.createElement('tr');
        const d = e.date ? (e.date.includes('T') ? new Date(e.date) : new Date(e.date + 'T00:00:00')) : null;
        const compactDate = d && !isNaN(d) ? (d.getMonth()+1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2) : (e.date || '—');
        const tdDate = document.createElement('td'); tdDate.textContent = compactDate; tdDate.style.color = 'var(--text-muted)';
        const tdVal = document.createElement('td'); tdVal.style.fontWeight = '600';
        tdVal.innerHTML = esc(e.value) + ' ' + _labFlagIcon(e.flag);
        const tdUnit = document.createElement('td'); tdUnit.textContent = e.unit || '—'; tdUnit.style.color = 'var(--text-muted)';
        const tdRef = document.createElement('td'); tdRef.textContent = e.referenceRange || '—'; tdRef.style.color = 'var(--text-muted)';
        tr.appendChild(tdDate); tr.appendChild(tdVal); tr.appendChild(tdUnit); tr.appendChild(tdRef);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      detailDiv.appendChild(tbl);
      panel.appendChild(detailDiv);

      hdr.addEventListener('click', () => {
        const open = detailDiv.style.display !== 'none';
        detailDiv.style.display = open ? 'none' : 'block';
        toggle.textContent = open ? '▶' : '▼';
      });

      grid.appendChild(panel);
    });
  });

  container.appendChild(body);
}

/* --- By Date View (grouped by date) --- */
function _renderLabDateView(container, results, patientId) {
  // Group results by date (YYYY-MM-DD)
  const dateMap = {};
  results.forEach(result => {
    const dateKey = formatDate(result.resultDate);
    if (!dateMap[dateKey]) dateMap[dateKey] = [];
    dateMap[dateKey].push(result);
  });

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  const dates = Object.keys(dateMap).sort((a, b) => new Date(b) - new Date(a));

  dates.forEach(dateStr => {
    const dayResults = dateMap[dateStr];

    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(dateStr) + '</strong>';

    const panelList = document.createElement('span');
    panelList.className = 'text-muted text-sm';
    const panelNames = dayResults.map(r => {
      const hasAbnormal = (r.tests || []).some(t => {
        const f = (t.flag || 'Normal').toLowerCase();
        return f !== 'normal';
      });
      const hasCritical = (r.tests || []).some(t => {
        const f = (t.flag || 'Normal').toLowerCase();
        return f === 'critical-low' || f === 'critical-high';
      });
      let icon = '';
      if (hasCritical) icon = ' <span class="lab-flag-critical" title="Critical">!</span>';
      else if (hasAbnormal) icon = ' <span class="lab-flag-abnormal" title="Abnormal">!</span>';
      return esc(r.panel) + icon;
    });
    panelList.innerHTML = panelNames.join(', ');

    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';

    hdr.appendChild(title); hdr.appendChild(panelList); hdr.appendChild(toggle);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';

    dayResults.forEach(result => {
      if (!result.tests || result.tests.length === 0) return;
      const subHdr = document.createElement('div');
      subHdr.style.cssText = 'padding:8px 14px 4px;font-weight:600;font-size:13px;color:var(--text-primary);border-top:1px solid var(--border)';
      subHdr.textContent = result.panel;
      if (result.resultedBy) {
        const by = document.createElement('span');
        by.style.cssText = 'font-weight:400;font-size:11px;color:var(--text-muted);margin-left:8px';
        by.textContent = result.resultedBy;
        subHdr.appendChild(by);
      }
      detailDiv.appendChild(subHdr);

      const tbl = document.createElement('table');
      tbl.className = 'table';
      tbl.innerHTML = '<thead><tr><th>Test</th><th>Value</th><th>Units</th><th>Reference Range</th><th>Flag</th></tr></thead>';
      const tb = document.createElement('tbody');
      result.tests.forEach(t => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td'); tdName.textContent = t.name;
        const tdVal = document.createElement('td'); tdVal.style.fontWeight = '600';
        tdVal.innerHTML = esc(t.value) + ' ' + _labFlagIcon(t.flag);
        const tdUnit = document.createElement('td'); tdUnit.textContent = t.unit || '—';
        const tdRef = document.createElement('td'); tdRef.textContent = t.referenceRange || '—'; tdRef.style.fontSize = '12px';
        const tdFlag = document.createElement('td');
        const flagKey = (t.flag || 'Normal').toLowerCase().replace(/\s+/g, '-');
        const flagSpan = document.createElement('span');
        flagSpan.className = 'flag-' + flagKey;
        flagSpan.textContent = t.flag || 'Normal';
        tdFlag.appendChild(flagSpan);
        tr.appendChild(tdName); tr.appendChild(tdVal); tr.appendChild(tdUnit);
        tr.appendChild(tdRef); tr.appendChild(tdFlag);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      detailDiv.appendChild(tbl);
    });
    panel.appendChild(detailDiv);

    hdr.addEventListener('click', () => {
      const open = detailDiv.style.display !== 'none';
      detailDiv.style.display = open ? 'none' : 'block';
      toggle.textContent = open ? '▶' : '▼';
    });

    body.appendChild(panel);
  });

  container.appendChild(body);
}

/* ============================================================
   IMAGING RESULTS
   ============================================================ */
function buildImagingResultsCard(patientId) {
  const results = getImagingResults(patientId);
  const addBtn = makeBtn('+ Add Result', 'btn btn-primary btn-sm', () => openImagingResultModal(patientId));
  const card = chartCard('Imaging Results', addBtn);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('📷', 'No imaging results', 'Add imaging results for this patient.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(r => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(r.studyType) + '</strong>';
    if (r.modality) title.innerHTML += ' <span class="text-muted text-sm">(' + esc(r.modality) + ')</span>';

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(r.resultDate) + (r.readBy ? ' · ' + r.readBy : '');

    const actions = document.createElement('span');
    actions.style.display = 'flex'; actions.style.gap = '6px'; actions.style.alignItems = 'center';
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + (r.status === 'Final' ? 'signed' : 'open');
    statusBadge.textContent = r.status || 'Final';
    actions.appendChild(statusBadge);
    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';
    actions.appendChild(toggle);

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(actions);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';
    detailDiv.style.padding = '12px 14px';
    detailDiv.style.fontSize = '13px';
    detailDiv.style.lineHeight = '1.6';

    if (r.indication) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Indication:</strong> ' + esc(r.indication) + '</div>';
    if (r.findings) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Findings:</strong><br><span style="white-space:pre-wrap">' + esc(r.findings) + '</span></div>';
    if (r.impression) detailDiv.innerHTML += '<div><strong>Impression:</strong><br><span style="white-space:pre-wrap">' + esc(r.impression) + '</span></div>';

    panel.appendChild(detailDiv);
    hdr.addEventListener('click', () => {
      const open = detailDiv.style.display !== 'none';
      detailDiv.style.display = open ? 'none' : 'block';
      toggle.textContent = open ? '▶' : '▼';
    });
    body.appendChild(panel);
  });

  card.appendChild(body);
  return card;
}

/* ============================================================
   MICROBIOLOGY RESULTS
   ============================================================ */
function buildMicroResultsCard(patientId) {
  const results = getMicroResults(patientId);
  const addBtn = makeBtn('+ Add Result', 'btn btn-primary btn-sm', () => openMicroResultModal(patientId));
  const card = chartCard('Microbiology Results', addBtn);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('🦠', 'No microbiology results', 'Add micro results for this patient.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(r => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(r.cultureSite) + '</strong>';

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(r.collectionDate);

    const actions = document.createElement('span');
    actions.style.display = 'flex'; actions.style.gap = '6px'; actions.style.alignItems = 'center';
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + (r.status === 'Final' ? 'signed' : 'open');
    statusBadge.textContent = r.status || 'Final';
    actions.appendChild(statusBadge);
    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';
    actions.appendChild(toggle);

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(actions);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';
    detailDiv.style.padding = '12px 14px';
    detailDiv.style.fontSize = '13px';
    detailDiv.style.lineHeight = '1.6';

    if (r.gramStain) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Gram Stain:</strong> ' + esc(r.gramStain) + '</div>';
    if (r.organism) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Organism:</strong> ' + esc(r.organism) + '</div>';
    if (r.sensitivities && r.sensitivities.length > 0) {
      let sensHtml = '<div style="margin-bottom:8px"><strong>Sensitivities:</strong><table class="table" style="margin-top:4px"><thead><tr><th>Antibiotic</th><th>Result</th><th>MIC</th></tr></thead><tbody>';
      r.sensitivities.forEach(s => {
        const cls = s.result === 'Sensitive' ? 'flag-normal' : s.result === 'Resistant' ? 'flag-high' : 'flag-low';
        sensHtml += '<tr><td>' + esc(s.antibiotic) + '</td><td><span class="' + cls + '">' + esc(s.result) + '</span></td><td>' + esc(s.mic || '—') + '</td></tr>';
      });
      sensHtml += '</tbody></table></div>';
      detailDiv.innerHTML += sensHtml;
    }
    if (r.notes) detailDiv.innerHTML += '<div><strong>Notes:</strong> ' + esc(r.notes) + '</div>';

    panel.appendChild(detailDiv);
    hdr.addEventListener('click', () => {
      const open = detailDiv.style.display !== 'none';
      detailDiv.style.display = open ? 'none' : 'block';
      toggle.textContent = open ? '▶' : '▼';
    });
    body.appendChild(panel);
  });

  card.appendChild(body);
  return card;
}

/* ============================================================
   PATHOLOGY RESULTS
   ============================================================ */
function buildPathResultsCard(patientId) {
  const results = getPathResults(patientId);
  const addBtn = makeBtn('+ Add Result', 'btn btn-primary btn-sm', () => openPathResultModal(patientId));
  const card = chartCard('Pathology Results', addBtn);

  if (results.length === 0) {
    card.appendChild(buildEmptyState('🔬', 'No pathology results', 'Add pathology results for this patient.'));
    return card;
  }

  const body = document.createElement('div');
  body.style.padding = '12px 16px';

  results.forEach(r => {
    const panel = document.createElement('div');
    panel.className = 'lab-result-panel';

    const hdr = document.createElement('div');
    hdr.className = 'lab-result-panel-header';

    const title = document.createElement('span');
    title.innerHTML = '<strong>' + esc(r.specimenType) + '</strong>';
    if (r.specimenSite) title.innerHTML += ' <span class="text-muted text-sm">(' + esc(r.specimenSite) + ')</span>';

    const meta = document.createElement('span');
    meta.className = 'text-muted text-sm';
    meta.textContent = formatDate(r.resultDate) + (r.pathologist ? ' · ' + r.pathologist : '');

    const actions = document.createElement('span');
    actions.style.display = 'flex'; actions.style.gap = '6px'; actions.style.alignItems = 'center';
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-' + (r.status === 'Final' ? 'signed' : 'open');
    statusBadge.textContent = r.status || 'Final';
    actions.appendChild(statusBadge);
    const toggle = document.createElement('span');
    toggle.textContent = '▶'; toggle.style.fontSize = '11px'; toggle.style.color = 'var(--text-muted)';
    actions.appendChild(toggle);

    hdr.appendChild(title); hdr.appendChild(meta); hdr.appendChild(actions);
    panel.appendChild(hdr);

    const detailDiv = document.createElement('div');
    detailDiv.style.display = 'none';
    detailDiv.style.padding = '12px 14px';
    detailDiv.style.fontSize = '13px';
    detailDiv.style.lineHeight = '1.6';

    if (r.grossDesc) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Gross Description:</strong><br><span style="white-space:pre-wrap">' + esc(r.grossDesc) + '</span></div>';
    if (r.microDesc) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Microscopic Description:</strong><br><span style="white-space:pre-wrap">' + esc(r.microDesc) + '</span></div>';
    if (r.diagnosis) detailDiv.innerHTML += '<div style="margin-bottom:8px"><strong>Diagnosis:</strong><br><span style="white-space:pre-wrap">' + esc(r.diagnosis) + '</span></div>';
    if (r.notes) detailDiv.innerHTML += '<div><strong>Notes:</strong> ' + esc(r.notes) + '</div>';

    panel.appendChild(detailDiv);
    hdr.addEventListener('click', () => {
      const open = detailDiv.style.display !== 'none';
      detailDiv.style.display = open ? 'none' : 'block';
      toggle.textContent = open ? '▶' : '▼';
    });
    body.appendChild(panel);
  });

  card.appendChild(body);
  return card;
}
