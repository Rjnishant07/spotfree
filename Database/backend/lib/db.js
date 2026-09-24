import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const here = dirname(fileURLToPath(import.meta.url));

// Neon/Supabase/Render Postgres need SSL in production.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const ROLE_LABELS = {
  Student: 'Student Member',
  Faculty: 'Faculty Member',
  Admin: 'Facility Administrator',
};

const initials = (name) => {
  const p = name.trim().split(/\s+/);
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : name.trim().slice(0, 2)).toUpperCase();
};

// DB row -> shape the frontend's UserProfile expects
export const toProfile = (u) => ({
  id: u.public_id,
  name: u.name,
  email: u.email,
  role: u.role,
  roleLabel: ROLE_LABELS[u.role],
  avatar: initials(u.name),
  dept: u.dept || 'Heritage Institute of Technology',
  rollNumber: u.roll_number || undefined,
  branch: u.branch || undefined,
  year: u.year || undefined,
  semester: u.semester || undefined,
  group: u.grp || undefined,
});

export async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function initDb() {
  await pool.query(readFileSync(join(here, '../db/schema.sql'), 'utf8'));

  // Admins from env (comma separated emails). Only way to create Admin/Faculty accounts.
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  for (const email of admins) {
    const name = email.split('@')[0].replace(/[._]/g, ' ');
    await pool.query(
      `INSERT INTO users (public_id, email, name, role, dept)
       VALUES ($1, $2, $3, 'Admin', 'Campus Operations & Space Planning')
       ON CONFLICT (email) DO NOTHING`,
      [`HIT-ADM-${email.split('@')[0]}`, email, name]
    );
  }

  // Demo users, dev only
  if (process.env.NODE_ENV !== 'production') {
    const demo = [
      ['2562014', 'nishant.ranjan.ds29@heritageit.edu.in', 'Nishant Ranjan', 'Student', '2562014', 'CSE (Data Science)', '2nd Year', '1st Semester', 'Group 1', 'Department of Computer Science & Engineering (Data Science)'],
      ['HIT-FAC-1001', 'ritwick.banerjee@heritageit.edu', 'Ritwick Banerjee', 'Faculty', null, null, null, null, null, 'Department of Computer Science & Engineering'],
      ['HIT-ADM-1001', 'subhajit.datta@heritageit.edu', 'Subhajit Datta', 'Admin', null, null, null, null, null, 'Campus Operations & Space Planning'],
    ];
    for (const d of demo) {
      await pool.query(
        `INSERT INTO users (public_id, email, name, role, roll_number, branch, year, semester, grp, dept)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (email) DO NOTHING`,
        d
      );
    }
  }
}
