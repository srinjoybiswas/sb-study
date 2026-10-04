/* ============================================================
   SB NOTES PORTAL — profile.js
   Student profile view + edit (email not editable).
   ============================================================ */

const Profile = (function () {
  let student = null;

  async function load() {
    try {
      student = await API.get('getStudent', {});
      render();
      await loadDepartments();
    } catch (err) {
      UI.toast(err.message || 'Failed to load profile.', 'error');
    }
  }

  function render() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    set('p-name', student.name);
    set('p-email', student.email);
    set('p-mobile', student.mobile);
    set('p-college', student.college);
    set('p-department', student.departmentName);
    set('p-registered', UI.formatDate(student.createdAt));
    set('p-lastlogin', UI.formatDateTime(student.lastLogin));
    set('p-status', student.status);
    set('p-id', student.studentId);

    const avatar = document.getElementById('p-avatar');
    if (avatar) avatar.textContent = UI.initials(student.name);

    const statusBadge = document.getElementById('p-status-badge');
    if (statusBadge) {
      statusBadge.className = 'badge badge-' + (student.status === 'ACTIVE' ? 'success' : 'danger');
      statusBadge.textContent = student.status;
    }

    // Prefill edit form.
    const f = document.getElementById('profile-form');
    if (f) {
      document.getElementById('edit-name').value = student.name || '';
      document.getElementById('edit-mobile').value = student.mobile || '';
      document.getElementById('edit-college').value = student.college || '';
    }
  }

  async function loadDepartments() {
    try {
      const depts = await API.get('getDepartments', {});
      const sel = document.getElementById('edit-department');
      if (!sel) return;
      sel.innerHTML = '<option value="">Select department</option>' + depts.map(d =>
        '<option value="' + UI.escapeHtml(d.departmentId) + '"' + (d.departmentId === student.departmentId ? ' selected' : '') + '>' +
        UI.escapeHtml(d.name) + '</option>').join('');
    } catch (e) {}
  }

  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      name: document.getElementById('edit-name').value.trim(),
      mobile: document.getElementById('edit-mobile').value.trim(),
      college: document.getElementById('edit-college').value.trim(),
      departmentId: document.getElementById('edit-department').value
    };
    if (!payload.name || payload.name.length < 3) return UI.toast('Enter a valid full name.', 'error');
    if (!/^[6-9]\d{9}$/.test(payload.mobile)) return UI.toast('Enter a valid 10-digit mobile number.', 'error');
    if (!payload.college) return UI.toast('Enter your college name.', 'error');
    if (!payload.departmentId) return UI.toast('Select a department.', 'error');

    UI.setLoading(btn, true, 'Saving…');
    try {
      await API.get('updateProfile', payload);
      UI.toast('Profile updated successfully.', 'success');
      await load();
    } catch (err) {
      UI.toast(err.message || 'Update failed.', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  }

  function init() {
    const f = document.getElementById('profile-form');
    if (f) f.addEventListener('submit', save);
  }

  return { load, init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Profile.init();
  Profile.load();
});
window.Profile = Profile;
