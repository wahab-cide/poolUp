import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import { useLocationStore } from '@/store';

interface TrendingRoute {
  origin: string;
  destination: string;
  rideCount: number;
  riderCount: number;
  avgOriginLat: number;
  avgOriginLng: number;
  avgDestLat: number;
  avgDestLng: number;
}

interface TrendingRoutesResponse {
  success: boolean;
  routes: TrendingRoute[];
}

const TrendingRoutes = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const router = useRouter();
  const { setDestinationLocation } = useLocationStore();
  const [routes, setRoutes] = useState<TrendingRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingRoutes();
  }, [user?.id]);

  const fetchTrendingRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;

      const params = new URLSearchParams({
        limit: '3',
        ...(collegeId && { college_id: collegeId as string })
      });

      const data: TrendingRoutesResponse = await fetchAPI(`/api/trending/routes?${params.toString()}`);

      if (data.success && data.routes) {
        setRoutes(data.routes);
      }
    } catch (err) {
      if (__DEV__) {
        console.error('Error fetching trending routes:', err);
      }
      setError('Failed to load trending routes');
    } finally {
      setLoading(false);
    }
  };

  const handleRoutePress = (route: TrendingRoute) => {
    // Set destination and navigate to search
    setDestinationLocation({
      latitude: route.avgDestLat,
      longitude: route.avgDestLng,
      address: route.destination
    });
    router.push('/search' as any);
  };

  // Don't render if loading failed or no routes
  if (error || (!loading && routes.length === 0)) {
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
    <View style={{ marginVertical: 8, paddingHorizontal: 16 }}>
      {/* Section Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000',
          marginRight: 6
        }}>
          🚗 Hot Routes
        </Text>
        <Text style={{
          fontSize: 14,
          color: isDark ? '#9CA3AF' : '#6B7280',
          fontWeight: '500'
        }}>
          This Week
        </Text>
      </View>

      {/* Routes List */}
      {routes.map((route, index) => (
        <TouchableOpacity
          key={`${route.origin}-${route.destination}`}
          onPress={() => handleRoutePress(route)}
          activeOpacity={0.7}
          style={{
            backgroundColor: isDark ? '#161616' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.08,
            shadowRadius: 8,
            elevation: 4
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Route Info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 8,
                  height: 8,
                  backgroundColor: isDark ? '#FFFFFF' : '#000000',
                  marginRight: 8
                }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#000000',
                  flex: 1
                }} numberOfLines={1}>
                  {route.origin}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 8,
                  height: 12,
                  borderWidth: 2,
                  borderColor: isDark ? '#FFFFFF' : '#000000',
                  marginRight: 8,
                  backgroundColor: 'transparent'
                }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#000000',
                  flex: 1
                }} numberOfLines={1}>
                  {route.destination}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="people"
                  size={14}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text style={{
                  fontSize: 13,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  marginLeft: 4,
                  fontWeight: '500'
                }}>
                  {route.riderCount} riders • {route.rideCount} rides
                </Text>
              </View>
            </View>

            {/* Arrow Icon */}
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? '#0D0D0D' : '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 12
            }}>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={isDark ? '#9e9e9e' : '#000000'}
              />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TrendingRoutes;
