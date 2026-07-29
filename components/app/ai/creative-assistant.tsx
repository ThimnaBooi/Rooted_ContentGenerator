'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { getAISuggestions, dismissAISuggestion, triggerAIAnalysis } from '@/lib/ai-queries';
import type { AISuggestion } from '@/lib/ai-types';
import { cn } from '@/lib/utils';

export function CreativeAssistant({ className }: { className?: string }) {
  const { session, isGuest } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const load = useCallback(async () => {
    if (!session || isGuest) return;
    try {
      const data = await getAISuggestions('pending');
      const creative = data.filter((s) => s.suggestion_type === 'creative_recommendation').slice(0, 3);
      setSuggestions(creative);
    } catch {
      // ignore
    }
  }, [session, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDismiss(id: string) {
    try {
      await dismissAISuggestion(id);
      setSuggestions(suggestions.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  }

  if (isGuest || suggestions.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-foreground" />
        <h2 className="font-serif text-lg font-semibold">Creative Assistant</h2>
      </div>
      {suggestions.map((sug) => (
        <Card key={sug.id} className="group border-accent/20 bg-accent/5 shadow-soft">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{sug.title}</p>
                {sug.description && <p className="mt-0.5 text-xs text-muted-foreground">{sug.description}</p>}
                {sug.action_label && sug.action_href && (
                  <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs" asChild>
                    <Link href={sug.action_href}>
                      {sug.action_label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => handleDismiss(sug.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
