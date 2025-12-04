import React from 'react';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastConfig } from '@/lib/toastConfig';

/**
 * Theme-aware Toast component
 * Must be rendered inside ThemeProvider to access theme context
 */
export default function ThemedToast() {
  const { isDark } = useTheme();
  const toastConfig = createToastConfig(isDark);

  return <Toast config={toastConfig} />;
}
