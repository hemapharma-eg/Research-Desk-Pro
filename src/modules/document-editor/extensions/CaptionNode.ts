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

  renderHTML({ node, HTMLAttributes }) {
    const labelType = node.attrs.labelType || 'Figure';
    const number = node.attrs.number || 1;
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'caption',
        'data-label': `${labelType} ${number}: `,
        class: 'tiptap-caption',
      }),
      0, // Directly output the content hole without strong/span wrappers
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
