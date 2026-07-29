'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Video, Loader2, Play, Pause, Download, Trash2, RefreshCw, Save, Star, Film, Settings2,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getGeneratedVideos, createGeneratedVideo, deleteGeneratedVideo, toggleVideoFavourite,
} from '@/lib/media-queries';
import {
  VIDEO_TYPES, VIDEO_THEMES, ANIMATION_STYLES, TRANSITION_STYLES,
  FONT_STYLES, COLOR_SCHEMES, BACKGROUND_MUSIC,
} from '@/lib/media-types';
import type { GeneratedVideo } from '@/lib/media-types';
import { cn } from '@/lib/utils';

export default function CreateVideoPage() {
  const { session, isGuest } = useAuth();
  const [videoList, setVideoList] = useState<GeneratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [videoType, setVideoType] = useState('tribute');
  const [theme, setTheme] = useState('classic');
  const [animationStyle, setAnimationStyle] = useState('fade');
  const [transitionStyle, setTransitionStyle] = useState('smooth');
  const [musicTrack, setMusicTrack] = useState('none');
  const [fontStyle, setFontStyle] = useState('serif');
  const [colorScheme, setColorScheme] = useState('warm');
  const [includeNarration, setIncludeNarration] = useState(false);
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getGeneratedVideos();
      setVideoList(data);
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
      toast.error('Please give your video a title first.');
      return;
    }
    setGenerating(true);
    try {
      await createGeneratedVideo({
        title: title.trim(),
        videoType,
        theme,
        animationStyle,
        transitionStyle,
        musicTrack: musicTrack === 'none' ? undefined : musicTrack,
        fontStyle,
        colorScheme,
      });
      toast.success('Video generation started. You will be notified when it is ready to preview.');
      setTitle('');
      await load();
    } catch {
      toast.error('Could not start video generation.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGeneratedVideo(id);
      toast.success('Video deleted.');
      await load();
    } catch {
      toast.error('Could not delete video.');
    }
  }

  async function handleFavourite(id: string, fav: boolean) {
    try {
      await toggleVideoFavourite(id, fav);
      await load();
    } catch {
      // ignore
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader title="AI Video Generation" description="Create tribute videos, family documentaries, memory slideshows, and animated storybooks — all from your preserved photographs, stories, and voice recordings." />
        <EmptyState icon={Video} title="Studio features require an account" description="Create an account to generate videos from your family archive." actionLabel="Create your account" actionHref="/register" />
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
        title="AI Video Generation"
        description="Create tribute videos, family documentaries, memory slideshows, and animated storybooks. The AI intelligently combines your photographs, voice recordings, and written stories — you always preview before saving."
      />

      <div className="rounded-xl bg-accent/10 p-3 text-sm text-muted-foreground">
        Videos are generated only from content already in your archive. The AI never invents family history. Every video includes optional subtitles for accessibility, and you always preview before saving.
      </div>

      {/* Generation form */}
      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="video-title">Title</Label>
            <Input id="video-title" placeholder="e.g. A Tribute to Grandmother" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Video type</Label>
            <Select value={videoType} onValueChange={setVideoType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VIDEO_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_THEMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Animation style</Label>
              <Select value={animationStyle} onValueChange={setAnimationStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANIMATION_STYLES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Transitions</Label>
              <Select value={transitionStyle} onValueChange={setTransitionStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSITION_STYLES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Music</Label>
              <Select value={musicTrack} onValueChange={setMusicTrack}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BACKGROUND_MUSIC.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Font style</Label>
              <Select value={fontStyle} onValueChange={setFontStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_STYLES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colour scheme</Label>
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_SCHEMES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accessibility options */}
          <div className="space-y-3 rounded-lg bg-muted/30 p-4">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Settings2 className="h-4 w-4" /> Accessibility
            </p>
            <div className="flex items-center justify-between">
              <Label htmlFor="narration" className="text-sm">Include AI narration</Label>
              <Switch id="narration" checked={includeNarration} onCheckedChange={setIncludeNarration} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="subtitles" className="text-sm">Include subtitles / closed captions</Label>
              <Switch id="subtitles" checked={includeSubtitles} onCheckedChange={setIncludeSubtitles} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={generating || !title.trim()} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {generating ? 'Generating…' : 'Generate Video'}
            </Button>
            <Button variant="outline" disabled={!title.trim()} className="gap-2">
              <Play className="h-4 w-4" /> Preview Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing videos */}
      {videoList.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold">Your Generated Videos</h2>
          <div className="space-y-2">
            {videoList.map((video) => (
              <Card key={video.id} className="border-border/70 bg-card/50">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                    video.status === 'ready' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{video.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">{video.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {VIDEO_TYPES.find((t) => t.value === video.video_type)?.label ?? video.video_type}
                      {' · '}
                      {VIDEO_THEMES.find((t) => t.value === video.theme)?.label ?? video.theme}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleFavourite(video.id, !video.is_favourite)}>
                      <Star className={cn('h-4 w-4', video.is_favourite && 'fill-accent text-accent')} />
                    </Button>
                    {video.public_url && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a href={video.public_url} download><Download className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                      <Play className="h-3.5 w-3.5" /> Preview
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                      <Save className="h-3.5 w-3.5" /> Save to Archive
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(video.id)}>
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
