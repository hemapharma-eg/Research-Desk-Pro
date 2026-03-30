/**
 * CorrelationMatrixBuilder.ts — Smart Table Builder (Section 7E)
 * Generates correlation matrix tables (Pearson, Spearman, Kendall).
 */

import type { TableDocument, TBColumn, TBRow, TBCell, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeCell(value: string | number | null, formatType: TBCell['formatType'] = 'number', precision = 3): TBCell {
  return {
    id: uid(), rawValue: value,
    displayValue: typeof value === 'number' ? value.toFixed(precision) : (value ?? ''),
    formatType, numericPrecision: precision, sourceBinding: null, manualOverride: false,
    noteMarkers: [], validationFlags: [], formatting: { ...DEFAULT_CELL_FORMATTING },
  };
}

export type MatrixStyle = 'full' | 'upper' | 'lower' | 'r-with-p' | 'r-with-stars';

export interface CorrelationConfig {
  method: 'pearson' | 'spearman' | 'kendall';
  variables: string[];
  matrix: number[][]; // r values
  pMatrix?: number[][];
  style?: MatrixStyle;
  sigThresholds?: number[];
  title?: string;
}

export function buildCorrelationTable(config: CorrelationConfig): Partial<TableDocument> {
  const { variables, matrix, pMatrix, method } = config;
  const style = config.style || 'r-with-stars';
  const thresholds = config.sigThresholds || [0.001, 0.01, 0.05];

  const columns: TBColumn[] = [
    { id: uid(), title: '', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
    ...variables.map(v => ({ id: uid(), title: v, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' as const } })),
  ];

  const rows: TBRow[] = [];

  for (let i = 0; i < variables.length; i++) {
    const cells: Record<string, TBCell> = {};
    cells[columns[0].id] = makeCell(variables[i], 'text');

    for (let j = 0; j < variables.length; j++) {
      const col = columns[j + 1];
      const r = matrix[i]?.[j];
      const p = pMatrix?.[i]?.[j];

      // Diagonal
      if (i === j) {
        cells[col.id] = makeCell('—', 'text');
        continue;
      }

      // Style-based masking
      if (style === 'upper' && i > j) { cells[col.id] = makeCell('', 'text'); continue; }
      if (style === 'lower' && i < j) { cells[col.id] = makeCell('', 'text'); continue; }

      if (r === undefined || r === null) {
        cells[col.id] = makeCell('', 'text');
        continue;
      }

      let display = r.toFixed(3);
      const markers: string[] = [];

      if (style === 'r-with-stars' && p !== undefined) {
        if (p < thresholds[0]) markers.push('***');
        else if (p < thresholds[1]) markers.push('**');
        else if (p < thresholds[2]) markers.push('*');
      }

      if (style === 'r-with-p' && p !== undefined) {
        display = `${r.toFixed(3)} (${p < 0.001 ? '< .001' : p.toFixed(3)})`;
      }

      const cell = makeCell(r, 'number', 3);
      cell.displayValue = display;
      cell.noteMarkers = markers;
      // Bold significant correlations
      if (p !== undefined && p < 0.05) {
        cell.formatting = { ...DEFAULT_CELL_FORMATTING, bold: true };
      }
      cells[col.id] = cell;
    }

    rows.push({ id: uid(), cells });
  }

  const footnotes: Footnote[] = [];
  if (style === 'r-with-stars') {
    footnotes.push({ id: uid(), marker: '*', type: 'significance', text: 'p < 0.05', attachedTo: [] });
    footnotes.push({ id: uid(), marker: '**', type: 'significance', text: 'p < 0.01', attachedTo: [] });
    footnotes.push({ id: uid(), marker: '***', type: 'significance', text: 'p < 0.001', attachedTo: [] });
  }
  footnotes.push({ id: uid(), marker: 'a', type: 'test-legend', text: `${method.charAt(0).toUpperCase() + method.slice(1)} correlation coefficients.`, attachedTo: [] });

  return {
    name: config.title || 'Correlation Matrix',
    title: config.title || `Correlation Matrix (${method.charAt(0).toUpperCase() + method.slice(1)})`,
    tableType: 'correlation',
    columns, rows, footnotes,
    stylePreset: 'general-journal',
    styleOptions: { ...DEFAULT_TABLE_STYLE },
  };
}
