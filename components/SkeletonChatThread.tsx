import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Skeleton loading card for Chat tab
 * Shows while chat threads are being fetched
 */
export default function SkeletonChatThread() {
  const { isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const baseColor = isDark ? '#161616' : '#F0F0F0';
  const shimmerColor = isDark ? '#1F1F1F' : '#E0E0E0';

  const Skeleton = ({ width, height, style = {} }: { width: number | string; height: number; style?: any }) => (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: baseColor,
          borderRadius: 8,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[baseColor, shimmerColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 300 }}
        />
      </Animated.View>
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Avatar */}
        <Skeleton width={56} height={56} style={{ borderRadius: 28, marginRight: 16 }} />

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Skeleton width="50%" height={18} />
            <Skeleton width={60} height={14} />
          </View>
          <Skeleton width="85%" height={14} />
        </View>
      </View>
    </View>
  );
}
