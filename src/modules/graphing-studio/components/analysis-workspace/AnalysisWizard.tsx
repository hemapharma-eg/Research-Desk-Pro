import { useState, useMemo } from 'react';
import type { PublicationDataset, VariableMapping } from '../../types/GraphingCoreTypes';
import { runTTest, runOneWayANOVA, runMannWhitneyU, runKruskalWallis } from '../../utils/statService';
import type { StatTestResult } from '../../utils/statService';

interface AnalysisWizardProps {
  dataset: PublicationDataset;
  mapping: VariableMapping;
  onRunTest: (result: StatTestResult) => void;
}

export function AnalysisWizard({ dataset, mapping, onRunTest }: AnalysisWizardProps) {
  const [selectedFamily, setSelectedFamily] = useState<'t-test' | 'anova' | 'non-parametric' | 'none'>('none');
  const [isPaired, setIsPaired] = useState(false);

  // Recommendations based on mapped variables
  const recommendation = useMemo(() => {
    const yCols = mapping.dependentParamIds;
    if (yCols.length === 2 && !isPaired) return "Independent t-test or Mann-Whitney U";
    if (yCols.length === 2 && isPaired) return "Paired t-test or Wilcoxon matched-pairs";
    if (yCols.length > 2) return "One-Way ANOVA or Kruskal-Wallis";
    return "Requires at least 2 groups (Y variables) mapped.";
  }, [mapping, isPaired]);

  const handleRun = () => {
    try {
      const yCols = mapping.dependentParamIds.map(id => dataset.columns.find(c => c.id === id)).filter(Boolean) as { id: string, title: string }[];
      
      if (yCols.length < 2) {
        alert("Please map at least two Y columns in the Variable Mapping panel to run a comparison.");
        return;
      }

      // Extract raw data from mapped columns
      const extractData = (colId: string) => {
        return dataset.rows.map(row => {
          const cell = row.cells[colId]?.[0];
          return cell?.value && !cell.isExcluded ? Number(cell.value) : NaN;
        }).filter(v => !isNaN(v));
      };

      if (selectedFamily === 't-test') {
        if (yCols.length !== 2) throw new Error("T-test requires exactly 2 groups. Use ANOVA instead.");
        const data1 = extractData(yCols[0].id);
        const data2 = extractData(yCols[1].id);
        const result = runTTest(yCols[0].title, data1, yCols[1].title, data2, isPaired);
        onRunTest(result);
      } 
      else if (selectedFamily === 'anova') {
        const groups = yCols.map(c => ({ name: c.title, data: extractData(c.id) }));
        const result = runOneWayANOVA(groups);
        onRunTest(result);
      }
      else if (selectedFamily === 'non-parametric') {
        if (yCols.length === 2) {
          const data1 = extractData(yCols[0].id);
          const data2 = extractData(yCols[1].id);
          const result = runMannWhitneyU(yCols[0].title, data1, yCols[1].title, data2);
          onRunTest(result);
        } else {
          const groups = yCols.map(c => ({ name: c.title, data: extractData(c.id) }));
          const result = runKruskalWallis(groups);
          onRunTest(result);
        }
      }
    } catch (e) {
      alert("Analysis Failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', backgroundColor: 'white' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Analysis Wizard</h3>
      
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px', borderRadius: '4px', fontSize: '11px', color: '#166534', marginBottom: '12px' }}>
        <strong>Recommendation:</strong> {recommendation}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Select Test Family</label>
        <select 
          value={selectedFamily} 
          onChange={e => setSelectedFamily(e.target.value as 't-test' | 'anova' | 'non-parametric' | 'none')}
          style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
        >
          <option value="none">-- Select Test --</option>
          <option value="t-test">T-Test Family (2 Groups)</option>
          <option value="anova">ANOVA Family (3+ Groups)</option>
          <option value="non-parametric">Nonparametric (Rank-based)</option>
        </select>
      </div>

      {selectedFamily === 't-test' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', marginBottom: '12px' }}>
          <input type="checkbox" checked={isPaired} onChange={e => setIsPaired(e.target.checked)} />
          Paired / Repeated Measures
        </label>
      )}

      <button 
        onClick={handleRun}
        disabled={selectedFamily === 'none' || mapping.dependentParamIds.length < 2}
        style={{ width: '100%', padding: '8px', background: selectedFamily !== 'none' && mapping.dependentParamIds.length >= 2 ? '#3B82F6' : '#94A3B8', color: 'white', fontWeight: 'bold', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Run Test & Annotate
      </button>
    </div>
  );
}
