import type { JSONContent } from '@tiptap/react';
import type {
  IntegrityFinding,
  RuleContext,
  SampleSizeMention,
  PValueEntry,
  TableFigureMappingEntry,
  CitationMappingEntry,
} from '../types/IntegrityTypes';
import { IntegrityRule } from '../types/IntegrityTypes';

// ─── RULE 5: FIGURE & TABLE MENTION CONSISTENCY ──────────────────────────────
export class FigureTableMentionRule extends IntegrityRule {
  ruleId = 'IC-FIG-01';
  category: IntegrityFinding['category'] = 'cross_references';

  private textMentions: { type: 'figure' | 'table'; num: number; section: string | null }[] = [];
  private captions: { type: 'figure' | 'table'; num: number; text: string; section: string | null }[] = [];

  setup(_ctx: RuleContext): void {
    this.textMentions = [];
    this.captions = [];
  }

  visitNode(node: JSONContent, ancestors: JSONContent[], _ctx: RuleContext): void {
    if (node.type !== 'text' || !node.text) return;
    const section = this.heading(ancestors);
    const txt = node.text;

    // In-text mentions: "Figure 1", "Fig. 1", "figure 1", "Table 2", "table 2"
    const mentionRe = /\b(Fig(?:ure)?|Table)\.?\s*(\d+)\b/gi;
    let m;
    while ((m = mentionRe.exec(txt)) !== null) {
      const t = m[1].toLowerCase().startsWith('fig') ? 'figure' as const : 'table' as const;
      this.textMentions.push({ type: t, num: parseInt(m[2], 10), section });
    }

    // Caption detection: lines starting with "Figure X." or "Table X." or "Figure X:"
    const capRe = /^(Figure|Table)\s+(\d+)[.:]\s*(.+)/i;
    const capMatch = capRe.exec(txt.trim());
    if (capMatch) {
      const t = capMatch[1].toLowerCase() === 'figure' ? 'figure' as const : 'table' as const;
      this.captions.push({ type: t, num: parseInt(capMatch[2], 10), text: capMatch[3].trim(), section });
    }
  }

  private heading(anc: JSONContent[]): string | null {
    for (let i = anc.length - 1; i >= 0; i--) {
      if (anc[i].type === 'heading' && anc[i].content?.[0]?.text) return anc[i].content![0].text!;
    }
    return null;
  }

  evaluate(ctx: RuleContext): IntegrityFinding[] {
    const findings: IntegrityFinding[] = [];
    const strict = ctx.config.strictMode;
    const mappings: TableFigureMappingEntry[] = [];

    for (const itemType of ['figure', 'table'] as const) {
      const caps = this.captions.filter(c => c.type === itemType);
      const mentions = this.textMentions.filter(m => m.type === itemType);
      const capNums = new Set(caps.map(c => c.num));
      const mentionNums = new Set(mentions.map(m => m.num));
      const allNums = new Set([...capNums, ...mentionNums]);
      const label = itemType === 'figure' ? 'Figure' : 'Table';

      // Check for captions without text mentions
      for (const cap of caps) {
        if (!mentionNums.has(cap.num)) {
          findings.push({
            session_id: ctx.sessionId, category: 'cross_references',
            check_name: `${label} Not Mentioned in Text`,
            severity: strict ? 'error' : 'warning', confidence: 'high', status: 'unresolved',
            summary: `${label} ${cap.num} has a caption but is never mentioned in the body text.`,
            recommendation: `Add an in-text reference such as "as shown in ${label} ${cap.num}" in the relevant section.`,
            extracted_evidence: `${label} ${cap.num}. ${cap.text}`,
            document_section: cap.section,
          });
        }
        mappings.push({
          session_id: ctx.sessionId, item_type: itemType, label_number: String(cap.num),
          caption_text: cap.text, asset_id: null,
          in_text_mentions_count: mentions.filter(m => m.num === cap.num).length,
          first_mention_location: mentions.find(m => m.num === cap.num)?.section || null,
          numbering_status: mentionNums.has(cap.num) ? 'ok' : 'orphan_caption',
          issue_flag: mentionNums.has(cap.num) ? null : 'not_mentioned',
        });
      }

      // Check for text mentions without captions
      for (const num of mentionNums) {
        if (!capNums.has(num)) {
          const mention = mentions.find(m => m.num === num)!;
          findings.push({
            session_id: ctx.sessionId, category: 'cross_references',
            check_name: `${label} Mentioned But Not Found`,
            severity: 'error', confidence: 'high', status: 'unresolved',
            summary: `Text references "${label} ${num}" but no corresponding ${itemType} caption or object was found.`,
            recommendation: `Insert the ${itemType} or correct the numbering reference.`,
            document_section: mention.section,
            extracted_evidence: `${label} ${num}`,
          });
          mappings.push({
            session_id: ctx.sessionId, item_type: itemType, label_number: String(num),
            caption_text: null, asset_id: null,
            in_text_mentions_count: mentions.filter(m => m.num === num).length,
            first_mention_location: mention.section,
            numbering_status: 'orphan_mention', issue_flag: 'no_caption',
          });
        }
      }

      // Check numbering continuity
      if (allNums.size > 0) {
        const sorted = [...allNums].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length; i++) {
          const expected = i + 1;
          if (sorted[i] !== expected && !sorted.includes(expected)) {
            findings.push({
              session_id: ctx.sessionId, category: 'cross_references',
              check_name: `${label} Numbering Gap`,
              severity: strict ? 'error' : 'warning', confidence: 'high', status: 'unresolved',
              summary: `${label} ${expected} is missing from the sequence (found: ${sorted.join(', ')}).`,
              recommendation: `Renumber ${itemType}s sequentially or add the missing ${label} ${expected}.`,
            });
            break; // one finding per type
          }
        }
      }
    }

