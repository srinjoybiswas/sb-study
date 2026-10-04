/* ============================================================
   SB NOTES PORTAL — admin/students.js
   Student management: search, filter, sort, detail, block/unblock.
   ============================================================ */

const AdminStudents = (function () {
  let state = { page: 1, pageSize: 20, search: '', status: 'ALL', departmentId: 'ALL', sortBy: 'createdAt', sortDir: 'desc' };
  let departments = [];

  async function load() {
    const el = document.getElementById('students-table');
    if (el) el.innerHTML = UI.skeleton(5);
    try {
      const res = await API.admin('getStudents', state);
      render(res);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load students', err.message);
    }
  }

  function render(res) {
    const el = document.getElementById('students-table');
    if (!el) return;
    if (!res.items.length) { el.innerHTML = UI.emptyState('👥', 'No students found', 'Try adjusting your filters.'); return; }
    el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Department</th><th>Status</th><th>Registered</th><th>Actions</th>' +
      '</tr></thead><tbody>' + res.items.map(s =>
        '<tr><td class="text-xs">' + UI.escapeHtml(s.studentId) + '</td>' +
        '<td>' + UI.escapeHtml(s.name) + '</td>' +
        '<td>' + UI.escapeHtml(s.email) + '</td>' +
        '<td>' + UI.escapeHtml(s.mobile) + '</td>' +
        '<td>' + UI.escapeHtml(s.departmentName || '—') + '</td>' +
        '<td><span class="badge badge-' + (s.status === 'ACTIVE' ? 'success' : s.status === 'BLOCKED' ? 'danger' : 'muted') + '">' + s.status + '</span></td>' +
        '<td class="text-xs">' + UI.formatDate(s.createdAt) + '</td>' +
        '<td><div class="flex gap-8">' +
        '<button class="btn btn-outline btn-sm" data-view="' + UI.escapeHtml(s.studentId) + '">View</button>' +
        (s.status === 'BLOCKED'
          ? '<button class="btn btn-success btn-sm" data-unblock="' + UI.escapeHtml(s.studentId) + '">Unblock</button>'
          : '<button class="btn btn-danger btn-sm" data-block="' + UI.escapeHtml(s.studentId) + '">Block</button>') +
        '</div></td></tr>'
      ).join('') + '</tbody></table></div>';

    el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => viewDetail(b.dataset.view));
    el.querySelectorAll('[data-block]').forEach(b => b.onclick = () => block(b.dataset.block));
    el.querySelectorAll('[data-unblock]').forEach(b => b.onclick = () => unblock(b.dataset.unblock));
    renderPagination(res);
  }

  function renderPagination(res) {
    const el = document.getElementById('students-pagination');
    if (!el || res.totalPages <= 1) { if (el) el.innerHTML = ''; return; }
    let html = '<button ' + (res.page <= 1 ? 'disabled' : '') + ' data-page="' + (res.page - 1) + '">‹</button>';
    for (let i = 1; i <= res.totalPages; i++) html += '<button class="' + (i === res.page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    html += '<button ' + (res.page >= res.totalPages ? 'disabled' : '') + ' data-page="' + (res.page + 1) + '">›</button>';
    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { state.page = parseInt(b.dataset.page, 10); load(); });
  }

  async function viewDetail(studentId) {
    UI.openModal('student-detail-modal');
    const body = document.getElementById('student-detail-body');
    body.innerHTML = UI.skeleton(6);
    try {
      const d = await API.admin('getStudentDetail', { studentId: studentId });
      const s = d.student;
      body.innerHTML =
        '<div class="detail-grid mb-16">' +
        '<div class="detail-block"><h4>Personal</h4><p><strong>' + UI.escapeHtml(s.name) + '</strong></p>' +
        '<p class="text-sm text-muted">' + UI.escapeHtml(s.email) + '</p><p class="text-sm text-muted">' + UI.escapeHtml(s.mobile) + '</p></div>' +
        '<div class="detail-block"><h4>Academic</h4><p class="text-sm">' + UI.escapeHtml(s.college) + '</p>' +
        '<p class="text-sm text-muted">' + UI.escapeHtml(s.departmentName || '') + '</p></div>' +
        '<div class="detail-block"><h4>Status</h4><p><span class="badge badge-' + (s.status === 'ACTIVE' ? 'success' : 'danger') + '">' + s.status + '</span></p>' +
        '<p class="text-xs text-muted">Registered ' + UI.formatDate(s.createdAt) + '</p>' +
        '<p class="text-xs text-muted">Last login ' + UI.formatDateTime(s.lastLogin) + '</p></div>' +
        '</div>' +
        '<div class="tabs"><button class="active" data-tab="tests">Tests (' + d.testHistory.length + ')</button>' +
        '<button data-tab="notes">Notes (' + d.notesActivity.length + ')</button>' +
        '<button data-tab="security">Security (' + d.securityEvents.length + ')</button>' +
        '<button data-tab="certs">Certificates (' + d.certificates.length + ')</button></div>' +
        '<div id="detail-tab-content"></div>';
      const tabs = { tests: d.testHistory, notes: d.notesActivity, security: d.securityEvents, certs: d.certificates };
      const renderTab = (key) => {
        const list = tabs[key];
        const c = document.getElementById('detail-tab-content');
        if (!list.length) { c.innerHTML = UI.emptyState('📭', 'No records', ''); return; }
        c.innerHTML = list.map(r =>
          '<div class="activity-item"><span class="act-dot"></span><span>' +
          UI.escapeHtml(r.testTitle || r.noteId || r.eventType || r.certificateId || r.action || '') +
          (r.percentage ? ' · ' + r.percentage + '%' : '') +
          (r.details ? ' · ' + UI.escapeHtml(r.details) : '') +
          '</span><span class="act-time">' + UI.timeAgo(r.submittedAt || r.timestamp || r.issuedAt) + '</span></div>'
        ).join('');
      };
      renderTab('tests');
      body.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
        body.querySelectorAll('[data-tab]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderTab(b.dataset.tab);
      });
    } catch (err) {
      body.innerHTML = UI.emptyState('⚠️', 'Could not load detail', err.message);
    }
  }

  async function block(studentId) {
    const reason = prompt('Reason for blocking (optional):') || '';
    const ok = await UI.confirmDialog('Block Student', 'Block this student? They will not be able to log in.', 'Block');
    if (!ok) return;
    try {
      await API.admin('blockStudent', { studentId: studentId, reason: reason });
      UI.toast('Student blocked.', 'success');
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function unblock(studentId) {
    const ok = await UI.confirmDialog('Unblock Student', 'Reactivate this student account?', 'Unblock');
    if (!ok) return;
    try {
      await API.admin('unblockStudent', { studentId: studentId });
      UI.toast('Student unblocked.', 'success');
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function loadDepartments() {
    try {
      departments = await API.admin('getDepartments', {});
      const sel = document.getElementById('filter-department');
      if (sel) sel.innerHTML = '<option value="ALL">All Departments</option>' + departments.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    } catch (e) {}
  }

  function init() {
    loadDepartments();
    const search = document.getElementById('student-search');
    if (search) { let t; search.oninput = () => { clearTimeout(t); t = setTimeout(() => { state.search = search.value; state.page = 1; load(); }, 350); }; }
    const status = document.getElementById('filter-status');
    if (status) status.onchange = () => { state.status = status.value; state.page = 1; load(); };
    const dept = document.getElementById('filter-department');
    if (dept) dept.onchange = () => { state.departmentId = dept.value; state.page = 1; load(); };
    const closeBtn = document.getElementById('student-detail-close');
    if (closeBtn) closeBtn.onclick = () => UI.closeModal('student-detail-modal');
    load();
  }

  return { init, load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminStudents.init();
});
window.AdminStudents = AdminStudents;
