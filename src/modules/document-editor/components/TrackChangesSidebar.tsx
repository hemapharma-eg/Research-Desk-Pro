import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

interface ChangeItem {
  id: string;
  type: 'insertion' | 'deletion';
  text: string;
  from: number;
  to: number;
}

interface TrackChangesSidebarProps {
  editor: Editor | null;
  onClose?: () => void;
}

export function TrackChangesSidebar({ editor, onClose }: TrackChangesSidebarProps) {
  const [changes, setChanges] = useState<ChangeItem[]>([]);

  const extractChanges = () => {
    if (!editor) return;
    const items: ChangeItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText) {
        node.marks.forEach(mark => {
          if (mark.type.name === 'insertion') {
            items.push({
              id: `ins-${pos}`,
              type: 'insertion',
              text: node.text || '',
              from: pos,
              to: pos + node.nodeSize
            });
          } else if (mark.type.name === 'deletion') {
            items.push({
              id: `del-${pos}`,
              type: 'deletion',
              text: node.text || '',
              from: pos,
              to: pos + node.nodeSize
            });
          }
        });
      }
    });
    setChanges(items);
  };

  useEffect(() => {
    if (!editor) return;
    extractChanges();
    editor.on('transaction', extractChanges);
    return () => {
      editor.off('transaction', extractChanges);
    };
  }, [editor]);

  const handleAccept = (item: ChangeItem) => {
    if (!editor) return;
    editor.chain().acceptChange(item.from).run();
  };

  const handleReject = (item: ChangeItem) => {
    if (!editor) return;
    editor.chain().rejectChange(item.from).run();
  };

  return (
    <div style={{
      width: '320px',
      backgroundColor: 'var(--color-bg-sidebar)',
      borderLeft: '1px solid var(--color-border-strong)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>Review Changes</h3>
        {onClose && (
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>×</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
        {changes.length === 0 ? (
          <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 'var(--space-8)' }}>
            No tracked changes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {changes.map(item => (
              <div key={item.id} style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface)',
                borderLeft: `4px solid ${item.type === 'insertion' ? '#4caf50' : '#f44336'}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: item.type === 'insertion' ? '#2e7d32' : '#c62828', marginBottom: 'var(--space-1)' }}>
                  {item.type === 'insertion' ? 'Insertion' : 'Deletion'}
                </div>
                <div style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-3)',
                  whiteSpace: 'pre-wrap',
                  textDecoration: item.type === 'deletion' ? 'line-through' : 'none'
                }}>
                  "{item.text}"
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button 
                    onClick={() => handleAccept(item)}
                    style={{ flex: 1, padding: 'var(--space-1)', fontSize: 'var(--font-size-xs)', backgroundColor: '#e6ffed', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    ✔ Accept
                  </button>
                  <button 
                    onClick={() => handleReject(item)}
                    style={{ flex: 1, padding: 'var(--space-1)', fontSize: 'var(--font-size-xs)', backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    ✖ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
