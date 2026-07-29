'use client';

import { useEffect, useState } from 'react';
import { Plus, Landmark, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { PersonSelector } from '@/components/app/person-selector';
import { ItemActions } from '@/components/app/item-actions';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { CreateWithAI } from '@/components/app/studio/create-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getTraditions, createTradition, deleteTradition } from '@/lib/queries';
import { toast } from 'sonner';

export default function TraditionsPage() {
  const [traditions, setTraditions] = useState<
    { id: string; title: string; description: string | null; when_it_happens: string | null; participants: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    when_it_happens: '',
    participants: '',
  });
  const [personIds, setPersonIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getTraditions();
      setTraditions(data);
    } catch {
      toast.error('Could not load traditions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await createTradition({
        title: form.title.trim(),
        description: form.description.trim() || null,
        when_it_happens: form.when_it_happens.trim() || null,
        participants: form.participants.trim() || null,
        person_ids: personIds,
      });
      toast.success('Tradition preserved.');
      setForm({ title: '', description: '', when_it_happens: '', participants: '' });
      setPersonIds([]);
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save tradition.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteTradition(deleteId);
      setTraditions((t) => t.filter((x) => x.id !== deleteId));
      toast.success('Tradition deleted.');
    } catch {
      toast.error('Could not delete tradition.');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Traditions"
        description="The rituals, customs, and celebrations that connect your family across generations. Document them so they're never lost."
      />

      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Preserve a tradition
        </Button>
      </div>

      <CreateWithAI sourceType="tradition" sourceId="" sourceName="this tradition" />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : traditions.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No traditions recorded yet"
          description="Preserve a tradition — a holiday ritual, a weekly custom, a saying passed down — with the story of where it came from and what it means."
          actionLabel="Preserve your first tradition"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {traditions.map((t) => (
            <Card
              key={t.id}
              className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <ItemActions entityLabel={t.title} onDelete={() => setDeleteId(t.id)} />
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold">{t.title}</h3>
                {t.description && (
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                )}
                {t.when_it_happens && (
                  <p className="mt-2 text-xs italic text-accent-foreground">
                    {t.when_it_happens}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Preserve a tradition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trad-title">Title *</Label>
              <Input
                id="trad-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Sunday family dinner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trad-desc">Description</Label>
              <Textarea
                id="trad-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is the tradition? Where did it come from?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trad-when">When it takes place</Label>
              <Input
                id="trad-when"
                value={form.when_it_happens}
                onChange={(e) => setForm({ ...form, when_it_happens: e.target.value })}
                placeholder="e.g. Every Sunday at noon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trad-who">Who participates</Label>
              <Input
                id="trad-who"
                value={form.participants}
                onChange={(e) => setForm({ ...form, participants: e.target.value })}
                placeholder="e.g. The whole family"
              />
            </div>
            <PersonSelector selected={personIds} onChange={setPersonIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Preserve tradition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this tradition?"
        description="This will permanently remove the tradition."
        onConfirm={handleDelete}
      />
    </div>
  );
}
