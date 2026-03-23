import { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';

import type { PublicationDataset, VariableMapping } from './types/GraphingCoreTypes';
import type { GraphStyleOptions } from './types/GraphStyleOptions';
import { DEFAULT_STYLE_OPTIONS } from './types/GraphStyleOptions';
import type { StatTestResult } from './utils/statService';

import { SpreadsheetDataEditor } from './components/data-workspace/SpreadsheetDataEditor';
import { DataImportManager } from './components/data-workspace/DataImportManager';
import { VariableMappingPanel } from './components/data-workspace/VariableMappingPanel';

import { AnalysisWizard } from './components/analysis-workspace/AnalysisWizard';
import { AnalysisReport } from './components/report-workspace/AnalysisReport';

import { AdvancedGraphViewer } from './components/graph-workspace/AdvancedGraphViewer';
import { GraphStyleController } from './components/graph-workspace/GraphStyleController';

import { SignificanceAnnotator } from './components/annotation-workspace/SignificanceAnnotator';
import { ExportInsertPanel } from './components/export-workspace/ExportInsertPanel';

const INITIAL_DATASET: PublicationDataset = {
  id: 'default-1',
  name: 'Sample Experiment',
  format: 'column',
  metadata: { createdAt: Date.now(), updatedAt: Date.now() },
  columns: [
    { id: 'col-1', title: 'Control', subcolumns: 1, isX: false },
    { id: 'col-2', title: 'Treatment A', subcolumns: 1, isX: false },
    { id: 'col-3', title: 'Treatment B', subcolumns: 1, isX: false }
  ],
  rows: [
    { id: 'r1', cells: { 'col-1': [{ id: 'c1-1', value: 12.5 }], 'col-2': [{ id: 'c2-1', value: 18.2 }], 'col-3': [{ id: 'c3-1', value: 24.1 }] } },
    { id: 'r2', cells: { 'col-1': [{ id: 'c1-2', value: 14.2 }], 'col-2': [{ id: 'c2-2', value: 19.5 }], 'col-3': [{ id: 'c3-2', value: 25.4 }] } },
    { id: 'r3', cells: { 'col-1': [{ id: 'c1-3', value: 11.8 }], 'col-2': [{ id: 'c2-3', value: 17.9 }], 'col-3': [{ id: 'c3-3', value: 22.8 }] } }
  ]
};

const INITIAL_MAPPING: VariableMapping = {
  independentParamIds: [],
  dependentParamIds: ['col-1', 'col-2', 'col-3']
};

export function GraphingStudio() {
  const { currentProject } = useProject();

  // State: Data Workspace
  const [dataset, setDataset] = useState<PublicationDataset>(INITIAL_DATASET);
  const [mapping, setMapping] = useState<VariableMapping>(INITIAL_MAPPING);

  // State: Analysis Workspace
  const [statResult, setStatResult] = useState<StatTestResult | null>(null);

  // State: Graph & Annotation Workspace
  const [options, setOptions] = useState<GraphStyleOptions>(DEFAULT_STYLE_OPTIONS);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);

  if (!currentProject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#F8FAFC', color: '#64748B' }}>
        <p>Please open a project to view the Publication Graphing Studio.</p>
      </div>
    );
  }

  // Derived: For annotation, we need to know the exact expected X-axis names in order.
  const chartGroupNames = dataset.columns.filter(c => mapping.dependentParamIds.includes(c.id)).map(c => c.title);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 350px', height: '100%', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
      
      {/* LEFT PANE: Data & Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', borderRight: '1px solid #CBD5E1', backgroundColor: '#F8FAFC' }}>
        
        {/* Import */}
        <div style={{ padding: '8px' }}>
          <DataImportManager onImport={(ds) => {
             setDataset(ds);
             setMapping({ independentParamIds: [], dependentParamIds: ds.columns.filter(c => !c.isX).map(c => c.id) });
             setStatResult(null);
          }} />
        </div>

        {/* Variable Mapping */}
        <VariableMappingPanel dataset={dataset} mapping={mapping} onChange={setMapping} />

        {/* Analysis Wizard */}
        <AnalysisWizard dataset={dataset} mapping={mapping} onRunTest={setStatResult} />

        {/* Graph Styler */}
        <GraphStyleController options={options} onChange={setOptions} />
      </div>

      {/* CENTER PANE: Data Grid & Graph Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Top Half: Spreadsheet */}
        <div style={{ height: '40%', borderBottom: '1px solid #CBD5E1', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
           <SpreadsheetDataEditor dataset={dataset} onChange={ds => {
             setDataset(ds);
             // In a fully reactive app, we might re-run stats, but often Prism leaves them stale until user clicks calculate.
           }} />
        </div>

        {/* Bottom Half: Graph Preview Area */}
        <div style={{ height: '60%', padding: '24px', backgroundColor: '#E2E8F0', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Main Chart Paper Container */}
          <div ref={chartContainerRef} style={{ width: '800px', maxWidth: '100%', height: '500px', backgroundColor: 'white', border: '1px solid #CBD5E1', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative', flexShrink: 0 }}>
             <AdvancedGraphViewer dataset={dataset} mapping={mapping} options={options} statResult={statResult} />
             <SignificanceAnnotator statResult={statResult} options={options} groupNames={chartGroupNames} />
          </div>

          <div style={{ width: '800px', maxWidth: '100%', marginTop: '16px' }}>
             <ExportInsertPanel chartRef={chartContainerRef} datasetName={dataset.name} />
          </div>

        </div>

      </div>

      {/* RIGHT PANE: Results Report */}
      <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', borderLeft: '1px solid #CBD5E1', backgroundColor: 'white' }}>
         <AnalysisReport result={statResult} onClear={() => setStatResult(null)} />
      </div>

    </div>
  );
}
