'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';

export const StatusUpdatedScreen: React.FC = () => {
  const { selectedRoom, currentRole, navigate, currentUser } = useSpotFree();

  const r = selectedRoom;

  if (!r) {
    return (
      <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
        <Header title="Status Updated" showBack={true} />
        <div className="p-8 text-center text-slate-500 text-xs">No room selected.</div>
      </div>
    );
  }

  const handleReturnDashboard = () => {
    const roleNormalized = (currentRole || '').toLowerCase();
    if (roleNormalized === 'student') navigate('student-dashboard');
    else if (roleNormalized === 'faculty') navigate('faculty-dashboard');
    else if (roleNormalized === 'admin') navigate('admin-dashboard');
    else navigate('student-dashboard');
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Status Broadcast"
        subtitle="Confirmation"
        showBack={false}
      />

      <main className="flex flex-col max-w-xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12 gap-4 items-center text-center">
        {/* Success Confirmation Icon */}
        <div className="relative flex items-center justify-center pt-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
        </div>

        <div className="space-y-0.5 max-w-[280px]">
          <span className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase block">
            Live Broadcast Active
          </span>
          <h2 className="text-xl font-black text-slate-900">Status Updated!</h2>
          <p className="text-xs text-slate-500 leading-snug">
            Room occupancy has been synchronized with all SpotFree campus displays.
          </p>
        </div>

        {/* Status Change Summary Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 text-left">
          {/* Room Identifier */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                {r.building} Building • Floor {r.floor}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">{r.id}</h3>
              <p className="text-xs text-slate-500">{r.type}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-xl">meeting_room</span>
            </div>
          </div>

          {/* New Live Status Pill */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700">New Live Status:</span>
            <StatusBadge status={r.status} size="md" />
          </div>

          {/* Metadata Grid */}
          <div className="flex flex-col gap-2 text-xs text-slate-600 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Timestamp:</span>
              <span className="font-semibold text-slate-800">Just now</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Updated by:</span>
              <span className="font-semibold text-slate-800">{currentUser.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Audit Status:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Logged in Status History
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col w-full gap-2 pt-1">
          <button
            onClick={handleReturnDashboard}
            className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => navigate('status-history')}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            View in Status History
          </button>
          <button
            onClick={() => navigate('scan-qr')}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Scan Another Room Plaque
          </button>
        </div>
      </main>
    </div>
  );
};
