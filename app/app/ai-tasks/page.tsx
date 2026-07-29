'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, RotateCcw, Trash2, Loader2, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAIJobHistory, clearAIJobHistory, deleteAIJobHistory, getAITasks, retryAITask, cancelAITask } from '@/lib/ai-queries';
import type { AIJobHistory, AITask } from '@/lib/ai-types';
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  processing: { icon: Loader2, color: 'text-amber-600', label: 'Processing' },
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground', label: 'Cancelled' },
};

export default function AITasksPage() {
  const { session, isGuest } = useAuth();
  const [history, setHistory] = useState<AIJobHistory[]>([]);
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session || isGuest) {
      setLoading(false);
      return;
    }
    try {
      const [h, t] = await Promise.all([getAIJobHistory(50), getAITasks()]);
      setHistory(h);
      setTasks(t.filter((task) => task.status === 'pending' || task.status === 'processing' || task.status === 'failed'));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, isGuest]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleRetry(id: string) {
    try {
      await retryAITask(id);
      await load();
      toast.success('Task queued for retry.');
    } catch {
      toast.error('Could not retry task.');
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelAITask(id);
      await load();
      toast.success('Task cancelled.');
    } catch {
      toast.error('Could not cancel task.');
    }
  }

  async function handleClearHistory() {
    try {
      await clearAIJobHistory();
      setHistory([]);
      toast.success('History cleared.');
    } catch {
      toast.error('Could not clear history.');
    }
  }

  async function handleDeleteHistory(id: string) {
    try {
      await deleteAIJobHistory(id);
      setHistory(history.filter((h) => h.id !== id));
    } catch {
      toast.error('Could not delete entry.');
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader icon={History} title="AI Task History" description="View and manage your AI processing tasks." />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">Sign in to view task history.</CardContent>
        </Card>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status === 'processing' || t.status === 'pending');
  const failedTasks = tasks.filter((t) => t.status === 'failed');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={History}
        title="AI Task History"
        description="Track long-running AI tasks, view completion history, and manage your processing queue."
      >
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearHistory}>
            <Trash2 className="h-3.5 w-3.5" /> Clear History
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Active tasks */}
          {(activeTasks.length > 0 || failedTasks.length > 0) && (
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Active & Failed Tasks</CardTitle>
                <CardDescription>Tasks currently processing or that need attention.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...activeTasks, ...failedTasks].map((task) => {
                  const config = statusConfig[task.status] ?? statusConfig.pending;
                  const Icon = config.icon;
                  return (
                    <div key={task.id} className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${config.color} ${task.status === 'processing' ? 'animate-spin' : ''}`} />
                        <div>
                          <p className="text-sm font-medium capitalize">{task.task_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">{config.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'processing' && (
                          <Badge variant="outline">{task.progress}%</Badge>
                        )}
                        {task.status === 'failed' && task.retry_count < task.max_retries && (
                          <Button size="sm" variant="outline" onClick={() => handleRetry(task.id)}>
                            <RotateCcw className="h-3 w-3" /> Retry
                          </Button>
                        )}
                        {(task.status === 'processing' || task.status === 'pending') && (
                          <Button size="sm" variant="ghost" onClick={() => handleCancel(task.id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card className="border-border/70 bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No completed tasks yet.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => {
                    const config = statusConfig[h.status] ?? statusConfig.pending;
                    const Icon = config.icon;
                    return (
                      <li key={h.id} className="flex items-start justify-between rounded-lg bg-secondary/40 p-3">
                        <div className="flex items-start gap-3">
                          <Icon className={`mt-0.5 h-4 w-4 ${config.color}`} />
                          <div>
                            <p className="text-sm font-medium">{h.task_title ?? h.task_type.replace(/_/g, ' ')}</p>
                            {h.output_summary && (
                              <p className="text-xs text-muted-foreground">{h.output_summary}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(h.created_at).toLocaleString()}
                              {h.duration_seconds != null && ` • ${h.duration_seconds}s`}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteHistory(h.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
