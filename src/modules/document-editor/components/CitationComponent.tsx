import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Cite } from '@citation-js/core';
import type { Reference } from '../../../types/electron.d';
import { getCitationStyle, onCitationStyleChange } from '../../../utils/citationStyleStore';
import { CSL_STYLES } from '../../../assets/cslStyles';

/**
 * Scans the entire editor document and returns a map of refId -> global number.
 * This is called synchronously whenever we need the current numbering.
 */
function computeCitationMap(editor: any): Record<string, number> {
  const map: Record<string, number> = {};
  let order = 1;
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === 'citation' && node.attrs.id) {
      const ids = node.attrs.id.split(',');
      ids.forEach((id: string) => {
        const trimmed = id.trim();
        if (trimmed && !(trimmed in map)) {
          map[trimmed] = order++;
        }
      });
    }
  });
  return map;
}

export function CitationComponent(props: NodeViewProps) {
  const { node, editor, updateAttributes, selected } = props;
  const [formatted, setFormatted] = useState('…');
  const [showPicker, setShowPicker] = useState(false);
  const [allRefs, setAllRefs] = useState<Reference[]>([]);
  const [activeStyle, setActiveStyle] = useState(getCitationStyle());
  const containerRef = useRef<HTMLSpanElement>(null);
  const [tick, setTick] = useState(0);

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

  // Listen to ALL editor transactions to re-compute numbering.
  // This is the key fix: we don't rely on node.attrs being updated by a plugin.
  // Instead, every time the document changes, we recompute the global citation map
  // and re-format this component's display.
  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      setTick(t => t + 1);
    };

    editor.on('update', handler);
    // Also run once immediately on mount
    handler();

    return () => {
      editor.off('update', handler);
    };
  }, [editor]);

  // Format the inline citation text
  const doFormat = useCallback(async () => {
    let isNumericStyle = false;
    try {
      if (CSL_STYLES[activeStyle] && CSL_STYLES[activeStyle].includes('citation-format="numeric"')) {
        isNumericStyle = true;
      } else {
        const knownNumeric = [
          'ieee', 'vancouver', 'nature', 'science', 'american-medical-association', 
          'elsevier-vancouver', 'elsevier-with-titles', 'springer-basic-brackets',
          'plos', 'bmc', 'lancet', 'cell', 'numeric', 'numbered'
        ];
        if (knownNumeric.some(s => activeStyle.toLowerCase().includes(s))) {
          isNumericStyle = true;
        }
      }
    } catch (e) {
      // Safe fallback
      isNumericStyle = ['ieee', 'vancouver', 'nature', 'science', 'american-medical-association', 'plos', 'cell'].includes(activeStyle);
    }

    if (!isNumericStyle && ids.length > 0 && allRefs.length > 0) {
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

    // Numeric styles: compute the global map right now
    if (isNumericStyle && editor) {
      const citationMap = computeCitationMap(editor);
      const idxs = ids.map((id: string) => citationMap[id.trim()]).filter(Boolean);

      if (idxs.length > 0) {
        const sorted = [...idxs].sort((a, b) => a - b);
        const ranges: string[] = [];
        for (let i = 0; i < sorted.length; i++) {
          const start = sorted[i];
          let end = start;
          while (i + 1 < sorted.length && sorted[i + 1] === end + 1) {
            end = sorted[i + 1];
            i++;
          }
          if (end > start + 1) {
            ranges.push(`${start}-${end}`);
          } else if (end > start) {
            ranges.push(`${start}, ${end}`);
          } else {
            ranges.push(`${start}`);
          }
        }
        setFormatted(`[${ranges.join(', ')}]`);
      } else {
        // Absolute fallback
        setFormatted(`[${ids.map((_: unknown, i: number) => i + 1).join(', ')}]`);
      }
    } else if (!isNumericStyle) {
      setFormatted(`(${node.attrs.label || 'Citation'})`);
    }
  }, [activeStyle, node.attrs.id, node.attrs.label, allRefs, editor, ids, tick]);

  useEffect(() => {
    doFormat();
  }, [doFormat]);

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
