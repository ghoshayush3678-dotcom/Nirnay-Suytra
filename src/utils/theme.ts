import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'nirnay_theme_mode';

/**
 * Reads the stored theme preference from localStorage, defaulting to 'system'
 * (which follows the user's OS preference) or 'light'.
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val;
    }
  } catch {
    // ignore localStorage errors (e.g., privacy mode)
  }
  return 'system';
}

/**
 * Calculates whether dark mode should be active given the current ThemeMode.
 */
export function resolveEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
}

/**
 * Applies or removes the `.dark` class on <html> and updates the color-scheme style.
 */
export function applyThemeToDOM(mode: ThemeMode): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const effective = resolveEffectiveTheme(mode);
  const root = document.documentElement;

  if (effective === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  return effective;
}

/**
 * React hook to manage theme state with full localStorage persistence and system-listener sync.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() =>
    resolveEffectiveTheme(getStoredTheme())
  );

  const setTheme = useCallback((newMode: ThemeMode) => {
    setThemeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
    const resolved = applyThemeToDOM(newMode);
    setEffectiveTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    // If currently dark (effective), switch to light. If light, switch to dark.
    const next: ThemeMode = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [effectiveTheme, setTheme]);

  useEffect(() => {
    // Initialize DOM state on mount
    const initialMode = getStoredTheme();
    const resolved = applyThemeToDOM(initialMode);
    setEffectiveTheme(resolved);

    // Listen for OS color scheme changes if set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = getStoredTheme();
      if (current === 'system') {
        const nextResolved = applyThemeToDOM('system');
        setEffectiveTheme(nextResolved);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    // Listen for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newMode = (e.newValue as ThemeMode) || 'system';
        setThemeState(newMode);
        const nextResolved = applyThemeToDOM(newMode);
        setEffectiveTheme(nextResolved);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    setTheme,
    toggleTheme,
  };
}
