'use client';

import { useEffect, useState } from 'react';
import { Plus, Camera, Loader2, Calendar, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { MemoryForm } from '@/components/app/memories/memory-form';
import { ItemActions } from '@/components/app/item-actions';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { CreateWithAI } from '@/components/app/studio/create-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMemories, deleteMemory, updateMemory } from '@/lib/queries';
import type { Memory } from '@/lib/types';
import { toast } from 'sonner';

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getMemories();
      setMemories(data);
    } catch {
      toast.error('Could not load memories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMemory(deleteId);
      setMemories((m) => m.filter((x) => x.id !== deleteId));
      toast.success('Memory removed.');
    } catch {
      toast.error('Could not delete memory.');
    } finally {
      setDeleteId(null);
    }
  }

  async function handleDuplicate(m: Memory) {
    try {
      const copy = await updateMemory(m.id, {
        title: `${m.title} (Copy)`,
        description: m.description,
      });
      setMemories((prev) => [copy, ...prev]);
      toast.success('Memory duplicated.');
    } catch {
      toast.error('Could not duplicate memory.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Memories"
        description="Photographs, letters, voice notes, and moments — the pieces of your story, gathered and kept safe."
      />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a memory
        </Button>
      </div>

      <CreateWithAI sourceType="memory" sourceId="" sourceName="this memory" />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No memories yet"
          description="Upload a photo, record a voice note, or write down a moment you never want to forget. Every memory is a page in your family's book."
          actionLabel="Add your first memory"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((m) => (
            <Card
              key={m.id}
              className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Camera className="h-5 w-5" />
                  </div>
                  <ItemActions
                    entityLabel={m.title}
                    onEdit={() => {
                      setEditTarget(m);
                      setFormOpen(true);
                    }}
                    onDuplicate={() => handleDuplicate(m)}
                    onDelete={() => setDeleteId(m.id)}
                  />
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold">{m.title}</h3>
                {m.description && (
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {m.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {m.memory_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(m.memory_date).toLocaleDateString()}
                    </span>
                  )}
                  {m.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {m.location}
                    </span>
                  )}
                </div>
                {m.tags && m.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.tags.slice(0, 4).map((t, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-accent/20 text-accent-foreground"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
                {m.emotional_category && (
                  <Badge className="mt-3 bg-primary/10 text-primary" variant="secondary">
                    {m.emotional_category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MemoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        memory={editTarget}
        onSaved={() => load()}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this memory?"
        description="This will permanently remove this memory. This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
