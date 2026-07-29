'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CalendarClock, Loader2, Calendar, MapPin, BookOpen, Camera, UtensilsCrossed, Heart, FileText, User, Filter, X, AlertCircle, RefreshCw, Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { getEvents, getMemories, getPeople, getFamilies, getRecipes, getTraditions } from '@/lib/queries';
import { getTimelineGaps, updateTimelineGapStatus, triggerAIAnalysis } from '@/lib/ai-queries';
import type { FamilyEvent, Memory, Person, Family, Recipe, Tradition } from '@/lib/types';
import type { TimelineGap } from '@/lib/ai-types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TimelineEntry = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  category: string | null;
  sourceHref: string;
};

const TYPE_ICONS: Record<string, typeof CalendarClock> = {
  event: Calendar,
  memory: BookOpen,
  recipe: UtensilsCrossed,
  tradition: Heart,
  person: User,
};

export default function TimelinePage() {
  const { session, isGuest } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [timelineGaps, setTimelineGaps] = useState<TimelineGap[]>([]);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const load = useCallback(async () => {
    try {
      const [events, memories, ppl, fams, recipes, traditions] = await Promise.all([
        getEvents(),
        getMemories(),
        getPeople(),
        getFamilies(),
        getRecipes(),
        getTraditions(),
      ]);
      setPeople(ppl);
      setFamilies(fams);

      const all: TimelineEntry[] = [];
      for (const e of events) {
        all.push({
          id: e.id, type: 'event', title: e.title, description: e.description,
          date: e.event_date, location: e.location, category: e.event_type,
          sourceHref: '/app/events',
        });
      }
      for (const m of memories) {
        all.push({
          id: m.id, type: 'memory', title: m.title, description: m.description,
          date: m.memory_date, location: m.location, category: m.emotional_category,
          sourceHref: '/app/memories',
        });
      }
      for (const r of recipes) {
        all.push({
          id: r.id, type: 'recipe', title: r.title, description: null,
          date: r.created_at.slice(0, 10), location: null, category: null,
          sourceHref: '/app/recipes',
        });
      }
      for (const t of traditions) {
        all.push({
          id: t.id, type: 'tradition', title: t.title, description: t.description,
          date: t.created_at.slice(0, 10), location: null, category: null,
          sourceHref: '/app/traditions',
        });
      }
      for (const p of ppl) {
        if (p.date_of_birth) {
          all.push({
            id: `birth-${p.id}`, type: 'person', title: `${p.full_name} was born`,
            description: null, date: p.date_of_birth, location: null,
            category: 'birth', sourceHref: `/app/people/${p.id}`,
          });
        }
      }

      all.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
      setEntries(all);
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

  const loadGaps = useCallback(async () => {
    if (!session || isGuest) return;
    try {
      const gaps = await getTimelineGaps('pending');
      setTimelineGaps(gaps);
    } catch {
      // ignore
    }
  }, [session, isGuest]);

  useEffect(() => {
    loadGaps();
  }, [loadGaps]);

  async function handleAnalyzeTimeline() {
    if (!session || isGuest) return;
    setAnalyzingGaps(true);
    try {
      const result = await triggerAIAnalysis('timeline_analysis', {}, supabaseUrl, supabaseAnonKey, session?.access_token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Timeline analysis complete.');
        await loadGaps();
      }
    } catch {
      toast.error('Could not analyze timeline.');
    } finally {
      setAnalyzingGaps(false);
    }
  }

  async function handleGapAction(id: string, action: 'documented' | 'dismissed' | 'review_later') {
    try {
      await updateTimelineGapStatus(id, action);
      setTimelineGaps(timelineGaps.filter((g) => g.id !== id));
    } catch {
      // ignore
    }
  }

  const years = useMemo(() => {
    const ys = new Set<string>();
    for (const e of entries) {
      if (e.date) ys.add(e.date.slice(0, 4));
    }
    return Array.from(ys).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterYear !== 'all' && (!e.date || e.date.slice(0, 4) !== filterYear)) return false;
      return true;
    });
  }, [entries, filterType, filterYear]);

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader title="Timeline" description="Your family's story laid out across time — births, milestones, journeys, and the quiet moments in between." />
        <EmptyState icon={CalendarClock} title="Sign in to see your timeline" description="Create an account to explore your family chronology." actionLabel="Create your account" actionHref="/register" />
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

  const hasFilters = filterType !== 'all' || filterYear !== 'all';

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Timeline"
        description="Your family's story laid out across time — memories, milestones, recipes, traditions, and the quiet moments in between."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filter:
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-36 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="memory">Memories</SelectItem>
            <SelectItem value="recipe">Recipes</SelectItem>
            <SelectItem value="tradition">Traditions</SelectItem>
            <SelectItem value="person">People</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="h-9 w-28 text-xs">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => { setFilterType('all'); setFilterYear('all'); }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Timeline Intelligence */}
      {!isGuest && (
        <Card className="border-accent/20 bg-accent/5 shadow-soft">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent-foreground" />
                <h3 className="font-serif text-sm font-semibold">Timeline Intelligence</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleAnalyzeTimeline} disabled={analyzingGaps}>
                <RefreshCw className={`h-3.5 w-3.5 ${analyzingGaps ? 'animate-spin' : ''}`} />
                Analyze
              </Button>
            </div>
            {timelineGaps.length === 0 ? (
              <p className="text-xs text-muted-foreground">No gaps detected. Click "Analyze" to check for missing years.</p>
            ) : (
              <div className="space-y-2">
                {timelineGaps.map((gap) => (
                  <div key={gap.id} className="rounded-lg bg-card/60 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{gap.gap_description}</p>
                        {gap.surrounding_context && <p className="text-xs text-muted-foreground mt-0.5">{gap.surrounding_context}</p>}
                        <div className="flex gap-1.5 mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleGapAction(gap.id, 'documented')}>
                            Document
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleGapAction(gap.id, 'dismissed')}>
                            Dismiss
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleGapAction(gap.id, 'review_later')}>
                            Later
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={hasFilters ? "No entries match your filters" : "Your timeline is empty"}
          description={hasFilters ? "Try adjusting your filters to see more entries." : "As you add events, memories, and traditions, your family chronology will take shape here."}
          actionLabel={hasFilters ? undefined : "Record your first event"}
          actionHref={hasFilters ? undefined : "/app/events"}
          className="border-solid"
        />
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
          <ul className="space-y-6">
            {filtered.map((e) => {
              const Icon = TYPE_ICONS[e.type] ?? CalendarClock;
              return (
                <li key={`${e.type}-${e.id}`} className="relative pl-14">
                  <div className="absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-full border-2 border-background bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Link href={e.sourceHref}>
                    <Card className="border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-base font-semibold">{e.title}</h3>
                            {e.category && (
                              <Badge variant="secondary" className="mt-1.5 bg-accent/20 text-accent-foreground capitalize">
                                {e.type}: {e.category}
                              </Badge>
                            )}
                          </div>
                          {e.date && (
                            <span className="shrink-0 text-sm font-medium text-muted-foreground">
                              {new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {e.description && (
                          <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
                        )}
                        {e.location && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {e.location}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
