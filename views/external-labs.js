/* ============================================================
   views/external-labs.js — External Lab Interface
   Simulated incoming lab feed from Quest, LabCorp, Hospital Lab.
   ============================================================ */

/* ---------- Data helpers ---------- */

function getExternalLabResults() {
  return loadAll(KEYS.externalLabResults);
}

function getExternalLabResult(id) {
  return getExternalLabResults().find(function(r) { return r.id === id; }) || null;
}

function saveExternalLabResult(data) {
  var all = loadAll(KEYS.externalLabResults, true);
  var idx = all.findIndex(function(r) { return r.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    if (!data.id) data.id = generateId();
    if (!data.receivedAt) data.receivedAt = new Date().toISOString();
    if (!data.status) data.status = 'Pending';
    all.push(data);
  }
  saveAll(KEYS.externalLabResults, all);
  return data;
}

function seedExternalLabResults() {
  if (loadAll(KEYS.externalLabResults).length > 0) return;
  var patients = getPatients();
  var p1 = patients[0], p2 = patients[1], p3 = patients[2];
  var now = new Date();

  var samples = [
    {
      id: generateId(), source: 'Quest Diagnostics', status: 'Pending',
      patientMatch: null,
      incomingName: 'Alice Johnson', incomingDOB: p1 ? p1.dob : '1968-04-15', incomingMRN: '',
      resultData: {
        panel: 'Comprehensive Metabolic Panel',
        collectionDate: new Date(now - 2 * 86400000).toISOString(),
        tests: [
          { name: 'Sodium', value: '141', unit: 'mEq/L', refRange: '136-145', flag: 'Normal' },
          { name: 'Potassium', value: '4.2', unit: 'mEq/L', refRange: '3.5-5.1', flag: 'Normal' },
          { name: 'Glucose', value: '118', unit: 'mg/dL', refRange: '70-99', flag: 'High' },
          { name: 'BUN', value: '18', unit: 'mg/dL', refRange: '7-20', flag: 'Normal' },
          { name: 'Creatinine', value: '0.9', unit: 'mg/dL', refRange: '0.6-1.2', flag: 'Normal' },
        ]
      },
      receivedAt: new Date(now - 2 * 86400000).toISOString(),
      orderingProvider: 'Dr. Sarah Chen',
    },
    {
      id: generateId(), source: 'LabCorp', status: 'Matched',
      patientMatch: p2 ? p2.id : null,
      incomingName: 'Robert Kim', incomingDOB: p2 ? p2.dob : '1955-11-30', incomingMRN: p2 ? p2.mrn : 'MRN001002',
      resultData: {
        panel: 'Lipid Panel',
        collectionDate: new Date(now - 86400000).toISOString(),
        tests: [
          { name: 'Total Cholesterol', value: '224', unit: 'mg/dL', refRange: '<200', flag: 'High' },
          { name: 'LDL', value: '148', unit: 'mg/dL', refRange: '<100', flag: 'High' },
          { name: 'HDL', value: '42', unit: 'mg/dL', refRange: '>40', flag: 'Normal' },
          { name: 'Triglycerides', value: '170', unit: 'mg/dL', refRange: '<150', flag: 'High' },
        ]
      },
      receivedAt: new Date(now - 86400000).toISOString(),
      orderingProvider: 'Dr. Sarah Chen',
    },
    {
      id: generateId(), source: 'Hospital Lab', status: 'Pending',
      patientMatch: null,
      incomingName: 'Jane Doe', incomingDOB: '1990-05-20', incomingMRN: '',
      resultData: {
        panel: 'CBC with Differential',
        collectionDate: new Date(now - 3 * 86400000).toISOString(),
        tests: [
          { name: 'WBC', value: '12.8', unit: 'K/uL', refRange: '4.5-11.0', flag: 'High' },
          { name: 'Hemoglobin', value: '13.2', unit: 'g/dL', refRange: '12.0-16.0', flag: 'Normal' },
          { name: 'Platelets', value: '245', unit: 'K/uL', refRange: '150-400', flag: 'Normal' },
          { name: 'Neutrophils', value: '78', unit: '%', refRange: '40-70', flag: 'High' },
        ]
      },
      receivedAt: new Date(now - 3 * 86400000).toISOString(),
      orderingProvider: 'Dr. Marcus Webb',
    },
    {
      id: generateId(), source: 'Quest Diagnostics', status: 'Filed',
      patientMatch: p1 ? p1.id : null,
      incomingName: 'Alice Johnson', incomingDOB: p1 ? p1.dob : '1968-04-15', incomingMRN: p1 ? p1.mrn : '',
      resultData: {
        panel: 'TSH',
        collectionDate: new Date(now - 7 * 86400000).toISOString(),
        tests: [
          { name: 'TSH', value: '2.4', unit: 'mIU/L', refRange: '0.4-4.0', flag: 'Normal' },
        ]
      },
      receivedAt: new Date(now - 7 * 86400000).toISOString(),
      filedAt: new Date(now - 6 * 86400000).toISOString(),
      filedBy: 'Dr. Sarah Chen',
      orderingProvider: 'Dr. Sarah Chen',
    },
    {
      id: generateId(), source: 'LabCorp', status: 'Pending',
      patientMatch: null,
      incomingName: 'Maria Garcia', incomingDOB: p3 ? p3.dob : '1982-07-22', incomingMRN: '',
      resultData: {
        panel: 'Urinalysis',
        collectionDate: new Date(now - 4 * 86400000).toISOString(),
        tests: [
          { name: 'Color', value: 'Yellow', unit: '', refRange: 'Yellow', flag: 'Normal' },
          { name: 'Clarity', value: 'Clear', unit: '', refRange: 'Clear', flag: 'Normal' },
          { name: 'Protein', value: 'Trace', unit: '', refRange: 'Negative', flag: 'Abnormal' },
          { name: 'Glucose', value: 'Negative', unit: '', refRange: 'Negative', flag: 'Normal' },
          { name: 'WBC', value: '0-2', unit: '/HPF', refRange: '0-5', flag: 'Normal' },
        ]
      },
      receivedAt: new Date(now - 4 * 86400000).toISOString(),
      orderingProvider: 'Dr. Marcus Webb',
    },
    {
      id: generateId(), source: 'Hospital Lab', status: 'Matched',
      patientMatch: p3 ? p3.id : null,
      incomingName: 'Maria Garcia', incomingDOB: p3 ? p3.dob : '1982-07-22', incomingMRN: p3 ? p3.mrn : '',
      resultData: {
        panel: 'HbA1c',
        collectionDate: new Date(now - 1 * 86400000).toISOString(),
        tests: [
          { name: 'HbA1c', value: '5.8', unit: '%', refRange: '<5.7', flag: 'High' },
        ]
      },
      receivedAt: new Date(now - 1 * 86400000).toISOString(),
      orderingProvider: 'Dr. Sarah Chen',
    },
  ];

  samples.forEach(function(s) { saveExternalLabResult(s); });
}

/* ---------- Main render ---------- */

function renderExternalLabs() {
  seedExternalLabResults();
  var app = document.getElementById('app');

  setTopbar({ title: 'External Lab Interface', meta: 'Incoming Results Feed' });
  setActiveNav('external-labs');

  var results = getExternalLabResults();
  var statusFilter = 'all';
  var sourceFilter = 'all';

  function render() {
    app.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:24px;max-width:1200px;margin:0 auto;';

    // Summary cards
    var pending = results.filter(function(r) { return r.status === 'Pending'; }).length;
    var matched = results.filter(function(r) { return r.status === 'Matched'; }).length;
    var filed = results.filter(function(r) { return r.status === 'Filed'; }).length;
    var rejected = results.filter(function(r) { return r.status === 'Rejected'; }).length;

    var summaryHTML = '<div class="extlab-summary">' +
      '<div class="extlab-summary-card extlab-pending"><div class="extlab-summary-num">' + pending + '</div><div class="extlab-summary-label">Pending</div></div>' +
      '<div class="extlab-summary-card extlab-matched"><div class="extlab-summary-num">' + matched + '</div><div class="extlab-summary-label">Matched</div></div>' +
      '<div class="extlab-summary-card extlab-filed"><div class="extlab-summary-num">' + filed + '</div><div class="extlab-summary-label">Filed</div></div>' +
      '<div class="extlab-summary-card extlab-rejected"><div class="extlab-summary-num">' + rejected + '</div><div class="extlab-summary-label">Rejected</div></div>' +
      '</div>';
    wrap.innerHTML = summaryHTML;

    // Filters
    var filterBar = document.createElement('div');
    filterBar.className = 'extlab-filter-bar';

    var statusSel = document.createElement('select');
    statusSel.className = 'form-control';
    statusSel.innerHTML = '<option value="all">All Statuses</option><option value="Pending">Pending</option><option value="Matched">Matched</option><option value="Filed">Filed</option><option value="Rejected">Rejected</option>';
    statusSel.value = statusFilter;
    statusSel.addEventListener('change', function() { statusFilter = statusSel.value; render(); });

    var sourceSel = document.createElement('select');
    sourceSel.className = 'form-control';
    var sources = [];
    results.forEach(function(r) { if (sources.indexOf(r.source) < 0) sources.push(r.source); });
    sourceSel.innerHTML = '<option value="all">All Sources</option>' + sources.map(function(s) {
      return '<option value="' + esc(s) + '">' + esc(s) + '</option>';
    }).join('');
    sourceSel.value = sourceFilter;
    sourceSel.addEventListener('change', function() { sourceFilter = sourceSel.value; render(); });

    filterBar.appendChild(statusSel);
    filterBar.appendChild(sourceSel);
    wrap.appendChild(filterBar);

    // Results table
    var filtered = results.filter(function(r) {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      return true;
    }).sort(function(a, b) { return new Date(b.receivedAt) - new Date(a.receivedAt); });

    if (filtered.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'extlab-empty';
      empty.textContent = 'No results match the current filters.';
      wrap.appendChild(empty);
    } else {
      var table = document.createElement('table');
      table.className = 'extlab-table';
      table.innerHTML = '<thead><tr>' +
        '<th>Received</th><th>Source</th><th>Patient</th><th>Panel</th><th>Status</th><th>Actions</th>' +
        '</tr></thead>';
      var tbody = document.createElement('tbody');

      filtered.forEach(function(r) {
        var tr = document.createElement('tr');
        var d = new Date(r.receivedAt);
        var dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        var statusClass = 'extlab-status-' + r.status.toLowerCase();
        var matchedPat = r.patientMatch ? getPatient(r.patientMatch) : null;
        var patName = matchedPat ? esc(matchedPat.lastName + ', ' + matchedPat.firstName) : esc(r.incomingName || 'Unknown');

        tr.innerHTML =
          '<td>' + esc(dateStr) + '</td>' +
          '<td><span class="extlab-source-badge">' + esc(r.source) + '</span></td>' +
          '<td>' + patName + (r.status === 'Pending' && !r.patientMatch ? ' <span class="extlab-unmatched-badge">Unmatched</span>' : '') + '</td>' +
          '<td>' + esc(r.resultData.panel) + '</td>' +
          '<td><span class="extlab-status-badge ' + statusClass + '">' + esc(r.status) + '</span></td>' +
          '<td class="extlab-actions-cell"></td>';

        var actionsCell = tr.querySelector('.extlab-actions-cell');

        // View button
        var viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-secondary btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', function() { openLabDetailModal(r); });
        actionsCell.appendChild(viewBtn);

        if (r.status === 'Pending') {
          var matchBtn = document.createElement('button');
          matchBtn.className = 'btn btn-primary btn-sm';
          matchBtn.textContent = 'Match';
          matchBtn.addEventListener('click', function() { openPatientMatchModal(r); });
          actionsCell.appendChild(matchBtn);
        }

        if (r.status === 'Matched') {
          var fileBtn = document.createElement('button');
          fileBtn.className = 'btn btn-success btn-sm';
          fileBtn.textContent = 'File';
          fileBtn.addEventListener('click', function() { fileExternalLabResult(r); });
          actionsCell.appendChild(fileBtn);

          var rejectBtn = document.createElement('button');
          rejectBtn.className = 'btn btn-danger btn-sm';
          rejectBtn.textContent = 'Reject';
          rejectBtn.addEventListener('click', function() {
            r.status = 'Rejected';
            r.rejectedAt = new Date().toISOString();
            saveExternalLabResult(r);
            results = getExternalLabResults();
            render();
            showToast('Result rejected', 'warning');
          });
          actionsCell.appendChild(rejectBtn);
        }

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      wrap.appendChild(table);
    }

    app.appendChild(wrap);
  }

  function openLabDetailModal(r) {
    var tests = r.resultData.tests || [];
    var testsHTML = '<table class="extlab-detail-table"><thead><tr><th>Test</th><th>Value</th><th>Units</th><th>Ref Range</th><th>Flag</th></tr></thead><tbody>';
    tests.forEach(function(t) {
      var flagClass = t.flag === 'High' || t.flag === 'Low' || t.flag === 'Abnormal' ? ' extlab-flag-abnormal' : '';
      testsHTML += '<tr><td>' + esc(t.name) + '</td><td>' + esc(t.value) + '</td><td>' + esc(t.unit) + '</td><td>' + esc(t.refRange) + '</td><td class="' + flagClass + '">' + esc(t.flag) + '</td></tr>';
    });
    testsHTML += '</tbody></table>';

    var matchedPat = r.patientMatch ? getPatient(r.patientMatch) : null;

    var bodyHTML =
      '<div class="extlab-detail-grid">' +
      '<div><strong>Source:</strong> ' + esc(r.source) + '</div>' +
      '<div><strong>Panel:</strong> ' + esc(r.resultData.panel) + '</div>' +
      '<div><strong>Patient Name:</strong> ' + esc(r.incomingName) + '</div>' +
      '<div><strong>DOB:</strong> ' + esc(r.incomingDOB) + '</div>' +
      '<div><strong>MRN:</strong> ' + esc(r.incomingMRN || 'N/A') + '</div>' +
      '<div><strong>Ordering Provider:</strong> ' + esc(r.orderingProvider || 'N/A') + '</div>' +
      '<div><strong>Collection Date:</strong> ' + esc(r.resultData.collectionDate ? new Date(r.resultData.collectionDate).toLocaleDateString() : 'N/A') + '</div>' +
      '<div><strong>Status:</strong> ' + esc(r.status) + '</div>' +
      (matchedPat ? '<div><strong>Matched To:</strong> ' + esc(matchedPat.lastName + ', ' + matchedPat.firstName) + ' (' + esc(matchedPat.mrn) + ')</div>' : '') +
      '</div>' +
      '<h4 style="margin:16px 0 8px;">Results</h4>' +
      testsHTML;

    openModal({
      title: 'Lab Result Detail — ' + esc(r.resultData.panel),
      bodyHTML: bodyHTML,
      footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
      size: 'lg',
    });
  }

  function openPatientMatchModal(r) {
    var patients = getPatients();
    var suggestions = [];

    // Auto-suggest based on name/DOB match
    patients.forEach(function(p) {
      var score = 0;
      var inName = (r.incomingName || '').toLowerCase();
      var pName = (p.firstName + ' ' + p.lastName).toLowerCase();
      if (inName === pName) score += 3;
      else if (pName.indexOf(inName.split(' ')[0]) >= 0) score += 1;
      if (r.incomingDOB && p.dob === r.incomingDOB) score += 3;
      if (r.incomingMRN && p.mrn === r.incomingMRN) score += 5;
      if (score > 0) suggestions.push({ patient: p, score: score });
    });
    suggestions.sort(function(a, b) { return b.score - a.score; });

    var bodyHTML =
      '<div class="extlab-match-incoming">' +
      '<h4>Incoming Result</h4>' +
      '<div><strong>Name:</strong> ' + esc(r.incomingName) + '</div>' +
      '<div><strong>DOB:</strong> ' + esc(r.incomingDOB) + '</div>' +
      '<div><strong>MRN:</strong> ' + esc(r.incomingMRN || 'N/A') + '</div>' +
      '<div><strong>Panel:</strong> ' + esc(r.resultData.panel) + '</div>' +
      '</div>' +
      '<h4 style="margin:16px 0 8px;">Suggested Matches</h4>';

    if (suggestions.length === 0) {
      bodyHTML += '<p style="color:var(--text-muted);">No matching patients found. Search below.</p>';
    } else {
      bodyHTML += '<div id="extlab-match-suggestions"></div>';
    }

    bodyHTML += '<h4 style="margin:16px 0 8px;">Search All Patients</h4>' +
      '<input type="text" id="extlab-match-search" class="form-control" placeholder="Search by name, MRN, or DOB..." />' +
      '<div id="extlab-match-search-results"></div>';

    openModal({
      title: 'Patient Matching — ' + esc(r.incomingName),
      bodyHTML: bodyHTML,
      footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>',
      size: 'lg',
    });

    // Render suggestions
    if (suggestions.length > 0) {
      var sugDiv = document.getElementById('extlab-match-suggestions');
      suggestions.slice(0, 5).forEach(function(s) {
        var row = document.createElement('div');
        row.className = 'extlab-match-row';
        row.innerHTML =
          '<div class="extlab-match-info">' +
          '<strong>' + esc(s.patient.lastName + ', ' + s.patient.firstName) + '</strong>' +
          ' &middot; MRN: ' + esc(s.patient.mrn) + ' &middot; DOB: ' + esc(s.patient.dob) +
          ' <span class="extlab-match-score">Score: ' + s.score + '</span>' +
          '</div>';
        var btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-sm';
        btn.textContent = 'Select';
        btn.addEventListener('click', function() {
          r.patientMatch = s.patient.id;
          r.status = 'Matched';
          r.matchedAt = new Date().toISOString();
          saveExternalLabResult(r);
          results = getExternalLabResults();
          closeModal();
          render();
          showToast('Result matched to ' + s.patient.lastName + ', ' + s.patient.firstName, 'success');
        });
        row.appendChild(btn);
        sugDiv.appendChild(row);
      });
    }

    // Search
    var searchInput = document.getElementById('extlab-match-search');
    var searchResults = document.getElementById('extlab-match-search-results');
    searchInput.addEventListener('input', function() {
      var q = searchInput.value.trim().toLowerCase();
      searchResults.innerHTML = '';
      if (!q || q.length < 2) return;
      var matches = patients.filter(function(p) {
        var fullName = (p.firstName + ' ' + p.lastName).toLowerCase();
        return fullName.indexOf(q) >= 0 || (p.mrn || '').toLowerCase().indexOf(q) >= 0 || (p.dob || '').indexOf(q) >= 0;
      }).slice(0, 10);

      matches.forEach(function(p) {
        var row = document.createElement('div');
        row.className = 'extlab-match-row';
        row.innerHTML =
          '<div class="extlab-match-info">' +
          '<strong>' + esc(p.lastName + ', ' + p.firstName) + '</strong>' +
          ' &middot; MRN: ' + esc(p.mrn) + ' &middot; DOB: ' + esc(p.dob) +
          '</div>';
        var btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-sm';
        btn.textContent = 'Select';
        btn.addEventListener('click', function() {
          r.patientMatch = p.id;
          r.status = 'Matched';
          r.matchedAt = new Date().toISOString();
          saveExternalLabResult(r);
          results = getExternalLabResults();
          closeModal();
          render();
          showToast('Result matched to ' + p.lastName + ', ' + p.firstName, 'success');
        });
        row.appendChild(btn);
        searchResults.appendChild(row);
      });
    });
  }

  function fileExternalLabResult(r) {
    if (!r.patientMatch) {
      showToast('No patient matched. Match first.', 'error');
      return;
    }
    // Save as lab result in the patient's chart
    saveLabResult({
      patientId: r.patientMatch,
      panel: r.resultData.panel,
      resultDate: r.resultData.collectionDate || r.receivedAt,
      resultedBy: r.source,
      tests: r.resultData.tests.map(function(t) {
        return { name: t.name, value: t.value, unit: t.unit, referenceRange: t.refRange, flag: t.flag };
      }),
      notes: 'Filed from external source: ' + r.source,
    });

    r.status = 'Filed';
    r.filedAt = new Date().toISOString();
    r.filedBy = getSessionUser() ? getSessionUser().firstName + ' ' + getSessionUser().lastName : 'System';
    saveExternalLabResult(r);
    results = getExternalLabResults();
    render();

    // Notify ordering provider
    var pat = getPatient(r.patientMatch);
    showToast('Result filed to ' + (pat ? pat.lastName + ', ' + pat.firstName : 'patient') + "'s chart. Provider notified.", 'success');
  }

  render();
}
