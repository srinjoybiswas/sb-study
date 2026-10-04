/* ============================================================
   SB NOTES PORTAL — admin/settings.js
   Admin settings, maintenance toggles, backup.
   ============================================================ */

const AdminSettings = (function () {
  let settings = {};

  async function load() {
    try {
      settings = await API.admin('getAdminSettings', {});
      fill();
    } catch (err) {
      UI.toast(err.message || 'Could not load settings.', 'error');
    }
  }

  function fill() {
    const f = document.getElementById('settings-form');
    if (!f) return;
    f.websiteName.value = settings.websiteName || '';
    f.websiteStatus.value = settings.websiteStatus || 'ON';
    f.maintenanceMode.value = settings.maintenanceMode || 'OFF';
    f.modificationMode.value = settings.modificationMode || 'OFF';
    f.registrationEnabled.value = settings.registrationEnabled || 'ON';
    f.defaultPassingPercent.value = settings.defaultPassingPercent || 60;
    f.defaultTimePerQuestion.value = settings.defaultTimePerQuestion || 60;
    f.maxLoginAttempts.value = settings.maxLoginAttempts || 5;
    f.sessionDurationMinutes.value = settings.sessionDurationMinutes || 120;
    f.copyViolationThreshold.value = settings.copyViolationThreshold || 3;
    f.tempBlockDurationMinutes.value = settings.tempBlockDurationMinutes || 30;
    f.notificationEnabled.value = settings.notificationEnabled || 'ON';
  }

  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      websiteName: f.websiteName.value.trim(),
      websiteStatus: f.websiteStatus.value,
      maintenanceMode: f.maintenanceMode.value,
      modificationMode: f.modificationMode.value,
      registrationEnabled: f.registrationEnabled.value,
      defaultPassingPercent: f.defaultPassingPercent.value,
      defaultTimePerQuestion: f.defaultTimePerQuestion.value,
      maxLoginAttempts: f.maxLoginAttempts.value,
      sessionDurationMinutes: f.sessionDurationMinutes.value,
      copyViolationThreshold: f.copyViolationThreshold.value,
      tempBlockDurationMinutes: f.tempBlockDurationMinutes.value,
      notificationEnabled: f.notificationEnabled.value
    };
    UI.setLoading(btn, true, 'Saving…');
    try {
      settings = await API.admin('updateSettings', payload);
      UI.toast('Settings saved.', 'success');
    } catch (err) { UI.toast(err.message || 'Failed.', 'error'); }
    finally { UI.setLoading(btn, false); }
  }

  async function backup() {
    const btn = document.getElementById('backup-btn');
    UI.setLoading(btn, true, 'Creating backup…');
    try {
      const res = await API.admin('createBackup', {});
      UI.toast('Backup created: ' + res.name, 'success', 6000);
    } catch (err) { UI.toast(err.message || 'Backup failed.', 'error'); }
    finally { UI.setLoading(btn, false); }
  }

  function init() {
    const f = document.getElementById('settings-form');
    if (f) f.addEventListener('submit', save);
    const b = document.getElementById('backup-btn');
    if (b) b.onclick = backup;
    load();
  }

  return { init, load };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  Shell.init();
  AdminSettings.init();
});
window.AdminSettings = AdminSettings;
