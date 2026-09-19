'use client';

import React from 'react';
import { useUIPrefs, ThemePref, ViewMode } from '@/context/UIPrefsContext';

interface Option<T extends string> {
  value: T;
  label: string;
  icon: string;
}

const VIEW_OPTIONS: Option<ViewMode>[] = [
  { value: 'mobile', label: 'Mobile view', icon: 'smartphone' },
  { value: 'web', label: 'Web view', icon: 'desktop_windows' },
];

const THEME_OPTIONS: Option<ThemePref>[] = [
  { value: 'system', label: 'System theme', icon: 'brightness_auto' },
  { value: 'light', label: 'Light theme', icon: 'light_mode' },
  { value: 'dark', label: 'Dark theme', icon: 'dark_mode' },
];

interface SegmentedProps<T extends string> {
  group: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  showText?: boolean;
  textClass?: string;
  className?: string;
}

function Segmented<T extends string>({
  group,
  options,
  value,
  onChange,
  showText = false,
  textClass = 'inline',
  className = '',
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={group}
      className={`flex items-center gap-0.5 rounded-full bg-slate-100 border border-slate-200 p-0.5 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
              active
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base leading-none">{option.icon}</span>
            {showText && (
              <span className={textClass}>{option.label.replace(' view', '').replace(' theme', '')}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Floating switcher shown in mobile view on tablet/desktop screens, and on the web-view login screen. */
export const FloatingSwitcher: React.FC = () => {
  const { viewMode, setViewMode, themePref, setThemePref, canUseWebView } = useUIPrefs();

  return (
    <div className="hidden md:flex fixed top-3 right-3 z-[60] flex-col xl:flex-row items-stretch xl:items-center gap-1.5 rounded-3xl xl:rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg p-1.5">
      {canUseWebView && (
        <Segmented
          group="Layout"
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={setViewMode}
          className="flex-col xl:flex-row rounded-2xl xl:rounded-full"
        />
      )}
      <Segmented
        group="Theme"
        options={THEME_OPTIONS}
        value={themePref}
        onChange={setThemePref}
        className="flex-col xl:flex-row rounded-2xl xl:rounded-full"
      />
    </div>
  );
};

/** Compact theme button for phone-sized screens (cycles system -> light -> dark). */
export const ThemeFab: React.FC<{ raised?: boolean }> = ({ raised = true }) => {
  const { themePref, setThemePref } = useUIPrefs();
  const order: ThemePref[] = ['system', 'light', 'dark'];
  const current = THEME_OPTIONS.find((o) => o.value === themePref) ?? THEME_OPTIONS[0];
  const next = order[(order.indexOf(themePref) + 1) % order.length];

  return (
    <button
      type="button"
      onClick={() => setThemePref(next)}
      title={`${current.label} (tap to change)`}
      aria-label={`${current.label}. Tap to change.`}
      className={`md:hidden fixed right-3 z-[60] w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer ${
        raised ? 'bottom-20' : 'bottom-4'
      }`}
    >
      <span className="material-symbols-outlined text-xl">{current.icon}</span>
    </button>
  );
};

/** Layout + theme controls for the web-view sidebar. */
export const SidebarSwitcher: React.FC = () => {
  const { viewMode, setViewMode, themePref, setThemePref } = useUIPrefs();

  return (
    <div className="border-t border-slate-100 px-2 lg:px-3 py-2 flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center justify-between gap-1">
        <span className="hidden lg:inline text-[11px] font-semibold text-slate-500">View</span>
        <div
          role="radiogroup"
          aria-label="Layout mode"
          className="flex items-center rounded-lg bg-slate-100 border border-slate-200/80 p-0.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'mobile'}
            title="Mobile view"
            onClick={() => setViewMode('mobile')}
            className={`flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
              viewMode === 'mobile'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm leading-none">smartphone</span>
            <span className="hidden lg:inline">Mobile</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'web'}
            title="Web view"
            onClick={() => setViewMode('web')}
            className={`flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
              viewMode === 'web'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm leading-none">desktop_windows</span>
            <span className="hidden lg:inline">Web</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className="hidden lg:inline text-[11px] font-semibold text-slate-500">Theme</span>
        <div
          role="radiogroup"
          aria-label="Theme mode"
          className="flex items-center rounded-lg bg-slate-100 border border-slate-200/80 p-0.5"
        >
          {[
            { value: 'system', icon: 'brightness_auto', label: 'Auto' },
            { value: 'light', icon: 'light_mode', label: 'Light' },
            { value: 'dark', icon: 'dark_mode', label: 'Dark' },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={themePref === t.value}
              title={`${t.label} theme`}
              onClick={() => setThemePref(t.value as any)}
              className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition-all cursor-pointer ${
                themePref === t.value
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm leading-none">{t.icon}</span>
              <span className="hidden lg:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
