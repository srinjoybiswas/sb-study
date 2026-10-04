/* ============================================================
   SB NOTES PORTAL — admin/test-builder.js
   Create/edit a test + question builder (add/edit/delete/
   duplicate/reorder). Auto total time = questions × timePerQuestion.
   ============================================================ */

const TestBuilder = (function () {
  let testId = null;
  let questions = [];
  let editingQuestion = null;

  async function init() {
    const params = new URLSearchParams(window.location.search);
    testId = params.get('testId');
    // Bind handlers FIRST. Do not await anything before bindEvents(),
    // otherwise a slow network leaves the Save button with no submit
    // handler and clicking it does nothing (or submits the raw form).
    bindEvents();
    updateTotalTime();
    await loadDepartments();
    if (testId) { await loadTest(); await loadQuestions(); updateTotalTime(); }
  }

  async function loadDepartments() {
    try {
      const depts = await API.admin('getDepartments', {});
      const sel = document.getElementById('test-department');
      if (sel) sel.innerHTML = '<option value="">All Departments</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    } catch (e) {}
  }

  async function loadTest() {
    try {
      const res = await API.admin('getAdminTests', { page: 1, pageSize: 1000 });
      const t = res.items.find(x => x.testId === testId);
      if (!t) return;
      $( 'test-title').value = t.title || '';
      $( 'test-desc').value = t.description || '';
      $( 'test-department').value = t.departmentId || '';
      $( 'test-semester').value = t.semester || '';
      $( 'test-priority').value = t.priority || 'OPTIONAL';
      $( 'test-start').value = t.startDate ? String(t.startDate).substring(0, 10) : '';
      $( 'test-end').value = t.endDate ? String(t.endDate).substring(0, 10) : '';
      $( 'test-marks').value = t.marksPerQuestion || 1;
      $( 'test-time').value = t.timePerQuestion || 60;
      $( 'test-pass').value = t.passingPercent || 60;
      var f = document.getElementById('test-form');
      f.randomizeQuestions.checked = t.randomizeQuestions === 'ON';
      f.randomizeOptions.checked = t.randomizeOptions === 'ON';
      f.cameraRequired.checked = t.cameraRequired === 'ON';
      f.antiCheating.checked = t.antiCheating === 'ON';
      $( 'test-status').value = t.status || 'ACTIVE';
      document.getElementById('builder-title').textContent = 'Edit Test: ' + t.title;
      updateTotalTime();
    } catch (e) {}
  }

  /** Read a field by id (never by form named-access, which collides with
   *  built-in form properties and can silently return the wrong value). */
  function $(id) { return document.getElementById(id); }

  async function saveTest(e) {
    if (e && e.preventDefault) e.preventDefault();
    const f = document.getElementById('test-form');
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      title: $( 'test-title').value.trim(),
      description: $( 'test-desc').value.trim(),
      departmentId: $( 'test-department').value,
      semester: $( 'test-semester').value,
      priority: $( 'test-priority').value,
      startDate: $( 'test-start').value,
      endDate: $( 'test-end').value,
      marksPerQuestion: $( 'test-marks').value,
      timePerQuestion: $( 'test-time').value,
      passingPercent: $( 'test-pass').value,
      randomizeQuestions: f.randomizeQuestions.checked,
      randomizeOptions: f.randomizeOptions.checked,
      cameraRequired: f.cameraRequired.checked,
      antiCheating: f.antiCheating.checked,
      status: $( 'test-status').value
    };
    if (!payload.title) return UI.toast('Test title is required.', 'error');
    if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
      return UI.toast('End date must be on or after the start date.', 'error');
    }
    UI.setLoading(btn, true, 'Saving…');
    try {
      if (testId) {
        await API.admin('updateTest', Object.assign({ testId: testId }, payload));
        UI.toast('Test updated.', 'success');
      } else {
        const res = await API.admin('createTest', payload);
        testId = res.testId;
        window.history.replaceState(null, '', 'test-builder.html?testId=' + encodeURIComponent(testId));
        UI.toast('Test created. Now add questions.', 'success');
        document.getElementById('builder-title').textContent = 'Edit Test';
      }
      document.getElementById('questions-section').classList.remove('hidden');
    } catch (err) { UI.toastError(err, 'Could not save test.'); }
    finally { UI.setLoading(btn, false); }
  }

  async function loadQuestions() {
    if (!testId) return;
    try {
      questions = await API.admin('getQuestions', { testId: testId });
      renderQuestions();
    } catch (e) {}
  }

  function renderQuestions() {
    const el = document.getElementById('questions-list');
    if (!el) return;
    if (!questions.length) { el.innerHTML = UI.emptyState('❓', 'No questions yet', 'Add your first question below.'); return; }
    el.innerHTML = questions.map((q, i) =>
      '<div class="question-item" data-qid="' + UI.escapeHtml(q.questionId) + '">' +
      '<div class="q-head"><span class="drag-handle">⠿</span><span class="q-num">' + (i + 1) + '</span>' +
      '<strong>' + UI.escapeHtml(q.questionText) + '</strong>' +
      '<div class="q-actions">' +
      '<button class="btn btn-outline btn-sm" data-up="' + i + '">↑</button>' +
      '<button class="btn btn-outline btn-sm" data-down="' + i + '">↓</button>' +
      '<button class="btn btn-outline btn-sm" data-edit="' + UI.escapeHtml(q.questionId) + '">Edit</button>' +
      '<button class="btn btn-outline btn-sm" data-dup="' + UI.escapeHtml(q.questionId) + '">Duplicate</button>' +
      '<button class="btn btn-danger btn-sm" data-del="' + UI.escapeHtml(q.questionId) + '">Delete</button>' +
      '</div></div>' +
      ['A', 'B', 'C', 'D'].map(k => {
        const val = q['option' + k];
        if (!val) return '';
        const correct = q.correctAnswer === k;
        return '<div class="option-row' + (correct ? ' correct' : '') + '"><span class="opt-key">' + k + '</span>' +
          '<span>' + UI.escapeHtml(val) + '</span>' + (correct ? ' <span class="badge badge-success">Correct</span>' : '') + '</div>';
      }).join('') +
      '<div class="text-xs text-muted mt-8">Marks: ' + q.marks + '</div>' +
      '</div>'
    ).join('');

    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openQuestionForm(questions.find(q => q.questionId === b.dataset.edit)));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteQuestion(b.dataset.del));
    el.querySelectorAll('[data-dup]').forEach(b => b.onclick = () => duplicateQuestion(b.dataset.dup));
    el.querySelectorAll('[data-up]').forEach(b => b.onclick = () => move(parseInt(b.dataset.up, 10), -1));
    el.querySelectorAll('[data-down]').forEach(b => b.onclick = () => move(parseInt(b.dataset.down, 10), 1));
  }

  function openQuestionForm(q) {
    editingQuestion = q || null;
    const f = document.getElementById('question-form');
    f.reset();
    document.getElementById('question-modal-title').textContent = q ? 'Edit Question' : 'Add Question';
    if (q) {
      f.questionText.value = q.questionText;
      f.optionA.value = q.optionA; f.optionB.value = q.optionB;
      f.optionC.value = q.optionC; f.optionD.value = q.optionD;
      f.correctAnswer.value = q.correctAnswer;
      f.marks.value = q.marks;
    } else {
      const t = document.getElementById('test-form');
      f.marks.value = t.marksPerQuestion.value || 1;
    }
    UI.openModal('question-modal');
  }

  async function saveQuestion(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      testId: testId,
      questionText: f.questionText.value.trim(),
      optionA: f.optionA.value.trim(), optionB: f.optionB.value.trim(),
      optionC: f.optionC.value.trim(), optionD: f.optionD.value.trim(),
      correctAnswer: f.correctAnswer.value,
      marks: f.marks.value
    };
    if (!payload.questionText) return UI.toast('Question text is required.', 'error');
    if (!payload.correctAnswer) return UI.toast('Select the correct answer.', 'error');
    if (editingQuestion) payload.questionId = editingQuestion.questionId;
    UI.setLoading(btn, true, 'Saving…');
    try {
      await API.admin('saveQuestion', payload);
      UI.toast('Question saved.', 'success');
      UI.closeModal('question-modal');
      await loadQuestions();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
    finally { UI.setLoading(btn, false); }
  }

  async function deleteQuestion(id) {
    const ok = await UI.confirmDialog('Delete Question', 'Delete this question?', 'Delete');
    if (!ok) return;
    try { await API.admin('deleteQuestion', { questionId: id }); UI.toast('Question deleted.', 'success'); loadQuestions(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function duplicateQuestion(id) {
    try { await API.admin('duplicateQuestion', { questionId: id }); UI.toast('Question duplicated.', 'success'); loadQuestions(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const arr = questions.slice();
    const tmp = arr[index]; arr[index] = arr[target]; arr[target] = tmp;
    questions = arr;
    renderQuestions();
    try { await API.admin('reorderQuestions', { order: questions.map(q => q.questionId) }); } catch (e) {}
  }

  function updateTotalTime() {
    const el = document.getElementById('total-time-preview');
    const timeInput = document.getElementById('test-time');
    if (!el || !timeInput) return;
    const calc = () => {
      const n = questions.length || 0;
      const per = parseInt(timeInput.value, 10) || 60;
      const total = n * per;
      el.textContent = n + ' questions × ' + per + 's = ' + Math.round(total / 60) + ' min total';
    };
    timeInput.oninput = calc;
    calc();
  }

  function bindEvents() {
    const f = document.getElementById('test-form');
    if (f && !f.dataset.bound) { f.addEventListener('submit', saveTest); f.dataset.bound = '1'; }
    const addQ = document.getElementById('add-question-btn');
    if (addQ) addQ.onclick = () => openQuestionForm(null);
    const qf = document.getElementById('question-form');
    if (qf && !qf.dataset.bound) { qf.addEventListener('submit', saveQuestion); qf.dataset.bound = '1'; }
    const qClose = document.getElementById('question-modal-close');
    if (qClose) qClose.onclick = () => UI.closeModal('question-modal');
    const qCancel = document.getElementById('question-cancel');
    if (qCancel) qCancel.onclick = (e) => { if (e) e.preventDefault(); UI.closeModal('question-modal'); };
    if (testId) document.getElementById('questions-section').classList.remove('hidden');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  TestBuilder.init();
});
window.TestBuilder = TestBuilder;
