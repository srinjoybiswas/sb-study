/* ============================================================
   SB NOTES PORTAL — admin/notifications.js
   Admin notification composer with a department selector.
   Sending to "All Departments" notifies every active student.
   ============================================================ */

const AdminNotifications = (function () {
  const $ = id => document.getElementById(id);
  function field(name) {
    const f = $('notif-form');
    return f ? f.querySelector('[name="' + name + '"]') : null;
  }

  async function loadDepartments() {
    const sel = $('notif-department');
    if (!sel) return;
    try {
      const depts = await API.admin('getDepartments', {});
      sel.innerHTML = '<option value="ALL">All Departments</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    } catch (e) {}
  }

  /** Show how many students will receive the notification. */
  async function updateRecipients() {
    const el = $('notif-recipients');
    if (!el) return;
    const deptSel = $('notif-department');
    const deptId = deptSel ? deptSel.value : 'ALL';
    try {
      const res = await API.admin('getStudents', { page: 1, pageSize: 1000, status: 'ACTIVE', departmentId: deptId });
      const n = (res.total !== undefined) ? res.total : ((res.items || []).length);
      el.textContent = n + ' student(s) will receive this.';
    } catch (e) { el.textContent = ''; }
  }

  async function send(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      departmentId: $('notif-department').value,
      type: $('notif-type').value,
      title: field('title').value.trim(),
      message: field('message').value.trim(),
      link: field('link').value.trim()
    };
    if (!payload.title) return UI.toast('A notification title is required.', 'error');
    if (!payload.message) return UI.toast('A notification message is required.', 'error');

    UI.setLoading(btn, true, 'Sending\u2026');
    try {
      const res = await API.admin('sendNotification', payload);
      UI.toast('Notification sent to ' + (res.recipients || 0) + ' student(s).', 'success', 6000);
      f.reset();
      $('np-title').textContent = 'Notification title';
      $('np-msg').textContent = 'The message body will appear here.';
      updateRecipients();
      loadSent();
    } catch (err) { UI.toast(err.message || 'Could not send the notification.', 'error', 7000); }
    finally { UI.setLoading(btn, false); }
  }

  async function loadSent() {
    const el = $('sent-list');
    if (!el) return;
    try {
      const res = await API.admin('getAdminNotifications', { page: 1, pageSize: 50 });
      const items = res.items || [];
      if (!items.length) { el.innerHTML = UI.emptyState('\ud83d\udd14', 'Nothing sent yet', 'Notifications you send will appear here.'); return; }
      el.innerHTML = items.map(n =>
        '<div class="activity-item"><span class="act-dot"></span>' +
        '<span><strong>' + UI.escapeHtml(n.title) + '</strong> <span class="badge badge-muted">' + UI.escapeHtml(n.type || '') + '</span>' +
        '<br><span class="text-muted text-sm">' + UI.escapeHtml(n.message) + '</span>' +
        (n.departmentId ? '<br><span class="text-xs text-muted">To: ' + UI.escapeHtml(n.departmentName || n.departmentId) + '</span>' : '') + '</span>' +
        '<span class="act-time">' + UI.timeAgo(n.createdAt) + '</span></div>'
      ).join('');
    } catch (err) {
      el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load sent notifications', err.message);
    }
  }

  function init() {
    const f = $('notif-form');
    if (f && !f.dataset.bound) { f.addEventListener('submit', send); f.dataset.bound = '1'; }
    const dept = $('notif-department');
    if (dept) dept.onchange = updateRecipients;
    // Tabs
    document.querySelectorAll('#notif-tabs [data-tab]').forEach(b => b.onclick = () => {
      document.querySelectorAll('#notif-tabs [data-tab]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const compose = b.dataset.tab === 'compose';
      if ($('notif-compose-view')) $('notif-compose-view').classList.toggle('hidden', !compose);
      if ($('notif-sent-view')) $('notif-sent-view').classList.toggle('hidden', compose);
      if (!compose) loadSent();
    });
    // Live preview
    const t = field('title'), m = field('message');
    if (t) t.oninput = () => { const el = $('np-title'); if (el) el.textContent = t.value || 'Notification title'; };
    if (m) m.oninput = () => { const el = $('np-msg'); if (el) el.textContent = m.value || 'The message body will appear here.'; };

    loadDepartments().then(updateRecipients);
    loadSent();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminNotifications.init();
});
window.AdminNotifications = AdminNotifications;
