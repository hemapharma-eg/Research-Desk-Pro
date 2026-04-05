import { useEffect, useRef, useState, useMemo } from 'react';
import type { IntegrityFinding } from '../types/IntegrityTypes';

interface Props {
  finding: IntegrityFinding;
  htmlContent?: string;
}

/**
 * DocumentEvidenceViewer — live manuscript preview with highlighted evidence.
 *
 * When htmlContent is available, this component parses the document HTML,
 * identifies the section matching the finding's `document_section`,
 * and renders that section with the `extracted_evidence` text highlighted
 * in-context. The viewer auto-scrolls to the highlighted region.
 */
export function DocumentEvidenceViewer({ finding, htmlContent }: Props) {
  const evidenceRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'section' | 'full'>('section');

  // Parse the HTML and build section-aware chunks
  const { sectionHtml, fullDocHtml } = useMemo(() => {
    if (!htmlContent) return { sectionHtml: '', fullDocHtml: '' };

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Strip base64 images to keep the viewer lightweight
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('data:')) {
        const placeholder = doc.createElement('div');
        placeholder.style.cssText = 'padding:12px;background:var(--color-bg-app);border:1px dashed var(--color-border-light);border-radius:6px;text-align:center;color:var(--color-text-tertiary);font-size:12px;margin:8px 0;';
        placeholder.textContent = '[Image]';
        img.replaceWith(placeholder);
      }
    });

    // Build full doc HTML (for "full" view mode)
    const fullHtml = doc.body.innerHTML;

    // ── Collect ALL block-level elements at any nesting depth ──
    // Mammoth wraps content in divs/sections; we need to flatten to the
    // leaf block-elements (h1-h6, p, ul, ol, table, blockquote, etc.)
    
    // Build an ordered list, preserving document order via TreeWalker
    const seen = new Set<Node>();
    const orderedElements: Element[] = [];
    
    const tw = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    while (tw.nextNode()) {
      const el = tw.currentNode as Element;
      const tag = el.tagName.toLowerCase();
      const isBlock = /^(h[1-6]|p|ul|ol|table|blockquote|pre|dl|figure|figcaption|hr)$/.test(tag);
      if (isBlock && !seen.has(el)) {
        seen.add(el);
        orderedElements.push(el);
      }
    }
    
    // If we didn't collect anything (very stripped HTML), fall back to direct children
    const elements: Element[] = orderedElements.length > 0 ? orderedElements : Array.from(doc.body.children);

    // ── Helper: clean evidence text for matching ──
    // Rule engine wraps abbreviation evidence as "... ABBR ..." — strip that for searching
    const cleanEvidence = (raw: string | null | undefined): string => {
      if (!raw) return '';
      return raw.replace(/^\.{2,}\s*/, '').replace(/\s*\.{2,}$/, '').trim();
    };

    // ── Extract the relevant section based on finding.document_section ──
    let sectionContent = '';
    if (finding.document_section) {
      const sectionName = finding.document_section.toLowerCase().trim();
      
      // Strategy 1: Find actual heading tags
      let sectionStartIdx = -1;
      let sectionEndIdx = elements.length;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const tagName = el.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tagName)) {
          const headingText = (el.textContent || '').toLowerCase().trim();
          const matches = headingText.includes(sectionName) 
            || sectionName.includes(headingText)
            || (headingText.length > 3 && sectionName.length > 3 && (
              headingText.split(/\s+/).some((w: string) => w.length > 3 && sectionName.includes(w))
            ));
          if (matches) {
            sectionStartIdx = i;
            const headingLevel = parseInt(tagName[1], 10);
            for (let j = i + 1; j < elements.length; j++) {
              const nextTag = elements[j].tagName.toLowerCase();
              if (/^h[1-6]$/.test(nextTag)) {
                const nextLevel = parseInt(nextTag[1], 10);
                if (nextLevel <= headingLevel) {
                  sectionEndIdx = j;
                  break;
                }
              }
            }
            break;
          }
        }
      }

      // Strategy 2: If no heading tag matched, look for bold/strong paragraphs
      // (mammoth sometimes renders headings as <p><strong>Title</strong></p>)
      if (sectionStartIdx < 0) {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const strong = el.querySelector('strong, b');
          if (strong && el.tagName.toLowerCase() === 'p') {
            const boldText = (strong.textContent || '').toLowerCase().trim();
            if (boldText.includes(sectionName) || sectionName.includes(boldText)) {
              sectionStartIdx = i;
              // Find end: next bold-only paragraph
              for (let j = i + 1; j < elements.length; j++) {
                const nextEl = elements[j];
                const nextStrong = nextEl.querySelector('strong, b');
                if (nextStrong && nextEl.tagName.toLowerCase() === 'p') {
                  const nextBoldText = (nextStrong.textContent || '').trim();
                  // Check if this looks like a section heading (short, mostly all bold)
                  const elText = (nextEl.textContent || '').trim();
                  if (nextBoldText.length > 3 && nextBoldText.length >= elText.length * 0.7) {
                    sectionEndIdx = j;
                    break;
                  }
                }
              }
              break;
            }
          }
        }
      }

      if (sectionStartIdx >= 0) {
        const sectionElements = elements.slice(sectionStartIdx, sectionEndIdx);
        sectionContent = sectionElements.map((el: Element) => el.outerHTML).join('\n');
      }
    }

    // ── Fallback 1: search for evidence text across ALL elements ──
    if (!sectionContent && finding.extracted_evidence) {
      const cleaned = cleanEvidence(finding.extracted_evidence);
      if (cleaned) {
        const evidenceLower = cleaned.toLowerCase();
        for (let i = 0; i < elements.length; i++) {
          const text = (elements[i].textContent || '').toLowerCase();
          if (text.includes(evidenceLower)) {
            const start = Math.max(0, i - 5);
            const end = Math.min(elements.length, i + 6);
            sectionContent = elements.slice(start, end).map((el: Element) => el.outerHTML).join('\n');
            break;
          }
        }
      }
    }

    // ── Fallback 2: search for the finding's check_name keywords in document ──
    if (!sectionContent && finding.check_name) {
      // For compliance findings (missing IRB, etc.), show the document start as context
      // since there's no matching section — the point is the absence of this content
      if (finding.category === 'compliance') {
        // Show the last part of the document where declarations usually go
        const declarationKeywords = ['declaration', 'disclosure', 'acknowledgment', 'acknowledgement', 'conflict', 'funding', 'ethics', 'availability'];
        let foundDecl = false;
        for (let i = 0; i < elements.length; i++) {
          const text = (elements[i].textContent || '').toLowerCase();
          if (declarationKeywords.some(kw => text.includes(kw))) {
            const start = Math.max(0, i - 2);
            const end = Math.min(elements.length, i + 8);
            sectionContent = elements.slice(start, end).map((el: Element) => el.outerHTML).join('\n');
            foundDecl = true;
            break;
          }
        }
        // If no declaration area found, show the end of the document (where declarations belong)
        if (!foundDecl && elements.length > 8) {
          const start = Math.max(0, elements.length - 10);
          sectionContent = elements.slice(start).map((el: Element) => el.outerHTML).join('\n');
        }
      }
    }

    // ── Last resort fallback: show first few paragraphs ──
    if (!sectionContent) {
      sectionContent = elements.slice(0, Math.min(8, elements.length)).map((el: Element) => el.outerHTML).join('\n');
    }

    return { sectionHtml: sectionContent, fullDocHtml: fullHtml };
  }, [htmlContent, finding.document_section, finding.extracted_evidence, finding.check_name, finding.category]);

  // Highlight the extracted_evidence within the section HTML
  const highlightedHtml = useMemo(() => {
    const sourceHtml = viewMode === 'section' ? sectionHtml : fullDocHtml;
    if (!sourceHtml) return '';
    if (!finding.extracted_evidence) return sourceHtml;

    // Clean the evidence text: strip "... ABBR ..." wrapping from abbreviation findings
    let evidence = finding.extracted_evidence
      .replace(/^\.{2,}\s*/, '')
      .replace(/\s*\.{2,}$/, '')
      .trim();
    if (!evidence) return sourceHtml;
    
    // Escape special regex characters in the evidence text
    const escaped = evidence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // We need to highlight the text while preserving HTML tags
    // Strategy: parse as DOM, walk text nodes, and wrap matches
    const tempDoc = new DOMParser().parseFromString(sourceHtml, 'text/html');
    const walker = document.createTreeWalker(tempDoc.body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    let highlighted = false;
    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      const regex = new RegExp(escaped, 'gi');
      const match = regex.exec(text);
      if (match && !highlighted) {
        // Split the text node around the match
        const beforeText = text.substring(0, match.index);
        const matchText = text.substring(match.index, match.index + match[0].length);
        const afterText = text.substring(match.index + match[0].length);

        const parent = textNode.parentNode;
        if (parent) {
          const frag = document.createDocumentFragment();
          if (beforeText) frag.appendChild(document.createTextNode(beforeText));
          
          const mark = document.createElement('mark');
          mark.setAttribute('data-evidence', 'true');
          mark.style.cssText = 'background: linear-gradient(135deg, rgba(255,152,0,0.25), rgba(255,193,7,0.25)); color: inherit; padding: 2px 4px; border-radius: 3px; border-bottom: 2px solid rgba(255,152,0,0.6); scroll-margin-top: 80px;';
          mark.textContent = matchText;
          frag.appendChild(mark);
          
          if (afterText) frag.appendChild(document.createTextNode(afterText));
          parent.replaceChild(frag, textNode);
          highlighted = true;
        }
      }
    }

    return tempDoc.body.innerHTML;
  }, [sectionHtml, fullDocHtml, finding.extracted_evidence, viewMode]);

  // Auto-scroll to the highlighted evidence when it changes
  useEffect(() => {
    if (evidenceRef.current) {
      const mark = evidenceRef.current.querySelector('mark[data-evidence]');
      if (mark) {
        setTimeout(() => {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [highlightedHtml, finding]);

  // If we have no HTML content at all, show the old minimal view
  if (!htmlContent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-app)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Document Evidence</h3>
        </div>
        
        <div style={{ padding: 'var(--space-4)', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
            Section: <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{finding.document_section || 'Unknown'}</span>
          </div>

          {finding.extracted_evidence ? (
            <div style={{ 
              marginTop: 'var(--space-4)', 
              padding: 'var(--space-4)', 
              backgroundColor: 'var(--color-bg-app)', 
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-family-serif)',
              fontSize: 'var(--font-size-md)',
              lineHeight: 1.6,
              border: '1px solid var(--color-border-light)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <p>
                ... <mark style={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: 'var(--color-text-primary)', padding: '2px 4px', borderRadius: '2px' }}>{finding.extracted_evidence}</mark> ...
              </p>
            </div>
          ) : (
            <div style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <p>No specific text excerpt available for this issue.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full live evidence viewer with section preview
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg-app)' }}>
      {/* Header */}
      <div style={{ 
        padding: 'var(--space-3)', 
        borderBottom: '1px solid var(--color-border-light)', 
        backgroundColor: 'var(--color-bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Document Evidence</h3>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border-light)' }}>
          <button
            onClick={() => setViewMode('section')}
            style={{
              padding: '2px 8px', border: 'none', cursor: 'pointer',
              fontSize: '10px', fontWeight: viewMode === 'section' ? 'bold' : 'normal',
              backgroundColor: viewMode === 'section' ? 'var(--color-accent-primary)' : 'transparent',
              color: viewMode === 'section' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            Section
          </button>
          <button
            onClick={() => setViewMode('full')}
            style={{
              padding: '2px 8px', border: 'none', cursor: 'pointer',
              fontSize: '10px', fontWeight: viewMode === 'full' ? 'bold' : 'normal',
              backgroundColor: viewMode === 'full' ? 'var(--color-accent-primary)' : 'transparent',
              color: viewMode === 'full' ? '#fff' : 'var(--color-text-secondary)',
              borderLeft: '1px solid var(--color-border-light)',
              transition: 'all 0.15s',
            }}
          >
            Full Doc
          </button>
        </div>
      </div>

      {/* Section Info */}
      <div style={{
        padding: 'var(--space-2) var(--space-3)',
        borderBottom: '1px solid var(--color-border-light)',
        backgroundColor: 'rgba(41,98,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        flexShrink: 0,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Section: <strong style={{ color: 'var(--color-text-primary)' }}>{finding.document_section || 'Unidentified'}</strong>
          {finding.extracted_evidence && (
            <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-text-tertiary)' }}>
              • Evidence highlighted
            </span>
          )}
        </span>
      </div>

      {/* Live Document Preview */}
      <div
        ref={evidenceRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
        }}
      >
        {/* Simulated document page */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
          padding: 'var(--space-6) var(--space-5)',
          minHeight: '200px',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: '13px',
          lineHeight: 1.7,
          color: '#1a1a1a',
          position: 'relative',
        }}>
          {/* Content type indicator line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            background: finding.severity === 'error' 
              ? 'linear-gradient(90deg, var(--color-danger), rgba(255,61,113,0.3))'
              : finding.severity === 'warning'
                ? 'linear-gradient(90deg, var(--color-warning), rgba(255,152,0,0.3))'
                : 'linear-gradient(90deg, var(--color-info), rgba(41,98,255,0.3))',
          }} />

          <div
            className="evidence-content"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            style={{ wordBreak: 'break-word' }}
          />

          {/* If no evidence could be highlighted, show a note */}
          {!finding.extracted_evidence && (
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              backgroundColor: 'rgba(41,98,255,0.04)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--color-accent-primary)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-family-sans)',
            }}>
              <strong>Note:</strong> This finding does not reference specific extracted text. The section above shows the detected document area — review it manually for the reported issue.
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: 'var(--space-2) var(--space-3)',
        borderTop: '1px solid var(--color-border-light)',
        backgroundColor: 'var(--color-bg-surface)',
        display: 'flex',
        gap: 'var(--space-2)',
      }}>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1, justifyContent: 'center', fontSize: 'var(--font-size-xs)', padding: '6px' }}
          onClick={() => {
            window.dispatchEvent(new CustomEvent('navigate-to-module', { 
              detail: { 
                module: 'document-editor',
                targetNodeId: finding.location_anchor,
                context: 'integrity-finding'
              } 
            }));
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Open in Editor
        </button>
      </div>

      {/* Styles for the evidence content area */}
      <style>{`
        .evidence-content h1, .evidence-content h2, .evidence-content h3, .evidence-content h4, .evidence-content h5, .evidence-content h6 {
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #1a1a1a;
          margin: 1em 0 0.5em 0;
          line-height: 1.3;
        }
        .evidence-content h1 { font-size: 18px; }
        .evidence-content h2 { font-size: 16px; }
        .evidence-content h3 { font-size: 14px; }
        .evidence-content h4 { font-size: 13px; }
        .evidence-content p {
          margin: 0.5em 0;
        }
        .evidence-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          font-size: 12px;
        }
        .evidence-content th, .evidence-content td {
          border: 1px solid #ddd;
          padding: 4px 8px;
          text-align: left;
        }
        .evidence-content th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        .evidence-content ul, .evidence-content ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .evidence-content li {
          margin: 0.2em 0;
        }
        .evidence-content blockquote {
          margin: 0.5em 0;
          padding-left: 1em;
          border-left: 3px solid #ddd;
          color: #555;
        }
        .evidence-content sup {
          font-size: 0.75em;
        }
        .evidence-content sub {
          font-size: 0.75em;
        }
      `}</style>
    </div>
  );
}
