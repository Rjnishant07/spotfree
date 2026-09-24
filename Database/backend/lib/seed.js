import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '../data', f), 'utf8'));

export async function seedData() {
  // The campus room list is real data, so it is always seeded (once).
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM rooms');
  if (rows[0].n === 0) {
    const rooms = load('rooms.json');
    for (const [i, r] of rooms.entries()) {
      await pool.query('INSERT INTO rooms (id, building, pos, data) VALUES ($1, $2, $3, $4)', [r.id, r.building, i, r]);
    }
    console.log(`Seeded ${rooms.length} rooms`);
  }

  // Sample audit log + notifications: development only.
  if (process.env.NODE_ENV === 'production') return;
  const h = await pool.query('SELECT count(*)::int AS n FROM status_history');
  if (h.rows[0].n === 0) {
    for (const [i, { id, ...item }] of load('demo-history.json').entries()) {
      await pool.query(
        `INSERT INTO status_history (room_id, item, relative, created_at) VALUES ($1, $2, false, now() - ($3 || ' minutes')::interval)`,
        [item.room, item, String(i + 1)]
      );
    }
  }
  const n = await pool.query('SELECT count(*)::int AS n FROM notifications');
  if (n.rows[0].n === 0) {
    for (const [i, { id, unread, ...item }] of load('demo-notifications.json').entries()) {
      await pool.query(
        `INSERT INTO notifications (item, relative, created_at) VALUES ($1, false, now() - ($2 || ' minutes')::interval)`,
        [item, String(i + 1)]
      );
    }
  }
}
