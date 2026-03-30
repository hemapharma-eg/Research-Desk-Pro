/**
 * MultiModelBuilder.ts — Smart Table Builder (Section 7J)
 * Side-by-side display of same outcome across multiple regression models.
 */
import type { TableDocument, TBColumn, TBRow, TBCell, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING, DEFAULT_TABLE_STYLE } from '../../types/TableBuilderTypes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
function makeCell(v: string|number|null, fmt: TBCell['formatType']='text', p=3): TBCell {
  return { id:uid(), rawValue:v, displayValue: typeof v==='number'?(fmt==='p-value'?(v<0.001?'< 0.001':v.toFixed(3)):v.toFixed(p)):(v??''), formatType:fmt, numericPrecision:p, sourceBinding:null, manualOverride:false, noteMarkers:[], validationFlags:[], formatting:{...DEFAULT_CELL_FORMATTING} };
}

export interface MultiModelConfig {
  predictors: string[];
  models: { name: string; coefficients: Record<string, { beta: number; se: number; pValue: number; ci?: [number,number] }> }[];
  coefficientLabel?: string;
  title?: string;
}

export function buildMultiModelTable(config: MultiModelConfig): Partial<TableDocument> {
  const coefLabel = config.coefficientLabel || 'β';
  const columns: TBColumn[] = [{ id:uid(), title:'Predictor', width:'auto', locked:false, hidden:false, defaultFormat:{bold:true} }];

  for (const model of config.models) {
    columns.push({ id:uid(), title:`${model.name} ${coefLabel}`, width:'auto', locked:false, hidden:false, defaultFormat:{alignH:'right'} });
    columns.push({ id:uid(), title:`${model.name} SE`, width:'auto', locked:false, hidden:false, defaultFormat:{alignH:'right'} });
    columns.push({ id:uid(), title:`${model.name} P`, width:'auto', locked:false, hidden:false, defaultFormat:{alignH:'right'} });
  }

  const rows: TBRow[] = config.predictors.map(pred => {
    const cells: Record<string,TBCell> = {};
    cells[columns[0].id] = makeCell(pred);
    let ci = 1;
    for (const model of config.models) {
      const c = model.coefficients[pred];
      if (c) {
        cells[columns[ci++].id] = makeCell(c.beta, 'number');
        cells[columns[ci++].id] = makeCell(c.se, 'number');
        const pCell = makeCell(c.pValue, 'p-value');
        if (c.pValue < 0.05) pCell.noteMarkers = ['*'];
        cells[columns[ci++].id] = pCell;
      } else {
        cells[columns[ci++].id] = makeCell('—');
        cells[columns[ci++].id] = makeCell('—');
        cells[columns[ci++].id] = makeCell('—');
      }
    }
    return { id:uid(), cells };
  });

  const footnotes: Footnote[] = [
    { id:uid(), marker:'*', type:'significance', text:'p < 0.05', attachedTo:[] },
  ];

  return { name:config.title||'Multi-Model Comparison', title:config.title||'Multi-Model Comparison', tableType:'model-comparison', columns, rows, footnotes, stylePreset:'general-journal', styleOptions:{...DEFAULT_TABLE_STYLE} };
}
