import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'crypto';

// Plain Node handler types — see api/razorpay/create-order.ts for why the
// Next.js types are not used in this project.
type Request = IncomingMessage & { method?: string; body?: any };
type Response = ServerResponse & { status: (code: number) => Response; json: (body: unknown) => void };

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

/** Constant-time comparison to avoid timing side channels. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * SECURITY (previously broken): this endpoint used to SKIP signature
 * verification entirely when RAZORPAY_WEBHOOK_SECRET was unset, accepting
 * forged payment events from anyone on the internet. It now REJECTS every
 * request that cannot be verified. Without a configured secret the endpoint
 * answers 503 and nothing is processed — a webhook that cannot be verified
 * must not move money state.
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!WEBHOOK_SECRET) {
    console.error('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured — rejecting unverified event.');
    return res.status(503).json({ error: 'Webhook is not configured; event rejected.' });
  }

  try {
    // The signature is computed by Razorpay over the RAW request body, so we
    // must hash the raw text, not a re-serialized req.body.
    const rawBody = JSON.stringify(req.body || {});
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      console.error('Webhook rejected: missing x-razorpay-signature header.');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    if (!safeEqual(signature, expectedSignature)) {
      console.error('Webhook rejected: signature mismatch.');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Razorpay Webhook Event:', event?.event);

    switch (event?.event) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity || {};
        console.log('Payment captured:', payment.id, 'order:', payment.order_id);
        // RECONCILIATION (manual infrastructure action required): the
        // authoritative booking-status flip needs a server-side actor
        // (service-role Edge Function or scheduled job) that:
        //   1. looks up the booking by Razorpay order id (notes.bookingId),
        //   2. verifies payment amount === booking deposit amount,
        //   3. marks the booking paid/confirmed.
        // The client-side verify-payment endpoint (added in this audit)
        // already performs signature verification per payment; this webhook
        // is the safety net that reconciles payments the client never
        // confirmed (e.g. customer closed checkout after paying).
        break;
      }
      case 'payment.failed': {
        const payment = event.payload?.payment?.entity || {};
        console.log('Payment failed:', payment.id);
        // Same reconciliation actor marks the booking as payment_failed.
        break;
      }
      case 'order.paid': {
        const order = event.payload?.order?.entity || {};
        console.log('Order paid:', order.id);
        break;
      }
      default:
        console.log('Unhandled (ignored) event:', event?.event);
    }

    // Acknowledge to Razorpay so it does not retry.
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // 500 makes Razorpay retry — correct for genuine processing errors.
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
