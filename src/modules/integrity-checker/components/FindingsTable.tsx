import { useState, useMemo } from 'react';
import type { IntegrityFinding } from '../types/IntegrityTypes';

export function FindingsTable({ 
  findings, 
  onSelect, 
  selectedId 
}: { 
  findings: IntegrityFinding[]; 
  onSelect: (f: IntegrityFinding) => void;
  selectedId: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'severity' | 'status' | 'category'>('severity');

  const getSeverityScore = (sev: string) => {
    switch (sev) {
      case 'error': return 4;
      case 'warning': return 3;
      case 'notice': return 2;
      case 'pass': return 1;
      default: return 0;
    }
  };

  const processedFindings = useMemo(() => {
    let result = findings;
    
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.check_name.toLowerCase().includes(q) || 
        f.summary.toLowerCase().includes(q) ||
        (f.extracted_evidence && f.extracted_evidence.toLowerCase().includes(q))
      );
    }
    
    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'severity') {
        const diff = getSeverityScore(b.severity) - getSeverityScore(a.severity);
        if (diff !== 0) return diff;
      } else if (sortBy === 'status') {
        const diff = a.status.localeCompare(b.status);
        if (diff !== 0) return diff;
      } else if (sortBy === 'category') {
        const diff = a.category.localeCompare(b.category);
        if (diff !== 0) return diff;
      }
      return 0; // retain original order as fallback
    });
  }, [findings, searchQuery, sortBy]);

  if (findings.length === 0) {
    return (
      <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        No issues found. Your document looks solid!
      </div>
    );
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'error': return 'var(--color-danger)';
      case 'warning': return 'var(--color-warning)';
      case 'notice': return 'var(--color-info)';
      case 'pass': return 'var(--color-success)';
      default: return 'var(--color-text-secondary)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and Sort Header */}
      <div style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)', display: 'flex', gap: 'var(--space-2)', position: 'sticky', top: 0, zIndex: 10 }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Search findings..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}
        />
        <select 
          className="input" 
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}
        >
          <option value="severity">Sort: Severity</option>
          <option value="status">Sort: Status</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      <div style={{ flex: 1 }}>
        {processedFindings.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            No findings match your search.
          </div>
        ) : (
          processedFindings.map(f => (
            <div 
              key={f.id || f.summary}
              onClick={() => onSelect(f)}
              style={{
                padding: 'var(--space-3)',
                borderBottom: '1px solid var(--color-border-light)',
                cursor: 'pointer',
                backgroundColor: selectedId === f.id ? 'var(--color-bg-hover)' : 'transparent',
                display: 'flex',
                gap: 'var(--space-3)',
                transition: 'background-color 0.2s ease',
                opacity: f.status === 'resolved' || f.status === 'ignored' || f.status === 'false_positive' ? 0.6 : 1
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getSeverityColor(f.severity), marginTop: 'var(--space-2)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                  {f.check_name}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {f.summary}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '4px', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-border-light)' }}>
                    {f.category.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: f.status === 'unresolved' ? 'rgba(255, 61, 113, 0.1)' : 'var(--color-bg-surface)', borderRadius: '4px', color: f.status === 'unresolved' ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
                    {f.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
