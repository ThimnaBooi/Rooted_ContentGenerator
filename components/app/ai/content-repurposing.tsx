'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Repeat, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { REPURPOSE_OPTIONS } from '@/lib/ai-types';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof Repeat> = {
  Baby: Repeat, BookMarked: Repeat, Headphones: Repeat, Mic: Repeat, Film: Repeat,
  CalendarClock: Repeat, Image: Repeat, Images: Repeat, Share2: Repeat, Newspaper: Repeat,
  UtensilsCrossed: Repeat, Gift: Repeat, Mail: Repeat, Video: Repeat, GalleryHorizontalEnd: Repeat,
};

export function ContentRepurposing({
  sourceTitle,
  sourceType,
  className,
}: {
  sourceTitle: string;
  sourceType: string;
  className?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? REPURPOSE_OPTIONS : REPURPOSE_OPTIONS.slice(0, 8);

  const repurposeHrefs: Record<string, string> = {
    childrens_story: '/app/studio/create?type=childrens_storybook',
    illustrated_book: '/app/studio/create?type=family_history_book',
    audiobook: '/app/studio/create-audio',
    podcast: '/app/studio/create-audio',
    documentary: '/app/studio/create-video',
    timeline: '/app/timeline',
    poster: '/app/studio/create-image',
    instagram_carousel: '/app/studio/social',
    facebook_story: '/app/studio/social',
    family_newsletter: '/app/studio/create?type=family_newsletter',
    recipe_book: '/app/studio/create?type=recipe_book',
    keepsake: '/app/studio/create-image',
    greeting_card: '/app/studio/create-image',
    video: '/app/studio/create-video',
    slideshow: '/app/studio/create-video',
  };

  return (
    <Card className={cn('border-accent/20 bg-accent/5 shadow-soft', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-accent-foreground" />
          <CardTitle className="text-lg">Repurpose Content</CardTitle>
        </div>
        <CardDescription>
          Transform "{sourceTitle}" into a new format. Everything is optional — nothing generates automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((opt) => {
            const Icon = iconMap[opt.icon] ?? Repeat;
            const href = repurposeHrefs[opt.value] ?? '/app/studio';
            return (
              <Link
                key={opt.value}
                href={href}
                className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-sm transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1 font-medium">{opt.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
        {REPURPOSE_OPTIONS.length > 8 && (
          <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : `Show all ${REPURPOSE_OPTIONS.length} options`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
