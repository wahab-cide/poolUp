import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '@/lib/fetch';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId: string;
  ratedUserId: string;
  ratedUserName: string;
  ratedUserAvatar?: string;
  ratingType: 'driver_rating' | 'rider_rating';
  rideDetails: {
    from: string;
    to: string;
    departureTime: string;
  };
  userClerkId: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSuccess,
  bookingId,
  ratedUserId,
  ratedUserName,
  ratedUserAvatar,
  ratingType,
  rideDetails,
  userClerkId
}) => {
  const { isDark } = useTheme();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [safety, setSafety] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDriverRating = ratingType === 'driver_rating';
  const title = isDriverRating ? 'Rate Driver' : 'Rate Rider';

  const resetForm = () => {
    setRating(0);
    setReviewText('');
    setPunctuality(0);
    setCommunication(0);
    setCleanliness(0);
    setSafety(0);
    setIsAnonymous(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchAPI('/api/ratings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: userClerkId,
          bookingId,
          ratedUserId,
          rating,
          reviewText: reviewText.trim() || null,
          punctuality: punctuality || null,
          communication: communication || null,
          cleanliness: cleanliness || null,
          safety: safety || null,
          ratingType,
          isAnonymous
        })
      });

      if (response.success) {
        Alert.alert(
          'Rating Submitted',
          'Thank you for your feedback! Your rating has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onSuccess();
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label,
    isRequired = false,
    size = 'large'
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
    isRequired?: boolean;
    size?: 'small' | 'large';
  }) => (
    <View className={size === 'large' ? 'mb-6' : 'mb-4'}>
      <Text className={`font-semibold mb-3 ${size === 'large' ? 'text-lg' : 'text-base'}`} style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}>
        {label} {isRequired && <Text className="text-red-500">*</Text>}
      </Text>
      <View className="flex-row items-center justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={{ marginHorizontal: size === 'large' ? 8 : 4 }}
            activeOpacity={0.7}
          >
            <View style={{
              transform: [{ scale: star <= value ? 1.1 : 1 }],
              transition: 'transform 0.2s'
            }}>
              <Ionicons
                name={star <= value ? "star" : "star-outline"}
                size={size === 'large' ? 42 : 28}
                color={star <= value ? '#F59E0B' : '#9CA3AF'}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {value > 0 && (
        <Text className="text-center text-sm mt-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
          {value === 1 && 'Poor'}
          {value === 2 && 'Fair'}
          {value === 3 && 'Good'}
          {value === 4 && 'Very Good'}
          {value === 5 && 'Excellent'}
        </Text>
      )}
    </View>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
            borderTopLeftRadius: 32, 
            borderTopRightRadius: 32,
            maxHeight: '90%',
            minHeight: 200,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 20,
            borderWidth: 1,
            borderColor: isDark ? '#374151' : '#E5E7EB',
            borderBottomWidth: 0
          }}>
            {/* Drag Handle */}
            <View className="items-center py-4">
              <View style={{ 
                width: 50, 
                height: 5, 
                backgroundColor: isDark ? '#6B7280' : '#D1D5DB', 
                borderRadius: 3 
              }} />
            </View>

            {/* Header */}
            <View style={{ 
              backgroundColor: isDark ? '#111827' : '#F8FAFC',
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View style={{
                    backgroundColor: '#F59E0B',
                    borderRadius: 12,
                    padding: 8,
                    marginRight: 12
                  }}>
                    <Ionicons name="star" size={24} color="white" />
                  </View>
                  <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}>{title}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={20} color={isDark ? '#FFFFFF' : '#1F2937'} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }}>

            <View className="px-6 pt-4 pb-6">
              {/* User Info Card */}
              <View style={{
                backgroundColor: isDark ? '#374151' : '#F8FAFC',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDark ? '#4B5563' : '#E5E5E5'
              }}>
                <View className="flex-row items-center">
                  <View style={{
                    borderWidth: 3,
                    borderColor: '#F59E0B',
                    borderRadius: 35,
                    padding: 2
                  }}>
                    <Image
                      source={{ uri: ratedUserAvatar || 'https://via.placeholder.com/60x60' }}
                      style={{ width: 60, height: 60, borderRadius: 30 }}
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{ratedUserName}</Text>
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="location" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text className="text-sm ml-1 flex-1" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }} numberOfLines={1}>
                        {rideDetails.from} → {rideDetails.to}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="time" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text className="text-xs ml-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        {formatDate(rideDetails.departureTime)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Overall Rating */}
              <View style={{
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                borderWidth: 2,
                borderColor: '#F59E0B'
              }}>
                <StarRating
                  value={rating}
                  onChange={setRating}
                  label={`Overall ${isDriverRating ? 'Driver' : 'Rider'} Rating`}
                  isRequired={true}
                  size="large"
                />
              </View>

              {/* Category Ratings */}
              <View className="mb-6">
                <Text className="text-lg font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  Detailed Feedback
                  <Text className="text-sm font-normal" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}> (Optional)</Text>
                </Text>
                
                <View style={{
                  backgroundColor: isDark ? '#374151' : '#F9FAFB',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isDark ? '#4B5563' : '#E5E7EB'
                }}>
                  <StarRating
                    value={punctuality}
                    onChange={setPunctuality}
                    label="Punctuality"
                    size="small"
                  />

                  <StarRating
                    value={communication}
                    onChange={setCommunication}
                    label="Communication"
                    size="small"
                  />

                  {isDriverRating && (
                    <>
                      <StarRating
                        value={cleanliness}
                        onChange={setCleanliness}
                        label="Vehicle Cleanliness"
                        size="small"
                      />

                      <StarRating
                        value={safety}
                        onChange={setSafety}
                        label="Driving Safety"
                        size="small"
                      />
                    </>
                  )}
                </View>
              </View>

              {/* Review Text */}
              <View className="mb-6">
                <Text className="text-base font-semibold mb-3" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  Written Review <Text className="text-sm font-normal" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>(Optional)</Text>
                </Text>
                <View style={{
                  backgroundColor: isDark ? '#374151' : '#F9FAFB',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? '#4B5563' : '#E5E7EB',
                  overflow: 'hidden'
                }}>
                  <TextInput
                    value={reviewText}
                    onChangeText={setReviewText}
                    placeholder={`Share your experience with ${ratedUserName}...`}
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    multiline
                    numberOfLines={4}
                    style={{ 
                      padding: 16,
                      fontSize: 16,
                      color: isDark ? '#FFFFFF' : '#111827',
                      textAlignVertical: 'top',
                      minHeight: 120
                    }}
                    maxLength={500}
                  />
                  <View style={{
                    backgroundColor: isDark ? '#4B5563' : '#F3F4F6',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? '#6B7280' : '#E5E7EB'
                  }}>
                    <Text className="text-xs text-right" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                      {reviewText.length}/500 characters
                    </Text>
                  </View>
                </View>
              </View>

              {/* Anonymous Option */}
              <TouchableOpacity
                onPress={() => setIsAnonymous(!isAnonymous)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#374151' : '#F9FAFB',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: isAnonymous ? '#F59E0B' : (isDark ? '#4B5563' : '#E5E7EB')
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: isAnonymous ? '#F59E0B' : '#D1D5DB',
                  backgroundColor: isAnonymous ? '#F59E0B' : 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  {isAnonymous && <Feather name="check" size={16} color="white" />}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>Submit anonymously</Text>
                  <Text className="text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Your name won&apos;t be shown with this review</Text>
                </View>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || rating === 0}
                style={{
                  backgroundColor: submitting || rating === 0 ? (isDark ? '#4B5563' : '#D1D5DB') : (isDark ? '#3B82F6' : '#1F2937'),
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  shadowColor: isDark ? '#000' : '#1F2937',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5
                }}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="star" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white text-lg font-bold">Submit Rating</Text>
                  </>
                )}
              </TouchableOpacity>

              {rating === 0 && (
                <Text className="text-xs text-red-500 text-center mt-3">
                  Please select a star rating before submitting
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RatingModal;