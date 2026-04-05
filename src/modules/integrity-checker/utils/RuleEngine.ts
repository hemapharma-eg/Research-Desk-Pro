import type { JSONContent } from '@tiptap/react';
import type { 
  IntegrityFinding, 
  IntegrityScanConfig, 
  ScanSessionResult, 
  AbbrevRegistryEntry,
  IntegrityCategory,
  RuleContext
} from '../types/IntegrityTypes';
import { IntegrityRule } from '../types/IntegrityTypes';
import {
  FigureTableMentionRule,
  PValueConsistencyRule,
  StatisticalNotationRule,
  SampleSizeConsistencyRule,
  TrialRegistrationRule,
  OrphanReferenceRule,
} from './AdditionalRules';


// ─── COMMON EXCLUSION LIST ────────────────────────────────────────────────────
// Common uppercase words that are NOT abbreviations
const COMMON_UPPERCASE_EXCLUSIONS = new Set([
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XX', 'XXI',
  'AM', 'PM', 'AD', 'BC', 'VS', 'EG', 'IE', 'ET', 'AL',
  'OK', 'NO', 'OR', 'AN', 'AT', 'BY', 'DO', 'GO', 'IF', 'IN',
  'IS', 'IT', 'MY', 'OF', 'ON', 'SO', 'TO', 'UP', 'WE',
  'USA', 'UK', 'EU',
  'HTML', 'CSS', 'HTTP', 'HTTPS', 'URL', 'API', 'PDF', 'PNG', 'JPG',
  'NULL', 'TRUE', 'FALSE',
]);

// ─── RULE 1: ORPHAN CITATION DETECTION ────────────────────────────────────────
class OrphanCitationRule extends IntegrityRule {
  ruleId = 'IC-REF-01';
  category: IntegrityFinding['category'] = 'references';
  
  private bareCitationMatches: {text: string, section: string | null}[] = [];

  setup(_context: RuleContext): void {
    this.bareCitationMatches = [];
  }

  visitNode(node: JSONContent, ancestors: JSONContent[], _context: RuleContext): void {
    if (node.type === 'text' && node.text) {
      const isWrappedInCitationObj = ancestors.some(a => a.type === 'citationLink' || a.type === 'referenceNode');
      
      if (!isWrappedInCitationObj) {
        // Match patterns like:
        //   (Author et al., 2021)
        //   (Author and Author, 2021)
        //   (Author et al., 2021; Author et al., 2022)
        //   (Hany H. Arab et al., 2021)
        const regex = /\((?:[A-Z][A-Za-z.\s]+(?:et al\.)?,?\s*\d{4}[;,]?\s*)+\)/g;
        let match;
        while ((match = regex.exec(node.text)) !== null) {
          const sectionHeading = this.findSectionHeading(ancestors);
          this.bareCitationMatches.push({ text: match[0], section: sectionHeading });
        }
      }
    }
  }

  private findSectionHeading(ancestors: JSONContent[]): string | null {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (ancestors[i].type === 'heading' && ancestors[i].content?.[0]?.text) {
        return ancestors[i].content![0].text!;
      }
    }
    return null;
  }

  evaluate(context: RuleContext): IntegrityFinding[] {
    const strict = context.config.strictMode;
    return this.bareCitationMatches.map((match) => ({
      session_id: context.sessionId,
      category: this.category,
      check_name: 'Unlinked In-Text Citation',
      severity: (strict ? 'error' : 'warning') as 'error' | 'warning',
      confidence: 'medium' as const,
      status: 'unresolved' as const,
      summary: `Found an unlinked text citation: ${match.text}`,
      description: 'This citation appears as raw text rather than a dynamically linked reference object. If the citation style or bibliography order changes, this text will NOT auto-update.' + (strict ? ' (Strict Mode: elevated to Error)' : ''),
      recommendation: 'Use the Reference Manager sidebar to insert a linked citation that updates automatically.',
      document_section: match.section,
      extracted_evidence: match.text,
    }));
  }
}

// ─── RULE 2: ABBREVIATION CONSISTENCY ─────────────────────────────────────────
class AbbreviationConsistencyRule extends IntegrityRule {
  ruleId = 'IC-ABBR-01';
  category: IntegrityFinding['category'] = 'abbreviations';
  
