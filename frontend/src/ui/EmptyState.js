import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-card border border-dashed border-ink-300 bg-white px-6 py-14 text-center dark:border-ink-700 dark:bg-ink-900/60 ${className}`}
  >
    {Icon ? (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    ) : null}
    <h3 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
    {description ? (
      <p className="mt-1.5 max-w-md text-sm text-ink-500 dark:text-ink-400">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export default EmptyState;
