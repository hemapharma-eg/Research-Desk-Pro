/**
 * Table Builder & Results Reporting Suite — Core Types
 * Covers all 24 specification sections.
 */

// ═══════════════════════════════════════════════
// Table Types (Section 4 — all families)
// ═══════════════════════════════════════════════

export type TableType =
  // General scientific
  | 'custom' | 'data' | 'descriptive' | 'comparison' | 'repeated-measures'
  | 'frequency' | 'crosstab' | 'correlation' | 'regression' | 'model-comparison'
  | 'anova' | 'posthoc' | 'nonparam' | 'survival' | 'diagnostic' | 'reliability'
  // Clinical / biomedical
  | 'baseline' | 'demographic' | 'adverse-events' | 'laboratory'
  | 'efficacy' | 'safety' | 'medication-exposure' | 'protocol-deviations'
  | 'endpoint' | 'subgroup'
  // Systematic review / evidence synthesis
  | 'study-characteristics' | 'rob-summary' | 'evidence-extraction'
  | 'outcome-summary' | 'grade-profile' | 'included-studies'
  // Academic / thesis
  | 'hypothesis-testing' | 'thematic-coding' | 'scale-reliability' | 'learning-outcomes'
  // Custom report
  | 'journal-template' | 'thesis-chapter' | 'supplementary' | 'landscape' | 'mixed';

export type NumberingMode = 'auto' | 'manual' | 'chapter';
export type StylePresetName = 'general-journal' | 'thesis-classic' | 'clinical-trial' | 'apa-like' | 'vancouver' | 'minimal' | 'supplementary-dense' | 'custom';
export type LinkStatus = 'none' | 'linked' | 'outdated' | 'detached';

// ═══════════════════════════════════════════════
// Cell Model (Section 20)
// ═══════════════════════════════════════════════

export interface CellFormatting {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  superscript: string;
  subscript: string;
  alignH: 'left' | 'center' | 'right' | 'decimal';
  alignV: 'top' | 'middle' | 'bottom';
  textWrap: boolean;
  bgColor: string;
  borderTop: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  borderRight: boolean;
  indent: number;
  prefix: string;
  suffix: string;
  unit: string;
}

export const DEFAULT_CELL_FORMATTING: CellFormatting = {
  bold: false, italic: false, underline: false,
  superscript: '', subscript: '',
  alignH: 'left', alignV: 'middle',
  textWrap: true,
  bgColor: '',
  borderTop: false, borderBottom: false, borderLeft: false, borderRight: false,
  indent: 0,
  prefix: '', suffix: '', unit: '',
};

export type CellFormatType = 'text' | 'number' | 'percentage' | 'p-value' | 'ci' | 'mixed' | 'symbol';

export interface TBCell {
  id: string;
  rawValue: string | number | null;
  displayValue: string;
  formatType: CellFormatType;
  numericPrecision: number;
  sourceBinding: { analysisId: string; field: string; path: string } | null;
  manualOverride: boolean;
  noteMarkers: string[];     // footnote IDs
  validationFlags: string[];
  formatting: CellFormatting;
}

// ═══════════════════════════════════════════════
// Column / Row / Header models
// ═══════════════════════════════════════════════

export interface TBColumn {
  id: string;
  title: string;
  width: number | 'auto';
  locked: boolean;
  hidden: boolean;
  defaultFormat: Partial<CellFormatting>;
  mergeSpan?: number; // colspan for grouped headers
}

export interface TBRow {
  id: string;
  cells: Record<string, TBCell>;
  sectionLabel?: string;     // spanning section label
  isSeparator?: boolean;     // blank divider row
  isSubtotal?: boolean;
  indent?: number;           // hierarchical row groups
  rowGroup?: string;
}

export interface GroupedHeader {
  id: string;
  label: string;
  startColId: string;
  endColId: string;
  level: number; // for nested / multi-level headers
}

// ═══════════════════════════════════════════════
// Footnotes System (Section 12)
// ═══════════════════════════════════════════════

export type FootnoteStyle = 'alphabetic' | 'numeric' | 'symbolic' | 'significance' | 'abbreviation' | 'test-legend' | 'missing-data' | 'reference-category' | 'model-adjustment';

export interface Footnote {
  id: string;
  marker: string;            // 'a', '1', '*', '†', etc.
  type: FootnoteStyle;
  text: string;
  attachedTo: { kind: 'cell' | 'header' | 'row' | 'table'; targetId: string }[];
}

// ═══════════════════════════════════════════════
// Source Link (Section 8)
// ═══════════════════════════════════════════════

export interface SourceLink {
  analysisId: string;
  datasetId: string;
  testName: string;
  variablesUsed: string[];
  analysisDate: number;
  datasetVersion: number;
  fieldMapping: Record<string, string>; // cell ID → stat result field path
  status: LinkStatus;
  lastRefreshAt: number;
}

