'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/app/tag-input';
import { PersonSelector } from '@/components/app/person-selector';
import { createMemory, updateMemory } from '@/lib/queries';
import type { Memory } from '@/lib/types';
import { EMOTIONAL_CATEGORIES } from '@/lib/types';

type MemoryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory?: Memory | null;
  defaultPersonIds?: string[];
  onSaved?: () => void;
};

export function MemoryForm({
  open,
  onOpenChange,
  memory,
  defaultPersonIds,
  onSaved,
}: MemoryFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    memory_date: '',
    location: '',
    emotional_category: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);

  useEffect(() => {
    if (memory) {
      setForm({
        title: memory.title,
        description: memory.description ?? '',
        memory_date: memory.memory_date ?? '',
        location: memory.location ?? '',
        emotional_category: memory.emotional_category ?? '',
      });
      setTags(memory.tags ?? []);
      setPersonIds([]);
    } else {
      setForm({
        title: '',
        description: '',
        memory_date: '',
        location: '',
        emotional_category: '',
      });
      setTags([]);
      setPersonIds(defaultPersonIds ?? []);
    }
  }, [memory, open, defaultPersonIds]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        memory_date: form.memory_date || null,
        location: form.location.trim() || null,
        tags,
        emotional_category: form.emotional_category || null,
        person_ids: personIds,
      };
      if (memory) {
        await updateMemory(memory.id, payload);
        toast.success('Memory updated.');
      } else {
        await createMemory(payload);
        toast.success('Memory added to your archive.');
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save memory.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {memory ? 'Edit memory' : 'Add a memory'}
          </DialogTitle>
          <DialogDescription>
            Capture a moment, story, or experience you want to preserve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Summer at the lake, 1987"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What happened? Who was there? What do you remember most?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.memory_date}
                onChange={(e) => setForm({ ...form, memory_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Lake Como, Italy"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Emotional category</Label>
            <Select
              value={form.emotional_category}
              onValueChange={(v) =>
                setForm({ ...form, emotional_category: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a category…" />
              </SelectTrigger>
              <SelectContent>
                {EMOTIONAL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TagInput
            label="Tags"
            value={tags}
            onChange={setTags}
            placeholder="summer, family, lake…"
          />

          <PersonSelector
            selected={personIds}
            onChange={setPersonIds}
            label="Associated people"
          />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {memory ? 'Save changes' : 'Add memory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
