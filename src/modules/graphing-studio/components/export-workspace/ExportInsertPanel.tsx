import type { RefObject } from 'react';
import html2canvas from 'html2canvas';

interface ExportInsertPanelProps {
  chartRef: RefObject<HTMLDivElement | null>;
  datasetName?: string;
}

export function ExportInsertPanel({ chartRef, datasetName }: ExportInsertPanelProps) {
  const handleExportPng = async () => {
    if (!chartRef.current) return;
    try {
      // Scale 4 creates a high-res ~300 DPI output from standard screen size
      const canvas = await html2canvas(chartRef.current, { backgroundColor: 'white', scale: 4 });
      const dataUrl = canvas.toDataURL('image/png');
      await window.api.exportGraphingFigure(dataUrl, datasetName || 'Figure', 'png');
    } catch (err) {
      console.error('Export PNG failed', err);
    }
  };

  const handleExportTiff = async () => {
    if (!chartRef.current) return;
    try {
      // Scale 4 creates a high-res ~300 DPI output
      const canvas = await html2canvas(chartRef.current, { backgroundColor: 'white', scale: 4 });
      const dataUrl = canvas.toDataURL('image/png'); 
      // Emits PNG data string but backend handles saving with .tiff extension
      // (some target apps accept PNG data if forced to .tiff, or we'd ideally transcode in main process)
      await window.api.exportGraphingFigure(dataUrl, datasetName || 'Figure', 'tiff');
    } catch (err) {
      console.error('Export TIFF failed', err);
    }
  };

  const handleExportSvg = async () => {
    if (!chartRef.current) return;
    const svgEl = chartRef.current.querySelector('svg');
    if (!svgEl) { alert('No SVG found in current graph.'); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await window.api.exportGraphingFigure(reader.result, datasetName || 'Figure', 'svg');
      }
    };
    reader.readAsDataURL(blob);
  };

  const handleCopyToClipboard = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: 'white', scale: 4 });
      canvas.toBlob(async blob => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          alert('Figure copied to clipboard!');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy to clipboard failed', err);
    }
  };

  const handleInsertIntoDocument = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: 'white', scale: 4 });
      const dataUrl = canvas.toDataURL('image/png');

      // Save as figure in project
      await window.api.createGraphingFigure({
        name: datasetName || 'Figure',
        graph_type: 'bar',
        thumbnail_dataurl: dataUrl,
      });

      // Dispatch event for the document editor to listen
      const event = new CustomEvent('insert-graph-object', {
        detail: { type: 'image', src: dataUrl, caption: datasetName || 'Figure' },
      });
      window.dispatchEvent(event);
      alert('Figure saved to project and sent to document editor.');
    } catch (err) {
      console.error('Insert failed', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="gs-export-grid">
        <div className="gs-export-option" onClick={handleExportPng}>
          <div className="gs-export-option-icon">🖼️</div>
          <div className="gs-export-option-label">PNG</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>High-res raster (300 DPI)</div>
        </div>
        <div className="gs-export-option" onClick={handleExportTiff}>
          <div className="gs-export-option-icon">🖨️</div>
          <div className="gs-export-option-label">TIFF</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Print quality format</div>
        </div>
        <div className="gs-export-option" onClick={handleExportSvg}>
          <div className="gs-export-option-icon">📐</div>
          <div className="gs-export-option-label">SVG</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Scalable vector</div>
        </div>
        <div className="gs-export-option" onClick={handleCopyToClipboard}>
          <div className="gs-export-option-icon">📋</div>
          <div className="gs-export-option-label">Clipboard</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Copy as image</div>
        </div>
        <div className="gs-export-option" onClick={handleInsertIntoDocument}>
          <div className="gs-export-option-icon">📑</div>
          <div className="gs-export-option-label">Insert</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Add to manuscript</div>
        </div>
      </div>

      <div style={{ padding: '8px 0' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Size Presets</h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { label: 'Journal (89mm)', w: 89 },
            { label: 'Full Page (183mm)', w: 183 },
            { label: 'Poster (600px)', w: 600 },
            { label: 'Thesis (150mm)', w: 150 },
          ].map(preset => (
            <button key={preset.label} className="gs-btn gs-btn-sm" title={`Width: ${preset.w}${typeof preset.w === 'number' && preset.w < 200 ? 'mm' : 'px'}`}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
