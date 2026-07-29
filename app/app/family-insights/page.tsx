'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, Users, Camera, UtensilsCrossed, Landmark, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getFamilyInsights, triggerAIAnalysis } from '@/lib/ai-queries';
import type { FamilyInsights } from '@/lib/ai-types';
import { toast } from 'sonner';

export default function FamilyInsightsPage() {
  const { session, isGuest } = useAuth();
  const [insights, setInsights] = useState<FamilyInsights | null>(null);
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
      const data = await getFamilyInsights();
      setInsights(data);
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
      const result = await triggerAIAnalysis('family_insights', {}, supabaseUrl, supabaseAnonKey, session?.access_token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Family insights calculated successfully.');
        await load();
      }
    } catch {
      toast.error('Could not calculate insights.');
    } finally {
      setAnalyzing(false);
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader icon={BarChart3} title="Family Insights" description="Discover patterns and celebrate your family's preservation journey." />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">
            Sign in to view your family insights.
          </CardContent>
        </Card>
      </div>
    );
  }

  const mostDocumented = (insights?.most_documented_members as { name: string; count: number }[] | undefined) ?? [];
  const commonTraditions = (insights?.most_common_traditions as [string, number][] | undefined) ?? [];
  const locations = (insights?.frequently_visited_locations as { name: string; location: string | null }[] | undefined) ?? [];
  const mostPhotographed = insights?.most_photographed_person as { name: string; count: number } | undefined;
  const mostRecipes = insights?.most_contributed_recipes as { name: string; count: number } | undefined;
  const monthlyActivity = (insights?.monthly_activity as Record<string, number> | undefined) ?? {};
  const sortedActivity = Object.entries(monthlyActivity).sort(([a], [b]) => a.localeCompare(b)).slice(-12);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Family Insights"
        description="Discover patterns in your family's preservation journey. These insights celebrate your efforts without ranking family members against each other."
      >
        <Button onClick={handleAnalyze} disabled={analyzing || loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !insights ? (
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No insights yet. Click "Refresh Insights" to calculate.</p>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              <TrendingUp className="h-4 w-4" />
              Calculate Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Most documented */}
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Most Documented Members</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {mostDocumented.length > 0 ? (
                  <ul className="space-y-2">
                    {mostDocumented.map((m, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">{m.count} memories</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Most photographed */}
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Most Photographed</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {mostPhotographed ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{mostPhotographed.name}</span>
                    <span className="text-muted-foreground">{mostPhotographed.count} photos</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Most recipes */}
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Most Contributed Recipes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {mostRecipes ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{mostRecipes.name}</span>
                    <span className="text-muted-foreground">{mostRecipes.count} recipes</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Common traditions */}
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Most Common Traditions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {commonTraditions.length > 0 ? (
                  <ul className="space-y-2">
                    {commonTraditions.map(([when, count], i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{when}</span>
                        <span className="text-muted-foreground">{count} traditions</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Locations */}
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Frequently Visited Locations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {locations.length > 0 ? (
                  <ul className="space-y-2">
                    {locations.map((l, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{l.name}</span>
                        {l.location && <span className="text-muted-foreground"> — {l.location}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Oldest memory */}
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Oldest Preserved Memory</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {insights.oldest_memory_date ? (
                  <p className="font-serif text-lg font-semibold">{new Date(insights.oldest_memory_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No dated memories yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly activity chart */}
          {sortedActivity.length > 0 && (
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Monthly Preservation Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1.5 h-32">
                  {sortedActivity.map(([month, count]) => {
                    const maxCount = Math.max(...sortedActivity.map(([, c]) => c));
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-primary/20 hover:bg-primary/30 transition-colors" style={{ height: `${height}%` }} title={`${count} activities`} />
                        <span className="text-[10px] text-muted-foreground">{month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Last calculated: {new Date(insights.calculated_at).toLocaleDateString()}
          </p>
        </>
      )}
    </div>
  );
}
