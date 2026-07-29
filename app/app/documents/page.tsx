'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, Loader2, Download } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDocuments, createDocument, deleteDocument } from '@/lib/queries';
import { DOCUMENT_CATEGORIES } from '@/lib/types';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<
    { id: string; title: string; description: string | null; category: string | null; public_url: string; file_type: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    storage_path: '',
    public_url: '',
    file_type: '',
  });
  const [personIds, setPersonIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch {
      toast.error('Could not load documents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onUploaded(files: { path: string; url: string; name: string }[]) {
    if (files.length > 0) {
      setForm((f) => ({
        ...f,
        storage_path: files[0].path,
        public_url: files[0].url,
        title: f.title || files[0].name,
        file_type: files[0].name.split('.').pop() ?? '',
      }));
    }
  }

  async function save() {
    if (!form.title.trim() || !form.storage_path) {
      toast.error('Title and file are required.');
      return;
    }
    setSaving(true);
    try {
      await createDocument({
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        storage_path: form.storage_path,
        public_url: form.public_url,
        file_type: form.file_type || null,
        person_ids: personIds,
      });
      toast.success('Document added to your archive.');
      setForm({
        title: '',
        description: '',
        category: '',
        storage_path: '',
        public_url: '',
        file_type: '',
      });
      setPersonIds([]);
      setUploadOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save document.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteDocument(deleteId);
      setDocuments((d) => d.filter((x) => x.id !== deleteId));
      toast.success('Document deleted.');
    } catch {
      toast.error('Could not delete document.');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Documents"
        description="Scanned letters, certificates, handwritten notes, recipes, newspaper articles, and other family documents — preserved and organized."
      />

      <div className="flex justify-end">
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload document
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload scanned letters, certificates, handwritten notes, or newspaper articles. Categorize each document and connect it to people."
          actionLabel="Upload your first document"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((d) => (
            <Card
              key={d.id}
              className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <ItemActions entityLabel={d.title} onDelete={() => setDeleteId(d.id)} />
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold">{d.title}</h3>
                {d.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {d.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {d.category && (
                    <Badge variant="secondary" className="bg-accent/20 text-accent-foreground capitalize">
                      {d.category}
                    </Badge>
                  )}
                  {d.file_type && (
                    <span className="text-xs uppercase text-muted-foreground">
                      .{d.file_type}
                    </span>
                  )}
                </div>
                <a
                  href={d.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Download className="h-3 w-3" />
                  View document
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Upload a document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <MediaUploader
              bucket="documents"
              label="Choose a file"
              onUploaded={onUploaded}
            />
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title *</Label>
              <Input
                id="doc-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Grandfather's birth certificate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-desc">Description</Label>
              <Textarea
                id="doc-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category…" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PersonSelector
              selected={personIds}
              onChange={setPersonIds}
              label="Connected people"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this document?"
        description="This will permanently remove the document and its file."
        onConfirm={handleDelete}
      />
    </div>
  );
}
