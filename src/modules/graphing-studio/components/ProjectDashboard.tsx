import { useState } from 'react';
import { useGraphingStudio } from '../GraphingStudioContext';

export function ProjectDashboard() {
  const { state, openDataset, createNewDataset, deleteDataset } = useGraphingStudio();
  const [newName, setNewName] = useState('');
  const [newFormat, setNewFormat] = useState('column');
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim() || 'Untitled Dataset';
    await createNewDataset(name, newFormat);
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div className="gs-dashboard">
      <div className="gs-dashboard-header">
        <h2>Publication Graphing Studio</h2>
        <p>Create or open a dataset to start your analysis workflow.</p>
      </div>

      <div className="gs-dashboard-actions">
        <div className="gs-dashboard-card" onClick={() => setShowCreate(true)}>
          <div className="gs-dashboard-card-icon">📊</div>
          <div className="gs-dashboard-card-title">New Dataset</div>
          <div className="gs-dashboard-card-desc">Start with a blank spreadsheet</div>
        </div>
        <div className="gs-dashboard-card" onClick={() => setShowCreate(true)}>
          <div className="gs-dashboard-card-icon">📁</div>
          <div className="gs-dashboard-card-title">Import Data</div>
          <div className="gs-dashboard-card-desc">CSV, TSV, or paste from clipboard</div>
        </div>
        <div className="gs-dashboard-card" onClick={() => {/* templates placeholder */}}>
          <div className="gs-dashboard-card-icon">📋</div>
          <div className="gs-dashboard-card-title">Templates</div>
          <div className="gs-dashboard-card-desc">Pre-built scientific workflows</div>
        </div>
      </div>

      {/* Create New Dialog */}
      {showCreate && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          width: '400px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>Create New Dataset</h3>
          <div className="gs-form-group">
            <label className="gs-label">Dataset Name</label>
            <input
              className="gs-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Treatment Comparison Study"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="gs-form-group">
            <label className="gs-label">Table Format</label>
            <select className="gs-select" value={newFormat} onChange={e => setNewFormat(e.target.value)}>
              <option value="column">Column Table — Independent groups (t-test, ANOVA)</option>
              <option value="grouped">Grouped Table — Two factors (two-way ANOVA)</option>
              <option value="xy">XY Table — Paired values (regression, correlation)</option>
              <option value="paired">Paired / Repeated — Same subjects, multiple conditions</option>
              <option value="contingency">Contingency Table — Categorical counts (chi-square)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="gs-btn" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="gs-btn gs-btn-primary" onClick={handleCreate}>Create Dataset</button>
          </div>
        </div>
      )}

      {/* Recent Datasets */}
      {state.datasetList.length > 0 && (
        <div className="gs-recent-list">
          <h3>Recent Datasets</h3>
          {state.datasetList.map(ds => (
            <div key={ds.id} className="gs-recent-item" onClick={() => openDataset(ds.id)}>
              <span className="gs-recent-badge">{ds.format}</span>
              <span className="gs-recent-name">{ds.name}</span>
              <span className="gs-recent-meta">{new Date(ds.updated_at).toLocaleDateString()}</span>
              <button
                className="gs-btn gs-btn-sm gs-btn-danger"
                onClick={e => { e.stopPropagation(); if (confirm(`Delete "${ds.name}"?`)) deleteDataset(ds.id); }}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {state.isLoadingList && (
        <p style={{ color: 'var(--color-text-tertiary)' }}>Loading datasets...</p>
      )}
    </div>
  );
}
