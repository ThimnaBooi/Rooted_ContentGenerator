'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Sparkles, BookOpen, User, Baby, Palette, Image as ImageIcon, Mail,
  Headphones, Mic, Film, GalleryHorizontalEnd, Video, Quote, Gift,
  CalendarClock, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { MEMORY_TO_MEDIA_OPTIONS } from '@/lib/media-types';
import { cn } from '@/lib/utils';

type MemoryToMediaProps = {
  sourceEntityType: string;
  sourceEntityId: string;
  sourceTitle: string;
  className?: string;
};

const OPTION_ICONS: Record<string, typeof BookOpen> = {
  story: BookOpen,
  biography: User,
  childrens_story: Baby,
  illustration: Palette,
  poster: ImageIcon,
  greeting_card: Mail,
  audiobook: Headphones,
  narrated_story: Mic,
  documentary: Film,
  slideshow: GalleryHorizontalEnd,
  video: Video,
  quote_card: Quote,
  printable_keepsake: Gift,
  timeline_page: CalendarClock,
};

const OPTION_HREFS: Record<string, string> = {
  story: '/app/studio/create?type=life_story',
  biography: '/app/studio/create?type=biography',
  childrens_story: '/app/studio/create?type=childrens_storybook',
  illustration: '/app/studio/create-image',
  poster: '/app/studio/create-image',
  greeting_card: '/app/studio/create-image',
  audiobook: '/app/studio/create-audio',
  narrated_story: '/app/studio/create-audio',
  documentary: '/app/studio/create-video',
  slideshow: '/app/studio/create-video',
  video: '/app/studio/create-video',
  quote_card: '/app/studio/create-image',
  printable_keepsake: '/app/studio/create?type=printable_keepsake',
  timeline_page: '/app/timeline',
};

export function MemoryToMedia({ sourceEntityType, sourceEntityId, sourceTitle, className }: MemoryToMediaProps) {
  const { isGuest } = useAuth();
  const [expanded, setExpanded] = useState(false);

  if (isGuest) return null;

  return (
    <Card className={cn('border-border/70 bg-card/40', className)}>
      <CardContent className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Create with AI</p>
              <p className="text-xs text-muted-foreground">
                Transform this {sourceEntityType} into a story, audio, video, and more
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              The AI uses only this {sourceEntityType}'s preserved information — nothing is invented. Your original content remains untouched.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MEMORY_TO_MEDIA_OPTIONS.map((opt) => {
                const Icon = OPTION_ICONS[opt.icon] ?? Sparkles;
                return (
                  <Link
                    key={opt.value}
                    href={`${OPTION_HREFS[opt.value]}?source=${sourceEntityType}:${sourceEntityId}`}
                    className="group rounded-lg border border-border bg-card/50 p-2.5 transition-all hover:border-primary/30 hover:bg-card hover:shadow-soft"
                    onClick={() => toast.info(`Preparing ${opt.label.toLowerCase()} from "${sourceTitle}"…`)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
