/**
 * NarrativeEngine.ts — Rule-Based Results Narrative Generator (Section 10)
 * Generates structured results wording from table data without any LLM dependency.
 */

import type { TableDocument, NarrativeSettings, NarrativeType } from '../types/TableBuilderTypes';

const DEFAULT_SETTINGS: NarrativeSettings = {
  tone: 'neutral',
  mentionTestNames: true,
  reportExactP: false,
  reportPThresholds: true,
  includeEffectSizes: true,
  includeCI: true,
  defineAbbreviations: true,
  mentionNonSignificant: true,
  mentionAssumptions: false,
  usePassiveVoice: false,
};

// ── Helpers ──

function formatP(p: number, settings: NarrativeSettings): string {
  if (settings.reportExactP) {
    if (p < 0.001) return 'p < 0.001';
    return `p = ${p.toFixed(3)}`;
  }
  if (p < 0.001) return 'p < 0.001';
  if (p < 0.01) return 'p < 0.01';
  if (p < 0.05) return 'p < 0.05';
  return `p = ${p.toFixed(3)}`;
}

function sig(p: number): boolean {
  return p < 0.05;
}

// Unused helpers removed

interface ExtractedStats {
  testName?: string;
  statistic?: number;
  statisticLabel?: string;
  df?: number | string;
  pValue?: number;
  effectSize?: number;
  effectSizeLabel?: string;
  ciLower?: number;
  ciUpper?: number;
  mean1?: number;
  sd1?: number;
  mean2?: number;
  sd2?: number;
  n1?: number;
  n2?: number;
  group1?: string;
  group2?: string;
  outcome?: string;
  rSquared?: number;
  beta?: number;
  se?: number;
  predictor?: string;
  groups?: { name: string; mean: number; sd: number; n: number }[];
}

function extractStatsFromTable(table: TableDocument): ExtractedStats {
  const stats: ExtractedStats = {};
  const cols = table.columns;
  const dataRows = table.rows.filter(r => !r.sectionLabel && !r.isSeparator);

  // Try to identify columns by title
  const findCol = (patterns: string[]) => cols.find(c => patterns.some(p => c.title.toLowerCase().includes(p)));

  const pCol = findCol(['p-value', 'p value', 'sig', 'significance', 'p']);
  const statCol = findCol(['statistic', 'test stat', 't', 'f', 'chi', 'z', 'u', 'w']);
  const dfCol = findCol(['df', 'degrees of freedom']);
  const effectCol = findCol(['effect', "cohen", 'eta', "cramér", 'r²', 'r-sq', 'd', 'odds', 'hazard']);
  const meanCol = findCol(['mean', 'avg', 'average', 'm']);
  const sdCol = findCol(['sd', 'std', 'standard dev']);
  const nCol = findCol(['n', 'count', 'sample']);
  const ciLowCol = findCol(['lower', 'ci lower', 'ci_lower', 'll']);
  const ciUpCol = findCol(['upper', 'ci upper', 'ci_upper', 'ul']);
  const outcomeCol = findCol(['outcome', 'variable', 'measure', 'dependent']);
  const betaCol = findCol(['beta', 'β', 'b', 'coef', 'coefficient', 'estimate']);
  const seCol = findCol(['se', 'std error', 'standard error']);
  const predictorCol = findCol(['predictor', 'independent', 'factor', 'covariate']);

  stats.testName = table.tableType;

  if (dataRows.length > 0) {
    const row0 = dataRows[0];
    const getNum = (colId?: string) => {
      if (!colId) return undefined;
      const cell = row0.cells[colId];
      if (!cell) return undefined;
      const v = typeof cell.rawValue === 'number' ? cell.rawValue : parseFloat(String(cell.rawValue));
      return isNaN(v) ? undefined : v;
    };
    const getStr = (colId?: string) => {
      if (!colId) return undefined;
      return row0.cells[colId]?.displayValue || undefined;
    };

    stats.pValue = getNum(pCol?.id);
    stats.statistic = getNum(statCol?.id);
    stats.statisticLabel = statCol?.title;
    stats.df = getStr(dfCol?.id);
    stats.effectSize = getNum(effectCol?.id);
    stats.effectSizeLabel = effectCol?.title;
    stats.mean1 = getNum(meanCol?.id);
    stats.sd1 = getNum(sdCol?.id);
    stats.n1 = getNum(nCol?.id);
    stats.ciLower = getNum(ciLowCol?.id);
    stats.ciUpper = getNum(ciUpCol?.id);
    stats.outcome = getStr(outcomeCol?.id);
    stats.beta = getNum(betaCol?.id);
    stats.se = getNum(seCol?.id);
    stats.predictor = getStr(predictorCol?.id);

    // Extract groups
    stats.groups = dataRows.map((_, i) => ({
      name: getStr(cols[0]?.id) || `Group ${i + 1}`,
      mean: getNum(meanCol?.id) || 0,
      sd: getNum(sdCol?.id) || 0,
      n: getNum(nCol?.id) || 0,
    }));
  }

  return stats;
}

