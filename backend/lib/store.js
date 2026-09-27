import { pool } from './db.js';
import { cleanKey } from './rooms.js';

export async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Accepts an exact id, a punctuation-insensitive id ("CME 604"), or the room number ("604").
export async function resolveRoomId(client, key) {
  const wanted = cleanKey(key);
  if (!wanted) return null;
  const { rows } = await client.query('SELECT id, data FROM rooms');
  const hit = rows.find(
    (r) => r.id === key || cleanKey(r.id) === wanted || (r.data.roomNumber && cleanKey(r.data.roomNumber) === wanted)
  );
  return hit ? hit.id : null;
}

export const saveRoom = (c, room) =>
  c.query('UPDATE rooms SET data = $2, updated_at = now() WHERE id = $1', [room.id, room]);

export const addHistory = (c, item) =>
  c.query('INSERT INTO status_history (room_id, item) VALUES ($1, $2)', [item.room, item]);

export const addNotification = (c, item) =>
  c.query('INSERT INTO notifications (item) VALUES ($1)', [item]);
