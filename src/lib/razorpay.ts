// Razorpay Test Keys
export const RAZORPAY_KEY_ID = 'rzp_test_TIzKly1Z2NMnum';
export const RAZORPAY_KEY_SECRET = '9SehLfvRW6eVtHXtFXzL2Ovm';

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

// Razorpay script ko dynamically load karna
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Payment order create karna
export async function createPaymentOrder(amount: number, bookingDetails: any): Promise<RazorpayOrder | null> {
  try {
    // Vercel function call karenge jo server-side pe order create karega
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount, // paise me (1 INR = 100 paise)
        currency: 'INR',
        receipt: `booking_${Date.now()}`,
        bookingDetails,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment order');
    }

    const order = await response.json();
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return null;
  }
}

// Razorpay checkout open karna
export async function openRazorpayCheckout(
  order: RazorpayOrder,
  customerDetails: { name: string; email: string; phone: string },
  onPaymentSuccess: (result: RazorpayPaymentResult) => void,
  onPaymentFailure: (error: any) => void
): Promise<void> {
  const scriptLoaded = await loadRazorpayScript();
  
  if (!scriptLoaded) {
    onPaymentFailure(new Error('Razorpay SDK load failed'));
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: 'Nexora Salon',
    description: 'Booking Payment',
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

// Payment verify karna (client-side basic verification)
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // Production me ye server-side pe karna chahiye with key secret
  // Abhi basic check
  return orderId && paymentId && signature ? true : false;
}
