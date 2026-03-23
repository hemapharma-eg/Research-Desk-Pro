import { useState } from 'react';
import type { PublicationDataset, DataColumn, DataRow, TableFormat } from '../../types/GraphingCoreTypes';

function parseCSVToDataset(csvText: string, name: string, format: TableFormat): PublicationDataset {
  const lines = csvText.trim().split('\n').map(l => l.split(/\t|,/));
  
  if (lines.length === 0) {
    return {
      id: crypto.randomUUID(),
      name,
      format,
      columns: [],
      rows: [],
      metadata: { createdAt: Date.now(), updatedAt: Date.now() }
    };
  }

  // Parse Headers
  const headerLine = lines[0];
  const columns: DataColumn[] = headerLine.map((h, i) => ({
    id: `col-${crypto.randomUUID()}`,
    title: h.trim() || `Column ${i+1}`,
    subcolumns: 1,
    isX: i === 0 && (format === 'xy' || format === 'grouped')
  }));

  // Parse Rows
  const rows: DataRow[] = lines.slice(1).map((line, rowIndex) => {
    const rowId = `row-${crypto.randomUUID()}`;
    const cells: Record<string, { id: string; value: string | number | null }[]> = {};
    
    columns.forEach((col, cIdx) => {
      const rawVal = line[cIdx]?.trim();
      const numVal = Number(rawVal);
      const value = rawVal === '' || rawVal === undefined ? null : (!isNaN(numVal) ? numVal : rawVal);
      cells[col.id] = [{ id: crypto.randomUUID(), value }];
    });

    return {
      id: rowId,
      rowName: format === 'grouped' ? line[0]?.trim() : `Row ${rowIndex + 1}`,
      cells
    };
  });

  return {
    id: crypto.randomUUID(),
    name,
    format,
    columns,
    rows,
    metadata: { createdAt: Date.now(), updatedAt: Date.now() }
  };
}

interface DataImportManagerProps {
  onImport: (dataset: PublicationDataset) => void;
}

export function DataImportManager({ onImport }: DataImportManagerProps) {
  const [inputText, setInputText] = useState('');
  const [format, setFormat] = useState<TableFormat>('column');
  const [datasetName, setDatasetName] = useState('My Dataset');

  const handleImport = () => {
    if (!inputText.trim()) return;
    const dataset = parseCSVToDataset(inputText, datasetName, format);
    onImport(dataset);
    setInputText('');
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Import Data</h3>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input 
          placeholder="Dataset Name" 
          value={datasetName} 
          onChange={e => setDatasetName(e.target.value)}
          style={{ padding: '8px', flex: 1, border: '1px solid #CBD5E1', borderRadius: '4px' }}
        />
        <select 
          value={format} 
          onChange={e => setFormat(e.target.value as TableFormat)}
          style={{ padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
        >
          <option value="column">Column Table (t-test, one-way ANOVA)</option>
          <option value="grouped">Grouped Table (two-way ANOVA)</option>
          <option value="xy">XY Table (Regression, Time course)</option>
          <option value="contingency">Contingency (Chi-square)</option>
        </select>
      </div>

      <textarea 
        placeholder="Paste CSV or Tab-separated values here..." 
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        style={{ width: '100%', height: '120px', padding: '10px', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: '4px', resize: 'vertical' }}
      />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button 
          onClick={handleImport}
          style={{ padding: '8px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Import Dataset
        </button>
      </div>
    </div>
  );
}
