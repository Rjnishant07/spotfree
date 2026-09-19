'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { RoomCard } from '../RoomCard';

export const RoomAvailabilityScreen: React.FC = () => {
  const {
    rooms,
    activeFilterBuilding,
    setActiveFilterBuilding,
    activeFilterStatus,
    setActiveFilterStatus,
    activeFilterType,
    setActiveFilterType,
    getBuildingStats,
    navigate,
    simulatedTimeLabel,
  } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  const [activeFloorFilter, setActiveFloorFilter] = useState<number | null>(null);

  // Dynamic counts for currently selected building
  const stats = getBuildingStats(activeFilterBuilding);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (activeFilterBuilding !== 'All' && r.building !== activeFilterBuilding) return false;
    if (activeFilterStatus !== 'All') {
      if (activeFilterStatus === 'VACANT' && r.status !== 'VACANT') return false;
      if (activeFilterStatus === 'OCCUPIED' && r.status !== 'OCCUPIED') return false;
      if (activeFilterStatus === 'RESERVED' && r.status !== 'RESERVED') return false;
    }
    if (activeFilterType !== 'All' && r.type !== activeFilterType) return false;
    if (activeFloorFilter !== null && r.floor !== activeFloorFilter) return false;
    return true;
  });

  const resetFilters = () => {
    setActiveFilterBuilding('All');
    setActiveFilterStatus('All');
    setActiveFilterType('All');
    setActiveFloorFilter(null);
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Room Availability"
        subtitle={`${activeFilterBuilding === 'All' ? 'All Campus Buildings' : activeFilterBuilding + ' Building'} • ${filteredRooms.length} Spaces`}
        showBack={true}
      />

      <main className={isWeb ? 'w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5' : 'flex flex-col px-4 pt-2.5 pb-28 gap-3.5 w-full max-w-full overflow-x-hidden'}>
        {/* Top Summary Bar & Status Counts */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">
                {activeFilterBuilding === 'All' ? 'Campus-Wide Availability' : `${activeFilterBuilding} Building Status`}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700 shadow-xs">
              <span className="material-symbols-outlined text-xs text-emerald-600">schedule</span>
              <span>{simulatedTimeLabel}</span>
            </div>
          </div>

          {/* 3 Status Cards (Dynamic) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveFilterStatus(activeFilterStatus === 'VACANT' ? 'All' : 'VACANT')}
              className={`p-2.5 rounded-xl shadow-xs border text-center transition-all ${
                activeFilterStatus === 'VACANT'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Available
              </span>
              <span className="text-lg font-extrabold text-emerald-800">{stats.vacant}</span>
            </button>

            <button
              onClick={() => setActiveFilterStatus(activeFilterStatus === 'OCCUPIED' ? 'All' : 'OCCUPIED')}
              className={`p-2.5 rounded-xl shadow-xs border text-center transition-all ${
                activeFilterStatus === 'OCCUPIED'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                Occupied
              </span>
              <span className="text-lg font-extrabold text-rose-800">{stats.occupied}</span>
            </button>

            <button
              onClick={() => setActiveFilterStatus(activeFilterStatus === 'RESERVED' ? 'All' : 'RESERVED')}
              className={`p-2.5 rounded-xl shadow-xs border text-center transition-all ${
                activeFilterStatus === 'RESERVED'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Reserved
              </span>
              <span className="text-lg font-extrabold text-amber-800">{stats.reserved}</span>
            </button>
          </div>
        </section>

        {/* Building Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {['All', 'CME', 'CB', 'ICT'].map((bldg) => (
            <button
              key={bldg}
              onClick={() => setActiveFilterBuilding(bldg)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeFilterBuilding === bldg
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {bldg === 'All' ? 'All Buildings' : `${bldg} Building`}
            </button>
          ))}
        </div>

        {/* Status and Space Type Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilterStatus('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilterStatus === 'All'
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            All Statuses
          </button>

          <button
            onClick={() => setActiveFilterType(activeFilterType === 'CLASSROOM' ? 'All' : 'CLASSROOM')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeFilterType === 'CLASSROOM'
                ? 'bg-[#0f172a] text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Classrooms
          </button>

          <button
            onClick={() => setActiveFilterType(activeFilterType === 'LABS' ? 'All' : 'LABS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeFilterType === 'LABS'
                ? 'bg-[#0f172a] text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Labs
          </button>

          <button
            onClick={() => setActiveFilterType(activeFilterType === 'SEMINAR HALL' ? 'All' : 'SEMINAR HALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeFilterType === 'SEMINAR HALL'
                ? 'bg-[#0f172a] text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Seminar Hall
          </button>

          <button
            onClick={() => setActiveFilterType(activeFilterType === 'OFFICES' ? 'All' : 'OFFICES')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeFilterType === 'OFFICES'
                ? 'bg-[#0f172a] text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Offices
          </button>

          <button
            onClick={() => setActiveFloorFilter(activeFloorFilter === 1 ? null : 1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeFloorFilter === 1
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Floor 1
          </button>

          <button
            onClick={() => setActiveFloorFilter(activeFloorFilter === 2 ? null : 2)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeFloorFilter === 2
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Floor 2
          </button>

          <button
            onClick={() => navigate('best-room-req')}
            className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 ml-auto"
          >
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
            <span>Suggest</span>
          </button>
        </div>

        {/* Filter Count Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span>
            Showing <strong className="text-slate-800 font-bold">{filteredRooms.length}</strong> matching spaces
          </span>
          {(activeFilterStatus !== 'All' || activeFilterType !== 'All' || activeFloorFilter !== null || activeFilterBuilding !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-emerald-700 font-semibold hover:underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Rooms Card Feed */}
        <div className={isWeb ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5" : "flex flex-col gap-3 w-full"}>
          {filteredRooms.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-slate-400">room_preferences</span>
              <p className="text-xs font-bold text-slate-700">No rooms match your active filters</p>
              <p className="text-[11px] text-slate-400">Try selecting a different building or resetting status filters.</p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-1.5 bg-[#0f172a] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer hover:bg-slate-800"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => <RoomCard key={room.id} room={room} />)
          )}
        </div>
      </main>
    </div>
  );
};
