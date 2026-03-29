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

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
