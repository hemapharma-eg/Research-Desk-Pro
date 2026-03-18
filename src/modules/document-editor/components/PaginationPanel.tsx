

interface PaginationPanelProps {
  settings: { headerText: string; footerText: string; pageNumberPosition: string };
  onChange: (key: string, value: string) => void;
  onClose: () => void;
}

export function PaginationPanel({ settings, onChange, onClose }: PaginationPanelProps) {
  const currentHeader = settings.headerText || '';
  const currentFooter = settings.footerText || '';
  const currentPosition = settings.pageNumberPosition || 'none';

  const updatePagination = (key: string, value: string) => {
    onChange(key, value);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      backgroundColor: 'var(--color-bg-sidebar)',
      borderBottom: '1px solid var(--color-border-strong)',
      padding: 'var(--space-4)',
      zIndex: 50,
      display: 'flex',
      gap: 'var(--space-4)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      alignItems: 'flex-start',
      flexWrap: 'wrap'
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
          Header Text
        </label>
        <input
          type="text"
          value={currentHeader}
          onChange={(e) => updatePagination('headerText', e.target.value)}
          placeholder="e.g., Chapter 1..."
          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border-light)' }}
        />
      </div>

      <div style={{ flex: 1, minWidth: '200px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
          Footer Text
        </label>
        <input
          type="text"
          value={currentFooter}
          onChange={(e) => updatePagination('footerText', e.target.value)}
          placeholder="e.g., Confidential..."
          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border-light)' }}
        />
      </div>

      <div style={{ flex: 1, minWidth: '150px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
          Page Numbers
        </label>
        <select
          value={currentPosition}
          onChange={(e) => updatePagination('pageNumberPosition', e.target.value)}
          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border-light)' }}
        >
          <option value="none">None</option>
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>

      <button
        onClick={onClose}
        style={{
          padding: '6px 12px', alignSelf: 'flex-end', cursor: 'pointer',
          background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '4px'
        }}
      >
        Done
      </button>
    </div>
  );
}
