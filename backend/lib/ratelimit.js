import { pool } from './db.js';

/**
 * Fixed-window counter stored in Postgres: shared by all server instances, survives restarts.
 * Returns true if this hit is within `limit` for the current `windowSec` window.
 */
export async function hit(key, limit, windowSec) {
  const { rows } = await pool.query(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END
     RETURNING count`,
    [key, windowSec]
  );
  return rows[0].count <= limit;
}

// Express middleware: per signed-in user, so it is not affected by shared proxy IPs.
export const limitWrites = (limit = 40, windowSec = 60) => async (req, res, next) => {
  if (req.method === 'GET') return next();
  if (await hit(`write:${req.user.id}`, limit, windowSec)) return next();
  res.status(429).json({ error: 'Too many changes too quickly. Wait a moment and try again.' });
};
