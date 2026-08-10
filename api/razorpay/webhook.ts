import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Webhook signature verify karna
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    if (WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    console.log('Razorpay Webhook Event:', event.event);

    // Payment events handle karna
    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        console.log('Payment captured:', payment.id);
        // Yahan database update karna hai - booking status update
        // TODO: Supabase me booking update karna
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        console.log('Payment failed:', payment.id);
        // TODO: Booking status update to failed
        break;
      }

      case 'order.paid': {
        const order = event.payload.order.entity;
        console.log('Order paid:', order.id);
        // TODO: Booking confirm karna
        break;
      }

      default:
        console.log('Unhandled event:', event.event);
    }

    // Razorpay ko 200 response dena hai
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
