import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  IdentificationIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { clubService } from '../services/clubService';
import { paymentService } from '../services/paymentService';
import { resolveAssetUrl } from '../services/api';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  PageSkeleton,
  SegmentedControl,
  Textarea,
  Field,
} from '../ui';

const statusVariant = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const formatCurrency = (amount, currency = 'BDT') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'BDT').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch (error) {
    return `${amount} ${currency}`;
  }
};

const PaymentCard = ({ payment, onApprove, onReject, processing }) => {
  const method = payment.paymentMethod
    ? payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace(/_/g, ' ')
    : 'Not specified';
  const payer = payment.userId;
  const payerName = `${payer?.firstName || ''} ${payer?.lastName || ''}`.trim();

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink-900 dark:text-white">
            {payment.eventId?.name || 'Event removed'}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {payment.eventId?.date ? formatDate(payment.eventId.date) : 'Event date unavailable'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-ink-900 dark:text-white">
            {formatCurrency(payment.amount, payment.currency)}
          </p>
          <Badge variant={statusVariant[payment.status] || 'neutral'} className="mt-1">
            {payment.status || 'unknown'}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-ink-500 sm:grid-cols-2 dark:text-ink-400">
        <span className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          <span className="truncate">
            {payerName || payer?.email || 'Unknown member'}
            {payerName && payer?.email ? ` · ${payer.email}` : ''}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          Submitted {formatDate(payment.createdAt)}
        </span>
        <span className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          {method}
        </span>
        <span className="flex items-center gap-2">
          <IdentificationIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          <span className="truncate">Ref: {payment.transactionId || 'N/A'}</span>
        </span>
      </div>

      {payment.proofOfPayment ? (
        <a
          href={resolveAssetUrl(payment.proofOfPayment)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-ink-200 px-3 py-2 text-xs font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
        >
          <DocumentIcon className="h-4 w-4" aria-hidden="true" />
          View payment proof
        </a>
      ) : null}

      {payment.notes ? (
        <p className="mt-3 rounded-[10px] border border-ink-200 px-3 py-2 text-xs text-ink-600 dark:border-ink-800 dark:text-ink-300">
          {payment.notes}
        </p>
      ) : null}

      {payment.rejectionReason ? (
        <p className="mt-3 rounded-[10px] border border-danger-100 bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:border-danger-600/30 dark:bg-danger-600/10 dark:text-rose-300">
          {payment.rejectionReason}
        </p>
      ) : null}

      {payment.status === 'pending' ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            fullWidth
            icon={CheckCircleIcon}
            loading={processing === payment._id}
            onClick={() => onApprove(payment)}
          >
            Approve payment
          </Button>
          <Button
            variant="danger-soft"
            size="sm"
            fullWidth
            icon={XCircleIcon}
            disabled={processing === payment._id}
            onClick={() => onReject(payment)}
          >
            Reject
          </Button>
        </div>
      ) : null}
    </Card>
  );
};

