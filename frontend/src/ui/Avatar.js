import React from 'react';

const sizes = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

const Avatar = ({ name, src, size = 'md', className = '' }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-500/20 dark:text-brand-200 dark:ring-brand-500/30 ${sizes[size] || sizes.md} ${className}`}
    aria-hidden={src ? undefined : true}
  >
    {src ? (
      <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
    ) : (
      initialsOf(name)
    )}
  </span>
);

export default Avatar;
