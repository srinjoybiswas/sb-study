/* ============================================================
   SB NOTES PORTAL — admin/departments.js
   Department CRUD: add, edit, activate/deactivate, delete.
   ============================================================ */

const AdminDepartments = (function () {
  let editing = null;

  async function load() {
    const el = document.getElementById('departments-table');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const depts = await API.admin('getDepartments', {});
      render(depts);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load departments', err.message);
    }
  }

  function render(depts) {
    const el = document.getElementById('departments-table');
    if (!el) return;
    if (!depts.length) { el.innerHTML = UI.emptyState('🏛', 'No departments', 'Add your first department.'); return; }
    el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>ID</th><th>Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th>' +
      '</tr></thead><tbody>' + depts.map(d =>
        '<tr><td class="text-xs">' + UI.escapeHtml(d.departmentId) + '</td>' +
        '<td><strong>' + UI.escapeHtml(d.name) + '</strong></td>' +
        '<td class="text-sm text-muted">' + UI.escapeHtml(d.description || '—') + '</td>' +
        '<td><span class="badge badge-' + (d.status === 'ACTIVE' ? 'success' : 'muted') + '">' + d.status + '</span></td>' +
        '<td class="text-xs">' + UI.formatDate(d.createdAt) + '</td>' +
        '<td><div class="flex gap-8">' +
        '<button class="btn btn-outline btn-sm" data-edit="' + UI.escapeHtml(d.departmentId) + '">Edit</button>' +
        '<button class="btn btn-warning btn-sm" data-toggle="' + UI.escapeHtml(d.departmentId) + '">' +
        (d.status === 'ACTIVE' ? 'Deactivate' : 'Activate') + '</button>' +
        '<button class="btn btn-danger btn-sm" data-del="' + UI.escapeHtml(d.departmentId) + '">Delete</button>' +
        '</div></td></tr>'
      ).join('') + '</tbody></table></div>';

    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(depts.find(d => d.departmentId === b.dataset.edit)));
    el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => toggle(b.dataset.toggle));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => remove(b.dataset.del));
  }

  function openForm(dept) {
    editing = dept || null;
    const f = document.getElementById('department-form');
    f.reset();
    document.getElementById('department-modal-title').textContent = dept ? 'Edit Department' : 'Add Department';
    if (dept) {
      document.getElementById('dept-name').value = dept.name;
      document.getElementById('dept-desc').value = dept.description || '';
    }
    UI.openModal('department-modal');
  }

  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      name: document.getElementById('dept-name').value.trim(),
      description: document.getElementById('dept-desc').value.trim()
    };
    if (!payload.name) return UI.toast('Department name is required.', 'error');
    UI.setLoading(btn, true, 'Saving…');
    try {
      if (editing) await API.admin('updateDepartment', Object.assign({ departmentId: editing.departmentId }, payload));
      else await API.admin('addDepartment', payload);
      UI.toast('Department saved.', 'success');
      UI.closeModal('department-modal');
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
    finally { UI.setLoading(btn, false); }
  }

  async function toggle(id) {
    try { await API.admin('toggleDepartment', { departmentId: id }); UI.toast('Status changed.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function remove(id) {
    const ok = await UI.confirmDialog('Delete Department', 'Delete this department? This cannot be undone.', 'Delete');
    if (!ok) return;
    try { await API.admin('deleteDepartment', { departmentId: id }); UI.toast('Department deleted.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  function init() {
    const addBtn = document.getElementById('add-department-btn');
    if (addBtn) addBtn.onclick = () => openForm(null);
    const f = document.getElementById('department-form');
    if (f) f.addEventListener('submit', save);
    const closeBtn = document.getElementById('department-modal-close');
    if (closeBtn) closeBtn.onclick = () => UI.closeModal('department-modal');
    load();
  }

  return { init, load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminDepartments.init();
});
window.AdminDepartments = AdminDepartments;
