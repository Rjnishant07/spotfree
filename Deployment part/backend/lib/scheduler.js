import { pool } from './db.js';
import { deriveRoom, autoReleaseHistory } from './rooms.js';
import { zonedNow } from './clock.js';
import { addHistory, saveRoom, withTx } from './store.js';

// Persist reservation expiries (once, even with several server instances: row lock + re-check).
export async function sweepExpired() {
  const now = new Date();
  const zNow = zonedNow(now);
  const { rows } = await pool.query('SELECT id, data FROM rooms');
  for (const row of rows) {
    if (!deriveRoom(row.data, zNow).expired) continue;
    await withTx(async (c) => {
      const cur = (await c.query('SELECT data FROM rooms WHERE id = $1 FOR UPDATE', [row.id])).rows[0]?.data;
      if (!cur) return;
      const { room, expired } = deriveRoom(cur, zNow);
      if (!expired) return;
      await saveRoom(c, room);
      if (expired.logged) await addHistory(c, autoReleaseHistory(cur, now));
    });
  }
}

export function startScheduler() {
  const run = () => sweepExpired().catch((e) => console.error('sweepExpired failed:', e.message));
  run();
  return setInterval(run, 60_000);
}
