import { useRef, useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import './GraphingStudio.css';

import { GraphingStudioProvider, useGraphingStudio } from './GraphingStudioContext';
import type { StudioTab } from './GraphingStudioContext';

// Workspace components
import { ProjectDashboard } from './components/ProjectDashboard';
import { SpreadsheetDataEditor } from './components/data-workspace/SpreadsheetDataEditor';
import { DataImportManager } from './components/data-workspace/DataImportManager';
import { VariableMappingPanel } from './components/data-workspace/VariableMappingPanel';
import { MetadataPanel } from './components/data-workspace/MetadataPanel';
import { AnalysisWizard } from './components/analysis-workspace/AnalysisWizard';
import { AdvancedGraphViewer } from './components/graph-workspace/AdvancedGraphViewer';
import { GraphStyleController } from './components/graph-workspace/GraphStyleController';
import { SignificanceAnnotator } from './components/annotation-workspace/SignificanceAnnotator';
import { AnalysisReport } from './components/report-workspace/AnalysisReport';
import { ExportInsertPanel } from './components/export-workspace/ExportInsertPanel';
import { FigureAssembler } from './components/assembler-workspace/FigureAssembler';

const TABS: { id: StudioTab; label: string; icon: string }[] = [
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'analyze', label: 'Analyze', icon: '🔬' },
  { id: 'graph', label: 'Graph', icon: '📈' },
  { id: 'annotate', label: 'Annotate', icon: '✏️' },
  { id: 'report', label: 'Report', icon: '📄' },
  { id: 'assembler', label: 'Assembler', icon: '🧩' },
  { id: 'export', label: 'Export', icon: '💾' },
];

