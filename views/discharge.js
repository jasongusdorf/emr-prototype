/* ============================================================
   DISCHARGE — standalone view for #discharge/:patientId
   Provides renderDischarge(patientId) used by the app.js router.
   All discharge business logic lives in chart.js:
     _buildDischargeContent(), _saveDischargeDraft(), openDischargeModal()
   ============================================================ */

function renderDischarge(patientId) {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var patient = typeof getPatient === 'function' ? getPatient(patientId) : null;
  if (!patient) {
    app.textContent = 'Patient not found.';
    return;
  }

  if (typeof setTopbar === 'function') {
    setTopbar({
      title: 'Discharge — ' + esc(patient.lastName + ', ' + patient.firstName),
      actions: '<a href="#chart/' + patientId + '" class="btn btn-secondary btn-sm">← Back to Chart</a>',
    });
  }

  if (typeof setActiveNav === 'function') setActiveNav('dashboard');

  // Check authorization
  var sessionUser = typeof getSessionUser === 'function' ? getSessionUser() : null;
  if (!sessionUser) {
    app.textContent = 'Not authenticated.';
    return;
  }
  var userRole = (sessionUser.role || '').toLowerCase();
  var isOnPanel = (patient.panelProviders || []).indexOf(sessionUser.id) !== -1;
  var hasOverride = userRole === 'admin' || userRole === 'attending';
  if (!isOnPanel && !hasOverride) {
    app.innerHTML = '<div style="padding:40px;text-align:center">' +
      '<h2 style="color:var(--warning)">Access Restricted</h2>' +
      '<p style="margin:12px 0;color:var(--text-secondary)">You are not on this patient\'s care team.</p>' +
      '<a href="#dashboard" class="btn btn-primary">Back to Dashboard</a></div>';
    return;
  }

  // Delegate to chart.js discharge builder
  if (typeof _buildDischargeContent === 'function') {
    _buildDischargeContent(app, patientId);
  } else {
    app.innerHTML = '<p style="padding:40px;color:var(--text-secondary)">Discharge module not available.</p>';
  }
}
