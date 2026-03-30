/**
 * Table Builder & Results Reporting Suite — Derived Cell Engine (Section 7)
 * Implements a limited formula evaluation system for table-oriented derived cells.
 */

import type { TBCell, TBColumn, TBRow } from '../types/TableBuilderTypes';

type FormulaResult = { value: string | number | null; error?: string };

/**
 * Extracts raw values from a specific column in a set of rows.
 */
function extractColValues(rows: TBRow[], colId: string): number[] {
  const vals: number[] = [];
  for (const r of rows) {
    if (r.isSeparator || r.sectionLabel) continue;
    const cell = r.cells[colId];
    if (cell && typeof cell.rawValue === 'number') {
      vals.push(cell.rawValue);
    } else if (cell && typeof cell.rawValue === 'string') {
      const parsed = parseFloat(cell.rawValue);
      if (!isNaN(parsed)) vals.push(parsed);
    }
  }
  return vals;
}

/**
 * Parses and evaluates simple derived cell functions.
 * Expected formats:
 * =MEAN(colId)
 * =SD(colId)
 * =N(colId)
 * =MEDIAN(colId)
 * =DIFF(colA, colB)   // simple difference
 * =RATIO(colA, colB)  // division
 * =PCT(cell, total)
 */
export function evaluateFormula(formula: string, rows: TBRow[], currentRowId: string): FormulaResult {
  const upper = formula.trim().toUpperCase();
  if (!upper.startsWith('=')) return { value: formula };

  const match = upper.match(/^=([A-Z_]+)\(([^)]+)\)$/);
  if (!match) return { value: null, error: 'Invalid formula syntax' };

  const [, funcName, argsStr] = match;
  const args = argsStr.split(',').map(s => s.trim());

  switch (funcName) {
    case 'N': {
      const vals = extractColValues(rows, args[0]);
      return { value: vals.length };
    }
    case 'MEAN': {
      const vals = extractColValues(rows, args[0]);
      if (vals.length === 0) return { value: null };
      const sum = vals.reduce((a, b) => a + b, 0);
      return { value: sum / vals.length };
    }
    case 'SD': {
      const vals = extractColValues(rows, args[0]);
      if (vals.length < 2) return { value: null };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1);
      return { value: Math.sqrt(variance) };
    }
    case 'SEM': {
      const vals = extractColValues(rows, args[0]);
      if (vals.length < 2) return { value: null };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1);
      return { value: Math.sqrt(variance) / Math.sqrt(vals.length) };
    }
    case 'MIN': {
      const vals = extractColValues(rows, args[0]);
      if (vals.length === 0) return { value: null };
      return { value: Math.min(...vals) };
    }
    case 'MAX': {
      const vals = extractColValues(rows, args[0]);
      if (vals.length === 0) return { value: null };
      return { value: Math.max(...vals) };
    }
    case 'MEDIAN': {
      const vals = extractColValues(rows, args[0]).slice().sort((a,b) => a - b);
      if (vals.length === 0) return { value: null };
      const mid = Math.floor(vals.length / 2);
      return { value: vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2 };
    }
    case 'DIFF': {
      if (args.length !== 2) return { value: null, error: 'DIFF requires 2 arguments' };
      const row = rows.find(r => r.id === currentRowId);
      if (!row) return { value: null, error: 'Row not bounds' };
      const vA = parseFloat(String(row.cells[args[0]]?.rawValue || NaN));
      const vB = parseFloat(String(row.cells[args[1]]?.rawValue || NaN));
      if (isNaN(vA) || isNaN(vB)) return { value: null };
      return { value: vA - vB };
    }
    case 'RATIO': {
      if (args.length !== 2) return { value: null, error: 'RATIO requires 2 arguments' };
      const row = rows.find(r => r.id === currentRowId);
      if (!row) return { value: null };
      const vA = parseFloat(String(row.cells[args[0]]?.rawValue || NaN));
      const vB = parseFloat(String(row.cells[args[1]]?.rawValue || NaN));
      if (isNaN(vA) || isNaN(vB) || vB === 0) return { value: null };
      return { value: vA / vB };
    }
    default:
      return { value: null, error: `Unknown function: ${funcName}` };
  }
}

/**
 * Formats a value using a target precision
 */
export function formatValue(value: string | number | null, formatType: TBCell['formatType'], decimals: number): string {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'number') {
    if (formatType === 'percentage') return (value * 100).toFixed(decimals) + '%';
    if (formatType === 'p-value') {
      if (value < 0.001) return '< 0.001';
      return value.toFixed(decimals);
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  // If it's a string, see if it happens to be numeric and needs formatting
  if (!isNaN(parseFloat(value as string)) && (formatType === 'number' || formatType === 'p-value')) {
    const num = parseFloat(value as string);
    if (formatType === 'p-value' && num < 0.001) return '< 0.001';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  return String(value);
}
