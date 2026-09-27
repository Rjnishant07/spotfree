// AUTO-PORTED from frontend/context/SpotFreeContext.tsx (timetable engine + authority rules).
// Keep in sync if those functions change.
export const PROTECTED_QR_ROOMS = ['CME604', 'CME605', 'CB501', 'ICT403', 'ICT B08'];
export function isProtectedQrRoom(roomId) {
    if (!roomId)
        return false;
    const clean = roomId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return ['CME604', 'CME605', 'CB501', 'ICT403', 'ICTB08'].includes(clean);
}
/**
 * Normalizes user role string to hierarchy AuthorityLevel:
 * ADMIN > FACULTY > TIMETABLE > STUDENT
 */
export function normalizeRoleToAuthority(role) {
    const r = (role || '').toUpperCase();
    if (r.includes('ADMIN'))
        return 'ADMIN';
    if (r.includes('FACULTY') || r.includes('TEACHER'))
        return 'FACULTY';
    if (r.includes('TIMETABLE'))
        return 'TIMETABLE';
    return 'STUDENT';
}
/**
 * Real-time Timetable Occupancy Engine for timetable-controlled rooms.
 * Strictly ignores the 5 protected QR rooms.
 * Uses real browser/device date & time to calculate live status.
 */
export function computeTimetableRoomState(room, now, timetableEntries) {
    if (isProtectedQrRoom(room.id) || !room.isTimetableControlled) {
        return room;
    }
    const cleanRoomId = room.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const roomClasses = timetableEntries.filter((c) => c.room.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanRoomId);
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    const weekdayCodes = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const todayCode = isWeekday ? weekdayCodes[dayOfWeek - 1] : null;
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const nowDecimal = nowHours + nowMinutes / 60;
    const weekDayOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
    // Helper to find next upcoming class across future days
    const findNextUpcomingClass = () => {
        if (roomClasses.length === 0)
            return null;
        const currentDayVal = isWeekday ? dayOfWeek : (dayOfWeek === 0 ? 0 : 6);
        const sorted = [...roomClasses].sort((a, b) => {
            const dayDiff = weekDayOrder[a.day] - weekDayOrder[b.day];
            if (dayDiff !== 0)
                return dayDiff;
            return a.startHour - b.startHour;
        });
        // 1. Check later today
        if (todayCode) {
            const laterToday = sorted.find((c) => c.day === todayCode && c.startHour > nowDecimal);
            if (laterToday) {
                return {
                    subjectCode: laterToday.subjectCode,
                    subjectName: laterToday.subjectName,
                    faculty: laterToday.faculty,
                    facultyInitials: laterToday.facultyInitials,
                    startTime: laterToday.startTime,
                    endTime: laterToday.endTime,
                    day: laterToday.day,
                    group: laterToday.group,
                    type: laterToday.type || 'Lecture',
                    room: room.id,
                };
            }
        }
        // 2. Check subsequent weekdays
        const laterInWeek = sorted.find((c) => weekDayOrder[c.day] > currentDayVal);
        if (laterInWeek) {
            return {
                subjectCode: laterInWeek.subjectCode,
                subjectName: laterInWeek.subjectName,
                faculty: laterInWeek.faculty,
                facultyInitials: laterInWeek.facultyInitials,
                startTime: laterInWeek.startTime,
                endTime: laterInWeek.endTime,
                day: laterInWeek.day,
                group: laterInWeek.group,
                type: laterInWeek.type || 'Lecture',
                room: room.id,
            };
        }
        // 3. Wrap around to first class in next week
        if (sorted.length > 0) {
            const firstInWeek = sorted[0];
            return {
                subjectCode: firstInWeek.subjectCode,
                subjectName: firstInWeek.subjectName,
                faculty: firstInWeek.faculty,
                facultyInitials: firstInWeek.facultyInitials,
                startTime: firstInWeek.startTime,
                endTime: firstInWeek.endTime,
                day: firstInWeek.day,
                group: firstInWeek.group,
                type: firstInWeek.type || 'Lecture',
                room: room.id,
            };
        }
        return null;
    };
    const upcomingClass = findNextUpcomingClass();
    // Weekend Rule -> VACANT
    if (!isWeekday || !todayCode) {
        return {
            ...room,
            status: 'VACANT',
            statusAuthority: 'TIMETABLE',
            updatedBy: 'HIT Academic Timetable',
            updatedRole: 'TIMETABLE',
            timeText: 'Available (Weekend • No scheduled classes)',
            availableUntil: 'Open',
            reservedStart: null,
            reservedEnd: null,
            reservedUntil: null,
            currentClass: null,
            upcomingClass,
            timeline: [
                { time: 'All Day', text: 'Weekend • Space Available for Study', status: 'Active' },
            ],
        };
    }
    const todayClasses = roomClasses
        .filter((c) => c.day === todayCode)
        .sort((a, b) => a.startHour - b.startHour);
    // Dynamic timeline for today
    const dynamicTimeline = todayClasses.length > 0
        ? todayClasses.map((c) => {
            let status = 'Upcoming';
            if (nowDecimal >= c.endHour)
                status = 'Ended';
            else if (nowDecimal >= c.startHour && nowDecimal < c.endHour)
                status = 'Active';
            const groupPart = c.group !== 'All' ? ` (${c.group})` : '';
            return {
                time: `${c.startTime} – ${c.endTime}`,
                text: `${c.subjectCode} • ${c.subjectName}${groupPart} (${c.faculty})`,
                status,
            };
        })
        : [{ time: '09:00 - 06:00 PM', text: 'Free Study Period', status: 'Active' }];
    // Rule D: After 6:00 PM (18:00) -> VACANT
    if (nowDecimal >= 18.0) {
        return {
            ...room,
            status: 'VACANT',
            statusAuthority: 'TIMETABLE',
            updatedBy: 'HIT Academic Timetable',
            updatedRole: 'TIMETABLE',
            timeText: 'Available (Campus timetable concluded at 6:00 PM)',
            availableUntil: 'Open',
            reservedStart: null,
            reservedEnd: null,
            reservedUntil: null,
            currentClass: null,
            upcomingClass,
            timeline: dynamicTimeline,
        };
    }
    // Rule E: Before 9:00 AM (< 9.0) -> VACANT
    if (nowDecimal < 9.0) {
        const firstToday = todayClasses[0];
        return {
            ...room,
            status: 'VACANT',
            statusAuthority: 'TIMETABLE',
            updatedBy: 'HIT Academic Timetable',
            updatedRole: 'TIMETABLE',
            timeText: firstToday
                ? `Available until ${firstToday.startTime} • Next: ${firstToday.subjectCode} (${firstToday.startTime})`
                : 'Available (No classes scheduled today)',
            availableUntil: firstToday ? firstToday.startTime : '06:00 PM',
            reservedStart: firstToday ? firstToday.startTime : null,
            reservedEnd: firstToday ? firstToday.endTime : null,
            reservedUntil: firstToday ? firstToday.endTime : null,
            currentClass: null,
            upcomingClass,
            timeline: dynamicTimeline,
        };
    }
    // Active Class interval (Rule A)
    // If multiple classes overlap or exist, find matching active class deterministically
    const activeSlot = todayClasses.find((c) => nowDecimal >= c.startHour && nowDecimal < c.endHour);
    if (activeSlot) {
        const currentClassInfo = {
            subjectCode: activeSlot.subjectCode,
            subjectName: activeSlot.subjectName,
            faculty: activeSlot.faculty,
            facultyInitials: activeSlot.facultyInitials,
            startTime: activeSlot.startTime,
            endTime: activeSlot.endTime,
            day: activeSlot.day,
            group: activeSlot.group,
            type: activeSlot.type || 'Lecture',
            room: room.id,
        };
        const nextClassToday = todayClasses.find((c) => c.startHour >= activeSlot.endHour);
        const activeNextUpcoming = nextClassToday
            ? {
                subjectCode: nextClassToday.subjectCode,
                subjectName: nextClassToday.subjectName,
                faculty: nextClassToday.faculty,
                facultyInitials: nextClassToday.facultyInitials,
                startTime: nextClassToday.startTime,
                endTime: nextClassToday.endTime,
                day: nextClassToday.day,
                group: nextClassToday.group,
                type: nextClassToday.type || 'Lecture',
                room: room.id,
            }
            : upcomingClass;
        const groupText = activeSlot.group !== 'All' ? ` • ${activeSlot.group}` : '';
        return {
            ...room,
            status: 'OCCUPIED',
            statusAuthority: 'TIMETABLE',
            updatedBy: activeSlot.faculty,
            updatedRole: 'TIMETABLE',
            timeText: `Occupied: ${activeSlot.subjectCode} ${activeSlot.subjectName} (${activeSlot.startTime} – ${activeSlot.endTime})${groupText} • ${activeSlot.faculty}`,
            availableUntil: activeSlot.endTime,
            reservedStart: activeSlot.startTime,
            reservedEnd: activeSlot.endTime,
            reservedUntil: null,
            currentClass: currentClassInfo,
            upcomingClass: activeNextUpcoming,
            timeline: dynamicTimeline,
        };
    }
    // Free period / Between Classes (Rule B & C)
    const nextToday = todayClasses.find((c) => c.startHour > nowDecimal);
    if (nextToday) {
        const nextClassInfo = {
            subjectCode: nextToday.subjectCode,
            subjectName: nextToday.subjectName,
            faculty: nextToday.faculty,
            facultyInitials: nextToday.facultyInitials,
            startTime: nextToday.startTime,
            endTime: nextToday.endTime,
            day: nextToday.day,
            group: nextToday.group,
            type: nextToday.type || 'Lecture',
            room: room.id,
        };
        return {
            ...room,
            status: 'VACANT',
            statusAuthority: 'TIMETABLE',
            updatedBy: 'HIT Academic Timetable',
            updatedRole: 'TIMETABLE',
            timeText: `Available now until ${nextToday.startTime} • Next: ${nextToday.subjectCode} (${nextToday.faculty})`,
            availableUntil: nextToday.startTime,
            reservedStart: nextToday.startTime,
            reservedEnd: nextToday.endTime,
            reservedUntil: nextToday.endTime,
            currentClass: null,
            upcomingClass: nextClassInfo,
            timeline: dynamicTimeline,
        };
    }
    // No more classes today
    return {
        ...room,
        status: 'VACANT',
        statusAuthority: 'TIMETABLE',
        updatedBy: 'HIT Academic Timetable',
        updatedRole: 'TIMETABLE',
        timeText: 'Available (Classes concluded for today)',
        availableUntil: '06:00 PM',
        reservedStart: null,
        reservedEnd: null,
        reservedUntil: null,
        currentClass: null,
        upcomingClass,
        timeline: dynamicTimeline,
    };
}
/**
 * Checks whether a user with given role can override/update a room with target authority.
 * Room permission hierarchy:
 * - Student booking/status → can be changed by Faculty or Admin (or Student if Student-controlled).
 * - Timetable occupancy → can be overridden by Admin or Faculty.
 * - Faculty booking/status → can be changed ONLY by Admin.
 * - Admin booking/status → can be changed ONLY by Admin.
 */
