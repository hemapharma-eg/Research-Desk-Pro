import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { GraphEditorCore, type DataPoint } from '../../graphing-studio/GraphEditorCore';

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

const GraphComponent = (props: any) => {
  const { node, updateAttributes } = props;
  const dataset: DataPoint[] = node.attrs.dataset || [];
  const chartType: 'bar' | 'scatter' = node.attrs.chartType || 'bar';
  const [isEditing, setIsEditing] = useState(false);

  // Derived chart data
  const chartData = useMemo(() => {
    return dataset.map(d => ({
      x: d.x,
      y: typeof d.y === 'number' ? d.y : 0
    }));
  }, [dataset]);

  const handleSave = (newDataset: DataPoint[], newChartType: 'bar' | 'scatter') => {
    updateAttributes({
      dataset: newDataset,
      chartType: newChartType
    });
    setIsEditing(false);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    const parent = (e.currentTarget as HTMLElement).closest('.graph-resize-container') as HTMLElement;
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
        updates.width = `${Math.max(200, newWidth)}px`;
      }
      if (['n', 's', 'ne', 'nw', 'se', 'sw'].includes(handle)) {
        updates.height = `${Math.max(150, newHeight)}px`;
      }
      
      updateAttributes(updates);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes]);

  const graphWidth = node.attrs.width || '100%';
  const graphHeight = node.attrs.height || '300px';

  return (
    <NodeViewWrapper className="graph-node-wrapper" style={{ margin: 'var(--space-4) 0', padding: 'var(--space-2)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', position: 'relative', textAlign: node.attrs.textAlign || 'left' }}>
      
      {/* Resizable Preview Container */}
      <div 
        className="graph-resize-container"
        style={{ 
          width: graphWidth, 
          height: graphHeight, 
          borderRadius: 'var(--radius-sm)', 
          display: 'inline-block', 
          position: 'relative', 
          maxWidth: '100%',
          overflow: 'hidden',
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        {dataset.length === 0 ? (
           <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-bg-surface)' }}>
             Double-click to edit Data Plot
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                <XAxis dataKey="x" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                <Bar dataKey="y" fill="var(--color-accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="x" type="category" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                <YAxis dataKey="y" type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                <Scatter data={chartData} fill="var(--color-accent-primary)" />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        )}

        {/* 8 Resize Handles */}
        {props.selected && !isEditing && props.editor?.isEditable && (
          <>
            {(Object.keys(HANDLE_STYLES) as HandlePosition[]).map(pos => (
              <div
                key={pos}
                onMouseDown={(e) => handleResizeStart(e, pos)}
                style={{
                  position: 'absolute',
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

      {props.selected && !isEditing && (
        <div style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)' }}>
          <button 
            onClick={() => setIsEditing(true)}
            style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
          >
            ✏️ Edit Graph
          </button>
        </div>
      )}

      {/* Editing Modal Overlay */}
      {isEditing && (
        <div contentEditable={false} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: '900px', height: '600px', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex' }}>
            <GraphEditorCore 
               initialDataset={dataset.length > 0 ? dataset : undefined}
               initialChartType={chartType}
               showActions={true}
               onSave={handleSave}
               onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    graphBlock: {
      insertGraph: () => ReturnType;
    };
  }
}

export const GraphNode = Node.create({
  name: 'graphBlock',
  group: 'block',
  atom: true, // Content is managed by React, not TipTap

  addAttributes() {
    return {
      dataset: {
        default: [],
        parseHTML: element => {
          const str = element.getAttribute('data-dataset');
          try {
            return str ? JSON.parse(str) : [];
          } catch (e) {
            return [];
          }
        },
        renderHTML: attributes => {
          return {
            'data-dataset': JSON.stringify(attributes.dataset || []),
          };
        },
      },
      chartType: {
        default: 'bar',
      },
      width: {
        default: '100%',
      },
      height: {
        default: '300px',
      },
      textAlign: {
        default: 'left',
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="graph-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'graph-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GraphComponent);
  },
  
  addCommands() {
    return {
      insertGraph: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
             dataset: [
               { id: crypto.randomUUID(), x: 'Group A', y: 12.5 },
               { id: crypto.randomUUID(), x: 'Group B', y: 18.2 },
               { id: crypto.randomUUID(), x: 'Group C', y: 14.1 },
             ],
             chartType: 'bar'
          }
        });
      },
    };
  },
});
