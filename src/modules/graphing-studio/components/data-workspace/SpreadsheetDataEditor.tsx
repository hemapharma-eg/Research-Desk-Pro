import { useState, useCallback } from 'react';
import type { PublicationDataset, DataColumn, DataRow } from '../../types/GraphingCoreTypes';

interface SpreadsheetDataEditorProps {
  dataset: PublicationDataset;
  onChange: (dataset: PublicationDataset) => void;
}

export function SpreadsheetDataEditor({ dataset, onChange }: SpreadsheetDataEditorProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'col' | 'row'; index: number } | null>(null);
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dropColIdx, setDropColIdx] = useState<number | null>(null);
  const columns = dataset.columns;
  const rows = dataset.rows;

  const reorderColumns = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const newCols = [...columns];
    const [moved] = newCols.splice(fromIdx, 1);
    newCols.splice(toIdx, 0, moved);
    onChange({ ...dataset, columns: newCols });
  }, [columns, dataset, onChange]);

  const updateCell = useCallback((rowIdx: number, colId: string, value: string) => {
    const newRows = [...rows];
    const newRow = { ...newRows[rowIdx], cells: { ...newRows[rowIdx].cells } };
    const numVal = value === '' ? null : Number(value);
    const cellVal = value === '' ? null : (isNaN(numVal!) ? value : numVal);
    newRow.cells[colId] = [{ id: newRow.cells[colId]?.[0]?.id || crypto.randomUUID(), value: cellVal }];
    newRows[rowIdx] = newRow;
    onChange({ ...dataset, rows: newRows });
  }, [rows, dataset, onChange]);

  const updateHeader = useCallback((colIdx: number, title: string) => {
    const newCols = [...columns];
    newCols[colIdx] = { ...newCols[colIdx], title };
    onChange({ ...dataset, columns: newCols });
  }, [columns, dataset, onChange]);

  const addColumn = () => {
    const newCol: DataColumn = { id: `col-${crypto.randomUUID()}`, title: `Group ${columns.length + 1}`, subcolumns: 1 };
    const newCols = [...columns, newCol];
    const newRows = rows.map(r => ({
      ...r,
      cells: { ...r.cells, [newCol.id]: [{ id: crypto.randomUUID(), value: null }] },
    }));
    onChange({ ...dataset, columns: newCols, rows: newRows });
  };

  const addRow = () => {
    const newRow: DataRow = {
      id: `row-${crypto.randomUUID()}`,
      cells: Object.fromEntries(columns.map(c => [c.id, [{ id: crypto.randomUUID(), value: null }]])),
    };
    onChange({ ...dataset, rows: [...rows, newRow] });
  };

  const deleteColumn = (idx: number) => {
    if (columns.length <= 1) return;
    const colId = columns[idx].id;
    const newCols = columns.filter((_, i) => i !== idx);
    const newRows = rows.map(r => {
      const cells = { ...r.cells };
      delete cells[colId];
      return { ...r, cells };
    });
    onChange({ ...dataset, columns: newCols, rows: newRows });
  };

  const deleteRow = (idx: number) => {
    if (rows.length <= 1) return;
    onChange({ ...dataset, rows: rows.filter((_, i) => i !== idx) });
  };

  const sortColumn = (colId: string, ascending: boolean) => {
    const sorted = [...rows].sort((a, b) => {
      const va = a.cells[colId]?.[0]?.value;
      const vb = b.cells[colId]?.[0]?.value;
      const na = typeof va === 'number' ? va : Number(va);
      const nb = typeof vb === 'number' ? vb : Number(vb);
      if (isNaN(na) && isNaN(nb)) return 0;
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return ascending ? na - nb : nb - na;
    });
    onChange({ ...dataset, rows: sorted });
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'col' | 'row', index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, index });
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    const pastedRows = text.split('\n').map(line => line.split('\t'));
    if (pastedRows.length === 0) return;

    // Get focused cell position from the active element
    const target = e.target as HTMLInputElement;
    const rowIdx = parseInt(target.dataset.row || '0');
    const colIdx = parseInt(target.dataset.col || '0');

    // Expand columns and rows as needed
    let newCols = [...columns];
    let newRows = [...rows];

    const neededCols = colIdx + pastedRows[0].length;
    while (newCols.length < neededCols) {
      const col: DataColumn = { id: `col-${crypto.randomUUID()}`, title: `Group ${newCols.length + 1}`, subcolumns: 1 };
      newCols.push(col);
      newRows = newRows.map(r => ({ ...r, cells: { ...r.cells, [col.id]: [{ id: crypto.randomUUID(), value: null }] } }));
    }

    const neededRows = rowIdx + pastedRows.length;
    while (newRows.length < neededRows) {
      newRows.push({
        id: `row-${crypto.randomUUID()}`,
        cells: Object.fromEntries(newCols.map(c => [c.id, [{ id: crypto.randomUUID(), value: null }]])),
      });
    }

    pastedRows.forEach((pRow, ri) => {
      pRow.forEach((val, ci) => {
        const r = rowIdx + ri;
        const c = colIdx + ci;
        if (r < newRows.length && c < newCols.length) {
          const colId = newCols[c].id;
          const numVal = val.trim() === '' ? null : Number(val.trim());
          const cellVal = val.trim() === '' ? null : (isNaN(numVal!) ? val.trim() : numVal);
          newRows[r] = {
            ...newRows[r],
            cells: { ...newRows[r].cells, [colId]: [{ id: newRows[r].cells[colId]?.[0]?.id || crypto.randomUUID(), value: cellVal }] },
          };
        }
      });
    });

    e.preventDefault();
    onChange({ ...dataset, columns: newCols, rows: newRows });
  }, [columns, rows, dataset, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} onPaste={handlePaste}>
      {/* Toolbar */}
      <div className="gs-spreadsheet-toolbar">
        <span className="gs-dataset-name">{dataset.name}</span>
        <span className="gs-format-badge">{dataset.format}</span>
        <button className="gs-btn gs-btn-sm" onClick={addColumn}>+ Column</button>
        <button className="gs-btn gs-btn-sm" onClick={addRow}>+ Row</button>
      </div>

      {/* Table */}
      <div className="gs-spreadsheet">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              {columns.map((col, ci) => (
                <th
                  key={col.id}
                  onContextMenu={e => handleContextMenu(e, 'col', ci)}
                  style={{
                    minWidth: '120px',
                    cursor: 'grab',
                    borderLeft: dropColIdx === ci ? '3px solid var(--color-accent-primary)' : undefined,
                    opacity: dragColIdx === ci ? 0.5 : 1,
                  }}
                  draggable
                  onDragStart={() => setDragColIdx(ci)}
                  onDragOver={e => { e.preventDefault(); setDropColIdx(ci); }}
                  onDragLeave={() => setDropColIdx(null)}
                  onDrop={() => {
                    if (dragColIdx !== null) reorderColumns(dragColIdx, ci);
                    setDragColIdx(null);
                    setDropColIdx(null);
                  }}
                  onDragEnd={() => { setDragColIdx(null); setDropColIdx(null); }}
                >
                  <input
                    className="gs-header-input"
                    value={col.title}
                    onChange={e => updateHeader(ci, e.target.value)}
                    style={{ width: '100%', textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '12px', outline: 'none' }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.id}>
                <td
                  className="gs-row-num"
                  onContextMenu={e => handleContextMenu(e, 'row', ri)}
                >
                  {ri + 1}
                </td>
                {columns.map((col, ci) => {
                  const cellGroup = row.cells[col.id];
                  const cellVal = cellGroup?.[0]?.value;
                  const displayVal = cellVal === null || cellVal === undefined ? '' : String(cellVal);
                  const isNum = cellVal !== null && cellVal !== undefined && !isNaN(Number(cellVal));
                  return (
                    <td key={col.id}>
                      <input
                        value={displayVal}
                        onChange={e => updateCell(ri, col.id, e.target.value)}
                        className={!isNum && displayVal !== '' ? 'gs-invalid' : ''}
                        data-row={ri}
                        data-col={ci}
                        style={{ textAlign: isNum ? 'right' : 'left' }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: 'white',
              border: '1px solid var(--color-border-strong)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1001,
              padding: '4px 0',
              minWidth: '160px',
            }}
          >
            {contextMenu.type === 'col' ? (
              <>
                <ContextMenuItem label="Sort A → Z" onClick={() => { sortColumn(columns[contextMenu.index].id, true); setContextMenu(null); }} />
                <ContextMenuItem label="Sort Z → A" onClick={() => { sortColumn(columns[contextMenu.index].id, false); setContextMenu(null); }} />
                <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '4px 0' }} />
                <ContextMenuItem label="Insert column left" onClick={() => {
                  const newCol: DataColumn = { id: `col-${crypto.randomUUID()}`, title: `Group ${columns.length + 1}`, subcolumns: 1 };
                  const newCols = [...columns]; newCols.splice(contextMenu.index, 0, newCol);
                  const newRows = rows.map(r => ({ ...r, cells: { ...r.cells, [newCol.id]: [{ id: crypto.randomUUID(), value: null }] } }));
                  onChange({ ...dataset, columns: newCols, rows: newRows }); setContextMenu(null);
                }} />
                <ContextMenuItem label="Delete column" danger onClick={() => { deleteColumn(contextMenu.index); setContextMenu(null); }} />
              </>
            ) : (
              <>
                <ContextMenuItem label="Insert row above" onClick={() => {
                  const newRow: DataRow = { id: `row-${crypto.randomUUID()}`, cells: Object.fromEntries(columns.map(c => [c.id, [{ id: crypto.randomUUID(), value: null }]])) };
                  const newRows = [...rows]; newRows.splice(contextMenu.index, 0, newRow);
                  onChange({ ...dataset, rows: newRows }); setContextMenu(null);
                }} />
                <ContextMenuItem label="Insert row below" onClick={() => {
                  const newRow: DataRow = { id: `row-${crypto.randomUUID()}`, cells: Object.fromEntries(columns.map(c => [c.id, [{ id: crypto.randomUUID(), value: null }]])) };
                  const newRows = [...rows]; newRows.splice(contextMenu.index + 1, 0, newRow);
                  onChange({ ...dataset, rows: newRows }); setContextMenu(null);
                }} />
                <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '4px 0' }} />
                <ContextMenuItem label="Delete row" danger onClick={() => { deleteRow(contextMenu.index); setContextMenu(null); }} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ContextMenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: '6px 14px', textAlign: 'left', fontSize: '13px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: danger ? 'var(--color-danger)' : 'var(--color-text-primary)',
      }}
      onMouseOver={e => (e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--color-bg-hover)')}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );
}
