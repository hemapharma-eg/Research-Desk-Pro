/**
 * InsertReferenceModal.tsx
 * A modal that shows all project references for inserting citations into the document.
 * Triggered by the Reference button or Cmd/Ctrl+Shift+R.
 */
import { useEffect, useState, useRef } from 'react';

interface Reference {
  id: string;
  authors?: string;
  title?: string;
  year?: string;
  journal?: string;
}

interface InsertReferenceModalProps {
  onClose: () => void;
  onInsert: (refs: Reference[]) => void;
}

export function InsertReferenceModal({ onClose, onInsert }: InsertReferenceModalProps) {
  const [allRefs, setAllRefs] = useState<Reference[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.api.getReferences();
        if (res.success && res.data) setAllRefs(res.data);
      } catch { }
      setIsLoading(false);
    })();
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const filtered = allRefs.filter(r => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      r.authors?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.year?.includes(q) ||
      r.journal?.toLowerCase().includes(q)
    );
  });

  const toggleRef = (ref: Reference) => {
    if (selected.find(s => s.id === ref.id)) {
      setSelected(prev => prev.filter(s => s.id !== ref.id));
    } else {
      setSelected(prev => [...prev, ref]);
    }
  };

  const handleInsert = () => {
    if (selected.length === 0) return;
    onInsert(selected);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--color-bg-app)', borderRadius: '16px',
        width: '600px', maxWidth: '90vw', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-bg-surface)',
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>📚 Insert Reference</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-strong)', borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ marginRight: '8px', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search by author, title, year, or journal..."
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '14px', color: 'var(--color-text-primary)' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && selected.length > 0) handleInsert();
                if (e.key === 'Escape') onClose();
              }}
            />
          </div>
        </div>

        {/* Selected basket */}
        {selected.length > 0 && (
          <div style={{
            padding: '8px 20px', background: 'rgba(41, 98, 255, 0.04)',
            borderBottom: '1px solid var(--color-border-light)',
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '4px' }}>Selected ({selected.length}):</span>
            {selected.map(r => (
              <span key={r.id} style={{
                background: 'var(--color-accent-primary)', color: 'white',
                padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                {r.authors?.split(',')[0]} ({r.year})
                <button onClick={() => toggleRef(r)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '9px', padding: 0 }}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Reference list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading references...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              {allRefs.length === 0 ? 'No references in this project. Import some in the References module first.' : 'No references match your search.'}
            </div>
          ) : (
            filtered.map(ref => {
              const isSelected = !!selected.find(s => s.id === ref.id);
              return (
                <div
                  key={ref.id}
                  onClick={() => toggleRef(ref)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    border: isSelected ? '2px solid var(--color-accent-primary)' : '1px solid transparent',
                    background: isSelected ? 'rgba(41, 98, 255, 0.06)' : 'transparent',
                    marginBottom: '4px',
                    transition: 'all 0.1s ease',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                    border: isSelected ? '2px solid var(--color-accent-primary)' : '2px solid var(--color-border-strong)',
                    background: isSelected ? 'var(--color-accent-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '12px', marginTop: '2px',
                  }}>
                    {isSelected && '✓'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {ref.authors?.split(',')[0]}{ref.authors?.includes(',') ? ' et al.' : ''} ({ref.year || '?'})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ref.title}
                    </div>
                    {ref.journal && (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: '2px' }}>
                        {ref.journal}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--color-border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--color-bg-surface)',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            {allRefs.length} total references • Click to select, then insert
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--color-border-light)', borderRadius: '8px', cursor: 'pointer', background: 'var(--color-bg-surface)', fontSize: '13px' }}>Cancel</button>
            <button
              onClick={handleInsert}
              disabled={selected.length === 0}
              style={{
                padding: '8px 20px', borderRadius: '8px', cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
                background: selected.length > 0 ? 'var(--color-accent-primary)' : 'var(--color-bg-hover)',
                color: selected.length > 0 ? 'white' : 'var(--color-text-tertiary)',
                border: 'none', fontSize: '13px', fontWeight: 600,
              }}
            >
              Insert {selected.length > 0 ? `${selected.length} Reference${selected.length > 1 ? 's' : ''}` : 'Reference'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