    ctx.tableFigureMappings = mappings;
    return findings;
  }
}

// ─── RULE 6: P-VALUE CONSISTENCY ─────────────────────────────────────────────
export class PValueConsistencyRule extends IntegrityRule {
  ruleId = 'IC-STAT-01';
  category: IntegrityFinding['category'] = 'statistics';

  private pValues: PValueEntry[] = [];

  setup(_ctx: RuleContext): void { this.pValues = []; }

  visitNode(node: JSONContent, ancestors: JSONContent[], _ctx: RuleContext): void {
    if (node.type !== 'text' || !node.text) return;
    const section = this.heading(ancestors);
    // Match p = 0.034, P<0.001, p=.05, P < .001, p-value = 0.04, etc.
    const re = /\b([pP])\s*[-‐]?\s*(?:value)?\s*([=<>≤≥])\s*(0?\.\d+|\d+\.\d+|\d+)/g;
    let m;
    while ((m = re.exec(node.text)) !== null) {
      const raw = m[0];
      const cap = m[1] as 'p' | 'P';
      const numStr = m[3];
      const numVal = parseFloat(numStr);
      const hasLeadingZero = numStr.startsWith('0.');
      const decMatch = numStr.match(/\.(\d+)/);
      const decimals = decMatch ? decMatch[1].length : 0;
      const spacing = raw.includes(' ') ? 'spaced' : 'compact';

      this.pValues.push({
        raw_text: raw, numeric_value: numVal, section, capitalization: cap,
        has_leading_zero: hasLeadingZero, decimal_places: decimals,
        spacing_style: spacing, issue: null,
      });
    }
  }

  private heading(anc: JSONContent[]): string | null {
    for (let i = anc.length - 1; i >= 0; i--) {
      if (anc[i].type === 'heading' && anc[i].content?.[0]?.text) return anc[i].content![0].text!;
    }
    return null;
  }

