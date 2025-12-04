import React from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";
import { useUser } from "@clerk/clerk-expo";

const Manage = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const { user } = useUser();

  const handleDeactivateAccount = () => {
    Alert.alert(
      "Deactivate Account",
      "Are you sure you want to deactivate your account? This will temporarily disable your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          style: "destructive",
          onPress: () => {
            const email = "developer.loop.acc@icloud.com";
            const subject = "Account Deactivation Request";
            const body = `Hi Loop Support,\n\nI would like to deactivate my account.\n\nUser Email: ${user?.emailAddresses?.[0]?.emailAddress || 'N/A'}\nUser ID: ${user?.id || 'N/A'}\n\nPlease process this request at your earliest convenience.\n\nThank you.`;

            const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            Linking.canOpenURL(mailtoUrl).then((supported) => {
              if (supported) {
                Linking.openURL(mailtoUrl);
              } else {
                Alert.alert(
                  "Email Not Available",
                  `Please email us at ${email} to request account deactivation.`
                );
              }
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account Permanently",
      "This action cannot be undone. All your data, ride history, and settings will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion Request",
              "Are you sure you want to request permanent account deletion? Our support team will process this request.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Proceed",
                  style: "destructive",
                  onPress: () => {
                    const email = "developer.loop.acc@icloud.com";
                    const subject = "Account Deletion Request - URGENT";
                    const body = `Hi Loop Support,\n\nI would like to PERMANENTLY DELETE my account and all associated data.\n\nUser Email: ${user?.emailAddresses?.[0]?.emailAddress || 'N/A'}\nUser ID: ${user?.id || 'N/A'}\n\nI understand this action is irreversible and all my data will be permanently removed.\n\nPlease confirm when this has been completed.\n\nThank you.`;

                    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                    Linking.canOpenURL(mailtoUrl).then((supported) => {
                      if (supported) {
                        Linking.openURL(mailtoUrl);
                      } else {
                        Alert.alert(
                          "Email Not Available",
                          `Please email us at ${email} to request account deletion.`
                        );
                      }
                    });
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <View className="flex-row items-center px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#000'} />
        </TouchableOpacity>
        <Text className="text-xl font-InterBold" style={{ color: isDark ? '#FFFFFF' : '#000' }}>Manage Account</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="items-center px-5 pt-8 pb-6">
          <View 
            className="w-32 h-32 rounded-full items-center justify-center mb-6"
            style={{ 
              backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
              shadowColor: isDark ? '#000000' : '#1F2937',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons name="settings" size={56} color={isDark ? '#60A5FA' : '#3B82F6'} />
          </View>
          
          <Text className="text-3xl font-InterBold mb-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Manage Account
          </Text>
          
          <Text className="text-lg text-center leading-7 px-4" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Control your account settings, data, and preferences in one place
          </Text>
        </View>

        {/* Divider */}
        <View 
          className="mx-5 mb-8" 
          style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }} 
        />

        {/* Account Actions Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Account Actions
          </Text>

          {/* Communication Preferences Card */}
          <TouchableOpacity
            onPress={() => router.push("/(root)/(profiles)/communication")}
            className="rounded-2xl p-6"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
              shadowColor: isDark ? '#000000' : '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-start">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }}
              >
                <Ionicons name="mail" size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  Communication Preferences
                </Text>
                <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                  Manage your notification settings and email preferences
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="notifications-outline" size={16} color="#10b981" />
                  <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#10b981' }}>
                    Notification settings
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9ca3af'} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Danger Zone Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Danger Zone
          </Text>

          {/* Warning Card */}
          <View 
            className="rounded-2xl p-6 mb-6" 
            style={{ 
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
            }}
          >
            <View className="flex-row items-start">
              <View 
                className="w-10 h-10 rounded-lg items-center justify-center mr-4" 
                style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }}
              >
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="font-InterSemiBold text-base mb-1" style={{ color: isDark ? '#FBBF24' : '#78350F' }}>
                  Before You Continue
                </Text>
                <Text className="text-sm leading-5" style={{ color: isDark ? '#F59E0B' : '#92400E' }}>
                  Deactivating or deleting your account will cancel all active rides and bookings. Make sure to complete or cancel them first.
                </Text>
              </View>
            </View>
          </View>

          <View className="space-y-4">
            {/* Deactivate Account Card */}
            <TouchableOpacity 
              onPress={handleDeactivateAccount}
              className="rounded-2xl p-6" 
              style={{ 
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                shadowColor: isDark ? '#000000' : '#F59E0B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4" 
                  style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }}
                >
                  <Ionicons name="person-remove" size={24} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Deactivate Account
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Temporarily disable your account. You can reactivate by logging back in
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="pause-outline" size={16} color="#f59e0b" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#f59e0b' }}>
                      Reversible action
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Delete Account Card */}
            <TouchableOpacity 
              onPress={handleDeleteAccount}
              className="rounded-2xl p-6" 
              style={{ 
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA',
                shadowColor: isDark ? '#000000' : '#EF4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4" 
                  style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA' }}
                >
                  <Ionicons name="trash" size={24} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#F87171' : '#7F1D1D' }}>
                    Delete Account Permanently
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#EF4444' : '#B91C1C' }}>
                    Permanently delete all your data, rides, and account information
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="warning-outline" size={16} color="#ef4444" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#ef4444' }}>
                      This action cannot be undone
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Contact */}
        <View className="px-5 pb-8">
          <View 
            className="rounded-2xl p-6" 
            style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
              shadowColor: isDark ? '#000000' : '#1F2937',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text className="text-center text-base leading-6" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Need help? Contact our support team at{"\n"}
              <Text className="font-InterSemiBold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                developer.loop.acc@icloud.com
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Manage; 