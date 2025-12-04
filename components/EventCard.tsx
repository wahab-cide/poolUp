import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  attendeeCount: number;
  rideCount?: number;
  collegeName?: string | null;
  organizerName?: string;
}

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { isDark } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress(event);
    } else {
      router.push(`/(root)/events/${event.id}` as any);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
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

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 8,
        elevation: 4
      }}
    >
      {/* Event Name */}
      <Text style={{
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#FFFFFF' : '#000000',
        marginBottom: 8
      }} numberOfLines={2}>
        {event.name}
      </Text>

      {/* Description */}
      {event.description && (
        <Text style={{
          fontSize: 14,
          color: isDark ? '#9CA3AF' : '#6B7280',
          lineHeight: 20,
          marginBottom: 12
        }} numberOfLines={2}>
          {event.description}
        </Text>
      )}

      {/* Date & Time */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <Ionicons
          name="calendar"
          size={16}
          color={isDark ? '#9CA3AF' : '#6B7280'}
        />
        <Text style={{
          fontSize: 14,
          color: isDark ? '#9CA3AF' : '#6B7280',
          marginLeft: 8,
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
        marginBottom: 12
      }}>
        <Ionicons
          name="location"
          size={16}
          color={isDark ? '#9CA3AF' : '#6B7280'}
          style={{ marginTop: 2 }}
        />
        <Text style={{
          fontSize: 14,
          color: isDark ? '#9CA3AF' : '#6B7280',
          marginLeft: 8,
          fontWeight: '500',
          flex: 1
        }} numberOfLines={1}>
          {event.locationAddress}
        </Text>
      </View>

      {/* Footer Stats */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="people"
              size={16}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text style={{
              fontSize: 13,
              color: isDark ? '#9CA3AF' : '#6B7280',
              marginLeft: 6,
              fontWeight: '500'
            }}>
              {event.attendeeCount} going
            </Text>
          </View>

          {event.rideCount !== undefined && event.rideCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="car"
                size={16}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text style={{
                fontSize: 13,
                color: isDark ? '#9CA3AF' : '#6B7280',
                marginLeft: 6,
                fontWeight: '500'
              }}>
                {event.rideCount} rides
              </Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDark ? '#0D0D0D' : '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={isDark ? '#9e9e9e' : '#000000'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;
