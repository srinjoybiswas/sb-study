/* ============================================================
   SB NOTES PORTAL — activity.js
   Student-facing weekly results + study history helpers.
   (Admin live activity lives in js/admin/activity.js.)

   The old test-attempt history was replaced by weekly study
   results (see results.js for the main student Results page).
   ============================================================ */

const Activity = (function () {
  async function loadResults() {
    const el = document.getElementById('results-list');
    if (el) el.innerHTML = UI.skeleton(3).repeat(2).replace(/skeleton-line/g, 'skeleton-card');
    try {
      const results = await API.get('getWeeklyResults', {});
      renderResults(results);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load results', err.message);
    }
  }

  function renderResults(results) {
    const el = document.getElementById('results-list');
    if (!el) return;
    if (!results.length) { el.innerHTML = UI.emptyState('\ud83d\udcca', 'No results yet', 'Study your notes to earn a weekly score.'); return; }
    el.innerHTML = results.map(r =>
      '<div class="result-card card">' +
      '<div class="rc-head"><div><div class="rc-week">' + UI.escapeHtml(r.weekStart || '') + ' \u2013 ' + UI.escapeHtml(r.weekEnd || '') + '</div>' +
      '<strong>' + UI.escapeHtml(r.studentName || '') + '</strong></div>' +
      '<div class="rc-score">' + (parseInt(r.score, 10) || 0) + '<span class="text-sm text-muted">/100</span></div></div>' +
      '<div class="result-stats">' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.totalMinutes, 10) || 0) + '</div><div class="rs-label">Minutes</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.notesStudied, 10) || 0) + '</div><div class="rs-label">Notes studied</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.daysStudied, 10) || 0) + '</div><div class="rs-label">Active days</div></div>' +
      '</div>' +
      '<a class="btn btn-outline btn-sm mt-12" href="results.html?id=' + encodeURIComponent(r.resultId) + '">View Details</a>' +
      '</div>'
    ).join('');
  }

  async function loadResultDetail(resultId) {
    const el = document.getElementById('result-detail');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const res = await API.get('getWeeklyResultDetail', { resultId: resultId });
      renderResultDetail(res);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load result', err.message);
    }
  }

  function renderResultDetail(res) {
    const el = document.getElementById('result-detail');
    if (!el) return;
    const r = res.result;
    const breakdown = res.breakdown || [];
    el.innerHTML =
      '<div class="score-hero"><div class="score-ring" style="--pct:' + (parseInt(r.score, 10) || 0) + '%">' +
      '<div class="inner">' + (parseInt(r.score, 10) || 0) + '</div></div>' +
      '<h2>Weekly Study Score</h2><p class="text-muted">' + UI.escapeHtml(r.weekStart || '') + ' \u2013 ' + UI.escapeHtml(r.weekEnd || '') + '</p></div>' +
      '<div class="result-stats mb-24">' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.totalMinutes, 10) || 0) + '</div><div class="rs-label">Minutes studied</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.notesStudied, 10) || 0) + '</div><div class="rs-label">Notes studied</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.sessionsCount, 10) || 0) + '</div><div class="rs-label">Study sessions</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.daysStudied, 10) || 0) + '</div><div class="rs-label">Active days</div></div>' +
      '</div>' +
      '<h3 class="mb-12">Study breakdown</h3>' +
      (breakdown.length
        ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Note</th><th>Subject</th><th>Module</th><th>Time</th></tr></thead><tbody>' +
          breakdown.map(b => '<tr><td>' + UI.escapeHtml(b.title || '') + '</td><td>' + UI.escapeHtml(b.subject || '\u2014') + '</td>' +
            '<td>' + UI.escapeHtml(b.module || '\u2014') + '</td><td>' + (parseInt(b.minutes, 10) || 0) + ' min</td></tr>').join('') +
          '</tbody></table></div>'
        : UI.emptyState('\ud83d\udcda', 'No study recorded', 'You did not open any notes during this week.')) +
      (r.docUrl ? '<div class="text-center mt-24"><a class="btn btn-primary" href="' + UI.escapeHtml(r.docUrl) + '" target="_blank" rel="noopener">\u2b07 Download report</a></div>' : '');
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const resultId = params.get('id') || params.get('resultId');
    if (document.getElementById('result-detail') && resultId) loadResultDetail(resultId);
    else if (document.getElementById('results-list')) loadResults();
  }

  return { init, loadResults, loadResultDetail };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Activity.init();
});
window.Activity = Activity;
