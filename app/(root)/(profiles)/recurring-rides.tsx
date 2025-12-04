import { icons } from '@/constants';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RecurringTemplate {
  id: string;
  name: string;
  route: {
    origin: {
      label: string;
      lat: number;
      lng: number;
    };
    destination: {
      label: string;
      lat: number;
      lng: number;
    };
  };
  schedule: {
    departureTime: string;
    arrivalTime?: string;
    recurrencePattern: 'daily' | 'weekdays' | 'weekly' | 'custom';
    recurrenceDays: number[];
    activeFrom: string;
    activeUntil?: string;
  };
  rideDetails: {
    seatsAvailable: number;
    price: number;
    currency: string;
    fareSplittingEnabled: boolean;
  };
  status: {
    isActive: boolean;
    lastGenerated?: string;
    upcomingRidesCount: number;
    pastRidesCount: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecurringRidesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingTemplate, setTogglingTemplate] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await fetchAPI(`/api/recurring-rides/user/${user.id}`);
      
      if (data.success) {
        setTemplates(data.data.templates || []);
      } else {
        console.error('Failed to fetch templates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recurring ride templates:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTemplates();
  }, [fetchTemplates]);

  const toggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    if (!user?.id || togglingTemplate) return;

    setTogglingTemplate(templateId);
    
    try {
      const data = await fetchAPI(`/api/recurring-rides/user/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          templateId,
          isActive: !currentStatus
        })
      });

      if (data.success) {
        // Update local state
        setTemplates(prev => prev.map(template => 
          template.id === templateId 
            ? { ...template, status: { ...template.status, isActive: !currentStatus } }
            : template
        ));

        Alert.alert(
          'Success',
          data.data.message || (!currentStatus ? 'Template activated' : 'Template deactivated'),
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(data.error || 'Failed to update template');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update template status',
        [{ text: 'OK' }]
      );
    } finally {
      setTogglingTemplate(null);
    }
  };

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    
    const utcTimestamp = new Date();
    utcTimestamp.setUTCHours(parseInt(hour), parseInt(minute), 0, 0);
    
    return utcTimestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit', 
      hour12: true
    });
  };

  const formatRecurrencePattern = (pattern: string, days: number[]) => {
    switch (pattern) {
      case 'daily':
        return 'Every day';
      case 'weekdays':
        return 'Weekdays (Mon-Fri)';
      case 'weekly':
        return `Every ${DAYS_OF_WEEK[days[0]] || 'week'}`;
      case 'custom':
        return days.map(d => DAYS_OF_WEEK[d]).join(', ');
      default:
        return pattern;
    }
  };

  const renderTemplateCard = (template: RecurringTemplate) => (
    <View
      key={template.id}
      className="mb-5 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        borderWidth: isDark ? 0 : 1,
        borderColor: isDark ? 'transparent' : '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.12,
        shadowRadius: isDark ? 8 : 6,
        elevation: isDark ? 4 : 3,
      }}
    >

      <View className="p-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`text-lg font-bold flex-1 mr-3 ${styles.textPrimary}`}>
            {template.name}
          </Text>
          <TouchableOpacity
            onPress={() => toggleTemplateStatus(template.id, template.status.isActive)}
            disabled={togglingTemplate === template.id}
            className="px-3 py-1.5 rounded-full flex-row items-center"
            style={{
              backgroundColor: template.status.isActive 
                ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)')
                : (isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)')
            }}
            activeOpacity={0.8}
          >
            {togglingTemplate === template.id ? (
              <ActivityIndicator size="small" color={template.status.isActive ? '#F97316' : '#6B7280'} />
            ) : (
              <>
                <View className={`w-2 h-2 rounded-full mr-2`} style={{
                  backgroundColor: template.status.isActive ? '#F97316' : '#6B7280'
                }} />
                <Text className="text-xs font-semibold" style={{
                  color: template.status.isActive ? '#F97316' : '#6B7280'
                }}>
                  {template.status.isActive ? 'Active' : 'Inactive'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>


        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center">
            <Image source={icons.point} className="w-3 h-3 mr-2" tintColor="#F97316" />
            <Text className={`text-sm font-medium flex-1 ${styles.textPrimary}`} numberOfLines={1}>
              {template.route.origin.label.split(',')[0]}
            </Text>
          </View>
          <View className="mx-2 flex-row">
            <View className="w-1 h-1 rounded-full bg-gray-400 mx-0.5" />
            <View className="w-1 h-1 rounded-full bg-gray-400 mx-0.5" />
            <View className="w-1 h-1 rounded-full bg-gray-400 mx-0.5" />
          </View>
          <View className="flex-1 flex-row items-center justify-end">
            <Text className={`text-sm font-medium flex-1 text-right ${styles.textPrimary}`} numberOfLines={1}>
              {template.route.destination.label.split(',')[0]}
            </Text>
            <Image source={icons.to} className="w-3 h-3 ml-2" tintColor="#EF4444" />
          </View>
        </View>


        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text className={`text-sm font-medium ml-1 ${styles.textSecondary}`}>
              {formatTime(template.schedule.departureTime)}
            </Text>
          </View>
          <Text className={`text-sm font-semibold`} style={{ color: '#EA580C' }}>
            ${template.rideDetails.price.toFixed(2)}/seat
          </Text>
        </View>
        

        <View className="flex-row items-center mb-4">
          <Ionicons name="repeat" size={14} color="#6B7280" />
          <Text className={`text-sm font-medium ml-1 ${styles.textSecondary}`}>
            {formatRecurrencePattern(template.schedule.recurrencePattern, template.schedule.recurrenceDays)}
          </Text>
        </View>


        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text className={`ml-1 text-sm font-medium ${styles.textSecondary}`}>
              {template.rideDetails.seatsAvailable} seats
            </Text>
          </View>
          
          {template.rideDetails.fareSplittingEnabled && (
            <View className="flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }}>
              <Ionicons name="people" size={12} color="#F97316" />
              <Text className="ml-1 text-xs font-semibold" style={{ color: '#F97316' }}>
                Fare split
              </Text>
            </View>
          )}
        </View>


        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="flex-row items-center mr-4">
              <Ionicons name="calendar" size={14} color="#3B82F6" />
              <Text className="ml-1 text-sm font-semibold" style={{ color: '#3B82F6' }}>
                {template.status.upcomingRidesCount}
              </Text>
              <Text className={`ml-1 text-sm font-medium ${styles.textSecondary}`}>
                upcoming
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={14} color="#6B7280" />
              <Text className={`ml-1 text-sm font-semibold ${styles.textSecondary}`}>
                {template.status.pastRidesCount}
              </Text>
              <Text className={`ml-1 text-sm font-medium ${styles.textSecondary}`}>
                completed
              </Text>
            </View>
          </View>

          {template.schedule.activeUntil && (
            <Text className="text-xs font-medium" style={{ color: '#F59E0B' }}>
              Until {new Date(template.schedule.activeUntil).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 text-base ${styles.textSecondary} font-medium`}>
            Loading recurring rides...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>

      <View className="px-4 pt-6 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-6"
          activeOpacity={0.7}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#FFFFFF' : '#000000'} 
          />
          <Text className={`text-lg font-semibold ml-2 ${styles.textPrimary}`}>
            Back
          </Text>
        </TouchableOpacity>
        
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className={`text-2xl font-bold mb-1 ${styles.textPrimary}`}>
              Recurring Rides
            </Text>
            <Text className={`text-sm ${styles.textSecondary}`}>
              Manage your recurring ride templates
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => router.push('/(feed)/post-ride')}
            className="px-4 py-2 rounded-lg flex-row items-center"
            style={{ 
              backgroundColor: isDark ? '#FFFFFF' : '#000000',
              borderWidth: 1,
              borderColor: isDark ? '#E5E7EB' : '#374151'
            }}
            activeOpacity={0.8}
          >
            <Text className={`font-semibold text-sm ${isDark ? 'text-black' : 'text-white'}`}>
              Create New
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor={'#3B82F6'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {templates.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }}>
              <Ionicons name="repeat" size={40} color="#3B82F6" />
            </View>
            <Text className={`text-xl font-bold mb-3 ${styles.textPrimary}`}>
              No recurring rides yet
            </Text>
            <Text className={`text-base ${styles.textSecondary} text-center px-8 leading-6`}>
              Create recurring ride templates for your regular commutes to save time
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(feed)/post-ride')}
              className="mt-6 px-6 py-3 rounded-lg flex-row items-center justify-center"
              style={{ 
                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                borderWidth: 1,
                borderColor: isDark ? '#E5E7EB' : '#374151'
              }}
              activeOpacity={0.8}
            >
              <Text className={`font-semibold text-base ${isDark ? 'text-black' : 'text-white'}`}>
                Create Your First Template
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {templates
              .sort((a, b) => {
                if (a.status.isActive && !b.status.isActive) return -1;
                if (!a.status.isActive && b.status.isActive) return 1;
                return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
              })
              .map(renderTemplateCard)
            }
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}