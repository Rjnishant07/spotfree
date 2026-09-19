'use client';

import React, { useState } from 'react';
import { useSpotFree, normalizeRoleToAuthority } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';
import { ReservationWindow } from '../ReservationWindow';
import { Room, RoomStatus, StatusHistoryItem, UserProfile, AuthorityLevel } from '@/lib/types';
import { MOCK_USERS } from '@/mock-data/users';
import { INITIAL_PROFILES } from '@/lib/mockData';
import { getTodayDateString, getDefault12HrTimes, to12Hr } from '@/lib/reservationUtils';

interface MatchedUserData {
  fullName: string;
  role: string;
  email?: string;
  rollNumber?: string;
  branch?: string;
  year?: string;
  semester?: string;
  group?: string;
  dept?: string;
  avatar?: string;
  isFromCentralizedData: boolean;
}

// Resilient helper to match a history author with centralized user records
function resolveUserData(byName: string, currentUser: UserProfile): MatchedUserData {
  const cleanName = (byName || '').trim();
  const normalized = cleanName.toLowerCase();

  // Strip possible role tags like "(Admin)" or "(Faculty)" for resilient name lookup
  const strippedName = cleanName.replace(/\s*\((Admin|Faculty|Student)\)\s*/i, '').trim();
  const strippedNorm = strippedName.toLowerCase();

  // 1. Check active currentUser (includes localStorage modifications)
  const currentMatches =
    currentUser.name.toLowerCase() === normalized ||
    currentUser.name.toLowerCase() === strippedNorm ||
    normalized.includes(currentUser.name.toLowerCase());

  if (currentMatches) {
    const roleNormalized = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase();
    return {
      fullName: currentUser.name,
      role: roleNormalized,
      email: currentUser.email,
      rollNumber: currentUser.rollNumber || (roleNormalized === 'Student' ? '2562014' : undefined),
      branch: currentUser.branch || (roleNormalized === 'Student' ? 'CSE (Data Science)' : undefined),
      year: currentUser.year || (roleNormalized === 'Student' ? '2nd Year' : undefined),
      semester: currentUser.semester || (roleNormalized === 'Student' ? '1st Semester' : undefined),
      group: currentUser.group || (roleNormalized === 'Student' ? 'Group 1' : undefined),
      dept: currentUser.dept,
      avatar: currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase(),
      isFromCentralizedData: true,
    };
  }

  // 2. Check MOCK_USERS
  const foundMock = MOCK_USERS.find(
    (u) =>
      u.name.toLowerCase() === normalized ||
      u.name.toLowerCase() === strippedNorm ||
      normalized.includes(u.name.toLowerCase()) ||
      u.email.toLowerCase() === normalized
  );

  if (foundMock) {
    const roleNormalized = foundMock.role.charAt(0).toUpperCase() + foundMock.role.slice(1).toLowerCase();
    return {
      fullName: foundMock.name,
      role: roleNormalized,
      email: foundMock.email,
      rollNumber: foundMock.rollNumber || (roleNormalized === 'Student' ? '2562014' : undefined),
      branch: foundMock.branch || (roleNormalized === 'Student' ? 'CSE (Data Science)' : undefined),
      year: foundMock.year || (roleNormalized === 'Student' ? '2nd Year' : undefined),
      semester: foundMock.semester || (roleNormalized === 'Student' ? '1st Semester' : undefined),
      group: foundMock.group || (roleNormalized === 'Student' ? 'Group 1' : undefined),
      dept: foundMock.dept,
      avatar: foundMock.avatar || foundMock.name.slice(0, 2).toUpperCase(),
      isFromCentralizedData: true,
    };
  }

  // 3. Check INITIAL_PROFILES
  for (const prof of Object.values(INITIAL_PROFILES)) {
    if (
      prof.name.toLowerCase() === normalized ||
      prof.name.toLowerCase() === strippedNorm ||
      normalized.includes(prof.name.toLowerCase()) ||
      prof.email.toLowerCase() === normalized
    ) {
      const roleNormalized = prof.role.charAt(0).toUpperCase() + prof.role.slice(1).toLowerCase();
      return {
        fullName: prof.name,
        role: roleNormalized,
        email: prof.email,
        rollNumber: prof.rollNumber || (roleNormalized === 'Student' ? '2562014' : undefined),
        branch: prof.branch || (roleNormalized === 'Student' ? 'CSE (Data Science)' : undefined),
        year: prof.year || (roleNormalized === 'Student' ? '2nd Year' : undefined),
        semester: prof.semester || (roleNormalized === 'Student' ? '1st Semester' : undefined),
        group: prof.group || (roleNormalized === 'Student' ? 'Group 1' : undefined),
        dept: prof.dept,
        avatar: prof.avatar || prof.name.slice(0, 2).toUpperCase(),
        isFromCentralizedData: true,
      };
    }
  }

  // 4. Fallback for user not found in centralized records (do NOT invent details)
  let fallbackRole: string | undefined = undefined;
  if (/admin/i.test(byName)) fallbackRole = 'Admin';
  else if (/prof|faculty|dr\./i.test(byName)) fallbackRole = 'Faculty';

  return {
    fullName: cleanName,
    role: fallbackRole || 'Campus Member',
    isFromCentralizedData: false,
  };
}

