import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import { ResizableImageNode } from './extensions/ResizableImageNode';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontSize } from './extensions/FontSize';
import { LineHeight } from './extensions/LineHeight';
import { Indent } from './extensions/Indent';
import { PageBreak } from './extensions/PageBreak';
import { CaptionNode } from './extensions/CaptionNode';
import { CaptionNumberingPlugin } from './extensions/CaptionNumberingPlugin';
import { CrossReferenceNode } from './extensions/CrossReferenceNode';
import { crossRefSuggestion } from './extensions/crossRefSuggestion';
import { FootnoteNode } from './extensions/FootnoteNode';
import { EndnoteNode } from './extensions/EndnoteNode';
import { CitationNode } from './extensions/CitationNode';
import { MathNode } from './extensions/MathNode';
import { suggestion } from './extensions/suggestion';
import { Bibliography } from './components/Bibliography';
import { FootnoteList } from './components/FootnoteList';
import { EndnoteList } from './components/EndnoteList';
import { DocumentSidebar } from './components/DocumentSidebar';
import { SearchAndReplace } from './extensions/SearchAndReplace';
import { IndexGeneratorNode } from './extensions/IndexGeneratorNode';
import { FindReplacePanel } from './components/FindReplacePanel';
import { AcademicTemplates } from './templates';
import './TipTapStyles.css';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showFootnotePrompt, setShowFootnotePrompt] = useState(false);
  const [showEndnotePrompt, setShowEndnotePrompt] = useState(false);
  const [noteText, setNoteText] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      CharacterCount,
      ResizableImageNode,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      Indent,
      PageBreak,
      MathNode,
      CaptionNode,
      CaptionNumberingPlugin,
      FootnoteNode,
      EndnoteNode,
      IndexGeneratorNode,
      SearchAndReplace,
      CrossReferenceNode.configure({
        suggestion: crossRefSuggestion,
      }),
      CitationNode.configure({
        HTMLAttributes: {
          class: 'citation-badge',
        },
        suggestion,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes into the editor when loading a new document
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Fix: Strictly check for Cmd/Ctrl + F ignoring case
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div 
        className="editor-toolbar" 
        style={{ 
          display: 'flex', 
          gap: 'var(--space-2)', 
          padding: 'var(--space-2) 0', 
          borderBottom: '1px solid var(--color-border-light)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {/* Font Family */}
        <select
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)' }}
        >
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Garamond">Garamond</option>
          <option value="Palatino">Palatino</option>
          <option value="Book Antiqua">Book Antiqua</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Verdana">Verdana</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
          <option value="Impact">Impact</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
          <option value="Courier New">Courier New</option>
          <option value="monospace">Monospace</option>
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          value={editor.getAttributes('textStyle').fontSize || '16px'}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)' }}
        >
          <option value="12px">12pt</option>
          <option value="14px">14pt</option>
          <option value="16px">16pt (Default)</option>
          <option value="18px">18pt</option>
          <option value="20px">20pt</option>
          <option value="24px">24pt</option>
        </select>
        
        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>

        {/* Templates */}
        <select
          value=""
          onChange={(e) => {
            const val = e.target.value as keyof typeof AcademicTemplates;
            if (val) {
              if (window.confirm('Loading a template will replace your current document. Continue?')) {
                editor.commands.setContent(AcademicTemplates[val]);
              }
            }
          }}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-primary)', color: 'var(--color-accent-primary)', cursor: 'pointer', background: 'var(--color-bg-app)', fontWeight: 'bold' }}
        >
          <option value="" disabled>Load Template...</option>
          <option value="journalManuscript">Journal Manuscript</option>
          <option value="thesis">Thesis / Dissertation</option>
          <option value="systematicReview">Systematic Review (PRISMA)</option>
          <option value="protocol">Clinical Protocol</option>
        </select>

        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('bold') ? 'var(--color-bg-hover)' : 'transparent', fontWeight: 'bold' }}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('italic') ? 'var(--color-bg-hover)' : 'transparent', fontStyle: 'italic' }}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('strike') ? 'var(--color-bg-hover)' : 'transparent', textDecoration: 'line-through' }}
        >
          S
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('underline') ? 'var(--color-bg-hover)' : 'transparent', textDecoration: 'underline' }}
        >
          U
        </button>
        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        <select
          value={editor.isActive('heading') ? `h${editor.getAttributes('heading').level}` : 'p'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = parseInt(val.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)' }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('bulletList') ? 'var(--color-bg-hover)' : 'transparent' }}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('orderedList') ? 'var(--color-bg-hover)' : 'transparent' }}
        >
          1. List
        </button>
        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive({ textAlign: 'left' }) ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Align Left"
        >
          Left
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive({ textAlign: 'center' }) ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Align Center"
        >
          Center
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive({ textAlign: 'right' }) ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Align Right"
        >
          Right
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive({ textAlign: 'justify' }) ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Justify"
        >
          Justify
        </button>
        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        
        {/* Spacing & Indents */}
        <select
          onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()}
          title="Line Spacing"
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)' }}
        >
          <option value="1">Single Spacing</option>
          <option value="1.15">1.15 Spacing</option>
          <option value="1.5">1.5 Spacing</option>
          <option value="2">Double Spacing</option>
        </select>

        <button
          onClick={() => editor.chain().focus().outdent().run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Decrease Indent"
        >
          ⇤
        </button>
        <button
          onClick={() => editor.chain().focus().indent().run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Increase Indent"
        >
          ⇥
        </button>

        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        <button
          onClick={async () => {
            try {
               const imageData = await (window as any).api.openImageDialog();
               if (imageData) {
                 editor.chain().focus().setImage({ src: imageData }).run();
               }
            } catch (err) {
               console.error("Failed to insert image:", err);
            }
          }}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Insert Image (Local)"
        >
          🖼 Image
        </button>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Insert Table"
        >
          📊 Table
        </button>
        <button
          onClick={() => editor.chain().focus().insertContent('<div data-type="math-block"></div>').run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent', fontWeight: 'bold' }}
          title="Insert Equation (LaTeX)"
        >
          ∑ Math
        </button>
        <button
          onClick={() => editor.chain().focus().setPageBreak().run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Insert Page Break"
        >
          📄 Page Break
        </button>
        <button
          onClick={() => {
             setNoteText('');
             setShowFootnotePrompt(true);
          }}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showFootnotePrompt ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Insert Footnote"
        >
          📌 Footnote
        </button>
        <button
          onClick={() => {
             setNoteText('');
             setShowEndnotePrompt(true);
          }}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showEndnotePrompt ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Insert Endnote"
        >
          📎 Endnote
        </button>
        <button
          onClick={() => editor.chain().focus().insertCaption('Figure').run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Insert Figure Caption"
        >
          🖼 Fig. Caption
        </button>
        <button
          onClick={() => editor.chain().focus().insertCaption('Table').run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Insert Table Caption"
        >
          📊 Tab. Caption
        </button>
        {editor.isActive('table') && (
          <div style={{ display: 'flex', gap: 'var(--space-1)', marginLeft: 'var(--space-2)' }}>
            <button
              onClick={() => editor.chain().focus().addRowAfter().run()}
              style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
            >
              + Row
            </button>
            <button
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
            >
              + Col
            </button>
            <button
              onClick={() => editor.chain().focus().deleteTable().run()}
              style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger)', cursor: 'pointer', background: 'var(--color-bg-hover)', color: 'var(--color-danger)' }}
            >
              Del Table
            </button>
          </div>
        )}

        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        
        {/* Index Generators */}
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          <button
            onClick={() => editor.chain().focus().insertIndexGenerator('toc').run()}
            style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)', fontSize: '12px' }}
            title="Generate Table of Contents"
          >
            📑 TOC
          </button>
          <button
            onClick={() => editor.chain().focus().insertIndexGenerator('lof').run()}
            style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)', fontSize: '12px' }}
            title="Generate List of Figures"
          >
            🖼 LOF
          </button>
          <button
            onClick={() => editor.chain().focus().insertIndexGenerator('lot').run()}
            style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)', fontSize: '12px' }}
            title="Generate List of Tables"
          >
            📊 LOT
          </button>
        </div>

        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        <button
          onClick={() => setShowFindReplace(true)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showFindReplace ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Find and Replace (Cmd+F)"
        >
          🔍 Find
        </button>
      </div>

      <div style={{ position: 'relative', display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showFindReplace && (
          <FindReplacePanel editor={editor} onClose={() => setShowFindReplace(false)} />
        )}
        
        {(showFootnotePrompt || showEndnotePrompt) && (
          <div style={{
            position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
            display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '300px'
          }}>
            <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
              Insert {showFootnotePrompt ? 'Footnote' : 'Endnote'}
            </h4>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter note text..."
              style={{
                 width: '100%', minHeight: '80px', padding: '8px', fontSize: '14px', borderRadius: '4px',
                 border: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-input)', resize: 'vertical', boxSizing: 'border-box'
              }}
              onKeyDown={(e) => {
                 e.stopPropagation(); // Prevent global shortcuts like Find/Replace from triggering
                 if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    try {
                        if (noteText.trim()) {
                           if (showFootnotePrompt) editor.chain().focus().insertFootnote(noteText.trim()).run();
                           if (showEndnotePrompt) editor.chain().focus().insertEndnote(noteText.trim()).run();
                        }
                    } catch (err) {
                        console.error('Note insertion failed', err);
                    } finally {
                        setShowFootnotePrompt(false);
                        setShowEndnotePrompt(false);
                    }
                 }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => { setShowFootnotePrompt(false); setShowEndnotePrompt(false); }}
                style={{ padding: '6px 12px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--color-border-light)', borderRadius: '4px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                    try {
                        if (noteText.trim()) {
                           if (showFootnotePrompt) editor.chain().focus().insertFootnote(noteText.trim()).run();
                           if (showEndnotePrompt) editor.chain().focus().insertEndnote(noteText.trim()).run();
                        }
                    } catch (err) {
                        console.error('Note insertion failed', err);
                    } finally {
                        setShowFootnotePrompt(false);
                        setShowEndnotePrompt(false);
                    }
                }}
                style={{ padding: '6px 12px', cursor: 'pointer', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Insert
              </button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--space-8)' }}>
          <EditorContent editor={editor} className="tiptap-content-wrapper" />
          <FootnoteList editorJson={editor.getJSON()} />
          <EndnoteList editorJson={editor.getJSON()} />
          <Bibliography editorJson={editor.getJSON()} />
        </div>
        
        <DocumentSidebar editor={editor} />
      </div>

      <div style={{ 
        padding: 'var(--space-2) var(--space-4)', 
        borderTop: '1px solid var(--color-border-light)', 
        fontSize: 'var(--font-size-sm)', 
        color: 'var(--color-text-tertiary)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-sidebar)'
      }}>
        <span>{editor.storage.characterCount.words()} words</span>
        <span>{editor.storage.characterCount.characters()} characters</span>
      </div>
    </div>
  );
}
