import React, { useState, useEffect, useRef } from 'react';
import type { TBCell } from '../../types/TableBuilderTypes';

interface CellEditorProps {
  cell: TBCell;
  onSave: (newDisplayValue: string, newRawValue: string | number | null) => void;
  onCancel: () => void;
  style: React.CSSProperties;
}

export const CellEditor: React.FC<CellEditorProps> = ({ cell, onSave, onCancel, style }) => {
  const [value, setValue] = useState(cell.displayValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const parsed = parseFloat(value);
      onSave(value, isNaN(parsed) ? value : parsed);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      style={{
        ...style,
        position: 'absolute',
        boxSizing: 'border-box',
        margin: 0,
        outline: '2px solid var(--color-accent-primary)',
        border: 'none',
        background: 'var(--color-bg-surface)',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        padding: '0 4px',
        zIndex: 100
      }}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const parsed = parseFloat(value);
        onSave(value, isNaN(parsed) ? value : parsed);
      }}
    />
  );
};
