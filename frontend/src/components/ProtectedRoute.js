import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-[#0b1220]">
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <span className="text-sm font-medium text-ink-500 dark:text-ink-400">
            Checking your session…
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminRequired && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
