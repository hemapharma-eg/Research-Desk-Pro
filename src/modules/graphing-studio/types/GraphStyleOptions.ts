/**
 * Graph Style Options — Full Publication Configuration
 */

export type ChartType =
  | 'bar' | 'grouped-bar' | 'stacked-bar' | 'stacked-bar-100'
  | 'line' | 'grouped-line'
  | 'scatter' | 'scatter-fit'
  | 'box' | 'violin'
  | 'histogram' | 'dot-plot' | 'strip-plot'
  | 'before-after' | 'slope-graph'
  | 'bar-points' | 'box-points' | 'violin-points' | 'dose-response'
  | 'forest';

export type ErrorBarType = 'none' | 'SD' | 'SEM' | 'CI95';
export type AnnotationStyle = 'stars' | 'p-value' | 'letters';
export type PointShape = 'circle' | 'square' | 'triangle' | 'diamond';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export interface GraphStyleOptions {
  chartType: ChartType;
  title: string;
  subtitle: string;
  xAxisLabel: string;
  yAxisLabel: string;

  // Error bars
  errorBarType: ErrorBarType;
  errorBarCapWidth: number;
  errorBarDirection: 'both' | 'up' | 'down';

  // Annotation
  showAnnotations: boolean;
  annotationStyle: AnnotationStyle;
  annotationYOffset?: number;
  annotationBracketSpacing?: number;

  // Colors
  colorPalette: string[];
  customBarColors?: Record<string, string>;
  customBarOutlineColors?: Record<string, string>;
  customPointColors?: Record<string, string>;

  // Points
  showPoints: boolean;
  pointSize: number;
  pointShape: PointShape;
  pointOpacity: number;

  // Lines
  lineThickness: number;
  lineStyle: LineStyle;

  // Bars
  barWidth: number;
  barOpacity: number;
  barOutlineColor: string;

  // Legend
  legendPosition: LegendPosition;
  showLegend: boolean;
  legendLayout: 'horizontal' | 'vertical';
  legendOffsetX: number;
  legendOffsetY: number;

  // Axes
  yAxisMin: number | null;
  yAxisMax: number | null;
  yAxisLogScale: boolean;
  xAxisTickRotation: number;
  xAxisLabelOffset: number;
  yAxisLabelOffset: number;
  showGridlines: boolean;

  // Typography
  fontSize: number;
  fontFamily: string;
  titleFontSize: number;

  // Background
  backgroundColor: string;
  frameVisible: boolean;

  // Orientation
  graphOrientation: 'landscape' | 'portrait';
}

export const DEFAULT_STYLE_OPTIONS: GraphStyleOptions = {
  chartType: 'bar',
  title: '',
  subtitle: '',
  xAxisLabel: '',
  yAxisLabel: '',
  errorBarType: 'SEM',
  errorBarCapWidth: 6,
  errorBarDirection: 'both',
  showAnnotations: true,
  annotationStyle: 'stars',
  annotationYOffset: 0,
  annotationBracketSpacing: 18,
  colorPalette: ['#2962FF', '#FF6D00', '#00C853', '#AA00FF', '#FFD600', '#D50000', '#00BFA5', '#6200EA'],
  customBarColors: {},
  customBarOutlineColors: {},
  customPointColors: {},
  showPoints: false,
  pointSize: 5,
  pointShape: 'circle',
  pointOpacity: 0.8,
  lineThickness: 2,
  lineStyle: 'solid',
  barWidth: 0.6,
  barOpacity: 0.85,
  barOutlineColor: '#333333',
  legendPosition: 'top',
  showLegend: true,
  legendLayout: 'horizontal',
  legendOffsetX: 0,
  legendOffsetY: 0,
  yAxisMin: null,
  yAxisMax: null,
  yAxisLogScale: false,
  xAxisTickRotation: 0,
  xAxisLabelOffset: 0,
  yAxisLabelOffset: 0,
  showGridlines: true,
  fontSize: 12,
  fontFamily: 'Arial, sans-serif',
  titleFontSize: 16,
  backgroundColor: '#FFFFFF',
  frameVisible: true,
  graphOrientation: 'landscape',
};
