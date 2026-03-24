import { useState } from 'react';
import type { GraphStyleOptions, ChartType, ErrorBarType, PointShape, LineStyle, LegendPosition, AnnotationStyle } from '../../types/GraphStyleOptions';

interface GraphStyleControllerProps {
  options: GraphStyleOptions;
  groupNames?: string[];
  onChange: (options: GraphStyleOptions) => void;
}

const CHART_TYPES: { value: ChartType; label: string; group: string }[] = [
  { value: 'bar', label: 'Bar Chart', group: 'Basic' },
  { value: 'grouped-bar', label: 'Grouped Bar', group: 'Basic' },
  { value: 'stacked-bar', label: 'Stacked Bar', group: 'Basic' },
  { value: 'stacked-bar-100', label: '100% Stacked Bar', group: 'Basic' },
  { value: 'line', label: 'Line Graph', group: 'Basic' },
  { value: 'grouped-line', label: 'Grouped Line', group: 'Basic' },
  { value: 'scatter', label: 'Scatter Plot', group: 'Basic' },
  { value: 'scatter-fit', label: 'Scatter + Fit Line', group: 'Basic' },
  { value: 'box', label: 'Box Plot', group: 'Distribution' },
  { value: 'violin', label: 'Violin Plot', group: 'Distribution' },
  { value: 'histogram', label: 'Histogram', group: 'Distribution' },
  { value: 'dot-plot', label: 'Dot Plot (1D)', group: 'Distribution' },
  { value: 'strip-plot', label: 'Strip Plot (Jitter)', group: 'Distribution' },
  { value: 'before-after', label: 'Before–After', group: 'Paired' },
  { value: 'slope-graph', label: 'Slope Graph', group: 'Paired' },
  { value: 'bar-points', label: 'Bar + Individual Points', group: 'Overlay' },
  { value: 'box-points', label: 'Box + Individual Points', group: 'Overlay' },
  { value: 'violin-points', label: 'Violin + Individual Points', group: 'Overlay' },
];

const PALETTES: { name: string; colors: string[] }[] = [
  { name: 'Default', colors: ['#2962FF', '#FF6D00', '#00C853', '#AA00FF', '#FFD600', '#D50000', '#00BFA5', '#6200EA'] },
  { name: 'Pastel', colors: ['#7BAFD4', '#F4A582', '#92C5DE', '#D6A5C9', '#FDD0A2', '#B3B3B3', '#99D8C9', '#FDAE6B'] },
  { name: 'Nature', colors: ['#1B9E77', '#D95F02', '#7570B3', '#E7298A', '#66A61E', '#E6AB02', '#A6761D', '#666666'] },
  { name: 'Grayscale', colors: ['#333333', '#666666', '#999999', '#BBBBBB', '#444444', '#888888', '#AAAAAA', '#DDDDDD'] },
  { name: 'Vivid', colors: ['#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F', '#8491B4', '#91D1C2', '#DC9F82'] },
];

type ControlTab = 'chart' | 'style' | 'axes' | 'legend';

