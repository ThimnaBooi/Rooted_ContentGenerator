'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse, Users, BookOpen, Camera, UtensilsCrossed, Landmark,
  FileText, Mic, MapPin, CalendarClock, RefreshCw, TrendingUp, AlertCircle, Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getArchiveHealth, triggerAIAnalysis } from '@/lib/ai-queries';
import type { ArchiveHealth } from '@/lib/ai-types';
import { toast } from 'sonner';

export default function ArchiveHealthPage() {
  const { session, isGuest } = useAuth();
  const [health, setHealth] = useState<ArchiveHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const load = useCallback(async () => {
    if (!session || isGuest) {
      setLoading(false);
      return;
    }
    try {
      const data = await getArchiveHealth();
      setHealth(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAnalyze() {
    if (!session || isGuest) return;
    setAnalyzing(true);
    try {
      const result = await triggerAIAnalysis('archive_health', {}, supabaseUrl, supabaseAnonKey, session?.access_token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Archive health analyzed successfully.');
        await load();
      }
    } catch {
      toast.error('Could not analyze archive health.');
    } finally {
      setAnalyzing(false);
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader icon={HeartPulse} title="Archive Health" description="Understand the completeness of your family archive." />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">
            Sign in to view your archive health.
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: 'People', value: health?.total_people ?? 0, icon: Users, href: '/app/people' },
    { label: 'Memories', value: health?.total_memories ?? 0, icon: BookOpen, href: '/app/memories' },
    { label: 'Photos', value: health?.total_photos ?? 0, icon: Camera, href: '/app/photos' },
    { label: 'Recipes', value: health?.total_recipes ?? 0, icon: UtensilsCrossed, href: '/app/recipes' },
    { label: 'Traditions', value: health?.total_traditions ?? 0, icon: Landmark, href: '/app/traditions' },
    { label: 'Events', value: health?.total_events ?? 0, icon: CalendarClock, href: '/app/events' },
    { label: 'Documents', value: health?.total_documents ?? 0, icon: FileText, href: '/app/documents' },
    { label: 'Voice', value: health?.total_voice_recordings ?? 0, icon: Mic, href: '/app/voice' },
    { label: 'Places', value: health?.total_places ?? 0, icon: MapPin, href: '/app/places' },
  ];

  const recommendations = (health?.recommendations as string[] | undefined) ?? [];
  const timelineCoverage = health?.timeline_coverage as { minYear: number | null; maxYear: number | null; totalDatedItems: number } | undefined;
  const missingGens = (health?.missing_generations as string[] | undefined) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        icon={HeartPulse}
        title="Archive Health"
        description="Understand the completeness of your family archive. These insights help you identify what's missing — not to pressure you, but to gently guide your preservation journey."
      >
        <Button onClick={handleAnalyze} disabled={analyzing || loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !health ? (
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No analysis yet. Click "Refresh Analysis" to calculate your archive health.</p>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              <TrendingUp className="h-4 w-4" />
              Run First Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile completeness */}
          <Card className="border-border/70 bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">How complete are your person profiles?</span>
                <span className="font-serif text-2xl font-semibold">{health.profile_completeness_pct}%</span>
              </div>
              <Progress value={health.profile_completeness_pct} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{health.complete_profiles} complete profiles</span>
                <span>{health.incomplete_profiles} need more details</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label} className="border-border/70 bg-card shadow-soft">
                <CardContent className="p-4">
                  <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <p className="font-serif text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeline coverage */}
          {timelineCoverage && (
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Timeline Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Earliest documented year:</span>
                  <span className="font-medium">{timelineCoverage.minYear ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Most recent documented year:</span>
                  <span className="font-medium">{timelineCoverage.maxYear ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total dated items:</span>
                  <span className="font-medium">{timelineCoverage.totalDatedItems ?? 0}</span>
                </div>
                {missingGens.length > 0 && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Possible gaps around: {missingGens.join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-accent/20 bg-accent/5 shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-accent-foreground" />
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-foreground" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Last analyzed: {new Date(health.calculated_at).toLocaleDateString()}
          </p>
        </>
      )}
    </div>
  );
}
