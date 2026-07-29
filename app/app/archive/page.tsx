'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Camera,
  UtensilsCrossed,
  Landmark,
  CalendarClock,
  FileText,
  MapPin,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getPeople,
  getMemories,
  getPhotos,
  getRecipes,
  getTraditions,
  getEvents,
  getDocuments,
  getPlaces,
} from '@/lib/queries';
import type {
  Person,
  Memory,
  Photo,
  Recipe,
  Tradition,
  FamilyEvent,
  Document,
  Place,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Entity = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  image?: string | null;
  date?: string | null;
  href: string;
};

const typeIcons: Record<string, typeof Users> = {
  person: Users,
  memory: BookOpen,
  photo: Camera,
  recipe: UtensilsCrossed,
  tradition: Landmark,
  event: CalendarClock,
  document: FileText,
  place: MapPin,
};

const typeLabels: Record<string, string> = {
  person: 'People',
  memory: 'Memories',
  photo: 'Photos',
  recipe: 'Recipes',
  tradition: 'Traditions',
  event: 'Events',
  document: 'Documents',
  place: 'Places',
};

export default function ArchiveExplorerPage() {
  const [all, setAll] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [people, memories, photos, recipes, traditions, events, documents, places] =
          await Promise.all([
            getPeople(),
            getMemories(),
            getPhotos(),
            getRecipes(),
            getTraditions(),
            getEvents(),
            getDocuments(),
            getPlaces(),
          ]);

        const entities: Entity[] = [
          ...people.map((p: Person) => ({
            id: p.id,
            type: 'person',
            title: p.full_name,
            subtitle: p.preferred_name ?? p.relationship_to_owner ?? null,
            image: p.photo_url,
            date: p.created_at,
            href: `/app/people/${p.id}`,
          })),
          ...memories.map((m: Memory) => ({
            id: m.id,
            type: 'memory',
            title: m.title,
            subtitle: m.description ?? null,
            date: m.created_at,
            href: '/app/memories',
          })),
          ...photos.map((p: Photo) => ({
            id: p.id,
            type: 'photo',
            title: p.title ?? 'Photo',
            subtitle: p.caption ?? null,
            image: p.public_url,
            date: p.created_at,
            href: '/app/photos',
          })),
          ...recipes.map((r: Recipe) => ({
            id: r.id,
            type: 'recipe',
            title: r.title,
            subtitle: r.created_by ?? null,
            date: r.created_at,
            href: '/app/recipes',
          })),
          ...traditions.map((t: Tradition) => ({
            id: t.id,
            type: 'tradition',
            title: t.title,
            subtitle: t.description ?? null,
            date: t.created_at,
            href: '/app/traditions',
          })),
          ...events.map((e: FamilyEvent) => ({
            id: e.id,
            type: 'event',
            title: e.title,
            subtitle: e.event_type ?? null,
            date: e.event_date ?? e.created_at,
            href: '/app/events',
          })),
          ...documents.map((d: Document) => ({
            id: d.id,
            type: 'document',
            title: d.title,
            subtitle: d.category ?? null,
            date: d.created_at,
            href: '/app/documents',
          })),
          ...places.map((p: Place) => ({
            id: p.id,
            type: 'place',
            title: p.name,
            subtitle: p.location ?? null,
            date: p.created_at,
            href: '/app/places',
          })),
        ];
        setAll(entities);
      } catch {
        toast.error('Could not load archive.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = all;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.subtitle?.toLowerCase().includes(q) ?? false)
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }
    result = [...result].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime();
      }
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [all, query, typeFilter, sortBy]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    all.forEach((e) => {
      c[e.type] = (c[e.type] ?? 0) + 1;
    });
    return c;
  }, [all]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Archive Explorer"
        description="Browse everything you've preserved — people, memories, recipes, traditions, events, documents, and places. Search, filter, and sort to find any thread of your story."
      />

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your archive…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label} ({counts[value] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="alpha">A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            typeFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:bg-accent/20'
          )}
        >
          All ({all.length})
        </button>
        {Object.entries(typeLabels).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              typeFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-accent/20'
            )}
          >
            {label} ({counts[value] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={all.length === 0 ? 'Your archive is waiting' : 'No results found'}
          description={
            all.length === 0
              ? 'Start preserving stories that future generations will treasure. Your first memory is just a moment away.'
              : 'Try a different search term or filter.'
          }
          actionLabel={all.length === 0 ? 'Create your first story' : undefined}
          actionHref={all.length === 0 ? '/app/memories' : undefined}
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => {
            const Icon = typeIcons[e.type] ?? Search;
            return (
              <Link key={`${e.type}-${e.id}`} href={e.href}>
                <Card className="group h-full overflow-hidden border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                  {e.image ? (
                    <div className="aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.image}
                        alt={e.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                        {typeLabels[e.type]}
                      </Badge>
                    </div>
                    <p className="mt-2 truncate font-serif text-sm font-semibold">
                      {e.title}
                    </p>
                    {e.subtitle && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {e.subtitle}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
