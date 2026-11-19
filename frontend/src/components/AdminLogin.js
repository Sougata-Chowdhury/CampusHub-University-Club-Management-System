import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layout/AuthLayout';
import { Alert, Button, Field, Input } from '../ui';

const AdminLogin = () => {
  const navigate = useNavigate();
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
      const result = await login(formData.email.trim(), formData.password, true);
      if (result.success) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(result.error || 'Invalid administrator credentials.');
      }
    } catch (err) {
      setError('Admin login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) =>
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <AuthLayout
      title="Administrator sign in"
      subtitle="Restricted console for university staff."
      footer={
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[10px] border border-warning-100 bg-warning-50 px-4 py-3 text-xs leading-5 text-warning-700 dark:border-warning-600/30 dark:bg-warning-600/10 dark:text-amber-200">
            <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              This area is monitored. Administrative actions are recorded in the audit log.
            </span>
          </div>
          <p className="text-center text-sm text-ink-500 dark:text-ink-400">
            Not an administrator?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Student sign in
            </Link>
          </p>
        </div>
      }
    >
      {error ? (
        <Alert variant="error" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Admin email" htmlFor="admin-email" required>
          <Input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="admin@university.edu"
            value={formData.email}
            onChange={handleChange}
          />
        </Field>

        <Field label="Password" htmlFor="admin-password" required>
          <div className="relative">
            <Input
              id="admin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="Enter admin password"
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
          {loading ? 'Authenticating…' : 'Sign in to admin console'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
