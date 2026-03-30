/**
 * StyleFormatPanel.tsx — Table Style & Formatting (Section 11)
 */
import React from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import { STYLE_PRESETS } from '../../utils/stylePresets';
import type { TableStyleOptions, StylePresetName } from '../../types/TableBuilderTypes';

export const StyleFormatPanel: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const { table } = state;
  if (!table) return <div className="tb-empty-state"><p>Open a table to edit its style.</p></div>;

  const opts = table.styleOptions;

  const update = (changes: Partial<TableStyleOptions>) => {
    dispatch({ type: 'SET_TABLE', payload: { ...table, styleOptions: { ...opts, ...changes }, updatedAt: Date.now() } });
  };

  const applyPreset = (presetId: string) => {
    const preset = STYLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      dispatch({ type: 'SET_TABLE', payload: { ...table, stylePreset: presetId as StylePresetName, styleOptions: { ...preset.options }, updatedAt: Date.now() } });
    }
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🎨 Table Style & Formatting</h2>

      {/* Preset selector */}
      <div style={{ marginBottom: 24 }}>
        <div className="tb-prop-label">STYLE PRESET</div>
        <div className="tb-preset-grid">
          {STYLE_PRESETS.map(preset => (
            <div key={preset.id} className={`tb-preset-card ${table.stylePreset === preset.id ? 'selected' : ''}`} onClick={() => applyPreset(preset.id)}>
              <div className="tb-preset-preview"><span style={{ fontSize: 28 }}>📋</span></div>
              <div className="tb-preset-name">{preset.name}</div>
              <div className="tb-preset-desc">{preset.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div style={{ marginBottom: 20 }}>
        <div className="tb-prop-label">TYPOGRAPHY</div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Font Family</label>
            <select className="tb-form-select" value={opts.fontFamily} onChange={e => update({ fontFamily: e.target.value })}>
              <option value="'Helvetica Neue', Arial, sans-serif">Helvetica / Arial</option>
              <option value="'Times New Roman', Times, serif">Times New Roman</option>
              <option value="'Inter', 'Segoe UI', sans-serif">Inter</option>
              <option value="'Arial Narrow', Arial, sans-serif">Arial Narrow</option>
              <option value="'Courier New', monospace">Courier New</option>
            </select>
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">Font Size</label>
            <input className="tb-form-input" type="number" min={7} max={16} value={opts.fontSize} onChange={e => update({ fontSize: parseInt(e.target.value) || 11 })} />
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">Line Spacing</label>
            <input className="tb-form-input" type="number" min={1} max={3} step={0.1} value={opts.lineSpacing} onChange={e => update({ lineSpacing: parseFloat(e.target.value) || 1.4 })} />
          </div>
        </div>
      </div>

      {/* Borders & Layout */}
      <div style={{ marginBottom: 20 }}>
        <div className="tb-prop-label">BORDERS & LAYOUT</div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Border Style</label>
            <select className="tb-form-select" value={opts.borderStyle} onChange={e => update({ borderStyle: e.target.value as any })}>
              <option value="top-bottom-only">Top & Bottom Only</option>
              <option value="full-grid">Full Grid</option>
              <option value="horizontal-only">Horizontal Only</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">Cell Padding</label>
            <input className="tb-form-input" type="number" min={2} max={16} value={opts.cellPadding} onChange={e => update({ cellPadding: parseInt(e.target.value) || 6 })} />
          </div>
        </div>
        <div className="tb-form-row">
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.rowStriping} onChange={e => update({ rowStriping: e.target.checked })} /> Row Striping</label>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.boldFirstColumn} onChange={e => update({ boldFirstColumn: e.target.checked })} /> Bold First Column</label>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.sectionRowEmphasis} onChange={e => update({ sectionRowEmphasis: e.target.checked })} /> Section Emphasis</label>
        </div>
      </div>

      {/* Header Style */}
      <div style={{ marginBottom: 20 }}>
        <div className="tb-prop-label">HEADER STYLE</div>
        <div className="tb-form-row">
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.headerStyle.bold} onChange={e => update({ headerStyle: { ...opts.headerStyle, bold: e.target.checked } })} /> Bold</label>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.headerStyle.borderBottom} onChange={e => update({ headerStyle: { ...opts.headerStyle, borderBottom: e.target.checked } })} /> Bottom Border</label>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.headerStyle.uppercase} onChange={e => update({ headerStyle: { ...opts.headerStyle, uppercase: e.target.checked } })} /> Uppercase</label>
        </div>
        <div className="tb-form-group" style={{ maxWidth: 200 }}>
          <label className="tb-form-label">Background</label>
          <input type="color" value={opts.headerStyle.bgColor || '#f1f3f5'} onChange={e => update({ headerStyle: { ...opts.headerStyle, bgColor: e.target.value } })} />
        </div>
      </div>

      {/* P-value & Statistics Formatting */}
      <div style={{ marginBottom: 20 }}>
        <div className="tb-prop-label">P-VALUE FORMATTING</div>
        <div className="tb-form-row">
          <div className="tb-form-group">
            <label className="tb-form-label">Decimal Places</label>
            <select className="tb-form-select" value={opts.pValueDecimals} onChange={e => update({ pValueDecimals: parseInt(e.target.value) as any })}>
              <option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
            </select>
          </div>
          <div className="tb-form-group">
            <label className="tb-form-label">CI Style</label>
            <select className="tb-form-select" value={opts.ciStyle} onChange={e => update({ ciStyle: e.target.value as any })}>
              <option value="brackets">[lower, upper]</option>
              <option value="parentheses">(lower, upper)</option>
              <option value="to">lower to upper</option>
              <option value="compact">lower–upper</option>
            </select>
          </div>
        </div>
        <div className="tb-form-row">
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.pValueThreshold} onChange={e => update({ pValueThreshold: e.target.checked })} /> Use threshold ({"<"} 0.001)</label>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.pValueItalic} onChange={e => update({ pValueItalic: e.target.checked })} /> Italic p</label>
          <label className="tb-form-checkbox-row"><input type="checkbox" checked={opts.significanceStars} onChange={e => update({ significanceStars: e.target.checked })} /> Stars (* ** ***)</label>
        </div>
      </div>

      {/* Numeric Alignment */}
      <div style={{ marginBottom: 20 }}>
        <div className="tb-prop-label">NUMERIC ALIGNMENT</div>
        <select className="tb-form-select" value={opts.numericAlignment} onChange={e => update({ numericAlignment: e.target.value as any })} style={{ maxWidth: 200 }}>
          <option value="right">Right</option>
          <option value="center">Center</option>
          <option value="decimal">Decimal</option>
        </select>
      </div>
    </div>
  );
};
