import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import { fetchAPI } from "@/lib/fetch";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

interface NotificationPreferences {
  ridesNearMe: boolean;
  bookingRequests: boolean;
  bookingConfirmations: boolean;
  rideReminders: boolean;
  rideCancellations: boolean;
  seatAvailability: boolean;
  chatMessages: boolean;
  paymentIssues: boolean;
  nearbyRadiusKm: number;
}

const Communication = () => {
  const { userId } = useAuth();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ridesNearMe: true,
    bookingRequests: true,
    bookingConfirmations: true,
    rideReminders: true,
    rideCancellations: true,
    seatAvailability: true,
    chatMessages: true,
    paymentIssues: true,
    nearbyRadiusKm: 15,
  });

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await fetchAPI(`/api/notifications/preferences?clerkId=${userId}`);
      if (data.success) {
        setPreferences(data.preferences || data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | number) => {
    if (!userId) return;

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    setSaving(true);

    try {
      const response = await fetchAPI("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId: userId,
          preferences: updatedPreferences,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Revert the change
      setPreferences(preferences);
      Alert.alert("Error", "Failed to update notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const NotificationItem = ({
    title,
    description,
    settingKey,
    icon,
    iconColor = "#3B82F6",
  }: {
    title: string;
    description: string;
    settingKey: keyof NotificationPreferences;
    icon?: React.ReactNode;
    iconColor?: string;
  }) => (
    <View 
      className="mx-4 mb-3 rounded-xl overflow-hidden"
      style={{ 
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isDark ? '#374151' : '#E5E7EB'
      }}
    >
      <View className="flex-row items-center p-4">
        {icon && (
          <View className="mr-3">
            {icon}
          </View>
        )}
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            {title}
          </Text>
          <Text className="text-sm mt-1 leading-5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {description}
          </Text>
        </View>
        <Switch
          value={preferences[settingKey] as boolean}
          onValueChange={(value) => updatePreference(settingKey, value)}
          trackColor={{ false: isDark ? "#4B5563" : "#D1D5DB", true: "#10B981" }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={isDark ? '#4B5563' : '#D1D5DB'}
          disabled={saving}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#10b981'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b" style={{ borderBottomColor: isDark ? '#374151' : '#E5E7EB' }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold flex-1" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
          Communication Settings
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Saving Indicator */}
        {saving && (
          <View className="mx-4 mt-4 px-4 py-3 rounded-lg flex-row items-center" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="ml-3 text-sm font-medium" style={{ color: '#3B82F6' }}>
              Saving preferences...
            </Text>
          </View>
        )}

        {/* Ride Notifications Section */}
        <View className="mt-6">
          <View className="px-4 mb-4">
            <Text className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              Ride Notifications
            </Text>
            <Text className="text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Stay updated about your rides and bookings
            </Text>
          </View>
          
          <NotificationItem
            title="Rides Near Me"
            description="Get notified when new rides are posted near your location"
            settingKey="ridesNearMe"
            icon={<Feather name="map-pin" size={20} color="#10B981" />}
          />
          
          <NotificationItem
            title="Booking Requests"
            description="Receive alerts when riders request to book your rides"
            settingKey="bookingRequests"
            icon={<Feather name="user-plus" size={20} color="#F59E0B" />}
          />
          
          <NotificationItem
            title="Booking Confirmations"
            description="Know when your booking is confirmed by the driver"
            settingKey="bookingConfirmations"
            icon={<Feather name="check-circle" size={20} color="#3B82F6" />}
          />
          
          <NotificationItem
            title="Ride Reminders"
            description="Get reminded 30 minutes before your scheduled departure"
            settingKey="rideReminders"
            icon={<Feather name="clock" size={20} color="#F97316" />}
          />
          
          <NotificationItem
            title="Ride Cancellations"
            description="Be informed when a ride you're part of is cancelled"
            settingKey="rideCancellations"
            icon={<Feather name="x-circle" size={20} color="#EF4444" />}
          />
        </View>

        {/* Other Notifications Section */}
        <View className="mt-8">
          <View className="px-4 mb-4">
            <Text className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              Other Notifications
            </Text>
            <Text className="text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Messages, payments, and availability updates
            </Text>
          </View>
          
          <NotificationItem
            title="Seat Availability"
            description="Know when seats become available on rides you're watching"
            settingKey="seatAvailability"
            icon={<MaterialIcons name="event-seat" size={20} color="#14B8A6" />}
          />
          
          <NotificationItem
            title="Chat Messages"
            description="Receive notifications for new messages from drivers or riders"
            settingKey="chatMessages"
            icon={<Feather name="message-circle" size={20} color="#06B6D4" />}
          />
          
          <NotificationItem
            title="Payment & Refunds"
            description="Important updates about payments, refunds, and transactions"
            settingKey="paymentIssues"
            icon={<Feather name="credit-card" size={20} color="#10B981" />}
          />
        </View>

        {/* Search Radius Section */}
        <View className="mt-8 mb-8">
          <View className="px-4 mb-4">
            <Text className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
              Notification Radius
            </Text>
            <Text className="text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Set how far to search for new rides
            </Text>
          </View>
          
          <View 
            className="mx-4 rounded-xl p-4"
            style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }}
          >
            <View className="flex-row items-center mb-3">
              <Feather name="compass" size={20} color="#3B82F6" />
              <Text className="text-base font-semibold ml-3" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                Current radius: {preferences.nearbyRadiusKm} km
              </Text>
            </View>
            <Text className="text-sm mb-4 leading-5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              You&apos;ll be notified about new rides within this distance from your saved locations
            </Text>
            <View className="flex-row justify-between">
              {[10, 15, 25, 50].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  onPress={() => updatePreference("nearbyRadiusKm", radius)}
                  className="flex-1 mx-1 py-3 rounded-lg items-center"
                  style={{
                    backgroundColor: preferences.nearbyRadiusKm === radius
                      ? "#3B82F6"
                      : isDark ? "#374151" : "#F3F4F6",
                    borderWidth: preferences.nearbyRadiusKm === radius ? 0 : 1,
                    borderColor: isDark ? '#4B5563' : '#E5E7EB'
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{
                      color: preferences.nearbyRadiusKm === radius
                        ? "#FFFFFF"
                        : isDark ? "#D1D5DB" : "#374151",
                      fontSize: 14
                    }}
                  >
                    {radius} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Information Section */}
        <View className="mx-4 mb-8 px-4 py-4 rounded-xl flex-row items-start" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }}>
          <Feather name="info" size={16} color="#3B82F6" style={{ marginTop: 2, marginRight: 10 }} />
          <Text className="text-sm leading-5 flex-1" style={{ color: isDark ? '#93BBFC' : '#1E40AF' }}>
            Push notifications must be enabled in your device settings for Loop to send you alerts. You can customize which notifications you receive here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Communication; 