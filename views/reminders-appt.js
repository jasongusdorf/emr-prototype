/* ============================================================
   views/reminders-appt.js — Appointment Reminders
   ============================================================ */

var REMINDER_SCHEDULES = [
  { key: 'schedule7d', label: '7 days before', hours: 168 },
  { key: 'schedule1d', label: '1 day before', hours: 24 },
  { key: 'schedule2h', label: '2 hours before', hours: 2 }
];

/* ---------- Provider View ---------- */
function renderApptReminders() {
  var app = document.getElementById('app');
  setTopbar({ title: 'Appointment Reminders', meta: 'Configure and review reminder delivery' });
  setActiveNav('appt-reminders');

  var tab = window._apptRemindersTab || 'dashboard';

  var html = '<div class="pe-container">';
  html += '<div class="pe-tabs">';
  html += '<button class="pe-tab' + (tab === 'dashboard' ? ' active' : '') + '" data-tab="dashboard">Dashboard</button>';
  html += '<button class="pe-tab' + (tab === 'log' ? ' active' : '') + '" data-tab="log">Send Log</button>';
  html += '<button class="pe-tab' + (tab === 'preferences' ? ' active' : '') + '" data-tab="preferences">Patient Preferences</button>';
  html += '</div>';
  html += '<div id="appt-reminders-content"></div>';
  html += '</div>';

  app.innerHTML = html;

  app.querySelectorAll('.pe-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._apptRemindersTab = btn.dataset.tab;
      renderApptReminders();
    });
  });

  if (tab === 'dashboard') renderRemindersDashboard();
  else if (tab === 'log') renderRemindersLog();
  else if (tab === 'preferences') renderReminderPreferences();
}

function renderRemindersDashboard() {
  var container = document.getElementById('appt-reminders-content');
  var now = new Date();
  var weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  var appointments = getAppointments().filter(function(a) {
    var d = new Date(a.dateTime);
    return d > now && d < weekFromNow && a.status !== 'Cancelled';
  }).sort(function(a, b) { return new Date(a.dateTime) - new Date(b.dateTime); });

  var allReminders = getApptReminders();
  var stats = { total: allReminders.length, sent: 0, delivered: 0, read: 0, failed: 0 };
  allReminders.forEach(function(r) {
    if (r.deliveryStatus === 'Sent') stats.sent++;
    else if (r.deliveryStatus === 'Delivered') stats.delivered++;
    else if (r.deliveryStatus === 'Read') stats.read++;
    else if (r.deliveryStatus === 'Failed') stats.failed++;
  });

  var html = '<div class="pe-section">';

  /* Stats cards */
  html += '<div class="pe-stats-row">';
  html += '<div class="pe-stat-card"><div class="pe-stat-number">' + stats.total + '</div><div class="pe-stat-label">Total Reminders</div></div>';
  html += '<div class="pe-stat-card pe-stat-success"><div class="pe-stat-number">' + stats.delivered + '</div><div class="pe-stat-label">Delivered</div></div>';
  html += '<div class="pe-stat-card pe-stat-info"><div class="pe-stat-number">' + stats.read + '</div><div class="pe-stat-label">Read</div></div>';
  html += '<div class="pe-stat-card pe-stat-danger"><div class="pe-stat-number">' + stats.failed + '</div><div class="pe-stat-label">Failed</div></div>';
  html += '</div>';

  /* Upcoming reminders */
  html += '<h3 style="margin-top:20px">Upcoming Appointments (Next 7 Days)</h3>';
  html += '<div style="margin-bottom:12px"><button class="btn btn-primary btn-sm" id="generate-reminders-btn">Generate Reminders for Upcoming Appointments</button></div>';

  if (appointments.length === 0) {
    html += '<p class="text-muted">No upcoming appointments in the next 7 days.</p>';
  } else {
    html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Appointment</th><th>Provider</th><th>Reminders Scheduled</th><th>Actions</th></tr></thead><tbody>';
    appointments.forEach(function(apt) {
      var pat = getPatient(apt.patientId);
      var prov = getProvider(apt.providerId);
      var reminders = allReminders.filter(function(r) { return r.appointmentId === apt.id; });
      html += '<tr>';
      html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
      html += '<td>' + formatDateTime(apt.dateTime) + '</td>';
      html += '<td>' + (prov ? esc(prov.firstName + ' ' + prov.lastName) : 'N/A') + '</td>';
      html += '<td>' + reminders.length + '</td>';
      html += '<td><button class="btn btn-secondary btn-sm send-reminder-btn" data-id="' + esc(apt.id) + '">Send Now</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  container.innerHTML = html;

  document.getElementById('generate-reminders-btn').addEventListener('click', function() {
    generateRemindersForUpcoming();
    showToast('Reminders generated for upcoming appointments', 'success');
    renderRemindersDashboard();
  });

  container.querySelectorAll('.send-reminder-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      simulateSendReminder(btn.dataset.id);
    });
  });
}

