import { useState, useEffect, useRef, useCallback } from 'react';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { CreditCard, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

// ─── Put your Stripe publishable key here ─────────────────────────────────────
const STRIPE_PK = 'pk_test_51TLXDnBkXtPmcfWHOvgqWvSvuC2gMh7SpYHVkodNk6shqiNU7Fs62xv31KrDMJBg26ELMPLvcXSYRgv6cNQwnPSP00OmgxDNDS';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentType = 'booking' | 'subscription';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: PaymentType;
  /** bookingId when type='booking', subscriptionId when type='subscription' */
  resourceId: number;
  /** Human-readable label shown in the modal, e.g. "Basic Plan — EGP 150" */
  label: string;
  amount?: number; // in EGP, for display only
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// ─── Stripe singleton — load once at module level ────────────────────────────
const stripePromise = loadStripe(STRIPE_PK);

// ─── Component ────────────────────────────────────────────────────────────────

export const PaymentModal = ({
  open,
  onClose,
  onSuccess,
  type,
  resourceId,
  label,
  amount,
}: PaymentModalProps) => {
  const [stripe, setStripe]           = useState<Stripe | null>(null);
  const [card, setCard]               = useState<StripeCardElement | null>(null);
  const [status, setStatus]           = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // We keep a ref to the mounted card element so we can unmount it on cleanup.
  const cardElRef = useRef<StripeCardElement | null>(null);

  // Load Stripe once on mount
  useEffect(() => {
    stripePromise.then(setStripe);
  }, []);

  // Reset state when modal closes and unmount the card element
  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setErrorMessage('');
      // Unmount & discard the card element so the next open starts fresh
      if (cardElRef.current) {
        cardElRef.current.unmount();
        cardElRef.current = null;
        setCard(null);
      }
    }
  }, [open]);

  // ── Callback ref ────────────────────────────────────────────────────────────
  // This fires with the real DOM node the moment the DialogContent renders the
  // card container div — no timing issue, no need for cardMounted guards.
  const cardContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Called with null when the element unmounts — nothing to do
      if (!node) return;
      // Called with the DOM node when it mounts — but Stripe might not be ready yet
      if (!stripe) return;
      // Already mounted (e.g. StrictMode double-invoke) — skip
      if (cardElRef.current) return;

      const elements = stripe.elements();
      const cardEl = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#34495E',
            fontFamily: '"Inter", sans-serif',
            '::placeholder': { color: '#A0AEC0' },
          },
          invalid: { color: '#FF6F61' },
        },
      });

      cardEl.mount(node);
      cardElRef.current = cardEl;
      setCard(cardEl);
    },
    // Re-run if stripe loads after the node has already appeared in the DOM
    [stripe],
  );

  // ── If Stripe loads AFTER the card container is already in the DOM ──────────
  // The callback ref won't re-fire on its own when `stripe` changes, so we
  // keep a separate ref to the DOM node and trigger mounting manually.
  const domNodeRef = useRef<HTMLDivElement | null>(null);

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      domNodeRef.current = node;
      cardContainerRef(node);
    },
    [cardContainerRef],
  );

  // When Stripe becomes available and the node is already rendered, mount now.
  useEffect(() => {
    if (stripe && domNodeRef.current && !cardElRef.current) {
      cardContainerRef(domNodeRef.current);
    }
  }, [stripe, cardContainerRef]);

  // ── Payment handler ─────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!stripe || !card) return;
    setStatus('loading');
    setErrorMessage('');

    try {
      // Step 1: Get client secret from your API
      const endpoint =
        type === 'booking'
          ? `/Payment/Pay-Booking/${resourceId}`
          : `/Payment/Pay-Subscription/${resourceId}`;

      const clientSecret = await api.post<string>(endpoint, {});

      if (!clientSecret) {
        throw new Error('No client secret returned from server.');
      }

      // Step 2: Confirm card payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        setStatus('error');
        setErrorMessage(result.error.message || 'Payment failed.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        setStatus('success');
        toast.success('Payment successful!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#00A5A7]" />
            Complete Payment
          </DialogTitle>
          <DialogDescription className="text-[#717182]">
            {label}
            {amount ? (
              <span className="block mt-1 text-[#FF6F61] font-semibold text-base">
                EGP {amount.toLocaleString()}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Success state */}
          {status === 'success' && (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle className="w-14 h-14 text-[#B8E986]" />
              <p className="text-[#34495E] font-semibold text-lg">Payment Successful!</p>
              <p className="text-[#717182] text-sm text-center">
                {type === 'booking'
                  ? 'Your booking is confirmed. Landlord contact details are now unlocked.'
                  : 'Your subscription is now active.'}
              </p>
            </div>
          )}

          {/* Error banner */}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-3 bg-[#FF6F61]/10 border border-[#FF6F61]/30 rounded-lg">
              <XCircle className="w-5 h-5 text-[#FF6F61] flex-shrink-0 mt-0.5" />
              <p className="text-[#FF6F61] text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Card input — always rendered (but invisible) until success so the
              Stripe iframe keeps its DOM node. Hidden via CSS, not unmounted. */}
          <div style={{ display: status === 'success' ? 'none' : 'block' }}>
            <div>
              <label className="block text-sm font-medium text-[#34495E] mb-2">
                Card Details
              </label>
              {/* combinedRef attaches Stripe's card element the moment this div exists */}
              <div
                ref={combinedRef}
                className="border border-gray-200 rounded-lg p-3 bg-white focus-within:border-[#00A5A7] transition-colors min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#717182] mt-3">
              <Lock className="w-3.5 h-3.5" />
              <span>Payments are secured and encrypted by Stripe</span>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={status === 'loading'}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePay}
                disabled={status === 'loading' || !stripe || !card}
                className="flex-1 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Pay${amount ? ` EGP ${amount.toLocaleString()}` : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
