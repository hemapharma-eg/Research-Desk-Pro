/**
 * AdverseEventsBuilder.ts — Smart Table Builder (Section 7H)
 * Generates adverse events summary tables for clinical trials.
 */

import type { TableDocument, TBColumn, TBRow, TBCell, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeCell(value: string | number | null, formatType: TBCell['formatType'] = 'text', precision = 0): TBCell {
  return {
    id: uid(), rawValue: value,
    displayValue: typeof value === 'number' ? value.toFixed(precision) : (value ?? ''),
    formatType, numericPrecision: precision, sourceBinding: null, manualOverride: false,
    noteMarkers: [], validationFlags: [], formatting: { ...DEFAULT_CELL_FORMATTING },
  };
}

export interface AdverseEventsConfig {
  events: {
    term: string;
    systemOrganClass?: string;
    treatmentCount: number;
    treatmentTotal: number;
    controlCount: number;
    controlTotal: number;
    severity?: 'mild' | 'moderate' | 'severe';
    serious?: boolean;
    pValue?: number;
  }[];
  treatmentLabel?: string;
  controlLabel?: string;
  includeSeverity?: boolean;
  includeSeriousness?: boolean;
  includePValue?: boolean;
  title?: string;
}

export function buildAdverseEventsTable(config: AdverseEventsConfig): Partial<TableDocument> {
  const txLabel = config.treatmentLabel || 'Treatment';
  const ctrlLabel = config.controlLabel || 'Control';

  const columns: TBColumn[] = [
    { id: uid(), title: 'Adverse Event', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
    { id: uid(), title: `${txLabel} n (%)`, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } },
    { id: uid(), title: `${ctrlLabel} n (%)`, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } },
    { id: uid(), title: 'Total', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } },
  ];

  if (config.includeSeverity) {
    columns.push({ id: uid(), title: 'Severity', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }
  if (config.includeSeriousness) {
    columns.push({ id: uid(), title: 'Serious', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }
  if (config.includePValue) {
    columns.push({ id: uid(), title: 'P-value', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });
  }

  const rows: TBRow[] = [];
  let currentSOC = '';

  for (const ev of config.events) {
    if (ev.systemOrganClass && ev.systemOrganClass !== currentSOC) {
      currentSOC = ev.systemOrganClass;
      rows.push({ id: uid(), cells: {}, sectionLabel: currentSOC });
    }

    const txPct = ev.treatmentTotal > 0 ? (ev.treatmentCount / ev.treatmentTotal * 100).toFixed(1) : '0.0';
    const ctrlPct = ev.controlTotal > 0 ? (ev.controlCount / ev.controlTotal * 100).toFixed(1) : '0.0';
    const total = ev.treatmentCount + ev.controlCount;

    const cells: Record<string, TBCell> = {};
    let ci = 0;
    cells[columns[ci++].id] = makeCell(ev.term);
    cells[columns[ci++].id] = makeCell(`${ev.treatmentCount} (${txPct}%)`);
    cells[columns[ci++].id] = makeCell(`${ev.controlCount} (${ctrlPct}%)`);
    cells[columns[ci++].id] = makeCell(total, 'number');

    if (config.includeSeverity) {
      cells[columns[ci++].id] = makeCell(ev.severity || '');
    }
    if (config.includeSeriousness) {
      cells[columns[ci++].id] = makeCell(ev.serious ? 'Yes' : 'No');
    }
    if (config.includePValue && ev.pValue !== undefined) {
      cells[columns[ci++].id] = makeCell(ev.pValue, 'p-value', 3);
    } else if (config.includePValue) {
      cells[columns[ci++].id] = makeCell('');
    }

    rows.push({ id: uid(), cells });
  }

  const footnotes: Footnote[] = [
    { id: uid(), marker: 'a', type: 'abbreviation', text: `${txLabel} (N = ${config.events[0]?.treatmentTotal || ''}); ${ctrlLabel} (N = ${config.events[0]?.controlTotal || ''}).`, attachedTo: [] },
  ];

  return {
    name: config.title || 'Adverse Events',
    title: config.title || 'Summary of Adverse Events',
    tableType: 'adverse-events',
    columns, rows, footnotes,
    stylePreset: 'clinical-trial',
    styleOptions: { ...DEFAULT_TABLE_STYLE, borderStyle: 'full-grid', fontSize: 10 },
  };
}
