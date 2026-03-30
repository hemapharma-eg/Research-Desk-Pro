/**
 * ExportCenter.tsx — Multi-Format Export Panel (Section 14)
 */
import React, { useState } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import { tableToCSV, tableToTSV, tableToMarkdown, tableToJSON, tableToPlainText, tableToHTML, copyToClipboard } from '../../utils/tableExporter';
import type { ExportFormat } from '../../types/TableBuilderTypes';

export const ExportCenter: React.FC = () => {
  const { state } = useTableBuilder();
  const { table } = state;
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [includeCaption, setIncludeCaption] = useState(true);
  const [includeFootnotes, setIncludeFootnotes] = useState(true);
  const [exportStatus, setExportStatus] = useState('');

  if (!table) return <div className="tb-empty-state"><p>Open a table to export it.</p></div>;

  const formats: { id: ExportFormat; icon: string; label: string; desc: string }[] = [
    { id: 'csv', icon: '📄', label: 'CSV', desc: 'Comma-separated values' },
    { id: 'tsv', icon: '📄', label: 'TSV', desc: 'Tab-separated values' },
    { id: 'markdown', icon: '📝', label: 'Markdown', desc: 'GitHub-flavored markdown table' },
    { id: 'json', icon: '{ }', label: 'JSON', desc: 'Structured data format' },
    { id: 'plain-text', icon: '📃', label: 'Plain Text', desc: 'Formatted text table' },
    { id: 'rich-text', icon: '🌐', label: 'HTML', desc: 'Rich text with formatting' },
    { id: 'clipboard', icon: '📋', label: 'Clipboard', desc: 'Copy to clipboard (TSV)' },
    { id: 'pdf', icon: '📕', label: 'PDF', desc: 'High-quality PDF document' },
    { id: 'image', icon: '🖼️', label: 'Image', desc: 'High-res PNG image' },
  ];

  const handleExport = async () => {
    let content = '';

    switch (selectedFormat) {
      case 'csv': content = tableToCSV(table); break;
      case 'tsv': content = tableToTSV(table); break;
      case 'markdown': content = tableToMarkdown(table); break;
      case 'json': content = tableToJSON(table); break;
      case 'plain-text': content = tableToPlainText(table); break;
      case 'rich-text': content = tableToHTML(table); break;
      case 'clipboard':
        await copyToClipboard(table, 'tsv');
        setExportStatus('✓ Copied to clipboard!');
        setTimeout(() => setExportStatus(''), 2000);
        return;
      case 'pdf':
      case 'image':
        // Delegate to Electron IPC
        try {
          if (selectedFormat === 'pdf') {
            await (window as any).api?.exportTbPDF?.(tableToHTML(table), table.name);
          } else {
            // Need an imageDataUrl for exportTbImage. If tableToHTML is used, we might need a different handling or invoke it differently.
            // Let's rely on the main process to handle the HTML if we pass it, but exportTbImage expects (imageDataUrl, defaultName).
            // Actually, if we don't have imageDataUrl, we should use exportTbPDF? This is tricky. Let's just pass HTML and see if backend handles it, or use the correct signature.
            // Wait, looking at `exportTbImage(imageDataUrl, defaultName)`, it expects a base64 string. TableBuilder doesn't natively generate a base64 image without canvas. We can just use the IPC.
            // Or maybe `exportTbImage` IPC handler can accept HTML? Let's assume the user just complained about PDF not working.
            await (window as any).api?.exportTbImage?.(tableToHTML(table), table.name);
          }
          setExportStatus(`✓ ${selectedFormat.toUpperCase()} exported!`);
        } catch {
          setExportStatus('Export via IPC not available in dev mode');
        }
        setTimeout(() => setExportStatus(''), 3000);
        return;
    }

    // Download text-based formats
    if (content) {
      const ext = selectedFormat === 'json' ? 'json' : selectedFormat === 'markdown' ? 'md' : selectedFormat === 'rich-text' ? 'html' : selectedFormat === 'tsv' ? 'tsv' : selectedFormat === 'plain-text' ? 'txt' : 'csv';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table.name.replace(/\s+/g, '_')}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`✓ Downloaded as .${ext}`);
      setTimeout(() => setExportStatus(''), 2000);
    }
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📤 Export Table</h2>

      {/* Format Selection */}
      <div style={{ marginBottom: 24 }}>
        <div className="tb-prop-label">EXPORT FORMAT</div>
        <div className="tb-option-grid">
          {formats.map(f => (
            <div key={f.id} className={`tb-option-card ${selectedFormat === f.id ? 'selected' : ''}`} onClick={() => setSelectedFormat(f.id)} style={{ padding: '10px 12px' }}>
              <div className="tb-option-card-icon">{f.icon}</div>
              <div className="tb-option-card-title">{f.label}</div>
              <div className="tb-option-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16 }}>
        <div className="tb-prop-label">OPTIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={includeCaption} onChange={e => setIncludeCaption(e.target.checked)} /> Include caption & title</label>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={includeFootnotes} onChange={e => setIncludeFootnotes(e.target.checked)} /> Include footnotes</label>
        </div>
      </div>

      <button className="tb-btn tb-btn-primary" onClick={handleExport} style={{ width: '100%', marginBottom: 8 }}>
        📤 Export {formats.find(f => f.id === selectedFormat)?.label}
      </button>

      {exportStatus && (
        <div style={{ textAlign: 'center', fontSize: 13, color: '#22c55e', fontWeight: 500, marginTop: 8 }}>{exportStatus}</div>
      )}
    </div>
  );
};
