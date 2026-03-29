import { useState } from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';

export function CollaborationCenter() {
  const { state } = useSystematicReview();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<any>(null);

  const activeReviewerName = state.activeReviewer?.name || 'Unknown User';
  const reviewerId = state.activeReviewer?.id;

  const handleExport = async () => {
    if (!reviewerId) return alert("No active reviewer identified.");
    setIsExporting(true);
    try {
      const res = await window.api.exportCollaborationData(reviewerId);
      if (res.success) {
        alert(`Collaboration Data successfully exported to:\n${res.filePath}`);
      } else if (!res.canceled) {
        alert("Failed to export: " + res.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error exporting data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportStats(null);
    try {
      const res = await window.api.importCollaborationData();
      if (res.success) {
        setImportStats(res.stats);
        // We should dispatch a refresh action to reload state natively, 
        // for now we alert the user
      } else if (!res.canceled) {
        alert("Failed to import: " + res.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error importing data.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: 8, color: '#334e68' }}>Offline Collaboration Hub</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 30, lineHeight: 1.5 }}>
          The Systematic Review Accelerator employs a locally-first offline protocol for true blinding.
          Reviewers can export their isolated decisions and data extraction points as a secure JSON payload, and then send it to the Lead Investigator.
          The Lead Investigator imports the file, merging decisions for final reconciliation and conflict resolution.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Export Panel */}
          <div className="sr-card" style={{ borderLeft: '4px solid #1890ff' }}>
            <h3 style={{ marginTop: 0 }}>Export My Reviewer File</h3>
            <p style={{ fontSize: '13px', color: '#555' }}>
              Currently Assessed As: <strong style={{color: '#1890ff'}}>{activeReviewerName}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#555' }}>
              Export all Screening Decisions, Extracted Data Points, and Risk of Bias Assessments attributed to you in this project.
            </p>
            <button 
              className="sr-btn sr-btn-primary" 
              onClick={handleExport}
              disabled={isExporting || !reviewerId}
              style={{ marginTop: 10 }}
            >
              {isExporting ? 'Exporting...' : '💾 Export Collab File'}
            </button>
          </div>

          {/* Import Panel */}
          <div className="sr-card" style={{ borderLeft: '4px solid #52c41a' }}>
            <h3 style={{ marginTop: 0 }}>Import Co-Reviewer File</h3>
            <p style={{ fontSize: '13px', color: '#555' }}>
              Merge an external reviewer's JSON file directly into your local database. 
              This will populate Conflict Resolution tables comparing your choices against theirs natively.
            </p>
            <button 
              className="sr-btn sr-btn-success" 
              onClick={handleImport}
              disabled={isImporting}
              style={{ marginTop: 10 }}
            >
              {isImporting ? 'Importing...' : '📥 Import Collab File'}
            </button>

            {importStats && (
              <div style={{ marginTop: 20, padding: 15, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                <strong>✅ Import Processed Successfully!</strong>
                <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
                  <li>Screening Decisions Merged: <strong>{importStats.decisions}</strong></li>
                  <li>Data Extractions Merged: <strong>{importStats.extractions}</strong></li>
                  <li>RoB Assessments Merged: <strong>{importStats.robs}</strong></li>
                </ul>
                <div style={{ marginTop: 10 }}>
                  <button className="sr-btn" onClick={() => window.location.reload()} style={{ padding: '4px 8px' }}>↻ Refresh App to apply changes</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
