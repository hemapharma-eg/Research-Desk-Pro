import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Step4Results() {
  const { state, prevStep } = usePowerWizard();

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: 'var(--color-accent-primary)' }}>
          Phase 6 Mathematical Engine Checkpoint
        </h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          You have successfully navigated the entire SME Master Build pipeline! The structured parameters have been collected exactly as required. The Phase 6 calculation engines (JStat boundaries, heatmaps, PDF methods export) will be built to intercept this data object.
        </p>
      </div>

      <div style={{ padding: 'var(--space-4)', backgroundColor: '#1E1E1E', borderRadius: 'var(--radius-lg)', color: '#D4D4D4', overflowX: 'auto', fontFamily: 'monospace' }}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>Current Compiled StudyState Object:</h3>
        <pre style={{ margin: 0, fontSize: '13px' }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Return to Assumptions
         </button>
      </div>

    </div>
  );
}