  evaluate(ctx: RuleContext): IntegrityFinding[] {
    const findings: IntegrityFinding[] = [];
    const strict = ctx.config.strictMode;
    const pVals = this.pValues;
    ctx.pValues = pVals;
    if (pVals.length < 1) return [];

    // Impossible p-values
    for (const pv of pVals) {
      if (pv.numeric_value !== null && (pv.numeric_value > 1 || pv.numeric_value < 0)) {
        pv.issue = 'impossible';
        findings.push({
          session_id: ctx.sessionId, category: 'statistics',
          check_name: 'Impossible P-Value',
          severity: 'error', confidence: 'high', status: 'unresolved',
          summary: `P-value "${pv.raw_text}" is out of range [0, 1].`,
          recommendation: 'Verify the statistical output — p-values must be between 0 and 1.',
          document_section: pv.section, extracted_evidence: pv.raw_text,
        });
      }
    }

    // Capitalization consistency
    const pLower = pVals.filter(v => v.capitalization === 'p').length;
    const pUpper = pVals.filter(v => v.capitalization === 'P').length;
    if (pLower > 0 && pUpper > 0) {
      findings.push({
        session_id: ctx.sessionId, category: 'statistics',
        check_name: 'Inconsistent P-Value Capitalization',
        severity: strict ? 'error' : 'warning', confidence: 'high', status: 'unresolved',
        summary: `Mixed usage: lowercase "p" (${pLower}×) and uppercase "P" (${pUpper}×).`,
        recommendation: 'Use a consistent style throughout. Most journals prefer lowercase italic "p".',
      });
    }

    // Leading zero consistency
    const withZero = pVals.filter(v => v.has_leading_zero).length;
    const withoutZero = pVals.filter(v => !v.has_leading_zero && v.numeric_value !== null && v.numeric_value < 1).length;
    if (withZero > 0 && withoutZero > 0) {
      findings.push({
        session_id: ctx.sessionId, category: 'statistics',
        check_name: 'Inconsistent Leading Zero in P-Values',
        severity: strict ? 'error' : 'notice', confidence: 'medium', status: 'unresolved',
        summary: `Mixed: "0.05" style (${withZero}×) and ".05" style (${withoutZero}×).`,
        recommendation: 'Choose one style for leading zeros and apply consistently.',
      });
    }

    // Decimal precision consistency
    const precisions = new Set(pVals.map(v => v.decimal_places));
    if (precisions.size > 1) {
      findings.push({
        session_id: ctx.sessionId, category: 'statistics',
        check_name: 'Inconsistent P-Value Decimal Precision',
        severity: strict ? 'warning' : 'notice', confidence: 'medium', status: 'unresolved',
        summary: `P-values use ${precisions.size} different decimal precisions: ${[...precisions].join(', ')} places.`,
        recommendation: 'Use consistent decimal precision (typically 3 decimal places) for all p-values.',
      });
    }

    // Spacing consistency
    const spaced = pVals.filter(v => v.spacing_style === 'spaced').length;
    const compact = pVals.filter(v => v.spacing_style === 'compact').length;
    if (spaced > 0 && compact > 0) {
      findings.push({
        session_id: ctx.sessionId, category: 'statistics',
        check_name: 'Inconsistent P-Value Spacing',
        severity: strict ? 'warning' : 'notice', confidence: 'medium', status: 'unresolved',
        summary: `Mixed spacing: "p = 0.05" style (${spaced}×) and "p=0.05" style (${compact}×).`,
        recommendation: 'Use consistent spacing around the operator (e.g., "p = 0.034").',
      });
    }

    return findings;
  }
}

// ─── RULE 7: STATISTICAL NOTATION CONSISTENCY ────────────────────────────────
export class StatisticalNotationRule extends IntegrityRule {
  ruleId = 'IC-STAT-02';
  category: IntegrityFinding['category'] = 'statistics';

  private patterns: { pattern: string; section: string | null }[] = [];

  setup(_ctx: RuleContext): void { this.patterns = []; }

  visitNode(node: JSONContent, ancestors: JSONContent[], _ctx: RuleContext): void {
    if (node.type !== 'text' || !node.text) return;
    const section = this.heading(ancestors);
    const t = node.text;

    // Detect mean±SD style variations
    const sdPatterns = [
      /mean\s*±\s*SD/gi, /mean\s*\(\s*SD\s*\)/gi, /mean\s*±\s*SEM/gi,
      /mean\s*\(\s*SEM\s*\)/gi, /mean\s*±\s*SE\b/gi,
    ];
    for (const re of sdPatterns) {
      let m;
      while ((m = re.exec(t)) !== null) {
        this.patterns.push({ pattern: m[0], section });
      }
    }

    // CI format variations
    const ciPatterns = [/95\s*%\s*CI/g, /CI\s*95\s*%/g, /95\s*%\s*confidence\s+interval/gi];
    for (const re of ciPatterns) {
      let m;
      while ((m = re.exec(t)) !== null) {
        this.patterns.push({ pattern: m[0], section });
      }
    }
  }

  private heading(anc: JSONContent[]): string | null {
    for (let i = anc.length - 1; i >= 0; i--) {
      if (anc[i].type === 'heading' && anc[i].content?.[0]?.text) return anc[i].content![0].text!;
    }
    return null;
  }

  evaluate(ctx: RuleContext): IntegrityFinding[] {
    const findings: IntegrityFinding[] = [];
    const strict = ctx.config.strictMode;
    if (this.patterns.length < 2) return [];

    // Normalize and group
    const normalized = this.patterns.map(p => p.pattern.replace(/\s+/g, ' ').toLowerCase());
    const unique = new Set(normalized);
    if (unique.size > 1) {
      findings.push({
        session_id: ctx.sessionId, category: 'statistics',
        check_name: 'Inconsistent Statistical Notation',
        severity: strict ? 'error' : 'warning', confidence: 'medium', status: 'unresolved',
        summary: `${unique.size} different notation styles detected: ${[...unique].map(u => `"${u}"`).join(', ')}.`,
        recommendation: 'Standardize on one format (e.g., "mean ± SD") throughout the manuscript.',
        extracted_evidence: this.patterns.slice(0, 3).map(p => p.pattern).join(' | '),
      });
    }
    return findings;
  }
}

