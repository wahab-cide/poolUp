import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import CustomButton from '@/components/CustomButton';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RideRequest {
  rideId: string;
  type: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime?: string;
  pricePerSeat: number;
  currency: string;
  rideStatus: string;
  coordinates: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
  };
  capacity: {
    total: number;
    required: number;
  };
}

const OfferRidePage = () => {
  const { user } = useUser();
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState(false);

  useEffect(() => {
    if (rideId) {
      fetchRideRequest();
    }
  }, [rideId]);

  const fetchRideRequest = async () => {
    console.log('FetchRideRequest: Starting fetch for rideId:', rideId);
    
    try {
      console.log('FetchRideRequest: Making API call to /api/rides/' + rideId + '/details');
      const response = await fetchAPI(`/api/rides/${rideId}/details`);
      
      console.log('FetchRideRequest: API response:', response);
      
      if (response.success) {
        console.log('FetchRideRequest: Ride type:', response.ride.type);
        
        if (response.ride.type !== 'request') {
          console.error('FetchRideRequest: Not a request, type is:', response.ride.type);
          Alert.alert('Error', 'This is not a ride request.');
          router.back();
          return;
        }
        
        console.log('FetchRideRequest: Setting ride request data');
        setRideRequest(response.ride);
      } else {
        console.error('FetchRideRequest: API returned error:', response.error);
        Alert.alert('Error', response.error || 'Failed to load ride request');
        router.back();
      }
    } catch (error) {
      console.error('FetchRideRequest: Exception occurred:', error);
      console.error('FetchRideRequest: Error message:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load ride request');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleOfferRide = async () => {
    console.log('OfferRide: Starting offer process for rideId:', rideId);
    console.log('OfferRide: User ID:', user?.id);
    
    if (!user?.id) {
      console.error('OfferRide: No user ID available');
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!rideId) {
      console.error('OfferRide: No ride ID available');
      Alert.alert('Error', 'Invalid ride request');
      return;
    }

    setOffering(true);
    try {
      console.log('OfferRide: Making API call to /api/rides/' + rideId + '/offer');
      
      // Temporarily use raw fetch again to see the actual server response
      const apiUrl = `https://loop-api-gilt.vercel.app/api/rides/${rideId}/offer`;
      console.log('OfferRide: Full API URL:', apiUrl);
      
      const rawResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
        }),
      });

      console.log('OfferRide: Raw response status:', rawResponse.status);
      console.log('OfferRide: Raw response ok:', rawResponse.ok);
      
      const responseText = await rawResponse.text();
      console.log('OfferRide: Raw response text:', responseText);
      
      let response;
      try {
        response = JSON.parse(responseText);
      } catch (parseError) {
        console.error('OfferRide: Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      console.log('OfferRide: Parsed response:', response);

      if (response.success) {
        console.log('OfferRide: Successfully offered ride');
        console.log('OfferRide: Response details:', response);
        Alert.alert(
          'Success! 🎉',
          'You\'ve successfully offered to fulfill this ride request! The rider will be notified and can complete payment to confirm.',
          [
            {
              text: 'View My Posts',
              onPress: () => router.push('/(root)/(tabs)/posts'),
            },
          ]
        );
      } else {
        console.error('OfferRide: API returned error:', response.error);
        Alert.alert('Error', response.error || 'Failed to offer ride');
      }
    } catch (error) {
      console.error('OfferRide: Exception occurred:', error);
      console.error('OfferRide: Error message:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to offer ride');
    } finally {
      setOffering(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading ride request...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rideRequest) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="flex-1 justify-center items-center">
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Ride request not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className={`px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mr-3"
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#222'} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Ride Request
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Offer to fulfill this request
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          {/* Request Status Banner */}
          <View className="mb-6 p-4 rounded-xl border" style={{ 
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#F8FAFC',
            borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#E2E8F0'
          }}>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' 
              }}>
                <MaterialIcons name="person-search" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Looking for a driver
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {rideRequest.capacity.required} seat{rideRequest.capacity.required > 1 ? 's' : ''} needed
                </Text>
              </View>
            </View>
          </View>

          {/* Trip Details Card */}
          <View className={`mb-6 p-4 rounded-2xl ${styles.card}`} style={{ 
            borderWidth: 1, 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' 
          }}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Trip Details
            </Text>

            {/* Departure Time */}
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' 
              }}>
                <Feather name="clock" size={18} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatDate(rideRequest.departureTime)}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Departs at {formatTime(rideRequest.departureTime)}
                </Text>
              </View>
            </View>

            {/* Route */}
            <View className="flex-row items-start">
              <View className="items-center mr-3 mt-1">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <View className={`w-0.5 h-8 mt-1 mb-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                <View className="w-3 h-3 rounded-full bg-red-500" />
              </View>
              <View className="flex-1">
                <View className="mb-4">
                  <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    From
                  </Text>
                  {(() => {
                    const parts = rideRequest.from.split(',');
                    const mainText = parts[0].trim();
                    const locationDetails = parts.slice(1).join(',').trim();
                    
                    return (
                      <>
                        <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                          {mainText}
                        </Text>
                        {locationDetails && (
                          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1}>
                            {locationDetails}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </View>
                <View>
                  <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    To
                  </Text>
                  {(() => {
                    const parts = rideRequest.to.split(',');
                    const mainText = parts[0].trim();
                    const locationDetails = parts.slice(1).join(',').trim();
                    
                    return (
                      <>
                        <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                          {mainText}
                        </Text>
                        {locationDetails && (
                          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1}>
                            {locationDetails}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </View>
              </View>
            </View>
          </View>

          {/* Price Card */}
          <View className={`mb-6 p-4 rounded-2xl ${styles.card}`} style={{ 
            borderWidth: 1, 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' 
          }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Payment per seat
                </Text>
                <Text className="text-2xl font-bold text-green-600">
                  ${rideRequest.pricePerSeat.toFixed(0)}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total: ${(rideRequest.pricePerSeat * rideRequest.capacity.required).toFixed(0)}
                </Text>
              </View>
              <View className="items-end">
                <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Seats needed
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {rideRequest.capacity.required}
                </Text>
              </View>
            </View>
          </View>

          {/* Offer Button */}
          <View className="px-4">
            <CustomButton
              title={offering ? "Offering..." : "Offer This Ride"}
              onPress={handleOfferRide}
              className="mb-4 w-full"
              disabled={offering}
              IconLeft={() => 
                offering ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="local-taxi" size={20} color="white" />
                )
              }
            />
            
            <Text className={`text-xs text-center leading-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              By offering this ride, you agree to pick up the rider at the specified time and location.
              Payment will be coordinated directly with the rider using their selected payment method.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OfferRidePage;