export function GraphStyleController({ options, groupNames = [], onChange }: GraphStyleControllerProps) {
  const [tab, setTab] = useState<ControlTab>('chart');

  const update = (partial: Partial<GraphStyleOptions>) => {
    onChange({ ...options, ...partial });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Control tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-light)', flexShrink: 0 }}>
        {[
          { id: 'chart' as ControlTab, label: '📊 Chart' },
          { id: 'style' as ControlTab, label: '🎨 Style' },
          { id: 'axes' as ControlTab, label: '📐 Axes' },
          { id: 'legend' as ControlTab, label: '📋 More' },
        ].map(t => (
          <button
            key={t.id}
            className={`gs-tab ${tab === t.id ? 'active' : ''}`}
            style={{ flex: 1, fontSize: '11px', padding: '8px 4px' }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Chart Type Tab */}
        {tab === 'chart' && (
          <>
            <div className="gs-panel-section">
              <div className="gs-panel-title">Chart Type</div>
              <select
                className="gs-select"
                value={options.chartType}
                onChange={e => update({ chartType: e.target.value as ChartType })}
              >
                {['Basic', 'Distribution', 'Paired', 'Overlay'].map(group => (
                  <optgroup key={group} label={group}>
                    {CHART_TYPES.filter(ct => ct.group === group).map(ct => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Titles</div>
              <div className="gs-form-group">
                <label className="gs-label">Graph Title</label>
                <input className="gs-input" value={options.title} onChange={e => update({ title: e.target.value })} placeholder="Enter title..." />
              </div>
              <div className="gs-form-group">
                <label className="gs-label">Subtitle</label>
                <input className="gs-input" value={options.subtitle} onChange={e => update({ subtitle: e.target.value })} placeholder="Optional subtitle..." />
              </div>
              <div className="gs-form-row">
                <div>
                  <label className="gs-label">X Axis Label</label>
                  <input className="gs-input" value={options.xAxisLabel} onChange={e => update({ xAxisLabel: e.target.value })} />
                </div>
                <div>
                  <label className="gs-label">Y Axis Label</label>
                  <input className="gs-input" value={options.yAxisLabel} onChange={e => update({ yAxisLabel: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Error Bars</div>
              <div className="gs-form-row">
                <div>
                  <label className="gs-label">Type</label>
                  <select className="gs-select" value={options.errorBarType} onChange={e => update({ errorBarType: e.target.value as ErrorBarType })}>
                    <option value="none">None</option>
                    <option value="SD">SD</option>
                    <option value="SEM">SEM</option>
                    <option value="CI95">95% CI</option>
                  </select>
                </div>
                {options.errorBarType !== 'none' && (
                  <div>
                    <label className="gs-label">Direction</label>
                    <select className="gs-select" value={options.errorBarDirection} onChange={e => update({ errorBarDirection: e.target.value as any })}>
                      <option value="both">Both (±)</option>
                      <option value="up">Up (+)</option>
                      <option value="down">Down (-)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Annotations</div>
              <label className="gs-checkbox-label" style={{ marginBottom: '6px' }}>
                <input type="checkbox" checked={options.showAnnotations} onChange={e => update({ showAnnotations: e.target.checked })} />
                Show significance annotations
              </label>
              {options.showAnnotations && (
                <select className="gs-select" value={options.annotationStyle} onChange={e => update({ annotationStyle: e.target.value as AnnotationStyle })}>
                  <option value="stars">★ Asterisks (*, **, ***)</option>
                  <option value="p-value">p-value</option>
                  <option value="letters">Letter groupings (a, b, c)</option>
                </select>
              )}
            </div>
          </>
        )}

        {/* Style Tab */}
        {tab === 'style' && (
          <>
            <div className="gs-panel-section">
              <div className="gs-panel-title">Color Palette</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PALETTES.map(p => (
                  <div
                    key={p.name}
                    onClick={() => update({ colorPalette: p.colors })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer',
                      borderRadius: '6px', border: options.colorPalette[0] === p.colors[0] ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-light)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {p.colors.slice(0, 6).map((c, i) => (
                        <div key={i} style={{ width: '16px', height: '16px', borderRadius: '3px', background: c }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{p.name}</span>
                  </div>
                ))}
              </div>
              
              {groupNames.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <label className="gs-label">Individual Bar Colors (Overrides Palette)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {groupNames.map((g, i) => {
                      const c = (options.customBarColors || {})[g] || options.colorPalette[i % options.colorPalette.length];
                      return (
                        <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input 
                            type="color" 
                            value={c} 
                            onChange={e => update({ customBarColors: { ...(options.customBarColors || {}), [g]: e.target.value } })}
                            style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Points</div>
              <label className="gs-checkbox-label" style={{ marginBottom: '6px' }}>
                <input type="checkbox" checked={options.showPoints} onChange={e => update({ showPoints: e.target.checked })} />
                Show individual data points
              </label>
              <div className="gs-form-row">
                <div>
                  <label className="gs-label">Size</label>
                  <input type="range" min="2" max="12" value={options.pointSize} onChange={e => update({ pointSize: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="gs-label">Shape</label>
                  <select className="gs-select" value={options.pointShape} onChange={e => update({ pointShape: e.target.value as PointShape })}>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="diamond">Diamond</option>
                  </select>
                </div>
              </div>
              <div className="gs-form-group">
                <label className="gs-label">Opacity ({Math.round(options.pointOpacity * 100)}%)</label>
                <input type="range" min="0" max="100" value={options.pointOpacity * 100} onChange={e => update({ pointOpacity: Number(e.target.value) / 100 })} style={{ width: '100%' }} />
              </div>
              
              {options.showPoints && groupNames.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <label className="gs-label">Individual Point Colors</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {groupNames.map((g, i) => {
                      const c = (options.customPointColors || {})[g] || options.colorPalette[i % options.colorPalette.length];
                      return (
                        <div key={`pt-${g}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input 
                            type="color" 
                            value={c} 
                            onChange={e => update({ customPointColors: { ...(options.customPointColors || {}), [g]: e.target.value } })}
                            style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Lines & Bars</div>
              <div className="gs-form-row">
                <div>
                  <label className="gs-label">Line Thickness</label>
                  <input type="range" min="1" max="6" value={options.lineThickness} onChange={e => update({ lineThickness: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="gs-label">Line Style</label>
                  <select className="gs-select" value={options.lineStyle} onChange={e => update({ lineStyle: e.target.value as LineStyle })}>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>
              <div className="gs-form-row">
                <div>
                  <label className="gs-label">Bar Width ({Math.round(options.barWidth * 100)}%)</label>
                  <input type="range" min="20" max="100" value={options.barWidth * 100} onChange={e => update({ barWidth: Number(e.target.value) / 100 })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="gs-label">Bar Opacity ({Math.round(options.barOpacity * 100)}%)</label>
                  <input type="range" min="20" max="100" value={options.barOpacity * 100} onChange={e => update({ barOpacity: Number(e.target.value) / 100 })} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Typography</div>
              <div className="gs-form-row">
                <div>
                  <label className="gs-label">Font Size</label>
                  <input type="number" className="gs-input" min="8" max="24" value={options.fontSize} onChange={e => update({ fontSize: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="gs-label">Title Size</label>
                  <input type="number" className="gs-input" min="10" max="32" value={options.titleFontSize} onChange={e => update({ titleFontSize: Number(e.target.value) })} />
                </div>
              </div>
              <div className="gs-form-group">
                <label className="gs-label">Font Family</label>
                <select className="gs-select" value={options.fontFamily} onChange={e => update({ fontFamily: e.target.value })}>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Helvetica Neue', sans-serif">Helvetica Neue</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Axes Tab */}
        {tab === 'axes' && (
          <>
            <div className="gs-panel-section">
              <div className="gs-panel-title">Y Axis</div>
              <div className="gs-form-row">
                <div>
                  <label className="gs-label">Min</label>
                  <input className="gs-input" type="number" value={options.yAxisMin ?? ''} onChange={e => update({ yAxisMin: e.target.value ? Number(e.target.value) : null })} placeholder="Auto" />
                </div>
                <div>
                  <label className="gs-label">Max</label>
                  <input className="gs-input" type="number" value={options.yAxisMax ?? ''} onChange={e => update({ yAxisMax: e.target.value ? Number(e.target.value) : null })} placeholder="Auto" />
                </div>
              </div>
              <label className="gs-checkbox-label" style={{ marginTop: '6px' }}>
                <input type="checkbox" checked={options.yAxisLogScale} onChange={e => update({ yAxisLogScale: e.target.checked })} />
                Logarithmic scale
              </label>
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">X Axis</div>
              <div className="gs-form-group">
                <label className="gs-label">Tick Label Rotation</label>
                <select className="gs-select" value={options.xAxisTickRotation} onChange={e => update({ xAxisTickRotation: Number(e.target.value) })}>
                  <option value={0}>Horizontal (0°)</option>
                  <option value={-45}>Angled (-45°)</option>
                  <option value={-90}>Vertical (-90°)</option>
                </select>
              </div>
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Grid & Frame</div>
              <label className="gs-checkbox-label" style={{ marginBottom: '6px' }}>
                <input type="checkbox" checked={options.showGridlines} onChange={e => update({ showGridlines: e.target.checked })} />
                Show gridlines
              </label>
              <label className="gs-checkbox-label">
                <input type="checkbox" checked={options.frameVisible} onChange={e => update({ frameVisible: e.target.checked })} />
                Show frame border
              </label>
            </div>
          </>
        )}

        {/* More Tab */}
        {tab === 'legend' && (
          <>
            <div className="gs-panel-section">
              <div className="gs-panel-title">Legend</div>
              <label className="gs-checkbox-label" style={{ marginBottom: '6px' }}>
                <input type="checkbox" checked={options.showLegend} onChange={e => update({ showLegend: e.target.checked })} />
                Show legend
              </label>
              {options.showLegend && (
                <select className="gs-select" value={options.legendPosition} onChange={e => update({ legendPosition: e.target.value as LegendPosition })}>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                </select>
              )}
            </div>

            <div className="gs-panel-section">
              <div className="gs-panel-title">Background</div>
              <div className="gs-form-group">
                <label className="gs-label">Background Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={options.backgroundColor} onChange={e => update({ backgroundColor: e.target.value })} style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer' }} />
                  <button className="gs-btn gs-btn-sm" onClick={() => update({ backgroundColor: '#FFFFFF' })}>White</button>
                  <button className="gs-btn gs-btn-sm" onClick={() => update({ backgroundColor: 'transparent' })}>Transparent</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
