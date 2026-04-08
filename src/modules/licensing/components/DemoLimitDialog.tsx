import React from 'react';

interface DemoLimitDialogProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void;
}

export const DemoLimitDialog: React.FC<DemoLimitDialogProps> = ({ title, message, isOpen, onClose, onActivate }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }}>
      <div className="animate-fade-in" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)',
        maxWidth: 450, width: '100%',
        boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
        border: '1px solid var(--glass-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-accent-subtle)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>🔒</div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>{title}</h2>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
          {message}
        </p>
        
        <div style={{
          background: 'var(--gradient-accent-subtle)',
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>Full license unlocks:</h4>
          <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)', margin: 0 }}>
            <li style={{ marginBottom: '4px' }}>Unlimited projects and saves</li>
            <li style={{ marginBottom: '4px' }}>Unrestricted exports without watermarks</li>
            <li>All premium features and high-resolution graphing</li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button 
            onClick={onClose}
            style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'transparent', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >Continue in Demo</button>
          <button 
            onClick={() => { onClose(); onActivate(); }}
            className="btn-primary"
            style={{ padding: 'var(--space-2) var(--space-4)' }}
          >Activate License</button>
        </div>
      </div>
    </div>
  );
};
