import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
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
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
} from '../ui';
import ReportButton from './ReportButton';
import FeedbackButton from './feedback/FeedbackButton';

const statusVariant = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

const idOf = (value) => (value && typeof value === 'object' ? value._id || value.id : value);

const ClubDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [applying, setApplying] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userId = user?._id || user?.id;

  const loadClub = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await clubService.getClubById(id);
      setClub(data);
    } catch (err) {
      setError(err.message || 'Failed to load club details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClub();
  }, [loadClub]);

  const applicationStatus = useMemo(() => {
    if (!club || !userId) return null;
    const application = (club.memberApplications || []).find(
      (entry) => String(idOf(entry.userId)) === String(userId),
    );
    return application?.status || null;
  }, [club, userId]);

  const isCreator = Boolean(club && userId && String(idOf(club.createdBy)) === String(userId));
  const isMember = Boolean(
    club && userId && (club.members || []).some((member) => String(idOf(member)) === String(userId)),
  );
  const canApply = Boolean(
    club && userId && club.status === 'approved' && !isCreator && !isMember && !applicationStatus,
  );
  const pendingApplications =
    club?.memberApplications?.filter((application) => application.status === 'pending').length || 0;

  const handleApply = async () => {
    setApplying(true);
    setError('');
    try {
      await clubService.applyToJoinClub(id);
      setNotice('Your application has been submitted. You will be notified once it is reviewed.');
      await loadClub();
    } catch (err) {
      setError(err.message || 'Failed to apply to this club');
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await clubService.deleteClub(id);
      navigate('/my-clubs', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete club');
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-4 w-24" />
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="mt-6 h-16 w-full" />
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error && !club) {
    return (
      <EmptyState
        icon={ExclamationTriangleIcon}
        title="Club not found"
        description={error || 'The club you are looking for does not exist or is no longer available.'}
        action={<ButtonLink to="/browse-clubs" icon={ArrowLeftIcon}>Back to clubs</ButtonLink>}
      />
    );
  }

  if (!club) return null;

  return (
    <>
      <Link
        to="/browse-clubs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to clubs
      </Link>

      <PageHeader
        className="mt-4"
        eyebrow={club.category || 'Campus club'}
        title={club.name}
        description={club.description || 'No description has been provided for this club yet.'}
        actions={
          <>
            {!isCreator ? (
              <ReportButton
                reportType="club"
                reportTargetId={club._id}
                reportTargetInfo={{
                  title: club.name,
                  description: club.description,
                  category: club.category,
                }}
                variant="icon"
                tooltip="Report this club"
              />
            ) : null}
            {isCreator ? (
              <>
                {club.status === 'approved' ? (
                  <ButtonLink to={`/manage-club/${club._id}`} icon={Cog6ToothIcon}>
                    Manage club
                  </ButtonLink>
                ) : null}
                <Button variant="secondary" icon={TrashIcon} onClick={() => setShowDelete(true)}>
                  Delete
                </Button>
              </>
            ) : canApply ? (
              <Button onClick={handleApply} loading={applying} icon={UserGroupIcon}>
                Apply to join
              </Button>
            ) : null}
          </>
        }
      />

      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={club.name} src={club.logoUrl} size="xl" className="rounded-[14px]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant[club.status] || 'neutral'}>
                    {club.status === 'approved'
                      ? 'Approved'
                      : club.status === 'pending'
                        ? 'Pending approval'
                        : club.status || 'Unknown'}
                  </Badge>
                  {isMember ? <Badge variant="brand">Member</Badge> : null}
                  {isCreator ? <Badge variant="info">Owner</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                  Created by {club.createdBy?.firstName
                    ? `${club.createdBy.firstName} ${club.createdBy.lastName || ''}`.trim()
                    : 'a campus student'}{' '}
                  on {new Date(club.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {applicationStatus ? (
              <div className="mt-5">
                {applicationStatus === 'pending' ? (
                  <Alert variant="warning" title="Application pending">
                    Your application is waiting for the club owner to review it.
                  </Alert>
                ) : applicationStatus === 'approved' ? (
                  <div className="space-y-3">
                    <Alert variant="success" title="You are a member">
                      You now have access to this club and its events.
                    </Alert>
                    <FeedbackButton
                      targetType="club"
                      targetId={club._id}
                      targetInfo={{
                        title: club.name,
                        description: club.description,
                        category: club.category,
                      }}
                      text="Rate this club"
                      buttonVariant="outlined"
                    />
                  </div>
                ) : (
                  <Alert variant="error" title="Application declined">
                    Your application was not approved. You can contact the club owner for details.
                  </Alert>
                )}
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Members" description={`${club.members?.length || 0} people in this club`} />
            {club.members?.length ? (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {club.members.map((member, index) => {
                  const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member';
                  return (
                    <li key={member._id || index} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={name} src={member.profilePicture} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{name}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-400">
                          {idOf(member) === idOf(club.createdBy) ? 'Club owner' : 'Member'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <CardBody>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  This club does not have any members yet.
                </p>
              </CardBody>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Club information" />
            <CardBody className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <TagIcon className="mt-0.5 h-4 w-4 text-ink-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Category</p>
                  <p className="font-medium text-ink-900 dark:text-white">{club.category || 'General'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 h-4 w-4 text-ink-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Owner</p>
                  <p className="font-medium text-ink-900 dark:text-white">
                    {club.createdBy?.firstName
                      ? `${club.createdBy.firstName} ${club.createdBy.lastName || ''}`.trim()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDaysIcon className="mt-0.5 h-4 w-4 text-ink-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Created</p>
                  <p className="font-medium text-ink-900 dark:text-white">
                    {new Date(club.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="At a glance" />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between rounded-[10px] bg-ink-50 px-3 py-2.5 dark:bg-ink-800/60">
                <span className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <UserGroupIcon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  Members
                </span>
                <span className="text-sm font-semibold text-ink-900 dark:text-white">
                  {club.members?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[10px] bg-ink-50 px-3 py-2.5 dark:bg-ink-800/60">
                <span className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <ClockIcon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  Pending applications
                </span>
                <span className="text-sm font-semibold text-ink-900 dark:text-white">
                  {isCreator ? pendingApplications : '—'}
                </span>
              </div>
            </CardBody>
          </Card>

          {club.status === 'approved' ? (
            <Card>
              <CardHeader title="Club events" />
              <CardBody>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  See what this club has planned next.
                </p>
                <ButtonLink
                  to={`/club-events/${club._id}`}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  icon={CalendarDaysIcon}
                >
                  View events
                </ButtonLink>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      {showDelete ? (
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
              Delete “{club.name}”?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              This permanently removes the club, its members and all of its events. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>
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

export default ClubDetails;
