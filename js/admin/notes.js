/* ============================================================
   SB NOTES PORTAL — admin/notes.js
   Admin note management: upload/edit/replace/delete/toggle.
   Files are sent as base64 to the Apps Script API.
   ============================================================ */

const AdminNotes = (function () {
  let state = { page: 1, pageSize: 20, search: '', departmentId: 'ALL' };
  let editing = null;

  async function load() {
    const el = document.getElementById('notes-table');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const res = await API.admin('getAdminNotes', state);
      render(res);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load notes', err.message);
    }
  }

  function render(res) {
    const el = document.getElementById('notes-table');
    if (!el) return;
    if (!res.items.length) { el.innerHTML = UI.emptyState('📄', 'No notes', 'Upload your first note.'); return; }
    el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>ID</th><th>Title</th><th>Department</th><th>Semester</th><th>Subject</th><th>Type</th><th>Status</th><th>Actions</th>' +
      '</tr></thead><tbody>' + res.items.map(n =>
        '<tr><td class="text-xs">' + UI.escapeHtml(n.noteId) + '</td>' +
        '<td><strong>' + UI.escapeHtml(n.title) + '</strong></td>' +
        '<td>' + UI.escapeHtml(n.departmentName || '—') + '</td>' +
        '<td>' + UI.escapeHtml(n.semester || '—') + '</td>' +
        '<td>' + UI.escapeHtml(n.subject || '—') + '</td>' +
        '<td><span class="note-type-chip ' + UI.escapeHtml(n.fileType || 'pdf') + '">' + UI.escapeHtml(n.fileType || 'pdf') + '</span></td>' +
        '<td><span class="badge badge-' + (n.status === 'ACTIVE' ? 'success' : 'muted') + '">' + n.status + '</span></td>' +
        '<td><div class="flex gap-8">' +
        '<button class="btn btn-outline btn-sm" data-edit="' + UI.escapeHtml(n.noteId) + '">Edit</button>' +
        '<button class="btn btn-warning btn-sm" data-toggle="' + UI.escapeHtml(n.noteId) + '">' +
        (n.status === 'ACTIVE' ? 'Deactivate' : 'Activate') + '</button>' +
        '<button class="btn btn-danger btn-sm" data-del="' + UI.escapeHtml(n.noteId) + '">Delete</button>' +
        '</div></td></tr>'
      ).join('') + '</tbody></table></div>';

    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(res.items.find(n => n.noteId === b.dataset.edit)));
    el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => toggle(b.dataset.toggle));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => remove(b.dataset.del));
  }

  async function openForm(note) {
    editing = note || null;
    const f = document.getElementById('note-form');
    f.reset();
    document.getElementById('note-modal-title').textContent = note ? 'Edit Note' : 'Upload Note';
    await loadDepartments();
    if (note) {
      document.getElementById('note-title').value = note.title;
      document.getElementById('note-desc').value = note.description || '';
      document.getElementById('note-department').value = note.departmentId;
      document.getElementById('note-semester').value = note.semester || '';
      document.getElementById('note-subject').value = note.subject || '';
      document.getElementById('note-file-hint').textContent = 'Leave empty to keep the current file.';
    } else {
      document.getElementById('note-file-hint').textContent = 'PDF, DOC, PPT or image.';
    }
    UI.openModal('note-modal');
  }

  async function loadDepartments() {
    try {
      const depts = await API.admin('getDepartments', {});
      const sel = document.getElementById('note-department');
      if (sel) sel.innerHTML = '<option value="">Select department</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    } catch (e) {}
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      title: document.getElementById('note-title').value.trim(),
      description: document.getElementById('note-desc').value.trim(),
      departmentId: document.getElementById('note-department').value,
      semester: document.getElementById('note-semester').value,
      subject: document.getElementById('note-subject').value.trim()
    };
    if (!payload.title) return UI.toast('Title is required.', 'error');
    if (!payload.departmentId) return UI.toast('Select a department.', 'error');

    const fileInput = document.getElementById('note-file');
    if (fileInput.files.length) {
      const file = fileInput.files[0];
      if (file.size > 8 * 1024 * 1024) return UI.toast('File too large (max 8MB).', 'error');
      payload.fileData = await readFileAsBase64(file);
      payload.fileName = file.name;
      payload.mimeType = file.type || 'application/pdf';
      payload.fileType = (file.name.split('.').pop() || 'pdf').toLowerCase();
    } else if (!editing) {
      return UI.toast('Please choose a file.', 'error');
    }

    UI.setLoading(btn, true, 'Uploading…');
    try {
      if (editing) await API.admin('updateNote', Object.assign({ noteId: editing.noteId }, payload));
      else await API.admin('uploadNote', payload);
      UI.toast('Note saved.', 'success');
      UI.closeModal('note-modal');
      load();
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
    finally { UI.setLoading(btn, false); }
  }

  async function toggle(id) {
    try { await API.admin('toggleNote', { noteId: id }); UI.toast('Status changed.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function remove(id) {
    const ok = await UI.confirmDialog('Delete Note', 'Delete this note and its file? This cannot be undone.', 'Delete');
    if (!ok) return;
    try { await API.admin('deleteNote', { noteId: id }); UI.toast('Note deleted.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  function init() {
    const addBtn = document.getElementById('add-note-btn');
    if (addBtn) addBtn.onclick = () => openForm(null);
    const f = document.getElementById('note-form');
    if (f) f.addEventListener('submit', save);
    const closeBtn = document.getElementById('note-modal-close');
    if (closeBtn) closeBtn.onclick = () => UI.closeModal('note-modal');
    const search = document.getElementById('note-search');
    if (search) { let t; search.oninput = () => { clearTimeout(t); t = setTimeout(() => { state.search = search.value; state.page = 1; load(); }, 350); }; }
    load();
  }

  return { init, load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminNotes.init();
});
window.AdminNotes = AdminNotes;
