/**
 * InsertionPanel.tsx — Document Insertion Panel (Section 9)
 */
import React, { useState } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import type { InsertionType } from '../../types/TableBuilderTypes';

export const InsertionPanel: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const { table, documentLinks } = state;
  const [insertType, setInsertType] = useState<InsertionType>('linked');
  const [captionPlacement, setCaptionPlacement] = useState<'above'|'below'>('above');
  const [includeFootnotes, setIncludeFootnotes] = useState(true);
  const [includeNarrative, setIncludeNarrative] = useState(false);

  if (!table) return <div className="tb-empty-state"><p>Open a table to insert it into a document.</p></div>;

  const insertionTypes: { id: InsertionType; icon: string; label: string; desc: string }[] = [
    { id: 'linked', icon: '🔗', label: 'Linked Editable', desc: 'Live link — updates propagate to document' },
    { id: 'static', icon: '📷', label: 'Static Snapshot', desc: 'One-time copy, no future updates' },
    { id: 'appendix', icon: '📑', label: 'Appendix Item', desc: 'Insert as appendix table' },
    { id: 'supplementary', icon: '📎', label: 'Supplementary', desc: 'Insert as supplementary table (S1, S2…)' },
  ];

  const handleInsert = () => {
    // Create document link record
    const link = {
      id: `dl-${Date.now()}`,
      tableId: table.id,
      documentId: '', // Would be selected
      insertionType: insertType,
      positionMarker: '',
      captionPlacement,
      includeFootnotes,
      includeNarrative,
      lastSyncedAt: Date.now(),
      updateStatus: 'synced' as const,
      createdAt: Date.now(),
    };
    dispatch({ type: 'SET_DOC_LINKS', payload: [...documentLinks, link] });
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📎 Insert into Document</h2>

      {/* Insertion Type */}
      <div style={{ marginBottom: 24 }}>
        <div className="tb-prop-label">INSERTION TYPE</div>
        <div className="tb-option-grid">
          {insertionTypes.map(t => (
            <div key={t.id} className={`tb-option-card ${insertType === t.id ? 'selected' : ''}`} onClick={() => setInsertType(t.id)}>
              <div className="tb-option-card-icon">{t.icon}</div>
              <div className="tb-option-card-title">{t.label}</div>
              <div className="tb-option-card-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16 }}>
        <div className="tb-prop-label">OPTIONS</div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Caption Placement</label>
            <select className="tb-form-select" value={captionPlacement} onChange={e => setCaptionPlacement(e.target.value as any)}>
              <option value="above">Above table</option>
              <option value="below">Below table</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <label className="tb-form-checkbox-row">
            <input type="checkbox" checked={includeFootnotes} onChange={e => setIncludeFootnotes(e.target.checked)} />
            Include footnotes
          </label>
          <label className="tb-form-checkbox-row">
            <input type="checkbox" checked={includeNarrative} onChange={e => setIncludeNarrative(e.target.checked)} />
            Include narrative paragraph below
          </label>
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16 }}>
        <div className="tb-prop-label">PREVIEW</div>
        <div style={{ fontSize: 12, color: '#495057' }}>
          {captionPlacement === 'above' && table.title && (
            <p style={{ fontWeight: 'bold', marginBottom: 4 }}>{table.tableNumber ? `${table.tableNumber}. ` : ''}{table.title}</p>
          )}
          <div style={{ border: '1px solid #dee2e6', borderRadius: 4, padding: 8, background: '#f8f9fa', textAlign: 'center', color: '#868e96', fontStyle: 'italic' }}>
            Table preview ({table.columns.length} cols × {table.rows.filter(r => !r.sectionLabel && !r.isSeparator).length} rows)
          </div>
          {captionPlacement === 'below' && table.title && (
            <p style={{ fontWeight: 'bold', marginTop: 4 }}>{table.tableNumber ? `${table.tableNumber}. ` : ''}{table.title}</p>
          )}
          {includeFootnotes && table.footnotes.length > 0 && (
            <div style={{ fontSize: 10, color: '#868e96', marginTop: 4 }}>
              {table.footnotes.map(fn => <span key={fn.id}><sup>{fn.marker}</sup> {fn.text}  </span>)}
            </div>
          )}
        </div>
      </div>

      <button className="tb-btn tb-btn-primary" onClick={handleInsert} style={{ width: '100%' }}>
        📎 Insert Table into Document
      </button>

      <button
        className="tb-btn"
        onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: { module: 'document-editor' } }))}
        style={{ width: '100%', marginTop: 8, border: '1px solid var(--color-accent-primary, #2962ff)', color: 'var(--color-accent-primary, #2962ff)', background: 'transparent', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
      >
        ✏️ Go to Document Editor
      </button>

      {/* Existing Links */}
      {documentLinks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="tb-prop-label">EXISTING DOCUMENT LINKS ({documentLinks.length})</div>
          {documentLinks.map(link => (
            <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f0f1f3', fontSize: 12 }}>
              <span>{link.insertionType === 'linked' ? '🔗' : '📷'}</span>
              <span style={{ flex: 1 }}>{link.insertionType} — {new Date(link.createdAt).toLocaleDateString()}</span>
              <span className={`tb-link-badge tb-link-${link.updateStatus === 'synced' ? 'linked' : link.updateStatus}`}>{link.updateStatus}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
