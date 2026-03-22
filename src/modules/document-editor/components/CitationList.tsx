import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import type { SuggestionKeyDownProps } from '@tiptap/suggestion';

interface CitationItem {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullRef: any;
}

interface CitationListProps {
  items: CitationItem[];
  command: (item: { id: string; label: string }) => void;
  query?: string;
}

export const CitationList = forwardRef((props: CitationListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedBasket, setSelectedBasket] = useState<CitationItem[]>([]);
  const [localFilter, setLocalFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [allReferences, setAllReferences] = useState<CitationItem[]>([]);

  // Load ALL references once on mount so we can filter locally
  useEffect(() => {
    window.api.getReferences().then((res: { success: boolean; data?: { id: string; authors?: string; title?: string; year?: string }[] }) => {
      if (res.success && res.data) {
        setAllReferences(res.data.map(ref => ({
          id: ref.id,
          label: `${ref.authors?.split(',')[0] || 'Unknown'} et al., ${ref.year || '?'}`,
          fullRef: ref
        })));
      }
    });
  }, []);

  // Use allReferences with localFilter for display, falling back to props.items initially
  const displayItems = allReferences.length > 0
    ? allReferences.filter(item => {
        if (!localFilter) return true;
        const q = localFilter.toLowerCase();
        return (
          item.fullRef.authors?.toLowerCase().includes(q) ||
          item.fullRef.title?.toLowerCase().includes(q) ||
          item.fullRef.year?.includes(q) ||
          item.label.toLowerCase().includes(q)
        );
      })
    : props.items;

  const toggleToBasket = (item: CitationItem) => {
    if (selectedBasket.find(i => i.id === item.id)) {
      setSelectedBasket(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedBasket(prev => [...prev, item]);
    }
    // Clear search and refocus for next search
    setLocalFilter('');
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleInsert = () => {
    if (selectedBasket.length === 0) return;
    const combinedId = selectedBasket.map(i => i.id).join(',');
    const combinedLabel = selectedBasket.map(i => i.label).join('; ');
    props.command({ id: combinedId, label: combinedLabel });
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + displayItems.length - 1) % Math.max(displayItems.length, 1));
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % Math.max(displayItems.length, 1));
  };

  const enterHandler = () => {
    const item = displayItems[selectedIndex];
    if (item) {
      toggleToBasket(item);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSelectedIndex(0);
  }, [localFilter]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        if (event.shiftKey && selectedBasket.length > 0) {
          handleInsert();
        } else {
          enterHandler();
        }
        return true;
      }
      return false;
    },
  }));

  // Auto-focus the search input on mount
  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  if (displayItems.length === 0 && selectedBasket.length === 0) {
    return (
      <div style={{
        background: 'var(--color-bg-app)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-tertiary)'
      }}>
        No references found
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--color-bg-app)',
      border: '1px solid var(--color-border-strong)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-1)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxHeight: '400px',
      overflowY: 'auto',
      minWidth: '380px'
    }}>
      {/* Staged basket */}
      {selectedBasket.length > 0 && (
        <div style={{ padding: '6px', background: 'var(--color-bg-sidebar)', borderRadius: '4px', margin: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>
            Staged ({selectedBasket.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
            {selectedBasket.map(item => (
              <span key={item.id} style={{ background: 'var(--color-accent-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                <button onClick={(e) => { e.stopPropagation(); toggleToBasket(item); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '10px', lineHeight: 1 }}>✕</button>
              </span>
            ))}
          </div>
          <button onClick={handleInsert} style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '100%' }}>
            ✓ Insert {selectedBasket.length === 1 ? 'Citation' : `Cluster (${selectedBasket.length})`}
          </button>
        </div>
      )}

      {/* Editable search input */}
      <div style={{ padding: '4px', margin: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-surface)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border-strong)' }}>
          <span style={{ marginRight: '8px', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            value={localFilter}
            onChange={(e) => setLocalFilter(e.target.value)}
            placeholder="Search references by author, title, year..."
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--color-text-primary)' }}
            onKeyDown={(e) => {
              // Prevent TipTap from intercepting our keystrokes
              e.stopPropagation();
              if (e.key === 'Enter') {
                if (e.shiftKey && selectedBasket.length > 0) {
                  handleInsert();
                } else {
                  enterHandler();
                }
              }
              if (e.key === 'Escape') {
                // Let the popup close
              }
            }}
          />
        </div>
      </div>

      {/* Reference list */}
      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {displayItems.map((item, index) => {
          const isInBasket = !!selectedBasket.find(i => i.id === item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleToBasket(item)}
              style={{
                background: isInBasket ? 'rgba(59, 130, 246, 0.1)' : (index === selectedIndex ? 'var(--color-bg-hover)' : 'transparent'),
                border: isInBasket ? '1px solid var(--color-accent-primary)' : '1px solid transparent',
                outline: 'none',
                textAlign: 'left',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', fontSize: '13px' }}>
                  {item.label}
                </span>
                {isInBasket && <span style={{ color: 'var(--color-accent-primary)', fontSize: '13px' }}>✓</span>}
              </div>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {item.fullRef.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
