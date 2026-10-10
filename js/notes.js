/* ============================================================
   SB NOTES PORTAL — notes.js
   Notes browser + secure in-portal viewer.

   Notes are hosted on Google Drive; the viewer embeds the Drive
   preview inside the portal (no raw download link), adds a tiled
   SB-logo + per-student watermark, zoom controls, a live study
   timer that persists time per note per session, and forced
   fullscreen — all working on phone and laptop.
   ============================================================ */

const Notes = (function () {
  let state = { page: 1, scope: '', departmentId: 'ALL', semester: 'ALL', subject: 'ALL', module: 'ALL', search: '' };
  let viewer = { noteId: null, title: '', studySessionId: null, startedAt: 0, baseSeconds: 0, tick: null, beat: null, zoom: 1 };

  const $ = id => document.getElementById(id);

  /* ------------------------- Listing ------------------------- */

  async function load() {
    const grid = $('notes-grid');
    if (grid) grid.innerHTML = UI.skeleton(3).repeat(3).replace(/skeleton-line/g, 'skeleton-card');
    try {
      const res = await API.get('getNotes', state);
      render(res);
      renderPagination(res);
    } catch (err) {
      if (grid) grid.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load notes', err.message);
    }
  }

  function render(res) {
    const grid = $('notes-grid');
    if (!grid) return;
    if (!res.items.length) { grid.innerHTML = UI.emptyState('\ud83d\udcc4', 'No notes found', 'Try changing your filters.'); return; }
    grid.innerHTML = res.items.map(n =>
      '<div class="note-card">' +
      '<div class="note-top"><div class="note-ico">\ud83d\udcc4</div>' +
      '<span class="note-type-chip ' + UI.escapeHtml(n.fileType || 'pdf') + '">' + UI.escapeHtml(n.fileType || 'pdf') + '</span></div>' +
      '<h3>' + UI.escapeHtml(n.title) + '</h3>' +
      '<div class="note-meta"><span>\ud83c\udfdb ' + UI.escapeHtml(n.departmentName || '\u2014') + '</span>' +
      (n.subject ? '<span>\ud83d\udcd8 ' + UI.escapeHtml(n.subject) + '</span>' : '') +
      (n.module ? '<span>\ud83e\udde9 ' + UI.escapeHtml(n.module) + '</span>' : '') +
      (n.chapter ? '<span>\ud83d\udcce ' + UI.escapeHtml(n.chapter) + '</span>' : '') + '</div>' +
      '<p class="note-desc">' + UI.escapeHtml(n.description || '') + '</p>' +
      (n.studiedSeconds ? '<div class="text-xs text-muted mb-8">\u23f1 ' + Math.round(n.studiedSeconds / 60) + ' min studied</div>' : '') +
      '<button class="btn btn-primary btn-sm" data-open="' + UI.escapeHtml(n.noteId) + '">\ud83d\udc41 Open in secure viewer</button>' +
      '</div>'
    ).join('');
    grid.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openViewer(b.dataset.open));
  }

  function renderPagination(res) {
    const el = $('notes-pagination');
    if (!el || res.totalPages <= 1) { if (el) el.innerHTML = ''; return; }
    let html = '<button ' + (res.page <= 1 ? 'disabled' : '') + ' data-page="' + (res.page - 1) + '">\u2039</button>';
    for (let i = 1; i <= res.totalPages; i++) {
      html += '<button class="' + (i === res.page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button ' + (res.page >= res.totalPages ? 'disabled' : '') + ' data-page="' + (res.page + 1) + '">\u203a</button>';
    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { state.page = parseInt(b.dataset.page, 10); load(); });
  }

  /* ------------------------- Secure viewer ------------------------- */

  function openViewer(noteId) {
    const overlay = $('viewer-overlay');
    if (!overlay) return;
    // Open the overlay and go fullscreen FIRST, inside the click gesture,
    // because requestFullscreen must be user-initiated.
    overlay.classList.add('open');
    Security.requestFullscreen(overlay);
    $('viewer-title').textContent = 'Loading secure viewer\u2026';
    $('viewer-body').innerHTML = '<div class="viewer-fallback">Loading secure viewer\u2026</div>';

    API.get('openNote', { noteId: noteId }).then(info => {
      viewer.noteId = info.noteId;
      viewer.title = info.title;
      viewer.studySessionId = info.studySessionId;
      viewer.startedAt = Date.now();
      viewer.baseSeconds = info.studiedSeconds || 0;
      viewer.zoom = 1;
      $('viewer-title').textContent = info.title;
      renderViewer(info);
      Security.enable({
        onViolation: onViolation,
        onScreenshot: () => Security.showWarning($('viewer-body'), 'Screenshot detected',
          'Screenshots of protected notes are not permitted. This attempt has been recorded with your student ID and timestamp.'),
        onBlur: (why) => Security.showWarning($('viewer-body'), 'Focus lost',
          why + '. Stay on this tab while studying \u2014 leaving is recorded.'),
        onFullscreenExit: () => {
          Security.showWarning($('viewer-body'), 'Fullscreen exited',
            'Fullscreen is required while viewing notes. Tap anywhere to return to fullscreen.');
          setTimeout(() => { if (viewer.noteId) Security.requestFullscreen(overlay); }, 700);
        }
      });
      startTimers();
    }).catch(err => {
      overlay.classList.remove('open');
      Security.disable();
      Security.exitFullscreen();
      if (err.errorCode === 'TEMP_BLOCKED') UI.toast(err.message, 'error', 7000);
      else UI.toast(err.message || 'Could not open note.', 'error');
    });
  }

  function renderViewer(info) {
    const body = $('viewer-body');
    const overlay = $('viewer-overlay');
    if (!body) return;
    body.innerHTML = '<div class="viewer-zoom" id="viewer-zoom"><div class="viewer-fallback">Preparing document\u2026</div></div>';
    Security.buildWatermark(body, info.watermark, 'SB NOTES');
    updateZoomLabel();

    const zoomWrap = $('viewer-zoom');
    const src = info.previewUrl;
    const isImage = (info.fileType || '').match(/png|jpe?g|gif|webp|img/);
    if (isImage) {
      zoomWrap.innerHTML = '<img src="' + UI.escapeHtml(src) + '" alt="Note" draggable="false">';
    } else {
      // Drive /preview renders inside the iframe; the raw link is never exposed.
      zoomWrap.innerHTML = '<iframe src="' + UI.escapeHtml(src) + '" title="Secure note viewer" ' +
        'allow="autoplay; fullscreen" referrerpolicy="no-referrer"></iframe>';
      addPopoutBlocker(zoomWrap);
    }
    // Previous / Next only works for image notes (see pager section).
    if (overlay) overlay.classList.toggle('no-pager', !isImage);
    updatePager();
  }

  /* ------------------------- Pop-out button cover ------------------------- */
  // Google Drive's preview draws its own "open in new window" icon inside the
  // cross-origin iframe, so it cannot be deleted. We cover it instead. The
  // cover lives INSIDE the zoom wrapper so it scales with the preview.
  function addPopoutBlocker(zoomWrap) {
    zoomWrap.style.position = 'relative';
    const b = document.createElement('div');
    b.className = 'popout-blocker';
    b.style.cssText =
      'position:absolute;top:0;right:14px;width:80px;height:64px;' +  // tweak size/offset here
      'background:#1c1c1c;z-index:5;pointer-events:auto;';
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'contextmenu'].forEach(ev =>
      b.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); }, true));
    zoomWrap.appendChild(b);
  }

  /* ------------------------- Mobile Previous / Next ------------------------- */

  function pagerStep() {
    const body = $('viewer-body');
    return body ? Math.round(body.clientHeight * 0.9) : 0;
  }

  function pagerGo(dir) {
    const body = $('viewer-body');
    if (!body) return;
    body.scrollBy({ top: dir * pagerStep(), behavior: 'smooth' });
  }

  function updatePager() {
    const body = $('viewer-body');
    const prev = $('page-prev'), next = $('page-next'), label = $('page-indicator');
    if (!body || !prev || !next || !label) return;
    const step = Math.max(1, pagerStep());
    const total = Math.max(1, Math.ceil(body.scrollHeight / step));
    const cur = Math.min(total, Math.floor(body.scrollTop / step) + 1);
    label.textContent = cur + ' / ' + total;
    prev.disabled = body.scrollTop <= 2;
    next.disabled = body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
  }

  /* ------------------------- Zoom ------------------------- */

  function setZoom(next) {
    viewer.zoom = Math.min(3, Math.max(0.5, Math.round(next * 100) / 100));
    const wrap = $('viewer-zoom');
    if (wrap) wrap.style.transform = 'scale(' + viewer.zoom + ')';
    updateZoomLabel();
  }
  function zoomIn() { setZoom(viewer.zoom + 0.15); }
  function zoomOut() { setZoom(viewer.zoom - 0.15); }
  function zoomReset() { setZoom(1); }
  function updateZoomLabel() {
    const el = $('zoom-label');
    if (el) el.textContent = Math.round(viewer.zoom * 100) + '%';
  }

  /* ------------------------- Study timer ------------------------- */

  function fmtClock(sec) {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    const pad = n => (n < 10 ? '0' : '') + n;
    return (h > 0 ? pad(h) + ':' : '') + pad(m) + ':' + pad(ss);
  }

  function startTimers() {
    stopTimers();
    // Live clock (1s) — local, so the student always sees a running timer.
    viewer.tick = setInterval(() => {
      const el = $('study-timer-value');
      if (!el) return;
      const total = viewer.baseSeconds + Math.round((Date.now() - viewer.startedAt) / 1000);
      el.textContent = fmtClock(total);
    }, 1000);
    // Heartbeat (server persistence, every 30s).
    viewer.beat = setInterval(() => {
      if (!viewer.studySessionId) return;
      API.get('studyHeartbeat', { studySessionId: viewer.studySessionId, slideIndex: 0 }).catch(() => {});
    }, 30000);
  }

  function stopTimers() {
    if (viewer.tick) { clearInterval(viewer.tick); viewer.tick = null; }
    if (viewer.beat) { clearInterval(viewer.beat); viewer.beat = null; }
  }

  /* ------------------------- Close ------------------------- */

  function closeViewer() {
    const overlay = $('viewer-overlay');
    if (overlay) overlay.classList.remove('open');
    Security.disable();
    Security.exitFullscreen();
    stopTimers();
    if (viewer.studySessionId) {
      const seconds = viewer.baseSeconds + Math.round((Date.now() - viewer.startedAt) / 1000);
      API.get('closeNote', { studySessionId: viewer.studySessionId, noteId: viewer.noteId, duration: seconds }).catch(() => {});
    }
    viewer = { noteId: null, title: '', studySessionId: null, startedAt: 0, baseSeconds: 0, tick: null, beat: null, zoom: 1 };
    load();
  }

  function onViolation(v) {
    if (v.blocked) {
      stopTimers();
      const overlay = $('viewer-overlay');
      if (overlay) overlay.classList.remove('open');
      Security.disable();
      Security.exitFullscreen();
      UI.toast('Too many copy attempts. Your access is temporarily restricted until ' + v.until + '.', 'error', 8000);
    } else {
      UI.toast('Copying is not allowed. ' + (v.remaining || 0) + ' warning(s) left before a temporary block.', 'warning', 5000);
    }
  }

  /* ------------------------- Filters ------------------------- */

  async function initFilters() {
    const scope = $('filter-scope'), dept = $('filter-department'), sem = $('filter-semester');
    const subj = $('filter-subject'), mod = $('filter-module'), search = $('filter-search');
    const params = new URLSearchParams(window.location.search);
    const initialScope = params.get('scope');

    if (scope) {
      if (initialScope) { scope.value = initialScope; state.scope = initialScope; }
      scope.onchange = () => { state.scope = scope.value; state.page = 1; load(); };
    }
    if (dept) dept.onchange = () => { state.departmentId = dept.value; state.page = 1; load(); };
    if (sem) sem.onchange = () => { state.semester = sem.value; state.page = 1; load(); };
    if (subj) subj.onchange = () => { state.subject = subj.value; state.page = 1; load(); };
    if (mod) mod.onchange = () => { state.module = mod.value; state.page = 1; load(); };
    if (search) {
      let t;
      search.oninput = () => { clearTimeout(t); t = setTimeout(() => { state.search = search.value; state.page = 1; load(); }, 350); };
    }

    // Zoom + close + pager controls (bound before any await).
    const zi = $('zoom-in'), zo = $('zoom-out'), zr = $('zoom-reset'), zc = $('viewer-close');
    if (zi) zi.onclick = zoomIn;
    if (zo) zo.onclick = zoomOut;
    if (zr) zr.onclick = zoomReset;
    if (zc) zc.onclick = closeViewer;

    const pp = $('page-prev'), pn = $('page-next'), vb = $('viewer-body');
    if (pp) pp.onclick = () => pagerGo(-1);
    if (pn) pn.onclick = () => pagerGo(1);
    if (vb) vb.addEventListener('scroll', updatePager, { passive: true });

    API.get('getDepartments', {}).then(depts => {
      if (dept) dept.innerHTML = '<option value="ALL">All Departments</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '">' + UI.escapeHtml(d.name) + '</option>').join('');
    }).catch(() => {});

    try {
      const f = await API.get('getNotesFacets', {});
      if (subj) subj.innerHTML = '<option value="ALL">All Subjects</option>' + (f.subjects || []).map(s =>
        '<option value="' + UI.escapeHtml(s) + '">' + UI.escapeHtml(s) + '</option>').join('');
      if (mod) mod.innerHTML = '<option value="ALL">All Modules</option>' + (f.modules || []).map(m =>
        '<option value="' + UI.escapeHtml(m) + '">' + UI.escapeHtml(m) + '</option>').join('');
    } catch (e) {}
  }

  function init() {
    // Block right-click / long-press menu on the whole page.
    document.addEventListener('contextmenu', e => { e.preventDefault(); return false; }, true);

    initFilters();
    const noteId = new URLSearchParams(window.location.search).get('noteId');
    load().then(() => { if (noteId) openViewer(noteId); });
  }

  return { load, init, openViewer, closeViewer, zoomIn, zoomOut, zoomReset };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Notes.init();
});
window.Notes = Notes;