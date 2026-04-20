import Mention from '@tiptap/extension-mention';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CitationComponent } from '../components/CitationComponent';

export const CitationNode = Mention.extend({
  name: 'citation',

  addNodeView() {
    return ReactNodeViewRenderer(CitationComponent);
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="citation"]',
      },
    ];
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id,
          };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-label': attributes.label,
          };
        },
      },
      // Stores the global citation indices as a JSON string, e.g. "[4,5]"
      // Set by CaptionNumberingPlugin's appendTransaction, so it's always
      // correct before React renders the NodeView.
      citationIndices: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-citation-indices') || '[]',
        renderHTML: attributes => {
          return { 'data-citation-indices': attributes.citationIndices || '[]' };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'citation-badge',
        contenteditable: 'false',
        'data-type': 'citation',
      },
      `(${node.attrs.label})`,
    ];
  },
});
