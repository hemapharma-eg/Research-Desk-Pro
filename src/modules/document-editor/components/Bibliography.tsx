import { useEffect, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { Cite } from '@citation-js/core';
import { getCitationStyle, onCitationStyleChange } from '../../../utils/citationStyleStore';

interface BibliographyProps {
  editorJson: JSONContent;
  citationStyle?: string;
}

export function Bibliography({ editorJson, citationStyle = 'apa' }: BibliographyProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [activeStyle, setActiveStyle] = useState(getCitationStyle() || citationStyle);

  // Subscribe to global style changes
  useEffect(() => {
    const unsub = onCitationStyleChange((newStyle) => {
      setActiveStyle(newStyle);
    });
    return unsub;
  }, []);

  // Also sync from prop
  useEffect(() => {
    if (citationStyle) setActiveStyle(citationStyle);
  }, [citationStyle]);
  useEffect(() => {
    // 1. recursively find all citation nodes in the tiptap document JSON
    const extractCitationIds = (node: JSONContent): string[] => {
      let ids: string[] = [];
      if (node.type === 'citation' && node.attrs?.id) {
        const nodeIds = node.attrs.id.split(',');
        ids.push(...nodeIds);
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
        setHtmlContent('');
        return;
      }
      
      const res = await window.api.getReferences();
      if (res.success && res.data) {
        // Filter local DB to only references that were cited
        const unsortedBibliography = res.data.filter(ref => ids.includes(ref.id));
        
        // Sort the bibliography exactly by the order of their first appearance in the document (the ids array)
        // This ensures numeric styles (Vancouver, PLOS, etc.) assign numbers chronologically.
        const bibliography = unsortedBibliography.sort((a, b) => {
          return ids.indexOf(a.id) - ids.indexOf(b.id);
        });
        
        try {
          const cslData = bibliography.map(ref => ref.raw_metadata ? JSON.parse(ref.raw_metadata) : null).filter(Boolean);
          
          if (cslData.length > 0) {
            const cite = new Cite(cslData);
            const html = cite.format('bibliography', {
              format: 'html',
              template: activeStyle,
              lang: 'en-US'
            });
            setHtmlContent(html);
          } else {
            setHtmlContent('<p><em>References missing raw metadata.</em></p>');
          }
        } catch (err) {
          console.error("Citation formatting error:", err);
          setHtmlContent('<p><em>Error formatting bibliography.</em></p>');
        }
      }
    };

    loadBibliography();
  }, [editorJson, activeStyle]);

  if (!htmlContent) {
    return null;
  }

  return (
    <div style={{
      marginTop: 'var(--space-8)',
      paddingTop: 'var(--space-4)',
      borderTop: '1px solid var(--color-border-strong)',
      color: 'var(--color-text-primary)'
    }} className="bibliography-container">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>References</h2>
      <style>{`
        .bibliography-container .csl-entry {
          display: block;
          margin-bottom: 12px;
          line-height: 1.5;
          padding-left: 2em;
          text-indent: -2em;
        }
        .bibliography-container .csl-left-margin {
          display: inline-block;
          min-width: 24px;
          text-align: right;
          margin-right: 8px;
          text-indent: 0;
        }
        .bibliography-container .csl-right-inline {
          display: inline;
          text-indent: 0;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
}
