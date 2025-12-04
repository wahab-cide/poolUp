import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { useCrewStore } from '@/store/crewStore';
import { getUserInitials } from '@/lib/utils';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

const CrewDetailsScreen = () => {
  const { crewId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { user } = useUser();
  const [actionLoading, setActionLoading] = useState(false);

  const {
    selectedCrew,
    crewMembers,
    isLoading,
    error,
    fetchCrewDetails,
    joinCrew,
    leaveCrew,
    clearSelectedCrew
  } = useCrewStore();

  useEffect(() => {
    if (crewId) {
      fetchCrewDetails(crewId as string);
    }

    return () => {
      clearSelectedCrew();
    };
  }, [crewId]);

  const handleJoinCrew = async () => {
    if (!user?.id || !crewId) return;

    setActionLoading(true);
    const success = await joinCrew(crewId as string, user.id);
    setActionLoading(false);

    if (success) {
      showSuccessToast('Successfully joined the crew!', 'Welcome');
    } else {
      showErrorToast('Failed to join crew', 'Error');
    }
  };

  const handleLeaveCrew = async () => {
    if (!user?.id || !crewId) return;

    Alert.alert(
      'Leave Crew',
      'Are you sure you want to leave this crew?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const success = await leaveCrew(crewId as string, user.id);
            setActionLoading(false);

            if (success) {
              showSuccessToast('Left the crew', 'Success');
              router.back();
            } else {
              showErrorToast('Failed to leave crew', 'Error');
            }
          }
        }
      ]
    );
  };

  if (isLoading || !selectedCrew) {
    return (
      <SafeAreaView className={`flex-1 ${styles.background}`}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={isDark ? '#9e9e9e' : '#000000'} />
        </View>
      </SafeAreaView>
    );
  }

  const isMember = selectedCrew.isMember || false;
  const isAdmin = selectedCrew.isAdmin || false;

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
          Crew Details
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Crew Info Card */}
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
          {/* Crew Name */}
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#000000',
            marginBottom: 8
          }}>
            {selectedCrew.name}
          </Text>

          {/* Description */}
          {selectedCrew.description && (
            <Text style={{
              fontSize: 15,
              color: isDark ? '#9CA3AF' : '#6B7280',
              lineHeight: 22,
              marginBottom: 16
            }}>
              {selectedCrew.description}
            </Text>
          )}

          {/* Route */}
          <View style={{
            backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: isDark ? '#9CA3AF' : '#6B7280',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Route
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 10,
                height: 10,
                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                marginRight: 12
              }} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                flex: 1
              }}>
                {selectedCrew.routeOrigin}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 10,
                height: 14,
                borderWidth: 2,
                borderColor: isDark ? '#FFFFFF' : '#000000',
                backgroundColor: 'transparent',
                marginRight: 12
              }} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                flex: 1
              }}>
                {selectedCrew.routeDestination}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="people"
                size={18}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text style={{
                fontSize: 14,
                color: isDark ? '#9CA3AF' : '#6B7280',
                marginLeft: 6,
                fontWeight: '500'
              }}>
                {selectedCrew.memberCount} members
              </Text>
            </View>

            {!selectedCrew.isPublic && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text style={{
                  fontSize: 14,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  marginLeft: 6,
                  fontWeight: '500'
                }}>
                  Private
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Members Section */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#000000',
            marginBottom: 12
          }}>
            Members ({crewMembers.length})
          </Text>

          {crewMembers.map((member) => (
            <View
              key={member.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#161616' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8
              }}
            >
              {/* Avatar */}
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? '#333' : '#909090',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                overflow: 'hidden'
              }}>
                {member.userAvatar ? (
                  <Image
                    source={{ uri: member.userAvatar }}
                    style={{ width: 44, height: 44 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    {getUserInitials(member.userName, '', '')}
                  </Text>
                )}
              </View>

              {/* Name and Role */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#000000'
                }}>
                  {member.userName}
                </Text>
                {member.role === 'admin' && (
                  <Text style={{
                    fontSize: 13,
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    marginTop: 2
                  }}>
                    Admin
                  </Text>
                )}
              </View>

              {member.role === 'admin' && (
                <MaterialIcons
                  name="verified"
                  size={20}
                  color="#f44336"
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 32
      }}>
        {isMember ? (
          <TouchableOpacity
            onPress={handleLeaveCrew}
            disabled={actionLoading}
            style={{
              backgroundColor: isDark ? '#7F1D1D' : '#DC2626',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              opacity: actionLoading ? 0.6 : 1
            }}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Leave Crew
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleJoinCrew}
            disabled={actionLoading}
            style={{
              backgroundColor: isDark ? '#909090' : '#000000',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              opacity: actionLoading ? 0.6 : 1
            }}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Join Crew
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CrewDetailsScreen;
