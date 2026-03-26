import React, { useState } from 'react';
import './SystematicReview.css';
import { SystematicReviewProvider, useSystematicReview } from './context/SystematicReviewContext';
import type { ReviewStage } from './types/ReviewModels';

import { ReviewProjectSetup } from './components/setup/ReviewProjectSetup';
import { ReviewDashboard } from './components/dashboard/ReviewDashboard';
import { ImportWorkspace } from './components/import/ImportWorkspace';
import { RawRecordsExplorer } from './components/records/RawRecordsExplorer';
import { DeduplicationWorkspace } from './components/deduplication/DeduplicationWorkspace';
import { TitleAbstractScreening } from './components/screening/TitleAbstractScreening';
import { FullTextManager } from './components/full-text/FullTextManager';
import { FullTextScreeningWorkspace } from './components/full-text/FullTextScreeningWorkspace';
import { ConflictResolutionCenter } from './components/conflicts/ConflictResolutionCenter';
import { FinalLibrariesWorkspace } from './components/library/FinalLibrariesWorkspace';
import { PrismaReporting } from './components/reporting/PrismaReporting';
import { ExportCenter } from './components/export/ExportCenter';
import { ActivityLogWorkspace } from './components/governance/ActivityLogWorkspace';

// Dummy imports - to be implemented

const NAV_ITEMS: { id: ReviewStage | 'dashboard' | 'libraries' | 'export' | 'settings' | 'raw-records'; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Overview', icon: '📊' },
  { id: 'setup', label: 'Setup', icon: '⚙️' },
  { id: 'import', label: 'Imports', icon: '📥' },
  { id: 'raw-records', label: 'Raw Records', icon: '🗃️' },
  { id: 'deduplication', label: 'Deduplication', icon: '👯' },
  { id: 'title-abstract-screening', label: 'Title/Abstract', icon: '📑' },
  { id: 'full-text-retrieval', label: 'Full Text Manager', icon: '📄' },
  { id: 'full-text-screening', label: 'Full Text Screening', icon: '🔍' },
  { id: 'conflict-resolution', label: 'Conflicts', icon: '⚖️' },
  { id: 'libraries', label: 'Libraries (Inc/Exc)', icon: '📚' },
  { id: 'reporting', label: 'Reports & PRISMA', icon: '📈' },
  { id: 'export', label: 'Export', icon: '📤' },
  { id: 'settings', label: 'Activity Log', icon: '⏱️' },
];

function SystematicReviewContent() {
  const { state, dispatch } = useSystematicReview();
  const [currentNav, setCurrentNav] = useState<string>('dashboard');

  const renderContent = () => {
    switch (currentNav) {
      case 'dashboard': return <ReviewDashboard />;
      case 'setup': return <ReviewProjectSetup />;
      case 'import': return <ImportWorkspace />;
      case 'raw-records': return <RawRecordsExplorer />;
      case 'deduplication': return <DeduplicationWorkspace />;
      case 'title-abstract-screening': return <TitleAbstractScreening />;
      case 'full-text-retrieval': return <FullTextManager />;
      case 'full-text-screening': return <FullTextScreeningWorkspace />;
      case 'conflict-resolution': return <ConflictResolutionCenter />;
      case 'libraries': return <FinalLibrariesWorkspace />;
      case 'reporting': return <PrismaReporting />;
      case 'export': return <ExportCenter />;
      case 'settings': return <ActivityLogWorkspace />;
      default: return <div style={{padding: 20}}>Stage not implemented yet.</div>;
    }
  };

  const getStageTitle = (navId: string) => NAV_ITEMS.find(n => n.id === navId)?.label || 'Systematic Review';

  return (
    <div className="sr-container">
      {/* Sidebar Navigation */}
      <div className="sr-sidebar">
        <div className="sr-sidebar-header">
          <span>🔬 Review.Accelerator</span>
        </div>
        <ul className="sr-nav-list">
          {NAV_ITEMS.map((item) => (
            <li
              key={item.id}
              className={`sr-nav-item ${currentNav === item.id ? 'active' : ''}`}
              onClick={() => setCurrentNav(item.id)}
            >
              <span className="sr-nav-icon">{item.icon}</span>
              <span className="sr-nav-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Area */}
      <div className="sr-main">
        {/* Topbar */}
        <div className="sr-topbar">
          <div className="sr-topbar-left">
            <span className="sr-stage-title">{getStageTitle(currentNav)}</span>
            {state.project?.title && <span style={{color: 'var(--color-text-tertiary)', fontSize: 13}}>— {state.project.shortTitle || state.project.title}</span>}
          </div>
          <div className="sr-topbar-right">
            <span>Records: <strong>{state.records.length}</strong></span>
            {state.activeReviewer && (
              <div className="sr-reviewer-badge">
                <span title="Active Reviewer">👤</span>
                {state.activeReviewer.name} 
                <span style={{fontSize: 10, opacity: 0.7}}>({state.activeReviewer.role})</span>
              </div>
            )}
            <button className="sr-btn" onClick={() => {/* force save logic */}}>
              {state.isSaving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="sr-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export function SystematicReviewStudio() {
  return (
    <SystematicReviewProvider>
      <SystematicReviewContent />
    </SystematicReviewProvider>
  );
}
