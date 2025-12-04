import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const Help = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { isDark } = useTheme();
  const styles = useThemeStyles();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url);
  };


  const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <TouchableOpacity
      onPress={() => toggleSection(question)}
      className="py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-InterMedium flex-1 mr-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
          {question}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? '#6B7280' : '#9ca3af'}
          style={{ transform: [{ rotate: expandedSection === question ? '90deg' : '0deg' }] }}
        />
      </View>
      {expandedSection === question && (
        <Text className="mt-3 leading-6" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      <View className="flex-row items-center px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#000'} />
        </TouchableOpacity>
        <Text className="text-xl font-InterBold" style={{ color: isDark ? '#FFFFFF' : '#000' }}>Help & Support</Text>
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
            <Ionicons name="help-circle" size={56} color={isDark ? '#60A5FA' : '#3B82F6'} />
          </View>
          
          <Text className="text-3xl font-InterBold mb-4" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Help & Support
          </Text>
          
          <Text className="text-lg text-center leading-7 px-4" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Get answers to common questions and find support resources for a seamless Loop experience
          </Text>
        </View>

        {/* Divider */}
        <View 
          className="mx-5 mb-8" 
          style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }} 
        />

        {/* Quick Links Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Quick Links
          </Text>
          
          <View className="space-y-4">
            {/* Community Guidelines Card */}
            <TouchableOpacity 
              onPress={() => openExternalLink("https://looprides.dev/community-guidelines")}
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
                  <Ionicons name="people" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Community Guidelines
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Learn about our community standards and how to have a safe, respectful experience
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="open-outline" size={16} color="#3b82f6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#3b82f6' }}>
                      Read guidelines
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9ca3af'} />
              </View>
            </TouchableOpacity>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Safety Center Card */}
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
                  <Ionicons name="shield-checkmark" size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Safety Center
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Safety guidelines and tips for ridesharing to keep you secure on every trip
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="shield-outline" size={16} color="#8b5cf6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#8b5cf6' }}>
                      Safety tips & resources
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9ca3af'} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Frequently Asked Questions
          </Text>

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
            <FAQItem
              question="How do I book a ride?"
              answer="Browse available rides on the home feed, select one that matches your route, and tap 'Request Ride' to request a booking. The driver will approve your request."
            />
            <FAQItem
              question="How do I cancel a booking?"
              answer="Go to your Bookings tab inside Rides, find the ride you want to cancel, and tap 'Cancel Booking'. Please note our cancellation policy may apply."
            />
            <FAQItem
              question="How do I become a driver?"
              answer="To become a driver, you'll need to complete identity verification and provide vehicle information. Go to the driver verification section in your profile to get started."
            />
            <FAQItem
              question="How are payments handled?"
              answer="Payments are processed securely through our platform. Riders pay when booking, and drivers receive payment after the ride is completed."
            />
            <FAQItem
              question="What if I need to report an issue?"
              answer="You can report issues through our contact support feature, or directly through the ride details if it's related to a specific trip."
            />
          </View>
        </View>

        {/* Contact Section */}
        <View className="px-5 mb-8">
          <Text className="text-xl font-InterBold mb-6" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Contact Information
          </Text>

          <View className="space-y-4">
            {/* Email Contact Card */}
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
                  <Ionicons name="mail" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Email Support
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Get help with your account, rides, or general questions
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="mail-outline" size={16} color="#3b82f6" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#3b82f6' }}>
                      developer.loop.acc@icloud.com
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ height: 16 }} />

            {/* Phone Contact Card */}
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
                  <Ionicons name="call" size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="font-InterBold text-lg mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                    Phone Support
                  </Text>
                  <Text className="text-base leading-6 mb-3" style={{ color: isDark ? '#D1D5DB' : '#4B5563' }}>
                    Speak directly with our support team for urgent issues
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="call-outline" size={16} color="#10b981" />
                    <Text className="ml-2 text-sm font-InterMedium" style={{ color: '#10b981' }}>
                      (413) 346 7412
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Notice */}
        <View className="px-5 pb-8">
          <View 
            className="rounded-2xl p-6" 
            style={{ 
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA',
            }}
          >
            <View className="flex-row items-start">
              <View 
                className="w-10 h-10 rounded-lg items-center justify-center mr-4" 
                style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA' }}
              >
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="font-InterSemiBold text-base mb-1" style={{ color: isDark ? '#F87171' : '#7F1D1D' }}>
                  Emergency Situations
                </Text>
                <Text className="text-sm leading-5" style={{ color: isDark ? '#EF4444' : '#B91C1C' }}>
                  For urgent safety concerns during a ride, use the emergency features in the app or contact local emergency services directly.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Help; 