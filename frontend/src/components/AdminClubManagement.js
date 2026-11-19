import React, { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import adminService from '../services/adminService';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  Textarea,
} from '../ui';

const AdminClubManagement = () => {
  const [pendingClubs, setPendingClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingClubs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getPendingClubs();
      const list = Array.isArray(response) ? response : response?.clubs || [];
      setPendingClubs(list.filter((club) => club.status === 'pending'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending clubs.');
      setPendingClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingClubs();
  }, []);

  const handleApprove = async (club) => {
    setActionLoading(club._id);
    setError('');
    try {
      await adminService.approveClub(club._id);
      setSuccess(`${club.name} was approved.`);
      await fetchPendingClubs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve club.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    setActionLoading(rejectTarget._id);
    setError('');
    try {
      await adminService.rejectClub(rejectTarget._id, rejectReason.trim());
      setSuccess(`${rejectTarget.name} was rejected.`);
      setRejectTarget(null);
      setRejectReason('');
      await fetchPendingClubs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject club.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Club approvals"
        description="Review new club requests before they become visible to students."
        actions={
          <Button variant="secondary" icon={ArrowPathIcon} onClick={fetchPendingClubs} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Awaiting review" value={pendingClubs.length} icon={ClockIcon} accent="warning" />
      </div>

      <Card>
        <CardHeader
          title="Pending requests"
          description="Approve to publish the club, or reject with a clear reason."
        />
        <CardBody className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-[10px] bg-ink-100 dark:bg-ink-800" />
              ))}
            </div>
          ) : pendingClubs.length === 0 ? (
            <EmptyState
              icon={CheckCircleIcon}
              title="No pending clubs"
              description="Every request has been reviewed. New applications will appear here."
            />
          ) : (
            pendingClubs.map((club) => (
              <div key={club._id} className="rounded-[10px] border border-ink-200 p-4 dark:border-ink-800">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink-900 dark:text-white">{club.name}</h3>
                      <Badge variant="warning" dot>
                        Pending
                      </Badge>
                      {club.category ? <Badge>{club.category}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{club.description}</p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-400">Requested by</dt>
                        <dd className="text-ink-700 dark:text-ink-200">
                          {club.createdBy?.firstName
                            ? `${club.createdBy.firstName} ${club.createdBy.lastName || ''}`.trim()
                            : 'Unknown'}
                          {club.createdBy?.email ? (
                            <span className="block text-xs text-ink-500 dark:text-ink-400">
                              {club.createdBy.email}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-400">Submitted</dt>
                        <dd className="text-ink-700 dark:text-ink-200">
                          {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : '-'}
                          {club.location ? (
                            <span className="block text-xs text-ink-500 dark:text-ink-400">{club.location}</span>
                          ) : null}
                        </dd>
                      </div>
                    </dl>
                    {club.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {club.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      icon={CheckCircleIcon}
                      loading={actionLoading === club._id}
                      onClick={() => handleApprove(club)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-soft"
                      icon={XCircleIcon}
                      disabled={actionLoading === club._id}
                      onClick={() => {
                        setRejectTarget(club);
                        setRejectReason('');
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {rejectTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-club-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <h2 id="reject-club-title" className="text-lg font-semibold text-ink-900 dark:text-white">
              Reject {rejectTarget.name}?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              The owner will see this reason. Be specific about what needs to change.
            </p>
            <div className="mt-4">
              <Textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Reason for rejection…"
                aria-label="Rejection reason"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={actionLoading === rejectTarget._id} onClick={handleReject}>
                Reject club
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminClubManagement;
