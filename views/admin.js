/* ============================================================
   views/admin.js — Admin Panel (Approvals, Users, Audit Log)
   ============================================================ */

function renderAdmin() {
  if (!isAdmin()) {
    navigate('#dashboard');
    return;
  }

  setTopbar({ title: 'Admin Panel', meta: 'System Administration' });
  setActiveNav('admin');

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-tabs" role="tablist" aria-label="Admin sections">
      <button class="admin-tab active" data-tab="approvals" role="tab" aria-selected="true">Pending Approvals</button>
      <button class="admin-tab" data-tab="users" role="tab" aria-selected="false">User Management</button>
      <button class="admin-tab" data-tab="permissions" role="tab" aria-selected="false">Role Permissions</button>
      <button class="admin-tab" data-tab="audit" role="tab" aria-selected="false">System Audit Log</button>
    </div>
    <div id="admin-content"></div>
  `;

  const tabs = app.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const target = tab.dataset.tab;
      const container = document.getElementById('admin-content');
      if (target === 'approvals') renderApprovalsTab(container);
      else if (target === 'users') renderUsersTab(container);
      else if (target === 'permissions') renderPermissionsTab(container);
      else if (target === 'audit') renderAuditTab(container);
    });
  });

  renderApprovalsTab(document.getElementById('admin-content'));
}

function renderApprovalsTab(container) {
  const pending = getPendingUsers();

  if (pending.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 16px;color:var(--text-muted);">
        <p style="font-size:1.1rem;">No pending approval requests.</p>
        <p>New user registrations will appear here for review.</p>
      </div>
    `;
    return;
  }

  let html = '<div class="admin-cards">';
  pending.forEach(u => {
    const name = (u.firstName || '') + ' ' + (u.lastName || '');
    const created = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—';
    const roleLabel = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'User';
    html += `
      <div class="admin-card">
        <div class="admin-card-header">
          <strong>${esc(name.trim() || 'Unknown')}</strong>
          <span class="user-status-badge status-pending">Pending</span>
        </div>
        <div class="admin-card-body">
          <div><strong>Email:</strong> ${esc(u.email || '')}</div>
          <div><strong>Degree:</strong> ${esc(u.degree || '—')}</div>
          <div><strong>Role:</strong> ${esc(roleLabel)}</div>
          <div><strong>Registered:</strong> ${created}</div>
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-primary btn-sm" onclick="handleApproveUser('${esc(u.id)}')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="handleDenyUser('${esc(u.id)}')">Deny</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function handleApproveUser(targetUserId) {
  const admin = getSessionUser();
  if (!admin) return;
  const target = getUser(targetUserId);
  confirmAction({
    title: 'Approve User',
    message: 'Approve ' + (target ? target.email : 'this user') + '? They will gain system access.',
    confirmLabel: 'Approve',
    onConfirm: () => {
      approveUser(targetUserId, admin.id);
      showToast('User approved.', 'success');
      renderApprovalsTab(document.getElementById('admin-content'));
      if (typeof updateAdminBadge === 'function') updateAdminBadge();
    }
  });
}

function handleDenyUser(targetUserId) {
  const admin = getSessionUser();
  if (!admin) return;
  confirmAction({
    title: 'Deny User',
    message: 'Are you sure you want to deny this user? They will not be able to access the system.',
    confirmLabel: 'Deny',
    danger: true,
    onConfirm: () => {
      denyUser(targetUserId, admin.id);
      showToast('User denied.', 'success');
      renderApprovalsTab(document.getElementById('admin-content'));
      if (typeof updateAdminBadge === 'function') updateAdminBadge();
    }
  });
}

function renderUsersTab(container) {
  const users = getUsers();
  const currentUser = getSessionUser();

  let html = `
    <div style="margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <input type="text" id="admin-user-search" class="form-control" placeholder="Search users by name or email…" style="max-width:320px;flex:1" />
      <select id="admin-user-filter" class="form-control" style="max-width:160px;">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="deactivated">Deactivated</option>
        <option value="denied">Denied</option>
      </select>
    </div>
    <div id="admin-user-table-wrap" style="overflow-x:auto;"></div>
  `;
  container.innerHTML = html;

  function renderUserTable() {
    const q = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('admin-user-filter')?.value || '';
    let filtered = users;
    if (q) {
      filtered = filtered.filter(u =>
        ((u.firstName || '') + ' ' + (u.lastName || '')).toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(u => (u.status || 'active') === statusFilter);
    }

    let tbl = `<table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Degree</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>`;

    if (filtered.length === 0) {
      tbl += '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No users found.</td></tr>';
    }

    filtered.forEach(u => {
      const name = (u.firstName || '') + ' ' + (u.lastName || '');
      const status = u.status || 'active';
      const role = u.role || 'user';
      const created = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—';
      const isSelf = currentUser && currentUser.id === u.id;
      const statusClass = 'status-' + status;
      const roleLabel = role === 'admin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1);

      let actions = '';
      if (!isSelf) {
        if (status === 'active') {
          actions += `<button class="btn btn-secondary btn-sm" onclick="handleDeactivateUser('${esc(u.id)}')">Deactivate</button> `;
        } else if (status === 'deactivated' || status === 'denied') {
          actions += `<button class="btn btn-primary btn-sm" onclick="handleReactivateUser('${esc(u.id)}')">Activate</button> `;
        }
        if (role === 'user' && status === 'active') {
          actions += `<button class="btn btn-secondary btn-sm" onclick="handlePromoteUser('${esc(u.id)}')">Promote</button> `;
        } else if (role === 'admin' && status === 'active') {
          actions += `<button class="btn btn-secondary btn-sm" onclick="handleDemoteUser('${esc(u.id)}')">Demote</button> `;
        }
        actions += `<button class="btn btn-secondary btn-sm" onclick="handleAdminResetPassword('${esc(u.id)}')">Reset PW</button>`;
      } else {
        actions = '<span style="color:var(--text-muted);font-size:0.85rem;">You</span>';
      }

      tbl += `<tr>
        <td>${esc(name.trim() || 'Unknown')}</td>
        <td>${esc(u.email || '')}</td>
        <td>${esc(u.degree || '—')}</td>
        <td>${esc(roleLabel)}</td>
        <td><span class="user-status-badge ${esc(statusClass)}">${esc(status)}</span></td>
        <td>${created}</td>
        <td style="white-space:nowrap">${actions}</td>
      </tr>`;
    });

    tbl += '</tbody></table>';
    document.getElementById('admin-user-table-wrap').innerHTML = tbl;
  }

  renderUserTable();
  document.getElementById('admin-user-search').addEventListener('input', renderUserTable);
  document.getElementById('admin-user-filter').addEventListener('change', renderUserTable);
}

function handleDeactivateUser(targetUserId) {
  const admin = getSessionUser();
  if (!admin) return;
  confirmAction({
    title: 'Deactivate User',
    message: 'This user will be blocked from logging in. Continue?',
    confirmLabel: 'Deactivate',
    danger: true,
    onConfirm: () => {
      deactivateUser(targetUserId, admin.id);
      showToast('User deactivated.', 'success');
      renderUsersTab(document.getElementById('admin-content'));
    }
  });
}

async function handleAdminResetPassword(targetUserId) {
  const admin = getSessionUser();
  if (!admin) return;
  const target = getUser(targetUserId);
  if (!target) return;
  confirmAction({
    title: 'Reset Password',
    message: 'Generate a temporary password for ' + (target.email || 'this user') + '? They will be required to change it on next login.',
    confirmLabel: 'Reset Password',
    onConfirm: async () => {
      const tempPw = await resetPasswordForUser(targetUserId, admin.id);
      if (tempPw) {
        openModal({
          title: 'Temporary Password',
          bodyHTML: `
            <p>A temporary password has been generated for <strong>${esc(target.email)}</strong>.</p>
            <div id="temp-pw-box" style="margin:16px 0;padding:12px 16px;background:var(--success-light);border-radius:6px;font-size:18px;letter-spacing:1.5px;text-align:center;font-family:monospace;color:var(--success);">
              ${esc(tempPw)}
            </div>
            <div style="text-align:center;margin-bottom:8px;">
              <button class="btn btn-secondary btn-sm" id="copy-temp-pw">Copy to Clipboard</button>
            </div>
            <p style="font-size:12px;color:var(--text-muted);">Share this password securely. The user will be required to change it on next login.</p>
          `,
          footerHTML: '<button class="btn btn-primary" onclick="closeModal()">Done</button>',
        });
        document.getElementById('copy-temp-pw')?.addEventListener('click', () => {
          navigator.clipboard.writeText(tempPw).then(() => {
            showToast('Password copied to clipboard.', 'success');
          }).catch(() => {
            // Fallback: select text
            const box = document.getElementById('temp-pw-box');
            if (box) { const sel = window.getSelection(); sel.selectAllChildren(box); }
            showToast('Select and copy the password manually.', 'default');
          });
        });
        renderUsersTab(document.getElementById('admin-content'));
      }
    }
  });
}

function handleReactivateUser(targetUserId) {
  const admin = getSessionUser();
  if (!admin) return;
  confirmAction({
    title: 'Reactivate User',
    message: 'This user will regain access to the system. Continue?',
    confirmLabel: 'Reactivate',
    onConfirm: () => {
      reactivateUser(targetUserId, admin.id);
      showToast('User reactivated.', 'success');
      renderUsersTab(document.getElementById('admin-content'));
    }
  });
}

function handlePromoteUser(targetUserId) {
  const admin = getSessionUser();
  if (!admin) return;
  confirmAction({
    title: 'Promote to Admin',
    message: 'This user will gain full admin privileges. Continue?',
    confirmLabel: 'Promote',
    onConfirm: () => {
      promoteToAdmin(targetUserId, admin.id);
      showToast('User promoted to admin.', 'success');
      renderUsersTab(document.getElementById('admin-content'));
    }
  });
}

function handleDemoteUser(targetUserId) {
  const admin = getSessionUser();
  if (!admin) return;
  // Guard: cannot demote the last admin
  const adminCount = getUsers().filter(u => u.role === 'admin' && (u.status || 'active') === 'active').length;
  if (adminCount <= 1) {
    showToast('Cannot demote the only remaining admin.', 'error');
    return;
  }
  confirmAction({
    title: 'Demote from Admin',
    message: 'This user will lose admin privileges. Continue?',
    confirmLabel: 'Demote',
    danger: true,
    onConfirm: () => {
      demoteFromAdmin(targetUserId, admin.id);
      showToast('User demoted from admin.', 'success');
      renderUsersTab(document.getElementById('admin-content'));
    }
  });
}

function renderAuditTab(container) {
  const entries = getSystemAuditLog();

  if (entries.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 16px;color:var(--text-muted);">
        <p>No audit log entries yet.</p>
      </div>
    `;
    return;
  }

  const actionColors = {
    'LOGIN': 'audit-login',
    'LOGIN_FAILED': 'audit-failed',
    'LOGOUT': 'audit-logout',
    'USER_APPROVED': 'audit-approved',
    'USER_DENIED': 'audit-denied',
    'USER_DEACTIVATED': 'audit-denied',
    'USER_REACTIVATED': 'audit-approved',
    'USER_PROMOTED': 'audit-approved',
    'USER_DEMOTED': 'audit-logout',
    'PASSWORD_CHANGED': 'audit-login',
    'PASSWORD_RESET': 'audit-login',
    'SESSION_TIMEOUT': 'audit-logout',
  };

  // Build filter bar
  let html = `
    <div style="margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <input type="text" id="audit-search" class="form-control" placeholder="Search by user or action…" style="max-width:300px;flex:1" />
      <select id="audit-action-filter" class="form-control" style="max-width:180px;">
        <option value="">All Actions</option>
        <option value="LOGIN">Login</option>
        <option value="LOGIN_FAILED">Login Failed</option>
        <option value="LOGOUT">Logout</option>
        <option value="USER_APPROVED">User Approved</option>
        <option value="USER_DENIED">User Denied</option>
        <option value="PASSWORD_CHANGED">Password Changed</option>
        <option value="PASSWORD_RESET">Password Reset</option>
        <option value="SESSION_TIMEOUT">Session Timeout</option>
      </select>
      <span id="audit-count" class="text-muted text-sm"></span>
    </div>
    <div id="audit-table-wrap" style="overflow-x:auto;max-height:600px;overflow-y:auto;"></div>
  `;
  container.innerHTML = html;

  function renderAuditTable() {
    const q = (document.getElementById('audit-search')?.value || '').trim().toLowerCase();
    const actionFilter = document.getElementById('audit-action-filter')?.value || '';
    let filtered = entries;
    if (q) {
      filtered = filtered.filter(e =>
        (e.email || '').toLowerCase().includes(q) ||
        (e.action || '').toLowerCase().includes(q) ||
        (e.details || '').toLowerCase().includes(q)
      );
    }
    if (actionFilter) {
      filtered = filtered.filter(e => e.action === actionFilter);
    }

    document.getElementById('audit-count').textContent = filtered.length + ' entries';

    let tbl = `<table class="data-table">
      <thead><tr><th>Timestamp</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
      <tbody>`;

    filtered.slice(0, 500).forEach(e => {
      const ts = e.timestamp ? new Date(e.timestamp).toLocaleString() : '—';
      const cls = actionColors[e.action] || '';
      tbl += `<tr>
        <td style="white-space:nowrap;">${ts}</td>
        <td><span class="audit-action-badge ${cls}">${esc(e.action || '')}</span></td>
        <td>${esc(e.email || '—')}</td>
        <td>${esc(e.details || '')}</td>
      </tr>`;
    });

    tbl += '</tbody></table>';
    document.getElementById('audit-table-wrap').innerHTML = tbl;
  }

  renderAuditTable();
  document.getElementById('audit-search').addEventListener('input', renderAuditTable);
  document.getElementById('audit-action-filter').addEventListener('change', renderAuditTable);
}

