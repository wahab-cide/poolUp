import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { showErrorToast } from '@/lib/toast';
import { useTheme } from '@/contexts/ThemeContext';

export function PlusButton() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlusPress = async () => {
    // Check if user is signed in
    if (!isSignedIn || !user?.id) {
      router.push('/sign-in');
      return;
    }

    setIsLoading(true);
    
    try {
      const isDriver = user.publicMetadata?.is_driver === true;
      if (isDriver) {
        router.push('/post-ride');
      } else {
        router.push('/(feed)/verify-driver');
      }
    } catch (error) {
      console.error('Driver status check failed:', error);
      // Show user-friendly error and default to verify-driver page
      showErrorToast('Unable to check driver status. Redirecting to driver verification.', 'Error');
      router.push('/(feed)/verify-driver');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePlusPress}
      disabled={isLoading}
      className="w-20 h-10 rounded-full bg-black items-center justify-center"
      style={{
        backgroundColor: isLoading ? '#9CA3AF' : '#3B82F6',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text className="text-white text-2xl font-bold">+</Text>
      )}
    </TouchableOpacity>
  );
}