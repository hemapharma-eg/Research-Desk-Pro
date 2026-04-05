import { describe, it, expect } from 'vitest';
import { evaluateFormula, formatValue } from './DerivedCellEngine';
import { TBRow } from '../types/TableBuilderTypes';

describe('DerivedCellEngine', () => {
  describe('evaluateFormula', () => {
    const mockRows: TBRow[] = [
      { id: 'r1', cells: { c1: { id: 'cell1', rawValue: 10, displayValue: '', formatType: 'number', numericPrecision: 2, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null }, c2: { id: 'cell2', rawValue: 20, displayValue: '', formatType: 'number', numericPrecision: 2, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null } }, isSeparator: false, sectionLabel: '' },
      { id: 'r2', cells: { c1: { id: 'cell3', rawValue: 5, displayValue: '', formatType: 'number', numericPrecision: 2, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null }, c2: { id: 'cell4', rawValue: 15, displayValue: '', formatType: 'number', numericPrecision: 2, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null } }, isSeparator: false, sectionLabel: '' }
    ];

    it('evaluates N correctly', () => {
      const res = evaluateFormula('=N(c1)', mockRows, 'r1');
      expect(res.value).toBe(2);
    });

    it('evaluates MEAN correctly', () => {
      const res = evaluateFormula('=MEAN(c1)', mockRows, 'r1');
      expect(res.value).toBe(7.5); // (10 + 5) / 2
    });

    it('evaluates DIFF correctly', () => {
      // DIFF requires the current row context
      const res = evaluateFormula('=DIFF(c2, c1)', mockRows, 'r1');
      expect(res.value).toBe(10); // 20 - 10
    });

    it('returns error on unknown formula', () => {
      const res = evaluateFormula('=UNKNOWN(c1)', mockRows, 'r1');
      expect(res.error).toBe('Unknown function: UNKNOWN');
    });

    it('evaluates RATIO correctly and handles division by zero safely', () => {
      const mockRowsZero: TBRow[] = [
        { id: 'r1', cells: { c1: { id: 'cell1', rawValue: 5, displayValue: '', formatType: 'number', numericPrecision: 2, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null }, c2: { id: 'cell2', rawValue: 0, displayValue: '', formatType: 'number', numericPrecision: 2, noteMarkers: [], validationFlags: [], formatting: {} as any, manualOverride: false, sourceBinding: null } }, isSeparator: false, sectionLabel: '' }
      ];
      const res = evaluateFormula('=RATIO(c1, c2)', mockRowsZero, 'r1');
      expect(res.value).toBeNull(); // Because division by zero is shielded
    });
  });

  describe('formatValue', () => {
    it('formats percentages', () => {
      expect(formatValue(0.1234, 'percentage', 1)).toBe('12.3%');
    });
    
    it('formats p-values', () => {
      expect(formatValue(0.0001, 'p-value', 3)).toBe('< 0.001');
      expect(formatValue(0.045, 'p-value', 3)).toBe('0.045');
    });

    it('formats standard numbers', () => {
      expect(formatValue(10.555, 'number', 2)).toBe('10.56');
    });
  });
});
