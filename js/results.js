/* ============================================================
   SB NOTES PORTAL — results.js
   Student weekly results: live study summary + weekly history,
   plus a single-result detail view with the study breakdown.
   ============================================================ */

const Results = (function () {

  const $ = id => document.getElementById(id);

  /* ------------------------- List view ------------------------- */

  async function loadList() {
    const sumEl = $('study-summary');
    const listEl = $('weekly-list');
    if (sumEl) sumEl.innerHTML = UI.skeleton(1).repeat(4).replace(/skeleton-line/g, 'skeleton-card');
    if (listEl) listEl.innerHTML = UI.skeleton(3).repeat(2).replace(/skeleton-line/g, 'skeleton-card');

    try {
      const [summary, results] = await Promise.all([
        API.get('getStudySummary', {}),
        API.get('getWeeklyResults', {})
      ]);
      renderSummary(summary);
      renderList(results);
    } catch (err) {
      if (listEl) listEl.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load results', err.message);
    }
  }

  function renderSummary(s) {
    const el = $('study-summary');
    if (!el) return;
    const cards = [
      { val: s.totalMinutes, label: 'Minutes studied' },
      { val: s.notesStudied, label: 'Notes studied' },
      { val: s.sessionsCount, label: 'Study sessions' },
      { val: s.daysStudied, label: 'Active days' }
    ];
    el.innerHTML = cards.map(c =>
      '<div class="result-stat"><div class="rs-val">' + c.val + '</div><div class="rs-label">' + c.label + '</div></div>'
    ).join('');
  }

  function renderList(results) {
    const el = $('weekly-list');
    if (!el) return;
    if (!results.length) {
      el.innerHTML = UI.emptyState('\ud83d\udcca', 'No weekly results yet',
        'A result is generated automatically at the end of each week based on the time you spend studying.');
      return;
    }
    el.innerHTML = results.map(r => {
      const score = parseInt(r.score, 10) || 0;
      return '<div class="result-card card">' +
        '<div class="rc-head"><div><div class="rc-week">' + UI.escapeHtml(r.weekStart) + ' \u2013 ' + UI.escapeHtml(r.weekEnd) + '</div>' +
        '<strong>Weekly Score</strong></div><div class="rc-score">' + score + '<span class="text-sm text-muted">/100</span></div></div>' +
        '<div class="result-stats">' +
        '<div class="result-stat"><div class="rs-val">' + (parseInt(r.totalMinutes, 10) || 0) + '</div><div class="rs-label">Minutes</div></div>' +
        '<div class="result-stat"><div class="rs-val">' + (parseInt(r.notesStudied, 10) || 0) + '</div><div class="rs-label">Notes</div></div>' +
        '<div class="result-stat"><div class="rs-val">' + (parseInt(r.daysStudied, 10) || 0) + '</div><div class="rs-label">Days</div></div>' +
        '</div>' +
        '<div class="flex gap-8 mt-12">' +
        '<a class="btn btn-outline btn-sm" href="results.html?id=' + encodeURIComponent(r.resultId) + '">View breakdown</a>' +
        (r.docUrl ? '<a class="btn btn-primary btn-sm" href="' + UI.escapeHtml(r.docUrl) + '" target="_blank" rel="noopener">\u2b07 Report</a>' : '') +
        '</div></div>';
    }).join('');
  }

  /* ------------------------- Detail view ------------------------- */

  async function loadDetail(resultId) {
    const listView = $('results-list-view');
    if (listView) listView.classList.add('hidden');
    const el = $('result-detail');
    if (!el) return;
    el.classList.remove('hidden');
    el.innerHTML = UI.skeleton(5);
    try {
      const res = await API.get('getWeeklyResultDetail', { resultId: resultId });
      renderDetail(res);
    } catch (err) {
      el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load result', err.message) +
        '<div class="text-center"><a class="btn btn-outline" href="results.html">Back to all results</a></div>';
    }
  }

  function renderDetail(res) {
    const el = $('result-detail');
    if (!el) return;
    const r = res.result || {};
    const breakdown = res.breakdown || [];
    const score = parseInt(r.score, 10) || 0;

    el.innerHTML =
      '<div class="flex-between mb-16"><a class="btn btn-outline btn-sm" href="results.html">\u2039 All results</a>' +
      (r.docUrl ? '<a class="btn btn-primary btn-sm" href="' + UI.escapeHtml(r.docUrl) + '" target="_blank" rel="noopener">\u2b07 Download report</a>' : '') + '</div>' +
      '<div class="score-hero">' +
      '<div class="score-ring" style="--pct:' + score + '%"><div class="inner">' + score + '</div></div>' +
      '<h2>Weekly Study Score</h2>' +
      '<p class="text-muted">' + UI.escapeHtml(r.weekStart || '') + ' \u2013 ' + UI.escapeHtml(r.weekEnd || '') + '</p></div>' +
      '<div class="result-stats mb-24">' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.totalMinutes, 10) || 0) + '</div><div class="rs-label">Minutes studied</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.notesStudied, 10) || 0) + '</div><div class="rs-label">Notes studied</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.sessionsCount, 10) || 0) + '</div><div class="rs-label">Study sessions</div></div>' +
      '<div class="result-stat"><div class="rs-val">' + (parseInt(r.daysStudied, 10) || 0) + '</div><div class="rs-label">Active days</div></div>' +
      '</div>' +
      '<h3 class="mb-12">Study breakdown</h3>' +
      (breakdown.length
        ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Note</th><th>Subject</th><th>Module</th><th>Time</th></tr></thead><tbody>' +
          breakdown.map(b => '<tr><td>' + UI.escapeHtml(b.title || '') + '</td>' +
            '<td>' + UI.escapeHtml(b.subject || '\u2014') + '</td>' +
            '<td>' + UI.escapeHtml(b.module || '\u2014') + '</td>' +
            '<td>' + (parseInt(b.minutes, 10) || 0) + ' min</td></tr>').join('') +
          '</tbody></table></div>'
        : UI.emptyState('\ud83d\udcda', 'No study recorded', 'You did not open any notes during this week.'));
  }

  function init() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id && $('result-detail')) loadDetail(id);
    else loadList();
  }

  return { init, loadList, loadDetail };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Results.init();
});
window.Results = Results;
