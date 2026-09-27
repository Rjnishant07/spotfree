import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  canUserOverrideRoom, computeTimetableRoomState, isProtectedQrRoom, normalizeRoleToAuthority,
} from './rules.generated.js';
import { clockLabel, ymd } from './clock.js';

const here = dirname(fileURLToPath(import.meta.url));
export const TIMETABLE = JSON.parse(readFileSync(join(here, '../data/timetable.json'), 'utf8'));

export const STATUSES = ['VACANT', 'OCCUPIED', 'RESERVED', 'NO INFORMATION'];
export const ROOM_TYPES = ['CLASSROOM', 'LABS', 'SEMINAR HALL', 'OFFICES', 'Classroom', 'Seminar Room', 'Meeting Room', 'Study Room'];
export const BUILDINGS = ['CME', 'CB', 'ICT'];

export const cleanKey = (s) => String(s ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

export function parseTimeToMinutes(t) {
  if (!t) return null;
  const hhmm = String(t).match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  const m = String(t).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mer = m[3].toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + parseInt(m[2], 10);
}

export function formatTimeTo12Hr(t) {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const mer = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m[2]} ${mer}`;
}

const released = (r) => ({
  ...r, status: 'VACANT', reservedUntil: null, reservedStart: null, reservedEnd: null,
  reservationDate: null, timeText: 'Available now (Reservation concluded)',
});

/**
 * Effective state of a stored room right now (timetable engine + reservation expiry).
 * Mirrors the frontend's live-update effect. `zNow` is campus wall-clock (see clock.js).
 * Returns { room, expired } where expired = { logged: boolean } when a reservation just ended.
 */
export function deriveRoom(r, zNow) {
  const today = ymd(zNow);
  const nowMins = zNow.getHours() * 60 + zNow.getMinutes();
  const reservationEnded = () => {
    if (!(r.status === 'RESERVED' && r.reservedUntil)) return false;
    if ((r.reservationDate || today) !== today) return false;
    const end = parseTimeToMinutes(r.reservedUntil);
    return end !== null && nowMins >= end;
  };

  if (isProtectedQrRoom(r.id)) {
    return reservationEnded() ? { room: released(r), expired: { logged: true } } : { room: r };
  }
  if (r.isTimetableControlled) {
    const auth = normalizeRoleToAuthority(r.statusAuthority);
    if (r.status === 'RESERVED' && r.reservedUntil && (auth === 'ADMIN' || auth === 'FACULTY')) {
      if ((r.reservationDate || today) === today) {
        if (reservationEnded()) return { room: computeTimetableRoomState(r, zNow, TIMETABLE), expired: { logged: false } };
        return { room: r };
      }
    }
    return { room: computeTimetableRoomState(r, zNow, TIMETABLE) };
  }
  return reservationEnded() ? { room: released(r), expired: { logged: true } } : { room: r };
}

const nameOf = (user, auth) =>
  user.name || (auth === 'FACULTY' ? 'Faculty Member' : auth === 'ADMIN' ? 'Facility Administrator' : 'Student Member');

const fail = (status, error) => ({ error, status });

/** Generic status update (Student / Faculty / Admin), authority enforced from the stored room state. */
export function applyStatusUpdate(target, user, p, now, zNow) {
  const newStatus = p.newStatus;
  if (!STATUSES.includes(newStatus)) return fail(400, 'Invalid status.');

  const roomAuthority = target.statusAuthority
    ? normalizeRoleToAuthority(target.statusAuthority)
    : target.updatedRole ? normalizeRoleToAuthority(target.updatedRole) : 'STUDENT';
  const userAuthority = normalizeRoleToAuthority(user.role);

  if (target.status !== 'VACANT') {
    const check = canUserOverrideRoom(user.role, roomAuthority);
    if (!check.allowed) return fail(403, check.reason || 'Unauthorized to update room status');
  }

  const source = p.source;
  let finalSource;
  if (userAuthority === 'ADMIN') finalSource = 'ADMIN OVERRIDE';
  else if (userAuthority === 'FACULTY') {
    finalSource = roomAuthority === 'STUDENT' || source === 'FACULTY OVERRIDE' ? 'FACULTY OVERRIDE' : source === 'QR' ? 'QR' : 'MANUAL';
  } else finalSource = source === 'QR' ? 'QR' : 'STUDENT';

  const note = typeof p.note === 'string' ? p.note.slice(0, 200) : undefined;
  const startTime = p.startTime ? String(p.startTime).slice(0, 20) : null;
  const endTime = p.endTime ? String(p.endTime).slice(0, 20) : null;
  const reservedUntil = p.reservedUntil ? String(p.reservedUntil).slice(0, 20) : null;
  const date = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : null;

  const userStr = nameOf(user, userAuthority);
  const nowStr = clockLabel(now);
  const effectiveReservedUntil = endTime || reservedUntil || (newStatus === 'RESERVED' ? '02:30 PM' : null);

  let timeText = target.timeText;
  if (newStatus === 'VACANT') {
    timeText = userAuthority === 'FACULTY' ? 'Available for immediate study / session (Faculty Verified)'
      : userAuthority === 'ADMIN' ? 'Available for immediate study / session (Admin Override)'
      : 'Available for immediate study / session';
  } else if (newStatus === 'OCCUPIED') {
    timeText = startTime && endTime
      ? `Occupied: ${startTime} – ${endTime}${note ? ` • ${note}` : ''}`
      : `Occupied in active session${note ? ` • ${note}` : ''}`;
  } else if (newStatus === 'RESERVED') {
    timeText = startTime && endTime
      ? `Reserved: ${startTime} – ${endTime}${note ? ` • ${note}` : ''}`
      : `Reserved${effectiveReservedUntil ? ` until ${effectiveReservedUntil}` : ''}${note ? ` • ${note}` : ' for upcoming session'}`;
  }

  const history = {
    roomNumber: target.roomNumber || target.id, previousStatus: target.status, newStatus,
    updatedBy: userStr, updatedRole: userAuthority, authorityLevel: userAuthority, timestamp: nowStr,
    source: finalSource,
    note: note || (finalSource === 'FACULTY OVERRIDE' ? 'Faculty status override' : finalSource === 'ADMIN OVERRIDE' ? 'Admin status override'
      : finalSource === 'QR' ? 'Verified door plaque scan' : `${userAuthority} status update`),
    room: target.id, from: target.status, to: newStatus, by: userStr,
    startTime: startTime || undefined, endTime: endTime || undefined,
  };

  const room = {
    ...target, status: newStatus, statusAuthority: userAuthority, updatedBy: userStr, updatedRole: userAuthority,
    updatedAt: nowStr, timeText,
    availableUntil: newStatus === 'VACANT' ? 'Open' : target.availableUntil,
    reservedStart: newStatus === 'RESERVED' ? (startTime || target.reservedStart || null) : null,
    reservedEnd: newStatus === 'RESERVED' ? (endTime || effectiveReservedUntil || target.reservedEnd || null) : null,
    reservedUntil: newStatus === 'RESERVED' ? effectiveReservedUntil : null,
    reservationDate: newStatus === 'RESERVED' ? (date || target.reservationDate || null) : null,
  };

  const title = finalSource === 'FACULTY OVERRIDE' ? `Faculty Override: ${newStatus}`
    : finalSource === 'ADMIN OVERRIDE' ? `Admin Override: ${newStatus}`
    : newStatus === 'VACANT' ? 'Room became vacant' : newStatus === 'OCCUPIED' ? 'Room became occupied'
    : newStatus === 'RESERVED' ? 'Room reserved' : 'Room status updated';
  const notification = {
    title, desc: `Room ${target.id} is now ${newStatus} (${userStr})`, unread: true,
    type: newStatus === 'RESERVED' ? 'reservation' : 'status',
  };
  return { room, history, notification };
}

/** Book a currently-vacant room. Validates hours, date window and past times on campus time. */
export function applyBooking(target, user, p, now, zNow) {
  if (target.status !== 'VACANT') return fail(409, 'Selected room is no longer vacant');
  const date = String(p.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(400, 'Pick a valid date.');

  const startDisplay = formatTimeTo12Hr(String(p.startTime ?? ''));
  const endDisplay = formatTimeTo12Hr(String(p.endTime ?? ''));
  const startMins = parseTimeToMinutes(startDisplay);
  const endMins = parseTimeToMinutes(endDisplay);
  if (startMins === null || endMins === null) return fail(400, 'Please enter valid start and end times');
  if (endMins <= startMins) return fail(400, 'End time must be after start time');
  if (startMins < 9 * 60 || endMins > 16 * 60) return fail(400, 'Reservations are only allowed between 9:00 AM and 4:00 PM');

  const today = ymd(zNow);
  const max = new Date(zNow); max.setDate(max.getDate() + 5);
  if (date < today || date > ymd(max)) return fail(400, 'Bookings are allowed for today and the next 5 days only.');
  if (date === today) {
    const cur = zNow.getHours() * 60 + zNow.getMinutes();
    if (cur >= 16 * 60) return fail(400, "Today's booking hours (9:00 AM – 4:00 PM) have closed. Please select a future date.");
    if (startMins < cur) return fail(400, 'Cannot book a time that has already passed today');
  }

  const auth = normalizeRoleToAuthority(user.role);
  const userStr = nameOf(user, auth);
  const bookingNote = `Booked for ${date} at ${startDisplay} – ${endDisplay}`;
  const nowStr = clockLabel(now);

  const history = {
    roomNumber: target.roomNumber || target.id, previousStatus: 'VACANT', newStatus: 'RESERVED',
    updatedBy: userStr, updatedRole: auth, authorityLevel: auth, timestamp: nowStr, source: 'BOOKING',
    note: bookingNote, room: target.id, from: 'VACANT', to: 'RESERVED', by: userStr,
    startTime: startDisplay, endTime: endDisplay,
  };
  const room = {
    ...target, status: 'RESERVED', statusAuthority: auth, updatedBy: userStr, updatedRole: auth, updatedAt: nowStr,
    reservedStart: startDisplay, reservedEnd: endDisplay, reservedUntil: endDisplay, reservationDate: date,
    timeText: `Reserved: ${startDisplay} – ${endDisplay} (${date})`,
  };
  const notification = {
    title: 'Room Reserved', desc: `Room ${target.id} reserved by ${userStr} (${bookingNote})`, unread: true, type: 'reservation',
  };
  return { room, history, notification };
}

/** Admin-only override of any room. */
export function applyAdminOverride(target, user, p, now) {
  const newStatus = p.newStatus;
  if (!STATUSES.includes(newStatus)) return fail(400, 'Invalid status.');
  const adminName = user.name ? `${user.name} (Admin)` : 'Facility Administrator (Admin)';
  const startTime = p.startTime ? String(p.startTime).slice(0, 20) : undefined;
  const endTime = p.endTime ? String(p.endTime).slice(0, 20) : undefined;
  const reservedUntil = p.reservedUntil ? String(p.reservedUntil).slice(0, 20) : null;
  const note = typeof p.note === 'string' ? p.note.slice(0, 200) : undefined;
  const date = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : null;

  let timeText = target.timeText;
  if (newStatus === 'VACANT') timeText = 'Available for immediate study / session (Admin Override)';
  else if (newStatus === 'OCCUPIED') {
    timeText = startTime && endTime ? `Occupied: ${startTime} – ${endTime} (Admin Override)`
      : `Occupied in active session (Admin Override)${note ? ` • ${note}` : ''}`;
  } else if (newStatus === 'RESERVED') {
    timeText = startTime && endTime ? `Reserved: ${startTime} – ${endTime} (Admin Override)`
      : `Reserved${reservedUntil ? ` until ${reservedUntil}` : ''} (Admin Override)${note ? ` • ${note}` : ''}`;
  }
  const overrideNote = note || (startTime && endTime
    ? `${newStatus === 'RESERVED' ? 'Reserved' : 'Occupied'} ${startTime} – ${endTime} • Admin Override`
    : newStatus === 'RESERVED' && reservedUntil ? `Reserved until ${reservedUntil} • Admin Override`
    : 'Administrative room status override');
  const effectiveReservedUntil = endTime || reservedUntil || (newStatus === 'RESERVED' ? '02:30 PM' : null);
  const nowStr = clockLabel(now);

  const history = {
    roomNumber: target.roomNumber || target.id, previousStatus: target.status, newStatus,
    updatedBy: adminName, updatedRole: 'ADMIN', authorityLevel: 'ADMIN', timestamp: nowStr, source: 'ADMIN OVERRIDE',
    note: overrideNote, room: target.id, from: target.status, to: newStatus, by: adminName, startTime, endTime,
  };
  const room = {
    ...target, status: newStatus, statusAuthority: 'ADMIN', updatedBy: adminName, updatedRole: 'ADMIN', updatedAt: nowStr,
    reservedStart: startTime || null, reservedEnd: effectiveReservedUntil, timeText,
    availableUntil: newStatus === 'VACANT' ? 'Open' : target.availableUntil,
    reservedUntil: newStatus === 'RESERVED' ? effectiveReservedUntil : null,
    reservationDate: newStatus === 'RESERVED' || newStatus === 'OCCUPIED' ? (date || null) : null,
  };
  const notification = {
    title: `Admin Override: ${newStatus}`,
    desc: startTime && endTime ? `Room ${target.id} set to ${newStatus} (${startTime} – ${endTime}) by Admin`
      : `Room ${target.id} changed from ${target.status} to ${newStatus} by Admin`,
    unread: true, type: newStatus === 'RESERVED' ? 'reservation' : 'status',
  };
  return { room, history, notification };
}

export function buildNewRoom(b, user, now) {
  const id = String(b.id ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9 -]{1,19}$/.test(id)) return fail(400, 'Enter a valid room ID (e.g. CME-104).');
  if (!BUILDINGS.includes(b.building)) return fail(400, 'Invalid building.');
  const floor = Number(b.floor), capacity = Number(b.capacity);
  if (!Number.isInteger(floor) || floor < 0 || floor > 30) return fail(400, 'Invalid floor.');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) return fail(400, 'Capacity must be 1–1000.');
  if (!ROOM_TYPES.includes(b.type)) return fail(400, 'Invalid room type.');
  const roomNumber = id.replace(/^[A-Z]+\s*[-]?/i, '') || id;
  return {
    room: {
      id, roomNumber, building: b.building, floor, type: b.type, capacity, status: 'VACANT', statusAuthority: 'ADMIN',
      updatedBy: user.name || 'Facility Administrator', updatedRole: 'ADMIN', updatedAt: clockLabel(now),
      reservedStart: null, reservedEnd: null, availableUntil: '04:00 PM', reservedUntil: null,
      qrId: `QR-${id.replace(/[\s-]/g, '')}`, timeText: 'Available now',
      amenities: ['Air Conditioning', 'Whiteboard', 'Power Outlets'],
      timeline: [{ time: 'All Day', text: 'Open Slot', status: 'Active' }],
    },
  };
}

export function autoReleaseHistory(room, now) {
  return {
    roomNumber: room.roomNumber || room.id, previousStatus: 'RESERVED', newStatus: 'VACANT', updatedBy: 'Auto-Scheduler',
    timestamp: clockLabel(now), source: 'MANUAL', note: `Reservation ended at ${room.reservedUntil} • Auto-released to VACANT`,
    room: room.id, from: 'RESERVED', to: 'VACANT', by: 'Auto-Scheduler',
  };
}
