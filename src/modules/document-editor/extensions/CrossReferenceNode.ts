import Mention from '@tiptap/extension-mention';

export const CrossReferenceNode = Mention.extend({
  name: 'crossReference',

  addAttributes() {
    return {
      targetId: {
        default: null,
        parseHTML: element => element.getAttribute('data-target-id'),
        renderHTML: attributes => {
          if (!attributes.targetId) return {};
          return { 'data-target-id': attributes.targetId };
        },
      },
      labelType: {
        default: 'Figure',
        parseHTML: element => element.getAttribute('data-label-type'),
        renderHTML: attributes => {
          if (!attributes.labelType) return {};
          return { 'data-label-type': attributes.labelType };
        },
      },
      number: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-number') || '1', 10),
        renderHTML: attributes => {
          if (!attributes.number) return {};
          return { 'data-number': attributes.number };
        },
      },
      id: {
        default: null,
      }
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'cross-reference-badge',
        'data-type': 'cross-reference',
        contenteditable: 'false',
        style: 'color: var(--color-accent-primary); font-weight: 500; cursor: pointer; text-decoration: underline;',
        title: 'Cross-reference',
      },
      `${node.attrs.labelType} ${node.attrs.number}`,
    ];
  },
});
