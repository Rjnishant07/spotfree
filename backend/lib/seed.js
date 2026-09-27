import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from './db.js';
import { clockLabel } from './clock.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '../data', f), 'utf8'));

// The bundled rooms carry made-up demo state (fake occupants, fake class schedules). A real launch starts
// from an honest blank: status unknown until someone verifies it. Timetable rooms stay engine-driven.
function launchState(room) {
  if (room.isTimetableControlled) return room;
  return {
    ...room,
    status: 'NO INFORMATION',
    statusAuthority: 'STUDENT', // anyone can verify an unknown room
    updatedBy: 'System',
    updatedRole: 'STUDENT',
    updatedAt: clockLabel(),
    reservedStart: null,
    reservedEnd: null,
    reservedUntil: null,
    reservationDate: null,
    availableUntil: 'Open',
    timeText: 'Status unverified - check plaque outside door',
    timeline: [{ time: 'All Day', text: 'No schedule information yet', status: 'Active' }],
  };
}

export async function seedData() {
  // The campus room list is real data, so it is always seeded (once).
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM rooms');
  if (rows[0].n === 0) {
    const isProd = process.env.NODE_ENV === 'production';
    const rooms = load('rooms.json').map((r) => (isProd ? launchState(r) : r));
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
