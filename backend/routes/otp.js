import { Router } from 'express';
import { isMailConfigured, sendOtpEmail } from '../lib/mailer.js';
import { findUserByEmail, toProfile } from '../lib/db.js';
import { markEmailVerified, startSession } from '../lib/session.js';
import { checkCode, discardCode, isAllowedDomain, issueCode, normalizeEmail } from '../lib/otp.js';

const router = Router();
const isProd = process.env.NODE_ENV === 'production';

router.post('/send', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  // Only registered users or campus-domain emails can receive codes (protects your email quota).
  if (!isAllowedDomain(email) && !(await findUserByEmail(email))) {
    return res.status(403).json({ error: 'Use your campus email (@heritageit.edu).' });
  }

  const mailed = isMailConfigured();
  if (!mailed && isProd) return res.status(500).json({ error: 'Email service is not configured.' });

  const issued = await issueCode(email);
  if (issued.error) return res.status(429).json({ error: issued.error });

  if (!mailed) {
    console.log(`[SpotFree OTP - mail not configured] ${email}: ${issued.code}`);
  } else {
    try {
      await sendOtpEmail(email, issued.code);
    } catch (err) {
      console.error('OTP email failed:', err.message);
      await discardCode(email); // let the user retry straight away
      return res.status(502).json({ error: 'Could not send email. Try again.' });
    }
  }
  res.json({ ok: true, mailed });
});

router.post('/verify', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp ?? '').trim();
  const wantedRole = String(req.body?.role ?? '').toLowerCase();

  if (!email || !/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'Invalid or expired code.' });

  const result = await checkCode(email, otp);
  if (!result.ok) return res.status(result.status).json({ error: result.error });

  const user = await findUserByEmail(email);

  if (user) {
    // Role comes from the database, never from the client. The code stays valid so they can pick the right role.
    if (wantedRole && user.role.toLowerCase() !== wantedRole) {
      return res.status(403).json({ error: `This email is registered as ${user.role}. Select ${user.role} to continue.` });
    }
    await discardCode(email);
    startSession(res, user);
    return res.json({ ok: true, registered: true, user: toProfile(user) });
  }

  // Valid code, no account yet: let them finish sign-up.
  await discardCode(email);
  markEmailVerified(res, email);
  res.json({ ok: true, registered: false, email });
});

export default router;
