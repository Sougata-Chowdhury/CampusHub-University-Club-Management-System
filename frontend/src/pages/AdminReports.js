import React, { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import reportService from '../services/reportService';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Select,
  StatCard,
  Textarea,
} from '../ui';

const statusVariant = {
  pending: 'warning',
  under_review: 'info',
  action_taken: 'success',
  resolved: 'success',
  dismissed: 'danger',
};

const statusLabel = {
  pending: 'Pending',
  under_review: 'Under review',
  action_taken: 'Action taken',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [filters, setFilters] = useState({ type: '', status: '', category: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionReport, setActionReport] = useState(null);
  const [actionStatus, setActionStatus] = useState('under_review');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteReport, setDeleteReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const queryFilters = { ...filters };
      if (selectedTab === 'pending' || selectedTab === 'under_review') {
        queryFilters.status = selectedTab;
      }

      const response = await reportService.getAllReports(page, 20, queryFilters);
      let rows = response.reports || [];
      if (selectedTab === 'high') {
        rows = rows.filter((report) => report.priority >= 4);
      }
      setReports(rows);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await reportService.getReportStats();
      setStats(data);
    } catch {
      /* stats are supplementary */
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, selectedTab]);

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshAll = () => {
    fetchReports();
    fetchStats();
  };

  const openAction = (report, status) => {
    setActionReport(report);
    setActionStatus(status);
    setActionNotes('');
  };

  const submitAction = async () => {
    if (!actionReport || !actionStatus) return;
    setActionLoading(true);
    setError('');
    try {
      await reportService.updateReportStatus(actionReport.id, actionStatus, actionNotes, actionNotes);
      setSuccess(`Report marked as ${statusLabel[actionStatus] || actionStatus}.`);
      setActionReport(null);
      refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update the report.');
    } finally {
      setActionLoading(false);
    }
  };

  const takeDirectAction = async (report) => {
    setError('');
    try {
      await reportService.takeActionOnReportedItem(report.id);
      setSuccess('The reported content was removed and the reporter was notified.');
      refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to take action on the reported item.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteReport) return;
    setActionLoading(true);
    setError('');
    try {
      await reportService.deleteReport(deleteReport.id);
      setSuccess('Report deleted.');
      setDeleteReport(null);
      refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete the report.');
    } finally {
      setActionLoading(false);
    }
  };

  const changeFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const tabs = [
    { value: 'all', label: 'All', count: stats?.totalReports },
    { value: 'pending', label: 'Pending', count: stats?.reportsByStatus?.pending },
    { value: 'under_review', label: 'Review', count: stats?.reportsByStatus?.under_review },
    { value: 'high', label: 'High priority', count: reports.filter((report) => report.priority >= 4).length },
  ];

  const actionOptions = [
    { value: 'under_review', label: 'Under review' },
    { value: 'action_taken', label: 'Action taken' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'pending', label: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Community reports"
        description="Investigate flagged clubs, events and announcements before they harm the community."
        actions={
          <Button variant="secondary" icon={ArrowPathIcon} onClick={refreshAll} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total reports" value={stats.totalReports} icon={FlagIcon} accent="brand" />
          <StatCard label="Pending review" value={stats.pendingReports} icon={ExclamationTriangleIcon} accent="warning" />
          <StatCard label="Resolved" value={stats.resolvedReports} icon={CheckCircleIcon} accent="success" />
          <StatCard label="Avg. resolution" value={`${Math.round(stats.averageResolutionTime || 0)}h`} icon={ShieldCheckIcon} accent="sky" />
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Reports"
          description="Use the tabs to focus on what needs attention."
          action={<SegmentedControl label="Report filter" value={selectedTab} onChange={(value) => { setSelectedTab(value); setPage(1); }} options={tabs} />}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={filters.type}
              onChange={(event) => changeFilter('type', event.target.value)}
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              {reportService.getReportTypes().map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            <Select
              value={filters.category}
              onChange={(event) => changeFilter('category', event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {reportService.getReportCategories().map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
            <Select
              value={filters.status}
              onChange={(event) => changeFilter('status', event.target.value)}
              aria-label="Filter by status"
              disabled={selectedTab === 'pending' || selectedTab === 'under_review'}
            >
              <option value="">All statuses</option>
              {reportService.getReportStatuses().map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-[10px] bg-ink-100 dark:bg-ink-800" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={FlagIcon}
              title="No reports found"
              description="Nothing matches the current filters. That is usually good news."
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className={`rounded-[10px] border p-4 ${
                    report.priority >= 4
                      ? 'border-danger-200 bg-danger-50/40 dark:border-danger-600/30 dark:bg-danger-600/5'
                      : 'border-ink-200 dark:border-ink-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                      {report.type ? `${report.type[0].toUpperCase()}${report.type.slice(1)} report` : 'Report'}
                    </h3>
                    <Badge variant={statusVariant[report.status] || 'neutral'}>
                      {statusLabel[report.status] || report.status}
                    </Badge>
                    {report.priority >= 4 ? (
                      <Badge variant="danger" dot>
                        Priority {report.priority}
                      </Badge>
                    ) : null}
                    <span className="ml-auto text-xs text-ink-400 dark:text-ink-500">
                      {timeAgo(report.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{report.description}</p>

                  <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">
                    {(report.category || '').replace(/_/g, ' ')} · reported by{' '}
                    {report.reportedBy?.name || report.reportedBy?.email || 'a student'}
                  </p>

                  {report.targetInfo && !report.targetInfo.deleted ? (
                    <p className="mt-2 rounded-md bg-ink-100 px-3 py-2 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                      Reported item:{' '}
                      <span className="font-medium">
                        {report.targetInfo.title || report.targetInfo.name || report.targetInfo.id}
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.status === 'pending' ? (
                      <>
                        <Button size="xs" variant="secondary" onClick={() => openAction(report, 'under_review')}>
                          Start review
                        </Button>
                        <Button size="xs" variant="danger" icon={NoSymbolIcon} onClick={() => takeDirectAction(report)}>
                          Remove content
                        </Button>
                      </>
                    ) : null}
                    {report.status === 'under_review' ? (
                      <>
                        <Button size="xs" icon={CheckCircleIcon} onClick={() => openAction(report, 'resolved')}>
                          Mark resolved
                        </Button>
                        <Button size="xs" variant="secondary" onClick={() => openAction(report, 'dismissed')}>
                          Dismiss
                        </Button>
                      </>
                    ) : null}
                    <Button size="xs" variant="ghost" onClick={() => openAction(report, report.status)}>
                      Update status
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={TrashIcon}
                      className="text-danger-600 hover:bg-danger-50 dark:text-rose-400 dark:hover:bg-danger-600/10"
                      onClick={() => setDeleteReport(report)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardBody>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm text-ink-500 dark:border-ink-800 dark:text-ink-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {actionReport ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-action-title"
        >
          <div className="w-full max-w-lg rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <h2 id="report-action-title" className="text-lg font-semibold text-ink-900 dark:text-white">
              Update report status
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              {actionReport.type} · {actionReport.category?.replace(/_/g, ' ')}
            </p>
            <div className="mt-4 space-y-3">
              <Select
                value={actionStatus}
                onChange={(event) => setActionStatus(event.target.value)}
                aria-label="New status"
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Textarea
                rows={4}
                value={actionNotes}
                onChange={(event) => setActionNotes(event.target.value)}
                placeholder="Notes for the audit trail and the reporter…"
                aria-label="Admin notes"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setActionReport(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button loading={actionLoading} onClick={submitAction}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteReport ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-report-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <h2 id="delete-report-title" className="text-lg font-semibold text-ink-900 dark:text-white">
              Delete this report?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              The reporter is told the report was investigated and found to be incorrect. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteReport(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="danger" loading={actionLoading} onClick={confirmDelete}>
                Delete report
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminReports;
