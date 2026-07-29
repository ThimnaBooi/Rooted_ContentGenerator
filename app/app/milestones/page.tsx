'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Award,
  Plus,
  Loader2,
  Trash2,
  Trophy,
  Camera,
  BookOpen,
  UtensilsCrossed,
  Sparkles,
  Heart,
  Users,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { getMilestones, createMilestone, deleteMilestone } from '@/lib/collab-queries';
import type { Milestone } from '@/lib/collab-types';
import { cn } from '@/lib/utils';

function milestoneIcon(type: string) {
  if (type.includes('memory')) return BookOpen;
  if (type.includes('photo')) return Camera;
  if (type.includes('recipe')) return UtensilsCrossed;
  if (type.includes('tradition')) return Heart;
  if (type.includes('project') || type.includes('book')) return Trophy;
  if (type.includes('collaborator') || type.includes('family')) return Users;
  if (type.includes('event')) return Calendar;
  return Award;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MilestonesPage() {
  const { session, isGuest } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('custom');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMilestones();
      setMilestones(data);
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
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createMilestone({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        milestoneType: newType,
      });
      toast.success('Milestone created.');
      setNewTitle('');
      setNewDescription('');
      setNewType('custom');
      setCreateOpen(false);
      await load();
    } catch {
      toast.error('Could not create milestone.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMilestone(id);
      toast.success('Milestone removed.');
      await load();
    } catch {
      toast.error('Could not remove milestone.');
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Family Milestones" description="Celebrate the moments that mark your family's collaborative journey." />
        <EmptyState
          icon={Award}
          title="Sign in to see milestones"
          description="Create an account to track and celebrate collaboration milestones in your archive."
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Family Milestones"
          description="Celebrate the moments that mark your family's collaborative journey — first memories, collected recipes, completed projects, and more."
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Add a Milestone</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ms-title">Title</Label>
                <Input
                  id="ms-title"
                  placeholder="e.g. Completed the Family Recipe Book"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ms-desc">Description</Label>
                <Textarea
                  id="ms-desc"
                  placeholder="Describe this milestone…"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ms-type">Type</Label>
                <Input
                  id="ms-type"
                  placeholder="e.g. custom, project, photo"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                  Create Milestone
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {milestones.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No milestones yet"
          description="As your family collaborates and your archive grows, milestones will be celebrated here — your first shared memory, your hundredth photo, a completed family book."
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 h-full w-px bg-border sm:left-6" />

          <div className="space-y-6">
            {milestones.map((milestone, idx) => {
              const Icon = milestoneIcon(milestone.milestone_type);
              return (
                <div
                  key={milestone.id}
                  className={cn(
                    'relative flex items-start gap-4 animate-fade-up pl-12 sm:pl-16',
                  )}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  {/* Icon dot */}
                  <div className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full bg-accent/20 text-accent-foreground sm:h-12 sm:w-12">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  <Card className="flex-1 border-border/60 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-medium">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDate(milestone.achieved_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(milestone.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
