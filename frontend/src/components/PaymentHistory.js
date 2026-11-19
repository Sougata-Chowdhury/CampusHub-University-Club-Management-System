import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  IdentificationIcon,
  UserIcon,
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
  Skeleton,
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

const PaymentCard = ({ payment, showUser }) => {
  const method = payment.paymentMethod
    ? payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace(/_/g, ' ')
    : 'Not specified';
  const approvedBy = [payment.approvedBy?.firstName, payment.approvedBy?.lastName]
    .filter(Boolean)
    .join(' ');
  const user = payment.userId;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink-900 dark:text-white">
            {payment.eventId?.name || 'Event removed'}
          </h3>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            {payment.eventId?.date ? `Event on ${formatDate(payment.eventId.date)}` : 'Payment record'}
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
          <ClockIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          Paid {formatDate(payment.approvedAt || payment.createdAt)}
        </span>
        <span className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          {method}
        </span>
        <span className="flex items-center gap-2">
          <IdentificationIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          <span className="truncate">Ref: {payment.transactionId || 'N/A'}</span>
        </span>
        {showUser && user ? (
          <span className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            <span className="truncate">
              {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Member'}
            </span>
          </span>
        ) : null}
        {approvedBy ? (
          <span className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            Approved by {approvedBy}
          </span>
        ) : null}
      </div>

      {payment.rejectionReason ? (
        <p className="mt-3 rounded-[10px] border border-danger-100 bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:border-danger-600/30 dark:bg-danger-600/10 dark:text-rose-300">
          {payment.rejectionReason}
        </p>
      ) : null}

      {payment.notes ? (
        <p className="mt-3 text-xs text-ink-600 dark:text-ink-300">{payment.notes}</p>
      ) : null}

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
    </Card>
  );
};

const PaymentHistory = () => {
  const { clubId } = useParams();
  const [payments, setPayments] = useState([]);
  const [club, setClub] = useState(null);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = clubId
        ? await paymentService.getClubPaymentHistory(clubId, page, 10)
        : await paymentService.getUserPayments(page, 10);
      setPayments(Array.isArray(response?.payments) ? response.payments : []);
      setPagination(response?.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to load payment history');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!clubId) return;
    let active = true;
    clubService
      .getClubById(clubId)
      .then((data) => {
        if (active) setClub(data);
      })
      .catch(() => {
        /* the history still works without the club header */
      });
    return () => {
      active = false;
    };
  }, [clubId]);

  const approved = payments.filter((payment) => payment.status === 'approved');
  const pending = payments.filter((payment) => payment.status === 'pending');
  const totalApproved = approved.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow={clubId ? 'Club finances' : 'Account'}
        title="Payment history"
        description={
          clubId
            ? `Approved payments received by ${club?.name || 'this club'}.`
            : 'Every event payment you have submitted and its current status.'
        }
        actions={
          clubId ? (
            <>
              <ButtonLink to={`/clubs/${clubId}/manage-payments`} variant="secondary" icon={ArrowLeftIcon}>
                Manage payments
              </ButtonLink>
              <ButtonLink to={`/clubs/${clubId}`}>View club</ButtonLink>
            </>
          ) : (
            <ButtonLink to="/browse-events" variant="secondary">
              Browse events
            </ButtonLink>
          )
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Transactions</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{payments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Approved total</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
            {formatCurrency(totalApproved, approved[0]?.currency || 'BDT')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Awaiting review</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">{pending.length}</p>
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

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="mt-5 h-10 w-full" />
            </Card>
          ))
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CurrencyDollarIcon}
            title="No payments yet"
            description={
              clubId
                ? 'Approved payments for this club will appear here.'
                : 'Register for a paid event and submit payment to see it here.'
            }
            action={<ButtonLink to="/browse-events">Browse events</ButtonLink>}
          />
        ) : (
          payments.map((payment) => (
            <PaymentCard key={payment._id} payment={payment} showUser={Boolean(clubId)} />
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

      {!clubId ? (
        <p className="mt-6 text-center text-xs text-ink-400 dark:text-ink-500">
          Looking for receipts? Open the event to see your payment status.{' '}
          <Link to="/browse-events" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Browse events
          </Link>
        </p>
      ) : null}
    </>
  );
};

export default PaymentHistory;
