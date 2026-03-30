/**
 * BaselineCharacteristicsBuilder.ts — Smart Table Builder (Section 7A)
 * Generates a "Table 1" baseline characteristics table from dataset info.
 */

import type { TableDocument, TBColumn, TBRow, TBCell, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeCell(value: string | number | null, formatType: TBCell['formatType'] = 'text', opts: Partial<TBCell> = {}): TBCell {
  return {
    id: uid(),
    rawValue: value,
    displayValue: typeof value === 'number' ? value.toFixed(opts.numericPrecision ?? 2) : (value ?? ''),
    formatType,
    numericPrecision: opts.numericPrecision ?? 2,
    sourceBinding: null,
    manualOverride: false,
    noteMarkers: opts.noteMarkers ?? [],
    validationFlags: [],
    formatting: { ...DEFAULT_CELL_FORMATTING, ...opts.formatting },
  };
}

export interface BaselineConfig {
  groupNames: string[];
  variables: {
    name: string;
    section?: string;
    type: 'continuous' | 'categorical';
    unit?: string;
    summaryStyle?: 'mean-sd' | 'median-iqr' | 'n-pct';
    categories?: string[];
    values?: Record<string, { mean?: number; sd?: number; median?: number; iqr?: [number, number]; n?: number; pct?: number; count?: number }>;
  }[];
  includeTotal?: boolean;
  includePValue?: boolean;
  includeTestName?: boolean;
  includeSMD?: boolean;
  title?: string;
  caption?: string;
}

export function buildBaselineTable(config: BaselineConfig): Partial<TableDocument> {
  const { groupNames, variables, includeTotal, includePValue, includeTestName, includeSMD, title, caption } = config;

  // Build columns
  const columns: TBColumn[] = [
    { id: uid(), title: 'Characteristic', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
  ];

  if (includeTotal) {
    columns.push({ id: uid(), title: 'Total', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }

  groupNames.forEach(name => {
    columns.push({ id: uid(), title: name, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  });

  if (includePValue) {
    columns.push({ id: uid(), title: 'P-value', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }

  if (includeTestName) {
    columns.push({ id: uid(), title: 'Test', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }

  if (includeSMD) {
    columns.push({ id: uid(), title: 'SMD', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }

  // Build rows
  const rows: TBRow[] = [];
  let currentSection = '';

  for (const v of variables) {
    // Section header
    if (v.section && v.section !== currentSection) {
      currentSection = v.section;
      rows.push({ id: uid(), cells: {}, sectionLabel: currentSection });
    }

    // Variable row
    const cells: Record<string, TBCell> = {};

    // Characteristic name
    cells[columns[0].id] = makeCell(v.name, 'text', { formatting: { ...DEFAULT_CELL_FORMATTING, bold: v.type === 'categorical' } });

    let colIdx = 1;
    if (includeTotal) colIdx++; // skip total for now

    // Group values
    groupNames.forEach(group => {
      const col = columns[colIdx++];
      const vals = v.values?.[group];
      if (!vals) {
        cells[col.id] = makeCell('-');
        return;
      }

      let display = '';
      if (v.type === 'continuous') {
        if (v.summaryStyle === 'median-iqr' && vals.median !== undefined) {
          display = `${vals.median.toFixed(1)} (${vals.iqr?.[0].toFixed(1)}–${vals.iqr?.[1].toFixed(1)})`;
        } else {
          display = `${(vals.mean ?? 0).toFixed(1)} ± ${(vals.sd ?? 0).toFixed(1)}`;
        }
      } else {
        display = `${vals.count ?? vals.n ?? 0} (${(vals.pct ?? 0).toFixed(1)}%)`;
      }
      cells[col.id] = makeCell(display, v.type === 'continuous' ? 'number' : 'text');
    });

    // P-value, Test, SMD placeholders 
    if (includePValue) cells[columns[colIdx++].id] = makeCell('', 'p-value');
    if (includeTestName) cells[columns[colIdx++].id] = makeCell('', 'text');
    if (includeSMD) cells[columns[colIdx++].id] = makeCell('', 'number');

    rows.push({ id: uid(), cells });

    // If categorical, add sub-rows for categories
    if (v.type === 'categorical' && v.categories) {
      for (const cat of v.categories) {
        const subCells: Record<string, TBCell> = {};
        subCells[columns[0].id] = makeCell(`  ${cat}`, 'text', { formatting: { ...DEFAULT_CELL_FORMATTING, indent: 1 } });
        let ci = 1;
        if (includeTotal) ci++;
        groupNames.forEach(group => {
          const col = columns[ci++];
          subCells[col.id] = makeCell('', 'text');
        });
        if (includePValue) subCells[columns[ci++].id] = makeCell('', 'p-value');
        if (includeTestName) subCells[columns[ci++].id] = makeCell('', 'text');
        if (includeSMD) subCells[columns[ci++].id] = makeCell('', 'number');
        rows.push({ id: uid(), cells: subCells, indent: 1 });
      }
    }
  }

  // Default footnotes
  const footnotes: Footnote[] = [
    { id: uid(), marker: 'a', type: 'abbreviation', text: 'Values are mean ± SD, median (IQR), or n (%).', attachedTo: [] },
  ];

  return {
    name: title || 'Baseline Characteristics',
    title: title || 'Baseline Characteristics of Study Participants',
    caption: caption || '',
    tableType: 'baseline',
    tableNumber: 'Table 1',
    columns,
    rows,
    footnotes,
    stylePreset: 'general-journal',
    styleOptions: { ...DEFAULT_TABLE_STYLE },
  };
}
