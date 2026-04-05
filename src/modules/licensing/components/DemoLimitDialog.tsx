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
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)',
        maxWidth: 450, width: '100%', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>{title}</h2>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.5 }}>
          {message}
        </p>
        
        <div style={{ backgroundColor: 'rgba(41, 98, 255, 0.05)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>Full version unlocks:</h4>
          <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)', margin: 0 }}>
            <li>Unlimited projects and saves</li>
            <li>Unrestricted exports without watermarks</li>
            <li>All premium features and high-resolution graphing</li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button 
            onClick={onClose}
            style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'transparent', border: '1px solid var(--color-border-dark)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          >Continue in Demo</button>
          <button 
            onClick={() => { onClose(); onActivate(); }}
            style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer' }}
          >Activate License</button>
        </div>
      </div>
    </div>
  );
};
