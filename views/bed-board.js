/* ============================================================
   views/bed-board.js — Bed Board / Unit Census
   ============================================================ */

function _injectBedBoardCSS() {
  if (document.getElementById('bb-styles')) return;
  var s = document.createElement('style');
  s.id = 'bb-styles';
  s.textContent = [
    '.bb-wrap { padding:24px; max-width:1200px; margin:0 auto; }',
    '.bb-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.bb-stats { display:flex; gap:16px; margin-bottom:20px; }',
    '.bb-stat { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:12px 20px; text-align:center; min-width:120px; }',
    '.bb-stat h4 { margin:0; font-size:12px; color:var(--text-secondary,#666); text-transform:uppercase; }',
    '.bb-stat .bb-stat-val { font-size:28px; font-weight:700; }',
    '.bb-unit { margin-bottom:24px; }',
    '.bb-unit-header { display:flex; justify-content:space-between; align-items:center; padding:10px 16px; background:var(--bg-card,#f8f9fa); border-radius:var(--radius,8px) var(--radius,8px) 0 0; border:1px solid var(--border,#ddd); border-bottom:none; }',
    '.bb-unit-header h3 { margin:0; font-size:16px; }',
    '.bb-bed-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:0; border:1px solid var(--border,#ddd); border-radius:0 0 var(--radius,8px) var(--radius,8px); }',
    '.bb-bed { padding:12px; border:1px solid var(--border,#ddd); cursor:pointer; min-height:110px; transition:box-shadow 0.15s; position:relative; }',
    '.bb-bed:hover { box-shadow:0 2px 8px rgba(0,0,0,0.1); z-index:1; }',
    '.bb-bed-number { font-weight:700; font-size:14px; margin-bottom:4px; }',
    '.bb-bed-patient { font-size:12px; line-height:1.4; }',
    '.bb-occupied { background:var(--badge-info-bg); border-color:var(--badge-info-border); }',
    '.bb-available { background:var(--badge-success-bg); border-color:var(--badge-success-border); }',
    '.bb-cleaning { background:var(--badge-warning-bg); border-color:var(--badge-warning-border); }',
    '.bb-blocked { background:var(--badge-danger-bg); border-color:var(--badge-danger-border); }',
    '.bb-legend { display:flex; gap:16px; margin-bottom:16px; font-size:13px; }',
    '.bb-legend-item { display:flex; align-items:center; gap:4px; }',
    '.bb-legend-swatch { width:16px; height:16px; border-radius:3px; border:1px solid var(--border,#ddd); }',
    '.bb-acuity { display:inline-block; padding:1px 6px; border-radius:3px; font-size:11px; font-weight:600; margin-left:4px; cursor:pointer; position:relative; }',
    '.bb-acuity-1 { background:var(--badge-success-bg); color:var(--badge-success-text); }',
    '.bb-acuity-2 { background:var(--badge-info-bg); color:var(--badge-info-text); }',
    '.bb-acuity-3 { background:var(--badge-warning-bg); color:var(--badge-warning-text); }',
    '.bb-acuity-4 { background:var(--badge-danger-bg); color:var(--badge-danger-text); }',
    '.bb-acuity-5 { background:var(--badge-danger-text); color:#fff; }',
    /* 4f: Badge styles */
    '.bb-badges { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px; }',
    '.bb-badge { display:inline-block; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:600; white-space:nowrap; }',
    '.bb-badge-code { background:var(--danger); color:#fff; }',
    '.bb-badge-code-full { background:var(--success); color:#fff; }',
    '.bb-badge-fall-green { background:var(--badge-success-bg); color:var(--badge-success-text); }',
    '.bb-badge-fall-yellow { background:var(--badge-warning-bg); color:var(--badge-warning-text); }',
    '.bb-badge-fall-red { background:var(--badge-danger-bg); color:var(--badge-danger-text); }',
    '.bb-badge-isolation { background:var(--badge-purple-text); color:#fff; }',
    '.bb-badge-diet { background:var(--badge-teal-text); color:#fff; }',
    '.bb-badge-orders { background:var(--warning); color:#fff; }',
    '.bb-badge-vitals-overdue { background:var(--danger); color:#fff; }',
    /* WS8b: PT/SLP badge styles */
    '.bb-badge-wb-wbat { background:var(--badge-success-bg); color:var(--badge-success-text); }',
    '.bb-badge-wb-pwb { background:var(--badge-warning-bg); color:var(--badge-warning-text); }',
    '.bb-badge-wb-nwb { background:var(--badge-danger-bg); color:var(--badge-danger-text); }',
    '.bb-badge-wb-tdwb { background:#ffe0b2; color:#e65100; }',
    '.bb-badge-slp-diet { background:var(--accent-pt); color:#fff; }',
    '.bb-badge-asp-prec { background:var(--danger); color:#fff; }',
    /* 4g: Popover styles */
    '.bb-popover { position:fixed; z-index:10000; background:#fff; border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); box-shadow:0 4px 24px rgba(0,0,0,0.15); min-width:320px; max-width:400px; }',
    '.bb-popover-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border,#ddd); background:var(--bg-card,#f8f9fa); border-radius:var(--radius,8px) var(--radius,8px) 0 0; }',
    '.bb-popover-header h4 { margin:0; font-size:15px; }',
    '.bb-popover-close { background:none; border:none; font-size:18px; cursor:pointer; color:var(--text-secondary,#666); padding:0 4px; }',
    '.bb-popover-body { padding:12px 16px; font-size:13px; line-height:1.6; }',
    '.bb-popover-body dt { font-weight:600; color:var(--text-secondary,#666); font-size:12px; text-transform:uppercase; margin-top:8px; }',
    '.bb-popover-body dt:first-child { margin-top:0; }',
    '.bb-popover-body dd { margin:0 0 4px; font-size:14px; }',
    '.bb-popover-footer { padding:8px 16px; border-top:1px solid var(--border,#ddd); text-align:right; }',
    /* 4h: Acuity dropdown */
    '.bb-acuity-dropdown { position:absolute; z-index:10001; background:#fff; border:1px solid var(--border,#ddd); border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.15); }',
    '.bb-acuity-dropdown-item { padding:6px 16px; font-size:12px; cursor:pointer; white-space:nowrap; }',
    '.bb-acuity-dropdown-item:hover { background:var(--bg-card,#f0f0f0); }',
    '.bb-acuity-dropdown-item.active { background:var(--primary,#2563eb); color:#fff; }'
  ].join('\n');
  document.head.appendChild(s);
}

