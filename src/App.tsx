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

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const { currentProject } = useProject();

  const handleSendToTableBuilder = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    (window as any).__pendingTableImport = detail;
    setActiveModule('table-builder');
    // Forward the payload to the Table Builder module after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('table-builder:receive-stat-import', { detail }));
    }, 300);
  }, []);

  // Generic cross-module navigation
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
      case 'dashboard':
        return <Dashboard />;
      case 'reference-manager':
        return <ReferenceManager />;
      case 'document-editor':
        return <DocumentEditor />;
      case 'graphing-studio':
        return <GraphingStudio />;
      case 'power-analysis':
        return <PowerAnalysis />;
      case 'systematic-review':
        return <SystematicReviewStudio />;
      case 'table-builder':
        return <TableBuilder />;
      case 'integrity-checker':
        return <IntegrityCheckerHome />;
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
      {/* Mac-native invisible drag region for the hiddenInset titlebar */}
      <div className="titlebar drarg-region" style={{ height: 'var(--titlebar-height)', width: '100%', flexShrink: 0 }}></div>

      <div className="app-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside className="print-hidden sidebar no-drag-region" style={{ width: 'var(--sidebar-width)', backgroundColor: 'var(--color-bg-sidebar)', borderRight: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', padding: 'var(--space-4)' }}>
          <div className="branding" style={{ marginBottom: 'var(--space-6)', paddingLeft: 'var(--space-2)' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>Research Desk<span style={{ color: 'var(--color-accent-primary)' }}>.</span></h2>
            {currentProject && (
              <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', wordBreak: 'break-all' }}>
                {currentProject.split('/').pop()?.split('\\').pop() || 'Untitled Project'}
              </p>
            )}
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {['Dashboard', 'Reference Manager', 'Document Editor', 'Graphing Studio', 'Power Analysis', 'Systematic Review', 'Table Builder', 'Integrity Checker'].map((item) => {
              const id = item.toLowerCase().replace(' ', '-');
              const isActive = activeModule === id;
              return (
                <button 
                  key={id}
                  onClick={() => setActiveModule(id)}
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'rgba(41, 98, 255, 0.08)' : 'transparent',
                    fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    if (!isActive) e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    if (!isActive) e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  {item}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content no-drag-region" style={{ flex: 1, backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header className="print-hidden" style={{ marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  {activeModule.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </h1>
                <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>Welcome to your workspace.</p>
              </div>
            </div>
          </header>
          
          <div className="module-content" style={{ 
            backgroundColor: 'var(--color-bg-surface)', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-sm)',
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}>
            {renderModuleContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}

export default App
