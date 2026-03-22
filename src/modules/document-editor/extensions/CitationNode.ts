import Mention from '@tiptap/extension-mention';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CitationComponent } from '../components/CitationComponent';

export const CitationNode = Mention.extend({
  name: 'citation',

  addNodeView() {
    return ReactNodeViewRenderer(CitationComponent);
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
