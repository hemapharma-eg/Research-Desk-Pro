import { useState, useEffect } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import type { ScreeningDecision } from '../../types/ReviewModels';

export function FullTextScreeningWorkspace() {
  const { state, dispatch, logEvent } = useSystematicReview();

  // Queue of records that have PDFs attached and need screening
  const queue = state.records.filter(r => r.stage === 'full-text-screening' && r.pdfAttached && !r.fullTextDecisions[state.activeReviewer?.id || '']);

  const [activeRecordId, setActiveRecordId] = useState<string | null>(queue.length > 0 ? queue[0].id : null);
  const activeRecord = state.records.find(r => r.id === activeRecordId) || queue[0];

  const fullTextReasons = state.project?.exclusionReasons.filter(r => r.type !== 'title-abstract') || [];

  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  useEffect(() => {
    let currentBlobUrl: string | null = null;
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;
    setPdfLoadError(null);

    if (activeRecord?.pdfPath) {
      // Set a timeout to show an error if loading takes too long
      loadingTimeout = setTimeout(() => {
        if (!pdfDataUrl) {
          setPdfLoadError('PDF loading timed out. The file may be very large or inaccessible.');
        }
      }, 10000);

      if (activeRecord.pdfPath.startsWith('blob:')) {
        setPdfDataUrl(activeRecord.pdfPath);
      } else if (window.api?.resolvePdfPath) {
        // Resolve the stored path (relative or legacy absolute) to an absolute path on this machine
        window.api.resolvePdfPath(activeRecord.pdfPath).then((resolveRes: any) => {
          if (!resolveRes.success || !resolveRes.resolvedPath) {
            console.error('PDF path resolution failed:', resolveRes.error);
            setPdfDataUrl(null);
            setPdfLoadError('Could not find the PDF file. It may have been moved or deleted.');
            return;
          }

          const absolutePath = resolveRes.resolvedPath;

          // Auto-migrate legacy absolute paths to relative format
          if (resolveRes.migratedRelativePath && activeRecord.pdfPath !== resolveRes.migratedRelativePath) {
            dispatch({
              type: 'UPDATE_RECORD',
              payload: { id: activeRecord.id, updates: { pdfPath: resolveRes.migratedRelativePath } }
            });
          }

          window.api.readFileBase64(absolutePath).then((res: any) => {
            if (res.success && res.base64) {
              fetch(`data:application/pdf;base64,${res.base64}`)
                .then(response => response.blob())
                .then(blob => {
                  currentBlobUrl = URL.createObjectURL(blob);
                  setPdfDataUrl(currentBlobUrl);
                })
                .catch(e => {
                  console.error('Failed to parse PDF binary blob:', e);
                  setPdfDataUrl(null);
                  setPdfLoadError('Failed to decode the PDF file.');
                });
            } else {
              console.error(res.error);
              setPdfDataUrl(null);
              setPdfLoadError('Could not read PDF file. It may have been moved or deleted.');
            }
          }).catch((err: any) => {
            console.error('Failed invoking readFileBase64:', err);
            setPdfDataUrl(null);
            setPdfLoadError('Failed to load the PDF file.');
          });
        }).catch((err: any) => {
          console.error('Failed invoking resolvePdfPath:', err);
          setPdfDataUrl(null);
          setPdfLoadError('Failed to resolve the PDF file path.');
        });
      } else {
        setPdfDataUrl(null);
      }
    } else {
      setPdfDataUrl(null);
    }

    return () => {
      // Cleanup to prevent memory leaks from heavy PDF blobs
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [activeRecord?.pdfPath]);

  const recordDecision = (decision: ScreeningDecision, finalReasonId?: string) => {
    if (!activeRecord || !state.activeReviewer) return;

    if (decision === 'exclude' && !finalReasonId && fullTextReasons.length > 0) {
      alert('Please select an exclusion reason for Full-Text exclusion.');
      return;
    }

    const updatedRecord = { ...activeRecord };
    
    // Save decision
    updatedRecord.fullTextDecisions = {
      ...updatedRecord.fullTextDecisions,
      [state.activeReviewer.id]: {
        reviewerId: state.activeReviewer.id,
        decision,
        reasonId: finalReasonId,
        note: note.trim() || undefined,
        timestamp: new Date().toISOString()
      }
    };

    // Auto-resolve stage for single reviewer mode
    if (state.project?.settings.screeningMode === 'single') {
      if (decision === 'include') {
        updatedRecord.stage = 'included';
        updatedRecord.finalDisposition = 'included';
      } else if (decision === 'exclude') {
        updatedRecord.stage = 'excluded';
        updatedRecord.finalDisposition = 'excluded';
        updatedRecord.finalReasonId = finalReasonId;
      } else {
        updatedRecord.finalDisposition = 'maybe';
        updatedRecord.stage = 'conflict-resolution';
      }
    }

    dispatch({ type: 'UPDATE_RECORD', payload: { id: activeRecord.id, updates: updatedRecord } });
    logEvent('screening_decision', 'full-text-screening', activeRecord.id, `Full-Text ${decision.toUpperCase()}`);
    
    setNote('');
    setSelectedReasonId('');

    // Move to next in queue automatically
    const nextIdx = queue.findIndex(r => r.id === activeRecord.id) + 1;
    if (nextIdx < queue.length) {
      setActiveRecordId(queue[nextIdx].id);
    } else if (queue.length > 1) {
      setActiveRecordId(queue[0].id);
    } else {
      setActiveRecordId(null);
    }
  };

  if (!activeRecord) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Queue is empty. Attach PDFs in the Full-Text Manager first.</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      
      {/* Center PDF Viewer (Expanded) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border-light)', background: '#525659' }}>
        <div style={{ padding: '8px 16px', background: '#323639', color: '#f1f1f1', fontSize: 13, borderBottom: '1px solid #1f2224', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{activeRecord.pdfPath ? activeRecord.pdfPath.split(/[\/\\]/).pop() : 'Viewing Attached PDF'}</span>
          <span style={{ opacity: 0.7 }}>File ID: {activeRecord.id.split('-')[0]}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', background: '#e0e0e0' }}>
          {pdfDataUrl ? (
            <iframe 
              src={pdfDataUrl} 
              style={{ width: '100%', height: '100%', border: 'none' }} 
              title="PDF Viewer" 
            />
          ) : pdfLoadError ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cf1322', flexDirection: 'column', gap: 16, padding: 32, textAlign: 'center' }}>
               <span style={{ fontSize: 48 }}>⚠️</span>
               <span style={{ fontWeight: 'bold' }}>{pdfLoadError}</span>
               <span style={{ fontSize: 13, color: '#888' }}>Please go back to the Full Text Manager tab and re-attach the file, or check your internet connection if the file is stored remotely.</span>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexDirection: 'column' }}>
               <span style={{ fontSize: 48, marginBottom: 16 }}>{activeRecord?.pdfPath ? '⏳' : '📄'}</span>
               <span>{activeRecord?.pdfPath ? 'Loading PDF...' : 'No PDF file attached to this record.'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Decision Panel */}
      <div style={{ width: 400, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
        
        {/* Navigation Toolbar (Sticky) */}
        <div style={{ padding: '12px 24px', flexShrink: 0, borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-subtle)' }}>
          <button 
            className="sr-btn" 
            onClick={() => {
              const prevIdx = queue.findIndex(r => r.id === activeRecord.id) - 1;
              if (prevIdx >= 0) setActiveRecordId(queue[prevIdx].id);
              else setActiveRecordId(queue[queue.length - 1].id);
            }}
          >
            &lt; Previous
          </button>
          <span style={{ fontSize: 13, fontWeight: 'bold' }}>Record {queue.findIndex(r => r.id === activeRecord.id) + 1} of {queue.length}</span>
          <button 
            className="sr-btn"
            onClick={() => {
              const nextIdx = queue.findIndex(r => r.id === activeRecord.id) + 1;
              if (nextIdx < queue.length) setActiveRecordId(queue[nextIdx].id);
              else setActiveRecordId(queue[0].id);
            }}
          >
            Next &gt;
          </button>
        </div>
        
        {/* Scrollable Decision Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* Record Metadata Summary */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
            <h2 style={{ fontSize: 18, margin: '0 0 12px 0', lineHeight: 1.3 }}>{activeRecord.title}</h2>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{activeRecord.authors} ({activeRecord.year})</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>{activeRecord.journal}</div>
          </div>

          {/* TiAb Decisions Insight */}
          <div style={{ padding: '16px 24px', background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-light)' }}>
            <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Title/Abstract History</strong>
            {Object.values(activeRecord.titleAbstractDecisions).map((d, i) => (
              <div key={i} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{state.project?.reviewers.find(x => x.id === d.reviewerId)?.name || 'Reviewer'}</span>
                <span style={{ 
                  background: d.decision === 'include' ? '#e6f7ff' : '#fff1f0', 
                  color: d.decision === 'include' ? '#1890ff' : '#f5222d', 
                  padding: '2px 6px', borderRadius: 4, fontSize: 11, border: '1px solid currentColor' 
                }}>
                  {d.decision.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Criteria Summary (Helper) */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
            <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Eligibility Pointers</strong>
            <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {state.project?.inclusionCriteria.slice(0, 3).map((c, i) => <li key={`inc-${i}`} style={{ color: '#389e0d' }}>{c}</li>)}
              {state.project?.exclusionCriteria.slice(0, 3).map((c, i) => <li key={`exc-${i}`} style={{ color: '#cf1322' }}>{c}</li>)}
            </ul>
          </div>

          {/* Action Panel */}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Full Text Decision</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <button 
                className="sr-btn sr-btn-primary" 
                style={{ background: '#52c41a', color: 'white', height: 44, fontSize: 15 }}
                onClick={() => recordDecision('include')}
              >
                Final Include
              </button>
              <button 
                className="sr-btn" 
                style={{ background: '#faad14', color: 'white', border: 'none', height: 40 }}
                onClick={() => recordDecision('maybe')}
              >
                Needs Discussion (Maybe)
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 24 }}>
              <strong style={{ display: 'block', marginBottom: 8, color: '#f5222d' }}>Exclude Article</strong>
              
              <select 
                value={selectedReasonId}
                onChange={(e) => setSelectedReasonId(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)', marginBottom: 12 }}
              >
                <option value="">Select structured reason...</option>
                {fullTextReasons.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>

              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Exclusion notes / Required info..."
                rows={3}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)', marginBottom: 16 }}
              />

              <button 
                className="sr-btn" 
                style={{ width: '100%', background: '#fff1f0', color: '#cf1322', borderColor: '#ffa39e', height: 44, fontWeight: 'bold' }}
                onClick={() => recordDecision('exclude', selectedReasonId)}
                disabled={!selectedReasonId}
              >
                Final Exclude
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
