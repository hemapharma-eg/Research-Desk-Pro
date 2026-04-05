import type { IntegrityFinding } from '../types/IntegrityTypes';

export function DocumentEvidenceViewer({ finding }: { finding: IntegrityFinding }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)' }}>
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Document Evidence</h3>
      </div>
      
      <div style={{ padding: 'var(--space-4)', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
          Section: <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{finding.document_section || 'Unknown'}</span>
        </div>

        {finding.extracted_evidence ? (
          <div style={{ 
            marginTop: 'var(--space-4)', 
            padding: 'var(--space-4)', 
            backgroundColor: 'var(--color-bg-app)', 
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-family-serif)',
            fontSize: 'var(--font-size-md)',
            lineHeight: 1.6,
            border: '1px solid var(--color-border-light)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <p>
              ... <mark style={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: 'var(--color-text-primary)', padding: '2px 4px', borderRadius: '2px' }}>{finding.extracted_evidence}</mark> ...
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <p>No specific text excerpt available for this issue.</p>
          </div>
        )}

        <div style={{ marginTop: 'var(--space-6)' }}>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-to-module', { 
                detail: { 
                  module: 'document-editor',
                  targetNodeId: finding.location_anchor,
                  context: 'integrity-finding'
                } 
              }));
            }}
          >
            Locate in Editor
          </button>
        </div>
      </div>
    </div>
  );
}
