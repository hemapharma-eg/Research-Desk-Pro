import React from 'react';
import { usePowerWizard } from '../../context/PowerWizardContext';

export function ScreenDPseudoreplication() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleToggleNesting = (key: string) => {
    const current = state.nestingStructure?.[key] || false;
    updateState({ nestingStructure: { ...state.nestingStructure, [key]: !current } });
  };

  const hasFlags = state.nestingStructure && Object.values(state.nestingStructure).some(v => v);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
          Nesting & Pseudoreplication Scan (Screen D)
        </h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          Select any conditions that apply to your planned experiment. This ensures we deploy Mixed-Models or GEE adjustments if non-independent measurements are present.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!state.nestingStructure?.repeatedMeasures} onChange={() => handleToggleNesting('repeatedMeasures')} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <div>
            <strong style={{ display: 'block' }}>Repeated Measurements over Time</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>The same animal undergoes multiple assessments sequentially.</span>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!state.nestingStructure?.groupedCages} onChange={() => handleToggleNesting('groupedCages')} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <div>
            <strong style={{ display: 'block' }}>Animals are Group-housed (Cage/Litter affects outcome)</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>Dominance, micro-environment, or maternal effects might correlate outcomes within groups.</span>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!state.nestingStructure?.subsampling} onChange={() => handleToggleNesting('subsampling')} style={{ marginTop: '4px', width: '18px', height: '18px' }} />
          <div>
            <strong style={{ display: 'block' }}>Subsampling (Multiple slices/wells per animal)</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>We are measuring technical replicates from one biological unit.</span>
          </div>
        </label>

      </div>

      {hasFlags && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(79,70,229,0.1)', color: 'var(--color-accent-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', border: '1px solid var(--color-accent-primary)' }}>
          <strong>System Override:</strong> You have identified nested or repeated structures. The analytic engine will automatically unlock clustered design effect methodologies (ICC/GEE/MMRM) later in the workflow. Independent T-Tests will be explicitly flagged if forced.
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
