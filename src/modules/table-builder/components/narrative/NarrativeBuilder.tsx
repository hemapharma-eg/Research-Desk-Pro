/**
 * NarrativeBuilder.tsx — Results Narrative Builder UI (Section 10)
 */
import React, { useState, useEffect } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import { generateNarrative, suggestNarrativeType } from '../../utils/NarrativeEngine';
import type { NarrativeType, NarrativeSettings, NarrativeTone } from '../../types/TableBuilderTypes';
import { DEFAULT_NARRATIVE_SETTINGS } from '../../types/TableBuilderTypes';

export const NarrativeBuilder: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const { table } = state;

  const [narrativeType, setNarrativeType] = useState<NarrativeType>('concise');
  const [settings, setSettings] = useState<NarrativeSettings>({ ...DEFAULT_NARRATIVE_SETTINGS });
  const [narrative, setNarrative] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (table) setNarrativeType(suggestNarrativeType(table));
  }, [table?.id]);

  if (!table) return <div className="tb-empty-state"><p>Open a table to generate a results narrative.</p></div>;

  const handleGenerate = () => {
    const text = generateNarrative(table, narrativeType, settings);
    setNarrative(text);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(narrative); } catch {}
  };

  const types: { id: NarrativeType; label: string; desc: string }[] = [
    { id: 'concise', label: 'Concise', desc: 'Single sentence for journal results' },
    { id: 'expanded', label: 'Expanded', desc: 'Full paragraph for thesis/dissertation' },
    { id: 'objective', label: 'Objective', desc: 'Pure statistical notation' },
    { id: 'multi-comparison', label: 'Multi-Comparison', desc: 'Multiple pairwise comparisons' },
    { id: 'regression', label: 'Regression', desc: 'Regression model findings' },
    { id: 'baseline', label: 'Baseline', desc: 'Baseline characteristics summary' },
    { id: 'adverse', label: 'Adverse Events', desc: 'Safety/adverse events summary' },
    { id: 'evidence', label: 'Evidence', desc: 'Evidence synthesis overview' },
  ];

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📝 Results Narrative Builder</h2>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left: Settings */}
        <div style={{ width: 320, flexShrink: 0 }}>
          {/* Narrative Type */}
          <div style={{ marginBottom: 16 }}>
            <div className="tb-prop-label">NARRATIVE TYPE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {types.map(t => (
                <div key={t.id} className={`tb-option-card ${narrativeType === t.id ? 'selected' : ''}`} onClick={() => setNarrativeType(t.id)} style={{ padding: '8px 12px' }}>
                  <div className="tb-option-card-title">{t.label}</div>
                  <div className="tb-option-card-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div style={{ marginBottom: 16 }}>
            <div className="tb-prop-label">REPORTING OPTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="tb-form-checkbox-row"><input type="checkbox" checked={settings.mentionTestNames} onChange={e => setSettings({ ...settings, mentionTestNames: e.target.checked })} /> Mention test names</label>
              <label className="tb-form-checkbox-row"><input type="checkbox" checked={settings.reportExactP} onChange={e => setSettings({ ...settings, reportExactP: e.target.checked })} /> Report exact p-values</label>
              <label className="tb-form-checkbox-row"><input type="checkbox" checked={settings.includeEffectSizes} onChange={e => setSettings({ ...settings, includeEffectSizes: e.target.checked })} /> Include effect sizes</label>
              <label className="tb-form-checkbox-row"><input type="checkbox" checked={settings.includeCI} onChange={e => setSettings({ ...settings, includeCI: e.target.checked })} /> Include confidence intervals</label>
              <label className="tb-form-checkbox-row"><input type="checkbox" checked={settings.mentionNonSignificant} onChange={e => setSettings({ ...settings, mentionNonSignificant: e.target.checked })} /> Mention non-significant results</label>
              <label className="tb-form-checkbox-row"><input type="checkbox" checked={settings.defineAbbreviations} onChange={e => setSettings({ ...settings, defineAbbreviations: e.target.checked })} /> Define abbreviations</label>
              <label className="tb-form-checkbox-row"><input type="checkbox" checked={settings.usePassiveVoice} onChange={e => setSettings({ ...settings, usePassiveVoice: e.target.checked })} /> Use passive voice</label>
            </div>
          </div>

          {/* Tone */}
          <div style={{ marginBottom: 16 }}>
            <div className="tb-prop-label">TONE</div>
            <select className="tb-form-select" value={settings.tone} onChange={e => setSettings({ ...settings, tone: e.target.value as NarrativeTone })}>
              <option value="neutral">Neutral</option>
              <option value="concise">Concise</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <button className="tb-btn tb-btn-primary" onClick={handleGenerate} style={{ width: '100%' }}>📝 Generate Narrative</button>
        </div>

        {/* Right: Output */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="tb-prop-label">GENERATED NARRATIVE</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="tb-btn tb-btn-ghost tb-btn-sm" onClick={() => setIsEditing(!isEditing)}>✏️ {isEditing ? 'Preview' : 'Edit'}</button>
              <button className="tb-btn tb-btn-ghost tb-btn-sm" onClick={handleCopy} disabled={!narrative}>📋 Copy</button>
            </div>
          </div>
          {narrative ? (
            isEditing ? (
              <textarea className="tb-form-textarea" value={narrative} onChange={e => setNarrative(e.target.value)} style={{ width: '100%', minHeight: 200, fontSize: 13, lineHeight: 1.8 }} />
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 20, fontSize: 13, lineHeight: 1.8, color: '#1a1a2e', minHeight: 200 }}>
                {narrative}
              </div>
            )
          ) : (
            <div style={{ background: '#f8f9fa', border: '1px dashed #dee2e6', borderRadius: 10, padding: 40, textAlign: 'center', color: '#adb5bd', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36, marginBottom: 12 }}>📝</span>
              <p>Select options and click "Generate Narrative" to create a results sentence or paragraph from your table data.</p>
            </div>
          )}

          {narrative && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="tb-btn tb-btn-secondary">📎 Insert into Document</button>
              <button className="tb-btn tb-btn-secondary" onClick={() => {
                // Save as narrative draft
                const draft = { id: `${Date.now()}`, tableId: table.id, narrativeType, tone: settings.tone, content: narrative, settings, createdAt: Date.now(), updatedAt: Date.now() };
                dispatch({ type: 'SET_NARRATIVES', payload: [...state.narrativeDrafts, draft] });
              }}>💾 Save Draft</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
