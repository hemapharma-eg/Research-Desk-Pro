import { usePowerWizard } from '../context/PowerWizardContext';

export function Step2Parameters() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>Step 2: Test Parameters</h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-sm)' }}>Configure the operating characteristics of your statistical test.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Alpha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label style={{ fontWeight: 'bold' }}>Significance Level (α)</label>
          <select 
            value={state.alpha} 
            onChange={(e) => updateState({ alpha: parseFloat(e.target.value) })}
            style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }}
          >
            <option value="0.10">0.10 (Marginal)</option>
            <option value="0.05">0.05 (Standard)</option>
            <option value="0.01">0.01 (Strict)</option>
            <option value="0.001">0.001 (Very Strict)</option>
          </select>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>Probability of rejecting a true null hypothesis (Type I error).</span>
        </div>

        {/* Power */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label style={{ fontWeight: 'bold' }}>Target Power (1-β)</label>
          <select 
            value={state.power} 
            onChange={(e) => updateState({ power: parseFloat(e.target.value) })}
            style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }}
          >
            <option value="0.80">0.80 (Standard)</option>
            <option value="0.85">0.85</option>
            <option value="0.90">0.90 (High)</option>
            <option value="0.95">0.95 (Very High)</option>
          </select>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>Probability of correctly rejecting a false null hypothesis.</span>
        </div>

        {/* Tails */}
        {(state.testFamily === 't-test' || state.testFamily === 'proportion' || state.testFamily === 'correlation') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', backgroundColor: 'var(--color-bg-hover)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <label style={{ fontWeight: 'bold' }}>Tails (Directionality)</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button disabled={state.studyType !== 'superiority'} onClick={() => updateState({ tails: 1 })} style={{ flex: 1, padding: 'var(--space-2)', border: state.tails === 1 ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)', background: state.tails === 1 ? 'rgba(79, 70, 229, 0.1)' : 'var(--color-bg-app)', borderRadius: 'var(--radius-md)', fontWeight: state.tails === 1 ? 'bold' : 'normal', cursor: state.studyType !== 'superiority' ? 'not-allowed' : 'pointer' }}>One-Tailed</button>
              <button disabled={state.studyType !== 'superiority'} onClick={() => updateState({ tails: 2 })} style={{ flex: 1, padding: 'var(--space-2)', border: state.tails === 2 ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-strong)', background: state.tails === 2 ? 'rgba(79, 70, 229, 0.1)' : 'var(--color-bg-app)', borderRadius: 'var(--radius-md)', fontWeight: state.tails === 2 ? 'bold' : 'normal', cursor: state.studyType !== 'superiority' ? 'not-allowed' : 'pointer' }}>Two-Tailed</button>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>
              {state.studyType !== 'superiority' ? 'Equivalence/NI automatically dictate tail math (TOST).' : 'Directional (1) vs non-directional (2) hypothesis.'}
            </span>
          </div>
        )}

        {/* Equivalence / NI Margin */}
        {(state.studyType === 'equivalence' || state.studyType === 'non-inferiority') && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234, 179, 8, 0.5)' }}>
             <label style={{ fontWeight: 'bold', color: '#854d0e' }}>Non-Inferiority / Equivalence Margin (δ)</label>
             <input 
               type="number" 
               step="0.05" 
               min="0" 
               value={state.margin !== null ? state.margin : ''} 
               onChange={(e) => updateState({ margin: parseFloat(e.target.value) })}
               placeholder="e.g., 0.20"
               style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }}
             />
             <span style={{ fontSize: 'var(--font-size-xs)', color: '#854d0e' }}>
               The maximum clinically acceptable difference (standardized units) to declare non-inferiority or equivalence.
             </span>
           </div>
        )}

        {/* Allocation Ratio */}
        {(state.testDesign === 'two-sample-independent' || state.testFamily === 'anova') && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
             <label style={{ fontWeight: 'bold' }}>Allocation Ratio {state.testFamily === 'anova' ? '(Assumption)' : '(Group 2 / Group 1)'}</label>
             <input 
               type="number" 
               step="0.5" 
               min="0.1" 
               value={state.allocationRatio} 
               onChange={(e) => updateState({ allocationRatio: parseFloat(e.target.value) || 1 })}
               disabled={state.testFamily === 'anova'}
               style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }}
             />
             <span style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>
               {state.testFamily === 'anova' ? 'ANOVA assumes equal group sizes (ratio=1) in this calculator.' : '1 = equal sizes. 2 = Group 2 is twice as large as Group 1.'}
             </span>
           </div>
        )}

        {/* Attrition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
           <label style={{ fontWeight: 'bold' }}>Expected Attrition / Dropout Rate (%)</label>
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
             <input 
               type="range" 
               min="0" 
               max="50" 
               step="1" 
               value={state.attritionRate * 100} 
               onChange={(e) => updateState({ attritionRate: parseInt(e.target.value) / 100 })}
               style={{ flex: 1 }}
             />
             <span style={{ fontWeight: 'bold', width: '40px' }}>{Math.round(state.attritionRate * 100)}%</span>
           </div>
           <span style={{ fontSize: 'var(--font-size-xs)', color: '#475569' }}>We will inflate the required sample size dynamically to account for dropouts.</span>
        </div>

      </div>

      {/* Footer Nav */}
      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={prevStep}
          style={{ padding: 'var(--space-3) var(--space-6)', backgroundColor: 'transparent', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <button 
          onClick={nextStep}
          style={{ padding: 'var(--space-3) var(--space-6)', backgroundColor: 'var(--color-accent-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Next: Assumptions →
        </button>
      </div>

    </div>
  );
}
