import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (commentId: string) => ReturnType;
      unsetComment: (commentId: string) => ReturnType;
      unsetAllComments: () => ReturnType;
    };
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'comment-highlight',
      },
    };
  },

  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {};
          }

          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setComment: (commentId: string) => ({ commands }) => {
        return commands.setMark(this.name, { commentId });
      },
      unsetComment: (commentId: string) => ({ tr, dispatch }) => {
        if (!dispatch) {
          return true;
        }

        const { doc } = tr;
        const markType = this.type;

        doc.descendants((node, pos) => {
          if (!node.isText) return;

          const hasMark = node.marks.find(
            mark => mark.type === markType && mark.attrs.commentId === commentId
          );

          if (hasMark) {
             const from = pos;
             const to = pos + node.nodeSize;
             tr.removeMark(from, to, markType);
          }
        });

        return true;
      },
      unsetAllComments: () => ({ tr, dispatch }) => {
        if (dispatch) {
           const markType = this.type;
           tr.doc.descendants((node, pos) => {
             if (node.isText && node.marks.some(m => m.type === markType)) {
               tr.removeMark(pos, pos + node.nodeSize, markType);
             }
           });
        }
        return true;
      }
    };
  },
});
