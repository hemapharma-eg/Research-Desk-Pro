import { useState } from 'react';
import type { ScanSessionResult } from '../types/IntegrityTypes';

export function CrossReferenceExplorer({ session }: { session: ScanSessionResult }) {
  const [activeTab, setActiveTab] = useState<'abbreviations' | 'citations' | 'assets'>('abbreviations');

  const citations = session.citations || [];
  const abbreviations = session.abbreviations || [];
  const tableFigureMappings = session.tableFigureMappings || [];

  const definedAbbrs = abbreviations.filter(a => a.expansion !== null);
  const undefinedAbbrs = abbreviations.filter(a => a.expansion === null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-4)' }}>
      <header style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>Cross-Reference Analytics</h2>
        <p className="text-secondary">Explore all matched data points across your document.</p>
      </header>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flex: 1, overflow: 'hidden' }}>
        
        {/* Sidebar Nav */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button 
            onClick={() => setActiveTab('abbreviations')}
            style={{ textAlign: 'left', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', backgroundColor: activeTab === 'abbreviations' ? 'var(--color-bg-hover)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'abbreviations' ? 'bold' : 'normal', color: activeTab === 'abbreviations' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
          >
            Abbreviations ({abbreviations?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('citations')}
            style={{ textAlign: 'left', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', backgroundColor: activeTab === 'citations' ? 'var(--color-bg-hover)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'citations' ? 'bold' : 'normal', color: activeTab === 'citations' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
          >
            In-Text References ({citations?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            style={{ textAlign: 'left', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', backgroundColor: activeTab === 'assets' ? 'var(--color-bg-hover)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'assets' ? 'bold' : 'normal', color: activeTab === 'assets' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
          >
            Figures & Tables ({tableFigureMappings?.length || 0})
          </button>
        </div>

        {/* Main Content Pane */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {activeTab === 'abbreviations' && (
            <>
              <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)' }}>Abbreviation Registry</h3>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {abbreviations?.length || 0} found · {undefinedAbbrs.length} undefined
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
                {(abbreviations?.length || 0) > 0 ? (
                  <>
                    {undefinedAbbrs.length > 0 && (
                      <div style={{ marginBottom: 'var(--space-3)' }}>
                        <h4 style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-warning)', marginBottom: 'var(--space-2)', letterSpacing: '0.5px' }}>⚠ Missing Definitions</h4>
                        {undefinedAbbrs.map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2)', marginBottom: 'var(--space-1)', backgroundColor: 'rgba(255, 152, 0, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-warning)' }}>
                            <div>
                              <strong style={{ fontFamily: 'var(--font-family-mono)' }}>{a.abbreviation}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                First used: {a.first_use_location || 'Unknown section'}
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {a.usage_count} use{a.usage_count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {definedAbbrs.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: 'var(--space-2)', letterSpacing: '0.5px' }}>✓ Properly Defined</h4>
                        {definedAbbrs.map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                            <div>
                              <strong style={{ fontFamily: 'var(--font-family-mono)' }}>{a.abbreviation}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{a.expansion}</div>
                              {a.issue_flag === 'late_definition' && (
                                <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '2px' }}>⚠ Defined after first use</div>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                              {a.usage_count} use{a.usage_count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-tertiary" style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>No abbreviations detected.</p>
                )}
              </div>
            </>
          )}

          {activeTab === 'citations' && (
            <>
              <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)' }}>In-Text Citations</h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
                {(citations?.length || 0) > 0 ? (
                  citations.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>{c.citation_string}</div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: c.matched_status === 'matched' ? 'var(--color-success-light)' : 'var(--color-warning-light)' }}>
                        {c.matched_status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
                    <p>Citation mapping will appear after references are cross-checked against in-text mentions.</p>
                    <p style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
                      Check the <strong>Findings</strong> tab for any unlinked citation warnings detected during scan.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'assets' && (
            <>
              <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)' }}>Figures & Tables</h3>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {tableFigureMappings?.length || 0} tracked assets
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
                {(tableFigureMappings?.length || 0) > 0 ? (
                  tableFigureMappings.map((m, i) => (
                    <div key={m.id || i} style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-3)', marginBottom: 'var(--space-2)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                        <strong style={{ fontSize: 'var(--font-size-sm)', textTransform: 'capitalize' }}>
                          {m.item_type} {m.label_number}
                        </strong>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: m.numbering_status === 'ok' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: m.numbering_status === 'ok' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {m.numbering_status.replace('_', ' ')}
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                        {m.caption_text ? `"${m.caption_text}"` : <em style={{ color: 'var(--color-text-tertiary)' }}>No caption text</em>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        <span>Mentions: <strong>{m.in_text_mentions_count}</strong></span>
                        <span>First appear: {m.first_mention_location || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-tertiary" style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>No figures or tables detected.</p>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
