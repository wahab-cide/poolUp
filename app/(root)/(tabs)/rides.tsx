import CustomButton from '@/components/CustomButton';
import RatingModal from '@/components/RatingModal';
import SkeletonBookingCard from '@/components/SkeletonBookingCard';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/fetch';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatUserName } from '@/lib/utils';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

interface RideData {
  bookingId: string;
  rideId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime?: string;
  bookingDate: string;
  lastUpdated: string;
  completedAt?: string;
  seatsBooked: number;
  pricePerSeat: number;
  totalPaid: number;
  currency: string;
  bookingStatus: 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rideStatus: 'open' | 'full' | 'matched' | 'completed' | 'cancelled' | 'expired';
  rideCompletedAt?: string;
  autoCompleted?: boolean;
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
  rating?: {
    hasRatedDriver: boolean;
    userDriverRating?: number;
    ratingSubmitted: boolean;
    canRate: boolean;
  };
}

interface RideRequestData {
  requestId: string;
  from: string;
  to: string;
  departureTime: string;
  seatsRequested: number;
  maxPricePerSeat: number;
  currency: string;
  requestStatus: 'pending' | 'has_offers' | 'matched' | 'cancelled' | 'expired';
  createdAt: string;
  lastUpdated: string;
  coordinates: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
  };
  offers?: {
    offerId: string;
    driverId: string;
    driverName: string;
    driverAvatar?: string;
    driverRating: number;
    pricePerSeat: number;
    vehicle: {
      make: string;
      model: string;
      year: number;
      color: string;
      plate: string;
    };
    createdAt: string;
  }[];
}

interface DirectRideRequest {
  id: string;
  type: 'sent';
  origin: string;
  destination: string;
  requestedDateTime: string;
  seatsRequested: number;
  message: string | null;
  status: 'pending' | 'driver_quoted' | 'confirmed' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  price: number | null;
  maxPricePerSeat?: number | null;
  driverQuotedPrice?: number | null;
  createdAt: string;
  otherUser: {
    clerkId: string;
    name: string;
    avatarUrl: string | null;
    rating: number | null;
  };
}


