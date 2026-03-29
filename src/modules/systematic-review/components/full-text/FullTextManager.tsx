import { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import { UnpaywallSetupModal } from './UnpaywallSetupModal';

export function FullTextManager() {
  const { state, dispatch, logEvent } = useSystematicReview();
  
  const [showModal, setShowModal] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStats, setFetchStats] = useState<{success: number, failed: number} | null>(null);

  // Records that reached full text stage
  const ftQueue = state.records.filter(r => ['full-text-retrieval', 'full-text-screening'].includes(r.stage));

  const attachPdf = async (recordId: string) => {
    if (window.api?.openPdfDialog) {
      try {
        const resultPath = await window.api.openPdfDialog();
        if (typeof resultPath === 'string') {
          dispatch({ 
            type: 'UPDATE_RECORD', 
            payload: { 
              id: recordId, 
              updates: { 
                pdfAttached: true, 
                pdfPath: resultPath,
                stage: 'full-text-screening' 
              } 
            }
          });
          logEvent('pdf_attached', 'full-text-retrieval', recordId, `Attached PDF: ${resultPath}`);
        }
      } catch (e) {
        console.error("Error attaching PDF:", e);
        alert("Failed to attach PDF.");
      }
    } else {
      // Fallback for browser (using standard file input)
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const fakePath = URL.createObjectURL(file);
          dispatch({ 
            type: 'UPDATE_RECORD', 
            payload: { 
              id: recordId, 
              updates: { 
                pdfAttached: true, 
                pdfPath: fakePath, 
                stage: 'full-text-screening' 
              } 
            }
          });
          logEvent('pdf_attached', 'full-text-retrieval', recordId, `Attached PDF: ${file.name}`);
        }
      };
      input.click();
    }
  };

  const markMissing = (recordId: string) => {
    dispatch({ 
      type: 'UPDATE_RECORD', 
      payload: { 
        id: recordId, 
        updates: { 
          finalDisposition: 'excluded', 
          stage: 'excluded',
          // Assuming an ID exists or we manually assign a "Missing Full Text" reason
        } 
      }
    });
    logEvent('screening_decision', 'full-text-retrieval', recordId, 'Excluded due to missing full-text');
  };

  const handleBulkFetch = (email: string) => {
    setShowModal(false);
    setIsFetching(true);
    setFetchStats(null);
    
    // Only queue records that don't already have a PDF attached
    const queue = ftQueue.filter(r => !r.pdfAttached);
    
    window.api.autoFetchPDFs(queue, email).then((res) => {
      setIsFetching(false);
      if (res.success && res.results) {
        setFetchStats({ success: res.results.successCount, failed: res.results.failedCount });
        
        if (res.results.successCount > 0) {
           logEvent('pdf_attached', 'full-text-retrieval', undefined, `Auto-fetched ${res.results.successCount} PDFs via Unpaywall.`);
           
           res.results.successfulFetches?.forEach(f => {
             dispatch({ 
               type: 'UPDATE_RECORD', 
               payload: { 
                 id: f.id, 
                 updates: { pdfAttached: true, pdfPath: f.pdfPath, stage: 'full-text-screening' } 
               } 
             });
           });
        }
      } else {
        alert('Bulk fetch failed: ' + res.error);
      }
    });
  };

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto', position: 'relative' }}>
      {showModal && <UnpaywallSetupModal onCancel={() => setShowModal(false)} onComplete={handleBulkFetch} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0' }}>Full-Text Retrieval Manager</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Attach PDF files to records that passed Title & Abstract screening.
          </p>
        </div>
        
        <div>
          <button 
            className="sr-btn sr-btn-success" 
            onClick={() => setShowModal(true)}
            disabled={isFetching || ftQueue.filter(r => !r.pdfAttached).length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14 }}
          >
            {isFetching ? 'Fetching PDFs...' : `🚀 Auto-Fetch Missing PDFs (${ftQueue.filter(r => !r.pdfAttached).length})`}
          </button>
        </div>
      </div>
      
      {fetchStats && (
        <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>Auto-Fetch Complete:</strong> Successfully downloaded <strong>{fetchStats.success}</strong> PDFs. 
            <span style={{color: '#888', marginLeft: 10}}>Failed/Not Open Access: {fetchStats.failed}</span>
          </div>
          <button className="sr-btn" onClick={() => window.location.reload()} style={{ padding: '4px 8px' }}>↻ Refresh List</button>
        </div>
      )}

      <div className="sr-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: 'var(--color-bg-subtle)' }}>
            <tr>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left' }}>Citation</th>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 150 }}>Source/DOI</th>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 120 }}>Status</th>
              <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'center', width: 250 }}>PDF Actions</th>
            </tr>
          </thead>
          <tbody>
            {ftQueue.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No records pending full-text retrieval.</td></tr>
            ) : (
              ftQueue.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-accent-primary)', marginBottom: 4 }}>{r.title}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{r.authors} ({r.year}) - <em>{r.journal}</em></div>
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    <div>{r.sourceDatabase}</div>
                    <div>{r.doi}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    {r.pdfAttached ? (
                      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✓ Attached</span>
                    ) : (
                      <span style={{ color: '#faad14', fontWeight: 'bold' }}>Pending File</span>
                    )}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button 
                        className="sr-btn sr-btn-primary" 
                        onClick={() => attachPdf(r.id)}
                      >
                        {r.pdfAttached ? 'Update PDF' : 'Upload PDF'}
                      </button>
                      <button 
                        className="sr-btn" 
                        onClick={() => markMissing(r.id)}
                        style={{ color: '#f5222d', borderColor: '#ffa39e' }}
                      >
                        Mark Missing
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
