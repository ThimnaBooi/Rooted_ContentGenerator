'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTemplates } from '@/lib/studio-queries';
import { TEMPLATE_TYPES } from '@/lib/studio-types';
import type { StudioTemplate } from '@/lib/studio-types';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

// Built-in template definitions shown alongside user templates
const builtInTemplates = [
  { name: 'Classic Biography Book', template_type: 'book', description: 'A timeless layout with chapter headings, a title page, and flowing narrative sections. Perfect for life stories and family histories.' },
  { name: 'Tribute Speech Format', template_type: 'speech', description: 'A structured speech layout with opening, personal stories, reflections, and closing remarks. Ideal for memorials and celebrations.' },
  { name: 'Watercolour Greeting Card', template_type: 'greeting_card', description: 'A warm, hand-painted card layout with space for a personal message and decorative botanical accents.' },
  { name: 'Family Heritage Poster', template_type: 'poster', description: 'A bold poster layout featuring a family name, key dates, and space for a central photograph or illustration.' },
  { name: 'Seasonal Family Newsletter', template_type: 'newsletter', description: 'A multi-section newsletter with headings for milestones, updates, recipes, and upcoming events.' },
  { name: 'Printable Keepsake Card', template_type: 'keepsake', description: 'A compact, frameable card with a quote, photo, and short dedication. Perfect for gifts and memorials.' },
  { name: "Children's Storybook Layout", template_type: 'book', description: 'A playful layout with alternating text and illustration pages, simple language, and large headings.' },
  { name: 'Recipe Book Format', template_type: 'book', description: 'A cookbook layout with recipe cards, ingredient lists, personal notes, and space for food photography.' },
];

export default function TemplatesPage() {
  const { isGuest } = useAuth();
  const [userTemplates, setUserTemplates] = useState<StudioTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const data = await getTemplates();
        setUserTemplates(data.filter((t) => !t.is_system));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [isGuest]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Templates"
        description="Professionally designed layouts for books, speeches, cards, posters, and keepsakes. Select a template before generating content, and the AI will adapt the output to match."
      />

      {isGuest ? (
        <EmptyState icon={FileText} title="Sign in to use templates" description="Create an account to access templates and start generating content." actionLabel="Create account" actionHref="/register" />
      ) : (
        <>
          <section>
            <h2 className="mb-4 font-serif text-xl font-semibold">Built-in templates</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {builtInTemplates.map((t) => {
                const typeLabel = TEMPLATE_TYPES.find((tt) => tt.value === t.template_type)?.label || t.template_type;
                return (
                  <Card key={t.name} className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                    <CardContent className="p-5">
                      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="font-serif text-base font-semibold">{t.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">{typeLabel}</Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/app/studio/create`}>
                            Use template <Sparkles className="ml-1.5 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {userTemplates.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold">Your templates</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userTemplates.map((t) => (
                  <Card key={t.id} className="border-border/70 bg-card shadow-soft">
                    <CardContent className="p-5">
                      <p className="font-serif text-base font-semibold">{t.name}</p>
                      {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
