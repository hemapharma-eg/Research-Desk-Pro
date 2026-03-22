import React from 'react';
import { usePowerWizard } from '../../context/PowerWizardContext';

export function ScreenBSpecies() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  const handleUpdate = (field: string, value: string) => {
    updateState({ speciesModel: { ...state.speciesModel, [field]: value } });
  };

  const getVal = (field: string) => state.speciesModel?.[field] || '';

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
          Species & Model Characterization (Screen B)
        </h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-md)', lineHeight: 1.6 }}>
          Describe the study population. ARRIVE guidelines require explicit justification for sex-based layouts unless scientifically unfeasible.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Species / Strain</label>
          <input 
            type="text" 
            placeholder="e.g. C57BL/6J Mice, Sprague-Dawley Rats" 
            value={getVal('species')} 
            onChange={e => handleUpdate('species', e.target.value)}
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontSize: 'var(--font-size-md)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Sex Inclusion Strategy</label>
          <select 
            value={getVal('sexStrategy')} 
            onChange={e => handleUpdate('sexStrategy', e.target.value)}
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontSize: 'var(--font-size-md)', backgroundColor: 'var(--color-bg-surface)' }}
          >
            <option value="">Select strategy...</option>
            <option value="both">Both Sexes (Powered safely to pool)</option>
            <option value="both_factorial">Both Sexes (Powered to test sex-treatment interaction)</option>
            <option value="male">Males Only (Requires justification)</option>
            <option value="female">Females Only (Requires justification)</option>
          </select>
        </div>

        {['male', 'female'].includes(getVal('sexStrategy')) && (
          <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
            <strong>ARRIVE Warning:</strong> Single-sex studies may face editorial pushback. Ensure this is biologically justified (e.g. ovarian cancer model) in the final protocol.
          </div>
        )}

      </div>

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
