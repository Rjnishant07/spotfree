import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb } from './lib/db.js';
import { seedData } from './lib/seed.js';
import { startScheduler } from './lib/scheduler.js';
import otpRoutes from './routes/otp.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';

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

initDb()
  .then(seedData)
  .then(() => {
    startScheduler();
    app.listen(PORT, () => console.log(`SpotFree backend on :${PORT} (${isProd ? 'prod' : 'dev'})`));
  })
  .catch((err) => {
    console.error('Database init failed. Check DATABASE_URL.', err.message);
    process.exit(1);
  });
