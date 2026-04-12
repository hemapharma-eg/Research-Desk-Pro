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
import { ProjectProvider, useProject } from './context/ProjectContext';
import { LicenseProvider } from './modules/licensing/LicenseContext';
import { AppAccessController } from './modules/licensing/screens/AppAccessController';
import { DemoBanner } from './modules/licensing/components/DemoBanner';
import { StatusWidget } from './modules/licensing/components/StatusWidget';
import logoUrl from './assets/logo.png';

const MODULES = [
  { id: 'dashboard',         label: 'Dashboard',         icon: '◈' },
  { id: 'reference-manager', label: 'References',        icon: '◉' },
  { id: 'document-editor',   label: 'Editor',            icon: '◫' },
  { id: 'graphing-studio',   label: 'Graphing',          icon: '△' },
  { id: 'power-analysis',    label: 'Power Analysis',    icon: '⊕' },
  { id: 'systematic-review', label: 'Systematic Review', icon: '◎' },
  { id: 'table-builder',     label: 'Tables',            icon: '▦' },
  { id: 'integrity-checker', label: 'Integrity',         icon: '◆' },
];

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
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
    return () => {
      window.removeEventListener('send-to-table-builder', handleSendToTableBuilder);
      window.removeEventListener('navigate-to-module', handleNavigateToModule);
    };
  }, [handleSendToTableBuilder, handleNavigateToModule]);

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
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-bg-app)' }}>
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

        {/* Status Widget */}
        <StatusWidget />
      </header>

      {/* ─── Horizontal Module Tab Navigation ─── */}
      <nav className="module-nav print-hidden no-drag-region">
        {MODULES.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`module-tab ${activeModule === id ? 'active' : ''}`}
            onClick={() => setActiveModule(id)}
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
