import { Router } from 'express';
import { pool } from '../lib/db.js';
import { requireAuth } from '../lib/session.js';
import { limitWrites } from '../lib/ratelimit.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const { rows } = isAdmin
      ? await pool.query(
          `SELECT i.id, i.room_id, i.category, i.priority, i.description, i.status,
                  i.created_at, i.updated_at, u.name AS reporter_name, u.email AS reporter_email
             FROM room_issues i
             JOIN users u ON u.id = i.user_id
            ORDER BY i.created_at DESC
            LIMIT 200`
        )
      : await pool.query(
          `SELECT i.id, i.room_id, i.category, i.priority, i.description, i.status,
                  i.created_at, i.updated_at, u.name AS reporter_name, u.email AS reporter_email
             FROM room_issues i
             JOIN users u ON u.id = i.user_id
            WHERE i.user_id = $1
            ORDER BY i.created_at DESC
            LIMIT 100`,
          [req.user.id]
        );
    res.json({ issues: rows });
  } catch (err) {
    console.error('issues list failed:', err);
    res.status(500).json({ error: 'Could not load issue reports.' });
  }
});

router.post('/', limitWrites(10, 60), async (req, res) => {
  const roomId = String(req.body?.roomId || '').trim().slice(0, 80);
  const category = String(req.body?.category || '').trim();
  const priority = String(req.body?.priority || 'Normal').trim();
  const description = String(req.body?.description || '').trim().slice(0, 1000);

  const categories = ['AC','Projector','Lights','Furniture','Cleanliness','Network','Other'];
  const priorities = ['Low','Normal','High','Urgent'];
  if (!roomId || !categories.includes(category) || !priorities.includes(priority) || description.length < 5) {
    return res.status(400).json({ error: 'Provide a room, valid category/priority and a description of at least 5 characters.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO room_issues (user_id, room_id, category, priority, description)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, room_id, category, priority, description, status, created_at, updated_at`,
      [req.user.id, roomId, category, priority, description]
    );
    res.status(201).json({ ok: true, issue: rows[0] });
  } catch (err) {
    console.error('issue report failed:', err);
    res.status(500).json({ error: 'Could not submit the issue.' });
  }
});

router.patch('/:id', async (req, res) => {
  if (String(req.user?.role || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Admin access only.' });
  }
  const id = Number(req.params.id);
  const status = String(req.body?.status || '');
  if (!Number.isInteger(id) || !['Open','In Progress','Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid issue update.' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE room_issues SET status = $1, updated_at = now()
        WHERE id = $2
        RETURNING id, room_id, category, priority, description, status, created_at, updated_at`,
      [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Issue not found.' });
    res.json({ ok: true, issue: rows[0] });
  } catch (err) {
    console.error('issue update failed:', err);
    res.status(500).json({ error: 'Could not update the issue.' });
  }
});

export default router;
