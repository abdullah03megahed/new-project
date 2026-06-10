import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { CreditCard, Lock, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentType = 'booking' | 'subscription';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: PaymentType;
  /** bookingId when type='booking', subscriptionId when type='subscription' */
  resourceId: number;
  label: string;
  amount?: number;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────
//
// IMPORTANT: The backend returns { url: string } from both payment endpoints.
// This is a Stripe Checkout hosted URL — the user must be redirected there.
// The old implementation tried to use a Stripe client secret + card element,
// which is the wrong flow for this backend.
//
// Correct flow:
//   1. POST /Payment/Pay-Booking/{id}  OR  POST /Payment/Pay-Subscription/{id}
//   2. Backend returns { url: "https://checkout.stripe.com/..." }
//   3. Redirect user to that URL
//   4. Stripe handles payment and redirects back to your site
//

export const PaymentModal = ({
  open,
  onClose,
  onSuccess,
  type,
  resourceId,
  label,
  amount,
}: PaymentModalProps) => {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePay = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const endpoint = type === 'booking'
        ? `/Payment/Pay-Booking/${resourceId}`
        : `/Payment/Pay-Subscription/${resourceId}`;

      // Backend returns { url: "https://checkout.stripe.com/..." }
      const response = await api.post<{ url: string }>(endpoint, {});

      if (!response?.url) {
        throw new Error('No payment URL returned from server.');
      }

      // Redirect to Stripe Checkout
      window.location.href = response.url;

      // Note: onSuccess will be called when the user returns from Stripe
      // via the success redirect URL configured on the backend.
      // We set status to success optimistically so the modal looks right
      // before the redirect happens.
      setStatus('success');

    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
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
              <p className="text-[#34495E] font-semibold text-lg">Redirecting to payment...</p>
              <p className="text-[#717182] text-sm text-center">
                You are being redirected to Stripe to complete your payment securely.
              </p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex items-start gap-3 p-3 bg-[#FF6F61]/10 border border-[#FF6F61]/30 rounded-lg">
              <XCircle className="w-5 h-5 text-[#FF6F61] flex-shrink-0 mt-0.5" />
              <p className="text-[#FF6F61] text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Idle / ready to pay */}
          {status !== 'success' && (
            <>
              {/* Info box explaining the flow */}
              <div className="p-4 bg-[#00A5A7]/5 border border-[#00A5A7]/20 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-[#34495E] text-sm font-medium">
                  <ExternalLink className="w-4 h-4 text-[#00A5A7]" />
                  Secure Stripe Checkout
                </div>
                <p className="text-[#717182] text-xs leading-relaxed">
                  Clicking "Pay Now" will redirect you to Stripe's secure payment page.
                  After payment, you'll be brought back to the app automatically.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#717182]">
                <Lock className="w-3.5 h-3.5" />
                <span>Payments are secured and encrypted by Stripe</span>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={status === 'loading'}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePay}
                  disabled={status === 'loading'}
                  className="flex-1 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      {`Pay${amount ? ` EGP ${amount.toLocaleString()}` : ''}`}
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
