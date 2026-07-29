'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FolderOpen, Loader2, Trash2, Star, Search, Archive, ArchiveRestore, Download,
  FileText, Image as ImageIcon, Headphones, Video, Share2, Send, Globe,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getMediaLibraryItems, deleteMediaLibraryItem, updateMediaLibraryItem,
} from '@/lib/media-queries';
import { MEDIA_CATEGORIES } from '@/lib/media-types';
import type { MediaLibraryItem } from '@/lib/media-types';
import { cn } from '@/lib/utils';

function categoryIcon(category: string) {
  switch (category) {
    case 'text': return FileText;
    case 'image': return ImageIcon;
    case 'audio': return Headphones;
    case 'video': return Video;
    case 'social_draft': return Share2;
    case 'downloaded': return Download;
    case 'published': return Globe;
    default: return FolderOpen;
  }
}

export default function MediaLibraryPage() {
  const { session, isGuest } = useAuth();
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMediaLibraryItems();
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isGuest && session) load();
    else setLoading(false);
  }, [session, isGuest, load]);

  async function handleDelete(id: string) {
    try {
      await deleteMediaLibraryItem(id);
      toast.success('Item permanently deleted.');
      await load();
    } catch {
      toast.error('Could not delete item.');
    }
  }

  async function handleArchive(id: string, archive: boolean) {
    try {
      await updateMediaLibraryItem(id, { is_archived: archive });
      await load();
    } catch {
      toast.error('Could not archive item.');
    }
  }

  async function handleFavourite(id: string, fav: boolean) {
    try {
      await updateMediaLibraryItem(id, { is_favourite: fav });
      await load();
    } catch {
      // ignore
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!showArchived && item.is_archived) return false;
      if (showArchived && !item.is_archived) return false;
      if (activeCategory !== 'all' && item.media_category !== activeCategory) return false;
      if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, activeCategory, searchQuery, showArchived]);

  if (isGuest) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <PageHeader title="Media Library" description="All your generated content in one place — text, images, audio, video, social drafts, and published content." />
        <EmptyState icon={FolderOpen} title="Sign in to see your media library" description="Create an account to access your generated content library." actionLabel="Create your account" actionHref="/register" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const categoryCounts = items.reduce((acc, item) => {
    if (!item.is_archived) {
      acc[item.media_category] = (acc[item.media_category] ?? 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Media Library"
        description="All your generated content in one place — text, images, audio, videos, social media drafts, and published content. Search, filter, archive, and manage everything you've created."
      />

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your media…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          {showArchived ? 'Show Active' : 'Show Archived'}
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip label="All" count={items.filter((i) => !i.is_archived).length} active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
        {MEDIA_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.value}
            label={cat.label}
            count={categoryCounts[cat.value] ?? 0}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={showArchived ? "No archived items" : "Your media library is empty"}
          description={showArchived ? "Archived items will appear here." : "As you generate text, images, audio, and video in Rooted Studio, they'll appear here for easy access and management."}
          actionLabel={showArchived ? undefined : "Create something"}
          actionHref={showArchived ? undefined : "/app/studio"}
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, idx) => {
            const Icon = categoryIcon(item.media_category);
            return (
              <Card
                key={item.id}
                className={cn(
                  'group animate-fade-up border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg',
                  item.is_archived && 'opacity-60'
                )}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleFavourite(item.id, !item.is_favourite)}>
                        <Star className={cn('h-3.5 w-3.5', item.is_favourite && 'fill-accent text-accent')} />
                      </Button>
                      {!item.is_archived ? (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => handleArchive(item.id, true)}>
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => handleArchive(item.id, false)}>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium">{item.title}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {MEDIA_CATEGORIES.find((c) => c.value === item.media_category)?.label ?? item.media_category}
                  </Badge>
                  {item.public_url && (
                    <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1.5 text-xs" asChild>
                      <a href={item.public_url} download><Download className="h-3 w-3" /> Download</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card/50 text-muted-foreground hover:bg-muted'
      )}
    >
      {label}
      <span className={cn(
        'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]',
        active ? 'bg-primary-foreground/20' : 'bg-muted'
      )}>
        {count}
      </span>
    </button>
  );
}
