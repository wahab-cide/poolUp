import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { useCrewStore } from '@/store/crewStore';
import GoogleTextInput from '@/components/GoogleTextInput';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

const CreateCrewScreen = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { user } = useUser();
  const { createCrew } = useCrewStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  // Location states
  const [originAddress, setOriginAddress] = useState('');
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [destAddress, setDestAddress] = useState('');
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);

  const handleOriginSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setOriginAddress(location.address);
    setOriginLat(location.latitude);
    setOriginLng(location.longitude);
  };

  const handleDestSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setDestAddress(location.address);
    setDestLat(location.latitude);
    setDestLng(location.longitude);
  };

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      showErrorToast('Please enter a crew name', 'Validation Error');
      return;
    }

    if (!originAddress || !originLat || !originLng) {
      showErrorToast('Please select an origin location', 'Validation Error');
      return;
    }

    if (!destAddress || !destLat || !destLng) {
      showErrorToast('Please select a destination location', 'Validation Error');
      return;
    }

    if (!user?.id) {
      showErrorToast('User not authenticated', 'Error');
      return;
    }

    setCreating(true);

    const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;

    const crew = await createCrew(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        routeOrigin: originAddress,
        routeDestination: destAddress,
        routeOriginLat: originLat,
        routeOriginLng: originLng,
        routeDestLat: destLat,
        routeDestLng: destLng,
        isPublic,
        collegeId: collegeId as string
      },
      user.id
    );

    setCreating(false);

    if (crew) {
      showSuccessToast('Crew created successfully!', 'Success');
      router.back();
    } else {
      showErrorToast('Failed to create crew', 'Error');
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="close"
            size={28}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000'
        }}>
          Create Crew
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {/* Crew Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                Crew Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Williams → Boston Weekenders"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                style={{
                  backgroundColor: isDark ? '#161616' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: isDark ? '#FFFFFF' : '#000000'
                }}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell members about this crew..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: isDark ? '#161616' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: isDark ? '#FFFFFF' : '#000000',
                  minHeight: 100
                }}
                maxLength={500}
              />
            </View>

            {/* Route Section */}
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#000000',
              marginBottom: 16,
              marginTop: 8
            }}>
              Regular Route *
            </Text>

            {/* Origin */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                From
              </Text>
              <View style={{
                backgroundColor: isDark ? '#161616' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                borderRadius: 12,
                padding: 12
              }}>
                <GoogleTextInput
                  icon=""
                  initialLocation={originAddress}
                  containerStyle=""
                  textInputBackgroundColor="transparent"
                  placeholder="Select origin location"
                  handlePress={handleOriginSelect}
                />
              </View>
            </View>

            {/* Destination */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 8
              }}>
                To
              </Text>
              <View style={{
                backgroundColor: isDark ? '#161616' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                borderRadius: 12,
                padding: 12
              }}>
                <GoogleTextInput
                  icon=""
                  initialLocation={destAddress}
                  containerStyle=""
                  textInputBackgroundColor="transparent"
                  placeholder="Select destination location"
                  handlePress={handleDestSelect}
                />
              </View>
            </View>

            {/* Privacy Toggle */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24
            }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#000000',
                  marginBottom: 4
                }}>
                  Public Crew
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  lineHeight: 18
                }}>
                  Anyone can discover and join this crew
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: isDark ? '#374151' : '#D1D5DB',
                  true: isDark ? '#909090' : '#000000'
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 32
        }}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating}
            style={{
              backgroundColor: isDark ? '#909090' : '#000000',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              opacity: creating ? 0.6 : 1
            }}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Create Crew
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateCrewScreen;
