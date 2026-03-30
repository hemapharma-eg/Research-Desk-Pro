/**
 * TableBuilderEmbedNode.tsx
 * TipTap node extension for rendering embedded Table Builder tables in the Document Editor.
 * Tables are embedded as a custom node with a tableId attribute that links to TB tables.
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { useEffect, useState } from 'react';
import type { TbTableRow } from '../../../types/electron.d';

// ────── Node View Component ──────

interface TableEmbedViewProps {
  node: { attrs: { tableId: string; caption: string; showFootnotes: boolean } };
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}

function TableEmbedView({ node, deleteNode }: TableEmbedViewProps) {
  const { tableId, caption, showFootnotes } = node.attrs;
  const [table, setTable] = useState<TbTableRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await window.api.getTbTable(tableId);
        if (res.success && res.data) {
          setTable(res.data);
        } else {
          setError('Table not found');
        }
      } catch {
        setError('Failed to load table');
      } finally {
        setLoading(false);
      }
    })();
  }, [tableId]);

  // Render the table data as an HTML table
  const renderTable = () => {
    if (!table) return null;

    const columns = JSON.parse(table.columns_json || '[]') as { id: string; label: string; width?: number }[];
    const rows = JSON.parse(table.rows_json || '[]') as { id: string; cells: Record<string, { displayValue?: string }> }[];
    const footnotes = showFootnotes ? JSON.parse(table.footnotes_json || '[]') as { id: string; marker: string; text: string }[] : [];

    return (
      <div className="tb-embed-table-wrapper">
        {/* Caption */}
        {(caption || table.caption || table.title) && (
          <div className="tb-embed-caption">
            {table.table_number && <strong>{table.table_number}. </strong>}
            {caption || table.caption || table.title}
          </div>
        )}

        {/* Table */}
        <table className="tb-embed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-family-mono, monospace)' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.id} style={{ 
                  borderBottom: '2px solid #333', padding: '6px 8px', textAlign: 'left',
                  fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap'
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.id} style={{ borderBottom: ri === rows.length - 1 ? '2px solid #333' : '1px solid #e2e8f0' }}>
                {columns.map(col => (
                  <td key={col.id} style={{ padding: '4px 8px', fontSize: '12px' }}>
                    {row.cells?.[col.id]?.displayValue ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footnotes */}
        {footnotes.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#64748b' }}>
            {footnotes.map(fn => (
              <div key={fn.id}><sup>{fn.marker}</sup> {fn.text}</div>
            ))}
          </div>
        )}

        {/* Link indicator */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '4px', fontSize: '10px', color: '#94a3b8'
        }}>
          <span>🔗 Linked Table: {table.name}</span>
          <span>Last updated: {new Date(table.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    );
  };

  return (
    <NodeViewWrapper className="tb-embed-node" contentEditable={false}>
      <div style={{ 
        border: '1px solid var(--color-border-light, #e2e8f0)', 
        borderRadius: '8px', 
        padding: '12px',
        margin: '12px 0',
        background: 'var(--color-bg-surface, #fafafa)',
        position: 'relative',
      }}>
        {/* Delete button */}
        <button
          onClick={deleteNode}
          style={{
            position: 'absolute', top: '4px', right: '4px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#94a3b8', fontSize: '14px', padding: '2px 6px',
            borderRadius: '4px',
          }}
          title="Remove embedded table"
          className="print-hidden"
        >
          ×
        </button>

        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
            Loading table…
          </div>
        )}
        {error && (
          <div style={{ padding: '12px', textAlign: 'center', color: '#DC2626', background: '#FEF2F2', borderRadius: '6px' }}>
            ⚠️ {error} (ID: {tableId})
          </div>
        )}
        {!loading && !error && table && renderTable()}
        {!loading && !error && !table && (
          <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
            No table linked. Select a table from the Table Builder.
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ────── TipTap Node Extension ──────

export const TableBuilderEmbedNode = Node.create({
  name: 'tableBuilderEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      tableId: { default: '' },
      caption: { default: '' },
      showFootnotes: { default: true },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="table-builder-embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'table-builder-embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableEmbedView);
  },

  addCommands() {
    return {
      insertTableBuilderEmbed: (tableId: string, caption?: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { tableId, caption: caption || '' },
        });
      },
    } as any;
  },
});
