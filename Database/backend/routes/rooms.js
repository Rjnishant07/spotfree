import { Router } from 'express';
import { pool } from '../lib/db.js';
import { requireAuth } from '../lib/session.js';
import { relativeLabel, zonedNow } from '../lib/clock.js';
import {
  ROOM_TYPES, applyAdminOverride, applyBooking, applyStatusUpdate, buildNewRoom, deriveRoom,
} from '../lib/rooms.js';
import { addHistory, addNotification, resolveRoomId, saveRoom, withTx } from '../lib/store.js';

const router = Router();
router.use(requireAuth);

const adminOnly = (req, res, next) =>
  req.user.role === 'Admin' ? next() : res.status(403).json({ error: 'Admin access required.' });

// Everything the app needs in one call (the frontend polls this).
router.get('/state', async (req, res) => {
  const now = new Date();
  const [rooms, hist, notifs] = await Promise.all([
    pool.query('SELECT data FROM rooms ORDER BY pos, id'),
    pool.query('SELECT id, item, relative, created_at FROM status_history ORDER BY created_at DESC, id DESC LIMIT 300'),
    pool.query(
      `SELECT n.id, n.item, n.relative, n.created_at, (r.user_id IS NULL) AS unread
         FROM notifications n
         LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = $1
        ORDER BY n.created_at DESC, n.id DESC LIMIT 100`,
      [req.user.id]
    ),
  ]);
  res.json({
    rooms: rooms.rows.map((r) => r.data),
    history: hist.rows.map((r) => ({ ...r.item, id: Number(r.id), time: r.relative ? relativeLabel(r.created_at, now) : r.item.time })),
    notifications: notifs.rows.map((r) => ({
      ...r.item, id: Number(r.id), unread: r.unread, time: r.relative ? relativeLabel(r.created_at, now) : r.item.time,
    })),
    serverTime: now.toISOString(),
  });
});

// Shared mutation flow: lock the room row, work on its effective state, persist room + history + notification.
async function mutateRoom(req, res, build) {
  const now = new Date();
  const zNow = zonedNow(now);
  try {
    const out = await withTx(async (c) => {
      const id = await resolveRoomId(c, req.params.id);
      if (!id) return { status: 404, error: 'Room not found' };
      const stored = (await c.query('SELECT data FROM rooms WHERE id = $1 FOR UPDATE', [id])).rows[0].data;
      const result = build(deriveRoom(stored, zNow).room, now, zNow);
      if (result.error) return result;
      await saveRoom(c, result.room);
      await addHistory(c, result.history);
      await addNotification(c, result.notification);
      return result;
    });
    if (out.error) return res.status(out.status || 400).json({ error: out.error });
    res.json({ ok: true, room: out.room });
  } catch (err) {
    console.error('room mutation failed:', err);
    res.status(500).json({ error: 'Could not update the room.' });
  }
}

router.post('/rooms/:id/status', (req, res) =>
  mutateRoom(req, res, (room, now, zNow) => applyStatusUpdate(room, req.user, req.body ?? {}, now, zNow)));

router.post('/rooms/:id/book', (req, res) =>
  mutateRoom(req, res, (room, now, zNow) => applyBooking(room, req.user, req.body ?? {}, now, zNow)));

router.post('/rooms/:id/admin-override', adminOnly, (req, res) =>
  mutateRoom(req, res, (room, now) => applyAdminOverride(room, req.user, req.body ?? {}, now)));

router.post('/rooms', adminOnly, async (req, res) => {
  const built = buildNewRoom(req.body ?? {}, req.user, new Date());
  if (built.error) return res.status(built.status).json({ error: built.error });
  try {
    await withTx(async (c) => {
      const exists = await c.query('SELECT 1 FROM rooms WHERE id = $1', [built.room.id]);
      if (exists.rowCount) throw Object.assign(new Error('exists'), { code: 'EXISTS' });
      await c.query(
        'INSERT INTO rooms (id, building, pos, data) VALUES ($1, $2, (SELECT COALESCE(MIN(pos), 0) - 1 FROM rooms), $3)',
        [built.room.id, built.room.building, built.room]
      );
    });
    res.status(201).json({ ok: true, room: built.room });
  } catch (err) {
    if (err.code === 'EXISTS') return res.status(409).json({ error: `Room ${built.room.id} already exists.` });
    console.error('add room failed:', err);
    res.status(500).json({ error: 'Could not add the room.' });
  }
});

router.patch('/rooms/:id', adminOnly, async (req, res) => {
  const { capacity, type } = req.body ?? {};
  if (capacity !== undefined && !(Number.isInteger(Number(capacity)) && capacity >= 1 && capacity <= 1000)) {
    return res.status(400).json({ error: 'Capacity must be 1–1000.' });
  }
  if (type !== undefined && !ROOM_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid room type.' });
  const out = await withTx(async (c) => {
    const id = await resolveRoomId(c, req.params.id);
    if (!id) return null;
    const cur = (await c.query('SELECT data FROM rooms WHERE id = $1 FOR UPDATE', [id])).rows[0].data;
    const room = { ...cur, capacity: capacity !== undefined ? Number(capacity) : cur.capacity, type: type ?? cur.type };
    await saveRoom(c, room);
    return room;
  });
  if (!out) return res.status(404).json({ error: 'Room not found' });
  res.json({ ok: true, room: out });
});

router.post('/notifications/read', async (req, res) => {
  const { id, all } = req.body ?? {};
  if (all) {
    await pool.query(
      'INSERT INTO notification_reads (user_id, notification_id) SELECT $1, id FROM notifications ON CONFLICT DO NOTHING',
      [req.user.id]
    );
  } else if (Number.isInteger(Number(id))) {
    await pool.query(
      'INSERT INTO notification_reads (user_id, notification_id) SELECT $1, id FROM notifications WHERE id = $2 ON CONFLICT DO NOTHING',
      [req.user.id, Number(id)]
    );
  } else return res.status(400).json({ error: 'Invalid request.' });
  res.json({ ok: true });
});

export default router;
