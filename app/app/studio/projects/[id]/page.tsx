'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Layers, PenLine, Image as ImageIcon, Plus, Trash2, Star,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import {
  getProject, getProjectItems, removeProjectItem, toggleProjectFavourite,
  getDocuments, getImages,
} from '@/lib/studio-queries';
import type { StudioProject, StudioProjectItem, StudioDocument, StudioImage } from '@/lib/studio-types';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<StudioProject | null>(null);
  const [items, setItems] = useState<StudioProjectItem[]>([]);
  const [docs, setDocs] = useState<StudioDocument[]>([]);
  const [images, setImages] = useState<StudioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [proj, projItems, allDocs, allImgs] = await Promise.all([
          getProject(id),
          getProjectItems(id),
          getDocuments(),
          getImages(),
        ]);
        setProject(proj);
        setItems(projItems);
        setDocs(allDocs);
        setImages(allImgs);
        setIsFav(proj?.is_favourite ?? false);
      } catch {
        toast.error('Could not load project.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleRemoveItem(itemId: string) {
    try {
      await removeProjectItem(itemId);
      setItems(items.filter((x) => x.id !== itemId));
      toast.success('Item removed from project.');
    } catch {
      toast.error('Could not remove item.');
    } finally {
      setDeleteItemId(null);
    }
  }

  async function handleFav() {
    if (!project) return;
    const next = !isFav;
    setIsFav(next);
    await toggleProjectFavourite(project.id, next);
  }

  const itemDocs = items.filter((i) => i.item_type === 'document' && i.document_id);
  const itemImgs = items.filter((i) => i.item_type === 'image' && i.image_id);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-serif text-lg font-semibold">Project not found</p>
        <Button className="mt-4" asChild><Link href="/app/studio/projects">Back to projects</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/app/studio/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to projects
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{project.name}</h1>
          {project.description && <p className="mt-2 text-muted-foreground">{project.description}</p>}
          <Badge variant="secondary" className="mt-2 bg-accent/20 text-accent-foreground capitalize">{project.project_type.replace(/_/g, ' ')}</Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleFav} aria-label="Toggle favourite">
            <Star className={isFav ? 'h-4 w-4 fill-accent text-accent' : 'h-4 w-4'} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Documents in project */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenLine className="h-5 w-5 text-primary" />Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itemDocs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No documents in this project yet.</p>
            ) : (
              <ul className="space-y-2">
                {itemDocs.map((item) => {
                  const doc = docs.find((d) => d.id === item.document_id);
                  if (!doc) return null;
                  return (
                    <li key={item.id} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-2.5">
                      <PenLine className="h-4 w-4 text-primary" />
                      <Link href={`/app/studio/editor/${doc.id}`} className="flex-1 truncate text-sm font-medium">{doc.title}</Link>
                      <button onClick={() => setDeleteItemId(item.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove from project">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Images in project */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-primary" />Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itemImgs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No images in this project yet.</p>
            ) : (
              <ul className="space-y-2">
                {itemImgs.map((item) => {
                  const img = images.find((i) => i.id === item.image_id);
                  if (!img) return null;
                  return (
                    <li key={item.id} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-2.5">
                      {img.public_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.public_url} alt={img.title} className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><ImageIcon className="h-4 w-4" /></div>
                      )}
                      <Link href={`/app/studio/images/${img.id}`} className="flex-1 truncate text-sm font-medium">{img.title}</Link>
                      <button onClick={() => setDeleteItemId(item.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove from project">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteItemId}
        onOpenChange={(o) => !o && setDeleteItemId(null)}
        title="Remove from project?"
        description="This will remove the item from the project. The original content will remain in your library."
        onConfirm={() => deleteItemId && handleRemoveItem(deleteItemId)}
      />
    </div>
  );
}
