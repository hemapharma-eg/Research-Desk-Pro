import React, { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';

export function ExportCenter() {
  const { state, logEvent } = useSystematicReview();
  const [exportFormat, setExportFormat] = useState('csv');

  const methodsText = `
### Methods: Local Systematic Review Architecture

This systematic review was conducted utilizing a locally hosted, deterministic Systematic Review Accelerator module designed to ensure strict reproducibility and security without relying on external generative artificial intelligence (LLM) APIs.

**Search & Import:** A total of ${state.records.length} records were imported across designated database sources.
**Deduplication:** Duplicates were identified using a deterministic rules engine prioritizing exact DOI and PMID alignments, followed by high-confidence fuzzy matching heuristics comparing normalized title, year, and primary author arrays. ${state.clusters.length} duplicate clusters were detected and consolidated.
**Screening Process:** Title and abstract screening was conducted using a dedicated reading environment. A smart assistance layer augmented the screening process strictly through deterministic dictionaries, evaluating predefined textual queries mapped to the study's PICO framework (${state.project?.pico.p || 'N/A'}, ${state.project?.pico.i || 'N/A'}, ${state.project?.pico.c || 'N/A'}, ${state.project?.pico.o || 'N/A'}).
**Full-Text Review and Conflict Adjudication:** Full-text documents were retrieved and examined against ${state.project?.exclusionReasons.length || 0} predefined, structured exclusion reasons. Disagreements between independent reviewers were resolved through a blinded Adjudicator override interface within the platform workspace.
  `.trim();

  const handleExport = () => {
    // In actual implementation, we'd trigger a blob download
    console.log(`Exporting ${state.records.length} records as ${exportFormat.toUpperCase()}`);
    logEvent('project_created', 'export', undefined, `Exported library as ${exportFormat.toUpperCase()}`);
    alert(`Mock export initiated. See console.`);
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
              <select style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--color-border-light)' }}>
                <option>All Included Studies (Full Extraction Ready)</option>
                <option>All Excluded Studies (with Reasons)</option>
                <option>Full Library (All Records with Audit Trail)</option>
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
                <option value="excel">Excel (.xlsx)</option>
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
