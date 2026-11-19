import React, { useEffect, useRef, useState } from 'react';
import {
  ChatBubbleLeftIcon,
  ClockIcon,
  HeartIcon,
  PencilIcon,
  PlusIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { announcementService } from '../services/announcementService';
import { resolveAssetUrl } from '../services/api';
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Skeleton,
  Textarea,
} from '../ui';
import ReportButton from './ReportButton';

const PAGE_SIZE = 10;

const relativeTime = (value) => {
  const date = new Date(value);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);

  if (diffHours < 1) {
    const minutes = Math.max(1, Math.floor((now - date) / (1000 * 60)));
    return `${minutes}m ago`;
  }
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const Announcements = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [announcements, setAnnouncements] = useState([]);
  const [myAnnouncements, setMyAnnouncements] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [myPagination, setMyPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [liking, setLiking] = useState({});
  const [editId, setEditId] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const noticeTimer = useRef(null);

  const userId = user?._id || user?.id;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (tab === 'all') {
          const data = await announcementService.getAllAnnouncements(page, PAGE_SIZE);
          if (!active) return;
          setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : []);
          setPagination(data?.pagination || null);
        } else {
          const data = await announcementService.getMyAnnouncements(page, PAGE_SIZE);
          if (!active) return;
          setMyAnnouncements(Array.isArray(data?.announcements) ? data.announcements : []);
          setMyPagination(data?.pagination || null);
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load announcements');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tab, page]);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  const showNotice = (message) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 4000);
  };

  const current = tab === 'all' ? announcements : myAnnouncements;
  const currentPagination = tab === 'all' ? pagination : myPagination;

  const setCurrent = (updater) => {
    if (tab === 'all') setAnnouncements(updater);
    else setMyAnnouncements(updater);
  };

  const isOwner = (announcement) => {
    const author = announcement.createdBy;
    if (!userId || !author) return false;
    return (author._id || author.id || author) === userId;
  };

  const handleLike = async (announcement) => {
    if (liking[announcement._id]) return;
    setLiking((currentLikes) => ({ ...currentLikes, [announcement._id]: true }));
    try {
      const result = await announcementService.toggleLike(announcement._id);
      setCurrent((list) =>
        list.map((item) =>
          item._id === announcement._id
            ? { ...item, likes: result.likes, liked: result.liked }
            : item,
        ),
      );
    } catch (err) {
      setError(err.message || 'Failed to update like');
    } finally {
      setLiking((currentLikes) => ({ ...currentLikes, [announcement._id]: false }));
    }
  };

  const startEdit = (announcement) => {
    setEditId(announcement._id);
    setEditMessage(announcement.message);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditMessage('');
  };

  const saveEdit = async (announcementId) => {
    if (!editMessage.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = await announcementService.updateAnnouncement(announcementId, {
        message: editMessage.trim(),
      });
      setCurrent((list) =>
        list.map((item) =>
          item._id === announcementId ? { ...item, message: updated.message } : item,
        ),
      );
      cancelEdit();
      showNotice('Announcement updated.');
    } catch (err) {
      setError(err.message || 'Failed to update announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await announcementService.deleteAnnouncement(deleteTarget._id);
      setCurrent((list) => list.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      showNotice('Announcement deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  const changeTab = (nextTab) => {
    setTab(nextTab);
    setPage(1);
    cancelEdit();
  };

  const tabs = [
    { value: 'all', label: 'All announcements' },
    { value: 'my', label: 'Mine' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Announcements"
        description="Updates, news and notices from the clubs you follow."
        actions={<ButtonLink to="/create-announcement" icon={PlusIcon}>New announcement</ButtonLink>}
      />

      <div className="mt-6">
        <SegmentedControl options={tabs} value={tab} onChange={changeTab} label="Announcement view" />
      </div>

      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" className="mt-4" title="Something went wrong">
          {error}
        </Alert>
      ) : null}

      <div className="mt-5 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-5/6" />
            </Card>
          ))
        ) : current.length === 0 ? (
          <EmptyState
            icon={SpeakerWaveIcon}
            title={tab === 'all' ? 'No announcements yet' : 'You have not posted an announcement'}
            description={
              tab === 'all'
                ? 'Check back later for updates from campus clubs.'
                : 'Share news, reminders and updates with your club members.'
            }
            action={
              tab === 'my' ? (
                <ButtonLink to="/create-announcement" icon={PlusIcon}>
                  Create announcement
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          current.map((announcement) => {
            const author = announcement.createdBy;
            const authorName =
              `${author?.firstName || ''} ${author?.lastName || ''}`.trim() ||
              author?.email ||
              'Club member';
            const owner = isOwner(announcement);

            return (
              <Card key={announcement._id} className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={authorName} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">
                        {authorName}
                      </p>
                      {announcement.club?.name ? (
                        <>
                          <span className="text-ink-300 dark:text-ink-600">·</span>
                          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                            {announcement.club.name}
                          </p>
                        </>
                      ) : null}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                      <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {relativeTime(announcement.createdAt)}
                      {announcement.club?.category ? ` · ${announcement.club.category}` : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {owner ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(announcement)}
                          aria-label="Edit announcement"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(announcement)}
                          aria-label="Delete announcement"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-600/10 dark:hover:text-rose-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <ReportButton
                        reportType="announcement"
                        reportTargetId={announcement._id}
                        reportTargetInfo={{
                          title:
                            announcement.message?.length > 50
                              ? `"${announcement.message.slice(0, 50)}..."`
                              : `"${announcement.message || 'Announcement'}"`,
                          description: announcement.message,
                          club: announcement.club?.name,
                          author: authorName,
                        }}
                        variant="icon"
                        size="small"
                        tooltip="Report this announcement"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {editId === announcement._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editMessage}
                        onChange={(event) => setEditMessage(event.target.value)}
                        rows={4}
                        aria-label="Edit announcement message"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          loading={saving}
                          disabled={!editMessage.trim()}
                          onClick={() => saveEdit(announcement._id)}
                        >
                          Save changes
                        </Button>
                        <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                      {announcement.message}
                    </p>
                  )}
                </div>

                {announcement.image ? (
                  <div className="mt-4 overflow-hidden rounded-[10px] border border-ink-200 dark:border-ink-800">
                    <img
                      src={resolveAssetUrl(announcement.image)}
                      alt=""
                      className="max-h-96 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}

                <div className="mt-4 flex items-center gap-4 border-t border-ink-100 pt-3 dark:border-ink-800">
                  <button
                    type="button"
                    onClick={() => handleLike(announcement)}
                    disabled={liking[announcement._id]}
                    aria-label={announcement.liked ? 'Unlike' : 'Like'}
                    aria-pressed={Boolean(announcement.liked)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      announcement.liked
                        ? 'bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-rose-300'
                        : 'text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800'
                    }`}
                  >
                    {announcement.liked ? (
                      <HeartSolidIcon className="h-4 w-4" />
                    ) : (
                      <HeartIcon className="h-4 w-4" />
                    )}
                    {announcement.likes || 0}
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-400 dark:text-ink-500">
                    <ChatBubbleLeftIcon className="h-4 w-4" aria-hidden="true" />
                    Announcement
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {currentPagination && currentPagination.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Page {page} of {currentPagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!currentPagination.hasPrev}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!currentPagination.hasNext}
              onClick={() => setPage((value) => value + 1)}
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
          aria-labelledby="delete-announcement-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-rose-400">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2
              id="delete-announcement-title"
              className="mt-4 text-lg font-semibold text-ink-900 dark:text-white"
            >
              Delete this announcement?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              It will be removed from the feed for everyone. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Announcements;
