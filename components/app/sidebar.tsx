'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { navItems, secondaryNavItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const renderLink = (item: typeof navItems[number]) => {
    const active =
      pathname === item.href ||
      (item.href !== '/app' && pathname.startsWith(item.href));
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent/20 hover:text-foreground'
          )}
          aria-current={active ? 'page' : undefined}
        >
          <item.icon
            className={cn(
              'h-5 w-5 shrink-0 transition-colors',
              active
                ? 'text-primary'
                : 'text-muted-foreground group-hover:text-foreground'
            )}
          />
          <span>{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-border/60 bg-secondary/40 lg:flex lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex h-16 items-center border-b border-border/60 px-6">
        <Link href="/app">
          <Logo />
        </Link>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(renderLink)}
        </ul>
        <div className="mt-6">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            More
          </p>
          <ul className="space-y-1">
            {secondaryNavItems.map(renderLink)}
          </ul>
        </div>
      </nav>
      <div className="border-t border-border/60 p-4">
        <div className="rounded-lg bg-card p-4 text-xs text-muted-foreground">
          <p className="font-serif text-sm font-medium text-foreground">
            Every Story Begins with Roots
          </p>
          <p className="mt-1">Phase 2 — Living Archive</p>
        </div>
      </div>
    </aside>
  );
}
