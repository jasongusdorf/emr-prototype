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
    '.bb-bed-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:0; border:1px solid var(--border,#ddd); border-radius:0 0 var(--radius,8px) var(--radius,8px); }',
    '.bb-bed { padding:12px; border:1px solid var(--border,#ddd); cursor:pointer; min-height:90px; transition:box-shadow 0.15s; }',
    '.bb-bed:hover { box-shadow:0 2px 8px rgba(0,0,0,0.1); z-index:1; }',
    '.bb-bed-number { font-weight:700; font-size:14px; margin-bottom:4px; }',
    '.bb-bed-patient { font-size:12px; line-height:1.4; }',
    '.bb-occupied { background:#e8f4fd; border-color:#b8daff; }',
    '.bb-available { background:#d4edda; border-color:#c3e6cb; }',
    '.bb-cleaning { background:#fff3cd; border-color:#ffeaa7; }',
    '.bb-blocked { background:#f8d7da; border-color:#f5c6cb; }',
    '.bb-legend { display:flex; gap:16px; margin-bottom:16px; font-size:13px; }',
    '.bb-legend-item { display:flex; align-items:center; gap:4px; }',
    '.bb-legend-swatch { width:16px; height:16px; border-radius:3px; border:1px solid var(--border,#ddd); }',
    '.bb-acuity { display:inline-block; padding:1px 6px; border-radius:3px; font-size:11px; font-weight:600; margin-left:4px; }',
    '.bb-acuity-1 { background:#d4edda; color:#155724; }',
    '.bb-acuity-2 { background:#cce5ff; color:#004085; }',
    '.bb-acuity-3 { background:#fff3cd; color:#856404; }',
    '.bb-acuity-4 { background:#f8d7da; color:#721c24; }',
    '.bb-acuity-5 { background:#721c24; color:#fff; }'
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
        attending: assignment ? (assignment.attending || '') : ''
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
  html += '<div class="bb-stat"><h4>Occupied</h4><div class="bb-stat-val" style="color:#004085">' + occupied + '</div></div>';
  html += '<div class="bb-stat"><h4>Available</h4><div class="bb-stat-val" style="color:#155724">' + available + '</div></div>';
  html += '<div class="bb-stat"><h4>Cleaning</h4><div class="bb-stat-val" style="color:#856404">' + cleaning + '</div></div>';
  html += '<div class="bb-stat"><h4>Blocked</h4><div class="bb-stat-val" style="color:#721c24">' + blocked + '</div></div>';
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
        if (bed.acuity) html += '<span class="bb-acuity bb-acuity-' + bed.acuity + '">Acuity ' + bed.acuity + '</span>';
        if (bed.attending) html += '<br><span style="color:var(--text-secondary,#666)">Dr. ' + esc(bed.attending) + '</span>';
        html += '</div>';
      } else if (bed.status === 'cleaning') {
        html += '<div class="bb-bed-patient" style="color:#856404">Cleaning in progress</div>';
      } else if (bed.status === 'blocked') {
        html += '<div class="bb-bed-patient" style="color:#721c24">Blocked</div>';
      } else {
        html += '<div class="bb-bed-patient" style="color:#155724">Available</div>';
      }
      html += '</div>';
    });

    html += '</div></div>';
  });

  html += '</div>';
  app.innerHTML = html;

  // Wire bed clicks
  app.querySelectorAll('.bb-bed').forEach(function(bedEl) {
    bedEl.addEventListener('click', function() {
      var bedNum = this.getAttribute('data-bed');
      var bed = null;
      units.forEach(function(u) { u.beds.forEach(function(b) { if (b.number === bedNum) bed = b; }); });
      if (!bed) return;

      if (bed.status === 'occupied' && bed.patient) {
        navigate('#chart/' + bed.patient.id);
      } else if (bed.status === 'available') {
        // Assign patient modal
        var unassignedPts = encounters.filter(function(e) {
          return !assignments.find(function(a) { return a.patientId === e.patientId; });
        });
        if (!unassignedPts.length) { showToast('No unassigned inpatients', 'warning'); return; }

        var body = '<label>Assign Patient:<select id="bb-assign-pt" class="form-control">';
        unassignedPts.forEach(function(e) {
          var pt = patients.find(function(p) { return p.id === e.patientId; });
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
}
