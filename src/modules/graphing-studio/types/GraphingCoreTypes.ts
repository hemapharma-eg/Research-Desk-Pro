/**
 * Core Types for the Publication Graphing and Statistical Analysis Studio
 */

export type TableFormat = 'column' | 'grouped' | 'xy' | 'contingency' | 'survival' | 'parts-of-whole';

export interface DataColumn {
  id: string; // Unique ID for column e.g. "col-1"
  title: string; // "Control", "Treatment A", "Time (hrs)", etc.
  subcolumns: number; // e.g. 1 for simple Y, 3 for triplicates, or 2 for Mean/SD
  subcolumnHeaders?: string[]; // e.g. ["Control Rep 1", "Control Rep 2"] or ["Mean", "SD", "N"]
  isX?: boolean; // True if this column represents X values (only applicable in XY or Grouped formats)
}

export interface DataCell {
  id: string; // cell uuid
  value: string | number | null; // The raw or entered value (can be missing)
  isExcluded?: boolean; // User excluded this point from analysis without deleting
}

export interface DataRow {
  id: string;
  rowName?: string; // Grouped table row labels e.g. "Male", "Female"
  cells: Record<string, DataCell[]>; // Map of Column ID to array of cells per subcolumn
}

export interface PublicationDataset {
  id: string;
  name: string;
  format: TableFormat;
  columns: DataColumn[];
  rows: DataRow[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    notes?: string;
  };
}

export interface VariableMapping {
  independentParamIds: string[]; // X Variable or Factor 1
  dependentParamIds: string[]; // Y Values or Measurements
  groupFactorIds?: string[]; // Factor 2
  subjectIds?: string; // For paired/repeated measures
}

// Global Application state slice for a project
export interface GraphingStudioState {
  datasets: PublicationDataset[];
  activeDatasetId: string | null;
  // Further additions for analyses and plots will go here
}
