import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

interface PricingScenario {
  passengerCount: number;
  pricePerPassenger: number;
  discountPercentage: number;
  totalDriverEarnings: number;
  savingsPerPassenger: number;
}

interface FareSplitSavingsCalculatorProps {
  basePrice: number;
  currentPassengers: number;
  pricingScenarios: PricingScenario[];
  maxDisplayPassengers?: number;
  compact?: boolean;
  showDriverEarnings?: boolean;
}

const FareSplitSavingsCalculator: React.FC<FareSplitSavingsCalculatorProps> = ({
  basePrice,
  currentPassengers,
  pricingScenarios,
  maxDisplayPassengers = 4,
  compact = false,
  showDriverEarnings = false
}) => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const getScenarioColor = (passengerCount: number) => {
    if (passengerCount === currentPassengers) {
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
        text: isDark ? '#F97316' : '#C2410C',
        border: isDark ? '#F97316' : '#C2410C'
      };
    } else if (passengerCount < currentPassengers) {
      return {
        bg: isDark ? 'rgba(156, 163, 175, 0.1)' : '#F9FAFB',
        text: isDark ? '#9CA3AF' : '#6B7280',
        border: 'transparent'
      };
    } else {
      return {
        bg: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
        text: isDark ? '#60A5FA' : '#2563EB',
        border: 'transparent'
      };
    }
  };

  const displayScenarios = pricingScenarios
    .filter(scenario => scenario.passengerCount <= maxDisplayPassengers)
    .slice(0, maxDisplayPassengers);

  if (compact) {
    return (
      <View className={`${styles.card} p-3 rounded-lg`}>
        <View className="flex-row items-center mb-2">
          <Ionicons 
            name="calculator" 
            size={16} 
            color={isDark ? "#FFFFFF" : "#000000"} 
          />
          <Text className={`ml-2 text-sm font-InterSemiBold ${styles.textPrimary}`}>
            Savings with More Passengers
          </Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            {displayScenarios.map((scenario) => {
              const colors = getScenarioColor(scenario.passengerCount);
              const isCurrent = scenario.passengerCount === currentPassengers;
              
              return (
                <View
                  key={scenario.passengerCount}
                  className="px-3 py-2 rounded-lg min-w-[80px] items-center"
                  style={{ 
                    backgroundColor: colors.bg,
                    borderWidth: isCurrent ? 1 : 0,
                    borderColor: colors.border
                  }}
                >
                  <Text className="text-xs font-InterMedium"
                    style={{ color: colors.text }}
                  >
                    {scenario.passengerCount} rider{scenario.passengerCount !== 1 ? 's' : ''}
                  </Text>
                  <Text className="text-sm font-InterBold"
                    style={{ color: colors.text }}
                  >
                    {formatPrice(scenario.pricePerPassenger)}
                  </Text>
                  {scenario.discountPercentage > 0 && (
                    <Text className="text-xs"
                      style={{ color: colors.text }}
                    >
                      {scenario.discountPercentage}% off
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={`${styles.card} p-4 rounded-xl`}>
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Ionicons 
          name="calculator" 
          size={20} 
          color={isDark ? "#FFFFFF" : "#000000"} 
        />
        <Text className={`ml-2 text-lg font-InterBold ${styles.textPrimary}`}>
          Savings Calculator
        </Text>
      </View>

      {/* Pricing scenarios */}
      <View className="space-y-3">
        {displayScenarios.map((scenario, index) => {
          const colors = getScenarioColor(scenario.passengerCount);
          const isCurrent = scenario.passengerCount === currentPassengers;
          const isNext = scenario.passengerCount === currentPassengers + 1;
          
          return (
            <View
              key={scenario.passengerCount}
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: colors.bg,
                borderWidth: isCurrent ? 2 : 0,
                borderColor: colors.border
              }}
            >
              <View className="flex-row items-center justify-between">
                {/* Passenger count and status */}
                <View className="flex-row items-center flex-1">
                  <View className="flex-row items-center">
                    {Array.from({ length: Math.min(scenario.passengerCount, 4) }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name="person"
                        size={16}
                        color={colors.text}
                        style={{ marginLeft: i > 0 ? -4 : 0 }}
                      />
                    ))}
                    {scenario.passengerCount > 4 && (
                      <Text className="ml-1 text-xs" style={{ color: colors.text }}>
                        +{scenario.passengerCount - 4}
                      </Text>
                    )}
                  </View>
                  
                  <View className="ml-3">
                    <Text className="text-sm font-InterMedium" style={{ color: colors.text }}>
                      {scenario.passengerCount} passenger{scenario.passengerCount !== 1 ? 's' : ''}
                    </Text>
                    {isCurrent && (
                      <Text className="text-xs font-InterMedium" style={{ color: colors.text }}>
                        Current
                      </Text>
                    )}
                    {isNext && !isCurrent && (
                      <Text className="text-xs font-InterMedium" style={{ color: colors.text }}>
                        Next rider saves even more!
                      </Text>
                    )}
                  </View>
                </View>

                {/* Pricing info */}
                <View className="items-end">
                  <View className="flex-row items-baseline">
                    <Text className="text-lg font-InterBold" style={{ color: colors.text }}>
                      {formatPrice(scenario.pricePerPassenger)}
                    </Text>
                    <Text className="text-sm ml-1" style={{ color: colors.text }}>
                      each
                    </Text>
                  </View>
                  
                  {scenario.discountPercentage > 0 && (
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs font-InterMedium mr-2" style={{ color: colors.text }}>
                        {scenario.discountPercentage}% off
                      </Text>
                      <Text className="text-xs" style={{ color: colors.text }}>
                        Save {formatPrice(scenario.savingsPerPassenger)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Driver earnings (if enabled) */}
              {showDriverEarnings && (
                <View className="mt-2 pt-2" 
                  style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }}
                >
                  <Text className="text-xs" style={{ color: colors.text }}>
                    Driver earns: {formatPrice(scenario.totalDriverEarnings)} total
                    {scenario.passengerCount > 1 && (
                      <Text> (+{formatPrice(scenario.totalDriverEarnings - basePrice)} vs 1 passenger)</Text>
                    )}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Bottom info */}
      <View className="mt-4 p-3 rounded-lg"
        style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }}
      >
        <View className="flex-row items-center">
          <Ionicons 
            name="information-circle" 
            size={16} 
            color={isDark ? "#60A5FA" : "#2563EB"} 
          />
          <Text className="ml-2 text-xs font-InterMedium flex-1"
            style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
          >
            Prices automatically adjust as more passengers join the ride. Everyone saves money!
          </Text>
        </View>
      </View>
    </View>
  );
};

export default FareSplitSavingsCalculator;