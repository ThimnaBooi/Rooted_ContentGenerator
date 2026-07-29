'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Users, BookOpen, UtensilsCrossed, CalendarClock, MapPin, FileText, Camera, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { globalSearch, type SearchResult } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

const typeIcons: Record<string, typeof Users> = {
  person: Users,
  memory: BookOpen,
  recipe: UtensilsCrossed,
  event: CalendarClock,
  place: MapPin,
  document: FileText,
  photo: Camera,
};

const typeLabels: Record<string, string> = {
  person: 'People',
  memory: 'Memories',
  recipe: 'Recipes',
  event: 'Events',
  place: 'Places',
  document: 'Documents',
  photo: 'Photos',
};

export function GlobalSearch() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || isGuest) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await globalSearch(query);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, isGuest]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative hidden flex-1 max-w-md sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={isGuest ? 'Sign in to search your archive…' : 'Search your archive…'}
        aria-label="Search your archive"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        disabled={isGuest}
        className="bg-secondary/50 pl-9"
      />

      {open && (query.trim() || loading) && (
        <div className="absolute mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-soft-lg">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {typeLabels[type] ?? type}
                  </p>
                  {items.map((r) => {
                    const Icon = typeIcons[r.type] ?? Search;
                    return (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => {
                          router.push(r.href);
                          setOpen(false);
                          setQuery('');
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/20"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          {r.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">
                              {r.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