// ── Narrative Generators ──

// ── Advanced Rhetoric Helpers ──

function getPercentDifference(mean1: number, mean2: number): string {
  if (mean1 === 0 && mean2 === 0) return '0%';
  if (mean1 === 0) return 'an absolute increase';
  const diff = Math.abs(mean1 - mean2);
  const percent = (diff / Math.abs(mean1)) * 100;
  return `${percent.toFixed(1)}%`;
}

function getFoldChange(mean1: number, mean2: number): string {
  if (mean1 === 0 || mean2 === 0) return '';
  const ratio = Math.max(mean1, mean2) / Math.min(mean1, mean2);
  return ratio >= 1.5 ? `${ratio.toFixed(1)}-fold` : '';
}

function generateAPA(s: ExtractedStats, settings: NarrativeSettings): string {
  const parts: string[] = [];
  if (s.statisticLabel && s.statistic !== undefined) {
    const dfStr = s.df !== undefined ? `(${s.df})` : '';
    parts.push(`${s.statisticLabel}${dfStr} = ${s.statistic.toFixed(2)}`);
  }
  if (s.pValue !== undefined) parts.push(formatP(s.pValue, settings));
  if (settings.includeEffectSizes && s.effectSize !== undefined) {
    parts.push(`${s.effectSizeLabel || 'd'} = ${s.effectSize.toFixed(2)}`);
  }
  if (settings.includeCI && s.ciLower !== undefined && s.ciUpper !== undefined) {
    parts.push(`95% CI [${s.ciLower.toFixed(2)}, ${s.ciUpper.toFixed(2)}]`);
  }
  return parts.length > 0 ? `, ${parts.join(', ')}` : '';
}

// ── Narrative Generators ──

function generateConcise(table: TableDocument, settings: NarrativeSettings): string {
  const s = extractStatsFromTable(table);
  const apa = generateAPA(s, settings);
  
  if (s.pValue === undefined) {
    return s.outcome ? `The analysis assessed ${s.outcome}.` : `Descriptive characteristics are presented${apa}.`;
  }
  
  const isSig = sig(s.pValue);
  
  if (!isSig) {
    return `Statistical evaluation revealed no significant effect ${s.outcome ? `on ${s.outcome}` : 'across the tested groups'}${apa}.`;
  }
  
  let comparisonText = '';
  if (s.groups && s.groups.length >= 2) {
    const sorted = [...s.groups].sort((a, b) => b.mean - a.mean);
    const maxG = sorted[0];
    const minG = sorted[sorted.length - 1];
    if (maxG.mean > minG.mean) {
      comparisonText = `, driven primarily by markedly elevated values in the ${maxG.name} cohort compared to ${minG.name}`;
    }
  }

  return `The analysis demonstrated a robust, statistically significant effect ${s.outcome ? `for ${s.outcome}` : ''}${comparisonText}${apa}.`;
}

