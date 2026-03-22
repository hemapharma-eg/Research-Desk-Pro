import { useMemo } from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';
import { calculateCohenD, calculateCohensH, calculateCohensF } from '../engine/calculators';

export function Step3Assumptions() {
  const { state, updateState, nextStep, prevStep } = usePowerWizard();

  // Standardized Name
  const esName = useMemo(() => {
    switch(state.testFamily) {
      case 't-test': return "Cohen's d";
      case 'anova': return "Cohen's f";
      case 'proportion': return "Cohen's h / Odds Ratio";
      case 'correlation': return "Pearson's r";
      default: return 'Effect Size';
    }
  }, [state.testFamily]);

  const esGuide = useMemo(() => {
    if (state.testFamily === 't-test') return "0.2 (Small) | 0.5 (Medium) | 0.8 (Large)";
    if (state.testFamily === 'anova') return "0.10 (Small) | 0.25 (Medium) | 0.40 (Large)";
    if (state.testFamily === 'proportion') return "0.2 (Small) | 0.5 (Medium) | 0.8 (Large)";
    if (state.testFamily === 'correlation') return "0.1 (Small) | 0.3 (Medium) | 0.5 (Large)";
    return "";
  }, [state.testFamily]);

  const isComplete = state.effectSize !== null && state.effectSize > 0 && (state.studyType === 'superiority' || (state.margin !== null && state.margin > 0));

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>Step 3: Statistical Assumptions & Effect Size</h2>
        <p style={{ color: '#334155', fontSize: 'var(--font-size-sm)' }}>
          Provide the expected true effect size. If you don't know the exact standardized effect size, use the integrated Assistant Panel on the right to derive it from raw assumptions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(350px, 1fr)', gap: 'var(--space-8)' }}>
        
        {/* Left Column: Direct Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {state.testFamily === 'anova' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 'bold' }}>Number of Groups (k)</label>
              <input 
                type="number" 
                min="3" 
                value={state.numGroups} 
                onChange={(e) => updateState({ numGroups: parseInt(e.target.value) || 3 })}
                style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>Main Assumed Effect Size ({esName})</label>
            <input 
              type="number" 
              step="0.05" 
              value={state.effectSize !== null ? state.effectSize : ''} 
              onChange={(e) => updateState({ effectSize: parseFloat(e.target.value) })}
              placeholder={`e.g., 0.50`}
              style={{ width: '100%', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-accent-primary)', backgroundColor: 'var(--color-bg-app)', fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}
            />
            {esGuide && <span style={{ fontSize: 'var(--font-size-sm)', color: '#475569' }}>Guidelines: {esGuide}</span>}
          </div>

          {(state.studyType === 'equivalence' || state.studyType === 'non-inferiority') && state.margin === null && (
            <div style={{ color: 'red', fontSize: '13px', backgroundColor: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '4px' }}>
              ⚠️ You selected an Equivalence/Non-Inferiority trial but did not set a Margin (δ) in Step 2. Go back to set it, or calculation will fail.
            </div>
          )}
        </div>

        {/* Right Column: Built-in Effect Size Assistant Panel */}
        <div style={{ backgroundColor: 'var(--color-bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-strong)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold' }}>Effect-Size Assistant</h3>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#334155', lineHeight: 1.5 }}>
            Don't know the exact {esName}? Enter your expected raw pilot data below to compute it instantly.
          </p>

          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
            
            {state.testFamily === 't-test' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Mean (Group 1)</label>
                    <input type="number" value={state.mean1 !== null ? state.mean1 : ''} onChange={e => updateState({ mean1: parseFloat(e.target.value) })} style={{ width: '100%', padding: '6px' }} />
                  </div>
                  <div>
                     <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Mean (Group 2)</label>
                    <input type="number" value={state.mean2 !== null ? state.mean2 : ''} onChange={e => updateState({ mean2: parseFloat(e.target.value) })} style={{ width: '100%', padding: '6px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>SD (Group 1)</label>
                    <input type="number" value={state.sd1 !== null ? state.sd1 : ''} onChange={e => updateState({ sd1: parseFloat(e.target.value) })} style={{ width: '100%', padding: '6px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>SD (Group 2)</label>
                    <input type="number" value={state.sd2 !== null ? state.sd2 : ''} onChange={e => updateState({ sd2: parseFloat(e.target.value) })} style={{ width: '100%', padding: '6px' }} />
                  </div>
                </div>
                <button 
                  type="button"
                  disabled={state.mean1 === null || state.mean2 === null || state.sd1 === null || state.sd2 === null}
                  onClick={() => {
                    const d = calculateCohenD(state.mean1 as number, state.mean2 as number, state.sd1 as number, state.sd2 as number);
                    updateState({ effectSize: parseFloat(d.toFixed(3)) });
                  }}
                  style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Compute & Apply {esName}
                </button>
              </div>
            ) : state.testFamily === 'proportion' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Prop 1 (e.g. 0.3)</label>
                    <input type="number" step="0.05" min="0" max="1" value={state.prop1 !== null ? state.prop1 : ''} onChange={e => updateState({ prop1: parseFloat(e.target.value) })} style={{ width: '100%', padding: '6px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Prop 2 (e.g. 0.5)</label>
                    <input type="number" step="0.05" min="0" max="1" value={state.prop2 !== null ? state.prop2 : ''} onChange={e => updateState({ prop2: parseFloat(e.target.value) })} style={{ width: '100%', padding: '6px' }} />
                  </div>
                </div>
                <button 
                  type="button"
                  disabled={state.prop1 === null || state.prop2 === null}
                  onClick={() => {
                    const h = calculateCohensH(state.prop1 as number, state.prop2 as number);
                    updateState({ effectSize: parseFloat(Math.abs(h).toFixed(3)) });
                  }}
                  style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Compute & Apply {esName}
                </button>
              </div>
            ) : state.testFamily === 'anova' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                 <p style={{ fontSize: '12px' }}>Input expected means as comma-separated values, and the pooled SD.</p>
                 <input type="text" placeholder="Means (e.g. 10, 15, 12)" id="anova-means" style={{ padding: '6px', width: '100%' }} />
                 <input type="number" placeholder="Common Standard Deviation" id="anova-sd" style={{ padding: '6px', width: '100%' }} />
                 <button 
                  type="button"
                  onClick={() => {
                    const meansStr = (document.getElementById('anova-means') as HTMLInputElement).value;
                    const sdStr = (document.getElementById('anova-sd') as HTMLInputElement).value;
                    const means = meansStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                    const sd = parseFloat(sdStr);
                    if (means.length > 1 && !isNaN(sd) && sd > 0) {
                      const f = calculateCohensF(means, sd);
                      updateState({ effectSize: parseFloat(f.toFixed(3)) });
                    }
                  }}
                  style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Compute & Apply {esName}
                </button>
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', color: '#475569', fontSize: '13px' }}>
                No wizard available for Correlation yet. Please enter correlation 'r' directly on the left.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Nav */}
      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
        <button 
          onClick={prevStep}
          style={{ padding: 'var(--space-3) var(--space-6)', backgroundColor: 'transparent', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <button 
          onClick={nextStep}
          disabled={!isComplete}
          style={{ 
            padding: 'var(--space-3) var(--space-6)', 
            backgroundColor: isComplete ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)', 
            color: isComplete ? 'white' : 'var(--color-text-tertiary)', 
            borderRadius: 'var(--radius-md)', 
            border: 'none', 
            fontWeight: 'bold',
            cursor: isComplete ? 'pointer' : 'not-allowed'
          }}
        >
          Calculate Results →
        </button>
      </div>

    </div>
  );
}
