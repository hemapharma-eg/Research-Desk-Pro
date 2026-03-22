import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Screen4Analysis() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleSelect = (val: string) => {
    updateState({ analysisModel: val });
  };

  const getRecommendations = () => {
    const ep = state.endpointFamily;
    const struct = state.designStructure;

    if (ep === 'continuous') {
      if (struct === 'two_parallel') return [
        { id: 't_test', label: 'Independent T-Test', tag: 'Standard' },
        { id: 'ancova', label: 'ANCOVA (Baseline Adjusted)', tag: 'Higher Power' },
        { id: 'mann_whitney', label: 'Mann-Whitney U Test', tag: 'Non-Parametric' }
      ];
      if (struct === 'paired') return [
        { id: 'paired_t', label: 'Paired T-Test', tag: 'Standard' },
        { id: 'mixed_model_rep', label: 'Mixed-Effects Model', tag: 'Advanced' }
      ];
      if (struct === 'multi_arm') return [
        { id: 'anova_1', label: 'One-Way ANOVA', tag: 'Standard' }
      ];
    }
    
    if (ep === 'binary') {
      if (struct === 'two_parallel') return [
        { id: 'chi_square', label: 'Chi-Square Test', tag: 'Standard' },
        { id: 'fisher_exact', label: 'Fisher\'s Exact Test', tag: 'Small N' },
        { id: 'logistic_reg', label: 'Logistic Regression', tag: 'Adjusted' }
      ];
    }

    if (ep === 'survival') {
      return [
        { id: 'log_rank', label: 'Log-Rank Test', tag: 'Standard' },
        { id: 'cox_ph', label: 'Cox Proportional Hazards', tag: 'Adjusted' }
      ];
    }

    // Generic fallback for unaccounted combinations currently
    return [
      { id: 'generic_parametric', label: 'Standard Parametric Approximation', tag: 'General' },
      { id: 'generic_simulation', label: 'Monte Carlo Simulation Framework', tag: 'Advanced' }
    ];
  };

  const recommendations = getRecommendations();

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ padding: 'var(--space-5)', backgroundColor: '#FDF4FF', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid #C026D3' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: '#701A75' }}>
          Planned Analysis Model (Screen 4)
        </h2>
        <p style={{ color: '#86198F', fontSize: 'var(--font-size-md)', lineHeight: 1.6, fontWeight: '500' }}>
          Power analysis calculations must algorithmically mirror the statistical model you intend to use in your final analysis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: '#334155', marginTop: 'var(--space-2)' }}>Algorithm Recommendations</h3>
        {recommendations.map(model => (
          <button
            key={model.id}
            onClick={() => handleSelect(model.id)}
            style={{
              padding: 'var(--space-4)', textAlign: 'left', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: state.analysisModel === model.id ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
              backgroundColor: state.analysisModel === model.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <strong style={{ fontSize: 'var(--font-size-lg)', color: state.analysisModel === model.id ? 'var(--color-accent-primary)' : 'var(--color-text-primary)' }}>
              {model.label}
            </strong>
            <span style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-hover)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>
              {model.tag}
            </span>
          </button>
        ))}
      </div>

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(79,70,229,0.05)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-4)' }}>
        <p style={{ margin: 0 }}><strong>Next Step:</strong> You will define Alpha, Power Boundaries, and specifically parameterize the {state.endpointFamily} distribution arrays.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!state.analysisModel} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: state.analysisModel ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: state.analysisModel ? 'white' : 'var(--color-text-tertiary)', cursor: state.analysisModel ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Define Assumptions Array →
         </button>
      </div>

    </div>
  );
}
