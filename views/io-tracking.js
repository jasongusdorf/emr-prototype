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
    '.io-sum-positive { color:var(--badge-success-text); }',
    '.io-sum-negative { color:var(--badge-danger-text); }',
    '.io-grid { width:100%; border-collapse:collapse; font-size:13px; }',
    '.io-grid th, .io-grid td { border:1px solid var(--border,#ddd); padding:6px 8px; text-align:center; }',
    '.io-grid th { background:var(--bg-card,#f8f9fa); font-weight:600; position:sticky; top:0; }',
    '.io-grid .io-cat { text-align:left; font-weight:500; }',
    '.io-entry-btn { padding:2px 8px; font-size:11px; border:1px solid var(--border,#ddd); background:#fff; border-radius:4px; cursor:pointer; }',
    '.io-entry-btn:hover { background:var(--primary,#2563eb); color:#fff; }',
    '.io-alert { background:var(--badge-danger-bg); border:1px solid var(--badge-danger-border); color:var(--badge-danger-text); padding:10px 16px; border-radius:var(--radius,8px); margin-bottom:16px; font-weight:500; }',
    '.io-shift-row { background:var(--badge-info-bg) !important; font-weight:600; }',
    /* 4c: Continuous infusion styles */
    '.io-infusion-section { margin-top:24px; background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; }',
    '.io-infusion-section h3 { margin:0 0 12px; font-size:15px; }',
    '.io-infusion-table { width:100%; border-collapse:collapse; font-size:13px; margin-top:8px; }',
    '.io-infusion-table th, .io-infusion-table td { border:1px solid var(--border,#ddd); padding:6px 8px; text-align:left; }',
    '.io-infusion-table th { background:var(--bg-card,#f8f9fa); font-weight:600; }',
    '.io-infusion-running { color:var(--badge-success-text); font-weight:600; }',
    '.io-infusion-stopped { color:#666; }',
    /* 4d: UO rate card styles */
    '.io-uo-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-top:16px; }',
    '.io-uo-card h4 { margin:0 0 8px; font-size:14px; }',
    '.io-uo-alert { background:var(--badge-danger-bg); border:1px solid var(--badge-danger-border); color:var(--badge-danger-text); padding:8px 12px; border-radius:4px; margin-top:8px; font-weight:500; }',
    '.io-uo-ok { color:var(--badge-success-text); }',
    '.io-uo-warn { color:var(--badge-danger-text); font-weight:700; }',
    /* 4e: Fluid restriction styles */
    '.io-restriction-section { margin-top:16px; background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; }',
    '.io-restriction-section h4 { margin:0 0 8px; font-size:14px; }',
    '.io-progress-bar-wrap { background:#e9ecef; border-radius:6px; height:24px; overflow:hidden; position:relative; margin-top:8px; }',
    '.io-progress-bar { height:100%; border-radius:6px; transition:width 0.3s; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:#fff; min-width:30px; }',
    '.io-progress-ok { background:var(--success); }',
    '.io-progress-warn { background:var(--warning); color:var(--text-primary); }',
    '.io-progress-danger { background:#dc3545; }'
  ].join('\n');
  document.head.appendChild(s);
}

var IO_INTAKE_CATS = ['PO (Oral)','IV Fluids','Blood Products','TPN','Medications','Tube Feeds'];
var IO_OUTPUT_CATS = ['Urine','Stool','Emesis','NG Suction','Drain','Blood Loss'];

/* --- 4c: Continuous infusion storage helpers --- */
var IO_INFUSIONS_KEY = 'emr_continuous_infusions';

function _getInfusions(patientId) {
  var raw = localStorage.getItem(IO_INFUSIONS_KEY);
  var all = raw ? JSON.parse(raw) : [];
  return all.filter(function(inf) { return inf.patientId === patientId && !inf._deleted; });
}

