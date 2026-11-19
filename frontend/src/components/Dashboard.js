import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CreditCardIcon,
  FolderIcon,
  MapPinIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
} from '../ui';

const quickLinks = [
  { name: 'Browse clubs', description: 'Find your community', to: '/browse-clubs', icon: UserGroupIcon, accent: 'text-brand-600 bg-brand-50 dark:bg-brand-500/15 dark:text-brand-300' },
  { name: 'Browse events', description: 'See what is on', to: '/browse-events', icon: CalendarDaysIcon, accent: 'text-sky-600 bg-sky-50 dark:bg-sky-500/15 dark:text-sky-300' },
  { name: 'Announcements', description: 'Campus updates', to: '/announcements', icon: MegaphoneIcon, accent: 'text-violet-600 bg-violet-50 dark:bg-violet-500/15 dark:text-violet-300' },
  { name: 'Payments', description: 'Fees and receipts', to: '/payment-history', icon: CreditCardIcon, accent: 'text-success-600 bg-success-50 dark:bg-success-600/15 dark:text-emerald-300' },
  { name: 'Feedback', description: 'Share your thoughts', to: '/feedback', icon: ChatBubbleLeftRightIcon, accent: 'text-warning-600 bg-warning-50 dark:bg-warning-600/15 dark:text-amber-300' },
  { name: 'My reports', description: 'Track moderation', to: '/my-reports', icon: ShieldCheckIcon, accent: 'text-danger-600 bg-danger-50 dark:bg-danger-600/15 dark:text-rose-300' },
  { name: 'Files', description: 'Documents and media', to: '/files', icon: FolderIcon, accent: 'text-ink-600 bg-ink-100 dark:bg-ink-800 dark:text-ink-300' },
];

const statusVariant = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

const formatDay = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const DashboardSkeleton = () => (
  <div className="space-y-6" aria-busy="true">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-72 max-w-full" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-card border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-card border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <Skeleton className="h-5 w-40" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-card border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <Skeleton className="h-5 w-28" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load your dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <>
        <PageHeader title={`${greeting()}${user?.firstName ? `, ${user.firstName}` : ''}`} description="Here is what is happening on campus today." />
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      </>
    );
  }

  const stats = summary?.stats || {};
  const clubs = summary?.myClubs || [];
  const events = summary?.upcomingEvents || [];
  const announcements = summary?.announcements || [];

  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back'}
        description="Here is what is happening across your clubs and campus events."
        actions={
          <>
            <ButtonLink to="/browse-clubs" variant="secondary" icon={UserGroupIcon}>
              Browse clubs
            </ButtonLink>
            <ButtonLink to="/browse-events" icon={CalendarDaysIcon}>
              Explore events
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <Alert
          variant="error"
          className="mt-6"
          action={
            <button
              type="button"
              onClick={loadSummary}
              className="font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Available clubs"
          value={stats.availableClubs ?? 0}
          icon={UserGroupIcon}
          accent="brand"
          hint="Approved clubs open to join"
        />
        <StatCard
          label="My clubs"
          value={stats.joinedClubs ?? 0}
          icon={ShieldCheckIcon}
          accent="violet"
          hint={`${stats.clubsOwned ?? 0} led by you`}
        />
        <StatCard
          label="Registered events"
          value={stats.registeredEvents ?? 0}
          icon={CalendarDaysIcon}
          accent="sky"
          hint={`${stats.upcomingRegistrations ?? 0} still upcoming`}
        />
        <StatCard
          label="Pending payments"
          value={stats.pendingPayments ?? 0}
          icon={CreditCardIcon}
          accent={stats.pendingPayments > 0 ? 'warning' : 'success'}
          hint={stats.pendingPayments > 0 ? 'Awaiting approval' : 'All settled'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Upcoming events"
              description="The next four events on campus"
              action={
                <Link
                  to="/browse-events"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  View all
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
            {events.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={CalendarDaysIcon}
                  title="No upcoming events yet"
                  description="When clubs publish events they will appear here. Explore clubs to find something to join."
                  action={<ButtonLink to="/browse-events" size="sm">Browse events</ButtonLink>}
                  className="border-0 bg-transparent py-10 dark:bg-transparent"
                />
              </CardBody>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {events.map((event) => (
                  <li key={event.id}>
                    <Link
                      to={`/events/${event.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60"
                    >
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[10px] bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        <span className="text-[10px] font-semibold uppercase leading-none">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-tight">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                          {event.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatDay(event.date)} · {formatTime(event.date)}
                          </span>
                          {event.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="max-w-[200px] truncate">{event.location}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-xs font-medium text-ink-600 dark:text-ink-300">
                          {event.clubName}
                        </p>
                        <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                          {event.attendeesCount}
                          {event.maxAttendees ? ` / ${event.maxAttendees}` : ''} attending
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Quick actions" description="Jump straight to the things you do most" />
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-center gap-3 rounded-[10px] border border-ink-200 p-3 transition-all hover:border-ink-300 hover:bg-ink-50 dark:border-ink-800 dark:hover:border-ink-700 dark:hover:bg-ink-800/60"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${link.accent}`}>
                    <link.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900 dark:text-white">
                      {link.name}
                    </span>
                    <span className="block truncate text-xs text-ink-500 dark:text-ink-400">
                      {link.description}
                    </span>
                  </span>
                  <ArrowRightIcon
                    className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500 dark:text-ink-600"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="My clubs"
              action={
                <Link
                  to="/my-clubs"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Manage
                </Link>
              }
            />
            {clubs.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={UserGroupIcon}
                  title="You have not joined a club yet"
                  description="Browse approved clubs and apply to join one that fits your interests."
                  action={<ButtonLink to="/browse-clubs" size="sm">Find a club</ButtonLink>}
                  className="border-0 bg-transparent px-0 py-8 dark:bg-transparent"
                />
              </CardBody>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {clubs.map((club) => (
                  <li key={club.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-ink-100 text-sm font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                      {club.name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/clubs/${club.id}`}
                        className="block truncate text-sm font-medium text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
                      >
                        {club.name}
                      </Link>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        {club.category} · {club.membersCount} member{club.membersCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Badge variant={statusVariant[club.status] || 'neutral'}>{club.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Latest announcements"
              action={
                <Link
                  to="/announcements"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  View all
                </Link>
              }
            />
            {announcements.length === 0 ? (
              <CardBody>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  No announcements have been posted yet.
                </p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {announcements.map((announcement) => (
                  <li key={announcement.id} className="px-5 py-3.5">
                    <p className="line-clamp-2 text-sm text-ink-700 dark:text-ink-200">
                      {announcement.message}
                    </p>
                    <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-500">
                      {announcement.clubName ? `${announcement.clubName} · ` : ''}
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
