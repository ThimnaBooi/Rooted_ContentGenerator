'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Save,
  RefreshCw,
  Star,
  History,
  Check,
  X,
  Lightbulb,
  Sparkles,
  Copy,
  Download,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import {
  getDocument,
  updateDocument,
  deleteDocument,
  duplicateDocument,
  toggleDocumentFavourite,
  getDocumentVersions,
  saveDocumentVersion,
  restoreDocumentVersion,
  getFolders,
} from '@/lib/studio-queries';
import { supabase } from '@/lib/supabase-client';
import type { StudioDocument, StudioDocumentVersion, StudioFolder } from '@/lib/studio-types';
import { toast } from 'sonner';

function EditorInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = params.id as string;

  const [doc, setDoc] = useState<StudioDocument | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [versions, setVersions] = useState<StudioDocumentVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [folders, setFolders] = useState<StudioFolder[]>([]);
  const [showFolders, setShowFolders] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const s = searchParams.get('suggestions');
    if (s) {
      try {
        const parsed = JSON.parse(decodeURIComponent(s));
        setSuggestions(parsed);
      } catch {}
    }
  }, [searchParams]);

  useEffect(() => {
    if (!docId) return;
    (async () => {
      setLoading(true);
      try {
        const [d, vers, flds] = await Promise.all([
          getDocument(docId),
          getDocumentVersions(docId),
          getFolders(),
        ]);
        setDoc(d);
        setTitle(d?.title ?? '');
        setContent(d?.content ?? '');
        setIsFav(d?.is_favourite ?? false);
        setVersions(vers);
        setFolders(flds);
      } catch {
        toast.error('Could not load document.');
      } finally {
        setLoading(false);
      }
    })();
  }, [docId]);

  async function handleSave() {
    if (!doc) return;
    setSaving(true);
    try {
      await updateDocument(doc.id, { title, content, is_draft: false, status: 'saved' });
      await saveDocumentVersion(doc.id, title, content);
      const vers = await getDocumentVersions(doc.id);
      setVersions(vers);
      toast.success('Document saved.');
    } catch {
      toast.error('Could not save document.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!doc) return;
    setRegenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const sourceContext = doc.source_refs
        ? (doc.source_refs as any)?.items?.map((s: any) => `[${s.type.toUpperCase()}] ${s.title}`).join('\n\n') || ''
        : '';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({
            contentType: doc.content_type,
            sourceContext,
            writingStyle: doc.writing_style,
            tone: doc.tone,
            targetAudience: doc.target_audience,
            detailLevel: doc.detail_level,
            documentLength: doc.document_length,
            language: doc.language,
            customInstructions: doc.custom_instructions,
          }),
        }
      );

      if (!response.ok) throw new Error('Regeneration failed');
      const result = await response.json();
      setContent(result.content);
      if (result.title) setTitle(result.title);
      if (result.suggestions?.length) setSuggestions(result.suggestions);
      toast.success('Content regenerated. Review and save when ready.');
    } catch {
      toast.error('Could not regenerate content.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDuplicate() {
    if (!doc) return;
    try {
      const copy = await duplicateDocument(doc.id);
      if (copy) {
        toast.success('Document duplicated.');
        router.push(`/app/studio/editor/${copy.id}`);
      }
    } catch {
      toast.error('Could not duplicate document.');
    }
  }

  async function handleDelete() {
    if (!doc) return;
    try {
      await deleteDocument(doc.id);
      toast.success('Document deleted.');
      router.push('/app/studio/library');
    } catch {
      toast.error('Could not delete document.');
    } finally {
      setDeleteOpen(false);
    }
  }

  async function handleFavourite() {
    if (!doc) return;
    const next = !isFav;
    setIsFav(next);
    await toggleDocumentFavourite(doc.id, next);
  }

  async function handleRestoreVersion(versionId: string) {
    if (!doc) return;
    try {
      const restored = await restoreDocumentVersion(doc.id, versionId);
      if (restored) {
        setTitle(restored.title);
        setContent(restored.content ?? '');
        toast.success('Restored to previous version.');
      }
    } catch {
      toast.error('Could not restore version.');
    }
  }

  async function moveToFolder(folderId: string | null) {
    if (!doc) return;
    try {
      await updateDocument(doc.id, { folder_id: folderId });
      toast.success(folderId ? 'Moved to folder.' : 'Removed from folder.');
      setShowFolders(false);
    } catch {
      toast.error('Could not move document.');
    }
  }

  function handleExport(format: string) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${format === 'pdf' ? 'html' : format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info(`Exported as ${format.toUpperCase()}. (Full ${format.toUpperCase()} export will be available in a future update.)`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-serif text-lg font-semibold">Document not found</p>
        <Button className="mt-4" asChild><Link href="/app/studio/library">Back to library</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/studio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to Studio
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleFavourite} aria-label="Toggle favourite">
            <Star className={isFav ? 'h-4 w-4 fill-accent text-accent' : 'h-4 w-4'} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDuplicate} aria-label="Duplicate">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowVersions(true)} aria-label="Version history">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowFolders(true)} aria-label="Move to folder">
            <FolderOpen className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Export"><Download className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')}>Export as DOCX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('html')}>Export as HTML</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteOpen(true)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-accent/40 bg-accent/5 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-accent-foreground" />
                  AI suggestions
                </p>
                <ul className="mt-2 space-y-1">
                  {suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{s}</li>
                  ))}
                </ul>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowSuggestions(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-0 bg-transparent font-serif text-2xl font-semibold shadow-none focus-visible:ring-0"
        placeholder="Untitled document"
      />

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary capitalize">{doc.content_type.replace(/_/g, ' ')}</Badge>
        {doc.is_draft ? <Badge variant="outline">Draft</Badge> : <Badge variant="outline" className="text-success">Saved</Badge>}
      </div>

      {/* Rich text editor */}
      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="p-6">
          <div className="mb-3 flex flex-wrap gap-1 border-b border-border/60 pb-3">
            <Button variant="ghost" size="sm" className="h-8 font-bold" onClick={() => document.execCommand('bold')}>B</Button>
            <Button variant="ghost" size="sm" className="h-8 italic" onClick={() => document.execCommand('italic')}>I</Button>
            <Button variant="ghost" size="sm" className="h-8 underline" onClick={() => document.execCommand('underline')}>U</Button>
            <div className="w-px bg-border" />
            <Button variant="ghost" size="sm" className="h-8" onClick={() => document.execCommand('formatBlock', false, 'h1')}>H1</Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => document.execCommand('formatBlock', false, 'h2')}>H2</Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => document.execCommand('formatBlock', false, 'h3')}>H3</Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => document.execCommand('formatBlock', false, 'p')}>P</Button>
            <div className="w-px bg-border" />
            <Button variant="ghost" size="sm" className="h-8" onClick={() => document.execCommand('insertUnorderedList')}>• List</Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => document.execCommand('insertOrderedList')}>1. List</Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => document.execCommand('formatBlock', false, 'blockquote')}>Quote</Button>
          </div>
          <div
            contentEditable
            suppressContentEditableWarning
            className="min-h-[400px] prose prose-sm max-w-none focus:outline-none"
            dangerouslySetInnerHTML={{ __html: content }}
            onBlur={(e) => setContent(e.currentTarget.innerHTML)}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={handleRegenerate} disabled={regenerating}>
          {regenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Regenerate
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/app/studio')}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save document
          </Button>
        </div>
      </div>

      {/* Version history dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-xl">Version history</DialogTitle></DialogHeader>
          {versions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No saved versions yet. Save the document to create one.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                  <div>
                    <p className="text-sm font-medium">{v.title}</p>
                    <p className="text-xs text-muted-foreground">Version {v.version_number} • {new Date(v.created_at).toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRestoreVersion(v.id)}>
                    <RefreshCw className="mr-1.5 h-3 w-3" />Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowVersions(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder dialog */}
      <Dialog open={showFolders} onOpenChange={setShowFolders}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-serif text-xl">Move to folder</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => moveToFolder(null)}>No folder</Button>
            {folders.map((f) => (
              <Button key={f.id} variant="outline" className="w-full justify-start" onClick={() => moveToFolder(f.id)}>
                <FolderOpen className="mr-2 h-4 w-4" />{f.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this document?"
        description="This will permanently delete the document and all its versions."
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <EditorInner />
    </Suspense>
  );
}
