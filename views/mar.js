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
    '.mar-given { background:#d4edda; color:#155724; }',
    '.mar-held { background:#fff3cd; color:#856404; }',
    '.mar-refused { background:#f8d7da; color:#721c24; }',
    '.mar-not-due { background:#e9ecef; color:#6c757d; }',
    '.mar-prn-section { margin-top:24px; }',
    '.mar-prn-section h3 { margin-bottom:12px; color:var(--text-primary,#1a1a2e); }',
    '.mar-prn-btn { padding:4px 10px; font-size:12px; border:none; border-radius:4px; cursor:pointer; background:var(--primary,#2563eb); color:#fff; }',
    '.mar-legend { display:flex; gap:16px; margin-bottom:16px; font-size:13px; }',
    '.mar-legend-item { display:flex; align-items:center; gap:4px; }',
    '.mar-legend-swatch { width:16px; height:16px; border-radius:3px; }'
  ].join('\n');
  document.head.appendChild(s);
}

var MAR_FREQ_HOURS = {
  'Daily': [8], 'BID': [8,20], 'TID': [8,14,20], 'QID': [8,12,16,20],
  'Q4H': [0,4,8,12,16,20], 'Q6H': [0,6,12,18], 'Q8H': [0,8,16],
  'Q12H': [8,20], 'QHS': [21], 'QAM': [8]
};

function renderMAR() {
  _injectMARCSS();
  var app = document.getElementById('app');
  var patients = getPatients();
  var selPatient = patients[0] ? patients[0].id : null;

  function build(pid) {
    var pat = patients.find(function(p) { return p.id === pid; });
    var meds = loadAll(KEYS.patientMeds).filter(function(m) { return m.patientId === pid && m.status === 'Active'; });
    var entries = getMAREntries(pid);
    var today = new Date().toISOString().slice(0,10);
    var hours = [0,2,4,6,8,10,12,14,16,18,20,22];

    var html = '<div class="mar-wrap">';
    html += '<div class="mar-header"><h2>Medication Administration Record</h2>';
    html += '<select class="mar-patient-select" id="mar-pt-sel">';
    patients.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + ' (MRN: ' + esc(p.mrn || '') + ')</option>';
    });
    html += '</select></div>';

    html += '<div class="mar-legend">';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-given"></div> Given</div>';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-held"></div> Held</div>';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-refused"></div> Refused</div>';
    html += '<div class="mar-legend-item"><div class="mar-legend-swatch mar-not-due"></div> Not Due</div>';
    html += '</div>';

    var scheduled = meds.filter(function(m) { return m.frequency !== 'PRN'; });
    var prns = meds.filter(function(m) { return m.frequency === 'PRN'; });

    html += '<div style="overflow-x:auto"><table class="mar-grid"><thead><tr><th class="mar-med-name">Medication</th><th>Freq</th>';
    hours.forEach(function(h) { html += '<th>' + String(h).padStart(2,'0') + ':00</th>'; });
    html += '</tr></thead><tbody>';

    scheduled.forEach(function(med) {
      var freq = med.frequency || 'Daily';
      var schedHours = MAR_FREQ_HOURS[freq] || [8];
      html += '<tr><td class="mar-med-name">' + esc(med.name || med.drug || 'Unknown') + ' ' + esc(med.dose || '') + '</td>';
      html += '<td>' + esc(freq) + '</td>';
      hours.forEach(function(h) {
        var isDue = schedHours.indexOf(h) >= 0;
        var entry = entries.find(function(e) { return e.medId === med.id && e.hour === h && e.date === today; });
        var cls = 'mar-cell ';
        var label = '';
        if (entry) {
          cls += entry.status === 'given' ? 'mar-given' : entry.status === 'held' ? 'mar-held' : 'mar-refused';
          label = entry.status === 'given' ? 'G' : entry.status === 'held' ? 'H' : 'R';
        } else if (isDue) {
          cls += 'mar-not-due';
          label = '—';
        }
        html += '<td class="' + cls + '" data-med="' + med.id + '" data-hour="' + h + '">' + label + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    if (prns.length) {
      html += '<div class="mar-prn-section"><h3>PRN Medications</h3><table class="mar-grid"><thead><tr><th class="mar-med-name">Medication</th><th>Indication</th><th>Last Given</th><th>Action</th></tr></thead><tbody>';
      prns.forEach(function(med) {
        var lastEntry = entries.filter(function(e) { return e.medId === med.id && e.status === 'given'; }).sort(function(a,b) { return b.recordedAt > a.recordedAt ? 1 : -1; })[0];
        html += '<tr><td class="mar-med-name">' + esc(med.name || med.drug || 'Unknown') + ' ' + esc(med.dose || '') + '</td>';
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

    app.querySelectorAll('.mar-cell[data-med]').forEach(function(cell) {
      cell.addEventListener('click', function() {
        var medId = this.getAttribute('data-med');
        var hour = parseInt(this.getAttribute('data-hour'));
        var med = meds.find(function(m) { return m.id === medId; });
        openModal({
          title: 'Record Administration — ' + esc(med ? (med.name || med.drug) : 'Med'),
          bodyHTML: '<div style="display:flex;flex-direction:column;gap:12px">' +
            '<label>Status:<select id="mar-status" class="form-control"><option value="given">Given</option><option value="held">Held</option><option value="refused">Refused</option></select></label>' +
            '<label>Notes:<input id="mar-notes" class="form-control" placeholder="Optional notes"></label></div>',
          footerHTML: '<button class="btn btn-primary" id="mar-save-btn">Save</button>'
        });
        document.getElementById('mar-save-btn').addEventListener('click', function() {
          saveMAREntry({ patientId: pid, medId: medId, hour: hour, date: today, status: document.getElementById('mar-status').value, notes: document.getElementById('mar-notes').value, recordedAt: new Date().toISOString(), nurse: getSessionUser().id });
          closeAllModals();
          showToast('Administration recorded', 'success');
          build(pid);
        });
      });
    });

    app.querySelectorAll('.mar-prn-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var medId = this.getAttribute('data-med');
        var now = new Date();
        saveMAREntry({ patientId: pid, medId: medId, hour: now.getHours(), date: today, status: 'given', recordedAt: now.toISOString(), nurse: getSessionUser().id });
        showToast('PRN administered', 'success');
        build(pid);
      });
    });
  }

  if (selPatient) build(selPatient);
  else { app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>'; }
}
