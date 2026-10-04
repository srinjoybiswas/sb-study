/* ============================================================
   SB NOTES PORTAL — certificates.js
   Certificate list, single certificate render, print/download.
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
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Could not load certificates', err.message);
    }
  }

  function renderList(certs) {
    const el = document.getElementById('certs-list');
    if (!el) return;
    if (!certs.length) { el.innerHTML = UI.emptyState('🏆', 'No certificates yet', 'Pass a test to earn your first certificate.'); return; }
    el.innerHTML = certs.map(c =>
      '<div class="note-card">' +
      '<div class="note-top"><div class="note-ico">🏆</div>' +
      '<span class="badge badge-success">' + UI.escapeHtml(c.percentage) + '%</span></div>' +
      '<h3>' + UI.escapeHtml(c.testTitle) + '</h3>' +
      '<div class="note-meta"><span>🆔 ' + UI.escapeHtml(c.certificateId) + '</span>' +
      '<span>📅 ' + UI.formatDate(c.issuedAt) + '</span></div>' +
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
      if (el) el.innerHTML = UI.emptyState('⚠️', 'Certificate not found', err.message);
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
      '<p class="cert-body">has successfully completed the test</p>' +
      '<h3>' + UI.escapeHtml(c.testTitle) + '</h3>' +
      '<p class="cert-body">with a score of <strong>' + UI.escapeHtml(c.score) + '</strong> (' + UI.escapeHtml(c.percentage) + '%)</p>' +
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
      '<button class="btn btn-primary" id="print-cert">🖨 Print</button>' +
      '<button class="btn btn-outline" id="download-cert">⬇ Download</button>' +
      '</div>';

    document.getElementById('print-cert').onclick = () => window.print();
    document.getElementById('download-cert').onclick = () => downloadCertificate(c);
  }

  function downloadCertificate(c) {
    // Download as a self-contained HTML file (printable to PDF).
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + UI.escapeHtml(c.certificateId) + '</title>' +
      '<style>body{font-family:Segoe UI,Arial,sans-serif;padding:40px;text-align:center}' +
      '.cert{border:12px solid #4f46e5;padding:40px;max-width:800px;margin:auto}' +
      'h1{color:#4f46e5}.name{font-size:32px;font-weight:800;margin:20px 0}</style></head><body>' +
      '<div class="cert"><h1>SB NOTES PORTAL</h1><p>Certificate of Achievement</p>' +
      '<div class="name">' + UI.escapeHtml(c.studentName) + '</div>' +
      '<p>completed <strong>' + UI.escapeHtml(c.testTitle) + '</strong></p>' +
      '<p>Score: ' + UI.escapeHtml(c.score) + ' (' + UI.escapeHtml(c.percentage) + '%)</p>' +
      '<p>Certificate ID: ' + UI.escapeHtml(c.certificateId) + '</p>' +
      '<p>Issued: ' + UI.formatDate(c.issuedAt) + '</p></div></body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = c.certificateId + '.html';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
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
