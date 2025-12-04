import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@poolup_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system'); // Default to follow system theme
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update isDark when theme or system theme changes
  useEffect(() => {
    updateIsDark();
  }, [theme, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const updateIsDark = () => {
    if (theme === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware styling helper
export const useThemeStyles = () => {
  const { isDark } = useTheme();
  
  return {
    // Backgrounds
    background: isDark ? 'bg-black' : 'bg-white',
    surface: isDark ? 'bg-dark-surface' : 'bg-gray-50',
    card: isDark ? 'bg-dark-card' : 'bg-white',
    overlay: isDark ? 'bg-dark-overlay' : 'bg-black/20',
    
    // Text
    textPrimary: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-400',
    textTertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    
    // Interactive
    button: isDark ? 'bg-dark-brand-blue' : 'bg-blue-600',
    buttonSecondary: isDark ? 'bg-dark-glass-light border border-dark-glass-light' : 'bg-gray-100',
    
    // Borders
    border: isDark ? 'border-dark-border' : 'border-gray-200',
    borderSubtle: isDark ? 'border-dark-border-subtle' : 'border-gray-100',
    
    // Status indicator
    className: isDark ? 'dark' : '',
    
    // Activity Indicator Colors
    activityIndicator: {
      primary: isDark ? '#60A5FA' : '#3B82F6',      // Blue
      secondary: isDark ? '#9CA3AF' : '#6B7280',    // Gray
      success: isDark ? '#FB923C' : '#F97316',      // Orange
      danger: isDark ? '#F87171' : '#EF4444',       // Red
      warning: isDark ? '#FBBF24' : '#F59E0B',      // Yellow
      brand: isDark ? '#60A5FA' : '#3B82F6',        // Brand blue
      white: '#FFFFFF',
      dark: '#000000',
    },
  };
};