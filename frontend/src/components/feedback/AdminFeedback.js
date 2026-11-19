import React, { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  HandThumbUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import adminService from '../../services/adminService';
import feedbackService from '../../services/feedbackService';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Select,
  Skeleton,
  StatCard,
  Textarea,
} from '../../ui';

const statusVariant = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'danger',
};

const statusLabel = {
  pending: 'Pending',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const relativeTime = (dateString) => {
  if (!dateString) return '-';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Rating = ({ value = 0 }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        className={`h-3.5 w-3.5 ${
          star <= value ? 'text-warning-500' : 'text-ink-300 dark:text-ink-600'
        }`}
        aria-hidden="true"
      />
    ))}
  </span>
);

const AdminFeedback = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ category: '', targetType: '', rating: '' });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: rowsPerPage,
        ...filters,
      };
      if (activeTab !== 'all') params.status = activeTab;

      const response = await adminService.getAllFeedback(params);
      if (response && Array.isArray(response.feedback)) {
        setFeedback(response.feedback);
        setTotal(response.total || 0);
      } else if (response && Array.isArray(response.data)) {
        setFeedback(response.data);
        setTotal(response.total || response.data.length);
      } else {
        setFeedback([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load feedback.');
      setFeedback([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await feedbackService.getFeedbackStats();
      setStats(response?.data || response || null);
    } catch {
      /* stats are supplementary */
    }
  };

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, rowsPerPage, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshAll = () => {
    fetchFeedback();
    fetchStats();
  };

  const openStatusDialog = (item) => {
    setSelectedFeedback(item);
    setSelectedStatus(item.status);
    setAdminResponse(item.adminResponse || '');
    setError('');
  };

  const closeStatusDialog = () => {
    if (updateLoading) return;
    setSelectedFeedback(null);
    setSelectedStatus('');
    setAdminResponse('');
  };

  const confirmStatusUpdate = async () => {
    if (!selectedFeedback) return;
    if (!selectedStatus) {
      setError('Choose a status before saving.');
      return;
    }
    setUpdateLoading(true);
    setError('');
    try {
      await adminService.updateFeedbackStatus(selectedFeedback._id, {
        status: selectedStatus,
        adminResponse: adminResponse.trim() || undefined,
      });
      setSuccess('Feedback status updated.');
      setSelectedFeedback(null);
      setSelectedStatus('');
      setAdminResponse('');
      await Promise.all([fetchFeedback(), fetchStats()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update feedback.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const changeFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const pendingPercentage =
    stats?.totalFeedback > 0 ? Math.round((stats.pendingReview / stats.totalFeedback) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Feedback moderation"
        description="Read what students think and respond to the feedback that needs a human decision."
        actions={
          <Button variant="secondary" icon={ArrowPathIcon} onClick={refreshAll} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total feedback" value={stats.totalFeedback ?? 0} icon={ChatBubbleLeftRightIcon} accent="brand" />
          <StatCard
            label="Average rating"
            value={Number(stats.averageRating || 0).toFixed(1)}
            icon={StarIcon}
            accent="warning"
            hint="out of 5 stars"
          />
          <StatCard
            label="Pending review"
            value={stats.pendingReview ?? 0}
            icon={ClockIcon}
            accent="warning"
            hint={`${pendingPercentage}% of total`}
          />
          <StatCard
            label="High rated"
            value={stats.highRatedFeedback ?? 0}
            icon={ArrowTrendingUpIcon}
            accent="success"
            hint="4–5 stars"
          />
          <StatCard
            label="Recent"
            value={stats.recentFeedback ?? 0}
            icon={CheckCircleIcon}
            accent="sky"
            hint="last 30 days"
          />
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Feedback inbox"
          description="Filter by status, category, target or rating."
          action={
            <SegmentedControl
              label="Feedback status"
              value={activeTab}
              onChange={(value) => {
                setActiveTab(value);
                setPage(1);
              }}
              options={tabs}
            />
          }
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={filters.category}
              onChange={(event) => changeFilter('category', event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {['general', 'organization', 'communication', 'facilities', 'content', 'instructor', 'other'].map((category) => (
                <option key={category} value={category}>
                  {category[0].toUpperCase() + category.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              value={filters.targetType}
              onChange={(event) => changeFilter('targetType', event.target.value)}
              aria-label="Filter by target"
            >
              <option value="">All targets</option>
              {['club', 'event', 'announcement', 'general', 'course', 'instructor', 'facility'].map((target) => (
                <option key={target} value={target}>
                  {target[0].toUpperCase() + target.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              value={filters.rating}
              onChange={(event) => changeFilter('rating', event.target.value)}
              aria-label="Filter by rating"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({ category: '', targetType: '', rating: '' });
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <EmptyState
              icon={ChatBubbleLeftRightIcon}
              title="No feedback found"
              description="Try a different filter or wait for students to share their thoughts."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                  <tr>
                    <th className="px-3 py-3 font-medium">Student</th>
                    <th className="px-3 py-3 font-medium">Rating</th>
                    <th className="px-3 py-3 font-medium">Target</th>
                    <th className="px-3 py-3 font-medium">Comment</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">When</th>
                    <th className="px-3 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {feedback.map((item) => {
                    const name = item.isAnonymous
                      ? 'Anonymous'
                      : item.userId?.name ||
                        `${item.userId?.firstName || ''} ${item.userId?.lastName || ''}`.trim() ||
                        'Unknown student';
                    return (
                      <tr key={item._id} className="align-top hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={name} src={item.userId?.profilePicture} size="xs" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink-900 dark:text-white">{name}</p>
                              {!item.isAnonymous && item.userId?.email ? (
                                <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                                  {item.userId.email}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Rating value={item.rating} />
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium capitalize text-ink-900 dark:text-white">
                            {item.targetType || 'general'}
                          </p>
                          {item.targetInfo ? (
                            <p className="max-w-[160px] truncate text-xs text-ink-500 dark:text-ink-400">
                              {item.targetInfo.name || item.targetInfo.title}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <p
                            className="max-w-[260px] truncate text-ink-600 dark:text-ink-300"
                            title={item.comment}
                          >
                            {item.comment}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400 dark:text-ink-500">
                            <HandThumbUpIcon className="h-3 w-3" aria-hidden="true" />
                            {item.helpfulVotes || 0} helpful
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={statusVariant[item.status] || 'neutral'} dot>
                            {statusLabel[item.status] || item.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-xs text-ink-500 dark:text-ink-400">
                          {relativeTime(item.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button size="xs" variant="secondary" onClick={() => openStatusDialog(item)}>
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm text-ink-500 dark:border-ink-800 dark:text-ink-400">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="h-8 w-auto py-0"
            >
              {[10, 20, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <span>
              · {total} {total === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {selectedFeedback ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-review-title"
        >
          <div className="w-full max-w-lg rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <h2 id="feedback-review-title" className="text-lg font-semibold text-ink-900 dark:text-white">
              Review feedback
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Rating value={selectedFeedback.rating} />
              <Badge variant={statusVariant[selectedFeedback.status] || 'neutral'}>
                {statusLabel[selectedFeedback.status] || selectedFeedback.status}
              </Badge>
            </div>
            <p className="mt-3 rounded-[10px] bg-ink-50 px-3 py-2.5 text-sm text-ink-700 dark:bg-ink-800 dark:text-ink-200">
              {selectedFeedback.comment}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200" htmlFor="feedback-status">
                  Status
                </label>
                <Select
                  id="feedback-status"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200" htmlFor="feedback-response">
                  Response to student <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <Textarea
                  id="feedback-response"
                  rows={4}
                  value={adminResponse}
                  onChange={(event) => setAdminResponse(event.target.value)}
                  placeholder="Explain the decision or what will change…"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeStatusDialog} disabled={updateLoading}>
                Cancel
              </Button>
              <Button loading={updateLoading} onClick={confirmStatusUpdate}>
                Save review
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminFeedback;
