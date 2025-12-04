import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const Promotions = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  
  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <View className="flex-row items-center px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#000'} />
        </TouchableOpacity>
        <Text className="text-xl font-InterBold" style={{ color: isDark ? '#FFFFFF' : '#000' }}>Promotions</Text>
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
            <Ionicons name="gift" size={56} color={isDark ? '#60A5FA' : '#3B82F6'} />
          </View>
          
          <Text className="text-3xl font-InterBold mb-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Promotions & Offers
          </Text>
          
          <Text className="text-lg text-center leading-7 px-4" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Keep an eye on this space for exclusive discounts, 
            referral bonuses, and special offers to save on your rides!
          </Text>
        </View>

        {/* Divider */}
        <View 
          className="mx-5 mb-8" 
          style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }} 
        />

        {/* Coming Soon Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Coming Soon
          </Text>
          
          <View className="space-y-4">
            {/* Referral Program Card */}
            <View 
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
                  <Ionicons name="pricetag" size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Text className="font-InterBold text-lg" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                      Referral Program
                    </Text>
                    <View 
                      className="ml-3 px-3 py-1 rounded-full" 
                      style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }}
                    >
                      <Text className="text-xs font-InterSemiBold" style={{ color: '#10b981' }}>
                        COMING SOON
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Invite friends and earn credits when they take their first ride with Loop
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="gift-outline" size={16} color="#10b981" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#10b981' }}>
                      Earn up to $10 per referral
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Early Bird Discounts Card */}
            <View 
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
                  <MaterialIcons name="percent" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Text className="font-InterBold text-lg" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                      Early Bird Discounts
                    </Text>
                    <View 
                      className="ml-3 px-3 py-1 rounded-full" 
                      style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}
                    >
                      <Text className="text-xs font-InterSemiBold" style={{ color: '#3b82f6' }}>
                        COMING SOON
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Get notified about special promotions for morning commutes and beat the rush
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#3b82f6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#3b82f6' }}>
                      Save up to 25% on early rides
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Seasonal Offers Card */}
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
                  <Ionicons name="sparkles" size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Text className="font-InterBold text-lg" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                      Seasonal Offers
                    </Text>
                    <View 
                      className="ml-3 px-3 py-1 rounded-full" 
                      style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }}
                    >
                      <Text className="text-xs font-InterSemiBold" style={{ color: '#8b5cf6' }}>
                        COMING SOON
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Special holiday discounts and campus event promotions throughout the year
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#8b5cf6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#8b5cf6' }}>
                      Holiday & event specials
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Tip Card */}
        <View className="px-5 pb-8">
          <View 
            className="rounded-2xl p-6" 
            style={{ 
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#A7F3D0',
            }}
          >
            <View className="flex-row items-start">
              <View 
                className="w-10 h-10 rounded-lg items-center justify-center mr-4" 
                style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }}
              >
                <Ionicons name="notifications" size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="font-InterSemiBold text-base mb-1" style={{ color: isDark ? '#34D399' : '#047857' }}>
                  Stay Updated
                </Text>
                <Text className="text-sm leading-5" style={{ color: isDark ? '#10B981' : '#065F46' }}>
                  Make sure notifications are enabled to never miss a promotion or special offer!
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Promotions; 