function _saveInfusion(data) {
  if (!data.id) data.id = generateId();
  data.createdAt = data.createdAt || new Date().toISOString();
  var raw = localStorage.getItem(IO_INFUSIONS_KEY);
  var all = raw ? JSON.parse(raw) : [];
  all.push(data);
  localStorage.setItem(IO_INFUSIONS_KEY, JSON.stringify(all));
  return data;
}

function _updateInfusion(id, updates) {
  var raw = localStorage.getItem(IO_INFUSIONS_KEY);
  var all = raw ? JSON.parse(raw) : [];
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) {
      for (var k in updates) { if (updates.hasOwnProperty(k)) all[i][k] = updates[k]; }
      break;
    }
  }
  localStorage.setItem(IO_INFUSIONS_KEY, JSON.stringify(all));
}

function _calcInfusionVolume(inf) {
  var start = new Date(inf.startTime);
  var end = inf.stopTime ? new Date(inf.stopTime) : new Date();
  var hours = Math.max(0, (end - start) / 3600000);
  return Math.round(hours * (inf.rate || 0));
}

function _calcInfusionHourlyVolume(inf, hour, dateStr) {
  var start = new Date(inf.startTime);
  var end = inf.stopTime ? new Date(inf.stopTime) : new Date();
  var hourStart = new Date(dateStr + 'T' + String(hour).padStart(2, '0') + ':00:00');
  var hourEnd = new Date(dateStr + 'T' + String(hour).padStart(2, '0') + ':59:59');
  if (end < hourStart || start > hourEnd) return 0;
  var effectiveStart = start > hourStart ? start : hourStart;
  var effectiveEnd = end < hourEnd ? end : hourEnd;
  var mins = Math.max(0, (effectiveEnd - effectiveStart) / 60000);
  return Math.round((mins / 60) * (inf.rate || 0));
}

/* --- 4e: Fluid restriction storage helpers --- */
var IO_FLUID_RESTRICT_KEY = 'emr_fluid_restrictions';

function _getFluidRestriction(patientId) {
  var raw = localStorage.getItem(IO_FLUID_RESTRICT_KEY);
  var all = raw ? JSON.parse(raw) : [];
  var rec = null;
  all.forEach(function(r) {
    if (r.patientId === patientId && !r._deleted) {
      if (!rec || r.createdAt > rec.createdAt) rec = r;
    }
  });
  return rec;
}

function _saveFluidRestriction(data) {
  if (!data.id) data.id = generateId();
  data.createdAt = data.createdAt || new Date().toISOString();
  var raw = localStorage.getItem(IO_FLUID_RESTRICT_KEY);
  var all = raw ? JSON.parse(raw) : [];
  // Soft-delete any previous restriction for this patient
  all.forEach(function(r) {
    if (r.patientId === data.patientId && !r._deleted) r._deleted = true;
  });
  all.push(data);
  localStorage.setItem(IO_FLUID_RESTRICT_KEY, JSON.stringify(all));
  return data;
}

var _ioShiftView = true;

