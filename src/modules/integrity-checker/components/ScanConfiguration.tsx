import { useState, useEffect } from 'react';
import type { IntegrityScanConfig } from '../types/IntegrityTypes';

interface ScanConfigurationProps {
  onStartScan: (config: IntegrityScanConfig, documentId: string) => void;
}

const categories = [
  {
    id: 'references',
    label: 'Citations & References',
    desc: 'Checks for bare-text citations, missing bibliography entries, and style consistency.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: 'formatting',
    label: 'Structure & Formatting',
    desc: 'Checks heading hierarchy, figure numbering, and structural consistency.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" />
      </svg>
    ),
  },
  {
    id: 'data_consistency',
    label: 'Data & Sample Sizes',
    desc: 'Cross-verifies "n=" numbers, p-values, and table outputs against inline text.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: 'abbreviations',
    label: 'Acronym Registry',
    desc: 'Ensures abbreviations are defined upon first use and never redefined.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    id: 'compliance',
    label: 'Compliance Statements',
    desc: 'Checks for IRB approval, conflict of interest, and funding disclosures.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export function ScanConfiguration({ onStartScan }: ScanConfigurationProps) {
  const [config, setConfig] = useState<IntegrityScanConfig>({
    categories: ['references', 'formatting', 'data_consistency', 'abbreviations', 'cross_references', 'compliance'],
    strictMode: false,
    checkExternalAPIs: false,
    autoFixAllowed: false,
  });

  const [docs, setDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'advanced'>('categories');

  useEffect(() => {
    window.api.getDocuments().then((res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        setDocs(res.data);
        setSelectedDocId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (selectedDocId && config.categories.length > 0) {
          onStartScan(config, selectedDocId);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [config, selectedDocId, onStartScan]);

  const toggleSelectAll = () => {
    const allIds = categories.map(c => c.id);
    const allSelected = allIds.every(id => config.categories.includes(id as any));
    setConfig({
      ...config,
      categories: allSelected ? [] : allIds as any[],
    });
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: 'var(--space-6) 0 var(--space-2)' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(41,98,255,0.12), rgba(120,85,255,0.12))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
          Configure Integrity Audit
        </h3>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', maxWidth: '460px', margin: '0 auto' }}>
          Select a document and choose which audit categories to evaluate before running.
        </p>
      </div>

      {/* Document Selection Card */}
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>Target Document</h3>
        </div>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
          Select the document you want to audit for integrity and compliance issues.
        </p>
        <select
          className="input"
          style={{ width: '100%' }}
          value={selectedDocId}
          onChange={e => setSelectedDocId(e.target.value)}
        >
          {docs.length > 0 ? (
            docs.map((d: any) => <option key={d.id} value={d.id}>{d.title}</option>)
          ) : (
            <option value="">No documents found in project</option>
          )}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
          <button
            onClick={() => setActiveTab('categories')}
            style={{
              flex: 1, padding: 'var(--space-3)', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--font-size-md)', fontWeight: activeTab === 'categories' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              color: activeTab === 'categories' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'categories' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            Audit Categories
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            style={{
              flex: 1, padding: 'var(--space-3)', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--font-size-md)', fontWeight: activeTab === 'advanced' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              color: activeTab === 'advanced' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'advanced' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            Advanced Rules & Settings
          </button>
        </div>

        <div style={{ padding: 'var(--space-4)' }}>
          {activeTab === 'categories' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>Select the rule engines to execute during this scan.</p>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-primary)', background: 'none', border: 'none',
                    cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px',
                  }}
                >
                  {categories.every(c => config.categories.includes(c.id as any)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {categories.map(c => {
                  const isChecked = config.categories.includes(c.id as any);
                  const isHovered = hoveredCategory === c.id;
                  return (
                    <label
                      key={c.id}
                      onMouseEnter={() => setHoveredCategory(c.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                        padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: `1px solid ${isChecked ? 'rgba(41,98,255,0.3)' : 'var(--color-border-light)'}`,
                        backgroundColor: isChecked
                          ? 'rgba(41,98,255,0.04)'
                          : isHovered ? 'var(--color-bg-hover)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const curr = config.categories;
                          const next = e.target.checked ? [...curr, c.id as any] : curr.filter(cat => cat !== c.id);
                          setConfig({ ...config, categories: next });
                        }}
                        style={{ marginTop: '3px', accentColor: 'var(--color-accent-primary)' }}
                      />
                      <div style={{ color: isChecked ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)', marginTop: '1px', flexShrink: 0 }}>
                        {c.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>{c.label}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px', lineHeight: 1.4 }}>{c.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'advanced' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>Reporting Rigor</h4>
                <div style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)' }}>
                    <input
                      type="checkbox"
                      checked={config.strictMode}
                      onChange={e => setConfig({ ...config, strictMode: e.target.checked })}
                      style={{ accentColor: 'var(--color-accent-primary)', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Strict Mode</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Elevate minor formatting issues to Errors instead of Warnings. Required for FDA/EMA submissions.</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-3)' }}>
                    <input
                      type="checkbox"
                      checked={config.autoFixAllowed}
                      onChange={e => setConfig({ ...config, autoFixAllowed: e.target.checked })}
                      style={{ accentColor: 'var(--color-accent-primary)', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Auto-Fix Formatting</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Allow the engine to generate direct patch replacements for trivial spacing and capitalization errors.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>External Services</h4>
                <div style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-3)' }}>
                    <input
                      type="checkbox"
                      checked={config.checkExternalAPIs}
                      onChange={e => setConfig({ ...config, checkExternalAPIs: e.target.checked })}
                      style={{ accentColor: 'var(--color-accent-primary)', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Validate DOI Metadata</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Ping external CrossRef API to detect retracted papers or malformed references. (Significantly slows scan).</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 'var(--space-4)' }}>
        <button
          className="btn btn-primary"
          onClick={() => onStartScan(config, selectedDocId)}
          disabled={!selectedDocId || config.categories.length === 0}
          style={{
            gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-6)',
            fontSize: 'var(--font-size-md)',
            opacity: (!selectedDocId || config.categories.length === 0) ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run Integrity Audit
        </button>
      </div>
    </div>
  );
}
