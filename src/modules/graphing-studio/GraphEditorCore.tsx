import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface DataPoint {
  id: string;
  x: string;
  y: number | '';
}

export interface GraphEditorCoreProps {
  initialDataset?: DataPoint[];
  initialChartType?: 'bar' | 'scatter';
  onSave?: (dataset: DataPoint[], chartType: 'bar' | 'scatter') => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export function GraphEditorCore({
  initialDataset,
  initialChartType = 'bar',
  onSave,
  onCancel,
  showActions = false
}: GraphEditorCoreProps) {
  const [dataset, setDataset] = useState<DataPoint[]>(initialDataset || [
    { id: crypto.randomUUID(), x: 'Group A', y: 12.5 },
    { id: crypto.randomUUID(), x: 'Group B', y: 18.2 },
    { id: crypto.randomUUID(), x: 'Group C', y: 14.1 },
  ]);
  const [chartType, setChartType] = useState<'bar' | 'scatter'>(initialChartType);

  // Calculate some basic descriptive stats
  const stats = useMemo(() => {
    const validY = dataset.map(d => d.y).filter((y): y is number => typeof y === 'number');
    const n = validY.length;
    
    if (n === 0) return { mean: 0, min: 0, max: 0, count: 0 };
    
    const sum = validY.reduce((acc, curr) => acc + curr, 0);
    const mean = sum / n;
    const min = Math.min(...validY);
    const max = Math.max(...validY);

    return { 
      mean: Number(mean.toFixed(2)), 
      min: Number(min.toFixed(2)), 
      max: Number(max.toFixed(2)), 
      count: n 
    };
  }, [dataset]);

  // Derived chart data (formatting numbers to ensure recharts doesn't break)
  const chartData = useMemo(() => {
    return dataset.map(d => ({
      x: d.x,
      y: typeof d.y === 'number' ? d.y : 0
    }));
  }, [dataset]);

  const handleAddRow = () => {
    setDataset([
      ...dataset,
      { id: crypto.randomUUID(), x: `Point ${dataset.length + 1}`, y: 0 }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setDataset(dataset.filter(d => d.id !== id));
  };

  const handleUpdateCell = (id: string, field: 'x' | 'y', value: string) => {
    setDataset(dataset.map(d => {
      if (d.id !== id) return d;
      
      if (field === 'x') {
        return { ...d, x: value };
      } else {
        // Parse float for Y values, allow empty string while typing
        const numVal = value === '' ? '' : parseFloat(value);
        return { ...d, y: isNaN(numVal as number) && value !== '' ? d.y : numVal };
      }
    }));
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      
      {/* Left Pane: Data Grid & Stats */}
      <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flexShrink: 0 }}>
        
        {/* Descriptive Stats Panel */}
        <div style={{ backgroundColor: 'var(--color-bg-sidebar)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>Descriptive Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>N (Count)</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-accent-primary)' }}>{stats.count}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Mean (Y)</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-accent-primary)' }}>{stats.mean}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Min (Y)</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{stats.min}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Max (Y)</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{stats.max}</div>
            </div>
          </div>
        </div>

        {/* Data Entry Grid */}
        <div style={{ flex: 1, backgroundColor: 'var(--color-bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>Dataset</h3>
            <button 
              onClick={handleAddRow}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer' }}
            >
              + Add Row
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-bg-hover)', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', width: '50%' }}>X Value (Label)</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', width: '40%' }}>Y Value (Num)</th>
                  <th style={{ padding: 'var(--space-2)', width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {dataset.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '0' }}>
                      <input 
                        value={row.x}
                        onChange={(e) => handleUpdateCell(row.id, 'x', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-3)', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--font-size-sm)' }}
                      />
                    </td>
                    <td style={{ padding: '0', borderLeft: '1px solid var(--color-border-light)' }}>
                      <input 
                        value={row.y}
                        onChange={(e) => handleUpdateCell(row.id, 'y', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-3)', border: 'none', background: 'transparent', outline: 'none', fontSize: 'var(--font-size-sm)' }}
                      />
                    </td>
                    <td style={{ padding: '0', borderLeft: '1px solid var(--color-border-light)', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleRemoveRow(row.id)}
                        title="Remove Row"
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 'var(--space-2)' }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                {dataset.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                      Empty dataset. Add a row to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Right Pane: Graph View */}
      <div style={{ flex: 1, backgroundColor: 'var(--color-bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Chart ToolBar */}
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-app)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>Data Plot</h2>
          
          <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button 
              onClick={() => setChartType('bar')}
              style={{ padding: 'var(--space-1) var(--space-3)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: chartType === 'bar' ? 'var(--color-bg-surface)' : 'transparent', color: chartType === 'bar' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', boxShadow: chartType === 'bar' ? 'var(--shadow-sm)' : 'none', fontSize: 'var(--font-size-sm)' }}
            >
              Bar Chart
            </button>
            <button 
              onClick={() => setChartType('scatter')}
              style={{ padding: 'var(--space-1) var(--space-3)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: chartType === 'scatter' ? 'var(--color-bg-surface)' : 'transparent', color: chartType === 'scatter' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', boxShadow: chartType === 'scatter' ? 'var(--shadow-sm)' : 'none', fontSize: 'var(--font-size-sm)' }}
            >
              Scatter Plot
            </button>
          </div>
        </div>

        {/* Render Graph Area */}
        <div style={{ flex: 1, padding: 'var(--space-6)' }}>
          {dataset.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
              Enter data to generate graph.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                  <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'var(--color-bg-hover)' }} contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)' }} itemStyle={{ color: 'var(--color-text-primary)' }} />
                  <Bar dataKey="y" name="Value" fill="var(--color-accent-primary)" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              ) : (
                <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                  <XAxis dataKey="x" type="category" allowDuplicatedCategory={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dy={10} />
                  <YAxis dataKey="y" type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)' }} itemStyle={{ color: 'var(--color-text-primary)' }} />
                  <Scatter name="Value Focus" data={chartData} fill="var(--color-accent-primary)" />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Actions (If Modal Mode) */}
        {showActions && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-app)' }}>
            {onCancel && (
              <button 
                onClick={onCancel}
                style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)', background: 'transparent', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
            {onSave && (
              <button 
                onClick={() => onSave(dataset, chartType)}
                style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 'var(--font-weight-medium)' }}
              >
                Save Graph
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