  private definitions: Map<string, { expansion: string, section: string | null, position: number }> = new Map();
  private usages: { abbreviation: string, section: string | null, text: string, position: number }[] = [];
  private positionCounter = 0;

  setup(_context: RuleContext): void {
    this.definitions.clear();
    this.usages = [];
    this.positionCounter = 0;
  }

  visitNode(node: JSONContent, ancestors: JSONContent[], _context: RuleContext): void {
    if (node.type === 'text' && node.text) {
      this.positionCounter++;
      const section = this.findSectionHeading(ancestors);

      // ── Match abbreviation definitions ──
      // Patterns:  "some phrase (ABBR)"  or  "Some Phrase (ABBR)"
      // Case-insensitive for the expansion part - catches "effect size of this data (ESD)"
      const defRegex = /([a-zA-Z][a-zA-Z\s\-,]{2,})\s*\(([A-Z][A-Z0-9]{1,})\)/g;
      let defMatch;
      while ((defMatch = defRegex.exec(node.text)) !== null) {
        const expansion = defMatch[1].trim();
        const abbr = defMatch[2];
        if (!COMMON_UPPERCASE_EXCLUSIONS.has(abbr)) {
          if (!this.definitions.has(abbr)) {
            this.definitions.set(abbr, { expansion, section, position: this.positionCounter });
          }
        }
      }

      // ── Match abbreviation usages ──
      // Any standalone uppercase word 2+ characters
      const useRegex = /\b([A-Z][A-Z0-9]{1,})\b/g;
      let useMatch;
      while ((useMatch = useRegex.exec(node.text)) !== null) {
        const abbr = useMatch[1];
        if (!COMMON_UPPERCASE_EXCLUSIONS.has(abbr) && abbr.length >= 2) {
          this.usages.push({ abbreviation: abbr, section, text: node.text, position: this.positionCounter });
        }
      }
    }
  }

  private findSectionHeading(ancestors: JSONContent[]): string | null {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (ancestors[i].type === 'heading' && ancestors[i].content?.[0]?.text) {
        return ancestors[i].content![0].text!;
      }
    }
    return null;
  }

  evaluate(context: RuleContext): IntegrityFinding[] {
    const findings: IntegrityFinding[] = [];
    const strict = context.config.strictMode;
    
    // Build usage statistics
    const usageCounts = new Map<string, number>();
    const firstUses = new Map<string, { section: string | null, position: number }>();

    this.usages.forEach(u => {
      usageCounts.set(u.abbreviation, (usageCounts.get(u.abbreviation) || 0) + 1);
      if (!firstUses.has(u.abbreviation)) {
        firstUses.set(u.abbreviation, { section: u.section, position: u.position });
      }
    });

    const entries: AbbrevRegistryEntry[] = [];

    for (const [abbr, count] of usageCounts.entries()) {
      const hasDef = this.definitions.has(abbr);
      const def = this.definitions.get(abbr);
      const firstUse = firstUses.get(abbr);

      let issueFlag: string | null = null;

      // Check 1: Abbreviation used but never defined
      if (!hasDef) {
        issueFlag = 'undefined';
        findings.push({
          session_id: context.sessionId,
          category: 'abbreviations',
          check_name: 'Undefined Abbreviation',
          severity: strict ? 'error' : 'warning',
          confidence: count > 1 ? 'high' : 'medium',
          status: 'unresolved',
          summary: `Abbreviation "${abbr}" is used ${count} time${count > 1 ? 's' : ''} but never defined (no full expansion found).` + (strict ? ' [Strict]' : ''),
          document_section: firstUse?.section || null,
          recommendation: `Write out the full form of "${abbr}" at its first mention, e.g., "Full Name (${abbr})".`,
          extracted_evidence: `... ${abbr} ...`
        });
      }

      // Check 2: Definition exists but appears AFTER first usage
      if (hasDef && def && firstUse && def.position > firstUse.position) {
        issueFlag = 'late_definition';
        findings.push({
          session_id: context.sessionId,
          category: 'abbreviations',
          check_name: 'Late Abbreviation Definition',
          severity: strict ? 'warning' : 'notice',
          confidence: 'high',
          status: 'unresolved',
          summary: `"${abbr}" is used before it is defined. First use in "${firstUse.section || 'unknown section'}", defined later in "${def.section || 'unknown section'}".` + (strict ? ' [Strict]' : ''),
          document_section: firstUse.section,
          recommendation: `Move the definition "${def.expansion} (${abbr})" to the first mention of "${abbr}".`,
          extracted_evidence: `${def.expansion} (${abbr})`
        });
      }

      // Always add to the registry (even single-use abbreviations for visibility)
      entries.push({
        id: `abbr-${abbr}`,
        session_id: context.sessionId,
        abbreviation: abbr,
        expansion: def ? def.expansion : null,
        first_definition_location: def ? def.section : null,
        first_use_location: firstUse?.section || null,
        usage_count: count,
        issue_flag: issueFlag
      });
    }

    context.abbreviations = entries;
    return findings;
  }
}

