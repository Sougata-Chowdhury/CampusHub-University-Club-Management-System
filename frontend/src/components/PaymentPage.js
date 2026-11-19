import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BanknotesIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { paymentService } from '../services/paymentService';
import { eventService } from '../services/eventService';
import api from '../services/api';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  PageSkeleton,
  Select,
  Textarea,
} from '../ui';

const PaymentPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'bank_transfer',
    transactionId: '',
    notes: '',
  });
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        const response = await eventService.getEventById(eventId);
        setEvent(response);

        const token = localStorage.getItem('token');
        if (token) {
          try {
            const { data: currentUser } = await api.get('/users/profile');
            const userId = currentUser._id || currentUser.id;
            const alreadyRegistered = response.attendees?.some((attendee) => {
              const attendeeId = typeof attendee === 'string' ? attendee : attendee._id || attendee.id;
              return String(attendeeId) === String(userId);
            });
            if (alreadyRegistered) {
              setError('You are already registered for this event. Taking you back to the event…');
              setTimeout(() => navigate(`/events/${eventId}`), 2000);
            }
          } catch {
            /* registration check is best-effort */
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load the event details.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleInputChange = (event_) => {
    const { name, value } = event_.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event_) => {
    const file = event_.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Upload a JPEG, PNG or PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The file must be smaller than 5 MB.');
      return;
    }
    setProofFile(file);
    setError('');
  };

  const handleSubmit = async (event_) => {
    event_.preventDefault();
    if (!proofFile) {
      setError('Upload your proof of payment before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const paymentData = new FormData();
      paymentData.append('eventId', eventId);
      paymentData.append('paymentMethod', formData.paymentMethod);
      paymentData.append('transactionId', formData.transactionId);
      paymentData.append('notes', formData.notes);
      paymentData.append('proofOfPayment', proofFile);

      await paymentService.createPayment(paymentData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to submit payment.';
      setError(message);
      if (message.includes('already registered') || message.includes('already paid')) {
        setTimeout(() => navigate(`/events/${eventId}`), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
    }).format(amount || 0);

  if (loading) {
    return <PageSkeleton />;
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-emerald-300">
              <CheckCircleIcon className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-ink-900 dark:text-white">Payment submitted</h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              Your proof is waiting for approval from the club organisers. You will be redirected to
              your dashboard shortly.
            </p>
            <Button className="mt-6" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-lg">
        <Alert variant="error" title="Event not found">
          {error || 'The event you are trying to pay for does not exist.'}
        </Alert>
      </div>
    );
  }

  const clubName = event.clubId?.name || event.club?.name || 'Club event';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Checkout"
        title="Event payment"
        description="Upload your receipt so the club can confirm your place."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <CardHeader title={event.title || event.name} description={clubName} action={<Badge variant="brand">Payment required</Badge>} />
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-400">Event date</dt>
              <dd className="mt-0.5 font-medium text-ink-900 dark:text-white">
                {event.date ? new Date(event.date).toLocaleDateString() : 'To be announced'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-400">Location</dt>
              <dd className="mt-0.5 font-medium text-ink-900 dark:text-white">{event.location || 'TBA'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-400">Amount due</dt>
              <dd className="mt-0.5 text-lg font-semibold text-brand-600 dark:text-brand-400">
                {formatCurrency(event.price, event.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-400">Organiser</dt>
              <dd className="mt-0.5 font-medium text-ink-900 dark:text-white">{clubName}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Payment details" description="We only accept proof uploads, no card data is stored." />
          <CardBody className="space-y-4">
            <Field label="Payment method" htmlFor="paymentMethod" required>
              <Select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="digital_wallet">Digital wallet</option>
                <option value="other">Other</option>
              </Select>
            </Field>

            <Field
              label="Transaction reference"
              htmlFor="transactionId"
              hint="Optional, but it speeds up manual verification."
            >
              <Input
                id="transactionId"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleInputChange}
                placeholder="e.g. TRX-829104"
              />
            </Field>

            <Field
              label="Proof of payment"
              hint="JPEG, PNG or PDF up to 5 MB."
              required
            >
              <div className="rounded-[10px] border-2 border-dashed border-ink-200 p-6 text-center dark:border-ink-700">
                <DocumentArrowUpIcon className="mx-auto h-9 w-9 text-ink-400" aria-hidden="true" />
                <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
                  {proofFile ? proofFile.name : 'No file selected yet'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label="Proof of payment"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {proofFile ? 'Replace file' : 'Choose file'}
                </Button>
              </div>
            </Field>

            <Field label="Notes" htmlFor="notes" hint="Anything the organisers should know.">
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Optional message…"
              />
            </Field>

            <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end dark:border-ink-800">
              <Button type="button" variant="secondary" onClick={() => navigate(`/events/${eventId}`)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} icon={BanknotesIcon}>
                Submit payment
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>

      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              <CreditCardIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="text-sm text-ink-600 dark:text-ink-300">
              <p className="font-medium text-ink-900 dark:text-white">How verification works</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-ink-500 dark:text-ink-400">
                <li>Pay using one of the club's accepted methods.</li>
                <li>Upload a clear photo or screenshot of the receipt.</li>
                <li>An organiser reviews the proof and confirms your registration.</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PaymentPage;
