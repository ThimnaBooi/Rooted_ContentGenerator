'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link2, RefreshCw, Check, X, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge, ExplanationBox } from '@/components/app/ai/confidence-badge';
import { getRelationshipSuggestions, updateRelationshipSuggestionStatus, triggerAIAnalysis, deleteRelationshipSuggestion } from '@/lib/ai-queries';
import { createRelationship } from '@/lib/queries';
import type { RelationshipSuggestion } from '@/lib/ai-types';
import { toast } from 'sonner';

export default function RelationshipSuggestionsPage() {
  const { session, isGuest } = useAuth();
  const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
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
      const data = await getRelationshipSuggestions('pending');
      setSuggestions(data);
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
      const result = await triggerAIAnalysis('relationship_analysis', {}, supabaseUrl, supabaseAnonKey, session?.access_token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Relationship analysis complete.');
        await load();
      }
    } catch {
      toast.error('Could not analyze relationships.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm(sug: RelationshipSuggestion) {
    try {
      await createRelationship(sug.person_1_id, sug.person_2_id, sug.suggested_relationship);
      await updateRelationshipSuggestionStatus(sug.id, 'confirmed');
      setSuggestions(suggestions.filter((s) => s.id !== sug.id));
      toast.success(`Connected ${sug.person_1_name} and ${sug.person_2_name}.`);
    } catch {
      toast.error('Could not create relationship.');
    }
  }

  async function handleAction(id: string, action: 'dismissed' | 'review_later') {
    try {
      await updateRelationshipSuggestionStatus(id, action);
      setSuggestions(suggestions.filter((s) => s.id !== id));
      if (action === 'dismissed') toast.success('Suggestion dismissed.');
      else toast.success('Saved for later.');
    } catch {
      toast.error('Could not update suggestion.');
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader icon={Link2} title="Relationship Suggestions" description="AI detects likely relationships between people in your archive." />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">Sign in to use relationship suggestions.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={Link2}
        title="Relationship Suggestions"
        description="The AI reads through your memories and stories to identify likely relationships between people. Nothing is connected automatically — you confirm every relationship."
      >
        <Button onClick={handleScan} disabled={analyzing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Analyze Relationships'}
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : suggestions.length === 0 ? (
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No relationship suggestions yet. Click "Analyze Relationships" to check your archive.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((sug) => (
            <Card key={sug.id} className="border-border/70 bg-card shadow-soft">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested: {sug.suggested_relationship}</span>
                  <ConfidenceBadge level={sug.confidence} score={sug.confidence_score} />
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/app/people/${sug.person_1_id}`} className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                    {sug.person_1_name}
                  </Link>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/app/people/${sug.person_2_id}`} className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                    {sug.person_2_name}
                  </Link>
                </div>
                <ExplanationBox explanation={sug.evidence} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleConfirm(sug)}>
                    <Check className="h-3.5 w-3.5" /> Connect Them
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(sug.id, 'dismissed')}>
                    <X className="h-3.5 w-3.5" /> Dismiss
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleAction(sug.id, 'review_later')}>
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
