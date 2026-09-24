import { Router } from 'express';
import { randomInt } from 'crypto';
import { isMailConfigured, sendOtpEmail } from '../lib/mailer.js';
import { findUserByEmail, toProfile } from '../lib/db.js';
import { markEmailVerified, startSession } from '../lib/session.js';
import {
  OTP_COOKIE, OTP_TTL_SECONDS, canSend, checkToken, clearAttempts,
  isAllowedDomain, makeToken, normalizeEmail, registerAttempt,
} from '../lib/otp.js';

const router = Router();
const isProd = process.env.NODE_ENV === 'production';

router.post('/send', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  // Only registered users or campus-domain emails can receive codes (protects your email quota).
  if (!isAllowedDomain(email) && !(await findUserByEmail(email))) {
    return res.status(403).json({ error: 'Use your campus email (@heritageit.edu).' });
  }
  if (!canSend(email)) {
    return res.status(429).json({ error: 'Please wait 30 seconds before requesting another code.' });
  }

  const otp = String(randomInt(100000, 1000000));
  const mailed = isMailConfigured();

  if (!mailed) {
    if (isProd) return res.status(500).json({ error: 'Email service is not configured.' });
    console.log(`[SpotFree OTP - mail not configured] ${email}: ${otp}`);
  } else {
    try {
      await sendOtpEmail(email, otp);
    } catch (err) {
      console.error('OTP email failed:', err);
      return res.status(502).json({ error: 'Could not send email. Try again.' });
    }
  }

  res.cookie(OTP_COOKIE, makeToken(email, otp), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: OTP_TTL_SECONDS * 1000,
    path: '/',
  });
  res.json({ ok: true, mailed });
});

router.post('/verify', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp ?? '').trim();
  const wantedRole = String(req.body?.role ?? '').toLowerCase();
  const token = req.cookies?.[OTP_COOKIE];

  if (!token || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Invalid or expired code.' });
  }
  if (!registerAttempt(email)) {
    return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
  }
  if (!checkToken(token, email, otp)) {
    return res.status(401).json({ error: 'Invalid or expired code.' });
  }

  const user = await findUserByEmail(email);

  if (user) {
    // Role comes from the database, never from the client.
    if (wantedRole && user.role.toLowerCase() !== wantedRole) {
      return res.status(403).json({ error: `This email is registered as ${user.role}. Select ${user.role} to continue.` });
    }
    clearAttempts(email);
    res.clearCookie(OTP_COOKIE, { path: '/' });
    startSession(res, user);
    return res.json({ ok: true, registered: true, user: toProfile(user) });
  }

  // Valid code, no account yet: let them finish sign-up.
  clearAttempts(email);
  res.clearCookie(OTP_COOKIE, { path: '/' });
  markEmailVerified(res, email);
  res.json({ ok: true, registered: false, email });
});

export default router;
