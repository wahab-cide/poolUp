import CustomButton from '@/components/CustomButton';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const options = { headerShown: false };

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isDark } = useTheme();
  const theme = useThemeStyles();

  const [selectedType, setSelectedType] = useState<'rider' | 'driver' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Early return if user is not available
  if (!user) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background} items-center justify-center`}>
        <ActivityIndicator size="large" color={theme.activityIndicator.primary} />
        <Text className={`text-lg ${theme.textSecondary} mt-4`}>Setting up your account...</Text>
      </SafeAreaView>
    );
  }

  const handleRiderSelection = async () => {
    setIsLoading(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboarding_complete: true,
          is_driver: false,
        }
      });
      router.replace('/');
    } catch (error) {
      console.error('Error updating rider metadata:', error);
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverSelection = () => {
    router.push('/(feed)/verify-driver');
  };

  const handleContinue = () => {
    if (!selectedType) {
      Alert.alert('Please select an option', 'Choose whether you want to be a rider or driver to continue.');
      return;
    }

    if (selectedType === 'rider') {
      handleRiderSelection();
    } else {
      handleDriverSelection();
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${theme.background}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-between px-8 py-16">
          {/* Header */}
          <View>
            <View className="mb-16">
              <Text
                className={`text-5xl font-bold mb-4 ${theme.textPrimary}`}
                style={{ letterSpacing: -1.5 }}
              >
                Welcome to{'\n'}poolUp
              </Text>
              <Text className={`text-lg ${theme.textSecondary}`}>
                Choose your role to get started
              </Text>
            </View>

            {/* Options */}
            <View className="gap-4">
              {/* Rider Option */}
              <TouchableOpacity
                onPress={() => setSelectedType('rider')}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isDark ? '#000000' : '#FFFFFF',
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 1.5,
                  borderColor: selectedType === 'rider'
                    ? (isDark ? '#3B82F6' : '#2563EB')
                    : (isDark ? '#1F2937' : '#E5E7EB'),
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-2xl font-semibold mb-2 ${theme.textPrimary}`}
                      style={{ letterSpacing: -0.5 }}
                    >
                      Rider
                    </Text>
                    <Text
                      className={`text-base ${theme.textSecondary}`}
                      style={{ lineHeight: 22 }}
                    >
                      Book rides with verified student drivers
                    </Text>
                  </View>
                  <Ionicons
                    name="person-outline"
                    size={32}
                    color={selectedType === 'rider'
                      ? (isDark ? '#3B82F6' : '#2563EB')
                      : (isDark ? '#4B5563' : '#9CA3AF')
                    }
                  />
                </View>
              </TouchableOpacity>

              {/* Driver Option */}
              <TouchableOpacity
                onPress={() => setSelectedType('driver')}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isDark ? '#000000' : '#FFFFFF',
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 1.5,
                  borderColor: selectedType === 'driver'
                    ? (isDark ? '#F97316' : '#EA580C')
                    : (isDark ? '#1F2937' : '#E5E7EB'),
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-2xl font-semibold mb-2 ${theme.textPrimary}`}
                      style={{ letterSpacing: -0.5 }}
                    >
                      Driver
                    </Text>
                    <Text
                      className={`text-base ${theme.textSecondary}`}
                      style={{ lineHeight: 22 }}
                    >
                      Share rides and earn on your schedule
                    </Text>
                  </View>
                  <Ionicons
                    name="car-sport-outline"
                    size={32}
                    color={selectedType === 'driver'
                      ? (isDark ? '#F97316' : '#EA580C')
                      : (isDark ? '#4B5563' : '#9CA3AF')
                    }
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Continue Button */}
          <View className="mt-12">
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!selectedType || isLoading}
              activeOpacity={0.8}
              style={{
                backgroundColor: !selectedType
                  ? (isDark ? '#1F2937' : '#F3F4F6')
                  : selectedType === 'driver'
                    ? (isDark ? '#F97316' : '#EA580C')
                    : (isDark ? '#3B82F6' : '#2563EB'),
                paddingVertical: 20,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !selectedType ? 0.5 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text
                  className="text-white font-semibold text-lg"
                  style={{ letterSpacing: -0.3 }}
                >
                  {selectedType === 'driver' ? 'Continue to Setup' :
                   selectedType === 'rider' ? 'Get Started' : 'Choose an option'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
