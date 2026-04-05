import type { JSONContent } from '@tiptap/react';

export type ICConfidenceLevel = 'high' | 'medium' | 'low';
export type ICSeverityLevel = 'error' | 'warning' | 'notice' | 'pass';
export type ICStatus = 'unresolved' | 'resolved' | 'ignored' | 'false_positive';

export interface IntegrityFinding {
  id?: string;
  session_id: string;
  category: IntegrityCategory;
  check_name: string;
  severity: ICSeverityLevel;
  confidence: ICConfidenceLevel;
  status: ICStatus;
  summary: string;
  description?: string | null;
  recommendation?: string | null;
  document_section?: string | null;
  location_anchor?: string | null; // e.g., Node ID or exact text surrounding the issue
  related_asset_id?: string | null; // Ref ID or Table ID
  extracted_evidence?: string | null; // Quote demonstrating the issue
  reviewer_note?: string | null;
  created_at?: string;
  resolved_at?: string | null;
}

export type IntegrityCategory = 
  | 'references'
  | 'formatting'
  | 'data_consistency'
  | 'abbreviations'
  | 'cross_references'
  | 'compliance'
  | 'statistics';

export interface IntegrityScanConfig {
  categories: IntegrityCategory[];
  strictMode: boolean; // Flags minor formatting inconsistencies as errors vs warnings
  checkExternalAPIs: boolean; // e.g., verifying DOIs via external API during scan
  autoFixAllowed: boolean;
}

export interface AbbrevRegistryEntry {
  id?: string;
  session_id: string;
  abbreviation: string;
  expansion: string | null;
  first_definition_location: string | null;
  first_use_location: string | null;
  usage_count: number;
  issue_flag: string | null; // e.g., 'undefined', 'redefined_differently', 'unused'
}

export interface CitationMappingEntry {
  id?: string;
  session_id: string;
  citation_string: string;
  document_location: string | null;
  matched_reference_id: string | null;
  matched_status: 'matched' | 'orphan' | 'ambiguous';
  issue_flag: string | null; // e.g., 'not_in_bibliography', 'duplicate'
}

export interface TableFigureMappingEntry {
  id?: string;
  session_id: string;
  item_type: 'figure' | 'table';
  label_number: string;
  caption_text: string | null;
  asset_id: string | null;
  in_text_mentions_count: number;
  first_mention_location: string | null;
  numbering_status: 'ok' | 'gap' | 'duplicate' | 'orphan_caption' | 'orphan_mention';
  issue_flag: string | null;
}

export interface SampleSizeMention {
  id?: string;
  session_id: string;
  detected_text: string;           // "n = 15", "15 participants"
  numeric_value: number | null;    // 15
  role_classification: 'total_n' | 'subgroup_n' | 'excluded_n' | 'unknown';
  section: string | null;          // "Methods", "Abstract"
  sentence_excerpt: string | null; // Surrounding context
  consistency_group_id: string | null; // Used by engine to group related numbers for cross-checks
  issue_flag: string | null;       // "conflicts_with_abstract", etc.
}

export interface PValueEntry {
  raw_text: string;           // "p = 0.034"
  numeric_value: number | null;
  section: string | null;
  capitalization: 'p' | 'P';
  has_leading_zero: boolean;
  decimal_places: number;
  spacing_style: string;      // "p=X", "p = X", "p< X", etc.
  issue: string | null;
}

export interface RuleContext {
  jsonNode: JSONContent;       // Current TipTap node
  documentId: string;
  sessionId: string;
  fullJsonText: string;        // Text dump of the document for regex heuristics
  config: IntegrityScanConfig; // Running configuration
  globalReferences: any[];     // Array of dbManager.getReferences()
  globalTables: any[];         // Array of dbManager.getTbTables()
  abbreviations?: AbbrevRegistryEntry[];
  sampleSizes?: SampleSizeMention[];
  tableFigureMappings?: TableFigureMappingEntry[];
  pValues?: PValueEntry[];
  detectedCitations?: CitationMappingEntry[];
}

export interface ScanSessionResult {
  sessionId: string;
  findings: IntegrityFinding[];
  abbreviations: AbbrevRegistryEntry[];
  citations: CitationMappingEntry[];
  sampleSizes: SampleSizeMention[];
  tableFigureMappings: TableFigureMappingEntry[];
  pValues: PValueEntry[];
  stats: {
    totalFindings: number;
    errorsCount: number;
    warningsCount: number;
    noticesCount: number;
    overallScore: number;
  };
}

/**
 * Abstract class representing a single Integrity Check Rule
 */
export abstract class IntegrityRule {
  abstract ruleId: string;
  abstract category: IntegrityFinding['category'];
  
  abstract setup(context: RuleContext): void;
  abstract visitNode(node: JSONContent, ancestors: JSONContent[], context: RuleContext): void;
  abstract evaluate(context: RuleContext): IntegrityFinding[];
}
