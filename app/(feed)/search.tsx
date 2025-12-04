import { Ionicons } from '@expo/vector-icons';
import BottomSheet from "@gorhom/bottom-sheet";
import * as Location from 'expo-location';
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Keyboard, Platform, Text, TouchableWithoutFeedback, View } from "react-native";

import GoogleTextInput from "@/components/GoogleTextInput";
import RideLayout from "@/components/RideLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { showErrorToast } from "@/lib/toast";
import { useLocationStore, useRideStore } from "@/store";

const Search = () => {
  const { isDark } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [bottomSheetRef, setBottomSheetRef] = useState<React.RefObject<BottomSheet> | null>(null);
  
  const {
    userLatitude,
    userLongitude, 
    userAddress,
    destinationLatitude,
    destinationLongitude,
    destinationAddress,
    setDestinationLocation,
    setUserLocation,
  } = useLocationStore();

  const { searchRides, isLoading } = useRideStore();

  // Get user's current location if not already set
  const getCurrentLocationIfNeeded = useCallback(async () => {
    if (!userLatitude || !userLongitude || !userAddress) {
      try {
        if (__DEV__) console.log('Search: Getting current location for user...');
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (__DEV__) console.log('Search: Location permission denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 15000,
          maximumAge: 10000,
        });

        const address = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        setUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address[0] ? `${address[0].name}, ${address[0].region}` : 'Current Location',
        });

        if (__DEV__) console.log('Search: User location set successfully');
      } catch (error) {
        if (__DEV__) console.error('Search: Error getting location:', error);
      }
    }
  }, [userLatitude, userLongitude, userAddress, setUserLocation]);

  // Initialize user location on mount
  useEffect(() => {
    getCurrentLocationIfNeeded();
  }, [getCurrentLocationIfNeeded]);

  // Clear destination when leaving the page
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts (user navigates away)
      if (__DEV__) console.log('Search: Clearing destination on page exit');
      setDestinationLocation({
        latitude: null as any,
        longitude: null as any,
        address: null as any,
      });
    };
  }, [setDestinationLocation]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      if (__DEV__) console.log('Search: Keyboard shown');
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (__DEV__) console.log('Search: Keyboard hidden');
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleOutsideTap = () => {
    if (keyboardVisible || Platform.OS === 'android') {
      Keyboard.dismiss();
      if (__DEV__) console.log('Search: Keyboard dismissed by outside tap');
    }
  };

  // Auto-search when both locations are set
  useEffect(() => {
    if (__DEV__) {
      console.log('Search: Location state changed:');
      console.log('- userLatitude:', userLatitude);
      console.log('- userLongitude:', userLongitude);
      console.log('- userAddress:', userAddress);
      console.log('- destinationLatitude:', destinationLatitude);
      console.log('- destinationLongitude:', destinationLongitude);
      console.log('- destinationAddress:', destinationAddress);
    }

    const performSearch = async () => {
      if (userLatitude && userLongitude && destinationLatitude && destinationLongitude && destinationAddress) {
        try {
          if (__DEV__) console.log('Search: Auto-searching with locations set');
          
          await searchRides({
            destinationAddress,
            destinationLat: destinationLatitude,
            destinationLng: destinationLongitude,
            userLat: userLatitude,
            userLng: userLongitude,
            radiusKm: 10,
          });

          if (__DEV__) console.log('Search: Auto-search completed, navigating to confirm-ride');
          router.push('/(root)/confirm-ride?fromSearch=true');
        } catch (error) {
          if (__DEV__) console.error('Search: Auto-search error:', error);
          showErrorToast(
            `Unable to search for rides. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'Search Failed'
          );
        }
      }
    };

    // Small delay to prevent rapid-fire searches during initialization
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [userLatitude, userLongitude, destinationLatitude, destinationLongitude, destinationAddress, searchRides]);

  const handleInputFocus = () => {
    // Expand to highest snap point when input is focused
    bottomSheetRef?.current?.snapToIndex(1);
  };

  const handleFromPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    if (__DEV__) console.log('Search: From location selected:', location);
    setUserLocation(location);
  };

  const handleToPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    if (__DEV__) console.log('Search: To location selected:', location);
    setDestinationLocation(location);
  };

  // Create map props for enhanced map display
  const createMapProps = () => {
    const mapProps: any = {};

    // Add user's origin if available
    if (userLatitude && userLongitude) {
      mapProps.originMarker = {
        latitude: userLatitude,
        longitude: userLongitude,
        title: "Your Location",
        description: userAddress || "Pickup location",
      };
    }

    // Add destination marker if available
    if (destinationLatitude && destinationLongitude) {
      mapProps.destinationMarker = {
        latitude: destinationLatitude,
        longitude: destinationLongitude,
        title: "Destination", 
        description: destinationAddress || "Drop-off location",
      };
      mapProps.showRoute = true;
    }

    return Object.keys(mapProps).length > 0 ? mapProps : undefined;
  };

  const mapProps = createMapProps();

  return (
    <RideLayout 
      title="Find Nearby Rides" 
      snapPoints={keyboardVisible ? ["85%", "95%"] : ["85%", "95%"]} 
      hasScrollableContent={true}
      initialIndex={1}
      onBottomSheetRef={setBottomSheetRef}
      mapProps={mapProps}
    >
      <TouchableWithoutFeedback onPress={handleOutsideTap}>
        <View style={{ flex: 1, paddingTop: 20 }}>
          <View className="mx-4 mb-4" style={{ position: 'relative', overflow: 'visible', zIndex: 1000 }}>
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? '#404040' : '#000000',
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                overflow: 'visible',
                zIndex: 1000,
              }}
            >
              {/* From Input */}
              <View
                className="flex-row items-center px-5 py-4"
                style={{
                  zIndex: 1000,
                  overflow: 'visible',
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB'
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14
                }}>
                  <Ionicons name="ellipse" size={12} color={isDark ? '#FFFFFF' : '#000000'} />
                </View>
                <View className="flex-1" style={{ zIndex: 1000, overflow: 'visible' }}>
                  <GoogleTextInput
                    icon=""
                    initialLocation={userAddress || undefined}
                    containerStyle=""
                    textInputBackgroundColor="transparent"
                    placeholder={userAddress || "Pickup location"}
                    onFocus={handleInputFocus}
                    disabled={isLoading}
                    handlePress={handleFromPress}
                  />
                </View>
              </View>

              {/* To Input */}
              <View
                className="flex-row items-center px-5 py-4"
                style={{ zIndex: 999, overflow: 'visible' }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14
                }}>
                  <Ionicons name="square" size={12} color={isDark ? '#FFFFFF' : '#000000'} />
                </View>
                <View className="flex-1" style={{ zIndex: 999, overflow: 'visible' }}>
                  <GoogleTextInput
                    icon=""
                    initialLocation={destinationAddress || undefined}
                    containerStyle=""
                    textInputBackgroundColor="transparent"
                    placeholder="Where to?"
                    autoSelectOnFocus={true}
                    onFocus={handleInputFocus}
                    disabled={isLoading}
                    handlePress={handleToPress}
                  />
                </View>
              </View>
            </View>

            {/* Connecting Line */}
            <View
              className="absolute"
              style={{
                backgroundColor: isDark ? '#404040' : '#D1D5DB',
                left: 28,
                top: 52,
                width: 2,
                height: 24,
                zIndex: 1
              }}
            />
          </View>

          {/* Loading indicator when searching for rides */}
          {isLoading && (
            <View className="mt-6 items-center justify-center">
              <ActivityIndicator size="large" color={isDark ? '#FB923C' : '#F97316'} />
              <Text className="text-sm mt-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Finding rides...</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </RideLayout>
  );
};

export default Search;