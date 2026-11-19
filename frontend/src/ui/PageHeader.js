import React from 'react';

const PageHeader = ({ eyebrow, title, description, actions, className = '' }) => (
  <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className="min-w-0">
      {eyebrow ? (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-600 dark:text-brand-400">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px] dark:text-white">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export default PageHeader;
