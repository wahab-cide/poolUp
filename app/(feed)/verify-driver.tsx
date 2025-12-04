import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VehicleFormData {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehiclePlate: string;
}



export const options = { headerShown: false };

export default function VerifyDriverScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isDark } = useTheme();
  const theme = useThemeStyles();

  // All hooks must be at the top before any conditional returns
  const [formData, setFormData] = useState<VehicleFormData>({
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehiclePlate: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);

  // Check if user is already a driver (only on initial load, not after registration)
  useEffect(() => {
    const checkDriverStatus = async () => {
      if (!user?.id || hasRegistered) return;

      setIsCheckingStatus(true);

      // Check if user is already a driver
      const isDriver = user?.publicMetadata?.is_driver === true || user?.unsafeMetadata?.is_driver === true;

      if (isDriver) {
        // User is already a driver, redirect to home
        showSuccessToast('You\'re already registered as a driver!', 'Already a Driver');
        router.replace('/(root)/(tabs)/home');
        return;
      }

      setIsCheckingStatus(false);
    };

    checkDriverStatus();
  }, [user?.id, hasRegistered]);  // Removed the metadata dependencies to prevent re-running after registration

  // Early return if user is not available (after all hooks)
  if (!user) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background} items-center justify-center`}>
        <ActivityIndicator size="large" color={theme.activityIndicator.primary} />
        <Text className={`text-lg ${theme.textSecondary} mt-4`}>Verifying your account...</Text>
      </SafeAreaView>
    );
  }


  const validateForm = (): string | null => {
    const { vehicleMake, vehicleModel, vehicleYear, vehicleColor, vehiclePlate } = formData;
    
    if (!vehicleMake.trim()) return 'Vehicle make is required';
    if (!vehicleModel.trim()) return 'Vehicle model is required';
    if (!vehicleYear.trim()) return 'Vehicle year is required';
    if (!vehicleColor.trim()) return 'Vehicle color is required';
    if (!vehiclePlate.trim()) return 'License plate is required';
    
    const year = parseInt(vehicleYear);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      return 'Please enter a valid vehicle year';
    }
    
    if (vehiclePlate.length < 2 || vehiclePlate.length > 20) {
      return 'License plate must be between 2-20 characters';
    }
    
    return null;
  };

  const upgradeToDriver = async (): Promise<void> => {
    try {
      const data = await fetchAPI('/api/driver/upgrade', {
        method: 'POST',
        body: JSON.stringify({
          clerkId: user?.id,
          vehicleMake: formData.vehicleMake.trim(),
          vehicleModel: formData.vehicleModel.trim(),
          vehicleYear: parseInt(formData.vehicleYear),
          vehicleColor: formData.vehicleColor.trim(),
          vehiclePlate: formData.vehiclePlate.trim().toUpperCase(),
        }),
      });
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to register as driver');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Driver upgrade failed:', error);
      }
      throw error;
    }
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      showErrorToast(validationError, 'Validation Error');
      return;
    }

    if (!user?.id) {
      showErrorToast('User not authenticated', 'Error');
      return;
    }

    setIsLoading(true);
    setHasRegistered(true); // Prevent status check from running after registration
    
    try {
      await upgradeToDriver();
      
      // Update user metadata to complete onboarding
      // The driver upgrade already sets is_driver: true in the database and publicMetadata
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboarding_complete: true,
            is_driver: true
          }
        });
        
        await user.reload();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (metadataError) {
        console.warn('User metadata update failed:', metadataError);
      }

      showSuccessToast('You can now start posting rides and saving on travel costs!', 'Vehicle Registration Complete!');

      try {
        await user.reload();
        router.replace('/(root)/(tabs)/home');
      } catch (error) {
        console.warn('Navigation failed:', error);
        router.replace('/');
      }
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : 'Failed to register vehicle. Please try again.',
        'Registration Failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormField = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const renderVehicleForm = () => (
    <View className="w-full">
      {/* Vehicle Information Section */}
      <View>
        <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
          Vehicle Details
        </Text>

        {/* Make */}
        <View className="mb-5">
          <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Make
          </Text>
          <TextInput
            placeholder="e.g., Toyota"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={formData.vehicleMake}
            onChangeText={(text) => updateFormField('vehicleMake', text)}
            className={`${isDark ? 'bg-[#000000] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} rounded-2xl border px-5 py-4 text-base`}
            autoCapitalize="words"
            returnKeyType="next"
            style={{
              minHeight: 56,
            }}
          />
        </View>

        {/* Model */}
        <View className="mb-5">
          <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Model
          </Text>
          <TextInput
            placeholder="e.g., Camry"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={formData.vehicleModel}
            onChangeText={(text) => updateFormField('vehicleModel', text)}
            className={`${isDark ? 'bg-[#000000] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} rounded-2xl border px-5 py-4 text-base`}
            autoCapitalize="words"
            returnKeyType="next"
            style={{
              minHeight: 56,
            }}
          />
        </View>

        {/* Year */}
        <View className="mb-5">
          <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Year
          </Text>
          <TextInput
            placeholder="e.g., 2020"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={formData.vehicleYear}
            onChangeText={(text) => updateFormField('vehicleYear', text)}
            className={`${isDark ? 'bg-[#000000] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} rounded-2xl border px-5 py-4 text-base`}
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="next"
            style={{
              minHeight: 56,
            }}
          />
        </View>

        {/* Color */}
        <View className="mb-5">
          <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Color
          </Text>
          <TextInput
            placeholder="e.g., Black"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={formData.vehicleColor}
            onChangeText={(text) => updateFormField('vehicleColor', text)}
            className={`${isDark ? 'bg-[#000000] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} rounded-2xl border px-5 py-4 text-base`}
            autoCapitalize="words"
            returnKeyType="next"
            style={{
              minHeight: 56,
            }}
          />
        </View>

        {/* License Plate */}
        <View className="mb-8">
          <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            License Plate
          </Text>
          <TextInput
            placeholder="e.g., ABC123"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={formData.vehiclePlate}
            onChangeText={(text) => updateFormField('vehiclePlate', text)}
            className={`${isDark ? 'bg-[#000000] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} rounded-2xl border px-5 py-4 text-base`}
            autoCapitalize="characters"
            maxLength={20}
            returnKeyType="done"
            style={{
              minHeight: 56,
            }}
          />
        </View>
      </View>
    </View>
  );





  if (isCheckingStatus) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background} items-center justify-center`}>
        <Ionicons name="refresh" size={48} color="#3B82F6" />
        <Text className={`text-lg ${theme.textSecondary} mt-4`}>Checking verification status...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.background}`} edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Platform.OS === 'ios' ? 120 : 200,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="w-full">
              {/* Header */}
              <View className="mb-10">
                <TouchableOpacity
                  onPress={() => {
                    try {
                      router.back();
                    } catch (error) {
                      console.warn('Navigation back failed:', error);
                    }
                  }}
                  className="mb-8"
                  activeOpacity={0.7}
                  style={{
                    alignSelf: 'flex-start',
                  }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={28}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                </TouchableOpacity>
                <Text
                  className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}
                  style={{ letterSpacing: -1 }}
                >
                  Vehicle{'\n'}Registration
                </Text>
                <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Add your vehicle details to start driving
                </Text>
              </View>

              {renderVehicleForm()}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                  backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                  opacity: isLoading ? 0.7 : 1,
                  paddingVertical: 20,
                  borderRadius: 16,
                  marginTop: 24,
                  marginBottom: 40,
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  {isLoading && (
                    <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                  )}
                  <Text
                    className="text-white font-semibold text-lg"
                    style={{ letterSpacing: -0.3 }}
                  >
                    {isLoading ? 'Registering...' : 'Register Vehicle'}
                  </Text>
                </View>
            </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      {isLoading && (
        <View className="absolute inset-0 z-50 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 items-center`}>
            <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
            <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-InterMedium text-base mt-3`}>
              Setting up your driver account...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}