// ─── RULE 3: COMPLIANCE STATEMENT CHECKER ─────────────────────────────────────
class ComplianceStatementRule extends IntegrityRule {
  ruleId = 'IC-COMP-01';
  category: IntegrityFinding['category'] = 'compliance';
  
  private fullText = '';
  private headings: string[] = [];

  setup(_context: RuleContext): void {
    this.fullText = '';
    this.headings = [];
  }

  visitNode(node: JSONContent, _ancestors: JSONContent[], _context: RuleContext): void {
    if (node.type === 'text' && node.text) {
      this.fullText += ' ' + node.text;
    }
    if (node.type === 'heading' && node.content) {
      const headingText = node.content.map(c => c.text || '').join('');
      if (headingText.trim()) {
        this.headings.push(headingText.trim().toLowerCase());
      }
    }
  }

  evaluate(context: RuleContext): IntegrityFinding[] {
    const findings: IntegrityFinding[] = [];
    const strict = context.config.strictMode;
    const textLower = this.fullText.toLowerCase();
    const headingsJoined = this.headings.join(' | ');

    // Check for IRB / Ethics approval
    const hasEthics = /irb|institutional review board|ethics committee|ethical approval|ethics approval|informed consent/.test(textLower);
    if (!hasEthics) {
      findings.push({
        session_id: context.sessionId,
        category: 'compliance',
        check_name: 'Missing IRB / Ethics Approval Statement',
        severity: 'error',
        confidence: 'high',
        status: 'unresolved',
        summary: 'No mention of IRB, ethics committee approval, or informed consent was detected in the manuscript.',
        recommendation: 'Add an ethics/IRB approval statement, typically in the Methods section. E.g., "This study was approved by the Institutional Review Board of [Institution] (Protocol #XXXX)."',
      });
    }

    // Check for Funding / Acknowledgments
    const hasFunding = /funding|grant|financial support|acknowledgment|acknowledgement|funded by|supported by/.test(textLower);
    const hasFundingHeading = /fund|acknowledgm|grant/.test(headingsJoined);
    if (!hasFunding && !hasFundingHeading) {
      findings.push({
        session_id: context.sessionId,
        category: 'compliance',
        check_name: 'Missing Funding / Acknowledgments',
        severity: strict ? 'error' : 'warning',
        confidence: 'high',
        status: 'unresolved',
        summary: 'No funding or acknowledgment statement was detected.' + (strict ? ' [Strict]' : ''),
        recommendation: 'Add a Funding section. Example: "This research received no specific grant from any funding agency." or list your specific grants.',
      });
    }

    // Check for Conflicts of Interest
    const hasCOI = /conflict.{0,5}of.{0,5}interest|competing.{0,5}interest|no.{0,5}conflict|declare.{0,10}conflict/.test(textLower);
    if (!hasCOI) {
      findings.push({
        session_id: context.sessionId,
        category: 'compliance',
        check_name: 'Missing Conflict of Interest Declaration',
        severity: strict ? 'error' : 'warning',
        confidence: 'high',
        status: 'unresolved',
        summary: 'No conflict of interest / competing interests statement was found.' + (strict ? ' [Strict]' : ''),
        recommendation: 'Add: "The authors declare no conflicts of interest." in a Declarations section.',
      });
    }

    // Check for Data Availability
    const hasDataAvail = /data.{0,10}availab|data.{0,10}access|open.{0,5}data|repository|supplementary.{0,5}data|data.{0,10}sharing/.test(textLower);
    if (!hasDataAvail) {
      findings.push({
        session_id: context.sessionId,
        category: 'compliance',
        check_name: 'Missing Data Availability Statement',
        severity: strict ? 'warning' : 'notice',
        confidence: 'medium',
        status: 'unresolved',
        summary: 'No data availability or data sharing statement was detected. Many journals now require this.' + (strict ? ' [Strict]' : ''),
        recommendation: 'Add a Data Availability heading. Example: "The datasets generated during and/or analysed during the current study are available from the corresponding author on reasonable request."',
      });
    }

    return findings;
  }
}

