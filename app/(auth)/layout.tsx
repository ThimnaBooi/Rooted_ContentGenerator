import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Leaf } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background bg-grain">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left — brand panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-[#a85a3f] p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute bottom-10 -left-10 h-72 w-72 rounded-full bg-highlight/20 blur-3xl" />
          </div>
          <Link href="/" className="relative">
            <span className="inline-flex items-center gap-2.5 text-primary-foreground">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/15">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22V11" />
                  <path d="M12 22c-2 0-3.5-1-3.5-2.5" />
                  <path d="M12 22c2 0 3.5-1 3.5-2.5" />
                  <path d="M12 11c-3 0-5-2-5-4.5S9 2 12 2s5 2 5 4.5S15 11 12 11Z" />
                </svg>
              </span>
              <span className="font-serif text-xl font-semibold">Rooted</span>
            </span>
          </Link>
          <div className="relative max-w-md">
            <Leaf className="mb-6 h-8 w-8 text-accent" />
            <p className="font-serif text-3xl font-medium leading-snug">
              &ldquo;Every Story Begins with Roots.&rdquo;
            </p>
            <p className="mt-4 text-primary-foreground/85">
              Rooted is a warm, living library for your family&apos;s memories,
              traditions, and stories — kept safe for the generations ahead.
            </p>
          </div>
          <div className="relative text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} Rooted
          </div>
        </div>

        {/* Right — form panel */}
        <div className="flex flex-col px-4 py-10 sm:px-6 lg:px-12">
          <div className="lg:hidden">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
