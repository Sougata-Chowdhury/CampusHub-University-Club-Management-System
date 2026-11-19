import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  TicketIcon,
  TrashIcon,
  UserGroupIcon,
  UserMinusIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
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
  SearchInput,
  SegmentedControl,
  SkeletonCard,
} from '../ui';

const idOf = (value) => (value && typeof value === 'object' ? value._id || value.id : value);

const formatMonth = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : '—';

const formatDay = (value) => (value ? new Date(value).getDate() : '—');

const formatWeekdayTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date to be announced';

const ClubEvents = () => {
  const { clubId } = useParams();
  const { user } = useAuth();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('upcoming');

  const userId = user?._id || user?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [clubData, eventsData] = await Promise.all([
        clubService.getClubById(clubId),
        eventService.getEventsByClub(clubId),
      ]);
      setClub(clubData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load club events');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isOwner = Boolean(club && userId && String(idOf(club.createdBy)) === String(userId));

  const isRegistered = (event) =>
    Boolean(userId) && (event.attendees || []).some((attendee) => String(idOf(attendee)) === String(userId));

  const isPastEvent = (event) => new Date(event.date) < new Date();

  const isFull = (event) =>
    event.maxAttendees > 0 && (event.attendees?.length || 0) >= event.maxAttendees;

  const counts = useMemo(
    () => ({
      upcoming: events.filter((event) => !isPastEvent(event)).length,
      past: events.filter((event) => isPastEvent(event)).length,
    }),
    [events],
  );

  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = events;

    if (filter === 'upcoming') result = result.filter((event) => !isPastEvent(event));
    if (filter === 'past') result = result.filter((event) => isPastEvent(event));

    if (term) {
      result = result.filter(
        (event) =>
          event.name?.toLowerCase().includes(term) ||
          event.description?.toLowerCase().includes(term) ||
          event.location?.toLowerCase().includes(term),
      );
    }

    return [...result].sort((a, b) => {
      const diff = new Date(a.date || 0) - new Date(b.date || 0);
      return filter === 'past' ? -diff : diff;
    });
  }, [events, filter, search]);

  const handleRegistration = async (event, action) => {
    setPendingId(event._id);
    setError('');
    setNotice('');
    try {
      if (action === 'join') {
        await eventService.joinEvent(event._id);
        setNotice(`You are registered for ${event.name}.`);
      } else {
        await eventService.leaveEvent(event._id);
        setNotice(`Registration for ${event.name} was cancelled.`);
      }
      setEvents((current) =>
        current.map((item) => {
          if (item._id !== event._id) return item;
          const attendees = (item.attendees || []).filter(
            (attendee) => String(idOf(attendee)) !== String(userId),
          );
          if (action === 'join') attendees.push({ _id: userId });
          return { ...item, attendees };
        }),
      );
    } catch (err) {
      setError(err.message || `Could not ${action === 'join' ? 'register for' : 'cancel'} this event`);
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
      setEvents((current) => current.filter((event) => event._id !== deleteTarget._id));
      setNotice(`“${deleteTarget.name}” was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const filterOptions = [
    { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { value: 'past', label: 'Past', count: counts.past },
    { value: 'all', label: 'All', count: events.length },
  ];

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Club events" title={club?.name || 'Club events'} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </>
    );
  }

  if (!club) {
    return (
      <>
        <PageHeader eyebrow="Club events" title="Club events" />
        <div className="mt-6">
          <Alert variant="error" title="We could not load this club">
            {error || 'The club may have been removed.'}
          </Alert>
          <div className="mt-4">
            <ButtonLink to="/my-clubs" variant="secondary" icon={ArrowLeftIcon}>
              Back to my clubs
            </ButtonLink>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={club.category || 'Club events'}
        title={`${club.name} events`}
        description={club.description || 'Everything this club has planned, in one place.'}
        actions={
          <>
            <ButtonLink to={`/clubs/${clubId}`} variant="secondary" icon={ArrowLeftIcon}>
              Club page
            </ButtonLink>
            {isOwner ? (
              <ButtonLink to={`/create-event?clubId=${clubId}`} icon={PlusIcon}>
                New event
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Upcoming events</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{counts.upcoming}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Past events</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{counts.past}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Members</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {club.members?.length || 0}
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-sm lg:flex-1"
            placeholder="Search this club's events…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search club events"
          />
          <SegmentedControl
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            label="Filter events"
            className="lg:ml-auto"
          />
        </div>
      </Card>

      {error ? (
        <Alert
          variant="error"
          className="mt-4"
          action={
            <button
              type="button"
              onClick={loadData}
              className="font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}

      {visibleEvents.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDaysIcon}
            title={events.length === 0 ? 'No events yet' : 'No events match your filters'}
            description={
              events.length === 0
                ? isOwner
                  ? 'Create the first event for your club and it will appear here.'
                  : 'This club has not published any events yet. Check back soon.'
                : 'Try a different search term or switch the filter.'
            }
            action={
              isOwner ? (
                <ButtonLink to={`/create-event?clubId=${clubId}`} icon={PlusIcon}>
                  Create first event
                </ButtonLink>
              ) : (
                <ButtonLink to="/browse-events" variant="secondary">
                  Browse all events
                </ButtonLink>
              )
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleEvents.map((event) => {
            const past = isPastEvent(event);
            const registered = isRegistered(event);
            const full = isFull(event);
            const attendees = event.attendees?.length || 0;
            const capacity = event.maxAttendees > 0 ? event.maxAttendees : null;

            return (
              <Card key={event._id} hover className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[12px] border ${
                      past
                        ? 'border-ink-200 bg-ink-50 text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400'
                        : 'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase leading-none tracking-wide">
                      {formatMonth(event.date)}
                    </span>
                    <span className="text-xl font-bold leading-tight">{formatDay(event.date)}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-brand-600 dark:text-brand-400">
                      {club.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{formatWeekdayTime(event.date)}</span>
                    </p>
                  </div>

                  <Badge variant={past ? 'neutral' : event.isPaid ? 'warning' : 'success'}>
                    {past ? 'Past' : event.isPaid ? 'Paid' : 'Free'}
                  </Badge>
                </div>

                <h3 className="mt-4 line-clamp-2 text-base font-semibold text-ink-900 dark:text-white">
                  <Link
                    to={`/events/${event._id}`}
                    className="hover:text-brand-600 dark:hover:text-brand-300"
                  >
                    {event.name}
                  </Link>
                </h3>

                <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-ink-500 dark:text-ink-400">
                  {event.description || 'No description provided yet.'}
                </p>

                <div className="mt-3 space-y-1.5 text-xs text-ink-500 dark:text-ink-400">
                  {event.location ? (
                    <span className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  ) : null}
                  <span className="flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                    {attendees} attending
                    {capacity ? <span className="text-ink-400"> · {capacity} spots</span> : null}
                  </span>
                  {event.isPaid ? (
                    <span className="flex items-center gap-2">
                      <TicketIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                      {event.currency || 'BDT'} {event.price}
                    </span>
                  ) : null}
                </div>

                {capacity ? (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                      <div
                        className={`h-full rounded-full ${full ? 'bg-danger-500' : 'bg-brand-500'}`}
                        style={{
                          width: `${Math.min(100, Math.round((attendees / capacity) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">
                      {full
                        ? 'Event is full'
                        : `${capacity - attendees} spot${capacity - attendees === 1 ? '' : 's'} left`}
                    </p>
                  </div>
                ) : null}

                {isOwner ? (
                  <div className="mt-auto flex gap-2 pt-5">
                    <ButtonLink
                      to={`/events/${event._id}/edit`}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      icon={PencilSquareIcon}
                    >
                      Edit
                    </ButtonLink>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      fullWidth
                      icon={TrashIcon}
                      onClick={() => setDeleteTarget(event)}
                    >
                      Delete
                    </Button>
                  </div>
                ) : past ? (
                  <div className="mt-auto pt-5">
                    <ButtonLink
                      to={`/events/${event._id}`}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      icon={EyeIcon}
                    >
                      View recap
                    </ButtonLink>
                  </div>
                ) : registered ? (
                  <div className="mt-auto flex gap-2 pt-5">
                    <ButtonLink
                      to={`/events/${event._id}`}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      icon={EyeIcon}
                    >
                      Details
                    </ButtonLink>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      fullWidth
                      icon={UserMinusIcon}
                      loading={pendingId === event._id}
                      onClick={() => handleRegistration(event, 'leave')}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-auto flex gap-2 pt-5">
                    <ButtonLink
                      to={`/events/${event._id}`}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      icon={EyeIcon}
                    >
                      Details
                    </ButtonLink>
                    <Button
                      size="sm"
                      fullWidth
                      icon={full ? CheckCircleIcon : UserPlusIcon}
                      disabled={full}
                      loading={pendingId === event._id}
                      onClick={() => handleRegistration(event, 'join')}
                    >
                      {full ? 'Full' : 'Register'}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

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
            <h2
              id="delete-event-title"
              className="mt-4 text-lg font-semibold text-ink-900 dark:text-white"
            >
              Delete “{deleteTarget.name}”?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              This removes the event and its registrations. This cannot be undone.
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

export default ClubEvents;
