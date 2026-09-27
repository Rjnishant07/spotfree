'use client';

import React from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';

export const BottomNavigation: React.FC = () => {
  const { currentRole, currentView, navigate } = useSpotFree();

  if (currentView === 'login' || currentView === 'signup') return null;

  const isDashboardActive =
    currentView === 'student-dashboard' ||
    currentView === 'faculty-dashboard' ||
    currentView === 'admin-dashboard';

  const isScannerActive =
    currentView === 'scan-qr' ||
    currentView === 'enter-room' ||
    currentView === 'room-identified' ||
    currentView === 'update-status' ||
    currentView === 'status-updated';

  const isHistoryActive = currentView === 'status-history';
  const isInsightsActive = currentView === 'campus-insights';
  const isIssueActive = currentView === 'report-issue';
  const isProfileActive = currentView === 'profile';

  const handleDashboardClick = () => {
    const roleNormalized = (currentRole || '').toLowerCase();
    if (roleNormalized === 'student') navigate('student-dashboard');
    else if (roleNormalized === 'faculty') navigate('faculty-dashboard');
    else if (roleNormalized === 'admin') navigate('admin-dashboard');
    else navigate('student-dashboard');
  };

  const handleScannerClick = () => {
    navigate('scan-qr');
  };

  const handleHistoryClick = () => {
    navigate('status-history');
  };

  const handleInsightsClick = () => {
    navigate('campus-insights');
  };

  const handleIssueClick = () => {
    navigate('report-issue');
  };

  const handleProfileClick = () => {
    navigate('profile');
  };

  return (
    <nav className="fixed bottom-0 max-w-[430px] w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1.5 flex items-center justify-around z-40 shadow-lg">
      <button
        onClick={handleDashboardClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          isDashboardActive
            ? 'text-emerald-700 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-label="Dashboard"
      >
        <span className="material-symbols-outlined text-xl">dashboard</span>
        <span className="text-[11px]">Dashboard</span>
      </button>

      <button
        onClick={handleScannerClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          isScannerActive
            ? 'text-emerald-700 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-label="Scanner"
      >
        <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
        <span className="text-[11px]">Scanner</span>
      </button>

      <button
        onClick={handleHistoryClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          isHistoryActive
            ? 'text-emerald-700 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-label="History"
      >
        <span className="material-symbols-outlined text-xl">history</span>
        <span className="text-[11px]">History</span>
      </button>



      <button
        onClick={handleInsightsClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors cursor-pointer ${isInsightsActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
        aria-label="Campus Insights"
      >
        <span className="material-symbols-outlined text-xl">analytics</span>
        <span className="text-[10px]">Insights</span>
      </button>

      <button
        onClick={handleIssueClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors cursor-pointer ${isIssueActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
        aria-label="Report an Issue"
      >
        <span className="material-symbols-outlined text-xl">report_problem</span>
        <span className="text-[10px]">Issues</span>
      </button>

      <button
        onClick={handleProfileClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          isProfileActive
            ? 'text-emerald-700 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-label="Profile"
      >
        <span className="material-symbols-outlined text-xl">person</span>
        <span className="text-[11px]">Profile</span>
      </button>
    </nav>
  );
};
