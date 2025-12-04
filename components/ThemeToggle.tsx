import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'switch' | 'button' | 'card';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = true,
  variant = 'switch'
}) => {
  const { theme, isDark, setTheme } = useTheme();
  const styles = useThemeStyles();
  const animatedValue = useSharedValue(isDark ? 1 : 0);

  React.useEffect(() => {
    animatedValue.value = withSpring(isDark ? 1 : 0, {
      damping: 20,
      stiffness: 90,
    });
  }, [isDark, animatedValue]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        animatedValue.value,
        [0, 1],
        ['#E5E7EB', '#10B981'] // Light gray to brand green
      ),
    };
  });

  const handleThemeChange = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  if (variant === 'card') {
    return (
      <View className={`${styles.card} rounded-xl p-4 border ${styles.border} ${className}`}>
        <View className="mb-2">
          <Text className={`${styles.textPrimary} text-lg font-InterSemiBold`}>
            Theme
          </Text>
          <Text className={`${styles.textSecondary} text-sm font-Inter mt-1`}>
            Choose your preferred appearance
          </Text>
        </View>
        
        {/* Theme Options */}
        <View className="mt-4 space-y-2">
          {(['light', 'dark', 'system'] as const).map((themeOption) => (
            <TouchableOpacity
              key={themeOption}
              onPress={() => setTheme(themeOption)}
              className={`flex-row items-center justify-between p-3 rounded-lg ${
                theme === themeOption 
                  ? isDark ? 'bg-dark-brand-blue/20 border border-dark-brand-blue/30' : 'bg-blue-50 border border-blue-200'
                  : 'bg-transparent'
              }`}
            >
              <Text className={`${styles.textPrimary} font-Inter capitalize`}>
                {themeOption === 'system' ? 'Follow System' : themeOption}
              </Text>
              {theme === themeOption && (
                <View className={`w-2 h-2 rounded-full ${isDark ? 'bg-dark-brand-blue' : 'bg-blue-600'}`} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'button') {
    return (
      <TouchableOpacity
        onPress={handleThemeChange}
        className={`flex-row items-center justify-center p-3 rounded-xl ${
          isDark ? 'bg-dark-glass-light border border-dark-glass-border' : 'bg-gray-100'
        } ${className}`}
      >
        <Text className="text-xl mr-2">
          {isDark ? '🌙' : '☀️'}
        </Text>
        {showLabel && (
          <Text className={`${styles.textPrimary} font-InterMedium`}>
            {isDark ? 'Dark' : 'Light'}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Default switch variant
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      {showLabel && (
        <View className="flex-1">
          <Text className={`${styles.textPrimary} text-base font-InterMedium`}>
            Dark Mode
          </Text>
          <Text className={`${styles.textSecondary} text-sm font-Inter mt-1`}>
            Use dark theme across the app
          </Text>
        </View>
      )}
      
      <Animated.View style={[animatedStyles]} className="rounded-full">
        <Switch
          value={isDark}
          onValueChange={handleThemeChange}
          trackColor={{ 
            false: '#E5E7EB', 
            true: '#10B981' 
          }}
          thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
          ios_backgroundColor="#E5E7EB"
        />
      </Animated.View>
    </View>
  );
};

