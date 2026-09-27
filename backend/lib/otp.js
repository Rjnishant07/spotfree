import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { pool } from './db.js';
import { hit } from './ratelimit.js';

export const OTP_TTL_SECONDS = 5 * 60;
export const COOLDOWN_SECONDS = 30;
export const MAX_VERIFY_ATTEMPTS = 5;
export const MAX_SENDS_PER_HOUR = 5;

const secret = () => {
  if (process.env.OTP_SECRET) return process.env.OTP_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('OTP_SECRET is not set');
  return 'dev-only-insecure-secret';
};

export const normalizeEmail = (e) => String(e ?? '').trim().toLowerCase();

const hashCode = (email, code) => createHmac('sha256', secret()).update(`${email}|${code}`).digest('hex');

export function isAllowedDomain(email) {
  const domains = (process.env.ALLOWED_EMAIL_DOMAINS || 'heritageit.edu,heritageit.edu.in')
    .split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  return domains.includes(email.split('@')[1]);
}

/** Create (or replace) the active code for an email. Enforces cooldown and an hourly send cap. */
export async function issueCode(email) {
  const prev = await pool.query(
    `SELECT GREATEST(0, $2 - EXTRACT(EPOCH FROM (now() - created_at)))::int AS wait FROM login_codes WHERE email = $1`,
    [email, COOLDOWN_SECONDS]
  );
  if (prev.rows[0]?.wait > 0) return { error: `Please wait ${prev.rows[0].wait} seconds before requesting another code.` };
  if (!(await hit(`send:${email}`, MAX_SENDS_PER_HOUR, 3600))) {
    return { error: 'Too many codes requested for this email. Try again in an hour.' };
  }

  const code = String(randomInt(100000, 1000000));
  await pool.query(
    `INSERT INTO login_codes (email, code_hash, expires_at, attempts, created_at)
     VALUES ($1, $2, now() + make_interval(secs => $3), 0, now())
     ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = now()`,
    [email, hashCode(email, code), OTP_TTL_SECONDS]
  );
  return { code };
}

export const discardCode = (email) => pool.query('DELETE FROM login_codes WHERE email = $1', [email]);

/**
 * Check a code. Every check burns one attempt (atomic), so guessing is capped per issued code.
 * Does NOT consume the code; call discardCode() once the login actually succeeds.
 * Returns { ok: true } | { error, status }.
 */
export async function checkCode(email, code) {
  const { rows } = await pool.query(
    `UPDATE login_codes SET attempts = attempts + 1
      WHERE email = $1 AND expires_at > now() AND attempts < $2
      RETURNING code_hash`,
    [email, MAX_VERIFY_ATTEMPTS]
  );
  if (!rows.length) {
    const locked = await pool.query('SELECT 1 FROM login_codes WHERE email = $1 AND expires_at > now()', [email]);
    return locked.rowCount
      ? { error: 'Too many attempts. Request a new code.', status: 429 }
      : { error: 'Invalid or expired code.', status: 401 };
  }
  const a = Buffer.from(rows[0].code_hash);
  const b = Buffer.from(hashCode(email, code));
  return a.length === b.length && timingSafeEqual(a, b)
    ? { ok: true }
    : { error: 'Invalid or expired code.', status: 401 };
}
