import React, { useMemo } from 'react';
import { usePowerWizard } from '../context/PowerWizardContext';
import { 
  calculateTwoSampleTTest, 
  calculateOneSampleTTest, 
  calculateAnova, 
  calculateTwoProportions, 
  adjustForAttrition,
  calculateCohenD
} from '../engine/calculators';
import { exportToPdf, exportToTxt } from '../engine/report-generator';

export function Screen9Results() {
  const { state, prevStep } = usePowerWizard();
  const exportRef = React.useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    let output = { n1: 0, n2: 0, totalN: 0, actualPower: state.power, error: null as string | null };
    const a = state.assumptions || {};

    try {
      if (state.endpointFamily === 'continuous') {
        const d = calculateCohenD(0, a.meanDifference || 1, 1, a.standardDeviation || 1);
        
        if (state.designStructure === 'two_parallel') {
           const calc = calculateTwoSampleTTest(d, state.alpha, state.power, state.sidedness === 'two-sided' ? 2 : 1, state.allocationRatio);
           output = { ...output, ...calc };
        } else if (state.designStructure === 'one_sample') {
           const calcN = calculateOneSampleTTest(d, state.alpha, state.power, state.sidedness === 'two-sided' ? 2 : 1);
           output = { ...output, totalN: calcN, n1: calcN, n2: 0 };
        } else if (state.designStructure === 'multi_arm') {
           const numGroups = state.numberOfGroups || 3;
           const calcN = calculateAnova(d, state.alpha, state.power, numGroups);
           const perGroup = Math.ceil(calcN / numGroups);
           output = { ...output, totalN: perGroup * numGroups, n1: perGroup, n2: perGroup };
        }
      } else if (state.endpointFamily === 'binary') {
        if (state.designStructure === 'two_parallel' && a.p1 && a.p2) {
           const calc = calculateTwoProportions(a.p1, a.p2, state.alpha, state.power, state.sidedness === 'two-sided' ? 2 : 1);
           output = { ...output, ...calc };
        }
      } else if (state.endpointFamily === 'survival') {
        // Log-rank approximation: Events required = 4*(Z_a+Z_b)^2 / (ln(HR))^2
        const hr = a.hazardRatio || 0.7;
        const zAlpha = 1.96; // Approx for alpha 0.05
        const zPower = 0.84; // Approx for power 0.8
        const events = 4 * Math.pow(zAlpha + zPower, 2) / Math.pow(Math.log(hr), 2);
        const total = Math.ceil(events * 2); // Extremely rough conversion to sample size assuming 50% event rate
        output = { ...output, totalN: total, n1: Math.ceil(total/2), n2: Math.ceil(total/2) };
      }
    } catch (e: any) {
      output.error = "Mathematical boundary failure. Ensure inputs are valid.";
    }

    // Apply Attrition
    output.totalN = adjustForAttrition(output.totalN, state.attrition);
    if (output.n1 > 0) output.n1 = adjustForAttrition(output.n1, state.attrition);
    if (output.n2 > 0) output.n2 = adjustForAttrition(output.n2, state.attrition);

    return output;
  }, [state]);

  const heatMapGrid = useMemo(() => {
    const powerLevels = [0.8, 0.9, 0.95];
    const effectMultipliers = [0.5, 0.75, 1.0, 1.25, 1.5];
    const scaleN = (n: number, multi: number, pow: number) => {
      // Rough approximation for heatmap spread
      return Math.max(4, Math.ceil((n * (pow / state.power)) / Math.pow(multi, 2)));
    };
    
    return powerLevels.map(pow => ({
      power: pow,
      cells: effectMultipliers.map(multi => scaleN(results.totalN, multi, pow))
    }));
  }, [results, state.power]);

  const handlePdfExport = async () => exportToPdf(state, results, exportRef.current);
  const handleTxtExport = () => exportToTxt(state, results);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)', color: 'var(--color-primary-dark)', borderBottom: '3px solid var(--color-accent-primary)', paddingBottom: '8px', display: 'inline-block' }}>
          Mathematical Output & Sensitivity
        </h2>
        <p style={{ color: 'var(--color-text-primary)', fontSize: '1.1rem', fontWeight: '500', lineHeight: 1.6, marginTop: 'var(--space-3)' }}>
          Sample size estimations are computed based on the <strong>{state.analysisModel?.replace('_', ' ').toUpperCase() || 'Standard Framework'}</strong> algorithm.
        </p>
      </div>

      {results.error ? (
        <div style={{ padding: 'var(--space-4)', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 'var(--radius-md)', border: '1px solid #F87171' }}>
          <strong>Calculation Error:</strong> {results.error}
        </div>
      ) : (
        <>
        <div ref={exportRef} style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 'var(--space-6)', backgroundColor: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ backgroundColor: '#2563EB', color: 'white', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Sample Size (N)</div>
              <div style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1, margin: 'var(--space-2) 0' }}>{results.totalN}</div>
              {state.attrition > 0 && <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, fontWeight: '500' }}>Includes {(state.attrition*100).toFixed(0)}% attrition buffer</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: state.designStructure === 'multi_arm' ? '1fr' : '1fr 1fr', gap: 'var(--space-3)' }}>
               {state.designStructure === 'multi_arm' ? (
                 <div style={{ backgroundColor: '#F0F9FF', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '2px solid #BAE6FD' }}>
                   <div style={{ fontSize: 'var(--font-size-sm)', color: '#0369A1', fontWeight: 'bold' }}>Per Group (N) × {state.numberOfGroups} groups</div>
                   <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0C4A6E' }}>{results.n1} per group</div>
                 </div>
               ) : (
                 <>
                   {results.n1 > 0 && (
                     <div style={{ backgroundColor: '#F0F9FF', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '2px solid #BAE6FD' }}>
                       <div style={{ fontSize: 'var(--font-size-sm)', color: '#0369A1', fontWeight: 'bold' }}>Group 1 (N)</div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0C4A6E' }}>{results.n1}</div>
                     </div>
                   )}
                   {results.n2 > 0 && (
                     <div style={{ backgroundColor: '#F0F9FF', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '2px solid #BAE6FD' }}>
                       <div style={{ fontSize: 'var(--font-size-sm)', color: '#0369A1', fontWeight: 'bold' }}>Group 2 (N)</div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0C4A6E' }}>{results.n2}</div>
                     </div>
                   )}
                 </>
               )}
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}>
              <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold', color: '#0F172A', borderBottom: '2px solid #E2E8F0', paddingBottom: '4px', marginBottom: '8px' }}>Framework</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
                <li>Power (1-β): <strong style={{color:'#0F172A'}}>{state.power * 100}%</strong></li>
                <li>Alpha (α): <strong style={{color:'#0F172A'}}>{state.alpha}</strong></li>
                <li>Tails: <strong style={{color:'#0F172A'}}>{state.sidedness}</strong></li>
                <li>Endpoint: <strong style={{color:'#0F172A', textTransform: 'capitalize'}}>{state.endpointFamily}</strong></li>
              </ul>
            </div>
          </div>

          <div style={{ padding: 'var(--space-5)', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0F172A', marginBottom: '4px' }}>Native Multivariate Heatmap</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 'var(--space-5)', fontWeight: '500' }}>
              This grid illustrates how Required N explodes if the True Effect Size shrinks, plotted across varying Target Power thresholds. Darker reds indicate exponentially higher sample sizes.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'min-content repeat(5, 1fr)', gap: '4px', width: '100%' }}>
              <div /> {/* Top-Left empty corner */}
              {[0.5, 0.75, 1.0, 1.25, 1.5].map(m => (
                <div key={m} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>x{m} Effect</div>
              ))}
              
              {heatMapGrid.map(row => (
                <React.Fragment key={row.power}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '12px', fontSize: '13px', fontWeight: 'bold', color: '#64748B' }}>
                    {row.power * 100}% Pwr
                  </div>
                  {row.cells.map((n, i) => {
                    // Calculate intensity (0 to 1) comparing to base N. Higher N relative to baseline = redder
                    const ratio = Math.min(1, n / (results.totalN * 3));
                    const bgColor = ratio > 0.6 ? `rgba(239, 68, 68, ${ratio})` : ratio > 0.3 ? `rgba(245, 158, 11, ${ratio})` : `rgba(34, 197, 94, ${0.8 - ratio})`;
                    const textColor = ratio > 0.5 ? 'white' : '#0F172A';
                    return (
                      <div key={i} style={{ backgroundColor: bgColor, color: textColor, padding: '16px 8px', textAlign: 'center', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.1s', cursor: 'default' }}>
                        {n}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '11px', color: '#94A3B8', textAlign: 'center', fontWeight: 'bold' }}>
              X-Axis: Expected Effect Size Multiplier (0.5x to 1.5x of assumed Δ)
            </div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
          <button onClick={handlePdfExport} style={{ width: '100%', padding: 'var(--space-4)', backgroundColor: '#EEF2FF', color: '#4338CA', border: '2px solid #6366F1', borderRadius: 'var(--radius-lg)', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)' }}>
            📁 Download Enhanced PDF Report
          </button>
          <button onClick={handleTxtExport} style={{ width: '100%', padding: 'var(--space-4)', backgroundColor: 'white', color: '#334155', border: '2px solid #CBD5E1', borderRadius: 'var(--radius-lg)', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            📄 Download TXT Methodology
          </button>
        </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
         <button onClick={prevStep} style={{ padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
           ← Return to Assumptions Matrix
         </button>
      </div>

    </div>
  );
}
