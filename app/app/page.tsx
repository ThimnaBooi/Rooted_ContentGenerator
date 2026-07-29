'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Users,
  UtensilsCrossed,
  Upload,
  Landmark,
  PenLine,
  Archive,
  Clock,
  Sparkles,
  FolderOpen,
  ArrowRight,
  Eye,
  Camera,
  FileText,
  BookOpen,
  CalendarClock,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/app/empty-state';
import {
  getDashboardSummary,
  getPeople,
  getMemories,
  getPhotos,
  getRecipes,
  getDocuments,
  getActivities,
} from '@/lib/queries';
import type { Person, Memory, Photo, Recipe, Document, Activity } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const quickActions = [
  { icon: UserPlus, label: 'Add a Person', href: '/app/people', description: 'Begin a life story', accent: 'bg-primary/10 text-primary' },
  { icon: Users, label: 'Create a Family', href: '/app/families', description: 'Connect your people', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: UtensilsCrossed, label: 'Add a Recipe', href: '/app/recipes', description: 'Keep a family favourite', accent: 'bg-highlight/15 text-highlight' },
  { icon: Upload, label: 'Upload Memories', href: '/app/memories', description: 'Add photos and moments', accent: 'bg-primary/10 text-primary' },
  { icon: Landmark, label: 'Preserve a Tradition', href: '/app/traditions', description: 'Document a custom', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: PenLine, label: 'Write a Letter', href: '/app/memories', description: 'Write to the future', accent: 'bg-highlight/15 text-highlight' },
  { icon: Archive, label: 'View Archive', href: '/app/archive', description: 'Browse everything', accent: 'bg-primary/10 text-primary' },
];

const summaryCards: { key: keyof Summary; label: string; icon: LucideIcon; href: string }[] = [
  { key: 'people', label: 'People', icon: Users, href: '/app/people' },
  { key: 'memories', label: 'Memories', icon: BookOpen, href: '/app/memories' },
  { key: 'photos', label: 'Photos', icon: Camera, href: '/app/photos' },
  { key: 'recipes', label: 'Recipes', icon: UtensilsCrossed, href: '/app/recipes' },
  { key: 'traditions', label: 'Traditions', icon: Landmark, href: '/app/traditions' },
  { key: 'events', label: 'Events', icon: CalendarClock, href: '/app/events' },
];

type Summary = {
  people: number;
  memories: number;
  photos: number;
  recipes: number;
  traditions: number;
  events: number;
};

const activityIcons: Record<string, LucideIcon> = {
  person: Users,
  memory: BookOpen,
  photo: Camera,
  recipe: UtensilsCrossed,
  tradition: Landmark,
  event: CalendarClock,
  document: FileText,
  voice: Camera,
  family: Users,
};

