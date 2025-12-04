import { Stack } from 'expo-router';
import { UnreadCountProvider } from '@/contexts/UnreadCountContext';

export default function FeedLayout() {
  return (
    <UnreadCountProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </UnreadCountProvider>
  );
} 