function generateExpanded(table: TableDocument, settings: NarrativeSettings): string {
  const s = extractStatsFromTable(table);
  const apa = generateAPA(s, settings);
  const paragraphs: string[] = [];

  // 1. Context & Omnibus
  if (s.outcome) {
    paragraphs.push(`We conducted a rigorous evaluation of ${s.outcome} across the experimental cohorts.`);
  }

  if (s.pValue === undefined) {
    paragraphs.push(`Descriptive metrics demonstrated baseline variances, summarized comprehensively in the table.`);
  } else {
    const isSig = sig(s.pValue);
    if (!isSig) {
       paragraphs.push(`Contrary to our primary hypothesis, the omnibus statistical analysis elucidated no significant main effect${apa}. Consequently, the substantive distributions remained statistically indistinguishable across the strata.`);
    } else {
       paragraphs.push(`The omnibus analysis revealed a robust and statistically significant main effect${apa}, confirming substantive variances across the tested conditions.`);
       
       // 2. Rhetorical magnitude breakdown
       if (s.groups && s.groups.length >= 2) {
         const sorted = [...s.groups].sort((a, b) => b.mean - a.mean);
         const maxG = sorted[0];
         const minG = sorted[sorted.length - 1];
         
         if (maxG.mean > minG.mean) {
            const percentStr = getPercentDifference(minG.mean, maxG.mean);
            const foldStr = getFoldChange(minG.mean, maxG.mean);
            let magnitudeDesc = `representing an increase of ${percentStr}`;
            if (foldStr) magnitudeDesc += ` (a ${foldStr} difference)`;
            
            paragraphs.push(`Subsequent inspection of the group differentials demonstrated that the ${maxG.name} cohort exhibited markedly elevated values (M = ${maxG.mean.toFixed(2)}, SD = ${maxG.sd.toFixed(2)}) relative to the ${minG.name} baseline (M = ${minG.mean.toFixed(2)}, SD = ${minG.sd.toFixed(2)}), ${magnitudeDesc}.`);
         }
       }
       
       // 3. Effect size discussion
       if (settings.includeEffectSizes && s.effectSize !== undefined) {
         const magnitude = Math.abs(s.effectSize) < 0.2 ? 'marginal' : Math.abs(s.effectSize) < 0.5 ? 'moderate' : Math.abs(s.effectSize) < 0.8 ? 'substantial' : 'profound';
         paragraphs.push(`Importantly, the observed ${s.effectSizeLabel || 'effect size'} was calculated at ${s.effectSize.toFixed(2)}, denoting a ${magnitude} clinical or practical magnitude of effect.`);
       }
    }
  }

  return paragraphs.join(' ');
}

function generateObjective(table: TableDocument, settings: NarrativeSettings): string {
  const s = extractStatsFromTable(table);
  const apa = generateAPA(s, settings);
  // Objective is just APA. We strip the leading comma.
  return apa.startsWith(', ') ? apa.substring(2) + '.' : apa;
}

function generateRegressionNarrative(table: TableDocument, settings: NarrativeSettings): string {
  const s = extractStatsFromTable(table);
  const parts: string[] = [];

  if (s.rSquared !== undefined) {
    parts.push(`The overarching multivariable model successfully accounted for ${(s.rSquared * 100).toFixed(1)}% of the variance within the dependent measure (R² = ${s.rSquared.toFixed(3)}).`);
  }

  if (s.predictor && s.beta !== undefined && s.pValue !== undefined) {
    const isSig = sig(s.pValue);
    if (isSig) {
      parts.push(`Crucially, ${s.predictor} emerged as a robust independent predictor of the outcome, demonstrating a highly significant directional association (β = ${s.beta.toFixed(3)}${s.se !== undefined ? `, SE = ${s.se.toFixed(3)}` : ''}, ${formatP(s.pValue, settings)}).`);
    } else {
      parts.push(`In contrast, ${s.predictor} did not achieve statistical thresholding as an independent explanatory variable within this cohort (β = ${s.beta.toFixed(3)}, ${formatP(s.pValue, settings)}).`);
    }
  }

  return parts.join(' ') || generateConcise(table, settings);
}

function generateBaselineNarrative(table: TableDocument, settings: NarrativeSettings): string {
  const dataRows = table.rows.filter(r => !r.sectionLabel && !r.isSeparator);
  const parts: string[] = [];

  parts.push(`Baseline characteristics of the study population are summarized in ${table.tableNumber || 'the table'}.`);

  const nCol = table.columns.find(c => c.title.toLowerCase().includes('n') || c.title.toLowerCase().includes('total'));
  if (nCol && dataRows.length > 0) {
    const firstCell = dataRows[0].cells[nCol.id];
    if (firstCell?.rawValue) {
      parts.push(`A total of ${firstCell.rawValue} participants were included.`);
    }
  }

  const pCol = table.columns.find(c => c.title.toLowerCase().includes('p'));
  if (pCol) {
    const sigVars: string[] = [];
    const nsVars: string[] = [];
    dataRows.forEach(row => {
      const pCell = row.cells[pCol.id];
      const nameCell = row.cells[table.columns[0]?.id];
      if (pCell && nameCell) {
        const pVal = typeof pCell.rawValue === 'number' ? pCell.rawValue : parseFloat(String(pCell.rawValue));
        if (!isNaN(pVal)) {
          if (pVal < 0.05) sigVars.push(nameCell.displayValue);
          else nsVars.push(nameCell.displayValue);
        }
      }
    });
    if (sigVars.length > 0) {
      parts.push(`Significant differences between groups were observed for ${sigVars.join(', ')} (${formatP(0.05, settings)}).`);
    }
    if (nsVars.length > 0 && settings.mentionNonSignificant) {
      parts.push(`No significant differences were found for ${nsVars.join(', ')}.`);
    }
  }

  return parts.join(' ');
}

