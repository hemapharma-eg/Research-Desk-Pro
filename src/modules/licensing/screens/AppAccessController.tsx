import React, { useState } from 'react';
import { useLicense } from '../LicenseContext';

export const WelcomeScreen: React.FC<{ onContinueDemo: () => void, onActivate: () => void }> = ({ onContinueDemo, onActivate }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'var(--color-bg-app)', padding: 'var(--space-6)'
    }}>
      <div style={{
        maxWidth: 600, width: '100%', backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-8)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border-light)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
            Research Desk<span style={{ color: 'var(--color-accent-primary)' }}>.</span> Pro
          </h1>
          <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
            The premium academic and research productivity platform.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div style={{ flex: 1, padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>Demo Version</h3>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)' }}>
              <li>Limited projects and saves</li>
              <li>Watermarks on exports</li>
              <li>Preview-only graph resolutions</li>
            </ul>
          </div>
          <div style={{ flex: 1, padding: 'var(--space-4)', backgroundColor: 'rgba(41, 98, 255, 0.05)', border: '1px solid var(--color-accent-primary)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>Full Version</h3>
            <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)' }}>
              <li>Unlimited projects</li>
              <li>High-resolution exports</li>
              <li>All premium features unlocked</li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button onClick={onActivate} style={{
            padding: 'var(--space-3)', backgroundColor: 'var(--color-accent-primary)', color: 'white',
            borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-md)',
            border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center'
          }}>
            Activate License
          </button>
          <button onClick={onContinueDemo} style={{
            padding: 'var(--space-3)', backgroundColor: 'transparent', color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-md)',
            border: '1px solid var(--color-border-dark)', cursor: 'pointer', display: 'flex', justifyContent: 'center'
          }}>
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: key.trim(),
          deviceId: deviceId, // We got this from the App's local DB via IPC Context
          appVersion: '1.0.0',
          platform: window.navigator.platform
        })
      });
      const data = await res.json();
      if (data.success) {
        await activateLicense(data);
        onSuccess();
      } else {
        setError(data.message || 'Verification failed. ' + data.status);
      }
    } catch (err) {
      setError('Could not connect to the activation server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'var(--color-bg-app)', padding: 'var(--space-6)'
    }}>
      <div style={{
        maxWidth: 500, width: '100%', backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border-light)'
      }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>License & Activation</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
          Enter your license key to unlock the full version.
        </p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>License Key</label>
          <input 
            type="text" 
            placeholder="RDP-XXXX-XXXX-XXXX" 
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={{ 
              width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border-dark)', fontSize: 'var(--font-size-md)',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button 
            onClick={onBack}
            style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'transparent', border: '1px solid var(--color-border-dark)', borderRadius: 'var(--radius-md)', flexShrink: 0, cursor: 'pointer' }}
          >Back</button>
          <button 
            onClick={handleActivate}
            disabled={loading || !key.trim()}
            style={{ 
              flex: 1, padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-accent-primary)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer',
              opacity: (loading || !key.trim()) ? 0.6 : 1
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
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading application engine...</div>;
  }

  // If licensed (or in grace), go right through
  if (state.mode === 'licensed_active' || state.mode === 'offline_grace') {
    return <>{children}</>;
  }

  // If user explicitly asks to see Activation screen
  if (showActivation) {
    return <ActivationScreen 
      onBack={() => setShowActivation(false)} 
      onSuccess={() => setShowActivation(false)} 
    />;
  }

  // If in demo mode and hasn't explicitly clicked continue
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
