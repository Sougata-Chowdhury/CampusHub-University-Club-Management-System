import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/eventService';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
} from '../ui';
import ReportButton from './ReportButton';
import FeedbackButton from './feedback/FeedbackButton';

const idOf = (value) => (value && typeof value === 'object' ? value._id || value.id : value);

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const formatCurrency = (amount, currency = 'BDT') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'BDT').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch (error) {
    return `${amount} ${currency}`;
  }
};

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const userId = user?._id || user?.id;

  const loadEvent = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const data = await eventService.getEventById(id);
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Failed to load this event');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) loadEvent({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadEvent]);

  const attendees = event?.attendees || [];
  const isEnrolled = Boolean(userId) && attendees.some((attendee) => String(idOf(attendee)) === String(userId));
  const isCompleted = event ? new Date(event.date) < new Date() : false;
  const isFull = Boolean(event?.maxAttendees) && attendees.length >= event.maxAttendees;
  const club = typeof event?.clubId === 'object' ? event.clubId : null;

  const handleEnrollment = async () => {
    if (!event) return;

    if (event.isPaid) {
      navigate(`/payment/${event._id}`);
      return;
    }

    setEnrolling(true);
    setError('');
    try {
      await eventService.joinEvent(event._id);
      setNotice('You are registered. See you there!');
      await loadEvent({ silent: true });
    } catch (err) {
      setError(err.message || 'Failed to register for this event');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-4 w-24" />
        <Card className="p-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-6 h-24 w-full" />
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <EmptyState
        icon={CalendarDaysIcon}
        title="Event not found"
        description={error}
        action={<ButtonLink to="/browse-events" icon={ArrowLeftIcon}>Back to events</ButtonLink>}
      />
    );
  }

  if (!event) return null;

  const capacity = event.maxAttendees > 0 ? event.maxAttendees : null;
  const percentage = capacity ? Math.min(100, Math.round((attendees.length / capacity) * 100)) : 0;

  return (
    <>
      <Link
        to="/browse-events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to events
      </Link>

      <PageHeader
        className="mt-4"
        eyebrow={club?.name || 'Campus event'}
        title={event.name}
        description={event.description}
        actions={
          <ReportButton
            reportType="event"
            reportTargetId={event._id}
            reportTargetInfo={{
              title: event.name,
              description: event.description,
              club: club?.name,
            }}
            variant="icon"
            tooltip="Report this event"
          />
        }
      />

      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={isCompleted ? 'neutral' : 'success'}>
                {isCompleted ? 'Completed' : 'Upcoming'}
              </Badge>
              {event.isPaid ? (
                <Badge variant="info">{formatCurrency(event.price, event.currency)}</Badge>
              ) : (
                <Badge variant="brand">Free event</Badge>
              )}
              {isFull && !isCompleted ? <Badge variant="warning">Full</Badge> : null}
              {isEnrolled ? <Badge variant="success" dot>Registered</Badge> : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-[10px] border border-ink-200 p-3 dark:border-ink-800">
                <CalendarDaysIcon className="mt-0.5 h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Date</p>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[10px] border border-ink-200 p-3 dark:border-ink-800">
                <ClockIcon className="mt-0.5 h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Time</p>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{formatTime(event.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[10px] border border-ink-200 p-3 dark:border-ink-800">
                <MapPinIcon className="mt-0.5 h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Location</p>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{event.location || 'TBA'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[10px] border border-ink-200 p-3 dark:border-ink-800">
                <UserGroupIcon className="mt-0.5 h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Attending</p>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">
                    {attendees.length}
                    {capacity ? ` / ${capacity}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {capacity ? (
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div
                    className={`h-full rounded-full ${isFull ? 'bg-danger-500' : 'bg-brand-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
                  {isFull
                    ? 'This event is full.'
                    : `${capacity - attendees.length} of ${capacity} spots remaining.`}
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {isEnrolled ? (
                <span className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-success-50 px-4 text-sm font-medium text-success-700 dark:bg-success-600/15 dark:text-emerald-300">
                  <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                  You are registered
                </span>
              ) : isCompleted ? (
                <span className="text-sm text-ink-500 dark:text-ink-400">
                  Registration closed — this event has ended.
                </span>
              ) : (
                <Button
                  onClick={handleEnrollment}
                  loading={enrolling}
                  disabled={isFull}
                  icon={event.isPaid ? BanknotesIcon : UserPlusIcon}
                >
                  {isFull ? 'Event full' : event.isPaid ? 'Pay & register' : 'Register for event'}
                </Button>
              )}

              {club ? (
                <ButtonLink to={`/clubs/${club._id}`} variant="secondary">
                  View club
                </ButtonLink>
              ) : null}
            </div>
          </Card>

          {event.content ? (
            <Card>
              <CardHeader title="About this event" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                  {event.content}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Hosted by" />
            <CardBody>
              <p className="text-sm font-semibold text-ink-900 dark:text-white">
                {club?.name || 'Campus club'}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-ink-500 dark:text-ink-400">
                {club?.description || 'This event is organised by a campus club.'}
              </p>
              {club ? (
                <ButtonLink to={`/clubs/${club._id}`} variant="secondary" size="sm" className="mt-3">
                  Open club
                </ButtonLink>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Good to know" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500 dark:text-ink-400">Price</span>
                <span className="font-medium text-ink-900 dark:text-white">
                  {event.isPaid ? formatCurrency(event.price, event.currency) : 'Free'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500 dark:text-ink-400">Capacity</span>
                <span className="font-medium text-ink-900 dark:text-white">
                  {capacity ? `${capacity} people` : 'Unlimited'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500 dark:text-ink-400">Status</span>
                <span className="font-medium text-ink-900 dark:text-white">
                  {isCompleted ? 'Completed' : 'Open for registration'}
                </span>
              </div>
            </CardBody>
          </Card>

          {isEnrolled || isCompleted ? (
            <Card>
              <CardHeader title="Your feedback" description="Tell the organisers how it went." />
              <CardBody>
                <FeedbackButton
                  targetType="event"
                  targetId={event._id}
                  targetInfo={{
                    title: event.name,
                    description: event.description,
                    club: club?.name,
                  }}
                  text="Rate this event"
                  buttonVariant="outlined"
                />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default EventDetails;
