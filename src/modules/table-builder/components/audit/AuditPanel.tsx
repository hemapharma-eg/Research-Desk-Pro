/**
 * AuditPanel.tsx — Audit Trail & Change History (Section 16)
 */
import React from 'react';
import { useTableBuilder } from '../../TableBuilderContext';

export const AuditPanel: React.FC = () => {
  const { state } = useTableBuilder();
  const { table, auditLog } = state;

  if (!table) return <div className="tb-empty-state"><p>Open a table to view its audit trail.</p></div>;

  // Find manual overrides
  const overriddenCells: { rowId: string; colId: string; colTitle: string; value: string }[] = [];
  table.rows.forEach(row => {
    if (row.sectionLabel || row.isSeparator) return;
    table.columns.forEach(col => {
      const cell = row.cells[col.id];
      if (cell?.manualOverride && cell?.sourceBinding) {
        overriddenCells.push({ rowId: row.id, colId: col.id, colTitle: col.title, value: cell.displayValue });
      }
    });
  });

  const actionLabels: Record<string, string> = {
    create: '🟢 Created',
    edit_cell: '✏️ Cell Edit',
    refresh_from_source: '🔄 Source Refresh',
    manual_override: '⚠️ Manual Override',
    insert_doc: '📎 Doc Insertion',
    export: '📤 Export',
    narrative_gen: '📝 Narrative Generated',
    style_change: '🎨 Style Change',
    footnote_change: 'ᵃ Footnote Change',
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🔍 Audit Trail</h2>

      {/* Table Metadata */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div className="tb-prop-label">TABLE METADATA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '4px 12px', fontSize: 12 }}>
          <span style={{ color: '#868e96' }}>Created:</span><span>{new Date(table.createdAt).toLocaleString()}</span>
          <span style={{ color: '#868e96' }}>Last Modified:</span><span>{new Date(table.updatedAt).toLocaleString()}</span>
          <span style={{ color: '#868e96' }}>Type:</span><span>{table.tableType}</span>
          <span style={{ color: '#868e96' }}>Source Link:</span><span>{table.sourceLink ? `${table.sourceLink.testName} (${table.sourceLink.status})` : 'None'}</span>
          <span style={{ color: '#868e96' }}>Columns:</span><span>{table.columns.length}</span>
          <span style={{ color: '#868e96' }}>Data Rows:</span><span>{table.rows.filter(r => !r.sectionLabel && !r.isSeparator).length}</span>
          <span style={{ color: '#868e96' }}>Footnotes:</span><span>{table.footnotes.length}</span>
        </div>
      </div>

      {/* Manual Overrides */}
      {overriddenCells.length > 0 && (
        <div style={{ background: '#fff9db', border: '1px solid #ffd43b', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div className="tb-prop-label">⚠️ MANUAL OVERRIDES ({overriddenCells.length})</div>
          <div style={{ fontSize: 11 }}>
            {overriddenCells.map((ov, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0' }}>
                <span style={{ color: '#e67700' }}>●</span>
                <span>{ov.colTitle}: "{ov.value}"</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#e67700', marginTop: 6 }}>
            These cells have been manually edited and differ from their source-linked values.
            On next refresh, you will be prompted to preserve or replace overrides.
          </p>
        </div>
      )}

      {/* Change History */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: 16 }}>
        <div className="tb-prop-label">CHANGE HISTORY</div>
        {auditLog.length === 0 ? (
          <div style={{ color: '#adb5bd', fontStyle: 'italic', fontSize: 12, padding: 12, textAlign: 'center' }}>
            No changes recorded in this session.
          </div>
        ) : (
          <div style={{ fontSize: 12 }}>
            {auditLog.slice().reverse().map(entry => (
              <div key={entry.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #f0f1f3', alignItems: 'flex-start' }}>
                <span style={{ color: '#adb5bd', fontSize: 10, minWidth: 130, flexShrink: 0 }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span style={{ fontWeight: 500 }}>
                  {actionLabels[entry.action] || entry.action}
                </span>
                {entry.details && (
                  <span style={{ color: '#868e96', fontSize: 11 }}>
                    {entry.details.cell && `Cell: ${entry.details.cell}`}
                    {entry.details.old !== undefined && ` "${entry.details.old}" → "${entry.details.new}"`}
                    {entry.details.format && `Format: ${entry.details.format}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
