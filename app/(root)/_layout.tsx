import { Stack } from "expo-router";
import { UnreadCountProvider } from '@/contexts/UnreadCountContext';

const Layout = () => {
  return (
    <UnreadCountProvider>
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="confirm-ride"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="book-ride"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="booking-details"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="posted-ride-details"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat-conversation"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </UnreadCountProvider>
  );
};

export default Layout;