var BB_DEFAULT_UNITS = [
  { name: 'Medical/Surgical', prefix: 'MS', beds: 12 },
  { name: 'ICU', prefix: 'ICU', beds: 8 },
  { name: 'Telemetry', prefix: 'TELE', beds: 10 },
  { name: 'Labor & Delivery', prefix: 'LD', beds: 6 },
  { name: 'Pediatrics', prefix: 'PEDS', beds: 8 },
  { name: 'Emergency', prefix: 'ED', beds: 15 }
];

/* --- 4f: Helper to get badge data for a patient --- */
function _bbGetBadgeData(patient, patientId) {
  var badges = {};

  // Code status
  badges.codeStatus = (patient && patient.codeStatus) ? patient.codeStatus : 'Full Code';

  // Fall risk (latest Morse score from nursing assessments)
  badges.fallScore = null;
  try {
    var assessments = getNursingAssessments(patientId);
    var morseAssessments = assessments.filter(function(a) { return a.type === 'Morse Fall Risk' && a.score != null; });
    if (morseAssessments.length > 0) {
      morseAssessments.sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
      badges.fallScore = morseAssessments[0].score;
    }
  } catch(e) { /* no-op */ }

  // Isolation type
  badges.isolation = (patient && patient.isolation) ? patient.isolation : null;

  // Diet (from active Diet orders)
  badges.diet = null;
  try {
    var orders = getOrders().filter(function(o) {
      return o.patientId === patientId && o.type === 'Diet' && o.status !== 'Cancelled' && o.status !== 'Completed';
    });
    if (orders.length > 0 && orders[0].detail && orders[0].detail.dietType) {
      badges.diet = orders[0].detail.dietType;
    }
  } catch(e) { /* no-op */ }

  // Unacknowledged orders count
  badges.unackedOrders = 0;
  try {
    var allOrders = getOrders().filter(function(o) {
      return o.patientId === patientId && !o.acknowledgedBy && o.status !== 'Cancelled';
    });
    badges.unackedOrders = allOrders.length;
  } catch(e) { /* no-op */ }

  // Vitals overdue (last vitals > 4 hours ago)
  badges.vitalsOverdue = false;
  try {
    var vitalData = getLatestVitalsByPatient(patientId);
    if (vitalData && vitalData.vitals && vitalData.vitals.recordedAt) {
      var lastTime = new Date(vitalData.vitals.recordedAt).getTime();
      var fourHoursAgo = Date.now() - (4 * 3600000);
      if (lastTime < fourHoursAgo) badges.vitalsOverdue = true;
    } else {
      badges.vitalsOverdue = true; // No vitals at all
    }
  } catch(e) { badges.vitalsOverdue = true; }

  // WS8b: PT weight-bearing status
  badges.ptWB = null;
  try {
    if (typeof getPTEvaluations === 'function') {
      var ptEvals = getPTEvaluations(patientId).sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
      if (ptEvals.length > 0) {
        badges.ptWB = ptEvals[0].weightBearingStatus || ptEvals[0].wbStatus || null;
      }
    }
  } catch(e) { /* no-op */ }

  // WS8b: SLP diet IDDSI level
  badges.slpDiet = null;
  badges.aspirationPrecautions = false;
  try {
    if (typeof getSLPDietRecommendations === 'function') {
      var slpRecs = getSLPDietRecommendations(patientId).sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
      if (slpRecs.length > 0) {
        var rec = slpRecs[0];
        if (rec.foodLevel != null) {
          badges.slpDiet = 'IDDSI ' + rec.foodLevel;
        }
        if (rec.precautions && (Array.isArray(rec.precautions) ? rec.precautions.length > 0 : !!rec.precautions)) {
          badges.aspirationPrecautions = true;
        }
      }
    }
  } catch(e) { /* no-op */ }

  return badges;
}

