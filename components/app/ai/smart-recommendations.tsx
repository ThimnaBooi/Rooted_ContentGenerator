'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Lightbulb, X, ArrowRight, RefreshCw, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfidenceBadge, ExplanationBox } from '@/components/app/ai/confidence-badge';
import { useAuth } from '@/components/providers/auth-provider';
import { getAISuggestions, dismissAISuggestion, acceptAISuggestion, reviewLaterAISuggestion, triggerAIAnalysis } from '@/lib/ai-queries';
import type { AISuggestion } from '@/lib/ai-types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SmartRecommendations({ className }: { className?: string }) {
  const { session, isGuest } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const load = useCallback(async () => {
    if (!session || isGuest) {
      setLoading(false);
      return;
    }
    try {
      const data = await getAISuggestions('pending');
      setSuggestions(data.slice(0, 6));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleScan() {
    if (!session || isGuest) return;
    setScanning(true);
    try {
      const result = await triggerAIAnalysis('smart_recommendations', {}, supabaseUrl, supabaseAnonKey, session?.access_token);
      if (result.error) {
        toast.error(result.error);
      } else {
        await load();
      }
    } catch {
      toast.error('Could not generate recommendations.');
    } finally {
      setScanning(false);
    }
  }

  async function handleAction(id: string, action: 'dismissed' | 'accepted' | 'review_later') {
    try {
      if (action === 'dismissed') await dismissAISuggestion(id);
      else if (action === 'accepted') await acceptAISuggestion(id);
      else await reviewLaterAISuggestion(id);
      setSuggestions(suggestions.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  }

  if (isGuest || loading || suggestions.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent-foreground" />
          <h2 className="font-serif text-lg font-semibold">Smart Recommendations</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleScan} disabled={scanning}>
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {suggestions.map((sug) => (
        <Card key={sug.id} className="group border-accent/20 bg-accent/5 shadow-soft">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent-foreground">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{sug.title}</p>
                  {sug.description && <p className="mt-0.5 text-xs text-muted-foreground">{sug.description}</p>}
                </div>
              </div>
              <ConfidenceBadge level={sug.confidence} score={sug.confidence_score} />
            </div>
            <ExplanationBox explanation={sug.explanation} />
            <div className="flex flex-wrap items-center gap-2">
              {sug.action_label && sug.action_href && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <Link href={sug.action_href}>
                    {sug.action_label} <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction(sug.id, 'accepted')}>
                <Check className="h-3 w-3" /> Got it
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAction(sug.id, 'review_later')}>
                <Clock className="h-3 w-3" /> Later
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => handleAction(sug.id, 'dismissed')}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
