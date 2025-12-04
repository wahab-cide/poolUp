import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, Image } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useMemo } from "react";

import CustomButton from "@/components/CustomButton";
import RideCard from "@/components/RideCard";
import RideLayout from "@/components/RideLayout";
import { useLocationStore, useRideStore } from "@/store";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const ConfirmRide = () => {
  const { rides, selectedRide, setSelectedRide, isLoading, error } = useRideStore();
  const { destinationAddress, destinationLatitude, destinationLongitude, userLatitude, userLongitude, userAddress } = useLocationStore();
  const { fromSearch } = useLocalSearchParams();
  const { user } = useUser();
  const { isDark } = useTheme();

  // Determine if this is from search results or direct ride selection
  const isFromSearch = fromSearch === 'true';
  
  // Get the appropriate destination address
  const getDestinationAddress = () => {
    if (isFromSearch && destinationAddress) {
      // If from search and we have a search destination, use it
      return destinationAddress;
    } else if (rides.length > 0) {
      // Otherwise, use the destination from the rides (they should all be going to same place)
      return rides[0].destination.label;
    } else {
      return 'Selected Destination';
    }
  };

  const displayDestination = getDestinationAddress();

  // Get first ride's destination for fallback (memoized separately with stable dependencies)
  const firstRideDestination = useMemo(() => {
    if (rides.length > 0 && rides[0]?.destination) {
      return {
        latitude: rides[0].destination.latitude,
        longitude: rides[0].destination.longitude,
        label: rides[0].destination.label,
      };
    }
    return null;
  }, [
    rides.length > 0,
    rides[0]?.destination?.latitude,
    rides[0]?.destination?.longitude,
    rides[0]?.destination?.label,
  ]);

  // Create map props for enhanced map display (memoized to prevent re-renders)
  const mapProps = useMemo(() => {
    const props: any = {};

    // Add user's origin if available
    if (userLatitude && userLongitude) {
      props.originMarker = {
        latitude: userLatitude,
        longitude: userLongitude,
        title: "Your Location",
        description: userAddress || "Pickup location",
      };
    }

    // Add destination marker if available
    if (destinationLatitude && destinationLongitude) {
      props.destinationMarker = {
        latitude: destinationLatitude,
        longitude: destinationLongitude,
        title: "Destination",
        description: destinationAddress || "Drop-off location",
      };
      props.showRoute = true;
    } else if (firstRideDestination) {
      // Use destination from first ride if search destination not available
      props.destinationMarker = {
        latitude: firstRideDestination.latitude,
        longitude: firstRideDestination.longitude,
        title: "Destination",
        description: firstRideDestination.label,
      };
      props.showRoute = true;
    }

    // Note: searchMarkers removed - they cause unnecessary route re-fetches
    // The important markers (origin and destination) are already shown

    return Object.keys(props).length > 0 ? props : undefined;
  }, [
    userLatitude,
    userLongitude,
    userAddress,
    destinationLatitude,
    destinationLongitude,
    destinationAddress,
    firstRideDestination?.latitude,
    firstRideDestination?.longitude,
  ]);

  const handleSelectRide = () => {
    if (!selectedRide) {
      // Show alert to select a ride
      return;
    }
    router.push("/(root)/book-ride");
  };

  // Handle post button press with driver verification

  // Loading state
  if (isLoading) {
    return (
      <RideLayout title="Finding Rides..." snapPoints={["70%", "85%"]} mapProps={mapProps}>
        <View className="flex-1 justify-center items-center p-5">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className="mt-4 text-center" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Searching for rides to {displayDestination}...
          </Text>
        </View>
      </RideLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <RideLayout title="Search Error" snapPoints={["70%", "85%"]} mapProps={mapProps}>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-center text-lg mb-4" style={{ color: isDark ? '#F87171' : '#DC2626' }}>
            {error}
          </Text>
          <CustomButton
            title="Try Again"
            onPress={() => router.back()}
            className="w-full"
          />
        </View>
      </RideLayout>
    );
  }

  // No rides found
  if (rides.length === 0) {
    return (
      <RideLayout title="No Rides Found" snapPoints={["90%", "98%"]} mapProps={mapProps}>
        <View className="flex-1 justify-center items-center p-3">
          <Text className="text-center text-2xl font-bold mb-6" style={{ color: isDark ? '#D1D5DB' : '#111827' }}>
            No Rides Found
          </Text>
          <View className="w-full">
            <TouchableOpacity
              onPress={() => router.push({
                pathname: "/(feed)/post-ride",
                params: {
                  mode: 'request',
                  originAddress: userAddress,
                  destinationAddress: destinationAddress,
                  originLatitude: userLatitude,
                  originLongitude: userLongitude,
                  destinationLatitude: destinationLatitude,
                  destinationLongitude: destinationLongitude
                }
              })}
              className="w-full mb-4 h-14 rounded-full flex justify-center items-center shadow-md"
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
                Post A Ride Request
              </Text>
            </TouchableOpacity>
            <CustomButton
              title="Search Again"
              onPress={() => router.back()}
              className="w-full"
              bgVariant="outline"
            />
          </View>
        </View>
      </RideLayout>
    );
  }


  // Limit rides to prevent performance issues and improve UX
  const MAX_RIDES_TO_SHOW = 20;
  const displayedRides = rides.slice(0, MAX_RIDES_TO_SHOW);
  const hasMoreRides = rides.length > MAX_RIDES_TO_SHOW;

  // Create data array that includes header, rides, and footer as items
  const flatListData = [
    { type: 'header', id: 'header' },
    ...displayedRides.map(ride => ({ type: 'ride', id: ride.id, ride })),
    { type: 'footer', id: 'footer' }
  ];

  const renderFlatListItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'header':
        return (
          <View className="px-4 pt-4 pb-2">
            <Text className="text-center mb-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Rides to {displayDestination}
            </Text>
            {hasMoreRides && (
              <Text className="text-center mb-4 text-xs" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                Showing top {MAX_RIDES_TO_SHOW} of {rides.length} rides
              </Text>
            )}
          </View>
        );
      case 'ride':
        return (
          <View className="px-4 mb-2">
            <RideCard
              ride={item.ride}
              selected={selectedRide === item.ride.id}
              onSelect={() => setSelectedRide(item.ride.id)}
              variant="selection"
              showDistance={true}
              showOrigin={true}
              showDestination={true}
            />
          </View>
        );
      case 'footer':
        return (
          <View className="px-4 pt-6 pb-5">
            <CustomButton
              title="Select Ride"
              onPress={handleSelectRide}
              disabled={!selectedRide}
              className={`w-full ${!selectedRide ? 'opacity-50' : ''}`}
            />
          </View>
        );
      default:
        return null;
    }
  };

  // Rides found  
  return (
    <RideLayout title={`${rides.length} Rides Found`} snapPoints={["70%", "90%"]} hasScrollableContent={false} mapProps={mapProps}>
      <FlatList
        data={flatListData}
        keyExtractor={(item) => item.id}
        renderItem={renderFlatListItem}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
        removeClippedSubviews={false}
      />
    </RideLayout>
  );
};

export default ConfirmRide;