// ═══════════════════════════════════════════════
// Style Options (Section 11)
// ═══════════════════════════════════════════════

export interface SigSymbol {
  threshold: number;
  symbol: string;
}

export interface TableStyleOptions {
  fontFamily: string;
  fontSize: number;
  headerStyle: { bold: boolean; bgColor: string; borderBottom: boolean; uppercase: boolean };
  borderStyle: 'top-bottom-only' | 'full-grid' | 'horizontal-only' | 'none';
  rowStriping: boolean;
  sectionRowEmphasis: boolean;
  cellPadding: number;
  lineSpacing: number;
  numericAlignment: 'right' | 'decimal' | 'center';
  boldFirstColumn: boolean;
  // P-value formatting
  pValueDecimals: 3 | 4 | 5;
  pValueThreshold: boolean;
  pValueItalic: boolean;
  pValueLeadingZero: boolean;
  significanceStars: boolean;
  // CI formatting
  ciStyle: 'brackets' | 'parentheses' | 'to' | 'separate-columns' | 'compact';
  ciDecimals: number;
  // Effect size
  effectSizeDecimals: number;
  // Significance symbols
  sigSymbols: SigSymbol[];
}

export const DEFAULT_TABLE_STYLE: TableStyleOptions = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: 11,
  headerStyle: { bold: true, bgColor: '#f1f3f5', borderBottom: true, uppercase: false },
  borderStyle: 'top-bottom-only',
  rowStriping: false,
  sectionRowEmphasis: true,
  cellPadding: 6,
  lineSpacing: 1.4,
  numericAlignment: 'right',
  boldFirstColumn: true,
  pValueDecimals: 3,
  pValueThreshold: true,
  pValueItalic: true,
  pValueLeadingZero: false,
  significanceStars: true,
  ciStyle: 'brackets',
  ciDecimals: 2,
  effectSizeDecimals: 2,
  sigSymbols: [
    { threshold: 0.001, symbol: '***' },
    { threshold: 0.01,  symbol: '**'  },
    { threshold: 0.05,  symbol: '*'   },
  ],
};

// ═══════════════════════════════════════════════
// Table Document Model (Section 20)
// ═══════════════════════════════════════════════

