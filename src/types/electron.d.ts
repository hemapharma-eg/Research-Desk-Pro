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
  openPdfDialog: () => Promise<{ success: boolean; path?: string; error?: string }>;
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  createOrOpenProject: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  closeProject: () => Promise<{ success: boolean }>;
  getCurrentProject: () => Promise<{ success: boolean; path?: string | null }>;
  
  getReferences: () => Promise<{ success: boolean; data?: Reference[]; error?: string }>;
  createReference: (refData: Omit<Reference, 'id'>) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  updateReference: (id: string, updates: Omit<Reference, 'id'>) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  updateReferenceStatus: (id: string, status: string) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  deleteReference: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  importReferencesFile: () => Promise<{ success: boolean; count?: number; data?: Reference[]; canceled?: boolean; error?: string }>;
  exportLib: (refs: Reference[], format: 'ris' | 'bib') => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  importStyleFile: () => Promise<{ success: boolean; data?: CustomStyle; canceled?: boolean; error?: string }>;
  getCustomStyles: () => Promise<{ success: boolean; data?: CustomStyle[]; error?: string }>;

  getFolders: () => Promise<{ success: boolean; data?: Folder[]; error?: string }>;
  createFolder: (name: string, parent_id?: string | null) => Promise<{ success: boolean; data?: Folder; error?: string }>;
  deleteFolder: (id: string) => Promise<{ success: boolean; error?: string }>;
  renameFolder: (id: string, newName: string) => Promise<{ success: boolean; data?: Folder; error?: string }>;
  getFoldersByRef: (ref_id: string) => Promise<{ success: boolean; data?: string[]; error?: string }>;
  setFoldersForRef: (ref_id: string, folder_ids: string[]) => Promise<{ success: boolean; error?: string }>;

  fetchDOI: (doi: string) => Promise<{ success: boolean; data?: Partial<Reference>; error?: string }>;

  getDocuments: () => Promise<{ success: boolean; data?: DocMetadata[]; error?: string }>;
  getDocument: (id: string) => Promise<{ success: boolean; data?: Document; error?: string }>;
  createDocument: (title?: string) => Promise<{ success: boolean; data?: Document; error?: string }>;
  updateDocument: (id: string, updates: {title?: string, content?: string}) => Promise<{ success: boolean; data?: Document; error?: string }>;
  deleteDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
  exportDocx: (html: string, title?: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
