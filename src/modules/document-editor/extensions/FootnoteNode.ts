import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (text: string) => ReturnType;
    };
  }
}

export const FootnoteNode = Node.create({
  name: 'footnote',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      text: {
        default: '',
      },
      number: {
        default: 1, // Will be overridden dynamically on render if we use a plugin, or we just trust the insert order for now.
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-type="footnote"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'footnote',
        class: 'footnote-marker',
        style: 'color: var(--color-accent-primary); cursor: pointer; text-decoration: underline;',
        title: HTMLAttributes.text,
      }),
      String(HTMLAttributes.number || 1),
    ];
  },

  addCommands() {
    return {
      insertFootnote:
        (text: string) =>
        ({ chain, editor }) => {
          const id = Math.random().toString(36).substr(2, 9);
          
          // Count existing footnotes to get the next number
          let count = 0;
          editor.state.doc.descendants((node) => {
            if (node.type.name === 'footnote') {
              count++;
            }
          });

          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                id,
                text,
                number: count + 1,
              },
            })
            .focus()
            .run();
        },
    };
  },
});
