// Razorpay integration (client side).
//
// SECURITY:
//  - RAZORPAY_KEY_ID is a PUBLIC key (safe in bundles). It can be overridden
//    with VITE_RAZORPAY_KEY_ID so a production deployment uses the production
//    key instead of the test default.
//  - RAZORPAY_KEY_SECRET is NEVER in frontend code. All verification happens
//    in api/razorpay/verify-payment.ts (server side).
//  - Payment authority is the server: a booking is only "confirmed" after
//    verifyPaymentServer() returns valid=true. The old client-side
//    "verification" (non-empty strings) has been removed.

import { supabase } from './supabase';

const DEFAULT_RAZORPAY_TEST_KEY_ID = 'rzp_test_TIzKly1Z2NMnum';
const RAZORPAY_KEY_ID: string =
  (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined)?.trim() || DEFAULT_RAZORPAY_TEST_KEY_ID;

/** True while the bundled key is a Razorpay test-mode key. */
export const isRazorpayTestMode = RAZORPAY_KEY_ID.startsWith('rzp_test_');

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RazorpayPaymentResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ServerVerificationResult {
  valid: boolean;
  statusConfirmed?: boolean;
  paymentStatus?: string | null;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

// Razorpay script ko dynamically load karna
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
    if (existing) {
      resolve(!!(window as any).Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Payment order create karna — server-side now requires the Supabase session
// (auth + salon ownership + amount validation in api/razorpay/create-order.ts).
export async function createPaymentOrder(
  amountPaise: number,
  bookingDetails: { bookingId: string; salonId?: string; customerName?: string; service?: string; date?: string; time?: string; staff?: string },
): Promise<RazorpayOrder | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('createPaymentOrder blocked: no Supabase session (payment requires login).');
      return null;
    }
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        amount: amountPaise, // paise me (1 INR = 100 paise)
        currency: 'INR',
        receipt: `booking_${Date.now()}`,
        bookingDetails,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as any;
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to create payment order');
    }
    return payload as RazorpayOrder;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return null;
  }
}

/**
 * SERVER-SIDE signature verification. Only `valid: true` means the payment is
 * cryptographically verified (and, when reachable, confirmed captured).
 */
export async function verifyPaymentServer(
  result: RazorpayPaymentResult,
  expectedAmountPaise?: number,
): Promise<ServerVerificationResult> {
  try {
    const response = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
        expected_amount_paise: expectedAmountPaise,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as any;
    if (!response.ok) {
      return { valid: false, error: payload?.error || 'Payment verification failed.' };
    }
    return {
      valid: Boolean(payload?.valid),
      statusConfirmed: Boolean(payload?.statusConfirmed),
      paymentStatus: payload?.paymentStatus ?? null,
      paymentId: payload?.paymentId,
      orderId: payload?.orderId,
    };
  } catch (error) {
    console.error('verifyPaymentServer network error:', error);
    return { valid: false, error: 'Could not reach the payment verification service. The payment has NOT been confirmed.' };
  }
}

// Razorpay checkout open karna
export async function openRazorpayCheckout(
  order: RazorpayOrder,
  customerDetails: { name: string; email: string; phone: string },
  onPaymentSuccess: (result: RazorpayPaymentResult) => void,
  onPaymentFailure: (error: any) => void,
): Promise<void> {
  const scriptLoaded = await loadRazorpayScript();

  if (!scriptLoaded || !(window as any).Razorpay) {
    onPaymentFailure(new Error('Razorpay SDK load failed'));
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: 'Nexora Salon',
    description: isRazorpayTestMode ? 'Booking Payment (TEST MODE)' : 'Booking Payment',
    order_id: order.id,
    handler: function (response: RazorpayPaymentResult) {
      onPaymentSuccess(response);
    },
    prefill: {
      name: customerDetails.name,
      email: customerDetails.email,
      contact: customerDetails.phone,
    },
    methods: {
      netbanking: true,
      card: true,
      upi: true,
      wallet: true,
    },
    theme: {
      color: '#ac0053',
    },
    modal: {
      ondismiss: function () {
        onPaymentFailure(new Error('Payment cancelled by user'));
      },
    },
  };

  const razorpay = new (window as any).Razorpay(options);
  razorpay.open();
}
