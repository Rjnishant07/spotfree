'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';

export const RoomDetailsScreen: React.FC = () => {
  const {
    selectedRoom,
    navigate,
    goBack,
    showToast,
    canUserOverrideRoom,
    currentRole,
    bookVacantRoom,
  } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [bookDate, setBookDate] = useState<string>('Today');
  const [bookTime, setBookTime] = useState<string>('11:00 AM');
  const [bookDuration, setBookDuration] = useState<string>('1 Hour');
  const [bookRemarks, setBookRemarks] = useState<string>('');

  const room = selectedRoom;

  if (!room) {
    return (
      <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
        <Header title="Room Details" showBack={true} />
        <main className="p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-slate-400">warning</span>
          <p className="text-sm font-bold text-slate-700">No Room Selected</p>
          <button
            onClick={() => navigate('room-availability')}
            className="px-4 py-2 bg-[#0f172a] text-white text-xs font-bold rounded-xl"
          >
            Go to Room Availability
          </button>
        </main>
      </div>
    );
  }

  const isVacant = room.status === 'VACANT';
  const roomAuth = (room.statusAuthority || room.updatedRole || 'STUDENT') as any;
  const authCheck = isVacant
    ? { allowed: true, isOverride: false }
    : canUserOverrideRoom(roomAuth);

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    showToast(isBookmarked ? 'Removed from saved spaces' : 'Room saved to quick access');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`SpotFree HIT - Room ${room.id} (${room.status})`);
      showToast('Room link copied to clipboard', 'link');
    } else {
      showToast(`SpotFree: ${room.id}`);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title={room.id}
        subtitle={`${room.building} Building • Floor ${room.floor}`}
        showBack={true}
      />

      <main className={isWeb ? 'w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5' : 'flex flex-col px-4 pt-3 pb-8 gap-3.5'}>
        {/* Sub-header Context Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Campus Space Details
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
              title="Share Room Info"
              aria-label="Share Room"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
            <button
              onClick={handleToggleBookmark}
              className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-xs ${
                isBookmarked
                  ? 'bg-amber-50 border-amber-300 text-amber-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Save Room"
              aria-label="Save Room"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {isBookmarked ? 'bookmark' : 'bookmark_border'}
              </span>
            </button>
          </div>
        </div>

        {/* Room Header Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
              Live Sensor Verified
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Sync
            </span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{room.id}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
                {room.building} Building • Floor {room.floor}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <span className="material-symbols-outlined text-2xl">
                {room.type === 'Classroom' ? 'school' : room.type === 'Seminar Room' ? 'co_present' : 'groups'}
              </span>
            </div>
          </div>

          {/* Current Status Highlight */}
          <div
            className={`w-full rounded-xl p-3 flex items-center justify-between ${
              room.status === 'VACANT'
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                : room.status === 'OCCUPIED'
                ? 'bg-rose-50 text-rose-950 border border-rose-200'
                : 'bg-amber-50 text-amber-950 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    room.status === 'VACANT' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    room.status === 'VACANT' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
              <div className="truncate">
                <p className="text-xs font-bold leading-none uppercase tracking-wide">
                  {room.status === 'VACANT' ? 'FREE RIGHT NOW' : room.status}
                </p>
                <p className="text-[11px] opacity-80 mt-1 truncate">{room.timeText}</p>
              </div>
            </div>
            <StatusBadge status={room.status} size="sm" />
          </div>

          {/* Current Controlling Authority Strip */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-500 font-medium">Controlling Authority:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              (room.statusAuthority || 'STUDENT') === 'ADMIN'
                ? 'bg-purple-100 text-purple-800'
                : (room.statusAuthority || 'STUDENT') === 'FACULTY'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              <span className="material-symbols-outlined text-xs">
                {(room.statusAuthority || 'STUDENT') === 'ADMIN' ? 'shield_person' : (room.statusAuthority || 'STUDENT') === 'FACULTY' ? 'school' : 'person'}
              </span>
              <span>{room.statusAuthority || 'STUDENT'}{room.updatedBy ? ` (${room.updatedBy})` : ''}</span>
            </span>
          </div>
        </div>

        {/* 4 Specs Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <span className="material-symbols-outlined text-lg">groups</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
              <span className="text-xs font-bold text-slate-900">{room.capacity} Seats</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <span className="material-symbols-outlined text-lg">category</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Classification</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{room.type}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <span className="material-symbols-outlined text-lg">layers</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Floor Level</span>
              <span className="text-xs font-bold text-slate-900">Level {room.floor}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <span className="material-symbols-outlined text-lg">domain</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Building</span>
              <span className="text-xs font-bold text-slate-900">{room.building} Wing</span>
            </div>
          </div>
        </div>

        {/* Amenities & Features */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Amenities & Features
          </span>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {room.amenities.map((amenity) => (
              <div key={amenity} className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Timeline Schedule */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-slate-700">schedule</span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Today&apos;s Schedule Timeline
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">HIT Timetable</span>
          </div>

          {/* Visual Timeline Strip */}
          <div className="w-full flex h-3 rounded-full overflow-hidden bg-slate-100 mt-1">
            <div className="w-[30%] bg-slate-300" title="Morning Ended" />
            <div
              className={`w-[40%] ${
                room.status === 'VACANT' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              title="Active Slot"
            />
            <div className="w-[30%] bg-blue-300" title="Upcoming Slot" />
          </div>

          <div className="flex flex-col gap-2 border-l-2 border-slate-200 pl-3 ml-1.5 mt-2">
            {room.timeline.map((slot, index) => (
              <div key={index} className="flex flex-col gap-0.5 relative">
                <span
                  className={`w-2 h-2 rounded-full absolute -left-[17px] top-1.5 ${
                    slot.status === 'Active'
                      ? 'bg-emerald-500 ring-2 ring-emerald-200'
                      : slot.status === 'Ended'
                      ? 'bg-slate-300'
                      : 'bg-blue-400'
                  }`}
                />
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-bold ${
                      slot.status === 'Ended' ? 'text-slate-400 line-through' : 'text-slate-900'
                    }`}
                  >
                    {slot.time}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 rounded font-bold ${
                      slot.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : slot.status === 'Ended'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{slot.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Booking Option if Room is VACANT */}
          {room.status === 'VACANT' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-950">Room is Available for Reservation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookModal(!showBookModal)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                >
                  {showBookModal ? 'Cancel' : 'Book Room'}
                </button>
              </div>

              {showBookModal && (
                <div className="flex flex-col gap-2 pt-2 border-t border-emerald-200 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-emerald-900 uppercase">Date</label>
                      <select
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        className="text-xs p-1.5 rounded-lg bg-white border border-emerald-300 font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="Today">Today</option>
                        <option value="Tomorrow">Tomorrow</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-emerald-900 uppercase">Start Time</label>
                      <select
                        value={bookTime}
                        onChange={(e) => setBookTime(e.target.value)}
                        className="text-xs p-1.5 rounded-lg bg-white border border-emerald-300 font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="01:00 PM">01:00 PM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-emerald-900 uppercase">Duration</label>
                      <select
                        value={bookDuration}
                        onChange={(e) => setBookDuration(e.target.value)}
                        className="text-xs p-1.5 rounded-lg bg-white border border-emerald-300 font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="30 Mins">30 Mins</option>
                        <option value="1 Hour">1 Hour</option>
                        <option value="2 Hours">2 Hours</option>
                        <option value="3 Hours">3 Hours</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const ok = bookVacantRoom(room.id, bookDate, bookTime, bookDuration);
                      if (ok) {
                        setShowBookModal(false);
                      }
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    <span>Confirm Reservation</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {!authCheck.allowed && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 text-[11px] shadow-2xs">
              <span className="material-symbols-outlined text-rose-600 text-base shrink-0 mt-0.5">lock</span>
              <div>
                <span className="font-bold block">{authCheck.reason}</span>
                <span className="text-rose-700">As a {currentRole}, you cannot modify status controlled by higher authority ({room.statusAuthority}).</span>
              </div>
            </div>
          )}

          <button
            onClick={() => authCheck.allowed && navigate('update-status')}
            disabled={!authCheck.allowed}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all ${
              !authCheck.allowed
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                : authCheck.isOverride
                ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                : 'bg-[#0f172a] hover:bg-slate-800 text-white active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {!authCheck.allowed ? 'lock' : authCheck.isOverride ? 'upgrade' : 'sync_saved_locally'}
            </span>
            <span>
              {!authCheck.allowed
                ? 'Status Update Restricted'
                : authCheck.isOverride
                ? 'Override Room Status'
                : 'Update Room Status'}
            </span>
          </button>

          <button
            onClick={goBack}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            Back to Results
          </button>

          <div className="flex items-center justify-center gap-1.5 text-center mt-1">
            <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
            <p className="text-[11px] text-slate-500">
              Verified by Faculty / Student check-in protocol.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
