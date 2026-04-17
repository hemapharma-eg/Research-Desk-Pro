import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState, useCallback, useRef } from 'react';

// Resize handle positions
type HandlePosition = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLE_CURSORS: Record<HandlePosition, string> = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  nw: 'nwse-resize', se: 'nwse-resize',
};

const HANDLE_STYLES: Record<HandlePosition, React.CSSProperties> = {
  n:  { top: '-6px', left: '50%', transform: 'translateX(-50%)' },
  s:  { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
  e:  { right: '-6px', top: '50%', transform: 'translateY(-50%)' },
  w:  { left: '-6px', top: '50%', transform: 'translateY(-50%)' },
  ne: { top: '-6px', right: '-6px' },
  nw: { top: '-6px', left: '-6px' },
  se: { bottom: '-6px', right: '-6px' },
  sw: { bottom: '-6px', left: '-6px' },
};

// Crop handle styles (thicker, distinct MS Word style)
const CROP_HANDLE_STYLES: Record<HandlePosition, React.CSSProperties> = {
  n:  { top: '0', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '6px', backgroundColor: '#000' },
  s:  { bottom: '0', left: '50%', transform: 'translate(-50%, 50%)', width: '20px', height: '6px', backgroundColor: '#000' },
  e:  { right: '0', top: '50%', transform: 'translate(50%, -50%)', width: '6px', height: '20px', backgroundColor: '#000' },
  w:  { left: '0', top: '50%', transform: 'translate(-50%, -50%)', width: '6px', height: '20px', backgroundColor: '#000' },
  ne: { top: '0', right: '0', transform: 'translate(50%, -50%)', width: '20px', height: '20px', borderTop: '6px solid #000', borderRight: '6px solid #000', backgroundColor: 'transparent' },
  nw: { top: '0', left: '0', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', borderTop: '6px solid #000', borderLeft: '6px solid #000', backgroundColor: 'transparent' },
  se: { bottom: '0', right: '0', transform: 'translate(50%, 50%)', width: '20px', height: '20px', borderBottom: '6px solid #000', borderRight: '6px solid #000', backgroundColor: 'transparent' },
  sw: { bottom: '0', left: '0', transform: 'translate(-50%, 50%)', width: '20px', height: '20px', borderBottom: '6px solid #000', borderLeft: '6px solid #000', backgroundColor: 'transparent' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ResizableImageComponent = (props: any) => {
  const [isCropping, setIsCropping] = useState(false);
  // cropBox represents percentages relative to the current image bounds: { top, right, bottom, left }
  const [cropBox, setCropBox] = useState({ top: 0, right: 100, bottom: 100, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    const parent = containerRef.current;
    if (!parent) return;
    
    const startX = e.pageX;
    const startY = e.pageY;
    const startWidth = parent.offsetWidth;
    const startHeight = parent.offsetHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.pageX - startX;
      const dy = moveEvent.pageY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (['e', 'ne', 'se'].includes(handle)) newWidth = startWidth + dx;
      if (['w', 'nw', 'sw'].includes(handle)) newWidth = startWidth - dx;
      if (['s', 'se', 'sw'].includes(handle)) newHeight = startHeight + dy;
      if (['n', 'ne', 'nw'].includes(handle)) newHeight = startHeight - dy;

      const updates: Record<string, string> = {};
      if (['e', 'w', 'ne', 'nw', 'se', 'sw'].includes(handle)) {
        updates.width = `${Math.max(50, newWidth)}px`;
      }
      if (['n', 's', 'ne', 'nw', 'se', 'sw'].includes(handle)) {
        updates.height = `${Math.max(50, newHeight)}px`;
      }
      
      props.updateAttributes(updates);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [props]);

  const handleCropDragStart = useCallback((e: React.MouseEvent, handle: HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    const parent = containerRef.current;
    if (!parent) return;

    const startX = e.pageX;
    const startY = e.pageY;
    const parentWidth = parent.offsetWidth;
    const parentHeight = parent.offsetHeight;
    const startBox = { ...cropBox };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.pageX - startX;
      const dy = moveEvent.pageY - startY;
      
      const dxPct = (dx / parentWidth) * 100;
      const dyPct = (dy / parentHeight) * 100;

      const newBox = { ...startBox };

      if (['n', 'ne', 'nw'].includes(handle)) {
        newBox.top = Math.max(0, Math.min(startBox.top + dyPct, newBox.bottom - 5));
      }
      if (['s', 'se', 'sw'].includes(handle)) {
        newBox.bottom = Math.min(100, Math.max(startBox.bottom + dyPct, newBox.top + 5));
      }
      if (['w', 'nw', 'sw'].includes(handle)) {
        newBox.left = Math.max(0, Math.min(startBox.left + dxPct, newBox.right - 5));
      }
      if (['e', 'ne', 'se'].includes(handle)) {
        newBox.right = Math.min(100, Math.max(startBox.right + dxPct, newBox.left + 5));
      }

      setCropBox(newBox);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [cropBox]);

  const applyCrop = useCallback(() => {
    const parent = containerRef.current;
    if (!parent) return;
    const imgEl = parent.querySelector('img') as HTMLImageElement;
    if (!imgEl) return;

    const { top, right, bottom, left } = cropBox;
    
    // Convert percentages to natural image coordinates
    const sx = (left / 100) * imgEl.naturalWidth;
    const sy = (top / 100) * imgEl.naturalHeight;
    const sw = ((right - left) / 100) * imgEl.naturalWidth;
    const sh = ((bottom - top) / 100) * imgEl.naturalHeight;

    if (sw < 10 || sh < 10) {
      setIsCropping(false);
      setCropBox({ top: 0, left: 0, right: 100, bottom: 100 });
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, sw, sh);
    
    const croppedDataUrl = canvas.toDataURL('image/png');
    
    // Scale down the displayed width height proportionally
    const currentDisplayWidth = parent.offsetWidth;
    const newDisplayWidth = currentDisplayWidth * ((right - left) / 100);

    props.updateAttributes({ 
      src: croppedDataUrl, 
      width: `${newDisplayWidth}px`,
      height: 'auto' 
    });
    
    setIsCropping(false);
    setCropBox({ top: 0, left: 0, right: 100, bottom: 100 });
  }, [cropBox, props]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setCropBox({ top: 0, left: 0, right: 100, bottom: 100 });
  }, []);

  const imgWidth = props.node.attrs.width || '100%';
  const imgHeight = props.node.attrs.height || 'auto';

  return (
    <NodeViewWrapper style={{ 
      display: 'block', 
      textAlign: props.node.attrs.textAlign || 'left',
      margin: 'var(--space-4) 0' 
    }}>
      <div 
        ref={containerRef}
        className="resizable-image-container"
        style={{ 
          display: 'inline-block', 
          position: 'relative', 
          width: imgWidth, 
          height: imgHeight,
          maxWidth: '100%' 
        }}
        onClick={(e) => {
          // If cropping, don't deselect element
          if (isCropping) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <img 
          src={props.node.attrs.src} 
          alt={props.node.attrs.alt} 
          draggable={false}
          style={{ 
            width: '100%', 
            height: imgHeight === 'auto' ? 'auto' : '100%', 
            display: 'block', 
            borderRadius: 'var(--radius-sm)', 
            outline: props.selected && !isCropping ? '3px solid var(--color-accent-primary)' : 'none',
            outlineOffset: '2px',
            userSelect: 'none',
          }} 
        />

        {/* MS Word style Crop Overlays */}
        {isCropping && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
            {/* Darken Top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${cropBox.top}%`, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            {/* Darken Bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${100 - cropBox.bottom}%`, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            {/* Darken Left */}
            <div style={{ position: 'absolute', top: `${cropBox.top}%`, bottom: `${100 - cropBox.bottom}%`, left: 0, width: `${cropBox.left}%`, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            {/* Darken Right */}
            <div style={{ position: 'absolute', top: `${cropBox.top}%`, bottom: `${100 - cropBox.bottom}%`, right: 0, width: `${100 - cropBox.right}%`, backgroundColor: 'rgba(0,0,0,0.5)' }} />

            {/* The active crop selection borders */}
            <div style={{ 
              position: 'absolute',
              top: `${cropBox.top}%`, left: `${cropBox.left}%`,
              width: `${cropBox.right - cropBox.left}%`, height: `${cropBox.bottom - cropBox.top}%`,
              border: '1px dashed rgba(255,255,255,0.7)',
            }}>
              {/* The MS Word style handles */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}>
                {(Object.keys(CROP_HANDLE_STYLES) as HandlePosition[]).map(pos => (
                  <div
                    key={`crop-${pos}`}
                    onMouseDown={(e) => handleCropDragStart(e, pos)}
                    title="Crop"
                    style={{
                      position: 'absolute',
                      cursor: HANDLE_CURSORS[pos],
                      zIndex: 20,
                      ...CROP_HANDLE_STYLES[pos],
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons when selected */}
        {props.selected && props.editor.isEditable && !isCropping && (
          <div style={{
            position: 'absolute', top: '-32px', right: '0',
            display: 'flex', gap: '4px', zIndex: 20,
          }}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsCropping(true); }}
              style={{
                padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
                background: 'var(--color-bg-app)', border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-sm)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: '2px',
              }}
              title="Crop Image"
            >
              ✂️ Crop
            </button>
          </div>
        )}

        {/* Crop action bar */}
        {isCropping && (
          <div style={{
            position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '6px', zIndex: 25,
          }}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyCrop(); }}
              style={{
                padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
                background: '#000', color: 'white', border: 'none', fontWeight: 'bold',
                borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              }}
            >
              ✓ Apply
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelCrop(); }}
              style={{
                padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
                background: '#fff', border: '1px solid #ccc', color: '#333', fontWeight: 'bold',
                borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              }}
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {/* 8 Resize handles (normal mode) */}
        {props.selected && props.editor.isEditable && !isCropping && (
          <>
            {(Object.keys(HANDLE_STYLES) as HandlePosition[]).map(pos => (
              <div
                key={pos}
                onMouseDown={(e) => handleResizeStart(e, pos)}
                style={{
                  position: 'absolute',
                  width: pos === 'n' || pos === 's' ? '24px' : '12px',
                  height: pos === 'e' || pos === 'w' ? '24px' : '12px',
                  ...(pos === 'n' || pos === 's' ? { width: '24px', height: '12px' } : {}),
                  ...(pos === 'e' || pos === 'w' ? { width: '12px', height: '24px' } : {}),
                  ...(pos === 'ne' || pos === 'nw' || pos === 'se' || pos === 'sw' ? { width: '12px', height: '12px' } : {}),
                  background: 'var(--color-accent-primary)',
                  cursor: HANDLE_CURSORS[pos],
                  borderRadius: '2px',
                  zIndex: 10,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  ...HANDLE_STYLES[pos],
                }}
              />
            ))}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: { src: string, alt?: string, width?: string, height?: string }) => ReturnType,
    }
  }
}

export const ResizableImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: '100%' },
      height: { default: 'auto' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { 
      style: `width: ${HTMLAttributes.width}; height: ${HTMLAttributes.height || 'auto'}; max-width: 100%;` 
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    }
  },
});
