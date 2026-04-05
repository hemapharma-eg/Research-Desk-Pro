import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DocumentPagination } from './extensions/DocumentPagination';
import { CommentMark } from './extensions/CommentMark';
import { TrackChanges, Insertion, Deletion } from './extensions/TrackChanges';
import { TrackChangesSidebar } from './components/TrackChangesSidebar';
import { CommentSidebar, type CommentThread } from './components/CommentSidebar';
import { useEffect, useState, useRef } from 'react';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
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
import { GraphNode } from './extensions/GraphNode';
import { MathNode } from './extensions/MathNode';
import { TableBuilderEmbedNode } from './extensions/TableBuilderEmbedNode';
import { suggestion } from './extensions/suggestion';
import { Bibliography } from './components/Bibliography';
import { FootnoteList } from './components/FootnoteList';
import { EndnoteList } from './components/EndnoteList';
import { DocumentSidebar } from './components/DocumentSidebar';
import { LinkedObjectsPanel } from './components/LinkedObjectsPanel';
import { SearchAndReplace } from './extensions/SearchAndReplace';
import { IndexGeneratorNode } from './extensions/IndexGeneratorNode';
import { FindReplacePanel } from './components/FindReplacePanel';
import { PaginationPanel } from './components/PaginationPanel';
import { CitationPreferences } from './components/CitationPreferences';
import { InsertFigureModal } from './components/InsertFigureModal';
import { AcademicTemplates } from './templates';
import { useLicense } from '../licensing/LicenseContext';
import { DemoLimitDialog } from '../licensing/components/DemoLimitDialog';
import './TipTapStyles.css';

interface TipTapEditorProps {
  documentTitle: string;
  content: string;
  onChange: (html: string) => void;
  documentId?: string | null;
}

