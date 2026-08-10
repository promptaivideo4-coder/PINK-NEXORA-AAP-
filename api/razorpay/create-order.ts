import { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TIzKly1Z2NMnum',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '9SehLfvRW6eVtHXtFXzL2Ovm',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      payment_capture: 1, // auto capture
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
