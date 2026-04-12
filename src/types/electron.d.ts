export interface DocMetadata {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export interface Document extends DocMetadata {
  content: string;
}

export interface Contributor {
  id: string;
  role: string;
  isCorporate?: boolean;
  corporateName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
}

export interface StructuredMetadata {
  reference_type: string;
  contributors: Contributor[];
  subtitle?: string;
  short_title?: string;
  month?: string;
  day?: string;
  date_text?: string;
  url?: string;
  isbn?: string;
  issn?: string;
  pmid?: string;
  pmcid?: string;
  publication_status?: string;
  language?: string;
  abstract?: string;
  keywords?: string[];
  publisher?: string;
  place_published?: string;
  edition?: string;
  volume?: string;
  issue?: string;
  pages_start?: string;
  pages_end?: string;
  article_number?: string;
  source_title?: string;
  container_title?: string;
  series_title?: string;
  series_number?: string;
  report_number?: string;
  patent_number?: string;
  application_number?: string;
  standard_number?: string;
  version?: string;
  archive?: string;
  archive_location?: string;
  accessed_date?: string;
  custom_fields?: Record<string, any>;
  [key: string]: any;
}

export interface Reference {
  id: string;
  reference_type?: string;
  authors: string;
  title: string;
  year: string;
  journal: string | null;
  doi: string | null;
  raw_metadata: string | null;
  notes?: string | null;
  tags?: string | null;
  pdf_path?: string | null;
  review_status?: 'unreviewed' | 'included' | 'excluded' | string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface CustomStyle {
  id: string;
  name: string;
  xml_content: string;
}

export interface ElectronAPI {
  openDirectoryDialog: () => Promise<string | null>;
  openImageDialog: () => Promise<string | null>;
  openPdfDialog: () => Promise<string | null>;
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  createOrOpenProject: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  closeProject: () => Promise<{ success: boolean }>;
  getCurrentProject: () => Promise<{ success: boolean; path?: string | null }>;
  readFileBase64: (filePath: string) => Promise<{ success: boolean; base64?: string; error?: string }>;
  
  getReferences: () => Promise<{ success: boolean; data?: Reference[]; error?: string }>;
  createReference: (refData: Omit<Reference, 'id'>) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  updateReference: (id: string, updates: Omit<Reference, 'id'>) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  updateReferenceStatus: (id: string, status: string) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  deleteReference: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  importReferencesFile: (folderId?: string | null) => Promise<{ success: boolean; count?: number; data?: Reference[]; canceled?: boolean; error?: string }>;
  exportLib: (refs: Reference[], format: 'ris' | 'bib') => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  importStyleFile: () => Promise<{ success: boolean; data?: CustomStyle; canceled?: boolean; error?: string }>;
  getCustomStyles: () => Promise<{ success: boolean; data?: CustomStyle[]; error?: string }>;
  // Licensing
  license: {
    getState: () => Promise<any>;
    saveActivation: (data: any) => Promise<{ success: boolean; error?: string }>;
    refreshVerification: (data: any) => Promise<{ success: boolean; error?: string }>;
    enterDemo: () => Promise<{ success: boolean; error?: string }>;
    trackUsage: (key: string, amount: number) => Promise<number>;
  };

  getFolders: () => Promise<{ success: boolean; data?: Folder[]; error?: string }>;
  createFolder: (name: string, parent_id?: string | null) => Promise<{ success: boolean; data?: Folder; error?: string }>;
  deleteFolder: (id: string) => Promise<{ success: boolean; error?: string }>;
  renameFolder: (id: string, newName: string) => Promise<{ success: boolean; data?: Folder; error?: string }>;
  getFoldersByRef: (ref_id: string) => Promise<{ success: boolean; data?: string[]; error?: string }>;
  getAllFolderMappings: () => Promise<{ success: boolean; data?: Record<string, string[]>; error?: string }>;
  setFoldersForRef: (ref_id: string, folder_ids: string[]) => Promise<{ success: boolean; error?: string }>;

  fetchDOI: (doi: string) => Promise<{ success: boolean; data?: Partial<Reference>; error?: string }>;

  getDocuments: () => Promise<{ success: boolean; data?: DocMetadata[]; error?: string }>;
  getDocument: (id: string) => Promise<{ success: boolean; data?: Document; error?: string }>;
  createDocument: (title?: string) => Promise<{ success: boolean; data?: Document; error?: string }>;
  updateDocument: (id: string, updates: {title?: string, content?: string}) => Promise<{ success: boolean; data?: Document; error?: string }>;
  deleteDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
  exportDocx: (html: string, title?: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
  importDocx: () => Promise<{ success: boolean; data?: { html: string; fileName: string; filePath: string; warnings: string[] }; canceled?: boolean; error?: string }>;

  // Graphing Studio
  getGraphingDatasets: () => Promise<{ success: boolean; data?: GraphingDatasetRow[]; error?: string }>;
  getGraphingDataset: (id: string) => Promise<{ success: boolean; data?: GraphingDatasetRow; error?: string }>;
  createGraphingDataset: (data: Partial<GraphingDatasetRow>) => Promise<{ success: boolean; data?: GraphingDatasetRow; error?: string }>;
  updateGraphingDataset: (id: string, updates: Partial<GraphingDatasetRow>) => Promise<{ success: boolean; data?: GraphingDatasetRow; error?: string }>;
  deleteGraphingDataset: (id: string) => Promise<{ success: boolean; error?: string }>;

  getGraphingAnalyses: (datasetId?: string) => Promise<{ success: boolean; data?: GraphingAnalysisRow[]; error?: string }>;
  createGraphingAnalysis: (data: Partial<GraphingAnalysisRow>) => Promise<{ success: boolean; data?: GraphingAnalysisRow; error?: string }>;
  deleteGraphingAnalysis: (id: string) => Promise<{ success: boolean; error?: string }>;

  getGraphingFigures: (datasetId?: string) => Promise<{ success: boolean; data?: GraphingFigureRow[]; error?: string }>;
  getGraphingFigure: (id: string) => Promise<{ success: boolean; data?: GraphingFigureRow; error?: string }>;
  createGraphingFigure: (data: Partial<GraphingFigureRow>) => Promise<{ success: boolean; data?: GraphingFigureRow; error?: string }>;
  updateGraphingFigure: (id: string, updates: Partial<GraphingFigureRow>) => Promise<{ success: boolean; data?: GraphingFigureRow; error?: string }>;
  deleteGraphingFigure: (id: string) => Promise<{ success: boolean; error?: string }>;

  exportGraphingFigure: (imageDataUrl: string, defaultName: string, format: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;

  importCSVFile: () => Promise<{ success: boolean; data?: { content: string; fileName: string; filePath: string }; canceled?: boolean; error?: string }>;

  // Systematic Review Extensions
  getExtractionTemplates: () => Promise<{ success: boolean; data?: ExtractionTemplate[]; error?: string }>;
  createExtractionTemplate: (data: Partial<ExtractionTemplate>) => Promise<{ success: boolean; data?: ExtractionTemplate; error?: string }>;
  deleteExtractionTemplate: (id: string) => Promise<{ success: boolean; error?: string }>;
  getExtractedDataPoints: (refId?: string) => Promise<{ success: boolean; data?: ExtractedDataPoint[]; error?: string }>;
  saveExtractedDataPoint: (data: Partial<ExtractedDataPoint>) => Promise<{ success: boolean; data?: ExtractedDataPoint; error?: string }>;
  
  getRobAssessments: (refId?: string) => Promise<{ success: boolean; data?: RobAssessment[]; error?: string }>;
  saveRobAssessment: (data: Partial<RobAssessment>) => Promise<{ success: boolean; data?: RobAssessment; error?: string }>;
  
  getReviewerDecisions: (refId?: string) => Promise<{ success: boolean; data?: ReviewerDecision[]; error?: string }>;
  saveReviewerDecision: (data: Partial<ReviewerDecision>) => Promise<{ success: boolean; data?: ReviewerDecision; error?: string }>;

  autoFetchPDFs: (refs: any[], email: string) => Promise<{ success: boolean; results?: { successCount: number; failedCount: number; successfulFetches?: {id:string, pdfPath:string}[] }; error?: string }>;

  exportCollaborationData: (reviewerId: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  importCollaborationData: () => Promise<{ success: boolean; stats?: any; canceled?: boolean; error?: string }>;
  exportToGraphingStudio: (refs: any[]) => Promise<{ success: boolean; datasetId?: string | number; error?: string }>;

  // Table Builder
  getTbTables: () => Promise<{ success: boolean; data?: TbTableRow[]; error?: string }>;
  getTbTable: (id: string) => Promise<{ success: boolean; data?: TbTableRow; error?: string }>;
  createTbTable: (data: Partial<TbTableRow>) => Promise<{ success: boolean; data?: TbTableRow; error?: string }>;
  updateTbTable: (id: string, updates: Partial<TbTableRow>) => Promise<{ success: boolean; data?: TbTableRow; error?: string }>;
  deleteTbTable: (id: string) => Promise<{ success: boolean; error?: string }>;
  getTbNarratives: (tableId?: string) => Promise<{ success: boolean; data?: TbNarrativeRow[]; error?: string }>;
  createTbNarrative: (data: Partial<TbNarrativeRow>) => Promise<{ success: boolean; data?: TbNarrativeRow; error?: string }>;
  updateTbNarrative: (id: string, updates: Partial<TbNarrativeRow>) => Promise<{ success: boolean; data?: TbNarrativeRow; error?: string }>;
  deleteTbNarrative: (id: string) => Promise<{ success: boolean; error?: string }>;
  getTbDocLinks: (tableId?: string) => Promise<{ success: boolean; data?: TbDocLinkRow[]; error?: string }>;
  createTbDocLink: (data: Partial<TbDocLinkRow>) => Promise<{ success: boolean; data?: TbDocLinkRow; error?: string }>;
  updateTbDocLink: (id: string, updates: Partial<TbDocLinkRow>) => Promise<{ success: boolean; data?: TbDocLinkRow; error?: string }>;
  deleteTbDocLink: (id: string) => Promise<{ success: boolean; error?: string }>;
  getTbAuditLog: (tableId: string) => Promise<{ success: boolean; data?: TbAuditRow[]; error?: string }>;
  createTbAuditEntry: (data: Partial<TbAuditRow>) => Promise<{ success: boolean; data?: TbAuditRow; error?: string }>;
  getTbExportHistory: (tableId: string) => Promise<{ success: boolean; data?: TbExportRow[]; error?: string }>;
  createTbExportEntry: (data: Partial<TbExportRow>) => Promise<{ success: boolean; data?: TbExportRow; error?: string }>;
  getTbSettings: () => Promise<{ success: boolean; data?: string; error?: string }>;
  updateTbSettings: (settings_json: string) => Promise<{ success: boolean; error?: string }>;
  exportTbPDF: (html: string, defaultName?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  exportTbCSV: (csvContent: string, defaultName?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  exportTbImage: (imageDataUrl: string, defaultName?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  importTbCSV: () => Promise<{ success: boolean; data?: { content: string; fileName: string; filePath: string }; canceled?: boolean; error?: string }>;

  // Integrity Checker
  getIcScanSessions: (documentId?: string) => Promise<{ success: boolean; data?: IcScanSessionRow[]; error?: string }>;
  createIcScanSession: (data: Partial<IcScanSessionRow>) => Promise<{ success: boolean; data?: IcScanSessionRow; error?: string }>;
  updateIcScanSession: (id: string, updates: Partial<IcScanSessionRow>) => Promise<{ success: boolean; data?: IcScanSessionRow; error?: string }>;
  deleteIcScanSession: (id: string) => Promise<{ success: boolean; error?: string }>;
  getIcFindings: (sessionId: string) => Promise<{ success: boolean; data?: IcFindingRow[]; error?: string }>;
  saveIcFindings: (findings: Partial<IcFindingRow>[]) => Promise<{ success: boolean; error?: string }>;
  updateIcFindingStatus: (id: string, status: string, reviewerNote?: string | null) => Promise<{ success: boolean; data?: IcFindingRow; error?: string }>;
  getIcSettings: (profileName?: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  updateIcSettings: (profileName: string, settingsJson: string) => Promise<{ success: boolean; error?: string }>;
  getIcAbbrevRegistry: (sessionId: string) => Promise<{ success: boolean; data?: IcAbbrevRow[]; error?: string }>;
  saveIcAbbrevRegistry: (items: Partial<IcAbbrevRow>[]) => Promise<{ success: boolean; error?: string }>;
  getIcCitationMapping: (sessionId: string) => Promise<{ success: boolean; data?: IcCitationMappingRow[]; error?: string }>;
  saveIcCitationMapping: (items: Partial<IcCitationMappingRow>[]) => Promise<{ success: boolean; error?: string }>;
  getIcAssetMapping: (sessionId: string) => Promise<{ success: boolean; data?: IcAssetMappingRow[]; error?: string }>;
  saveIcAssetMapping: (items: Partial<IcAssetMappingRow>[]) => Promise<{ success: boolean; error?: string }>;
  getIcComplianceStatements: (sessionId: string) => Promise<{ success: boolean; data?: IcComplianceStatementRow[]; error?: string }>;
  saveIcComplianceStatements: (items: Partial<IcComplianceStatementRow>[]) => Promise<{ success: boolean; error?: string }>;
  getIcSampleSizeMentions: (sessionId: string) => Promise<{ success: boolean; data?: IcSampleSizeRow[]; error?: string }>;
  saveIcSampleSizeMentions: (items: Partial<IcSampleSizeRow>[]) => Promise<{ success: boolean; error?: string }>;
}

// Graphing Studio DB Row Types
export interface GraphingDatasetRow {
  id: string;
  name: string;
  format: string;
  columns_json: string;
  rows_json: string;
  metadata_json: string;
  variable_mapping_json: string;
  created_at: string;
  updated_at: string;
}

export interface GraphingAnalysisRow {
  id: string;
  dataset_id: string;
  test_name: string;
  config_json: string;
  result_json: string;
  created_at: string;
}

export interface GraphingFigureRow {
  id: string;
  dataset_id: string | null;
  analysis_id: string | null;
  name: string;
  graph_type: string;
  options_json: string;
  annotation_json: string;
  thumbnail_dataurl: string | null;
  created_at: string;
  updated_at: string;
}

// Systematic Review DB Row Types
export interface ExtractionTemplate {
  id: string;
  name: string;
  fields_json: string;
}

export interface ExtractedDataPoint {
  id: string;
  ref_id: string;
  reviewer_id: string | null;
  template_id: string;
  data_json: string;
  created_at: string;
  updated_at: string;
}

export interface RobAssessment {
  id: string;
  ref_id: string;
  reviewer_id: string | null;
  tool_used: string;
  domain_scores_json: string;
  overall_risk: string;
  created_at: string;
}

export interface ReviewerDecision {
  ref_id: string;
  reviewer_id: string;
  stage: string;
  decision: string;
  notes: string | null;
  timestamp: string;
}

// Table Builder DB Row Types
export interface TbTableRow {
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

export interface TbNarrativeRow {
  id: string;
  table_id: string;
  narrative_type: string;
  tone: string;
  content: string;
  settings_json: string;
  created_at: string;
  updated_at: string;
}

export interface TbDocLinkRow {
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

export interface TbAuditRow {
  id: string;
  table_id: string;
  action: string;
  details_json: string;
  timestamp: string;
}

export interface TbExportRow {
  id: string;
  table_id: string;
  format: string;
  file_path: string;
  options_json: string;
  exported_at: string;
}

// Integrity Checker DB Row Types
export interface IcScanSessionRow {
  id: string;
  document_id: string;
  scan_scope: string;
  total_findings: number;
  errors_count: number;
  warnings_count: number;
  notices_count: number;
  overall_score: number;
  settings_snapshot_json: string;
  created_at: string;
}

export interface IcFindingRow {
  id: string;
  session_id: string;
  category: string;
  check_name: string;
  severity: 'error' | 'warning' | 'notice' | 'pass';
  confidence: 'high' | 'medium' | 'low';
  status: 'unresolved' | 'resolved' | 'ignored' | 'false_positive';
  summary: string;
  description: string | null;
  recommendation: string | null;
  document_section: string | null;
  location_anchor: string | null;
  related_asset_id: string | null;
  extracted_evidence: string | null;
  reviewer_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface IcAbbrevRow {
  id: string;
  session_id: string;
  abbreviation: string;
  expansion: string | null;
  first_definition_location: string | null;
  first_use_location: string | null;
  usage_count: number;
  issue_flag: string | null;
}

export interface IcCitationMappingRow {
  id: string;
  session_id: string;
  citation_string: string;
  document_location: string | null;
  matched_reference_id: string | null;
  matched_status: string;
  issue_flag: string | null;
}

export interface IcAssetMappingRow {
  id: string;
  session_id: string;
  item_type: string;
  label_number: string | null;
  caption_text: string | null;
  asset_id: string | null;
  in_text_mentions_count: number;
  numbering_status: string;
  issue_flag: string | null;
}

export interface IcSampleSizeRow {
  id: string;
  session_id: string;
  detected_text: string;
  numeric_value: number | null;
  role_classification: string;
  section: string | null;
  sentence_excerpt: string | null;
  consistency_group_id: string | null;
  issue_flag: string | null;
}

export interface IcComplianceStatementRow {
  id: string;
  session_id: string;
  statement_type: string;
  detected_status: string;
  location: string | null;
  extracted_text: string | null;
  applicability_status: string;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
