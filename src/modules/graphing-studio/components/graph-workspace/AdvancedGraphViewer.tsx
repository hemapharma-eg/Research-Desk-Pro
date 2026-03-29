import { useMemo } from 'react';
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
    return renderForestPlot(chartData, options, colorPalette, statResult);
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

function renderForestPlot(data: ChartDataPoint[], options: GraphStyleOptions, palette: string[], statResult?: StatTestResult | null) {
  const meta = statResult && isMetaAnalysisResult(statResult) ? statResult : null;
  const studies: { name: string; effect: number; ci_lower: number; ci_upper: number; weight: number; se: number }[] = [];
  let pooled: { effect: number; ci_lower: number; ci_upper: number } | null = null;
  let hetStats: { I2: number; Q: number; df: number; pValue: number; tau2: number } | null = null;
  let modelLabel = '';
  let pooledZ = 0, pooledP = 0;

  if (meta) {
    meta.studies.forEach(s => {
      studies.push({ name: s.name, effect: s.effectSize, ci_lower: s.ci_lower, ci_upper: s.ci_upper, weight: s.weight, se: s.se });
    });
    pooled = { effect: meta.pooledEffect, ci_lower: meta.pooledCI_lower, ci_upper: meta.pooledCI_upper };
    hetStats = meta.heterogeneity;
    modelLabel = meta.model === 'random' ? 'Overall (Random-Effects)' : 'Overall (Fixed-Effect)';
    pooledZ = meta.statisticValue;
    pooledP = meta.mainPValue;
  } else if (data.length >= 1) {
    data.forEach(d => {
      studies.push({ name: d.name, effect: d.mean, ci_lower: d.ci95_lower, ci_upper: d.ci95_upper, weight: 100 / data.length, se: d.sem });
    });
    if (data.length > 1) {
      const mp = data.reduce((s, d) => s + d.mean, 0) / data.length;
      pooled = { effect: mp, ci_lower: mp - data[0].sem * 1.96, ci_upper: mp + data[0].sem * 1.96 };
    }
    modelLabel = 'Overall';
  }

  if (studies.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Run a meta-analysis first, or map columns with effect sizes.</div>;
  }

  // ────────────────────────────────────────────────
  // LAYOUT — Publication-grade Cochrane/RevMan style
  // ────────────────────────────────────────────────
  // Zones (x): Study [0..190] | Weight [192..250] | Plot [270..730] | ES [95% CI] [745..960]
  const W = 970;
  const ROW_H = 28;
  const nStudies = studies.length;
  const HEADER_Y = 38;
  const BODY_TOP = HEADER_Y + 18;
  const bodyRows = nStudies + (pooled ? 1 : 0);
  const BODY_BOTTOM = BODY_TOP + bodyRows * ROW_H;
  const AXIS_Y = BODY_BOTTOM + 6;
  const FOOTER_Y = AXIS_Y + 52;
  const H = FOOTER_Y + (hetStats ? 36 : 14);

  // Column positions
  const COL_STUDY_X  = 8;
  const COL_WT_X     = 206;
  const PLOT_LEFT    = 270;
  const PLOT_RIGHT   = 730;
  const PLOT_W       = PLOT_RIGHT - PLOT_LEFT;
  const COL_ES_X     = 748;

  // ── X-axis domain ──
  const allCIs = studies.flatMap(s => [s.ci_lower, s.ci_upper]);
  if (pooled) allCIs.push(pooled.ci_lower, pooled.ci_upper);
  let rawMin = Math.min(...allCIs, 0);
  let rawMax = Math.max(...allCIs, 0);

  // Compute "nice" tick intervals
  const rawRange = rawMax - rawMin || 1;
  const rough = rawRange / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  const niceFrac = residual <= 1.5 ? 1 : residual <= 3 ? 2 : residual <= 7 ? 5 : 10;
  const tickStep = niceFrac * mag;
  const axisMin = Math.floor(rawMin / tickStep) * tickStep;
  const axisMax = Math.ceil(rawMax / tickStep) * tickStep;

  const ticks: number[] = [];
  for (let v = axisMin; v <= axisMax + tickStep * 0.01; v += tickStep) {
    ticks.push(Math.round(v * 1e8) / 1e8);
  }
  // Ensure 0 is in ticks
  if (!ticks.some(t => Math.abs(t) < tickStep * 0.01)) ticks.push(0);
  ticks.sort((a, b) => a - b);

  const toX = (v: number) => PLOT_LEFT + PLOT_W * ((v - axisMin) / (axisMax - axisMin));
  const nullX = toX(0);
  const maxWeight = Math.max(...studies.map(s => s.weight), 1);

  // Format number compactly
  const fmt = (n: number, d = 2) => n.toFixed(d);
  const fmtP = (p: number) => p < 0.00001 ? '< 0.00001' : p < 0.0001 ? '< 0.0001' : p < 0.001 ? p.toFixed(5) : p.toFixed(4);

  // ── Colours ──
  const STUDY_COLOR   = '#1a1a2e';  // near-black for study squares
  const CI_COLOR      = '#1a1a2e';
  const DIAMOND_FILL  = '#d62828';
  const DIAMOND_STROKE = '#9b2226';
  const NULL_LINE_COL = '#495057';
  const GRID_COL      = '#dee2e6';
  const HEADER_BG     = '#f1f3f5';
  const ZEBRA_COL     = '#f8f9fa';
  const RULE_COL      = '#adb5bd';
  const TEXT_PRIMARY   = '#212529';
  const TEXT_SECONDARY = '#495057';
  const TEXT_MUTED     = '#868e96';
  const FONT = options.fontFamily || "'Helvetica Neue', Arial, sans-serif";

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: FONT, overflow: 'auto', background: '#fff' }}>
      {options.title && (
        <div style={{ textAlign: 'center', fontSize: options.titleFontSize || 16, fontWeight: 700, color: TEXT_PRIMARY, padding: '10px 0 2px', letterSpacing: '-0.01em' }}>
          {options.title}
        </div>
      )}
      {options.subtitle && (
        <div style={{ textAlign: 'center', fontSize: 12, color: TEXT_MUTED, paddingBottom: 6 }}>{options.subtitle}</div>
      )}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', maxWidth: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
        fontFamily={FONT}
      >
        {/* ═══════════════ HEADER ROW ═══════════════ */}
        <rect x={0} y={HEADER_Y - 14} width={W} height={20} fill={HEADER_BG} />
        <line x1={0} y1={HEADER_Y - 14}  x2={W} y2={HEADER_Y - 14}  stroke={RULE_COL} strokeWidth="0.7" />
        <line x1={0} y1={HEADER_Y + 6}   x2={W} y2={HEADER_Y + 6}   stroke={RULE_COL} strokeWidth="0.7" />
        <text x={COL_STUDY_X}  y={HEADER_Y} fontSize="10" fontWeight="700" fill={TEXT_PRIMARY}>Study</text>
        <text x={COL_WT_X}     y={HEADER_Y} fontSize="10" fontWeight="700" fill={TEXT_PRIMARY}>Weight</text>
        <text x={PLOT_LEFT + PLOT_W / 2} y={HEADER_Y} textAnchor="middle" fontSize="10" fontWeight="700" fill={TEXT_PRIMARY}>{options.xAxisLabel || 'Effect Size'} (95% CI)</text>
        <text x={COL_ES_X}     y={HEADER_Y} fontSize="10" fontWeight="700" fill={TEXT_PRIMARY}>ES [95% CI]</text>

        {/* ═══════════════ NULL-EFFECT LINE ═══════════════ */}
        <line x1={nullX} y1={BODY_TOP} x2={nullX} y2={BODY_BOTTOM} stroke={NULL_LINE_COL} strokeWidth="0.8" strokeDasharray="4 2.5" />

        {/* ═══════════════ STUDY ROWS ═══════════════ */}
        {studies.map((s, i) => {
          const y = BODY_TOP + (i + 0.5) * ROW_H;
          const effectX  = toX(s.effect);
          const rawLeft  = toX(s.ci_lower);
          const rawRight = toX(s.ci_upper);
          const ciLX = Math.max(PLOT_LEFT, rawLeft);
          const ciRX = Math.min(PLOT_RIGHT, rawRight);
          const clippedLeft  = rawLeft  < PLOT_LEFT;
          const clippedRight = rawRight > PLOT_RIGHT;

          // Weight-proportional square: min 5px, max 14px side
          const sqSize = 5 + (s.weight / maxWeight) * 9;

          return (
            <g key={`study-${i}`}>
              {/* Zebra stripe */}
              {i % 2 === 0 && <rect x={0} y={y - ROW_H / 2} width={W} height={ROW_H} fill={ZEBRA_COL} />}

              {/* Study name */}
              <text x={COL_STUDY_X} y={y + 4} fontSize="10" fill={TEXT_PRIMARY}>{s.name}</text>

              {/* Weight % */}
              <text x={COL_WT_X} y={y + 4} fontSize="10" fill={TEXT_SECONDARY}>{fmt(s.weight, 1)}%</text>

              {/* ── CI whisker ── */}
              <line x1={ciLX} y1={y} x2={ciRX} y2={y} stroke={CI_COLOR} strokeWidth="1.2" />

              {/* CI end caps (or arrow if clipped) */}
              {!clippedLeft && <line x1={ciLX} y1={y - 3.5} x2={ciLX}  y2={y + 3.5} stroke={CI_COLOR} strokeWidth="1.2" />}
              {clippedLeft  && <>
                <line x1={PLOT_LEFT + 5} y1={y - 3} x2={PLOT_LEFT} y2={y} stroke={CI_COLOR} strokeWidth="1.2" />
                <line x1={PLOT_LEFT + 5} y1={y + 3} x2={PLOT_LEFT} y2={y} stroke={CI_COLOR} strokeWidth="1.2" />
              </>}
              {!clippedRight && <line x1={ciRX} y1={y - 3.5} x2={ciRX} y2={y + 3.5} stroke={CI_COLOR} strokeWidth="1.2" />}
              {clippedRight  && <>
                <line x1={PLOT_RIGHT - 5} y1={y - 3} x2={PLOT_RIGHT} y2={y} stroke={CI_COLOR} strokeWidth="1.2" />
                <line x1={PLOT_RIGHT - 5} y1={y + 3} x2={PLOT_RIGHT} y2={y} stroke={CI_COLOR} strokeWidth="1.2" />
              </>}

              {/* Effect size square */}
              <rect
                x={effectX - sqSize / 2} y={y - sqSize / 2}
                width={sqSize} height={sqSize}
                fill={STUDY_COLOR} opacity="0.85"
              />

              {/* ES [lower, upper] text */}
              <text x={COL_ES_X} y={y + 4} fontSize="9.5" fill={TEXT_SECONDARY}>
                {fmt(s.effect)} [{fmt(s.ci_lower)}, {fmt(s.ci_upper)}]
              </text>
            </g>
          );
        })}

        {/* ═══════════════ SEPARATOR + POOLED DIAMOND ═══════════════ */}
        {pooled && (() => {
          const sepY = BODY_TOP + nStudies * ROW_H;
          const dy   = BODY_TOP + (nStudies + 0.5) * ROW_H;
          const dLeft   = Math.max(PLOT_LEFT,  toX(pooled.ci_lower));
          const dRight  = Math.min(PLOT_RIGHT, toX(pooled.ci_upper));
          const dCenter = toX(pooled.effect);
          const dHalf   = 7;

          return (
            <g>
              <line x1={0} y1={sepY + 2} x2={W} y2={sepY + 2} stroke={RULE_COL} strokeWidth="0.7" />

              {/* Pooled label */}
              <text x={COL_STUDY_X} y={dy + 4} fontSize="10" fontWeight="700" fill={TEXT_PRIMARY}>{modelLabel}</text>

              {/* Diamond */}
              <polygon
                points={`${dLeft},${dy} ${dCenter},${dy - dHalf} ${dRight},${dy} ${dCenter},${dy + dHalf}`}
                fill={DIAMOND_FILL} stroke={DIAMOND_STROKE} strokeWidth="0.8" strokeLinejoin="miter"
              />

              {/* Pooled ES text */}
              <text x={COL_ES_X} y={dy + 4} fontSize="9.5" fontWeight="700" fill={DIAMOND_FILL}>
                {fmt(pooled.effect)} [{fmt(pooled.ci_lower)}, {fmt(pooled.ci_upper)}]
              </text>

              {/* Bottom rule */}
              <line x1={0} y1={dy + ROW_H / 2 + 2} x2={W} y2={dy + ROW_H / 2 + 2} stroke={RULE_COL} strokeWidth="0.7" />
            </g>
          );
        })()}

        {/* ═══════════════ X AXIS ═══════════════ */}
        <line x1={PLOT_LEFT} y1={AXIS_Y} x2={PLOT_RIGHT} y2={AXIS_Y} stroke={TEXT_SECONDARY} strokeWidth="0.8" />
        {ticks.map((t, i) => {
          const tx = toX(t);
          const isZero = Math.abs(t) < tickStep * 0.001;
          return (
            <g key={`tick-${i}`}>
              <line x1={tx} y1={AXIS_Y} x2={tx} y2={AXIS_Y + 5} stroke={TEXT_SECONDARY} strokeWidth="0.7" />
              {/* Light gridline up through data area */}
              {!isZero && <line x1={tx} y1={BODY_TOP} x2={tx} y2={BODY_BOTTOM} stroke={GRID_COL} strokeWidth="0.4" />}
              <text x={tx} y={AXIS_Y + 16} textAnchor="middle" fontSize="9" fill={TEXT_MUTED}>
                {Math.abs(t) < 0.001 ? '0' : Number.isInteger(t) ? t.toString() : fmt(t, Math.abs(t) < 1 ? 2 : 1)}
              </text>
            </g>
          );
        })}

        {/* Favours labels */}
        <text x={PLOT_LEFT + (nullX - PLOT_LEFT) / 2} y={AXIS_Y + 32} textAnchor="middle" fontSize="9" fill={TEXT_MUTED} fontStyle="italic">
          ← Favours control
        </text>
        <text x={nullX + (PLOT_RIGHT - nullX) / 2} y={AXIS_Y + 32} textAnchor="middle" fontSize="9" fill={TEXT_MUTED} fontStyle="italic">
          Favours treatment →
        </text>

        {/* ═══════════════ FOOTER: HETEROGENEITY + OVERALL TEST ═══════════════ */}
        {hetStats && (
          <text x={COL_STUDY_X} y={FOOTER_Y} fontSize="9" fill={TEXT_MUTED}>
            Heterogeneity: τ² = {fmt(hetStats.tau2, 4)}; χ² = {fmt(hetStats.Q, 2)}, df = {hetStats.df} (P = {fmtP(hetStats.pValue)}); I² = {fmt(hetStats.I2, 1)}%
          </text>
        )}
        {pooled && (
          <text x={COL_STUDY_X} y={FOOTER_Y + (hetStats ? 14 : 0)} fontSize="9" fill={TEXT_MUTED}>
            Test for overall effect: Z = {fmt(pooledZ, 2)} (P {pooledP < 0.00001 ? '< 0.00001' : `= ${fmtP(pooledP)}`})
          </text>
        )}
      </svg>
    </div>
  );
}
