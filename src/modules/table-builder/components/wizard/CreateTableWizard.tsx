/**
 * CreateTableWizard.tsx — 5-step guided table creation (Section 4)
 */
import { useState, useEffect } from 'react';
import { useTableBuilder } from '../../TableBuilderContext';
import type { TableType, SourceType, StylePresetName, NumberingMode } from '../../types/TableBuilderTypes';
import { DEFAULT_TABLE_STYLE, DEFAULT_CELL_FORMATTING } from '../../types/TableBuilderTypes';
import { STYLE_PRESETS } from '../../utils/stylePresets';
import { buildANOVATable } from '../../utils/smartBuilders/ANOVAPostHocBuilder';
import { buildComparativeTable } from '../../utils/smartBuilders/ComparativeResultsBuilder';
import { buildDescriptiveTable } from '../../utils/smartBuilders/DescriptiveStatsBuilder';

const SOURCE_TYPES: { id: SourceType; icon: string; title: string; desc: string }[] = [
  { id: 'blank',             icon: '📄', title: 'Blank Table',           desc: 'Empty canvas' },
  { id: 'manual',            icon: '✏️', title: 'Manual Entry',          desc: 'Type data directly' },
  { id: 'import-csv',        icon: '📁', title: 'Import CSV / TSV',      desc: 'From flat file' },
  { id: 'from-stats',        icon: '📊', title: 'From Statistics',       desc: 'Analysis output' },
  { id: 'from-graphing',     icon: '📈', title: 'From Graphing Data',    desc: 'Graph summary' },
  { id: 'from-meta-analysis', icon: '🌲', title: 'From Meta-Analysis',   desc: 'Evidence summary' },
  { id: 'duplicate',         icon: '📋', title: 'Duplicate Existing',    desc: 'Copy a table' },
  { id: 'template',          icon: '📐', title: 'Use Preset Template',   desc: 'Structured start' },
];

const TABLE_TYPE_GROUPS: { label: string; types: { id: TableType; name: string }[] }[] = [
  { label: 'General Scientific', types: [
    { id: 'custom', name: 'Blank custom table' }, { id: 'data', name: 'Simple data table' },
    { id: 'descriptive', name: 'Summary statistics table' }, { id: 'comparison', name: 'Group comparison table' },
    { id: 'repeated-measures', name: 'Repeated-measures summary' }, { id: 'frequency', name: 'Frequency / proportion table' },
    { id: 'crosstab', name: 'Crosstabulation table' }, { id: 'correlation', name: 'Correlation matrix table' },
    { id: 'regression', name: 'Regression results table' }, { id: 'model-comparison', name: 'Model comparison table' },
    { id: 'anova', name: 'ANOVA summary table' }, { id: 'posthoc', name: 'Post hoc comparison table' },
    { id: 'nonparam', name: 'Nonparametric summary table' }, { id: 'survival', name: 'Survival / time-to-event table' },
    { id: 'diagnostic', name: 'Diagnostic performance table' }, { id: 'reliability', name: 'Reliability / validity table' },
  ]},
  { label: 'Clinical / Biomedical', types: [
    { id: 'baseline', name: 'Baseline characteristics table' }, { id: 'demographic', name: 'Demographic table' },
    { id: 'adverse-events', name: 'Adverse events table' }, { id: 'laboratory', name: 'Laboratory values table' },
    { id: 'efficacy', name: 'Efficacy outcomes table' }, { id: 'safety', name: 'Safety outcomes table' },
    { id: 'medication-exposure', name: 'Medication / intervention exposure' }, { id: 'protocol-deviations', name: 'Protocol deviations table' },
    { id: 'endpoint', name: 'Endpoint summary table' }, { id: 'subgroup', name: 'Subgroup analysis table' },
  ]},
  { label: 'Systematic Review / Evidence Synthesis', types: [
    { id: 'study-characteristics', name: 'Study characteristics table' }, { id: 'rob-summary', name: 'Risk of bias summary table' },
    { id: 'evidence-extraction', name: 'Evidence extraction table' }, { id: 'outcome-summary', name: 'Outcome summary table' },
    { id: 'grade-profile', name: 'GRADE evidence profile' }, { id: 'included-studies', name: 'Included studies summary' },
  ]},
  { label: 'Academic / Thesis Reporting', types: [
    { id: 'descriptive', name: 'Descriptive statistics table' }, { id: 'hypothesis-testing', name: 'Hypothesis testing results' },
    { id: 'thematic-coding', name: 'Thematic coding summary' }, { id: 'scale-reliability', name: 'Questionnaire / scale reliability' },
    { id: 'learning-outcomes', name: 'Learning outcomes summary' },
  ]},
  { label: 'Custom Report Tables', types: [
    { id: 'journal-template', name: 'Journal-ready custom template' }, { id: 'thesis-chapter', name: 'Thesis chapter table' },
    { id: 'supplementary', name: 'Supplementary appendix table' }, { id: 'landscape', name: 'Landscape analysis table' },
    { id: 'mixed', name: 'Mixed text + numeric table' },
  ]},
];

