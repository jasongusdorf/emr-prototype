/* ============================================================
   views/mar.js — Medication Administration Record
   ============================================================ */

function _injectMARCSS() {
  if (document.getElementById('mar-styles')) return;
  var s = document.createElement('style');
  s.id = 'mar-styles';
  s.textContent = [
    '.mar-wrap { padding:24px; max-width:1200px; margin:0 auto; }',
    '.mar-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.mar-patient-select { padding:8px 12px; border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); font-size:14px; min-width:250px; }',
    '.mar-grid { width:100%; border-collapse:collapse; font-size:13px; }',
    '.mar-grid th, .mar-grid td { border:1px solid var(--border,#ddd); padding:6px 8px; text-align:center; }',
    '.mar-grid th { background:var(--bg-card,#f8f9fa); font-weight:600; position:sticky; top:0; }',
    '.mar-grid .mar-med-name { text-align:left; font-weight:500; min-width:200px; }',
    '.mar-cell { cursor:pointer; min-width:60px; height:36px; border-radius:4px; }',
    '.mar-cell:hover { opacity:0.8; }',
    '.mar-given { background:var(--badge-success-bg); color:var(--badge-success-text); }',
    '.mar-held { background:var(--badge-warning-bg); color:var(--badge-warning-text); }',
    '.mar-refused { background:var(--badge-danger-bg); color:var(--badge-danger-text); }',
    '.mar-not-due { background:var(--badge-neutral-bg); color:var(--badge-neutral-text); }',
    '.mar-prn-section { margin-top:24px; }',
    '.mar-prn-section h3 { margin-bottom:12px; color:var(--text-primary,#1a1a2e); }',
    '.mar-prn-btn { padding:4px 10px; font-size:12px; border:none; border-radius:4px; cursor:pointer; background:var(--primary,#2563eb); color:#fff; }',
    '.mar-legend { display:flex; gap:16px; margin-bottom:16px; font-size:13px; }',
    '.mar-legend-item { display:flex; align-items:center; gap:4px; }',
    '.mar-legend-swatch { width:16px; height:16px; border-radius:3px; }',
    '.mar-date-nav { display:flex; align-items:center; gap:12px; margin-bottom:16px; }',
    '.mar-date-nav button { padding:6px 14px; border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); background:var(--bg-card,#fff); cursor:pointer; font-size:14px; }',
    '.mar-date-nav button:hover { background:var(--primary,#2563eb); color:#fff; }',
    '.mar-date-display { font-size:18px; font-weight:600; color:var(--text-primary,#1a1a2e); min-width:160px; text-align:center; }',
    '.mar-rx-badge { display:inline-block; background:var(--success); color:#fff; font-size:10px; font-weight:700; padding:1px 5px; border-radius:8px; margin-left:6px; vertical-align:middle; }',
    '.mar-5rights-check { display:flex; align-items:flex-start; gap:8px; margin-top:12px; padding:10px; background:#fff3cd; border-radius:6px; font-size:13px; }',
    '.mar-5rights-check input[type="checkbox"] { margin-top:2px; }',
    '.mar-admin-info { background:var(--bg-main,#f8f9fa); border-radius:6px; padding:12px; margin-bottom:12px; }',
    '.mar-admin-info .mar-admin-field { margin-bottom:6px; font-size:14px; }',
    '.mar-admin-info .mar-admin-field strong { color:var(--text-primary,#1a1a2e); }'
  ].join('\n');
  document.head.appendChild(s);
}

var MAR_FREQ_HOURS = {
  'Daily': [8], 'BID': [8,20], 'TID': [8,14,20], 'QID': [8,12,16,20],
  'Q4H': [0,4,8,12,16,20], 'Q6H': [0,6,12,18], 'Q8H': [0,8,16],
  'Q12H': [8,20], 'QHS': [21], 'QAM': [8]
};

var _marDate = new Date().toISOString().slice(0,10);

