import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useLicense } from '../../../../modules/licensing/LicenseContext';
import { DemoLimitDialog } from '../../../../modules/licensing/components/DemoLimitDialog';

type Figure = {
  id: string;
  name: string;
  graph_type: string;
  thumbnail_dataurl: string | null;
  created_at: string;
};

type LayoutType = '1x2' | '2x1' | '2x2' | '1x3' | '3x1';
type CanvasOrientation = 'landscape' | 'portrait';

/**
 * Auto-trim whitespace from a canvas by scanning edge pixels.
 */
function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  
  let top = 0, bottom = height - 1, left = 0, right = width - 1;
  const threshold = 250; // near-white threshold
  
  const isWhitePixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    return data[idx] >= threshold && data[idx + 1] >= threshold && data[idx + 2] >= threshold;
  };
  
  // Find top
  topLoop: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isWhitePixel(x, y)) { top = y; break topLoop; }
    }
  }
  // Find bottom
  bottomLoop: for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (!isWhitePixel(x, y)) { bottom = y; break bottomLoop; }
    }
  }
  // Find left
  leftLoop: for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!isWhitePixel(x, y)) { left = x; break leftLoop; }
    }
  }
  // Find right
  rightLoop: for (let x = width - 1; x >= 0; x--) {
    for (let y = 0; y < height; y++) {
      if (!isWhitePixel(x, y)) { right = x; break rightLoop; }
    }
  }
  
  // Add small padding (8px)
  const pad = 8;
  const trimLeft = Math.max(0, left - pad);
  const trimTop = Math.max(0, top - pad);
  const trimRight = Math.min(width - 1, right + pad);
  const trimBottom = Math.min(height - 1, bottom + pad);
  const trimW = trimRight - trimLeft + 1;
  const trimH = trimBottom - trimTop + 1;
  
  if (trimW <= 0 || trimH <= 0 || (trimW >= width && trimH >= height)) return canvas;
  
  const trimmed = document.createElement('canvas');
  trimmed.width = trimW;
  trimmed.height = trimH;
  const tCtx = trimmed.getContext('2d');
  if (!tCtx) return canvas;
  tCtx.drawImage(canvas, trimLeft, trimTop, trimW, trimH, 0, 0, trimW, trimH);
  return trimmed;
}

/**
 * Utility to inject a pHYs chunk into a base64 PNG string for DPI metadata
 */
function changeDpiDataUrl(base64Image: string, dpi: number): string {
  const dataParts = base64Image.split(',');
  if (dataParts.length !== 2) return base64Image;
  const mime = dataParts[0];
  if (mime !== 'data:image/png;base64') return base64Image;

  const bstr = atob(dataParts[1]);
  let offset = 8;
  let ihdrLength = 0;
  while (offset < bstr.length) {
    const length = (bstr.charCodeAt(offset) << 24) | (bstr.charCodeAt(offset+1) << 16) | (bstr.charCodeAt(offset+2) << 8) | bstr.charCodeAt(offset+3);
    const type = bstr.substring(offset+4, offset+8);
    if (type === 'IHDR') { ihdrLength = length + 12; break; }
    offset += length + 12;
  }
  if (ihdrLength === 0) return base64Image;

  const dpiToPpm = Math.round(dpi / 0.0254);
  const physChunk = new Uint8Array(21);
  const dataView = new DataView(physChunk.buffer);
  dataView.setUint32(0, 9);
  physChunk[4] = 112; physChunk[5] = 72; physChunk[6] = 89; physChunk[7] = 115;
  dataView.setUint32(8, dpiToPpm);
  dataView.setUint32(12, dpiToPpm);
  physChunk[16] = 1;

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) { if (c & 1) c = 0xedb88320 ^ (c >>> 1); else c = c >>> 1; }
    crcTable[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 4; i < 17; i++) { crc = crcTable[(crc ^ physChunk[i]) & 0xff] ^ (crc >>> 8); }
  crc = crc ^ 0xffffffff;
  dataView.setUint32(17, crc);

  let physStr = '';
  for (let i = 0; i < 21; i++) { physStr += String.fromCharCode(physChunk[i]); }

  const insertPos = offset + ihdrLength;
  const newBstr = bstr.substring(0, insertPos) + physStr + bstr.substring(insertPos);
  return mime + ',' + btoa(newBstr);
}

