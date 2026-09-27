import { Router } from 'express';
import { pool } from '../lib/db.js';
import { requireAuth } from '../lib/session.js';

const router = Router();

// Read-only user directory for authenticated administrators.
router.get('/users', requireAuth, async (req, res) => {
  if (String(req.user?.role || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Admin access only.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         public_id,
         email,
         name,
         role,
         dept,
         roll_number,
         branch,
         year,
         semester,
         grp
       FROM users
       ORDER BY
         CASE role
           WHEN 'Admin' THEN 1
           WHEN 'Faculty' THEN 2
           WHEN 'Student' THEN 3
           ELSE 4
         END,
         name ASC`
    );

    res.json({ users: rows });
  } catch (err) {
    console.error('admin users list failed:', err);
    res.status(500).json({ error: 'Could not load users.' });
  }
});

export default router;
