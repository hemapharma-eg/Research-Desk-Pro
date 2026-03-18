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
  review_status?: 'unreviewed' | 'included' | 'excluded' | string;
}

export interface ElectronAPI {
  openDirectoryDialog: () => Promise<string | null>;
  createOrOpenProject: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  closeProject: () => Promise<{ success: boolean }>;
  getCurrentProject: () => Promise<{ success: boolean; path?: string | null }>;
  
  getReferences: () => Promise<{ success: boolean; data?: Reference[]; error?: string }>;
  createReference: (refData: Omit<Reference, 'id'>) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  updateReference: (id: string, updates: Omit<Reference, 'id'>) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  updateReferenceStatus: (id: string, status: string) => Promise<{ success: boolean; data?: Reference; error?: string }>;
  deleteReference: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  fetchDOI: (doi: string) => Promise<{ success: boolean; data?: Partial<Reference>; error?: string }>;

  getDocuments: () => Promise<{ success: boolean; data?: DocMetadata[]; error?: string }>;
  getDocument: (id: string) => Promise<{ success: boolean; data?: Document; error?: string }>;
  createDocument: (title?: string) => Promise<{ success: boolean; data?: Document; error?: string }>;
  updateDocument: (id: string, updates: {title?: string, content?: string}) => Promise<{ success: boolean; data?: Document; error?: string }>;
  deleteDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
