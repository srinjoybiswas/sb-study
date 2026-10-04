/* ============================================================
   SB NOTES PORTAL — activity.js
   Student-facing activity/results history helpers.
   (Admin live activity lives in js/admin/activity.js.)
   ============================================================ */

const Activity = (function () {
  async function loadResults() {
    const el = document.getElementById('results-list');
    if (el) el.innerHTML = UI.skeleton(3).repeat(2).replace(/skeleton-line/g, 'skeleton-card');
    try {
      const results = await API.get('getResults', {});
      renderResults(results);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load results', err.message);
    }
  }

  function renderResults(results) {
    const el = document.getElementById('results-list');
    if (!el) return;
    if (!results.length) { el.innerHTML = UI.emptyState('📊', 'No results yet', 'Take a test to see your results here.'); return; }
    el.innerHTML = results.map(r => {
      const pass = r.result === 'PASSED';
      return '<div class="test-card">' +
        '<div class="test-head"><h3>' + UI.escapeHtml(r.testTitle) + '</h3>' +
        '<span class="badge badge-' + (pass ? 'success' : 'danger') + '">' + UI.escapeHtml(r.result) + '</span></div>' +
        '<div class="test-stats"><span>🎯 ' + r.obtainedMarks + '/' + r.totalMarks + '</span>' +
        '<span>📊 ' + r.percentage + '%</span><span>✅ ' + r.correctCount + '</span>' +
        '<span>❌ ' + r.wrongCount + '</span><span>⭕ ' + r.unansweredCount + '</span></div>' +
        '<div class="text-xs text-muted">' + UI.formatDateTime(r.submittedAt) + '</div>' +
        '<a class="btn btn-outline btn-sm" href="result.html?attemptId=' + encodeURIComponent(r.attemptId) + '">View Details</a>' +
        '</div>';
    }).join('');
  }

  async function loadResultDetail(attemptId) {
    const el = document.getElementById('result-detail');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const res = await API.get('getResultDetail', { attemptId: attemptId });
      renderResultDetail(res);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load result', err.message);
    }
  }

  function renderResultDetail(res) {
    const el = document.getElementById('result-detail');
    if (!el) return;
    const a = res.attempt;
    const pass = a.result === 'PASSED';
    el.innerHTML =
      '<div class="result-hero ' + (pass ? 'pass' : 'fail') + '">' +
      '<div class="score-ring" style="--pct:' + a.percentage + '%"><div class="inner">' + a.percentage + '%</div></div>' +
      '<h2>' + (pass ? '🎉 PASSED' : '😔 FAILED') + '</h2>' +
      '<p class="text-muted">' + UI.escapeHtml(res.test.title) + ' · Passing: ' + res.test.passingPercent + '%</p>' +
      '</div>' +
      '<div class="result-stats mb-24">' +
      '<div class="result-stat"><div class="rs-val">' + a.obtainedMarks + '/' + a.totalMarks + '</div><div class="rs-label">Score</div></div>' +
      '<div class="result-stat"><div class="rs-val" style="color:var(--success)">' + a.correctCount + '</div><div class="rs-label">Correct</div></div>' +
      '<div class="result-stat"><div class="rs-val" style="color:var(--danger)">' + a.wrongCount + '</div><div class="rs-label">Wrong</div></div>' +
      '<div class="result-stat"><div class="rs-val" style="color:var(--muted)">' + a.unansweredCount + '</div><div class="rs-label">Unanswered</div></div>' +
      '</div>' +
      (pass ? '<div class="text-center mb-24"><a class="btn btn-primary" href="certificate.html?id=' + encodeURIComponent(a.attemptId) + '">View Certificate</a></div>' : '') +
      '<h3 class="mb-16">Answer Review</h3>' +
      res.review.map((q, i) => {
        const cls = !q.selectedOption ? 'unanswered' : q.isCorrect ? 'correct' : 'wrong';
        return '<div class="review-item ' + cls + '">' +
          '<strong>Q' + (i + 1) + '. ' + UI.escapeHtml(q.questionText) + '</strong>' +
          ['A', 'B', 'C', 'D'].map(k => {
            if (!q.options[k]) return '';
            let c = '';
            if (k === q.correctAnswer) c = 'correct-ans';
            else if (k === q.selectedOption) c = 'chosen-wrong';
            return '<div class="rev-opt ' + c + '">' + k + '. ' + UI.escapeHtml(q.options[k]) +
              (k === q.correctAnswer ? ' ✓' : '') + (k === q.selectedOption && !q.isCorrect ? ' ✗' : '') + '</div>';
          }).join('') +
          '</div>';
      }).join('');
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get('attemptId');
    if (document.getElementById('result-detail') && attemptId) loadResultDetail(attemptId);
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
