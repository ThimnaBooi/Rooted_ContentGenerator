'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { TagInput } from '@/components/app/tag-input';
import { MediaUploader } from '@/components/app/media-uploader';
import {
  createPerson,
  updatePerson,
} from '@/lib/queries';
import type { Person } from '@/lib/types';

type PersonFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  onSaved?: (p: Person) => void;
};

export function PersonForm({
  open,
  onOpenChange,
  person,
  onSaved,
}: PersonFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    preferred_name: '',
    date_of_birth: '',
    date_of_passing: '',
    gender: '',
    occupation: '',
    bio: '',
    relationship_to_owner: '',
    notes: '',
    photo_url: '',
  });
  const [traits, setTraits] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [lifeLessons, setLifeLessons] = useState<string[]>([]);

  useEffect(() => {
    if (person) {
      setForm({
        full_name: person.full_name ?? '',
        preferred_name: person.preferred_name ?? '',
        date_of_birth: person.date_of_birth ?? '',
        date_of_passing: person.date_of_passing ?? '',
        gender: person.gender ?? '',
        occupation: person.occupation ?? '',
        bio: person.bio ?? '',
        relationship_to_owner: person.relationship_to_owner ?? '',
        notes: person.notes ?? '',
        photo_url: person.photo_url ?? '',
      });
      setTraits(person.personality_traits ?? []);
      setQuotes(person.favourite_quotes ?? []);
      setInterests(person.interests ?? []);
      setHobbies(person.hobbies ?? []);
      setAchievements(person.achievements ?? []);
      setLifeLessons(person.life_lessons ?? []);
    } else {
      setForm({
        full_name: '',
        preferred_name: '',
        date_of_birth: '',
        date_of_passing: '',
        gender: '',
        occupation: '',
        bio: '',
        relationship_to_owner: '',
        notes: '',
        photo_url: '',
      });
      setTraits([]);
      setQuotes([]);
      setInterests([]);
      setHobbies([]);
      setAchievements([]);
      setLifeLessons([]);
    }
  }, [person, open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error('Full name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        preferred_name: form.preferred_name.trim() || null,
        date_of_birth: form.date_of_birth || null,
        date_of_passing: form.date_of_passing || null,
        gender: form.gender.trim() || null,
        occupation: form.occupation.trim() || null,
        bio: form.bio.trim() || null,
        personality_traits: traits,
        favourite_quotes: quotes,
        interests: interests,
        hobbies: hobbies,
        achievements: achievements,
        life_lessons: lifeLessons,
        relationship_to_owner: form.relationship_to_owner.trim() || null,
        notes: form.notes.trim() || null,
        photo_url: form.photo_url || null,
      };
      let saved: Person;
      if (person) {
        saved = await updatePerson(person.id, payload);
        toast.success('Person updated.');
      } else {
        saved = await createPerson(payload);
        toast.success('Person added to your archive.');
      }
      onSaved?.(saved);
      onOpenChange(false);
      if (!person) router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not save person.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {person ? 'Edit person' : 'Add a person'}
          </DialogTitle>
          <DialogDescription>
            Create a profile for someone in your family archive. Every detail
            you add enriches their story.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g. Margaret Rose Whitfield"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_name">Preferred name / nickname</Label>
              <Input
                id="preferred_name"
                value={form.preferred_name}
                onChange={(e) =>
                  setForm({ ...form, preferred_name: e.target.value })
                }
                placeholder="e.g. Maggie"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.date_of_birth}
                onChange={(e) =>
                  setForm({ ...form, date_of_birth: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dop">Date of passing</Label>
              <Input
                id="dop"
                type="date"
                value={form.date_of_passing}
                onChange={(e) =>
                  setForm({ ...form, date_of_passing: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                placeholder="e.g. Female"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={form.occupation}
                onChange={(e) =>
                  setForm({ ...form, occupation: e.target.value })
                }
                placeholder="e.g. Teacher"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship to you</Label>
              <Input
                id="relationship"
                value={form.relationship_to_owner}
                onChange={(e) =>
                  setForm({ ...form, relationship_to_owner: e.target.value })
                }
                placeholder="e.g. Grandmother"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biography summary</Label>
            <Textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="A few sentences about who they are and what shaped them…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TagInput
              label="Personality traits"
              value={traits}
              onChange={setTraits}
              placeholder="kind, witty, patient…"
            />
            <TagInput
              label="Favourite quotes"
              value={quotes}
              onChange={setQuotes}
              placeholder="Things they always said…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TagInput
              label="Interests"
              value={interests}
              onChange={setInterests}
              placeholder="gardening, history…"
            />
            <TagInput
              label="Hobbies"
              value={hobbies}
              onChange={setHobbies}
              placeholder="knitting, hiking…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TagInput
              label="Achievements"
              value={achievements}
              onChange={setAchievements}
              placeholder="awards, milestones…"
            />
            <TagInput
              label="Important life lessons"
              value={lifeLessons}
              onChange={setLifeLessons}
              placeholder="wisdom they shared…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything else you'd like to remember…"
            />
          </div>

          <MediaUploader
            bucket="photos"
            accept="image/*"
            label="Profile photograph"
            onUploaded={(files) =>
              setForm({ ...form, photo_url: files[0]?.url ?? '' })
            }
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
              {person ? 'Save changes' : 'Add person'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
