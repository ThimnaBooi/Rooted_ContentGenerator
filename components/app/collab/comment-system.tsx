'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, ThumbsUp, Reply, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { getComments, createComment, deleteComment, toggleReaction } from '@/lib/collab-queries';
import type { Comment, Reaction } from '@/lib/collab-types';
import { cn } from '@/lib/utils';

type CommentSystemProps = {
  entityType: string;
  entityId: string;
  className?: string;
};

function initialsFromEmail(email: string, name?: string | null): string {
  if (name) return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function CommentSystem({ entityType, entityId, className }: CommentSystemProps) {
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getComments(entityType, entityId);
      setComments(data);
    } catch {
      // silently fail — comments are supplementary
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await createComment({ entityType, entityId, body: body.trim() });
      setBody('');
      await load();
    } catch {
      // error toast handled by caller context
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      await createComment({
        entityType,
        entityId,
        body: replyBody.trim(),
        parentCommentId: parentId,
      });
      setReplyBody('');
      setReplyingTo(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReaction(commentId: string, type: 'heart' | 'appreciation') {
    await toggleReaction(commentId, type);
    await load();
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
      await load();
    } catch {
      // ignore
    }
  }

  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesOf = (parentId: string) =>
    comments.filter((c) => c.parent_comment_id === parentId);

  const currentUserEmail = session?.user?.email;

  function reactionCount(reactions: Reaction[], type: string): number {
    return reactions.filter((r) => r.type === type).length;
  }

  function hasReacted(reactions: Reaction[], type: string): boolean {
    return reactions.some((r) => r.type === type && r.user_email === currentUserEmail);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading comments…
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* New comment */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share a thought or memory…"
          rows={2}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
            {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
            Comment
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {topLevel.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No comments yet. Be the first to share.</p>
      ) : (
        <div className="space-y-3">
          {topLevel.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <CommentItem
                comment={comment}
                onReact={handleReaction}
                onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                onDelete={handleDelete}
                canDelete={comment.author_email === currentUserEmail}
                reactionCount={reactionCount}
                hasReacted={hasReacted}
              />
              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="ml-11 space-y-2">
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    className="resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleReply(comment.id)} disabled={submitting || !replyBody.trim()}>
                      Reply
                    </Button>
                  </div>
                </div>
              )}
              {/* Replies */}
              {repliesOf(comment.id).map((reply) => (
                <div key={reply.id} className="ml-11">
                  <CommentItem
                    comment={reply}
                    onReact={handleReaction}
                    onDelete={handleDelete}
                    canDelete={reply.author_email === currentUserEmail}
                    reactionCount={reactionCount}
                    hasReacted={hasReacted}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onReact,
  onReply,
  onDelete,
  canDelete,
  reactionCount,
  hasReacted,
}: {
  comment: Comment;
  onReact: (id: string, type: 'heart' | 'appreciation') => void;
  onReply?: () => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  reactionCount: (reactions: Reaction[], type: string) => number;
  hasReacted: (reactions: Reaction[], type: string) => boolean;
}) {
  return (
    <div className="rounded-xl bg-card/60 p-3">
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {initialsFromEmail(comment.author_email, comment.author_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {comment.author_name ?? comment.author_email}
            </span>
            <span className="text-xs text-muted-foreground">{formatRelative(comment.created_at)}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.body}</p>
          <div className="mt-2 flex items-center gap-1">
            <button
              onClick={() => onReact(comment.id, 'heart')}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
                hasReacted(comment.reactions, 'heart')
                  ? 'bg-highlight/20 text-highlight'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Heart className={cn('h-3.5 w-3.5', hasReacted(comment.reactions, 'heart') && 'fill-current')} />
              {reactionCount(comment.reactions, 'heart') > 0 && reactionCount(comment.reactions, 'heart')}
            </button>
            <button
              onClick={() => onReact(comment.id, 'appreciation')}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
                hasReacted(comment.reactions, 'appreciation')
                  ? 'bg-accent/20 text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <ThumbsUp className={cn('h-3.5 w-3.5', hasReacted(comment.reactions, 'appreciation') && 'fill-current')} />
              {reactionCount(comment.reactions, 'appreciation') > 0 && reactionCount(comment.reactions, 'appreciation')}
            </button>
            {onReply && (
              <button
                onClick={onReply}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
