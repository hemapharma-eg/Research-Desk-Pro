import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import type {
  TableDocument, TableBuilderTab, TBCell,
  NarrativeDraft, DocumentLink, AuditEntry,
  ValidationIssue, TableBuilderSettings, NumberingMode, TableType, StylePresetName,
} from './types/TableBuilderTypes';
import { DEFAULT_TABLE_STYLE, DEFAULT_SETTINGS } from './types/TableBuilderTypes';
import type { TbTableRow } from '../../types/electron.d';

// ===================== State =====================
export interface TableBuilderState {
  tableList: TbTableRow[];
  isLoadingList: boolean;

  activeTab: TableBuilderTab;
  activeTableId: string | null;
  showDashboard: boolean;

  table: TableDocument | null;

  // Selection
  selectedCellId: string | null;
  selectedColId: string | null;
  selectedRowId: string | null;

  // Narratives
  narrativeDrafts: NarrativeDraft[];

  // Document links
  documentLinks: DocumentLink[];

  // Audit
  auditLog: AuditEntry[];

  // Validation
  validationResults: ValidationIssue[];

  // Settings
  settings: TableBuilderSettings;

  // Incoming stat result (from Graphing Studio)
  pendingStatImport: any | null;

  // UI
  isSaving: boolean;
  error: string | null;
  showWizard: boolean;
}

const INITIAL_STATE: TableBuilderState = {
  tableList: [],
  isLoadingList: true,
  activeTab: 'home',
  activeTableId: null,
  showDashboard: true,
  table: null,
  selectedCellId: null,
  selectedColId: null,
  selectedRowId: null,
  narrativeDrafts: [],
  documentLinks: [],
  auditLog: [],
  validationResults: [],
  settings: DEFAULT_SETTINGS,
  pendingStatImport: null,
  isSaving: false,
  error: null,
  showWizard: false,
};

