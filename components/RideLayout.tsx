import BottomSheet, {
    BottomSheetScrollView,
    BottomSheetView,
    BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Map from "@/components/Map";
import { icons } from "@/constants";
import { MapProps } from "@/types/type";
import { useTheme, useThemeStyles } from "@/contexts/ThemeContext";

const RideLayout = ({
  title,
  snapPoints,
  children,
  hasScrollableContent = false,
  initialIndex = 0,
  onBottomSheetRef,
  mapProps,
}: {
  title: string;
  snapPoints?: string[];
  children: React.ReactNode;
  hasScrollableContent?: boolean;
  initialIndex?: number;
  onBottomSheetRef?: (ref: React.RefObject<BottomSheet>) => void;
  mapProps?: MapProps;
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { isDark } = useTheme();
  const styles = useThemeStyles();
  
  // Pass the ref to parent component
  React.useEffect(() => {
    if (onBottomSheetRef) {
      onBottomSheetRef(bottomSheetRef);
    }
  }, [onBottomSheetRef]);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className={`flex-1 ${styles.background}`}>
        <View className="flex flex-col h-screen bg-blue-500">
          <View className="flex flex-row absolute z-10 top-16 items-center justify-start px-5">
            <TouchableOpacity onPress={() => router.back()}>
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ 
                backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? 'rgba(75, 85, 99, 0.5)' : 'transparent',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.5 : 0.25,
                shadowRadius: 4,
                elevation: 3
              }}>
                <Image
                  source={icons.backArrow}
                  resizeMode="contain"
                  className="w-6 h-6"
                  style={{ tintColor: isDark ? '#FFFFFF' : undefined }}
                />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-InterSemiBold ml-5" style={{ 
              color: isDark ? '#FFFFFF' : '#111827',
              textShadowColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'transparent',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: isDark ? 3 : 0
            }}>
              {title || "Go Back"}
            </Text>
          </View>

          {Platform.OS === 'web' ? (
            <View className="flex-1 bg-gray-200 items-center justify-center">
              <Text className="text-gray-500 text-center">
                Map is only available on mobile devices
              </Text>
            </View>
          ) : (
            <Map {...mapProps} />
          )}
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints || ["65%", "85%"]}
          index={initialIndex}
          backgroundStyle={{
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          }}
          handleIndicatorStyle={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#D1D5DB',
          }}
          enablePanDownToClose={false}
          enableContentPanningGesture={hasScrollableContent}
        >
          {hasScrollableContent ? (
            <BottomSheetView
              style={{
                flex: 1,
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
              }}
            >
              {children}
            </BottomSheetView>
          ) : (
            <BottomSheetScrollView
              style={{
                flex: 1,
                padding: 16,
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
              }}
            >
              {children}
            </BottomSheetScrollView>
          )}
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default RideLayout;