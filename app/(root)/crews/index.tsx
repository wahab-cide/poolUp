import React, { useCallback, useEffect, useState } from 'react';
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
import { useCrewStore } from '@/store/crewStore';
import CrewCard from '@/components/CrewCard';

const CrewsScreen = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'my-crews' | 'discover'>('my-crews');
  const [refreshing, setRefreshing] = useState(false);

  const {
    myCrews,
    publicCrews,
    isLoading,
    error,
    fetchMyCrews,
    fetchPublicCrews,
    clearError
  } = useCrewStore();

  // Fetch crews when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        if (activeTab === 'my-crews') {
          fetchMyCrews(user.id);
        } else {
          const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;
          fetchPublicCrews(collegeId as string);
        }
      }
    }, [activeTab, user?.id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      if (activeTab === 'my-crews') {
        await fetchMyCrews(user.id);
      } else {
        const collegeId = user?.publicMetadata?.college_id || user?.unsafeMetadata?.college_id;
        await fetchPublicCrews(collegeId as string);
      }
    }
    setRefreshing(false);
  };

  const handleCreateCrew = () => {
    router.push('/(root)/crews/create' as any);
  };

  const crews = activeTab === 'my-crews' ? myCrews : publicCrews;

  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingTop: 80
    }}>
      <Ionicons
        name={activeTab === 'my-crews' ? 'people-circle-outline' : 'search'}
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
        {activeTab === 'my-crews' ? 'No Crews Yet' : 'No Public Crews'}
      </Text>
      <Text style={{
        fontSize: 15,
        color: isDark ? '#9CA3AF' : '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24
      }}>
        {activeTab === 'my-crews'
          ? 'Join or create a crew to connect with riders on your regular routes'
          : 'No public crews available at the moment'}
      </Text>
      {activeTab === 'my-crews' && (
        <TouchableOpacity
          onPress={handleCreateCrew}
          style={{
            backgroundColor: isDark ? '#909090' : '#000000',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600'
          }}>
            Create Your First Crew
          </Text>
        </TouchableOpacity>
      )}
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
          Ride Crews
        </Text>

        <TouchableOpacity onPress={handleCreateCrew}>
          <Ionicons
            name="add-circle"
            size={28}
            color={isDark ? '#909090' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 12
      }}>
        <TouchableOpacity
          onPress={() => setActiveTab('my-crews')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: activeTab === 'my-crews'
              ? (isDark ? '#909090' : '#000000')
              : (isDark ? '#161616' : '#F3F4F6'),
            alignItems: 'center'
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: activeTab === 'my-crews'
              ? '#FFFFFF'
              : (isDark ? '#9CA3AF' : '#6B7280')
          }}>
            My Crews ({myCrews.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('discover')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: activeTab === 'discover'
              ? (isDark ? '#909090' : '#000000')
              : (isDark ? '#161616' : '#F3F4F6'),
            alignItems: 'center'
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: activeTab === 'discover'
              ? '#FFFFFF'
              : (isDark ? '#9CA3AF' : '#6B7280')
          }}>
            Discover
          </Text>
        </TouchableOpacity>
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

      {/* Crews List */}
      {isLoading && !refreshing ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ActivityIndicator size="large" color={isDark ? '#9e9e9e' : '#000000'} />
        </View>
      ) : (
        <FlatList
          data={crews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CrewCard crew={item} />}
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

export default CrewsScreen;
