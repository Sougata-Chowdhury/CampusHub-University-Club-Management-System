import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatBubbleLeftRightIcon, PlusIcon, StarIcon, UserIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import feedbackService from '../services/feedbackService';
import FeedbackDialog from '../components/feedback/FeedbackDialog';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  PageSkeleton,
  SearchInput,
  SegmentedControl,
  StatCard,
} from '../ui';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'event', label: 'Events' },
  { value: 'club', label: 'Clubs' },
  { value: 'general', label: 'General' },
];

const statusVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const timeAgo = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? '' : 's'} ago`;
};

const Stars = ({ rating = 0 }) => (
  <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <StarSolidIcon
        key={star}
        className={`h-4 w-4 ${star <= rating ? 'text-warning-500' : 'text-ink-200 dark:text-ink-700'}`}
        aria-hidden="true"
      />
    ))}
  </span>
);

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        limit: 30,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(filter !== 'all' ? { targetType: filter } : {}),
      };
      const [listResponse, statsResponse] = await Promise.all([
        feedbackService.getAllFeedback(params),
        feedbackService.getFeedbackStats().catch(() => null),
      ]);
      setFeedback(Array.isArray(listResponse?.data?.feedback) ? listResponse.data.feedback : []);
      setStats(statsResponse?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load feedback');
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const average = useMemo(() => {
    if (stats?.averageRating) return Number(stats.averageRating).toFixed(1);
    if (!feedback.length) return '—';
    const total = feedback.reduce((sum, item) => sum + (Number(item.rating) || 0), 0);
    return (total / feedback.length).toFixed(1);
  }, [stats, feedback]);

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Feedback"
        description="What students think about clubs, events and the platform itself."
        actions={
          <Button icon={PlusIcon} onClick={() => setDialogOpen(true)}>
            Share feedback
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Reviews" value={stats?.totalFeedback ?? feedback.length} icon={ChatBubbleLeftRightIcon} />
        <StatCard label="Average rating" value={average} icon={StarIcon} accent="warning" />
        <StatCard label="This month" value={stats?.thisMonth ?? '—'} icon={ChatBubbleLeftRightIcon} accent="success" />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-sm lg:flex-1"
            placeholder="Search feedback…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search feedback"
          />
          <SegmentedControl
            options={filters}
            value={filter}
            onChange={setFilter}
            label="Filter feedback"
            className="lg:ml-auto"
          />
        </div>
      </Card>

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

      <div className="mt-5 space-y-3">
        {loading ? (
          <PageSkeleton />
        ) : feedback.length === 0 ? (
          <EmptyState
            icon={ChatBubbleLeftRightIcon}
            title="No feedback yet"
            description={
              search || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Be the first to share what you think about a club, an event or the app.'
            }
            action={
              <Button icon={PlusIcon} onClick={() => setDialogOpen(true)}>
                Share feedback
              </Button>
            }
          />
        ) : (
          feedback.map((item) => (
            <Card key={item._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={item.rating} />
                    {item.category ? <Badge variant="brand">{item.category}</Badge> : null}
                    {item.status ? (
                      <Badge variant={statusVariant[item.status] || 'neutral'}>{item.status}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
                    {item.isAnonymous
                      ? 'Anonymous student'
                      : [item.userId?.firstName, item.userId?.lastName].filter(Boolean).join(' ') ||
                        'Campus student'}
                    <span aria-hidden="true"> · </span>
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-2.5 py-1 text-xs text-ink-500 dark:border-ink-700 dark:text-ink-400">
                  <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.helpfulVotes || 0} found helpful
                </span>
              </div>

              {item.targetInfo ? (
                <div className="mt-3 rounded-[10px] border border-ink-200 bg-ink-50/60 px-3 py-2 dark:border-ink-800 dark:bg-ink-800/40">
                  <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
                    About this {item.targetType || 'item'}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-900 dark:text-white">
                    {item.targetInfo.name || item.targetInfo.title}
                  </p>
                </div>
              ) : null}

              <p className="mt-3 text-sm leading-6 text-ink-700 dark:text-ink-200">{item.comment}</p>

              {item.adminResponse ? (
                <div className="mt-3 rounded-[10px] border border-success-100 bg-success-50 px-3 py-2 dark:border-success-600/30 dark:bg-success-600/10">
                  <p className="text-xs font-semibold text-success-700 dark:text-emerald-200">
                    Response from the team
                  </p>
                  <p className="mt-0.5 text-sm text-ink-700 dark:text-ink-200">{item.adminResponse}</p>
                </div>
              ) : null}
            </Card>
          ))
        )}
      </div>

      <FeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        targetType="general"
        targetId={null}
        targetName=""
        onFeedbackSubmitted={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </>
  );
};

export default FeedbackPage;
