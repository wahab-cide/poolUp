import CollegeInfoCard from '@/components/CollegeInfoCard';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { getSupportedColleges } from '@/lib/eduValidation';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SupportedColleges = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const colleges = getSupportedColleges();

  // Group colleges by state
  const collegesByState = colleges.reduce((acc, college) => {
    if (!acc[college.state]) {
      acc[college.state] = [];
    }
    acc[college.state].push(college);
    return acc;
  }, {} as Record<string, typeof colleges>);

  const stateNames: Record<string, string> = {
    'MA': 'Massachusetts',
    'PA': 'Pennsylvania', 
    'CA': 'California',
    'VT': 'Vermont',
    'ME': 'Maine',
    'MN': 'Minnesota',
    'NC': 'North Carolina',
    'NY': 'New York',
    'IA': 'Iowa',
    'CT': 'Connecticut',
    'OH': 'Ohio'
  };

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4" 
        style={{ 
          borderBottomWidth: 1, 
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' 
        }}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-4"
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? "#FFFFFF" : "#000000"} 
          />
        </TouchableOpacity>
        <Text className={`text-xl font-InterBold ${styles.textPrimary}`}>
          Supported Colleges
        </Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View className="px-6 py-6">
          <Text className={`text-lg font-InterSemiBold ${styles.textPrimary} mb-2`}>
            Elite Liberal Arts Colleges
          </Text>
          <Text className={`text-sm font-Inter ${styles.textSecondary} mb-4`}>
            poolUp is currently available for students at {colleges.length} select liberal arts colleges. 
            More colleges will be added soon!
          </Text>
          
          {/* Stats */}
          <View className={`${styles.card} p-4 rounded-xl flex-row justify-around`}>
            <View className="items-center">
              <Text className={`text-2xl font-InterBold ${styles.textPrimary}`}>
                {colleges.length}
              </Text>
              <Text className={`text-xs font-Inter ${styles.textSecondary}`}>
                Colleges
              </Text>
            </View>
            <View className="items-center">
              <Text className={`text-2xl font-InterBold ${styles.textPrimary}`}>
                {Object.keys(collegesByState).length}
              </Text>
              <Text className={`text-xs font-Inter ${styles.textSecondary}`}>
                States
              </Text>
            </View>
            <View className="items-center">
              <Text className={`text-2xl font-InterBold ${styles.textPrimary}`}>
                100%
              </Text>
              <Text className={`text-xs font-Inter ${styles.textSecondary}`}>
                Elite
              </Text>
            </View>
          </View>
        </View>

        {/* Colleges by State */}
        {Object.entries(collegesByState)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([state, stateColleges]) => (
            <View key={state} className="mb-6">
              <View className="px-6 mb-3">
                <Text className={`text-lg font-InterSemiBold ${styles.textPrimary}`}>
                  {stateNames[state] || state} ({stateColleges.length})
                </Text>
              </View>
              
              {stateColleges
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((college) => (
                  <View key={college.id} className="px-4 mb-3">
                    <CollegeInfoCard
                      college={college}
                      showStats={false}
                    />
                  </View>
                ))}
            </View>
          ))}

        {/* Footer Info */}
        <View className="px-6 py-6">
          <View className={`${styles.card} p-4 rounded-xl`}>
            <View className="flex-row items-center mb-2">
              <Ionicons 
                name="information-circle" 
                size={20} 
                color={isDark ? "#60A5FA" : "#3B82F6"} 
              />
              <Text className={`ml-2 font-InterSemiBold ${styles.textPrimary}`}>
                Don&apos;t see your college?
              </Text>
            </View>
            <Text className={`text-sm font-Inter ${styles.textSecondary} leading-5`}>
              We&apos;re constantly adding new colleges to poolUp. If your elite liberal arts college 
              isn&apos;t listed here, please contact us and we&apos;ll prioritize adding it to our platform.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportedColleges;