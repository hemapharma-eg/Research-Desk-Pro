import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
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
}

export const CitationList = forwardRef((props: CitationListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  // Safe approach for resetting index when generic items prop changes without triggering exhaustive-deps lint rules
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

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
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
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
      maxHeight: '250px',
      overflowY: 'auto',
      minWidth: '300px'
    }}>
      {props.items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          style={{
            background: index === selectedIndex ? 'var(--color-bg-hover)' : 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'left',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', fontSize: '13px' }}>
            {item.label}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.fullRef.title}
          </span>
        </button>
      ))}
    </div>
  );
});
