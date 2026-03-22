import React, { useState } from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Screen6Assumptions() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();
  
  // Side-panel integrated effect size calculator state
  const [showCalc, setShowCalc] = useState(false);
  const [calcInput, setCalcInput] = useState({ m1: '', m2: '', sd1: '', sd2: '', p1: '', p2: '' });

  const handleUpdate = (field: string, val: string | number) => {
    updateState({ assumptions: { ...state.assumptions, [field]: val } });
  };

  const getVal = (field: string) => state.assumptions?.[field] || '';

  const renderContinuous = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{ color: '#334155', fontSize: 'var(--font-size-sm)' }}>For {state.analysisModel?.replace('_', ' ')}, you must estimate the expected difference in group means and the anticipated variance.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Expected Mean Difference (Δ)</label>
          <input type="number" step="0.1" placeholder="e.g. 5.5" value={getVal('meanDifference')} onChange={e => handleUpdate('meanDifference', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-3)', marginTop: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>Pooled Standard Deviation (σ)</label>
          <input type="number" step="0.1" min="0" placeholder="e.g. 12.0" value={getVal('standardDeviation')} onChange={e => handleUpdate('standardDeviation', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-3)', marginTop: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
        </div>
      </div>
      
      {state.designStructure === 'paired' && (
        <div>
          <label style={{ fontWeight: 'bold' }}>Pre/Post Correlation (r)</label>
          <input type="number" step="0.1" min="-1" max="1" placeholder="e.g. 0.5" value={getVal('correlation')} onChange={e => handleUpdate('correlation', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-3)', marginTop: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>Measures how strongly repeated measurements correlate. (0.5 is a safe default).</span>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-2)' }}>
        <button onClick={() => setShowCalc(!showCalc)} style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-bg-hover)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
          {showCalc ? 'Close Effect Size Calculator' : 'Need help estimating? Open Calculator (Cohen\'s d)'}
        </button>
        
        {showCalc && (
          <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'rgba(41, 98, 255, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(41, 98, 255, 0.2)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Cohen\'s d Estimator</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <input type="number" placeholder="Mean Group 1" value={calcInput.m1} onChange={e => setCalcInput({...calcInput, m1: e.target.value})} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />
              <input type="number" placeholder="Mean Group 2" value={calcInput.m2} onChange={e => setCalcInput({...calcInput, m2: e.target.value})} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />
              <input type="number" placeholder="SD Group 1" value={calcInput.sd1} onChange={e => setCalcInput({...calcInput, sd1: e.target.value})} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />
              <input type="number" placeholder="SD Group 2" value={calcInput.sd2} onChange={e => setCalcInput({...calcInput, sd2: e.target.value})} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />
            </div>
            {Number(calcInput.m1) && Number(calcInput.sd1) && Number(calcInput.sd2) ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <span>Calculated Effect Size (d): <strong>{( Math.abs(Number(calcInput.m1) - Number(calcInput.m2)) / Math.sqrt((Math.pow(Number(calcInput.sd1), 2) + Math.pow(Number(calcInput.sd2), 2)) / 2) ).toFixed(3)}</strong></span>
                <button 
                  onClick={() => {
                    handleUpdate('meanDifference', Math.abs(Number(calcInput.m1) - Number(calcInput.m2)));
                    handleUpdate('standardDeviation', Math.sqrt((Math.pow(Number(calcInput.sd1), 2) + Math.pow(Number(calcInput.sd2), 2)) / 2));
                    setShowCalc(false);
                  }}
                  style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Apply array to pipeline</button>
              </div>
            ) : <span style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>Fill array to compute pooled Cohen's d.</span>}
          </div>
        )}
      </div>
    </div>
  );

  const renderBinary = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{ color: '#334155', fontSize: 'var(--font-size-sm)' }}>For discrete event endpoints, define the expected baseline occurrence rate and the target relative risk or absolute reduction.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Group 1 (Control) Proportion (P₁)</label>
          <input type="number" step="0.01" min="0" max="1" placeholder="e.g. 0.35 (35%)" value={getVal('p1')} onChange={e => handleUpdate('p1', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-3)', marginTop: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>Group 2 (Treatment) Proportion (P₂)</label>
          <input type="number" step="0.01" min="0" max="1" placeholder="e.g. 0.20 (20%)" value={getVal('p2')} onChange={e => handleUpdate('p2', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-3)', marginTop: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
        </div>
      </div>
    </div>
  );

  const renderSurvival = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{ color: '#334155', fontSize: 'var(--font-size-sm)' }}>For time-to-event analysis, hazard ratios and median survivals dictate mathematical power far more than raw sample size.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Hazard Ratio (HR)</label>
          <input type="number" step="0.05" min="0.01" placeholder="e.g. 0.70" value={getVal('hazardRatio')} onChange={e => handleUpdate('hazardRatio', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-3)', marginTop: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>Control Median Survival (Months)</label>
          <input type="number" step="1" min="1" placeholder="e.g. 14" value={getVal('medianSurvival')} onChange={e => handleUpdate('medianSurvival', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-3)', marginTop: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
        </div>
      </div>
    </div>
  );

  const isValid = () => {
    if (state.endpointFamily === 'continuous') return getVal('meanDifference') && getVal('standardDeviation');
    if (state.endpointFamily === 'binary') return getVal('p1') && getVal('p2');
    if (state.endpointFamily === 'survival') return getVal('hazardRatio');
    return false;
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ padding: 'var(--space-5)', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid #DC2626' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: '#7F1D1D' }}>
          Mathematical Assumptions (Screen 6/7)
        </h2>
        <p style={{ color: '#991B1B', fontSize: 'var(--font-size-md)', lineHeight: 1.6, fontWeight: '500' }}>
          Inject the explicit numerical assumptions necessary to compute N based on the {state.analysisModel} core algorithms.
        </p>
      </div>

      <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-lg)' }}>
        {state.endpointFamily === 'continuous' ? renderContinuous() : 
         state.endpointFamily === 'binary' ? renderBinary() : 
         state.endpointFamily === 'survival' ? renderSurvival() : 
         (
           <div style={{ color: '#475569', fontStyle: 'italic' }}>
             Mathematical boundary interface not yet mapped for this esoteric endpoint. Using generic inputs.
           </div>
         )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!isValid()} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: isValid() ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: isValid() ? 'white' : 'var(--color-text-tertiary)', cursor: isValid() ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Run Power Calculations →
         </button>
      </div>

    </div>
  );
}
