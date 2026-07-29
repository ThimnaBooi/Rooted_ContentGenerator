'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FolderHeart, Plus, Loader2, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getHeritageCollections, createHeritageCollection, deleteHeritageCollection,
} from '@/lib/media-queries';
import { COLLECTION_TYPES } from '@/lib/media-types';
import type { HeritageCollection } from '@/lib/media-types';
import { cn } from '@/lib/utils';

export default function HeritageCollectionsPage() {
  const { session, isGuest } = useAuth();
  const [collections, setCollections] = useState<HeritageCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('custom');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getHeritageCollections();
      setCollections(data);
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
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createHeritageCollection({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        collectionType: newType,
      });
      toast.success('Collection created.');
      setNewName(''); setNewDesc(''); setNewType('custom');
      setCreateOpen(false);
      await load();
    } catch {
      toast.error('Could not create collection.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteHeritageCollection(id);
      toast.success('Collection deleted.');
      await load();
    } catch {
      toast.error('Could not delete collection.');
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Heritage Collections" description="Organise your archive into themed collections — family recipes, weddings, military service, cultural traditions, and more." />
        <EmptyState icon={FolderHeart} title="Sign in to create collections" description="Create an account to organise your preserved memories into meaningful heritage collections." actionLabel="Create your account" actionHref="/register" />
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

  const active = collections.filter((c) => !c.is_archived);
  const archived = collections.filter((c) => c.is_archived);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Heritage Collections"
          description="Organise your archive into themed collections — family recipes, weddings, military service, education, cultural traditions, and more."
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Create a Heritage Collection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="col-name">Collection name</Label>
                <Input id="col-name" placeholder="e.g. Nonna's Kitchen" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="col-type">Collection type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger id="col-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLLECTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="col-desc">Description (optional)</Label>
                <Textarea id="col-desc" placeholder="What is this collection about?" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderHeart className="h-4 w-4" />}
                  Create Collection
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title="No collections yet"
          description="Create themed collections to group your memories, photos, recipes, and traditions into meaningful heritage stories."
        />
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((col, idx) => {
                const typeLabel = COLLECTION_TYPES.find((t) => t.value === col.collection_type)?.label ?? col.collection_type;
                return (
                  <Card key={col.id} className="group animate-fade-up border-border/70 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg" style={{ animationDelay: `${idx * 50}ms` }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent-foreground">
                          <FolderHeart className="h-5 w-5" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          onClick={() => handleDelete(col.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="mt-3 font-serif text-base font-semibold">{col.name}</h3>
                      <Badge variant="outline" className="mt-1 text-xs">{typeLabel}</Badge>
                      {col.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{col.description}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {archived.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-muted-foreground">
                <Archive className="h-4 w-4" />
                Archived Collections
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map((col) => {
                  const typeLabel = COLLECTION_TYPES.find((t) => t.value === col.collection_type)?.label ?? col.collection_type;
                  return (
                    <Card key={col.id} className="border-border/70 bg-card/30 opacity-70">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                            <Archive className="h-5 w-5" />
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(col.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <h3 className="mt-3 font-serif text-base font-semibold">{col.name}</h3>
                        <Badge variant="outline" className="mt-1 text-xs">{typeLabel}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
