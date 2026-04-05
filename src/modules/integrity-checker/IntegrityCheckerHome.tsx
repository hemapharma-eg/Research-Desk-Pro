import { useState, useEffect } from 'react';
import type { 
  IntegrityScanConfig, 
  ScanSessionResult,
  IntegrityFinding,
  AbbrevRegistryEntry,
  CitationMappingEntry,
  TableFigureMappingEntry,
  SampleSizeMention
} from './types/IntegrityTypes';
import { ScanConfiguration } from './components/ScanConfiguration';
import { ProgressScreen } from './components/ProgressScreen';
import { ResultsDashboard } from './components/ResultsDashboard';
import { CrossReferenceExplorer } from './components/CrossReferenceExplorer';
import { ComplianceStatementViewer } from './components/ComplianceStatementViewer';
import { FinalReportExportScreen } from './components/FinalReportExportScreen';
import { IntegrityRuleEngine } from './utils/RuleEngine';

type ActiveTab = 'setup' | 'progress' | 'results' | 'cross-references' | 'compliance' | 'export';

const TAB_META: { id: ActiveTab; label: string; requiresSession: boolean }[] = [
  { id: 'results', label: 'Findings', requiresSession: true },
  { id: 'cross-references', label: 'Cross-Refs', requiresSession: true },
  { id: 'compliance', label: 'Compliance', requiresSession: true },
  { id: 'export', label: 'Export', requiresSession: true },
];

