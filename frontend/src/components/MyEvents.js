import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import { clubService } from '../services/clubService';
import { eventService } from '../services/eventService';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SegmentedControl,
  SkeletonCard,
} from '../ui';

const eventStatus = (date) => {
  const eventDate = new Date(date);
  const now = new Date();
  if (eventDate < now) return { key: 'past', label: 'Past', variant: 'neutral' };
  if (eventDate.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
    return { key: 'today', label: 'Soon', variant: 'warning' };
  }
  return { key: 'upcoming', label: 'Upcoming', variant: 'success' };
};

const formatDay = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const MyEvents = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [createdEvents, setCreatedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('created');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.message || '');
  const [pendingId, setPendingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const noticeTimer = useRef(null);

  const filterClubId = new URLSearchParams(location.search).get('clubId');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [created, registered, myClubs] = await Promise.all([
          eventService.getMyEvents(),
          eventService.getRegisteredEvents(),
          clubService.getMyClubs(),
        ]);
        if (!active) return;
        setCreatedEvents(Array.isArray(created) ? created : []);
        setRegisteredEvents(Array.isArray(registered) ? registered : []);
        setClubs(Array.isArray(myClubs?.createdClubs) ? myClubs.createdClubs : []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load your events');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!location.state?.message) return;
    setNotice(location.state.message);
    navigate(location.pathname, { replace: true });
  }, [location.state, location.pathname, navigate]);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  const showNotice = (message) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 4000);
  };

  const visibleCreated = createdEvents.filter(
    (event) => !filterClubId || event.clubId?._id === filterClubId,
  );

  const clubName = filterClubId
    ? [...createdEvents, ...registeredEvents].find((event) => event.clubId?._id === filterClubId)
        ?.clubId?.name
    : null;

  const upcomingCreated = createdEvents.filter((event) => eventStatus(event.date).key !== 'past').length;
  const upcomingRegistered = registeredEvents.filter(
    (event) => eventStatus(event.date).key !== 'past',
  ).length;
  const totalAttendees = createdEvents.reduce(
    (sum, event) => sum + (event.attendees?.length || 0),
    0,
  );

  const handleCancelRegistration = async (eventId) => {
    setPendingId(eventId);
    setError('');
    try {
      await eventService.leaveEvent(eventId);
      setRegisteredEvents((current) => current.filter((event) => event._id !== eventId));
      showNotice('Your registration was cancelled.');
    } catch (err) {
      setError(err.message || 'Failed to cancel your registration');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await eventService.deleteEvent(deleteTarget._id);
      setCreatedEvents((current) => current.filter((event) => event._id !== deleteTarget._id));
      setRegisteredEvents((current) => current.filter((event) => event._id !== deleteTarget._id));
      setDeleteTarget(null);
      showNotice('Event deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const renderEventCard = (event, kind) => {
    const status = eventStatus(event.date);
    const club = typeof event.clubId === 'object' ? event.clubId?.name : '';

    return (
      <Card key={event._id} hover className="flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[10px] bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <span className="text-[10px] font-semibold uppercase leading-none">
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-lg font-bold leading-tight">{new Date(event.date).getDate()}</span>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <h3 className="mt-4 line-clamp-2 text-base font-semibold text-ink-900 dark:text-white">
          <Link to={`/events/${event._id}`} className="hover:text-brand-600 dark:hover:text-brand-300">
            {event.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-ink-500 dark:text-ink-400">
          {event.description || 'No description provided yet.'}
        </p>

        <div className="mt-3 space-y-1.5 text-xs text-ink-500 dark:text-ink-400">
          <span className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            <span className="truncate">
              {formatDay(event.date)} · {formatTime(event.date)}
            </span>
          </span>
          {event.location ? (
            <span className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              <span className="truncate">{event.location}</span>
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            {event.attendees?.length || 0} attending
            {event.maxAttendees ? ` · ${event.maxAttendees} spots` : ''}
          </span>
          {club ? <span className="truncate">{club}</span> : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <ButtonLink to={`/events/${event._id}`} variant="secondary" size="sm" fullWidth>
            View
          </ButtonLink>

          {kind === 'created' ? (
            <>
              <Link
                to={`/events/${event._id}/edit`}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-ink-200 px-3 text-sm font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <PencilIcon className="h-4 w-4" aria-hidden="true" />
                Edit
              </Link>
              <Button
                variant="danger-soft"
                size="sm"
                fullWidth
                icon={TrashIcon}
                onClick={() => setDeleteTarget(event)}
              >
                Delete
              </Button>
            </>
          ) : status.key !== 'past' ? (
            <Button
              variant="danger-soft"
              size="sm"
              fullWidth
              icon={UserMinusIcon}
              loading={pendingId === event._id}
              onClick={() => handleCancelRegistration(event._id)}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </Card>
    );
  };

  const tabs = [
    { value: 'created', label: 'Created', count: visibleCreated.length },
    { value: 'registered', label: 'Registered', count: registeredEvents.length },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title="My events"
        description={
          filterClubId
            ? `Events for ${clubName || 'the selected club'}.`
            : 'Create events for your clubs and keep track of everything you have registered for.'
        }
        actions={
          <>
            {filterClubId ? (
              <ButtonLink to="/my-events" variant="secondary">
                View all
              </ButtonLink>
            ) : null}
            {clubs.length > 0 ? (
              <ButtonLink to="/create-event" icon={PlusIcon}>
                Create event
              </ButtonLink>
            ) : (
              <ButtonLink to="/create-club" icon={PlusIcon}>
                Create a club first
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Upcoming created</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{upcomingCreated}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Upcoming registered</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {upcomingRegistered}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Total attendees</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{totalAttendees}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Clubs you lead</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{clubs.length}</p>
        </Card>
      </div>

      <div className="mt-6">
        <SegmentedControl options={tabs} value={tab} onChange={setTab} label="Event view" />
      </div>

      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" className="mt-4" title="Something went wrong">
          {error}
        </Alert>
      ) : null}

      <div className="mt-5">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : tab === 'created' ? (
          visibleCreated.length === 0 ? (
            <EmptyState
              icon={CalendarDaysIcon}
              title={filterClubId ? 'This club has no events yet' : 'You have not created an event yet'}
              description={
                clubs.length > 0
                  ? 'Publish your first event and it will appear on the campus events calendar.'
                  : 'Create a club first, then you can publish events for its members.'
              }
              action={
                clubs.length > 0 ? (
                  <ButtonLink to="/create-event" icon={PlusIcon}>Create event</ButtonLink>
                ) : (
                  <ButtonLink to="/create-club" icon={PlusIcon}>Create a club</ButtonLink>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCreated.map((event) => renderEventCard(event, 'created'))}
            </div>
          )
        ) : registeredEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDaysIcon}
            title="You have not registered for any events"
            description="Browse the campus calendar and register for workshops, talks and socials."
            action={<ButtonLink to="/browse-events" icon={CalendarDaysIcon}>Browse events</ButtonLink>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {registeredEvents.map((event) => renderEventCard(event, 'registered'))}
          </div>
        )}
      </div>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-rose-400">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 id="delete-event-title" className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
              Delete “{deleteTarget.name}”?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              Attendees will lose their registration and this event will be removed from the calendar.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Delete event
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MyEvents;
