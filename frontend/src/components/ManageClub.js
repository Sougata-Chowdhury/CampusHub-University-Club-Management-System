import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserGroupIcon,
  UserMinusIcon,
  XCircleIcon,
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
  PageSkeleton,
} from '../ui';

const idOf = (value) => (value && typeof value === 'object' ? value._id || value.id : value);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

const fullName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Campus student';

const ManageClub = () => {
  const { clubId } = useParams();
  const { user } = useAuth();

  const [club, setClub] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionId, setActionId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const userId = user?._id || user?.id;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [clubData, applicationsData] = await Promise.all([
        clubService.getClubById(clubId),
        clubService.getClubApplications(clubId).catch(() => []),
      ]);
      setClub(clubData);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load club management');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = Boolean(club && userId && String(idOf(club.createdBy)) === String(userId));

  const pendingApplications = useMemo(
    () => applications.filter((application) => application.status === 'pending'),
    [applications],
  );

  const members = club?.members || [];
  const maxMembers = club?.maxMembers || null;
  const spotsLeft = maxMembers ? Math.max(0, maxMembers - members.length) : null;

  const handleApplication = async (application, action) => {
    setActionId(application._id);
    setError('');
    setNotice('');
    try {
      await clubService.handleApplicationAction(clubId, application._id, action);
      setApplications((current) => current.filter((item) => item._id !== application._id));
      setNotice(
        `${fullName(application.userId)} was ${action === 'approve' ? 'approved' : 'rejected'}.`,
      );
      const fresh = await clubService.getClubById(clubId);
      setClub(fresh);
    } catch (err) {
      setError(err.message || `Failed to ${action} application`);
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setError('');
    setNotice('');
    try {
      await clubService.removeMember(clubId, idOf(removeTarget));
      setClub((current) =>
        current
          ? {
              ...current,
              members: (current.members || []).filter(
                (member) => String(idOf(member)) !== String(idOf(removeTarget)),
              ),
            }
          : current,
      );
      setNotice(`${fullName(removeTarget)} was removed from the club.`);
      setRemoveTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!club) {
    return (
      <>
        <PageHeader eyebrow="Manage" title="Manage club" />
        <div className="mt-6">
          <Alert variant="error" title="We could not load this club">
            {error || 'The club may have been removed.'}
          </Alert>
          <div className="mt-4">
            <ButtonLink to="/my-clubs" variant="secondary" icon={ArrowLeftIcon}>
              Back to my clubs
            </ButtonLink>
          </div>
        </div>
      </>
    );
  }

  if (!isOwner) {
    return (
      <>
        <PageHeader eyebrow="Manage" title={club.name} />
        <div className="mt-6">
          <Alert variant="warning" title="You do not have access to this page">
            Only the club owner can manage members and applications.
          </Alert>
          <div className="mt-4">
            <ButtonLink to={`/clubs/${clubId}`} icon={ArrowLeftIcon}>
              Back to club
            </ButtonLink>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title={club.name}
        description="Review applications, keep the member list tidy and jump into club operations."
        actions={
          <>
            <ButtonLink to={`/clubs/${clubId}`} variant="secondary" icon={ArrowLeftIcon}>
              Club page
            </ButtonLink>
            <ButtonLink to={`/club-events/${clubId}`} icon={CalendarDaysIcon}>
              Events
            </ButtonLink>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Members</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{members.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Pending applications</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {pendingApplications.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Capacity</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {maxMembers || 'Unlimited'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Spots left</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {spotsLeft === null ? '∞' : spotsLeft}
          </p>
        </Card>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title={`Members (${members.length})`}
              description="Everyone who has been approved to join."
            />
            <CardBody>
              {members.length === 0 ? (
                <EmptyState
                  icon={UserGroupIcon}
                  title="No members yet"
                  description="Approve a pending application and the member will appear here."
                />
              ) : (
                <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                  {members.map((member) => {
                    const isCreator = String(idOf(member)) === String(idOf(club.createdBy));
                    const isSelf = String(idOf(member)) === String(userId);
                    return (
                      <li key={idOf(member)} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <Avatar
                          name={fullName(member)}
                          src={member.profilePicture}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                            {fullName(member)}
                            {isSelf ? (
                              <span className="ml-2 text-xs font-normal text-ink-400">(you)</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                            {isCreator ? 'Club owner' : 'Member'}
                          </p>
                        </div>
                        {isCreator ? (
                          <Badge variant="brand">Owner</Badge>
                        ) : (
                          <Button
                            variant="danger-soft"
                            size="xs"
                            icon={UserMinusIcon}
                            onClick={() => setRemoveTarget(member)}
                          >
                            Remove
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={`Pending applications (${pendingApplications.length})`}
              description="Approve to add the student as a member, or reject to decline."
            />
            <CardBody>
              {pendingApplications.length === 0 ? (
                <EmptyState
                  icon={ClockIcon}
                  title="No pending applications"
                  description="New applications will show up here for review."
                />
              ) : (
                <ul className="space-y-3">
                  {pendingApplications.map((application) => (
                    <li
                      key={application._id}
                      className="rounded-[10px] border border-ink-200 p-4 dark:border-ink-800"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <Avatar
                          name={fullName(application.userId)}
                          src={application.userId?.profilePicture}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                            {fullName(application.userId)}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                            <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">
                              {application.userId?.email || 'No email available'}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                            Applied {formatDate(application.appliedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            icon={CheckCircleIcon}
                            loading={actionId === application._id}
                            onClick={() => handleApplication(application, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger-soft"
                            size="sm"
                            icon={XCircleIcon}
                            disabled={actionId === application._id}
                            onClick={() => handleApplication(application, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Club details"
              action={<Cog6ToothIcon className="h-5 w-5 text-ink-400" aria-hidden="true" />}
            />
            <CardBody className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">About</p>
                <p className="mt-1 text-ink-700 dark:text-ink-200">
                  {club.description || 'No description provided yet.'}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500 dark:text-ink-400">Category</span>
                <Badge variant="brand">{club.category || 'General'}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500 dark:text-ink-400">Status</span>
                <Badge variant={club.status === 'approved' ? 'success' : 'warning'}>
                  {club.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500 dark:text-ink-400">Created</span>
                <span className="text-ink-700 dark:text-ink-200">{formatDate(club.createdAt)}</span>
              </div>
              {club.location ? (
                <p className="flex items-start gap-2 text-ink-600 dark:text-ink-300">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                  {club.location}
                </p>
              ) : null}
              {club.meetingTime ? (
                <p className="flex items-start gap-2 text-ink-600 dark:text-ink-300">
                  <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                  {club.meetingTime}
                </p>
              ) : null}
              {club.tags?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {club.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Operations" />
            <CardBody className="space-y-2">
              <ButtonLink to={`/club-events/${clubId}`} variant="secondary" fullWidth icon={CalendarDaysIcon}>
                Manage events
              </ButtonLink>
              <ButtonLink
                to={`/clubs/${clubId}/manage-payments`}
                variant="secondary"
                fullWidth
                icon={CurrencyDollarIcon}
              >
                Manage payments
              </ButtonLink>
              <ButtonLink
                to={`/clubs/${clubId}/payment-history`}
                variant="secondary"
                fullWidth
                icon={CurrencyDollarIcon}
              >
                Payment history
              </ButtonLink>
            </CardBody>
          </Card>

          <Alert variant="info" title="Member privacy">
            Member emails are hidden across the app. Use announcements and club events to reach
            everyone.
          </Alert>
        </div>
      </div>

      {removeTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-rose-400">
              <UserMinusIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2
              id="remove-member-title"
              className="mt-4 text-lg font-semibold text-ink-900 dark:text-white"
            >
              Remove {fullName(removeTarget)}?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              They will lose access to club events and can re-apply later. This does not delete their
              account.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRemoveTarget(null)} disabled={removing}>
                Cancel
              </Button>
              <Button variant="danger" loading={removing} onClick={handleRemoveMember}>
                Remove member
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ManageClub;