function renderMAR() {
  _injectMARCSS();
  var app = document.getElementById('app');
  var patients = getPatients();
  var selPatient = patients[0] ? patients[0].id : null;

  function build(pid) {
    var pat = patients.find(function(p) { return p.id === pid; });
    var meds = loadAll(KEYS.patientMeds).filter(function(m) { return m.patientId === pid && m.status === 'Active'; });
    var entries = getMAREntries(pid);
    var hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

    // Look up orders for pharmacy verification badges
    var allOrders = (typeof getOrders === 'function') ? getOrders() : [];

    var html = '<div class="mar-wrap">';
    html += '<div class="mar-header"><h2>Medication Administration Record</h2>';
    html += '<select class="mar-patient-select" id="mar-pt-sel">';
    patients.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + ' (MRN: ' + esc(p.mrn || '') + ')</option>';
    });
    html += '</select></div>';

    // 3b: Date navigation
    var dateObj = new Date(_marDate + 'T12:00:00');
    var dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    html += '<div class="mar-date-nav">';
    html += '<button id="mar-prev-day">&larr; Prev Day</button>';
    html += '<div class="mar-date-display">' + esc(dateDisplay) + '</div>';
    html += '<button id="mar-next-day">Next Day &rarr;</button>';
    html += '<button id="mar-today-btn" style="margin-left:8px;font-weight:600">Today</button>';
    html += '</div>';

    html += '<div class="mar-legend">';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-given"></div> Given</div>';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-held"></div> Held</div>';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-refused"></div> Refused</div>';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-not-due"></div> Not Due</div>';
    html += '</div>';

    var scheduled = meds.filter(function(m) { return m.frequency !== 'PRN'; });
    var prns = meds.filter(function(m) { return m.frequency === 'PRN'; });

    html += '<div style="overflow-x:auto"><table class="mar-grid" role="grid"><thead><tr><th scope="col" class="mar-med-name">Medication</th><th scope="col">Freq</th>';
    hours.forEach(function(h) { html += '<th scope="col">' + String(h).padStart(2,'0') + ':00</th>'; });
    html += '</tr></thead><tbody>';

    scheduled.forEach(function(med) {
      var freq = med.frequency || 'Daily';
      var schedHours = MAR_FREQ_HOURS[freq] || [8];
      // 3e: Pharmacy verification badge
      var rxBadge = '';
      var matchingOrder = allOrders.find(function(o) { return o.medId === med.id && o.pharmacyVerified === true; });
      if (matchingOrder) rxBadge = ' <span class="mar-rx-badge">Rx &#10003;</span>';
      html += '<tr><td class="mar-med-name">' + esc(med.name || med.drug || 'Unknown') + ' ' + esc(med.dose || '') + rxBadge + '</td>';
      html += '<td>' + esc(freq) + '</td>';
      var medDisplayName = med.name || med.drug || 'Unknown';
      hours.forEach(function(h) {
        var isDue = schedHours.indexOf(h) >= 0;
        var entry = entries.find(function(e) { return e.medId === med.id && e.hour === h && e.date === _marDate; });
        var cls = 'mar-cell ';
        var label = '';
        if (entry) {
          cls += entry.status === 'given' ? 'mar-given' : entry.status === 'held' ? 'mar-held' : 'mar-refused';
          label = entry.status === 'given' ? 'G' : entry.status === 'held' ? 'H' : 'R';
        } else if (isDue) {
          cls += 'mar-not-due';
          label = '\u2014';
        }
        var ariaLabel = esc(medDisplayName) + ' at ' + String(h).padStart(2,'0') + ':00';
        html += '<td class="' + cls + '" data-med="' + med.id + '" data-hour="' + h + '" tabindex="0" role="button" aria-label="Administer ' + ariaLabel + '">' + label + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    if (prns.length) {
      html += '<div class="mar-prn-section"><h3>PRN Medications</h3><table class="mar-grid"><thead><tr><th scope="col" class="mar-med-name">Medication</th><th scope="col">Indication</th><th scope="col">Last Given</th><th scope="col">Action</th></tr></thead><tbody>';
      prns.forEach(function(med) {
        var lastEntry = entries.filter(function(e) { return e.medId === med.id && e.status === 'given'; }).sort(function(a,b) { return b.recordedAt > a.recordedAt ? 1 : -1; })[0];
        // 3e: Pharmacy verification badge for PRN
        var rxBadge = '';
        var matchingOrder = allOrders.find(function(o) { return o.medId === med.id && o.pharmacyVerified === true; });
        if (matchingOrder) rxBadge = ' <span class="mar-rx-badge">Rx &#10003;</span>';
        html += '<tr><td class="mar-med-name">' + esc(med.name || med.drug || 'Unknown') + ' ' + esc(med.dose || '') + rxBadge + '</td>';
        html += '<td>' + esc(med.indication || 'As needed') + '</td>';
        html += '<td>' + (lastEntry ? formatDateTime(lastEntry.recordedAt) : 'Never') + '</td>';
        html += '<td><button class="mar-prn-btn" data-med="' + med.id + '">Administer</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }

    html += '</div>';
    app.innerHTML = html;

    // Wire events
    document.getElementById('mar-pt-sel').addEventListener('change', function() { build(this.value); });

    // 3b: Date navigation events
    document.getElementById('mar-prev-day').addEventListener('click', function() {
      var d = new Date(_marDate + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      _marDate = d.toISOString().slice(0,10);
      build(pid);
    });
    document.getElementById('mar-next-day').addEventListener('click', function() {
      var d = new Date(_marDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      _marDate = d.toISOString().slice(0,10);
      build(pid);
    });
    document.getElementById('mar-today-btn').addEventListener('click', function() {
      _marDate = new Date().toISOString().slice(0,10);
      build(pid);
    });

    // 3c: Scheduled medication administration with 5 Rights verification
    app.querySelectorAll('.mar-cell[data-med]').forEach(function(cell) {
      cell.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cell.click();
        }
      });
      cell.addEventListener('click', function() {
        var medId = this.getAttribute('data-med');
        var hour = parseInt(this.getAttribute('data-hour'));
        var med = meds.find(function(m) { return m.id === medId; });
        var medName = med ? (med.name || med.drug || 'Unknown') : 'Unknown';
        var medDose = med ? (med.dose || '') : '';
        var medRoute = med ? (med.route || 'PO') : 'PO';

        var bodyHTML = '';
        // Patient info header
        bodyHTML += '<div class="mar-admin-info">';
        bodyHTML += '<div class="mar-admin-field"><strong>Patient:</strong> ' + esc(pat ? (pat.lastName + ', ' + pat.firstName) : 'Unknown') + '</div>';
        bodyHTML += '<div class="mar-admin-field"><strong>MRN:</strong> ' + esc(pat ? (pat.mrn || 'N/A') : 'N/A') + '</div>';
        bodyHTML += '<div class="mar-admin-field"><strong>DOB:</strong> ' + esc(pat ? (pat.dob || 'N/A') : 'N/A') + '</div>';
        bodyHTML += '</div>';

        // Medication info prominently displayed
        bodyHTML += '<div class="mar-admin-info" style="background:var(--badge-info-bg);border:1px solid var(--badge-info-border)">';
        bodyHTML += '<div class="mar-admin-field" style="font-size:16px"><strong>Medication:</strong> ' + esc(medName) + '</div>';
        bodyHTML += '<div class="mar-admin-field" style="font-size:16px"><strong>Dose:</strong> ' + esc(medDose) + '</div>';
        bodyHTML += '<div class="mar-admin-field" style="font-size:16px"><strong>Route:</strong> ' + esc(medRoute) + '</div>';
        bodyHTML += '<div class="mar-admin-field"><strong>Scheduled:</strong> ' + String(hour).padStart(2,'0') + ':00</div>';
        bodyHTML += '</div>';

        bodyHTML += '<div style="display:flex;flex-direction:column;gap:12px">';
        bodyHTML += '<label for="mar-status">Status:</label><select id="mar-status" class="form-control"><option value="given">Given</option><option value="held">Held</option><option value="refused">Refused</option></select>';
        bodyHTML += '<label for="mar-notes">Notes:</label><input id="mar-notes" class="form-control" placeholder="Optional notes">';
        bodyHTML += '</div>';

        // 5 Rights verification checkbox
        bodyHTML += '<div class="mar-5rights-check">';
        bodyHTML += '<input type="checkbox" id="mar-5rights-cb">';
        bodyHTML += '<label for="mar-5rights-cb">I verify correct <strong>patient</strong>, <strong>medication</strong>, <strong>dose</strong>, <strong>route</strong>, <strong>time</strong></label>';
        bodyHTML += '</div>';

        openModal({
          title: 'Record Administration \u2014 ' + esc(medName),
          bodyHTML: bodyHTML,
          footerHTML: '<button class="btn btn-primary" id="mar-save-btn" disabled>Save</button>'
        });

        // Enable save only when 5 Rights checked
        document.getElementById('mar-5rights-cb').addEventListener('change', function() {
          document.getElementById('mar-save-btn').disabled = !this.checked;
        });

        document.getElementById('mar-save-btn').addEventListener('click', function() {
          saveMAREntry({ patientId: pid, medId: medId, hour: hour, date: _marDate, status: document.getElementById('mar-status').value, notes: document.getElementById('mar-notes').value, recordedAt: new Date().toISOString(), nurse: getSessionUser().id });
          closeAllModals();
          showToast('Administration recorded', 'success');
          build(pid);
        });
      });
    });

    // 3d: PRN administration with full modal
    app.querySelectorAll('.mar-prn-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var medId = this.getAttribute('data-med');
        var med = meds.find(function(m) { return m.id === medId; });
        var medName = med ? (med.name || med.drug || 'Unknown') : 'Unknown';
        var medDose = med ? (med.dose || '') : '';
        var medRoute = med ? (med.route || 'PO') : 'PO';

        var bodyHTML = '';
        // Patient info header
        bodyHTML += '<div class="mar-admin-info">';
        bodyHTML += '<div class="mar-admin-field"><strong>Patient:</strong> ' + esc(pat ? (pat.lastName + ', ' + pat.firstName) : 'Unknown') + '</div>';
        bodyHTML += '<div class="mar-admin-field"><strong>MRN:</strong> ' + esc(pat ? (pat.mrn || 'N/A') : 'N/A') + '</div>';
        bodyHTML += '<div class="mar-admin-field"><strong>DOB:</strong> ' + esc(pat ? (pat.dob || 'N/A') : 'N/A') + '</div>';
        bodyHTML += '</div>';

        // Medication info
        bodyHTML += '<div class="mar-admin-info" style="background:var(--badge-info-bg);border:1px solid var(--badge-info-border)">';
        bodyHTML += '<div class="mar-admin-field" style="font-size:16px"><strong>Medication:</strong> ' + esc(medName) + '</div>';
        bodyHTML += '<div class="mar-admin-field" style="font-size:16px"><strong>Dose:</strong> ' + esc(medDose) + '</div>';
        bodyHTML += '<div class="mar-admin-field" style="font-size:16px"><strong>Route:</strong> ' + esc(medRoute) + '</div>';
        bodyHTML += '</div>';

        bodyHTML += '<div style="display:flex;flex-direction:column;gap:12px">';

        // Pain score
        bodyHTML += '<label for="mar-prn-pain">Pain Score (0-10):</label><select id="mar-prn-pain" class="form-control">';
        for (var ps = 0; ps <= 10; ps++) { bodyHTML += '<option value="' + ps + '">' + ps + '</option>'; }
        bodyHTML += '</select>';

        // Indication
        bodyHTML += '<label for="mar-prn-indication">Indication:</label><input id="mar-prn-indication" class="form-control" placeholder="Reason for PRN administration" value="' + esc(med ? (med.indication || '') : '') + '">';

        // Dose given (allow range if applicable)
        bodyHTML += '<label for="mar-prn-dose">Dose Given:</label><input id="mar-prn-dose" class="form-control" value="' + esc(medDose) + '" placeholder="e.g. 5mg">';

        // Reassessment timer
        bodyHTML += '<label for="mar-prn-reassess">Reassessment Timer:</label><select id="mar-prn-reassess" class="form-control">';
        bodyHTML += '<option value="15">15 minutes</option>';
        bodyHTML += '<option value="30" selected>30 minutes</option>';
        bodyHTML += '<option value="60">60 minutes</option>';
        bodyHTML += '</select>';

        // Notes
        bodyHTML += '<label for="mar-prn-notes">Notes:</label><input id="mar-prn-notes" class="form-control" placeholder="Optional notes">';

        bodyHTML += '</div>';

        // 5 Rights verification checkbox
        bodyHTML += '<div class="mar-5rights-check">';
        bodyHTML += '<input type="checkbox" id="mar-prn-5rights-cb">';
        bodyHTML += '<label for="mar-prn-5rights-cb">I verify correct <strong>patient</strong>, <strong>medication</strong>, <strong>dose</strong>, <strong>route</strong>, <strong>time</strong></label>';
        bodyHTML += '</div>';

        openModal({
          title: 'PRN Administration \u2014 ' + esc(medName),
          bodyHTML: bodyHTML,
          footerHTML: '<button class="btn btn-primary" id="mar-prn-save-btn" disabled>Save</button>'
        });

        // Enable save only when 5 Rights checked
        document.getElementById('mar-prn-5rights-cb').addEventListener('change', function() {
          document.getElementById('mar-prn-save-btn').disabled = !this.checked;
        });

        document.getElementById('mar-prn-save-btn').addEventListener('click', function() {
          var now = new Date();
          var reassessMin = parseInt(document.getElementById('mar-prn-reassess').value);
          var reassessAt = new Date(now.getTime() + reassessMin * 60000).toISOString();
          saveMAREntry({
            patientId: pid,
            medId: medId,
            hour: now.getHours(),
            date: _marDate,
            status: 'given',
            painScore: parseInt(document.getElementById('mar-prn-pain').value),
            indication: document.getElementById('mar-prn-indication').value,
            doseGiven: document.getElementById('mar-prn-dose').value,
            reassessmentDue: reassessAt,
            reassessmentMinutes: reassessMin,
            notes: document.getElementById('mar-prn-notes').value,
            recordedAt: now.toISOString(),
            nurse: getSessionUser().id,
            isPRN: true
          });
          closeAllModals();
          showToast('PRN administered \u2014 reassess in ' + reassessMin + ' min', 'success');
          build(pid);
        });
      });
    });
  }

  if (selPatient) build(selPatient);
  else { app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>'; }
}
