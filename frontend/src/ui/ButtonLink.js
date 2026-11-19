import React from 'react';
import { Link } from 'react-router-dom';
import { buttonClasses } from './Button';

export const ButtonLink = ({
  to,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  className = '',
  ...props
}) => (
  <Link
    to={to}
    className={`${buttonClasses({ variant, size, fullWidth })} ${className}`}
    {...props}
  >
    {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
    {children}
  </Link>
);

export const IconButton = ({ label, icon: Icon, className = '', ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white ${className}`}
    {...props}
  >
    <Icon className="h-5 w-5" aria-hidden="true" />
  </button>
);

export default ButtonLink;