/**
 * Resolves the authority level of a status history entry to determine override eligibility.
 * Uses actual history/room state fields: updatedRole, authorityLevel, statusAuthority, controlling authority.
 * Does NOT determine permission only from author name string matching.
 */
function getHistoryItemAuthority(
  item: StatusHistoryItem,
  room?: Room
): AuthorityLevel {
  // 1. Direct explicit updatedRole on history item
  if (item.updatedRole) {
    return normalizeRoleToAuthority(item.updatedRole);
  }
  // 2. Direct authorityLevel on history item
  if (item.authorityLevel) {
    return normalizeRoleToAuthority(item.authorityLevel);
  }
  // 3. Source indicators on history item
  if (item.source === 'ADMIN OVERRIDE') return 'ADMIN';
  if (item.source === 'FACULTY OVERRIDE') return 'FACULTY';
  if (item.source === 'STUDENT') return 'STUDENT';

  // 4. Corresponding room authority / role from centralized room state
  if (room) {
    if (room.statusAuthority) return normalizeRoleToAuthority(room.statusAuthority);
    if (room.updatedRole) return normalizeRoleToAuthority(room.updatedRole);
  }

  // 5. Fallback from updatedBy / by field for role designations (e.g. "(Admin)", "Facility Ops", "Prof.")
  const byField = (item.updatedBy || item.by || '').toUpperCase();
  if (byField.includes('ADMIN') || byField.includes('FACILITY') || byField.includes('OPS')) {
    return 'ADMIN';
  }
  if (byField.includes('FACULTY') || byField.includes('PROF') || byField.includes('TEACHER') || byField.includes('DR.')) {
    return 'FACULTY';
  }

  return 'STUDENT';
}

// Supported campus operating time slots for Admin Status Override
const ADMIN_TIME_SLOTS = [
  '08:30 AM', '08:45 AM',
  '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
  '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
  '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
  '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
  '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM',
  '05:00 PM', '05:15 PM', '05:30 PM', '05:45 PM',
  '06:00 PM',
];

interface TimeValidationResult {
  valid: boolean;
  error?: string;
  minutes?: number;
  formatted?: string;
}

