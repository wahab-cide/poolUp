import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export interface Crew {
  id: string;
  name: string;
  description: string | null;
  routeOrigin: string;
  routeDestination: string;
  memberCount: number;
  isPublic: boolean;
  collegeName?: string | null;
  createdBy: string;
}

interface CrewCardProps {
  crew: Crew;
  onPress?: (crew: Crew) => void;
}

const CrewCard: React.FC<CrewCardProps> = ({ crew, onPress }) => {
  const { isDark } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress(crew);
    } else {
      router.push(`/(root)/crews/${crew.id}` as any);
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
      {/* Crew Name */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000',
          marginBottom: 4
        }}>
          {crew.name}
        </Text>
        {crew.description && (
          <Text style={{
            fontSize: 14,
            color: isDark ? '#9CA3AF' : '#6B7280',
            lineHeight: 20
          }} numberOfLines={2}>
            {crew.description}
          </Text>
        )}
      </View>

      {/* Route */}
      <View style={{
        backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{
            width: 8,
            height: 8,
            backgroundColor: isDark ? '#FFFFFF' : '#000000',
            marginRight: 10
          }} />
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#000000',
            flex: 1
          }} numberOfLines={1}>
            {crew.routeOrigin}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 8,
            height: 12,
            borderWidth: 2,
            borderColor: isDark ? '#FFFFFF' : '#000000',
            backgroundColor: 'transparent',
            marginRight: 10
          }} />
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#000000',
            flex: 1
          }} numberOfLines={1}>
            {crew.routeDestination}
          </Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16
          }}>
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
              {crew.memberCount} {crew.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>

          {!crew.isPublic && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons
                name="lock-closed"
                size={14}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text style={{
                fontSize: 13,
                color: isDark ? '#9CA3AF' : '#6B7280',
                marginLeft: 4,
                fontWeight: '500'
              }}>
                Private
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

export default CrewCard;
