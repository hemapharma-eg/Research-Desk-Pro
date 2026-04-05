import { useState } from 'react';
import type { IntegrityFinding } from '../types/IntegrityTypes';

export function IssueDetailViewer({ finding, onUpdate }: { finding: IntegrityFinding; onUpdate?: (finding: IntegrityFinding) => void }) {
  const [noteContent, setNoteContent] = useState(finding.reviewer_note || '');

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as IntegrityFinding['status'];
    if (onUpdate) onUpdate({ ...finding, status: newStatus });
  };

  const handleSaveNote = () => {
    if (onUpdate) onUpdate({ ...finding, reviewer_note: noteContent });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-5)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '4px 8px', backgroundColor: 'var(--color-bg-app)', borderRadius: '4px', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)' }}>
            {finding.category.replace('_', ' ')}
          </span>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginTop: 'var(--space-2)' }}>
            {finding.check_name}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select 
            className="input" 
            value={finding.status} 
            onChange={handleStatusChange}
            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-sm)' }}
          >
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Mark as Resolved</option>
            <option value="ignored">Ignore</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-bg-app)', border: 'none' }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Issue Summary</h4>
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>{finding.summary}</p>
      </div>

      {finding.description && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Detailed Description</h4>
          <p style={{ color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{finding.description}</p>
        </div>
      )}

      {finding.recommendation && (
        <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'rgba(41, 98, 255, 0.05)', borderLeft: '4px solid var(--color-accent-primary)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-primary)', marginBottom: 'var(--space-2)' }}>Recommendation</h4>
          <p style={{ color: 'var(--color-text-primary)' }}>{finding.recommendation}</p>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)' }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Reviewer Notes</h4>
        <textarea 
          className="input" 
          placeholder="Add a note about this finding for your co-authors..."
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={handleSaveNote}>Save Note</button>
        </div>
      </div>
    </div>
  );
}
