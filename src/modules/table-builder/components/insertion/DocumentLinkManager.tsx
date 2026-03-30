/**
 * DocumentLinkManager.tsx — Document Link Manager (Section 9)
 */
import React from 'react';
import { useTableBuilder } from '../../TableBuilderContext';

export const DocumentLinkManager: React.FC = () => {
  const { state, dispatch } = useTableBuilder();
  const { documentLinks } = state;

  const handleDetach = (linkId: string) => {
    dispatch({ type: 'SET_DOC_LINKS', payload: documentLinks.filter(l => l.id !== linkId) });
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Linked Document Objects</h3>
      {documentLinks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#868e96' }}>
          <span style={{ fontSize: 36 }}>📎</span>
          <p style={{ marginTop: 8 }}>No tables inserted into documents yet.</p>
        </div>
      ) : (
        <table className="tb-library-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Type</th>
              <th>Caption</th>
              <th>Status</th>
              <th>Last Synced</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documentLinks.map(link => {
              const tbl = state.tableList.find(t => t.id === link.tableId);
              return (
                <tr key={link.id}>
                  <td style={{ fontWeight: 500 }}>{tbl?.name || link.tableId.slice(0, 8)}</td>
                  <td>{link.insertionType}</td>
                  <td>{link.captionPlacement}</td>
                  <td>
                    <span className={`tb-link-badge tb-link-${link.updateStatus === 'synced' ? 'linked' : link.updateStatus}`}>
                      {link.updateStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: 11 }}>{new Date(link.lastSyncedAt).toLocaleString()}</td>
                  <td>
                    <div className="tb-lib-actions">
                      <button className="tb-btn tb-btn-ghost tb-btn-sm">🔄</button>
                      <button className="tb-btn tb-btn-ghost tb-btn-sm" onClick={() => handleDetach(link.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
