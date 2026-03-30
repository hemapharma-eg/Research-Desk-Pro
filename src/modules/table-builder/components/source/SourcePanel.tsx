/**
 * SourcePanel.tsx — Source Link & Derived Results Panel (Section 8)
 */
import React from 'react';
import { useTableBuilder } from '../../TableBuilderContext';

export const SourcePanel: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const { table } = state;
  if (!table) return <div className="tb-empty-state"><p>Open a table to manage its data source.</p></div>;

  const sl = table.sourceLink;

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📊 Source Link & Derived Results</h2>

      {sl ? (
        <div>
          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 16, background: '#fff', border: '1px solid #e8eaed', borderRadius: 10 }}>
            <span className={`tb-link-badge tb-link-${sl.status}`} style={{ fontSize: 13, padding: '4px 12px' }}>
              {sl.status === 'linked' ? '🔗 Up to Date' : sl.status === 'outdated' ? '⚠️ Source Changed' : '🔓 Detached'}
            </span>
            <span style={{ fontSize: 12, color: '#868e96' }}>Last refreshed: {sl.lastRefreshAt ? new Date(sl.lastRefreshAt).toLocaleString() : 'Never'}</span>
          </div>

          {/* Source info */}
          <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div className="tb-prop-label">SOURCE DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', fontSize: 12 }}>
              <span style={{ color: '#868e96' }}>Test Name:</span><span>{sl.testName}</span>
              <span style={{ color: '#868e96' }}>Analysis ID:</span><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{sl.analysisId}</span>
              <span style={{ color: '#868e96' }}>Dataset ID:</span><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{sl.datasetId}</span>
              <span style={{ color: '#868e96' }}>Variables:</span><span>{sl.variablesUsed.join(', ')}</span>
              <span style={{ color: '#868e96' }}>Analysis Date:</span><span>{new Date(sl.analysisDate).toLocaleDateString()}</span>
              <span style={{ color: '#868e96' }}>Dataset Version:</span><span>{sl.datasetVersion}</span>
            </div>
          </div>

          {/* Field Mapping */}
          <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div className="tb-prop-label">FIELD MAPPING</div>
            {Object.entries(sl.fieldMapping).length > 0 ? (
              <div style={{ fontSize: 11 }}>
                {Object.entries(sl.fieldMapping).map(([cellId, field]) => (
                  <div key={cellId} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f1f3' }}>
                    <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{cellId.slice(0, 12)}…</span>
                    <span>→</span>
                    <span style={{ color: '#495057' }}>{field}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#adb5bd', fontStyle: 'italic', fontSize: 12 }}>No field mappings configured.</div>
            )}
          </div>

          {/* Refresh Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="tb-btn tb-btn-primary" onClick={() => { /* refresh logic */ }}>🔄 Refresh Values</button>
            <button className="tb-btn tb-btn-secondary" onClick={() => { /* refresh + keep notes */ }}>🔄 Refresh (Keep Notes)</button>
            <button className="tb-btn tb-btn-secondary" onClick={() => {
              dispatch({ type: 'SET_TABLE', payload: { ...table, sourceLink: { ...sl, status: 'detached' }, updatedAt: Date.now() } });
            }}>🔓 Detach Link</button>
            <button className="tb-btn tb-btn-secondary" onClick={() => {
              dispatch({ type: 'SET_TABLE', payload: { ...table, sourceLink: null, updatedAt: Date.now() } });
            }}>✕ Remove Source</button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 16, color: '#495057', marginBottom: 8 }}>No Source Linked</h3>
          <p style={{ fontSize: 13, color: '#868e96', marginBottom: 20 }}>
            This table is not connected to any statistical analysis output.
            Run an analysis in the Graphing Studio and click "Send to Table Builder" to create a linked table.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="tb-btn tb-btn-secondary">📊 Open Graphing Studio</button>
            <button className="tb-btn tb-btn-secondary">📁 Import CSV Data</button>
          </div>
        </div>
      )}

      {/* Consumed Output Types */}
      <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16 }}>
        <div className="tb-prop-label">SUPPORTED SOURCE TYPES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
          {['Descriptive Summaries', 'Inferential Results', 'Omnibus Tests', 'Post Hoc Comparisons', 'Regression Models', 'Correlation Matrices', 'Frequency Tables', 'Cross-tabulations', 'Paired Comparisons', 'Repeated Measures', 'Diagnostic Tests', 'Survival Analysis ⏳', 'Meta-Analysis ⏳'].map(t => (
            <div key={t} style={{ padding: '3px 6px', color: t.includes('⏳') ? '#adb5bd' : '#495057' }}>
              {t.includes('⏳') ? '○' : '●'} {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
