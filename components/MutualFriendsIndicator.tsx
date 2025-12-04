import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface MutualFriendsIndicatorProps {
  count: number;
  compact?: boolean;
}

const MutualFriendsIndicator = ({ count, compact = false }: MutualFriendsIndicatorProps) => {
  const { isDark } = useTheme();

  if (count === 0) return null;

  return (
    <View
      className={`flex-row items-center ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-full`}
      style={{
        backgroundColor: isDark
          ? 'rgba(59, 130, 246, 0.15)'
          : 'rgba(59, 130, 246, 0.1)',
      }}
    >
      <Feather
        name="users"
        size={compact ? 10 : 12}
        color={isDark ? '#60A5FA' : '#3B82F6'}
        style={{ marginRight: 4 }}
      />
      <Text
        className={`font-medium ${compact ? 'text-xs' : 'text-xs'}`}
        style={{ color: isDark ? '#60A5FA' : '#3B82F6' }}
      >
        {count} mutual {count === 1 ? 'friend' : 'friends'}
      </Text>
    </View>
  );
};

export default MutualFriendsIndicator;
