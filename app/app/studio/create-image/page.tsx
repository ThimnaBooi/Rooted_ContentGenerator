'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Loader2, ArrowRight, Baby, GitBranch, Palette, Pencil,
  Scissors, Mail, Image as ImageIcon, Quote, Award, BookMarked,
  CalendarClock, Landmark, Gift, type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MediaUploader } from '@/components/app/media-uploader';
import { IMAGE_TYPES } from '@/lib/studio-types';
import { createImage } from '@/lib/studio-queries';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const iconMap: Record<string, LucideIcon> = {
  Baby, GitBranch, Palette, Pencil, Scissors, Mail, Image: ImageIcon,
  Quote, Award, BookMarked, CalendarClock, Landmark, Gift,
};

export default function CreateImagePage() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const [imageType, setImageType] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [sourcePhoto, setSourcePhoto] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!imageType) { toast.error('Please select an image type.'); return; }
    setGenerating(true);
    try {
      const typeLabel = IMAGE_TYPES.find((t) => t.value === imageType)?.label || imageType;
      const fullPrompt = [prompt, style && `Style: ${style}`].filter(Boolean).join('\n');

      const img = await createImage({
        title: `${typeLabel}`,
        image_type: imageType,
        prompt: fullPrompt || null,
        style: style || null,
        source_photo_url: sourcePhoto,
        status: 'draft',
      });

      toast.success('Image project created. AI image generation will be available when the AI image feature is enabled in your settings.');
      router.push(`/app/studio/images/${img.id}`);
    } catch {
      toast.error('Could not create image project.');
    } finally {
      setGenerating(false);
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Generate Artwork" description="Create original artwork inspired by your memories and archive." />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
            <p className="font-serif text-lg font-semibold">Studio is for registered users</p>
            <Button className="mt-4" onClick={() => router.push('/register')}>Create account</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Generate Artwork"
        description="Create original artwork inspired by your memories. Choose an image type, describe what you'd like, and optionally upload a photo to transform. Original photos are never altered."
      />

      {/* Image type selection */}
      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">Choose an image type</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IMAGE_TYPES.map((t) => {
            const Icon = iconMap[t.icon] || ImageIcon;
            return (
              <button
                key={t.value}
                onClick={() => setImageType(t.value)}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                  imageType === t.value ? 'border-primary bg-primary/5 shadow-soft' : 'border-border/70 bg-card hover:border-accent/50'
                )}
              >
                <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', imageType === t.value ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">{t.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt */}
      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe the image</Label>
            <Textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene, mood, and details you'd like the AI to create. The more specific you are, the better the result."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="style">Artistic style (optional)</Label>
            <Input
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. soft watercolour, vintage oil painting, minimalist pencil sketch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Source photo */}
      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-medium">Transform an existing photo (optional)</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Upload a photo and the AI will create an artistic interpretation. Your original photo is never modified or replaced.
          </p>
          {sourcePhoto ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sourcePhoto} alt="Source" className="h-16 w-16 rounded-md object-cover" />
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">Photo uploaded</Badge>
              <Button variant="ghost" size="sm" onClick={() => { setSourcePhoto(null); setSourcePath(null); }}>Remove</Button>
            </div>
          ) : (
            <MediaUploader
              bucket="photos"
              accept="image/*"
              label="Upload source photo"
              onUploaded={(files) => {
                if (files.length > 0) {
                  setSourcePhoto(files[0].url);
                  setSourcePath(files[0].path);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={generating || !imageType}>
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {generating ? 'Creating…' : 'Generate artwork'}
        </Button>
      </div>
    </div>
  );
}