/* --- 4f: Render badge HTML for a bed tile --- */
function _bbRenderBadges(badges) {
  var html = '<div class="bb-badges">';

  // Code status badge
  var codeClass = badges.codeStatus === 'Full Code' ? 'bb-badge-code-full' : 'bb-badge-code';
  html += '<span class="bb-badge ' + codeClass + '">' + esc(badges.codeStatus) + '</span>';

  // Fall risk badge
  if (badges.fallScore !== null) {
    var fallClass = badges.fallScore >= 45 ? 'bb-badge-fall-red' : badges.fallScore >= 25 ? 'bb-badge-fall-yellow' : 'bb-badge-fall-green';
    html += '<span class="bb-badge ' + fallClass + '">Fall: ' + badges.fallScore + '</span>';
  }

  // Isolation badge
  if (badges.isolation) {
    html += '<span class="bb-badge bb-badge-isolation">' + esc(badges.isolation) + '</span>';
  }

  // Diet badge
  if (badges.diet) {
    html += '<span class="bb-badge bb-badge-diet">' + esc(badges.diet) + '</span>';
  }

  // Unacknowledged orders
  if (badges.unackedOrders > 0) {
    html += '<span class="bb-badge bb-badge-orders">' + badges.unackedOrders + ' unacked</span>';
  }

  // Vitals overdue
  if (badges.vitalsOverdue) {
    html += '<span class="bb-badge bb-badge-vitals-overdue">Vitals overdue</span>';
  }

  // WS8b: PT weight-bearing badge
  if (badges.ptWB) {
    var wbUpper = badges.ptWB.toUpperCase();
    var wbClass = 'bb-badge-wb-wbat';
    if (wbUpper === 'NWB') wbClass = 'bb-badge-wb-nwb';
    else if (wbUpper === 'PWB') wbClass = 'bb-badge-wb-pwb';
    else if (wbUpper === 'TDWB') wbClass = 'bb-badge-wb-tdwb';
    html += '<span class="bb-badge ' + wbClass + '">WB: ' + esc(badges.ptWB) + '</span>';
  }

  // WS8b: SLP diet badge
  if (badges.slpDiet) {
    html += '<span class="bb-badge bb-badge-slp-diet">Diet: ' + esc(badges.slpDiet) + '</span>';
  }

  // WS8b: Aspiration precautions badge
  if (badges.aspirationPrecautions) {
    html += '<span class="bb-badge bb-badge-asp-prec">ASP PREC</span>';
  }

  html += '</div>';
  return html;
}

