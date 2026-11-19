import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { clubService } from '../services/clubService';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SegmentedControl,
  SkeletonCard,
} from '../ui';

const statusVariant = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

const statusLabel = {
  approved: 'Approved',
  pending: 'Pending approval',
  rejected: 'Rejected',
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

const MyClubs = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.message || '');
  const [createdClubs, setCreatedClubs] = useState([]);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('created');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [myClubs, myApplications] = await Promise.all([
          clubService.getMyClubs(),
          clubService.getUserApplications(),
        ]);
        if (!active) return;
        setCreatedClubs(Array.isArray(myClubs?.createdClubs) ? myClubs.createdClubs : []);
        setJoinedClubs(Array.isArray(myClubs?.joinedClubs) ? myClubs.joinedClubs : []);
        setApplications(Array.isArray(myApplications) ? myApplications : []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load your clubs');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const createdIds = useMemo(
    () => new Set(createdClubs.map((club) => club._id)),
    [createdClubs],
  );

  const memberClubs = useMemo(
    () =>
      joinedClubs.filter((club) => {
        if (createdIds.has(club._id)) return false;
        const ownerId = club.createdBy?._id || club.createdBy;
        return ownerId !== userId;
      }),
    [joinedClubs, createdIds, userId],
  );

  const pendingApplications = applications.filter((application) => application.status === 'pending');

  const counts = {
    created: createdClubs.length,
    joined: memberClubs.length,
    applications: applications.length,
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError('');
    try {
      await clubService.deleteClub(deleteTarget._id);
      setCreatedClubs((current) => current.filter((club) => club._id !== deleteTarget._id));
      setApplications((current) => current.filter((application) => application.club?._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err.message || 'Failed to delete club');
    } finally {
      setDeleting(false);
    }
  };

  const handleWithdraw = async (clubId) => {
    setWithdrawing(clubId);
    setActionError('');
    try {
      await clubService.withdrawApplication(clubId);
      setApplications((current) => current.filter((application) => application.club?._id !== clubId));
    } catch (err) {
      setActionError(err.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(null);
    }
  };

  const tabs = [
    { value: 'created', label: 'Created', count: counts.created },
    { value: 'joined', label: 'Joined', count: counts.joined },
    { value: 'applications', label: 'Applications', count: counts.applications },
  ];

  const renderCreated = () => {
    if (createdClubs.length === 0) {
      return (
        <EmptyState
          icon={UserGroupIcon}
          title="You have not created a club yet"
          description="Start a club, invite classmates and once an admin approves it you can publish events and manage members."
          action={<ButtonLink to="/create-club" icon={PlusIcon}>Create a club</ButtonLink>}
        />
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {createdClubs.map((club) => (
          <Card key={club._id} hover className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <Avatar name={club.name} src={club.logoUrl} size="lg" className="rounded-[12px]" />
              <Badge variant={statusVariant[club.status] || 'neutral'}>
                {statusLabel[club.status] || club.status || 'Unknown'}
              </Badge>
            </div>

            <h3 className="mt-4 truncate text-base font-semibold text-ink-900 dark:text-white">
              <Link to={`/clubs/${club._id}`} className="hover:text-brand-600 dark:hover:text-brand-300">
                {club.name}
              </Link>
            </h3>
            <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-ink-500 dark:text-ink-400">
              {club.description || 'No description provided yet.'}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-500 dark:text-ink-400">
              <span className="flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                {club.members?.length || 0} member{(club.members?.length || 0) === 1 ? '' : 's'}
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                {club.memberApplications?.length || 0} application
                {(club.memberApplications?.length || 0) === 1 ? '' : 's'}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-ink-400 dark:text-ink-500">
              Created {formatDate(club.createdAt)}
            </p>

            <div className="mt-auto space-y-2 pt-5">
              <div className="flex gap-2">
                {club.status === 'approved' ? (
                  <ButtonLink
                    to={`/manage-club/${club._id}`}
                    size="sm"
                    fullWidth
                    icon={Cog6ToothIcon}
                  >
                    Manage
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    to={`/clubs/${club._id}`}
                    size="sm"
                    variant="secondary"
                    fullWidth
                  >
                    {club.status === 'pending' ? 'Awaiting approval' : 'View status'}
                  </ButtonLink>
                )}
                <ButtonLink to={`/clubs/${club._id}`} size="sm" variant="secondary" fullWidth>
                  View
                </ButtonLink>
              </div>

              {club.status === 'approved' ? (
                <div className="flex gap-2">
                  <Link
                    to={`/create-event?clubId=${club._id}`}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-ink-200 px-2 text-xs font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                  >
                    <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    New event
                  </Link>
                  <Link
                    to={`/club-events/${club._id}`}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-ink-200 px-2 text-xs font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                  >
                    <CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    Events
                  </Link>
                </div>
              ) : null}

              <Button
                variant="ghost"
                size="xs"
                fullWidth
                icon={TrashIcon}
                onClick={() => setDeleteTarget(club)}
                className="text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:text-rose-400 dark:hover:bg-danger-600/10"
              >
                Delete club
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderJoined = () => {
    if (memberClubs.length === 0) {
      return (
        <EmptyState
          icon={UserGroupIcon}
          title="You have not joined any clubs yet"
          description="Browse approved clubs and apply to join one that matches your interests."
          action={<ButtonLink to="/browse-clubs">Browse clubs</ButtonLink>}
        />
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {memberClubs.map((club) => (
          <Card key={club._id} hover className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <Avatar name={club.name} src={club.logoUrl} size="lg" className="rounded-[12px]" />
              <Badge variant="brand">{club.category || 'General'}</Badge>
            </div>
            <h3 className="mt-4 truncate text-base font-semibold text-ink-900 dark:text-white">
              <Link to={`/clubs/${club._id}`} className="hover:text-brand-600 dark:hover:text-brand-300">
                {club.name}
              </Link>
            </h3>
            <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-ink-500 dark:text-ink-400">
              {club.description || 'No description provided yet.'}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              <UserGroupIcon className="h-4 w-4 text-ink-400" aria-hidden="true" />
              {club.members?.length || 0} member{(club.members?.length || 0) === 1 ? '' : 's'}
            </p>
            <div className="mt-auto flex gap-2 pt-5">
              <ButtonLink to={`/clubs/${club._id}`} variant="secondary" size="sm" fullWidth>
                View club
              </ButtonLink>
              <ButtonLink to={`/club-events/${club._id}`} size="sm" fullWidth icon={CalendarDaysIcon}>
                Events
              </ButtonLink>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderApplications = () => {
    if (applications.length === 0) {
      return (
        <EmptyState
          icon={ClockIcon}
          title="No applications yet"
          description="When you apply to join a club, you can track its status here."
          action={<ButtonLink to="/browse-clubs">Find a club</ButtonLink>}
        />
      );
    }

    return (
      <div className="space-y-3">
        {applications.map((application) => {
          const club = application.club || {};
          const pending = application.status === 'pending';
          return (
            <Card key={application._id || `${club._id}-${application.appliedAt}`} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={club.name} size="md" className="rounded-[10px]" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/clubs/${club._id}`}
                    className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
                  >
                    {club.name || 'Club'}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                    {club.category ? `${club.category} · ` : ''}
                    Applied {formatDate(application.appliedAt)}
                  </p>
                </div>
                <Badge variant={statusVariant[application.status] || 'neutral'}>
                  {statusLabel[application.status] || application.status || 'Unknown'}
                </Badge>
                {pending ? (
                  <Button
                    variant="danger-soft"
                    size="sm"
                    loading={withdrawing === club._id}
                    onClick={() => handleWithdraw(club._id)}
                  >
                    Withdraw
                  </Button>
                ) : (
                  <ButtonLink to={`/clubs/${club._id}`} variant="secondary" size="sm" icon={ArrowRightIcon}>
                    View club
                  </ButtonLink>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title="My clubs"
        description="Track the clubs you lead, the communities you belong to, and your pending applications."
        actions={<ButtonLink to="/create-club" icon={PlusIcon}>Create club</ButtonLink>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Clubs you lead</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{counts.created}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Clubs you belong to</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{counts.joined}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Pending applications</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {pendingApplications.length}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <SegmentedControl options={tabs} value={tab} onChange={setTab} label="Club view" />
      </div>

      {notice ? (
        <Alert
          variant="success"
          className="mt-4"
          action={
            <button
              type="button"
              onClick={() => setNotice('')}
              className="rounded-[6px] p-1 text-success-700 transition-colors hover:bg-success-100 dark:text-emerald-200 dark:hover:bg-success-600/20"
              aria-label="Dismiss message"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          }
        >
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" className="mt-4" title="We could not load your clubs">
          {error}
        </Alert>
      ) : null}
      {actionError ? (
        <Alert variant="error" className="mt-4">
          {actionError}
        </Alert>
      ) : null}

      <div className="mt-5">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : tab === 'created' ? (
          renderCreated()
        ) : tab === 'joined' ? (
          renderJoined()
        ) : (
          renderApplications()
        )}
      </div>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-club-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-rose-400">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 id="delete-club-title" className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
              Delete “{deleteTarget.name}”?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              This permanently removes the club, its members and all of its events. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Delete club
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MyClubs;
