import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (error) {
    // localStorage can be unavailable (private mode) — fall back to light.
  }
  return 'light';
};

const applyThemeToDocument = (selectedTheme) => {
  const root = document.documentElement;
  if (selectedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(getInitialTheme);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [loading, setLoading] = useState(true);

  // Apply the class before paint so there is no flash of the wrong theme.
  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      /* no-op */
    }
  }, [theme]);

  // Adopt the saved server preference once the authenticated profile is available.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const serverTheme = user.settings?.theme;
    if (serverTheme === 'light' || serverTheme === 'dark') {
      setTheme(serverTheme);
    }
    const serverLanguage = user.settings?.language;
    if (serverLanguage) setLanguage(serverLanguage);
    setLoading(false);
  }, [user]);

  const updateTheme = useCallback(async (newTheme) => {
    setTheme(newTheme);
    applyThemeToDocument(newTheme);
    if (!userService.isAuthenticated()) return;
    try {
      await userService.updateUserSettings({ theme: newTheme });
    } catch (error) {
      // Theme still applies locally if the preference sync fails.
    }
  }, []);

  const updateLanguage = useCallback(async (newLanguage) => {
    setLanguage(newLanguage);
    try {
      localStorage.setItem('language', newLanguage);
    } catch (error) {
      /* no-op */
    }
    if (!userService.isAuthenticated()) return;
    try {
      await userService.updateUserSettings({ language: newLanguage });
    } catch (error) {
      /* no-op */
    }
  }, []);

  const getThemeClasses = () =>
    theme === 'dark'
      ? 'bg-[#0b1220] text-ink-100 min-h-screen'
      : 'bg-ink-50 text-ink-900 min-h-screen';

  const getCardClasses = () =>
    theme === 'dark'
      ? 'bg-ink-900 border-ink-800 text-white'
      : 'bg-white border-ink-200 text-ink-900';

  const getInputClasses = () =>
    theme === 'dark'
      ? 'bg-ink-900 border-ink-700 text-white placeholder-ink-500 focus:border-brand-500 focus:ring-brand-500/20'
      : 'bg-white border-ink-200 text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:ring-brand-500/20';

  const value = {
    theme,
    language,
    loading,
    updateTheme,
    updateLanguage,
    getThemeClasses,
    getCardClasses,
    getInputClasses,
    isDark: theme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
