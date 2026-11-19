import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDaysIcon, InformationCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { eventService } from '../services/eventService';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageSkeleton,
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

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [originalEvent, setOriginalEvent] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    maxAttendees: '',
    isPaid: false,
    price: '',
    currency: 'BDT',
  });
  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      setFetchLoading(true);
      setError('');
      try {
        const event = await eventService.getEventById(id);
        if (!active) return;
        setOriginalEvent(event);
        setForm({
          name: event.name || '',
          description: event.description || '',
          date: toLocalInput(event.date),
          location: event.location || '',
          maxAttendees: event.maxAttendees || '',
          isPaid: Boolean(event.isPaid),
          price: event.isPaid && event.price !== undefined && event.price !== null ? String(event.price) : '',
          currency: event.currency || 'BDT',
        });
      } catch (err) {
        if (active) setError(err.message || 'Failed to load this event');
      } finally {
        if (active) setFetchLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

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
      await eventService.updateEvent(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        location: form.location.trim(),
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
        isPaid: form.isPaid,
        price: form.isPaid ? Number(form.price) : undefined,
        currency: form.currency,
      });
      navigate(`/events/${id}`, { state: { message: 'Event updated successfully.' } });
    } catch (err) {
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const minDate = toLocalInput(new Date());

  if (fetchLoading) {
    return <PageSkeleton />;
  }

  if (error && !originalEvent) {
    return (
      <>
        <PageHeader eyebrow="Events" title="Edit event" />
        <div className="mt-6">
          <Alert variant="error" title="We could not load this event">
            {error}
          </Alert>
          <div className="mt-4">
            <ButtonLink to="/my-events" variant="secondary">
              Back to my events
            </ButtonLink>
          </div>
        </div>
      </>
    );
  }

  const attendeeCount = originalEvent?.attendees?.length || 0;

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Edit event"
        description={
          originalEvent?.name
            ? `Update the details for “${originalEvent.name}”.`
            : 'Update the details for this event.'
        }
        actions={
          <ButtonLink to={`/events/${id}`} variant="secondary">
            View event
          </ButtonLink>
        }
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
              <Field label="Event name" htmlFor="edit-event-name" required error={fieldErrors.name}>
                <Input
                  id="edit-event-name"
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
                htmlFor="edit-event-description"
                required
                error={fieldErrors.description}
              >
                <Textarea
                  id="edit-event-description"
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
                  htmlFor="edit-event-date"
                  required
                  error={fieldErrors.date}
                  hint="Must be in the future."
                >
                  <Input
                    id="edit-event-date"
                    name="date"
                    type="datetime-local"
                    value={form.date}
                    min={minDate}
                    onChange={update}
                    invalid={Boolean(fieldErrors.date)}
                  />
                </Field>

                <Field
                  label="Location"
                  htmlFor="edit-event-location"
                  required
                  error={fieldErrors.location}
                >
                  <Input
                    id="edit-event-location"
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
                htmlFor="edit-event-max"
                error={fieldErrors.maxAttendees}
                hint={
                  attendeeCount > 0
                    ? `${attendeeCount} ${attendeeCount === 1 ? 'person is' : 'people are'} already registered. Lowering the limit will not remove them.`
                    : 'Leave empty for unlimited capacity.'
                }
              >
                <Input
                  id="edit-event-max"
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
                    <Field label="Price" htmlFor="edit-event-price" required error={fieldErrors.price}>
                      <Input
                        id="edit-event-price"
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
                    <Field label="Currency" htmlFor="edit-event-currency" required>
                      <Select
                        id="edit-event-currency"
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
                <ButtonLink to={`/events/${id}`} variant="secondary" fullWidth>
                  Cancel
                </ButtonLink>
                <Button type="submit" loading={loading} icon={PencilSquareIcon} fullWidth>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Before you save" />
            <CardBody className="space-y-3 text-sm text-ink-600 dark:text-ink-300">
              <p className="flex items-start gap-2">
                <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Registered attendees are notified when the date or location changes.
              </p>
              <p className="flex items-start gap-2">
                <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                Past dates cannot be selected. To cancel an event, delete it from My events.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default EditEvent;
