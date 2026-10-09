/* ============================================================
   SB NOTES PORTAL — dashboard.js
   Student dashboard: study stats, notes, weekly result,
   announcements and recent activity.
   ============================================================ */

const Dashboard = (function () {
  let data = null;

  async function load() {
    const statsEl = document.getElementById('stat-grid');
    if (statsEl) statsEl.innerHTML = UI.skeleton(1).repeat(5).replace(/skeleton-line/g, 'skeleton-card');
    try {
      data = await API.get('getStudentDashboard', {});
      render();
      Heartbeat.start('dashboard');
    } catch (err) {
      handleError(err);
    }
  }

  function handleError(err) {
    if (err.errorCode === 'MAINTENANCE') { window.location.href = 'maintenance.html'; return; }
    if (err.errorCode === 'BLOCKED') { window.location.href = 'blocked.html'; return; }
    if (err.errorCode === 'SESSION_EXPIRED' || err.errorCode === 'UNAUTHORIZED') {
      UI.toast('Session expired. Please log in again.', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1200);
      return;
    }
    UI.toast(err.message || 'Failed to load dashboard.', 'error');
  }

  function render() {
    renderStats(data.stats);
    renderStudy(data.study, data.latestWeekly);
    renderNotes('my-notes', data.myNotes, 'No notes in your department yet.');
    renderNotes('other-notes', data.otherNotes, 'No notes from other departments.');
    renderAnnouncements(data.announcements);
    renderActivity(data.recentActivity);
    renderNotifications(data.notifications, data.unreadCount);
  }

  function renderStats(s) {
    const el = document.getElementById('stat-grid');
    if (!el) return;
    const score = (s.latestScore === null || s.latestScore === undefined) ? '\u2014' : s.latestScore;
    const cards = [
      { ico: '\ud83d\udcda', cls: 'primary', val: s.notesAvailable, label: 'Notes Available' },
      { ico: '\u23f1', cls: 'secondary', val: s.studyMinutes, label: 'Minutes Studied' },
      { ico: '\ud83d\udd25', cls: 'warning', val: s.studyMinutesWeek, label: 'Minutes This Week' },
      { ico: '\ud83d\udcca', cls: 'success', val: score, label: 'Latest Weekly Score' },
      { ico: '\ud83c\udfc6', cls: 'danger', val: s.certificatesEarned, label: 'Certificates Earned' }
    ];
    el.innerHTML = cards.map(c =>
      '<div class="stat-card"><div class="stat-ico ' + c.cls + '">' + c.ico + '</div>' +
      '<div><div class="stat-val">' + c.val + '</div><div class="stat-label">' + c.label + '</div></div></div>'
    ).join('');
  }

  /** Weekly result + study breakdown (replaces the old Available Tests widget). */
  function renderStudy(study, weekly) {
    const el = document.getElementById('study-widget');
    if (!el) return;
    const latest = (weekly && weekly.length) ? weekly[0] : null;
    let html = '';
    if (latest) {
      const score = parseInt(latest.score, 10) || 0;
      html += '<div class="score-hero"><div class="score-ring" style="--pct:' + score + '%"><div class="inner">' + score + '</div></div>' +
        '<strong>' + UI.escapeHtml(latest.weekStart) + ' \u2013 ' + UI.escapeHtml(latest.weekEnd) + '</strong>' +
        '<p class="text-muted text-sm mb-0">Score out of 100</p></div>';
    } else {
      html += UI.emptyState('\ud83d\udcca', 'No weekly result yet', 'Your first result is generated at the end of the week.');
    }
    if (study && study.bySubject && study.bySubject.length) {
      html += '<h4 class="mb-8 mt-16">Time by subject</h4>' + study.bySubject.map(s =>
        '<div class="activity-item"><span class="act-dot"></span><span>' + UI.escapeHtml(s.subject) + '</span>' +
        '<span class="act-time">' + s.minutes + ' min</span></div>').join('');
    }
    html += '<div class="text-center mt-16"><a class="btn btn-outline btn-sm" href="results.html">View all results</a></div>';
    el.innerHTML = html;
  }

  function renderNotes(id, notes, emptyMsg) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!notes || !notes.length) { el.innerHTML = UI.emptyState('\ud83d\udcc4', 'No notes', emptyMsg); return; }
    el.innerHTML = notes.map(n =>
      '<div class="note-card">' +
      '<div class="note-top"><div class="note-ico">\ud83d\udcc4</div>' +
      '<span class="note-type-chip ' + (n.fileType || 'pdf') + '">' + UI.escapeHtml(n.fileType || 'pdf') + '</span></div>' +
      '<h3>' + UI.escapeHtml(n.title) + '</h3>' +
      '<div class="note-meta"><span>\ud83c\udfdb ' + UI.escapeHtml(n.departmentName || '') + '</span>' +
      (n.subject ? '<span>\ud83d\udcd8 ' + UI.escapeHtml(n.subject) + '</span>' : '') + '</div>' +
      '<p class="note-desc">' + UI.escapeHtml(n.description || '') + '</p>' +
      '<a class="btn btn-primary btn-sm" href="notes.html?noteId=' + encodeURIComponent(n.noteId) + '">Open Note</a>' +
      '</div>'
    ).join('');
  }

  function renderAnnouncements(list) {
    const el = document.getElementById('announcements');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = UI.emptyState('\ud83d\udce2', 'No announcements', 'You are all caught up.'); return; }
    el.innerHTML = list.map(a =>
      '<div class="announcement ' + UI.escapeHtml(a.priority) + '">' +
      '<h4>' + UI.escapeHtml(a.title) + '</h4><p>' + UI.escapeHtml(a.message) + '</p>' +
      '<div class="ann-date">' + UI.formatDate(a.createdAt) + '</div></div>'
    ).join('');
    const emergency = list.filter(a => a.priority === 'EMERGENCY');
    if (emergency.length) showEmergencyModal(emergency[0]);
  }

  function showEmergencyModal(a) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = '<div class="modal" role="alertdialog" aria-modal="true">' +
      '<div class="modal-header"><h3>\ud83d\udea8 Emergency Announcement</h3></div>' +
      '<div class="modal-body"><h4>' + UI.escapeHtml(a.title) + '</h4><p class="mt-8">' + UI.escapeHtml(a.message) + '</p></div>' +
      '<div class="modal-footer"><button class="btn btn-primary" data-close>Acknowledge</button></div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
  }

  function renderActivity(list) {
    const el = document.getElementById('recent-activity');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = UI.emptyState('\ud83d\udd52', 'No recent activity', 'Your actions will appear here.'); return; }
    el.innerHTML = '<div class="activity-feed">' + list.map(a =>
      '<div class="activity-item"><span class="act-dot"></span>' +
      '<span>' + UI.escapeHtml(a.action || 'Activity') + (a.page ? ' \u00b7 ' + UI.escapeHtml(a.page) : '') + '</span>' +
      '<span class="act-time">' + UI.timeAgo(a.timestamp) + '</span></div>'
    ).join('') + '</div>';
  }

  function renderNotifications(list, unread) {
    const badge = document.getElementById('notif-count');
    if (badge) { badge.textContent = unread || 0; badge.style.display = unread ? 'flex' : 'none'; }
    const el = document.getElementById('notif-list');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = UI.emptyState('\ud83d\udd14', 'No notifications', 'You have no notifications yet.'); return; }
    el.innerHTML = list.map(n =>
      '<div class="activity-item"><span class="act-dot"></span>' +
      '<span><strong>' + UI.escapeHtml(n.title) + '</strong><br><span class="text-muted text-sm">' + UI.escapeHtml(n.message) + '</span></span>' +
      '<span class="act-time">' + UI.timeAgo(n.createdAt) + '</span></div>'
    ).join('');
  }

  return { load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Dashboard.load();
});
window.Dashboard = Dashboard;
