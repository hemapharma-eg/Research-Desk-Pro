import { useState, useEffect } from 'react';
import { getAvailableStyles, initCitationStyles, addCustomStyleToState } from '../../../utils/citationStyles';
import { setCitationStyle } from '../../../utils/citationStyleStore';

interface CitationPreferencesProps {
  settings: { citationStyle?: string; customCslData?: string } & Record<string, unknown>; // TipTap pageSettings containing citationStyle and customCslData
  onChange: (key: string, value: string) => void;
  onClose: () => void;
}

export function CitationPreferences({ settings, onChange, onClose }: CitationPreferencesProps) {
  const [activeTab, setActiveTab] = useState<'builtin' | 'custom'>('builtin');
  const [stylesList, setStylesList] = useState(getAvailableStyles());

  const currentStyle = settings.citationStyle || 'apa';

  useEffect(() => {
    initCitationStyles().then(() => setStylesList(getAvailableStyles()));
  }, []);

  const handleCustomUploadIPC = async () => {
    try {
      const result = await window.api.importStyleFile();
      if (result.success && result.data) {
        onChange('citationStyle', result.data.id);
        addCustomStyleToState(result.data);
        onChange('citationStyle', result.data.id);
        setCitationStyle(result.data.id);
        setStylesList(getAvailableStyles());
        alert(`Loaded custom style: ${result.data.name}`);
        // Optionally switch tab to builtin to show it
        setActiveTab('builtin');
      } else if (!result.canceled) {
        alert('Failed to upload custom style: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error processing custom style: ' + String(err));
    }
  };

  return (
    <div style={{ position: 'absolute', top: '100%', right: '20px', width: '350px', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden', marginTop: 'var(--space-2)' }}>
      <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-surface)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>Citation Style</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '18px' }}>×</button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-light)' }}>
        <button 
          onClick={() => setActiveTab('builtin')} 
          style={{ flex: 1, padding: 'var(--space-2)', background: activeTab === 'builtin' ? 'var(--color-bg-app)' : 'var(--color-bg-surface)', border: 'none', borderBottom: activeTab === 'builtin' ? '2px solid var(--color-accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === 'builtin' ? 'bold' : 'normal', color: 'var(--color-text-primary)' }}
        >
          Built-in Styles
        </button>
        <button 
          onClick={() => setActiveTab('custom')} 
          style={{ flex: 1, padding: 'var(--space-2)', background: activeTab === 'custom' ? 'var(--color-bg-app)' : 'var(--color-bg-surface)', border: 'none', borderBottom: activeTab === 'custom' ? '2px solid var(--color-accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === 'custom' ? 'bold' : 'normal', color: 'var(--color-text-primary)' }}
        >
          Custom CSL
        </button>
      </div>

      <div style={{ padding: 'var(--space-4)', maxHeight: '300px', overflowY: 'auto' }}>
        {activeTab === 'builtin' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {stylesList.map(style => (
              <label key={style.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', background: currentStyle === style.id ? 'var(--color-bg-hover)' : 'transparent' }}>
                <input 
                  type="radio" 
                  name="citationStyle" 
                  value={style.id}
                  checked={currentStyle === style.id}
                  onChange={(e) => { onChange('citationStyle', e.target.value); setCitationStyle(e.target.value); }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{style.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Upload your own custom Citation Style Language (.csl) framework downloaded from Zotero Repository or other sources to match specific journal guidelines exactly.
            </p>
            
            <button 
              onClick={handleCustomUploadIPC}
              style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-accent-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 'var(--font-weight-medium)' }}
            >
              Upload .csl File
            </button>

            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2)', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                <strong>Note:</strong> Once uploaded, your custom style will be automatically activated and permanently added to the <strong>Built-in Styles</strong> list for future use in any document.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