// ─── RULE 4: DOI VALIDATION ───────────────────────────────────────────────────
class DOIValidationRule extends IntegrityRule {
  ruleId = 'IC-REF-02';
  category: IntegrityFinding['category'] = 'references';

  setup(_context: RuleContext): void {}
  visitNode(_node: JSONContent, _ancestors: JSONContent[], _context: RuleContext): void {}

  evaluate(context: RuleContext): IntegrityFinding[] {
    // Only run when "Verify DOIs Online" is enabled
    if (!context.config.checkExternalAPIs) return [];

    const findings: IntegrityFinding[] = [];
    const refs: any[] = context.globalReferences || [];
    const strict = context.config.strictMode;

    // Valid DOI format: 10.XXXX/... (standard DOI prefix)
    const doiRegex = /^10\.\d{4,9}\/[^\s]+$/;

    let missingDoiCount = 0;
    let invalidDoiCount = 0;

    for (const ref of refs) {
      const doi = ref.doi || ref.DOI || '';
      const title = ref.title || ref.Title || `Reference #${ref.id || '?'}`;

      if (!doi || doi.trim() === '') {
        missingDoiCount++;
        findings.push({
          session_id: context.sessionId,
          category: 'references',
          check_name: 'Missing DOI',
          severity: strict ? 'error' : 'warning',
          confidence: 'high',
          status: 'unresolved',
          summary: `Reference "${title}" has no DOI.`,
          description: 'A Digital Object Identifier (DOI) is required by most journals for all cited works that have one. Missing DOIs can lead to reviewer objections or desk-rejection.',
          recommendation: 'Look up the DOI at https://doi.org or https://search.crossref.org and add it to the reference metadata.',
          related_asset_id: ref.id || null,
          extracted_evidence: title,
        });
      } else {
        // Normalize: strip leading "https://doi.org/" or "doi:" prefixes
        const normalizedDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();

        if (!doiRegex.test(normalizedDoi)) {
          invalidDoiCount++;
          findings.push({
            session_id: context.sessionId,
            category: 'references',
            check_name: 'Invalid DOI Format',
            severity: strict ? 'error' : 'warning',
            confidence: 'high',
            status: 'unresolved',
            summary: `Reference "${title}" has a malformed DOI: "${doi}".`,
            description: `The DOI "${doi}" does not match the standard format (10.XXXX/...). This may prevent readers from resolving the link.`,
            recommendation: 'Verify and correct the DOI. Valid DOIs start with "10." followed by a registrant code and a suffix separated by "/".',
            related_asset_id: ref.id || null,
            extracted_evidence: doi,
          });
        }
      }
    }

    // Summary finding if many references lack DOIs
    if (refs.length > 0 && missingDoiCount > 3) {
      findings.push({
        session_id: context.sessionId,
        category: 'references',
        check_name: 'Bulk Missing DOIs',
        severity: strict ? 'error' : 'notice',
        confidence: 'high',
        status: 'unresolved',
        summary: `${missingDoiCount} out of ${refs.length} references are missing DOIs.`,
        description: 'A significant number of references lack DOI identifiers. This may indicate incomplete metadata import or manually entered references.',
        recommendation: 'Use the Reference Manager to batch-lookup DOIs via CrossRef or update through BibTeX/RIS reimport.',
      });
    }

    return findings;
  }
}

