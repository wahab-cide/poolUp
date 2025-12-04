import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import EventCard, { Event } from '@/components/EventCard';

const EventsScreen = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [user?.id])
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;

      const params = new URLSearchParams({
        limit: '20',
        ...(collegeId && { college_id: collegeId as string })
      });

      const data = await fetchAPI(`/api/events?${params.toString()}`);

      if (data.success) {
        setEvents(data.events || []);
      } else {
        setError(data.message || 'Failed to load events');
      }
    } catch (err) {
      if (__DEV__) console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingTop: 80
    }}>
      <Ionicons
        name="calendar-outline"
        size={80}
        color={isDark ? '#4B5563' : '#9CA3AF'}
      />
      <Text style={{
        fontSize: 20,
        fontWeight: '700',
        color: isDark ? '#FFFFFF' : '#000000',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center'
      }}>
        No Upcoming Events
      </Text>
      <Text style={{
        fontSize: 15,
        color: isDark ? '#9CA3AF' : '#6B7280',
        textAlign: 'center',
        lineHeight: 22
      }}>
        Check back later for event carpools to concerts, games, and more
      </Text>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${styles.background}`} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000'
        }}>
          Event Carpools
        </Text>

        <TouchableOpacity onPress={() => router.push('/(root)/events/create' as any)}>
          <Ionicons
            name="add-circle"
            size={28}
            color={isDark ? '#909090' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={{
        paddingHorizontal: 16,
        paddingBottom: 16
      }}>
        <Text style={{
          fontSize: 14,
          color: isDark ? '#9CA3AF' : '#6B7280',
          lineHeight: 20
        }}>
          Share rides to concerts, games, and campus events
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={{
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 12,
          backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
          borderRadius: 8
        }}>
          <Text style={{
            color: isDark ? '#FCA5A5' : '#DC2626',
            fontSize: 14
          }}>
            {error}
          </Text>
        </View>
      )}

      {/* Events List */}
      {loading && !refreshing ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ActivityIndicator size="large" color={isDark ? '#9e9e9e' : '#000000'} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{
            paddingBottom: 100,
            flexGrow: 1
          }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#9e9e9e' : '#000000'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default EventsScreen;
