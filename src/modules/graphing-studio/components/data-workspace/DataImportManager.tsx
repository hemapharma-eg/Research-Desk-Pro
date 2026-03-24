import { useState } from 'react';
import type { PublicationDataset, DataColumn, DataRow, TableFormat } from '../../types/GraphingCoreTypes';

function parseCSVToDataset(csvText: string, name: string, format: TableFormat): PublicationDataset {
  // Auto-detect delimiter: if tabs present, use tab, otherwise comma
  const delimiter = csvText.includes('\t') ? '\t' : ',';
  const lines = csvText.trim().split('\n').map(l => l.split(delimiter));
  
  if (lines.length === 0) {
    return {
      id: crypto.randomUUID(), name, format, columns: [], rows: [],
      metadata: { createdAt: Date.now(), updatedAt: Date.now() }
    };
  }

  const headerLine = lines[0];
  const columns: DataColumn[] = headerLine.map((h, i) => ({
    id: `col-${crypto.randomUUID()}`,
    title: h.trim() || `Column ${i+1}`,
    subcolumns: 1,
    isX: i === 0 && (format === 'xy' || format === 'grouped')
  }));

  const rows: DataRow[] = lines.slice(1).filter(l => l.some(v => v.trim())).map((line) => {
    const cells: Record<string, { id: string; value: string | number | null }[]> = {};
    columns.forEach((col, cIdx) => {
      const rawVal = line[cIdx]?.trim();
      const numVal = Number(rawVal);
      const value = rawVal === '' || rawVal === undefined ? null : (!isNaN(numVal) ? numVal : rawVal);
      cells[col.id] = [{ id: crypto.randomUUID(), value }];
    });
    return { id: `row-${crypto.randomUUID()}`, cells };
  });

  return {
    id: crypto.randomUUID(), name, format, columns, rows,
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
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleImportText = () => {
    if (!inputText.trim()) return;
    const dataset = parseCSVToDataset(inputText, datasetName, format);
    onImport(dataset);
    setInputText('');
    setImportStatus(`Imported ${dataset.rows.length} rows × ${dataset.columns.length} columns`);
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleImportFile = async () => {
    try {
      const res = await window.api.importCSVFile();
      if (!res.success || res.canceled || !res.data) return;
      
      const { content, fileName } = res.data;
      const name = datasetName === 'My Dataset' ? fileName : datasetName;
      const dataset = parseCSVToDataset(content, name, format);
      onImport(dataset);
      setImportStatus(`Imported "${fileName}" — ${dataset.rows.length} rows × ${dataset.columns.length} columns`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err) {
      setImportStatus('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div>
      <div className="gs-panel-title">Import Data</div>

      {/* Format selector */}
      <div className="gs-form-group">
        <label className="gs-label">Dataset Name</label>
        <input 
          className="gs-input"
          placeholder="Dataset Name" 
          value={datasetName} 
          onChange={e => setDatasetName(e.target.value)}
        />
      </div>
      <div className="gs-form-group">
        <label className="gs-label">Table Format</label>
        <select className="gs-select" value={format} onChange={e => setFormat(e.target.value as TableFormat)}>
          <option value="column">Column Table (t-test, one-way ANOVA)</option>
          <option value="grouped">Grouped Table (two-way ANOVA)</option>
          <option value="xy">XY Table (Regression, Time course)</option>
          <option value="paired">Paired / Repeated Measures</option>
          <option value="contingency">Contingency (Chi-square)</option>
        </select>
      </div>

      {/* File Import Button */}
      <div className="gs-form-group">
        <button className="gs-btn gs-btn-primary" style={{ width: '100%' }} onClick={handleImportFile}>
          📂 Import CSV / TSV File...
        </button>
      </div>

      {/* Paste Area */}
      <div className="gs-form-group">
        <label className="gs-label">Or Paste Data</label>
        <textarea 
          className="gs-input"
          placeholder="Paste CSV or tab-separated values here..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          style={{ height: '100px', fontFamily: 'var(--font-family-mono)', fontSize: '12px', resize: 'vertical' }}
        />
      </div>

      {inputText.trim() && (
        <button className="gs-btn" style={{ width: '100%' }} onClick={handleImportText}>
          Import Pasted Data
        </button>
      )}

      {/* Status message */}
      {importStatus && (
        <div className="gs-recommendation" style={{ marginTop: '8px' }}>
          {importStatus}
        </div>
      )}
    </div>
  );
}
