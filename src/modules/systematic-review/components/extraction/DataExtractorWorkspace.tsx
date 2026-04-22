import { useState, useEffect } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import { TemplateBuilder, type ExtractorField } from './TemplateBuilder';
import type { ExtractionTemplate } from '../../../../types/electron';

export function DataExtractorWorkspace() {
  const { state } = useSystematicReview();
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<ExtractionTemplate | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  
  // Data State
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter to included records
  const includedRecords = state.records.filter(r => r.userLabels?.includes('Included') || r.finalDisposition === 'included' || true); // Default all for testing if none marked included

  useEffect(() => {
    loadTemplates();

    const handleSelectRecord = (e: Event) => {
      const recordId = (e as CustomEvent).detail?.recordId;
      if (recordId) setSelectedRefId(recordId);
    };
    window.addEventListener('sr:select-record', handleSelectRecord);
    return () => window.removeEventListener('sr:select-record', handleSelectRecord);
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await window.api.getExtractionTemplates();
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    } catch (e) {
      console.error("Failed to load templates", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExtractedData = async (refId: string, templateId: string) => {
    try {
      const res = await window.api.getExtractedDataPoints(refId);
      if (res.success && res.data) {
        const point = res.data.find(d => d.template_id === templateId);
        if (point) {
          setExtractedData(JSON.parse(point.data_json));
        } else {
          setExtractedData({});
        }
      }
    } catch (e) {
      console.error("Failed to load extracted data", e);
    }
  };

  useEffect(() => {
    if (selectedRefId && activeTemplate) {
      loadExtractedData(selectedRefId, activeTemplate.id);
    }
  }, [selectedRefId, activeTemplate]);

  const handleSaveTemplate = async (templateData: { name: string, fields: ExtractorField[] }) => {
    try {
      const dbPayload = {
        name: templateData.name,
        fields_json: JSON.stringify(templateData.fields)
      };
      const res = await window.api.createExtractionTemplate(dbPayload);
      if (res.success && res.data) {
        setTemplates(prev => {
          const newArr = prev.filter(t => t.id !== res.data!.id);
          return [...newArr, res.data!];
        });
        setIsBuilding(false);
        setActiveTemplate(res.data);
      }
    } catch (e) {
      console.error("Failed to save template", e);
    }
  };

  const handleDeleteTemplate = async (tId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await window.api.deleteExtractionTemplate(tId);
      setTemplates(templates.filter(t => t.id !== tId));
      if (activeTemplate?.id === tId) setActiveTemplate(null);
    } catch (e) {
      console.error("Failed to delete template", e);
    }
  };

  const handleSaveData = async () => {
    if (!selectedRefId || !activeTemplate) return;
    try {
      const res = await window.api.saveExtractedDataPoint({
        ref_id: selectedRefId,
        reviewer_id: state.activeReviewer?.id || null,
        template_id: activeTemplate.id,
        data_json: JSON.stringify(extractedData)
      });
      if (res.success) {
        alert('Data saved successfully!');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save data');
    }
  };

  const activeRecord = includedRecords.find(r => r.id === selectedRefId);
  const pdfPath = activeRecord?.pdfPath;

  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    let currentBlobUrl: string | null = null;
    setPdfError(null);

    if (pdfPath) {
      if (pdfPath.startsWith('blob:')) {
        // In-session blob URL (browser fallback)
        setPdfDataUrl(pdfPath);
      } else if (window.api?.readFileBase64) {
        window.api.readFileBase64(pdfPath).then((res: any) => {
          if (res.success && res.base64) {
            try {
              const byteCharacters = atob(res.base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              currentBlobUrl = URL.createObjectURL(blob);
              setPdfDataUrl(currentBlobUrl);
            } catch (e) {
              console.error('Failed to parse PDF binary blob:', e);
              setPdfDataUrl(null);
              setPdfError('Failed to decode PDF file.');
            }
          } else {
            console.error('readFileBase64 failed:', res.error);
            setPdfDataUrl(null);
            setPdfError('Could not read PDF file. It may have been moved or deleted.');
          }
        }).catch((err: any) => {
          console.error('Failed invoking readFileBase64:', err);
          setPdfDataUrl(null);
          setPdfError('Failed to load PDF file.');
        });
      } else {
        setPdfDataUrl(null);
      }
    } else {
      setPdfDataUrl(null);
    }

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [pdfPath]);

  if (isLoading) return <div>Loading extraction engine...</div>;

  if (isBuilding) {
    return <TemplateBuilder onSave={handleSaveTemplate} onCancel={() => setIsBuilding(false)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Banner for Template Selection */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: 'var(--bg-panel)', padding: '10px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <h4 style={{ margin: 0 }}>Data Extractor</h4>
        <select 
          value={activeTemplate?.id || ''} 
          onChange={e => setActiveTemplate(templates.find(t => t.id === e.target.value) || null)}
          className="sr-input"
          style={{ minWidth: '200px' }}
        >
          <option value="">-- Select Template --</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="sr-btn" onClick={() => setIsBuilding(true)}>+ New Template</button>
        {activeTemplate && (
           <button className="sr-btn sr-btn-danger" onClick={() => handleDeleteTemplate(activeTemplate.id)}>Delete Template</button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left pane: Reference List */}
        <div style={{ width: '300px', backgroundColor: 'var(--bg-panel)', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
          <div style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
            STUDIES TO EXTRACT ({includedRecords.length})
          </div>
          {includedRecords.map(r => (
            <div 
              key={r.id}
              onClick={() => setSelectedRefId(r.id)}
              style={{
                padding: '12px 15px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                backgroundColor: selectedRefId === r.id ? 'var(--bg-active)' : 'transparent',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)' }}>{r.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>{r.authors} • {r.year}</div>
            </div>
          ))}
        </div>

        {/* Center pane: High-fidelity PDF Viewer */}
        <div style={{ flex: 1, backgroundColor: '#f0f0f0', position: 'relative' }}>
          {pdfDataUrl ? (
            <iframe src={pdfDataUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Full Text PDF" />
          ) : pdfError ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#cf1322', flexDirection: 'column', gap: 8, padding: 24, textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>⚠️</span>
              <span style={{ fontWeight: 'bold' }}>{pdfError}</span>
              <span style={{ fontSize: 12, color: '#888' }}>Try re-attaching the PDF in the Full Text Manager tab.</span>
            </div>
          ) : pdfPath ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 48 }}>⏳</span>
              <span>Loading PDF...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 48 }}>📄</span>
              <span>{selectedRefId ? 'No PDF attached to this record.' : 'Select a study to view its PDF.'}</span>
              {selectedRefId && <span style={{ fontSize: 12, color: '#aaa' }}>Attach PDFs in the Full Text Manager tab first.</span>}
            </div>
          )}
        </div>

        {/* Right pane: Dynamic Extraction Form */}
        <div style={{ width: '350px', backgroundColor: 'var(--bg-panel)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Extraction Form</h3>
          </div>
          
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {!activeTemplate ? (
              <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: '40px' }}>
                Please select or create an extraction template.
              </div>
            ) : !selectedRefId ? (
              <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: '40px' }}>
                Please select a reference from the list.
              </div>
            ) : (
              // Form Renderer
              <>
                {(() => {
                  let fields: ExtractorField[] = [];
                  try { fields = JSON.parse(activeTemplate.fields_json); } catch (e) {}
                  
                  return fields.map(f => (
                    <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        {f.name} {f.required && <span style={{color: 'red'}}>*</span>}
                      </label>
                      {f.type === 'text' && (
                        <input className="sr-input" type="text" value={extractedData[f.id] || ''} onChange={e => setExtractedData({...extractedData, [f.id]: e.target.value})} />
                      )}
                      {f.type === 'number' && (
                        <input className="sr-input" type="number" value={extractedData[f.id] || ''} onChange={e => setExtractedData({...extractedData, [f.id]: Number(e.target.value)})} />
                      )}
                      {f.type === 'boolean' && (
                        <select className="sr-input" value={extractedData[f.id] !== undefined ? String(extractedData[f.id]) : ''} onChange={e => setExtractedData({...extractedData, [f.id]: e.target.value === 'true'})}>
                          <option value="">-</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      )}
                      {f.type === 'select' && (
                        <select className="sr-input" value={extractedData[f.id] || ''} onChange={e => setExtractedData({...extractedData, [f.id]: e.target.value})}>
                          <option value="">-</option>
                          {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {f.type === 'textarea' && (
                        <textarea className="sr-input" rows={4} value={extractedData[f.id] || ''} onChange={e => setExtractedData({...extractedData, [f.id]: e.target.value})} />
                      )}
                    </div>
                  ));
                })()}
                <div style={{ marginTop: '20px' }}>
                  <button className="sr-btn sr-btn-primary" style={{ width: '100%' }} onClick={handleSaveData}>
                    Save Data for {activeRecord?.authors || 'this record'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
