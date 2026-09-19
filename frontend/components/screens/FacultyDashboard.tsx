'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';
import { LiveRoomStatusSection } from '../LiveRoomStatusSection';
import { QuickDepartmentSpacesSection } from '../QuickDepartmentSpacesSection';

export const FacultyDashboard: React.FC = () => {
  const { currentUser, navigate } = useSpotFree();

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="SpotFree Faculty"
        subtitle="Heritage Institute of Technology"
        showBack={false}
      />

      <main className="flex flex-col px-4 pt-3 pb-8 gap-4">
        {/* Faculty Profile Banner */}
        <div className="bg-[#0f172a] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Faculty Portal
            </span>
            <h2 className="text-base font-bold mt-0.5">{currentUser.name}</h2>
            <p className="text-xs text-slate-300">{currentUser.dept}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-xl">badge</span>
          </div>
        </div>

        {/* Quick Room Actions Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-base">sync_saved_locally</span>
              Quick Room Actions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan classroom plaque or enter room code to update occupancy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('scan-qr')}
              className="p-3 bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-2xl text-emerald-400">qr_code_scanner</span>
              <span className="text-xs font-bold">Scan Room QR</span>
              <span className="text-[10px] text-slate-300">Door Plaque</span>
            </button>

            <button
              onClick={() => navigate('enter-room')}
              className="p-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-200 transition-all"
            >
              <span className="material-symbols-outlined text-2xl text-slate-700">pin</span>
              <span className="text-xs font-bold">Enter Room No.</span>
              <span className="text-[10px] text-slate-500">e.g. CME-104</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => navigate('status-history')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800"
            >
              <span className="material-symbols-outlined text-purple-600 text-base">history</span>
              <span>Status History</span>
            </button>
            <button
              onClick={() => navigate('room-availability')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800"
            >
              <span className="material-symbols-outlined text-emerald-600 text-base">meeting_room</span>
              <span>Availability</span>
            </button>
          </div>
        </div>

        {/* Live Room Status (with individual room view) */}
        <LiveRoomStatusSection initialBuilding="CME" />

        {/* Quick Department Spaces */}
        <QuickDepartmentSpacesSection />
      </main>
    </div>
  );
};
