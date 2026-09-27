/**
 * SpotFree Reservation Date & 12-Hour Time Utilities
 * Strictly enforces:
 * 1. 12-hour format: HH:MM AM/PM
 * 2. Operating booking hours limit: 9:00 AM to 4:00 PM only
 * 3. Real current time: For Today, start time must be at or after current time
 * 4. Allowed dates: Today and next 5 calendar days only
 */

export const BOOKING_START_MINUTES = 9 * 60; // 540 = 09:00 AM
export const BOOKING_END_MINUTES = 16 * 60;  // 960 = 04:00 PM

/**
 * Standard selectable 15-minute slots strictly within 9:00 AM - 4:00 PM
 */
export const ALLOWED_TIME_SLOTS: string[] = [
  '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
  '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
  '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
  '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
  '04:00 PM',
];

export interface TimeValidationResult {
  isValid: boolean;
  normalized?: string; // e.g. "10:30 AM"
  hours?: number;      // 1-12
  minutes?: number;    // 0-59
  meridiem?: 'AM' | 'PM';
  totalMinutes?: number; // Minutes since midnight (0 - 1439)
  error?: string;
}

/**
 * Validates and normalizes manual time input in 12-hour format (HH:MM AM/PM).
 * Valid examples: "09:00 AM", "10:30 AM", "12:15 PM", "03:45 PM", "04:00 PM"
 * Rejects invalid format, 24-hr values, impossible hours/minutes, and outside 9:00 AM - 4:00 PM.
 */
export function validateAndNormalize12HrTime(input: string): TimeValidationResult {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Time is required' };
  }

  // Check if user entered pure 24-hour time like "23:26" or "14:30"
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hStr, mStr] = trimmed.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    let suggestion = '';
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      const mer = h >= 12 ? 'PM' : 'AM';
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      suggestion = ` (e.g. ${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${mer})`;
    }
    return {
      isValid: false,
      error: `24-hour format (${trimmed}) is not allowed. Please use 12-hour format with AM or PM${suggestion}`,
    };
  }

  // Regex for 12-hour format: 1 or 2 digits, colon, 2 digits, optional space, AM or PM
  const regex = /^(\d{1,2}):(\d{2})\s*([ap]m)$/i;
  const match = trimmed.match(regex);

  if (!match) {
    return {
      isValid: false,
      error: 'Invalid time format. Please enter in 12-hour format (e.g. 10:30 AM)',
    };
  }

  const rawHour = parseInt(match[1], 10);
  const rawMin = parseInt(match[2], 10);
  const mer = match[3].toUpperCase() as 'AM' | 'PM';

  // Hours: 01 - 12 only
  if (rawHour < 1 || rawHour > 12) {
    return {
      isValid: false,
      error: `Invalid hour (${rawHour}). Hours must be between 01 and 12`,
    };
  }

  // Minutes: 00 - 59 only
  if (rawMin < 0 || rawMin > 59) {
    return {
      isValid: false,
      error: `Invalid minutes (${rawMin}). Minutes must be between 00 and 59`,
    };
  }

  const formattedHour = String(rawHour).padStart(2, '0');
  const formattedMin = String(rawMin).padStart(2, '0');
  const normalized = `${formattedHour}:${formattedMin} ${mer}`;

  // Calculate total minutes since midnight
  let h24 = rawHour;
  if (mer === 'PM' && rawHour < 12) h24 += 12;
  if (mer === 'AM' && rawHour === 12) h24 = 0;
  const totalMinutes = h24 * 60 + rawMin;

  // Strict Booking Time Limit: 9:00 AM (540m) to 4:00 PM (960m)
  if (totalMinutes < BOOKING_START_MINUTES || totalMinutes > BOOKING_END_MINUTES) {
    return {
      isValid: false,
      normalized,
      hours: rawHour,
      minutes: rawMin,
      meridiem: mer,
      totalMinutes,
      error: 'Reservations are only allowed between 9:00 AM and 4:00 PM',
    };
  }

  return {
    isValid: true,
    normalized,
    hours: rawHour,
    minutes: rawMin,
    meridiem: mer,
    totalMinutes,
  };
}

/**
 * Converts any 24-hr time string "HH:MM" or existing 12-hr time to standardized "HH:MM AM/PM"
 */
