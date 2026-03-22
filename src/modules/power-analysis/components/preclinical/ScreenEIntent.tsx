import React from 'react';
import { usePowerWizard } from '../../context/PowerWizardContext';

export function ScreenEIntent() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleSelect = (val: string) => {
    updateState({ studyObjective: val });
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
          Study Intent (Screen E)
        </h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          Not all animal studies are designed for formal hypothesis testing. Selecting an exploratory pilot will route you to parameter-estimation frameworks (e.g., Resource Equation Method) rather than enforcing 80% statistical power.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        
        <button 
          onClick={() => handleSelect('confirmatory_superiority')}
          style={{
            padding: 'var(--space-4)', textAlign: 'left', borderRadius: 'var(--radius-md)',
            border: state.studyObjective === 'confirmatory_superiority' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
            backgroundColor: state.studyObjective === 'confirmatory_superiority' ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
            cursor: 'pointer'
          }}
        >
          <strong style={{ display: 'block', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>Confirmatory / Hypothesis-Driven</strong>
          <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>A definitive study powered rigorously to claim efficacy, equivalence, or non-inferiority.</span>
        </button>

        <button 
          onClick={() => handleSelect('exploratory_pilot')}
          style={{
            padding: 'var(--space-4)', textAlign: 'left', borderRadius: 'var(--radius-md)',
            border: state.studyObjective === 'exploratory_pilot' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
            backgroundColor: state.studyObjective === 'exploratory_pilot' ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
            cursor: 'pointer'
          }}
        >
          <strong style={{ display: 'block', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>Exploratory Pilot / Signal Detection</strong>
          <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>Intended to establish variance, test feasibility, or locate a gross biologically plausible signal, NOT to prove a p-value.</span>
        </button>

        <button 
          onClick={() => handleSelect('parameter_estimation')}
          style={{
            padding: 'var(--space-4)', textAlign: 'left', borderRadius: 'var(--radius-md)',
            border: state.studyObjective === 'parameter_estimation' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
            backgroundColor: state.studyObjective === 'parameter_estimation' ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
            cursor: 'pointer'
          }}
        >
          <strong style={{ display: 'block', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>Precision / Parameter Estimation</strong>
          <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>Powered to bound a 95% Confidence Interval cleanly around an event rate or biomarker value.</span>
        </button>

      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!state.studyObjective} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: state.studyObjective ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: state.studyObjective ? 'white' : 'var(--color-text-tertiary)', cursor: state.studyObjective ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Continue →
         </button>
      </div>

    </div>
  );
}
