'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

type MediaUploaderProps = {
  bucket: 'photos' | 'documents' | 'voice';
  accept?: string;
  multiple?: boolean;
  onUploaded: (files: { path: string; url: string; name: string }[]) => void;
  label?: string;
  className?: string;
};

export function MediaUploader({
  bucket,
  accept,
  multiple = false,
  onUploaded,
  label = 'Upload file',
  className,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be signed in to upload.');
      setUploading(false);
      return;
    }

    const results: { path: string; url: string; name: string }[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file);
      if (upErr) {
        setError(upErr.message);
        setUploading(false);
        return;
      }
      let url: string;
      if (bucket === 'photos') {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        url = data.publicUrl;
      } else {
        const { data, error: signedErr } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signedErr || !data) {
          setError('Could not generate file URL.');
          setUploading(false);
          return;
        }
        url = data.signedUrl;
      }
      results.push({ path, url, name: file.name });
    }
    onUploaded(results);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">{label}</p>
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-input bg-secondary/30 px-4 py-6 text-center transition-colors hover:border-accent/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <>
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag files here or{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-primary hover:underline"
              >
                browse
              </button>
            </p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
