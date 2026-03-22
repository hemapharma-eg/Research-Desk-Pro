import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Screen1Endpoint() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleSelect = (endpoint: string) => {
    updateState({ endpointFamily: endpoint, designStructure: null, analysisModel: null }); // Reset downstream
  };

  const endpoints = [
    { id: 'continuous', label: 'Continuous', desc: 'Means, blood pressure, scores, weights.' },
    { id: 'binary', label: 'Binary / Proportion', desc: 'Responder yes/no, event occurred.' },
    { id: 'ordinal', label: 'Ordinal', desc: 'Likert scales, severity categories, mRS scores.' },
    { id: 'count', label: 'Count / Rate', desc: 'Number of seizures, ER visits per year.' },
    { id: 'survival', label: 'Time-to-Event (Survival)', desc: 'Time to relapse or progression-free survival.' },
    { id: 'diagnostic', label: 'Diagnostic Accuracy', desc: 'Sensitivity, Specificity, AUC validation.' },
    { id: 'reliability', label: 'Agreement / Reliability', desc: 'Kappa, Intraclass Correlation (ICC).' },
    { id: 'prediction', label: 'Prediction Model', desc: 'R² validation, calibration, external validation.' },
  ];

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ padding: 'var(--space-5)', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid #2563EB' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: '#1E3A8A' }}>
          Primary Endpoint Family (Screen 1)
        </h2>
        <p style={{ color: '#1E40AF', fontSize: 'var(--font-size-md)', lineHeight: 1.6, fontWeight: '500' }}>
          What is the statistical nature of your primary outcome? The core underlying distribution of the data dictates your mathematical path.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
        {endpoints.map(ep => (
          <button
            key={ep.id}
            onClick={() => handleSelect(ep.id)}
            style={{
              padding: 'var(--space-4)', textAlign: 'left', borderRadius: 'var(--radius-md)',
              border: state.endpointFamily === ep.id ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
              backgroundColor: state.endpointFamily === ep.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <strong style={{ display: 'block', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)', color: state.endpointFamily === ep.id ? 'var(--color-accent-primary)' : 'var(--color-text-primary)' }}>{ep.label}</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>{ep.desc}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!state.endpointFamily} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: state.endpointFamily ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: state.endpointFamily ? 'white' : 'var(--color-text-tertiary)', cursor: state.endpointFamily ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Select Design Layout →
         </button>
      </div>

    </div>
  );
}
