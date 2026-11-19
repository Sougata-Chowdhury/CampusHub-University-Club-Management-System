import React from 'react';

const SegmentedControl = ({ options, value, onChange, label, className = '' }) => (
  <div
    role="tablist"
    aria-label={label}
    className={`inline-flex flex-wrap items-center gap-1 rounded-[10px] border border-ink-200 bg-white p-1 shadow-sm dark:border-ink-800 dark:bg-ink-900 ${className}`}
  >
    {options.map((option) => {
      const Icon = option.icon;
      const active = value === option.value;
      return (
        <button
          key={option.value}
          role="tab"
          type="button"
          aria-selected={active}
          onClick={() => onChange(option.value)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
            active
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white'
          }`}
        >
          {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
          {option.label}
          {typeof option.count === 'number' ? (
            <span
              className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                active ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
              }`}
            >
              {option.count}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
