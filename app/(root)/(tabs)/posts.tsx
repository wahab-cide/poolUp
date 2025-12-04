import CustomButton from '@/components/CustomButton';
import ProfilePhotoPrompt from '@/components/ProfilePhotoPrompt';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import { useUser } from '@clerk/clerk-expo';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

interface PostedRideData {
  rideId: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime?: string;
  createdAt: string;
  updatedAt: string;
  pricePerSeat: number;
  currency: string;
  rideStatus: 'open' | 'full' | 'matched' | 'completed' | 'cancelled' | 'expired';
  coordinates: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
  };
  capacity: {
    total: number;
    available: number;
    booked: number;
  };
  bookings: {
    count: number;
    totalEarnings: number;
    pendingRequests: number;
  };
}

interface DirectRideRequest {
  id: string;
  type: 'received';
  origin: string;
  destination: string;
  requestedDateTime: string;
  seatsRequested: number;
  message: string | null;
  status: 'pending' | 'driver_quoted' | 'confirmed' | 'declined' | 'expired' | 'cancelled';
  price: number | null;
  maxPricePerSeat?: number | null;
  driverQuotedPrice?: number | null;
  createdAt: string;
  otherUser: {
    clerkId: string;
    name: string;
    avatarUrl: string | null;
    rating: number;
  };
}

