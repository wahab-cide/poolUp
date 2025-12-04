import { fetchAPI } from '@/lib/fetch';
import { useAuth } from '@clerk/clerk-expo';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationHookReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  registerForPushNotifications: () => Promise<void>;
  unregisterPushNotifications: () => Promise<void>;
  sendTestNotification: (type: string) => Promise<void>;
}

export function useNotifications(): NotificationHookReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const { userId } = useAuth();

  useEffect(() => {
    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('Notification received:', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) console.log('Notification response:', response);
      handleNotificationResponse(response);
    });

    // Auto-register if user is logged in
    if (userId && !isRegistered) {
      registerForPushNotifications();
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId]);

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data;

    if (__DEV__) console.log('Handling notification tap:', data);

    // Handle different notification types with deep linking
    if (data?.type) {
      try {
        switch (data.type) {
          case 'ride_posted':
            // Navigate to home feed to see available rides
            if (__DEV__) console.log('Navigate to ride:', data.rideId);
            router.push('/(root)/(tabs)/home');
            break;

          case 'booking_request':
            // Navigate to posted ride details for driver to manage bookings
            if (__DEV__) console.log('Navigate to posted ride for booking:', data.rideId);
            if (data.rideId) {
              router.push(`/(root)/posted-ride-details?rideId=${data.rideId}`);
            } else {
              router.push('/(root)/(tabs)/rides');
            }
            break;

          case 'booking_confirmation':
          case 'booking_rejection':
          case 'booking_cancellation':
          case 'payment_confirmation':
            // Navigate to booking details page (for riders)
            if (__DEV__) console.log('Navigate to booking:', data.bookingId);
            if (data.bookingId) {
              router.push(`/(root)/booking-details?bookingId=${data.bookingId}`);
            } else {
              // Fallback to rides tab
              router.push('/(root)/(tabs)/rides');
            }
            break;

          case 'payment_confirmation_driver':
            // Navigate to posted ride details (for drivers)
            if (__DEV__) console.log('Navigate to posted ride for payment:', data.rideId);
            if (data.rideId) {
              router.push(`/(root)/posted-ride-details?rideId=${data.rideId}`);
            } else {
              router.push('/(root)/(tabs)/rides');
            }
            break;

          case 'chat_message':
            // Navigate to chat conversation
            if (__DEV__) console.log('Navigate to chat:', data.threadId);
            if (data.threadId) {
              router.push(`/(root)/chat-conversation?threadId=${data.threadId}`);
            } else {
              router.push('/(root)/(tabs)/chat');
            }
            break;

          case 'ride_completion':
          case 'ride_cancellation':
          case 'ride_reminder':
            // Navigate to booking details if we have bookingId, otherwise rides tab
            if (__DEV__) console.log('Navigate for ride event:', data.rideId);
            if (data.bookingId) {
              router.push(`/(root)/booking-details?bookingId=${data.bookingId}`);
            } else {
              router.push('/(root)/(tabs)/rides');
            }
            break;

          case 'ride_request_received':
            // Driver received a new direct ride request - navigate to Posts tab (received requests)
            if (__DEV__) console.log('Navigate to received ride request:', data.requestId);
            router.push('/(root)/(tabs)/posts');
            break;

          case 'ride_request_accepted':
            // Rider's request was accepted - navigate to Rides tab (sent requests)
            if (__DEV__) console.log('Navigate to accepted ride request:', data.requestId);
            router.push('/(root)/(tabs)/rides');
            break;

          case 'ride_request_declined':
            // Rider's request was declined - navigate to Rides tab (sent requests)
            if (__DEV__) console.log('Navigate to declined ride request:', data.requestId);
            router.push('/(root)/(tabs)/rides');
            break;

          case 'ride_request_quoted':
            // Driver sent a quote - navigate to Rides tab (sent requests) where rider can accept/decline
            if (__DEV__) console.log('Navigate to quoted ride request:', data.requestId);
            router.push('/(root)/(tabs)/rides');
            break;

          case 'quote_accepted':
            // Rider accepted driver's quote - navigate to Posts tab (received requests)
            if (__DEV__) console.log('Navigate to accepted quote:', data.requestId);
            router.push('/(root)/(tabs)/posts');
            break;

          case 'quote_declined':
            // Rider declined driver's quote - navigate to Posts tab (received requests)
            if (__DEV__) console.log('Navigate to declined quote:', data.requestId);
            router.push('/(root)/(tabs)/posts');
            break;

          case 'ride_request_cancelled':
            // Rider cancelled their request - navigate to Posts tab (received requests)
            if (__DEV__) console.log('Navigate to cancelled ride request:', data.requestId);
            router.push('/(root)/(tabs)/posts');
            break;

          default:
            if (__DEV__) console.log('Unknown notification type:', data.type);
            // Default to home page for unknown types
            router.push('/(root)/(tabs)/home');
        }
      } catch (error) {
        if (__DEV__) console.error('Error navigating from notification:', error);
        // Fallback to home page if navigation fails
        router.push('/(root)/(tabs)/home');
      }
    }
  };

  const registerForPushNotifications = async (): Promise<void> => {
    if (!userId) {
      if (__DEV__) console.log('No user logged in, skipping notification registration');
      return;
    }

    try {
      if (__DEV__) console.log('Starting push notification registration...');

      // Check if device supports notifications
      if (!Device.isDevice) {
        if (__DEV__) {
          console.log('Must use physical device for push notifications');
        }
        return;
      }

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        if (__DEV__) {
          console.log('Requesting notification permissions...');
        }
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) {
          console.log('Push notification permission denied');
        }
        return;
      }

      if (__DEV__) {
        console.log('Push notification permission granted');
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'ee92abca-ffe6-4976-9cb8-f5be6d84a5ce', //  Expo project ID
      });

      const token = tokenData.data;
      if (__DEV__) {
        console.log('Got Expo push token:', token);
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await setupAndroidNotificationChannels();
      }

      // Register token with backend
      await registerTokenWithBackend(token);

      setExpoPushToken(token);
      setIsRegistered(true);

      if (__DEV__) {
        console.log('Push notification registration completed successfully');
      }

    } catch (error) {
      if (__DEV__) {
        console.error('Error registering for push notifications:', error);
      }
      throw error;
    }
  };

  const setupAndroidNotificationChannels = async () => {
    if (__DEV__) {
      console.log('Setting up Android notification channels...');
    }

    const channels = [
      {
        id: 'rides',
        name: 'Ride Notifications',
        description: 'Notifications about rides and bookings',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrate: true,
      },
      {
        id: 'messages',
        name: 'Chat Messages',
        description: 'Messages from drivers and riders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrate: true,
      },
      {
        id: 'reminders',
        name: 'Ride Reminders',
        description: 'Reminders about upcoming rides',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrate: false,
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
    }

    if (__DEV__) {
      console.log('Android notification channels configured');
    }
  };

  const registerTokenWithBackend = async (token: string): Promise<void> => {
    try {
      if (__DEV__) {
        console.log('Registering token with backend...');
      }

      // Generate a device identifier using available device info
      const deviceName = Device.deviceName || 'Unknown Device';
      const deviceId = `${Platform.OS}-${Device.modelName || 'Unknown'}-${deviceName}`.replace(/\s+/g, '-');
      const platform = Platform.OS as 'ios' | 'android';

      const response = await fetchAPI('/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: userId,
          token,
          deviceId,
          platform,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to register token');
      }

      if (__DEV__) {
        console.log('Token registered with backend successfully');
      }

    } catch (error) {
      if (__DEV__) {
        console.error('Error registering token with backend:', error);
      }
      throw error;
    }
  };

  const unregisterPushNotifications = async (): Promise<void> => {
    if (!userId || !expoPushToken) {
      return;
    }

    try {
      if (__DEV__) {
        console.log('Unregistering push notifications...');
      }

      const response = await fetchAPI('/api/notifications/register-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: userId,
          token: expoPushToken,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to unregister token');
      }

      setExpoPushToken(null);
      setIsRegistered(false);

      if (__DEV__) {
        console.log('Push notifications unregistered successfully');
      }

    } catch (error) {
      if (__DEV__) {
        console.error('Error unregistering push notifications:', error);
      }
      throw error;
    }
  };

  const sendTestNotification = async (type: string): Promise<void> => {
    try {
      if (__DEV__) {
        console.log('Sending test notification:', type);
      }

      const response = await fetchAPI('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: userId,
          type,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send test notification');
      }

      if (__DEV__) {
        console.log('Test notification sent successfully');
      }

    } catch (error) {
      if (__DEV__) {
        console.error('Error sending test notification:', error);
      }
      throw error;
    }
  };

  return {
    expoPushToken,
    notification,
    isRegistered,
    registerForPushNotifications,
    unregisterPushNotifications,
    sendTestNotification,
  };
}

// Helper function to clear notification badge
export const clearNotificationBadge = async () => {
  await Notifications.setBadgeCountAsync(0);
};

// Helper function to cancel all local notifications
export const cancelAllLocalNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};