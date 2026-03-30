/**
 * LinkedObjectsPanel.tsx
 * Shows all Table Builder tables linked/embedded in the current document.
 * Provides actions to insert, refresh, or unlink tables.
 */
import { useState, useEffect } from 'react';
import type { TbTableRow, TbDocLinkRow } from '../../../types/electron.d';

interface LinkedObjectsPanelProps {
  documentId: string | null;
  onInsertTable?: (tableId: string, caption: string) => void;
}

export function LinkedObjectsPanel({ documentId, onInsertTable }: LinkedObjectsPanelProps) {
  const [docLinks, setDocLinks] = useState<TbDocLinkRow[]>([]);
  const [tables, setTables] = useState<TbTableRow[]>([]);
  const [allTables, setAllTables] = useState<TbTableRow[]>([]);
  const [showInsertPicker, setShowInsertPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load linked tables for this document
  const loadLinks = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      // Get all doc links, filter by this document
      const linksRes = await window.api.getTbDocLinks();
      if (linksRes.success && linksRes.data) {
        const myLinks = linksRes.data.filter(l => l.document_id === documentId);
        setDocLinks(myLinks);

        // Load table details for each linked table
        const tablePromises = myLinks.map(l => window.api.getTbTable(l.table_id));
        const tableResults = await Promise.all(tablePromises);
        const loadedTables = tableResults
          .filter(r => r.success && r.data)
          .map(r => r.data!);
        setTables(loadedTables);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Load all available tables for the insert picker
  const loadAllTables = async () => {
    try {
      const res = await window.api.getTbTables();
      if (res.success && res.data) {
        setAllTables(res.data);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadLinks();
    loadAllTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const handleUnlink = async (linkId: string) => {
    try {
      await window.api.deleteTbDocLink(linkId);
      loadLinks();
    } catch {
      // silent
    }
  };

  const handleInsertAndLink = async (table: TbTableRow) => {
    if (!documentId) return;
    try {
      // Create a document link record
      await window.api.createTbDocLink({
        table_id: table.id,
        document_id: documentId,
        insertion_type: 'linked',
        caption_placement: 'above',
      });
      // Insert into editor via callback
      if (onInsertTable) {
        onInsertTable(table.id, table.title || table.name);
      }
      setShowInsertPicker(false);
      loadLinks();
    } catch {
      // silent
    }
  };

  const linkedTableIds = new Set(docLinks.map(l => l.table_id));
  const availableTables = allTables.filter(t => !linkedTableIds.has(t.id));

  return (
    <div style={{ padding: '12px', fontSize: '13px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          📋 Linked Tables
        </h4>
        <button
          onClick={() => { setShowInsertPicker(!showInsertPicker); loadAllTables(); }}
          style={{
            background: 'var(--color-accent-primary)',
            color: 'white',
            border: 'none',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Insert Table
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '8px' }}>
          Loading…
        </div>
      )}

      {/* Linked tables list */}
      {!loading && tables.length === 0 && !showInsertPicker && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '12px', fontSize: '12px' }}>
          No tables linked to this document yet.<br />
          Use the <strong>+ Insert Table</strong> button to embed one.
        </div>
      )}

      {tables.map(table => {
        const link = docLinks.find(l => l.table_id === table.id);
        return (
          <div key={table.id} style={{
            padding: '8px',
            marginBottom: '6px',
            background: 'var(--color-bg-hover, #f8fafc)',
            borderRadius: '6px',
            border: '1px solid var(--color-border-light, #e2e8f0)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>
                  {table.table_number && <span style={{ color: 'var(--color-accent-primary)' }}>{table.table_number}. </span>}
                  {table.title || table.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                  {table.table_type} • Updated {new Date(table.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => onInsertTable?.(table.id, table.title || table.name)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px 4px' }}
                  title="Re-insert at cursor"
                >
                  📎
                </button>
                {link && (
                  <button
                    onClick={() => handleUnlink(link.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px 4px', color: '#DC2626' }}
                    title="Unlink from document"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Insert picker */}
      {showInsertPicker && (
        <div style={{
          marginTop: '8px',
          border: '1px solid var(--color-border-light, #e2e8f0)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '6px 8px', background: '#f1f5f9', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border-light)' }}>
            Available Tables
          </div>
          {availableTables.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              No additional tables available. Create one in the Table Builder module.
            </div>
          )}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {availableTables.map(table => (
              <button
                key={table.id}
                onClick={() => handleInsertAndLink(table)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderBottom: '1px solid var(--color-border-light, #e2e8f0)',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--color-bg-hover, #f8fafc)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontWeight: 500 }}>{table.title || table.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                  {table.table_type} • {new Date(table.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cross-module navigation */}
      <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border-light, #e2e8f0)', paddingTop: '12px' }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: { module: 'table-builder' } }))}
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid var(--color-accent-primary, #2962ff)',
            color: 'var(--color-accent-primary, #2962ff)',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🗃 Open Table Builder →
        </button>
      </div>
    </div>
  );
}
