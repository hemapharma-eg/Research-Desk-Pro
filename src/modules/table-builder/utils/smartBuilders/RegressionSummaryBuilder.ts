/**
 * RegressionSummaryBuilder.ts — Smart Table Builder (Section 7D)
 * Generates regression model summary tables (linear, logistic, Cox).
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

export interface RegressionConfig {
  modelType: 'linear' | 'logistic' | 'cox' | 'multiple-linear' | 'glm';
  predictors: {
    name: string;
    coefficient: number;
    se: number;
    statistic?: number;
    statisticLabel?: string;
    pValue: number;
    ciLower?: number;
    ciUpper?: number;
    isReferenceCategory?: boolean;
    adjustedFor?: string;
    vif?: number;
    significant: boolean;
    modelNumber?: number;
  }[];
  modelStats?: {
    rSquared?: number;
    adjustedRSquared?: number;
    fStatistic?: number;
    fPValue?: number;
    aic?: number;
    bic?: number;
    logLikelihood?: number;
    nObservations?: number;
  };
  includeVIF?: boolean;
  includeModelNumber?: boolean;
  coefficientLabel?: string;
  title?: string;
}

export function buildRegressionTable(config: RegressionConfig): Partial<TableDocument> {
  const { modelType, predictors } = config;
  const coefLabel = config.coefficientLabel || (modelType === 'logistic' ? 'OR' : modelType === 'cox' ? 'HR' : 'β');

  const columns: TBColumn[] = [
    { id: uid(), title: 'Predictor', width: 'auto', locked: false, hidden: false, defaultFormat: { bold: true } },
    { id: uid(), title: coefLabel, width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } },
    { id: uid(), title: 'SE', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } },
  ];

  if (predictors[0]?.statistic !== undefined) {
    columns.push({ id: uid(), title: predictors[0].statisticLabel || 't', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });
  }

  columns.push({ id: uid(), title: '95% CI', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  columns.push({ id: uid(), title: 'P-value', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });

  if (config.includeVIF) {
    columns.push({ id: uid(), title: 'VIF', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'right' } });
  }

  if (config.includeModelNumber) {
    columns.push({ id: uid(), title: 'Model', width: 'auto', locked: false, hidden: false, defaultFormat: { alignH: 'center' } });
  }

  const rows: TBRow[] = [];

  for (const pred of predictors) {
    const cells: Record<string, TBCell> = {};
    let ci = 0;

    cells[columns[ci++].id] = makeCell(pred.name + (pred.isReferenceCategory ? ' (ref)' : ''));

    if (pred.isReferenceCategory) {
      cells[columns[ci++].id] = makeCell('Ref');
      // Fill remaining with empty
      while (ci < columns.length) cells[columns[ci++].id] = makeCell('');
    } else {
      cells[columns[ci++].id] = makeCell(pred.coefficient, 'number');
      cells[columns[ci++].id] = makeCell(pred.se, 'number');
      if (pred.statistic !== undefined) cells[columns[ci++].id] = makeCell(pred.statistic, 'number');
      if (pred.ciLower !== undefined && pred.ciUpper !== undefined) {
        cells[columns[ci++].id] = makeCell(`[${pred.ciLower.toFixed(2)}, ${pred.ciUpper.toFixed(2)}]`, 'ci');
      } else {
        cells[columns[ci++].id] = makeCell('');
      }
      cells[columns[ci++].id] = makeCell(pred.pValue, 'p-value');
      if (config.includeVIF && pred.vif !== undefined) {
        cells[columns[ci++].id] = makeCell(pred.vif, 'number', 2);
      } else if (config.includeVIF) {
        cells[columns[ci++].id] = makeCell('');
      }
      if (config.includeModelNumber) {
        cells[columns[ci++].id] = makeCell(pred.modelNumber ?? '');
      }
    }

    rows.push({ id: uid(), cells });
  }

  // Model summary footer
  const footnotes: Footnote[] = [];
  if (config.modelStats) {
    const ms = config.modelStats;
    const parts: string[] = [];
    if (ms.rSquared !== undefined) parts.push(`R² = ${ms.rSquared.toFixed(3)}`);
    if (ms.adjustedRSquared !== undefined) parts.push(`Adjusted R² = ${ms.adjustedRSquared.toFixed(3)}`);
    if (ms.fStatistic !== undefined) parts.push(`F = ${ms.fStatistic.toFixed(2)}, p ${ms.fPValue !== undefined && ms.fPValue < 0.001 ? '< 0.001' : `= ${ms.fPValue?.toFixed(3)}`}`);
    if (ms.nObservations !== undefined) parts.push(`N = ${ms.nObservations}`);
    if (parts.length > 0) {
      footnotes.push({ id: uid(), marker: 'a', type: 'test-legend', text: `Model summary: ${parts.join('; ')}.`, attachedTo: [] });
    }
  }

  return {
    name: config.title || 'Regression Summary',
    title: config.title || `${modelType.charAt(0).toUpperCase() + modelType.slice(1)} Regression Results`,
    tableType: 'regression',
    columns, rows, footnotes,
    stylePreset: 'general-journal',
    styleOptions: { ...DEFAULT_TABLE_STYLE },
  };
}
