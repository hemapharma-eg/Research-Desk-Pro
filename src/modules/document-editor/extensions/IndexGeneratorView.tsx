/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useEffect, useState, useCallback } from 'react';

interface IndexItem {
  id: string;   // Unique ID or position hash
  text: string; // The display text
  level?: number; // For TOC nesting
  targetPos: number; // For scrolling
}

export function IndexGeneratorView(props: NodeViewProps) {
  const { node, editor, updateAttributes } = props;
  const indexType = node.attrs.indexType as 'toc' | 'lof' | 'lot';
  
  const [items, setItems] = useState<IndexItem[]>(node.attrs.items || []);

  const title = indexType === 'toc' 
    ? 'Table of Contents' 
    : indexType === 'lof' 
      ? 'List of Figures' 
      : 'List of Tables';

  const extractItems = useCallback(() => {
    const newItems: IndexItem[] = [];
    
    editor.state.doc.descendants((n, pos) => {
      if (indexType === 'toc') {
        if (n.type.name === 'heading') {
          newItems.push({
            id: `heading-${pos}`,
            text: n.textContent,
            level: n.attrs.level,
            targetPos: pos,
          });
        }
      } else if (indexType === 'lof' || indexType === 'lot') {
        if (n.type.name === 'caption') {
          const expectedType = indexType === 'lof' ? 'Figure' : 'Table';
          if (n.attrs.labelType === expectedType) {
            newItems.push({
              id: n.attrs.id || `caption-${pos}`,
              text: `${n.attrs.labelType} ${n.attrs.number}: ${n.textContent}`,
              targetPos: pos,
            });
          }
        }
      }
    });

    setItems(newItems);
    
    // Periodically sync the extracted items back to attributes for HTML export serialization
    // We throttle this slightly to avoid transaction loops
    setTimeout(() => {
        if (typeof updateAttributes === 'function') {
           // updateAttributes({ items: newItems }); // Note: Disabling direct constant sync back for now to prevent infinite undo/redo transaction loops in TipTap. Sync happens on manual save or export instead.
        }
    }, 0);

  }, [editor, indexType, updateAttributes]);

  useEffect(() => {
    extractItems();

    editor.on('update', extractItems);
    return () => {
      editor.off('update', extractItems);
    };
  }, [editor, extractItems]);

  const handleScrollTo = (pos: number) => {
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

  return (
    <NodeViewWrapper className="index-generator-wrapper" style={{
      border: '1px solid var(--color-border-light, #e5e7eb)',
      borderRadius: 'var(--radius-md, 8px)',
      padding: 'var(--space-4, 16px)',
      margin: 'var(--space-4, 16px) 0',
      backgroundColor: 'var(--color-bg-sidebar, #f9fafb)',
      fontFamily: 'var(--font-family-sans, Inter)',
    }}>
      <div contentEditable={false} style={{ userSelect: 'none' }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: 'var(--space-3, 12px)', 
          fontSize: 'var(--font-size-lg, 18px)',
          fontWeight: 'var(--font-weight-semibold, 600)',
          color: 'var(--color-text-primary, #111827)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </h3>
        
        {items.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary, #9ca3af)', fontSize: 'var(--font-size-sm, 14px)' }}>
            No entries found. Add {indexType === 'toc' ? 'headings' : 'captions'} to populate this list.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1, 4px)' }}>
            {items.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleScrollTo(item.targetPos)}
                style={{
                  paddingLeft: item.level ? `${(item.level - 1) * 20}px` : '0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'baseline',
                  fontSize: 'var(--font-size-md, 16px)',
                  color: 'var(--color-accent-primary, #2563eb)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                <span style={{ 
                  flex: 1, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {item.text}
                </span>
                <span style={{ 
                  flexShrink: 0, 
                  marginLeft: 'var(--space-2, 8px)', 
                  color: 'var(--color-text-tertiary, #9ca3af)',
                  borderBottom: '1px dotted var(--color-border-strong, #d1d5db)',
                  flexGrow: 1,
                  position: 'relative',
                  top: '-4px'
                }}></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
