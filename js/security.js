/* ============================================================
   SB NOTES PORTAL — security.js
   Best-effort browser protections for the note viewer.
   IMPORTANT: These are DETERRENTS ONLY. Screenshots, OS-level
   capture, and determined users cannot be fully prevented.
   ============================================================ */

const Security = (function () {
  let active = false;
  let handlers = [];
  let violationCount = 0;
  let onViolation = null;

  function addHandler(target, type, fn, opts) {
    target.addEventListener(type, fn, opts || false);
    handlers.push({ target, type, fn, opts: opts || false });
  }

  /** Enable best-effort protections while a note is open. */
  function enable(opts) {
    if (active) return;
    active = true;
    opts = opts || {};
    onViolation = opts.onViolation || null;

    // Disable right-click / context menu.
    addHandler(document, 'contextmenu', (e) => { e.preventDefault(); report('CONTEXT_MENU', 'Right-click blocked'); });

    // Disable copy / cut.
    addHandler(document, 'copy', (e) => { e.preventDefault(); report('COPY_ATTEMPT', 'Copy blocked'); });
    addHandler(document, 'cut', (e) => { e.preventDefault(); report('COPY_ATTEMPT', 'Cut blocked'); });

    // Disable text selection.
    addHandler(document, 'selectstart', (e) => { e.preventDefault(); });

    // Disable drag.
    addHandler(document, 'dragstart', (e) => { e.preventDefault(); });

    // Block print (Ctrl+P / Cmd+P).
    addHandler(window, 'beforeprint', () => { report('PRINT_ATTEMPT', 'Print attempted'); });

    // Block common shortcuts.
    addHandler(document, 'keydown', (e) => {
      const k = (e.key || '').toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && ['c', 'x', 's', 'p', 'u'].indexOf(k) >= 0) {
        e.preventDefault();
        report('COPY_ATTEMPT', 'Shortcut blocked: Ctrl+' + k.toUpperCase());
      }
      if (k === 'printscreen') { report('COPY_ATTEMPT', 'PrintScreen pressed'); }
      if (e.key === 'F12') { e.preventDefault(); report('DEVTOOLS_HINT', 'F12 pressed'); }
    });

    // Detect tab switch / window blur.
    addHandler(document, 'visibilitychange', () => {
      if (document.hidden) report('TAB_SWITCH', 'Tab switched away');
    });
    addHandler(window, 'blur', () => { report('WINDOW_BLUR', 'Window lost focus'); });

    // Detect fullscreen exit.
    addHandler(document, 'fullscreenchange', () => {
      if (!document.fullscreenElement) report('FULLSCREEN_EXIT', 'Exited fullscreen');
    });

    // Detect orientation change.
    addHandler(window, 'orientationchange', () => { report('ORIENTATION_CHANGE', 'Orientation changed'); });
  }

  /** Disable all protections and remove listeners. */
  function disable() {
    handlers.forEach(h => h.target.removeEventListener(h.type, h.fn, h.opts));
    handlers = [];
    active = false;
    onViolation = null;
  }

  function report(eventType, details) {
    // Log to backend (best-effort) and notify the page.
    try {
      if (Auth.isLoggedIn()) {
        API.get('reportViolation', { eventType: eventType, details: details }).then(res => {
          if (res && res.blocked) {
            UI.toast('You have been temporarily restricted from viewing notes.', 'error', 6000);
            if (onViolation) onViolation({ blocked: true, count: res.violationCount });
          } else if (res) {
            violationCount = res.violationCount;
            if (onViolation) onViolation({ blocked: false, count: res.violationCount, remaining: res.remaining });
          }
        }).catch(() => {});
      }
    } catch (e) {}
  }

  /** Request fullscreen (must be user-initiated). */
  function requestFullscreen(el) {
    const target = el || document.documentElement;
    if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
    else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
  }
  function exitFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }

  /** Build a repeating watermark overlay for a container. */
  function buildWatermark(container, text) {
    const layer = document.createElement('div');
    layer.className = 'watermark-layer';
    let html = '';
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 4; x++) {
        html += '<span style="top:' + (y * 9 + 3) + '%;left:' + (x * 26 - 6) + '%">' + UI.escapeHtml(text) + '</span>';
      }
    }
    layer.innerHTML = html;
    container.appendChild(layer);
    return layer;
  }

  return { enable, disable, report, requestFullscreen, exitFullscreen, buildWatermark };
})();

window.Security = Security;
