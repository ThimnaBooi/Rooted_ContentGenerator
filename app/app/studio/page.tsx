'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  PenLine,
  Image as ImageIcon,
  FolderOpen,
  Clock,
  Star,
  BookOpen,
  Mic,
  Heart,
  Gift,
  ArrowRight,
  Layers,
  FileText,
  Loader2,
  Headphones,
  Video,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import { getRecentCreations, getFavourites } from '@/lib/studio-queries';
import { AIRecommendations } from '@/components/app/studio/ai-recommendations';
import { toast } from 'sonner';

const quickActions = [
  { icon: PenLine, label: 'Write a Biography', href: '/app/studio/create?type=biography', accent: 'bg-primary/10 text-primary' },
  { icon: BookOpen, label: 'Create a Storybook', href: '/app/studio/create?type=childrens_storybook', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: Mic, label: 'Write a Speech', href: '/app/studio/create?type=tribute_speech', accent: 'bg-primary/10 text-primary' },
  { icon: ImageIcon, label: 'Generate Artwork', href: '/app/studio/create-image', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: Headphones, label: 'Generate Audio', href: '/app/studio/create-audio', accent: 'bg-primary/10 text-primary' },
  { icon: Video, label: 'Generate Video', href: '/app/studio/create-video', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: Heart, label: 'Write a Letter', href: '/app/studio/create?type=legacy_letter', accent: 'bg-primary/10 text-primary' },
  { icon: Gift, label: 'Create a Keepsake', href: '/app/studio/create?type=printable_keepsake', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: Share2, label: 'Social Media Studio', href: '/app/studio/social', accent: 'bg-primary/10 text-primary' },
];

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

export default function StudioPage() {
  const { isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<{ documents: any[]; images: any[] }>({ documents: [], images: [] });
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [rec, favs] = await Promise.all([getRecentCreations(6), getFavourites()]);
        setRecent(rec);
        setFavCount(favs.documents.length + favs.images.length + favs.projects.length);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [isGuest]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        title="Rooted Studio"
        description="Transform your preserved memories into beautifully written documents and meaningful artwork. Every creation is yours to edit, save, or discard — you're always in control."
      />

      {isGuest ? (
        <EmptyState
          icon={Sparkles}
          title="Studio is available for registered users"
          description="Create an account to start generating biographies, speeches, storybooks, and artwork from your family archive."
          actionLabel="Create your account"
          actionHref="/register"
        />
      ) : (
        <>
          {/* Quick actions */}
          <section className="animate-fade-up">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((a) => (
                <Link key={a.label} href={a.href} className="group">
                  <Card className="h-full border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${a.accent}`}>
                        <a.icon className="h-5 w-5" />
                      </div>
                      <p className="font-serif text-base font-semibold">{a.label}</p>
                      <div className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Start
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* AI Recommendations */}
          <AIRecommendations />

          {/* Navigation cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/app/studio/media-library">
              <Card className="border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-serif text-sm font-semibold">Media Library</p>
                    <p className="text-xs text-muted-foreground">All generated media</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/app/studio/projects">
              <Card className="border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/20 text-accent-foreground">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-serif text-sm font-semibold">Projects</p>
                    <p className="text-xs text-muted-foreground">Group creations together</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/app/studio/templates">
              <Card className="border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-serif text-sm font-semibold">Templates</p>
                    <p className="text-xs text-muted-foreground">Professional layouts</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/app/studio/recent">
              <Card className="border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/20 text-accent-foreground">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-serif text-sm font-semibold">Favourites</p>
                    <p className="text-xs text-muted-foreground">{favCount} saved</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </section>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Recent creations */}
              {(recent.documents.length > 0 || recent.images.length > 0) && (
                <section className="animate-fade-up [animation-delay:80ms]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Recent creations
                    </h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/app/studio/recent">View all</Link>
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recent.documents.slice(0, 3).map((d: any) => (
                      <Link key={d.id} href={`/app/studio/editor/${d.id}`}>
                        <Card className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                                <PenLine className="h-4 w-4" />
                              </div>
                              {d.is_favourite && <Star className="h-3.5 w-3.5 fill-accent text-accent" />}
                            </div>
                            <p className="mt-2 truncate font-serif text-sm font-semibold">{d.title}</p>
                            <p className="mt-0.5 text-xs capitalize text-muted-foreground">{d.content_type.replace(/_/g, ' ')}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{timeAgo(d.updated_at)}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    {recent.images.slice(0, 3).map((img: any) => (
                      <Link key={img.id} href={`/app/studio/images/${img.id}`}>
                        <Card className="group overflow-hidden border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                          {img.public_url ? (
                            <div className="aspect-video overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.public_url} alt={img.title} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="grid aspect-video place-items-center bg-secondary/40">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <CardContent className="p-3">
                            <p className="truncate text-sm font-medium">{img.title}</p>
                            <p className="text-xs text-muted-foreground">{timeAgo(img.created_at)}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {recent.documents.length === 0 && recent.images.length === 0 && (
                <EmptyState
                  icon={Sparkles}
                  title="Your studio is ready"
                  description="Start by choosing what you'd like to create. The AI will use only the memories and information you've preserved in your archive — nothing is invented."
                  actionLabel="Create your first piece"
                  actionHref="/app/studio/create"
                  className="border-solid"
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
