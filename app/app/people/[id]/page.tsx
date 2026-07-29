'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Camera,
  Mic,
  FileText,
  UtensilsCrossed,
  Calendar,
  BookOpen,
  Award,
  MessageSquare,
  Sparkles,
  Users as UsersIcon,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PersonForm } from '@/components/app/people/person-form';
import { EmptyState } from '@/components/app/empty-state';
import { CreateWithAI } from '@/components/app/studio/create-with-ai';
import { MemoryToMedia } from '@/components/app/studio/memory-to-media';
import {
  getPerson,
  getMemoriesForPerson,
  getPhotosForPerson,
  getRecipesForPerson,
  getDocumentsForPerson,
  getVoiceForPerson,
} from '@/lib/queries';
import type {
  Person,
  Memory,
  Photo,
  Recipe,
  Document,
  VoiceRecording,
} from '@/lib/types';
import { toast } from 'sonner';

type Section = {
  icon: typeof Camera;
  label: string;
  href: string;
  items: { id: string; title: string; subtitle?: string | null; image?: string | null }[];
  emptyTitle: string;
  emptyDesc: string;
  actionLabel: string;
};

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [voice, setVoice] = useState<VoiceRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [p, m, ph, r, d, v] = await Promise.all([
          getPerson(id),
          getMemoriesForPerson(id),
          getPhotosForPerson(id),
          getRecipesForPerson(id),
          getDocumentsForPerson(id),
          getVoiceForPerson(id),
        ]);
        setPerson(p);
        setMemories(m);
        setPhotos(ph);
        setRecipes(r);
        setDocuments(d);
        setVoice(v);
      } catch {
        toast.error('Could not load this person.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!person) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Person not found"
        description="This person may have been removed from your archive."
        actionLabel="Back to people"
        actionHref="/app/people"
      />
    );
  }

  const initials = person.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sections: Section[] = [
    {
      icon: Camera,
      label: 'Photographs',
      href: '/app/photos',
      items: photos.map((p) => ({
        id: p.id,
        title: p.title ?? 'Photo',
        subtitle: p.caption,
        image: p.public_url,
      })),
      emptyTitle: 'No photographs yet',
      emptyDesc: 'Upload photos of this person to build their visual story.',
      actionLabel: 'Upload a photo',
    },
    {
      icon: BookOpen,
      label: 'Memories',
      href: '/app/memories',
      items: memories.map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.description,
      })),
      emptyTitle: 'No memories yet',
      emptyDesc: 'Add stories and moments that feature this person.',
      actionLabel: 'Add a memory',
    },
    {
      icon: UtensilsCrossed,
      label: 'Recipes',
      href: '/app/recipes',
      items: recipes.map((r) => ({ id: r.id, title: r.title })),
      emptyTitle: 'No recipes yet',
      emptyDesc: 'Connect recipes this person was known for.',
      actionLabel: 'Add a recipe',
    },
    {
      icon: FileText,
      label: 'Documents',
      href: '/app/documents',
      items: documents.map((d) => ({ id: d.id, title: d.title })),
      emptyTitle: 'No documents yet',
      emptyDesc: 'Upload letters, certificates, or notes about this person.',
      actionLabel: 'Upload a document',
    },
    {
      icon: Mic,
      label: 'Voice recordings',
      href: '/app/voice',
      items: voice.map((v) => ({ id: v.id, title: v.title })),
      emptyTitle: 'No voice recordings yet',
      emptyDesc: 'Upload audio of this person speaking or sharing stories.',
      actionLabel: 'Upload a recording',
    },
  ];

  const tagFields: { label: string; values: string[] | null }[] = [
    { label: 'Personality traits', values: person.personality_traits },
    { label: 'Favourite quotes', values: person.favourite_quotes },
    { label: 'Interests', values: person.interests },
    { label: 'Hobbies', values: person.hobbies },
    { label: 'Achievements', values: person.achievements },
    { label: 'Life lessons', values: person.life_lessons },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href="/app/people"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to people
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden border-border/70 bg-card shadow-soft">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-24 w-24 shrink-0 border border-border/60">
              {person.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.photo_url}
                  alt={person.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/15 text-2xl font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-semibold tracking-tight">
                    {person.full_name}
                  </h1>
                  {person.preferred_name && (
                    <p className="mt-1 text-muted-foreground">
                      &ldquo;{person.preferred_name}&rdquo;
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {person.relationship_to_owner && (
                  <span>{person.relationship_to_owner}</span>
                )}
                {person.occupation && <span>{person.occupation}</span>}
                {person.gender && <span>{person.gender}</span>}
                {person.date_of_birth && (
                  <span>Born {new Date(person.date_of_birth).getFullYear()}</span>
                )}
                {person.date_of_passing && (
                  <span>
                    Passed {new Date(person.date_of_passing).getFullYear()}
                  </span>
                )}
              </div>
              {person.bio && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                  {person.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tag fields */}
      {tagFields.some((t) => t.values && t.values.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tagFields.map(
            (t) =>
              t.values &&
              t.values.length > 0 && (
                <Card key={t.label} className="border-border/70 bg-card shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1.5">
                    {t.values.map((v, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-accent/20 text-accent-foreground"
                      >
                        {v}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )
          )}
        </div>
      )}

      {/* Notes */}
      {person.notes && (
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-6">
            <p className="text-sm leading-relaxed text-foreground/90">
              {person.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Create with AI */}
      <CreateWithAI sourceType="person" sourceId={person.id} sourceName={person.full_name} />

      {/* Memory-to-Media */}
      <MemoryToMedia sourceEntityType="person" sourceEntityId={person.id} sourceTitle={person.full_name} />

      {/* Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.label} className="border-border/70 bg-card shadow-soft">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <s.icon className="h-5 w-5 text-primary" />
                {s.label}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={s.href}>Add</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {s.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center">
                  <p className="font-serif text-sm font-medium">{s.emptyTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.emptyDesc}</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {s.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg bg-secondary/40 p-2.5"
                    >
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                          <s.icon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <PersonForm
        open={editOpen}
        onOpenChange={setEditOpen}
        person={person}
        onSaved={(p) => setPerson(p)}
      />
    </div>
  );
}
