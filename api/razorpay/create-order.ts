import type { IncomingMessage, ServerResponse } from 'node:http';
import Razorpay from 'razorpay';

// Plain Node handler types — this project ships Vercel serverless functions on
// the Vite framework, not Next.js, so the Next-specific request/response types
// are declared locally (same pattern as api/auth/login.ts).
type Request = IncomingMessage & { method?: string; body?: any };
type Response = ServerResponse & { status: (code: number) => Response; json: (body: unknown) => void };

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TIzKly1Z2NMnum',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '9SehLfvRW6eVtHXtFXzL2Ovm',
});

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, receipt, bookingDetails } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Razorpay order create karna
    const order = await razorpay.orders.create({
      amount: amount, // paise me
      currency: currency || 'INR',
      receipt: receipt || `booking_${Date.now()}`,
      payment_capture: true, // auto capture
      notes: {
        bookingId: bookingDetails?.bookingId || '',
        customerName: bookingDetails?.customerName || '',
        service: bookingDetails?.service || '',
        date: bookingDetails?.date || '',
        time: bookingDetails?.time || '',
      },
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: error.message || 'Failed to create order' });
  }
}
