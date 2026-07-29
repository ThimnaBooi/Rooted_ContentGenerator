'use client';

import { useEffect, useState } from 'react';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { PersonSelector } from '@/components/app/person-selector';
import { ItemActions } from '@/components/app/item-actions';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
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
import { getPlaces, createPlace, deletePlace } from '@/lib/queries';
import { toast } from 'sonner';

export default function PlacesPage() {
  const [places, setPlaces] = useState<
    { id: string; name: string; description: string | null; location: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', location: '' });
  const [personIds, setPersonIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getPlaces();
      setPlaces(data);
    } catch {
      toast.error('Could not load places.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await createPlace({
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        person_ids: personIds,
      });
      toast.success('Place added.');
      setForm({ name: '', description: '', location: '' });
      setPersonIds([]);
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save place.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePlace(deleteId);
      setPlaces((p) => p.filter((x) => x.id !== deleteId));
      toast.success('Place deleted.');
    } catch {
      toast.error('Could not delete place.');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Places"
        description="The locations that hold significance for your family — a childhood home, a favourite holiday spot, a hometown. Preserve them with their stories."
      />

      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add a place
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : places.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No places saved yet"
          description="Add the places that matter to your family — homes, towns, holiday spots — and connect them to memories and people."
          actionLabel="Add your first place"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((p) => (
            <Card
              key={p.id}
              className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <ItemActions entityLabel={p.name} onDelete={() => setDeleteId(p.id)} />
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold">{p.name}</h3>
                {p.location && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.location}</p>
                )}
                {p.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {p.description}
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
            <DialogTitle className="font-serif text-2xl">Add a place</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="place-name">Name *</Label>
              <Input
                id="place-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. The cottage in Connemara"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place-loc">Location</Label>
              <Input
                id="place-loc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. County Galway, Ireland"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place-desc">Description</Label>
              <Textarea
                id="place-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Why is this place significant to your family?"
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
              Add place
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this place?"
        description="This will permanently remove the place."
        onConfirm={handleDelete}
      />
    </div>
  );
}
