import { useUser } from "@clerk/clerk-expo";
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";
import { fetchAPI } from "@/lib/fetch";

interface UserProfile {
  phone: string;
  address: string;
  bio: string;
}

const Personal = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  
  // State for editable fields
  const [profile, setProfile] = useState<UserProfile>({
    phone: '',
    address: '',
    bio: ''
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [user?.id]);
  
  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetchAPI(`/api/user/profile?clerkId=${user.id}`);
      if (response.success) {
        setProfile({
          phone: response.user.phone || '',
          address: response.user.address || '',
          bio: response.user.bio || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async (field: keyof UserProfile, value: string) => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Send all profile fields to prevent other fields from being nullified
      const updateData = {
        clerkId: user.id,
        phone: field === 'phone' ? value.trim() : profile.phone,
        address: field === 'address' ? value.trim() : profile.address,
        bio: field === 'bio' ? value.trim() : profile.bio
      };
      
      const response = await fetchAPI('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.success) {
        setProfile(prev => ({ ...prev, [field]: value.trim() }));
        setEditingField(null);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleEdit = (field: keyof UserProfile) => {
    setEditingField(field);
  };
  
  const handleCancel = () => {
    setEditingField(null);
  };

  const PersonalInfoItem = ({ 
    icon, 
    title, 
    value, 
    onEdit, 
    showEdit = true,
    field,
    editable = false
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | null;
    onEdit: () => void;
    showEdit?: boolean;
    field?: keyof UserProfile;
    editable?: boolean;
  }) => {
    const isEditing = editingField === field && editable;
    const [tempValue, setTempValue] = useState(value || '');
    
    return (
      <View className="py-6" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
        <View className="flex-row items-start">
          <View className="w-12 h-12 items-center justify-center mr-4 mt-1">
            {icon}
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold mb-1" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              {title}
            </Text>
            {isEditing ? (
              <View className="mt-2">
                <TextInput
                  value={tempValue}
                  onChangeText={setTempValue}
                  className="p-3 rounded-lg text-base"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#F9FAFB',
                    color: isDark ? '#FFFFFF' : '#111827',
                    borderWidth: 1,
                    borderColor: isDark ? '#4B5563' : '#D1D5DB'
                  }}
                  placeholder={`Enter ${title.toLowerCase()}`}
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  multiline={field === 'address' || field === 'bio'}
                  numberOfLines={field === 'address' || field === 'bio' ? 3 : 1}
                  keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
                  autoFocus
                />
                <View className="flex-row mt-3 gap-2">
                  <TouchableOpacity
                    onPress={() => handleSave(field!, tempValue)}
                    disabled={saving}
                    className="flex-1 py-3 rounded-lg flex-row items-center justify-center"
                    style={{ backgroundColor: isDark ? '#10B981' : '#059669' }}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 6 }} />
                    ) : (
                      <Feather name="check" size={16} color="white" style={{ marginRight: 6 }} />
                    )}
                    <Text className="font-semibold text-white">
                      {saving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancel}
                    disabled={saving}
                    className="flex-1 py-3 rounded-lg flex-row items-center justify-center"
                    style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }}
                  >
                    <Feather name="x" size={16} color={isDark ? '#D1D5DB' : '#374151'} style={{ marginRight: 6 }} />
                    <Text className="font-semibold" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text className="text-base leading-5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                {value || "Not provided"}
              </Text>
            )}
          </View>
          {showEdit && editable && !isEditing && (
            <TouchableOpacity
              onPress={onEdit}
              className="px-4 py-2 rounded-full ml-2"
              style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }}
              activeOpacity={0.7}
            >
              <Text className="font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="flex-row items-center px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mr-4"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={28} color={isDark ? '#FFFFFF' : '#222'} />
          </TouchableOpacity>
          <Text className="text-xl font-semibold flex-1 text-center mr-14" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Personal
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#10B981' : '#059669'} />
          <Text className="mt-4 text-base" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center mr-4"
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={28} color={isDark ? '#FFFFFF' : '#222'} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold flex-1 text-center mr-14" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
          Personal
        </Text>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Personal Info Section */}
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Personal info
          </Text>
          <Text className="text-base leading-6 mb-6" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Only you can see these details. We&apos;ll use this info to help verify your details.
          </Text>
          <View>
            <PersonalInfoItem
              icon={<MaterialIcons name="person-outline" size={28} color={isDark ? '#FFFFFF' : '#222'} />}
              title="Name"
              value={user?.fullName || null}
              onEdit={() => handleEdit("Name")}
              showEdit={false}
            />
            <PersonalInfoItem
              icon={<Feather name="map-pin" size={26} color={isDark ? '#FFFFFF' : '#222'} />}
              title="Residential address"
              value={profile.address}
              onEdit={() => handleEdit('address')}
              field="address"
              editable={true}
            />
            <PersonalInfoItem
              icon={<Feather name="file-text" size={26} color={isDark ? '#FFFFFF' : '#222'} />}
              title="Bio"
              value={profile.bio}
              onEdit={() => handleEdit('bio')}
              field="bio"
              editable={true}
            />
          </View>
        </View>
        {/* Contact Info Section */}
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Contact info
          </Text>
          <View>
            <PersonalInfoItem
              icon={<Feather name="phone" size={26} color={isDark ? '#FFFFFF' : '#222'} />}
              title="Phone number"
              value={profile.phone || user?.primaryPhoneNumber?.phoneNumber}
              onEdit={() => handleEdit('phone')}
              field="phone"
              editable={true}
            />
            <PersonalInfoItem
              icon={<Feather name="mail" size={26} color={isDark ? '#FFFFFF' : '#222'} />}
              title="Email address"
              value={user?.primaryEmailAddress?.emailAddress || null}
              onEdit={() => handleEdit("Email address")}
            />
          </View>
        </View>
        {/* Additional Safety Note */}
        <View className="px-6 py-4 mx-6 mb-6 rounded-lg flex-row items-center" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }}>
          <Feather name="lock" size={20} color={isDark ? '#60A5FA' : '#2563EB'} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text className="font-medium text-sm" style={{ color: isDark ? '#93C5FD' : '#1E40AF' }}>
              Your personal information is encrypted and secure
            </Text>
            <Text className="text-sm mt-1" style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
              We only share necessary details with ride participants for safety and coordination.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Personal;