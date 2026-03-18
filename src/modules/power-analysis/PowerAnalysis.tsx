import { useState, useMemo } from 'react';

// Common Z-score approximations for critical values
const Z_VALUES: Record<string, number> = {
  // Alpha (two-tailed)
  '0.01': 2.576,
  '0.05': 1.960,
  '0.10': 1.645,
  // Power (80%, 90%, 95%)
  '0.80': 0.841,
  '0.90': 1.282,
  '0.95': 1.645,
};

export function PowerAnalysis() {
  const [alpha, setAlpha] = useState<string>('0.05');
  const [power, setPower] = useState<string>('0.80');
  const [effectSize, setEffectSize] = useState<string>('0.5');

  // Calculate required sample size per group based on standard formula:
  // n = 2 * ((Z_alpha/2 + Z_beta) / d)^2
  const requiredN = useMemo(() => {
    const d = parseFloat(effectSize);
    if (isNaN(d) || d <= 0) return 0;

    const zAlpha = Z_VALUES[alpha] || 1.96;
    const zPower = Z_VALUES[power] || 0.841;

    // Standard formula for two-independent-sample t-test
    const n = 2 * Math.pow((zAlpha + zPower) / d, 2);
    
    return Math.ceil(n); // Always round up to ensure sufficient power
  }, [alpha, power, effectSize]);

  // Total N for both groups
  const totalN = requiredN * 2;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* Sidebar Form Pane */}
      <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flexShrink: 0 }}>
        
        <div style={{ backgroundColor: 'var(--color-bg-sidebar)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>T-Test Parameters</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
            Calculate the required sample size for a two-independent-sample comparison.
          </p>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {/* Alpha Level */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="alpha" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
                Significance Level (α)
              </label>
              <select 
                id="alpha" 
                value={alpha} 
                onChange={(e) => setAlpha(e.target.value)}
                style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)' }}
              >
                <option value="0.10">0.10 (Marginal)</option>
                <option value="0.05">0.05 (Standard)</option>
                <option value="0.01">0.01 (Strict)</option>
              </select>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Probability of a Type I error (false positive).</p>
            </div>

            {/* Statistical Power */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="power" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
                Statistical Power (1-β)
              </label>
              <select 
                id="power" 
                value={power} 
                onChange={(e) => setPower(e.target.value)}
                style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)' }}
              >
                <option value="0.80">0.80 (Standard)</option>
                <option value="0.90">0.90 (High)</option>
                <option value="0.95">0.95 (Very High)</option>
              </select>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Probability of detecting a true effect.</p>
            </div>

            {/* Effect Size */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="effectSize" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
                Effect Size (Cohen's d)
              </label>
              <input 
                id="effectSize" 
                type="number" 
                step="0.1" 
                min="0.1" 
                value={effectSize} 
                onChange={(e) => setEffectSize(e.target.value)}
                style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)' }}
              />
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                Rule of thumb: 0.2 (Small), 0.5 (Medium), 0.8 (Large).
              </p>
            </div>
            
          </form>
        </div>

      </div>

      {/* Main Results Pane */}
      <div style={{ flex: 1, backgroundColor: 'var(--color-bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', padding: 'var(--space-8)', justifyContent: 'center', alignItems: 'center' }}>
        
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-accent-primary)', marginBottom: 'var(--space-2)', lineHeight: 1 }}>
            {requiredN === 0 ? '--' : requiredN}
          </h1>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)' }}>
            Participants <span style={{ color: 'var(--color-text-secondary)' }}>per group</span>
          </h3>

          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-hover)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Total Sample Size required:</span>
              <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
                {requiredN === 0 ? '--' : totalN}
              </span>
            </div>
            
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              This calculation assumes equal sample sizes in both groups (allocation ratio = 1) for a two-independent-sample t-test.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
