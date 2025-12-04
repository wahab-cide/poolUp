import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ReactNativeModal } from 'react-native-modal';

export interface RecurringRideSettings {
  isRecurring: boolean;
  templateName: string;
  recurrencePattern: 'daily' | 'weekdays' | 'weekly' | 'custom';
  recurrenceDays: number[]; // 0=Sunday, 1=Monday, etc.
  activeUntil: string | null; // Date string YYYY-MM-DD
  generateRidesImmediately: boolean;
  daysToGenerate: number;
}

interface RecurringRideOptionsProps {
  settings: RecurringRideSettings;
  onSettingsChange: (settings: RecurringRideSettings) => void;
  routeDescription?: string; // e.g., "Home → Office" for template name suggestion
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

const RECURRENCE_PATTERNS = [
  {
    value: 'weekdays' as const,
    label: 'Weekdays Only',
    description: 'Monday through Friday',
    icon: 'briefcase-outline'
  },
  {
    value: 'daily' as const,
    label: 'Every Day',
    description: 'All 7 days of the week',
    icon: 'calendar-outline'
  },
  {
    value: 'weekly' as const,
    label: 'Weekly',
    description: 'Same day each week',
    icon: 'repeat-outline'
  },
  {
    value: 'custom' as const,
    label: 'Custom Days',
    description: 'Choose specific days',
    icon: 'options-outline'
  }
];

export default function RecurringRideOptions({ 
  settings, 
  onSettingsChange, 
  routeDescription 
}: RecurringRideOptionsProps) {
  const { isDark } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date());

  const updateSettings = (updates: Partial<RecurringRideSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const toggleRecurrenceDay = (day: number) => {
    const newDays = settings.recurrenceDays.includes(day)
      ? settings.recurrenceDays.filter(d => d !== day)
      : [...settings.recurrenceDays, day].sort();
    updateSettings({ recurrenceDays: newDays });
  };

  const selectRecurrencePattern = (pattern: 'daily' | 'weekdays' | 'weekly' | 'custom') => {
    let newDays: number[] = [];
    
    switch (pattern) {
      case 'weekdays':
        newDays = [1, 2, 3, 4, 5]; // Mon-Fri
        break;
      case 'daily':
        newDays = [0, 1, 2, 3, 4, 5, 6]; // All days
        break;
      case 'weekly':
        // Use current day of week as default
        newDays = [new Date().getDay()];
        break;
      case 'custom':
        newDays = []; // Let user select
        break;
    }
    
    updateSettings({ recurrencePattern: pattern, recurrenceDays: newDays });
  };

  const suggestTemplateName = () => {
    if (routeDescription) {
      const patterns = {
        'weekdays': 'Daily commute',
        'daily': 'Daily ride',
        'weekly': 'Weekly trip',
        'custom': 'Regular ride'
      };
      return `${patterns[settings.recurrencePattern]} - ${routeDescription}`;
    }
    return '';
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setSelectedEndDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      updateSettings({ activeUntil: dateString });
    }
  };

