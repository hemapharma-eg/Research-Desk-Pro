import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useLicense } from '../licensing/LicenseContext';
import { DemoLimitDialog } from '../licensing/components/DemoLimitDialog';
import logoUrl from '../../assets/logo.png';

export function Dashboard() {
  const { currentProject, setCurrentProject, error, setError } = useProject();
  const { entitlements, trackUsage } = useLicense();
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const handleCreateOrOpenProject = async () => {
    if (!entitlements.canCreateProject) {
      setShowLimitDialog(true);
      return;
    }

    try {
      setError(null);
      // 1. Open native folder selection dialog
      const folderPath = await window.api.openDirectoryDialog();
      
      if (!folderPath) {
        return; // User canceled
      }

      // 2. Initialize the SQLite DB in that folder
      const result = await window.api.createOrOpenProject(folderPath);
      
      if (result.success) {
        setCurrentProject(result.path!);
        trackUsage('projects_created');
      } else {
        setError(result.error || 'Unknown initialization error');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleCloseProject = async () => {
    try {
      await window.api.closeProject();
      setCurrentProject(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 40%, #e8ecf4 100%)',
    }}>
      {/* ── Watermark Logo ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <img
          src={logoUrl}
          alt=""
          style={{
            width: '55%',
            maxWidth: '520px',
            opacity: 0.045,
            filter: 'grayscale(30%) brightness(1.1)',
            userSelect: 'none',
            WebkitUserDrag: 'none' as any,
          }}
        />
      </div>

      {/* ── Subtle decorative gradient circles ── */}
      <div style={{ position: 'absolute', top: '-12%', right: '-8%', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-6%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,116,144,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px', padding: '0 var(--space-4)', textAlign: 'center' }}>
        {error && (
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {!currentProject ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
          }}>
            <h2 style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#1d2939',
              letterSpacing: '-0.02em',
              marginBottom: '0',
            }}>
              Welcome to Reseonix
            </h2>
            <p style={{
              color: '#667085',
              fontSize: '14px',
              lineHeight: 1.6,
              maxWidth: '360px',
            }}>
              Create a new project or open an existing one to get started with your research.
            </p>
            <button 
              onClick={handleCreateOrOpenProject}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                letterSpacing: '0.01em',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
            >
              Create or Open Project
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            padding: '28px 32px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '18px', fontWeight: 700,
            }}>📁</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1d2939' }}>Active Project</h3>
            <p style={{
              color: '#475467',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '12px',
              background: '#f1f5f9',
              padding: '8px 14px',
              borderRadius: '6px',
              wordBreak: 'break-all',
              maxWidth: '100%',
            }}>{currentProject}</p>
            
            <button 
              onClick={handleCloseProject}
              style={{
                padding: '8px 24px',
                backgroundColor: 'transparent',
                color: '#475467',
                border: '1px solid #d0d5dd',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#98a2b3'; e.currentTarget.style.color = '#1d2939'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#d0d5dd'; e.currentTarget.style.color = '#475467'; }}
            >
              Close Project
            </button>
          </div>
        )}
      </div>

      <DemoLimitDialog
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        title="Project Limit Reached"
        message="You have reached the maximum number of projects allowed in the Demo Version."
        onActivate={() => window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'))}
      />
    </div>
  );
}
