/* ============================================================
   SB NOTES PORTAL — notes.js
   Notes browser + secure view-only viewer with watermark,
   best-effort protections and copy-violation strikes.
   ============================================================ */

const Notes = (function () {
  let state = { page: 1, scope: '', departmentId: 'ALL', semester: 'ALL', subject: 'ALL', search: '' };
  let viewer = { noteId: null, openedAt: null, streamToken: null, timer: null };

  async function load() {
    const grid = document.getElementById('notes-grid');
    if (grid) grid.innerHTML = UI.skeleton(3).repeat(3).replace(/skeleton-line/g, 'skeleton-card');
    try {
      const res = await API.get('getNotes', state);
      render(res);
      renderPagination(res);
    } catch (err) {
      if (grid) grid.innerHTML = UI.emptyState('⚠️', 'Could not load notes', err.message);
    }
  }

  function render(res) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    if (!res.items.length) { grid.innerHTML = UI.emptyState('📄', 'No notes found', 'Try changing your filters.'); return; }
    grid.innerHTML = res.items.map(n =>
      '<div class="note-card">' +
      '<div class="note-top"><div class="note-ico">📄</div>' +
      '<span class="note-type-chip ' + UI.escapeHtml(n.fileType || 'pdf') + '">' + UI.escapeHtml(n.fileType || 'pdf') + '</span></div>' +
      '<h3>' + UI.escapeHtml(n.title) + '</h3>' +
      '<div class="note-meta"><span>🏛 ' + UI.escapeHtml(n.departmentName || '') + '</span>' +
      '<span>📅 Sem ' + UI.escapeHtml(n.semester || '—') + '</span>' +
      '<span>📘 ' + UI.escapeHtml(n.subject || '—') + '</span></div>' +
      '<p class="note-desc">' + UI.escapeHtml(n.description || '') + '</p>' +
      '<button class="btn btn-primary btn-sm" data-open="' + UI.escapeHtml(n.noteId) + '">View Note</button>' +
      '</div>'
    ).join('');
    grid.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openViewer(b.dataset.open));
  }

  function renderPagination(res) {
    const el = document.getElementById('notes-pagination');
    if (!el || res.totalPages <= 1) { if (el) el.innerHTML = ''; return; }
    let html = '<button ' + (res.page <= 1 ? 'disabled' : '') + ' data-page="' + (res.page - 1) + '">‹</button>';
    for (let i = 1; i <= res.totalPages; i++) {
      html += '<button class="' + (i === res.page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button ' + (res.page >= res.totalPages ? 'disabled' : '') + ' data-page="' + (res.page + 1) + '">›</button>';
    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { state.page = parseInt(b.dataset.page, 10); load(); });
  }

  async function openViewer(noteId) {
    try {
      const info = await API.get('openNote', { noteId: noteId });
      viewer.noteId = noteId;
      viewer.streamToken = info.streamToken;
      viewer.openedAt = Date.now();
      showViewer(info);
      loadFile(info);
      Security.enable({ onViolation: onViolation });
      startDurationTimer();
    } catch (err) {
      if (err.errorCode === 'TEMP_BLOCKED') UI.toast(err.message, 'error', 6000);
      else UI.toast(err.message || 'Could not open note.', 'error');
    }
  }

  function showViewer(info) {
    const overlay = document.getElementById('viewer-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    document.getElementById('viewer-title').textContent = info.title;
    const body = document.getElementById('viewer-body');
    body.innerHTML = '<div class="viewer-fallback">Loading secure viewer…</div>';
    Security.buildWatermark(body, info.watermark);
    // Best-effort fullscreen.
    Security.requestFullscreen(overlay);
  }

  async function loadFile(info) {
    const body = document.getElementById('viewer-body');
    try {
      const file = await API.get('getNoteFile', { streamToken: viewer.streamToken });
      const dataUrl = 'data:' + file.mimeType + ';base64,' + file.base64;
      if (file.fileType === 'img' || file.mimeType.indexOf('image') === 0) {
        body.innerHTML = '<img src="' + dataUrl + '" alt="Note" draggable="false">';
      } else {
        body.innerHTML = '<iframe src="' + dataUrl + '#toolbar=0&navpanes=0" title="Note viewer"></iframe>';
      }
      Security.buildWatermark(body, info.watermark);
    } catch (err) {
      body.innerHTML = '<div class="viewer-fallback">' + UI.escapeHtml(err.message || 'Could not load file.') + '</div>';
    }
  }

  function startDurationTimer() {
    if (viewer.timer) clearInterval(viewer.timer);
    viewer.timer = setInterval(() => {
      if (!viewer.noteId) return;
      API.get('heartbeat', { page: 'notes', noteId: viewer.noteId }).catch(() => {});
    }, CONFIG.HEARTBEAT_INTERVAL);
  }

  function onViolation(v) {
    if (v.blocked) {
      closeViewer();
      UI.toast('You have been temporarily restricted from viewing notes.', 'error', 6000);
    } else {
      UI.toast('Warning: copying is not allowed. Strike ' + v.count + ' of ' + (v.count + v.remaining) + '.', 'warning');
    }
  }

  async function closeViewer() {
    const overlay = document.getElementById('viewer-overlay');
    if (overlay) overlay.classList.remove('open');
    Security.disable();
    Security.exitFullscreen();
    if (viewer.timer) { clearInterval(viewer.timer); viewer.timer = null; }
    if (viewer.noteId) {
      const duration = Math.round((Date.now() - viewer.openedAt) / 1000);
      try { await API.get('closeNote', { noteId: viewer.noteId, duration: duration }); } catch (e) {}
    }
    viewer = { noteId: null, openedAt: null, streamToken: null, timer: null };
  }

  function initFilters() {
    const scope = document.getElementById('filter-scope');
    const dept = document.getElementById('filter-department');
    const sem = document.getElementById('filter-semester');
    const search = document.getElementById('filter-search');

    if (scope) scope.onchange = () => { state.scope = scope.value; state.page = 1; load(); };
    if (dept) dept.onchange = () => { state.departmentId = dept.value; state.page = 1; load(); };
    if (sem) sem.onchange = () => { state.semester = sem.value; state.page = 1; load(); };
    if (search) {
      let t;
      search.oninput = () => { clearTimeout(t); t = setTimeout(() => { state.search = search.value; state.page = 1; load(); }, 350); };
    }
    const closeBtn = document.getElementById('viewer-close');
    if (closeBtn) closeBtn.onclick = closeViewer;

    // Populate department filter.
    API.get('getDepartments', {}).then(depts => {
      if (dept) dept.innerHTML = '<option value="ALL">All Departments</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    }).catch(() => {});
  }

  function init() {
    initFilters();
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    load().then(() => { if (noteId) openViewer(noteId); });
  }

  return { load, init, openViewer, closeViewer };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Notes.init();
});
window.Notes = Notes;
