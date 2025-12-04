import { useClerk, useUser } from "@clerk/clerk-expo";
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ReactNativeModal } from "react-native-modal";
import CustomButton from "@/components/CustomButton";
import VerificationModal from "@/components/VerificationModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";
import { fetchAPI } from "@/lib/fetch";

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

const Profile = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  // Minimal icon map for menu items
  const getMenuIcon = (id: string) => {
    const iconColor = isDark ? '#9CA3AF' : '#6B7280';
    const iconSize = 22;

    const icons: { [key: string]: string } = {
      personal: 'user',
      payout: 'credit-card',
      recurring: 'repeat',
      communication: 'bell',
      promotions: 'tag',
      messages: 'mail',
      manage: 'settings',
      legal: 'file-text',
      help: 'help-circle',
      crews: 'users',
      events: 'calendar',
      community: 'home',
    };

    return <Feather name={icons[id] || 'circle'} size={iconSize} color={iconColor} />;
  };

  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationLoading] = useState(false);

  // Create menu items based on user type
  const getMenuItems = () => {
    const baseItems = [
      { id: 'personal', title: 'Personal', onPress: () => router.push('/(root)/(profiles)/personal') },
    ];

    // Add Payment Methods and Recurring Rides for drivers only
    if (user?.publicMetadata?.is_driver === true) {
      // DISABLED (New Payment Model: peer-to-peer coordination)
      // baseItems.push({
      //   id: 'payout',
      //   title: 'Payout methods',
      //   onPress: () => router.push('/(root)/(profiles)/payout-methods')
      // });
      baseItems.push({
        id: 'recurring',
        title: 'Recurring rides',
        onPress: () => router.push('/(root)/(profiles)/recurring-rides')
      });
    }

    // Add remaining items
    baseItems.push(
      { id: 'communication', title: 'Communication settings', onPress: () => router.push('/(root)/(profiles)/communication') },
      { id: 'promotions', title: 'Promotions', onPress: () => router.push('/(root)/(profiles)/promotions') },
      { id: 'messages', title: 'Messages', onPress: () => router.push('/(root)/(profiles)/messages') },
      { id: 'manage', title: 'Manage Account', onPress: () => router.push('/(root)/(profiles)/manage') },
      { id: 'legal', title: 'Legal', onPress: () => router.push('/(root)/(profiles)/legal') },
      { id: 'help', title: 'Help', onPress: () => router.push('/(root)/(profiles)/help') }
    );

    return baseItems;
  };

  const menuItems = getMenuItems();

  // Social features menu items
  const getSocialMenuItems = () => {
    const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;

    return [
      { id: 'crews', title: 'Ride Crews', onPress: () => router.push('/(root)/crews') },
      { id: 'events', title: 'Event Carpools', onPress: () => router.push('/(root)/events') },
      ...(collegeId ? [{
        id: 'community',
        title: 'Campus Community',
        onPress: () => router.push(`/(root)/communities/${collegeId}` as any)
      }] : []),
    ];
  };

  const socialMenuItems = getSocialMenuItems();

  const { signOut } = useClerk()
  
  // Fetch verification status
  const fetchVerificationStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Always fetch latest status from database first
      const data = await fetchAPI(`/api/driver/sync-verification?clerkId=${user.id}`);
      
      if (data.success && data.verification_status) {
        const dbStatus = data.verification_status as VerificationStatus;
        const metadataStatus = user.publicMetadata?.verification_status as VerificationStatus;
        
        // Always update local state with database status
        setVerificationStatus(dbStatus);
        
        // If database status differs from Clerk metadata, sync it
        if (metadataStatus !== dbStatus) {
          console.log(`Syncing status: metadata="${metadataStatus}" → database="${dbStatus}"`);
          
          // Force sync the status to Clerk
          await fetchAPI('/api/driver/sync-verification', {
            method: 'POST',
            body: JSON.stringify({ clerkId: user.id }),
          });
          
          // Reload user metadata to get updated status
          await user.reload();
          
          // Update local state again after reload
          setVerificationStatus(dbStatus);
        }
      } else {
        // Fallback to metadata if API fails
        const metadataStatus = user.publicMetadata?.verification_status as VerificationStatus;
        if (metadataStatus) {
          setVerificationStatus(metadataStatus);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch verification status:', error);
      }
      // Fallback to metadata on error
      const metadataStatus = user.publicMetadata?.verification_status as VerificationStatus;
      if (metadataStatus) {
        setVerificationStatus(metadataStatus);
      }
    }
  }, [user]);

  // Initialize verification status
  useEffect(() => {
    if (user?.publicMetadata?.is_driver === true) {
      fetchVerificationStatus();
    }
  }, [user?.id, user?.publicMetadata?.is_driver, fetchVerificationStatus]);

  // Refresh verification status when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.publicMetadata?.is_driver === true) {
        fetchVerificationStatus();
      }
    }, [user?.publicMetadata?.is_driver, fetchVerificationStatus])
  );

  const handleVerifyID = () => {
    setVerificationModalVisible(true);
  };

  const handleVerificationSuccess = async () => {
    // Refresh verification status after successful verification
    await fetchVerificationStatus();
  };

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/(root)/(auth)/sign-in')
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      if (__DEV__) {
        console.error(JSON.stringify(err, null, 2))
      }
    }
  }

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photo library to update your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take profile pictures.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const uploadImageToClerk = async (imageUri: string) => {
    try {
      setUploading(true);
      
      // For React Native, we need to pass the file directly without FormData
      const response = await user?.setProfileImage({ 
        file: {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any
      });
      
      if (response) {
        // Reload user data to get the new image URL
        await user?.reload();
        
        // Sync the new avatar URL to our database
        const avatarUrl = user?.imageUrl;
        if (avatarUrl && user?.id) {
          try {
            await fetchAPI('/api/profile/sync-avatar', {
              method: 'POST',
              body: JSON.stringify({
                clerkId: user.id,
                avatarUrl: avatarUrl,
              }),
            });
          } catch (syncError) {
            if (__DEV__) {
              console.error('Failed to sync avatar to database:', syncError);
            }
            // Don't show error to user since the upload was successful
          }
        }
        
        Alert.alert('Success', 'Profile picture updated successfully!');
        setImagePickerVisible(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Upload error:', error);
      }
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImageToClerk(result.assets[0].uri);
    }
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImageToClerk(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background} ${styles.className}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        <View className="px-6 pt-6 pb-4">
          {/* Avatar Only - Clean and Simple */}
          <View className="items-center mb-4">
            <TouchableOpacity
              onPress={() => setImagePickerVisible(true)}
              disabled={uploading}
              activeOpacity={0.8}
            >
              <View style={{ position: 'relative' }}>
                {(() => {
                  const userImage =
                    user?.imageUrl ||
                    (user?.externalAccounts && user.externalAccounts[0]?.imageUrl);
                  return userImage ? (
                    <Image
                      source={{ uri: userImage }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: isDark ? '#374151' : '#F3F4F6'
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: isDark ? '#374151' : '#F3F4F6',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Text style={{
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        fontSize: 30,
                        fontWeight: 'bold'
                      }}>
                        {user?.firstName?.[0] || 'A'}
                      </Text>
                    </View>
                  );
                })()}

                {/* Camera Icon Badge */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isDark ? '#F97316' : '#EA580C',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2.5,
                    borderColor: isDark ? '#000000' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                >
                  <Feather name="camera" size={14} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Name and Rating - Centered */}
          <View className="items-center mb-6">
            <Text 
              style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                color: isDark ? '#FFFFFF' : '#111827',
                textAlign: 'center',
                marginBottom: 8
              }}
              >
                {(() => {
                  const firstName = user?.firstName?.trim();
                  const lastName = user?.lastName?.trim();
                  
                  if (firstName && lastName) {
                    return `${firstName} ${lastName}`;
                  }
                  
                  if (firstName) {
                    return firstName;
                  }
                  
                  if (user?.emailAddresses?.[0]?.emailAddress) {
                    const emailPrefix = user.emailAddresses[0].emailAddress.split('@')[0];
                    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
                  }
                  
                  return 'User';
                })()} 
            </Text>

            {/* Rating and Driver Badge */}
            <View className="flex-row items-center justify-center">
              <View className="flex-row items-center mr-4">
                <Feather name="star" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text 
                  className="ml-1 font-semibold"
                  style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 16 }}
                >
                  5.00
                </Text>
              </View>
              
              {user?.publicMetadata?.is_driver === true && verificationStatus === 'verified' && (
                <View className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#F97316" />
                  <Text 
                    className="ml-1 font-semibold"
                    style={{ color: isDark ? '#FB923C' : '#F97316', fontSize: 16 }}
                  >
                    Driver
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* College Verification Section */}
        {(user?.unsafeMetadata?.college_name || user?.publicMetadata?.college_name) && (
          <View className="px-6 mb-6">
            <Text 
              className="font-bold" 
              style={{ 
                fontSize: 18, 
                color: isDark ? '#FFFFFF' : '#111827',
                marginBottom: 16
              }}
            >
              Verification Status
            </Text>
            
            <View className="flex-row items-center mb-3">
              <Feather name="check-circle" size={18} color={isDark ? '#FB923C' : '#F97316'} />
              <Text 
                style={{
                  marginLeft: 8,
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#FB923C' : '#F97316',
                }}
              >
                Verified Student
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <MaterialIcons 
                name="school" 
                size={20} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
              <Text 
                style={{
                  marginLeft: 8,
                  fontSize: 15,
                  fontWeight: '500',
                  color: isDark ? '#D1D5DB' : '#4B5563',
                }}
              >
                {user.unsafeMetadata?.college_name || user.publicMetadata?.college_name}
              </Text>
            </View>
          </View>
        )}
        
        {/* Driver Verification Section - DISABLED (New Payment Model: peer-to-peer coordination) */}
        {/* {user?.publicMetadata?.is_driver === true && (
          <View className="px-6 mb-6">
            <VerifyIDButton
              status={verificationStatus}
              onPress={verificationStatus === 'pending' ? fetchVerificationStatus : handleVerifyID}
              loading={verificationLoading}
            />
          </View>
        )} */}

        {/* Social Features Section */}
        <View className="px-6 mb-6">
          <View className="mb-4">
            <Text
              className="font-bold"
              style={{
                fontSize: 24,
                color: isDark ? '#FFFFFF' : '#111827'
              }}
            >
              Social
            </Text>
            <Text
              className="mt-1"
              style={{
                fontSize: 16,
                color: isDark ? '#9CA3AF' : '#6B7280'
              }}
            >
              Connect with your campus community
            </Text>
          </View>

          {/* Social Items */}
          <View>
            {socialMenuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                className="flex-row items-center px-6 py-5"
                style={{
                  borderBottomWidth: idx < socialMenuItems.length - 1 ? 1 : 0,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB'
                }}
                activeOpacity={0.7}
              >
                <View className="mr-4">
                  {getMenuIcon(item.id)}
                </View>

                <Text
                  className="flex-1 font-medium"
                  style={{
                    fontSize: 18,
                    color: isDark ? '#FFFFFF' : '#111827'
                  }}
                >
                  {item.title}
                </Text>

                <Feather
                  name="chevron-right"
                  size={20}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account & Settings Section */}
        <View className="px-6 mb-6">
          <View className="mb-4">
            <Text 
              className="font-bold" 
              style={{ 
                fontSize: 24, 
                color: isDark ? '#FFFFFF' : '#111827' 
              }}
            >
              Account & Settings
            </Text>
            <Text 
              className="mt-1" 
              style={{ 
                fontSize: 16, 
                color: isDark ? '#9CA3AF' : '#6B7280' 
              }}
            >
              Manage your profile and preferences
            </Text>
          </View>
          
          {/* Settings Items */}
          <View>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                className="flex-row items-center px-6 py-5"
                style={{
                  borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB'
                }}
                activeOpacity={0.7}
              >
                <View className="mr-4">
                  {getMenuIcon(item.id)}
                </View>

                <Text
                  className="flex-1 font-medium"
                  style={{
                    fontSize: 18,
                    color: isDark ? '#FFFFFF' : '#111827'
                  }}
                >
                  {item.title}
                </Text>

                <Feather
                  name="chevron-right"
                  size={20}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Theme & Preferences Section */}
        <View className="px-6 mb-6">
          <View className="mb-4">
            <Text 
              className="font-bold" 
              style={{ 
                fontSize: 24, 
                color: isDark ? '#FFFFFF' : '#111827' 
              }}
            >
              Preferences
            </Text>
            <Text 
              className="mt-1" 
              style={{ 
                fontSize: 16, 
                color: isDark ? '#9CA3AF' : '#6B7280' 
              }}
            >
              Customize your app experience
            </Text>
          </View>
          
          {/* Theme Toggle Card */}
          <ThemeToggle variant="card" />
        </View>

        {/* Sign Out Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            className="px-6 py-5"
            activeOpacity={0.7}
          >
            <Text
              className="font-medium"
              style={{
                fontSize: 18,
                color: isDark ? '#FFFFFF' : '#111827'
              }}
            >
              Sign out
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      
      {/* Image Picker Modal */}
      <ReactNativeModal
        isVisible={imagePickerVisible}
        onBackdropPress={() => setImagePickerVisible(false)}
        className="justify-end m-0"
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={300}
        animationOutTiming={300}
      >
        <View 
          className="rounded-3xl p-6 min-h-[320px] mx-4 mb-8"
          style={{ backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }}
        >
          <View 
            className="w-12 h-1 rounded-full mx-auto mb-6"
            style={{ backgroundColor: isDark ? '#6B7280' : '#D1D5DB' }}
          />
          
          <Text 
            className="text-2xl font-bold text-center mb-8"
            style={{ color: isDark ? '#FFFFFF' : '#111827' }}
          >
            Update Profile Photo
          </Text>
          
          <CustomButton
            title="Take Photo"
            onPress={pickImageFromCamera}
            bgVariant="primary"
            textVariant="default"
            className="mb-4 w-full"
            loading={uploading}
            disabled={uploading}
            IconLeft={() => <Feather name="camera" size={20} color="white" style={{ marginRight: 8 }} />}
          />
          
          <CustomButton
            title="Choose from Gallery"
            onPress={pickImageFromGallery}
            bgVariant="outline"
            className="mb-4 w-full"
            loading={uploading}
            disabled={uploading}
            IconLeft={() => <Feather name="image" size={20} color={isDark ? '#FFFFFF' : '#374151'} style={{ marginRight: 8 }} />}
          />
          
          <CustomButton
            title="Cancel"
            onPress={() => setImagePickerVisible(false)}
            bgVariant="outline"
            className="w-full"
            disabled={uploading}
          />
        </View>
      </ReactNativeModal>
      
      {/* Verification Modal */}
      {user?.id && (
        <VerificationModal
          visible={verificationModalVisible}
          onClose={() => setVerificationModalVisible(false)}
          onSuccess={handleVerificationSuccess}
          userClerkId={user.id}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;