'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { ViewScreen } from '@/lib/types';
import { SidebarSwitcher } from '@/components/ViewThemeSwitcher';
import { useUIPrefs } from '@/context/UIPrefsContext';

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
  const { resolvedTheme } = useUIPrefs();
  const isDark = resolvedTheme === 'dark';
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
      key: 'insights',
      label: 'Campus Insights',
      icon: 'analytics',
      view: 'campus-insights',
      match: ['campus-insights'],
    },
    {
      key: 'best-room',
      label: 'Find Best Room',
      icon: 'auto_awesome',
      view: 'best-room-req',
      match: ['best-room-req', 'recommended-room'],
    },
    ...(role === 'student'
      ? ([
          {
            key: 'timetable',
            label: 'My Timetable',
            icon: 'calendar_month',
            view: 'my-timetable',
            match: ['my-timetable'],
          },
        ] as NavItem[])
      : []),
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
          {
            key: 'user-management',
            label: 'User Management',
            icon: 'manage_accounts',
            view: 'user-management',
            match: ['user-management'],
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
      key: 'issues',
      label: 'Report an Issue',
      icon: 'report_problem',
      view: 'report-issue',
      match: ['report-issue'],
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
    <aside className={`sticky top-0 h-screen w-[72px] lg:w-[310px] shrink-0 flex flex-col z-30 transition-colors duration-150 ${isDark ? "bg-[#17130f] border-r border-[#332a20]" : "bg-white border-r border-slate-200"}`}>
      {/* Brand */}
      <div className={`flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-5 h-[84px] shrink-0 border-b ${isDark ? "border-[#332a20]" : "border-slate-100"}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-emerald-400 shadow-sm shrink-0 ${isDark ? "bg-[#2a241d] border border-[#443b2d]" : "bg-[#1c1917]"}`}>
          <span className="material-symbols-outlined text-2xl">meeting_room</span>
        </div>
        <div className="hidden lg:block min-w-0">
          <div className={`font-bold leading-tight ${isDark ? "text-[#f5f1e8]" : "text-slate-900"}`}>SpotFree</div>
          <div className={`text-[11px] leading-tight truncate ${isDark ? "text-[#a89d8b]" : "text-slate-500"}`}>Heritage Institute of Technology</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 lg:px-3 space-y-1.5" aria-label="Main">
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
              className={`group relative w-full flex items-center justify-center lg:justify-start gap-3 rounded-xl px-2.5 lg:px-3 py-2.5 text-sm transition-all duration-150 cursor-pointer ${
                active
                  ? (isDark ? 'bg-[#07332d] text-[#67e8d3] font-bold ring-1 ring-[#0f665a] shadow-xs' : 'bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-200 shadow-xs')
                  : (isDark ? 'text-[#c9bda9] hover:bg-[#231d16] hover:text-[#f5f1e8] font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium')
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] leading-none transition-transform group-hover:scale-105 ${
                  active ? (isDark ? 'text-[#4de0c7]' : 'text-emerald-700') : (isDark ? 'text-[#9f927e] group-hover:text-[#d7cbb8]' : 'text-slate-500 group-hover:text-slate-700')
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


    </aside>
  );
};

export default WebSidebar;
