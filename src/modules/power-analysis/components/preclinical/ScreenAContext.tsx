import React from 'react';
import { usePowerWizard } from '../../context/PowerWizardContext';

export function ScreenAContext() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const options = [
    { id: 'efficacy', label: 'Pharmacology Efficacy Study' },
    { id: 'dose_ranging', label: 'Dose-Ranging Pharmacology Study' },
    { id: 'toxicology', label: 'Toxicology / Safety Pharmacology' },
    { id: 'pk', label: 'Pharmacokinetic (PK) Study' },
    { id: 'pd', label: 'Pharmacodynamic (PD) Study' },
    { id: 'pk_pd', label: 'PK/PD Integrated Study' },
    { id: 'disease_model', label: 'Disease-Model Intervention' },
    { id: 'mechanistic', label: 'Mechanistic Biomarker Study' },
    { id: 'behavioral', label: 'Behavioral / Neurological Study' },
    { id: 'survival', label: 'Survival / Challenge Model' },
    { id: 'pilot', label: 'Exploratory Pilot Animal Study' },
    { id: 'confirmatory', label: 'Confirmatory Animal Study' },
  ];

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
          Preclinical Context (Screen A)
        </h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)' }}>
          To conform to ARRIVE 2.0 and NC3Rs experimental guidelines, what type of preclinical study are you planning?
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => updateState({ studyContext: opt.id })}
            style={{
              padding: 'var(--space-4)',
              textAlign: 'left',
              borderRadius: 'var(--radius-md)',
              border: state.studyContext === opt.id ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
              backgroundColor: state.studyContext === opt.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
              fontWeight: state.studyContext === opt.id ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {state.studyContext === 'pilot' && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
          <strong>Notice:</strong> Exploratory pilot studies may not require formal superiority hypothesis testing power analyses. The system will activate the resource-equation/feasibility planner later in the workflow.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!state.studyContext} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: state.studyContext ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: state.studyContext ? 'white' : 'var(--color-text-tertiary)', cursor: state.studyContext ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Continue to Unit Detection →
         </button>
      </div>

    </div>
  );
}
