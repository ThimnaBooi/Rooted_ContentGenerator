'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  Mail,
  CheckCheck,
  Trash2,
  Loader2,
  Heart,
  MessageCircle,
  Sparkles,
  Award,
  FileEdit,
  UserPlus,
  Tag,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/lib/collab-queries';
import {
  getIntelligentNotifications,
  markNotificationRead as markIntelligentRead,
  dismissNotification as dismissIntelligentNotification,
  triggerAIAnalysis,
} from '@/lib/ai-queries';
import type { IntelligentNotification } from '@/lib/ai-types';
import {
  NOTIFICATION_TYPE_LABELS,
  type Notification,
  type NotificationType,
} from '@/lib/collab-types';
import { cn } from '@/lib/utils';

function notificationIcon(type: NotificationType) {
  switch (type) {
    case 'invitation': return UserPlus;
    case 'approval': return FileEdit;
    case 'comment': return MessageCircle;
    case 'suggestion': return Tag;
    case 'ai_recommendation': return Sparkles;
    case 'project': return FileEdit;
    case 'milestone': return Award;
    default: return Bell;
  }
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { session, isGuest } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [intelligentNotifs, setIntelligentNotifs] = useState<IntelligentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [preferences, setPreferences] = useState<Record<NotificationType, boolean>>({
    invitation: true,
    approval: true,
    comment: true,
    suggestion: true,
    ai_recommendation: true,
    project: true,
    milestone: true,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const load = useCallback(async () => {
    try {
      const [data, intData] = await Promise.all([
        getNotifications(),
        getIntelligentNotifications(true),
      ]);
      setNotifications(data);
      setIntelligentNotifs(intData);
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

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      await load();
    } catch {
      toast.error('Could not mark notification as read.');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      toast.success('All notifications marked as read.');
      await load();
    } catch {
      toast.error('Could not mark all as read.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      await load();
    } catch {
      toast.error('Could not delete notification.');
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="Stay updated on collaboration activity, approvals, and milestones." />
        <EmptyState
          icon={Bell}
          title="Sign in to see notifications"
          description="Create an account to receive updates about invitations, comments, and collaboration activity."
          actionLabel="Create your account"
          actionHref="/register"
        />
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

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Notifications"
          description="Stay updated on invitations, approvals, comments, and milestones in your archive."
        />
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map((type) => (
          <FilterChip
            key={type}
            label={NOTIFICATION_TYPE_LABELS[type]}
            active={filter === type}
            onClick={() => setFilter(type)}
          />
        ))}
      </div>

      {/* Notification preferences */}
      <Card className="bg-card/40">
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Notification Preferences</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map((type) => (
              <div key={type} className="flex items-center justify-between rounded-lg bg-card/50 px-3 py-2">
                <Label htmlFor={`pref-${type}`} className="text-sm font-normal">
                  {NOTIFICATION_TYPE_LABELS[type]}
                </Label>
                <Switch
                  id={`pref-${type}`}
                  checked={preferences[type]}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, [type]: checked })
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. New notifications about your archive will appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = notificationIcon(notif.type);
            return (
              <Card
                key={notif.id}
                className={cn(
                  'transition-colors',
                  !notif.read && 'border-primary/20 bg-primary/5'
                )}
              >
                <CardContent className="flex items-start gap-3 p-3">
                  <div className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                    notif.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {!notif.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-highlight" />
                      )}
                    </div>
                    {notif.body && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{notif.body}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelative(notif.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleMarkRead(notif.id)}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(notif.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card/50 text-muted-foreground hover:bg-muted'
      )}
    >
      {label}
    </button>
  );
}
