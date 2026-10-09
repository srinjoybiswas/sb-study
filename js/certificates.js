/* ============================================================
   SB NOTES PORTAL — certificates.js
   Monthly study certificates: list, single certificate render,
   print and PDF download (generated server-side in Drive).
   ============================================================ */

const Certificates = (function () {
  let current = null;

  async function loadList() {
    const el = document.getElementById('certs-list');
    if (el) el.innerHTML = UI.skeleton(3).repeat(2).replace(/skeleton-line/g, 'skeleton-card');
    try {
      const certs = await API.get('getCertificates', {});
      renderList(certs);
    } catch (err) {
      if (el) el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Could not load certificates', err.message);
    }
  }

  function renderList(certs) {
    const el = document.getElementById('certs-list');
    if (!el) return;
    if (!certs.length) {
      el.innerHTML = UI.emptyState('\ud83c\udfc6', 'No certificates yet',
        'A certificate is issued automatically at the end of each month when your study score meets the minimum.');
      return;
    }
    el.innerHTML = certs.map(c =>
      '<div class="note-card">' +
      '<div class="note-top"><div class="note-ico">\ud83c\udfc6</div>' +
      '<span class="badge badge-success">Score ' + UI.escapeHtml(c.score) + '/100</span></div>' +
      '<h3>' + UI.escapeHtml(c.period) + '</h3>' +
      '<div class="note-meta"><span>\ud83c\udd94 ' + UI.escapeHtml(c.certificateId) + '</span>' +
      '<span>\ud83d\udcc5 ' + UI.formatDate(c.issuedAt) + '</span></div>' +
      '<div class="text-xs text-muted mb-8">' + (parseInt(c.totalMinutes, 10) || 0) + ' min studied \u00b7 ' +
      (parseInt(c.notesStudied, 10) || 0) + ' notes</div>' +
      '<a class="btn btn-primary btn-sm" href="certificate.html?id=' + encodeURIComponent(c.certificateId) + '">View Certificate</a>' +
      '</div>'
    ).join('');
  }

  async function loadOne(id) {
    try {
      current = await API.get('getCertificate', { certificateId: id });
      renderCertificate(current);
    } catch (err) {
      const el = document.getElementById('certificate-wrap');
      if (el) el.innerHTML = UI.emptyState('\u26a0\ufe0f', 'Certificate not found', err.message);
    }
  }

  function renderCertificate(c) {
    const el = document.getElementById('certificate-wrap');
    if (!el) return;
    const verifyUrl = window.location.origin + window.location.pathname.replace('certificate.html', 'verify.html') + '?id=' + encodeURIComponent(c.certificateId);
    el.innerHTML =
      '<div class="certificate" id="certificate-print">' +
      '<div class="cert-inner">' +
      '<div class="cert-logo">SB</div>' +
      '<h1>SB NOTES PORTAL</h1>' +
      '<div class="cert-sub">Certificate of Achievement</div>' +
      '<p class="cert-body">This is to certify that</p>' +
      '<div class="cert-name">' + UI.escapeHtml(c.studentName) + '</div>' +
      '<p class="cert-body">has demonstrated consistent dedication to self-study during</p>' +
      '<h3>' + UI.escapeHtml(c.period) + '</h3>' +
      '<p class="cert-body">achieving a study score of <strong>' + UI.escapeHtml(c.score) + '/100</strong>' +
      ' across <strong>' + UI.escapeHtml(c.totalMinutes) + ' minutes</strong> and <strong>' + UI.escapeHtml(c.notesStudied) + ' notes</strong>.</p>' +
      '<div class="cert-meta">' +
      '<div class="cm-item"><strong>Certificate ID</strong>' + UI.escapeHtml(c.certificateId) + '</div>' +
      '<div class="cm-item"><strong>Verification ID</strong>' + UI.escapeHtml(c.verificationId) + '</div>' +
      '<div class="cm-item"><strong>Issued On</strong>' + UI.formatDate(c.issuedAt) + '</div>' +
      '<div class="qr-box">QR<br>' + UI.escapeHtml(c.certificateId) + '</div>' +
      '</div>' +
      '<div class="cert-meta" style="margin-top:30px">' +
      '<div class="cert-sign">Authorized Signature</div>' +
      '<div class="cert-sign">Date</div>' +
      '</div>' +
      '<p class="text-xs text-muted mt-16">Verify at: ' + UI.escapeHtml(verifyUrl) + '</p>' +
      '</div></div>' +
      '<div class="flex gap-12 mt-24 no-print" style="justify-content:center">' +
      '<button class="btn btn-primary" id="print-cert">\ud83d\udda8 Print</button>' +
      '<button class="btn btn-outline" id="download-cert">\u2b07 Download PDF</button>' +
      '</div>';

    document.getElementById('print-cert').onclick = () => window.print();
    document.getElementById('download-cert').onclick = () => downloadCertificate(c);
  }

  /**
   * Download the server-generated PDF. If the PDF was not produced (or the
   * Drive file is unavailable) fall back to the Drive link, then to a
   * printable self-contained HTML document.
   */
  async function downloadCertificate(c) {
    const btn = document.getElementById('download-cert');
    UI.setLoading(btn, true, 'Preparing\u2026');
    try {
      const file = await API.get('getCertificateFile', { certificateId: c.certificateId });
      const bin = atob(file.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: file.mimeType || 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.fileName || (c.certificateId + '.pdf');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      UI.toast('Certificate downloaded.', 'success');
    } catch (err) {
      if (c.docUrl) { window.open(c.docUrl, '_blank', 'noopener'); UI.setLoading(btn, false); return; }
      downloadCertificateHtml(c);
      UI.toast('Downloaded a printable copy \u2014 open it and choose \u201cSave as PDF\u201d.', 'info', 6000);
    } finally { UI.setLoading(btn, false); }
  }

  function downloadCertificateHtml(c) {
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + UI.escapeHtml(c.certificateId) + '</title>' +
      '<style>@page{size:A4;margin:14mm}body{font-family:Segoe UI,Arial,sans-serif;padding:40px;text-align:center}' +
      '.cert{border:12px solid #4f46e5;padding:44px;max-width:820px;margin:auto;border-radius:8px}' +
      '.logo{width:64px;height:64px;border-radius:16px;background:#4f46e5;color:#fff;font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}' +
      'h1{color:#4f46e5;letter-spacing:.04em}.name{font-size:32px;font-weight:800;margin:20px 0}' +
      '.meta{display:flex;justify-content:space-between;gap:16px;margin-top:34px;text-align:left;font-size:13px}</style></head><body>' +
      '<div class="cert"><div class="logo">SB</div><h1>SB NOTES PORTAL</h1><p>Certificate of Achievement</p>' +
      '<div class="name">' + UI.escapeHtml(c.studentName) + '</div>' +
      '<p>for dedicated self-study during <strong>' + UI.escapeHtml(c.period) + '</strong></p>' +
      '<p>Study score: <strong>' + UI.escapeHtml(c.score) + '/100</strong> \u00b7 ' + UI.escapeHtml(c.totalMinutes) + ' minutes \u00b7 ' + UI.escapeHtml(c.notesStudied) + ' notes</p>' +
      '<div class="meta"><div>Certificate ID: ' + UI.escapeHtml(c.certificateId) + '</div>' +
      '<div>Issued: ' + UI.formatDate(c.issuedAt) + '</div></div></div></body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = c.certificateId + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function init() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) loadOne(id);
    else loadList();
  }

  return { init, loadList, loadOne };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireStudent()) return;
  Shell.init();
  Certificates.init();
});
window.Certificates = Certificates;