// Resilient time parser & validator (supports both 12-hour '10:30 AM' and 24-hour '13:45' formats)
function validateTimeString(raw: string): TimeValidationResult {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Time cannot be empty' };
  }

  const twelveHourRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
  const twentyFourHourRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

  let hours = -1;
  let minutes = -1;
  let meridiem = '';

  const match12 = trimmed.match(twelveHourRegex);
  if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    meridiem = match12[3].toUpperCase();

    let total24Hours = hours;
    if (meridiem === 'AM') {
      if (total24Hours === 12) total24Hours = 0;
    } else {
      if (total24Hours !== 12) total24Hours += 12;
    }

    const totalMinutes = total24Hours * 60 + minutes;

    // Campus hours: between 08:00 AM (480 min) and 07:00 PM (1140 min)
    if (totalMinutes < 480 || totalMinutes > 1140) {
      return { valid: false, error: 'Time must be between 08:00 AM and 07:00 PM' };
    }

    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
    return { valid: true, minutes: totalMinutes, formatted };
  }

  const match24 = trimmed.match(twentyFourHourRegex);
  if (match24) {
    hours = parseInt(match24[1], 10);
    minutes = parseInt(match24[2], 10);

    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 480 || totalMinutes > 1140) {
      return { valid: false, error: 'Time must be between 08:00 AM and 07:00 PM' };
    }

    let displayHours = hours;
    const displayMeridiem = displayHours >= 12 ? 'PM' : 'AM';
    if (displayHours === 0) displayHours = 12;
    else if (displayHours > 12) displayHours -= 12;

    const formatted = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${displayMeridiem}`;
    return { valid: true, minutes: totalMinutes, formatted };
  }

  return { valid: false, error: 'Invalid format. Use e.g. 10:30 AM or 13:45' };
}

// Helper to determine human-readable action type for user detail modal
function getActionType(item: StatusHistoryItem): string {
  if (item.source === 'ADMIN OVERRIDE') return 'Admin Status Override';
  if (item.source === 'FACULTY OVERRIDE') return 'Faculty Status Override';
  if (item.source === 'BOOKING') return 'Room Reservation';
  if (item.source === 'QR') return 'QR Plaque Verification';
  if (item.source === 'TIMETABLE') return 'Automated Timetable Sync';
  return 'Manual Room Status Update';
}

export const StatusHistoryScreen: React.FC = () => {
  const {
    history,
    rooms,
    currentRole,
    currentUser,
    bookVacantRoom,
    adminOverrideStatus,
    updateRoomStatus,
    showToast,
    checkOverlap,
    generateDateOptions,
  } = useSpotFree();

  const [search, setSearch] = useState<string>('');
  const [bldgFilter, setBldgFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Selected History User Details Modal State
  const [selectedUserItem, setSelectedUserItem] = useState<StatusHistoryItem | null>(null);

  // Booking Modal State
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const vacantRooms = rooms.filter((r) => r.status === 'VACANT');
  const [selectedBookRoom, setSelectedBookRoom] = useState<string>(
    vacantRooms[0]?.id || ''
  );
  // Default date = today as YYYY-MM-DD
  const todayValue = getTodayDateString();
  const defaultBookTimes = getDefault12HrTimes(true);
  const [bookDate, setBookDate] = useState<string>(todayValue);
  const [bookStartTime, setBookStartTime] = useState<string>(defaultBookTimes.startTime);
  const [bookEndTime, setBookEndTime] = useState<string>(defaultBookTimes.endTime);
  const [isBookValid, setIsBookValid] = useState<boolean>(true);
  const [bookError, setBookError] = useState<string>('');

  // Admin Override Modal State
  const [overrideItem, setOverrideItem] = useState<StatusHistoryItem | null>(null);
  const [overrideDate, setOverrideDate] = useState<string>(todayValue);
  const [overrideStatus, setOverrideStatus] = useState<RoomStatus>('RESERVED');
  const [overrideStartTime, setOverrideStartTime] = useState<string>(defaultBookTimes.startTime);
  const [overrideEndTime, setOverrideEndTime] = useState<string>(defaultBookTimes.endTime);
  const [isOverrideValid, setIsOverrideValid] = useState<boolean>(true);
  const [isManualStart, setIsManualStart] = useState<boolean>(false);
  const [isManualEnd, setIsManualEnd] = useState<boolean>(false);
  const [timeValidationError, setTimeValidationError] = useState<string>('');
  const [overrideNote, setOverrideNote] = useState<string>('Administrative status override');

  // Helper to find the authoritative room object from centralized state
  const getRoomForHistoryItem = (item: StatusHistoryItem) => {
    const cleanItemRoom = item.room.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return rooms.find((r) => {
      const cleanRoomId = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return (
        cleanRoomId === cleanItemRoom ||
        (r.roomNumber && item.roomNumber && r.roomNumber.toUpperCase() === item.roomNumber.toUpperCase()) ||
        r.id === item.room
      );
    });
  };

  const filtered = history.filter((item) => {
    if (search) {
      const q = search.trim().toLowerCase();
      const qClean = q.replace(/[^a-zA-Z0-9]/g, '');
      const itemRoomClean = (item.room || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const itemNumClean = (item.roomNumber || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      const matches =
        (item.room && item.room.toLowerCase().includes(q)) ||
        (item.roomNumber && item.roomNumber.toLowerCase().includes(q)) ||
        itemRoomClean.includes(qClean) ||
        itemNumClean.includes(qClean);
      if (!matches) return false;
    }
    if (bldgFilter !== 'All' && !item.room.startsWith(bldgFilter)) return false;
    const currentRoom = getRoomForHistoryItem(item);
    const effectiveStatus = currentRoom ? currentRoom.status : item.to;
    if (statusFilter !== 'All' && effectiveStatus !== statusFilter) return false;
    return true;
  });

  const handleExport = () => {
    showToast('Status history audit report exported (CSV simulation)', 'file_download');
  };

  const handleOpenBookModal = () => {
    if (vacantRooms.length === 0) {
      showToast('No rooms are currently vacant to book', 'info');
      return;
    }
    setSelectedBookRoom(vacantRooms[0].id);
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    const hhmm = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
    setBookDate(today);
    setBookStartTime(hhmm);
    setBookEndTime('');
    setShowBookModal(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookRoom) {
      showToast('Please select a vacant room to book', 'error');
      return;
    }
    if (!bookStartTime || !bookEndTime) {
      showToast('Please enter both start and end times', 'error');
      return;
    }
    const success = bookVacantRoom(selectedBookRoom, bookDate, bookStartTime, bookEndTime);
    if (success) {
      setShowBookModal(false);
    }
  };

  const handleOpenOverride = (item: StatusHistoryItem) => {
    setOverrideItem(item);
    const nextStatus = item.to === 'VACANT' ? 'RESERVED' : 'VACANT';
    setOverrideStatus(nextStatus);
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    setOverrideDate(today);
    setOverrideStartTime('');
    setOverrideEndTime('');
    setIsManualStart(false);
    setIsManualEnd(false);
    setTimeValidationError('');
    setOverrideNote(
      isAdmin
        ? `Admin override of status previously set by ${item.by}`
        : `Faculty override of status previously set by ${item.by}`
    );
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideItem) return;

    let finalStart: string | undefined = undefined;
    let finalEnd: string | undefined = undefined;

    // Validation rules:
    // RESERVED: Start Time and End Time are REQUIRED
    // OCCUPIED: Start Time and End Time are optional/allowed where applicable
    // VACANT: Time range is not required
    if (overrideStatus === 'RESERVED') {
      const startRes = validateTimeString(overrideStartTime);
      if (!startRes.valid) {
        setTimeValidationError(`Start Time: ${startRes.error}`);
        showToast(`Start Time: ${startRes.error}`, 'error');
        return;
      }
      const endRes = validateTimeString(overrideEndTime);
      if (!endRes.valid) {
        setTimeValidationError(`End Time: ${endRes.error}`);
        showToast(`End Time: ${endRes.error}`, 'error');
        return;
      }
      if (endRes.minutes! <= startRes.minutes!) {
        setTimeValidationError('End Time must be later than Start Time');
        showToast('End Time must be later than Start Time', 'error');
        return;
      }
      finalStart = startRes.formatted;
      finalEnd = endRes.formatted;
    } else if (overrideStatus === 'OCCUPIED') {
      const hasStart = Boolean(overrideStartTime.trim());
      const hasEnd = Boolean(overrideEndTime.trim());
      if (hasStart || hasEnd) {
        const startRes = validateTimeString(overrideStartTime);
        if (!startRes.valid) {
          setTimeValidationError(`Start Time: ${startRes.error}`);
          showToast(`Start Time: ${startRes.error}`, 'error');
          return;
        }
        const endRes = validateTimeString(overrideEndTime);
        if (!endRes.valid) {
          setTimeValidationError(`End Time: ${endRes.error}`);
          showToast(`End Time: ${endRes.error}`, 'error');
          return;
        }
        if (endRes.minutes! <= startRes.minutes!) {
          setTimeValidationError('End Time must be later than Start Time');
          showToast('End Time must be later than Start Time', 'error');
          return;
        }
        finalStart = startRes.formatted;
        finalEnd = endRes.formatted;
      }
    }

    setTimeValidationError('');

    const targetRoom = getRoomForHistoryItem(overrideItem);
    const targetRoomId = targetRoom?.id || overrideItem.room || overrideItem.roomNumber || '';

    if (isAdmin) {
      adminOverrideStatus(
        targetRoomId,
        overrideStatus,
        finalEnd || null,
        overrideNote,
        finalStart,
        finalEnd,
        overrideDate || undefined
      );
      setOverrideItem(null);
    } else {
      const res = updateRoomStatus(
        targetRoomId,
        overrideStatus,
        overrideNote || `Faculty override: ${overrideStatus}`,
        'FACULTY OVERRIDE',
        finalEnd || null,
        finalStart,
        finalEnd
      );
      if (res && res.success) {
        setOverrideItem(null);
      }
    }
  };

  const isAdmin = currentRole.toLowerCase() === 'admin';
  const isFaculty = currentRole.toLowerCase() === 'faculty' || currentRole.toLowerCase() === 'teacher';

  const canOverrideItem = (item: StatusHistoryItem): boolean => {
    // Admin can override any item
    if (isAdmin) return true;

    // Faculty/Teacher can override ONLY IF status is STUDENT-controlled:
    // When updatedRole === "STUDENT": Faculty Override must be allowed
    // When updatedRole === "FACULTY": Faculty Override must be denied
    // When updatedRole === "ADMIN": Faculty Override must be denied
    if (isFaculty) {
      const targetRoom = getRoomForHistoryItem(item);
      const itemAuth = getHistoryItemAuthority(item, targetRoom);
      return itemAuth === 'STUDENT';
    }

    return false;
  };

  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Status History"
        subtitle="Campus Audit Log"
        showBack={true}
      />

      <main className={isWeb ? 'w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5' : 'flex flex-col px-4 pt-3 pb-8 gap-3.5'}>
        {/* Meta Context Strip & Booking Action Banner */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Audit Stream</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">HIT Audit ID #8842</span>
          </div>

          {/* Quick Book Vacant Room Card */}
          <div className="p-3 bg-white rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <span className="material-symbols-outlined text-xl">event_available</span>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Need to Reserve Space?</h2>
                <p className="text-[11px] text-slate-500">
                  {vacantRooms.length} vacant {vacantRooms.length === 1 ? 'room' : 'rooms'} available right now
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenBookModal}
              className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-emerald-400">add</span>
              <span>Book Room</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room (e.g. CME-104)..."
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {['All', 'CME', 'CB', 'ICT'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBldgFilter(b)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                bldgFilter === b
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {b === 'All' ? 'All Wings' : `${b} Only`}
            </button>
          ))}

          {['VACANT', 'OCCUPIED', 'RESERVED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(statusFilter === st ? 'All' : st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Filter Meta & Actions */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span>
            Showing <strong className="text-slate-800 font-bold">{filtered.length}</strong> updates
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">file_download</span>
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Status Transition Cards Feed */}
        <div className="flex flex-col gap-2.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
              No status change events found matching your filter.
            </div>
          ) : (
            filtered.map((item) => {
              const currentRoom = getRoomForHistoryItem(item);
              const currentStatus = currentRoom ? currentRoom.status : item.to;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                        <span className="material-symbols-outlined text-base">history</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-sm text-slate-900 tracking-tight">{item.room}</h3>
                          {item.source === 'ADMIN OVERRIDE' && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-mono font-bold uppercase border border-purple-200">
                              Admin Override
                            </span>
                          )}
                          {item.source === 'FACULTY OVERRIDE' && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-mono font-bold uppercase border border-blue-200">
                              Faculty Override
                            </span>
                          )}
                          {item.source === 'BOOKING' && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold uppercase border border-emerald-200">
                              Booking
                            </span>
                          )}
                          {(item.source === 'STUDENT' || item.updatedRole === 'STUDENT') && item.source !== 'BOOKING' && item.source !== 'QR' && item.source !== 'TIMETABLE' && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[9px] font-mono font-bold uppercase border border-slate-200">
                              Student
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.room.startsWith('CME')
                            ? 'CME Building'
                            : item.room.startsWith('CB')
                            ? 'Central Block'
                            : 'ICT Building'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{item.time || item.timestamp}</span>
                    </div>
                  </div>

                  {/* Transition Banner */}
                  <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between border border-slate-100">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Previous</span>
                      <StatusBadge status={item.from} size="sm" />
                    </div>

                    <span className="material-symbols-outlined text-slate-400 text-lg">east</span>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">New Status</span>
                      <StatusBadge status={item.to} size="sm" />
                    </div>
                  </div>

                  {/* Override Time Range if present */}
                  {item.startTime && item.endTime && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-purple-50/90 border border-purple-200/80 text-[11px] text-purple-950">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-purple-700">schedule</span>
                        <span className="font-bold">Override Window:</span>
                      </div>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs">
                        {item.startTime} → {item.endTime}
                      </span>
                    </div>
                  )}


                  {/* Footer Metadata */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-100">
                    <span className="text-[11px] flex items-center gap-1">
                      <span>By:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserItem(item);
                        }}
                        className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold transition-colors cursor-pointer inline-flex items-center gap-0.5 group"
                        title={`View user information for ${item.by}`}
                      >
                        <span>{item.by}</span>
                        <span className="material-symbols-outlined text-[12px] opacity-70 group-hover:opacity-100">open_in_new</span>
                      </button>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.source === 'ADMIN OVERRIDE'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : item.source === 'FACULTY OVERRIDE'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.source === 'BOOKING'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.source === 'STUDENT'
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : item.source === 'QR'
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.source}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 px-2.5 py-1 rounded-lg">
                      &quot;{item.note}&quot;
                    </p>
                  )}

                  {/* Prominent Override Action Button (Faculty: Override Student Status | Admin: Admin Override) */}
                  {canOverrideItem(item) && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenOverride(item)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                          isAdmin
                            ? 'bg-purple-900 hover:bg-purple-800 text-white shadow-purple-900/15'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/15'
                        }`}
                        title={isAdmin ? 'Admin Override room status' : 'Override Student Status as Faculty'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isAdmin ? 'shield_person' : 'upgrade'}
                        </span>
                        <span>{isAdmin ? 'Admin Override' : 'Override Student Status'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* BOOK VACANT ROOM MODAL */}
        {showBookModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[350px] rounded-2xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <span className="material-symbols-outlined text-base">event_available</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Book Vacant Room</h3>
                    <p className="text-[10px] text-slate-500">Status will update to RESERVED</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="flex flex-col gap-3">
                {/* Select Room */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">
                    Select Vacant Room
                  </label>
                  <select
                    value={selectedBookRoom}
                    onChange={(e) => setSelectedBookRoom(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:bg-white"
                  >
                    {vacantRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} ({r.building} • Fl {r.floor} • Cap {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reservation Window */}
                <ReservationWindow
                  date={bookDate}
                  onDateChange={setBookDate}
                  startTime={bookStartTime}
                  onStartTimeChange={setBookStartTime}
                  endTime={bookEndTime}
                  onEndTimeChange={setBookEndTime}
                  roomId={selectedBookRoom}
                  theme="slate"
                  onValidationChange={(isValid, err) => {
                    setIsBookValid(isValid);
                    setBookError(err || '');
                  }}
                  checkOverlapFn={(sMins, eMins) => checkOverlap(selectedBookRoom, bookDate, sMins, eMins)}
                />

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isBookValid}
                    className={`flex-1 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-all ${
                      !isBookValid
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    }`}
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* OVERRIDE STATUS MODAL */}
        {overrideItem && (() => {
          const targetRoom = getRoomForHistoryItem(overrideItem);
          const itemAuth = getHistoryItemAuthority(overrideItem, targetRoom);
          const authorRoleLabel = itemAuth === 'STUDENT' ? 'Student' : itemAuth === 'FACULTY' ? 'Faculty' : 'Admin';
          const authorName = overrideItem.updatedBy || overrideItem.by || 'Campus Member';

          return (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
              onClick={(e) => {
                if (e.target === e.currentTarget) setOverrideItem(null);
              }}
            >
              <div
                className="bg-white w-full max-w-[380px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
                aria-labelledby="override-modal-title"
              >
                {/* 1. MODAL HEADER */}
                <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isAdmin ? 'shield_person' : 'upgrade'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 id="override-modal-title" className="font-bold text-sm text-slate-900 truncate">
                        {isAdmin ? 'Admin Status Override' : 'Faculty Status Override'}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        Room {overrideItem.room || targetRoom?.id}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverrideItem(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
                    aria-label="Close dialog"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {/* 2. SCROLLABLE FORM BODY */}
                <form onSubmit={handleConfirmOverride} className="flex flex-col flex-1 overflow-y-auto min-h-0">
                  <div className="p-4 flex flex-col gap-3">
                    {/* Role Differentiation Banner */}
                    <div
                      className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
                        isAdmin
                          ? 'bg-purple-50/90 border-purple-200/80 text-purple-900'
                          : 'bg-blue-50/90 border-blue-200/80 text-blue-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base shrink-0">
                        {isAdmin ? 'admin_panel_settings' : 'school'}
                      </span>
                      <span className="text-[11px] font-medium leading-tight">
                        {isAdmin
                          ? `Administrative override of status set by ${authorRoleLabel}`
                          : `Overriding Student status reported by ${authorName}`}
                      </span>
                    </div>

                    {/* STATUS SECTION: Current Status & Previously Set By */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] font-medium">Current Status</span>
                        <StatusBadge status={overrideItem.to || overrideItem.newStatus || 'VACANT'} size="sm" />
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                        <span className="text-slate-500 text-[11px] font-medium">Previously Set By</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[140px]" title={authorName}>
                            {authorName}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                              itemAuth === 'STUDENT'
                                ? 'bg-slate-200 text-slate-700'
                                : itemAuth === 'FACULTY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {authorRoleLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* OVERRIDE SECTION: VACANT / OCCUPIED / RESERVED */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Override Status To
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['VACANT', 'OCCUPIED', 'RESERVED'] as RoomStatus[]).map((st) => {
                          const isSelected = overrideStatus === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setOverrideStatus(st)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${
                                isSelected
                                  ? st === 'VACANT'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                                    : st === 'OCCUPIED'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20'
                                    : 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {st === 'VACANT' ? 'check_circle' : st === 'OCCUPIED' ? 'do_not_disturb_on' : 'event_seat'}
                              </span>
                              <span className="text-[11px] leading-none">{st}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TIME RANGE SECTION FOR RESERVED (Required) or OCCUPIED (Optional) */}
                    {(overrideStatus === 'RESERVED' || overrideStatus === 'OCCUPIED') && (
                      <ReservationWindow
                        date={overrideDate}
                        onDateChange={setOverrideDate}
                        startTime={overrideStartTime}
                        onStartTimeChange={setOverrideStartTime}
                        endTime={overrideEndTime}
                        onEndTimeChange={setOverrideEndTime}
                        roomId={overrideItem.room}
                        theme={overrideStatus === 'RESERVED' ? 'amber' : 'slate'}
                        onValidationChange={(isValid, err) => {
                          setIsOverrideValid(isValid);
                          setTimeValidationError(err || '');
                        }}
                        checkOverlapFn={(sMins, eMins) => checkOverlap(overrideItem.room, overrideDate, sMins, eMins)}
                      />
                    )}

                    {/* VACANT NOTE */}
                    {overrideStatus === 'VACANT' && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">check_circle</span>
                        <span className="text-[11px] leading-tight">Room will be marked immediately vacant for campus study.</span>
                      </div>
                    )}

                    {/* OVERRIDE AUDIT NOTE */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Audit Note / Reason
                      </label>
                      <input
                        type="text"
                        value={overrideNote}
                        onChange={(e) => setOverrideNote(e.target.value)}
                        placeholder={
                          isAdmin
                            ? 'e.g. Administrative priority session override'
                            : 'e.g. Faculty priority lecture/lab override'
                        }
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  {/* 3. BOTTOM ACTIONS (PINNED FOOTER) */}
                  <div className="p-3.5 px-4 border-t border-slate-100 bg-slate-50/50 flex gap-2.5 shrink-0 mt-auto">
                    <button
                      type="button"
                      onClick={() => setOverrideItem(null)}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={overrideStatus === 'RESERVED' && !isOverrideValid}
                      className={`flex-[2] py-2.5 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                        overrideStatus === 'RESERVED' && !isOverrideValid
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none'
                          : isAdmin
                          ? 'bg-purple-900 hover:bg-purple-800 shadow-purple-900/20 active:scale-[0.98] cursor-pointer'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 active:scale-[0.98] cursor-pointer'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">verified</span>
                      <span>Apply Override</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* DETAILED USER INFORMATION MODAL */}
        {selectedUserItem && (() => {
          const userMeta = resolveUserData(selectedUserItem.by, currentUser);
          const isStudent = userMeta.role.toLowerCase() === 'student';
          const isFaculty = userMeta.role.toLowerCase() === 'faculty';
          const isAdminRole = userMeta.role.toLowerCase() === 'admin';
          const actionType = getActionType(selectedUserItem);

          return (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedUserItem(null);
              }}
            >
              <div
                className="bg-white w-full max-w-[390px] rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-info-title"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm ${
                        isStudent
                          ? 'bg-emerald-600'
                          : isFaculty
                          ? 'bg-blue-600'
                          : isAdminRole
                          ? 'bg-purple-600'
                          : 'bg-slate-700'
                      }`}
                    >
                      {userMeta.avatar || userMeta.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 id="user-info-title" className="font-black text-base text-slate-900 leading-snug">
                          {userMeta.fullName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            isStudent
                              ? 'bg-emerald-100 text-emerald-800'
                              : isFaculty
                              ? 'bg-blue-100 text-blue-800'
                              : isAdminRole
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {userMeta.role}
                        </span>
                        {userMeta.isFromCentralizedData && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs text-emerald-500">verified</span>
                            <span>Verified Profile</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUserItem(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                    title="Close"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* USER INFORMATION SECTION */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    User Information
                  </span>

                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 flex flex-col gap-2.5 text-xs">
                    {/* Student Fields */}
                    {isStudent ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Full Name</span>
                          <span className="font-bold text-slate-900">{userMeta.fullName}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Roll Number</span>
                          <span className="font-mono font-bold text-slate-900">{userMeta.rollNumber || '2562014'}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Email</span>
                          <span className="font-medium text-slate-800 text-right truncate max-w-[210px]" title={userMeta.email}>
                            {userMeta.email}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Branch</span>
                          <span className="font-semibold text-slate-900 text-right">{userMeta.branch || 'CSE (Data Science)'}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Year</span>
                          <span className="font-semibold text-slate-900">{userMeta.year || '2nd Year'}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Semester</span>
                          <span className="font-semibold text-slate-900">{userMeta.semester || '1st Semester'}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Group</span>
                          <span className="font-semibold text-slate-900">{userMeta.group || 'Group 1'}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Role</span>
                          <span className="font-bold text-emerald-700">Student</span>
                        </div>
                      </>
                    ) : isFaculty ? (
                      /* Faculty Fields */
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Full Name</span>
                          <span className="font-bold text-slate-900">{userMeta.fullName}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Email</span>
                          <span className="font-medium text-slate-800 text-right truncate max-w-[210px]" title={userMeta.email}>
                            {userMeta.email}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Role</span>
                          <span className="font-bold text-blue-700">Faculty</span>
                        </div>
                      </>
                    ) : isAdminRole ? (
                      /* Admin Fields */
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Full Name</span>
                          <span className="font-bold text-slate-900">{userMeta.fullName}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Email</span>
                          <span className="font-medium text-slate-800 text-right truncate max-w-[210px]" title={userMeta.email}>
                            {userMeta.email}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Role</span>
                          <span className="font-bold text-purple-700">Admin</span>
                        </div>
                      </>
                    ) : (
                      /* Fallback for unmapped user in history */
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Full Name</span>
                          <span className="font-bold text-slate-900">{userMeta.fullName}</span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                          <span className="text-slate-500 font-medium">Role</span>
                          <span className="font-bold text-slate-800">{userMeta.role}</span>
                        </div>

                        <p className="text-[10px] text-slate-400 italic pt-1">
                          History record attendee; extended profile not linked in centralized directory.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* ASSOCIATED ACTIVITY DETAILS SECTION */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Activity
                  </span>

                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Room</span>
                      <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {selectedUserItem.room}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                      <span className="text-slate-500 font-medium">Previous Status</span>
                      <StatusBadge status={selectedUserItem.from || selectedUserItem.previousStatus || 'VACANT'} size="sm" />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                      <span className="text-slate-500 font-medium">New Status</span>
                      <StatusBadge status={selectedUserItem.to || selectedUserItem.newStatus || 'OCCUPIED'} size="sm" />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                      <span className="text-slate-500 font-medium">Date/Time</span>
                      <span className="font-semibold text-slate-800">{selectedUserItem.time || selectedUserItem.timestamp}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                      <span className="text-slate-500 font-medium">Source</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedUserItem.source === 'ADMIN OVERRIDE'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : selectedUserItem.source === 'BOOKING'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {selectedUserItem.source}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                      <span className="text-slate-500 font-medium">Action Type</span>
                      <span className="font-bold text-slate-900">{actionType}</span>
                    </div>

                    {selectedUserItem.startTime && selectedUserItem.endTime && (
                      <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                        <span className="text-slate-500 font-medium">Time Range</span>
                        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                          {selectedUserItem.startTime} → {selectedUserItem.endTime}
                        </span>
                      </div>
                    )}

                    {selectedUserItem.note && (
                      <div className="border-t border-slate-200/50 pt-2">
                        <span className="text-slate-400 text-[10px] block mb-0.5 font-medium">Note</span>
                        <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200/70">
                          &quot;{selectedUserItem.note}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back / Close Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedUserItem(null)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Back to History</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
};

export default StatusHistoryScreen;
