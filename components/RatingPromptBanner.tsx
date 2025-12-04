import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fetchAPI } from '@/lib/fetch';

interface PendingRating {
  bookingId: string;
  rideId: string;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  completedAt?: string | null;
  userRole: 'rider' | 'driver';
  ratingType: 'driver_rating' | 'rider_rating';
  ratedUserId: string;
  ratedUserName: string;
  ratedUserAvatar?: string;
  ratingLabel: string;
}

interface RatingPromptBannerProps {
  userClerkId: string;
  onRatingPress: (rating: PendingRating) => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

const RatingPromptBanner: React.FC<RatingPromptBannerProps> = ({
  userClerkId,
  onRatingPress,
  refreshTrigger
}) => {
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchPendingRatings = useCallback(async () => {
    try {
      const response = await fetchAPI(`/api/ratings/pending?clerkId=${userClerkId}`);
      
      if (response.success) {
        setPendingRatings(response.data.pendingRatings || []);
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching pending ratings:', error);
    } finally {
      setLoading(false);
    }
  }, [userClerkId]);

  useEffect(() => {
    if (userClerkId) {
      fetchPendingRatings();
    }
  }, [userClerkId, fetchPendingRatings]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchPendingRatings();
    }
  }, [refreshTrigger, fetchPendingRatings]);

  // Auto-cycle through ratings every 5 seconds
  useEffect(() => {
    if (pendingRatings.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % pendingRatings.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [pendingRatings.length]);

  const handleDismiss = (rating: PendingRating) => {
    Alert.alert(
      'Skip Rating',
      'Are you sure you want to skip rating this ride? You can still rate it later from your ride history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => {
            setPendingRatings(prev => prev.filter(r => r.bookingId !== rating.bookingId));
          }
        }
      ]
    );
  };

  const formatTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just completed';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      return `${Math.floor(diffInHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  if (loading || pendingRatings.length === 0) {
    return null;
  }

  const currentRating = pendingRatings[currentIndex];
  
  if (!currentRating) {
    return null;
  }

  return (
    <View 
      className="mx-4 my-3 rounded-2xl p-4"
      style={{
        backgroundColor: '#F59E0B', // Solid amber/orange background
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F97316'
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View 
            className="rounded-full p-2 mr-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Feather name="star" size={20} color="white" />
          </View>
          <View>
            <Text className="text-white font-bold text-lg">Rate Your Ride</Text>
            <Text className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              {formatTimeAgo(currentRating.completedAt)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => handleDismiss(currentRating)}
          className="w-8 h-8 items-center justify-center"
        >
          <Feather name="x" size={18} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center mb-4">
        <Image
          source={{ 
            uri: currentRating.ratedUserAvatar || 'https://via.placeholder.com/40x40' 
          }}
          className="w-12 h-12 rounded-full mr-3"
          style={{ borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }}
        />
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {currentRating.ratingLabel}: {currentRating.ratedUserName}
          </Text>
          <Text className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }} numberOfLines={1}>
            {currentRating.fromLocation} → {currentRating.toLocation}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onRatingPress(currentRating)}
          className="flex-1 rounded-xl py-3 mr-3 flex-row items-center justify-center"
          style={{
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <Feather name="star" size={16} color="#F59E0B" />
          <Text className="text-orange-600 font-semibold ml-2">Rate Now</Text>
        </TouchableOpacity>

        {pendingRatings.length > 1 && (
          <View className="flex-row items-center">
            <Text className="text-xs mr-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {currentIndex + 1} of {pendingRatings.length}
            </Text>
            <View className="flex-row">
              {pendingRatings.map((_, index) => (
                <View
                  key={index}
                  className="w-2 h-2 rounded-full mx-0.5"
                  style={{
                    backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)'
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default RatingPromptBanner;