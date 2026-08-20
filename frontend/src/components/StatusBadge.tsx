'use client';

import React from 'react';
import { CheckCircle2, Sparkles, AlertCircle, Clock, FastForward, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase();

  const config: Record<string, { label: string; className: string; icon: any }> = {
    APPLIED: {
      label: 'Applied (Live)',
      className: 'badge-applied',
      icon: CheckCircle2,
    },
    SIMULATED: {
      label: 'Simulated (Dry-Run)',
      className: 'badge-simulated',
      icon: Sparkles,
    },
    SKIPPED: {
      label: 'Skipped',
      className: 'badge-skipped',
      icon: FastForward,
    },
    FAILED: {
      label: 'Failed',
      className: 'badge-failed',
      icon: AlertCircle,
    },
    QUEUED: {
      label: 'Queued',
      className: 'badge-queued',
      icon: Clock,
    },
    EVALUATING: {
      label: 'Evaluating',
      className: 'badge-queued',
      icon: Loader2,
    },
  };

  const item = config[normalized] || {
    label: normalized,
    className: 'badge-skipped',
    icon: Clock,
  };

  const Icon = item.icon;

  return (
    <span
      className={`badge ${item.className}`}
      style={{
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
        fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
      }}
    >
      <Icon size={size === 'sm' ? 11 : 13} />
      <span>{item.label}</span>
    </span>
  );
}
