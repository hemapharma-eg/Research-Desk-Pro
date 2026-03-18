import { useEffect, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import type { Reference } from '../../../types/electron.d';

interface BibliographyProps {
  editorJson: JSONContent;
}

export function Bibliography({ editorJson }: BibliographyProps) {
  const [citedRefs, setCitedRefs] = useState<Reference[]>([]);

  useEffect(() => {
    // 1. recursively find all citation nodes in the tiptap document JSON
    const extractCitationIds = (node: JSONContent): string[] => {
      let ids: string[] = [];
      if (node.type === 'citation' && node.attrs?.id) {
        ids.push(node.attrs.id);
      }
      if (node.content) {
        node.content.forEach(child => {
          ids = ids.concat(extractCitationIds(child));
        });
      }
      return ids;
    };

    const ids = Array.from(new Set(extractCitationIds(editorJson))); // Deduplicate

    // 2. Load the full reference data for these IDs
    const loadBibliography = async () => {
      if (ids.length === 0) {
        setCitedRefs([]);
        return;
      }
      
      const res = await window.api.getReferences();
      if (res.success && res.data) {
        // Filter local DB to only references that were cited
        const bibliography = res.data.filter(ref => ids.includes(ref.id));
        setCitedRefs(bibliography);
      }
    };

    loadBibliography();
  }, [editorJson]);

  // Very basic APA-style formatting placeholder
  const formatReference = (ref: Reference) => {
    const authorStr = ref.authors ? ref.authors.split(',').map((a: string) => a.trim()).join(', ') : 'Unknown Author';
    const yearStr = ref.year ? `(${ref.year})` : '(n.d.)';
    const titleStr = ref.title ? `${ref.title}.` : '';
    const journalStr = ref.journal ? ` *${ref.journal}*` : '';
    return `${authorStr} ${yearStr}. ${titleStr}${journalStr}`;
  };

  if (citedRefs.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginTop: 'var(--space-8)',
      paddingTop: 'var(--space-4)',
      borderTop: '1px solid var(--color-border-strong)',
      color: 'var(--color-text-primary)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>References</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {citedRefs.map(ref => (
          <div key={ref.id} style={{ paddingLeft: '2rem', textIndent: '-2rem' }}>
            {/* Simple italic injection for Journal names */}
            <span dangerouslySetInnerHTML={{ __html: formatReference(ref).replace(/\*(.*?)\*/g, '<i>$1</i>') }} />
          </div>
        ))}
      </div>
    </div>
  );
}