const activityVerbs: Record<string, string> = {
  created: 'Added',
  uploaded: 'Uploaded',
  updated: 'Updated',
  deleted: 'Removed',
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function DashboardPage() {
  const { user, isGuest } = useAuth();
  const name = user?.user_metadata?.full_name || (isGuest ? 'Friend' : 'there');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentPeople, setRecentPeople] = useState<Person[]>([]);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [sum, ppl, mem, pho, rec, doc, act] = await Promise.all([
          getDashboardSummary(),
          getPeople(),
          getMemories(),
          getPhotos(),
          getRecipes(),
          getDocuments(),
          getActivities(15),
        ]);
        setSummary(sum);
        setRecentPeople(ppl.slice(0, 4));
        setRecentMemories(mem.slice(0, 3));
        setRecentPhotos(pho.slice(0, 6));
        setRecentRecipes(rec.slice(0, 3));
        setRecentDocs(doc.slice(0, 3));
        setActivities(act);
      } catch {
        toast.error('Could not load your dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isGuest]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Welcome */}
      <section className="animate-fade-up">
        <p className="text-sm font-medium text-muted-foreground">{greeting},</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome to Rooted, {name}.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          This is your family archive — a warm, living space for the stories,
          traditions, and memories that shape who you are. Everything begins with
          a single memory.
        </p>
      </section>

      {isGuest ? (
        <EmptyState
          icon={FolderOpen}
          title="Your archive is waiting"
          description="You're exploring as a guest. Create an account to start preserving stories, photos, recipes, and traditions for future generations."
          actionLabel="Create your account"
          actionHref="/register"
        />
      ) : (
        <>
          {/* Summary cards */}
          <section className="animate-fade-up [animation-delay:40ms]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {summaryCards.map((s) => (
                <Link key={s.key} href={s.href}>
                  <Card className="border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                    <CardContent className="p-4">
                      <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <s.icon className="h-4 w-4" />
                      </div>
                      <p className="font-serif text-2xl font-semibold">
                        {summary?.[s.key] ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="animate-fade-up [animation-delay:80ms]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Quick actions</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((a) => (
                <Link key={a.label} href={a.href} className="group">
                  <Card className="h-full border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${a.accent}`}>
                        <a.icon className="h-5 w-5" />
                      </div>
                      <p className="font-serif text-base font-semibold">{a.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                      <div className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent + Activity */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Recent people */}
            <Card className="border-border/70 bg-card shadow-soft animate-fade-up [animation-delay:160ms]">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Recent people</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/people">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentPeople.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No people added yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recentPeople.map((p) => {
                      const initials = p.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/app/people/${p.id}`}
                            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/60"
                          >
                            <Avatar className="h-9 w-9 border border-border/60">
                              {p.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.photo_url}
                                  alt={p.full_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                                  {initials}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.full_name}</p>
                              {p.relationship_to_owner && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {p.relationship_to_owner}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recent memories */}
            <Card className="border-border/70 bg-card shadow-soft animate-fade-up [animation-delay:200ms]">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Recent memories</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/memories">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentMemories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No memories yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recentMemories.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-lg bg-secondary/40 p-2.5"
                      >
                        <p className="truncate text-sm font-medium">{m.title}</p>
                        {m.description && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {m.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Activity feed */}
            <Card className="border-border/70 bg-card shadow-soft animate-fade-up [animation-delay:240ms]">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Your activity will appear here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {activities.map((a) => {
                      const Icon = activityIcons[a.entity_type] ?? Sparkles;
                      const verb = activityVerbs[a.action] ?? a.action;
                      return (
                        <li key={a.id} className="flex items-start gap-2.5">
                          <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">{verb}</span>{' '}
                              <span className="font-medium">{a.entity_title ?? a.entity_type}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo(a.created_at)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Recent photos */}
          {recentPhotos.length > 0 && (
            <section className="animate-fade-up [animation-delay:280ms]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">Recent photos</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/photos">View all</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {recentPhotos.map((p) => (
                  <Link key={p.id} href="/app/photos">
                    <Card className="overflow-hidden border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                      <div className="aspect-square overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.public_url}
                          alt={p.title ?? 'Photo'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent recipes + documents */}
          {(recentRecipes.length > 0 || recentDocs.length > 0) && (
            <section className="grid gap-6 lg:grid-cols-2">
              {recentRecipes.length > 0 && (
                <Card className="border-border/70 bg-card shadow-soft animate-fade-up">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">Recent recipes</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/app/recipes">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recentRecipes.map((r) => (
                        <li key={r.id} className="rounded-lg bg-secondary/40 p-2.5">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          {r.created_by && (
                            <p className="text-xs text-muted-foreground">By {r.created_by}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {recentDocs.length > 0 && (
                <Card className="border-border/70 bg-card shadow-soft animate-fade-up">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">Recent documents</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/app/documents">View all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recentDocs.map((d) => (
                        <li key={d.id} className="rounded-lg bg-secondary/40 p-2.5">
                          <p className="truncate text-sm font-medium">{d.title}</p>
                          {d.category && (
                            <p className="text-xs capitalize text-muted-foreground">
                              {d.category}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
