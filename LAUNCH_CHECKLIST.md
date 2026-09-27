# SpotFree launch checklist

Tick these in order. Deploy steps themselves are in `DEPLOY.md`.

## 1. Accounts and keys (start early, some take days)
- [ ] GitHub Student Pack approved, free domain claimed (optional but needed for email to reach everyone)
- [ ] Resend: domain verified, `npm run test-mail -- your@gmail.com` arrives (check spam)
- [ ] Neon project created, Render + Vercel connected to a repo you control

## 2. Deploy
- [ ] Follow `DEPLOY.md` steps 1-4
- [ ] `npm run smoke -- https://your-app.vercel.app` shows six PASS

## 3. Set up the campus
- [ ] Log in as Admin with the `ADMIN_EMAILS` address (pick **Admin**). Fix your display name in Profile.
- [ ] Rooms start as **No information** (except timetable rooms CB601 and Library). Set real statuses as Admin, or let people verify them by scanning.
- [ ] Add faculty (SQL snippet in `DEPLOY.md`) and any missing rooms (Admin -> Manage Rooms)
- [ ] Print door plaques: in `backend/`, put the **production** `DATABASE_URL` in `.env`, run `npm run qr-sheet`, open `qr-sheet.html`, print. Stick one on each door.

## 4. Ten-minute phone test (use mobile data, not only Wi-Fi)
- [ ] Sign up as a student with a campus email: the code arrives within a minute
- [ ] Log out, log in again with a new code
- [ ] Choose the wrong role on login: you get a clear "registered as ..." message
- [ ] In-app scanner: allow the camera, scan a printed plaque, the room opens
- [ ] Update a room's status; on a second phone logged in as faculty it appears within about 10 seconds
- [ ] As a student, try to change a room a faculty member controls: it is refused with a reason
- [ ] Book a vacant room for tomorrow (9 AM to 4 PM window)
- [ ] Admin: override a status, add a room, change a capacity
- [ ] Notifications: badge appears, "mark as read" only affects you
- [ ] Refresh the page: still logged in. Log out: back to login

## 5. First week
- [ ] Watch Render Logs for errors, Resend for bounces and the 100/day cap, Neon for usage
- [ ] If codes land in spam, add the optional DMARC record from `backend/README.md`
- [ ] Keep `.env` files and the Resend key out of Git and screenshots; rotate the key if it leaks
- [ ] New semester timetable: edit `HIT_TIMETABLE` in `frontend/lib/mockData.ts`, run `npm run sync` in `backend/`, commit, redeploy both

## Things that are normal on free tiers
- First request after ~15 minutes idle can take up to a minute (Render wakes up)
- Resend free: 100 emails/day, 3,000/month
- Neon free: 0.5 GB storage, 100 compute hours/month, wakes from idle in under a second
