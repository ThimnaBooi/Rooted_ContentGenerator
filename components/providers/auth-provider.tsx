'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

type GuestState = boolean;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isGuest: GuestState;
  loading: boolean;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_KEY = 'rooted:guest';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState<GuestState>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setSession(null);
        } else {
          setSession(data.session);
          if (data.session) {
            setIsGuest(false);
            localStorage.removeItem(GUEST_KEY);
          } else {
            setIsGuest(localStorage.getItem(GUEST_KEY) === '1');
          }
        }
      })
      .catch(() => {
        if (mounted) setSession(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    let sub: { subscription: { unsubscribe: () => void } } | undefined;
    try {
      sub = supabase.auth.onAuthStateChange((_event, next) => {
        (async () => {
          if (!mounted) return;
          setSession(next);
          if (next) {
            setIsGuest(false);
            localStorage.removeItem(GUEST_KEY);
          }
        })();
      }).data;
    } catch {
      // onAuthStateChange unavailable — auth continues without live updates
    }

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
    setSession(null);
  };

  const enterGuestMode = () => {
    setIsGuest(true);
    localStorage.setItem(GUEST_KEY, '1');
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isGuest,
      loading,
      signOut,
      enterGuestMode,
      exitGuestMode,
    }),
    [session, isGuest, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
