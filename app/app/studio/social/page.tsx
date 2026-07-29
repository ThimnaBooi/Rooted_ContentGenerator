'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Share2, Loader2, Plus, Trash2, Edit3, Send, CalendarClock, Download, X, Check, AlertTriangle,
  Instagram, Facebook, Linkedin, Twitter, Music2, Globe, MessageCircle, ThumbsUp,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { getSocialPosts, createSocialPost, deleteSocialPost, updateSocialPost, getSocialAccounts } from '@/lib/media-queries';
import { SOCIAL_PLATFORMS } from '@/lib/media-types';
import type { SocialPost, SocialAccount } from '@/lib/media-types';
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

export default function SocialStudioPage() {
  const { session, isGuest } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState<SocialPost | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [platform, setPlatform] = useState('instagram');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([getSocialPosts(), getSocialAccounts()]);
      setPosts(p);
      setAccounts(a);
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

  const connectedPlatforms = new Set(accounts.filter((a) => a.status === 'connected').map((a) => a.platform));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setCreating(true);
    try {
      const tags = hashtags.trim()
        ? hashtags.split(/[,\s]+/).filter(Boolean).map((t) => t.startsWith('#') ? t : `#${t}`)
        : [];
      await createSocialPost({
        platform,
        content: content.trim(),
        caption: caption.trim() || undefined,
        hashtags: tags.length > 0 ? tags : undefined,
      });
      toast.success('Draft created. Review it before publishing.');
      setContent(''); setCaption(''); setHashtags('');
      setCreateOpen(false);
      await load();
    } catch {
      toast.error('Could not create draft.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSocialPost(id);
      toast.success('Post deleted.');
      await load();
    } catch {
      toast.error('Could not delete post.');
    }
  }

  async function handlePublish(post: SocialPost) {
    if (!connectedPlatforms.has(post.platform)) {
      toast.error('Please connect your account first in Settings → Connected Accounts.');
      return;
    }
    try {
      await updateSocialPost(post.id, { status: 'published', published_at: new Date().toISOString(), privacy_reminder_shown: true });
      toast.success('Published successfully.');
      setPublishOpen(null);
      await load();
    } catch {
      toast.error('Could not publish. Please try again.');
    }
  }

  async function handleSchedule(post: SocialPost, scheduledFor: string) {
    try {
      await updateSocialPost(post.id, { status: 'scheduled', scheduled_for: scheduledFor });
      toast.success('Post scheduled.');
      setPublishOpen(null);
      await load();
    } catch {
      toast.error('Could not schedule post.');
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader title="Social Media Studio" description="Prepare platform-specific versions of your family stories for sharing — always optional, never automatic." />
        <EmptyState icon={Share2} title="Sign in to use the Social Media Studio" description="Create an account to prepare and optionally publish social media content." actionLabel="Create your account" actionHref="/register" />
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Social Media Studio"
          description="Prepare platform-specific versions of your family stories. Every step is optional — Rooted never publishes anything without your explicit confirmation."
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Social Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Create a Social Media Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOCIAL_PLATFORMS.map((p) => {
                      const Icon = platformIcon(p.value);
                      return (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" /> {p.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-content">Content</Label>
                <Textarea id="post-content" placeholder="Write your post content…" value={content} onChange={(e) => setContent(e.target.value)} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-caption">Caption (optional)</Label>
                <Input id="post-caption" placeholder="Add a caption…" value={caption} onChange={(e) => setCaption(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-hashtags">Hashtags (comma or space separated)</Label>
                <Input id="post-hashtags" placeholder="#family #heritage #memories" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                  Save as Draft
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Privacy philosophy banner */}
      <div className="rounded-xl bg-accent/10 p-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-accent-foreground" />
          <span>
            Rooted never automatically publishes anything. You must connect your own social media account and explicitly select <strong>Publish Now</strong> for each post. Your memories remain private until you choose to share them.
          </span>
        </p>
      </div>

      {/* Connected accounts status */}
      <div className="flex flex-wrap gap-2">
        {SOCIAL_PLATFORMS.map((p) => {
          const connected = connectedPlatforms.has(p.value);
          const Icon = platformIcon(p.value);
          return (
            <Badge key={p.value} variant="outline" className={cn('gap-1.5', connected ? 'border-green-500/30 text-green-600' : 'text-muted-foreground')}>
              <Icon className="h-3 w-3" />
              {p.label}
              {connected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </Badge>
          );
        })}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No social media posts yet"
          description="Create a draft to prepare a family story for social media. You can edit, schedule, download, or publish — always with your explicit confirmation."
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const Icon = platformIcon(post.platform);
            const platformLabel = SOCIAL_PLATFORMS.find((p) => p.value === post.platform)?.label ?? post.platform;
            return (
              <Card key={post.id} className="border-border/70 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{platformLabel}</p>
                        <Badge variant="outline" className="mt-0.5 text-xs capitalize">{post.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {post.status === 'draft' && (
                        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setPublishOpen(post)}>
                          <Send className="h-3.5 w-3.5" /> Publish
                        </Button>
                      )}
                      {post.status === 'scheduled' && post.scheduled_for && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <CalendarClock className="h-3 w-3" />
                          {new Date(post.scheduled_for).toLocaleDateString()}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90">{post.content}</p>
                  {post.caption && <p className="mt-1 text-xs text-muted-foreground">{post.caption}</p>}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.hashtags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Publish workflow dialog */}
      <Dialog open={!!publishOpen} onOpenChange={(v) => !v && setPublishOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Publish to {SOCIAL_PLATFORMS.find((p) => p.value === publishOpen?.platform)?.label}</DialogTitle>
          </DialogHeader>
          {publishOpen && (
            <div className="space-y-4">
              {/* Privacy reminder */}
              <div className="rounded-lg bg-highlight/10 p-3 text-sm">
                <p className="flex items-start gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-highlight" />
                  <span>This content contains personal family memories. Please review it carefully before sharing publicly.</span>
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPrivacyOpen(false)}>Edit</Button>
                  <Button size="sm" className="gap-1.5" onClick={() => setPrivacyOpen(true)}>
                    <Check className="h-3.5 w-3.5" /> Continue
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-card/50 p-3">
                <p className="text-sm font-medium">Preview:</p>
                <p className="mt-1 text-sm text-foreground/90">{publishOpen.content}</p>
                {publishOpen.caption && <p className="mt-1 text-xs text-muted-foreground">{publishOpen.caption}</p>}
              </div>

              {/* Connection check */}
              {!connectedPlatforms.has(publishOpen.platform) ? (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  Your {SOCIAL_PLATFORMS.find((p) => p.value === publishOpen.platform)?.label} account is not connected. Please connect it in Settings → Connected Accounts before publishing.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => handlePublish(publishOpen)}>
                    <Send className="h-3.5 w-3.5" /> Publish Now
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                    const date = prompt('Enter date and time (YYYY-MM-DD HH:MM):');
                    if (date) handleSchedule(publishOpen, new Date(date).toISOString());
                  }}>
                    <CalendarClock className="h-3.5 w-3.5" /> Schedule
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download Instead
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
