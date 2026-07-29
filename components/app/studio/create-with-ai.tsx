'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Baby, Mic, UtensilsCrossed, Gift, Image as ImageIcon, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

type CreateWithAIProps = {
  sourceType: string;
  sourceId: string;
  sourceName: string;
};

type Action = {
  icon: LucideIcon;
  label: string;
  contentType: string;
  accent: string;
};

const actions: Action[] = [
  { icon: BookOpen, label: 'Generate a Biography', contentType: 'biography', accent: 'bg-primary/10 text-primary' },
  { icon: Baby, label: 'Create a Children\'s Story', contentType: 'childrens_storybook', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: Mic, label: 'Write a Speech', contentType: 'tribute_speech', accent: 'bg-primary/10 text-primary' },
  { icon: UtensilsCrossed, label: 'Produce a Recipe Book', contentType: 'recipe_book', accent: 'bg-accent/20 text-accent-foreground' },
  { icon: Gift, label: 'Build a Keepsake', contentType: 'printable_keepsake', accent: 'bg-primary/10 text-primary' },
  { icon: ImageIcon, label: 'Create Artwork', contentType: '', accent: 'bg-accent/20 text-accent-foreground' },
];

export function CreateWithAI({ sourceType, sourceId, sourceName }: CreateWithAIProps) {
  const router = useRouter();
  const { isGuest } = useAuth();

  if (isGuest) return null;

  return (
    <Card className="border-accent/30 bg-accent/5 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
          Create with AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Transform {sourceName}'s story into something new. The AI will only use information from your archive — nothing is invented.
        </p>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (a.contentType === '') {
                  router.push('/app/studio/create-image');
                } else {
                  router.push(`/app/studio/create?type=${a.contentType}`);
                }
              }}
            >
              <a.icon className="h-4 w-4" />
              {a.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
