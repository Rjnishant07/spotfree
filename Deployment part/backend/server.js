import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { checkEnv } from './lib/env.js';
import { initDb } from './lib/db.js';
import { seedData } from './lib/seed.js';
import { startScheduler } from './lib/scheduler.js';
import otpRoutes from './routes/otp.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';

checkEnv();

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/otp', otpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', roomRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// Express 5 forwards errors from async handlers here, so a database hiccup returns a 500 instead of crashing.
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  const bad = err?.type === 'entity.parse.failed' || err?.status === 400;
  res.status(bad ? 400 : 500).json({ error: bad ? 'Invalid request.' : 'Something went wrong. Try again.' });
});

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

// Hosted databases (Neon) may take a few seconds to wake up: retry before giving up.
async function connectWithRetry(attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      await initDb();
      return;
    } catch (err) {
      if (i >= attempts) throw err;
      console.warn(`Database not ready (${err.message}). Retry ${i}/${attempts - 1} in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

connectWithRetry()
  .then(seedData)
  .then(() => {
    startScheduler();
    app.listen(PORT, () => console.log(`SpotFree backend on :${PORT} (${isProd ? 'prod' : 'dev'})`));
  })
  .catch((err) => {
    console.error('Database init failed. Check DATABASE_URL.', err.message);
    process.exit(1);
  });
