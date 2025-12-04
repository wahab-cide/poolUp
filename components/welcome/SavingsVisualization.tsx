import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const SavingsVisualization = () => {
  const { isDark } = useTheme();
  const coinDropAnim = useRef(new Animated.Value(0)).current;
  const splitAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in and scale animation
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    // Coin dropping animation
    const coinAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(coinDropAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(coinDropAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    // Split cost animation
    const splitAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(splitAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(splitAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    entranceAnimation.start(() => {
      coinAnimation.start();
      splitAnimation.start();
    });

    return () => {
      coinAnimation.stop();
      splitAnimation.stop();
    };
  }, []);

  const coinTransform = coinDropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 100],
  });

  const splitTransform = splitAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -20, -40],
  });

  return (
    <Animated.View
      style={{
        width: width * 0.85,
        height: 280,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#059669', '#10B981', '#34D399']
            : ['#ECFDF5', '#D1FAE5', '#A7F3D0']
        }
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: 24,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Main Container */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        
        {/* Original Cost Display */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <View
            style={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ marginRight: 8 }}>
                {/* Dollar Sign */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#EF4444',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 2,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 1,
                    }}
                  />
                </View>
              </View>
              {/* Price Text Representation */}
              <View>
                <View
                  style={{
                    width: 40,
                    height: 8,
                    backgroundColor: isDark ? '#6B7280' : '#9CA3AF',
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                />
                <View
                  style={{
                    width: 60,
                    height: 6,
                    backgroundColor: isDark ? '#6B7280' : '#9CA3AF',
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          </View>
          
          {/* "Individual Cost" Label */}
          <View
            style={{
              backgroundColor: isDark ? '#374151' : '#F3F4F6',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <View
              style={{
                width: 60,
                height: 4,
                backgroundColor: isDark ? '#9CA3AF' : '#6B7280',
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* Split Arrow Animation */}
        <Animated.View
          style={{
            transform: [{ translateY: splitTransform }],
            marginBottom: 20,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            {/* Arrow pointing down */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderTopWidth: 12,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: isDark ? '#60A5FA' : '#3B82F6',
                marginBottom: 4,
              }}
            />
            {/* Split lines */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                  borderRadius: 1,
                  transform: [{ rotate: '20deg' }],
                  marginRight: 8,
                }}
              />
              <View
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                  borderRadius: 1,
                  transform: [{ rotate: '-20deg' }],
                  marginLeft: 8,
                }}
              />
            </View>
          </View>
        </Animated.View>

        {/* Split Cost Results */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
          {/* Person 1 */}
          <Animated.View
            style={{
              transform: [{ translateY: splitTransform }],
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#10B981',
                    marginRight: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 1.5,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 1,
                    }}
                  />
                </View>
                <View
                  style={{
                    width: 24,
                    height: 6,
                    backgroundColor: isDark ? '#6B7280' : '#9CA3AF',
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
            {/* Person icon */}
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
              }}
            />
          </Animated.View>

          {/* Person 2 */}
          <Animated.View
            style={{
              transform: [{ translateY: splitTransform }],
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#10B981',
                    marginRight: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 1.5,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 1,
                    }}
                  />
                </View>
                <View
                  style={{
                    width: 24,
                    height: 6,
                    backgroundColor: isDark ? '#6B7280' : '#9CA3AF',
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
            {/* Person icon */}
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isDark ? '#F59E0B' : '#F59E0B',
              }}
            />
          </Animated.View>
        </View>

        {/* Savings Badge */}
        <View
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            backgroundColor: '#10B981',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FFFFFF',
                marginRight: 4,
              }}
            />
            <View
              style={{
                width: 30,
                height: 4,
                backgroundColor: '#FFFFFF',
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* Floating Coins */}
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: 60 + index * 30,
              transform: [
                { translateY: coinTransform },
                { rotate: `${index * 45}deg` },
              ],
              opacity: coinDropAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.7, 0],
              }),
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#F59E0B',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

export default SavingsVisualization;