export interface TableDocument {
  id: string;
  name: string;
  title: string;
  caption: string;
  tableType: TableType;
  tableNumber: string;
  numberingMode: NumberingMode;
  category: string;
  stylePreset: StylePresetName;
  columns: TBColumn[];
  rows: TBRow[];
  groupedHeaders: GroupedHeader[];
  footnotes: Footnote[];
  sourceLink: SourceLink | null;
  styleOptions: TableStyleOptions;
  sectionTarget: string;
  keywords: string;
  notesToSelf: string;
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════════
// Narrative settings (Section 10)
// ═══════════════════════════════════════════════

export type NarrativeTone = 'neutral' | 'concise' | 'formal';
export type NarrativeType = 'concise' | 'expanded' | 'objective' | 'multi-comparison' | 'regression' | 'baseline' | 'adverse' | 'evidence';

export interface NarrativeSettings {
  tone: NarrativeTone;
  mentionTestNames: boolean;
  reportExactP: boolean;
  reportPThresholds: boolean;
  includeEffectSizes: boolean;
  includeCI: boolean;
  defineAbbreviations: boolean;
  mentionNonSignificant: boolean;
  mentionAssumptions: boolean;
  usePassiveVoice: boolean;
}

export const DEFAULT_NARRATIVE_SETTINGS: NarrativeSettings = {
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

export interface NarrativeDraft {
  id: string;
  tableId: string;
  narrativeType: NarrativeType;
  tone: NarrativeTone;
  content: string;
  settings: NarrativeSettings;
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════════
// Validation (Section 13)
// ═══════════════════════════════════════════════

export type ValidationSeverity = 'error' | 'warning' | 'suggestion';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: string;
  location: string;
  description: string;
  quickFixAvailable: boolean;
}

// ═══════════════════════════════════════════════
// Document Link
// ═══════════════════════════════════════════════

export type InsertionType = 'linked' | 'static' | 'appendix' | 'supplementary';
export type DocLinkStatus = 'synced' | 'outdated' | 'detached';

export interface DocumentLink {
  id: string;
  tableId: string;
  documentId: string;
  insertionType: InsertionType;
  positionMarker: string;
  captionPlacement: 'above' | 'below';
  includeFootnotes: boolean;
  includeNarrative: boolean;
  lastSyncedAt: number;
  updateStatus: DocLinkStatus;
  createdAt: number;
}

// ═══════════════════════════════════════════════
// Audit Trail (Section 16)
// ═══════════════════════════════════════════════

export type AuditAction = 'create' | 'edit_cell' | 'refresh_from_source' | 'manual_override' | 'insert_doc' | 'export' | 'narrative_gen' | 'style_change' | 'footnote_change';

export interface AuditEntry {
  id: string;
  tableId: string;
  action: AuditAction;
  details: Record<string, any>;
  timestamp: number;
}

// ═══════════════════════════════════════════════
// Export (Section 14)
// ═══════════════════════════════════════════════

export type ExportFormat = 'pdf' | 'csv' | 'tsv' | 'image' | 'markdown' | 'clipboard' | 'docx' | 'native' | 'json' | 'rich-text' | 'plain-text';

export interface ExportEntry {
  id: string;
  tableId: string;
  format: ExportFormat;
  filePath: string;
  options: Record<string, any>;
  exportedAt: number;
}

// ═══════════════════════════════════════════════
// Project-Wide Settings (Section 17)
// ═══════════════════════════════════════════════

export interface JournalProfile {
  id: string;
  name: string;
  styleOptions: TableStyleOptions;
  narrativeSettings: NarrativeSettings;
}

export interface TableBuilderSettings {
  defaultFont: string;
  defaultFontSize: number;
  defaultNumberingStyle: NumberingMode;
  defaultPValueStyle: 'exact-3' | 'exact-4' | 'threshold';
  defaultDecimals: number;
  defaultCIStyle: string;
  defaultEffectSizeStyle: string;
  defaultCaptionPlacement: 'above' | 'below';
  defaultFootnoteStyle: FootnoteStyle;
  defaultNarrativeTone: NarrativeTone;
  validationStrictness: 'relaxed' | 'standard' | 'strict';
  journalProfiles: JournalProfile[];
}

export const DEFAULT_SETTINGS: TableBuilderSettings = {
  defaultFont: "'Helvetica Neue', Arial, sans-serif",
  defaultFontSize: 11,
  defaultNumberingStyle: 'auto',
  defaultPValueStyle: 'threshold',
  defaultDecimals: 2,
  defaultCIStyle: 'brackets',
  defaultEffectSizeStyle: 'decimal-2',
  defaultCaptionPlacement: 'above',
  defaultFootnoteStyle: 'alphabetic',
  defaultNarrativeTone: 'neutral',
  validationStrictness: 'standard',
  journalProfiles: [],
};

// ═══════════════════════════════════════════════
// Wizard Types (Section 4)
// ═══════════════════════════════════════════════

export type SourceType = 'blank' | 'manual' | 'import-csv' | 'from-stats' | 'from-graphing' | 'from-meta-analysis' | 'duplicate' | 'template';

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  sourceType: SourceType;
  tableType: TableType;
  structure: {
    columnCount: number;
    rowCount: number;
    hasGroupedHeaders: boolean;
    hasSubheaders: boolean;
    hasRowSections: boolean;
    hasStubColumn: boolean;
    statsLayout: 'single-cell' | 'split-columns';
    separatePCI: boolean;
    hasFootnotes: boolean;
    autoSignificance: boolean;
    linkedToSource: boolean;
  };
  metadata: {
    title: string;
    name: string;
    caption: string;
    numberingMode: NumberingMode;
    manualNumber: string;
    category: string;
    sourceAnalysisId: string;
    sourceDatasetId: string;
    sectionTarget: string;
    keywords: string;
    notesToSelf: string;
  };
  stylePreset: StylePresetName;
}

// ═══════════════════════════════════════════════
// DB Row types (for IPC serialization)
// ═══════════════════════════════════════════════

export interface TableRow {
  id: string;
  name: string;
  title: string;
  caption: string;
  table_type: string;
  table_number: string;
  numbering_mode: string;
  category: string;
  style_preset: string;
  columns_json: string;
  rows_json: string;
  grouped_headers_json: string;
  footnotes_json: string;
  source_analysis_id: string | null;
  source_dataset_id: string | null;
  source_mapping_json: string;
  link_status: string;
  last_refresh_at: string | null;
  style_options_json: string;
  section_target: string;
  keywords: string;
  notes_to_self: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface NarrativeRow {
  id: string;
  table_id: string;
  narrative_type: string;
  tone: string;
  content: string;
  settings_json: string;
  created_at: string;
  updated_at: string;
}

export interface DocLinkRow {
  id: string;
  table_id: string;
  document_id: string;
  insertion_type: string;
  position_marker: string;
  caption_placement: string;
  include_footnotes: number;
  include_narrative: number;
  last_synced_at: string | null;
  update_status: string;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  table_id: string;
  action: string;
  details_json: string;
  timestamp: string;
}

export interface ExportHistoryRow {
  id: string;
  table_id: string;
  format: string;
  file_path: string;
  options_json: string;
  exported_at: string;
}

// ═══════════════════════════════════════════════
// Studio Tab Type
// ═══════════════════════════════════════════════

export type TableBuilderTab = 'home' | 'new' | 'canvas' | 'style' | 'source' | 'narrative' | 'library' | 'insert' | 'export' | 'audit' | 'settings';
