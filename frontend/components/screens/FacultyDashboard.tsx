'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { LiveRoomStatusSection } from '../LiveRoomStatusSection';
import { QuickDepartmentSpacesSection } from '../QuickDepartmentSpacesSection';

export const FacultyDashboard: React.FC = () => {
  const { currentUser, navigate, getBuildingStats } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';
  const stats = getBuildingStats('All');

  const quickActions = [
    {
      title: 'Scan Room QR',
      desc: 'Use the door plaque',
      icon: 'qr_code_scanner',
      action: () => navigate('scan-qr'),
      primary: true,
    },
    {
      title: 'Enter Room No.',
      desc: 'Example: CME-104',
      icon: 'pin',
      action: () => navigate('enter-room'),
      primary: false,
    },
    {
      title: 'Availability',
      desc: 'Browse campus rooms',
      icon: 'meeting_room',
      action: () => navigate('room-availability'),
      primary: false,
    },
    {
      title: 'Status History',
      desc: 'Review recent changes',
      icon: 'history',
      action: () => navigate('status-history'),
      primary: false,
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#fafaf9]">
      <Header title="SpotFree Faculty" subtitle="Campus Workspace" showBack={false} />

      <main className={isWeb
        ? 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6'
        : 'flex flex-col px-4 pt-3 pb-8 gap-4'}
      >
        <section className="relative overflow-hidden rounded-3xl bg-[#1c1917] text-white p-5 sm:p-6 shadow-sm">
          <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-emerald-500/10" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Faculty portal
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2 truncate">{currentUser.name}</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 truncate">{currentUser.dept}</p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-white/10 border border-white/10 items-center justify-center text-emerald-300 shrink-0">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
          </div>
        </section>

        <section aria-label="Campus room summary" className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
            <div className="text-[10px] font-bold text-emerald-700">Available</div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">{stats.vacant}</div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
            <div className="text-[10px] font-bold text-rose-700">Occupied</div>
            <div className="text-2xl font-black text-rose-800 mt-0.5">{stats.occupied}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
            <div className="text-[10px] font-bold text-amber-700">Reserved</div>
            <div className="text-2xl font-black text-amber-800 mt-0.5">{stats.reserved}</div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="px-0.5">
            <h3 className="text-sm font-extrabold text-slate-900">Room actions</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Update classroom occupancy in a few seconds</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {quickActions.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-3 min-h-[128px] transition-all active:scale-[0.99] ${
                  item.primary
                    ? 'bg-[#1c1917] text-white border-[#1c1917] hover:bg-slate-800'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.primary ? 'bg-white/10 text-emerald-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div className="mt-auto">
                  <span className={`block text-xs font-extrabold ${item.primary ? 'text-white' : 'text-slate-900'}`}>{item.title}</span>
                  <span className={`block text-[10px] mt-0.5 ${item.primary ? 'text-slate-300' : 'text-slate-500'}`}>{item.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="px-0.5">
            <h3 className="text-sm font-extrabold text-slate-900">Live room status</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">See current availability before updating a room</p>
          </div>
          <LiveRoomStatusSection initialBuilding="CME" />
        </section>

        <QuickDepartmentSpacesSection />
      </main>
    </div>
  );
};
