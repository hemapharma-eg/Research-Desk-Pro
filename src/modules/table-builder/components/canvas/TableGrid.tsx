import React, { useRef, useState } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import type { TBCell } from '../../types/TableBuilderTypes';
import { CellEditor } from './CellEditor';
import { formatValue } from '../../utils/DerivedCellEngine';

export const TableGrid: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const { table, selectedColId, selectedRowId, selectedCellId, settings } = state;

  const [editingCell, setEditingCell] = useState<{ rowId: string, colId: string, cell: TBCell, elem: HTMLElement } | null>(null);

  if (!table) return <div className="p-8 text-center text-gray-400">No table loaded.</div>;

  const handleCellClick = (e: React.MouseEvent<HTMLTableCellElement>, rowId: string, colId: string, cell: TBCell) => {
    dispatch({ type: 'SET_SELECTED_CELL', payload: cell.id });
    dispatch({ type: 'SET_SELECTED_COL', payload: colId });
    dispatch({ type: 'SET_SELECTED_ROW', payload: rowId });
  };

  const handleCellDoubleClick = (e: React.MouseEvent<HTMLTableCellElement>, rowId: string, colId: string, cell: TBCell) => {
    setEditingCell({ rowId, colId, cell, elem: e.currentTarget });
  };

  const handleEditorSave = (displayValue: string, rawValue: string | number | null) => {
    if (editingCell) {
      dispatch({
        type: 'UPDATE_CELL',
        payload: {
          rowId: editingCell.rowId,
          colId: editingCell.colId,
          cell: { displayValue, rawValue, manualOverride: true }
        }
      });
    }
    setEditingCell(null);
  };

  const handleEditorCancel = () => setEditingCell(null);

  // Computed styles based on table.styleOptions
  const { styleOptions } = table;
  const gridStyle: React.CSSProperties = {
    fontFamily: styleOptions.fontFamily,
    fontSize: `${styleOptions.fontSize}px`,
    lineHeight: styleOptions.lineSpacing,
    borderCollapse: 'collapse',
    width: '100%',
    backgroundColor: 'var(--color-bg-surface)',
  };

  const cellPadding = `${styleOptions.cellPadding}px`;

  return (
    <div style={{ padding: '24px', overflow: 'auto', flex: 1, backgroundColor: 'var(--color-bg-hover)' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-md)' }}>
        
        {table.title && <h2 style={{ marginBottom: '8px', fontSize: '1.2em', fontWeight: 'bold' }}>{table.tableNumber ? `${table.tableNumber}. ` : ''}{table.title}</h2>}
        {table.caption && <p style={{ marginBottom: '16px', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>{table.caption}</p>}
        
        <div style={{ position: 'relative' }}>
          <table style={gridStyle}>
            <thead>
              {/* Optional: Grouped Headers rendering would go here */}
              <tr>
                {table.columns.map(col => (
                  <th
                    key={col.id}
                    onClick={() => dispatch({ type: 'SET_SELECTED_COL', payload: col.id })}
                    style={{
                      padding: cellPadding,
                      textAlign: 'left',
                      fontWeight: styleOptions.headerStyle.bold ? 'bold' : 'normal',
                      backgroundColor: styleOptions.headerStyle.bgColor || 'transparent',
                      borderBottom: styleOptions.headerStyle.borderBottom ? '2px solid black' : '1px solid #ddd',
                      borderTop: styleOptions.borderStyle === 'top-bottom-only' || styleOptions.borderStyle === 'full-grid' ? '2px solid black' : 'none',
                      borderRight: styleOptions.borderStyle === 'full-grid' ? '1px solid #ddd' : 'none',
                      borderLeft: styleOptions.borderStyle === 'full-grid' ? '1px solid #ddd' : 'none',
                      textTransform: styleOptions.headerStyle.uppercase ? 'uppercase' : 'none',
                      cursor: 'pointer',
                      outline: selectedColId === col.id && !selectedCellId ? '2px solid var(--color-accent-primary)' : 'none',
                    }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => {
                const isLastRow = rowIndex === table.rows.length - 1;
                return (
                  <React.Fragment key={row.id}>
                    {row.sectionLabel && (
                      <tr onClick={() => dispatch({ type: 'SET_SELECTED_ROW', payload: row.id })}>
                        <td colSpan={table.columns.length} style={{
                          padding: cellPadding,
                          fontWeight: styleOptions.sectionRowEmphasis ? 'bold' : 'normal',
                          backgroundColor: styleOptions.rowStriping && rowIndex % 2 === 1 ? '#f9f9f9' : 'transparent',
                        }}>
                          {row.sectionLabel}
                        </td>
                      </tr>
                    )}
                    {row.isSeparator && (
                      <tr><td colSpan={table.columns.length} style={{ height: '16px' }}></td></tr>
                    )}
                    {!row.sectionLabel && !row.isSeparator && (
                      <tr onClick={(e) => {
                        // Let cell click handle cell selection. If click on gap, select row
                        if ((e.target as HTMLElement).tagName !== 'TD') {
                          dispatch({ type: 'SET_SELECTED_ROW', payload: row.id });
                        }
                      }}>
                        {table.columns.map((col, colIndex) => {
                          const cell = row.cells[col.id] || { id: `empty-${row.id}-${col.id}`, rawValue: null, displayValue: '', formatType: 'text', numericPrecision: 2, sourceBinding: null, manualOverride: false, noteMarkers: [], validationFlags: [], formatting: {} as any };
                          const isSelected = selectedCellId === cell.id;
                          const fmt = cell.formatting || (col.defaultFormat || {});
                          
                          // Format display value
                          const display = cell.manualOverride || !cell.sourceBinding 
                            ? cell.displayValue 
                            : formatValue(cell.rawValue, cell.formatType, cell.numericPrecision);

                          return (
                            <td
                              key={col.id}
                              onClick={(e) => handleCellClick(e, row.id, col.id, cell)}
                              onDoubleClick={(e) => handleCellDoubleClick(e, row.id, col.id, cell)}
                              style={{
                                padding: cellPadding,
                                textAlign: fmt.alignH || (colIndex > 0 ? styleOptions.numericAlignment : 'left') as any,
                                verticalAlign: fmt.alignV || 'middle',
                                fontWeight: (colIndex === 0 && styleOptions.boldFirstColumn) || fmt.bold ? 'bold' : 'normal',
                                fontStyle: fmt.italic ? 'italic' : 'normal',
                                textDecoration: fmt.underline ? 'underline' : 'none',
                                backgroundColor: fmt.bgColor || (styleOptions.rowStriping && rowIndex % 2 === 1 ? '#f9f9f9' : 'transparent'),
                                borderBottom: isLastRow && (styleOptions.borderStyle === 'top-bottom-only' || styleOptions.borderStyle === 'full-grid') ? '2px solid black' : (styleOptions.borderStyle === 'full-grid' || styleOptions.borderStyle === 'horizontal-only' ? '1px solid #eee' : 'none'),
                                borderRight: styleOptions.borderStyle === 'full-grid' ? '1px solid #eee' : 'none',
                                borderLeft: styleOptions.borderStyle === 'full-grid' ? '1px solid #eee' : 'none',
                                cursor: 'cell',
                                paddingLeft: Number(fmt.indent || 0) * 16 + parseInt(cellPadding) + 'px',
                                position: 'relative',
                                outline: isSelected ? '2px solid var(--color-accent-primary)' : 'none',
                                outlineOffset: '-2px',
                                zIndex: isSelected ? 10 : 1
                              }}
                            >
                              {cell.sourceBinding && !cell.manualOverride && (
                                <div style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--color-primary-500)' }} title="Linked to Source" />
                              )}
                              {cell.manualOverride && cell.sourceBinding && (
                                <div style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--color-warning-500)' }} title="Manual Override" />
                              )}
                              
                              {fmt.prefix}{display}{fmt.suffix}{fmt.unit ? ` ${fmt.unit}` : ''}
                              
                              {cell.noteMarkers?.length > 0 && (
                                <sup>{cell.noteMarkers.join(',')}</sup>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {editingCell && (
            <CellEditor
              cell={editingCell.cell}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              style={{
                top: editingCell.elem.offsetTop,
                left: editingCell.elem.offsetLeft,
                width: editingCell.elem.offsetWidth,
                height: editingCell.elem.offsetHeight,
              }}
            />
          )}
        </div>

      </div>
    </div>
  );
};
