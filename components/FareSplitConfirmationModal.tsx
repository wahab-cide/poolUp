import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import CustomButton from '@/components/CustomButton';

interface SplitPricingInfo {
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  totalPassengers: number;
  estimatedSavings: number;
}

interface FareSplitConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  splitPricingInfo: SplitPricingInfo;
  seatsRequested: number;
  loading?: boolean;
}

const FareSplitConfirmationModal: React.FC<FareSplitConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  splitPricingInfo,
  seatsRequested,
  loading = false
}) => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const totalOriginalPrice = splitPricingInfo.originalPrice * seatsRequested;
  const totalDiscountedPrice = splitPricingInfo.discountedPrice * seatsRequested;
  const totalSavings = totalOriginalPrice - totalDiscountedPrice;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`${styles.background} rounded-t-2xl max-h-[80%]`}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 pb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }}
              >
                <Ionicons 
                  name="people" 
                  size={20} 
                  color={isDark ? "#F97316" : "#C2410C"} 
                />
              </View>
              <Text className={`ml-3 text-xl font-InterBold ${styles.textPrimary}`}>
                Shared Ride Pricing
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={onCancel}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : '#F3F4F6' }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close" 
                size={20} 
                color={isDark ? "#FFFFFF" : "#000000"} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="px-6 pb-6">
              {/* Savings highlight */}
              <View className="p-4 rounded-xl mb-6"
                style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#F0FDF4' }}
              >
                <View className="flex-row items-center justify-center mb-3">
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={isDark ? "#F97316" : "#C2410C"} 
                  />
                  <Text className="ml-2 text-lg font-InterBold"
                    style={{ color: isDark ? '#F97316' : '#C2410C' }}
                  >
                    Great news! You&apos;re saving money
                  </Text>
                </View>
                
                <View className="items-center">
                  <Text className="text-3xl font-InterBold"
                    style={{ color: isDark ? '#F97316' : '#C2410C' }}
                  >
                    {formatPrice(totalSavings)}
                  </Text>
                  <Text className="text-sm font-InterMedium"
                    style={{ color: isDark ? '#F97316' : '#C2410C' }}
                  >
                    saved with shared ride pricing
                  </Text>
                </View>
              </View>

              {/* Price breakdown */}
              <View className={`${styles.card} p-4 rounded-xl mb-6`}>
                <Text className={`text-lg font-InterBold ${styles.textPrimary} mb-4`}>
                  Price Breakdown
                </Text>
                
                {/* Original vs Discounted */}
                <View className="space-y-3">
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-base ${styles.textSecondary}`}>
                      Original price per seat:
                    </Text>
                    <Text className={`text-base font-InterMedium ${styles.textSecondary} line-through`}>
                      {formatPrice(splitPricingInfo.originalPrice)}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-base ${styles.textPrimary}`}>
                      Your price per seat:
                    </Text>
                    <Text className="text-base font-InterBold text-success-600">
                      {formatPrice(splitPricingInfo.discountedPrice)}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-base ${styles.textSecondary}`}>
                      Seats requested:
                    </Text>
                    <Text className={`text-base font-InterMedium ${styles.textPrimary}`}>
                      {seatsRequested}
                    </Text>
                  </View>
                  
                  <View className="h-px" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }} />
                  
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-lg font-InterBold ${styles.textPrimary}`}>
                      Total you&apos;ll pay:
                    </Text>
                    <Text className="text-lg font-InterBold text-success-600">
                      {formatPrice(totalDiscountedPrice)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* How it works */}
              <View className={`${styles.card} p-4 rounded-xl mb-6`}>
                <Text className={`text-lg font-InterBold ${styles.textPrimary} mb-3`}>
                  How Shared Ride Pricing Works
                </Text>
                
                <View className="space-y-3">
                  <View className="flex-row items-start">
                    <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
                      style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}
                    >
                      <Text className="text-xs font-InterBold"
                        style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
                      >
                        1
                      </Text>
                    </View>
                    <Text className={`text-sm ${styles.textSecondary} flex-1`}>
                      When multiple passengers share a ride, everyone pays less per seat
                    </Text>
                  </View>
                  
                  <View className="flex-row items-start">
                    <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
                      style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}
                    >
                      <Text className="text-xs font-InterBold"
                        style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
                      >
                        2
                      </Text>
                    </View>
                    <Text className={`text-sm ${styles.textSecondary} flex-1`}>
                      With {splitPricingInfo.totalPassengers} passengers, you get {splitPricingInfo.discountPercentage}% off
                    </Text>
                  </View>
                  
                  <View className="flex-row items-start">
                    <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
                      style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}
                    >
                      <Text className="text-xs font-InterBold"
                        style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
                      >
                        3
                      </Text>
                    </View>
                    <Text className={`text-sm ${styles.textSecondary} flex-1`}>
                      Drivers earn more, passengers save money – everyone wins!
                    </Text>
                  </View>
                </View>
              </View>

              {/* Important notice */}
              <View className="p-4 rounded-xl"
                style={{ backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : '#FFFBEB' }}
              >
                <View className="flex-row items-start">
                  <Ionicons 
                    name="information-circle" 
                    size={20} 
                    color={isDark ? "#FBBF24" : "#D97706"} 
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-InterMedium mb-1"
                      style={{ color: isDark ? '#FBBF24' : '#D97706' }}
                    >
                      Price locked at booking
                    </Text>
                    <Text className="text-xs"
                      style={{ color: isDark ? '#FBBF24' : '#D97706' }}
                    >
                      Your price of {formatPrice(splitPricingInfo.discountedPrice)} per seat is guaranteed, even if other passengers cancel later.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View className="p-6 pt-4" 
            style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }}
          >
            <CustomButton
              title={`Continue with ${formatPrice(totalDiscountedPrice)} total`}
              onPress={onConfirm}
              className="mb-3"
              loading={loading}
              disabled={loading}
            />
            
            <CustomButton
              title="Cancel"
              onPress={onCancel}
              bgVariant="outline"
              textVariant="primary"
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FareSplitConfirmationModal;