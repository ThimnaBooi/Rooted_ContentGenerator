'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Clock3, Plus, Loader2, Trash2, Lock, LockOpen, Calendar, Mail } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { getTimeCapsules, createTimeCapsule, deleteTimeCapsule } from '@/lib/media-queries';
import type { TimeCapsule } from '@/lib/media-types';
import { cn } from '@/lib/utils';

function isUnlocked(capsule: TimeCapsule): boolean {
  return new Date(capsule.unlock_date) <= new Date();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function TimeCapsulesPage() {
  const { session, isGuest } = useAuth();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newRecipients, setNewRecipients] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newNotify, setNewNotify] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openedCapsule, setOpenedCapsule] = useState<TimeCapsule | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getTimeCapsules();
      setCapsules(data);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    setCreating(true);
    try {
      await createTimeCapsule({
        title: newTitle.trim(),
        message: newMessage.trim() || undefined,
        recipients: newRecipients.trim() || undefined,
        unlockDate: newDate,
        notifyOnUnlock: newNotify,
      });
      toast.success('Time capsule sealed.');
      setNewTitle(''); setNewMessage(''); setNewRecipients(''); setNewDate(''); setNewNotify(true);
      setCreateOpen(false);
      await load();
    } catch {
      toast.error('Could not create time capsule.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTimeCapsule(id);
      toast.success('Time capsule removed.');
      await load();
    } catch {
      toast.error('Could not remove time capsule.');
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Digital Time Capsules" description="Write letters, preserve messages, and seal memories that remain locked until a chosen future date." />
        <EmptyState icon={Clock3} title="Sign in to create time capsules" description="Create an account to seal messages for future generations." actionLabel="Create your account" actionHref="/register" />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Digital Time Capsules"
          description="Write letters, preserve messages, and seal memories that remain locked until a chosen future date. A gift for generations yet to come."
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Time Capsule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Seal a Time Capsule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tc-title">Title</Label>
                <Input id="tc-title" placeholder="e.g. A Letter for Your 18th Birthday" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tc-message">Your message</Label>
                <Textarea id="tc-message" placeholder="Write the message you want to preserve…" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tc-recipients">Recipients (optional)</Label>
                <Input id="tc-recipients" placeholder="e.g. For our grandchildren" value={newRecipients} onChange={(e) => setNewRecipients(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tc-date">Unlock date</Label>
                <Input id="tc-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card/50 px-3 py-2">
                <Label htmlFor="tc-notify" className="text-sm">Notify me when it unlocks</Label>
                <Switch id="tc-notify" checked={newNotify} onCheckedChange={setNewNotify} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Seal Time Capsule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {capsules.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="No time capsules yet"
          description="Create a time capsule to preserve a message for a future date — a birthday, an anniversary, or a moment decades from now."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capsules.map((capsule, idx) => {
            const unlocked = isUnlocked(capsule);
            const days = daysUntil(capsule.unlock_date);
            return (
              <Card
                key={capsule.id}
                className={cn(
                  'group animate-fade-up border-border/70 bg-card shadow-soft transition-all hover:shadow-soft-lg',
                  unlocked ? 'hover:-translate-y-1' : 'cursor-default'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      'grid h-11 w-11 place-items-center rounded-xl',
                      unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {unlocked ? <LockOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                      onClick={() => handleDelete(capsule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="mt-3 font-serif text-base font-semibold">{capsule.title}</h3>
                  {capsule.recipients && (
                    <p className="mt-0.5 text-xs text-muted-foreground">For: {capsule.recipients}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className={cn('gap-1 text-xs', unlocked ? 'border-primary/30 text-primary' : 'border-muted-foreground/30')}>
                      <Calendar className="h-3 w-3" />
                      {formatDate(capsule.unlock_date)}
                    </Badge>
                  </div>
                  {unlocked ? (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setOpenedCapsule(capsule)}>
                        <Mail className="h-3.5 w-3.5" />
                        Open & Read
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Unlocks in {days} {days === 1 ? 'day' : 'days'}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Open capsule dialog */}
      <Dialog open={!!openedCapsule} onOpenChange={(v) => !v && setOpenedCapsule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{openedCapsule?.title}</DialogTitle>
          </DialogHeader>
          {openedCapsule && (
            <div className="space-y-3">
              {openedCapsule.recipients && (
                <p className="text-sm font-medium text-muted-foreground">For: {openedCapsule.recipients}</p>
              )}
              <p className="text-xs text-muted-foreground">Unlocked on {formatDate(openedCapsule.unlock_date)}</p>
              {openedCapsule.message ? (
                <div className="rounded-lg bg-card/50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{openedCapsule.message}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">This time capsule has no written message.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
