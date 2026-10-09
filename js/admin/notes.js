/* ============================================================
   SB NOTES PORTAL — admin/notes.js
   Admin "Add Notes" flow: structured, Google Drive-link based.
   Subject / Module / Chapter / Department / Drive link + title.

   The notes themselves stay on Drive — the portal stores only
   the link and the metadata, and auto-notifies the department.
   ============================================================ */

const AdminNotes = (function () {
  let state = { page: 1, pageSize: 20, search: '', departmentId: 'ALL' };
  let editing = null;
  let subjects = [];

  const $ = id => document.getElementById(id);
  /** Read by NAME via querySelector — immune to HTMLFormElement property collisions. */
  function field(name) {
    const f = $('note-form');
    return f ? f.querySelector('[name="' + name + '"]') : null;
  }

  async function load() {
    const el = $('notes-table');
    if (el) el.innerHTML = UI.skeleton(4);
    try {
      const res = await API.admin('getAdminNotes', state);
      render(res);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load notes', err.message);
    }
  }

  function render(res) {
    const el = $('notes-table');
    if (!el) return;
    if (!res.items.length) { el.innerHTML = UI.emptyState('\ud83d\udcc4', 'No notes yet', 'Add your first set of notes from Google Drive.'); return; }
    el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>ID</th><th>Title</th><th>Subject</th><th>Module</th><th>Chapter</th><th>Department</th><th>Status</th><th>Actions</th>' +
      '</tr></thead><tbody>' + res.items.map(n =>
        '<tr><td class="text-xs">' + UI.escapeHtml(n.noteId) + '</td>' +
        '<td><strong>' + UI.escapeHtml(n.title) + '</strong>' +
        (n.driveLink ? '<br><a class="text-xs" href="' + UI.escapeHtml(n.driveLink) + '" target="_blank" rel="noopener">Drive link \u2197</a>' : '') + '</td>' +
        '<td>' + UI.escapeHtml(n.subject || '\u2014') + '</td>' +
        '<td>' + UI.escapeHtml(n.module || '\u2014') + '</td>' +
        '<td>' + UI.escapeHtml(n.chapter || '\u2014') + '</td>' +
        '<td>' + UI.escapeHtml(n.departmentName || '\u2014') + '</td>' +
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

  function fillModuleOptions(selected) {
    const sel = $('note-module');
    if (!sel) return;
    const mods = ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'];
    sel.innerHTML = '<option value="">Select module</option>' + mods.map(m =>
      '<option value="' + m + '"' + (m === selected ? ' selected' : '') + '>' + m + '</option>').join('');
  }

  function fillChapterOptions(selected) {
    const sel = $('note-chapter');
    if (!sel) return;
    let html = '<option value="">Select chapter</option>';
    for (let i = 1; i <= 30; i++) {
      const label = 'Chapter ' + i;
      html += '<option value="' + label + '"' + (label === selected ? ' selected' : '') + '>' + label + '</option>';
    }
    sel.innerHTML = html;
  }

  function fillSubjectOptions(selected) {
    const dl = $('subject-options');
    if (dl) dl.innerHTML = subjects.map(s => '<option value="' + UI.escapeHtml(s) + '"></option>').join('');
    const input = $('note-subject');
    if (input && selected) input.value = selected;
  }

  async function openForm(note) {
    editing = note || null;
    const f = $('note-form');
    if (f) f.reset();
    $('note-modal-title').textContent = note ? 'Edit Notes' : 'Add Notes';
    await loadDepartments();
    fillModuleOptions(note ? note.module : '');
    fillChapterOptions(note ? note.chapter : '');
    fillSubjectOptions(note ? note.subject : '');
    if (note) {
      field('title').value = note.title || '';
      field('description').value = note.description || '';
      if ($('note-department')) $('note-department').value = note.departmentId || '';
      if ($('note-semester')) $('note-semester').value = note.semester || '';
      if ($('note-drive')) $('note-drive').value = note.driveLink || '';
      if ($('note-filetype')) $('note-filetype').value = note.fileType || 'pdf';
    }
    UI.openModal('note-modal');
  }

  async function loadDepartments() {
    try {
      const depts = await API.admin('getDepartments', {});
      const sel = $('note-department');
      if (sel) sel.innerHTML = '<option value="">Select department</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    } catch (e) {}
  }

  /** Distinct subjects already in use, so the admin can reuse one. */
  async function loadSubjects() {
    try {
      const res = await API.admin('getAdminNotes', { page: 1, pageSize: 1000 });
      const seen = {};
      (res.items || []).forEach(n => { if (n.subject) seen[n.subject] = 1; });
      subjects = Object.keys(seen).sort();
    } catch (e) { subjects = []; }
  }

  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      title: field('title').value.trim(),
      description: field('description').value.trim(),
      departmentId: $('note-department').value,
      semester: $('note-semester').value.trim(),
      subject: field('subject').value.trim(),
      module: $('note-module').value,
      chapter: $('note-chapter').value,
      driveLink: $('note-drive').value.trim(),
      fileType: $('note-filetype').value
    };

    // Clear, field-level validation (mirrors the backend).
    if (!payload.subject) return UI.toast('Please enter the subject.', 'error');
    if (!payload.departmentId) return UI.toast('Please choose the department these notes belong to.', 'error');
    if (!payload.module) return UI.toast('Please choose a module.', 'error');
    if (!payload.title) return UI.toast('Note title is required.', 'error');
    if (!payload.driveLink) return UI.toast('A Google Drive link is required — the notes are hosted on Drive.', 'error');
    if (!/^https?:[/][/]/.test(payload.driveLink) || payload.driveLink.indexOf('google.com') < 0) {
      return UI.toast('That does not look like a Google Drive link.', 'error');
    }

    UI.setLoading(btn, true, 'Saving\u2026');
    try {
      if (editing) {
        await API.admin('updateNote', Object.assign({ noteId: editing.noteId }, payload));
        UI.toast('Notes updated.', 'success');
      } else {
        const res = await API.admin('createNote', payload);
        UI.toast('Notes added. The department has been notified.', 'success', 5000);
      }
      UI.closeModal('note-modal');
      loadSubjects();
      load();
    } catch (err) { UI.toast(err.message || 'Could not save the notes.', 'error', 6000); }
    finally { UI.setLoading(btn, false); }
  }

  async function toggle(id) {
    try { await API.admin('toggleNote', { noteId: id }); UI.toast('Status changed.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  async function remove(id) {
    const ok = await UI.confirmDialog('Delete Notes', 'Delete these notes from the portal? The Drive file itself is not affected.', 'Delete');
    if (!ok) return;
    try { await API.admin('deleteNote', { noteId: id }); UI.toast('Notes deleted.', 'success'); load(); }
    catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
  }

  function init() {
    // Bind handlers FIRST, before any await, so a slow network never
    // leaves the Save button without a submit handler.
    const addBtn = $('add-note-btn');
    if (addBtn) addBtn.onclick = () => openForm(null);
    const f = $('note-form');
    if (f && !f.dataset.bound) { f.addEventListener('submit', save); f.dataset.bound = '1'; }
    const closeBtn = $('note-modal-close');
    if (closeBtn) closeBtn.onclick = () => UI.closeModal('note-modal');
    const cancelBtn = $('note-cancel');
    if (cancelBtn) cancelBtn.onclick = (ev) => { if (ev) ev.preventDefault(); UI.closeModal('note-modal'); };
    const search = $('note-search');
    if (search) { let t; search.oninput = () => { clearTimeout(t); t = setTimeout(() => { state.search = search.value; state.page = 1; load(); }, 350); }; }

    fillModuleOptions('');
    fillChapterOptions('');
    loadSubjects();
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
