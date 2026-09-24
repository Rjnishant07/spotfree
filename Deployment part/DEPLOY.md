# Deploying SpotFree (all free tiers)

```
Browser -> Vercel (frontend, Next.js) --/api/*--> Render (backend, Express) --> Neon (Postgres)
                                                          \--> Resend (email)
```
The browser only talks to the Vercel URL. Vercel forwards `/api/*` to the backend, so cookies stay same-site.

**Before you start:** the repo must be one you control (your own fork, or you as a collaborator), because Vercel and Render need access to it. Have your Resend key ready (see `backend/README.md`; verify a domain first, or only your own email can receive codes).

## 1. Database (Neon)
1. neon.com -> New project. Region: Singapore (closest to India).
2. Copy the **connection string** (it ends with `?sslmode=require`). This is `DATABASE_URL`.
Tables and the campus rooms are created automatically on first backend start.

## 2. Backend (Render)
1. render.com -> New -> **Blueprint** -> connect the repo. It reads `render.yaml`.
2. Fill in the prompted values:
   - `DATABASE_URL`: from Neon
   - `RESEND_API_KEY`, `MAIL_FROM`: from Resend (`SpotFree <no-reply@mail.yourdomain.me>`)
   - `ADMIN_EMAILS`: your email (becomes the first Admin)
   - `FRONTEND_URL`: any placeholder for now, e.g. `https://placeholder.vercel.app`
3. Deploy, then open `https://<your-service>.onrender.com/api/health`. You should see `{"ok":true}`.
   If it fails, open Render **Logs**: a message starting "Invalid production configuration" names the missing value.

## 3. Frontend (Vercel)
1. vercel.com -> Add New Project -> pick the repo.
2. **Root Directory: `frontend`**.
3. Environment variable: `BACKEND_URL` = your Render URL (no trailing slash).
4. Deploy.

## 4. Point the backend at the frontend
Render -> spotfree-api -> Environment -> set `FRONTEND_URL` to your Vercel URL. It redeploys itself.

## 5. Check everything
From `backend/` on your computer:
```bash
npm run smoke -- https://your-app.vercel.app
```
All six checks should say PASS. Then log in on your phone with the `ADMIN_EMAILS` address, choosing **Admin**.

## Adding faculty / more admins
Students self-register with a campus email. Faculty and admin accounts are created by you. In Neon -> SQL Editor:
```sql
INSERT INTO users (public_id, email, name, role, dept)
VALUES ('HIT-FAC-2001', 'prof.name@heritageit.edu', 'Prof Name', 'Faculty', 'Department of Computer Science & Engineering');
```
They then log in with that email and the **Faculty** role.

## Custom domain (optional)
Vercel -> Project -> Domains -> add your domain, then add the DNS records **Vercel shows you** at your registrar. The email records from Resend live on the `mail.` subdomain and are not affected.

## Free-tier behaviour to expect
- **Render sleeps after 15 min idle;** the next request takes up to about a minute. Fix: a paid instance, or accept it for a college project. (A free uptime monitor pinging `/api/health` every ~10 min keeps it awake, but that is a workaround, not supported by Render.)
- **Neon sleeps after 5 min idle** and wakes in well under a second.
- Do not use Render's own free Postgres: it expires after 30 days. That is why Neon is used.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Every `/api/*` call returns 500 on Vercel | `BACKEND_URL` missing or wrong. Fix it, then **redeploy** (it is read at build time). |
| "Could not send email" | Render Logs show the Resend error. Usually domain not verified or `MAIL_FROM` not on it. |
| Slow first login | Render cold start (see above). |
| Logged out on every refresh | You are calling the Render URL directly. Always use the Vercel URL. |
| "Use your campus email" | The address is not `@heritageit.edu(.in)` and has no account. Add it to `ADMIN_EMAILS` or insert the user in SQL. |
