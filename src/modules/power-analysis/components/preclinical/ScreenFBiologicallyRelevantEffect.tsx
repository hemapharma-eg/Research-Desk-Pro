import React from 'react';
import { usePowerWizard } from '../../context/PowerWizardContext';

export function ScreenFBiologicallyRelevantEffect() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleUpdate = (field: string, value: string) => {
    updateState({ 
      assumptions: { ...state.assumptions, [field]: value }
    });
  };

  const getVal = (field: string) => state.assumptions?.[field] || '';

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
          Biologically Relevant Effect (Screen F)
        </h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          NC3Rs asks researchers to define the smallest effect size that would be of biological or clinical interest, rather than calculating based purely on statistical convenience.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Target Effect Scale</label>
          <select 
            value={getVal('targetEffectScale')} 
            onChange={e => handleUpdate('targetEffectScale', e.target.value)}
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontSize: 'var(--font-size-md)', backgroundColor: 'var(--color-bg-surface)' }}
          >
            <option value="">Select scale...</option>
            <option value="absolute_mean">Absolute Mean Difference</option>
            <option value="percent_change">Percent Change from Control</option>
            <option value="fold_change">Fold Change</option>
            <option value="binary_risk">Binary Response / Risk Rate</option>
            <option value="hazard_ratio">Survival Hazard Ratio</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Justification for Biological Relevance</label>
          <select 
            value={getVal('effectJustification')} 
            onChange={e => handleUpdate('effectJustification', e.target.value)}
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontSize: 'var(--font-size-md)', backgroundColor: 'var(--color-bg-surface)' }}
          >
            <option value="">Select justification...</option>
            <option value="literature">Prior Literature / Meta-Analysis</option>
            <option value="pilot">Translational Pilot Data</option>
            <option value="mechanistic">Mechanistic / Biological Expectation</option>
            <option value="regulatory">Regulatory Expectation (e.g. FDA)</option>
            <option value="expert">Expert Subject-Matter Judgement</option>
            <option value="none">No formal justification (Rule of thumb)</option>
          </select>
        </div>

      </div>

      {getVal('effectJustification') === 'none' && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
          <strong>Warning:</strong> "T-shirt sizing" an effect size (e.g., Cohen's d = 0.8) without biological rationale is strongly discouraged by regulatory and ethical funding bodies in animal research.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
           Continue →
         </button>
      </div>

    </div>
  );
}
