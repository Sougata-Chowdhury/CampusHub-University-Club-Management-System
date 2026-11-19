import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const variants = {
  info: {
    wrap: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
    icon: InformationCircleIcon,
  },
  success: {
    wrap: 'border-success-100 bg-success-50 text-success-700 dark:border-success-600/30 dark:bg-success-600/10 dark:text-emerald-200',
    icon: CheckCircleIcon,
  },
  warning: {
    wrap: 'border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-600/30 dark:bg-warning-600/10 dark:text-amber-200',
    icon: ExclamationTriangleIcon,
  },
  error: {
    wrap: 'border-danger-100 bg-danger-50 text-danger-700 dark:border-danger-600/30 dark:bg-danger-600/10 dark:text-rose-200',
    icon: XCircleIcon,
  },
};

const Alert = ({ variant = 'info', title, children, action, className = '' }) => {
  const config = variants[variant] || variants.info;
  const Icon = config.icon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 text-sm ${config.wrap} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

export default Alert;
