import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import type { PublicationDataset, VariableMapping, DataColumn, DataRow } from './types/GraphingCoreTypes';
import type { GraphStyleOptions } from './types/GraphStyleOptions';
import { DEFAULT_STYLE_OPTIONS } from './types/GraphStyleOptions';
import type { StatTestResult } from './utils/statService';
import type { GraphingDatasetRow, GraphingFigureRow, GraphingAnalysisRow } from '../../types/electron.d';

// ===================== Tab Types =====================
export type StudioTab = 'data' | 'analyze' | 'graph' | 'annotate' | 'report' | 'export' | 'assembler';

export interface AssemblerState {
  layout: '1x2' | '2x1' | '2x2' | '1x3' | '3x1';
  slots: (string | null)[];
  showLabels: boolean;
}

const DEFAULT_ASSEMBLER_STATE: AssemblerState = {
  layout: '1x2',
  slots: [null, null],
  showLabels: true,
};

// ===================== State =====================
export interface GraphingStudioState {
  // Project-level
  datasetList: GraphingDatasetRow[];
  figureList: GraphingFigureRow[];
  analysisList: GraphingAnalysisRow[];
  isLoadingList: boolean;

  // Active workspace
  activeTab: StudioTab;
  activeDatasetId: string | null;
  showDashboard: boolean;

  // Active dataset (in-memory working copy)
  dataset: PublicationDataset | null;
  mapping: VariableMapping;

  // Analysis
  statResult: StatTestResult | null;

  // Graph
  options: GraphStyleOptions;

  // Assembler
  assemblerState: AssemblerState;

  // UI flags
  isSaving: boolean;
  error: string | null;
}

const INITIAL_STATE: GraphingStudioState = {
  datasetList: [],
  figureList: [],
  analysisList: [],
  isLoadingList: true,
  activeTab: 'data',
  activeDatasetId: null,
  showDashboard: true,
  dataset: null,
  mapping: { independentParamIds: [], dependentParamIds: [] },
  statResult: null,
  options: DEFAULT_STYLE_OPTIONS,
  assemblerState: DEFAULT_ASSEMBLER_STATE,
  isSaving: false,
  error: null,
};

// ===================== Actions =====================
type Action =
  | { type: 'SET_DATASET_LIST'; payload: GraphingDatasetRow[] }
  | { type: 'SET_FIGURE_LIST'; payload: GraphingFigureRow[] }
  | { type: 'SET_ANALYSIS_LIST'; payload: GraphingAnalysisRow[] }
  | { type: 'SET_LOADING_LIST'; payload: boolean }
  | { type: 'SET_TAB'; payload: StudioTab }
  | { type: 'SET_ACTIVE_DATASET_ID'; payload: string | null }
  | { type: 'SET_SHOW_DASHBOARD'; payload: boolean }
  | { type: 'SET_DATASET'; payload: PublicationDataset | null }
  | { type: 'SET_MAPPING'; payload: VariableMapping }
  | { type: 'SET_STAT_RESULT'; payload: StatTestResult | null }
  | { type: 'SET_OPTIONS'; payload: GraphStyleOptions }
  | { type: 'SET_ASSEMBLER_STATE'; payload: AssemblerState }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'OPEN_DATASET'; payload: { dataset: PublicationDataset; mapping: VariableMapping; id: string; options: GraphStyleOptions; assemblerState: AssemblerState } }
  | { type: 'CLOSE_DATASET' };

