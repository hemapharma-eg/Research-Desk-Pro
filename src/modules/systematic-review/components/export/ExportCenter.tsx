import { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import type { ReviewRecord } from '../../types/ReviewModels';

export function ExportCenter() {
  const { state, logEvent } = useSystematicReview();
  const [exportFormat, setExportFormat] = useState('csv');
  const [datasetMode, setDatasetMode] = useState('included');

  const methodsText = `
### Methods: Local Systematic Review Architecture

This systematic review was conducted utilizing a locally hosted, deterministic Systematic Review Accelerator module designed to ensure strict reproducibility and security without relying on external generative artificial intelligence (LLM) APIs.

**Search & Import:** A total of ${state.records.length} records were imported across designated database sources.
**Deduplication:** Duplicates were identified using a deterministic rules engine prioritizing exact DOI and PMID alignments, followed by high-confidence fuzzy matching heuristics comparing normalized title, year, and primary author arrays. ${state.clusters?.length || 0} duplicate clusters were detected and consolidated.
**Screening Process:** Title and abstract screening was conducted using a dedicated reading environment. A smart assistance layer augmented the screening process strictly through deterministic dictionaries, evaluating predefined textual queries mapped to the study's PICO framework (${state.project?.pico?.p || 'N/A'}, ${state.project?.pico?.i || 'N/A'}, ${state.project?.pico?.c || 'N/A'}, ${state.project?.pico?.o || 'N/A'}).
**Full-Text Review and Conflict Adjudication:** Full-text documents were retrieved and examined against ${state.project?.exclusionReasons?.length || 0} predefined, structured exclusion reasons. Disagreements between independent reviewers were resolved through a blinded Adjudicator override interface within the platform workspace.
  `.trim();

  const escapeCSV = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return `"${s}"`;
  };

  const generateCSV = (records: ReviewRecord[]) => {
    const headers = ['ID', 'Title', 'Authors', 'Year', 'Journal', 'DOI', 'Stage', 'Screening Decision', 'Exclusion Reason'];
    const rows = records.map(r => [
      r.id,
      r.title,
      r.authors,
      r.year || '',
      r.journal || '',
      r.doi || '',
      r.stage,
      r.finalDisposition || 'pending',
      r.finalReasonId && state.project?.exclusionReasons ? state.project.exclusionReasons.find(ex => ex.id === r.finalReasonId)?.label : ''
    ]);
    
    return [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');
  };

  const generateRIS = (records: ReviewRecord[]) => {
    return records.map(r => {
      let ris = `TY  - JOUR\n`;
      if (r.title) ris += `TI  - ${r.title}\n`;
      if (r.authors) {
        const auths = r.authors.split(';');
        auths.forEach(a => { ris += `AU  - ${a.trim()}\n`; });
      }
      if (r.year) ris += `PY  - ${r.year}\n`;
      if (r.journal) ris += `JO  - ${r.journal}\n`;
      if (r.volume) ris += `VL  - ${r.volume}\n`;
      if (r.issue) ris += `IS  - ${r.issue}\n`;
      if (r.pages) ris += `SP  - ${r.pages}\n`;
      if (r.doi) ris += `DO  - ${r.doi}\n`;
      if (r.abstract) ris += `AB  - ${r.abstract}\n`;
      ris += `ER  - \n`;
      return ris;
    }).join('\n');
  };

  const generateBibTeX = (records: ReviewRecord[]) => {
    return records.map(r => {
      const citeKey = `${(r.authors ? r.authors.split(',')[0].trim().split(' ')[0] : 'Anon')}${r.year || ''}`.replace(/[^a-zA-Z0-9]/g, '');
      let bib = `@article{${citeKey || r.id},\n`;
      if (r.title) bib += `  title={${r.title}},\n`;
      if (r.authors) bib += `  author={${r.authors.replace(/;/g, ' and ')}},\n`;
      if (r.journal) bib += `  journal={${r.journal}},\n`;
      if (r.year) bib += `  year={${r.year}},\n`;
      if (r.volume) bib += `  volume={${r.volume}},\n`;
      if (r.issue) bib += `  number={${r.issue}},\n`;
      if (r.pages) bib += `  pages={${r.pages}},\n`;
      if (r.doi) bib += `  doi={${r.doi}}\n`;
      bib += `}\n`;
      return bib;
    }).join('\n');
  };

  const handleExport = () => {
    // 1. Filter dataset
    let targetRecords = state.records;
    if (datasetMode === 'included') {
      targetRecords = state.records.filter(r => r.finalDisposition === 'included');
    } else if (datasetMode === 'excluded') {
      targetRecords = state.records.filter(r => r.stage === 'excluded');
    }

    if (targetRecords.length === 0) {
      alert('Selected dataset is empty. Nothing to export.');
      return;
    }

    // 2. Generate string payload
    let payload = '';
    let mimeType = 'text/plain';
    let fileExtension = 'txt';

    try {
      if (exportFormat === 'csv') {
        payload = generateCSV(targetRecords);
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
      } else if (exportFormat === 'excel') {
        // Excel relies on CSV with BOM for simple ingestion
        payload = '\uFEFF' + generateCSV(targetRecords);
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
      } else if (exportFormat === 'ris') {
        payload = generateRIS(targetRecords);
        mimeType = 'application/x-research-info-systems;charset=utf-8;';
        fileExtension = 'ris';
      } else if (exportFormat === 'bibtex') {
        payload = generateBibTeX(targetRecords);
        mimeType = 'application/x-bibtex;charset=utf-8;';
        fileExtension = 'bib';
      }

      // 3. Trigger download sequence
      const blob = new Blob([payload], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Systematic_Review_Export_${datasetMode}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logEvent('export_generated', 'reporting', state.project?.id, `Exported ${targetRecords.length} records as ${exportFormat.toUpperCase()}`);
      
    } catch (err) {
      console.error('Export Failed:', err);
      alert('Failed to generate export file. Check console.');
    }
  };

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--color-border-light)' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Export Center</h2>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Generate structured data exports and predefined methodological write-ups.</div>
        </div>

        <div className="sr-card" style={{ borderTop: '4px solid var(--color-accent-primary)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Data Export</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 24 }}>Select the target dataset and formatting output structure.</p>
          
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>Dataset</label>
              <select 
                value={datasetMode}
                onChange={e => setDatasetMode(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--color-border-light)' }}
              >
                <option value="included">Included Studies Only</option>
                <option value="excluded">Excluded Studies (with Reasons)</option>
                <option value="all">Full Library (All Records)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>Format</label>
              <select 
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--color-border-light)' }}
              >
                <option value="csv">CSV (Detailed Data Matrix)</option>
                <option value="excel">Excel-Compatible CSV (.csv w/ BOM)</option>
                <option value="ris">RIS (Reference Manager)</option>
                <option value="bibtex">BibTeX</option>
              </select>
            </div>
          </div>
          
          <button className="sr-btn sr-btn-primary" onClick={handleExport} style={{ padding: '12px 24px', fontSize: 15 }}>
            Download Export
          </button>
        </div>

        <div className="sr-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Pre-drafted Methods Write-up</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 16 }}>This paragraph automatically adapts to the settings mapped in your systematic review configuration.</p>
          
          <div style={{ background: 'var(--color-bg-subtle)', padding: 20, borderRadius: 6, border: '1px solid var(--color-border-light)' }}>
             <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
               {methodsText}
             </pre>
          </div>
          
          <button className="sr-btn" style={{ marginTop: 16 }} onClick={() => navigator.clipboard.writeText(methodsText)}>
            Copy to Clipboard
          </button>
        </div>

      </div>
    </div>
  );
}
