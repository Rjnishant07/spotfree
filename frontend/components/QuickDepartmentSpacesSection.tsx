'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { StatusBadge } from './StatusBadge';
import { Room } from '@/lib/types';

const DEMO_ROOM_IDS = ['CME604', 'CME605', 'CB501', 'ICT403', 'ICT B08'];

export const QuickDepartmentSpacesSection: React.FC = () => {
  const { rooms, currentUser, canUserOverrideRoom, setSelectedRoomId, navigate } = useSpotFree();

  // Retrieve the 5 primary demonstration rooms in exact order
  const displayRooms: Room[] = DEMO_ROOM_IDS.map((id) =>
    rooms.find((r) => r.id === id)
  ).filter(Boolean) as Room[];

  // Fallback to first 5 rooms if any demo room is missing
  const activeRooms = displayRooms.length === 5 ? displayRooms : rooms.slice(0, 5);

  const handleCardClick = (roomId: string) => {
    setSelectedRoomId(roomId);
    navigate('update-status');
  };

  const userRole = (currentUser?.role || 'STUDENT').toUpperCase();

  return (
    <section className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Quick Department Spaces
        </span>
        <span className="text-[10px] text-slate-400 font-medium">5 Primary Units</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 w-full">
        {activeRooms.map((r) => {
          const isVacant = r.status === 'VACANT';
          const roomAuth = (r.statusAuthority || r.updatedRole || 'STUDENT').toUpperCase();
          const auth = isVacant
            ? { allowed: true, isOverride: false }
            : canUserOverrideRoom(roomAuth as any);

          const isRestricted = !isVacant && !auth.allowed;
          const isStudentOverride = !isVacant && auth.allowed && auth.isOverride && roomAuth === 'STUDENT';

          // Determine action label, icon, and colors strictly following guidelines:
          // - For vacant rooms: "View / Update Status"
          // - For restricted rooms: "Faculty Controlled" / "Admin Controlled" as appropriate
          // - Prevent text such as "Faculty Locked (Admin Only)" from wrapping awkwardly
          let actionLabel = 'View / Update Status';
          let actionIcon = 'edit_calendar';
          let actionColor = 'text-emerald-700';

          if (isVacant) {
            actionLabel = 'View / Update Status';
            actionIcon = 'edit_calendar';
            actionColor = 'text-emerald-700';
          } else if (isRestricted) {
            actionIcon = 'lock';
            actionColor = 'text-slate-500';
            if (roomAuth === 'ADMIN') {
              actionLabel = 'Admin Controlled';
            } else if (roomAuth === 'FACULTY') {
              actionLabel = 'Faculty Controlled';
            } else {
              actionLabel = 'Student Controlled';
            }
          } else if (isStudentOverride) {
            actionLabel = 'Override Student ➜';
            actionIcon = 'upgrade';
            actionColor = 'text-blue-700';
          } else {
            // Non-vacant and allowed (e.g. Admin on Faculty/Admin room, or Faculty on own room, or Student on Student room)
            if (roomAuth === 'ADMIN') {
              actionLabel = 'Admin Controlled';
              actionIcon = 'verified_user';
              actionColor = 'text-purple-700';
            } else if (roomAuth === 'FACULTY') {
              actionLabel = 'Faculty Controlled';
              actionIcon = userRole === 'ADMIN' ? 'edit' : 'verified_user';
              actionColor = 'text-blue-700';
            } else {
              actionLabel = 'View / Update Status';
              actionIcon = 'edit';
              actionColor = 'text-slate-600';
            }
          }

          return (
            <button
              key={r.id}
              onClick={() => handleCardClick(r.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[108px] w-full transition-all shadow-xs active:scale-[0.99] ${
                isVacant
                  ? 'bg-emerald-50/20 border-emerald-200/80 hover:border-emerald-300'
                  : isRestricted
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-blue-50/20 border-blue-200/80 hover:border-blue-300'
              }`}
            >
              {/* Top Row: Room number (left) + Status badge (right) */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight whitespace-nowrap">
                  {r.id}
                </span>
                <StatusBadge status={r.status} size="sm" />
              </div>

              {/* Middle Row: Room type • Floor */}
              <div className="flex items-center text-[10.5px] text-slate-500 font-medium truncate w-full -mt-1">
                <span className="truncate">
                  {r.type} • Floor {r.floor}
                </span>
              </div>

              {/* Bottom Row: Uniform Action Area */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                <span className={`text-[10.5px] font-semibold flex items-center gap-1.5 truncate ${actionColor}`}>
                  <span className="material-symbols-outlined text-[13px] shrink-0">
                    {actionIcon}
                  </span>
                  <span className="truncate">{actionLabel}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
