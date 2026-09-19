'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';
import { StudentGroup } from '@/lib/types';

export const MyTimetableScreen: React.FC = () => {
  const {
    timetable,
    selectedGroup,
    setSelectedGroup,
    simulatedDay,
    setSimulatedDay,
    simulatedHour,
    setSimulatedTime,
    isTimetableSyncing,
    simulateTimetableUpload,
    setSelectedRoomId,
    navigate,
  } = useSpotFree();

  const [simulatedTimeSelection, setSimulatedTimeSelection] = useState<string>('10.5');

  const days: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Filter timetable for selected day and student group
  const daySchedule = timetable.filter(
    (slot) => slot.day === simulatedDay && (slot.group === 'All' || slot.group === selectedGroup)
  );

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseFloat(e.target.value);
    setSimulatedTimeSelection(e.target.value);
    const label =
      val === 10.5
        ? '10:30 AM'
        : val === 11.5
        ? '11:30 AM'
        : val === 14.5
        ? '02:30 PM'
        : '05:00 PM';
    setSimulatedTime(val, label);
  };

  const handleRoomClick = (roomId: string) => {
    setSelectedRoomId(roomId);
    navigate('room-details');
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="My Timetable"
        subtitle="Heritage Institute of Technology"
        showBack={true}
      />

      <main className="flex flex-col px-4 pt-3 pb-8 gap-3.5">
        {/* Live Sync Pill */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">
              Timetable Sync Active
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">HIT Registrar Portal</span>
        </div>

        {/* Timetable File Banner & Simulated Upload/Replace */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="font-bold text-xs text-slate-900 truncate">
                  HIT_CSE_DS_Sem3_Timetable.pdf
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  Session 2026–2027 · Eff. 20.07.2026
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase shrink-0">
              CSE-DS · Y2
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
              <span>Registrar Verified</span>
            </div>
            <button
              onClick={simulateTimetableUpload}
              disabled={isTimetableSyncing}
              className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span className={`material-symbols-outlined text-sm ${isTimetableSyncing ? 'animate-spin' : ''}`}>
                {isTimetableSyncing ? 'sync' : 'cloud_sync'}
              </span>
              <span>{isTimetableSyncing ? 'Syncing...' : 'Sync Timetable'}</span>
            </button>
          </div>
        </div>

        {/* Student Group Selector (Group 1 vs Group 2) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Student Cohort Group
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">Auto-filtering schedule</span>
          </div>
          <div className="p-1 rounded-xl bg-slate-200/70 flex items-center gap-1">
            <button
              onClick={() => setSelectedGroup('Group 1')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-center transition-all ${
                selectedGroup === 'Group 1'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Group 1
            </button>
            <button
              onClick={() => setSelectedGroup('Group 2')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-center transition-all ${
                selectedGroup === 'Group 2'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Group 2
            </button>
          </div>
          <p className="text-[11px] text-slate-500 px-1">
            Selected group determines which practical session and classroom assignments apply.
          </p>
        </div>

        {/* Schedule Time Simulation Control */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Simulate Campus Clock
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Affects Live Occupancy
            </span>
          </div>
          <select
            value={simulatedTimeSelection}
            onChange={handleTimeChange}
            className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
          >
            <option value="10.5">10:00 AM – 11:00 AM (Data Structures Slot)</option>
            <option value="11.5">11:00 AM – 12:00 PM (Architecture Slot)</option>
            <option value="14.5">02:00 PM – 04:00 PM (Practical Session Slot)</option>
            <option value="17.0">05:00 PM (After Classes - Vacant Slots)</option>
          </select>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSimulatedDay(d)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                simulatedDay === d
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Scheduled Classes List */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold text-slate-900">
              {simulatedDay === 'Mon'
                ? 'Monday Classes'
                : simulatedDay === 'Tue'
                ? 'Tuesday Classes'
                : simulatedDay === 'Wed'
                ? 'Wednesday Classes'
                : simulatedDay === 'Thu'
                ? 'Thursday Classes'
                : 'Friday Classes'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {daySchedule.length} Scheduled Slots
            </span>
          </div>

          {daySchedule.map((slot) => {
            const isActiveNow =
              simulatedHour >= slot.startHour && simulatedHour < slot.endHour;

            return (
              <div
                key={slot.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 transition-all"
              >
                {/* Live Status Header */}
                <div className="flex items-center justify-between">
                  {isActiveNow ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      OCCUPIED · In Session until {slot.endTime}
                    </span>
                  ) : simulatedHour >= slot.endHour ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Class Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Upcoming · Starts at {slot.startTime}
                    </span>
                  )}

                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    SpotFree Synced
                  </span>
                </div>

                {/* Class Details */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {slot.subjectName}
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-500 ml-2">
                      {slot.subjectCode}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <button
                      onClick={() => handleRoomClick(slot.room)}
                      className="flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                    >
                      <span className="material-symbols-outlined text-base">meeting_room</span>
                      <span>Room {slot.room}</span>
                    </button>

                    <div className="flex items-center gap-1 text-slate-500">
                      <span className="material-symbols-outlined text-base">groups</span>
                      <span>{slot.group === 'All' ? 'All Cohort' : slot.group}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      <span>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Occupancy Impact Note */}
                <div
                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                    isActiveNow ? 'bg-rose-50 text-rose-900' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-base ${
                        isActiveNow ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      sensor_door
                    </span>
                    <span className="text-[11px]">
                      {isActiveNow
                        ? `Room ${slot.room} is occupied for this scheduled lecture`
                        : `Room ${slot.room} will be marked OCCUPIED at ${slot.startTime}`}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-slate-400">lock</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timetable Occupancy Impact Note Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-3 items-start">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-lg">sync_saved_locally</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-bold text-slate-900">How Timetable Affects SpotFree</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When a class is scheduled for your cohort group, the assigned classroom (e.g. CME604 or CB501) automatically reflects as <strong className="text-rose-700">OCCUPIED</strong> across all live room statuses during that period.
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => navigate('room-availability')}
            className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>Check Room Availability</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
          <button
            onClick={() => navigate('student-dashboard')}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};