export function CreateTableWizard() {
  const { state, dispatch, createTable, openTable } = useTableBuilder();
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<SourceType>('blank');
  const [tableType, setTableType] = useState<TableType>('custom');
  const [structure, setStructure] = useState({ columnCount: 4, rowCount: 5, hasGroupedHeaders: false, hasSubheaders: false, hasRowSections: false, hasStubColumn: true, statsLayout: 'single-cell' as const, separatePCI: false, hasFootnotes: true, autoSignificance: true, linkedToSource: false });
  const [meta, setMeta] = useState({ title: '', name: '', caption: '', numberingMode: 'auto' as NumberingMode, manualNumber: '', category: '', sourceAnalysisId: '', sourceDatasetId: '', sectionTarget: '', keywords: '', notesToSelf: '' });
  const [stylePreset, setStylePreset] = useState<StylePresetName>('general-journal');

  useEffect(() => {
    if (state.pendingStatImport) {
      setSourceType('from-stats');
      setMeta(m => ({ 
        ...m, 
        title: state.pendingStatImport.statResult.testName + ' Results',
        sourceAnalysisId: state.pendingStatImport.analysisId || '',
        sourceDatasetId: state.pendingStatImport.datasetId || ''
      }));
    }
  }, [state.pendingStatImport]);

  const close = () => dispatch({ type: 'SET_SHOW_WIZARD', payload: false });

  const handleCreate = async () => {
    let columns: any[] = [];
    let rows: any[] = [];
    let footnotes: any[] = [];
    const preset = STYLE_PRESETS.find(p => p.id === stylePreset);

    if (sourceType === 'from-stats' && state.pendingStatImport) {
      const res = state.pendingStatImport.statResult;
      
      try {
        const bType = state.pendingStatImport.builderType || 'auto';
        
        if (bType === 'descriptive' && res.descriptives && res.descriptives.length > 0) {
           const mapped = buildDescriptiveTable({
              title: 'Descriptive Statistics',
              variables: [{
                  name: 'Outcome Variable',
                  groups: res.descriptives.map((d: any) => ({ name: d.group, n: d.n, mean: d.mean, sd: d.sd, sem: d.sem, median: d.median, min: d.min, max: d.max }))
              }]
           });
           columns = mapped.columns || []; rows = mapped.rows || []; footnotes = mapped.footnotes || [];
        } else if (bType === 'normality' && (res.normalityTest || res.varianceTest)) {
           // Inline simple assumption check table
           const mapped = buildComparativeTable({
              title: 'Assumption Checks',
              includeEffectSize: false,
              comparisons: res.normalityTest ? res.normalityTest.map((n: any) => ({
                 outcome: n.group,
                 groups: [],
                 testUsed: n.testName,
                 statistic: n.statistic,
                 statisticLabel: 'W',
                 pValue: n.pValue,
                 significant: !n.isNormal
              })) : []
           });
           columns = mapped.columns || []; rows = mapped.rows || []; footnotes = mapped.footnotes || [];
        } else if (res.postHoc && res.postHoc.length > 0 && res.testName.toLowerCase().includes('anova')) {
           const mapped = buildANOVATable({
              title: meta.title,
              omnibus: [
                 { source: 'Between Groups', ss: 0, ms: 0, df: res.df1 || 1, fStatistic: res.statisticValue, pValue: res.mainPValue, etaSquared: res.effectSize },
                 { source: 'Within Groups', ss: 0, ms: 0, df: res.df2 || 1 }
              ],
              postHoc: res.postHoc.map((ph: any) => ({ group1: ph.group1, group2: ph.group2, meanDifference: ph.meanDifference || 0, ciLower: ph.ci_lower, ciUpper: ph.ci_upper, pValue: ph.pValue, significant: ph.isSignificant }))
           });
           columns = mapped.columns || []; rows = mapped.rows || []; footnotes = mapped.footnotes || [];
        } else if (res.postHoc || res.testName.toLowerCase().includes('t-test') || res.testName.toLowerCase().includes('mann-whitney') || res.testName.toLowerCase().includes('wilcoxon')) {
           const mapped = buildComparativeTable({
              title: meta.title,
              includeEffectSize: res.effectSize !== undefined,
              comparisons: [{
                 outcome: 'Measurement',
                 groups: res.descriptives ? res.descriptives.map((d: any) => ({ name: d.group, summary: `${d.mean.toFixed(2)} ± ${d.sd.toFixed(2)}` })) : [],
                 testUsed: res.testName,
                 statistic: res.statisticValue,
                 statisticLabel: res.statisticType,
                 df: res.df1?.toString(),
                 pValue: res.mainPValue,
                 effectSize: res.effectSize,
                 effectSizeLabel: res.effectSizeType,
                 significant: res.isSignificant
              }]
           });
           columns = mapped.columns || []; rows = mapped.rows || []; footnotes = mapped.footnotes || [];
        } else if (res.descriptives && res.descriptives.length > 0) {
           const mapped = buildDescriptiveTable({
              title: meta.title,
              variables: [{
                  name: res.testName,
                  groups: res.descriptives.map((d: any) => ({ name: d.group, n: d.n, mean: d.mean, sd: d.sd, sem: d.sem, median: d.median, min: d.min, max: d.max }))
              }]
           });
           columns = mapped.columns || []; rows = mapped.rows || []; footnotes = mapped.footnotes || [];
        } else {
           console.warn("Could not match statResult to any smart builder");
        }
      } catch (err: any) {
         console.error("Failed to map stat result", err);
         alert("Error parsing stats: " + err.message);
      }
    }

    if (!columns.length) {
      // Build default columns
      columns = Array.from({ length: structure.columnCount }, (_, i) => ({
        id: `col-${crypto.randomUUID()}`,
        title: i === 0 && structure.hasStubColumn ? 'Variable' : `Column ${i + 1}`,
        width: 'auto' as const,
        locked: false,
        hidden: false,
        defaultFormat: {},
      }));

      // Build default rows with cells
      rows = Array.from({ length: structure.rowCount }, () => {
        const cells: Record<string, any> = {};
        columns.forEach(c => {
          cells[c.id] = {
            id: crypto.randomUUID(),
            rawValue: null,
            displayValue: '',
            formatType: 'text',
            numericPrecision: 2,
            sourceBinding: null,
            manualOverride: false,
            noteMarkers: [],
            validationFlags: [],
            formatting: { ...DEFAULT_CELL_FORMATTING },
          };
        });
        return { id: `row-${crypto.randomUUID()}`, cells };
      });
    }

    const id = await createTable({
      name: meta.name || meta.title || 'Untitled Table',
      title: meta.title || '',
      caption: meta.caption || '',
      table_type: tableType,
      table_number: meta.numberingMode === 'manual' ? meta.manualNumber : '',
      numbering_mode: meta.numberingMode,
      category: meta.category,
      style_preset: stylePreset,
      columns_json: JSON.stringify(columns),
      rows_json: JSON.stringify(rows),
      footnotes_json: JSON.stringify(footnotes),
      source_analysis_id: meta.sourceAnalysisId || null,
      source_dataset_id: meta.sourceDatasetId || null,
      style_options_json: JSON.stringify(preset?.options || DEFAULT_TABLE_STYLE),
      section_target: meta.sectionTarget,
      keywords: meta.keywords,
      notes_to_self: meta.notesToSelf,
    });

    if (id) {
      await openTable(id);
      close();
    }
  };

  const stepLabels = ['Source', 'Type', 'Structure', 'Metadata', 'Style'];

  return (
    <div className="tb-wizard-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="tb-wizard">
        <div className="tb-wizard-header">
          <h3>Create New Table</h3>
          <button className="tb-btn tb-btn-ghost" onClick={close}>✕</button>
        </div>

        {/* Step indicators */}
        <div className="tb-wizard-steps">
          {stepLabels.map((label, i) => (
            <span key={i}>
              {i > 0 && <span className="tb-wizard-step-arrow"> → </span>}
              <span className={`tb-wizard-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
                <span className="tb-wizard-step-num">{step > i + 1 ? '✓' : i + 1}</span>
                {label}
              </span>
            </span>
          ))}
        </div>

        {/* Body */}
        <div className="tb-wizard-body">
          {step === 1 && (
            <div>
              <p style={{ fontSize: 13, color: '#495057', marginBottom: 14 }}>Choose how to create your table:</p>
              <div className="tb-option-grid">
                {SOURCE_TYPES.map(s => (
                  <div key={s.id} className={`tb-option-card ${sourceType === s.id ? 'selected' : ''}`} onClick={() => setSourceType(s.id)}>
                    <div className="tb-option-card-icon">{s.icon}</div>
                    <div className="tb-option-card-title">{s.title}</div>
                    <div className="tb-option-card-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: 13, color: '#495057', marginBottom: 14 }}>Choose table family:</p>
              <div className="tb-type-list">
                {TABLE_TYPE_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="tb-type-group-label">{group.label}</div>
                    {group.types.map(t => (
                      <div key={t.id} className={`tb-type-item ${tableType === t.id ? 'selected' : ''}`} onClick={() => setTableType(t.id)}>
                        {t.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ fontSize: 13, color: '#495057', marginBottom: 14 }}>Define table structure:</p>
              <div className="tb-form-row">
                <div className="tb-form-group">
                  <label className="tb-form-label">Columns</label>
                  <input type="number" className="tb-form-input" min={1} max={20} value={structure.columnCount} onChange={e => setStructure(s => ({ ...s, columnCount: +e.target.value }))} />
                </div>
                <div className="tb-form-group">
                  <label className="tb-form-label">Body Rows</label>
                  <input type="number" className="tb-form-input" min={1} max={100} value={structure.rowCount} onChange={e => setStructure(s => ({ ...s, rowCount: +e.target.value }))} />
                </div>
              </div>
              {[
                ['hasGroupedHeaders', 'Grouped column headers'],
                ['hasSubheaders',     'Sub-headers'],
                ['hasRowSections',    'Row sections / groups'],
                ['hasStubColumn',     'Stub column (first column labels)'],
                ['hasFootnotes',      'Include footnotes area'],
                ['autoSignificance',  'Auto-attach significance symbols'],
                ['separatePCI',       'Separate p-value & CI columns'],
                ['linkedToSource',    'Link to source analysis'],
              ].map(([key, label]) => (
                <div className="tb-form-checkbox-row" key={key} style={{ marginBottom: 8 }}>
                  <input type="checkbox" checked={(structure as any)[key]} onChange={e => setStructure(s => ({ ...s, [key]: e.target.checked }))} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div>
              <p style={{ fontSize: 13, color: '#495057', marginBottom: 14 }}>Set table metadata:</p>
              <div className="tb-form-row">
                <div className="tb-form-group">
                  <label className="tb-form-label">Table Title</label>
                  <input className="tb-form-input" placeholder="e.g. Baseline Characteristics" value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))} />
                </div>
                <div className="tb-form-group">
                  <label className="tb-form-label">Internal Name</label>
                  <input className="tb-form-input" placeholder="Short name" value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} />
                </div>
              </div>
              <div className="tb-form-group" style={{ marginBottom: 12 }}>
                <label className="tb-form-label">Caption</label>
                <textarea className="tb-form-textarea" placeholder="Descriptive caption for the table..." value={meta.caption} onChange={e => setMeta(m => ({ ...m, caption: e.target.value }))} />
              </div>
              <div className="tb-form-row">
                <div className="tb-form-group">
                  <label className="tb-form-label">Numbering Mode</label>
                  <select className="tb-form-select" value={meta.numberingMode} onChange={e => setMeta(m => ({ ...m, numberingMode: e.target.value as NumberingMode }))}>
                    <option value="auto">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="chapter">Chapter-based</option>
                  </select>
                </div>
                {meta.numberingMode === 'manual' && (
                  <div className="tb-form-group">
                    <label className="tb-form-label">Table Number</label>
                    <input className="tb-form-input" placeholder="e.g. Table 3.1" value={meta.manualNumber} onChange={e => setMeta(m => ({ ...m, manualNumber: e.target.value }))} />
                  </div>
                )}
                <div className="tb-form-group">
                  <label className="tb-form-label">Category</label>
                  <input className="tb-form-input" placeholder="e.g. Results" value={meta.category} onChange={e => setMeta(m => ({ ...m, category: e.target.value }))} />
                </div>
              </div>
              <div className="tb-form-row">
                <div className="tb-form-group">
                  <label className="tb-form-label">Manuscript Section</label>
                  <input className="tb-form-input" placeholder="e.g. Results, Appendix" value={meta.sectionTarget} onChange={e => setMeta(m => ({ ...m, sectionTarget: e.target.value }))} />
                </div>
                <div className="tb-form-group">
                  <label className="tb-form-label">Keywords / Tags</label>
                  <input className="tb-form-input" placeholder="comma-separated" value={meta.keywords} onChange={e => setMeta(m => ({ ...m, keywords: e.target.value }))} />
                </div>
              </div>
              <div className="tb-form-group">
                <label className="tb-form-label">Notes to Self</label>
                <textarea className="tb-form-textarea" placeholder="Internal notes..." value={meta.notesToSelf} onChange={e => setMeta(m => ({ ...m, notesToSelf: e.target.value }))} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <p style={{ fontSize: 13, color: '#495057', marginBottom: 14 }}>Choose a style preset:</p>
              <div className="tb-preset-grid">
                {STYLE_PRESETS.map(p => (
                  <div key={p.id} className={`tb-preset-card ${stylePreset === p.id ? 'selected' : ''}`} onClick={() => setStylePreset(p.id as StylePresetName)}>
                    <div className="tb-preset-preview">
                      <span style={{ fontSize: 28 }}>📋</span>
                    </div>
                    <div className="tb-preset-name">{p.name}</div>
                    <div className="tb-preset-desc">{p.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tb-wizard-footer">
          <button className="tb-btn tb-btn-secondary" onClick={() => step === 1 ? close() : setStep(step - 1)}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button className="tb-btn tb-btn-primary" onClick={() => step < 5 ? setStep(step + 1) : handleCreate()}>
            {step < 5 ? 'Next →' : '✓ Create Table'}
          </button>
        </div>
      </div>
    </div>
  );
}
