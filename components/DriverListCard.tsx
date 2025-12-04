import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface Driver {
  id: string;
  clerkId: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  bio: string | null;
  memberSince: string;
  college: {
    name: string | null;
    verified: boolean;
  };
  stats: {
    totalRides: number;
    completionRate: number;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    displayName: string;
  } | null;
}

interface DriverListCardProps {
  driver: Driver;
  variant?: 'default' | 'compact';
}

const DriverListCard: React.FC<DriverListCardProps> = ({ driver, variant = 'default' }) => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();

  const handlePress = () => {
    // Pass driver data as params to avoid API call and show correct avatar
    router.push({
      pathname: `/(root)/driver-profile/${driver.clerkId}`,
      params: {
        driverName: driver.name,
        driverAvatar: driver.avatarUrl || '',
        driverRating: driver.rating.toString(),
        driverBio: driver.bio || '',
        collegeName: driver.college.name || '',
        collegeVerified: driver.college.verified.toString(),
        memberSince: driver.memberSince || '',
        totalRides: driver.stats.totalRides.toString(),
        completionRate: driver.stats.completionRate.toString(),
        vehicleMake: driver.vehicle?.make || '',
        vehicleModel: driver.vehicle?.model || '',
        vehicleYear: driver.vehicle?.year?.toString() || '',
        vehicleColor: driver.vehicle?.color || '',
        vehiclePlate: '',
      }
    });
  };

  if (variant === 'compact') {
    // Compact version for horizontal scroll
    return (
      <TouchableOpacity
        onPress={handlePress}
        className={`${styles.card} rounded-xl p-4 mr-3 w-40`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        <View className="items-center">
          <View className="w-16 h-16 rounded-full overflow-hidden mb-2">
            {driver.avatarUrl ? (
              <Image
                source={{ uri: driver.avatarUrl }}
                className="w-16 h-16"
                style={{ resizeMode: 'cover' }}
              />
            ) : (
              <View
                className="w-16 h-16 items-center justify-center"
                style={{ backgroundColor: isDark ? '#333' : '#909090' }}
              >
                <Text className="text-white font-bold text-xl">
                  {driver.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>

          <Text className={`text-sm font-bold text-center mb-1 ${styles.textPrimary}`} numberOfLines={1}>
            {driver.name}
          </Text>

          <View className="flex-row items-center mb-2">
            <Ionicons name="star" size={12} color={isDark ? '#FBBF24' : '#F59E0B'} />
            <Text className={`text-xs ml-1 ${styles.textSecondary}`}>
              {Number(driver.rating || 0).toFixed(1)}
            </Text>
          </View>

          {driver.college.verified && (
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={10} color={isDark ? '#10B981' : '#059669'} />
              <Text className={`text-xs ml-1 ${styles.textSecondary}`} numberOfLines={1}>
                Verified
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Default version for list view
  return (
    <TouchableOpacity
      onPress={handlePress}
      className="rounded-2xl p-5 mb-4 mx-4"
      style={{
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 6
      }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Avatar */}
        <View className="mr-3.5">
          <View className="w-16 h-16 rounded-full overflow-hidden">
            {driver.avatarUrl ? (
              <Image
                source={{ uri: driver.avatarUrl }}
                className="w-16 h-16"
                style={{ resizeMode: 'cover' }}
              />
            ) : (
              <View
                className="w-16 h-16 items-center justify-center"
                style={{
                  backgroundColor: isDark ? '#333' : '#909090'
                }}
              >
                <Text className="text-white font-bold text-xl">
                  {driver.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          {/* Verified Badge */}
          {driver.college.verified && (
            <View
              className="absolute -bottom-1 -right-1 rounded-full p-1.5"
              style={{ backgroundColor: '#4CAF50' }}
            >
              <Ionicons name="shield-checkmark" size={14} color="white" />
            </View>
          )}
        </View>

        {/* Main Info */}
        <View className="flex-1">
          {/* Name and Rating */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className={`text-lg font-bold ${styles.textPrimary} flex-1`} numberOfLines={1}>
              {driver.name}
            </Text>
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full ml-2"
              style={{ backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}
            >
              <Ionicons name="star" size={14} color={isDark ? '#FF9800' : '#FFA726'} />
              <Text className={`text-sm font-bold ml-1`} style={{ color: isDark ? '#FF9800' : '#F57C00' }}>
                {Number(driver.rating || 0).toFixed(1)}
              </Text>
            </View>
          </View>

          {/* College */}
          {driver.college.name && (
            <View className="flex-row items-center mb-3">
              <Ionicons
                name="school"
                size={14}
                color="#03A9F4"
                style={{ marginRight: 6 }}
              />
              <View
                className="px-2 py-1 rounded-md"
                style={{ backgroundColor: isDark ? '#333' : 'transparent' }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: isDark ? '#ddd' : '#2563EB' }}
                  numberOfLines={1}
                >
                  {driver.college.name}
                </Text>
              </View>
            </View>
          )}

          {/* Bio Preview */}
          {driver.bio && (
            <Text
              className={`text-sm mb-3 ${styles.textSecondary}`}
              numberOfLines={2}
              style={{ lineHeight: 18 }}
            >
              {driver.bio}
            </Text>
          )}

          {/* Vehicle Info Card */}
          {driver.vehicle && (
            <View
              className="rounded-lg p-2.5 mb-3"
              style={{
                backgroundColor: isDark ? '#333' : '#FAFAFA',
                borderWidth: 1,
                borderColor: isDark ? '#909090' : '#EEEEEE'
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="car-sport" size={16} color="#FF9800" style={{ marginRight: 10 }} />
                <View className="flex-1">
                  <Text className={`text-sm font-semibold ${styles.textPrimary}`}>
                    {driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}
                  </Text>
                  <Text className={`text-xs ${styles.textSecondary}`}>
                    {driver.vehicle.color}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Stats Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="px-2.5 py-1.5 rounded-md flex-row items-center mr-2"
                style={{ backgroundColor: isDark ? '#333' : '#FAFAFA' }}
              >
                <Ionicons name="car" size={12} color="#2196F3" />
                <Text
                  className="text-xs font-medium ml-1"
                  style={{ color: isDark ? '#9e9e9e' : '#6B7280' }}
                >
                  {driver.stats.totalRides} rides
                </Text>
              </View>

              {driver.stats.completionRate > 0 && (
                <View
                  className="px-2.5 py-1.5 rounded-md flex-row items-center"
                  style={{ backgroundColor: isDark ? '#333' : '#FAFAFA' }}
                >
                  <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                  <Text
                    className="text-xs font-medium ml-1"
                    style={{ color: isDark ? '#9e9e9e' : '#6B7280' }}
                  >
                    {driver.stats.completionRate}%
                  </Text>
                </View>
              )}
            </View>

            {/* View Arrow */}
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? '#333' : '#E3F2FD' }}
            >
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#FF9800' : '#1976D2'} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DriverListCard;
