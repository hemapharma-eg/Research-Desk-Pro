import { useState, useEffect, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import type { Reference } from '../../types/electron.d';

export function SystematicReview() {
  const { currentProject } = useProject();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);

  // Fetch all references
  useEffect(() => {
    if (!currentProject) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const res = await window.api.getReferences();
        if (res.success && res.data) {
          setReferences(res.data);
        } else {
          setError(res.error || 'Failed to load reference data');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentProject]);

  // Derived state
  const unreviewed = useMemo(() => references.filter(r => !r.review_status || r.review_status === 'unreviewed'), [references]);
  const includedCount = useMemo(() => references.filter(r => r.review_status === 'included').length, [references]);
  const excludedCount = useMemo(() => references.filter(r => r.review_status === 'excluded').length, [references]);
  
  const totalReviewed = includedCount + excludedCount;
  const totalCount = references.length;

  const currentReference = unreviewed.length > 0 ? unreviewed[0] : null;

  // Actions
  const handleUpdateStatus = async (id: string, status: 'included' | 'excluded' | 'unreviewed') => {
    try {
      const res = await window.api.updateReferenceStatus(id, status);
      if (res.success) {
        // Optimistic update
        setReferences(prev => prev.map(r => r.id === id ? { ...r, review_status: status } : r));
      } else {
        setError(res.error || 'Failed to update review status');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error updating status');
    }
  };

  const handleSkip = () => {
    // Just move the current item to the back of the queue visually by removing and appending
    if (!currentReference) return;
    setReferences(prev => {
      const target = prev.find(r => r.id === currentReference.id);
      if (!target) return prev;
      return [...prev.filter(r => r.id !== currentReference.id), target];
    });
  };

  // Extract Abstract safely if present in raw_metadata
  const abstractText = useMemo(() => {
    if (!currentReference?.raw_metadata) return 'No abstract available.';
    try {
      const parsed = JSON.parse(currentReference.raw_metadata);
      // Crossref usually returns abstract in XML tags or plain text inside `abstract` field
      if (parsed.abstract) {
        // Strip out basic JATS XML tags often returned by Crossref
        return parsed.abstract.replace(/<[^>]+>/g, '');
      }
    } catch {
      // Ignore parse errors
    }
    return 'No abstract available.';
  }, [currentReference]);

  if (!currentProject) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>
        <p>Please open a project to start the Systematic Review process.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 'var(--space-4)', gap: 'var(--space-4)' }}>
      
      {/* Progress Header */}
      <div style={{ backgroundColor: 'var(--color-bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>Screening Queue</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Review and categorize references for your systematic review.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)', backgroundColor: 'var(--color-bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
          <div style={{ textAlign: 'center', paddingRight: 'var(--space-4)', borderRight: '1px solid var(--color-border-light)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewed</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>{totalReviewed} <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>/ {totalCount}</span></div>
          </div>
          <div style={{ textAlign: 'center', paddingRight: 'var(--space-4)', borderRight: '1px solid var(--color-border-light)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Included</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>{includedCount}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Excluded</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)' }}>{excludedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Flashcard Area */}
      {error && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}>{error}</div>
      )}

      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>Loading queue...</div>
      ) : !currentReference ? (
        <div style={{ flex: 1, backgroundColor: 'var(--color-bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>Queue Empty!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)' }}>You have reviewed all {totalCount} references in this project.</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Paper Info Card */}
          <div style={{ flex: 1, backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-xl)', border: '2px solid var(--color-border-strong)', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
            
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <span style={{ backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                  {currentReference.year || 'Unknown Year'}
                </span>
                <span style={{ backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                  {currentReference.journal || 'Unknown Journal'}
                </span>
                {currentReference.doi && (
                  <span style={{ backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-accent-primary)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                    DOI: {currentReference.doi}
                  </span>
                )}
              </div>
              
              <h1 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', lineHeight: 1.2, marginBottom: 'var(--space-4)' }}>
                {currentReference.title}
              </h1>
              <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {currentReference.authors}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-6)', flex: 1 }}>
              <h3 style={{ fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>Abstract</h3>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {abstractText}
              </p>
            </div>
            
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', height: '80px' }}>
            <button 
              onClick={() => handleUpdateStatus(currentReference.id, 'excluded')}
              style={{ flex: 1, backgroundColor: 'transparent', border: '2px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ✗ Exclude
            </button>
            
            <button 
              onClick={handleSkip}
              style={{ padding: '0 var(--space-6)', backgroundColor: 'var(--color-bg-hover)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer' }}
              title="Skip and send to back of queue"
            >
              Skip
            </button>

            <button 
              onClick={() => handleUpdateStatus(currentReference.id, 'included')}
              style={{ flex: 1, backgroundColor: 'var(--color-success)', border: 'none', color: '#fff', borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.2)' }}
              onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
            >
              ✓ Include
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