/* escapeHTML removed — using global esc() from providers.js */

/* ============================================================
   Role Permissions Tab
   ============================================================ */
function renderPermissionsTab(container) {
  const roles = ['admin', 'attending', 'resident', 'nurse', 'medical_assistant', 'front_desk', 'user'];
  const roleLabels = { admin: 'Admin', attending: 'Attending', resident: 'Resident', nurse: 'Nurse', medical_assistant: 'Medical Assistant', front_desk: 'Front Desk', user: 'User' };
  const permLabels = {
    view_admin: 'View Admin', place_orders: 'Place Orders', sign_notes: 'Sign Notes',
    write_notes: 'Write Notes', edit_patient: 'Edit Patient', view_chart: 'View Chart',
    send_messages: 'Send Messages', prescribe_controlled: 'Prescribe Controlled', export_data: 'Export Data'
  };

  let html = '<div style="padding:20px">';
  html += '<p class="text-muted" style="margin-bottom:16px">Configure permissions for each role. Changes take effect immediately.</p>';
  html += '<div style="overflow-x:auto"><table class="table"><thead><tr><th>Role</th>';
  ALL_PERMISSIONS.forEach(p => { html += '<th style="text-align:center;font-size:12px">' + (permLabels[p] || p) + '</th>'; });
  html += '<th></th></tr></thead><tbody>';

  roles.forEach(role => {
    const perms = getEffectivePermissions(role);
    html += '<tr><td><strong>' + (roleLabels[role] || role) + '</strong></td>';
    ALL_PERMISSIONS.forEach(p => {
      const checked = perms.indexOf(p) >= 0 ? 'checked' : '';
      const disabled = role === 'admin' ? 'disabled' : '';
      html += '<td style="text-align:center"><input type="checkbox" ' + checked + ' ' + disabled + ' data-role="' + role + '" data-perm="' + p + '" class="perm-cb" /></td>';
    });
    html += '<td><button class="btn btn-secondary btn-sm perm-reset" data-role="' + role + '">Reset</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  container.innerHTML = html;

  // Checkbox change handler
  container.querySelectorAll('.perm-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const role = cb.dataset.role;
      if (role === 'admin') return;
      const custom = getCustomRolePermissions();
      const currentPerms = getEffectivePermissions(role);
      const perm = cb.dataset.perm;
      let newPerms;
      if (cb.checked) {
        newPerms = [...new Set([...currentPerms, perm])];
      } else {
        newPerms = currentPerms.filter(p => p !== perm);
      }
      custom[role] = newPerms;
      saveCustomRolePermissions(custom);
      showToast('Permissions updated for ' + role + '.', 'success');
    });
  });

  // Reset buttons
  container.querySelectorAll('.perm-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      const custom = getCustomRolePermissions();
      delete custom[role];
      saveCustomRolePermissions(custom);
      showToast('Permissions reset to defaults for ' + role + '.', 'success');
      renderPermissionsTab(container);
    });
  });
}
