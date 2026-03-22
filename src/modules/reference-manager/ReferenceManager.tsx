import { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import type { Reference } from '../../types/electron.d';

export function ReferenceManager() {
  const { currentProject } = useProject();
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'year', direction: 'desc' });

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', authors: '', year: '', journal: '', doi: ''
  });

  const loadReferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await window.api.getReferences();
      if (result.success && result.data) {
        setReferences(result.data);
      } else {
        setError(result.error || 'Failed to load references');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadReferences();
    }
  }, [currentProject]);

  const handleOpenForm = (ref?: Reference) => {
    if (ref) {
      setEditingId(ref.id);
      setFormData({
        title: ref.title,
        authors: ref.authors,
        year: ref.year,
        journal: ref.journal || '',
        doi: ref.doi || ''
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', authors: '', year: '', journal: '', doi: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        authors: formData.authors,
        year: formData.year,
        journal: formData.journal || null,
        doi: formData.doi || null,
        raw_metadata: null
      };

      if (editingId) {
        await window.api.updateReference(editingId, payload);
      } else {
        await window.api.createReference(payload);
      }
      
      handleCloseForm();
      loadReferences();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save reference');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reference?')) return;
    try {
      await window.api.deleteReference(id);
      loadReferences();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete reference');
    }
  };

  if (!currentProject) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>
        <p>Please open a project to manage references.</p>
      </div>
    );
  }

  // Filter and Sort Logic
  const filteredReferences = references.filter(ref => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (ref.title && ref.title.toLowerCase().includes(q)) ||
      (ref.authors && ref.authors.toLowerCase().includes(q)) ||
      (ref.year && ref.year.toString().includes(q)) ||
      (ref.journal && ref.journal.toLowerCase().includes(q))
    );
  });

  const sortedReferences = [...filteredReferences].sort((a, b) => {
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIndicator = (key: string) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)', height: '100%' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>References ({filteredReferences.length}{searchQuery ? ` / ${references.length}` : ''})</h2>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-surface)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', flex: 1, maxWidth: '300px' }}>
            <span style={{ marginRight: '8px', color: 'var(--color-text-tertiary)', fontSize: '14px' }}>🔍</span>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search references..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--color-text-primary)' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>✕</button>
            )}
          </div>
          <button 
            onClick={async () => {
              try {
                const result = await window.api.importReferencesFile();
                if (result.success && result.count && result.count > 0) {
                  loadReferences();
                  alert(`Successfully imported ${result.count} references.`);
                } else if (result.error) {
                  setError(result.error);
                }
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Error importing references');
              }
            }}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--color-bg-hover)',
              color: 'var(--color-text-primary)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-medium)',
              border: '1px solid var(--color-border-strong)',
              cursor: 'pointer'
            }}
            title="Import .ris or .bib files"
          >
            📥 Import File
          </button>
          <button 
            onClick={() => handleOpenForm()}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--color-accent-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-medium)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            + Add Reference
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-sidebar)' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading references...</div>
        ) : references.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            No references found. Click "Add Reference" to get started!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)' }}>
                <th onClick={() => handleSort('authors')} style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Authors{renderSortIndicator('authors')}</th>
                <th onClick={() => handleSort('title')} style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Title{renderSortIndicator('title')}</th>
                <th onClick={() => handleSort('year')} style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', cursor: 'pointer', width: '80px' }}>Year{renderSortIndicator('year')}</th>
                <th onClick={() => handleSort('review_status')} style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', cursor: 'pointer', width: '140px' }}>Review Status{renderSortIndicator('review_status')}</th>
                <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReferences.map(ref => (
                <tr key={ref.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{ref.authors}</td>
                  <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                    <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{ref.title}</div>
                    {ref.journal && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{ref.journal}</div>}
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{ref.year}</td>
                  <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ 
                      fontSize: 'var(--font-size-xs)', 
                      padding: 'var(--space-1) var(--space-2)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontWeight: 'var(--font-weight-medium)',
                      backgroundColor: ref.review_status === 'included' ? 'rgba(34, 197, 94, 0.1)' : ref.review_status === 'excluded' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-hover)',
                      color: ref.review_status === 'included' ? 'var(--color-success)' : ref.review_status === 'excluded' ? 'var(--color-danger)' : 'var(--color-text-tertiary)'
                    }}>
                      {ref.review_status ? ref.review_status.toUpperCase() : 'UNREVIEWED'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={() => handleOpenForm(ref)}
                        style={{ padding: 'var(--space-1) var(--space-2)', background: 'transparent', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(ref.id)} style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Overlay */}
      {isFormOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
              {editingId ? 'Edit Reference' : 'New Reference'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Title *</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Authors *</label>
                <input required value={formData.authors} onChange={e => setFormData({...formData, authors: e.target.value})} placeholder="Doe J., Smith A." style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1 }}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Year *</label>
                  <input required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="2023" style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 2 }}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Journal/Publisher</label>
                  <input value={formData.journal} onChange={e => setFormData({...formData, journal: e.target.value})} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>DOI</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input value={formData.doi} onChange={e => setFormData({...formData, doi: e.target.value})} placeholder="10.1038/s41586-020-2649-2" style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }} />
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (!formData.doi) return;
                      try {
                        const res = await window.api.fetchDOI(formData.doi);
                        if (res.success && res.data) {
                          setFormData(prev => ({
                            ...prev,
                            title: res.data?.title || prev.title,
                            authors: res.data?.authors || prev.authors,
                            year: res.data?.year || prev.year,
                            journal: res.data?.journal !== null && res.data?.journal !== undefined ? res.data.journal : prev.journal
                          }));
                        } else {
                          setError(res.error || 'Failed to fetch DOI metadata');
                        }
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : 'Unknown error');
                      }
                    }}
                    style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-bg-sidebar)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap' }}
                  >
                    Fetch
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <button type="button" onClick={handleCloseForm} style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'transparent', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)' }}>Cancel</button>
                <button type="submit" style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
