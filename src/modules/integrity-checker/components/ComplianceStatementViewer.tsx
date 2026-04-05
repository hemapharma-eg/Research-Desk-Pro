import type { ScanSessionResult, IntegrityFinding } from '../types/IntegrityTypes';

export function ComplianceStatementViewer({ session, onUpdateSession }: { session: ScanSessionResult; onUpdateSession?: (session: ScanSessionResult) => void }) {
  // Filter findings to compliance category
  const activeFindingsList = session.findings || [];
  const complianceFindings = activeFindingsList.filter(f => f.category === 'compliance');

  // Derive detected status from what was NOT flagged (or what was resolved/ignored)
  const checks = [
    { title: 'IRB / Ethics Committee Approval', checkName: 'Missing IRB / Ethics Approval Statement' },
    { title: 'Conflict of Interest', checkName: 'Missing Conflict of Interest Declaration' },
    { title: 'Funding / Acknowledgments', checkName: 'Missing Funding / Acknowledgments Statement' },
    { title: 'Data Availability Statement', checkName: 'Missing Data Availability Statement' },
    { title: 'Clinical Trial Registration', checkName: 'Missing Trial Registration Statement' },
  ];

  const activeFindings = complianceFindings.filter(f => f.status === 'unresolved');
  const missingCount = checks.filter(c => activeFindings.some(f => f.check_name === c.checkName)).length;
  const passedCount = checks.length - missingCount;

  const handleToggleNA = async (finding: IntegrityFinding) => {
    try {
      const newStatus = finding.status === 'ignored' ? 'unresolved' : 'ignored';
      if (finding.id) {
        await window.api.updateIcFindingStatus(finding.id, newStatus, finding.reviewer_note);
      }
      
      if (onUpdateSession) {
        const updated = { ...finding, status: newStatus as any };
        const newFindings = activeFindingsList.map(f => f.id === updated.id ? updated : f);
        onUpdateSession({ ...session, findings: newFindings });
      }
    } catch (err) {
      console.error('Failed to change finding status', err);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>Compliance Declarations</h2>
        <p className="text-secondary" style={{ marginTop: 'var(--space-1)' }}>Verify that required journal/institutional statements are present in your manuscript.</p>
      </header>

      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div style={{ color: missingCount > 0 ? 'var(--color-warning)' : 'var(--color-success)', marginTop: '2px' }}>
            {missingCount > 0 ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>
              {missingCount > 0 ? `${missingCount} Required Statement${missingCount > 1 ? 's' : ''} Missing` : 'All Required Statements Detected'}
            </h3>
            <p className="text-secondary" style={{ marginTop: 'var(--space-1)' }}>
              {passedCount} of {checks.length} compliance checks passed or marked N/A.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {checks.map(check => {
          const finding = complianceFindings.find(f => f.check_name === check.checkName);
          const isIgnored = finding?.status === 'ignored' || finding?.status === 'false_positive';
          const detected = !finding || isIgnored || finding.status === 'resolved';

          return (
            <div
              key={check.title}
              style={{
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: 'var(--space-3)',
                backgroundColor: detected ? 'transparent' : 'rgba(255, 152, 0, 0.05)'
              }}
            >
              <div style={{ minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {!finding ? (
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '4px 8px', backgroundColor: 'var(--color-success-light)', borderRadius: '4px', color: 'green', fontWeight: 'bold' }}>Found</span>
                ) : isIgnored ? (
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '4px 8px', backgroundColor: 'var(--color-bg-app)', borderRadius: '4px', color: 'var(--color-text-tertiary)', fontWeight: 'bold' }}>N / A</span>
                ) : finding.status === 'resolved' ? (
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '4px 8px', backgroundColor: 'var(--color-success-light)', borderRadius: '4px', color: 'green', fontWeight: 'bold' }}>Resolved</span>
                ) : (
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '4px 8px', backgroundColor: 'var(--color-warning-light)', borderRadius: '4px', color: '#b26e00', fontWeight: 'bold' }}>Missing</span>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{check.title}</h4>
                  
                  {!finding ? (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>✓ Statement detected in manuscript</div>
                    </div>
                  ) : isIgnored ? (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>This requirement was marked as Not Applicable for this manuscript.</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {finding.extracted_evidence ? (
                          <div style={{ marginBottom: '4px' }}>Extracted text: <em>"{finding.extracted_evidence}"</em> - {finding.recommendation}</div>
                        ) : (
                          finding.recommendation || 'Add the required statement.'
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {finding && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: 'var(--font-size-xs)', padding: '4px 8px' }}
                    onClick={() => handleToggleNA(finding)}
                  >
                    {isIgnored ? 'Re-enable Check' : 'Mark as N/A'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
