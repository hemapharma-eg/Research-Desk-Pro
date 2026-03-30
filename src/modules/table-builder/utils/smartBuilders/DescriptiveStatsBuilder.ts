/**
 * DescriptiveStatsBuilder.ts — Smart Table Builder (Section 7B)
 * Generates descriptive statistics tables.
 */

import type { TableDocument, TBColumn, TBRow, TBCell } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeCell(value: string | number | null, formatType: TBCell['formatType'] = 'text', precision = 2): TBCell {
  return {
    id: uid(), rawValue: value,
    displayValue: typeof value === 'number' ? value.toFixed(precision) : (value ?? ''),
    formatType, numericPrecision: precision, sourceBinding: null, manualOverride: false,
    noteMarkers: [], validationFlags: [], formatting: { ...DEFAULT_CELL_FORMATTING },
  };
}

export interface DescriptiveConfig {
  variables: {
    name: string;
    groups?: { name: string; n: number; mean: number; sd: number; sem?: number; median?: number; iqr?: [number, number]; min?: number; max?: number; ciLower?: number; ciUpper?: number }[];
  }[];
  includeColumns?: ('n' | 'mean' | 'sd' | 'sem' | 'median' | 'iqr' | 'min' | 'max' | 'ci')[];
  title?: string;
}

export function buildDescriptiveTable(config: DescriptiveConfig): Partial<TableDocument> {
  const include = config.includeColumns || ['n', 'mean', 'sd', 'median', 'min', 'max'];
  const columns: TBColumn[] = [
    { id: uid(), title: 'Variable', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
  ];

  // Add stat columns
  const colMap: Record<string, string> = {};
  const addCol = (key: string, title: string) => {
    if (!include.includes(key as any)) return;
    const id = uid();
    columns.push({ id, title, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });
    colMap[key] = id;
  };

  addCol('n', 'N');
  addCol('mean', 'Mean');
  addCol('sd', 'SD');
  addCol('sem', 'SEM');
  addCol('median', 'Median');
  addCol('iqr', 'IQR');
  addCol('min', 'Min');
  addCol('max', 'Max');
  addCol('ci', '95% CI');

  const rows: TBRow[] = [];

  for (const v of config.variables) {
    const groups = v.groups || [{ name: v.name, n: 0, mean: 0, sd: 0 }];
    for (const g of groups) {
      const cells: Record<string, TBCell> = {};
      cells[columns[0].id] = makeCell(groups.length > 1 ? `${v.name} (${g.name})` : v.name);

      if (colMap['n']) cells[colMap['n']] = makeCell(g.n, 'number', 0);
      if (colMap['mean']) cells[colMap['mean']] = makeCell(g.mean, 'number');
      if (colMap['sd']) cells[colMap['sd']] = makeCell(g.sd, 'number');
      if (colMap['sem'] && g.sem !== undefined) cells[colMap['sem']] = makeCell(g.sem, 'number', 3);
      if (colMap['median'] && g.median !== undefined) cells[colMap['median']] = makeCell(g.median, 'number');
      if (colMap['iqr'] && g.iqr) cells[colMap['iqr']] = makeCell(`${g.iqr[0].toFixed(1)}–${g.iqr[1].toFixed(1)}`);
      if (colMap['min'] && g.min !== undefined) cells[colMap['min']] = makeCell(g.min, 'number');
      if (colMap['max'] && g.max !== undefined) cells[colMap['max']] = makeCell(g.max, 'number');
      if (colMap['ci'] && g.ciLower !== undefined && g.ciUpper !== undefined) {
        cells[colMap['ci']] = makeCell(`[${g.ciLower.toFixed(2)}, ${g.ciUpper.toFixed(2)}]`, 'ci');
      }

      rows.push({ id: uid(), cells });
    }
  }

  return {
    name: config.title || 'Descriptive Statistics',
    title: config.title || 'Descriptive Statistics',
    tableType: 'descriptive',
    columns, rows,
    footnotes: [],
    stylePreset: 'general-journal',
    styleOptions: { ...DEFAULT_TABLE_STYLE },
  };
}
