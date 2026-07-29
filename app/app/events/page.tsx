'use client';

import { useEffect, useState } from 'react';
import { Plus, CalendarClock, Loader2, Calendar, MapPin } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEvents, createEvent, deleteEvent } from '@/lib/queries';
import { toast } from 'sonner';

const EVENT_TYPES = [
  'birth',
  'wedding',
  'graduation',
  'anniversary',
  'holiday',
  'reunion',
  'career',
  'other',
] as const;

export default function EventsPage() {
  const [events, setEvents] = useState<
    { id: string; title: string; description: string | null; event_date: string | null; location: string | null; event_type: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    event_type: '',
  });
  const [personIds, setPersonIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch {
      toast.error('Could not load events.');
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
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date || null,
        location: form.location.trim() || null,
        event_type: form.event_type || null,
        person_ids: personIds,
      });
      toast.success('Event recorded.');
      setForm({ title: '', description: '', event_date: '', location: '', event_type: '' });
      setPersonIds([]);
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save event.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEvent(deleteId);
      setEvents((e) => e.filter((x) => x.id !== deleteId));
      toast.success('Event deleted.');
    } catch {
      toast.error('Could not delete event.');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Events"
        description="Important milestones — births, weddings, graduations, anniversaries, holidays, reunions, and career achievements. Record them with dates, locations, and the people who were there."
      />

      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record an event
        </Button>
      </div>

      <CreateWithAI sourceType="event" sourceId="" sourceName="this event" />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No events recorded yet"
          description="Record the milestones that mark your family's journey — births, weddings, graduations, anniversaries — and connect them to the people who lived them."
          actionLabel="Record your first event"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Card
              key={e.id}
              className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <ItemActions entityLabel={e.title} onDelete={() => setDeleteId(e.id)} />
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold">{e.title}</h3>
                {e.event_type && (
                  <Badge variant="secondary" className="mt-2 bg-accent/20 text-accent-foreground capitalize">
                    {e.event_type}
                  </Badge>
                )}
                {e.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {e.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {e.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(e.event_date).toLocaleDateString()}
                    </span>
                  )}
                  {e.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {e.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Record an event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Mum and Dad's 40th anniversary"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.event_type}
                  onValueChange={(v) => setForm({ ...form, event_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-loc">Location</Label>
              <Input
                id="event-loc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. The Old Mill, Vermont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              Record event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this event?"
        description="This will permanently remove the event."
        onConfirm={handleDelete}
      />
    </div>
  );
}