  const handleEndDateConfirm = () => {
    setShowEndDatePicker(false);
    const year = selectedEndDate.getFullYear();
    const month = String(selectedEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedEndDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    updateSettings({ activeUntil: dateString });
  };

  const handleEndDateCancel = () => {
    setShowEndDatePicker(false);
    if (settings.activeUntil) {
      const [year, month, day] = settings.activeUntil.split('-').map(Number);
      setSelectedEndDate(new Date(year, month - 1, day));
    } else {
      setSelectedEndDate(new Date());
    }
  };

  const clearEndDate = () => {
    updateSettings({ activeUntil: null });
    setSelectedEndDate(new Date());
  };

  if (!settings.isRecurring) {
    return (
      <View className="mb-6">
        <TouchableOpacity
          onPress={() => updateSettings({ isRecurring: true })}
          className={`flex-row items-center justify-between p-4 rounded-xl border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons 
              name="repeat-outline" 
              size={24} 
              color={isDark ? '#10B981' : '#059669'} 
            />
            <View className="ml-3">
              <Text className={`font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Make this a recurring ride
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Perfect for regular commutes
              </Text>
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="mb-6">
      {/* Header with toggle */}
      <TouchableOpacity
        onPress={() => updateSettings({ isRecurring: false })}
        className={`flex-row items-center justify-between p-4 rounded-xl border mb-4 ${
          isDark 
            ? 'bg-blue-900/20 border-blue-500' 
            : 'bg-blue-50 border-blue-500'
        }`}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
            <Ionicons 
              name="checkmark" 
              size={14} 
              color="white" 
            />
          </View>
          <View className="ml-3">
            <Text className={`font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Recurring ride enabled
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Tap to disable
            </Text>
          </View>
        </View>
        <Ionicons 
          name="close" 
          size={20} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
        />
      </TouchableOpacity>

      {/* Template Name */}
      <View className="mb-4">
        <Text className={`text-base font-InterSemiBold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Template Name
        </Text>
        <TextInput
          value={settings.templateName}
          onChangeText={(text) => updateSettings({ templateName: text })}
          placeholder={suggestTemplateName() || "e.g., Daily commute to office"}
          placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
          className={`p-4 rounded-xl font-Inter ${
            isDark 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-gray-50 text-gray-900 border-gray-200'
          } border`}
        />
      </View>

      {/* Recurrence Pattern */}
      <View className="mb-4">
        <Text className={`text-base font-InterSemiBold mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Repeat Schedule
        </Text>
        <View className="space-y-3">
          {RECURRENCE_PATTERNS.map((pattern) => (
            <TouchableOpacity
              key={pattern.value}
              onPress={() => selectRecurrencePattern(pattern.value)}
              className={`flex-row items-center p-4 rounded-xl border mb-3 ${
                settings.recurrencePattern === pattern.value
                  ? isDark
                    ? 'bg-blue-900/20 border-blue-500'
                    : 'bg-blue-50 border-blue-500'
                  : isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={pattern.icon as any} 
                size={22} 
                color={
                  settings.recurrencePattern === pattern.value
                    ? '#3B82F6'
                    : isDark ? '#9CA3AF' : '#6B7280'
                } 
              />
              <View className="ml-3 flex-1">
                <Text className={`font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {pattern.label}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {pattern.description}
                </Text>
              </View>
              {settings.recurrencePattern === pattern.value && (
                <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
                  <Ionicons 
                    name="checkmark" 
                    size={12} 
                    color="white" 
                  />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Days Selection */}
      {(settings.recurrencePattern === 'custom' || settings.recurrencePattern === 'weekly') && (
        <View className="mb-4">
          <Text className={`text-base font-InterSemiBold mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {settings.recurrencePattern === 'weekly' ? 'Select Day' : 'Select Days'}
          </Text>
          <View className="flex-row flex-wrap">
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.value}
                onPress={() => {
                  if (settings.recurrencePattern === 'weekly') {
                    updateSettings({ recurrenceDays: [day.value] });
                  } else {
                    toggleRecurrenceDay(day.value);
                  }
                }}
                className={`px-4 py-3 rounded-full border mr-2 mb-2 ${
                  settings.recurrenceDays.includes(day.value)
                    ? isDark
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-blue-50 border-blue-500'
                    : isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-gray-100 border-gray-300'
                }`}
                activeOpacity={0.7}
              >
                <Text className={`font-InterMedium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Advanced Options Toggle */}
      <TouchableOpacity
        onPress={() => setShowAdvanced(!showAdvanced)}
        className={`flex-row items-center justify-between p-3 rounded-lg ${
          isDark ? 'bg-gray-800' : 'bg-gray-50'
        } mb-4`}
        activeOpacity={0.7}
      >
        <Text className={`font-InterMedium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          Advanced Options
        </Text>
        <Ionicons 
          name={showAdvanced ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
        />
      </TouchableOpacity>

      {/* Advanced Options */}
      {showAdvanced && (
        <View className="space-y-6 mb-6">
          {/* End Date */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-sm font-InterSemiBold ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
                End Date (Optional)
              </Text>
              {settings.activeUntil && (
                <TouchableOpacity
                  onPress={clearEndDate}
                  className="flex-row items-center px-2 py-1 rounded-lg"
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="close" 
                    size={14} 
                    color={isDark ? '#EF4444' : '#DC2626'} 
                  />
                  <Text className={`text-xs font-InterMedium ml-1 ${
                    isDark ? 'text-red-300' : 'text-red-600'
                  }`}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                if (settings.activeUntil) {
                  const [year, month, day] = settings.activeUntil.split('-').map(Number);
                  setSelectedEndDate(new Date(year, month - 1, day));
                } else {
                  setSelectedEndDate(new Date());
                }
                setShowEndDatePicker(true);
              }}
              className={`px-4 py-4 rounded-2xl border flex-row items-center justify-between ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-gray-50/80 border-gray-100'
              }`}
              style={{
                shadowColor: isDark ? '#000' : '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.2 : 0.03,
                shadowRadius: 2,
                elevation: 1,
              }}
              activeOpacity={0.7}
            >
              <Text className={`text-base font-Inter ${
                settings.activeUntil
                  ? isDark ? 'text-gray-100' : 'text-gray-900'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {settings.activeUntil 
                  ? new Date(settings.activeUntil + 'T00:00:00').toLocaleDateString()
                  : 'Select end date (indefinite if not set)'
                }
              </Text>
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
            </TouchableOpacity>
          </View>

          {/* Days to Generate */}
          <View>
            <Text className={`text-sm font-InterSemiBold mb-3 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Generate Rides for Next {settings.daysToGenerate} Days
            </Text>
            <View className="flex-row items-center justify-center">
              <TouchableOpacity
                onPress={() => updateSettings({ daysToGenerate: Math.max(1, settings.daysToGenerate - 1) })}
                className={`w-12 h-12 rounded-2xl items-center justify-center ${
                  isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50/80 border border-gray-100'
                }`}
                activeOpacity={0.8}
                style={{
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.03,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Ionicons name="remove" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
              <View className={`mx-6 px-6 py-3 rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text className={`text-xl font-InterBold text-center ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {settings.daysToGenerate}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => updateSettings({ daysToGenerate: Math.min(30, settings.daysToGenerate + 1) })}
                className={`w-12 h-12 rounded-2xl items-center justify-center ${
                  isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50/80 border border-gray-100'
                }`}
                activeOpacity={0.8}
                style={{
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.03,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Ionicons name="add" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Summary */}
      <View className={`p-5 rounded-2xl ${
        isDark 
          ? 'bg-gray-900/50 border border-gray-800' 
          : 'bg-gray-50/80 border border-gray-100'
      }`}
        style={{
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.03,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <View className="flex-row items-center mb-3">
          <View className={`w-8 h-8 rounded-full items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Ionicons 
              name="document-text-outline" 
              size={16} 
              color={isDark ? '#9CA3AF' : '#6B7280'} 
            />
          </View>
          <Text className={`ml-3 font-InterSemiBold text-base ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Summary
          </Text>
        </View>
        <Text className={`text-sm leading-6 ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
          Your ride will be automatically posted{' '}
          <Text className="font-InterSemiBold">
            {settings.recurrencePattern === 'daily' && 'every day'}
            {settings.recurrencePattern === 'weekdays' && 'on weekdays (Mon-Fri)'}
            {settings.recurrencePattern === 'weekly' && `every ${DAYS_OF_WEEK.find(d => d.value === settings.recurrenceDays[0])?.fullLabel}`}
            {settings.recurrencePattern === 'custom' && `on ${settings.recurrenceDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}`}
          </Text>
          {settings.activeUntil ? ` until ${settings.activeUntil}` : ' indefinitely'}.
          {` ${settings.daysToGenerate} rides will be created initially.`}
        </Text>
      </View>

      {/* End Date Picker Modal */}
      {Platform.OS === 'ios' ? (
        <ReactNativeModal
          isVisible={showEndDatePicker}
          onBackdropPress={handleEndDateCancel}
          className="justify-center items-center m-0"
          backdropOpacity={0.6}
          animationIn="fadeInUp"
          animationOut="fadeOutDown"
          animationInTiming={400}
          animationOutTiming={300}
        >
          <View 
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden mx-6 w-full max-w-sm`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Header */}
            <View 
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b px-6 py-4`}
            >
              <View className="flex-row items-center justify-between">
                <TouchableOpacity onPress={handleEndDateCancel} className="py-1">
                  <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-base font-InterMedium`}>Cancel</Text>
                </TouchableOpacity>
                <Text className={`text-lg font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'}`}>End Date</Text>
                <TouchableOpacity onPress={handleEndDateConfirm} className="py-1">
                  <Text className="text-blue-500 text-base font-InterSemiBold">Done</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Date Picker */}
            <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} px-6 py-6`}>
              <DateTimePicker
                value={selectedEndDate}
                mode="date"
                display="spinner"
                onChange={handleEndDateChange}
                minimumDate={new Date()}
                style={{
                  backgroundColor: 'transparent',
                  height: 180,
                  width: '100%',
                  alignSelf: 'center',
                }}
                textColor={isDark ? '#FFFFFF' : '#1F2937'}
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor="#3B82F6"
              />
            </View>
          </View>
        </ReactNativeModal>
      ) : (
        showEndDatePicker && (
          <DateTimePicker
            value={selectedEndDate}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={new Date()}
          />
        )
      )}
    </View>
  );
}