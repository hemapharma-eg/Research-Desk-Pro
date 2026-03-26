import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import { computeSmartMetadata } from '../../utils/SmartAssistanceLayer';
import type { ReviewRecord, ScreeningDecision } from '../../types/ReviewModels';

export function TitleAbstractScreening() {
  const { state, dispatch, logEvent } = useSystematicReview();
  
  // Create a queue prioritizing unscreened records, but hiding duplicates unless selected natively
  const queue = useMemo(() => {
    return state.records
      .filter(r => r.stage === 'title-abstract-screening' && r.dedupStatus !== 'duplicate')
      // Map smart hints dynamically
      .map(r => ({ ...r, ...computeSmartMetadata(r, state.project) }))
      // Sort: Unscreened first, then by relevance score descending
      .sort((a, b) => {
        const aScreened = !!a.titleAbstractDecisions[state.activeReviewer?.id || ''];
        const bScreened = !!b.titleAbstractDecisions[state.activeReviewer?.id || ''];
        if (aScreened && !bScreened) return 1;
        if (!aScreened && bScreened) return -1;
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      });
  }, [state.records, state.project, state.activeReviewer]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const activeRecord = queue[currentIndex];

  const recordDecision = useCallback((decision: ScreeningDecision, reasonId?: string) => {
    if (!activeRecord || !state.activeReviewer) return;

    const updatedRecord = { ...activeRecord };
    
    // Save decision
    updatedRecord.titleAbstractDecisions = {
      ...updatedRecord.titleAbstractDecisions,
      [state.activeReviewer.id]: {
        reviewerId: state.activeReviewer.id,
        decision,
        reasonId,
        timestamp: new Date().toISOString()
      }
    };

    // If screening mode is single, automatically transition stage or resolve final disposition
    if (state.project?.settings.screeningMode === 'single') {
      if (decision === 'include') {
        updatedRecord.stage = 'full-text-retrieval';
        updatedRecord.finalDisposition = 'pending';
      } else if (decision === 'exclude') {
        updatedRecord.stage = 'excluded';
        updatedRecord.finalDisposition = 'excluded';
        updatedRecord.finalReasonId = reasonId;
      } else {
        updatedRecord.finalDisposition = 'maybe';
      }
    }

    dispatch({ type: 'UPDATE_RECORD', payload: { id: activeRecord.id, updates: updatedRecord } });
    logEvent('screening_decision', 'title-abstract-screening', activeRecord.id, `TiAb ${decision.toUpperCase()}`);

    // Auto Advance
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(curr => curr + 1);
    }
  }, [activeRecord, state.activeReviewer, state.project, dispatch, logEvent, currentIndex, queue.length]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in a text area or input
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) return;

      switch(e.key.toLowerCase()) {
        case 'i': recordDecision('include'); break;
        case 'e': recordDecision('exclude'); break;
        case 'm': recordDecision('maybe'); break;
        case 'n': if (currentIndex < queue.length - 1) setCurrentIndex(c => c + 1); break;
        case 'b': if (currentIndex > 0) setCurrentIndex(c => c - 1); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordDecision, currentIndex, queue.length]);

  const progress = `${currentIndex + 1} / ${queue.length}`;
  const unscreenedCount = queue.filter(r => !r.titleAbstractDecisions[state.activeReviewer?.id || '']).length;

  if (queue.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No records available for Title & Abstract screening. Ensure imports are complete.</div>;
  }

  const currentDecision = activeRecord?.titleAbstractDecisions[state.activeReviewer?.id || '']?.decision;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Top Banner indicating unscreened queue */}
      <div style={{ background: '#f0f5ff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d6e4ff', fontSize: 13 }}>
        <span><strong>{unscreenedCount}</strong> records awaiting your review.</span>
        <span>Relevance Score: <strong>{activeRecord?.relevanceScore || 0}</strong></span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Zone 1: Left Filter/Navigation Pane */}
        <div style={{ width: 250, borderRight: '1px solid var(--color-border-light)', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-subtle)' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--color-border-light)', fontWeight: 600 }}>Queue Navigation</div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {queue.map((r, i) => {
              const myDec = r.titleAbstractDecisions[state.activeReviewer?.id || '']?.decision;
              let dotColor = 'transparent';
              if (myDec === 'include') dotColor = '#52c41a';
              else if (myDec === 'exclude') dotColor = '#f5222d';
              else if (myDec === 'maybe') dotColor = '#faad14';

              return (
                <div 
                  key={r.id} 
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    padding: '8px 16px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    background: currentIndex === i ? 'var(--color-bg-hover)' : 'transparent',
                    borderLeft: currentIndex === i ? '3px solid var(--color-accent-primary)' : '3px solid transparent'
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, border: '1px solid var(--color-border-light)' }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: currentIndex === i ? 600 : 'normal' }}>
                    {r.title || 'Untitled Record'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone 2: Center Reading Pane */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'var(--color-bg-primary)' }}>
          {activeRecord && (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              
              {/* Intelligent Badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {activeRecord.likelyStudyDesign?.map(hint => (
                  <span key={hint} style={{ background: '#f9f0ff', color: '#722ed1', border: '1px solid #d3adf7', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold' }}>
                    🤖 Hint: {hint}
                  </span>
                ))}
                {activeRecord.flags?.map(flag => (
                  <span key={flag} style={{ background: '#fff1f0', color: '#f5222d', border: '1px solid #ffa39e', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold' }}>
                    🚨 {flag}
                  </span>
                ))}
              </div>

              <h1 style={{ fontSize: 24, margin: '0 0 12px 0', lineHeight: 1.3 }}>{activeRecord.title}</h1>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 15, marginBottom: 4 }}>
                <strong>{activeRecord.authors}</strong> ({activeRecord.year || 'Unknown Year'})
              </div>
              <div style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontSize: 14, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border-light)' }}>
                {activeRecord.journal} • {activeRecord.sourceDatabase} • DOI: {activeRecord.doi || 'N/A'}
              </div>

              {/* Abstract */}
              <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text-primary)' }}>
                {activeRecord.abstract ? (
                  activeRecord.abstract.split('\n').map((paragraph, i) => (
                    <p key={i} style={{ marginBottom: 16 }}>{paragraph}</p>
                  ))
                ) : (
                  <div style={{ fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>No abstract available.</div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Zone 3: Right Action Panel */}
        <div style={{ width: 280, borderLeft: '1px solid var(--color-border-light)', background: 'var(--color-bg-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Your Decision</h3>
            
            <button 
              className="sr-btn" 
              style={{ background: currentDecision === 'include' ? '#52c41a' : '#f6ffed', color: currentDecision === 'include' ? 'white' : '#389e0d', borderColor: '#b7eb8f', height: 48, fontSize: 15, fontWeight: 'bold' }}
              onClick={() => recordDecision('include')}
            >
              Include (I)
            </button>
            <button 
              className="sr-btn" 
              style={{ background: currentDecision === 'exclude' ? '#f5222d' : '#fff1f0', color: currentDecision === 'exclude' ? 'white' : '#cf1322', borderColor: '#ffa39e', height: 48, fontSize: 15, fontWeight: 'bold' }}
              onClick={() => recordDecision('exclude')}
            >
              Exclude (E)
            </button>
            <button 
              className="sr-btn" 
              style={{ background: currentDecision === 'maybe' ? '#faad14' : '#fffbe6', color: currentDecision === 'maybe' ? 'white' : '#d48806', borderColor: '#ffe58f', height: 48, fontSize: 15, fontWeight: 'bold' }}
              onClick={() => recordDecision('maybe')}
            >
              Maybe / Discuss (M)
            </button>

            {/* Exclusion Reasons */}
            <div style={{ marginTop: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: 'var(--color-text-secondary)' }}>Add Exclusion Reason</label>
              <select 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }}
                onChange={(e) => recordDecision('exclude', e.target.value)}
              >
                <option value="">Select reason...</option>
                {state.project?.exclusionReasons.filter(r => r.type !== 'full-text').map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            
          </div>
        </div>

      </div>

      {/* Zone 4: Bottom Information Strip */}
      <div style={{ background: '#2c3e50', color: '#ecf0f1', padding: '8px 24px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span><strong>Keys:</strong> <kbd>[I]</kbd> Include, <kbd>[E]</kbd> Exclude, <kbd>[M]</kbd> Maybe, <kbd>[N]</kbd> Next, <kbd>[B]</kbd> Back</span>
          {currentDecision && <span style={{ color: '#f1c40f' }}>Decision saved for this record.</span>}
        </div>
        <div>Progress: <strong>{progress}</strong></div>
      </div>

    </div>
  );
}
