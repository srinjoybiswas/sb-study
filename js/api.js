/* ============================================================
   SB NOTES PORTAL — api.js
   Central API client. Talks to the Apps Script Web App.
   Handles: JSON, timeouts, errors, auth token, toasts, loading.
   ============================================================ */

const API = (function () {
  const TIMEOUT_MS = 30000;

  function getToken() {
    return localStorage.getItem(CONFIG.SESSION_KEY) || '';
  }
  function getAdminToken() {
    return localStorage.getItem(CONFIG.ADMIN_SESSION_KEY) || '';
  }

  /**
   * Core request. Uses POST with text/plain body to avoid CORS
   * preflight issues with Apps Script web apps.
   */
  async function request(action, params, opts) {
    opts = opts || {};
    if (!CONFIG.API_URL || CONFIG.API_URL.indexOf('PASTE_') === 0) {
      throw { errorCode: 'NOT_CONFIGURED', message: 'API URL is not configured. See GOOGLE-SHEET-SETUP.md' };
    }

    const payload = Object.assign({ action: action }, params || {});
    // Attach the correct token automatically unless explicitly overridden.
    if (!payload.token) {
      payload.token = opts.admin ? getAdminToken() : getToken();
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res;
    try {
      res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        // text/plain avoids a CORS preflight against Apps Script.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: 'follow'
      });
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') {
        throw { errorCode: 'TIMEOUT', message: 'The request timed out. Please check your connection and try again.' };
      }
      throw { errorCode: 'NETWORK', message: 'Network error. Please check your internet connection.' };
    }
    clearTimeout(timer);

    if (!res.ok) {
      throw { errorCode: 'HTTP_' + res.status, message: 'Server error (' + res.status + '). Please try again later.' };
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw { errorCode: 'BAD_RESPONSE', message: 'Invalid response from server. Please try again.' };
    }

    if (!data || typeof data.success === 'undefined') {
      throw { errorCode: 'BAD_RESPONSE', message: 'Unexpected server response.' };
    }

    if (!data.success) {
      const err = { errorCode: data.errorCode || 'ERROR', message: data.message || 'Request failed.', requestId: data.requestId || data.execId || '' };
      // Global handling for auth failures.
      if (err.errorCode === 'SESSION_EXPIRED' || err.errorCode === 'UNAUTHORIZED') {
        if (opts.admin) Auth.clearAdminSession();
        else Auth.clearSession();
      }
      // A generic SERVER_ERROR means the backend threw unexpectedly. Replace the
      // raw catch-all text with a clear, actionable message that includes the
      // execution reference so the cause is findable in the Apps Script log.
      if (err.errorCode === 'SERVER_ERROR') {
        err.message = 'The server could not complete this request.' +
          (err.requestId ? ' Reference: ' + String(err.requestId).slice(0, 12) + '.' : '') +
          ' Please try again; if it persists, open the Apps Script Executions log.';
      }
      if (typeof UI !== 'undefined' && UI.toastError) UI.toastError(err);
      throw err;
    }
    return data.data;
  }

  /* Convenience wrappers */
  const get = (action, params) => request(action, params, {});
  const admin = (action, params) => request(action, params, { admin: true });

  return { request, get, admin, getToken, getAdminToken };
})();

window.API = API;
