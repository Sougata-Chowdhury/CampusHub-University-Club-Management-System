import React from 'react';

const controlBase =
  'w-full rounded-[10px] border border-ink-200 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-white dark:placeholder:text-ink-500 dark:disabled:bg-ink-800';

export const Field = ({ label, htmlFor, hint, error, required, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label ? (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700 dark:text-ink-200">
        {label}
        {required ? <span className="ml-0.5 text-danger-600">*</span> : null}
      </label>
    ) : null}
    {children}
    {error ? (
      <p className="text-xs font-medium text-danger-600 dark:text-rose-400" role="alert">
        {error}
      </p>
    ) : hint ? (
      <p className="text-xs text-ink-500 dark:text-ink-400">{hint}</p>
    ) : null}
  </div>
);

export const Input = ({ className = '', invalid = false, ...props }) => (
  <input
    className={`${controlBase} h-10 ${invalid ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''} ${className}`}
    aria-invalid={invalid || undefined}
    {...props}
  />
);

export const Textarea = ({ className = '', rows = 4, ...props }) => (
  <textarea className={`${controlBase} py-2.5 ${className}`} rows={rows} {...props} />
);

export const Select = ({ className = '', children, ...props }) => (
  <select className={`${controlBase} h-10 pr-9 ${className}`} {...props}>
    {children}
  </select>
);

export const SearchInput = ({ className = '', ...props }) => (
  <div className={`relative ${className}`}>
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
    <input className={`${controlBase} h-10 pl-9 ${props.className || ''}`} {...props} />
  </div>
);

export default Input;
