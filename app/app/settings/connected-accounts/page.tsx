'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Share2, Loader2, Check, X, Plus, Trash2, RefreshCw, Shield, ArrowLeft,
  Instagram, Facebook, Linkedin, Twitter, Music2, Globe, MessageCircle, ThumbsUp,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getSocialAccounts, disconnectSocialAccount, deleteSocialAccount, connectSocialAccount,
} from '@/lib/media-queries';
import { SOCIAL_PLATFORMS } from '@/lib/media-types';
import type { SocialAccount } from '@/lib/media-types';
import { cn } from '@/lib/utils';

function platformIcon(platform: string) {
  switch (platform) {
    case 'instagram': return Instagram;
    case 'facebook': return Facebook;
    case 'linkedin': return Linkedin;
    case 'x': return Twitter;
    case 'tiktok': return Music2;
    case 'pinterest': return ThumbsUp;
    case 'threads': return MessageCircle;
    case 'whatsapp': return MessageCircle;
    default: return Globe;
  }
}

export default function ConnectedAccountsPage() {
  const { session, isGuest } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getSocialAccounts();
      setAccounts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isGuest && session) load();
    else setLoading(false);
  }, [session, isGuest, load]);

  async function handleConnect(platform: string) {
    setConnecting(platform);
    try {
      await connectSocialAccount({
        platform,
        accountHandle: '@family_user',
        accountName: 'Family Archive',
      });
      toast.success(`${SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label} account connected.`);
      await load();
    } catch {
      toast.error('Could not connect account. Please try again.');
    } finally {
      setConnecting(null);
    }
  }

  async function handleDisconnect(platform: string) {
    try {
      await disconnectSocialAccount(platform);
      toast.success('Account disconnected.');
      await load();
    } catch {
      toast.error('Could not disconnect account.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSocialAccount(id);
      toast.success('Account removed.');
      await load();
    } catch {
      toast.error('Could not remove account.');
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Connected Accounts" description="Securely connect your social media accounts for optional publishing." />
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/app/settings"><ArrowLeft className="h-4 w-4" /> Back to Settings</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const connectedMap = new Map(accounts.map((a) => [a.platform, a]));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="gap-1.5">
        <Link href="/app/settings"><ArrowLeft className="h-4 w-4" /> Back to Settings</Link>
      </Button>

      <PageHeader
        title="Connected Accounts"
        description="Securely connect your social media accounts to publish content from Rooted. Your passwords are never stored — we use each platform's official authorisation process."
      />

      {/* Security notice */}
      <div className="rounded-xl bg-accent/10 p-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <Shield className="h-4 w-4 shrink-0 text-accent-foreground" />
          <span>
            Rooted never stores your social media passwords. We use secure, platform-authorised tokens that you can revoke at any time. Disconnecting an account immediately removes all access.
          </span>
        </p>
      </div>

      {/* Platform list */}
      <div className="space-y-3">
        {SOCIAL_PLATFORMS.map((p) => {
          const account = connectedMap.get(p.value);
          const Icon = platformIcon(p.value);
          const isConnected = account?.status === 'connected';
          const isExpired = account?.status === 'expired';

          return (
            <Card key={p.value} className={cn('border-border/70 bg-card', isConnected && 'border-green-500/20')}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'grid h-10 w-10 place-items-center rounded-lg',
                    isConnected ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    {isConnected && account?.account_handle && (
                      <p className="text-xs text-muted-foreground">{account.account_handle}</p>
                    )}
                    {isExpired && (
                      <p className="text-xs text-highlight">Session expired — reconnect needed</p>
                    )}
                    {!account && (
                      <p className="text-xs text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600">
                        <Check className="h-3 w-3" /> Connected
                      </Badge>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handleDisconnect(p.value)}>
                        Disconnect
                      </Button>
                    </>
                  ) : isExpired ? (
                    <>
                      <Badge variant="outline" className="gap-1 border-highlight/30 text-highlight">
                        <X className="h-3 w-3" /> Expired
                      </Badge>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handleConnect(p.value)}>
                        <RefreshCw className="h-3.5 w-3.5" /> Reconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="h-8 gap-1.5" onClick={() => handleConnect(p.value)} disabled={connecting === p.value}>
                      {connecting === p.value ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Connect
                    </Button>
                  )}
                  {account && !isConnected && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(account.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
