'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';
import { LiveRoomStatusSection } from '../LiveRoomStatusSection';
import { QuickDepartmentSpacesSection } from '../QuickDepartmentSpacesSection';

const START_TIME_OPTIONS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    rooms,
    navigate,
    setActiveFilterBuilding,
    setActiveFilterStatus,
    setActiveFilterType,
    setSelectedRoomId,
    getBuildingStats,
    showToast,
  } = useSpotFree();

  const [searchBldg, setSearchBldg] = useState<string>('CME');
  const [searchDuration, setSearchDuration] = useState<string>('1h');
  const [startTime, setStartTime] = useState<string>('10:00 AM');
  const [isManualTime, setIsManualTime] = useState<boolean>(false);
  const [timeError, setTimeError] = useState<string>('');

  // Validate start time between 9:00 AM and 5:00 PM
  const validateTime = (t: string): boolean => {
    const trimmed = t.trim();
    if (!trimmed) {
      setTimeError('Please enter a start time');
      return false;
    }

    const twelveHourRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
    const twentyFourHourRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

    let totalMinutes = -1;

    const match12 = trimmed.match(twelveHourRegex);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      const meridiem = match12[3].toUpperCase();

      if (meridiem === 'AM') {
        if (hours === 12) hours = 0;
      } else if (meridiem === 'PM') {
        if (hours !== 12) hours += 12;
      }
      totalMinutes = hours * 60 + minutes;
    } else {
      const match24 = trimmed.match(twentyFourHourRegex);
      if (match24) {
        const hours = parseInt(match24[1], 10);
        const minutes = parseInt(match24[2], 10);
        totalMinutes = hours * 60 + minutes;
      }
    }

    if (totalMinutes === -1) {
      setTimeError('Invalid format. Use e.g. 10:00 AM or 14:30');
      return false;
    }

    // 9:00 AM = 540 min; 5:00 PM = 1020 min
    if (totalMinutes < 540 || totalMinutes > 1020) {
      setTimeError('Time must be between 9:00 AM and 5:00 PM');
      return false;
    }

    setTimeError('');
    return true;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTime(startTime)) {
      showToast('Start time must be between 9:00 AM and 5:00 PM', 'error');
      return;
    }
    setActiveFilterBuilding(searchBldg);
    setActiveFilterStatus('All');
    navigate('room-availability');
  };

  const handleQuickFilter = (type: string, status?: string) => {
    setActiveFilterBuilding('All');
    setActiveFilterType(type);
    if (status) setActiveFilterStatus(status);
    navigate('room-availability');
  };

  const handleOpenRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    navigate('room-details');
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header title="SpotFree HIT" subtitle="Heritage Institute of Technology" showBack={false} />

      <main className="flex flex-col px-4 pt-3 pb-8 gap-4">
        {/* Welcome Header Block */}
        <div className="bg-[#0f172a] text-white p-4 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Role: Student
              </span>
              <span className="text-[11px] text-slate-400">HIT Campus</span>
            </div>
            <h2 className="text-base font-bold mt-0.5">Welcome, {currentUser.name}</h2>
            <p className="text-slate-300 text-xs mt-0.5">
              Find available classrooms and seminar spaces near you.
            </p>
          </div>
        </div>

        {/* Suggest Best Room Instant Match Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-emerald-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-sm text-title-sm text-slate-900 font-bold">
                  Need an immediate spot?
                </span>
                <span className="text-xs text-slate-500">
                  Instant smart match based on group size
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('best-room-req')}
              className="px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95 transition-all shrink-0"
            >
              <span>Suggest</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Primary Room Search Form Card */}
        <section className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">search</span>
              <h2 className="font-title-md text-title-md text-slate-900 font-bold">
                Find Available Rooms
              </h2>
            </div>
            <span className="font-label-sm text-label-sm text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2.5">
            {/* Building Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Campus Building
              </label>
              <div className="relative bg-slate-50 rounded-lg border border-slate-200">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400 pointer-events-none">
                  domain
                </span>
                <select
                  value={searchBldg}
                  onChange={(e) => setSearchBldg(e.target.value)}
                  className="w-full h-11 pl-9 pr-8 bg-transparent text-xs text-slate-900 font-semibold appearance-none focus:outline-none"
                >
                  <option value="All">All Buildings</option>
                  <option value="CME">CME — Computer & Mechanical Engg</option>
                  <option value="CB">CB — Central Block</option>
                  <option value="ICT">ICT — Information & Comm. Tech</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-lg text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Date and Time Slot */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </label>
                <div className="relative bg-slate-50 rounded-lg border border-slate-200">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-base text-slate-400 pointer-events-none">
                    calendar_today
                  </span>
                  <select className="w-full h-11 pl-8 pr-6 bg-transparent text-xs text-slate-800 font-medium appearance-none focus:outline-none">
                    <option>Today, Mon</option>
                    <option>Tomorrow, Tue</option>
                    <option>Wed, Nov 20</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-base text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Start Time
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualTime(!isManualTime);
                      setTimeError('');
                    }}
                    className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
                  >
                    {isManualTime ? 'Choose from list' : 'Type manually'}
                  </button>
                </div>
                <div className={`relative bg-slate-50 rounded-lg border transition-colors ${
                  timeError ? 'border-rose-400 focus-within:border-rose-500' : 'border-slate-200'
                }`}>
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-base text-slate-400 pointer-events-none">
                    schedule
                  </span>
                  {!isManualTime ? (
                    <select
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        if (timeError) setTimeError('');
                      }}
                      className="w-full h-11 pl-8 pr-6 bg-transparent text-xs text-slate-800 font-medium appearance-none focus:outline-none"
                    >
                      {START_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        if (timeError) setTimeError('');
                      }}
                      placeholder="e.g. 10:15 AM"
                      className="w-full h-11 pl-8 pr-3 bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
                    />
                  )}
                  {!isManualTime && (
                    <span className="material-symbols-outlined absolute right-2 top-2.5 text-base text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  )}
                </div>
                {timeError && (
                  <span className="text-[10px] text-rose-600 font-semibold leading-tight">{timeError}</span>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Duration
              </label>
              <div className="relative bg-slate-50 rounded-lg border border-slate-200">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400 pointer-events-none">
                  timer
                </span>
                <select
                  value={searchDuration}
                  onChange={(e) => setSearchDuration(e.target.value)}
                  className="w-full h-11 pl-9 pr-8 bg-transparent text-xs text-slate-800 font-medium appearance-none focus:outline-none"
                >
                  <option value="45m">45 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="1.5h">1.5 Hours</option>
                  <option value="2h">2 Hours</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-lg text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-title-sm text-title-sm font-bold flex items-center justify-center space-x-2 shadow-sm active:scale-[0.98] transition-transform mt-1"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Find Available Rooms</span>
            </button>
          </form>
        </section>

        {/* Action Shortcuts: Scan QR | Enter Room No | My Timetable */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('scan-qr')}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1 text-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-emerald-600 text-2xl">qr_code_scanner</span>
            <span className="text-xs font-bold text-slate-900">Scan QR</span>
            <span className="text-[10px] text-slate-400 leading-none">Door Plaque</span>
          </button>

          <button
            onClick={() => navigate('enter-room')}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1 text-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-slate-700 text-2xl">pin</span>
            <span className="text-xs font-bold text-slate-900">Enter No.</span>
            <span className="text-[10px] text-slate-400 leading-none">Manual Entry</span>
          </button>

          <button
            onClick={() => navigate('my-timetable')}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1 text-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-blue-600 text-2xl">calendar_month</span>
            <span className="text-xs font-bold text-slate-900">Timetable</span>
            <span className="text-[10px] text-slate-400 leading-none">CSE (DS) Y2</span>
          </button>
        </div>

        {/* LIVE ROOM STATUS (With Status Counts and Individual Room Status Option) */}
        <LiveRoomStatusSection initialBuilding={searchBldg} />

        {/* Quick Department Spaces */}
        <QuickDepartmentSpacesSection />

        {/* Quick Filters Grid */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center space-x-1 px-0.5">
            <span className="material-symbols-outlined text-[18px] text-slate-500">filter_list</span>
            <h3 className="font-title-sm text-title-sm text-slate-900 font-bold">Quick Filters</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickFilter('All', 'VACANT')}
              className="bg-emerald-600 text-white p-3 rounded-xl shadow-sm flex items-center justify-between active:scale-95 transition-transform"
            >
              <span className="font-title-sm text-title-sm">Free Now</span>
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </button>
            <button
              onClick={() => handleQuickFilter('CLASSROOM')}
              className="bg-white text-slate-900 p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-transform"
            >
              <span className="font-title-sm text-title-sm">Classrooms</span>
              <span className="material-symbols-outlined text-[20px] text-slate-500">
                meeting_room
              </span>
            </button>
            <button
              onClick={() => handleQuickFilter('SEMINAR HALL')}
              className="bg-white text-slate-900 p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-transform"
            >
              <span className="font-title-sm text-title-sm">Seminar Halls</span>
              <span className="material-symbols-outlined text-[20px] text-slate-500">co_present</span>
            </button>
            <button
              onClick={() => handleQuickFilter('LABS')}
              className="bg-white text-slate-900 p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-transform"
            >
              <span className="font-title-sm text-title-sm">Laboratories</span>
              <span className="material-symbols-outlined text-[20px] text-slate-500">science</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
