/**
 * SettingsPanel.tsx — Project-Wide Table Builder Settings (Section 17)
 */
import React from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import type { TableBuilderSettings, NumberingMode, NarrativeTone, FootnoteStyle } from '../../types/TableBuilderTypes';

export const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const s = state.settings;

  const update = (changes: Partial<TableBuilderSettings>) => {
    dispatch({ type: 'SET_SETTINGS', payload: { ...s, ...changes } });
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%', maxWidth: 700 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>⚙️ Table Builder Settings</h2>

      {/* Typography */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div className="tb-prop-label">DEFAULT TYPOGRAPHY</div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Font</label>
            <select className="tb-form-select" value={s.defaultFont} onChange={e => update({ defaultFont: e.target.value })}>
              <option value="'Helvetica Neue', Arial, sans-serif">Helvetica / Arial</option>
              <option value="'Times New Roman', Times, serif">Times New Roman</option>
              <option value="'Inter', 'Segoe UI', sans-serif">Inter</option>
            </select>
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">Font Size</label>
            <input className="tb-form-input" type="number" min={7} max={16} value={s.defaultFontSize} onChange={e => update({ defaultFontSize: parseInt(e.target.value) || 11 })} />
          </div>
        </div>
      </div>

      {/* Numbering & Formatting */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div className="tb-prop-label">NUMBERING & FORMATTING</div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Default Numbering</label>
            <select className="tb-form-select" value={s.defaultNumberingStyle} onChange={e => update({ defaultNumberingStyle: e.target.value as NumberingMode })}>
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
              <option value="chapter">Chapter-based</option>
            </select>
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">Default Decimals</label>
            <input className="tb-form-input" type="number" min={0} max={6} value={s.defaultDecimals} onChange={e => update({ defaultDecimals: parseInt(e.target.value) || 2 })} />
          </div>
        </div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">P-value Style</label>
            <select className="tb-form-select" value={s.defaultPValueStyle} onChange={e => update({ defaultPValueStyle: e.target.value as any })}>
              <option value="threshold">Threshold ({'<'} 0.001)</option>
              <option value="exact-3">Exact (3 decimal)</option>
              <option value="exact-4">Exact (4 decimal)</option>
            </select>
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">CI Style</label>
            <select className="tb-form-select" value={s.defaultCIStyle} onChange={e => update({ defaultCIStyle: e.target.value })}>
              <option value="brackets">[lower, upper]</option>
              <option value="parentheses">(lower, upper)</option>
              <option value="to">lower to upper</option>
              <option value="compact">lower–upper</option>
            </select>
          </div>
        </div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Caption Placement</label>
            <select className="tb-form-select" value={s.defaultCaptionPlacement} onChange={e => update({ defaultCaptionPlacement: e.target.value as 'above' | 'below' })}>
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">Footnote Style</label>
            <select className="tb-form-select" value={s.defaultFootnoteStyle} onChange={e => update({ defaultFootnoteStyle: e.target.value as FootnoteStyle })}>
              <option value="alphabetic">Alphabetic (a, b, c)</option>
              <option value="numeric">Numeric (1, 2, 3)</option>
              <option value="symbolic">Symbolic (*, †, ‡)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Narrative Defaults */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div className="tb-prop-label">NARRATIVE DEFAULTS</div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Default Tone</label>
            <select className="tb-form-select" value={s.defaultNarrativeTone} onChange={e => update({ defaultNarrativeTone: e.target.value as NarrativeTone })}>
              <option value="neutral">Neutral</option>
              <option value="concise">Concise</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validation */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div className="tb-prop-label">VALIDATION</div>
        <div className="tb-form-group">
          <label className="tb-form-label">Strictness Level</label>
          <select className="tb-form-select" value={s.validationStrictness} onChange={e => update({ validationStrictness: e.target.value as any })} style={{ maxWidth: 300 }}>
            <option value="relaxed">Relaxed — minimal checks</option>
            <option value="standard">Standard — recommended</option>
            <option value="strict">Strict — all checks enforced</option>
          </select>
        </div>
      </div>

      {/* Journal Profiles */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16 }}>
        <div className="tb-prop-label">JOURNAL PROFILES ({s.journalProfiles.length})</div>
        {s.journalProfiles.length === 0 ? (
          <div style={{ color: '#adb5bd', fontStyle: 'italic', fontSize: 12, padding: 8 }}>
            No journal profiles configured. Profiles allow you to save complete style + narrative presets.
          </div>
        ) : (
          s.journalProfiles.map(jp => (
            <div key={jp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f1f3', fontSize: 12 }}>
              <span style={{ fontWeight: 500 }}>{jp.name}</span>
              <button className="tb-btn tb-btn-ghost tb-btn-sm">Edit</button>
            </div>
          ))
        )}
        <button className="tb-btn tb-btn-secondary" style={{ marginTop: 8 }} onClick={() => {
          const newProfile = { id: `jp-${Date.now()}`, name: 'New Profile', styleOptions: state.table?.styleOptions || ({} as any), narrativeSettings: { tone: 'neutral' as const, mentionTestNames: true, reportExactP: false, reportPThresholds: true, includeEffectSizes: true, includeCI: true, defineAbbreviations: true, mentionNonSignificant: true, mentionAssumptions: false, usePassiveVoice: false } };
          update({ journalProfiles: [...s.journalProfiles, newProfile] });
        }}>➕ Add Profile</button>
      </div>
    </div>
  );
};
