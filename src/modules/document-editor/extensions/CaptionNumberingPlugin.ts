import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// A generic plugin to auto-number captions
export const CaptionNumberingPlugin = Extension.create({
  name: 'captionNumbering',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('captionNumbering'),
        appendTransaction: (transactions, _oldState, newState) => {
          // Only run if the document actually changed
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return;

          let figureCount = 1;
          let tableCount = 1;
          let footnoteCount = 1;
          let endnoteCount = 1;
          const tr = newState.tr;
          let modified = false;

          // Map to store the correct number for each caption ID
          const captionMap: Record<string, { labelType: string; number: number }> = {};

          // Pass 1: Number the captions and build the map
          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'caption') {
              const attrs = node.attrs;
              let correctNumber = 1;

              if (attrs.labelType === 'Figure') {
                correctNumber = figureCount++;
              } else if (attrs.labelType === 'Table') {
                correctNumber = tableCount++;
              }

              if (attrs.id) {
                captionMap[attrs.id] = { labelType: attrs.labelType, number: correctNumber };
              }

              if (attrs.number !== correctNumber) {
                tr.setNodeMarkup(pos, null, {
                  ...attrs,
                  number: correctNumber,
                });
                modified = true;
              }
            } else if (node.type.name === 'footnote') {
              const correctNumber = footnoteCount++;
              if (node.attrs.number !== correctNumber) {
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  number: correctNumber,
                });
                modified = true;
              }
            } else if (node.type.name === 'endnote') {
              const correctNumber = endnoteCount++;
              if (node.attrs.number !== correctNumber) {
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  number: correctNumber,
                });
                modified = true;
              }
            }
          });

          // Pass 2: Update all cross-references to match their target caption
          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'crossReference') {
              const attrs = node.attrs;
              if (attrs.targetId && captionMap[attrs.targetId]) {
                const target = captionMap[attrs.targetId];
                if (attrs.number !== target.number || attrs.labelType !== target.labelType) {
                  tr.setNodeMarkup(pos, null, {
                    ...attrs,
                    number: target.number,
                    labelType: target.labelType,
                  });
                  modified = true;
                }
              }
            }
          });

          if (modified) {
            tr.setMeta('addToHistory', false); // don't break undo history
            return tr;
          }
          return null;
        },
      }),
    ];
  },
});
