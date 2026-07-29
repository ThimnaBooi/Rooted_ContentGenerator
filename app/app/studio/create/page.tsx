'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles, Loader2, ArrowRight, ArrowLeft, Check,
  BookOpen, Mic, Heart, Mail, Newspaper, UtensilsCrossed,
  PenLine, CalendarClock, Camera, Globe, Gift, Baby,
  Library, BookMarked, Cake, Award, Share2, Quote,
  Scissors, Pencil, Palette, type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase-client';
import {
  CONTENT_TYPES, WRITING_STYLES, TONES, DETAIL_LEVELS,
  DOCUMENT_LENGTHS, LANGUAGES,
} from '@/lib/studio-types';
import { createDocument } from '@/lib/studio-queries';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Mic, Heart, Mail, Newspaper, UtensilsCrossed, PenLine,
  CalendarClock, Camera, Globe, Gift, Baby, Library, BookMarked,
  Cake, Award, Share2, Quote, Scissors, Pencil, Palette,
};

type SourceItem = { id: string; type: string; title: string; subtitle?: string | null; content?: string | null };

function GuestView() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Create Content" description="AI-powered content generation for your family archive." />
      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="p-8 text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
          <p className="font-serif text-lg font-semibold">Studio is for registered users</p>
          <p className="mt-2 text-sm text-muted-foreground">Create an account to start generating content from your archive.</p>
          <Button className="mt-4" onClick={() => router.push('/register')}>Create account</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Wizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';

  const [step, setStep] = useState(0);
  const [contentType, setContentType] = useState(initialType);
  const [sourceItems, setSourceItems] = useState<SourceItem[]>([]);
  const [availableSources, setAvailableSources] = useState<SourceItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState({
    writing_style: '', tone: '', target_audience: '', detail_level: '',
    document_length: '', language: 'en', custom_instructions: '',
  });

  useEffect(() => { loadSources(); }, []);

  async function loadSources() {
    setLoadingSources(true);
    try {
      const [people, memories, events, recipes, traditions] = await Promise.all([
        supabase.from('people').select('id, full_name, preferred_name, bio, occupation, relationship_to_owner').order('created_at', { ascending: false }),
        supabase.from('memories').select('id, title, description, memory_date, location, emotional_category').order('created_at', { ascending: false }),
        supabase.from('events').select('id, title, description, event_date, location, event_type').order('event_date', { ascending: false }),
        supabase.from('recipes').select('id, title, ingredients, instructions, created_by, personal_notes').order('created_at', { ascending: false }),
        supabase.from('traditions').select('id, title, description, when_it_happens, participants').order('created_at', { ascending: false }),
      ]);
      const items: SourceItem[] = [
        ...(people.data ?? []).map((p: any) => ({ id: p.id, type: 'person', title: p.full_name, subtitle: [p.preferred_name, p.relationship_to_owner, p.occupation].filter(Boolean).join(' • '), content: p.bio })),
        ...(memories.data ?? []).map((m: any) => ({ id: m.id, type: 'memory', title: m.title, subtitle: [m.emotional_category, m.location, m.memory_date].filter(Boolean).join(' • '), content: m.description })),
        ...(events.data ?? []).map((e: any) => ({ id: e.id, type: 'event', title: e.title, subtitle: [e.event_type, e.location, e.event_date].filter(Boolean).join(' • '), content: e.description })),
        ...(recipes.data ?? []).map((r: any) => ({ id: r.id, type: 'recipe', title: r.title, subtitle: r.created_by, content: [r.ingredients, r.instructions, r.personal_notes].filter(Boolean).join('\n\n') })),
        ...(traditions.data ?? []).map((t: any) => ({ id: t.id, type: 'tradition', title: t.title, subtitle: t.when_it_happens, content: t.description })),
      ];
      setAvailableSources(items);
    } catch { toast.error('Could not load your archive.'); }
    finally { setLoadingSources(false); }
  }

  function toggleSource(item: SourceItem) {
    const exists = sourceItems.find((s) => s.id === item.id && s.type === item.type);
    setSourceItems(exists ? sourceItems.filter((s) => !(s.id === item.id && s.type === item.type)) : [...sourceItems, item]);
  }

  function buildSourceContext(): string {
    if (sourceItems.length === 0) return '';
    return sourceItems.map((s) => {
      const parts = [`[${s.type.toUpperCase()}] ${s.title}`];
      if (s.subtitle) parts.push(s.subtitle);
      if (s.content) parts.push(s.content);
      return parts.join('\n');
    }).join('\n\n---\n\n');
  }

  async function handleGenerate() {
    if (!contentType) { toast.error('Please select a content type.'); return; }
    setGenerating(true);
    try {
      const sourceContext = buildSourceContext();
      const contentTypeLabel = CONTENT_TYPES.find((c) => c.value === contentType)?.label || contentType;
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session?.access_token}` },
        body: JSON.stringify({ contentType, sourceContext, writingStyle: options.writing_style, tone: options.tone, targetAudience: options.target_audience, detailLevel: options.detail_level, documentLength: options.document_length, language: options.language, customInstructions: options.custom_instructions }),
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || `Generation failed (${response.status})`); }
      const result = await response.json();
      const doc = await createDocument({
        title: result.title || contentTypeLabel, content: result.content, content_type: contentType,
        content_format: 'html', writing_style: options.writing_style || null, tone: options.tone || null,
        target_audience: options.target_audience || null, detail_level: options.detail_level || null,
        document_length: options.document_length || null, language: options.language,
        custom_instructions: options.custom_instructions || null,
        source_refs: { items: sourceItems.map((s) => ({ type: s.type, id: s.id, title: s.title })) },
        is_draft: true, status: 'draft',
      });
      toast.success('Content generated! Review and edit before saving.');
      router.push(`/app/studio/editor/${doc.id}?suggestions=${encodeURIComponent(JSON.stringify(result.suggestions || []))}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not generate content.'); }
    finally { setGenerating(false); }
  }

  const steps = ['Content type', 'Select sources', 'Customise', 'Generate'];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="Create Content" description="Choose what you'd like to create, select memories from your archive, and let the AI help you write it." />

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors', i <= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn('hidden text-sm sm:inline', i <= step ? 'font-medium' : 'text-muted-foreground')}>{s}</span>
            {i < steps.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-primary' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONTENT_TYPES.map((c) => {
              const Icon = iconMap[c.icon] || PenLine;
              return (
                <button key={c.value} onClick={() => setContentType(c.value)} className={cn('flex items-start gap-3 rounded-xl border p-4 text-left transition-all', contentType === c.value ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/70 bg-card hover:border-accent/50')}>
                  <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', contentType === c.value ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div><p className="text-sm font-medium">{c.label}</p><p className="text-xs capitalize text-muted-foreground">{c.category}</p></div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end"><Button onClick={() => setStep(1)} disabled={!contentType}>Next<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Select memories from your archive to include. The AI will only use what you choose.</p>
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">{sourceItems.length} selected</Badge>
          </div>
          {loadingSources ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : availableSources.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-card"><CardContent className="p-8 text-center"><p className="text-sm text-muted-foreground">Your archive doesn't have any content yet. You can still generate a template structure.</p></CardContent></Card>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {availableSources.map((s) => {
                const selected = sourceItems.find((x) => x.id === s.id && x.type === s.type);
                return (
                  <button key={`${s.type}-${s.id}`} onClick={() => toggleSource(s)} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all', selected ? 'border-primary bg-primary/5' : 'border-border/70 bg-card hover:border-accent/50')}>
                    <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                      {selected ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.title}</p>{s.subtitle && <p className="truncate text-xs text-muted-foreground">{s.subtitle}</p>}</div>
                    <Badge variant="outline" className="capitalize">{s.type}</Badge>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            <Button onClick={() => setStep(2)}>Next<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Card className="border-border/70 bg-card shadow-soft">
            <CardContent className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Writing style</Label><Select value={options.writing_style} onValueChange={(v) => setOptions({ ...options, writing_style: v })}><SelectTrigger><SelectValue placeholder="Choose style…" /></SelectTrigger><SelectContent>{WRITING_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Tone</Label><Select value={options.tone} onValueChange={(v) => setOptions({ ...options, tone: v })}><SelectTrigger><SelectValue placeholder="Choose tone…" /></SelectTrigger><SelectContent>{TONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="audience">Target audience</Label><Input id="audience" value={options.target_audience} onChange={(e) => setOptions({ ...options, target_audience: e.target.value })} placeholder="e.g. family members, general readers" /></div>
                <div className="space-y-2"><Label>Level of detail</Label><Select value={options.detail_level} onValueChange={(v) => setOptions({ ...options, detail_level: v })}><SelectTrigger><SelectValue placeholder="Choose level…" /></SelectTrigger><SelectContent>{DETAIL_LEVELS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Document length</Label><Select value={options.document_length} onValueChange={(v) => setOptions({ ...options, document_length: v })}><SelectTrigger><SelectValue placeholder="Choose length…" /></SelectTrigger><SelectContent>{DOCUMENT_LENGTHS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Language</Label><Select value={options.language} onValueChange={(v) => setOptions({ ...options, language: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="instructions">Additional instructions (optional)</Label><Textarea id="instructions" rows={3} value={options.custom_instructions} onChange={(e) => setOptions({ ...options, custom_instructions: e.target.value })} placeholder="Any specific requests for the AI, e.g. 'focus on her teaching career'" /></div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            <Button onClick={() => setStep(3)}>Review<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <Card className="border-border/70 bg-card shadow-soft">
            <CardContent className="space-y-4 p-6">
              <div><p className="text-sm font-medium">Content type</p><p className="text-sm text-muted-foreground">{CONTENT_TYPES.find((c) => c.value === contentType)?.label}</p></div>
              <div>
                <p className="text-sm font-medium">Selected sources</p>
                {sourceItems.length === 0 ? <p className="text-sm text-muted-foreground">None — a template structure will be generated.</p> : (
                  <div className="mt-1 flex flex-wrap gap-1.5">{sourceItems.map((s) => <Badge key={`${s.type}-${s.id}`} variant="secondary" className="bg-accent/20 text-accent-foreground">{s.title}</Badge>)}</div>
                )}
              </div>
              {options.writing_style && <div><p className="text-sm font-medium">Style</p><p className="text-sm text-muted-foreground">{options.writing_style}</p></div>}
              {options.tone && <div><p className="text-sm font-medium">Tone</p><p className="text-sm text-muted-foreground">{options.tone}</p></div>}
              {options.custom_instructions && <div><p className="text-sm font-medium">Instructions</p><p className="text-sm text-muted-foreground">{options.custom_instructions}</p></div>}
            </CardContent>
          </Card>
          <div className="rounded-lg bg-secondary/40 p-4"><p className="text-sm text-muted-foreground">The AI will only use the information you've selected from your archive. It will not invent facts, relationships, or memories. You'll be able to review, edit, and regenerate before anything is saved.</p></div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            <Button onClick={handleGenerate} disabled={generating}>{generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate content</>}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateContentInner() {
  const { isGuest } = useAuth();
  if (isGuest) return <GuestView />;
  return <Wizard />;
}

export default function CreateContentPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <CreateContentInner />
    </Suspense>
  );
}
