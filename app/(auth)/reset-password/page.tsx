'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/lib/supabase-client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState(false);

  const isRecovery = params.get('type') === 'recovery' || !!params.get('code') || !!params.get('token');

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          setSessionError(true);
          setCheckingSession(false);
          return;
        }

        if (data.session) {
          setSessionReady(true);
          setCheckingSession(false);
          return;
        }

        // No session yet — if this is a recovery link, the Supabase client
        // with detectSessionInUrl:true should be processing the hash.
        // Wait briefly and re-check.
        setTimeout(async () => {
          if (!mounted) return;
          const { data: retry } = await supabase.auth.getSession();
          if (!mounted) return;
          if (retry.session) {
            setSessionReady(true);
          } else {
            setSessionError(true);
          }
          setCheckingSession(false);
        }, 1500);
      } catch {
        if (mounted) {
          setSessionError(true);
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      if (next) {
        setSessionReady(true);
        setCheckingSession(false);
        setSessionError(false);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  function validate() {
    const next: { password?: string; confirm?: string } = {};
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
      toast.success('Your password has been updated.');
      setTimeout(() => router.replace('/app'), 1500);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-accent/20 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">Password updated</h1>
        <p className="mt-3 text-muted-foreground">
          Your password has been changed. Taking you to your archive…
        </p>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="animate-fade-up text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
      </div>
    );
  }

  if (sessionError || !sessionReady) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">Reset link expired</h1>
        <p className="mt-3 text-muted-foreground">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Button className="mt-6 w-full" asChild>
          <Link href="/forgot-password">Request new link</Link>
        </Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-muted-foreground">Choose a new password to secure your Rooted account.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
            />
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-9"
            />
          </div>
          {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
