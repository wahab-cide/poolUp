import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

import { useTheme } from "@/contexts/ThemeContext";
import { useLocationStore } from "@/store";
import { GoogleInputProps } from "@/types/type";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

// Cache keys
const LOCATION_CACHE_KEY = '@location_cache';
const RECENT_SEARCHES_KEY = '@recent_searches';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RECENT_SEARCHES = 8; // Keep last 8 recent searches

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
}

interface PlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  name: string;
}

interface RecentSearch {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  placeholder,
  autoSelectOnFocus = false,
  onFocus,
  disabled = false,
  handlePress,
}: GoogleInputProps) => {
  const [searchText, setSearchText] = useState(initialLocation || "");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const { userLatitude, userLongitude } = useLocationStore();
  const { isDark } = useTheme();

  // Session token for autocomplete (saves 60% cost by grouping requests)
  const sessionTokenRef = useRef<string>(uuidv4());

  // Cache for autocomplete results
  const [locationCache, setLocationCache] = useState<{[key: string]: {data: any, timestamp: number}}>({});

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Update search text when initialLocation prop changes
  useEffect(() => {
    if (initialLocation && initialLocation !== searchText) {
      setSearchText(initialLocation);
    }
  }, [initialLocation]);

  // Load cache and recent searches from AsyncStorage on mount
  useEffect(() => {
    loadCache();
    loadRecentSearches();
  }, []);

  const loadCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Remove expired entries
        const now = Date.now();
        const validCache = Object.entries(parsedCache).reduce((acc, [key, value]: [string, any]) => {
          if (now - value.timestamp < CACHE_EXPIRY_MS) {
            acc[key] = value;
          }
          return acc;
        }, {} as {[key: string]: {data: any, timestamp: number}});
        setLocationCache(validCache);
      }
    } catch (error) {
      console.error('Error loading location cache:', error);
    }
  };

  const saveToCache = async (key: string, data: any) => {
    try {
      const newCache = {
        ...locationCache,
        [key]: { data, timestamp: Date.now() }
      };
      setLocationCache(newCache);
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed: RecentSearch[] = JSON.parse(stored);
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveToRecentSearches = async (search: Omit<RecentSearch, 'timestamp'>) => {
    try {
      // Remove duplicates (same address) and add new search to the beginning
      const filtered = recentSearches.filter(
        item => item.address.toLowerCase() !== search.address.toLowerCase()
      );

      const newRecentSearches = [
        { ...search, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_RECENT_SEARCHES); // Keep only the most recent ones

      setRecentSearches(newRecentSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecentSearches));

      if (__DEV__) console.log('📍 Saved to recent searches:', search.address);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Check if API key exists
  if (!googlePlacesApiKey) {
    console.warn('Google Places API key is missing. Please check your environment variables.');
  }

  const searchPlaces = async (query: string) => {
    // OPTIMIZATION 1: Minimum 3 characters (saves ~40-50% requests)
    if (!query.trim() || query.length < 3) {
      setPredictions([]);
      return;
    }

    // OPTIMIZATION 2: Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = locationCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
      if (__DEV__) console.log('✅ Using cached results for:', query);
      setPredictions(cached.data);
      return;
    }

    if (!googlePlacesApiKey) {
      console.error('Google Places API key is missing!');
      return;
    }

    try {
      setIsLoading(true);
      if (__DEV__) console.log('🔍 Google API call for:', query);

      // Build location bias parameters if user location is available
      const locationBias = userLatitude && userLongitude
        ? `&location=${userLatitude},${userLongitude}&radius=50000` // 50km radius
        : '';

      // OPTIMIZATION 3: Use session token (saves 60% on autocomplete costs)
      const sessionToken = `&sessiontoken=${sessionTokenRef.current}`;

      // OPTIMIZATION 5: Single autocomplete call (saves 50% - was 2 calls, now 1)
      // Combine establishment and geocode types in single request
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${googlePlacesApiKey}&language=en${locationBias}${sessionToken}`
      );

      const data = await response.json();
      let allPredictions: PlacePrediction[] = [];

      if (data.status === 'OK' && data.predictions) {
        allPredictions = data.predictions;
      }

      // Sort results: establishments (colleges, businesses) first, then addresses
      allPredictions.sort((a, b) => {
        const aTypes = a.types || [];
        const bTypes = b.types || [];

        const aIsEstablishment = aTypes.includes('establishment') || aTypes.includes('point_of_interest');
        const bIsEstablishment = bTypes.includes('establishment') || bTypes.includes('point_of_interest');

        if (aIsEstablishment && !bIsEstablishment) return -1;
        if (!aIsEstablishment && bIsEstablishment) return 1;
        return 0;
      });

      const finalPredictions = allPredictions.slice(0, 8); // Limit to 8 results
      setPredictions(finalPredictions);

      // OPTIMIZATION 4: Cache the results
      await saveToCache(cacheKey, finalPredictions);
      
    } catch (error) {
      console.error('Error fetching places:', error);
      
      // Fallback to basic address search if hybrid search fails
      try {
        const fallbackResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${googlePlacesApiKey}&language=en`
        );
        
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.status === 'OK') {
          setPredictions(fallbackData.predictions || []);
        } else {
          setPredictions([]);
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        setPredictions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string, prediction?: PlacePrediction) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${googlePlacesApiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const details: PlaceDetails = data.result;
        if (details.geometry?.location && handlePress) {
          // Use the full prediction description for better location disambiguation
          let displayAddress = prediction?.description || details.formatted_address;

          handlePress({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            address: displayAddress,
          });

          // Save to recent searches
          await saveToRecentSearches({
            address: displayAddress,
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // OPTIMIZATION 1: Increase debounce to 500ms (saves 60-70% requests)
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 500);
  };

  const handlePredictionPress = (prediction: PlacePrediction) => {
    // Use the user-friendly main_text for display consistency
    const displayText = prediction.structured_formatting?.main_text || prediction.description;
    setSearchText(displayText);
    setShowPredictions(false);
    setPredictions([]);

    // Dismiss keyboard and clear focus on Android
    if (Platform.OS === 'android') {
      textInputRef.current?.blur();
      Keyboard.dismiss();
    }

    // Generate new session token for next search session
    sessionTokenRef.current = uuidv4();

    getPlaceDetails(prediction.place_id, prediction);
  };

  const handleRecentSearchPress = (recentSearch: RecentSearch) => {
    setSearchText(recentSearch.address.split(',')[0].trim()); // Show short version
    setShowPredictions(false);
    setPredictions([]);

    // Dismiss keyboard on Android
    if (Platform.OS === 'android') {
      textInputRef.current?.blur();
      Keyboard.dismiss();
    }

    // Call handlePress with the stored coordinates
    if (handlePress) {
      handlePress({
        latitude: recentSearch.latitude,
        longitude: recentSearch.longitude,
        address: recentSearch.address,
      });
    }

    if (__DEV__) console.log('🕒 Selected from recent searches:', recentSearch.address);
  };

  const handleManualSubmit = async () => {
    if (searchText.trim() && handlePress) {
      try {
        // Use Google Geocoding API for manual text entry
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchText.trim())}&key=${googlePlacesApiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];

          // Use the full formatted address for manual entries
          handlePress({
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            address: result.formatted_address,
          });

          // Save to recent searches
          await saveToRecentSearches({
            address: result.formatted_address,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          });
        } else {
          console.warn('Geocoding failed:', data.status, data.error_message);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    }
  };

  const handleInputFocus = () => {
    // Show predictions modal
    setShowPredictions(true);
    
    if (predictions.length === 0 && searchText.length >= 2) {
      searchPlaces(searchText);
    }
    if (autoSelectOnFocus && searchText) {
      setTimeout(() => {
        textInputRef.current?.setSelection(0, searchText.length);
      }, 100);
    }
    onFocus?.();
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle Android-specific focus behavior for modal
  useEffect(() => {
    if (showPredictions && Platform.OS === 'android') {
      // Delay focus to ensure modal is fully rendered and keyboard opens
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else if (!showPredictions && Platform.OS === 'android') {
      // Ensure keyboard is dismissed when modal closes on Android
      textInputRef.current?.blur();
      Keyboard.dismiss();
    }
  }, [showPredictions]);

  const getLocationIcon = (prediction: PlacePrediction) => {
    const types = prediction.types || [];
    const description = prediction.description.toLowerCase();
    
    // Check for specific location types
    if (types.includes('university') || types.includes('school') || description.includes('university') || description.includes('college')) {
      return 'school-outline';
    }
    if (types.includes('hospital') || description.includes('hospital') || description.includes('medical')) {
      return 'medical-outline';
    }
    if (types.includes('airport') || description.includes('airport')) {
      return 'airplane-outline';
    }
    if (types.includes('train_station') || types.includes('transit_station') || description.includes('station')) {
      return 'train-outline';
    }
    if (types.includes('shopping_mall') || types.includes('store') || description.includes('mall') || description.includes('shop')) {
      return 'storefront-outline';
    }
    if (types.includes('restaurant') || types.includes('food') || description.includes('restaurant')) {
      return 'restaurant-outline';
    }
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return 'business-outline';
    }
    // Default for addresses and general locations
    return 'location-outline';
  };

  const renderPrediction = (item: PlacePrediction) => (
    <TouchableOpacity
      key={item.place_id}
      onPress={() => handlePredictionPress(item)}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-4 border-b"
      style={{
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
      }}
    >
      {/* Location Type Icon */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{
          backgroundColor: isDark ? '#0D0D0D' : '#F3F4F6'
        }}
      >
        <Ionicons
          name={getLocationIcon(item) as any}
          size={20}
          color={isDark ? '#9CA3AF' : '#6B7280'}
        />
      </View>
      
      {/* Location Details */}
      <View className="flex-1">
        <Text 
          className="font-semibold text-base" 
          style={{ color: isDark ? '#FFFFFF' : '#111827' }} 
          numberOfLines={1}
        >
          {item.structured_formatting?.main_text || item.description.split(',')[0]}
        </Text>
        {item.structured_formatting?.secondary_text && (
          <Text 
            className="text-sm mt-0.5" 
            style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} 
            numberOfLines={1}
          >
            {item.structured_formatting.secondary_text}
          </Text>
        )}
      </View>

      {/* Arrow Icon */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? '#6B7280' : '#9CA3AF'}
      />
    </TouchableOpacity>
  );

  const renderRecentSearch = (item: RecentSearch, index: number) => {
    // Split address to show main text and secondary text
    const parts = item.address.split(',');
    const mainText = parts[0].trim();
    const secondaryText = parts.slice(1).join(',').trim();

    return (
      <TouchableOpacity
        key={`recent-${index}`}
        onPress={() => handleRecentSearchPress(item)}
        activeOpacity={0.7}
        className="flex-row items-center px-4 py-4 border-b"
        style={{
          backgroundColor: isDark ? '#161616' : '#FFFFFF',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
        }}
      >
        {/* Clock Icon */}
        <View className="mr-3">
          <Ionicons
            name="time-outline"
            size={20}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </View>

        {/* Location Details */}
        <View className="flex-1">
          <Text
            className="font-semibold text-base"
            style={{ color: isDark ? '#FFFFFF' : '#111827' }}
            numberOfLines={1}
          >
            {mainText}
          </Text>
          {secondaryText && (
            <Text
              className="text-sm mt-0.5"
              style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
              numberOfLines={1}
            >
              {secondaryText}
            </Text>
          )}
        </View>

        {/* Arrow Icon */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? '#6B7280' : '#9CA3AF'}
        />
      </TouchableOpacity>
    );
  };

  const renderRecentSearches = () => {
    // Only show recent searches if search text is empty or less than 3 characters
    // and there are no autocomplete predictions showing
    if (searchText.length >= 3 || predictions.length > 0 || recentSearches.length === 0) {
      return null;
    }

    return (
      <View>
        {/* Section Header */}
        <View className="px-4 py-3 border-b" style={{ borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }}>
          <Text
            className="text-sm font-semibold"
            style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
          >
            Recent searches
          </Text>
        </View>

        {/* Recent Search Items */}
        {recentSearches.map((item, index) => renderRecentSearch(item, index))}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View className="flex-row items-center px-4 py-8">
          <ActivityIndicator 
            size="small" 
            color={isDark ? '#3B82F6' : '#3B82F6'} 
            style={{ marginRight: 12 }}
          />
          <Text 
            className="text-base" 
            style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
          >
            Searching locations...
          </Text>
        </View>
      );
    }

    if (searchText.length >= 3 && !isLoading && predictions.length === 0) {
      return (
        <View className="items-center py-12">
          <Ionicons
            name="search"
            size={24}
            color={isDark ? '#6B7280' : '#9CA3AF'}
            style={{ marginBottom: 8 }}
          />
          <Text 
            className="text-base font-medium" 
            style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
          >
            No locations found
          </Text>
          <Text 
            className="text-sm mt-1" 
            style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}
          >
            Try a different search
          </Text>
        </View>
      );
    }

    return null;
  };

  // Regular input
  return (
    <>
      <View className={`flex-1 ${containerStyle}`}>
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon === "search" ? "search" : "search"}
              size={20}
              color="#6B7280"
              style={{ marginRight: 12 }}
            />
          )}
          <TextInput
            ref={textInputRef}
            placeholder={initialLocation ?? placeholder ?? "Where do you want to go?"}
            placeholderTextColor={disabled ? "#9CA3AF" : isDark ? "#9CA3AF" : "#6B7280"}
            value={searchText}
            onChangeText={disabled ? undefined : handleTextChange}
            onFocus={disabled ? undefined : handleInputFocus}
            onSubmitEditing={disabled ? undefined : handleManualSubmit}
            returnKeyType="search"
            editable={!disabled}
            className="flex-1 text-base font-medium"
            style={{
              backgroundColor: textInputBackgroundColor || "transparent",
              color: isDark ? '#FFFFFF' : '#000000',
              paddingVertical: Platform.OS === 'ios' ? 8 : 6,
              opacity: disabled ? 0.6 : 1,
            }}
          />
        </View>
      </View>

      {/* Predictions Modal */}
      <Modal
        visible={showPredictions && !disabled}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowPredictions(false);
          // Dismiss keyboard when modal closes on Android
          if (Platform.OS === 'android') {
            textInputRef.current?.blur();
            Keyboard.dismiss();
          }
        }}
        onShow={() => {
          // Ensure keyboard opens on Android when modal is shown
          if (Platform.OS === 'android') {
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 200);
          }
        }}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: isDark ? '#000000' : '#FFFFFF'
          }}
        >
          {/* Header */}
          <View 
            className="flex-row items-center px-4 py-3 border-b"
            style={{
              backgroundColor: isDark ? '#0D0D0D' : '#FFFFFF',
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB'
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setShowPredictions(false);
                // Dismiss keyboard when closing modal on Android
                if (Platform.OS === 'android') {
                  textInputRef.current?.blur();
                  Keyboard.dismiss();
                }
              }}
              className="mr-3"
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={isDark ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
            <TextInput
              ref={textInputRef}
              placeholder={placeholder ?? "Where do you want to go?"}
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={searchText}
              onChangeText={handleTextChange}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="search"
              autoFocus={Platform.OS === 'ios'}
              className="flex-1 text-base font-medium"
              style={{
                color: isDark ? '#FFFFFF' : '#000000',
                paddingVertical: Platform.OS === 'ios' ? 8 : 4,
              }}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchText('');
                  setPredictions([]);
                }}
                className="ml-2"
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={isDark ? '#6B7280' : '#9CA3AF'} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Predictions List */}
          <TouchableWithoutFeedback onPress={() => {
            if (Platform.OS === 'android') {
              textInputRef.current?.blur();
              Keyboard.dismiss();
            }
          }}>
            <ScrollView
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {renderRecentSearches()}
              {predictions.map((item) => renderPrediction(item))}
              {renderEmptyState()}
            </ScrollView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default GoogleTextInput;