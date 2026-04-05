import { useState } from 'react';
import type { ScanSessionResult, IntegrityFinding } from '../types/IntegrityTypes';
import { FindingsTable } from './FindingsTable';
import { IssueDetailViewer } from './IssueDetailViewer';
import { DocumentEvidenceViewer } from './DocumentEvidenceViewer';

export function ResultsDashboard({ session, onUpdateSession }: { session: ScanSessionResult; onUpdateSession?: (session: ScanSessionResult) => void }) {
  const [selectedFinding, setSelectedFinding] = useState<IntegrityFinding | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Derive counts
  const findingsList = session.findings || [];
  const categoryCounts = findingsList.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredFindings = selectedCategory 
    ? findingsList.filter(f => f.category === selectedCategory)
    : findingsList;

  const handleUpdateFinding = async (updated: IntegrityFinding) => {
    try {
      if (updated.id) {
        await window.api.updateIcFindingStatus(updated.id, updated.status, updated.reviewer_note);
      }
      const newFindings = findingsList.map(f => f.id === updated.id ? updated : f);
      if (onUpdateSession) onUpdateSession({ ...session, findings: newFindings });
      setSelectedFinding(updated);
    } catch (err) {
      console.error('Failed to update finding status', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'var(--color-bg-surface)' }}>
      {/* Metrics Banner */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)' }}>
        <MetricCard label="Overall Score" value={`${session.stats.overallScore}/100`} color="var(--color-success)" />
        <MetricCard label="Total Findings" value={session.stats.totalFindings} />
        <MetricCard label="Errors" value={session.stats.errorsCount} color="var(--color-danger)" />
        <MetricCard label="Warnings" value={session.stats.warningsCount} color="var(--color-warning)" />
        <MetricCard label="Notices" value={session.stats.noticesCount} color="var(--color-info)" />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Leftmost Sidebar: Category Filter */}
        <div style={{ width: '220px', borderRight: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', overflowY: 'auto' }}>
          <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>Categories</h3>
          
          <CategoryItem 
            label="All Issues" 
            count={session.findings.length} 
            isActive={selectedCategory === null} 
            onClick={() => setSelectedCategory(null)} 
          />
          
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <CategoryItem 
              key={cat}
              label={cat.replace(/_/g, ' ')} 
              count={count} 
              isActive={selectedCategory === cat} 
              onClick={() => setSelectedCategory(cat)} 
            />
          ))}
        </div>

        {/* Panel 2: Findings List */}
        <div style={{ width: '350px', borderRight: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Detected Issues</h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{filteredFindings.length} items</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FindingsTable 
              findings={filteredFindings} 
              onSelect={setSelectedFinding} 
              selectedId={selectedFinding?.id || ''} 
            />
          </div>
        </div>

        {/* Middle Panel: Issue Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border-light)' }}>
          {selectedFinding ? (
            <IssueDetailViewer finding={selectedFinding} onUpdate={handleUpdateFinding} />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
              Select a finding from the list to view details
            </div>
          )}
        </div>

        {/* Right Panel: Evidence Document Viewer */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          {selectedFinding ? (
            <DocumentEvidenceViewer finding={selectedFinding} />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-bg-app)' }}>
              Evidence viewer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="card" style={{ flex: 1, padding: 'var(--space-3)', borderLeft: color ? `4px solid ${color}` : undefined }}>
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginTop: 'var(--space-1)' }}>{value}</div>
    </div>
  );
}

function CategoryItem({ label, count, isActive, onClick }: { label: string, count: number, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        backgroundColor: isActive ? 'var(--color-accent-primary)' : 'transparent',
        color: isActive ? '#fff' : 'var(--color-text-primary)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        textTransform: 'capitalize'
      }}
    >
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal' }}>
        {label}
      </span>
      <span style={{
        fontSize: 'var(--font-size-xs)',
        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-surface)',
        color: isActive ? '#fff' : 'var(--color-text-secondary)',
        padding: '2px 8px',
        borderRadius: '12px',
        fontWeight: 'bold',
      }}>
        {count}
      </span>
    </button>
  );
}
