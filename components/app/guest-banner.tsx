'use client';

import Link from 'next/link';
import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function GuestBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b border-accent/30 bg-accent/15 px-4 py-2.5 sm:px-6">
      <Info className="h-4 w-4 shrink-0 text-accent-foreground" />
      <p className="flex-1 text-sm text-accent-foreground/90">
        You&apos;re exploring as a guest. Sessions are temporary and nothing is
        saved.{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>{' '}
        to preserve your memories.
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label="Dismiss banner"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
