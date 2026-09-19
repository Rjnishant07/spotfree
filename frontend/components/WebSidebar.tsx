'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { ViewScreen } from '@/lib/types';
import { SidebarSwitcher } from '@/components/ViewThemeSwitcher';

interface NavItem {
  key: string;
  label: string;
  icon: string;
  view: ViewScreen;
  match: ViewScreen[];
  badge?: number;
}

/** Left navigation used by the web (desktop) layout. Replaces the mobile bottom bar. */
export const WebSidebar: React.FC = () => {
  const { currentRole, currentView, navigate, currentUser, unreadNotificationCount } = useSpotFree();
  const role = (currentRole || 'student').toLowerCase();

  const dashboardView: ViewScreen =
    role === 'admin' ? 'admin-dashboard' : role === 'faculty' ? 'faculty-dashboard' : 'student-dashboard';

  const items: NavItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      view: dashboardView,
      match: ['student-dashboard', 'faculty-dashboard', 'admin-dashboard'],
    },
    {
      key: 'availability',
      label: 'Room Availability',
      icon: 'meeting_room',
      view: 'room-availability',
      match: ['room-availability', 'room-details'],
    },
    {
      key: 'best-room',
      label: 'Find Best Room',
      icon: 'auto_awesome',
      view: 'best-room-req',
      match: ['best-room-req', 'recommended-room'],
    },
    {
      key: 'timetable',
      label: 'My Timetable',
      icon: 'calendar_month',
      view: 'my-timetable',
      match: ['my-timetable'],
    },
    {
      key: 'scanner',
      label: 'Scan / Update Room',
      icon: 'qr_code_scanner',
      view: 'scan-qr',
      match: ['scan-qr', 'enter-room', 'room-identified', 'update-status', 'status-updated'],
    },
    ...(role === 'admin'
      ? ([
          {
            key: 'manage-rooms',
            label: 'Manage Rooms',
            icon: 'domain',
            view: 'manage-rooms',
            match: ['manage-rooms'],
          },
        ] as NavItem[])
      : []),
    {
      key: 'history',
      label: 'Status History',
      icon: 'history',
      view: 'status-history',
      match: ['status-history'],
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: 'notifications',
      view: 'notifications',
      match: ['notifications'],
      badge: unreadNotificationCount,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: 'person',
      view: 'profile',
      match: ['profile'],
    },
  ];

  return (
    <aside className="sticky top-0 h-screen w-16 lg:w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-5 h-16 border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#0f172a] flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
          <span className="material-symbols-outlined text-xl">meeting_room</span>
        </div>
        <div className="hidden lg:block min-w-0">
          <div className="font-bold text-slate-900 leading-tight">SpotFree</div>
          <div className="text-[11px] text-slate-500 leading-tight truncate">Heritage Institute of Technology</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 lg:px-3 space-y-1" aria-label="Main">
        {items.map((item) => {
          const active = item.match.includes(currentView);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.view)}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`group relative w-full flex items-center justify-center lg:justify-start gap-3 rounded-xl px-2.5 lg:px-3 py-2.5 text-sm transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600 shadow-xs pl-2 lg:pl-2.5'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] leading-none transition-transform group-hover:scale-105 ${
                  active ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              >
                {item.icon}
              </span>
              <span className="hidden lg:inline truncate">{item.label}</span>
              {item.badge ? (
                <span className="absolute top-1 right-1.5 lg:static lg:ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Layout / theme controls */}
      <SidebarSwitcher />

      {/* Signed-in user */}
      <button
        type="button"
        onClick={() => navigate('profile')}
        title={currentUser.name}
        className="shrink-0 border-t border-slate-100 flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
      >
        <span className="w-9 h-9 rounded-full bg-[#0f172a] text-white font-bold text-xs flex items-center justify-center shrink-0">
          {currentUser.avatar}
        </span>
        <span className="hidden lg:block min-w-0">
          <span className="block text-sm font-semibold text-slate-900 truncate">{currentUser.name}</span>
          <span className="block text-[11px] text-slate-500 truncate">{currentUser.roleLabel}</span>
        </span>
      </button>
    </aside>
  );
};

export default WebSidebar;
