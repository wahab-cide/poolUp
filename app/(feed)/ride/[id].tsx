import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function RideDetail() {
  const { id } = useLocalSearchParams();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl">Ride ID: {id}</Text>
    </View>
  );
} 