// ─── MAIN ENGINE ──────────────────────────────────────────────────────────────
export class IntegrityRuleEngine {
  private rules: IntegrityRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  // Map each rule to the categories it covers for filtering
  private static readonly RULE_CATEGORY_MAP: Record<string, IntegrityCategory[]> = {
    'IC-REF-01':  ['references'],
    'IC-ABBR-01': ['abbreviations'],
    'IC-COMP-01': ['compliance'],
    'IC-REF-02':  ['references'],
    'IC-FIG-01':  ['cross_references'],
    'IC-STAT-01': ['statistics'],
    'IC-STAT-02': ['statistics'],
    'IC-DATA-01': ['data_consistency'],
    'IC-COMP-02': ['compliance'],
    'IC-REF-03':  ['references'],
  };

  private registerDefaultRules() {
    this.rules.push(new OrphanCitationRule());
    this.rules.push(new AbbreviationConsistencyRule());
    this.rules.push(new ComplianceStatementRule());
    this.rules.push(new DOIValidationRule());
    this.rules.push(new FigureTableMentionRule());
    this.rules.push(new PValueConsistencyRule());
    this.rules.push(new StatisticalNotationRule());
    this.rules.push(new SampleSizeConsistencyRule());
    this.rules.push(new TrialRegistrationRule());
    this.rules.push(new OrphanReferenceRule());
  }

  public runScan(
    jsonDoc: JSONContent, 
    documentId: string, 
    sessionId: string,
    config: IntegrityScanConfig,
    globalReferences: any[],
    globalTables: any[]
  ): ScanSessionResult {
    
    const fullJsonText = this.extractPlainText(jsonDoc);
    
    const context: RuleContext = {
      jsonNode: jsonDoc,
      documentId,
      sessionId,
      fullJsonText,
      config,
      globalReferences,
      globalTables
    };

    // Filter rules by selected categories
    const selectedCategories = new Set(config.categories);
    const activeRules = this.rules.filter(rule => {
      const ruleCategories = IntegrityRuleEngine.RULE_CATEGORY_MAP[rule.ruleId] || [rule.category];
      return ruleCategories.some(cat => selectedCategories.has(cat));
    });

    // 1. Setup Phase
    activeRules.forEach(rule => rule.setup(context));

    // 2. Traversal Phase — all rules need traversal even if filtered (some share context)
    activeRules.forEach(rule => rule.setup(context));
    this.traverse(jsonDoc, [], context, activeRules);

    // 3. Evaluation Phase
    let allFindings: IntegrityFinding[] = [];
    activeRules.forEach(rule => {
      const findings = rule.evaluate(context);
      allFindings = allFindings.concat(findings);
    });

    // Compute stats
    const errors = allFindings.filter(f => f.severity === 'error').length;
    const warnings = allFindings.filter(f => f.severity === 'warning').length;
    const notices = allFindings.filter(f => f.severity === 'notice').length;

    const deduction = (errors * 10) + (warnings * 3) + (notices * 1);
    const overallScore = Math.max(0, 100 - deduction);

    return {
      sessionId,
      findings: allFindings,
      abbreviations: context.abbreviations || [],
      citations: context.detectedCitations || [],
      sampleSizes: context.sampleSizes || [],
      tableFigureMappings: context.tableFigureMappings || [],
      pValues: context.pValues || [],
      stats: {
        totalFindings: allFindings.length,
        errorsCount: errors,
        warningsCount: warnings,
        noticesCount: notices,
        overallScore
      }
    };
  }

  /**
   * Scan from raw HTML content (the format stored in the DB).
   * Strips base64 images first to speed up parsing, then converts to pseudo-JSONContent.
   */
  public runScanFromHtml(
    htmlContent: string,
    documentId: string,
    sessionId: string,
    config: IntegrityScanConfig,
    globalReferences: any[],
    globalTables: any[]
  ): ScanSessionResult {
    // Strip base64 images to massively reduce parsing overhead (3MB -> ~10KB)
    const strippedHtml = htmlContent.replace(/<img[^>]*src="data:[^"]*"[^>]*>/gi, '');
    const pseudoDoc = this.htmlToJsonContent(strippedHtml);
    return this.runScan(pseudoDoc, documentId, sessionId, config, globalReferences, globalTables);
  }

