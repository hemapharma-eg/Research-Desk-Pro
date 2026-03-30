/**
 * TableBuilder.tsx — Module Shell
 * Top-level component for the Table Builder & Results Reporting Suite.
 */

import { TableBuilderProvider, useTableBuilder } from './TableBuilderContext';
import { TableDashboard } from './components/dashboard/TableDashboard';
import { TableCanvas } from './components/canvas/TableCanvas';
import { TableLibrary } from './components/library/TableLibrary';
import { CreateTableWizard } from './components/wizard/CreateTableWizard';
import type { TableBuilderTab } from './types/TableBuilderTypes';
import './TableBuilder.css';

const TABS: { id: TableBuilderTab; label: string; icon: string }[] = [
  { id: 'home',      label: 'Home',           icon: '🏠' },
  { id: 'new',       label: 'New Table',       icon: '➕' },
  { id: 'canvas',    label: 'Canvas',          icon: '📐' },
  { id: 'style',     label: 'Style',           icon: '🎨' },
  { id: 'source',    label: 'From Analysis',   icon: '📊' },
  { id: 'narrative',  label: 'Narrative',      icon: '📝' },
  { id: 'library',   label: 'Library',         icon: '📚' },
  { id: 'insert',    label: 'Insert',          icon: '📎' },
  { id: 'export',    label: 'Export',           icon: '📤' },
  { id: 'audit',     label: 'Audit',            icon: '🔍' },
  { id: 'settings',  label: 'Settings',        icon: '⚙️' },
];

function TableBuilderContent() {
  const { state, dispatch, saveTable } = useTableBuilder();

  const handleTabChange = (tab: TableBuilderTab) => {
    if (tab === 'new') {
      dispatch({ type: 'SET_SHOW_WIZARD', payload: true });
      return;
    }
    if (tab === 'home') {
      dispatch({ type: 'SET_SHOW_DASHBOARD', payload: true });
      dispatch({ type: 'SET_TAB', payload: 'home' });
      return;
    }
    dispatch({ type: 'SET_TAB', payload: tab });
    if (tab !== 'library') {
      dispatch({ type: 'SET_SHOW_DASHBOARD', payload: false });
    }
  };

  const renderWorkspace = () => {
    if (state.showDashboard || state.activeTab === 'home') {
      return <TableDashboard />;
    }
    if (state.activeTab === 'library') {
      return <TableLibrary />;
    }
    if (!state.table) {
      return (
        <div className="tb-empty-state">
          <div className="tb-empty-icon">📋</div>
          <h3>No Table Open</h3>
          <p>Create a new table or open one from the Library to get started.</p>
          <div className="tb-empty-actions">
            <button className="tb-btn tb-btn-primary" onClick={() => dispatch({ type: 'SET_SHOW_WIZARD', payload: true })}>
              ➕ New Table
            </button>
            <button className="tb-btn tb-btn-secondary" onClick={() => handleTabChange('library')}>
              📚 Open Library
            </button>
          </div>
        </div>
      );
    }
    // All other tabs render inside the canvas layout
    return <TableCanvas activeTab={state.activeTab} />;
  };

  return (
    <div className="tb-module">
      {/* Left sidebar */}
      <aside className="tb-sidebar">
        <div className="tb-sidebar-header">
          <span className="tb-sidebar-logo">📋</span>
          <span className="tb-sidebar-title">Table Builder</span>
        </div>
        <nav className="tb-sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tb-sidebar-item ${state.activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              title={tab.label}
            >
              <span className="tb-sidebar-icon">{tab.icon}</span>
              <span className="tb-sidebar-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Active table indicator */}
        {state.table && (
          <div className="tb-sidebar-active-table">
            <div className="tb-active-dot" />
            <div className="tb-active-info">
              <span className="tb-active-name">{state.table.name}</span>
              <span className="tb-active-type">{state.table.tableType}</span>
            </div>
            {state.isSaving && <span className="tb-saving-indicator">Saving…</span>}
          </div>
        )}
      </aside>

      {/* Main workspace */}
      <main className="tb-workspace">
        {/* Top bar */}
        {state.table && !state.showDashboard && (
          <div className="tb-topbar">
            <div className="tb-topbar-left">
              <button className="tb-btn tb-btn-ghost" onClick={() => { dispatch({ type: 'CLOSE_TABLE' }); }}>
                ← Back
              </button>
              <h2 className="tb-topbar-title">{state.table.title || state.table.name}</h2>
              {state.table.tableNumber && <span className="tb-topbar-number">{state.table.tableNumber}</span>}
              {state.table.sourceLink && (
                <span className={`tb-link-badge tb-link-${state.table.sourceLink.status}`}>
                  {state.table.sourceLink.status === 'linked' ? '🔗 Linked' : state.table.sourceLink.status === 'outdated' ? '⚠️ Outdated' : '🔓 Detached'}
                </span>
              )}
            </div>
            <div className="tb-topbar-right">
              <button className="tb-btn tb-btn-sm" onClick={saveTable}>💾 Save</button>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="tb-content">
          {renderWorkspace()}
        </div>
      </main>

      {/* Wizard overlay */}
      {state.showWizard && <CreateTableWizard />}
    </div>
  );
}

export function TableBuilder() {
  return (
    <TableBuilderProvider>
      <TableBuilderContent />
    </TableBuilderProvider>
  );
}
