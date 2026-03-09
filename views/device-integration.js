/* ============================================================
   views/device-integration.js — Device Integration Dashboard
   Simulated real-time device feeds: telemetry, IV pump, ventilator.
   ============================================================ */

/* ---------- Data helpers ---------- */

function getDeviceAssignments() {
  return loadAll(KEYS.deviceAssignments);
}

function getDeviceAssignment(id) {
  return getDeviceAssignments().find(function(d) { return d.id === id; }) || null;
}

function saveDeviceAssignment(data) {
  var all = loadAll(KEYS.deviceAssignments, true);
  var idx = all.findIndex(function(d) { return d.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    if (!data.id) data.id = generateId();
    if (!data.assignedAt) data.assignedAt = new Date().toISOString();
    all.push(data);
  }
  saveAll(KEYS.deviceAssignments, all);
  return data;
}

function removeDeviceAssignment(id) {
  softDeleteRecord(KEYS.deviceAssignments, id);
}

function getDeviceAlarms() {
  return loadAll(KEYS.deviceAlarms);
}

function saveDeviceAlarm(data) {
  var all = loadAll(KEYS.deviceAlarms, true);
  if (!data.id) data.id = generateId();
  if (!data.timestamp) data.timestamp = new Date().toISOString();
  all.push(data);
  saveAll(KEYS.deviceAlarms, all);
  return data;
}

function getAlertThresholds(deviceId) {
  var all = loadAll(KEYS.alertThresholds);
  return all.find(function(t) { return t.deviceId === deviceId; }) || null;
}

function saveAlertThreshold(data) {
  var all = loadAll(KEYS.alertThresholds, true);
  var idx = all.findIndex(function(t) { return t.deviceId === data.deviceId; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    if (!data.id) data.id = generateId();
    all.push(data);
  }
  saveAll(KEYS.alertThresholds, all);
  return data;
}

function seedDeviceAssignments() {
  if (loadAll(KEYS.deviceAssignments).length > 0) return;
  var patients = getPatients();
  var p1 = patients[0], p2 = patients[1];

  var devices = [
    {
      id: generateId(),
      deviceType: 'telemetry',
      deviceName: 'Philips IntelliVue MX800',
      deviceSerial: 'TEL-001',
      patientId: p1 ? p1.id : null,
      patientName: p1 ? p1.lastName + ', ' + p1.firstName : 'Johnson, Alice',
      location: 'ICU Bed 3',
      status: 'Active',
      assignedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      deviceType: 'ivpump',
      deviceName: 'BD Alaris 8015',
      deviceSerial: 'IVP-042',
      patientId: p1 ? p1.id : null,
      patientName: p1 ? p1.lastName + ', ' + p1.firstName : 'Johnson, Alice',
      location: 'ICU Bed 3',
      status: 'Active',
      assignedAt: new Date().toISOString(),
      pumpData: {
        drug: 'Normal Saline 0.9%',
        rate: 125,
        rateUnit: 'mL/hr',
        vtbi: 1000,
        volumeInfused: 375,
        timeRemaining: '5:00',
      },
    },
    {
      id: generateId(),
      deviceType: 'ventilator',
      deviceName: 'Draeger Evita V500',
      deviceSerial: 'VENT-007',
      patientId: p2 ? p2.id : null,
      patientName: p2 ? p2.lastName + ', ' + p2.firstName : 'Kim, Robert',
      location: 'ICU Bed 7',
      status: 'Active',
      assignedAt: new Date().toISOString(),
      ventData: {
        mode: 'AC/VC',
        tidalVolume: 450,
        rate: 14,
        fio2: 40,
        peep: 5,
        peakPressure: 22,
        plateauPressure: 18,
        minuteVentilation: 6.3,
      },
    },
    {
      id: generateId(),
      deviceType: 'telemetry',
      deviceName: 'GE CARESCAPE B650',
      deviceSerial: 'TEL-014',
      patientId: p2 ? p2.id : null,
      patientName: p2 ? p2.lastName + ', ' + p2.firstName : 'Kim, Robert',
      location: 'ICU Bed 7',
      status: 'Active',
      assignedAt: new Date().toISOString(),
    },
  ];

  devices.forEach(function(d) { saveDeviceAssignment(d); });

  // Seed default thresholds
  devices.filter(function(d) { return d.deviceType === 'telemetry'; }).forEach(function(d) {
    saveAlertThreshold({
      deviceId: d.id,
      hrHigh: 120, hrLow: 50,
      spo2Low: 90,
      rrHigh: 30, rrLow: 8,
      sbpHigh: 180, sbpLow: 90,
      dbpHigh: 110, dbpLow: 50,
    });
  });
}

/* ---------- Simulated device data ---------- */

function generateTelemetryData(device) {
  var hr = 60 + Math.floor(Math.random() * 40);
  var rhythms = ['NSR', 'NSR', 'NSR', 'Sinus Tachycardia', 'A-Fib', 'Sinus Bradycardia'];
  var rhythm = hr > 100 ? 'Sinus Tachycardia' : hr < 60 ? 'Sinus Bradycardia' : rhythms[Math.floor(Math.random() * 3)];
  var spo2 = 93 + Math.floor(Math.random() * 7);
  var rr = 12 + Math.floor(Math.random() * 10);
  var sbp = 100 + Math.floor(Math.random() * 50);
  var dbp = 55 + Math.floor(Math.random() * 30);
  var temp = (97.5 + Math.random() * 3).toFixed(1);

  return {
    hr: hr, rhythm: rhythm, spo2: spo2, rr: rr,
    sbp: sbp, dbp: dbp, map: Math.round((sbp + 2 * dbp) / 3),
    temp: parseFloat(temp),
    timestamp: new Date().toISOString(),
  };
}

function generateIVPumpData(device) {
  var data = device.pumpData || {};
  var infused = (data.volumeInfused || 0) + (data.rate || 125) / 360;
  var remaining = Math.max(0, (data.vtbi || 1000) - infused);
  var hrs = Math.floor(remaining / (data.rate || 125));
  var mins = Math.round(((remaining / (data.rate || 125)) - hrs) * 60);

  return {
    drug: data.drug || 'Normal Saline 0.9%',
    rate: data.rate || 125,
    rateUnit: data.rateUnit || 'mL/hr',
    vtbi: data.vtbi || 1000,
    volumeInfused: Math.round(infused),
    timeRemaining: hrs + ':' + String(mins).padStart(2, '0'),
    status: remaining <= 0 ? 'Complete' : 'Infusing',
  };
}

function generateVentData(device) {
  var data = device.ventData || {};
  var tv = (data.tidalVolume || 450) + Math.floor(Math.random() * 30) - 15;
  var rr = (data.rate || 14) + Math.floor(Math.random() * 4) - 2;
  var pp = (data.peakPressure || 22) + Math.floor(Math.random() * 6) - 3;
  var mv = ((tv * rr) / 1000).toFixed(1);

  return {
    mode: data.mode || 'AC/VC',
    tidalVolume: tv,
    rate: Math.max(8, rr),
    fio2: data.fio2 || 40,
    peep: data.peep || 5,
    peakPressure: Math.max(10, pp),
    plateauPressure: Math.max(8, pp - 4),
    minuteVentilation: parseFloat(mv),
  };
}

/* ---------- Main render ---------- */

function renderDeviceIntegration() {
  seedDeviceAssignments();
  var app = document.getElementById('app');

  setTopbar({ title: 'Device Integration', meta: 'Real-Time Device Monitoring' });
  setActiveNav('device-integration');

  var devices = getDeviceAssignments();
  var activeView = 'dashboard';
  var selectedDeviceId = null;
  var _updateTimers = [];

  function render() {
    _updateTimers.forEach(function(t) { clearInterval(t); });
    _updateTimers = [];
    app.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:24px;max-width:1400px;margin:0 auto;';

    // Tab bar
    var tabBar = document.createElement('div');
    tabBar.className = 'devint-tab-bar';
    var tabs = [
      { key: 'dashboard', label: 'Device Dashboard' },
      { key: 'assign', label: 'Assign Device' },
      { key: 'alarms', label: 'Alarm History' },
    ];
    tabs.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'devint-tab' + (t.key === activeView ? ' active' : '');
      btn.textContent = t.label;
      btn.addEventListener('click', function() { activeView = t.key; render(); });
      tabBar.appendChild(btn);
    });
    wrap.appendChild(tabBar);

    if (activeView === 'dashboard') {
      renderDashboardView(wrap);
    } else if (activeView === 'assign') {
      renderAssignView(wrap);
    } else if (activeView === 'alarms') {
      renderAlarmHistory(wrap);
    }

    app.appendChild(wrap);
  }

  function renderDashboardView(container) {
    devices = getDeviceAssignments();

    if (devices.length === 0) {
      container.innerHTML += '<div class="devint-empty">No devices assigned. Go to Assign Device to add one.</div>';
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'devint-grid';

    devices.forEach(function(device) {
      var card = document.createElement('div');
      card.className = 'devint-device-card devint-type-' + device.deviceType;

      var header = document.createElement('div');
      header.className = 'devint-card-header';
      header.innerHTML =
        '<div><strong>' + esc(device.deviceName) + '</strong><br>' +
        '<span style="font-size:11px;color:var(--text-muted);">' + esc(device.deviceSerial) + ' &middot; ' + esc(device.location) + '</span></div>' +
        '<div class="devint-patient-tag">' + esc(device.patientName || 'Unassigned') + '</div>';
      card.appendChild(header);

      var dataDiv = document.createElement('div');
      dataDiv.className = 'devint-card-data';

      function updateData() {
        dataDiv.innerHTML = '';
        if (device.deviceType === 'telemetry') {
          var data = generateTelemetryData(device);
          checkAlarms(device, data);

          dataDiv.innerHTML =
            '<div class="devint-vital devint-vital-hr"><div class="devint-vital-label">HR</div><div class="devint-vital-value">' + data.hr + '</div><div class="devint-vital-unit">bpm</div></div>' +
            '<div class="devint-vital devint-vital-rhythm"><div class="devint-vital-label">Rhythm</div><div class="devint-vital-value devint-rhythm-text">' + esc(data.rhythm) + '</div></div>' +
            '<div class="devint-vital devint-vital-spo2"><div class="devint-vital-label">SpO2</div><div class="devint-vital-value">' + data.spo2 + '</div><div class="devint-vital-unit">%</div></div>' +
            '<div class="devint-vital devint-vital-rr"><div class="devint-vital-label">RR</div><div class="devint-vital-value">' + data.rr + '</div><div class="devint-vital-unit">/min</div></div>' +
            '<div class="devint-vital devint-vital-bp"><div class="devint-vital-label">BP</div><div class="devint-vital-value">' + data.sbp + '/' + data.dbp + '</div><div class="devint-vital-unit">mmHg (MAP ' + data.map + ')</div></div>' +
            '<div class="devint-vital devint-vital-temp"><div class="devint-vital-label">Temp</div><div class="devint-vital-value">' + data.temp + '</div><div class="devint-vital-unit">&deg;F</div></div>';

          // Waveform simulation
          var waveDiv = document.createElement('div');
          waveDiv.className = 'devint-waveform';
          var waveSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          waveSvg.setAttribute('viewBox', '0 0 300 40');
          waveSvg.setAttribute('class', 'devint-ecg-wave');
          var path = 'M0,20';
          for (var i = 0; i < 300; i += 2) {
            var t = (i + Date.now() * 0.05) % 100;
            var y = 20;
            if (t > 15 && t < 20) y = 20 - 3;
            else if (t > 25 && t < 30) y = 20 + 15;
            else if (t > 30 && t < 35) y = 20 - 18;
            else if (t > 35 && t < 40) y = 20 + 8;
            else if (t > 45 && t < 55) y = 20 - 2;
            path += ' L' + i + ',' + y;
          }
          var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pathEl.setAttribute('d', path);
          pathEl.setAttribute('fill', 'none');
          pathEl.setAttribute('stroke', '#00ff00');
          pathEl.setAttribute('stroke-width', '1.5');
          waveSvg.appendChild(pathEl);
          waveDiv.appendChild(waveSvg);
          dataDiv.appendChild(waveDiv);

        } else if (device.deviceType === 'ivpump') {
          var pData = generateIVPumpData(device);
          dataDiv.innerHTML =
            '<div class="devint-vital"><div class="devint-vital-label">Drug</div><div class="devint-vital-value devint-drug-text">' + esc(pData.drug) + '</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Rate</div><div class="devint-vital-value">' + pData.rate + '</div><div class="devint-vital-unit">' + esc(pData.rateUnit) + '</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">VTBI</div><div class="devint-vital-value">' + pData.vtbi + '</div><div class="devint-vital-unit">mL</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Infused</div><div class="devint-vital-value">' + pData.volumeInfused + '</div><div class="devint-vital-unit">mL</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Time Left</div><div class="devint-vital-value">' + esc(pData.timeRemaining) + '</div><div class="devint-vital-unit">hr:min</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Status</div><div class="devint-vital-value devint-pump-status-' + pData.status.toLowerCase() + '">' + esc(pData.status) + '</div></div>';

          // Progress bar
          var pct = Math.round((pData.volumeInfused / pData.vtbi) * 100);
          dataDiv.innerHTML += '<div class="devint-progress-bar"><div class="devint-progress-fill" style="width:' + pct + '%;"></div></div>';

        } else if (device.deviceType === 'ventilator') {
          var vData = generateVentData(device);
          dataDiv.innerHTML =
            '<div class="devint-vital"><div class="devint-vital-label">Mode</div><div class="devint-vital-value devint-mode-text">' + esc(vData.mode) + '</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Vt</div><div class="devint-vital-value">' + vData.tidalVolume + '</div><div class="devint-vital-unit">mL</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Rate</div><div class="devint-vital-value">' + vData.rate + '</div><div class="devint-vital-unit">/min</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">FiO2</div><div class="devint-vital-value">' + vData.fio2 + '</div><div class="devint-vital-unit">%</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">PEEP</div><div class="devint-vital-value">' + vData.peep + '</div><div class="devint-vital-unit">cmH2O</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Ppeak</div><div class="devint-vital-value">' + vData.peakPressure + '</div><div class="devint-vital-unit">cmH2O</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">Pplat</div><div class="devint-vital-value">' + vData.plateauPressure + '</div><div class="devint-vital-unit">cmH2O</div></div>' +
            '<div class="devint-vital"><div class="devint-vital-label">MV</div><div class="devint-vital-value">' + vData.minuteVentilation + '</div><div class="devint-vital-unit">L/min</div></div>';
        }
      }

      updateData();
      var timer = setInterval(updateData, 3000);
      _updateTimers.push(timer);

      card.appendChild(dataDiv);

      // Actions
      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'devint-card-actions';

      if (device.deviceType === 'telemetry') {
        var threshBtn = document.createElement('button');
        threshBtn.className = 'btn btn-secondary btn-sm';
        threshBtn.textContent = 'Thresholds';
        threshBtn.addEventListener('click', function() { openThresholdsModal(device); });
        actionsDiv.appendChild(threshBtn);

        var vitalsBtn = document.createElement('button');
        vitalsBtn.className = 'btn btn-primary btn-sm';
        vitalsBtn.textContent = 'Save to Vitals';
        vitalsBtn.addEventListener('click', function() {
          if (!device.patientId) {
            showToast('No patient assigned', 'warning');
            return;
          }
          var data = generateTelemetryData(device);
          if (typeof saveEncounterVitals === 'function') {
            var encounters = loadAll(KEYS.encounters).filter(function(e) { return e.patientId === device.patientId && e.status === 'Open'; });
            var enc = encounters[0];
            saveEncounterVitals({
              encounterId: enc ? enc.id : null,
              patientId: device.patientId,
              bpSystolic: String(data.sbp),
              bpDiastolic: String(data.dbp),
              heartRate: String(data.hr),
              respiratoryRate: String(data.rr),
              tempF: String(data.temp),
              spo2: String(data.spo2),
              recordedAt: new Date().toISOString(),
              recordedBy: 'Device: ' + device.deviceName,
            });
            showToast('Vitals saved from device data', 'success');
          }
        });
        actionsDiv.appendChild(vitalsBtn);
      }

      var removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', function() {
        removeDeviceAssignment(device.id);
        devices = getDeviceAssignments();
        render();
        showToast('Device removed', 'warning');
      });
      actionsDiv.appendChild(removeBtn);

      card.appendChild(actionsDiv);
      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  function checkAlarms(device, data) {
    var thresholds = getAlertThresholds(device.id);
    if (!thresholds) return;

    var alarms = [];
    if (data.hr > thresholds.hrHigh) alarms.push('HR High: ' + data.hr + ' > ' + thresholds.hrHigh);
    if (data.hr < thresholds.hrLow) alarms.push('HR Low: ' + data.hr + ' < ' + thresholds.hrLow);
    if (data.spo2 < thresholds.spo2Low) alarms.push('SpO2 Low: ' + data.spo2 + ' < ' + thresholds.spo2Low);
    if (data.rr > thresholds.rrHigh) alarms.push('RR High: ' + data.rr + ' > ' + thresholds.rrHigh);
    if (data.rr < thresholds.rrLow) alarms.push('RR Low: ' + data.rr + ' < ' + thresholds.rrLow);
    if (data.sbp > thresholds.sbpHigh) alarms.push('SBP High: ' + data.sbp + ' > ' + thresholds.sbpHigh);
    if (data.sbp < thresholds.sbpLow) alarms.push('SBP Low: ' + data.sbp + ' < ' + thresholds.sbpLow);

    alarms.forEach(function(msg) {
      saveDeviceAlarm({
        deviceId: device.id,
        deviceName: device.deviceName,
        patientName: device.patientName,
        patientId: device.patientId,
        alarm: msg,
        severity: msg.indexOf('SpO2') >= 0 || msg.indexOf('HR') >= 0 ? 'critical' : 'warning',
      });
    });
  }

  function openThresholdsModal(device) {
    var thresholds = getAlertThresholds(device.id) || {};

    var bodyHTML =
      '<div class="devint-thresh-grid">' +
      '<div class="form-group"><label>HR High</label><input type="number" id="thresh-hr-high" class="form-control" value="' + (thresholds.hrHigh || 120) + '" /></div>' +
      '<div class="form-group"><label>HR Low</label><input type="number" id="thresh-hr-low" class="form-control" value="' + (thresholds.hrLow || 50) + '" /></div>' +
      '<div class="form-group"><label>SpO2 Low</label><input type="number" id="thresh-spo2-low" class="form-control" value="' + (thresholds.spo2Low || 90) + '" /></div>' +
      '<div class="form-group"><label>RR High</label><input type="number" id="thresh-rr-high" class="form-control" value="' + (thresholds.rrHigh || 30) + '" /></div>' +
      '<div class="form-group"><label>RR Low</label><input type="number" id="thresh-rr-low" class="form-control" value="' + (thresholds.rrLow || 8) + '" /></div>' +
      '<div class="form-group"><label>SBP High</label><input type="number" id="thresh-sbp-high" class="form-control" value="' + (thresholds.sbpHigh || 180) + '" /></div>' +
      '<div class="form-group"><label>SBP Low</label><input type="number" id="thresh-sbp-low" class="form-control" value="' + (thresholds.sbpLow || 90) + '" /></div>' +
      '<div class="form-group"><label>DBP High</label><input type="number" id="thresh-dbp-high" class="form-control" value="' + (thresholds.dbpHigh || 110) + '" /></div>' +
      '</div>';

    openModal({
      title: 'Alert Thresholds — ' + esc(device.deviceName),
      bodyHTML: bodyHTML,
      footerHTML:
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" id="thresh-save-btn">Save Thresholds</button>',
    });

    setTimeout(function() {
      var saveBtn = document.getElementById('thresh-save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          saveAlertThreshold({
            deviceId: device.id,
            hrHigh: parseInt(document.getElementById('thresh-hr-high').value, 10),
            hrLow: parseInt(document.getElementById('thresh-hr-low').value, 10),
            spo2Low: parseInt(document.getElementById('thresh-spo2-low').value, 10),
            rrHigh: parseInt(document.getElementById('thresh-rr-high').value, 10),
            rrLow: parseInt(document.getElementById('thresh-rr-low').value, 10),
            sbpHigh: parseInt(document.getElementById('thresh-sbp-high').value, 10),
            sbpLow: parseInt(document.getElementById('thresh-sbp-low').value, 10),
            dbpHigh: parseInt(document.getElementById('thresh-dbp-high').value, 10),
          });
          closeModal();
          showToast('Thresholds saved', 'success');
        });
      }
    }, 100);
  }

  function renderAssignView(container) {
    var patients = getPatients();
    var html = '<div class="devint-assign-form">' +
      '<h4>Assign New Device</h4>' +
      '<div class="form-group"><label>Device Type</label><select id="dev-type" class="form-control"><option value="telemetry">Telemetry Monitor</option><option value="ivpump">IV Pump</option><option value="ventilator">Ventilator</option></select></div>' +
      '<div class="form-group"><label>Device Name</label><input type="text" id="dev-name" class="form-control" placeholder="e.g., Philips IntelliVue MX800" /></div>' +
      '<div class="form-group"><label>Serial Number</label><input type="text" id="dev-serial" class="form-control" placeholder="e.g., TEL-015" /></div>' +
      '<div class="form-group"><label>Patient</label><select id="dev-patient" class="form-control"><option value="">-- Select Patient --</option>';
    patients.forEach(function(p) {
      html += '<option value="' + esc(p.id) + '">' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
    });
    html += '</select></div>' +
      '<div class="form-group"><label>Location</label><input type="text" id="dev-location" class="form-control" placeholder="e.g., ICU Bed 5" /></div>' +
      '<button class="btn btn-primary" id="dev-assign-btn">Assign Device</button>' +
      '</div>';

    container.innerHTML += html;

    setTimeout(function() {
      var assignBtn = document.getElementById('dev-assign-btn');
      if (assignBtn) {
        assignBtn.addEventListener('click', function() {
          var type = document.getElementById('dev-type').value;
          var name = document.getElementById('dev-name').value.trim();
          var serial = document.getElementById('dev-serial').value.trim();
          var patientId = document.getElementById('dev-patient').value;
          var location = document.getElementById('dev-location').value.trim();

          if (!name || !serial) {
            showToast('Device name and serial required', 'warning');
            return;
          }

          var pat = patientId ? getPatient(patientId) : null;

          var deviceData = {
            deviceType: type,
            deviceName: name,
            deviceSerial: serial,
            patientId: patientId || null,
            patientName: pat ? pat.lastName + ', ' + pat.firstName : 'Unassigned',
            location: location,
            status: 'Active',
          };

          if (type === 'ivpump') {
            deviceData.pumpData = { drug: 'Normal Saline 0.9%', rate: 125, rateUnit: 'mL/hr', vtbi: 1000, volumeInfused: 0, timeRemaining: '8:00' };
          }
          if (type === 'ventilator') {
            deviceData.ventData = { mode: 'AC/VC', tidalVolume: 450, rate: 14, fio2: 40, peep: 5, peakPressure: 22, plateauPressure: 18, minuteVentilation: 6.3 };
          }

          saveDeviceAssignment(deviceData);

          if (type === 'telemetry') {
            saveAlertThreshold({
              deviceId: deviceData.id,
              hrHigh: 120, hrLow: 50, spo2Low: 90, rrHigh: 30, rrLow: 8, sbpHigh: 180, sbpLow: 90, dbpHigh: 110,
            });
          }

          devices = getDeviceAssignments();
          activeView = 'dashboard';
          render();
          showToast('Device assigned successfully', 'success');
        });
      }
    }, 100);
  }

  function renderAlarmHistory(container) {
    var alarms = getDeviceAlarms().sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); }).slice(0, 100);

    if (alarms.length === 0) {
      container.innerHTML += '<div class="devint-empty">No alarms recorded.</div>';
      return;
    }

    var html = '<table class="devint-alarm-table"><thead><tr><th>Time</th><th>Device</th><th>Patient</th><th>Alarm</th><th>Severity</th></tr></thead><tbody>';
    alarms.forEach(function(a) {
      var d = new Date(a.timestamp);
      var sevClass = a.severity === 'critical' ? 'devint-alarm-critical' : 'devint-alarm-warning';
      html += '<tr class="' + sevClass + '">' +
        '<td>' + d.toLocaleString() + '</td>' +
        '<td>' + esc(a.deviceName) + '</td>' +
        '<td>' + esc(a.patientName) + '</td>' +
        '<td>' + esc(a.alarm) + '</td>' +
        '<td><span class="devint-alarm-badge ' + sevClass + '">' + esc(a.severity) + '</span></td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML += html;
  }

  render();

  registerCleanup(function() {
    _updateTimers.forEach(function(t) { clearInterval(t); });
    _updateTimers = [];
  });
}
