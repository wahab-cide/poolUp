import { useUser } from "@clerk/clerk-expo";
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import Payment from "@/components/Payment";
import { fetchAPI } from "@/lib/fetch";
import { formatUserName } from "@/lib/utils";
import { calculateRefundPreview, canCancelBooking, getCancellationTimeCategory, getTimeUntilDeparture } from "@/lib/refund-utils";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

interface BookingDetailsData {
  bookingId: string;
  rideId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime?: string;
  bookingDate: string;
  lastUpdated: string;
  seatsBooked: number;
  pricePerSeat: number;
  totalPaid: number;
  currency: string;
  bookingStatus: 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rideStatus: 'open' | 'full' | 'matched' | 'completed' | 'cancelled';
  coordinates: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
  };
  driver: {
    id: string;
    clerkId: string;
    name: string;
    avatar?: string;
    phone?: string;
    rating: number;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    displayName: string;
  } | null;
  capacity: {
    total: number;
    available: number;
  };
  fare_splitting_enabled?: boolean;
  total_passengers?: number; // Total passengers on this ride (for fare splitting)
  original_price?: number; // Original price before fare splitting discount
}

const BookingDetails = () => {
  const { user } = useUser();
  const router = useRouter();
  const { 
    bookingId, 
    rideId: passedRideId, 
    fareSplittingEnabled: passedFareSplittingEnabled 
  } = useLocalSearchParams<{ 
    bookingId: string;
    rideId?: string;
    fareSplittingEnabled?: string;
  }>();
  const { isDark } = useTheme();
  const theme = useThemeStyles();
  
  const [booking, setBooking] = useState<BookingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [fareSplitInfo, setFareSplitInfo] = useState<{
    originalPrice: number;
    savings: number;
    totalPassengers: number;
    hasFareSplitting: boolean;
  } | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, fetchBookingDetails]);

  // Helper function for time-based restrictions
  const canCancelBookingHelper = () => {
    if (!booking) return false;
    const cancellationCheck = canCancelBooking(booking.departureTime, booking.bookingStatus);
    return cancellationCheck.canCancel;
  };

  const fetchBookingDetails = useCallback(async () => {
    try {
      const response = await fetchAPI(`/api/bookings/${bookingId}`);
      
      if (response.success) {
        const bookingData = response.booking;
        setBooking(bookingData);

        // Use passed fare splitting data if available to avoid API call
        const fareSplittingEnabled = passedFareSplittingEnabled !== undefined 
          ? passedFareSplittingEnabled === 'true' 
          : bookingData.fare_splitting_enabled;

        if (fareSplittingEnabled && (bookingData.total_passengers > 1 || bookingData.original_price)) {
          // Calculate fare splitting info from booking data (no API call needed)
          const originalPricePerSeat = bookingData.original_price || bookingData.pricePerSeat;
          const originalTotal = originalPricePerSeat * bookingData.seatsBooked;
          const savings = originalTotal - bookingData.totalPaid;
          
          if (savings > 0.01) {
            setFareSplitInfo({
              originalPrice: originalTotal,
              savings: Math.max(0, savings),
              totalPassengers: bookingData.total_passengers || 2, // Default to 2 if not available
              hasFareSplitting: true
            });
            console.log('✅ Using passed/booking data for fare splitting (no API call):', {
              savings,
              originalPrice: originalTotal,
              totalPassengers: bookingData.total_passengers
            });
          } else {
            setFareSplitInfo(null);
          }
        } else {
          setFareSplitInfo(null);
          console.log('ℹ️ No fare splitting for this booking');
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch booking details');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Alert.alert('Error', 'Failed to fetch booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    
    // Check if booking can be cancelled
    const cancellationCheck = canCancelBooking(booking.departureTime, booking.bookingStatus);
    
    if (!cancellationCheck.canCancel) {
      Alert.alert('Cannot Cancel', cancellationCheck.reason!, [{ text: 'OK' }]);
      return;
    }
    
    // Calculate refund preview for user
    const refundPreview = calculateRefundPreview(booking.totalPaid, booking.departureTime);
    const timeUntil = getTimeUntilDeparture(booking.departureTime);
    
    // Create detailed cancellation message
    let alertTitle = 'Cancel Booking';
    let alertMessage = `Time until departure: ${timeUntil.displayText}\n\n${refundPreview.message}\n\nThis action cannot be undone.`;
    
    // Add policy reminder for paid bookings
    if (booking.bookingStatus === 'paid' && refundPreview.penaltyAmount > 0) {
      alertMessage += `\n\nCancellation fee: $${refundPreview.penaltyAmount.toFixed(2)}`;
    }
    
    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { text: 'Keep Booking', style: 'cancel' },
        { 
          text: refundPreview.refundAmount > 0 ? 'Cancel & Process Refund' : 'Cancel Booking', 
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await fetchAPI(`/api/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });

              if (response.success) {
                // Show detailed success message with refund info
                let successTitle = 'Booking Cancelled';
                let successMessage = response.message;
                
                if (response.cancellation && parseFloat(response.cancellation.refundAmount) > 0) {
                  const refundAmount = parseFloat(response.cancellation.refundAmount);
                  successMessage += `\n\nRefund of $${refundAmount.toFixed(2)} will arrive in 3-5 business days.`;
                  
                  if (parseFloat(response.cancellation.penaltyAmount) > 0) {
                    const penaltyAmount = parseFloat(response.cancellation.penaltyAmount);
                    successMessage += `\nCancellation fee: $${penaltyAmount.toFixed(2)}`;
                  }
                }
                
                Alert.alert(successTitle, successMessage, [
                  { 
                    text: 'OK', 
                    onPress: () => router.back() 
                  }
                ]);
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel booking');
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking';
              Alert.alert('Error', errorMessage);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStartChat = async () => {
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

  const getStatusColor = (bookingStatus: string, approvalStatus?: string) => {
    switch (bookingStatus) {
      case 'pending':
        return approvalStatus === 'approved' ? (isDark ? '#FFB74D' : '#FFA500') : (isDark ? '#CE93D8' : '#9C27B0');
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

  const getStatusText = (bookingStatus: string, approvalStatus?: string) => {
    switch (bookingStatus) {
      case 'pending':
        // Differentiate between waiting for approval vs waiting for confirmation
        return approvalStatus === 'approved' ? 'Approved - Pending Confirmation' : 'Pending Approval';
      case 'confirmed':
      case 'paid':
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

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.activityIndicator.primary} />
          <Text className={`${theme.textSecondary} mt-4`}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background}`}>
        <View className="flex-1 justify-center items-center px-6">
          <Text className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>
            Booking not found
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

  if (showPayment && booking.bookingStatus === 'pending') {
    return (
      <SafeAreaView className={`flex-1 ${theme.background}`}>
          <View className="flex-1 px-6 py-6">
            {/* Header */}
            <View className="pt-6 pb-4 px-4">
              <View className="flex-row items-center mb-6 px-5 py-5">
                <TouchableOpacity
                  onPress={() => setShowPayment(false)}
                  className="w-12 h-12 items-center justify-center mr-4 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
                  activeOpacity={0.7}
                >
                  <Feather name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
                <Text className={`text-xl font-semibold ${theme.textPrimary} flex-1`}>
                  Confirm Booking
                </Text>
              </View>
            </View>

            {/* Payment Information */}
            <View className={`${theme.card} rounded-2xl p-5 mb-6`} style={{
              shadowColor: isDark ? '#000' : '#000', 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: isDark ? 0.3 : 0.1, 
              shadowRadius: 12 
            }}>
              <Text className={`text-base font-semibold ${theme.textPrimary} mb-4`}>
                Booking Summary
              </Text>
              <View className="space-y-3">
                <View>
                  <Text className={`${theme.textSecondary} mb-2 font-medium text-sm`}>Route</Text>
                  <View className="rounded-xl p-3" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}>
                    <View className="flex-row items-center mb-1">
                      <View className="w-2.5 h-2.5 bg-orange-500 rounded-full mr-3" />
                      <Text className={`${theme.textPrimary} font-medium flex-1 text-sm`}>
                        {booking.from}
                      </Text>
                    </View>
                    <View className={`ml-1.5 w-0.5 h-3 ${theme.border} mb-1`} />
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 bg-red-500 rounded-full mr-3" />
                      <Text className={`${theme.textPrimary} font-medium flex-1 text-sm`}>
                        {booking.to}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row">
                  <View className="flex-1 mr-4">
                    <Text className={`${theme.textSecondary} mb-2 font-medium text-sm`}>Date & Time</Text>
                    <Text className={`${theme.textPrimary} font-medium text-sm mb-1`}>
                      {formatDate(booking.departureTime)}
                    </Text>
                    <Text className={`${theme.textPrimary} font-medium text-sm`}>
                      {formatTime(booking.departureTime)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`${theme.textSecondary} mb-2 font-medium text-sm`}>Seats</Text>
                    <Text className={`${theme.textPrimary} font-medium text-sm`}>
                      {booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View className={`border-t ${theme.border} pt-4 mt-4`}>
                  <Text className={`${theme.textSecondary} text-sm mb-1 font-medium`}>Total Amount</Text>
                  <Text className={`text-2xl font-bold ${theme.textPrimary}`}>
                    {booking.currency} {booking.totalPaid.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <Payment
              fullName={user?.fullName || ''}
              email={user?.emailAddresses[0]?.emailAddress || ''}
              amount={(booking.pricePerSeat * booking.seatsBooked).toString()}
              rideId={booking.rideId}
              bookingId={booking.bookingId}
              rideTime={new Date(booking.departureTime).getTime()}
              seatsRequested={booking.seatsBooked}
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
                    Booking Details
                  </Text>
                  <Text className={`${theme.textSecondary} text-sm font-medium mt-1`}>
                    ID: {booking.bookingId.slice(-8).toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View className="ml-3">
                <View
                  className="px-4 py-2.5 rounded-full"
                  style={{ 
                    backgroundColor: getStatusColor(booking.bookingStatus, booking.approvalStatus) + (isDark ? '25' : '15'),
                    borderWidth: 1,
                    borderColor: getStatusColor(booking.bookingStatus, booking.approvalStatus) + (isDark ? '50' : '30')
                  }}
                >
                  <Text
                    className="text-xs font-bold text-center"
                    style={{ color: getStatusColor(booking.bookingStatus, booking.approvalStatus) }}
                  >
                    {getStatusText(booking.bookingStatus, booking.approvalStatus)}
                  </Text>
                </View>
              </View>
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
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#DDD6FE' }}>
              <Text className="text-xs font-semibold" style={{ color: isDark ? '#F97316' : '#EA580C' }}>
                {Math.round(Math.random() * 20 + 10)} km
              </Text>
            </View>
          </View>
          
          <View className="space-y-4">
            <View className="flex-row items-center">
              <Feather name="map-pin" size={18} color={isDark ? '#F97316' : '#EA580C'} style={{ marginRight: 16 }} />
              <View className="flex-1">
                <Text className={`${theme.textSecondary} text-xs font-medium mb-1`}>PICKUP</Text>
                <Text className={`${theme.textPrimary} font-semibold text-base`}>
                  {booking.from}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center pl-1">
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
              <Feather name="navigation" size={18} color={isDark ? '#EF4444' : '#DC2626'} style={{ marginRight: 16 }} />
              <View className="flex-1">
                <Text className={`${theme.textSecondary} text-xs font-medium mb-1`}>DESTINATION</Text>
                <Text className={`${theme.textPrimary} font-semibold text-base`}>
                  {booking.to}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Trip Details */}
        <View className={`${theme.card} mx-6 mt-4 rounded-2xl p-6`}
              style={{
                shadowColor: isDark ? '#000' : '#000', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: isDark ? 0.4 : 0.08, 
                shadowRadius: 12,
                elevation: isDark ? 8 : 4
              }}>
          <Text className={`text-lg font-bold ${theme.textPrimary} mb-5`}>Trip Information</Text>
          
          <View className="space-y-5">
            {/* Date & Time Row */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-6">
                <View className="flex-row items-center mb-2">
                  <Feather name="calendar" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>DATE</Text>
                    <Text className={`${theme.textPrimary} font-semibold text-sm`} numberOfLines={2}>
                      {formatDate(booking.departureTime)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Feather name="clock" size={20} color={isDark ? '#F97316' : '#EA580C'} style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>TIME</Text>
                    <Text className={`${theme.textPrimary} font-semibold text-base`}>
                      {formatTime(booking.departureTime)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Seats & Price Row */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="users" size={20} color={isDark ? '#FB923C' : '#F97316'} style={{ marginRight: 12 }} />
                  <View>
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>SEATS</Text>
                    <Text className={`${theme.textPrimary} font-semibold text-base`}>
                      {booking.seatsBooked} {booking.seatsBooked > 1 ? 'seats' : 'seat'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Feather name="dollar-sign" size={20} color={isDark ? '#F97316' : '#EA580C'} style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>
                      {booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed' ? 'AMOUNT' : 'TOTAL PAID'}
                    </Text>
                    {fareSplitInfo?.hasFareSplitting && (
                      <Text className={`${theme.textSecondary} text-xs line-through`}>
                        {booking.currency} {fareSplitInfo.originalPrice.toFixed(2)}
                      </Text>
                    )}
                    <Text className={`${theme.textPrimary} font-bold text-lg`}>
                      {booking.currency} {booking.totalPaid.toFixed(2)}
                    </Text>
                    {fareSplitInfo?.hasFareSplitting && (
                      <View className="mt-1">
                        <View className="px-2 py-1 rounded-full self-start" 
                              style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#DCFCE7' }}>
                          <Text className="text-xs font-bold" style={{ color: isDark ? '#F97316' : '#EA580C' }}>
                            Saved {booking.currency} {fareSplitInfo.savings.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Fare Splitting Information */}
        {fareSplitInfo?.hasFareSplitting && (
          <View className="mx-6 mt-4 rounded-2xl p-6" 
                style={{ 
                  backgroundColor: theme.card.backgroundColor,
                  shadowColor: isDark ? '#000' : '#000', 
                  shadowOffset: { width: 0, height: 4 }, 
                  shadowOpacity: isDark ? 0.4 : 0.08, 
                  shadowRadius: 12,
                  elevation: isDark ? 8 : 4
                }}>
            <View className="flex-row items-center justify-between mb-5">
              <Text className={`text-lg font-bold ${theme.textPrimary}`}>Fare Splitting Details</Text>
              <View className="px-3 py-1.5 rounded-full" 
                    style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(34, 197, 94, 0.15)' }}>
                <Text className="text-xs font-bold" style={{ color: isDark ? '#F97316' : '#EA580C' }}>
                  Savings Applied
                </Text>
              </View>
            </View>
            
            <View className="mb-5">
              <View className="flex-row items-center mb-3">
                <Feather name="users" size={20} color={isDark ? '#F97316' : '#EA580C'} style={{ marginRight: 16 }} />
                <View className="flex-1">
                  <Text className={`${theme.textSecondary} text-xs font-medium`}>PASSENGERS SHARING</Text>
                  <Text className={`${theme.textPrimary} font-semibold text-base`}>
                    {fareSplitInfo.totalPassengers} passengers
                  </Text>
                </View>
              </View>
            </View>
            
            <View className="rounded-xl p-5" 
                  style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.05)' }}>
              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className={`${theme.textSecondary} font-medium text-sm`}>Original Price</Text>
                  <Text className={`${theme.textSecondary} font-medium text-sm line-through`}>
                    {booking.currency} {fareSplitInfo.originalPrice.toFixed(2)}
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <Text className={`${theme.textPrimary} font-semibold text-base`}>Your Share</Text>
                  <Text className={`${theme.textPrimary} font-bold text-lg`}>
                    {booking.currency} {booking.totalPaid.toFixed(2)}
                  </Text>
                </View>
                
                <View className={`border-t pt-3 mt-3`} style={{ borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)' }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Feather name="trending-down" size={16} color={isDark ? '#F97316' : '#EA580C'} style={{ marginRight: 6 }} />
                      <Text className="font-bold text-base" style={{ color: isDark ? '#F97316' : '#EA580C' }}>Total Savings</Text>
                    </View>
                    <Text className="font-bold text-lg" style={{ color: isDark ? '#F97316' : '#EA580C' }}>
                      {booking.currency} {fareSplitInfo.savings.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Enhanced Driver Information */}
        <View className={`${theme.card} mx-6 mt-4 rounded-2xl p-6`}
              style={{
                shadowColor: isDark ? '#000' : '#000', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: isDark ? 0.4 : 0.08, 
                shadowRadius: 12,
                elevation: isDark ? 8 : 4
              }}>
          <Text className={`text-lg font-bold ${theme.textPrimary} mb-5`}>Driver Information</Text>
          
          <View className="flex-row items-center">
            <View className="relative">
              <Image
                source={{ 
                  uri: booking.driver.avatar || 'https://via.placeholder.com/60x60' 
                }}
                className="w-16 h-16 rounded-2xl"
                style={{ 
                  borderWidth: 3,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }}
              />
              {/* Status indicator */}
              <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2" 
                    style={{ 
                      backgroundColor: '#F97316',
                      borderColor: isDark ? '#1A1A1A' : '#FFFFFF'
                    }} />
            </View>
            
            <View className="flex-1 ml-4">
              <Text className={`${theme.textPrimary} font-bold text-lg mb-1`}>
                {formatUserName(booking.driver, 'full')}
              </Text>
              
              <View className="flex-row items-center mb-2">
                <View className="flex-row items-center mr-4">
                  <View className="w-5 h-5 rounded-full items-center justify-center mr-2" 
                        style={{ backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }}>
                    <Text className="text-xs font-bold" style={{ color: isDark ? '#FCD34D' : '#F59E0B' }}>★</Text>
                  </View>
                  <Text className={`${theme.textPrimary} font-semibold text-sm`}>
                    {booking.driver.rating.toFixed(1)}
                  </Text>
                </View>
                
                {booking.vehicle && (
                  <View className="flex-1">
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>VEHICLE</Text>
                    <Text className={`${theme.textPrimary} font-medium text-sm`}>
                      {booking.vehicle.displayName}
                    </Text>
                    <Text className={`${theme.textSecondary} text-xs font-medium`}>
                      {booking.vehicle.plate}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Enhanced Chat Button */}
            {(booking.bookingStatus === 'paid' || booking.bookingStatus === 'completed') && (
              <TouchableOpacity
                onPress={handleStartChat}
                className="w-12 h-12 rounded-2xl items-center justify-center ml-2"
                style={{ 
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="chat-bubble-outline" size={22} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Enhanced Action Buttons */}
        <View className="px-6 pb-8">
          {booking.bookingStatus === 'pending' && booking.approvalStatus === 'approved' && (
            <View className="mb-3">
              <TouchableOpacity
                onPress={() => setShowPayment(true)}
                className="w-full flex-row items-center justify-center py-3 px-4 rounded-lg"
                style={{
                  backgroundColor: '#3B82F6',
                  borderWidth: 1,
                  borderColor: '#2563EB'
                }}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Feather
                  name="credit-card"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text
                  className="font-semibold text-base text-white"
                >
                  Confirm Booking
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {(booking.bookingStatus === 'paid' || booking.bookingStatus === 'confirmed') && (
            <View className="mb-3">
              <TouchableOpacity
                onPress={handleStartChat}
                className="w-full flex-row items-center justify-center py-3 px-4 rounded-lg"
                style={{
                  backgroundColor: '#F97316',
                  borderWidth: 1,
                  borderColor: '#EA580C'
                }}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="chat-bubble-outline"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text
                  className="font-semibold text-base text-white"
                >
                  Message Driver
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {(booking.bookingStatus === 'pending' || booking.bookingStatus === 'paid' || booking.bookingStatus === 'confirmed') && (
            <View>
              <TouchableOpacity
                onPress={handleCancelBooking}
                className="w-full flex-row items-center justify-center py-3 px-4 rounded-lg"
                style={{
                  backgroundColor: canCancelBookingHelper() 
                    ? '#EF4444' 
                    : (isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(156, 163, 175, 0.3)'),
                  borderWidth: 1,
                  borderColor: canCancelBookingHelper() 
                    ? '#DC2626' 
                    : (isDark ? 'rgba(107, 114, 128, 0.5)' : 'rgba(156, 163, 175, 0.5)')
                }}
                disabled={actionLoading || !canCancelBookingHelper()}
                activeOpacity={0.8}
              >
                <Feather 
                  name={actionLoading ? "loader" : "x-circle"} 
                  size={16} 
                  color={canCancelBookingHelper() 
                    ? '#FFFFFF' 
                    : (isDark ? '#9CA3AF' : '#6B7280')} 
                  style={{ marginRight: 6 }} 
                />
                <Text 
                  className="font-semibold text-base"
                  style={{ color: canCancelBookingHelper() 
                    ? '#FFFFFF' 
                    : (isDark ? '#9CA3AF' : '#6B7280') }}
                >
                  {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </TouchableOpacity>
              {!canCancelBookingHelper() && (
                <View className="mt-3 px-4 py-2 rounded-lg" 
                      style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
                  <Text className="text-xs text-center font-medium" 
                        style={{ color: isDark ? '#F87171' : '#DC2626' }}>
                    Cannot cancel - ride departed over 30 minutes ago
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetails;