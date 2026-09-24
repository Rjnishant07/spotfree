import { createHmac, timingSafeEqual } from 'crypto';

export const OTP_COOKIE = 'sf_otp';
export const OTP_TTL_SECONDS = 300;
const MAX_ATTEMPTS = 5;

const secret = () => {
  if (process.env.OTP_SECRET) return process.env.OTP_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('OTP_SECRET is not set');
  return 'dev-only-insecure-secret';
};

const sign = (email, otp, exp) =>
  createHmac('sha256', secret()).update(`${email}|${otp}|${exp}`).digest('hex');

export const normalizeEmail = (e) => String(e ?? '').trim().toLowerCase();

export function makeToken(email, otp) {
  const x = Date.now() + OTP_TTL_SECONDS * 1000;
  return Buffer.from(JSON.stringify({ e: email, x, h: sign(email, otp, x) })).toString('base64url');
}

export function checkToken(token, email, otp) {
  try {
    const { e, x, h } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (e !== email || typeof x !== 'number' || Date.now() > x) return false;
    const a = Buffer.from(sign(email, otp, x));
    const b = Buffer.from(String(h));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const lastSent = new Map();
const attempts = new Map();

export function canSend(email, cooldownMs = 30_000) {
  if (Date.now() - (lastSent.get(email) ?? 0) < cooldownMs) return false;
  lastSent.set(email, Date.now());
  attempts.delete(email);
  return true;
}

export function registerAttempt(email) {
  const n = (attempts.get(email) ?? 0) + 1;
  attempts.set(email, n);
  return n <= MAX_ATTEMPTS;
}

export const clearAttempts = (email) => attempts.delete(email);

export function isAllowedDomain(email) {
  const domains = (process.env.ALLOWED_EMAIL_DOMAINS || 'heritageit.edu,heritageit.edu.in')
    .split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  return domains.includes(email.split('@')[1]);
}
