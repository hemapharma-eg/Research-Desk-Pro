/**
 * TableCanvas.tsx — Main Canvas Layout + Toolbar
 * The primary editing workspace for the Table Builder module.
 * Renders the toolbar, TableGrid, PropertiesPanel, and bottom panels.
 */

import React, { useState, useCallback } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import { TableGrid } from './TableGrid';
import { PropertiesPanel } from './PropertiesPanel';
import type { TableBuilderTab, TBColumn, TBRow, TBCell, DEFAULT_CELL_FORMATTING, GroupedHeader, Footnote } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING as defaultCellFmt } from '../../types/TableBuilderTypes';
import { StyleFormatPanel } from '../style/StyleFormatPanel';
import { SourcePanel } from '../source/SourcePanel';
import { NarrativeBuilder } from '../narrative/NarrativeBuilder';
import { InsertionPanel } from '../insertion/InsertionPanel';
import { ExportCenter } from '../export/ExportCenter';
import { AuditPanel } from '../audit/AuditPanel';
import { SettingsPanel } from '../settings/SettingsPanel';

type BottomTab = 'notes' | 'footnotes' | 'source' | 'warnings' | 'narrative' | 'history';

interface TableCanvasProps {
  activeTab: TableBuilderTab;
}

export const TableCanvas: React.FC<TableCanvasProps> = ({ activeTab }) => {
  const { state, dispatch, saveTable } = useTableBuilder();
  const { table } = state;
  const [bottomTab, setBottomTab] = useState<BottomTab>('footnotes');
  const [showProperties, setShowProperties] = useState(true);

  // If not on 'canvas', render the appropriate tab panel
  if (activeTab === 'style') return <StyleFormatPanel />;
  if (activeTab === 'source') return <SourcePanel />;
  if (activeTab === 'narrative') return <NarrativeBuilder />;
  if (activeTab === 'insert') return <InsertionPanel />;
  if (activeTab === 'export') return <ExportCenter />;
  if (activeTab === 'audit') return <AuditPanel />;
  if (activeTab === 'settings') return <SettingsPanel />;

  if (!table) return null;

  // ── Row / Column manipulation ──
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const addRow = () => {
    const newRow: TBRow = {
      id: generateId(),
      cells: Object.fromEntries(
        table.columns.map(col => [col.id, {
          id: generateId(),
          rawValue: null,
          displayValue: '',
          formatType: 'text' as const,
          numericPrecision: 2,
          sourceBinding: null,
          manualOverride: false,
          noteMarkers: [],
          validationFlags: [],
          formatting: { ...defaultCellFmt },
        }])
      ),
    };
    const updated = { ...table, rows: [...table.rows, newRow], updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
  };

  const addColumn = () => {
    const colId = generateId();
    const newCol: TBColumn = {
      id: colId,
      title: `Column ${table.columns.length + 1}`,
      width: 'auto',
      locked: false,
      hidden: false,
      defaultFormat: {},
    };
    const newRows = table.rows.map(row => ({
      ...row,
      cells: {
        ...row.cells,
        [colId]: {
          id: generateId(),
          rawValue: null,
          displayValue: '',
          formatType: 'text' as const,
          numericPrecision: 2,
          sourceBinding: null,
          manualOverride: false,
          noteMarkers: [],
          validationFlags: [],
          formatting: { ...defaultCellFmt },
        },
      },
    }));
    const updated = { ...table, columns: [...table.columns, newCol], rows: newRows, updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
  };

  const deleteSelectedRow = () => {
    if (!state.selectedRowId) return;
    const updated = { ...table, rows: table.rows.filter(r => r.id !== state.selectedRowId), updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
    dispatch({ type: 'SET_SELECTED_ROW', payload: null });
    dispatch({ type: 'SET_SELECTED_CELL', payload: null });
  };

  const deleteSelectedCol = () => {
    if (!state.selectedColId) return;
    const colId = state.selectedColId;
    const newCols = table.columns.filter(c => c.id !== colId);
    const newRows = table.rows.map(row => {
      const { [colId]: _, ...rest } = row.cells;
      return { ...row, cells: rest };
    });
    const updated = { ...table, columns: newCols, rows: newRows, updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
    dispatch({ type: 'SET_SELECTED_COL', payload: null });
    dispatch({ type: 'SET_SELECTED_CELL', payload: null });
  };

  const addSectionRow = () => {
    const newRow: TBRow = {
      id: generateId(),
      cells: {},
      sectionLabel: 'New Section',
    };
    const updated = { ...table, rows: [...table.rows, newRow], updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
  };

  const addSeparatorRow = () => {
    const newRow: TBRow = {
      id: generateId(),
      cells: {},
      isSeparator: true,
    };
    const updated = { ...table, rows: [...table.rows, newRow], updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
  };

  const addFootnote = () => {
    const markers = 'abcdefghijklmnopqrstuvwxyz';
    const idx = table.footnotes.length;
    const fn: Footnote = {
      id: generateId(),
      marker: markers[idx % markers.length] || String(idx + 1),
      type: 'alphabetic',
      text: '',
      attachedTo: [],
    };
    const updated = { ...table, footnotes: [...table.footnotes, fn], updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
  };

  const addGroupedHeader = () => {
    if (table.columns.length < 2) return;
    const gh: GroupedHeader = {
      id: generateId(),
      label: 'Group Header',
      startColId: table.columns[0].id,
      endColId: table.columns[Math.min(1, table.columns.length - 1)].id,
      level: 0,
    };
    const updated = { ...table, groupedHeaders: [...table.groupedHeaders, gh], updatedAt: Date.now() };
    dispatch({ type: 'SET_TABLE', payload: updated });
  };

  const bottomTabs: { id: BottomTab; label: string }[] = [
    { id: 'footnotes', label: 'Footnotes' },
    { id: 'notes', label: 'Table Notes' },
    { id: 'source', label: 'Source Lineage' },
    { id: 'warnings', label: 'Warnings' },
    { id: 'history', label: 'Changes' },
  ];

  return (
    <div className="tb-canvas-layout">
      {/* Main editing area */}
      <div className="tb-canvas-main">
        {/* Toolbar */}
        <div className="tb-canvas-toolbar">
          <button className="tb-toolbar-btn" onClick={saveTable} title="Save">💾 Save</button>
          <div className="tb-toolbar-sep" />
          <button className="tb-toolbar-btn" onClick={addRow} title="Insert Row">＋ Row</button>
          <button className="tb-toolbar-btn" onClick={addColumn} title="Insert Column">＋ Col</button>
          <button className="tb-toolbar-btn" onClick={deleteSelectedRow} title="Delete Row" disabled={!state.selectedRowId}>✕ Row</button>
          <button className="tb-toolbar-btn" onClick={deleteSelectedCol} title="Delete Column" disabled={!state.selectedColId}>✕ Col</button>
          <div className="tb-toolbar-sep" />
          <button className="tb-toolbar-btn" onClick={addGroupedHeader} title="Add Grouped Header">⊞ Group</button>
          <button className="tb-toolbar-btn" onClick={addSectionRow} title="Add Section Break">§ Section</button>
          <button className="tb-toolbar-btn" onClick={addSeparatorRow} title="Add Separator">― Separator</button>
          <button className="tb-toolbar-btn" onClick={addFootnote} title="Add Footnote">ᵃ Footnote</button>
          <div className="tb-toolbar-sep" />
          <button className="tb-toolbar-btn" onClick={() => dispatch({ type: 'SET_TAB', payload: 'style' })} title="Style Options">🎨 Style</button>
          <button className="tb-toolbar-btn" onClick={() => dispatch({ type: 'SET_TAB', payload: 'narrative' })} title="Generate Narrative">📝 Narrative</button>
          <button className="tb-toolbar-btn" onClick={() => dispatch({ type: 'SET_TAB', payload: 'export' })} title="Export">📤 Export</button>
          <div className="tb-toolbar-sep" />
          <button
            className={`tb-toolbar-btn ${showProperties ? 'active' : ''}`}
            onClick={() => setShowProperties(!showProperties)}
            title="Toggle Properties Panel"
          >⚙ Properties</button>
        </div>

        {/* Grid container */}
        <div className="tb-grid-container" style={{ flex: 1, overflow: 'auto' }}>
          <TableGrid />
        </div>

        {/* Bottom panel */}
        <div className="tb-bottom-panel">
          <div className="tb-bottom-tabs">
            {bottomTabs.map(tab => (
              <button
                key={tab.id}
                className={`tb-bottom-tab ${bottomTab === tab.id ? 'active' : ''}`}
                onClick={() => setBottomTab(tab.id)}
              >
                {tab.label}
                {tab.id === 'warnings' && state.validationResults.length > 0 && (
                  <span style={{ marginLeft: 4, fontSize: 9, background: '#e03131', color: '#fff', borderRadius: 8, padding: '1px 4px' }}>
                    {state.validationResults.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="tb-bottom-content">
            {bottomTab === 'footnotes' && (
              <div>
                {table.footnotes.length === 0 ? (
                  <div style={{ color: '#adb5bd', fontStyle: 'italic' }}>No footnotes yet. Click "ᵃ Footnote" to add one.</div>
                ) : (
                  table.footnotes.map((fn, i) => (
                    <div key={fn.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, minWidth: 20 }}>{fn.marker}</span>
                      <input
                        className="tb-prop-input"
                        value={fn.text}
                        placeholder="Enter footnote text..."
                        onChange={e => {
                          const updated = { ...table, footnotes: table.footnotes.map(f => f.id === fn.id ? { ...f, text: e.target.value } : f), updatedAt: Date.now() };
                          dispatch({ type: 'SET_TABLE', payload: updated });
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        className="tb-btn tb-btn-ghost tb-btn-sm"
                        onClick={() => {
                          const updated = { ...table, footnotes: table.footnotes.filter(f => f.id !== fn.id), updatedAt: Date.now() };
                          dispatch({ type: 'SET_TABLE', payload: updated });
                        }}
                      >✕</button>
                    </div>
                  ))
                )}
              </div>
            )}
            {bottomTab === 'notes' && (
              <textarea
                className="tb-form-textarea"
                value={table.notesToSelf}
                placeholder="Internal notes (not included in exports)..."
                onChange={e => dispatch({ type: 'SET_TABLE', payload: { ...table, notesToSelf: e.target.value, updatedAt: Date.now() } })}
                style={{ width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none' }}
              />
            )}
            {bottomTab === 'source' && (
              <div>
                {table.sourceLink ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><strong>Source Analysis:</strong> {table.sourceLink.testName}</div>
                    <div><strong>Variables:</strong> {table.sourceLink.variablesUsed.join(', ')}</div>
                    <div><strong>Status:</strong> <span className={`tb-link-badge tb-link-${table.sourceLink.status}`}>{table.sourceLink.status}</span></div>
                    <div><strong>Last Refresh:</strong> {table.sourceLink.lastRefreshAt ? new Date(table.sourceLink.lastRefreshAt).toLocaleString() : 'Never'}</div>
                  </div>
                ) : (
                  <div style={{ color: '#adb5bd', fontStyle: 'italic' }}>This table is not linked to any statistics output.</div>
                )}
              </div>
            )}
            {bottomTab === 'warnings' && (
              <div className="tb-validation-list">
                {state.validationResults.length === 0 ? (
                  <div style={{ color: '#adb5bd', fontStyle: 'italic' }}>No validation issues found. ✓</div>
                ) : (
                  state.validationResults.map(issue => (
                    <div key={issue.id} className={`tb-validation-item ${issue.severity}`}>
                      <span className="tb-validation-icon">
                        {issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <div className="tb-validation-text">
                        <strong>{issue.category}</strong>: {issue.description}
                        <br /><span style={{ fontSize: 10, color: '#868e96' }}>{issue.location}</span>
                      </div>
                      {issue.quickFixAvailable && <span className="tb-validation-fix">Quick Fix</span>}
                    </div>
                  ))
                )}
              </div>
            )}
            {bottomTab === 'history' && (
              <div>
                {state.auditLog.length === 0 ? (
                  <div style={{ color: '#adb5bd', fontStyle: 'italic' }}>No changes recorded yet.</div>
                ) : (
                  state.auditLog.slice(-20).reverse().map(entry => (
                    <div key={entry.id} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: '#adb5bd', minWidth: 120 }}>{new Date(entry.timestamp).toLocaleString()}</span>
                      <span style={{ fontWeight: 500 }}>{entry.action.replace(/_/g, ' ')}</span>
                      {entry.details?.cell && <span style={{ color: '#868e96' }}>Cell {entry.details.cell}</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right properties panel */}
      {showProperties && <PropertiesPanel />}
    </div>
  );
};
