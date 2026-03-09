/* ============================================================
   views/io-tracking.js — Intake/Output Tracking
   ============================================================ */

function _injectIOCSS() {
  if (document.getElementById('io-styles')) return;
  var s = document.createElement('style');
  s.id = 'io-styles';
  s.textContent = [
    '.io-wrap { padding:24px; max-width:1100px; margin:0 auto; }',
    '.io-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.io-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }',
    '.io-sum-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; text-align:center; }',
    '.io-sum-card h4 { margin:0; font-size:13px; color:var(--text-secondary,#666); }',
    '.io-sum-card .io-sum-val { font-size:24px; font-weight:700; margin-top:4px; }',
    '.io-sum-positive { color:#155724; }',
    '.io-sum-negative { color:#721c24; }',
    '.io-grid { width:100%; border-collapse:collapse; font-size:13px; }',
    '.io-grid th, .io-grid td { border:1px solid var(--border,#ddd); padding:6px 8px; text-align:center; }',
    '.io-grid th { background:var(--bg-card,#f8f9fa); font-weight:600; position:sticky; top:0; }',
    '.io-grid .io-cat { text-align:left; font-weight:500; }',
    '.io-entry-btn { padding:2px 8px; font-size:11px; border:1px solid var(--border,#ddd); background:#fff; border-radius:4px; cursor:pointer; }',
    '.io-entry-btn:hover { background:var(--primary,#2563eb); color:#fff; }',
    '.io-alert { background:#f8d7da; border:1px solid #f5c6cb; color:#721c24; padding:10px 16px; border-radius:var(--radius,8px); margin-bottom:16px; font-weight:500; }',
    '.io-shift-row { background:#f0f7ff !important; font-weight:600; }'
  ].join('\n');
  document.head.appendChild(s);
}

var IO_INTAKE_CATS = ['PO (Oral)','IV Fluids','Blood Products','TPN','Medications','Tube Feeds'];
var IO_OUTPUT_CATS = ['Urine','Stool','Emesis','NG Suction','Drain','Blood Loss'];

