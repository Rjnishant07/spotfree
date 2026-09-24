import { createHmac, timingSafeEqual } from 'crypto';

export const OTP_COOKIE = 'sf_otp';
export const OTP_TTL_SECONDS = 5 * 60;
export const MAX_VERIFY_ATTEMPTS = 5;

const secret = () => {
  const s = process.env.OTP_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('OTP_SECRET is not set');
    return 'dev-only-insecure-secret';
  }
  return s;
};

const sign = (email: string, otp: string, exp: number) =>
  createHmac('sha256', secret()).update(`${email}|${otp}|${exp}`).digest('hex');

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function makeOtpToken(email: string, otp: string): string {
  const exp = Date.now() + OTP_TTL_SECONDS * 1000;
  const payload = { e: email, x: exp, h: sign(email, otp, exp) };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function checkOtpToken(token: string, email: string, otp: string): boolean {
  try {
    const { e, x, h } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (e !== email || typeof x !== 'number' || Date.now() > x) return false;
    const expected = Buffer.from(sign(email, otp, x));
    const given = Buffer.from(String(h));
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

// Best-effort in-memory throttling (per server instance).
const lastSent = new Map<string, number>();
const attempts = new Map<string, number>();

export function canSend(email: string, cooldownMs = 30_000) {
  const t = lastSent.get(email) ?? 0;
  if (Date.now() - t < cooldownMs) return false;
  lastSent.set(email, Date.now());
  attempts.delete(email);
  return true;
}

export function registerAttempt(email: string) {
  const n = (attempts.get(email) ?? 0) + 1;
  attempts.set(email, n);
  return n <= MAX_VERIFY_ATTEMPTS;
}

export function clearAttempts(email: string) {
  attempts.delete(email);
}
