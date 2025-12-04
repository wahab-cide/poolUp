import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, FileText, Upload, Shield, Car, IdCard } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

const Documents = () => {
  const { isDark } = useTheme();
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className={`flex-row items-center px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000'} />
        </TouchableOpacity>
        <Text className={`text-xl font-InterBold ${isDark ? 'text-white' : 'text-black'}`}>Documents</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-5 py-8">
          <View className="items-center mb-8">
            <View className={`w-24 h-24 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full items-center justify-center mb-4`}>
              <FileText size={48} color="#9ca3af" />
            </View>
            
            <Text className={`text-xl font-InterBold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              No documents uploaded
            </Text>
            
            <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center leading-6`}>
              Upload your driver documents to start offering rides and earn money
            </Text>
          </View>

          <View className="space-y-4">
            <Text className={`text-lg font-InterSemiBold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Required Documents
            </Text>

            <TouchableOpacity className={`flex-row items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
              <View className={`w-12 h-12 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg items-center justify-center mr-4`}>
                <IdCard size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className={`font-InterMedium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Driver&apos;s License
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Valid driver&apos;s license for your region
                </Text>
              </View>
              <Upload size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity className={`flex-row items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
              <View className={`w-12 h-12 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg items-center justify-center mr-4`}>
                <Car size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className={`font-InterMedium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Vehicle Registration
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Proof of vehicle ownership and registration
                </Text>
              </View>
              <Upload size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity className={`flex-row items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
              <View className={`w-12 h-12 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg items-center justify-center mr-4`}>
                <Shield size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className={`font-InterMedium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  Identity Verification
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Valid identity verification document
                </Text>
              </View>
              <Upload size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className={`mt-8 p-4 ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'} rounded-lg`}>
            <Text className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'} leading-5`}>
              <Text className="font-InterSemiBold">Note:</Text> All documents are securely stored and verified. 
              Verification typically takes 1-2 business days.
            </Text>
          </View>

          <View className={`mt-6 p-4 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg`}>
            <Text className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'} text-center`}>
              Document upload feature coming soon!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Documents; 