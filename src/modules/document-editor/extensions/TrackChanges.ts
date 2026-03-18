import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

export interface TrackChangesOptions {}

export const Insertion = Mark.create({
  name: 'insertion',
  parseHTML() { return [{ tag: 'ins' }, { tag: 'span[data-type="insertion"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['ins', mergeAttributes(HTMLAttributes, { class: 'track-insertion', 'data-type': 'insertion' }), 0];
  },
});

export const Deletion = Mark.create({
  name: 'deletion',
  parseHTML() { return [{ tag: 'del' }, { tag: 'span[data-type="deletion"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['del', mergeAttributes(HTMLAttributes, { class: 'track-deletion', 'data-type': 'deletion' }), 0];
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    trackChanges: {
      toggleTrackChanges: () => ReturnType;
      setTrackChanges: (active: boolean) => ReturnType;
      acceptChange: (pos: number) => ReturnType;
      rejectChange: (pos: number) => ReturnType;
    };
  }
}

export const TrackChanges = Extension.create<TrackChangesOptions>({
  name: 'trackChanges',

  addStorage() {
    return {
      isTracking: false,
    };
  },

  addCommands() {
    return {
      toggleTrackChanges: () => ({ editor, tr, dispatch }) => {
        if (dispatch) {
          (editor.storage as any).trackChanges.isTracking = !(editor.storage as any).trackChanges.isTracking;
          tr.setMeta('trackChangesToggle', true);
        }
        return true;
      },
      setTrackChanges: (active: boolean) => ({ editor, tr, dispatch }) => {
        if (dispatch) {
          (editor.storage as any).trackChanges.isTracking = active;
          tr.setMeta('trackChangesToggle', true);
        }
        return true;
      },
      acceptChange: (pos) => ({ state, tr, dispatch }) => {
        const node = state.doc.nodeAt(pos);
        if (!node) return false;
        
        const hasInsertion = node.marks.find(m => m.type.name === 'insertion');
        const hasDeletion = node.marks.find(m => m.type.name === 'deletion');
        
        if (dispatch) {
          if (hasInsertion) {
             tr.removeMark(pos, pos + node.nodeSize, state.schema.marks.insertion);
          } else if (hasDeletion) {
             tr.delete(pos, pos + node.nodeSize);
          }
        }
        return true;
      },
      rejectChange: (pos) => ({ state, tr, dispatch }) => {
        const node = state.doc.nodeAt(pos);
        if (!node) return false;
        
        const hasInsertion = node.marks.find(m => m.type.name === 'insertion');
        const hasDeletion = node.marks.find(m => m.type.name === 'deletion');
        
        if (dispatch) {
          if (hasInsertion) {
             tr.delete(pos, pos + node.nodeSize);
          } else if (hasDeletion) {
             tr.removeMark(pos, pos + node.nodeSize, state.schema.marks.deletion);
          }
        }
        return true;
      }
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        if (!(this.editor.storage as any).trackChanges.isTracking) return false;
        const state = this.editor.state;
        const view = this.editor.view;
        const { selection, tr } = state;
        let { from, to, empty } = selection;

        if (empty) {
          from = Math.max(0, from - 1);
        }
        
        if (from === to) return false;
        
        let hasInsertion = false;
        state.doc.nodesBetween(from, to, (node) => {
          if (node.marks.some(m => m.type.name === 'insertion')) hasInsertion = true;
        });

        if (hasInsertion) {
          return false; // let native delete happen
        }

        tr.addMark(from, to, state.schema.marks.deletion.create());
        tr.setSelection(TextSelection.create(tr.doc, from));
        view.dispatch(tr);
        return true;
      },
      Delete: () => {
        if (!(this.editor.storage as any).trackChanges.isTracking) return false;
        const state = this.editor.state;
        const view = this.editor.view;
        const { selection, tr } = state;
        let { from, to, empty } = selection;

        if (empty) {
          to = Math.min(state.doc.content.size, to + 1);
        }
        
        if (from === to) return false;
        
        let hasInsertion = false;
        state.doc.nodesBetween(from, to, (node) => {
          if (node.marks.some(m => m.type.name === 'insertion')) hasInsertion = true;
        });

        if (hasInsertion) return false;

        tr.addMark(from, to, state.schema.marks.deletion.create());
        tr.setSelection(TextSelection.create(tr.doc, to));
        view.dispatch(tr);
        return true; 
      }
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey('trackChangesInput'),
        props: {
          handleTextInput(view, from, to, text) {
            if (!(editor.storage as any).trackChanges.isTracking) return false;
            
            const tr = view.state.tr;
            let insertPos = from;
            
            if (from !== to) {
              tr.addMark(from, to, view.state.schema.marks.deletion.create());
              insertPos = to;
            }
            
            const insertionMark = view.state.schema.marks.insertion.create();
            tr.insertText(text, insertPos);
            tr.addMark(insertPos, insertPos + text.length, insertionMark);
            
            tr.setSelection(TextSelection.create(tr.doc, insertPos + text.length));
            view.dispatch(tr);
            return true;
          }
        }
      })
    ];
  }
});
