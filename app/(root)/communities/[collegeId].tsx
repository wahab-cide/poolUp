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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import { fetchAPI } from '@/lib/fetch';

interface CommunityPost {
  id: string;
  content: string;
  postType: 'announcement' | 'event' | 'discussion';
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface CommunityStats {
  totalRides: number;
  activeDrivers: number;
  co2Saved: number;
  mostPopularRoute: string | null;
}

const CommunityScreen = () => {
  const { collegeId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { user } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [collegeName, setCollegeName] = useState<string>('Campus');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (collegeId) {
        fetchCommunityData();
      }
    }, [collegeId])
  );

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch community posts
      const postsData = await fetchAPI(`/api/communities/${collegeId}`);
      if (postsData.success) {
        setPosts(postsData.posts || []);
        setCollegeName(postsData.collegeName || 'Campus');
      }

      // Fetch community stats
      const statsData = await fetchAPI(`/api/communities/${collegeId}/stats`);
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      if (__DEV__) console.error('Error fetching community data:', err);
      setError('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCommunityData();
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'megaphone';
      case 'event':
        return 'calendar';
      case 'discussion':
        return 'chatbubbles';
      default:
        return 'document-text';
    }
  };

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={{
      backgroundColor: isDark ? '#161616' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDark ? '#0D0D0D' : '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10
        }}>
          <Ionicons
            name={getPostIcon(item.postType)}
            size={16}
            color={isDark ? '#9e9e9e' : '#000000'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#000000'
          }}>
            {item.user.name}
          </Text>
          <Text style={{
            fontSize: 12,
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={{
        fontSize: 15,
        color: isDark ? '#E5E7EB' : '#1F2937',
        lineHeight: 22
      }}>
        {item.content}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <>
      {/* Stats Cards */}
      {stats && (
        <View style={{
          paddingHorizontal: 16,
          marginBottom: 16
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#000000',
            marginBottom: 12
          }}>
            This Week
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12
          }}>
            {/* Total Rides */}
            <View style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
              borderRadius: 12,
              padding: 16
            }}>
              <Ionicons
                name="car"
                size={24}
                color={isDark ? '#9e9e9e' : '#000000'}
                style={{ marginBottom: 8 }}
              />
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 4
              }}>
                {stats.totalRides}
              </Text>
              <Text style={{
                fontSize: 13,
                color: isDark ? '#9CA3AF' : '#6B7280'
              }}>
                Total Rides
              </Text>
            </View>

            {/* Active Drivers */}
            <View style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
              borderRadius: 12,
              padding: 16
            }}>
              <Ionicons
                name="people"
                size={24}
                color={isDark ? '#9e9e9e' : '#000000'}
                style={{ marginBottom: 8 }}
              />
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 4
              }}>
                {stats.activeDrivers}
              </Text>
              <Text style={{
                fontSize: 13,
                color: isDark ? '#9CA3AF' : '#6B7280'
              }}>
                Active Drivers
              </Text>
            </View>

            {/* CO2 Saved */}
            <View style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
              borderRadius: 12,
              padding: 16
            }}>
              <Ionicons
                name="leaf"
                size={24}
                color={isDark ? '#10B981' : '#059669'}
                style={{ marginBottom: 8 }}
              />
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 4
              }}>
                {stats.co2Saved}
              </Text>
              <Text style={{
                fontSize: 13,
                color: isDark ? '#9CA3AF' : '#6B7280'
              }}>
                lbs CO₂ Saved
              </Text>
            </View>

            {/* Popular Route */}
            {stats.mostPopularRoute && (
              <View style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: isDark ? '#161616' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB',
                borderRadius: 12,
                padding: 16
              }}>
                <Ionicons
                  name="trending-up"
                  size={24}
                  color={isDark ? '#9e9e9e' : '#000000'}
                  style={{ marginBottom: 8 }}
                />
                <Text style={{
                  fontSize: 13,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  marginBottom: 4
                }}>
                  Popular Route
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#000000'
                }} numberOfLines={2}>
                  {stats.mostPopularRoute}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Posts Header */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12, marginTop: 8 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: isDark ? '#FFFFFF' : '#000000'
        }}>
          Community Feed
        </Text>
      </View>
    </>
  );

  const renderEmptyState = () => (
    <View style={{
      alignItems: 'center',
      paddingTop: 40,
      paddingHorizontal: 32
    }}>
      <Ionicons
        name="chatbubbles-outline"
        size={80}
        color={isDark ? '#4B5563' : '#9CA3AF'}
      />
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: isDark ? '#FFFFFF' : '#000000',
        marginTop: 16,
        textAlign: 'center'
      }}>
        No Community Posts Yet
      </Text>
      <Text style={{
        fontSize: 14,
        color: isDark ? '#9CA3AF' : '#6B7280',
        marginTop: 8,
        textAlign: 'center'
      }}>
        Be the first to share with your campus community
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
          {collegeName}
        </Text>

        <View style={{ width: 24 }} />
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

      {loading ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ActivityIndicator size="large" color={isDark ? '#9e9e9e' : '#000000'} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            paddingBottom: 100,
            flexGrow: 1
          }}
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

export default CommunityScreen;
