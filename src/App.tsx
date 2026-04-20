import { useState, useEffect, useCallback } from 'react';
import './styles/design-system.css';
import { Dashboard } from './modules/dashboard/Dashboard';
import { ReferenceManager } from './modules/reference-manager/ReferenceManager';
import { DocumentEditor } from './modules/document-editor/DocumentEditor';
import { GraphingStudio } from './modules/graphing-studio/GraphingStudio';
import { PowerAnalysis } from './modules/power-analysis/PowerAnalysis';
import { SystematicReviewStudio } from './modules/systematic-review/SystematicReviewStudio';
import { TableBuilder } from './modules/table-builder/TableBuilder';
import { IntegrityCheckerHome } from './modules/integrity-checker/IntegrityCheckerHome';
import { HelpGuide } from './components/HelpGuide';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { LicenseProvider } from './modules/licensing/LicenseContext';
import { AppAccessController } from './modules/licensing/screens/AppAccessController';
import { DemoBanner } from './modules/licensing/components/DemoBanner';
import { StatusWidget } from './modules/licensing/components/StatusWidget';
import logoUrl from './assets/logo.png';

const MODULES = [
  { id: 'dashboard',         label: 'Dashboard',         icon: '🏠', color: '#6366f1', rgb: '99, 102, 241' },
  { id: 'reference-manager', label: 'References',        icon: '📚', color: '#10b981', rgb: '16, 185, 129' },
  { id: 'document-editor',   label: 'Editor',            icon: '📝', color: '#0ea5e9', rgb: '14, 165, 233' },
  { id: 'graphing-studio',   label: 'Graphing',          icon: '📈', color: '#8b5cf6', rgb: '139, 92, 246' },
  { id: 'power-analysis',    label: 'Power Analysis',    icon: '⚡', color: '#f59e0b', rgb: '245, 158, 11' },
  { id: 'systematic-review', label: 'Systematic Review', icon: '🔍', color: '#ec4899', rgb: '236, 72, 153' },
  { id: 'table-builder',     label: 'Tables',            icon: '▦', color: '#14b8a6', rgb: '20, 184, 166' },
  { id: 'integrity-checker', label: 'Integrity',         icon: '🛡️', color: '#ef4444', rgb: '239, 68, 68' },
];

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const { currentProject } = useProject();

  const handleSendToTableBuilder = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    (window as any).__pendingTableImport = detail;
    setActiveModule('table-builder');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('table-builder:receive-stat-import', { detail }));
    }, 300);
  }, []);

  const handleNavigateToModule = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.module) {
      setActiveModule(detail.module);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('send-to-table-builder', handleSendToTableBuilder);
    window.addEventListener('navigate-to-module', handleNavigateToModule);
    
    // Cmd/Ctrl + / to open help
    const handleHelpShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleHelpShortcut);
    
    return () => {
      window.removeEventListener('send-to-table-builder', handleSendToTableBuilder);
      window.removeEventListener('navigate-to-module', handleNavigateToModule);
      document.removeEventListener('keydown', handleHelpShortcut);
    };
  }, [handleSendToTableBuilder, handleNavigateToModule]);

  const activeModuleData = MODULES.find(m => m.id === activeModule) || MODULES[0];

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'dashboard':         return <Dashboard />;
      case 'reference-manager': return <ReferenceManager />;
      case 'document-editor':   return <DocumentEditor />;
      case 'graphing-studio':   return <GraphingStudio />;
      case 'power-analysis':    return <PowerAnalysis />;
      case 'systematic-review': return <SystematicReviewStudio />;
      case 'table-builder':     return <TableBuilder />;
      case 'integrity-checker': return <IntegrityCheckerHome />;
      default:
        return (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-lg)' }}>
            Module content for <b>{activeModule}</b> will load here.
          </p>
        );
    }
  };

  return (
    <div 
      className="app-container" 
      style={{ 
        display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-bg-app)',
        '--color-accent-primary': activeModuleData.color,
        '--gradient-accent': `linear-gradient(135deg, ${activeModuleData.color}, var(--color-accent-secondary))`,
        '--color-accent-glow': `rgba(${activeModuleData.rgb}, 0.18)`,
        '--color-bg-active': `rgba(${activeModuleData.rgb}, 0.10)`,
        '--color-bg-hover': `rgba(${activeModuleData.rgb}, 0.06)`,
      } as React.CSSProperties}
    >
      {/* Mac-native invisible drag region */}
      <div className="titlebar drarg-region" style={{ height: 'var(--titlebar-height)', width: '100%', flexShrink: 0 }}></div>

      {/* ─── Top Header Bar ─── */}
      <header className="print-hidden no-drag-region" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        height: '48px', flexShrink: 0,
        borderBottom: '1px solid var(--color-border-light)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
      }}>
        {/* Logo / Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <img src={logoUrl} alt="ReseolabX Logo" style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-glow)', objectFit: 'contain'
          }} />
          <div>
            <span style={{
              fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
            }}>
              ReseolabX
            </span>
            {currentProject && (
              <span style={{ 
                marginLeft: 'var(--space-3)', fontSize: 'var(--font-size-xs)', 
                color: 'var(--color-text-tertiary)',
                padding: '2px 8px',
                background: 'var(--color-bg-hover)',
                borderRadius: 'var(--radius-full)',
              }}>
                {currentProject.split('/').pop()?.split('\\').pop() || 'Untitled Project'}
              </span>
            )}
          </div>
        </div>

        {/* Status Widget + Help */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setShowHelp(true)}
            title={`Help (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+/)`}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 12px', fontSize: 'var(--font-size-sm)',
              background: 'var(--color-bg-hover)', border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)',
              transition: 'all 0.15s ease',
            }}
          >
            ❓ Help
          </button>
          <StatusWidget />
        </div>
      </header>

      {/* ─── Horizontal Module Tab Navigation ─── */}
      <nav className="module-nav print-hidden no-drag-region">
        {MODULES.map(({ id, label, icon, color, rgb }) => (
          <button
            key={id}
            className={`module-tab ${activeModule === id ? 'active' : ''}`}
            onClick={() => setActiveModule(id)}
            style={activeModule === id ? undefined : {
              '--color-hover-accent': color,
              '--color-hover-bg': `rgba(${rgb}, 0.06)`,
            } as React.CSSProperties}
          >
            <span className="tab-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* ─── Demo Banner (if applicable) ─── */}
      <div className="print-hidden" style={{ padding: '0 var(--space-5)', flexShrink: 0 }}>
        <DemoBanner />
      </div>

      {/* ─── Main Content Area ─── */}
      <main className="main-content no-drag-region animate-fade-in" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--gradient-surface)',
      }}>
        <div className="module-content" style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          margin: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-light)',
          background: 'var(--color-bg-surface)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {renderModuleContent()}
        </div>
      </main>

      {/* Help Guide Modal */}
      <HelpGuide isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

function App() {
  return (
    <LicenseProvider>
      <ProjectProvider>
        <AppAccessController>
          <AppContent />
        </AppAccessController>
      </ProjectProvider>
    </LicenseProvider>
  );
}

export default App
