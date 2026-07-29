'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Plus, Loader2, Star, Trash2, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getProjects, createProject, deleteProject, toggleProjectFavourite } from '@/lib/studio-queries';
import { TEMPLATE_TYPES } from '@/lib/studio-types';
import type { StudioProject } from '@/lib/studio-types';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const { isGuest } = useAuth();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', project_type: 'memory_book' });

  async function load() {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      toast.error('Could not load projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    load();
  }, [isGuest]);

  async function handleCreate() {
    if (!form.name.trim()) { toast.error('Project name is required.'); return; }
    setSaving(true);
    try {
      await createProject({ name: form.name.trim(), description: form.description.trim() || null, project_type: form.project_type });
      setForm({ name: '', description: '', project_type: 'memory_book' });
      setCreateOpen(false);
      await load();
      toast.success('Project created.');
    } catch {
      toast.error('Could not create project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteProject(deleteId);
      setProjects((p) => p.filter((x) => x.id !== deleteId));
      toast.success('Project deleted.');
    } catch {
      toast.error('Could not delete project.');
    } finally {
      setDeleteId(null);
    }
  }

  async function handleFav(p: StudioProject) {
    const next = !p.is_favourite;
    await toggleProjectFavourite(p.id, next);
    setProjects(projects.map((x) => x.id === p.id ? { ...x, is_favourite: next } : x));
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Projects" description="Group documents and images into complete memory books, tribute collections, and more." />
        <EmptyState icon={Layers} title="Sign in to access projects" description="Create an account to start building projects from your generated content." actionLabel="Create account" actionHref="/register" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Projects" description="Group documents and images together — a biography, illustrations, and captions that form a complete memory book." />

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />New project</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={Layers} title="No projects yet" description="Create a project to group related documents and images — like a memory book with a biography, illustrations, and photo captions." actionLabel="Create your first project" actionHref="#" className="border-solid" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <Link href={`/app/studio/projects/${p.id}`} className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </Link>
                  <div className="flex gap-1">
                    <button onClick={() => handleFav(p)} aria-label="Toggle favourite">
                      <Star className={p.is_favourite ? 'h-4 w-4 fill-accent text-accent' : 'h-4 w-4 text-muted-foreground'} />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} aria-label="Delete project">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <Link href={`/app/studio/projects/${p.id}`}>
                  <p className="mt-3 font-serif text-base font-semibold">{p.name}</p>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  <Badge variant="secondary" className="mt-2 bg-accent/20 text-accent-foreground capitalize">{p.project_type.replace(/_/g, ' ')}</Badge>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-xl">New project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Name *</Label>
              <Input id="proj-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grandma's Memory Book" />
            </div>
            <div className="space-y-2">
              <Label>Project type</Label>
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPLATE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea id="proj-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will this project contain?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete this project?" description="This will remove the project. Generated documents and images will remain in your library." onConfirm={handleDelete} />
    </div>
  );
}
