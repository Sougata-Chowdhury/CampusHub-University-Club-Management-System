import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  MapPinIcon,
  PlusIcon,
  TicketIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { clubService } from '../services/clubService';
import { eventService } from '../services/eventService';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../ui';

const currencies = [
  ['BDT', 'BDT — Bangladeshi Taka'],
  ['USD', 'USD — US Dollar'],
  ['EUR', 'EUR — Euro'],
  ['GBP', 'GBP — British Pound'],
  ['INR', 'INR — Indian Rupee'],
  ['PKR', 'PKR — Pakistani Rupee'],
  ['CAD', 'CAD — Canadian Dollar'],
  ['AUD', 'AUD — Australian Dollar'],
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedClubId = new URLSearchParams(location.search).get('clubId') || '';

  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [form, setForm] = useState({
    clubId: preselectedClubId,
    name: '',
    description: '',
    date: '',
    location: '',
    maxAttendees: '',
    isPaid: false,
    price: '',
    currency: 'BDT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;
    clubService
      .getMyClubs()
      .then((data) => {
        if (active) setClubs(Array.isArray(data?.createdClubs) ? data.createdClubs : []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load your clubs');
      })
      .finally(() => {
        if (active) setClubsLoading(false);
      });
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

  const togglePaid = (event) => {
    const paid = event.target.checked;
    setForm((current) => ({
      ...current,
      isPaid: paid,
      price: paid ? current.price : '',
      currency: paid ? current.currency : 'BDT',
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.clubId) next.clubId = 'Choose the club hosting this event.';
    if (!form.name.trim()) next.name = 'Give the event a name.';
    if (!form.description.trim()) next.description = 'Describe what the event is about.';
    if (!form.date) next.date = 'Pick a date and time.';
    else if (new Date(form.date) <= new Date()) next.date = 'The event must be in the future.';
    if (!form.location.trim()) next.location = 'Add a location.';
    if (form.maxAttendees && Number(form.maxAttendees) < 1) {
      next.maxAttendees = 'Use a positive number or leave it empty.';
    }
    if (form.isPaid && (form.price === '' || Number(form.price) < 0)) {
      next.price = 'Enter a valid price (0 or more).';
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
      await eventService.createEvent({
        clubId: form.clubId,
        name: form.name.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        location: form.location.trim(),
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
        isPaid: form.isPaid,
        price: form.isPaid ? Number(form.price) : undefined,
        currency: form.currency,
      });
      navigate('/my-events', { state: { message: 'Event created successfully.' } });
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  if (!clubsLoading && clubs.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Plan something"
          title="Create an event"
          description="Events are hosted by the clubs you lead."
        />
        <div className="mt-6">
          <EmptyState
            icon={TicketIcon}
            title="You need a club first"
            description="Only club owners can publish events. Create a club, and once it is approved you can start scheduling events."
            action={<ButtonLink to="/create-club" icon={PlusIcon}>Create a club</ButtonLink>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Plan something"
        title="Create an event"
        description="Pick a club, set the time and place, and publish it to the campus calendar."
        actions={<ButtonLink to="/my-events" variant="secondary">My events</ButtonLink>}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Event details" description="Fields marked with * are required." />
          <CardBody>
            {error ? (
              <Alert variant="error" className="mb-5">
                {error}
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Field label="Hosting club" htmlFor="event-club" required error={fieldErrors.clubId}>
                <Select
                  id="event-club"
                  name="clubId"
                  value={form.clubId}
                  onChange={update}
                  disabled={clubsLoading}
                >
                  <option value="">{clubsLoading ? 'Loading your clubs…' : 'Select a club'}</option>
                  {clubs.map((club) => (
                    <option key={club._id} value={club._id}>
                      {club.name}
                      {club.status !== 'approved' ? ` (${club.status})` : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Event name" htmlFor="event-name" required error={fieldErrors.name}>
                <Input
                  id="event-name"
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="e.g. Intro to Robotics Workshop"
                  invalid={Boolean(fieldErrors.name)}
                  maxLength={120}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="event-description"
                required
                error={fieldErrors.description}
              >
                <Textarea
                  id="event-description"
                  name="description"
                  value={form.description}
                  onChange={update}
                  rows={4}
                  placeholder="What will happen at this event?"
                  maxLength={1500}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Date and time"
                  htmlFor="event-date"
                  required
                  error={fieldErrors.date}
                  hint="Must be in the future."
                >
                  <Input
                    id="event-date"
                    name="date"
                    type="datetime-local"
                    value={form.date}
                    min={minDate}
                    onChange={update}
                    invalid={Boolean(fieldErrors.date)}
                  />
                </Field>

                <Field label="Location" htmlFor="event-location" required error={fieldErrors.location}>
                  <Input
                    id="event-location"
                    name="location"
                    value={form.location}
                    onChange={update}
                    placeholder="e.g. Main Auditorium"
                    invalid={Boolean(fieldErrors.location)}
                  />
                </Field>
              </div>

              <Field
                label="Maximum attendees"
                htmlFor="event-max"
                error={fieldErrors.maxAttendees}
                hint="Leave empty for unlimited capacity."
              >
                <Input
                  id="event-max"
                  name="maxAttendees"
                  type="number"
                  min="1"
                  value={form.maxAttendees}
                  onChange={update}
                  placeholder="Unlimited"
                />
              </Field>

              <div className="rounded-[10px] border border-ink-200 p-4 dark:border-ink-800">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.isPaid}
                    onChange={togglePaid}
                    className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink-900 dark:text-white">
                      This is a paid event
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500 dark:text-ink-400">
                      Attendees will submit a payment before their registration is confirmed.
                    </span>
                  </span>
                </label>

                {form.isPaid ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Price" htmlFor="event-price" required error={fieldErrors.price}>
                      <Input
                        id="event-price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={update}
                        placeholder="0.00"
                        invalid={Boolean(fieldErrors.price)}
                      />
                    </Field>
                    <Field label="Currency" htmlFor="event-currency" required>
                      <Select
                        id="event-currency"
                        name="currency"
                        value={form.currency}
                        onChange={update}
                      >
                        {currencies.map(([code, label]) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <ButtonLink to="/my-events" variant="secondary" fullWidth>
                  Cancel
                </ButtonLink>
                <Button type="submit" loading={loading} icon={PlusIcon} fullWidth>
                  Create event
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Event checklist" />
            <CardBody className="space-y-3 text-sm text-ink-600 dark:text-ink-300">
              <p className="flex items-start gap-2">
                <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Pick a time when your members are free and avoid exam weeks.
              </p>
              <p className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Be specific with the location so people can find the room.
              </p>
              <p className="flex items-start gap-2">
                <UserGroupIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Set a capacity if the venue has limited space.
              </p>
              <p className="flex items-start gap-2">
                <TicketIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Paid events collect payment before the spot is confirmed.
              </p>
            </CardBody>
          </Card>

          <Alert variant="info" title="Need a hand?">
            You can edit or delete any event later from <strong>My events</strong>.
          </Alert>
        </div>
      </div>
    </>
  );
};

export default CreateEvent;
