import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  MapPinIcon,
  PlusIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { clubService } from '../services/clubService';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../ui';

const categories = [
  'Academic',
  'Sports',
  'Arts',
  'Technology',
  'Cultural',
  'Social',
  'Professional',
  'Other',
];

const CreateClub = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    meetingTime: '',
    tags: '',
    requirements: '',
    maxMembers: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Give your club a name.';
    if (!form.description.trim()) next.description = 'Describe what your club is about.';
    if (!form.category) next.category = 'Pick a category.';
    if (form.maxMembers && Number(form.maxMembers) < 1) {
      next.maxMembers = 'Use a positive number or leave it empty.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    try {
      await clubService.createClub({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        meetingTime: form.meetingTime.trim(),
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        requirements: form.requirements.trim(),
        maxMembers: form.maxMembers ? Number(form.maxMembers) : undefined,
      });
      navigate('/my-clubs', {
        state: { message: `${form.name.trim()} was submitted and is waiting for admin approval.` },
      });
    } catch (err) {
      setError(err.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Start something"
        title="Create a club"
        description="Give your community a home. New clubs are reviewed by an administrator before they appear publicly."
        actions={<ButtonLink to="/my-clubs" variant="secondary">My clubs</ButtonLink>}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Club details" description="Fields marked with * are required." />
          <CardBody>
            {error ? (
              <Alert variant="error" className="mb-5">
                {error}
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Field label="Club name" htmlFor="club-name" required error={fieldErrors.name}>
                <Input
                  id="club-name"
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="e.g. Robotics Society"
                  invalid={Boolean(fieldErrors.name)}
                  maxLength={80}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="club-description"
                required
                error={fieldErrors.description}
                hint="What will members do? What makes this club worth joining?"
              >
                <Textarea
                  id="club-description"
                  name="description"
                  value={form.description}
                  onChange={update}
                  rows={5}
                  placeholder="Describe your club's purpose, activities and goals."
                  maxLength={1000}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category" htmlFor="club-category" required error={fieldErrors.category}>
                  <Select
                    id="club-category"
                    name="category"
                    value={form.category}
                    onChange={update}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Meeting location" htmlFor="club-location">
                  <Input
                    id="club-location"
                    name="location"
                    value={form.location}
                    onChange={update}
                    placeholder="e.g. Student Centre, Room 204"
                  />
                </Field>

                <Field label="Meeting time" htmlFor="club-meeting-time">
                  <Input
                    id="club-meeting-time"
                    name="meetingTime"
                    value={form.meetingTime}
                    onChange={update}
                    placeholder="e.g. Wednesdays at 6:00 PM"
                  />
                </Field>

                <Field
                  label="Member limit"
                  htmlFor="club-max-members"
                  error={fieldErrors.maxMembers}
                  hint="Leave empty for unlimited."
                >
                  <Input
                    id="club-max-members"
                    name="maxMembers"
                    type="number"
                    min="1"
                    value={form.maxMembers}
                    onChange={update}
                    placeholder="Unlimited"
                  />
                </Field>
              </div>

              <Field
                label="Tags"
                htmlFor="club-tags"
                hint="Separate tags with commas, e.g. robotics, coding, competitions"
              >
                <Input
                  id="club-tags"
                  name="tags"
                  value={form.tags}
                  onChange={update}
                  placeholder="robotics, coding, competitions"
                />
              </Field>

              <Field label="Membership requirements" htmlFor="club-requirements">
                <Textarea
                  id="club-requirements"
                  name="requirements"
                  value={form.requirements}
                  onChange={update}
                  rows={3}
                  placeholder="Any prerequisites or commitments for new members (optional)."
                />
              </Field>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <ButtonLink to="/my-clubs" variant="secondary" fullWidth>
                  Cancel
                </ButtonLink>
                <Button type="submit" loading={loading} icon={PlusIcon} fullWidth>
                  Create club
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="How it works" />
            <CardBody>
              <ol className="space-y-4">
                {[
                  {
                    icon: InformationCircleIcon,
                    title: 'Submit your club',
                    text: 'Fill in the details and send it for review.',
                  },
                  {
                    icon: CheckCircleIcon,
                    title: 'Admin review',
                    text: 'An administrator checks the club before it goes live.',
                  },
                  {
                    icon: UserGroupIcon,
                    title: 'Grow your community',
                    text: 'Once approved, students can apply and you can publish events.',
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-900 dark:text-white">{step.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tips for approval" />
            <CardBody className="space-y-3 text-sm text-ink-600 dark:text-ink-300">
              <p className="flex items-start gap-2">
                <TagIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Choose the category that best matches your club.
              </p>
              <p className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Add a real meeting place so students know where to go.
              </p>
              <p className="flex items-start gap-2">
                <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                A regular meeting time helps members commit.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CreateClub;