export function IntegrityCheckerHome() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('setup');
  const [currentSession, setCurrentSession] = useState<ScanSessionResult | null>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  // Store the HTML content for the current scan (for the Document Evidence viewer)
  const [scanHtmlContent, setScanHtmlContent] = useState<string>('');

  useEffect(() => {
    fetchPastSessions();
  }, []);

  const fetchPastSessions = async () => {
    try {
      const res = await window.api.getIcScanSessions();
      if (res?.success) setPastSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load past sessions', err);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      const parent = pastSessions.find(s => s.id === sessionId);
      if (!parent) return;

      const [fRes, aRes, cRes, mRes, sRes] = await Promise.all([
        window.api.getIcFindings(sessionId),
        window.api.getIcAbbrevRegistry(sessionId),
        window.api.getIcCitationMapping(sessionId),
        window.api.getIcAssetMapping(sessionId),
        window.api.getIcSampleSizeMentions(sessionId),
      ]);

      const reconstructedSession: ScanSessionResult = {
        sessionId,
        findings: fRes?.success ? (fRes.data as any as IntegrityFinding[]) : [],
        abbreviations: aRes?.success ? (aRes.data as any as AbbrevRegistryEntry[]) : [],
        citations: cRes?.success ? (cRes.data as any as CitationMappingEntry[]) : [],
        tableFigureMappings: mRes?.success ? (mRes.data as any as TableFigureMappingEntry[]) : [],
        sampleSizes: sRes?.success ? (sRes.data as any as SampleSizeMention[]) : [],
        pValues: [], // We don't persist pValues specifically as they don't have a unique table yet
        stats: {
          totalFindings: parent.total_findings || 0,
          errorsCount: parent.errors_count || 0,
          warningsCount: parent.warnings_count || 0,
          noticesCount: parent.notices_count || 0,
          overallScore: parent.overall_score || 0,
        }
      };

      // Try to reload the original document's HTML for the evidence viewer
      if (parent.document_id) {
        try {
          const docRes = await window.api.getDocument(parent.document_id);
          if (docRes?.success && docRes.data?.content) {
            setScanHtmlContent(docRes.data.content);
          }
        } catch (e) {
          console.warn('Could not reload document HTML for evidence viewer');
        }
      }

      setCurrentSession(reconstructedSession);
      setActiveTab('results');
    } catch (err) {
      console.error('Failed to reconstruct session:', err);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Return to setup tab if we're randomly viewing results
        if (activeTab !== 'setup' && activeTab !== 'progress') {
          setActiveTab('setup');
          setCurrentSession(null);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab]);

  const runScanFromHtmlContent = async (config: IntegrityScanConfig, htmlContent: string, documentId: string) => {
    setActiveTab('progress');

    try {
      // Fetch cross-reference data
      const refsRes = await window.api.getReferences();
      const globalReferences = refsRes?.success ? (refsRes.data || []) : [];

      const tablesRes = await window.api.getTbTables();
      const globalTables = tablesRes?.success ? (tablesRes.data || []) : [];

      // Run the real engine against HTML content
      const engine = new IntegrityRuleEngine();
      const sessionId = `ic-${Date.now()}`;
      const result = engine.runScanFromHtml(htmlContent, documentId, sessionId, config, globalReferences, globalTables);

      // Persist to Database
      try {
        await window.api.createIcScanSession({
          id: sessionId,
          document_id: documentId,
          scan_scope: config.categories.join(','),
          total_findings: result.stats.totalFindings,
          errors_count: result.stats.errorsCount,
          warnings_count: result.stats.warningsCount,
          notices_count: result.stats.noticesCount,
          overall_score: result.stats.overallScore,
          settings_snapshot_json: JSON.stringify(config)
        });

        if (result.findings?.length) await window.api.saveIcFindings(result.findings);
        if (result.abbreviations?.length) await window.api.saveIcAbbrevRegistry(result.abbreviations);
        if (result.citations?.length) await window.api.saveIcCitationMapping(result.citations);
        if (result.tableFigureMappings?.length) await window.api.saveIcAssetMapping(result.tableFigureMappings);
        if (result.sampleSizes?.length) await window.api.saveIcSampleSizeMentions(result.sampleSizes);
      } catch (dbErr) {
        console.error('Failed to persist scan results to DB:', dbErr);
      }

      setScanHtmlContent(htmlContent);
      setCurrentSession(result);
      setActiveTab('results');
      
      // Refresh the list of past sessions
      fetchPastSessions();
    } catch (err) {
      console.error('Integrity scan error:', err);
      setActiveTab('setup');
    }
  };

  const handleStartScan = async (config: IntegrityScanConfig, documentId: string) => {
    try {
      // Fetch the full document (including HTML content)
      const docRes = await window.api.getDocument(documentId);
      if (!docRes.success || !docRes.data) {
        console.error('Failed to fetch document for scan');
        return;
      }

      const doc = docRes.data;
      const htmlContent = doc.content || '';
      await runScanFromHtmlContent(config, htmlContent, documentId);
    } catch (err) {
      console.error('Integrity scan error:', err);
      setActiveTab('setup');
    }
  };

  const handleStartScanFromHtml = async (config: IntegrityScanConfig, html: string, fileName: string) => {
    // Use the fileName as a pseudo document ID for external DOCX
    const pseudoDocId = `external-docx-${Date.now()}`;
    await runScanFromHtmlContent(config, html, pseudoDocId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <header style={{
        padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            Integrity & Compliance Checker
          </h2>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
            Audit your manuscript for structural consistency, unlinked data, and missing compliance statements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {pastSessions.length > 0 && (
            <select 
              className="input"
              value=""
              onChange={(e) => {
                if (e.target.value) handleLoadSession(e.target.value);
              }}
              style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}
            >
              <option value="" disabled>Open Previous Report...</option>
              {pastSessions.map(ps => {
                const dt = new Date(ps.created_at).toLocaleString();
                const scope = ps.scan_scope ? ps.scan_scope.substring(0, 15) + '...' : 'All Categories';
                return (
                  <option key={ps.id} value={ps.id}>
                    {dt} — {scope} ({ps.overall_score}/100)
                  </option>
                );
              })}
            </select>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => {
              setActiveTab('setup');
              setCurrentSession(null);
            }}
            disabled={activeTab === 'setup'}
          >
            New Scan
          </button>

          {currentSession && (
            <div style={{
              display: 'flex', border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
            }}>
              {TAB_META.map((tab, i) => (
                <button
                  key={tab.id}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    backgroundColor: activeTab === tab.id ? 'var(--color-bg-hover)' : 'transparent',
                    borderRight: i < TAB_META.length - 1 ? '1px solid var(--color-border-light)' : undefined,
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer', border: 'none',
                    color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === tab.id ? 'var(--font-weight-medium)' : 'normal',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'setup' && (
          <div style={{ padding: 'var(--space-4)', maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {pastSessions.length > 0 && (
              <div 
                className="card" 
                style={{ 
                  padding: 'var(--space-4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderLeft: '4px solid var(--color-accent-primary)',
                  backgroundColor: 'rgba(41, 98, 255, 0.03)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    Last Audit: {new Date(pastSessions[0].created_at).toLocaleString()}
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    <span><strong>Score:</strong> <span style={{ color: pastSessions[0].overall_score >= 80 ? 'var(--color-success)' : pastSessions[0].overall_score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{pastSessions[0].overall_score}/100</span></span>
                    <span><strong>Errors:</strong> {pastSessions[0].errors_count}</span>
                    <span><strong>Warnings:</strong> {pastSessions[0].warnings_count}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleLoadSession(pastSessions[0].id!)}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  View Full Report
                </button>
              </div>
            )}
            
            <ScanConfiguration onStartScan={handleStartScan} onStartScanFromHtml={handleStartScanFromHtml} />
          </div>
        )}

        {activeTab === 'progress' && (
          <ProgressScreen />
        )}

        {activeTab === 'results' && currentSession && (
          <ResultsDashboard session={currentSession} onUpdateSession={setCurrentSession} htmlContent={scanHtmlContent} />
        )}

        {activeTab === 'cross-references' && currentSession && (
          <CrossReferenceExplorer session={currentSession} />
        )}

        {activeTab === 'compliance' && currentSession && (
          <ComplianceStatementViewer session={currentSession} onUpdateSession={setCurrentSession} />
        )}

        {activeTab === 'export' && currentSession && (
          <FinalReportExportScreen session={currentSession} />
        )}
      </main>
    </div>
  );
}
