import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import DriverListCard from '@/components/DriverListCard';

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

const DriversScreen = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchDrivers = useCallback(async (isRefresh = false) => {
    try {
      const currentOffset = isRefresh ? 0 : offset;

      if (isRefresh) {
        setRefreshing(true);
      } else if (currentOffset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        limit: '20',
        offset: currentOffset.toString(),
        ...(searchQuery && { search: searchQuery })
      });

      const data = await fetchAPI(`/api/drivers?${params.toString()}`);

      if (data.success) {
        if (isRefresh || currentOffset === 0) {
          setDrivers(data.drivers);
        } else {
          setDrivers(prev => [...prev, ...data.drivers]);
        }
        setHasMore(data.pagination.hasMore);
        if (!isRefresh) {
          setOffset(currentOffset + data.drivers.length);
        } else {
          setOffset(data.drivers.length);
        }
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [offset, searchQuery]);

  useEffect(() => {
    // Initial fetch on mount
    fetchDrivers(true);
  }, []);

  const handleSearch = () => {
    setOffset(0);
    setDrivers([]);
    fetchDrivers(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchDrivers();
    }
  };

  const handleRefresh = () => {
    setOffset(0);
    fetchDrivers(true);
  };

  const renderDriver = ({ item }: { item: Driver }) => (
    <DriverListCard driver={item} />
  );

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View className="flex-1 items-center justify-center px-6 py-20">
        <Ionicons
          name="people-outline"
          size={64}
          color={isDark ? '#6B7280' : '#9CA3AF'}
        />
        <Text className={`text-lg font-bold mt-4 ${styles.textPrimary}`}>
          No Drivers Found
        </Text>
        <Text className={`text-sm text-center mt-2 ${styles.textSecondary}`}>
          {searchQuery
            ? `No drivers match "${searchQuery}"`
            : 'Check back later for available drivers'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={isDark ? '#F97316' : '#EA580C'} />
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`} edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${styles.textPrimary}`}>
            Browse Drivers
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center">
          <View
            className="flex-1 flex-row items-center px-4 rounded-full"
            style={{
              backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? '#404040' : '#000000',
              height: 50,
            }}
          >
            <Ionicons name="search" size={22} color={isDark ? '#9CA3AF' : '#000000'} />
            <TextInput
              placeholder="Search by name or college..."
              placeholderTextColor={isDark ? '#6B7280' : '#6B7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              className="flex-1 ml-3 font-semibold"
              style={{
                fontSize: 16,
                color: isDark ? '#FFFFFF' : '#000000'
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setOffset(0);
                setDrivers([]);
                fetchDrivers(true);
              }}>
                <Ionicons name="close-circle" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Drivers List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#F97316' : '#EA580C'} />
          <Text className={`mt-4 ${styles.textSecondary}`}>Loading drivers...</Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          renderItem={renderDriver}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#F97316' : '#EA580C'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
};

export default DriversScreen;