const Rides = () => {
  // Move all hooks to the top of the component
  const { user } = useUser();
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const [rides, setRides] = useState<RideData[]>([]);
  const [requests, setRequests] = useState<RideRequestData[]>([]);
  const [directRequests, setDirectRequests] = useState<DirectRideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'requests'>('bookings');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRideForRating, setSelectedRideForRating] = useState<RideData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [respondingToQuote, setRespondingToQuote] = useState<string | null>(null);
  const [bookingRequestId, setBookingRequestId] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching rides for user:', user.id);
      const data = await fetchAPI(`/api/rides/user/${user.id}`);

      console.log('Rides API response:', data);

      if (data.success) {
        setRides(data.rides);
      } else {
        console.error('Failed to fetch rides:', data.error);
        Alert.alert('Error', data.error || 'Failed to fetch your rides');
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      Alert.alert('Error', 'Failed to fetch your rides');
    }
  }, [user?.id]);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching ride requests for user:', user.id);
      const data = await fetchAPI(`/api/requests/user/${user.id}`);

      console.log('Requests API response:', data);

      if (data.success) {
        setRequests(data.requests);
      } else {
        console.error('Failed to fetch requests:', data.error);
        Alert.alert('Error', data.error || 'Failed to fetch your ride requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to fetch your ride requests');
    }
  }, [user?.id]);

  const fetchDirectRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching direct ride requests for user:', user.id);
      const data = await fetchAPI(`/api/ride-requests?clerkId=${user.id}&type=sent`);

      console.log('Direct requests API response:', data);

      if (data.success) {
        setDirectRequests(data.requests || []);
      } else {
        console.error('Failed to fetch direct requests:', data.error);
      }
    } catch (error) {
      console.error('Error fetching direct requests:', error);
    }
  }, [user?.id]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchRides(), fetchRequests(), fetchDirectRequests()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchRides, fetchRequests, fetchDirectRequests]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const getStatusColor = (bookingStatus: string, approvalStatus?: string) => {
    switch (bookingStatus) {
      case 'pending':
        return approvalStatus === 'approved' ? '#FFA500' : '#9C27B0';
      case 'paid':
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'completed':
        return '#2196F3'; // Blue
      case 'cancelled':
        return '#F44336'; // Red
      case 'expired':
        return '#FF9800'; // Orange
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusText = (bookingStatus: string, approvalStatus?: string) => {
    switch (bookingStatus) {
      case 'pending':
        // Differentiate between waiting for approval vs waiting for payment
        return approvalStatus === 'approved' ? 'Awaiting Confirmation' : 'Pending Approval';
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

  const getRequestStatusColor = (requestStatus: string) => {
    switch (requestStatus) {
      case 'pending':
        return '#9C27B0'; // Purple
      case 'has_offers':
        return '#FF9800'; // Orange
      case 'matched':
        return '#4CAF50'; // Green
      case 'cancelled':
        return '#F44336'; // Red
      case 'expired':
        return '#FF9800'; // Orange
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getRequestStatusText = (requestStatus: string) => {
    switch (requestStatus) {
      case 'pending':
        return 'Waiting for offers';
      case 'has_offers':
        return 'Has offers';
      case 'matched':
        return 'Matched';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const getDirectRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#9C27B0'; // Purple
      case 'driver_quoted':
        return '#FF9800'; // Orange - needs action
      case 'confirmed':
      case 'accepted':
        return '#4CAF50'; // Green
      case 'declined':
        return '#F44336'; // Red
      case 'expired':
        return '#FF9800'; // Orange
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getDirectRequestStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting for driver';
      case 'driver_quoted':
        return 'Quote received';
      case 'confirmed':
      case 'accepted':
        return 'Confirmed';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const handleRidePress = (ride: RideData) => {
    // Navigate to booking details screen with fare splitting data
    try {
      if (router) {
        const params = new URLSearchParams({
          bookingId: ride.bookingId,
        });
        
        // Pass fare splitting data if available to avoid API call
        if (ride.fare_splitting_enabled !== undefined) {
          params.append('fareSplittingEnabled', ride.fare_splitting_enabled.toString());
        }
        
        // Pass other useful data to minimize API calls
        if (ride.rideId) {
          params.append('rideId', ride.rideId);
        }
        
        router.push(`/(root)/booking-details?${params.toString()}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleRateDriver = (ride: RideData) => {
    setSelectedRideForRating(ride);
    setShowRatingModal(true);
  };


  const handleRatingSuccess = () => {
    fetchRides(); // Refresh the rides list
  };

  const handleCancelRequest = (requestId: string, requestFrom: string, requestTo: string) => {
    // Prevent multiple cancel requests
    if (cancellingRequestId) return;

    Alert.alert(
      'Cancel Ride Request',
      `Are you sure you want to cancel your ride request from ${requestFrom} to ${requestTo}?`,
      [
        {
          text: 'No, Keep Request',
          style: 'cancel'
        },
        {
          text: 'Yes, Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingRequestId(requestId);
              console.log('Cancelling request:', requestId);
              
              const response = await fetchAPI(`/api/requests/${requestId}/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  clerkId: user?.id
                })
              });

              if (response.success) {
                Alert.alert('Success', 'Your ride request has been cancelled successfully.');
                // Refresh the requests list
                fetchRequests();
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel ride request');
              }
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel ride request. Please try again.');
            } finally {
              setCancellingRequestId(null);
            }
          }
        }
      ]
    );
  };

  const handleViewOffers = () => {
    Alert.alert(
      'View Offer Details',
      'Go to Bookings to view offer and driver details.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Go to Bookings',
          onPress: () => {
            setActiveTab('bookings');
          }
        }
      ]
    );
  };

  const handleEditRequest = (request: RideRequestData) => {
    try {
      // Navigate to post-ride form with edit mode and pre-filled data
      const editParams = new URLSearchParams({
        mode: 'edit',
        requestId: request.requestId,
        type: 'request',
        originLabel: request.from,
        originLat: request.coordinates.origin.latitude.toString(),
        originLng: request.coordinates.origin.longitude.toString(),
        destinationLabel: request.to,
        destinationLat: request.coordinates.destination.latitude.toString(),
        destinationLng: request.coordinates.destination.longitude.toString(),
        departureTime: request.departureTime,
        seatsRequired: request.seatsRequested.toString(),
        maxPricePerSeat: request.maxPricePerSeat.toString(),
        currency: request.currency
      });

      router.push(`/post-ride?${editParams.toString()}`);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate to edit form');
    }
  };

  const handleAcceptQuote = async (request: DirectRideRequest) => {
    if (!user?.id) return;

    const quotedPrice = request.driverQuotedPrice ? parseFloat(request.driverQuotedPrice.toString()) : null;
    const maxPrice = request.price || request.maxPricePerSeat;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice.toString()) : null;

    Alert.alert(
      'Accept Quote',
      `Driver ${request.otherUser.name} quoted $${quotedPrice?.toFixed(2)} per seat.\n\nYour maximum was $${maxPriceNum?.toFixed(2)}.\n\nDo you want to accept this quote?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Quote',
          style: 'default',
          onPress: async () => {
            try {
              setRespondingToQuote(request.id);
              console.log('Accepting quote for request:', request.id);

              const response = await fetchAPI(`/api/ride-requests/${request.id}/respond`, {
                method: 'PATCH',
                body: JSON.stringify({
                  requesterClerkId: user.id,
                  action: 'accept_quote'
                })
              });

              if (response.success) {
                Alert.alert('Success', response.message || 'Quote accepted successfully!');
                fetchDirectRequests();
              } else {
                Alert.alert('Error', response.error || 'Failed to accept quote');
              }
            } catch (error) {
              console.error('Error accepting quote:', error);
              Alert.alert('Error', 'Failed to accept quote. Please try again.');
            } finally {
              setRespondingToQuote(null);
            }
          }
        }
      ]
    );
  };

  const handleDeclineQuote = async (request: DirectRideRequest) => {
    if (!user?.id) return;

    const quotedPrice = request.driverQuotedPrice ? parseFloat(request.driverQuotedPrice.toString()) : null;

    Alert.alert(
      'Decline Quote',
      `Are you sure you want to decline the quote of $${quotedPrice?.toFixed(2)} from ${request.otherUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline Quote',
          style: 'destructive',
          onPress: async () => {
            try {
              setRespondingToQuote(request.id);
              console.log('Declining quote for request:', request.id);

              const response = await fetchAPI(`/api/ride-requests/${request.id}/respond`, {
                method: 'PATCH',
                body: JSON.stringify({
                  requesterClerkId: user.id,
                  action: 'decline_quote'
                })
              });

              if (response.success) {
                Alert.alert('Success', response.message || 'Quote declined');
                fetchDirectRequests();
              } else {
                Alert.alert('Error', response.error || 'Failed to decline quote');
              }
            } catch (error) {
              console.error('Error declining quote:', error);
              Alert.alert('Error', 'Failed to decline quote. Please try again.');
            } finally {
              setRespondingToQuote(null);
            }
          }
        }
      ]
    );
  };

  const handleCancelDirectRequest = async (request: DirectRideRequest) => {
    if (cancellingRequestId) return;

    Alert.alert(
      'Cancel Ride Request',
      `Are you sure you want to cancel your ride request to ${request.otherUser.name}?`,
      [
        { text: 'No, Keep Request', style: 'cancel' },
        {
          text: 'Yes, Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingRequestId(request.id);
              console.log('Cancelling direct request:', request.id);

              const response = await fetchAPI(`/api/ride-requests/${request.id}?requesterClerkId=${user?.id}`, {
                method: 'DELETE'
              });

              if (response.success) {
                Alert.alert('Success', 'Your ride request has been cancelled successfully.');
                fetchDirectRequests();
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel ride request');
              }
            } catch (error) {
              console.error('Error cancelling direct request:', error);
              Alert.alert('Error', 'Failed to cancel ride request. Please try again.');
            } finally {
              setCancellingRequestId(null);
            }
          }
        }
      ]
    );
  };

  const handleBookConfirmedRequest = async (request: DirectRideRequest) => {
    if (!user?.id || bookingRequestId) return;

    const finalPrice = request.driverQuotedPrice
      ? parseFloat(request.driverQuotedPrice.toString())
      : (request.price ? parseFloat(request.price.toString()) : 0);

    Alert.alert(
      'Complete Booking',
      `You're about to book this ride with ${request.otherUser.name}.\n\n` +
      `Route: ${request.origin} → ${request.destination}\n` +
      `Seats: ${request.seatsRequested}\n` +
      `Price: $${finalPrice.toFixed(2)} per seat\n` +
      `Total: $${(finalPrice * request.seatsRequested).toFixed(2)}\n\n` +
      `After booking, coordinate payment details with your driver.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Booking',
          style: 'default',
          onPress: async () => {
            try {
              setBookingRequestId(request.id);
              console.log('Creating booking for confirmed request:', request.id);

              const response = await fetchAPI(`/api/ride-requests/${request.id}/book`, {
                method: 'POST',
                body: JSON.stringify({
                  requesterClerkId: user.id
                })
              });

              if (response.success) {
                // Immediately remove the request from the list or update it
                setDirectRequests(prevRequests =>
                  prevRequests.filter(r => r.id !== request.id)
                );

                Alert.alert(
                  'Booking Created!',
                  'Your ride has been booked successfully. Coordinate payment with your driver.',
                  [
                    {
                      text: 'View Booking',
                      onPress: () => {
                        // Navigate to booking details
                        router.push(`/(root)/booking-details?bookingId=${response.booking.id}`);
                      }
                    }
                  ]
                );
                // Refresh both bookings and requests
                fetchRides();
                fetchDirectRequests();
              } else {
                Alert.alert('Error', response.error || 'Failed to create booking');
              }
            } catch (error) {
              console.error('Error creating booking:', error);
              Alert.alert('Error', 'Failed to create booking. Please try again.');
            } finally {
              setBookingRequestId(null);
            }
          }
        }
      ]
    );
  };

  const filteredRides = rides.filter(ride => {
    switch (filterType) {
      case 'upcoming':
        return ['pending', 'paid', 'confirmed'].includes(ride.bookingStatus) && 
               new Date(ride.departureTime) > new Date();
      case 'completed':
        return ride.bookingStatus === 'completed';
      case 'cancelled':
        return ride.bookingStatus === 'cancelled' || ride.bookingStatus === 'expired';
      default:
        return true;
    }
  });

  const getFilterCounts = () => {
    const upcoming = rides.filter(ride => 
      ['pending', 'paid', 'confirmed'].includes(ride.bookingStatus) && 
      new Date(ride.departureTime) > new Date()
    ).length;
    const completed = rides.filter(ride => ride.bookingStatus === 'completed').length;
    const cancelled = rides.filter(ride => 
      ride.bookingStatus === 'cancelled' || ride.bookingStatus === 'expired'
    ).length;
    
    return { upcoming, completed, cancelled, all: rides.length };
  };

  const renderRideCard = ({ item }: { item: RideData }) => {
    const isPendingPayment = item.bookingStatus === 'pending' && item.approvalStatus === 'approved';
    
    return (
      <TouchableOpacity
        onPress={() => handleRidePress(item)}
        className={`${styles.card} rounded-xl p-5 mb-4 mx-4`}
        style={{ 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 2 }, 
          shadowOpacity: 0.08, 
          shadowRadius: 8, 
          elevation: 4 
        }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View
            className="px-3 py-1 rounded-full flex-row items-center"
            style={{ backgroundColor: getStatusColor(item.bookingStatus, item.approvalStatus) + '15' }}
          >
            <Ionicons
              name={item.bookingStatus === 'completed' ? 'checkmark-circle' :
                    item.bookingStatus === 'paid' || item.bookingStatus === 'confirmed' ? 'checkmark-done' :
                    item.bookingStatus === 'cancelled' ? 'close-circle' :
                    item.bookingStatus === 'expired' ? 'time-outline' : 'time'}
              size={12}
              color={getStatusColor(item.bookingStatus, item.approvalStatus)}
            />
            <Text
              className="text-xs font-bold ml-1"
              style={{ color: getStatusColor(item.bookingStatus, item.approvalStatus) }}
            >
              {getStatusText(item.bookingStatus, item.approvalStatus)}
            </Text>
          </View>
          <Text className={`text-lg font-bold ${isDark ? 'text-dark-brand-green' : 'text-green-700'}`}>
            {item.currency} {item.totalPaid.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row items-center mb-3">
          <View className="flex-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
              {item.from}
            </Text>
          </View>
          <View className="mx-2">
            <Ionicons name="arrow-forward" size={14} color={isDark ? '#666' : '#9CA3AF'} />
          </View>
          <View className="flex-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
              {item.to}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full mr-2 overflow-hidden">
              {item.driver.avatar ? (
                <Image
                  source={{ uri: item.driver.avatar }}
                  className="w-8 h-8"
                  style={{ resizeMode: 'cover' }}
                />
              ) : (
                <View className={`w-8 h-8 ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'} items-center justify-center`}>
                  <Text className="text-white font-bold text-xs">
                    {formatUserName(item.driver, 'full').charAt(0)}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className={`text-sm font-medium ${styles.textPrimary}`} numberOfLines={1}>
                {formatUserName(item.driver, 'full')}
              </Text>
              {item.driver.rating && (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={10} color="#FFA500" />
                  <Text className="text-xs text-yellow-600 ml-1">
                    {item.driver.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View className="items-end">
            <Text className={`text-xs font-medium ${styles.textSecondary}`}>
              {formatDate(item.departureTime)}
            </Text>
            <Text className={`text-xs ${styles.textSecondary}`}>
              {formatTime(item.departureTime)}
            </Text>
          </View>
        </View>

        {isPendingPayment && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRidePress(item);
              }}
              className="bg-orange-500 rounded-lg py-2 px-4 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={14} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.rating?.canRate && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRateDriver(item);
              }}
              className="bg-yellow-500 rounded-lg py-2 px-4 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Feather name="star" size={14} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">Rate Driver</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.rating?.hasRatedDriver && item.rating?.userDriverRating && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <View className="flex-row items-center justify-center">
              <View className="flex-row items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Feather
                    key={star}
                    name="star"
                    size={12}
                    color={star <= (item.rating?.userDriverRating || 0) ? '#FFD700' : '#E5E5E5'}
                    style={{ marginRight: 1 }}
                  />
                ))}
              </View>
              <Text className={`font-medium ml-2 text-xs ${styles.textSecondary}`}>You rated this ride</Text>
            </View>
          </View>
        )}

      </TouchableOpacity>
    );
  };

  const renderRequestCard = ({ item }: { item: RideRequestData }) => {
    const hasOffers = item.offers && item.offers.length > 0;
    
    return (
      <TouchableOpacity
        onPress={() => {
          // TODO: Navigate to request details screen
          console.log('Request card pressed:', item.requestId);
        }}
        className={`${styles.card} rounded-xl p-5 mb-4 mx-4`}
        style={{ 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 2 }, 
          shadowOpacity: 0.08, 
          shadowRadius: 8, 
          elevation: 4 
        }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View
            className="px-3 py-1 rounded-full flex-row items-center"
            style={{ backgroundColor: getRequestStatusColor(item.requestStatus) + '15' }}
          >
            <Ionicons 
              name={item.requestStatus === 'matched' ? 'checkmark-circle' : 
                    item.requestStatus === 'has_offers' ? 'notifications' : 
                    item.requestStatus === 'cancelled' ? 'close-circle' : 
                    item.requestStatus === 'expired' ? 'time-outline' : 'hourglass'} 
              size={12} 
              color={getRequestStatusColor(item.requestStatus)} 
            />
            <Text
              className="text-xs font-bold ml-1"
              style={{ color: getRequestStatusColor(item.requestStatus) }}
            >
              {getRequestStatusText(item.requestStatus)}
            </Text>
          </View>
          <Text className={`text-lg font-bold ${isDark ? 'text-dark-brand-green' : 'text-green-700'}`}>
            Up to {item.currency} {item.maxPricePerSeat.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row items-center mb-3">
          <View className="flex-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
              {item.from}
            </Text>
          </View>
          <View className="mx-2">
            <Ionicons name="arrow-forward" size={14} color={isDark ? '#666' : '#9CA3AF'} />
          </View>
          <View className="flex-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
              {item.to}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="people" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`text-sm font-medium ml-2 ${styles.textSecondary}`}>
              {item.seatsRequested} seat{item.seatsRequested > 1 ? 's' : ''} needed
            </Text>
          </View>
          <View className="items-end">
            <Text className={`text-xs font-medium ${styles.textSecondary}`}>
              {formatDate(item.departureTime)}
            </Text>
            <Text className={`text-xs ${styles.textSecondary}`}>
              {formatTime(item.departureTime)}
            </Text>
          </View>
        </View>

        {hasOffers && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-sm font-semibold ${styles.textPrimary}`}>
                {item.offers!.length} offer{item.offers!.length > 1 ? 's' : ''} received
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleViewOffers();
                }}
                className="bg-orange-500 rounded-lg py-2 px-4 flex-row items-center"
                activeOpacity={0.8}
              >
                <Ionicons name="eye" size={14} color="white" />
                <Text className="text-white font-semibold ml-2 text-sm">View Offers</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {item.requestStatus === 'pending' && (
          <View className="mt-3 pt-3 border-t flex-row gap-3" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleCancelRequest(item.requestId, item.from, item.to);
              }}
              className={`flex-1 rounded-lg py-2 px-4 flex-row items-center justify-center ${
                cancellingRequestId === item.requestId ? 'bg-red-400' : 'bg-red-500'
              }`}
              activeOpacity={0.8}
              disabled={cancellingRequestId === item.requestId}
            >
              {cancellingRequestId === item.requestId ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="close" size={14} color="white" />
              )}
              <Text className="text-white font-semibold ml-2 text-sm">
                {cancellingRequestId === item.requestId ? 'Cancelling...' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleEditRequest(item);
              }}
              className="flex-1 bg-blue-500 rounded-lg py-2 px-4 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="create" size={14} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDirectRequestCard = ({ item }: { item: DirectRideRequest }) => {
    const riderMaxPrice = item.price || item.maxPricePerSeat;
    const riderMaxPriceNum = riderMaxPrice ? parseFloat(riderMaxPrice.toString()) : null;
    const driverQuotedPriceNum = item.driverQuotedPrice ? parseFloat(item.driverQuotedPrice.toString()) : null;
    const isQuoted = item.status === 'driver_quoted';
    const isConfirmed = item.status === 'confirmed' || item.status === 'accepted';
    const isDeclined = item.status === 'declined';
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity
        onPress={() => {
          console.log('Direct request card pressed:', item.id);
        }}
        className={`${styles.card} rounded-xl p-5 mb-4 mx-4`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View
            className="px-3 py-1 rounded-full flex-row items-center"
            style={{ backgroundColor: getDirectRequestStatusColor(item.status) + '15' }}
          >
            <Ionicons
              name={isConfirmed ? 'checkmark-circle' :
                    isQuoted ? 'alert-circle' :
                    isDeclined ? 'close-circle' :
                    item.status === 'expired' ? 'time-outline' :
                    item.status === 'cancelled' ? 'close-circle' : 'hourglass'}
              size={12}
              color={getDirectRequestStatusColor(item.status)}
            />
            <Text
              className="text-xs font-bold ml-1"
              style={{ color: getDirectRequestStatusColor(item.status) }}
            >
              {getDirectRequestStatusText(item.status)}
            </Text>
          </View>

          {/* Price Display */}
          {isQuoted && driverQuotedPriceNum && (
            <View className="items-end">
              <Text className={`text-base font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                ${driverQuotedPriceNum.toFixed(2)}
              </Text>
              <Text className={`text-xs ${styles.textSecondary}`}>
                quoted (max: ${riderMaxPriceNum?.toFixed(2)})
              </Text>
            </View>
          )}
          {(isConfirmed && driverQuotedPriceNum) && (
            <View className="items-end">
              <Text className={`text-lg font-bold ${isDark ? 'text-dark-brand-green' : 'text-green-700'}`}>
                ${driverQuotedPriceNum.toFixed(2)}
              </Text>
              <Text className={`text-xs ${styles.textSecondary}`}>confirmed price</Text>
            </View>
          )}
          {(isPending && riderMaxPriceNum) && (
            <View className="items-end">
              <Text className={`text-lg font-bold ${isDark ? 'text-dark-brand-green' : 'text-green-700'}`}>
                Up to ${riderMaxPriceNum.toFixed(2)}
              </Text>
              <Text className={`text-xs ${styles.textSecondary}`}>max price/seat</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View className="flex-row items-center mb-3">
          <View className="flex-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
              {item.origin}
            </Text>
          </View>
          <View className="mx-2">
            <Ionicons name="arrow-forward" size={14} color={isDark ? '#666' : '#9CA3AF'} />
          </View>
          <View className="flex-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
              {item.destination}
            </Text>
          </View>
        </View>

        {/* Driver and Details */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full mr-2 overflow-hidden">
              {item.otherUser.avatarUrl ? (
                <Image
                  source={{ uri: item.otherUser.avatarUrl }}
                  className="w-8 h-8"
                  style={{ resizeMode: 'cover' }}
                />
              ) : (
                <View className={`w-8 h-8 ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'} items-center justify-center`}>
                  <Text className="text-white font-bold text-xs">
                    {item.otherUser.name.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className={`text-sm font-medium ${styles.textPrimary}`} numberOfLines={1}>
                {item.otherUser.name}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="people" size={10} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text className={`text-xs ml-1 ${styles.textSecondary}`}>
                  {item.seatsRequested} seat{item.seatsRequested > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            <Text className={`text-xs font-medium ${styles.textSecondary}`}>
              {formatDate(item.requestedDateTime)}
            </Text>
            <Text className={`text-xs ${styles.textSecondary}`}>
              {formatTime(item.requestedDateTime)}
            </Text>
          </View>
        </View>

        {/* Quote Response Actions */}
        {isQuoted && (
          <View className="mt-3 pt-3 border-t flex-row gap-3" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeclineQuote(item);
              }}
              className={`flex-1 rounded-lg py-2 px-4 flex-row items-center justify-center ${
                respondingToQuote === item.id ? 'bg-red-400' : 'bg-red-500'
              }`}
              activeOpacity={0.8}
              disabled={respondingToQuote === item.id}
            >
              {respondingToQuote === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="close" size={14} color="white" />
              )}
              <Text className="text-white font-semibold ml-2 text-sm">
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleAcceptQuote(item);
              }}
              className={`flex-1 rounded-lg py-2 px-4 flex-row items-center justify-center ${
                respondingToQuote === item.id ? 'bg-green-400' : 'bg-green-500'
              }`}
              activeOpacity={0.8}
              disabled={respondingToQuote === item.id}
            >
              {respondingToQuote === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
              <Text className="text-white font-semibold ml-2 text-sm">
                Accept ${driverQuotedPriceNum?.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel Action for Pending */}
        {isPending && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleCancelDirectRequest(item);
              }}
              className={`rounded-lg py-2 px-4 flex-row items-center justify-center ${
                cancellingRequestId === item.id ? 'bg-red-400' : 'bg-red-500'
              }`}
              activeOpacity={0.8}
              disabled={cancellingRequestId === item.id}
            >
              {cancellingRequestId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="close" size={14} color="white" />
              )}
              <Text className="text-white font-semibold ml-2 text-sm">
                {cancellingRequestId === item.id ? 'Cancelling...' : 'Cancel Request'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Complete Booking Action for Confirmed Requests */}
        {isConfirmed && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleBookConfirmedRequest(item);
              }}
              className={`rounded-lg py-3 px-4 flex-row items-center justify-center ${
                bookingRequestId === item.id ? 'bg-green-400' : 'bg-green-500'
              }`}
              activeOpacity={0.8}
              disabled={bookingRequestId === item.id}
            >
              {bookingRequestId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark-circle" size={16} color="white" />
              )}
              <Text className="text-white font-bold ml-2 text-base">
                {bookingRequestId === item.id
                  ? 'Creating Booking...'
                  : `Complete Booking · $${driverQuotedPriceNum?.toFixed(2) || '0.00'}`
                }
              </Text>
            </TouchableOpacity>
            <Text className={`text-xs text-center mt-2 ${styles.textSecondary}`}>
              Total: ${((driverQuotedPriceNum || 0) * item.seatsRequested).toFixed(2)} ({item.seatsRequested} seat{item.seatsRequested > 1 ? 's' : ''})
            </Text>
          </View>
        )}

        {/* Message */}
        {item.message && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <Text className={`text-xs ${styles.textSecondary}`}>
              Message: {item.message}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'bookings') {
      return (
        <View className="flex-1 items-center justify-center px-6 pb-20">
          <Image 
            source={require('@/assets/images/no-bookings-yet.png')}
            style={{ width: 180, height: 180, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text className={`text-2xl font-bold mb-2 ${styles.textPrimary}`}>
            No Bookings Yet
          </Text>
          <Text className={`text-center mb-6 text-base leading-6 ${styles.textSecondary}`}>
            When you book rides, they&apos;ll appear here. Start exploring available rides and make your first booking!
          </Text>
        </View>
      );
    } else {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-32 h-32 rounded-full items-center justify-center mb-6" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FEF3C7' }}>
            <Ionicons name="megaphone-outline" size={48} color="#F59E0B" />
          </View>
          <Text className={`text-2xl font-bold mb-3 ${styles.textPrimary}`}>
            No Ride Requests
          </Text>
          <Text className={`text-center mb-8 text-base leading-6 ${styles.textSecondary}`}>
            When you post ride requests, they&apos;ll appear here. Request a ride and let drivers make offers!
          </Text>
          <CustomButton
            title="Post A Request"
            onPress={() => {
              try {
                if (router) {
                  router.push('/post-ride?mode=request');
                }
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            bgVariant="primary"
            className="w-48"
            IconLeft={() => <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />}
          />
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="px-4 pt-6 pb-4">
          <Text className={`text-2xl font-bold ${styles.textPrimary} mb-1`}>
            My Rides
          </Text>
          <Text className={`${styles.textSecondary} text-sm`}>
            Track your bookings and requests
          </Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        >
          <SkeletonBookingCard />
          <SkeletonBookingCard />
          <SkeletonBookingCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <View className="flex-1">
        <View className="px-4 pt-6 pb-4">
          <Text className={`text-2xl font-bold ${styles.textPrimary} mb-1`}>
            My Rides
          </Text>
          <Text className={`${styles.textSecondary} text-sm`}>
            Track your bookings and requests
          </Text>
        </View>

        <View className="px-4 pb-2">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab('bookings')}
              className={`flex-1 py-3 ${
                activeTab === 'bookings' ? 'border-b-2' : 'border-b'
              }`}
              style={{
                borderBottomColor: activeTab === 'bookings' 
                  ? (isDark ? '#FFFFFF' : '#000000')
                  : (isDark ? '#374151' : '#E5E7EB')
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center">
                <Text className={`font-semibold ${
                  activeTab === 'bookings' 
                    ? (isDark ? 'text-white' : 'text-black') 
                    : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}>
                  Bookings
                </Text>
                {rides.length > 0 && (
                  <View className={`ml-2 px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {rides.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTab('requests')}
              className={`flex-1 py-3 ${
                activeTab === 'requests' ? 'border-b-2' : 'border-b'
              }`}
              style={{
                borderBottomColor: activeTab === 'requests'
                  ? (isDark ? '#FFFFFF' : '#000000')
                  : (isDark ? '#374151' : '#E5E7EB')
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center">
                <Text className={`font-semibold ${
                  activeTab === 'requests'
                    ? (isDark ? 'text-white' : 'text-black')
                    : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}>
                  Requests
                </Text>
                {(requests.length + directRequests.length) > 0 && (
                  <View className={`ml-2 px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {requests.length + directRequests.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'bookings' && (
          <View className="px-4 pb-3">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {[
                { key: 'all', label: 'All', count: getFilterCounts().all },
                { key: 'upcoming', label: 'Upcoming', count: getFilterCounts().upcoming },
                { key: 'completed', label: 'Completed', count: getFilterCounts().completed },
                { key: 'cancelled', label: 'Cancelled', count: getFilterCounts().cancelled }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setFilterType(filter.key as any)}
                  className={`mr-3 px-3 py-1.5 rounded-lg flex-row items-center ${
                    filterType === filter.key 
                      ? (isDark ? 'bg-white' : 'bg-black')
                      : ''
                  }`}
                  style={{
                    borderWidth: filterType !== filter.key ? 1 : 0,
                    borderColor: isDark ? '#374151' : '#E5E7EB'
                  }}
                  activeOpacity={0.7}
                >
                  <Text className={`font-medium text-sm ${
                    filterType === filter.key 
                      ? (isDark ? 'text-black' : 'text-white') 
                      : (isDark ? 'text-gray-400' : 'text-gray-600')
                  }`}>
                    {filter.label}
                  </Text>
                  {filter.count > 0 && (
                    <Text className={`ml-1 text-xs ${
                      filterType === filter.key 
                        ? (isDark ? 'text-black' : 'text-white') 
                        : (isDark ? 'text-gray-500' : 'text-gray-500')
                    }`}>
                      ({filter.count})
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={activeTab === 'bookings' ? filteredRides : [...requests, ...directRequests].sort((a, b) => {
            const dateA = 'requestId' in a ? new Date(a.createdAt) : new Date(a.createdAt);
            const dateB = 'requestId' in b ? new Date(b.createdAt) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })}
          renderItem={(props) => {
            if (activeTab === 'bookings') {
              return renderRideCard(props as { item: RideData });
            } else {
              // Check if it's a regular request or direct request
              const item = props.item;
              if ('requestId' in item) {
                return renderRequestCard(props as { item: RideRequestData });
              } else {
                return renderDirectRequestCard(props as { item: DirectRideRequest });
              }
            }
          }}
          keyExtractor={(item) => {
            if (activeTab === 'bookings') {
              return (item as RideData).bookingId;
            } else {
              return 'requestId' in item ? (item as RideRequestData).requestId : (item as DirectRideRequest).id;
            }
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 100,
            flexGrow: 1,
          }}
        />
      </View>

      {selectedRideForRating && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedRideForRating(null);
          }}
          onSuccess={handleRatingSuccess}
          bookingId={selectedRideForRating.bookingId}
          ratedUserId={selectedRideForRating.driver.id}
          ratedUserName={selectedRideForRating.driver.name}
          ratedUserAvatar={selectedRideForRating.driver.avatar}
          ratingType="driver_rating"
          rideDetails={{
            from: selectedRideForRating.from,
            to: selectedRideForRating.to,
            departureTime: selectedRideForRating.departureTime
          }}
          userClerkId={user?.id || ''}
        />
      )}
    </SafeAreaView>
  );
};

export default Rides;