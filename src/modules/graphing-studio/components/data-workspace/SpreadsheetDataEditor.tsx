import type { PublicationDataset } from '../../types/GraphingCoreTypes';

interface SpreadsheetDataEditorProps {
  dataset: PublicationDataset;
  onChange: (dataset: PublicationDataset) => void;
}

export function SpreadsheetDataEditor({ dataset, onChange }: SpreadsheetDataEditorProps) {
  
  const handleCellChange = (rowId: string, colId: string, value: string, subcolIndex: number = 0) => {
    const numVal = Number(value);
    const finalVal = value === '' ? null : (!isNaN(numVal) ? numVal : value);
    
    const newRows = dataset.rows.map(r => {
      if (r.id === rowId) {
        const cellArray = [...(r.cells[colId] || [])];
        // fill array if empty
        while (cellArray.length <= subcolIndex) {
          cellArray.push({ id: crypto.randomUUID(), value: null });
        }
        cellArray[subcolIndex] = { ...cellArray[subcolIndex], value: finalVal };
        
        return {
          ...r,
          cells: {
            ...r.cells,
            [colId]: cellArray
          }
        };
      }
      return r;
    });
    
    onChange({ ...dataset, rows: newRows });
  };

  const handleRowNameChange = (rowId: string, value: string) => {
    const newRows = dataset.rows.map(r => r.id === rowId ? { ...r, rowName: value } : r);
    onChange({ ...dataset, rows: newRows });
  };

  const addRow = () => {
    const newRowId = `row-${crypto.randomUUID()}`;
    onChange({
      ...dataset,
      rows: [...dataset.rows, { id: newRowId, rowName: `Row ${dataset.rows.length + 1}`, cells: {} }]
    });
  };

  const addColumn = () => {
    const newColId = `col-${crypto.randomUUID()}`;
    onChange({
      ...dataset,
      columns: [...dataset.columns, { id: newColId, title: `Group ${dataset.columns.length + 1}`, subcolumns: 1 }]
    });
  };

  const handleColumnTitleChange = (colId: string, newTitle: string) => {
    const newCols = dataset.columns.map(c => c.id === colId ? { ...c, title: newTitle } : c);
    onChange({ ...dataset, columns: newCols });
  };

  const hasRowNames = dataset.format === 'grouped' || dataset.format === 'contingency' || dataset.format === 'survival';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0F172A', marginRight: '16px' }}>{dataset.name} ({dataset.format})</h3>
        <button onClick={addRow} style={{ padding: '4px 8px', fontSize: '12px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer' }}>+ Add Row</button>
        <button onClick={addColumn} style={{ padding: '4px 8px', fontSize: '12px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer' }}>+ Add Column</button>
      </div>

      {/* Grid container */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F1F5F9', boxShadow: '0 1px 0 #CBD5E1' }}>
            <tr>
              <th style={{ width: '40px', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', background: '#E2E8F0' }}></th>
              {hasRowNames && (
                 <th style={{ minWidth: '100px', padding: '4px 8px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', fontSize: '12px', color: '#475569' }}>
                    Title
                 </th>
              )}
              {dataset.columns.map(col => (
                <th key={col.id} colSpan={col.subcolumns} style={{ minWidth: '100px', padding: '4px 0', textAlign: 'center', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
                  <input 
                    value={col.title} 
                    onChange={e => handleColumnTitleChange(col.id, e.target.value)}
                    style={{ background: 'transparent', border: 'none', fontWeight: 'bold', textAlign: 'center', fontSize: '12px', color: '#0F172A', width: '100%', outline: 'none' }}
                  />
                </th>
              ))}
            </tr>
            {/* Subcolumn headers row if any max subcolumns > 1 */}
            {dataset.columns.some(c => c.subcolumns > 1) && (
              <tr>
                <th style={{ borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', background: '#E2E8F0' }}></th>
                {hasRowNames && <th style={{ borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', background: '#F8FAFC' }}></th>}
                {dataset.columns.map(col => (
                   Array.from({ length: col.subcolumns }).map((_, i) => (
                      <th key={`${col.id}-sub-${i}`} style={{ minWidth: '80px', padding: '2px 4px', fontSize: '11px', color: '#64748B', fontWeight: 'normal', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', textAlign: 'center', background: '#F8FAFC' }}>
                        {col.subcolumnHeaders?.[i] || `Y${i+1}`}
                      </th>
                   ))
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {dataset.rows.map((row, rIdx) => (
              <tr key={row.id}>
                <td style={{ textAlign: 'center', color: '#94A3B8', fontSize: '11px', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #E2E8F0', padding: '4px', background: '#F8FAFC' }}>
                  {rIdx + 1}
                </td>
                
                {hasRowNames && (
                  <td style={{ borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #E2E8F0', padding: 0 }}>
                    <input 
                      value={row.rowName || ''}
                      onChange={e => handleRowNameChange(row.id, e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '6px 8px', fontSize: '13px', outline: 'none', background: 'transparent' }}
                      placeholder={`Row ${rIdx + 1}`}
                    />
                  </td>
                )}

                {dataset.columns.map(col => (
                  Array.from({ length: col.subcolumns }).map((_, subIdx) => {
                    const cellVal = row.cells[col.id]?.[subIdx]?.value;
                    const displayVal = cellVal === null || cellVal === undefined ? '' : String(cellVal);
                    return (
                      <td key={`${row.id}-${col.id}-${subIdx}`} style={{ borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #E2E8F0', padding: 0 }}>
                        <input
                          type="text"
                          value={displayVal}
                          onChange={e => handleCellChange(row.id, col.id, e.target.value, subIdx)}
                          style={{ width: '100%', border: 'none', padding: '6px 8px', fontSize: '13px', textAlign: 'right', outline: 'none', background: 'transparent', color: displayVal && isNaN(Number(displayVal)) && col.isX !== true ? '#EF4444' : '#0F172A' }}
                        />
                      </td>
                    );
                  })
                ))}
              </tr>
            ))}
            
            {/* Empty spacer row for better scrolling */}
            <tr>
              <td style={{ padding: '24px' }} colSpan={dataset.columns.length + (hasRowNames ? 2 : 1)}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
