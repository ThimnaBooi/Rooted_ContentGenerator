'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings2, Save, RotateCcw, Loader2, Brain, Eye, Scan, Mic, Link2, CalendarClock, Sparkles, Repeat, Bell, ScanFace } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getAISettings, updateAISettings, resetAIPreferences, getAIPreferences } from '@/lib/ai-queries';
import type { AISettings, AIPreference } from '@/lib/ai-types';
import { AI_SETTING_LABELS } from '@/lib/ai-types';
import { toast } from 'sonner';

const settingIcons: Record<string, typeof Brain> = {
  memory_suggestions: Brain,
  photo_analysis: Eye,
  ocr_enabled: Scan,
  voice_analysis: Mic,
  relationship_suggestions: Link2,
  timeline_suggestions: CalendarClock,
  creative_recommendations: Sparkles,
  content_repurposing: Repeat,
  learning_preferences: Brain,
  intelligent_notifications: Bell,
  face_detection_consent: ScanFace,
};

export default function AISettingsPage() {
  const { session, isGuest } = useAuth();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [preferences, setPreferences] = useState<AIPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    if (!session || isGuest) {
      setLoading(false);
      return;
    }
    try {
      const [s, p] = await Promise.all([getAISettings(), getAIPreferences()]);
      setSettings(s);
      setPreferences(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(key: keyof AISettings, value: boolean) {
    if (!settings) {
      // Create with defaults + this toggle
      const newSettings: Record<string, unknown> = { [key]: value };
      try {
        const updated = await updateAISettings(newSettings as Partial<AISettings>);
        setSettings(updated);
      } catch {
        toast.error('Could not update setting.');
      }
      return;
    }
    setSettings({ ...settings, [key]: value });
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const { id, user_id, created_at, updated_at, ...updates } = settings;
      await updateAISettings(updates);
      toast.success('AI settings saved.');
    } catch {
      toast.error('Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPreferences() {
    setResetting(true);
    try {
      await resetAIPreferences();
      setPreferences([]);
      toast.success('Learned preferences reset.');
    } catch {
      toast.error('Could not reset preferences.');
    } finally {
      setResetting(false);
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader icon={Settings2} title="AI Settings" description="Control which AI features are active in your archive." />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">Sign in to configure AI settings.</CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const settingKeys = Object.keys(AI_SETTING_LABELS).filter((k) => k !== 'face_detection_consent' || settings?.photo_analysis);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        icon={Settings2}
        title="AI Settings"
        description="Every AI feature is individually configurable. Toggle features on or off at any time. The AI never makes changes to your archive without your explicit approval."
      />

      <Card className="border-border/70 bg-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Feature Toggles</CardTitle>
          <CardDescription>Enable or disable individual AI capabilities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {settingKeys.map((key) => {
            const config = AI_SETTING_LABELS[key];
            const Icon = settingIcons[key] ?? Brain;
            const value = settings ? (settings as Record<string, boolean>)[key] : key === 'photo_analysis' || key === 'face_detection_consent' ? false : true;
            return (
              <div key={key} className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/40">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(v) => handleToggle(key as keyof AISettings, v)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      {/* Learned preferences */}
      <Card className="border-border/70 bg-card shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Learned Preferences</CardTitle>
              <CardDescription>The AI gradually learns your preferred styles. You can reset these at any time.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetPreferences} disabled={resetting || preferences.length === 0}>
              {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {preferences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No learned preferences yet. As you use the AI features, it will learn your preferred writing style, image style, narration voice, and more.</p>
          ) : (
            <ul className="space-y-2">
              {preferences.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/40 p-3 text-sm">
                  <div>
                    <span className="font-medium capitalize">{p.preference_key.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground"> — {p.preference_value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Observed {p.times_observed}x</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
