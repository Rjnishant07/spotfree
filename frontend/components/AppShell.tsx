'use client';

import React from 'react';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Toast } from '@/components/FeedbackComponents';
import { WebSidebar } from '@/components/WebSidebar';
import { FloatingSwitcher, ThemeFab } from '@/components/ViewThemeSwitcher';

interface AppShellProps {
  /** True on the login / sign-up screens (no navigation chrome). */
  isAuth: boolean;
  children: React.ReactNode;
}

const FEATURES = [
  { icon: 'sensors', text: 'Live room status across CME, CB and ICT' },
  { icon: 'qr_code_scanner', text: 'Update a room in seconds with its QR plaque' },
  { icon: 'auto_awesome', text: 'Smart suggestions for the best room to use' },
];

/**
 * Wraps the active screen in either the mobile frame (phone-style, bottom nav)
 * or the web layout (sidebar + wide content column), based on the user's choice.
 */
export const AppShell: React.FC<AppShellProps> = ({ isAuth, children }) => {
  const { effectiveView } = useUIPrefs();

  if (effectiveView === 'web') {
    return (
      <div className="spotfree-canvas min-h-screen w-full flex">
        {!isAuth && <WebSidebar />}

        {isAuth ? (
          <div className="flex-1 flex min-h-screen">
            <div className="hidden lg:flex flex-1 flex-col justify-between bg-[#0f172a] text-white p-12">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined text-2xl">meeting_room</span>
                </div>
                <div>
                  <div className="text-xl font-bold leading-tight">SpotFree</div>
                  <div className="text-xs text-slate-300">Heritage Institute of Technology</div>
                </div>
              </div>

              <div className="max-w-md">
                <h2 className="text-4xl font-bold leading-tight tracking-tight">
                  Find. Learn. Use. Better Spaces.
                </h2>
                <ul className="mt-8 space-y-4">
                  {FEATURES.map((f) => (
                    <li key={f.icon} className="flex items-center gap-3 text-slate-300">
                      <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <span className="material-symbols-outlined text-xl">{f.icon}</span>
                      </span>
                      <span className="text-sm">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-slate-400">Room availability, in real time.</div>
            </div>

            <main className="w-full lg:w-[520px] shrink-0 bg-[#f8f9ff] flex flex-col overflow-y-auto">
              {children}
            </main>
          </div>
        ) : (
          <div className="flex-1 min-w-0 min-h-screen flex flex-col bg-[#f8f9ff] overflow-y-auto">
            <main className="flex-1 w-full flex flex-col">{children}</main>
          </div>
        )}

        {isAuth && <FloatingSwitcher />}
        <Toast />
      </div>
    );
  }

  return (
    <div className="spotfree-canvas min-h-screen w-full flex justify-center items-start">
      <div className="w-full max-w-[430px] min-h-screen bg-[#f8f9ff] flex flex-col relative shadow-2xl overflow-x-hidden">
        <main className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">{children}</main>
        {!isAuth && <BottomNavigation />}
      </div>

      <FloatingSwitcher />
      <ThemeFab raised={!isAuth} />
      <Toast />
    </div>
  );
};

export default AppShell;
