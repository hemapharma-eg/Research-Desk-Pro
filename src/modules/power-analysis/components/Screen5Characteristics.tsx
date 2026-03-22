import React from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';

export function Screen5Characteristics() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleChange = (field: string, val: number | string) => {
    updateState({ [field]: val });
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ padding: 'var(--space-5)', backgroundColor: '#FFF7ED', borderRadius: 'var(--radius-lg)', borderLeft: '5px solid #EA580C' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: '#7C2D12' }}>
          Operating Characteristics (Screen 5)
        </h2>
        <p style={{ color: '#9A3412', fontSize: 'var(--font-size-md)', lineHeight: 1.6, fontWeight: '500' }}>
          Define the statistical scaffolding surrounding the mathematical equation—the acceptable error rates and drop-out buffers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        
        {/* Alpha / Type I Error */}
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Typical Alpha (Type I Error)</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[0.01, 0.05, 0.10].map(val => (
               <button 
                key={val} onClick={() => handleChange('alpha', val)}
                style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: state.alpha === val ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)', backgroundColor: state.alpha === val ? 'var(--color-accent-primary)' : 'transparent', color: state.alpha === val ? 'white' : 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
               >{val}</button>
            ))}
          </div>
          <input type="number" step="0.01" min="0.0001" max="0.20" value={state.alpha} onChange={e => handleChange('alpha', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-2)', marginTop: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
          <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: '#475569', marginTop: 'var(--space-2)' }}>Standard: 0.05 (5% chance of finding a false positive).</span>
        </div>

        {/* Power / Type II Error */}
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Target Power (1 - β)</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[0.80, 0.90, 0.95].map(val => (
               <button 
                key={val} onClick={() => handleChange('power', val)}
                style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: state.power === val ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)', backgroundColor: state.power === val ? 'var(--color-accent-primary)' : 'transparent', color: state.power === val ? 'white' : 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
               >{val * 100}%</button>
            ))}
          </div>
          <input type="number" step="0.01" min="0.50" max="0.99" value={state.power} onChange={e => handleChange('power', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-2)', marginTop: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)' }} />
          <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: '#475569', marginTop: 'var(--space-2)' }}>Standard: 80% (20% chance of missing a true signal). Modern trials often use 90%.</span>
        </div>

        {/* Sidedness */}
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Hypothesis Sidedness</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button onClick={() => handleChange('sidedness', 'one-sided')} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: state.sidedness === 'one-sided' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)', backgroundColor: state.sidedness === 'one-sided' ? 'var(--color-accent-primary)' : 'transparent', color: state.sidedness === 'one-sided' ? 'white' : 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>One-Tailed</button>
            <button onClick={() => handleChange('sidedness', 'two-sided')} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: state.sidedness === 'two-sided' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)', backgroundColor: state.sidedness === 'two-sided' ? 'var(--color-accent-primary)' : 'transparent', color: state.sidedness === 'two-sided' ? 'white' : 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>Two-Tailed</button>
          </div>
          <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: '#475569', marginTop: 'var(--space-3)' }}>
            {state.sidedness === 'one-sided' 
              ? 'Warning: Regulatory bodies heavily scrutinize one-sided tests unless measuring toxicity or non-inferiority boundaries.' 
              : 'Standard. Protects against missing an effect in the unexpected direction.'}
          </span>
        </div>

        {/* Attrition & Allocation */}
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Logistics Buffers</label>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexDirection: 'column' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}><span>Expected Attrition/Dropout Rate:</span> <strong>{(state.attrition * 100).toFixed(0)}%</strong></div>
              <input type="range" min="0" max="0.50" step="0.05" value={state.attrition} onChange={e => handleChange('attrition', parseFloat(e.target.value))} style={{ width: '100%', marginTop: '4px' }} />
            </div>
            
            {state.designStructure !== 'one_sample' && state.designStructure !== 'paired' && state.designStructure !== 'crossover' && (
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>Allocation Ratio (Groups A:B)</label>
                <select value={state.allocationRatio} onChange={e => handleChange('allocationRatio', parseFloat(e.target.value))} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <option value="1">1:1 (Equal Assignment)</option>
                  <option value="1.5">1.5:1 (3:2 Assignment)</option>
                  <option value="2">2:1 (Double Treatment Assignment)</option>
                  <option value="3">3:1</option>
                  <option value="0.5">1:2 (Double Control Assignment)</option>
                </select>
              </div>
            )}
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Back
         </button>
         <button onClick={nextStep} style={{ padding: 'var(--space-3) var(--space-6)', border: 'none', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
           Define Model Assumptions →
         </button>
      </div>

    </div>
  );
}
