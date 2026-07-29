'use client';

import { ShieldCheck, HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConfidenceLevel = 'high' | 'medium' | 'low';

const confidenceConfig: Record<ConfidenceLevel, { label: string; color: string; bg: string; icon: typeof ShieldCheck }> = {
  high: { label: 'High Confidence', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', icon: ShieldCheck },
  medium: { label: 'Medium Confidence', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', icon: HelpCircle },
  low: { label: 'Low Confidence', color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: AlertCircle },
};

export function ConfidenceBadge({
  level,
  score,
  className,
}: {
  level: ConfidenceLevel;
  score?: number | null;
  className?: string;
}) {
  const config = confidenceConfig[level] ?? confidenceConfig.medium;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.bg,
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
      {score != null && <span className="opacity-70">({score}%)</span>}
    </span>
  );
}

export function ExplanationBox({ explanation }: { explanation: string | null | undefined }) {
  if (!explanation) return null;
  return (
    <div className="mt-2 rounded-lg bg-secondary/40 p-3">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold">Why this suggestion:</span> {explanation}
      </p>
    </div>
  );
}
