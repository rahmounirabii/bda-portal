/**
 * useTheme Hook
 * Manages theme (light/dark/system) with localStorage and database sync
 */

import { useState, useEffect } from 'react';
import { useUserPreferences, useUpdatePreferences } from '@/entities/settings/settings.hooks';
import type { ThemeOption } from '@/entities/settings/settings.types';

/**
 * Theme management hook
 * - Loads from localStorage first (instant)
 * - Syncs with database
 * - Applies theme to DOM
 * - Persists changes
 */
export function useTheme(userId?: string) {
  // Load from localStorage for instant application
  const [theme, setThemeState] = useState<ThemeOption>(() => {
    const stored = localStorage.getItem('bda-portal-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'light';
  });

  // Load from database
  const { data: preferences } = useUserPreferences(userId);
  const updatePreferences = useUpdatePreferences();

  // Sync with database when loaded
  useEffect(() => {
    if (preferences?.theme && preferences.theme !== theme) {
      setThemeState(preferences.theme);
    }
  }, [preferences?.theme]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;

    // Resolve system preference if needed
    let effectiveTheme: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemPrefersDark ? 'dark' : 'light';
    } else {
      effectiveTheme = theme as 'light' | 'dark';
    }

    // Apply or remove dark class
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist to localStorage for instant next load
    localStorage.setItem('bda-portal-theme', theme);
  }, [theme]);

  // Listen to system theme changes if system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Force re-render by updating state
      setThemeState('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  /**
   * Set theme and persist to database
   */
  const setTheme = async (newTheme: ThemeOption) => {
    setThemeState(newTheme);

    // Save to database if user is logged in
    if (userId) {
      await updatePreferences.mutateAsync({
        userId,
        preferences: { theme: newTheme },
      });
    }
  };

  /**
   * Get effective theme (resolved from system if needed)
   */
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  };

  return {
    theme,
    setTheme,
    effectiveTheme: getEffectiveTheme(),
    isLight: getEffectiveTheme() === 'light',
    isDark: getEffectiveTheme() === 'dark',
  };
}
