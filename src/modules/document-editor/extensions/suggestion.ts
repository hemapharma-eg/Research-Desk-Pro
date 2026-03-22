import tippy, { type Instance as TippyInstance } from 'tippy.js';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { CitationList } from '../components/CitationList';
import { ReactRenderer as RR } from '@tiptap/react';

export const suggestion: Omit<SuggestionOptions, 'editor'> = {
  char: '@',
  
  items: async ({ query }) => {
    // Fetch from sqlite DB via IPC
    const res = await window.api.getReferences();
    if (!res.success || !res.data) return [];
    
    const references = res.data;
    
    // Simple filter by author or title
    return references
      .filter(item => 
        item.authors?.toLowerCase().includes(query.toLowerCase()) ||
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.year?.includes(query)
      )
      .slice(0, 100) // Increase limit to essentially show all imported references
      .map(ref => ({
        id: ref.id,
        label: `${ref.authors?.split(',')[0]} et al., ${ref.year}`,
        fullRef: ref // Store full details for the popup
      }));
  },

  render: () => {
    let component: RR;
    let popup: TippyInstance[];

    return {
      onStart: props => {
        component = new RR(CitationList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (component.ref as any)?.onKeyDown(props) || false;
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
