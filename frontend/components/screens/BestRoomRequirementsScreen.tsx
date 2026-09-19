'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';

export const BestRoomRequirementsScreen: React.FC = () => {
  const { bestRoomCriteria, setBestRoomCriteria, calculateRecommendedRoom, navigate } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  const [purpose, setPurpose] = useState<string>(bestRoomCriteria.purpose || 'Group Discussion');
  const [peopleCount, setPeopleCount] = useState<number>(bestRoomCriteria.peopleCount || 6);
  const [bldg, setBldg] = useState<string>(bestRoomCriteria.preferredBuilding || 'Any');
  const [duration, setDuration] = useState<string>(bestRoomCriteria.duration || '1 Hour');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(bestRoomCriteria.amenities || ['Air Conditioning', 'Whiteboard']);

  const toggleAmenity = (name: string) => {
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...bestRoomCriteria,
      purpose,
      peopleCount,
      preferredBuilding: bldg,
      duration,
      amenities: selectedAmenities,
    };
    setBestRoomCriteria(updated);
    calculateRecommendedRoom(updated);
    navigate('recommended-room');
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Smart Room Finder"
        subtitle="Step 1 of 2: Requirements"
        showBack={true}
      />

      <main className={isWeb ? 'w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4' : 'flex flex-col px-4 pt-3 pb-8 gap-3.5'}>
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2.5 text-emerald-950">
          <span className="material-symbols-outlined text-emerald-700 text-xl shrink-0">psychology</span>
          <p className="text-xs text-emerald-900 leading-snug">
            Specify your requirements to find the optimal vacant classroom or seminar space.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          {/* Purpose */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Primary Purpose
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Study', label: 'Individual Study', icon: 'menu_book' },
                { id: 'Group Discussion', label: 'Group Discussion', icon: 'groups' },
                { id: 'Project Work', label: 'Project Work', icon: 'devices' },
                { id: 'Meeting', label: 'Meeting / Review', icon: 'co_present' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPurpose(item.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    purpose === item.id
                      ? 'border-emerald-600 bg-emerald-50/60 text-slate-900 font-bold'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${purpose === item.id ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Number of People Counter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Number of People
              </label>
              <span className="text-[11px] text-slate-400">Capacity: 1–120</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-1.5 h-12">
              <button
                type="button"
                onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-slate-800 shadow-xs active:scale-95 transition-transform"
                aria-label="Decrease attendees"
              >
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">{peopleCount}</span>
                <span className="text-xs font-medium text-slate-500">
                  {peopleCount === 1 ? 'person' : 'people'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPeopleCount((p) => Math.min(120, p + 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-slate-800 shadow-xs active:scale-95 transition-transform"
                aria-label="Increase attendees"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
          </div>

          {/* Preferred Building */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Preferred Building
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg pointer-events-none">
                apartment
              </span>
              <select
                value={bldg}
                onChange={(e) => setBldg(e.target.value)}
                className="w-full h-11 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold appearance-none focus:outline-none focus:bg-white"
              >
                <option value="Any">Any Building (Optimal Match)</option>
                <option value="CME">CME Building Only</option>
                <option value="CB">CB Building Only</option>
                <option value="ICT">ICT Building Only</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-slate-400 text-lg pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Required Duration
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['45m', '1 Hour', '1.5 Hours', '2 Hours'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    duration === d
                      ? 'bg-[#0f172a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities Checklist */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Desired Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Air Conditioning', 'Projector', 'Whiteboard', 'Power Outlets'].map((amenity) => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-sm ${active ? 'text-emerald-700' : 'text-slate-300'}`}>
                      {active ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <span className="text-xs">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all mt-1"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>Find Best Room</span>
          </button>
        </form>
      </main>
    </div>
  );
};
