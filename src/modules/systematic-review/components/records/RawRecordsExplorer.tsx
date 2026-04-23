import React, { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import type { ReviewRecord } from '../../types/ReviewModels';

export function RawRecordsExplorer() {
  const { state, dispatch } = useSystematicReview();
  const [selectedRecord, setSelectedRecord] = useState<ReviewRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ReviewRecord>>({});

  const handleAttachPdf = async () => {
    if (!selectedRecord || !window.api?.openPdfDialog) return;
    try {
      const resultPath = await window.api.openPdfDialog();
      if (resultPath && window.api.copyPdfToProject) {
        const copyRes = await window.api.copyPdfToProject(resultPath);
        if (copyRes.success && copyRes.newPath) {
          dispatch({ 
            type: 'UPDATE_RECORD', 
            payload: { 
              id: selectedRecord.id, 
              updates: { pdfAttached: true, pdfPath: copyRes.newPath } 
            } 
          });
          setSelectedRecord(prev => prev ? { ...prev, pdfAttached: true, pdfPath: copyRes.newPath } : null);
        } else {
          alert('Failed to copy PDF to project directory.');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to attach PDF.');
    }
  };

  const startEdit = () => {
    if (!selectedRecord) return;
    setEditForm({
      title: selectedRecord.title,
      authors: selectedRecord.authors,
      year: selectedRecord.year,
      journal: selectedRecord.journal,
      abstract: selectedRecord.abstract,
      doi: selectedRecord.doi,
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!selectedRecord) return;
    dispatch({
      type: 'UPDATE_RECORD',
      payload: { id: selectedRecord.id, updates: editForm }
    });
    setSelectedRecord({ ...selectedRecord, ...editForm } as ReviewRecord);
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      
      {/* Table Area */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Raw Records Explorer</h2>
        
        <div className="sr-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
              <thead style={{ background: 'var(--color-bg-subtle)' }}>
                <tr>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 60 }}>ID</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 120 }}>Authors</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 80 }}>Year</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 120 }}>Journal</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left', width: 100 }}>Source</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'center', width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.records.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No records imported yet.</td></tr>
                ) : (
                  state.records.map(r => (
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedRecord(r)}
                      style={{ 
                        borderBottom: '1px solid var(--color-border-light)', 
                        background: selectedRecord?.id === r.id ? 'var(--color-bg-hover)' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: 'var(--color-text-tertiary)' }}>...{r.id.split('-')[0]}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--color-accent-primary)' }}>{r.title}</td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{r.authors}</td>
                      <td style={{ padding: '8px 12px' }}>{r.year || '-'}</td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{r.journal}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: 'var(--color-bg-subtle)', padding: '2px 6px', borderRadius: 4, fontSize: 11, border: '1px solid var(--color-border-light)' }}>
                          {r.sourceDatabase}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button className="sr-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); setIsEditing(false); }}>Details</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Detail Sidebar */}
      {selectedRecord && (
        <div style={{ width: 400, borderLeft: '1px solid var(--color-border-light)', background: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Record Details</h3>
            <button className="sr-btn" style={{ border: 'none', padding: 4 }} onClick={() => setSelectedRecord(null)}>✕</button>
          </div>
          
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', fontSize: 13, lineHeight: 1.5 }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold' }}>Title</label>
                <input className="sr-input" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                
                <label style={{ fontWeight: 'bold' }}>Authors</label>
                <input className="sr-input" value={editForm.authors || ''} onChange={e => setEditForm({...editForm, authors: e.target.value})} />
                
                <label style={{ fontWeight: 'bold' }}>Year</label>
                <input className="sr-input" value={editForm.year || ''} onChange={e => setEditForm({...editForm, year: e.target.value})} />
                
                <label style={{ fontWeight: 'bold' }}>Journal</label>
                <input className="sr-input" value={editForm.journal || ''} onChange={e => setEditForm({...editForm, journal: e.target.value})} />
                
                <label style={{ fontWeight: 'bold' }}>DOI</label>
                <input className="sr-input" value={editForm.doi || ''} onChange={e => setEditForm({...editForm, doi: e.target.value})} />
                
                <label style={{ fontWeight: 'bold' }}>Abstract</label>
                <textarea className="sr-input" rows={6} value={editForm.abstract || ''} onChange={e => setEditForm({...editForm, abstract: e.target.value})} />
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <strong style={{ display: 'block', fontSize: 15, marginBottom: 8, color: 'var(--color-accent-primary)' }}>{selectedRecord.title}</strong>
                <div style={{ color: 'var(--color-text-secondary)' }}>{selectedRecord.authors} ({selectedRecord.year})</div>
                <div style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{selectedRecord.journal}</div>
              </div>
            )}

            {!isEditing && (
              <div style={{ marginBottom: 16 }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>Abstract</strong>
                <div style={{ background: 'var(--color-bg-subtle)', padding: 12, borderRadius: 6, border: '1px solid var(--color-border-light)' }}>
                  {selectedRecord.abstract || <span style={{ color: '#999', fontStyle: 'italic' }}>No abstract available</span>}
                </div>
              </div>
            )}

            <table style={{ width: '100%', marginBottom: 16, borderSpacing: '0 8px' }}>
              <tbody>
                {!isEditing && <tr><td style={{ width: 100, color: 'var(--color-text-tertiary)' }}>DOI</td><td>{selectedRecord.doi || '-'}</td></tr>}
                <tr><td style={{ width: 100, color: 'var(--color-text-tertiary)' }}>PMID</td><td>{selectedRecord.pmid || '-'}</td></tr>
                <tr><td style={{ color: 'var(--color-text-tertiary)' }}>Source</td><td>{selectedRecord.sourceDatabase}</td></tr>
                <tr><td style={{ color: 'var(--color-text-tertiary)' }}>Batch</td><td>{selectedRecord.sourceBatch}</td></tr>
                <tr><td style={{ color: 'var(--color-text-tertiary)' }}>Language</td><td>{selectedRecord.language}</td></tr>
                <tr><td style={{ color: 'var(--color-text-tertiary)' }}>Pub Type</td><td>{selectedRecord.publicationType}</td></tr>
              </tbody>
            </table>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 16, marginTop: 16 }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Workflow Status</strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: 12, background: '#f0f5ff', color: '#1890ff', border: '1px solid #adc6ff' }}>Stage: {selectedRecord.stage}</span>
                <span style={{ padding: '2px 8px', borderRadius: 12, background: '#fcffe6', color: '#a0d911', border: '1px solid #eaff8f' }}>Dedup: {selectedRecord.dedupStatus}</span>
                {selectedRecord.pdfAttached && <span style={{ padding: '2px 8px', borderRadius: 12, background: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f' }}>PDF Attached</span>}
              </div>
            </div>
            
            {(selectedRecord.keywords.length > 0 || selectedRecord.meshTerms.length > 0) && (
              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 16, marginTop: 16 }}>
                 <strong style={{ display: 'block', marginBottom: 8 }}>Keywords & MeSH</strong>
                 <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                   {selectedRecord.keywords.map((k, i) => <span key={`k-${i}`} style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, border: '1px solid #e8e8e8' }}>{k}</span>)}
                   {selectedRecord.meshTerms.map((m, i) => <span key={`m-${i}`} style={{ background: '#fff0f6', padding: '2px 6px', borderRadius: 4, border: '1px solid #ffadd2' }}>{m}</span>)}
                 </div>
              </div>
            )}
            
          </div>
          
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-light)', background: 'var(--color-bg-subtle)', display: 'flex', gap: 12 }}>
            {isEditing ? (
              <>
                <button className="sr-btn sr-btn-primary" style={{ flex: 1, background: '#52c41a', borderColor: '#52c41a' }} onClick={saveEdit}>Save</button>
                <button className="sr-btn" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="sr-btn sr-btn-primary" style={{ flex: 1 }} onClick={startEdit}>Edit Metadata</button>
                <button className="sr-btn" style={{ flex: 1 }} onClick={handleAttachPdf}>Attach PDF</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
