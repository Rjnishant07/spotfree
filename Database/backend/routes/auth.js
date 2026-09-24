import { Router } from 'express';
import { pool, toProfile } from '../lib/db.js';
import { isAllowedDomain } from '../lib/otp.js';
import { clearVerified, endSession, readSessionUser, readVerifiedEmail, requireAuth, startSession } from '../lib/session.js';

const router = Router();
const clean = (v, max = 100) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// 200 with user:null when signed out, so the browser console stays free of 401 noise on every page load.
router.get('/me', async (req, res) => {
  const user = await readSessionUser(req);
  res.json({ user: user ? toProfile(user) : null });
});

router.post('/logout', (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});

// Self-registration is Student-only and requires the email to have just passed OTP.
router.post('/register', async (req, res) => {
  const email = readVerifiedEmail(req);
  const b = req.body ?? {};
  if (!email || email !== String(b.email ?? '').trim().toLowerCase()) {
    return res.status(403).json({ error: 'Verify your email with OTP first.' });
  }
  if (!isAllowedDomain(email)) {
    return res.status(403).json({ error: 'Only campus emails can create an account.' });
  }
  const name = clean(b.name);
  if (!name) return res.status(400).json({ error: 'Full name is required.' });

  const rollNumber = clean(b.rollNumber, 30) || null;
  const publicId = rollNumber || `HIT-STU-${Math.floor(100000 + Math.random() * 900000)}`;
  const branch = clean(b.branch) || null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (public_id, email, name, role, roll_number, branch, year, semester, grp, dept)
       VALUES ($1,$2,$3,'Student',$4,$5,$6,$7,$8,$9) RETURNING *`,
      [publicId, email, name, rollNumber, branch, clean(b.year, 30) || null, clean(b.semester, 30) || null,
       clean(b.group, 30) || null, branch ? `Dept of ${branch}` : 'Heritage Institute of Technology']
    );
    clearVerified(res);
    startSession(res, rows[0]);
    res.status(201).json({ user: toProfile(rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      const dupRoll = String(err.detail || '').includes('public_id');
      return res.status(409).json({ error: dupRoll ? 'That roll number is already registered.' : 'An account with this email already exists.' });
    }
    console.error('register failed:', err);
    res.status(500).json({ error: 'Could not create account.' });
  }
});

// Email and role can never be changed here.
router.patch('/profile', requireAuth, async (req, res) => {
  const b = req.body ?? {};
  const name = clean(b.name) || req.user.name;
  const { rows } = await pool.query(
    `UPDATE users SET name=$1, roll_number=$2, branch=$3, year=$4, semester=$5, grp=$6 WHERE id=$7 RETURNING *`,
    [
      name,
      b.rollNumber !== undefined ? clean(b.rollNumber, 30) || null : req.user.roll_number,
      b.branch !== undefined ? clean(b.branch) || null : req.user.branch,
      b.year !== undefined ? clean(b.year, 30) || null : req.user.year,
      b.semester !== undefined ? clean(b.semester, 30) || null : req.user.semester,
      b.group !== undefined ? clean(b.group, 30) || null : req.user.grp,
      req.user.id,
    ]
  );
  res.json({ user: toProfile(rows[0]) });
});

export default router;
