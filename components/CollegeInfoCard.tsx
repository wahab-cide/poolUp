import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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

interface CollegeStats {
  activeUsers?: number;
  totalRides?: number;
  totalBookings?: number;
  averageRating?: number;
}

interface CollegeInfoCardProps {
  college: CollegeInfo;
  stats?: CollegeStats;
  onPress?: () => void;
  showStats?: boolean;
}

const CollegeInfoCard: React.FC<CollegeInfoCardProps> = ({
  college,
  stats,
  onPress,
  showStats = true
}) => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  const formatNumber = (num?: number): string => {
    if (!num) return '0';
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const getCollegeTypeIcon = (type: string) => {
    switch (type) {
      case 'liberal_arts':
        return 'school';
      case 'university':
        return 'library';
      case 'community_college':
        return 'people';
      default:
        return 'school';
    }
  };

  const getCollegeTypeLabel = (type: string) => {
    switch (type) {
      case 'liberal_arts':
        return 'Liberal Arts College';
      case 'university':
        return 'University';
      case 'community_college':
        return 'Community College';
      default:
        return 'College';
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      className={`${styles.card} p-4 rounded-xl`}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center mb-1">
            <Text className={`text-lg font-InterBold ${styles.textPrimary}`}>
              {college.name}
            </Text>
            {college.isElite && (
              <View className="ml-2 px-2 py-1 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7'
                }}
              >
                <Ionicons 
                  name="star" 
                  size={12} 
                  color={isDark ? "#FBBF24" : "#D97706"} 
                />
                <Text className={`ml-1 text-xs font-InterMedium`}
                  style={{ color: isDark ? '#FBBF24' : '#D97706' }}
                >
                  Elite
                </Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center mb-2">
            <Ionicons 
              name={getCollegeTypeIcon(college.type)} 
              size={14} 
              color={isDark ? "#888787" : "#6B7280"} 
            />
            <Text className={`ml-2 text-sm font-Inter ${styles.textSecondary}`}>
              {getCollegeTypeLabel(college.type)}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons 
              name="location" 
              size={14} 
              color={isDark ? "#888787" : "#6B7280"} 
            />
            <Text className={`ml-2 text-sm font-Inter ${styles.textSecondary}`}>
              {college.state}
            </Text>
            <View className="ml-3 px-2 py-1 rounded-full"
              style={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE'
              }}
            >
              <Text className={`text-xs font-InterMedium`}
                style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
              >
                {college.domain}
              </Text>
            </View>
          </View>
        </View>
        
        {onPress && (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDark ? "#888787" : "#6B7280"} 
          />
        )}
      </View>

      {/* Stats */}
      {showStats && stats && (
        <>
          <View 
            className="h-px my-3" 
            style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }}
          />
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className={`text-lg font-InterBold ${styles.textPrimary}`}>
                {formatNumber(stats.activeUsers)}
              </Text>
              <Text className={`text-xs font-Inter ${styles.textSecondary}`}>
                Students
              </Text>
            </View>
            
            <View className="items-center flex-1">
              <Text className={`text-lg font-InterBold ${styles.textPrimary}`}>
                {formatNumber(stats.totalRides)}
              </Text>
              <Text className={`text-xs font-Inter ${styles.textSecondary}`}>
                Rides
              </Text>
            </View>
            
            <View className="items-center flex-1">
              <Text className={`text-lg font-InterBold ${styles.textPrimary}`}>
                {formatNumber(stats.totalBookings)}
              </Text>
              <Text className={`text-xs font-Inter ${styles.textSecondary}`}>
                Bookings
              </Text>
            </View>
            
            {stats.averageRating && (
              <View className="items-center flex-1">
                <View className="flex-row items-center">
                  <Text className={`text-lg font-InterBold ${styles.textPrimary}`}>
                    {stats.averageRating.toFixed(1)}
                  </Text>
                  <Ionicons 
                    name="star" 
                    size={16} 
                    color={isDark ? "#FBBF24" : "#F59E0B"} 
                    style={{ marginLeft: 2 }}
                  />
                </View>
                <Text className={`text-xs font-Inter ${styles.textSecondary}`}>
                  Rating
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </CardWrapper>
  );
};

export default CollegeInfoCard;