import type { IncomingMessage, ServerResponse } from 'node:http';
import Razorpay from 'razorpay';

// Plain Node handler types — this project ships Vercel serverless functions on
// the Vite framework, not Next.js, so the Next-specific request/response types
// are declared locally (same pattern as api/auth/login.ts).
type Request = IncomingMessage & { method?: string; body?: any };
type Response = ServerResponse & { status: (code: number) => Response; json: (body: unknown) => void };

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = razorpayKeyId && razorpaySecret
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpaySecret,
    })
  : null;

// The PWA talks to the shared Supabase project. The anon key is public by
// design; per-user authorization is enforced by Supabase RLS when we query
// with the caller's JWT below.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qwaehqsmodekbgvnaavz.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3YWVocXNtb2Rla2Jndm5hYXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjQ5MjksImV4cCI6MjEwMDc0MDkyOX0.K92b2vkEb77dyu8fYYZpMTIbTyP98Vo80TaMo_Hmq_E';

/** Sanity cap: no single deposit order above ₹1,00,000 (10,000,000 paise). */
const MAX_ORDER_PAISE = 10_000_000;

/**
 * Decode (without verifying) a Supabase JWT. The signature is verified by
 * Supabase itself when we replay the token against PostgREST — the decode here
 * is only used to read claims before that round-trip.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Verify the caller's Supabase session AND that the session user owns
 * `salonId` (active owner/manager/admin membership via RLS-scoped reads).
 * Returns { ok } or a 401/403 Response.
 */
async function authorizeSession(req: Request, res: Response, salonId: string | undefined): Promise<{ ok: true; userId: string } | { ok: false }> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Authentication required: pass the Supabase session access token (Authorization: Bearer <access_token>).' });
    return { ok: false };
  }
  const claims = decodeJwtPayload(token);
  if (!claims || typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) {
    res.status(401).json({ error: 'Session is missing or expired. Please log in again.' });
    return { ok: false };
  }
  const userId: string = claims.sub;

  // Replay the token against PostgREST: Supabase verifies the signature and
  // applies RLS. Reading organization_members with our own JWT is allowed by
  // the self-read policy; anything else would be rejected.
  const rest = await fetch(`${SUPABASE_URL}/rest/v1/organization_members?select=organization_id,role,status&user_id=eq.${userId}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!rest || !rest.ok) {
    res.status(401).json({ error: 'Could not validate your session. Please log in again.' });
    return { ok: false };
  }
  const members = (await rest.json().catch(() => [])) as Array<{ organization_id: string; role: string; status: string }>;
  const activeOrgs = members.filter(m => m.status === 'active').map(m => m.organization_id);
  if (activeOrgs.length === 0) {
    res.status(403).json({ error: 'No active organization membership found for this account.' });
    return { ok: false };
  }
  if (salonId) {
    // Ownership check for the specific salon — RLS on salons returns only
    // rows this user is allowed to see (their own salons).
    const salonRes = await fetch(`${SUPABASE_URL}/rest/v1/salons?id=eq.${salonId}&deleted_at=is.null&select=id,organization_id`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (!salonRes || !salonRes.ok) {
      res.status(403).json({ error: 'Booking salon could not be validated.' });
      return { ok: false };
    }
    const salons = (await salonRes.json().catch(() => [])) as Array<{ id: string; organization_id: string }>;
    if (!salons.some(s => activeOrgs.includes(s.organization_id))) {
      res.status(403).json({ error: 'You can only create payment orders for your own salon.' });
      return { ok: false };
    }
  }
  return { ok: true, userId };
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!razorpay) {
    return res.status(503).json({ error: 'Payment service is not configured' });
  }

  try {
    const { amount, currency, receipt, bookingDetails } = req.body || {};

    // 1. Authentication + ownership (server-side; client amount is never trusted)
    const auth = await authorizeSession(req, res, typeof bookingDetails?.salonId === 'string' ? bookingDetails.salonId : undefined);
    if (!auth.ok) return;

    // 2. Strict amount validation: integer paise, positive, within sanity cap.
    const amountPaise = Number(amount);
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ error: 'Invalid amount: expected a positive integer in paise.' });
    }
    if (amountPaise > MAX_ORDER_PAISE) {
      return res.status(400).json({ error: 'Amount exceeds the per-order limit.' });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise, // paise
      currency: typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) ? currency : 'INR',
      receipt: (typeof receipt === 'string' && receipt.slice(0, 40)) || `booking_${Date.now()}`,
      payment_capture: true, // auto capture
      notes: {
        bookingId: String(bookingDetails?.bookingId || '').slice(0, 100),
        salonId: String(bookingDetails?.salonId || '').slice(0, 100),
        customerName: String(bookingDetails?.customerName || '').slice(0, 100),
        service: String(bookingDetails?.service || '').slice(0, 100),
        date: String(bookingDetails?.date || '').slice(0, 30),
        time: String(bookingDetails?.time || '').slice(0, 30),
        userId: String(auth.userId || ''),
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
