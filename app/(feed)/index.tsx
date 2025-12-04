import { OfflineBanner } from '@/components/OfflineBanner';
import RatingModal from '@/components/RatingModal';
import RatingPromptBanner from '@/components/RatingPromptBanner';
import RideCard from '@/components/RideCard';
import SkeletonRideCard from '@/components/SkeletonRideCard';
import TrendingDriversCarousel from '@/components/TrendingDriversCarousel';
import TrendingRoutes from '@/components/TrendingRoutes';
import Map from '@/components/Map';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { useUnreadCount } from '@/contexts/UnreadCountContext';
import { fetchAPI } from '@/lib/fetch';
import { showErrorToast } from '@/lib/toast';
import { RideData, useLocationStore, useRideStore } from '@/store';
import { useUser } from '@clerk/clerk-expo';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface Ride extends RideData {
  distance_km?: number;
}

const FeedScreen = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('Getting location...');
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [ratingRefreshTrigger, setRatingRefreshTrigger] = useState<number>(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const { isConnected } = useNetwork();
  
  const router = useRouter();
  const { user } = useUser();
  const {
    userLatitude,
    userLongitude,
    userAddress,
    setUserLocation
  } = useLocationStore();
  const { refreshUnreadCount } = useUnreadCount();

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRatingData, setSelectedRatingData] = useState<any>(null);

  // Get user's location
  const getCurrentLocation = useCallback(async () => {
    try {
      if (__DEV__) console.log('Home: Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (__DEV__) console.log('Home: Permission status:', status);
      
      if (status !== 'granted') {
        if (__DEV__) console.log('Home: Location permission denied');
        setLocationStatus('Location permission denied');
        return null;
      }

      if (__DEV__) console.log('Home: Getting current location...');
      setLocationStatus('Getting your location...');
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
        maximumAge: 10000,
      });

      if (__DEV__) console.log('Home: Raw location result:', currentLocation);

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      if (__DEV__) console.log('Home: Location obtained successfully:', coords);
      setLocationStatus('Location found');

      // Set the global location store
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        setUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address[0] ? `${address[0].name}, ${address[0].region}` : 'Current Location',
        });
        
        return {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
      } catch (addressError) {
        if (__DEV__) console.warn('Home: Failed to get address, using coordinates:', addressError);
        setUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: 'Current Location',
        });
        
        return {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
      }
    } catch (error) {
      if (__DEV__) console.error('Home: Error getting location:', error);
      setLocationStatus(`Unable to get location: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }, [setUserLocation]);

  // Auto-refresh with cooldown logic
  const shouldAutoRefresh = useCallback(() => {
    const now = Date.now();
    const cooldownPeriod = 3 * 60 * 1000;
    return (now - lastRefreshTime) > cooldownPeriod;
  }, [lastRefreshTime]);

  const performAutoRefresh = useCallback(async () => {
    if (!shouldAutoRefresh() || loading || refreshing || autoRefreshing) {
      return;
    }

    if (__DEV__) console.log('Home: Performing auto-refresh...');
    setAutoRefreshing(true);
    setLastRefreshTime(Date.now());

    try {
      // Refresh unread count
      refreshUnreadCount();
      
      // Use global location store or get fresh location
      if (userLatitude && userLongitude) {
        await fetchNearbyRides();
      } else {
        const userLocation = await getCurrentLocation();
        if (userLocation) {
          await fetchNearbyRides(userLocation);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Home: Auto-refresh error:', error);
    } finally {
      setAutoRefreshing(false);
    }
  }, [shouldAutoRefresh, loading, refreshing, autoRefreshing, refreshUnreadCount, userLatitude, userLongitude, fetchNearbyRides, getCurrentLocation]);

  // Focus effect for auto-refresh when tab becomes active
  useFocusEffect(
    useCallback(() => {
      if (__DEV__) console.log('Home: Tab focused, checking if auto-refresh needed');
      performAutoRefresh();
    }, [performAutoRefresh])
  );

  // Fetch nearby rides
  const fetchNearbyRides = useCallback(async (userLocation?: { latitude: number; longitude: number }) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Skip API calls if offline
    if (!isConnected) {
      console.log('Home: Offline - skipping ride fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Use provided location or fall back to global location store
    const coords = userLocation || (userLatitude && userLongitude ? { latitude: userLatitude, longitude: userLongitude } : null);
    if (!coords) {
      if (__DEV__) console.log('Home: No location available for fetching rides');
      setLoading(false);
      return;
    }

    // Check if user is a driver to determine which type of rides to fetch
    const isDriver = user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true;
    const type = isDriver ? 'request' : 'post';
    
    try {
      if (__DEV__) console.log(`Home: Fetching nearby ${type}s...`);
      const data = await fetchAPI(
        `/api/rides/feed?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=15&clerkId=${user.id}&type=${type}`
      );
      if (__DEV__) console.log('Home: Rides feed response received');

      if (data.success) {
        // Transform API response to match RideData interface
        const transformedRides: Ride[] = data.rides.map((ride: any) => ({
          id: ride.id,
          type: ride.type,
          origin: {
            label: ride.origin_address,
            latitude: ride.origin_latitude,
            longitude: ride.origin_longitude,
          },
          destination: {
            label: ride.destination_address,
            latitude: ride.destination_latitude,
            longitude: ride.destination_longitude,
          },
          departure_time: ride.departure_time,
          price: ride.fare_price,
          seats_available: ride.seats_available,
          seats_required: ride.seats_required,
          seats_total: ride.seats_total,
          distance_from_user: ride.distance_km || 0,
          distance_km: ride.distance_km,
          driver: ride.driver ? {
            id: ride.driver.id,
            clerk_id: ride.driver.clerk_id,
            name: ride.driver.name,
            first_name: ride.driver.first_name,
            last_name: ride.driver.last_name,
            avatar_url: ride.driver.profile_image_url,
            rating: ride.driver.rating,
            vehicle: ride.car ? {
              make: ride.car.make,
              model: ride.car.model,
              year: ride.car.year,
              color: ride.car.color,
              plate: ride.car.plate,
            } : {
              make: 'Unknown',
              model: 'Vehicle',
              year: new Date().getFullYear(),
              color: 'Gray',
              plate: 'N/A',
            }
          } : {
            id: '',
            name: 'Looking for Driver',
            first_name: 'Looking',
            last_name: 'for Driver',
            avatar_url: '',
            rating: 0,
            vehicle: {
              make: '',
              model: '',
              year: new Date().getFullYear(),
              color: '',
              plate: ''
            }
          }
        }));

        setRides(transformedRides);
        if (__DEV__) console.log(`Home: Loaded ${transformedRides.length} nearby rides`);
      } else {
        if (__DEV__) console.error('Home: Failed to fetch rides:', data.error);
        if (data.error !== 'User not found') {
          showErrorToast(data.error || 'Failed to fetch nearby rides', 'Error');
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Home: Error fetching nearby rides:', error);
      // Only show error toast if we're online
      if (isConnected) {
        showErrorToast('Failed to fetch nearby rides', 'Error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, userLatitude, userLongitude, isConnected]);


  // Initialize location and fetch rides
  useEffect(() => {
    const initialize = async () => {
      if (__DEV__) console.log('Home: Starting initialization...');
      
      // Check if we already have location from global store
      if (userLatitude && userLongitude) {
        if (__DEV__) console.log('Home: Using existing location from store');
        await fetchNearbyRides();
        return;
      }
      
      // Get fresh location if not available
      const userLocation = await getCurrentLocation();
      if (__DEV__) console.log('Home: Location result:', userLocation);
      if (userLocation) {
        await fetchNearbyRides(userLocation);
      } else {
        if (__DEV__) console.log('Home: No location obtained, stopping load');
        setLoading(false);
      }
    };

    if (user?.id) {
      initialize();
    } else {
      if (__DEV__) console.log('Home: No user ID available');
      setLoading(false);
    }
  }, [user?.id, userLatitude, userLongitude, fetchNearbyRides, getCurrentLocation]);


  // Manual refresh handler (pull-to-refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    setLastRefreshTime(Date.now());
    
    // Refresh unread count
    refreshUnreadCount();
    
    // Use global location store or get fresh location
    if (userLatitude && userLongitude) {
      await fetchNearbyRides();
    } else {
      const userLocation = await getCurrentLocation();
      if (userLocation) {
        await fetchNearbyRides(userLocation);
      } else {
        setRefreshing(false);
      }
    }
  };

  // Handle ride card press
  const handleRidePress = (rideId: string) => {
    const selectedRide = rides.find(ride => ride.id === rideId);
    
    if (!selectedRide) {
      if (__DEV__) console.log('Home: Ride not found:', rideId);
      return;
    }

    const isDriver = user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true;
    
    if (selectedRide.type === 'request' && isDriver) {
      // Driver viewing a request - navigate to offer ride page
      if (__DEV__) console.log('Home: Driver viewing request, navigating to offer ride');
      router.push(`/(root)/offer-ride?rideId=${rideId}`);
    } else if (selectedRide.type === 'post' && !isDriver) {
      // Rider viewing a post - navigate directly to booking page
      if (__DEV__) console.log('Home: Rider viewing post, navigating directly to book-ride');
      
      // Set the selected ride in the store
      const { setRides, setSelectedRide } = useRideStore.getState();
      
      setRides([selectedRide]); // Set only this ride as the "search result"
      setSelectedRide(rideId);
      
      // Navigate directly to book-ride page since user already selected the ride
      router.push('/(root)/book-ride');
    } else {
      if (__DEV__) console.log('Home: Invalid ride type or user role combination');
    }
  };

  // Handle post button press with driver verification
  const handlePostPress = () => {
    // Check if user is a verified driver (check both metadata sources)
    if (user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true) {
      // User is a verified driver, go to post-ride
      router.push('/post-ride' as any);
    } else {
      // User is not a driver, send to verification
      router.push('/(feed)/verify-driver' as any);
    }
  };

  // Rating handlers
  const handleRatingPress = (ratingData: any) => {
    setSelectedRatingData(ratingData);
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => {
    // Refresh any relevant data if needed
    if (__DEV__) console.log('Rating submitted successfully');
    // Trigger RatingPromptBanner refresh to remove the completed rating
    setRatingRefreshTrigger(Date.now());
  };

  // Filter chips configuration
  const filterOptions = [
    { id: 'all', label: 'All Rides' },
    { id: 'airport', label: 'To Airport' },
    { id: 'grocery', label: 'Grocery Run' },
    { id: 'break', label: 'Break Trip' },
  ];

  // Filter rides based on selected filter
  const filteredRides = rides.filter(ride => {
    if (selectedFilter === 'all') return true;
    
    const destination = ride.destination.label.toLowerCase();
    const origin = ride.origin.label.toLowerCase();
    const combinedLocation = `${origin} ${destination}`;
    
    switch(selectedFilter) {
      case 'airport':
        return combinedLocation.includes('airport') || 
               combinedLocation.includes('jfk') || 
               combinedLocation.includes('lga') || 
               combinedLocation.includes('ewr') ||
               combinedLocation.includes('logan');
      case 'grocery':
        return combinedLocation.includes('grocery') || 
               combinedLocation.includes('walmart') || 
               combinedLocation.includes('target') ||
               combinedLocation.includes('whole foods') ||
               combinedLocation.includes('trader joe');
      case 'break':
        return combinedLocation.includes('home') ||
               combinedLocation.includes('break') ||
               destination.length > 50; // Longer destinations usually mean longer trips
      default:
        return true;
    }
  });

  const renderRideCard = ({ item }: { item: Ride }) => {
    return (
      <RideCard
        ride={item}
        variant="feed"
        onPress={handleRidePress}
        showDistance={true}
        showOrigin={true}
        showDestination={true}
      />
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <OfflineBanner />

      {/* Top Navigation Tabs */}
      <View style={{
        marginTop: isConnected ? 0 : 70,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}>
          {/* Rides Tab */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 20,
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: 2,
              borderColor: '#9e9e9e',
            }}
          >
            <Feather name="navigation" size={16} color="#9e9e9e" style={{ marginRight: 6 }} />
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#9e9e9e',
            }}>
              Rides
            </Text>
          </TouchableOpacity>

          {/* Crews Tab */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(root)/crews');
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 20,
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Feather name="users" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} style={{ marginRight: 6 }} />
            <Text style={{
              fontSize: 15,
              fontWeight: '500',
              color: isDark ? '#9CA3AF' : '#6B7280',
            }}>
              Crews
            </Text>
          </TouchableOpacity>

          {/* Events Tab */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(root)/events');
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 20,
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Feather name="calendar" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} style={{ marginRight: 6 }} />
            <Text style={{
              fontSize: 15,
              fontWeight: '500',
              color: isDark ? '#9CA3AF' : '#6B7280',
            }}>
              Events
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center justify-between px-4 pt-4 h-[80px]" style={{
        backgroundColor: 'transparent',
      }}>
        <View className="flex-row items-center">
        </View>
        {/* Search Bar - Only show for riders */}
        {!(user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true) ? (
          <TouchableOpacity
            className="flex-1 flex-row items-center rounded-full px-5 h-16 mx-3"
            style={{
              backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? '#404040' : '#000000',
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.25 : 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4
            }}
            onPress={() => router.push('/search' as any)}
            activeOpacity={0.7}
          >
            <Feather name="search" size={24} color={isDark ? '#9CA3AF' : '#000000'} style={{ marginRight: 14 }} />
            <Text className="flex-1 font-bold" style={{ color: isDark ? '#9CA3AF' : '#000000', fontSize: 20 }}>
              Where to?
            </Text>
          </TouchableOpacity>
        ) : (
          /* Post Button - Only show for drivers */
          <TouchableOpacity
            className="flex-row items-center rounded-full px-4 h-11"
            style={{
              backgroundColor: isDark ? '#FFFFFF' : '#9e9e9e',
              minWidth: 80,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6
            }}
            onPress={handlePostPress}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={18} color={isDark ? '#000000' : '#FFFFFF'} style={{ marginRight: 6 }} />
            <Text className={`text-sm font-bold ${isDark ? 'text-black' : 'text-white'}`}>Post</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Location Status - Show when location is unavailable */}
      {!userLatitude && !userLongitude && locationStatus && (
        <View className="mx-4 mb-3 rounded-xl overflow-hidden"
          style={{
            backgroundColor: isDark ? '#161616' : '#F9FAFB',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE'
          }}
        >
          <View className="px-4 py-3 flex-row items-center">
            <Ionicons
              name={locationStatus.includes('denied') || locationStatus.includes('Unable')
                ? "alert-circle-outline"
                : "information-circle-outline"}
              size={20}
              color={isDark ? '#60A5FA' : '#3B82F6'}
              style={{ marginRight: 12 }}
            />
            <Text className="flex-1 text-sm font-medium"
              style={{
                color: isDark ? '#D1D5DB' : '#6B7280',
                lineHeight: 20
              }}
            >
              {locationStatus}
              {locationStatus.includes('denied') && '\nTap "Enable Location" below to retry'}
            </Text>
          </View>
        </View>
      )}

      {user?.id && (
        <RatingPromptBanner
          userClerkId={user.id}
          onRatingPress={handleRatingPress}
          refreshTrigger={ratingRefreshTrigger}
        />
      )}

      {/* Filter Chips - Only show for riders */}
      {!loading && rides.length > 0 && !(user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true) && (
        <View style={{ height: 56, marginBottom: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}
            style={{ flexGrow: 0 }}
          >
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  marginRight: 10,
                  borderRadius: 12,
                  backgroundColor: selectedFilter === filter.id
                    ? (isDark ? '#9e9e9e' : '#9e9e9e')
                    : (isDark ? '#1A1A1A' : '#F3F4F6'),
                  borderWidth: 1,
                  borderColor: selectedFilter === filter.id
                    ? (isDark ? '#9e9e9e' : '#9e9e9e')
                    : (isDark ? '#2A2A2A' : '#E5E7EB'),
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 36,
                  justifyContent: 'center',
                }}
              >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: selectedFilter === filter.id ? '700' : '600',
                  color: selectedFilter === filter.id
                    ? '#FFFFFF'
                    : (isDark ? '#9CA3AF' : '#4B5563'),
                  letterSpacing: -0.2
                }}
              >
                {filter.label}
              </Text>
              {selectedFilter === filter.id && filteredRides.length > 0 && (
                <View
                  style={{
                    marginLeft: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>
                    {filteredRides.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>
      )}

      {/* Trending Sections - Show when not loading and has rides */}
      {!loading && rides.length > 0 && (
        <>
          <TrendingDriversCarousel />
          <TrendingRoutes />
        </>
      )}

      {/* Browse Drivers Button - Only show for riders (non-drivers) */}
      {!loading && !(user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true) && (
        <TouchableOpacity
          onPress={() => router.push('/(root)/drivers')}
          activeOpacity={0.98}
          style={{
            backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginHorizontal: 12,
            marginBottom: 8,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: isDark ? 8 : 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: isDark ? 4 : 2,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="people"
                  size={20}
                  color={isDark ? '#909090' : '#000000'}
                />
                <Text
                  className="ml-2 text-base font-bold"
                  style={{ color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.2 }}
                >
                  Browse Drivers
                </Text>
              </View>
              <Text
                className="text-sm font-medium"
                style={{ color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 18 }}
              >
                Find verified drivers and request rides directly
              </Text>
            </View>
            <Ionicons
              name="arrow-forward-circle"
              size={28}
              color={isDark ? '#909090' : '#000000'}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Map View - Show user's current location */}
      {!loading && userLatitude && userLongitude && (
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 16,
            borderRadius: 16,
            overflow: 'hidden',
            height: 200,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
          }}
        >
          <Map showUserLocation={true} />
        </View>
      )}

      {(user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true) && !loading && (
        <View className="px-5 pb-3">
          <Text className="text-xl font-bold mb-1.5" style={{ color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.3 }}>
            Nearby Ride Requests
          </Text>
          <Text className="text-sm font-medium" style={{ color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 20 }}>
            Passengers looking for rides • Tap to offer a ride
          </Text>
        </View>
      )}

      {!(user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true) && !loading && (
        <View className="px-5 pb-3">
          <Text className="text-xl font-bold mb-1.5" style={{ color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.3 }}>
            Available Rides
          </Text>
          <Text className="text-sm font-medium" style={{ color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 20 }}>
            Rides from verified drivers • Tap to book a seat
          </Text>
        </View>
      )}

      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 120 }}
        >
          {/* Show 3 skeleton cards while loading */}
          <SkeletonRideCard />
          <SkeletonRideCard />
          <SkeletonRideCard />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          renderItem={renderRideCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#9e9e9e']}
              tintColor="#9e9e9e"
              title="Pull to refresh"
              titleColor="#6B7280"
            />
          }
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center px-6 py-14">
              {/* Empty State Image */}
              <Image
                source={require('@/assets/images/feed-null-res.png')}
                style={{ width: 180, height: 180, marginBottom: 20 }}
                resizeMode="contain"
              />

              <View className="items-center px-6">
                <Text className="text-3xl font-bold mb-4" style={{
                  color: isDark ? '#FFFFFF' : '#111827',
                  letterSpacing: -0.6
                }}>
                  {userLatitude && userLongitude
                    ? (user?.publicMetadata?.is_driver || user?.unsafeMetadata?.is_driver ? 'No ride requests' : 'No rides available')
                    : 'Enable location'
                  }
                </Text>

                {/* Descriptive text - Only show for riders or when location/internet is disabled */}
                {(!(user?.publicMetadata?.is_driver || user?.unsafeMetadata?.is_driver) || !userLatitude || !userLongitude || !isConnected) && (
                  <Text className="text-center mb-10 leading-7 px-2" style={{
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    fontSize: 16,
                    lineHeight: 26,
                    fontWeight: '500'
                  }}>
                    {!isConnected
                      ? 'Connect to the internet to see available rides and make bookings.'
                      : userLatitude && userLongitude
                      ? 'Send ride requeste directly to drivers or Post ride request to get offers from nearby drivers.'
                      : 'Enable location to discover rides near you'
                    }
                  </Text>
                )}

                {isConnected && userLatitude && userLongitude && !(user?.publicMetadata?.is_driver || user?.unsafeMetadata?.is_driver) && (
                  <TouchableOpacity
                    onPress={() => router.push('/post-ride?mode=request')}
                    activeOpacity={0.9}
                    style={{
                      backgroundColor: isDark ? '#909090' : '#000000',
                      paddingHorizontal: 28,
                      paddingVertical: 16,
                      borderRadius: 12,
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 8,
                      borderWidth: 0,
                      borderColor: 'transparent'
                    }}
                  >
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '600',
                      letterSpacing: -0.2
                    }}>
                      Post A Request
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {!userLatitude && !userLongitude ? (
                <TouchableOpacity
                  onPress={async () => {
                    setLoading(true);
                    const userLocation = await getCurrentLocation();
                    if (userLocation) {
                      await fetchNearbyRides(userLocation);
                    } else {
                      setLoading(false);
                    }
                  }}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: '#3B82F6',
                    paddingHorizontal: 32,
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#3B82F6',
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8
                  }}
                >
                  <Ionicons name="location" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold" style={{ fontSize: 16, letterSpacing: -0.2 }}>
                    Enable Location
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="items-center">
                  {isConnected && (user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true) && (
                    <TouchableOpacity
                      onPress={handlePostPress}
                      activeOpacity={0.9}
                      style={{
                        backgroundColor: isDark ? '#909090' : '#000000',
                        paddingHorizontal: 28,
                        paddingVertical: 16,
                        borderRadius: 12,
                        shadowColor: '#000',
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        shadowOffset: { width: 0, height: 8 },
                        elevation: 8,
                        borderWidth: 0,
                        borderColor: 'transparent'
                      }}
                    >
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 16,
                        fontWeight: '600',
                        letterSpacing: -0.2
                      }}>
                        Post A Ride
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <View className="mt-6 flex-row items-center">
                    <Feather name="arrow-down" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
                    <Text className="ml-2 text-base font-medium" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                      Pull down to refresh
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Rating Modal */}
      {selectedRatingData && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedRatingData(null);
          }}
          onSuccess={handleRatingSuccess}
          bookingId={selectedRatingData.bookingId}
          ratedUserId={selectedRatingData.ratedUserId}
          ratedUserName={selectedRatingData.ratedUserName}
          ratedUserAvatar={selectedRatingData.ratedUserAvatar}
          ratingType={selectedRatingData.ratingType}
          rideDetails={{
            from: selectedRatingData.fromLocation,
            to: selectedRatingData.toLocation,
            departureTime: selectedRatingData.departureTime
          }}
          userClerkId={user?.id || ''}
        />
      )}
    </SafeAreaView>
  );
};

export default FeedScreen;