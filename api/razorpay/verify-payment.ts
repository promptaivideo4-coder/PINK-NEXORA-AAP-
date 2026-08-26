import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'crypto';

// Plain Node handler types — see api/razorpay/create-order.ts for why the
// Next.js types are not used in this project.
type Request = IncomingMessage & { method?: string; body?: any };
type Response = ServerResponse & { status: (code: number) => Response; json: (body: unknown) => void };

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

/** Constant-time comparison to avoid timing side channels. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * SERVER-SIDE payment verification (the missing half of the payment loop).
 *
 * Before this endpoint existed, the client "verified" payments with a
 * non-empty-string check (`verifyPaymentSignature` in src/lib/razorpay.ts),
 * so a booking was declared confirmed on the client's say-so. Now the client
 * sends the three Razorpay fields and this endpoint:
 *   1. verifies HMAC-SHA256(order_id|payment_id) with the server-only
 *      RAZORPAY_KEY_SECRET, and
 *   2. (best effort) re-reads the payment from the Razorpay API and requires
 *      status === 'captured'.
 *
 * Only a 200 with `valid: true` may be treated as a paid booking.
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!razorpayKeyId || !razorpaySecret) {
    // Never fake a success: without the secret we cannot verify, and an
    // unverified "success" is exactly the bug this endpoint replaces.
    return res.status(503).json({ error: 'Payment verification is not configured (missing Razorpay server keys).' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, expected_amount_paise } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required.' });
  }

  const expected = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (!safeEqual(String(razorpay_signature), expected)) {
    console.error('Payment signature INVALID — rejecting confirmation.', { order: razorpay_order_id, payment: razorpay_payment_id });
    return res.status(400).json({ valid: false, error: 'Payment signature verification failed.' });
  }

  // Best-effort server-side status re-check against Razorpay's API.
  let statusConfirmed = false;
  let paymentStatus: string | null = null;
  try {
    const auth = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');
    const r = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(String(razorpay_payment_id))}`, {
      headers: { Authorization: auth },
    });
    if (r.ok) {
      const p = (await r.json()) as { status?: string; amount?: number; amount_paid?: number; order_id?: string };
      paymentStatus = p.status ?? null;
      statusConfirmed = p.status === 'captured';
      // Amount guard: if the caller told us the expected paise, enforce it.
      if (Number.isInteger(Number(expected_amount_paise)) && Number(p.amount_paid ?? p.amount) !== Number(expected_amount_paise)) {
        console.error('Payment amount MISMATCH', { order: razorpay_order_id, payment: razorpay_payment_id, expected: expected_amount_paise, actual: p.amount_paid ?? p.amount });
        return res.status(400).json({ valid: false, error: 'Payment amount does not match the expected deposit.' });
      }
    }
  } catch (e) {
    // Razorpay API unreachable — the signature check above already passed;
    // report success with statusConfirmed=false so the caller can decide.
    console.warn('Razorpay status re-check failed (signature was valid):', (e as Error)?.message);
  }

  return res.status(200).json({
    valid: statusConfirmed || paymentStatus === null,
    statusConfirmed,
    paymentStatus,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });
}
