import { icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { formatUserName, getUserInitials } from "@/lib/utils";
import { isFareSplittingEligible } from "@/lib/fareSplitting";
import { shareRide } from "@/lib/shareUtils";
import { RideData } from "@/store";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { FontAwesome, Feather } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { router } from "expo-router";
import MutualFriendsIndicator from "./MutualFriendsIndicator";
import CommonRoutesIndicator from "./CommonRoutesIndicator";

interface RideCardProps {
  ride: RideData;
  selected?: boolean;
  onSelect?: () => void;
  onPress?: (rideId: string) => void;
  variant?: 'selection' | 'feed';
  showDistance?: boolean;
  showOrigin?: boolean;
  showDestination?: boolean;
}

const RideCard = ({ 
  ride, 
  selected = false, 
  onSelect, 
  onPress,
  variant = 'selection',
  showDistance = true,
  showOrigin = true,
  showDestination = false
}: RideCardProps) => {
  const { isDark } = useTheme();
  const [hasFareSplitting, setHasFareSplitting] = useState<boolean>(false);

  useEffect(() => {
    if (ride.fare_splitting_enabled !== undefined) {
      setHasFareSplitting(ride.fare_splitting_enabled);
    } else {
      const isEligible = ride.type !== 'request' && 
                        ride.seats_total > 1 && 
                        isFareSplittingEligible(ride.type || 'post', ride.seats_total, true);
      setHasFareSplitting(isEligible);
    }
  }, [ride.id, ride.type, ride.seats_total, ride.fare_splitting_enabled]);

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
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getDriverInitials = (driver: any) => {
    return getUserInitials(driver.first_name, driver.last_name, driver.name);
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.5) return isDark ? '#10B981' : '#16A34A';
    if (ratio > 0.2) return isDark ? '#9e9e9e' : '#9e9e9e';
    return isDark ? '#EF4444' : '#DC2626';
  };

  const isRequest = ride.type === 'request';

  const handlePress = () => {
    if (variant === 'selection' && onSelect) {
      // Selection haptic feedback
      Haptics.selectionAsync();
      onSelect();
    } else if (variant === 'feed' && onPress) {
      // Light impact for navigation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(ride.id);
    }
  };

  const handleDriverPress = (e: any) => {
    // Stop event propagation to prevent card selection
    if (e?.stopPropagation) {
      e.stopPropagation();
    }

    // Only navigate if it's not a ride request (requests don't have drivers)
    if (!isRequest && ride.driver?.clerk_id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Pass driver data directly - no API call needed!
      router.push({
        pathname: `/(root)/driver-profile/${ride.driver.clerk_id}`,
        params: {
          driverName: ride.driver.name,
          driverAvatar: ride.driver.avatar_url || '',
          driverRating: ride.driver.rating.toString(),
          vehicleMake: ride.driver.vehicle?.make || '',
          vehicleModel: ride.driver.vehicle?.model || '',
          vehicleYear: ride.driver.vehicle?.year?.toString() || '',
          vehicleColor: ride.driver.vehicle?.color || '',
          vehiclePlate: ride.driver.vehicle?.plate || '',
        }
      });
    }
  };


  // Minimalistic feed variant for home screen
  if (variant === 'feed') {
    return (
      <TouchableOpacity
        onPress={handlePress}
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
        {/* Header with driver info and time */}
        <TouchableOpacity
          onPress={handleDriverPress}
          activeOpacity={isRequest ? 1 : 0.7}
          disabled={isRequest}
          className="flex-row items-center mb-3"
        >
          <View className="w-10 h-10 rounded-full justify-center items-center mr-3 overflow-hidden"
            style={{ backgroundColor: isDark ? '#1F1F1F' : '#F3F4F6' }}>
            {!isRequest && ride.driver?.avatar_url ? (
              <Image
                source={{ uri: ride.driver.avatar_url }}
                className="w-10 h-10 rounded-full"
                resizeMode="cover"
              />
            ) : !isRequest ? (
              <Text className="font-semibold text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                {getDriverInitials(ride.driver)}
              </Text>
            ) : (
              <FontAwesome name="user-o" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-semibold text-sm" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                {isRequest ? 'Ride Request' : formatUserName(ride.driver, 'full')}
              </Text>
              {!isRequest && ride.driver?.rating && (
                <View className="flex-row items-center ml-2">
                  <Text className="text-xs" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                    •
                  </Text>
                  <FontAwesome name="star" size={12} color="#9e9e9e" style={{ marginLeft: 4, marginRight: 2 }} />
                  <Text className="text-xs" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    {ride.driver.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-1">
              <Feather name="clock" size={13} color={isDark ? '#9e9e9e' : '#9e9e9e'} style={{ marginRight: 5 }} />
              <Text className="text-sm font-medium" style={{ color: isDark ? '#E5E7EB' : '#111827' }}>
                {formatDate(ride.departure_time)} at {formatTime(ride.departure_time)}
              </Text>
              {showDistance && ride.distance_from_user && (
                <>
                  <Text className="text-sm mx-1.5" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>•</Text>
                  <Text className="text-sm font-medium" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    {ride.distance_from_user.toFixed(1)} km away
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Social Proof Indicators */}
        {!isRequest && ride.social_proof && (ride.social_proof.mutual_friends_count || ride.social_proof.common_route) && (
          <View className="flex-row items-center mb-3 flex-wrap gap-2">
            {ride.social_proof.mutual_friends_count && ride.social_proof.mutual_friends_count > 0 && (
              <MutualFriendsIndicator count={ride.social_proof.mutual_friends_count} compact />
            )}
            {ride.social_proof.common_route && (
              <CommonRoutesIndicator routeLabel={ride.social_proof.common_route} compact />
            )}
          </View>
        )}

        {/* Main Content */}
        <View className="mb-3">
          {/* Origin */}
          {showOrigin && (
            <View className="flex-row items-start mb-2">
              <Image
                source={icons.point}
                className="w-4 h-4 mr-2 mt-0.5"
                tintColor="#9e9e9e"
              />
              <View className="flex-1">
                <Text className="text-sm leading-5" style={{ color: isDark ? '#E5E7EB' : '#111827' }}>
                  {(() => {
                    const parts = ride.origin.label.split(',').map(part => part.trim());
                    return parts.slice(0, 2).join(', ');
                  })()}
                </Text>
              </View>
            </View>
          )}

          {/* Destination */}
          {showDestination && (
            <View className="flex-row items-start mb-2">
              <Image 
                source={icons.to} 
                className="w-4 h-4 mr-2 mt-0.5" 
                tintColor="#EF4444" 
              />
              <View className="flex-1">
                <Text className="text-sm font-medium leading-5" style={{ color: isDark ? '#E5E7EB' : '#111827' }}>
                  {(() => {
                    const parts = ride.destination.label.split(',').map(part => part.trim());
                    return parts.slice(0, 2).join(', ');
                  })()}
                </Text>
              </View>
            </View>
          )}

          {/* Price and Seats Info */}
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center">
              <Text className="font-bold text-xl" style={{ color: isDark ? '#9e9e9e' : '#9e9e9e' }}>
                ${ride.price.toFixed(0)}
              </Text>
              <Text className="text-sm ml-1" style={{ color: isDark ? '#6B7280' : '#6B7280' }}>
                per seat
              </Text>
              {hasFareSplitting && !isRequest && (
                <View className="ml-2 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)' }}>
                  <Text className="text-xs font-medium" style={{ color: isDark ? '#10B981' : '#16A34A' }}>
                    Split fare
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center">
              {isRequest ? (
                <Text className="text-sm font-medium" style={{ color: isDark ? '#9e9e9e' : '#9e9e9e' }}>
                  {ride.seats_required} seats needed
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full mr-1.5" 
                    style={{ backgroundColor: getAvailabilityColor(ride.seats_available, ride.seats_total) }} />
                  <Text className="text-sm font-medium" 
                    style={{ color: getAvailabilityColor(ride.seats_available, ride.seats_total) }}>
                    {ride.seats_available}/{ride.seats_total} seats
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Vehicle info for non-requests */}
          {!isRequest && ride.driver?.vehicle && (
            <View className="mt-2">
              <Text className="text-xs" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                {ride.driver.vehicle.color} {ride.driver.vehicle.make} {ride.driver.vehicle.model}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-3">
          {/* Share Button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              shareRide(ride);
            }}
            activeOpacity={0.7}
            className="flex-row items-center"
          >
            <Feather
              name="share-2"
              size={20}
              color={isDark ? '#6B7280' : '#6B7280'}
            />
            <Text className="ml-2 text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Share
            </Text>
          </TouchableOpacity>

          {/* View Driver Profile Button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDriverPress(e);
            }}
            className="px-5 py-2 rounded-lg"
            style={{
              backgroundColor: isDark ? '#3B82F6' : '#2563EB'
            }}
            activeOpacity={0.8}
            disabled={isRequest}
          >
            <Text className="text-sm font-semibold text-white">
              {isRequest ? 'No Driver' : 'View Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // Selection variant (existing design for other screens)
  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`rounded-xl mx-4 mb-2 p-2.5`}
      style={{
        backgroundColor: selected 
          ? (isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE') 
          : (isDark ? '#0A1F0F' : '#F0FDF4'),
        shadowColor: isDark ? '#000' : '#000',
        shadowOpacity: selected ? (isDark ? 0.3 : 0.1) : (isDark ? 0.2 : 0.05),
        shadowRadius: selected ? 12 : 8,
        shadowOffset: { width: 0, height: selected ? 4 : 2 },
        elevation: selected ? 6 : 3,
        borderWidth: selected ? 2 : 1,
        borderColor: selected
          ? '#3B82F6'
          : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB'),
      }}
    >
      <TouchableOpacity
        onPress={handleDriverPress}
        activeOpacity={0.7}
        className="flex-row items-center"
      >
        <View
          className="w-9 h-9 rounded-full justify-center items-center mr-2.5 overflow-hidden"
          style={{
            backgroundColor: isDark ? '#374151' : '#E5E7EB',
            borderWidth: 1.5,
            borderColor: selected
              ? '#3B82F6'
              : (isDark ? '#1F2937' : '#FFFFFF')
          }}
        >
          {ride.driver.avatar_url ? (
            <Image
              source={{ uri: ride.driver.avatar_url }}
              className="w-9 h-9 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="font-bold text-xs" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              {getDriverInitials(ride.driver)}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-0.5">
            <Text className="font-semibold text-sm" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              {formatUserName(ride.driver, 'full')}
            </Text>
            <View className="flex-row items-center">
              <Image source={icons.star} className="w-2.5 h-2.5 mr-0.5" tintColor="#9e9e9e" />
              <Text className="text-xs font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                {ride.driver.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          <Text className="text-xs font-medium mb-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {ride.driver.vehicle.color} {ride.driver.vehicle.make} {ride.driver.vehicle.model}
          </Text>

          <View className="flex-row items-center">
            <View
              className="flex-row items-center px-2 py-1 rounded-lg mr-1.5"
              style={{ backgroundColor: isDark ? 'rgba(158, 158, 158, 0.15)' : 'rgba(158, 158, 158, 0.1)' }}
            >
              <Feather name="clock" size={12} color="#9e9e9e" style={{ marginRight: 4 }} />
              <Text className="text-xs font-semibold" style={{ color: isDark ? '#9e9e9e' : '#9e9e9e' }}>
                {formatDate(ride.departure_time)} • {formatTime(ride.departure_time)}
              </Text>
            </View>

            {showDistance && ride.distance_from_user && (
              <View
                className="flex-row items-center px-1 py-0.5 rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#F0FDF4' }}
              >
                <Image source={icons.point} className="w-2 h-2 mr-0.5" tintColor="#9e9e9e" />
                <Text className="text-xs font-medium" style={{ color: isDark ? '#9e9e9e' : '#9e9e9e' }}>
                  {ride.distance_from_user.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>

          {showOrigin && (
            <View className="flex-row items-center mt-1">
              <Image source={icons.point} className="w-3 h-3 mr-1.5" tintColor="#9e9e9e" />
              <View className="flex-1">
                {(() => {
                  const parts = ride.origin.label.split(',');
                  const mainText = parts[0].trim();
                  
                  return (
                    <Text className="text-xs" numberOfLines={1}>
                      <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>From {mainText}</Text>
                      {(() => {
                        const allParts = ride.origin.label.split(',').map(part => part.trim());
                        const cityState = allParts.length > 1 ? allParts.slice(1, 3).join(', ') : '';
                        return cityState ? <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}> • {cityState}</Text> : null;
                      })()}
                    </Text>
                  );
                })()}
              </View>
            </View>
          )}

          {showDestination && (
            <View className="flex-row items-center mt-1">
              <Image source={icons.to} className="w-3 h-3 mr-1.5" tintColor="#EF4444" />
              <View className="flex-1">
                {(() => {
                  const parts = ride.destination.label.split(',');
                  const mainText = parts[0].trim();
                  
                  return (
                    <Text className="text-xs font-semibold" numberOfLines={1}>
                      <Text style={{ color: isDark ? '#FFFFFF' : '#111827' }}>To {mainText}</Text>
                      {(() => {
                        const allParts = ride.destination.label.split(',').map(part => part.trim());
                        const cityState = allParts.length > 1 ? allParts.slice(1, 3).join(', ') : '';
                        return cityState ? <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}> • {cityState}</Text> : null;
                      })()}
                    </Text>
                  );
                })()}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View className="flex-row justify-between items-center mt-1.5 pt-1.5" style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}>
        <View className="flex-row items-center">
          <Text className="text-xs font-semibold" style={{ color: getAvailabilityColor(ride.seats_available, ride.seats_total) }}>
            {ride.seats_available} seats left
          </Text>
          <Text className="text-xs ml-1" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
            of {ride.seats_total}
          </Text>
        </View>
        
        <View className="items-end">
          <View className="flex-row items-center">
            <View className="flex-row items-baseline">
              <Text className="text-sm font-bold" style={{ color: '#9e9e9e' }}>
                ${ride.price.toFixed(0)}
              </Text>
              {ride.price % 1 !== 0 && (
                <Text className="text-xs font-medium" style={{ color: '#9e9e9e' }}>
                  .{(ride.price % 1).toFixed(2).slice(2)}
                </Text>
              )}
            </View>
            {selected && (
              <View className="ml-1.5 w-3.5 h-3.5 rounded-full items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
                <Image source={icons.check} className="w-2 h-2" tintColor="#FFFFFF" />
              </View>
            )}
          </View>
          {hasFareSplitting && (
            <View className="mt-0.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }}>
              <Text className="text-xs font-medium" style={{ color: isDark ? '#22C55E' : '#16A34A', fontSize: 10 }}>
                Fare Split
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RideCard;