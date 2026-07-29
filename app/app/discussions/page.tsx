'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  MessageCircle,
  Plus,
  Loader2,
  Pin,
  Trash2,
  Send,
  ArrowLeft,
  PinOff,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getDiscussions,
  createDiscussion,
  deleteDiscussion,
  toggleDiscussionPin,
  getDiscussionMessages,
  createDiscussionMessage,
  deleteDiscussionMessage,
} from '@/lib/collab-queries';
import type { Discussion, DiscussionMessage } from '@/lib/collab-types';
import { cn } from '@/lib/utils';

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

export default function DiscussionsPage() {
  const { session, isGuest } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDiscussions();
      setDiscussions(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isGuest && session) load();
    else setLoading(false);
  }, [session, isGuest, load]);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const data = await getDiscussionMessages(id);
      setMessages(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createDiscussion({ title: newTitle.trim(), body: newBody.trim() || undefined });
      toast.success('Discussion started.');
      setNewTitle('');
      setNewBody('');
      setCreateOpen(false);
      await load();
    } catch {
      toast.error('Could not create discussion.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDiscussion(id);
      if (selectedId === id) setSelectedId(null);
      toast.success('Discussion deleted.');
      await load();
    } catch {
      toast.error('Could not delete discussion.');
    }
  }

  async function handlePin(id: string, pinned: boolean) {
    try {
      await toggleDiscussionPin(id, pinned);
      await load();
    } catch {
      toast.error('Could not pin discussion.');
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !messageBody.trim()) return;
    setSendingMessage(true);
    try {
      await createDiscussionMessage({ discussionId: selectedId, body: messageBody.trim() });
      setMessageBody('');
      await loadMessages(selectedId);
      await load();
    } catch {
      toast.error('Could not send message.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleDeleteMessage(id: string) {
    try {
      await deleteDiscussionMessage(id);
      if (selectedId) await loadMessages(selectedId);
    } catch {
      // ignore
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Family Discussions" description="A space for conversations, questions, and story suggestions — separate from the permanent archive." />
        <EmptyState
          icon={MessageCircle}
          title="Sign in to join discussions"
          description="Create an account to participate in family discussions about memories and stories."
          actionLabel="Create your account"
          actionHref="/register"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Detail view
  const selected = discussions.find((d) => d.id === selectedId);
  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to discussions
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {selected.pinned && <Pin className="h-4 w-4 text-accent-foreground" />}
              <h1 className="font-serif text-2xl font-semibold">{selected.title}</h1>
            </div>
            {selected.body && <p className="mt-1 text-sm text-muted-foreground">{selected.body}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              Started by {selected.author_name ?? selected.author_email} · {formatRelative(selected.created_at)}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePin(selected.id, !selected.pinned)}
            >
              {selected.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(selected.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation below.
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {initialsFromEmail(msg.author_email, msg.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-xl bg-card/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{msg.author_name ?? msg.author_email}</span>
                    <span className="text-xs text-muted-foreground">{formatRelative(msg.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">{msg.body}</p>
                </div>
                {msg.author_email === session?.user?.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Message form */}
        <form onSubmit={handleSendMessage} className="space-y-2">
          <Textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Write a message…"
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={sendingMessage || !messageBody.trim()} className="gap-1.5">
              {sendingMessage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Family Discussions"
          description="A space for conversations, questions, and story suggestions — separate from the permanent archive."
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Start a Discussion</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disc-title">Title</Label>
                <Input
                  id="disc-title"
                  placeholder="What would you like to discuss?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disc-body">Description (optional)</Label>
                <Textarea
                  id="disc-body"
                  placeholder="Add context or a question…"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Start Discussion
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl bg-accent/10 p-3 text-sm text-muted-foreground">
        Discussions are separate from the permanent archive. Conversations here won't become part of
        the official record unless the archive owner chooses to preserve them.
      </div>

      {discussions.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No discussions yet"
          description="Start a discussion to ask questions, share stories, or suggest new memories to preserve."
        />
      ) : (
        <div className="space-y-2">
          {discussions.map((disc) => (
            <Card
              key={disc.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-soft',
                disc.pinned && 'border-accent/30 bg-accent/5'
              )}
              onClick={() => setSelectedId(disc.id)}
            >
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {disc.pinned && <Pin className="h-3.5 w-3.5 text-accent-foreground" />}
                    <h3 className="font-serif text-lg font-medium">{disc.title}</h3>
                  </div>
                  {disc.body && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{disc.body}</p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {disc.author_name ?? disc.author_email} · {formatRelative(disc.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePin(disc.id, !disc.pinned)}
                  >
                    {disc.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(disc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
