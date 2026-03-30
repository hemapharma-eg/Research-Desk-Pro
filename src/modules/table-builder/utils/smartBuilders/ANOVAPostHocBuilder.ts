/**
 * ANOVAPostHocBuilder.ts — Smart Table Builder (Section 7F)
 * Generates ANOVA summary + post hoc comparison tables.
 */

import type { TableDocument, TBColumn, TBRow, TBCell, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeCell(value: string | number | null, formatType: TBCell['formatType'] = 'text', precision = 3): TBCell {
  return {
    id: uid(), rawValue: value,
    displayValue: typeof value === 'number' ? (formatType === 'p-value' ? (value < 0.001 ? '< 0.001' : value.toFixed(3)) : value.toFixed(precision)) : (value ?? ''),
    formatType, numericPrecision: precision, sourceBinding: null, manualOverride: false,
    noteMarkers: [], validationFlags: [], formatting: { ...DEFAULT_CELL_FORMATTING },
  };
}

export interface ANOVAConfig {
  omnibus: {
    source: string; // 'Between Groups', 'Within Groups', 'Total'
    ss: number;
    df: number;
    ms: number;
    fStatistic?: number;
    pValue?: number;
    etaSquared?: number;
  }[];
  postHoc?: {
    group1: string;
    group2: string;
    meanDifference: number;
    se?: number;
    pValue: number;
    ciLower?: number;
    ciUpper?: number;
    significant: boolean;
  }[];
  marginalMeans?: {
    group: string;
    mean: number;
    se: number;
    ciLower: number;
    ciUpper: number;
  }[];
  correctionMethod?: string;
  title?: string;
}

export function buildANOVATable(config: ANOVAConfig): Partial<TableDocument> {
  const columns: TBColumn[] = [
    { id: uid(), title: 'Source', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
    { id: uid(), title: 'SS', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } },
    { id: uid(), title: 'df', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } },
    { id: uid(), title: 'MS', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } },
    { id: uid(), title: 'F', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } },
    { id: uid(), title: 'P-value', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } },
    { id: uid(), title: 'η²', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } },
  ];

  const rows: TBRow[] = [];

  // Section: Omnibus
  rows.push({ id: uid(), cells: {}, sectionLabel: 'ANOVA Summary' });

  for (const item of config.omnibus) {
    const cells: Record<string, TBCell> = {};
    cells[columns[0].id] = makeCell(item.source);
    cells[columns[1].id] = makeCell(item.ss, 'number', 2);
    cells[columns[2].id] = makeCell(item.df, 'number', 0);
    cells[columns[3].id] = makeCell(item.ms, 'number', 2);
    cells[columns[4].id] = makeCell(item.fStatistic ?? null, 'number', 2);
    cells[columns[5].id] = makeCell(item.pValue ?? null, 'p-value');
    cells[columns[6].id] = makeCell(item.etaSquared ?? null, 'number');
    rows.push({ id: uid(), cells });
  }

  // Section: Post Hoc
  if (config.postHoc && config.postHoc.length > 0) {
    rows.push({ id: uid(), cells: {}, isSeparator: true });
    rows.push({ id: uid(), cells: {}, sectionLabel: `Post Hoc Comparisons${config.correctionMethod ? ` (${config.correctionMethod})` : ''}` });

    // Replace columns for post hoc — we reuse cols but repurpose semantics
    for (const ph of config.postHoc) {
      const cells: Record<string, TBCell> = {};
      cells[columns[0].id] = makeCell(`${ph.group1} vs ${ph.group2}`);
      cells[columns[1].id] = makeCell(ph.meanDifference, 'number', 2);
      cells[columns[2].id] = makeCell(ph.se ?? null, 'number', 3);
      cells[columns[3].id] = makeCell('');
      cells[columns[4].id] = makeCell('');
      cells[columns[5].id] = makeCell(ph.pValue, 'p-value');
      cells[columns[6].id] = makeCell(
        ph.ciLower !== undefined && ph.ciUpper !== undefined
          ? `[${ph.ciLower.toFixed(2)}, ${ph.ciUpper.toFixed(2)}]`
          : '', 'ci'
      );
      if (ph.significant) {
        cells[columns[5].id].noteMarkers = ['*'];
      }
      rows.push({ id: uid(), cells });
    }
  }

  const footnotes: Footnote[] = [
    { id: uid(), marker: '*', type: 'significance', text: 'Statistically significant at p < 0.05.', attachedTo: [] },
  ];
  if (config.correctionMethod) {
    footnotes.push({ id: uid(), marker: 'a', type: 'test-legend', text: `Post hoc p-values adjusted using ${config.correctionMethod} correction.`, attachedTo: [] });
  }

  return {
    name: config.title || 'ANOVA Results',
    title: config.title || 'Analysis of Variance Results',
    tableType: 'anova',
    columns, rows, footnotes,
    stylePreset: 'general-journal',
    styleOptions: { ...DEFAULT_TABLE_STYLE },
  };
}
