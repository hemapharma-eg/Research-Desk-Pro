import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ResizableImageComponent = (props: any) => {
  return (
    <NodeViewWrapper style={{ 
      display: 'block', 
      textAlign: props.node.attrs.textAlign || 'left',
      margin: 'var(--space-4) 0' 
    }}>
      <div style={{ display: 'inline-block', position: 'relative', width: props.node.attrs.width || '100%', maxWidth: '100%' }}>
        <img 
          src={props.node.attrs.src} 
          alt={props.node.attrs.alt} 
          style={{ 
             width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-sm)', 
             outline: props.selected ? '3px solid var(--color-accent-primary)' : 'none',
             outlineOffset: '2px'
          }} 
        />
        {props.editor.isEditable && (
            <div 
               onMouseDown={(e) => {
                   e.preventDefault();
                   const startX = e.pageX;
                   const startWidth = (e.currentTarget.parentElement as HTMLElement).offsetWidth;
                   const onMouseMove = (moveEvent: MouseEvent) => {
                       const newWidth = startWidth + (moveEvent.pageX - startX);
                       props.updateAttributes({ width: `${Math.max(100, newWidth)}px` });
                   };
                   const onMouseUp = () => {
                       document.removeEventListener('mousemove', onMouseMove);
                       document.removeEventListener('mouseup', onMouseUp);
                   };
                   document.addEventListener('mousemove', onMouseMove);
                   document.addEventListener('mouseup', onMouseUp);
               }}
               style={{
                  position: 'absolute', right: '-8px', bottom: '-8px', width: '16px', height: '16px',
                  background: 'var(--color-accent-primary)', cursor: 'nwse-resize', borderRadius: '50%',
                  opacity: props.selected ? 1 : 0, transition: 'opacity 0.2s', zIndex: 10,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
               }} 
            />
        )}
      </div>
    </NodeViewWrapper>
  );
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: { src: string, alt?: string, width?: string }) => ReturnType,
    }
  }
}

export const ResizableImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: '100%' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { style: `width: ${HTMLAttributes.width}; max-width: 100%;` })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    }
  },
});
