/**
 * ContingencyTableBuilder.ts — Smart Table Builder (Section 7G)
 * Generates contingency (cross-tabulation) tables.
 */

import type { TableDocument, TBColumn, TBRow, TBCell, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeCell(value: string | number | null, formatType: TBCell['formatType'] = 'text', precision = 1): TBCell {
  return {
    id: uid(), rawValue: value,
    displayValue: typeof value === 'number' ? value.toFixed(precision) : (value ?? ''),
    formatType, numericPrecision: precision, sourceBinding: null, manualOverride: false,
    noteMarkers: [], validationFlags: [], formatting: { ...DEFAULT_CELL_FORMATTING },
  };
}

export interface ContingencyConfig {
  rowVariable: string;
  colVariable: string;
  rowCategories: string[];
  colCategories: string[];
  counts: number[][]; // [row][col]
  includeRowPercent?: boolean;
  includeColPercent?: boolean;
  includeTotals?: boolean;
  chiSquare?: number;
  chiDf?: number;
  chiP?: number;
  fisherP?: number;
  orValue?: number;
  rrValue?: number;
  orCI?: [number, number];
  title?: string;
}

export function buildContingencyTable(config: ContingencyConfig): Partial<TableDocument> {
  const { rowCategories, colCategories, counts, includeRowPercent, includeColPercent, includeTotals } = config;

  const columns: TBColumn[] = [
    { id: uid(), title: config.rowVariable, width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
  ];

  colCategories.forEach(cat => {
    columns.push({ id: uid(), title: cat, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  });

  if (includeTotals) {
    columns.push({ id: uid(), title: 'Total', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center', bold: true } });
  }

  const rows: TBRow[] = [];
  const colTotals = new Array(colCategories.length).fill(0);
  const grandTotal = counts.flat().reduce((a, b) => a + b, 0);

  for (let i = 0; i < rowCategories.length; i++) {
    const rowTotal = counts[i]?.reduce((a, b) => a + b, 0) || 0;
    const cells: Record<string, TBCell> = {};
    cells[columns[0].id] = makeCell(rowCategories[i]);

    for (let j = 0; j < colCategories.length; j++) {
      const count = counts[i]?.[j] || 0;
      colTotals[j] += count;

      let display = String(count);
      if (includeRowPercent) {
        const pct = rowTotal > 0 ? (count / rowTotal * 100).toFixed(1) : '0.0';
        display = `${count} (${pct}%)`;
      } else if (includeColPercent) {
        // Will compute after all rows
        display = String(count);
      }
      cells[columns[j + 1].id] = makeCell(display);
    }

    if (includeTotals) {
      cells[columns[columns.length - 1].id] = makeCell(rowTotal, 'number', 0);
    }

    rows.push({ id: uid(), cells });
  }

  // Totals row
  if (includeTotals) {
    const totalCells: Record<string, TBCell> = {};
    totalCells[columns[0].id] = makeCell('Total', 'text');
    for (let j = 0; j < colCategories.length; j++) {
      totalCells[columns[j + 1].id] = makeCell(colTotals[j], 'number', 0);
    }
    totalCells[columns[columns.length - 1].id] = makeCell(grandTotal, 'number', 0);
    rows.push({ id: uid(), cells: totalCells, isSubtotal: true });
  }

  // Footnotes for test results
  const footnotes: Footnote[] = [];
  if (config.chiSquare !== undefined) {
    footnotes.push({
      id: uid(), marker: 'a', type: 'test-legend',
      text: `χ²(${config.chiDf}) = ${config.chiSquare.toFixed(2)}, p ${config.chiP !== undefined && config.chiP < 0.001 ? '< 0.001' : `= ${config.chiP?.toFixed(3)}`}.`,
      attachedTo: [],
    });
  }
  if (config.fisherP !== undefined) {
    footnotes.push({ id: uid(), marker: 'b', type: 'test-legend', text: `Fisher's exact test: p = ${config.fisherP < 0.001 ? '< 0.001' : config.fisherP.toFixed(3)}.`, attachedTo: [] });
  }
  if (config.orValue !== undefined) {
    let orText = `OR = ${config.orValue.toFixed(2)}`;
    if (config.orCI) orText += ` (95% CI: ${config.orCI[0].toFixed(2)}–${config.orCI[1].toFixed(2)})`;
    footnotes.push({ id: uid(), marker: 'c', type: 'test-legend', text: orText + '.', attachedTo: [] });
  }

  return {
    name: config.title || 'Contingency Table',
    title: config.title || `${config.rowVariable} × ${config.colVariable}`,
    tableType: 'crosstab',
    columns, rows, footnotes,
    stylePreset: 'general-journal',
    styleOptions: { ...DEFAULT_TABLE_STYLE },
  };
}