function generateRemindersForUpcoming() {
  var now = new Date();
  var weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  var appointments = getAppointments().filter(function(a) {
    var d = new Date(a.dateTime);
    return d > now && d < weekFromNow && a.status !== 'Cancelled';
  });

  var existingReminders = getApptReminders();

  appointments.forEach(function(apt) {
    var pat = getPatient(apt.patientId);
    var prefs = getReminderPrefsByPatient(apt.patientId);
    var channels = [];
    if (!prefs || prefs.sms) channels.push('sms');
    if (!prefs || prefs.email) channels.push('email');

    REMINDER_SCHEDULES.forEach(function(sched) {
      if (prefs && !prefs[sched.key]) return;

      var scheduledTime = new Date(new Date(apt.dateTime).getTime() - sched.hours * 60 * 60 * 1000);
      if (scheduledTime < now) return;

      channels.forEach(function(ch) {
        var exists = existingReminders.find(function(r) {
          return r.appointmentId === apt.id && r.reminderType === ch && r.scheduledFor === scheduledTime.toISOString();
        });
        if (!exists) {
          saveApptReminder({
            patientId: apt.patientId,
            appointmentId: apt.id,
            reminderType: ch,
            scheduledFor: scheduledTime.toISOString(),
            status: 'Scheduled',
            deliveryStatus: 'Pending'
          });
        }
      });
    });
  });
}

function simulateSendReminder(appointmentId) {
  var reminders = getApptReminders().filter(function(r) {
    return r.appointmentId === appointmentId && r.deliveryStatus === 'Pending';
  });

  if (reminders.length === 0) {
    /* Create an immediate reminder */
    var apt = getAppointments().find(function(a) { return a.id === appointmentId; });
    if (!apt) return;
    var prefs = getReminderPrefsByPatient(apt.patientId);
    var channels = [];
    if (!prefs || prefs.email) channels.push('email');
    if (!prefs || prefs.sms) channels.push('sms');

    channels.forEach(function(ch) {
      saveApptReminder({
        patientId: apt.patientId,
        appointmentId: apt.id,
        reminderType: ch,
        scheduledFor: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        status: 'Sent',
        deliveryStatus: simulateDeliveryStatus()
      });
    });
  } else {
    reminders.forEach(function(r) {
      saveApptReminder({
        id: r.id,
        sentAt: new Date().toISOString(),
        status: 'Sent',
        deliveryStatus: simulateDeliveryStatus()
      });
    });
  }

  showToast('Reminder sent (simulated)', 'success');
  renderRemindersDashboard();
}

function simulateDeliveryStatus() {
  var rand = Math.random();
  if (rand < 0.6) return 'Delivered';
  if (rand < 0.85) return 'Read';
  if (rand < 0.95) return 'Sent';
  return 'Failed';
}

