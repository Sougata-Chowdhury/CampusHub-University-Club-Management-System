import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden rounded-lg bg-ink-200/70 dark:bg-ink-800 ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/5" />
  </div>
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton key={index} className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-card border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="mt-5 h-5 w-3/4" />
    <SkeletonText className="mt-3" />
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-24" />
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading content">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export default Skeleton;
