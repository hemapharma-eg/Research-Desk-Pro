import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Screen2Structure() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleSelect = (val: string) => {
    updateState({ designStructure: val, analysisModel: null });
  };

  // Dynamically filter structures based on endpoint family and preclinical flags
  const getStructures = () => {
    let options = [
      { id: 'one_sample', label: 'One Sample / Single Group', desc: 'Comparing to a known reference value.' },
      { id: 'two_parallel', label: 'Two-Arm Parallel', desc: 'Independent treatment and control groups.' },
      { id: 'paired', label: 'Paired / Matched', desc: 'Before/After or matched pairs.' },
      { id: 'multi_arm', label: 'K-Arm Parallel (ANOVA-like)', desc: 'Three or more independent groups.' },
    ];

    if (state.endpointFamily === 'diagnostic') {
      options = [
        { id: 'diag_single', label: 'Single Test Accuracy', desc: 'Evaluates one diagnostic test against a gold standard.' },
        { id: 'diag_compare', label: 'Diagnostic Comparison', desc: 'Comparing Test A vs Test B.' }
      ];
    }

    if (state.researchSetting === 'human') {
      options.push(
        { id: 'crossover', label: 'Crossover Design', desc: 'Subjects receive treatments sequentially.' },
        { id: 'cluster', label: 'Cluster Randomized (CRT)', desc: 'Randomization happens at group level (e.g. hospitals).' }
      );
    }

    return options;
  };

  const structures = getStructures();

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ padding: 'var(--space-5)', backgroundColor: '#ECFEFF', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid #0891B2' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: '#164E63' }}>
          Study Design Structure (Screen 2)
        </h2>
        <p style={{ color: '#155E75', fontSize: 'var(--font-size-md)', lineHeight: 1.6, fontWeight: '500' }}>
          How is your data structured across your participants? The independence or correlation of your groups defines the statistical denominator.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
        {structures.map(design => (
          <button
            key={design.id}
            onClick={() => handleSelect(design.id)}
            style={{
              padding: 'var(--space-4)', textAlign: 'left', borderRadius: 'var(--radius-md)',
              border: state.designStructure === design.id ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)',
              backgroundColor: state.designStructure === design.id ? 'rgba(79, 70, 229, 0.05)' : 'var(--color-bg-surface)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <strong style={{ display: 'block', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>{design.label}</strong>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>{design.desc}</span>
          </button>
        ))}
      </div>

      {/* Group count input for multi-arm designs */}
      {state.designStructure === 'multi_arm' && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: '#F0F9FF', borderRadius: 'var(--radius-lg)', border: '2px solid #0891B2' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#164E63', fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-2)' }}>
            How many treatment groups (arms) will your study have?
          </label>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#155E75', marginBottom: 'var(--space-3)' }}>
            This is critical for ANOVA-family calculations. Include the control group in your count.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {[3, 4, 5, 6].map(n => (
              <button 
                key={n}
                onClick={() => updateState({ numberOfGroups: n })}
                style={{ 
                  padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)',
                  border: state.numberOfGroups === n ? '2px solid #0891B2' : '1px solid #CBD5E1',
                  backgroundColor: state.numberOfGroups === n ? '#0891B2' : 'white',
                  color: state.numberOfGroups === n ? 'white' : '#334155',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--font-size-lg)',
                  transition: 'all 0.15s'
                }}
              >{n}</button>
            ))}
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#64748B', marginLeft: 'var(--space-2)' }}>or enter:</span>
            <input 
              type="number" min="3" max="20" 
              value={state.numberOfGroups}
              onChange={e => updateState({ numberOfGroups: Math.max(3, parseInt(e.target.value) || 3) })}
              style={{ width: '80px', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1', fontSize: 'var(--font-size-lg)', fontWeight: 'bold', textAlign: 'center' }}
            />
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#334155', fontWeight: '500' }}>groups</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} disabled={!state.designStructure || (state.designStructure === 'multi_arm' && state.numberOfGroups < 3)} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: state.designStructure ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', color: state.designStructure ? 'white' : 'var(--color-text-tertiary)', cursor: state.designStructure ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
           Select Objective →
         </button>
      </div>

    </div>
  );
}
