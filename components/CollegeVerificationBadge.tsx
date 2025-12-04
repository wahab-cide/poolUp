import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

interface CollegeInfo {
  id: string;
  name: string;
  domain: string;
  type: string;
  state: string;
  isElite: boolean;
}

interface CollegeVerificationBadgeProps {
  college?: CollegeInfo;
  isVerified?: boolean;
  email?: string;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

const CollegeVerificationBadge: React.FC<CollegeVerificationBadgeProps> = ({
  college,
  isVerified = false,
  email,
  size = 'medium',
  showDetails = true
}) => {
  const { isDark } = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'py-1 px-2 rounded-md',
      text: 'text-xs',
      icon: 12,
      spacing: 'space-x-1'
    },
    medium: {
      container: 'py-2 px-3 rounded-lg',
      text: 'text-sm',
      icon: 16,
      spacing: 'space-x-2'
    },
    large: {
      container: 'py-3 px-4 rounded-xl',
      text: 'text-base',
      icon: 20,
      spacing: 'space-x-3'
    }
  };

  const config = sizeConfig[size];

  if (!isVerified || !college) {
    // Unverified state - simple alert icon and text
    return (
      <View className={`flex-row items-center ${config.spacing}`}>
        <Ionicons 
          name="alert-circle" 
          size={config.icon} 
          color={isDark ? "#F87171" : "#DC2626"} 
        />
        <Text className={`${config.text} font-InterMedium`}
          style={{ color: isDark ? '#F87171' : '#B91C1C' }}
        >
          {email ? 'College verification required' : 'Not verified'}
        </Text>
      </View>
    );
  }

  // Verified state - elegant checkmark with enhanced styling
  return (
    <View className={`flex-row items-center ${config.spacing}`}>
      <View className="relative">
        {/* Enhanced checkmark with subtle background */}
        <View 
          className="rounded-full items-center justify-center"
          style={{
            width: config.icon + 4,
            height: config.icon + 4,
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'
          }}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={config.icon} 
            color={isDark ? "#34D399" : "#059669"} 
          />
        </View>
        {/* Subtle glow effect for verified status */}
        {size !== 'small' && (
          <View 
            className="absolute rounded-full"
            style={{
              width: config.icon + 8,
              height: config.icon + 8,
              top: -2,
              left: -2,
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.05)'
            }}
          />
        )}
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className={`${config.text} font-InterSemiBold`}
            style={{ color: isDark ? '#34D399' : '#047857' }}
          >
            Verified Student
          </Text>
          {college.isElite && size !== 'small' && (
            <View className="ml-2 flex-row items-center">
              <Ionicons 
                name="star" 
                size={config.icon * 0.7} 
                color={isDark ? "#FBBF24" : "#D97706"} 
              />
              <Text className={`text-xs font-InterMedium ml-1`}
                style={{ color: isDark ? '#FBBF24' : '#D97706' }}
              >
                Elite
              </Text>
            </View>
          )}
        </View>
        
        {showDetails && size !== 'small' && (
          <Text className={`${config.text} font-Inter mt-0.5`}
            style={{ color: isDark ? '#888787' : '#6B7280' }}
          >
            {college.name}
          </Text>
        )}
      </View>
    </View>
  );
};

export default CollegeVerificationBadge;