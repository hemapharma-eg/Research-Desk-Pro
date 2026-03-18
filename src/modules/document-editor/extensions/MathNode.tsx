/* eslint-disable react-refresh/only-export-components */
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MathComponent = (props: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const latex = props.node.attrs.latex || '\\int_{0}^{\\infty} x^2 dx';

  const renderMath = () => {
    try {
      return { __html: katex.renderToString(latex, { throwOnError: false, displayMode: true }) };
    } catch (e: unknown) {
      const errMessage = e instanceof Error ? e.message : String(e);
      return { __html: `<span style="color:var(--color-danger)">Syntax Error: ${errMessage}</span>` };
    }
  };

  return (
    <NodeViewWrapper className="math-node-wrapper" style={{ margin: 'var(--space-4) 0' }}>
      {isEditing ? (
        <div style={{
          padding: 'var(--space-3)',
          border: '1px solid var(--color-accent-primary)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-sidebar)'
        }}>
          <div style={{
             display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap'
          }}>
             {[
               { label: 'Fraction', tex: '\\frac{a}{b}' },
               { label: 'Square Root', tex: '\\sqrt{x}' },
               { label: 'Summation', tex: '\\sum_{i=1}^{n}' },
               { label: 'Integral', tex: '\\int_{a}^{b}' },
               { label: 'α', tex: '\\alpha' },
               { label: 'β', tex: '\\beta' },
               { label: 'π', tex: '\\pi' },
               { label: '±', tex: '\\pm' },
               { label: '∞', tex: '\\infty' },
               { label: '≈', tex: '\\approx' },
             ].map(btn => (
               <button
                  key={btn.label}
                  onClick={() => props.updateAttributes({ latex: latex + ' ' + btn.tex })}
                  style={{
                     padding: '4px 8px', fontSize: '12px', cursor: 'pointer',
                     background: 'var(--color-bg-app)', border: '1px solid var(--color-border-light)', borderRadius: '4px'
                  }}
                  title={`Insert ${btn.label}`}
               >
                 {btn.label}
               </button>
             ))}
          </div>

          <textarea
            value={latex}
            onChange={(e) => props.updateAttributes({ latex: e.target.value })}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              minHeight: '80px',
              padding: 'var(--space-2)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-2)'
            }}
            placeholder="Enter equation in LaTeX format..."
          />
          
          <div style={{
             padding: '8px',
             backgroundColor: 'var(--color-bg-app)',
             border: '1px dashed var(--color-border-light)',
             borderRadius: '4px',
             marginBottom: '12px',
             minHeight: '40px',
             display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             <span dangerouslySetInnerHTML={renderMath()} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: 'var(--space-1) var(--space-4)',
                backgroundColor: 'var(--color-accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Done Editing
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          style={{
            padding: 'var(--space-4)',
            cursor: 'pointer',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-app)',
            border: '1px dashed var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Click to edit Equation"
          dangerouslySetInnerHTML={renderMath()}
        />
      )}
    </NodeViewWrapper>
  );
};

export const MathNode = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: 'E = mc^2',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },
});