function renderIOTracking() {
  _injectIOCSS();
  var app = document.getElementById('app');
  var patients = getPatients();
  var selPid = patients[0] ? patients[0].id : null;

  function build(pid) {
    var records = getIORecords(pid);
    var today = new Date().toISOString().slice(0,10);
    var todayRecords = records.filter(function(r) { return (r.recordedAt || '').slice(0,10) === today; });

    var totalIn = 0, totalOut = 0;
    todayRecords.forEach(function(r) {
      if (r.direction === 'intake') totalIn += (r.amount || 0);
      else totalOut += (r.amount || 0);
    });
    var net = totalIn - totalOut;

    var html = '<div class="io-wrap">';
    html += '<div class="io-header"><h2>Intake/Output Tracking</h2>';
    html += '<select class="mar-patient-select" id="io-pt-sel">';
    patients.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + '</option>';
    });
    html += '</select></div>';

    if (Math.abs(net) > 500) {
      html += '<div class="io-alert">&#9888; Significant fluid imbalance: Net ' + (net > 0 ? '+' : '') + net + ' mL over 24 hours</div>';
    }

    html += '<div class="io-summary">';
    html += '<div class="io-sum-card"><h4>Total Intake</h4><div class="io-sum-val io-sum-positive">' + totalIn + ' mL</div></div>';
    html += '<div class="io-sum-card"><h4>Total Output</h4><div class="io-sum-val io-sum-negative">' + totalOut + ' mL</div></div>';
    html += '<div class="io-sum-card"><h4>Net Balance</h4><div class="io-sum-val ' + (net >= 0 ? 'io-sum-positive' : 'io-sum-negative') + '">' + (net > 0 ? '+' : '') + net + ' mL</div></div>';
    html += '<div class="io-sum-card"><h4>Date</h4><div class="io-sum-val" style="font-size:16px">' + today + '</div></div>';
    html += '</div>';

    // Build hourly grid
    var hours = [];
    for (var h = 0; h < 24; h++) hours.push(h);

    // Intake table
    html += '<h3 style="margin:16px 0 8px">Intake</h3>';
    html += '<div style="overflow-x:auto"><table class="io-grid"><thead><tr><th class="io-cat">Category</th>';
    hours.forEach(function(h) { html += '<th>' + String(h).padStart(2,'0') + '</th>'; });
    html += '<th>Total</th></tr></thead><tbody>';

    IO_INTAKE_CATS.forEach(function(cat) {
      var catTotal = 0;
      html += '<tr><td class="io-cat">' + cat + '</td>';
      hours.forEach(function(h) {
        var entry = todayRecords.find(function(r) { return r.direction === 'intake' && r.category === cat && r.hour === h; });
        var amt = entry ? entry.amount : 0;
        catTotal += amt;
        html += '<td>' + (amt ? amt : '<button class="io-entry-btn" data-dir="intake" data-cat="' + esc(cat) + '" data-hour="' + h + '">+</button>') + '</td>';
      });
      html += '<td><strong>' + catTotal + '</strong></td></tr>';
    });

    // Shift totals
    html += '<tr class="io-shift-row"><td>Day Shift (07-19)</td>';
    hours.forEach(function(h) { html += '<td>' + (h === 7 ? _shiftTotal(todayRecords, 'intake', 7, 19) : '') + '</td>'; });
    html += '<td></td></tr>';
    html += '<tr class="io-shift-row"><td>Night Shift (19-07)</td>';
    hours.forEach(function(h) { html += '<td>' + (h === 19 ? _shiftTotal(todayRecords, 'intake', 19, 7) : '') + '</td>'; });
    html += '<td></td></tr>';
    html += '</tbody></table></div>';

    // Output table
    html += '<h3 style="margin:16px 0 8px">Output</h3>';
    html += '<div style="overflow-x:auto"><table class="io-grid"><thead><tr><th class="io-cat">Category</th>';
    hours.forEach(function(h) { html += '<th>' + String(h).padStart(2,'0') + '</th>'; });
    html += '<th>Total</th></tr></thead><tbody>';

    IO_OUTPUT_CATS.forEach(function(cat) {
      var catTotal = 0;
      html += '<tr><td class="io-cat">' + cat + '</td>';
      hours.forEach(function(h) {
        var entry = todayRecords.find(function(r) { return r.direction === 'output' && r.category === cat && r.hour === h; });
        var amt = entry ? entry.amount : 0;
        catTotal += amt;
        html += '<td>' + (amt ? amt : '<button class="io-entry-btn" data-dir="output" data-cat="' + esc(cat) + '" data-hour="' + h + '">+</button>') + '</td>';
      });
      html += '<td><strong>' + catTotal + '</strong></td></tr>';
    });
    html += '</tbody></table></div></div>';

    app.innerHTML = html;

    document.getElementById('io-pt-sel').addEventListener('change', function() { selPid = this.value; build(this.value); });

    app.querySelectorAll('.io-entry-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var dir = this.getAttribute('data-dir');
        var cat = this.getAttribute('data-cat');
        var hour = parseInt(this.getAttribute('data-hour'));
        openModal({
          title: 'Record ' + dir.charAt(0).toUpperCase() + dir.slice(1) + ' — ' + cat,
          bodyHTML: '<label>Amount (mL):<input id="io-amt" type="number" class="form-control" min="0" step="10" placeholder="e.g. 250"></label>' +
            '<label style="margin-top:8px">Notes:<input id="io-notes" class="form-control" placeholder="Optional"></label>',
          footerHTML: '<button class="btn btn-primary" id="io-save-entry">Save</button>'
        });
        document.getElementById('io-save-entry').addEventListener('click', function() {
          var amt = parseInt(document.getElementById('io-amt').value) || 0;
          if (amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
          saveIORecord({ patientId: pid, direction: dir, category: cat, hour: hour, amount: amt, notes: document.getElementById('io-notes').value, nurse: getSessionUser().id });
          closeAllModals();
          showToast('Recorded ' + amt + ' mL', 'success');
          build(pid);
        });
      });
    });
  }

  function _shiftTotal(records, direction, startH, endH) {
    var total = 0;
    records.forEach(function(r) {
      if (r.direction !== direction) return;
      var h = r.hour;
      if (startH < endH) { if (h >= startH && h < endH) total += (r.amount || 0); }
      else { if (h >= startH || h < endH) total += (r.amount || 0); }
    });
    return total || '';
  }

  if (selPid) build(selPid);
  else app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>';
}
