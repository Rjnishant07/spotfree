'use client';

import React from 'react';
import { Room } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { useSpotFree } from '@/context/SpotFreeContext';

interface RoomCardProps {
  room: Room;
  showUpdateAction?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, showUpdateAction = true }) => {
  const { setSelectedRoomId, navigate, canUserOverrideRoom, showToast } = useSpotFree();

  const isVacant = room.status === 'VACANT';
  const roomAuth = (room.statusAuthority || room.updatedRole || 'STUDENT') as any;
  const authCheck = isVacant
    ? { allowed: true, isOverride: false }
    : canUserOverrideRoom(roomAuth);

  const handleViewDetails = () => {
    setSelectedRoomId(room.id);
    navigate('room-details');
  };

  const handleUpdateDirect = () => {
    if (!isVacant && !authCheck.allowed) {
      showToast(authCheck.reason || 'Status update restricted', 'lock');
      return;
    }
    setSelectedRoomId(room.id);
    navigate('update-status');
  };

  return (
    <article className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5 transition-all hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">{room.id}</h3>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {room.building} • Floor {room.floor}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
              (room.statusAuthority || 'STUDENT') === 'ADMIN'
                ? 'bg-purple-100 text-purple-800'
                : (room.statusAuthority || 'STUDENT') === 'FACULTY'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {room.statusAuthority || 'STUDENT'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {room.type} • Capacity: {room.capacity} seats
          </p>
        </div>
        <StatusBadge status={room.status} />
      </div>

      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2 text-xs text-slate-700">
        <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
        <span className="truncate font-medium">{room.timeText}</span>
      </div>

      {room.amenities && room.amenities.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 overflow-hidden">
          {room.amenities.slice(0, 3).map(a => (
            <span key={a} className="flex items-center gap-1 truncate">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              {a}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
        <button
          onClick={handleViewDetails}
          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <span>View Details</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
        {showUpdateAction && (
          <button
            onClick={handleUpdateDirect}
            title={!authCheck.allowed ? authCheck.reason : authCheck.isOverride ? 'Override lower-authority status' : 'Update status'}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              !authCheck.allowed
                ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200/60 cursor-not-allowed'
                : authCheck.isOverride
                ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                : 'bg-[#0f172a] hover:bg-slate-800 text-white active:scale-95'
            }`}
          >
            {!authCheck.allowed ? 'Restricted 🔒' : authCheck.isOverride ? 'Override' : 'Update'}
          </button>
        )}
      </div>
    </article>
  );
};
