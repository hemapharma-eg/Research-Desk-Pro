import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  ReviewProject, 
  ReviewRecord, 
  ReviewStage, 
  LogEvent, 
  Conflict, 
  DeduplicationCluster,
  ActionType,
  Reviewer
} from '../types/ReviewModels';

interface ReviewState {
  project: ReviewProject | null;
  records: ReviewRecord[];
  clusters: DeduplicationCluster[];
  conflicts: Conflict[];
  logs: LogEvent[];
  activeStage: ReviewStage;
  activeReviewer: Reviewer | null;
  error: string | null;
  isSaving: boolean;
}

type ReviewAction =
  | { type: 'SET_PROJECT'; payload: ReviewProject }
  | { type: 'SET_STAGE'; payload: ReviewStage }
  | { type: 'SET_ACTIVE_REVIEWER'; payload: Reviewer }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_RECORDS'; payload: ReviewRecord[] }
  | { type: 'UPDATE_RECORD'; payload: { id: string; updates: Partial<ReviewRecord> } }
  | { type: 'SET_CLUSTERS'; payload: DeduplicationCluster[] }
  | { type: 'UPDATE_CLUSTER'; payload: { id: string; updates: Partial<DeduplicationCluster> } }
  | { type: 'ADD_CONFLICT'; payload: Conflict }
  | { type: 'RESOLVE_CONFLICT'; payload: { id: string; resolution: Partial<Conflict> } }
  | { type: 'LOG_EVENT'; payload: Omit<LogEvent, 'id' | 'timestamp'> }
  | { type: 'START_SAVE' }
  | { type: 'END_SAVE' }
  | { type: 'LOAD_STATE'; payload: ReviewState };

const initialState: ReviewState = {
  project: null,
  records: [],
  clusters: [],
  conflicts: [],
  logs: [],
  activeStage: 'setup',
  activeReviewer: { id: 'local-user', name: 'Current User', role: 'owner/admin' },
  error: null,
  isSaving: false,
};

function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, project: action.payload };
    case 'SET_STAGE':
      return { ...state, activeStage: action.payload };
    case 'SET_ACTIVE_REVIEWER':
      return { ...state, activeReviewer: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_RECORDS':
      return { ...state, records: [...state.records, ...action.payload] };
    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };
    case 'SET_CLUSTERS':
      return { ...state, clusters: action.payload };
    case 'UPDATE_CLUSTER':
      return {
        ...state,
        clusters: state.clusters.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };
    case 'ADD_CONFLICT':
      return { ...state, conflicts: [...state.conflicts, action.payload] };
    case 'RESOLVE_CONFLICT':
      return {
        ...state,
        conflicts: state.conflicts.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.resolution, status: 'resolved' } : c
        ),
      };
    case 'LOG_EVENT':
      const newLog: LogEvent = {
        ...action.payload,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      return { ...state, logs: [...state.logs, newLog] };
    case 'START_SAVE':
      return { ...state, isSaving: true };
    case 'END_SAVE':
      return { ...state, isSaving: false };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

interface ReviewContextProps {
  state: ReviewState;
  dispatch: React.Dispatch<ReviewAction>;
  logEvent: (
    actionType: ActionType,
    stage: ReviewStage,
    recordId?: string,
    comment?: string,
    oldValue?: any,
    newValue?: any
  ) => void;
}

const ReviewContext = createContext<ReviewContextProps | undefined>(undefined);

export function SystematicReviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reviewReducer, initialState);

  // Load from SQLite on mount
  useEffect(() => {
    async function fetchState() {
      try {
        const saved = await window.api.getMetadata('sr_app_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            dispatch({ type: 'LOAD_STATE', payload: parsed });
          }
        }
      } catch (e) {
        console.warn('Failed to load Systematic Review state from database', e);
      }
    }
    fetchState();
  }, []);

  // Save mechanism is now completely manual to prevent enormous JSON payloads
  // from locking the SQLite thread on every minor keystroke in references.
  // The user triggers save explicitly via the top toolbar.

  const logEvent = (
    actionType: ActionType,
    stage: ReviewStage,
    recordId?: string,
    comment?: string,
    oldValue?: any,
    newValue?: any
  ) => {
    if (!state.activeReviewer) return;
    dispatch({
      type: 'LOG_EVENT',
      payload: {
        userId: state.activeReviewer.id,
        actionType,
        stage,
        recordId,
        comment,
        oldValue,
        newValue,
      },
    });
  };

  return (
    <ReviewContext.Provider value={{ state, dispatch, logEvent }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useSystematicReview() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useSystematicReview must be used within a SystematicReviewProvider');
  }
  return context;
}
