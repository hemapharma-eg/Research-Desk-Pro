import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { IndexGeneratorView } from './IndexGeneratorView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indexGenerator: {
      insertIndexGenerator: (indexType: 'toc' | 'lof' | 'lot') => ReturnType;
    };
  }
}

export const IndexGeneratorNode = Node.create({
  name: 'indexGenerator',
  group: 'block',
  atom: true, // Prevents users from typing inside the block directly

  addAttributes() {
    return {
      indexType: {
        default: 'toc', // 'toc', 'lof', 'lot'
      },
      // We will store a serialized snapshot of the items for HTML export/persistence
      items: {
        default: [],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="index-generator"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Basic fallback render for static HTML export
    const title = HTMLAttributes.indexType === 'toc' 
      ? 'Table of Contents' 
      : HTMLAttributes.indexType === 'lof' 
        ? 'List of Figures' 
        : 'List of Tables';

    const itemsHtml = (HTMLAttributes.items || []).map((item: any) => {
       const indent = item.level ? (item.level - 1) * 20 : 0;
       return `<div style="margin-left: ${indent}px; display: flex; justify-content: space-between; margin-bottom: 4px;">
         <span>${item.text}</span>
       </div>`;
    }).join('');

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'index-generator',
        class: 'index-generator-block',
        style: 'border: 1px solid var(--color-border-light); padding: 16px; margin: 16px 0; background: var(--color-bg-app); border-radius: 4px;',
      }),
      ['h3', { style: 'margin-top: 0; font-size: 1.2rem; margin-bottom: 12px;' }, title],
      ['div', { class: 'index-items' }, itemsHtml || 'No entries found.']
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(IndexGeneratorView);
  },

  addCommands() {
    return {
      insertIndexGenerator:
        (indexType: 'toc' | 'lof' | 'lot') =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                indexType,
                items: [],
              },
            })
            .run();
        },
    };
  },
});