function renderBedBoard() {
  _injectBedBoardCSS();
  var app = document.getElementById('app');
  var assignments = loadAll(KEYS.bedAssignments);
  var patients = getPatients();
  var encounters = getEncounters().filter(function(e) { return e.visitType === 'Inpatient' && e.status !== 'Signed'; });

  // Build bed data
  var units = BB_DEFAULT_UNITS.map(function(unit) {
    var beds = [];
    for (var i = 1; i <= unit.beds; i++) {
      var bedNum = unit.prefix + '-' + String(i).padStart(2, '0');
      var assignment = assignments.find(function(a) { return a.bed === bedNum; });
      var patient = null, encounter = null;
      if (assignment) {
        patient = patients.find(function(p) { return p.id === assignment.patientId; });
        encounter = encounters.find(function(e) { return e.patientId === assignment.patientId; });
      }
      beds.push({
        number: bedNum,
        status: assignment ? (assignment.status || 'occupied') : 'available',
        patient: patient,
        encounter: encounter,
        acuity: assignment ? (assignment.acuity || 2) : 0,
        attending: assignment ? (assignment.attending || '') : '',
        patientId: assignment ? assignment.patientId : null
      });
    }
    return { name: unit.name, prefix: unit.prefix, beds: beds };
  });

  var totalBeds = 0, occupied = 0, available = 0, cleaning = 0, blocked = 0;
  units.forEach(function(u) {
    u.beds.forEach(function(b) {
      totalBeds++;
      if (b.status === 'occupied') occupied++;
      else if (b.status === 'available') available++;
      else if (b.status === 'cleaning') cleaning++;
      else if (b.status === 'blocked') blocked++;
    });
  });

  var html = '<div class="bb-wrap">';
  html += '<div class="bb-header"><h2>Bed Board</h2>';
  html += '<span style="color:var(--text-secondary,#666);font-size:14px">Census: ' + occupied + '/' + totalBeds + ' (' + Math.round(occupied/totalBeds*100) + '% occupancy)</span></div>';

  html += '<div class="bb-legend">';
  html += '<div class="bb-legend-item"><div class="bb-legend-swatch bb-occupied"></div> Occupied</div>';
  html += '<div class="bb-legend-item"><div class="bb-legend-swatch bb-available"></div> Available</div>';
  html += '<div class="bb-legend-item"><div class="bb-legend-swatch bb-cleaning"></div> Cleaning</div>';
  html += '<div class="bb-legend-item"><div class="bb-legend-swatch bb-blocked"></div> Blocked</div>';
  html += '</div>';

  html += '<div class="bb-stats">';
  html += '<div class="bb-stat"><h4>Total Beds</h4><div class="bb-stat-val">' + totalBeds + '</div></div>';
  html += '<div class="bb-stat"><h4>Occupied</h4><div class="bb-stat-val" style="color:var(--badge-info-text)">' + occupied + '</div></div>';
  html += '<div class="bb-stat"><h4>Available</h4><div class="bb-stat-val" style="color:var(--badge-success-text)">' + available + '</div></div>';
  html += '<div class="bb-stat"><h4>Cleaning</h4><div class="bb-stat-val" style="color:var(--badge-warning-text)">' + cleaning + '</div></div>';
  html += '<div class="bb-stat"><h4>Blocked</h4><div class="bb-stat-val" style="color:var(--badge-danger-text)">' + blocked + '</div></div>';
  html += '</div>';

  units.forEach(function(unit) {
    var unitOcc = unit.beds.filter(function(b) { return b.status === 'occupied'; }).length;
    html += '<div class="bb-unit">';
    html += '<div class="bb-unit-header"><h3>' + esc(unit.name) + '</h3><span style="font-size:13px;color:var(--text-secondary,#666)">' + unitOcc + '/' + unit.beds.length + ' occupied</span></div>';
    html += '<div class="bb-bed-grid">';

    unit.beds.forEach(function(bed) {
      html += '<div class="bb-bed bb-' + bed.status + '" data-bed="' + esc(bed.number) + '">';
      html += '<div class="bb-bed-number">' + esc(bed.number) + '</div>';
      if (bed.patient) {
        html += '<div class="bb-bed-patient">';
        html += '<strong>' + esc(bed.patient.lastName + ', ' + bed.patient.firstName) + '</strong>';
        /* 4h: Acuity badge is clickable for in-place edit */
        if (bed.acuity) html += '<span class="bb-acuity bb-acuity-' + bed.acuity + ' bb-acuity-edit" data-bed="' + esc(bed.number) + '" data-acuity="' + bed.acuity + '">Acuity ' + bed.acuity + '</span>';
        if (bed.attending) html += '<br><span style="color:var(--text-secondary,#666)">Dr. ' + esc(bed.attending) + '</span>';
        /* 4f: Enhanced bed tile badges */
        var badges = _bbGetBadgeData(bed.patient, bed.patientId);
        html += _bbRenderBadges(badges);
        html += '</div>';
      } else if (bed.status === 'cleaning') {
        html += '<div class="bb-bed-patient" style="color:var(--badge-warning-text)">Cleaning in progress</div>';
      } else if (bed.status === 'blocked') {
        html += '<div class="bb-bed-patient" style="color:var(--badge-danger-text)">Blocked</div>';
      } else {
        html += '<div class="bb-bed-patient" style="color:var(--badge-success-text)">Available</div>';
      }
      html += '</div>';
    });

    html += '</div></div>';
  });

  html += '</div>';
  app.innerHTML = html;

  /* --- 4h: Wire acuity badge clicks for in-place edit --- */
  app.querySelectorAll('.bb-acuity-edit').forEach(function(acuityEl) {
    acuityEl.addEventListener('click', function(e) {
      e.stopPropagation();
      // Remove any existing dropdown
      var existing = document.querySelector('.bb-acuity-dropdown');
      if (existing) existing.remove();

      var bedNum = this.getAttribute('data-bed');
      var currentAcuity = parseInt(this.getAttribute('data-acuity')) || 2;
      var rect = this.getBoundingClientRect();

      var dropdown = document.createElement('div');
      dropdown.className = 'bb-acuity-dropdown';
      dropdown.style.top = (rect.bottom + 4) + 'px';
      dropdown.style.left = rect.left + 'px';

      var levels = [
        { val: 1, label: '1 - Minimal' },
        { val: 2, label: '2 - Low' },
        { val: 3, label: '3 - Moderate' },
        { val: 4, label: '4 - High' },
        { val: 5, label: '5 - Critical' }
      ];

      levels.forEach(function(lv) {
        var item = document.createElement('div');
        item.className = 'bb-acuity-dropdown-item' + (lv.val === currentAcuity ? ' active' : '');
        item.textContent = lv.label;
        item.addEventListener('click', function(ev) {
          ev.stopPropagation();
          // Update the bed assignment acuity
          var allAssign = loadAll(KEYS.bedAssignments, true);
          for (var ai = 0; ai < allAssign.length; ai++) {
            if (allAssign[ai].bed === bedNum) {
              allAssign[ai].acuity = lv.val;
              break;
            }
          }
          saveAll(KEYS.bedAssignments, allAssign);
          dropdown.remove();
          showToast('Acuity updated to ' + lv.val + ' for bed ' + bedNum, 'success');
          renderBedBoard();
        });
        dropdown.appendChild(item);
      });

      document.body.appendChild(dropdown);

      // Close dropdown on outside click
      var closeDropdown = function(ev) {
        if (!dropdown.contains(ev.target)) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      };
      setTimeout(function() { document.addEventListener('click', closeDropdown); }, 0);
    });
  });

  // Wire bed clicks
  app.querySelectorAll('.bb-bed').forEach(function(bedEl) {
    bedEl.addEventListener('click', function(e) {
      // Don't trigger if an acuity badge or dropdown was clicked
      if (e.target.classList.contains('bb-acuity-edit') || e.target.classList.contains('bb-acuity-dropdown-item')) return;

      var bedNum = this.getAttribute('data-bed');
      var bed = null;
      units.forEach(function(u) { u.beds.forEach(function(b) { if (b.number === bedNum) bed = b; }); });
      if (!bed) return;

      if (bed.status === 'occupied' && bed.patient) {
        /* 4g: Show popover instead of immediate navigation */
        _bbShowPopover(bed, e);
      } else if (bed.status === 'available') {
        // Assign patient modal
        var unassignedPts = encounters.filter(function(enc) {
          return !assignments.find(function(a) { return a.patientId === enc.patientId; });
        });
        if (!unassignedPts.length) { showToast('No unassigned inpatients', 'warning'); return; }

        var body = '<label>Assign Patient:<select id="bb-assign-pt" class="form-control">';
        unassignedPts.forEach(function(enc) {
          var pt = patients.find(function(p) { return p.id === enc.patientId; });
          if (pt) body += '<option value="' + pt.id + '">' + esc(pt.lastName + ', ' + pt.firstName) + '</option>';
        });
        body += '</select></label>';
        body += '<label style="margin-top:8px">Acuity:<select id="bb-assign-acuity" class="form-control"><option value="1">1 - Minimal</option><option value="2" selected>2 - Low</option><option value="3">3 - Moderate</option><option value="4">4 - High</option><option value="5">5 - Critical</option></select></label>';

        openModal({
          title: 'Assign to Bed ' + bedNum,
          bodyHTML: body,
          footerHTML: '<button class="btn btn-primary" id="bb-confirm-assign">Assign</button>'
        });

        document.getElementById('bb-confirm-assign').addEventListener('click', function() {
          var ptId = document.getElementById('bb-assign-pt').value;
          var acuity = parseInt(document.getElementById('bb-assign-acuity').value);
          var all = loadAll(KEYS.bedAssignments, true);
          all.push({ id: generateId(), bed: bedNum, patientId: ptId, acuity: acuity, status: 'occupied', assignedAt: new Date().toISOString(), assignedBy: getSessionUser().id });
          saveAll(KEYS.bedAssignments, all);
          closeAllModals();
          showToast('Patient assigned to ' + bedNum, 'success');
          renderBedBoard();
        });
      }
    });
  });

  /* --- 4g: Quick-summary popover function --- */
  function _bbShowPopover(bed, evt) {
    // Remove any existing popover
    var existingPopover = document.querySelector('.bb-popover');
    if (existingPopover) existingPopover.remove();

    var pt = bed.patient;
    var pid = bed.patientId;
    var badges = _bbGetBadgeData(pt, pid);

    // Get latest vitals
    var vitalsHtml = '<dd style="color:var(--text-secondary,#666)">No vitals available</dd>';
    try {
      var vitalData = getLatestVitalsByPatient(pid);
      if (vitalData && vitalData.vitals) {
        var v = vitalData.vitals;
        var parts = [];
        if (v.bpSystolic && v.bpDiastolic) parts.push('BP: ' + v.bpSystolic + '/' + v.bpDiastolic);
        if (v.heartRate) parts.push('HR: ' + v.heartRate);
        if (v.spo2) parts.push('SpO2: ' + v.spo2 + '%');
        if (v.tempF) parts.push('Temp: ' + v.tempF + '&deg;F');
        if (v.respiratoryRate) parts.push('RR: ' + v.respiratoryRate);
        if (parts.length > 0) {
          vitalsHtml = '<dd>' + parts.join(' &bull; ') + '</dd>';
        }
      }
    } catch(e) { /* no-op */ }

    // Active medication count
    var activeMedCount = 0;
    try {
      var meds = getOrders().filter(function(o) {
        return o.patientId === pid && o.type === 'Medication' && o.status !== 'Cancelled' && o.status !== 'Completed';
      });
      activeMedCount = meds.length;
    } catch(e) { /* no-op */ }

    // Pending orders count
    var pendingOrders = 0;
    try {
      var pOrders = getOrders().filter(function(o) {
        return o.patientId === pid && o.status === 'Pending';
      });
      pendingOrders = pOrders.length;
    } catch(e) { /* no-op */ }

    // Calculate age
    var ageStr = '';
    if (pt && pt.dob) {
      var dob = new Date(pt.dob);
      var today = new Date();
      var age = today.getFullYear() - dob.getFullYear();
      var m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      ageStr = age + ' yo';
    }

    var popover = document.createElement('div');
    popover.className = 'bb-popover';

    var headerHtml = '<div class="bb-popover-header">';
    headerHtml += '<h4>' + esc(pt.lastName + ', ' + pt.firstName) + '</h4>';
    headerHtml += '<button class="bb-popover-close" id="bb-popover-close">&times;</button>';
    headerHtml += '</div>';

    var bodyHtml = '<div class="bb-popover-body"><dl style="margin:0">';
    bodyHtml += '<dt>Patient Info</dt>';
    bodyHtml += '<dd>' + (pt.mrn ? 'MRN: ' + esc(pt.mrn) : '') + (ageStr ? ' &bull; ' + ageStr : '') + (pt.sex ? ' &bull; ' + esc(pt.sex) : '') + '</dd>';
    bodyHtml += '<dt>Latest Vitals</dt>';
    bodyHtml += vitalsHtml;
    bodyHtml += '<dt>Medications</dt>';
    bodyHtml += '<dd>' + activeMedCount + ' active medication' + (activeMedCount !== 1 ? 's' : '') + '</dd>';
    bodyHtml += '<dt>Pending Orders</dt>';
    bodyHtml += '<dd>' + pendingOrders + ' pending</dd>';
    bodyHtml += '<dt>Code Status</dt>';
    bodyHtml += '<dd>' + esc(badges.codeStatus) + '</dd>';
    bodyHtml += '<dt>Bed / Acuity</dt>';
    bodyHtml += '<dd>' + esc(bed.number) + ' &bull; Acuity ' + bed.acuity + '</dd>';
    bodyHtml += '</dl></div>';

    var footerHtml = '<div class="bb-popover-footer">';
    footerHtml += '<button class="btn btn-primary btn-sm" id="bb-popover-open-chart">Open Chart</button>';
    footerHtml += '</div>';

    popover.innerHTML = headerHtml + bodyHtml + footerHtml;

    // Position the popover near the click
    document.body.appendChild(popover);
    var popRect = popover.getBoundingClientRect();
    var x = evt.clientX;
    var y = evt.clientY;
    // Keep within viewport
    if (x + popRect.width > window.innerWidth) x = window.innerWidth - popRect.width - 16;
    if (y + popRect.height > window.innerHeight) y = window.innerHeight - popRect.height - 16;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    popover.style.left = x + 'px';
    popover.style.top = y + 'px';

    // Wire close button
    document.getElementById('bb-popover-close').addEventListener('click', function(e) {
      e.stopPropagation();
      popover.remove();
    });

    // Wire "Open Chart" button
    document.getElementById('bb-popover-open-chart').addEventListener('click', function(e) {
      e.stopPropagation();
      popover.remove();
      navigate('#chart/' + pid);
    });

    // Close popover on outside click
    var closePopover = function(ev) {
      if (!popover.contains(ev.target)) {
        popover.remove();
        document.removeEventListener('click', closePopover);
      }
    };
    setTimeout(function() { document.addEventListener('click', closePopover); }, 0);
  }
}