export function to12Hr(timeStr: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (ampmMatch) {
    const h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const mer = ampmMatch[3].toUpperCase();
    return `${String(h).padStart(2, '0')}:${m} ${mer}`;
  }
  const m24 = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (m24) {
    let h = parseInt(m24[1], 10);
    const min = m24[2];
    const mer = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${min} ${mer}`;
  }
  return trimmed;
}

/**
 * Converts 12-hr time string "HH:MM AM/PM" to 24-hr format "HH:MM"
 */
export function to24Hr(time12: string): string {
  if (!time12) return '';
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (!match) return '';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const mer = match[3].toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

/**
 * Returns current device/browser local minutes since midnight (0-1439)
 */
export function getCurrentLocalMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Returns current device/browser local time formatted as 12-hour "HH:MM AM/PM"
 */
export function getCurrentTime12Hr(): string {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const mer = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${m} ${mer}`;
}

/**
 * Converts 12-hr string "HH:MM AM/PM" to total minutes since midnight
 */
export function time12ToMinutes(time12: string): number | null {
  const res = validateAndNormalize12HrTime(time12);
  return res.totalMinutes ?? null;
}

/**
 * Returns today's date formatted as YYYY-MM-DD using local browser time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export interface DateOption {
  value: string; // YYYY-MM-DD
  label: string; // "Today • Sat, Sep 19"
  fullLabel: string; // "Today, Saturday (Sep 19)"
  dayName: string; // "Saturday"
  shortDay: string; // "Sat"
  dateFormatted: string; // "Sep 19"
  isToday: boolean;
  isTomorrow: boolean;
}

/**
 * Generates selectable date options for TODAY and the next 5 calendar days only (6 days total).
 * Uses real local device/browser date. No hard-coded dates.
 */
export function getReservationDateOptions(): DateOption[] {
  const options: DateOption[] = [];
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i <= 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const value = `${yyyy}-${mm}-${dd}`;
    const dayName = dayNames[d.getDay()];
    const shortDay = shortDayNames[d.getDay()];
    const monthName = monthNames[d.getMonth()];
    const dateNum = d.getDate();
    const dateFormatted = `${monthName} ${dateNum}`;

    let label: string;
    let fullLabel: string;
    if (i === 0) {
      label = `Today (${shortDay}, ${dateFormatted})`;
      fullLabel = `Today, ${dayName} (${dateFormatted})`;
    } else if (i === 1) {
      label = `Tomorrow (${shortDay}, ${dateFormatted})`;
      fullLabel = `Tomorrow, ${dayName} (${dateFormatted})`;
    } else {
      label = `${shortDay}, ${dateFormatted}`;
      fullLabel = `${dayName}, ${dateFormatted}`;
    }

    options.push({
      value,
      label,
      fullLabel,
      dayName,
      shortDay,
      dateFormatted,
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }

  return options;
}

/**
 * Calculates smart default 12-hour start and end times within 9:00 AM - 4:00 PM.
 * If today, picks the next available future time slot.
 */
export function getDefault12HrTimes(isToday: boolean): { startTime: string; endTime: string } {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  if (isToday) {
    // If today is before 9:00 AM
    if (currentMins < BOOKING_START_MINUTES) {
      return { startTime: '09:00 AM', endTime: '10:00 AM' };
    }
    // If today is between 9:00 AM and 3:45 PM
    if (currentMins < BOOKING_END_MINUTES - 15) {
      // Next 15-minute slot at or after current time
      const nextSlot = Math.ceil(currentMins / 15) * 15;
      const startH = Math.floor(nextSlot / 60);
      const startM = nextSlot % 60;
      const startTime = to12Hr(`${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`);

      const endSlot = Math.min(nextSlot + 60, BOOKING_END_MINUTES);
      const endH = Math.floor(endSlot / 60);
      const endM = endSlot % 60;
      const endTime = to12Hr(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
      return { startTime, endTime };
    }
    // If today is after 4:00 PM, all hours passed
    return { startTime: '09:00 AM', endTime: '10:00 AM' };
  }

  // Future dates default to 9:00 AM - 10:00 AM
  return {
    startTime: '09:00 AM',
    endTime: '10:00 AM',
  };
}

export interface ReservationValidation {
  isValid: boolean;
  startDateError?: string;
  startTimeError?: string;
  endTimeError?: string;
  generalError?: string;
  todayWindowPassed?: boolean;
  normalizedStartTime?: string;
  normalizedEndTime?: string;
  startMinutes?: number;
  endMinutes?: number;
}

/**
 * Performs complete date + time validation for a reservation:
 * 1. Allowed booking hours: 9:00 AM to 4:00 PM only
 * 2. If TODAY: Start Time must be at or after the current local time
 * 3. End Time must be strictly after Start Time
 * 4. Conflict overlap check
 */
export function validateReservation(
  date: string,
  startTime: string,
  endTime: string,
  checkOverlapFn?: (startMins: number, endMins: number) => { overlapping: boolean; conflictDesc?: string }
): ReservationValidation {
  const result: ReservationValidation = { isValid: true };

  // 1. Date check
  if (!date) {
    result.isValid = false;
    result.startDateError = 'Please select a reservation date';
    return result;
  }

  // 2. Start time check
  const startVal = validateAndNormalize12HrTime(startTime);
  if (!startVal.isValid) {
    result.isValid = false;
    result.startTimeError = startVal.error;
  } else {
    result.normalizedStartTime = startVal.normalized;
    result.startMinutes = startVal.totalMinutes;
  }

  // 3. End time check
  const endVal = validateAndNormalize12HrTime(endTime);
  if (!endVal.isValid) {
    result.isValid = false;
    result.endTimeError = endVal.error;
  } else {
    result.normalizedEndTime = endVal.normalized;
    result.endMinutes = endVal.totalMinutes;
  }

  // If format errors exist, stop here
  if (!startVal.isValid || !endVal.isValid) {
    return result;
  }

  const startMins = startVal.totalMinutes!;
  const endMins = endVal.totalMinutes!;

  // 4. Real Current Time check when TODAY is selected
  const todayStr = getTodayDateString();
  const isToday = date === todayStr;

  if (isToday) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const current12 = to12Hr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

    // Has the entire booking window (up to 4:00 PM) passed for today?
    if (currentMins >= BOOKING_END_MINUTES) {
      result.isValid = false;
      result.todayWindowPassed = true;
      result.startTimeError = 'No remaining times available today. Please select a future date.';
    } else if (startMins < currentMins) {
      result.isValid = false;
      result.startTimeError = 'This time has already passed. Please select a future time or date.';
    }
  }

  // 5. End datetime must be after Start datetime
  if (endMins <= startMins) {
    result.isValid = false;
    result.endTimeError = 'End Time must be later than Start Time';
  }

  // 6. Overlap check
  if (result.isValid && checkOverlapFn) {
    const overlap = checkOverlapFn(startMins, endMins);
    if (overlap.overlapping) {
      result.isValid = false;
      result.generalError = `Room is already reserved ${overlap.conflictDesc || ''} on this date`;
    }
  }

  return result;
}
