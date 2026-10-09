/* ============================================================
   SB NOTES PORTAL — notifications.js
   Notification center: list, unread count, mark read / all read.
   ============================================================ */

const Notifications = (function () {
  let pollTimer = null;

  async function load() {
    const el = document.getElementById('notif-full-list');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const res = await API.get('getNotifications', {});
      render(res.items);
      updateBadge(res.unreadCount);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load notifications', err.message);
    }
  }

  function render(items) {
    const el = document.getElementById('notif-full-list');
    if (!el) return;
    if (!items.length) { el.innerHTML = UI.emptyState('🔔', 'No notifications', 'You have no notifications yet.'); return; }
    el.innerHTML = items.map(n =>
      '<div class="activity-item" data-id="' + UI.escapeHtml(n.notificationId) + '">' +
      '<span class="act-dot" style="background:' + typeColor(n.type) + '"></span>' +
      '<span><strong>' + UI.escapeHtml(n.title) + '</strong>' +
      (n.isRead ? '' : ' <span class="badge badge-primary">New</span>') +
      '<br><span class="text-muted text-sm">' + UI.escapeHtml(n.message) + '</span>' +
      (n.link ? '<br><a class="text-sm" href="' + UI.escapeHtml(n.link) + '">Open →</a>' : '') +
      '</span>' +
      '<span class="act-time">' + UI.timeAgo(n.createdAt) + '</span>' +
      (n.isRead ? '' : '<button class="btn btn-ghost btn-sm" data-read="' + UI.escapeHtml(n.notificationId) + '">Mark read</button>') +
      '</div>'
    ).join('');
    el.querySelectorAll('[data-read]').forEach(b => b.onclick = () => markRead(b.dataset.read));
  }

  function typeColor(type) {
    const map = {
      NEW_NOTE: 'var(--primary)', UPDATED_NOTE: 'var(--secondary)',
      RESULT: 'var(--success)', CERTIFICATE: 'var(--success)', ANNOUNCEMENT: 'var(--warning)',
      ACCOUNT: 'var(--danger)', SYSTEM: 'var(--muted)'
    };
    return map[type] || 'var(--primary)';
  }

  function updateBadge(count) {
    document.querySelectorAll('[data-notif-count]').forEach(el => {
      el.textContent = count || 0;
      el.style.display = count ? 'flex' : 'none';
    });
  }

  async function markRead(id) {
    try {
      const res = await API.get('markNotificationRead', { notificationId: id });
      updateBadge(res.unreadCount);
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function markAllRead() {
    try {
      await API.get('markAllNotificationsRead', {});
      UI.toast('All notifications marked as read.', 'success');
      updateBadge(0);
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  /** Lightweight polling for the unread badge on any page. */
  function startPolling() {
    if (pollTimer) return;
    const poll = () => {
      if (!Auth.isLoggedIn()) return;
      API.get('getNotifications', {}).then(res => updateBadge(res.unreadCount)).catch(() => {});
    };
    poll();
    pollTimer = setInterval(poll, 60000);
  }

  function init() {
    const btn = document.getElementById('mark-all-read');
    if (btn) btn.onclick = markAllRead;
    if (document.getElementById('notif-full-list')) load();
    else startPolling();
  }

  return { init, load, markAllRead, startPolling };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Notifications.init();
});
window.Notifications = Notifications;
