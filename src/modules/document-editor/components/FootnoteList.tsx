/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';

interface FootnoteItem {
  id: string;
  number: number;
  text: string;
}

interface FootnoteListProps {
  editorJson: any; // The JSON state of the TipTap editor
}

export function FootnoteList({ editorJson }: FootnoteListProps) {
  const footnotes = useMemo(() => {
    if (!editorJson) return [];

    const extracted: FootnoteItem[] = [];

    // Recursive function to traverse TipTap JSON
    const traverse = (node: any) => {
      if (node.type === 'footnote' && node.attrs) {
        extracted.push({
          id: node.attrs.id,
          number: node.attrs.number,
          text: node.attrs.text,
        });
      }

      if (node.content && Array.isArray(node.content)) {
        node.content.forEach((child: any) => traverse(child));
      }
    };

    traverse(editorJson);
    
    // Sort by number just in case
    extracted.sort((a, b) => a.number - b.number);
    return extracted;
  }, [editorJson]);

  if (footnotes.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)' }}>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>Footnotes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {footnotes.map((fn, i) => (
          <div key={fn.id || i} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>{fn.number}.</span>
            <span>{fn.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
