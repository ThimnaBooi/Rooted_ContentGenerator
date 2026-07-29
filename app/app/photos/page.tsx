'use client';

import { useEffect, useState } from 'react';
import { Plus, Camera, Loader2, Calendar, MapPin, X } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { MediaUploader } from '@/components/app/media-uploader';
import { PersonSelector } from '@/components/app/person-selector';
import { ItemActions } from '@/components/app/item-actions';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getPhotos, createPhoto, deletePhoto, updatePhoto } from '@/lib/queries';
import type { Photo } from '@/lib/types';
import { toast } from 'sonner';

type UploadDraft = {
  path: string;
  url: string;
  name: string;
};

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [drafts, setDrafts] = useState<UploadDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Photo | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    caption: '',
    description: '',
    approximate_date: '',
    location: '',
  });
  const [editPeople, setEditPeople] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getPhotos();
      setPhotos(data);
    } catch {
      toast.error('Could not load photos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startUpload(files: { path: string; url: string; name: string }[]) {
    setDrafts(files.map((f) => ({ ...f, name: '' })));
    setUploadOpen(true);
  }

  async function saveUploads() {
    if (drafts.length === 0) return;
    setSaving(true);
    try {
      for (const d of drafts) {
        await createPhoto({
          title: d.name || null,
          storage_path: d.path,
          public_url: d.url,
        });
      }
      toast.success(`${drafts.length} photo${drafts.length > 1 ? 's' : ''} uploaded.`);
      setDrafts([]);
      setUploadOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload photos.');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: Photo) {
    setEditTarget(p);
    setEditForm({
      title: p.title ?? '',
      caption: p.caption ?? '',
      description: p.description ?? '',
      approximate_date: p.approximate_date ?? '',
      location: p.location ?? '',
    });
    setEditPeople([]);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updatePhoto(editTarget.id, {
        title: editForm.title.trim() || null,
        caption: editForm.caption.trim() || null,
        description: editForm.description.trim() || null,
        approximate_date: editForm.approximate_date || null,
        location: editForm.location.trim() || null,
      });
      toast.success('Photo updated.');
      setEditTarget(null);
      await load();
    } catch {
      toast.error('Could not update photo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePhoto(deleteId);
      setPhotos((p) => p.filter((x) => x.id !== deleteId));
      toast.success('Photo deleted.');
    } catch {
      toast.error('Could not delete photo.');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Photo Gallery"
        description="Photographs of the people, places, and moments that make your story. Add captions, dates, and locations to every image."
      />

      <div className="flex justify-end">
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload photos
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No photographs yet"
          description="Upload photos to build your visual archive. Add captions, approximate dates, and locations to preserve the full story behind each image."
          actionLabel="Upload your first photo"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((p) => (
            <Card
              key={p.id}
              className="group overflow-hidden border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <div className="relative aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.public_url}
                  alt={p.title ?? 'Photo'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute right-2 top-2 rounded-full bg-background/80 backdrop-blur-sm">
                  <ItemActions
                    entityLabel={p.title ?? 'photo'}
                    onEdit={() => openEdit(p)}
                    onDelete={() => setDeleteId(p.id)}
                  />
                </div>
              </div>
              <CardContent className="p-4">
                {p.title && (
                  <p className="truncate font-serif text-sm font-semibold">
                    {p.title}
                  </p>
                )}
                {p.caption && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {p.caption}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {p.approximate_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.approximate_date).toLocaleDateString()}
                    </span>
                  )}
                  {p.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {p.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Upload photos</DialogTitle>
          </DialogHeader>
          {drafts.length === 0 ? (
            <MediaUploader
              bucket="photos"
              accept="image/*"
              multiple
              label="Choose photos"
              onUploaded={startUpload}
            />
          ) : (
            <div className="space-y-3">
              {drafts.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.url}
                    alt="preview"
                    className="h-14 w-14 rounded-md object-cover"
                  />
                  <Input
                    placeholder="Caption (optional)"
                    value={d.name}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[i] = { ...d, name: e.target.value };
                      setDrafts(next);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <MediaUploader
                bucket="photos"
                accept="image/*"
                multiple
                label="Add more"
                onUploaded={(files) =>
                  setDrafts([...drafts, ...files.map((f) => ({ ...f, name: '' }))])
                }
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveUploads} disabled={saving || drafts.length === 0}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save {drafts.length > 0 ? `(${drafts.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit photo</DialogTitle>
          </DialogHeader>
          {editTarget && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={editTarget.public_url}
              alt={editTarget.title ?? 'Photo'}
              className="max-h-64 w-full rounded-lg object-cover"
            />
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo-title">Title</Label>
              <Input
                id="photo-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-caption">Caption</Label>
              <Input
                id="photo-caption"
                value={editForm.caption}
                onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-desc">Description</Label>
              <Textarea
                id="photo-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="photo-date">Approximate date</Label>
                <Input
                  id="photo-date"
                  type="date"
                  value={editForm.approximate_date}
                  onChange={(e) => setEditForm({ ...editForm, approximate_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo-loc">Location</Label>
                <Input
                  id="photo-loc"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
            </div>
            <PersonSelector
              selected={editPeople}
              onChange={setEditPeople}
              label="People in this photo"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this photo?"
        description="This will permanently remove the photo and its file from storage."
        onConfirm={handleDelete}
      />
    </div>
  );
}
