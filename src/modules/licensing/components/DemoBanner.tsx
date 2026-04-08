import React, { useState, useEffect } from 'react';
import { useLicense } from '../LicenseContext';

export const DemoBanner: React.FC = () => {
  const { entitlements } = useLicense();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(entitlements.showDemoBanner);
  }, [entitlements.showDemoBanner]);

  if (!isVisible) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--gradient-accent-subtle)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
      marginTop: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ 
          background: 'var(--gradient-accent)', color: 'white', 
          fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 8px',
          borderRadius: 'var(--radius-full)', textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>Demo</span>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Some limits apply. Upgrade for unlimited projects and full-resolution exports.
        </span>
      </div>
      <div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'))}
          className="btn-primary"
          style={{ 
            padding: '4px 14px', fontSize: 'var(--font-size-sm)',
          }}
        >
          Activate
        </button>
      </div>
    </div>
  );
};
