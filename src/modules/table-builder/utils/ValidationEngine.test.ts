import { describe, it, expect } from 'vitest';
import { validateTable } from './ValidationEngine';
import type { TableDocument } from '../types/TableBuilderTypes';

describe('ValidationEngine', () => {
  it('flags duplicate column names', () => {
    const table: TableDocument = {
      id: '1',
      title: 'Table',
      name: 'Test',
      tableType: 'custom',
      tableNumber: '1',
      category: '',
      stylePreset: 'general-journal',
      caption: 'Valid cap',
      keywords: '',
      notesToSelf: '',
      createdAt: 0,
      updatedAt: 0,
      columns: [
        { id: 'c1', title: 'Age', width: 'auto', hidden: false, locked: false, defaultFormat: {} },
        { id: 'c2', title: 'Age', width: 'auto', hidden: false, locked: false, defaultFormat: {} },
      ],
      rows: [],
      footnotes: [],
      styleOptions: {} as any
    };

    const errors = validateTable(table);
    // Should have duplicate column error
    expect(errors.some(e => e.category === 'Duplicate Columns')).toBe(true);
  });

  it('flags inconsistent decimals', () => {
    const table: TableDocument = {
      id: '1', title: 'Table', name: '', tableType: 'custom', tableNumber: '1', category: '', stylePreset: 'general-journal', caption: 'cap', keywords: '', notesToSelf: '', createdAt: 0, updatedAt: 0,
      columns: [{ id: 'c1', title: 'Score', width: 'auto', hidden: false, locked: false, defaultFormat: {} }],
      rows: [
        { id: 'r1', cells: { c1: { id: 'cell1', rawValue: 1.23, displayValue: '1.23', formatType: 'number', numericPrecision: 2, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null } }, isSeparator: false, sectionLabel: '' },
        { id: 'r2', cells: { c1: { id: 'cell2', rawValue: 1.2, displayValue: '1.2', formatType: 'number', numericPrecision: 1, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null } }, isSeparator: false, sectionLabel: '' }
      ],
      footnotes: [],
      styleOptions: {} as any
    };

    const errors = validateTable(table);
    expect(errors.some(e => e.category === 'Inconsistent Decimals')).toBe(true);
  });
});
