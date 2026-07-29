'use client';

import { useEffect, useState } from 'react';
import { Plus, Mic, Loader2, Play } from 'lucide-react';
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
import { getVoiceRecordings, createVoice, deleteVoice } from '@/lib/queries';
import { toast } from 'sonner';

export default function VoicePage() {
  const [recordings, setRecordings] = useState<
    { id: string; title: string; description: string | null; public_url: string; duration_seconds: number | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    storage_path: '',
    public_url: '',
  });
  const [personIds, setPersonIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getVoiceRecordings();
      setRecordings(data);
    } catch {
      toast.error('Could not load voice recordings.');
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
        title: f.title || files[0].name.replace(/\.[^.]+$/, ''),
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
      await createVoice({
        title: form.title.trim(),
        description: form.description.trim() || null,
        storage_path: form.storage_path,
        public_url: form.public_url,
        person_ids: personIds,
      });
      toast.success('Voice recording added.');
      setForm({ title: '', description: '', storage_path: '', public_url: '' });
      setPersonIds([]);
      setUploadOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save recording.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteVoice(deleteId);
      setRecordings((r) => r.filter((x) => x.id !== deleteId));
      toast.success('Recording deleted.');
    } catch {
      toast.error('Could not delete recording.');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Voice Memories"
        description="Recordings of voices, laughter, and sayings. Upload audio clips and add titles, descriptions, and the people they belong to."
      />

      <div className="flex justify-end">
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload recording
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : recordings.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No voice recordings yet"
          description="Upload audio of voices, laughter, songs, or stories. AI transcription will be available in a future phase."
          actionLabel="Upload your first recording"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recordings.map((r) => (
            <Card
              key={r.id}
              className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Mic className="h-5 w-5" />
                  </div>
                  <ItemActions entityLabel={r.title} onDelete={() => setDeleteId(r.id)} />
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold">{r.title}</h3>
                {r.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {r.description}
                  </p>
                )}
                <audio
                  controls
                  src={r.public_url}
                  className="mt-3 h-9 w-full"
                  preload="metadata"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Upload a voice recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <MediaUploader
              bucket="voice"
              accept="audio/*"
              label="Choose an audio file"
              onUploaded={onUploaded}
            />
            <div className="space-y-2">
              <Label htmlFor="voice-title">Title *</Label>
              <Input
                id="voice-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Grandma singing her lullaby"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice-desc">Description</Label>
              <Textarea
                id="voice-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <PersonSelector selected={personIds} onChange={setPersonIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this recording?"
        description="This will permanently remove the recording and its file."
        onConfirm={handleDelete}
      />
    </div>
  );
}
