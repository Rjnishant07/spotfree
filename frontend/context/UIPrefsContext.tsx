'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
export type ViewMode = 'mobile' | 'web';

interface UIPrefsContextType {
  /** What the user picked: follow the OS, or force light / dark. */
  themePref: ThemePref;
  /** What is actually applied right now. */
  resolvedTheme: 'light' | 'dark';
  setThemePref: (theme: ThemePref) => void;
  /** What the user picked: phone-style layout or desktop-style layout. */
  viewMode: ViewMode;
  /** What is actually rendered (web view falls back to mobile on narrow screens). */
  effectiveView: ViewMode;
  setViewMode: (view: ViewMode) => void;
  /** False on phone-sized screens, where the web layout can't fit. */
  canUseWebView: boolean;
}

const THEME_KEY = 'spotfree_theme';
const VIEW_KEY = 'spotfree_view';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const readStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, sandboxed frame) - preference just isn't remembered.
  }
};

const UIPrefsContext = createContext<UIPrefsContextType | null>(null);

export const UIPrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePref, setThemePrefState] = useState<ThemePref>('system');
  const [viewMode, setViewModeState] = useState<ViewMode>('mobile');
  const [systemDark, setSystemDark] = useState(false);
  const [isWide, setIsWide] = useState(false);

  // Restore saved choices and subscribe to OS theme / screen width changes.
  useIsoLayoutEffect(() => {
    const savedTheme = readStorage(THEME_KEY);
    if (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark') {
      setThemePrefState(savedTheme);
    }

    const savedView = readStorage(VIEW_KEY);
    if (savedView === 'mobile' || savedView === 'web') {
      setViewModeState(savedView);
    } else {
      // First visit: desktop-sized screens start in web view, phones in mobile view.
      setViewModeState(window.innerWidth >= 1024 ? 'web' : 'mobile');
    }

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const wideQuery = window.matchMedia('(min-width: 768px)');
    setSystemDark(darkQuery.matches);
    setIsWide(wideQuery.matches);

    const onDark = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    const onWide = (e: MediaQueryListEvent) => setIsWide(e.matches);
    darkQuery.addEventListener('change', onDark);
    wideQuery.addEventListener('change', onWide);
    return () => {
      darkQuery.removeEventListener('change', onDark);
      wideQuery.removeEventListener('change', onWide);
    };
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themePref === 'system' ? (systemDark ? 'dark' : 'light') : themePref;

  // Apply the theme to <html> so the CSS in globals.css can react to it.
  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    root.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setThemePref = useCallback((theme: ThemePref) => {
    setThemePrefState(theme);
    writeStorage(THEME_KEY, theme);
  }, []);

  const setViewMode = useCallback((view: ViewMode) => {
    setViewModeState(view);
    writeStorage(VIEW_KEY, view);
  }, []);

  const value = useMemo<UIPrefsContextType>(
    () => ({
      themePref,
      resolvedTheme,
      setThemePref,
      viewMode,
      effectiveView: viewMode === 'web' && isWide ? 'web' : 'mobile',
      setViewMode,
      canUseWebView: isWide,
    }),
    [themePref, resolvedTheme, setThemePref, viewMode, setViewMode, isWide]
  );

  return <UIPrefsContext.Provider value={value}>{children}</UIPrefsContext.Provider>;
};

export const useUIPrefs = (): UIPrefsContextType => {
  const ctx = useContext(UIPrefsContext);
  if (!ctx) throw new Error('useUIPrefs must be used within UIPrefsProvider');
  return ctx;
};
