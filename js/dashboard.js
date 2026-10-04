/* ============================================================
   SB NOTES PORTAL — dashboard.js
   Student dashboard: stats, notes, tests, announcements, activity.
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
      checkCriticalTest(data.criticalTest);
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
    renderNotes('my-notes', data.myNotes, 'No notes in your department yet.');
    renderNotes('other-notes', data.otherNotes, 'No notes from other departments.');
    renderTests(data.availableTests);
    renderAnnouncements(data.announcements);
    renderActivity(data.recentActivity);
    renderNotifications(data.notifications, data.unreadCount);
  }

  function renderStats(s) {
    const el = document.getElementById('stat-grid');
    if (!el) return;
    const cards = [
      { ico: '📚', cls: 'primary', val: s.notesAvailable, label: 'Notes Available' },
      { ico: '📝', cls: 'secondary', val: s.testsAvailable, label: 'Tests Available' },
      { ico: '✅', cls: 'success', val: s.testsCompleted, label: 'Tests Completed' },
      { ico: '📊', cls: 'warning', val: s.averageScore + '%', label: 'Average Score' },
      { ico: '🏆', cls: 'danger', val: s.certificatesEarned, label: 'Certificates Earned' }
    ];
    el.innerHTML = cards.map(c =>
      '<div class="stat-card"><div class="stat-ico ' + c.cls + '">' + c.ico + '</div>' +
      '<div><div class="stat-val">' + c.val + '</div><div class="stat-label">' + c.label + '</div></div></div>'
    ).join('');
  }

  function renderNotes(id, notes, emptyMsg) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!notes || !notes.length) { el.innerHTML = UI.emptyState('📄', 'No notes', emptyMsg); return; }
    el.innerHTML = notes.map(n =>
      '<div class="note-card">' +
      '<div class="note-top"><div class="note-ico">📄</div>' +
      '<span class="note-type-chip ' + (n.fileType || 'pdf') + '">' + UI.escapeHtml(n.fileType || 'pdf') + '</span></div>' +
      '<h3>' + UI.escapeHtml(n.title) + '</h3>' +
      '<div class="note-meta"><span>🏛 ' + UI.escapeHtml(n.departmentName || '') + '</span>' +
      '<span>📅 Sem ' + UI.escapeHtml(n.semester || '—') + '</span></div>' +
      '<p class="note-desc">' + UI.escapeHtml(n.description || '') + '</p>' +
      '<a class="btn btn-primary btn-sm" href="notes.html?noteId=' + encodeURIComponent(n.noteId) + '">Open Note</a>' +
      '</div>'
    ).join('');
  }

  function renderTests(tests) {
    const el = document.getElementById('available-tests');
    if (!el) return;
    if (!tests || !tests.length) { el.innerHTML = UI.emptyState('📝', 'No tests available', 'Check back later for new tests.'); return; }
    el.innerHTML = tests.map(t => {
      const prio = t.priority === 'CRITICAL' ? 'danger' : t.priority === 'REQUIRED' ? 'warning' : 'primary';
      return '<div class="test-card">' +
        '<div class="test-head"><h3>' + UI.escapeHtml(t.title) + '</h3>' +
        '<span class="badge badge-' + prio + '">' + UI.escapeHtml(t.priority) + '</span></div>' +
        '<div class="test-stats"><span>❓ ' + t.questionCount + ' questions</span>' +
        '<span>🎯 ' + t.totalMarks + ' marks</span><span>⏱ ' + Math.round(t.totalTime / 60) + ' min</span></div>' +
        (t.attempted ? '<span class="badge badge-success">Attempted · Best ' + t.bestScore + '%</span>' : '') +
        '<a class="btn btn-primary btn-sm" href="test.html?testId=' + encodeURIComponent(t.testId) + '">' +
        (t.attempted ? 'Retake Test' : 'Start Test') + '</a></div>';
    }).join('');
  }

  function renderAnnouncements(list) {
    const el = document.getElementById('announcements');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = UI.emptyState('📢', 'No announcements', 'You are all caught up.'); return; }
    el.innerHTML = list.map(a =>
      '<div class="announcement ' + UI.escapeHtml(a.priority) + '">' +
      '<h4>' + UI.escapeHtml(a.title) + '</h4><p>' + UI.escapeHtml(a.message) + '</p>' +
      '<div class="ann-date">' + UI.formatDate(a.createdAt) + '</div></div>'
    ).join('');
    // Emergency announcements as modal.
    const emergency = list.filter(a => a.priority === 'EMERGENCY');
    if (emergency.length) showEmergencyModal(emergency[0]);
  }

  function showEmergencyModal(a) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = '<div class="modal" role="alertdialog" aria-modal="true">' +
      '<div class="modal-header"><h3>🚨 Emergency Announcement</h3></div>' +
      '<div class="modal-body"><h4>' + UI.escapeHtml(a.title) + '</h4><p class="mt-8">' + UI.escapeHtml(a.message) + '</p></div>' +
      '<div class="modal-footer"><button class="btn btn-primary" data-close>Acknowledge</button></div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-close]').onclick = () => overlay.remove();
  }

  function renderActivity(list) {
    const el = document.getElementById('recent-activity');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = UI.emptyState('🕒', 'No recent activity', 'Your actions will appear here.'); return; }
    el.innerHTML = '<div class="activity-feed">' + list.map(a =>
      '<div class="activity-item"><span class="act-dot"></span>' +
      '<span>' + UI.escapeHtml(a.action || 'Activity') + (a.page ? ' · ' + UI.escapeHtml(a.page) : '') + '</span>' +
      '<span class="act-time">' + UI.timeAgo(a.timestamp) + '</span></div>'
    ).join('') + '</div>';
  }

  function renderNotifications(list, unread) {
    const badge = document.getElementById('notif-count');
    if (badge) { badge.textContent = unread || 0; badge.style.display = unread ? 'flex' : 'none'; }
    const el = document.getElementById('notif-list');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = UI.emptyState('🔔', 'No notifications', 'You have no notifications yet.'); return; }
    el.innerHTML = list.map(n =>
      '<div class="activity-item"><span class="act-dot"></span>' +
      '<span><strong>' + UI.escapeHtml(n.title) + '</strong><br><span class="text-muted text-sm">' + UI.escapeHtml(n.message) + '</span></span>' +
      '<span class="act-time">' + UI.timeAgo(n.createdAt) + '</span></div>'
    ).join('');
  }

  function checkCriticalTest(critical) {
    if (!critical) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = '<div class="modal" role="alertdialog" aria-modal="true">' +
      '<div class="modal-header"><h3>⚠️ Critical Test Required</h3></div>' +
      '<div class="modal-body"><p>You must complete the critical test <strong>' + UI.escapeHtml(critical.title) +
      '</strong> before you can access the dashboard.</p></div>' +
      '<div class="modal-footer"><a class="btn btn-danger" href="test.html?testId=' + encodeURIComponent(critical.testId) + '">Take Test Now</a></div></div>';
    document.body.appendChild(overlay);
  }

  return { load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Dashboard.load();
});
window.Dashboard = Dashboard;
