/* ============================================================
   SB NOTES PORTAL — admin/admin-auth.js
   Admin login, first-login password change, admin shell init.
   ============================================================ */

const AdminAuth = (function () {
  async function login(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const email = (emailEl ? emailEl.value : '').trim();
    const password = passwordEl ? passwordEl.value : '';
    if (!email && !password) return UI.toast('Please enter your email and password.', 'error');
    if (!email) return UI.toast('Please enter your email address.', 'error');
    if (!password) return UI.toast('Please enter your password.', 'error');

    UI.setLoading(btn, true, 'Signing in…');
    try {
      const res = await API.request('adminLogin', { email: email, password: password }, { admin: true });
      Auth.setAdminSession(res.token, res.admin);
      if (res.admin.mustChangePassword) {
        UI.toast('Please change your default password.', 'warning');
        window.location.href = 'admin-profile.html?forceChange=1';
      } else {
        window.location.href = 'admin-dashboard.html';
      }
    } catch (err) {
      UI.toast(err.message || 'Login failed.', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const current = f.currentPassword.value;
    const next = f.newPassword.value;
    const confirm = f.confirmPassword.value;
    if (next.length < 8) return UI.toast('New password must be at least 8 characters.', 'error');
    if (next !== confirm) return UI.toast('Passwords do not match.', 'error');

    UI.setLoading(btn, true, 'Updating…');
    try {
      await API.admin('changeAdminPassword', { currentPassword: current, newPassword: next });
      UI.toast('Password updated successfully.', 'success');
      const admin = Auth.getAdmin();
      admin.mustChangePassword = false;
      Auth.setAdminSession(API.getAdminToken(), admin);
      f.reset();
    } catch (err) {
      UI.toast(err.message || 'Update failed.', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  }

  function init() {
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) loginForm.addEventListener('submit', login);
    const pwForm = document.getElementById('admin-password-form');
    if (pwForm) pwForm.addEventListener('submit', changePassword);
  }

  return { init, login, changePassword };
})();

document.addEventListener('DOMContentLoaded', () => {
  AdminAuth.init();
  // Admin pages (except login) require an admin session.
  const isLoginPage = /admin-login\.html$/.test(window.location.pathname);
  if (!isLoginPage) {
    if (!Auth.requireAdmin()) return;
    Shell.init();
    const admin = Auth.getAdmin();
    if (admin.mustChangePassword && !/admin-profile\.html$/.test(window.location.pathname)) {
      window.location.href = 'admin-profile.html?forceChange=1';
    }
  }
});
window.AdminAuth = AdminAuth;
