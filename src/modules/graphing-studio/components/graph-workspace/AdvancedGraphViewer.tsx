import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label,
  ResponsiveContainer, Cell
} from 'recharts';
import type { PublicationDataset, VariableMapping } from '../../types/GraphingCoreTypes';
import type { GraphStyleOptions } from '../../types/GraphStyleOptions';
import type { StatTestResult, MetaAnalysisResult } from '../../utils/statService';
import { getDescriptives, cleanData } from '../../utils/statService';
import { jStat } from 'jstat';

interface AdvancedGraphViewerProps {
  dataset: PublicationDataset;
  mapping: VariableMapping;
  options: GraphStyleOptions;
  statResult?: StatTestResult | null;
}

// Type guard
function isMetaAnalysisResult(r: any): r is MetaAnalysisResult {
  return r && 'studies' in r && 'pooledEffect' in r && 'heterogeneity' in r;
}

interface ChartDataPoint {
  name: string;
  values: number[];
  mean: number;
  median: number;
  sd: number;
  sem: number;
  ci95_lower: number;
  ci95_upper: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  iqr: number;
  errorLow: number;
  errorHigh: number;
}

function RichAxisLabel(props: any) {
  const { value, position, style, offset, viewBox, angle } = props;
  if (!value) return null;

  let x = props.x || 0;
  let y = props.y || 0;
  let textAnchor = props.textAnchor || "middle";
  let transform = props.transform || "";

  if (viewBox && typeof viewBox.width === 'number') {
    if (position === 'insideLeft' || position === 'left') {
      x = viewBox.x + (viewBox.width / 2) - (offset || 0) - 15;
      y = viewBox.y + (viewBox.height / 2);
      textAnchor = 'middle';
      transform = `rotate(${angle || -90}, ${x}, ${y})`;
    } else if (position === 'insideBottom' || position === 'bottom') {
      x = viewBox.x + (viewBox.width / 2);
      y = viewBox.y + viewBox.height + (offset || 0) + 15;
      textAnchor = 'middle';
      if (angle) {
        transform = `rotate(${angle}, ${x}, ${y})`;
      }
    }
  }

  // Render ^X as superscript and _X as subscript
  const parts: { text: string; sub?: boolean; sup?: boolean }[] = [];
  let currentStr = '';
  let i = 0;
  while (i < value.length) {
    if (value.startsWith('^{', i)) {
      if (currentStr) parts.push({ text: currentStr });
      currentStr = '';
      i += 2;
      const end = value.indexOf('}', i);
      if (end !== -1) { parts.push({ text: value.slice(i, end), sup: true }); i = end + 1; }
      else { currentStr += '^{'; i += 2; }
    } else if (value.startsWith('_{', i)) {
      if (currentStr) parts.push({ text: currentStr });
      currentStr = '';
      i += 2;
      const end = value.indexOf('}', i);
      if (end !== -1) { parts.push({ text: value.slice(i, end), sub: true }); i = end + 1; }
      else { currentStr += '_{'; i += 2; }
    } else {
      currentStr += value[i];
      i++;
    }
  }
  if (currentStr) parts.push({ text: currentStr });

  return (
    <text x={x} y={y} textAnchor={textAnchor || "middle"} transform={transform} style={style}>
      {parts.map((p, idx) => (
        <tspan
          key={idx}
          baselineShift={p.sup ? 'super' : p.sub ? 'sub' : 'baseline'}
          fontSize={p.sup || p.sub ? '0.7em' : '1em'}
        >
          {p.text}
        </tspan>
      ))}
    </text>
  );
}

// Custom Bar renderer that natively overlays one-directional error bars
// This guarantees exact visual alignment since Recharts provides pixel x, y, width, height for each bar!
function CustomBarWithErrors(props: any) {
  const { x, y, width, height, value, payload, fill, options } = props;
  const { errorRange } = payload;
  const outlineColor = (options.customBarOutlineColors || {})[payload.name] || options.barOutlineColor || '#333';
  
  // Guard against 0 height or missing error bars
  let pxPerUnit = 0;
  if (value && height) {
    pxPerUnit = Math.abs(height / value);
  } else if (height === 0 && Array.isArray(errorRange)) {
     // If the bar value is exactly 0 but has errors, finding pxPerUnit requires accessing the Y-axis scale.
     // Without scale, we can't draw errors for value=0 but usually publication plots don't have this isolated edge case.
  }

  const errLowPx = (errorRange?.[0] || 0) * (pxPerUnit || 0);
  const errHighPx = (errorRange?.[1] || 0) * (pxPerUnit || 0);

  const cx = x + width / 2;
  const topY = value >= 0 ? y : y + height;
  const capW = (options.errorBarCapWidth || 6) / 2;

  return (
    <g>
      <rect 
        x={x} y={y} width={width} height={height} 
        fill={fill} 
        fillOpacity={options.barOpacity} 
        stroke={outlineColor} 
        strokeWidth={1} 
        rx={options.barRadius || 0} ry={options.barRadius || 0} 
        shapeRendering="crispEdges"
      />
      {options.errorBarType !== 'none' && pxPerUnit > 0 && (
        <g stroke="#333" strokeWidth={1.5}>
          {options.errorBarDirection !== 'down' && errHighPx > 0 && (
            <>
              <line x1={cx} y1={topY} x2={cx} y2={topY - errHighPx} />
              <line x1={cx - capW} y1={topY - errHighPx} x2={cx + capW} y2={topY - errHighPx} />
            </>
          )}
          {options.errorBarDirection !== 'up' && errLowPx > 0 && (
            <>
              <line x1={cx} y1={topY} x2={cx} y2={topY + errLowPx} />
              <line x1={cx - capW} y1={topY + errLowPx} x2={cx + capW} y2={topY + errLowPx} />
            </>
          )}
        </g>
      )}
    </g>
  );
}

