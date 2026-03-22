import React from 'react';
import { usePowerWizard } from '../../context/PowerWizardContext';

export function ScreenGSpecialDesign() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleToggle = (key: string) => {
    const current = state.designStructure?.[key] || false;
    updateState({ designStructure: { ...state.designStructure, [key]: !current } });
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
          Special Animal Design Options (Screen G)
        </h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          Identify any specific macro-structures in your experiment. Selecting these will configure the downstream calculators to account for blocking, dose escalation, or control groups.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!state.designStructure?.doseEscalation} onChange={() => handleToggle('doseEscalation')} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <div>
            <strong style={{ display: 'block' }}>Multi-Dose Escalation Pharmacology</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>Requires trend-test powering or simultaneous multi-arm comparison against a vehicle.</span>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!state.designStructure?.shamBlock} onChange={() => handleToggle('shamBlock')} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <div>
            <strong style={{ display: 'block' }}>Sham / Disease / Treatment Structure</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>Study contains an induced diseased un-treated baseline and a sham non-diseased baseline.</span>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!state.designStructure?.blocking} onChange={() => handleToggle('blocking')} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <div>
            <strong style={{ display: 'block' }}>Blocking (Batch / Day / Rack)</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>Experiment is run in temporal or spatial batches, requiring block stratification in the model.</span>
          </div>
        </label>

      </div>

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(79,70,229,0.05)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-4)' }}>
        <p style={{ margin: 0 }}><strong>Next Step:</strong> You have completed the ARRIVE/NC3Rs preclinical context phase. In the next stages, you will set the formal statistical endpoint and mathematical parameters based on this biological context.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: 'var(--color-text-primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
           Enter Statistical Design Pipeline →
         </button>
      </div>

    </div>
  );
}
