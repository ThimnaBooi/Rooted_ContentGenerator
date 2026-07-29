'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`,
      });
      if (error) {
        if (
          error.message.toLowerCase().includes('rate limit') ||
          error.message.toLowerCase().includes('for security purposes')
        ) {
          toast.error('For security, please wait a minute before requesting another link.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      setSent(true);
    } catch {
      toast.error('Could not connect to the server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-accent/20 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-muted-foreground">
          If an account exists for{' '}
          <span className="font-medium text-foreground">{email}</span>, you&apos;ll
          receive a link to reset your password shortly.
        </p>
        <Button className="mt-8 w-full" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Forgot password
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              aria-invalid={!!error}
              aria-describedby={error ? 'email-error' : undefined}
            />
          </div>
          {error && (
            <p id="email-error" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
