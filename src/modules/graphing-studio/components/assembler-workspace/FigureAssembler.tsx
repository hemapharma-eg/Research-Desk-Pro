import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useGraphingStudio } from '../../GraphingStudioContext';

type Figure = {
  id: string;
  name: string;
  graph_type: string;
  thumbnail_dataurl: string | null;
  created_at: string;
};

type LayoutType = '1x2' | '2x1' | '2x2' | '1x3' | '3x1';

export function FigureAssembler() {
  const { state, dispatch } = useGraphingStudio();
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  const { layout, slots, showLabels } = state.assemblerState;
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

  // Reset slots when layout changes
  const handleLayoutChange = (newLayout: LayoutType) => {
    const counts: Record<LayoutType, number> = {
      '1x2': 2, '2x1': 2, '2x2': 4, '1x3': 3, '3x1': 3
    };
    dispatch({ 
      type: 'SET_ASSEMBLER_STATE', 
      payload: { ...state.assemblerState, layout: newLayout, slots: Array(counts[newLayout]).fill(null) } 
    });
  };

  const assignSlot = (index: number) => {
     // For simplicity in a prototype/MVP: 
     // We can open a quick modal or just cycle through available figures on click.
     // Let's cycle through figures for the clicked slot.
     if (figures.length === 0) return;
     const current = slots[index];
     const currentIndex = current ? figures.findIndex(f => f.id === current) : -1;
     const nextIndex = (currentIndex + 1) % figures.length;
     const newSlots = [...slots];
     const nextId = figures[nextIndex].id;
     newSlots[index] = nextId;
     dispatch({ type: 'SET_ASSEMBLER_STATE', payload: { ...state.assemblerState, slots: newSlots } });
  };

  const clearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...slots];
    newSlots[index] = null;
    dispatch({ type: 'SET_ASSEMBLER_STATE', payload: { ...state.assemblerState, slots: newSlots } });
  };

  const handleExport = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 4, // high-res
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      const res = await window.api.createGraphingFigure({
        dataset_id: state.activeDatasetId,
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

  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Left pane: Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div 
          ref={containerRef}
          style={{ 
            background: 'white', padding: '32px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            width: '800px', minHeight: '600px',
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
                    minHeight: '250px'
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
                      onClick={(e) => clearSlot(i, e)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.8)', border: '1px solid #ccc', cursor: 'pointer', borderRadius: '4px' }}
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
              <option value="1x2">1x2 (Side by side)</option>
              <option value="2x1">2x1 (Stacked)</option>
              <option value="2x2">2x2 Grid</option>
              <option value="1x3">1x3 (Horizontal)</option>
              <option value="3x1">3x1 (Vertical)</option>
            </select>
          </div>

          <div className="gs-form-group" style={{ marginTop: '16px' }}>
             <label className="gs-checkbox-label">
                <input type="checkbox" checked={showLabels} onChange={e => dispatch({ type: 'SET_ASSEMBLER_STATE', payload: { ...state.assemblerState, showLabels: e.target.checked } })} />
                Show Panel Lettering (A, B, C...)
             </label>
          </div>

        </div>

        <div className="gs-panel-section" style={{ marginTop: 'auto' }}>
           <button 
             className="gs-btn gs-btn-primary" 
             style={{ width: '100%', padding: '12px' }} 
             onClick={handleExport}
             disabled={isExporting || slots.every((s: string | null) => s === null)}
           >
             {isExporting ? 'Generating...' : '💾 Save Composite Figure'}
           </button>
        </div>
      </div>
    </div>
  );
}
