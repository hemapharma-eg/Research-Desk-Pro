/**
 * SourceMappingDialog.tsx — Statistics-to-Table Mapping Dialog (Section 8)
 */
import React, { useState } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';

interface SourceMappingDialogProps {
  statResult: any;
  onClose: () => void;
}

export const SourceMappingDialog: React.FC<SourceMappingDialogProps> = ({ statResult, onClose }) => {
  const { dispatch } = useTableBuilder();
  const [includeP, setIncludeP] = useState(true);
  const [includeEffect, setIncludeEffect] = useState(true);
  const [includeCI, setIncludeCI] = useState(true);
  const [includeN, setIncludeN] = useState(true);
  const [includeTest, setIncludeTest] = useState(true);

  if (!statResult) return null;

  const handleGenerate = () => {
    // This would create a table document from the stat result
    // For now, dispatch the pending import and close
    dispatch({ type: 'SET_PENDING_IMPORT', payload: { ...statResult, mappingOptions: { includeP, includeEffect, includeCI, includeN, includeTest } } });
    onClose();
  };

  return (
    <div className="tb-wizard-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tb-wizard" style={{ width: 560 }}>
        <div className="tb-wizard-header">
          <h3>📊 Map Statistics to Table</h3>
          <button className="tb-btn tb-btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="tb-wizard-body">
          {/* Source Info */}
          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div className="tb-prop-label">SOURCE ANALYSIS</div>
            <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '100px 1fr', gap: '4px 8px' }}>
              <span style={{ color: '#868e96' }}>Test:</span><span>{statResult.testName || 'Unknown'}</span>
              <span style={{ color: '#868e96' }}>Variables:</span><span>{statResult.variablesUsed?.join(', ') || 'N/A'}</span>
              <span style={{ color: '#868e96' }}>Date:</span><span>{statResult.date ? new Date(statResult.date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Include Options */}
          <div className="tb-prop-label">INCLUDE IN TABLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <label className="tb-form-checkbox-row"><input type="checkbox" checked={includeP} onChange={e => setIncludeP(e.target.checked)} /> P-values</label>
            <label className="tb-form-checkbox-row"><input type="checkbox" checked={includeEffect} onChange={e => setIncludeEffect(e.target.checked)} /> Effect sizes</label>
            <label className="tb-form-checkbox-row"><input type="checkbox" checked={includeCI} onChange={e => setIncludeCI(e.target.checked)} /> Confidence intervals</label>
            <label className="tb-form-checkbox-row"><input type="checkbox" checked={includeN} onChange={e => setIncludeN(e.target.checked)} /> Sample sizes</label>
            <label className="tb-form-checkbox-row"><input type="checkbox" checked={includeTest} onChange={e => setIncludeTest(e.target.checked)} /> Test names & statistics</label>
          </div>

          {/* Significance Style */}
          <div className="tb-prop-label">SIGNIFICANCE STYLE</div>
          <div className="tb-form-row">
            <div className="tb-form-group">
              <select className="tb-form-select">
                <option value="stars">Stars (* ** ***)</option>
                <option value="symbols">Symbols (†  ‡)</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>
        <div className="tb-wizard-footer">
          <button className="tb-btn tb-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="tb-btn tb-btn-primary" onClick={handleGenerate}>Generate Table</button>
        </div>
      </div>
    </div>
  );
};
