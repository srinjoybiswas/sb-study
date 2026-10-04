/* ============================================================
   SB NOTES PORTAL — auth.js
   Session helpers, route guards, theme, toasts, modals, UI utils.
   ============================================================ */

/* ------------------------- UI helpers ------------------------- */
console.log("SB Notes NEW auth.js loaded");
const UI = (function () {
  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
    return c;
  }

  function toast(message, type, timeout) {
    const c = ensureToastContainer();
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    el.innerHTML = '<span>' + (icons[type] || 'ℹ') + '</span><span>' + escapeHtml(message) + '</span>' +
      '<button class="toast-close" aria-label="Close">×</button>';
    el.querySelector('.toast-close').onclick = () => el.remove();
    c.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, timeout || 4000);
  }

  /**
   * Show an error toast. For unexpected server-side failures it appends the
   * Apps Script execution ID, which is the key that lets an admin find the
   * exact failing run in Apps Script > Executions. Never shows a raw stack.
   */
  function toastError(err, prefix) {
    var message = (err && err.message) ? err.message : 'Something went wrong. Please try again.';
    if (err && (err.errorCode === 'SERVER_ERROR' || err.errorCode === 'BAD_RESPONSE')) {
      var rid = err.requestId || err.execId;
      if (rid) message += ' (Ref: ' + String(rid).slice(0, 12) + ')';
    }
    toast((prefix ? prefix + ' ' : '') + message, 'error', 7000);
  }

  function escapeHtml(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function confirmDialog(title, message, confirmLabel) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay open';
      overlay.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal-header"><h3>' + escapeHtml(title) + '</h3></div>' +
        '<div class="modal-body"><p>' + escapeHtml(message) + '</p></div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-outline" data-act="cancel">Cancel</button>' +
        '<button class="btn btn-danger" data-act="ok">' + escapeHtml(confirmLabel || 'Confirm') + '</button>' +
        '</div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('[data-act="cancel"]').onclick = () => { overlay.remove(); resolve(false); };
      overlay.querySelector('[data-act="ok"]').onclick = () => { overlay.remove(); resolve(true); };
      overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    });
  }

  function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
  function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }

  function setLoading(btn, loading, label) {
    if (!btn) return;
    if (loading) {
      btn.dataset.orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> ' + (label || 'Please wait…');
    } else {
      btn.disabled = false;
      if (btn.dataset.orig) btn.innerHTML = btn.dataset.orig;
    }
  }

  function skeleton(lines) {
    let html = '';
    for (let i = 0; i < (lines || 3); i++) html += '<div class="skeleton skeleton-line"></div>';
    return html;
  }

  function emptyState(icon, title, message) {
    return '<div class="empty-state"><div class="empty-icon">' + (icon || '📭') + '</div>' +
      '<h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(message || '') + '</p></div>';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function timeAgo(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }
  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  return { toast, toastError, escapeHtml, confirmDialog, openModal, closeModal, setLoading, skeleton, emptyState, formatDate, formatDateTime, timeAgo, initials };
})();

/* ------------------------- Theme ------------------------- */
const Theme = (function () {
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.THEME_KEY, theme);
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  }
  function init() {
    const saved = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
    apply(saved);
  }
  function toggle() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    apply(cur === 'dark' ? 'light' : 'dark');
  }
  return { init, toggle, apply };
})();

/* ------------------------- Auth ------------------------- */
const Auth = (function () {
  function setSession(token, user) {
    localStorage.setItem(CONFIG.SESSION_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user || {}));
  }
  function clearSession() {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{}'); } catch (e) { return {}; }
  }
  function isLoggedIn() { return !!localStorage.getItem(CONFIG.SESSION_KEY); }

  function setAdminSession(token, admin) {
    localStorage.setItem(CONFIG.ADMIN_SESSION_KEY, token);
    localStorage.setItem(CONFIG.ADMIN_KEY, JSON.stringify(admin || {}));
  }
  function clearAdminSession() {
    localStorage.removeItem(CONFIG.ADMIN_SESSION_KEY);
    localStorage.removeItem(CONFIG.ADMIN_KEY);
  }
  function getAdmin() {
    try { return JSON.parse(localStorage.getItem(CONFIG.ADMIN_KEY) || '{}'); } catch (e) { return {}; }
  }
  function isAdminLoggedIn() { return !!localStorage.getItem(CONFIG.ADMIN_SESSION_KEY); }

  /** Guard a student page. Redirects to login if not authenticated. */
  function requireStudent() {
    if (!isLoggedIn()) { window.location.href = 'login.html'; return false; }
    return true;
  }
  /** Guard an admin page. */
  function requireAdmin() {
    if (!isAdminLoggedIn()) { window.location.href = 'admin-login.html'; return false; }
    return true;
  }

  async function logout() {
    try { await API.get('logout', { token: API.getToken() }); } catch (e) {}
    clearSession();
    window.location.href = 'login.html';
  }
  async function adminLogout() {
    try { await API.request('logout', { token: API.getAdminToken() }, { admin: true }); } catch (e) {}
    clearAdminSession();
    window.location.href = 'admin-login.html';
  }

  return {
    setSession, clearSession, getUser, isLoggedIn,
    setAdminSession, clearAdminSession, getAdmin, isAdminLoggedIn,
    requireStudent, requireAdmin, logout, adminLogout
  };
})();

/* ------------------------- App shell ------------------------- */
const Shell = (function () {
  function initSidebar() {
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (menuBtn && sidebar) {
      menuBtn.onclick = () => { sidebar.classList.toggle('open'); if (overlay) overlay.classList.toggle('open'); };
    }
    if (overlay) overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); };
  }

  function markActive() {
    const path = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.side-nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href.split('?')[0] === path) a.classList.add('active');
    });
  }

  function initThemeButtons() {
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.onclick = () => Theme.toggle();
    });
  }

  function initLogoutButtons() {
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        const ok = await UI.confirmDialog('Log out', 'Are you sure you want to log out?', 'Log out');
        if (ok) Auth.logout();
      };
    });
    document.querySelectorAll('[data-admin-logout]').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        const ok = await UI.confirmDialog('Log out', 'Are you sure you want to log out of the admin panel?', 'Log out');
        if (ok) Auth.adminLogout();
      };
    });
  }

  function fillUser() {
    const user = Auth.getUser();
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name || 'Student');
    document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = UI.initials(user.name));
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email || '');
  }
  function fillAdmin() {
    const admin = Auth.getAdmin();
    document.querySelectorAll('[data-admin-name]').forEach(el => el.textContent = admin.name || 'Admin');
    document.querySelectorAll('[data-admin-avatar]').forEach(el => el.textContent = UI.initials(admin.name));
  }

  function init() {
    Theme.init();
    initSidebar();
    markActive();
    initThemeButtons();
    initLogoutButtons();
    fillUser();
    fillAdmin();
  }
  return { init, initSidebar, markActive };
})();

/* ------------------------- Heartbeat ------------------------- */
const Heartbeat = (function () {
  let timer = null;
  function start(page) {
    if (timer) return;
    const beat = () => {
      if (!Auth.isLoggedIn()) return;
      API.get('heartbeat', { page: page || (window.location.pathname.split('/').pop() || '') })
        .catch(() => {});
    };
    beat();
    timer = setInterval(beat, CONFIG.HEARTBEAT_INTERVAL);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  return { start, stop };
})();

window.UI = UI; window.Theme = Theme; window.Auth = Auth; window.Shell = Shell; window.Heartbeat = Heartbeat;