const ManagePayments = () => {
  const { clubId } = useParams();

  const [club, setClub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [processing, setProcessing] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await paymentService.getClubPayments(clubId, page, 20);
      setPayments(Array.isArray(response?.payments) ? response.payments : []);
      setPagination(response?.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    clubService
      .getClubById(clubId)
      .then((data) => {
        if (active) setClub(data);
      })
      .catch(() => {
        /* the payment list still works without the club header */
      });
    return () => {
      active = false;
    };
  }, [clubId]);

  const counts = useMemo(
    () => ({
      pending: payments.filter((payment) => payment.status === 'pending').length,
      approved: payments.filter((payment) => payment.status === 'approved').length,
      rejected: payments.filter((payment) => payment.status === 'rejected').length,
    }),
    [payments],
  );

  const approvedTotal = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'approved')
        .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
    [payments],
  );

  const visiblePayments = useMemo(() => {
    if (filter === 'all') return payments;
    return payments.filter((payment) => payment.status === filter);
  }, [payments, filter]);

  const handleApprove = async (payment) => {
    setProcessing(payment._id);
    setError('');
    setNotice('');
    try {
      await paymentService.approvePayment(payment._id);
      setPayments((current) =>
        current.map((item) =>
          item._id === payment._id ? { ...item, status: 'approved', approvedAt: new Date().toISOString() } : item,
        ),
      );
      setNotice(`Payment from ${payment.userId?.firstName || 'the member'} was approved.`);
    } catch (err) {
      setError(err.message || 'Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(rejectTarget._id);
    setError('');
    setNotice('');
    try {
      await paymentService.rejectPayment(rejectTarget._id, rejectReason.trim());
      setPayments((current) =>
        current.map((item) =>
          item._id === rejectTarget._id
            ? { ...item, status: 'rejected', rejectionReason: rejectReason.trim() }
            : item,
        ),
      );
      setNotice('Payment was rejected. The member can submit a new proof.');
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      setError(err.message || 'Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  const filterOptions = [
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'approved', label: 'Approved', count: counts.approved },
    { value: 'rejected', label: 'Rejected', count: counts.rejected },
    { value: 'all', label: 'All', count: payments.length },
  ];

  if (loading && !club && payments.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Club finances"
        title="Manage payments"
        description={
          club?.name
            ? `Review payment proofs submitted for ${club.name} events.`
            : 'Review payment proofs submitted for this club.'
        }
        actions={
          <>
            <ButtonLink to={`/manage-club/${clubId}`} variant="secondary" icon={ArrowLeftIcon}>
              Manage club
            </ButtonLink>
            <ButtonLink to={`/clubs/${clubId}/payment-history`} variant="secondary">
              History
            </ButtonLink>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Awaiting review</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{counts.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Approved (page)</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{counts.approved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Approved total</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {formatCurrency(approvedTotal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Rejected (page)</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{counts.rejected}</p>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl options={filterOptions} value={filter} onChange={setFilter} label="Filter payments" />
        <Button variant="ghost" size="sm" onClick={load} className="sm:ml-auto">
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="h-3 w-32 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                </div>
                <div className="h-6 w-24 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
              </div>
            </Card>
          ))
        ) : visiblePayments.length === 0 ? (
          <EmptyState
            icon={CurrencyDollarIcon}
            title={
              filter === 'pending'
                ? 'Nothing waiting for review'
                : filter === 'approved'
                  ? 'No approved payments yet'
                  : filter === 'rejected'
                    ? 'No rejected payments'
                    : 'No payments yet'
            }
            description={
              filter === 'pending'
                ? 'New payment proofs from your members will appear here.'
                : 'Switch the filter to see other payments, or wait for members to submit proofs.'
            }
            action={
              filter !== 'all' ? (
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  Show all payments
                </Button>
              ) : null
            }
          />
        ) : (
          visiblePayments.map((payment) => (
            <PaymentCard
              key={payment._id}
              payment={payment}
              processing={processing}
              onApprove={handleApprove}
              onReject={(target) => {
                setRejectTarget(target);
                setRejectReason('');
              }}
            />
          ))
        )}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Page {pagination.currentPage || page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-payment-title"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-rose-400">
                <XCircleIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-[8px] p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-200"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <h2
              id="reject-payment-title"
              className="mt-4 text-lg font-semibold text-ink-900 dark:text-white"
            >
              Reject this payment?
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              The member will be notified and can upload a new proof of payment.
            </p>
            <div className="mt-4">
              <Field
                label="Reason (optional)"
                htmlFor="reject-reason"
                hint="Share why the proof could not be accepted."
              >
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={3}
                  placeholder="e.g. The transaction ID does not match the uploaded receipt."
                  maxLength={300}
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={Boolean(processing)}>
                Cancel
              </Button>
              <Button variant="danger" loading={processing === rejectTarget._id} onClick={handleReject}>
                Reject payment
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ManagePayments;
