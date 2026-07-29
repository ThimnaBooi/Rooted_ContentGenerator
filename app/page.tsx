import Link from 'next/link';
import {
  Archive,
  BookOpen,
  Mic,
  Camera,
  UtensilsCrossed,
  Landmark,
  Sprout,
  PenLine,
  ShieldCheck,
  Heart,
  ArrowRight,
  Star,
  Leaf,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Archive,
    title: 'Family Archives',
    description:
      'Gather photographs, letters, and documents into a single, beautifully organized archive your family can revisit anytime.',
  },
  {
    icon: BookOpen,
    title: 'Storytelling',
    description:
      'Capture the stories that define your family in your own words, preserving the voices and moments that matter most.',
  },
  {
    icon: Camera,
    title: 'Memory Albums',
    description:
      'Build visual albums around milestones, people, and places, so memories stay vivid for generations to come.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Recipe Collections',
    description:
      'Keep beloved family recipes, the notes in the margins, and the stories behind them in one warm, living cookbook.',
  },
  {
    icon: Mic,
    title: 'Voice Memories',
    description:
      'Record the voices, laughter, and sayings of the people you love, so their sound is never lost to time.',
  },
  {
    icon: Landmark,
    title: 'Cultural Heritage',
    description:
      'Document the traditions, rituals, and customs that connect your family to its roots and to one another.',
  },
];

const steps = [
  {
    icon: Sprout,
    title: 'Create your archive',
    description:
      'Set up your family archive in minutes. A private, welcoming space that belongs to you and the people you invite.',
  },
  {
    icon: PenLine,
    title: 'Add memories',
    description:
      'Add stories, photos, recipes, and voice notes one piece at a time, whenever the moment feels right.',
  },
  {
    icon: Heart,
    title: 'Grow your family story',
    description:
      'Invite relatives to contribute their own memories, weaving many perspectives into one shared narrative.',
  },
  {
    icon: ShieldCheck,
    title: 'Preserve your legacy',
    description:
      'Everything you gather is kept safe in one place, ready to be discovered and treasured by generations ahead.',
  },
];

const testimonials = [
  {
    name: 'Amara O.',
    role: 'Grandmother of three',
    quote:
      'Rooted gave me a quiet place to finally write down the stories my grandmother told me. Now my grandchildren can read them whenever they want.',
    initials: 'AO',
  },
  {
    name: 'Daniel & Sofia R.',
    role: 'New parents',
    quote:
      'We started an album the week our daughter was born. Adding a photo and a little note has become our favorite evening ritual.',
    initials: 'DR',
  },
  {
    name: 'Mei-Ling H.',
    role: 'Family historian',
    quote:
      'After years of scattered boxes and folders, Rooted is where everything finally lives together. It feels like a family library I can walk into.',
    initials: 'MH',
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background bg-grain">
      {/* Top bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#stories" className="transition-colors hover:text-foreground">
              Stories
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute top-40 -left-16 h-72 w-72 rounded-full bg-highlight/20 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="animate-fade-up">
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 border-accent/40 bg-accent/10 px-3 py-1 text-accent-foreground"
            >
              <Leaf className="h-3.5 w-3.5" />
              Every Story Begins with Roots
            </Badge>
            <h1 className="text-balance font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Preserve the stories that shape your family.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Rooted helps families preserve memories, traditions, stories, and
              heritage for future generations in one secure digital archive. A
              warm, living library that grows with every contribution.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="group">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login?guest=1">Explore Rooted</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              No credit card needed. Your archive is private and always yours.
            </p>
          </div>

          {/* Illustration placeholder */}
          <div className="animate-fade [animation-delay:120ms]">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-accent/40 via-card to-highlight/20 shadow-soft-lg" />
              <div className="absolute inset-3 grid place-items-center rounded-[1.6rem] border border-border/60 bg-card/70 backdrop-blur-sm">
                <div className="px-8 text-center">
                  <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-10 w-10"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22V12" />
                      <path d="M12 12c-3.5 0-6-2.5-6-5.5S8.5 1 12 1s6 2.5 6 5.5S15.5 12 12 12Z" />
                      <path d="M12 22c-2.5 0-4-1.5-4-3" />
                      <path d="M12 22c2.5 0 4-1.5 4-3" />
                      <path d="M5 17c-1.5 0-2.5-1-2.5-2.2 0-1.3 1-2.3 2.3-2.3.4-1.4 1.7-2.5 3.2-2.5" />
                      <path d="M19 17c1.5 0 2.5-1 2.5-2.2 0-1.3-1-2.3-2.3-2.3-.4-1.4-1.7-2.5-3.2-2.5" />
                    </svg>
                  </div>
                  <p className="font-serif text-lg font-medium">
                    Family trees, books, photographs, handwritten letters, and
                    keepsakes — gathered in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              A home for every kind of memory
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Rooted brings the pieces of your family story together, so nothing
              is lost and everything is easy to find.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <CardContent className="p-6">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Four simple steps from first memory to a legacy that lasts.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-accent/20 font-serif text-lg font-semibold text-primary">
                  {i + 1}
                </div>
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="stories" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Stories from the Rooted community
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A glimpse of how families are already making Rooted their own.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card
                key={t.name}
                className="border-border/70 bg-card shadow-soft"
              >
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="flex-1 font-serif text-base leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 font-serif text-sm font-semibold text-primary">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-[#a85a3f] px-8 py-14 text-center text-primary-foreground shadow-soft-lg sm:px-16">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-2xl" />
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Begin your family archive today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
              Every story begins with roots. Start gathering yours in a place
              that feels like home.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Create your archive</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                A warm, timeless digital archive for the stories, traditions,
                and memories that shape your family.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Rooted</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Connect</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    Pinterest
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Stay in touch</h3>
              <p className="mt-4 text-sm text-muted-foreground">
                Occasional letters about preserving family stories.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email address"
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm">Join</Button>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Rooted. Every Story Begins with Roots.</p>
            <p>Made with care for families everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
