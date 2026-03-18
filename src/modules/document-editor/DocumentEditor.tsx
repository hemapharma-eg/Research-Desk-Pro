import { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import type { DocMetadata, Document } from '../../types/electron.d';
import { TipTapEditor } from './TipTapEditor';

export function DocumentEditor() {
  const { currentProject } = useProject();
  const [documents, setDocuments] = useState<DocMetadata[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const [titleValue, setTitleValue] = useState('');
  const [contentValue, setContentValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch the list of documents
  const loadDocumentsList = async () => {
    try {
      setIsLoadingList(true);
      setError(null);
      const res = await window.api.getDocuments();
      if (res.success && res.data) {
        setDocuments(res.data);
      } else {
        setError(res.error || 'Failed to load documents list');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadDocumentsList();
    }
  }, [currentProject]);

  // Load a specific document into the editor
  const loadDocument = async (id: string) => {
    try {
      setIsLoadingDoc(true);
      setError(null);
      
      const res = await window.api.getDocument(id);
      if (res.success && res.data) {
        setActiveDoc(res.data);
        setTitleValue(res.data.title);
        setContentValue(res.data.content);
      } else {
        setError(res.error || 'Failed to load document');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error loading document');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      const res = await window.api.createDocument('Untitled Document');
      if (res.success && res.data) {
        await loadDocumentsList();
        loadDocument(res.data.id);
      } else {
        setError(res.error || 'Failed to create document');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error creating document');
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await window.api.deleteDocument(id);
      if (activeDoc && activeDoc.id === id) {
        setActiveDoc(null);
        setTitleValue('');
        setContentValue('');
      }
      loadDocumentsList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleSave = async () => {
    if (!activeDoc) return;
    try {
      setIsSaving(true);
      const res = await window.api.updateDocument(activeDoc.id, {
        title: titleValue,
        content: contentValue
      });
      if (res.success && res.data) {
        setActiveDoc(res.data);
        // Refresh list to update times/title in sidebar
        loadDocumentsList(); 
      } else {
        setError(res.error || 'Failed to save document');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced Autosave
  useEffect(() => {
    if (!activeDoc) return;
    // Don't auto-save if identical
    if (activeDoc.title === titleValue && activeDoc.content === contentValue) return;

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleValue, contentValue, activeDoc?.id]);

  if (!currentProject) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>
        <p>Please open a project to write documents.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      
      {/* Sidebar List (Left) */}
      <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-sidebar)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>Documents</h3>
          <button 
            onClick={handleCreateDocument}
            title="New Document"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-primary)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-1)' }}
          >
            +
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoadingList ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading...</div>
          ) : documents.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No documents yet.</div>
          ) : (
            documents.map(doc => (
              <div 
                key={doc.id}
                onClick={() => loadDocument(doc.id)}
                style={{ 
                  padding: 'var(--space-3)', 
                  borderBottom: '1px solid var(--color-border-light)', 
                  cursor: 'pointer',
                  backgroundColor: activeDoc?.id === doc.id ? 'var(--color-bg-hover)' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: activeDoc?.id === doc.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.title || 'Untitled'}
                  </div>
                  <button 
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 0 }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                  {new Date(doc.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Pane (Right) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-app)' }}>
        {error && (
          <div style={{ margin: 'var(--space-3)', padding: 'var(--space-2)', backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}

        {isLoadingDoc ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
            Loading document...
          </div>
        ) : !activeDoc ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
            Select a document to edit, or create a new one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
            
            {/* Editor Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)' }}>
              <input 
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                style={{ 
                  fontSize: 'var(--font-size-2xl)', 
                  fontWeight: 'var(--font-weight-bold)', 
                  color: 'var(--color-text-primary)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '60%'
                }}
                placeholder="Document Title"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                  {isSaving ? 'Saving...' : 'Saved locally'}
                </span>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'var(--font-weight-medium)',
                    border: 'none',
                    cursor: isSaving ? 'wait' : 'pointer'
                  }}
                >
                  Force Save
                </button>
              </div>
            </div>
            
            {/* Main Text Area */}
            <TipTapEditor 
              content={contentValue}
              onChange={(html) => setContentValue(html)}
            />
          </div>
        )}
      </div>

    </div>
  );
}
