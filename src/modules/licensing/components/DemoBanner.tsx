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
      backgroundColor: 'rgba(41, 98, 255, 0.05)', border: '1px solid var(--color-accent-primary)',
      padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
      marginTop: 'var(--space-4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ 
          backgroundColor: 'var(--color-accent-primary)', color: 'white', 
          fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' 
        }}>Demo Version</span>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Some limits apply. Upgrade for unlimited projects and full-resolution exports.
        </span>
      </div>
      <div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'))}
          style={{ 
            padding: '4px 12px', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-accent-primary)', 
            color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'var(--font-weight-medium)'
          }}
        >
          Activate
        </button>
      </div>
    </div>
  );
};
