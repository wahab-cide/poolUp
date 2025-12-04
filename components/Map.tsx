import { useLocationStore } from "@/store";
import { MapProps } from "@/types/type";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Text, View, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Polyline, Callout } from "react-native-maps";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

// Route cache constants
const ROUTE_CACHE_KEY = '@route_cache';
const ROUTE_CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const Map = ({
  destinationLatitude,
  destinationLongitude,
  onDriverTimesCalculated,
  selectedDriver,
  onMapReady,
  originMarker,
  destinationMarker,
  searchMarkers = [],
  showRoute = false,
  onMarkerPress,
  showUserLocation = false,
}: MapProps = {}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number, longitude: number}[]>([]);
  const [routeCache, setRouteCache] = useState<{[key: string]: {data: any, timestamp: number}}>({});
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const { isDark } = useTheme();
  const theme = useThemeStyles();

  const mapRef = useRef<MapView>(null);
  const isFetchingRouteRef = useRef(false);
  const { userLatitude, userLongitude, userAddress, setUserLocation } = useLocationStore();


  // Get location if not available in store
  useEffect(() => {
    const getLocation = async () => {
      // If we already have location in store, use it
      if (userLatitude && userLongitude) {
        if (__DEV__) console.log('Map: Using location from store');
        setIsLoadingLocation(false);
        return;
      }

      try {
        if (__DEV__) console.log('Map: Getting location from expo-location...');
        setIsLoadingLocation(true);
        setLocationError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setIsLoadingLocation(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const address = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        const locationData = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address[0] ? `${address[0].name}, ${address[0].region}` : 'Current Location',
        };

        if (__DEV__) console.log('Map: Location obtained successfully');
        setUserLocation(locationData);
        setIsLoadingLocation(false);
      } catch (error) {
        if (__DEV__) console.error('Map: Error getting location:', error);
        setLocationError('Unable to get location');
        setIsLoadingLocation(false);
      }
    };

    getLocation();
  }, [userLatitude, userLongitude, setUserLocation]);

  // Load route cache from AsyncStorage on mount
  useEffect(() => {
    const loadRouteCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(ROUTE_CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Remove expired entries
          const now = Date.now();
          const validCache = Object.entries(parsedCache).reduce((acc, [key, value]: [string, any]) => {
            if (now - value.timestamp < ROUTE_CACHE_EXPIRY_MS) {
              acc[key] = value;
            }
            return acc;
          }, {} as {[key: string]: {data: any, timestamp: number}});
          setRouteCache(validCache);
          if (__DEV__) console.log('📦 Route cache loaded with', Object.keys(validCache).length, 'entries');
        }
      } catch (error) {
        if (__DEV__) console.error('Error loading route cache:', error);
      } finally {
        setIsCacheLoaded(true);
      }
    };

    loadRouteCache();
  }, []);

  // Fetch actual route coordinates from Google Directions API
  useEffect(() => {
    // Wait for cache to load before attempting to fetch
    if (!isCacheLoaded) {
      return;
    }

    if (!showRoute || !originMarker || !destinationMarker) {
      setRouteCoordinates([]);
      return;
    }

    const fetchRoute = async () => {
      // Guard: Prevent duplicate concurrent requests
      if (isFetchingRouteRef.current) {
        if (__DEV__) console.log('🚫 Route fetch already in progress, skipping');
        return;
      }

      const origin = `${originMarker.latitude},${originMarker.longitude}`;
      const destination = `${destinationMarker.latitude},${destinationMarker.longitude}`;

      // Create cache key from coordinates (rounded to 4 decimals for ~11m precision)
      const cacheKey = `${originMarker.latitude.toFixed(4)},${originMarker.longitude.toFixed(4)}-${destinationMarker.latitude.toFixed(4)},${destinationMarker.longitude.toFixed(4)}`;

      // Check cache first
      const cached = routeCache[cacheKey];
      if (cached && (Date.now() - cached.timestamp < ROUTE_CACHE_EXPIRY_MS)) {
        if (__DEV__) console.log('✅ Using cached route:', cacheKey);
        setRouteCoordinates(cached.data);
        return;
      }

      try {
        isFetchingRouteRef.current = true;
        if (__DEV__) console.log('🔍 Fetching new route via Directions API:', cacheKey);

        const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

        if (!googleApiKey) {
          // Fallback to straight line if no API key
          const straightLine = [
            { latitude: originMarker.latitude, longitude: originMarker.longitude },
            { latitude: destinationMarker.latitude, longitude: destinationMarker.longitude },
          ];
          setRouteCoordinates(straightLine);
          isFetchingRouteRef.current = false;
          return;
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${googleApiKey}&mode=driving`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const points = decodePolyline(route.overview_polyline.points);

          if (points.length >= 2) {
            setRouteCoordinates(points);

            // Save to cache
            const newCache = {
              ...routeCache,
              [cacheKey]: { data: points, timestamp: Date.now() }
            };
            setRouteCache(newCache);
            await AsyncStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(newCache));
            if (__DEV__) console.log('💾 Route cached:', cacheKey);
          } else {
            // Fallback to straight line
            setRouteCoordinates([
              { latitude: originMarker.latitude, longitude: originMarker.longitude },
              { latitude: destinationMarker.latitude, longitude: destinationMarker.longitude },
            ]);
          }
        } else {
          // Fallback to straight line on error
          setRouteCoordinates([
            { latitude: originMarker.latitude, longitude: originMarker.longitude },
            { latitude: destinationMarker.latitude, longitude: destinationMarker.longitude },
          ]);
        }
      } catch (error) {
        if (__DEV__) console.error('Error fetching route:', error);
        // Fallback to straight line
        setRouteCoordinates([
          { latitude: originMarker.latitude, longitude: originMarker.longitude },
          { latitude: destinationMarker.latitude, longitude: destinationMarker.longitude },
        ]);
      } finally {
        isFetchingRouteRef.current = false;
      }
    };

    fetchRoute();
  }, [showRoute, originMarker, destinationMarker, isCacheLoaded, routeCache]);

  // Function to decode Google's polyline format
  const decodePolyline = (polyline: string): {latitude: number, longitude: number}[] => {
    const points = [];
    let index = 0;
    const len = polyline.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Track if initial fit has been done and the marker state at that time
  const hasInitialFitRef = useRef(false);
  const lastFitMarkersRef = useRef<string>('');

  // Auto-fit map to show all markers - but only once on initial load or when markers meaningfully change
  useEffect(() => {
    // Create a stable key from current markers to detect actual changes
    const currentMarkersKey = `${originMarker?.latitude},${originMarker?.longitude}-${destinationMarker?.latitude},${destinationMarker?.longitude}`;

    // Skip if already done initial fit with these exact markers
    if (hasInitialFitRef.current && lastFitMarkersRef.current === currentMarkersKey) {
      return;
    }

    const fitToMarkers = () => {
      if (!mapRef.current) return;

      const allMarkers = [];

      // Priority: Always include origin and destination if available
      if (originMarker) {
        allMarkers.push({ latitude: originMarker.latitude, longitude: originMarker.longitude });
      }

      if (destinationMarker) {
        allMarkers.push({ latitude: destinationMarker.latitude, longitude: destinationMarker.longitude });
      }

      // Only add other markers if we don't have both origin and destination
      if (allMarkers.length < 2) {
        // Add user location
        if (userLatitude && userLongitude) {
          allMarkers.push({ latitude: userLatitude, longitude: userLongitude });
        }

        // Add search markers
        searchMarkers.forEach(marker => {
          allMarkers.push({ latitude: marker.latitude, longitude: marker.longitude });
        });

        // Add legacy destination if provided
        if (destinationLatitude && destinationLongitude) {
          allMarkers.push({ latitude: destinationLatitude, longitude: destinationLongitude });
        }
      }

      // Only proceed if we have valid markers
      if (allMarkers.length === 0) return;

      // Mark that we've done the initial fit and save marker state
      hasInitialFitRef.current = true;
      lastFitMarkersRef.current = currentMarkersKey;

      if (allMarkers.length > 1) {
        // Calculate edge padding with bottom sheet consideration
        const screenHeight = require('react-native').Dimensions.get('window').height;

        // Account for larger bottom sheets (some pages use 85%, 90%, or even 100%)
        // Use conservative estimate to ensure markers are always visible
        const estimatedBottomSheetHeight = screenHeight * 0.85; // Assume 85% coverage

        // Single timeout with non-animated fit for smoother initial load
        setTimeout(() => {
          try {
            mapRef.current?.fitToCoordinates(allMarkers, {
              edgePadding: {
                top: 120,
                right: 80,
                bottom: estimatedBottomSheetHeight + 40, // Add extra 40px buffer
                left: 80
              },
              animated: false, // No animation for initial fit
            });
          } catch (error) {
            if (__DEV__) console.log('Map: Error fitting to coordinates:', error);
          }
        }, 500); // Reduced delay for faster initial display
      } else if (allMarkers.length === 1) {
        // Single marker - center it
        setTimeout(() => {
          const marker = allMarkers[0];
          mapRef.current?.animateToRegion({
            latitude: marker.latitude,
            longitude: marker.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 0); // No animation
        }, 500);
      }
    };

    // Only fit when we have markers
    if (originMarker || destinationMarker || (userLatitude && userLongitude)) {
      fitToMarkers();
    }
  }, [originMarker?.latitude, originMarker?.longitude, destinationMarker?.latitude, destinationMarker?.longitude]);

  // Return early if on web platform
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: 'gray', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>Map is only available on mobile devices</Text>
      </View>
    );
  }

  // Test if MapView is actually available
  if (!MapView) {
    return (
      <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>MapView is not available!</Text>
      </View>
    );
  }

  // Show loading if getting location
  if (isLoadingLocation) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#e3f2fd', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderRadius: 16
      }}>
        <ActivityIndicator size="large" color={theme.activityIndicator.primary} />
        <Text style={{ color: '#1976d2', marginTop: 16, fontSize: 16 }}>
          Loading your location...
        </Text>
      </View>
    );
  }

  // Show error if location failed
  if (locationError) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#ffebee', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderRadius: 16
      }}>
        <Text style={{ color: '#d32f2f', fontSize: 16, textAlign: 'center' }}>
          {locationError}
        </Text>
        <Text style={{ color: '#757575', marginTop: 8, fontSize: 12, textAlign: 'center' }}>
          Please enable location access in settings
        </Text>
      </View>
    );
  }

  // Show loading if user location is not available
  if (!userLatitude || !userLongitude) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#e3f2fd', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderRadius: 16
      }}>
        <ActivityIndicator size="large" color={theme.activityIndicator.primary} />
        <Text style={{ color: '#1976d2', marginTop: 16, fontSize: 16 }}>
          Loading your location...
        </Text>
        <Text style={{ color: '#757575', marginTop: 8, fontSize: 12 }}>
          Lat: {userLatitude || 'N/A'}, Lng: {userLongitude || 'N/A'}
        </Text>
      </View>
    );
  }

  // Calculate map region to fit all markers with bottom sheet consideration
  const calculateMapRegion = () => {
    const allLatitudes = [];
    const allLongitudes = [];

    // Priority: origin and destination markers first
    if (originMarker) {
      allLatitudes.push(originMarker.latitude);
      allLongitudes.push(originMarker.longitude);
    }

    if (destinationMarker) {
      allLatitudes.push(destinationMarker.latitude);
      allLongitudes.push(destinationMarker.longitude);
    }

    // Fallback to user location if no origin/destination
    if (allLatitudes.length === 0 && userLatitude && userLongitude) {
      allLatitudes.push(userLatitude);
      allLongitudes.push(userLongitude);
    }

    // Add search markers only if we don't have origin and destination
    if (allLatitudes.length < 2) {
      searchMarkers.forEach(marker => {
        allLatitudes.push(marker.latitude);
        allLongitudes.push(marker.longitude);
      });

      if (destinationLatitude && destinationLongitude) {
        allLatitudes.push(destinationLatitude);
        allLongitudes.push(destinationLongitude);
      }
    }

    // Filter out null values
    const validLatitudes = allLatitudes.filter(lat => lat !== null) as number[];
    const validLongitudes = allLongitudes.filter(lng => lng !== null) as number[];

    if (validLatitudes.length === 0 || validLongitudes.length === 0) {
      return {
        latitude: userLatitude || 0,
        longitude: userLongitude || 0,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    const minLat = Math.min(...validLatitudes);
    const maxLat = Math.max(...validLatitudes);
    const minLng = Math.min(...validLongitudes);
    const maxLng = Math.max(...validLongitudes);

    // Calculate the latitude range
    const latRange = maxLat - minLat;

    // Shift center slightly upward to account for bottom sheet covering lower portion
    const visibleAreaOffset = latRange * 0.05; // Shift up by 5% of range
    const centerLat = (minLat + maxLat) / 2 + visibleAreaOffset;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate deltas with padding for bottom sheet
    let latDelta = latRange;
    let lngDelta = (maxLng - minLng);

    // Add padding based on distance
    if (latDelta < 0.01) {
      latDelta = 0.03;
      lngDelta = 0.03;
    } else if (latDelta < 0.1) {
      latDelta *= 1.6;
      lngDelta *= 1.5;
    } else {
      latDelta *= 1.3;
      lngDelta *= 1.3;
    }

    // Ensure minimum zoom levels
    latDelta = Math.max(latDelta, 0.02);
    lngDelta = Math.max(lngDelta, 0.02);

    // Cap maximum zoom out
    latDelta = Math.min(latDelta, 1.0);
    lngDelta = Math.min(lngDelta, 1.0);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  // Calculate map region with bottom sheet consideration
  const calculateMapRegionWithBottomSheet = () => {
    const allLatitudes = [];
    const allLongitudes = [];
    
    // Priority: origin and destination markers
    if (originMarker) {
      allLatitudes.push(originMarker.latitude);
      allLongitudes.push(originMarker.longitude);
    }
    
    if (destinationMarker) {
      allLatitudes.push(destinationMarker.latitude);
      allLongitudes.push(destinationMarker.longitude);
    }
    
    // Fallback to other markers if needed
    if (allLatitudes.length < 2) {
      if (userLatitude && userLongitude) {
        allLatitudes.push(userLatitude);
        allLongitudes.push(userLongitude);
      }
      
      searchMarkers.forEach(marker => {
        allLatitudes.push(marker.latitude);
        allLongitudes.push(marker.longitude);
      });
      
      if (destinationLatitude && destinationLongitude) {
        allLatitudes.push(destinationLatitude);
        allLongitudes.push(destinationLongitude);
      }
    }
    
    // Filter out null values
    const validLatitudes = allLatitudes.filter(lat => lat !== null) as number[];
    const validLongitudes = allLongitudes.filter(lng => lng !== null) as number[];
    
    if (validLatitudes.length === 0 || validLongitudes.length === 0) {
      return {
        latitude: userLatitude,
        longitude: userLongitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    
    const minLat = Math.min(...validLatitudes);
    const maxLat = Math.max(...validLatitudes);
    const minLng = Math.min(...validLongitudes);
    const maxLng = Math.max(...validLongitudes);
    
    // Calculate the visible area offset
    // Bottom sheet covers ~65% of screen, so we need to shift the center up slightly
    const latRange = maxLat - minLat;
    const visibleAreaOffset = latRange * 0.03; // Shift center up by only 3% of the range
    
    // Calculate adjusted center (shifted up to account for bottom sheet)
    const centerLat = (minLat + maxLat) / 2 + visibleAreaOffset;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate deltas with extra padding for bottom sheet
    let latDelta = (maxLat - minLat);
    let lngDelta = (maxLng - minLng);
    
    // Add moderate padding to account for bottom sheet coverage
    latDelta *= 1.3;
    lngDelta *= 1.25;
    
    // Ensure minimum zoom levels
    latDelta = Math.max(latDelta, 0.025);
    lngDelta = Math.max(lngDelta, 0.025);
    
    // Cap maximum zoom out
    latDelta = Math.min(latDelta, 1.0);
    lngDelta = Math.min(lngDelta, 1.0);
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  const mapRegion = calculateMapRegion();

  const getMapStyle = () => {
    if (isDark) {
      return [
        // Dark mode with similar color relationships to light mode
        { "featureType": "all", "elementType": "all", "stylers": [{ "saturation": -40 }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#2a3f5f" }] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#1a1d28" }] },
        { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#1f2429" }] },
        { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#2d4a3a" }] },
        { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6ba382" }] },
        { "featureType": "landscape.natural.landcover", "elementType": "geometry", "stylers": [{ "color": "#2d4a3a" }] },
        { "featureType": "landscape.natural.terrain", "elementType": "geometry", "stylers": [{ "color": "#2d4a3a" }] },
        { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2d3441" }] },
        { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1a1d28" }, { "weight": 0.5 }] },
        { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#3d4554" }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1a1d28" }, { "weight": 0.8 }] },
        { "featureType": "poi.business", "elementType": "all", "stylers": [{ "visibility": "off" }] },
        { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#b0b5c0" }] },
        { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a1d28" }, { "weight": 2 }] },
      ];
    } else {
      return [
        // Light mode matching the reference screenshot
        { "featureType": "all", "elementType": "all", "stylers": [{ "saturation": -15 }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c8dcea" }] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#ececf0" }] },
        { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#ececf0" }] },
        { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#9fd6a0" }] },
        { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#4a7c59" }] },
        { "featureType": "landscape.natural.landcover", "elementType": "geometry", "stylers": [{ "color": "#a8e6b0" }] },
        { "featureType": "landscape.natural.terrain", "elementType": "geometry", "stylers": [{ "color": "#a8e6b0" }] },
        { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
        { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#c8c8d0" }, { "weight": 0.5 }] },
        { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#a8a8b0" }, { "weight": 0.8 }] },
        { "featureType": "poi.business", "elementType": "all", "stylers": [{ "visibility": "off" }] },
        { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#5a5a6a" }] },
        { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }, { "weight": 3 }] },
        { "featureType": "transit.line", "elementType": "all", "stylers": [{ "visibility": "off" }] },
      ];
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ 
          flex: 1, 
          borderRadius: 20,
        }}
        initialRegion={mapRegion}
        mapType="standard"
        showsUserLocation={false} // We'll use custom user marker
        showsMyLocationButton={false} // Hide My Location button
        showsCompass={false} // Hide compass
        showsPointsOfInterest={true}
        showsBuildings={true}
        loadingEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        onMapReady={() => {
          if (__DEV__) console.log('Map: Loaded successfully with user location');
          onMapReady?.();
        }}
        customMapStyle={getMapStyle() as any}
      >
        {/* User's current location marker - only show on home feed */}
        {showUserLocation && (
          <Marker
            coordinate={{
              latitude: userLatitude,
              longitude: userLongitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {/* Outer white circle with blue dot */}
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 10,
            }}>
              {/* Inner blue dot */}
              <View style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#3B82F6',
              }} />
            </View>

            {/* Custom callout */}
            <Callout tooltip={true}>
              <View style={{
                backgroundColor: isDark ? '#161616' : '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                minWidth: 160,
                maxWidth: 220,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 10,
              }}>
                {/* Title with icon */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: userAddress ? 8 : 0,
                  paddingBottom: userAddress ? 8 : 0,
                  borderBottomWidth: userAddress ? 1 : 0,
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}>
                    <Feather
                      name="map-pin"
                      size={14}
                      color="#3B82F6"
                    />
                  </View>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: isDark ? '#FFFFFF' : '#111827',
                    letterSpacing: -0.2,
                  }}>
                    You are here
                  </Text>
                </View>

                {/* Address centered */}
                {userAddress && (
                  <Text style={{
                    fontSize: 12,
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    lineHeight: 16,
                    fontWeight: '500',
                    textAlign: 'center',
                  }}>
                    {userAddress}
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        )}

        {/* Origin marker */}
        {originMarker && (
          <Marker
            coordinate={{
              latitude: originMarker.latitude,
              longitude: originMarker.longitude,
            }}
            title={originMarker.title || "Origin"}
            description={originMarker.description}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => onMarkerPress?.('origin')}
          >
            <View style={{
              width: 20,
              height: 20,
              backgroundColor: isDark ? '#FFFFFF' : '#000000',
              borderWidth: 2,
              borderColor: isDark ? '#000000' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 8,
            }} />
          </Marker>
        )}
        
        {/* Destination marker */}
        {destinationMarker && (
          <Marker
            coordinate={{
              latitude: destinationMarker.latitude,
              longitude: destinationMarker.longitude,
            }}
            title={destinationMarker.title || "Destination"}
            description={destinationMarker.description}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => onMarkerPress?.('destination')}
          >
            <View style={{
              width: 18,
              height: 24,
              backgroundColor: isDark ? '#FFFFFF' : '#000000',
              borderWidth: 2,
              borderColor: isDark ? '#000000' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 8,
            }} />
          </Marker>
        )}
        
        {/* Legacy destination marker (for backward compatibility) */}
        {destinationLatitude && destinationLongitude && !destinationMarker && (
          <Marker
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            title="Destination"
            description="Selected destination"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{
              width: 18,
              height: 24,
              backgroundColor: isDark ? '#FFFFFF' : '#000000',
              borderWidth: 2,
              borderColor: isDark ? '#000000' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 5,
            }} />
          </Marker>
        )}
        
        {/* Search result markers */}
        {searchMarkers.map((marker, index) => {
          // Parse description to extract price and seats
          const descParts = marker.description?.split('•') || [];
          const priceText = descParts[0]?.trim() || '';
          const seatsText = descParts[1]?.trim() || '';

          return (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => onMarkerPress?.(marker.id)}
            >
              {/* Custom marker pin */}
              <View style={{
                alignItems: 'center',
              }}>
                {/* Pin top */}
                <View style={{
                  backgroundColor: '#9e9e9e',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 8,
                }}>
                  <Feather
                    name="navigation"
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                {/* Pin bottom point */}
                <View style={{
                  width: 0,
                  height: 0,
                  backgroundColor: 'transparent',
                  borderStyle: 'solid',
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderTopWidth: 8,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: '#9e9e9e',
                  marginTop: -2,
                }} />
              </View>

              {/* Custom callout */}
              <Callout
                tooltip={true}
                onPress={() => onMarkerPress?.(marker.id)}
              >
                <View style={{
                  backgroundColor: isDark ? '#161616' : '#FFFFFF',
                  borderRadius: 12,
                  padding: 12,
                  minWidth: 180,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 10,
                }}>
                  {/* Ride Type */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Feather
                      name={marker.title?.includes('Request') ? 'user' : 'car'}
                      size={14}
                      color="#9e9e9e"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isDark ? '#FFFFFF' : '#111827',
                    }}>
                      {marker.title}
                    </Text>
                  </View>

                  {/* Details */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  }}>
                    {/* Price */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Feather
                        name="dollar-sign"
                        size={13}
                        color="#9e9e9e"
                        style={{ marginRight: 3 }}
                      />
                      <Text style={{
                        fontSize: 15,
                        fontWeight: 'bold',
                        color: '#9e9e9e',
                      }}>
                        {priceText}
                      </Text>
                    </View>

                    {/* Seats */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Feather
                        name="users"
                        size={13}
                        color={isDark ? '#9CA3AF' : '#6B7280'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                      }}>
                        {seatsText}
                      </Text>
                    </View>
                  </View>

                  {/* Tap indicator */}
                  <View style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: 11,
                      color: '#9e9e9e',
                      fontWeight: '500',
                    }}>
                      Tap to view details
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
        
        {/* Route polyline */}
        {showRoute && routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={isDark ? '#FFFFFF' : '#000000'}
            strokeWidth={3}
            strokeOpacity={1.0}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
    </View>
  );
};

export default Map;