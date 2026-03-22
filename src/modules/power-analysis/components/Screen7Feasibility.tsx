import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Screen7Feasibility() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleUpdate = (field: string, val: any) => {
    updateState({ [field]: val });
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ padding: 'var(--space-5)', backgroundColor: '#FEFCE8', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid #CA8A04' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: '#713F12' }}>
          Feasibility & Constraints (Screen 7/8)
        </h2>
        <p style={{ color: '#854D0E', fontSize: 'var(--font-size-md)', lineHeight: 1.6, fontWeight: '500' }}>
          Statistical power is often bound by harsh biological or financial realities. Provide your maximum realistic sample size so the engine can calculate your 'Achievable Power' if needed.
        </p>
      </div>

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Maximum Available N (Optional Constraint)</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: '#475569', marginBottom: 'var(--space-3)' }}>
          If your animal colony can only produce 40 mice, or you only have funding for 100 human patients, enter that here. We will invert the calculation to show your Achieved Power.
        </p>
        
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Total Max Sample Size (All Groups Combined)</label>
        <input 
          type="number" 
          step="1" 
          min="2" 
          placeholder="e.g. Leave blank if unconstrained" 
          value={state.assumptions?.maxN || ''} 
          onChange={e => handleUpdate('assumptions', { ...state.assumptions, maxN: e.target.value ? parseInt(e.target.value) : null })} 
          style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontSize: 'var(--font-size-md)' }} 
        />
      </div>

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(79,70,229,0.05)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
        <p style={{ margin: 0 }}><strong>Final Step:</strong> You have completed the rigid Preclinical/Clinical methodology pipeline. The application will now assemble your parameters and compute your N, Power distributions, and multidimensional sensitivity graphs.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: 'var(--color-text-primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
           Compute Power & Report →
         </button>
      </div>

    </div>
  );
}