export function AdvancedGraphViewer({ dataset, mapping, options, statResult }: AdvancedGraphViewerProps) {
  const chartData = useMemo(() => {
    return mapping.dependentParamIds.map((colId, idx) => {
      const col = dataset.columns.find(c => c.id === colId);
      if (!col) return null;
      const values = dataset.rows
        .map(row => {
          const cells = row.cells[colId];
          if (!cells || cells.length === 0) return NaN;
          const val = cells[0]?.value;
          return typeof val === 'number' ? val : Number(val);
        })
        .filter(v => !isNaN(v));
      const desc = getDescriptives(col.title, values);
      const clean = cleanData(values);
      const errorLow = options.errorBarType === 'SD' ? desc.sd : options.errorBarType === 'SEM' ? desc.sem : options.errorBarType === 'CI95' ? (desc.mean - desc.ci95_lower) : 0;
      const errorHigh = errorLow;
      return {
        name: col.title,
        values: clean,
        mean: desc.mean,
        median: desc.median,
        sd: desc.sd,
        sem: desc.sem,
        ci95_lower: desc.ci95_lower,
        ci95_upper: desc.ci95_upper,
        q1: desc.q1,
        q3: desc.q3,
        min: desc.min,
        max: desc.max,
        iqr: desc.iqr,
        errorLow,
        errorHigh,
        _idx: idx,
      } as ChartDataPoint & { _idx: number };
    }).filter((d): d is ChartDataPoint & { _idx: number } => d !== null);
  }, [dataset, mapping, options.errorBarType]);

  if (chartData.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
        Map columns to dependent variables to see a graph.
      </div>
    );
  }

  const { chartType, colorPalette, showGridlines, fontFamily, fontSize, showLegend, legendPosition } = options;
  const commonAxisProps = {
    tick: { fontSize, fontFamily, fill: '#333' },
    tickLine: { stroke: '#999' },
    axisLine: { stroke: '#666' },
  };
  const yDomain: [number | string, number | string] = [options.yAxisMin ?? 'auto', options.yAxisMax ?? 'auto'];
  const xAngle = options.xAxisTickRotation;
  const topMargin = options.showAnnotations ? 20 + Math.max(0, -(options.annotationYOffset || 0)) : 20;

  // --- BAR CHARTS (bar, grouped-bar, bar-points) ---
  if (['bar', 'grouped-bar', 'bar-points', 'stacked-bar', 'stacked-bar-100'].includes(chartType)) {
    const rechartsData = chartData.map((d, i) => {
      let eRange = [d.errorLow, d.errorHigh];
      if (options.errorBarDirection === 'up') eRange = [0, d.errorHigh];
      if (options.errorBarDirection === 'down') eRange = [d.errorLow, 0];
      
      return {
        name: d.name,
        value: d.mean,
        errorRange: eRange,
        fill: options.customBarColors?.[d.name] || colorPalette[i % colorPalette.length],
      };
    });

    const legendPayload = rechartsData.map(d => ({
      value: d.name,
      type: 'square' as const,
      color: d.fill
    }));

    return (
      <div style={{ width: '100%', height: '100%', fontFamily, padding: '16px' }}>
        {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', fontFamily, marginBottom: '4px' }}>{options.title}</div>}
        {options.subtitle && <div style={{ textAlign: 'center', fontSize: fontSize, color: '#666', fontFamily, marginBottom: '8px' }}>{options.subtitle}</div>}
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={rechartsData} margin={{ top: topMargin, right: 30, left: 40, bottom: xAngle ? 60 : 40 }} barCategoryGap={`${(1 - options.barWidth) * 50}%`}>
            {showGridlines && <CartesianGrid strokeDasharray="3 3" opacity={0.4} />}
            <XAxis dataKey="name" angle={xAngle} textAnchor={xAngle ? 'end' : 'middle'} {...commonAxisProps}>
              {options.xAxisLabel && <Label value={options.xAxisLabel} content={<RichAxisLabel />} position="bottom" offset={(xAngle ? 20 : 0) + (options.xAxisLabelOffset || 0)} style={{ fontSize, fontFamily, fill: '#333' }} />}
            </XAxis>
            <YAxis domain={yDomain} scale={options.yAxisLogScale ? 'log' : 'auto'} {...commonAxisProps}>
              {options.yAxisLabel && <Label value={options.yAxisLabel} content={<RichAxisLabel />} position="insideLeft" angle={-90} offset={options.yAxisLabelOffset || 0} style={{ fontSize, fontFamily, fill: '#333' }} />}
            </YAxis>
            <Tooltip />
            {showLegend && (
              <Legend 
                layout={options.legendLayout || (legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal')}
                verticalAlign={legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle'} 
                align={legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center'} 
                wrapperStyle={{ transform: `translate(${options.legendOffsetX || 0}px, ${options.legendOffsetY || 0}px)` }}
                content={(props) => {
                  const { align } = props;
                  const layoutFlexDirection = options.legendLayout || (legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal') === 'vertical' ? 'column' : 'row';
                  const halign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
                  return (
                    <ul style={{ 
                      listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '16px', fontSize: '12px',
                      flexDirection: layoutFlexDirection, 
                      justifyContent: layoutFlexDirection === 'row' ? halign : 'flex-start',
                      alignItems: layoutFlexDirection === 'column' ? (legendPosition === 'right' ? 'flex-end' : 'flex-start') : 'center',
                    }}>
                      {legendPayload.map((entry, index) => {
                        const cellOutline = (options.customBarOutlineColors || {})[String(entry.value)] || options.barOutlineColor || '#333';
                        return (
                          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: entry.color, borderRadius: '2px', outline: `1px solid ${cellOutline}` }} />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{entry.value}</span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }}
              />
            )}
            <Bar dataKey="value" name="Mean" shape={<CustomBarWithErrors options={options} />}>
              {rechartsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Overlay individual points for bar-points */}
        {(chartType === 'bar-points' || options.showPoints) && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            {/* Individual points are approximated via SVG overlay */}
            <svg style={{ width: '100%', height: '100%' }}>
              {chartData.map((group, gi) => {
                const barAreaWidth = 0.7;
                const totalPlotWidth = 0.8;
                const xCenter = ((gi + 0.5) / chartData.length) * totalPlotWidth * 100 + 10;
                return group.values.map((v, vi) => {
                  const jitter = (Math.random() - 0.5) * barAreaWidth * 8;
                  const yMax = Math.max(...chartData.flatMap(d => d.values));
                  const yFrac = yMax > 0 ? (1 - v / (yMax * 1.2)) * 75 + 10 : 50;
                  return (
                    <circle
                      key={`pt-${gi}-${vi}`}
                      cx={`${xCenter + jitter}%`}
                      cy={`${yFrac}%`}
                      r={options.pointSize / 2}
                      fill={options.customPointColors?.[group.name] || colorPalette[gi % colorPalette.length]}
                      opacity={options.pointOpacity}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  );
                });
              })}
            </svg>
          </div>
        )}
      </div>
    );
  }

  // --- LINE CHARTS (line, grouped-line) ---
  if (['line', 'grouped-line'].includes(chartType)) {
    const lineData = chartData[0]?.values.map((_, rowIdx) => {
      const point: Record<string, number | string> = { name: `${rowIdx + 1}` };
      chartData.forEach(g => { point[g.name] = g.values[rowIdx] ?? 0; });
      return point;
    }) || [];

    return (
      <div style={{ width: '100%', height: '100%', fontFamily, padding: '16px' }}>
        {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', fontFamily, marginBottom: '4px' }}>{options.title}</div>}
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={lineData} margin={{ top: topMargin, right: 30, left: 40, bottom: 40 }}>
            {showGridlines && <CartesianGrid strokeDasharray="3 3" opacity={0.4} />}
            <XAxis dataKey="name" {...commonAxisProps}>
              {options.xAxisLabel && <Label value={options.xAxisLabel} content={<RichAxisLabel />} position="bottom" offset={options.xAxisLabelOffset || 0} style={{ fontSize, fontFamily, fill: '#333' }} />}
            </XAxis>
            <YAxis domain={yDomain} {...commonAxisProps}>
              {options.yAxisLabel && <Label value={options.yAxisLabel} content={<RichAxisLabel />} position="insideLeft" angle={-90} offset={options.yAxisLabelOffset || 0} style={{ fontSize, fontFamily, fill: '#333' }} />}
            </YAxis>
            <Tooltip />
            {showLegend && (
              <Legend 
                layout={options.legendLayout || (legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal')}
                verticalAlign={legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle'} 
                align={legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center'} 
                wrapperStyle={{ transform: `translate(${options.legendOffsetX || 0}px, ${options.legendOffsetY || 0}px)` }}
              />
            )}
            {chartData.map((g, i) => (
              <Line key={g.name} type="monotone" dataKey={g.name} stroke={colorPalette[i % colorPalette.length]}
                strokeWidth={options.lineThickness}
                strokeDasharray={options.lineStyle === 'dashed' ? '8 4' : options.lineStyle === 'dotted' ? '2 4' : undefined}
                dot={options.showPoints ? { r: options.pointSize / 2, fill: colorPalette[i % colorPalette.length] } : false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // --- SCATTER (scatter, scatter-fit, dose-response) ---
  if (['scatter', 'scatter-fit', 'dose-response'].includes(chartType)) {
    const len = Math.min(chartData[0]?.values.length || 0, chartData[1]?.values.length || 0);
    const scatterData = Array.from({ length: len }, (_, i) => ({
      x: chartData[0]?.values[i] ?? 0,
      y: chartData[1]?.values[i] ?? 0,
    }));

    const xs = scatterData.map(d => d.x);
    const ys = scatterData.map(d => d.y);
    const xMin = xs.length ? Math.min(...xs) : 0, xMax = xs.length ? Math.max(...xs) : 1;
    const yMin = ys.length ? Math.min(...ys) : 0, yMax = ys.length ? Math.max(...ys) : 1;

    // Compute regression line for scatter-fit
    let fitLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
    let sigmoidCurve: { x: number; y: number }[] | null = null;

    if (chartType === 'scatter-fit' && scatterData.length > 2) {
      const meanX = jStat.mean(xs), meanY = jStat.mean(ys);
      let ssxy = 0, ssxx = 0;
      for (let i = 0; i < xs.length; i++) {
        ssxy += (xs[i] - meanX) * (ys[i] - meanY);
        ssxx += (xs[i] - meanX) ** 2;
      }
      const slope = ssxx > 0 ? ssxy / ssxx : 0;
      const intercept = meanY - slope * meanX;
      fitLine = { x1: xMin, y1: intercept + slope * xMin, x2: xMax, y2: intercept + slope * xMax };
    } else if (chartType === 'dose-response' && scatterData.length > 2) {
      // Placeholder sigmoidal curve: Y = Bottom + (Top-Bottom)/(1+10^((LogEC50-X)*HillSlope))
      const top = yMax;
      const bottom = yMin;
      const logEC50 = (xMax + xMin) / 2;
      const hillSlope = 1.0; // Assume standard slope
      sigmoidCurve = [];
      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const xPos = xMin + (xMax - xMin) * (i / steps);
        // Logistic growth (pseudo-sigmoid since X might not be log-transformed)
        const denominator = 1 + Math.pow(10, (logEC50 - xPos) * hillSlope);
        const yPos = bottom + (top - bottom) / denominator;
        sigmoidCurve.push({ x: xPos, y: yPos });
      }
    }

    return (
      <div style={{ width: '100%', height: '100%', fontFamily, padding: '16px', position: 'relative' }}>
        {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', fontFamily, marginBottom: '4px' }}>{options.title}</div>}
        <ResponsiveContainer width="100%" height="90%">
          <ScatterChart margin={{ top: topMargin, right: 30, left: 40, bottom: 40 }}>
            {showGridlines && <CartesianGrid strokeDasharray="3 3" opacity={0.4} />}
            <XAxis dataKey="x" type="number" name={chartData[0]?.name || 'X'} domain={['auto', 'auto']} {...commonAxisProps}>
              {options.xAxisLabel && <Label value={options.xAxisLabel} content={<RichAxisLabel />} position="bottom" offset={options.xAxisLabelOffset || 0} style={{ fontSize, fontFamily, fill: '#333' }} />}
            </XAxis>
            <YAxis dataKey="y" type="number" name={chartData[1]?.name || 'Y'} domain={yDomain} {...commonAxisProps}>
              {options.yAxisLabel && <Label value={options.yAxisLabel} content={<RichAxisLabel />} position="insideLeft" angle={-90} offset={options.yAxisLabelOffset || 0} style={{ fontSize, fontFamily, fill: '#333' }} />}
            </YAxis>
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {showLegend && (
              <Legend 
                layout={options.legendLayout || (legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal')}
                verticalAlign={legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle'} 
                align={legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center'} 
                wrapperStyle={{ transform: `translate(${options.legendOffsetX || 0}px, ${options.legendOffsetY || 0}px)` }}
              />
            )}
            
            {/* Draw Sigmoidal overlay as an invisible line so it takes coordinate space correctly using Recharts Line. Wait, ScatterChart doesn't easily support Line overlay with math curve, but we can fake it by adding a second scatter dataset and using a continuous line! */}
            {chartType === 'dose-response' && sigmoidCurve && (
               <Scatter name="Fitted Curve" data={sigmoidCurve} line={{ stroke: '#f5222d', strokeWidth: 2 }} shape={<></>} isAnimationActive={false} />
            )}

            <Scatter name="Data" data={scatterData} fill={colorPalette[0]}>
              {scatterData.map((_, idx) => (
                <Cell key={idx} fill={colorPalette[0]} opacity={options.pointOpacity} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {/* Fit line overlay (SVG absolute) was previously here, but Recharts handles line overlays natively via `<Scatter line />` */}
        {fitLine && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '11px', color: '#666', background: 'rgba(255,255,255,0.8)', padding: '2px 4px', borderRadius: '4px' }}>Linear Fit: y = {((fitLine.y2 - fitLine.y1) / (fitLine.x2 - fitLine.x1) || 0).toFixed(2)}x + {(fitLine.y1 - ((fitLine.y2 - fitLine.y1) / (fitLine.x2 - fitLine.x1) || 0) * fitLine.x1).toFixed(2)}</div>
          </div>
        )}
      </div>
    );
  }

  // --- BOX PLOT (Custom SVG) ---
  if (['box', 'box-points'].includes(chartType)) {
    return renderBoxPlot(chartData, options, colorPalette, chartType === 'box-points');
  }

  // --- VIOLIN PLOT (Custom SVG with KDE) ---
  if (['violin', 'violin-points'].includes(chartType)) {
    return renderViolinPlot(chartData, options, colorPalette, chartType === 'violin-points');
  }

  // --- HISTOGRAM ---
  if (chartType === 'histogram') {
    return renderHistogram(chartData, options, colorPalette);
  }

  // --- BEFORE-AFTER & SLOPE GRAPH ---
  if (['before-after', 'slope-graph'].includes(chartType)) {
    return renderBeforeAfter(chartData, options, colorPalette);
  }

  // --- DOT PLOT / STRIP PLOT ---
  if (['dot-plot', 'strip-plot'].includes(chartType)) {
    return renderStripPlot(chartData, options, colorPalette, chartType === 'strip-plot');
  }

  // --- FOREST PLOT ---
  if (chartType === 'forest') {
    return <ForestPlotRenderer data={chartData} options={options} palette={colorPalette} statResult={statResult} />;
  }

  // Fallback : bar chart
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
      Chart type "{chartType}" rendering not yet available.
    </div>
  );
}

// ========== Custom Renderers ==========

function renderBoxPlot(data: ChartDataPoint[], options: GraphStyleOptions, palette: string[], showPoints: boolean) {
  const customTopMargin = options.showAnnotations ? 60 + Math.max(0, -(options.annotationYOffset || 0)) : 60;
  const padding = { top: customTopMargin, right: 40, bottom: 50, left: 60 };
  const totalW = 800, totalH = 500;
  const plotW = totalW - padding.left - padding.right;
  const plotH = totalH - padding.top - padding.bottom;

  const yMin = Math.min(...data.map(d => d.min));
  const yMax = Math.max(...data.map(d => d.max));
  const yRange = yMax - yMin || 1;
  const yPadded = yRange * 0.1;
  const yBottom = yMin - yPadded, yTop = yMax + yPadded;

  const toY = (v: number) => padding.top + plotH * (1 - (v - yBottom) / (yTop - yBottom));
  const barW = Math.min(60, plotW / data.length * 0.6);

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: options.fontFamily }}>
      {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', marginBottom: 4 }}>{options.title}</div>}
      <svg width="100%" height="100%" viewBox={`0 0 ${totalW} ${totalH}`}>
        {/* Grid */}
        {options.showGridlines && Array.from({ length: 6 }, (_, i) => {
          const y = padding.top + (plotH / 5) * i;
          return <line key={i} x1={padding.left} y1={y} x2={totalW - padding.right} y2={y} stroke="#E5E7EB" />;
        })}
        {/* Y axis */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={totalH - padding.bottom} stroke="#666" />
        {Array.from({ length: 6 }, (_, i) => {
          const val = yBottom + ((yTop - yBottom) / 5) * (5 - i);
          const y = padding.top + (plotH / 5) * i;
          return <text key={i} x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#666">{val.toFixed(1)}</text>;
        })}
        {options.yAxisLabel && <text x={15} y={totalH / 2} transform={`rotate(-90, 15, ${totalH / 2})`} textAnchor="middle" fontSize="12" fill="#333">{options.yAxisLabel}</text>}

        {/* Boxes */}
        {data.map((d, i) => {
          const cx = padding.left + (plotW / data.length) * (i + 0.5);
          const q1Y = toY(d.q1), q3Y = toY(d.q3), medY = toY(d.median);
          const whiskerLow = toY(Math.max(d.min, d.q1 - 1.5 * d.iqr));
          const whiskerHigh = toY(Math.min(d.max, d.q3 + 1.5 * d.iqr));
          const fill = palette[i % palette.length];

          return (
            <g key={i}>
              {/* Whiskers */}
              <line x1={cx} y1={whiskerHigh} x2={cx} y2={q3Y} stroke="#333" strokeWidth="1" />
              <line x1={cx} y1={q1Y} x2={cx} y2={whiskerLow} stroke="#333" strokeWidth="1" />
              <line x1={cx - barW * 0.3} y1={whiskerHigh} x2={cx + barW * 0.3} y2={whiskerHigh} stroke="#333" strokeWidth="1" />
              <line x1={cx - barW * 0.3} y1={whiskerLow} x2={cx + barW * 0.3} y2={whiskerLow} stroke="#333" strokeWidth="1" />
              {/* Box */}
              <rect x={cx - barW / 2} y={q3Y} width={barW} height={Math.max(1, q1Y - q3Y)} fill={fill} fillOpacity={options.barOpacity} stroke={options.barOutlineColor || '#333'} strokeWidth="1" />
              {/* Median */}
              <line x1={cx - barW / 2} y1={medY} x2={cx + barW / 2} y2={medY} stroke="#333" strokeWidth="2" />
              {/* Label */}
              <text x={cx} y={totalH - padding.bottom + 20} textAnchor="middle" fontSize="12" fill="#333">{d.name}</text>

              {/* Individual points */}
              {showPoints && d.values.map((v, vi) => (
                <circle key={vi} cx={cx + (Math.random() - 0.5) * barW * 0.6} cy={toY(v)} r={options.pointSize / 2} fill={fill} opacity={options.pointOpacity} stroke="white" strokeWidth="0.5" />
              ))}

              {/* Outliers */}
              {d.values.filter(v => v < d.q1 - 1.5 * d.iqr || v > d.q3 + 1.5 * d.iqr).map((v, oi) => (
                <circle key={`o-${oi}`} cx={cx} cy={toY(v)} r="3" fill="none" stroke="#333" strokeWidth="1" />
              ))}
            </g>
          );
        })}

        {options.xAxisLabel && <RichAxisLabel x={totalW / 2} y={totalH - 5} value={options.xAxisLabel} textAnchor="middle" style={{fontSize: 12, fill: '#333'}} />}
      </svg>
    </div>
  );
}

function renderViolinPlot(data: ChartDataPoint[], options: GraphStyleOptions, palette: string[], showPoints: boolean) {
  const customTopMargin = options.showAnnotations ? 60 + Math.max(0, -(options.annotationYOffset || 0)) : 60;
  const padding = { top: customTopMargin, right: 40, bottom: 50, left: 60 };
  const totalW = 800, totalH = 500;
  const plotW = totalW - padding.left - padding.right;
  const plotH = totalH - padding.top - padding.bottom;

  const yMin = Math.min(...data.map(d => d.min));
  const yMax = Math.max(...data.map(d => d.max));
  const yRange = yMax - yMin || 1;
  const yPadded = yRange * 0.1;
  const yBottom = yMin - yPadded, yTop = yMax + yPadded;
  const toY = (v: number) => padding.top + plotH * (1 - (v - yBottom) / (yTop - yBottom));
  const maxW = Math.min(80, plotW / data.length * 0.7);

  // KDE function
  const kde = (values: number[], bandwidth: number, nPoints: number = 50): { y: number; density: number }[] => {
    const min = Math.min(...values), max = Math.max(...values);
    const step = (max - min) / nPoints;
    return Array.from({ length: nPoints + 1 }, (_, i) => {
      const y = min + step * i;
      let density = 0;
      values.forEach(v => {
        const u = (y - v) / bandwidth;
        density += Math.exp(-0.5 * u * u) / (bandwidth * Math.sqrt(2 * Math.PI));
      });
      density /= values.length;
      return { y, density };
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: options.fontFamily }}>
      {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', marginBottom: 4 }}>{options.title}</div>}
      <svg width="100%" height="100%" viewBox={`0 0 ${totalW} ${totalH}`}>
        {options.showGridlines && Array.from({ length: 6 }, (_, i) => {
          const y = padding.top + (plotH / 5) * i;
          return <line key={i} x1={padding.left} y1={y} x2={totalW - padding.right} y2={y} stroke="#E5E7EB" />;
        })}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={totalH - padding.bottom} stroke="#666" />
        {Array.from({ length: 6 }, (_, i) => {
          const val = yBottom + ((yTop - yBottom) / 5) * (5 - i);
          const y = padding.top + (plotH / 5) * i;
          return <text key={i} x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#666">{val.toFixed(1)}</text>;
        })}

        {data.map((d, i) => {
          const cx = padding.left + (plotW / data.length) * (i + 0.5);
          const fill = palette[i % palette.length];
          const bw = d.sd * 0.4 || 0.5;
          const kdeData = kde(d.values, bw);
          const maxDensity = Math.max(...kdeData.map(k => k.density)) || 1;

          // Build polygon path
          const leftPath = kdeData.map(k => `${cx - (k.density / maxDensity) * maxW / 2},${toY(k.y)}`).join(' ');
          const rightPath = [...kdeData].reverse().map(k => `${cx + (k.density / maxDensity) * maxW / 2},${toY(k.y)}`).join(' ');

          return (
            <g key={i}>
              <polygon points={`${leftPath} ${rightPath}`} fill={fill} fillOpacity={options.barOpacity} stroke={fill} strokeWidth="1" />
              {/* Median + quartile lines inside violin */}
              <line x1={cx - maxW * 0.15} y1={toY(d.median)} x2={cx + maxW * 0.15} y2={toY(d.median)} stroke="#333" strokeWidth="2" />
              <line x1={cx} y1={toY(d.q1)} x2={cx} y2={toY(d.q3)} stroke="#333" strokeWidth="3" />
              {/* Individual points */}
              {showPoints && d.values.map((v, vi) => (
                <circle key={vi} cx={cx + (Math.random() - 0.5) * maxW * 0.3} cy={toY(v)} r={options.pointSize / 2} fill="white" opacity={options.pointOpacity} stroke={fill} strokeWidth="1" />
              ))}
              <text x={cx} y={totalH - padding.bottom + 20} textAnchor="middle" fontSize="12" fill="#333">{d.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function renderHistogram(data: ChartDataPoint[], options: GraphStyleOptions, palette: string[]) {
  // Use first group only
  const values = data[0]?.values || [];
  if (values.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No data for histogram.</div>;

  const nBins = Math.max(5, Math.ceil(Math.sqrt(values.length)));
  const min = Math.min(...values), max = Math.max(...values);
  const binWidth = (max - min) / nBins || 1;
  const bins: { x: number; count: number }[] = [];
  for (let i = 0; i < nBins; i++) {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    const count = values.filter(v => i === nBins - 1 ? (v >= lo && v <= hi) : (v >= lo && v < hi)).length;
    bins.push({ x: lo, count });
  }

  const rechartsData = bins.map(b => ({
    name: `${b.x.toFixed(1)}`,
    count: b.count,
  }));

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: options.fontFamily, padding: '16px' }}>
      {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', marginBottom: 4 }}>{options.title}</div>}
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={rechartsData} margin={{ top: options.showAnnotations ? 20 + Math.max(0, -(options.annotationYOffset || 0)) : 20, right: 30, left: 40, bottom: 40 }} barCategoryGap="0%">
          {options.showGridlines && <CartesianGrid strokeDasharray="3 3" opacity={0.4} />}
          <XAxis dataKey="name">
            {options.xAxisLabel && <Label value={options.xAxisLabel} content={<RichAxisLabel />} position="bottom" offset={options.xAxisLabelOffset || 0} style={{ fill: '#333' }} />}
          </XAxis>
          <YAxis>
            {options.yAxisLabel ? <Label value={options.yAxisLabel} content={<RichAxisLabel />} position="insideLeft" angle={-90} offset={options.yAxisLabelOffset || 0} style={{ fill: '#333' }} /> : <Label value="Frequency" content={<RichAxisLabel />} position="insideLeft" angle={-90} offset={options.yAxisLabelOffset || 0} style={{ fill: '#333' }} />}
          </YAxis>
          <Tooltip />
          <Bar dataKey="count" fill={palette[0]} fillOpacity={options.barOpacity} stroke={options.barOutlineColor || '#333'} strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function renderBeforeAfter(data: ChartDataPoint[], options: GraphStyleOptions, palette: string[]) {
  if (data.length < 2) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Need at least 2 groups for before–after plot.</div>;
  const n = Math.min(data[0].values.length, data[1].values.length);
  const customTopMargin = options.showAnnotations ? 60 + Math.max(0, -(options.annotationYOffset || 0)) : 60;
  const padding = { top: customTopMargin, right: 60, bottom: 50, left: 60 };
  const totalW = 800, totalH = 500;
  const plotW = totalW - padding.left - padding.right;
  const plotH = totalH - padding.top - padding.bottom;
  const allVals = [...data[0].values, ...data[1].values];
  const yMin = Math.min(...allVals), yMax = Math.max(...allVals);
  const yRange = yMax - yMin || 1;
  const yBottom = yMin - yRange * 0.1, yTop = yMax + yRange * 0.1;
  const toY = (v: number) => padding.top + plotH * (1 - (v - yBottom) / (yTop - yBottom));
  const x1 = padding.left + plotW * 0.25;
  const x2 = padding.left + plotW * 0.75;

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: options.fontFamily }}>
      {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', marginBottom: 4 }}>{options.title}</div>}
      <svg width="100%" height="100%" viewBox={`0 0 ${totalW} ${totalH}`}>
        {options.showGridlines && Array.from({ length: 6 }, (_, i) => {
          const y = padding.top + (plotH / 5) * i;
          return <line key={i} x1={padding.left} y1={y} x2={totalW - padding.right} y2={y} stroke="#E5E7EB" />;
        })}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={totalH - padding.bottom} stroke="#666" />
        {Array.from({ length: n }, (_, i) => {
          const color = data[0].values[i] <= data[1].values[i] ? '#16A34A' : '#DC2626';
          return (
            <g key={i}>
              <line x1={x1} y1={toY(data[0].values[i])} x2={x2} y2={toY(data[1].values[i])} stroke={color} strokeWidth={options.lineThickness} opacity={0.6} />
              <circle cx={x1} cy={toY(data[0].values[i])} r={options.pointSize} fill={palette[0]} stroke="white" strokeWidth="1" />
              <circle cx={x2} cy={toY(data[1].values[i])} r={options.pointSize} fill={palette[1]} stroke="white" strokeWidth="1" />
            </g>
          );
        })}
        <text x={x1} y={totalH - padding.bottom + 20} textAnchor="middle" fontSize="12" fill="#333">{data[0].name}</text>
        <text x={x2} y={totalH - padding.bottom + 20} textAnchor="middle" fontSize="12" fill="#333">{data[1].name}</text>
      </svg>
    </div>
  );
}

function renderStripPlot(data: ChartDataPoint[], options: GraphStyleOptions, palette: string[], jitter: boolean) {
  const customTopMargin = options.showAnnotations ? 60 + Math.max(0, -(options.annotationYOffset || 0)) : 60;
  const padding = { top: customTopMargin, right: 40, bottom: 50, left: 60 };
  const totalW = 800, totalH = 500;
  const plotW = totalW - padding.left - padding.right;
  const plotH = totalH - padding.top - padding.bottom;
  const allVals = data.flatMap(d => d.values);
  const yMin = Math.min(...allVals), yMax = Math.max(...allVals);
  const yRange = yMax - yMin || 1;
  const yBottom = yMin - yRange * 0.1, yTop = yMax + yRange * 0.1;
  const toY = (v: number) => padding.top + plotH * (1 - (v - yBottom) / (yTop - yBottom));

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: options.fontFamily }}>
      {options.title && <div style={{ textAlign: 'center', fontSize: options.titleFontSize, fontWeight: 'bold', marginBottom: 4 }}>{options.title}</div>}
      <svg width="100%" height="100%" viewBox={`0 0 ${totalW} ${totalH}`}>
        {options.showGridlines && Array.from({ length: 6 }, (_, i) => {
          const y = padding.top + (plotH / 5) * i;
          return <line key={i} x1={padding.left} y1={y} x2={totalW - padding.right} y2={y} stroke="#E5E7EB" />;
        })}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={totalH - padding.bottom} stroke="#666" />
        {Array.from({ length: 6 }, (_, i) => {
          const val = yBottom + ((yTop - yBottom) / 5) * (5 - i);
          const y = padding.top + (plotH / 5) * i;
          return <text key={i} x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#666">{val.toFixed(1)}</text>;
        })}

        {data.map((d, gi) => {
          const cx = padding.left + (plotW / data.length) * (gi + 0.5);
          const fill = palette[gi % palette.length];
          const spread = jitter ? 20 : 0;
          return (
            <g key={gi}>
              {/* Mean line */}
              <line x1={cx - 20} y1={toY(d.mean)} x2={cx + 20} y2={toY(d.mean)} stroke="#333" strokeWidth="2" />
              {/* Points */}
              {d.values.map((v, vi) => (
                <circle key={vi} cx={cx + (jitter ? (Math.random() - 0.5) * spread : 0)} cy={toY(v)} r={options.pointSize} fill={fill} opacity={options.pointOpacity} stroke="white" strokeWidth="0.5" />
              ))}
              <text x={cx} y={totalH - padding.bottom + 20} textAnchor="middle" fontSize="12" fill="#333">{d.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

import { recalculateMetaAnalysis, type MetaAnalysisStudy } from '../../utils/statService';

export function ForestPlotRenderer({ data, options, palette, statResult }: { data: ChartDataPoint[], options: GraphStyleOptions, palette: string[], statResult?: StatTestResult | null }) {
  const meta = statResult && isMetaAnalysisResult(statResult) ? statResult : null;
  const [excludedStudies, setExcludedStudies] = useState<Set<string>>(new Set());
  const [showRawCols, setShowRawCols] = useState(false);

  if (!meta) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Run a meta-analysis first, then select Forest Plot.</div>;
  if (meta.studies.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>No studies available.</div>;

  const activeStudies = meta.studies.filter(s => !excludedStudies.has(s.name));
  const recalc = useMemo(() => recalculateMetaAnalysis(activeStudies, meta.model), [activeStudies, meta.model]);
  const isRatio = ['RR', 'OR', 'HR'].includes(meta.effectMeasure);
  const isDichotomous = meta.dataType === 'dichotomous';

  const studiesToRender = meta.studies.map(s => {
    const isActive = !excludedStudies.has(s.name);
    let weight = 0;
    if (isActive && recalc) {
      const idx = activeStudies.findIndex(a => a.name === s.name);
      weight = idx >= 0 ? recalc.weights[idx] : 0;
    }
    return { ...s, isActive, weight };
  });

  const n = studiesToRender.length;

  // ─── PROPORTIONAL LAYOUT (all in viewBox units) ───
  // The viewBox is sized to content — NO height stretching.
  const ROW = 24;
  const HDR = 36;
  const TOP = HDR + 4;
  const SEP = TOP + n * ROW;
  const SUM = SEP + 4;
  const AX = SUM + ROW + 12;
  const H = AX + 54;

  const W = showRawCols ? 960 : 820;
  const C_STUDY = 4;
  const STUDY_W = showRawCols ? 150 : 130;

  // Raw data columns (optional)
  let RAW_END = STUDY_W;
  let C_ET = 0, C_NT = 0, C_EC = 0, C_NC = 0, C_SDT = 0, C_SDC = 0;
  if (showRawCols && isDichotomous) {
    C_ET = STUDY_W + 14; C_NT = C_ET + 34; C_EC = C_NT + 38; C_NC = C_EC + 34;
    RAW_END = C_NC + 24;
  } else if (showRawCols && !isDichotomous) {
    C_ET = STUDY_W + 14; C_SDT = C_ET + 38; C_NT = C_SDT + 34;
    C_EC = C_NT + 38; C_SDC = C_EC + 38; C_NC = C_SDC + 34;
    RAW_END = C_NC + 24;
  }

  // Right-side columns: | ... Plot ... | gap | RR [95% CI] | gap | Weight |
  const WT_W = 44;                    // weight column width
  const WT_X = W - 4;                 // weight right-align anchor
  const ES_RIGHT = W - WT_W - 8;      // right edge of effect text
  const ES_X = ES_RIGHT - 2;          // effect text right-align anchor
  const PLOT_R = ES_RIGHT - 130;      // leave ~130px for effect text like "0.60 [0.34, 1.07]"
  const PLOT_L = RAW_END + 8;
  const PLOT_W = Math.max(PLOT_R - PLOT_L, 50);

  // ─── SCALE ───
  function niceStep(rough: number): number {
    if (rough <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const r = rough / mag;
    return (r <= 1.5 ? 1 : r <= 3 ? 2 : r <= 7 ? 5 : 10) * mag;
  }

  const allCIs = activeStudies.flatMap(s => [s.ci_lower, s.ci_upper]);
  if (recalc) allCIs.push(recalc.pooledCI_lower, recalc.pooledCI_upper);
  let dMin = allCIs.length ? Math.min(...allCIs) : -1;
  let dMax = allCIs.length ? Math.max(...allCIs) : 1;
  if (dMin > 0) dMin = 0;
  if (dMax < 0) dMax = 0;
  const dataPad = Math.max((dMax - dMin) * 0.08, 0.05);
  dMin -= dataPad; dMax += dataPad;

  let toX: (v: number) => number;
  let ticks: { v: number; label: string }[] = [];

  if (isRatio) {
    const eMin = Math.exp(dMin), eMax = Math.exp(dMax);
    const candidates = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    const tv = candidates.filter(t => t >= eMin * 0.85 && t <= eMax * 1.15);
    if (!tv.includes(1)) tv.push(1);
    tv.sort((a, b) => a - b);
    const aMin = Math.log(tv[0] || 0.1), aMax = Math.log(tv[tv.length - 1] || 10);
    const range = aMax - aMin || 1;
    toX = (v: number) => PLOT_L + PLOT_W * ((v - aMin) / range);
    ticks = tv.map(t => ({ v: Math.log(t), label: String(t) }));
  } else {
    const range = dMax - dMin || 1;
    const step = niceStep(range / 5);
    const aMin = Math.floor(dMin / step) * step;
    const aMax = Math.ceil(dMax / step) * step;
    for (let v = aMin; v <= aMax + step * 0.001; v += step) {
      const rv = Math.round(v * 1e6) / 1e6;
      ticks.push({ v: rv, label: Math.abs(rv) < 1e-9 ? '0' : rv.toFixed(Math.abs(rv) < 1 ? 2 : 1) });
    }
    if (!ticks.some(t => Math.abs(t.v) < step * 0.01)) ticks.push({ v: 0, label: '0' });
    ticks.sort((a, b) => a.v - b.v);
    toX = (v: number) => PLOT_L + PLOT_W * ((v - aMin) / (aMax - aMin || 1));
  }

  const nullX = toX(0);
  const maxWt = recalc && recalc.weights.length ? Math.max(...recalc.weights) : 1;
  const fmt = (n: number, d = 2) => n.toFixed(d);
  const expFmt = (v: number) => isRatio ? Math.exp(v).toFixed(2) : v.toFixed(2);

  const toggleStudy = (name: string) => setExcludedStudies(prev => {
    const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s;
  });

  const TXT = '#1d2939';
  const TXT2 = '#475467';
  const RULE = '#d0d5dd';
  const BLUE = '#2563eb';
  const DIAM = '#0b7285';
  const ZEBRA = '#f8fafc';
  const HDR_BG = '#eef1f6';

  const xLabel = isRatio
    ? (meta.effectMeasure === 'OR' ? 'Odds Ratio (Log Scale)' : meta.effectMeasure === 'HR' ? 'Hazard Ratio (Log Scale)' : 'Relative Risk (Log Scale)')
    : (meta.effectMeasure === 'SMD' ? 'Standardized Mean Difference' : 'Mean Difference');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif" }}>
      {/* SVG — sized to content, fills width, height auto from aspect ratio */}
      <div id="forest-plot-export" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '8px' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: '100%' }} xmlns="http://www.w3.org/2000/svg">

          {/* ═══ HEADER ═══ */}
          <rect x={0} y={0} width={W} height={HDR} fill={HDR_BG} />
          <line x1={0} y1={HDR} x2={W} y2={HDR} stroke={RULE} strokeWidth="0.7" />
          <text x={C_STUDY} y={22} fontSize="11" fontWeight="700" fill={TXT}>Study</text>

          {showRawCols && isDichotomous && (<>
            <text x={(C_ET + C_NT)/2 + 5} y={11} textAnchor="middle" fontSize="9" fontWeight="700" fill={TXT}>Experimental</text>
            <text x={C_ET + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Events</text>
            <text x={C_NT + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Total</text>
            <text x={(C_EC + C_NC)/2 + 5} y={11} textAnchor="middle" fontSize="9" fontWeight="700" fill={TXT}>Control</text>
            <text x={C_EC + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Events</text>
            <text x={C_NC + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Total</text>
          </>)}
          {showRawCols && !isDichotomous && (<>
            <text x={(C_ET + C_NT)/2 + 5} y={11} textAnchor="middle" fontSize="9" fontWeight="700" fill={TXT}>Experimental</text>
            <text x={C_ET + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Mean</text>
            <text x={C_SDT + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>SD</text>
            <text x={C_NT + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Total</text>
            <text x={(C_EC + C_NC)/2 + 5} y={11} textAnchor="middle" fontSize="9" fontWeight="700" fill={TXT}>Control</text>
            <text x={C_EC + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Mean</text>
            <text x={C_SDC + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>SD</text>
            <text x={C_NC + 5} y={28} textAnchor="end" fontSize="8.5" fill={TXT2}>Total</text>
          </>)}

          <text x={PLOT_L + PLOT_W/2} y={22} textAnchor="middle" fontSize="10" fontWeight="700" fill={TXT}>
            {meta.effectMeasure} IV, {meta.model === 'random' ? 'Random' : 'Fixed'}, 95% CI
          </text>
          <text x={ES_X} y={16} textAnchor="end" fontSize="9.5" fontWeight="700" fill={TXT}>{meta.effectMeasure}</text>
          <text x={ES_X} y={29} textAnchor="end" fontSize="8" fill={TXT2}>[95% CI]</text>
          <text x={WT_X} y={22} textAnchor="end" fontSize="9.5" fontWeight="700" fill={TXT}>Weight</text>



          {/* ═══ STUDY ROWS ═══ */}
          {studiesToRender.map((s, i) => {
            const y = TOP + i * ROW + ROW / 2;
            const eff = toX(s.effectSize);
            const lx = Math.max(PLOT_L, toX(s.ci_lower));
            const rx = Math.min(PLOT_R, toX(s.ci_upper));
            const sq = s.isActive && maxWt > 0 ? Math.max(4, 4 + (s.weight / maxWt) * 10) : 3;
            const op = s.isActive ? 1 : 0.22;

            return (
              <g key={i} opacity={op}>
                {i % 2 === 0 && <rect x={0} y={y - ROW/2} width={W} height={ROW} fill={ZEBRA} />}
                <text x={C_STUDY} y={y + 4} fontSize="10.5" fill={TXT}>{s.name}</text>

                {showRawCols && isDichotomous && (<>
                  <text x={C_ET + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.a ?? '–'}</text>
                  <text x={C_NT + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.n1 ?? '–'}</text>
                  <text x={C_EC + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.c ?? '–'}</text>
                  <text x={C_NC + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.n2 ?? '–'}</text>
                </>)}
                {showRawCols && !isDichotomous && (<>
                  <text x={C_ET + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.m1 != null ? fmt(s.raw.m1) : '–'}</text>
                  <text x={C_SDT + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.s1 != null ? fmt(s.raw.s1) : '–'}</text>
                  <text x={C_NT + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.nt ?? '–'}</text>
                  <text x={C_EC + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.m2 != null ? fmt(s.raw.m2) : '–'}</text>
                  <text x={C_SDC + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.s2 != null ? fmt(s.raw.s2) : '–'}</text>
                  <text x={C_NC + 5} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>{s.raw?.nc ?? '–'}</text>
                </>)}

                {s.isActive && isFinite(s.effectSize) && isFinite(s.ci_lower) && isFinite(s.ci_upper) && (
                  <>
                    <line x1={lx} y1={y} x2={rx} y2={y} stroke={TXT} strokeWidth="1.1" />
                    <line x1={lx} y1={y - 3} x2={lx} y2={y + 3} stroke={TXT} strokeWidth="0.8" />
                    <line x1={rx} y1={y - 3} x2={rx} y2={y + 3} stroke={TXT} strokeWidth="0.8" />
                    <rect x={eff - sq/2} y={y - sq/2} width={sq} height={sq} fill={BLUE} />
                  </>
                )}

                <text x={ES_X} y={y + 4} textAnchor="end" fontSize="10" fill={TXT}>
                  {expFmt(s.effectSize)} [{expFmt(s.ci_lower)}, {expFmt(s.ci_upper)}]
                </text>
                <text x={WT_X} y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill={TXT}>{s.isActive ? fmt(s.weight, 1) + '%' : '–'}</text>
              </g>
            );
          })}

          {/* ═══ TOTAL / SUMMARY ═══ */}
          {recalc && (() => {
            const y = SUM + ROW / 2;
            // Diamond: center at pooled effect, left/right at CI bounds
            const cc = toX(recalc.pooledEffect);
            const dl = Math.max(PLOT_L, toX(recalc.pooledCI_lower));
            const dr = Math.min(PLOT_R, toX(recalc.pooledCI_upper));
            const dh = 8; // half-height of diamond

            let eT = 0, cT = 0;
            activeStudies.forEach(s => {
              eT += isDichotomous ? (s.raw?.n1 || 0) : (s.raw?.nt || 0);
              cT += isDichotomous ? (s.raw?.n2 || 0) : (s.raw?.nc || 0);
            });

            return (
              <g>
                <line x1={0} y1={SEP} x2={W} y2={SEP} stroke={RULE} strokeWidth="0.7" />
                <text x={C_STUDY} y={y + 4} fontSize="10.5" fontWeight="700" fill={TXT}>Total (95% CI)</text>

                {showRawCols && (<>
                  <text x={(isDichotomous ? C_NT : C_NT) + 5} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" fill={TXT}>{eT}</text>
                  <text x={(isDichotomous ? C_NC : C_NC) + 5} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" fill={TXT}>{cT}</text>
                </>)}

                {/* ◆ DIAMOND — proper publication-grade shape */}
                {dl <= dr && (
                  <polygon
                    points={`${dl},${y} ${cc},${y - dh} ${dr},${y} ${cc},${y + dh}`}
                    fill={DIAM} stroke={DIAM} strokeWidth="0.5" strokeLinejoin="miter"
                  />
                )}

                <text x={ES_X} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" fill={TXT}>
                  {expFmt(recalc.pooledEffect)} [{expFmt(recalc.pooledCI_lower)}, {expFmt(recalc.pooledCI_upper)}]
                </text>
                <text x={WT_X} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" fill={TXT}>100.0%</text>
              </g>
            );
          })()}

          {/* ═══ NULL EFFECT LINE — rendered last so it sits on top of zebra stripes ═══ */}
          <line x1={nullX} y1={TOP - 2} x2={nullX} y2={SUM + ROW + 4} stroke="#344054" strokeWidth="1.0" strokeDasharray="6 3" />

          {/* ═══ X AXIS ═══ */}
          <line x1={PLOT_L} y1={AX} x2={PLOT_R} y2={AX} stroke={TXT} strokeWidth="0.7" />
          {ticks.map((t, i) => {
            const tx = toX(t.v);
            if (tx < PLOT_L - 1 || tx > PLOT_R + 1) return null;
            return (
              <g key={i}>
                <line x1={tx} y1={AX} x2={tx} y2={AX + 4} stroke={TXT} strokeWidth="0.7" />
                <text x={tx} y={AX + 15} textAnchor="middle" fontSize="9.5" fill={TXT}>{t.label}</text>
              </g>
            );
          })}
          <text x={PLOT_L + PLOT_W/2} y={AX + 30} textAnchor="middle" fontSize="10" fill={TXT2}>{xLabel}</text>
          <text x={PLOT_L + (nullX - PLOT_L)/2} y={AX + 42} textAnchor="middle" fontSize="9" fill={TXT2}>Favours Treatment</text>
          <text x={nullX + (PLOT_R - nullX)/2} y={AX + 42} textAnchor="middle" fontSize="9" fill={TXT2}>Favours Control</text>

          {/* Heterogeneity */}
          {recalc && recalc.heterogeneity && (
            <text x={C_STUDY} y={H - 4} fontSize="8.5" fill={TXT2}>
              Heterogeneity: Tau² = {fmt(recalc.heterogeneity.tau2, 2)}; Chi² = {fmt(recalc.heterogeneity.Q, 2)}, df = {recalc.heterogeneity.df} (P = {recalc.heterogeneity.pValue < 0.0001 ? '< 0.0001' : fmt(recalc.heterogeneity.pValue, 4)}); I² = {fmt(recalc.heterogeneity.I2, 0)}%
            </text>
          )}
        </svg>
      </div>

      {/* ═══ CONTROLS (not exported) ═══ */}
      <div data-no-export="true" style={{ padding: '6px 10px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: TXT2, cursor: 'pointer', background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #d0d5dd' }}>
          <input type="checkbox" checked={showRawCols} onChange={() => setShowRawCols(!showRawCols)} style={{ accentColor: BLUE }} />
          Show Raw Data
        </label>
        <span style={{ fontSize: '10px', fontWeight: 700, color: TXT2, textTransform: 'uppercase' }}>Include:</span>
        {meta.studies.map(s => {
          const on = !excludedStudies.has(s.name);
          return (
            <label key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: on ? TXT : '#98a2b3', cursor: 'pointer', background: on ? '#eff8ff' : '#f2f4f7', padding: '2px 6px', borderRadius: '3px', border: `1px solid ${on ? '#b2ddff' : '#e4e7ec'}` }}>
              <input type="checkbox" checked={on} onChange={() => toggleStudy(s.name)} style={{ cursor: 'pointer', accentColor: BLUE, width: '11px', height: '11px' }} />
              {s.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}
