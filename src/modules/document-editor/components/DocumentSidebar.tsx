import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface OutlineItem {
  id: string;
  level: number;
  text: string;
}

interface DocumentSidebarProps {
  editor: Editor | null;
}

export function DocumentSidebar({ editor }: DocumentSidebarProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateOutline = () => {
      const items: OutlineItem[] = [];
      
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          // TipTap doesn't add IDs to headings by default unless configured.
          // We can generate one or just use position for scrolling.
          items.push({
            id: `heading-${pos}`,
            level: node.attrs.level,
            text: node.textContent,
          });
        }
      });
      setOutline(items);
    };

    editor.on('update', updateOutline);
    // Initial extraction
    updateOutline();

    return () => {
      editor.off('update', updateOutline);
    };
  }, [editor]);

  const handleScrollTo = (id: string) => {
    if (!editor) return;
    const pos = parseInt(id.replace('heading-', ''), 10);
    
    // Create a transaction to scroll to the node
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

  return (
    <div style={{
      width: '250px',
      borderLeft: '1px solid var(--color-border-light)',
      backgroundColor: 'var(--color-bg-sidebar)',
      padding: 'var(--space-4)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }}>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Document Outline
      </h3>
      
      {outline.length === 0 ? (
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
          Add headings to your document to see the outline here.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {outline.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScrollTo(item.id)}
              style={{
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-1) 0',
                paddingLeft: `${(item.level - 1) * 12}px`,
                fontSize: item.level === 1 ? 'var(--font-size-md)' : 'var(--font-size-sm)',
                fontWeight: item.level === 1 ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                color: item.level === 1 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                lineHeight: 1.4,
                display: 'block',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={item.text}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
