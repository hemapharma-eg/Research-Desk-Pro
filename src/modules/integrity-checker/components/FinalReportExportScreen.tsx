import { useState } from 'react';
import type { ScanSessionResult } from '../types/IntegrityTypes';

export function FinalReportExportScreen({ session }: { session: ScanSessionResult }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const filename = `integrity_report_${session.sessionId}.json`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Generate basic HTML representation of the report
      const reportFindings = session.findings || [];
      const findingsHtml = reportFindings.map(f => `
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
          <h4 style="margin: 0; color: ${f.severity === 'error' ? '#da1e28' : f.severity === 'warning' ? '#f1c21b' : '#333'};">
            [${f.severity.toUpperCase()}] ${f.check_name}
          </h4>
          <p style="margin: 5px 0;"><strong>Summary:</strong> ${f.summary}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Category:</strong> ${f.category} | <strong>Status:</strong> ${f.status}</p>
          ${f.extracted_evidence ? `<p style="margin: 5px 0; font-style: italic;">"${f.extracted_evidence}"</p>` : ''}
          ${f.recommendation ? `<p style="margin: 5px 0; color: #0f62fe;"><strong>Recommendation:</strong> ${f.recommendation}</p>` : ''}
        </div>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Integrity Report Proof</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
            h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { font-size: 18px; margin-top: 30px; }
            .stats { display: flex; justify-content: space-between; background: #f4f4f4; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .stat-box { text-align: center; }
            .stat-val { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Manuscript Integrity Audit Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          <div class="stats">
            <div class="stat-box"><div class="stat-val" style="color: green;">${session.stats.overallScore}/100</div>Score</div>
            <div class="stat-box"><div class="stat-val" style="color: #da1e28;">${session.stats.errorsCount}</div>Errors</div>
            <div class="stat-box"><div class="stat-val" style="color: #f1c21b;">${session.stats.warningsCount}</div>Warnings</div>
            <div class="stat-box"><div class="stat-val" style="color: #0f62fe;">${session.stats.noticesCount}</div>Notices</div>
          </div>
          
          <h2>Detailed Findings</h2>
          ${findingsHtml || '<p>No issues detected.</p>'}
        </body>
        </html>
      `;

      // Reuse the Table Builder PDF export IPC capability
      const fileName = `integrity_report_${session.sessionId.substring(0, 8)}.pdf`;
      const res = await window.api.exportTbPDF(htmlContent, fileName);
      if (res?.error) {
        console.error('PDF Export Error:', res.error);
        alert('Failed to export PDF: ' + res.error);
      }
    } catch (err) {
      console.error('Export exception:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>Audit Summary Report</h2>
        <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>Review your module's findings before generating a PDF proof for journal submission.</p>
      </div>

      <div className="card" style={{ width: '100%', padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>Overall Integrity Score: {session.stats.overallScore}/100</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', listStyle: 'none', padding: 0 }}>
          <li style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Critical Errors (Unresolved):</span>
            <strong style={{ color: session.stats.errorsCount > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{session.stats.errorsCount}</strong>
          </li>
          <li style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Warnings (Formatting/Structure):</span>
            <strong style={{ color: session.stats.warningsCount > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{session.stats.warningsCount}</strong>
          </li>
          <li style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Notices (Compliance Checks):</span>
            <strong style={{ color: 'var(--color-info)' }}>{session.stats.noticesCount}</strong>
          </li>
        </ul>
      </div>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <button className="btn btn-secondary" onClick={handleDownloadJSON}>Download JSON</button>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <span>Exporting...</span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Export PDF Proof
            </>
          )}
        </button>
      </div>
    </div>
  );
}
