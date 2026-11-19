import React from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const RouteFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50 dark:bg-[#0b1220]">
    <span className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
      <AcademicCapIcon className="h-6 w-6" aria-hidden="true" />
    </span>
    <p className="text-sm font-medium text-ink-500 dark:text-ink-400" role="status">
      Loading…
    </p>
  </div>
);

export default RouteFallback;
