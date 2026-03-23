export interface GraphStyleOptions {
  chartType: 'bar' | 'scatter' | 'line' | 'box' | 'violin';
  errorBarType: 'none' | 'sd' | 'sem' | 'ci';
  colorPalette: string[];
  showAnnotations: boolean;
  annotationStyle: 'stars' | 'p-value';
  yAxisMin?: number | '';
  yAxisMax?: number | '';
  yAxisTitle: string;
  xAxisTitle: string;
  chartTitle: string;
}

export const DEFAULT_STYLE_OPTIONS: GraphStyleOptions = {
  chartType: 'bar',
  errorBarType: 'sem',
  colorPalette: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
  showAnnotations: true,
  annotationStyle: 'stars',
  yAxisTitle: 'Values',
  xAxisTitle: 'Groups',
  chartTitle: 'Analysis Graph'
};
