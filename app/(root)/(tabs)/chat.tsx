import { useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchAPI } from '@/lib/fetch';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';
import SkeletonChatThread from '@/components/SkeletonChatThread';

interface ChatThread {
  id: string;
  booking_id: string;
  ride_id: string;
  rider_id: string;
  driver_id: string;
  status: string;
  last_message_at: string;
  origin_label: string;
  destination_label: string;
  departure_time: string;
  rider_name: string;
  rider_first_name: string;
  rider_last_name: string;
  rider_avatar: string;
  driver_name: string;
  driver_first_name: string;
  driver_last_name: string;
  driver_avatar: string;
  unread_count?: number;
  last_message?: string;
}

const Chat = () => {
    const { user } = useUser();
    const router = useRouter();
    const { isDark } = useTheme();
    const styles = useThemeStyles();
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    useEffect(() => {
        if (user) {
            fetchChatThreads();
        }
    }, [user, fetchChatThreads]);

    const fetchChatThreads = useCallback(async (isRefreshing = false) => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }
            const response = await fetchAPI(`/api/chat/threads?clerkId=${user?.id}`);
            if (response.success) {
                setThreads(response.threads || []);
                setCurrentUserId(response.currentUserId);
            }
        } catch (error) {
            if (__DEV__) console.error('Error fetching chat threads:', error);
        } finally {
            if (isRefreshing) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, [user?.id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchChatThreads(true);
    }, [fetchChatThreads]);

    const handleThreadPress = (thread: ChatThread) => {
        router.push(`/(root)/chat-conversation?threadId=${thread.id}&bookingId=${thread.booking_id}`);
    };

    useFocusEffect(
        useCallback(() => {
            // Refresh threads when returning to chat tab (but not during manual refresh)
            if (user && !refreshing) {
                fetchChatThreads(false);
            }
        }, [user, refreshing, fetchChatThreads])
    );

    const formatLastMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) {
            return 'Now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 24 * 60) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInMinutes / (24 * 60));
            if (days === 1) return 'Yesterday';
            return `${days}d ago`;
        }
    };

    const formatLastMessage = (message: string | null | undefined) => {
        if (!message || message === null || message === undefined) {
            return 'No messages yet';
        }
        
        // Ensure message is a string
        const messageStr = String(message);
        
        // Trim whitespace and handle long messages for compact display
        const trimmed = messageStr.trim();
        if (trimmed.length === 0) {
            return 'No messages yet';
        }
        
        if (trimmed.length > 80) {
            return trimmed.substring(0, 80) + '...';
        }
        return trimmed;
    };

    const getUserInitial = (firstName?: string, lastName?: string, fullName?: string) => {
        if (firstName) {
            return firstName.charAt(0).toUpperCase();
        }
        if (fullName) {
            return fullName.charAt(0).toUpperCase();
        }
        return '?';
    };

    const UserAvatar = ({ firstName, lastName, name, avatar }: { firstName?: string; lastName?: string; name?: string; avatar?: string }) => {
        const [imageError, setImageError] = useState(false);
        
        if (avatar && !imageError) {
            return (
                <Image
                    source={{ uri: avatar }}
                    className="w-14 h-14 rounded-full mr-4"
                    onError={() => setImageError(true)}
                />
            );
        }
        
        return (
            <View className={`w-14 h-14 rounded-full mr-4 items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-800'}`}>
                <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-white'}`}>
                    {getUserInitial(firstName, lastName, name)}
                </Text>
            </View>
        );
    };

    const renderThread = ({ item }: { item: ChatThread }) => {
        const isRider = String(item.rider_id) === String(currentUserId);
        const otherUser = isRider ? 
            { 
                name: item.driver_name || 'Driver',
                firstName: item.driver_first_name,
                lastName: item.driver_last_name,
                avatar: item.driver_avatar 
            } : 
            { 
                name: item.rider_name || 'Rider',
                firstName: item.rider_first_name,
                lastName: item.rider_last_name,
                avatar: item.rider_avatar 
            };

        return (
            <TouchableOpacity
                onPress={() => handleThreadPress(item)}
                className={`${styles.card} mx-3 mb-2 rounded-2xl p-4 shadow-lg border ${styles.border}`}
                activeOpacity={0.7}
                style={{
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                }}
            >
                <View className="flex-row items-center">
                    <UserAvatar firstName={otherUser.firstName} lastName={otherUser.lastName} name={otherUser.name} avatar={otherUser.avatar} />
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {otherUser.firstName && otherUser.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.firstName || otherUser.name || 'Unknown'}
                            </Text>
                            <View className="flex-row items-center">
                                {item.last_message_at && (
                                    <Text className={`text-sm font-medium mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {formatLastMessageTime(item.last_message_at)}
                                    </Text>
                                )}
                                {item.unread_count && Number(item.unread_count) > 0 && (
                                    <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
                                        <Text className="text-white text-xs font-bold">
                                            {Number(item.unread_count) > 9 ? '9+' : item.unread_count.toString()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        
                        <Text 
                            className={`text-sm ${item.unread_count && Number(item.unread_count) > 0 ? (isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold') : (isDark ? 'text-gray-300' : 'text-gray-600')}`} 
                            numberOfLines={2}
                        >
                            {formatLastMessage(item.last_message)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className={`flex-1 ${styles.background}`}>
                <View className="px-6 pt-8 pb-2">
                    <Text className={`text-4xl font-extrabold ${styles.textPrimary}`}>Messages</Text>
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
                >
                    <SkeletonChatThread />
                    <SkeletonChatThread />
                    <SkeletonChatThread />
                    <SkeletonChatThread />
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className={`flex-1 ${styles.background}`}>
            <View className="px-6 pt-8 pb-2">
                <Text className={`text-4xl font-extrabold ${styles.textPrimary}`}>Messages</Text>
            </View>
            
            {threads.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="rounded-full p-6 mb-6" style={{ backgroundColor: isDark ? '#161616' : '#F3F4F6' }}>
                        <MaterialIcons name="chat-bubble-outline" size={56} color={isDark ? '#6B7280' : '#9CA3AF'} />
                    </View>
                    <Text className="text-2xl font-bold mb-3" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                        No messages yet
                    </Text>
                    <Text className="text-base text-center leading-6" style={{ color: isDark ? '#9CA3AF' : '#6B7280', maxWidth: 300 }}>
                        Messages from your rides will appear here
                    </Text>
                </View>
            ) : threads.length > 0 ? (
                <FlatList
                    data={threads}
                    renderItem={renderThread}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3B82F6']}
                            tintColor="#3B82F6"
                            title="Pull to refresh"
                            titleColor="#3B82F6"
                        />
                    }
                />
            ) : null}
        </SafeAreaView>
    );
};

export default Chat;