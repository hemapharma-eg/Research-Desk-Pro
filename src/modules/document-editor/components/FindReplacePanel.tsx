import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface FindReplacePanelProps {
  editor: Editor;
  onClose: () => void;
}

export function FindReplacePanel({ editor, onClose }: FindReplacePanelProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Update extension when findText changes
  useEffect(() => {
    if (findText) {
      editor.commands.setSearchTerm(findText);
    } else {
      editor.commands.clearSearch();
    }
  }, [findText, editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor.commands.clearSearch();
    };
  }, [editor]);

  const stats = Object.keys(editor.storage).includes('searchAndReplace') 
    ? (editor.storage as any).searchAndReplace 
    : { results: [], currentIndex: -1 };
    
  const total = stats.results?.length || 0;
  const current = total > 0 ? (stats.currentIndex || 0) + 1 : 0;

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '320px',
      backgroundColor: 'var(--color-bg-app, #ffffff)',
      border: '1px solid var(--color-border-light, #e5e7eb)',
      borderRadius: 'var(--radius-md, 8px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      padding: 'var(--space-4, 16px)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3, 12px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm, 14px)', color: 'var(--color-text-primary, #111827)' }}>Find and Replace</h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary, #9ca3af)' }}>
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2, 8px)' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Find..."
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              paddingRight: '60px',
              borderRadius: '4px',
              border: '1px solid var(--color-border-light, #e5e7eb)',
              backgroundColor: 'var(--color-bg-input, #f9fafb)',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
          <span style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: 'var(--color-text-tertiary, #9ca3af)',
            pointerEvents: 'none',
          }}>
            {current} / {total}
          </span>
        </div>

        <input
          type="text"
          placeholder="Replace with..."
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: '4px',
            border: '1px solid var(--color-border-light, #e5e7eb)',
            backgroundColor: 'var(--color-bg-input, #f9fafb)',
            fontSize: '13px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => editor.commands.prevSearchResult()}
            disabled={total === 0}
            style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '13px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-hover, #f3f4f6)', cursor: total === 0 ? 'not-allowed' : 'pointer', opacity: total === 0 ? 0.5 : 1 }}
          >
            ↑
          </button>
          <button 
            onClick={() => editor.commands.nextSearchResult()}
            disabled={total === 0}
            style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '13px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-hover, #f3f4f6)', cursor: total === 0 ? 'not-allowed' : 'pointer', opacity: total === 0 ? 0.5 : 1 }}
          >
            ↓
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => editor.commands.replace(replaceText)}
            disabled={total === 0}
            style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '13px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-hover, #f3f4f6)', cursor: total === 0 ? 'not-allowed' : 'pointer', opacity: total === 0 ? 0.5 : 1 }}
          >
            Replace
          </button>
          <button 
            onClick={() => editor.commands.replaceAll(replaceText)}
            disabled={total === 0}
            style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '13px', border: 'none', background: 'var(--color-accent-primary, #2563eb)', color: 'white', cursor: total === 0 ? 'not-allowed' : 'pointer', opacity: total === 0 ? 0.5 : 1 }}
          >
            All
          </button>
        </div>
      </div>
    </div>
  );
}
