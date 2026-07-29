'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PenLine,
  Image as ImageIcon,
  Star,
  FolderOpen,
  Plus,
  Loader2,
  Trash2,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  getDocuments, getImages, getFolders, createFolder, deleteFolder,
  toggleDocumentFavourite, toggleImageFavourite,
} from '@/lib/studio-queries';
import type { StudioDocument, StudioImage, StudioFolder } from '@/lib/studio-types';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Tab = 'all' | 'documents' | 'images' | 'favourites';

export default function LibraryPage() {
  const { isGuest } = useAuth();
  const [tab, setTab] = useState<Tab>('all');
  const [docs, setDocs] = useState<StudioDocument[]>([]);
  const [images, setImages] = useState<StudioImage[]>([]);
  const [folders, setFolders] = useState<StudioFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [d, i, f] = await Promise.all([getDocuments(), getImages(), getFolders()]);
      setDocs(d);
      setImages(i);
      setFolders(f);
    } catch {
      toast.error('Could not load library.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    load();
  }, [isGuest]);

  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    try {
      await createFolder(folderName.trim());
      setFolderName('');
      setFolderOpen(false);
      await load();
      toast.success('Folder created.');
    } catch {
      toast.error('Could not create folder.');
    }
  }

  async function handleDeleteFolder(id: string) {
    try {
      await deleteFolder(id);
      await load();
      toast.success('Folder deleted.');
    } catch {
      toast.error('Could not delete folder.');
    }
  }

  async function toggleDocFav(d: StudioDocument) {
    const next = !d.is_favourite;
    await toggleDocumentFavourite(d.id, next);
    setDocs(docs.map((x) => x.id === d.id ? { ...x, is_favourite: next } : x));
  }

  async function toggleImgFav(img: StudioImage) {
    const next = !img.is_favourite;
    await toggleImageFavourite(img.id, next);
    setImages(images.map((x) => x.id === img.id ? { ...x, is_favourite: next } : x));
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Content Library" description="All your AI-generated content, organised and easy to find." />
        <EmptyState icon={FolderOpen} title="Sign in to access your library" description="Create an account to start generating and organising content." actionLabel="Create account" actionHref="/register" />
      </div>
    );
  }

  const favDocs = docs.filter((d) => d.is_favourite);
  const favImgs = images.filter((i) => i.is_favourite);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Content Library" description="All your AI-generated content, organised and easy to find. Original archive memories are always kept separate from generated content." />

      {/* Folders */}
      {folders.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold">Folders</h2>
          <div className="flex flex-wrap gap-2">
            {folders.map((f) => (
              <div key={f.id} className="group flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 shadow-soft">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{f.name}</span>
                <button onClick={() => handleDeleteFolder(f.id)} className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Delete folder">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['all', 'documents', 'images', 'favourites'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors capitalize', tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent/20')}>
              {t}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setFolderOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />New folder
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {(tab === 'all' || tab === 'documents') && (
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold">Documents</h2>
              {docs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No documents yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {docs.map((d) => (
                    <Card key={d.id} className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <Link href={`/app/studio/editor/${d.id}`} className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                            <PenLine className="h-4 w-4" />
                          </Link>
                          <button onClick={() => toggleDocFav(d)} aria-label="Toggle favourite">
                            <Star className={d.is_favourite ? 'h-4 w-4 fill-accent text-accent' : 'h-4 w-4 text-muted-foreground'} />
                          </button>
                        </div>
                        <Link href={`/app/studio/editor/${d.id}`}>
                          <p className="mt-2 truncate font-serif text-sm font-semibold">{d.title}</p>
                          <p className="mt-0.5 text-xs capitalize text-muted-foreground">{d.content_type.replace(/_/g, ' ')}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(d.updated_at).toLocaleDateString()}</p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {(tab === 'all' || tab === 'images') && (
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold">Images</h2>
              {images.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No images yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {images.map((img) => (
                    <Card key={img.id} className="group overflow-hidden border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                      {img.public_url ? (
                        <Link href={`/app/studio/images/${img.id}`}>
                          <div className="aspect-square overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.public_url} alt={img.title} className="h-full w-full object-cover" />
                          </div>
                        </Link>
                      ) : (
                        <div className="grid aspect-square place-items-center bg-secondary/40">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium">{img.title}</p>
                          <button onClick={() => toggleImgFav(img)} aria-label="Toggle favourite">
                            <Star className={img.is_favourite ? 'h-3.5 w-3.5 fill-accent text-accent' : 'h-3.5 w-3.5 text-muted-foreground'} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'favourites' && (
            <section>
              {favDocs.length === 0 && favImgs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No favourites yet. Star items to find them quickly.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favDocs.map((d) => (
                    <Card key={d.id} className="border-border/70 bg-card shadow-soft">
                      <CardContent className="p-4">
                        <Link href={`/app/studio/editor/${d.id}`}>
                          <p className="truncate font-serif text-sm font-semibold">{d.title}</p>
                          <p className="text-xs capitalize text-muted-foreground">{d.content_type.replace(/_/g, ' ')}</p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                  {favImgs.map((img) => (
                    <Card key={img.id} className="overflow-hidden border-border/70 bg-card shadow-soft">
                      {img.public_url && (
                        <Link href={`/app/studio/images/${img.id}`}>
                          <div className="aspect-video overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.public_url} alt={img.title} className="h-full w-full object-cover" />
                          </div>
                        </Link>
                      )}
                      <CardContent className="p-3"><p className="truncate text-sm font-medium">{img.title}</p></CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {docs.length === 0 && images.length === 0 && (
            <EmptyState icon={Layers} title="Your library is empty" description="Generate your first piece of content in Rooted Studio." actionLabel="Create content" actionHref="/app/studio/create" />
          )}
        </>
      )}

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-serif text-xl">New folder</DialogTitle></DialogHeader>
          <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Folder name" onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
