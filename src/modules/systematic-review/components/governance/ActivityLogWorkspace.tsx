import React from 'react';
import { useSystematicReview } from '../../context/SystematicReviewContext';

export function ActivityLogWorkspace() {
  const { state } = useSystematicReview();

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
             <h2 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Governance & Activity Log</h2>
             <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>An immutable audit trail of all project modifications, imports, and screening decisions.</div>
          </div>
          <button className="sr-btn">Export Log as CSV</button>
        </div>

        <div className="sr-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead style={{ background: 'var(--color-bg-subtle)' }}>
              <tr>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', width: 160 }}>Timestamp</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)' }}>Event Type</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)' }}>Actor</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)' }}>Resource ID</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', width: '40%' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {state.logs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No events recorded yet.</td></tr>
              ) : (
                [...state.logs].reverse().map(log => {
                   const reviewer = state.project?.reviewers.find(r => r.id === log.userId)?.name || log.userId;
                   return (
                     <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                       <td style={{ padding: '12px 16px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                         {new Date(log.timestamp).toLocaleString()}
                       </td>
                       <td style={{ padding: '12px 16px' }}>
                         <span style={{ 
                           background: log.actionType.includes('decision') ? '#e6f7ff' : '#f5f5f5', 
                           color: log.actionType.includes('decision') ? '#1890ff' : 'var(--color-text-secondary)',
                           padding: '2px 6px', borderRadius: 4, fontSize: 11, border: '1px solid currentColor' 
                         }}>
                           {log.actionType.toUpperCase().replace(/_/g, ' ')}
                         </span>
                       </td>
                       <td style={{ padding: '12px 16px', fontWeight: 500 }}>{reviewer}</td>
                       <td style={{ padding: '12px 16px', color: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'monospace' }}>
                         {log.recordId ? log.recordId.split('-')[0] : '-'}
                       </td>
                       <td style={{ padding: '12px 16px' }}>{log.comment || '-'}</td>
                     </tr>
                   );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
