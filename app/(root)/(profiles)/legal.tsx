import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import React from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const Legal = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const openExternalLink = (url: string) => {
    Linking.openURL(url);
  };



  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <View className="flex-row items-center px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#000'} />
        </TouchableOpacity>
        <Text className="text-xl font-InterBold" style={{ color: isDark ? '#FFFFFF' : '#000' }}>Legal</Text>
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
            <Ionicons name="document-text" size={56} color={isDark ? '#60A5FA' : '#3B82F6'} />
          </View>
          
          <Text className="text-3xl font-InterBold mb-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Legal Information
          </Text>
          
          <Text className="text-lg text-center leading-7 px-4" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Review our legal documents, policies, and agreements that govern the use of poolUp
          </Text>
        </View>

        {/* Divider */}
        <View 
          className="mx-5 mb-8" 
          style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }} 
        />

        {/* Legal Documents Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Legal Documents
          </Text>
          
          <View className="space-y-4">
            {/* Terms of Service Card */}
            <TouchableOpacity 
              onPress={() => openExternalLink("https://looprides.dev/terms")}
              className="rounded-2xl p-6" 
              style={{ 
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
                shadowColor: isDark ? '#000000' : '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4" 
                  style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}
                >
                  <Ionicons name="document-text" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Terms of Service
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Our terms and conditions for using poolUp ridesharing platform
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="open-outline" size={16} color="#3b82f6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#3b82f6' }}>
                      Read terms
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9ca3af'} />
              </View>
            </TouchableOpacity>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Privacy Policy Card */}
            <TouchableOpacity 
              onPress={() => openExternalLink("https://looprides.dev/privacy")}
              className="rounded-2xl p-6" 
              style={{ 
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                shadowColor: isDark ? '#000000' : '#F97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4" 
                  style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }}
                >
                  <Ionicons name="shield-checkmark" size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Privacy Policy
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    How we collect, use, and protect your personal data and privacy
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="shield-outline" size={16} color="#8b5cf6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#8b5cf6' }}>
                      Privacy details
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9ca3af'} />
              </View>
            </TouchableOpacity>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Community Guidelines Card */}
            <TouchableOpacity 
              onPress={() => openExternalLink("https://looprides.dev/community-guidelines")}
              className="rounded-2xl p-6" 
              style={{ 
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                shadowColor: isDark ? '#000000' : '#F97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4" 
                  style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }}
                >
                  <Ionicons name="eye" size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Community Guidelines
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Rules and standards for maintaining a respectful community
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="people-outline" size={16} color="#8b5cf6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#8b5cf6' }}>
                      Community rules
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9ca3af'} />
              </View>
            </TouchableOpacity>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Driver Agreement Card */}
            <TouchableOpacity 
              onPress={() => openExternalLink("https://looprides.dev/terms")}
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
                  <Ionicons name="scale" size={24} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Driver Agreement
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Additional terms and responsibilities for drivers on the poolUp platform
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="car-outline" size={16} color="#f59e0b" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#f59e0b' }}>
                      Driver terms
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9ca3af'} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety & Trust Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Safety & Trust
          </Text>

          <View className="space-y-4">
            {/* Stripe Verification Card */}
            <View 
              className="rounded-2xl p-6" 
              style={{ 
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                shadowColor: isDark ? '#000000' : '#F97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4" 
                  style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }}
                >
                  <Ionicons name="shield-checkmark" size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Stripe ID Verification
                  </Text>
                  <Text className="text-base leading-6" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    All drivers complete secure identity verification through Stripe to ensure the safety and trust of our community.
                  </Text>
                </View>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Incident Reporting Card */}
            <View 
              className="rounded-2xl p-6" 
              style={{ 
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
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
                  <Ionicons name="alert-circle" size={24} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Incident Reporting
                  </Text>
                  <Text className="text-base leading-6" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Any safety concerns or incidents can be reported through our support system or emergency features in the app.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View className="px-5 mb-8">
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
              <Text className="font-InterSemiBold">Last updated:</Text> July 2025{"\n\n"}
              For questions about our legal policies, contact{" "}
              <Text 
                className="underline font-InterMedium"
                style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
                onPress={() => openExternalLink("mailto:developer.loop.acc@icloud.com")}
              >
                developer.loop.acc@icloud.com
              </Text>
            </Text>
          </View>
        </View>

        {/* External Links Notice */}
        <View className="px-5 pb-8">
          <View 
            className="rounded-2xl p-6" 
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
                <Ionicons name="open-outline" size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="font-InterSemiBold text-base mb-1" style={{ color: isDark ? '#FBBF24' : '#78350F' }}>
                  External Links
                </Text>
                <Text className="text-sm leading-5" style={{ color: isDark ? '#F59E0B' : '#92400E' }}>
                  Legal documents will open in your browser at looprides.dev for your review.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Legal; 