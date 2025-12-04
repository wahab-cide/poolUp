import { useTheme } from '@/contexts/ThemeContext';
import { UnreadCountProvider, useUnreadCount } from '@/contexts/UnreadCountContext';
import { useUser } from '@clerk/clerk-expo';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from "react-native";
import * as Haptics from 'expo-haptics';

const TabIcon = ({ name, focused, unreadCount }: { name: string; focused: boolean; unreadCount?: number }) => {
  const { isDark } = useTheme();
  let icon;
  let color = focused
    ? "#9e9e9e"
    : (isDark ? "#888787" : "#222");
  switch (name) {
    case "home":
      icon = <MaterialIcons name="home" size={28} color={color} />;
      break;
    case "rides":
      icon = <FontAwesome5 name="calendar-alt" size={24} color={color} />;
      break;
    case "posts":
      icon = <Feather name="plus-circle" size={26} color={color} />;
      break;
    case "chat":
      icon = <MaterialIcons name="chat-bubble-outline" size={26} color={color} />;
      break;
    case "profile":
      icon = <Feather name="user" size={26} color={color} />;
      break;
    default:
      icon = <Feather name="circle" size={28} color={color} />;
  }
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {icon}
      {name === 'chat' && unreadCount && unreadCount > 0 && (
        <View style={{
          position: 'absolute',
          top: -5,
          right: -8,
          backgroundColor: '#FF3B30',
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: isDark ? '#000000' : '#FFFFFF'
        }}>
          <Text style={{
            color: 'white',
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {unreadCount > 99 ? '99+' : String(unreadCount)}
          </Text>
        </View>
      )}
    </View>
  );
};

const TabsContent = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const { refreshTrigger } = useUnreadCount();
  const [isDriver, setIsDriver] = useState(false);
  
  // Update isDriver state when user metadata changes
  useEffect(() => {
    const driverStatus = 
      user?.publicMetadata?.is_driver === true || 
      user?.unsafeMetadata?.is_driver === true;
    setIsDriver(driverStatus);
  }, [user?.publicMetadata?.is_driver, user?.unsafeMetadata?.is_driver]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { fetchAPI } = await import('@/lib/fetch');
      const data = await fetchAPI(`/api/chat/unread-count?clerkId=${user.id}`);
      
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching unread count:', error);
    }
  }, [user?.id]);

  // Fetch unread count when component mounts and when user changes
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Refetch when refresh trigger changes (from context)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchUnreadCount();
    }
  }, [refreshTrigger, fetchUnreadCount]);

  // Refetch when the tab navigator comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: "#9e9e9e",
        tabBarInactiveTintColor: isDark ? "#888787" : "#222222",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          color: isDark ? "#FFFFFF" : "#111",
          fontFamily: "Inter",
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: isDark 
            ? "rgba(13, 13, 13, 0.95)" 
            : "rgba(255, 255, 255, 0.85)",
          borderTopWidth: isDark ? 1 : 0,
          borderTopColor: isDark ? "rgba(255, 255, 255, 0.1)" : undefined,
          paddingTop: 5,
          paddingBottom: 25,
          height: 95,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: "Posts",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="posts" focused={focused} />,
          href: isDriver ? undefined : null, // Show in tab bar only for drivers
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "Rides",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="rides" focused={focused} />,
          href: !isDriver ? undefined : null, // Show in tab bar only for non-drivers
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} unreadCount={unreadCount} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
      />
    </Tabs>
  );
};

export default function Layout() {
  return (
    <UnreadCountProvider>
      <TabsContent />
    </UnreadCountProvider>
  );
}