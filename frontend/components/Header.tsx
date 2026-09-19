'use client';

import React, { useState, useEffect } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';

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
  const { effectiveView, resolvedTheme } = useUIPrefs();
  const isDark = resolvedTheme === 'dark';

  // Real browser clock — updates every minute
  const [realTime, setRealTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  useEffect(() => {
    const tick = setInterval(() => {
      setRealTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  const isWeb = effectiveView === 'web';
  const displayTitle = isWeb && title === 'SpotFree HIT' ? 'Dashboard' : title;
  const displaySubtitle = isWeb && title === 'SpotFree HIT' ? 'Campus Real-Time Space Management' : subtitle;

  if (isWeb) {
    return (
      <header
        className={`sticky top-0 z-40 shrink-0 transition-colors duration-150 ${
          isDark
            ? 'bg-[#0e172a]/95 backdrop-blur-md border-b border-[#1e2d4a] shadow-xs'
            : 'bg-white/90 backdrop-blur-md border-b border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between px-6 lg:px-8 h-16 w-full">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button
                onClick={goBack}
                className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer ${
                  isDark
                    ? 'bg-[#142036] hover:bg-[#1c2d4c] border border-[#223558] text-[#e2e8f0] hover:text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
                title="Go Back"
                aria-label="Go Back"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isDark ? 'text-[#94a3b8]' : 'text-slate-400'}`}>
                  SpotFree
                </span>
                <span className={`text-xs ${isDark ? 'text-[#64748b] font-bold' : 'text-slate-300'}`}>
                  /
                </span>
                <h1
                  className={`font-bold text-base leading-tight truncate ${
                    isDark ? 'text-white tracking-tight' : 'text-slate-900'
                  }`}
                >
                  {displayTitle}
                </h1>
              </div>
              {displaySubtitle && (
                <p
                  className={`text-[11px] leading-tight truncate mt-0.5 ${
                    isDark ? 'text-[#94a3b8] font-normal' : 'text-slate-500'
                  }`}
                >
                  {displaySubtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Campus Live Status Chip */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors ${
                isDark
                  ? 'bg-[#142036] border border-[#223558] shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full bg-emerald-400 animate-pulse ${
                  isDark ? 'shadow-[0_0_8px_rgba(52,211,153,0.7)]' : ''
                }`}
              />
              <span className={`font-semibold ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}>
                HIT Campus
              </span>
              <span className={isDark ? 'text-[#64748b]' : 'text-slate-300'}>•</span>
              <span className={`font-medium ${isDark ? 'text-[#6ee7b7]' : 'text-slate-500'}`}>
                {realTime}
              </span>
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => navigate('notifications')}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-[#142036] border border-[#223558] text-[#e2e8f0] hover:text-white hover:bg-[#1c2d4c] hover:border-[#38517c]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Notifications"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-lg">notifications</span>
              {unreadNotificationCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 ${
                    isDark ? 'border-[#0e172a]' : 'border-white'
                  }`}
                >
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Profile Button */}
            <button
              onClick={() => navigate('profile')}
              className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl transition-all cursor-pointer border ${
                isDark
                  ? 'border-transparent hover:bg-[#142036] hover:border-[#223558]'
                  : 'border-transparent hover:bg-slate-100 hover:border-slate-200'
              }`}
              title={`View ${currentUser.name}'s profile`}
              aria-label="Profile"
            >
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shadow-xs ${
                  isDark
                    ? 'bg-[#1a2e4c] text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : 'bg-[#0f172a] text-white'
                }`}
              >
                {currentUser.avatar}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span
                  className={`text-xs font-bold leading-tight ${
                    isDark ? 'text-[#f8fafc]' : 'text-slate-900'
                  }`}
                >
                  {currentUser.name}
                </span>
                <span
                  className={`text-[10px] leading-tight capitalize ${
                    isDark ? 'text-[#94a3b8] font-medium' : 'text-slate-500'
                  }`}
                >
                  {currentUser.roleLabel || 'Student'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <div
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-150 ${
        isDark ? 'bg-[#0e172a]/95 border-[#1e2d4a]' : 'bg-[#f8f9ff]/95 border-slate-200'
      }`}
    >
      {/* Main App Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button
              onClick={goBack}
              className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-[#142036] hover:bg-[#1c2d4c] border border-[#223558] text-[#e2e8f0]'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
              title="Go Back"
              aria-label="Go Back"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center text-emerald-400 shadow-sm shrink-0 border border-slate-700/40">
              <span className="material-symbols-outlined text-lg">meeting_room</span>
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={`font-bold text-sm leading-tight truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`text-[11px] leading-tight truncate ${
                  isDark ? 'text-[#94a3b8]' : 'text-slate-500'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('notifications')}
            className={`w-8 h-8 rounded-full flex items-center justify-center relative active:scale-95 transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#142036] border border-[#223558] text-[#e2e8f0] hover:bg-[#1c2d4c]'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-base">notifications</span>
            {unreadNotificationCount > 0 && (
              <span
                className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ${
                  isDark ? 'ring-[#0e172a]' : 'ring-white'
                }`}
              />
            )}
          </button>

          <button
            onClick={() => navigate('profile')}
            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1a2e4c] text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'bg-[#0f172a] text-white'
            }`}
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
