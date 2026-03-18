import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    caption: {
      insertCaption: (labelType: 'Figure' | 'Table') => ReturnType;
    };
  }
}

export const CaptionNode = Node.create({
  name: 'caption',
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      id: {
        default: null,
      },
      labelType: {
        default: 'Figure', // 'Figure' or 'Table'
      },
      number: {
        default: 1,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="caption"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'caption',
        style: 'text-align: center; color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-top: var(--space-2); margin-bottom: var(--space-4); font-style: italic;',
      }),
      ['strong', {}, `${HTMLAttributes.labelType} ${HTMLAttributes.number}: `],
      ['span', 0], // The hole for inline content
    ];
  },

  addCommands() {
    return {
      insertCaption:
        (labelType: 'Figure' | 'Table') =>
        ({ chain }) => {
          // Generate a unique ID (simple random string for now)
          const id = Math.random().toString(36).substr(2, 9);
          
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                id,
                labelType,
                number: 1, // Will be updated by the plugin
              },
            })
            // Move cursor inside the caption
            .focus()
            .run();
        },
    };
  },
});
