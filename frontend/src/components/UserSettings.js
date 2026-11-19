import React, { useCallback, useEffect, useState } from 'react';
import {
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  PlusIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { userService } from '../services/userService';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  PageSkeleton,
  SegmentedControl,
  Select,
} from '../ui';

const defaultSettings = {
  emailNotifications: true,
  pushNotifications: true,
  clubNotifications: true,
  eventNotifications: true,
  language: 'en',
  interests: [],
};

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink-900 dark:text-white">{label}</p>
      {description ? (
        <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{description}</p>
      ) : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
        checked ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const UserSettings = () => {
  const { theme, updateTheme } = useTheme();
  const { language, updateLanguage, getLanguageOptions } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('preferences');
  const [activity, setActivity] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [newInterest, setNewInterest] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profile, activityData] = await Promise.all([
        userService.getUserProfile(),
        userService.getUserActivity(15).catch(() => []),
      ]);
      setSettings({ ...defaultSettings, ...(profile?.settings || {}) });
      setActivity(Array.isArray(activityData) ? activityData : []);
    } catch (err) {
      setError(err.message || 'Failed to load your settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    if (key === 'language') updateLanguage(value);
  };

  const addInterest = () => {
    const value = newInterest.trim();
    if (!value) return;
    if (settings.interests.includes(value)) {
      setNewInterest('');
      return;
    }
    setSettings((current) => ({ ...current, interests: [...current.interests, value] }));
    setNewInterest('');
  };

  const removeInterest = (interest) => {
    setSettings((current) => ({
      ...current,
      interests: current.interests.filter((item) => item !== interest),
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await userService.updateUserSettings(settings);
      setNotice('Settings saved.');
    } catch (err) {
      setError(err.message || 'Failed to save your settings');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (passwordForm.newPassword.length < 6) {
      setError('Use at least 6 characters for the new password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('Choose a new password that is different from the current one.');
      return;
    }

    setSaving(true);
    try {
      await userService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice('Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to change your password');
    } finally {
      setSaving(false);
    }
  };

  const tabOptions = [
    { value: 'preferences', label: 'Preferences' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'security', label: 'Security' },
    { value: 'activity', label: 'Activity' },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Control your appearance, notifications and account security."
        actions={
          <ButtonLink to="/profile" variant="secondary">
            View profile
          </ButtonLink>
        }
      />

      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}

      <div className="mt-6">
        <SegmentedControl options={tabOptions} value={tab} onChange={setTab} label="Settings section" />
      </div>

      <div className="mt-5 max-w-3xl space-y-6">
        {tab === 'preferences' ? (
          <>
            <Card>
              <CardHeader title="Appearance" description="Your choice is stored on this device and your account." />
              <CardBody>
                <Toggle
                  checked={theme === 'dark'}
                  onChange={(checked) => updateTheme(checked ? 'dark' : 'light')}
                  label="Dark mode"
                  description="Use a low-light theme across the app."
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Language" description="Interface language for labels and messages." />
              <CardBody>
                <Field label="Preferred language" htmlFor="settings-language">
                  <Select
                    id="settings-language"
                    value={language}
                    onChange={(event) => updateSetting('language', event.target.value)}
                  >
                    {getLanguageOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Interests"
                description="We use these to highlight clubs and events that may fit you."
              />
              <CardBody className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newInterest}
                    onChange={(event) => setNewInterest(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addInterest();
                      }
                    }}
                    placeholder="e.g. Robotics, Debate, Photography"
                    maxLength={40}
                    aria-label="New interest"
                  />
                  <Button variant="secondary" icon={PlusIcon} onClick={addInterest} disabled={!newInterest.trim()}>
                    Add
                  </Button>
                </div>
                {settings.interests.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    No interests added yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {settings.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 py-1 pl-3 pr-1.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-200 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-white"
                          aria-label={`Remove ${interest}`}
                        >
                          <XMarkIcon className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveSettings} loading={saving}>
                Save preferences
              </Button>
            </div>
          </>
        ) : null}

        {tab === 'notifications' ? (
          <>
            <Card>
              <CardHeader
                title="Notification channels"
                description="Choose what you want to hear about. You can change this any time."
              />
              <CardBody className="divide-y divide-ink-100 dark:divide-ink-800">
                <Toggle
                  checked={Boolean(settings.emailNotifications)}
                  onChange={(value) => updateSetting('emailNotifications', value)}
                  label="Email notifications"
                  description="Send important updates to your email address."
                />
                <Toggle
                  checked={Boolean(settings.pushNotifications)}
                  onChange={(value) => updateSetting('pushNotifications', value)}
                  label="Browser notifications"
                  description="Show notifications in this browser when the app is open."
                />
                <Toggle
                  checked={Boolean(settings.clubNotifications)}
                  onChange={(value) => updateSetting('clubNotifications', value)}
                  label="Club activity"
                  description="Applications, approvals and club announcements."
                />
                <Toggle
                  checked={Boolean(settings.eventNotifications)}
                  onChange={(value) => updateSetting('eventNotifications', value)}
                  label="Events"
                  description="New events, changes and reminders for events you joined."
                />
              </CardBody>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveSettings} loading={saving}>
                Save notifications
              </Button>
            </div>
          </>
        ) : null}

        {tab === 'security' ? (
          <>
            <Card>
              <CardHeader title="Change password" description="Use a strong password you do not reuse elsewhere." />
              <CardBody>
                <form onSubmit={changePassword} className="space-y-4" noValidate>
                  <Field label="Current password" htmlFor="current-password" required>
                    <div className="relative">
                      <Input
                        id="current-password"
                        name="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                        }
                        autoComplete="current-password"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-200"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <EyeIcon className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="New password" htmlFor="new-password" required hint="At least 6 characters.">
                      <Input
                        id="new-password"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                        }
                        autoComplete="new-password"
                        required
                      />
                    </Field>
                    <Field label="Confirm new password" htmlFor="confirm-password" required>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                        }
                        autoComplete="new-password"
                        required
                      />
                    </Field>
                  </div>

                  <Button type="submit" icon={KeyIcon} loading={saving}>
                    Change password
                  </Button>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Account security" />
              <CardBody className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500 dark:text-ink-400">Account status</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500 dark:text-ink-400">Two-factor authentication</span>
                  <Badge variant="neutral">Not enabled</Badge>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500 dark:text-ink-400">Session</span>
                  <span className="text-ink-700 dark:text-ink-200">This device</span>
                </div>
              </CardBody>
            </Card>
          </>
        ) : null}

        {tab === 'activity' ? (
          <Card>
            <CardHeader
              title="Recent activity"
              description="The latest actions recorded on your account."
              action={<ClockIcon className="h-5 w-5 text-ink-400" aria-hidden="true" />}
            />
            <CardBody>
              {activity.length === 0 ? (
                <EmptyState
                  icon={ClockIcon}
                  title="No recent activity"
                  description="Actions like joining a club or registering for an event will appear here."
                />
              ) : (
                <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                  {activity.map((item, index) => (
                    <li key={item._id || `${item.timestamp}-${index}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink-900 dark:text-white">
                          {item.action || 'Activity'}
                        </p>
                        {item.description ? (
                          <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
                            {item.description}
                          </p>
                        ) : null}
                        {item.timestamp ? (
                          <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
};

export default UserSettings;
