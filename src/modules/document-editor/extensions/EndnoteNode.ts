import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    endnote: {
      insertEndnote: (text: string) => ReturnType;
    };
  }
}

function toRoman(num: number): string {
  const roman: Record<string, number> = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1
  };
  let str = '';
  let n = num;
  for (const i of Object.keys(roman)) {
    const q = Math.floor(n / roman[i]);
    n -= q * roman[i];
    str += i.repeat(q);
  }
  return str.toLowerCase();
}

export const EndnoteNode = Node.create({
  name: 'endnote',
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
        default: 1, // Will be overridden dynamically by CaptionNumberingPlugin
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-type="endnote"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const romanNumber = HTMLAttributes.number ? toRoman(HTMLAttributes.number as number) : 'i';
    return [
      'sup',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'endnote',
        class: 'endnote-marker',
        style: 'color: var(--color-accent-secondary, #10b981); cursor: pointer; text-decoration: underline;',
        title: HTMLAttributes.text,
      }),
      romanNumber,
    ];
  },

  addCommands() {
    return {
      insertEndnote:
        (text: string) =>
        ({ chain, editor }) => {
          const id = Math.random().toString(36).substr(2, 9);
          
          let count = 0;
          editor.state.doc.descendants((node) => {
            if (node.type.name === 'endnote') {
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
