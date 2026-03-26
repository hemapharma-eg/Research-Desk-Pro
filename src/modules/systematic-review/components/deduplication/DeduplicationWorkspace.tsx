import React, { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import { runDeduplication } from '../../utils/dedupEngine';

export function DeduplicationWorkspace() {
  const { state, dispatch, logEvent } = useSystematicReview();
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [selectedSurvivorId, setSelectedSurvivorId] = useState<string | null>(null);

  const startEngine = () => {
    const { clusters, records } = runDeduplication(state.records);
    dispatch({ type: 'SET_CLUSTERS', payload: clusters });
    // Update records heavily in bulk
    dispatch({ type: 'LOAD_STATE', payload: { ...state, records, clusters } });
    logEvent('project_created', 'deduplication', undefined, `Ran deduplication engine. Found ${clusters.length} suspicious clusters.`);
  };

  const activeCluster = state.clusters.find(c => c.id === activeClusterId);
  const clusterRecords = activeCluster?.recordIds.map(id => state.records.find(r => r.id === id)!).filter(Boolean) || [];

  const resolveCluster = (notDuplicate: boolean = false) => {
    if (!activeCluster) return;
    
    // We update the cluster marking it resolved
    const newClusters = state.clusters.map(c => 
      c.id === activeCluster.id ? { ...c, resolved: true, survivorId: notDuplicate ? null : selectedSurvivorId } : c
    );

    // We also must update the underlying records
    const newRecords = state.records.map(r => {
      if (activeCluster.recordIds.includes(r.id)) {
        if (notDuplicate) return { ...r, dedupStatus: 'unique' as any, dedupClusterId: null };
        return { ...r, dedupStatus: (r.id === selectedSurvivorId ? 'survivor' : 'duplicate') as any };
      }
      return r;
    });

    dispatch({ type: 'LOAD_STATE', payload: { ...state, clusters: newClusters, records: newRecords } });
    logEvent('dedup_resolved', 'deduplication', activeCluster.id, notDuplicate ? 'Marked cluster as NOT duplicates' : `Merged duplicates (Survivor: ${selectedSurvivorId})`);
    
    setActiveClusterId(null);
    setSelectedSurvivorId(null);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      
      {/* Panel 1: Cluster List */}
      <div style={{ width: 300, borderRight: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Detected Clusters ({state.clusters.filter(c => !c.resolved).length})</h3>
          <button className="sr-btn sr-btn-primary" onClick={startEngine} disabled={state.records.length === 0}>
            Run Auto-Detection Engine
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.clusters.filter(c => !c.resolved).map(c => (
            <div 
              key={c.id} 
              onClick={() => { setActiveClusterId(c.id); setSelectedSurvivorId(c.recordIds[0]); }}
              style={{
                padding: 12, borderRadius: 6, cursor: 'pointer',
                background: activeClusterId === c.id ? 'var(--color-bg-hover)' : 'var(--color-bg-subtle)',
                border: activeClusterId === c.id ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border-light)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                Confidence: <span style={{ color: c.confidence === 'exact' ? '#52c41a' : '#faad14' }}>{c.confidence.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Basis: {c.matchingBasis}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{c.recordIds.length} records</div>
            </div>
          ))}
          {state.clusters.length > 0 && state.clusters.every(c => c.resolved) && (
            <div style={{ padding: 20, textAlign: 'center', color: '#52c41a' }}>All duplicate clusters resolved!</div>
          )}
        </div>
      </div>

      {/* Panel 2 & 3 wrapper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-subtle)' }}>
        
        {!activeCluster ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            Select a cluster from the left panel to review.
          </div>
        ) : (
          <>
            {/* Header controls spanning top */}
            <div style={{ padding: '16px 24px', background: 'var(--color-bg-primary)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Compare Records</h2>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Review the metadata and select which record to keep. The others will be hidden from screening.</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="sr-btn" onClick={() => resolveCluster(true)}>Not Duplicates (Split)</button>
                <button className="sr-btn sr-btn-primary" onClick={() => resolveCluster(false)} disabled={!selectedSurvivorId}>Merge & Keep Selected</button>
              </div>
            </div>

            {/* Side-by-side comparison (Panel 2 & 3 hybrid) */}
            <div style={{ flex: 1, padding: 24, overflowX: 'auto', display: 'flex', gap: 24 }}>
              {clusterRecords.map(r => (
                <div 
                  key={r.id} 
                  className={`sr-card ${selectedSurvivorId === r.id ? 'survivor-selected' : ''}`}
                  style={{ 
                    minWidth: 350, maxWidth: 450, display: 'flex', flexDirection: 'column', 
                    border: selectedSurvivorId === r.id ? '2px solid #52c41a' : '1px solid var(--color-border-light)',
                    boxShadow: selectedSurvivorId === r.id ? '0 0 0 2px rgba(82, 196, 26, 0.2)' : 'none'
                  }}
                  onClick={() => setSelectedSurvivorId(r.id)}
                >
                  <div style={{ background: selectedSurvivorId === r.id ? '#f6ffed' : 'var(--color-bg-subtle)', margin: '-20px -20px 16px -20px', padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.sourceDatabase}</span>
                    <input type="radio" checked={selectedSurvivorId === r.id} readOnly />
                  </div>

                  <strong style={{ fontSize: 16, color: 'var(--color-accent-primary)', marginBottom: 8 }}>{r.title}</strong>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{r.authors} ({r.year})</div>
                  <div style={{ fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>{r.journal}</div>

                  <div style={{ flex: 1, background: 'var(--color-bg-subtle)', padding: 12, borderRadius: 6, fontSize: 12, lineHeight: 1.6, overflowY: 'auto' }}>
                    {r.abstract}
                  </div>

                  <table style={{ width: '100%', marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <tbody>
                      <tr><td style={{ width: 80, fontWeight: 'bold' }}>DOI</td><td>{r.doi || '-'}</td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>PMID</td><td>{r.pmid || '-'}</td></tr>
                      <tr><td style={{ fontWeight: 'bold' }}>Imported at</td><td>{new Date(r.importTimestamp).toLocaleDateString()}</td></tr>
                    </tbody>
                  </table>

                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
