'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Star, Trash2, Download, RefreshCw, Copy,
  Image as ImageIcon, Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { getImage, updateImage, deleteImage, toggleImageFavourite, createImage } from '@/lib/studio-queries';
import type { StudioImage } from '@/lib/studio-types';
import { toast } from 'sonner';

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [image, setImage] = useState<StudioImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const img = await getImage(id);
        setImage(img);
        setIsFav(img?.is_favourite ?? false);
        setEditPrompt(img?.prompt ?? '');
        setEditTitle(img?.title ?? '');
      } catch {
        toast.error('Could not load image.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleFav() {
    if (!image) return;
    const next = !isFav;
    setIsFav(next);
    await toggleImageFavourite(image.id, next);
  }

  async function handleDelete() {
    if (!image) return;
    try {
      await deleteImage(image.id);
      toast.success('Image deleted.');
      router.push('/app/studio/library');
    } catch {
      toast.error('Could not delete image.');
    } finally {
      setDeleteOpen(false);
    }
  }

  async function handleDuplicate() {
    if (!image) return;
    try {
      const copy = await createImage({
        title: `${image.title} (Variation)`,
        image_type: image.image_type,
        prompt: image.prompt,
        style: image.style,
        source_photo_url: image.source_photo_url,
        status: 'draft',
      });
      toast.success('Variation created.');
      router.push(`/app/studio/images/${copy.id}`);
    } catch {
      toast.error('Could not create variation.');
    }
  }

  async function handleSaveEdits() {
    if (!image) return;
    setSaving(true);
    try {
      const updated = await updateImage(image.id, { prompt: editPrompt, title: editTitle });
      setImage(updated);
      setEditOpen(false);
      toast.success('Image details updated.');
    } catch {
      toast.error('Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    if (!image?.public_url) {
      toast.info('No image file to download yet. AI image generation will be available when the feature is enabled.');
      return;
    }
    const a = document.createElement('a');
    a.href = image.public_url;
    a.download = image.title;
    a.target = '_blank';
    a.click();
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!image) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-serif text-lg font-semibold">Image not found</p>
        <Button className="mt-4" asChild><Link href="/app/studio/library">Back to library</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/studio/library" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to library
        </Link>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleFav} aria-label="Toggle favourite">
            <Star className={isFav ? 'h-4 w-4 fill-accent text-accent' : 'h-4 w-4'} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download"><Download className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={handleDuplicate} aria-label="Create variation"><Copy className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit prompt"><Wand2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteOpen(true)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <h1 className="font-serif text-2xl font-semibold">{image.title}</h1>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary capitalize">{image.image_type.replace(/_/g, ' ')}</Badge>
        {image.style && <Badge variant="outline">{image.style}</Badge>}
        <Badge variant="outline">{image.status}</Badge>
      </div>

      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="p-6">
          {image.public_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.public_url} alt={image.title} className="mx-auto max-h-[500px] rounded-lg object-contain" />
          ) : (
            <div className="grid place-items-center py-20 text-center">
              <ImageIcon className="mb-4 h-16 w-16 text-muted-foreground" />
              <p className="font-serif text-lg font-semibold">Awaiting generation</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                This image project has been created. AI image generation will produce the artwork when the feature is enabled in your account settings.
              </p>
              <Button className="mt-4" onClick={() => toast.info('AI image generation will be available when the feature is enabled.')}>
                <RefreshCw className="mr-2 h-4 w-4" />Generate image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {image.prompt && (
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm font-medium">Prompt</p>
            <p className="mt-1 text-sm text-muted-foreground">{image.prompt}</p>
          </CardContent>
        </Card>
      )}

      {image.source_photo_url && (
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">Source photo (original is preserved)</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.source_photo_url} alt="Source" className="h-32 rounded-md object-cover" />
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-xl">Edit image details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="img-title">Title</Label>
              <Input id="img-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="img-prompt">Prompt</Label>
              <Textarea id="img-prompt" rows={4} value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdits} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete this image?" description="This will permanently delete the image and its file." onConfirm={handleDelete} />
    </div>
  );
}
