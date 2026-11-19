import React, { useEffect, useState } from 'react';
import {
  AcademicCapIcon,
  CameraIcon,
  CheckIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PencilSquareIcon,
  PhoneIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { resolveAssetUrl } from '../services/api';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  PageSkeleton,
  Select,
  Textarea,
} from '../ui';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: '',
  department: '',
  year: '',
  studentId: '',
};

const departments = [
  'Computer Science',
  'Engineering',
  'Business',
  'Arts',
  'Science',
  'Mathematics',
  'Other',
];

const years = [
  ['1', '1st year'],
  ['2', '2nd year'],
  ['3', '3rd year'],
  ['4', '4th year'],
  ['Graduate', 'Graduate'],
];

const UserProfile = () => {
  const { refreshProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await userService.getUserProfile();
        if (!active) return;
        setUser(data);
        setForm({
          firstName: data?.firstName || '',
          lastName: data?.lastName || '',
          email: data?.email || '',
          phone: data?.phone || '',
          bio: data?.bio || '',
          department: data?.department || '',
          year: data?.year ? String(data.year) : '',
          studentId: data?.studentId || '',
        });
      } catch (err) {
        if (active) setError(err.message || 'Failed to load your profile');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await userService.updateUserProfile({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      });
      setUser(updated);
      setEditing(false);
      setNotice('Profile updated successfully.');
      await refreshProfile();
    } catch (err) {
      setError(err.message || 'Failed to update your profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setFieldErrors({});
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      department: user?.department || '',
      year: user?.year ? String(user.year) : '',
      studentId: user?.studentId || '',
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPG, PNG or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The image must be smaller than 5 MB.');
      return;
    }

    setUploading(true);
    setError('');
    setNotice('');
    try {
      const body = new FormData();
      body.append('profilePicture', file);
      const updated = await userService.uploadProfilePicture(body);
      setUser(updated);
      setNotice('Profile picture updated.');
      await refreshProfile();
    } catch (err) {
      setError(err.message || 'Failed to upload the image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your profile';
  const avatarSrc = resolveAssetUrl(user?.profilePicture);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Keep your contact and academic details up to date."
        actions={
          user ? (
            editing ? (
              <>
                <Button variant="secondary" onClick={handleCancel} disabled={saving} icon={XMarkIcon}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving} icon={CheckIcon}>
                  Save changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} icon={PencilSquareIcon}>
                Edit profile
              </Button>
            )
          ) : null
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Personal information"
            description={editing ? 'Fields marked with * are required.' : 'How you appear across the app.'}
          />
          <CardBody className="space-y-5">
            {editing ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First name" htmlFor="profile-first" required error={fieldErrors.firstName}>
                  <Input
                    id="profile-first"
                    name="firstName"
                    value={form.firstName}
                    onChange={update}
                    invalid={Boolean(fieldErrors.firstName)}
                    maxLength={60}
                  />
                </Field>
                <Field label="Last name" htmlFor="profile-last" required error={fieldErrors.lastName}>
                  <Input
                    id="profile-last"
                    name="lastName"
                    value={form.lastName}
                    onChange={update}
                    invalid={Boolean(fieldErrors.lastName)}
                    maxLength={60}
                  />
                </Field>
                <Field
                  label="Email address"
                  htmlFor="profile-email"
                  required
                  error={fieldErrors.email}
                  className="sm:col-span-2"
                >
                  <Input
                    id="profile-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={update}
                    invalid={Boolean(fieldErrors.email)}
                  />
                </Field>
                <Field label="Phone number" htmlFor="profile-phone" className="sm:col-span-2">
                  <Input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={update}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Student ID" htmlFor="profile-student" className="sm:col-span-2">
                  <Input
                    id="profile-student"
                    name="studentId"
                    value={form.studentId}
                    onChange={update}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Department" htmlFor="profile-department">
                  <Select
                    id="profile-department"
                    name="department"
                    value={form.department}
                    onChange={update}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Year of study" htmlFor="profile-year">
                  <Select id="profile-year" name="year" value={form.year} onChange={update}>
                    <option value="">Select year</option>
                    {years.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="About me"
                  htmlFor="profile-bio"
                  hint={`${form.bio.length}/500 characters`}
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="profile-bio"
                    name="bio"
                    value={form.bio}
                    onChange={update}
                    rows={4}
                    maxLength={500}
                    placeholder="A short introduction — interests, hobbies, what you want to build."
                  />
                </Field>
              </div>
            ) : (
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <InfoItem icon={UserCircleIcon} label="Full name" value={displayName} />
                <InfoItem icon={EnvelopeIcon} label="Email address" value={user?.email || '—'} />
                <InfoItem icon={PhoneIcon} label="Phone number" value={user?.phone || 'Not provided'} />
                <InfoItem
                  icon={IdentificationIcon}
                  label="Student ID"
                  value={user?.studentId || 'Not provided'}
                />
                <InfoItem
                  icon={AcademicCapIcon}
                  label="Department"
                  value={user?.department || 'Not provided'}
                />
                <InfoItem
                  icon={AcademicCapIcon}
                  label="Year of study"
                  value={
                    user?.year
                      ? user.year === 'Graduate'
                        ? 'Graduate'
                        : `Year ${user.year}`
                      : 'Not provided'
                  }
                />
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">About</p>
                  <p className="mt-1.5 text-sm leading-6 text-ink-700 dark:text-ink-200">
                    {user?.bio || 'No bio yet. Add one so club owners know a little about you.'}
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar name={displayName} src={avatarSrc} size="xl" className="h-24 w-24 text-2xl" />
                <label
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-sm transition-colors hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                  title="Change profile picture"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageUpload}
                    className="sr-only"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                  ) : (
                    <CameraIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                </label>
              </div>
              <p className="mt-3 text-base font-semibold text-ink-900 dark:text-white">{displayName}</p>
              <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{user?.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {user?.role ? <Badge variant="brand">{user.role}</Badge> : null}
                {user?.department ? <Badge variant="neutral">{user.department}</Badge> : null}
              </div>
              {memberSince ? (
                <p className="mt-4 text-xs text-ink-400 dark:text-ink-500">Member since {memberSince}</p>
              ) : null}
              <p className="mt-4 text-xs text-ink-400 dark:text-ink-500">
                JPG, PNG or GIF · up to 5 MB
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick links" />
            <CardBody className="space-y-2">
              <ButtonLink to="/my-clubs" variant="secondary" fullWidth>
                My clubs
              </ButtonLink>
              <ButtonLink to="/my-events" variant="secondary" fullWidth>
                My events
              </ButtonLink>
              <ButtonLink to="/settings" variant="secondary" fullWidth>
                Account settings
              </ButtonLink>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div>
    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </p>
    <p className="mt-1.5 text-sm font-medium text-ink-900 dark:text-white">{value}</p>
  </div>
);

export default UserProfile;
