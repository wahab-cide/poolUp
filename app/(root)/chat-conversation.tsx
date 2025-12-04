import { useUser } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchAPI } from '@/lib/fetch';
import { formatUserName } from '@/lib/utils';
import { useUnreadCount } from '@/contexts/UnreadCountContext';
import { useTheme, useThemeStyles } from '@/contexts/ThemeContext';

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
}

interface ChatThread {
  id: string;
  booking_id: string;
  ride_id: string;
  rider_id: string;
  driver_id: string;
  origin_label: string;
  destination_label: string;
  departure_time: string;
  rider_name: string;
  rider_avatar: string;
  driver_name: string;
  driver_avatar: string;
}

const ChatConversation = () => {
  const { user } = useUser();
  const router = useRouter();
  const { threadId, bookingId } = useLocalSearchParams<{ threadId: string; bookingId: string }>();
  const { refreshUnreadCount } = useUnreadCount();
  const { isDark } = useTheme();
  const theme = useThemeStyles();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (threadId || bookingId) {
      initializeChat();
    }
  }, [threadId, bookingId]);

  // Refresh unread count when leaving the conversation
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when the screen loses focus (user navigates away)
        refreshUnreadCount();
      };
    }, [refreshUnreadCount])
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      // Auto-scroll to bottom when keyboard appears
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const initializeChat = useCallback(async () => {
    try {
      let threadResponse;
      
      if (threadId) {
        // Coming from notification with threadId
        threadResponse = await fetchAPI(`/api/chat/thread-by-id/${threadId}?clerkId=${user?.id}`);
      } else if (bookingId) {
        // Coming from booking page with bookingId (get or create thread)
        threadResponse = await fetchAPI(`/api/chat/thread/${bookingId}?clerkId=${user?.id}`);
      } else {
        Alert.alert('Error', 'No thread or booking ID provided');
        router.back();
        return;
      }
      
      if (threadResponse.success) {
        setThread(threadResponse.thread);
        setCurrentUserId(threadResponse.currentUserId);
        
        // Set current user's avatar from thread data
        const isRider = String(threadResponse.currentUserId) === String(threadResponse.thread.rider_id);
        setCurrentUserAvatar(isRider ? threadResponse.thread.rider_avatar : threadResponse.thread.driver_avatar);
        
        // Get messages for the thread
        const messagesResponse = await fetchAPI(`/api/chat/messages/${threadResponse.thread.id}?clerkId=${user?.id}`);
        
        if (messagesResponse.success) {
          setMessages(messagesResponse.messages || []);
          console.log('Fetched messages:', messagesResponse.messages?.map((m: Message) => ({
            sender_name: m.sender_name,
            sender_avatar: m.sender_avatar,
            sender_id: m.sender_id
          })));
          
          // Mark messages as read when opening conversation
          try {
            await fetchAPI('/api/chat/messages/mark-read', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clerkId: user?.id,
                threadId: threadResponse.thread.id
              })
            });
            
            // Refresh unread count after marking messages as read
            refreshUnreadCount();
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        }
      } else {
        Alert.alert('Error', threadResponse.error || 'Failed to load chat');
        router.back();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to load chat');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [threadId, bookingId, user?.id, router, refreshUnreadCount]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    
    setSending(true);
    const messageContent = inputText.trim();
    setInputText('');
    
    try {
      const response = await fetchAPI(`/api/chat/messages/${thread?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user?.id,
          content: messageContent,
          messageType: 'text'
        })
      });
      
      if (response.success) {
        // Add message to local state
        const newMessage: Message = {
          id: response.message.id,
          thread_id: response.message.thread_id,
          sender_id: response.message.sender_id,
          content: response.message.content,
          message_type: response.message.message_type,
          created_at: response.message.created_at,
          sender_name: formatUserName(user, 'full') || 'You',
          sender_avatar: currentUserAvatar || user?.imageUrl || ''
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', response.error || 'Failed to send message');
        setInputText(messageContent); // Restore message text
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageContent); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message: Message) => {
    return String(message.sender_id) === String(currentUserId);
  };

  const getOtherUser = () => {
    if (!thread) return null;
    
    const isRider = String(thread.rider_id) === String(currentUserId);
    
    return isRider ? 
      { name: thread.driver_name, avatar: thread.driver_avatar } : 
      { name: thread.rider_name, avatar: thread.rider_avatar };
  };

  const getUserInitial = (name?: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = isMyMessage(item);
    
    return (
      <View className="px-4 mb-4">
        <View className={`flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
          {!isMine && (
            item.sender_avatar ? (
              <Image
                source={{ uri: item.sender_avatar }}
                className="w-8 h-8 rounded-full mr-3 mt-1"
                onError={(e) => console.log('Avatar load error for sender:', item.sender_name, 'URL:', item.sender_avatar)}
              />
            ) : (
              <View className={`w-8 h-8 rounded-full mr-3 mt-1 items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-800'}`}>
                <Text className="text-white text-sm font-bold">
                  {getUserInitial(item.sender_name)}
                </Text>
              </View>
            )
          )}
          
          <View 
            className={`${isMine ? 'items-end' : 'items-start'}`}
            style={{ 
              maxWidth: isMine ? '70%' : '75%',
              flex: 0
            }}
          >
            <View
              className={`px-4 py-3 rounded-2xl ${
                isMine 
                  ? 'bg-blue-500 rounded-tr-sm' 
                  : (isDark ? 'bg-gray-700 rounded-tl-sm' : 'bg-gray-200 rounded-tl-sm')
              }`}
            >
              <Text 
                className={`text-base leading-5 ${isMine ? 'text-white' : (isDark ? 'text-gray-100' : 'text-gray-800')}`}
                style={{ flexWrap: 'wrap' }}
              >
                {item.content}
              </Text>
            </View>
            
            <Text className={`text-xs mt-1 mx-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
          
          {isMine && (
            item.sender_avatar ? (
              <Image
                source={{ uri: item.sender_avatar }}
                className="w-8 h-8 rounded-full ml-3 mt-1"
                onError={(e) => console.log('Avatar load error for current user:', item.sender_name, 'URL:', item.sender_avatar)}
              />
            ) : (
              <View className={`w-8 h-8 rounded-full ml-3 mt-1 items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-800'}`}>
                <Text className="text-white text-sm font-bold">
                  {getUserInitial(item.sender_name)}
                </Text>
              </View>
            )
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.background}`}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.activityIndicator.primary} />
          <Text className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const otherUser = getOtherUser();

  return (
    <SafeAreaView className={`flex-1 ${theme.background}`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={Platform.OS === 'ios'}
      >
        {/* Header */}
        <View className={`px-4 py-4 border-b ${theme.card} ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mr-3"
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#222'} />
            </TouchableOpacity>
            
            {otherUser?.avatar ? (
              <Image
                source={{ uri: otherUser.avatar }}
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <View className={`w-10 h-10 rounded-full mr-3 items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-800'}`}>
                <Text className="text-white text-base font-bold">
                  {getUserInitial(otherUser?.name)}
                </Text>
              </View>
            )}
            
            <View className="flex-1">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatUserName(otherUser, 'full')}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(thread?.departure_time || '').toLocaleDateString()} at {new Date(thread?.departure_time || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          
          {/* Route Information */}
          <View 
            className={`rounded-md px-2.5 py-1.5 ml-13 mr-2 mt-1.5 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-100'}`}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 0.5 },
              shadowOpacity: 0.02,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {/* Origin */}
            <View className="flex-row items-center mb-1">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <Text className={`text-xs font-medium flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`} numberOfLines={1}>
                {thread?.origin_label}
              </Text>
            </View>
            
            {/* Connector Line */}
            <View className={`w-0.5 mb-1 ${isDark ? 'bg-gray-500' : 'bg-gray-300'}`} style={{ height: 10, marginLeft: 3 }} />
            
            {/* Destination */}
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
              <Text className={`text-xs font-medium flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`} numberOfLines={1}>
                {thread?.destination_label}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className={`flex-1 px-4 ${theme.background}`}
          contentContainerStyle={{ 
            paddingVertical: 20,
            paddingBottom: Platform.OS === 'android' ? 100 : 20
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        />

        {/* Message Input */}
        <View 
          className={`px-4 py-3 border-t ${theme.card} ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ 
            marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
            position: Platform.OS === 'android' ? 'absolute' : 'relative',
            bottom: Platform.OS === 'android' ? 0 : 'auto',
            left: Platform.OS === 'android' ? 0 : 'auto',
            right: Platform.OS === 'android' ? 0 : 'auto'
          }}
        >
          <View className="flex-row items-center">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              multiline
              className={`flex-1 rounded-full px-4 py-3 mr-3 max-h-24 text-base ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              style={{ textAlignVertical: 'top' }}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
            
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() && !sending ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.activityIndicator.white} />
              ) : (
                <Feather 
                  name="send" 
                  size={20} 
                  color={inputText.trim() && !sending ? 'white' : 'gray'} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatConversation;