'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Sidebar } from '@/components/app/sidebar';
import { Topbar } from '@/components/app/topbar';
import { GuestBanner } from '@/components/app/guest-banner';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, isGuest, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session && !isGuest) {
      router.replace('/login');
    }
  }, [loading, session, isGuest, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm">Opening your archive…</p>
        </div>
      </div>
    );
  }

  if (!session && !isGuest) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background bg-grain">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        {isGuest && <GuestBanner />}
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
