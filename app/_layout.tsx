import { tokenCache } from "@/lib/auth";
import { ClerkProvider, useUser } from "@clerk/clerk-expo";
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { LogBox, StatusBar } from "react-native";
import 'react-native-get-random-values';
import 'react-native-reanimated';
import AnimatedSplash from '../components/AnimatedSplash';
import { NotificationProvider } from '../components/NotificationProvider';
import ThemedToast from '../components/ThemedToast';
import { NetworkProvider } from '../contexts/NetworkContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import '../global.css';
import { updateUserTimezone } from '../lib/timezone';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
  );
}

LogBox.ignoreLogs([
  "Clerk:",
  "Text strings must be rendered within a <Text> component"
]);

// StatusBar component that responds to theme changes
const ThemedStatusBar = () => {
  const { isDark } = useTheme();
  
  return (
    <StatusBar
      barStyle={isDark ? "light-content" : "dark-content"}
      backgroundColor="transparent"
      translucent
    />
  );
};

// Component to handle timezone detection after user authentication
const TimezoneHandler = () => {
  const { user } = useUser();
  
  useEffect(() => {
    if (user?.id) {
      // Update user's timezone when they first load the app
      updateUserTimezone(user.id).catch(error => {
        console.warn('Failed to update timezone on app load:', error);
      });
    }
  }, [user?.id]);
  
  return null;
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "InterBold": require("../assets/fonts/Inter-Bold.ttf"),
    "InterExtraBold": require("../assets/fonts/Inter-ExtraBold.ttf"),
    "InterExtraLight": require("../assets/fonts/Inter-ExtraLight.ttf"),
    "InterLight": require("../assets/fonts/Inter-Light.ttf"),
    "InterMedium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter": require("../assets/fonts/Inter-Regular.ttf"),
    "InterSemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Jua": require("../assets/fonts/Jua-Regular.ttf"),
  });

  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      setIsReady(true);
    }
  }, [fontsLoaded]);

  return (
    <>
      <NetworkProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
            <TimezoneHandler />
            <NotificationProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(root)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </NotificationProvider>
          </ClerkProvider>
          <ThemedToast />
        </ThemeProvider>
      </NetworkProvider>
      {showSplash && (
        <AnimatedSplash
          isReady={isReady}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </>
  );
}