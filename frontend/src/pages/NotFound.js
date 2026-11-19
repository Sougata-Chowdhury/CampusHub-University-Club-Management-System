import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { buttonClasses } from '../ui/Button';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const { user } = useAuth();
  const home = user ? '/dashboard' : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-[#0b1220]">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 dark:text-white">
          This page moved on
        </h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          The link you followed does not exist, or you no longer have access to it.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to={home} className={buttonClasses({ variant: 'primary' })}>
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to {user ? 'dashboard' : 'sign in'}
          </Link>
          <Link to="/browse-clubs" className={buttonClasses({ variant: 'secondary' })}>
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
            Browse clubs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
