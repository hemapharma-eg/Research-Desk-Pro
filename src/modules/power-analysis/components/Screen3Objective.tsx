import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Screen3Objective() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleSelect = (val: string) => {
    updateState({ studyObjective: val });
  };

  const objectives = [
    { id: 'superiority', label: 'Superiority', desc: 'Testing if the new intervention is strictly better than control/baseline.' },
    { id: 'non_inferiority', label: 'Non-Inferiority', desc: 'Testing if the new intervention is no worse than the active standard of care.' },
    { id: 'equivalence', label: 'Equivalence', desc: 'Testing if the new intervention is functionally identical (within boundaries) to standard.' },
  ];

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ padding: 'var(--space-5)', backgroundColor: '#F5F3FF', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid #7C3AED' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: '#4C1D95' }}>
          Study Objective (Screen 3)
        </h2>
        <p style={{ color: '#5B21B6', fontSize: 'var(--font-size-md)', lineHeight: 1.6, fontWeight: '500' }}>
          Is this study attempting to beat a standard, or establish parity? Equivalence and Non-Inferiority require specialized boundary margin inputs downstream.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {objectives.map(obj => (
          <button
            key={obj.id}
            onClick={() => handleSelect(obj.id)}
            style={{
              padding: 'var(--space-4)', textAlign: 'left', borderRadius: 'var(--radius-md)',
              border: state.studyObjective === obj.id ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
              backgroundColor: state.studyObjective === obj.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <strong style={{ display: 'block', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>{obj.label}</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>{obj.desc}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!state.studyObjective} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: state.studyObjective ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: state.studyObjective ? 'white' : 'var(--color-text-tertiary)', cursor: state.studyObjective ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Select Analysis Model →
         </button>
      </div>

    </div>
  );
}
