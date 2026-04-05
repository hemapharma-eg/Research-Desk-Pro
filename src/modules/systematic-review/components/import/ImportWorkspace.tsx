import React, { useState, useRef } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';
import { v4 as uuidv4 } from 'uuid';
import type { ReviewRecord } from '../../types/ReviewModels';
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-ris';
import '@citation-js/plugin-bibtex';
import { useLicense } from '../../../licensing/LicenseContext';
import { DemoLimitDialog } from '../../../licensing/components/DemoLimitDialog';

export function ImportWorkspace() {
  const { state, dispatch, logEvent } = useSystematicReview();
  const { entitlements } = useLicense();
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [sourceName, setSourceName] = useState('PubMed');
  const [format, setFormat] = useState<'RIS' | 'BibTeX' | 'CSV'>('RIS');
  const [rawText, setRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.ris')) setFormat('RIS');
    else if (file.name.toLowerCase().endsWith('.bib') || file.name.toLowerCase().endsWith('.bibtex')) setFormat('BibTeX');
    else if (file.name.toLowerCase().endsWith('.csv')) setFormat('CSV');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setRawText(result);
      }
    };
    reader.readAsText(file);
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!rawText.trim()) return;
    
    try {
      const cite = new Cite(rawText);
      const records = cite.data;

      if (!records || records.length === 0) {
        alert('No valid records found or could not be parsed.');
        return;
      }
      
      if (state.records.length + records.length > entitlements.maxScreeningArticleCount) {
        setShowLimitDialog(true);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedRecords: ReviewRecord[] = records.map((record: any) => {
        let authorsStr = '';
        if (record.author && Array.isArray(record.author)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authorsStr = record.author.map((a: any) => `${a.family || ''}${a.given ? ', ' + a.given : ''}`).filter(Boolean).join('; ');
        }

        let kw: string[] = [];
        if (record.keyword) {
          if (typeof record.keyword === 'string') {
            kw = record.keyword.split(',').map((k: string) => k.trim());
          } else if (Array.isArray(record.keyword)) {
            kw = record.keyword;
          }
        }

        return {
          id: uuidv4(),
          title: record.title || 'Untitled',
          abstract: record.abstract || '',
          authors: authorsStr,
          year: record.issued?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
          journal: record['container-title'] || '',
          volume: record.volume || '',
          issue: record.issue || '',
          pages: record.page || '',
          doi: record.DOI || '',
          pmid: record.PMID || '',
          pmcid: record.PMCID || '',
          keywords: kw,
          meshTerms: [],
          publicationType: record.type || 'Journal Article',
          language: record.language || 'English',
          urls: record.URL ? [record.URL] : [],
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
        };
      });

      dispatch({ type: 'ADD_RECORDS', payload: parsedRecords });
      logEvent('records_imported', 'import', undefined, `Imported ${parsedRecords.length} records via ${format} from ${sourceName}`);
      setRawText('');
      alert(`Successfully parsed and imported ${parsedRecords.length} records.`);
    } catch (err: any) {
      alert(`Error parsing records: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 300px', gap: 24 }}>
        
        {/* Import Form */}
        <div className="sr-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Import Records</h2>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".ris,.bib,.csv,.txt"
              onChange={handleFileUpload}
            />
            <button 
              className="sr-btn" 
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-bg-subtle)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Upload File
            </button>
          </div>
          
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

      <DemoLimitDialog
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        title="Screening Capacity Exceeded"
        message={`The Demo Version limits systematic reviews to ${entitlements.maxScreeningArticleCount} records in the screening queue. Activate your license for unlimited records.`}
        onActivate={() => window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'))}
      />
    </div>
  );
}
