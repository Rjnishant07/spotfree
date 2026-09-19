'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';
import { RoomStatus } from '@/lib/types';

export const UpdateRoomStatusScreen: React.FC = () => {
  const { selectedRoom, updateRoomStatus, navigate, currentRole, canUserOverrideRoom } = useSpotFree();

  const r = selectedRoom;
  const [chosenStatus, setChosenStatus] = useState<RoomStatus>(
    r ? (r.status === 'NO INFORMATION' ? 'VACANT' : r.status) : 'VACANT'
  );
  const [reservedUntil, setReservedUntil] = useState<string>(r?.reservedEnd || '02:30 PM');
  const [startTime, setStartTime] = useState<string>(r?.reservedStart || '11:00 AM');
  const [endTime, setEndTime] = useState<string>(r?.reservedEnd || '02:30 PM');
  const [note, setNote] = useState<string>('Updated via mobile client');

  if (!r) {
    return (
      <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
        <Header title="Update Room Status" showBack={true} />
        <div className="p-8 text-center text-slate-500 text-xs">No room selected.</div>
      </div>
    );
  }

  // Check role-based authority hierarchy:
  // When room is VACANT, anyone can book/update it regardless of prior authority.
  const isVacant = r.status === 'VACANT';
  const roomAuth = (r.statusAuthority || r.updatedRole || 'STUDENT') as any;
  const authCheck = isVacant
    ? { allowed: true, isOverride: false }
    : canUserOverrideRoom(roomAuth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCheck.allowed) {
      return;
    }
    const finalNote = chosenStatus === 'RESERVED'
      ? `Reserved: ${startTime} – ${endTime}${note ? ` • ${note}` : ''}`
      : note;
    const source = currentRole.toLowerCase() === 'admin' ? 'ADMIN OVERRIDE' : 'QR';
    const result = updateRoomStatus(r.id, chosenStatus, finalNote, source, reservedUntil, startTime, endTime);
    if (result && !result.success) {
      return;
    }
    navigate('status-updated');
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Update Room Status"
        subtitle={r.id}
        showBack={true}
      />

      <main className="flex flex-col px-4 pt-3 pb-8 gap-3.5">
        {/* Context Strip */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900">Select Room Occupancy State</h2>
            <p className="text-[11px] text-slate-500">
              Live updates broadcast across all campus monitors
            </p>
          </div>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
          </span>
        </div>

        {/* Room Header Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                {r.building} Building • Floor {r.floor}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{r.id}</h3>
              <p className="text-xs text-slate-500 font-medium">{r.type}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Current</span>
              <StatusBadge status={r.status} size="sm" />
            </div>
          </div>

          {/* Current Authority Strip */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
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
        </div>

        {/* Authority Hierarchy Alert / Explanation */}
        {!authCheck.allowed ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-900 shadow-xs animate-in fade-in duration-150">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">lock</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-rose-950">{authCheck.reason}</h3>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                As a {currentRole}, you cannot override room status set by higher authority ({r.statusAuthority}). Only a higher authority or the controlling role can update this space.
              </p>
            </div>
          </div>
        ) : authCheck.isOverride ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2.5 text-blue-900 shadow-xs animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-blue-700 text-lg shrink-0">verified_user</span>
            <div className="text-[11px]">
              <span className="font-bold">Override Authority Active: </span>
              <span>
                Your status change will override the current status set by {r.statusAuthority || 'lower authority'} (Recorded as {currentRole.toUpperCase()} OVERRIDE).
              </span>
            </div>
          </div>
        ) : null}

        {/* Status Selection Form */}
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Select New Status
          </label>

          <fieldset
            disabled={!authCheck.allowed}
            className={`flex flex-col gap-2.5 ${!authCheck.allowed ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {/* 3 Status Cards */}
            {/* VACANT */}
            <label
              onClick={() => authCheck.allowed && setChosenStatus('VACANT')}
              className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                !authCheck.allowed
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50/50'
                  : chosenStatus === 'VACANT'
                  ? 'border-emerald-500 bg-emerald-50/60 shadow-xs cursor-pointer active:scale-[0.99]'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    chosenStatus === 'VACANT' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">meeting_room</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Vacant</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      Free Now
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Room is empty and open for immediate use
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  chosenStatus === 'VACANT'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {chosenStatus === 'VACANT' && (
                  <span className="material-symbols-outlined text-xs">check</span>
                )}
              </div>
            </label>

            {/* OCCUPIED */}
            <label
              onClick={() => authCheck.allowed && setChosenStatus('OCCUPIED')}
              className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                !authCheck.allowed
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50/50'
                  : chosenStatus === 'OCCUPIED'
                  ? 'border-rose-500 bg-rose-50/60 shadow-xs cursor-pointer active:scale-[0.99]'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    chosenStatus === 'OCCUPIED' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">groups</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Occupied</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                      In Use
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Room in active use for lecture, seminar, or study
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  chosenStatus === 'OCCUPIED'
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {chosenStatus === 'OCCUPIED' && (
                  <span className="material-symbols-outlined text-xs">check</span>
                )}
              </div>
            </label>

            {/* RESERVED */}
            <label
              onClick={() => authCheck.allowed && setChosenStatus('RESERVED')}
              className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                !authCheck.allowed
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50/50'
                  : chosenStatus === 'RESERVED'
                  ? 'border-amber-500 bg-amber-50/60 shadow-xs cursor-pointer active:scale-[0.99]'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    chosenStatus === 'RESERVED' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">hourglass_top</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Reserved</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Reserved for upcoming academic department session
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  chosenStatus === 'RESERVED'
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {chosenStatus === 'RESERVED' && (
                  <span className="material-symbols-outlined text-xs">check</span>
                )}
              </div>
            </label>

            {/* Conditional Reserved Start & End Time (with Quick Presets) */}
            {chosenStatus === 'RESERVED' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col gap-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-900 uppercase">
                    Reservation Window
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium">Start & End Hours</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-amber-800" htmlFor="start-time-input">
                      Start Time
                    </label>
                    <input
                      id="start-time-input"
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={!authCheck.allowed}
                      placeholder="e.g. 11:00 AM"
                      className="w-full text-xs p-2 rounded-lg bg-white border border-amber-300 font-bold text-amber-950 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-amber-800" htmlFor="end-time-input">
                      End Time
                    </label>
                    <input
                      id="end-time-input"
                      type="text"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setReservedUntil(e.target.value);
                      }}
                      disabled={!authCheck.allowed}
                      placeholder="e.g. 02:30 PM"
                      className="w-full text-xs p-2 rounded-lg bg-white border border-amber-300 font-bold text-amber-950 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-col gap-1 pt-1 border-t border-amber-200/60">
                  <label className="text-[10px] font-semibold text-amber-800">Quick End Time Presets</label>
                  <div className="grid grid-cols-4 gap-1">
                    {['12:30 PM', '01:30 PM', '02:30 PM', '04:00 PM'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={!authCheck.allowed}
                        onClick={() => {
                          setEndTime(t);
                          setReservedUntil(t);
                        }}
                        className={`py-1 text-[10px] font-bold rounded-md border transition-all ${
                          endTime === t
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Remarks / Note */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800" htmlFor="status-note">
                Remarks / Audit Note
              </label>
              <input
                id="status-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!authCheck.allowed}
                placeholder="e.g. Session concluded early"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none focus:bg-white"
              />
            </div>
          </fieldset>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!authCheck.allowed}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all mt-1 ${
              !authCheck.allowed
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                : authCheck.isOverride
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {!authCheck.allowed ? 'lock' : authCheck.isOverride ? 'upgrade' : 'cloud_upload'}
            </span>
            <span>
              {!authCheck.allowed
                ? 'Update Status Restricted'
                : authCheck.isOverride
                ? 'Broadcast Status Override'
                : 'Broadcast Status Change'}
            </span>
          </button>
        </form>
      </main>
    </div>
  );
};
