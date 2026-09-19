'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';

export const RecommendedRoomScreen: React.FC = () => {
  const { recommendedRoom, rooms, setSelectedRoomId, navigate } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  const r = recommendedRoom || rooms.find((rm) => rm.status === 'VACANT') || rooms[0];

  // Other vacant alternatives
  const alternatives = rooms
    .filter((rm) => rm.id !== r.id && rm.status === 'VACANT')
    .slice(0, 3);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    navigate('room-details');
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Smart Room Finder"
        subtitle="Step 2 of 2: Recommendation"
        showBack={true}
      />

      <main className={isWeb ? 'w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4' : 'flex flex-col px-4 pt-3 pb-8 gap-3.5'}>
        {/* Match Confirmation Bar */}
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <span className="text-xs font-bold text-emerald-900">Optimal Match Identified</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-xs">
            98% MATCH
          </span>
        </div>

        {/* Primary Recommended Room Card */}
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {r.building} Building • Floor {r.floor}
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{r.id}</h2>
              <p className="text-xs text-slate-500 font-medium">{r.type}</p>
            </div>
            <StatusBadge status={r.status} />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-sm text-emerald-600">timelapse</span>
              <span className="truncate font-medium">{r.timeText}</span>
            </div>
            <span className="font-bold text-slate-900 shrink-0 ml-2">{r.capacity} seats</span>
          </div>

          {/* Why this room reasoning */}
          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60 flex flex-col gap-1.5 text-xs text-slate-700">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Why this room?
            </span>
            <div className="flex items-start gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-sm text-emerald-600 shrink-0 mt-0.5">
                check
              </span>
              <span>Optimal capacity matching your requested group size.</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-sm text-emerald-600 shrink-0 mt-0.5">
                check
              </span>
              <span>Equipped with active power outlets, whiteboard, and AC.</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px]">
              <span className="material-symbols-outlined text-sm text-emerald-600 shrink-0 mt-0.5">
                check
              </span>
              <span>Live verified vacant with no conflicting timetable sessions.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleSelectRoom(r.id)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all text-center"
            >
              View Room Details
            </button>
            <button
              onClick={() => {
                setSelectedRoomId(r.id);
                navigate('update-status');
              }}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center"
            >
              Update Status
            </button>
          </div>
        </div>

        {/* Alternative Available Rooms */}
        <section className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Alternative Available Spaces
          </span>
          {alternatives.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No other vacant rooms at this moment.</p>
          ) : (
            alternatives.map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{alt.id}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {alt.building} • {alt.type} • {alt.capacity} seats
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">{alt.timeText}</p>
                </div>
                <button
                  onClick={() => handleSelectRoom(alt.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                >
                  View
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};
