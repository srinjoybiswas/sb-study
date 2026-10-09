/* ============================================================
   SB NOTES PORTAL — admin/admin-dashboard.js
   Admin stats, charts (Canvas), live activity, security widgets,
   maintenance toggles.
   ============================================================ */

const AdminDashboard = (function () {
  let refreshTimer = null;

  async function load() {
    try {
      const [dash, sec] = await Promise.all([
        API.admin('getAdminDashboard', {}),
        API.admin('getSecurityDashboard', {})
      ]);
      renderStats(dash.stats);
      renderViewing(dash.currentlyViewing);
      renderCharts(dash.charts);
      renderSecurity(sec);
      loadLive();
    } catch (err) {
      UI.toast(err.message || 'Failed to load dashboard.', 'error');
    }
  }

  function renderStats(s) {
    const el = document.getElementById('admin-stat-grid');
    if (!el) return;
    const cards = [
      { ico: '👥', cls: 'primary', val: s.totalStudents, label: 'Total Students' },
      { ico: '✅', cls: 'success', val: s.activeStudents, label: 'Active Students' },
      { ico: '🚫', cls: 'danger', val: s.blockedStudents, label: 'Blocked Students' },
      { ico: '🏛', cls: 'secondary', val: s.departments, label: 'Departments' },
      { ico: '📚', cls: 'primary', val: s.notes, label: 'Notes' },
      { ico: '⏱', cls: 'secondary', val: s.studyMinutesToday, label: 'Study Minutes Today' },
      { ico: '📘', cls: 'primary', val: s.studyMinutesTotal, label: 'Total Study Minutes' },
      { ico: '📊', cls: 'warning', val: s.weeklyResults, label: 'Weekly Results' },
      { ico: '🏆', cls: 'warning', val: s.certificatesIssued, label: 'Certificates Issued' },
      { ico: '🟢', cls: 'success', val: s.onlineStudents, label: 'Online Now' },
      { ico: '⚪', cls: 'secondary', val: s.offlineStudents, label: 'Offline' },
      { ico: '📈', cls: 'primary', val: s.averageStudyScore, label: 'Avg Weekly Score' },
      { ico: '🆕', cls: 'success', val: s.todayRegistrations, label: "Today's Registrations" },
      { ico: '🔑', cls: 'warning', val: s.todayLogins, label: "Today's Logins" }
    ];
    el.innerHTML = cards.map(c =>
      '<div class="stat-card"><div class="stat-ico ' + c.cls + '">' + c.ico + '</div>' +
      '<div><div class="stat-val">' + c.val + '</div><div class="stat-label">' + c.label + '</div></div></div>'
    ).join('');
  }

  function renderViewing(list) {
    const el = document.getElementById('currently-viewing');
    if (!el) return;
    if (!list || !list.length) { el.innerHTML = '<p class="text-muted text-sm">No students are viewing notes right now.</p>'; return; }
    el.innerHTML = list.map(v =>
      '<div class="activity-item"><span class="act-dot"></span>' +
      '<span><strong>' + UI.escapeHtml(v.name) + '</strong> is viewing <em>' + UI.escapeHtml(v.noteTitle) + '</em></span>' +
      '<span class="act-time">' + UI.timeAgo(v.since) + '</span></div>'
    ).join('');
  }

  function renderSecurity(sec) {
    const el = document.getElementById('security-grid');
    if (!el) return;
    const cards = [
      { cls: 'primary', val: sec.securityEventsToday, label: 'Security Events Today' },
      { cls: 'danger', val: sec.copyAttempts, label: 'Copy Attempts' },
      { cls: 'danger', val: sec.blockedStudents, label: 'Blocked Students' },
      { cls: 'warning', val: sec.suspiciousSessions, label: 'Suspicious Sessions' },
      { cls: 'warning', val: sec.fullscreenExits, label: 'Fullscreen Exits' },
      { cls: 'warning', val: sec.tabSwitches, label: 'Tab Switches' }
    ];
    el.innerHTML = cards.map(c =>
      '<div class="sec-card ' + c.cls + '"><div class="sec-val">' + c.val + '</div><div class="sec-label">' + c.label + '</div></div>'
    ).join('');
  }

  function renderCharts(charts) {
    drawBarChart('chart-registrations', charts.registrations);
    drawBarChart('chart-study', charts.study);
    drawDonut('chart-departments', charts.departmentDistribution);
  }

  function drawBarChart(id, series) {
    const canvas = document.getElementById(id);
    if (!canvas || !series) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.clientWidth || 400;
    const H = canvas.height = 180;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(1, ...series.map(s => s.value));
    const pad = 24, bw = (W - pad * 2) / series.length;
    series.forEach((s, i) => {
      const h = (s.value / max) * (H - 50);
      const x = pad + i * bw + bw * 0.15;
      const y = H - 30 - h;
      const grad = ctx.createLinearGradient(0, y, 0, H - 30);
      grad.addColorStop(0, '#4f46e5'); grad.addColorStop(1, '#7c3aed');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, bw * 0.7, h);
      ctx.fillStyle = '#6b7280'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      if (series.length <= 16) ctx.fillText(s.label, x + bw * 0.35, H - 12);
    });
  }

  function drawDonut(id, dist) {
    const canvas = document.getElementById(id);
    if (!canvas || !dist) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.clientWidth || 300;
    const H = canvas.height = 200;
    ctx.clearRect(0, 0, W, H);
    const total = dist.reduce((s, d) => s + d.count, 0) || 1;
    const colors = ['#4f46e5', '#7c3aed', '#16a34a', '#f59e0b', '#dc2626', '#0ea5e9'];
    let start = -Math.PI / 2;
    const cx = W / 2, cy = H / 2, r = 70;
    dist.forEach((d, i) => {
      const angle = (d.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      start += angle;
    });
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#111827'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 5);
  }

  async function loadLive() {
    try {
      const rows = await API.admin('getLiveActivity', {});
      const el = document.getElementById('live-activity');
      if (!el) return;
      if (!rows.length) { el.innerHTML = UI.emptyState('👥', 'No active sessions', 'Student sessions will appear here.'); return; }
      el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Student</th><th>Status</th><th>Last Active</th><th>Current Page</th><th>Current Note</th><th>Session</th>' +
        '</tr></thead><tbody>' + rows.map(r =>
          '<tr><td>' + UI.escapeHtml(r.name) + '</td>' +
          '<td><span class="status-pill ' + (r.status === 'ONLINE' ? 'online' : 'offline') + '">' +
          '<span class="p-dot"></span>' + r.status + '</span></td>' +
          '<td>' + UI.timeAgo(r.lastActive) + '</td>' +
          '<td>' + UI.escapeHtml(r.currentPage || '—') + '</td>' +
          '<td>' + UI.escapeHtml(r.currentNote || '—') + '</td>' +
          '<td class="text-xs text-muted">' + UI.escapeHtml((r.sessionId || '').substring(0, 12)) + '…</td></tr>'
        ).join('') + '</tbody></table></div>';
    } catch (e) {}
  }

  async function toggleMaintenance(mode) {
    try {
      await API.admin('setMaintenanceMode', { mode: mode });
      UI.toast('Maintenance mode ' + mode + '.', 'success');
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  function init() {
    const btn = document.getElementById('maintenance-toggle');
    if (btn) btn.onclick = () => toggleMaintenance(btn.dataset.mode === 'ON' ? 'OFF' : 'ON');
    load();
    refreshTimer = setInterval(loadLive, 30000);
  }

  return { init, load, loadLive };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminDashboard.init();
});
window.AdminDashboard = AdminDashboard;
