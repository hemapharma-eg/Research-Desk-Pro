import React, { useState } from 'react';
import { usePowerWizard } from '../../context/PowerWizardContext';

export function ScreenCExperimentalUnit() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const units = [
    { id: 'animal', label: 'Individual Animal', desc: 'Treatment is randomized/assigned to individual animals independently.' },
    { id: 'cage', label: 'Cage / Enclosure', desc: 'Treatment is applied to the group via food/water/environment.' },
    { id: 'litter', label: 'Dam / Litter', desc: 'Treatment is given to the mother and offspring are measured.' },
    { id: 'side', label: 'Body Side / Organ', desc: 'Left vs Right comparisons within the same animal.' },
    { id: 'tissue', label: 'Tissue Preparation / Cell Slice', desc: 'Multiple preparations extracted from one source animal.' },
  ];

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
            True Experimental Unit (Screen C)
          </h2>
        </div>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          <strong>CRITICAL:</strong> Sample size is the number of experimental units per group, not automatically the number of animals. Misidentifying this leads to severe pseudoreplication (NC3Rs Guidelines). What is the true experimental unit?
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {units.map(unit => (
          <div 
            key={unit.id}
            onClick={() => updateState({ trueExperimentalUnit: unit.id })}
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: state.trueExperimentalUnit === unit.id ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
              backgroundColor: state.trueExperimentalUnit === unit.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>{unit.label}</span>
            <span style={{ color: '#475569', fontSize: 'var(--font-size-sm)' }}>{unit.desc}</span>
          </div>
        ))}
      </div>

      {['cage', 'litter'].includes(state.trueExperimentalUnit as string) && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
          <strong>Attention:</strong> Because treatment is assigned at the <strong>{state.trueExperimentalUnit}</strong> level, your statistical unit of "N = 1" is the {state.trueExperimentalUnit}. The number of animals derived will be a clustered translation step at the end of the calculation. The Cluster (ICC) module will be activated automatically.
        </div>
      )}

      {['tissue'].includes(state.trueExperimentalUnit as string) && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
          <strong>Warning:</strong> Measuring 10 slices from 1 animal yields an N of 1 animal, not 10 independent samples. Grouping tissues as independent units is classic pseudoreplication unless variance within the animal is completely ignorable.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!state.trueExperimentalUnit} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: state.trueExperimentalUnit ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: state.trueExperimentalUnit ? 'white' : 'var(--color-text-tertiary)', cursor: state.trueExperimentalUnit ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Continue to Pseudoreplication Checks →
         </button>
      </div>

    </div>
  );
}
