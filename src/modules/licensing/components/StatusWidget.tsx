import React from 'react';
import { useLicense } from '../LicenseContext';

export const StatusWidget: React.FC = () => {
  const { state } = useLicense();

  const isFull = state.mode === 'licensed_active' || state.mode === 'offline_grace';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      {isFull ? (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-success)', textTransform: 'uppercase' }}>Licensed</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{state.customer_name || state.organization || 'Full Version'}</div>
        </div>
      ) : (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-warning)', textTransform: 'uppercase' }}>Demo Mode</div>
        </div>
      )}
      
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'))}
        style={{ 
          padding: '4px 8px', fontSize: 'var(--font-size-xs)', backgroundColor: 'transparent',
          border: '1px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          color: 'var(--color-text-secondary)'
        }}
      >
        Manage
      </button>
    </div>
  );
};
