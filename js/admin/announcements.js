/* ============================================================
   SB NOTES PORTAL — admin/announcements.js
   Announcement CRUD with priority + department targeting.
   ============================================================ */

const AdminAnnouncements = (function () {
  let editing = null;

  async function load() {
    const el = document.getElementById('announcements-table');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const res = await API.admin('getAdminAnnouncements', { page: 1, pageSize: 50 });
      render(res.items);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load announcements', err.message);
    }
  }

  function render(items) {
    const el = document.getElementById('announcements-table');
    if (!el) return;
    if (!items.length) { el.innerHTML = UI.emptyState('📢', 'No announcements', 'Create your first announcement.'); return; }
    el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>Title</th><th>Priority</th><th>Department</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th>' +
      '</tr></thead><tbody>' + items.map(a => {
        const prio = a.priority === 'EMERGENCY' ? 'danger' : a.priority === 'IMPORTANT' ? 'warning' : 'primary';
        return '<tr><td><strong>' + UI.escapeHtml(a.title) + '</strong><br><span class="text-xs text-muted">' + UI.escapeHtml((a.message || '').substring(0, 60)) + '</span></td>' +
          '<td><span class="badge badge-' + prio + '">' + UI.escapeHtml(a.priority) + '</span></td>' +
          '<td>' + UI.escapeHtml(a.departmentName || 'All') + '</td>' +
          '<td class="text-xs">' + UI.formatDate(a.startDate) + '</td>' +
          '<td class="text-xs">' + UI.formatDate(a.endDate) + '</td>' +
          '<td><span class="badge badge-' + (a.status === 'ACTIVE' ? 'success' : 'muted') + '">' + a.status + '</span></td>' +
          '<td><div class="flex gap-8">' +
          '<button class="btn btn-outline btn-sm" data-edit="' + UI.escapeHtml(a.announcementId) + '">Edit</button>' +
          '<button class="btn btn-danger btn-sm" data-del="' + UI.escapeHtml(a.announcementId) + '">Delete</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>';

    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(items.find(a => a.announcementId === b.dataset.edit)));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => remove(b.dataset.del));
  }

  async function openForm(a) {
    editing = a || null;
    const f = document.getElementById('announcement-form');
    f.reset();
    document.getElementById('announcement-modal-title').textContent = a ? 'Edit Announcement' : 'New Announcement';
    await loadDepartments();
    if (a) {
      document.getElementById('ann-title').value = a.title;
      document.getElementById('ann-message').value = a.message;
      document.getElementById('ann-priority').value = a.priority;
      document.getElementById('ann-department').value = a.departmentId || '';
      document.getElementById('ann-start').value = a.startDate ? String(a.startDate).substring(0, 10) : '';
      document.getElementById('ann-end').value = a.endDate ? String(a.endDate).substring(0, 10) : '';
      document.getElementById('ann-status').value = a.status || 'ACTIVE';
    }
    UI.openModal('announcement-modal');
  }

  async function loadDepartments() {
    try {
      const depts = await API.admin('getDepartments', {});
      const sel = document.getElementById('announcement-department');
      if (sel) sel.innerHTML = '<option value="">All Departments</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    } catch (e) {}
  }

  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      title: document.getElementById('ann-title').value.trim(),
      message: document.getElementById('ann-message').value.trim(),
      priority: document.getElementById('ann-priority').value,
      departmentId: document.getElementById('ann-department').value,
      startDate: document.getElementById('ann-start').value,
      endDate: document.getElementById('ann-end').value,
      status: document.getElementById('ann-status').value
    };
    if (!payload.title || !payload.message) return UI.toast('Title and message are required.', 'error');
    UI.setLoading(btn, true, 'Saving…');
    try {
      if (editing) await API.admin('updateAnnouncement', Object.assign({ announcementId: editing.announcementId }, payload));
      else await API.admin('createAnnouncement', payload);
      UI.toast('Announcement saved.', 'success');
      UI.closeModal('announcement-modal');
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
    finally { UI.setLoading(btn, false); }
  }

  async function remove(id) {
    const ok = await UI.confirmDialog('Delete Announcement', 'Delete this announcement?', 'Delete');
    if (!ok) return;
    try { await API.admin('deleteAnnouncement', { announcementId: id }); UI.toast('Deleted.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  function init() {
    const addBtn = document.getElementById('add-announcement-btn');
    if (addBtn) addBtn.onclick = () => openForm(null);
    const f = document.getElementById('announcement-form');
    if (f) f.addEventListener('submit', save);
    const closeBtn = document.getElementById('announcement-modal-close');
    if (closeBtn) closeBtn.onclick = () => UI.closeModal('announcement-modal');
    load();
  }

  return { init, load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminAnnouncements.init();
});
window.AdminAnnouncements = AdminAnnouncements;
