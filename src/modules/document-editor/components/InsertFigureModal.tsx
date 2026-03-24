import { useEffect, useState } from 'react';

interface Figure {
  id: string;
  name: string;
  graph_type: string;
  thumbnail_dataurl: string | null;
  created_at: string;
}

interface InsertFigureModalProps {
  onClose: () => void;
  onInsert: (figure: Figure) => void;
}

export function InsertFigureModal({ onClose, onInsert }: InsertFigureModalProps) {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFigures() {
      try {
        const res = await window.api.getGraphingFigures();
        if (res.success && res.data) {
          setFigures(res.data);
        }
      } catch (err) {
        console.error('Failed to load figures:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFigures();
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--color-bg-app)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)',
        width: '600px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>Insert Saved Figure</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 'var(--space-2)' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>Loading figures...</div>
          ) : figures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
              No figures found. Go to Graphing Studio to create and save some figures!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
              {figures.map(fig => (
                <div 
                  key={fig.id} 
                  onClick={() => onInsert(fig)}
                  style={{
                    border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    backgroundColor: 'var(--color-bg-surface)', transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {fig.thumbnail_dataurl ? (
                    <img src={fig.thumbnail_dataurl} alt={fig.name} style={{ width: '100%', height: '100px', objectFit: 'contain', marginBottom: 'var(--space-2)' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-hover)', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                      No Preview
                    </div>
                  )}
                  <span style={{ fontSize: 'var(--font-size-sm)', textAlign: 'center', fontWeight: 'var(--font-weight-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }} title={fig.name}>
                    {fig.name}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                    {new Date(fig.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
