import React from 'react';

const accents = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-emerald-300',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-amber-300',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-600/15 dark:text-rose-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
};

const StatCard = ({ label, value, icon: Icon, accent = 'brand', hint, className = '' }) => (
  <div
    className={`rounded-card border border-ink-200 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900 ${className}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 dark:text-white">
          {value}
        </p>
      </div>
      {Icon ? (
        <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${accents[accent] || accents.brand}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
    </div>
    {hint ? <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">{hint}</p> : null}
  </div>
);

export default StatCard;
