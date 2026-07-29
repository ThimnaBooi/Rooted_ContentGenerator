'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, PenLine, Image as ImageIcon, Star, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRecentCreations, toggleDocumentFavourite, toggleImageFavourite } from '@/lib/studio-queries';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

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

export default function RecentPage() {
  const { isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const rec = await getRecentCreations(20);
        setDocs(rec.documents);
        setImages(rec.images);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [isGuest]);

  if (isGuest) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Recent Creations" description="Quickly access your recently generated content." />
        <EmptyState icon={Clock} title="Sign in to view recent creations" description="Create an account to start generating content." actionLabel="Create account" actionHref="/register" />
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Recent Creations" description="Quickly access recently generated content, continue editing drafts, or duplicate finished work." />

      {docs.length === 0 && images.length === 0 ? (
        <EmptyState icon={Clock} title="No creations yet" description="Start generating content in Rooted Studio to see your recent work here." actionLabel="Create content" actionHref="/app/studio/create" />
      ) : (
        <>
          {docs.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold">Recent documents</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {docs.map((d) => (
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
              </div>
            </section>
          )}

          {images.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold">Recent images</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {images.map((img) => (
                  <Link key={img.id} href={`/app/studio/images/${img.id}`}>
                    <Card className="group overflow-hidden border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                      {img.public_url ? (
                        <div className="aspect-square overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.public_url} alt={img.title} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="grid aspect-square place-items-center bg-secondary/40">
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
        </>
      )}
    </div>
  );
}
