/* ============================================================
   views/schedule.js — Appointment scheduling calendar
   ============================================================ */

let _scheduleWeekStart = null;
let _scheduleView      = 'week'; // 'week' | 'day'
let _scheduleDayDate   = null;
let _scheduleProviderFilter = '';

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(monday) {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  const yearOpts = { month: 'short', day: 'numeric', year: 'numeric' };
  if (monday.getFullYear() === sun.getFullYear()) {
    return monday.toLocaleDateString('en-US', opts) + ' – ' + sun.toLocaleDateString('en-US', yearOpts);
  }
  return monday.toLocaleDateString('en-US', yearOpts) + ' – ' + sun.toLocaleDateString('en-US', yearOpts);
}

function checkAppointmentConflict(providerId, dateTime, duration, excludeId) {
  const appts = getAppointmentsByProvider(providerId).filter(a =>
    a.id !== excludeId && a.status !== 'Cancelled' && a.status !== 'No-Show'
  );
  const newStart = new Date(dateTime).getTime();
  const newEnd   = newStart + (duration || 30) * 60 * 1000;
  return appts.filter(a => {
    const aStart = new Date(a.dateTime).getTime();
    const aEnd   = aStart + (a.duration || 30) * 60 * 1000;
    return newStart < aEnd && newEnd > aStart;
  });
}

function formatTimeSlot(hour, min) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return h + ':' + String(min).padStart(2, '0') + ' ' + ampm;
}

function renderSchedule() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  if (getEncounterMode() === 'inpatient') {
    setTopbar({ title: 'Schedule', meta: '', actions: '' });
    setActiveNav('schedule');
    app.appendChild(buildEmptyState('', 'Not available', 'Schedule is only available in Outpatient mode.'));
    return;
  }

  if (!_scheduleWeekStart) _scheduleWeekStart = getMonday(new Date());
  if (!_scheduleDayDate) _scheduleDayDate = new Date();

  setTopbar({
    title:   'Schedule',
    meta:    '',
    actions: '<button class="btn btn-primary btn-sm" id="btn-new-appt">+ New Appointment</button>',
  });
  setActiveNav('schedule');

  // Header
  const header = document.createElement('div');
  header.className = 'schedule-header';

  // Nav
  const nav = document.createElement('div');
  nav.className = 'schedule-nav';

  const prevBtn = makeScheduleBtn('‹ Prev', () => {
    if (_scheduleView === 'week') {
      _scheduleWeekStart.setDate(_scheduleWeekStart.getDate() - 7);
    } else {
      _scheduleDayDate.setDate(_scheduleDayDate.getDate() - 1);
      _scheduleWeekStart = getMonday(_scheduleDayDate);
    }
    renderSchedule();
  });
  const todayBtn = makeScheduleBtn('Today', () => {
    _scheduleWeekStart = getMonday(new Date());
    _scheduleDayDate = new Date();
    renderSchedule();
  });
  const nextBtn = makeScheduleBtn('Next ›', () => {
    if (_scheduleView === 'week') {
      _scheduleWeekStart.setDate(_scheduleWeekStart.getDate() + 7);
    } else {
      _scheduleDayDate.setDate(_scheduleDayDate.getDate() + 1);
      _scheduleWeekStart = getMonday(_scheduleDayDate);
    }
    renderSchedule();
  });

  const dateLabel = document.createElement('span');
  dateLabel.className = 'date-range';
  if (_scheduleView === 'week') {
    dateLabel.textContent = formatWeekRange(_scheduleWeekStart);
  } else {
    dateLabel.textContent = _scheduleDayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  nav.appendChild(prevBtn);
  nav.appendChild(todayBtn);
  nav.appendChild(nextBtn);
  nav.appendChild(dateLabel);
  header.appendChild(nav);

  // Controls
  const controls = document.createElement('div');
  controls.className = 'schedule-controls';

  const weekBtn = makeScheduleBtn('Week', () => { _scheduleView = 'week'; renderSchedule(); });
  const dayBtn  = makeScheduleBtn('Day',  () => { _scheduleView = 'day'; renderSchedule(); });
  if (_scheduleView === 'week') weekBtn.classList.add('active');
  else dayBtn.classList.add('active');
  weekBtn.className += ' btn btn-sm ' + (_scheduleView === 'week' ? 'btn-primary' : 'btn-secondary');
  dayBtn.className  += ' btn btn-sm ' + (_scheduleView === 'day'  ? 'btn-primary' : 'btn-secondary');

  // Provider filter
  const provSelect = document.createElement('select');
  provSelect.className = 'form-control';
  provSelect.style.cssText = 'width:auto;font-size:12px;padding:4px 8px';
  provSelect.innerHTML = '<option value="">All Providers</option>';
  getProviders().forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.lastName + ', ' + p.firstName;
    if (_scheduleProviderFilter === p.id) opt.selected = true;
    provSelect.appendChild(opt);
  });
  provSelect.onchange = () => { _scheduleProviderFilter = provSelect.value; renderSchedule(); };

  controls.appendChild(weekBtn);
  controls.appendChild(dayBtn);
  controls.appendChild(provSelect);
  header.appendChild(controls);
  app.appendChild(header);

  // Grid
  if (_scheduleView === 'week') {
    app.appendChild(buildWeekGrid(_scheduleWeekStart, _scheduleProviderFilter));
  } else {
    app.appendChild(buildDayGrid(_scheduleDayDate, _scheduleProviderFilter));
  }

  // New Appointment button
  document.getElementById('btn-new-appt').addEventListener('click', () => openAppointmentModal({}));
}

