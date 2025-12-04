import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import { formatUserName, getUserInitials } from '@/lib/utils';
import { shareRide } from '@/lib/shareUtils';
import CustomButton from '@/components/CustomButton';
import { useUser } from '@clerk/clerk-expo';
import { icons } from '@/constants';

interface RideDetails {
  id: string;
  driver: {
    id: string;
    name: string;
    avatar_url?: string;
    rating: number;
    total_rides?: number;
    verification_status?: string;
  };
  origin: {
    label: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    label: string;
    latitude: number;
    longitude: number;
  };
  departure_time: string;
  price_per_seat: number;
  seats_available: number;
  seats_total: number;
  fare_splitting_enabled: boolean;
  ride_type?: string;
  description?: string;
  status: string;
}

export default function PublicRidePage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      const response = await fetchAPI(`/api/ride/public/${id}`);
      if (response.success && response.ride) {
        setRide(response.ride);
      } else {
        Alert.alert('Error', 'Ride not found or no longer available');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      Alert.alert('Error', 'Failed to load ride details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleBookRide = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to book this ride.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') }
        ]
      );
      return;
    }
    // Navigate to booking flow
    router.push(`/(root)/confirm-ride?rideId=${id}`);
  };

  const handleShare = async () => {
    if (!ride) return;
    setSharing(true);
    await shareRide(ride);
    setSharing(false);
  };


  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-4 ${styles.textSecondary}`}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="alert-circle" size={64} color={isDark ? '#EF4444' : '#DC2626'} />
          <Text className={`text-xl font-semibold mt-4 ${styles.textPrimary}`}>
            Ride Not Found
          </Text>
          <Text className={`text-center mt-2 ${styles.textSecondary}`}>
            This ride may have been cancelled or is no longer available.
          </Text>
          <CustomButton
            title="Go Back"
            onPress={() => router.back()}
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  const isAvailable = ride.seats_available > 0 && ride.status === 'open';

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" 
           style={{ borderBottomColor: isDark ? '#374151' : '#E5E7EB' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
          Ride Details
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={handleShare} className="p-2" disabled={sharing}>
            {sharing ? (
              <ActivityIndicator size="small" color={isDark ? '#9CA3AF' : '#6B7280'} />
            ) : (
              <Feather name="share-2" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Route Section */}
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            {ride.origin.label.split(',')[0]} → {ride.destination.label.split(',')[0]}
          </Text>

          {/* Date & Time */}
          <View className="flex-row items-center mb-4">
            <Feather name="calendar" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className="ml-2 text-base" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
              {formatDate(ride.departure_time)}
            </Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Feather name="clock" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className="ml-2 text-base" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
              Departure: {formatTime(ride.departure_time)}
            </Text>
          </View>

          {/* Full Route */}
          <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
            <View className="flex-row items-start mb-3">
              <Image source={icons.point} className="w-4 h-4 mt-1" tintColor="#F97316" />
              <View className="ml-3 flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  PICKUP
                </Text>
                <Text className="text-base" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  {ride.origin.label}
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <Image source={icons.to} className="w-4 h-4 mt-1" tintColor="#EF4444" />
              <View className="ml-3 flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  DROP-OFF
                </Text>
                <Text className="text-base" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  {ride.destination.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Driver Section */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-semibold mb-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Your Driver
          </Text>
          
          <View className="flex-row items-center p-4 rounded-xl" 
               style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                       borderWidth: 1, 
                       borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <View className="w-16 h-16 rounded-full overflow-hidden mr-4" 
                 style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }}>
              {ride.driver.avatar_url ? (
                <Image source={{ uri: ride.driver.avatar_url }} className="w-16 h-16" />
              ) : (
                <View className="w-16 h-16 items-center justify-center">
                  <Text className="text-xl font-bold" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    {getUserInitials(ride.driver.name)}
                  </Text>
                </View>
              )}
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-lg font-semibold mr-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  {formatUserName(ride.driver, 'first')}
                </Text>
                {ride.driver.verification_status === 'verified' && (
                  <Feather name="check-circle" size={16} color="#3B82F6" />
                )}
              </View>
              
              <View className="flex-row items-center">
                <Feather name="star" size={14} color="#F59E0B" />
                <Text className="ml-1 text-sm" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                  {ride.driver.rating.toFixed(1)}
                </Text>
                {ride.driver.total_rides && (
                  <Text className="ml-2 text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    • {ride.driver.total_rides} rides
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Pricing & Availability */}
        <View className="px-4 pb-6">
          <View className="flex-row justify-between items-center p-4 rounded-xl"
               style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                       borderWidth: 1,
                       borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            <View>
              <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Price per seat
              </Text>
              <Text className="text-2xl font-bold" style={{ color: '#F97316' }}>
                ${ride.price_per_seat}
              </Text>
              {ride.fare_splitting_enabled && (
                <View className="mt-2 px-2 py-1 rounded-full" 
                     style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE' }}>
                  <Text className="text-xs font-medium" style={{ color: isDark ? '#F97316' : '#C2410C' }}>
                    Fare Splitting Available
                  </Text>
                </View>
              )}
            </View>
            
            <View className="items-end">
              <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Seats available
              </Text>
              <Text className={`text-2xl font-bold ${
                ride.seats_available > 0 ? 'text-orange-500' : 'text-red-500'
              }`}>
                {ride.seats_available}/{ride.seats_total}
              </Text>
            </View>
          </View>
        </View>

        {/* Description if available */}
        {ride.description && (
          <View className="px-4 pb-6">
            <Text className="text-lg font-semibold mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              About this ride
            </Text>
            <Text className="text-base leading-6" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
              {ride.description}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="px-4 py-4 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
        {isAvailable ? (
          <CustomButton
            title={user ? "Book This Ride" : "Sign In to Book"}
            onPress={handleBookRide}
            className="w-full"
            bgVariant="success"
          />
        ) : (
          <View className="items-center py-3">
            <Text className="text-base font-medium" style={{ color: isDark ? '#EF4444' : '#DC2626' }}>
              {ride.seats_available === 0 ? 'This ride is fully booked' : 'This ride is no longer available'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}