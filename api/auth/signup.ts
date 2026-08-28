import type { IncomingMessage, ServerResponse } from 'node:http';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qwaehqsmodekbgvnaavz.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3YWVocXNtb2Rla2Jndm5hYXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjQ5MjksImV4cCI6MjEwMDc0MDkyOX0.K92b2vkEb77dyu8fYYZpMTIbTyP98Vo80TaMo_Hmq_E';

type Request = IncomingMessage & { method?: string; body?: unknown };
type Response = ServerResponse & { status: (code: number) => Response; json: (body: unknown) => void };

/**
 * Supabase rejects passwords that are missing one of its required character
 * groups with the cryptic "should contain at least one character of each:
 * abcdefghijklmnopqrstuvwxyz, ..." message. Guard it here so the client
 * always receives wording the owner can act on.
 */
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters, with one lowercase letter (a-z), one uppercase letter (A-Z) and one number (0-9).';

function passwordIssue(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) return PASSWORD_MESSAGE;
  if (password.length < 8) return PASSWORD_MESSAGE;
  if (!/[a-z]/.test(password)) return PASSWORD_MESSAGE;
  if (!/[A-Z]/.test(password)) return PASSWORD_MESSAGE;
  if (!/[0-9]/.test(password)) return PASSWORD_MESSAGE;
  return null;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  const body = (req.body || {}) as { password?: unknown };
  const issue = passwordIssue(body.password);
  if (issue) return res.status(400).json({ error: { message: issue } });

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({ error: { message: 'Unable to reach the authentication service. Please try again.' } });
  }
}
