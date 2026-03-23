import { useState } from 'react';
import html2canvas from 'html2canvas';

interface ExportInsertPanelProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  datasetName: string;
}

export function ExportInsertPanel({ chartRef, datasetName }: ExportInsertPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 3, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `${datasetName.replace(/\\s+/g, '_')}_Figure.png`;
      a.click();
    } catch (e) {
      console.error("Export Failed", e);
      alert("Failed to export figure.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleInsertManuscript = async () => {
    // Requires communication with document-editor via Electron IPC, Custom Event, or Context
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      // Dispatch a custom global event that the document-editor or app framework can listen to
      const event = new CustomEvent('insert-graph-object', {
        detail: {
          image: imgData,
          caption: `Figure generated from ${datasetName}`,
          sourceDataset: datasetName
        }
      });
      document.dispatchEvent(event);
      alert("Successfully inserted into Manuscript Editor!");
    } catch {
      alert("Failed to insert.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Export & Manuscript Studio</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleExportPNG} 
          disabled={isExporting}
          style={{ flex: 1, padding: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', color: '#0F172A', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
        >
          {isExporting ? 'Processing...' : 'Download PNG (High-Res)'}
        </button>
        <button 
          onClick={handleInsertManuscript} 
          disabled={isExporting}
          style={{ flex: 1, padding: '8px', background: '#3B82F6', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
        >
          Insert ➞ Manuscript
        </button>
      </div>
    </div>
  );
}
