'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';
import { LiveRoomStatusSection } from '../LiveRoomStatusSection';
import { QuickDepartmentSpacesSection } from '../QuickDepartmentSpacesSection';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    history,
    setActiveFilterBuilding,
    navigate,
    getBuildingStats,
  } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  const buildings: Array<'CME' | 'CB' | 'ICT'> = ['CME', 'CB', 'ICT'];
  const overall = getBuildingStats('All');

  const bldgStats = buildings.map((b) => ({
    bldg: b,
    stats: getBuildingStats(b),
  }));

  const handleOpenBuilding = (b: string) => {
    setActiveFilterBuilding(b);
    navigate('manage-rooms');
  };

  const statCards = [
    { label: 'Available', value: overall.vacant, icon: 'meeting_room', tone: 'emerald' },
    { label: 'Occupied', value: overall.occupied, icon: 'groups', tone: 'rose' },
    { label: 'Reserved', value: overall.reserved, icon: 'event_available', tone: 'amber' },
    { label: 'Total rooms', value: overall.total, icon: 'domain', tone: 'slate' },
  ];

  const toneClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 bg-[#fafaf9]">
      <Header title="SpotFree Admin" subtitle="Campus Operations" showBack={false} />

      <main className={isWeb
        ? 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6'
        : 'flex flex-col px-4 pt-3 pb-8 gap-4'}
      >
        {/* Admin identity / command banner */}
        <section className="relative overflow-hidden rounded-3xl bg-[#1c1917] text-white p-5 sm:p-6 shadow-sm">
          <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-emerald-500/10" />
          <div className="absolute right-16 -bottom-16 w-44 h-44 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-wide">
                  ADMIN
                </span>
                <span className="text-xs text-slate-300 truncate">{currentUser.name}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2">
                Campus control center
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Monitor room availability, manage spaces and review campus activity from one place.
              </p>
            </div>

            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-white/10 border border-white/10 items-center justify-center text-emerald-300 shrink-0">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            </div>
          </div>
        </section>

        {/* At-a-glance metrics */}
        <section aria-label="Campus overview" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border p-3.5 sm:p-4 bg-white shadow-xs ${toneClasses[card.tone]}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold opacity-80">{card.label}</span>
                <span className="material-symbols-outlined text-base opacity-80">{card.icon}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-slate-900">{card.value}</div>
            </div>
          ))}
        </section>

        {/* Live status */}
        <section className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Live room status</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Real-time view across campus buildings</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <LiveRoomStatusSection initialBuilding="All" />
        </section>

        {/* Buildings */}
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between px-0.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Buildings</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Open a building to manage its rooms</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">3 wings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {bldgStats.map(({ bldg, stats }) => {
              const occupancy = stats.total ? Math.round(((stats.occupied + stats.reserved) / stats.total) * 100) : 0;
              return (
                <button
                  key={bldg}
                  type="button"
                  onClick={() => handleOpenBuilding(bldg)}
                  className="group p-4 bg-white rounded-2xl border border-slate-200 text-left hover:border-emerald-300 hover:shadow-sm active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="font-black text-base text-slate-900">{bldg}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{stats.total} rooms</span>
                    </div>
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.vacant > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      <span className="material-symbols-outlined text-lg">
                        {stats.vacant > 0 ? 'check_circle' : 'block'}
                      </span>
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-slate-500">In use</span>
                      <span className="text-slate-700">{occupancy}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-slate-800 transition-all" style={{ width: `${occupancy}%` }} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold">
                      <span className="text-emerald-700">{stats.vacant} available</span>
                      <span className="text-amber-700">{stats.reserved} reserved</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Operations */}
        <section className="flex flex-col gap-3">
          <div className="px-0.5">
            <h3 className="text-sm font-extrabold text-slate-900">Administration</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Manage the campus directory and room operations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                title: 'Manage Rooms',
                desc: 'Add, edit & configure',
                icon: 'settings_input_component',
                tone: 'emerald',
                action: () => navigate('manage-rooms'),
              },
              {
                title: 'User Management',
                desc: 'Students, faculty & admins',
                icon: 'manage_accounts',
                tone: 'blue',
                action: () => navigate('user-management'),
              },
              {
                title: 'Status History',
                desc: `${history.length} audit logs`,
                icon: 'history',
                tone: 'purple',
                action: () => navigate('status-history'),
              },
              {
                title: 'Campus Insights',
                desc: 'Utilization & planning',
                icon: 'analytics',
                tone: 'amber',
                action: () => navigate('campus-insights'),
              },
              {
                title: 'Issue Reports',
                desc: 'Track room problems',
                icon: 'report_problem',
                tone: 'rose',
                action: () => navigate('report-issue'),
              },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="group p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center sm:items-start sm:flex-col gap-3 text-left hover:border-slate-300 hover:shadow-sm active:scale-[0.99] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                  item.tone === 'blue' ? 'bg-blue-50 text-blue-700' :
                  item.tone === 'amber' ? 'bg-amber-50 text-amber-700' :
                  item.tone === 'rose' ? 'bg-rose-50 text-rose-700' :
                  'bg-purple-50 text-purple-700'
                }`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-slate-900">{item.title}</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-base ml-auto sm:ml-0 sm:mt-auto group-hover:text-slate-500 transition-colors">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
