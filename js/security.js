/* ============================================================
   SB NOTES PORTAL — security.js
   Secure in-portal note viewer for phone + laptop:
     • tiled SB-logo + per-student watermark (survives fullscreen)
     • zoom in / out / reset
     • live study timer (persisted to the backend per note/session)
     • forced fullscreen with re-request + exit warning
     • copy / cut / right-click / selection / drag / print blocked
     • PrintScreen, visibility-change and blur detection → violation log

   IMPORTANT: these are DETERRENTS. Browsers cannot prevent an
   OS-level screenshot or screen recording. We implement the
   strongest practical measures and LOG every attempt.
   ============================================================ */

const Security = (function () {
  let active = false;
  let handlers = [];
  let onViolation = null;
  let warningShownAt = 0;

  function addHandler(target, type, fn, opts) {
    target.addEventListener(type, fn, opts || false);
    handlers.push({ target, type, fn, opts: opts || false });
  }

  /* ------------------------- Violations ------------------------- */

  function report(eventType, details) {
    try {
      if (!Auth.isLoggedIn()) return Promise.resolve(null);
      return API.get('reportViolation', { eventType: eventType, details: details }).then(res => {
        if (res && res.blocked) {
          if (onViolation) onViolation({ blocked: true, count: res.strikes, until: res.until });
        } else if (res && onViolation) {
          onViolation({ blocked: false, count: res.strikes, threshold: res.threshold, remaining: res.remaining });
        }
        return res;
      }).catch(() => null);
    } catch (e) { return Promise.resolve(null); }
  }

  /** Show the screenshot / focus-loss warning overlay inside the viewer. */
  function showWarning(body, title, message) {
    if (!body) return;
    const now = Date.now();
    if (now - warningShownAt < 1500) return;
    warningShownAt = now;
    let ov = body.querySelector('.viewer-warning-overlay');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.className = 'viewer-warning-overlay';
    ov.innerHTML = '<div class="vw-card"><h3>\u26a0\ufe0f ' + UI.escapeHtml(title) + '</h3>' +
      '<p class="text-sm">' + UI.escapeHtml(message) + '</p>' +
      '<button class="btn btn-primary mt-16" data-dismiss>I understand</button></div>';
    body.appendChild(ov);
    const btn = ov.querySelector('[data-dismiss]');
    if (btn) btn.onclick = () => ov.remove();
    setTimeout(() => { if (ov.parentNode) ov.remove(); }, 6000);
  }

  /* ------------------------- Enable / disable ------------------------- */

  /** Enable best-effort protections while a note is open. */
  function enable(opts) {
    if (active) return;
    active = true;
    opts = opts || {};
    onViolation = opts.onViolation || null;

    addHandler(document, 'contextmenu', (e) => { e.preventDefault(); report('CONTEXT_MENU', 'Right-click blocked'); });
    addHandler(document, 'copy', (e) => { e.preventDefault(); report('COPY_ATTEMPT', 'Copy blocked'); });
    addHandler(document, 'cut', (e) => { e.preventDefault(); report('COPY_ATTEMPT', 'Cut blocked'); });
    addHandler(document, 'selectstart', (e) => { e.preventDefault(); });
    addHandler(document, 'dragstart', (e) => { e.preventDefault(); });
    addHandler(window, 'beforeprint', () => { report('PRINT_ATTEMPT', 'Print attempted'); });

    addHandler(document, 'keydown', (e) => {
      const k = (e.key || '').toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && ['c', 'x', 's', 'p', 'u', 'a'].indexOf(k) >= 0) {
        e.preventDefault();
        report('COPY_ATTEMPT', 'Shortcut blocked: Ctrl+' + k.toUpperCase());
        return;
      }
      if (k === 'printscreen') {
        // Browsers cannot block the OS screenshot; we log it and warn.
        report('SCREENSHOT_ATTEMPT', 'PrintScreen pressed');
        if (opts.onScreenshot) opts.onScreenshot();
      }
      if (e.key === 'F12') { e.preventDefault(); report('DEVTOOLS_HINT', 'F12 pressed'); }
    });

    addHandler(document, 'visibilitychange', () => {
      if (document.hidden) {
        report('TAB_SWITCH', 'Tab switched away');
        if (opts.onBlur) opts.onBlur('Tab switched away from the note');
      }
    });
    addHandler(window, 'blur', () => {
      report('WINDOW_BLUR', 'Window lost focus');
      if (opts.onBlur) opts.onBlur('Window lost focus');
    });

    addHandler(document, 'fullscreenchange', () => {
      if (!document.fullscreenElement) {
        report('FULLSCREEN_EXIT', 'Exited fullscreen');
        if (opts.onFullscreenExit) opts.onFullscreenExit();
      }
    });
    addHandler(window, 'orientationchange', () => { report('ORIENTATION_CHANGE', 'Orientation changed'); });
  }

  function disable() {
    handlers.forEach(h => h.target.removeEventListener(h.type, h.fn, h.opts));
    handlers = [];
    active = false;
    onViolation = null;
  }

  /* ------------------------- Fullscreen ------------------------- */

  /** Request fullscreen. Must be called from a user gesture. */
  function requestFullscreen(el) {
    const target = el || document.documentElement;
    try {
      if (target.requestFullscreen) { const p = target.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
    } catch (e) {}
  }

  function exitFullscreen() {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) { const p = document.exitFullscreen(); if (p && p.catch) p.catch(() => {}); }
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch (e) {}
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  /* ------------------------- Watermark ------------------------- */

  /**
   * Tiled watermark: the SB logo repeated diagonally on every part of the
   * document, plus the per-student trace text (name / ID / timestamp).
   * The layer sits OUTSIDE the zoom wrapper so it stays fixed while the
   * document zooms, and it is never removed in fullscreen.
   */
  function buildWatermark(container, text, logoText) {
    if (!container) return null;
    let layer = container.querySelector(':scope > .watermark-layer');
    if (layer) layer.remove();
    layer = document.createElement('div');
    layer.className = 'watermark-layer';
    let html = '';
    const cols = 4, rows = 14;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const top = (y * (100 / rows)) + 1.5;
        const left = (x * (100 / cols)) - 8;
        html += '<span class="wm-logo" style="top:' + top + '%;left:' + left + '%">' +
          UI.escapeHtml(logoText || 'SB NOTES') + '</span>';
        html += '<span class="wm-text" style="top:' + (top + 4.2) + '%;left:' + left + '%">' +
          UI.escapeHtml(text || '') + '</span>';
      }
    }
    layer.innerHTML = html;
    container.appendChild(layer);
    return layer;
  }

  return {
    enable, disable, report, showWarning,
    requestFullscreen, exitFullscreen, isFullscreen, buildWatermark
  };
})();

window.Security = Security;
