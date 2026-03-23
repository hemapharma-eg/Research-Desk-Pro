import { useMemo } from 'react';
import { 
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar, Cell, Label
} from 'recharts';
import type { PublicationDataset, VariableMapping } from '../../types/GraphingCoreTypes';
import type { GraphStyleOptions } from '../../types/GraphStyleOptions';
import { getDescriptives } from '../../utils/statService';
import type { StatTestResult, DescriptiveStats } from '../../utils/statService';

interface AggregatedPoint {
  name: string;
  mean: number;
  error: number;
  desc: DescriptiveStats;
}

interface ScatterPoint {
  name: string;
  group: string;
  y: number;
}

interface AdvancedGraphViewerProps {
  dataset: PublicationDataset;
  mapping: VariableMapping;
  options: GraphStyleOptions;
  statResult: StatTestResult | null;
}

export function AdvancedGraphViewer({ dataset, mapping, options }: AdvancedGraphViewerProps) {
  
  // Aggregated data for Bar/Line charts
  const aggregatedData = useMemo((): AggregatedPoint[] => {
    if (mapping.dependentParamIds.length === 0) return [];
    const columns = dataset.columns.filter(c => mapping.dependentParamIds.includes(c.id));
    
    return columns.map(col => {
      const rawValues = dataset.rows.map(r => Number(r.cells[col.id]?.[0]?.value)).filter(v => !isNaN(v));
      const desc = getDescriptives(col.title, rawValues);
      
      let errorVal = 0;
      if (options.errorBarType === 'sd') errorVal = desc.sd;
      else if (options.errorBarType === 'sem') errorVal = desc.sem;
      else if (options.errorBarType === 'ci') errorVal = desc.ci95_upper - desc.mean;

      return { name: col.title, mean: desc.mean, error: errorVal, desc };
    });
  }, [dataset, mapping, options.errorBarType]);

  // Raw point data for Scatter charts
  const scatterData = useMemo((): ScatterPoint[] => {
    if (mapping.dependentParamIds.length === 0) return [];
    const columns = dataset.columns.filter(c => mapping.dependentParamIds.includes(c.id));
    const points: ScatterPoint[] = [];
    columns.forEach(col => {
      dataset.rows.forEach(r => {
        const val = Number(r.cells[col.id]?.[0]?.value);
        if (!isNaN(val)) {
          points.push({ name: col.title, group: col.title, y: val });
        }
      });
    });
    return points;
  }, [dataset, mapping]);

  // If no columns mapped
  if (mapping.dependentParamIds.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
        Please assign Dependent Variables (Y) in the Data Workspace to see the graph.
      </div>
    );
  }

  const axisStyle = { fill: '#475569', fontSize: 13 };
  const yDomain: [string | number, string | number] = 
    options.yAxisMin !== '' && options.yAxisMax !== '' && options.yAxisMin !== undefined && options.yAxisMax !== undefined 
      ? [options.yAxisMin, options.yAxisMax] 
      : ['auto', 'auto'];

  const renderBarChart = () => (
    <BarChart data={aggregatedData} margin={{ top: 40, right: 30, left: 20, bottom: 40 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
      <XAxis dataKey="name" axisLine={{ stroke: '#94A3B8' }} tickLine={{ stroke: '#94A3B8' }} tick={axisStyle} dy={10}>
        {options.xAxisTitle && <Label value={options.xAxisTitle} offset={-20} position="insideBottom" style={{ fill: '#0F172A', fontWeight: 'bold' }} />}
      </XAxis>
      <YAxis domain={yDomain} axisLine={{ stroke: '#94A3B8' }} tickLine={{ stroke: '#94A3B8' }} tick={axisStyle}>
        {options.yAxisTitle && <Label value={options.yAxisTitle} angle={-90} position="insideLeft" style={{ fill: '#0F172A', fontWeight: 'bold' }} />}
      </YAxis>
      <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
      <Bar dataKey="mean" barSize={60}>
        {aggregatedData.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={options.colorPalette[index % options.colorPalette.length]} />
        ))}
        {options.errorBarType !== 'none' && (
          <ErrorBar dataKey="error" width={8} strokeWidth={1.5} stroke="#0F172A" />
        )}
      </Bar>
    </BarChart>
  );

  const renderLineChart = () => (
    <LineChart data={aggregatedData} margin={{ top: 40, right: 30, left: 20, bottom: 40 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
      <XAxis dataKey="name" axisLine={{ stroke: '#94A3B8' }} tickLine={{ stroke: '#94A3B8' }} tick={axisStyle} dy={10} />
      <YAxis domain={yDomain} axisLine={{ stroke: '#94A3B8' }} tickLine={{ stroke: '#94A3B8' }} tick={axisStyle} />
      <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
      <Line type="monotone" dataKey="mean" stroke={options.colorPalette[0]} strokeWidth={3} dot={{ r: 6, fill: options.colorPalette[0], strokeWidth: 2, stroke: 'white' }}>
        {options.errorBarType !== 'none' && (
          <ErrorBar dataKey="error" width={6} strokeWidth={1.5} stroke={options.colorPalette[0]} />
        )}
      </Line>
    </LineChart>
  );

  const renderScatterChart = () => {
    const uniqueGroups = Array.from(new Set(scatterData.map(d => d.name)));
    return (
      <ScatterChart margin={{ top: 40, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" type="category" allowDuplicatedCategory={false} axisLine={{ stroke: '#94A3B8' }} tickLine={{ stroke: '#94A3B8' }} tick={axisStyle} dy={10} />
        <YAxis dataKey="y" type="number" domain={yDomain} axisLine={{ stroke: '#94A3B8' }} tickLine={{ stroke: '#94A3B8' }} tick={axisStyle} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Data" data={scatterData} fill={options.colorPalette[0]}>
          {scatterData.map((point, index) => {
            const gIndex = uniqueGroups.indexOf(point.name);
            return <Cell key={`cell-${index}`} fill={options.colorPalette[gIndex % options.colorPalette.length]} />;
          })}
        </Scatter>
      </ScatterChart>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ textAlign: 'center', margin: '16px 0 0 0', fontSize: '18px', color: '#0F172A', fontWeight: 'bold' }}>
        {options.chartTitle}
      </h2>
      
      <div style={{ flex: 1, padding: '16px', minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {options.chartType === 'bar' ? renderBarChart()
           : options.chartType === 'line' ? renderLineChart()
           : renderScatterChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