function makeScheduleBtn(text, onclick) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary btn-sm';
  btn.textContent = text;
  btn.addEventListener('click', onclick);
  return btn;
}

function buildWeekGrid(weekStart, providerFilter) {
  const grid = document.createElement('div');
  grid.className = 'schedule-grid schedule-grid-week';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch appointments for the week
  const pad = n => String(n).padStart(2, '0');
  const mondayStr = weekStart.getFullYear() + '-' + pad(weekStart.getMonth() + 1) + '-' + pad(weekStart.getDate());
  let appts = getAppointmentsByWeek(mondayStr);
  if (providerFilter) appts = appts.filter(a => a.providerId === providerFilter);

  // Corner cell
  const corner = document.createElement('div');
  corner.className = 'schedule-corner';
  grid.appendChild(corner);

  // Day headers (Mon-Sun)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dayDates.push(d);
    const hdr = document.createElement('div');
    hdr.className = 'schedule-day-header';
    if (d.getTime() === today.getTime()) hdr.classList.add('today');
    if (i >= 5) hdr.classList.add('weekend');
    hdr.textContent = dayNames[i] + ' ' + (d.getMonth() + 1) + '/' + d.getDate();
    grid.appendChild(hdr);
  }

  // Time rows: 8am to 5pm (half-hour slots)
  for (let hour = 8; hour <= 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      // Time label
      const label = document.createElement('div');
      label.className = 'schedule-time-label';
      if (min === 0) label.textContent = formatTimeSlot(hour, 0);
      grid.appendChild(label);

      // Day cells
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cell = document.createElement('div');
        cell.className = 'schedule-cell';

        const cellDate = new Date(dayDates[dayIdx]);
        cellDate.setHours(hour, min, 0, 0);

        // Click empty cell to create appointment
        cell.addEventListener('click', (e) => {
          if (e.target.closest('.appt-block')) return;
          openAppointmentModal({ dateTime: cellDate.toISOString(), providerId: providerFilter || '' });
        });

        // Place appointments in this cell
        if (min === 0 || min === 30) {
          const slotStart = cellDate.getTime();
          const slotEnd = slotStart + 30 * 60 * 1000;
          appts.forEach(appt => {
            const apptStart = new Date(appt.dateTime).getTime();
            if (apptStart >= slotStart && apptStart < slotEnd) {
              const block = buildApptBlock(appt);
              // Position based on duration
              const durationSlots = (appt.duration || 30) / 30;
              block.style.height = (durationSlots * 48 - 2) + 'px';
              block.style.top = '0px';
              cell.appendChild(block);
            }
          });
        }

        grid.appendChild(cell);
      }
    }
  }

  return grid;
}

function buildDayGrid(date, providerFilter) {
  const grid = document.createElement('div');
  grid.className = 'schedule-grid schedule-grid-day';

  const pad = n => String(n).padStart(2, '0');
  const dateStr = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  let appts = getAppointmentsByDate(dateStr);
  if (providerFilter) appts = appts.filter(a => a.providerId === providerFilter);

  // Corner + header
  const corner = document.createElement('div');
  corner.className = 'schedule-corner';
  grid.appendChild(corner);

  const hdr = document.createElement('div');
  hdr.className = 'schedule-day-header';
  hdr.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  grid.appendChild(hdr);

  for (let hour = 8; hour <= 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const label = document.createElement('div');
      label.className = 'schedule-time-label';
      if (min === 0) label.textContent = formatTimeSlot(hour, 0);
      grid.appendChild(label);

      const cell = document.createElement('div');
      cell.className = 'schedule-cell';
      const cellDate = new Date(date);
      cellDate.setHours(hour, min, 0, 0);

      cell.addEventListener('click', (e) => {
        if (e.target.closest('.appt-block')) return;
        openAppointmentModal({ dateTime: cellDate.toISOString(), providerId: providerFilter || '' });
      });

      const slotStart = cellDate.getTime();
      const slotEnd = slotStart + 30 * 60 * 1000;
      appts.forEach(appt => {
        const apptStart = new Date(appt.dateTime).getTime();
        if (apptStart >= slotStart && apptStart < slotEnd) {
          const block = buildApptBlock(appt);
          const durationSlots = (appt.duration || 30) / 30;
          block.style.height = (durationSlots * 48 - 2) + 'px';
          block.style.top = '0px';
          cell.appendChild(block);
        }
      });

      grid.appendChild(cell);
    }
  }

  return grid;
}

