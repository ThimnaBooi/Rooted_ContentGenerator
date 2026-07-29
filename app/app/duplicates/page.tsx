'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, GitMerge, Eye, X, Clock } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge, ExplanationBox } from '@/components/app/ai/confidence-badge';
import { getDuplicateReviews, updateDuplicateReviewStatus, triggerAIAnalysis } from '@/lib/ai-queries';
import type { DuplicateReview } from '@/lib/ai-types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DuplicatesPage() {
  const { session, isGuest } = useAuth();
  const [duplicates, setDuplicates] = useState<DuplicateReview[]>([]);
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
      const data = await getDuplicateReviews('pending');
      setDuplicates(data);
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
    setAnalyzing(true);
    try {
      const result = await triggerAIAnalysis('duplicate_detection', {}, supabaseUrl, supabaseAnonKey, session?.access_token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Duplicate scan complete.');
        await load();
      }
    } catch {
      toast.error('Could not scan for duplicates.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAction(id: string, action: 'merged' | 'ignored' | 'review_later') {
    try {
      await updateDuplicateReviewStatus(id, action);
      setDuplicates(duplicates.filter((d) => d.id !== id));
      if (action === 'merged') toast.success('Marked as merged.');
      else if (action === 'ignored') toast.success('Ignored.');
      else toast.success('Saved for later review.');
    } catch {
      toast.error('Could not update.');
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader icon={Copy} title="Duplicate Detection" description="AI helps find possible duplicates in your archive." />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">Sign in to use duplicate detection.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={Copy}
        title="Duplicate Detection"
        description="The AI scans your archive for possible duplicate people, memories, recipes, traditions, and events. It never merges anything automatically — you decide what to do with each suggestion."
      >
        <Button onClick={handleScan} disabled={analyzing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Scanning...' : 'Scan for Duplicates'}
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : duplicates.length === 0 ? (
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No potential duplicates found. Click "Scan for Duplicates" to check your archive.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((dup) => (
            <Card key={dup.id} className="border-border/70 bg-card shadow-soft">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">{dup.entity_type}</Badge>
                  {dup.similarity_score != null && (
                    <ConfidenceBadge
                      level={dup.similarity_score >= 85 ? 'high' : dup.similarity_score >= 60 ? 'medium' : 'low'}
                      score={dup.similarity_score}
                    />
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-sm font-medium">{dup.entity_1_title ?? 'Untitled'}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-sm font-medium">{dup.entity_2_title}</p>
                  </div>
                </div>
                <ExplanationBox explanation={dup.explanation} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="default" onClick={() => handleAction(dup.id, 'merged')}>
                    <GitMerge className="h-3.5 w-3.5" /> Merge
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(dup.id, 'ignored')}>
                    <X className="h-3.5 w-3.5" /> Ignore
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleAction(dup.id, 'review_later')}>
                    <Clock className="h-3.5 w-3.5" /> Review Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
