import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
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
  SkeletonCard,
  StatCard,
  Textarea,
} from '../ui';

const statusVariant = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

const AdminDashboard = () => {
  const [pendingClubs, setPendingClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [allClubsData, pendingClubsData, usersData] = await Promise.all([
        adminService.getAllClubs(),
        adminService.getPendingClubs(),
        authService.getAllUsers(),
      ]);

      const clubsData = Array.isArray(allClubsData) ? allClubsData : allClubsData?.clubs || [];
      setAllClubs(clubsData);

      const pendingList = Array.isArray(pendingClubsData)
        ? pendingClubsData
        : pendingClubsData?.clubs || [];
      setPendingClubs(pendingList.filter((club) => club.status === 'pending'));

      setUsers(Array.isArray(usersData) ? usersData : usersData?.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (clubId) => {
    setActionLoading(clubId);
    setError('');
    try {
      await adminService.approveClub(clubId);
      setSuccess('Club approved successfully.');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve club.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejecting this club.');
      return;
    }
    setActionLoading(rejectTarget._id);
    setError('');
    try {
      await adminService.rejectClub(rejectTarget._id, rejectReason.trim());
      setSuccess('Club rejected and the owner was notified.');
      setRejectTarget(null);
      setRejectReason('');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject club.');
    } finally {
      setActionLoading(null);
    }
  };

  const features = [
    {
      name: 'User management',
      description: 'Accounts, roles and status',
      to: '/admin/users',
      icon: UserGroupIcon,
    },
    {
      name: 'Club approvals',
      description: 'Review new club requests',
      to: '/admin/clubs',
      icon: ClipboardDocumentListIcon,
    },
    {
      name: 'Payments',
      description: 'Approve or reject proofs',
      to: '/admin/payments',
      icon: CreditCardIcon,
    },
    {
      name: 'Announcements',
      description: 'Moderate platform posts',
      to: '/admin/announcements',
      icon: MegaphoneIcon,
    },
    {
      name: 'Reports',
      description: 'Investigate user reports',
      to: '/admin/reports',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Feedback',
      description: 'Respond to suggestions',
      to: '/admin/feedback',
      icon: ChatBubbleLeftRightIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Admin overview"
        description="Moderate the platform, review requests and keep the community healthy."
        actions={
          <Button variant="secondary" icon={ArrowPathIcon} onClick={fetchData} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
        ) : (
          <>
            <StatCard label="Pending clubs" value={pendingClubs.length} icon={ClockIcon} accent="warning" />
            <StatCard label="Total clubs" value={allClubs.length} icon={UserGroupIcon} accent="brand" />
            <StatCard
              label="Active clubs"
              value={allClubs.filter((club) => club.status === 'approved').length}
              icon={CheckCircleIcon}
              accent="success"
            />
            <StatCard label="Total users" value={users.length} icon={UserGroupIcon} accent="violet" />
          </>
        )}
      </div>

      <Card>
        <CardHeader title="Admin tools" description="Jump straight to the area you need." />
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.to}
                to={feature.to}
                className="group flex items-center gap-3 rounded-[10px] border border-ink-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-ink-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ink-100 text-ink-600 group-hover:bg-white group-hover:text-brand-600 dark:bg-ink-800 dark:text-ink-300">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">
                    {feature.name}
                  </span>
                  <span className="block truncate text-xs text-ink-500 dark:text-ink-400">
                    {feature.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Club approvals"
          description="New clubs stay hidden until an administrator approves them."
          action={
            <SegmentedControl
              label="Club view"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'pending', label: 'Pending', count: pendingClubs.length },
                { value: 'all', label: 'All clubs', count: allClubs.length },
              ]}
            />
          }
        />
        <CardBody className="space-y-4">
          {activeTab === 'pending' ? (
            pendingClubs.length === 0 ? (
              <EmptyState
                icon={CheckCircleIcon}
                title="No pending clubs"
                description="Every club request has been reviewed. New submissions will appear here."
              />
            ) : (
              pendingClubs.map((club) => (
                <div
                  key={club._id}
                  className="rounded-[10px] border border-ink-200 p-4 dark:border-ink-800"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-ink-900 dark:text-white">
                          {club.name}
                        </h3>
                        <Badge variant="warning" dot>
                          Pending
                        </Badge>
                        {club.category ? <Badge>{club.category}</Badge> : null}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-ink-600 dark:text-ink-300">
                        {club.description}
                      </p>
                      <div className="mt-3 grid gap-2 text-sm text-ink-500 sm:grid-cols-2 dark:text-ink-400">
                        <p>
                          Owner:{' '}
                          <span className="text-ink-700 dark:text-ink-200">
                            {club.createdBy?.firstName
                              ? `${club.createdBy.firstName} ${club.createdBy.lastName || ''}`.trim()
                              : 'Unknown'}
                          </span>
                        </p>
                        <p>
                          Submitted:{' '}
                          <span className="text-ink-700 dark:text-ink-200">
                            {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        icon={CheckCircleIcon}
                        loading={actionLoading === club._id}
                        onClick={() => handleApprove(club._id)}
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
            )
          ) : allClubs.length === 0 ? (
            <EmptyState icon={UserGroupIcon} title="No clubs yet" description="Clubs will appear here once students create them." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {allClubs.map((club) => (
                <div
                  key={club._id}
                  className="rounded-[10px] border border-ink-200 p-4 dark:border-ink-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate text-sm font-semibold text-ink-900 dark:text-white">
                      {club.name}
                    </h3>
                    <Badge variant={statusVariant[club.status] || 'neutral'}>{club.status}</Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
                    {club.description}
                  </p>
                  <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">
                    {club.members?.length || 0} members ·{' '}
                    {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              ))}
            </div>
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
              The club owner will see this reason, so keep it clear and constructive.
            </p>
            <div className="mt-4">
              <Textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Explain what needs to change before this club can be approved."
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

export default AdminDashboard;