function generateAdverseNarrative(table: TableDocument, _settings: NarrativeSettings): string {
  const dataRows = table.rows.filter(r => !r.sectionLabel && !r.isSeparator);
  const parts: string[] = [];

  parts.push(`Adverse events are summarized in ${table.tableNumber || 'the table'}.`);

  if (dataRows.length > 0) {
    parts.push(`A total of ${dataRows.length} adverse event categories were reported.`);
  }

  return parts.join(' ');
}

function generateEvidenceNarrative(table: TableDocument, _settings: NarrativeSettings): string {
  const dataRows = table.rows.filter(r => !r.sectionLabel && !r.isSeparator);
  const parts: string[] = [];

  parts.push(`The evidence synthesis included ${dataRows.length} studies.`);

  const yearCol = table.columns.find(c => c.title.toLowerCase().includes('year'));
  if (yearCol) {
    const years = dataRows
      .map(r => parseInt(String(r.cells[yearCol.id]?.rawValue || '')))
      .filter(y => !isNaN(y))
      .sort();
    if (years.length > 0) {
      parts.push(`Studies were published between ${years[0]} and ${years[years.length - 1]}.`);
    }
  }

  const designCol = table.columns.find(c => c.title.toLowerCase().includes('design'));
  if (designCol) {
    const designs = new Map<string, number>();
    dataRows.forEach(r => {
      const d = r.cells[designCol.id]?.displayValue;
      if (d) designs.set(d, (designs.get(d) || 0) + 1);
    });
    if (designs.size > 0) {
      const designDescs = [...designs.entries()].map(([d, n]) => `${n} ${d}`).join(', ');
      parts.push(`Study designs included ${designDescs}.`);
    }
  }

  return parts.join(' ');
}

function generateMultiComparisonNarrative(table: TableDocument, settings: NarrativeSettings): string {
  const s = extractStatsFromTable(table);
  const apa = generateAPA(s, settings);
  const paragraphs: string[] = [];

  paragraphs.push(`A comprehensive multi-comparative analysis was systematically undertaken to isolate specific cohort differentials.`);

  if (s.pValue !== undefined && s.statisticLabel) {
    const isSig = sig(s.pValue);
    if (!isSig) {
       paragraphs.push(`The omnibus test yielded no statistically significant deviation across the groups${apa}, suggesting overarching phenotypic homogeneity.`);
    } else {
       paragraphs.push(`The omnibus evaluation indicated a highly significant deviation across the sampled groups${apa}.`);
       
       if (s.groups && s.groups.length >= 3) {
         const sorted = [...s.groups].sort((a, b) => b.mean - a.mean);
         const maxG = sorted[0];
         const minG = sorted[sorted.length - 1];
         
         const foldStr = getFoldChange(minG.mean, maxG.mean);
         const foldDesc = foldStr ? `, evidencing a ${foldStr} gradient` : '';
         
         paragraphs.push(`Post-hoc algorithmic stratification revealed that the ${maxG.name} group presented the maximal magnitude (M = ${maxG.mean.toFixed(2)}), whereas the ${minG.name} cohort occupied the nadir of the distribution (M = ${minG.mean.toFixed(2)})${foldDesc}.`);
       }
    }
  }

  return paragraphs.join(' ') || generateConcise(table, settings);
}

// ── Main export ──

export function generateNarrative(
  table: TableDocument,
  narrativeType: NarrativeType,
  settings: Partial<NarrativeSettings> = {}
): string {
  const merged: NarrativeSettings = { ...DEFAULT_SETTINGS, ...settings };

  switch (narrativeType) {
    case 'concise': return generateConcise(table, merged);
    case 'expanded': return generateExpanded(table, merged);
    case 'objective': return generateObjective(table, merged);
    case 'multi-comparison': return generateMultiComparisonNarrative(table, merged);
    case 'regression': return generateRegressionNarrative(table, merged);
    case 'baseline': return generateBaselineNarrative(table, merged);
    case 'adverse': return generateAdverseNarrative(table, merged);
    case 'evidence': return generateEvidenceNarrative(table, merged);
    default: return generateConcise(table, merged);
  }
}

export function suggestNarrativeType(table: TableDocument): NarrativeType {
  const type = table.tableType;
  if (['baseline', 'demographic'].includes(type)) return 'baseline';
  if (['regression', 'model-comparison'].includes(type)) return 'regression';
  if (['adverse-events', 'safety'].includes(type)) return 'adverse';
  if (['evidence-extraction', 'study-characteristics', 'included-studies'].includes(type)) return 'evidence';
  if (['anova', 'posthoc', 'comparison'].includes(type)) return 'multi-comparison';
  return 'concise';
}
