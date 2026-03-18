import { useState } from 'react';

export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  selectedText: string;
  author: string;
  text: string;
  createdAt: string;
  replies: CommentReply[];
  resolved: boolean;
}

interface CommentSidebarProps {
  comments: CommentThread[];
  activeCommentId: string | null;
  onAddCommentText: (id: string, text: string) => void;
  onAddReply: (id: string, text: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectComment: (id: string) => void;
}

export function CommentSidebar({
  comments,
  activeCommentId,
  onAddCommentText,
  onAddReply,
  onResolve,
  onDelete,
  onSelectComment
}: CommentSidebarProps) {
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const activeComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  return (
    <div style={{
      width: '320px',
      borderLeft: '1px solid var(--color-border-light)',
      backgroundColor: 'var(--color-bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-surface)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
          Comments
        </h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {activeComments.length === 0 && (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
            No active comments. Select text and click the 💬 button to add one.
          </p>
        )}
        
        {activeComments.map(comment => (
          <div 
            key={comment.id}
            onClick={() => onSelectComment(comment.id)}
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: `1px solid ${activeCommentId === comment.id ? 'var(--color-accent-primary)' : 'var(--color-border-light)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              boxShadow: activeCommentId === comment.id ? '0 0 0 1px var(--color-accent-primary)' : 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}
          >
            {/* Context/Selected Text */}
            <div style={{ 
              borderLeft: '3px solid var(--color-accent-primary)', 
              paddingLeft: 'var(--space-2)', 
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-xs)',
              fontStyle: 'italic',
              maxHeight: '40px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              "{comment.selectedText}"
            </div>

            {/* Initial Comment Box if empty */}
            {comment.text === '' ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <textarea 
                    autoFocus
                    placeholder="Enter comment..."
                    value={replyText[comment.id] || ''}
                    onChange={e => setReplyText({...replyText, [comment.id]: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border-light)', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(comment.id); }} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--color-border-light)', borderRadius: '4px' }}>Cancel</button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAddCommentText(comment.id, replyText[comment.id] || ''); }}
                      disabled={!replyText[comment.id]?.trim()}
                      style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '4px', opacity: replyText[comment.id]?.trim() ? 1 : 0.5 }}
                    >
                      Comment
                    </button>
                  </div>
               </div>
            ) : (
              <>
                {/* Original Thread */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>{comment.author}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', margin: 0, wordBreak: 'break-word' }}>
                    {comment.text}
                  </p>
                </div>

                {/* Replies */}
                {comment.replies.map(reply => (
                  <div key={reply.id} style={{ paddingLeft: 'var(--space-3)', borderLeft: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: 'var(--space-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{reply.author}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', margin: 0, paddingBottom: '4px' }}>{reply.text}</p>
                  </div>
                ))}

                {/* Actions & Reply Input */}
                {activeCommentId === comment.id && (
                  <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text"
                        placeholder="Reply..."
                        value={replyText[comment.id] || ''}
                        onChange={e => setReplyText({...replyText, [comment.id]: e.target.value})}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && replyText[comment.id]?.trim()) {
                            onAddReply(comment.id, replyText[comment.id]);
                            setReplyText({...replyText, [comment.id]: ''});
                          }
                        }}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border-light)', fontSize: '12px' }}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAddReply(comment.id, replyText[comment.id]); setReplyText({...replyText, [comment.id]: ''}); }}
                        disabled={!replyText[comment.id]?.trim()}
                        style={{ padding: '0 8px', fontSize: '12px', cursor: 'pointer', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border-light)', borderRadius: '4px' }}
                      >
                        Reply
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--color-border-light)' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(comment.id); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                      >
                        Delete thread
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onResolve(comment.id); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-success)', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                      >
                        ✓ Resolve
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {resolvedComments.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)', borderTop: '1px dashed var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.5px', marginBottom: 'var(--space-2)' }}>Resolved</h4>
            {resolvedComments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)', opacity: 0.7 }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                  {comment.text || "Empty comment"}
                </span>
                <button onClick={() => onDelete(comment.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', fontSize: '14px', cursor: 'pointer', padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
