'use client';

import { useState } from 'react';
import {
  User,
  AtSign,
  Palette,
  Globe,
  Bell,
  Lock,
  ShieldCheck,
  Moon,
  Sun,
  Monitor,
  Check,
  Save,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, isGuest } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const name = user?.user_metadata?.full_name || (isGuest ? 'Guest' : '');
  const email = user?.email || '';
  const initials = isGuest
    ? 'G'
    : (name as string)
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved.');
    }, 600);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account, appearance, and preferences. Everything here is yours to shape."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Profile</CardTitle>
            </div>
            <CardDescription>How you appear across Rooted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-border/60">
                <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button type="button" variant="outline" size="sm">
                  Change photo
                </Button>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  JPG or PNG, up to 2MB.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" defaultValue={name} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input id="display-name" defaultValue={name} placeholder="How others see you" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Short bio</Label>
              <Input id="bio" placeholder="A line about you and your family" />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AtSign className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Account</CardTitle>
            </div>
            <CardDescription>Your sign-in details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                defaultValue={email}
                placeholder="you@example.com"
                disabled={isGuest}
              />
              {isGuest && (
                <p className="text-xs text-muted-foreground">
                  Guest sessions don&apos;t use an email. Create an account to manage sign-in details.
                </p>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Last changed never</p>
              </div>
              <Button type="button" variant="outline" size="sm">
                Change password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Appearance</CardTitle>
            </div>
            <CardDescription>How Rooted looks for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-3 block">Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-all ${
                      theme === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:border-accent/50'
                    }`}
                  >
                    <opt.icon className="h-5 w-5" />
                    {opt.label}
                    {theme === opt.value && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Reduced motion</p>
                <p className="text-xs text-muted-foreground">Minimize animations and transitions.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compact layout</p>
                <p className="text-xs text-muted-foreground">Tighter spacing for denser screens.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Language &amp; region</CardTitle>
            </div>
            <CardDescription>How dates, text, and formats appear.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region format</Label>
              <Select defaultValue="us">
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States (MM/DD/YYYY)</SelectItem>
                  <SelectItem value="uk">United Kingdom (DD/MM/YYYY)</SelectItem>
                  <SelectItem value="eu">Europe (DD/MM/YYYY)</SelectItem>
                  <SelectItem value="iso">ISO (YYYY-MM-DD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>What Rooted tells you, and how.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'New memories added', desc: 'When a family member contributes to your archive.' },
              { label: 'Invitations accepted', desc: 'When someone joins a family you invited them to.' },
              { label: 'Weekly digest', desc: 'A gentle summary of your archive each week.' },
              { label: 'Product updates', desc: 'Occasional news about new Rooted features.' },
            ].map((n, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch defaultChecked={i < 2} />
                </div>
                {i < 3 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Privacy</CardTitle>
            </div>
            <CardDescription>Who can see and interact with your archive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Private archive</p>
                <p className="text-xs text-muted-foreground">Only you and people you invite can view your archive.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow family contributions</p>
                <p className="text-xs text-muted-foreground">Let invited relatives add their own memories.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Search visibility</p>
                <p className="text-xs text-muted-foreground">Allow your name to appear in search to family members.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Security</CardTitle>
            </div>
            <CardDescription>Keep your account and memories protected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of protection at sign-in.</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Login alerts</p>
                <p className="text-xs text-muted-foreground">Email me when a new device signs in.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active sessions</p>
                <p className="text-xs text-muted-foreground">Manage devices currently signed in.</p>
              </div>
              <Button type="button" variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card className="border-border/70 bg-card shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Connected Accounts</CardTitle>
            </div>
            <CardDescription>Manage your connected social media accounts for optional publishing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Social media accounts</p>
                <p className="text-xs text-muted-foreground">Connect or disconnect platforms like Instagram, Facebook, LinkedIn, and more.</p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/app/settings/connected-accounts">Manage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save bar */}
        <div className="sticky bottom-4 flex justify-end">
          <Button type="submit" disabled={saving} className="shadow-soft-lg">
            {saving ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
