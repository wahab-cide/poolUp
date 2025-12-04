import { useUser } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';

const DISMISS_KEY = '@profile_photo_prompt_dismissed';

/**
 * Prompt for drivers without profile photos
 * Shows a dismissible banner encouraging them to add a photo
 */
export default function ProfilePhotoPrompt() {
  const { user } = useUser();
  const router = useRouter();
  const { isDark } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user is a driver (check both metadata locations)
  const isDriver =
    user?.publicMetadata?.is_driver === true ||
    user?.unsafeMetadata?.is_driver === true;

  // Check if user has a real uploaded profile photo (not Clerk's default avatar)
  // Clerk provides hasImage property to distinguish between uploaded images and default avatars
  const hasProfilePhoto = user?.hasImage || user?.externalAccounts?.[0]?.imageUrl;

  // Check if prompt was previously dismissed
  useEffect(() => {
    const checkDismissed = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(DISMISS_KEY);
        setIsDismissed(dismissed === 'true');
      } catch (error) {
        console.error('Error checking dismissed state:', error);
      }
    };
    checkDismissed();
  }, []);

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(DISMISS_KEY, 'true');
      setIsDismissed(true);
    } catch (error) {
      console.error('Error saving dismissed state:', error);
    }
  };

  const handleAddPhoto = () => {
    router.push('/(root)/(tabs)/profile');
  };

  // Don't show if not a driver, has photo, or dismissed
  if (!isDriver || hasProfilePhoto || isDismissed) {
    return null;
  }

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 16,
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: isDark ? '#3B82F6' : '#2563EB',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Feather name="camera" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#111827',
              }}
            >
              Add a profile photo
            </Text>
            <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: isDark ? '#D1D5DB' : '#4B5563',
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            Riders trust drivers with profile photos more. Add yours to increase bookings!
          </Text>

          <TouchableOpacity
            onPress={handleAddPhoto}
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: isDark ? '#3B82F6' : '#2563EB',
              borderRadius: 8,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              Add Photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
