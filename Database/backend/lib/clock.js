// All campus rules (booking hours, timetable, 6 PM) run on campus wall-clock time, not server time.
export const TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';

// A Date whose local getters (getHours/getDay/...) return campus wall-clock values.
export const zonedNow = (now = new Date()) => new Date(now.toLocaleString('en-US', { timeZone: TZ }));

export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const clockLabel = (now = new Date()) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true }).format(now);

export function relativeLabel(createdAt, now = new Date()) {
  const mins = Math.floor((now - new Date(createdAt)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
