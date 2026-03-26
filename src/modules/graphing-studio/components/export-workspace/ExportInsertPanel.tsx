import { useState } from 'react';
import type { RefObject } from 'react';
import html2canvas from 'html2canvas';

interface ExportInsertPanelProps {
  chartRef: RefObject<HTMLDivElement | null>;
  datasetName?: string;
}

/**
 * Utility to inject a pHYs chunk into a base64 PNG string so that image viewers
 * accurately read the physical DPI resolution instead of the 72 DPI default.
 */
function changeDpiDataUrl(base64Image: string, dpi: number): string {
  const dataParts = base64Image.split(',');
  if (dataParts.length !== 2) return base64Image;
  const mime = dataParts[0];
  if (mime !== 'data:image/png;base64') return base64Image;

  const bstr = atob(dataParts[1]);
  let offset = 8; // skip PNG signature

  // find IHDR chunk
  let ihdrLength = 0;
  while (offset < bstr.length) {
    const length = (bstr.charCodeAt(offset) << 24) | (bstr.charCodeAt(offset+1) << 16) | (bstr.charCodeAt(offset+2) << 8) | bstr.charCodeAt(offset+3);
    const type = bstr.substring(offset+4, offset+8);
    if (type === 'IHDR') {
      ihdrLength = length + 12; // length + type + data + crc
      break;
    }
    offset += length + 12;
  }
  
  if (ihdrLength === 0) return base64Image;

  const dpiToPpm = Math.round(dpi / 0.0254);
  const physChunk = new Uint8Array(21);
  const dataView = new DataView(physChunk.buffer);
  dataView.setUint32(0, 9); // length of data is 9
  // chunk type 'pHYs'
  physChunk[4] = 112; // p
  physChunk[5] = 72;  // H
  physChunk[6] = 89;  // Y
  physChunk[7] = 115; // s
  dataView.setUint32(8, dpiToPpm); // x
  dataView.setUint32(12, dpiToPpm); // y
  physChunk[16] = 1; // meter

  // crc32
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  let crc = 0xffffffff;
  for (let i = 4; i < 17; i++) {
    crc = crcTable[(crc ^ physChunk[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = crc ^ 0xffffffff;
  dataView.setUint32(17, crc);

  let physStr = '';
  for (let i = 0; i < 21; i++) {
    physStr += String.fromCharCode(physChunk[i]);
  }

  const insertPos = offset + ihdrLength;
  const newBstr = bstr.substring(0, insertPos) + physStr + bstr.substring(insertPos);
  
  return mime + ',' + btoa(newBstr);
}

export function ExportInsertPanel({ chartRef, datasetName }: ExportInsertPanelProps) {
  const [showSettings, setShowSettings] = useState<'png' | 'tiff' | null>(null);
  const [dpi, setDpi] = useState<number>(300);
  const [targetWidth, setTargetWidth] = useState<number>(89); 
  const [targetUnit, setTargetUnit] = useState<'mm' | 'px'>('mm');

  const executeRasterExport = async (format: 'png' | 'tiff') => {
    if (!chartRef.current) return;
    try {
      // Compute the exact pixels needed
      const currentScreenPx = chartRef.current.offsetWidth || 800;
      let pixelsNeeded = targetWidth;
      if (targetUnit === 'mm') {
        pixelsNeeded = (targetWidth / 25.4) * dpi;
      }
      const scale = pixelsNeeded / currentScreenPx;

      const canvas = await html2canvas(chartRef.current, { backgroundColor: 'white', scale });
      const rawDataUrl = canvas.toDataURL('image/png');
      const finalDataUrl = changeDpiDataUrl(rawDataUrl, dpi);

      await window.api.exportGraphingFigure(finalDataUrl, datasetName || 'Figure', format);
      setShowSettings(null);
    } catch (err) {
      console.error(`Export ${format} failed`, err);
    }
  };

  const handleExportPng = () => setShowSettings('png');
  const handleExportTiff = () => setShowSettings('tiff');

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

  if (showSettings) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{showSettings.toUpperCase()} Export Settings</h4>
        
        <div className="gs-form-group">
          <label className="gs-label">Resolution (DPI)</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[72, 150, 300, 600].map(val => (
              <button 
                key={val}
                className={`gs-btn gs-btn-sm ${dpi === val ? 'active' : ''}`}
                style={{ background: dpi === val ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: dpi === val ? '#fff' : 'inherit' }}
                onClick={() => setDpi(val)}
              >
                {val} DPI
              </button>
            ))}
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Custom:</span>
            <input type="number" className="gs-input" value={dpi} onChange={e => setDpi(Number(e.target.value) || 300)} style={{ width: '80px', padding: '4px' }} min="72" max="1200" />
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>DPI</span>
          </div>
        </div>

        <div className="gs-form-group">
          <label className="gs-label">Target Width</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="number" className="gs-input" value={targetWidth} onChange={e => setTargetWidth(Number(e.target.value) || 89)} style={{ width: '80px', padding: '4px' }} min="10" />
            <select className="gs-select" value={targetUnit} onChange={e => setTargetUnit(e.target.value as 'mm' | 'px')} style={{ width: '70px', padding: '4px' }}>
              <option value="mm">mm</option>
              <option value="px">px</option>
            </select>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
            Final Output Width: {targetUnit === 'mm' ? Math.round((targetWidth / 25.4) * dpi) : targetWidth} pixels
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button className="gs-btn" style={{ flex: 1 }} onClick={() => setShowSettings(null)}>Cancel</button>
          <button className="gs-btn" style={{ flex: 1, background: 'var(--color-accent-primary)', color: 'white' }} onClick={() => executeRasterExport(showSettings)}>Export Now</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="gs-export-grid">
        <div className="gs-export-option" onClick={handleExportPng}>
          <div className="gs-export-option-icon">🖼️</div>
          <div className="gs-export-option-label">PNG</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>High-res raster</div>
        </div>
        <div className="gs-export-option" onClick={handleExportTiff}>
          <div className="gs-export-option-icon">🖨️</div>
          <div className="gs-export-option-label">TIFF</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Print quality</div>
        </div>
        <div className="gs-export-option" onClick={handleExportSvg}>
          <div className="gs-export-option-icon">📐</div>
          <div className="gs-export-option-label">SVG</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Scalable vector</div>
        </div>
        <div className="gs-export-option" onClick={handleCopyToClipboard}>
          <div className="gs-export-option-icon">📋</div>
          <div className="gs-export-option-label">Clipboard</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Copy as raster</div>
        </div>
        <div className="gs-export-option" onClick={handleInsertIntoDocument}>
          <div className="gs-export-option-icon">📑</div>
          <div className="gs-export-option-label">Insert</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Add to manuscript</div>
        </div>
      </div>

      <div style={{ padding: '8px 0' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Size Presets (DPI Adjusts Width)</h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { label: 'Journal (89mm)', w: 89, unit: 'mm' as const },
            { label: 'Full Page (183mm)', w: 183, unit: 'mm' as const },
            { label: 'Poster (600px)', w: 600, unit: 'px' as const },
            { label: 'Thesis (150mm)', w: 150, unit: 'mm' as const },
          ].map(preset => (
            <button 
              key={preset.label} 
              className="gs-btn gs-btn-sm" 
              title={`Width: ${preset.w}${preset.unit}`}
              onClick={() => {
                setTargetWidth(preset.w);
                setTargetUnit(preset.unit);
                if (!showSettings) setShowSettings('png'); // auto-open settings for PNG if clicked and closed
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