/* ---------- Send Log ---------- */
function renderRemindersLog() {
  var container = document.getElementById('appt-reminders-content');
  var reminders = getApptReminders().sort(function(a, b) {
    return new Date(b.sentAt || b.scheduledFor || b.createdAt) - new Date(a.sentAt || a.scheduledFor || a.createdAt);
  });

  var html = '<div class="pe-section">';
  html += '<div class="pe-section-header"><h3>Reminder Send Log</h3></div>';

  if (reminders.length === 0) {
    html += '<p class="text-muted" style="padding:20px">No reminders have been sent yet.</p>';
  } else {
    html += '<table class="pe-table"><thead><tr><th>Patient</th><th>Appointment</th><th>Type</th><th>Scheduled</th><th>Sent</th><th>Status</th><th>Patient Action</th></tr></thead><tbody>';
    reminders.forEach(function(r) {
      var pat = getPatient(r.patientId);
      var apt = getAppointments().find(function(a) { return a.id === r.appointmentId; });
      var statusClass = r.deliveryStatus === 'Delivered' || r.deliveryStatus === 'Read' ? 'success' : r.deliveryStatus === 'Failed' ? 'danger' : 'warning';
      html += '<tr>';
      html += '<td>' + (pat ? esc(pat.firstName + ' ' + pat.lastName) : 'Unknown') + '</td>';
      html += '<td>' + (apt ? formatDateTime(apt.dateTime) : 'N/A') + '</td>';
      html += '<td><span class="pe-badge pe-badge-' + (r.reminderType === 'sms' ? 'info' : 'primary') + '">' + esc(r.reminderType.toUpperCase()) + '</span></td>';
      html += '<td>' + formatDateTime(r.scheduledFor) + '</td>';
      html += '<td>' + (r.sentAt ? formatDateTime(r.sentAt) : '<span class="text-muted">Not sent</span>') + '</td>';
      html += '<td><span class="pe-badge pe-badge-' + statusClass + '">' + esc(r.deliveryStatus) + '</span></td>';
      html += '<td>';
      if (r.patientAction === 'confirmed') html += '<span class="pe-badge pe-badge-success">Confirmed</span>';
      else if (r.patientAction === 'cancelled') html += '<span class="pe-badge pe-badge-danger">Cancelled</span>';
      else if (r.patientAction === 'reschedule') html += '<span class="pe-badge pe-badge-warning">Reschedule</span>';
      else html += '<span class="text-muted">No response</span>';
      html += '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';
  container.innerHTML = html;
}

/* ---------- Patient Preferences ---------- */
function renderReminderPreferences() {
  var container = document.getElementById('appt-reminders-content');
  var patients = getPatients().sort(function(a, b) { return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName); });

  var html = '<div class="pe-section">';
  html += '<h3>Patient Reminder Preferences</h3>';
  html += '<table class="pe-table"><thead><tr><th>Patient</th><th>SMS</th><th>Email</th><th>7 Days</th><th>1 Day</th><th>2 Hours</th><th>Actions</th></tr></thead><tbody>';

  patients.forEach(function(p) {
    var prefs = getReminderPrefsByPatient(p.id);
    html += '<tr>';
    html += '<td>' + esc(p.firstName + ' ' + p.lastName) + '</td>';
    html += '<td>' + (prefs && prefs.sms === false ? '<span class="pe-badge pe-badge-danger">Off</span>' : '<span class="pe-badge pe-badge-success">On</span>') + '</td>';
    html += '<td>' + (prefs && prefs.email === false ? '<span class="pe-badge pe-badge-danger">Off</span>' : '<span class="pe-badge pe-badge-success">On</span>') + '</td>';
    html += '<td>' + (prefs && prefs.schedule7d === false ? '<span class="pe-badge pe-badge-danger">Off</span>' : '<span class="pe-badge pe-badge-success">On</span>') + '</td>';
    html += '<td>' + (prefs && prefs.schedule1d === false ? '<span class="pe-badge pe-badge-danger">Off</span>' : '<span class="pe-badge pe-badge-success">On</span>') + '</td>';
    html += '<td>' + (prefs && prefs.schedule2h === false ? '<span class="pe-badge pe-badge-danger">Off</span>' : '<span class="pe-badge pe-badge-success">On</span>') + '</td>';
    html += '<td><button class="btn btn-secondary btn-sm edit-prefs-btn" data-id="' + esc(p.id) + '">Edit</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;

  container.querySelectorAll('.edit-prefs-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openReminderPrefsModal(btn.dataset.id);
    });
  });
}

function openReminderPrefsModal(patientId) {
  var pat = getPatient(patientId);
  var prefs = getReminderPrefsByPatient(patientId) || { sms: true, email: true, schedule7d: true, schedule1d: true, schedule2h: true };

  var body = '<div class="pe-prefs-form">';
  body += '<h4>Reminder Channels</h4>';
  body += '<label class="pe-checkbox-label"><input type="checkbox" id="pref-sms"' + (prefs.sms !== false ? ' checked' : '') + ' /> SMS Text Messages</label>';
  body += '<label class="pe-checkbox-label"><input type="checkbox" id="pref-email"' + (prefs.email !== false ? ' checked' : '') + ' /> Email</label>';
  body += '<h4 style="margin-top:12px">Reminder Schedule</h4>';
  body += '<label class="pe-checkbox-label"><input type="checkbox" id="pref-7d"' + (prefs.schedule7d !== false ? ' checked' : '') + ' /> 7 days before appointment</label>';
  body += '<label class="pe-checkbox-label"><input type="checkbox" id="pref-1d"' + (prefs.schedule1d !== false ? ' checked' : '') + ' /> 1 day before appointment</label>';
  body += '<label class="pe-checkbox-label"><input type="checkbox" id="pref-2h"' + (prefs.schedule2h !== false ? ' checked' : '') + ' /> 2 hours before appointment</label>';
  body += '</div>';

  openModal({
    title: 'Reminder Preferences: ' + (pat ? pat.firstName + ' ' + pat.lastName : 'Patient'),
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="save-prefs-btn">Save Preferences</button>'
  });

  document.getElementById('save-prefs-btn').addEventListener('click', function() {
    saveReminderPrefs({
      patientId: patientId,
      sms: document.getElementById('pref-sms').checked,
      email: document.getElementById('pref-email').checked,
      schedule7d: document.getElementById('pref-7d').checked,
      schedule1d: document.getElementById('pref-1d').checked,
      schedule2h: document.getElementById('pref-2h').checked,
      updatedAt: new Date().toISOString()
    });
    closeModal();
    showToast('Preferences saved', 'success');
    renderReminderPreferences();
  });
}

/* ---------- Portal: Reminder Actions ---------- */
function renderPortalReminders(container, patient) {
  var reminders = getApptRemindersByPatient(patient.id).filter(function(r) {
    return r.status === 'Sent' && !r.patientAction;
  }).sort(function(a, b) { return new Date(a.scheduledFor) - new Date(b.scheduledFor); });

  /* Deduplicate by appointment */
  var seen = {};
  var unique = [];
  reminders.forEach(function(r) {
    if (!seen[r.appointmentId]) {
      seen[r.appointmentId] = true;
      unique.push(r);
    }
  });

  var html = '<div class="portal-card">';
  html += '<h3>Appointment Reminders</h3>';

  if (unique.length === 0) {
    html += '<p class="text-muted">No pending reminders.</p>';
  } else {
    unique.forEach(function(r) {
      var apt = getAppointments().find(function(a) { return a.id === r.appointmentId; });
      var prov = apt ? getProvider(apt.providerId) : null;
      html += '<div class="pe-reminder-card">';
      html += '<div><strong>Appointment: ' + (apt ? formatDateTime(apt.dateTime) : 'N/A') + '</strong></div>';
      if (prov) html += '<div class="text-muted text-sm">With ' + esc(prov.firstName + ' ' + prov.lastName) + '</div>';
      html += '<div class="pe-reminder-actions" style="margin-top:8px">';
      html += '<button class="btn btn-success btn-sm portal-reminder-confirm" data-apt="' + esc(r.appointmentId) + '">Confirm</button> ';
      html += '<button class="btn btn-danger btn-sm portal-reminder-cancel" data-apt="' + esc(r.appointmentId) + '">Cancel</button> ';
      html += '<button class="btn btn-warning btn-sm portal-reminder-resched" data-apt="' + esc(r.appointmentId) + '">Reschedule</button>';
      html += '</div>';
      html += '</div>';
    });
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.portal-reminder-confirm').forEach(function(btn) {
    btn.addEventListener('click', function() {
      handleReminderAction(btn.dataset.apt, 'confirmed');
      showToast('Appointment confirmed', 'success');
      renderPatientPortal();
    });
  });
  container.querySelectorAll('.portal-reminder-cancel').forEach(function(btn) {
    btn.addEventListener('click', function() {
      handleReminderAction(btn.dataset.apt, 'cancelled');
      showToast('Appointment cancellation requested', 'warning');
      renderPatientPortal();
    });
  });
  container.querySelectorAll('.portal-reminder-resched').forEach(function(btn) {
    btn.addEventListener('click', function() {
      handleReminderAction(btn.dataset.apt, 'reschedule');
      showToast('Reschedule request submitted', 'info');
      renderPatientPortal();
    });
  });
}

function handleReminderAction(appointmentId, action) {
  var reminders = getApptReminders().filter(function(r) { return r.appointmentId === appointmentId; });
  reminders.forEach(function(r) {
    saveApptReminder({ id: r.id, patientAction: action });
  });
  if (action === 'cancelled') {
    var apt = getAppointments().find(function(a) { return a.id === appointmentId; });
    if (apt) saveAppointment({ id: apt.id, status: 'Cancelled' });
  }
}
