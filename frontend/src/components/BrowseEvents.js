import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UserGroupIcon,
  UserMinusIcon,
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
  EmptyState,
  PageHeader,
  SearchInput,
  SegmentedControl,
  SkeletonCard,
} from '../ui';
import ReportButton from './ReportButton';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const sorts = [
  { value: 'soonest', label: 'Soonest first' },
  { value: 'latest', label: 'Latest first' },
  { value: 'name', label: 'Name A–Z' },
];

const idOf = (value) => (value && typeof value === 'object' ? value._id || value.id : value);

const formatMonth = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short' });

const formatDayNumber = (date) => new Date(date).getDate();

const formatWeekdayTime = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const BrowseEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('soonest');
  const [pendingId, setPendingId] = useState(null);
  const noticeTimer = useRef(null);

  const userId = user?._id || user?.id;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await eventService.browseEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const showNotice = (message) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 4000);
  };

  const isRegistered = (event) =>
    Boolean(userId) &&
    (event.attendees || []).some((attendee) => idOf(attendee) === userId);

  const isFull = (event) =>
    event.maxAttendees > 0 && (event.attendees?.length || 0) >= event.maxAttendees;

  const counts = useMemo(
    () => ({
      all: events.length,
      upcoming: events.filter((event) => event.status !== 'completed').length,
      completed: events.filter((event) => event.status === 'completed').length,
    }),
    [events],
  );

  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = events;

    if (filter === 'upcoming') result = result.filter((event) => event.status !== 'completed');
    if (filter === 'completed') result = result.filter((event) => event.status === 'completed');

    if (term) {
      result = result.filter((event) => {
        const club = typeof event.clubId === 'object' ? event.clubId?.name : '';
        return (
          event.name?.toLowerCase().includes(term) ||
          event.description?.toLowerCase().includes(term) ||
          event.location?.toLowerCase().includes(term) ||
          club?.toLowerCase().includes(term)
        );
      });
    }

    return [...result].sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      const diff = new Date(a.date || 0) - new Date(b.date || 0);
      return sort === 'latest' ? -diff : diff;
    });
  }, [events, filter, search, sort]);

  const handleRegistration = async (event, action) => {
    setPendingId(event._id);
    setError('');

    try {
      if (action === 'join') {
        await eventService.joinEvent(event._id);
        showNotice(`You are registered for ${event.name}.`);
      } else {
        await eventService.leaveEvent(event._id);
        showNotice(`Registration for ${event.name} was cancelled.`);
      }

      // Update the local list so the button and attendee count react instantly.
      setEvents((current) =>
        current.map((item) => {
          if (item._id !== event._id) return item;
          const attendees = (item.attendees || []).filter(
            (attendee) => idOf(attendee) !== userId,
          );
          if (action === 'join') attendees.push({ _id: userId });
          return { ...item, attendees };
        }),
      );
    } catch (err) {
      const message = err.message || `Could not ${action === 'join' ? 'register for' : 'cancel'} this event`;
      setError(message);

      // Registration state can drift if the request failed after the write.
      if (message.toLowerCase().includes('already registered')) {
        loadEvents();
      }
    } finally {
      setPendingId(null);
    }
  };

  const filterOptions = filters.map((option) => ({
    ...option,
    count: counts[option.value],
  }));

  const hasFilters = Boolean(search.trim()) || filter !== 'all';

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Campus events"
        description="Workshops, talks, socials and more. Register in one click and keep everything in your calendar."
        actions={
          <>
            <ReportButton
              reportType="event"
              reportTargetId=""
              reportTargetInfo={{
                title: 'General event system report',
                description: 'Report issues with the event browsing system or inappropriate content',
              }}
              variant="icon"
              tooltip="Report an issue with the event system"
            />
            <ButtonLink to="/create-event" icon={PlusIcon}>
              Create event
            </ButtonLink>
          </>
        }
      />

      <Card className="mt-6">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-sm lg:flex-1"
            placeholder="Search events, clubs or locations…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search events"
          />

          <SegmentedControl
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            label="Filter events"
            className="lg:ml-auto"
          />

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort events"
            className="h-9 shrink-0 rounded-[10px] border border-ink-200 bg-white px-3 text-sm text-ink-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
          >
            {sorts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {error ? (
        <Alert
          variant="error"
          className="mt-4"
          action={
            <button
              type="button"
              onClick={loadEvents}
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

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {loading
            ? 'Loading events…'
            : `${visibleEvents.length} event${visibleEvents.length === 1 ? '' : 's'} found`}
        </p>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : visibleEvents.map((event) => {
              const completed = event.status === 'completed';
              const registered = isRegistered(event);
              const full = isFull(event);
              const attendees = event.attendees?.length || 0;
              const capacity = event.maxAttendees > 0 ? event.maxAttendees : null;
              const clubName =
                typeof event.clubId === 'object' ? event.clubId?.name : 'Campus club';

              return (
                <Card key={event._id} hover className="flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[12px] border ${
                        completed
                          ? 'border-ink-200 bg-ink-50 text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400'
                          : 'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase leading-none tracking-wide">
                        {formatMonth(event.date)}
                      </span>
                      <span className="text-xl font-bold leading-tight">
                        {formatDayNumber(event.date)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-brand-600 dark:text-brand-400">
                        {clubName || 'Campus club'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                        <ClockIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{formatWeekdayTime(event.date)}</span>
                      </p>
                    </div>

                    <Badge variant={completed ? 'neutral' : 'success'}>
                      {completed ? 'Completed' : event.timeUntil || 'Upcoming'}
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
                  </div>

                  {capacity ? (
                    <div className="mt-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                        <div
                          className={`h-full rounded-full ${
                            full ? 'bg-danger-500' : 'bg-brand-500'
                          }`}
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

                  <div className="mt-auto flex items-center gap-2 pt-5">
                    {completed ? (
                      <ButtonLink
                        to={`/events/${event._id}`}
                        variant="secondary"
                        size="sm"
                        fullWidth
                        icon={CheckCircleIcon}
                      >
                        View recap
                      </ButtonLink>
                    ) : registered ? (
                      <Button
                        variant="danger-soft"
                        size="sm"
                        fullWidth
                        icon={UserMinusIcon}
                        loading={pendingId === event._id}
                        onClick={() => handleRegistration(event, 'leave')}
                      >
                        Cancel registration
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        fullWidth
                        icon={UserPlusIcon}
                        disabled={full}
                        loading={pendingId === event._id}
                        onClick={() => handleRegistration(event, 'join')}
                      >
                        {full ? 'Event full' : 'Register'}
                      </Button>
                    )}

                    <Link
                      to={`/events/${event._id}`}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-[10px] border border-ink-200 px-3 text-sm font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                    >
                      Details
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              );
            })}
      </div>

      {!loading && visibleEvents.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDaysIcon}
            title={hasFilters ? 'No events match your filters' : 'No events scheduled yet'}
            description={
              hasFilters
                ? 'Try a different search term or switch back to all events.'
                : 'Once clubs publish events they will show up here. Explore clubs to find something to join.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <ButtonLink to="/browse-clubs" variant="secondary">
                  Browse clubs
                </ButtonLink>
              )
            }
          />
        </div>
      ) : null}
    </>
  );
};

export default BrowseEvents;