function GraphingStudioContent() {
  const { currentProject } = useProject();
  const { state, dispatch, openDataset, saveDataset, loadDatasetList, saveAnalysis } = useGraphingStudio();
  const chartRef = useRef<HTMLDivElement>(null);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Mark as unsaved on edit
  useEffect(() => {
    if (state.activeDatasetId) setSaveStatus('unsaved');
  }, [state.dataset, state.mapping, state.options, state.activeDatasetId]);

  // Sync with context's isSaving
  useEffect(() => {
    if (state.isSaving) setSaveStatus('saving');
    else if (saveStatus === 'saving') setSaveStatus('saved');
  }, [state.isSaving, saveStatus]);

  // Autosave debounce map
  useEffect(() => {
    if (!state.activeDatasetId || saveStatus !== 'unsaved') return;
    const timerId = setTimeout(() => {
      saveDataset();
    }, 2000); // 2 second debounce
    return () => clearTimeout(timerId);
  }, [state.dataset, state.mapping, state.options, state.activeDatasetId, saveStatus, saveDataset]);

  if (!currentProject) {
    return (
      <div className="gs-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-lg)' }}>
          Please open a project to use the Publication Graphing Studio.
        </p>
      </div>
    );
  }

  // Show dashboard if no dataset is active
  if (state.showDashboard || !state.dataset) {
    return (
      <div className="gs-container">
        <ProjectDashboard />
      </div>
    );
  }

  const dataset = state.dataset;
  const mapping = state.mapping;
  const chartGroupNames = dataset.columns
    .filter(c => mapping.dependentParamIds.includes(c.id))
    .map(c => c.title);

  const handleImport = (ds: typeof dataset) => {
    dispatch({ type: 'SET_DATASET', payload: ds });
    dispatch({
      type: 'SET_MAPPING',
      payload: {
        independentParamIds: [],
        dependentParamIds: ds.columns.filter(c => !c.isX).map(c => c.id),
      },
    });
    dispatch({ type: 'SET_STAT_RESULT', payload: null });
  };

  const renderActiveTab = () => {
    switch (state.activeTab) {
      case 'data':
        return (
          <div className="gs-split-h" style={{ flex: 1 }}>
            {/* Main: Spreadsheet */}
            <div className="gs-split-v" style={{ flex: 1, padding: '0', overflow: 'hidden' }}>
              <SpreadsheetDataEditor
                dataset={dataset}
                onChange={ds => dispatch({ type: 'SET_DATASET', payload: ds })}
              />
            </div>
            {/* Side: Import + Variable Mapping + Metadata */}
            <div className="gs-side-panel">
              <div className="gs-panel-section">
                <DataImportManager onImport={handleImport} />
              </div>
              <VariableMappingPanel
                dataset={dataset}
                mapping={mapping}
                onChange={m => dispatch({ type: 'SET_MAPPING', payload: m })}
              />
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border-light)' }}>
                <MetadataPanel
                  dataset={dataset}
                  onChange={ds => dispatch({ type: 'SET_DATASET', payload: ds })}
                />
              </div>
            </div>
          </div>
        );

      case 'analyze':
        return (
          <div className="gs-split-h" style={{ flex: 1 }}>
            <div className="gs-workspace-scroll" style={{ flex: 1 }}>
              {state.statResult ? (
                <AnalysisReport
                  result={state.statResult}
                  onClear={() => dispatch({ type: 'SET_STAT_RESULT', payload: null })}
                  datasetId={state.activeDatasetId || undefined}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-tertiary)' }}>
                  <p>Configure and run a test from the panel on the right to see results here.</p>
                </div>
              )}
            </div>
            <div className="gs-side-panel">
              <AnalysisWizard
                dataset={dataset}
                mapping={mapping}
                onRunTest={r => {
                  dispatch({ type: 'SET_STAT_RESULT', payload: r });
                  saveAnalysis(r);
                }}
              />
            </div>
          </div>
        );

      case 'graph':
        return (
          <div className="gs-split-h" style={{ flex: 1 }}>
            {/* Center: Graph preview */}
            <div className="gs-graph-area">
              <div
                ref={chartRef}
                className="gs-graph-paper"
                style={{ width: '820px', maxWidth: '100%', height: '520px' }}
              >
                <AdvancedGraphViewer
                  dataset={dataset}
                  mapping={mapping}
                  options={state.options}
                  statResult={state.statResult}
                />
                {state.options.showAnnotations && (
                  <SignificanceAnnotator
                    statResult={state.statResult}
                    options={state.options}
                    groupNames={chartGroupNames}
                  />
                )}
              </div>
            </div>
            {/* Right: Graph style controls */}
            <div className="gs-side-panel">
              <GraphStyleController
                options={state.options}
                groupNames={chartGroupNames}
                onChange={o => dispatch({ type: 'SET_OPTIONS', payload: o })}
              />
            </div>
          </div>
        );

      case 'annotate':
        return (
          <div className="gs-split-h" style={{ flex: 1 }}>
            <div className="gs-graph-area">
              <div
                ref={chartRef}
                className="gs-graph-paper"
                style={{ width: '820px', maxWidth: '100%', height: '520px' }}
              >
                <AdvancedGraphViewer
                  dataset={dataset}
                  mapping={mapping}
                  options={state.options}
                  statResult={state.statResult}
                />
                <SignificanceAnnotator
                  statResult={state.statResult}
                  options={state.options}
                  groupNames={chartGroupNames}
                />
              </div>
            </div>
            <div className="gs-side-panel">
              <div className="gs-panel-section">
                <div className="gs-panel-title">Annotation Settings</div>
                <div className="gs-form-group">
                  <label className="gs-checkbox-label">
                    <input
                      type="checkbox"
                      checked={state.options.showAnnotations}
                      onChange={e =>
                        dispatch({
                          type: 'SET_OPTIONS',
                          payload: { ...state.options, showAnnotations: e.target.checked },
                        })
                      }
                    />
                    Show significance brackets
                  </label>
                </div>
                {state.options.showAnnotations && (
                  <div className="gs-form-group">
                    <label className="gs-label">Annotation Style</label>
                    <select
                      className="gs-select"
                      value={state.options.annotationStyle}
                      onChange={e =>
                        dispatch({
                          type: 'SET_OPTIONS',
                          payload: {
                            ...state.options,
                            annotationStyle: e.target.value as 'stars' | 'p-value',
                          },
                        })
                      }
                    >
                      <option value="stars">Asterisks (*, **, ***)</option>
                      <option value="p-value">Exact p-values</option>
                    </select>
                  </div>
                )}
                
                {state.options.showAnnotations && state.options.annotationStyle !== 'letters' && (
                  <>
                    <div className="gs-form-group">
                      <label className="gs-label">Vertical Spread (Layout Spacing)</label>
                      <input 
                        type="range" 
                        min="10" 
                        max="40" 
                        value={state.options.annotationBracketSpacing ?? 18} 
                        onChange={e => dispatch({
                          type: 'SET_OPTIONS',
                          payload: { ...state.options, annotationBracketSpacing: Number(e.target.value) }
                        })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="gs-form-group">
                      <label className="gs-label">Y-Axis Offset</label>
                      <input 
                        type="range" 
                        min="-50" 
                        max="100" 
                        value={state.options.annotationYOffset ?? 0} 
                        onChange={e => dispatch({
                          type: 'SET_OPTIONS',
                          payload: { ...state.options, annotationYOffset: Number(e.target.value) }
                        })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </>
                )}

                {!state.statResult && (
                  <div className="gs-warning">
                    No analysis results available. Run a statistical test in the <strong>Analyze</strong> tab first to
                    enable automatic annotations.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="gs-workspace-scroll">
            <AnalysisReport
              result={state.statResult}
              onClear={() => dispatch({ type: 'SET_STAT_RESULT', payload: null })}
              datasetId={state.activeDatasetId || undefined}
            />
          </div>
        );

      case 'assembler':
        return (
          <div className="gs-workspace-scroll" style={{ padding: '24px' }}>
            <FigureAssembler />
          </div>
        );

      case 'export':
        return (
          <div className="gs-split-h" style={{ flex: 1 }}>
            <div className="gs-graph-area">
              <div
                ref={chartRef}
                className="gs-graph-paper"
                style={{ width: '820px', maxWidth: '100%', height: '520px' }}
              >
                <AdvancedGraphViewer
                  dataset={dataset}
                  mapping={mapping}
                  options={state.options}
                  statResult={state.statResult}
                />
                {state.options.showAnnotations && (
                  <SignificanceAnnotator
                    statResult={state.statResult}
                    options={state.options}
                    groupNames={chartGroupNames}
                  />
                )}
              </div>
            </div>
            <div className="gs-side-panel">
              <div className="gs-panel-section">
                <div className="gs-panel-title">Export & Insert</div>
                <ExportInsertPanel chartRef={chartRef} datasetName={dataset.name} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="gs-container">
      {/* Top Bar */}
      <div className="gs-topbar">
        <span className="gs-topbar-title">
          Graphing<span className="gs-topbar-dot">.</span>Studio
        </span>
        <div className="gs-topbar-divider" />

        {/* Dataset selector */}
        <select
          className="gs-dataset-selector"
          value={state.activeDatasetId || ''}
          onChange={e => {
            if (e.target.value) openDataset(e.target.value);
          }}
        >
          {state.datasetList.map(ds => (
            <option key={ds.id} value={ds.id}>
              {ds.name} ({ds.format})
            </option>
          ))}
        </select>

        <div className="gs-topbar-actions">
          {state.activeDatasetId && (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              {saveStatus === 'saving' && <span><span className="gs-spinner" style={{ display: 'inline-block', marginRight: '6px', fontSize: '10px' }}>↻</span>Saving...</span>}
              {saveStatus === 'saved' && <span style={{ color: 'var(--color-text-secondary)' }}>✓ All changes saved</span>}
              {saveStatus === 'unsaved' && <span>Unsaved changes</span>}
            </div>
          )}
          <button className="gs-btn gs-btn-sm" onClick={() => { saveDataset(); }} title="Force Save" disabled={saveStatus === 'saving' || saveStatus === 'saved'}>
            💾 Save
          </button>
          <button
            className="gs-btn gs-btn-sm"
            onClick={() => {
              dispatch({ type: 'CLOSE_DATASET' });
              loadDatasetList();
            }}
            title="Close dataset and return to dashboard"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="gs-tabbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`gs-tab ${state.activeTab === tab.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {state.error && (
        <div
          style={{
            padding: '8px 16px',
            background: '#FEF2F2',
            borderBottom: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{state.error}</span>
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
            style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="gs-workspace">{renderActiveTab()}</div>
    </div>
  );
}

export function GraphingStudio() {
  return (
    <GraphingStudioProvider>
      <GraphingStudioContent />
    </GraphingStudioProvider>
  );
}
