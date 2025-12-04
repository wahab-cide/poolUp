import { useUser } from "@clerk/clerk-expo";
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { isFareSplittingEligible } from "@/lib/fareSplitting";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

interface BookingRequest {
  bookingId: string;
  riderId: string;
  riderName: string;
  riderAvatar?: string;
  riderPhone?: string;
  riderRating: number;
  seatsRequested: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface PostedRideDetailsData {
  rideId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime?: string;
  createdAt: string;
  updatedAt: string;
  pricePerSeat: number;
  currency: string;
  rideStatus: 'open' | 'full' | 'matched' | 'completed' | 'cancelled';
  coordinates: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
  };
  capacity: {
    total: number;
    available: number;
    booked: number;
  };
  bookings: BookingRequest[];
  totalEarnings: number;
  fare_splitting_enabled?: boolean; // Whether this ride has fare splitting enabled
}

const PostedRideDetails = () => {
  // Move all hooks to the top of the component
  const { user } = useUser();
  const router = useRouter();
  const { 
    rideId, 
    fareSplittingEnabled: passedFareSplittingEnabled 
  } = useLocalSearchParams<{ 
    rideId: string;
    fareSplittingEnabled?: string;
  }>();
  const { isDark } = useTheme();
  const theme = useThemeStyles();
  const [rideDetails, setRideDetails] = useState<PostedRideDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState<Set<string>>(new Set());
  const [completionLoading, setCompletionLoading] = useState(false);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [headingOverBookings, setHeadingOverBookings] = useState<Set<string>>(new Set());

  // State for fare splitting data from backend
  const [fareSplitData, setFareSplitData] = useState<any>(null);

  // Fetch fare splitting data from backend only if not passed via navigation
  const fetchFareSplitData = useCallback(async () => {
    if (!rideDetails?.rideId) return;

    // Use passed fare splitting data if available
    const fareSplittingEnabled = passedFareSplittingEnabled !== undefined 
      ? passedFareSplittingEnabled === 'true' 
      : rideDetails.fare_splitting_enabled;

    if (!fareSplittingEnabled) {
      setFareSplitData(null);
      console.log('ℹ️ Fare splitting disabled for this ride (using passed/cached data)');
      return;
    }

    // Only make API call if we don't have passed data
    if (passedFareSplittingEnabled === undefined && rideDetails.fare_splitting_enabled === undefined) {
      try {
        console.log('⚠️ Making API call for fare split data (no cached data available)');
        const response = await fetchAPI(`/api/rides/${rideDetails.rideId}/split-pricing`);
        if (response && response.fareSplittingEnabled) {
          setFareSplitData(response);
        } else {
          setFareSplitData(null);
        }
      } catch (error) {
        console.error('Error fetching fare split data:', error);
        setFareSplitData(null);
      }
    } else {
      // Use cached/passed data - no API call needed
      console.log('✅ Using passed/cached fare splitting data (no API call needed)');
      setFareSplitData({
        fareSplittingEnabled: fareSplittingEnabled,
        // Minimal data structure for basic functionality
        bookings: []
      });
    }
  }, [rideDetails?.rideId, rideDetails?.fare_splitting_enabled, passedFareSplittingEnabled]);

  // Get accurate booking price from backend data
  const getBookingPrice = (booking: BookingRequest) => {
    if (!fareSplitData || !fareSplitData.fareSplittingEnabled) {
      return booking.totalAmount;
    }

    // Find matching booking in fare split data
    const matchingBooking = fareSplitData.bookings?.find(
      (b: any) => b.id === booking.bookingId
    );

    if (matchingBooking) {
      return matchingBooking.pricePaid * booking.seatsRequested;
    }

    // Fallback to original amount if not found
    return booking.totalAmount;
  };


  useEffect(() => {
    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId, fetchRideDetails]);

  // Fetch fare splitting data when ride details are loaded
  useEffect(() => {
    if (rideDetails) {
      fetchFareSplitData();
    }
  }, [rideDetails, fetchFareSplitData]);

  // Helper functions for time-based restrictions
  const canCompleteRide = () => {
    if (!rideDetails) return false;
    const departureTime = new Date(rideDetails.departureTime);
    const now = new Date();
    const twoHoursAfterDeparture = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000);
    return now >= twoHoursAfterDeparture;
  };

  const hasConfirmedBookings = () => {
    if (!rideDetails) return false;
    return rideDetails.bookings.some(booking => 
      booking.status === 'paid' || booking.status === 'completed'
    );
  };
  
  const canCancelRide = () => {
    if (!rideDetails) return false;
    const departureTime = new Date(rideDetails.departureTime);
    const now = new Date();
    const thirtyMinutesAfterDeparture = new Date(departureTime.getTime() + 30 * 60 * 1000);
    return now <= thirtyMinutesAfterDeparture;
  };
  
  const getTimeUntilCanComplete = () => {
    if (!rideDetails) return '';
    const departureTime = new Date(rideDetails.departureTime);
    const now = new Date();
    const twoHoursAfterDeparture = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000);
    
    if (now >= twoHoursAfterDeparture) return '';
    
    const remainingTime = twoHoursAfterDeparture.getTime() - now.getTime();
    const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `(Available in ${remainingHours > 0 ? `${remainingHours}h ` : ''}${remainingMinutes}m)`;
  };

  const fetchRideDetails = useCallback(async () => {
    try {
      const response = await fetchAPI(`/api/rides/${rideId}/details`);
      
      if (response.success) {
        // Add fare splitting detection if not provided by API
        const rideData = response.ride;
        if (rideData.fare_splitting_enabled === undefined) {
          rideData.fare_splitting_enabled = isFareSplittingEligible('post', rideData.capacity?.total || 1, true);
        }
        setRideDetails(rideData);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch ride details');
        try {
          if (router) {
            router.back();
          }
        } catch (navError) {
          console.error('Navigation error on back:', navError);
        }
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      Alert.alert('Error', 'Failed to fetch ride details');
      try {
        if (router) {
          router.back();
        }
      } catch (navError) {
        console.error('Navigation error on back:', navError);
      }
    } finally {
      setLoading(false);
    }
  }, [rideId, router]);

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    Alert.alert(
      action === 'approve' ? 'Approve Booking' : 'Reject Booking',
      `Are you sure you want to ${action} this booking request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action === 'approve' ? 'Approve' : 'Reject', 
          onPress: async () => {
            setLoadingBookings(prev => new Set(prev).add(bookingId));
            try {
              const response = await fetchAPI(`/api/bookings/${bookingId}/${action}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });

              if (response.success) {
                Alert.alert('Success', `Booking ${action}d successfully`);
                fetchRideDetails();
                fetchFareSplitData();
              } else {
                Alert.alert('Error', response.error || `Failed to ${action} booking`);
              }
            } catch (error) {
              console.error(`Error ${action}ing booking:`, error);
              Alert.alert('Error', `Failed to ${action} booking`);
            } finally {
              setLoadingBookings(prev => {
                const newSet = new Set(prev);
                newSet.delete(bookingId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  const handleCancelRide = async () => {
    // Check if departure time has passed by 30 minutes
    const departureTime = new Date(rideDetails.departureTime);
    const now = new Date();
    const thirtyMinutesAfterDeparture = new Date(departureTime.getTime() + 30 * 60 * 1000);
    
    if (now > thirtyMinutesAfterDeparture) {
      Alert.alert(
        'Cannot Cancel',
        'This ride cannot be cancelled as it departed more than 30 minutes ago.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? All bookings will be cancelled and riders will be notified.',
      [
        { text: 'Keep Ride', style: 'cancel' },
        { 
          text: 'Cancel Ride', 
          style: 'destructive',
          onPress: async () => {
            setCancellationLoading(true);
            try {
              const response = await fetchAPI(`/api/rides/${rideId}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });

              if (response.success) {
                Alert.alert('Success', 'Ride cancelled successfully');
                router.back();
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel ride');
              }
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Error', 'Failed to cancel ride');
            } finally {
              setCancellationLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteRide = async () => {
    // Check if at least 2 hours have passed since departure time
    const departureTime = new Date(rideDetails.departureTime);
    const now = new Date();
    const twoHoursAfterDeparture = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000);
    
    if (now < twoHoursAfterDeparture) {
      const remainingTime = twoHoursAfterDeparture.getTime() - now.getTime();
      const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      
      Alert.alert(
        'Too Early',
        `You can complete this ride in ${remainingHours > 0 ? `${remainingHours}h ` : ''}${remainingMinutes}m. Rides can only be completed 2 hours after departure time.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Complete Ride',
      'Are you sure you want to mark this ride as completed? This will complete all paid bookings and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete Ride', 
          style: 'default',
          onPress: async () => {
            setCompletionLoading(true);
            try {
              const response = await fetchAPI(`/api/rides/${rideId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  driverId: user?.id
                })
              });

              if (response.success) {
                Alert.alert('Success', 'Ride completed successfully! All paid bookings have been marked as completed.');
                fetchRideDetails(); // Refresh data to show updated status
              } else {
                Alert.alert('Error', response.error || 'Failed to complete ride');
              }
            } catch (error) {
              console.error('Error completing ride:', error);
              Alert.alert('Error', 'Failed to complete ride');
            } finally {
              setCompletionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStartChat = async (bookingId: string) => {
    try {
      const response = await fetchAPI(`/api/chat/thread/${bookingId}?clerkId=${user?.id}`);

      if (response.success) {
        router.push(`/(root)/chat-conversation?threadId=${response.thread.id}&bookingId=${bookingId}`);
      } else {
        Alert.alert('Error', response.error || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const handleHeadingOver = async (bookingId: string) => {
    try {
      // Add bookingId to loading state
      setLoadingBookings(prev => new Set(prev).add(bookingId));

      const response = await fetchAPI(`/api/ride/heading-over`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rideId: rideDetails?.rideId,
          bookingId: bookingId,
          driverId: user?.id,
        }),
      });

      if (response.success) {
        // Add to heading over bookings set
        setHeadingOverBookings(prev => new Set(prev).add(bookingId));
        Alert.alert('Success', 'Passenger has been notified that you are heading over!');
      } else {
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating heading over status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      // Remove from loading state
      setLoadingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return isDark ? '#FFB74D' : '#FFA500';
      case 'paid':
        return isDark ? '#81C784' : '#4CAF50';
      case 'completed':
        return isDark ? '#64B5F6' : '#2196F3';
      case 'cancelled':
        return isDark ? '#E57373' : '#F44336';
      case 'expired':
        return isDark ? '#FFB74D' : '#FF9800';
      default:
        return isDark ? '#BDBDBD' : '#9E9E9E';
    }
  };

  const getStatusText = (status: string, approvalStatus?: string) => {
    if (status === 'pending') {
      if (approvalStatus === 'approved') {
        return 'Approved';
      } else if (approvalStatus === 'rejected') {
        return 'Rejected';
      } else {
        return 'Pending Approval';
      }
    }

    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const getRideStatusColor = (rideStatus: string) => {
    switch (rideStatus) {
      case 'open':
        return '#F97316'; // Green
      case 'full':
        return '#3B82F6'; // Blue
      case 'matched':
        return '#F97316';
      case 'completed':
        return '#F97316'; // Purple
      case 'cancelled':
        return '#EF4444'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getRideStatusText = (rideStatus: string) => {
    switch (rideStatus) {
      case 'open':
        return 'Open';
      case 'full':
        return 'Full';
      case 'matched':
        return 'Matched';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const renderBookingItem = ({ item }: { item: BookingRequest }) => {
    const isBookingLoading = loadingBookings.has(item.bookingId);
    
    return (
      <View className={`${theme.card} rounded-2xl p-4 mb-4`} 
            style={{ 
              shadowColor: isDark ? '#000' : '#000', 
              shadowOffset: { width: 0, height: 3 }, 
              shadowOpacity: isDark ? 0.3 : 0.08, 
              shadowRadius: 10,
              elevation: isDark ? 6 : 3
            }}>
        <View className="mb-3">
          <View className="flex-row items-start">
            <View className="relative mr-3">
              <Image
                source={{ 
                  uri: item.riderAvatar || 'https://via.placeholder.com/50x50' 
                }}
                className="w-12 h-12 rounded-xl"
                style={{ 
                  borderWidth: 2,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }}
              />
              {/* Status indicator */}
              <View className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2" 
                    style={{ 
                      backgroundColor: getStatusColor(item.status),
                      borderColor: theme.card.backgroundColor || (isDark ? '#1F2937' : '#FFFFFF')
                    }} />
            </View>
            
            <View className="flex-1">
              <Text className={`${theme.textPrimary} font-bold text-base`} numberOfLines={2}>
                {item.riderName}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="flex-row items-center mr-3">
                  <Text className="text-xs mr-1">⭐</Text>
                  <Text className={`${theme.textPrimary} font-semibold text-sm`}>
                    {item.riderRating.toFixed(1)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Feather name="users" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text className={`${theme.textSecondary} text-sm ml-1 font-medium`}>
                    {item.seatsRequested} seat{item.seatsRequested > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center">
              {(() => {
                const bookingPrice = getBookingPrice(item);
                const matchingBooking = fareSplitData?.bookings?.find((b: any) => b.id === item.bookingId);
                const hasFareSplitting = matchingBooking && matchingBooking.savings > 0;
                
                return (
                  <View className="flex-row items-baseline">
                    {hasFareSplitting && (
                      <Text className={`${theme.textSecondary} text-xs line-through mr-2`}>
                        {item.currency} {matchingBooking.originalPrice.toFixed(2)}
                      </Text>
                    )}
                    <Text className={`${theme.textPrimary} font-bold text-lg`}>
                      {item.currency} {bookingPrice.toFixed(2)}
                    </Text>
                  </View>
                );
              })()}
            </View>
            
            <View 
              className="px-3 py-1.5 rounded-full"
              style={{ 
                backgroundColor: getStatusColor(item.status) + (isDark ? '25' : '15'),
                borderWidth: 1,
                borderColor: getStatusColor(item.status) + (isDark ? '40' : '25')
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: getStatusColor(item.status) }}
              >
                {getStatusText(item.status, item.approvalStatus)}
              </Text>
            </View>
          </View>
        </View>
        
        {item.status === 'pending' && item.approvalStatus === 'pending' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleBookingAction(item.bookingId, 'approve')}
              className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-lg"
              style={{
                backgroundColor: '#3B82F6',
                borderWidth: 1,
                borderColor: '#2563EB'
              }}
              disabled={isBookingLoading}
              activeOpacity={0.8}
            >
              <Feather 
                name={isBookingLoading ? "loader" : "check"} 
                size={14} 
                color="#FFFFFF" 
                style={{ marginRight: 4 }} 
              />
              <Text 
                className="font-semibold text-sm text-white"
              >
                {isBookingLoading ? 'Processing...' : 'Approve'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleBookingAction(item.bookingId, 'reject')}
              className="flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-lg"
              style={{
                backgroundColor: '#F97316',
                borderWidth: 1,
                borderColor: '#EA580C'
              }}
              disabled={isBookingLoading}
              activeOpacity={0.8}
            >
              <Feather 
                name={isBookingLoading ? "loader" : "x"} 
                size={14} 
                color="#FFFFFF" 
                style={{ marginRight: 4 }} 
              />
              <Text 
                className="font-semibold text-sm text-white"
              >
                {isBookingLoading ? 'Processing...' : 'Reject'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'cancelled' && item.approvalStatus === 'rejected' && (
          <View className="rounded-full px-4 py-2 flex-row items-center justify-center bg-red-500/20">
            <Feather name="x-circle" size={16} color={isDark ? '#F87171' : '#EF4444'} style={{ marginRight: 6 }} />
            <Text className="text-center font-medium text-sm" style={{ color: isDark ? '#F87171' : '#EF4444' }}>
              Rejected
            </Text>
          </View>
        )}
        
        {item.status === 'paid' && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <View className="rounded-xl px-4 py-2.5 flex-row items-center"
                    style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }}>
                <View className="w-6 h-6 rounded-full items-center justify-center mr-2"
                      style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)' }}>
                  <Feather name="check" size={14} color={isDark ? '#FB923C' : '#F97316'} />
                </View>
                <Text className="font-bold text-sm" style={{ color: isDark ? '#FB923C' : '#F97316' }}>
                  Payment Confirmed
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleStartChat(item.bookingId)}
                className="flex-row items-center px-4 py-2.5 rounded-xl ml-3"
                style={{
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="chat-bubble-outline" size={16} color={isDark ? '#60A5FA' : '#3B82F6'} style={{ marginRight: 6 }} />
                <Text className="text-sm font-bold" style={{ color: isDark ? '#60A5FA' : '#3B82F6' }}>Message</Text>
              </TouchableOpacity>
            </View>

            {headingOverBookings.has(item.bookingId) ? (
              <View className="rounded-xl px-4 py-3 flex-row items-center justify-center"
                    style={{ backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }}>
                <Feather name="navigation" size={16} color={isDark ? '#FB923C' : '#F97316'} style={{ marginRight: 6 }} />
                <Text className="font-bold text-sm" style={{ color: isDark ? '#FB923C' : '#F97316' }}>
                  En Route to Passenger
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleHeadingOver(item.bookingId)}
                className="rounded-xl px-4 py-3 flex-row items-center justify-center"
                style={{
                  backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)'
                }}
                activeOpacity={0.7}
                disabled={isBookingLoading}
              >
                {isBookingLoading ? (
                  <ActivityIndicator size="small" color={isDark ? '#FB923C' : '#F97316'} style={{ marginRight: 6 }} />
                ) : (
                  <Feather name="navigation" size={16} color={isDark ? '#FB923C' : '#F97316'} style={{ marginRight: 6 }} />
                )}
                <Text className="font-bold text-sm" style={{ color: isDark ? '#FB923C' : '#F97316' }}>
                  {isBookingLoading ? 'Notifying...' : 'Heading Over'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {item.status === 'completed' && (
          <View className="flex-row items-center justify-between">
            <View className="rounded-xl px-4 py-2.5 flex-row items-center"
                  style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }}>
              <View className="w-6 h-6 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)' }}>
                <Feather name="check" size={14} color={isDark ? '#FB923C' : '#F97316'} />
              </View>
              <Text className="font-bold text-sm" style={{ color: isDark ? '#FB923C' : '#F97316' }}>
                Trip Completed
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleStartChat(item.bookingId)}
              className="flex-row items-center px-4 py-2.5 rounded-xl ml-3"
              style={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chat-bubble-outline" size={16} color={isDark ? '#60A5FA' : '#3B82F6'} style={{ marginRight: 6 }} />
              <Text className="text-sm font-bold" style={{ color: isDark ? '#60A5FA' : '#3B82F6' }}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.activityIndicator.primary} />
          <Text className={`${theme.textSecondary} mt-4`}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rideDetails) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background}`}>
        <View className="flex-1 justify-center items-center px-6">
          <Text className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>
            Ride not found
          </Text>
          <CustomButton
            title="Go Back"
            onPress={() => router.back()}
            className="w-48"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.background}`}>
      <ScrollView className="flex-1">
        {/* Enhanced Header */}
        <View className={`${theme.background} ${theme.border}`} style={{ borderBottomWidth: 1 }}>
          <View className="pt-6 pb-4 px-6">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center flex-1">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="w-11 h-11 items-center justify-center mr-4 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                  activeOpacity={0.7}
                >
                  <Feather name="arrow-left" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className={`text-xl font-bold ${theme.textPrimary}`}>
                    My Posted Ride
                  </Text>
                  <Text className={`${theme.textSecondary} text-sm font-medium mt-1`}>
                    ID: {rideDetails.rideId.slice(-8).toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View className="ml-3">
                <View
                  className="px-4 py-2.5 rounded-full"
                  style={{ 
                    backgroundColor: getRideStatusColor(rideDetails.rideStatus) + (isDark ? '25' : '15'),
                    borderWidth: 1,
                    borderColor: getRideStatusColor(rideDetails.rideStatus) + (isDark ? '50' : '30')
                  }}
                >
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={rideDetails.rideStatus === 'completed' ? 'checkmark-circle' : 
                            rideDetails.rideStatus === 'matched' ? 'checkmark' :
                            rideDetails.rideStatus === 'open' ? 'radio-button-on' : 
                            rideDetails.rideStatus === 'full' ? 'people' : 'close-circle'} 
                      size={14} 
                      color={getRideStatusColor(rideDetails.rideStatus)} 
                      style={{ marginRight: 6 }}
                    />
                    <Text 
                      className="text-xs font-bold"
                      style={{ color: getRideStatusColor(rideDetails.rideStatus) }}
                    >
                      {getRideStatusText(rideDetails.rideStatus)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" 
                    style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }}>
                <Feather name="calendar" size={16} color={isDark ? '#F97316' : '#EA580C'} />
              </View>
              <Text className={`${theme.textPrimary} font-semibold text-base`}>
                {formatDate(rideDetails.departureTime)}
              </Text>
              <View className="mx-3 w-1 h-1 rounded-full" style={{ backgroundColor: isDark ? '#6B7280' : '#9CA3AF' }} />
              <Text className={`${theme.textPrimary} font-semibold text-base`}>
                {formatTime(rideDetails.departureTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Route Information */}
        <View className={`${theme.card} mx-6 mt-6 rounded-2xl p-6`} 
              style={{ 
                shadowColor: isDark ? '#000' : '#000', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: isDark ? 0.4 : 0.08, 
                shadowRadius: 12,
                elevation: isDark ? 8 : 4
              }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${theme.textPrimary}`}>Route Details</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }}>
              <Text className="text-xs font-semibold" style={{ color: isDark ? '#F97316' : '#EA580C' }}>
                {Math.round(Math.random() * 20 + 10)} km
              </Text>
            </View>
          </View>
          
          <View className="space-y-4">
            <View className="flex-row items-center">
              <View className="mr-3">
                <Image source={icons.point} className="w-6 h-6" style={{ tintColor: isDark ? '#F97316' : '#EA580C' }} />
              </View>
              <View className="flex-1">
                <Text className={`${theme.textSecondary} text-xs font-medium mb-1`}>PICKUP LOCATION</Text>
                <Text className={`${theme.textPrimary} font-semibold text-base`}>
                  {rideDetails.from.split(',').slice(0, 3).join(',').trim()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center pl-5">
              <View className="w-0.5 h-8 mr-4" style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }} />
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Feather name="clock" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text className={`${theme.textSecondary} text-xs font-medium ml-2`}>
                    Estimated travel time: {Math.round(Math.random() * 30 + 15)} min
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="mr-3">
                <Image source={icons.to} className="w-6 h-6" style={{ tintColor: isDark ? '#EF4444' : '#DC2626' }} />
              </View>
              <View className="flex-1">
                <Text className={`${theme.textSecondary} text-xs font-medium mb-1`}>DESTINATION</Text>
                <Text className={`${theme.textPrimary} font-semibold text-base`}>
                  {rideDetails.to.split(',').slice(0, 3).join(',').trim()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Earnings & Capacity */}
        <View className={`${theme.card} mx-6 mt-4 rounded-2xl p-6`} 
              style={{ 
                shadowColor: isDark ? '#000' : '#000', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: isDark ? 0.4 : 0.08, 
                shadowRadius: 12,
                elevation: isDark ? 8 : 4
              }}>
          <Text className={`text-lg font-bold ${theme.textPrimary} mb-5`}>Ride Performance</Text>
          
          <View className="space-y-5">
            {/* Capacity & Earnings Row */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" 
                        style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }}>
                    <Feather name="users" size={18} color={isDark ? '#FB923C' : '#F97316'} />
                  </View>
                  <View>
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>CAPACITY</Text>
                    <Text className={`${theme.textPrimary} font-semibold text-base`}>
                      {rideDetails.capacity.booked}/{rideDetails.capacity.total} seats
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" 
                        style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }}>
                    <Feather name="dollar-sign" size={18} color={isDark ? '#FB923C' : '#F97316'} />
                  </View>
                  <View>
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>TOTAL EARNINGS</Text>
                    <Text className={`${theme.textPrimary} font-bold text-lg`}>
                      {rideDetails.currency} {rideDetails.totalEarnings.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className={`${theme.textSecondary} text-xs font-medium`}>BOOKING PROGRESS</Text>
                <Text className={`${theme.textSecondary} text-xs font-medium`}>
                  {Math.round((rideDetails.capacity.booked / rideDetails.capacity.total) * 100)}% full
                </Text>
              </View>
              <View className="h-2 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }}>
                <View 
                  className="h-2 rounded-full"
                  style={{
                    width: `${(rideDetails.capacity.booked / rideDetails.capacity.total) * 100}%`,
                    backgroundColor: isDark ? '#F97316' : '#EA580C'
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Bookings Section */}
        <View className={`${theme.card} mx-6 mt-4 rounded-2xl p-6`} 
              style={{ 
                shadowColor: isDark ? '#000' : '#000', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: isDark ? 0.4 : 0.08, 
                shadowRadius: 12,
                elevation: isDark ? 8 : 4
              }}>
          <View className="flex-row items-center justify-between mb-5">
            <Text className={`text-lg font-bold ${theme.textPrimary}`}>
              Booking Requests
            </Text>
            <View 
              className="rounded-full px-4 py-2"
              style={{ 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
              }}
            >
              <Text className="font-bold" style={{ color: isDark ? '#60A5FA' : '#3B82F6' }}>
                {rideDetails.bookings.length}
              </Text>
            </View>
          </View>

          {rideDetails.bookings.length === 0 ? (
            <View className="py-12 items-center">
              <LinearGradient
                colors={isDark ? ['#374151', '#4B5563'] : ['#F9FAFB', '#F3F4F6']}
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
              >
                <Image
                  source={icons.list}
                  className="w-10 h-10 opacity-60"
                  style={{ tintColor: isDark ? '#FFFFFF' : '#000000' }}
                />
              </LinearGradient>
              <Text className={`${theme.textPrimary} font-semibold text-base mb-2`}>
                No Bookings Yet
              </Text>
              <Text className={`${theme.textSecondary} text-center text-sm leading-5`}>
                When riders book your ride, they&apos;ll appear here for approval.
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {rideDetails.bookings.map((booking) => (
                <View key={booking.bookingId}>
                  {renderBookingItem({ item: booking })}
                </View>
              ))}
            </View>
          )}
        </View>


        {/* Enhanced Actions */}
        <View className="mx-6 mt-4 pb-8">
          {rideDetails.rideStatus === 'open' || rideDetails.rideStatus === 'full' || rideDetails.rideStatus === 'matched' ? (
            <View className="w-full">
              <View className="mb-4">
                <CustomButton
                  title={completionLoading ? "Completing..." : canCompleteRide() ? "Complete Ride" : "Complete Ride"}
                  onPress={handleCompleteRide}
                  className="w-full"
                  style={{
                    backgroundColor: canCompleteRide() 
                      ? (isDark ? '#F97316' : '#EA580C') 
                      : (isDark ? 'rgba(107, 114, 128, 0.5)' : 'rgba(156, 163, 175, 0.5)'),
                    shadowColor: canCompleteRide() ? '#F97316' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: canCompleteRide() ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: canCompleteRide() ? 8 : 0
                  }}
                  disabled={completionLoading || cancellationLoading || !canCompleteRide()}
                  IconLeft={() => (
                    <Feather 
                      name={completionLoading ? "loader" : "check-circle"} 
                      size={20} 
                      color={canCompleteRide() ? "#FFFFFF" : (isDark ? "#9CA3AF" : "#6B7280")} 
                      style={{ marginRight: 8 }} 
                    />
                  )}
                />
                {!canCompleteRide() && (
                  <View className="mt-3 px-4 py-2 rounded-lg" 
                        style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
                    <Text className="text-xs text-center font-medium" 
                          style={{ color: isDark ? '#60A5FA' : '#3B82F6' }}>
                      Rides can be completed 2 hours after departure
                    </Text>
                    <Text className="text-xs text-center font-semibold mt-1" 
                          style={{ color: isDark ? '#60A5FA' : '#3B82F6' }}>
                      {getTimeUntilCanComplete()}
                    </Text>
                  </View>
                )}
              </View>
              
              <View>
                <CustomButton
                  title={cancellationLoading ? "Cancelling..." : "Cancel Ride"}
                  onPress={handleCancelRide}
                  className="w-full"
                  style={{ 
                    backgroundColor: canCancelRide() 
                      ? (isDark ? 'rgba(239, 68, 68, 0.9)' : '#EF4444') 
                      : (isDark ? 'rgba(107, 114, 128, 0.5)' : 'rgba(156, 163, 175, 0.5)'),
                    shadowColor: canCancelRide() ? '#EF4444' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: canCancelRide() ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: canCancelRide() ? 8 : 0
                  }}
                  disabled={cancellationLoading || completionLoading || !canCancelRide()}
                  IconLeft={() => (
                    <Feather 
                      name={cancellationLoading ? "loader" : "x-circle"} 
                      size={20} 
                      color={canCancelRide() ? "#FFFFFF" : (isDark ? "#9CA3AF" : "#6B7280")} 
                      style={{ marginRight: 8 }} 
                    />
                  )}
                />
                {!canCancelRide() && (
                  <View className="mt-3 px-4 py-2 rounded-lg" 
                        style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
                    <Text className="text-xs text-center font-medium" 
                          style={{ color: isDark ? '#F87171' : '#DC2626' }}>
                      Cannot cancel - ride departed over 30 minutes ago
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : rideDetails.rideStatus === 'completed' ? (
            <View
              className="rounded-2xl p-6"
              style={{
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'
              }}
            >
              <View className="flex-row items-center justify-center mb-3">
                <View className="w-12 h-12 rounded-full items-center justify-center mr-4" 
                      style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }}>
                  <Feather name="check-circle" size={24} color={isDark ? '#F97316' : '#EA580C'} />
                </View>
                <View className="flex-1">
                  <Text className={`${theme.textPrimary} font-bold text-xl`}>
                    Ride Completed
                  </Text>
                  <Text className={`${theme.textSecondary} text-sm mt-1`}>
                    Successfully completed on {formatDate(rideDetails.departureTime)}
                  </Text>
                </View>
              </View>
            </View>
          ) : rideDetails.rideStatus === 'cancelled' ? (
            <View
              className="rounded-2xl p-6"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <View className="flex-row items-center justify-center mb-3">
                <View className="w-12 h-12 rounded-full items-center justify-center mr-4" 
                      style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }}>
                  <Feather name="x-circle" size={24} color={isDark ? '#EF4444' : '#DC2626'} />
                </View>
                <View className="flex-1">
                  <Text className={`${theme.textPrimary} font-bold text-xl`}>
                    Ride Cancelled
                  </Text>
                  <Text className={`${theme.textSecondary} text-sm mt-1`}>
                    This ride was cancelled and all bookings were processed
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostedRideDetails;