'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showBack = false }) => {
  const {
    navigate,
    goBack,
    currentUser,
    unreadNotificationCount,
  } = useSpotFree();

  return (
    <div className="sticky top-0 z-40 bg-[#f8f9ff]/95 backdrop-blur-md border-b border-slate-200">
      {/* Main App Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button
              onClick={goBack}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-800 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Go Back"
              aria-label="Go Back"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <span className="material-symbols-outlined text-lg">meeting_room</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-slate-900 leading-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-slate-500 leading-tight truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('notifications')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 relative hover:bg-slate-50 active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-base">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          <button
            onClick={() => navigate('profile')}
            className="w-8 h-8 rounded-full bg-[#0f172a] text-white font-bold text-xs flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            title="Profile"
            aria-label="Profile"
          >
            {currentUser.avatar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
