import type { GraphStyleOptions } from '../../types/GraphStyleOptions';

interface GraphStyleControllerProps {
  options: GraphStyleOptions;
  onChange: (options: GraphStyleOptions) => void;
}

export function GraphStyleController({ options, onChange }: GraphStyleControllerProps) {
  const handleChange = (field: keyof GraphStyleOptions, value: string | boolean) => {
    onChange({ ...options, [field]: value });
  };

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Graph Styling</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Chart Type</label>
          <select 
            value={options.chartType} 
            onChange={e => handleChange('chartType', e.target.value)}
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
          >
            <option value="bar">Bar Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="line">Line Graph</option>
            <option value="box">Box Plot (Placeholder)</option>
            <option value="violin">Violin Plot (Placeholder)</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Error Bars</label>
          <select 
            value={options.errorBarType} 
            onChange={e => handleChange('errorBarType', e.target.value)}
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
          >
            <option value="none">None</option>
            <option value="sd">Standard Deviation (SD)</option>
            <option value="sem">Standard Error (SEM)</option>
            <option value="ci">95% Confidence Interval</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Chart Title</label>
        <input 
          value={options.chartTitle} 
          onChange={e => handleChange('chartTitle', e.target.value)}
          style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Y-Axis Title</label>
          <input 
            value={options.yAxisTitle} 
            onChange={e => handleChange('yAxisTitle', e.target.value)}
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>X-Axis Title</label>
          <input 
            value={options.xAxisTitle} 
            onChange={e => handleChange('xAxisTitle', e.target.value)}
            style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#334155', marginTop: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={options.showAnnotations} 
            onChange={e => handleChange('showAnnotations', e.target.checked)} 
          />
          Draw Significance Brackets
        </label>
        {options.showAnnotations && (
          <select 
            value={options.annotationStyle} 
            onChange={e => handleChange('annotationStyle', e.target.value)}
            style={{ padding: '4px', marginLeft: '20px', fontSize: '11px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
          >
            <option value="stars">Asterisks (*, **, ***)</option>
            <option value="p-value">Exact p-values</option>
          </select>
        )}
      </div>
    </div>
  );
}