// ─── RULE 8: SAMPLE SIZE CONSISTENCY ─────────────────────────────────────────
export class SampleSizeConsistencyRule extends IntegrityRule {
  ruleId = 'IC-DATA-01';
  category: IntegrityFinding['category'] = 'data_consistency';

  private mentions: { text: string; value: number; section: string | null; excerpt: string }[] = [];

  setup(_ctx: RuleContext): void { this.mentions = []; }

  visitNode(node: JSONContent, ancestors: JSONContent[], _ctx: RuleContext): void {
    if (node.type !== 'text' || !node.text) return;
    const section = this.heading(ancestors);
    const t = node.text;

    // Match: n = 120, N = 120, n=120, (n = 120)
    const nRe = /\b[nN]\s*=\s*(\d+)\b/g;
    let m;
    while ((m = nRe.exec(t)) !== null) {
      this.mentions.push({ text: m[0], value: parseInt(m[1], 10), section, excerpt: t.substring(Math.max(0, m.index - 30), m.index + m[0].length + 30) });
    }

    // Match: 120 participants, 118 patients, 102 subjects, 50 samples
    const partRe = /(\d+)\s+(?:participant|patient|subject|sample|respondent|individual|case|volunteer)s?\b/gi;
    while ((m = partRe.exec(t)) !== null) {
      this.mentions.push({ text: m[0], value: parseInt(m[1], 10), section, excerpt: t.substring(Math.max(0, m.index - 30), m.index + m[0].length + 30) });
    }
  }

  private heading(anc: JSONContent[]): string | null {
    for (let i = anc.length - 1; i >= 0; i--) {
      if (anc[i].type === 'heading' && anc[i].content?.[0]?.text) return anc[i].content![0].text!;
    }
    return null;
  }

  evaluate(ctx: RuleContext): IntegrityFinding[] {
    const findings: IntegrityFinding[] = [];
    const strict = ctx.config.strictMode;

    // Build sample size mentions list for context
    const sampleSizes: SampleSizeMention[] = this.mentions.map((m, i) => ({
      id: `ss-${i}`,
      session_id: ctx.sessionId,
      detected_text: m.text,
      numeric_value: m.value,
      role_classification: 'unknown' as const,
      section: m.section,
      sentence_excerpt: m.excerpt,
      consistency_group_id: null,
      issue_flag: null,
    }));
    ctx.sampleSizes = sampleSizes;

    if (this.mentions.length < 2) return findings;

    // Group by section and compare
    const bySection = new Map<string, number[]>();
    for (const m of this.mentions) {
      const key = (m.section || 'Unknown').toLowerCase();
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key)!.push(m.value);
    }

    // Cross-section comparison: find values in one section not matching another
    const sectionNames = [...bySection.keys()];
    const allValues = [...new Set(this.mentions.map(m => m.value))];

    if (allValues.length > 1 && sectionNames.length > 1) {
      // Find the most common value (likely the "true" sample size)
      const valueCounts = new Map<number, number>();
      for (const m of this.mentions) valueCounts.set(m.value, (valueCounts.get(m.value) || 0) + 1);
      const sorted = [...valueCounts.entries()].sort((a, b) => b[1] - a[1]);

      // Flag values that differ from the most common
      const primary = sorted[0][0];
      for (const m of this.mentions) {
        if (m.value !== primary && Math.abs(m.value - primary) > 2) {
          findings.push({
            session_id: ctx.sessionId, category: 'data_consistency',
            check_name: 'Sample Size Discrepancy',
            severity: strict ? 'error' : 'warning', confidence: 'medium', status: 'unresolved',
            summary: `"${m.text}" in ${m.section || 'unknown section'} differs from the most frequently reported value (${primary}).`,
            description: `The manuscript reports ${allValues.length} different sample size values across ${sectionNames.length} sections: ${allValues.join(', ')}. If this reflects attrition or subgroups, ensure it is explicitly explained.`,
            recommendation: 'Reconcile sample size values across Abstract, Methods, Results, and Tables, or add an explanation for the difference.',
            document_section: m.section,
            extracted_evidence: m.excerpt,
          });
          break; // one summary finding
        }
      }

      // Overall summary if >2 distinct values
      if (allValues.length > 2) {
        findings.push({
          session_id: ctx.sessionId, category: 'data_consistency',
          check_name: 'Multiple Sample Sizes Detected',
          severity: 'notice', confidence: 'medium', status: 'unresolved',
          summary: `${allValues.length} distinct sample size values found: ${allValues.join(', ')} across ${sectionNames.join(', ')}.`,
          recommendation: 'Review sample size flow and ensure all values are accounted for (enrollment → exclusion → analysis).',
        });
      }
    }

