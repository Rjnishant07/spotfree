# SpotFree backend

Express + Postgres API: email OTP login, sessions, rooms, reservations, history, notifications.

## Run locally
```bash
npm install
cp .env.example .env      # fill it in
npm run dev               # http://localhost:4000
```
Frontend (`../frontend`) proxies `/api/*` here, so run both.

## Environment
| Variable | Needed | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (Neon/Supabase). Set `DATABASE_SSL=true` for hosted DBs. |
| `OTP_SECRET`, `SESSION_SECRET` | yes | Two different random strings, 32+ chars: `openssl rand -hex 32`. |
| `RESEND_API_KEY` | yes | resend.com → API Keys → "Sending access". |
| `MAIL_FROM` | for real users | `SpotFree <no-reply@mail.yourdomain.me>` (must be on a domain verified in Resend). |
| `FRONTEND_URL` | prod | Your deployed frontend URL. |
| `ADMIN_EMAILS` | first run | Comma-separated. These emails become Admin accounts on boot. |
| `ALLOWED_EMAIL_DOMAINS` | optional | Who may self-register as Student. Default `heritageit.edu,heritageit.edu.in`. |
| `APP_TIMEZONE` | optional | Default `Asia/Kolkata` (booking hours, timetable, 6 PM rule). |

With `NODE_ENV=production` the server refuses to start if secrets are missing/weak.

## Email that reaches every student (Resend + your own domain)
Until a domain is verified, Resend only delivers to the email you signed up with.

1. **Get a domain.** GitHub Student Developer Pack → Namecheap gives a free `.me` for 1 year (renews at the normal price after that).
2. **Add it in Resend** (Domains → Add Domain). Use a subdomain such as `mail.yourdomain.me`.
3. **Add the DNS records Resend shows** at the place your DNS is managed (Namecheap → Advanced DNS):
   - `MX` and `TXT` (SPF) on the `send` host
   - `TXT` (DKIM) on `resend._domainkey`
   - optional but recommended `TXT` on `_dmarc`: `v=DMARC1; p=none;`
   Paste only the host part (e.g. `send`, not `send.mail.yourdomain.me`). If the MX value gets your domain appended, add a trailing `.`.
4. Click **Verify** in Resend (usually minutes, up to 72 h).
5. Set `MAIL_FROM=SpotFree <no-reply@mail.yourdomain.me>` and test:
   ```bash
   npm run test-mail -- your.address@gmail.com
   ```
   Check the inbox **and spam**.

Resend free plan: 100 emails/day, 3,000/month, 1 domain. One login code = one email.

## Deploying
See `../DEPLOY.md` (Neon + Render + Vercel). After deploying: `npm run smoke -- https://your-frontend-url`.

## Notes
- `lib/rules.generated.js` is a port of the frontend's timetable engine and authority rules. If those change in `frontend/context/SpotFreeContext.tsx`, port the change here too.
- Sample audit history/notifications and demo users are created in development only.
