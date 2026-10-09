/* ============================================================
   SB NOTES PORTAL — admin/results.js
   Admin view of automatic weekly results + monthly certificates,
   plus on-demand generation and trigger installation.
   ============================================================ */

const AdminResults = (function () {
  let tab = 'weekly';
  let data = { weekly: [], certificates: [] };

  const $ = id => document.getElementById(id);

  async function load() {
    const el = $('results-table');
    if (el) el.innerHTML = UI.skeleton(5);
    try {
      const [weekly, certs] = await Promise.all([
        API.admin('getAdminWeeklyResults', { page: 1, pageSize: 200 }),
        API.admin('getAdminCertificates', { page: 1, pageSize: 200 })
      ]);
      data.weekly = weekly.items || [];
      data.certificates = certs.items || certs || [];
      render();
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load results', err.message);
    }
  }

  async function loadStatus() {
    const el = $('automation-status');
    if (!el) return;
    try {
      const s = await API.admin('getResultsStatus', {});
      const triggers = (s.triggers || []).map(t => t.handler).join(', ') || 'none installed';
      el.innerHTML =
        '<div class="result-stats">' +
        '<div class="result-stat"><div class="rs-val">' + (s.weeklyResultsTotal || 0) + '</div><div class="rs-label">Weekly results</div></div>' +
        '<div class="result-stat"><div class="rs-val">' + (s.certificatesTotal || 0) + '</div><div class="rs-label">Certificates</div></div>' +
        '<div class="result-stat"><div class="rs-val">' + (s.latestWeekStart ? UI.escapeHtml(s.latestWeekStart) : '\u2014') + '</div><div class="rs-label">Latest week</div></div>' +
        '<div class="result-stat"><div class="rs-val">' + (s.minimumScore || 50) + '</div><div class="rs-label">Min score for cert</div></div>' +
        '</div>' +
        '<p class="text-sm text-muted mt-12">Next weekly period: <strong>' + UI.escapeHtml(s.thisWeek || '') +
        '</strong> \u00b7 next monthly period: <strong>' + UI.escapeHtml(s.thisMonth || '') + '</strong></p>' +
        '<p class="text-sm text-muted mt-8">Triggers: ' + UI.escapeHtml(triggers) + '</p>';
    } catch (err) {
      el.innerHTML = '<p class="text-sm text-danger">' + UI.escapeHtml(err.message) + '</p>';
    }
  }

  function render() {
    const el = $('results-table');
    if (!el) return;
    if (tab === 'weekly') {
      if (!data.weekly.length) { el.innerHTML = UI.emptyState('\ud83d\udcca', 'No weekly results yet', 'Run “Generate Weekly” or wait for the automatic weekly trigger.'); return; }
      el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Week</th><th>Student</th><th>Score</th><th>Minutes</th><th>Notes</th><th>Days</th><th>Report</th>' +
        '</tr></thead><tbody>' + data.weekly.map(r =>
          '<tr><td class="text-xs">' + UI.escapeHtml(r.weekStart) + ' \u2013 ' + UI.escapeHtml(r.weekEnd) + '</td>' +
          '<td>' + UI.escapeHtml(r.studentName || r.studentId) + '</td>' +
          '<td><strong>' + (parseInt(r.score, 10) || 0) + '</strong>/100</td>' +
          '<td>' + (parseInt(r.totalMinutes, 10) || 0) + '</td>' +
          '<td>' + (parseInt(r.notesStudied, 10) || 0) + '</td>' +
          '<td>' + (parseInt(r.daysStudied, 10) || 0) + '</td>' +
          '<td>' + (r.docUrl ? '<a class="btn btn-outline btn-sm" href="' + UI.escapeHtml(r.docUrl) + '" target="_blank" rel="noopener">Open</a>' : '\u2014') + '</td></tr>'
        ).join('') + '</tbody></table></div>';
    } else {
      if (!data.certificates.length) { el.innerHTML = UI.emptyState('\ud83c\udfc6', 'No certificates yet', 'Run “Generate Monthly” or wait for the automatic monthly trigger.'); return; }
      el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Certificate ID</th><th>Student</th><th>Month</th><th>Score</th><th>Minutes</th><th>Issued</th><th>File</th>' +
        '</tr></thead><tbody>' + data.certificates.map(c =>
          '<tr><td class="text-xs">' + UI.escapeHtml(c.certificateId) + '</td>' +
          '<td>' + UI.escapeHtml(c.studentName || c.studentId) + '</td>' +
          '<td>' + UI.escapeHtml(c.period || '') + '</td>' +
          '<td><strong>' + (parseInt(c.score, 10) || 0) + '</strong>/100</td>' +
          '<td>' + (parseInt(c.totalMinutes, 10) || 0) + '</td>' +
          '<td class="text-xs">' + UI.formatDate(c.issuedAt) + '</td>' +
          '<td>' + (c.docUrl ? '<a class="btn btn-outline btn-sm" href="' + UI.escapeHtml(c.docUrl) + '" target="_blank" rel="noopener">Open</a>' : '\u2014') + '</td></tr>'
        ).join('') + '</tbody></table></div>';
    }
  }

  async function generate(kind, btnId) {
    const btn = $(btnId);
    if (!(await UI.confirmDialog('Generate ' + kind + ' results',
      'Generate ' + kind + ' results now? Periods that already have results are skipped.', 'Generate'))) return;
    UI.setLoading(btn, true, 'Generating\u2026');
    try {
      const res = await API.admin('generateResultsNow', { mode: kind });
      UI.toast(res && res.message ? res.message : ('Generated ' + kind + ' results.'), 'success', 8000);
      loadStatus();
      load();
    } catch (err) { UI.toast(err.message || 'Generation failed.', 'error', 7000); }
    finally { UI.setLoading(btn, false); }
  }

  async function installTriggers() {
    const btn = $('install-triggers');
    UI.setLoading(btn, true, 'Installing\u2026');
    try {
      const res = await API.admin('installTriggers', {});
      UI.toast(res && res.message ? res.message : 'Triggers installed.', 'success', 8000);
      loadStatus();
    } catch (err) { UI.toast(err.message || 'Could not install triggers.', 'error', 7000); }
    finally { UI.setLoading(btn, false); }
  }

  function init() {
    // Bind before any await so the buttons always work.
    const gw = $('gen-weekly');
    if (gw) gw.onclick = () => generate('weekly', 'gen-weekly');
    const gm = $('gen-monthly');
    if (gm) gm.onclick = () => generate('monthly', 'gen-monthly');
    const it = $('install-triggers');
    if (it) it.onclick = installTriggers;
    document.querySelectorAll('#result-tabs [data-tab]').forEach(b => b.onclick = () => {
      document.querySelectorAll('#result-tabs [data-tab]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      tab = b.dataset.tab;
      render();
    });
    loadStatus();
    load();
  }

  return { init, load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminResults.init();
});
window.AdminResults = AdminResults;
