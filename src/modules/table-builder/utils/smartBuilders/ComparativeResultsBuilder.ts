/**
 * ComparativeResultsBuilder.ts — Smart Table Builder (Section 7C)
 * Generates comparative results tables for t-test, ANOVA, Mann-Whitney, chi-square, etc.
 */

import type { TableDocument, TBColumn, TBRow, TBCell, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeCell(value: string | number | null, formatType: TBCell['formatType'] = 'text', precision = 2): TBCell {
  return {
    id: uid(), rawValue: value,
    displayValue: typeof value === 'number' ? (formatType === 'p-value' ? (value < 0.001 ? '< 0.001' : value.toFixed(3)) : value.toFixed(precision)) : (value ?? ''),
    formatType, numericPrecision: precision, sourceBinding: null, manualOverride: false,
    noteMarkers: [], validationFlags: [], formatting: { ...DEFAULT_CELL_FORMATTING },
  };
}

export interface ComparativeConfig {
  comparisons: {
    outcome: string;
    groups: { name: string; summary: string }[];
    testUsed: string;
    statistic: number;
    statisticLabel: string;
    df?: string;
    pValue: number;
    effectSize?: number;
    effectSizeLabel?: string;
    ci?: [number, number];
    postHoc?: string;
    significant: boolean;
  }[];
  includeEffectSize?: boolean;
  includeCI?: boolean;
  includePostHoc?: boolean;
  includeSignificanceMark?: boolean;
  title?: string;
}

export function buildComparativeTable(config: ComparativeConfig): Partial<TableDocument> {
  const { comparisons } = config;
  const maxGroups = Math.max(...comparisons.map(c => c.groups.length), 2);

  const columns: TBColumn[] = [
    { id: uid(), title: 'Outcome', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
  ];

  // Group summary columns
  const groupNames = comparisons[0]?.groups.map(g => g.name) || ['Group 1', 'Group 2'];
  groupNames.forEach(name => {
    columns.push({ id: uid(), title: name, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  });

  columns.push({ id: uid(), title: 'Test', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  columns.push({ id: uid(), title: 'Statistic', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });

  if (comparisons[0]?.df !== undefined) {
    columns.push({ id: uid(), title: 'df', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }

  columns.push({ id: uid(), title: 'P-value', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });

  if (config.includeEffectSize) {
    columns.push({ id: uid(), title: comparisons[0]?.effectSizeLabel || 'Effect Size', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });
  }

  if (config.includeCI) {
    columns.push({ id: uid(), title: '95% CI', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }

  if (config.includePostHoc) {
    columns.push({ id: uid(), title: 'Post Hoc', width: 'auto', locked: false, hidden: false, defaultFormat: {} });
  }

  const rows: TBRow[] = [];

  for (const comp of comparisons) {
    const cells: Record<string, TBCell> = {};
    let ci = 0;

    cells[columns[ci++].id] = makeCell(comp.outcome);
    comp.groups.forEach((g) => {
      cells[columns[ci++].id] = makeCell(g.summary);
    });
    cells[columns[ci++].id] = makeCell(comp.testUsed);
    cells[columns[ci++].id] = makeCell(comp.statistic, 'number');
    if (comp.df !== undefined) cells[columns[ci++].id] = makeCell(comp.df);
    cells[columns[ci++].id] = makeCell(comp.pValue, 'p-value', 3);

    if (config.includeEffectSize) {
      cells[columns[ci++].id] = makeCell(comp.effectSize ?? null, 'number');
    }
    if (config.includeCI && comp.ci) {
      cells[columns[ci++].id] = makeCell(`[${comp.ci[0].toFixed(2)}, ${comp.ci[1].toFixed(2)}]`, 'ci');
    } else if (config.includeCI) {
      cells[columns[ci++].id] = makeCell('');
    }
    if (config.includePostHoc) {
      cells[columns[ci++].id] = makeCell(comp.postHoc || '');
    }

    // Significance marker
    const sigCell = cells[columns.find(c => c.title === 'P-value')!.id];
    if (config.includeSignificanceMark && comp.significant) {
      sigCell.noteMarkers = ['*'];
    }

    rows.push({ id: uid(), cells });
  }

  const footnotes: Footnote[] = [];
  if (config.includeSignificanceMark) {
    footnotes.push({ id: uid(), marker: '*', type: 'significance', text: 'Statistically significant at p < 0.05.', attachedTo: [] });
  }

  return {
    name: config.title || 'Comparative Results',
    title: config.title || 'Comparative Analysis Results',
    tableType: 'comparison',
    columns, rows, footnotes,
    stylePreset: 'general-journal',
    styleOptions: { ...DEFAULT_TABLE_STYLE },
  };
}
