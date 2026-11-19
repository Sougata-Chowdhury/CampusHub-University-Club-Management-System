import React, { useCallback, useEffect, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  StarIcon as StarOutlineIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import feedbackService from '../services/feedbackService';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  PageSkeleton,
  SearchInput,
  SegmentedControl,
} from '../ui';

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  under_review: 'info',
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
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

const MyFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(filter !== 'all' ? { status: filter } : {}),
      };
      const response = await feedbackService.getMyFeedback(params);
      setFeedback(Array.isArray(response?.data?.feedback) ? response.data.feedback : []);
      setTotalPages(response?.data?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load your feedback');
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await feedbackService.deleteFeedback(deleteTarget._id);
      setFeedback((current) => current.filter((item) => item._id !== deleteTarget._id));
      setNotice('Feedback deleted.');
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to delete feedback');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="My feedback"
        description="Manage the reviews and suggestions you have shared."
        actions={
          <>
            <ButtonLink to="/feedback" variant="secondary" icon={ChatBubbleLeftRightIcon}>
              Community feedback
            </ButtonLink>
            <ButtonLink to="/feedback" icon={PlusIcon}>
              New feedback
            </ButtonLink>
          </>
        }
      />

      <Card className="mt-6">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-sm lg:flex-1"
            placeholder="Search your feedback…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search your feedback"
          />
          <SegmentedControl
            options={tabs}
            value={filter}
            onChange={handleFilterChange}
            label="Filter your feedback"
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
      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading ? (
          <PageSkeleton />
        ) : feedback.length === 0 ? (
          <EmptyState
            icon={StarOutlineIcon}
            title={search || filter !== 'all' ? 'No feedback matches these filters' : 'You have not shared feedback yet'}
            description={
              search || filter !== 'all'
                ? 'Try clearing the search or switching the filter.'
                : 'Tell the community what you liked — or what could be better — about a club or event.'
            }
            action={
              search || filter !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    handleFilterChange('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <ButtonLink to="/feedback" icon={PlusIcon}>
                  Share feedback
                </ButtonLink>
              )
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
                      <Badge variant={statusVariant[item.status] || 'neutral'}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                    <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    You · submitted {timeAgo(item.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  icon={TrashIcon}
                  onClick={() => setDeleteTarget(item)}
                  className="text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:text-rose-400 dark:hover:bg-danger-600/10"
                >
                  Delete
                </Button>
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

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3 text-xs text-ink-400 dark:border-ink-800 dark:text-ink-500">
                <span>{item.helpfulVotes || 0} people found this helpful</span>
                <span>Last updated {timeAgo(item.updatedAt || item.createdAt)}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Page {page} of {totalPages}
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
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-feedback-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-rose-400">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2
              id="delete-feedback-title"
              className="mt-4 text-lg font-semibold text-ink-900 dark:text-white"
            >
              Delete this feedback?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              It will be removed from the community page. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Delete feedback
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MyFeedback;
