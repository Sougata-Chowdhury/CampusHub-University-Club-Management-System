import React, { useEffect, useState } from 'react';
import {
  MegaphoneIcon,
  TrashIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { announcementService } from '../services/announcementService';
import { resolveAssetUrl } from '../services/api';
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
  StatCard,
} from '../ui';

const timeAgo = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const hours = (now - date) / (1000 * 60 * 60);
  if (hours < 1) return `${Math.max(1, Math.floor((now - date) / 60000))}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchAllAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await announcementService.getAllAnnouncementsForAdmin(currentPage, 20);
      setAnnouncements(response.announcements || []);
      setPagination(response.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget._id);
    setError('');
    try {
      await announcementService.deleteAnnouncement(deleteTarget._id);
      setAnnouncements((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setSuccess('Announcement removed from the platform.');
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.');
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Announcements"
        description="Moderate every club announcement posted across the platform."
        actions={
          <Button variant="secondary" icon={ArrowPathIcon} onClick={fetchAllAnnouncements} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={pagination?.totalItems || 0} icon={MegaphoneIcon} accent="brand" />
        <StatCard
          label="Active"
          value={announcements.filter((item) => item.isActive !== false).length}
          icon={MegaphoneIcon}
          accent="success"
        />
        <StatCard
          label="Removed"
          value={announcements.filter((item) => item.isActive === false).length}
          icon={TrashIcon}
          accent="danger"
        />
        <StatCard label="On this page" value={announcements.length} icon={ClockIcon} accent="warning" />
      </div>

      <Card>
        <CardHeader title="All announcements" description="Newest first, including soft-deleted posts." />
        <CardBody className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-[10px] bg-ink-100 dark:bg-ink-800" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={MegaphoneIcon}
              title="No announcements yet"
              description="Club announcements will appear here for moderation."
            />
          ) : (
            announcements.map((announcement) => {
              const author = announcement.createdBy
                ? `${announcement.createdBy.firstName || ''} ${announcement.createdBy.lastName || ''}`.trim() ||
                  announcement.createdBy.email
                : 'Unknown';
              return (
                <article
                  key={announcement._id}
                  className="rounded-[10px] border border-ink-200 p-4 dark:border-ink-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar name={author} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink-900 dark:text-white">{author}</p>
                          {announcement.club?.name ? (
                            <Badge variant="brand">{announcement.club.name}</Badge>
                          ) : null}
                          <Badge variant={announcement.isActive === false ? 'danger' : 'success'} dot>
                            {announcement.isActive === false ? 'Removed' : 'Active'}
                          </Badge>
                          <span className="text-xs text-ink-400 dark:text-ink-500">
                            {timeAgo(announcement.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                          {announcement.message}
                        </p>
                        {announcement.image ? (
                          <img
                            src={resolveAssetUrl(announcement.image)}
                            alt=""
                            loading="lazy"
                            className="mt-3 max-h-72 w-full rounded-[10px] border border-ink-200 object-cover dark:border-ink-800"
                          />
                        ) : null}
                        <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">
                          #{announcement._id.slice(-8)} · {announcement.likes || 0} likes
                        </p>
                      </div>
                    </div>
                    <Button
                      size="xs"
                      variant="danger-soft"
                      icon={TrashIcon}
                      disabled={announcement.isActive === false || deleting === announcement._id}
                      onClick={() => setDeleteTarget(announcement)}
                    >
                      Remove
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </CardBody>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm text-ink-500 dark:border-ink-800 dark:text-ink-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={!pagination?.hasPrev}
                onClick={() => {
                  setCurrentPage((page) => Math.max(1, page - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!pagination?.hasNext}
                onClick={() => {
                  setCurrentPage((page) => page + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-announcement-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <h2 id="delete-announcement-title" className="text-lg font-semibold text-ink-900 dark:text-white">
              Remove this announcement?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              The post disappears from student feeds immediately. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={!!deleting}>
                Cancel
              </Button>
              <Button variant="danger" loading={deleting === deleteTarget._id} onClick={handleDelete}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminAnnouncements;
