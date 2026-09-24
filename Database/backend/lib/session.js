import jwt from 'jsonwebtoken';
import { findUserById } from './db.js';

const SESSION_COOKIE = 'sf_session';
const VERIFIED_COOKIE = 'sf_verified';
const isProd = () => process.env.NODE_ENV === 'production';

const secret = () => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (isProd()) throw new Error('SESSION_SECRET is not set');
  return 'dev-only-session-secret';
};

const cookieOpts = (maxAgeMs) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd(),
  maxAge: maxAgeMs,
  path: '/',
});

export function startSession(res, user) {
  const token = jwt.sign({ uid: user.id }, secret(), { expiresIn: '7d' });
  res.cookie(SESSION_COOKIE, token, cookieOpts(7 * 24 * 3600 * 1000));
}

export const endSession = (res) => res.clearCookie(SESSION_COOKIE, { path: '/' });

// Proof that an email passed OTP but has no account yet (used only by /register)
export function markEmailVerified(res, email) {
  const token = jwt.sign({ email, purpose: 'signup' }, secret(), { expiresIn: '15m' });
  res.cookie(VERIFIED_COOKIE, token, cookieOpts(15 * 60 * 1000));
}

export function readVerifiedEmail(req) {
  try {
    const p = jwt.verify(req.cookies?.[VERIFIED_COOKIE], secret());
    return p.purpose === 'signup' ? p.email : null;
  } catch {
    return null;
  }
}

export const clearVerified = (res) => res.clearCookie(VERIFIED_COOKIE, { path: '/' });

export async function readSessionUser(req) {
  try {
    const { uid } = jwt.verify(req.cookies?.[SESSION_COOKIE], secret());
    return (await findUserById(uid)) ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const user = await readSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in.' });
  req.user = user;
  next();
}
