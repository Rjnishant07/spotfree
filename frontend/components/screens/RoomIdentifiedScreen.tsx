'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';

export const RoomIdentifiedScreen: React.FC = () => {
  const { selectedRoom, navigate, canUserOverrideRoom, currentRole } = useSpotFree();

  const r = selectedRoom;

  if (!r) {
    return (
      <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
        <Header title="Room Identified" showBack={true} />
        <div className="p-8 text-center text-slate-500 text-xs">No room selected.</div>
      </div>
    );
  }

  const isVacant = r.status === 'VACANT';
  const roomAuth = (r.statusAuthority || r.updatedRole || 'STUDENT') as any;
  const authCheck = isVacant
    ? { allowed: true, isOverride: false }
    : canUserOverrideRoom(roomAuth);

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Room Identified"
        subtitle="Classroom Plaque Confirmed"
        showBack={true}
      />

      <main className="flex flex-col px-4 pt-3 pb-8 gap-3.5">
        {/* Plaque Confirmed Banner */}
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-900 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">qr_code_2</span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950">Door Plaque Confirmed</h3>
            <p className="text-[11px] text-emerald-800">
              Direct connection established for {r.id} ({r.building} Wing).
            </p>
          </div>
        </div>

        {/* Room Card Summary */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                {r.building} Building • Floor {r.floor}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">{r.id}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {r.type} • {r.capacity} seats capacity
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2 text-xs text-slate-700 font-medium">
            <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
            <span className="truncate">{r.timeText}</span>
          </div>

          {/* Controlling Authority Indicator */}
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-slate-500 font-medium">Controlling Authority:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              (r.statusAuthority || 'STUDENT') === 'ADMIN'
                ? 'bg-purple-100 text-purple-800'
                : (r.statusAuthority || 'STUDENT') === 'FACULTY'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              <span className="material-symbols-outlined text-xs">
                {(r.statusAuthority || 'STUDENT') === 'ADMIN' ? 'shield_person' : (r.statusAuthority || 'STUDENT') === 'FACULTY' ? 'school' : 'person'}
              </span>
              <span>{r.statusAuthority || 'STUDENT'}{r.updatedBy ? ` (${r.updatedBy})` : ''}</span>
            </span>
          </div>

          {/* Authority Restriction Message if not allowed (only on non-vacant rooms) */}
          {!isVacant && !authCheck.allowed && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 text-[11px] shadow-2xs">
              <span className="material-symbols-outlined text-rose-600 text-base shrink-0 mt-0.5">lock</span>
              <div>
                <span className="font-bold block">{authCheck.reason}</span>
                <span className="text-rose-700">As a {currentRole}, you cannot modify status controlled by higher authority.</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => (isVacant || authCheck.allowed) && navigate('update-status')}
              disabled={!isVacant && !authCheck.allowed}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                !isVacant && !authCheck.allowed
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                  : authCheck.isOverride
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white cursor-pointer'
                  : 'bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {!isVacant && !authCheck.allowed ? 'lock' : authCheck.isOverride ? 'upgrade' : 'edit_calendar'}
              </span>
              <span>
                {!isVacant && !authCheck.allowed
                  ? 'Status Update Restricted'
                  : authCheck.isOverride
                  ? 'Override Room Status'
                  : 'Update Room Status'}
              </span>
            </button>

            <button
              onClick={() => navigate('room-details')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 rounded-xl text-xs font-bold transition-all text-center"
            >
              View Room Full Details
            </button>

            <button
              onClick={() => navigate('scan-qr')}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium text-center"
            >
              Scan Another Room Plaque
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomIdentifiedScreen;
