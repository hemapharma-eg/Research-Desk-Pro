/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';

interface EndnoteItem {
  id: string;
  number: number;
  text: string;
}

interface EndnoteListProps {
  editorJson: any; // The JSON state of the TipTap editor
}

function toRoman(num: number): string {
  const roman: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  let str = '';
  let n = num;
  for (const i of Object.keys(roman)) {
    const q = Math.floor(n / roman[i]);
    n -= q * roman[i];
    str += i.repeat(q);
  }
  return str.toLowerCase();
}

export function EndnoteList({ editorJson }: EndnoteListProps) {
  const endnotes = useMemo(() => {
    if (!editorJson) return [];

    const extracted: EndnoteItem[] = [];

    const traverse = (node: any) => {
      if (node.type === 'endnote' && node.attrs) {
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
    
    extracted.sort((a, b) => a.number - b.number);
    return extracted;
  }, [editorJson]);

  if (endnotes.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)' }}>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>Endnotes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {endnotes.map((en, i) => (
          <div key={en.id || i} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: '500', color: 'var(--color-text-primary)', minWidth: '20px' }}>{toRoman(en.number)}.</span>
            <span>{en.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
