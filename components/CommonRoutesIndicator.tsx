import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface CommonRoutesIndicatorProps {
  routeLabel?: string; // e.g., "Boston → NYC"
  compact?: boolean;
}

const CommonRoutesIndicator = ({ routeLabel, compact = false }: CommonRoutesIndicatorProps) => {
  const { isDark } = useTheme();

  if (!routeLabel) return null;

  return (
    <View
      className={`flex-row items-center ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-full`}
      style={{
        backgroundColor: isDark
          ? 'rgba(16, 185, 129, 0.15)'
          : 'rgba(16, 185, 129, 0.1)',
      }}
    >
      <Feather
        name="map-pin"
        size={compact ? 10 : 12}
        color={isDark ? '#34D399' : '#10B981'}
        style={{ marginRight: 4 }}
      />
      <Text
        className={`font-medium ${compact ? 'text-xs' : 'text-xs'}`}
        style={{ color: isDark ? '#34D399' : '#10B981' }}
        numberOfLines={1}
      >
        {routeLabel}
      </Text>
    </View>
  );
};

export default CommonRoutesIndicator;
