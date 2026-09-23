'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { TimetableEntry, StudentGroup } from '@/lib/types';

const PDF_FILE_NAME = 'B.Tech CSE(DS) 2nd Year 1st Sem Routine 2026-27 (1).pdf';
const PDF_URL = `/${encodeURIComponent(PDF_FILE_NAME)}`;

export const MyTimetableScreen: React.FC = () => {
  const {
    currentRole,
    timetable,
    selectedGroup,
    setSelectedGroup,
    setSelectedRoomId,
    navigate,
    rooms,
  } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';
  const role = (currentRole || 'student').toLowerCase();

  // Faculty should not have access to My Timetable; redirect to faculty dashboard
  useEffect(() => {
    if (role === 'faculty') {
      navigate('faculty-dashboard');
    }
  }, [role, navigate]);

  if (role === 'faculty') {
    return null;
  }


  // --- Real-time Clock (Browser actual date & time) ---
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // --- Date & Day Selection State ---
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Format YYYY-MM-DD for native date input
  const dateInputValue = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Check if selected date is today
  const isSelectedDateToday = useMemo(() => {
    return (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    );
  }, [selectedDate, now]);

  // Determine weekday from selected date
  const dayOfWeekIndex = selectedDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;

  const weekdayCode: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | null = useMemo(() => {
    switch (dayOfWeekIndex) {
      case 1:
        return 'Mon';
      case 2:
        return 'Tue';
      case 3:
        return 'Wed';
      case 4:
        return 'Thu';
      case 5:
        return 'Fri';
      default:
        return null;
    }
  }, [dayOfWeekIndex]);

  // Navigation handlers for days
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  };

  const handleJumpToToday = () => {
    setSelectedDate(new Date());
  };

  const handleSelectWeekday = (targetDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri') => {
    const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
    const targetIdx = map[targetDay];
    const currentIdx = selectedDate.getDay();
    const diff = targetIdx - currentIdx;
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + diff);
    setSelectedDate(nextDate);
  };


  // Filter daily timetable slots
  const activeDaySlots = useMemo(() => {
    if (!weekdayCode) return [];
    return timetable.filter((slot) => {
      const dayMatches = slot.day === weekdayCode;
      const groupMatches = slot.group === 'All' || slot.group === selectedGroup;
      return dayMatches && groupMatches;
    });
  }, [timetable, weekdayCode, selectedGroup]);

  // Compute chronological class status using browser's actual date & time
  const getClassStatus = (slot: TimetableEntry): 'current' | 'upcoming' | 'completed' => {
    const selYear = selectedDate.getFullYear();
    const selMonth = selectedDate.getMonth();
    const selDay = selectedDate.getDate();

    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();

    const selNum = selYear * 10000 + (selMonth + 1) * 100 + selDay;
    const nowNum = nowYear * 10000 + (nowMonth + 1) * 100 + nowDay;

    if (selNum < nowNum) return 'completed';
    if (selNum > nowNum) return 'upcoming';

    // Today: calculate decimal hour from real browser clock
    const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
    if (currentDecimalHour >= slot.startHour && currentDecimalHour < slot.endHour) {
      return 'current';
    } else if (currentDecimalHour < slot.startHour) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  };

  // Click on room link to view in SpotFree without changing room status
  const handleRoomClick = (roomName: string) => {
    if (!roomName || roomName === '-' || roomName === 'Campus') return;
    const clean = roomName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const foundRoom = rooms.find((r) => r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === clean);
    if (foundRoom) {
      setSelectedRoomId(foundRoom.id);
      navigate('room-details');
    } else {
      navigate('room-availability');
    }
  };

  // Human readable date header
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return selectedDate.toLocaleDateString('en-US', options);
  }, [selectedDate]);

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="My Timetable"
        subtitle="Heritage Institute of Technology"
        showBack={true}
      />

      <main
        className={
          isWeb
            ? 'w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6'
            : 'flex flex-col px-4 pt-3 pb-8 gap-4'
        }
      >
        {/* ============================================================== */}
        {/* SECTION 1: OPEN TIMETABLE PDF BUTTON                           */}
        {/* ============================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {PDF_FILE_NAME}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                Official Academic Routine · B.Tech CSE (DS) 2nd Year 1st Sem
              </span>
            </div>
          </div>

          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl bg-[#0f172a] hover:bg-slate-800 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
            title="Open Timetable PDF in a new browser tab"
          >
            <span>Open Timetable PDF</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: DAILY TIMETABLE (BELOW THE PDF)                     */}
        {/* ============================================================== */}
        <section className="flex flex-col gap-3.5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Daily Timetable
              </h2>
              <p className="text-xs text-slate-500">
                Official time-wise schedule based directly on the routine PDF
              </p>
            </div>

            {/* Student Group Selector (Group 1 vs Group 2) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold text-slate-600">Cohort:</span>
              <div className="p-1 rounded-xl bg-slate-200/80 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('Group 1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedGroup === 'Group 1'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Group 1
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGroup('Group 2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedGroup === 'Group 2'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Group 2
                </button>
              </div>
            </div>
          </div>

          {/* Day / Date Navigation & Date Picker */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              {/* Previous Day */}
              <button
                type="button"
                onClick={handlePrevDay}
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                title="Previous Day"
                aria-label="Previous Day"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
                <span className="hidden sm:inline">Prev Day</span>
              </button>

              {/* Current Selected Date & Date Picker Input */}
              <div className="flex items-center justify-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/80 transition-all cursor-pointer min-w-0"
                  title="Click to select a date"
                >
                  <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">
                    calendar_today
                  </span>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {formattedDate}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold truncate">
                      {isWeekend
                        ? 'Weekend (No Routine)'
                        : `${weekdayCode === 'Mon' ? 'Monday' : weekdayCode === 'Tue' ? 'Tuesday' : weekdayCode === 'Wed' ? 'Wednesday' : weekdayCode === 'Thu' ? 'Thursday' : 'Friday'} Routine`}
                    </span>
                  </div>
                </button>

                {/* Hidden native date input triggered by calendar button */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateInputValue}
                  onChange={handleDateChange}
                  className="sr-only"
                  aria-label="Select date"
                />

                {/* Jump to Today Button */}
                {!isSelectedDateToday && (
                  <button
                    type="button"
                    onClick={handleJumpToToday}
                    className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer border border-emerald-200 shrink-0"
                  >
                    Today
                  </button>
                )}
              </div>

              {/* Next Day */}
              <button
                type="button"
                onClick={handleNextDay}
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                title="Next Day"
                aria-label="Next Day"
              >
                <span className="hidden sm:inline">Next Day</span>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>

            {/* Quick Weekday Selector Pills */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
              {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((dayKey) => {
                const isActive = weekdayCode === dayKey;
                const fullDayLabels = {
                  Mon: 'Monday',
                  Tue: 'Tuesday',
                  Wed: 'Wednesday',
                  Thu: 'Thursday',
                  Fri: 'Friday',
                };
                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => handleSelectWeekday(dayKey)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="sm:hidden">{dayKey}</span>
                    <span className="hidden sm:inline">{fullDayLabels[dayKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time-wise Chronological Display */}
          <div className="flex flex-col gap-3">
            {/* If Weekend Selected */}
            {isWeekend && (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">weekend</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Weekend — No Academic Classes Scheduled
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    The official HIT CSE(DS) academic routine runs Monday through Friday.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectWeekday('Mon')}
                  className="mt-1 h-9 px-4 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  View Monday Schedule
                </button>
              </div>
            )}

            {/* If Weekday: Render Chronological List */}
            {!isWeekend && activeDaySlots.length === 0 && (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-slate-400">
                  event_busy
                </span>
                <p className="text-xs font-bold text-slate-700">
                  No classes scheduled for this day and group.
                </p>
              </div>
            )}

            {!isWeekend &&
              activeDaySlots.map((slot) => {
                const status = getClassStatus(slot);
                const isBreak = slot.type === 'Break' || slot.subjectCode === 'BREAK';

                // Render Recess / Lunch Break cleanly
                if (isBreak) {
                  return (
                    <div
                      key={slot.id}
                      className="py-2.5 px-4 rounded-xl bg-slate-100/90 border border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-600"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-slate-500">
                          restaurant
                        </span>
                        <span className="font-bold text-slate-800">{slot.subjectName}</span>
                        <span className="text-[11px] text-slate-500">({slot.startTime} – {slot.endTime})</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Recess
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={slot.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                      status === 'current'
                        ? 'bg-emerald-50/40 border-emerald-400 shadow-sm ring-1 ring-emerald-400/40'
                        : status === 'completed'
                        ? 'bg-white border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Time, Type, Status Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Time slot badge */}
                        <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-slate-500">
                            schedule
                          </span>
                          <span>
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </span>

                        {/* Session Type Pill */}
                        {slot.type && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              slot.type === 'Lab'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : slot.type === 'Lecture'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : slot.type === 'Mentoring'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : slot.type === 'Library'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {slot.type}
                          </span>
                        )}
                      </div>

                      {/* Live Class Status Badge (Current, Upcoming, Completed) */}
                      <div>
                        {status === 'current' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                            <span>In Session</span>
                          </span>
                        ) : status === 'upcoming' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Upcoming</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                            <span className="material-symbols-outlined text-xs">done</span>
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Subject Name & Subject Code */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {slot.subjectName}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {slot.subjectCode}
                        </span>
                      </div>

                      {/* Group Tag */}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold shrink-0">
                        {slot.group === 'All' ? 'All Cohort' : slot.group}
                      </span>
                    </div>

                    {/* Bottom Metadata: Faculty, TA, and Room */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      {/* Faculty / Instructor */}
                      {slot.faculty && slot.faculty !== '-' && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-slate-400">
                            person
                          </span>
                          <span className="font-medium">
                            {slot.facultyInitials ? (
                              <span className="font-bold text-slate-800 mr-1">
                                [{slot.facultyInitials}]
                              </span>
                            ) : null}
                            {slot.faculty}
                          </span>
                        </div>
                      )}

                      {/* TA (for practical sessions) */}
                      {slot.ta && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="material-symbols-outlined text-sm text-slate-400">
                            assignment_ind
                          </span>
                          <span>TA: {slot.ta}</span>
                        </div>
                      )}

                      {/* Room Number Link */}
                      {slot.room && slot.room !== '-' && (
                        <button
                          type="button"
                          onClick={() => handleRoomClick(slot.room)}
                          className="flex items-center gap-1 text-emerald-700 font-bold hover:underline cursor-pointer ml-auto"
                          title={`View ${slot.room} in SpotFree`}
                        >
                          <span className="material-symbols-outlined text-sm">meeting_room</span>
                          <span>Room: {slot.room}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => navigate('room-availability')}
            className="w-full sm:flex-1 py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>Check Room Availability</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(role === 'admin' ? 'admin-dashboard' : 'student-dashboard')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default MyTimetableScreen;