  /**
   * Convert HTML into a pseudo Tiptap JSONContent tree.
   * Preserves heading/section hierarchy so rules can identify which section text belongs to.
   */
  private htmlToJsonContent(html: string): JSONContent {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const convertNode = (el: Node): JSONContent | null => {
      if (el.nodeType === Node.TEXT_NODE) {
        const text = el.textContent || '';
        if (!text.trim()) return null;
        return { type: 'text', text };
      }

      if (el.nodeType !== Node.ELEMENT_NODE) return null;
      const element = el as Element;
      const tagName = element.tagName.toLowerCase();
      
      let nodeType = 'paragraph';
      const attrs: Record<string, any> = {};

      if (/^h[1-6]$/.test(tagName)) {
        nodeType = 'heading';
        attrs.level = parseInt(tagName[1], 10);
      } else if (tagName === 'p') {
        nodeType = 'paragraph';
      } else if (tagName === 'ul' || tagName === 'ol') {
        nodeType = tagName === 'ul' ? 'bulletList' : 'orderedList';
      } else if (tagName === 'li') {
        nodeType = 'listItem';
      } else if (tagName === 'table') {
        nodeType = 'table';
      } else if (tagName === 'tr') {
        nodeType = 'tableRow';
      } else if (tagName === 'td' || tagName === 'th') {
        nodeType = 'tableCell';
      } else if (tagName === 'blockquote') {
        nodeType = 'blockquote';
      } else if (tagName === 'br') {
        return { type: 'hardBreak' };
      } else if (tagName === 'img') {
        return null; // Skip images
      } else if (tagName === 'hr' || tagName === 'style' || tagName === 'script') {
        return null; // Skip decorative / non-content
      } else if (['span', 'strong', 'em', 'b', 'i', 'u', 'a', 'sub', 'sup', 'mark', 'font', 'code'].includes(tagName)) {
        // Inline elements: recurse into children, flatten text through
        const children: JSONContent[] = [];
        el.childNodes.forEach(child => {
          const converted = convertNode(child);
          if (converted) children.push(converted);
        });
        if (children.length === 0) return null;
        if (children.length === 1) return children[0];
        // Return as a wrapper that preserves children
        return { type: 'inline', content: children };
      } else if (['div', 'section', 'article', 'main', 'body', 'header', 'footer', 'nav', 'aside'].includes(tagName)) {
        nodeType = 'doc';
      }

      const content: JSONContent[] = [];
      el.childNodes.forEach(child => {
        const converted = convertNode(child);
        if (converted) content.push(converted);
      });

      const node: JSONContent = { type: nodeType };
      if (Object.keys(attrs).length > 0) node.attrs = attrs;
      if (content.length > 0) node.content = content;

      return node;
    };

    const body = doc.body;
    const content: JSONContent[] = [];
    body.childNodes.forEach(child => {
      const converted = convertNode(child);
      if (converted) content.push(converted);
    });

    return { type: 'doc', content };
  }

  /**
   * Recursively walks the Tiptap JSON tree, tracking the last heading seen
   * so child text nodes know which section they belong to.
   */
  private traverse(node: JSONContent, ancestors: JSONContent[], context: RuleContext, activeRules?: IntegrityRule[]) {
    const rulesToRun = activeRules || this.rules;
    rulesToRun.forEach(rule => rule.visitNode(node, ancestors, context));

    if (node.content && Array.isArray(node.content)) {
      // When we encounter a heading, include it in the ancestors for its siblings.
      // This is crucial for section-awareness.
      let currentAncestors = [...ancestors, node];
      
      for (const child of node.content) {
        if (child.type === 'heading') {
          // Update the ancestor chain so subsequent siblings see this heading
          currentAncestors = [...ancestors, node, child];
          this.traverse(child, [...ancestors, node], context, rulesToRun);
        } else {
          this.traverse(child, currentAncestors, context, rulesToRun);
        }
      }
    }
  }

  private extractPlainText(node: JSONContent): string {
    if (node.type === 'text') return node.text || '';
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(c => this.extractPlainText(c)).join(' ');
    }
    return '';
  }
}
