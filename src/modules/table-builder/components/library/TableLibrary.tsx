/**
 * TableLibrary.tsx — Table Library / List View (Section 15)
 */
import React, { useState } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';

type FilterType = 'all' | 'linked' | 'outdated' | 'inserted' | 'baseline' | 'regression' | 'evidence' | 'supplementary' | 'draft';

export const TableLibrary: React.FC = () => {
  const { state, dispatch, openTable, deleteTable } = useTableBuilder();
  const { tableList, isLoadingList } = state;
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'linked', label: 'Linked' },
    { id: 'outdated', label: 'Outdated' },
    { id: 'baseline', label: 'Baseline' },
    { id: 'regression', label: 'Regression' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'supplementary', label: 'Supplementary' },
  ];

  const filtered = tableList.filter(t => {
    if (search) {
      const s = search.toLowerCase();
      if (!t.name?.toLowerCase().includes(s) && !t.title?.toLowerCase().includes(s) && !t.table_type?.toLowerCase().includes(s)) return false;
    }
    if (filter === 'all') return true;
    if (filter === 'linked') return t.link_status === 'linked';
    if (filter === 'outdated') return t.link_status === 'outdated';
    if (filter === 'baseline') return t.table_type === 'baseline' || t.table_type === 'demographic';
    if (filter === 'regression') return t.table_type === 'regression' || t.table_type === 'model-comparison';
    if (filter === 'evidence') return t.table_type?.includes('evidence') || t.table_type?.includes('study');
    if (filter === 'supplementary') return t.table_type === 'supplementary';
    return true;
  });

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString(); } catch { return d; } };

  return (
    <div className="tb-library">
      <div className="tb-library-header">
        <h2>📚 Table Library</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="tb-form-input" placeholder="Search tables..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <button className="tb-btn tb-btn-primary" onClick={() => dispatch({ type: 'SET_SHOW_WIZARD', payload: true })}>➕ New Table</button>
        </div>
      </div>

      {/* Filters */}
      <div className="tb-library-filters">
        {filters.map(f => (
          <button key={f.id} className={`tb-filter-chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoadingList ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#868e96' }}>Loading tables...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#868e96' }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📋</span>
          {search || filter !== 'all' ? 'No tables match the current filter.' : 'No tables yet. Create your first table to get started.'}
        </div>
      ) : (
        <table className="tb-library-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Source</th>
              <th>Modified</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} onDoubleClick={() => openTable(t.id)} style={{ cursor: 'pointer' }}>
                <td style={{ color: '#868e96', fontSize: 11 }}>{t.table_number || '—'}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{t.name}</div>
                  {t.title && t.title !== t.name && <div style={{ fontSize: 10, color: '#adb5bd' }}>{t.title}</div>}
                </td>
                <td><span style={{ fontSize: 10, background: '#f1f3f5', padding: '2px 6px', borderRadius: 3 }}>{t.table_type}</span></td>
                <td>
                  {t.link_status && t.link_status !== 'none' ? (
                    <span className={`tb-link-badge tb-link-${t.link_status}`}>{t.link_status}</span>
                  ) : '—'}
                </td>
                <td style={{ fontSize: 11, color: '#868e96' }}>{formatDate(t.updated_at)}</td>
                <td>{t.category && <span style={{ fontSize: 10, color: '#495057' }}>{t.category}</span>}</td>
                <td>
                  <div className="tb-lib-actions">
                    <button className="tb-btn tb-btn-ghost tb-btn-sm" onClick={() => openTable(t.id)} title="Open">📂</button>
                    <button className="tb-btn tb-btn-ghost tb-btn-sm" onClick={() => { if (confirm('Delete this table?')) deleteTable(t.id); }} title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: '#adb5bd' }}>
        {filtered.length} table{filtered.length !== 1 ? 's' : ''} • Double-click to open
      </div>
    </div>
  );
};
