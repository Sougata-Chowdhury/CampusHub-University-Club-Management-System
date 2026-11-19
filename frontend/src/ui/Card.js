import React from 'react';

export const Card = ({ as: Tag = 'div', hover = false, className = '', children, ...props }) => (
  <Tag
    className={[
      'rounded-card border border-ink-200 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900',
      hover
        ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-pop dark:hover:border-ink-700'
        : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </Tag>
);

export const CardHeader = ({ title, description, action, className = '' }) => (
  <div className={`flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-ink-800 ${className}`}>
    <div>
      <h3 className="text-[15px] font-semibold text-ink-900 dark:text-white">{title}</h3>
      {description ? (
        <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
);

export const CardBody = ({ className = '', children }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
);

export default Card;
