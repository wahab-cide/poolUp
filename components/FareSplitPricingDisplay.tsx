import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

interface FareSplitPricingDisplayProps {
  basePrice: number;
  currentPrice: number;
  discountPercentage: number;
  totalPassengers: number;
  maxPassengers?: number;
  fareSplittingEnabled: boolean;
  compact?: boolean;
  onToggleSplitting?: () => void;
  isDriver?: boolean;
  showToggle?: boolean;
}

const FareSplitPricingDisplay: React.FC<FareSplitPricingDisplayProps> = ({
  basePrice,
  currentPrice,
  discountPercentage,
  totalPassengers,
  maxPassengers = 4,
  fareSplittingEnabled,
  compact = false,
  onToggleSplitting,
  isDriver = false,
  showToggle = false
}) => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const toggleAnimation = useRef(new Animated.Value(fareSplittingEnabled ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(toggleAnimation, {
      toValue: fareSplittingEnabled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [fareSplittingEnabled, toggleAnimation]);

  const formatPrice = (price: number): { dollars: string; cents: string } => {
    // Handle invalid numbers
    if (!price || isNaN(price) || price < 0) {
      return { dollars: "0", cents: "00" };
    }
    
    const dollars = Math.floor(price);
    const cents = Math.round((price - dollars) * 100);
    return {
      dollars: dollars.toString(),
      cents: cents.toString().padStart(2, '0')
    };
  };

  // Validate inputs and provide safe defaults
  const safeBasePrice = (basePrice && !isNaN(basePrice) && basePrice >= 0) ? basePrice : 0;
  const safeCurrentPrice = (currentPrice && !isNaN(currentPrice) && currentPrice >= 0) ? currentPrice : safeBasePrice;
  const safeDiscountPercentage = (discountPercentage && !isNaN(discountPercentage)) ? Math.max(0, Math.min(100, discountPercentage)) : 0;
  
  const currentPriceFormatted = formatPrice(safeCurrentPrice);
  const basePriceFormatted = formatPrice(safeBasePrice);
  const savings = safeBasePrice - safeCurrentPrice;

  if (compact) {
    return (
      <View className="flex-row items-center">
        {fareSplittingEnabled && safeDiscountPercentage > 0 ? (
          <>
            {/* Crossed out original price */}
            <View className="flex-row items-baseline mr-2">
              <Text className={`text-sm ${styles.textSecondary} line-through`}>
                ${basePriceFormatted.dollars}
              </Text>
              <Text className={`text-xs ${styles.textSecondary} line-through`}>
                .{basePriceFormatted.cents}
              </Text>
            </View>
            
            {/* Current discounted price */}
            <View className="flex-row items-baseline">
              <Text className="text-lg font-InterBold"
                style={{ color: isDark ? '#F97316' : '#EA580C' }}
              >
                ${currentPriceFormatted.dollars}
              </Text>
              <Text className="text-sm font-InterMedium"
                style={{ color: isDark ? '#F97316' : '#EA580C' }}
              >
                .{currentPriceFormatted.cents}
              </Text>
            </View>
            
            {/* Savings badge */}
            <View className="ml-2 px-2 py-1 rounded-full"
              style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }}
            >
              <Text className="text-xs font-InterMedium"
                style={{ color: isDark ? '#F97316' : '#C2410C' }}
              >
                {safeDiscountPercentage}% off
              </Text>
            </View>
          </>
        ) : (
          <View className="flex-row items-baseline">
            <Text className="text-lg font-InterBold"
              style={{ color: isDark ? '#F97316' : '#EA580C' }}
            >
              ${currentPriceFormatted.dollars}
            </Text>
            <Text className="text-sm font-InterMedium"
              style={{ color: isDark ? '#F97316' : '#EA580C' }}
            >
              .{currentPriceFormatted.cents}
            </Text>
            <Text className={`text-sm ${styles.textSecondary} ml-1`}>
              per seat
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className={`${styles.card} p-4 rounded-xl`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons 
            name={fareSplittingEnabled ? "people" : "person"} 
            size={20} 
            color={isDark ? "#FFFFFF" : "#000000"} 
          />
          <Text className={`ml-2 text-lg font-InterBold ${styles.textPrimary}`}>
            {fareSplittingEnabled ? 'Shared Ride Pricing' : 'Standard Pricing'}
          </Text>
        </View>
        
        {showToggle && isDriver && (
          <TouchableOpacity
            onPress={onToggleSplitting}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            {/* Toggle Switch */}
            <Animated.View 
              className="w-16 h-8 rounded-full p-1 mr-2"
              style={{ 
                backgroundColor: toggleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isDark ? '#374151' : '#D1D5DB', isDark ? '#F97316' : '#F97316']
                })
              }}
            >
              <Animated.View 
                className="w-6 h-6 rounded-full"
                style={{
                  backgroundColor: '#FFFFFF',
                  transform: [{
                    translateX: toggleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 28]
                    })
                  }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2
                }}
              />
            </Animated.View>
            <Text className="text-sm font-InterMedium"
              style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}
            >
              {fareSplittingEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {fareSplittingEnabled ? (
        <>
          {/* Price comparison */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className={`text-sm ${styles.textSecondary} mb-1`}>
                Original Price
              </Text>
              <View className="flex-row items-baseline">
                <Text className={`text-xl font-InterMedium ${styles.textSecondary} line-through`}>
                  ${basePriceFormatted.dollars}
                </Text>
                <Text className={`text-sm ${styles.textSecondary} line-through`}>
                  .{basePriceFormatted.cents}
                </Text>
              </View>
            </View>
            
            <Ionicons 
              name="arrow-forward" 
              size={24} 
              color={isDark ? "#888787" : "#6B7280"} 
            />
            
            <View className="flex-1 items-end">
              <Text className={`text-sm ${styles.textSecondary} mb-1`}>
                New Price
              </Text>
              <View className="flex-row items-baseline">
                <Text className="text-2xl font-InterBold"
                  style={{ color: isDark ? '#F97316' : '#EA580C' }}
                >
                  ${currentPriceFormatted.dollars}
                </Text>
                <Text className="text-lg font-InterMedium"
                  style={{ color: isDark ? '#F97316' : '#EA580C' }}
                >
                  .{currentPriceFormatted.cents}
                </Text>
              </View>
            </View>
          </View>

          {/* Savings/Earnings highlight */}
          {safeDiscountPercentage > 0 && (
            <View className="p-3 rounded-lg mb-4"
              style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#F0FDF4' }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={isDark ? "#F97316" : "#C2410C"} 
                  />
                  {isDriver ? (
                    <View>
                      <Text className="ml-2 text-base font-InterSemiBold"
                        style={{ color: isDark ? '#F97316' : '#C2410C' }}
                      >
                        You earn with {maxPassengers} passengers:
                      </Text>
                      <Text className="ml-2 text-xl font-InterBold mt-1"
                        style={{ color: isDark ? '#F97316' : '#C2410C' }}
                      >
                        ${(safeCurrentPrice * maxPassengers).toFixed(2)}
                      </Text>
                    </View>
                  ) : (
                    <Text className="ml-2 text-base font-InterSemiBold"
                      style={{ color: isDark ? '#F97316' : '#C2410C' }}
                    >
                      You save ${savings.toFixed(2)}
                    </Text>
                  )}
                </View>
                <View className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }}
                >
                  <Text className="text-sm font-InterBold"
                    style={{ color: isDark ? '#F97316' : '#C2410C' }}
                  >
                    {isDriver 
                      ? `$${(safeCurrentPrice * maxPassengers).toFixed(0)} TOTAL`
                      : `${safeDiscountPercentage}% OFF`
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}

        </>
      ) : (
        <>
          {/* Standard pricing display */}
          <View className="items-center py-4">
            <View className="flex-row items-baseline mb-2">
              <Text className="text-3xl font-InterBold"
                style={{ color: isDark ? '#F97316' : '#EA580C' }}
              >
                ${currentPriceFormatted.dollars}
              </Text>
              <Text className="text-xl font-InterMedium"
                style={{ color: isDark ? '#F97316' : '#EA580C' }}
              >
                .{currentPriceFormatted.cents}
              </Text>
              <Text className={`text-lg ${styles.textSecondary} ml-2`}>
                per seat
              </Text>
            </View>
            
            <Text className={`text-sm ${styles.textSecondary} text-center`}>
              Fixed price • No sharing discounts
            </Text>
          </View>
          
          {isDriver && showToggle && (
            <View className="p-3 rounded-lg"
              style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }}
            >
              <View>
                <Text className="text-base font-InterBold"
                  style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
                >
                  Enable Fare Splitting to Earn More
                </Text>
                <Text className="text-xs font-InterRegular mt-1"
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                >
                  and Attract More People. Passengers are more likely to book a trip with Fare Splitting.
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default FareSplitPricingDisplay;