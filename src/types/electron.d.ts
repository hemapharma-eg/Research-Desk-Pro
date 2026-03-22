export interface DocMetadata {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export interface Document extends DocMetadata {
  content: string;
}

export interface Reference {
  id: string;
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
