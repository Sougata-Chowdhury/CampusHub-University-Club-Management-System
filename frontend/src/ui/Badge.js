import React from 'react';

const variants = {
  neutral:
    'bg-ink-100 text-ink-700 ring-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-700',
  brand:
    'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30',
  success:
    'bg-success-50 text-success-700 ring-success-100 dark:bg-success-600/15 dark:text-emerald-300 dark:ring-success-600/30',
  warning:
    'bg-warning-50 text-warning-700 ring-warning-100 dark:bg-warning-600/15 dark:text-amber-300 dark:ring-warning-600/30',
  danger:
    'bg-danger-50 text-danger-700 ring-danger-100 dark:bg-danger-600/15 dark:text-rose-300 dark:ring-danger-600/30',
  info:
    'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
};

const Badge = ({ children, variant = 'neutral', dot = false, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${variants[variant] || variants.neutral} ${className}`}
  >
    {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
    {children}
  </span>
);

export default Badge;
