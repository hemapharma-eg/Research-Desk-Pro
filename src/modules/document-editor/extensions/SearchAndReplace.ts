import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchAndReplace: {
      setSearchTerm: (searchTerm: string) => ReturnType;
      nextSearchResult: () => ReturnType;
      prevSearchResult: () => ReturnType;
      replace: (replaceWith: string) => ReturnType;
      replaceAll: (replaceWith: string) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export const SearchAndReplacePluginKey = new PluginKey('searchAndReplace');

export interface SearchAndReplaceStorage {
  searchTerm: string;
  results: { from: number; to: number }[];
  currentIndex: number;
}

export const SearchAndReplace = Extension.create<any, SearchAndReplaceStorage>({
  name: 'searchAndReplace',

  addStorage() {
    return {
      searchTerm: '',
      results: [],
      currentIndex: -1,
    };
  },

  addCommands() {
    return {
      setSearchTerm: (searchTerm: string) => ({ editor, tr }) => {
        (editor.storage as any).searchAndReplace.searchTerm = searchTerm;
        (editor.storage as any).searchAndReplace.currentIndex = 0;
        tr.setMeta(SearchAndReplacePluginKey, { searchTerm });
        return true;
      },
      nextSearchResult: () => ({ editor, tr }) => {
        const { results, currentIndex } = (editor.storage as any).searchAndReplace;
        if (results.length === 0) return false;
        (editor.storage as any).searchAndReplace.currentIndex = (currentIndex + 1) % results.length;
        tr.setMeta(SearchAndReplacePluginKey, { next: true });
        
        // Ensure scroll to position
        const result = results[(editor.storage as any).searchAndReplace.currentIndex];
        if (result) {
            tr.scrollIntoView();
        }
        return true;
      },
      prevSearchResult: () => ({ editor, tr }) => {
        const { results, currentIndex } = (editor.storage as any).searchAndReplace;
        if (results.length === 0) return false;
        (editor.storage as any).searchAndReplace.currentIndex = (currentIndex - 1 + results.length) % results.length;
        tr.setMeta(SearchAndReplacePluginKey, { prev: true });
        return true;
      },
      replace: (replaceWith: string) => ({ editor, tr, dispatch }) => {
        const { results, currentIndex } = (editor.storage as any).searchAndReplace;
        if (results.length === 0 || currentIndex < 0) return false;

        const currentResult = results[currentIndex];
        if (dispatch) {
          tr.insertText(replaceWith, currentResult.from, currentResult.to);
        }
        return true;
      },
      replaceAll: (replaceWith: string) => ({ editor, tr, dispatch }) => {
        const { results } = (editor.storage as any).searchAndReplace;
        if (results.length === 0) return false;

        if (dispatch) {
          // Replace backwards to avoid shifting positions for subsequent replacements
          for (let i = results.length - 1; i >= 0; i--) {
            const { from, to } = results[i];
            tr.insertText(replaceWith, from, to);
          }
        }
        return true;
      },
      clearSearch: () => ({ editor, tr }) => {
        (editor.storage as any).searchAndReplace.searchTerm = '';
        (editor.storage as any).searchAndReplace.results = [];
        (editor.storage as any).searchAndReplace.currentIndex = -1;
        tr.setMeta(SearchAndReplacePluginKey, { clear: true });
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: SearchAndReplacePluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            const meta = tr.getMeta(SearchAndReplacePluginKey);
            const { searchTerm } = (editor.storage as any).searchAndReplace;

            if (meta?.clear) {
              return DecorationSet.empty;
            }

            // Only recalculate if document changed or we explicitly triggered it via meta
            if (!tr.docChanged && !meta) {
               return oldState;
            }

            if (!searchTerm) {
               (editor.storage as any).searchAndReplace.results = [];
               (editor.storage as any).searchAndReplace.currentIndex = -1;
               return DecorationSet.empty;
            }

            const results: { from: number; to: number }[] = [];
            const decorations: Decoration[] = [];

            // Escape special chars in search term
            const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedSearch, 'gi');

            tr.doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                let match;
                while ((match = regex.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = from + match[0].length;
                  results.push({ from, to });
                }
              }
            });

            (editor.storage as any).searchAndReplace.results = results;

            // Ensure currentIndex is valid
            if ((editor.storage as any).searchAndReplace.currentIndex >= results.length) {
                (editor.storage as any).searchAndReplace.currentIndex = results.length > 0 ? 0 : -1;
            }

            results.forEach((result, index) => {
              const isActive = index === (editor.storage as any).searchAndReplace.currentIndex;
              decorations.push(
                Decoration.inline(result.from, result.to, {
                  class: isActive ? 'search-result-active' : 'search-result',
                  style: isActive ? 'background-color: var(--color-accent-primary, #2563eb); color: white;' : 'background-color: rgba(255, 255, 0, 0.4);',
                })
              );
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