const Posts = () => {
  const { user } = useUser();
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const [postedRides, setPostedRides] = useState<PostedRideData[]>([]);
  const [rideRequests, setRideRequests] = useState<DirectRideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'requests'>('posts');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'booked' | 'past' | 'cancelled'>('all');
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [decliningRequestId, setDecliningRequestId] = useState<string | null>(null);

  const fetchPostedRides = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching posted rides for user:', user.id);
      const data = await fetchAPI(`/api/rides/posted/${user.id}`);

      console.log('Posted rides API response:', data);

      if (data.success) {
        setPostedRides(data.rides);
      } else {
        console.error('Failed to fetch posted rides:', data.error);
        Alert.alert('Error', data.error || 'Failed to fetch your posted rides');
      }
    } catch (error) {
      console.error('Error fetching posted rides:', error);
      Alert.alert('Error', 'Failed to fetch your posted rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const fetchRideRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching ride requests for driver:', user.id);
      const data = await fetchAPI(`/api/ride-requests?clerkId=${user.id}&type=received`);

      console.log('Ride requests API response:', data);

      if (data.success) {
        setRideRequests(data.requests as DirectRideRequest[]);
      } else {
        console.error('Failed to fetch ride requests:', data.error);
      }
    } catch (error) {
      console.error('Error fetching ride requests:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.publicMetadata?.is_driver === true) {
      Promise.all([fetchPostedRides(), fetchRideRequests()]);
    } else {
      setLoading(false);
    }
  }, [user?.id, user?.publicMetadata?.is_driver, fetchPostedRides, fetchRideRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchPostedRides(), fetchRideRequests()]);
  };

  const getStatusColor = (rideStatus: string) => {
    switch (rideStatus) {
      case 'open':
        return '#F97316'; // Purple
      case 'full':
        return '#3B82F6'; // Blue
      case 'matched':
        return '#F97316';
      case 'completed':
        return '#F97316'; // Purple
      case 'cancelled':
        return '#EF4444'; // Red
      case 'expired':
        return '#F97316'; // Orange
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusText = (rideStatus: string) => {
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
      case 'expired':
        return 'Expired';
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

  const filteredRides = postedRides.filter(ride => {
    switch (filterType) {
      case 'upcoming':
        return ['open', 'full', 'matched'].includes(ride.rideStatus) && 
               new Date(ride.departureTime) > new Date();
      case 'booked':
        return ['full', 'matched'].includes(ride.rideStatus) && 
               ride.capacity.booked > 0 &&
               new Date(ride.departureTime) > new Date();
      case 'past':
        return ride.rideStatus === 'completed' || ride.rideStatus === 'expired';
      case 'cancelled':
        return ride.rideStatus === 'cancelled';
      default:
        return true;
    }
  });

  const getFilterCounts = () => {
    const upcoming = postedRides.filter(ride => 
      ['open', 'full', 'matched'].includes(ride.rideStatus) && 
      new Date(ride.departureTime) > new Date()
    ).length;
    const booked = postedRides.filter(ride => 
      ['full', 'matched'].includes(ride.rideStatus) && 
      ride.capacity.booked > 0 &&
      new Date(ride.departureTime) > new Date()
    ).length;
    const past = postedRides.filter(ride => 
      ride.rideStatus === 'completed' || ride.rideStatus === 'expired'
    ).length;
    const cancelled = postedRides.filter(ride => 
      ride.rideStatus === 'cancelled'
    ).length;
    
    return { upcoming, booked, past, cancelled, all: postedRides.length };
  };

  const handlePostedRidePress = (ride: PostedRideData) => {
    // Navigate to posted ride details screen with available data
    try {
      if (router) {
        const params = new URLSearchParams({
          rideId: ride.rideId,
        });

        // Pass fare splitting data if available to avoid API call
        if (ride.fare_splitting_enabled !== undefined) {
          params.append('fareSplittingEnabled', ride.fare_splitting_enabled.toString());
        }

        router.push(`/(root)/posted-ride-details?${params.toString()}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleAcceptRequest = async (request: DirectRideRequest) => {
    // Prevent multiple accept requests
    if (acceptingRequestId || decliningRequestId) return;

    const riderMaxPrice = request.price || request.maxPricePerSeat;
    const riderMaxPriceNum = riderMaxPrice ? parseFloat(riderMaxPrice.toString()) : null;
    const promptMessage = riderMaxPriceNum
      ? `Rider's maximum price: $${riderMaxPriceNum.toFixed(2)} per seat\n\nSet your price for this ride from ${request.origin} to ${request.destination} (${request.seatsRequested} seat${request.seatsRequested > 1 ? 's' : ''})`
      : `Set your price for this ride from ${request.origin} to ${request.destination} (${request.seatsRequested} seat${request.seatsRequested > 1 ? 's' : ''})`;

    Alert.prompt(
      'Accept Ride Request',
      promptMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Accept',
          onPress: async (priceInput) => {
            const price = parseFloat(priceInput || '0');

            if (!price || price <= 0) {
              Alert.alert('Invalid Price', 'Please enter a valid price');
              return;
            }

            // Warn if price exceeds rider's max
            if (riderMaxPriceNum && price > riderMaxPriceNum) {
              Alert.alert(
                'Price Exceeds Maximum',
                `Your price ($${price.toFixed(2)}) is higher than the rider's maximum ($${riderMaxPriceNum.toFixed(2)}). The rider may decline this request.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Continue Anyway',
                    onPress: async () => {
                      await submitAcceptRequest(request.id, price);
                    }
                  }
                ]
              );
              return;
            }

            // Submit if price is within rider's max
            await submitAcceptRequest(request.id, price);
          }
        }
      ],
      'plain-text',
      riderMaxPriceNum ? riderMaxPriceNum.toFixed(2) : '', // Pre-fill with rider's max price
      'numeric'
    );

    async function submitAcceptRequest(requestId: string, price: number) {
      try {
        setAcceptingRequestId(requestId);
        console.log('Accepting request:', requestId, 'with price:', price);

        const response = await fetchAPI(`/api/ride-requests/${requestId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            driverClerkId: user?.id,
            action: 'accept',
            price
          })
        });

        if (response.success) {
          Alert.alert('Success', 'Ride request accepted successfully!');
          // Refresh the requests list
          fetchRideRequests();
        } else {
          Alert.alert('Error', response.error || 'Failed to accept ride request');
        }
      } catch (error) {
        console.error('Error accepting request:', error);
        Alert.alert('Error', 'Failed to accept ride request. Please try again.');
      } finally {
        setAcceptingRequestId(null);
      }
    }
  };

  const handleDeclineRequest = async (request: DirectRideRequest) => {
    // Prevent multiple decline requests
    if (acceptingRequestId || decliningRequestId) return;

    Alert.alert(
      'Decline Ride Request',
      `Are you sure you want to decline this ride request from ${request.otherUser.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setDecliningRequestId(request.id);
              console.log('Declining request:', request.id);

              const response = await fetchAPI(`/api/ride-requests/${request.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  driverClerkId: user?.id,
                  action: 'decline'
                })
              });

              if (response.success) {
                Alert.alert('Request Declined', 'The ride request has been declined.');
                // Refresh the requests list
                fetchRideRequests();
              } else {
                Alert.alert('Error', response.error || 'Failed to decline ride request');
              }
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline ride request. Please try again.');
            } finally {
              setDecliningRequestId(null);
            }
          }
        }
      ]
    );
  };

  const renderPostedRideCard = ({ item }: { item: PostedRideData }) => (
    <TouchableOpacity
      onPress={() => handlePostedRidePress(item)}
      className={`${styles.card} rounded-xl p-5 mb-4 mx-4`}
      style={{ 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 8, 
        elevation: 3 
      }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-2">
          <View className="flex-row flex-wrap items-center">
            <View
              className="px-3 py-1 rounded-full flex-row items-center mr-2 mb-1"
              style={{ backgroundColor: getStatusColor(item.rideStatus) + '15' }}
            >
              <Ionicons 
                name={item.rideStatus === 'completed' ? 'checkmark-circle' : 
                      item.rideStatus === 'matched' ? 'checkmark' :
                      item.rideStatus === 'open' ? 'radio-button-on' : 
                      item.rideStatus === 'full' ? 'people' : 
                      item.rideStatus === 'expired' ? 'time-outline' : 'close-circle'} 
                size={14} 
                color={getStatusColor(item.rideStatus)} 
              />
              <Text
                className="text-sm font-bold ml-1"
                style={{ color: getStatusColor(item.rideStatus) }}
              >
                {getStatusText(item.rideStatus)}
              </Text>
            </View>
            
            {item.bookings.pendingRequests > 0 && (
              <View 
                className="px-2.5 py-1 rounded-full flex-row items-center mb-1"
                style={{ 
                  backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)'
                }}
              >
                <Ionicons name="time" size={12} color="#F97316" />
                <Text className="text-xs font-bold ml-1.5" style={{ color: '#F97316' }}>
                  {item.bookings.pendingRequests} Pending Approval
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View className="ml-2">
          <Text className="text-sm font-bold text-right" style={{ color: '#F97316' }}>
            {item.currency} {item.pricePerSeat.toFixed(2)}
          </Text>
          <Text className="text-xs text-right" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            per seat
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <View className="flex-1 flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
          <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
            {item.from}
          </Text>
        </View>
        <View className="mx-2 flex-row">
          <View className="w-1 h-1 rounded-full bg-gray-400 mx-0.5" />
          <View className="w-1 h-1 rounded-full bg-gray-400 mx-0.5" />
          <View className="w-1 h-1 rounded-full bg-gray-400 mx-0.5" />
        </View>
        <View className="flex-1 flex-row items-center justify-end">
          <Text className={`text-sm font-medium flex-1 text-right ${styles.textPrimary}`} numberOfLines={1}>
            {item.to}
          </Text>
          <View className="w-2 h-2 rounded-full bg-red-500 ml-2" />
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Ionicons name="people" size={14} color="#6B7280" />
          <Text className={`text-sm font-medium ml-1 ${styles.textSecondary}`}>
            {item.capacity.booked}/{item.capacity.total} seats
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons name="wallet" size={14} color="#F97316" />
          <Text className="text-sm font-medium text-orange-600 ml-1">
            {item.currency} {item.bookings.totalEarnings.toFixed(2)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="time" size={14} color="#6B7280" />
        <Text className={`text-sm font-medium ml-1 ${styles.textSecondary}`}>
          {formatDate(item.departureTime)} at {formatTime(item.departureTime)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // Amber
      case 'driver_quoted':
        return '#3B82F6'; // Blue - waiting for rider confirmation
      case 'confirmed':
        return '#10B981'; // Green
      case 'accepted':
        return '#10B981'; // Green
      case 'declined':
        return '#EF4444'; // Red
      case 'cancelled':
        return '#6B7280'; // Gray
      case 'expired':
        return '#F97316'; // Orange
      default:
        return '#9E9E9E';
    }
  };

  const getRequestStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'driver_quoted':
        return 'Quote Sent';
      case 'confirmed':
        return 'Confirmed';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const renderRequestCard = ({ item }: { item: DirectRideRequest }) => {
    const isPending = item.status === 'pending';
    const isConfirmed = item.status === 'confirmed';
    const isQuoteSent = item.status === 'driver_quoted';
    const isAccepted = item.status === 'accepted';
    const riderMaxPrice = item.price || item.maxPricePerSeat;
    const riderMaxPriceNum = riderMaxPrice ? parseFloat(riderMaxPrice.toString()) : null;
    const driverQuotedPriceNum = item.driverQuotedPrice ? parseFloat(item.driverQuotedPrice.toString()) : null;

    return (
      <View
        className={`${styles.card} rounded-xl p-5 mb-4 mx-4`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-2">
            <View
              className="px-3 py-1 rounded-full flex-row items-center self-start"
              style={{ backgroundColor: getRequestStatusColor(item.status) + '15' }}
            >
              <Ionicons
                name={item.status === 'confirmed' ? 'checkmark-circle' :
                      item.status === 'accepted' ? 'checkmark-circle' :
                      item.status === 'driver_quoted' ? 'paper-plane' :
                      item.status === 'pending' ? 'time' :
                      item.status === 'declined' ? 'close-circle' :
                      item.status === 'cancelled' ? 'ban' : 'time-outline'}
                size={14}
                color={getRequestStatusColor(item.status)}
              />
              <Text
                className="text-sm font-bold ml-1"
                style={{ color: getRequestStatusColor(item.status) }}
              >
                {getRequestStatusText(item.status)}
              </Text>
            </View>
          </View>

          {(isConfirmed || isQuoteSent) && driverQuotedPriceNum ? (
            <View className="ml-2">
              <Text className={`text-sm font-bold text-right ${isConfirmed ? 'text-green-600' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                ${driverQuotedPriceNum.toFixed(2)}
              </Text>
              <Text className="text-xs text-right" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                {isConfirmed ? 'confirmed price' : 'quoted price/seat'}
              </Text>
            </View>
          ) : riderMaxPriceNum ? (
            <View className="ml-2">
              <Text className={`text-sm font-bold text-right ${isAccepted ? 'text-green-600' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                ${riderMaxPriceNum.toFixed(2)}
              </Text>
              <Text className="text-xs text-right" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                {isAccepted ? 'accepted price' : 'max price/seat'}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center mb-3">
          <View className="flex-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
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

        <View className="flex-row items-center mb-3">
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
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text className={`text-sm font-medium ml-1 ${styles.textSecondary}`}>
              {item.seatsRequested} seat{item.seatsRequested > 1 ? 's' : ''} requested
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text className={`text-sm font-medium ml-1 ${styles.textSecondary}`}>
              {formatDate(item.requestedDateTime)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="calendar" size={14} color="#6B7280" />
          <Text className={`text-sm font-medium ml-1 ${styles.textSecondary}`}>
            {formatTime(item.requestedDateTime)}
          </Text>
        </View>

        {item.message && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <Text className={`text-xs ${styles.textSecondary} mb-1`}>Message:</Text>
            <Text className={`text-sm ${styles.textPrimary}`}>{item.message}</Text>
          </View>
        )}

        {isPending && (
          <View className="mt-3 pt-3 border-t flex-row gap-3" style={{ borderTopColor: isDark ? '#374151' : '#E5E7EB' }}>
            <TouchableOpacity
              onPress={() => handleDeclineRequest(item)}
              className={`flex-1 rounded-lg py-2 px-4 flex-row items-center justify-center ${
                decliningRequestId === item.id ? 'bg-red-400' : 'bg-red-500'
              }`}
              activeOpacity={0.8}
              disabled={decliningRequestId === item.id || acceptingRequestId === item.id}
            >
              {decliningRequestId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="close" size={14} color="white" />
              )}
              <Text className="text-white font-semibold ml-2 text-sm">
                {decliningRequestId === item.id ? 'Declining...' : 'Decline'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAcceptRequest(item)}
              className={`flex-1 rounded-lg py-2 px-4 flex-row items-center justify-center ${
                acceptingRequestId === item.id ? 'bg-green-400' : 'bg-green-500'
              }`}
              activeOpacity={0.8}
              disabled={acceptingRequestId === item.id || decliningRequestId === item.id}
            >
              {acceptingRequestId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
              <Text className="text-white font-semibold ml-2 text-sm">
                {acceptingRequestId === item.id ? 'Accepting...' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    const isDriver = user?.publicMetadata?.is_driver === true;

    if (!isDriver) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-orange-100 w-32 h-32 rounded-full items-center justify-center mb-6">
            <Ionicons name="car-sport" size={48} color="#F97316" />
          </View>
          <Text className={`text-2xl font-bold mb-3 ${styles.textPrimary}`}>
            Become a Driver
          </Text>
          <Text className={`text-center mb-8 text-base leading-6 ${styles.textSecondary}`}>
            Start your journey as a driver! Post rides, earn money, and help others get around your city.
          </Text>
          <View className="items-center">
            <CustomButton
              title="Start Driving"
              onPress={() => {
                try {
                  if (router) {
                    router.push('/(feed)/verify-driver');
                  }
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
              bgVariant="primary"
              className="w-48"
              IconLeft={() => <Ionicons name="car" size={20} color="white" style={{ marginRight: 8 }} />}
            />
          </View>
        </View>
      );
    }

    if (activeTab === 'requests') {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-32 h-32 rounded-full items-center justify-center mb-6" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}>
            <Ionicons name="mail-outline" size={48} color="#3B82F6" />
          </View>
          <Text className={`text-2xl font-bold mb-3 ${styles.textPrimary}`}>
            No Ride Requests
          </Text>
          <Text className={`text-center mb-8 text-base leading-6 ${styles.textSecondary}`}>
            When riders request rides from you, they&apos;ll appear here. You can then accept or decline them.
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center px-6">
        <Image
          source={require('@/assets/images/no-bookings-yet.png')}
          style={{ width: 180, height: 180, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text className={`text-2xl font-bold mb-3 ${styles.textPrimary}`}>
          No Rides Posted
        </Text>
        <Text className={`text-center mb-8 text-base leading-6 ${styles.textSecondary}`}>
          You haven&apos;t posted any rides yet. Create your first ride!
        </Text>
        <View className="items-center">
          <TouchableOpacity
            onPress={() => {
              try {
                if (router) {
                  router.push('/(feed)/post-ride');
                }
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            className="w-56 h-14 rounded-full flex flex-row justify-center items-center shadow-md"
            style={{
              backgroundColor: isDark ? '#3B82F6' : '#000000',
              shadowColor: isDark ? '#000' : '#000',
              shadowOpacity: isDark ? 0.5 : 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 }
            }}
            activeOpacity={0.8}
          >
            <Text className="font-bold text-center" style={{
              color: '#FFFFFF',
              fontSize: 19,
              letterSpacing: 0.5
            }}>
              Post Your First Ride
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${styles.textPrimary} mb-1`}>
                My Posts
              </Text>
              <Text className={`${styles.textSecondary} text-sm`}>
                Manage your rides
              </Text>
            </View>
          </View>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        >
          <SkeletonPostCard />
          <SkeletonPostCard />
          <SkeletonPostCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <View className="flex-1">
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${styles.textPrimary} mb-1`}>
                My Posts
              </Text>
              <Text className={`${styles.textSecondary} text-sm`}>
                Manage your rides and requests
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                try {
                  if (router) {
                    router.push('/(feed)/post-ride');
                  }
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
              className="px-4 py-2 rounded-lg flex-row items-center"
              style={{
                backgroundColor: isDark ? '#FFFFFF' : '#EA580C'
              }}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color={isDark ? '#000000' : '#FFFFFF'} style={{ marginRight: 6 }} />
              <Text className={`font-semibold text-sm ${isDark ? 'text-black' : 'text-white'}`}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Photo Prompt for drivers without photos */}
        <ProfilePhotoPrompt />

        {/* Tab Switcher */}
        <View className="px-4 pb-2">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab('posts')}
              className={`flex-1 py-3 ${
                activeTab === 'posts' ? 'border-b-2' : 'border-b'
              }`}
              style={{
                borderBottomColor: activeTab === 'posts'
                  ? (isDark ? '#FFFFFF' : '#000000')
                  : (isDark ? '#374151' : '#E5E7EB')
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center">
                <Text className={`font-semibold ${
                  activeTab === 'posts'
                    ? (isDark ? 'text-white' : 'text-black')
                    : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}>
                  My Posts
                </Text>
                {postedRides.length > 0 && (
                  <View className={`ml-2 px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {postedRides.length}
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
                {rideRequests.length > 0 && (
                  <View className={`ml-2 px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {rideRequests.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'posts' && postedRides.length > 0 && (
          <View className="px-4 pb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {[
                { key: 'all', label: 'All', count: getFilterCounts().all },
                { key: 'upcoming', label: 'Upcoming', count: getFilterCounts().upcoming },
                { key: 'booked', label: 'Booked', count: getFilterCounts().booked },
                { key: 'past', label: 'Past', count: getFilterCounts().past },
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
          data={activeTab === 'posts' ? filteredRides : rideRequests}
          renderItem={activeTab === 'posts' ? renderPostedRideCard : renderRequestCard}
          keyExtractor={(item) => activeTab === 'posts' ? (item as PostedRideData).rideId : (item as DirectRideRequest).id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            flexGrow: 1,
            paddingBottom: 120,
          }}
        />

        {activeTab === 'posts' && user?.publicMetadata?.is_driver === true && (
          <TouchableOpacity
            onPress={() => {
              try {
                if (router) {
                  router.push('/(feed)/post-ride');
                }
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            className="absolute right-6 w-14 h-14 rounded-full items-center justify-center"
            style={{
              bottom: 90,
              backgroundColor: isDark ? '#FFFFFF' : '#EA580C',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8
            }}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={24} color={isDark ? '#000000' : '#FFFFFF'} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Posts;