export function TipTapEditor({ documentTitle, content, onChange, documentId }: TipTapEditorProps) {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showFootnotePrompt, setShowFootnotePrompt] = useState(false);
  const [showEndnotePrompt, setShowEndnotePrompt] = useState(false);
  const [showPaginationPanel, setShowPaginationPanel] = useState(false);
  const [showCitationPrefs, setShowCitationPrefs] = useState(false);
  const [showFigureModal, setShowFigureModal] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showTrackChanges, setShowTrackChanges] = useState(false);
  const [showLinkedObjects, setShowLinkedObjects] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const { entitlements, trackUsage } = useLicense();
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const [pageSettings, setPageSettings] = useState({
    headerText: '',
    footerText: '',
    pageNumberPosition: 'none',
    citationStyle: 'apa'
  });
  const pageSettingsRef = useRef(pageSettings);
  pageSettingsRef.current = pageSettings;

  const [comments, setComments] = useState<CommentThread[]>([]);
  const commentsRef = useRef(comments);
  commentsRef.current = comments;

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      DocumentPagination,
      CommentMark,
      TrackChanges,
      Insertion,
      Deletion,
      PageBreak,
      StarterKit.configure({
        document: false, // We're using our custom DocumentPagination instead
      }),
      Underline,
      Superscript,
      Subscript,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image', 'graphBlock'] }),
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
      PageBreak, // Moved PageBreak here
      MathNode,
      CaptionNode,
      CaptionNumberingPlugin,
      FootnoteNode,
      EndnoteNode,
      IndexGeneratorNode,
      GraphNode,
      CrossReferenceNode.configure({
        suggestion: crossRefSuggestion,
      }),
      SearchAndReplace,
      TableBuilderEmbedNode,
      CitationNode.configure({
        HTMLAttributes: {
          class: 'citation-badge',
        },
        suggestion,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const settingsStr = JSON.stringify(pageSettingsRef.current).replace(/"/g, '&quot;');
      const commentsStr = JSON.stringify(commentsRef.current).replace(/"/g, '&quot;');
      onChange(html + `<div id="page-settings" data-settings="${settingsStr}"></div><div id="comment-settings" data-comments="${commentsStr}"></div>`);
    },
    onSelectionUpdate: ({ editor }) => {
      // Find comment ID in current selection
      const isActive = editor.isActive('comment');
      if (isActive) {
        const attrs = editor.getAttributes('comment');
        if (attrs.commentId) {
          setActiveCommentId(attrs.commentId);
          setShowComments(true);
          return;
        }
      }
      setActiveCommentId(null);
    }
  });

  // Sync external content changes into the editor when loading a new document
  useEffect(() => {
    if (editor && content) {
      // Extract page settings
      const matchSettings = content.match(/<div id="page-settings" data-settings="([^"]+)"><\/div>/);
      // Extract comment settings
      const matchComments = content.match(/<div id="comment-settings" data-comments="([^"]+)"><\/div>/);
      
      let cleanContent = content;
      
      if (matchSettings) {
        try {
          const parsed = JSON.parse(matchSettings[1].replace(/&quot;/g, '"'));
          setPageSettings(parsed);
          pageSettingsRef.current = parsed;
          cleanContent = cleanContent.replace(matchSettings[0], '');
        } catch(e) {}
      }

      if (matchComments) {
        try {
          const parsedStr = matchComments[1].replace(/&quot;/g, '"')
          const parsed = JSON.parse(parsedStr);
          setComments(parsed);
          commentsRef.current = parsed;
          cleanContent = cleanContent.replace(matchComments[0], '');
        } catch(e) {}
      }
      
      if (cleanContent !== editor.getHTML()) {
        editor.commands.setContent(cleanContent);
      }
    }
  }, [content, editor]);

  const saveToHTMLWithMeta = (opts: { newSettings?: any, newComments?: CommentThread[] } = {}) => {
    if (!editor) return;
    const html = editor.getHTML();
    const settings = opts.newSettings || pageSettings;
    const comms = opts.newComments || comments;
    const settingsStr = JSON.stringify(settings).replace(/"/g, '&quot;');
    const commentsStr = JSON.stringify(comms).replace(/"/g, '&quot;');
    onChange(html + `<div id="page-settings" data-settings="${settingsStr}"></div><div id="comment-settings" data-comments="${commentsStr}"></div>`);
  };

  const handlePageSettingsChange = (key: string, value: string) => {
    const newSettings = { ...pageSettings, [key]: value };
    setPageSettings(newSettings);
    saveToHTMLWithMeta({ newSettings });
  };

  const handleAddComment = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert("Please select some text to attach a comment to.");
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to, ' ').substring(0, 100);
    const id = Math.random().toString(36).substr(2, 9);
    editor.chain().focus().setComment(id).run();

    const newComments = [...comments, {
      id,
      selectedText,
      author: 'Current User', // Placeholder for actual user system
      text: '',
      createdAt: new Date().toISOString(),
      replies: [],
      resolved: false
    }];
    setComments(newComments);
    setActiveCommentId(id);
    setShowComments(true);
    saveToHTMLWithMeta({ newComments });
  };

  const setCommentText = (id: string, text: string) => {
    const newComments = comments.map(c => c.id === id ? { ...c, text } : c);
    setComments(newComments);
    saveToHTMLWithMeta({ newComments });
  };

  const addCommentReply = (id: string, text: string) => {
    const newComments = comments.map(c => c.id === id ? {
      ...c,
      replies: [...c.replies, { id: Math.random().toString(36).substr(2, 9), author: 'Current User', text, createdAt: new Date().toISOString() }]
    } : c);
    setComments(newComments);
    saveToHTMLWithMeta({ newComments });
  };

  const resolveComment = (id: string) => {
    const newComments = comments.map(c => c.id === id ? { ...c, resolved: true } : c);
    setComments(newComments);
    saveToHTMLWithMeta({ newComments });
    if (editor) editor.chain().focus().unsetComment(id).run();
  };

  const deleteComment = (id: string) => {
    const newComments = comments.filter(c => c.id !== id);
    setComments(newComments);
    saveToHTMLWithMeta({ newComments });
    if (editor) editor.chain().focus().unsetComment(id).run();
  };

  const highlightCommentInEditor = (id: string) => {
    setActiveCommentId(id);
    // Add visual feedback to active comment via CSS
    if (!editor) return;
    const tiptapContainer = document.querySelector('.tiptap');
    if (!tiptapContainer) return;
    
    // Clear old active classes
    tiptapContainer.querySelectorAll('.comment-highlight').forEach(el => el.classList.remove('active-comment'));
    
    // Add active class to new
    const elements = tiptapContainer.querySelectorAll(`.comment-highlight[data-comment-id="${id}"]`);
    elements.forEach(el => el.classList.add('active-comment'));
    if (elements.length > 0) {
      elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Fix: Strictly check for Cmd/Ctrl + F ignoring case
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
    };

    const handleInsertGraph = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.type === 'image' && customEvent.detail.src && editor) {
        editor.chain().focus().setImage({ src: customEvent.detail.src, alt: customEvent.detail.caption, width: '600px' }).run();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('insert-graph-object', handleInsertGraph);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('insert-graph-object', handleInsertGraph);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleExportDocx = async () => {
    if (!editor) return;
    try {
      let exportHtml = editor.getHTML();
      if (!entitlements.canExportWithoutWatermark) {
        exportHtml += '<br/><hr/><p style="color: gray; text-align: center;"><i>Created with Research Desk Pro (Demo Version)</i></p>';
      }

      const result = await window.api.exportDocx(exportHtml, documentTitle || 'Document');
      trackUsage('documents_exported');
      
      if (result && result.success) {
        if (!entitlements.canExportWithoutWatermark) {
          setShowLimitDialog(true);
        }
      } else if (result && !result.canceled) {
        alert('Failed to export DOCX: ' + result.error);
      }
    } catch (e: any) {
      console.error(e);
      alert('Error exporting document: ' + (e.message || String(e)));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
      <div 
        className="print-hidden tiptap-toolbar"
        style={{ 
          display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2)', 
          borderBottom: '1px solid var(--color-border-light)', 
          background: 'var(--color-bg-app)', alignItems: 'center', flexWrap: 'wrap',
          position: 'sticky', top: 0, zIndex: 10
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

        {/* Exporters */}
        <button
          onClick={handleExportDocx}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent-primary)', color: 'var(--color-accent-primary)', cursor: 'pointer', background: 'var(--color-bg-app)', fontWeight: 'bold' }}
          title="Export as Microsoft Word (.docx)"
        >
          📄 DOCX
        </button>
        <button
          onClick={() => window.print()}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-text-primary)', color: 'var(--color-text-primary)', cursor: 'pointer', background: 'var(--color-bg-app)', fontWeight: 'bold' }}
          title="Print or Save as PDF"
        >
          🖨️ PDF
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowCitationPrefs(!showCitationPrefs);
              setShowPaginationPanel(false);
            }}
            style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', cursor: 'pointer', background: showCitationPrefs ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)' }}
          >
            📑 Citation Style
          </button>
          {showCitationPrefs && (
            <CitationPreferences 
              settings={pageSettings} 
              onChange={handlePageSettingsChange} 
              onClose={() => setShowCitationPrefs(false)} 
            />
          )}
        </div>

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
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'var(--color-bg-app)' }}
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
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={editor.isActive('superscript') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('superscript') ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Superscript"
        >
          X²
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={editor.isActive('subscript') ? 'active' : ''}
          style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: editor.isActive('subscript') ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Subscript"
        >
          X₂
        </button>
        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        <button
          onClick={() => {
            setIsTracking(!isTracking);
            editor.chain().focus().setTrackChanges(!isTracking).run();
          }}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: isTracking ? '#e6ffed' : 'transparent', color: isTracking ? '#2e7d32' : 'inherit', fontWeight: 'bold' }}
          title="Toggle Track Changes Mode"
        >
          {isTracking ? 'Tracking: ON' : 'Track Changes'}
        </button>
        <button
          onClick={() => setShowTrackChanges(!showTrackChanges)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showTrackChanges ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Review Tracked Changes"
        >
          👀 Review Changes
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
          onClick={() => setShowFigureModal(true)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Insert Graph"
        >
          📈 Graph
        </button>
        <button
          onClick={() => editor.chain().focus().insertContent('<div data-type="math-block"></div>').run()}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent', fontWeight: 'bold' }}
          title="Insert Equation (LaTeX)"
        >
          ∑ Math
        </button>
        <button
          onClick={() => setShowLinkedObjects(true)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Insert Table Builder Table"
        >
          🗃 TB Table
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
          onClick={handleAddComment}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: 'transparent' }}
          title="Add Comment to Selection"
        >
          ➕ Add Comment
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showComments ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Toggle Comments Panel"
        >
          💬 Comments Panel
        </button>
        <div style={{ width: '1px', background: 'var(--color-border-light)', margin: '0 var(--space-2)' }}></div>
        <button
          onClick={() => setShowOutline(!showOutline)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showOutline ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Toggle Document Outline"
        >
          📑 Outline
        </button>
        <button
          onClick={() => setShowLinkedObjects(!showLinkedObjects)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showLinkedObjects ? 'var(--color-bg-hover)' : 'transparent' }}
          title="View linked Table Builder tables"
        >
          📋 Linked Objects
        </button>
        <button
          onClick={() => setShowFindReplace(true)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showFindReplace ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Find and Replace (Cmd+F)"
        >
          🔍 Find
        </button>
        <button
          onClick={() => setShowPaginationPanel(!showPaginationPanel)}
          style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)', cursor: 'pointer', background: showPaginationPanel ? 'var(--color-bg-hover)' : 'transparent' }}
          title="Header, Footer, and Page Numbers"
        >
          📄 Format Page
        </button>
      </div>

      <div style={{ position: 'relative', display: 'flex', flex: 1, overflow: 'hidden', minWidth: 0 }}>
        {showOutline && (
          <DocumentSidebar editor={editor} />
        )}
        
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

        {showPaginationPanel && (
           <PaginationPanel settings={pageSettings} onChange={handlePageSettingsChange} onClose={() => setShowPaginationPanel(false)} />
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--space-8)', display: 'flex', flexDirection: 'column', backgroundColor: '#e5e7eb' }}>
          <div className="tiptap-page-container">
            {(pageSettings.headerText || (pageSettings.pageNumberPosition !== 'none' && pageSettings.pageNumberPosition.includes('top'))) && (
               <div style={{ 
                  padding: '0 25.4mm 16px', color: 'var(--color-text-tertiary)', fontSize: '12px', 
                  borderBottom: '1px dashed var(--color-border-light)', opacity: 0.6,
                  display: 'flex', justifyContent: 'space-between', marginBottom: '16px'
               }}>
                   <span>{pageSettings.headerText}</span>
                   {pageSettings.pageNumberPosition.includes('top') && <span>Page 1</span>}
               </div>
            )}
            
            <EditorContent editor={editor} className="tiptap-content-wrapper" style={{ flexGrow: 1 }} />
            
            <div style={{ marginTop: 'auto' }}>
              <div style={{ padding: '0 25.4mm' }}>
                 <FootnoteList editorJson={editor.getJSON()} />
                 <EndnoteList editorJson={editor.getJSON()} />
                 <Bibliography editorJson={editor.getJSON()} citationStyle={pageSettings.citationStyle} />
              </div>
              
              {(pageSettings.footerText || (pageSettings.pageNumberPosition !== 'none' && pageSettings.pageNumberPosition.includes('bottom'))) && (
                 <div style={{ 
                    padding: '16px 25.4mm 0', color: 'var(--color-text-tertiary)', fontSize: '12px', 
                    borderTop: '1px dashed var(--color-border-light)', opacity: 0.6, marginTop: '24px',
                    display: 'flex', justifyContent: 'space-between'
                 }}>
                     <span>{pageSettings.footerText}</span>
                     {pageSettings.pageNumberPosition.includes('bottom') && <span>Page {(editor.getHTML().match(/<hr data-type="page-break"/g) || []).length + 1}</span>}
                 </div>
              )}
            </div>
          </div>
        </div>
        
        {showFigureModal && (
          <InsertFigureModal 
            onClose={() => setShowFigureModal(false)}
            onInsert={(figure) => {
              if (figure.thumbnail_dataurl) {
                editor.chain().focus().setImage({ src: figure.thumbnail_dataurl, alt: figure.name, width: '600px' }).run();
              } else {
                alert('This figure does not have a preview image.');
              }
              setShowFigureModal(false);
            }}
          />
        )}

        {showComments && (
          <CommentSidebar 
            comments={comments} 
            activeCommentId={activeCommentId}
            onAddCommentText={setCommentText}
            onAddReply={addCommentReply}
            onResolve={resolveComment}
            onDelete={deleteComment}
            onSelectComment={highlightCommentInEditor}
          />
        )}
        {showTrackChanges && (<TrackChangesSidebar editor={editor} onClose={() => setShowTrackChanges(false)} />)}
        {showLinkedObjects && (
          <div style={{
            width: '280px',
            borderLeft: '1px solid var(--color-border-light)',
            backgroundColor: 'var(--color-bg-sidebar)',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <LinkedObjectsPanel
              documentId={documentId || null}
              onInsertTable={(tableId, caption) => {
                (editor as any).chain().focus().insertTableBuilderEmbed(tableId, caption).run();
              }}
            />
          </div>
        )}
      </div>

      <div className="print-hidden" style={{ 
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
      
      <DemoLimitDialog
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        title="Document Exported (Demo Mode)"
        message="A watermark has been added to your exported document because you are using the Demo Version. To remove the watermark, please activate your license."
        onActivate={() => window.dispatchEvent(new CustomEvent('TRIGGER_ACTIVATION'))}
      />
    </div>
  );
}
