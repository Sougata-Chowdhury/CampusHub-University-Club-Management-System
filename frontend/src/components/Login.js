import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layout/AuthLayout';
import { Alert, Button, Field, Input } from '../ui';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email.trim(), formData.password);
      if (result.success) {
        navigate(location.state?.from || '/dashboard', { replace: true });
      } else {
        setError(result.error || 'Those credentials did not match our records.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) =>
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your clubs, events and campus life."
      footer={
        <div className="space-y-5">
          <p className="text-center text-sm text-ink-500 dark:text-ink-400">
            New to CampusHub?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Create an account
            </Link>
          </p>

          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-[10px] border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900/60 dark:hover:border-ink-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-ink-600 shadow-sm ring-1 ring-inset ring-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink-800 dark:text-ink-100">
                Administrator access
              </span>
              <span className="block text-xs text-ink-500 dark:text-ink-400">
                Use the dedicated admin portal
              </span>
            </span>
            <span aria-hidden="true" className="text-ink-400">
              →
            </span>
          </Link>
        </div>
      }
    >
      {error ? (
        <Alert variant="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="you@university.edu"
            value={formData.email}
            onChange={handleChange}
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="pr-11"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-200"
            >
              {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-400 dark:text-ink-500">
        <LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
        Your session is secured with JWT authentication.
      </p>
    </AuthLayout>
  );
};

export default Login;
