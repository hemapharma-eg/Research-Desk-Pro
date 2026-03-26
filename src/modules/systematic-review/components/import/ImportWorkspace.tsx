import React, { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import { v4 as uuidv4 } from 'uuid';
import type { ReviewRecord } from '../../types/ReviewModels';

export function ImportWorkspace() {
  const { state, dispatch, logEvent } = useSystematicReview();
  const [sourceName, setSourceName] = useState('PubMed');
  const [format, setFormat] = useState<'RIS' | 'BibTeX' | 'CSV'>('RIS');
  const [rawText, setRawText] = useState('');

  const handleImport = () => {
    if (!rawText.trim()) return;
    
    // Very naive mock parser just to demonstrate data flow without building a full RIS parser
    // Real implementation would use something like `citation-js` or a custom parser.
    const mockRecords: ReviewRecord[] = rawText.split('\n\n').filter(b => b.trim().length > 10).map((block, i) => ({
      id: uuidv4(),
      title: block.substring(0, 50).replace(/TI  - |title=|@article{/gi, '') + (block.length > 50 ? '...' : ''),
      abstract: 'Abstract parsed from raw text block. Length: ' + block.length,
      authors: 'Author ' + (i + 1),
      year: new Date().getFullYear(),
      journal: sourceName + ' Journal',
      volume: '1', issue: '1', pages: '1-10',
      doi: `10.1234/sr.mock.${Date.now()}.${i}`,
      pmid: `${Date.now()}`.slice(-8),
      pmcid: '',
      keywords: ['mock', format, sourceName],
      meshTerms: [],
      publicationType: 'Journal Article',
      language: 'English',
      urls: [],
      sourceDatabase: sourceName,
      sourceBatch: `Batch-${new Date().toISOString().split('T')[0]}`,
      importTimestamp: new Date().toISOString(),
      pdfAttached: false,
      supplementaryFiles: [],
      stage: 'title-abstract-screening',
      dedupClusterId: null,
      dedupStatus: 'pending',
      titleAbstractDecisions: {},
      fullTextDecisions: {},
      conflictStatus: 'none',
      finalDisposition: 'pending',
      topicTags: [],
      userLabels: [],
      flags: []
    }));

    dispatch({ type: 'ADD_RECORDS', payload: mockRecords });
    logEvent('records_imported', 'import', undefined, `Imported ${mockRecords.length} records via ${format} from ${sourceName}`);
    setRawText('');
    alert(`Successfully parsed and imported ${mockRecords.length} records.`);
  };

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 300px', gap: 24 }}>
        
        {/* Import Form */}
        <div className="sr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 18 }}>Import Records</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Source Database</label>
              <select value={sourceName} onChange={e => setSourceName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }}>
                {['PubMed', 'Embase', 'Scopus', 'Web of Science', 'Cochrane', 'Google Scholar', 'ClinicalTrials.gov', 'Manual'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value as any)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--color-border-light)' }}>
                <option value="RIS">RIS</option>
                <option value="BibTeX">BibTeX</option>
                <option value="CSV">CSV Template</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Paste Raw Citation Text</label>
            <textarea 
              value={rawText} 
              onChange={e => setRawText(e.target.value)} 
              placeholder="Paste raw RIS or BibTeX text here... Separate records by double newlines."
              style={{ width: '100%', height: 200, padding: 12, borderRadius: 4, border: '1px solid var(--color-border-light)', fontFamily: 'monospace', fontSize: 12 }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button className="sr-btn sr-btn-primary" onClick={handleImport} disabled={!rawText.trim()}>
              Parse & Import Records
            </button>
          </div>
        </div>

        {/* Import Rules / Instructions */}
        <div className="sr-card" style={{ background: 'var(--color-bg-subtle)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 15 }}>Import Guidelines</h3>
          <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>
            <li>Ensure exports from databases include Abstract and Keywords.</li>
            <li>For Ovid formats, ensure you map fields properly beforehand.</li>
            <li>Duplicates will be parsed and flagged later in the Deduplication engine.</li>
            <li>Missing DOIs or PMIDs will flag the record for review.</li>
          </ul>
        </div>
      </div>

      {/* Import History */}
      <div className="sr-card" style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Import History</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
              <th style={{ padding: '8px 4px' }}>Date</th>
              <th style={{ padding: '8px 4px' }}>Source</th>
              <th style={{ padding: '8px 4px' }}>Format</th>
              <th style={{ padding: '8px 4px' }}>Records</th>
              <th style={{ padding: '8px 4px' }}>Reviewer</th>
            </tr>
          </thead>
          <tbody>
            {state.logs.filter(l => l.actionType === 'records_imported').length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No imports recorded yet.</td></tr>
            ) : (
              state.logs.filter(l => l.actionType === 'records_imported').map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '12px 4px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '12px 4px' }}>{log.comment?.split('from ')[1] || 'Unknown'}</td>
                  <td style={{ padding: '12px 4px' }}>{log.comment?.split('via ')[1]?.split(' ')[0] || '-'}</td>
                  <td style={{ padding: '12px 4px', fontWeight: 'bold' }}>{log.comment?.match(/(\d+) records/)?.[1] || 0}</td>
                  <td style={{ padding: '12px 4px' }}>{/* In a real app we lookup log.userId */} You</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
