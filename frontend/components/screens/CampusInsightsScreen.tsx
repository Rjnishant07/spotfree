'use client';

import React, { useMemo } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { StatusBadge } from '../StatusBadge';

const buildings = ['CME', 'CB', 'ICT'] as const;

export const CampusInsightsScreen: React.FC = () => {
  const { rooms, timetable, navigate, setSelectedRoomId } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  const stats = useMemo(() => {
    const total = rooms.length || 1;
    const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
    const reserved = rooms.filter(r => r.status === 'RESERVED').length;
    const vacant = rooms.filter(r => r.status === 'VACANT').length;
    const utilization = Math.round(((occupied + reserved) / total) * 100);
    const hours = timetable.reduce((sum, e) => sum + Math.max(0, e.endHour - e.startHour), 0);
    const peak = timetable.reduce<Record<string, number>>((acc, e) => {
      const h = Math.floor(e.startHour);
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.entries(peak).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { total, occupied, reserved, vacant, utilization, hours, peakHour };
  }, [rooms, timetable]);

  const buildingData = buildings.map(building => {
    const list = rooms.filter(r => r.building === building);
    const used = list.filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED').length;
    return {
      building,
      rooms: list,
      used,
      total: list.length,
      pct: list.length ? Math.round((used / list.length) * 100) : 0,
    };
  }).sort((a, b) => b.pct - a.pct);

  const roomTypeData = Object.entries(
    rooms.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const topRooms = [...rooms]
    .filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED')
    .sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#fafaf9]">
      <Header title="Campus Insights" subtitle="Utilization, smart planning & campus overview" showBack />
      <main className={isWeb
        ? 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6'
        : 'px-4 pt-3 pb-8 flex flex-col gap-4'
      }>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            ['Utilization', `${stats.utilization}%`, 'analytics'],
            ['Available', String(stats.vacant), 'meeting_room'],
            ['Active use', String(stats.occupied + stats.reserved), 'groups'],
            ['Scheduled hours', stats.hours.toFixed(1), 'schedule'],
          ].map(([label, value, icon]) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="material-symbols-outlined text-emerald-600 text-xl">{icon}</span>
              <div className="text-2xl font-black text-slate-900 mt-2">{value}</div>
              <div className="text-[11px] font-semibold text-slate-500">{label}</div>
            </div>
          ))}
        </section>

        <section className="bg-[#1c1917] text-white rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">Planning intelligence</span>
              <h2 className="text-xl font-black mt-1">Campus utilization overview</h2>
              <p className="text-xs text-slate-300 mt-1">Use live room status and timetable data to spot capacity and scheduling opportunities.</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-emerald-300">insights</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            {buildingData.map((b, index) => (
              <button
                key={b.building}
                onClick={() => {
                  setSelectedRoomId(b.rooms[0]?.id || '');
                  navigate('room-availability');
                }}
                className="text-left bg-white/10 border border-white/10 rounded-2xl p-4 hover:bg-white/15 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black">{b.building}</span>
                  <span className="text-[10px] bg-emerald-400 text-slate-950 px-2 py-1 rounded-full font-black">#{index + 1}</span>
                </div>
                <div className="text-2xl font-black mt-3">{b.pct}%</div>
                <div className="text-[10px] text-slate-300">in active use • {b.total} rooms</div>
                <div className="h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${b.pct}%` }} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Campus map</h3>
                <p className="text-[10px] text-slate-500">Live building availability — schematic view</p>
              </div>
              <span className="material-symbols-outlined text-emerald-600">map</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {buildingData.map(b => (
                <button
                  key={b.building}
                  onClick={() => navigate('room-availability')}
                  className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-emerald-300 transition"
                >
                  <span className="material-symbols-outlined text-slate-500">domain</span>
                  <div className="font-black text-slate-900 mt-3">{b.building}</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">{b.total - b.used} free</div>
                  <div className="text-[9px] text-slate-500">{b.total} total</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Space mix</h3>
            <div className="mt-3 space-y-2">
              {roomTypeData.map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="w-28 text-[10px] font-bold text-slate-600 truncate">{type}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${Math.min(100, count / stats.total * 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-900 w-5">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Peak timetable window</h3>
              <span className="material-symbols-outlined text-purple-600">schedule</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-3">
              {stats.peakHour ? `${stats.peakHour}:00` : '—'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Most timetable sessions begin around this hour.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Currently active spaces</h3>
                <p className="text-[10px] text-slate-500">Quick access to rooms currently in use</p>
              </div>
              <button onClick={() => navigate('room-availability')} className="text-[11px] font-bold text-emerald-700">View all</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {topRooms.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRoomId(r.id); navigate('room-details'); }}
                  className="text-left border border-slate-200 rounded-xl p-3 hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">{r.id}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">{r.building} • {r.capacity} seats</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
