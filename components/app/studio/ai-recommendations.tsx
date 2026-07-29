'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, X, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { getAIRecommendations, dismissAIRecommendation, generateRecommendations } from '@/lib/media-queries';
import { getDashboardSummary } from '@/lib/queries';
import type { AIRecommendation } from '@/lib/media-types';
import { cn } from '@/lib/utils';

export function AIRecommendations({ className }: { className?: string }) {
  const { session, isGuest } = useAuth();
  const [recs, setRecs] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session || isGuest) {
      setLoading(false);
      return;
    }
    try {
      // Generate fresh recommendations based on current archive content
      const summary = await getDashboardSummary();
      await generateRecommendations({
        people: summary.people,
        memories: summary.memories,
        photos: summary.photos,
        recipes: summary.recipes,
        traditions: summary.traditions,
        events: summary.events,
        documents: 0,
        voice: 0,
      });
      const data = await getAIRecommendations();
      setRecs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDismiss(id: string) {
    try {
      await dismissAIRecommendation(id);
      setRecs(recs.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  }

  if (isGuest || loading || recs.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent-foreground" />
        <h2 className="font-serif text-lg font-semibold">AI Suggestions</h2>
      </div>
      {recs.map((rec) => (
        <Card key={rec.id} className="group border-accent/20 bg-accent/5 shadow-soft">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{rec.title}</p>
                {rec.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{rec.description}</p>
                )}
                {rec.action_label && rec.action_href && (
                  <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs" asChild>
                    <Link href={rec.action_href}>
                      {rec.action_label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => handleDismiss(rec.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
