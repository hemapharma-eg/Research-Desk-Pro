import React, { useState } from 'react';
import { useLicense } from '../LicenseContext';

export const WelcomeScreen: React.FC<{ onContinueDemo: () => void, onActivate: () => void }> = ({ onContinueDemo, onActivate }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.15), transparent 60%), var(--color-bg-app)',
      padding: 'var(--space-6)'
    }}>
      <div style={{
        maxWidth: 620, width: '100%', padding: 'var(--space-8)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-lg)', margin: '0 auto var(--space-4)',
            background: 'var(--gradient-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-lg)',
            fontSize: '24px', fontWeight: 'bold', color: 'white',
          }}>R</div>
          <h1 style={{
            fontSize: 'var(--font-size-display)', fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)', letterSpacing: '-0.03em',
          }}>
            ReseolabX
          </h1>
          <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
            Next-generation academic research platform.
          </p>
        </div>

        {/* Plans comparison */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div style={{
            flex: 1, padding: 'var(--space-4)',
            backgroundColor: 'var(--color-bg-surface-raised)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)',
          }}>
            <h3 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>Demo</h3>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)' }}>
              <li style={{ marginBottom: '4px' }}>Limited projects & saves</li>
              <li style={{ marginBottom: '4px' }}>Watermarks on exports</li>
              <li>Preview-only resolutions</li>
            </ul>
          </div>
          <div style={{
            flex: 1, padding: 'var(--space-4)',
            background: 'var(--gradient-accent-subtle)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
          }}>
            <h3 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>Full License</h3>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)' }}>
              <li style={{ marginBottom: '4px' }}>Unlimited everything</li>
              <li style={{ marginBottom: '4px' }}>Full-resolution exports</li>
              <li>All premium features</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button onClick={onActivate} className="btn-primary" style={{
            padding: 'var(--space-3)', fontSize: 'var(--font-size-md)',
            display: 'flex', justifyContent: 'center', width: '100%',
          }}>
            Activate License
          </button>
          <button onClick={onContinueDemo} style={{
            padding: 'var(--space-3)', backgroundColor: 'transparent', color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-md)',
            border: '1px solid var(--color-border-strong)', cursor: 'pointer', display: 'flex', justifyContent: 'center',
            transition: 'all var(--transition-fast)',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-primary)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            Continue in Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export const ActivationScreen: React.FC<{ onBack: () => void, onSuccess: () => void }> = ({ onBack, onSuccess }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { deviceId, activateLicense } = useLicense();

  const handleActivate = async () => {
    if (!key.trim()) return;
    if (!deviceId) {
      setError('Device ID not ready. Please close this screen and try again in a moment.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: key.trim(),
          deviceId: deviceId,
          appVersion: '1.0.0',
          platform: window.navigator.platform
        })
      });
      const data = await res.json();
      if (data.success) {
        await activateLicense(data);
        onSuccess();
      } else {
        setError(data.message || 'Verification failed. Status: ' + data.status);
      }
    } catch (err: any) {
      console.error('Activation network error:', err);
      setError('Could not connect to the activation server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.15), transparent 60%), var(--color-bg-app)',
      padding: 'var(--space-6)'
    }}>
      <div style={{
        maxWidth: 500, width: '100%', padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 'bold', color: 'white',
          }}>R</div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>Activate ReseolabX</h2>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
          Enter your license key to unlock the full version.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
            padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>License Key</label>
          <input 
            type="text" 
            placeholder="RDP-XXXX-XXXX-XXXX" 
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={{ 
              width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border-strong)', fontSize: 'var(--font-size-md)',
              fontFamily: 'var(--font-family-mono)',
              background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button 
            onClick={onBack}
            style={{
              padding: 'var(--space-2) var(--space-4)', backgroundColor: 'transparent',
              border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)',
              flexShrink: 0, cursor: 'pointer', color: 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >Back</button>
          <button 
            onClick={handleActivate}
            disabled={loading || !key.trim()}
            className="btn-primary"
            style={{ 
              flex: 1, padding: 'var(--space-2) var(--space-4)',
              display: 'flex', justifyContent: 'center',
              opacity: (loading || !key.trim()) ? 0.5 : 1,
              cursor: (loading || !key.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Verifying...' : 'Activate Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppAccessController: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReady, state, enterDemoMode } = useLicense();
  const [hasYieldedWelcome, setHasYieldedWelcome] = useState(false);
  const [showActivation, setShowActivation] = useState(false);

  // Global listener so any component can pop up the activation window
  React.useEffect(() => {
    const handleTriggerActivation = () => setShowActivation(true);
    window.addEventListener('TRIGGER_ACTIVATION', handleTriggerActivation);
    return () => window.removeEventListener('TRIGGER_ACTIVATION', handleTriggerActivation);
  }, []);

  if (!isReady) {
    return (
      <div style={{
        display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center',
        background: 'var(--color-bg-app)', color: 'var(--color-text-secondary)',
        flexDirection: 'column', gap: 'var(--space-3)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 'bold', color: 'white',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}>R</div>
        <span style={{ fontSize: 'var(--font-size-sm)' }}>Initializing ReseolabX…</span>
      </div>
    );
  }

  if (state.mode === 'licensed_active' || state.mode === 'offline_grace') {
    return <>{children}</>;
  }

  if (showActivation) {
    return <ActivationScreen 
      onBack={() => setShowActivation(false)} 
      onSuccess={() => setShowActivation(false)} 
    />;
  }

  if (!hasYieldedWelcome) {
    return <WelcomeScreen 
      onContinueDemo={() => {
        enterDemoMode();
        setHasYieldedWelcome(true);
      }} 
      onActivate={() => setShowActivation(true)} 
    />;
  }

  return <>{children}</>;
};
