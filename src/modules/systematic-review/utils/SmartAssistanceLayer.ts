import type { ReviewProject, ReviewRecord } from '../types/ReviewModels';

const STUDY_DESIGN_HINTS = [
  { match: ['randomized', 'rct', 'randomised', 'placebo'], label: 'Randomized Trial' },
  { match: ['cohort', 'prospective', 'retrospective cohort'], label: 'Cohort Study' },
  { match: ['case-control', 'case control'], label: 'Case-Control' },
  { match: ['cross-sectional', 'prevalence', 'survey'], label: 'Cross-Sectional' },
  { match: ['systematic review', 'meta-analysis', 'meta analysis'], label: 'Systematic Review / Meta-Analysis' },
  { match: ['case report', 'case series'], label: 'Case Report' },
  { match: ['mice', 'rat', 'animal', 'in vivo', 'murine', 'porcine', 'bovine'], label: 'Animal Study' },
  { match: ['in vitro', 'cell line', 'culture'], label: 'In Vitro' },
];

export function computeSmartMetadata(record: ReviewRecord, project: ReviewProject | null): Partial<ReviewRecord> {
  if (!project) return {};

  const textToScan = `${record.title} ${record.abstract} ${record.keywords.join(' ')}`.toLowerCase();
  
  // 1. Relevance Score
  let score = 0;
  
  // Boost for Inclusion Criteria matches
  project.inclusionCriteria.forEach(crit => {
    if (crit.trim().length > 3 && textToScan.includes(crit.toLowerCase())) {
      score += 10;
    }
  });

  // Highlight PICO matches
  if (project.pico.p && textToScan.includes(project.pico.p.toLowerCase())) score += 5;
  if (project.pico.i && textToScan.includes(project.pico.i.toLowerCase())) score += 5;
  if (project.pico.o && textToScan.includes(project.pico.o.toLowerCase())) score += 5;

  // Penalize Exclusion Criteria matches
  project.exclusionCriteria.forEach(crit => {
    if (crit.trim().length > 3 && textToScan.includes(crit.toLowerCase())) {
      score -= 15;
    }
  });

  // 2. Study Design Hints
  const likelyStudyDesign: string[] = [];
  STUDY_DESIGN_HINTS.forEach(hint => {
    if (hint.match.some(m => textToScan.includes(m))) {
      likelyStudyDesign.push(hint.label);
    }
  });

  // 3. Flags and Consistency Alerts
  const flags: string[] = [];
  if (!record.abstract || record.abstract.length < 50) flags.push('Missing/Short Abstract');
  if (record.dedupStatus === 'duplicate') flags.push('Unresolved Duplicate');

  return {
    relevanceScore: score,
    likelyStudyDesign: [...new Set(likelyStudyDesign)],
    flags
  };
}

export function highlightKeywords(text: string, project: ReviewProject | null) {
  if (!project || !text) return text;
  // In a real implementation this would return React Nodes with highlighted spans
  // For simplicity, we just return the raw text here in this mock, but the framework is laid out.
  return text;
}
