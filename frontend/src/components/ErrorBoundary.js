import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Replace with a real error reporter (Sentry) in production.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign('/dashboard');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-[#0b1220]">
        <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-8 text-center shadow-card dark:border-ink-800 dark:bg-ink-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-600/15 dark:text-amber-300">
            <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
            This screen hit an unexpected error. Reloading usually fixes it. If it keeps happening,
            contact the administrator.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={this.handleReload}>Reload page</Button>
            <Button variant="secondary" onClick={this.handleGoHome}>
              Go to dashboard
            </Button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error ? (
            <pre className="mt-6 max-h-40 overflow-auto rounded-lg bg-ink-100 p-3 text-left text-[11px] text-ink-600 dark:bg-ink-950 dark:text-ink-300">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
