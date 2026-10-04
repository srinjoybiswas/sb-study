/* ============================================================
   SB NOTES PORTAL — admin/tests.js
   Admin test list: create/edit/delete, activate/deactivate.
   ============================================================ */

const AdminTests = (function () {
  let state = { page: 1, pageSize: 20, search: '' };

  async function load() {
    const el = document.getElementById('tests-table');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const res = await API.admin('getAdminTests', state);
      render(res);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load tests', err.message);
    }
  }

  function render(res) {
    const el = document.getElementById('tests-table');
    if (!el) return;
    if (!res.items.length) { el.innerHTML = UI.emptyState('📝', 'No tests', 'Create your first test.'); return; }
    el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>ID</th><th>Title</th><th>Department</th><th>Priority</th><th>Questions</th><th>Attempts</th><th>Status</th><th>Actions</th>' +
      '</tr></thead><tbody>' + res.items.map(t => {
        const prio = t.priority === 'CRITICAL' ? 'danger' : t.priority === 'REQUIRED' ? 'warning' : 'primary';
        return '<tr><td class="text-xs">' + UI.escapeHtml(t.testId) + '</td>' +
          '<td><strong>' + UI.escapeHtml(t.title) + '</strong></td>' +
          '<td>' + UI.escapeHtml(t.departmentName || 'All') + '</td>' +
          '<td><span class="badge badge-' + prio + '">' + UI.escapeHtml(t.priority) + '</span></td>' +
          '<td>' + t.questionCount + '</td><td>' + t.attemptCount + '</td>' +
          '<td><span class="badge badge-' + (t.status === 'ACTIVE' ? 'success' : 'muted') + '">' + t.status + '</span></td>' +
          '<td><div class="flex gap-8">' +
          '<a class="btn btn-primary btn-sm" href="test-builder.html?testId=' + encodeURIComponent(t.testId) + '">Builder</a>' +
          '<button class="btn btn-warning btn-sm" data-toggle="' + UI.escapeHtml(t.testId) + '">' +
          (t.status === 'ACTIVE' ? 'Deactivate' : 'Activate') + '</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + UI.escapeHtml(t.testId) + '">Delete</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
    el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => toggle(b.dataset.toggle));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => remove(b.dataset.del));
  }

  async function toggle(id) {
    // Read-modify-write: fetch the current status, then set the opposite.
    // (Never send a placeholder like 'TOGGLE' — it would be written to the sheet.)
    try {
      const res = await API.admin('getAdminTests', { page: 1, pageSize: 1000 });
      const t = res.items.find(x => x.testId === id);
      if (!t) { UI.toast('Test not found.', 'error'); return; }
      const next = t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await API.admin('updateTest', { testId: id, status: next });
      UI.toast('Test status changed.', 'success');
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function remove(id) {
    const ok = await UI.confirmDialog('Delete Test', 'Delete this test and all its questions? This cannot be undone.', 'Delete');
    if (!ok) return;
    try { await API.admin('deleteTest', { testId: id }); UI.toast('Test deleted.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  function init() {
    const search = document.getElementById('test-search');
    if (search) { let t; search.oninput = () => { clearTimeout(t); t = setTimeout(() => { state.search = search.value; state.page = 1; load(); }, 350); }; }
    load();
  }

  return { load, init, refresh };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  // Bind handlers IMMEDIATELY, before any await, so the search box and
  // refresh button always work even if a network call is slow.
  bindImmediate();
  Shell.init();
  AdminTests.init();
});

function bindImmediate() {
  const refresh = document.getElementById('refresh-tests');
  if (refresh) refresh.onclick = () => AdminTests.load();
}
window.AdminTests = AdminTests;
