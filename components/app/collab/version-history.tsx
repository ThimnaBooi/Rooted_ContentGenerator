'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, RotateCcw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getContentVersions } from '@/lib/collab-queries';
import type { ContentVersion } from '@/lib/collab-types';
import { cn } from '@/lib/utils';

type VersionHistoryProps = {
  entityType: string;
  entityId: string;
  onRestore?: (snapshot: Record<string, unknown>) => Promise<void>;
  className?: string;
};

function formatVersionDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VersionHistory({ entityType, entityId, onRestore, className }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContentVersions(entityType, entityId);
      setVersions(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function handleRestore(version: ContentVersion) {
    if (!onRestore) return;
    setRestoring(true);
    try {
      await onRestore(version.snapshot);
      setOpen(false);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-1.5', className)}>
          <History className="h-3.5 w-3.5" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Version History</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : versions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No version history yet. Versions are created when content is edited.
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {versions.map((version) => (
              <div key={version.id} className="rounded-lg border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      v{version.version_number}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {version.editor_email ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatVersionDate(version.created_at)}
                        {version.edit_summary ? ` · ${version.edit_summary}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setExpanded(expanded === version.id ? null : version.id)}
                    >
                      {expanded === version.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {onRestore && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2"
                        onClick={() => handleRestore(version)}
                        disabled={restoring}
                      >
                        {restoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
                {expanded === version.id && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                    {JSON.stringify(version.snapshot, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
