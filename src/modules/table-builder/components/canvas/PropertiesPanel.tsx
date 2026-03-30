/**
 * PropertiesPanel.tsx — Right-side contextual properties panel
 * Displays properties for selected cell, column, row, header, table, footnotes, source mapping, and validation.
 */

import React, { useState } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import type { CellFormatType, CellFormatting, TBCell, TBColumn } from '../../types/TableBuilderTypes';
import { DEFAULT_CELL_FORMATTING } from '../../types/TableBuilderTypes';

type PropTab = 'cell' | 'column' | 'row' | 'table' | 'footnotes' | 'validation';

export const PropertiesPanel: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const { table, selectedCellId, selectedColId, selectedRowId } = state;
  const [activeTab, setActiveTab] = useState<PropTab>('cell');

  if (!table) return null;

  // Find selected cell
  let selectedCell: TBCell | null = null;
  let selectedCellRowId: string | null = null;
  let selectedCellColId: string | null = null;
  if (selectedCellId) {
    for (const row of table.rows) {
      for (const [colId, cell] of Object.entries(row.cells)) {
        if (cell.id === selectedCellId) {
          selectedCell = cell;
          selectedCellRowId = row.id;
          selectedCellColId = colId;
          break;
        }
      }
      if (selectedCell) break;
    }
  }

  const selectedColumn = selectedColId ? table.columns.find(c => c.id === selectedColId) : null;
  const selectedRow = selectedRowId ? table.rows.find(r => r.id === selectedRowId) : null;

  const updateCell = (updates: Partial<TBCell>) => {
    if (!selectedCellRowId || !selectedCellColId) return;
    dispatch({ type: 'UPDATE_CELL', payload: { rowId: selectedCellRowId, colId: selectedCellColId, cell: updates } });
  };

  const updateCellFormatting = (updates: Partial<CellFormatting>) => {
    if (!selectedCell) return;
    updateCell({ formatting: { ...(selectedCell.formatting || DEFAULT_CELL_FORMATTING), ...updates } });
  };

  const updateColumn = (updates: Partial<TBColumn>) => {
    if (!selectedColId) return;
    const newCols = table.columns.map(c => c.id === selectedColId ? { ...c, ...updates } : c);
    dispatch({ type: 'SET_TABLE', payload: { ...table, columns: newCols, updatedAt: Date.now() } });
  };

  const tabs: { id: PropTab; label: string }[] = [
    { id: 'cell', label: 'Cell' },
    { id: 'column', label: 'Column' },
    { id: 'row', label: 'Row' },
    { id: 'table', label: 'Table' },
    { id: 'footnotes', label: 'Notes' },
    { id: 'validation', label: 'Valid.' },
  ];

  return (
    <div className="tb-properties">
      <div className="tb-properties-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tb-properties-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tb-properties-content">
        {/* ── Cell Properties ── */}
        {activeTab === 'cell' && (
          selectedCell ? (
            <div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Value</div>
                <input
                  className="tb-prop-input"
                  value={selectedCell.displayValue}
                  onChange={e => updateCell({ displayValue: e.target.value, rawValue: e.target.value, manualOverride: true })}
                />
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Format Type</div>
                <select
                  className="tb-prop-select"
                  value={selectedCell.formatType}
                  onChange={e => updateCell({ formatType: e.target.value as CellFormatType })}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="percentage">Percentage</option>
                  <option value="p-value">P-value</option>
                  <option value="ci">Confidence Interval</option>
                  <option value="mixed">Mixed</option>
                  <option value="symbol">Symbol</option>
                </select>
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Decimal Places</div>
                <input
                  className="tb-prop-input"
                  type="number"
                  min={0}
                  max={10}
                  value={selectedCell.numericPrecision}
                  onChange={e => updateCell({ numericPrecision: parseInt(e.target.value) || 2 })}
                />
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Text Formatting</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className={`tb-toolbar-btn ${selectedCell.formatting?.bold ? 'active' : ''}`} onClick={() => updateCellFormatting({ bold: !selectedCell!.formatting?.bold })} style={{ fontWeight: 'bold' }}>B</button>
                  <button className={`tb-toolbar-btn ${selectedCell.formatting?.italic ? 'active' : ''}`} onClick={() => updateCellFormatting({ italic: !selectedCell!.formatting?.italic })} style={{ fontStyle: 'italic' }}>I</button>
                  <button className={`tb-toolbar-btn ${selectedCell.formatting?.underline ? 'active' : ''}`} onClick={() => updateCellFormatting({ underline: !selectedCell!.formatting?.underline })} style={{ textDecoration: 'underline' }}>U</button>
                </div>
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Horizontal Alignment</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['left', 'center', 'right', 'decimal'] as const).map(a => (
                    <button
                      key={a}
                      className={`tb-toolbar-btn ${selectedCell!.formatting?.alignH === a ? 'active' : ''}`}
                      onClick={() => updateCellFormatting({ alignH: a })}
                      style={{ fontSize: 10, textTransform: 'capitalize' }}
                    >{a === 'left' ? '◀' : a === 'center' ? '◆' : a === 'right' ? '▶' : '.0'}</button>
                  ))}
                </div>
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Prefix / Suffix</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input className="tb-prop-input" placeholder="Prefix" value={selectedCell.formatting?.prefix || ''} onChange={e => updateCellFormatting({ prefix: e.target.value })} style={{ flex: 1 }} />
                  <input className="tb-prop-input" placeholder="Suffix" value={selectedCell.formatting?.suffix || ''} onChange={e => updateCellFormatting({ suffix: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Unit</div>
                <input className="tb-prop-input" value={selectedCell.formatting?.unit || ''} onChange={e => updateCellFormatting({ unit: e.target.value })} placeholder="e.g. mg, %, mmHg" />
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Background Color</div>
                <input type="color" value={selectedCell.formatting?.bgColor || '#ffffff'} onChange={e => updateCellFormatting({ bgColor: e.target.value })} />
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Indent Level</div>
                <input className="tb-prop-input" type="number" min={0} max={5} value={selectedCell.formatting?.indent || 0} onChange={e => updateCellFormatting({ indent: parseInt(e.target.value) || 0 })} />
              </div>
              {selectedCell.sourceBinding && (
                <div className="tb-prop-group">
                  <div className="tb-prop-label">Source Binding</div>
                  <div style={{ fontSize: 11, color: '#495057', background: '#f8f9fa', padding: 6, borderRadius: 4 }}>
                    <div>Field: {selectedCell.sourceBinding.field}</div>
                    <div>Path: {selectedCell.sourceBinding.path}</div>
                    <div style={{ marginTop: 4 }}>
                      <label className="tb-form-checkbox-row">
                        <input type="checkbox" checked={selectedCell.manualOverride} onChange={e => updateCell({ manualOverride: e.target.checked })} />
                        Manual Override
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#adb5bd', fontStyle: 'italic', fontSize: 12, padding: 8 }}>Click a cell to see its properties</div>
          )
        )}

        {/* ── Column Properties ── */}
        {activeTab === 'column' && (
          selectedColumn ? (
            <div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Column Title</div>
                <input className="tb-prop-input" value={selectedColumn.title} onChange={e => updateColumn({ title: e.target.value })} />
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Width</div>
                <input className="tb-prop-input" value={selectedColumn.width === 'auto' ? '' : selectedColumn.width} placeholder="Auto" onChange={e => updateColumn({ width: e.target.value ? parseInt(e.target.value) : 'auto' })} />
              </div>
              <div className="tb-prop-group">
                <label className="tb-form-checkbox-row">
                  <input type="checkbox" checked={selectedColumn.locked} onChange={e => updateColumn({ locked: e.target.checked })} />
                  Locked
                </label>
              </div>
              <div className="tb-prop-group">
                <label className="tb-form-checkbox-row">
                  <input type="checkbox" checked={selectedColumn.hidden} onChange={e => updateColumn({ hidden: e.target.checked })} />
                  Hidden
                </label>
              </div>
            </div>
          ) : (
            <div style={{ color: '#adb5bd', fontStyle: 'italic', fontSize: 12, padding: 8 }}>Click a column header to see its properties</div>
          )
        )}

        {/* ── Row Properties ── */}
        {activeTab === 'row' && (
          selectedRow ? (
            <div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Row ID</div>
                <div style={{ fontSize: 10, color: '#adb5bd', fontFamily: 'monospace' }}>{selectedRow.id}</div>
              </div>
              {selectedRow.sectionLabel !== undefined && (
                <div className="tb-prop-group">
                  <div className="tb-prop-label">Section Label</div>
                  <input
                    className="tb-prop-input"
                    value={selectedRow.sectionLabel || ''}
                    onChange={e => {
                      const newRows = table.rows.map(r => r.id === selectedRow.id ? { ...r, sectionLabel: e.target.value } : r);
                      dispatch({ type: 'SET_TABLE', payload: { ...table, rows: newRows, updatedAt: Date.now() } });
                    }}
                  />
                </div>
              )}
              <div className="tb-prop-group">
                <div className="tb-prop-label">Row Group</div>
                <input
                  className="tb-prop-input"
                  value={selectedRow.rowGroup || ''}
                  placeholder="e.g. Demographics, Lab Values"
                  onChange={e => {
                    const newRows = table.rows.map(r => r.id === selectedRow.id ? { ...r, rowGroup: e.target.value } : r);
                    dispatch({ type: 'SET_TABLE', payload: { ...table, rows: newRows, updatedAt: Date.now() } });
                  }}
                />
              </div>
              <div className="tb-prop-group">
                <div className="tb-prop-label">Indent Level</div>
                <input
                  className="tb-prop-input"
                  type="number"
                  min={0}
                  max={5}
                  value={selectedRow.indent || 0}
                  onChange={e => {
                    const newRows = table.rows.map(r => r.id === selectedRow.id ? { ...r, indent: parseInt(e.target.value) || 0 } : r);
                    dispatch({ type: 'SET_TABLE', payload: { ...table, rows: newRows, updatedAt: Date.now() } });
                  }}
                />
              </div>
              <div className="tb-prop-group">
                <label className="tb-form-checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedRow.isSubtotal || false}
                    onChange={e => {
                      const newRows = table.rows.map(r => r.id === selectedRow.id ? { ...r, isSubtotal: e.target.checked } : r);
                      dispatch({ type: 'SET_TABLE', payload: { ...table, rows: newRows, updatedAt: Date.now() } });
                    }}
                  />
                  Subtotal Row
                </label>
              </div>
            </div>
          ) : (
            <div style={{ color: '#adb5bd', fontStyle: 'italic', fontSize: 12, padding: 8 }}>Click a row to see its properties</div>
          )
        )}

        {/* ── Table Properties ── */}
        {activeTab === 'table' && (
          <div>
            <div className="tb-prop-group">
              <div className="tb-prop-label">Title</div>
              <input className="tb-prop-input" value={table.title} onChange={e => dispatch({ type: 'SET_TABLE', payload: { ...table, title: e.target.value, updatedAt: Date.now() } })} />
            </div>
            <div className="tb-prop-group">
              <div className="tb-prop-label">Caption</div>
              <textarea className="tb-form-textarea" value={table.caption} onChange={e => dispatch({ type: 'SET_TABLE', payload: { ...table, caption: e.target.value, updatedAt: Date.now() } })} style={{ width: '100%' }} />
            </div>
            <div className="tb-prop-group">
              <div className="tb-prop-label">Table Number</div>
              <input className="tb-prop-input" value={table.tableNumber} onChange={e => dispatch({ type: 'SET_TABLE', payload: { ...table, tableNumber: e.target.value, updatedAt: Date.now() } })} placeholder="e.g. Table 1" />
            </div>
            <div className="tb-prop-group">
              <div className="tb-prop-label">Category</div>
              <input className="tb-prop-input" value={table.category} onChange={e => dispatch({ type: 'SET_TABLE', payload: { ...table, category: e.target.value, updatedAt: Date.now() } })} />
            </div>
            <div className="tb-prop-group">
              <div className="tb-prop-label">Section Target</div>
              <select className="tb-prop-select" value={table.sectionTarget} onChange={e => dispatch({ type: 'SET_TABLE', payload: { ...table, sectionTarget: e.target.value, updatedAt: Date.now() } })}>
                <option value="">None</option>
                <option value="Results">Results</option>
                <option value="Methods">Methods</option>
                <option value="Appendix">Appendix</option>
                <option value="Supplementary">Supplementary</option>
              </select>
            </div>
            <div className="tb-prop-group">
              <div className="tb-prop-label">Keywords</div>
              <input className="tb-prop-input" value={table.keywords} onChange={e => dispatch({ type: 'SET_TABLE', payload: { ...table, keywords: e.target.value, updatedAt: Date.now() } })} placeholder="e.g. demographics, baseline" />
            </div>
            <div className="tb-prop-group">
              <div className="tb-prop-label">Dimensions</div>
              <div style={{ fontSize: 11, color: '#495057' }}>
                {table.columns.length} columns × {table.rows.filter(r => !r.sectionLabel && !r.isSeparator).length} data rows
              </div>
            </div>
          </div>
        )}

        {/* ── Footnotes ── */}
        {activeTab === 'footnotes' && (
          <div>
            <div className="tb-prop-label">TABLE FOOTNOTES ({table.footnotes.length})</div>
            {table.footnotes.map(fn => (
              <div key={fn.id} style={{ marginBottom: 8, padding: 6, background: '#f8f9fa', borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <strong style={{ fontSize: 12 }}>{fn.marker}</strong>
                  <select
                    className="tb-prop-select"
                    value={fn.type}
                    style={{ flex: 1, fontSize: 10 }}
                    onChange={e => {
                      const updated = { ...table, footnotes: table.footnotes.map(f => f.id === fn.id ? { ...f, type: e.target.value as any } : f), updatedAt: Date.now() };
                      dispatch({ type: 'SET_TABLE', payload: updated });
                    }}
                  >
                    <option value="alphabetic">Alphabetic</option>
                    <option value="numeric">Numeric</option>
                    <option value="symbolic">Symbolic</option>
                    <option value="significance">Significance</option>
                    <option value="abbreviation">Abbreviation</option>
                    <option value="test-legend">Test Legend</option>
                    <option value="missing-data">Missing Data</option>
                  </select>
                </div>
                <input
                  className="tb-prop-input"
                  value={fn.text}
                  placeholder="Footnote text..."
                  onChange={e => {
                    const updated = { ...table, footnotes: table.footnotes.map(f => f.id === fn.id ? { ...f, text: e.target.value } : f), updatedAt: Date.now() };
                    dispatch({ type: 'SET_TABLE', payload: updated });
                  }}
                  style={{ fontSize: 11 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Validation ── */}
        {activeTab === 'validation' && (
          <div className="tb-validation-list">
            {state.validationResults.length === 0 ? (
              <div style={{ color: '#22c55e', fontSize: 12 }}>✓ No validation issues</div>
            ) : (
              state.validationResults.map(issue => (
                <div key={issue.id} className={`tb-validation-item ${issue.severity}`} style={{ fontSize: 11, padding: 6 }}>
                  <span className="tb-validation-icon" style={{ fontSize: 12 }}>
                    {issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
                  </span>
                  <div className="tb-validation-text">
                    <div style={{ fontWeight: 500 }}>{issue.category}</div>
                    <div style={{ color: '#495057' }}>{issue.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
