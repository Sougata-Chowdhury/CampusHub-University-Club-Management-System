import React, { useEffect, useState } from 'react';
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import adminService from '../services/adminService';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  Textarea,
} from '../ui';

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const AdminPaymentManagement = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getPendingPayments();
      setPendingPayments(Array.isArray(response) ? response : response?.payments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending payments.');
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleApprove = async (payment) => {
    setActionLoading(payment._id);
    setError('');
    try {
      await adminService.approvePayment(payment._id);
      setSuccess('Payment approved and the registration confirmed.');
      await fetchPendingPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejecting this payment.');
      return;
    }
    setActionLoading(rejectTarget._id);
    setError('');
    try {
      await adminService.rejectPayment(rejectTarget._id, rejectReason.trim());
      setSuccess('Payment rejected and the student was notified.');
      setRejectTarget(null);
      setRejectReason('');
      await fetchPendingPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalAmount = pendingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Payment approvals"
        description="Verify transfer proofs and confirm event registrations."
        actions={
          <Button variant="secondary" icon={ArrowPathIcon} onClick={fetchPendingPayments} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Pending payments" value={pendingPayments.length} icon={ClockIcon} accent="warning" />
        <StatCard label="Total value" value={formatCurrency(totalAmount)} icon={BanknotesIcon} accent="success" />
      </div>

      <Card>
        <CardHeader title="Awaiting verification" description="Oldest submissions are usually the most urgent." />
        <div className="border-t border-ink-100 dark:border-ink-800">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-[10px] bg-ink-100 dark:bg-ink-800" />
              ))}
            </div>
          ) : pendingPayments.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={CheckCircleIcon}
              title="No pending payments"
              description="Every payment has been processed. New submissions will show up here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {pendingPayments.map((payment) => {
                    const name = `${payment.userId?.firstName || ''} ${payment.userId?.lastName || ''}`.trim() || 'Student';
                    return (
                      <tr key={payment._id} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink-900 dark:text-white">
                            {payment.eventId?.title || 'Event payment'}
                          </p>
                          <p className="text-xs text-ink-500 dark:text-ink-400">
                            {payment.clubId?.name || 'Club'} · #{payment._id.slice(-8)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={name} src={payment.userId?.profilePicture} size="xs" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink-900 dark:text-white">{name}</p>
                              <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                                {payment.userId?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </p>
                          <Badge className="mt-1">{payment.paymentMethod || 'Bank transfer'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-500 dark:text-ink-400">
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}
                          <span className="block text-xs">
                            {payment.createdAt ? new Date(payment.createdAt).toLocaleTimeString() : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="xs"
                              icon={CheckCircleIcon}
                              loading={actionLoading === payment._id}
                              onClick={() => handleApprove(payment)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="danger-soft"
                              icon={XCircleIcon}
                              disabled={actionLoading === payment._id}
                              onClick={() => {
                                setRejectTarget(payment);
                                setRejectReason('');
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {rejectTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-payment-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <h2 id="reject-payment-title" className="text-lg font-semibold text-ink-900 dark:text-white">
              Reject this payment?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              The student will be asked to upload a new proof of payment.
            </p>
            <div className="mt-4">
              <Textarea
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="e.g. The transfer reference does not match the receipt."
                aria-label="Rejection reason"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={actionLoading === rejectTarget._id} onClick={handleReject}>
                Reject payment
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPaymentManagement;
