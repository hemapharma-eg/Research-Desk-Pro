/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance, type Props } from 'tippy.js';
import { CrossRefList } from '../components/CrossRefList';
import type { Editor } from '@tiptap/core';

export interface CrossRefItem {
  id: string;
  labelType: string;
  number: number;
  text: string;
}

export const crossRefSuggestion = {
  char: '#',
  
  items: ({ query, editor }: { query: string; editor: Editor }) => {
    // Extract all captions from the editor's current state
    const items: CrossRefItem[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'caption') {
        items.push({
          id: node.attrs.id,
          labelType: node.attrs.labelType,
          number: node.attrs.number,
          text: node.textContent || 'No description',
        });
      }
    });

    // Filter by user query
    return items.filter(item => {
      const fullLabel = `${item.labelType} ${item.number} ${item.text}`.toLowerCase();
      return fullLabel.includes(query.toLowerCase());
    }).slice(0, 10);
  },

  render: () => {
    let component: ReactRenderer;
    let popup: Instance<Props>[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CrossRefList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return (component.ref as any)?.onKeyDown(props);
      },

      onExit() {
        if (popup && popup.length > 0) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};
