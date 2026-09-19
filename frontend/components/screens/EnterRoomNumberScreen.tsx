'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { lookupRoomByNumber } from '@/mock-data/qrCodes';

export const EnterRoomNumberScreen: React.FC = () => {
  const { rooms, setSelectedRoomId, navigate, showToast } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';
  const [inputValue, setInputValue] = useState<string>('CME604');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLookup = (roomIdToSearch?: string) => {
    setErrorMessage('');
    const rawQuery = (roomIdToSearch || inputValue).trim();
    if (!rawQuery) {
      showToast('Please enter a room number', 'info');
      return;
    }

    const cleanQuery = rawQuery.replace(/[\s\-_]/g, '').toUpperCase();

    // 1. Try centralized QR code mappings
    const qrMapping = lookupRoomByNumber(rawQuery);

    // 2. Try match against centralized rooms
    const found = rooms.find((r) => {
      const rIdClean = r.id.replace(/[\s\-_]/g, '').toUpperCase();
      const rNoClean = r.roomNumber.replace(/[\s\-_]/g, '').toUpperCase();
      const fullCodeClean = `${r.building}${r.roomNumber}`.replace(/[\s\-_]/g, '').toUpperCase();

      if (qrMapping && (r.id === qrMapping.id || rNoClean === qrMapping.roomNumber.toUpperCase())) {
        return true;
      }

      return (
        r.id.toUpperCase() === rawQuery.toUpperCase() ||
        rIdClean === cleanQuery ||
        r.roomNumber.toUpperCase() === rawQuery.toUpperCase() ||
        rNoClean === cleanQuery ||
        fullCodeClean === cleanQuery ||
        (r.qrId && r.qrId.toUpperCase() === rawQuery.toUpperCase()) ||
        (r.qrId && r.qrId.replace(/[\s\-_]/g, '').toUpperCase() === cleanQuery)
      );
    });

    if (found) {
      setSelectedRoomId(found.id);
      showToast(`Room ${found.id} located in directory`);
      navigate('room-identified');
    } else {
      setErrorMessage('No room found');
      showToast('No room found', 'error');
    }
  };

  const handleShortcutClick = (id: string) => {
    setInputValue(id);
    handleLookup(id);
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Enter Room Number"
        subtitle="Manual Room Lookup"
        showBack={true}
      />

      <main className={isWeb ? 'w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4' : 'flex flex-col px-4 pt-3 pb-8 gap-3.5'}>
        {/* Context Badge */}
        <div className="flex items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">SpotFree Manual Lookup</span>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider" htmlFor="room-no-input">
              Room Code
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-lg pointer-events-none">
                meeting_room
              </span>
              <input
                id="room-no-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. CME-104"
                className="w-full h-12 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    setErrorMessage('');
                  }}
                  className="absolute right-2.5 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700"
                  aria-label="Clear input"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs text-emerald-600">info</span>
              <span>Accepts: CME604, CME605, CB501, ICT403, ICT B08</span>
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-[#0f172a] hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all mt-1"
          >
            <span>Identify Room</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </form>

        {/* Quick Room Shortcuts Section */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Campus Door Plaque Directory
            </span>
            <span className="material-symbols-outlined text-sm text-slate-400">qr_code_2</span>
          </div>

          <div className="flex flex-col gap-2">
            {rooms
              .filter((r) => ['CME604', 'CME605', 'CB501', 'ICT403', 'ICT B08'].includes(r.id))
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleShortcutClick(r.id)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between transition-colors group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                      <span className="material-symbols-outlined text-base">door_front</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{r.id}</span>
                      <span className="text-[10px] text-slate-500">
                        {r.type} • Floor {r.floor === -1 ? 'Basement' : r.floor} • {r.building} Building
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-800 text-base">
                    chevron_right
                  </span>
                </button>
              ))}
          </div>
        </section>

        {/* Switch to QR Scanner */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate('scan-qr')}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
          >
            <span className="material-symbols-outlined text-base">qr_code_scanner</span>
            <span>Switch to Door Plaque Scanner</span>
          </button>
        </div>
      </main>
    </div>
  );
};