export function canUserOverrideRoom(userRole, roomAuthority) {
    const userAuth = normalizeRoleToAuthority(userRole);
    const targetAuth = roomAuthority || 'STUDENT';
    // ADMIN can override/change any room status or booking
    if (userAuth === 'ADMIN') {
        return {
            allowed: true,
            isOverride: targetAuth !== 'ADMIN',
        };
    }
    // Admin booking/status → can be changed ONLY by Admin
    if (targetAuth === 'ADMIN') {
        return {
            allowed: false,
            reason: 'This room status is controlled by Admin (can only be changed by Admin).',
            isOverride: false,
        };
    }
    // Faculty booking/status → can be changed ONLY by Admin
    if (targetAuth === 'FACULTY') {
        return {
            allowed: false,
            reason: 'This room status is controlled by Faculty (can only be changed by Admin).',
            isOverride: false,
        };
    }
    // Timetable scheduled class → can be overridden by Faculty or Admin
    if (targetAuth === 'TIMETABLE') {
        if (userAuth === 'FACULTY') {
            return {
                allowed: true,
                isOverride: true,
            };
        }
        return {
            allowed: false,
            reason: 'This room is occupied by a scheduled academic timetable class.',
            isOverride: false,
        };
    }
    // Student booking/status → can be changed by Faculty or Admin (or Student if Student-controlled)
    if (targetAuth === 'STUDENT') {
        if (userAuth === 'FACULTY') {
            return {
                allowed: true,
                isOverride: true,
            };
        }
        if (userAuth === 'STUDENT') {
            return {
                allowed: true,
                isOverride: false,
            };
        }
    }
    return {
        allowed: false,
        reason: 'Permission denied.',
        isOverride: false,
    };
}
