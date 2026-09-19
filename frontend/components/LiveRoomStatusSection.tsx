'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { StatusBadge } from './StatusBadge';
import { CampusBuilding } from '@/lib/types';

interface LiveRoomStatusSectionProps {
  initialBuilding?: string;
}

export const LiveRoomStatusSection: React.FC<LiveRoomStatusSectionProps> = ({
  initialBuilding = 'CME',
}) => {
  const { rooms, getBuildingStats, setSelectedRoomId, navigate } = useSpotFree();
  const [activeBldg, setActiveBldg] = useState<string>(initialBuilding);
  const [showIndividual, setShowIndividual] = useState<boolean>(false);
  const [selectedFloor, setSelectedFloor] = useState<string>('All');

  const stats = getBuildingStats(activeBldg);

  // Available floors dynamically determined from current building
  const availableFloors = Array.from(
    new Set(
      rooms
        .filter((r) => activeBldg === 'All' || r.building === activeBldg)
        .map((r) => r.floor)
    )
  ).sort((a, b) => a - b);

  // Filter individual rooms
  const individualRooms = rooms.filter((r) => {
    if (activeBldg !== 'All' && r.building !== activeBldg) return false;
    if (selectedFloor !== 'All' && r.floor !== Number(selectedFloor)) return false;
    return true;
  });

  const formatFloor = (fl: number) => {
    if (fl === -1) return 'Basement';
    if (fl === 0) return 'Ground Fl';
    return `Floor ${fl}`;
  };

  const handleOpenRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    navigate('room-details');
  };

  return (
    <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3.5">
      {/* Top Header & Building Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Live Room Status
          </span>
          <h3 className="font-title-sm text-title-sm text-slate-900 font-bold">
            {activeBldg === 'All' ? 'All Campus Buildings' : `${activeBldg} Building`}
          </h3>
        </div>

        {/* Building Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          {['All', 'CME', 'CB', 'ICT'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => {
                setActiveBldg(b);
                setSelectedFloor('All');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                activeBldg === b
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Status-Count Cards (Preserved UI) */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-emerald-50 border border-emerald-200/80 p-2 rounded-xl">
          <span className="text-base font-extrabold text-emerald-800 block">
            {stats.vacant}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700">Vacant</span>
        </div>

        <div className="bg-rose-50 border border-rose-200/80 p-2 rounded-xl">
          <span className="text-base font-extrabold text-rose-800 block">
            {stats.occupied}
          </span>
          <span className="text-[10px] font-semibold text-rose-700">Occupied</span>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 p-2 rounded-xl">
          <span className="text-base font-extrabold text-amber-800 block">
            {stats.reserved}
          </span>
          <span className="text-[10px] font-semibold text-amber-700">Reserved</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
          <span className="text-base font-extrabold text-slate-800 block">
            {stats.noInfo}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">No Info</span>
        </div>
      </div>

      {/* Toggle to View Status of Every Individual Room */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowIndividual(!showIndividual)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
            showIndividual
              ? 'bg-[#0f172a] text-white border-slate-900'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">
              {showIndividual ? 'visibility_off' : 'meeting_room'}
            </span>
            <span>
              {showIndividual ? 'Hide Individual Rooms' : 'View Status of Every Individual Room'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] opacity-80">
              {showIndividual ? 'Collapse' : `${individualRooms.length} Rooms`}
            </span>
            <span className="material-symbols-outlined text-sm">
              {showIndividual ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </button>
      </div>

      {/* Individual Room View (Extension) */}
      {showIndividual && (
        <div className="flex flex-col gap-3 pt-1 animate-in fade-in duration-150">
          {/* Floor & Building Filter Strip */}
          <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Filter by Floor
              </span>
              <span className="text-[10px] font-semibold text-slate-600">
                Showing {individualRooms.length} rooms
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedFloor('All')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFloor === 'All'
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Floors
              </button>

              {availableFloors.map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setSelectedFloor(fl.toString())}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedFloor === fl.toString()
                      ? 'bg-[#0f172a] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formatFloor(fl)}
                </button>
              ))}
            </div>
          </div>

          {/* Individual Room Cards List */}
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5">
            {individualRooms.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No rooms found for selected building & floor filter.
              </div>
            ) : (
              individualRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleOpenRoom(room.id)}
                  className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 cursor-pointer transition-all hover:border-emerald-400 active:scale-[0.99]"
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900">
                        {room.id}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {room.building}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatFloor(room.floor)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                      <span>{room.type}</span>
                      <span>•</span>
                      <span>Cap: {room.capacity}</span>
                      <span>•</span>
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                        (room.statusAuthority || 'STUDENT') === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : (room.statusAuthority || 'STUDENT') === 'FACULTY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {room.statusAuthority || 'STUDENT'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={room.status} size="sm" />
                    <span className="material-symbols-outlined text-slate-400 text-sm">
                      chevron_right
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default LiveRoomStatusSection;
