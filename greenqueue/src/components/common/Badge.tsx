import React from 'react';
import { JobPriority, JobStatus, GridCondition } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: JobStatus | JobPriority | GridCondition | 'default';
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', label, children, className = '' }) => {
  const content = label || children;

  const styles: Record<string, string> = {
    urgent: 'bg-red-500/15 text-red-400 border border-red-500/30',
    flexible: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    clean: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    moderate: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    dirty: 'bg-red-500/15 text-red-400 border border-red-500/30',
    submitted: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    analyzing: 'bg-sky-500/15 text-sky-300 border border-sky-500/30 animate-pulse',
    scheduled: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    ready: 'bg-lime-500/15 text-lime-300 border border-lime-500/30 animate-pulse',
    running: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    completed: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    failed: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    cancelled: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30',
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ${styles[variant] || styles.default} ${className}`}>
      {content}
    </span>
  );
};