    return findings;
  }
}

// ─── RULE 9: TRIAL REGISTRATION CHECK ────────────────────────────────────────
export class TrialRegistrationRule extends IntegrityRule {
  ruleId = 'IC-COMP-02';
  category: IntegrityFinding['category'] = 'compliance';

  private fullText = '';

  setup(_ctx: RuleContext): void { this.fullText = ''; }

  visitNode(node: JSONContent, _anc: JSONContent[], _ctx: RuleContext): void {
    if (node.type === 'text' && node.text) this.fullText += ' ' + node.text;
  }

  evaluate(ctx: RuleContext): IntegrityFinding[] {
    const strict = ctx.config.strictMode;
    const t = this.fullText.toLowerCase();
    const hasReg = /clinicaltrials\.gov|trial\s*regist|registration\s*(number|id|identifier)|isrctn|chictr|anzctr|ctri|pactr|prospectively\s*registered|retrospectively\s*registered|nct\d{6,}/i.test(t);

    if (!hasReg) {
      return [{
        session_id: ctx.sessionId, category: 'compliance',
        check_name: 'Missing Trial Registration Statement',
        severity: strict ? 'error' : 'warning', confidence: 'medium', status: 'unresolved',
        summary: 'No trial registration statement or registry identifier was detected.',
        description: 'Interventional clinical studies typically require registration in a public registry (e.g., ClinicalTrials.gov). Many journals mandate this for publication.',
        recommendation: 'If this is a clinical trial, add a registration statement (e.g., "This trial was registered at ClinicalTrials.gov (NCT01234567)."). If not applicable, this finding can be marked as N/A.',
      }];
    }
    return [];
  }
}

// ─── RULE 10: ORPHAN REFERENCE DETECTION ─────────────────────────────────────
export class OrphanReferenceRule extends IntegrityRule {
  ruleId = 'IC-REF-03';
  category: IntegrityFinding['category'] = 'references';

  private mentionedAuthors: Set<string> = new Set();

  setup(_ctx: RuleContext): void { this.mentionedAuthors = new Set(); }

  visitNode(node: JSONContent, _anc: JSONContent[], _ctx: RuleContext): void {
    if (node.type !== 'text' || !node.text) return;
    // Collect author surnames from in-text citations
    const citeRe = /\(([A-Z][a-z]+(?:\s+(?:et\s+al|and|&)\s*\.?)?(?:,?\s*\d{4})?)\)/g;
    let m;
    while ((m = citeRe.exec(node.text)) !== null) {
      const surname = m[1].split(/[\s,]/)[0].toLowerCase();
      if (surname.length > 2) this.mentionedAuthors.add(surname);
    }
  }

  evaluate(ctx: RuleContext): IntegrityFinding[] {
    const findings: IntegrityFinding[] = [];
    const strict = ctx.config.strictMode;
    const refs = ctx.globalReferences || [];
    if (refs.length === 0 || this.mentionedAuthors.size === 0) return [];

    let orphanCount = 0;
    for (const ref of refs) {
      const authors = ref.authors || ref.author || '';
      const title = ref.title || ref.Title || `Reference #${ref.id || '?'}`;
      // Extract first author surname
      const firstAuthor = (typeof authors === 'string' ? authors.split(/[,;&]/)[0] : '').trim().split(/\s+/).pop()?.toLowerCase() || '';

      if (firstAuthor.length > 2 && !this.mentionedAuthors.has(firstAuthor)) {
        orphanCount++;
        if (orphanCount <= 10) { // cap individual findings
          findings.push({
            session_id: ctx.sessionId, category: 'references',
            check_name: 'Orphan Bibliography Entry',
            severity: strict ? 'error' : 'notice', confidence: 'low', status: 'unresolved',
            summary: `Reference "${title}" (${firstAuthor}) may not be cited in the manuscript text.`,
            recommendation: 'Verify this reference is cited in the text, or remove it from the bibliography.',
            related_asset_id: ref.id || null, extracted_evidence: title,
          });
        }
      }
    }

    if (orphanCount > 5) {
      findings.push({
        session_id: ctx.sessionId, category: 'references',
        check_name: 'Multiple Potentially Orphan References',
        severity: strict ? 'error' : 'warning', confidence: 'medium', status: 'unresolved',
        summary: `${orphanCount} references may not be cited in the manuscript text.`,
        recommendation: 'Review your bibliography for entries that are no longer referenced in-text.',
      });
    }
    return findings;
  }
}
