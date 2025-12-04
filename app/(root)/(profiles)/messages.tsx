import { Feather } from '@expo/vector-icons';
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const Messages = () => {
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  
  return (
    <SafeAreaView className={`flex-1 ${styles.background}`}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center mr-4"
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={28} color={isDark ? '#FFFFFF' : '#222'} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold flex-1 text-center mr-14" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
          Messages
        </Text>
      </View>
      {/* Empty State */}
      <View className="flex-1 items-center justify-center">
        <Feather name="inbox" size={56} color={isDark ? '#9CA3AF' : '#222'} style={{ marginBottom: 24 }} />
        <Text className="text-xl font-semibold mb-2" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>You don&apos;t have any messages</Text>
        <Text className="text-base mb-8 text-center" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>New messages will appear here.</Text>
      </View>
    </SafeAreaView>
  );
};

export default Messages; 