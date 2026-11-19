import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  FunnelIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import reportService from '../services/reportService';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Skeleton,
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

const pretty = (value = '') =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const timeAgo = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
};

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ type: '', status: '', category: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await reportService.getUserReports(page, 10, filters);
      setReports(Array.isArray(response?.reports) ? response.reports : []);
      setTotalPages(response?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load your reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '', category: '' });
    setPage(1);
  };

  const hasFilters = Boolean(filters.type || filters.status || filters.category);

  return (
    <>
      <PageHeader
        eyebrow="Safety"
        title="My reports"
        description="Track the reports you have submitted and how the moderation team responded."
        actions={
          <ButtonLink to="/dashboard" variant="secondary">
            Dashboard
          </ButtonLink>
        }
      />

      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <FunnelIcon className="h-5 w-5 text-ink-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Filters</h2>
          {hasFilters ? (
            <Button variant="ghost" size="xs" onClick={clearFilters} className="ml-auto">
              Clear filters
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Type" htmlFor="report-type">
            <Select
              id="report-type"
              value={filters.type}
              onChange={(event) => updateFilter('type', event.target.value)}
            >
              <option value="">All types</option>
              {reportService.getReportTypes().map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="report-status">
            <Select
              id="report-status"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="">All statuses</option>
              {reportService.getReportStatuses().map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" htmlFor="report-category">
            <Select
              id="report-category"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            >
              <option value="">All categories</option>
              {reportService.getReportCategories().map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>
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
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))
        ) : reports.length === 0 ? (
          <EmptyState
            icon={DocumentTextIcon}
            title={hasFilters ? 'No reports match these filters' : 'No reports yet'}
            description={
              hasFilters
                ? 'Try clearing the filters to see everything you have submitted.'
                : 'If you report an event, club or announcement, its progress will show up here.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <ButtonLink to="/browse-events" variant="secondary">
                  Browse events
                </ButtonLink>
              )
            }
          />
        ) : (
          reports.map((report) => {
            const id = report.id || report._id;
            const open = Boolean(expanded[id]);
            return (
              <Card key={id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                        {pretty(report.type)} report
                      </h3>
                      <Badge variant={statusVariant[report.status] || 'neutral'}>
                        {statusLabel[report.status] || pretty(report.status || '')}
                      </Badge>
                      {report.priority >= 4 ? <Badge variant="danger">High priority</Badge> : null}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                      <span>{pretty(report.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span>Submitted {timeAgo(report.createdAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>Priority {report.priority || 1}/5</span>
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="xs"
                    icon={open ? ChevronUpIcon : ChevronDownIcon}
                    onClick={() => setExpanded((current) => ({ ...current, [id]: !current[id] }))}
                  >
                    {open ? 'Hide details' : 'View details'}
                  </Button>
                </div>

                {open ? (
                  <div className="mt-4 space-y-4 border-t border-ink-100 pt-4 dark:border-ink-800">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Description</p>
                      <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{report.description}</p>
                    </div>

                    {report.additionalInfo ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                          Additional information
                        </p>
                        <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                          {report.additionalInfo}
                        </p>
                      </div>
                    ) : null}

                    {report.attachments?.length ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                          Attachments ({report.attachments.length})
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {report.attachments.map((attachment, index) => (
                            <span
                              key={`${id}-attachment-${index}`}
                              className="inline-flex items-center gap-1.5 rounded-[8px] border border-ink-200 bg-ink-50 px-2 py-1 text-xs text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
                            >
                              <PaperClipIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              Attachment {index + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {report.reviewedBy ? (
                      <div className="rounded-[10px] border border-ink-200 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-800/40">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                          Moderation response
                        </p>
                        <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                          Reviewed by {report.reviewedBy.name || 'the moderation team'}
                          {report.reviewedAt ? ` on ${reportService.formatDate(report.reviewedAt)}` : ''}
                        </p>
                        {report.actionTaken ? (
                          <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
                            <span className="font-medium">Action taken:</span> {report.actionTaken}
                          </p>
                        ) : null}
                        {report.adminNotes ? (
                          <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
                            <span className="font-medium">Admin notes:</span> {report.adminNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-500 dark:text-ink-400">
                        The moderation team has not responded yet.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400 dark:text-ink-500">
                      <span>Report ID: {id}</span>
                      <span>Last updated {reportService.formatDate(report.updatedAt || report.createdAt)}</span>
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })
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
    </>
  );
};

export default MyReports;