function buildApptBlock(appt) {
  const block = document.createElement('div');
  block.className = 'appt-block appt-' + appt.status.toLowerCase().replace(/[\s-]+/g, '-');

  const patient = getPatient(appt.patientId);
  const time = document.createElement('div');
  time.className = 'appt-time';
  const d = new Date(appt.dateTime);
  time.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' · ' + appt.duration + 'min';

  const name = document.createElement('div');
  name.className = 'appt-patient';
  if (patient) {
    name.appendChild(makePatientLink(patient.id, patient.lastName + ', ' + patient.firstName));
  } else {
    name.textContent = 'Unknown';
  }

  block.appendChild(time);
  block.appendChild(name);

  block.addEventListener('click', (e) => {
    e.stopPropagation();
    openAppointmentDetailModal(appt.id);
  });

  return block;
}

function openAppointmentModal(prefill) {
  const isEdit = prefill && prefill.id;
  const appt = isEdit ? prefill : {};
  const patients = getPatients().sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));
  const providers = getProviders();

  const dtValue = appt.dateTime ? toLocalDateTimeValue(new Date(appt.dateTime)) : '';

  let patientOpts = '<option value="">— Select Patient —</option>';
  patients.forEach(p => {
    const sel = appt.patientId === p.id ? ' selected' : '';
    patientOpts += '<option value="' + esc(p.id) + '"' + sel + '>' + esc(p.lastName + ', ' + p.firstName) + ' (' + esc(p.mrn) + ')</option>';
  });

  let provOpts = '<option value="">— Select Provider —</option>';
  providers.forEach(p => {
    const sel = appt.providerId === p.id ? ' selected' : '';
    provOpts += '<option value="' + esc(p.id) + '"' + sel + '>' + esc(p.lastName + ', ' + p.firstName + ', ' + p.degree) + '</option>';
  });

  const visitTypes = ['New Patient', 'Follow-Up', 'Annual Physical', 'Urgent', 'Telehealth', 'Procedure'];
  let visitOpts = visitTypes.map(t => '<option' + (appt.visitType === t ? ' selected' : '') + '>' + t + '</option>').join('');

  const durations = [15, 30, 45, 60];
  let durOpts = durations.map(d => '<option value="' + d + '"' + ((appt.duration || 30) === d ? ' selected' : '') + '>' + d + ' min</option>').join('');

  const statuses = ['Scheduled', 'Checked-In', 'In-Progress', 'Completed', 'Cancelled', 'No-Show'];
  let statusOpts = statuses.map(s => '<option' + ((appt.status || 'Scheduled') === s ? ' selected' : '') + '>' + s + '</option>').join('');

  const bodyHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Patient *</label><select class="form-control" id="appt-patient">${patientOpts}</select></div>
      <div class="form-group"><label class="form-label">Provider *</label><select class="form-control" id="appt-provider">${provOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date & Time *</label><input class="form-control" id="appt-datetime" type="datetime-local" value="${esc(dtValue)}" /></div>
      <div class="form-group"><label class="form-label">Duration</label><select class="form-control" id="appt-duration">${durOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Visit Type</label><select class="form-control" id="appt-type">${visitOpts}</select></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="appt-status">${statusOpts}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Reason</label><input class="form-control" id="appt-reason" value="${esc(appt.reason || '')}" placeholder="Reason for visit" /></div>
  `;

  openModal({
    title: isEdit ? 'Edit Appointment' : 'New Appointment',
    bodyHTML,
    footerHTML: '<button class="btn btn-secondary" id="appt-cancel">Cancel</button><button class="btn btn-primary" id="appt-save">' + (isEdit ? 'Save' : 'Create') + '</button>',
  });

  document.getElementById('appt-cancel').addEventListener('click', closeModal);
  document.getElementById('appt-save').addEventListener('click', () => {
    const patientId  = document.getElementById('appt-patient').value;
    const providerId = document.getElementById('appt-provider').value;
    const dtVal      = document.getElementById('appt-datetime').value;
    if (!patientId || !providerId || !dtVal) {
      showToast('Patient, provider, and date/time are required.', 'error');
      return;
    }

    const duration = parseInt(document.getElementById('appt-duration').value, 10);
    const dateTime = new Date(dtVal).toISOString();

    // Conflict detection
    const conflicts = checkAppointmentConflict(providerId, dateTime, duration, isEdit ? appt.id : null);
    const doSave = () => {
      saveAppointment({
        id:        isEdit ? appt.id : undefined,
        patientId,
        providerId,
        dateTime,
        duration,
        visitType: document.getElementById('appt-type').value,
        status:    document.getElementById('appt-status').value,
        reason:    document.getElementById('appt-reason').value.trim(),
      });
      closeModal();
      showToast(isEdit ? 'Appointment updated.' : 'Appointment created.', 'success');
      renderSchedule();
    };

    if (conflicts.length > 0) {
      const conflictNames = conflicts.map(c => {
        const p = getPatient(c.patientId);
        const t = new Date(c.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return (p ? p.lastName + ', ' + p.firstName : 'Unknown') + ' at ' + t;
      }).join('; ');
      closeModal();
      confirmAction({
        title: 'Scheduling Conflict',
        message: 'This provider already has an overlapping appointment: ' + conflictNames + '. Schedule anyway?',
        confirmLabel: 'Schedule Anyway',
        danger: true,
        onConfirm: doSave,
      });
    } else {
      doSave();
    }
  });
}

function openAppointmentDetailModal(apptId) {
  const appt = getAppointments().find(a => a.id === apptId);
  if (!appt) return;

  const patient  = getPatient(appt.patientId);
  const provider = getProvider(appt.providerId);
  const patName  = patient ? patient.firstName + ' ' + patient.lastName : 'Unknown';
  const provName = provider ? provider.firstName + ' ' + provider.lastName + ', ' + provider.degree : '[Unknown]';

  const bodyHTML = `
    <div style="font-size:13.5px;line-height:1.8">
      <div><strong>Patient:</strong> <span id="appt-det-patient"></span></div>
      <div><strong>Provider:</strong> <span id="appt-det-provider"></span></div>
      <div><strong>Date/Time:</strong> <span id="appt-det-datetime"></span></div>
      <div><strong>Duration:</strong> ${appt.duration} minutes</div>
      <div><strong>Visit Type:</strong> <span id="appt-det-type"></span></div>
      <div><strong>Reason:</strong> <span id="appt-det-reason"></span></div>
      <div><strong>Status:</strong> <span class="badge badge-${esc(appt.status.toLowerCase())}" id="appt-det-status"></span></div>
    </div>
  `;

  const actions = ['Scheduled', 'Checked-In', 'In-Progress', 'Completed', 'Cancelled', 'No-Show'];
  const statusButtons = actions
    .filter(s => s !== appt.status)
    .map(s => '<button class="btn btn-secondary btn-sm" data-status="' + s + '">' + s + '</button>')
    .join(' ');

  const footerHTML = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1">
      ${statusButtons}
    </div>
    ${patient ? '<button class="btn btn-primary btn-sm" id="appt-det-chart">Open Chart</button>' : ''}
    <button class="btn btn-secondary btn-sm" id="appt-det-edit">Edit</button>
    <button class="btn btn-danger btn-sm" id="appt-det-delete">Delete</button>
    <button class="btn btn-secondary btn-sm" id="appt-det-close">Close</button>
  `;

  openModal({ title: 'Appointment Details', bodyHTML, footerHTML });

  // Set text content safely
  const patEl = document.getElementById('appt-det-patient');
  if (patient) { patEl.appendChild(makePatientLink(patient.id, patName)); } else { patEl.textContent = patName; }
  document.getElementById('appt-det-provider').textContent = provName;
  document.getElementById('appt-det-datetime').textContent = formatDateTime(appt.dateTime);
  document.getElementById('appt-det-type').textContent = appt.visitType;
  document.getElementById('appt-det-reason').textContent = appt.reason || '—';
  document.getElementById('appt-det-status').textContent = appt.status;

  document.getElementById('appt-det-close').addEventListener('click', closeModal);

  if (patient && document.getElementById('appt-det-chart')) {
    document.getElementById('appt-det-chart').addEventListener('click', () => {
      closeModal();
      navigate('#chart/' + appt.patientId);
    });
  }

  document.getElementById('appt-det-edit').addEventListener('click', () => {
    closeModal();
    openAppointmentModal(appt);
  });

  document.getElementById('appt-det-delete').addEventListener('click', () => {
    confirmAction({
      title: 'Delete Appointment',
      message: 'Delete this appointment for ' + patName + '?',
      confirmLabel: 'Delete', danger: true,
      onConfirm: () => { deleteAppointment(apptId); showToast('Appointment deleted.'); closeModal(); renderSchedule(); },
    });
  });

  // Status change buttons
  document.getElementById('modal-footer').addEventListener('click', e => {
    const btn = e.target.closest('[data-status]');
    if (!btn) return;
    saveAppointment({ id: apptId, status: btn.dataset.status });
    showToast('Status changed to ' + btn.dataset.status + '.', 'success');
    closeModal();
    renderSchedule();
  });
}
