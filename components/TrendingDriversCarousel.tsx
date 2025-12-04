import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import DriverListCard from '@/components/DriverListCard';

interface TrendingDriver {
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
  ridesThisWeek?: number;
}

interface TrendingDriversResponse {
  success: boolean;
  drivers: TrendingDriver[];
}

const TrendingDriversCarousel = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [drivers, setDrivers] = useState<TrendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingDrivers();
  }, [user?.id]);

  const fetchTrendingDrivers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's college ID from metadata if available
      const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;

      const params = new URLSearchParams({
        limit: '5',
        ...(collegeId && { college_id: collegeId as string })
      });

      const data: TrendingDriversResponse = await fetchAPI(`/api/trending/drivers?${params.toString()}`);

      if (data.success && data.drivers) {
        setDrivers(data.drivers);
      }
    } catch (err) {
      if (__DEV__) {
        console.error('Error fetching trending drivers:', err);
      }
      setError('Failed to load trending drivers');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if loading failed or no drivers
  if (error || (!loading && drivers.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <View style={{
        paddingVertical: 16,
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
        <ActivityIndicator size="small" color={isDark ? '#9e9e9e' : '#000000'} />
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 12 }}>
      {/* Section Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000',
          marginRight: 6
        }}>
          🔥 Trending Drivers
        </Text>
        <Text style={{
          fontSize: 14,
          color: isDark ? '#9CA3AF' : '#6B7280',
          fontWeight: '500'
        }}>
          This Week
        </Text>
      </View>

      {/* Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        style={{ flexGrow: 0 }}
      >
        {drivers.map((driver, index) => (
          <View
            key={driver.id}
            style={{
              marginHorizontal: 4,
              width: 160
            }}
          >
            <DriverListCard driver={driver} variant="compact" />
            {driver.ridesThisWeek !== undefined && driver.ridesThisWeek > 0 && (
              <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: isDark ? '#F97316' : '#EA580C',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: '600'
                }}>
                  {driver.ridesThisWeek} rides
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default TrendingDriversCarousel;
