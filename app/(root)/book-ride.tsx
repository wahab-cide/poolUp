import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { Feather } from '@expo/vector-icons';
import { fetchAPI } from '@/lib/fetch';

import BookingRequest from "@/components/BookingRequest";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { formatUserName, getUserInitials } from "@/lib/utils";
import { isFareSplittingEligible } from "@/lib/fareSplitting";
import { RideData, useRideStore } from "@/store";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const BookRide = () => {
  const { user } = useUser();
  const { rides, selectedRide } = useRideStore();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const { isDark } = useTheme();
  
  const [rideDetails, setRideDetails] = useState<RideData | null>(null);
  const [loading, setLoading] = useState(false);
  const [seatAvailability, setSeatAvailability] = useState<{available: number, isValid: boolean} | null>(null);
  const [hasFareSplitting, setHasFareSplitting] = useState<boolean>(false);

  // Helper function to get driver initials for avatar fallback
  const getDriverInitials = (driver: any) => {
    return getUserInitials(driver.first_name, driver.last_name, driver.name);
  };

  // Format departure time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format departure date
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
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Format departure time as number (likely timestamp or minutes)
  const getRideTimeAsNumber = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Option 1: Return timestamp
      return date.getTime();
      
      // Option 2: Return minutes from now (uncomment if preferred)
      // const now = new Date();
      // const diffMs = date.getTime() - now.getTime();
      // return Math.max(0, Math.floor(diffMs / (1000 * 60))); // minutes
    } catch {
      return 0; // fallback
    }
  };

  const fetchRideDetails = async (id: string) => {
    setLoading(true);
    try {
      // Use the new ride details API endpoint
      const data = await fetchAPI(`/api/rides/${id}`);
      if (data.success) {
        setRideDetails(data.ride);
        // Check current seat availability for 1 seat
        checkSeatAvailability(id, 1);
      } else {
        if (__DEV__) console.error('Failed to fetch ride details:', data.error);
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching ride details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSeatAvailability = async (id: string, seats: number) => {
    try {
      const data = await fetchAPI(`/api/rides/${id}/validate-booking`, {
        method: 'POST',
        body: JSON.stringify({
          seatsRequested: seats,
        }),
      });
      if (data.success) {
        setSeatAvailability({
          available: data.availableSeats,
          isValid: data.isValid
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking seat availability:', error);
    }
  };

  const checkFareSplitting = (rideData: RideData) => {
    // Use backend data if available (most common case)
    if (rideData.fare_splitting_enabled !== undefined) {
      setHasFareSplitting(rideData.fare_splitting_enabled);
      return;
    }

    // Fallback to client-side logic only if backend data is missing
    const isEligible = isFareSplittingEligible(
      rideData.type || 'post', 
      rideData.seats_total, 
      true
    );
    setHasFareSplitting(isEligible);
    
    if (__DEV__) console.log('ℹ️ Using client-side fare splitting logic (backend data unavailable):', {
      rideId: rideData.id,
      isEligible,
      type: rideData.type,
      seats_total: rideData.seats_total
    });
  };

  // Determine which ride to display
  useEffect(() => {
    if (rideId) {
      // Coming from feed - need to fetch ride details
      fetchRideDetails(rideId);
    } else if (selectedRide) {
      // Coming from confirm-ride - use selected ride from store
      const storeRideDetails = rides.find(ride => ride.id === selectedRide);
      setRideDetails(storeRideDetails || null);
      // Check seat availability and fare splitting for store ride too
      if (storeRideDetails) {
        checkSeatAvailability(storeRideDetails.id, 1);
        checkFareSplitting(storeRideDetails);
      }
    }
  }, [rideId, selectedRide, rides]);

  // Check fare splitting when ride details are loaded
  useEffect(() => {
    if (rideDetails) {
      checkFareSplitting(rideDetails);
    }
  }, [rideDetails]);


  const selectedRideDetails = rideDetails;

  // Show loading state when fetching ride details
  if (loading) {
    return (
      <RideLayout title="Book Ride">
        <View className="flex-1 justify-center items-center p-5">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className="text-center mt-4" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Loading ride details...
          </Text>
        </View>
      </RideLayout>
    );
  }

  // If no ride is selected, show error
  if (!selectedRideDetails) {
    return (
      <RideLayout title="Book Ride">
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-center text-lg mb-4" style={{ color: isDark ? '#F87171' : '#DC2626' }}>
            {rideId ? 'Ride not found. Please try again.' : 'No ride selected. Please go back and select a ride.'}
          </Text>
        </View>
      </RideLayout>
    );
  }

  return (
    <RideLayout
      title="Book Ride"
      snapPoints={["100%"]}
      initialIndex={0}
    >
        <View className="flex-1">
          {/* Header with modern styling */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-center" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              Book Your Ride
            </Text>
            <Text className="text-base mt-2 text-center" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Review driver and ride details before booking
            </Text>
          </View>

          {/* Driver Section with enhanced styling */}
          <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: isDark ? '#161616' : '#F9FAFB' }}>
            <View className="flex-row items-center">
              {/* Driver Avatar */}
              <View className="w-16 h-16 rounded-full justify-center items-center mr-4" style={{ backgroundColor: isDark ? '#0D0D0D' : '#D1D5DB' }}>
                {selectedRideDetails.driver.avatar_url ? (
                  <Image
                    source={{ uri: selectedRideDetails.driver.avatar_url }}
                    className="w-16 h-16 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="font-semibold text-xl" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    {getDriverInitials(selectedRideDetails.driver)}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                {/* Driver Name and Rating */}
                <View className="flex-row items-center">
                  <Text className="text-lg font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    {formatUserName(selectedRideDetails.driver, 'full')}
                  </Text>
                  <View className="flex-row items-center ml-2">
                    <Image
                      source={icons.star}
                      className="w-3.5 h-3.5"
                      resizeMode="contain"
                    />
                    <Text className="text-sm font-medium ml-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                      {selectedRideDetails.driver.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Vehicle Info */}
                <Text className="mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  {selectedRideDetails.driver.vehicle.color} {selectedRideDetails.driver.vehicle.make} {selectedRideDetails.driver.vehicle.model}
                </Text>
                <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  Plate: {selectedRideDetails.driver.vehicle.plate}
                </Text>
              </View>
            </View>
          </View>

          {/* Ride Details with modern card design */}
          <View className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB' }}>
            <View className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}>
              <View className="flex-row items-center">
                <Feather name="dollar-sign" size={20} color="#9e9e9e" style={{marginRight: 12}} />
                <Text className="font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>Ride Price</Text>
              </View>
              <Text className="text-xl font-bold" style={{ color: '#9e9e9e' }}>
                ${selectedRideDetails.price.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}>
              <View className="flex-row items-center">
                <Feather name="clock" size={20} color="#9e9e9e" style={{marginRight: 12}} />
                <Text className="font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>Departure</Text>
              </View>
              <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                {formatDate(selectedRideDetails.departure_time)} at {formatTime(selectedRideDetails.departure_time)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: hasFareSplitting ? 1 : 0, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}>
              <View className="flex-row items-center">
                <Feather name="users" size={20} color="#9e9e9e" style={{marginRight: 12}} />
                <Text className="font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>Available Seats</Text>
              </View>
              <Text className="font-semibold" style={{ color: seatAvailability?.available === 0 ? '#EF4444' : (isDark ? '#FFFFFF' : '#111827') }}>
                {seatAvailability?.available ?? selectedRideDetails.seats_available} / {selectedRideDetails.seats_total}
              </Text>
            </View>

            {/* Fare Splitting Status */}
            {hasFareSplitting && (
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <Feather name="trending-down" size={20} color="#9e9e9e" style={{marginRight: 12}} />
                  <Text className="font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>Fare Splitting</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="px-3 py-1 rounded-full mr-2" style={{ backgroundColor: isDark ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)' }}>
                    <Text className="text-sm font-semibold" style={{ color: '#9e9e9e' }}>
                      Available
                    </Text>
                  </View>
                  <Text className="text-xs font-medium" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    Save with more passengers
                  </Text>
                </View>
              </View>
            )}

          </View>

          {/* Route Information with home feed card style */}
          <View className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: isDark ? '#161616' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB' }}>
            <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}>
              <Text className="text-lg font-semibold mb-3" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>Route Details</Text>

              {/* From Address with dot */}
              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center mr-3">
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#9e9e9e' }} />
                  <View className="w-5 h-0.5 ml-1" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} numberOfLines={2}>
                    {selectedRideDetails.origin.label}
                  </Text>
                  <Text className="text-xs" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>Pickup location</Text>
                </View>
              </View>

              {/* To Address with icon */}
              <View className="flex-row items-start">
                <View className="flex-row items-center mr-3 mt-0.5">
                  <Feather
                    name="map-pin"
                    size={16}
                    color="#9e9e9e"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }} numberOfLines={2}>
                    {selectedRideDetails.destination.label}
                  </Text>
                  <Text className="text-sm font-medium" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Destination</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Seat Availability Warning */}
          {seatAvailability?.available === 0 && (
            <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2', borderWidth: 1, borderColor: isDark ? '#991B1B' : '#FECACA' }}>
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: isDark ? '#991B1B' : '#FEE2E2' }}>
                  <Text className="font-bold" style={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>!</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                    This ride is fully booked
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: isDark ? '#F87171' : '#DC2626' }}>
                    No seats available. Check back later for cancellations.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Booking Request Component with better spacing */}
          <View className="mt-4">
            {seatAvailability?.available === 0 ? (
              <View className="rounded-2xl p-6" style={{ backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB' }}>
                <Text className="text-center text-lg font-medium" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  Booking Unavailable
                </Text>
                <Text className="text-center text-sm mt-1" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                  No seats available for this ride
                </Text>
              </View>
            ) : (
              <>
                <BookingRequest
                  fullName={user?.fullName!}
                  email={user?.emailAddresses[0].emailAddress!}
                  amount={selectedRideDetails.price.toString()}
                  rideId={selectedRideDetails.id}
                  driverId={selectedRideDetails.driver_id ? parseInt(selectedRideDetails.driver_id) : 0}
                  rideTime={getRideTimeAsNumber(selectedRideDetails.departure_time)}
                />
              </>
            )}
          </View>
        </View>
      </RideLayout>
  );
};

export default BookRide;