function renderIOTracking() {
  _injectIOCSS();
  var app = document.getElementById('app');
  var patients = getPatients();
  var selPid = patients[0] ? patients[0].id : null;

  function build(pid) {
    var records = getIORecords(pid);
    var today = new Date().toISOString().slice(0,10);
    var todayRecords = records.filter(function(r) { return (r.recordedAt || '').slice(0,10) === today; });

    /* --- 4c: Infusion data --- */
    var infusions = _getInfusions(pid);
    var todayInfusions = infusions.filter(function(inf) {
      var startDate = (inf.startTime || '').slice(0, 10);
      var endDate = inf.stopTime ? inf.stopTime.slice(0, 10) : today;
      return startDate <= today && endDate >= today;
    });
    var totalInfusionIntake = 0;
    todayInfusions.forEach(function(inf) {
      for (var h = 0; h < 24; h++) {
        totalInfusionIntake += _calcInfusionHourlyVolume(inf, h, today);
      }
    });

    var totalIn = 0, totalOut = 0;
    todayRecords.forEach(function(r) {
      if (r.direction === 'intake') totalIn += (r.amount || 0);
      else totalOut += (r.amount || 0);
    });
    totalIn += totalInfusionIntake;
    var net = totalIn - totalOut;

    /* --- 4e: Fluid restriction data --- */
    var restriction = _getFluidRestriction(pid);

    var html = '<div class="io-wrap">';
    html += '<div class="io-header"><h2>Intake/Output Tracking</h2>';
    html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    html += '<button class="btn btn-sm" id="io-shift-toggle" style="background:' + (_ioShiftView ? 'var(--primary,#2563eb)' : '#6c757d') + ';color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer">' + (_ioShiftView ? 'Show Full 24h' : 'Show Current Shift') + '</button>';
    html += '<button class="btn btn-sm btn-outline-warning" id="io-set-restriction">Set Restriction</button>';
    html += '<select class="mar-patient-select" id="io-pt-sel">';
    patients.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + '</option>';
    });
    html += '</select></div></div>';

    if (Math.abs(net) > 500) {
      html += '<div class="io-alert">&#9888; Significant fluid imbalance: Net ' + (net > 0 ? '+' : '') + net + ' mL over 24 hours</div>';
    }

    /* --- 4e: Fluid restriction warning --- */
    if (restriction && restriction.limitMl) {
      var pct = Math.round((totalIn / restriction.limitMl) * 100);
      var barClass = pct >= 100 ? 'io-progress-danger' : pct >= 80 ? 'io-progress-warn' : 'io-progress-ok';
      if (pct >= 80) {
        html += '<div class="io-alert">&#9888; Fluid restriction: ' + totalIn + ' / ' + restriction.limitMl + ' mL (' + pct + '%) — ' + (pct >= 100 ? 'LIMIT EXCEEDED' : 'Approaching limit') + '</div>';
      }
    }

    html += '<div class="io-summary">';
    html += '<div class="io-sum-card"><h4>Total Intake</h4><div class="io-sum-val io-sum-positive">' + totalIn + ' mL</div></div>';
    html += '<div class="io-sum-card"><h4>Total Output</h4><div class="io-sum-val io-sum-negative">' + totalOut + ' mL</div></div>';
    html += '<div class="io-sum-card"><h4>Net Balance</h4><div class="io-sum-val ' + (net >= 0 ? 'io-sum-positive' : 'io-sum-negative') + '">' + (net > 0 ? '+' : '') + net + ' mL</div></div>';
    html += '<div class="io-sum-card"><h4>Date</h4><div class="io-sum-val" style="font-size:16px">' + today + '</div></div>';
    html += '</div>';

    /* --- 4e: Fluid restriction progress bar --- */
    if (restriction && restriction.limitMl) {
      var pctBar = Math.min(Math.round((totalIn / restriction.limitMl) * 100), 100);
      var barCls = pctBar >= 100 ? 'io-progress-danger' : pctBar >= 80 ? 'io-progress-warn' : 'io-progress-ok';
      html += '<div class="io-restriction-section">';
      html += '<h4>Fluid Restriction: ' + restriction.limitMl + ' mL/day</h4>';
      html += '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>Current: ' + totalIn + ' mL</span><span>Limit: ' + restriction.limitMl + ' mL</span></div>';
      html += '<div class="io-progress-bar-wrap"><div class="io-progress-bar ' + barCls + '" style="width:' + pctBar + '%">' + pctBar + '%</div></div>';
      html += '<div style="margin-top:6px;font-size:12px;color:var(--text-secondary,#666)">Remaining: ' + Math.max(0, restriction.limitMl - totalIn) + ' mL</div>';
      html += '</div>';
    }

    // Build hourly grid — shift-view-aware
    var allHours = [];
    for (var h = 0; h < 24; h++) allHours.push(h);

    // Determine which hours to display
    var displayHours = allHours;
    var useBlocks = false;
    var blocks = null;
    if (_ioShiftView) {
      // Current shift: Day 7-18, Night 19-6
      var nowH = new Date().getHours();
      if (nowH >= 7 && nowH <= 18) {
        displayHours = [];
        for (var sh = 7; sh <= 18; sh++) displayHours.push(sh);
      } else {
        displayHours = [];
        for (var sh2 = 19; sh2 < 24; sh2++) displayHours.push(sh2);
        for (var sh3 = 0; sh3 <= 6; sh3++) displayHours.push(sh3);
      }
    } else {
      // Full 24h view — on narrow screens, collapse to 4-hour blocks
      if (window.innerWidth < 1200) {
        useBlocks = true;
        blocks = [
          { label: '00-03', hours: [0,1,2,3] },
          { label: '04-07', hours: [4,5,6,7] },
          { label: '08-11', hours: [8,9,10,11] },
          { label: '12-15', hours: [12,13,14,15] },
          { label: '16-19', hours: [16,17,18,19] },
          { label: '20-23', hours: [20,21,22,23] }
        ];
      }
    }

    // Scroll-snap wrapper for full 24h view on wide screens
    var tableWrapStyle = 'overflow-x:auto';
    if (!_ioShiftView && !useBlocks) {
      tableWrapStyle = 'overflow-x:auto;scroll-snap-type:x mandatory';
    }

    // Helper: build table for a direction (intake/output)
    function _buildIOTable(direction, cats, dirLabel) {
      var thtml = '<h3 style="margin:16px 0 8px">' + dirLabel + '</h3>';
      thtml += '<div style="' + tableWrapStyle + '"><table class="io-grid"><thead><tr><th class="io-cat">Category</th>';

      if (useBlocks) {
        blocks.forEach(function(b) {
          thtml += '<th class="io-block-header" data-block="' + b.label + '" style="cursor:pointer;min-width:60px;scroll-snap-align:start" title="Click to expand">' + b.label + '</th>';
        });
      } else {
        displayHours.forEach(function(dh) {
          thtml += '<th style="scroll-snap-align:start">' + String(dh).padStart(2,'0') + '</th>';
        });
      }
      thtml += '<th>Total</th></tr></thead><tbody>';

      cats.forEach(function(cat) {
        var catTotal = 0;
        thtml += '<tr><td class="io-cat">' + cat + '</td>';
        if (useBlocks) {
          blocks.forEach(function(b) {
            var blockAmt = 0;
            b.hours.forEach(function(bh) {
              var entries = todayRecords.filter(function(r) { return r.direction === direction && r.category === cat && r.hour === bh; });
              blockAmt += entries.reduce(function(sum, r) { return sum + (r.amount || 0); }, 0);
            });
            catTotal += blockAmt;
            thtml += '<td class="io-block-cell" data-dir="' + direction + '" data-cat="' + esc(cat) + '" data-block="' + b.label + '" style="cursor:pointer">' + (blockAmt ? blockAmt : '') + '</td>';
          });
        } else {
          displayHours.forEach(function(dh) {
            var entries = todayRecords.filter(function(r) { return r.direction === direction && r.category === cat && r.hour === dh; });
            var amt = entries.reduce(function(sum, r) { return sum + (r.amount || 0); }, 0);
            catTotal += amt;
            thtml += '<td>' + (amt ? '<span>' + amt + '</span> ' : '') + '<button class="io-entry-btn" data-dir="' + direction + '" data-cat="' + esc(cat) + '" data-hour="' + dh + '">+</button></td>';
          });
        }
        thtml += '<td><strong>' + catTotal + '</strong></td></tr>';
      });

      // Infusion row (intake only)
      if (direction === 'intake' && todayInfusions.length > 0) {
        var infCatTotal = 0;
        thtml += '<tr><td class="io-cat">Infusions (auto)</td>';
        if (useBlocks) {
          blocks.forEach(function(b) {
            var blockTotal = 0;
            b.hours.forEach(function(bh) {
              todayInfusions.forEach(function(inf) {
                blockTotal += _calcInfusionHourlyVolume(inf, bh, today);
              });
            });
            infCatTotal += blockTotal;
            thtml += '<td>' + (blockTotal ? blockTotal : '') + '</td>';
          });
        } else {
          displayHours.forEach(function(dh) {
            var hourTotal = 0;
            todayInfusions.forEach(function(inf) {
              hourTotal += _calcInfusionHourlyVolume(inf, dh, today);
            });
            infCatTotal += hourTotal;
            thtml += '<td>' + (hourTotal ? hourTotal : '') + '</td>';
          });
        }
        thtml += '<td><strong>' + infCatTotal + '</strong></td></tr>';
      }

      // Shift totals
      var colCount = useBlocks ? blocks.length : displayHours.length;

      thtml += '<tr class="io-shift-row"><td>Day Shift (07-19)</td>';
      var dayShift = _shiftTotal(todayRecords, direction, 7, 19);
      var dayShiftInf = 0;
      if (direction === 'intake') {
        todayInfusions.forEach(function(inf) {
          for (var dh2 = 7; dh2 < 19; dh2++) dayShiftInf += _calcInfusionHourlyVolume(inf, dh2, today);
        });
      }
      for (var ec = 0; ec < colCount; ec++) thtml += '<td></td>';
      thtml += '<td><strong>' + ((dayShift || 0) + dayShiftInf) + '</strong></td></tr>';

      thtml += '<tr class="io-shift-row"><td>Night Shift (19-07)</td>';
      var nightShift = _shiftTotal(todayRecords, direction, 19, 7);
      var nightShiftInf = 0;
      if (direction === 'intake') {
        todayInfusions.forEach(function(inf) {
          for (var nh = 19; nh < 24; nh++) nightShiftInf += _calcInfusionHourlyVolume(inf, nh, today);
          for (var nh2 = 0; nh2 < 7; nh2++) nightShiftInf += _calcInfusionHourlyVolume(inf, nh2, today);
        });
      }
      for (var ec2 = 0; ec2 < colCount; ec2++) thtml += '<td></td>';
      thtml += '<td><strong>' + ((nightShift || 0) + nightShiftInf) + '</strong></td></tr>';

      thtml += '</tbody></table></div>';
      return thtml;
    }

    html += _buildIOTable('intake', IO_INTAKE_CATS, 'Intake');
    html += _buildIOTable('output', IO_OUTPUT_CATS, 'Output');

    /* --- 4d: Urine output rate (mL/kg/hr) summary card --- */
    html += _buildUOCard(pid, todayRecords, allHours, today);

    /* --- 4c: Continuous infusions section --- */
    html += '<div class="io-infusion-section">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<h3>Continuous Infusions</h3>';
    html += '<button class="btn btn-sm btn-primary" id="io-add-infusion">+ Add Infusion</button>';
    html += '</div>';

    if (infusions.length > 0) {
      html += '<table class="io-infusion-table"><thead><tr><th>Fluid</th><th>Rate (mL/hr)</th><th>Start</th><th>Stop</th><th>Cumulative (mL)</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
      infusions.forEach(function(inf) {
        var isRunning = !inf.stopTime;
        var cumVol = _calcInfusionVolume(inf);
        html += '<tr>';
        html += '<td>' + esc(inf.fluidName || '') + '</td>';
        html += '<td>' + (inf.rate || 0) + '</td>';
        html += '<td>' + formatDateTime(inf.startTime) + '</td>';
        html += '<td>' + (inf.stopTime ? formatDateTime(inf.stopTime) : '—') + '</td>';
        html += '<td><strong>' + cumVol + '</strong></td>';
        html += '<td class="' + (isRunning ? 'io-infusion-running' : 'io-infusion-stopped') + '">' + (isRunning ? 'Running' : 'Stopped') + '</td>';
        html += '<td>';
        if (isRunning) {
          html += '<button class="io-entry-btn io-stop-infusion" data-id="' + inf.id + '">Stop</button>';
        }
        html += '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<p style="color:var(--text-secondary,#666);font-size:13px;margin-top:8px">No continuous infusions recorded.</p>';
    }
    html += '</div>';

    html += '</div>'; // close .io-wrap

    app.innerHTML = html;

    // Wire patient selector
    document.getElementById('io-pt-sel').addEventListener('change', function() { selPid = this.value; build(this.value); });

    // Wire shift-view toggle
    var shiftToggleBtn = document.getElementById('io-shift-toggle');
    if (shiftToggleBtn) shiftToggleBtn.addEventListener('click', function() {
      _ioShiftView = !_ioShiftView;
      build(pid);
    });

    // Wire block-cell expand (4-hour blocks on narrow screens)
    app.querySelectorAll('.io-block-cell').forEach(function(cell) {
      cell.addEventListener('click', function() {
        var dir = this.getAttribute('data-dir');
        var cat = this.getAttribute('data-cat');
        var blockLabel = this.getAttribute('data-block');
        if (!blockLabel || !dir || !cat) return;
        // Parse block hours from label e.g. "08-11"
        var parts = blockLabel.split('-');
        var startH = parseInt(parts[0]);
        var endH = parseInt(parts[1]);
        var blockHours = [];
        for (var bh = startH; bh <= endH; bh++) blockHours.push(bh);

        // Build detail modal with individual hour entries
        var detailHTML = '<table class="io-grid" style="width:100%;font-size:13px"><thead><tr>';
        blockHours.forEach(function(bh) { detailHTML += '<th>' + String(bh).padStart(2,'0') + ':00</th>'; });
        detailHTML += '</tr></thead><tbody><tr>';
        blockHours.forEach(function(bh) {
          var entries = todayRecords.filter(function(r) { return r.direction === dir && r.category === cat && r.hour === bh; });
          var amt = entries.reduce(function(sum, r) { return sum + (r.amount || 0); }, 0);
          detailHTML += '<td>' + (amt ? '<strong>' + amt + '</strong> mL<br>' : '') + '<button class="io-entry-btn io-block-add" data-dir="' + dir + '" data-cat="' + esc(cat) + '" data-hour="' + bh + '">+</button></td>';
        });
        detailHTML += '</tr></tbody></table>';

        openModal({
          title: cat + ' (' + dir + ') — ' + blockLabel,
          bodyHTML: detailHTML,
          footerHTML: ''
        });

        // Wire the + buttons inside the modal
        document.querySelectorAll('.io-block-add').forEach(function(addBtn) {
          addBtn.addEventListener('click', function() {
            var addDir = this.getAttribute('data-dir');
            var addCat = this.getAttribute('data-cat');
            var addHour = parseInt(this.getAttribute('data-hour'));
            openModal({
              title: 'Record ' + addDir.charAt(0).toUpperCase() + addDir.slice(1) + ' — ' + addCat + ' (' + String(addHour).padStart(2,'0') + ':00)',
              bodyHTML: '<label>Amount (mL):<input id="io-block-amt" type="number" class="form-control" min="0" step="10" placeholder="e.g. 250"></label>' +
                '<label style="margin-top:8px">Notes:<input id="io-block-notes" class="form-control" placeholder="Optional"></label>',
              footerHTML: '<button class="btn btn-primary" id="io-block-save">Save</button>'
            });
            document.getElementById('io-block-save').addEventListener('click', function() {
              var bAmt = parseInt(document.getElementById('io-block-amt').value) || 0;
              if (bAmt <= 0) { showToast('Enter a valid amount', 'error'); return; }
              saveIORecord({ patientId: pid, direction: addDir, category: addCat, hour: addHour, amount: bAmt, notes: document.getElementById('io-block-notes').value, nurse: getSessionUser().id });
              closeAllModals();
              showToast('Recorded ' + bAmt + ' mL', 'success');
              build(pid);
            });
          });
        });
      });
    });

    // Wire entry buttons
    app.querySelectorAll('.io-entry-btn:not(.io-stop-infusion)').forEach(function(btn) {
      if (btn.id === 'io-add-infusion' || btn.classList.contains('io-stop-infusion')) return;
      btn.addEventListener('click', function() {
        var dir = this.getAttribute('data-dir');
        var cat = this.getAttribute('data-cat');
        var hour = parseInt(this.getAttribute('data-hour'));
        if (!dir || !cat) return;
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

    /* --- 4c: Wire add-infusion button --- */
    var addInfBtn = document.getElementById('io-add-infusion');
    if (addInfBtn) addInfBtn.addEventListener('click', function() {
      var nowLocal = new Date();
      var dtStr = nowLocal.getFullYear() + '-' + String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' + String(nowLocal.getDate()).padStart(2, '0') + 'T' + String(nowLocal.getHours()).padStart(2, '0') + ':' + String(nowLocal.getMinutes()).padStart(2, '0');
      openModal({
        title: 'Add Continuous Infusion',
        bodyHTML:
          '<label>Fluid Name:<input id="io-inf-name" class="form-control" placeholder="e.g. Normal Saline, LR"></label>' +
          '<label style="margin-top:8px">Rate (mL/hr):<input id="io-inf-rate" type="number" class="form-control" min="1" step="5" placeholder="e.g. 125"></label>' +
          '<label style="margin-top:8px">Start Time:<input id="io-inf-start" type="datetime-local" class="form-control" value="' + dtStr + '"></label>' +
          '<label style="margin-top:8px">Stop Time (optional):<input id="io-inf-stop" type="datetime-local" class="form-control"></label>',
        footerHTML: '<button class="btn btn-primary" id="io-inf-save">Save Infusion</button>'
      });
      document.getElementById('io-inf-save').addEventListener('click', function() {
        var name = document.getElementById('io-inf-name').value.trim();
        var rate = parseInt(document.getElementById('io-inf-rate').value) || 0;
        var startVal = document.getElementById('io-inf-start').value;
        var stopVal = document.getElementById('io-inf-stop').value;
        if (!name) { showToast('Enter fluid name', 'error'); return; }
        if (rate <= 0) { showToast('Enter a valid rate', 'error'); return; }
        if (!startVal) { showToast('Enter a start time', 'error'); return; }
        _saveInfusion({
          patientId: pid,
          fluidName: name,
          rate: rate,
          startTime: new Date(startVal).toISOString(),
          stopTime: stopVal ? new Date(stopVal).toISOString() : null,
          createdBy: getSessionUser().id
        });
        closeAllModals();
        showToast('Infusion started: ' + name + ' @ ' + rate + ' mL/hr', 'success');
        build(pid);
      });
    });

    /* --- 4c: Wire stop-infusion buttons --- */
    app.querySelectorAll('.io-stop-infusion').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var infId = this.getAttribute('data-id');
        _updateInfusion(infId, { stopTime: new Date().toISOString() });
        showToast('Infusion stopped', 'success');
        build(pid);
      });
    });

    /* --- 4e: Wire set-restriction button --- */
    var restrictBtn = document.getElementById('io-set-restriction');
    if (restrictBtn) restrictBtn.addEventListener('click', function() {
      var current = _getFluidRestriction(pid);
      openModal({
        title: 'Set Fluid Restriction',
        bodyHTML:
          '<p style="font-size:13px;color:var(--text-secondary,#666);margin-bottom:12px">Set a daily fluid intake restriction for this patient. Leave blank or set to 0 to remove restriction.</p>' +
          '<label>Limit (mL/day):<input id="io-restrict-limit" type="number" class="form-control" min="0" step="50" placeholder="e.g. 1500" value="' + (current ? current.limitMl : '') + '"></label>',
        footerHTML: '<button class="btn btn-primary" id="io-restrict-save">Save</button>' +
          (current ? ' <button class="btn btn-sm btn-outline-danger" id="io-restrict-remove">Remove Restriction</button>' : '')
      });
      document.getElementById('io-restrict-save').addEventListener('click', function() {
        var val = parseInt(document.getElementById('io-restrict-limit').value) || 0;
        if (val <= 0) {
          // Remove restriction
          if (current) {
            _saveFluidRestriction({ patientId: pid, limitMl: 0 });
          }
          closeAllModals();
          showToast('Fluid restriction removed', 'success');
          build(pid);
          return;
        }
        _saveFluidRestriction({ patientId: pid, limitMl: val, setBy: getSessionUser().id });
        closeAllModals();
        showToast('Fluid restriction set: ' + val + ' mL/day', 'success');
        build(pid);
      });
      var removeBtn = document.getElementById('io-restrict-remove');
      if (removeBtn) removeBtn.addEventListener('click', function() {
        _saveFluidRestriction({ patientId: pid, limitMl: 0 });
        closeAllModals();
        showToast('Fluid restriction removed', 'success');
        build(pid);
      });
    });
  }

  /* --- 4d: Build UO rate card --- */
  function _buildUOCard(pid, todayRecords, hours, today) {
    var urineRecords = todayRecords.filter(function(r) { return r.direction === 'output' && r.category === 'Urine'; });
    var totalUrine = urineRecords.reduce(function(sum, r) { return sum + (r.amount || 0); }, 0);

    // Get patient weight from latest vitals
    var weightKg = null;
    var vitalData = null;
    try { vitalData = getLatestVitalsByPatient(pid); } catch(e) { /* no-op */ }
    if (vitalData && vitalData.vitals && vitalData.vitals.weightLbs) {
      weightKg = parseFloat(vitalData.vitals.weightLbs) * 0.453592;
    }

    var currentHour = new Date().getHours();
    var hoursElapsed = Math.max(1, currentHour + 1); // hours from midnight to now

    var html = '<div class="io-uo-card">';
    html += '<h4>Urine Output Rate</h4>';
    if (!weightKg) {
      html += '<p style="color:var(--text-secondary,#666);font-size:13px">Patient weight not available. Record vitals with weight to calculate mL/kg/hr.</p>';
      html += '<div style="font-size:14px;margin-top:4px">Total urine output today: <strong>' + totalUrine + ' mL</strong> over ' + hoursElapsed + ' hours (' + Math.round(totalUrine / hoursElapsed) + ' mL/hr)</div>';
    } else {
      var uoRate = totalUrine / hoursElapsed / weightKg;
      var uoRateStr = uoRate.toFixed(2);
      html += '<div style="font-size:14px;margin-top:4px">';
      html += 'Weight: <strong>' + weightKg.toFixed(1) + ' kg</strong> &bull; ';
      html += 'Total UO: <strong>' + totalUrine + ' mL</strong> over ' + hoursElapsed + ' hrs &bull; ';
      html += 'Rate: <strong class="' + (uoRate < 0.5 ? 'io-uo-warn' : 'io-uo-ok') + '">' + uoRateStr + ' mL/kg/hr</strong>';
      html += '</div>';

      // Check for 2+ consecutive hours below 0.5 mL/kg/hr
      var consecutiveLow = 0;
      var maxConsecutiveLow = 0;
      var lowHourRanges = [];
      for (var ch = 0; ch <= currentHour; ch++) {
        var hourUrine = urineRecords.filter(function(r) { return r.hour === ch; }).reduce(function(sum, r) { return sum + (r.amount || 0); }, 0);
        var hourRate = hourUrine / weightKg;
        if (hourRate < 0.5) {
          consecutiveLow++;
          if (consecutiveLow > maxConsecutiveLow) maxConsecutiveLow = consecutiveLow;
        } else {
          consecutiveLow = 0;
        }
      }

      if (maxConsecutiveLow >= 2) {
        html += '<div class="io-uo-alert">&#9888; ALERT: Urine output &lt; 0.5 mL/kg/hr for ' + maxConsecutiveLow + ' consecutive hours. Evaluate for acute kidney injury or volume depletion.</div>';
      }
    }
    html += '</div>';
    return html;
  }

  function _shiftTotal(records, direction, startH, endH) {
    var total = 0;
    records.forEach(function(r) {
      if (r.direction !== direction) return;
      var h = r.hour;
      if (startH < endH) { if (h >= startH && h < endH) total += (r.amount || 0); }
      else { if (h >= startH || h < endH) total += (r.amount || 0); }
    });
    return total;
  }

  if (selPid) build(selPid);
  else app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>';
}
