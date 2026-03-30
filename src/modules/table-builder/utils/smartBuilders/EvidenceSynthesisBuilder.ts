/**
 * EvidenceSynthesisBuilder.ts — Smart Table Builder (Section 7I)
 */
import type { TableDocument, TBColumn, TBRow, TBCell } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
function makeCell(value: string | number | null, fmt: TBCell['formatType'] = 'text'): TBCell {
  return { id: uid(), rawValue: value, displayValue: typeof value === 'number' ? String(value) : (value ?? ''), formatType: fmt, numericPrecision: 2, sourceBinding: null, manualOverride: false, noteMarkers: [], validationFlags: [], formatting: { ...DEFAULT_CELL_FORMATTING } };
}

export interface EvidenceConfig {
  studies: { author: string; year: number; country?: string; design?: string; population?: string; sampleSize?: number; intervention?: string; comparator?: string; outcomes?: string; findings?: string; limitations?: string; riskOfBias?: string; notes?: string }[];
  includeColumns?: string[];
  title?: string;
}

export function buildEvidenceTable(config: EvidenceConfig): Partial<TableDocument> {
  const inc = config.includeColumns || ['country','design','population','sampleSize','intervention','comparator','outcomes','findings','riskOfBias'];
  const columns: TBColumn[] = [
    { id: uid(), title: 'Study', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
    { id: uid(), title: 'Year', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } },
  ];
  const m: Record<string, string> = {};
  const add = (k: string, t: string) => { if (!inc.includes(k)) return; const id = uid(); columns.push({ id, title: t, width: 'auto', locked: false, hidden: false, defaultFormat: {} }); m[k] = id; };
  add('country','Country'); add('design','Design'); add('population','Population'); add('sampleSize','N');
  add('intervention','Intervention'); add('comparator','Comparator'); add('outcomes','Outcomes');
  add('findings','Key Findings'); add('limitations','Limitations'); add('riskOfBias','RoB'); add('notes','Notes');

  const rows: TBRow[] = config.studies.map(s => {
    const cells: Record<string, TBCell> = {};
    cells[columns[0].id] = makeCell(s.author);
    cells[columns[1].id] = makeCell(s.year, 'number');
    if (m.country) cells[m.country] = makeCell(s.country||'');
    if (m.design) cells[m.design] = makeCell(s.design||'');
    if (m.population) cells[m.population] = makeCell(s.population||'');
    if (m.sampleSize) cells[m.sampleSize] = makeCell(s.sampleSize??null,'number');
    if (m.intervention) cells[m.intervention] = makeCell(s.intervention||'');
    if (m.comparator) cells[m.comparator] = makeCell(s.comparator||'');
    if (m.outcomes) cells[m.outcomes] = makeCell(s.outcomes||'');
    if (m.findings) cells[m.findings] = makeCell(s.findings||'');
    if (m.limitations) cells[m.limitations] = makeCell(s.limitations||'');
    if (m.riskOfBias) cells[m.riskOfBias] = makeCell(s.riskOfBias||'');
    if (m.notes) cells[m.notes] = makeCell(s.notes||'');
    return { id: uid(), cells };
  });

  return { name: config.title||'Evidence Synthesis', title: config.title||'Characteristics of Included Studies', tableType: 'evidence-extraction', columns, rows, footnotes: [], stylePreset: 'supplementary-dense', styleOptions: { ...DEFAULT_TABLE_STYLE, fontSize: 9, borderStyle: 'full-grid', cellPadding: 4 } };
}
