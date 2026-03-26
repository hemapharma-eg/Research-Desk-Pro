import React, { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';

export function FinalLibrariesWorkspace() {
  const { state, dispatch } = useSystematicReview();
  const [activeTab, setActiveTab] = useState<'included' | 'excluded'>('included');

  const included = state.records.filter(r => r.finalDisposition === 'included');
  const excluded = state.records.filter(r => r.finalDisposition === 'excluded');

  const getReasonLabel = (reasonId?: string) => {
    if (!reasonId) return 'No reason provided';
    return state.project?.exclusionReasons.find(r => r.id === reasonId)?.label || 'Unknown Reason';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--color-border-light)', marginBottom: 24 }}>
        <button
          className={`sr-nav-item ${activeTab === 'included' ? 'active' : ''}`}
          style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'included' ? '2px solid #52c41a' : 'none', fontWeight: activeTab === 'included' ? 'bold' : 'normal', color: activeTab === 'included' ? '#52c41a' : 'var(--color-text-secondary)' }}
          onClick={() => setActiveTab('included')}
        >
          Included Studies ({included.length})
        </button>
        <button
          className={`sr-nav-item ${activeTab === 'excluded' ? 'active' : ''}`}
          style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'excluded' ? '2px solid #f5222d' : 'none', fontWeight: activeTab === 'excluded' ? 'bold' : 'normal', color: activeTab === 'excluded' ? '#f5222d' : 'var(--color-text-secondary)' }}
          onClick={() => setActiveTab('excluded')}
        >
          Excluded Studies ({excluded.length})
        </button>
      </div>

      <div className="sr-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {activeTab === 'included' && (
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
              <thead style={{ background: 'var(--color-bg-subtle)' }}>
                <tr>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left' }}>Citation</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 250 }}>Source/DOI</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 120 }}>Tags</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 120 }}>Inclusion Stage</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'center', width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {included.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No studies successfully included yet.</td></tr>
                ) : (
                  included.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: '12px', color: 'var(--color-accent-primary)', fontWeight: 500 }}>
                        <div style={{ marginBottom: 4 }}>{r.title}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 'normal' }}>{r.authors} ({r.year})</div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--color-text-tertiary)' }}>
                        <div>{r.sourceDatabase}</div>
                        <div>{r.doi || r.pmid || '-'}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {r.likelyStudyDesign?.map(h => <div key={h} style={{ fontSize: 11, background: '#f5f5f5', display: 'inline-block', padding: '2px 4px', marginBottom: 2, borderRadius: 2, border: '1px solid #ddd' }}>{h}</div>)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '2px 6px', background: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff', borderRadius: 4, fontSize: 11 }}>
                          {r.stage === 'included' ? 'Full Text' : 'TiAb'} {/* TiAb inclusion if no FT stage existed. */}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button className="sr-btn" style={{ fontSize: 11 }}>Send to Extractor</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'excluded' && (
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
              <thead style={{ background: 'var(--color-bg-subtle)' }}>
                <tr>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left' }}>Citation</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 150 }}>Exclusion Stage</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 250 }}>Final Reason</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'center', width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {excluded.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No studies excluded yet.</td></tr>
                ) : (
                  excluded.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>
                        <div style={{ marginBottom: 4 }}>{r.title}</div>
                        <div style={{ fontSize: 12 }}>{r.authors} ({r.year})</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '2px 6px', background: '#fff1f0', color: '#f5222d', border: '1px solid #ffa39e', borderRadius: 4, fontSize: 11, textTransform: 'capitalize' }}>
                          {r.stage.replace('-', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 500, color: '#cf1322' }}>
                        {getReasonLabel(r.finalReasonId)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button className="sr-btn" style={{ fontSize: 11 }} onClick={() => {
                          dispatch({ type: 'UPDATE_RECORD', payload: { id: r.id, updates: { finalDisposition: 'pending', stage: 'title-abstract-screening' } } })
                        }}>Re-open</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