export function FigureAssembler() {
  const { entitlements, trackUsage } = useLicense();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Local assembler state (decoupled from dataset)
  const [layout, setLayout] = useState<LayoutType>('1x2');
  const [slots, setSlots] = useState<(string | null)[]>([null, null]);
  const [showLabels, setShowLabels] = useState(true);
  const [orientation, setOrientation] = useState<CanvasOrientation>('landscape');
  const [activeSlotToAssign, setActiveSlotToAssign] = useState<number | null>(null);
  
  // Export settings
  const [showExportSettings, setShowExportSettings] = useState<'png' | 'tiff' | null>(null);
  const [dpi, setDpi] = useState(300);
  const [targetWidth, setTargetWidth] = useState(183);
  const [targetUnit, setTargetUnit] = useState<'mm' | 'px'>('mm');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchFigures() {
      try {
        const res = await window.api.getGraphingFigures();
        if (res.success && res.data) {
          setFigures(res.data);
        }
      } catch (err) { }
    }
    fetchFigures();
  }, []);

  const handleLayoutChange = (newLayout: LayoutType) => {
    const counts: Record<LayoutType, number> = {
      '1x2': 2, '2x1': 2, '2x2': 4, '1x3': 3, '3x1': 3
    };
    setLayout(newLayout);
    setSlots(Array(counts[newLayout]).fill(null));
  };

  const assignSlot = (index: number) => {
    if (figures.length === 0) return;
    setActiveSlotToAssign(index);
  };

  const assignFigureToSlot = (figureId: string) => {
    if (activeSlotToAssign === null) return;
    const newSlots = [...slots];
    newSlots[activeSlotToAssign] = figureId;
    setSlots(newSlots);
    setActiveSlotToAssign(null);
  };

  const clearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  // Hide edit controls before export, restore after
  const captureCleanCanvas = async (scale = 4): Promise<HTMLCanvasElement | null> => {
    if (!containerRef.current) return null;
    
    // Temporarily hide edit-only controls
    const editControls = containerRef.current.querySelectorAll('.assembler-edit-control');
    editControls.forEach(el => (el as HTMLElement).style.display = 'none');
    
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      return trimCanvas(canvas);
    } finally {
      editControls.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const handleSaveFigure = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCleanCanvas();
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      
      const res = await window.api.createGraphingFigure({
        name: `Composite Figure (${layout})`,
        graph_type: 'composite',
        options_json: JSON.stringify({ layout, slots }),
        annotation_json: '{}',
        thumbnail_dataurl: dataUrl 
      });

      if (res.success) {
        alert('Composite Figure saved to figures database!');
      } else {
        alert('Error saving composite figure.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate composite image');
    } finally {
      setIsExporting(false);
    }
  };

  const executeRasterExport = async (format: 'png' | 'tiff') => {
    if (!entitlements.canExportWithoutWatermark && format === 'tiff') {
      setShowLimitDialog(true); return;
    }
    if (!entitlements.canExportWithoutWatermark && dpi > 150) {
      setShowLimitDialog(true); return;
    }
    setIsExporting(true);
    try {
      const currentScreenPx = containerRef.current?.offsetWidth || 800;
      let pixelsNeeded = targetWidth;
      if (targetUnit === 'mm') pixelsNeeded = (targetWidth / 25.4) * dpi;
      const scale = pixelsNeeded / currentScreenPx;
      
      const canvas = await captureCleanCanvas(scale);
      if (!canvas) return;
      const rawDataUrl = canvas.toDataURL('image/png');
      const finalDataUrl = changeDpiDataUrl(rawDataUrl, dpi);

      await window.api.exportGraphingFigure(finalDataUrl, `Composite_${layout}`, format);
      trackUsage('graphs_exported');
      setShowExportSettings(null);
    } catch (err) {
      console.error(`Export ${format} failed`, err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSvg = async () => {
    if (!entitlements.canUseAdvancedExports) { setShowLimitDialog(true); return; }
    if (!containerRef.current) return;
    
    // For assembled figures, export as high-res PNG since they're raster compositions
    setIsExporting(true);
    try {
      const canvas = await captureCleanCanvas(4);
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      await window.api.exportGraphingFigure(dataUrl, `Composite_${layout}`, 'png');
      trackUsage('graphs_exported');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCleanCanvas(4);
      if (!canvas) return;
      canvas.toBlob(async blob => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          alert('Composite figure copied to clipboard!');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy to clipboard failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleInsertIntoDocument = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCleanCanvas(4);
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');

      await window.api.createGraphingFigure({
        name: `Composite_${layout}`,
        graph_type: 'composite',
        thumbnail_dataurl: dataUrl,
      });

      const event = new CustomEvent('insert-graph-object', {
        detail: { type: 'image', src: dataUrl, caption: `Composite Figure (${layout})` },
      });
      window.dispatchEvent(event);
      alert('Composite figure saved and sent to document editor.');
    } catch (err) {
      console.error('Insert failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getGridStyle = (): React.CSSProperties => {
    switch (layout) {
      case '1x2': return { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
      case '2x1': return { display: 'grid', gridTemplateRows: '1fr 1fr', gap: '16px' };
      case '2x2': return { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '16px' };
      case '1x3': return { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' };
      case '3x1': return { display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gap: '16px' };
      default: return {};
    }
  };

  const canvasW = orientation === 'landscape' ? '800px' : '600px';
  const canvasH = orientation === 'landscape' ? '600px' : '800px';
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Export settings panel
  const renderExportSettings = () => {
    if (!showExportSettings) return null;
    return (
      <div className="gs-panel-section">
        <div className="gs-panel-title">{showExportSettings.toUpperCase()} Export Settings</div>
        <div className="gs-form-group">
          <label className="gs-label">Resolution (DPI)</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[72, 150, 300, 600].map(val => (
              <button 
                key={val}
                className="gs-btn gs-btn-sm"
                style={{ background: dpi === val ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: dpi === val ? '#fff' : 'inherit' }}
                onClick={() => setDpi(val)}
              >
                {val} DPI
              </button>
            ))}
          </div>
        </div>
        <div className="gs-form-group">
          <label className="gs-label">Target Width</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="number" className="gs-input" value={targetWidth} onChange={e => setTargetWidth(Number(e.target.value) || 183)} style={{ width: '80px', padding: '4px' }} min="10" />
            <select className="gs-select" value={targetUnit} onChange={e => setTargetUnit(e.target.value as 'mm' | 'px')} style={{ width: '70px', padding: '4px' }}>
              <option value="mm">mm</option>
              <option value="px">px</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button className="gs-btn" style={{ flex: 1 }} onClick={() => setShowExportSettings(null)}>Cancel</button>
          <button className="gs-btn" style={{ flex: 1, background: 'var(--color-accent-primary)', color: 'white' }} onClick={() => executeRasterExport(showExportSettings)}>Export Now</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Left pane: Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
        <div 
          ref={containerRef}
          style={{ 
            background: 'white', padding: '24px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            width: canvasW, minHeight: canvasH,
            ...getGridStyle()
          }}
        >
          {slots.map((slotId: string | null, i: number) => {
             const slotFigure = figures.find(f => f.id === slotId) || null;
             return (
               <div 
                  key={i} 
                  onClick={() => assignSlot(i)}
                  style={{ 
                    border: slotFigure ? 'none' : '2px dashed #ccc', 
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', background: slotFigure ? 'transparent' : '#f9f9f9',
                    minHeight: '200px', overflow: 'hidden',
                  }}
               >
                  {slotFigure && slotFigure.thumbnail_dataurl ? (
                     <img src={slotFigure.thumbnail_dataurl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                     <span style={{ color: '#999' }}>Click to assign graph</span>
                  )}

                  {showLabels && (
                     <div style={{ position: 'absolute', top: 0, left: 0, fontSize: '24px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
                       {labels[i]}
                     </div>
                  )}

                  {slotFigure && (
                    <button 
                      className="assembler-edit-control"
                      onClick={(e) => clearSlot(i, e)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.8)', border: '1px solid #ccc', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', padding: '2px 6px' }}
                    >
                      ✕
                    </button>
                  )}
               </div>
             );
          })}
        </div>
      </div>

      {/* Right pane: Controls */}
      <div className="gs-side-panel">
        <div className="gs-panel-section">
          <div className="gs-panel-title">Layout Settings</div>
          
          <div className="gs-form-group">
            <label className="gs-label">Grid Layout</label>
            <select className="gs-select" value={layout} onChange={e => handleLayoutChange(e.target.value as LayoutType)}>
              <option value="1x2">1×2 (Side by side)</option>
              <option value="2x1">2×1 (Stacked)</option>
              <option value="2x2">2×2 Grid</option>
              <option value="1x3">1×3 (Horizontal)</option>
              <option value="3x1">3×1 (Vertical)</option>
            </select>
          </div>

          <div className="gs-form-group">
            <label className="gs-label">Canvas Orientation</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="gs-btn gs-btn-sm"
                style={{ 
                  flex: 1, padding: '8px',
                  background: orientation === 'landscape' ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                  color: orientation === 'landscape' ? '#fff' : 'var(--color-text-primary)',
                  border: orientation === 'landscape' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-light)',
                }}
                onClick={() => setOrientation('landscape')}
              >
                ▬ Landscape
              </button>
              <button
                className="gs-btn gs-btn-sm"
                style={{ 
                  flex: 1, padding: '8px',
                  background: orientation === 'portrait' ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                  color: orientation === 'portrait' ? '#fff' : 'var(--color-text-primary)',
                  border: orientation === 'portrait' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-light)',
                }}
                onClick={() => setOrientation('portrait')}
              >
                ▮ Portrait
              </button>
            </div>
          </div>

          <div className="gs-form-group" style={{ marginTop: '12px' }}>
             <label className="gs-checkbox-label">
                <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
                Show Panel Lettering (A, B, C...)
             </label>
          </div>
        </div>

        {/* Export Options */}
        <div className="gs-panel-section">
          <div className="gs-panel-title">Export & Insert</div>
          
          {showExportSettings ? renderExportSettings() : (
            <div className="gs-export-grid">
              <div className="gs-export-option" onClick={() => setShowExportSettings('png')}>
                <div className="gs-export-option-icon">🖼️</div>
                <div className="gs-export-option-label">PNG</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>High-res raster</div>
              </div>
              <div className="gs-export-option" onClick={() => setShowExportSettings('tiff')}>
                <div className="gs-export-option-icon">🖨️</div>
                <div className="gs-export-option-label">TIFF</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Print quality</div>
              </div>
              <div className="gs-export-option" onClick={handleExportSvg}>
                <div className="gs-export-option-icon">📐</div>
                <div className="gs-export-option-label">High-Res</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>4× resolution</div>
              </div>
              <div className="gs-export-option" onClick={handleCopyToClipboard}>
                <div className="gs-export-option-icon">📋</div>
                <div className="gs-export-option-label">Clipboard</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Copy as raster</div>
              </div>
              <div className="gs-export-option" onClick={handleInsertIntoDocument} style={{ gridColumn: '1 / -1' }}>
                <div className="gs-export-option-icon">📑</div>
                <div className="gs-export-option-label">Insert into Document</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Add to manuscript</div>
              </div>
            </div>
          )}
        </div>

        <div className="gs-panel-section" style={{ marginTop: 'auto' }}>
           <button 
             className="gs-btn gs-btn-primary" 
             style={{ width: '100%', padding: '12px' }} 
             onClick={handleSaveFigure}
             disabled={isExporting || slots.every((s: string | null) => s === null)}
           >
             {isExporting ? 'Processing...' : '💾 Save Composite Figure'}
           </button>
        </div>

        <DemoLimitDialog
          isOpen={showLimitDialog}
          onClose={() => setShowLimitDialog(false)}
          title="Premium Feature"
          message="High-resolution exports (>150 DPI), TIFF formats, and advanced export options are only available in the licensed version."
          onActivate={() => window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'))}
        />
      </div>

      {/* Figure Picker Modal */}
      {activeSlotToAssign !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={(e) => { if (e.target === e.currentTarget) setActiveSlotToAssign(null); }}>
          <div style={{
            background: 'var(--color-bg-app)', borderRadius: '16px',
            width: '600px', maxWidth: '90vw', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--color-border-light)',
              background: 'var(--color-bg-surface)',
            }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Select a Graph</h2>
              <button onClick={() => setActiveSlotToAssign(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              {figures.map(fig => (
                <div 
                  key={fig.id}
                  onClick={() => assignFigureToSlot(fig.id)}
                  style={{
                    width: '180px', borderRadius: '8px', border: '1px solid var(--color-border-strong)',
                    overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', backgroundColor: 'var(--color-bg-surface)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 98, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ height: '120px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderBottom: '1px solid var(--color-border-light)' }}>
                    <img src={fig.thumbnail_dataurl || undefined} alt={fig.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '8px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {fig.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
