import Link from 'next/link';
import {
  HelpCircle,
  BookOpen,
  Shield,
  MessageCircle,
  Sparkles,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Is my family archive private?',
    a: 'Yes. Everything you add to Rooted belongs to you. Your archive is private by default, and you choose who to invite and what they can see.',
  },
  {
    q: 'Can my relatives contribute?',
    a: 'In a later phase, you will be able to invite family members to add their own memories, photos, and stories to your shared archive.',
  },
  {
    q: 'What can I preserve in Rooted?',
    a: 'Stories, photographs, voice notes, recipes, traditions, letters, documents, and the people who connect them — all in one place.',
  },
  {
    q: 'What happens to a guest session?',
    a: 'Guest sessions are temporary and nothing is saved. Create an account to securely preserve your memories and access them from any device.',
  },
  {
    q: 'Is this a finished product?',
    a: 'Rooted is growing in phases. This first phase establishes the foundation — your account, navigation, and a welcoming home. More features arrive soon.',
  },
];

const resources = [
  {
    icon: BookOpen,
    title: 'Getting started guide',
    description: 'Learn the basics of building your first archive.',
  },
  {
    icon: Shield,
    title: 'Privacy & security',
    description: 'How we keep your family memories safe.',
  },
  {
    icon: MessageCircle,
    title: 'Community',
    description: 'Connect with other families preserving their stories.',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        title="Help & Support"
        description="Guides, answers, and a friendly hand whenever you need one. We're here to help you preserve what matters."
      />

      {/* Resources */}
      <section className="grid gap-4 sm:grid-cols-3">
        {resources.map((r) => (
          <Card key={r.title} className="border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
            <CardContent className="p-5">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <p className="font-serif text-base font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* FAQ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl font-semibold">Frequently asked questions</h2>
        </div>
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-2">
            <Accordion type="single" collapsible>
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="px-4 text-left font-serif text-base">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Contact CTA */}
      <Card className="border-border/70 bg-gradient-to-br from-card to-secondary/60 shadow-soft">
        <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent-foreground">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Still need a hand?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Reach out and a member of our team will get back to you warmly.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="mailto:hello@rooted.example">
              Contact us
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 rounded-xl bg-accent/10 p-4 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-accent-foreground" />
        Rooted is growing in phases — more help and features are on the way.
      </div>
    </div>
  );
}
