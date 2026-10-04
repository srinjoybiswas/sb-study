/* ============================================================
   SB NOTES PORTAL — admin/activity.js
   Live activity table, activity logs, security logs, audit logs.
   ============================================================ */

const AdminActivity = (function () {
  let timer = null;

  async function loadLive() {
    const el = document.getElementById('live-table');
    if (!el) return;
    try {
      const rows = await API.admin('getLiveActivity', {});
      if (!rows.length) { el.innerHTML = UI.emptyState('👥', 'No active sessions', 'Student sessions will appear here.'); return; }
      el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Student</th><th>Status</th><th>Last Active</th><th>Current Page</th><th>Current Note</th><th>Session</th>' +
        '</tr></thead><tbody>' + rows.map(r =>
          '<tr><td>' + UI.escapeHtml(r.name) + '</td>' +
          '<td><span class="status-pill ' + (r.status === 'ONLINE' ? 'online' : 'offline') + '"><span class="p-dot"></span>' + r.status + '</span></td>' +
          '<td>' + UI.timeAgo(r.lastActive) + '</td>' +
          '<td>' + UI.escapeHtml(r.currentPage || '—') + '</td>' +
          '<td>' + UI.escapeHtml(r.currentNote || '—') + '</td>' +
          '<td class="text-xs text-muted">' + UI.escapeHtml((r.sessionId || '').substring(0, 12)) + '…</td></tr>'
        ).join('') + '</tbody></table></div>';
    } catch (e) {}
  }

  async function loadLogs() {
    const el = document.getElementById('activity-logs');
    if (!el) return;
    el.innerHTML = UI.skeleton(5);
    try {
      const res = await API.admin('getActivityLogs', { page: 1, pageSize: 50 });
      if (!res.items.length) { el.innerHTML = UI.emptyState('🕒', 'No activity', ''); return; }
      el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Time</th><th>Student</th><th>Page</th><th>Action</th><th>Note</th><th>Duration</th>' +
        '</tr></thead><tbody>' + res.items.map(a =>
          '<tr><td class="text-xs">' + UI.formatDateTime(a.timestamp) + '</td>' +
          '<td class="text-xs">' + UI.escapeHtml(a.studentId) + '</td>' +
          '<td>' + UI.escapeHtml(a.page || '—') + '</td>' +
          '<td>' + UI.escapeHtml(a.action || '—') + '</td>' +
          '<td class="text-xs">' + UI.escapeHtml(a.noteId || '—') + '</td>' +
          '<td>' + (a.duration ? a.duration + 's' : '—') + '</td></tr>'
        ).join('') + '</tbody></table></div>';
    } catch (err) { el.innerHTML = UI.emptyState('⚠️', 'Could not load logs', err.message); }
  }

  async function loadSecurity() {
    const el = document.getElementById('security-logs');
    if (!el) return;
    el.innerHTML = UI.skeleton(5);
    try {
      const res = await API.admin('getSecurityLogs', { page: 1, pageSize: 50 });
      if (!res.items.length) { el.innerHTML = UI.emptyState('🛡', 'No security events', ''); return; }
      el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Time</th><th>Student</th><th>Event</th><th>Details</th>' +
        '</tr></thead><tbody>' + res.items.map(s =>
          '<tr><td class="text-xs">' + UI.formatDateTime(s.timestamp) + '</td>' +
          '<td class="text-xs">' + UI.escapeHtml(s.studentId) + '</td>' +
          '<td><span class="badge badge-warning">' + UI.escapeHtml(s.eventType) + '</span></td>' +
          '<td class="text-sm">' + UI.escapeHtml(s.details || '—') + '</td></tr>'
        ).join('') + '</tbody></table></div>';
    } catch (err) { el.innerHTML = UI.emptyState('⚠️', 'Could not load security logs', err.message); }
  }

  async function loadAudit() {
    const el = document.getElementById('audit-logs');
    if (!el) return;
    el.innerHTML = UI.skeleton(5);
    try {
      const res = await API.admin('getAuditLogs', { page: 1, pageSize: 50 });
      if (!res.items.length) { el.innerHTML = UI.emptyState('📋', 'No audit entries', ''); return; }
      el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Time</th><th>Action</th><th>Details</th>' +
        '</tr></thead><tbody>' + res.items.map(a =>
          '<tr><td class="text-xs">' + UI.formatDateTime(a.timestamp) + '</td>' +
          '<td><span class="badge badge-primary">' + UI.escapeHtml(a.action) + '</span></td>' +
          '<td class="text-sm">' + UI.escapeHtml(a.userAgent || '—') + '</td></tr>'
        ).join('') + '</tbody></table></div>';
    } catch (err) { el.innerHTML = UI.emptyState('⚠️', 'Could not load audit logs', err.message); }
  }

  function init() {
    loadLive();
    loadLogs();
    loadSecurity();
    loadAudit();
    timer = setInterval(loadLive, 30000);
  }

  return { init, loadLive, loadLogs, loadSecurity, loadAudit };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminActivity.init();
});
window.AdminActivity = AdminActivity;
