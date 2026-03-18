import { Extension } from '@tiptap/core';

export type IndentOptions = {
  types: string[];
  minIndent: number;
  maxIndent: number;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Increase the indent
       */
      indent: () => ReturnType;
      /**
       * Decrease the indent
       */
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minIndent: 0,
      maxIndent: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const paddingLeft = element.style.paddingLeft;
              if (paddingLeft && paddingLeft.endsWith('rem')) {
                return parseInt(paddingLeft.replace('rem', ''), 10) / 2 || 0; // assuming 2rem per indent block
              }
              return 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {};
              }

              return {
                style: `padding-left: ${attributes.indent * 2}rem`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr = this.options.types.reduce((transaction) => {
          return transaction; // We'll update inline below instead of standard update to handle accumulation
        }, tr);

        let updated = false;

        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent < this.options.maxIndent) {
              tr = tr.setNodeMarkup(pos, node.type, {
                ...node.attrs,
                indent: currentIndent + 1,
              });
              updated = true;
            }
          }
        });

        if (dispatch && updated) {
          dispatch(tr);
        }

        return updated;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);

        let updated = false;

        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent > this.options.minIndent) {
              tr = tr.setNodeMarkup(pos, node.type, {
                ...node.attrs,
                indent: currentIndent - 1,
              });
              updated = true;
            }
          }
        });

        if (dispatch && updated) {
          dispatch(tr);
        }

        return updated;
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});
