import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const SafetyBadges = () => {
  const { isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    const fadeInAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    });

    // Pulse animation for shields
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Slide animation for badges
    const slideAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation for checkmarks
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );

    fadeInAnimation.start(() => {
      pulseAnimation.start();
      slideAnimation.start();
      rotateAnimation.start();
    });

    return () => {
      pulseAnimation.stop();
      slideAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const slideTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const rotateTransform = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        width: width * 0.85,
        height: 280,
        opacity: fadeAnim,
      }}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#EA580C', '#F97316', '#FB923C']
            : ['#F3E8FF', '#E9D5FF', '#DDD6FE']
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
        
        {/* Central Shield */}
        <Animated.View
          style={{
            transform: [{ scale: pulseScale }],
            marginBottom: 30,
          }}
        >
          <View
            style={{
              width: 80,
              height: 90,
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Shield Icon */}
            <View
              style={{
                width: 50,
                height: 55,
                backgroundColor: '#10B981',
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {/* Checkmark */}
              <Animated.View
                style={{
                  transform: [{ rotate: rotateTransform }],
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {/* Checkmark lines */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 8,
                      height: 2,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 1,
                      transform: [{ rotate: '45deg' }, { translateX: -2 }],
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      width: 12,
                      height: 2,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 1,
                      transform: [{ rotate: '-45deg' }, { translateX: 2 }],
                    }}
                  />
                </View>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Verification Badges */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 }}>
          
          {/* Student ID Badge */}
          <Animated.View
            style={{
              transform: [{ translateY: slideTransform }],
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
                alignItems: 'center',
              }}
            >
              {/* ID Card Icon */}
              <View
                style={{
                  width: 24,
                  height: 16,
                  backgroundColor: isDark ? '#374151' : '#F3F4F6',
                  borderRadius: 3,
                  marginBottom: 4,
                  borderWidth: 1,
                  borderColor: isDark ? '#4B5563' : '#E5E7EB',
                }}
              >
                {/* ID lines */}
                <View style={{ padding: 2 }}>
                  <View
                    style={{
                      width: 8,
                      height: 2,
                      backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                      borderRadius: 1,
                      marginBottom: 1,
                    }}
                  />
                  <View
                    style={{
                      width: 12,
                      height: 1.5,
                      backgroundColor: isDark ? '#9CA3AF' : '#6B7280',
                      borderRadius: 1,
                      marginBottom: 1,
                    }}
                  />
                  <View
                    style={{
                      width: 10,
                      height: 1.5,
                      backgroundColor: isDark ? '#9CA3AF' : '#6B7280',
                      borderRadius: 1,
                    }}
                  />
                </View>
              </View>
              {/* Checkmark */}
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#10B981',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 3,
                    borderLeftWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderColor: '#FFFFFF',
                    transform: [{ rotate: '-45deg' }],
                    marginTop: -1,
                  }}
                />
              </View>
            </View>
          </Animated.View>

          {/* Profile Verification Badge */}
          <Animated.View
            style={{
              transform: [{ translateY: slideTransform }],
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
                alignItems: 'center',
              }}
            >
              {/* Profile Icon */}
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: isDark ? '#374151' : '#F3F4F6',
                  marginBottom: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: isDark ? '#60A5FA' : '#3B82F6',
                }}
              >
                {/* Profile dot */}
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
                  }}
                />
              </View>
              {/* Checkmark */}
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#10B981',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 3,
                    borderLeftWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderColor: '#FFFFFF',
                    transform: [{ rotate: '-45deg' }],
                    marginTop: -1,
                  }}
                />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Trust Network Visualization */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {/* Connected Users */}
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={{
                transform: [
                  { scale: pulseScale },
                  { rotate: `${index * 10}deg` },
                ],
                marginHorizontal: 4,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: index === 1 ? '#3B82F6' : '#10B981',
                  borderWidth: 2,
                  borderColor: isDark ? '#1F2937' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              />
              {/* Connection lines */}
              {index < 2 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 7,
                    left: 16,
                    width: 4,
                    height: 2,
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                    borderRadius: 1,
                  }}
                />
              )}
            </Animated.View>
          ))}
        </View>

        {/* Campus Network Label */}
        <View
          style={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 12,
            marginTop: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#10B981',
                marginRight: 6,
              }}
            />
            <View
              style={{
                width: 80,
                height: 4,
                backgroundColor: isDark ? '#9CA3AF' : '#6B7280',
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* Floating Security Elements */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 25,
            left: 25,
            transform: [{ scale: pulseScale }],
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#10B981',
              opacity: 0.7,
            }}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            top: 40,
            right: 30,
            transform: [{ scale: pulseScale }],
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#3B82F6',
              opacity: 0.6,
            }}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 30,
            left: 40,
            transform: [{ rotate: rotateTransform }],
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#F97316',
              opacity: 0.5,
            }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

export default SafetyBadges;