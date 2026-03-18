import { useState, forwardRef, useImperativeHandle } from 'react';
import type { CrossRefItem } from '../extensions/crossRefSuggestion';

interface CrossRefListProps {
  items: CrossRefItem[];
  command: (item: { targetId: string; labelType: string; number: number }) => void;
}

export const CrossRefList = forwardRef((props: CrossRefListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({
        targetId: item.id,
        labelType: item.labelType,
        number: item.number,
      });
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

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
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
        backgroundColor: 'var(--color-bg-app)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '320px',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)'
      }}>
        No figures or tables found in document.
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-app)',
      border: '1px solid var(--color-border-light)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      width: '320px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: 'var(--space-2) var(--space-3)',
        borderBottom: '1px solid var(--color-border-light)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-tertiary)',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        Insert Cross-Reference
      </div>
      
      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {props.items.map((item, index) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: index === selectedIndex ? 'var(--color-bg-hover)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              borderBottom: index !== props.items.length - 1 ? '1px solid var(--color-border-light)' : 'none'
            }}
          >
            <span style={{ fontWeight: '600', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {item.labelType} {item.number}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.text || 'No caption text'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
