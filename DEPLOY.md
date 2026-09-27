# SpotFree: go live, start to finish

Result: your app on a public HTTPS link, real accounts, OTP codes emailed to students, data in a real database. All on free tiers.

```
Phone/PC browser --> Vercel (frontend) --/api/*--> Render (backend) --> Neon (database)
                                                        \--> Resend (sends the OTP emails)
```

Time needed: about 45 minutes, plus waiting for the domain and DNS if you want every student to receive emails.

---
## Part 0. Put the code on GitHub (your own repo)
Vercel and Render deploy from GitHub, so the code must be in a repo you own.

1. On github.com create an **empty** repo, e.g. `spotfree` (no README).
2. In your project folder (the one containing `frontend/` and `backend/`):
   ```bash
   git remote -v                     # if 'origin' points to someone else's repo:
   git remote rename origin upstream
   git remote add origin https://github.com/<your-username>/spotfree.git
   git add -A
   git status                        # make sure NO .env file is listed
   git commit -m "Backend, database and email OTP login"
   git push -u origin main
   ```

## Part 1. Database (Neon)
1. Go to neon.com and sign up. **Create project**, region **Singapore**.
2. On the dashboard click **Connect** and copy the connection string. It looks like `postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
3. Keep it: this is `DATABASE_URL`. (Tables and rooms are created automatically the first time the backend starts.)

## Part 2. Email sending (Resend)
Pick one:

**Option A: quick start (only YOU can receive codes).** Use this to go live today.
1. Sign up at resend.com with the email you want as admin.
2. **API Keys -> Create API Key -> "Sending access"**. Copy it (`re_...`). This is `RESEND_API_KEY`.
3. `MAIL_FROM` = `SpotFree <onboarding@resend.dev>`.
4. Later you must switch to Option B so students can log in.

**Option B: every student can receive codes (needs a domain).**
1. Get a domain. Students: GitHub Student Developer Pack -> free `.me` domain via Namecheap for a year.
2. Resend -> **Domains -> Add Domain**. Enter a subdomain like `mail.yourname.me`.
3. Resend shows DNS records. Add them where your domain's DNS is managed (Namecheap -> Domain List -> Manage -> Advanced DNS):
   - `MX` and `TXT` (SPF) with host `send`
   - `TXT` (DKIM) with host `resend._domainkey`
   - optional: `TXT` host `_dmarc`, value `v=DMARC1; p=none;`
   Paste only the host part Resend shows (not the full domain). If a value gets your domain appended, end it with a `.`.
4. Click **Verify** in Resend. Usually minutes, sometimes up to 72 hours.
5. `MAIL_FROM` = `SpotFree <no-reply@mail.yourname.me>`.
6. Resend free plan: 100 emails/day, 3,000/month.

## Part 3. Backend (Render)
1. Go to render.com, sign up with GitHub.
2. **New -> Blueprint** -> select your repo. Render reads `render.yaml`.
3. It asks for the secret values. Fill in:

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon string from Part 1 |
| `RESEND_API_KEY` | from Part 2 |
| `MAIL_FROM` | from Part 2 |
| `ADMIN_EMAILS` | your email (becomes the first Admin). With Option A it must be the email you signed up to Resend with. |
| `FRONTEND_URL` | `https://placeholder.vercel.app` (fixed in Part 5) |

   `OTP_SECRET` and `SESSION_SECRET` are generated for you.
4. Click **Apply**. Wait for the deploy to finish (a few minutes).
5. Open `https://<your-service-name>.onrender.com/api/health`. You must see `{"ok":true}`.
   If not: Render -> your service -> **Logs**. A line "Invalid production configuration" names what is missing.
6. Copy the service URL (`https://....onrender.com`).

## Part 4. Frontend (Vercel)
1. Go to vercel.com, sign up with GitHub.
2. **Add New -> Project** -> import your repo.
3. **Root Directory: click Edit and choose `frontend`.**
4. **Environment Variables:** `BACKEND_URL` = your Render URL from Part 3 (no trailing slash).
5. Click **Deploy**. When done, you get a URL like `https://spotfree-xxxx.vercel.app`. Open it: the login page must load.

## Part 5. Connect them
Render -> your service -> **Environment** -> set `FRONTEND_URL` to your Vercel URL -> Save. It redeploys by itself.

## Part 6. Check it is really working
On your computer, in the `backend/` folder:
```bash
npm install
npm run smoke -- https://spotfree-xxxx.vercel.app
```
All six lines must say PASS. Then on your phone:
1. Open the Vercel URL, choose **Admin**, enter your `ADMIN_EMAILS` email, tap Send OTP.
2. The code arrives by email (check spam). Enter it. You are in.
3. Profile -> change your display name.

## Part 7. Set up the campus
1. **Rooms:** all rooms start as "No information". Set real statuses as Admin, or let people scan door plaques.
2. **Faculty accounts** (Neon -> SQL Editor):
   ```sql
   INSERT INTO users (public_id, email, name, role, dept)
   VALUES ('HIT-FAC-2001', 'prof.name@heritageit.edu', 'Prof Name', 'Faculty', 'Department of Computer Science & Engineering');
   ```
3. **More admins:** add their emails to `ADMIN_EMAILS` on Render (comma separated), or insert with role `'Admin'`.
4. **Students** sign up themselves with a `@heritageit.edu` or `@heritageit.edu.in` email.
5. **Door plaques:** in `backend/` create `.env` containing `DATABASE_URL=<Neon string>`, run `npm run qr-sheet`, open `qr-sheet.html`, print, stick on doors. (Delete that `.env` afterwards.)

## Part 8. Your own web address (optional)
Vercel -> your project -> **Settings -> Domains** -> add `yourname.me`, then create the DNS records Vercel shows. The `mail.` email records from Part 2 are unaffected. After it works, add the new address to `FRONTEND_URL` on Render.

## Updating later
Edit code, then `git push`. Vercel and Render redeploy automatically.
New semester timetable: edit `HIT_TIMETABLE` in `frontend/lib/mockData.ts`, run `npm run sync` in `backend/`, then push.

## Free-tier behaviour
- Render sleeps after 15 minutes idle. The next request can take up to about a minute.
- Neon sleeps after 5 minutes idle and wakes in under a second.
- Do not use Render's own free Postgres: it expires after 30 days.

## Troubleshooting
| Symptom | Fix |
|---|---|
| All `/api/*` fail (500) on the Vercel site | `BACKEND_URL` missing or wrong. Fix it, then **Redeploy** on Vercel (it is read at build time). |
| "Could not send email" | Render Logs show the Resend error. Domain not verified, or `MAIL_FROM` not on your domain. |
| "Use your campus email" | Address is not `@heritageit.edu(.in)` and has no account. Add it to `ADMIN_EMAILS` or insert it in SQL. |
| Render deploy fails at start | Logs say "Invalid production configuration": fill the named variable. |
| Logged out on every refresh | You are using the Render URL. Always use the Vercel URL. |
| First login very slow | Render waking up. Wait a minute and retry. |
| Codes go to spam | Finish Part 2 Option B including the DMARC record. |
