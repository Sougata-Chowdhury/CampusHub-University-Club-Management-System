import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  TicketIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import notificationService from '../services/notificationService';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  PageSkeleton,
  SegmentedControl,
} from '../ui';

const iconFor = (type = '') => {
  if (type.startsWith('report_')) return ExclamationTriangleIcon;
  if (type.includes('payment')) return TicketIcon;
  if (type.includes('event')) return TicketIcon;
  if (type.includes('club')) return UserGroupIcon;
  if (type.includes('announcement')) return MegaphoneIcon;
  return BellIcon;
};

const timeAgo = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, statsResponse] = await Promise.all([
        notificationService.getNotifications(page, 15, filter === 'unread'),
        notificationService.getNotificationStats().catch(() => null),
      ]);
      setNotifications(Array.isArray(list?.data?.notifications) ? list.data.notifications : []);
      setPagination(list?.pagination || {});
      const statsData = statsResponse?.data || {};
      setStats({
        total: statsData.total ?? list?.data?.total ?? 0,
        unread: statsData.unread ?? list?.data?.unreadCount ?? 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = stats.unread || 0;
  const readCount = Math.max(0, (stats.total || 0) - unreadCount);

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'All', count: stats.total || 0 },
      { value: 'unread', label: 'Unread', count: unreadCount },
    ],
    [stats.total, unreadCount],
  );

  const markRead = async (notification) => {
    if (notification.read) return;
    setBusyId(notification._id);
    try {
      await notificationService.markAsRead(notification._id);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, read: true, readAt: new Date() } : item,
        ),
      );
      setStats((current) => ({ ...current, unread: Math.max(0, current.unread - 1) }));
    } catch (err) {
      setError(err.message || 'Failed to mark the notification as read');
    } finally {
      setBusyId(null);
    }
  };

  const deleteNotification = async (notification) => {
    setBusyId(notification._id);
    try {
      await notificationService.deleteNotification(notification._id);
      setNotifications((current) => current.filter((item) => item._id !== notification._id));
      setStats((current) => ({
        total: Math.max(0, current.total - 1),
        unread: notification.read ? current.unread : Math.max(0, current.unread - 1),
      }));
    } catch (err) {
      setError(err.message || 'Failed to delete the notification');
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setNotice('');
    setError('');
    try {
      await notificationService.markAllAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true, readAt: new Date() })));
      setStats((current) => ({ ...current, unread: 0 }));
      setNotice('All notifications marked as read.');
    } catch (err) {
      setError(err.message || 'Failed to mark all as read');
    }
  };

  const deleteRead = async () => {
    setNotice('');
    setError('');
    try {
      const response = await notificationService.deleteReadNotifications();
      const deleted = response?.data?.deletedCount || 0;
      setNotifications((current) => current.filter((item) => !item.read));
      setStats((current) => ({ total: Math.max(0, current.total - deleted), unread: current.unread }));
      setNotice(`${deleted} read notification${deleted === 1 ? '' : 's'} deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete read notifications');
    }
  };

  if (loading && notifications.length === 0 && stats.total === 0) {
    return <PageSkeleton />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Everything that needs your attention — club updates, event changes and payment decisions."
        actions={
          <>
            <ButtonLink to="/settings" variant="secondary" icon={Cog6ToothIcon}>
              Preferences
            </ButtonLink>
            <Button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              icon={CheckIcon}
            >
              Mark all read
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Total</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{stats.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Unread</p>
          <p className="mt-1 text-2xl font-semibold text-brand-600 dark:text-brand-300">{unreadCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Read</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{readCount}</p>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl options={filterOptions} value={filter} onChange={setFilter} label="Filter notifications" />
        <Button
          variant="ghost"
          size="sm"
          icon={TrashIcon}
          onClick={deleteRead}
          disabled={readCount === 0}
          className="text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:text-rose-400 dark:hover:bg-danger-600/10"
        >
          Delete read
        </Button>
      </div>

      {error ? (
        <Alert
          variant="error"
          className="mt-4"
          action={
            <button type="button" onClick={load} className="font-semibold underline underline-offset-2">
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

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-5">
              <div className="flex gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-ink-100 dark:bg-ink-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                </div>
              </div>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={BellIcon}
            title={filter === 'unread' ? 'No unread notifications' : 'You are all caught up'}
            description={
              filter === 'unread'
                ? 'When something needs your attention it will appear here.'
                : 'Club approvals, event reminders and payment updates will show up here.'
            }
            action={
              filter === 'unread' ? (
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  View all notifications
                </Button>
              ) : (
                <ButtonLink to="/browse-events" variant="secondary">
                  Browse events
                </ButtonLink>
              )
            }
          />
        ) : (
          notifications.map((notification) => {
            const Icon = iconFor(notification.type);
            const unread = !notification.read;
            return (
              <Card
                key={notification._id}
                className={`p-4 transition-colors ${
                  unread ? 'border-brand-200 bg-brand-50/40 dark:border-brand-500/30 dark:bg-brand-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      unread
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">
                        {notification.title || 'Notification'}
                      </p>
                      {unread ? <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Unread" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-400 dark:text-ink-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {timeAgo(notification.createdAt)}
                      </span>
                      {notification.link ? (
                        <Link
                          to={notification.link}
                          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {unread ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={CheckIcon}
                        loading={busyId === notification._id}
                        onClick={() => markRead(notification)}
                      >
                        Read
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={TrashIcon}
                      disabled={busyId === notification._id}
                      onClick={() => deleteNotification(notification)}
                      className="text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-600/10 dark:hover:text-rose-300"
                    >
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Page {pagination.page || page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default NotificationPage;
