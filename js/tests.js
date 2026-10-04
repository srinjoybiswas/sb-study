/* ============================================================
   SB NOTES PORTAL — tests.js
   Test list, test-taking interface, timer, palette, anti-cheat,
   auto-save, auto-submit. Score is computed server-side.
   ============================================================ */

const Tests = (function () {
  let attempt = null;      // { attemptId, test, questions }
  let answers = {};        // questionId -> selectedOption
  let review = {};         // questionId -> true
  let current = 0;
  let timeLeft = 0;
  let timer = null;
  let cameraStream = null;
  let antiCheatHandlers = [];

  /* ------------------------- List ------------------------- */
  async function loadList() {
    const el = document.getElementById('tests-list');
    if (el) el.innerHTML = UI.skeleton(3).repeat(2).replace(/skeleton-line/g, 'skeleton-card');
    try {
      const tests = await API.get('getTests', {});
      renderList(tests);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load tests', err.message);
    }
  }

  function renderList(tests) {
    const el = document.getElementById('tests-list');
    if (!el) return;
    if (!tests.length) { el.innerHTML = UI.emptyState('📝', 'No tests available', 'Check back later.'); return; }
    el.innerHTML = tests.map(t => {
      const prio = t.priority === 'CRITICAL' ? 'danger' : t.priority === 'REQUIRED' ? 'warning' : 'primary';
      return '<div class="test-card">' +
        '<div class="test-head"><h3>' + UI.escapeHtml(t.title) + '</h3>' +
        '<span class="badge badge-' + prio + '">' + UI.escapeHtml(t.priority) + '</span></div>' +
        '<p class="text-muted text-sm">' + UI.escapeHtml(t.description || '') + '</p>' +
        '<div class="test-stats"><span>❓ ' + t.questionCount + '</span><span>🎯 ' + t.totalMarks + ' marks</span>' +
        '<span>⏱ ' + Math.round(t.totalTime / 60) + ' min</span><span>✅ Pass ' + t.passingPercent + '%</span></div>' +
        (t.attempted ? '<span class="badge badge-success">Best: ' + t.bestScore + '%</span>' : '') +
        '<a class="btn btn-primary btn-sm" href="test.html?testId=' + encodeURIComponent(t.testId) + '">' +
        (t.attempted ? 'Retake' : 'Start Test') + '</a></div>';
    }).join('');
  }

  /* ------------------------- Taking ------------------------- */
  async function start(testId) {
    try {
      const res = await API.get('startTest', { testId: testId });
      if (res.resumed) { UI.toast('Resuming your previous attempt.', 'info'); }
      attempt = res;
      answers = {}; review = {}; current = 0;
      timeLeft = res.test.totalTime;
      renderTest();
      startTimer();
      if (res.test.cameraRequired) requestCamera();
      if (res.test.antiCheating) enableAntiCheat();
    } catch (err) {
      UI.toast(err.message || 'Could not start test.', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
    }
  }

  function renderTest() {
    const wrap = document.getElementById('test-wrap');
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="test-header">' +
      '<div><div class="th-title">' + UI.escapeHtml(attempt.test.title) + '</div>' +
      '<div class="th-sub">Question <span id="q-pos">1</span> of ' + attempt.questions.length + '</div></div>' +
      '<div class="timer" id="timer">--:--</div></div>' +
      '<div class="test-layout">' +
      '<div class="question-panel" id="question-panel"></div>' +
      '<div class="palette"><h4>Question Palette</h4><div class="palette-grid" id="palette"></div>' +
      '<div class="palette-legend">' +
      '<div class="lg"><span class="sw" style="background:var(--success)"></span> Answered</div>' +
      '<div class="lg"><span class="sw" style="background:var(--warning)"></span> Marked for review</div>' +
      '<div class="lg"><span class="sw"></span> Not answered</div></div>' +
      '<button class="btn btn-success btn-block mt-16" id="submit-test">Submit Test</button></div></div>';
    document.getElementById('submit-test').onclick = confirmSubmit;
    renderQuestion();
    renderPalette();
  }

  function renderQuestion() {
    const q = attempt.questions[current];
    const panel = document.getElementById('question-panel');
    const pos = document.getElementById('q-pos');
    if (pos) pos.textContent = current + 1;
    const selected = answers[q.questionId];
    panel.innerHTML =
      '<div class="q-progress"><span>Marks: ' + q.marks + '</span>' +
      '<div class="progress" style="flex:1"><div class="bar" style="width:' + Math.round(((current + 1) / attempt.questions.length) * 100) + '%"></div></div>' +
      '<span>' + (current + 1) + '/' + attempt.questions.length + '</span></div>' +
      '<div class="q-text">' + UI.escapeHtml(q.questionText) + '</div>' +
      q.options.map(o =>
        '<button class="option-btn' + (selected === o.key ? ' selected' : '') + '" data-opt="' + o.key + '">' +
        '<span class="opt-key">' + o.key + '</span><span>' + UI.escapeHtml(o.text) + '</span></button>'
      ).join('') +
      '<div class="test-nav">' +
      '<button class="btn btn-outline" id="prev-q"' + (current === 0 ? ' disabled' : '') + '>‹ Previous</button>' +
      '<button class="btn btn-warning" id="mark-review">' + (review[q.questionId] ? 'Unmark Review' : 'Mark for Review') + '</button>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn-primary" id="next-q"' + (current === attempt.questions.length - 1 ? ' disabled' : '') + '>Next ›</button>' +
      '</div>';

    panel.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => selectOption(q.questionId, b.dataset.opt));
    const prev = document.getElementById('prev-q');
    const next = document.getElementById('next-q');
    const mark = document.getElementById('mark-review');
    if (prev) prev.onclick = () => { if (current > 0) { current--; renderQuestion(); renderPalette(); } };
    if (next) next.onclick = () => { if (current < attempt.questions.length - 1) { current++; renderQuestion(); renderPalette(); } };
    if (mark) mark.onclick = () => { review[q.questionId] = !review[q.questionId]; renderQuestion(); renderPalette(); };
  }

  function selectOption(questionId, option) {
    answers[questionId] = option;
    renderQuestion();
    renderPalette();
    // Auto-save (best-effort).
    API.get('saveAnswer', { attemptId: attempt.attemptId, questionId: questionId, selectedOption: option }).catch(() => {});
  }

  function renderPalette() {
    const el = document.getElementById('palette');
    if (!el) return;
    el.innerHTML = attempt.questions.map((q, i) => {
      let cls = '';
      if (answers[q.questionId]) cls = 'answered';
      if (review[q.questionId]) cls = 'review';
      if (i === current) cls += ' current';
      return '<button class="' + cls + '" data-i="' + i + '">' + (i + 1) + '</button>';
    }).join('');
    el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { current = parseInt(b.dataset.i, 10); renderQuestion(); renderPalette(); });
  }

  /* ------------------------- Timer ------------------------- */
  function startTimer() {
    updateTimer();
    timer = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) { clearInterval(timer); autoSubmit(); }
    }, 1000);
  }

  function updateTimer() {
    const el = document.getElementById('timer');
    if (!el) return;
    const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
    el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    el.className = 'timer' + (timeLeft <= 30 ? ' danger' : timeLeft <= 120 ? ' warning' : '');
  }

  /* ------------------------- Submit ------------------------- */
  async function confirmSubmit() {
    const answered = Object.keys(answers).length;
    const ok = await UI.confirmDialog('Submit Test',
      'You have answered ' + answered + ' of ' + attempt.questions.length + ' questions. Submit now?', 'Submit');
    if (ok) doSubmit();
  }

  async function autoSubmit() {
    UI.toast('Time is up! Submitting your test automatically.', 'warning');
    doSubmit();
  }

  async function doSubmit() {
    if (timer) clearInterval(timer);
    disableAntiCheat();
    stopCamera();
    try {
      const res = await API.get('submitTest', { attemptId: attempt.attemptId });
      window.location.href = 'result.html?attemptId=' + encodeURIComponent(res.attemptId);
    } catch (err) {
      UI.toast(err.message || 'Submission failed. Please try again.', 'error');
    }
  }

  /* ------------------------- Camera ------------------------- */
  async function requestCamera() {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const box = document.createElement('div');
      box.className = 'camera-preview';
      box.innerHTML = '<video autoplay muted playsinline></video><div class="cam-label">Camera active (proctoring)</div>';
      document.body.appendChild(box);
      box.querySelector('video').srcObject = cameraStream;
    } catch (err) {
      UI.toast('Camera permission denied. The test will continue without camera proctoring.', 'warning', 6000);
    }
  }
  function stopCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    const box = document.querySelector('.camera-preview');
    if (box) box.remove();
  }

  /* ------------------------- Anti-cheat ------------------------- */
  function enableAntiCheat() {
    const log = (type, details) => { API.get('logSecurityEvent', { eventType: type, details: details }).catch(() => {}); };
    const onVis = () => { if (document.hidden) log('TAB_SWITCH', 'Tab switched during test'); };
    const onBlur = () => log('WINDOW_BLUR', 'Window lost focus during test');
    const onFs = () => { if (!document.fullscreenElement) log('FULLSCREEN_EXIT', 'Exited fullscreen during test'); };
    const onOrient = () => log('ORIENTATION_CHANGE', 'Orientation changed during test');
    const onCopy = (e) => { e.preventDefault(); log('COPY_ATTEMPT', 'Copy during test'); };
    const onCtx = (e) => { e.preventDefault(); log('CONTEXT_MENU', 'Context menu during test'); };
    const onKey = (e) => { if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) { e.preventDefault(); log('DEVTOOLS_HINT', 'Refresh blocked during test'); } };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('orientationchange', onOrient);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('keydown', onKey);
    antiCheatHandlers = [
      ['visibilitychange', onVis, document], ['blur', onBlur, window], ['fullscreenchange', onFs, document],
      ['orientationchange', onOrient, window], ['copy', onCopy, document], ['contextmenu', onCtx, document], ['keydown', onKey, document]
    ];
    // Best-effort: prevent back navigation.
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => { history.pushState(null, '', location.href); log('TAB_SWITCH', 'Back navigation attempted'); });
  }
  function disableAntiCheat() {
    antiCheatHandlers.forEach(h => h[2].removeEventListener(h[0], h[1]));
    antiCheatHandlers = [];
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const testId = params.get('testId');
    if (testId) start(testId);
    else loadList();
  }

  return { init, loadList, start };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Tests.init();
});
window.Tests = Tests;