// ===================== Actions =====================
type Action =
  | { type: 'SET_TABLE_LIST'; payload: TbTableRow[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TAB'; payload: TableBuilderTab }
  | { type: 'SET_ACTIVE_TABLE_ID'; payload: string | null }
  | { type: 'SET_SHOW_DASHBOARD'; payload: boolean }
  | { type: 'SET_TABLE'; payload: TableDocument | null }
  | { type: 'SET_SELECTED_CELL'; payload: string | null }
  | { type: 'SET_SELECTED_COL'; payload: string | null }
  | { type: 'SET_SELECTED_ROW'; payload: string | null }
  | { type: 'SET_NARRATIVES'; payload: NarrativeDraft[] }
  | { type: 'SET_DOC_LINKS'; payload: DocumentLink[] }
  | { type: 'SET_AUDIT_LOG'; payload: AuditEntry[] }
  | { type: 'SET_VALIDATION'; payload: ValidationIssue[] }
  | { type: 'SET_SETTINGS'; payload: TableBuilderSettings }
  | { type: 'SET_PENDING_IMPORT'; payload: any }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOW_WIZARD'; payload: boolean }
  | { type: 'OPEN_TABLE'; payload: { table: TableDocument; id: string } }
  | { type: 'CLOSE_TABLE' }
  | { type: 'UPDATE_CELL'; payload: { rowId: string; colId: string; cell: Partial<TBCell> } };

function reducer(state: TableBuilderState, action: Action): TableBuilderState {
  switch (action.type) {
    case 'SET_TABLE_LIST': return { ...state, tableList: action.payload };
    case 'SET_LOADING': return { ...state, isLoadingList: action.payload };
    case 'SET_TAB': return { ...state, activeTab: action.payload };
    case 'SET_ACTIVE_TABLE_ID': return { ...state, activeTableId: action.payload };
    case 'SET_SHOW_DASHBOARD': return { ...state, showDashboard: action.payload };
    case 'SET_TABLE': return { ...state, table: action.payload };
    case 'SET_SELECTED_CELL': return { ...state, selectedCellId: action.payload };
    case 'SET_SELECTED_COL': return { ...state, selectedColId: action.payload };
    case 'SET_SELECTED_ROW': return { ...state, selectedRowId: action.payload };
    case 'SET_NARRATIVES': return { ...state, narrativeDrafts: action.payload };
    case 'SET_DOC_LINKS': return { ...state, documentLinks: action.payload };
    case 'SET_AUDIT_LOG': return { ...state, auditLog: action.payload };
    case 'SET_VALIDATION': return { ...state, validationResults: action.payload };
    case 'SET_SETTINGS': return { ...state, settings: action.payload };
    case 'SET_PENDING_IMPORT': return { ...state, pendingStatImport: action.payload };
    case 'SET_SAVING': return { ...state, isSaving: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_SHOW_WIZARD': return { ...state, showWizard: action.payload };
    case 'OPEN_TABLE':
      return { ...state, activeTableId: action.payload.id, table: action.payload.table, showDashboard: false, activeTab: 'canvas', validationResults: [] };
    case 'CLOSE_TABLE':
      return { ...state, activeTableId: null, table: null, showDashboard: true, activeTab: 'home', selectedCellId: null, selectedColId: null, selectedRowId: null, validationResults: [], narrativeDrafts: [], auditLog: [] };
    case 'UPDATE_CELL': {
      if (!state.table) return state;
      const { rowId, colId, cell } = action.payload;
      const newRows = state.table.rows.map(r => {
        if (r.id !== rowId) return r;
        const existing = r.cells[colId];
        if (!existing) return r;
        return { ...r, cells: { ...r.cells, [colId]: { ...existing, ...cell } } };
      });
      return { ...state, table: { ...state.table, rows: newRows, updatedAt: Date.now() } };
    }
    default: return state;
  }
}

// ===================== Helpers =====================
function rowToTable(row: TbTableRow): TableDocument {
  return {
    id: row.id,
    name: row.name,
    title: row.title || '',
    caption: row.caption || '',
    tableType: (row.table_type || 'custom') as TableType,
    tableNumber: row.table_number || '',
    numberingMode: (row.numbering_mode || 'auto') as NumberingMode,
    category: row.category || '',
    stylePreset: (row.style_preset || 'general-journal') as StylePresetName,
    columns: JSON.parse(row.columns_json || '[]'),
    rows: JSON.parse(row.rows_json || '[]'),
    groupedHeaders: JSON.parse(row.grouped_headers_json || '[]'),
    footnotes: JSON.parse(row.footnotes_json || '[]'),
    sourceLink: row.source_analysis_id ? JSON.parse(row.source_mapping_json || 'null') : null,
    styleOptions: { ...DEFAULT_TABLE_STYLE, ...JSON.parse(row.style_options_json || '{}') },
    sectionTarget: row.section_target || '',
    keywords: row.keywords || '',
    notesToSelf: row.notes_to_self || '',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function tableToRow(t: TableDocument): Partial<TbTableRow> {
  return {
    name: t.name,
    title: t.title,
    caption: t.caption,
    table_type: t.tableType,
    table_number: t.tableNumber,
    numbering_mode: t.numberingMode,
    category: t.category,
    style_preset: t.stylePreset,
    columns_json: JSON.stringify(t.columns),
    rows_json: JSON.stringify(t.rows),
    grouped_headers_json: JSON.stringify(t.groupedHeaders),
    footnotes_json: JSON.stringify(t.footnotes),
    source_analysis_id: t.sourceLink?.analysisId || null,
    source_dataset_id: t.sourceLink?.datasetId || null,
    source_mapping_json: t.sourceLink ? JSON.stringify(t.sourceLink) : '{}',
    link_status: t.sourceLink?.status || 'none',
    style_options_json: JSON.stringify(t.styleOptions),
    section_target: t.sectionTarget,
    keywords: t.keywords,
    notes_to_self: t.notesToSelf,
  };
}

// ===================== Context =====================
interface TableBuilderContextValue {
  state: TableBuilderState;
  dispatch: React.Dispatch<Action>;
  loadTableList: () => Promise<void>;
  openTable: (id: string) => Promise<void>;
  createTable: (data: Partial<TbTableRow>) => Promise<string | null>;
  saveTable: () => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
}

const TableBuilderContext = createContext<TableBuilderContextValue | undefined>(undefined);

export function TableBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const loadTableList = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await window.api.getTbTables();
      if (res.success && res.data) dispatch({ type: 'SET_TABLE_LIST', payload: res.data });
    } catch { dispatch({ type: 'SET_ERROR', payload: 'Failed to load tables' }); }
    finally { dispatch({ type: 'SET_LOADING', payload: false }); }
  }, []);

  const openTable = useCallback(async (id: string) => {
    try {
      const res = await window.api.getTbTable(id);
      if (res.success && res.data) {
        const table = rowToTable(res.data);
        dispatch({ type: 'OPEN_TABLE', payload: { table, id } });
        // Load narratives
        const nRes = await window.api.getTbNarratives(id);
        if (nRes.success && nRes.data) {
          dispatch({ type: 'SET_NARRATIVES', payload: nRes.data.map(n => ({ id: n.id, tableId: n.table_id, narrativeType: n.narrative_type as any, tone: n.tone as any, content: n.content, settings: JSON.parse(n.settings_json || '{}'), createdAt: new Date(n.created_at).getTime(), updatedAt: new Date(n.updated_at).getTime() })) });
        }
      }
    } catch { dispatch({ type: 'SET_ERROR', payload: 'Failed to open table' }); }
  }, []);

  const createTable = useCallback(async (data: Partial<TbTableRow>): Promise<string | null> => {
    try {
      const res = await window.api.createTbTable(data);
      if (res.success && res.data) {
        await loadTableList();
        return res.data.id;
      }
    } catch { dispatch({ type: 'SET_ERROR', payload: 'Failed to create table' }); }
    return null;
  }, [loadTableList]);

  const saveTable = useCallback(async () => {
    if (!state.activeTableId || !state.table) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const updates = tableToRow(state.table);
      await window.api.updateTbTable(state.activeTableId, updates);
      await loadTableList();
    } catch { dispatch({ type: 'SET_ERROR', payload: 'Failed to save' }); }
    finally { dispatch({ type: 'SET_SAVING', payload: false }); }
  }, [state.activeTableId, state.table, loadTableList]);

  const deleteTable = useCallback(async (id: string) => {
    try {
      await window.api.deleteTbTable(id);
      if (state.activeTableId === id) dispatch({ type: 'CLOSE_TABLE' });
      await loadTableList();
    } catch { dispatch({ type: 'SET_ERROR', payload: 'Failed to delete table' }); }
  }, [state.activeTableId, loadTableList]);

  // Auto-load
  useEffect(() => { loadTableList(); }, [loadTableList]);

  // Autosave
  useEffect(() => {
    if (!state.activeTableId || !state.table) return;
    const timer = setTimeout(() => { saveTable(); }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.table]);

  // Cross-module: receive stat import from Graphing Studio
  useEffect(() => {
    // Check if there was a payload dispatched just before mounting
    const pendingObj = (window as any).__pendingTableImport;
    if (pendingObj?.statResult) {
      dispatch({ type: 'SET_PENDING_IMPORT', payload: pendingObj });
      dispatch({ type: 'SET_SHOW_WIZARD', payload: true });
      (window as any).__pendingTableImport = null; // Consume it
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.statResult) {
        dispatch({ type: 'SET_PENDING_IMPORT', payload: detail });
        dispatch({ type: 'SET_SHOW_WIZARD', payload: true });
      }
    };
    window.addEventListener('table-builder:receive-stat-import', handler);
    return () => window.removeEventListener('table-builder:receive-stat-import', handler);
  }, []);

  return (
    <TableBuilderContext.Provider value={{ state, dispatch, loadTableList, openTable, createTable, saveTable, deleteTable }}>
      {children}
    </TableBuilderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTableBuilder() {
  const ctx = useContext(TableBuilderContext);
  if (!ctx) throw new Error('useTableBuilder must be used within TableBuilderProvider');
  return ctx;
}
