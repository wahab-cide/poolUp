import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';
import RideCard from '@/components/RideCard';
import { RideData } from '@/store';

interface EventDetails {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  attendeeCount: number;
  collegeName?: string | null;
  organizerName?: string;
}

const EventDetailsScreen = () => {
  const { eventId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { user } = useUser();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [rides, setRides] = useState<RideData[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchEventRides();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const params = user?.id ? `?user_id=${user.id}` : '';
      const data = await fetchAPI(`/api/events/${eventId}${params}`);

      if (data.success) {
        setEvent(data.event);
        setIsAttending(data.isAttending || false);
      } else {
        setError(data.message || 'Failed to load event');
      }
    } catch (err) {
      if (__DEV__) console.error('Error fetching event details:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRides = async () => {
    try {
      const data = await fetchAPI(`/api/events/${eventId}/rides`);

      if (data.success) {
        setRides(data.rides || []);
      }
    } catch (err) {
      if (__DEV__) console.error('Error fetching event rides:', err);
    }
  };

  const handleAttendToggle = async () => {
    if (!user?.id || !eventId) return;

    try {
      const data = await fetchAPI(`/api/events/${eventId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (data.success) {
        setIsAttending(!isAttending);
        setEvent(prev => prev ? { ...prev, attendeeCount: prev.attendeeCount + (isAttending ? -1 : 1) } : null);
      }
    } catch (err) {
      if (__DEV__) console.error('Error toggling attendance:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return null;
    }
  };

  if (loading || !event) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={isDark ? '#9e9e9e' : '#000000'} />
        </View>
      </SafeAreaView>
    );
  }

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
          fontSize: 18,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000'
        }}>
          Event Details
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Event Info Card */}
        <View style={{
          backgroundColor: isDark ? '#161616' : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 16,
          borderRadius: 16,
          padding: 20
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#000000',
            marginBottom: 12
          }}>
            {event.name}
          </Text>

          {event.description && (
            <Text style={{
              fontSize: 15,
              color: isDark ? '#9CA3AF' : '#6B7280',
              lineHeight: 22,
              marginBottom: 16
            }}>
              {event.description}
            </Text>
          )}

          {/* Date & Time */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <Ionicons
              name="calendar"
              size={20}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text style={{
              fontSize: 15,
              color: isDark ? '#FFFFFF' : '#000000',
              marginLeft: 12,
              fontWeight: '500'
            }}>
              {formatDate(event.eventDate)}
              {event.eventTime && ` at ${formatTime(event.eventTime)}`}
            </Text>
          </View>

          {/* Location */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 16
          }}>
            <Ionicons
              name="location"
              size={20}
              color={isDark ? '#9CA3AF' : '#6B7280'}
              style={{ marginTop: 2 }}
            />
            <Text style={{
              fontSize: 15,
              color: isDark ? '#FFFFFF' : '#000000',
              marginLeft: 12,
              fontWeight: '500',
              flex: 1
            }}>
              {event.locationAddress}
            </Text>
          </View>

          {/* Attendees */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons
              name="people"
              size={20}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text style={{
              fontSize: 15,
              color: isDark ? '#9CA3AF' : '#6B7280',
              marginLeft: 12,
              fontWeight: '500'
            }}>
              {event.attendeeCount} people interested
            </Text>
          </View>
        </View>

        {/* RSVP Button */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleAttendToggle}
            style={{
              backgroundColor: isAttending
                ? (isDark ? '#0D0D0D' : '#F3F4F6')
                : (isDark ? '#909090' : '#000000'),
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: isAttending ? 1 : 0,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#D1D5DB'
            }}
          >
            <Text style={{
              color: isAttending
                ? (isDark ? '#FFFFFF' : '#000000')
                : '#FFFFFF',
              fontSize: 16,
              fontWeight: '600'
            }}>
              {isAttending ? 'Interested ✓' : 'I\'m Interested'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Rides */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#000000',
            marginBottom: 12
          }}>
            Available Rides ({rides.length})
          </Text>

          {rides.length === 0 ? (
            <View style={{
              backgroundColor: isDark ? '#161616' : '#F9FAFB',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center'
            }}>
              <Ionicons
                name="car-outline"
                size={48}
                color={isDark ? '#4B5563' : '#9CA3AF'}
              />
              <Text style={{
                fontSize: 15,
                color: isDark ? '#9CA3AF' : '#6B7280',
                marginTop: 12,
                textAlign: 'center'
              }}>
                No rides available yet. Be the first to post a ride!
              </Text>
            </View>
          ) : (
            rides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                variant="feed"
                onPress={() => router.push(`/(feed)/ride/${ride.id}` as any)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventDetailsScreen;
