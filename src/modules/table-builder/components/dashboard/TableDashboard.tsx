/**
 * TableDashboard.tsx — Home / Table Dashboard screen (Section 3)
 */
import { useTableBuilder } from '../../TableBuilderContext';

export function TableDashboard() {
  const { state, dispatch, openTable } = useTableBuilder();

  const totalTables = state.tableList.length;
  const linkedTables = state.tableList.filter(t => t.link_status === 'linked').length;
  const outdatedTables = state.tableList.filter(t => t.link_status === 'outdated').length;
  const insertedTables = 0; // will be populated from doc links
  const exportedTables = 0;

  const actions = [
    { icon: '📄', title: 'Create Blank Table', desc: 'Start with an empty table canvas', action: () => dispatch({ type: 'SET_SHOW_WIZARD', payload: true }) },
    { icon: '📊', title: 'From Statistics Output', desc: 'Import analysis results into a table', action: () => { dispatch({ type: 'SET_SHOW_WIZARD', payload: true }); } },
    { icon: '📁', title: 'From Imported Data', desc: 'Import CSV, TSV, or flat file data', action: () => dispatch({ type: 'SET_SHOW_WIZARD', payload: true }) },
    { icon: '📂', title: 'Open Saved Table', desc: 'Browse your table library', action: () => { dispatch({ type: 'SET_TAB', payload: 'library' }); dispatch({ type: 'SET_SHOW_DASHBOARD', payload: false }); } },
    { icon: '📐', title: 'Open Preset Template', desc: 'Use a structured table template', action: () => dispatch({ type: 'SET_SHOW_WIZARD', payload: true }) },
    { icon: '📝', title: 'Build Results Narrative', desc: 'Generate manuscript-ready text', action: () => { dispatch({ type: 'SET_TAB', payload: 'narrative' }); dispatch({ type: 'SET_SHOW_DASHBOARD', payload: false }); } },
    { icon: '📎', title: 'Insert into Document', desc: 'Insert a table into your manuscript', action: () => { dispatch({ type: 'SET_TAB', payload: 'insert' }); dispatch({ type: 'SET_SHOW_DASHBOARD', payload: false }); } },
  ];

  const recentTables = [...state.tableList].slice(0, 8);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="tb-dashboard">
      <div className="tb-dashboard-header">
        <h2>Table Builder & Results Reporting</h2>
        <p>Build, format, and insert publication-grade tables into your manuscript</p>
      </div>

      {/* Quick stats strip */}
      <div className="tb-stats-strip">
        <div className="tb-stat-card">
          <div className="tb-stat-value">{totalTables}</div>
          <div className="tb-stat-label">Total Tables</div>
        </div>
        <div className="tb-stat-card">
          <div className="tb-stat-value">{linkedTables}</div>
          <div className="tb-stat-label">Linked Tables</div>
        </div>
        <div className="tb-stat-card">
          <div className="tb-stat-value" style={{ color: outdatedTables > 0 ? '#e67700' : undefined }}>{outdatedTables}</div>
          <div className="tb-stat-label">Outdated</div>
        </div>
        <div className="tb-stat-card">
          <div className="tb-stat-value">{insertedTables}</div>
          <div className="tb-stat-label">In Manuscript</div>
        </div>
        <div className="tb-stat-card">
          <div className="tb-stat-value">{exportedTables}</div>
          <div className="tb-stat-label">Exported</div>
        </div>
      </div>

      {/* Action cards */}
      <div className="tb-action-grid">
        {actions.map((a, i) => (
          <button key={i} className="tb-action-card" onClick={a.action}>
            <span className="tb-action-icon">{a.icon}</span>
            <div className="tb-action-title">{a.title}</div>
            <div className="tb-action-desc">{a.desc}</div>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      {recentTables.length > 0 && (
        <>
          <h3 className="tb-section-title">Recent Tables</h3>
          <div className="tb-recent-list">
            {recentTables.map(t => (
              <div key={t.id} className="tb-recent-item" onClick={() => openTable(t.id)}>
                <span className="tb-recent-icon">📋</span>
                <div className="tb-recent-info">
                  <div className="tb-recent-name">{t.title || t.name}</div>
                  <div className="tb-recent-meta">{t.table_type} · {formatDate(t.updated_at)}</div>
                </div>
                {t.link_status === 'linked' && <span className="tb-recent-badge tb-link-linked">🔗 Linked</span>}
                {t.link_status === 'outdated' && <span className="tb-recent-badge tb-link-outdated">⚠️ Outdated</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {totalTables === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#adb5bd' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 14 }}>No tables yet. Create your first publication-grade table.</p>
        </div>
      )}
    </div>
  );
}
