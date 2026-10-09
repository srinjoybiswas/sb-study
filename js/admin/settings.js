/* ============================================================
   SB NOTES PORTAL — admin/settings.js
   Admin settings, maintenance toggles, backup, schema diagnostics.
   ============================================================ */

const AdminSettings = (function () {
  let settings = {};

  /** Read a field by id (never form named-access, which collides with built-in
   *  form properties such as `name`/`title` and can silently return wrong values). */
  function $(id) { return document.getElementById(id); }

  async function load() {
    try {
      settings = await API.admin('getAdminSettings', {});
      fill();
    } catch (err) {
      UI.toastError(err, 'Could not load settings.');
    }
  }

  function fill() {
    const f = document.getElementById('settings-form');
    if (!f) return;
    $('s-name').value = settings.websiteName || '';
    $('s-status').value = settings.websiteStatus || 'ON';
    $('s-maint').value = settings.maintenanceMode || 'OFF';
    $('s-mod').value = settings.modificationMode || 'OFF';
    $('s-reg').value = settings.registrationEnabled || 'ON';
    $('s-pass').value = settings.defaultPassingPercent || 60;
    $('s-time').value = settings.defaultTimePerQuestion || 60;
    $('s-attempts').value = settings.maxLoginAttempts || 5;
    $('s-session').value = settings.sessionDurationMinutes || 120;
    $('s-copy').value = settings.copyViolationThreshold || 3;
    $('s-block').value = settings.tempBlockDurationMinutes || 30;
    $('s-notif').value = settings.notificationEnabled || 'ON';
  }

  async function save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    const payload = {
      websiteName: $('s-name').value.trim(),
      websiteStatus: $('s-status').value,
      maintenanceMode: $('s-maint').value,
      modificationMode: $('s-mod').value,
      registrationEnabled: $('s-reg').value,
      defaultPassingPercent: $('s-pass').value,
      defaultTimePerQuestion: $('s-time').value,
      maxLoginAttempts: $('s-attempts').value,
      sessionDurationMinutes: $('s-session').value,
      copyViolationThreshold: $('s-copy').value,
      tempBlockDurationMinutes: $('s-block').value,
      notificationEnabled: $('s-notif').value
    };
    UI.setLoading(btn, true, 'Saving…');
    try {
      settings = await API.admin('updateSettings', payload);
      UI.toast('Settings saved.', 'success');
    } catch (err) { UI.toastError(err, 'Could not save settings.'); }
    finally { UI.setLoading(btn, false); }
  }

  async function backup() {
    const btn = document.getElementById('backup-btn');
    UI.setLoading(btn, true, 'Creating backup…');
    try {
      const res = await API.admin('createBackup', {});
      UI.toast('Backup created: ' + res.name, 'success', 6000);
    } catch (err) { UI.toastError(err, 'Backup failed.'); }
    finally { UI.setLoading(btn, false); }
  }

  /** Show the spreadsheet schema health report (getDiagnostics action). */
  async function diagnostics() {
    const btn = document.getElementById('diagnostics-btn');
    const card = document.getElementById('diagnostics-card');
    const body = document.getElementById('diagnostics-body');
    UI.setLoading(btn, true, 'Checking…');
    try {
      const d = await API.admin('getDiagnostics', {});
      const schema = d.schema || {};
      const rows = (schema.sheets || []).map(s => {
        const bad = !s.exists || (s.missingColumns && s.missingColumns.length);
        return '<tr>' +
          '<td>' + UI.escapeHtml(s.name) + '</td>' +
          '<td>' + (s.exists ? '✓' : '✗ missing') + '</td>' +
          '<td>' + (s.rows === undefined ? '—' : s.rows) + '</td>' +
          '<td>' + s.actualColumns + ' / ' + s.expectedColumns + '</td>' +
          '<td>' + (bad ? '<span class="badge badge-danger">' + UI.escapeHtml((s.missingColumns || []).join(', ') || 'missing sheet') + '</span>' : '<span class="badge badge-success">OK</span>') + '</td>' +
          '</tr>';
      }).join('');
      body.innerHTML =
        '<p class="mb-8">Overall: ' + (d.healthy ? '<span class="badge badge-success">Healthy</span>' : '<span class="badge badge-danger">Issues found</span>') +
        ' &nbsp; Spreadsheet configured: ' + (d.config && d.config.spreadsheetConfigured ? '✓' : '✗') +
        ' &nbsp; Drive folder configured: ' + (d.config && d.config.driveFolderConfigured ? '✓' : '✗') + '</p>' +
        (d.errors && d.errors.length ? '<p class="text-danger">' + d.errors.map(UI.escapeHtml).join('<br>') + '</p>' : '') +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Sheet</th><th>Exists</th><th>Rows</th><th>Columns</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
      card.classList.remove('hidden');
    } catch (err) { UI.toastError(err, 'Diagnostics failed.'); }
    finally { UI.setLoading(btn, false); }
  }

  /** Self-heal the spreadsheet schema (repairSchema action). */
  async function repair() {
    const btn = document.getElementById('repair-btn');
    UI.setLoading(btn, true, 'Repairing…');
    try {
      const res = await API.admin('repairSchema', {});
      const n = (res.repaired || []).length;
      UI.toast(n ? ('Schema repaired: ' + res.repaired.map(r => r.sheet).join(', ')) : 'Schema already healthy.', 'success', 6000);
      diagnostics();
    } catch (err) { UI.toastError(err, 'Repair failed.'); }
    finally { UI.setLoading(btn, false); }
  }

  function init() {
    const f = document.getElementById('settings-form');
    if (f) f.addEventListener('submit', save);
    const b = document.getElementById('backup-btn');
    if (b) b.onclick = backup;
    const d = document.getElementById('diagnostics-btn');
    if (d) d.onclick = diagnostics;
    const r = document.getElementById('repair-btn');
    if (r) r.onclick = repair;
    const dc = document.getElementById('diagnostics-close');
    if (dc) dc.onclick = () => document.getElementById('diagnostics-card').classList.add('hidden');
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
