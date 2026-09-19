'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { LiveRoomStatusSection } from '../LiveRoomStatusSection';
import { QuickDepartmentSpacesSection } from '../QuickDepartmentSpacesSection';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    history,
    setActiveFilterBuilding,
    navigate,
    getBuildingStats,
  } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  const buildings: Array<'CME' | 'CB' | 'ICT'> = ['CME', 'CB', 'ICT'];
  const bldgStats = buildings.map((b) => ({
    bldg: b,
    stats: getBuildingStats(b),
  }));

  const handleOpenBuilding = (b: string) => {
    setActiveFilterBuilding(b);
    navigate('manage-rooms');
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="SpotFree Admin"
        subtitle="Heritage Institute of Technology"
        showBack={false}
      />

      <main className={isWeb ? 'w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5' : 'flex flex-col px-4 pt-3 pb-8 gap-4'}>
        {/* Admin Overview Header Banner */}
        <div className="bg-[#0f172a] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                ADMIN
              </span>
              <span className="text-xs text-slate-300">{currentUser.name}</span>
            </div>
            <h2 className="text-base font-bold mt-1">Campus Facility Control</h2>
            <p className="text-xs text-slate-400">Synchronized Real-time Status Breakdown</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-xl">shield_person</span>
          </div>
        </div>

        {/* Live Room Status (with individual room view) */}
        <LiveRoomStatusSection initialBuilding="All" />

        {/* Quick Department Spaces */}
        <QuickDepartmentSpacesSection />

        {/* Buildings Breakdown */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Buildings Breakdown
            </span>
            <span className="text-[11px] text-slate-400">3 Campus Wings</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {bldgStats.map(({ bldg, stats }) => (
              <button
                key={bldg}
                onClick={() => handleOpenBuilding(bldg)}
                className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-emerald-500 active:scale-[0.98] transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-slate-900">{bldg}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stats.vacant > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    {stats.total} Rooms
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {stats.vacant} Vacant
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Administration Actions */}
        <section className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Administration Operations
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('manage-rooms')}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1 text-center hover:border-slate-900 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-1">
                <span className="material-symbols-outlined text-2xl">settings_input_component</span>
              </div>
              <span className="text-xs font-bold text-slate-900">Manage Rooms</span>
              <span className="text-[10px] text-slate-400">Add, edit & configure</span>
            </button>

            <button
              onClick={() => navigate('status-history')}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1 text-center hover:border-slate-900 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 mb-1">
                <span className="material-symbols-outlined text-2xl">history</span>
              </div>
              <span className="text-xs font-bold text-slate-900">Status History</span>
              <span className="text-[10px] text-slate-400">{history.length} audit logs</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
