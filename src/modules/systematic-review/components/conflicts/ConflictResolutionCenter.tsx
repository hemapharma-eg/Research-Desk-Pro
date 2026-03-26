import React, { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import type { ReviewRecord, Conflict } from '../../types/ReviewModels';

export function ConflictResolutionCenter() {
  const { state, dispatch, logEvent } = useSystematicReview();
  
  // Resolve mock / pending conflicts derived from records
  const conflicts = state.conflicts.filter(c => c.status === 'pending');
  
  // For UI mockup completeness without rigorous dual screening mocked backend:
  // If no explicit conflicts exist, we will extract any record tagged 'maybe' or stage 'conflict-resolution' implicitly.
  const implicitConflictRecords = state.records.filter(r => r.stage === 'conflict-resolution' || r.finalDisposition === 'maybe');

  const [activeRecordId, setActiveRecordId] = useState<string | null>(implicitConflictRecords[0]?.id || null);
  const activeRecord = state.records.find(r => r.id === activeRecordId) || implicitConflictRecords[0];

  const fullTextReasons = state.project?.exclusionReasons.filter(r => r.type !== 'title-abstract') || [];
  
  const [resolutionAction, setResolutionAction] = useState<'include' | 'exclude' | null>(null);
  const [reasonId, setReasonId] = useState('');
  const [note, setNote] = useState('');

  const submitResolution = () => {
    if (!activeRecord || !resolutionAction) return;

    if (resolutionAction === 'exclude' && !reasonId && fullTextReasons.length > 0) {
      alert('Must supply a reason to exclude during conflict resolution.');
      return;
    }

    const updatedRecord = { ...activeRecord };
    
    if (resolutionAction === 'include') {
      updatedRecord.stage = 'included';
      updatedRecord.finalDisposition = 'included';
    } else {
      updatedRecord.stage = 'excluded';
      updatedRecord.finalDisposition = 'excluded';
      updatedRecord.finalReasonId = reasonId;
    }

    dispatch({ type: 'UPDATE_RECORD', payload: { id: activeRecord.id, updates: updatedRecord } });
    logEvent('conflict_resolved', 'conflict-resolution', activeRecord.id, `Conflict resolved as ${resolutionAction.toUpperCase()}`);

    // Move next
    const nextIdx = implicitConflictRecords.findIndex(r => r.id === activeRecord.id) + 1;
    if (nextIdx < implicitConflictRecords.length) {
      setActiveRecordId(implicitConflictRecords[nextIdx].id);
    } else {
      setActiveRecordId(null);
    }
    
    setResolutionAction(null);
    setReasonId('');
    setNote('');
  };

  if (!activeRecord) {
     return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No unresolved conflicts present.</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      
      {/* List Queue Panel */}
      <div style={{ width: 250, borderRight: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--color-border-light)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Open Conflicts ({implicitConflictRecords.length})</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {implicitConflictRecords.map((r, i) => (
             <div 
               key={r.id} 
               onClick={() => setActiveRecordId(r.id)}
               style={{ 
                 padding: '12px 16px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)',
                 background: activeRecordId === r.id ? 'var(--color-bg-hover)' : 'transparent',
                 borderLeft: activeRecordId === r.id ? '3px solid #fa8c16' : '3px solid transparent'
               }}
             >
               <strong style={{ display: 'block', color: 'var(--color-accent-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                 {r.title}
               </strong>
               <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginTop: 4 }}>
                 {Object.keys(r.titleAbstractDecisions).length + Object.keys(r.fullTextDecisions).length} Disagreements
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Main Resolution Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-subtle)', overflowY: 'auto' }}>
        
        <div style={{ padding: 32 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            <div className="sr-card">
              <h1 style={{ fontSize: 20, margin: '0 0 12px 0' }}>{activeRecord.title}</h1>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 12 }}>{activeRecord.authors} ({activeRecord.year}) • {activeRecord.journal}</div>
              <div style={{ background: 'var(--color-bg-subtle)', padding: 16, borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>{activeRecord.abstract || 'No abstract'}</div>
            </div>

            {/* Side-by-side Reviewer Decisions View */}
            <div style={{ display: 'flex', gap: 24 }}>
               {/* Synthesize mock reviewer splits since we mock standard single user usage */}
               <div style={{ flex: 1 }} className="sr-card">
                 <strong style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8, marginBottom: 12, display: 'block', color: 'var(--color-text-secondary)' }}>
                   Reviewer: Dr. A (Mocked)
                 </strong>
                 <div style={{ color: '#cf1322', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>EXCLUDE</div>
                 <div style={{ fontSize: 13 }}>
                   <strong>Reason:</strong> Wrong Intervention<br/><br/>
                   <em>"They used a modified variation of the drug not in scope."</em>
                 </div>
               </div>

               <div style={{ flex: 1 }} className="sr-card">
                 <strong style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8, marginBottom: 12, display: 'block', color: 'var(--color-text-secondary)' }}>
                   Reviewer: Dr. B (Mocked)
                 </strong>
                 <div style={{ color: '#389e0d', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>INCLUDE</div>
                 <div style={{ fontSize: 13 }}>
                   <strong>Notes:</strong><br/>
                   <em>"Looks highly relevant to the secondary outcome."</em>
                 </div>
               </div>
            </div>

            {/* Adjudicator Controls */}
            <div className="sr-card" style={{ border: '2px solid #faad14' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#d48806' }}>⚖️ Adjudicator Resolution</h3>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <button 
                  className="sr-btn" 
                  style={{ flex: 1, padding: 12, fontSize: 15, fontWeight: 'bold', background: resolutionAction === 'include' ? '#e6f7ff' : '#fff', color: resolutionAction === 'include' ? '#1890ff' : 'var(--color-text-secondary)', border: resolutionAction === 'include' ? '2px solid #1890ff' : '1px solid var(--color-border-light)' }}
                  onClick={() => setResolutionAction('include')}
                >
                  Resolve as INCLUDE
                </button>
                <button 
                  className="sr-btn" 
                  style={{ flex: 1, padding: 12, fontSize: 15, fontWeight: 'bold', background: resolutionAction === 'exclude' ? '#fff1f0' : '#fff', color: resolutionAction === 'exclude' ? '#f5222d' : 'var(--color-text-secondary)', border: resolutionAction === 'exclude' ? '2px solid #f5222d' : '1px solid var(--color-border-light)' }}
                  onClick={() => setResolutionAction('exclude')}
                >
                  Resolve as EXCLUDE
                </button>
              </div>

              {resolutionAction === 'exclude' && (
                <div style={{ marginBottom: 24 }}>
                   <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Final Exclusion Reason</label>
                   <select value={reasonId} onChange={e => setReasonId(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }}>
                     <option value="">Select structured reason...</option>
                     {state.project?.exclusionReasons.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                   </select>
                </div>
              )}

              {resolutionAction && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Adjudication Note (optional)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }} />
                </div>
              )}

              <button 
                className="sr-btn sr-btn-primary" 
                style={{ width: '100%', padding: 12, fontSize: 15 }} 
                disabled={!resolutionAction || (resolutionAction === 'exclude' && !reasonId)}
                onClick={submitResolution}
              >
                Lock Final Decision
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
