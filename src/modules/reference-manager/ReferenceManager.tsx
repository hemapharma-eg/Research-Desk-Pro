import React, { useState, useEffect, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import type { Reference, Folder } from '../../types/electron.d';
import { AddReferenceModal } from './components/AddReferenceModal';

// === HELPER STYLES ===
const styles = {
  pane: {
    height: '100%',
    overflowY: 'auto' as 'auto',
    backgroundColor: 'var(--color-bg-surface)',
    borderRight: '1px solid var(--color-border-light)'
  },
  btnSecondary: {
    padding: '4px 8px',
    backgroundColor: 'var(--color-bg-hover)',
    color: 'var(--color-text-primary)',
    borderRadius: '4px',
    border: '1px solid var(--color-border-strong)',
    cursor: 'pointer',
    fontSize: '12px'
  },
  btnPrimary: {
    padding: '4px 8px',
    backgroundColor: 'var(--color-accent-primary)',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px'
  },
  input: {
    width: '100%',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-primary)'
  }
};

export function ReferenceManager() {
  const { currentProject, projectLoadTime } = useProject();
  
  // Data State
  const [references, setReferences] = useState<Reference[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [refFolderMap, setRefFolderMap] = useState<Record<string, string[]>>({}); // ref_id -> folder_ids
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Reference; direction: 'asc' | 'desc' } | null>({ key: 'year', direction: 'desc' });
  
  // Selection State
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // null = "All"
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  
  // Modals & Inline Inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Deduplication State
  const [duplicateGroups, setDuplicateGroups] = useState<Reference[][]>([]);

  // Tabs for Right Pane
  const [inspectorTab, setInspectorTab] = useState<'info'|'notes'|'attachments'>('info');

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [refsRes, foldersRes] = await Promise.all([
        window.api.getReferences(),
        window.api.getFolders()
      ]);

      if (refsRes.success && refsRes.data) {
        setReferences(refsRes.data);
        
        // Load mappings for each ref in a single lightning-fast bulk IPC call!
        const mapRes = await window.api.getAllFolderMappings();
        if (mapRes.success && mapRes.data) {
          setRefFolderMap(mapRes.data);
        } else {
          setRefFolderMap({});
        }
      }
      
      if (foldersRes.success && foldersRes.data) {
        setFolders(foldersRes.data);
      }
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject, projectLoadTime]);

  // --- ACTIONS ---
  
  const handleImport = async () => {
    // Optional explicit check:
    // If no folder is selected, maybe we warn them. But letting it import globally is fine!
    try {
      const result = await window.api.importReferencesFile(selectedFolder);
      if (result.success && result.count && result.count > 0) {
        // Backend handles the folder mapping atomically inside the SQLite loop now.
        await loadData();
        alert(`Successfully imported ${result.count} references${selectedFolder ? ' into the selected folder' : ''}.`);
      } else if (result.error) {
        // Only set error if it wasn't just canceled
        if (!result.canceled) setError(result.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error importing references');
    }
  };



  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this folder? References will NOT be deleted.')) return;
    await window.api.deleteFolder(id);
    if (selectedFolder === id) setSelectedFolder(null);
    loadData();
  };

  const saveReferenceUpdates = async (updates: Partial<Reference>) => {
    if (!selectedRef) return;
    try {
      // Cast or default empty fields for TS Omit<Reference, 'id'>
      const payload = {
        authors: typeof updates.authors !== 'undefined' ? updates.authors : selectedRef.authors,
        title: typeof updates.title !== 'undefined' ? updates.title : selectedRef.title,
        year: typeof updates.year !== 'undefined' ? updates.year : selectedRef.year,
        journal: typeof updates.journal !== 'undefined' ? updates.journal : selectedRef.journal,
        doi: typeof updates.doi !== 'undefined' ? updates.doi : selectedRef.doi,
        raw_metadata: typeof updates.raw_metadata !== 'undefined' ? updates.raw_metadata : selectedRef.raw_metadata,
        notes: typeof updates.notes !== 'undefined' ? updates.notes : selectedRef.notes,
        tags: typeof updates.tags !== 'undefined' ? updates.tags : selectedRef.tags,
        pdf_path: typeof updates.pdf_path !== 'undefined' ? updates.pdf_path : selectedRef.pdf_path
      };
      const res = await window.api.updateReference(selectedRef.id, payload);
      if (res.success && res.data) {
        setSelectedRef(res.data);
        setReferences(prev => prev.map(r => r.id === res.data!.id ? res.data! : r));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleCreateNewRefModal = () => {
    setShowAddModal(true);
  };

  const handleDeleteSelectedRef = async () => {
    if (!selectedRef) return;
    if (!confirm('Delete this reference entirely?')) return;
    await window.api.deleteReference(selectedRef.id);
    setSelectedRef(null);
    loadData();
  };

  const handleExportLibrary = async () => {
    // Export currently filtered references or all
    const refsToExport = filteredReferences.length > 0 ? filteredReferences : references;
    if (refsToExport.length === 0) {
      alert("No references to export.");
      return;
    }
    const format = confirm("Click OK for RIS, Cancel for BibTeX") ? 'ris' : 'bib';
    const res = await window.api.exportLib(refsToExport, format);
    if (!res.success && !res.canceled) {
      setError(res.error || 'Failed to export');
    }
  };

  const handleFindDuplicates = () => {
    const targetRefs = selectedFolder ? filteredReferences : references;
    const groups: Reference[][] = [];
    const seenDoi = new Map<string, Reference>();
    const seenTitle = new Map<string, Reference>();
    
    targetRefs.forEach(r => {
      let isDup = false;
      if (r.doi) {
        const d = r.doi.trim().toLowerCase();
        if (seenDoi.has(d)) {
          const orig = seenDoi.get(d)!;
          let group = groups.find(g => g.includes(orig));
          if (!group) { group = [orig]; groups.push(group); }
          group.push(r);
          isDup = true;
        } else {
          seenDoi.set(d, r);
        }
      }
      if (!isDup && r.title) {
        const t = r.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (t.length > 5) {
          if (seenTitle.has(t)) {
            const orig = seenTitle.get(t)!;
            let group = groups.find(g => g.includes(orig));
            if (!group) { group = [orig]; groups.push(group); }
            if (!group.includes(r)) group.push(r);
          } else {
            seenTitle.set(t, r);
          }
        }
      }
    });

    if (groups.length === 0) {
      alert("No duplicates found.");
    } else {
      setDuplicateGroups(groups);
    }
  };

  const handleSort = (key: keyof Reference) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // --- COMPUTED DATA ---
  
  // Extract all unique tags
  const allTags = useMemo(() => {
    const s = new Set<string>();
    references.forEach(r => {
      if (r.tags) {
        // assume comma separated
        r.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => s.add(t));
      }
    });
    return Array.from(s).sort();
  }, [references]);

  // Filter references based on Folder, Tag, and Search
  const filteredReferences = useMemo(() => {
    return references.filter(ref => {
      // 1. Filter by Folder
      if (selectedFolder) {
        const myFolders = refFolderMap[ref.id] || [];
        if (!myFolders.includes(selectedFolder)) return false;
      }
      
      // 2. Filter by Tag
      if (selectedTag) {
        if (!ref.tags) return false;
        const myTags = ref.tags.split(',').map(t => t.trim());
        if (!myTags.includes(selectedTag)) return false;
      }

      // 3. Filter by Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = (
          (ref.title && ref.title.toLowerCase().includes(q)) ||
          (ref.authors && ref.authors.toLowerCase().includes(q)) ||
          (ref.year && ref.year.toString().includes(q)) ||
          (ref.journal && ref.journal.toLowerCase().includes(q)) ||
          (ref.doi && ref.doi.toLowerCase().includes(q))
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [references, refFolderMap, selectedFolder, selectedTag, searchQuery]);

  // Sort
  const sortedReferences = useMemo(() => {
    return [...filteredReferences].sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      let aVal = (a as any)[key] || '';
      let bVal = (b as any)[key] || '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredReferences, sortConfig]);

  if (!currentProject) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Please open a project to manage references.</div>;
  }

  // --- RENDER ---
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', backgroundColor: 'var(--color-bg-app)' }}>
      
      {/* ================= LEFT PANE (Collections/Folders) ================= */}
      <div style={{ ...styles.pane, width: '240px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-light)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#1E293B' }}>Collections</h3>
          <div 
            onClick={() => { setSelectedFolder(null); setSelectedTag(null); }}
            style={{ 
              padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
              backgroundColor: (!selectedFolder && !selectedTag) ? 'var(--color-bg-hover)' : 'transparent',
              fontWeight: (!selectedFolder && !selectedTag) ? 'bold' : 'normal',
              color: '#334155', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            📚 All References
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' }}>My Folders</span>
            <button 
              onClick={() => { setIsAddingFolder(true); setNewFolderName(''); }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px', padding: '0 4px' }}
            >+</button>
          </div>
          
          {isAddingFolder && (
            <div style={{ margin: '8px 0', padding: '6px', borderRadius: '4px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', gap: '4px' }}>
              <input
                autoFocus
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                style={{ flex: 1, padding: '4px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '2px', outline: 'none' }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!newFolderName.trim()) {
                      setIsAddingFolder(false);
                      return;
                    }
                    const res = await window.api.createFolder(newFolderName.trim());
                    if (res.success && res.data) {
                      setNewFolderName('');
                      setIsAddingFolder(false);
                      setSelectedFolder(res.data.id); // Auto-select the newly created folder
                      loadData();
                    } else {
                      alert(res.error);
                    }
                  } else if (e.key === 'Escape') {
                    setIsAddingFolder(false);
                    setNewFolderName('');
                  }
                }}
              />
              <button 
                onClick={() => setIsAddingFolder(false)} 
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px' }}
              >✕</button>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
            {folders.map(f => (
              <div 
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                style={{ 
                  padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                  backgroundColor: selectedFolder === f.id ? '#EFF6FF' : 'transparent',
                  color: selectedFolder === f.id ? '#2563EB' : '#475569', 
                  fontWeight: selectedFolder === f.id ? 'bold' : 'normal',
                  fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📁 {f.name}
                </div>
                {selectedFolder === f.id && (
                  <button onClick={(e) => handleDeleteFolder(f.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '11px' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' }}>Tags</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
            {allTags.map(t => (
              <span 
                key={t}
                onClick={() => setSelectedTag(t === selectedTag ? null : t)}
                style={{
                  padding: '2px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer',
                  backgroundColor: selectedTag === t ? '#2563EB' : '#F1F5F9',
                  color: selectedTag === t ? 'white' : '#475569',
                  border: `1px solid ${selectedTag === t ? '#2563EB' : '#E2E8F0'}`
                }}
              >
                #{t}
              </span>
            ))}
            {allTags.length === 0 && <span style={{ fontSize: '12px', color: '#94A3B8' }}>No tags found.</span>}
          </div>
        </div>
      </div>

      {/* ================= CENTER PANE (Data Grid) ================= */}
      <div style={{ ...styles.pane, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCreateNewRefModal} style={styles.btnSecondary}>+ Add New</button>
            <button onClick={handleImport} style={{ ...styles.btnSecondary, backgroundColor: selectedFolder ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: selectedFolder ? 'white' : 'var(--color-text-primary)' }}>
              📥 {selectedFolder ? `Import into Selected Folder` : `Import Globally`}
            </button>
            <button onClick={handleFindDuplicates} style={{ ...styles.btnSecondary, color: '#059669', borderColor: '#34D399' }}>🔄 Find Duplicates</button>
            <button onClick={handleExportLibrary} style={styles.btnSecondary}>📤 Export Library</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', width: '220px' }}>
            <span style={{ marginRight: '8px', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search references..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '8px 16px', backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '13px', borderBottom: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        {/* Table/Grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading library...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#F8FAFC', zIndex: 1, boxShadow: '0 1px 0 var(--color-border-light)' }}>
                <tr>
                  <th onClick={() => handleSort('authors')} style={{ cursor: 'pointer', padding: '12px 16px', color: '#64748B', fontWeight: 'bold' }}>Authors {sortConfig?.key === 'authors' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('year')} style={{ cursor: 'pointer', padding: '12px 16px', color: '#64748B', fontWeight: 'bold' }}>Year {sortConfig?.key === 'year' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('title')} style={{ cursor: 'pointer', padding: '12px 16px', color: '#64748B', fontWeight: 'bold' }}>Title {sortConfig?.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('journal')} style={{ cursor: 'pointer', padding: '12px 16px', color: '#64748B', fontWeight: 'bold' }}>Journal {sortConfig?.key === 'journal' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                </tr>
              </thead>
              <tbody>
                {sortedReferences.map(ref => (
                  <tr 
                    key={ref.id} 
                    onClick={() => setSelectedRef(ref)}
                    style={{ 
                      borderBottom: '1px solid var(--color-border-light)', 
                      cursor: 'pointer',
                      backgroundColor: selectedRef?.id === ref.id ? '#EFF6FF' : 'white',
                      userSelect: 'none'
                    }}
                  >
                    <td style={{ padding: '10px 16px', color: '#334155' }}>{ref.authors}</td>
                    <td style={{ padding: '10px 16px', color: '#64748B' }}>{ref.year}</td>
                    <td style={{ padding: '10px 16px', color: '#0F172A', fontWeight: '500' }}>
                      {ref.title}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748B', fontStyle: 'italic' }}>{ref.journal}</td>
                  </tr>
                ))}
                {sortedReferences.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No references found in this view.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= RIGHT PANE (Inspector) ================= */}
      {selectedRef ? (
        <div style={{ width: '320px', backgroundColor: '#F8FAFC', borderLeft: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0F172A', lineHeight: 1.4 }}>{selectedRef.title}</h3>
            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>{selectedRef.authors}</div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>{selectedRef.journal} ({selectedRef.year})</div>
            
            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={async () => {
                if (selectedRef.doi) {
                  const res = await window.api.fetchDOI(selectedRef.doi);
                  if (res.success && res.data) {
                    saveReferenceUpdates(res.data);
                  }
                } else {
                  alert("No DOI provided to fetch.");
                }
              }} style={styles.btnSecondary}>Fetch DOI</button>
              <button 
                onClick={handleDeleteSelectedRef}
                style={{ ...styles.btnSecondary, color: '#EF4444', borderColor: '#FCA5A5' }}
              >
                Delete
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-light)', backgroundColor: '#F1F5F9' }}>
            <button 
              onClick={() => setInspectorTab('info')}
              style={{ flex: 1, padding: '10px', border: 'none', background: inspectorTab === 'info' ? 'white' : 'transparent', fontWeight: inspectorTab === 'info' ? 'bold' : 'normal', color: inspectorTab === 'info' ? '#2563EB' : '#64748B', cursor: 'pointer', borderBottom: inspectorTab === 'info' ? '2px solid #2563EB' : '2px solid transparent' }}
            >
              Info
            </button>
            <button 
              onClick={() => setInspectorTab('notes')}
              style={{ flex: 1, padding: '10px', border: 'none', background: inspectorTab === 'notes' ? 'white' : 'transparent', fontWeight: inspectorTab === 'notes' ? 'bold' : 'normal', color: inspectorTab === 'notes' ? '#2563EB' : '#64748B', cursor: 'pointer', borderBottom: inspectorTab === 'notes' ? '2px solid #2563EB' : '2px solid transparent' }}
            >
              Notes
            </button>
            <button 
              onClick={() => setInspectorTab('attachments')}
              style={{ flex: 1, padding: '10px', border: 'none', background: inspectorTab === 'attachments' ? 'white' : 'transparent', fontWeight: inspectorTab === 'attachments' ? 'bold' : 'normal', color: inspectorTab === 'attachments' ? '#2563EB' : '#64748B', cursor: 'pointer', borderBottom: inspectorTab === 'attachments' ? '2px solid #2563EB' : '2px solid transparent' }}
            >
              Files
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'white' }}>
            {inspectorTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>Title</label>
                  <textarea 
                    value={selectedRef.title} 
                    onChange={e => saveReferenceUpdates({ title: e.target.value })}
                    style={{ ...styles.input, resize: 'vertical', minHeight: '60px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>Authors</label>
                  <textarea 
                    value={selectedRef.authors} 
                    onChange={e => saveReferenceUpdates({ authors: e.target.value })}
                    style={{ ...styles.input, resize: 'vertical', minHeight: '60px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>Year</label>
                    <input type="text" value={selectedRef.year} onChange={e => saveReferenceUpdates({ year: e.target.value })} style={styles.input} />
                   </div>
                   <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>DOI</label>
                    <input type="text" value={selectedRef.doi || ''} onChange={e => saveReferenceUpdates({ doi: e.target.value })} style={styles.input} />
                   </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>Journal / Publication</label>
                  <input type="text" value={selectedRef.journal || ''} onChange={e => saveReferenceUpdates({ journal: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>Tags (comma separated)</label>
                  <input type="text" value={selectedRef.tags || ''} onChange={e => saveReferenceUpdates({ tags: e.target.value })} placeholder="e.g. meta-analysis, review" style={styles.input} />
                </div>
                
                {/* Folder Mapping (multi-select representation) */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>Assigned Folders</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {(refFolderMap[selectedRef.id] || []).map(fid => {
                      const f = folders.find(x => x.id === fid);
                      if (!f) return null;
                      return (
                         <span key={fid} style={{ padding: '2px 8px', backgroundColor: '#E2E8F0', borderRadius: '4px', fontSize: '12px', color: '#334155' }}>
                           {f.name}
                           <button 
                             onClick={async () => {
                               const newMapping = (refFolderMap[selectedRef.id] || []).filter(x => x !== fid);
                               await window.api.setFoldersForRef(selectedRef.id, newMapping);
                               loadData();
                             }}
                             style={{ background: 'none', border: 'none', marginLeft: '4px', cursor: 'pointer', color: '#EF4444' }}
                           >✕</button>
                         </span>
                      );
                    })}
                    {folders.length > 0 && (
                      <select 
                        onChange={async (e) => {
                          if(!e.target.value) return;
                          const newMapping = [...(refFolderMap[selectedRef.id] || []), e.target.value];
                          await window.api.setFoldersForRef(selectedRef.id, newMapping);
                          e.target.value = "";
                          loadData();
                        }}
                        style={{ padding: '2px', fontSize: '12px', border: '1px dashed #CBD5E1', borderRadius: '4px', outline: 'none', background: 'transparent' }}
                      >
                        <option value="">+ Add to folder...</option>
                        {folders.filter(f => !(refFolderMap[selectedRef.id] || []).includes(f.id)).map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

              </div>
            )}
            
            {inspectorTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <textarea 
                  placeholder="Type your notes and summaries here..." 
                  value={selectedRef.notes || ''}
                  onChange={e => saveReferenceUpdates({ notes: e.target.value })}
                  style={{ ...styles.input, flex: 1, resize: 'none', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            )}

            {inspectorTab === 'attachments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                {selectedRef.pdf_path ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                    <div style={{ fontSize: '13px', color: '#334155', wordBreak: 'break-all', marginBottom: '16px' }}>{selectedRef.pdf_path.split('/').pop()}</div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={async () => {
                        if (selectedRef.pdf_path) {
                          await window.api.openPath(selectedRef.pdf_path);
                        }
                      }} style={styles.btnPrimary}>Open PDF</button>
                      <button onClick={() => saveReferenceUpdates({ pdf_path: null })} style={{ ...styles.btnSecondary, color: '#EF4444' }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '48px' }}>📎</div>
                    <div style={{ fontSize: '13px', textAlign: 'center' }}>No PDF attached to this reference.</div>
                    <button 
                      onClick={async () => {
                        try {
                          // The actual injected signature might vary but handles returning string
                          const res: any = await window.api.openPdfDialog();
                          if (res) {
                            const path = typeof res === 'string' ? res : res.path;
                            if (path) saveReferenceUpdates({ pdf_path: path });
                          }
                        } catch (e) {
                          console.error('Failed picking PDF', e);
                        }
                      }}
                      style={styles.btnSecondary}
                    >
                      Attach File
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ width: '320px', backgroundColor: '#F8FAFC', borderLeft: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '14px' }}>
          Select a reference to view details
        </div>
      )}

      {/* ================= DEDUPLICATION MODAL ================= */}
      {/* We use a separate showDedupModal flag logic: show modal when groups were populated */}
      {/* Actual dedup modal rendered via state */}
      <DedupModal 
        groups={duplicateGroups}
        onDeleteRef={async (refId: string, gIdx: number) => {
          await window.api.deleteReference(refId);
          const newGroups = duplicateGroups.map((g, i) => 
            i === gIdx ? g.filter(r => r.id !== refId) : g
          ).filter(g => g.length > 1);
          setDuplicateGroups(newGroups);
        }}
        onClose={() => { setDuplicateGroups([]); loadData(); }}
      />

      {showAddModal && (
        <AddReferenceModal
          initialType="journal_article"
          onClose={() => setShowAddModal(false)}
          onSave={async (ref) => {
            if (selectedFolder) {
               await window.api.setFoldersForRef(ref.id, [selectedFolder]);
            }
            setShowAddModal(false);
            await loadData();
            setSelectedRef(ref); // Select new reference
          }}
        />
      )}

    </div>
  );
}

// ===== Deduplication Modal Component =====
function DedupModal({ groups, onDeleteRef, onClose }: { 
  groups: Reference[][]; 
  onDeleteRef: (refId: string, gIdx: number) => Promise<void>;
  onClose: () => void;
}) {
  // We need a local flag to keep the modal open even after all groups are resolved
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (groups.length > 0) {
      setIsOpen(true);
    }
  }, [groups.length > 0]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  const allResolved = groups.length === 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px 12px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{allResolved ? '✅' : '🔄'}</span> {allResolved ? 'All Duplicates Resolved!' : 'Resolve Duplicate References'}
          </h2>
          <button 
            onClick={handleClose} 
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}
          >×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#F1F5F9' }}>
          {allResolved ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '20px', color: '#0F172A', marginBottom: '8px' }}>Library is now clean!</h3>
              <p style={{ color: '#64748B', fontSize: '14px' }}>All duplicate groups have been resolved. Click "Done" to refresh your library.</p>
            </div>
          ) : (
            <>
              <p style={{ marginTop: 0, color: '#475569', fontSize: '14px', marginBottom: '24px' }}>
                {groups.length} group(s) of potential duplicates remaining. Compare the metadata and choose which records to delete.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {groups.map((group, gIdx) => (
                  <div key={gIdx} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border-light)', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}>
                      Duplicate Group {gIdx + 1} ({group.length} items)
                    </div>
                    <div style={{ display: 'flex', overflowX: 'auto', padding: '16px', gap: '16px' }}>
                      {group.map(ref => (
                        <div key={ref.id} style={{ flex: '1 0 240px', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#FAFAF9' }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F172A', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ref.title}</div>
                          <div style={{ fontSize: '12px', color: '#475569' }}><strong>Authors:</strong> {ref.authors}</div>
                          <div style={{ fontSize: '12px', color: '#475569' }}><strong>Year:</strong> {ref.year}</div>
                          <div style={{ fontSize: '12px', color: '#475569' }}><strong>Journal:</strong> {ref.journal}</div>
                          <div style={{ fontSize: '12px', color: '#475569' }}><strong>DOI:</strong> {ref.doi || 'None'}</div>
                          <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'center' }}>
                            <button 
                              onClick={() => onDeleteRef(ref.id, gIdx)}
                              style={{ padding: '4px 8px', width: '100%', borderRadius: '4px', border: '1px solid #FCA5A5', color: '#DC2626', backgroundColor: '#FEF2F2', cursor: 'pointer', fontSize: '12px' }}
                            >
                              🗑️ Delete this variation
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-light)', backgroundColor: '#F8FAFC', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleClose} 
            style={{ padding: '8px 16px', backgroundColor: 'var(--color-accent-primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            {allResolved ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
