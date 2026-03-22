import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useEffect, useState, useRef } from 'react';
import { Cite } from '@citation-js/core';
import type { Reference } from '../../../types/electron.d';
import { getCitationStyle, onCitationStyleChange } from '../../../utils/citationStyleStore';

export function CitationComponent(props: NodeViewProps) {
  const { node, editor, updateAttributes, selected } = props;
  const [formatted, setFormatted] = useState(`(${node.attrs.label || 'Citation'})`);
  const [showPicker, setShowPicker] = useState(false);
  const [allRefs, setAllRefs] = useState<Reference[]>([]);
  const [activeStyle, setActiveStyle] = useState(getCitationStyle());
  const containerRef = useRef<HTMLSpanElement>(null);

  const ids = node.attrs.id ? node.attrs.id.split(',') : [];

  // Load all references
  useEffect(() => {
    window.api.getReferences().then((res: { success: boolean, data?: Reference[] }) => {
      if (res.success && res.data) setAllRefs(res.data);
    });
  }, []);

  // Subscribe to global style changes
  useEffect(() => {
    const unsub = onCitationStyleChange((newStyle) => {
      setActiveStyle(newStyle);
    });
    return unsub;
  }, []);

  // Format the inline citation text whenever style or IDs change
  useEffect(() => {
    const updateFormat = async () => {
      if (ids.length > 0 && allRefs.length > 0) {
        try {
          const citedData = ids
            .map((id: string) => allRefs.find(r => r.id === id))
            .filter(Boolean)
            .map((r: Reference | undefined) => {
              if (!r || !r.raw_metadata) return null;
              try { return JSON.parse(r.raw_metadata); } catch { return null; }
            })
            .filter(Boolean);

          if (citedData.length > 0) {
            const cite = new Cite(citedData);
            const entryIds = citedData.map((d: { id: string }) => d.id);
            const formattedHtml = cite.format('citation', { format: 'html', template: activeStyle, lang: 'en-US', entry: entryIds });
            setFormatted(formattedHtml.replace(/<\/?[^>]+(>|$)/g, ""));
            return;
          }
        } catch (e) {
          console.error("Inline format error", e);
        }
      }

      // Basic fallback
      const isNumericStyle = ['ieee', 'vancouver', 'nature', 'science', 'american-medical-association'].includes(activeStyle);
      if (isNumericStyle) {
        setFormatted(`[${ids.map((_: unknown, i: number) => i + 1).join(', ')}]`);
      } else {
        setFormatted(`(${node.attrs.label || 'Citation'})`);
      }
    };
    
    updateFormat();
  }, [activeStyle, node.attrs.id, allRefs, node.attrs.label, ids]);

  const handleAddCitation = (refId: string) => {
    if (!ids.includes(refId)) {
      const newIds = [...ids, refId].join(',');
      updateAttributes({ id: newIds });
    }
    setShowPicker(false);
  };

  const handleRemoveCitation = (refId: string) => {
    const newIds = ids.filter((id: string) => id !== refId).join(',');
    if (newIds === '') {
      editor.commands.deleteSelection();
    } else {
      updateAttributes({ id: newIds });
    }
  };

  return (
    <NodeViewWrapper as="span" style={{ position: 'relative', display: 'inline-block' }}>
      <span 
        ref={containerRef}
        onClick={() => setShowPicker(!showPicker)}
        className="citation-badge" 
        style={{ 
          cursor: 'pointer', 
          background: selected ? 'var(--color-bg-active)' : 'var(--color-bg-hover)', 
          color: 'var(--color-accent-primary)', 
          padding: '2px 4px', 
          borderRadius: '4px', 
          fontSize: '0.9em',
          border: selected ? '1px solid var(--color-accent-primary)' : '1px solid transparent'
        }}
        title="Click to manage citations in this cluster"
      >
        {formatted}
      </span>

      {showPicker && (
        <div 
          contentEditable={false}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '4px',
            backgroundColor: 'var(--color-bg-app)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 1000,
            width: '300px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: 'var(--space-2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Manage Cluster</span>
            <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Current Citations</strong>
            {ids.map((id: string) => {
              const ref = allRefs.find(r => r.id === id);
              if (!ref) return null;
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '2px 0' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                    {ref.authors?.split(',')[0]} ({ref.year})
                  </span>
                  <button onClick={() => handleRemoveCitation(id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '10px' }}>Remove</button>
                </div>
              );
            })}
          </div>

          <div>
            <strong style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Add Citation</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
              {allRefs.filter(r => !ids.includes(r.id)).map((ref) => (
                <button
                  key={ref.id}
                  onClick={() => handleAddCitation(ref.id)}
                  style={{ textAlign: 'left', background: 'var(--color-bg-surface)', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-primary)' }}
                >
                  <span style={{ fontWeight: 'bold' }}>{ref.authors?.split(',')[0]} ({ref.year})</span>
                  <div style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ref.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