function reducer(state: GraphingStudioState, action: Action): GraphingStudioState {
  switch (action.type) {
    case 'SET_DATASET_LIST': return { ...state, datasetList: action.payload };
    case 'SET_FIGURE_LIST': return { ...state, figureList: action.payload };
    case 'SET_ANALYSIS_LIST': return { ...state, analysisList: action.payload };
    case 'SET_LOADING_LIST': return { ...state, isLoadingList: action.payload };
    case 'SET_TAB': return { ...state, activeTab: action.payload };
    case 'SET_ACTIVE_DATASET_ID': return { ...state, activeDatasetId: action.payload };
    case 'SET_SHOW_DASHBOARD': return { ...state, showDashboard: action.payload };
    case 'SET_DATASET': return { ...state, dataset: action.payload };
    case 'SET_MAPPING': return { ...state, mapping: action.payload };
    case 'SET_STAT_RESULT': return { ...state, statResult: action.payload };
    case 'SET_OPTIONS': return { ...state, options: action.payload };
    case 'SET_ASSEMBLER_STATE': return { ...state, assemblerState: action.payload };
    case 'SET_SAVING': return { ...state, isSaving: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'OPEN_DATASET':
      return {
        ...state,
        activeDatasetId: action.payload.id,
        dataset: action.payload.dataset,
        mapping: action.payload.mapping,
        options: action.payload.options,
        assemblerState: action.payload.assemblerState,
        showDashboard: false,
        activeTab: 'data',
        statResult: null,
      };
    case 'CLOSE_DATASET':
      return { ...state, activeDatasetId: null, dataset: null, mapping: { independentParamIds: [], dependentParamIds: [] }, showDashboard: true, statResult: null, options: DEFAULT_STYLE_OPTIONS, assemblerState: DEFAULT_ASSEMBLER_STATE };
    default: return state;
  }
}

// ===================== Context =====================
interface GraphingStudioContextValue {
  state: GraphingStudioState;
  dispatch: React.Dispatch<Action>;
  // Convenience actions
  loadDatasetList: () => Promise<void>;
  loadFigureList: () => Promise<void>;
  openDataset: (id: string) => Promise<void>;
  createNewDataset: (name: string, format: string) => Promise<void>;
  saveDataset: () => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  saveAnalysis: (result: StatTestResult) => Promise<void>;
}

const GraphingStudioContext = createContext<GraphingStudioContextValue | undefined>(undefined);

// ===================== Helper: DB row → in-memory types =====================
function rowToDataset(row: GraphingDatasetRow): PublicationDataset {
  return {
    id: row.id,
    name: row.name,
    format: row.format as PublicationDataset['format'],
    columns: JSON.parse(row.columns_json || '[]'),
    rows: JSON.parse(row.rows_json || '[]'),
    metadata: {
      ...JSON.parse(row.metadata_json || '{}'),
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    },
  };
}

function datasetToRow(ds: PublicationDataset, mapping: VariableMapping, options: GraphStyleOptions, assemblerState?: AssemblerState): Partial<GraphingDatasetRow> {
  return {
    name: ds.name,
    format: ds.format,
    columns_json: JSON.stringify(ds.columns),
    rows_json: JSON.stringify(ds.rows),
    metadata_json: JSON.stringify({ ...ds.metadata, options, assemblerState }),
    variable_mapping_json: JSON.stringify(mapping),
  };
}

function defaultColumns(): DataColumn[] {
  return [
    { id: `col-${crypto.randomUUID()}`, title: 'Group 1', subcolumns: 1 },
    { id: `col-${crypto.randomUUID()}`, title: 'Group 2', subcolumns: 1 },
    { id: `col-${crypto.randomUUID()}`, title: 'Group 3', subcolumns: 1 },
  ];
}

function defaultRows(columns: DataColumn[]): DataRow[] {
  return Array.from({ length: 5 }, () => ({
    id: `row-${crypto.randomUUID()}`,
    cells: Object.fromEntries(columns.map(c => [c.id, [{ id: crypto.randomUUID(), value: null }]])),
  }));
}

// ===================== Provider =====================
export function GraphingStudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const loadDatasetList = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_LIST', payload: true });
    try {
      const res = await window.api.getGraphingDatasets();
      if (res.success && res.data) {
        dispatch({ type: 'SET_DATASET_LIST', payload: res.data });
      }
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load datasets' });
    } finally {
      dispatch({ type: 'SET_LOADING_LIST', payload: false });
    }
  }, []);

  const loadFigureList = useCallback(async () => {
    try {
      const res = await window.api.getGraphingFigures();
      if (res.success && res.data) {
        dispatch({ type: 'SET_FIGURE_LIST', payload: res.data });
      }
    } catch {
      // Silent
    }
  }, []);

  const openDataset = useCallback(async (id: string) => {
    try {
      const res = await window.api.getGraphingDataset(id);
      if (res.success && res.data) {
        const dataset = rowToDataset(res.data);
        const mapping: VariableMapping = JSON.parse(res.data.variable_mapping_json || '{}');
        if (!mapping.dependentParamIds) {
          mapping.dependentParamIds = dataset.columns.filter(c => !c.isX).map(c => c.id);
        }
        if (!mapping.independentParamIds) mapping.independentParamIds = [];
        
        const options: GraphStyleOptions = dataset.metadata.options || DEFAULT_STYLE_OPTIONS;
        const assemblerState: AssemblerState = dataset.metadata.assemblerState || DEFAULT_ASSEMBLER_STATE;
        dispatch({ type: 'OPEN_DATASET', payload: { dataset, mapping, id, options, assemblerState } });

        // Also load analyses for this dataset
        const aRes = await window.api.getGraphingAnalyses(id);
        if (aRes.success && aRes.data && aRes.data.length > 0) {
          dispatch({ type: 'SET_ANALYSIS_LIST', payload: aRes.data });
          
          // Inject the most recent analysis into statResult to retain the Analyze/Annotate state!
          const sorted = [...aRes.data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const latest = sorted[0];
          try {
            const parsedResult = JSON.parse(latest.result_json || 'null');
            if (parsedResult) {
               dispatch({ type: 'SET_STAT_RESULT', payload: parsedResult });
            }
          } catch(e) { console.error('Failed to parse latest analysis'); }
        }
      }
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to open dataset' });
    }
  }, []);

  const createNewDataset = useCallback(async (name: string, format: string) => {
    try {
      const cols = defaultColumns();
      const rows = defaultRows(cols);
      const mapping: VariableMapping = {
        independentParamIds: [],
        dependentParamIds: cols.map(c => c.id),
      };
      const res = await window.api.createGraphingDataset({
        name,
        format,
        columns_json: JSON.stringify(cols),
        rows_json: JSON.stringify(rows),
        metadata_json: JSON.stringify({ createdAt: Date.now(), updatedAt: Date.now() }),
        variable_mapping_json: JSON.stringify(mapping),
      });
      if (res.success && res.data) {
        await loadDatasetList();
        await openDataset(res.data.id);
      }
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create dataset' });
    }
  }, [loadDatasetList, openDataset]);

  const saveDataset = useCallback(async () => {
    if (!state.activeDatasetId || !state.dataset) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const updates = datasetToRow(state.dataset, state.mapping, state.options, state.assemblerState);
      await window.api.updateGraphingDataset(state.activeDatasetId, updates);
      await loadDatasetList();
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save dataset' });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.activeDatasetId, state.dataset, state.mapping, state.options, state.assemblerState, loadDatasetList]);

  const deleteDataset = useCallback(async (id: string) => {
    try {
      await window.api.deleteGraphingDataset(id);
      if (state.activeDatasetId === id) {
        dispatch({ type: 'CLOSE_DATASET' });
      }
      await loadDatasetList();
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete dataset' });
    }
  }, [state.activeDatasetId, loadDatasetList]);

  const saveAnalysis = useCallback(async (result: StatTestResult) => {
    if (!state.activeDatasetId) return;
    try {
      const res = await window.api.createGraphingAnalysis({
        dataset_id: state.activeDatasetId,
        test_name: result.testName,
        config_json: JSON.stringify({}), // We can store config later if needed
        result_json: JSON.stringify(result)
      });
      if (res.success && res.data) {
        dispatch({ type: 'SET_ANALYSIS_LIST', payload: [...state.analysisList, res.data] });
      }
    } catch (e) {
      console.error('Failed to save analysis', e);
    }
  }, [state.activeDatasetId, state.analysisList]);

  // Auto-load on mount
  useEffect(() => {
    loadDatasetList();
    loadFigureList();
  }, [loadDatasetList, loadFigureList]);

  // Autosave (debounced)
  useEffect(() => {
    if (!state.activeDatasetId || !state.dataset) return;
    const timer = setTimeout(() => {
      saveDataset();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dataset, state.mapping, state.options]);

  return (
    <GraphingStudioContext.Provider value={{ state, dispatch, loadDatasetList, loadFigureList, openDataset, createNewDataset, saveDataset, deleteDataset, saveAnalysis }}>
      {children}
    </GraphingStudioContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGraphingStudio() {
  const ctx = useContext(GraphingStudioContext);
  if (!ctx) throw new Error('useGraphingStudio must be used within GraphingStudioProvider');
  return ctx;
}
