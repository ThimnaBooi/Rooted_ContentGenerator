'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Headphones, Loader2, Play, Pause, Download, Trash2, RefreshCw, Save, Star, Volume2,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getGeneratedAudio, createGeneratedAudio, deleteGeneratedAudio, toggleAudioFavourite,
  updateGeneratedAudio,
} from '@/lib/media-queries';
import {
  AUDIO_TYPES, NARRATOR_VOICES, SPEAKING_SPEEDS, SPEAKING_STYLES,
  EMOTIONAL_TONES, BACKGROUND_AMBIENCES, BACKGROUND_MUSIC,
} from '@/lib/media-types';
import { LANGUAGES } from '@/lib/studio-types';
import type { GeneratedAudio } from '@/lib/media-types';
import { cn } from '@/lib/utils';

export default function CreateAudioPage() {
  const { session, isGuest } = useAuth();
  const [audioList, setAudioList] = useState<GeneratedAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [audioType, setAudioType] = useState('narrated_biography');
  const [narratorVoice, setNarratorVoice] = useState('warm_female');
  const [speakingSpeed, setSpeakingSpeed] = useState('normal');
  const [speakingStyle, setSpeakingStyle] = useState('narrative');
  const [emotionalTone, setEmotionalTone] = useState('warm');
  const [backgroundAmbience, setBackgroundAmbience] = useState('none');
  const [backgroundMusic, setBackgroundMusic] = useState('none');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [generating, setGenerating] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [previewState, setPreviewState] = useState<'idle' | 'previewing'>('idle');

  const load = useCallback(async () => {
    try {
      const data = await getGeneratedAudio();
      setAudioList(data);
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

  async function handleGenerate() {
    if (!title.trim()) {
      toast.error('Please give your audio a title first.');
      return;
    }
    if (!sourceText.trim()) {
      toast.error('Please provide text content to narrate.');
      return;
    }
    setGenerating(true);
    try {
      const audio = await createGeneratedAudio({
        title: title.trim(),
        audioType,
        narratorVoice,
        speakingSpeed,
        speakingStyle,
        emotionalTone,
        backgroundAmbience: backgroundAmbience === 'none' ? undefined : backgroundAmbience,
        backgroundMusic: backgroundMusic === 'none' ? undefined : backgroundMusic,
        outputLanguage,
      });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          audioId: audio.id,
          title: title.trim(),
          audioType,
          narratorVoice,
          speakingSpeed,
          speakingStyle,
          emotionalTone,
          outputLanguage,
          sourceText,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        toast.error(errBody.error ?? `Audio generation failed (${res.status})`);
        await load();
        return;
      }

      const result = await res.json();
      if (result.error) {
        toast.error(result.error);
        await load();
        return;
      }

      toast.success('Audio generated successfully!');
      setTitle('');
      setSourceText('');
      await load();
    } catch {
      toast.error('Could not generate audio. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGeneratedAudio(id);
      toast.success('Audio deleted.');
      await load();
    } catch {
      toast.error('Could not delete audio.');
    }
  }

  async function handleFavourite(id: string, fav: boolean) {
    try {
      await toggleAudioFavourite(id, fav);
      await load();
    } catch {
      // ignore
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader title="AI Audio Generation" description="Transform your written stories into beautifully narrated audio — biographies, memoirs, audiobooks, and bedtime stories, read aloud in a voice you choose." />
        <EmptyState icon={Headphones} title="Studio features require an account" description="Create an account to generate narrated audio from your preserved stories." actionLabel="Create your account" actionHref="/register" />
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="AI Audio Generation"
        description="Transform your written stories into beautifully narrated audio. Choose a voice, set the tone, and let the AI read your family's stories aloud — always based on content you have already preserved."
      />

      {/* Privacy notice */}
      <div className="rounded-xl bg-accent/10 p-3 text-sm text-muted-foreground">
        Audio is generated only from content already in your archive or information you provide during this session. The AI never invents family history. Generated audio never overwrites your original written content.
      </div>

      {/* Generation form */}
      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="audio-title">Title</Label>
            <Input id="audio-title" placeholder="e.g. Grandfather's Life Story — Narrated" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source-text">Text to narrate</Label>
            <Textarea
              id="source-text"
              rows={6}
              placeholder="Paste the text you'd like the AI to narrate — a biography, a memory, a letter, or any story from your archive."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">The AI will convert this text into spoken audio using the voice and settings you choose below.</p>
          </div>

          <div className="space-y-2">
            <Label>Audio type</Label>
            <Select value={audioType} onValueChange={setAudioType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIO_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Narrator voice</Label>
              <Select value={narratorVoice} onValueChange={setNarratorVoice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NARRATOR_VOICES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Speaking speed</Label>
              <Select value={speakingSpeed} onValueChange={setSpeakingSpeed}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPEAKING_SPEEDS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Speaking style</Label>
              <Select value={speakingStyle} onValueChange={setSpeakingStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPEAKING_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emotional tone</Label>
              <Select value={emotionalTone} onValueChange={setEmotionalTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONAL_TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Background ambience</Label>
              <Select value={backgroundAmbience} onValueChange={setBackgroundAmbience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BACKGROUND_AMBIENCES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Background music</Label>
              <Select value={backgroundMusic} onValueChange={setBackgroundMusic}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BACKGROUND_MUSIC.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Output language</Label>
              <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={generating || !title.trim()} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
              {generating ? 'Generating…' : 'Generate Audio'}
            </Button>
            <Button variant="outline" onClick={() => setPreviewState('previewing')} disabled={!title.trim()} className="gap-2">
              {previewState === 'previewing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              Preview Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing audio */}
      {audioList.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold">Your Generated Audio</h2>
          <div className="space-y-2">
            {audioList.map((audio) => (
              <Card key={audio.id} className="border-border/70 bg-card/50">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                    audio.status === 'ready' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{audio.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">{audio.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {AUDIO_TYPES.find((t) => t.value === audio.audio_type)?.label ?? audio.audio_type}
                      {' · '}
                      {NARRATOR_VOICES.find((v) => v.value === audio.narrator_voice)?.label ?? audio.narrator_voice}
                      {audio.duration_seconds ? ` · ${Math.floor(audio.duration_seconds / 60)}:${String(audio.duration_seconds % 60).padStart(2, '0')}` : ''}
                    </p>
                    {audio.public_url && audio.status === 'ready' && (
                      <audio controls className="mt-2 h-9 w-full" src={audio.public_url} />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleFavourite(audio.id, !audio.is_favourite)}>
                      <Star className={cn('h-4 w-4', audio.is_favourite && 'fill-accent text-accent')} />
                    </Button>
                    {audio.public_url && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a href={audio.public_url} download><Download className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                      <Save className="h-3.5 w-3.5" /> Save to Archive
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(audio.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
