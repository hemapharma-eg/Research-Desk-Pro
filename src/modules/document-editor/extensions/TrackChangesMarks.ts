import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertion: {
      setInsertion: () => ReturnType;
      unsetInsertion: () => ReturnType;
      toggleInsertion: () => ReturnType;
    };
    deletion: {
      setDeletion: () => ReturnType;
      unsetDeletion: () => ReturnType;
      toggleDeletion: () => ReturnType;
    };
  }
}

export const InsertionMark = Mark.create({
  name: 'insertion',
  parseHTML() { return [{ tag: 'ins' }, { tag: 'span[data-type="insertion"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['ins', mergeAttributes(HTMLAttributes, { class: 'track-insertion', 'data-type': 'insertion' }), 0];
  },
  addCommands() {
    return {
      setInsertion: () => ({ commands }) => commands.setMark(this.name),
      unsetInsertion: () => ({ commands }) => commands.unsetMark(this.name),
      toggleInsertion: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },
});

export const DeletionMark = Mark.create({
  name: 'deletion',
  parseHTML() { return [{ tag: 'del' }, { tag: 'span[data-type="deletion"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['del', mergeAttributes(HTMLAttributes, { class: 'track-deletion', 'data-type': 'deletion' }), 0];
  },
  addCommands() {
    return {
      setDeletion: () => ({ commands }) => commands.setMark(this.name),
      unsetDeletion: () => ({ commands }) => commands.unsetMark(this.name),
      toggleDeletion: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },
});
