import React from 'react';
import { BaseToast, ErrorToast, InfoToast, ToastConfig } from 'react-native-toast-message';

/**
 * Create theme-aware toast configuration
 * @param isDark - Whether dark mode is enabled
 */
export const createToastConfig = (isDark: boolean): ToastConfig => ({
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: isDark ? '#10B981' : '#059669',
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        borderLeftWidth: 5,
        height: 70,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? '#FFFFFF' : '#111827',
      }}
      text2Style={{
        fontSize: 14,
        color: isDark ? '#D1D5DB' : '#6B7280',
        fontWeight: '400',
      }}
      text2NumberOfLines={2}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: isDark ? '#EF4444' : '#DC2626',
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        borderLeftWidth: 5,
        height: 70,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? '#FFFFFF' : '#111827',
      }}
      text2Style={{
        fontSize: 14,
        color: isDark ? '#D1D5DB' : '#6B7280',
        fontWeight: '400',
      }}
      text2NumberOfLines={2}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: isDark ? '#3B82F6' : '#2563EB',
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        borderLeftWidth: 5,
        height: 70,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? '#FFFFFF' : '#111827',
      }}
      text2Style={{
        fontSize: 14,
        color: isDark ? '#D1D5DB' : '#6B7280',
        fontWeight: '400',
      }}
      text2NumberOfLines={2}
    />
  ),
});
